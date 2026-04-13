<script setup>
import configTable from '@/utils/configTables/sales.json';
import useSalesStore from "@/stores/sales";
import useGlobalStore from "@/stores/global";
import { useI18n } from "vue-i18n";

// STORES
const salesStore = useSalesStore();
const globalStore = useGlobalStore();

// I18N
const { t } = useI18n();
const moduleTableTaxes = "modules.sales.tableTotalTaxes";

const redirectToBusiness = (item) => {
  const URL_BUSINESS = `/incomesv2/project/${item.project._id}/income/${item._id}`;
  navigateTo(URL_BUSINESS,{ external: true, open: { target: "_blank" } })
};

onMounted(async () => {
 globalStore.loading = true;
  salesStore.detailsSaleDocument = await salesStore.getSalesDocumentLinesByDocumentId(salesStore.detailsSaleDocument._id, false);
  globalStore.loading = false;
});

</script>

<template>
    <div class="container_sales">
        <div class="table_wrapper">
        <TableBasic :content="salesStore.detailsSaleDocument.lines" :configTable="configTable.detailsSales" :lazyRender="true" >
            <template #account="item">
                <span class="truncateText body-m-sb textNumber">{{ item?.item?.account?.name || '-' }}</span>
            </template>

            <template #business="item">
                <u-tags
                :text="`NEG-${item?.item?.referenceIncome?.idNumber || '-'} `"
                icon="click"
                size="xs"
                :delete="false"
                color="--info-surface-darker"
                background="--info-surface-light"
                class="truncateText"
                style="cursor: pointer; margin: 0 auto;"
                @click="redirectToBusiness(item?.item?.referenceIncome)"
              />
            </template>

            <template #briefDescription="item">
                <span class="truncateText body-m-sb textNumber">{{ item?.item?.description || '-' }}</span>
            </template>

            <template #invoiced="item">
                <span class="truncateText body-m-sb textNumber totalInvoice">{{ item?.item?.numbers?.totalNet?.value || '$ 0' }}</span>
            </template>

        </TableBasic>
        </div>

<div class="taxes">
  <div class="taxes__header">
    <div class="taxes__header-col first">
      <span v-text="t(moduleTableTaxes + '.subTotal')"></span>
    </div>
    <div class="truncateText taxes__header-col right colFXR">
      <span class="truncateText">{{ salesStore?.detailsSaleDocument?.salesDoc?.numbers?.totalNet?.value || '$ 0' }}</span>
    </div>
  </div>

  <div class="taxes__list">
    <div class="taxes__list-item" v-for="(tax, index) in salesStore?.detailsSaleDocument?.salesDoc?.numbers?.taxes" :key="index">
      <div class="taxes__list-item-col first">
        <span class="truncateText">{{ `${tax?.name} (${tax?.value}%)` }}</span>
      </div>
      <div class="truncateText taxes__list-item-col right percentage">
        <span class="truncateText">{{ tax?.total?.value }}</span>
      </div>
    </div>
    <div class="emptyTax" v-if="salesStore?.detailsSaleDocument?.salesDoc?.numbers?.taxes?.length === 0">
      <span v-text="t(moduleTableTaxes + '.msg.emptyTax')"></span>
    </div>
  </div>

  <div class="taxes__default tax">
    <div class="taxes__default-col first">
      <span v-text="t(moduleTableTaxes + '.taxes')"></span>
    </div>
    <div class="truncateText colFXR right">
      <span class="truncateText">{{ salesStore?.detailsSaleDocument?.salesDoc?.numbers?.totalTax?.value }}</span>
    </div>
  </div>

  <div class="taxes__default">
    <div class="taxes__default-col first">
      <span v-text="t(moduleTableTaxes + '.retentions')"></span>
    </div>
    <div class="truncateText colFXR right">
      <span class="truncateText">{{ `-${salesStore?.detailsSaleDocument?.salesDoc?.numbers?.totalRetencion?.value}` }}</span>
    </div>
  </div>

  <div class="taxes__footer">
    <div class="taxes__footer-col first">
      <span v-text="t(moduleTableTaxes + '.total')"></span>
    </div>
    <div class="truncateText taxes__footer-col right colFXR">
      <span class="truncateText">{{  salesStore?.detailsSaleDocument?.salesDoc?.numbers?.total?.value }}</span>
    </div>
  </div>
</div>

    </div>
</template>

<style scoped>
.container_sales {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.header_sales  {
    display: flex;
    align-items: center;
    gap: 16px;
}

/* TABLE */
.table_wrapper {
  max-height: 270px; 
  overflow-y: auto;
}

.totalInvoice {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    width: 100%;
}

.textNumber {
    color: var(--neutral-text-body);
}

/* TAXES */
.taxes {
  margin-left: auto;
  width: 400px;
  height: auto;
  border: 1px solid var(--neutral-border-light);
  border-radius: 16px;
  overflow: hidden;
  padding: 8px;
}

.taxes__header,
.taxes__footer,
.taxes__default,
.taxes__list-item {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.taxes__header-col,
.taxes__footer-col,
.taxes__default-col {
  display: flex;
  align-items: center;
  height: 32px;
}

.taxes__list-item-col.first span {
  flex-grow: 1;
}

.taxes__default-col.first,
.taxes__list-item-col.first,
.taxes__header-col.first,
.taxes__footer-col.first {
  padding-left: 25px;
}

.taxes__list-item-col {
  display: flex;
  align-items: center;
  height: 32px;
}

.taxes__footer {
  border-radius: 8px;
  overflow: hidden;
}

.taxes__footer-col {
  border-bottom: none;
}

.taxes__footer {
  background-color: var(--primary-surface-shadow-12a);
}

.taxes__default-col,
.taxes__list-item-col {
  border-bottom: none;
}

.taxes__list-item {
  position: sticky;
  left: 0;
}

.taxes__list-item-col {
  height: 28px;
}

.right {
  justify-content: flex-end;
}

.taxes__header-col span,
.taxes__footer-col span,
.taxes__default span,
.taxes__list-item-col span {
  font-weight: 800;
  font-size: 14px;
  line-height: 18px;
  letter-spacing: 0%;
  vertical-align: bottom;
  color: var(--neutral-text-body);
}

.taxes__list {
  overflow: auto;
  max-height: 138px;
  scrollbar-gutter: stable;
  position: relative;
  border-top: 1px solid var(--neutral-border-subtle);
  border-bottom: 1px solid var(--neutral-border-subtle);
  padding: 10px 0;
  margin-bottom: 10px;
}

.taxes__list::-webkit-scrollbar {
  width: 8px;
  height: 0px;
  background: var(--neutral-surface-light);
  border-radius: 20px;
}

.taxes__list::-webkit-scrollbar-thumb {
  background: var(--neutral-surface-subtle);
  border-radius: 5px;
}

.taxes__list-item-col span {
  font-weight: 600;
}

.taxes__default.first {
  border-top: 1px solid var(--neutral-border-light);
}

.taxes__list-item-col strong.percentage {
  color: var(--neutral-text-caption);
  font-size: 12px;
}

.taxes__list-item-col.percentage {
  padding-right: 12px;
}

.colFXR {
  display: flex;
  align-items: center;
  padding-right: 14px;
}

.emptyTax {
  height: 40px;
  display: flex;
  justify-content: center;
  align-items: center;
}

.emptyTax span {
  color: var(--neutral-text-caption);
  font-size: 14px;
}

.taxes__header {
  margin-bottom: 10px;
}

.taxes__footer {
  margin-top: 10px;
}
</style>