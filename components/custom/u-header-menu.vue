<script setup>
import { defineProps, defineEmits, ref } from "vue";
import useOrganizationStore from "@/stores/organization";
import useUserStore from "@/stores/user";
import useAuthStore from "@/stores/auth";
import useGlobalStore from "@/stores/global";
import usePermissionsStore from "@/stores/permissions";
import { capitalizeFirstLetter } from "@/utils/helpers";
const authStore = useAuthStore();
const organizationStore = useOrganizationStore();
const userStore = useUserStore();
const globalStore = useGlobalStore();
const permissionsStore = usePermissionsStore();
const router = useRouter();
const config = useRuntimeConfig();
// EMITS
const emit = defineEmits(["dropdownUpdated"]);
// PROPS
const props = defineProps({
  dropdown: {
    type: Boolean,
    default: false,
  },
  user: {
    type: Object,
    default: () => {},
  },
});
// CONSTATNS
const { t } = useI18n();
const module = "global.text";

// ACTIONS
const goToPage = (path) => {
  if (path === "login") {
    const idOrganization = useCookie("organization").value;
    if (idOrganization) organizationStore.saveLastOrganization(idOrganization);
    setTimeout(() => authStore.logOut(), 100);
  } else router.push(`/${path}` || "/home");
  emit("dropdownUpdated", false);
};
const getCompany = async (id, typeRedirect = "org") => {
  const orgId = useCookie("organization");
  if (id !== orgId.value) {
    orgId.value = id;
    globalStore.organizationId = id;
    globalStore.changeOrg = true;
    if (typeRedirect === "settings") {
      globalStore.isRedirectConfig = true;
    } else if (typeRedirect === "org") {
      goToPage("incomes");
    }
  }
  emit("dropdownUpdated", false);
};
const getCompanyWithSettings = async (id) => {
  await getCompany(id, "settings");
  goToPage(`settings/${id}/organization`);
};
const goToProfile = (tab) => {
  userStore.mySettings.tab = tab;
  setTimeout(() => {
    goToPage("my-settings");
  }, 10);
};
const owner = (org) => {
  if (org.default) return true;
  return org.owner._id === userStore.userSession._id;
};

const ownerOrg = (org) => {
  return org.owner._id === userStore.userSession._id;
};

const handleEsc = (event) => {
  if (event.key === "Escape" && props.dropdown) {
    emit("dropdownUpdated", false);
  }
};

const canAccessSettingsOrg = (org) => {
  // if (!organizationStore.organization?._id) return true;
  // if (!permissionsStore.myPermissions) return true;

  const isCurrentOrg = org._id === organizationStore.organization._id;

  if (!isCurrentOrg) return true;

  return (
    permissionsStore.myPermissions.settings_account_info &&
    permissionsStore.myPermissions.page_settings
  );
};

onMounted(() => {
  window.addEventListener("keydown", handleEsc);
});

onUnmounted(() => {
  window.removeEventListener("keydown", handleEsc);
});
</script>

<template>
  <div
    class="headerMenu"
    :style="`transform: scale(${props.dropdown ? 1 : 0})`"
  >
    <span class="headerMenu__title" v-text="t(module + '.organization')"></span>
    <div class="headerMenu__list">
      <div
        class="headerMenu__item"
        v-for="(org, index) in organizationStore.organizationsByUser"
        :key="org._id"
        :class="
          org._id === organizationStore.organization._id ? 'selected' : ''
        "
      >
        <button class="headerMenu__item-avatar" @click="getCompany(org._id)">
          <u-avatar
            :user="{
              name: org.name,
              src: org.imgUrl || '/img/companyDefault.png',
            }"
            :size="28"
            :hover="false"
            style="border-radius: 8px"
          />
          <span class="truncateText">{{
            capitalizeFirstLetter(org.name || org.razon_social)
          }}</span>
          <div
            class="owner"
            v-if="ownerOrg(org)"
            :title="t(module + (org.default ? '.mySpace' : '.owner'))"
          >
            <span
              :class="`u u-circle-${org.default && ownerOrg(org) ? 'home' : ownerOrg(org) ? 'key' : ''}`"
            ></span>
          </div>
        </button>
        <button
          class="headerMenu__item-settings"
          @click="getCompanyWithSettings(org._id)"
          :disabled="!canAccessSettingsOrg(org)"
        >
          <span class="u u-settings"></span>
        </button>
      </div>
    </div>
    <button class="headerMenu__btn" @click="goToPage('organization/create')">
      <span class="u u-building"></span>
      <span class="truncateText" v-text="t(module + '.newOrganization')"></span>
    </button>
    <div class="line"></div>
    <div class="headerMenu__item myUser" v-if="props.user">
      <button class="headerMenu__item-avatar" @click="goToProfile(0)">
        <u-avatar :user="props.user" :size="28" :hover="false" />
        <span v-text="props.user.name" class="truncateText"></span>
      </button>
      <button class="headerMenu__item-settings" @click="goToProfile(2)">
        <span class="u u-settings"></span>
      </button>
    </div>
    <button
      class="headerMenu__btn"
      v-if="config.public.API_URL != 'production'"
      @click="(goToPage(`login/welcome`), (authStore.welcome = true))"
    >
      <span class="u u-undo"></span>
      <span class="truncateText"
        >{{ t(module + ".goToWizard") + " "
        }}<strong>({{ t(module + ".temporary") }})</strong></span
      >
    </button>
    <button class="headerMenu__btn" @click="goToPage('login')">
      <span class="u u-log-out"></span>
      <span class="truncateText" v-text="t(module + '.logOut')"></span>
    </button>
  </div>
</template>

<style scoped>
.headerMenu {
  background-color: var(--neutral-background-default);
  border-radius: 16px;
  height: auto;
  width: 254px;
  z-index: 99;
  position: absolute;
  box-shadow: var(--elevation-m);
  padding: 16px;
  box-sizing: border-box;
  transform-origin: top center;
  transition: transform 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}
span.headerMenu__title {
  font-weight: 400;
  font-size: 10px;
  line-height: 14px;
  letter-spacing: 10%;
  vertical-align: middle;
  text-transform: uppercase;
  color: var(--neutral-text-caption);
}
.headerMenu__item {
  display: grid;
  grid-template-columns: 1fr 20px;
  height: 28px;
  align-items: center;
  padding-left: 8px;
}
.headerMenu__item-avatar {
  display: grid;
  grid-template-columns: 28px 1fr;
  gap: 8px;
  align-items: center;
  position: relative;
}
.headerMenu__item-avatar span,
.headerMenu__btn span:not(.u) {
  font-weight: 400;
  font-size: 14px;
  line-height: 14px;
  letter-spacing: 0%;
  vertical-align: middle;
  color: var(--neutral-text-body);
  text-align: left;
  transition: 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}
.headerMenu__item-avatar:hover span {
  color: var(--primary-surface-subtle);
}
.headerMenu__item-avatar .owner {
  height: 18px;
  width: 18px;
  border-radius: 10px;
  background-color: var(--neutral-background-default);
  position: absolute;
  bottom: 0px;
  left: 16px;
  z-index: 2;
  display: flex;
  justify-content: center;
  align-items: center;
}
.headerMenu__item-avatar .owner span.u {
  font-size: 16px;
  line-height: 16px;
}
.headerMenu__item-settings {
  height: 20px;
  width: 20px;
  justify-content: center;
  align-items: center;
  border-radius: 8px;
  display: none;
}
.headerMenu__item:hover .headerMenu__item-settings {
  display: flex;
}
.headerMenu__item-settings span.u,
.headerMenu__btn span.u {
  font-size: 20px;
  line-height: 20px;
  color: var(--neutral-text-caption);
  transition: 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}
.headerMenu__item-settings:disabled,
.headerMenu__btn:disabled {
  cursor: not-allowed;
}
.headerMenu__item-settings:disabled span.u,
.headerMenu__btn:disabled span.u {
  color: var(--neutral-text-disabled) !important;
}
.headerMenu__item-settings:not(:disabled):hover span.u,
.headerMenu__item.selected span,
.headerMenu__btn:hover span {
  color: var(--primary-surface-subtle);
}
.headerMenu__item-settings:active span.u {
  color: var(--primary-surface-darker);
}
.headerMenu__item.myUser {
  margin-bottom: 5px;
  padding: 0px 8px;
}
.headerMenu__list {
  margin: 10px 0px;
  flex-shrink: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
  height: auto;
  max-height: 280px;
  overflow-y: hidden;
  scrollbar-gutter: stable;
  transition: overflow 0.2s;
}
.headerMenu__list:hover {
  overflow-y: auto;
}
.headerMenu__list::-webkit-scrollbar {
  width: 8px;
  background: var(--neutral-surface-softer);
  border-radius: 20px;
}
.headerMenu__list::-webkit-scrollbar-thumb {
  background: var(--neutral-surface-harder);
  border-radius: 5px;
}
.headerMenu__btn {
  padding: 0 8px;
  display: grid;
  grid-template-columns: 28px 1fr;
  gap: 8px;
  align-items: center;
  height: 28px;
}
.headerMenu__btn span strong {
  color: var(--neutral-text-caption);
  font-weight: 400;
  font-size: 12px;
}

.line {
  height: 1px;
  width: 100%;
  background-color: var(--neutral-surface-subtle);
  margin: 8px 0px 20px;
}
</style>
