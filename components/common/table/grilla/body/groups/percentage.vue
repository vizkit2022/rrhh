<script setup>
import { defineProps, computed } from "vue";
import useGrillaStore from "@/stores/grilla";
import useLinesStore from "@/stores/lines";
import useIncomeStore from "@/stores/incomes";
import usePermissionsStore from "@/stores/permissions";
import { buildCurrencyObject } from "@/utils/formatAmount";

// Store
const grillaStore = useGrillaStore();
const linesStore = useLinesStore();
const incomesStore = useIncomeStore();
const permissionsStore = usePermissionsStore();

// Props
const props = defineProps({
  config: {
    type: Object,
    default: () => ({}),
  },
  line: {
    type: Object,
    default: () => ({}),
  },
  id: {
    type: String,
    default: "",
  },
});

// Constant (memoizados eficientemente)
const index = computed(() =>
  linesStore.lines.findIndex((l) => l.__id === props.line.data.__id),
);
const decimals = 2;
const objValueTemp = ref(null);
const navigationKeys = [
  "ArrowLeft",
  "ArrowRight",
  "ArrowUp",
  "ArrowDown",
  "Tab",
  "Enter",
];
const exitInputKeys = ["Escape"];
const isPrice = ref(true); // true -> Afecta al Ventas / false -> Afecta al Presupuesto

// Computed
const isDeleting = computed(() => props?.line?.data?.__deleting || false);
const existsInBackend = computed(() => props?.line?.data?._id);
const isParent = computed(() => props?.line?.data?.isParent);
const disabled = computed(
  () => !existsInBackend.value || isDeleting.value || grillaStore.updating,
);
const currency = computed(() => {
  const defaultCurrency = incomesStore?.income?.currency?.default || {};

  const data = props.line?.data;

  if (isPrice.value) return data?.currency || defaultCurrency;
  else return data?.currencyBudget || defaultCurrency;
});
const val = computed(() => {
  const prop = props.config?.subcolumn?.prop;
  const cellData = props.line?.data?.numbers?.[prop];

  if (!cellData) return "0 %";

  return cellData.value || "0 %";
});

// Input events
const focusEvent = (e) => {
  // Al hacer focus: quitar el símbolo % para que el usuario vea solo el número
  const currentVal = e.target.value;
  e.target.value = currentVal.replace(/\s*%\s*/, "").trim();
  e.target.select();
};

const blurEvent = (e) => {
  // Al perder el foco: si hay valor, agregar el símbolo %
  const currentVal = e.target.value.trim();
  if (currentVal !== "" && !currentVal.includes("%")) {
    e.target.value = `${currentVal} %`;
  } else if (currentVal === "") {
    e.target.value = "0 %";
  }
};

const keydownEvent = (e) => {
  const key = e.key || "";
  // Navegación entre celdas
  if (navigationKeys.includes(key)) {
    e.preventDefault();
    const obj = { e, id: props.id };
    grillaStore.navigateGridInputs(obj);
  } else if (exitInputKeys.includes(key)) {
    // Perder el foco del input
    e.preventDefault();
    e.target.blur();
    return;
  }
};

const inputEvent = (e) => {
  const decimalSeparator = ",";
  const maxDecimals = decimals;
  let inputVal = e.target.value;

  // Si está vacío, permitir pero limpiar temp
  if (inputVal === "") {
    e.target.value = "";
    objValueTemp.value = null;
    return;
  }

  // Solo permitir dígitos y una coma como separador decimal
  inputVal = inputVal.replace(/[^0-9,]/g, "");

  // Solo permitir una coma decimal
  const parts = inputVal.split(decimalSeparator);
  if (parts.length > 2) {
    inputVal =
      parts[0] +
      decimalSeparator +
      parts.slice(1).join("").replaceAll(decimalSeparator, "");
  }

  // Limitar cantidad de decimales
  const newParts = inputVal.split(decimalSeparator);
  if (newParts.length === 2 && newParts[1].length > maxDecimals) {
    inputVal =
      newParts[0] + decimalSeparator + newParts[1].substring(0, maxDecimals);
  }

  e.target.value = inputVal;

  // Construir objeto con value (con símbolo) y number
  const numericValue = parseFloat(inputVal.replace(decimalSeparator, "."));

  if (!isNaN(numericValue)) {
    objValueTemp.value = {
      value: `${inputVal} %`,
      number: numericValue,
    };
  } else {
    objValueTemp.value = null;
  }
};

const changeEvent = () => {
  const currentCell = linesStore.lines[index.value];
  const margen =
    objValueTemp.value?.number ?? currentCell.numbers.projectedMargin.number;

  currentCell.changeBudget = true;

  if (isPrice.value) {
    const c1 = currentCell.numbers.amount1.number;
    const c2 = currentCell.numbers.amount2.number;
    const c3 = currentCell.numbers.amount3.number || 1;
    const sumBudget = currentCell.numbers.sumBudget.number;

    const price =
      c1 === 0 || c2 === 0
        ? 0
        : sumBudget / ((1 - margen / 100) * c1 * c2 * c3);
    currentCell.numbers.price = buildCurrencyObject(
      price,
      currency.value,
      "currency",
    );
  } else {
    const c1 = currentCell.numbers.budgetAmount1.number;
    const c2 = currentCell.numbers.budgetAmount2.number;
    const c3 = currentCell.numbers.budgetAmount3.number || 1;
    const sumPrice = currentCell.numbers.sumPrice.number;

    const budget =
      c1 === 0 || c2 === 0
        ? 0
        : (sumPrice * (1 - margen / 100)) / (c1 * c2 * c3);
    currentCell.numbers.budget = buildCurrencyObject(
      budget,
      currency.value,
      "currency",
    );
  }

  linesStore.lines[index.value] = currentCell;
  saveValue();
};

// Guardar cambios
const saveValue = async () => {
  const el = {
    prop: props.config?.subcolumn?.prop || "",
    index: index.value,
  };

  await grillaStore.updateLineFromCell(el);
  objValueTemp.value = null;
};
</script>

<template>
  <div class="number">
    <span v-if="isParent">{{ val }}</span>
    <table-grilla-body-groups-input-cell
      v-else
      :id="props?.id || ''"
      :value="val"
      :config="config"
      :line="line"
      :disabled="
        !permissionsStore?.myPermissions?.income__grid_line_modify_name ||
        props?.line?.data?.__deleting ||
        grillaStore.updating
      "
      @focus="focusEvent"
      @blur="blurEvent"
      @input="inputEvent"
      @change="changeEvent"
      @keydown="keydownEvent"
    />
  </div>
</template>

<style scoped>
.number {
  height: 100%;
  width: 100%;
  position: relative;
  display: flex;
  align-items: center;
}
span {
  display: block;
  width: 100%;
  text-align: right;
  padding: 0 12px;
  max-width: 158px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 12px;
  color: v-bind(
    "disabled ? 'var(--neutral-text-disabled)' : 'var(--neutral-text-body)'"
  );
  line-height: 12px;
  transition: 0.3s;
  font-weight: 800;
}
</style>
