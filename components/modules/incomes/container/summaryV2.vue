<script setup>
import { ref, computed, onActivated, onMounted } from "vue";
import { useI18n } from "vue-i18n";
import useLinesStore from "@/stores/lines";
import useIncomesStore from "@/stores/incomes";
import useGlobalStore from "@/stores/global";
import usePermissionsStore from "@/stores/permissions";
import { formatCurrency } from "@/utils/formatAmount";

// Stores
const linesStore = useLinesStore();
const globalStore = useGlobalStore();
const incomesStore = useIncomesStore();
const permissionsStore = usePermissionsStore();

// Constants
const route = useRoute();
const idIncome = route.params.id;
const color = "--neutral-text-caption";
const { t } = useI18n();
const uiLabel = "ui.income.sections.totals";
const uiLabelTable = "ui.income.sections.totals.table";
const latinMode = incomesStore?.income?.type === "latinMode";

// Variables
const fixed = ref(false);
const loadings = ref({});
const isLocked = ref(false);
const showCategories = ref(false);
const infoModal = ref(false);
const currentPosLine = ref(null);
const cols = ref([]);
const hasChanged = ref({});
const lockModal = ref(false);
const convertMovement = ref(false);

const msgStatesUI = ref("");
const msgStatesUI_labels = {
  calc: {
    es: "Calculando Sobrecargos...",
    en: "Calculating surcharges...",
  },
  delete: {
    es: "Eliminando Sobrecargos...",
    en: "Removing surcharges...",
  },
  realTime: {
    es: "Calculando corte en tiempo real.",
    en: "Calculating real-time cut.",
  },
  updated: {
    es: "Actualizando...",
    en: "Updating",
  },
  create: {
    es: "Creando Sobrecargos...",
    en: "Creating surcharges...",
  },
  loading: {
    es: "Cargando...",
    en: "Loading...",
  },
  refresh: {
    es: "Actualizando Tabla...",
    en: "Updating table...",
  },
};
const fullScreen = ref(false);
const colorBtnMore = {
  default: "--neutral-text-caption",
};

// Functions
const toggleFixed = () => {
  fixed.value = !fixed.value;
};
const closeModalInfo = async (state) => {
  if (state) {
    globalStore.loading = true;
    const surchargeResponse = await linesStore.saveTotalsSurcharges();

    if (surchargeResponse) {
      linesStore.linesSurcharges = surchargeResponse.linesSurcharges;
      incomesStore.totalGrossIncome = surchargeResponse.totals;
    }

    globalStore.loading = false;
  }
  infoModal.value = false;
};
const showModalInfo = (pos, line) => {
  if (
    latinMode &&
    (line?.difference?.isDifference || line?.finalValue?.isFinalValue)
  ) {
    return null;
  } else {
    infoModal.value = true;
    currentPosLine.value = pos;
  }
};
const refreshUI = async (state) => {
  try {
    msgStatesUI.value = msgStatesUI_labels[state][globalStore.lang];
    loadings.value.table = true;
    await linesStore.getLinesSurcharges();
    loadings.value.table = false;
    msgStatesUI.value = "";
    linesStore.getAllGroups(route.params.income);
  } catch (err) {
    console.error(err);
    return navigateTo("/incomes");
  }
};
const deleteLines = async () => {
  cleanLines();

  if (selectedLines.value.length) {
    try {
      incomesStore.loadings.metrics = true;
      isLocked.value = true;
      msgStatesUI.value = msgStatesUI_labels.delete[globalStore.lang];

      const lines = linesStore.linesSurcharges.filter(
        (l) => l.selected && l._id != null && l._id !== "",
      );

      await linesStore.deleteLinesSurcharges(route.params.income, lines);

      const surchargeResponse = await linesStore.saveTotalsSurcharges();

      if (surchargeResponse) {
        linesStore.linesSurcharges = surchargeResponse.linesSurcharges;
        incomesStore.totalGrossIncome = surchargeResponse.totals;
      }
      linesStore.updateDataGrid();
    } catch (error) {
      console.error("Error deleting lines:", error);
    } finally {
      isLocked.value = false;
      msgStatesUI.value = "";
    }
  }
};
const cleanLines = async () => {
  if (linesStore.linesSurcharges.length) {
    linesStore.linesSurcharges = linesStore.linesSurcharges.filter(
      (el) => el._id !== "",
    );
  }
};
const addLines = async (type = "line", pos = 0) => {
  try {
    // 1. Verificar si ya existe una línea con nombre vacío
    const emptyIndex = linesStore.linesSurcharges.findIndex(
      (line) => !line.name?.trim(),
    );
    if (emptyIndex !== -1) {
      console.warn(
        "Ya existe una línea sin nombre. Complétala antes de agregar otra.",
      );

      // Hacer focus al input vacío
      requestAnimationFrame(() => {
        const input = document.getElementById(`name-${emptyIndex}`);
        if (input) input.focus();
      });

      return;
    }

    const newLine = {
      income: route.params.income,
      isCut: type === "cut",
      name: type === "cut" ? "Subtotal" : "",
      isSurcharge: true,
      __id: "",
      surchargeVariables: {},
    };

    if (type === "cut") {
      // Si es corte se manda al backend
      isLocked.value = true;
      msgStatesUI.value = msgStatesUI_labels.realTime[globalStore.lang];
      await createLine(newLine, pos);
    } else {
      // Es un sobrecargo normal - se hace solo en front
      linesStore.linesSurcharges.splice(pos, 0, {
        ...newLine,
        numbers: defaultProperties.value,
      });

      // 2. Hacer focus en el input creado
      requestAnimationFrame(() => {
        const input = document.getElementById(`name-${pos}`);
        if (input) input.focus();
      });
    }
  } catch (error) {
    console.error("Error adding line:", error);
  } finally {
    setTimeout(() => {
      isLocked.value = false;
      msgStatesUI.value = "";
    });
  }
};

const createLine = async (newLine, pos) => {
  const lineResponse = await linesStore.postLine(newLine);

  if (lineResponse) {
    if (newLine.isCut) {
      linesStore.linesSurcharges.splice(pos, 0, lineResponse);
    } else {
      linesStore.linesSurcharges[pos] = lineResponse;
    }

    await linesStore.orderSurchages();

    const surchargeResponse = await linesStore.saveTotalsSurcharges(pos);

    if (surchargeResponse) {
      linesStore.linesSurcharges = surchargeResponse.linesSurcharges;
      incomesStore.totalGrossIncome = surchargeResponse.totals;
    }
    incomesStore.loadings.metrics = true;
    linesStore.updateDataGrid();
  }
};
const updatedMetrics = async () => {
  incomesStore.loadings.metrics = true;
  const surchargeResponse = await linesStore.saveTotalsSurcharges();
  if (surchargeResponse) {
    linesStore.linesSurcharges = surchargeResponse.linesSurcharges;
    incomesStore.totalGrossIncome = surchargeResponse.totals;
  }
  incomesStore.loadings.metrics = false;
};
const permissionsColumns = () => {
  if (permissionsStore.myPermissions.income_grid_col_incomes) {
    cols.value.push({ prop: "sumPrice" });
  }
  if (permissionsStore.myPermissions.income_grid_col_budget) {
    cols.value.push({ prop: "sumBudget" });
  }
  if (permissionsStore.myPermissions.income_grid_col_cost) {
    cols.value.push({ prop: "cost" });
    cols.value.push({ prop: "toSpend" });
    cols.value.push({ prop: "efc" });
  }
  if (permissionsStore.myPermissions.income_grid_col_projected) {
    cols.value.push({ prop: "projectedUtility" });
  }
};
// Cada vez que muestro el componente recargo su info y no el html
onActivated(async () => {
  await Promise.all([refreshUI("loading"), updatedMetrics()]);
});
// Mounted
onMounted(() => {
  document.addEventListener("keydown", handleKeyNavigation);
  permissionsColumns();
});
onBeforeUnmount(() => {
  document.removeEventListener("keydown", handleKeyNavigation);
});

// Computed
const selectedLines = computed(() => {
  return linesStore.linesSurcharges.filter((l) => l.selected);
});
const disabledTable = computed(() => {
  if (loadings.value.table) return true;
  else return isLocked.value;
});
const currencyFormatDefault = computed(
  () => incomesStore?.income?.currency?.default || {},
);
const defaultProperties = computed(() => {
  const symbol = incomesStore?.income?.currency?.default.symbol || "$";
  const amount = symbol + " 0";
  return {
    percentage: {
      value: "0 %",
      lastValue: "0 %",
      number: 0,
      lastNumber: 0,
    },
    sumPrice: {
      value: amount,
      lastValue: amount,
      number: 0,
      lastNumber: 0,
    },
    sumBudget: {
      value: amount,
      lastValue: amount,
      number: 0,
      lastNumber: 0,
    },
    budgetMargin: {
      value: "0 %",
      lastValue: "0 %",
      number: 0,
      lastNumber: 0,
    },
    cost: {
      value: amount,
      lastValue: amount,
      number: 0,
      lastNumber: 0,
    },
    toSpend: {
      value: amount,
      lastValue: amount,
      number: 0,
      lastNumber: 0,
    },
    efc: {
      value: amount,
      lastValue: amount,
      number: 0,
      lastNumber: 0,
    },
    projectedUtility: {
      value: amount,
      lastValue: amount,
      number: 0,
      lastNumber: 0,
    },
    projectedMargin: {
      value: "0 %",
      lastValue: "0 %",
      number: 0,
      lastNumber: 0,
    },
  };
});
const typeToConvert = computed(() =>
  t(
    "modules.incomes.pages.grilla.modal.changeType." +
      `${incomesStore.income.state === "budget" ? "business" : "budget"}`,
  ),
);

const optionsBtnMore = computed(() => {
  const textBase = "grilla.menus";
  const convertText = t(textBase + ".convert", { type: typeToConvert.value });

  return [
    {
      prop: "template",
      icon: "share",
      label: { default: "Compartir" },
      disabled: true,
    },
    {
      prop: "convert",
      icon: "fast-zap",
      label: { default: convertText },
    },
  ];
});

// Navegación
const columns = ["name", "percentage", "amount"];
let maxRow = computed(() => linesStore.linesSurcharges.length);

function getInputId(col, row) {
  return `${col}-${row}`;
}
function focusInput(col, row) {
  const input = document.getElementById(getInputId(col, row));
  if (input) {
    input.focus();
    return true;
  }
  return false;
}
function handleKeyNavigation(e) {
  const current = document.activeElement?.id;
  if (!current) return;

  const [col, rowStr] = current.split("-");
  let row = parseInt(rowStr, 10);

  const colIndex = columns.indexOf(col);
  if (colIndex === -1) return;

  switch (e.key) {
    case "ArrowRight": {
      const nextCol = columns[colIndex + 1];
      if (nextCol) {
        e.preventDefault();
        focusInput(nextCol, row);
      }
      break;
    }
    case "ArrowLeft": {
      const prevCol = columns[colIndex - 1];
      if (prevCol) {
        e.preventDefault();
        focusInput(prevCol, row);
      }
      break;
    }
    case "ArrowUp": {
      if (row > 0) {
        e.preventDefault();
        let prevRow = row - 1;
        // buscar hacia arriba hasta encontrar fila existente
        while (prevRow >= 0) {
          if (focusInput(col, prevRow)) break;
          prevRow--;
        }
      }
      break;
    }
    case "ArrowDown": {
      if (row < maxRow.value) {
        e.preventDefault();
        let nextRow = row + 1;
        // buscar hacia abajo hasta encontrar fila existente
        while (nextRow <= maxRow.value) {
          if (focusInput(col, nextRow)) break;
          nextRow++;
        }
      }
      break;
    }
    case "Escape": {
      e.preventDefault();
      document.activeElement.blur();
      console.log("Salio");
      break;
    }
    case "Enter": {
      e.preventDefault();
      document.activeElement.blur();
      console.log("Guardar");
      break;
    }
  }
}

// Candado
const openDifference = async (line) => {
  if (line?.difference?.state === "closed") {
    const finalTotal = linesStore.linesSurcharges.find(
      (l) => l.finalValue.isFinalValue,
    );
    const body = {
      ...line,
      finalValue: finalTotal._id || "",
    };
    try {
      incomesStore.loadings.metrics = true;
      msgStatesUI.value = msgStatesUI_labels.calc[globalStore.lang];
      const surchargeResponse = await linesStore.removeDifference(body);
      if (surchargeResponse) {
        linesStore.linesSurcharges = surchargeResponse.linesSurcharges;
        incomesStore.totalGrossIncome = surchargeResponse.totals;
      }
      linesStore.updateDataGrid();
    } catch (error) {
      console.error(error);
    } finally {
      msgStatesUI.value = "";
    }
  }
};

// Dropdown
const posDropdown = ref(null);
const isBottomDropdown = ref(true);
const goToDropdown = ref(false);

const dropdownClose = async () => {
  posDropdown.value = null;
  goToDropdown.value = false;
};

const dropdownSelect = async (newValue) => {
  const pos = posDropdown.value;

  let line = {
    ...linesStore.linesSurcharges[pos],
    name: newValue.name,
    tax: newValue._id,
    surchargeVariables: {
      ...newValue.surchargeVariables,
      retention: newValue.retention,
      addToTotal: newValue.addToTotal,
    },
  };
  line.numbers.percentage = {
    number: newValue.value,
    value: `${newValue.value} %`,
  };
  changeName(line, pos);
  linesStore.linesSurcharges[pos].name = newValue.name;
  linesStore.linesSurcharges[pos].tax = newValue._id;
  line.numbers.percentage = {
    number: newValue.value,
    value: `${newValue.value} %`,
  };

  posDropdown.value = null;
  goToDropdown.value = false;
};

const searchTimeout = ref(null);
const lastSearch = ref("");

// Buscador optimizado
const searchLines = async (line, pos, e) => {
  if (latinMode && (line?.difference?.isDifference || line?.finalValue?.isFinalValue)) {
    return null;
  } else {
    if (line.isCut) {
      return;
    }
    posDropdown.value = pos;

    const val = e.target.value.trim();

    linesStore.searchLineNames = [];

    // Cancelar timeout anterior
    if (searchTimeout.value) {
      clearTimeout(searchTimeout.value);
    }

    // Si el valor no cambió, no buscar
    if (val === lastSearch.value) return;

    // Nuevo timeout de espera (ej: 300 ms tras dejar de tipear)
    searchTimeout.value = setTimeout(async () => {
      if (val === "") {
        results.value = [];
        return;
      }

      lastSearch.value = val;
      linesStore.loadingSearch = true;

      try {
        await linesStore.searchForTaxesNames(val, idIncome);
      } catch (error) {
        console.error(error);
        linesStore.searchLineNames = [];
      } finally {
        linesStore.loadingSearch = false;
      }
    }, 600);
  }
};

const changeName = async (line, pos, updateTotals = true) => {
  try {
    if (line._id) {
      isLocked.value = true;
      msgStatesUI.value = msgStatesUI_labels.updated[globalStore.lang];
      await linesStore.updateSurchargeName(line);
      if (updateTotals) {
        const surchargeResponse = await linesStore.saveTotalsSurcharges(pos);
      }
    } else {
      isLocked.value = true;
      msgStatesUI.value = msgStatesUI_labels.create[globalStore.lang];
      incomesStore.loadings.metrics = true;
      await createLine(line, pos);
      linesStore.updateDataGrid();
    }
  } catch (error) {
    console.error("Error changing name:", error);
  } finally {
    setTimeout(() => {
      isLocked.value = false;
      msgStatesUI.value = "";
    });
  }
};
const isInputDisabled = (prop, line) => {
  if (prop !== "sumBudget" && prop !== "sumPrice" && prop !== "percentage") {
    return true;
  }
  if (line.surchargeVariables.field === "percentageFix") {
    return true;
  }
  if (
    line.surchargeVariables.field === "editPercentage" &&
    prop !== "percentage"
  ) {
    return true;
  }
  if (line.surchargeVariables.field === "editValue" && prop === "percentage") {
    return true;
  }
  return false;
};
const changeValue = async (event, line, i, prop) => {
  hasChanged.value[`${i}-${prop}`] = true;
  try {
    incomesStore.loadings.metrics = true;
    const name = event.target.name;
    const value = Number(event.target.value);
    const currency = { ...currencyFormatDefault.value };
    isLocked.value = true;
    linesStore.linesSurcharges[i].numbers[name].number = value;
    linesStore.linesSurcharges[i].numbers[name].value = formatCurrency(
      value,
      currency,
      true,
    );
    if (line?.finalValue?.isFinalValue) {
      linesStore.linesSurcharges[i].finalValue.state = "constant";
    }

    msgStatesUI.value = msgStatesUI_labels.calc[globalStore.lang];
    const surchargeResponse = await linesStore.saveTotalsSurcharges(i);

    if (surchargeResponse) {
      linesStore.linesSurcharges = surchargeResponse.linesSurcharges;
      incomesStore.totalGrossIncome = surchargeResponse.totals;
    }
    await linesStore.updateDataGrid();
  } catch (error) {
    console.log(error);
  } finally {
    isLocked.value = false;
    msgStatesUI.value = "";
  }
};
const onFocusInput = (event, prop, line) => {
  line.numbers[prop].lastNumber = line.numbers[prop].number;
  line.numbers[prop].lastValue = line.numbers[prop].value;
  line.numbers[prop].value = line.numbers[prop].number;

  setTimeout(() => {
    event.target.select();
  }, 0);
};
const onBlurInput = (event, prop, line, i) => {
  // Tener cuidado, el change se lanza antes que el blur (1 Focus, 2 Input, 3 Change, 4 Blur)
  if (!hasChanged.value[`${i}-${prop}`]) {
    const currency = { ...currencyFormatDefault.value };
    const rawValue = Number(event.target.value); // Guardar el número real
    line.numbers[prop].number = isNaN(rawValue) ? 0 : rawValue; // Guardar el valor formateado
    line.numbers[prop].value = formatCurrency(
      line.numbers[prop].number,
      currency,
      true,
    );
  }
  hasChanged.value[`${i}-${prop}`] = false;
};
const onInputOnlyNumbers = (event) => {
  let value = event.target.value;
  value = value.replace(/[^0-9.]/g, "");
  value = value.replace(/\.+/g, ".");
  event.target.value = value;
};
const selectMoreOp = async (op) => {
  const actions = {
    convert: () => (convertMovement.value = true),
  };
  const { prop } = op;
  if (actions[prop]) await actions[prop]();
};
const hideModal = () => {
  if (!lockModal.value) {
    convertMovement.value = false;
  }
};
const lock = (state) => {
  lockModal.value = state;
};

const onPercentageFocus = (line, e) => {
  e.target.dataset.original = line.numbers.percentage.number ?? "";
  e.target.value = line.numbers.percentage.number ?? "";
};

const onPercentageBlur = async (line, e) => {
  const original = e.target.dataset.original;
  const current = e.target.value;

  if (String(original) === String(current)) {
    e.target.value = line.numbers.percentage.value;
    return;
  }

  const num = parseFloat(current);
  if (isNaN(num)) {
    e.target.value = line.numbers.percentage.value;
    return;
  }

  line.numbers.percentage.number = num;
  line.numbers.percentage.value = `${num} %`;
  e.target.value = line.numbers.percentage.value;

  globalStore.loading = true;

  const surchargeResponse = await linesStore.saveTotalsSurchargesByObject({
    ...line,
    numbers: {
      ...line.numbers,
      percentage: { ...line.numbers.percentage },
    },
  });

  incomesStore.loadings.metrics = true;

  if (surchargeResponse) {
    linesStore.linesSurcharges = surchargeResponse.linesSurcharges;
    incomesStore.totalGrossIncome = surchargeResponse.totals;
  }

  linesStore.updateDataGrid();
  globalStore.loading = false;
};
</script>

<template>
  <div
    class="totales"
    :class="{ totales__fullScreen: fullScreen }"
    id="containerSummary"
  >
    <div class="totales__header">
      <div class="flex loadings">
        <u-loading :width="16" v-if="msgStatesUI" />
        <span>{{ msgStatesUI }}</span>
      </div>
      <div class="flex between">
        <u-button-icon
          icon="change"
          size="s"
          type="outlined"
          @click="refreshUI('refresh')"
          :title="t(uiLabel + '.texts.refresh')"
          :disabled="disabledTable"
        />
        <u-button-icon
          :icon="fullScreen ? 'minimize-1' : 'maximize-1'"
          size="s"
          type="outlined"
          :color="color"
          :title="
            t(uiLabel + (fullScreen ? '.texts.minimize' : '.texts.maximize'))
          "
          :disabled="disabledTable"
          @click="fullScreen = !fullScreen"
        />
        <u-button-menu
          :maxVisibleOptions="6"
          :onlyIcon="true"
          type="outlined"
          :colors="colorBtnMore"
          orientation="right"
          :title="t(uiLabel + '.texts.more')"
          :disabled="disabledTable"
          size="s"
          icon="more"
          :options="optionsBtnMore"
          @selectedOption="selectMoreOp"
          :showArrow="false"
        />
      </div>
    </div>
    <div class="totales__body">
      <table class="advanced-table">
        <!-- HEADER -->
        <thead>
          <tr class="main-header">
            <th></th>
            <th :class="['col', { 'sticky-active': fixed }]">
              <span>{{ t(uiLabelTable + ".headers.totals.label") }}</span>
              <button
                @click="toggleFixed"
                :title="t(uiLabelTable + '.headers.totals.fixed')"
                :disabled="disabledTable"
                :class="`btnFixed ${fixed ? 'fixed' : ''}`"
              >
                <span class="u u-pin"></span>
              </button>
            </th>
            <th v-for="col in cols" :key="col.prop" :class="[col.prop]">
              <span>{{ t(uiLabelTable + ".headers.cols." + col.prop) }}</span>
            </th>
          </tr>
          <!-- Segunda fila del header (mostral totales - gross) -->
          <tr class="sub-header">
            <th></th>
            <th :class="[{ 'sticky-active': fixed }]">
              <div class="header-content">
                <span>{{ t(uiLabelTable + ".headers.totals.subLabel") }}</span>
                <button
                  :disabled="disabledTable || linesStore.allGroups.length === 0"
                  @click="showCategories = !showCategories"
                  :style="`transform: rotate(${showCategories ? 180 : 0}deg)`"
                >
                  <span class="u u-chevron-down"></span>
                </button>
              </div>
            </th>
            <th v-for="col in cols" :key="col.prop" class="amounts">
              {{ incomesStore.totalIncome[col.prop].value }}
            </th>
          </tr>
          <!-- Tercera fila del header (mostrar categorias) -->
          <tr
            class="sub-header"
            v-for="category in showCategories ? linesStore.allGroups : []"
            :key="category._id"
          >
            <th style="text-align: right">
              <span>{{ category.code || "-" }}</span>
            </th>
            <th :class="[{ 'sticky-active': fixed }]">
              <span>{{ category.name }}</span>
            </th>
            <th v-for="(col, index) in cols" :key="index" class="amounts">
              <span>{{ category?.numbers?.[col.prop]?.value || "-" }}</span>
            </th>
          </tr>
        </thead>

        <!-- BODY -->
        <tbody>
          <tr class="main-body">
            <td class="actions">
              <button :disabled="loadings.table" @click="isLocked = !isLocked">
                <span class="u u-locked"></span>
              </button>
              <button
                :disabled="
                  !permissionsStore.myPermissions.surcharges__delete ||
                  disabledTable ||
                  selectedLines.length === 0
                "
                @click="deleteLines"
              >
                <span class="u u-delete"></span>
              </button>
              <button
                :disabled="
                  !permissionsStore.myPermissions.surcharges__add ||
                  disabledTable
                "
                @click="addLines('line')"
              >
                <span class="u u-new"></span>
              </button>
            </td>
            <td>
              <div class="main-body-name">
                <span>{{ t(uiLabelTable + ".body.totals.label") }}</span>
                <span>%</span>
              </div>
            </td>
            <td class="amounts" v-for="col in cols" :key="col.prop"></td>
          </tr>

          <template
            v-for="(line, l) in linesStore.linesSurcharges"
            :key="line._id"
          >
            <tr
              v-if="line?.finalValue?.isFinalValue && latinMode"
              class="isTotal"
            >
              <td class="actions"></td>
              <td :class="['surcharge', { 'sticky-active': fixed }]">
                <span class="difference">{{ line.name }}</span>
              </td>

              <td
                class="amounts surcharge"
                v-for="col in cols"
                :key="col.prop"
                :class="
                  line?.surchargeVariables?.addToTotal ? 'addToTotal' : ''
                "
              >
                <span
                  v-if="
                    line.isCut || !['sumBudget', 'sumPrice'].includes(col.prop)
                  "
                  :title="line?.numbers?.[col.prop]?.number"
                  >{{ line?.numbers?.[col.prop]?.value || "-" }}</span
                >
                <div
                  v-else
                  :class="`inputBox ${latinMode && line?.difference?.isDifference && ['sumPrice', 'sumBudget'].includes(col.prop) ? 'inputBoxWithBtn' : ''}`"
                >
                  <input
                    type="text"
                    :name="col.prop"
                    :disabled="
                      !permissionsStore.myPermissions.surcharges__add ||
                      disabledTable ||
                      (latinMode &&
                        (line?.difference?.isDifference ||
                          line?.finalValue?.isFinalValue) &&
                        col.prop === 'sumBudget') ||
                      msgStatesUI ||
                      isInputDisabled(col.prop, line)
                    "
                    :id="`amount-${l}`"
                    :value="line.numbers[col.prop].value"
                    @change="changeValue($event, line, l, col.prop)"
                    @focus="onFocusInput($event, col.prop, line)"
                    @blur="onBlurInput($event, col.prop, line, l)"
                    @input="onInputOnlyNumbers($event)"
                  />
                </div>
              </td>
            </tr>
            <tr v-else class="table-row" :class="line.isCut ? 'cut' : ''">
              <td class="actions">
                <template v-if="!line?.difference?.isDifference">
                  <div
                    v-if="
                      !(
                        latinMode &&
                        (line?.difference?.isDifference ||
                          line?.finalValue?.isFinalValue)
                      )
                    "
                  >
                    <u-checkbox
                      v-model="line.selected"
                      :height="16"
                      :disabled="disabledTable"
                    />
                  </div>
                  <div
                    v-if="
                      !(
                        latinMode &&
                        (line?.difference?.isDifference ||
                          line?.finalValue?.isFinalValue)
                      )
                    "
                  >
                    <button
                      :disabled="
                        !permissionsStore.myPermissions.surcharges__add ||
                        disabledTable
                      "
                      @click="addLines('line', l + 1)"
                    >
                      <span class="u u-new"></span>
                    </button>
                  </div>
                  <div
                    v-if="
                      !line.isCut &&
                      !(
                        latinMode &&
                        (line?.difference?.isDifference ||
                          line?.finalValue?.isFinalValue)
                      )
                    "
                  >
                    <button
                      @click="addLines('cut', l + 1)"
                      :disabled="
                        !permissionsStore.myPermissions.surcharges__add ||
                        disabledTable
                      "
                    >
                      <span class="u u-sum"></span>
                    </button>
                  </div>
                </template>
              </td>
              <td :class="['surcharge', { 'sticky-active': fixed }]">
                <span
                  v-if="line.isCut || line?.difference?.isDifference"
                  :class="line.isCut ? 'cut' : 'difference'"
                  >{{ line.name }}</span
                >
                <div class="name" v-else>
                  <input
                    type="text"
                    name="name"
                    v-model="line.name"
                    :id="`name-${l}`"
                    class="name"
                    :disabled="disabledTable"
                    autocomplete="off"
                    @input="searchLines(line, l, $event)"
                  />
                  <button
                    class="info"
                    @click="showModalInfo(l, line)"
                    :disabled="
                      disabledTable ||
                      line.surchargeVariables.field === 'editValue'
                    "
                  >
                    <span class="u u-info"></span>
                  </button>
                  <input
                    v-if="line.surchargeVariables.field !== 'editValue'"
                    type="text"
                    class="percentage"
                    :disabled="
                      !permissionsStore.myPermissions.surcharges__add ||
                      line.surchargeVariables.field !== 'editPercentage' ||
                      disabledTable
                    "
                    :id="`percentage-${l}`"
                    :value="line.numbers.percentage.value"
                    @focus="onPercentageFocus(line, $event)"
                    @blur="onPercentageBlur(line, $event)"
                  />
                  <span v-else style="text-align: right; padding-right: 20px"
                    >-</span
                  >
                </div>
              </td>

              <td
                class="amounts surcharge"
                v-for="col in cols"
                :key="col.prop"
                :class="
                  line?.surchargeVariables?.addToTotal ? 'addToTotal' : ''
                "
              >
                <span
                  v-if="
                    line.isCut || !['sumBudget', 'sumPrice'].includes(col.prop)
                  "
                  :title="line?.numbers?.[col.prop]?.number"
                  >{{ line?.numbers?.[col.prop]?.value || "-" }}</span
                >
                <div
                  v-else
                  :class="`inputBox ${latinMode && line?.difference?.isDifference && ['sumPrice', 'sumBudget'].includes(col.prop) ? 'inputBoxWithBtn' : ''}`"
                >
                  <button
                    v-if="
                      msgStatesUI ||
                      (latinMode &&
                        line?.difference?.isDifference &&
                        col.prop === 'sumPrice')
                    "
                    :disabled="
                      !permissionsStore.myPermissions.surcharges__add ||
                      disabledTable ||
                      line?.difference?.state === 'open'
                    "
                    @click="openDifference(line)"
                  >
                    <span
                      :class="`u u-${
                        line?.difference?.state === 'closed'
                          ? 'locked'
                          : 'unlocked'
                      }`"
                    ></span>
                  </button>
                  <input
                    type="text"
                    :name="col.prop"
                    :disabled="
                      disabledTable ||
                      (latinMode &&
                        (line?.difference?.isDifference ||
                          line?.finalValue?.isFinalValue) &&
                        col.prop === 'sumBudget') ||
                      msgStatesUI ||
                      isInputDisabled(col.prop, line)
                    "
                    :id="`amount-${l}`"
                    :value="line.numbers[col.prop].value"
                    @change="changeValue($event, line, l, col.prop)"
                    @focus="onFocusInput($event, col.prop, line)"
                    @blur="onBlurInput($event, col.prop, line, l)"
                    @input="onInputOnlyNumbers($event)"
                  />
                </div>
              </td>
            </tr>
          </template>
        </tbody>

        <!-- FOOTER -->
        <tfoot v-if="!latinMode">
          <tr class="footer-row">
            <td></td>
            <td :class="[{ 'sticky-active': fixed }]">
              {{ t(uiLabelTable + ".footer.totals.label") }}
            </td>
            <td class="amounts" v-for="col in cols" :key="col.prop">
              {{ incomesStore.totalGrossIncome[col.prop].value || "-" }}
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
    <div class="totales__metricas">
      <IncomesContainerChipsTotal />
    </div>
    <u-dropdown
      v-if="![null, undefined].includes(posDropdown)"
      :idParent="`#name-${posDropdown}`"
      idContainer="containerSummary"
      maxheihtContent="128px"
      widthParent="346px"
      :customOptionStyle="true"
      :loading="linesStore.loadingSearch"
      :list="linesStore.searchLineNames"
      :goToDropdown="goToDropdown"
      @isBottomDropdown="(isBottom) => (isBottomDropdown = !isBottom)"
      @dropdownSelect="dropdownSelect"
      @dropdownClose="dropdownClose"
    >
      <template v-slot:cell="item">
        <div class="searchItem">
          <div class="text">
            <span class="name truncateText">{{ item.item.name }}</span>
            <span :class="`type ${item.item.retention ? 'retention' : ''}`">{{
              item.item.retention ? "Con Retención" : "Sin Retención"
            }}</span>
          </div>
          <div class="percentage">
            <span>{{ item.item.value }} %</span>
          </div>
        </div>
      </template>
    </u-dropdown>
  </div>
  <u-dialog
    :showModal="infoModal"
    width="auto"
    height="auto"
    :persistent="true"
  >
    <IncomesDialogSurchargeInf
      :line="linesStore.linesSurcharges[currentPosLine]"
      :currentPostLine="currentPosLine"
      @closeModal="closeModalInfo"
    />
  </u-dialog>
  <u-dialog
    :showModal="convertMovement"
    :lockModal="lockModal"
    @closeModal="hideModal"
    width="auto"
    height="auto"
  >
    <IncomesDialogConvertTypeMovement
      @closeModal="hideModal"
      @lockModal="lock"
    />
  </u-dialog>
</template>

<style setup>
/* Dropdown */

.searchItem {
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-radius: 8px;
  transition: 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  cursor: pointer;
}
.searchItem:focus,
.searchItem:hover {
  background-color: var(--primary-focus-input) !important;
}
.searchItem .text {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  width: 270px;
  transition: 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}

.searchItem span.name {
  color: var(--neutral-text-body);
  font-size: 12px;
  line-height: 12px;
  font-weight: 600;
  font-family: Nunito;
}

.searchItem span.type {
  color: var(--primary-text-default);
  font-size: 12px;
  line-height: 12px;
  font-family: Nunito;
}
.searchItem span.type.retention {
  color: var(--danger-text-default);
}
.searchItem .percentage {
  color: var(--neutral-text-caption);
  font-size: 12px;
  font-weight: 600;
  font-family: Nunito;
  transition: 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}

/* ========== PAGE LAYOUT ========== */
.totales {
  display: grid;
  grid-template-rows: 32px 1fr 48px;
  gap: 16px;
  position: relative;
}
.totales__fullScreen {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background-color: var(--neutral-background-default);
  padding: 24px;
  z-index: 1000;
}

.totales__header {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: center;
}

.flex {
  display: flex;
  gap: 8px;
  align-items: center;
  height: 100%;
}

.flex.loadings span {
  color: var(--neutral-text-caption);
  font-size: 12px;
}

.flex.between {
  justify-content: flex-end;
}

.totales__body {
  width: 100%;
  height: v-bind("fullScreen ? 'calc(100vh - 160px)' : 'calc(100vh - 264px)'");
  /* Altura fija para scroll vertical */
  overflow: auto;
  border: 2px solid var(--neutral-border-subtle);
  border-radius: 18px;
}
.totales__body::-webkit-scrollbar {
  width: 16px;
  height: 16px;
}

.totales__body::-webkit-scrollbar-thumb {
  cursor: grabbing;
  background-color: var(--neutral-border-subtle);
  border-radius: 10px;
}

/* ========== TABLE BASE ========== */
.advanced-table {
  width: 100%;
  height: auto;
  border-collapse: separate;
  border-spacing: 0;
  font-size: 12px;
  background-color: var(--neutral-background-default);
}

.advanced-table th,
.advanced-table td.actions,
.advanced-table tfoot td {
  padding: 0 16px;
}

.advanced-table th,
.advanced-table td {
  height: 40px;
  border-bottom: 2px solid var(--neutral-border-subtle);
  border-right: 2px solid var(--neutral-border-subtle);
}

.advanced-table th:last-child,
.advanced-table td:last-child {
  border-right: none;
}

.advanced-table tbody td div.name {
  display: grid;
  grid-template-columns: 1fr 20px 82px;
  height: 100%;
  align-items: center;
  gap: 8px;
}

.advanced-table tbody td div.name input {
  color: var(--neutral-text-body);
  font-weight: 600;
  font-size: 12px;
}

.advanced-table tbody td div.name input.name {
  height: 100%;
  padding: 0 0 0 16px;
}

.advanced-table tbody td div.name input.percentage {
  height: 100%;
  padding: 0 16px 0 0;
  text-align: right;
}

.advanced-table tbody td .name input:not(:disabled):focus,
.advanced-table tbody td .name input:not(:disabled):focus-visible,
.advanced-table tbody td .name input:not(:disabled):active {
  box-shadow: inset 0 0 0 2px rgba(58, 199, 165, 1);
  background-color: var(--primary-surface-shadow-8a);
  outline: none;
  /* si quieres mantener el outline del browser, quita esta línea */
  transition:
    box-shadow 0.12s ease,
    background-color 0.12s ease;
  padding: 0 16px;
}

.advanced-table tbody td div.name button.info {
  display: flex;
  justify-content: center;
  align-items: center;
  transition: 0.3s;
}

.advanced-table tbody td div.name button.info span {
  color: var(--neutral-text-caption);
  font-size: 16px;
}

.advanced-table tbody td div.name button:not(:disabled).info:hover span {
  color: var(--secondary-text-darker) !important;
}

/* ========== HEADER ========== */
.advanced-table thead tr:first-child {
  position: sticky;
  top: 0;
  z-index: 2;
}

.btnFixed {
  width: 20px;
  height: 20px;
  display: flex;
  justify-content: center;
  align-items: center;
  border-radius: 6px;
  border: 1px solid var(--neutral-text-caption);
  transition: 0.3s;
}

.btnFixed span {
  font-size: 14px !important;
  line-height: 14px !important;
  color: var(--neutral-text-caption);
  transition: 0.3s;
}

.btnFixed.fixed,
.btnFixed:not(:disabled):hover {
  border: 1px solid var(--primary-text-subtle);
}

.btnFixed.fixed span,
.btnFixed:not(:disabled):hover span {
  color: var(--primary-text-subtle) !important;
}

.advanced-table thead th {
  background-color: var(--neutral-background-default);
  font-weight: 600;
  text-align: left;
  height: 40px;
  white-space: nowrap;
}

.advanced-table thead tr:first-child span {
  color: var(--neutral-text-caption);
  font-size: 12px;
  line-height: 12px;
}

.advanced-table thead tr.sub-header span {
  color: var(--neutral-text-body);
  font-weight: 700;
  font-size: 12px;
  line-height: 12px;
}

.advanced-table thead tr th.amounts {
  color: v-bind(
    "showCategories ? 'var(--neutral-text-caption)' : 'var(--neutral-text-body)'"
  );
  font-weight: 700;
}

.advanced-table thead tr.sub-header th.amounts,
.advanced-table tbody tr td.amounts,
.advanced-table tfoot tr td.amounts {
  min-width: 220px;
  max-width: 300px;
  width: 250px;
  text-align: right;
}

.advanced-table tbody tr td.amounts span {
  color: var(--neutral-text-caption);
  padding: 0 16px;
  font-weight: 500;
}
.advanced-table tbody tr td.amounts.addToTotal span {
  color: var(--neutral-text-title);
}

.advanced-table tbody tr td.amounts div.inputBox {
  height: 100%;
}

.advanced-table tbody tr td.amounts input {
  width: 100%;
  height: 100%;
  padding: 0 16px;
  text-align: right;
  font-weight: 600;
  color: var(--neutral-text-body);
}

.advanced-table tbody tr td.amounts.addToTotal input {
  color: var(--neutral-text-title);
  font-size: 12px;
}

.advanced-table tbody tr td.amounts div.inputBoxWithBtn input {
  padding: 0 16px 0 40px !important;
}

.advanced-table tbody tr td.amounts input:disabled {
  color: var(--neutral-text-disabled);
  cursor: not-allowed;
}

.advanced-table tbody tr td.amounts input:not(:disabled):focus,
.advanced-table tbody tr td.amounts input:not(:disabled):focus-visible,
.advanced-table tbody tr td.amounts input:not(:disabled):active {
  box-shadow: inset 0 0 0 2px rgba(255, 161, 32, 1);
  background-color: var(--warning-surface-shadow-8a);
  outline: none;
  transition:
    box-shadow 0.12s ease,
    background-color 0.12s ease;
  padding: 0 16px;
}

/* ========== HEADER CONTENT (buttons) ========== */
.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
}

.header-content button {
  width: 23px;
  height: 22px;
  transition: 0.3s;
}

.header-content button span {
  font-size: 20px !important;
  line-height: 20px !important;
  transition: 0.3s;
}

.header-content button:not(:disabled):hover span {
  color: var(--primary-text-subtle) !important;
}

.header-content button:disabled {
  cursor: not-allowed;
}

.header-content button:disabled span {
  color: var(--primary-text-disabled) !important;
}

/* ========== BODY ========== */
.advanced-table tbody tr {
  z-index: 1;
}

.advanced-table tbody td {
  vertical-align: center;
}

.advanced-table thead th:nth-child(1),
.advanced-table tfoot td:nth-child(1),
.advanced-table tbody td:nth-child(1) {
  min-width: 132px !important;
  max-width: 132px !important;
  width: 132px;
}

button:disabled {
  cursor: not-allowed;
}

.advanced-table tbody td:nth-child(2) {
  min-width: 350px;
  max-width: 500px;
}

.advanced-table tbody td.actions {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 15px;
  align-items: center;
}

.advanced-table tbody td.actions button {
  width: 20px;
  height: 20px;
  display: flex;
  justify-content: center;
  align-items: center;
}

.advanced-table tbody td.actions button span {
  font-size: 18px;
  line-height: 18px;
  color: var(--neutral-text-caption);
  transition: 0.3s;
}

.advanced-table tbody td.actions button:not(:disabled):hover span {
  color: var(--secondary-text-darker);
}

.advanced-table tbody td.surcharge {
  color: var(--neutral-text-body);
  font-size: 12px;
  font-weight: 600;
}

.advanced-table tbody td span.cut {
  font-weight: 700;
  padding: 0 16px;
}

.advanced-table tbody td span.difference {
  padding: 0 16px;
}

.advanced-table tbody td .inputBox {
  position: relative;
  display: flex;
  justify-content: space-between;
}

.advanced-table tbody td .inputBox button {
  position: absolute;
  top: 10px;
}

/* Hover rows */
.table-row,
.table-row .sticky-active {
  transition: 0.3s;
}

.table-row.cut {
  background-color: var(--neutral-surface-softer);
}

tr.main-body {
  background-color: var(--neutral-surface-light);
}

tr.main-body td.actions {
  display: flex;
  justify-content: space-between;
  gap: 0px;
}

tr.main-body td.actions button {
  flex-shrink: 0;
  background-color: var(--neutral-background-default);
  width: 24px;
  height: 24px;
  border-radius: 6px;
  border: 1px solid var(--neutral-text-caption);
  transition: 0.3s;
}

tr.main-body td.actions button:disabled {
  background-color: transparent;
  border: 1px solid var(--neutral-text-disabled);
  cursor: not-allowed;
}

tr.main-body td.actions button:disabled span {
  color: var(--neutral-text-disabled);
}

tr.main-body td.actions button span {
  font-size: 16px;
}

tr.main-body td.actions button:not(:disabled):hover {
  border: 1px solid var(--secondary-text-darker);
}

tr.main-body td.actions button:not(:disabled):hover span {
  color: var(--secondary-text-darker);
}

tr.main-body div.main-body-name {
  display: flex;
  justify-content: space-between;
  padding: 0 16px;
  color: var(--neutral-text-caption);
  font-weight: 700;
}

.table-row:not(.cut):hover,
.table-row:not(.cut):hover .sticky-active {
  background-color: var(--extra-secondary);
}

/* ========== FOOTER ========== */
.advanced-table tfoot td,
.advanced-table .isTotal td {
  background-color: var(--neutral-surface-softer);
  color: var(--neutral-text-body);
  font-weight: 700;
}

/* ========== STICKY COLUMNS ========== */
.sticky-active {
  position: sticky !important;
  left: 0;
  box-shadow: 2px 0 4px rgba(0, 0, 0, 0.1);
}

.advanced-table thead .sticky-active {
  background-color: var(--neutral-background-default);
}

/* ========== COLOR HIGHLIGHTS (by column) ========== */
.main-header .col {
  position: relative;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.main-header .sumPrice {
  background-color: var(--warning-focus-input);
}

.main-header .budgetUtility,
.main-header .sumBudget {
  background-color: var(--info-focus-input);
}

.main-header .cost,
.main-header .efc,
.main-header .toSpend {
  background-color: var(--danger-focus-input);
}

.main-header .projectedUtility {
  background-color: var(--success-focus-input);
}

input:disabled {
  color: var(--neutral-text-disabled) !important;
  cursor: not-allowed;
}

button:disabled {
  border-color: var(--neutral-text-disabled) !important;
}

button:disabled,
button:disabled span {
  color: var(--neutral-text-disabled) !important;
}
</style>
