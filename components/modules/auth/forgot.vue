<script setup>
  import { onMounted } from "vue";
  import useAuthStore from "@/stores/auth";
  const authStore = useAuthStore();

  const { t } = useI18n();
  const module = "modules.login";

  const email = ref("");
  const laoding = ref(false);

  onMounted(() => {
    if(authStore.userNoLoginTemp.status) {
      email.value = authStore.userNoLoginTemp.email;
    }
  })

  const handleSubmit = (e) => {
    e.preventDefault();
    authStore.forgotPassword(email.value);
    laoding.value = true;
  };
</script>

<template>
  <div class="containerForm">
    <form @submit.prevent="handleSubmit">
      <div class="containerOptions">
        <label for="email"><b>{{ t(module + ".inputs.email.label") }}</b></label>
        <input
          v-model="email"
          type="text"
          class="input"
          placeholder="example@unabase.com"
          name="email"
          id="email"
          required
          :disabled="laoding"
        />
      </div>
      <u-button
        size="l"
        :text="t(module + '.buttons.send')"
        type="normal"
        class="btnModify"
        :disabled="laoding"
      />
    </form>
  </div>
</template>

<style scoped>
  /****CONTAINER********/
  .containerForm {
    display: flex;
    width: 100%;
    box-sizing: border-box;
    flex-direction: column;
    padding: 0 0px;
  }

  form {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 20px;
  }

  .containerOptions {
    display: flex;
    flex-direction: column;
    gap: 8px;
    align-self: stretch;
  }

  .containerOptions label {
    color: var(--neutral-text-caption);
  }

  .containerOptions .input {
    display: flex;
    align-items: center;
    align-self: stretch;
    height: 48px;
    padding: 8px 16px;
    gap: 8px;
    border-radius: 16px;
    border: 1px solid var(--neutral-border-default);
    background: var(--neutral-background-default);
    margin-bottom: 20px;
    color: var(--neutral-text-body);
    font-size: 16px;
  }

  input::placeholder {
   color: var(--neutral-border-default); 
   font-weight: 400;
   line-height: 24px;
  }

  label {
    color: var(--bg-neutral-700);
    font-family: Nunito;
    font-size: 12px;
    font-style: normal;
    font-weight: 600;
    line-height: 16px;
  }

  .btn {
    align-self: center;
    width: 50%;
  }

  .btn span {
    font-size: 16px;
    font-weight: 400;
  }

  .btnModify {
    width: 240px;
    height: 48px;
    border-radius: 18px;
  }

  /* @media only screen and (max-width: 560px) {
    .btnModify {
      width: 100%;
    }
  } */
</style>
