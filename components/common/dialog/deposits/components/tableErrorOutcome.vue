<script setup>
import { defineEmits, defineProps } from "vue";
import usePaymentsStore from "@/stores/payments";

// Stores
const paymentsStore = usePaymentsStore();

// Constants
const { t } = useI18n();
const module = "modules.outcomes.pages.oc.modals.goToPay.step2";
const module2 = "modules.outcomes.pages.outcome";
const color = "--neutral-text-caption";

// Functions
const hasMultipleIncomes = (origin) => {
  return origin.length > 1;
};
const removeOC = (i) => {
  if(paymentsStore.formDeposits.lines.length !== 1) {
    if(Array.isArray(paymentsStore.formDeposits?.lines) && i >= 0 && i < paymentsStore.formDeposits.lines.length) {
      paymentsStore.formDeposits.lines.splice(i, 1);

      // Ejecutar la revisión de las validaciones
      paymentsStore.reviewValidationByDeposits();
    }
  }
}

</script>

<template>
  <div class="step__error">
    <div class="step__error__alert" v-if="!paymentsStore.formDeposits.correctFiltering">
      <span class="u u-danger-outlined"></span>
      <p>{{ paymentsStore.formDeposits.errorObj.message }}</p>
    </div>
    <span class="step__error-title"
      >{{ t("modules.outcomes.pages.oc.modals.deposits.step0.text") }} ({{
        paymentsStore.formDeposits.lines.length
      }})</span
    >
    <div class="step__error-body-table">
      <div class="step__error-body-table-header">
        <div class="col left first">
          <span v-text="t(module + '.table.headers.supplier')"></span>
        </div>
        <div class="col left">
          <span v-text="t(module + '.table.headers.purchase')"></span>
        </div>
        <div class="col left">
          <span v-text="t(module + '.table.headers.reference')"></span>
        </div>
        <div class="col right">
          <span v-text="t(module + '.table.headers.state')"></span>
        </div>
        <div class="col right">
          <span v-text="t(module + '.table.headers.purchaseValue')"></span>
        </div>
        <div class="col right last"></div>
      </div>
      <div
        class="step__error-body-table-item"
        v-for="(item, i) in paymentsStore.formDeposits.lines"
        :key="item._id"
      >
        <div class="col left supplier">
          <u-avatar
            :user="{
              name: item?.supplier?.data?.legalName || '',
              src: item?.supplier?.imgUrl,
            }"
            :size="32"
          />
          <span
            class="truncateText"
            v-text="capitalizeName(item?.supplier?.data?.legalName || '')"
          ></span>
        </div>
        <div class="col left">
          <a
            :class="`tag ${item?.type}`"
            :href="`/outcomes/${item?._id}`"
            target="_blank"
            rel="noopener noreferrer"
          >
            {{ item?.tagManagementDoc || item?.type }} - {{ item?.idNumber }}
            <span class="u u-click"></span>
          </a>
        </div>
        <div class="col left name">
          <span
            class="truncateText"
            v-text="capitalizeName(item?.reference || '')"
          ></span>
          <span
            v-if="hasMultipleIncomes(item?.income || [])"
            v-text="t(module + '.mulitpleIncomes')"
          ></span>
          <a
            v-else
            class="income"
            :title="
              item?.income?.[0]?.project?.name + ' / ' + item?.income?.[0]?.name
            "
            :href="`/incomesv2/project/${item?.income?.[0]?.project?._id}/income/${item?.income?.[0]?._id}`"
            target="_blank"
            rel="noopener noreferrer"
          >
            <span class="u u-open"></span>
            <span
              class="truncateText"
              v-text="capitalizeName(item?.income?.[0]?.name || '')"
            ></span>
          </a>
        </div>
        <div class="col right colStatus">
          <span :class="`status ${item.status || ''}`">
            {{
              item.status
                ? t(module2 + ".tabs.tab1.status." + item.status)
                : "-"
            }}
          </span>
        </div>
        <div class="col right">
          <span v-text="item?.numbers?.total?.value" :title="item?.numbers?.total?.number"></span>
        </div>
        <div class="col right last">
          <u-button-icon
            icon="close"
            class="btnIconModify"
            :color="color"
            type="text"
            size="s"
            @click="removeOC(i)"
            :disabled="paymentsStore.formGoToPay.lines.length === 1"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Container */
.step__error {
  width: 85vw;
  max-width: 1100px;
  height: auto;
  max-height: calc(85vh - 80px);
  display: flex;
  flex-direction: column;
  gap: 16px;
}

@media only screen and (max-width: 768px) {
  .step__error {
    width: calc(100vw - 40px);
    max-height: calc(100vh - 80px);
  }
  .step__error-body-table {
    height: calc(100vh - 232px) !important;
  }
}

/* Alert */
.step__error__alert {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 8px;
  border-radius: 12px;
  padding: 8px;
  border: 1px solid var(--danger-border-default);
}
.step__error__alert span {
  font-size: 20px;
  line-height: 20px;
  color: var(--danger-text-default) !important;
}
.step__error__alert p {
  font-weight: 400;
  font-size: 16px;
  line-height: 20px;
  letter-spacing: 0%;
  vertical-align: middle;
  color: var(--neutral-text-body);
}
/* Title */
.step__error-title {
  font-weight: 600;
  font-size: 16px;
  line-height: 20px;
  letter-spacing: 0%;
  vertical-align: middle;
  color: var(--neutral-text-body);
}

/* Tabla */

.step__error-body-table {
  overflow: auto;
  border-radius: 16px;
  border: 1px solid var(--neutral-border-light);
  height: calc(85vh - 80px - 80px - 44px - 32px - 206px);
  position: relative;
}

.step__error-body-table::-webkit-scrollbar {
  width: 8px;
  height: 0px;
  background: var(--neutral-surface-light);
  border-radius: 20px;
}

.step__error-body-table::-webkit-scrollbar-thumb {
  background: var(--neutral-surface-subtle);
  border-radius: 5px;
}

.step__error-body-table-header {
  position: sticky;
  top: 0;
  z-index: 2;
}

.step__error-body-table-header,
.step__error-body-table-item {
  display: grid;
  width: 100%;
  grid-template-columns: minmax(180px, 1fr) 130px minmax(180px, 1fr) 125px 160px 50px;
}

.step__error-body-table-header .col {
  background-color: var(--neutral-surface-softer);
  border-bottom: 1px solid var(--neutral-border-light);
}

.col {
  display: flex;
  align-items: center;
  padding: 0 12px;
  height: 46px;
}

.col span {
  width: 100%;
}

.col.name {
  flex-direction: column;
  justify-content: center;
  align-items: flex-start;
}

.step__error-body-table-item .col span {
  color: var(--neutral-text-body);
}

.income {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 4px;
  align-items: center;
  margin-top: 2px;
}

.income span {
  transition: 0.3s;
}

.income:hover span {
  color: var(--primary-text-default) !important;
}

.income span.u {
  font-size: 12px;
  color: var(--primary-text-subtle);
  font-weight: 400;
}

.col.name span:nth-child(2) {
  color: var(--neutral-text-caption);
  font-weight: 400;
  font-size: 12px;
}

.col.first {
  padding-left: 20px;
}

.col.last {
  padding-right: 20px;
}

.col.right span {
  text-align: right;
}

.col.colStatus {
  justify-content: flex-end;
}

.col.left {
  text-align: left;
}

.col.supplier {
  display: grid;
  grid-template-columns: 32px 1fr;
  gap: 8px;
  padding-left: 20px;
}

.col span {
  font-weight: 600;
  font-size: 14px;
  line-height: 14px;
  letter-spacing: 0%;
  color: var(--neutral-text-caption);
}

.col a.tag {
  font-size: 12px;
  line-height: 12px;
  font-weight: 600;
  padding: 5px 10px;
  border-radius: 10px;
  text-align: center;
  display: grid;
  grid-template-columns: auto auto;
  align-items: center;
  gap: 5px;
}

.col a.tag.OC {
  background-color: var(--info-surface-shadow-12a);
  color: var(--info-text-darker);
}
.col a.tag.OC span.u {
  color: var(--info-text-darker);
}

.col a.tag.FXR {
  background-color: var(--warning-surface-shadow-12a);
  color: var(--warning-text-darker);
}

.col a.tag.FXR span.u {
  color: var(--warning-text-darker);
}

.step__error-body-table-item .col.first {
  gap: 8px;
}

.step__error-body-table-item .col.first span {
  width: auto;
}

.step__error-body-table-item .col {
  background-color: var(--neutral-background-default);
  transition: 0.3s;
}

.step__error-body-table-item:hover .col {
  background-color: var(--primary-surface-shadow-8a);
}

.status {
  padding: 4px 12px;
  border-radius: 16px;
  font-size: 12px;
  font-weight: 600;
  width: auto !important;
}
.status.forApproval {
  background-color: var(--warning-surface-light);
  color: var(--warning-text-darker) !important;
}
.status.inProcess {
  background-color: var(--info-surface-light);
  color: var(--info-text-darker) !important;
}
.status.rejected {
  background-color: var(--danger-surface-light);
  color: var(--danger-text-darker) !important;
}
.status.closed {
  background-color: var(--success-surface-light);
  color: var(--success-text-darker) !important;
}
.status.voided {
  background-color: var(--neutral-surface-light);
  color: var(--neutral-text-caption) !important;
}
.status.paid {
  background-color: var(--secondary-surface-light);
  color: var(--secondary-text-darker) !important;
}
</style>
