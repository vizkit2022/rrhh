<script setup>
import { computed, defineProps, onMounted, nextTick } from "vue";
import useIncomeStore from "@/stores/incomes";
import useGrillaStore from "@/stores/grilla";
import { evaluateFormula } from "@/utils/helpers";
import { buildCurrencyObject } from "@/utils/formatAmount";
import { useI18n } from "vue-i18n";

// Stores
const incomesStore = useIncomeStore();
const grillaStore = useGrillaStore();

// Props
const props = defineProps({
  title: {
    type: Boolean,
    default: true,
  },
});

// Computed
const varsFiltered = computed(() => {
  return search.value === ""
    ? incomesStore.variables
    : incomesStore.variables.filter((_var) =>
        _var.name.toLowerCase().includes(search.value.toLowerCase())
      );
});
const currency = computed(() => {
  const defaultCurrency = incomesStore.income.currency.default;
  const { configDropdownCell } = grillaStore;

  // Si la celda es numérica, usar la moneda por defecto
  if (configDropdownCell.header.type === "number") {
    return defaultCurrency;
  }

  const isIncome = configDropdownCell.type === "incomes";
  const lineData = configDropdownCell.line?.data ?? {};

  return isIncome
    ? lineData.currency || defaultCurrency
    : lineData.currencyBudget || defaultCurrency;
});

// Mounted
onMounted(() => {
  const line = grillaStore.configDropdownCell?.line?.data || {};

  objValues.value.displayFormula =
    line?.numbers?.[prop]?.calculation?.displayFormula ||
    line?.numbers?.[prop]?.[
      ["price", "budget"].includes(prop) ? "valueNoSymbol" : "value"
    ] ||
    "";
  objValues.value.formula = line?.numbers?.[prop]?.calculation?.formula || "";
  objValues.value.dependencies =
    line?.numbers?.[prop]?.calculation?.dependencies || [];

  // Construir formulaValues
  const list = objValues.value.displayFormula
    .replace(/\s+/g, "")
    .split(regex)
    .filter(Boolean);

  list.forEach((v) => {
    // Identificar variables - letras
    if (/[a-zA-Z]/.test(v)) {
      const _varUpper = v.toUpperCase();
      const _var = incomesStore.variables.find(
        (variable) => variable.abbreviation.toUpperCase() === _varUpper
      );
      if (_var) {
        objValues.value.formulaValues += _var.value;
      }
    } else {
      // No es variable
      console.log(v)
      const symbolD = currency.value.typeFormat === "en-US" ? "." : ","; // decimal
      const symbolM = currency.value.typeFormat === "en-US" ? "," : "."; // miles
      const decimals = currency.value.precision || 0;

      if (decimals === 0) {
        let str = v.replaceAll(symbolM, "").replaceAll(symbolD, ".");
        objValues.value.formulaValues += str;
      } else {
        let str = v.replaceAll(symbolM, "").replaceAll(symbolD, ".");

        // Corregir decimales extra
        const newStr = str.split(".");
        if (newStr[1] && newStr[1].length > decimals) {
          const resp = newStr[0] + "." + newStr[1].substring(0, decimals);
          objValues.value.formulaValues += resp;
        } else {
          objValues.value.formulaValues += str;
        }
      }
    }
  });

  result.value.str = line?.numbers?.[prop]?.value || "";
  result.value.number = line?.numbers?.[prop]?.number || 0;

  focusInputVars();
  document.addEventListener("keydown", handleEscapeKey);
});

onUnmounted(() => {
  document.removeEventListener("keydown", handleEscapeKey);
});

const handleEscapeKey = (event) => {
  if (event.key === "Escape" || event.key === "Esc") {
    grillaStore.dropdownCloseEvent();
  }
};

// Constants
const prop = grillaStore.configDropdownCell?.header?.prop || "price";
const search = ref("");
const change = ref(false);
const error = ref(false);
const result = ref({ str: "", number: 0 });
const objValues = ref({
  formula: "",
  displayFormula: "",
  dependencies: [],
  formulaValues: "",
});
const { t } = useI18n();
const module = "modules.incomes.pages.grilla.menus.vars";
const operators = ["+", "-", "*", "/", "(", ")"];
const regex = /([+\-*/()])/g;

// Functions
const eventInput = (e) => {
  const inputValue = e.target.value.trim() || "";
  change.value = true;
  let obj = {
    formula: "",
    displayFormula: "",
    dependencies: [],
    formulaValues: "",
  };

  error.value = false;

  const listV = inputValue
    .replace(/\s+/g, "") // quita espacios
    .split(regex) // separa por operadores
    .filter(Boolean); // limpia vacíos

  listV.forEach((v) => {
    // Identificar operadores
    if (operators.includes(v)) {
      obj.formula += v;
      obj.displayFormula += v;
      obj.formulaValues += v;
    }

    // Identificar variables - letras
    else if (/[a-zA-Z]/.test(v)) {
      const _varUpper = v.toUpperCase();
      const _var = incomesStore.variables.find(
        (variable) => variable.abbreviation.toUpperCase() === _varUpper
      );
      if (_var) {
        obj.formula += _var._id;
        obj.displayFormula += _varUpper;
        if (!obj.dependencies.includes(_var._id)) {
          obj.dependencies.push(_var._id);
        }
        obj.formulaValues += _var.value;
      } else {
        obj.formula += v;
        obj.displayFormula += v;
        error.value = true;
        obj.formulaValues += v;
      }
    }

    // Identificar números
    else {
      const symbolD = currency.value.typeFormat === "en-US" ? "." : ","; // decimal
      const symbolM = currency.value.typeFormat === "en-US" ? "," : "."; // miles
      const decimals = currency.value.precision || 0;
      // Solo enteros
      if (decimals === 0) {
        let str = v.replaceAll(symbolM, "").replaceAll(symbolD, ".");
        obj.formula += str;
        obj.formulaValues += str;

        // Eliminar decimales para displayFormula
        str = str.split(".")[0];

        // Para displayFormula, insertar separadores de miles
        const [intPart, decPart] = str.split(".");
        let formatted = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, symbolM);
        if (decPart !== undefined) formatted += symbolD + decPart;

        obj.displayFormula += formatted;
      } else {
        let str = v.replaceAll(symbolM, "").replaceAll(symbolD, ".");

        // Corregir decimales extra
        const newStr = str.split(".");
        if (newStr[1] && newStr[1].length > decimals) {
          const resp = newStr[0] + "." + newStr[1].substring(0, decimals);
          obj.formula += resp;
          obj.formulaValues += resp;
        } else {
          obj.formula += str;
          obj.formulaValues += str;
        }

        // Para displayFormula, insertar separadores de miles
        const [intPart, decPart] = str.split(".");
        let formatted = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, symbolM);
        if (decPart !== undefined) formatted += symbolD + decPart;

        // Corregir decimales extra en displayFormula
        const newFormatted = formatted.split(symbolD);
        if (newFormatted[1] && newFormatted[1].length > decimals) {
          obj.displayFormula +=
            newFormatted[0] + symbolD + newFormatted[1].substring(0, decimals);
        } else {
          obj.displayFormula += formatted;
        }
      }
    }
  });

  e.target.value = obj.displayFormula;
  const val = evaluateFormula(obj.formulaValues);

  // Formato Moneda
  const valCurrency = buildCurrencyObject(
    val.value,
    currency.value,
    "currency"
  );

  result.value.str = ["price", "budget"].includes(prop)
    ? valCurrency.value
    : valCurrency.valueNoSymbol;
  result.value.number = valCurrency.number;
  objValues.value = obj;
};

const save = () => {
  if (!change.value || error.value) return;

  // Guardar la fórmula o el resultado
  const oldValue =
    grillaStore.configDropdownCell?.line?.data?.numbers?.[prop] || {};
  let newValue = {
    calculation: {
      formula: objValues.value.formula,
      displayFormula: objValues.value.displayFormula,
      dependencies: objValues.value.dependencies,
    },
    lastNumber: oldValue?.number || 0,
    lastValue: oldValue?.value || 0,
    number: result.value.number,
    value: result.value.str,
  };

  if (["price", "budget"].includes(prop)) {
    newValue = {
      ...newValue,
      valueNoSymbol: result.value.str
        .replaceAll(currency.value.symbol, "")
        .trim(),
    };
  }

  const data = {
    // Tipo de Dropdown
    type: "vars",
    // Propiedad a actualizar
    prop,
    // Nuevos valores
    newValue,
    // Posición de la línea
    posLine: grillaStore.configDropdownCell?.posLine || 0,
  };

  grillaStore.startCloudSync();
  grillaStore.saveDropdown(data);
};

const selectVar = async (_var) => {
  const displayFormula = objValues.value.displayFormula;
  const lastCharacter = displayFormula.at(-1);
  change.value = true;

  // Determinar si necesita operador prefijo
  const isEmpty = displayFormula.trim() === "";
  const endsWithOperator = operators.includes(lastCharacter);
  const endsWithZeroOrOne = /(?:^|[+\-*/(])([01])$/.test(displayFormula.replace(/\s+/g, ""));

  const needsOperator = !isEmpty && !endsWithOperator && !endsWithZeroOrOne;
  const prefix = needsOperator ? "*" : "";

  // Si termina en 0 o 1 suelto, reemplazarlo con la variable directamente
  let trimDisplay = objValues.value.displayFormula;
  let trimFormula = objValues.value.formula;
  let trimFormulaValues = objValues.value.formulaValues;

  if (endsWithZeroOrOne) {
    // Quitar el último carácter (0 o 1)
    trimDisplay = trimDisplay.slice(0, -1);
    trimFormula = trimFormula.slice(0, -1);
    trimFormulaValues = trimFormulaValues.slice(0, -1);
  }

  objValues.value.displayFormula = trimDisplay + prefix + _var.abbreviation;
  objValues.value.formula = trimFormula + prefix + _var._id;
  objValues.value.formulaValues = trimFormulaValues + prefix + _var.value;

  // Agregar dependencia solo si no existe
  if (!objValues.value.dependencies.includes(_var._id)) {
    objValues.value.dependencies.push(_var._id);
  }

  await nextTick();

  // Calcular nuevo valor
  const val = evaluateFormula(objValues.value.formulaValues);

  // Formato Moneda
  const valCurrency = buildCurrencyObject(val.value, currency.value, "currency");

  result.value.str = ["price", "budget"].includes(prop)
    ? valCurrency.value
    : valCurrency.valueNoSymbol;
  result.value.number = valCurrency.number;

  focusInputVars();
};

const focusInputVars = async () => {
  await nextTick();
  const input = document.getElementById("idInputVars");
  if (input) input.focus();
};
</script>

<template>
  <div class="vars">
    <span class="title" v-if="props.title" v-text="t(module + '.label')"></span>

    <div class="vars__action">
      <u-input
        id="idInputVars"
        v-model="objValues.displayFormula"
        @input="eventInput"
        :error="result?.number == null || result.number < 0"
      />
      <u-button-icon
        icon="save"
        size="s"
        :disabled="!change || result?.number == null || result.number < 0"
        @click="save"
      />
    </div>

    <span class="valueAmount">= {{ result.str || "#ERROR" }}</span>

    <u-input
      :placeholder="t(module + '.placeholders.search')"
      size="s"
      v-model="search"
    />
    <div class="vars__list" v-if="varsFiltered.length > 0">
      <button
        v-for="(_var, v) in varsFiltered"
        :key="v"
        :class="{ selected: _var.selected }"
        @click="selectVar(_var)"
      >
        <span v-text="_var.abbreviation"></span>
        <span v-text="_var.name" class="truncateText"></span>
        <span v-text="_var.value"></span>
      </button>
    </div>
    <div v-else class="vars-noResults">
      <span v-text="t(module + '.text.noResults')"></span>
    </div>
  </div>
</template>

<style scoped>
.vars {
  height: 100%;
  display: grid;
  gap: 10px;
  grid-template-rows: v-bind(
    "props.title ? 'auto auto auto auto 1fr' : 'auto auto auto 1fr'"
  );
  flex-direction: column;
}
.vars span.title {
  height: auto;
  font-weight: 700;
  font-size: 10px;
  line-height: 14px;
  letter-spacing: 10%;
  vertical-align: middle;
  text-transform: uppercase;
  color: var(--neutral-text-caption);
}
.vars__list {
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 2px;
  height: v-bind("props.title ? '135px' : '158px'");
  padding-right: 1px;
}
.vars__list::-webkit-scrollbar {
  width: 8px;
}
.vars__list::-webkit-scrollbar-thumb {
  background-color: var(--neutral-border-subtle);
  border-radius: 5px;
}
.vars__list button {
  padding: 4px 8px;
  border-radius: 8px;
  display: grid;
  grid-template-columns: auto 1fr auto;
  gap: 10px;
  align-items: center;
  transition: 0.3s;
}
.vars__list button.selected {
  background-color: var(--primary-surface-shadow-12a);
}
.vars__list button:not(.selected):hover {
  background-color: var(--primary-surface-shadow-8a);
}
.vars__list button span:nth-child(1) {
  font-weight: 600;
  font-size: 14px;
  line-height: 18px;
  letter-spacing: 0%;
  vertical-align: middle;
  color: var(--secondary-text-darker);
  border: 1px solid var(--secondary-border-subtle);
  background-color: var(--secondary-surface-softer);
  padding: 4px 8px;
  border-radius: 8px;
}
.vars__list button span:nth-child(2) {
  text-align: left;
  font-weight: 600;
  font-size: 12px;
  line-height: 16px;
  letter-spacing: 0%;
  vertical-align: middle;
  color: var(--neutral-text-body);
}
.vars__list button span:nth-child(3) {
  font-weight: 600;
  font-size: 12px;
  line-height: 16px;
  letter-spacing: 0%;
  vertical-align: middle;
  text-align: right;
  color: var(--neutral-text-body);
}
.vars__action {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 10px;
}
.vars__action-texts {
  display: grid;
  align-items: center;
  grid-template-columns: 1fr auto;
  border-radius: 8px;
  border: 1px solid var(--neutral-border-default);
  transition: 0.3s;
  position: relative;
}
.vars__action-texts:hover {
  border-color: var(--primary-border-subtle);
}
.vars__action-texts.focus {
  border: 1px solid var(--primary-border-default);
  box-shadow: inset var(--primary-border-default) 0px 0px 0px 1px;
}
.vars__action-texts.error {
  border: 1px solid var(--danger-border-default);
  box-shadow: inset var(--danger-border-default) 0px 0px 0px 1px;
}
.vars__formulas {
  display: flex;
  gap: 4px;
  margin: 0 12px;
  position: absolute;
  height: 100%;
  align-items: center;
  overflow: scroll;
  width: calc(100% - 24px);
  color: var(--neutral-text-disabled);
}
.vars__formulas::-webkit-scrollbar {
  width: 0px;
  height: 0px;
}
.vars__formulas div.operator span {
  color: var(--neutral-text-caption);
  font-weight: 600;
  font-size: 14px;
}
.vars__formulas div.number span {
  color: var(--neutral-text-body);
  font-weight: 600;
  font-size: 14px;
}
.vars__formulas div.vars {
  height: 24px;
  background-color: var(--secondary-surface-softer);
  border-radius: 4px;
  border: 1px solid var(--secondary-border-subtle);
  color: var(--secondary-text-darker);
  font-weight: 600;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 0px 4px;
  font-size: 14px;
  line-height: 14px;
  letter-spacing: 0%;
  vertical-align: middle;
}
.vars span.text {
  color: var(--neutral-text-caption);
  font-size: 12px;
  line-height: 12px;
  font-weight: 400;
  border-bottom: 1px solid var(--neutral-border-subtle);
  padding-bottom: 10px;
}
.vars span.text.error {
  color: var(--danger-text-default);
  font-weight: 600;
}
.vars-noResults {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 40px;
}
.vars-noResults span {
  color: var(--neutral-text-caption);
  font-size: 12px;
  line-height: 12px;
  font-weight: 400;
}
.caret-wrapper {
  min-width: 4px;
  display: flex;
  align-items: center;
}
.caret {
  display: inline-block;
  width: 1px;
  height: 1em;
  background: var(--primary-text-default);
  animation: blink 1s step-start infinite;
}

.valueAmount {
  font-size: 12px;
  line-height: 12px;
  color: var(--neutral-text-caption);
  margin-bottom: 10px;
}

@keyframes blink {
  50% {
    opacity: 0;
  }
}
</style>
