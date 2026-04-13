<script setup>
import { computed, ref } from "vue";
import usePaymentsStore from "@/stores/payments";
import useOutcomesStore from "@/stores/outcomes";
import useSalesStore from "@/stores/sales";

// Stores
const paymentsStore = usePaymentsStore();
const outcomesStore = useOutcomesStore();
const salesStore = useSalesStore();

// Computed
const loading = computed(() => outcomesStore.formPO.loadings.currencies);
</script>

<template>
  <button :disabled="loading" id="buttonERX">
    <template v-if="loading">
      <u-loading :width="12" />
    </template>
    <template v-else>
      <span class="u u-dollar-sign"></span>
      <span>Moneda: </span>
      <span class="code">{{ outcomesStore.formPO.currency?.code ?? "-" }}</span>
    </template>
  </button>
</template>

<style scoped>
button {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 32px;
  background-color: transparent;
  border: 1px solid var(--primary-border-default);
  gap: 8px;
  border-radius: 8px;
  padding: 0 8px 0 6px;
  width: 145px;
}
button span {
  color: var(--primary-text-default);
}
button span.u {
  font-size: 18px;
  line-height: 18px;
}
button span:not(.u) {
  font-size: 16px;
  line-height: 16px;
}
button span.code {
  font-weight: 600;
}
button:disabled {
  border: 1px solid var(--neutral-text-disabled) !important;
}
button:disabled span {
  color: var(--neutral-text-disabled) !important;
}
</style>
