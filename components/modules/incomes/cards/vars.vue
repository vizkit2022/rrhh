<script setup>
import { computed, defineProps, onMounted, nextTick, defineEmits, onUnmounted } from "vue";
import useGlobalStore from "@/stores/global";
import useIncomeStore from "@/stores/incomes";
import { evaluateFormula, generateRandomId } from "@/utils/helpers";
import { formatCurrency } from "@/utils/formatAmount";
import { useI18n } from "vue-i18n";

// Stores
const globalStore = useGlobalStore();
const incomesStore = useIncomeStore();

// Emits
const emit = defineEmits(["saveDropdown","dropdownClose"]);

// Props
const props = defineProps({
    title: {
        type: Boolean,
        default: true
    },
    config: {
      type: Object,
      default: () => ({})
    }
});

// Computed
const varsFiltered = computed(() => {
    return search.value === ""
        ? incomesStore.variables
        : incomesStore.variables.filter(_var => _var.name.toLowerCase().includes(search.value.toLowerCase()));
});

// Mounted
onMounted(() => {
    const line = props.config?.line || {};
    const prop = props.config?.header?.prop || "price";

    displayFormula.value = line?.numbers?.[prop]?.calculation?.displayFormula || `${line?.numbers?.[prop]?.number}` || "";
    formula.value = line?.numbers?.[prop]?.calculation?.formula || `${line?.numbers?.[prop]?.number}` || "";
    dependencies.value = line?.numbers?.[prop]?.calculation?.dependencies || [];

    result.value = line?.numbers?.[prop]?.value || `${line?.numbers?.[prop]?.number}` || "";

    const isUseCurrency = ["price", "budget"].includes(prop);
    // SI la currencia no está definida, significa que es una variable de tipo número
    if(isUseCurrency) {
        const propCurrency = prop === "price" ? "currency" : "currencyBudget";
        currency.value = line?.[propCurrency] || incomesStore?.income?.currency?.default || {};
    };

    const resp = evaluateFormula(formulaOnlyNumbers());
    handleFormulaResult(resp);

    const input = document.getElementById(idInput);
    if (input) {
        input.focus();
        focus.value = true;
    }

  document.addEventListener("keydown", handleEscapeKey);

});

onUnmounted(() => {
  document.removeEventListener("keydown", handleEscapeKey);
});

const handleEscapeKey = (event) => {
  if (event.key === "Escape" || event.key === "Esc") {
    emit("dropdownClose");
  }
};

// Constants
const search = ref("");
const init = ref(true);
const formula = ref("");
const displayFormula = ref("");
const dependencies = ref([]);
const formulaOnlyNumbers = () => {
    dependencies.value = [];
    formula.value = "";
    tokensObj.value = "";

    const FORMULA = displayFormula.value;
    if (!FORMULA) return "0";

    // 1. Separar los tokens por operadores (incluye ^ y **)
    const tokens = FORMULA.split(/[\+\-\*\/\^\(\)]|(?<=\*)\*(?=\*)/g).map(t => t.trim()).filter(Boolean);

    // 2. Detectar variables: son aquellas que no son números
    const variableTokens = tokens.filter(t => isNaN(Number(t)));

    // 3. Verificar existencia
    for (const abbreviation of variableTokens) {
        const found = incomesStore.variables.find(v => v.abbreviation.toLowerCase() === abbreviation.toLowerCase());
    }

    // 4. Reemplazar variables por sus valores
    const replaced = FORMULA.replace(/\b[a-zA-Z_][a-zA-Z0-9_]*\b/g, (match) => {
        const found = incomesStore.variables.find(v => v.abbreviation.toLowerCase() === match.toLowerCase());
        if (found) {
            dependencies.value.push(found._id);
            return found.value.toString();
        } else {
            return null;
        }
    });

    // 5. Eliminar duplicados en dependencies
    dependencies.value = [...new Set(dependencies.value)];

    // 6. Crear el formula con ids
    formula.value = buildFormulaFromDisplay();

    // 7. Crear el objeto de tokens
    tokensObj.value = tokenizeFormula();

    console.log(replaced)

    return replaced;
};

const currency = ref(null);
const result = ref("");
const resultNumber = ref(0);
const idInput = generateRandomId("vars-input");
const tokensObj = ref([]);
const focus = ref(true);
const { t } = useI18n();
const module = "modules.incomes.pages.grilla.menus.vars";

// Functions
const selectVar = (pos) => {
    incomesStore.variables.forEach((_var, v) => {
        _var.selected = v === pos;
    });

    const variableStr = incomesStore.variables[pos].abbreviation;

    const lastChar = displayFormula.value.slice(-1);
    const needsOperator = !['+', '-', '*', '/', '(', '^'].includes(lastChar);

    displayFormula.value += needsOperator && displayFormula.value.trim() !== '' ? '*' + variableStr : variableStr;

    const resp = evaluateFormula(formulaOnlyNumbers());

    handleFormulaResult(resp);

    const input = document.getElementById(idInput);
    if (input) input.focus();
};
const getFormula = (e) => {
    displayFormula.value = e.target.value.toUpperCase().trim();
    if(formulaOnlyNumbers() === null) {
        result.value = "#ERROR";
        resultNumber.value = 0;
        return;
    } else {
        const resp = evaluateFormula(formulaOnlyNumbers());
        handleFormulaResult(resp);
    }
};
const save = () => {
    if (result.value === "#ERROR") return;
    // Guardar la fórmula o el resultado
    const prop = props.config?.header?.prop || "price";
    const oldValue = props.config?.line?.numbers?.[prop] || {};
    let newValue = {
        calculation: {
            formula: formula.value,
            displayFormula: displayFormula.value,
            dependencies: dependencies.value
        },
        lastNumber: oldValue?.number || 0,
        lastValue: oldValue?.value || 0,
        number: resultNumber.value,
        value: result.value
    }
    
    if(["price","budget"].includes(props?.config?.header?.prop)) {
        newValue.valueNoSymbol = formatCurrency(
            newValue.number,
            currency,
            true,
            false
        );
        newValue.lastValueNoSymbol = formatCurrency(
            newValue.lastNumber,
            currency,
            true,
            false
        );
    }

    emit("saveDropdown", {
        // Tipo de Dropdown
        type: "vars",
        // Propiedad a actualizar
        prop,
        // Nuevos valores
        newValue,
        // Posición de la línea
        posLine: props.config?.posLine || 0,
    });

};
const handleFormulaResult = (resp) => {
  if (resp.success) {
    if(!currency.value) {
        // Para variables de tipo moneda, usar formato de moneda
        result.value = `${resp.value}`;
    } else {
        // Para variables de tipo número, no usar formato de moneda
        const valFormatted = formatCurrency(resp.value, currency.value, true);
        result.value = valFormatted;
    }
    resultNumber.value = resp.value;
  } else {
    result.value = "#ERROR";
    resultNumber.value = 0;
  }
};
const buildFormulaFromDisplay = () => {
  const tokenRegex = /([A-Za-z][A-Za-z0-9]*|\d+(?:\.\d+)?|[+\-*/()^])/g;
  const tokens = displayFormula.value.match(tokenRegex);

  const formulaTokens = tokens.map(token => {
    const variable = incomesStore.variables.find(v => v.abbreviation === token);
    return variable ? variable._id : token;
  });

  return formulaTokens.join('');
};

const tokenizeFormula = () => {
  const tokenRegex = /([A-Za-z_][A-Za-z0-9_]*|\d+(?:\.\d+)?|[+\-*/()^])/g;
  const tokens = displayFormula.value.match(tokenRegex) || [];

  return tokens.map(token => {
    const num = Number(token);
    if (!isNaN(num)) {
      return { type: "number", value: token };
    }

    if (/^[+\-*/()^]$/.test(token)) {
      return { type: "operator", value: token };
    }

    const variable = incomesStore.variables.find(v => v.abbreviation === token);
    if (variable) {
      return { type: "vars", value: token, data: variable };
    }

    return { type: "unknown", value: token }; // por si acaso
  });
}

// Watchers
watch(tokensObj, async () => {
  await nextTick()

  const container = document.querySelector('.vars__formulas')
  if (container) {
    container.scrollTo({
      left: container.scrollWidth,
      behavior: 'smooth'
    })
  }
});

// Eventos
const handleBackspace = (e) => {
  if (e.key !== 'Backspace') return;

  const input = e.target; // acceso directo al <input>
  const pos = input.selectionStart;
  if (pos === 0) return;

  const text = displayFormula.value;
  const before = text.slice(0, pos);
  const after = text.slice(pos);

  // Detectar si justo antes del cursor hay una variable completa
  const match = before.match(/([a-zA-Z_][a-zA-Z0-9_]*)$/);
  if (match) {
    const variable = match[1];
    const newStart = pos - variable.length;

    displayFormula.value = before.slice(0, newStart) + after;

    nextTick(() => {
      input.setSelectionRange(newStart, newStart);
      getFormula(e);
    });

    e.preventDefault();
  }
};

</script>

<template>
    <div class="vars">
        <span class="title" v-if="props.title" v-text="t(module + '.label')"></span>

        <div class="vars__action">
            <div :class="`vars__action-texts ${focus ? 'focus' : ''} ${result === '#ERROR' ? 'error' : ''}`">
                <div class="vars__formulas">
                    <div v-for="(tokenObj,t) in tokensObj" :key="t" :class="tokenObj.type">
                        <span>{{ tokenObj.value }}</span>
                    </div>
                    <div class="caret-wrapper">
                        <span class="caret" v-if="focus"></span>
                    </div>
                </div>
                <input v-model="displayFormula" @input="getFormula($event)" @keydown="handleBackspace($event)" @focus="focus = true" @blur="focus = false" :id="idInput" style="opacity: 0; width: 100%; position: absolute;" />
            </div>
            <u-button-icon icon="save" size="s" :disabled="result === '#ERROR' || resultNumber === 0" @click="save"/>
        </div>
        <span v-if="formula === ''" v-text="t(module + '.text.text2')" class="text"></span>
        <span v-else v-text="'= ' + result" :class="`text ${result === '#ERROR' ? 'error' : ''}`"></span>

        <u-input :placeholder="t(module + '.placeholders.search')" size="s" v-model="search" />
        <div class="vars__list" v-if="varsFiltered.length > 0">
            <button v-for="(_var, v) in varsFiltered" :key="v" :class="{selected: _var.selected}" @click="selectVar(v)">
                <span v-text="_var.abbreviation"></span>
                <span v-text="_var.name" class="truncateText"></span>
                <span v-text="_var.value"></span>
            </button>
        </div>
        <div v-else class="vars-noResults"><span v-text="t(module + '.text.noResults')"></span></div>
    </div>
</template>

<style scoped>
.vars {
    height: 100%;
    display: grid;
    gap: 10px;
    grid-template-rows: v-bind("props.title ? 'auto auto auto auto 1fr' : 'auto auto auto 1fr'");
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

@keyframes blink {
  50% {
    opacity: 0;
  }
}
</style>