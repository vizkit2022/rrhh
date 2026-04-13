<script setup>
  import useAuthStore from "@/stores/auth";
  const authStore = useAuthStore();

  const { t } = useI18n();
  const module = "modules.login.inputs.changePassword"; 
  const moduleButton = "modules.login.buttons";

  const password = ref("");
  const rpassword = ref("");
  const regexEmail = (email) => {
    //revisar
    const regex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-z]{2,}$/;
    if (!regex.test(email)) {
      return false;
    }
    return true;
  };

  const checkValidPass = (passwd) => {
    // PASS NECESITA almenos 8 caracteres, 2 mayusculas, 1 numero y 1 caracter especial
    const regex =
      /^(?=.{8,}$)(?=.*[A-Z]{2,})(?=.*[0-9]{1,})(?=.*[!@#$%^&*()_+|~=`{}\[\];:\'",.<>?]{1,})$/;
    return regex.test(passwd);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (checkValidPass(password.value)) {
      alert("Las contraseña no cumple con los requisitos");
      return false;
    } else if (password.value !== rpassword.value) {
      alert("Las contraseñas no son iguales");
      return false;
    } else {
      authStore.createPass(password.value);
    }
  };
</script>

<template>
  <div class="containerForm">
    <form @submit.prevent="handleSubmit">
      <div class="containerOptions">
        <label for="email"><b>{{ t(module + ".newPassword") }}</b></label>
        <u-input
          v-model="password"
          type="password"
          size="l"
          class="input"
          :placeholder="t(module + '.placeholder')"
          name="password"
          id="password"
          required
        />
      </div>
      <div class="containerOptions">
        <label for="email"><b>{{ t(module + ".repeatPassword") }}</b></label>
        <u-input
          v-model="rpassword"
          type="password"
          size="l"
          class="input"
          :placeholder="t(module + '.placeholder')"
          name="password"
          id="rpassword"
          required
        />
      </div>
      <div class="containerOptions">
        <u-button size="l" class="btnModify" :text="t(moduleButton + '.send')" type="normal" />
      </div>
    </form>
  </div>
</template>

<style scoped>
  /****CONTAINER********/
  .containerForm {
    display: flex;
    flex-direction: column;
  }

  form {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 28px;
  }

  .containerOptions {
    display: flex;
    flex-direction: column;
    gap: 12px;
    align-self: stretch;
  }

  .input {
    display: flex;
    justify-content: center;
    align-items: center;
    width: 100%;
    gap: 10px;
  }

    .btnModify {
    width: 220px;
    height: 48px;
    border-radius: 18px;
    margin: 0 auto;
  }

  label {
    color: var(--neutral-text-body);
    font-family: Nunito;
    font-size: 12px;
    font-style: normal;
    font-weight: 600;
    line-height: 16px; /* 133.333% */
  }
</style>
