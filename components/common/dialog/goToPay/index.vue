<script setup>
import { ref, computed, onUnmounted, onMounted, defineProps } from "vue";
import usePaymentsStore from "@/stores/payments";
import useOrganizationStore from "@/stores/organization";
import useGlobalStore from "@/stores/global";

// Stores
const paymentsStore = usePaymentsStore();
const organizationStore = useOrganizationStore();
const globalStore = useGlobalStore();

// Components
import {
  DialogGoToPayStep2,
  DialogGoToPayStep3,
  DialogGoToPayStep4,
  DialogGoToPayStep5,
  DialogGoToPayStep6,
} from "#components";

// Steps
const stepsViews = {
  2: DialogGoToPayStep2,
  3: DialogGoToPayStep3,
  4: DialogGoToPayStep4,
  5: DialogGoToPayStep5,
  6: DialogGoToPayStep6,
};

// Emits
const emit = defineEmits(["closeModal", "updateSection", "refresh"]);

// Props
const props = defineProps({
  initTab: {
    type: Number,
    default: 2,
  },
  page: {
    type: String,
    default: "listOc",
  },
});

// Constants
const step = ref(props.initTab);

// Computed
const stepsView = computed(() => stepsViews[step.value]);

// Functions
const changeStep = (next) => {
  // Cambio de Step
  if (next && step.value < 7) {
    step.value += 1;
  } else if (!next && step.value > 1) {
    step.value -= 1;
  }
};

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

// Mounted
onMounted(async () => {
  // Cargar moneda de la org si hay mas de un compra que pagar
  // const lines = paymentsStore?.formGoToPay?.lines ?? [];
  // if (!lines.length) return;

  // const resp = await globalStore.getMyCurrencies(
  //   false,
  //   lines[0]?.currency?.default?._id,
  // );
  // const form = paymentsStore.formGoToPay;

  // form.currencies = [resp.currency, ...resp.currencies];

  // const selectedCurrency =
  //   lines.length > 1 ? resp.currency : lines[0]?.currency?.default;

  // form.currency = selectedCurrency;
  // form.currencyName = selectedCurrency?.name?.[globalStore.lang];

  // Cargar proveedor
  const idSupplier = paymentsStore?.formGoToPay?.supplier?.contact?._id || null;
  await paymentsStore.getPaymentMethods();

  // Cargar cuentas del proveedor - DESTINATARIO
  if (idSupplier) {
    const resDestination = await paymentsStore.getBankAccountsByUser(
      idSupplier,
      true,
    );
    paymentsStore.formGoToPay.destinationBankAccounts = resDestination || [];
  }
});

onUnmounted(() => {
  paymentsStore.resetGoToPay();
});
</script>

<template>
  <component
    :is="stepsView"
    @closeModal="emit('closeModal')"
    @changeStep="changeStep"
    @updateSection="emit('updateSection')"
    @refresh="emit('refresh')"
    :page="page"
    :initTab="initTab"
  />
</template>

<style scoped></style>
