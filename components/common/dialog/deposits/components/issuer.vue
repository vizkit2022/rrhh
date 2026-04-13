<script setup>
import usePaymentsStore from "@/stores/payments";
import useGlobalStore from "@/stores/global";

// Stores
const paymentsStore = usePaymentsStore();
const globalStore = useGlobalStore();

// Computed
const supplier = computed(() => {
  return {
    name: paymentsStore?.formDeposits?.supplier?.data?.legalName || "-",
    src: paymentsStore?.formDeposits?.supplier?.imgUrl || "",
    alias: paymentsStore?.formDeposits?.supplier?.data?.nickName || paymentsStore?.formDeposits?.supplier?.alias || "-",
    email: paymentsStore?.formDeposits?.supplier?.contact?.email || paymentsStore?.formDeposits?.supplier?.email || "",
    isUser: paymentsStore?.formDeposits?.supplier?.contact?.user?._id || paymentsStore?.formDeposits?.supplier?.contact ? true : false,
  }
});

const textEditButton = {
  es: "Editar",
  en: "Edit",
}

// Functions
const cleanSupplier = () => {
  paymentsStore.formDeposits.supplier = {};
  paymentsStore.formDeposits.step = 4;
};
</script>

<template>
  <div class="step__issuer">
    <u-avatar :size="68" :user="supplier" />
    <div class="step__issuer-texts">
      <span class="truncateText">{{ supplier.name }}<strong class="u u-verified"></strong></span>
      <span class="truncateText">{{ supplier.alias }}</span>
      <span class="truncateText">{{ supplier.email }}</span>
    </div>
    <u-button icon="edit" :text="textEditButton[globalStore.lang]" type="outlined" size="s" @click="cleanSupplier" />
  </div>
</template>

<style scoped>
.step__issuer {
  height: 68px;
  display: grid;
  grid-template-columns: 68px 1fr auto;
  column-gap: 16px;
  align-items: center;
}
.step__issuer-texts {
  display: grid;
  align-items: center;
}
.step__issuer-texts span:nth-child(1) {
  font-weight: 600;
  font-size: 18px;
  line-height: 24px;
  letter-spacing: 0%;
  vertical-align: middle;
  color: var(--neutral-text-body);
  display: flex;
  align-items: center;
  gap: 8px;
}
.step__issuer-texts span:nth-child(2) {
  font-size: 16px;
  line-height: 24px;
  letter-spacing: 0%;
  vertical-align: middle;
  color: var(--neutral-text-caption);
}
.step__issuer-texts span:nth-child(3) {
  font-size: 14px;
  line-height: 20px;
  letter-spacing: 0%;
  vertical-align: middle;
  color: var(--primary-text-default);
}
</style>
