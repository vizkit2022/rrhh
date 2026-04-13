<script setup>
import { computed } from "vue";
import usePaymentsStore from "@/stores/payments";

// Stores
const paymentsStore = usePaymentsStore();

// Computed
const typeForm = computed(() => paymentsStore.formDeposits.type);

</script>

<template>
  <div class="step">
    <DialogDepositsComponentsTableErrorOutcome v-if="typeForm === 'outcome'" />
    <DialogDepositsComponentsSalesDocChargeTableError v-else-if="typeForm === 'sales-documents-charged'" />
    <DialogDepositsComponentsSalesDocRefundTableError v-else-if="typeForm === 'sales-documents-refund'" />
    <span v-else>Tipo no reconocido</span>
  </div>
</template>

<style scoped>
.step {
  width: 85vw;
  max-width: 1100px;
  height: auto;
  max-height: 600px;
  display: grid;
  row-gap: 16px;
}

@media only screen and (max-width: 768px) {
  .step {
    max-height: calc(100vh - 140px);
  }
}
</style>
