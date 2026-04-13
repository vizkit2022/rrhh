<script setup>
import { onMounted, ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import useGrillaStore from "@/stores/grilla";
import useLinesStore from "@/stores/lines";
import {
  transformedDate,
  getColorStatus,
  getNameStatus,
  capitalizeFirstLetter,
} from "@/utils/helpers";

// Stores
const linesStore = useLinesStore();
const grillaStore = useGrillaStore();

// Contants
const { t } = useI18n();
const module = "grilla.dialogs.infoLine";

// Variables
const purchases = ref([]);
const loadingPurchases = ref(false);
const loadPurchases = async (lineId) => {
  if (!lineId) return;
  try {
    loadingPurchases.value = true;
    purchases.value = await linesStore.purchasesByLine(lineId);
  } catch (error) {
    console.log(error);
  } finally {
    loadingPurchases.value = false;
  }
};

// Mounted
onMounted(() => {
  loadPurchases(linesStore.line?._id);
});

// Functions
const getSupplier = (purchase) => {
  const supplier = purchase.outcome.supplier;
  return {
    name: supplier.data.legalName,
    src: supplier.imgUrl,
  };
};
const getDocumentsByPurchase = async (purchase) => {
    purchase.showDocuments = !purchase.showDocuments;
    if(!purchase.uploadedDocuments) {
        purchase.loading = true;
        try {
          const documents = await linesStore.documentsByPurchaseLines(purchase._id);
          purchase.documentList = documents;
        } catch (error) {
          console.error(error);
        } finally {
          purchase.loading = false;
          purchase.uploadedDocuments = true;
        }
    }
};

// Watch
watch(
  () => linesStore.line?._id,
  (newId) => {
    if (newId) {
      if (linesStore.line.numbers.cost.number !== 0) {
        loadPurchases(newId);
      }
    }
  },
  { immediate: true },
);
</script>

<template>
  <div class="containerDialog__form">
    <div class="extraText" v-if="linesStore.line.numbers.cost.number === 0">
      <span>{{ t(module + ".noPurchases") }}</span>
    </div>
    <template v-else>
      <div class="extraText" v-if="loadingPurchases">
        <u-loading :width="20" />
        <span>{{ t(module + ".loadingPurchases") }}</span>
      </div>
      <template v-else>
        <div class="purchase" v-for="purchase in purchases" :key="purchase._id">
          <div class="purchase__header">
            <span
              >{{ t(module + ".labelPurchase") }}
              {{ purchase.outcome.idNumber }}</span
            >
            <span>{{ transformedDate(purchase?.createdAt) }}</span>
          </div>
          <div class="purchase__body">
            <u-avatar :user="getSupplier(purchase)" :size="48" />
            <div class="purchase__body-name">
              <div class="purchase__body-main">
                <span class="truncateText">{{
                  capitalizeFirstLetter(purchase.outcome.reference)
                }}</span>
                <a
                  :href="`/outcomes/${purchase?.outcome?._id}`"
                  target="_blank"
                  rel="noopener"
                  class="u u-open"
                ></a>
                <span
                  class="tag"
                  :style="`background-color: var(${getColorStatus(purchase?.status).background}); color: var(${getColorStatus(purchase?.status).color})`"
                  >{{ getNameStatus(purchase?.status, t) }}</span
                >
              </div>
              <span class="second">{{
                purchase.outcome.supplier.data.legalName
              }}</span>
            </div>
            <span class="value">{{ purchase?.numbers?.budget?.value }}</span>
          </div>
          <div class="purchase__footer">
            <div class="purchase__footer-sup">
              <u-button-icon
                icon="chevron-down"
                size="s"
                type="text"
                :disabled="purchase.numbers.documentedNet.number === 0"
                @click="getDocumentsByPurchase(purchase)"
                :style="`transform: rotate(${purchase.showDocuments ? 180 : 0}deg)`"
              />
              <span class="iconDocumented u u-invoice"></span>
              <span class="text">{{ t(module + ".documented") }}</span>
              <span
                :class="`amount ${purchase.numbers.documentedNet.number === 0 ? 'negative' : 'positive'}`"
                >{{ purchase.numbers.documentedNet.value }}</span
              >
            </div>
            <div class="purchase__footer-inf" v-if="purchase.showDocuments">
              <span v-if="purchase.loading" class="loading">{{
                t(module + ".load")
              }}</span>
              <div
                v-else
                class="purchase__footer-info--item"
                :style="`grid-template-columns: ${doc.document.files.length !== 0 ? 'auto auto 1fr' : 'auto 1fr'}`"
                v-for="doc in purchase.documentList"
                :key="doc._id"
              >
                <span class="name truncateText">{{
                  capitalizeFirstLetter(doc.document.reference)
                }}</span>
                <a
                  :href="doc.document?.files[0]?.url"
                  v-if="doc.document.files.length !== 0"
                  target="_blank"
                  rel="noopener"
                  class="u u-attach"
                ></a>
                <span class="amount">{{ doc.numbers.totalNet.value }}</span>
              </div>
            </div>
          </div>
        </div>
      </template>
    </template>
  </div>
</template>

<style scoped>
.containerDialog__form {
  width: 100%;
  height: auto;
  height: calc(100vh - 80px - 40px - 32px - 50px);
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 10px;
  box-sizing: border-box;
  overflow-y: auto;
  padding-bottom: 5px;
}
.containerDialog__form::-webkit-scrollbar {
  width: 10px;
  height: 10px;
}

.containerDialog__form::-webkit-scrollbar-thumb {
  background-color: var(--neutral-border-subtle);
  border-radius: 5px;
}
.purchase {
  width: calc(100% - 10px);
  margin: 0 5px;
  box-shadow: var(--elevation-xs);
  display: grid;
  grid-template-rows: repeat(3, auto);
  padding: 10px;
  border-radius: 12px;
}
.purchase__header {
  border-bottom: 1px solid var(--neutral-border-subtle);
  display: grid;
  grid-template-columns: 1fr auto;
  column-gap: 16px;
  align-items: center;
}
.purchase__header span {
  font-weight: 400;
  font-size: 10px;
  line-height: 14px;
  letter-spacing: 10%;
  vertical-align: middle;
  text-transform: uppercase;
  color: var(--neutral-text-caption);
}
.purchase__header span:nth-child(2) {
  text-align: right;
}
.purchase__body {
  padding: 10px 0;
  display: grid;
  grid-template-columns: 48px 1fr auto;
  column-gap: 16px;
  align-items: center;
}
.purchase__body-name {
  display: grid;
  grid-template-rows: auto auto;
  align-items: center;
}
.purchase__body-main {
  display: grid;
  grid-template-columns: 1fr auto auto;
  column-gap: 8px;
  align-items: center;
}
.purchase__body-main span:nth-child(1) {
  font-weight: 600;
  font-size: 14px;
  line-height: 18px;
  letter-spacing: 0%;
  vertical-align: middle;
  color: var(--neutral-text-body);
}
.purchase__body-main a {
  color: var(--neutral-text-caption);
  font-size: 18px;
  line-height: 18px;
}
.purchase__body-main span.tag {
  font-weight: 600;
  font-size: 12px;
  line-height: 16px;
  letter-spacing: 0%;
  vertical-align: middle;
  padding: 2px 12px;
  border-radius: 20px;
  text-align: center;
}
.purchase__body-name .second {
  font-size: 12px;
  line-height: 16px;
  letter-spacing: 0%;
  vertical-align: middle;
  color: var(--neutral-text-caption);
}
.purchase__body .value {
  font-weight: 600;
  font-size: 14px;
  line-height: 18px;
  letter-spacing: 0%;
  text-align: right;
  vertical-align: middle;
  color: var(--neutral-text-body);
}
.purchase__footer {
  border-radius: 12px;
  border: 1px solid var(--neutral-border-subtle);
}
.purchase__footer-sup {
  display: grid;
  grid-template-columns: auto auto 1fr auto;
  align-items: center;
  column-gap: 8px;
  padding: 0 12px 0 6px;
}
.purchase__footer-sup .text,
.purchase__footer-sup .amount {
  font-weight: 600;
  font-size: 14px;
  line-height: 14px;
  letter-spacing: 0%;
  vertical-align: middle;
}
.purchase__footer-sup .text {
  color: var(--neutral-text-body);
}
.purchase__footer-sup .amount {
  text-align: right;
}
.purchase__footer-sup .amount.negative {
  color: var(--danger-text-default);
}
.purchase__footer-sup .amount.positive {
  color: var(--neutral-text-body);
}
.purchase__footer-sup .iconDocumented {
  color: var(--danger-text-default);
}
.purchase__footer-sup button:disabled {
  color: var(--neutral-text-disabled);
}
.extraText {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 12px;
  height: 100px;
}
.extraText span {
  font-size: 16px;
  line-height: 16px;
  color: var(--neutral-text-caption);
}

.purchase__footer-inf {
  padding: 0 12px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding-bottom: 8px;
}

.purchase__footer-info--item {
  display: grid;
  align-items: center;
  column-gap: 8px;
  background-color: var(--neutral-surface-softer);
  border-radius: 8px;
  padding: 4px 12px;
}
.purchase__footer-info--item span.name,
.purchase__footer-info--item span.amount {
  font-weight: 600;
  font-size: 14px;
  line-height: 18px;
  letter-spacing: 0%;
  vertical-align: middle;
  color: var(--neutral-text-body);
}
.purchase__footer-info--item span.name {
  max-width: 160px;
}
.purchase__footer-info--item span.amount {
  text-align: right;
}
.purchase__footer-info--item a {
  color: var(--neutral-text-caption);
  font-size: 18px;
  line-height: 18px;
}
.purchase__footer-inf .loading {
  font-size: 12px;
  line-height: 12px;
  color: var(--neutral-text-caption);
  text-align: center;
}
</style>
