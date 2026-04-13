<script setup>
import useSalesStore from "@/stores/sales";
import useGlobalStore from "@/stores/global";
import usePaymentsStore from "@/stores/payments";
import useOrganizationStore from "@/stores/organization";
import useOutcomesStore from "@/stores/outcomes";
import { useI18n } from "vue-i18n";

const { t } = useI18n();
const module = "modules.sales.createSale";

const salesStore = useSalesStore();
const globalStore = useGlobalStore();
const paymentsStore = usePaymentsStore();
const organizationStore = useOrganizationStore();
const outcomesStore = useOutcomesStore();

const props = defineProps({
  prevStep: { type: Number, default: null },
});
const emit = defineEmits(["closeModal", "changeStep", "updatePadding"]);

// ── State ────────────────────────────────────────────────────────────────────
const stepsFormData = ref("none");
const paymentsTermns = ref([]);
const paymentsMethods = ref([]);
const refDocReference = ref(null);

// ── Computed ─────────────────────────────────────────────────────────────────

// tiene cliente seleccionado en el paso 1?
const hasSameClient = computed(
  () => !!salesStore.formDocInvoice?.formRegister?.client,
);

// borde si hay cliente seleccionado
const borderLine = computed(() =>
  hasSameClient.value ? "1px solid var(--neutral-border-subtle)" : "none",
);

// titulo del header
const titleHeader = computed(() => {
  const titles = {
    none: "step3.none.titleHeader",
    client: "step3.client.titleHeader",
    invoice: "step3.invoice.titleHeader",
    docReference: "step3.docReference.titleHeader",
  };
  return titles[stepsFormData.value] || "";
});

// ── Client search / selection ─────────────────────────────────────────────────
// Cambiar el cliente
const changeClient = () => {
  salesStore.formDocInvoice.formRegister.client = null;
  stepsFormData.value = "none";
};

// ── Navigation ────────────────────────────────────────────────────────────────
// tiene la misma moneda
const sameCurrency = ref(true);

// navegacion al siguiente paso, si es invoice se traen las monedas antes de avanzar
const nextStepInvoice = async () => {
  globalStore.loading = true;
  let resp = null;

  if (
    !sameCurrency.value ||
    salesStore?.formDocInvoice?.formRegister?.formDataInvoice?.currency?._id !==
      organizationStore?.organization?.currency?._id
  ) {
    const currencyBase =
      salesStore?.formDocInvoice?.formRegister?.formDataInvoice?.currency
        ?._id || null;
    if (currencyBase)
      resp = await globalStore.getMyCurrencies(false, currencyBase);
  } else {
    resp = await globalStore.getMyCurrencies();
  }

  salesStore.formDocInvoice.formRegister.formDataInvoice.currencies = [];
  if (resp) {
    salesStore.formDocInvoice.formRegister.formDataInvoice.currencies =
      resp.currencies;
  }
  globalStore.loading = false;
};

// Necesario para personas deshabilitadas Continuar: la validación de la factura se gestiona dentro del Paso 3 Formulario de Factura
// Lo levantamos aquí para que el pie de página pueda leerlo
const invoiceValidation = ref({ isValidating: false, hasError: false });

const disabledContinue = computed(() => {
  if (stepsFormData.value === "none" && !hasSameClient.value) return true;

  if (stepsFormData.value === "client") {
    const client = salesStore.formDocInvoice?.formRegister?.formDataClient;
    if (!client) return true;
    const requiredFields = ["legalName", "economicActivity"];
    return requiredFields.some((field) => !client[field]?.trim());
  }

  if (stepsFormData.value === "invoice") {
    const invoice = salesStore.formDocInvoice?.formRegister?.formDataInvoice;
    if (!invoice) return true;
    if (
      invoiceValidation.value.hasError ||
      invoiceValidation.value.isValidating
    )
      return true;

    const requiredFields = [
      "reference",
      "invoiceNumber",
      "paymentMethod",
      "paymentCondition",
      "issueDate",
      "expirationDate",
    ];
    // Si estamos enviado al SII, el número de factura no es obligatorio ya que se genera en el SII
    // if (!salesStore.formDocInvoice.invoicing) {
    //   requiredFields.push("invoiceNumber");
    // }
    return requiredFields.some((field) => {
      const value = invoice[field];
      if (field === "paymentCondition" || field === "paymentMethod") {
        return Object.values(value).some((item) => !item);
      }
      return !value?.trim();
    });
  }

  return false;
});

// Verifica si el formulario de documentos referenciados esta lleno
const isDocReferenceFormFilled = computed(() => {
  const {
    typeDocument,
    numberDocument,
    dateDocument,
    amountDocument,
    fileDocument,
  } = salesStore.formDocInvoice.formRegister.formDataDocReference;
  return (
    typeDocument.name !== "" &&
    numberDocument !== "" &&
    dateDocument !== "" &&
    amountDocument?.total?.number !== 0 &&
    fileDocument !== null
  );
});

// Condicion para mostrar el boton de continuar o Crear documento referenciado si no esta editando en el formulario de documentos referenciados
const showContinueButton = computed(() => {
  const editing =
    salesStore.formDocInvoice.formRegister.formDataDocReference.editing;

  return (
    !isDocReferenceFormFilled.value ||
    editing ||
    stepsFormData.value !== "docReference"
  );
});

// Navegacion
const nextStep = async () => {
  if (disabledContinue.value) return;

  if (stepsFormData.value === "invoice") {
    await nextStepInvoice();
  }

  const steps = {
    none: "client",
    client: "invoice",
    invoice: "docReference",
    docReference: () => {
      emit("updatePadding", "24px 48px");
      emit("changeStep", true);
    },
  };

  const next = steps[stepsFormData.value];
  if (typeof next === "function") next();
  else stepsFormData.value = next;
};

const backStep = () => {
  const steps = {
    none: () => {
      salesStore.formDocInvoice.formRegister.client = null;
      emit("changeStep", false);
    },
    client: () => {
      // salesStore.formDocInvoice.formRegister.client = null;
      emit("changeStep", false);
    },
    invoice: "client",
    docReference: "invoice",
  };

  const prev = steps[stepsFormData.value];
  if (typeof prev === "function") prev();
  else stepsFormData.value = prev;
};

const closeStep = () => {
  salesStore.cleanFormDocInvoice();
  emit("closeModal");
};

// Used by DocReference child to add a doc and trigger next
const handleAddDocAndNext = () => {
  // The child adds the document, then we call nextStep if needed
  nextStep();
};

// ── Helpers ───────────────────────────────────────────────────────────────────
// Obtiene el nombre del documento base
const getNameCode = (code) => {
  switch (code) {
    case "invoice":
      return { es: "Documento base", en: "Base Document" };
    default:
      return "";
  }
};

const formatClientBusiness = (client) => {
  if (!client) return null;
  return {
    data: {
      address: client?.contact?.address ?? "",
      idNumber: client?.contact?.data?.idNumber ?? "",
      legalName: client?.contact?.data?.legalName ?? "",
      nickName: client?.contact?.data?.nickName ?? "",
      type: client?.contact?.data?.type ?? "",
      icon: "building",
    },
    email: client?.contact?.email ?? "",
    imgUrl: client?.contact?.imgUrl ?? "",
    _id: client?.contact?._id ?? "",
  };
};

const findDuplicateClient = () => {
  const currentClient = salesStore?.formDocInvoice?.formRegister?.client;
  const business = salesStore?.formDocInvoice?.formRegister?.business;
  if (currentClient?.data?.legalName) return;
  if (!business?.length) return;

  if (business.length === 1) {
    salesStore.formDocInvoice.formRegister.client =
      formatClientBusiness(business[0]?.client) || null;
    return;
  }

  const firstClient = formatClientBusiness(business[0]?.client);
  const allSameClient = business.every(
    (item) =>
      JSON.stringify(item.client?.contact?._id) ===
      JSON.stringify(firstClient?._id),
  );
  salesStore.formDocInvoice.formRegister.client = allSameClient
    ? firstClient
    : null;
};

const setInitialStep = () => {
  if (props.prevStep === 5) {
    stepsFormData.value = "docReference";
  } else if (hasSameClient.value) {
    stepsFormData.value = "client";
  } else {
    stepsFormData.value = "none";
  }
};

const getCurrencyBaseDocument = async () => {
  if (
    salesStore.formDocInvoice.formRegister.formDataInvoice.currencyName !== ""
  )
    return;

  const currentLines = salesStore.formDocInvoice.formRegister.business;
  const sameIdCurrencyLines =
    currentLines.length &&
    currentLines.every(
      (line) =>
        line.currency.default._id === currentLines[0].currency.default._id,
    )
      ? currentLines[0].currency.default._id
      : organizationStore?.organization?.currency?._id;

  const resp = await globalStore.getMyCurrencies(false, sameIdCurrencyLines);
  salesStore.formDocInvoice.formRegister.formDataInvoice.currencies =
    resp.currencies;
  salesStore.formDocInvoice.formRegister.formDataInvoice.currencies.unshift(
    resp.currency,
  );
  salesStore.formDocInvoice.formRegister.formDataInvoice.currency =
    resp.currency;
  salesStore.formDocInvoice.formRegister.formDataInvoice.currencyName =
    resp?.currency?.name?.[globalStore.lang];
};

// ── Watchers ──────────────────────────────────────────────────────────────────
watch(
  hasSameClient,
  (newValue) => {
    stepsFormData.value = newValue ? "client" : "none";
  },
  { immediate: true },
);

watch(stepsFormData, async (newValue) => {
  if (newValue === "docReference") {
    await outcomesStore.getDocumentTypesByCountry();
  }
});

// ── Lifecycle ─────────────────────────────────────────────────────────────────
onMounted(async () => {
  globalStore.loading = true;
  setInitialStep();
  findDuplicateClient();
  paymentsTermns.value = await paymentsStore.getPaymentTerms();
  paymentsMethods.value = await paymentsStore.getPaymentMethods(true);
  if (stepsFormData.value !== "docReference") {
    await getCurrencyBaseDocument();
  }
  globalStore.loading = false;
});
</script>

<template>
  <div class="container">
    <!-- Header -->
    <div class="header">
      <span
        class="body-l-sb textTitleColor"
        v-text="
          t(module + '.' + titleHeader, {
            typeDoc:
              salesStore?.formDocInvoice?.typeDocument?.tag ||
              getNameCode(salesStore?.formDocInvoice?.typeDocument?.code)[
                globalStore.lang
              ],
          })
        "
      />
      <u-button-icon
        @click="closeStep"
        icon="u u-close"
        type="outlined"
        color="--neutral-text-caption"
        size="l"
        style="border-radius: 50%"
      />
    </div>

    <!-- Body -->
    <div class="body">
      <!-- Client search / display -->
      <div class="body_header">
        <DialogCreateSalesDocInvoicesStep3ClientSearch
          :stepsFormData="stepsFormData"
          @changeClient="changeClient"
        />
      </div>

      <!-- Sub-step content -->
      <div class="body_content">
        <DialogCreateSalesDocInvoicesStep3ClientForm
          v-if="stepsFormData === 'client'"
          @changeClient="changeClient"
        />

        <DialogCreateSalesDocInvoicesStep3InvoiceForm
          v-if="stepsFormData === 'invoice'"
          :paymentsTermns="paymentsTermns"
          :paymentsMethods="paymentsMethods"
          @sameCurrencyChange="sameCurrency = $event"
          @validationChange="invoiceValidation = $event"
        />

        <DialogCreateSalesDocInvoicesStep3DocReferenceForm
          ref="refDocReference"
          v-if="stepsFormData === 'docReference'"
        />
      </div>
    </div>

    <!-- Footer -->
    <div class="footer">
      <u-button
        @click="backStep"
        :text="t(`${module}.buttons.back`)"
        type="outlined"
      />
      <u-button
        v-if="showContinueButton"
        :disabled="disabledContinue"
        @click="nextStep"
        :text="t(`${module}.buttons.next`)"
      />
      <u-button
        v-else
        @click="refDocReference.addDocReference()"
        text="Crear Documento"
      />
    </div>
  </div>
</template>

<style scoped>
.container {
  display: grid;
  grid-template-rows: auto 1fr auto;
  gap: 24px;
  width: 80vw;
  max-width: 556px;
  height: 80vh;
  max-height: 752px;
  box-sizing: border-box;
  overflow: hidden;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 40px;
  width: 100%;
}

.textTitleColor {
  color: var(--neutral-text-body);
}

.body {
  display: grid;
  grid-template-rows: 92px 1fr;
  overflow: hidden;
  min-height: 0;
}

.body_header {
  display: flex;
  border-bottom: v-bind("borderLine");
}

.container_search_client {
  display: flex;
  flex-direction: row;
  height: 80px;
  align-items: center;
  width: 100%;
  gap: 24px;
}

.body-header-snippet {
  display: flex;
  flex-direction: row;
  align-items: center;
}

.body-header-snippet .container_snippet {
  display: flex;
  flex-direction: column;
}

.container_snippet .container_legalName {
  display: flex;
  width: 335px;
  align-items: center;
  height: 24px;
  gap: 8px;
  color: var(--neutral-text-body);
}

.container_snippet > span:nth-child(1) {
  color: var(--primary-text-default);
}
.container_snippet > span:nth-child(2) {
  width: 271px;
  height: 24px;
  color: var(--neutral-text-caption);
}
.container_snippet > span:nth-child(3) {
  width: 271px;
  color: var(--primary-text-default);
  height: 20px;
}

.truncateText {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.body_content {
  display: flex;
  width: 100%;
  height: 100%;
  overflow: hidden;
  min-height: 0;
}

.footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>
