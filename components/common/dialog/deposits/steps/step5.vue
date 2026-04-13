<script setup>
import { ref, onMounted } from "vue";
import usePaymentsStore from "@/stores/payments";

// Stores
const paymentsStore = usePaymentsStore();

// Constants
const { t } = useI18n();
const BASE_KEY = "modules.outcomes.pages.oc.modals.deposits.step4.search";

// Variables
const childRef = ref(null)
const search = ref("");
const user = {
  _id:
    paymentsStore?.formDeposits?.supplier?.contact?._id ||
    paymentsStore?.formDeposits?.supplier?._id || 
    paymentsStore?.formDeposits?.supplier?.contact, 
    
  isContact: true,
};

// Mounted
onMounted(async() => {
  paymentsStore.bankAccountsByUser =
    paymentsStore.formDeposits.originBankAccounts;

  if (!paymentsStore.formDeposits.originAccount){
    paymentsStore.formDeposits.originAccount = paymentsStore.bankAccountsByUser.find(acc => acc.isFavorite)?._id
  }
  
});

watch(() => paymentsStore.bankAccountsByUser,  (newVal) => {
  paymentsStore.formDeposits.originBankAccounts = newVal;
}, { deep: true });

// Functions
const bankAccountSelected = (id) => {
  paymentsStore.formDeposits.originAccount = id;
};
</script>

<template>
  <div class="step">
    <DialogDepositsComponentsIssuer />
    <DialogDepositsComponentsLine />
    <DialogCoverInfoCardsPayMethod
      ref="childRef"
      :refresh="false"
      width="650px"
      :by-user="false"
      maxHeight="352px"
      @bankAccountSelected="bankAccountSelected"
      :unknownAccount="true"
      :byUser="true"
      :user="user"
      :bankAccountSelected="true"
      :initial-bank-account-id="paymentsStore.formDeposits.originAccount"
    />
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
  row-gap: 16px;
}
</style>
