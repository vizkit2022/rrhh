<script setup>
import {
  ref,
  onMounted,
  defineProps,
  defineEmits,
  onUnmounted,
  onBeforeMount,
} from "vue";
import useUserStore from "@/stores/user";
import useLinesStore from "@/stores/lines";
import useOutcomesStore from "@/stores/outcomes";
import useGlobalStore from "@/stores/global";
import lodash from "lodash";

// Props
const props = defineProps({
  closeDirect: {
    type: Boolean,
    default: false,
  },
  openby: {
    type: String,
    default: "Directo",
  },
  lineas: {
    type: Array,
    default: () => [],
  },
  outcomes: {
    type: Object,
    default: () => [],
  },
  currencyID: {
    type: String,
    default: "",
  },
  documentTypeID: {
    type: String,
    default: "",
  },
  conditionPayment: {
    type: String,
    default: "",
  },
});

// Stores
const userStore = useUserStore();
const outcomesStore = useOutcomesStore();
const globalStore = useGlobalStore();

// EventBus
const { $bus } = useNuxtApp();

// Emits
const currency = ref({});
const document = ref({});
const emit = defineEmits(["updateDimensions"]);

// Constants
const step = ref(2);

const getMyCurrencies = async () => {
  try {
    const response = await globalStore.getMyCurrencies();
    console.log("currency Global", response);

    let currencyList = [];

    // Verifica si es un array o un objeto
    if (Array.isArray(response.currency)) {
      console.log("isArray");
      currencyList = response.currency;
    } else if (response.currency && typeof response.currency === "object") {
      console.log("isObject");
      currencyList = [response.currency]; // Convierte el objeto en un array con un solo elemento
    } else {
      console.log("Ninguno");
      console.error(
        "Expected an array or object for 'currency', but received:",
        response.currency
      );
      return; // Sal del método si no se cumple ninguna condición
    }

    globalStore.currencies.push(...mapperCurrency(currencyList));

    globalStore.defCurrency = response.currency;

    currency.value = globalStore.currencies.find(
      (currency) => currency._id === props.currencyID
    );
  } catch (error) {
    console.error("Error fetching currencies:", error);
  }
};

// FUNCTIONS
const mapperCurrency = (list) => {
  const existingIds = new Set(globalStore.currencies.map((c) => c._id));

  const filteredList = list.filter((l) => !existingIds.has(l._id));

  return filteredList.map((l) => ({
    label: l.name[globalStore.lang],
    _id: l._id,
    ...l,
  }));
};

const getDocument = async (documentTypeID) => {
  console.log("documentTypeID que estoy buscando:", documentTypeID);

  if (!documentTypeID || typeof documentTypeID !== "string") {
    console.warn("Invalid or missing documentTypeID.");
    return;
  }

  try {
    // Obtener los tipos de documentos por país
    await outcomesStore.getDocumentTypesByCountry();
    console.log(
      "Datos recibidos de documentTypes:",
      outcomesStore.documentTypes
    );

    if (!Array.isArray(outcomesStore.documentTypes)) {
      throw new Error("documentTypes no es un arreglo válido.");
    }

    // Buscar el documento correspondiente al documentTypeID
    const document = outcomesStore.documentTypes.find(
      (doc) => doc._id.toString() === documentTypeID.toString()
    );

    console.log("Documento recuperado:", document);

    if (!document) {
      // Si no se encuentra el documento, establecer taxes como un arreglo vacío o según lo definido
      outcomesStore.taxes = [];
      console.warn(`No se encontró un documento con _id: ${documentTypeID}`);
      return;
    }

    // Asignar el documento encontrado a las propiedades correspondientes
    outcomesStore.toDocument.documentType = document;
    outcomesStore.toDocument.payment.document = document;

    // Asignar taxDefault de manera segura
    outcomesStore.toDocument.taxDefault = document.taxDefault || null;

    // Asignar taxes del documento encontrado
    outcomesStore.taxes = Array.isArray(document.taxes) ? document.taxes : [];
  } catch (error) {
    console.error(
      "Error al obtener o procesar los tipos de documentos:",
      error
    );
    // Manejar el error de manera adicional aquí, como notificar al usuario
  }
};

// Mounted
onBeforeMount(async () => {
  globalStore.loading = true;

  console.log("props.lineas", props.lineas.length);
  if (props.lineas && props.lineas.length > 0) {
    // Copiar las líneas al outcomesStore si están definidas
    console.log("Aqui debo procesar distinto o se cae todo.");
    outcomesStore.toDocument_lines = lodash.cloneDeep(props.lineas);
    outcomesStore.toDocument_lines.forEach((linea) => {
      // Copiamos el valor de `total` a `totalOriginal`
      linea.numbers.totalOriginal = { ...linea.numbers.total };
    });
  } else {
    console.log("No se recibieron líneas para procesar.");
  }

  const numberObjet = {
    value: "",
    number: 0,
  };

  const today = new Date().toISOString().split("T")[0];

  console.log("props.outcomes", props.outcomes.numbers.total);

  outcomesStore.toDocument = {
    documentTypeBlock:
      props.outcomes.type === "OC"
        ? true
        : false /* Encargado de bloquear o no la selecion de DocumentType */,
    outcomes: { ...props.outcomes },
    currency: { ...props.outcomes.currency },
    documentType: {
      name: "",
      id: "",
    },
    creator: { ...userStore.userSession },
    validations: {
      maxMount:
        props.outcomes.numbers.total.numberAprox -
        props.outcomes.numbers.documented.numberAprox,
    },
    supplier: { ...props.outcomes.supplier },
    primaryFile: { name: "" },
    reference: "",
    numbers: {
      taxable: { ...numberObjet },
      taxExempt: { ...numberObjet },
      additional: { ...numberObjet },
      totalNet: { ...numberObjet }, //subtotal:{...numberObjet},
      totalTax: { ...numberObjet },
      totalRetencion: { ...numberObjet },
      totalTaxAddition: { ...numberObjet },
      total: { ...numberObjet }, //totalWithTaxes:{...numberObjet},
      documented: { ...numberObjet },
      toDocument: { ...numberObjet },
      undocumented: { ...numberObjet },
      paid: { ...numberObjet },
      unpaid: { ...numberObjet },
      taxes: [],
    },
    issueDate: today,
    receiptDate: today,
    payment: {
      document: {},
      condition: props.conditionPayment,
    },
    subtotal: { ...numberObjet },
    documentNumber: "",
    taxes: { ...numberObjet },
    totalWithTaxes: { ...numberObjet },
  };

  if (props.outcomes.type == "FXR") {
    outcomesStore.toDocument.supplier = {
      imgUrl: null,
      data: {
        type: null,
        legalName: null,
        idNumber: null,
        nickName: null,
        address: null,
      },
      payment: {
        document: null,
        condition: null,
        documentName: null,
      },
      email: null,
    };
  }
  outcomesStore.toDocument.mode = "Searching";

  $bus.$on("updatedStepDocument", (next) => {
    nextStep(next);
  });

  $bus.$on("closeAndBack", () => {
    console.log("closeDirect Value", props.closeDirect);
    if (props.openby !== "CreateOC" || props.closeDirect) {
      $bus.$emit("closeDialogDocument");
      return;
    }
    $bus.$emit("updatedStep", 4);
  });

  await Promise.all([getDocument(props.documentTypeID), getMyCurrencies()]);

  globalStore.loading = false;
});

// Unmounted
onUnmounted(() => {
  // Limpiar el campo en outcomesStore
  outcomesStore.toDocument_lines = [];
  outcomesStore.toDocument = [];

  $bus.$off("updatedStepDocument");
  $bus.$off("closeAndBack");
});

// Actions
const nextStep = (next = step.value + 1) => {
  step.value = next;
};
</script>

<template>
  <DialogToDocumentStep1 v-if="step === 1" />
  <DialogToDocumentStep2 v-if="step === 2" />
  <DialogToDocumentStep3 v-if="step === 3" />
  <DialogViewDocument v-if="step === 4" />
</template>

<style scoped></style>
