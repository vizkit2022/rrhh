<script setup>
import { ref, computed } from "vue";
import { toast } from "vue3-toastify";
import useWizardStore from "@/stores/wizard";
import useGlobalStore from "@/stores/global";
import useOrganizationStore from "@/stores/organization";
import { onlyNumbersAndLetters } from "@/utils/helpers";

// STORES
const wizardStore = useWizardStore();
const globalStore = useGlobalStore();
const organizationStore = useOrganizationStore();

const { t } = useI18n();
const module = "modules.wizard.steps.organization";
const button = "modules.wizard.buttons";

const inputs = ref([
  {
    prop: "razon_social",
    label: t(module + ".inputs.name.label"),
    placeholder: t(module + ".inputs.name.placeholder"),
    error: false,
    max: 50,
    min: 1,
    msgError: t(module + ".inputs.name.error"),
    loading: false,
  },
  {
    prop: "name",
    label: t(module + ".inputs.alias.label"),
    placeholder: t(module + ".inputs.alias.placeholder"),
    error: false,
    max: 20,
    min: 1,
    msgError: t(module + ".inputs.alias.error"),
    loading: false,
  },
  {
    prop: "giro",
    label: t(module + ".inputs.giro.label"),
    placeholder: t(module + ".inputs.giro.placeholder"),
    error: false,
    max: 80,
    min: 1,
    msgError: t(module + ".inputs.giro.error"),
    loading: false,
  },
  {
    prop: "idNumber",
    label: t(module + ".inputs.idNumber.label"),
    placeholder: t(module + ".inputs.idNumber.placeholder"),
    error: false,
    max: 20,
    min: 9,
    msgError: t(module + ".inputs.idNumber.error"),
    loading: false,
  },
]);

// Computed
const hasAllData = computed(() => {
  return (
    !!wizardStore.organization.razon_social.trim() &&
    !!wizardStore.organization.name.trim() &&
    !!wizardStore.organization.giro.trim() &&
    !!wizardStore.organization.idNumber.trim() &&
    validInputLimits() &&
    !inputs.value[3].error
  );
});

// Acciones
const handleFileCompany = (e) => {
  if (!e.target.files || !e.target.files[0]) {
    return;
  }

  const file = e.target.files[0];
  const formData = new FormData();
  formData.append("file", file);

  if (file.size) {
    const fileSizeKB = file.size / 1024;
    const fileSizeMB = fileSizeKB / 1024;

    if (fileSizeMB >= 5) {
      toast.error(t(module + ".inputs.logo.error"), {
        autoClose: 2000,
      });
    } else {
      const reader = new FileReader();
      reader.onload = function (e) {
        wizardStore.organization.imgUrl = e.target.result;
        wizardStore.organization.formData = formData;
      };
      reader.readAsDataURL(file);
    }
  } else {
    console.warn("File size information unavailable.");
  }
};

const validInputLimits = () => {
  if (wizardStore.organization.razon_social.length > 80) return false;
  if (wizardStore.organization.name.length > 20) return false;
  if (wizardStore.organization.giro.length > 80) return false;
  if (
    wizardStore.organization.idNumber.length > 20 &&
    wizardStore.organization.idNumber.length <= 9
  )
    return false;
  return true;
};

const nextStep = () => {
  wizardStore.step = 9;
  wizardStore.oldStep = 8;
};

const backStep = () => {
  wizardStore.step = 7;
  wizardStore.oldStep = 6;
};

const checkInput = async (prop, value, input) => {
  if (["razon_social", "name", "giro"].includes(prop)) {
    input.error = value.length > input.max || value.length < input.min;
  } else if (prop === "idNumber") {
    if (value.length > input.max || value.length < input.min) {
      input.error = true;
      input.msgError = t(module + ".inputs.idNumber.error");
    } else {
      input.loading = true;
      const resp = await organizationStore.validateIdNumber(value);
      if (resp) {
        input.error = true;
        input.msgError = t(module + ".inputs.idNumber.error");
      } else {
        input.error = false;
        input.msgError = "";
      }
      input.loading = false;
    }
  }
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
          <div class="containerCompany">
            <div class="company">
              <img
                v-if="wizardStore.organization.imgUrl"
                :src="wizardStore.organization.imgUrl"
                alt="Logo company"
              />
              <span v-else class="body-xl-xb">{{
                t(module + ".inputs.logo.placeholder")
              }}</span>
            </div>
            <input
              type="file"
              name="imgCompany"
              id="imgCompany"
              @change="handleFileCompany($event)"
              accept="image/*"
              style="display: none"
            />
            <label
              :class="`btnImg ${
                wizardStore.organization.imgUrl === '' ? 'btnImgAnimation' : ''
              } `"
              for="imgCompany"
            >
              <span class="u u-image"></span
              ><span>{{ t(module + ".inputs.logo.label") }}</span>
            </label>
          </div>
          <h2 class="title headline-m-sb">{{ t(module + ".title") }}</h2>
          <p class="subtitle body-l-r">{{ t(module + ".text") }}</p>
          <div class="form">
            <div class="groupInput" v-for="input in inputs" :key="input.prop">
              <label
                >{{ input.label }}
                <span v-if="input.error">{{ input.msgError }}</span></label
              >
              <u-input
                v-model="wizardStore.organization[input.prop]"
                :placeholder="input.placeholder"
                :error="input.error"
                @input="
                  checkInput(
                    input.prop,
                    wizardStore.organization[input.prop],
                    input
                  ),
                    (wizardStore.organization[input.prop] = [
                      'razon_social',
                      'name',
                      'giro',
                    ].includes(input.prop)
                      ? wizardStore.organization[input.prop]
                      : onlyNumbersAndLetters($event.target.value))
                "
              />
              <div
                class="load"
                v-if="input.prop === 'idNumber' && input.loading"
              >
                <u-loading :width="14" color="--bg-neutral-400" />
                <span class="load__text">{{
                  t(module + ".inputs.idNumber.verifying")
                }}</span>
              </div>
            </div>
          </div>
          <span class="msgAlert">{{ t(module + ".msgAlert") }}</span>
        </div>
      </div>
      <div class="actions">
        <u-button
          size="xl"
          :text="t(button + '.back')"
          type="text"
          @action-btn="backStep"
        ></u-button>
        <u-button
          size="xl"
          :text="t(button + '.next')"
          :disabled="!hasAllData"
          @action-btn="nextStep"
          style="width: 200px"
        ></u-button>
      </div>
    </div>
    <div class="containerPage__img">
      <div class="cardSample">
        <div class="cardImg">
          <img
            :src="`/img/company info${globalStore.isDark ? '-dark' : ''}.svg`"
            alt="Vector snippet company"
          />
        </div>
        <div class="cardText">
          <span>{{ t(module + ".text2") }}</span>
          <span class="truncateText">{{
            wizardStore.organization.razon_social || "-"
          }}</span>
          <span class="truncateText">{{
            wizardStore.organization.name || "-"
          }}</span>
          <span class="truncateText">{{
            wizardStore.organization.giro || "-"
          }}</span>
          <span class="truncateText">{{
            wizardStore.organization.idNumber || "-"
          }}</span>
        </div>
      </div>
      <div class="vector">
        <img
          :src="`/img/organizacion${globalStore.isDark ? '-dark' : ''}.svg`"
          alt="Vector company"
        />
      </div>
    </div>
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
  padding: 36px;
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
  gap: 12px;
  width: 420px;
  flex-shrink: 1;
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
  text-align: center;
  color: var(--neutral-text-body);
  margin: 10px 0 5px;
}
.subtitle {
  text-align: left;
  color: var(--neutral-text-caption);
  line-height: 20px !important;
}
.containerCompany {
  width: 100%;
  display: flex;
  justify-content: center;
  position: relative;
}
.company {
  width: 110px;
  height: 110px;
  border-radius: 24px;
  background-color: var(--neutral-surface-shadow-8a);
  display: flex;
  justify-content: center;
  align-items: center;
  overflow: hidden;
}
.company span {
  color: var(--neutral-text-caption);
  text-transform: uppercase;
}
.company img {
  height: 100px;
  width: auto;
}
.btnImg {
  position: absolute;
  background-color: var(--bg-secondary-200);
  padding: 5px 15px;
  border-radius: 40px;
  bottom: 0px;
  left: calc(50% + 25px);
  display: flex;
  align-items: center;
  gap: 8px;
  transition: 0.3s;
  cursor: pointer;
}
.btnImgAnimation {
  animation: pulse 2s infinite;
}
.btnImg:hover {
  background-color: var(--bg-secondary-300);
  box-shadow: var(--shadow-2);
}
.btnImg:hover span {
  color: var(--bg-secondary-700);
}
.btnImg span {
  transition: 0.3s;
  color: var(--bg-secondary-500);
}
.btnImg span:nth-child(1) {
  font-size: 20px;
  line-height: 20px;
}
.btnImg span:nth-child(2) {
  font-size: 14px;
  line-height: 14px;
  font-weight: 600;
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
.groupInput label span {
  color: var(--bg-danger-500);
  margin-left: 5px;
}
.form {
  display: flex;
  width: 100%;
  flex-direction: column;
  gap: 12px;
  height: auto;
  overflow-y: auto;
  padding: 0px 4px 3px 0;
  margin: 15px 0 5px;
}
.form::-webkit-scrollbar {
  width: 5px;
}

.form::-webkit-scrollbar-thumb {
  background: var(--bg-neutral-300);
  border-radius: 8px;
}
.actions {
  width: 100%;
  display: flex;
  justify-content: space-between;
}
.containerPage__img {
  width: auto;
  max-width: 684px;
  height: 60vh;
  max-height: 540px;
  position: relative;
  display: flex;
  align-items: flex-end;
}
.cardSample {
  position: absolute;
  top: 0px;
  z-index: 2;
  display: grid;
  grid-template-columns: 120px 1fr;
  width: 460px;
  height: 120px;
  background-color: var(--neutral-background-default);
  border-radius: 20px;
  overflow: hidden;
  box-shadow: var(--elevation-xl);
  transform: scale(0.9);
  margin-left: -18px;
}
.cardImg {
  overflow: hidden;
}
.cardImg img {
  width: 120px;
  height: 120px;
}
.cardText {
  padding: 10px 20px;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 5px;
}
.cardText span {
  width: 300px;
  color: var(--neutral-text-body);
}
.cardText span:nth-child(1) {
  font-size: 10px;
  font-weight: 600;
  line-height: 14px;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--neutral-text-caption);
}
.cardText span:nth-child(2) {
  font-size: 16px;
  font-weight: 800;
  line-height: 20px;
  letter-spacing: 0.1em;
}
.cardText span:nth-child(3),
.cardText span:nth-child(4),
.cardText span:nth-child(5) {
  font-size: 12px;
  font-weight: 600;
  line-height: 12px;
  letter-spacing: 0.1em;
}
.vector,
.vector img {
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
.msgAlert {
  font-size: 12px;
  color: var(--neutral-text-caption);
  text-align: center;
  text-align: right;
  margin-top: 8px;
}
@keyframes pulse {
  0% {
    box-shadow: 0 0 0 0 rgb(76, 75, 224, 0.3);
  }
  70% {
    box-shadow: 0 0 0 10px rgb(76, 75, 224, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgb(76, 75, 224, 0);
  }
}

@media only screen and (max-width: 1886px) {
  .containerPage__img,
  .vector,
  .vector img {
    max-width: 500px;
  }
  .subtitle, .logo { display: none !important; } 
  .containerPage__card {
    gap: 20px;
  }
}

@media only screen and (max-width: 1090px) {
  .containerPage__img,
  .vector,
  .vector img {
    max-width: 400px;
  }
}

@media only screen and (max-width: 1035px) {
  .containerPage__img {
    display: none;
  }
}

</style>
