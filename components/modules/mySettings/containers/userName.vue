<script setup>
import { defineProps, ref, defineEmits } from "vue";
import { debounce } from "@/utils/helpers";
import useUserStore from "@/stores/user";
import useGlobalStore from "@/stores/global";
import { useI18n } from "vue-i18n";

// Translation
const { t, locale } = useI18n();

const module = "modules.mySettings";
const moduleAccountUsername =
  module + ".sections.accountSettings.sections.username";

// Stores
const userStore = useUserStore();
const globalStore = useGlobalStore();

// Emits
const emit = defineEmits(["closeTag"]);

// Props
const props = defineProps({
  expand: {
    type: Boolean,
    default: false,
  },
});

// Constants
const toSearch = ref(userStore.mySettings.form.username);
const loading = ref(false);
const valid = ref(null);

// Functions
const toSearchUsername = debounce(async () => {
  try {
    toSearch.value = toSearch.value.trim();
    if (toSearch.value === "") valid.value = false;
    else {
      loading.value = true;
      await userStore.findByUserName(toSearch.value);
      if (Object.keys(userStore.usersByUserName).length) {
        valid.value = false;
      } else {
        valid.value = true;
      }
      loading.value = false;
    }
  } catch {
    console.error(error);
  }
}, 600);

const cancel = () => {
  const username = userStore.mySettings.formOriginal.username;
  toSearch.value = JSON.parse(JSON.stringify(username));
  setTimeout(() => {
    emit("closeTag");
  }, 10);
};

const save = async () => {
  globalStore.loading = true;
  try {
    await userStore.updatedUserName(toSearch.value);
    userStore.mySettings.form.username = toSearch.value;
    userStore.mySettings.formOriginal.username = toSearch.value;
  } catch (error) {
    console.error(error);
  } finally {
    globalStore.loading = false;
    valid.value = null;
    cancel();
  }
};
</script>

<template>
  <div class="username">
    <span class="description">{{
      t(`${moduleAccountUsername}.edit.description`)
    }}</span>
    <span class="user"
      >unabase.com/contact/<strong>{{ toSearch }}</strong></span
    >
    <div class="username__input">
      <span class="text">{{ t(`${moduleAccountUsername}.label`) }}</span>
      <u-input
        size="s"
        style="width: 100%"
        v-model="toSearch"
        @input="toSearchUsername"
      />
      <div class="state">
        <template v-if="loading">
          <u-loading :width="20" />
          <span>{{
            t(`${moduleAccountUsername}.edit.statusUsername.verifying`)
          }}</span>
        </template>
        <template
          v-else-if="
            valid !== null && toSearch !== userStore.mySettings.form.username
          "
        >
          <span
            :class="`u u-${valid ? 'success-filled' : 'error-filled'}`"
          ></span>
          <span :class="valid ? 'valid' : 'novalid'">{{
            valid
              ? t(`${moduleAccountUsername}.edit.statusUsername.available`)
              : t(`${moduleAccountUsername}.edit.statusUsername.notAvailable`)
          }}</span>
        </template>
      </div>
    </div>
    <div class="username__actions">
      <u-button
        :text="t(`${module}.buttons.cancel`)"
        type="outlined"
        size="s"
        @click="cancel"
      />
      <u-button
        :text="t(`${module}.buttons.save`)"
        size="s"
        @click="save"
        :disabled="!valid"
      />
    </div>
  </div>
</template>

<style scoped>
.username {
  height: v-bind("props.expand ? 'auto' : '0px'");
  overflow: auto;
  display: grid;
  grid-template-columns: 1fr;
  grid-auto-rows: min-content;
  align-items: start;
  gap: 10px;
  padding-right: 16px;
}
.description,
.text {
  padding-top: 16px;
  font-size: 14px;
  line-height: 20px;
  color: var(--neutral-text-caption);
}
.username__input .text {
  padding-top: 0px;
}
.username__input {
  display: grid;
  grid-template-columns: 140px 1fr 140px;
  gap: 20px;
  align-items: center;
  padding: 20px 0;
}
.user {
  font-size: 14px;
  font-weight: 600;
  line-height: 20px;
  color: var(--neutral-text-body);
  position: relative;
  padding-left: 20px;
}
.user::after {
  content: "";
  width: 6px;
  height: 6px;
  border-radius: 5px;
  background-color: var(--primary-surface-default);
  left: 0px;
  top: calc(50% - 3px);
  position: absolute;
}

span {
  font-family: Nunito;
  text-align: left;
  text-underline-position: from-font;
  text-decoration-skip-ink: none;
}

strong {
  color: var(--primary-text-default);
}

.username__actions {
  display: flex;
  justify-content: flex-end;
  gap: 20px;
}
.state {
  display: flex;
  gap: 10px;
  width: 100%;
}
.state .u {
  font-size: 20px;
  font-weight: 400;
}
.state span {
  font-size: 14px;
  font-weight: 600;
  line-height: 18px;
  color: var(--neutral-text-caption);
}
.state span.valid {
  color: var(--success-text-darker);
}
.state span.novalid {
  color: var(--danger-text-darker);
}

@media only screen and (max-width: 1200px) {
  .username__input {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 5px;
    width: 100%;
  }
  .state {
    justify-content: flex-end;
  }
}
</style>
