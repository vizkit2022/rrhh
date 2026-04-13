<script setup>
import { computed, onMounted } from "vue";
import usePaymentsStore from "@/stores/payments";
import useOrganizationStore from "@/stores/organization";
import {
  DialogDepositsStepsStep0,
  DialogDepositsStepsStep1,
  DialogDepositsStepsStep2,
  DialogDepositsStepsStep3,
  DialogDepositsStepsStep4,
  DialogDepositsStepsStep5,
} from "#components";

// Stores
const paymentsStore = usePaymentsStore();
const organizationStore = useOrganizationStore();

// Emits
const emit = defineEmits(["closeModal","refresh"]);

// Computed
const currentStepView = computed(() => steps[paymentsStore.formDeposits.step]);

// Views
const steps = {
  0: DialogDepositsStepsStep0,
  1: DialogDepositsStepsStep1,
  2: DialogDepositsStepsStep2,
  3: DialogDepositsStepsStep3,
  4: DialogDepositsStepsStep4,
  5: DialogDepositsStepsStep5,
};

// Functions
const closeModal = () => {
  emit("closeModal");
  // Aqui limpiar el store
  paymentsStore.cleanFormDeposits();
};
const refresh = () => {
  emit("refresh");
};

// Mounted
onMounted(async () => {
  const resOrigin = await organizationStore.fetchCurrentOrgBankAccounts();
  paymentsStore.formDeposits.destinationBankAccounts = resOrigin?.resp || [];

  paymentsStore.getPaymentMethods();
});
onBeforeMount(() => {
  // Revisar el filtrado correcto
  paymentsStore.reviewValidationByDeposits();
});
</script>

<template>
  <div class="deposits">
    <DialogDepositsComponentsHeader @close-modal="closeModal" />
    <component :is="currentStepView" />
    <DialogDepositsComponentsFooter @close-modal="closeModal" @refresh="refresh" />
  </div>
</template>

<style scoped>
.deposits {
  display: grid;
  grid-template-rows: 32px 1fr 32px;
  row-gap: 24px;
}
</style>
