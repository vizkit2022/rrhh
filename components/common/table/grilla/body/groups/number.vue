<script setup>
import { defineProps, ref, computed } from "vue";
import useGrillaStore from "@/stores/grilla";
import useLinesStore from "@/stores/lines";
import useIncomesStore from "@/stores/incomes";
import usePermissionsStore from "@/stores/permissions";
import { buildCurrencyObject } from "@/utils/formatAmount";

// Store
const permissionsStore = usePermissionsStore();
const grillaStore = useGrillaStore();
const linesStore = useLinesStore();
const incomesStore = useIncomesStore();

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

// Computed
const isDeleting = computed(() => props?.line?.data?.__deleting || false);
const existsInBackend = computed(() => props?.line?.data?._id);
const disabled = computed(
  () => !existsInBackend.value || isDeleting.value || grillaStore.updating
);
const type = computed(() => props.config?.column?.prop);
const editCellPemission = computed(() => {
  return type.value === "incomes"
    ? permissionsStore.myPermissions?.income_grid_col_incomes_edit
    : permissionsStore.myPermissions?.income_grid_col_budget_edit;
});
const decimals = computed(() => {
  const columnName = props.config?.subcolumn?.prop;
  const precision = currency.value.precision || 0;

  if (columnName === "amount1" || columnName === "budgetAmount1") {
    return precision === 0 ? 2 : precision;
  }

  return props.config?.subcolumn?.type === "currency" && precision > 0
    ? precision
    : precision;
});
const val = computed(() => {
  const prop = props.config?.subcolumn?.prop;
  const cellData = props.line?.data?.numbers?.[prop];

  if (!cellData) return "";

  return cellData.value || "";
});
const useGlobal = computed(() => {
  const prop = props.config?.subcolumn?.prop;
  const dependencies =
    props.line?.data?.numbers?.[prop]?.calculation?.dependencies;

  return Array.isArray(dependencies) && dependencies.length > 0;
});

const currency = computed(() => {
  return incomesStore.income.currency.default;
});

// Constant (memoizados eficientemente)
const index = computed(() =>
  linesStore.lines.findIndex((l) => l.__id === props.line.data.__id)
);
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

// Functions
const showMenuCell = () => {
  const id = props.id;
  const obj = {
    id,
    type: props?.config?.column?.prop || "",
    header: props?.config?.subcolumn || {},
    line: props?.line || {},
    posLine: index.value || 0,
  };
  document.querySelectorAll("input.focusInput").forEach((input) => {
    input.classList.remove("focusInput");
  });
  setTimeout(() => {
    const input = document.getElementById(id);
    if (input) input.classList.add("focusInput");
    grillaStore.showMenuCell(obj);
  }, 10);
};

// Input events
const focusEvent = (e) => {
  e.target.select();
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
  const symbol = currency.value.typeFormat === "en-US" ? "." : ",";
  const maxDecimals = decimals.value;
  let inputVal = e.target.value.trim();

  // Si está vacío, permitir pero no construir objeto aún
  if (inputVal === "") {
    e.target.value = "";
    return;
  }

  // Limpiar caracteres inválidos
  const inputRegex = grillaStore.inputRegex(maxDecimals, symbol);
  inputVal = inputVal.replace(inputRegex, "");

  // Manejar decimales
  if (decimals.value > 0) {
    const parts = inputVal.split(symbol);

    // Solo permitir un separador decimal
    if (parts.length > 2) {
      inputVal =
        parts[0] + symbol + parts.slice(1).join("").replaceAll(symbol, "");
    }

    // Limitar decimales
    if (parts.length === 2 && parts[1].length > maxDecimals) {
      inputVal = parts[0] + symbol + parts[1].substring(0, maxDecimals);
    }
  }

  e.target.value = inputVal;

  // Solo calcular si cambió el valor
  const inputValNumeric = Number(inputVal.replace(symbol, "."));
  objValueTemp.value = buildCurrencyObject(
    inputValNumeric,
    currency.value,
    props.config?.subcolumn?.type
  );
};
const changeEvent = () => {
  const col = props.config?.subcolumn?.prop;
  const currentCell = linesStore.lines[index.value].numbers[col];
  // Preparar objeto de respaldo
  const backupData = {
    lastNumber: currentCell?.number,
    lastValue: currentCell?.value,
  };

  // Actualizar en una sola operación
  linesStore.lines[index.value].numbers[col] = {
    value: objValueTemp.value?.value || "0",
    number: objValueTemp.value?.number || 0,
    ...backupData,
  };

  // Romper espejo
  const budgetFields = [
    "budgetAmount1",
    "budgetAmount2",
    "budgetAmount3",
    "budget",
  ];
  if (budgetFields.includes(col)) {
    linesStore.lines[index.value].changeBudget = true;
  }

  saveValue();
};

// Guardar cambios
const saveValue = async () => {
  const el = {
    prop: props.config?.subcolumn?.prop || "",
    index: index.value,
  };

  grillaStore.startCloudSync();
  await grillaStore.updateLineFromCell(el);
  objValueTemp.value = null;
};
</script>

<template>
  <div class="number">
    <button
      @click="showMenuCell"
      :style="{
        color: `var(${
          useGlobal ? '--primary-text-subtle' : '--neutral-text-caption'
        })`,
      }"
      class="u u-link"
      v-if="!disabled"
      :disabled="!editCellPemission"
    ></button>
    <table-grilla-body-groups-input-cell
      :id="props?.id || ''"
      :value="val"
      :config="config"
      :line="line"
      @focus="focusEvent"
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
.number:hover button {
  display: block;
}
.number button {
  display: v-bind("useGlobal ? 'block' : 'none'");
  position: absolute;
  left: 12px;
  font-size: 16px;
  line-height: 16px;
  transition: 0.3s;
}
.number button:disabled {
  cursor: not-allowed;
  color: var(--neutral-text-disabled);
}
.number button:not(:disabled):hover {
  color: var(--primary-text-subtle);
}
</style>
