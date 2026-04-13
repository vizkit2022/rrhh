<script setup>
  import { onMounted } from "vue";
  import { toast } from "vue3-toastify";

  import useAuthStore from "@/stores/auth";
  import { regexEmail } from "@/utils/helpers";
  const authStore = useAuthStore();
  const { t } = useI18n();
  const module = "modules.login";
  //user constant
  const email = ref("");
  const password = ref("");
  const keep = ref(false);
  //error msg
  const messageEmail = ref("");
  const stateError = ref(false);
  const showMessageEmail = ref(false);
  const toggleIcon = ref(false);
  const passwordType = ref("password");

  onMounted(() => {
    authStore.loading = false;
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validEmail(email.value)) {
      stateError.value = true;
      showMessageEmail.value = true;
    } else if(password.value.trim() !== "") {
      stateError.value = false;
      try {
        authStore.loading = true;
        await authStore.authenticateUser({
          email: email.value,
          password: password.value,
        });
      } catch (err) {
        authStore.loading = false;
        toast.error(err.error, { autoClose: 2000 });
      }
    }
  };

  watch(email, () => {
    if (stateError === true) {
      showMessageEmail.value = true;
    } else {
      showMessageEmail.value = false;
    }
  });

  const validEmail = (email) => {
    if (!regexEmail(email)) {
      messageEmail.value = " Formato de correo no válido.";
      return false;
    }
    messageEmail.value = "";
    return true;
  };

  const seePass = () => {
    passwordType.value =
      passwordType.value === "password" ? "text" : "password";
    toggleIcon.value = passwordType.value === "text";
  };
</script>

<template>
  <form @submit.prevent="handleSubmit">
    <div class="options">
      <label for="email"
        ><b>{{ t(module + ".inputs.email.label") }}</b>
        <span class="messageError" v-if="showMessageEmail">
          {{ messageEmail }}</span
        ></label
      >
      <u-input
        v-model="email"
        size="l"
        type="text"
        class="input"
        placeholder="example@unabase.com"
        name="email"
        id="email"
        required
        autocomplete="off"
        @keypress.enter.prevent="handleSubmit"
      />
    </div>
    <div class="options">
      <label for="password"><b>{{ t(module + ".inputs.password.label") }}</b></label>
      <div class="inputPassword">
        <u-input
          v-model="password"
          size="l"
          :type="passwordType"
          class="password"
          :placeholder="t(module + '.inputs.password.placeholder')"
          name="password"
          id="password"
          :revers="true"
          required
          icon="true"
          autocomplete="off"
          @keypress.enter.prevent="handleSubmit"
        />
        <u-button-icon
          class="iconEye"
          type="text"
          color="--neutral-text-caption"
          :icon="!toggleIcon ? 'no-show' : 'show'"
          @click.prevent="seePass()"
        />
      </div>
    </div>
    <div class="options">
      <div class="optionsChild">
        <div class="containerCheckbox">
          <u-checkbox id="keep" v-model="keep" name="keep" :height="18" />
          <label for="keep" class="label">{{ t(module + ".checkboxes.stayLogged") }}</label>
        </div>
        <NuxtLink to="/login/forgot"
          ><span class="forgot">{{ t(module + ".links.forgot") }}</span></NuxtLink
        >
      </div>
    </div>
    <div class="options signIn">
      <button class="signInBtn" :disabled="authStore.loading">
        <u-loading v-if="authStore.loading" color="--white" :width="24" />
        <span>{{
          authStore.loading ? t(module + ".buttons.loggin.loading") : t(module + ".buttons.loggin.label")
        }}</span>
      </button>
    </div>
  </form>
</template>

<style scoped>
  form {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    padding: 0;
    gap: 28px;
  }

  .containerCheckbox {
    display: flex;
    justify-content: center;
    align-items: center;
  }

  .options {
    display: flex;
    flex-direction: column;
    align-self: stretch;
    gap: 8px;
  }
  .optionsChild {
    display: flex;
    justify-content: space-between;
    align-items: center;
    align-self: stretch;
  }

  .options input {
    display: flex;
    align-items: center;
    gap: 8px;
    align-self: stretch;
    border-radius: 16px;
    border: 1px solid var(--neutral-border-default);
    background: var(--white);
  }
  .signInBtn {
    background-color: var(--primary-surface-default);
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
    background-color: var(--neutral-surface-subtle);
  }
  .signInBtn:disabled {
    background-color: var(--neutral-surface-subtle);
  }
  .containerCheckbox input {
    border: 1px solid var(--primary-border-default);
  }
  .containerCheckbox input:checked {
    background-color: var(--neutral-surface-default);
    border: 1px solid var(--primary-border-default);
  }

  label {
    color: var(--neutral-text-body);
    font-family: Nunito;
    font-size: 12px;
    font-style: normal;
    font-weight: 600;
    line-height: 16px;
  }

  .forgot {
    color: var(--primary-text-default);
    font-family: Nunito;
    font-size: 14px;
    font-style: normal;
    text-align: right;
    font-weight: 600;
    line-height: 16px;
    transition: 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  }
  .forgot:hover {
    color: var(--secondary-text-default);
  }

  .label {
    color: var(--neutral-text-caption);
    font-family: Nunito;
    font-size: 14px;
    margin-left: 5px;
    font-style: normal;
    font-weight: 400;
    line-height: 16px;
  }

  .messageError {
    color: var(--danger-text-default);
  }
  .inputPassword {
    position: relative;
  }
  .iconEye {
    position: absolute;
    bottom: 2px;
    left: 315px;
  }

  @media only screen and (max-width: 520px) {
    .signIn {
      margin: 20px 0 10px;
    }
  }
</style>
