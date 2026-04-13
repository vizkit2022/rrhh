<script setup>
import useOrganizationStore from "@/stores/organization";

// Variables
const organizationStore = useOrganizationStore();
</script>

<template>
  <div class="organizationContent">
    <!-- Section Information  -->
    <template v-if="organizationStore.page.tab === 0">
      <SettingsOrganizationFormsCommercial
        v-if="organizationStore.page.option === 0"
      />
      <SettingsOrganizationFormsLocation
        v-if="organizationStore.page.option === 1"
      />
      <SettingsOrganizationFormsContact
        v-if="organizationStore.page.option === 2"
      />
      <SettingsOrganizationFormsPerfil
        v-if="organizationStore.page.option === 3"
      />
      <SettingsOrganizationFormsDeactivate
        v-if="organizationStore.page.option === 4"
      />
    </template>

    <!-- Section Members  -->
    <template v-if="organizationStore.page.tab === 1">
      <SettingsOrganizationFormsMembers />
    </template>

    <!-- Section Documents  -->
    <template v-if="organizationStore.page.tab === 2">
      <SettingsOrganizationFormsLogoAndColors
        v-if="organizationStore.page.option === 0"
      />
      <SettingsOrganizationFormsAdditional
        v-if="organizationStore.page.option === 1"
      />
    </template>

    <!-- Section Settings  -->
    <template v-if="organizationStore.page.tab === 3">
      <SettingsOrganizationFormsBusinessAreas
        v-if="organizationStore.page.option === 0"
      />
      <SettingsOrganizationFormsRegionalSetting
        v-if="organizationStore.page.option === 1"
      />
      <SettingsOrganizationFormsValidationRules
        v-if="organizationStore.page.option === 2"
      />
      <SettingsOrganizationFormsPermissionProfiles
        v-if="organizationStore.page.option === 3"
      />
      <SettingsOrganizationFormsPurchasingDoc
        v-if="organizationStore.page.option === 4"
      />
      <!-- <SettingsOrganizationFormsTaxDocument
        v-if="organizationStore.page.option === 5"
      /> -->
      <SettingsOrganizationFormsDocument
        v-if="organizationStore.page.option === 5"
      />

      <SettingsOrganizationFormsTax
        v-if="organizationStore.page.option === 6"
      />
      <SettingsOrganizationFormsCoins
        v-if="organizationStore.page.option === 7"
      />
      <SettingsOrganizationFormsAccounts
        v-if="organizationStore.page.option === 8"
      />
      <SettingsOrganizationFormsNotifications
        v-if="organizationStore.page.option === 9"
      />
    </template>
  </div>
</template>

<style scoped>
.organizationContent {
  width: 100%;
}
</style>
