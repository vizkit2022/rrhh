<script setup>
import useOutcomesStore from "@/stores/outcomes";
import useDocumentTrayStore from "@/stores/documentTray";
import usePaymentsStore from "@/stores/payments";
import useOrganizationStore from "@/stores/organization";
import useUserStore from "@/stores/user";
import useGlobalStore from "@/stores/global";
import { ref, computed, onMounted } from "vue";
import { debounce } from "@/utils/helpers";
import {
  convertToNumber,
  formatCurrency,
  getValueFormaRealTime,
} from "@/utils/formatAmount";
import { useI18n } from "vue-i18n";

// STORES
const userStore = useUserStore();
const documentTrayStore = useDocumentTrayStore();
const paymentsStore = usePaymentsStore();
const outcomesStore = useOutcomesStore();
const globalStore = useGlobalStore();
const organizationStore = useOrganizationStore();

//EMITS
const emit = defineEmits([
  "closeModal",
  "changeStep",
  "nextStep",
  "createClient",
  "reloadDocTray",
]);

// I18n
const { t } = useI18n();
const module = "modules.outcomes.pages.oc.modals.documenting.step1";

// FORM DATA
const formData = {
  dataDocument: {
    title: "Datos del Documento",
    fields: [
      {
        icon: "new-project",
        text: "Referencia",
        type: "text",
        placeholder: "Ingresa una referencia del documento",
        code: "reference",
        disabled: false,
        optional: true,
      },
      {
        icon: "pay",
        text: "Moneda",
        type: "selectCurrency",
        placeholder: "Selecciona una moneda",
        code: "currency",
        disabled: false,
      },
      {
        icon: "invoice",
        text: "Tipo de Documento",
        type: "selectTypeDocument",
        placeholder: "Selecciona un tipo de Documento",
        code: "typeDocument",
        numeric: true,
        disabled: false,
      },
      {
        icon: "hashtag",
        text: "Condiciones",
        type: "selectConditions",
        placeholder: "Selecciona las condiciones",
        code: "conditionPayment",
        disabled: false,
      },
      {
        icon: "hashtag",
        text: "N° del Documento",
        type: "text",
        placeholder: "Ingresa el N° del Documento",
        code: "documentNumber",
        numeric: true,
        disabled: false,
      },
      {
        icon: "calendar",
        text: "Fecha del Emisión",
        type: "date",
        placeholder: "Ingresa la fecha de emisión",
        code: "issueDate",
        disabled: false,
      },
      {
        icon: "calendar",
        text: "Fecha de Recepción",
        type: "date",
        placeholder: "Ingresa la fecha de recepción",
        code: "dateOfReceipt",
        disabled: false,
      },
    ],
  },
  documentAmounts: {
    title: "Montos del Documento",
    fields: [
      {
        icon: "dollar-sign",
        text: "Subtotal",
        type: "textNumber",
        placeholder: "Ingresa el monto antes de impuestos",
        code: "subtotal",
        numeric: true,
        disabled: false,
      },
    ],
  },
};

// FORM STATES
const stepsFormData = ref("none");
const searchClient = ref("");
const resultsClient = ref([]);
const loadingClient = ref(false);
const paymentsTermns = ref([]);

const typesUser = [
  { name: { es: "Empresa", en: "Business" }, value: "business" },
  { name: { es: "Persona", en: "Personal" }, value: "personal" },
];

// COMPUTED
const hasSameClient = computed(() => {
  return !!documentTrayStore.forms.updaloadDocument.manualDocument.supplier;
});

const disableContinue = computed(() => {
  if (stepsFormData.value === "none") return true;

  const doc =
    documentTrayStore.forms.updaloadDocument.manualDocument.dataDocument;
  const docAmounts =
    documentTrayStore.forms.updaloadDocument.manualDocument.documentAmounts;

  if (stepsFormData.value === "dataDocument") {
    const {
      currency,
      typeDocument,
      conditionPayment,
      documentNumber,
      issueDate,
      dateOfReceipt,
    } = doc;

    // Si alguno de estos no tiene valor, el botón debe estar deshabilitado
    return !(
      currency?.label &&
      typeDocument?.label &&
      conditionPayment?.label &&
      documentNumber &&
      issueDate &&
      dateOfReceipt
    );
  }

  const { subtotal, total, taxes } = docAmounts;

  const hasSubtotal = Number(subtotal?.number) > 0;
  const hasTotal = Number(total?.number) > 0;

  //  Si hay taxes definidos, todos deben tener amount.number
  const taxesValid = taxes.length
    ? taxes.every((t) => t.amount?.number > 0)
    : true;

  return !(hasSubtotal && hasTotal && taxesValid);

  return true; // valor por defecto
});

// COMPUTED para campos dinámicos de impuestos y retenciones
const documentAmountsFields = computed(() => {
  const fields = [...formData.documentAmounts.fields];

  const selectedDocType =
    documentTrayStore.forms.updaloadDocument.manualDocument.dataDocument
      .documentType;
  const taxes = selectedDocType?.data?.taxes || [];

  // Separar impuestos y retenciones
  const taxesOnly = taxes.filter((t) => !t.retention);
  const retentionsOnly = taxes.filter((t) => t.retention);

  // Orden: primero impuestos, luego retenciones
  const orderedTaxes = [...taxesOnly, ...retentionsOnly];

  // Agregar los campos de impuestos/retenciones ordenados
  orderedTaxes.forEach((tax, index) => {
    fields.push({
      icon: "dollar-sign",
      text: tax.retention
        ? `${tax.name || tax.value + "%"}`
        : `${tax.name || tax.value + "%"}`,
      type: "textNumber",
      placeholder: `Monto del ${tax.name}`,
      code: `tax_${index}`, // Usar el índice en lugar del _id
      numeric: true,
      disabled: false, // Ahora es editable
      isTax: true,
      taxIndex: index, // Guardar el índice para acceder al array
      taxData: tax,
    });
  });

  // Campo final total
  fields.push({
    icon: "dollar-sign",
    text: "Total",
    type: "textNumber",
    placeholder: "Monto total",
    code: "total",
    numeric: true,
    disabled: false, // Ahora es editable
  });

  return fields;
});

//form data documentos
const currencies = computed(() => {
  return globalStore.currencies.map((item) => ({
    label: item?.name?.[globalStore.lang] || "-",
    value: item._id,
    data: item,
  }));
});

const conditionOfPayOptions = computed(() => {
  return paymentsTermns.value.map((item) => {
    return {
      label: item?.name?.[globalStore.lang] || "-",
      value: item._id,
      data: item,
    };
  });
});

// FUNCTIONS
const handleBackStep = () => {
  if (stepsFormData.value === "dataDocument") {
    documentTrayStore.cleanFormDataDocument();
    stepsFormData.value = "none";
  } else if (stepsFormData.value === "documentAmounts") {
    stepsFormData.value = "dataDocument";
  }
};

const handleNextStep = async () => {
  if (stepsFormData.value === "dataDocument") {
    stepsFormData.value = "documentAmounts";
  } else if (stepsFormData.value === "documentAmounts") {
    const body = {
      supplier: {
        contact:
          documentTrayStore?.forms?.updaloadDocument?.manualDocument?.supplier
            ?._id,
        imgUrl:
          documentTrayStore?.forms?.updaloadDocument?.manualDocument?.supplier
            ?.imgUrl,
        data: documentTrayStore?.forms?.updaloadDocument?.manualDocument
          ?.supplier?.data,
        payment: {
          document:
            documentTrayStore?.forms?.updaloadDocument?.manualDocument?.supplier
              ?.payment?.document,
        },
      },
      isManual: true,
      documentType:
        documentTrayStore?.forms?.updaloadDocument?.manualDocument?.dataDocument
          ?.documentType?.value,
      paymentTerm:
        documentTrayStore?.forms?.updaloadDocument?.manualDocument?.dataDocument
          ?.conditionPayment?.value,

      currency: {
        default:
          documentTrayStore?.forms?.updaloadDocument?.manualDocument
            ?.dataDocument?.currency?.value,
        print:
          documentTrayStore?.forms?.updaloadDocument?.manualDocument
            ?.dataDocument?.currency?.value,
        others: [],
      },

      reference:
        documentTrayStore?.forms?.updaloadDocument?.manualDocument?.dataDocument
          ?.reference,
      documentNumber:
        documentTrayStore?.forms?.updaloadDocument?.manualDocument?.dataDocument
          ?.documentNumber,
      issueDate:
        documentTrayStore?.forms?.updaloadDocument?.manualDocument?.dataDocument
          ?.issueDate,
      dateReceived:
        documentTrayStore?.forms?.updaloadDocument?.manualDocument?.dataDocument
          ?.dateOfReceipt,

      additionalTaxesOptional: [],

      numbers: {
        totalNet: {
          value:
            documentTrayStore?.forms?.updaloadDocument?.manualDocument
              ?.documentAmounts?.subtotal?.value || "",
          number:
            documentTrayStore?.forms?.updaloadDocument?.manualDocument
              ?.documentAmounts?.subtotal?.number || 0,
          numberAprox:
            documentTrayStore?.forms?.updaloadDocument?.manualDocument
              ?.documentAmounts?.subtotal?.number || 0,
        },
        total: {
          value:
            documentTrayStore?.forms?.updaloadDocument?.manualDocument
              ?.documentAmounts?.total?.value || "",
          number:
            documentTrayStore?.forms?.updaloadDocument?.manualDocument
              ?.documentAmounts?.total?.number || 0,
          numberAprox:
            documentTrayStore?.forms?.updaloadDocument?.manualDocument
              ?.documentAmounts?.total?.number || 0,
        },
        taxes:
          documentTrayStore?.forms?.updaloadDocument?.manualDocument?.documentAmounts?.taxes.map(
            (item) => {
              return {
                value: item?.value,
                name: item?.name,
                retention: item?.retention,
                total: {
                  number: item?.amount?.number || 0,
                  numberAprox: item?.amount?.number || 0,
                  value: item?.amount?.value || "",
                },
                tax: item?._id,
              };
            },
          ),
      },
    };

    globalStore.loading = true;
    const resp = await documentTrayStore.createManualDocumentsTray(body);
    if (resp) {
      await documentTrayStore.uploadDocumentFile(
        resp._id,
        documentTrayStore.forms.updaloadDocument.files,
      );
    }
    emit("reloadDocTray");
    globalStore.loading = false;
    emit("closeModal");
  }
};

// Mapper para resultados de búsqueda
const mapperSearchResultUsers = (list) => {
  return list.map((item) => ({
    label: item?.data?.legalName || "-",
    text: item?.email || "-",
    img: item?.imgUrl ?? null,
    oldData: { ...item },
  }));
};

const searchClients = debounce(async (e) => {
  const text = e.target.value;
  try {
    loadingClient.value = true;
    const resp = await userStore.findByUsersByNameOrEmail(true, true, text, {
      archived: true,
      onlyContacts: true,
    });
    resultsClient.value = resp?.length ? mapperSearchResultUsers(resp) : [];
  } catch (error) {
    console.error(error);
  } finally {
    loadingClient.value = false;
  }
}, 300);

const updatedTypeOp = (type) => {
  setTimeout(() => {
    userStore.dataSheet.data.data.type = type;
    const types = {
      personal: { es: "Personal", en: "Personal" },
      business: { es: "Empresa", en: "Business" },
    };
    userStore.dataSheet.data.data.typeName =
      types?.[type]?.[salesStore.globalLang] || "";
  }, 100);
};

const getDocumentName = (id) => {
  const doc = outcomesStore.documentTypes.find((doc) => doc._id === id);
  return doc ? doc.name : "";
};

const selectedSupplier = async (obj) => {
  const body = obj.oldData;
  documentTrayStore.forms.updaloadDocument.manualDocument.supplier = {
    data: {
      address: body?.data?.address ?? "",
      idNumber: body?.data?.idNumber ?? "",
      legalName: body?.data?.legalName ?? "",
      nickName: body?.data?.nickName ?? "",
      type: body?.data?.type ?? "",
      icon: "building",
    },
    email: body?.email ?? "",
    imgUrl: body?.imgUrl ?? "",
    payment: {
      paymentTerm: body?.payment?.paymentTerm,
      document: body?.payment?.document ?? "",
      documentName: getDocumentName(body?.payment?.document),
    },
    _id: body?._id ?? "",
  };
  searchClient.value = "";
  stepsFormData.value = "dataDocument";

  // Iniciar moneda
  documentTrayStore.forms.updaloadDocument.manualDocument.dataDocument.currency.label =
    organizationStore.organization.currency.name[globalStore.lang];
  documentTrayStore.forms.updaloadDocument.manualDocument.dataDocument.currency.value =
    organizationStore.organization.currency._id;
  documentTrayStore.forms.updaloadDocument.manualDocument.dataDocument.currency.data =
    organizationStore.organization.currency;

  // Iniciar condiciones de pago
  if (body?.payment?.paymentTerm) {
    console.log("body payment term", body.payment.paymentTerm);
    const matchPaymentTerm = paymentsTermns.value.find(
      (item) => item._id === body?.payment?.paymentTerm,
    );

    if (matchPaymentTerm) {
      console.log("match", matchPaymentTerm);
      documentTrayStore.forms.updaloadDocument.manualDocument.dataDocument.conditionPayment =
        {
          data: matchPaymentTerm,
          value: matchPaymentTerm._id,
          label: matchPaymentTerm.name[globalStore.lang],
        };
    }
  }
};

const handleChangeCurrency = (currency) => {
  const { data, value, label } = currency;

  const documentAmounts =
    documentTrayStore.forms.updaloadDocument.manualDocument.documentAmounts;

  documentTrayStore.forms.updaloadDocument.manualDocument.dataDocument.currency =
    {
      data,
      value,
      label,
    };

  // Reformatear todos los montos existentes con la nueva moneda
  Object.keys(documentAmounts).forEach((key) => {
    if (documentAmounts[key]?.number !== undefined) {
      documentAmounts[key].value = formatCurrency(
        documentAmounts[key].number,
        data,
      );
    }
  });

  // AHORA SÍ reformateamos los taxes con la nueva moneda
  if (documentAmounts.taxes && documentAmounts.taxes.length > 0) {
    documentAmounts.taxes.forEach((tax) => {
      if (tax.amount?.number !== undefined) {
        tax.amount.value = formatCurrency(tax.amount.number, data);
      }
    });
  }
};

const handleChangeDocumentType = (documentType) => {
  console.log("documentType", documentType);
  documentTrayStore.forms.updaloadDocument.manualDocument.dataDocument.documentType =
    {
      data: documentType,
      value: documentType._id,
      label: documentType.name,
    };

  // Inicializar el array de taxes vacío al cambiar tipo de documento
  if (
    !documentTrayStore.forms.updaloadDocument.manualDocument.documentAmounts
      .taxes
  ) {
    documentTrayStore.forms.updaloadDocument.manualDocument.documentAmounts.taxes =
      [];
  }
};

const handleChangeCondition = (condition) => {
  documentTrayStore.forms.updaloadDocument.manualDocument.dataDocument.conditionPayment.value =
    condition.value;
  documentTrayStore.forms.updaloadDocument.manualDocument.dataDocument.conditionPayment.label =
    condition.label;
};

// --- TEXT NUMBER INPUT HANDLERS ---
const handleFocusTextNumber = (event, item) => {
  const code = item.code;

  if (item.isTax) {
    // Para taxes, obtener el número del objeto amount
    const taxes =
      documentTrayStore.forms.updaloadDocument.manualDocument.documentAmounts
        .taxes;
    const taxValue = taxes?.[item.taxIndex]?.amount?.number || "";
    event.target.value = taxValue;
  } else {
    // Para campos regulares (subtotal, total)
    const field =
      documentTrayStore.forms.updaloadDocument.manualDocument.documentAmounts[
        code
      ];
    event.target.value = field?.number || "";
  }

  event.target.select();
};

const handleBlurTextNumber = (event, item) => {
  const code = item.code;
  const rawValue = event.target.value;

  if (item.isTax) {
    // Para taxes: usar currency format igual que subtotal/total
    const currency = documentTrayStore.forms.updaloadDocument.manualDocument
      .dataDocument.currency?.data || {
      typeFormat: "de-DE",
      precision: 2,
    };

    const number = convertToNumber(rawValue);
    const formatted = formatCurrency(number, currency);

    if (
      !documentTrayStore.forms.updaloadDocument.manualDocument.documentAmounts
        .taxes
    ) {
      documentTrayStore.forms.updaloadDocument.manualDocument.documentAmounts.taxes =
        [];
    }

    // Asegurar que el tax existe en el array
    if (
      !documentTrayStore.forms.updaloadDocument.manualDocument.documentAmounts
        .taxes[item.taxIndex]
    ) {
      documentTrayStore.forms.updaloadDocument.manualDocument.documentAmounts.taxes[
        item.taxIndex
      ] = {
        _id: item.taxData._id,
        name: item.taxData.name,
        value: item.taxData.value,
        retention: item.taxData.retention || false,
      };
    }

    // Guardar con la misma estructura que subtotal/total
    documentTrayStore.forms.updaloadDocument.manualDocument.documentAmounts.taxes[
      item.taxIndex
    ].amount = {
      number,
      value: formatted,
    };

    event.target.value = formatted;
  } else {
    // Para campos regulares (subtotal, total): usar currency
    const currency =
      documentTrayStore.forms.updaloadDocument.manualDocument.dataDocument
        .currency?.data || "USD";
    const number = convertToNumber(rawValue);
    const formatted = formatCurrency(number, currency);

    if (
      !documentTrayStore.forms.updaloadDocument.manualDocument.documentAmounts[
        code
      ]
    ) {
      documentTrayStore.forms.updaloadDocument.manualDocument.documentAmounts[
        code
      ] = {};
    }

    documentTrayStore.forms.updaloadDocument.manualDocument.documentAmounts[
      code
    ] = {
      ...documentTrayStore.forms.updaloadDocument.manualDocument
        .documentAmounts[code],
      number,
      value: formatted,
    };

    event.target.value = formatted;
  }
};

const handleInputTextNumber = (event, item) => {
  const code = item.code;
  const rawValue = event.target.value || "";

  if (item.isTax) {
    // Para taxes: usar currency format igual que los demás campos
    const currency = documentTrayStore.forms.updaloadDocument.manualDocument
      .dataDocument.currency?.data || {
      typeFormat: "de-DE",
      precision: 2,
    };

    const { formattedValue, numericValue } = getValueFormaRealTime(
      rawValue,
      currency,
      "amount",
    );

    event.target.value = formattedValue;

    if (
      !documentTrayStore.forms.updaloadDocument.manualDocument.documentAmounts
        .taxes
    ) {
      documentTrayStore.forms.updaloadDocument.manualDocument.documentAmounts.taxes =
        [];
    }

    if (
      !documentTrayStore.forms.updaloadDocument.manualDocument.documentAmounts
        .taxes[item.taxIndex]
    ) {
      documentTrayStore.forms.updaloadDocument.manualDocument.documentAmounts.taxes[
        item.taxIndex
      ] = {
        _id: item.taxData._id,
        name: item.taxData.name,
        value: item.taxData.value,
        retention: item.taxData.retention || false,
      };
    }

    // Guardar con estructura igual a subtotal/total
    documentTrayStore.forms.updaloadDocument.manualDocument.documentAmounts.taxes[
      item.taxIndex
    ].amount = {
      number: numericValue,
      value: formattedValue,
    };
  } else {
    // Para campos regulares: usar currency format
    const currency = documentTrayStore.forms.updaloadDocument.manualDocument
      .dataDocument.currency?.data || {
      typeFormat: "de-DE",
      precision: 2,
    };

    const { formattedValue, numericValue } = getValueFormaRealTime(
      rawValue,
      currency,
      "amount",
    );

    event.target.value = formattedValue;

    if (
      !documentTrayStore.forms.updaloadDocument.manualDocument.documentAmounts[
        code
      ]
    ) {
      documentTrayStore.forms.updaloadDocument.manualDocument.documentAmounts[
        code
      ] = {};
    }

    documentTrayStore.forms.updaloadDocument.manualDocument.documentAmounts[
      code
    ].number = numericValue;
    documentTrayStore.forms.updaloadDocument.manualDocument.documentAmounts[
      code
    ].value = formattedValue;
  }
};

// Función auxiliar para obtener valor de un tax del array
const getTaxValue = (taxIndex) => {
  const taxes =
    documentTrayStore.forms.updaloadDocument.manualDocument.documentAmounts
      .taxes;
  const amount = taxes?.[taxIndex]?.amount;

  // Devolver el valor formateado
  return amount?.value || "";
};

// CYCLES
onMounted(async () => {
  // DOCUMENT TYPES
  await outcomesStore.getDocumentTypesByCountry();
  // CURRENCIES
  await globalStore.getMyCurrencies(true);
  documentTrayStore.forms.updaloadDocument.manualDocument.dataDocument.currency.label =
    organizationStore.organization.currency.name[globalStore.lang];
  documentTrayStore.forms.updaloadDocument.manualDocument.dataDocument.currency.value =
    organizationStore.organization.currency._id;
  documentTrayStore.forms.updaloadDocument.manualDocument.dataDocument.currency.data =
    organizationStore.organization.currency;

  // PAYMENTS TERMS
  paymentsTermns.value = await paymentsStore.getPaymentTerms();
});
</script>

<template>
  <div class="container_step3">
    <div class="step3__header">
      <span>Ingresar información - Seleccionar proveedor</span>
      <u-button-icon
        icon="close"
        type="outlined"
        color="--neutral-text-caption"
        size="s"
        class="btnIconModify"
        @click="emit('closeModal')"
      />
    </div>

    <div class="step3__body">
      <!-- BODY HEADER (avatar + proveedor o buscador) -->
      <div class="step3__body-header">
        <u-avatar
          :user="{
            src: documentTrayStore.forms.updaloadDocument.manualDocument
              .supplier?.imgUrl,
          }"
          :size="
            stepsFormData === 'dataDocument' ||
            stepsFormData === 'documentAmounts'
              ? 64
              : 76
          "
        />

        <!-- Proveedor seleccionado -->
        <div
          v-if="
            stepsFormData === 'dataDocument' ||
            stepsFormData === 'documentAmounts'
          "
          class="step3__body-header-text"
        >
          <div class="title">
            <span>{{
              documentTrayStore.forms.updaloadDocument.manualDocument.supplier
                ?.data?.legalName
            }}</span>
            <span class="u u-verify"></span>
          </div>
          <span class="text">{{
            documentTrayStore.forms.updaloadDocument.manualDocument.supplier
              ?.data?.nickName
          }}</span>
          <span class="email">{{
            documentTrayStore.forms.updaloadDocument.manualDocument.supplier
              ?.email
          }}</span>
        </div>

        <!-- Búsqueda de proveedor -->
        <u-search-by-type
          v-if="stepsFormData === 'none'"
          v-model="searchClient"
          :options="resultsClient"
          :loading="loadingClient"
          size="s"
          :placeholder="t(module + '.inputs.supplier.placeholder')"
          :showSearchIcon="true"
          :avatar="true"
          :create="true"
          :updated="false"
          :snippet="true"
          :iconSelect="null"
          :types="typesUser"
          @input="searchClients($event)"
          @updatedTypeOp="updatedTypeOp"
          @newOption="emit('createClient', searchClient)"
          @cleanInput="searchClient = ''"
          @selectedOption="selectedSupplier"
        />

        <!-- Botón cambiar -->
        <u-button
          v-if="stepsFormData === 'dataDocument'"
          icon="change"
          text="Cambiar"
          type="outlined"
          size="s"
          class="step3__body-header-button"
          @click="handleBackStep"
        />
      </div>

      <!-- Línea divisoria -->
      <div v-if="hasSameClient" class="line"></div>

      <!-- BODY CONTENT -->
      <div v-if="stepsFormData !== 'none'" class="step3__body-container">
        <span class="subTitle">{{ formData[stepsFormData]?.title }}</span>

        <div class="step3__body-form">
          <!-- Para dataDocument usamos los campos originales -->
          <div
            v-if="stepsFormData === 'dataDocument'"
            class="step3__body-group"
            v-for="item in formData.dataDocument.fields"
            :key="item.code"
          >
            <span class="u" :class="`u-${item.icon}`"></span>
            <span>
              {{ item.text }}
              <strong v-if="item.optional"
                >({{ t("global.text.optional") }})</strong
              >
            </span>

            <!-- Campo de texto -->
            <u-input
              v-if="item.type === 'text'"
              :placeholder="item.placeholder"
              :disabled="item.disabled"
              :numeric="item.numeric"
              size="s"
              v-model="
                documentTrayStore.forms.updaloadDocument.manualDocument
                  .dataDocument[item.code]
              "
            />

            <!-- Selector de moneda -->
            <u-select
              v-else-if="item.type === 'selectCurrency'"
              :options="currencies"
              :placeholder="item.placeholder"
              size="s"
              v-model="
                documentTrayStore.forms.updaloadDocument.manualDocument
                  .dataDocument[item.code].label
              "
              :full-data="true"
              @full-data="handleChangeCurrency"
            />

            <!-- Selector de tipo de documento -->
            <u-select
              v-else-if="item.type === 'selectTypeDocument'"
              :options="outcomesStore.documentTypes"
              :placeholder="item.placeholder"
              size="s"
              v-model="
                documentTrayStore.forms.updaloadDocument.manualDocument
                  .dataDocument[item.code].label
              "
              :full-data="true"
              @full-data="handleChangeDocumentType"
            />

            <u-select
              v-else-if="item.type === 'selectConditions'"
              :options="conditionOfPayOptions"
              :placeholder="item.placeholder"
              size="s"
              v-model="
                documentTrayStore.forms.updaloadDocument.manualDocument
                  .dataDocument[item.code].label
              "
              :full-data="true"
              @full-data="handleChangeCondition"
            />

            <!-- Fecha -->
            <u-calendar
              v-else-if="item.type === 'date'"
              :placeholder="item.placeholder"
              size="s"
              v-model="
                documentTrayStore.forms.updaloadDocument.manualDocument
                  .dataDocument[item.code]
              "
              :disabled="item.disabled"
            />
          </div>

          <!-- Para documentAmounts usamos los campos dinámicos con impuestos -->
          <div
            v-else-if="stepsFormData === 'documentAmounts'"
            class="step3__body-group"
            v-for="item in documentAmountsFields"
          >
            <span class="u" :class="`u-${item.icon}`"></span>
            <span>
              {{ item.text }}
              <strong v-if="item.optional"
                >({{ t("global.text.optional") }})</strong
              >
            </span>

            <!-- Text Number para campos regulares (subtotal, total) -->
            <input
              v-if="item.type === 'textNumber' && !item.isTax"
              class="input"
              :placeholder="item.placeholder"
              :disabled="item.disabled"
              :value="
                documentTrayStore.forms.updaloadDocument.manualDocument
                  .documentAmounts[item.code]?.value || ''
              "
              @focus="!item.disabled && handleFocusTextNumber($event, item)"
              @blur="!item.disabled && handleBlurTextNumber($event, item)"
              @input="!item.disabled && handleInputTextNumber($event, item)"
            />

            <!-- Text Number para taxes (valores numéricos simples) -->
            <input
              v-else-if="item.type === 'textNumber' && item.isTax"
              class="input"
              :placeholder="item.placeholder"
              :disabled="item.disabled"
              :value="getTaxValue(item.taxIndex)"
              @focus="!item.disabled && handleFocusTextNumber($event, item)"
              @blur="!item.disabled && handleBlurTextNumber($event, item)"
              @input="!item.disabled && handleInputTextNumber($event, item)"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- FOOTER -->
    <div class="step3__footer">
      <u-button
        v-if="stepsFormData === 'none'"
        text="Cancelar"
        type="outlined"
        class="mainBtnModify"
        @click="emit('closeModal')"
        size="s"
      />
      <u-button
        v-else
        text="Volver"
        type="outlined"
        class="mainBtnModify"
        @click="handleBackStep"
        size="s"
      />
      <u-button
        :text="
          stepsFormData === 'none' || stepsFormData === 'dataDocument'
            ? 'Continuar'
            : 'Crear'
        "
        class="mainBtnModify"
        @click="handleNextStep"
        :disabled="disableContinue"
        size="s"
      />
    </div>
  </div>
</template>

<style scoped>
.container_step3 {
  width: 700px;
  height: 100%;
  display: grid;
  grid-template-rows: 40px minmax(549px, auto) 36px;
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
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.step3__body-header {
  height: 64px;
  display: grid;
  grid-template-columns: 110px 1fr auto;
  align-items: center;
}

.step3__body-header-text {
  display: flex;
  flex-direction: column;
}

.step3__body-header .title {
  display: flex;
  gap: 16px;
}

.step3__body-header .title span {
  font-weight: 600;
  font-size: 18px;
  line-height: 24px;
  letter-spacing: 0%;
  vertical-align: middle;
  color: var(--neutral-text-body);
}

.step3__body-header span.text {
  font-weight: 600;
  font-size: 18px;
  line-height: 18px;
  letter-spacing: 0%;
  vertical-align: middle;
  color: var(--neutral-text-caption);
}

.step3__body-header span.email {
  font-weight: 600;
  font-size: 16px;
  line-height: 16px;
  letter-spacing: 0%;
  vertical-align: middle;
  color: var(--primary-text-default);
}

.step3__body-header-button {
  justify-self: end;
}

.line {
  background-color: var(--neutral-border-subtle);
  height: 1px;
  width: 100%;
}

.step3__body-container {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.subTitle {
  font-weight: 600;
  font-size: 16px;
  line-height: 20px;
  letter-spacing: 0%;
  vertical-align: middle;
  color: var(--neutral-text-body);
}

.step3__body-form {
  height: 340px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  overflow-y: auto;
  scrollbar-gutter: stable both-edges;
  padding-right: 10px;
}

.step3__body-form::-webkit-scrollbar {
  width: 8px;
  height: 0px;
  background: var(--neutral-surface-light);
  border-radius: 20px;
}

.step3__body-form::-webkit-scrollbar-thumb {
  background: var(--neutral-surface-subtle);
  border-radius: 5px;
}

.step3__body-group {
  display: grid;
  grid-template-columns: 16px 200px 1fr;
  gap: 10px;
  flex-shrink: 1;
}

.step3__body-group span {
  font-size: 14px;
  line-height: 18px;
  letter-spacing: 0%;
  vertical-align: middle;
  color: var(--neutral-text-caption);
  height: 32px;
  padding-top: 8px;
}

.step3__body-group span:nth-child(2) {
  font-weight: 600;
}

.step3__body-group span strong {
  font-weight: 400;
  font-size: 12px;
}

/* footer */
.step3__footer {
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

/* CUSTOM COMPONENTS - MODIFY */
.input {
  height: 32px;
  border-radius: 8px;
  font-size: var(--size-body-m);
  line-height: var(--line-height-body-m);
  caret-color: var(--neutral-text-body);
  border: 1px solid var(--neutral-border-default);
  color: var(--neutral-text-body);
  padding: 0 12px 0 12px;
  font-weight: var(--font-weight-regular) !important;
  transition: 0.3s;
}

.input::placeholder {
  color: var(--neutral-border-default);
  transition: 0.3s;
}

.input:disabled {
  background-color: var(--neutral-surface-light);
  cursor: not-allowed;
  opacity: 0.6;
}

.btnIconModify {
  border-radius: 50%;
  color: var(--bg-neutral-500);
}

.mainBtnModify {
  width: 135px;
}
</style>
