<script setup>
import useGlobalStore from "@/stores/global";
import useSalesStore from "@/stores/sales";
import { computed } from "vue";
import {
  transformedDate,
  formatNormalDate,
  capitalizeFirstLetter,
  dateToIso,
} from "@/utils/helpers";
import { useI18n } from "vue-i18n";

// Stores
const globalStore = useGlobalStore();
const salesStore = useSalesStore();

// Route Params
const { params } = useRoute();
const idSale = params && params.id ? params.id : null;

// Constants
const { t } = useI18n();
const module = "modules.sales.sale.tabs.tab5.information";
const module2 = "mmodules.sales.sale.tabs.tab5.information.groups[2]";

// Functions
const reloadInfoDocument = async () => {
  globalStore.loading = true;
  await salesStore.getDetailSaleDocumentById(idSale);
  globalStore.loading = false;
}

onMounted(async () => {
  await reloadInfoDocument();
});
</script>

<template>
  <div class="information">
    <!-- Informacion General -->
    <div class="information__card">
      <div class="information__card-header">
        <span class="title" v-text="t(module + '.groups[0].label')"></span>
      </div>
      <div class="information__card-form">
        <!-- Creado por -->
        <div class="information__group">
          <span
            class="label"
            v-text="t(module + '.groups[0].inputs[0]')"
          ></span>
          <div class="avatar">
            <u-avatar
              :size="24"
              :user="{
                src: salesStore?.sale?.documentInformation?.creator?.user?.imgUrl,
                name: salesStore?.sale?.documentInformation?.creator?.user?.data
                  ?.legalName,
              }"
            />
            <span class="information__group-value">{{
              salesStore?.sale?.documentInformation?.creator?.user?.data?.legalName
            }}</span>
          </div>
        </div>
        <!-- Anulado por -->
        <div class="information__group">
          <span
            class="label"
            v-text="t(module + '.groups[0].inputs[1]')"
          ></span>
          <div class="avatar">
            <u-avatar :size="24" :user="{ src: salesStore?.sale?.documentInformation?.voidedBy?.imgUrl, name: salesStore?.sale?.documentInformation?.voidedBy?.data?.name?.first }"  />
            <span class="information__group-value">{{ salesStore?.sale?.documentInformation?.voidedBy ? salesStore?.sale?.documentInformation?.voidedBy?.data?.name?.first + " " + salesStore?.sale?.documentInformation?.voidedBy?.data?.name?.last : "" }}</span>
          </div>
        </div>
        <!-- Fecha de creación -->
        <div class="information__group">
          <span
            class="label"
            v-text="t(module + '.groups[0].inputs[2]')"
          ></span>
          <span class="information__group-value">{{
            salesStore?.sale?.documentInformation?.createdAt
              ? formatNormalDate(salesStore?.sale?.documentInformation?.createdAt)
              : "-"
          }}</span>
        </div>
        <!-- Fecha de vencimiento -->
        <div class="information__group">
          <span
            class="label"
            v-text="t(module + '.groups[0].inputs[3]')"
          ></span>
          <span class="information__group-value">{{ salesStore?.sale?.documentInformation?.voidedDate? formatNormalDate(salesStore?.sale?.documentInformation?.voidedDate) : "-" }}</span>
        </div>
      </div>
    </div>
    <!--Documentos referenciados -->
    <div class="information__card">
      <div class="information__card-header">
        <span class="title" v-text="t(module + '.groups[1].label')"></span>
      </div>
      <SalesContainerComponentsDocumentsInfoFilesDocRef @reloadData="reloadInfoDocument" />
    </div>
    <!-- Condiciones y Observaciones -->
    <div class="information__card information__card-notes">
      <div class="information__card-header">
        <span class="title" v-text="t(module + '.groups[2].label')"></span>
      </div>
      <SalesContainerComponentsDocumentsInfoNotes />
    </div>

    <!-- Archivos Adjuntos -->
    <div class="information__card">
      <div class="information__card-header">
        <span class="title" v-text="t(module + '.groups[2].label')"></span>
      </div>
      <div class="information__card-files">
        <SalesContainerComponentsDocumentsInfoFiles @reloadData="reloadInfoDocument" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.information {
  display: flex;
  flex-direction: column;
  gap: 20px;
  overflow: auto;
  width: v-bind(
    "globalStore.sliderExpand ? 'calc(100vw - 318px)' : 'calc(100vw - 160px)'"
  );
  height: 100%;
  padding-right: 4px;
  transition: 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}
.information::-webkit-scrollbar {
  width: 8px;
  background: var(--neutral-surface-light);
  border-radius: 20px;
}
.information::-webkit-scrollbar-thumb {
  background: var(--neutral-surface-subtle);
  border-radius: 5px;
}
.information__card {
  flex-shrink: 0;
  overflow: hidden;
  border-radius: 8px;
  border: 1px solid var(--neutral-border-subtle);
}
.information__card-header {
  background-color: var(--neutral-surface-softer);
  height: 36px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 24px;
}
.information__card-header .title {
  font-weight: 600;
  font-size: 14px;
  line-height: 18px;
  letter-spacing: 0%;
  vertical-align: middle;
  color: var(--neutral-text-body);
}
.information__card-form {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  column-gap: 48px;
  row-gap: 12px;
  padding: 12px 24px;
}
.information__card-form2 {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 12px 24px;
  height: auto;
}
.information__group span.label {
  font-weight: 600;
  font-size: 14px;
  line-height: 18px;
  letter-spacing: 0%;
  vertical-align: middle;
  color: var(--neutral-text-caption);
}
.information__group {
  display: grid;
  grid-template-columns: 145px 1fr;
  gap: 24px;
  align-items: center;
  height: 32px;
}
.information__card-form2 .information__group {
  height: 120px;
  grid-template-columns: 200px 1fr;
}
.information__group-value {
  font-weight: 600;
  font-size: 14px;
  line-height: 18px;
  letter-spacing: 0%;
  vertical-align: middle;
  color: var(--neutral-text-body);
}
.avatar {
  display: flex;
  gap: 8px;
  align-items: center;
}
.information__card-files {
  display: flex;
  padding: 12px 24px;
  gap: 20px;
  flex-wrap: wrap;
}
.information__card-refFiles {
  display: flex;
  padding: 12px 0px;
  gap: 20px;
  flex-wrap: wrap;
  width: 100%;
  height: 82px;
}
.information__card-notes {
  flex-grow: 1;
  min-height: 300px;
}
</style>
