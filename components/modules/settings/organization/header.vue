<script setup>
import { ref, defineProps, watch, defineEmits } from "vue";
import useOrganizationStore from "@/stores/organization";
import useGlobalStore from "@/stores/global";
import useUserStore from "@/stores/user";
import usePermissionStore from "@/stores/permissions";
import { useI18n } from "vue-i18n";
// import middlewarePermisssionActivation from "~/composables/usePermissionActivation";

// TRNASLATE
const { t } = useI18n();
const module = "modules.organizations.settings";

// ROUTER
const router = useRouter();

// STORE
const organizationStore = useOrganizationStore();
const globalStore = useGlobalStore();
const userStore = useUserStore();
const permissionStore = usePermissionStore();

const props = defineProps({
  idUser: {
    type: String,
    default: null,
  },
  tabs: {
    type: Array,
    default: () => [],
  },
});

const emit = defineEmits(["selectedTab"]);

const tabSelected = ref(organizationStore.page.tab);

// Cambio de pestaña de configuración de acuerdo a los permisos de settings
const changeTabPermissionsConfig = () => {
  const { settings_business_areas, settings_validations } =
    permissionStore.myPermissions;
  const isTabThree = organizationStore.page.tab === 3;

  if (!isTabThree) return;

  const hasBusinessAreas = !settings_business_areas;
  const hasValidations = !settings_validations;

  if (hasBusinessAreas && hasValidations) {
    organizationStore.page.option = 4;
  } else if (hasBusinessAreas) {
    organizationStore.page.option = 2;
  } else {
    organizationStore.page.option = 0;
  }
};

async function updateMiddlewarePermissions() {
  const allowedTabs = [1, 3]; // vistas permitidas para activar el middleware
  const isAllowedTab = allowedTabs.includes(organizationStore.page.tab);
  if (!isAllowedTab) return;

  // await middlewarePermisssionActivation("settingsBusinessAreas", {}, false);
  // await middlewarePermisssionActivation("settingsValidations", {}, false);
}

const goToMySettings = () => {
  const path = `/my-settings`;
  userStore.mySettings.tab = 3;
  router.push(path);
};

watch(tabSelected, async () => {
  organizationStore.page.tab = tabSelected.value;
  globalStore.loading = true;
  console.log("wenino");
  await organizationStore.getOrganizationById();

  await updateMiddlewarePermissions();
  changeTabPermissionsConfig();

  globalStore.loading = false;
});
</script>

<template>
  <div class="organizationHeader">
    <img
      :src="organizationStore.organization.imgUrl || '/img/companyDefault.png'"
      :alt="organizationStore.organization.razon_social"
    />
    <div class="organizationHeader__title">
      <div class="left">
        <h2 class="truncateText">
          {{ organizationStore.titleOrg }}
        </h2>
      </div>
      <div class="right">
        <span class="u u-"></span>
        <u-button
          size="xs"
          :text="t(`${module}.buttons.backMyOrganizations`)"
          icon="undo"
          type="text"
          @click="goToMySettings"
        />
      </div>
    </div>
    <u-tabs
      ss
      :tabs="props.tabs"
      v-model="tabSelected"
      :fullscreen="false"
      class="organizationHeader__tab"
    />
  </div>
</template>

<style scoped>
.organizationHeader {
  display: grid;
  grid-template-columns: 80px 1fr;
  grid-template-rows: 1fr 32px;
  grid-template-areas: "logo title" "logo tab";
  column-gap: 20px;
}
.organizationHeader img {
  width: 80px;
  height: 80px;
  object-fit: cover;
  border-radius: 16px;
  grid-area: logo;
}
.organizationHeader__title {
  grid-area: title;
  display: flex;
  justify-content: space-between;
}
.organizationHeader__title .left {
  display: flex;
  width: 60%;
}
.organizationHeader__title .right {
  display: flex;
  width: 40%;
  justify-content: flex-end;
  align-items: flex-start;
}
.organizationHeader__title h2 {
  font-family: Nunito;
  font-size: 24px;
  font-weight: 600;
  line-height: 36px;
  text-align: left;
  color: var(--neutral-text-body);
  width: 100%;
}
.organizationHeader__title a.link {
  font-family: Nunito;
  font-size: 14px;
  font-weight: 600;
  line-height: 18px;
  text-align: left;
  color: var(--primary-text-default);
}
.organizationHeader__tab {
  grid-area: tab;
}
</style>
