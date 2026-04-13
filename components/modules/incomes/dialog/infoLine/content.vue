<script setup>
import useGrillaStore from "@/stores/grilla";

// Stores
const grillaStore = useGrillaStore();

</script>

<template>
  <IncomesDialogInfoLineDetails v-if="grillaStore.configModalInfoLine.defaultTab === 'details'" />
  <IncomesDialogInfoLineIncomes v-else-if="grillaStore.configModalInfoLine.defaultTab === 'incomes'" />
  <IncomesDialogInfoLineBudget v-else-if="grillaStore.configModalInfoLine.defaultTab === 'budget'" />
  <IncomesDialogInfoLinePurchase v-else-if="grillaStore.configModalInfoLine.defaultTab === 'purchase'" />
  <span v-else>No Component</span>
</template>
