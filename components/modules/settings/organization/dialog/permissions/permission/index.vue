<script setup>
import { defineEmits } from "vue";
import usePermissionStore from "@/stores/permissions";

// STORES
const permissionStore = usePermissionStore();

// EMITS
const emit = defineEmits(["closeModal"]);

// FUNCTIONS
const closeModal = () => {
  emit("closeModal");
};
</script>

<template>
  <div class="permission">
    <SettingsOrganizationDialogPermissionsPermissionHeader
      @closeModal="closeModal"
    />
    <div class="permission__cards">
      <SettingsOrganizationDialogPermissionsPermissionCard
        v-for="(card, c) in permissionStore.permissionsUser"
        :key="c"
        :title="card.title"
        :permission="card"
      >
        <SettingsOrganizationDialogPermissionsPermissionSystem
          v-if="card.slotName === 'system'"
          :item="card"
        />
        <SettingsOrganizationDialogPermissionsPermissionTable
          v-if="card.slotName === 'table'"
          :item="card"
        />
      </SettingsOrganizationDialogPermissionsPermissionCard>
    </div>
  </div>
</template>

<style scoped>
.permission {
  display: flex;
  flex-direction: column;
  gap: 16px;
  height: calc(100vh - 200px - 120px);
}

.permission__cards {
  display: flex;
  flex-direction: column;
  gap: 16px;
  overflow: auto;
  height: 630px;
  padding-right: 1px;
}

.permission__cards::-webkit-scrollbar {
  width: 10px;
  height: 10px;
}

.permission__cards::-webkit-scrollbar-thumb {
  background-color: var(--neutral-border-darker);
  border-radius: 10px;
}

.permission__cards::-webkit-scrollbar-track {
  background-color: var(--neutral-border-subtle);
  border-radius: 10px;
}

@media only screen and (max-width: 768px) {
  .permission {
    height: calc(100vh - 160px);
  }
  .permission__cards {
    height: calc(100vh - 192px);
  }
}
</style>
