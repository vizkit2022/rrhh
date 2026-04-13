<script setup>
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import usePermissionStore from "@/stores/permissions";

// COMPONENTS
import {
  SettingsOrganizationDialogPermissionsPermission,
  SettingsOrganizationDialogPermissionsBusinessArea,
  SettingsOrganizationDialogPermissionsNotification,
} from "#components";

// CONTAINERS
const VIEWS = {
  1: SettingsOrganizationDialogPermissionsPermission,
  2: SettingsOrganizationDialogPermissionsBusinessArea,
  3: SettingsOrganizationDialogPermissionsNotification,
};

//STORE
const permissionStore = usePermissionStore();

// EMITS
const emit = defineEmits(["closeModal", "updatedMembers"]);

// Constants
const { t } = useI18n();
const KEY_LABELS =
  "modules.organizations.settings.members.modal.permissions.tabs";

// COMPUTED
const tabs = computed(() => [
  {
    label: t(`${KEY_LABELS}.tab1`),
    tab: 1,
  },
  {
    label: t(`${KEY_LABELS}.tab2`),
    tab: 2,
    disabled: !permissionStore.myPermissions?.settings_business_areas && permissionStore.loadingBusinessAreas,
  }
]);
const viewComputed = computed(() => {
  const tab = permissionStore.modalPermissions.tab || 1;
  return VIEWS[tab];
});

</script>

<template>
  <SettingsOrganizationDialogPermissionsPermissionConfirm  v-if="permissionStore.modalPermissions.confirm" @closeModal="emit('closeModal')" />

  <div class="modalPermission" v-else>
    <SettingsOrganizationDialogPermissionsHeader @closeModal="emit('closeModal')" />
    <u-tabs :tabs="tabs" v-model="permissionStore.modalPermissions.tab" />
    <component :is="viewComputed" @closeModal="emit('closeModal')" />
  </div>

</template>

<style scoped>
.modalPermission {
  width: calc(100vw - 200px);
  max-width: 1000px;
  height: calc(100vh - 200px);
  max-height: 800px;
  display: grid;
  grid-template-rows: 40px 32px 1fr;
  gap: 24px;
}

@media only screen and (max-width: 768px) {
  .modalPermission {
    width: calc(100vw - 40px);
    max-width: 100vw;
    height: calc(100vh - 40px);
    max-height: 100vh;
  }
}
</style>
