<script setup>
import { ref, onUnmounted } from "vue";
import useOutcomesStore from "@/stores/outcomes";
import useSalesStore from "@/stores/sales";
import useGlobalStore from "@/stores/global";
import { useI18n } from "vue-i18n";

// Stores
const outcomesStore = useOutcomesStore();
const globalStore = useGlobalStore();
const salesStore = useSalesStore();

// Constants
const { t } = useI18n();
const module = "modules.sales.sale.tabs.tab5.information.groups[2].texts";
const { params } = useRoute();
const idSalesDocument = params && params.id ? params.id : null;

// Vars
const loadings = ref({
  observation: false,
  internal: false,
});

// Functions
const save = async (prop) => {
  if (outcomesStore.outcome.status !== "voided") {
    try {
      globalStore.loading = true;
      let body = {};
      body[prop] = salesStore.sale.documentInformation[prop];
      await salesStore.updateSalesDocumentLine(idSalesDocument, body);
      await salesStore.getDetailSaleDocumentById(idSalesDocument);
    } catch (error) {
      console.error(error);
    } finally {
      globalStore.loading = false;
    }
  }
};

</script>

<template>
  <div class="notes">
    <div class="notes__box">
      <span class="label"
        >{{ t(module + ".text1.label") }}
        <strong>{{ t(module + ".text1.text") }}</strong></span
      >
      <u-textarea-html
        v-model="salesStore.sale.documentInformation.note"
        :placeholder="t(module + '.text1.placeholder')"
        :disabled="loadings.internal"
        heightCustom="180px"
        @change="save('note')"
      />
    </div>
    <div class="notes__box">
      <span class="label"
        >{{ t(module + ".text2.label") }}
        <strong>{{ t(module + ".text2.text") }}</strong></span
      >
      <u-textarea-html
        v-model="salesStore.sale.documentInformation.observation"
        :placeholder="t(module + '.text2.placeholder')"
        :disabled="loadings.observation"
        heightCustom="180px"
        @change="save('observation')"
      />
    </div>
  </div>
</template>

<style scoped>
.notes {
  padding: 24px;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}
.notes__box {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.notes__box .label {
  font-weight: 600;
  font-size: 14px;
  line-height: 14px;
  letter-spacing: 10%;
  vertical-align: middle;
  color: var(--neutral-text-caption);
}
.notes__box .label strong {
  font-size: 10px;
  font-weight: 600;
  text-transform: uppercase;
}
</style>
