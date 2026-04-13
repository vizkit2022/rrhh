<script setup>
import { defineProps, defineEmits } from "vue";
import useOutcomesStore from "@/stores/outcomes";
import useGlobalStore from "@/stores/global";

// Stores
const outcomesStore = useOutcomesStore();
const globalStore = useGlobalStore();

// EMITS
const emit = defineEmits(["refreshData"]);

// Props
const props = defineProps({
  taxes: {
    type: Object,
    default: () => {},
  },
  usedIds: {
    type: Array,
    default: () => [],
  },
  filterTaxes: {
    type: Boolean,
    default: false,
  },
  single: {
    type: Boolean,
    default: false,
  },
  onlyTotal: {
    type: Boolean,
    default: false,
  },
  btnMatch: {
    type: Boolean,
    default: true,
  },
  match: {
    type: Boolean,
    default: false,
  },
});

// Constants
const { t } = useI18n();
const module = "modules.outcomes.pages.oc.sections.purchases.table.footer";
const buttons = "modules.outcomes.pages.oc.sections.purchases.table.buttons";
const { params } = useRoute();
const idOC = params && params.id ? params.id : null;

// Functions
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const equalAmount = async () => {
  try {
    globalStore.loading = true;
    await outcomesStore.equalAmount(idOC);
    await delay(2000);
    await outcomesStore.get_outcomes(idOC);
    emit("refreshData");
  } catch (error) {
    console.error(error);
    globalStore.loading = false;
  }
};

// Computed
const computedTaxes = computed(() => {
  let listTaxes = [];

  props.taxes?.taxes?.forEach((tax) => {
     let obj = {
        ...tax,
        normal: {
          ...tax.total,
        },
        documented: {},
      };
      delete obj.total;
      listTaxes.push(obj);
  });

  if (props.match) {
    props.taxes?.documentedTaxes?.forEach((tax) => {
      const pos = listTaxes.findIndex((i) => i.tax === tax.tax);
      if (pos !== -1) {
        listTaxes[pos].documented = { ...tax.total };
      } else {
        let obj = {
          ...tax,
          normal: {},
          documented: { ...tax.total },
        };
        delete obj.total;
        listTaxes.push(obj);
      }
    });
  }

  if (props.filterTaxes) {
    listTaxes = listTaxes.filter((t) => props.usedIds.includes(t.tax));
  }

  return {
    ...props.taxes,
    listTaxes,
  };
});

// const isTaxesSelected = computed(() => {
//   return computedTaxes?.value?.listTaxes?.some((tax) => tax.select);
// })
</script>

<template>
  <div class="taxes">
    <div class="taxes__header" v-if="!props.onlyTotal">
      <div class="taxes__header-col first">
        <span v-text="t(module + '.subTotal')"></span>
      </div>
      <div class="taxes__header-col right colFXR">
        <span
          class="truncateText"
          v-text="computedTaxes?.totalNet?.value"
          :title="computedTaxes?.totalNet?.number"
        ></span>
      </div>
      <div v-if="!props.single" class="taxes__header-col right last">
        <span
          v-text="computedTaxes?.documentedNet?.value"
          :title="computedTaxes?.documentedNet?.number"
        ></span>
      </div>
    </div>
    <div class="taxes__list" v-if="!props.onlyTotal">
      <div v-for="tax in computedTaxes?.listTaxes || []" :key="tax.tax" v-if=" props.usedIds.length > 0">
        <div class="taxes__list-item">
          <div class="taxes__list-item-col first">
            <span class="truncateText" :title="`${tax.name} (${tax.value}%)`"
              >{{ tax.name }}
              <strong class="percentage">({{ tax?.value + "%" }})</strong></span
            >
          </div>
          <div class="taxes__list-item-col right percentage">
            <span
              class="truncateText"
              v-text="tax?.normal?.value || '-'"
              :title="tax?.normal?.number || 0"
            ></span>
          </div>
          <div
            v-if="!props.single"
            class="taxes__list-item-col right last"
            style="padding-right: 40px !important; color: red"
          >
            <span
              v-text="tax?.documented?.value || '-'"
              :title="tax?.documented?.number || 0"
            ></span>
          </div>
        </div>
      </div>
      <div class="emptyTax" v-else>
        <span v-text="t(module + '.empty')"></span>
      </div>
    </div>
    <div class="taxes__default tax" v-if="!props.onlyTotal">
      <div class="taxes__default-col first">
        <span v-text="t(module + '.taxes')"></span>
      </div>
      <div class="colFXR right">
        <span
          class="truncateText"
          v-text="computedTaxes?.totalTaxAddition?.value"
          :title="computedTaxes?.totalTaxAddition?.number"
        ></span>
      </div>
      <div v-if="!props.single" class="taxes__default-col right last">
        <span
          v-text="computedTaxes?.documentedTotalTaxAddition?.value"
          :title="computedTaxes?.documentedTotalTaxAddition?.number"
        ></span>
      </div>
    </div>
    <div class="taxes__default" v-if="!props.onlyTotal">
      <div class="taxes__default-col first">
        <span v-text="t(module + '.retention')"></span>
      </div>
      <div class="colFXR right">
        <span
          class="truncateText"
          v-text="computedTaxes?.totalRetencion?.value"
          :title="computedTaxes?.totalRetencion?.number"
        ></span>
      </div>
      <div v-if="!props.single" class="taxes__default-col right last">
        <span
          v-text="computedTaxes?.documentedTotalRetencion?.value"
          :title="computedTaxes?.documentedTotalRetencion?.number"
        ></span>
      </div>
    </div>
    <div class="taxes__footer">
      <div class="taxes__footer-col first">
        <span v-text="t(module + '.total')"></span>
      </div>
      <div class="taxes__footer-col right colFXR">
        <span
          class="truncateText"
          v-text="computedTaxes?.total?.value"
          :title="computedTaxes?.total?.number"
        ></span>
      </div>
      <div v-if="!props.single" class="taxes__footer-col right last">
        <span
          v-text="computedTaxes?.documented?.value"
          :title="computedTaxes?.documented?.number"
        ></span>
      </div>
    </div>
    <u-button
      v-if="!props.single && props.btnMatch"
      :text="t(buttons + '.amounts')"
      type="outlined"
      icon="fast-zap"
      class="btnMain"
      @click="equalAmount"
    />
  </div>
</template>

<style scoped>
.taxes {
  margin-left: auto;
  width: v-bind("props.single ? '400px' : '700px'");
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
  grid-template-columns: v-bind("props.single ? '1fr 1fr' : '250px 1fr 1fr'");
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

.taxes__default-col.last,
.taxes__item-col.last,
.taxes__header-col.last,
.taxes__footer-col.last {
  padding-right: 50px !important;
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

.truncateText {
  width: 120px;
}

.taxes__list-item-col.percentage {
  padding-right: 12px;
}

input {
  height: 26px;
  border: 1px solid var(--neutral-border-subtle);
  border-radius: 8px;
  text-align: end;
  padding: 0 8px;
  width: 100%;
  color: var(--neutral-text-body);
  font-weight: 600;
  font-size: 14px;
  line-height: 18px;
  letter-spacing: 0%;
  vertical-align: middle;
  transition: 0.3s;
}

.colFXR {
  display: flex;
  align-items: center;
  padding-right: 14px;
}

input::selection {
  background-color: var(--primary-text-subtle);
  color: var(--neutral-background-default);
}

input:hover:not(:focus) {
  border: 1px solid var(--primary-border-subtle);
}

input:focus,
input:active {
  caret-color: var(--primary-text-subtle);
  border: 1px solid var(--primary-text-subtle);
  box-shadow: inset var(--primary-text-subtle) 0px 0px 0px 1px;
}

.btnMain {
  width: 100%;
  margin-top: 10px;
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
  margin-top: v-bind("props.onlyTotal ? '0px' : '10px'");
}
</style>
