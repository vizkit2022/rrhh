<script setup>
import { defineProps } from "vue";
import useIncomesStore from "@/stores/incomes";
import useGlobalStore from "@/stores/global";
import {
  handleAbbreviation,
  onlyNumbers,
  onlyNumbersAndLetters,
} from "@/utils/helpers";
import { useI18n } from "vue-i18n";

// Translations
const { t } = useI18n();
const module = "ui.income.sections.globals";

//Store
const incomesStore = useIncomesStore();
const globalStore = useGlobalStore();

// Props
const props = defineProps({
  disabled: {
    type: Boolean,
    default: false,
  },
  deleteVariableLoading: {
    type: Array,
    default: () => [],
  },
});

// Constants
const units = computed(() =>
  incomesStore.configuration.units.unitsByIncomes.map((u) => ({
    ...u,
    label: u.name,
  })),
);
const separatorDecimal = incomesStore?.income?.currency?.default?.typeFormat === "de-DE" ? "," : ".";
const separatorMiles = incomesStore?.income?.currency?.default?.typeFormat === "de-DE" ? "." : ",";

// Computed
const deleteButtonProperties = computed(() => ({
  class: "btnDelete",
  type: "text",
  icon: "delete",
  size: "xs",
  color: "--danger-text-default",
  colorActive: "--danger-text-darker",
  colorHover: "--danger-text-darker",
}));
const noDataComputed = computed(
  () => incomesStore?.configGlobals?.group?.globalVariables?.length === 0,
);
const editing = computed(() => !incomesStore.configGlobals.edit);
const optionSelectType = computed(() => [
  { label: "Constante", value: "constant" },
  { label: "Variable", value: "variable" },
  { label: "Texto", value: "text" },
]);
const constantsList = computed(() =>
  incomesStore.configGlobals.group.globalVariables.filter(
    (v) => v.type === "constant",
  ),
);

// Functions
const deleteVariable = async (variable, index) => {
  if (variable._id) {
    // Eliminar con back
    try {
      variable.loading = true;
      const variableId = variable._id;

      const resp = await incomesStore.deleteGlobal(variableId);
      if (resp.success)
        incomesStore?.configGlobals?.group?.globalVariables?.splice(index, 1);
    } catch (e) {
      console.error("Error al eliminar contenido por orden:", e);
    } finally {
      variable.loading = false;
    }
  } else {
    incomesStore?.configGlobals?.group?.globalVariables?.splice(index, 1);
  }
};
const changeInput = (variable) => {
  variable.change = true;
  incomesStore.configGlobals.change = true;
};
const selectedType = (item, variable) => {
  incomesStore.configGlobals.change = true;
  variable.change = true;
  variable.type = item.value;
  variable.calculation.displayFormula = "";
  variable.calculation.dependencies = [];
  variable.calculation.formula = "";
  variable.calculation.numberFormula = "";
  variable.value = 0;
};
const selectedUnit = (item, variable) => {
  variable.unit = item._id;
  variable.change = true;
  incomesStore.configGlobals.change = true;
};
const handleCacl = (e, variable) => {
  let target = e.target.value;

  // Convertir a mayúsculas inmediatamente
  target = target.toUpperCase();

  // SI es CONSTANTE
  if (variable.type === "constant") {
    let cleaned = target.replace(/[^0-9,+-]/g, "");

    const sign = cleaned.startsWith("-") ? "-" : cleaned.startsWith("+") ? "+" : "";
    cleaned = sign + cleaned.replace(/[+-]/g, "");

    const parts = cleaned.split(separatorDecimal);
    if (parts.length > 2) {
      cleaned = parts[0] + separatorDecimal + parts.slice(1).join("");
    }

    const [intPart, decPart] = cleaned.split(separatorDecimal);

    const formattedInt = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, separatorMiles);

    const formatted = decPart !== undefined
      ? formattedInt + separatorDecimal + decPart
      : formattedInt;

    const numericValue = parseFloat(
      cleaned.replace(new RegExp(`\\${separatorMiles}`, "g"), "").replace(separatorDecimal, ".")
    ) || 0;

    variable.error = false;
    variable.calculation.displayFormula = formatted;
    variable.value = numericValue;
    variable.calculation.dependencies = [];
    variable.calculation.formula = cleaned;
    variable.calculation.numberFormula = cleaned;
  }
  // SI es TEXTO
  else if (variable.type === "text") {
    const targetValid = onlyNumbersAndLetters(target);
    variable.error = false;
    variable.calculation.displayFormula = targetValid;
    variable.value = targetValid;
    variable.calculation.displayFormula = targetValid;
    variable.calculation.dependencies = [];
    variable.calculation.formula = targetValid;
    variable.calculation.numberFormula = targetValid;
  }
  // SI es VARIABLE
  else {
    try {
      variable.error = false;

      // 1. Limpiar y validar el input
      let cleanInput = target.replace(/[^A-Z0-9+\-*/().,]/g, "");

      // 2. Validar que no haya números seguidos de letras (ej: 2B, 123AA)
      // o letras seguidas de números sin operador dentro de la variable
      const invalidPattern = /\d+[A-Z]|[A-Z]\d+[A-Z]/;

      // Extraer tokens (números, variables, operadores)
      const tokens =
        cleanInput.match(/[A-Z]+\d*|[A-Z]\d+[A-Z\d]*|\d+[.,]?\d*|[+\-*/()]/g) ||
        [];

      // Validar que no haya números seguidos de variables sin operador
      for (let i = 0; i < tokens.length - 1; i++) {
        const current = tokens[i];
        const next = tokens[i + 1];

        const isCurrentNumber = /^\d/.test(current);
        const isNextVariable = /^[A-Z]/.test(next);
        const isCurrentVariable = /^[A-Z]/.test(current);
        const isNextNumber = /^\d/.test(next);

        // Si un número está seguido de una variable, error
        if (isCurrentNumber && isNextVariable) {
          variable.error = true;
          return;
        }

        // Si una variable está seguida de un número, error
        if (isCurrentVariable && isNextNumber) {
          variable.error = true;
          return;
        }
      }

      // 3. Extraer todas las variables (letras que empiezan con letra, pueden contener números)
      const variablePattern = /[A-Z][A-Z0-9]*/g;
      const foundVariables = cleanInput.match(variablePattern) || [];

      // 4. Verificar que no haya variables consecutivas sin operador
      const consecutiveVarsPattern = /[A-Z][A-Z0-9]*[A-Z][A-Z0-9]*/;
      if (
        consecutiveVarsPattern.test(cleanInput.replace(/[+\-*/().,0-9]/g, ""))
      ) {
        const varsWithoutOperators = cleanInput.replace(/[+\-*/().,0-9]/g, "");
        const allVars = varsWithoutOperators.match(variablePattern) || [];
        if (allVars.length > foundVariables.length) {
          variable.error = true;
          return;
        }
      }

      // 5. Crear mapa de variables únicas
      const uniqueVars = [...new Set(foundVariables)];
      const variableMap = new Map();
      const dependencies = [];

      // 6. Buscar cada variable en constantsList y validar
      for (const varName of uniqueVars) {
        const constant = constantsList.value.find(
          (c) => c.abbreviation === varName,
        );

        if (!constant) {
          variable.error = true;
          return;
        }

        variableMap.set(varName, {
          id: constant._id,
          value: constant.value,
        });

        dependencies.push(constant._id);
      }

      // 7. Construir las diferentes versiones de la fórmula
      let displayFormula = cleanInput;
      let idFormula = cleanInput;
      let numberFormula = cleanInput;

      // Reemplazar variables por sus IDs y valores
      const sortedVars = uniqueVars.sort((a, b) => b.length - a.length);

      for (const varName of sortedVars) {
        const varData = variableMap.get(varName);
        const regex = new RegExp("\\b" + varName + "\\b", "g");

        idFormula = idFormula.replace(regex, varData.id);
        numberFormula = numberFormula.replace(regex, varData.value.toString());
      }

      // 8. Formatear números con separadores de miles
      displayFormula = formatNumbersInFormula(displayFormula);

      // 9. Evaluar la fórmula para obtener el resultado
      const decimal = ",";
      const miles = ".";

      let evalFormula = numberFormula.replace(/\./g, "").replace(/,/g, ".");

      let calculatedValue = 0;
      try {
        calculatedValue = Function(
          '"use strict"; return (' + evalFormula + ")",
        )();
      } catch (evalError) {
        variable.error = true;
        return;
      }

      // 10. Actualizar form.calculation
      variable.calculation = {
        dependencies: dependencies,
        displayFormula: displayFormula,
        formula: idFormula,
        numberFormula: numberFormula,
        value: calculatedValue,
      };

      variable.value = calculatedValue;
      variable.calculation.value = calculatedValue;
      variable.error = false;
    } catch (err) {
      variable.error = true;
      console.error("Error procesando fórmula:", err);
    }
  }
};
const formatNumbersInFormula = (formula) => {
  const decimal = ",";
  const miles = ".";

  // Buscar todos los números en la fórmula
  return formula.replace(/\d+([.,]\d+)?/g, (match) => {
    // Si tiene coma o punto, es un decimal
    let num = match.replace(/\./g, "").replace(/,/g, ".");
    let floatNum = parseFloat(num);

    if (isNaN(floatNum)) return match;

    // Separar parte entera y decimal
    let parts = floatNum.toString().split(".");
    let integerPart = parts[0];
    let decimalPart = parts[1] || "";

    // Formatear parte entera con separadores de miles
    integerPart = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, miles);

    // Reconstruir número
    if (decimalPart) {
      return integerPart + decimal + decimalPart;
    }

    return integerPart;
  });
};

const handleArrowNavigation = (e, rowIndex, inputIndex) => {
  const variables = incomesStore?.configGlobals?.group?.globalVariables || [];
  const totalRows = variables.length;
  const totalInputs = 3;

  const inputSelectors = [
    (row) => document.querySelector(`#input-name-${row}`),
    (row) => document.querySelector(`#input-abbr-${row}`),
    (row) => document.querySelector(`#input-calc-${row}`),
  ];

  let targetRow = rowIndex;
  let targetInput = inputIndex;

  if (e.key === "ArrowRight") {
    e.preventDefault();
    if (inputIndex < totalInputs - 1) targetInput = inputIndex + 1;
  } else if (e.key === "ArrowLeft") {
    e.preventDefault();
    if (inputIndex > 0) targetInput = inputIndex - 1;
  } else if (e.key === "ArrowDown") {
    e.preventDefault();
    if (rowIndex < totalRows - 1) targetRow = rowIndex + 1;
  } else if (e.key === "ArrowUp") {
    e.preventDefault();
    if (rowIndex > 0) targetRow = rowIndex - 1;
  } else {
    return;
  }

  const el = inputSelectors[targetInput](targetRow);
  if (el) {
    el.focus();
    el.select();
  }
};
</script>

<template>
  <div class="content" id="myTableVariable">
    <table class="table">
      <colgroup>
        <col style="width: 5%" />
        <col style="width: 17.5%" />
        <col style="width: 10%" />
        <col style="width: 15%" />
        <col style="width: 18.5%" />
        <col style="width: 10%" />
        <col style="width: 15%" />
        <col style="width: 9%" />
      </colgroup>

      <thead class="table__header">
        <tr>
          <th>
            <div class="table__header-col right"><span></span></div>
          </th>
          <th>
            <div class="table__header-col">
              <span>{{ t(`${module}.table.header.cols.col1.label`) }}</span>
            </div>
          </th>
          <th>
            <div class="table__header-col">
              <span>{{ t(`${module}.table.header.cols.col2.label`) }}</span>
            </div>
          </th>
          <th>
            <div class="table__header-col">
              <span>{{ t(`${module}.table.header.cols.col3.label`) }}</span>
            </div>
          </th>
          <th>
            <div class="table__header-col">
              <span>{{ t(`${module}.table.header.cols.col4.label`) }}</span>
            </div>
          </th>
          <th>
            <div class="table__header-col right">
              <span>{{ t(`${module}.table.header.cols.col5.label`) }}</span>
            </div>
          </th>
          <th>
            <div class="table__header-col">
              <span>{{ t(`${module}.table.header.cols.col6.label`) }}</span>
            </div>
          </th>
          <th>
            <div class="table__header-col right">
              <span>{{ t(`${module}.table.header.cols.col7.label`) }}</span>
            </div>
          </th>
        </tr>
      </thead>
      <tbody class="table__body">
        <tr class="noData" v-if="props.disabled || noDataComputed">
          <td colspan="8">
            <div class="noData-content">
              <IncomesContainerConfigurationVariablesGlobalsLoading
                v-if="props.disabled"
              />
              <span v-else>{{ t(`${module}.table.body.noData`) }}</span>
            </div>
          </td>
        </tr>
        <template v-else>
          <tr
            v-for="(variable, v) in incomesStore?.configGlobals?.group
              ?.globalVariables || []"
            :key="variable._id"
            :class="variable.loading ? 'rowDisabled' : ''"
          >
            <td>
              <div class="table__body-col">
                <u-loading v-if="variable.loading" :width="16" />
                <u-button-icon
                  v-else
                  v-bind="deleteButtonProperties"
                  :disabled="props.disabled || !editing"
                  @click="deleteVariable(variable, v)"
                  :title="editing ? 'Eliminar Variable' : 'En edición no se puede Eliminar'"
                />
              </div>
            </td>
            <td>
              <div class="table__body-col">
                 <input
                  class="myInputGlobal"
                  v-model="variable.name"
                  type="text"
                  :disabled="props.disabled || variable.loading || editing"
                  :id="`input-name-${v}`"
                  @change="changeInput(variable)"
                  @keydown="handleArrowNavigation($event, v, 0)"
                />
              </div>
            </td>
            <td>
              <div class="table__body-col">
                <input
                  class="myInputGlobal"
                  v-model="variable.abbreviation"
                  type="text"
                  :disabled="props.disabled || variable.loading || editing"
                  :id="`input-abbr-${v}`"
                  @change="changeInput(variable)"
                  @input="handleAbbreviation($event)"
                  maxlength="5"
                  @keydown="handleArrowNavigation($event, v, 1)"
                />
              </div>
            </td>
            <td>
              <div class="table__body-col">
                <span
                  v-if="props.disabled || variable.loading || editing"
                  class="textDefault"
                  >{{ variable.typeName }}</span
                >
                <u-select
                  v-else
                  class="selectCol"
                  v-model="variable.typeName"
                  :options="optionSelectType"
                  :full-data="true"
                  @full-data="(data) => selectedType(data, variable)"
                  :disabled="props.disabled || variable.loading || editing"
                  parent="myTableVariable"
                />
              </div>
            </td>
            <td>
              <div class="table__body-col">
                <span
                  v-if="props.disabled || variable.loading || editing"
                  class="textDefault truncateText"
                >
                  {{ variable.calculation.displayFormula }}
                </span>
                <input
                  v-else
                  :class="`myInputGlobal ${variable.error ? 'error' : ''}`"
                  v-model="variable.calculation.displayFormula"
                  type="text"
                  :disabled="props.disabled || variable.loading || editing"
                  :id="`input-calc-${v}`"
                  @change="changeInput(variable)"
                  @input="handleCacl($event, variable)"
                  @keydown="handleArrowNavigation($event, v, 2)"
                />
              </div>
            </td>
            <td>
              <div class="table__body-col right">
                <span
                  class="truncateText"
                  :class="
                    props.disabled || variable.loading || editing
                      ? 'textDefault'
                      : ''
                  "
                  >{{ variable.type === 'text' ? variable.calculation.displayFormula : variable.value }}</span
                >
              </div>
            </td>
            <td>
              <div class="table__body-col">
                <span
                  v-if="props.disabled || variable.loading || editing"
                  class="textDefault truncateText"
                  >{{ variable.unitName }}</span
                >
                <u-select
                  v-else
                  class="selectCol"
                  v-model="variable.unitName"
                  :options="units"
                  :full-data="true"
                  @full-data="(item) => selectedUnit(item, variable)"
                  :disabled="props.disabled || variable.loading || editing"
                  parent="myTableVariable"
                />
              </div>
            </td>
            <td>
              <div class="table__body-col right">
                <span
                  :class="
                    props.disabled || variable.loading || editing
                      ? 'textDefault'
                      : ''
                  "
                  >{{ variable.used }}</span
                >
              </div>
            </td>
          </tr>
        </template>
      </tbody>
      <tfoot class="table__tfoot">
        <tr class="processes">
          <td colspan="8">
            <div class="processes-content">
              <!-- DELETE LOADING-->
              <i18n-t
                v-if="props.deleteVariableLoading.length !== 0"
                :keypath="module + '.table.footer.labels.delete'"
                tag="span"
              >
                <strong>
                  {{ props.deleteVariableLoading.length }}
                  {{
                    t(
                      module + ".table.footer.labels.globals",
                      props.deleteVariableLoading.length,
                    )
                  }}
                </strong>
              </i18n-t>

              <!-- TOTAL -->
              <i18n-t
                v-else
                :keypath="module + '.table.footer.labels.total'"
                tag="span"
              >
                <strong>
                  {{
                    incomesStore?.configGlobals?.group?.globalVariables
                      ?.length || 0
                  }}
                </strong>
              </i18n-t>

              <div v-if="!editing" class="msgAlertDelete">
                <span class="u u-info"></span>
                <span>En Modo Edición Mulitple no es posible eliminar variables</span>
              </div>
            </div>
          </td>
        </tr>
      </tfoot>
    </table>
  </div>
</template>

<style scoped>
.content {
  overflow: auto;
  padding-right: 1px;
}

.content::-webkit-scrollbar {
  width: 10px;
  height: 0px;
}

.content::-webkit-scrollbar-thumb {
  border-radius: 5px;
  background-color: var(--neutral-border-subtle);
}

.content::-webkit-scrollbar-track {
  background-color: var(--neutral-border-darker);
  border-radius: 5px;
}

.table {
  position: relative;
  width: 100%;
  min-width: 900px;
  table-layout: fixed;
  border-collapse: collapse;
  border-spacing: 0;
}

.table__header {
  position: sticky;
  top: 0;
  left: 0;
  z-index: 2;
  background-color: var(--neutral-background-light);
}

.table__header th {
  padding: 0;
  line-height: normal;
}

.table__header th .table__header-col {
  height: 36px;
  padding: 0 12px;
  background-color: var(--neutral-background-darker);
  display: flex;
  align-items: center;
  border-top: 1px solid var(--neutral-border-subtle);
  border-bottom: 1px solid var(--neutral-border-subtle);
}

.table__header-col.right {
  justify-content: flex-end;
}

.table__header th:first-child .table__header-col {
  border-left: 1px solid var(--neutral-border-subtle);
  border-top-left-radius: 8px;
}

.table__header th:last-child .table__header-col {
  border-right: 1px solid var(--neutral-border-subtle);
  border-top-right-radius: 8px;
}

.table__header-col span {
  font-size: 12px;
  line-height: 12px;
  font-weight: 400;
  color: var(--neutral-text-caption);
  font-weight: 500;
}

/* Body */
.table__body td {
  padding: 0;
  line-height: normal;
}

.table__body tr .table__body-col {
  height: 40px;
  padding: 0 12px;
  background-color: var(--neutral-background-light);
  display: flex;
  align-items: center;
  border-bottom: 1px solid var(--neutral-border-subtle);
  transition: 0.3s;
}

.table__body-col.right {
  justify-content: flex-end;
}
.table__body-col.center {
  justify-content: center;
}

.table__body tr:hover .table__body-col {
  background-color: var(--primary-surface-shadow-12a);
}

.table__body tr td:first-child .table__body-col {
  border-left: 1px solid var(--neutral-border-subtle);
}

.table__body tr td:last-child .table__body-col {
  border-right: 1px solid var(--neutral-border-subtle);
}
.table__body tr:last-child td .table__body-col {
  border-bottom: none;
}
.btnDelete::v-deep(.u) {
  font-size: 16px !important;
}

.table__body-col span {
  font-size: 12px;
  line-height: 12px;
  font-weight: 400;
  color: var(--neutral-text-body);
}
.rowDisabled .table__body-col span {
  color: var(--neutral-text-disabled);
}
.table__body tr.noData td {
  padding: 0;
}

.noData-content {
  width: 100%;
  height: 300px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-right: 1px solid var(--neutral-border-subtle);
  border-left: 1px solid var(--neutral-border-subtle);
}

.noData-content span {
  color: var(--neutral-text-caption);
  font-size: 14px;
  line-height: 14px;
  font-weight: 500;
}

/* Footer */
.table__tfoot {
  z-index: 2;
  bottom: 0px;
  left: 0px;
  position: sticky;
  background-color: var(--neutral-background-light);
}
.table__tfoot tr.processes td {
  padding: 0;
}
.table__tfoot tr.processes td div {
  border: 1px solid var(--neutral-border-subtle);
  border-radius: 0 0 8px 8px;
}
.processes-content {
  width: 100%;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 0 12px;
  background-color: var(--neutral-background-darker);
}

.processes-content span {
  color: var(--neutral-text-caption);
  font-size: 12px;
  line-height: 12px;
  font-weight: 500;
}

.msgAlertDelete {
  border: none !important;
  display: flex;
  align-items: center;
  gap: 8px;
}

.processes-content span strong,
.msgAlertDelete span {
  color: var(--neutral-text-body) !important;
}

/* Base */
.myInputGlobal {
  height: 24px;
  border-radius: 6px;
  transition: 0.3s;
  border: 1px solid transparent;
  color: var(--neutral-text-body);
  width: 100%;
  font-size: 12px;
  line-height: 12px;
  border: 1px solid v-bind("editing ? 'transparent' : 'var(--neutral-border-default)'");
  padding: v-bind("editing ? '0px 0px' : '0 12px'");
}
.myInputGlobal:disabled {
  color: var(--neutral-text-caption);
  cursor: not-allowed;
}
.myInputGlobal:not(:disabled):not(.error):hover {
  padding: 0 12px;
  border: 1px solid var(--primary-border-subtle);
}
.myInputGlobal.error {
  border: 1px solid var(--danger-border-subtle);
}
.myInputGlobal:not(.error):focus {
  padding: 0 12px;
  border: 1px solid var(--primary-border-subtle);
  box-shadow: inset 0px 0px 0px 1px rgba(58, 199, 165, 1);
  background-color: var(--neutral-background-light);
}
.myInputGlobal.error:focus {
  padding: 0 12px;
}
.myInputGlobal.error:not(:disabled):hover {
  padding: 0 12px;
  border: 1px solid var(--danger-border-subtle);
}
.myInputGlobal.error:focus {
  padding: 0 12px;
  border: 1px solid var(--danger-border-subtle);
  box-shadow: inset 0px 0px 0px 1px rgba(244, 121, 117, 1);
  background-color: var(--neutral-background-light);
}
/* Custom */
input::selection {
  background-color: var(--primary-text-subtle);
  color: var(--neutral-background-default);
}
.selectCol::v-deep(.containerSelectInput.m) {
  height: 24px !important;
  border-radius: 8px !important;
  padding: 0px 12px 0px 10px !important;
}
.selectCol::v-deep(.containerSelectInput span) {
  font-size: 12px !important;
}
.selectCol::v-deep(.opSelected) {
  padding: 0 10px;
}
.selectCol::v-deep(.containerOptionsList button .text span) {
  font-size: 12px;
  line-height: 12px;
  text-align: center;
}
.textDefault {
  color: var(--neutral-text-caption) !important;
}
</style>
