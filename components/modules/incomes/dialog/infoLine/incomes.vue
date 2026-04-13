<script setup>
import { ref } from "vue";
import { useI18n } from "vue-i18n";
import useLinesStore from "@/stores/lines";
import useIncomesStore from "@/stores/incomes";
import useGrillaStore from "@/stores/grilla";
import { formatCurrency } from "@/utils/formatAmount";

// Stores
const linesStore = useLinesStore();
const incomesStore = useIncomesStore();
const grillaStore = useGrillaStore();

// Contants
const { t } = useI18n();
const module = "grilla.dialogs.infoLine";
const defaultAmount = formatCurrency(
  0,
  incomesStore.currencyFormat.default,
  true,
);

// Variables
const savePending = ref(false);

// Functions
const addSurchargeLine = async (surcharge, type = "") => {
  if (surcharge.surchargeVariables.sumPrice.state === "NoTotal") {
    return;
  }

  grillaStore.configModalInfoLine.loading = true;
  incomesStore.loadings.metrics = true;

  const line = linesStore.line;

  const prop = "surchargesLines";

  if (linesStore.line[prop].includes(surcharge._id)) {
    //quitar id de line.surchargesLines o line.surchargesLinesBudget
    linesStore.line[prop] = linesStore.line[prop].filter(
      (id) => id !== surcharge._id,
    );
  } else {
    line[prop].push(surcharge._id);
  }

  if (type === "budget") {
    linesStore.line.changeBudgetTax = true;
  } else {
    if (!line.changeBudgetTax) {
      line.surchargesLinesBudget = JSON.parse(
        JSON.stringify(line.surchargesLines),
      );
      linesStore.switchesBudget = JSON.parse(
        JSON.stringify(linesStore.switches),
      );
    }
  }

  const indexNew = linesStore.lines.findIndex((sur) => sur._id === line._id);
  linesStore.lines[indexNew][prop] = line[prop];
  const data = await linesStore.putLine({
    ...linesStore.line,
    editSurcharge: true,
  });
  linesStore.lines[linesStore.line.pos] = data;
  linesStore.calculateTotalLine();
  linesStore.updateDataGrid();
  grillaStore.configModalInfoLine.loading = false;
};
const getValueLine = (surcharge, index, type = "") => {
  const line = linesStore.line;
  const prop = "surchargesLines" + (type === "budget" ? "Budget" : "");
  const propTotal = "totalLine" + (type === "budget" ? "Budget" : "");
  const propSwitch = "switches" + (type === "budget" ? "Budget" : "");
  if (line[prop].length > 0 && line[prop].includes(surcharge._id)) {
    linesStore[propSwitch][index] = true;
    return linesStore[propTotal][index].value;
  } else {
    linesStore[propSwitch][index] = false;
    return defaultAmount;
  }
};
</script>

<template>
  <div class="containerDialog__form">
    <div class="mainLabel">
      <span>{{ t(module + ".subtext1") }}</span>
      <span class="amount">
        {{ linesStore.line?.numbers?.sumPrice?.value }}
      </span>
    </div>
    <template
      v-for="(surcharge, index) in linesStore.linesSurcharges"
      :key="index"
    >
      <div class="normalLabel" v-if="!surcharge.isCut">
        <div class="box">
          <u-switch
            v-model="linesStore.switches[index]"
            @click="addSurchargeLine(surcharge)"
            :disabled="
              surcharge.surchargeVariables.sumPrice.state !== 'toLines' ||
              grillaStore.configModalInfoLine.loading
            "
          />
          <span
            class="truncateText"
            v-text="surcharge.name"
            :title="surcharge.name"
          ></span>
        </div>
        <span
          class="amount"
          v-if="surcharge.surchargeVariables.sumPrice.state === 'toLines'"
        >
          {{ getValueLine(surcharge, index) }}
        </span>
      </div>
    </template>
  </div>
</template>

<style scoped>
.containerDialog__form {
  width: 100%;
  height: calc(100vh - 80px - 40px - 32px - 50px);
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 10px;
  box-sizing: border-box;
  overflow-y: auto;
}
.mainLabel,
.normalLabel,
.endLabel {
  flex-shrink: 0;
  height: 40px;
  padding: 0 18px;
  display: grid;
  grid-template-columns: auto 1fr;
  align-items: center;
  gap: 10px;
  border-radius: 14px;
}
.mainLabel {
  background-color: var(--neutral-surface-shadow-8a);
  margin-bottom: 10px;
}
.endLabel {
  background-color: var(--primary-surface-shadow-8a);
}
.normalLabel {
  height: 32px;
}
.mainLabel span,
.endLabel span,
.normalLabel span,
.normalLabel strong {
  font-size: 14px;
  line-height: 18px;
  letter-spacing: 0%;
  vertical-align: middle;
  color: var(--neutral-text-body);
}
.mainLabel span.amount,
.endLabel span.amount,
.normalLabel span.amount {
  text-align: right;
}
.mainLabel span,
.endLabel span {
  font-weight: 800;
}
.normalLabel span {
  font-weight: 600;
}
.normalLabel .box {
  max-width: 180px;
  display: grid;
  grid-template-columns: 40px auto auto;
  align-items: center;
  gap: 6px;
}
</style>
