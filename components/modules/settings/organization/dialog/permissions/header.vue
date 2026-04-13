<script setup>
import { computed, defineEmits } from "vue";
import { useI18n } from "vue-i18n";
import usePermissionStore from "@/stores/permissions";

//STORE
const permissionStore = usePermissionStore();

// EMITS
const emit = defineEmits(["closeModal"]);

// CONSTANTS
const colorRed = "--danger-text-default";
const colorRedHover = "--danger-text-darker";
const colorGray = "--neutral-text-caption";
const { t } = useI18n();
const KEY_LABELS =
  "modules.organizations.settings.members.modal.permissions.buttons";

// COMPUTED
const member = computed(() => {
  const member = permissionStore.modalPermissions.member || {};
  return {
    name: member?.data?.legalName,
    src: member?.imgUrl,
    email: member?.email,
  };
});
</script>

<template>
  <div class="modalPermission__header">
    <u-avatar :size="40" :user="member" />
    <div class="modalPermission__header--title">
      <span class="truncateText">{{ member.name }}</span>
      <span class="truncateText">{{ member.email }}</span>
    </div>
    <div class="modalPermission__header--actions">
      <u-button
        icon="user-remove"
        :text="t(KEY_LABELS + '.removeMember')"
        size="s"
        type="outlined"
        :color="colorRed"
        :color-hover="colorRedHover"
        :color-active="colorRedHover"
      />
      <u-button-icon icon="close" size="s" type="outlined" :color="colorGray" @click="emit('closeModal')" />
    </div>
  </div>
</template>

<style scoped>
.modalPermission__header {
  display: grid;
  grid-template-columns: 40px 1fr auto;
  column-gap: 8px;
  align-items: center;
}

.modalPermission__header--title {
  display: grid;
  grid-template-rows: auto auto;
}

.modalPermission__header--title span:nth-child(1) {
  font-weight: 600;
  font-size: 16px;
  line-height: 20px;
  color: var(--neutral-text-body);
}

.modalPermission__header--title span:nth-child(2) {
  font-weight: 400;
  font-size: 14px;
  line-height: 18px;
  color: var(--neutral-text-caption);
}

.modalPermission__header--actions {
  display: flex;
  gap: 8px;
}
</style>
