<script setup>
import { defineProps, defineEmits, computed, ref, onMounted } from "vue";
import usePaymentsStore from "@/stores/payments";

// Stores
const paymentsStore = usePaymentsStore();

// Emits
const emit = defineEmits(["closeModal", "changeStep"]);

// Props
const props = defineProps({
  page: {
    type: String,
    default: "listOc"
  }
});

// Constants
const step = ref(1);

onMounted(() => {
  if(props.page !== "listOc" || payState.value === "todoBien") {
    step.value = 2;
  }
});

// Computed
const payState = computed(() => {
  const lines = paymentsStore.formGoToPay?.lines ?? [];

  if (!Array.isArray(lines) || lines.length === 0) return "sinSeleccion";

  // 1. Verificar proveedores únicos
  const supplierList = new Set();
  for (const line of lines) {
    const id = line?.supplier?.contact?._id;
    const userId = line?.supplier?.contact?.user?._id;
    if (id) supplierList.add(`c-${id}`);
    else if (userId) supplierList.add(`u-${userId}`);
    if (supplierList.size > 1) {
      return "multiproveedor";
    }
  }

  // 2. Verificar compras solo con status=inProcess
  const statusSet = new Set(lines.map(l => l?.status));
  if (statusSet.size > 1 || !statusSet.has("inProcess")) {
    return "estadoNoInProcess";
  }

  // 3.Diferentes monedas
  const currencySet = new Set(lines.map(l => l?.currency?.default?._id));
  if (currencySet.size > 1) {
    return "variasCurrencies";
  }

  // 4. Verificar si algún monto es 0
  const withZero = lines.some(
    l => l?.numbers?.unpaid?.numberAprox === 0
  );
  if (withZero) {
    return "montoNoPagable";
  }

  // 4. Todo bien
  return "todoBien";
});


</script>

<template>
  <DialogGoToPayStep2Part1
    v-if="step === 1" 
    :page="props.page"
    :payState="payState"
    @closeModal="emit('closeModal')"
    @nextStep="step = 2" 
    @backStep="emit('changeStep', false)" />
  <DialogGoToPayStep2Part2
    v-else @closeModal="emit('closeModal')"
    :page="props.page"
    :payState="payState"
    @changeStep="emit('changeStep', true)"
    @backStep="step = 1" />
</template>

<style scoped>

</style>
