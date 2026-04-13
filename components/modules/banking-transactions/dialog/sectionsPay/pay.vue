<script setup>
import useGlobalStore from "@/stores/global";
import useBankingTransactionsStore from "@/stores/bankingTransactions";

//store
const globalStore = useGlobalStore();
const bankingTransactionsStore = useBankingTransactionsStore();

// Contants
const { t } = useI18n();
const LABEL_KEY = "modules.outcomes.pages.oc.modals.viewPay";
</script>

<template>
  <div class="pay">
    <div class="table">
      <div class="table__header">
        <div class="cell"><span>{{ t(LABEL_KEY + ".texts.purchase") }}</span></div>
        <div class="cell"><span>{{ t(LABEL_KEY + ".texts.reference") }}</span></div>
        <div class="cell"><span>{{
          t(
            LABEL_KEY +
              ".texts.amount" +
              `${
                bankingTransactionsStore?.dataDetailsPayment?.isPartialPayment
                  ? "2"
                  : ""
              }`
          )  
        }}</span></div>
      </div>
      <div
        class="table__item"
        v-for="line in bankingTransactionsStore?.dataDetailsPayment?.lines"
        :key="line?._id"
      >
        <div class="cell truncateText">
          <span class="truncateText" v-text="line.outcomeId.correlative"></span>
        </div>
        <div class="cell">
          <a
            class="truncateText"
            :href="`/outcomes/${line?.outcomeId?._id}`"
            target="_blank"
            rel="noopener noreferrer"
            v-text="line.outcomeId.reference"
          ></a>
          <a
            class="truncateText"
            v-if="line.outcomeId.income.length === 1"
            :href="`/incomesv2/project/${line?.outcomeId?.income?.[0]?.project?._id}/income/${line?.outcomeId?.income?.[0]?._id}`"
            target="_blank"
            rel="noopener noreferrer"
          >
            <span class="u u-open"></span>
            <span class="truncateText">{{
              line?.outcomeId?.income?.[0]?.name
            }}</span>
          </a>
          <span
            v-else
            class="truncateText"
            style="font-size: small; color: var(--neutral-text-caption)"
            >{{ t(LABEL_KEY + ".texts.various") }}</span
          >
        </div>
        <div class="cell truncateText">
          <span
            class="truncateText"
            v-text="line?.amountPaid?.value"
            :title="line?.amountPaid.number"
          ></span>
        </div>
      </div>
    </div>
    <div class="table__footer">
      <div class="cell"></div>
      <div class="cell"><span>{{
          t(
            LABEL_KEY +
              ".texts.total" +
              `${
                bankingTransactionsStore?.dataDetailsPayment?.isPartialPayment
                  ? "2"
                  : ""
              }`
          )  
        }}</span></div>
      <div class="cell truncateText">
        <span
          class="truncateText"
          v-text="
            bankingTransactionsStore?.dataDetailsPayment?.numbers?.total?.value
          "
          :title="
            bankingTransactionsStore?.dataDetailsPayment?.numbers?.total?.number
          "
        ></span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.table {
  max-height: calc(100vh - 500px);
  overflow-x: auto;
}
.table::-webkit-scrollbar {
  width: 0px;
  height: 0px;
}
.table::-webkit-scrollbar-thumb {
  background-color: var(--neutral-border-subtle);
  border-radius: 5px;
}

.table__header,
.table__item,
.table__footer {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
}
.table__header .cell {
  background-color: var(--neutral-surface-light);
  height: 36px;
  display: flex;
  align-items: center;
  padding: 0 12px;
  border-bottom: 1px solid var(--neutral-border-subtle);
  border-top: 1px solid var(--neutral-border-subtle);
}
.table__header .cell:nth-child(1) {
  border-radius: 12px 0 0 0;
  border-left: 1px solid var(--neutral-border-subtle);
}
.table__header .cell:nth-child(3) {
  border-radius: 0 12px 0 0;
  border-right: 1px solid var(--neutral-border-subtle);
}
.table__header .cell:nth-child(3),
.table__item .cell:nth-child(3) {
  justify-content: flex-end;
}
.table__header .cell span {
  font-weight: 600;
  font-size: 14px;
  line-height: 18px;
  letter-spacing: 0%;
  vertical-align: bottom;
  color: var(--neutral-text-caption);
}
.table__item .cell {
  background-color: var(--neutral-backgorund-default);
  height: 48px;
  display: flex;
  align-items: center;
  padding: 0 12px;
  border-bottom: 1px solid var(--neutral-border-subtle);
}
.table__item .cell span {
  font-weight: 500;
  font-size: 14px;
  line-height: 18px;
  letter-spacing: 0%;
  vertical-align: middle;
  color: var(--neutral-text-body);
}
.table__item .cell:nth-child(1) {
  border-left: 1px solid var(--neutral-border-subtle);
}
.table__item .cell:nth-child(2) {
  display: grid;
  padding: 4px 12px;
}
.table__item .cell:nth-child(2) span,
.table__item .cell:nth-child(2) a,
.table__item .cell:nth-child(2) a span {
  line-height: 15px !important;
}
.table__item .cell:nth-child(2) a:nth-of-type(1) {
  font-weight: 600;
  font-size: 14px;
  line-height: 18px;
  letter-spacing: 0%;
  vertical-align: middle;
  color: var(--neutral-text-body);
}
.table__item .cell:nth-child(2) a:nth-of-type(1):hover {
  color: var(--primary-text-default);
}
.table__item .cell:nth-child(2) a:nth-of-type(2) span {
  font-size: 12px;
  color: var(--neutral-text-caption);
  transition: 0.3s;
}
.table__item .cell:nth-child(2) a:nth-of-type(2):hover span {
  color: var(--primary-text-subtle);
}
.table__item .cell:nth-child(2) a:nth-of-type(2) span.u {
  margin-right: 5px;
}
.table__item .cell:nth-child(3) {
  border-right: 1px solid var(--neutral-border-subtle);
}
.table__item:last-child .cell:nth-child(1) {
  border-radius: 0 0 0 12px;
}

.table__footer .cell:not(:first-child) {
  background-color: var(--neutral-surface-light);
  height: 36px;
  display: flex;
  align-items: center;
  padding: 0 12px;
}
.table__footer .cell span {
  font-weight: 800;
  font-size: 14px;
  line-height: 18px;
  letter-spacing: 0%;
  text-align: justify;
  vertical-align: bottom;
  color: var(--neutral-text-body);
}
.table__footer .cell:nth-child(2) {
  border-left: 1px solid var(--neutral-border-subtle);
  border-bottom: 1px solid var(--neutral-border-subtle);
  border-radius: 0 0 0 12px;
}
.table__footer .cell:nth-child(3) {
  border-right: 1px solid var(--neutral-border-subtle);
  border-bottom: 1px solid var(--neutral-border-subtle);
  border-radius: 0 0 12px 0;
  justify-content: flex-end;
}
</style>
