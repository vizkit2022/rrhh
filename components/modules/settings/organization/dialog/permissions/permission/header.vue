<script setup>
import { computed, ref, defineEmits } from "vue";
import { useI18n } from "vue-i18n";
import usePermissionStore from "@/stores/permissions";
import useOrganizationStore from "@/stores/organization";
import useGlobalStore from "@/stores/global";

//STORE
const permissionStore = usePermissionStore();
const organizationStore = useOrganizationStore();
const globalStore = useGlobalStore();

// EMITS
const emit = defineEmits(["closeModal"]);

// CONSTANTS
const { t } = useI18n();
const KEY_LABELS = "modules.organizations.settings.members.modal.permissions";
const color = "--neutral-text-caption";

// Variables
const profile = ref(permissionStore?.profileByUserID || {});
const profileName = ref(permissionStore?.profileByUserID?.name?.[globalStore.lang] || "");
const originalPermissions = ref(permissionStore?.permissionsUser);

// Functions
const cleanPermissions = () => {
  permissionStore.modalPermissions.confirm = false;
  permissionStore.modalPermissions.edit = false;
  permissionStore.permissionsUser = JSON.parse(JSON.stringify(originalPermissions.value));
};
const profileList = computed(() => {
  return permissionStore.profilePermissions.map(p => ({
    label: p.name[globalStore.lang],
    _id: p._id,
    fullData: p
  }));
});
const changeProfile = (p) => {
  profileName.value = p.label;
  profile.value = p.fullData;

  const originalProfile = permissionStore.profileByUserID._id;
  permissionStore.modalPermissions.profile = p.fullData;
  // Si selecciono el perfil original
  if(originalProfile === p._id) {
    permissionStore.modalPermissions.edit = false;
    permissionStore.modalPermissions.assigned = false;
  } else {
    permissionStore.modalPermissions.edit = false;
    permissionStore.modalPermissions.assigned = true;

  }
  cleanPermissions();
  permissionStore.assignProfileToMember(p.fullData);
};
const cleanProfilePermissions = () => {
  permissionStore.modalPermissions.confirm = false;
  permissionStore.modalPermissions.assigned = false;
  permissionStore.modalPermissions.edit = false;
  profile.value = permissionStore?.profileByUserID || {};
  profileName.value = permissionStore?.profileByUserID?.name?.[globalStore.lang] || "";
  permissionStore.modalPermissions.profile = permissionStore.modalPermissions.member.permissionsProfile;

  permissionStore.getUiPermissions();
};
const modifyPermissions = () => {
  permissionStore.modalPermissions.edit = true;
  originalPermissions.value = JSON.parse(JSON.stringify(permissionStore.permissionsUser));
};

// Asingar Perfil
const saveAssignProfileToMember = async (profile) => {
  try {
    const body = {
      permissionId: profile._id,
      userId: permissionStore?.modalPermissions?.member?.user?._id,
    };
    globalStore.loading = true;
    await permissionStore.updateProfilePermissions(body);
    const pos = organizationStore.organization.users.findIndex(u => u.user._id === body.userId);
    if(pos !== -1) {
      organizationStore.organization.users[pos].permissionsProfile = {
        _id: profile._id,
        name: profile.name,
      };
    }
  } catch (error) {
    console.error("Error assigning profile to member:", error);
  } finally {
    globalStore.loading = false;
    emit('closeModal');
  }
};

</script>

<template>
  <div class="permission__header">
    <span class="label">{{
      t(KEY_LABELS + ".sections.permission.title")
    }}</span>
    <div style="max-width: 320px;">
      <u-select size="s" :options="profileList" :disabled="!permissionStore.myPermissions.members_listPermissions_edit" v-model="profileName" :full-data="true" @full-data="changeProfile" />
    </div>
    <div v-if="permissionStore.modalPermissions.assigned" class="permission__header-actions">
      <u-button class="desktop" size="s" :text="t(KEY_LABELS + '.sections.permission.texts.text16')" icon="close" type="outlined" :color="color" @click="cleanProfilePermissions" :disabled="!permissionStore.myPermissions.members_listPermissions_edit" />
      <u-button-icon class="mobile" size="s" icon="close" type="outlined" :color="color" @click="cleanProfilePermissions" :disabled="!permissionStore.myPermissions.members_listPermissions_edit" />

      <!-- Asignar Perfil -->
      <u-button
        size="s"
        :text="t(KEY_LABELS + '.sections.permission.texts.text17')"
        icon="check"
        type="outlined"
        @click="saveAssignProfileToMember(profile)"
        :disabled="!permissionStore.myPermissions.members_listPermissions_edit"
      />
    </div> 
    <template v-else>
      <div v-if="permissionStore.modalPermissions.edit" class="permission__header-actions">
        <u-button class="desktop" size="s" :text="t(KEY_LABELS + '.sections.permission.texts.text16')" icon="close" type="outlined" :color="color" @click="cleanPermissions" :disabled="!permissionStore.myPermissions.members_listPermissions_edit" />
        <u-button class="desktop" size="s" :text="t(KEY_LABELS + '.sections.permission.texts.text18')" icon="save" :disabled="!permissionStore.modalPermissions.change || !permissionStore.myPermissions.members_listPermissions_edit" type="outlined" @click="permissionStore.modalPermissions.confirm = true" />
  
        <u-button-icon class="mobile" size="s" icon="close" type="outlined" :color="color" @click="cleanPermissions" :disabled="!permissionStore.myPermissions.members_listPermissions_edit" />
        <u-button-icon class="mobile" size="s" icon="save" :disabled="!permissionStore.modalPermissions.change || !permissionStore.myPermissions.members_listPermissions_edit" @click="permissionStore.modalPermissions.confirm = true" />
      </div>
      <u-button
        v-else
        size="s"
        :text="t(KEY_LABELS + '.buttons.editPermissions')"
        icon="edit"
        type="outlined"
        @click="modifyPermissions"
        :disabled="!permissionStore.myPermissions.members_listPermissions_edit"
      />
    </template>
  </div>
</template>

<style scoped>
.permission__header {
  display: grid;
  grid-template-columns: auto 1fr auto;
  column-gap: 8px;
  align-items: center;
}
.permission__header span.label {
  font-weight: 600;
  font-size: 16px;
  line-height: 20px;
  color: var(--neutral-text-body);
}
.permission__header:deep(.containerSelectInput) {
  max-width: 400px;
}
.permission__header-actions {
  display: flex;
  gap: 12px;
}
.mobile {
    display: none;
  }
@media only screen and (max-width: 840px) {
  .mobile {
    display: flex;
  }
  .desktop {
    display: none;
  }
}
</style>
