<script setup>
import { onMounted } from "vue";
import usePaymentsStore from "@/stores/payments";
import useOrganizationStore from "@/stores/organization";

// Stores
const paymentsStore = usePaymentsStore();
const organizationStore = useOrganizationStore();

// Constants
const { t } = useI18n();
const BASE_KEY = "modules.outcomes.pages.oc.modals.deposits.step1";

// Mounted
onMounted(() => {
  paymentsStore.bankAccountsByUser = paymentsStore.formDeposits.destinationBankAccounts;
});

// Functions
const bankAccountSelected = (id) => {
  paymentsStore.formDeposits.destinationAccount = id;
};

watch(() => paymentsStore.bankAccountsByUser,  (newVal) => {
  paymentsStore.formDeposits.destinationBankAccounts = newVal;
}, { deep: true });

</script>

<template>
  <div class="step">
    <DialogDepositsComponentsAmount />
    <DialogDepositsComponentsLine />
    <DialogCoverInfoCardsPayMethod ref="childRef" :refresh="false" 
      width="650px" :by-user="false" maxHeight="376px"
      @bankAccountSelected="bankAccountSelected"
      :bankAccountSelected="true" :onAction="createAccount" :initial-bank-account-id="paymentsStore.formDeposits.destinationAccount"  />
  </div>
</template>

<style scoped>
.step {
  width: 650px;
  height: auto;
  min-height: 453px;
  max-height: 553px;
  display: grid;
  grid-template-rows: auto auto 1fr;
  gap: 16px;
}
</style>
