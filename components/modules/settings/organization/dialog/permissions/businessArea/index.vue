<script setup>
import { onUnmounted } from "vue";
import { useI18n } from "vue-i18n";
import usePermissionStore from "@/stores/permissions";
import useBusinessAreaStore from "@/stores/businessAreas";
import useOrganizationStore from "@/stores/organization";

// STORE
const permissionStore = usePermissionStore();
const businessAreaStore = useBusinessAreaStore();
const organizationStore = useOrganizationStore();

// Constants
const { t } = useI18n();
const KEY_LABELS =
  "modules.organizations.settings.members.modal.permissions.sections.businessAreas";

// Functions
const selectedBusinessArea = async (businessArea) => {
  let businessAreas = [];
  const userId = permissionStore.modalPermissions.member.user._id;
  permissionStore.modalPermissions.member.businessArea.forEach(ba => {
    if(ba.select) businessAreas.push(ba._id);
    permissionStore.modalPermissions.member.businessArea.forEach(buArea => {
      if(buArea._id === businessArea._id) buArea.select = businessArea.select;
    })
  });

  const body = {
    businessAreas,
    userId
  }

  try {
    businessArea.loading = true;
    await businessAreaStore.updatedAssingBusinessArea(body);
  } catch (error) {
    console.error(error);
  } finally {
    businessArea.loading = false;
  }
};

onUnmounted(() => {
  organizationStore.getOrganizationById();
});
</script>

<template>
  <div class="businessArea">
    <div class="businessArea__table">
      <div class="businessArea__table--header">
        <div class="businessArea__table--header-col">
          <span>{{ t(`${KEY_LABELS}.text1`) }}</span>
        </div>
        <div class="businessArea__table--header-col center">
          <span>{{ t(`${KEY_LABELS}.text2`) }}</span>
        </div>
        <div class="businessArea__table--header-col center">
          <span>{{ t(`${KEY_LABELS}.text3`) }}</span>
        </div>
      </div>
      <div class="businessArea__table__item" v-for="businessArea in permissionStore.modalPermissions.member.businessArea" :key="businessArea._id">
        <div class="businessArea__table__item-col text">
          <span class="truncateText">{{ businessArea.name }}</span>
        </div>
        <div :class="`businessArea__table__item-col center ${businessArea.isActive ? 'active' : 'deactivate'}`">
          <span>{{ t(`${KEY_LABELS}.${businessArea.isActive ? 'active' : 'deactivate'}`) }}</span>
        </div>
        <div class="businessArea__table__item-col center">
          <u-loading :width="20" v-if="businessArea.loading" />
          <u-checkbox v-else v-model="businessArea.select" @click="selectedBusinessArea(businessArea)" :disabled="!permissionStore.myPermissions?.settings_business_areas" />
        </div>
      </div>
      <div class="businessArea__table__noData" v-if="permissionStore.modalPermissions.member.businessArea.length === 0">
        <span>{{ t(`${KEY_LABELS}.textNoData`) }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.businessArea__table {
  overflow: auto;
  border-radius: 12px;
  border: 1px solid var(--neutral-border-subtle);
  position: relative;
  max-height: calc(100vh - 320px);
  max-width: calc(100vw - 200px);
}
.businessArea__table::-webkit-scrollbar {
  width: 10px;
  height: 10px;
}

.businessArea__table::-webkit-scrollbar-thumb {
  background-color: var(--neutral-border-darker);
  border-radius: 10px;
}

.businessArea__table::-webkit-scrollbar-track {
  background-color: var(--neutral-border-subtle);
  border-radius: 10px;
}
.businessArea__table--header {
  z-index: 2;
  position: sticky;
  top: 0;
}
.businessArea__table--header,
.businessArea__table__item {
  display: grid;
  grid-template-columns: 380px repeat(2, 1fr);
}
.businessArea__table--header-col {
  background-color: var(--neutral-surface-softer);
}
.businessArea__table--header-col,
.businessArea__table__item-col {
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: flex-start;
  padding: 0 16px;
  border-bottom: 1px solid var(--neutral-border-subtle);
}
.businessArea__table__item:last-child .businessArea__table__item-col {
  border-bottom: none;
}
.businessArea__table--header-col.center,
.businessArea__table__item-col.center {
  justify-content: center;
}
.businessArea__table--header-col span {
  font-weight: 600;
  font-size: 14px;
  line-height: 18px;
  color: var(--neutral-text-body);
}
.businessArea__table__item-col span {
  font-weight: 400;
  font-size: 14px;
  line-height: 18px;
  color: var(--neutral-text-body);
}
.businessArea__table__item-col.text {
    max-width: 380px;
}
.businessArea__table__noData {
    height: 80px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--neutral-text-caption);
    font-size: 12px;
}

.active span,
.deactivate span {
  font-size: 12px;
  line-height: 12px;
  font-weight: 600;
  padding: 4px 12px;
  border-radius: 12px;
}

.active span {
  color: var(--success-text-default);
  background-color: var(--success-surface-shadow-12a);
}
.deactivate span {
  color: var(--danger-text-default);
  background-color: var(--danger-surface-shadow-12a);
}

@media only screen and (max-width: 768px) {
  .businessArea__table {
    max-height: calc(100vh - 160px);
    max-width: calc(100vw - 40px);
  }
  .businessArea__table--header,
  .businessArea__table__item {
    display: grid;
    grid-template-columns: minmax(380px, 420px) 150px 150px;
  }
}
</style>
