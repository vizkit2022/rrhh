<script setup>
import { computed, ref } from "vue";
import usePaymentsStore from "@/stores/payments";

// Stores
const paymentsStore = usePaymentsStore();

// emits
const emit = defineEmits(["recalculateTable"]);

// Constants
const color = "--neutral-text-caption";
const { t } = useI18n();
const moduleCharge = "modules.sales.modals.charge.step1";
const moduleRefund = "modules.sales.modals.refund.step1";
const showCurrencies = ref(false);

const FORM_CONFIG_SALES_DOCUMENTS = {
  "sales-documents-charged": {
    module: moduleCharge,
    refKey: "refCharge",
  },
  "sales-documents-refund": {
    module: moduleRefund,
    refKey: "refRefund",
  },
};

// Computed
const typeForm = computed(() => paymentsStore.formDeposits.type);
const texts = computed(() => {
  // Para compras
  if (typeForm.value === "outcome") {
    const user = paymentsStore?.formDeposits?.lines?.[0]?.supplier || {};
    const ref = paymentsStore?.formDeposits?.data?.reference || "";
    const refDefault = "Referencia del Abono";
    return {
      reference: ref || refDefault,
      user: {
        name: user?.data?.legalName || "-",
        src: user?.imgUrl || "",
      },
    };
  }
  // Aqui tu caso Juan
  else if (FORM_CONFIG_SALES_DOCUMENTS[typeForm.value]) {
    const user = paymentsStore?.formDeposits?.lines?.[0]?.client || {};
    const ref = paymentsStore?.formDeposits?.data?.reference || "";
    const { module, refKey } = FORM_CONFIG_SALES_DOCUMENTS[typeForm.value];

    return {
      reference: ref || t(`${module}.${refKey}`),
      user: {
        name: user?.data?.legalName || "-",
        src: user?.imgUrl || "",
      },
    };
  }
});
</script>

<template>
  <div class="step__exchangeRate">
    <!-- Para compras -->
    <template v-if="typeForm === 'outcome'">
      <span class="step__exchangeRate-title">{{ texts.reference }}</span>
      <div class="step__exchangeRate-user">
        <u-avatar :user="texts.user" :size="24" />
        <span>{{ texts.user.name }}</span>
      </div>
    </template>
    <!-- Para otro tipo -->
    <template
      v-else-if="
        typeForm === 'sales-documents-charged' ||
        typeForm === 'sales-documents-refund'
      "
    >
      <span class="step__exchangeRate-title">{{ texts.reference }}</span>
      <div class="step__exchangeRate-user">
        <u-avatar :user="texts.user" :size="24" />
        <span>{{ texts.user.name }}</span>
      </div>
    </template>

    <div class="step__exchangeRate-actions">
      <dialog-deposits-components-list-exchange-rate
        @recalculateTable="emit('recalculateTable')"
      />

      <dialog-deposits-components-btn-exchange
        class="btnExchange"
        @click="showCurrencies = !showCurrencies"
      />
      <dialog-deposits-components-exchange-rate
        :showMenu="showCurrencies"
        classNameBtn="btnExchange"
        @recalculateTable="emit('recalculateTable')"
        @closeMenu="showCurrencies = false"
      />
    </div>
  </div>
</template>

<style scoped>
.step__exchangeRate {
  display: grid;
  grid-template-columns: 1fr auto;
  column-gap: 16px;
  grid-template-areas: "title btn" "user btn";
  position: relative;
  z-index: 9;
}
.step__exchangeRate-title {
  grid-area: title;
  font-weight: 600;
  font-size: 16px;
  line-height: 20px;
  letter-spacing: 0%;
  vertical-align: middle;
  color: var(--neutral-text-body);
}
.step__exchangeRate-user {
  grid-area: user;
  display: grid;
  grid-template-columns: 24px 1fr;
  column-gap: 8px;
  align-items: center;
}
.step__exchangeRate-user span {
  font-weight: 400;
  font-size: 14px;
  line-height: 18px;
  letter-spacing: 0%;
  vertical-align: middle;
  color: var(--neutral-text-caption);
}
.btn {
  grid-area: btn;
}
.step__exchangeRate-actions {
  display: flex;
  position: relative;
  column-gap: 8px;
  align-items: center;
  justify-content: flex-end;
}
</style>
