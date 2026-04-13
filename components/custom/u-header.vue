<script setup>
import { computed, ref, onMounted, watch, watchEffect } from "vue";
import urlImg from "/img/default-user.png";
import useGlobalStore from "@/stores/global";
import useUserStore from "@/stores/user";
import useOrganizationStore from "@/stores/organization";
import { formatTitle } from "@/utils/helpers";
import { useRouter } from "vue-router";
import { useI18n } from "vue-i18n";
const { locale, locales, setLocale } = useI18n();
const defaultImg = urlImg;
const globalStore = useGlobalStore();
const userStore = useUserStore();
const organizationStore = useOrganizationStore();

const { t } = useI18n();
const custom = "global.text";

const router = ref(null);
const namesState = computed(() => ({
  opportunity: "Oportunidad",
  budget: t(custom + ".budget"),
  business: t(custom + ".business"),
}));
const colorsState = {
  opportunity: "--primary-text-default",
  budget: "--warning-text-default",
  business: "--info-text-default",
};
const backgroundState = {
  opportunity: "--primary-surface-shadow-8a",
  budget: "--warning-surface-shadow-8a",
  business: "--info-surface-shadow-8a",
};
const user = ref({
  name: "",
  src: defaultImg,
});

// Define variables
const writing = ref(false);
const dropdown = ref(false);
const dropdownNotifications = ref(false);
const focusInput = ref(false);
const toFind = ref("");
const editText = {
  es: "Editar",
  en: "Edit",
};

// Define computed properties
const containerSearchClass = computed(() => {
  return writing.value ? "hoverInput" : "";
});
const updatedInfo = () => {
  user.value = {
    name: userStore.userSession?.data?.legalName,
    src: userStore.userSession?.imgUrl || defaultImg,
  };
};

// WATCHS
watch(
  () => userStore.userSession,
  () => {
    updatedInfo();
  },
);

// Define event listeners
onMounted(async () => {
  router.value = useRouter();
  updatedInfo();
  document.addEventListener("click", (event) => {
    if (
      event.target !== document.querySelector(".containerOptions") &&
      !event.target.closest(".containerAvatar")
    ) {
      dropdown.value = false;
    }

    if (
      event.target !==
        document.querySelector(".containerOptionsNotifications") &&
      !event.target.closest(".containerNotifications")
    ) {
      dropdownNotifications.value = false;
    }
  });
});

const dropdownUpdated = (state) => {
  dropdown.value = state;
};

const dropdownNotificationsUpdated = (state) => {
  dropdownNotifications.value = state;
};

const toggleLanguage = () => {
  // Si el idioma actual es 'es', cambia a 'en'; de lo contrario, cambia a 'es'
  setLocale(locale.value === "es" ? "en" : "es");
  globalStore.lang = globalStore.lang === "es" ? "en" : "es";
};

const changeThemeLocal = () => {
  globalStore.isDark = !globalStore.isDark;
  useCookie("localTheme").value = globalStore.isDark ? "dark" : "light";
};
</script>

<template>
  <div class="containerCustomHeader">
    <div class="containerCustomHeader_text">
      <u-breadcrumb />
      <div class="containerCustomHeader_text-title">
        <h2 class="truncateText">
          {{ formatTitle(globalStore.title) || "..." }}
        </h2>
        <u-button-icon
          v-if="globalStore.edit"
          type="text"
          icon="edit"
          @action-btn="$bus.$emit('showModalEditPage', true)"
          :tooltip="editText[globalStore.lang]"
          orientationTooltip="bottom"
          :disabled="globalStore.disabled"
        />
        <u-tags
          v-if="globalStore.tag"
          :text="namesState[globalStore.tag] || ''"
          size="s"
          :color="colorsState[globalStore.tag]"
          :background="backgroundState[globalStore.tag]"
          :delete="false"
          class="tagModify"
        />
      </div>
    </div>
    <div class="containerCustomHeader_search">
      <div class="containerSearch" :class="containerSearchClass">
        <button><span class="u u-search"></span></button>
        <input
          :placeholder="$t('global.text.search')"
          type="text"
          v-model="toFind"
          class="input"
          @mouseover="writing = true"
          @mouseleave="writing = focusInput"
          @focus="((focusInput = true), (writing = true))"
          @blur="((focusInput = false), (writing = false))"
        />
      </div>
      <div class="containerNotifications">
        <button
          class="iconBtnCustom"
          title="Notificaciones (Ctrl + N)"
          @click="dropdownNotifications = !dropdownNotifications"
          :disabled="true"
        >
          <span class="u u-notification"></span>
          <span class="dot"></span>
        </button>
        <u-header-notifications
          :dropdown="dropdownNotifications"
          :user="user"
          class="containerOptionsNotifications"
          @dropdownUpdated="dropdownNotificationsUpdated"
        />
      </div>
      <div class="containerAvatar">
        <button @click="dropdown = !dropdown" class="containerAvatar__btn">
          <div class="containerAvatar__img">
            <u-avatar v-if="user" :user="user" :size="40" />
            <u-avatar
              :user="{
                name: 'My Company',
                src:
                  organizationStore.organization.imgUrl ||
                  '/img/companyDefault.png',
              }"
              :size="28"
              class="avatarOrganization"
            />
          </div>
          <div class="containerAvatar__text">
            <label>{{ $t("global.text.organization") }}</label>
            <div>
              <span class="truncateText">{{
                // organizationStore.organization.default
                //   ? "Mi Unabase"
                //   : organizationStore.organization.razon_social
                organizationStore.aliasOrg || "..."
              }}</span>
              <span
                class="u u-selector_down"
                :style="`transform: rotate(${
                  dropdown ? '180' : '0'
                }deg); transition: 0.3s;`"
              ></span>
            </div>
          </div>
        </button>
        <u-header-menu
          :dropdown="dropdown"
          :user="user"
          class="containerOptions"
          @dropdownUpdated="dropdownUpdated"
        />
      </div>
      <button class="iconBtnCustom" @click="toggleLanguage">
        <span
          :class="`u u-${globalStore.lang === 'es' ? 'language-es' : 'language-us'}`"
        ></span>
      </button>
      <button class="iconBtnCustom" @click="changeThemeLocal">
        <span :class="`u u-${globalStore.isDark ? 'moon' : 'sun'}`"></span>
      </button>
    </div>
  </div>
</template>

<style scoped>
.containerCustomHeader {
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  box-sizing: border-box;
}
.containerCustomHeader_text {
  padding-left: 24px;
}
.containerCustomHeader_text-title {
  display: flex;
}
.containerCustomHeader_text-title h2 {
  font-size: 24px;
  line-height: 36px;
  font-weight: 600;
  color: var(--neutral-text-body);
  display: block;
  gap: 5px;
  width: auto;
  max-width: calc(100vw - 640px);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.containerCustomHeader_search {
  background-color: var(--neutral-background-default);
  border-radius: 24px;
  height: 56px;
  display: grid;
  grid-template-columns: 1fr 40px minmax(210px, 230px) 40px 40px;
  align-items: center;
  box-sizing: border-box;
  padding: 0 8px;
  gap: 8px;
  transition: 0.3s;
  box-shadow: var(--elevation-l);
}
.containerSearch {
  display: flex;
  align-items: center;
  height: 40px;
  background: var(--neutral-background-default);
  border-radius: 24px;
  gap: 5px;
  box-sizing: border-box;
  padding: 0 10px;
  transition: 0.3s;
}
.containerSearch button span {
  font-size: 24px;
  line-height: 24px;
  color: var(--neutral-text-caption);
  transition: 0.3s;
}
.containerSearch input {
  width: 70px;
  transition: 0.3s;
  font-family: Nunito;
}
.containerSearch input,
.containerSearch input::placeholder {
  color: var(--neutral-text-caption);
  font-size: 16px;
  line-height: 16px;
}
.containerSearch:hover input,
.containerSearch input:focus {
  width: 250px;
  transition: 0.3s;
}
.containerSearch button:hover span {
  transition: 0.3s;
  color: var(--primary-text-default);
}

.containerNotifications {
  position: relative;
}

.containerAvatar,
.containerAvatar__img {
  position: relative;
}
.avatarOrganization {
  position: absolute;
  right: -20px;
  bottom: 0;
  border-radius: 10px;
}
.containerAvatar button {
  width: 100%;
  display: flex;
  gap: 30px;
  align-items: center;
}
.containerAvatar .containerAvatar__btn {
  width: 230px;
}
.containerAvatar__text {
  display: flex;
  flex-direction: column;
}
.containerAvatar__text div {
  display: flex;
  justify-content: space-between;
  width: 155px;
  padding-left: 5px;
}
.containerAvatar__text div span:nth-child(1) {
  font-family: Nunito;
  font-size: 16px;
  font-weight: 600;
  line-height: 20px;
  text-align: left;
  color: var(--neutral-text-caption);
  text-transform: capitalize;
}
.containerAvatar__text div span:nth-child(2) {
  font-size: 20px;
  line-height: 20px;
  color: var(--neutral-text-caption);
}
.containerAvatar__text label {
  font-family: Nunito;
  font-size: 10px;
  font-weight: 400;
  line-height: 14px;
  letter-spacing: 0.1em;
  color: var(--neutral-text-caption);
  text-transform: uppercase;
  text-align: left;
}
.iconBtnCustom {
  border: none;
  cursor: pointer;
  transition: 0.3s;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: var(--neutral-background-default);
  display: flex;
  justify-content: center;
  align-items: center;
}
.iconBtnCustom span {
  font-size: 24px;
  line-height: 24px;
  color: var(--neutral-text-caption);
  transition: 0.3s;
}
.iconBtnCustom:disabled {
  cursor: not-allowed;
  opacity: 0.5;
  transition: 0.3s;
}
.iconBtnCustom:hover,
.hoverInput,
.containerSearch:hover {
  background: var(--neutral-background-darker);
  transition: 0.3s;
}
.iconBtnCustom:hover span {
  color: var(--primary-text-default);
  transition: 0.3s;
  animation: swing ease-in-out 0.5s 1 alternate;
}

.iconBtnCustom:hover .dot {
  background-color: var(--primary-text-default);
}

@keyframes swing {
  0%,
  30%,
  50%,
  70%,
  100% {
    transform: rotate(0deg);
  }

  10% {
    transform: rotate(10deg);
  }

  40% {
    transform: rotate(-10deg);
  }

  60% {
    transform: rotate(5deg);
  }

  80% {
    transform: rotate(-5deg);
  }
}

.dot {
  position: absolute;
  top: 50%;
  right: 8px;
  width: 12px;
  height: 12px;
  background-color: var(--danger-text-default);
  border-radius: 70%;
}

.iconBtnCustom:hover .dot {
  animation: pulse 0.4s ease-in-out;
}

@keyframes pulse {
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.3);
  }
  100% {
    transform: scale(1);
  }
}

/* Modificaacion de customs components */
.btnModify {
  justify-content: flex-start;
}
.btnModify span {
  font-weight: 200 !important;
  font-size: 20px;
}
.tagModify {
  transform: scale(0.8);
  margin: 8px 0 0 -10px;
}

@media only screen and (max-width: 768px) {
  .containerCustomHeader {
    padding-top: 0;
  }
}
</style>

estoy intentando cambiar el locale global pero solo me cambia a nivel
componente, ademas la cookie tampoco es afectada
