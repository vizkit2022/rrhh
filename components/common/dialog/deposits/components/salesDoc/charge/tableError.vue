<script setup>
import { defineEmits, defineProps } from "vue";
import usePaymentsStore from "@/stores/payments";
import useGlobalStore from "@/stores/global";
import { formatMaskNumber } from "@/utils/formatNumbers";

// Stores
const paymentsStore = usePaymentsStore();
const globalStore = useGlobalStore();

// Constants
const { t } = useI18n();
const module = "modules.sales.modals.charge";

// const module = "modules.outcomes.pages.oc.modals.goToPay.step2";
// const module2 = "modules.outcomes.pages.outcome";

const color = "--neutral-text-caption";

// Functions
const hasMultipleIncomes = (origin) => {
  return origin.length > 1;
};
const removeOC = (i) => {
  if (paymentsStore.formDeposits.lines.length !== 1) {
    if (
      Array.isArray(paymentsStore.formDeposits?.lines) &&
      i >= 0 &&
      i < paymentsStore.formDeposits.lines.length
    ) {
      paymentsStore.formDeposits.lines.splice(i, 1);

      // Ejecutar la revisión de las validaciones
      paymentsStore.reviewValidationByDeposits();
    }
  }
};

const redirectToDocument = (id) => {
  const URL_DOCUMENT = `/salesDocuments/${id}`;
  navigateTo(URL_DOCUMENT, { external: true, open: { target: "_blank" } });
};

const getColorStatus = (status) => {
  switch (status) {
    case "issue":
      return {
        background: "--info-surface-light",
        color: "--info-text-darker",
      };
    case "voided":
      return {
        background: "--danger-surface-light",
        color: "--danger-text-darker",
      };
    case "settled":
      return {
        background: "--success-surface-light",
        color: "--success-text-darker",
      };
    case "charged":
      return {
        background: "--primary-surface-shadow-12a",
        color: "--primary-text-default",
      };
  }
};

const getTextStatus = (status) => {
  switch (status) {
    case "issue":
      return {
        es: "Emitido",
        en: "Emit",
      };
    case "voided":
      return {
        es: "Anulado",
        en: "Voided",
      };
    case "settled":
      return {
        es: "Saldada",
        en: "Settled",
      };
    case "charged":
      return {
        es: "Cobrado",
        en: "Charged",
      };
  }
};

const getTextCode = (code) => {
  switch (code) {
    case "invoice":
      return {
        es: "DB",
        en: "DB",
      };
    case "debit":
      return {
        es: "ND",
        en: "DN",
      };
    case "credit":
      return {
        es: "NC",
        en: "CN",
      };
  }
};
</script>

<template>
  <div class="step__error">
    <div
      class="step__error__alert"
      v-if="!paymentsStore.formDeposits.correctFiltering"
    >
      <span class="u u-danger-outlined"></span>
      <p>{{ paymentsStore.formDeposits.errorObj.message }}</p>
    </div>
    <span class="step__error-title"
      >{{ t(`${module}.step0.text`) }} ({{
        paymentsStore.formDeposits.lines.length
      }})</span
    >
    <div class="step__error-body-table">
      <div class="step__error-body-table-header">
        <div class="col left first">
          <!-- <span v-text="t(module + '.table.headers.supplier')"></span> -->
          <span v-text="t(`${module}.step0.table.cols.col1`)"></span>
        </div>
        <div class="col left">
          <!-- <span v-text="t(module + '.table.headers.purchase')"></span> -->
          <span v-text="t(`${module}.step0.table.cols.col2`)"></span>
        </div>
        <div class="col left">
          <!-- <span v-text="t(module + '.table.headers.reference')"></span> -->
          <span v-text="t(`${module}.step0.table.cols.col3`)"></span>
        </div>
        <div class="col center">
          <span v-text="t(`${module}.step0.table.cols.col4`)"></span>
          <!-- <span v-text="t(module + '.table.headers.state')"></span> -->
        </div>
        <div class="col right">
          <span v-text="t(`${module}.step0.table.cols.col5`)"></span>
          <!-- <span v-text="t(module + '.table.headers.purchaseValue')"></span> -->
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
              name: item?.client?.data?.legalName || '',
              src: item?.client?.imgUrl,
            }"
            :size="32"
          />
          <span
            class="truncateText"
            v-text="capitalizeName(item?.client?.data?.legalName || '')"
          ></span>
        </div>
        <div class="col left">
          <u-tags
            :title="`${item?.salesDocumentType?.tag || getTextCode(item?.salesDocumentType?.code)[globalStore.lang] || '-'} - ${
              item?.number || '-'
            }`"
            :text="`${item?.salesDocumentType?.tag || getTextCode(item?.salesDocumentType?.code)[globalStore.lang] || '-'} - ${
              formatMaskNumber(item?.number) || '-'
            } `"
            icon="click"
            size="xs"
            :delete="false"
            color="--info-surface-darker"
            background="--info-surface-shadow-12a"
            class="truncateText"
            style="cursor: pointer"
            maxWidth="70px"
            @click="redirectToDocument(item?._id)"
          />
          <!-- <a
            class="truncateText"
            :class="`tag ${item?.salesDocumentType?.code || ''}`"
            :href="`/outcomes/${item?._id}`"
            target="_blank"
            rel="noopener noreferrer"
          >
            {{ item?.salesDocumentType?.tag || ''}} - {{ item?.number }}
            <span class="u u-click"></span>
          </a> -->
        </div>
        <div class="col left name">
          <span
            class="truncateText"
            v-text="capitalizeName(item?.reference || '')"
          ></span>
          <!-- <span
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
          </a> -->
        </div>
        <div class="col colStatus">
          <u-tags
            :text="getTextStatus(item?.status)?.[globalStore.lang]"
            :color="getColorStatus(item?.status)?.color"
            :background="getColorStatus(item?.status)?.background"
            size="xs"
            :delete="false"
            style="margin: 0 auto"
          />
          <!-- <span :class="`status ${item.status || ''}`">
            {{
              item.status
                ? item.status
                : "-"
            }}
          </span> -->
        </div>
        <div class="col right">
          <span
            v-text="item?.numbers?.unCharged?.value"
            :title="item?.numbers?.unCharged?.value"
          ></span>
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
  grid-template-columns:
    minmax(180px, 1fr) 130px minmax(180px, 1fr)
    125px 160px 50px;
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

.col.center span {
  text-align: center;
}

.col.colStatus {
  justify-content: center;
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

.col a.tag.invoice {
  background-color: var(--info-surface-shadow-12a);
  color: var(--info-text-darker);
}
.col a.tag.invoice span.u {
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
