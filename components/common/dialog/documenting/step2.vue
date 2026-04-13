<script setup>
import { defineEmits, ref, onBeforeMount, onBeforeUnmount } from "vue";
import useOutcomesStore from "@/stores/outcomes";
import useOrganizationStore from "@/stores/organization";
import useGlobalStore from "@/stores/global";

// Stores
const organizationStore = useOrganizationStore();
const outcomesStore = useOutcomesStore();
const globalStore = useGlobalStore();

// Emits
const emit = defineEmits([
  "closeModal",
  "changeStep",
  "updatedType",
  "updateTable",
  "updateMetrics",
  "updateTableGrid",
  "documenting",
  "updatedTable",
]);

// Props
const props = defineProps({
  fromCreatePO: {
    type: Boolean,
    default: false,
  },
  config: {
    type: Object,
    default: () => ({}),
  },
});

// Constants
const color = "--neutral-text-caption";
const { t } = useI18n();
const module = "modules.outcomes.pages.oc.modals.documenting.step2";
// const module = "modules.outcomes.pages.oc.modals.buy.step3";
const buttons = "modules.outcomes.pages.oc.modals.documenting.buttons";
const config = {
  width: "calc(85vw - 80px)",
  modal: true,
  maxHeight: "calc(85vh - 363px)",
  columns: {
    checkbox: false,
    code: true,
    name: true,
    origin: true,
    quantity: false,
    days: false,
    ot: false,
    price: false,
    total: true,
    totalAction: false,
    documented: true,
    documentedAction: false,
    toDocument: true,
    toDocumentAction: true,
  },
};
const { params } = useRoute();
const autoCacl = ref(false);
const exchangeRateX = ref("0px");
const showMenuERX = ref(false);
const showCurrencies = ref(false);
const gridRef = ref(null);

const initializeLines = () => {
  // Obtener el documentType actual
  let documentType = outcomesStore.documentTypes.find(
    (item) => item._id == outcomesStore.formDocumenting.documentType,
  );

  // Currency Actual del documento
  const currency = outcomesStore.formDocumenting.currency;

  // Taxes por defecto del tipo de documento
  const taxesDefault = documentType?.taxDefault || [];

  outcomesStore.formDocumenting.lines.forEach((line) => {
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

    // Inicializar toDocument si no existe
    line.numbers.toDocument = formatData(0, currency);

    // Si la línea tiene un valor documentado previo, usar ese como base
    // De lo contrario, usar el valor pendiente por documentar
    // const baseAmount = line.numbers.toDocument?.number ||
    //                    line.numbers.sumBudget?.number ||
    //                    0;

    // Actualizar el valor a documentar
    // line.numbers.toDocument = formatData(baseAmount, currency);

    // // Si no tiene income (aunque debería venir de la OC)
    // if (typeof line.income !== "object") {
    //   line.income = {
    //     _id: props?.config?.income,
    //     name: props?.config?.mov?.name,
    //     project: {
    //       _id: props?.config?.mov?.projectId,
    //       name: props?.config?.mov?.project,
    //     },
    //   };
    // }

    // Agregar impuestos por defecto ya calculados sobre el valor a documentar
    documentType?.taxDefault?.forEach((tax) => {
      const itemTax = documentType.taxes.find((item) => item._id === tax);
      if (itemTax) {
        const calc = taxApplied(
          itemTax,
          line?.numbers?.toDocument?.number || 0,
        );
        const total = formatData(calc, currency);

        line.numbers.taxes.push({
          tax: itemTax._id,
          name: itemTax.name,
          retention: itemTax.retention,
          value: itemTax.value,
          isEditTax: itemTax?.surchargesDocumentType?.field === "editValue",
          total,
          select: true,
          manuallyEdited: false,
        });
      }
    });

    // Calcular taxes con la función del grid
    if (gridRef.value) {
      gridRef.value.calcTax(line, currency);
      gridRef.value.calculateTotals();
    }
  });
};
const getCurrenciesEXR = () => {
  const currencyOrg = organizationStore?.organization?.currency?._id; // Moneda de la organizacion
  const currencyDefaultId = outcomesStore?.formDocumenting?.currency?._id; // Moneda por defecto
  const currentLines = outcomesStore?.formDocumenting?.lines || []; // Lineas actuales
  const currencies = outcomesStore?.formDocumenting?.currencies; // Todas las monedas
  // Moneda de la OC o FXR
  const fallbackDefaultId = outcomesStore?.outcome?.currency?.default?._id;

  const linesCurrencies = [
    ...new Set(
      currentLines
        .map((line) => line?.outcome?.currency?.default)
        .filter(Boolean),
    ),
  ];

  console.log("lines currencies", linesCurrencies);

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

  // 3. Incluir la moneda de la OC o FXR
  if (fallbackDefaultId && !currenciesForRates.has(fallbackDefaultId)) {
    currenciesForRates.add(fallbackDefaultId);
  }

  // Construir othersCurrency
  const normalizeToNumber = (value) => {
    if (value === null || value === undefined || value === "") return 0;

    return Number(value.replace(",", ""));
  };

  outcomesStore.formDocumenting.othersCurrency = currencies
    .filter((currency) => currenciesForRates.has(currency._id))
    .map((currency) => ({
      ...currency,
      valueToday: normalizeToNumber(currency.value),
      valueManual: normalizeToNumber(currency.value),
    }));

  console.log("currencies for rates", currenciesForRates);
};

// BeforeMount
onBeforeMount(() => {
  window.addEventListener("keydown", handleEscapeKey);

  // Calcular la posición del exchangeRate
  setTimeout(() => {
    exchangeRateX.value = getButtonDistanceFromDivLeft(
      "headerStep2",
      "buttonStep2",
    );
  }, 0);

  document.addEventListener("click", handleClickOutside);

  let documentType = outcomesStore.documentTypes.find(
    (item) => item._id == outcomesStore.formDocumenting.documentType,
  );

  // Se agregan los impuestos de la orgnización, ahora ya no se usan si no los de la lineas
  // if (outcomesStore.formDocumenting.taxes.length) {
  //   outcomesStore.formDocumenting.lines.forEach((line) => {
  //     line.numbers.taxes = [];

  //     // 1. Agregar impuestos de la línea
  //     line.taxes.forEach((tax) => {
  //       const itemTax = documentType?.taxes.find((item) => item._id === tax);
  //       if (itemTax) {
  //         const calc = taxApplied(
  //           itemTax,
  //           line?.numbers?.toDocument?.number || 0
  //         );
  //         const total = formatData(
  //           calc,
  //           outcomesStore.formDocumenting.currency
  //         );

  //         line.numbers.taxes.push({
  //           tax: itemTax._id,
  //           name: itemTax.name,
  //           retention: itemTax.retention,
  //           value: itemTax.value,
  //           total,
  //           select: true,
  //         });
  //       }
  //     });

  //     // 2. Agregar impuestos por defecto que faltan en la línea
  //     if (documentType?.taxDefault?.length) {
  //       const missingTaxes = documentType.taxDefault.filter(
  //         (defaultTaxId) => !line.taxes.includes(defaultTaxId)
  //       );

  //       missingTaxes.forEach((tax) => {
  //         line.taxes.push(tax);
  //         const itemTax = documentType.taxes.find((item) => item._id === tax);
  //         if (itemTax) {
  //           const calc = taxApplied(
  //             itemTax,
  //             line?.numbers?.toDocument?.number || 0
  //           );
  //           const total = formatData(
  //             calc,
  //             outcomesStore.formDocumenting.currency
  //           );

  //           line.numbers.taxes.push({
  //             tax: itemTax._id,
  //             name: itemTax.name,
  //             retention: itemTax.retention,
  //             value: itemTax.value,
  //             total,
  //             select: true,
  //           });
  //         }
  //       });
  //     }
  //   });
  // }

  // Convertir el total de las compras si la currency del form document es diferente
  if (
    outcomesStore.formDocumenting.currency._id !==
    outcomesStore.outcome.currency.default._id
  ) {
    const otherCurrencyDefault =
      outcomesStore.formDocumenting.othersCurrency.find(
        (c) => c._id === outcomesStore.outcome.currency.default._id,
      );

    const rate = Number(otherCurrencyDefault?.value.replace(/,/g, ""));

    outcomesStore.formDocumenting.totalOutcomeConverted = Number(
      (rate * outcomesStore.outcome.numbers.totalNet.number).toFixed(2),
    );
  }

  setTimeout(() => {
    autoCacl.value = true;
  }, 10);
});

onMounted(() => {
  outcomesStore.formDocumenting.backStep = false;

  getCurrenciesEXR();
});

onBeforeUnmount(() => {
  window.removeEventListener("keydown", handleEscapeKey);
  document.removeEventListener("click", handleClickOutside);
});

const handleEscapeKey = (event) => {
  if (event.key === "Escape" || event.key === "Esc") {
    if (!outcomesStore.formDocumenting.processing) emit("closeModal");
  }
};

const handleClickOutside = (event) => {
  const dropdown = document.querySelector(".exchangeRate");
  const btn = document.querySelector(".buttonStep2");
  if (
    dropdown &&
    btn &&
    !dropdown.contains(event.target) &&
    !btn.contains(event.target)
  ) {
    showMenuERX.value = false;
  }
};

// Functions
const createDocument = async () => {
  if (!blockDocument.value) {
    try {
      outcomesStore.formDocumenting.processing = true;
      globalStore.loading = true;

      let body = {
        // Currency,
        currency: outcomesStore.formDocumenting.currency,

        // othersCurrency
        othersCurrency:
          outcomesStore?.formDocumenting?.othersCurrency.map((c) => {
            return {
              ...c,
              currency: c._id,
            };
          }) || [],

        // Document
        documentType: outcomesStore.formDocumenting.documentType,

        // Preguntar de estos, son lo mismo
        documentNumber: outcomesStore.formDocumenting.documentNumber,
        idNumber: outcomesStore.formDocumenting.documentNumber,

        // Preguntar para que es
        documentTypeBlock: true,
        mode: "Searching",

        // Dates
        dueDate: outcomesStore.formDocumenting.dateIssue, // Preguntar el dueDate
        issueDate: outcomesStore.formDocumenting.dateIssue,
        receiptDate: outcomesStore.formDocumenting.dateReceipt,

        // Lines
        lines: outcomesStore.formDocumenting.lines
          .filter((l) => l.numbers.toDocument.number !== 0)
          .map((l) => ({
            ...l,
            numbers: {
              amount1: { ...l.numbers.amount1 },
              amount2: { ...l.numbers.amount2 },
              amount3: { ...l.numbers.amount3 },
              budget: { ...l.numbers.budget },
              sumBudget: { ...l.numbers.sumBudget },
              taxes: { ...l.numbers.taxes },
              toDocument: { ...l.numbers.toDocument },
              total: { ...l.numbers.total },
            },
          })),

        // Numbers
        numbers: outcomesStore.formDocumenting.numbers,

        // Observation ya no existe
        onservation: "",

        // Outomces (mejorar esto, debe ser dinamico y multiple)
        outcomes: [outcomesStore.outcome._id],

        // PaymentTerm
        paymentTerm: outcomesStore.formDocumenting.paymentTerm,

        // File
        primaryFile: null,

        // Referencia
        reference: outcomesStore.formDocumenting.reference,

        // Supplier
        supplier: outcomesStore.formDocumenting.supplier,

        // Taxes
        taxes: outcomesStore.formDocumenting.taxes,

        // Preguntar si sigue esto
        subTotal: { value: "$0. 00", number: 0 },
        totalWithTaxes: { value: "$0. 00", number: 0 },
        validations: {
          maxMount: outcomesStore.formDocumenting.numbers.total.number,
        },
        maxMount: outcomesStore.formDocumenting.numbers.total.number,
      };

      body.supplier._id =
        outcomesStore?.formDocumenting?.supplier?.contact?._id ||
        outcomesStore?.formDocumenting?.supplier?._id;

      const resp = await outcomesStore.createDocument(body);
      if (resp.success) {
        const idOC = outcomesStore?.outcome?._id;
        await outcomesStore.getLinesOutcome(idOC);
        await outcomesStore.get_outcomes(idOC);
        await outcomesStore.getMetricsOutcomes("projects");
        if (outcomesStore.formDocumenting.primaryFile instanceof File) {
          const file = outcomesStore.formDocumenting.primaryFile;
          await outcomesStore.uploadDocumentFile(
            resp.data._id,
            file,
            "primary",
          );
        }

        // Revisar
        if (props.fromCreatePO) {
          if (!props.config?.income) await outcomesStore.getAllOutcomes();
          else emit("updateTableGrid");
        } else {
          emit("updateTable");
        }
        emit("closeModal");
        const total = outcomesStore?.outcome?.numbers?.documented?.value ?? "";
        emit("updateMetrics", { total, section: "documents" });
        emit("updatedTable", true);
      }
    } catch (error) {
      console.error(error);
    } finally {
      globalStore.loading = false;
      outcomesStore.formDocumenting.processing = false;
    }
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

// Computed
const usedIds = computed(() => {
  const idsTaxes = new Set();
  outcomesStore.formDocumenting.lines.forEach((line) => {
    line.taxes.forEach((tax) => {
      idsTaxes.add(tax);
    });
  });
  return Array.from(idsTaxes);
});

const supplier = computed(() => {
  return {
    name: outcomesStore?.formDocumenting?.supplier?.data?.legalName || "-",
    src: outcomesStore?.formDocumenting?.supplier?.imgUrl,
  };
});

const amountExceeded = computed(() => {
  if (outcomesStore.outcome.type === "FXR") return false;

  if (
    outcomesStore?.formDocumenting?.numbers?.total?.number >
    outcomesStore.outcome.numbers?.total?.number
  ) {
    return true;
  }
  if (
    outcomesStore?.formDocumenting?.numbers?.totalNet?.number >
    outcomesStore.outcome.numbers?.totalNet?.number
  ) {
    return true;
  }
  return false;
});
// Cuando se cambia la moneda
// const amountExceeded = computed(() => {
//   const {
//     outcome,
//     formDocumenting
//   } = outcomesStore;

//   const isDifferentCurrency =
//     outcome.currency.default._id !== formDocumenting.currency._id;

//   const limit = isDifferentCurrency
//     ? formDocumenting.totalOutcomeConverted
//     : outcome.numbers.totalNet.number;

//   const { total, totalNet } = formDocumenting.numbers || {};

//   return total?.number > limit || totalNet?.number > limit;
// });

const title = computed(() => {
  const { documentTypeName, documentNumber } = outcomesStore?.formDocumenting;
  return documentTypeName + " N° " + documentNumber;
});

const blockDocument = computed(() => {
  const hasNonZeroLine = outcomesStore?.formDocumenting?.lines?.some(
    (l) => l.numbers.toDocument.number !== 0,
  );
  if (hasNonZeroLine) {
    return (
      outcomesStore?.formDocumenting?.numbers?.total?.number === 0 ||
      (outcomesStore.outcome.type === "OC" && amountExceeded.value)
    );
  }
  return true;
});

const backStep = () => {
  outcomesStore.formDocumenting.backStep = true;
  if (props.fromCreatePO) {
    emit("documenting", 1);
  } else {
    emit("changeStep", false);
  }
};
</script>

<template>
  <div class="step2">
    <div class="step2__header" id="headerStep2">
      <div class="step2__header-box">
        <span v-text="t(module + '.title')"></span>
        <!-- <u-button 
          type="outlined" 
          size="s" 
          text="Tasa de cambio" 
          :color="color" 
          icon="edit" 
          class="buttonStep2" 
          id="buttonStep2" 
          @click="showMenuERX = !showMenuERX" 
        />
        <div class="exchangeRate">
          <div class="exhangeRate__list">
            <div class="exchangeRate__op" v-for="currency in outcomesStore.formDocumenting.othersCurrency" :key="currency._id">
              <div class="tag"><span>{{ currency?.code || "-" }}</span></div>
              <span class="label">{{ currency?.name?.[globalStore.lang] || "-" }}</span>
              <input v-model="currency.valueManual" type="number"  @focus="$event.target.select()"  >
            </div>
            <span v-if="outcomesStore.formDocumenting.othersCurrency.length === 0" class="noData">{{ t( 'modules.outcomes.pages.oc.modals.buy.step3.msg.noData') }}</span>
          </div> 
        </div> -->
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
        <div class="step2__body-header-snippet">
          <span v-text="title"></span>
          <span v-text="supplier.name"></span>
          <u-avatar :user="supplier" :size="24" class="avatar" />
        </div>
        <div class="step2__body-header-metrics" style="display: none">
          <div class="metric">
            <span class="u u-info-circle"></span>
            <span v-text="t(module + '.metrics.subTotal')"></span>
            <span>$ 100.000</span>
          </div>
          <div class="metric">
            <span class="u u-info-circle"></span>
            <span v-text="t(module + '.metrics.taxes')"></span>
            <span>$ 19.000</span>
          </div>
          <div class="metric">
            <span class="u u-info-circle"></span>
            <span v-text="t(module + '.metrics.retention')"></span>
            <span>$ 0</span>
          </div>
          <div class="metric">
            <span class="u u-success-outlined"></span>
            <span v-text="t(module + '.metrics.total')"></span>
            <span>$ 119.000</span>
          </div>
        </div>
        <div class="containerCurrencies" id="headerId">
          <DialogDocumentingComponentsListExchangeRate
            v-if="outcomesStore.outcome.type === 'FXR'"
            @recalculateTable="initializeLines"
          />
          <DialogDocumentingComponentsBtnExchange
            class="buttonERX"
            @click="showCurrencies = !showCurrencies"
          />
          <DialogDocumentingComponentsExchangeRate
            v-if="outcomesStore.outcome.type === 'FXR'"
            :show-menu="showCurrencies"
            classNameBtn="buttonERX"
            @recalculateTable="initializeLines"
            @realoadGetCurrencies="getCurrenciesEXR"
            @closeMenu="showCurrencies = false"
          />
        </div>
      </div>
      <OutcomesTablesGrid
        v-if="autoCacl"
        ref="gridRef"
        :lines="outcomesStore.formDocumenting.lines"
        :availableTaxes="outcomesStore.formDocumenting.taxes"
        :taxes="outcomesStore.formDocumenting.numbers"
        :config="config"
        :updateBackend="false"
        :currency="outcomesStore.formDocumenting.currency"
        :autoCalc="true"
        :toDocument="true"
        :buyModal="true"
      />
      <div class="step2__body-table_taxes">
        <div class="alert" v-if="amountExceeded">
          <span class="u u-info-circle"></span>
          <span v-text="t(module + '.msg.invalid')"></span>
        </div>
        <OutcomesTablesTaxes
          :taxes="outcomesStore.formDocumenting.numbers"
          :autoCalc="true"
          :single="true"
          :filterTaxes="true"
          :usedIds="usedIds"
        />
      </div>
    </div>
    <div class="step2__footer">
      <u-button
        :text="t(buttons + '.back')"
        type="outlined"
        class="mainBtnModify"
        @click="backStep"
        size="s"
      />
      <u-button
        :text="t(buttons + '.toDocument')"
        class="mainBtnModify"
        @click="createDocument"
        :disabled="blockDocument"
        size="s"
      />
    </div>
  </div>
</template>

<style scoped>
.step2 {
  width: 100%;
  height: auto;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* header */
.step2__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 40px;
  width: 100%;
}

.step2__header-box {
  display: flex;
  align-items: center;
  gap: 16px;
  position: relative;
  z-index: 2;
}

.containerCurrencies {
  display: flex;
  justify-content: center;
  position: relative;
  z-index: 2;
  gap: 16px;
}

.step2__header span {
  font-size: 16px;
  font-weight: 600;
  line-height: 20px;
  letter-spacing: 0em;
  text-align: left;
  color: var(--neutral-text-body);
}

/* body */
.step2__body {
  height: auto;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.step2__body-header {
  height: 58px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
}

.alert {
  display: grid;
  grid-template-columns: auto 1fr;
  width: max-content;
  border: 1px solid var(--warning-border-default);
  border-radius: 10px;
  padding: 0 10px;
  box-sizing: border-box;
  gap: 15px;
  align-items: center;
  height: 48px;
}

.alert span:nth-child(1) {
  font-size: 28px;
  color: var(--warning-border-default);
}

.alert span:nth-child(2) {
  font-size: 14px;
  line-height: 16px;
  letter-spacing: 0%;
  vertical-align: middle;
  font-weight: 600;
  color: var(--neutral-text-body);
}

.step2__body-header-snippet {
  display: grid;
  grid-template-columns: 24px auto;
  grid-template-areas: "title title" "avatar supplier";
  column-gap: 10px;
  row-gap: 5px;
  align-items: center;
}

.step2__body-header-snippet span:nth-child(1) {
  grid-area: title;
  color: var(--secondary-text-default);
}

.step2__body-header-snippet span:nth-child(2) {
  color: var(--neutral-text-body);
}

.step2__body-header-snippet .avatar {
  grid-area: avatar;
}

.step2__body-header-snippet span:nth-child(3) {
  grid-area: supplier;
  font-weight: 400;
  font-size: 14px;
  line-height: 18px;
  letter-spacing: 0%;
  vertical-align: middle;
  color: var(--neutral-text-caption);
}

.step2__body-header-metrics {
  border-radius: 8px;
  border: 1px solid var(--neutral-border-subtle);
  display: grid;
  grid-template-columns: repeat(4, auto);
  gap: 10px;
  padding: 8px 10px;
}

.step2__body-header-metrics .metric {
  display: grid;
  grid-template-columns: auto minmax(120px, 1fr);
  height: 40px;
  grid-template-areas: "icon title" "icon value";
  column-gap: 10px;
}

.step2__body-header-metrics .metric:not(:first-child) {
  border-left: 1px solid var(--neutral-border-subtle);
  padding-left: 10px;
}

.step2__body-header-metrics .metric span:nth-child(1) {
  grid-area: icon;
  font-size: 24px;
  color: var(--neutral-text-caption);
}
.step2__body-header-metrics .metric span:nth-child(2) {
  grid-area: title;
  font-weight: 600;
  font-size: 14px;
  line-height: 18px;
  letter-spacing: 0%;
  vertical-align: middle;
  color: var(--neutral-text-caption);
}
.step2__body-header-metrics .metric span:nth-child(3) {
  grid-area: value;
  font-weight: 600;
  font-size: 16px;
  line-height: 20px;
  letter-spacing: 0%;
  vertical-align: middle;
  color: var(--neutral-text-body);
}

.step2__body-table {
  width: 100%;
  height: auto;
  min-height: 100px;
  max-height: calc(85vh - 500px);
  overflow: auto;
  gap: 16px;
  position: relative;
  border-radius: 16px;
}

.step2__body-table::-webkit-scrollbar {
  width: 8px;
  height: 8px;
  background: var(--neutral-surface-light);
  border-radius: 20px;
}

.step2__body-table::-webkit-scrollbar-thumb {
  background: var(--neutral-surface-subtle);
  border-radius: 5px;
}

.step2__body-table_taxes {
  display: grid;
  grid-template-columns: 1fr auto;
  column-gap: 10px;
  padding: 10px 0;
}

/* footer */
.step2__footer {
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

/* CUSTOM COMPONENTS - MODIFY */
.btnIconModify {
  border-radius: 50%;
  color: var(--bg-neutral-500);
}

.mainBtnModify {
  width: 135px;
}
</style>
