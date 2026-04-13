<script setup>
import useAuthStore from "@/stores/auth";
const authStore = useAuthStore();

import {
  regexEmail,
  checkValidPassword,
  searchLocationByGoogleMaps,
  testGoogleMapsPlaces, }
from "@/utils/helpers";
import { toast } from "vue3-toastify";

const { t } = useI18n();
const module = "modules.login.pages.register";
const moduleLink = "modules.login.links";
const moduleButton = "modules.login.buttons";
const googleMapsAvailable = ref(true);

const name = ref("");
const lastname = ref("");
const email = ref("");
const country = ref({
  name: "",
  short_name: "",
  place_id: "",
  results: [],
  loading: false,
  error: false
});
const password = ref("");

//error msg
const messageEmail = ref("");
const stateError = ref(false);
const showMessageEmail = ref(false);
const showMessagePassword = ref(false);

const validEmail = (email) => {
  if (!regexEmail(email)) {
    messageEmail.value = "Formato de correo no válido.";
    return false;
  }
  messageEmail.value = "";
  return true;
};

const handleSubmit = async (e) => {
  e.preventDefault();
  if (!validEmail(email.value)) {
    stateError.value = true;
    showMessageEmail.value = true;
  } else if (country.value.place_id === "") {
    country.value.error = true;
  } else if (!checkValidPassword(password.value)) {
    stateError.value = true;
    showMessagePassword.value = true;
    showMessageEmail.value = false;
  } else {
    authStore.loading = true;
    const resp = await authStore.register({
      email: email.value,
      password: password.value,
      name: name.value + " " + lastname.value,
      country: {
        name: country.value.name,
        short_name: country.value.short_name,
        place_id: country.value.place_id
      }
    });

    if(!resp.success) {
      const { status } = resp
      if(status === 400) {
        toast.warning(t(module + '.alerts.400'), { autoClose: 3000 });
      } else if(status === 428) {
        toast.warning(t(module + '.alerts.428'), { autoClose: 3000 });
        authStore.userNoLoginTemp = {
          email: email.value.trim(),
          status
        }
        // Redirigir a enviar codigo de verificacion para cambiar contraseña
        setTimeout(() => {
          navigateTo("/login/forgot")
        }, 3000)
      } else {
        toast.warning(t(module + '.alerts.409'), { autoClose: 3000 });
      }
    } else {
      showMessagePassword.value = false;
      showMessageEmail.value = false;
    }
    authStore.loading = false;
  }
};

const toggleIcon = ref(false);
const passwordType = ref("password");

const seePass = () => {
  passwordType.value = passwordType.value === "password" ? "text" : "password";
  toggleIcon.value = passwordType.value === "text";
};

// Mounted
onMounted(async () => {
  googleMapsAvailable.value = await testGoogleMapsPlaces();

  // En caso google Maps no este disponible, los países se pre cargan
  if (!googleMapsAvailable.value) {
    const countries = await globalStore.getCountries();
    country.value.results = countries.map((country) => ({
      label: country.name[globalStore.lang],
      place_id: country.place_id || "",
      fullData: country,
    }));
  }
});

// Country
const searchCountry = debounce(async () => {
  const toSearch = country.value.name.trim();

  country.value.short_name= "";
  country.value.place_id = "";
  country.value.results = [];
  country.value.loading = false;
  country.value.error = false;

  if (toSearch === "") {
    country.value.results = [];
  } else {
    try {
      country.value.loading = true;
      // SI Funciona GoogleMaps
      if (googleMapsAvailable.value) {
        const config = {
          str: toSearch,
          type: "country",
        };
        country.value.results = await searchLocationByGoogleMaps(config);
      } else {
        country.value.results = country.value.results.filter(
          (country) =>
            country.label
              ?.toLocaleLowerCase()
              .includes(toSearch.toLocaleLowerCase())
        );
      }
    } catch (error) {
      country.value.results = [];
      console.error(error);
    } finally {
      country.value.loading = false;
    }
  }
}, 10);


const cleanCountry = () => {
  country.value = {
    name: "",
    short_name: "",
    place_id: "",
    results: [],
    loading: false,
    error: false
  };
};

const selectedCountry = (option) => {
  country.value = {
    name: option.label,
    short_name: option.countryCode,
    place_id: option.place_id,
    results: [],
    loading: false,
    error: false
  };
}

</script>

<template>
  <form @submit.prevent="handleSubmit" class="container">
    <div class="container__group">
      <label for="email"
        ><b>{{ t(module + ".inputs.labels.email") }}</b></label
      >
      <input
        v-model="email"
        type="text"
        class="input"
        placeholder="example@unabase.com"
        name="email"
        id="email"
        required
        :disabled="authStore.loading"
        @keydown.enter="handleSubmit"
      />
    </div>
    <div class="container__doubleGroup">
      <div class="optionName">
        <label for="name"
          ><b>{{ t(module + ".inputs.labels.name") }}</b></label
        >
        <input
          v-model="name"
          type="text"
          class="input"
          :placeholder="t(module + '.inputs.placeholders.name')"
          name="name"
          id="name"
          required
          :disabled="authStore.loading"
          @keydown.enter="handleSubmit"
        />
      </div>
      <div class="optionName">
        <label for="lastname"
          ><b>{{ t(module + ".inputs.labels.lastName") }}</b></label
        >
        <input
          v-model="lastname"
          type="text"
          class="input"
          :placeholder="t(module + '.inputs.placeholders.lastName')"
          name="lastname"
          id="lastname"
          required
          :disabled="authStore.loading"
          @keydown.enter="handleSubmit"
        />
      </div>
    </div>
    <div class="container__group-search">
      <label for="email"
        ><b>{{ t(module + ".inputs.labels.country") }}</b></label
      >
      <u-search
        v-model="country.name"
        autocomplete="off"
        type="text"
        class="input"
        :placeholder="t(module + '.inputs.placeholders.country')"
        name="country"
        id="country"
        required
        :options="country.results"
        :disabled="authStore.loading"
        @keydown.enter="handleSubmit"
        :loading="country.loading"
        size="l"
        :error="country.error"
        @input="searchCountry"
        @cleanInput="cleanCountry"
        @selectedOption="selectedCountry"
      />
    </div>
    <div class="container__group password">
      <label for="name"
        ><b>{{ t(module + ".inputs.labels.password") }}</b>
      </label>
      <input
        v-model="password"
        :type="passwordType"
        class="input"
        :placeholder="t(module + '.inputs.placeholders.password')"
        name="password"
        id="password"
        required
        :disabled="authStore.loading"
        @keydown.enter="handleSubmit"
      />
      <u-button-icon
        class="iconEye"
        type="text"
        color="--bg-neutral-500"
        :icon="!toggleIcon ? 'no-show' : 'show'"
        @click.prevent="seePass()"
        :disabled="authStore.loading"
      />
      <span class="msgPassword">{{ t(module + ".msgPassword") }}</span>
    </div>
    <span v-if="showMessageEmail" class="messageError">
      {{ t(module + ".warnings.email") }}
    </span>
    <span v-if="showMessagePassword" class="messageError">
      {{ t(module + ".warnings.password") }}
    </span>
    <div class="container__termAndCond">
      <div class="container__group">
        <p class="tyc text">
          {{ t(module + ".policy1") }}
          <span class="mainText"> {{ t(moduleLink + ".policy") }}</span>
          {{ t(module + ".policy2") }}
          <span class="mainText"> {{ t(moduleLink + ".conditions") }}</span>
          {{ t(module + ".policy3") }}
        </p>
      </div>
      <div class="container__group">
        <div class="tyc text">
          {{ t(module + ".questionText") }}
          <NuxtLink
            to="/login"
            class="mainText link"
            :disabled="authStore.loading"
            ><span>{{ t(moduleLink + ".loginHere") }}</span></NuxtLink
          >
        </div>
      </div>
    </div>
    <button class="signInBtn" :disabled="authStore.loading" type="submit">
      <u-loading v-if="authStore.loading" color="--white" :width="24" />
      <span>{{
        authStore.loading
          ? t(moduleButton + ".createAccount.loading")
          : t(moduleButton + ".createAccount.label")
      }}</span>
    </button>
  </form>
</template>

<style scoped>
input {
  font-family: Nunito;
}
input:disabled {
  color: var(--neutral-border-disabled) !important;
}
.container {
  display: grid;
  gap: 24px;
}
.container__group,
.container__group-search {
  display: flex;
  flex-direction: column;
  gap: 12px;
  position: relative;
  width: 100%;
}

.container__group-search::v-deep(input) {
  font-size: 14px !important;
  color: var(--neutral-text-caption) !important;
}
.container__group-search::v-deep(input::placeholder) {
  font-size: 14px;
}

.containerChild {
  display: flex;
  align-items: center;
  justify-content: flex-start;
}

.container__doubleGroup {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  width: 100%;
}

.optionName {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 10px;
}

.container__termAndCond {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

/********TEXT**********/
label {
  color: var(--neutral-text-caption);
  font-size: 12px;
  font-weight: 600;
  line-height: 16px; /* 133.333% */
}

.msgPassword {
  font-size: 12px;
  color: var(--neutral-text-caption);
  font-weight: 600;
}

.accept {
  color: var(--bg-neutral-500);
  font-size: 14px;
  font-weight: 400;
  margin-left: 8px;
  line-height: 16px;
}

.tyc {
  text-align: justify;
  font-family: Nunito;
  font-size: 14px;
  font-style: normal;
  font-weight: 600;
  line-height: 18px;
}

.text {
  color: var(--neutral-text-caption);
}
.mainText {
  color: var(--primary-500, #20a789);
}

.ml-auto {
  margin-left: auto;
}
.crear {
  color: var(--bg-neutral-600);
  font-family: Nunito;
  font-size: 14px;
  font-style: normal;
  font-weight: 600;
  line-height: 16px;
}
.container__doubleGroup .input,
.container__group .input {
  display: flex;
  align-items: center;
  align-self: stretch;
  height: 40px;
  padding: 0px 24px;
  gap: 10px;
  border-radius: 16px;
  border: 1px solid var(--neutral-border-default);
  background: var(--neutral-background-default);
  color: var(--neutral-text-caption);
  font-family: Nunito;
  font-size: 14px;
  line-height: 16px;
  font-weight: 400;
  width: 100%;
}

.container__group.password input {
  padding: 0 48px 0 24px;
}

.input::placeholder {
  color: var(--neutral-border-default);
  font-weight: 400;
  line-height: 24px;
}

.btn {
  width: 100%;
}

.btn span {
  font-size: 16px;
  font-weight: 400;
}

.messageError {
  color: var(--bg-danger-500);
  font-size: 12px;
  font-weight: 400;
  margin-left: 8px;
  line-height: 14px;
  text-align: justify;
}

.link span {
  color: var(--bg-primary-500);
  font-weight: 600;
  transition: 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}
.link span:hover {
  color: var(--bg-secondary-500);
}

.signInBtn {
  background-color: var(--bg-primary-500);
  height: 40px;
  padding: 0 24px;
  border-radius: 16px;
  width: 100%;
  transition: 0.3s cubic-bezier(0.165, 0.84, 0.44, 1);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
}
.signInBtn span {
  font-size: 18px;
  line-height: 18px;
  color: var(--white);
  font-weight: 600;
  font-family: Nunito;
}

.signInBtn:not(:disabled):hover {
  background-color: var(--bg-primary-400);
}
.signInBtn:disabled {
  background-color: var(--bg-neutral-400);
}
.iconEye {
  position: absolute;
  top: 30px;
  right: 16px;
  width: 20px;
}

@media only screen and (max-width: 600px) {
  .container {
    gap: 40px;
  }
}
</style>
