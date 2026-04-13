<script setup>
import useOutcomesStore from "@/stores/outcomes";
import useGlobalStore from "@/stores/global";

// Stores
const outcomesStore = useOutcomesStore();
const globalStore = useGlobalStore();

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
const module = "modules.outcomes.pages.oc.modals.addLines.step2";
const buttons = "modules.outcomes.pages.oc.modals.addLines.step2.buttons";
const config = {
  width: "85vw",
  modal: true,
  maxHeight: "calc(85vh - 363px)",
  columns: {
    checkbox: false,
    code: true,
    name: true,
    origin: true,
    quantity: true,
    days: true,
    ot: true,
    price: true,
    total: true,
    totalAction: outcomesStore.formAddLines.type !== "FXR",
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

// onMounted
onMounted(() => {
  // Calcular la posicion del exchangeRate
  exchangeRateX.value = getButtonDistanceFromDivLeft("headerOC_step3","buttonOC_step3");
  document.addEventListener("click", handleClickOutside);

  // Obetner el documentType actual
  let documentType = outcomesStore.documentTypes.find(
    (item) => item._id == outcomesStore.formAddLines.documentType
  );

  // Impuestos disponibles
  if (outcomesStore.formAddLines.type === "FXR") {
    availableTaxes.value = [];
    // Limpiar impuestos por defecto - LOS FXR NO TIENEN IMPUESTOS
    if (documentType) documentType.taxDefault = [];
  } else {
    availableTaxes.value = JSON.parse(JSON.stringify(documentType?.taxes || []));
  }

  // Currency Actual
  const currency = outcomesStore.formAddLines.currency;

  // Taxes por defecto
  const taxesDefault = documentType?.taxDefault || [];

  // Currnecies usadas
  const idsCurrencies = new Set();

  outcomesStore.formAddLines.lines.forEach((line) => {
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

    // Obtener la id de las monedas usadas por income
    if(line.currency) idsCurrencies.add(line.currency);
  });

  // Obtener las monedas usadas por income
  getUsedCurrencies(idsCurrencies);

  setTimeout(() => {
    autoCacl.value = true;
  }, 0);
});
onBeforeUnmount(() => {
  document.removeEventListener("click", handleClickOutside);
});

// Functions
const getUsedCurrencies = (idsCurrencies) => {
  outcomesStore.formAddLines.othersCurrency = [];
  idsCurrencies.forEach(idC => {
    const currency = outcomesStore.formAddLines.currencies.find(c => c._id === idC);
    if(currency && currency?._id !== outcomesStore?.formAddLines?.currency?._id) {
      outcomesStore.formAddLines.othersCurrency.push({ ...currency, valueToday: currency.value, valueManual: currency.value });
    }
  })
};
const backStep = () => {
  emit("changeStep", false);
};
const addLinesPO = async () => {
  if (taxes?.total?.number !== 0) {
    try {
      globalStore.loading = true;
      outcomesStore.formAddLines.processing = true;
      // Construir body
      let newLines = {
          documentType: outcomesStore.outcome.documentType,
          outcome: outcomesStore.outcome._id,
          lines: outcomesStore.formAddLines.lines,
          numbers: { ...outcomesStore.outcome.numbers },
          observation: outcomesStore.outcome.observation,
          reference: outcomesStore.outcome.reference,
          supplier: { ...outcomesStore.outcome.supplier },
          type: outcomesStore.outcome.type,
          othersCurrency: outcomesStore.formAddLines.othersCurrency.map(oth => { 
            let othCuttency = { ...oth, currency: oth._id };
            delete othCuttency._id;
            return othCuttency;
           })
        };
    
        const { data } = await outcomesStore.addLineOutcomeManyWithCurrency(newLines);
    
        outcomesStore.outcome = data.outcome;
        const total = outcomesStore.outcome.numbers.total.value;
        emit("updateMetrics", total);
    
        emit("updatedTable");
        emit("closeModal");

    } catch (error) {
      console.error(error);
    } finally {
      globalStore.loading = false;
      outcomesStore.formAddLines.processing = false;
    }
  }
};
const taxApplied = (tax, amount) => {
  const { value, retention } = tax;
  let factor = 1;
  // Si es retencion
  // if (retention) {
  //   factor = (value / 100) * -1;
  // }
  // // No es Retencion
  // else {
  // }
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
const deselectLines = (pos) => {
  outcomesStore.formAddLines.lines.splice(pos, 1);

  getUsedCurrencies(new Set(outcomesStore.formAddLines.lines.map(l => l.currency)));
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

  return Math.round(distance) + 'px';
};
const handleClickOutside = (event) => {
  const dropdown = document.querySelector(".exchangeRate");
  const btn = document.querySelector(".buttonOC_step3");
  if (dropdown && btn && !dropdown.contains(event.target) && !btn.contains(event.target)) {
    showMenuERX.value = false;
  }
};
</script>

<template>
  <div class="step3">
    <div class="step3__header" id="headerOC_step3">
      <div class="step3__header-box">
        <span>{{ t(module + '.title') }}</span>
        <u-button type="outlined" size="s" :text="t(buttons + '.exchangeRate')" :color="color" icon="edit" class="buttonOC_step3" id="buttonOC_step3" @click="showMenuERX = !showMenuERX" />
        <div class="exchangeRate">
          <div class="exhangeRate__list">
            <div class="exchangeRate__op" v-for="currency in outcomesStore.formAddLines.othersCurrency" :key="currency._id">
              <div class="tag"><span>{{ currency?.code || "-" }}</span></div>
              <span class="label">{{ currency?.name?.[globalStore.lang] || "-" }}</span>
              <input v-model="currency.valueManual" :disabled="true" type="number" @focus="$event.target.select()" >
            </div>
            <span v-if="outcomesStore.formAddLines.othersCurrency.length === 0" class="noData">{{ t(module + '.msg.noData') }}</span>
          </div> 
        </div>
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
    <div class="step3__body" v-show="autoCacl">
      <OutcomesTablesGrid
        :lines="outcomesStore.formAddLines.lines"
        :taxes="taxes"
        :availableTaxes="
          outcomesStore.formAddLines.type !== 'FXR' ? availableTaxes : []
        "
        :config="config"
        :updateBackend="false"
        :currency="outcomesStore.formAddLines.currency"
        :autoCalc="true"
        :buyModal="true"
        @deselect="deselectLines"
      />
      <OutcomesTablesTaxes
        :taxes="taxes"
        :single="true"
        :onlyTotal="outcomesStore.formAddLines.type === 'FXR'"
      />
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
        :text="t(buttons + '.add') + ' '"
        class="mainBtnModifyCreate"
        @click="addLinesPO"
        size="s"
        :disabled="taxes?.total?.number === 0"
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
  width: 85vw;
  overflow: hidden;
  height: auto;
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

/* Exchange Rate */
.exchangeRate {
  width: 320px;
  height: auto;
  position: absolute;
  background-color: var(--neutral-background-default);
  border-radius: 12px;
  box-shadow: var(--elevation-l);
  top: 32px;
  left: v-bind("exchangeRateX");
  padding: 16px;
  transform-origin: top left;
  transform: scale(v-bind("showMenuERX ? 1 : 0"));
  transition: 0.3s;
}
.exhangeRate__list {
  display: grid;
  row-gap: 12px;
  overflow: auto;
  width: 288px;
  max-height: 170px;
  padding-right: 2px;
}
.exhangeRate__list::-webkit-scrollbar {
    width: 8px;
    height: 8px;
}
.exhangeRate__list::-webkit-scrollbar-thumb {
    background-color: var(--neutral-border-subtle);
    border-radius: 5px;
}
.exhangeRate__list::-webkit-scrollbar-track {
    background-color: var(--neutral-border-darker);
    border-radius: 5px;
}
.exchangeRate__op {
  display: grid;
  grid-template-columns: auto 1fr 100px;
  gap: 12px;
  align-items: center;
}
.exchangeRate__op div.tag {
  height: 24px;
  border: 1px solid var(--secondary-border-subtle);
  border-radius: 8px;
  background-color: var(--secondary-surface-softer);
  display: flex;
  align-items: center;
  padding: 0 4px;
}
.exchangeRate__op div.tag span {
  font-weight: 600;
  font-size: 14px;
  line-height: 14px;
  letter-spacing: 0%;
  vertical-align: middle;
  color: var(--secondary-text-darker);
}
.exchangeRate__op span.label {
  font-weight: 600;
  font-size: 12px;
  line-height: 12px;
  letter-spacing: 0%;
  vertical-align: middle;
  color: var(--neutral-text-body)
}
.exchangeRate__op input {
  border: 1px solid var(--neutral-border-subtle);
  border-radius: 8px;
  transition: 0.3s;
  font-weight: 400;
  font-size: 14px;
  line-height: 14px;
  letter-spacing: 0%;
  vertical-align: middle;
  color: var(--neutral-text-body);
  text-align: end;
  padding: 0 8px;
}
.exchangeRate__op input:hover {
  border: 1px solid var(--primary-border-subtle);
}
.exchangeRate__op input[type=number]::-webkit-inner-spin-button,
.exchangeRate__op input[type=number]::-webkit-outer-spin-button {
  -webkit-appearance: none;
  margin: 0;
}
.exchangeRate__op input::selection {
  background-color: var(--primary-text-subtle);
  color: var(--neutral-background-default);
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
