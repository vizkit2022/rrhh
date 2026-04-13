<script setup>
import { defineProps, ref, defineEmits } from "vue";
import { debounce } from "@/utils/helpers";
import useUserStore from "@/stores/user";
import useGlobalStore from "@/stores/global";
import useAuthStore from "@/stores/auth";
import { useI18n } from "vue-i18n";

const { t, locale } = useI18n();
const module = "modules.mySettings";
const moduleEmail = module + ".sections.accountSettings.sections.email";

// Stores
const userStore = useUserStore();
const globalStore = useGlobalStore();
const authStore = useAuthStore();

// Emits
const emit = defineEmits(["closeTag"]);

// Props
const props = defineProps({
  expand: {
    type: Boolean,
    default: false,
  },
});

// Contants
const stateEmail = ref({});
const email = ref("");
const codeEmail = ref("");
const errorInputs = ref({});

const sendCode = async () => {
  stateEmail.value.loading = true;
  stateEmail.value.withCode = false;
  const idUser = userStore.mySettings.form._id;
  await authStore.resendCode(idUser);
  stateEmail.value.withCode = true;
  stateEmail.value.loading = false;
};

const verifyCode = () => {
  const email = codeEmail.value;
  codeEmail.value = onlyNumbers(email.replace(" ", "")).slice(0, 4);
  errorInputs.value.codeEmail = "";
};

const verifyEmail = () => {
  email.value = email.value.replace(" ", "");
  if (!regexEmail(email.value)) {
    errorInputs.value.email = t(`${moduleEmail}.status.invalidEmail`);
  } else {
    errorInputs.value.email = t(`${moduleEmail}.status.validEmail`);
  }
};

const cancelEdit = () => {
  stateEmail.value = {};
  errorInputs.value = {};
  email.value = "";
  codeEmail.value = "";
  setTimeout(() => {
    emit("closeTag");
  }, 10);
};

const saveEmail = async () => {
  globalStore.loading = true;
  const data = email.value;
  const body = { code: Number(codeEmail.value), type: "email", data };
  try {
    const resp = await userStore.updatedEmalAndPhone(body);
    if (resp) {
      userStore.mySettings.form.email = resp.email;
      cancelEdit();
    } else {
      errorInputs.value.codeEmail = t(`${moduleEmail}.errors.incorrectCode`);
    }
  } catch (error) {
    console.log(error);
    if (error == 400) {
      errorInputs.value.codeEmail = t(`${moduleEmail}.errors.incorrectCode`);
      verifyEmail();
    }
    if (error == 401)
      errorInputs.value.email = t(`${moduleEmail}.errors.emailInUse`);
  } finally {
    globalStore.loading = false;
  }
};
</script>

<template>
  <div class="email">
    <span class="text">{{ t(`${moduleEmail}.description`) }}</span>

    <div v-if="!stateEmail.withCode">
      <div
        v-if="!stateEmail.loading"
        style="display: flex; align-items: center; gap: 10px"
      >
        <label class="label">{{ t(`${moduleEmail}.sendCode`) }}</label>
        <u-button-icon
          icon="email"
          type="outlined"
          size="s"
          @action-btn="sendCode"
        />
        <u-button-icon icon="phone" type="outlined" size="s" :disabled="true" />
      </div>
      <div v-else-if="stateEmail.loading">
        <div></div>
        <u-loading :width="16" style="margin-right: 12px" />
        <span class="text">{{ t(`${moduleEmail}.status.sendingCode`) }}</span>
        <div></div>
      </div>
    </div>
    <div class="email__input" v-if="stateEmail.withCode">
      <label>{{ t(`${moduleEmail}.inputs.validationCode.label`) }}</label>
      <u-input
        v-model="codeEmail"
        size="s"
        @input="verifyCode"
        :error="
          errorInputs.codeEmail === t(`${moduleEmail}.errors.incorrectCode`)
        "
      />
      <div
        class="msgCode"
        v-show="
          errorInputs.codeEmail === t(`${moduleEmail}.errors.incorrectCode`)
        "
      >
        <span class="u u-cancel" style="color: var(--bg-danger-500)"></span>
        <span style="color: var(--bg-danger-500)">{{
          errorInputs.codeEmail
        }}</span>
      </div>
    </div>
    <div class="email__input" v-if="stateEmail.withCode">
      <label>{{ t(`${moduleEmail}.inputs.newEmail.label`) }}</label>
      <u-input v-model="email" size="s" @input="verifyEmail" />
      <div class="msgCode" v-show="errorInputs.email">
        <span
          :class="`u u-${
            errorInputs.email === t(`${moduleEmail}.status.validEmail`)
              ? 'check'
              : 'cancel'
          }`"
          :style="`color: var(${
            errorInputs.email === t(`${moduleEmail}.status.validEmail`)
              ? '--bg-success-500'
              : '--bg-danger-500'
          });`"
        ></span>
        <span
          :style="`color: var(${
            errorInputs.email === t(`${moduleEmail}.status.validEmail`)
              ? '--bg-success-500'
              : '--bg-danger-500'
          });`"
          >{{ errorInputs.email }}</span
        >
      </div>
    </div>
    <div class="email__actions">
      <u-button
        :text="t(`${module}.buttons.cancel`)"
        type="outlined"
        size="s"
        @action-btn="cancelEdit"
      />
      <u-button
        :text="t(`${module}.buttons.save`)"
        class="btnMainModify"
        size="s"
        :disabled="
          !(
            errorInputs.email === t(`${moduleEmail}.status.validEmail`) &&
            codeEmail.length === 4
          )
        "
        @action-btn="saveEmail"
      />
    </div>
  </div>
</template>

<style scoped>
.email {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.email .text {
  font-size: 14px;
  font-weight: 600;
  line-height: 20px;
  letter-spacing: 0em;
  text-align: left;
  color: var(--neutral-text-caption);
  margin-bottom: 5px;
}
.email .vignette {
  font-size: 14px;
  font-weight: 600;
  line-height: 14px;
  letter-spacing: 0em;
  text-align: left;
  color: var(--neutral-text-body);
}
.email .vignette:last-of-type {
  margin-bottom: 15px;
}
.email .email__input {
  display: grid;
  grid-template-columns: 180px 1fr 180px;
  align-items: center;
}
.email .email__input label,
.label,
.text {
  font-size: 14px;
  font-weight: 400;
  line-height: 16px;
  letter-spacing: 0em;
  text-align: left;
  color: var(--neutral-text-body);
}
.email .email__input div:last-child,
.msgCode {
  display: flex;
  gap: 5px;
  align-items: center;
  padding: 0 20px;
}
.email .email__input div span {
  font-size: 12px;
  font-weight: 400;
  line-height: 16px;
  letter-spacing: 0em;
  text-align: left;
}
.email .email__input div span:nth-child(1) {
  font-size: 14px;
}
.email__actions {
  display: flex;
  justify-content: flex-end;
  gap: 20px;
  padding-top: 15px;
}
.email__actions-password {
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
