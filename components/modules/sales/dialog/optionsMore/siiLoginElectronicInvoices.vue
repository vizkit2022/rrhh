<script setup>
import useGlobalStore from "@/stores/global";
import useOrganizationsStore from "@/stores/organization";
import useSalesStore from "@/stores/sales";
import { toast } from "vue3-toastify";
const { t } = useI18n();
const module = "modules.login";

// store
const globalStore = useGlobalStore();
const organizationsStore = useOrganizationsStore();
const salesStore = useSalesStore();

// emits
const emit = defineEmits(["closeModal"]);

//user constant
const rut = ref("");
const password = ref("");
const passwordType = ref("password");
const toggleIcon = ref(false);

const errorMsg = ref("");
const title = ref({
  es: "CONEXION PARA BOLETAS DE HONORARIOS ELECTRÓNICAS",
  en: "CONNECTION FOR ELECTRONIC INVOICES",
});

// COMPUTED

const disabledConnect = computed(() => {
  return (
    !rut.value ||
    !password.value ||
    errorMsg.value !== "" ||
    globalStore.loading
  );
});

// FUNCTIONS

const seePass = () => {
  passwordType.value = passwordType.value === "password" ? "text" : "password";
  toggleIcon.value = passwordType.value === "text";
};

const handleSubmit = async () => {
  const body = {
    rut: rut.value,
    password: password.value,
  };

  try {
    globalStore.loading = true;
    const resp = await salesStore.loginInvoicingSii(body);
    console.log("resp", resp);

    const errors = {
      "invalid rut": {
        es: "Rut inválido",
        en: "Invalid rut",
      },
      "invalid credentials": {
        es: "Credenciales inválidas",
        en: "Invalid credentials",
      },
    };

    if (resp.message !== "login succesfully") {
      errorMsg.value = errors[resp.message][globalStore.lang];
    } else {
      organizationsStore.getOrganizationById();
      toast.success(
        globalStore.lang === "es"
          ? "Conexión SII para Boletas de Honorarios exitosa"
          : "SII connection for Electronic Invoices successful",
        {
          autoClose: 3000,
        },
      );
      emit("closeModal");
    }
  } catch (error) {
    console.log(error);
  } finally {
    globalStore.loading = false;
  }
};

const handleEsc = (event) => {
  if (event.key === "Escape") {
    emit("closeModal");
  }
};

onMounted(() => {
  console.log("Mounted");
  document.addEventListener("keydown", handleEsc);

  rut.value = organizationsStore.organization.idNumber;
});

onUnmounted(() => {
  document.removeEventListener("keydown", handleEsc);
});
</script>

<template>
  <div class="sii-login">
    <div class="sii-login-top">
      <u-button-icon
        type="outlined"
        style="border-radius: 50%"
        size="s"
        color="--neutral-text-caption"
        icon="close"
        @click="emit('closeModal')"
      />
    </div>
    <div class="sii-login-body">
      <div class="sii-login-header">
        <img
          :src="
            !globalStore.isDark ? '/img/sii-light.png' : '/img/sii-dark.png'
          "
          alt=""
        />
        <span class="body-l-sb">{{ title[globalStore.lang] }}</span>
      </div>
      <div class="divider">
        <u-divider orientation="y" />
      </div>
      <form @submit.prevent="handleSubmit">
        <div class="options">
          <label for="rut">
            <b>RUT</b>
          </label>
          <u-input
            v-model="rut"
            size="l"
            type="text"
            class="input"
            placeholder="12.345.678-9"
            name="rut"
            id="rut"
            required
            autocomplete="off"
            @input="errorMsg = ''"
            :readonly="true"
          />
        </div>
        <div class="options">
          <label for="password">
            <b
              >{{ globalStore.lang === "es" ? "Contraseña" : "Password" }}
            </b></label
          >
          <div class="inputPassword">
            <u-input
              :auto-focus="true"
              v-model="password"
              size="l"
              :type="passwordType"
              class="password"
              placeholder="Ingrese su contraseña"
              name="password"
              id="password"
              :revers="true"
              required
              icon="true"
              autocomplete="off"
              @input="errorMsg = ''"
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
        <div class="options signIn">
          <span v-if="errorMsg !== ''" class="error body-m-sb">{{
            errorMsg
          }}</span>
          <button
            class="signInBtn"
            :disabled="disabledConnect"
            type="button"
            @click="handleSubmit"
          >
            <span
              >{{ globalStore.lang === "es" ? "Conectar" : "Connect" }}
            </span>
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<style scoped>
.sii-login {
  display: grid;
  grid-template-rows: auto 1fr;
  padding: 10px;
  background-color: var(--neutral-background-default);
  border-radius: 20px;
  width: 80vw;
  max-width: 800px;
}

.sii-login-top {
  display: flex;
  justify-content: flex-end;
  width: 100%;
}

.sii-login-body {
  display: flex;
  flex-direction: row;
}

.sii-login-header {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: flex-start;
  gap: 20px;
  flex: 0 1 240px;
}

.sii-login-header span {
  text-align: left;
  color: var(--neutral-text-body);
}

.divider {
  display: flex;
  justify-content: center;
  margin: 0px 20px;
}

form {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  flex: 1;
  padding: 0;
  gap: 24px;
}

.options {
  display: flex;
  flex-direction: column;
  align-self: stretch;
  gap: 8px;
}

.options label {
  color: var(--neutral-text-body);
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

.signInBtn:hover:not(:disabled) {
  background-color: var(--neutral-surface-subtle);
}

.signInBtn:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

.signInBtn span {
  font-size: 18px;
  line-height: 18px;
  color: var(--white);
  font-weight: 600;
  font-family: Nunito;
}

label {
  color: var(--neutral-text-body);
  font-family: Nunito;
  font-size: 12px;
  font-style: normal;
  font-weight: 600;
  line-height: 16px;
}

.inputPassword {
  position: relative;
}

.iconEye {
  position: absolute;
  top: 50%;
  right: 15px;
  transform: translateY(-50%);
}

.error {
  display: flex;
  align-items: center;
  margin-bottom: 10px;
  color: var(--danger-text-default);
}
</style>
