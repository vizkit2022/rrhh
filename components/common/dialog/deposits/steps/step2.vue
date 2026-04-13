<script setup>
import { onMounted } from "vue";
import usePaymentsStore from "@/stores/payments";
import useGlobalStore from "@/stores/global";

// Stores
const paymentsStore = usePaymentsStore();
const globalStore = useGlobalStore();

// Constants
const { t } = useI18n();
// const BASE_KEY = paymentsStore.formDeposits?.type === "outcome" ? "modules.outcomes.pages.oc.modals.deposits.step2" : "modules.sales.modals.charge.step2";
const paymentMethods = paymentsStore.paymentMethods.map(pay => ({...pay, label: pay.name[globalStore.lang]}));

// computed
const BASE_KEY = computed(() => {
  switch (paymentsStore.formDeposits?.type) {
    case "outcome":
      return "modules.outcomes.pages.oc.modals.deposits.step2";
    case "sales-documents-charged":
      return "modules.sales.modals.charge.step2";
    case "sales-documents-refund":
      return "modules.sales.modals.refund.step2";
    default:
      return "modules.outcomes.pages.oc.modals.deposits.step2";
  }
})


// Mounted
onMounted(() => {
  initDate();
});

// Functions
const initDate = () => {
  if (
    paymentsStore.formDeposits.data.issueDate === "" ||
    paymentsStore.formDeposits.data.paymentDate === ""
  ) {
    const today = new Date();

    // Issue date = hoy
    paymentsStore.formDeposits.data.issueDate = today
      .toISOString()
      .slice(0, 10);

    // Payment date = hoy + 4 días
    paymentsStore.formDeposits.data.paymentDate = today
      .toISOString()
      .slice(0, 10);
  }
};
const getDataPayMethods = (data) => {
  paymentsStore.formDeposits.data.paymentMethod = data._id;
  paymentsStore.formDeposits.data.paymentMethodName = data.label;
};
</script>

<template>
  <div class="step">
    <DialogDepositsComponentsAmount />
    <DialogDepositsComponentsLine />
    <div class="step__body">
      <span class="step__body-title">{{ t(BASE_KEY + ".form.title") }}</span>
      <div class="step__body-form">
        <!-- Modalidad -->
        <div class="step__body-form-group">
          <span class="step__body-form-group-icon u u-bookmark"></span>
          <span class="step__body-form-group-label">{{
            t(BASE_KEY + ".form.modality.label")
          }}</span>
          <u-select
            size="s"
            :placeholder="t(BASE_KEY + '.form.modality.placeholder')"
            v-model="paymentsStore.formDeposits.data.paymentMethodName"
            :options=paymentMethods
            :fullData="true"
            @fullData="(data) => getDataPayMethods(data)"
          />
        </div>
        <!-- Transacción -->
        <div class="step__body-form-group">
          <span class="step__body-form-group-icon u u-money-transfer"></span>
          <span class="step__body-form-group-label">{{
            t(BASE_KEY + ".form.transaction.label")
          }}</span>
          <u-input
            size="s"
            :placeholder="t(BASE_KEY + '.form.transaction.placeholder')"
            v-model="paymentsStore.formDeposits.data.transaction"
          />
        </div>
        <!-- Moneda -->
        <!-- <div class="step__body-form-group" v-if="paymentsStore.formDeposits.type === 'sales-documents-charged' || paymentsStore.formDeposits.type === 'sales-documents-refund'">
          <span class="step__body-form-group-icon u u-open-book"></span>
          <span class="step__body-form-group-label">{{
            t(BASE_KEY + ".form.currency.label")
          }}</span>
          <u-select
            size="s"
            :placeholder="t(BASE_KEY + '.form.currency.placeholder')"
          />
        </div> -->
        <!-- Fecha de Emisión -->
        <div class="step__body-form-group">
          <span class="step__body-form-group-icon u u-calendar"></span>
          <span class="step__body-form-group-label">{{
            t(BASE_KEY + ".form.issueDate.label")
          }}</span>
          <u-calendar
            size="s"
            v-model="paymentsStore.formDeposits.data.issueDate"
          />
        </div>
        <!-- Fecha de Pago -->
        <div class="step__body-form-group">
          <span class="step__body-form-group-icon u u-calendar"></span>
          <span class="step__body-form-group-label">{{
            t(BASE_KEY + ".form.paymentDate.label")
          }}</span>
          <u-calendar
            size="s"
            v-model="paymentsStore.formDeposits.data.paymentDate"
          />
        </div>
        <!-- Referencia -->
        <div class="step__body-form-group">
          <span class="step__body-form-group-icon u u-information"></span>
          <span class="step__body-form-group-label">{{
            t(BASE_KEY + ".form.reference.label")
          }}</span>
          <u-input
            size="s"
            :placeholder="t(BASE_KEY + '.form.reference.placeholder')"
            v-model="paymentsStore.formDeposits.data.reference"
          />
        </div>
        <!-- Observaciones -->
        <div class="step__body-form-group observation">
          <span class="step__body-form-group-icon u u-open-book"></span>
          <span class="step__body-form-group-label">{{
            t(BASE_KEY + ".form.observations.label")
          }}</span>
          <u-textarea
            size="s"
            :placeholder="t(BASE_KEY + '.form.observations.placeholder')"
            v-model="paymentsStore.formDeposits.data.observation"
            style="height: 120px"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.step {
  width: min(70vw, 719px);
  height: min(70vh, 638px);
  display: grid;
  grid-template-rows: repeat(2, auto) 1fr;
  gap: 26px;
  overflow: hidden;
}
.step__body {
  display: grid;
  grid-template-rows: auto 1fr;
  min-height: 0;
  overflow: hidden;
  row-gap: 24px;
}
.step__body-title {
  font-weight: 600;
  font-size: 16px;
  line-height: 20px;
  letter-spacing: 0%;
  vertical-align: middle;
  color: var(--neutral-text-body);
}
.step__body-form {
  display: flex;
  flex-direction: column;
  row-gap: 16px;
  padding-right: 12px;
  overflow-y: auto;
  scrollbar-gutter: stable both-edges;
}

.step__body-form::-webkit-scrollbar {
  width: 8px;
  height: 0px;
  background: var(--neutral-surface-light);
  border-radius: 20px;
}
.step__body-form::-webkit-scrollbar-thumb {
  background: var(--neutral-surface-subtle);
  border-radius: 5px;
}

.step__body-form-group {
  display: grid;
  grid-template-columns: 16px 200px 1fr;
  column-gap: 12px;
  align-items: center;
}

.observation {
  align-items: flex-start
}

.step__body-form-group-icon {
  height: 32px;
  display: flex;
  align-items: center;
  color: var(--neutral-text-caption);
}
.step__body-form-group-label {
  height: 32px;
  display: flex;
  align-items: center;
  font-weight: 600;
  font-size: 14px;
  line-height: 18px;
  letter-spacing: 0%;
  vertical-align: middle;
  color: var(--neutral-text-caption);
}
</style>
