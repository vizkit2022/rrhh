<script setup>
import { ref, computed, onUnmounted, onMounted, defineProps } from "vue";
import useOutcomesStore from "@/stores/outcomes";
import useGlobalStore from "@/stores/global";
import usePaymentsStore from "@/stores/payments";

// Stores
const outcomesStore = useOutcomesStore();
const globalStore = useGlobalStore();
const paymentsStore = usePaymentsStore();

// Components
import { DialogDocumentingStep1, DialogDocumentingStep2 } from "#components";

// Steps
const stepsViews = {
  1: DialogDocumentingStep1,
  2: DialogDocumentingStep2,
};

// Props
const props = defineProps({
  withSelectedLines: {
    type: Boolean,
    default: false,
  },
  updatedDocStep1: {
    type: Boolean,
    default: false
  }
});

// Emits
const emit = defineEmits(["closeModal", "updateDimensions", "updateTable", "updateMetrics"]);

// Constants
const step = ref(1);

// Computed
const stepsView = computed(() => stepsViews[step.value || 1]);

// Functions
const changeStep = (next) => {
  // Cambio de Step
  if (next && step.value < 2) {
    step.value += 1;
  } else if (!next && step.value > 1) {
    step.value -= 1;
  }
  // Actulizar las Dimensiones
  emit("updateDimensions", {
    width: step.value === 2 ? "85vw" : "780px",
    height: "auto",
  });
};
const closeModal = () => {
  emit("closeModal");
  outcomesStore.resetDocumenting();
};
const updateTable = () => {
  emit("updateTable");
};
const updateMetrics = (obj) => {
  emit("updateMetrics", obj);
}

onMounted(async () => {

    try {
    globalStore.loading = true;
    outcomesStore.formDocumenting.processing = true;
  if(outcomesStore.outcome.type === "FXR") {
    // outcomesStore.formDocumenting.supplier = {};
  } else {
    outcomesStore.formDocumenting.supplier = JSON.parse(
    JSON.stringify(outcomesStore?.outcome?.supplier)
  );
  }

  outcomesStore.formDocumenting.numbers = JSON.parse(
    JSON.stringify(outcomesStore?.outcome?.numbers)
  );

  if (outcomesStore?.outcome?.reference) {
    outcomesStore.formDocumenting.reference = capitalizeName(
      outcomesStore?.outcome?.reference
    );
  }

  // Settear fechas al dia de hoy
  outcomesStore.formDocumenting.dateIssue = formatDateToYMD();
  outcomesStore.formDocumenting.dateReceipt = formatDateToYMD();

  // Limpiar campos
  outcomesStore.formDocumenting.documentNumber = "";
  outcomesStore.formDocumenting.primaryFile = null;

  await paymentsStore.getPaymentTerms();

  // Settear monedas
  if (outcomesStore?.outcome?.type === "FXR") {
    const currencies = await globalStore.getMyCurrencies(false, outcomesStore?.formDocumenting?.currency?._id);
    outcomesStore.formDocumenting.currencies = currencies?.currencies
  } else {
    const currencies = await globalStore.getMyCurrencies();
    outcomesStore.formDocumenting.currencies = currencies?.currencies
    outcomesStore.formDocumenting.currencies.unshift(currencies?.currency)
  }


  await outcomesStore.getDocumentTypesByCountry();
  } catch( error) {
    console.error(error);
  } finally {
    globalStore.loading = false;
    outcomesStore.formDocumenting.processing = false;
  }

});

onUnmounted(() => {
  outcomesStore.resetDocumenting();
});
</script>

<template>
  <component
    :is="stepsView"
    :withSelectedLines="props.withSelectedLines"
    :updatedDocStep1="props.updatedDocStep1"
    @closeModal="closeModal"
    @changeStep="changeStep"
    @updateTable="updateTable"
    @updateMetrics="updateMetrics"
  />
</template>

<style scoped></style>
