<script setup>
import { computed, defineEmits, ref } from "vue";
import useIncomeStore from "@/stores/incomes";
import useGlobalStore from "@/stores/global";
import { handleAbbreviation } from "@/utils/helpers";
import { useI18n } from "vue-i18n";

// Translations
const { t } = useI18n();
const module = "ui.income.sections.globals";

// Stores
const incomesStore = useIncomeStore();
const globalStore = useGlobalStore();

// Emits
const emit = defineEmits(["closeModal", "updatingGlobals"]);

// Constants
const idIncome = incomesStore.income?._id;
const colors = {
  color: "--neutral-text-caption",
};
const separatorDecimal = incomesStore?.income?.currency?.default?.typeFormat === "de-DE" ? "," : ".";
const separatorMiles = incomesStore?.income?.currency?.default?.typeFormat === "de-DE" ? "." : ",";

// Variables
const units = ref(incomesStore.configuration.units.unitsByIncomes.map((u) => ({
  ...u,
  label: u.name,
})));
const formula = ref("");
const error = ref(false);
const form = ref({
  name: "",
  abbreviation: "",
  type: "constant",
  typeName: "Constante",
  value: 0,
  unit: null,
  unitName: "",
  income: idIncome,
  groupVariable: incomesStore.configGlobals.group._id,
  calculation: {
    dependencies: [],
    displayFormula: "",
    formula: "",
    numberFormula: "",
  },
});

// Estado para el sub-formulario de nueva unidad
const showNewUnit = ref(false);
const newUnitForm = ref({
  name: "",
  plural: "",
  color: "#20a789",
});

// Computed
const validForm = computed(() => {
  if (form.value.name.trim() === "") return false;
  if (form.value.abbreviation.trim() === "") return false;
  if (form.value.unit === null) return false;
  if (formula.value.trim() === "") return false;
  if (error.value) return false;
  return true;
});
const validNewUnitForm = computed(() => {
  if (newUnitForm.value.name.trim() === "") return false;
  if (newUnitForm.value.plural.trim() === "") return false;
  if (newUnitForm.value.color.trim() === "") return false;
  return true;
});
const btnCloseProperties = computed(() => ({
  ...colors,
  icon: "close",
  size: "s",
  type: "outlined",
}));
const btnCancelProperties = computed(() => ({
  ...colors,
  text: t(`${module}.buttons.cancel`),
  size: "m",
  type: "outlined",
}));
const btnSaveProperties = computed(() => ({
  text: t(`${module}.buttons.create`),
  size: "m",
  disabled: !validForm.value,
}));
const btnSaveUnitProperties = computed(() => ({
  text: t(`${module}.buttons.create`),
  size: "m",
  disabled: !validNewUnitForm.value,
}));
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
const save = async () => {
  try {
    globalStore.loading = true;
    let body = JSON.parse(JSON.stringify(form.value));

    body.value = Number(body.value);
    delete body.unitName;
    delete body.typeName;

    if(form.value.type === 'text') delete body.calculation.numberFormula;

    const resp = await incomesStore.createGlobal(body);
    incomesStore.configGlobals.group.globalVariables.unshift({
      ...resp,
      typeName: getType(resp?.type),
      unitName: resp?.unit?.name || "Sin Unidad",
    });
  } catch (error) {
    console.error(error);
  } finally {
    emit("closeModal");
    globalStore.loading = false;
  }
};
const selectedType = (item) => {
  error.value = false;
  form.value.type = item.value;
  formula.value = "";
  form.value.calculation.displayFormula = "";
  form.value.calculation.dependencies = [];
  form.value.calculation.formula = "";
  form.value.calculation.numberFormula = "";
  form.value.value = 0;
};
const getType = (type) => {
  const types = {
    constant: { es: "Constante", en: "Constant" },
    variable: { es: "Variable", en: "Variable" },
    text: { es: "Texto", en: "Text" },
  };
  return (
    types?.[type]?.[globalStore.lang] || types.constant[[globalStore.lang]]
  );
};
const openNewUnit = () => {
  newUnitForm.value = { name: "", plural: "", color: "#20a789" };
  showNewUnit.value = true;
};
const cancelNewUnit = () => {
  showNewUnit.value = false;
};
const saveNewUnit = async () => {
  try {
    globalStore.loading = true;
    const body = {
      colorLabel: newUnitForm.value.color,
      income: idIncome,
      name: newUnitForm.value.name,
      plural: newUnitForm.value.plural
    };
    const resp = await incomesStore.createUnit(body);
    units.value.unshift({ ...resp, label: resp.name });
    incomesStore.configuration.units.unitsByIncomes.push({ ...resp, label: resp.name });
    showNewUnit.value = false;
  } catch (error) {
    console.error(error);
  } finally {
    globalStore.loading = false;
    newUnitForm.value = {
      name: "",
      plural: "",
      color: "#20a789",
    };
  }
};

const appendVariable = (variable) => {
  if (form.value.type !== 'variable') return;

  const abbr = variable.abbreviation;
  let current = formula.value;

  // Si hay contenido y el último char no es operador ni '(', agregar '*'
  if (current.length > 0) {
    const lastChar = current[current.length - 1];
    const isOperator = /[+\-*/(]/.test(lastChar);
    if (!isOperator) {
      current = current + '*';
    }
  }

  const newValue = current + abbr;

  // Reutiliza toda la lógica existente de handleCacl
  handleCacl({ target: { value: newValue } });
};

const handleCacl = (e) => {
  let target = e.target.value;

  // Convertir a mayúsculas inmediatamente
  target = target.toUpperCase();

  // Actualizar el v-model para que se vea en mayúsculas en el input
  formula.value = target;

  // SI es CONSTANTE
  if (form.value.type === "constant") {
    let cleaned = target.replace(/[^0-9,+-]/g, "");

    const sign = cleaned.startsWith("-") ? "-" : cleaned.startsWith("+") ? "+" : "";
    cleaned = sign + cleaned.replace(/[+-]/g, "");

    const parts = cleaned.split(separatorDecimal);
    if (parts.length > 2) {
      cleaned = parts[0] + separatorDecimal + parts.slice(1).join("");
    }

    const [intPart, decPart] = cleaned.split(separatorDecimal);

    const formattedInt = (intPart || "").replace(/\B(?=(\d{3})+(?!\d))/g, separatorMiles);

    const formatted = decPart !== undefined
      ? formattedInt + separatorDecimal + decPart
      : formattedInt;

    const numericValue = parseFloat(
      cleaned.replace(new RegExp(`\\${separatorMiles}`, "g"), "").replace(separatorDecimal, ".")
    ) || 0;

    formula.value = formatted;
    error.value = false;
    form.value.calculation.displayFormula = formatted;
    form.value.value = numericValue;
    form.value.calculation.dependencies = [];
    form.value.calculation.formula = cleaned;
    form.value.calculation.numberFormula = cleaned;
  }
  // SI es TEXTO
  else if (form.value.type === "text") {
    // No permitir espacio al inicio
    let cleanValue = e.target.value.replace(/^\s+/, "");

    // Solo letras, números y espacios
    cleanValue = cleanValue.replace(/[^a-zA-Z0-9 ]/g, "");

    // No permitir más de un espacio consecutivo
    cleanValue = cleanValue.replace(/\s{2,}/g, " ");

    // Máximo 5 caracteres
    cleanValue = cleanValue.slice(0, 5);

    // Capitalización inteligente:
    const lettersOnly = cleanValue.replace(/[^a-zA-Z]/g, "");
    const isAllUpper =
      lettersOnly.length > 0 && lettersOnly === lettersOnly.toUpperCase();

    if (!isAllUpper) {
      cleanValue =
        cleanValue.charAt(0).toUpperCase() + cleanValue.slice(1).toLowerCase();
    }

    formula.value = cleanValue;

    form.value.calculation.displayFormula = cleanValue;
    form.value.calculation.formula = cleanValue;
    form.value.calculation.dependencies = [];
    form.value.value = 0;
  }
  // SI es VARIABLE
  else {
    try {
      error.value = false;

      // 1. Limpiar y validar el input
      let cleanInput = target.replace(/[^A-Z0-9+\-*/().,]/g, "");

      // Actualizar formula con el input limpio
      formula.value = cleanInput;

      if (formula.value === "") {
        form.value.calculation = {
          dependencies: [],
          displayFormula: "",
          formula: "",
          numberFormula: "0",
          value: 0,
        };
        form.value.value = 0;
        return;
      }

      // 2. Extraer tokens (números, variables, operadores)
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

        if (isCurrentNumber && isNextVariable) {
          error.value = true;
          return;
        }

        if (isCurrentVariable && isNextNumber) {
          error.value = true;
          return;
        }
      }

      // 3. Extraer todas las variables
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
          error.value = true;
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
          error.value = true;
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

      const sortedVars = uniqueVars.sort((a, b) => b.length - a.length);

      for (const varName of sortedVars) {
        const varData = variableMap.get(varName);
        const regex = new RegExp("\\b" + varName + "\\b", "g");

        idFormula = idFormula.replace(regex, varData.id);
        numberFormula = numberFormula.replace(regex, varData.value.toString());
      }

      // 8. Formatear números con separadores de miles
      displayFormula = formatNumbersInFormula(displayFormula);
      formula.value = displayFormula;

      // 9. Evaluar la fórmula
      let evalFormula = numberFormula.replace(/\./g, "").replace(/,/g, ".");

      let calculatedValue = 0;
      try {
        calculatedValue = Function(
          '"use strict"; return (' + evalFormula + ")",
        )();
      } catch (evalError) {
        error.value = true;
        return;
      }

      if (!isFinite(calculatedValue) || isNaN(calculatedValue)) {
        error.value = true;
        return;
      }

      // 10. Actualizar form.calculation
      form.value.calculation = {
        dependencies: dependencies,
        displayFormula: displayFormula,
        formula: idFormula,
        numberFormula: numberFormula,
        value: calculatedValue,
      };

      form.value.value = calculatedValue;
    } catch (err) {
      error.value = true;
      console.error("Error procesando fórmula:", err);
    }
  }
};

// Función auxiliar para formatear números con separadores de miles
const formatNumbersInFormula = (formula) => {
  const decimal = ",";
  const miles = ".";

  return formula.replace(/\d+([.,]\d+)?/g, (match) => {
    let num = match.replace(/\./g, "").replace(/,/g, ".");
    let floatNum = parseFloat(num);

    if (isNaN(floatNum)) return match;

    let parts = floatNum.toString().split(".");
    let integerPart = parts[0];
    let decimalPart = parts[1] || "";

    integerPart = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, miles);

    if (decimalPart) {
      return integerPart + decimal + decimalPart;
    }

    return integerPart;
  });
};
</script>

<template>
  <div class="create">
    <!-- ===== VISTA: NUEVA UNIDAD ===== -->
    <template v-if="showNewUnit">
      <div class="create__header">
        <span>Nueva Unidad</span>
        <u-button-icon v-bind="btnCloseProperties" @click="cancelNewUnit" />
      </div>

      <div class="create__form create__form-unit">
        <div class="create__form-group">
          <span>Nombre</span>
          <u-input
            v-model="newUnitForm.name"
            :autoFocus="true"
            placeholder="Nombre de la unidad"
          />
        </div>
        <div class="create__form-group">
          <span>Plural</span>
          <u-input
            v-model="newUnitForm.plural"
            placeholder="Nombre en plural de la unidad"
          />
        </div>
        <div class="create__form-group">
          <span>Color de etiqueta</span>
          <u-colorpicker-v2 v-model="newUnitForm.color" width="56px" />
        </div>
      </div>

      <div class="create__footer">
        <u-button v-bind="btnCancelProperties" @click="cancelNewUnit" />
        <u-button v-bind="btnSaveUnitProperties" @click="saveNewUnit" />
      </div>
    </template>

    <!-- ===== VISTA: FORMULARIO PRINCIPAL ===== -->
    <template v-else>
      <div class="create__header">
        <span>{{ t(`${module}.modals.addGlobal.title`) }}</span>
        <u-button-icon
          v-bind="btnCloseProperties"
          @click="emit('closeModal')"
        />
      </div>

      <div class="create__form">
        <div class="create__form-groupDouble1">
          <div class="create__form-group">
            <span>{{
              t(`${module}.modals.addGlobal.inputs.group.label`)
            }}</span>
            <u-input
              v-model="incomesStore.configGlobals.group.name"
              :disabled="true"
            />
          </div>
          <div class="create__form-group">
            <span>{{ t(`${module}.modals.addGlobal.inputs.name.label`) }}</span>
            <u-input v-model="form.name" :autoFocus="true" />
          </div>
        </div>
        <div class="create__form-groupDouble1">
          <div class="create__form-group">
            <span>{{ t(`${module}.modals.addGlobal.inputs.abbr.label`) }}</span>
            <u-input
              v-model="form.abbreviation"
              @input="handleAbbreviation($event)"
              maxlength="5"
            />
          </div>
          <div class="create__form-group">
            <span>{{ t(`${module}.modals.addGlobal.inputs.type.label`) }}</span>
            <u-select
              v-model="form.typeName"
              :options="optionSelectType"
              :full-data="true"
              @full-data="selectedType"
            />
          </div>
        </div>
        <div class="create__form-group">
          <span>{{ t(`${module}.modals.addGlobal.inputs.calc.label`) }}</span>
          <u-input v-model="formula" @input="handleCacl" />
        </div>
        <div class="create__form-groupDouble1">
          <div class="create__form-group">
            <span>{{ t(`${module}.modals.addGlobal.inputs.unit.label`) }}</span>
            <div class="create__form-groupDouble2">
              <u-select
                v-model="form.unitName"
                :placeholder="
                  t(`${module}.modals.addGlobal.inputs.unit.placeholder`)
                "
                :options="units"
                :full-data="true"
                @full-data="(item) => (form.unit = item._id)"
              />
              <u-button
                icon="new"
                text="Unidad"
                type="outlined"
                @click="openNewUnit"
              />
            </div>
          </div>
          <div class="create__form-group" v-if="form.type === 'variable'">
            <span>{{
              t(`${module}.modals.addGlobal.inputs.value.label`)
            }}</span>
            <u-input
              :value="error ? 'ERROR' : form.value"
              readonly
              :error="error"
            />
          </div>
        </div>
        <div class="create__form-group">
          <span>{{ t(`${module}.modals.addGlobal.table.label`) }}</span>
          <div class="list">
            <table class="variables">
              <colgroup>
                <col style="width: 35%" />
                <col style="width: 28%" />
                <col style="width: 19.5%" />
                <col style="width: 17.5%" />
              </colgroup>
              <thead class="variables__header">
                <tr>
                  <th>
                    <div class="variables__header-col">
                      <span>{{
                        t(`${module}.modals.addGlobal.table.cols.col1.label`)
                      }}</span>
                    </div>
                  </th>
                  <th>
                    <div class="variables__header-col">
                      <span>{{
                        t(`${module}.modals.addGlobal.table.cols.col2.label`)
                      }}</span>
                    </div>
                  </th>
                  <th>
                    <div class="variables__header-col right">
                      <span>{{
                        t(`${module}.modals.addGlobal.table.cols.col3.label`)
                      }}</span>
                    </div>
                  </th>
                  <th>
                    <div class="variables__header-col center">
                      <span>{{
                        t(`${module}.modals.addGlobal.table.cols.col4.label`)
                      }}</span>
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody class="variables__body">
                <tr v-for="variable in constantsList">
                  <td>
                    <div class="variables__body-colName">
                      <span class="truncateText">
                        {{ variable.name }}
                        <strong>({{ variable.abbreviation }})</strong>
                      </span>
                      <u-button-icon
                        v-if="form.type === 'variable'"
                        icon="click"
                        size="xs"
                        type="text"
                        @click="appendVariable(variable)"
                      />
                    </div>
                  </td>
                  <td>
                    <div class="variables__body-col"><span>Cálculo</span></div>
                  </td>
                  <td>
                    <div class="variables__body-col right">
                      <span>{{ variable.value }}</span>
                    </div>
                  </td>
                  <td>
                    <div class="variables__body-col center">
                      <span>{{ variable?.unit?.name || "-" }}</span>
                    </div>
                  </td>
                </tr>
                <tr class="noData" v-if="constantsList.length === 0">
                  <td colspan="4">
                    <div><span>Sin variables registradas</span></div>
                  </td>
                </tr>
              </tbody>
              <tfoot class="variables__tfoot">
                <tr>
                  <td colspan="4"></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>

      <div class="create__footer">
        <u-button v-bind="btnCancelProperties" @click="emit('closeModal')" />
        <u-button v-bind="btnSaveProperties" @click="save" />
      </div>
    </template>
  </div>
</template>

<style scoped>
.create {
  width: 700px;
  height: auto;
  display: grid;
  grid-template-rows: 32px 1fr 36px;
  row-gap: 16px;
  transition: 0.3s;
}

.create span {
  color: var(--neutral-text-body);
}

.create__header,
.create__subheader,
.create__footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
}

.create__subheader {
  width: 400px;
}

.create__header span {
  font-weight: 600;
  font-size: 18px;
  line-height: 18px;
  letter-spacing: 0%;
  vertical-align: middle;
}

.create__subheader span {
  font-size: 16px;
  line-height: 16px;
  letter-spacing: 0%;
}

.create__subheader span strong {
  font-weight: 700;
}

.create__form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.create__form-unit {
  height: 250px;
}

.create__form-groupDouble1,
.create__form-groupDouble2 {
  display: grid;
  column-gap: 10px;
}

.create__form-groupDouble1 {
  grid-template-columns: 1fr 1fr;
}

.create__form-groupDouble2 {
  grid-template-columns: 1fr auto;
}

.create__form-group {
  display: grid;
  grid-template-rows: 16px auto;
  row-gap: 4px;
}

.create__form-group span {
  font-size: 14px;
  line-height: 14px;
}

.list {
  height: calc(65vh - 405px);
  overflow: auto;
  padding-right: 1px;
}

.list::-webkit-scrollbar {
  width: 10px;
  height: 0px;
}

.list::-webkit-scrollbar-thumb {
  border-radius: 5px;
  background-color: var(--neutral-border-subtle);
}

.list::-webkit-scrollbar-track {
  background-color: var(--neutral-border-darker);
  border-radius: 5px;
}

.variables {
  position: relative;
  width: 100%;
  table-layout: fixed;
  border-collapse: collapse;
  border-spacing: 0;
}

.variables__header {
  position: sticky;
  top: 0;
  left: 0;
  z-index: 2;
  background-color: var(--neutral-background-light);
}

.variables__header th {
  padding: 0;
  line-height: normal;
}

.variables__header th .variables__header-col {
  height: 32px;
  padding: 0 12px;
  background-color: var(--neutral-background-darker);
  display: flex;
  align-items: center;
  border-top: 1px solid var(--neutral-border-subtle);
  border-bottom: 1px solid var(--neutral-border-subtle);
}

.variables__header-col.right {
  justify-content: flex-end;
}

.variables__header-col.center {
  justify-content: center;
}

.variables__header th:first-child .variables__header-col {
  border-left: 1px solid var(--neutral-border-subtle);
  border-top-left-radius: 8px;
}

.variables__header th:last-child .variables__header-col {
  border-right: 1px solid var(--neutral-border-subtle);
  border-top-right-radius: 8px;
}

.variables__header span {
  font-size: 12px;
  line-height: 12px;
  font-weight: 600;
}

.variables__body td {
  padding: 0;
  line-height: normal;
}

.variables__body tr .variables__body-col {
  height: 32px;
  padding: 0 12px;
  background-color: var(--neutral-background-light);
  display: flex;
  align-items: center;
  border-bottom: 1px solid var(--neutral-border-subtle);
  transition: 0.3s;
}

.variables__body tr .variables__body-colName {
  height: 32px;
  padding: 0 12px;
  display: grid;
  grid-template-columns: v-bind("form.type === 'variable' ? '1fr 24px' : '1fr'");
  column-gap: 10px;
  align-items: center;
  border-left: 1px solid var(--neutral-border-subtle);
  transition: 0.3s;
}

.variables__body tr:not(:last-child) .variables__body-colName {
  border-bottom: 1px solid var(--neutral-border-subtle);
}

.variables__body-col.right {
  justify-content: flex-end;
}

.variables__body-col.center {
  justify-content: center;
}

.variables__body tr:hover .variables__body-colName,
.variables__body tr:hover .variables__body-col {
  background-color: var(--primary-surface-shadow-12a);
}

.noData td div {
  border-left: 1px solid var(--neutral-border-subtle);
  border-right: 1px solid var(--neutral-border-subtle);
  height: 40px;
  display: flex;
  justify-content: center;
  align-items: center;
}

.noData td div span {
  color: var(--neutral-text-caption);
}

.variables__body tr td:first-child .variables__body-col {
  border-left: 1px solid var(--neutral-border-subtle);
}

.variables__body tr td:last-child .variables__body-col {
  border-right: 1px solid var(--neutral-border-subtle);
}

.variables__body tr:last-child td .variables__body-col {
  border-bottom: none;
}

.variables__body-col span {
  font-size: 12px;
  line-height: 12px;
  font-weight: 400;
  color: var(--neutral-text-body);
}

.variables__tfoot {
  z-index: 2;
  bottom: 0px;
  left: 0px;
  position: sticky;
  height: 1px;
  background-color: var(--neutral-border-subtle);
}

.variables__tfoot tr td {
  padding: 0;
}

.variables__tfoot tr td div {
  border: 1px solid var(--neutral-border-subtle);
  border-radius: 0 0 8px 8px;
}

.create__header::v-deep(.btn) {
  border-radius: 50%;
}

.create__footer::v-deep(.btn) {
  min-width: 150px;
}

@media only screen and (max-width: 768px) {
  .create {
    width: calc(100vw - 40px);
    height: 100vh;
    max-height: calc(100vh - 40px);
  }

  .create__form {
    gap: 24px;
  }

  .list {
    height: calc(100vh - 475px);
  }
}
</style>
