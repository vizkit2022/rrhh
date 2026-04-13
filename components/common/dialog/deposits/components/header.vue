<script setup>
import { defineEmits, computed } from "vue";
import usePaymentsStore from "@/stores/payments";

// Stores
const paymentsStore = usePaymentsStore();

// Emits
const emit = defineEmits(["closeModal"]);

// Constants
const color = "--neutral-text-caption";
const { t } = useI18n();
// const BASE_KEY = "modules.outcomes.pages.oc.modals.deposits";
const BASE_KEY = computed(() => {
  switch (paymentsStore.formDeposits?.type) {
    case "outcome":
      return "modules.outcomes.pages.oc.modals.deposits";
    case "sales-documents-charged":
      return "modules.sales.modals.charge";
    case "sales-documents-refund":
      return "modules.sales.modals.refund";
    default:
      return "modules.outcomes.pages.oc.modals.deposits";
  }
})

// Computed
const title = computed(() => {
  const mainTitle = t(BASE_KEY.value + ".title");
  const step = paymentsStore.formDeposits?.step ?? 1;
  const stepTitle = t(BASE_KEY.value + ".step" + step + ".title");
  return `${mainTitle} - ${stepTitle}`;
});
</script>

<template>
  <div class="step__header">
    <span class="title">{{ title }}</span>
    <u-button-icon
      icon="close"
      class="btnIconModify"
      :color="color"
      @click="emit('closeModal')"
      type="outlined"
      size="s"
    />
  </div>
</template>

<style scoped>
.step__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 40px;
}
.step__header .title {
  font-weight: 600;
  font-size: 16px;
  line-height: 20px;
  letter-spacing: 0%;
  vertical-align: middle;
  color: var(--neutral-text-body);
}
.btnIconModify {
  border-radius: 50%;
}
</style>
