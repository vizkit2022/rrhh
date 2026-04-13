<script setup>
import useSalesStore from "@/stores/sales";
import useGlobalStore from "@/stores/global";

//STORE
const salesStore = useSalesStore();
const globalStore = useGlobalStore();

import {
  DialogCreateSalesDocInvoicesStep1,
  DialogCreateSalesDocInvoicesStepConfirmSii,
  DialogCreateSalesDocInvoicesStep2,
  DialogCreateSalesDocInvoicesStep3,
  DialogCreateSalesDocInvoicesStep4,
} from "#components";

// PROPS
const props = defineProps({
  initTab: {
    type: Number,
    default: 1,
  },
});

// EMITS
const emit = defineEmits(["closeModal", "updatePadding", "reloadSales"]);

// VIEWS DIALOG
const stepsViews = {
  1: DialogCreateSalesDocInvoicesStep1,
  2: DialogCreateSalesDocInvoicesStepConfirmSii,
  3: DialogCreateSalesDocInvoicesStep2,
  4: DialogCreateSalesDocInvoicesStep3,
  5: DialogCreateSalesDocInvoicesStep4,
};

//CONSTANTS
const step = ref(props.initTab);
const prevStep = ref(null);

// COMPUTED
const stepsView = computed(() => stepsViews[step.value]);

//FUNTIONS
const changeStep = (next, numberStep) => {
  prevStep.value = step.value;

  // Cambio de Tab
  if (numberStep) {
    step.value = numberStep;
    return;
  }
  // Cambio de Step
  if (next && step.value < 6) {
    step.value += 1;
  } else if (!next && step.value > 0) {
    step.value -= 1;
  }
};

onMounted(async () => {
  // globalStore.loading = true;
  // const resp = await globalStore.getMyCurrencies();
  // salesStore.formDocInvoice.formRegister.formDataInvoice.currencies = resp.currencies;
  // salesStore.formDocInvoice.formRegister.formDataInvoice.currencies.unshift(resp.currency)
  // salesStore.formDocInvoice.formRegister.formDataInvoice.currency = resp.currency
  // salesStore.formDocInvoice.formRegister.formDataInvoice.currencyName = resp?.currency?.name?.[globalStore.lang];
  // globalStore.loading = false;
});
</script>

<template>
  <component
    :is="stepsView"
    @changeStep="changeStep"
    @updatePadding="emit('updatePadding')"
    @closeModal="emit('closeModal')"
    @reloadSales="emit('reloadSales')"
    :initTab="initTab"
    :prevStep="prevStep"
  />
</template>

<style scoped></style>
