<script setup>
import { computed } from "vue";
import useUserStore from "@/stores/user";
import useGlobalStore from "@/stores/global";
import defaultUrl from "/img/default-avatar.png";
import { useI18n } from "vue-i18n";

// Translation
const { t, locale } = useI18n();
const module = "modules.mySettings";

//emits
const emit = defineEmits(["cleanLinks"]);

// Stores
const userStore = useUserStore();
const globalStore = useGlobalStore();

// Constants
const defaultImg = defaultUrl;

// Computed
const user = computed(() => userStore.profile);
const validForm = computed(() => {
  const { form } = userStore.mySettings;
  const isValid = {
    legalName: form?.data?.legalName?.trim() !== "",
    // rut: form?.data?.idNumber?.trim() !== "",
    // country: form?.address?.country?.name?.trim() !== "",
  };
  Object.keys(isValid).forEach((key) => {
    userStore.mySettings.errors[key] = !isValid[key];
  });
  return Object.values(isValid).every((v) => v);
});

// Functions
const handleFileUpload = async (e) => {
  if (!e.target.files || !e.target.files[0]) {
    return;
  }

  if (e.target.files[0]) {
    const file = e.target.files[0];

    let formData = new FormData();
    formData.append("file", file);

    globalStore.loading = true;
    const resp = await userStore.updatedImageUser(formData);
    if (resp) {
      await userStore.getUserByToken();
      const reader = new FileReader();
      reader.onload = function (e) {
        user.value.imgUrl = e.target.result;
      };

      reader.readAsDataURL(file);
    }

    globalStore.loading = false;
  }
};

const save = async () => {
  if (validForm.value) {
    globalStore.loading = true;
    const body = userStore.mySettings.form;
    const resp = await userStore.updateUser(body);
    if (resp.success) {
      userStore.user = resp.data;
      userStore.profile = resp.data;
    }
    userStore.mySettings.form = userStore.fillMissingProperties(userStore.user);
    userStore.mySettings.formOriginal = userStore.fillMissingProperties(
      userStore.user,
    );
    // userStore.mySettings.tab = 0;
    userStore.mySettings.errors = {};
    userStore.mySettings.change = false;
    globalStore.loading = false;
  } else {
    userStore.mySettings.tab = 0;
  }
};

const cancel = async () => {
  userStore.mySettings = {
    form: JSON.parse(JSON.stringify(userStore.mySettings.formOriginal)),
    tab: userStore.mySettings.tab,
    formOriginal: userStore.mySettings.formOriginal,
    errors: {},
    change: false,
  };
  emit("cleanLinks");
};
</script>

<template>
  <div class="header">
    <div class="header__avatar">
      <img :src="user?.imgUrl || defaultImg" alt="myUser" />
      <input
        type="file"
        name="img"
        id="img"
        @change="handleFileUpload($event)"
        accept="image/*"
        style="display: none"
      />
      <label class="header__avatarBtn" for="img">
        <span class="u u-camera"></span>
      </label>
    </div>
    <div class="header__text">
      <div class="title">
        <h2>{{ user?.data?.legalName || "-" }}</h2>
        <span class="u u-verified"></span>
      </div>
      <span class="nickname">{{ user?.data?.nickName || "-" }}</span>
      <span class="email">{{ user?.email || "-" }}</span>
    </div>
    <div class="header__actions">
      <u-button
        :text="t(`${module}.buttons.undoChanges`)"
        type="outlined"
        v-if="userStore.mySettings.change"
        @click="cancel"
      />
      <u-button
        :text="t(`${module}.buttons.save`)"
        v-if="userStore.mySettings.change"
        :disabled="Object.values(userStore.mySettings.errors).some(Boolean)"
        class="save"
        @click="save"
      />
      <!-- <u-button-icon icon="share" type="outlined" class="btnShare" /> -->
    </div>
  </div>
</template>

<style scoped>
.header {
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: 24px;
  height: 120px;
}
/* Avatar */
.header__avatar {
  position: relative;
  height: 120px;
}
.header__avatar img {
  object-fit: cover;
  width: 120px;
  height: 120px;
  border-radius: 50%;
}
.header__avatarBtn {
  position: absolute;
  border-radius: 50%;
  background-color: var(--bg-primary-500);
  cursor: pointer;
  height: 48px;
  width: 48px;
  display: flex;
  justify-content: center;
  align-items: center;
  transition: 0.3s;
  color: var(--white);
  font-size: 28px;
  line-height: 28px;
  bottom: 0px;
  right: 0px;
  z-index: 2;
}
.header__avatarBtn:hover {
  background-color: var(--bg-primary-400);
  box-shadow: var(--shadow-2);
}
/* Text */
.header__text {
  display: flex;
  flex-direction: column;
  justify-content: center;
  height: 120px;
}
.header__text .title {
  display: flex;
  gap: 10px;
  align-items: center;
}
.header__text .title h2 {
  font-size: 24px;
  font-weight: 600;
  line-height: 36px;
  color: var(--neutral-text-body);
}
.header__text .title span {
  font-size: 24px;
}
.header__text span.nickname {
  font-size: 18px;
  font-weight: 600;
  line-height: 24px;
  color: var(--neutral-text-caption);
}
.header__text span.email {
  font-size: 16px;
  font-weight: 600;
  line-height: 20px;
  color: var(--primary-text-default);
}
/* Actions */
.header__actions {
  display: flex;
  gap: 20px;
}
.header__actions ::v-deep(button.btnShare) {
  border-radius: 50%;
}

/* Global */
span,
h2 {
  font-family: Nunito;
  text-align: left;
  text-underline-position: from-font;
  text-decoration-skip-ink: none;
}
.save {
  animation: pulse ease-in-out 1s infinite;
}
@keyframes pulse {
  0% {
    box-shadow: 0 0 0 0 rgb(225, 244, 241, 0.3);
  }
  70% {
    box-shadow: 0 0 0 10px rgba(224, 75, 75, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(224, 75, 75, 0);
  }
}
</style>
