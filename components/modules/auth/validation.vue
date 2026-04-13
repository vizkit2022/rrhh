<script setup>
  import { ref, defineProps } from "vue";
  import useAuthStore from "@/stores/auth";
  const authStore = useAuthStore();

  const props = defineProps({
    endTime: {
      type: Boolean,
      default: true,
    },
  });

  const code1 = ref(null);
  const code2 = ref(null);
  const code3 = ref(null);
  const code4 = ref(null);

  const handleSubmit = (e) => {
    e.preventDefault();

    const fullCode =
      code1.value + "" + code2.value + "" + code3.value + "" + code4.value;
    fullCode.trim();
    let newCode = parseInt(fullCode);
    authStore.validationCode(newCode);
  };

  watch(code1, (newValue, oldValue) => {
    if (newValue.trim() !== "") {
      document.getElementById("code2").disabled = false;
      document.getElementById("code2").focus();
    }
  });

  watch(code2, (newValue, oldValue) => {
    if (newValue.trim() !== "") {
      document.getElementById("code3").disabled = false;
      document.getElementById("code3").focus();
    }
  });

  watch(code3, (newValue, oldValue) => {
    if (newValue.trim() !== "") {
      document.getElementById("code4").disabled = false;
      document.getElementById("code4").focus();
    }
  });

  watch(code4, (newValue, oldValue) => {
    if (newValue.trim().length >= 2) {
      newValue = newValue[0];
    }
  });
</script>

<template>
  <div class="container__card">
    <img src="/img/validation.png" alt="Validation" class="img__validation" />

    <div class="container__innerText">
      <h2 class="text__title" v-if="props.endTime">
        Verifica tu dirección de email
      </h2>
      <h2 class="text__title" v-else>No se pudo verificar tu email</h2>
      <p class="text__subtitle" v-if="props.endTime">
        Para continuar con el registro en Unabase ingresa el codigo que enviamos
        a tu correo
      </p>
      <p class="text__subtitle" v-else>Necesitas generar un nuevo código</p>
      <div class="container__child">
        <input
          type="text"
          name="code1"
          id="code1"
          v-model="code1"
          autofocus
          :disabled="!props.endTime"
        />
        <input
          type="text"
          name="code1"
          id="code2"
          v-model="code2"
          :disabled="!props.endTime"
        />
        <input
          type="text"
          name="code1"
          id="code3"
          v-model="code3"
          :disabled="!props.endTime"
        />
        <input
          type="text"
          name="code1"
          id="code4"
          v-model="code4"
          :disabled="!props.endTime"
        />
      </div>

      <u-button
        text="Continuar"
        size="xl"
        @click="handleSubmit"
        :disabled="!props.endTime"
      />
    </div>
  </div>
</template>

<style scoped>
  .container__card {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    padding: 12px;
    gap: 24px;
    align-self: stretch;
  }

  .container__child {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 10px;
  }

  .container__child input {
    width: 40px;
    height: 40px;
    text-align: center;
    display: flex;
    justify-content: center;
    align-items: center;
    font-size: 18px;
    border: 1px solid var(--bg-neutral-500);
    border-radius: 5px;
  }
  .container__child input:focus,
  .container__child input:active {
    border: 1px solid var(--bg-primary-400);
    color: var(--bg-primary-500);
  }

  .container__child input:disabled {
    border: 1px solid var(--bg-neutral-300);
    color: var(--bg-neutral-300);
    background-color: var(--bg-neutral-100);
  }

  .container__innerText {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 28px;
    align-self: stretch;
  }

  .text__title {
    align-self: stretch;
    color: var(--bg-neutral-700);
    text-align: center;
    line-height: 40px;
  }

  .text__subtitle {
    align-self: stretch;
    color: var(--bg-neutral-500, #98a2b3);
    text-align: center;
    line-height: 20px;
  }

  .button__google {
    display: flex;
    justify-content: center;
    align-items: center;
    /* text */
    color: var(--neutral-white, #fff);
    line-height: 20px;
    /*  */
    height: 48px;
    width: 100%;
    padding: 12px 36px;
    gap: 10px;
    border-radius: 18px;
    background: var(--bg-primary-500, #20a789);
  }
  .btn {
    width: 80%;
  }
</style>
