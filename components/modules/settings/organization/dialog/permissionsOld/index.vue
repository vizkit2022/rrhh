<script setup>
import { useI18n } from "vue-i18n";
import usePermissionStore from "@/stores/permissions";
import middlewarePermisssionActivation from "~/composables/usePermissionActivation";

//STORE
const permissionStore = usePermissionStore();

/* DEFINICIÓN DE PROPS Y EMITS  */

const emit = defineEmits(["closeModal", "updatedMembers"]);

const { t } = useI18n();
const module = "modules.organizations.settings.members.modal.listPermissions";

const tabs = computed(() => [
  {
    label: t(`${module}.tags.titlePermissions`),
    tab: 0,
    disabled: false,
  },
  {
    label: t(`${module}.tags.titleBusinessAreas`),
    tab: 1,
    disabled: !permissionStore.myPermissions?.settings_business_areas,
  },
  {
    label: t(`${module}.tags.titleNotifications`),
    tab: 2,
    disabled: false,
  },
]);

onUnmounted(() => {
  permissionStore.cleanPropsListPermissions();
});
</script>

<template>
  <div class="modal">
    <SettingsOrganizationDialogPermissionsHeader
      @closeModal="emit('closeModal')"
    />

    <div class="modal__content">
      <u-tabs
        class="tabs"
        :tabs="tabs"
        v-model="permissionStore.propsListPermissions.tabSelected"
      />

      <!-- permissions estables -->
      <!-- <SettingsOrganizationDialogPermissionsContentListPermissions  @updatedMembers="emit('updatedMembers')" v-if="permissionStore.propsListPermissions.tabSelected === 0" /> -->

      <!-- new permissions -->
      <SettingsOrganizationDialogPermissionsContentNewListPermissions
        @updatedMembers="emit('updatedMembers')"
        v-if="permissionStore.propsListPermissions.tabSelected === 0"
      />
      <SettingsOrganizationDialogPermissionsContentBusinessAreas
        v-if="permissionStore.propsListPermissions.tabSelected === 1"
      />

      <SettingsOrganizationDialogPermissionsContentNotifications
        v-if="permissionStore.propsListPermissions.tabSelected === 2"
      />
    </div>
  </div>
</template>

<style scoped>
.modal {
  height: 100%;
  display: grid;
  grid-template-rows: 52px 662px;
  gap: 24px;
}
.modal__content {
  display: flex;
  flex-direction: column;
  gap: 25px;
}
</style>
