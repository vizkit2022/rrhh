<script setup>
import { SettingsOrganizationFormsDocumentContentTaxDocument, SettingsOrganizationFormsDocumentContentSalesDocument } from '#components';
import useOrganizationStore from '@/stores/organization';

//STATE
const organizationStore = useOrganizationStore();

// CONSTANTS
const steps = {
    0: SettingsOrganizationFormsDocumentContentTaxDocument,
    1: SettingsOrganizationFormsDocumentContentSalesDocument
}

//COMPUTED
const currentTabComponent = computed(() => steps[organizationStore.tabDocsType]);

//FUNCTIONS


</script>

<template>
    <component :is="currentTabComponent" />
</template>

<style scoped>

</style>
