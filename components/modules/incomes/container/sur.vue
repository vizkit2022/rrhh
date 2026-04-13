<script setup>
import { ref, onMounted } from "vue";

import useLinesStore from "@/stores/lines";
import useIncomeStore from "@/stores/incomes";
import useGlobalStore from "@/stores/global";

import { formatCurrency } from "@/utils/formatAmount";

// STORES
const linesStore = useLinesStore();
const incomesStore = useIncomeStore();
const globalStore = useGlobalStore();

// CONSTANTS
const { params } = useRoute();
const idIncome = params && params.income ? params.income : null;
const calculatingValues = ref("");
const fullScreen = ref(false);
const menu = ref(false);
const staticCol = ref(true);
const expand = ref(false);
const infoModal = ref(false);
const currentPosLine = ref(null);
const currencyDefault = incomesStore?.income?.currency?.default;
const isInteractable = ref(false);
const inputSearchId = ref(null);
const hasChanged = ref({});

// COMPUTED
const selectedLines = computed(() => {
  return linesStore.linesSurcharges.filter((l) => l.selected);
});
const currencyFormatDefault = computed(
  () => incomesStore.currencyFormat.default
);
// FUNCTIONS
const deleteLines = async () => {
  cleanLines();

  if (selectedLines.value.length) {
    try {
      isInteractable.value = true;
      calculatingValues.value = "ELiminando sobrecargos";

      const lines = linesStore.linesSurcharges.filter(
        (l) => l.selected && l._id != null && l._id !== ""
      );

      await linesStore.deleteLinesSurcharges(idIncome, lines);

      const surchargeResponse = await linesStore.saveTotalsSurcharges();

      if (surchargeResponse) {
        linesStore.linesSurcharges = surchargeResponse.linesSurcharges;
        incomesStore.totalGrossIncome = surchargeResponse.totals;
      }
    } catch (error) {
      console.error("Error deleting lines:", error);
    } finally {
      isInteractable.value = false;
      calculatingValues.value = "";
    }
  }
};
const cleanLines = async () => {
  if (linesStore.linesSurcharges.length) {
    linesStore.linesSurcharges = linesStore.linesSurcharges.filter(
      (el) => el._id !== ""
    );
  }
  linesStore.hideSuperMenu();
};
const addLines = async (type = "line", pos = 0) => {
  try {
    const newLine = {
      income: idIncome,
      isCut: type === "cut",
      name: type === "cut" ? "Subtotal" : "",
      isSurcharge: true,
      __id: "",
      surchargeVariables: {},
    };

    if (type === "cut") {
      isInteractable.value = true;
      calculatingValues.value = "Calculando corte en tiempo real.";
      await createLine(newLine, pos);
    } else {
      linesStore.linesSurcharges.splice(pos, 0, {
        ...newLine,
        numbers: defaultProperties,
      });
    }
  } catch (error) {
    console.error("Error adding line:", error);
  } finally {
    setTimeout(() => {
      isInteractable.value = false;
      calculatingValues.value = "";
    });
  }
};
const slectedLine = (line, pos) => {};

const changeName = async (line, pos, updateTotals = true) => {
  try {
    if (line._id) {
      isInteractable.value = true;
      calculatingValues.value = "Actualizando.";
      await linesStore.updateSurchargeName(line);
      if (updateTotals) {
        const surchargeResponse = await linesStore.saveTotalsSurcharges(pos);
      }
    } else {
      isInteractable.value = true;
      calculatingValues.value = "Creando sobrecargo.";
      await createLine(line, pos);
    }
  } catch (error) {
    console.error("Error changing name:", error);
  } finally {
    setTimeout(() => {
      isInteractable.value = false;
      calculatingValues.value = "";
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
  }
};
const showModalInfo = (pos) => {
  infoModal.value = true;
  currentPosLine.value = pos;
};
const changePercentage = async (line, i) => {
  try {
    isInteractable.value = true;
    calculatingValues.value = "Calculando sobrecargos.";

    const surchargeResponse = await linesStore.saveTotalsSurcharges(i);

    if (surchargeResponse) {
      linesStore.linesSurcharges = surchargeResponse.linesSurcharges;
      incomesStore.totalGrossIncome = surchargeResponse.totals;
    }
  } catch (error) {
  } finally {
    isInteractable.value = false;
    calculatingValues.value = "";
  }
};

const changeValue = async (event, line, i, prop) => {
  hasChanged.value[`${i}-${prop}`] = true;
  try {
    const name = event.target.name;
    const value = Number(event.target.value);
    const currency = { ...currencyFormatDefault.value };
    isInteractable.value = true;
    linesStore.linesSurcharges[i].numbers[name].number = value;
    linesStore.linesSurcharges[i].numbers[name].value = formatCurrency(
      value,
      currency,
      true
    );

    calculatingValues.value = "Calculando sobrecargos.";
    const surchargeResponse = await linesStore.saveTotalsSurcharges(i);

    if (surchargeResponse) {
      linesStore.linesSurcharges = surchargeResponse.linesSurcharges;
      incomesStore.totalGrossIncome = surchargeResponse.totals;
    }
  } catch (error) {
  } finally {
    isInteractable.value = false;
    calculatingValues.value = "";
  }
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
const startEditing = (event, index, state) => {
  const name = event.target.name;
  const currentValue =
    String(event.target.value.trim()).replace("%", "").replace(" ", "") || "0";
  if (state) {
    linesStore.linesSurcharges[index].numbers[name].value = currentValue;
    linesStore.linesSurcharges[index].numbers[name].number =
      Number(currentValue);
  } else {
    linesStore.linesSurcharges[index].numbers[name].value = `${currentValue} %`;
    linesStore.linesSurcharges[index].numbers[name].number =
      Number(currentValue);
  }
};

// RENDER HTML
const propsLine = [
  "sumPrice",
  "sumBudget",
  "budgetUtility",
  "cost",
  "toSpend",
  "efc",
  "projectedUtility",
];
const getBorderClass = (pos) => {
  const totals = linesStore.linesSurcharges.length - 1;
  return pos === totals ? "no-border" : "border-bottom";
};
const selectValueInput = (event) => {
  event.target.select();
};

// CONSTANTS - NO REACTIVE
const defaultProperties = {
  percentage: {
    value: "0 %",
    lastValue: "0 %",
    number: 0,
    lastNumber: 0,
  },
  sumPrice: {
    value: "$ 0",
    lastValue: "$ 0",
    number: 0,
    lastNumber: 0,
  },
  sumBudget: {
    value: "$ 0",
    lastValue: "$ 0",
    number: 0,
    lastNumber: 0,
  },
  budgetUtility: {
    value: "$ 0",
    lastValue: "$ 0",
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
    value: "$ 0",
    lastValue: "$ 0",
    number: 0,
    lastNumber: 0,
  },
  toSpend: {
    value: "$ 0",
    lastValue: "$ 0",
    number: 0,
    lastNumber: 0,
  },
  efc: {
    value: "$ 0",
    lastValue: "$ 0",
    number: 0,
    lastNumber: 0,
  },
  projectedUtility: {
    value: "$ 0",
    lastValue: "$ 0",
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

// MOUNTED
onMounted(async () => {
  globalStore.loading = true;

  document.addEventListener("click", handleClickOutside);

  document.addEventListener("click", (event) => {
    if (
      event.target !== document.querySelector(".btnMainMenuSumary") &&
      event.target !== document.querySelector(".btnMainMenuSumaryIcon")
    ) {
      menu.value = false;
    }
  });

  await incomesStore.getMovementBasicData(idIncome);
  await linesStore.getLinesSurcharges();
  await linesStore.getAllGroups(idIncome);

  globalStore.loading = false;
});

// Agregar y eliminar event listener
// onMounted(() => {
//   document.addEventListener("click", handleClickOutside);
//   goToDropdownLocal();
// });
onBeforeUnmount(() => {
  document.removeEventListener("click", handleClickOutside);
});

const keyPressAction = (event, prop, line) => {
  console.log("keyPress", prop);
  if (prop != "sumBudget" && prop != "sumPrice" && prop != "percentage") {
    console.log("caso1");
    event.preventDefault();
  } else {
    if (line.surchargeVariables.field == "percentageFix") {
      console.log("caso2");
      event.preventDefault();
    } else if (
      line.surchargeVariables.field == "editPercentage" &&
      prop != "percentage"
    ) {
      console.log("caso3");
      event.preventDefault();
    } else if (
      line.surchargeVariables.field == "editValue" &&
      prop == "percentage"
    ) {
      console.log("caso4");
      event.preventDefault();
    }
  }
};

const handleKeyUp = (event, pos, option) => {
  // Desde el input
  if (pos !== null) {
    const key = event.key;
    // Solo puedo ingresar a la funciones precionando flecha hacia abajo
    if (key === "ArrowDown") {
      if (linesStore.searchLineNames.length) {
        const button = document.querySelector("#searchOption-1");
        if (button) button.focus();
        inputSearchId.value = `search-${pos}`;
      }
    } else {
      // Estas teclas significan que sali (son aquellas que no son letras ni numeros)
      const inValidKeys = [
        "ArrowUp",
        "ArrowsLeft",
        "ArrowRight",
        "Escape",
        "Enter",
      ];
      if (inValidKeys.includes(key)) {
        linesStore.linesSurcharges[pos].name = "";
        inputSearchId.value = null;
      }
      // Si es una letra o numero sigue te permite seguir escribiendo
    }
    // Desde las opciones de busqueda
  } else {
    const key = event.key;
    // Desplazarme hacia arriba o abajo de las opciones
    if (["ArrowDown", "ArrowUp"].includes(key)) {
      let newOption = key === "ArrowDown" ? option + 1 : option - 1;
      if (newOption === 0) newOption = 1;
      if (newOption === linesStore.searchLineNames.length + 1)
        newOption = linesStore.searchLineNames.length;
      const button = document.querySelector(`#searchOption-${newOption}`);
      if (button) button.focus();
    } else {
      // Si presione cualquier otra tecla
      const pos = inputSearchId.value
        ? Number(inputSearchId.value.replace("search-", ""))
        : 0;
      // SI es enter guardo
      if (key === "Enter") {
        const newValue = linesStore.searchLineNames[option - 1];
        const line = {
          ...linesStore.linesSurcharges[pos],
          name: newValue.name,
          tax: newValue._id,
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
      } else {
        // No enter significa que sali
        linesStore.linesSurcharges[pos].name = "";
      }
      // Perder el foco porque seleccione una opcion o sali
      inputSearchId.value = null;
    }
  }
};

const selectedOptionLines = (event, option) => {
  const pos = inputSearchId.value
    ? Number(inputSearchId.value.replace("search-", ""))
    : 0;

  const newValue = linesStore.searchLineNames[option - 1];
  let line = {
    ...linesStore.linesSurcharges[pos],
    name: newValue.name,
    tax: newValue._id,
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

  inputSearchId.value = null;
};

const handleClickOutside = (event) => {
  const menuGrid = document.querySelector(".menuGrid");
  if (menuGrid && !menuGrid.contains(event.target)) {
    inputSearchId.value = null;
  }
};

const isInputDisabled = (prop, line) => {
  if (prop !== "sumBudget" && prop !== "sumPrice" && prop !== "percentage") {
    return true;
  }
  if (line.surchargeVariables.field === "percentageFix") {
    return true;
  }
  if (line.surchargeVariables.field === "editPercentage" && prop !== "percentage") {
    return true;
  }
  if (line.surchargeVariables.field === "editValue" && prop === "percentage") {
    return true;
  }
  return false;
};

const onFocusInput = (event, prop, line) => {

  line.numbers[prop].lastNumber = line.numbers[prop].number;
  line.numbers[prop].lastValue = line.numbers[prop].value;
  line.numbers[prop].value = line.numbers[prop].number;

  setTimeout(() => { event.target.select(); }, 0)
};

const onBlurInput = (event, prop, line, i) => {
  // Tener cuidado, el change se lanza antes que el blur (1 Focus, 2 Input, 3 Change, 4 Blur)
  if(!hasChanged.value[`${i}-${prop}`]) {
    const currency = { ...currencyFormatDefault.value }; 
    const rawValue = Number(event.target.value); // Guardar el número real 
    line.numbers[prop].number = isNaN(rawValue) ? 0 : rawValue; // Guardar el valor formateado 
    line.numbers[prop].value = formatCurrency(line.numbers[prop].number, currency, true);
  }
  hasChanged.value[`${i}-${prop}`] = false;
};
const onInputOnlyNumbers = (event) => {
  let value = event.target.value;

  value = value.replace(/[^0-9.]/g, "");

  value = value.replace(/\.+/g, ".");

  event.target.value = value;
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
    surchargeVariables: {...newValue.surchargeVariables, retention: newValue.retention},
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

const searchLines = async (line, pos) => {
  if (line.isCut) {
    return;
  }
  posDropdown.value = pos;

  const toSearch = line.name.trim();
  if (!!toSearch) {
    linesStore.loadingSearch = true;
    await linesStore.searchForTaxesNames(toSearch);
    linesStore.loadingSearch = false;
  } else {
    linesStore.searchLineNames = [];
  }
};

const handleKeyUpInput = (event) => {
  const key = event.key;

  const forbiddenBottom = isBottomDropdown.value && key === "ArrowDown";
  const forbiddenTop = !isBottomDropdown.value && key === "ArrowUp";
  const forbiddenY =
    linesStore.loadingSearch && (forbiddenBottom || forbiddenTop);

  if (!forbiddenY) {
    if (
      posDropdown.value !== null &&
      isBottomDropdown.value &&
      ["ArrowUp", "ArrowLeft", "ArrowRight"].includes(key)
    ) {
      posDropdown.value = null;
      goToDropdown.value = false;
    }

    if (
      posDropdown.value !== null &&
      !isBottomDropdown.value &&
      ["ArrowDown", "ArrowLeft", "ArrowRight"].includes(key)
    ) {
      posDropdown.value = null;
      goToDropdown.value = false;
    }

    if (
      posDropdown.value !== null &&
      ((isBottomDropdown.value && key === "ArrowDown") ||
        (!isBottomDropdown.value && key === "ArrowUp"))
    ) {
      goToDropdown.value = true;
    }
  }

  if (key === "Escape") {
    posDropdown.value = null;
    goToDropdown.value = false;
  }
};
</script>

<template>
  <div class="container" id="containerSummary">
    <div class="container__filters">
      <div class="flexBox">
        <u-loading
          :width="16"
          color="--primary-text-default"
          v-if="calculatingValues"
        />
        <span class="msg">
          {{ calculatingValues }}
        </span>
      </div>
      <div class="flexBox">
        <u-button
          class="btnDesktop"
          text="Comprar"
          size="s"
          icon="shopping-cart"
          :disabled="true"
        />
        <u-button-icon
          class="btnMobile"
          icon="shopping-cart"
          :disabled="true"
          size="s"
        />
        <u-button-icon
          :icon="fullScreen ? 'minimize-1' : 'maximize-1'"
          type="outlined"
          color="--neutral-text-caption"
          colorHover="--neutral-text-body"
          colorActive="--neutral-text-body"
          @action-btn="fullScreen = !fullScreen"
          size="s"
        />
        <div style="position: relative; height: 32px">
          <button class="btnMainMenuSumary">
            <span
              class="u u-more btnMainMenuSumaryIcon"
              @click="menu = true"
            ></span>
          </button>
          <div :style="`transform: scale(${menu ? 1 : 0})`" class="menu">
            <button class="btnMenu" @click="menu = false">
              <span class="u u-share"></span>
              <span>Compartir</span>
            </button>
            <button class="btnMenu" @click="menu = false">
              <span class="u u-ray"></span>
              <span>Convertir</span>
            </button>
          </div>
        </div>
      </div>
    </div>
    <div class="table">
      <div class="table__header">
        <div class="table__header-actions"></div>
        <div class="table__header-name">
          <span class="title">Totales</span>
          <button
            :class="`${staticCol ? 'fixed' : ''} btnIcon btnIconFixColumn`"
            @click="staticCol = !staticCol"
          >
            <span class="u u-pin"></span>
          </button>
        </div>
        <div class="table__header-col col1">
          <span class="title">Total Venta</span>
        </div>
        <div class="table__header-col col2">
          <span class="title">C. Presupuestado</span>
        </div>
        <div class="table__header-col col2">
          <span class="title">U. Presupuestada</span>
        </div>
        <div class="table__header-col col3">
          <span class="title">Costos</span>
        </div>
        <div class="table__header-col col3">
          <span class="title">Por Gastar</span>
        </div>
        <div class="table__header-col col3">
          <span class="title">EFC</span>
        </div>
        <div class="table__header-col col4">
          <span class="title">Utilidad</span>
        </div>
      </div>
      <div class="table__groups">
        <div class="table__groups-actions">
          <span v-text="expand ? 'Código' : ''" class="title"></span>
        </div>
        <div class="table__header-name">
          <span class="title">Total Categorías</span>
          <button
            :class="`btnIconExpand`"
            :style="`transform: rotate(${expand ? 180 : 0}deg);`"
            @click="expand = !expand"
            :disabled="!linesStore.allGroups.length"
          >
            <span class="u u-chevron-down"></span>
          </button>
        </div>
        <div class="table__header-col">
          <span class="amount truncateText">
            {{ incomesStore.totalIncome.sumPrice.value }}
          </span>
        </div>
        <div class="table__header-col">
          <span class="amount truncateText">
            {{ incomesStore.totalIncome.sumBudget.value }}
          </span>
        </div>
        <div class="table__header-col">
          <span class="amount truncateText">
            {{ incomesStore.totalIncome.budgetUtility.value }}
          </span>
        </div>
        <div class="table__header-col">
          <span class="amount truncateText">
            {{ incomesStore.totalIncome.cost.value }}
          </span>
        </div>
        <div class="table__header-col">
          <span class="amount truncateText">
            {{ incomesStore.totalIncome.toSpend.value }}
          </span>
        </div>
        <div class="table__header-col">
          <span class="amount truncateText">
            {{ incomesStore.totalIncome.efc.value }}
          </span>
        </div>
        <div class="table__header-col">
          <span class="amount truncateText">
            {{ incomesStore.totalIncome.projectedUtility.value }}
          </span>
        </div>
      </div>
      <div class="table__containerGroups">
        <div
          class="table__containerGroups-item"
          v-for="group in linesStore.allGroups"
          :key="group._id"
        >
          <div class="table__containerGroups-actions">
            <span>{{ group.code || "-" }}</span>
          </div>
          <div class="table__containerGroups-name">
            <span>{{ group.name }}</span>
          </div>
          <div class="table__containerGroups-col">
            <span class="truncateText">{{ group.numbers.sumPrice.value }}</span>
          </div>
          <div class="table__containerGroups-col">
            <span class="truncateText">{{
              group.numbers.sumBudget.value
            }}</span>
          </div>
          <div class="table__containerGroups-col">
            <span class="truncateText">{{
              group.numbers.budgetUtility.value
            }}</span>
          </div>
          <div class="table__containerGroups-col">
            <span class="truncateText">{{ group.numbers.cost.value }}</span>
          </div>
          <div class="table__containerGroups-col">
            <span class="truncateText">{{ group.numbers.toSpend.value }}</span>
          </div>
          <div class="table__containerGroups-col">
            <span class="truncateText">{{ group.numbers.efc.value }}</span>
          </div>
          <div class="table__containerGroups-col">
            <span class="truncateText">{{
              group.numbers.projectedUtility.value
            }}</span>
          </div>
        </div>
      </div>
      <div class="table__subheader">
        <div class="table__subheader-actions">
          <button
            class="btnIcon"
            @click="isInteractable = !isInteractable"
            :disabled="calculatingValues !== ''"
          >
            <span class="u u-locked"></span>
          </button>
          <button
            @click="deleteLines"
            class="btnIcon"
            :disabled="isInteractable || selectedLines.length === 0"
          >
            <span class="u u-delete"></span>
          </button>
          <button
            class="btnIcon"
            @click="addLines('line')"
            :disabled="isInteractable"
          >
            <span class="u u-new"></span>
          </button>
        </div>
        <div class="table__header-name">
          <span class="title">Impuestos y Sobrecargos</span>
          <span class="title">%</span>
        </div>
        <div class="table__header-col" v-for="n in 7" :key="n">
          <span></span>
        </div>
      </div>
      <div
        :class="`table__item ${line.isCut ? ' main' : 'second'} ${
          'table__item-' + i
        }`"
        :style="`z-index: ${linesStore.linesSurcharges.length - i};`"
        v-for="(line, i) in linesStore.linesSurcharges"
        :key="i"
      >
        <div class="table__item-actions cell" :class="getBorderClass(i)">
          <!--<button class="btnIcon"><span class="u u-move"></span></button>-->
          <u-checkbox
            v-model="line.selected"
            @click="slectedLine(line, i)"
            :height="16"
            :disabled="isInteractable"
          />
          <button
            class="btnIcon"
            :disabled="isInteractable"
            @click="addLines('line', i + 1)"
          >
            <span class="u u-new"></span>
          </button>
          <button
            v-if="!line.isCut"
            class="btnIcon"
            :disabled="
              isInteractable ||
              i === linesStore.linesSurcharges.length - 1 ||
              (linesStore.linesSurcharges[i + 1] &&
                linesStore.linesSurcharges[i + 1].isCut)
            "
            @click="addLines('cut', i + 1)"
          >
            <span class="u u-sum"></span>
          </button>
        </div>
        <div
          class="table__item-name cell"
          :class="getBorderClass(i)"
          :id="`row-${i}`"
        >
          <input
            type="text"
            name="name"
            :id="line.__id"
            placeholder="Nombre del sobrecargo"
            v-model="line.name"
            autocomplete="off"
            :disabled="isInteractable"
            @input="searchLines(line, i)"
            @keydown="handleKeyUpInput($event)"
          />
          <button
            class="btnIcon info"
            @click="showModalInfo(i)"
            :disabled="
              isInteractable || ['', null, undefined].includes(line._id)
            "
          >
            <span class="u u-info"></span>
          </button>
          <input
            type=" text"
            name="percentage"
            v-model="line.numbers.percentage.value"
            @change="changePercentage(line, i)"
            @focus="startEditing($event, i, true)"
            @blur="startEditing($event, i, false)"
            @keypress="keyPressAction($event, 'percentage', line)"
            @click="selectValueInput($event)"
            :disabled="
              isInteractable || ['', null, undefined].includes(line._id)
            "
          />
        </div>
        <div
          class="table__item-col cell"
          :class="getBorderClass(i)"
          v-for="prop in propsLine"
          :key="prop"
        >
          <input
            type="text"
            class="inputCustom"
            :name="prop"
            v-model="line.numbers[prop].value"
            @change="changeValue($event, line, i, prop)"
            :disabled="calculatingValues || isInputDisabled(prop, line)"
            @focus="onFocusInput($event, prop, line)"
            @blur="onBlurInput($event, prop, line, i)"
            @input="onInputOnlyNumbers"
          />
          <!-- @keypress="$event.preventDefault()" -->
        </div>
      </div>
      <div class="table__footer">
        <div class="table__footer-actions"></div>
        <div class="table__footer-name footerTitle">
          <div class="name">
            <span class="title">Total con Sobrecargos</span>
          </div>
        </div>
        <div class="table__footer-col" v-for="prop in propsLine" :key="prop">
          <span class="amount truncateText">{{
            incomesStore.totalGrossIncome[prop].value
          }}</span>
        </div>
      </div>
    </div>
    <!-- <Teleport :to="`#${inputSearchId}`" v-if="inputSearchId">
      <div class="menuGrid">
        <div class="loadingLine" v-if="linesStore.loadingSearch">
          <u-loading :width="14" /> <span>{{ $t("global.text.loading") }}</span>
        </div>
        <template v-else>
          <div
            class="loadingLine"
            v-if="linesStore.searchLineNames.length === 0"
          >
            <span>Sin resultados</span>
          </div>
          <button
            v-for="(item, i) in linesStore.searchLineNames"
            :key="i"
            class="searchItem"
            :id="`searchOption-${i + 1}`"
            @keydown="handleKeyUp($event, null, i + 1)"
            @click="selectedOptionLines($event, i + 1)"
          >
            <div class="text">
              <span class="name truncateText">{{ item.name }}</span>
              <span :class="`type ${item.retention ? 'retention' : ''}`">{{
                item.retention ? "Con Retención" : "Sin Retención"
              }}</span>
            </div>
            <div class="percentage">
              <span>{{ item.value }} %</span>
            </div>
          </button>
        </template>
      </div>
    </Teleport> -->

    <u-dropdown
      v-if="![null, undefined].includes(posDropdown)"
      :idParent="`#row-${posDropdown}`"
      idContainer="containerSummary"
      maxheihtContent="128px"
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
</template>

<style scoped>
.menuGrid {
  position: absolute;
  width: 346px;
  height: auto;
  max-height: 300px;
  background-color: var(--neutral-background-default) !important;
  top: calc(100% + 2px);
  left: 0;
  z-index: 9;
  border-radius: 8px;
  box-shadow: var(--shadow-2);
  overflow: auto;
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 4px;
  box-sizing: border-box;
  transition: 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}

.loadingLine {
  width: 100%;
  height: 42px;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 10px;
}

.loadingLine span {
  color: var(--neutral-text-caption);
  font-size: 14px;
  line-height: 14px;
  font-family: Nunito;
}

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
  font-size: 14px;
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

.container {
  height: v-bind("fullScreen ? '100vh' : 'calc(100vh - 104px - 108px)'");
  width: v-bind("fullScreen ? '100vw' : '100%'");
  box-sizing: border-box;
  display: grid;
  grid-template-rows: 32px 1fr;
  gap: 20px;
  position: v-bind("fullScreen ? 'absolute' : 'relative'");
  top: 0;
  left: 0;
  z-index: v-bind("fullScreen ? 1000 : ''");
  padding: v-bind("fullScreen ? '20px' : '0px'");
  background-color: v-bind(
    "fullScreen ? 'var(--neutral-background-default)' : ''"
  );
}

.container__filters {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
}
.flexBox {
  display: flex;
  gap: 12px;
}
.table {
  z-index: 0;
  height: 100%;
  overflow: auto;
  border-radius: 20px;
}

.table::-webkit-scrollbar {
  width: 7px;
  height: 7px;
}

.table::-webkit-scrollbar-thumb {
  border-radius: 3px;
  background-color: var(--neutral-border-default);
}

.table::-webkit-scrollbar-track {
  background-color: var(--neutral-border-darker);
  border-radius: 3px;
}

.table__header,
.table__footer {
  height: 40px;
  position: sticky;
  z-index: -1;
}

.table__header {
  top: 0px;
  z-index: 9;
}

.table__subheader {
  position: relative;
  z-index: 0;
}

.table__subheader,
.table__containerGroups-item {
  height: 40px;
}
.table__groups {
  height: 40px;
}

.table__footer {
  bottom: 0px;
  padding-bottom: 5px;
}

.table__footer .table__footer-actions,
.table__footer .table__footer-name,
.table__footer .table__footer-col {
  border-top: 2px solid var(--neutral-border-subtle);
}

.table__item {
  height: 40px;
  position: relative;
}

.table__header,
.table__subheader,
.table__groups,
.table__item,
.table__containerGroups,
.table__footer {
  display: flex;
  width: 0px;
  min-width: 1902px;
}

.table__header {
  z-index: 99;
}

.table__subheader {
  z-index: 0;
}

.table__containerGroups {
  height: auto;
  display: v-bind("expand ? 'flex' : 'none'");
  flex-direction: column;
  transition: 0.3s;
}

.table__containerGroups-item {
  transition: 0.3s height !important;
  display: flex;
  position: relative;
}

.table__containerGroups-item .table__containerGroups-actions,
.table__containerGroups-item .table__containerGroups-name,
.table__containerGroups-item .table__containerGroups-col {
  border-bottom: 2px solid var(--neutral-border-subtle);
}

/* Backgrounds */
.table__header .table__header-name,
.table__header .table__header-actions {
  background-color: var(--neutral-background-default);
}
.table__header .table__header-col.col1 {
  background-color: var(--warning-focus-input);
}
.table__header .table__header-col.col2 {
  background-color: var(--info-focus-input);
}
.table__header .table__header-col.col3 {
  background-color: var(--danger-focus-input);
}
.table__header .table__header-col.col4 {
  background-color: var(--success-focus-input);
}

.table__groups .table__groups-actions,
.table__groups .table__header-name,
.table__groups .table__header-col,
.table__containerGroups .table__containerGroups-actions,
.table__containerGroups .table__containerGroups-name {
  background-color: var(--neutral-background-default);
}

.table__subheader .table__subheader-actions,
.table__subheader .table__header-name,
.table__subheader .table__header-col {
  background-color: var(--neutral-surface-softer);
}

.table__footer .table__footer-actions,
.table__footer .table__footer-col {
  background-color: var(--secondary-surface-shadow-12a);
}

.table__footer .table__footer-name {
  background-color: var(--neutral-background-default);
}

.table__containerGroups .table__containerGroups-col {
  background-color: var(--neutral-background-default);
}

/* Fonts */
span,
input {
  font-family: Nunito;
}

.table__header .table__header-name span.title,
.table__header .table__header-col span.title,
.table__subheader .table__header-name span.title,
.second .table__item-name input,
.table__containerGroups-item .table__containerGroups-actions span,
.table__containerGroups-item .table__containerGroups-name span,
.table__containerGroups-item .table__containerGroups-col span {
  color: var(--neutral-text-caption);
  font-size: 14px;
  font-weight: 600;
  line-height: 18px;
}

.table__groups .table__header-name span.title,
.table__groups .table__header-col span.amount,
.table__footer .table__footer-name span.title,
.table__footer .table__footer-col span.amount,
.main .table__item-name input,
.table__groups .table__groups-actions .title {
  color: var(--neutral-text-body);
  font-size: 14px;
  font-weight: 800;
  line-height: 18px;
}

.second .table__item-name input,
.table__containerGroups-item .table__containerGroups-actions span,
.table__containerGroups-item .table__containerGroups-name span,
.table__containerGroups-item .table__containerGroups-col span {
  color: var(--neutral-text-body);
}

.table__groups .table__header-col span.amount {
  color: v-bind(
    "expand ? 'var(--neutral-text-caption)' : 'var(--neutral-text-body)'"
  );
  transition: 0.3s;
}

.table__subheader .table__header-name {
  justify-content: space-between;
}

.table__containerGroups-name {
  width: 350px;
  border-left: 2px solid var(--neutral-border-subtle);
  border-right: 2px solid var(--neutral-border-subtle);
  position: v-bind("staticCol ? 'sticky' : 'relative'") !important;
  left: 0;
  top: 0;
  z-index: 2;
  padding: 0 20px;
  display: flex;
  align-items: center;
}
.table__containerGroups-col {
  min-width: 160px;
  max-width: 200px;
  width: calc(10vw - 1px);
  border-right: 2px solid var(--neutral-border-subtle);
  padding: 0 20px;
  display: flex;
  align-items: center;
  justify-content: flex-end;
}

.main div {
  transition: 0.3s cubic-bezier(0.075, 0.82, 0.165, 1);
  background-color: var(--extra-secondary2);
}

.main:hover div {
  background-color: var(--extra-secondary);
  transition: 0.3s cubic-bezier(0.075, 0.82, 0.165, 1);
}

.second div {
  transition: 0.3s cubic-bezier(0.075, 0.82, 0.165, 1);
  background-color: var(--neutral-background-default);
}

.second:hover div.cell {
  transition: 0.3s cubic-bezier(0.075, 0.82, 0.165, 1);
  background-color: var(--primary-focus-input);
}

.table__header-actions {
  border-radius: 20px 0 0 0;
}

.table__header-actions,
.table__subheader-actions,
.table__groups-actions,
.table__containerGroups-actions,
.table__footer-actions {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 40px;
  gap: 8px;
  width: 128px;
  border-left: 2px solid var(--neutral-border-subtle);
}

.table__groups-actions,
.table__containerGroups-actions {
  justify-content: flex-end;
  padding: 0 20px;
}

.table__footer-actions {
  border-radius: 0 0 0 20px;
  border-bottom: 2px solid var(--neutral-border-subtle);
}

.table__item-actions {
  display: grid;
  grid-template-columns: repeat(3, 25px);
  justify-content: center;
  align-items: center;
  height: 40px;
  gap: 5px;
  width: 128px;
  border-left: 2px solid var(--neutral-border-subtle);
}

.table__header-col,
.table__footer-col {
  padding: 0 20px;
  height: 40px;
}

.table__header .table__header-col,
.table__header .table__header-actions,
.table__header .table__header-name {
  border-top: 2px solid var(--neutral-border-subtle);
  border-bottom: 2px solid var(--neutral-border-subtle);
}

.table__groups .table__header-col,
.table__groups .table__header-actions,
.table__groups .table__header-name {
  border-bottom: 2px solid var(--neutral-border-subtle);
}

.table__subheader-actions,
.table__groups-actions,
.table__groups .table__header-name,
.table__subheader .table__header-name,
.table__subheader .table__header-col {
  border-bottom: 2px solid var(--neutral-border-subtle);
  border-top: none;
}

.table__item-col-search {
  position: sticky !important;
  background-color: var(--neutral-background-default) !important;
  height: auto;
  max-height: 200px;
  width: 100%;
  box-shadow: var(--shadow-3);
  border-radius: 10px;
  padding: 5px;
  box-sizing: border-box;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 10px;
  z-index: 105;
}

.table__item-col-search-option {
  z-index: 5;
  background-color: var(--neutral-background-default);
  padding: 0 20px;
  border-radius: 10px;
  box-sizing: border-box;
  height: 40px;
  width: 100%;
  transition: 0.3s;
  flex-shrink: 0;
  text-align: left;
  font-family: Nunito;
  font-size: 14px;
  line-height: 18px;
  font-weight: 600;
  color: var(--neutral-text-body);
}

.table__item-col-search::-webkit-scrollbar {
  width: 0px;
  height: 0px;
}

.table__header-col,
.table__item-col,
.table__footer-col {
  min-width: 160px;
  max-width: 200px;
  width: calc(10vw - 1px);
  display: flex;
  align-items: center;
  border-right: 2px solid var(--neutral-border-subtle);
}

.table__footer-col {
  justify-content: flex-end;
  border-bottom: 2px solid var(--neutral-border-subtle);
}

.table__header .table__header-col:last-child {
  border-radius: 0 20px 0 0;
}

.table__footer-col:last-child {
  border-radius: 0 0 20px 0;
}

.table__subheader .table__header-col,
.table__groups .table__header-col {
  display: flex;
  justify-content: flex-end;
}

.table__header-name,
.table__footer-name {
  height: 40px;
}

.table__header-name {
  justify-content: space-between;
}

.table__item-name {
  position: relative;
}

.table__item-name input {
  position: absolute;
  padding: 0 20px;
  caret-color: var(--bg-primary-500);
}

.table__item-name input[name="name"] {
  left: 0px;
  top: 0px;
  width: calc(100% - 120px);
  height: 100%;
  z-index: 1;
}

.main .table__item-name input[name="name"] {
  width: 100%;
}

.table__item-name input[name="percentage"] {
  right: 0px;
  top: 0px;
  width: 82px;
  height: 100%;
  z-index: 2;
  text-align: right;
  padding: 0 20px 0 0px;
}

.main .table__item-name input[name="percentage"],
.main .btnIcon.info {
  display: none;
}

.btnIcon:disabled,
input:disabled {
  opacity: 0.5 !important;
}

input::selection {
  background-color: var(--primary-text-subtle);
  color: var(--neutral-background-default);
}

.table__item-name input[name="name"]:focus,
.table__item-name input[name="name"]:active,
.table__item-name input[name="percentage"]:focus,
.table__item-name input[name="percentage"]:active {
  z-index: 10;
  box-shadow: inset 0px 0px 0px 2px rgba(58, 199, 165, 1);
  background-color: var(--primary-focus-input);
}

.table__item-name input[name="percentage"]:disabled {
  opacity: 0.5;
}

.table__header-name,
.table__item-name,
.table__footer-name:not(.footerTitle) {
  width: 350px;
  border-left: 2px solid var(--neutral-border-subtle);
  border-right: 2px solid var(--neutral-border-subtle);
  position: v-bind("staticCol ? 'sticky' : 'relative'") !important;
  left: 0;
  top: 0;
  z-index: 2;
  display: flex;
  padding: 0 20px;
  align-items: center;
  background-color: var(--neutral-background-default);
}

.table__footer-name.footerTitle {
  width: 350px;
  background-color: var(--neutral-background-darker);
  border-left: 2px solid var(--neutral-border-subtle);
  border-right: 2px solid var(--neutral-border-subtle);
  position: sticky;
  left: 0px;
}

.table__footer .table__footer-name div {
  background-color: var(--secondary-surface-shadow-12a);
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  padding: 0 20px;
}

.table__header .table__header-name,
.table__footer .table__footer-name {
  border-left: none;
}

.table__footer-name {
  border-bottom: 2px solid var(--neutral-border-subtle);
}

.btnIcon {
  border-radius: 8px;
  width: 28px;
  height: 28px;
  border: 1px solid var(--neutral-text-caption);
  display: flex;
  justify-content: center;
  align-items: center;
  align-content: center;
  background-color: var(--neutral-background-default);
  transition: border 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

.btnIcon.info {
  width: 16px;
  height: 16px;
  position: absolute;
  right: 90px;
  border: none;
}

.table__item-actions .btnIcon {
  border: none;
  width: 20px;
  background-color: transparent;
}

.table__item-actions .btnIcon:disabled,
.btnIcon.info:disabled {
  cursor: not-allowed !important;
}

.table__item-actions .btnIcon:hover,
.btnIcon.info:hover {
  border: none !important;
}

.btnIconExpand {
  transition: 0.3s;
}

.btnIconExpand:disabled {
  cursor: not-allowed;
}

.btnIconExpand:disabled span {
  color: var(--neutral-text-disabled) !important;
}

.btnIcon span,
.btnIconExpand span {
  color: var(--neutral-text-caption) !important;
  font-size: 20px !important;
  line-height: 20px !important;
  transition: color 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  font-weight: 400;
}

.btnIcon.info span {
  font-size: 16px !important;
}

.btnIcon:not(:disabled):hover {
  border: 1px solid var(--primary-text-default);
}

.btnIcon:not(:disabled):hover span,
.btnIconExpand:not(:disabled):hover span {
  color: var(--primary-text-default) !important;
}

.table__header-actions {
  display: flex;
}

.fixed {
  border: 1px solid
    v-bind(
      "staticCol ? 'var(--bg-primary-400)' : 'var(--neutral-border-subtle)'"
    );
}

.fixed span {
  color: v-bind(
    "staticCol ? 'var(--bg-primary-400)' : 'var(--neutral-border-subtle)'"
  ) !important;
}

.menu {
  position: absolute;
  right: 0;
  top: 0;
  transition: transform 0.3s;
  transition: 0.3s;
  transform: scale(0);
  transform-origin: top right;
  width: 225px;
  padding: 5px;
  box-shadow: var(--shadow-3);
  border-radius: 10px;
  z-index: 120;
  background-color: var(--neutral-background-default);
}

.btnMenu {
  width: 100%;
  display: grid;
  grid-template-columns: 20px 1fr;
  gap: 10px;
  padding: 0 10px;
  height: 36px;
  align-items: center;
  border-radius: 10px;
  transition: 0.3s;
}
.btnMenu:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}
.btnMenu:not(:disabled):hover {
  background-color: var(--primary-focus-input);
}

.btnMenu span.u {
  font-size: 20px;
  line-height: 20px;
  color: var(--neutral-text-caption);
  transition: 0.3s;
}
.btnMenu span:not(.u) {
  font-size: 16px;
  line-height: 16px;
  font-family: "Nunito";
  color: var(--neutral-text-caption);
  text-align: left;
  font-weight: 600;
  transition: 0.3s;
}

.inputCustom {
  padding: 0 20px;
  height: 40px;
  width: 100%;
  font-family: Nunito;
  font-size: 14px;
  line-height: 14px;
  font-weight: 600;
  color: var(--neutral-text-body);
  text-align: right;
}

.table__item-0 .inputCustom {
  height: calc(98%);
}

.inputCustom:focus,
.inputCustom:active {
  box-shadow: inset 0px 0px 0px 2px rgba(58, 199, 165, 1);
  background-color: var(--primary-focus-input) !important;
}

.btnMobile {
  display: none;
}

.btnMainMenuSumary {
  border-radius: 8px;
  height: 32px;
  width: 32px;
  border: 1px solid var(--neutral-text-caption);
  padding: 0px;
  display: flex;
  justify-content: center;
  align-items: center;
}
.btnMainMenuSumary span {
  width: 32px !important;
  height: 32px !important;
  font-size: 18px;
  line-height: 22px;
  color: var(--neutral-text-caption);
  padding: 5px;
}

input:disabled {
  cursor: not-allowed;
}

.msg {
  color: var(--primary-text-default);
  font-size: 14px;
}

.border-bottom {
  border-bottom: 2px solid var(--neutral-border-subtle);
}
.no-border {
  border-bottom: none;
}

@media only screen and (max-width: 1290px) {
  .btnMobile {
    display: flex;
  }
  .btnDesktop {
    display: none;
  }
}

@media only screen and (max-width: 768px) {
  .container {
    height: v-bind(
      "fullScreen ? '100vh' : 'calc(100vh - 100px - 85px - 52px)'"
    );
    width: v-bind("fullScreen ? '100vw' : 'calc(100vw - 40px)'");
  }
}

@media only screen and (max-width: 940px) {
  .container__filters {
    justify-content: flex-end;
  }
  .container__filters-numbers {
    display: none;
  }
  .table__header-name,
  .table__item-name,
  .table__footer-name {
    position: relative;
  }
  .btnIconFixColumn {
    display: none;
  }
}
</style>
