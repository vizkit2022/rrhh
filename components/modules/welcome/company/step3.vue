<script setup>
import { ref, computed } from "vue";

import useWizardStore from "@/stores/wizard";
import useGlobalStore from "@/stores/global";

// Stores
const wizardStore = useWizardStore();
const globalStore = useGlobalStore();

const { t } = useI18n();
const module = "modules.wizard.steps.contact";
const button = "modules.wizard.buttons";

import { regexEmail, onlyNumbers, validateSimpleURL } from "@/utils/helpers";

// Variables
const inputs = ref([
  {
    prop: "email",
    label: t(module + ".inputs.email.label"),
    placeholder: t(module + ".inputs.email.placeholder"),
    error: false,
    msgError: "",
    loading: false,
  },
  {
    prop: "phone",
    label: t(module + ".inputs.phone.label"),
    placeholder: t(module + ".inputs.phone.placeholder"),
    error: false,
    msgError: "",
  },
  {
    prop: "webSite",
    label: t(module + ".inputs.web.label"),
    placeholder: t(module + ".inputs.web.placeholder"),
    error: false,
    msgError: "",
  },
]);

const validForm = () => {
  // Email
  if (inputs.value[0].error) {
    return false;
  } else {
    inputs.value[0].error = false;
    inputs.value[0].msgError = "";
  }

  // Phone
  if (inputs.value[1].error) {
    return false;
  } else {
    inputs.value[1].error = false;
    inputs.value[1].msgError = "";
  }

  // webSite
  if (inputs.value[2].error) {
    return false;
  } else {
    inputs.value[2].error = false;
    inputs.value[2].msgError = "";
  }

  return true;
};

const checkEmail = async (email, input) => {
  if (email === "") {
    input.msgError = t(module + ".inputs.email.error");
    input.error = true;
  } else if (!regexEmail(email)) {
    input.msgError = t(module + ".inputs.email.error2");
    input.error = true;
  } else {
    input.msgError = "";
    input.error = false;
  }
};

const checkwebSite = async (webSite, input) => {
  if (webSite !== "") {
    input.error = !validateSimpleURL(webSite);
    input.msgError = !validateSimpleURL(webSite)
      ? t(module + ".inputs.web.error")
      : "";
  } else {
    input.error = false;
    input.msgError = "";
  }
};

const checkInput = async (prop, value, input) => {
  const props = {
    email: async () => await checkEmail(value, input),
    webSite: async () => await checkwebSite(value, input),
  };
  await props[prop]();
};

// Computed
const hasAllData = computed(() => {
  // Campo email vacio
  if (wizardStore.organization.contact.email === "") {
    return false;
  } else {
    // Email sin formato correcto
    if (inputs.value[0].error) {
      return false;
    } else if (wizardStore.organization.contact.phone === "") {
      return false;
    } else if (inputs.value[1].error) {
      return false;
    } else if (
      wizardStore.organization.webSite !== "" &&
      inputs.value[2].error
    ) {
      return false;
    } else {
      return true;
    }
  }
});

// Acciones
const nextStep = () => {
  if (validForm()) {
    wizardStore.step = 10;
    wizardStore.oldStep = 9;
  }
};
const backStep = () => {
  wizardStore.step = 8;
  wizardStore.oldStep = 7;
};
const errorInput = (input, msg) => {
  input.msgError = msg;
  input.error = msg !== "";
};
</script>

<template>
  <div class="containerPage">
    <div class="containerPage__card">
      <div class="sup">
        <div class="logo">
          <u-logo class="img" />
          <u-logo-text class="text" />
        </div>
        <div class="content">
          <h2 class="title headline-m-sb">{{ t(module + ".title") }}</h2>
          <p class="subtitle body-l-r">{{ t(module + ".text") }}</p>
          <div class="form">
            <div class="groupInput" v-for="input in inputs" :key="input.prop">
              <label>
                {{ input.label }}
                <span v-if="input.error" class="msg">{{ input.msgError }}</span>
              </label>
              <u-input-phone v-if="input.prop === 'phone'" v-model="wizardStore.organization.contact.phone"
                :required="true" :error="input.error"
                :selectedCountryCode="wizardStore.organization.address.country.short_name"
                :selectedPlaceId="wizardStore.organization.address.country.place_id"
                @msgError="(e) => errorInput(input, e)" />
              <template v-else>
                <u-input v-model="wizardStore.organization.contact[input.prop]" :placeholder="input.placeholder"
                  :error="input.error" @input="
                    checkInput(
                      input.prop,
                      wizardStore.organization.contact[input.prop],
                      input
                    ),
                    (wizardStore.organization.contact[input.prop] =
                      input.prop === 'phone'
                        ? onlyNumbers(
                          wizardStore.organization.contact[input.prop]
                        )
                        : wizardStore.organization.contact[
                          input.prop
                        ].replaceAll(' ', ''))
                    " />
              </template>
              <div class="load" v-if="input.prop === 'email' && input.loading">
                <u-loading :width="14" color="--bg-neutral-400" />
                <span class="load__text">{{ t(module + ".inputs.email.verifying") }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div class="actions">
        <u-button size="xl" :text="t(button + '.back')" @action-btn="backStep" type="text"></u-button>
        <u-button size="xl" :text="t(button + '.next')" @action-btn="nextStep" :disabled="!hasAllData"
          style="width: 200px"></u-button>
      </div>
    </div>
    <img class="containerPage__img" :src="`/img/contacto${globalStore.isDark ? '-dark' : ''}.svg`"
      alt="Vector settings" />
  </div>
</template>

<style scoped>
span,
label,
p,
h2,
button {
  font-family: Nunito;
}

.containerPage {
  display: flex;
  gap: 48px;
  justify-content: center;
  align-items: center;
  animation: section 0.8s ease-in;
}

@keyframes section {

  0%,
  5% {
    opacity: 0;
  }

  100% {
    opacity: 1;
  }
}

.containerPage__card {
  width: 500px;
  height: 85vh;
  max-height: 780px;
  min-height: 690px;

  padding: 48px 36px;
  box-sizing: border-box;
  border-radius: 24px;
  gap: 48px;
  background-color: var(--neutral-background-default);
  box-shadow: var(--elevation-xl);
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-direction: column;
}

.msg {
  color: var(--bg-danger-500);
  margin-left: 5px;
}

.sup {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  gap: 20px;
}

.logo {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 5px;
  margin-bottom: 5px;
}

.logo .img {
  height: 28px;
  width: 28px;
}

.logo .text {
  height: 24px;
  width: 124px;
}

.title {
  color: var(--neutral-text-body);
  text-align: center;
  margin: 10px 0 5px;
}

.subtitle {
  color: var(--neutral-text-caption);
  text-align: center;
}

.groupInput {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.groupInput label {
  font-size: 12px;
  font-weight: 600;
  line-height: 16px;
  text-align: left;
  color: var(--neutral-text-body);
}

.form {
  display: flex;
  width: 100%;
  flex-direction: column;
  gap: 20px;
  height: auto;
  padding: 0px 4px 3px 0;
  margin: 15px 0 5px;
}

.actions {
  width: 100%;
  display: flex;
  justify-content: space-between;
}

.containerPage__img {
  width: auto;
  max-width: 600px;
  height: 60vh;
  max-height: 540px;
}

.load {
  display: flex;
  gap: 5px;
}

.load__text {
  font-size: 12px;
  line-height: 12px;
}

@media only screen and (max-width: 1886px) {
  .containerPage__img {
    max-width: 500px;
  }
}

@media only screen and (max-width: 1090px) {
  .containerPage__img {
    max-width: 400px;
  }
}

@media only screen and (max-width: 985px) {
  .containerPage__img {
    display: none;
  }
}
</style>
