<script setup>
import { defineEmits, defineProps, computed, onBeforeMount } from "vue";
import usePaymentsStore from "@/stores/payments";
import useGlobalStore from "@/stores/global";
import useOrganizationStore from "@/stores/organization";
import { capitalizeName, debounce, transformedDate } from "@/utils/helpers";
import {
  formatCurrency,
  getValueFormaRealTime,
  convertToNumber,
} from "@/utils/formatAmount";

// Stores
const paymentsStore = usePaymentsStore();
const globalStore = useGlobalStore();
const organizationStore = useOrganizationStore();

// Emits
const emit = defineEmits(["closeModal", "changeStep", "backStep"]);

// Props
const props = defineProps({
  body: {
    type: Object,
    default: () => ({}),
  },
  page: {
    type: String,
    default: "listOc",
  },
});

// Constants
const color = "--neutral-text-caption";
const { t } = useI18n();
const module = "modules.outcomes.pages.oc.modals.goToPay.step2";
const buttons = "modules.outcomes.pages.oc.modals.goToPay.buttons";
const edit = ref(false);
const reference = ref("");
const symbol = ","; // Pedir esto
const change = ref(false);
const showCurrencies = ref(false);

// Mounted
onBeforeMount(async () => {
  // Si ya se ha cambiado el amountPaid, no volver a calcular
  if (paymentsStore?.formGoToPay?.lines[0]?.numbers?.amountPaid.number !== 0)
    return;

  const lines = paymentsStore?.formGoToPay?.lines ?? [];
  if (!lines.length) return;

  const resp = await globalStore.getMyCurrencies(
    false,
    lines[0]?.currency?.default?._id,
  );
  const form = paymentsStore.formGoToPay;

  form.currencies = [resp.currency, ...resp.currencies];

  const selectedCurrency =
    lines.length > 1 ? resp.currency : lines[0]?.currency?.default;

  form.currency = selectedCurrency;
  form.currencyName = selectedCurrency?.name?.[globalStore.lang];

  reference.value = paymentsStore.formGoToPay.reference;
  paymentsStore.formGoToPay.supplier =
    paymentsStore?.formGoToPay?.lines?.[0]?.supplier;
  if (props.page === "listOc") {
    const idSupplier =
      paymentsStore?.formGoToPay?.supplier?.contact?._id || null;
    if (idSupplier) {
      const resDestination = await paymentsStore.getBankAccountsByUser(
        idSupplier,
        true,
      );
      paymentsStore.formGoToPay.destinationBankAccounts = resDestination || [];
    }
  }

  paymentsStore?.formGoToPay?.lines?.forEach((l) => {
    l.numbers.percentage = "100";
    l.numbers.amountPaid = JSON.parse(JSON.stringify(l.numbers.unpaid));
    l.numbers.unpaid.numberBase = l.numbers.unpaid.number;
  });
  paymentsStore.formGoToPay.currency =
    paymentsStore?.formGoToPay?.lines?.[0]?.currency?.default || {};
  getCurrenciesEXR();
  recalculateAllLines();
});

// Computed
const title = computed(() => t(module + ".title2"));
const supplier = computed(() => {
  return {
    name:
      paymentsStore?.formGoToPay?.lines?.[0]?.supplier?.data?.legalName ?? "-",
    src: paymentsStore?.formGoToPay?.lines?.[0]?.supplier?.imgUrl,
  };
});
const totalToPay = computed(() => {
  const total = paymentsStore.formGoToPay.lines.reduce((sum, item) => {
    const toPay = item?.numbers?.amountPaid?.number || 0;

    return sum + toPay;
  }, 0);

  return formatData(total, defaultCurrency.value);
});
const defaultCurrency = computed(() => {
  return paymentsStore.formGoToPay.currency;
});
const invalidNumbers = computed(() => {
  const sePaso = paymentsStore.formGoToPay.lines.some(
    (line) => line.numbers.amountPaid.number > line.numbers.unpaid.number,
  );
  if (sePaso) return true;
  return paymentsStore.formGoToPay.lines.some(
    (line) => line.numbers.amountPaid.number === 0,
  );
});

// Eventos

// Functions
const cancelReference = () => {
  reference.value = paymentsStore.formGoToPay.reference;
  edit.value = false;
};
const confirmReference = () => {
  reference.value = reference.value.replace(/\s{2,}/g, " ");
  paymentsStore.formGoToPay.reference = reference.value;
  edit.value = false;
};
const hasMultipleIncomes = (origin) => {
  return origin.length > 1;
};
const inputEventReference = (e) => {
  const val = e.target.value;
  reference.value = capitalizeName(val);
};
const deleteItem = (pos) => {
  const lines = paymentsStore.formGoToPay.lines;

  if (lines.length > 1) {
    lines.splice(pos, 1);
  }
};
const onPercentageInput = (event, p) => {
  change.value = true;
  let val = event.target.value;

  const isComma = symbol === ",";
  const decimalSymbol = symbol;
  const altSymbol = isComma ? "." : ",";

  // Reemplaza símbolo alternativo por el correcto (por si lo escribe mal)
  val = val.replaceAll(altSymbol, decimalSymbol);

  // Solo números y un único símbolo decimal
  const regex = new RegExp(`[^0-9\\${decimalSymbol}]`, "g");
  val = val.replace(regex, "");

  const parts = val.split(decimalSymbol);
  if (parts.length > 2) {
    val = parts[0] + decimalSymbol + parts[1];
  }

  // Limita a 2 decimales si los hay
  if (parts[1]?.length > 2) {
    val = parts[0] + decimalSymbol + parts[1].slice(0, 2);
  }

  paymentsStore.formGoToPay.lines[p].numbers.percentage = val;
  const line = paymentsStore.formGoToPay.lines[p];
  const total = line.numbers.unpaid.number;
  const percentage = parseFloat(line.numbers.percentage.replace(",", ".")) || 0;
  const newAmountPaid =
    percentage === 0 ? 0 : Math.trunc(total * percentage * 100) / 10000;
  paymentsStore.formGoToPay.lines[p].numbers.amountPaid = formatData(
    newAmountPaid,
    defaultCurrency.value,
  );
};
const onPercentageBlur = (p) => {
  if (paymentsStore.formGoToPay.lines[p].numbers.percentage === "") {
    paymentsStore.formGoToPay.lines[p].numbers.percentage = "0";
  }
  let val = paymentsStore.formGoToPay.lines[p].numbers.percentage;
  if (!val) return;

  // Reemplaza coma por punto para parsear
  const num = parseFloat(val.replace(",", "."));

  // Si no es un número válido, lo dejamos vacío
  if (isNaN(num)) {
    paymentsStore.formGoToPay.lines[p].numbers.percentage = "";
    return;
  }

  // Validar rango 0 - 100
  const clamped = Math.min(100, Math.max(0, num));

  // Formatear a string con 2 decimales y el símbolo adecuado
  let formatted;
  if (Number.isInteger(clamped)) {
    formatted = String(clamped); // sin decimales
  } else {
    formatted = cutToTwoDecimals(clamped).replace(".", symbol); // con 2 decimales
  }

  paymentsStore.formGoToPay.lines[p].numbers.percentage = formatted;

  const line = paymentsStore.formGoToPay.lines[p];
  const total = line.numbers.unpaid.number;
  const percentage = parseFloat(line.numbers.percentage.replace(",", ".")) || 0;
  const newAmountPaid =
    percentage === 0 ? 0 : Math.trunc(total * percentage * 100) / 10000;
  paymentsStore.formGoToPay.lines[p].numbers.amountPaid = formatData(
    newAmountPaid,
    defaultCurrency.value,
  );
};
const selectAll = (event) => {
  event.target.select();
};

const handleInputChange = debounce((event, line) => {
  change.value = true;
  const rawValue = event.target.value.replace(/[a-zA-Z]/g, "");
  line.numbers.amountPaid.value = rawValue;
  const numbers = getValueFormaRealTime(
    rawValue,
    defaultCurrency.value,
    "amountPaid",
  );
  if (numbers) {
    //actualiza valor numerico
    line.numbers.amountPaid.number = numbers.numericValue;
    // Actualiza el valor temporal en tiempo real
    line.numbers.amountPaid.tempValue = numbers.formattedValue;
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
  line.numbers.amountPaid.tempValue = line.numbers.amountPaid.number;
  line.numbers.amountPaid.lastNumber = line.numbers.amountPaid.number;
  line.numbers.amountPaid.lastValue = line.numbers.amountPaid.value;
  line.numbers.amountPaid.value = line.numbers.amountPaid.number;
};
const onBlurInput = (event, line) => {
  try {
    line.numbers.amountPaid.value = formatCurrency(
      line.numbers.amountPaid.number,
      defaultCurrency.value,
      true,
    );
    // Limpia el valor temporal
    delete line.numbers.amountPaid.tempValue;
  } catch (error) {
    console.error("Error al formatear el valor:", error);
    line.numbers.amountPaid.number = 0;
    delete line.numbers.amountPaid.tempValue;
  } finally {
    const total = line.numbers.unpaid.number;
    const percentage = (line.numbers.amountPaid.number / total) * 100;

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
  }
};
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
    return; // no hace nada con otras teclas
  }

  const nextInput = document.getElementById(`input-${next.row}-${next.col}`);
  nextInput?.focus();
};

// Functions
const formatData = (number, currency) => {
  const { precision, typeFormat } = currency;
  const numberAprox = convertToNumber(number, typeFormat, precision);
  return {
    number,
    value: formatCurrency(numberAprox, currency, true),
    numberAprox,
  };
};
const nextStep = async () => {
  paymentsStore.formGoToPay.totalToPay = totalToPay.value;
  // Si la moneda prev no esta seteada, setea la moneda base
  // if (paymentsStore.formGoToPay.prevCurrencyId === "") {
  //   paymentsStore.formGoToPay.prevCurrencyId =
  //     paymentsStore.formGoToPay.currency._id;
  // }
  // Si la moneda prev no es igual a la moneda actual, setea la cuenta de origen seleccionada
  if (
    paymentsStore.formGoToPay.prevCurrencyId !==
    paymentsStore.formGoToPay.currency._id
  ) {
    paymentsStore.formGoToPay.originAccount = "";
  }
  emit("changeStep", true);
};
const cutToTwoDecimals = (num) => {
  return String(Math.trunc(num * 100) / 100);
};

// Escape
const handleEscClose = (e) => {
  if (e.key === "Escape") {
    emit("closeModal");
  }
};

// Actualizar Monedas y Tasas de Cambio
const getCurrenciesEXR = () => {
  const currencyOrg = organizationStore?.organization?.currency?._id; // Moneda de la organizacion
  const currencyDefaultId = paymentsStore.formGoToPay.currency?._id; // Moneda por defecto
  const currentLines = paymentsStore.formGoToPay.lines || []; // Lineas actuales
  const currencies = paymentsStore.formGoToPay.currencies; // Todas las monedas

  const linesCurrencies = [
    ...new Set(
      currentLines.map((line) => line?.currency?.default?._id).filter(Boolean),
    ),
  ];

  const currenciesForRates = new Set(); // Set de Monedas para tasas

  // CONDICIONES PARA INCLUIR MONEDAS EN RATES

  // 1. Monedas de líneas distintas a la org Y distintas a la moneda por defecto
  linesCurrencies.forEach((currencyId) => {
    if (currencyId !== currencyOrg && currencyId !== currencyDefaultId) {
      currenciesForRates.add(currencyId);
    }
  });

  // 2. Si la moneda default ≠ moneda org, incluir moneda org
  console.log("currency default", currencyDefaultId);
  console.log("currency org", currencyOrg);
  if (currencyDefaultId && currencyDefaultId !== currencyOrg) {
    console.log("Incluye org");
    currenciesForRates.add(currencyOrg);
  }

  // Construir othersCurrency
  const normalizeToNumber = (value) => {
    if (value === null || value === undefined || value === "") return 0;

    return Number(value.replace(",", ""));
  };

  paymentsStore.formGoToPay.othersCurrency = currencies
    .filter((currency) => currenciesForRates.has(currency._id))
    .map((currency) => ({
      ...currency,
      valueToday: normalizeToNumber(currency.value),
      valueManual: normalizeToNumber(currency.value),
    }));
};

// Recalculo de Montos a pagar de acuerdo con la currency y tasa de cambio
const recalculateAllLines = () => {
  // DATOS BASE (moneda actual, moneda org, otras monedas (tasas de cambio), lineas de negocio)
  const currentCurrency = paymentsStore?.formGoToPay?.currency;
  const currencyOrg = organizationStore?.organization?.currency;
  const othersCurrencies = paymentsStore?.formGoToPay?.othersCurrency || [];
  const lines = paymentsStore?.formGoToPay?.lines || [];

  /* Recorrer todas las lineas */
  lines.forEach((line) => {
    // 1. Obtener valores base
    const baseLineUnPaid = line?.numbers?.unpaid?.numberBase || 0;

    // 2. Convertir la moneda base a la moneda extrangera con la tasa de cambio
    let convertedUnPaid;

    if (line.currency._id === currentCurrency._id) {
      // Si la moneda de la linea es igual a la moneda actual, no hay conversion
      convertedUnPaid = baseLineUnPaid;
    } else {
      // Buscar la tasa de cambio apropiada
      const currencyRate = othersCurrencies.find(
        (c) => c._id === line.currency.default._id,
      );

      console.log("currencyRate", currencyRate);

      if (currencyRate) {
        convertedUnPaid = baseLineUnPaid * currencyRate.valueManual || 0;
      } else {
        convertedUnPaid = baseLineUnPaid;
      }
    }

    // Actualizar unpaid
    const newUnPaid = formatData(convertedUnPaid, currentCurrency);
    line.numbers.unpaid = {
      ...line.numbers.unpaid,
      numberReal: newUnPaid.number,
      numberAprox: newUnPaid.numberAprox,
      number: newUnPaid.numberAprox,
      value: newUnPaid.value,
    };

    // 3. ESTABLECER amountPaid como el 100% de unpaid
    const newAmountPaid = formatData(convertedUnPaid, currentCurrency);
    line.numbers.amountPaid = {
      ...line.numbers.amountPaid,
      numberReal: newAmountPaid.number,
      numberAprox: newAmountPaid.numberAprox,
      number: newAmountPaid.numberAprox,
      value: newAmountPaid.value,
    };

    // 4. ESTABLECER el porcentaje en 100%
    line.numbers.percentage = "100";
  });
};

onMounted(() => {
  document.addEventListener("keydown", handleEscClose);
});

onUnmounted(() => {
  document.removeEventListener("keydown", handleEscClose);
});
</script>

<template>
  <div class="step2">
    <div class="step2__header">
      <div class="step2__header-izq">
        <span v-text="title"></span>
      </div>
      <u-button-icon
        icon="close"
        class="btnIconModify"
        :color="color"
        @action-btn="emit('closeModal')"
        type="outlined"
        size="s"
      />
    </div>
    <div class="step2__body">
      <div class="step2__body-header">
        <div class="step2__body-header-left">
          <div class="reference" v-show="!edit">
            <span
              style="max-width: 500px"
              class="title truncateText"
              v-text="reference.trim() !== '' ? reference : t(module + '.text')"
            ></span>
            <u-button-icon
              icon="edit"
              size="s"
              type="text"
              class="iconBtn"
              @click="edit = true"
            />
          </div>
          <div class="step2__body-creator" v-show="!edit">
            <u-avatar :user="supplier" :size="24" />
            <span
              class="truncateText"
              v-text="supplier.name"
              style="max-width: 460px"
            ></span>
          </div>
          <div class="step2__body-header-input" v-show="edit">
            <span class="u u-new-project"></span>
            <span
              v-text="t(module.replace('2', '3') + '.inputs.reference.label')"
            ></span>
            <u-input
              :placeholder="
                t(module.replace('2', '3') + '.inputs.reference.placeholder')
              "
              size="s"
              style="width: 280px"
              v-model="reference"
              @input="inputEventReference($event)"
            />
            <u-button-icon
              icon="check"
              size="s"
              type="outlined"
              @click="confirmReference"
            />
            <u-button-icon
              icon="close"
              size="s"
              type="outlined"
              :color="color"
              @click="cancelReference"
            />
          </div>
        </div>
        <!--AQUI VA EL BOTON DE MONEDAS-->
        <div class="containerCurrencies">
          <DialogGoToPayComponentsListExchangeRate
            @recalculateTable="recalculateAllLines"
          />
          <DialogGoToPayComponentsBtnExchange
            class="btnExchange"
            @click="showCurrencies = !showCurrencies"
          />
          <DialogGoToPayComponentsExchangeRate
            :show-menu="showCurrencies"
            classNameBtn="btnExchange"
            @realoadGetCurrencies="getCurrenciesEXR"
            @recalculateTable="recalculateAllLines"
            @closeMenu="showCurrencies = false"
          />
        </div>
      </div>
      <div class="step2__body-table">
        <div class="step2__body-table-header">
          <div class="col left first">
            <span v-text="t(module + '.table.headers.purchase')"></span>
          </div>
          <div class="col left">
            <span v-text="t(module + '.table.headers.reference')"></span>
          </div>
          <div class="col right">
            <span v-text="t(module + '.table.headers.conditions')"></span>
          </div>
          <div class="col right">
            <span v-text="t(module + '.table.headers.expiration')"></span>
          </div>
          <div class="col right">
            <span
              v-text="
                t(module + '.table.headers.purchaseValue') +
                ' [' +
                paymentsStore.formGoToPay.lines[0]?.currency?.default?.code +
                ']'
              "
            ></span>
          </div>
          <div class="col right">
            <span
              v-text="
                t(module + '.table.headers.unpaid') +
                ' [' +
                paymentsStore.formGoToPay.currency.code +
                ']'
              "
            ></span>
          </div>
          <div class="col right">
            <span>%</span>
          </div>
          <div class="col right">
            <span
              v-text="
                t(module + '.table.headers.toPay') +
                ' [' +
                paymentsStore.formGoToPay.currency.code +
                ']'
              "
            ></span>
          </div>
          <div class="col right last"></div>
        </div>
        <div
          class="step2__body-table-item"
          v-for="(item, p) in paymentsStore.formGoToPay.lines"
          :key="item._id"
        >
          <div class="col left first">
            <a
              :class="`tag ${item?.type}`"
              :href="`/outcomes/${item?._id}`"
              target="_blank"
              rel="noopener noreferrer"
            >
              {{ item?.tagManagementDoc || item?.type }} - {{ item?.idNumber }}
              <span class="u u-click"></span>
            </a>
          </div>
          <div class="col left name">
            <span
              class="truncateText"
              v-text="capitalizeName(item?.reference || '')"
            ></span>
            <span
              v-if="hasMultipleIncomes(item?.income || [])"
              v-text="t(module + '.mulitpleIncomes')"
            ></span>
            <a
              v-else
              class="income"
              :title="
                item?.income?.[0]?.project?.name +
                ' / ' +
                item?.income?.[0]?.name
              "
              :href="`/incomesv2/project/${item?.income?.[0]?.project?._id}/income/${item?.income?.[0]?._id}`"
              target="_blank"
              rel="noopener noreferrer"
            >
              <span class="u u-open"></span>
              <span
                class="truncateText"
                v-text="capitalizeName(item?.income?.[0]?.name || '')"
              ></span>
            </a>
          </div>
          <div class="col right">
            <span>{{ item?.paymentTerm?.name?.[globalStore.lang] }}</span>
          </div>
          <div class="col right">
            <span v-text="transformedDate(item.dueDate)"></span>
          </div>
          <div class="col right">
            <span
              v-text="item?.numbers?.total?.value"
              :title="item?.numbers?.total?.number"
            ></span>
          </div>
          <div class="col right truncateText">
            <span
              v-text="item?.numbers?.unpaid?.value"
              :title="item?.numbers?.unpaid?.number"
              :class="{ completed: item.numbers.percentage === '100' }"
              class="truncateText"
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
                  paymentsStore.formGoToPay.lines.length,
                )
              "
              :class="
                item.numbers.amountPaid.number > item.numbers.unpaid.number
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
                  paymentsStore.formGoToPay.lines.length,
                )
              "
              :value="
                item.numbers.amountPaid.tempValue ||
                item.numbers.amountPaid.value
              "
              :class="
                item.numbers.amountPaid.number > item.numbers.unpaid.number
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
              :disabled="paymentsStore.formGoToPay.lines.length === 1"
            />
          </div>
        </div>
      </div>
      <div class="step2__body-table-footer">
        <div class="alert" v-if="invalidNumbers && change">
          <span class="u u-info-circle"></span>
          <span v-text="t(module + '.msg.invalid')"></span>
        </div>
        <div class="step2__body-footer">
          <div class="step2__body-footer-box">
            <span v-text="t(module + '.table.footer.total')"></span>
            <span v-text="totalToPay?.value" :title="totalToPay?.number"></span>
          </div>
        </div>
      </div>
    </div>
    <div class="step2__footer">
      <u-button
        :text="t(buttons + '.cancel')"
        type="outlined"
        class="mainBtnModify"
        @click="emit('closeModal')"
        size="s"
      />
      <u-button
        :text="t(buttons + '.next')"
        class="mainBtnModify"
        @click="nextStep"
        size="s"
        :disabled="invalidNumbers"
      />
    </div>
  </div>
</template>

<style scoped>
.step2 {
  width: 90vw;
  max-width: 1250px;
  height: auto;
  max-height: calc(85vh - 80px);
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
    height: calc(100vh - 100px) !important;
  }
}

/* header */
.step2__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 40px;
  width: 100%;
}

.step2__header-izq {
  display: flex;
  align-items: center;

  gap: 16px;
}

.step2__header-izq span {
  font-size: 16px;
  font-weight: 600;
  line-height: 20px;
  letter-spacing: 0em;
  text-align: left;
  color: var(--neutral-text-body);
}

.step2__header-izq .containerCurrencies {
  position: relative;
  z-index: 9;
}

/* body */
.step2__body {
  flex-grow: 1;
  display: flex;
  flex-direction: column;
  gap: 24px;
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

.step2__body-creator,
.step2__body-header .reference {
  display: flex;
  gap: 8px;
  align-items: center;
}

.step2__body-header .reference {
  gap: 2px;
}

.step2__body-header-input {
  display: flex;
  gap: 10px;
}

.step2__body-header-input span {
  font-size: 14px;
  line-height: 18px;
  letter-spacing: 0%;
  vertical-align: middle;
  color: var(--neutral-text-caption);
  height: 32px;
  padding-top: 8px;
}

.step2__body-header-input span:nth-child(2) {
  font-weight: 600;
}

.containerCurrencies {
  display: flex;
  justify-content: center;
  position: relative;
  z-index: 10;
  gap: 16px;
}

.step2__body-creator span {
  font-weight: 400;
  font-size: 14px;
  line-height: 18px;
  letter-spacing: 0%;
  vertical-align: middle;
  color: var(--neutral-text-caption);
}

.step2__body-table-footer {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 16px;
}

.step2__body-footer {
  margin-left: auto;
  border: 1px solid var(--neutral-border-subtle);
  padding: 8px;
  width: auto;
  min-width: 338px;
  height: 48px;
  border-radius: 16px;
}

.step2__body-footer-box {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 20px;
  align-items: center;
  background-color: var(--primary-surface-shadow-12a);
  border-radius: 8px;
  padding: 6px 12px;
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
  grid-template-columns:
    140px minmax(180px, 1fr)
    100px 120px 185px 160px 80px 220px 50px;
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
  grid-template-columns: auto 1fr;
  width: max-content;
  border: 1px solid var(--danger-border-default);
  border-radius: 10px;
  padding: 0 10px;
  box-sizing: border-box;
  gap: 15px;
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

/* footer */
.step2__footer {
  width: 100%;
  height: 40px;
  display: flex;
  justify-content: space-between;
  padding-top: 10px;
}

/* CUSTOM COMPONENTS - MODIFY */
.btnIconModify {
  border-radius: 50%;
  color: var(--bg-neutral-500);
}

.mainBtnModify {
  width: 135px;
}
</style>
