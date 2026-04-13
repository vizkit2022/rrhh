<script setup>
import { defineEmits, ref, defineProps, onMounted, computed } from "vue";
import useOutcomesStore from "@/stores/outcomes";
import useGlobalStore from "@/stores/global";
import useOrganizationStore from "@/stores/organization";

// Stores
const outcomesStore = useOutcomesStore();
const globalStore = useGlobalStore();
const organizationStore = useOrganizationStore();

// Emits
const emit = defineEmits(["closeModal", "changeStep", "updateTableGrid"]);

// Props
const props = defineProps({
  body: {
    type: Object,
    default: () => ({}),
  },
  config: {
    type: Object,
    default: () => ({}),
  },
});

// Constants
const color = "--neutral-text-caption";
const { t } = useI18n();
const module = "modules.outcomes.pages.oc.modals.buy.step3";
const buttons = "modules.outcomes.pages.oc.modals.buy.buttons";
const config = {
  width: "calc(85vw - 80px)",
  modal: true,
  maxHeight: "calc(85vh - 363px)",
  columns: {
    checkbox: false,
    code: true,
    name: true,
    origin: !props?.config?.income,
    status: !!props?.config?.income,
    quantity: true,
    days: true,
    ot: true,
    price: true,
    total: true,
    totalAction: outcomesStore.formPO.type !== "FXR",
    documented: false,
    documentedAction: false,
    toDocument: false,
    toDocumentAction: false,
    delete: true,
  },
};
const availableTaxes = ref([]);
const taxes = ref({});
const autoCacl = ref(false);
const exchangeRateX = ref("0px");
const showMenuERX = ref(false);
const idsTaxes = new Set();
const showCurrencies = ref(false);
const gridRef = ref(null);

// onMounted
onMounted(() => {
  // Calcular la posicion del exchangeRate
  // exchangeRateX.value = getButtonDistanceFromDivLeft("headerId", "buttonERX");
  document.addEventListener("click", handleClickOutside);

  // Obtener el documentType actual
  let documentType = outcomesStore.documentTypes.find(
    (item) => item._id == outcomesStore.formPO.documentType,
  );

  // Impuestos disponibles
  if (outcomesStore.formPO.type === "FXR") {
    availableTaxes.value = [];
    // Limpiar impuestos por defecto - LOS FXR NO TIENEN IMPUESTOS
    if (documentType) documentType.taxDefault = [];
  } else {
    availableTaxes.value = JSON.parse(JSON.stringify(documentType.taxes));
  }

  // Inicializar líneas (se movió a una función para reutilizar)
  getCurrenciesEXR();
  initializeLines();

  setTimeout(() => {
    autoCacl.value = true;
  }, 0);
});

const initializeLines = () => {
  // Obtener el documentType actual
  let documentType = outcomesStore.documentTypes.find(
    (item) => item._id == outcomesStore.formPO.documentType,
  );

  // Currency Actual
  const currency = outcomesStore.formPO.currency;

  // Taxes por defecto
  const taxesDefault = documentType?.taxDefault || [];

  // Currencies usadas
  const idsCurrencies = new Set();

  outcomesStore.formPO.lines.forEach((line) => {
    // Inicializar taxes por defecto
    line.taxes = taxesDefault;
    // Limpiar taxes para luego agregar los calculados
    line.numbers.taxes = [];
    const defaultObj = {
      lastNumber: 1,
      lastValue: "1",
      number: 1,
      value: "1",
    };
    line.numbers.amount1 = JSON.parse(JSON.stringify(defaultObj));
    line.numbers.amount2 = JSON.parse(JSON.stringify(defaultObj));
    line.numbers.amount3 = {
      lastNumber: 0,
      lastValue: "0",
      number: 0,
      value: "0",
    };

    // Actualizar el valor de la compra
    line.numbers.sumBudget = formatData(0, currency);
    line.numbers.budget = formatData(0, currency);

    // Si no tiene income
    if (typeof line.income !== "object") {
      line.income = {
        _id: props?.config?.income,
        name: props?.config?.mov?.name,
        project: {
          _id: props?.config?.mov?.projectId,
          name: props?.config?.mov?.project,
        },
      };
    }

    // Agregar impuestos por defecto ya calculados
    documentType?.taxDefault?.forEach((tax) => {
      const itemTax = documentType.taxes.find((item) => item._id === tax);
      if (itemTax) {
        const calc = taxApplied(itemTax, line?.numbers?.sumBudget?.number || 0);
        const total = formatData(calc, currency);

        line.numbers.taxes.push({
          tax: itemTax._id,
          name: itemTax.name,
          retention: itemTax.retention,
          value: itemTax.value,
          total,
          select: true,
        });
      }
    });

    if (gridRef.value) {
      if (outcomesStore.formPO.type !== "FXR") {
        gridRef.value.calcTax(line, currency);
      }
      gridRef.value.calculateTotals();
    }

    // Obtener la id de las monedas usadas por income
    // if(line.currency) idsCurrencies.add(line.currency);
  });

  // Obtener las monedas usadas por income
  // outcomesStore.formPO.othersCurrency = [];
  // console.log('idsCurrencies', idsCurrencies);
  // console.log('outcomesStore.formPO.currencies', outcomesStore.formPO.currencies);
  // idsCurrencies.forEach(idC => {
  //   const currency = outcomesStore.formPO.currencies.find(c => c._id === idC);
  //   if(currency._id !== outcomesStore.formPO.currency._id) {
  //     const VALUE = Number(currency?.value?.replace(",","") ?? 1);
  //     outcomesStore.formPO.othersCurrency.push({ ...currency, valueToday: VALUE, valueManual: VALUE });
  //   }
  // });
};

const getCurrenciesEXR = () => {
  const currencyOrg = organizationStore?.organization?.currency?._id; // Moneda de la organizacion
  const currencyDefaultId = outcomesStore?.formPO?.currency?._id; // Moneda por defecto
  const currentLines = outcomesStore.formPO.lines || []; // Lineas actuales
  const currencies = outcomesStore?.formPO?.currencies; // Todas las monedas

  const linesCurrencies = [
    ...new Set(
      currentLines.map((line) => line?.income?.currency).filter(Boolean),
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
  if (currencyDefaultId && currencyDefaultId !== currencyOrg) {
    currenciesForRates.add(currencyOrg);
  }

  // Construir othersCurrency
  const normalizeToNumber = (value) => {
    if (value === null || value === undefined || value === "") return 0;

    return Number(value.replace(",", ""));
  };

  outcomesStore.formPO.othersCurrency = currencies
    .filter((currency) => currenciesForRates.has(currency._id))
    .map((currency) => ({
      ...currency,
      valueToday: normalizeToNumber(currency.value),
      valueManual: normalizeToNumber(currency.value),
    }));

  console.log("Monedas finales para tasas:", [...currenciesForRates]);
};

// Agrega este watcher para detectar cambios en la currency:
// watch(
//   () => outcomesStore.formPO.currency,
//   (newCurrency, oldCurrency) => {
//     if (newCurrency && oldCurrency && newCurrency._id !== oldCurrency._id) {
//       initializeLines();
//     }
//   },
//   { deep: true }
// );

onBeforeUnmount(() => {
  document.removeEventListener("click", handleClickOutside);
});

// Computed
const usedIds = computed(() => {
  const ids = new Set();

  outcomesStore.formPO?.lines?.forEach((line) => {
    if (Array.isArray(line.taxes)) {
      line.taxes.forEach((tax) => ids.add(tax));
    }
  });

  return Array.from(ids);
});
const closedLines = computed(() => {
  if (outcomesStore.formPO.lines.length === 0) return false;
  return outcomesStore.formPO.lines.some((line) => line.isClosedLine);
});

// Functions
const nextStep = () => {
  emit("changeStep", true);
};
const backStep = () => {
  emit("changeStep", false);
};
const createPurchase = async () => {
  if (outcomesStore.formPO.processing) return;
  if (taxes?.total?.number === 0) return;

  try {
    globalStore.loading = true;
    outcomesStore.formPO.processing = true;
    // Construir body
    outcomesStore.formPO.numbers = taxes.value;
    outcomesStore.formPO.income = null;
    outcomesStore.formPO.taxes = taxes.value.taxes;
    outcomesStore.formPO.othersCurrency =
      outcomesStore.formPO.othersCurrency.map((c) => {
        let currency = {
          ...c,
          currency: c._id,
          valueToday: Number(c.valueToday),
          valueManual: Number(c.valueManual),
        };
        delete currency._id;
        return currency;
      });
    outcomesStore.formPO.lines = outcomesStore.formPO.lines.map((l) => ({
      ...l,
      numbers: {
        amount1: { ...l.numbers.amount1 },
        amount2: { ...l.numbers.amount2 },
        amount3: { ...l.numbers.amount3 },
        budget: { ...l.numbers.budget },
        sumBudget: { ...l.numbers.sumBudget },
        toSpend: { ...l.numbers.toSpend },
        taxes: { ...l.numbers.taxes },
        total: { ...l.numbers.total },
      },
    }));

    let body = outcomesStore.formPO;
    if (outcomesStore.formPO.type === "FXR") body.documentType = null;
    const resp = await outcomesStore.createPO(body);
    if (resp) {
      if (!props.config?.income) await outcomesStore.getAllOutcomes();
      else emit("updateTableGrid");
      await outcomesStore.getMetricsOutcomes("projects");
      nextStep();
    }
  } catch (error) {
    console.error(error);
  } finally {
    globalStore.loading = false;
    outcomesStore.formPO.processing = false;
  }
};
const taxApplied = (tax, amount) => {
  const { value, retention } = tax;
  let factor = 1;
  factor = value / 100;
  return amount * factor;
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
// const updatedLine = (data) => {
//   outcomesStore.formPO.lines[data.posLine] = data;
//   delete outcomesStore.formPO.lines[data.posLine].posLine ;
// }
const deselectLines = (pos) => {
  outcomesStore.formPO.lines.splice(pos, 1);
  getCurrenciesEXR();
};
const getPurchaseValue = (line) => {
  const data = line.numbers;
  const unit = data.amount1.number;
  const qty = data.amount2.number;
  const ot = data.amount3.number;
  const price = data.budget.number;
  const result = unit * qty * (ot || 1) * price;
  return result;
};
const getButtonDistanceFromDivLeft = (divId, buttonId) => {
  const div = document.getElementById(divId);
  const button = document.getElementById(buttonId);

  if (!div || !button) {
    console.error("Div o botón no encontrados");
    return 0;
  }

  const divRect = div.getBoundingClientRect();
  const buttonRect = button.getBoundingClientRect();

  const distance = buttonRect.left - divRect.left;

  return Math.round(distance) + "px";
};
const handleClickOutside = (event) => {
  const dropdown = document.querySelector(".exchangeRate");
  const btn = document.querySelector(".buttonOC_step3");
  if (
    dropdown &&
    btn &&
    !dropdown.contains(event.target) &&
    !btn.contains(event.target)
  ) {
    showMenuERX.value = false;
  }
};
</script>

<template>
  <div class="step3" @keydown.enter.prevent>
    <div class="step3__header" id="headerOC_step3">
      <div class="step3__header-box">
        <span>{{
          t(module + ".title", { type: outcomesStore.formPO.typeName })
        }}</span>
      </div>
      <div class="step3__header-box-der">
        <div class="containerCurrencies" id="headerId">
          <DialogPOCreatorComponentsListExchangeRate
            @recalculateTable="initializeLines"
          />
          <DialogPOCreatorComponentsBtnExchange
            class="buttonERX"
            @click="showCurrencies = !showCurrencies"
          />
          <DialogPOCreatorComponentsExchangeRate
            :show-menu="showCurrencies"
            classNameBtn="buttonERX"
            @recalculateTable="initializeLines"
            @realoadGetCurrencies="getCurrenciesEXR"
            @closeMenu="showCurrencies = false"
          />
          <!--OLD EXCHANGE RATE-->
          <!-- <DialogPOCreatorComponentsBtnExchangeOld
            class="btnExchange"
            @click="showCurrencies = !showCurrencies"
          />
          <DialogPOCreatorComponentsExchangeRateOld
            :show-menu="showCurrencies"
            classNameBtn="btnExchange"
            @recalculateTable="initializeLines"
            @realoadGetCurrencies="getCurrenciesEXR"
            @closeMenu="showCurrencies = false"
          /> -->
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
    </div>
    <div class="step3__body" v-show="autoCacl">
      <OutcomesTablesGrid
        ref="gridRef"
        :lines="outcomesStore.formPO.lines"
        :taxes="taxes"
        :availableTaxes="
          outcomesStore.formPO.type !== 'FXR' ? availableTaxes : []
        "
        :config="config"
        :updateBackend="false"
        :currency="outcomesStore.formPO.currency"
        :autoCalc="true"
        :buyModal="true"
        @deselect="deselectLines"
      />
      <div class="foot">
        <span class="alert" v-if="closedLines">{{
          t(module + ".msg.closedLines")
        }}</span>
        <OutcomesTablesTaxes
          :taxes="taxes"
          :usedIds="usedIds"
          :single="true"
          :onlyTotal="outcomesStore.formPO.type === 'FXR'"
          :filter-taxes="true"
        />
      </div>
    </div>
    <div class="step3__footer">
      <u-button
        :text="t(buttons + '.back')"
        type="outlined"
        class="mainBtnModify"
        @action-btn="backStep"
        size="s"
      />
      <u-button
        :text="t(buttons + '.create') + ' ' + outcomesStore.formPO.typeName"
        class="mainBtnModifyCreate"
        @click="createPurchase"
        size="s"
        :disabled="taxes?.total?.number === 0 || closedLines"
      />
    </div>
  </div>
</template>

<style scoped>
.step3 {
  width: 100%;
  height: auto;
  display: grid;
  grid-template-rows: 40px auto 40px;
  gap: 16px;
}

/* header */
.step3__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 40px;
  width: 100%;
}
.step3__header-box {
  display: flex;
  align-items: center;
  gap: 16px;
  position: relative;
  z-index: 2;
}

.step3__header-box-der {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 16px;
  position: relative;
  z-index: 2;
}

.containerCurrencies {
  display: flex;
  justify-content: center;
  position: relative;
  gap: 16px;
}

.step3__header span {
  font-size: 16px;
  font-weight: 600;
  line-height: 20px;
  letter-spacing: 0em;
  text-align: left;
  color: var(--neutral-text-body);
}

/* body */
.step3__body {
  width: calc(85vw - 80px);
  overflow: hidden;
  height: auto;
  min-height: 35dvh;
  display: grid;
  grid-template-rows: 1fr auto;
  gap: 24px;
}

/* footer */
.step3__footer {
  width: 100%;
  height: 40px;
  display: flex;
  justify-content: space-between;
  padding-top: 10px;
}

.noData {
  color: var(--neutral-text-caption) !important;
  height: 40px;
  font-size: 14px !important;
  line-height: 14px !important;
  width: 100%;
  text-align: center !important;
  padding-top: 18px;
}

.foot {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.foot span.alert {
  font-size: 14px;
  line-height: 14px;
  font-weight: 600;
  color: var(--danger-text-default);
}

/* CUSTOM COMPONENTS - MODIFY */
.btnIconModify {
  border-radius: 50%;
  color: var(--bg-neutral-500);
}

.mainBtnModify {
  width: 135px;
}
.mainBtnModifyCreate {
  width: 175px;
}
</style>
