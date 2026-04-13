<script setup>
  import { defineProps, ref, computed } from "vue";
  import { toast } from "vue3-toastify";

  import useUserStore from "@/stores/user";
  const userStore = useUserStore();

  import useGlobalStore from "@/stores/global";
  const globalStore = useGlobalStore();

  import useAuthStore from "@/stores/auth";
  const authStore = useAuthStore();

  import {
    areStringsEqual,
    checkValidPassword,
    onlyNumbers,
  } from "@/utils/helpers";

  const props = defineProps({
    data: {
      type: Object,
      default: () => {},
    },
    option: {
      type: Number,
      default: 0,
    },
  });

  const user = ref();
  const loading = ref({});

  onMounted(async () => {
    user.value = JSON.parse(JSON.stringify(userStore.profile));
  });

  const settings = ref([
    {
      label: "Nombre de Usuario",
      prop: "username",
      expand: false,
      height: 180,
    },
    { label: "Contraseña", prop: "password", expand: false, height: 325 },
    { label: "Email", prop: "email", expand: false, height: 190 },
    { label: "Teléfono", prop: "phone", expand: false, height: 200 },
  ]);

  const expandDiv = (pos) => {
    settings.value.forEach((setting, n) => {
      if (pos === n && setting.expand) setting.expand = false;
      else setting.expand = n === pos;
    });
  };

  const getValueItem = (prop) => {
    if (prop) {
      const props = {
        username: () => userStore.profile.username,
        password: () => "********",
        email: () => userStore.profile.email,
        phone: () => "987654321",
      };
      return props[prop]();
    }
    return "";
  };

  // Guardar
  const saveCredentials = (type) => {
    const types = {
      username: () => verifyUserName(),
      password: () => savePassword(),
      email: () => saveEmailAndPhone("email"),
      phone: () => saveEmailAndPhone("phone"),
    };
    types[type]();
  };
  const verifyUserName = async () => {
    const { username } = user.value;
    if (!!username.trim()) {
      globalStore.loading = true;
      await userStore.findByUserName(username);
      if (Object.keys(userStore.usersByUserName).length) {
        toast.error("El nombre de usuario ya esta en uso.", {
          autoClose: 3000,
        });
        errorInputs.value.username = "Ya está en uso.";
      } else {
        await userStore.updatedUserName(username);
        errorInputs.value.username = "";
      }
      globalStore.loading = false;
    } else {
      toast.error("El nombre de usuario esta vacío.", {
        autoClose: 3000,
      });
      errorInputs.value.username = "Campo Obligatorio.";
    }
  };
  const savePassword = async () => {
    if (statePassword.value.withCode) {
      const body = {
        code: Number(codePassword.value),
        newPassword: newPassword.value,
      };
      globalStore.loading = true;
      const resp = await userStore.forgotPasswordCode(body);
      if (resp) {
        cancelPassword();
      } else {
        errorInputs.value.code = "Código Incorrecto.";
      }
      globalStore.loading = false;
    } else {
      const body = {
        currentPassword: currentPassword.value,
        newPassword: newPassword.value,
      };
      globalStore.loading = true;
      const resp = await userStore.changePassword(body);
      if (resp) {
        cancelPassword();
      } else {
        errorInputs.value.currentPassword = "Contraseña Incorrecta.";
      }
      globalStore.loading = false;
    }
  };
  const verifyEmail = () => {
    email.value = email.value.replace(" ", "");
    if (!regexEmail(email.value)) {
      errorInputs.value.email = "Email no Válido.";
    } else {
      errorInputs.value.email = "Email Válido.";
    }
  };
  const verifyPhone = () => {
    console.log("phone");
  };

  const errorInputs = ref({});

  const cancelEdit = (type) => {
    const types = {
      username: () => cancelUserName(),
      password: () => cancelPassword(),
      email: () => cancelEmail(),
      phone: () => verifyPhone(),
    };
    types[type]();

    expandDiv(4);
  };

  const cancelUserName = () => {
    user.value.username = userStore.profile.username;
    errorInputs.value.username = "";
  };

  // Password
  const currentPassword = ref("");
  const newPassword = ref("");
  const confirmPassword = ref("");
  const showPassword = ref({});
  const statePassword = ref({});
  const codePassword = ref("");
  const verifyNewPassword = () => {
    newPassword.value = newPassword.value.replace(" ", "");
    const pass = newPassword.value;
    if (checkValidPassword(pass)) {
      errorInputs.value.newPassword = "Válida.";
    } else {
      errorInputs.value.newPassword = "Inválida.";
    }
    if (!!confirmPassword.value.trim()) {
      if (newPassword.value.trim() === confirmPassword.value.trim()) {
        errorInputs.value.confirmPassword = "Correcta.";
      } else {
        errorInputs.value.confirmPassword = "No Coinciden.";
      }
    }
  };
  const verifyConfirmPassword = () => {
    confirmPassword.value = confirmPassword.value.replace(" ", "");
    if (newPassword.value.trim() === confirmPassword.value.trim()) {
      errorInputs.value.confirmPassword = "Correcta.";
    } else {
      errorInputs.value.confirmPassword = "No Coincide.";
    }
  };
  const verifyCode = (type) => {
    if (type == "password") {
      const pass = codePassword.value;
      codePassword.value = onlyNumbers(pass.replace(" ", "")).slice(0, 4);
      errorInputs.value.code = "";
    } else {
      const email = codeEmail.value;
      codeEmail.value = onlyNumbers(email.replace(" ", "")).slice(0, 4);
      errorInputs.value.codeEmail = "";
    }
  };
  const sendCode = async (type = "password") => {
    if (type === "password") {
      statePassword.value.loading = type === "password";
      await authStore.resendCode(user.value._id);
      statePassword.value.withCode = true;
      errorInputs.value = {};
      newPassword.value = "";
      confirmPassword.value = "";
      codePassword.value = "";
      statePassword.value.loading = false;
    } else {
      stateEmail.value.loading = true;
      stateEmail.value.withCode = false;
      await authStore.resendCode(user.value._id);
      stateEmail.value.withCode = true;
      stateEmail.value.loading = false;
    }
  };
  const cancelPassword = () => {
    expandDiv(4);
    statePassword.value = {};
    errorInputs.value = {};
    currentPassword.value = "";
    newPassword.value = "";
    confirmPassword.value = "";
    codePassword.value = "";
  };
  const cancelForgot = () => {
    statePassword.value.forgot = false;
    currentPassword.value = "";
    newPassword.value = "";
    confirmPassword.value = "";
    codePassword.value = "";
    errorInputs.value = {};
  };
  const stateSavePassword = computed(() => {
    if (statePassword.value.withCode) {
      return !(
        !!codePassword.value.trim() &&
        !!newPassword.value.trim() &&
        errorInputs.value.newPassword === "Válida." &&
        !!confirmPassword.value.trim() &&
        errorInputs.value.confirmPassword === "Correcta."
      );
    } else {
      return !(
        !!currentPassword.value.trim() &&
        !!newPassword.value.trim() &&
        errorInputs.value.newPassword === "Válida." &&
        !!confirmPassword.value.trim() &&
        errorInputs.value.confirmPassword === "Correcta."
      );
    }
  });

  // Email
  const email = ref("");
  const codeEmail = ref("");
  const stateEmail = ref({});
  const saveEmailAndPhone = async (type) => {
    globalStore.loading = true;
    const data = [
      type === "email" ? email.value : "934234234",
    ];
    const body = {
      code: Number(codeEmail.value),
      type,
      data,
    };

    const resp = await userStore.updatedEmalAndPhone(body);
    if (resp) {
      cancelEmail();
    } else {
      errorInputs.value.codeEmail = "Código Incorrecto.";
    }
    globalStore.loading = false;
  };

  const cancelEmail = () => {
    expandDiv(4);
    stateEmail.value = {};
    errorInputs.value = {};
    email.value = "";
    codeEmail.value = "";
  };
</script>

<template>
  <div class="form" v-if="user">
    <div class="form__item" v-for="(setting, n) in settings" :key="n">
      <div class="form__item-label">
        <span>{{ setting.label }}</span>
      </div>
      <div
        class="form__item-content"
        :style="`height: ${setting.expand ? setting.height : 32}px;`"
      >
        <div
          class="content__sup"
          :style="`opacity: ${setting.expand ? 0 : 1};`"
        >
          <span>{{ getValueItem(setting.prop) }}</span>
          <u-button-icon
            icon="edit"
            type="outlined"
            size="s"
            @action-btn="expandDiv(n)"
            :disabled="['phone'].includes(setting.prop)"
          />
        </div>
        <div
          class="content__inf"
          :style="`transform: translateY(${setting.expand ? -32 : 0}px);`"
        >
          <div v-if="setting.prop === 'username'" class="hideContent">
            <span class="text"
              >Tu nombre de usuario público es igual a la dirección de tu
              perfil.</span
            >
            <span class="vignette"
              >unabase.com/profile/{{ user.username }}</span
            >
            <div class="hideContent__input">
              <label>{{ setting.label }}</label>
              <u-input
                v-model="user.username"
                size="s"
                :error="errorInputs.username === 'Ya está en uso.'"
              />
              <div v-if="!!errorInputs.username">
                <span
                  class="u u-cancel"
                  style="color: var(--bg-danger-500)"
                ></span>
                <span style="color: var(--bg-danger-500)">{{
                  errorInputs.username
                }}</span>
              </div>
            </div>
            <div class="hideContent__actions">
              <u-button
                text="Cancelar"
                type="outlined"
                size="s"
                @action-btn="cancelEdit(setting.prop)"
              />
              <u-button
                :disabled="
                  !!user.username
                    ? areStringsEqual(userStore.profile.username, user.username)
                    : true
                "
                text="Guardar Cambios"
                class="btnMainModify"
                size="s"
                @action-btn="saveCredentials(setting.prop)"
              />
            </div>
          </div>

          <div v-else-if="setting.prop === 'password'" class="hideContent">
            <span class="text"
              >Para proteger su cuenta, asegúrese de que su nueva
              contraseña:</span
            >
            <span class="vignette">Tenga al menos 8 caracteres.</span>
            <span class="vignette"
              >Contenga letras mayúsculas, letras minúsculas, números y
              símbolos.</span
            >
            <span class="vignette"
              >Sea significativamente diferente de sus contraseñas
              anteriores.</span
            >
            <div
              class="hideContent__input"
              v-if="!statePassword.forgot || statePassword.withCode"
            >
              <label>{{
                statePassword.withCode ? "Ingresar Código" : "Contraseña Actual"
              }}</label>
              <u-input
                v-if="statePassword.withCode"
                v-model="codePassword"
                size="s"
                @input="verifyCode('password')"
                :error="errorInputs.code === 'Código Incorrecto.'"
              />
              <div v-else style="position: relative">
                <u-input
                  v-model="currentPassword"
                  :type="showPassword.current ? 'text' : 'password'"
                  size="s"
                  class="inputPassModify"
                  :error="
                    errorInputs.currentPassword === 'Contraseña Incorrecta.'
                  "
                  @input="currentPassword = currentPassword.replace(' ', '')"
                />
                <u-button-icon
                  class="iconEye"
                  type="text"
                  color="--bg-neutral-500"
                  :icon="showPassword.current ? 'no-show' : 'show'"
                  @action-btn="showPassword.current = !showPassword.current"
                />
              </div>
              <div
                class="msgCode"
                v-if="errorInputs.currentPassword === 'Contraseña Incorrecta.'"
              >
                <span
                  class="u u-cancel"
                  style="color: var(--bg-danger-500)"
                ></span>
                <span style="color: var(--bg-danger-500)">{{
                  errorInputs.currentPassword
                }}</span>
              </div>
              <div
                class="msgCode"
                v-show="errorInputs.code === 'Código Incorrecto.'"
              >
                <span
                  class="u u-cancel"
                  style="color: var(--bg-danger-500)"
                ></span>
                <span style="color: var(--bg-danger-500)">{{
                  errorInputs.code
                }}</span>
              </div>
            </div>
            <div
              class="hideContent__input"
              v-if="!statePassword.forgot || statePassword.withCode"
            >
              <label>Nueva Contraseña</label>
              <div style="position: relative">
                <u-input
                  v-model="newPassword"
                  :type="showPassword.new ? 'text' : 'password'"
                  size="s"
                  class="inputPassModify"
                  @input="verifyNewPassword"
                />
                <u-button-icon
                  class="iconEye"
                  type="text"
                  color="--bg-neutral-500"
                  :icon="showPassword.new ? 'no-show' : 'show'"
                  @action-btn="showPassword.new = !showPassword.new"
                />
              </div>
              <div v-show="!!errorInputs.newPassword">
                <span
                  :class="`u u-${
                    errorInputs.newPassword === 'Válida.' ? 'check' : 'cancel'
                  }`"
                  :style="`color: var(${
                    errorInputs.newPassword === 'Válida.'
                      ? '--bg-success-500'
                      : '--bg-danger-500'
                  });`"
                ></span>
                <span
                  :style="`color: var(${
                    errorInputs.newPassword === 'Válida.'
                      ? '--bg-success-500'
                      : '--bg-danger-500'
                  });`"
                  >{{ errorInputs.newPassword }}</span
                >
              </div>
            </div>
            <div
              class="hideContent__input"
              v-if="!statePassword.forgot || statePassword.withCode"
            >
              <label>Repetir Contraseña</label>
              <div style="position: relative">
                <u-input
                  v-model="confirmPassword"
                  :type="showPassword.confirm ? 'text' : 'password'"
                  size="s"
                  class="inputPassModify"
                  @input="verifyConfirmPassword"
                  :disabled="errorInputs.newPassword === 'Inválida.'"
                />
                <u-button-icon
                  class="iconEye"
                  type="text"
                  :disabled="errorInputs.newPassword === 'Inválida.'"
                  color="--bg-neutral-500"
                  :icon="showPassword.confirm ? 'no-show' : 'show'"
                  @action-btn="showPassword.confirm = !showPassword.confirm"
                />
              </div>
              <div v-show="!!errorInputs.confirmPassword">
                <span
                  :class="`u u-${
                    errorInputs.confirmPassword === 'Correcta.'
                      ? 'check'
                      : 'cancel'
                  }`"
                  :style="`color: var(${
                    errorInputs.confirmPassword === 'Correcta.'
                      ? '--bg-success-500'
                      : '--bg-danger-500'
                  });`"
                ></span>
                <span
                  :style="`color: var(${
                    errorInputs.confirmPassword === 'Correcta.'
                      ? '--bg-success-500'
                      : '--bg-danger-500'
                  });`"
                  >{{ errorInputs.confirmPassword }}</span
                >
              </div>
            </div>

            <div
              class="hideContent__input"
              v-if="statePassword.forgot && !statePassword.withCode"
            >
              <label>Enviar código a:</label>
              <div v-if="!statePassword.loading">
                <u-button-icon
                  icon="email"
                  type="outlined"
                  size="s"
                  @action-btn="sendCode"
                />
                <u-button-icon
                  icon="phone"
                  type="outlined"
                  size="s"
                  :disabled="true"
                />
                <u-button-icon
                  icon="close"
                  type="outlined"
                  color="--bg-neutral-600"
                  colorHover="--bg-neutral-700"
                  colorActive="--bg-neutral-700"
                  size="s"
                  @action-btn="cancelForgot"
                />
              </div>
              <div v-else>
                <u-loading :width="16" /> <span>Enviando Código ...</span>
              </div>
            </div>

            <div class="hideContent__actions-password">
              <div>
                <button
                  v-show="!statePassword.forgot"
                  class="btnPass"
                  @click="statePassword.forgot = true"
                >
                  Olvidé mi Contraseña
                </button>
              </div>
              <div style="display: flex; gap: 20px">
                <u-button
                  text="Cancelar"
                  type="outlined"
                  size="s"
                  :disabled="statePassword.loading"
                  @action-btn="cancelEdit(setting.prop)"
                />
                <u-button
                  :disabled="statePassword.loading || stateSavePassword"
                  text="Guardar Cambios"
                  class="btnMainModify"
                  size="s"
                  @action-btn="saveCredentials(setting.prop)"
                />
              </div>
            </div>
          </div>

          <div v-else-if="setting.prop === 'email'" class="hideContent">
            <span class="text"
              >Esta dirección de email se mostrará como tu dato de
              contacto.</span
            >

            <div v-if="!stateEmail.withCode">
              <div
                v-if="!stateEmail.loading"
                style="display: flex; align-items: center; gap: 10px"
              >
                <label class="label">Enviar código a:</label>
                <u-button-icon
                  icon="email"
                  type="outlined"
                  size="s"
                  @action-btn="sendCode('email')"
                />
                <u-button-icon
                  icon="phone"
                  type="outlined"
                  size="s"
                  :disabled="true"
                />
              </div>
              <div v-else-if="stateEmail.loading">
                <div></div>
                <u-loading :width="16" /> <span>Enviando Código ...</span>
                <div></div>
              </div>
            </div>
            <div class="hideContent__input" v-if="stateEmail.withCode">
              <label>Código de Validación</label>
              <u-input
                v-model="codeEmail"
                size="s"
                @input="verifyCode('email')"
                :error="errorInputs.codeEmail === 'Código Incorrecto.'"
              />
              <div
                class="msgCode"
                v-show="errorInputs.codeEmail === 'Código Incorrecto.'"
              >
                <span
                  class="u u-cancel"
                  style="color: var(--bg-danger-500)"
                ></span>
                <span style="color: var(--bg-danger-500)">{{
                  errorInputs.codeEmail
                }}</span>
              </div>
            </div>
            <div class="hideContent__input" v-if="stateEmail.withCode">
              <label>Nuevo Email</label>
              <u-input v-model="email" size="s" @input="verifyEmail" />
              <div class="msgCode" v-show="errorInputs.email">
                <span
                  :class="`u u-${
                    errorInputs.email === 'Email Válido.' ? 'check' : 'cancel'
                  }`"
                  :style="`color: var(${
                    errorInputs.email === 'Email Válido.'
                      ? '--bg-success-500'
                      : '--bg-danger-500'
                  });`"
                ></span>
                <span
                  :style="`color: var(${
                    errorInputs.email === 'Email Válido.'
                      ? '--bg-success-500'
                      : '--bg-danger-500'
                  });`"
                  >{{ errorInputs.email }}</span
                >
              </div>
            </div>
            <div class="hideContent__actions">
              <u-button
                text="Cancelar"
                type="outlined"
                size="s"
                @action-btn="cancelEdit(setting.prop)"
              />
              <u-button
                text="Guardar Cambios"
                class="btnMainModify"
                size="s"
                :disabled="
                  !(
                    errorInputs.email === 'Email Válido.' &&
                    codeEmail.length === 4
                  )
                "
                @action-btn="saveCredentials(setting.prop)"
              />
            </div>
          </div>

          <div v-else>No username</div>
        </div>
      </div>
    </div>
    <div class="form__item">
      <div class="form__item-label">
        <span style="color: var(--bg-danger-500)">Desactivar mi Cuenta</span>
      </div>
      <div style="display: flex; justify-content: flex-end">
        <u-button-icon
          icon="chevron-right"
          type="outlined"
          size="s"
          :disabled="true"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
  span,
  label,
  button {
    font-family: Nunito;
  }
  .form {
    max-width: 1000px;
    height: auto;
    min-height: 300px;
    max-height: calc(100vh - 98px - 280px - 20px);
    border-radius: 16px;
    border: 1px solid var(--bg-neutral-200);
    padding: 25px 20px 20px 20px;
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    gap: 20px;
    overflow-y: auto;
    transition: 0.3s ease;
    margin: 0 auto;
  }
  .form::-webkit-scrollbar {
    width: 0px;
    height: 0px;
  }
  .form__item {
    display: grid;
    grid-template-columns: 180px 1fr;
    border-bottom: 1px solid var(--bg-neutral-200);
    padding-bottom: 8px;
  }
  .form__item span {
    font-size: 16px;
    font-weight: 600;
    line-height: 20px;
    letter-spacing: 0em;
    text-align: left;
    color: var(--bg-neutral-700);
  }
  .form__item-content {
    display: flex;
    flex-direction: column;
    overflow: hidden;
    transition: 0.3s ease;
  }
  .content__sup {
    display: flex;
    justify-content: space-between;
  }
  .content__inf,
  .content__sup {
    transition: 0.3s ease;
  }
  .hideContent {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  .hideContent .text {
    font-size: 14px;
    font-weight: 600;
    line-height: 20px;
    letter-spacing: 0em;
    text-align: left;
    color: var(--bg-neutral-500);
    margin-bottom: 5px;
  }
  .hideContent .vignette {
    font-size: 14px;
    font-weight: 600;
    line-height: 14px;
    letter-spacing: 0em;
    text-align: left;
    color: var(--bg-neutral-700);
  }
  .hideContent .vignette:last-of-type {
    margin-bottom: 15px;
  }
  .hideContent .hideContent__input {
    display: grid;
    grid-template-columns: 180px 1fr 180px;
    align-items: center;
  }
  .hideContent .hideContent__input label,
  .label {
    font-size: 14px;
    font-weight: 400;
    line-height: 16px;
    letter-spacing: 0em;
    text-align: left;
    color: var(--bg-neutral-700);
  }
  .hideContent .hideContent__input div:last-child,
  .msgCode {
    display: flex;
    gap: 5px;
    align-items: center;
    padding: 0 20px;
  }
  .hideContent .hideContent__input div span {
    font-size: 12px;
    font-weight: 400;
    line-height: 16px;
    letter-spacing: 0em;
    text-align: left;
  }
  .hideContent .hideContent__input div span:nth-child(1) {
    font-size: 14px;
  }
  .hideContent__actions {
    display: flex;
    justify-content: flex-end;
    gap: 20px;
    padding-top: 15px;
  }
  .hideContent__actions-password {
    display: flex;
    justify-content: space-between;
    gap: 20px;
    padding-top: 15px;
  }
  .iconEye {
    position: absolute;
    right: 7px;
    bottom: -7px;
  }
  .inputPassModify::v-deep(input) {
    padding: 0 44px 0 18px;
  }
  .btnPass {
    color: var(--bg-neutral-500);
    font-size: 14px;
    transition: 0.3s ease;
  }
  .btnPass:hover {
    color: var(--bg-primary-400);
  }
</style>
