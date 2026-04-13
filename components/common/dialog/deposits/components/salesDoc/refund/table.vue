<script setup>
import { computed, onBeforeMount, onMounted, onUnmounted, ref } from "vue";
import usePaymentsStore from "@/stores/payments";
import useGlobalStore from "@/stores/global";
import useOrganizationStore from "@/stores/organization";
import { capitalizeName, debounce } from "@/utils/helpers";
import { formatMaskNumber } from "@/utils/formatNumbers";
import {
  formatCurrency,
  getValueFormaRealTime,
  convertToNumber,
} from "@/utils/formatAmount";
import { useI18n } from "vue-i18n";

// Stores
const paymentsStore = usePaymentsStore();
const globalStore = useGlobalStore();
const organizationStore = useOrganizationStore();

//Emits
const emit = defineEmits(["closeModal"]);

// Constants
const color = "--neutral-text-caption";
const { t } = useI18n();
const module = "modules.sales.modals.refund.step1";
const symbol = ","; // Símbolo decimal
const change = ref(false);

// Mounted
onBeforeMount(() => {
  if (!paymentsStore.formDeposits.initializedTable) {
    paymentsStore.formDeposits.supplier =
      paymentsStore?.formDeposits?.lines?.[0]?.client;
    paymentsStore?.formDeposits?.lines?.forEach((l) => {
      l.numbers.percentage = "0";
      const initialCharged = 0;

      // Guardando valores iniciales para el recalculo de moneda nueva a base
      l.numbers.chargedBase = l.numbers.charged.number;
      l.numbers.totalBase = l.numbers.total.number;

      l.numbers.amountDeposit = formatData(
        initialCharged,
        defaultCurrency.value,
      );
    });
    paymentsStore.formDeposits.initializedTable = true;
  }
});

onMounted(() => {
  document.addEventListener("keydown", handleEscClose);
});

onUnmounted(() => {
  document.removeEventListener("keydown", handleEscClose);
});

// Computed
const defaultCurrency = computed(() => {
  const currency =
    typeof paymentsStore.formDeposits.currency === "string"
      ? organizationStore.organization.currency
      : paymentsStore.formDeposits.currency;
  return currency || {};
});

const baseCurrency = computed(() => paymentsStore.formDeposits.currencyInitial);

const invalidNumbers = computed(() => {
  const sePaso = paymentsStore.formDeposits.lines.some(
    (line) => line.numbers.amountDeposit.number > line.numbers.charged.number,
  );
  if (sePaso) return true;
  return paymentsStore.formDeposits.lines.some(
    (line) => line.numbers.amountDeposit.number === 0,
  );
});

const totalDeposits = computed(() => {
  const total = paymentsStore.formDeposits.lines.reduce((sum, item) => {
    const toDeposit = item?.numbers?.amountDeposit?.number || 0;
    return sum + toDeposit;
  }, 0);

  const totalObj = formatData(total, defaultCurrency.value);
  paymentsStore.formDeposits.totalDeposits = totalObj;

  return totalObj;
});

// Functions
const redirectToDocument = (id) => {
  const URL_DOCUMENT = `/salesDocuments/${id}`;
  navigateTo(URL_DOCUMENT, { external: true, open: { target: "_blank" } });
};

const hasMultipleIncomes = (origin) => {
  return origin.length > 1;
};

const deleteItem = (pos) => {
  const lines = paymentsStore.formDeposits.lines;
  if (lines.length > 1) {
    lines.splice(pos, 1);
  }
};

const formatData = (number, currency) => {
  const { precision, typeFormat } = currency;
  const numberAprox = convertToNumber(number, typeFormat, precision);
  return {
    number,
    value: formatCurrency(numberAprox, currency, true),
    numberAprox,
  };
};

const cutToTwoDecimals = (num) => {
  return String(Math.trunc(num * 100) / 100);
};

// -- Funtions for percentage input
const onPercentageInput = (event, p) => {
  change.value = true;
  let val = event.target.value;

  const isComma = symbol === ",";
  const decimalSymbol = symbol;
  const altSymbol = isComma ? "." : ",";

  // Reemplaza símbolo alternativo por el correcto
  val = val.replaceAll(altSymbol, decimalSymbol);

  // Solo números y un único símbolo decimal (sin negativos ni caracteres extraños)
  const regex = new RegExp(`[^0-9\\${decimalSymbol}]`, "g");
  val = val.replace(regex, "");

  // Si está vacío o solo tiene el símbolo decimal
  if (val === "" || val === decimalSymbol) {
    paymentsStore.formDeposits.lines[p].numbers.percentage = "0";
    paymentsStore.formDeposits.lines[p].numbers.amountDeposit = formatData(
      0,
      defaultCurrency.value,
    );
    return;
  }

  const parts = val.split(decimalSymbol);

  // Si solo hay símbolo decimal sin números
  if (parts[0] === "" && parts[1] === "") {
    paymentsStore.formDeposits.lines[p].numbers.percentage = "0";
    paymentsStore.formDeposits.lines[p].numbers.amountDeposit = formatData(
      0,
      defaultCurrency.value,
    );
    return;
  }

  if (parts.length > 2) {
    val = parts[0] + decimalSymbol + parts[1];
  }

  // Limita a 2 decimales
  if (parts[1]?.length > 2) {
    val = parts[0] + decimalSymbol + parts[1].slice(0, 2);
  }

  paymentsStore.formDeposits.lines[p].numbers.percentage = val;

  const line = paymentsStore.formDeposits.lines[p];
  const total = line.numbers.charged.number || 0;

  // Normalizar el valor para parseFloat (reemplazar coma por punto)
  const normalizedVal = val.replace(",", ".");
  const percentage = parseFloat(normalizedVal);

  // Validar que sea un número válido
  if (isNaN(percentage) || !isFinite(percentage) || percentage < 0) {
    paymentsStore.formDeposits.lines[p].numbers.percentage = "0";
    paymentsStore.formDeposits.lines[p].numbers.amountDeposit = formatData(
      0,
      defaultCurrency.value,
    );
    return;
  }

  const newAmountDeposit =
    percentage === 0 ? 0 : Math.trunc(total * percentage * 100) / 10000;

  paymentsStore.formDeposits.lines[p].numbers.amountDeposit = formatData(
    newAmountDeposit,
    defaultCurrency.value,
  );
};

const onPercentageBlur = (p) => {
  if (paymentsStore.formDeposits.lines[p].numbers.percentage === "") {
    paymentsStore.formDeposits.lines[p].numbers.percentage = "0";
  }

  let val = paymentsStore.formDeposits.lines[p].numbers.percentage;
  if (!val) return;

  // Reemplaza coma por punto para parsear
  const num = parseFloat(val.replace(",", "."));

  // Si no es un número válido, lo dejamos vacío
  if (isNaN(num)) {
    paymentsStore.formDeposits.lines[p].numbers.percentage = "0";
    return;
  }

  // Validar rango 0 - 100
  const clamped = Math.min(100, Math.max(0, num));

  // Formatear a string con 2 decimales y el símbolo adecuado
  let formatted;
  if (Number.isInteger(clamped)) {
    formatted = String(clamped);
  } else {
    formatted = cutToTwoDecimals(clamped).replace(".", symbol);
  }

  paymentsStore.formDeposits.lines[p].numbers.percentage = formatted;

  const line = paymentsStore.formDeposits.lines[p];
  const total = line.numbers.charged.number;
  const percentage = parseFloat(line.numbers.percentage.replace(",", ".")) || 0;
  const newAmountDeposit =
    percentage === 0 ? 0 : Math.trunc(total * percentage * 100) / 10000;

  paymentsStore.formDeposits.lines[p].numbers.amountDeposit = formatData(
    newAmountDeposit,
    defaultCurrency.value,
  );
};

const selectAll = (event) => {
  event.target.select();
};

// --Functions for amount input
const handleInputChange = debounce((event, line) => {
  change.value = true;

  // Eliminar caracteres no válidos (mantener solo números y símbolos decimales permitidos)
  let rawValue = event.target.value;

  // Eliminar letras, símbolos extraños, negativos, etc.
  rawValue = rawValue.replace(/[^\d.,]/g, "");

  // Si está vacío, establecer a 0
  if (!rawValue || rawValue === "." || rawValue === ",") {
    line.numbers.amountDeposit.number = 0;
    line.numbers.amountDeposit.tempValue = "0";
    line.numbers.amountDeposit.value = "0";
    return;
  }

  line.numbers.amountDeposit.value = rawValue;

  try {
    console.log("rawValue", rawValue);
    console.log("defaultCurrency.value", defaultCurrency.value);
    const numbers = getValueFormaRealTime(
      rawValue,
      defaultCurrency.value,
      "amountDeposit",
    );

    if (
      numbers &&
      typeof numbers.numericValue === "number" &&
      isFinite(numbers.numericValue)
    ) {
      // Actualiza valor numérico
      line.numbers.amountDeposit.number = numbers.numericValue;
      // Actualiza el valor temporal en tiempo real
      line.numbers.amountDeposit.tempValue = numbers.formattedValue;
    } else {
      // Si no hay números válidos, resetear a 0
      line.numbers.amountDeposit.number = 0;
      line.numbers.amountDeposit.tempValue = "0";
    }
  } catch (error) {
    console.error("Error en handleInputChange:", error);
    // En caso de error, resetear a 0
    line.numbers.amountDeposit.number = 0;
    line.numbers.amountDeposit.tempValue = "0";
  }
}, 10);

const onFocusInput = (event, line) => {
  const id = event.target.id;
  const input = document.getElementById(id);

  if (input) {
    input.focus();
    setTimeout(() => {
      input.select();
    }, 0);
  }

  // Focus: Elimina el formato para edición
  line.numbers.amountDeposit.tempValue = line.numbers.amountDeposit.number;
  line.numbers.amountDeposit.lastNumber = line.numbers.amountDeposit.number;
  line.numbers.amountDeposit.lastValue = line.numbers.amountDeposit.value;
  line.numbers.amountDeposit.value = line.numbers.amountDeposit.number;
};

const onBlurInput = (event, line) => {
  try {
    // Asegurar que tenemos un número válido
    const amount = Number(line.numbers.amountDeposit.number);

    if (isNaN(amount) || !isFinite(amount)) {
      line.numbers.amountDeposit.number = 0;
      line.numbers.amountDeposit.value = formatCurrency(
        0,
        defaultCurrency.value,
        true,
      );
      line.numbers.percentage = "0";
      delete line.numbers.amountDeposit.tempValue;
      return;
    }

    line.numbers.amountDeposit.value = formatCurrency(
      line.numbers.amountDeposit.number,
      defaultCurrency.value,
      true,
    );
    // Limpia el valor temporal
    delete line.numbers.amountDeposit.tempValue;
  } catch (error) {
    console.error("Error al formatear el valor:", error);
    line.numbers.amountDeposit.number = 0;
    line.numbers.amountDeposit.value = "0";
    line.numbers.percentage = "0";
    delete line.numbers.amountDeposit.tempValue;
    return;
  }

  const total = line.numbers.charged.number || 0;

  if (total === 0) {
    line.numbers.percentage = "0";
    return;
  }

  const percentage = (line.numbers.amountDeposit.number / total) * 100;

  // Validar que el porcentaje sea válido
  if (isNaN(percentage) || !isFinite(percentage)) {
    line.numbers.percentage = "0";
    return;
  }

  let percentageStr;
  if (Number.isInteger(percentage)) {
    percentageStr = String(percentage);
  } else {
    percentageStr = cutToTwoDecimals(percentage);
  }

  // Reemplaza símbolo decimal si es necesario
  if (symbol === ",") {
    percentageStr = percentageStr.replace(".", ",");
  }

  line.numbers.percentage = percentageStr;
};

// Keyboard navigation
const handleKeyNavigation = (event, rowIndex, colIndex, totalRows) => {
  const key = event.key;
  const next = { row: rowIndex, col: colIndex };

  if (key === "ArrowRight" || key === "Enter" || key === "Tab") {
    event.preventDefault();
    next.col = colIndex === 1 ? 2 : 1;
  } else if (key === "ArrowLeft") {
    event.preventDefault();
    next.col = colIndex === 2 ? 1 : 2;
  } else if (key === "ArrowDown") {
    event.preventDefault();
    if (rowIndex < totalRows - 1) next.row = rowIndex + 1;
  } else if (key === "ArrowUp") {
    event.preventDefault();
    if (rowIndex > 0) next.row = rowIndex - 1;
  } else if (key === "Escape") {
    event.target.blur();
    return;
  } else {
    return;
  }

  const nextInput = document.getElementById(`input-${next.row}-${next.col}`);
  nextInput?.focus();
};

const getTextCode = (code) => {
  switch (code) {
    case "invoice":
      return {
        es: "DB",
        en: "DB",
      };
    case "debit":
      return {
        es: "ND",
        en: "DN",
      };
    case "credit":
      return {
        es: "NC",
        en: "CN",
      };
  }
};

// Escape
const handleEscClose = (e) => {
  if (e.key === "Escape") {
    emit("closeModal");
  }
};

// const recalculateTable = (newCurrency, oldCurrency) => {
//     if (!newCurrency || !oldCurrency || !baseCurrency.value) return;

//     // Evitar ejecución si es la misma moneda
//     if (newCurrency.code === oldCurrency.code) return;

//     paymentsStore.formDeposits.lines.forEach((line) => {
//       // 1. GUARDAR el porcentaje actual
//       const currentPercentage = parseFloat(line.numbers.percentage.replace(",", ".")) || 0;

//       const oldCharged = line.numbers.charged.number || 0;
//       const oldTotal = line.numbers.total.number || 0;

//       let convertedCharged;
//       let convertedTotal;

//       // Obtener las tasas de cambio
//       const oldRate = oldCurrency.valueManual || oldCurrency.value || 1;
//       const newRate = newCurrency.valueManual || newCurrency.value || 1;

//       // PASO 1: Convertir de la moneda antigua a la moneda base
//       let chargedInBase;
//       let totalInBase;

//       if (oldCurrency.code === baseCurrency.value.code) {
//         // Ya está en moneda base
//         chargedInBase = oldCharged;
//         totalInBase = oldTotal;
//       } else {
//         // La tasa representa cuánto vale 1 unidad de moneda base en la moneda extranjera
//         // Entonces para convertir de moneda extranjera a base, MULTIPLICAMOS por la tasa
//         // Ejemplo: 100 USD * 4000 = 400,000 COP
//         chargedInBase = oldCharged * oldRate;
//         totalInBase = oldTotal * oldRate;
//       }

//       // PASO 2: Convertir de la moneda base a la nueva moneda
//       if (newCurrency.code === baseCurrency.value.code) {
//         // La nueva moneda ES la moneda base
//         convertedCharged = chargedInBase;
//         convertedTotal = totalInBase;
//       } else {
//         // Para convertir de moneda base a moneda extranjera, DIVIDIMOS por la tasa
//         // Ejemplo: 400,000 COP / 4000 = 100 USD
//         convertedCharged = chargedInBase / newRate;
//         convertedTotal = totalInBase / newRate;
//       }

//       // 3. Actualizar charged y total con los valores convertidos
//       line.numbers.charged = formatData(convertedCharged, newCurrency);
//       line.numbers.total = formatData(convertedTotal, newCurrency);

//       // 4. RECALCULAR amountDeposit basándote en el porcentaje
//       const newAmount = currentPercentage === 0
//         ? 0
//         : Math.trunc(convertedCharged * currentPercentage * 100) / 10000;

//       line.numbers.amountDeposit = {
//         ...line.numbers.amountDeposit,
//         ...formatData(newAmount, newCurrency),
//       };

//       // 5. El porcentaje se mantiene igual
//     });

//     // Recalcular total de depósitos
//     const total = paymentsStore.formDeposits.lines.reduce(
//       (sum, l) => sum + (l.numbers.amountDeposit.number || 0),
//       0
//     );

//     paymentsStore.formDeposits.totalDeposits = formatData(total, newCurrency);
//   }

// // Watch para conversión de monedas
// watch(
//   () => paymentsStore.formDeposits.currency,
//   (newCurrency, oldCurrency) => {
//     recalculateTable(newCurrency, oldCurrency);
//   },
//   { deep: false }
// );
</script>

<template>
  <div class="step2">
    <div class="step2__body">
      <div class="step2__body-table">
        <div class="step2__body-table-header">
          <div class="col left first">
            <span v-text="t(`${module}.table.cols.col1`)"></span>
          </div>
          <div class="col left">
            <span v-text="t(`${module}.table.cols.col2`)"></span>
          </div>
          <div class="col right">
            <span v-text="t(`${module}.table.cols.col3`)"></span>
          </div>
          <div class="col right">
            <span v-text="t(`${module}.table.cols.col4`)"></span>
          </div>
          <div class="col right">
            <span>%</span>
          </div>
          <div class="col right">
            <span v-text="t(`${module}.table.cols.col5`)" z></span>
          </div>
          <div class="col right last"></div>
        </div>
        <div
          class="step2__body-table-item"
          v-for="(item, p) in paymentsStore.formDeposits.lines"
          :key="item._id"
        >
          <div class="col left first">
            <u-tags
              :title="`${item?.salesDocumentType?.tag || getTextCode(item?.salesDocumentType?.code)[globalStore.lang] || '-'} - ${
                item?.number || '-'
              }`"
              :text="`${item?.salesDocumentType?.tag || getTextCode(item?.salesDocumentType?.code)[globalStore.lang] || '-'} - ${
                formatMaskNumber(item?.number) || '-'
              } `"
              icon="click"
              size="xs"
              :delete="false"
              color="--info-surface-darker"
              background="--info-surface-shadow-12a"
              class="truncateText"
              style="cursor: pointer"
              maxWidth="70px"
              @click="redirectToDocument(item?._id)"
            />
          </div>
          <div class="col left name">
            <span
              class="truncateText"
              v-text="capitalizeName(item?.reference || '')"
            ></span>
          </div>
          <div class="col right">
            <span
              v-text="item?.numbers?.totalPostCreditAndDebit?.value"
              :title="item?.numbers?.totalPostCreditAndDebit?.value"
            ></span>
          </div>
          <div class="col right">
            <span
              v-text="item?.numbers?.charged?.value"
              :title="item?.numbers?.charged?.value"
              :class="{ completed: item.numbers.percentage === '100' }"
            ></span>
          </div>
          <div class="col right">
            <input
              v-model="item.numbers.percentage"
              type="text"
              :id="`input-${p}-1`"
              @input="onPercentageInput($event, p)"
              @blur="onPercentageBlur(p)"
              @focus="selectAll($event)"
              @keydown="
                handleKeyNavigation(
                  $event,
                  p,
                  1,
                  paymentsStore.formDeposits.lines.length,
                )
              "
              :class="
                item.numbers.amountDeposit.number > item.numbers.charged.number
                  ? 'error'
                  : ''
              "
            />
          </div>
          <div class="col right">
            <input
              type="text"
              :id="`input-${p}-2`"
              @focus="selectAll($event)"
              @input="handleInputChange($event, item)"
              @focusin="onFocusInput($event, item)"
              @focusout="onBlurInput($event, item)"
              @keydown="
                handleKeyNavigation(
                  $event,
                  p,
                  2,
                  paymentsStore.formDeposits.lines.length,
                )
              "
              :value="
                item.numbers.amountDeposit.tempValue ||
                item.numbers.amountDeposit.value
              "
              :class="
                item.numbers.amountDeposit.number > item.numbers.charged.number
                  ? 'error'
                  : ''
              "
            />
          </div>
          <div class="col right last">
            <u-button-icon
              icon="close"
              type="text"
              size="s"
              :color="color"
              @click="deleteItem(p)"
              :disabled="paymentsStore.formDeposits.lines.length === 1"
            />
          </div>
        </div>
      </div>
      <div class="step2__body-footer">
        <div>
          <div v-if="invalidNumbers && change" class="alert">
            <span class="u u-info-circle"></span>
            <span>{{ t(`${module}.table.footer.warning`) }}</span>
          </div>
        </div>
        <div class="step2__body-footer-box">
          <span v-text="t(`${module}.table.footer.total`)"></span>
          <!-- <span v-text="t(module + '.table.footer.total')"></span> -->
          <span
            v-text="totalDeposits?.value"
            :title="totalDeposits?.number"
          ></span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.step2 {
  width: 85vw;
  max-width: 1100px;
  height: auto;
  max-height: calc(85vh - 120px);
  display: flex;
  flex-direction: column;
  gap: 16px;
}

@media only screen and (max-width: 768px) {
  .step2 {
    width: calc(100vw - 40px);
    max-height: calc(100vh - 80px);
  }
  .step2__body-table {
    height: calc(100vh - 270px) !important;
  }
}

/* body */
.step2__body {
  flex-grow: 1;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.step2__body-header {
  height: 56px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.step2__body-header span.title {
  font-weight: 600;
  font-size: 16px;
  line-height: 20px;
  letter-spacing: 0%;
  vertical-align: middle;
  color: var(--neutral-text-body);
}

.iconBtn {
  transform: scale(0.8);
}

.step2__body-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
}

.step2__body-footer-box {
  border: 1px solid var(--neutral-border-subtle);
  padding: 8px;
  width: auto;
  min-width: 338px;
  height: 48px;
  border-radius: 16px;
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 20px;
  align-items: center;
  background-color: var(--primary-surface-shadow-12a);
}

.step2__body-footer-box span {
  font-weight: 800;
  font-size: 14px;
  line-height: 18px;
  letter-spacing: 0%;
  vertical-align: middle;
  color: var(--neutral-text-body);
}

.step2__body-footer-box span:nth-child(2) {
  text-align: right;
}

/* Tabla */

.step2__body-table {
  overflow: auto;
  border-radius: 16px;
  border: 1px solid var(--neutral-border-light);
  height: calc(85vh - 80px - 80px - 44px - 32px - 206px);
  position: relative;
}

.step2__body-table::-webkit-scrollbar {
  width: 8px;
  height: 0px;
  background: var(--neutral-surface-light);
  border-radius: 20px;
}

.step2__body-table::-webkit-scrollbar-thumb {
  background: var(--neutral-surface-subtle);
  border-radius: 5px;
}

.step2__body-table-header {
  position: sticky;
  top: 0;
  z-index: 2;
}

.step2__body-table-header,
.step2__body-table-item {
  display: grid;
  width: 100%;
  grid-template-columns: 140px minmax(180px, 1fr) 160px 160px 80px 220px 50px;
}

.step2__body-table-header .col {
  background-color: var(--neutral-surface-softer);
  border-bottom: 1px solid var(--neutral-border-light);
}

.col {
  display: flex;
  align-items: center;
  padding: 0 12px;
  height: 40px;
}

.col span {
  width: 100%;
}

.col.name {
  flex-direction: column;
  justify-content: center;
  align-items: flex-start;
}

.step2__body-table-item .col span {
  color: var(--neutral-text-body);
}

.income {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 4px;
  align-items: center;
  margin-top: 2px;
}

.income span {
  transition: 0.3s;
}

.income:hover span {
  color: var(--primary-text-default) !important;
}

.income span.u {
  font-size: 12px;
  color: var(--primary-text-subtle);
  font-weight: 400;
}

.col.name span:nth-child(2) {
  color: var(--neutral-text-caption);
  font-weight: 400;
  font-size: 12px;
}

.col.first {
  padding-left: 20px;
}

.col.last {
  padding-right: 20px;
}

.col.right span {
  text-align: right;
}

.col.left {
  text-align: left;
}

.col span {
  font-weight: 600;
  font-size: 14px;
  line-height: 14px;
  letter-spacing: 0%;
  color: var(--neutral-text-caption);
}

.col a.tag {
  font-size: 11px;
  line-height: 11px;
  font-weight: 600;
  padding: 5px 10px;
  border-radius: 10px;
  text-align: center;
  display: flex;
  align-items: center;
  gap: 5px;
}

.col a.tag.OC {
  background-color: var(--info-surface-shadow-12a);
  color: var(--info-text-darker);
}
.col a.tag.OC span.u {
  color: var(--info-text-darker);
}

.col a.tag.FXR {
  background-color: var(--warning-surface-shadow-12a);
  color: var(--warning-text-darker);
}

.col a.tag.FXR span.u {
  color: var(--warning-text-darker);
}

.step2__body-table-item .col.first {
  gap: 8px;
}

.step2__body-table-item .col.first span {
  width: auto;
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

input::selection {
  background-color: var(--primary-text-subtle);
  color: var(--neutral-background-default);
}

input:hover:not(:focus):not(.error) {
  border: 1px solid var(--primary-border-subtle);
}

input:focus,
input:active {
  caret-color: var(--primary-text-subtle);
  border: 1px solid var(--primary-text-subtle);
  box-shadow: inset var(--primary-text-subtle) 0px 0px 0px 1px;
}

input.error {
  caret-color: var(--danger-text-subtle);
  border: 1px solid var(--danger-text-subtle);
  box-shadow: inset var(--danger-text-subtle) 0px 0px 0px 1px;
}

.alert {
  display: grid;
  grid-template-columns: auto auto;
  border: 1px solid var(--danger-border-default);
  border-radius: 10px;
  padding: 0 10px;
  box-sizing: border-box;
  gap: 8px;
  align-items: center;
  height: 48px;
}

.alert span:nth-child(1) {
  font-size: 28px;
  color: var(--danger-border-default);
}

.alert span:nth-child(2) {
  font-size: 14px;
  line-height: 16px;
  letter-spacing: 0%;
  vertical-align: middle;
  font-weight: 600;
  color: var(--neutral-text-body);
}

span.completed {
  color: var(--success-text-darker) !important;
}
</style>
