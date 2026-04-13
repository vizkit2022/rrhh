<script setup>
import { computed, defineProps } from "vue";
import useGlobalStore from "@/stores/global";
import { formatCurrency } from "@/utils/formatAmount";
import labels from "@/utils/labels/common.json";
import useOrganizationStore from "@/stores/organization";
import useOutcomesStore from "@/stores/outcomes";
const organizationStore = useOrganizationStore();
// Stores
const globalStore = useGlobalStore();
const outcomesStore = useOutcomesStore();

// Props
const props = defineProps({
  taxesList: {
    type: Object,
    default: () => {},
  },
  heightList: {
    type: String,
    default: "160px",
  },
  page: {
    type: String,
    default: "",
  },
  propertyStoreTotals: {
    type: String,
    default: "outcome_active", //formOc para el formulario de creacion
  },
});

const currencyFormat =
  outcomesStore[props.propertyStoreTotals]?.currency?.default ||
  organizationStore?.organization?.currency ||
  null;
// Computed
const label = computed(() => {
  return labels.modal.createOc.step3.table.taxes;
});
</script>

<template>
  <div class="table" v-if="label">
    <div class="table__header">
      <span>{{ label.title[globalStore.lang] }}</span>
      <span class="right">{{
        formatCurrency(props.taxesList.totalNet.number, currencyFormat, true)
      }}</span>
    </div>
    <div class="table__list">
      <template v-if="props.taxesList.taxes.length">
        <div class="item" v-for="tax in props.taxesList.taxes" :key="tax._id">
          <div class="text">
            <span class="truncateText">{{ tax.name }}</span>
            <strong>({{ tax.value }}%)</strong>
          </div>
          <span class="right">{{
            formatCurrency(tax.total.numberAprox || 0, currencyFormat, true)
          }}</span>
        </div>
      </template>
      <div v-else class="noTax">
        <u-tax :width="40" />
        <span>{{ label.msg[globalStore.lang] }}</span>
      </div>
    </div>
    <div class="table__subfooter">
      <span>{{ $t("minitaxes.text.tax") }}</span>
      <span class="right">{{
        formatCurrency(
          props?.taxesList?.totalTaxAddition?.numberAprox || 0,
          currencyFormat,
          true
        ) || "null"
      }}</span>

      <span>{{ $t("minitaxes.text.retencion") }}</span>
      <span class="right">{{
        formatCurrency(
          props?.taxesList?.totalRetencion?.numberAprox || 0,
          currencyFormat,
          true
        ) || "null"
      }}</span>
    </div>
    <div class="table__footer">
      <span>{{ $t("minitaxes.text.totalwithtax") }}</span
      ><span class="right">{{
        formatCurrency(
          props.taxesList.total.numberAprox || 0,
          currencyFormat,
          true
        )
      }}</span>
    </div>
  </div>
</template>

<style scoped>
span {
  font-family: Nunito;
}
.table {
  border: 1px solid var(--neutral-border-subtle);
  border-radius: 16px;
  padding: 8px;
  height: auto;
  /* max-height: 275px; */
  width: 100%;
  position: relative;
}
.table__header,
.item,
.table__subfooter,
.table__footer {
  display: grid;
  grid-template-columns: 1fr 120px;
  height: 32px;
  align-items: center;
  gap: 10px;
}
.table__subfooter {
  height: 64px;
  column-gap: 10px;
  row-gap: 0px;
}
.item {
  padding: 0
    v-bind(
      "props.taxesList && props.taxesList.taxes && props.taxesList.taxes.length >= 6 ? '10px' : '18px'"
    )
    0 18px;
}
.text {
  display: grid;
  grid-template-columns: auto 1fr;
  align-items: center;
  gap: 5px;
}
.tex span {
  font-size: 14px;
  font-weight: 600;
  line-height: 18px;
  color: var(--neutral-text-body);
}
.text strong {
  font-size: 10px;
  color: var(--neutral-text-caption);
}
.table__header,
.table__subfooter,
.table__footer {
  padding: 0 18px;
}
.table__header {
  border-bottom: 1px solid var(--neutral-border-subtle);
  top: 0;
}
.table__subfooter {
  bottom: 64px;
  border-top: 1px solid var(--neutral-border-subtle);
  background-color: var(--neutral-background-default);
}
.table__footer {
  bottom: 0;
  background-color: var(--primary-surface-shadow-12a);
  border-radius: 8px;
}
.right {
  text-align: end;
}
.table__header span,
.item span,
.table__subfooter span,
.table__footer span {
  font-size: 14px;
  line-height: 18px;
  color: var(--neutral-text-body);
}
.table__header span,
.table__subfooter span,
.table__footer span {
  font-weight: 800;
}
.item span {
  font-weight: 400;
}
.table__header span:nth-child(even),
.item span:nth-child(even),
.table__subfooter span:nth-child(2even),
.table__footer span:nth-child(even) {
  text-align: right;
}
.table__list {
  height: v-bind("props.heightList");
  min-height: 50px;
  overflow-y: auto;
}
.table__list::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}
.table__list::-webkit-scrollbar-thumb {
  border-radius: 5px;
  background: var(--neutral-surface-light);
}
.table__list::-webkit-scrollbar-track {
  background: var(--neutral-surface-subtle);
  border-radius: 4px;
}
.noTax {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: v-bind("props.heightList");
  gap: 10px;
  padding: 20px 0;
}
.noTax span {
  font-size: 14px;
  line-height: 18px;
  color: var(--neutral-text-caption);
}
</style>
