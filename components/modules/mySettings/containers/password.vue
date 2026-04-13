<script setup>
import { ref, defineEmits, computed } from "vue";
import useUserStore from "@/stores/user";
import useGlobalStore from "@/stores/global";
import useAuthStore from "@/stores/auth";
import { toast } from "vue3-toastify";
import { useI18n } from "vue-i18n";

// Translation
const { t, locale } = useI18n();
const module = "modules.mySettings";
const modulePassword = module + ".sections.accountSettings.sections.password";

// Stores
const userStore = useUserStore();
const globalStore = useGlobalStore();
const authStore = useAuthStore();

// Emits
const emit = defineEmits(["closeTag"]);

// Constants
const currentPassword = ref("");
const newPassword = ref("");
const confirmPassword = ref("");
const showPassword = ref({});
const statePassword = ref({});
const codePassword = ref("");
const errorInputs = ref({});

// Functions
const verifyCode = () => {
  const pass = codePassword.value;
  codePassword.value = onlyNumbers(pass.replace(" ", "")).slice(0, 4);
  errorInputs.value.code = "";
};
const verifyNewPassword = () => {
  newPassword.value = newPassword.value.replace(" ", "");
  const pass = newPassword.value;
  if (checkValidPassword(pass)) {
    errorInputs.value.newPassword = t(`${modulePassword}.edit.errors.valid`);
  } else {
    errorInputs.value.newPassword = t(`${modulePassword}.edit.errors.invalid`);
  }
  if (!!confirmPassword.value.trim()) {
    if (newPassword.value.trim() === confirmPassword.value.trim()) {
      errorInputs.value.confirmPassword = t(
        `${modulePassword}.edit.tags.correct`,
      );
    } else {
      errorInputs.value.confirmPassword = t(
        `${modulePassword}.edit.tags.noCoincidence`,
      );
    }
  }
};
const verifyConfirmPassword = () => {
  confirmPassword.value = confirmPassword.value.replace(" ", "");
  if (newPassword.value.trim() === confirmPassword.value.trim()) {
    errorInputs.value.confirmPassword = t(
      `${modulePassword}.edit.tags.correct`,
    );
  } else {
    errorInputs.value.confirmPassword = t(
      `${modulePassword}.edit.tags.noCoincidence`,
    );
  }
};
const sendCode = async () => {
  statePassword.value.loading = true;
  await authStore.resendCode(userStore.mySettings.form._id);
  statePassword.value.withCode = true;
  errorInputs.value = {};
  newPassword.value = "";
  confirmPassword.value = "";
  codePassword.value = "";
  statePassword.value.loading = false;
};
const cancelForgot = () => {
  statePassword.value.forgot = false;
  currentPassword.value = "";
  newPassword.value = "";
  confirmPassword.value = "";
  codePassword.value = "";
  errorInputs.value = {};
};

const cancelEdit = () => {
  statePassword.value = {};
  errorInputs.value = {};
  currentPassword.value = "";
  newPassword.value = "";
  confirmPassword.value = "";
  codePassword.value = "";
  setTimeout(() => {
    emit("closeTag");
  }, 10);
};

// Computed
const stateSavePassword = computed(() => {
  if (statePassword.value.withCode) {
    return !(
      !!codePassword.value.trim() &&
      !!newPassword.value.trim() &&
      errorInputs.value.newPassword ===
        t(`${modulePassword}.edit.errors.valid`) &&
      !!confirmPassword.value.trim() &&
      errorInputs.value.confirmPassword ===
        t(`${modulePassword}.edit.tags.correct`)
    );
  } else {
    return !(
      !!currentPassword.value.trim() &&
      !!newPassword.value.trim() &&
      errorInputs.value.newPassword ===
        t(`${modulePassword}.edit.errors.valid`) &&
      !!confirmPassword.value.trim() &&
      errorInputs.value.confirmPassword ===
        t(`${modulePassword}.edit.tags.correct`)
    );
  }
});

const savePassword = async () => {
  if (statePassword.value.withCode) {
    authStore.code = Number(codePassword.value);
    globalStore.loading = true;
    const resp = await authStore.createPass(
      newPassword.value,
      userStore.userSession._id,
      false,
    );
    if (resp) {
      toast.success(t(`${modulePassword}.edit.tags.successfulChange`), {
        autoClose: 2000,
      });
      cancelEdit();
    } else {
      errorInputs.value.code = t(`${modulePassword}.edit.errors.incorrectCode`);
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
      cancelEdit();
    } else {
      errorInputs.value.currentPassword = t(
        `${modulePassword}.edit.errors.incorrectPassword`,
      );
    }
    globalStore.loading = false;
  }
};
</script>

<template>
  <div class="password">
    <span class="text">{{ t(`${modulePassword}.edit.description`) }}</span>
    <span class="vignette">{{
      t(`${modulePassword}.edit.unorderedList.item1`)
    }}</span>
    <span class="vignette">{{
      t(`${modulePassword}.edit.unorderedList.item2`)
    }}</span>
    <span class="vignette">{{
      t(`${modulePassword}.edit.unorderedList.item3`)
    }}</span>
    <div
      class="password__input"
      v-if="!statePassword.forgot || statePassword.withCode"
    >
      <label>{{
        statePassword.withCode
          ? t(`${modulePassword}.edit.inputs.currentCode.label`)
          : t(`${modulePassword}.edit.inputs.currentPassword.label`)
      }}</label>
      <u-input
        v-if="statePassword.withCode"
        v-model="codePassword"
        size="s"
        @input="verifyCode"
        :error="
          errorInputs.code === t(`${modulePassword}.edit.errors.incorrectCode`)
        "
      />
      <div v-else style="position: relative">
        <u-input
          v-model="currentPassword"
          :type="showPassword.current ? 'text' : 'password'"
          size="s"
          class="inputPassModify"
          :error="
            errorInputs.currentPassword ===
            t(`${modulePassword}.edit.errors.incorrectPassword`)
          "
          @input="currentPassword = currentPassword.replace(' ', '')"
        />
        <u-button-icon
          class="iconEye"
          type="text"
          color="--neutral-text-caption"
          :icon="showPassword.current ? 'no-show' : 'show'"
          @action-btn="showPassword.current = !showPassword.current"
        />
      </div>
      <div
        class="msgCode"
        v-if="
          errorInputs.currentPassword ===
          t(`${modulePassword}.edit.errors.incorrectPassword`)
        "
      >
        <span class="u u-cancel" style="color: var(--bg-danger-500)"></span>
        <span style="color: var(--bg-danger-500)">{{
          errorInputs.currentPassword
        }}</span>
      </div>
      <div
        class="msgCode"
        v-show="
          errorInputs.code === t(`${modulePassword}.edit.errors.incorrectCode`)
        "
      >
        <span class="u u-cancel" style="color: var(--bg-danger-500)"></span>
        <span style="color: var(--bg-danger-500)">{{ errorInputs.code }}</span>
      </div>
    </div>
    <div
      class="password__input"
      v-if="!statePassword.forgot || statePassword.withCode"
    >
      <label>{{ t(`${modulePassword}.edit.inputs.newPassword.label`) }}</label>
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
          color="--neutral-text-caption"
          :icon="showPassword.new ? 'no-show' : 'show'"
          @action-btn="showPassword.new = !showPassword.new"
        />
      </div>
      <div v-show="!!errorInputs.newPassword">
        <span
          :class="`u u-${
            errorInputs.newPassword === t(`${modulePassword}.edit.errors.valid`)
              ? 'check'
              : 'cancel'
          }`"
          :style="`color: var(${
            errorInputs.newPassword === t(`${modulePassword}.edit.errors.valid`)
              ? '--bg-success-500'
              : '--bg-danger-500'
          });`"
        ></span>
        <span
          :style="`color: var(${
            errorInputs.newPassword === t(`${modulePassword}.edit.errors.valid`)
              ? '--bg-success-500'
              : '--bg-danger-500'
          });`"
          >{{ errorInputs.newPassword }}</span
        >
      </div>
    </div>
    <div
      class="password__input"
      v-if="!statePassword.forgot || statePassword.withCode"
    >
      <label>{{
        t(`${modulePassword}.edit.inputs.confirmNewPassword.label`)
      }}</label>
      <div style="position: relative">
        <u-input
          v-model="confirmPassword"
          :type="showPassword.confirm ? 'text' : 'password'"
          size="s"
          class="inputPassModify"
          @input="verifyConfirmPassword"
          :disabled="
            errorInputs.newPassword ===
            t(`${modulePassword}.edit.errors.invalid`)
          "
        />
        <u-button-icon
          class="iconEye"
          type="text"
          :disabled="
            errorInputs.newPassword ===
            t(`${modulePassword}.edit.errors.invalid`)
          "
          color="--neutral-text-caption"
          :icon="showPassword.confirm ? 'no-show' : 'show'"
          @action-btn="showPassword.confirm = !showPassword.confirm"
        />
      </div>
      <div v-show="!!errorInputs.confirmPassword">
        <span
          :class="`u u-${
            errorInputs.confirmPassword ===
            t(`${modulePassword}.edit.tags.correct`)
              ? 'check'
              : 'cancel'
          }`"
          :style="`color: var(${
            errorInputs.confirmPassword ===
            t(`${modulePassword}.edit.tags.correct`)
              ? '--bg-success-500'
              : '--bg-danger-500'
          });`"
        ></span>
        <span
          :style="`color: var(${
            errorInputs.confirmPassword ===
            t(`${modulePassword}.edit.tags.correct`)
              ? '--bg-success-500'
              : '--bg-danger-500'
          });`"
          >{{ errorInputs.confirmPassword }}</span
        >
      </div>
    </div>

    <div
      class="password__input"
      v-if="statePassword.forgot && !statePassword.withCode"
    >
      <label> {{ t(`${modulePassword}.edit.forgotPassword.sendCode`) }}</label>
      <div v-if="!statePassword.loading">
        <u-button-icon
          icon="email"
          type="outlined"
          size="s"
          @action-btn="sendCode"
        />
        <u-button-icon icon="phone" type="outlined" size="s" :disabled="true" />
        <u-button-icon
          icon="close"
          type="outlined"
          color="--bg-neutral-600"
          colorHover="--neutral-text-body"
          colorActive="--neutral-text-body"
          size="s"
          @action-btn="cancelForgot"
        />
      </div>
      <div v-else>
        <u-loading :width="16" /> <span>Enviando Código ...</span>
      </div>
    </div>

    <div class="password__actions-password">
      <div>
        <button
          v-show="!statePassword.forgot"
          class="btnPass"
          @click="statePassword.forgot = true"
        >
          {{ t(`${modulePassword}.edit.forgotPassword.label`) }}
        </button>
      </div>
      <div style="display: flex; gap: 20px">
        <u-button
          :text="t(`${module}.buttons.cancel`)"
          type="outlined"
          size="s"
          :disabled="statePassword.loading"
          @action-btn="cancelEdit"
        />
        <u-button
          :disabled="statePassword.loading || stateSavePassword"
          :text="t(`${module}.buttons.save`)"
          class="btnMainModify"
          size="s"
          @action-btn="savePassword"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
.password {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.password .text {
  font-size: 14px;
  font-weight: 600;
  line-height: 20px;
  letter-spacing: 0em;
  text-align: left;
  color: var(--neutral-text-caption);
  margin-bottom: 5px;
}
.vignette {
  font-size: 14px;
  font-weight: 600;
  line-height: 20px;
  color: var(--neutral-text-body);
  position: relative;
  padding-left: 20px;
}
.vignette::after {
  content: "";
  width: 6px;
  height: 6px;
  border-radius: 5px;
  background-color: var(--primary-surface-default);
  left: 0px;
  top: calc(50% - 3px);
  position: absolute;
}
.password .vignette:last-of-type {
  margin-bottom: 15px;
}
.password .password__input {
  display: grid;
  grid-template-columns: 180px 1fr 180px;
  align-items: center;
}
.password .password__input label,
.label {
  font-size: 14px;
  font-weight: 400;
  line-height: 16px;
  letter-spacing: 0em;
  text-align: left;
  color: var(--neutral-text-body);
}
.password .password__input div:last-child,
.msgCode {
  display: flex;
  gap: 5px;
  align-items: center;
  padding: 0 20px;
}
.password .password__input div span {
  font-size: 12px;
  font-weight: 400;
  line-height: 16px;
  letter-spacing: 0em;
  text-align: left;
}
.password .password__input div span:nth-child(1) {
  font-size: 14px;
}
.password__actions {
  display: flex;
  justify-content: flex-end;
  gap: 20px;
  padding-top: 15px;
}
.password__actions-password {
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
  color: var(--neutral-text-caption);
  font-size: 14px;
  transition: 0.3s ease;
}
.btnPass:hover {
  color: var(--bg-primary-400);
}
</style>
