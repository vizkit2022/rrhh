<script setup>
import { computed, ref, watch } from "vue";
import usePaymentsStore from "@/stores/payments";
import useOrganizationStore from "@/stores/organization";

// Stores
const paymentsStore = usePaymentsStore();
const organizationStore = useOrganizationStore();

// emits
const emit = defineEmits(["recalculateTable"]);

// Refs para los elementos tag de las monedas
const tagRefs = ref({});

// State para controlar colapsado de cada code
const collapsedStates = ref({});

// State para controlar la animación de salida
const isHiding = ref(false);

// State para trackear valores originales
const originalValues = ref({});

// Computed
const loading = computed(() => paymentsStore.formDeposits.currencyLoading);
const listExchangeRate = computed(() => {
  const baseCurrencyId =
    paymentsStore.formDeposits.lines?.[0]?.currency?.default?._id ||
    paymentsStore.formDeposits.lines?.[0]?.currency?.default;
  const currencyOrg = organizationStore?.organization?.currency?._id;
  return paymentsStore.formDeposits.currencies.filter(
    (c) => c._id === baseCurrencyId || c._id === currencyOrg,
  );
});

// Watch simplificado para manejar solo la salida
watch(
  () => listExchangeRate.value.length,
  (newVal, oldVal) => {
    if (newVal === 0 && oldVal > 0) {
      // Activar animación de salida
      isHiding.value = true;
      // Esperar a que termine la animación antes de ocultar
      setTimeout(() => {
        isHiding.value = false;
      }, 500);
    }
  },
);

// FUNCTIONS

// Función para asignar refs dinámicamente
const setTagRef = (el, currencyId) => {
  if (el) tagRefs.value[currencyId] = el;
};

// Función para obtener el ancho colapsado de cada code
const collapsedWidth = (currencyId) => {
  const tag = tagRefs.value[currencyId];
  return `${tag.offsetWidth + 1}px`;
};

// Función para togglear el estado de cada code
const toggleCollapse = (currencyId) => {
  collapsedStates.value[currencyId] = !collapsedStates.value[currencyId];
};

// Guardar el valor original al hacer focus
const handleFocus = (event, currency) => {
  setTimeout(() => {
    event.target.select();
  }, 0);
  originalValues.value[currency._id] = currency.valueManual;
};
const handleClick = (event) => {
  event.target.select();
};

// Guardar cambios al hacer blur (click afuera)
const handleBlur = (currency) => {
  // Solo guardar si el valor cambió
  if (originalValues.value[currency._id] !== currency.valueManual) {
    saveExchangeRate(currency);
  }
};

// Función para guardar la tasa de cambio
const saveExchangeRate = (currency) => {
  const originalIndex = paymentsStore.formDeposits.currencies.findIndex(
    (curr) => curr._id === currency._id,
  );

  if (originalIndex !== -1) {
    paymentsStore.formDeposits.currencies[originalIndex] = {
      ...paymentsStore.formDeposits.currencies[originalIndex],
      valueManual: currency.valueManual,
    };
  }

  // Emitir evento para recalcular tabla
  emit("recalculateTable");
};
</script>

<template>
  <div
    v-if="listExchangeRate.length || isHiding"
    class="listExchangeRate"
    :class="{ hiding: isHiding }"
    :disabled="loading"
  >
    <template v-if="loading">
      <u-loading :width="12" />
      <span>Obteniendo Tasas de Cambio...</span>
    </template>
    <template v-else>
      <div class="title">
        <span class="u u-edit"></span>
        <span>Tasas de cambio</span>
      </div>
      <div
        class="code"
        v-for="c in listExchangeRate"
        :key="c._id"
        :style="collapsedStates[c._id] ? { width: collapsedWidth(c._id) } : {}"
      >
        <span
          class="tag"
          @click="toggleCollapse(c._id)"
          :ref="(el) => setTagRef(el, c._id)"
        >
          {{ c.code || "-" }}
        </span>
        <input
          style="background-color: var(--neutral-background-default)"
          class="amount"
          type="number"
          v-model="c.valueManual"
          @click.stop
          @mousedown.stop
          @click="handleClick($event)"
          @focus="handleFocus($event, c)"
          @blur="handleBlur(c)"
        />
      </div>
    </template>
  </div>
</template>

<style scoped>
.listExchangeRate {
  display: flex;
  justify-content: flex-start;
  align-items: center;
  height: 32px;
  width: fit-content;
  max-width: 500px;
  background-color: transparent;
  border: 1px solid var(--secondary-border-default);
  gap: 17px;
  border-radius: 8px;
  padding: 0 8px 0 6px;
  overflow: hidden;
  white-space: nowrap;
  transform-origin: right center;
  animation: expandContainerFromRight 0.5s cubic-bezier(0.4, 0, 0.2, 1) forwards;
}

@keyframes expandContainerFromRight {
  from {
    max-width: 0;
    opacity: 0;
    padding: 0;
  }
  to {
    max-width: 500px;
    opacity: 1;
    padding: 0 8px 0 6px;
  }
}

@keyframes collapseContainerToRight {
  from {
    max-width: 500px;
    opacity: 1;
    padding: 0 8px 0 6px;
  }
  to {
    max-width: 0;
    opacity: 0;
    padding: 0;
  }
}

.listExchangeRate.hiding {
  animation: collapseContainerToRight 0.5s cubic-bezier(0.4, 0, 0.2, 1) forwards;
}

.listExchangeRate span {
  color: var(--secondary-text-default);
}
.listExchangeRate span.u {
  font-size: 18px;
  line-height: 18px;
}
.listExchangeRate span:not(.u) {
  font-size: 16px;
  line-height: 16px;
}

.listExchangeRate .title {
  display: flex;
  gap: 8px;
  align-items: center;
  width: 145px;
}

.listExchangeRate .code {
  display: flex;
  gap: 4px;
  width: 132px;
  height: 24px;
  border-radius: 8px;
  border: 1px solid var(--secondary-border-subtle);
  overflow: hidden;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.listExchangeRate .code.collapsed {
  width: 43px;
  gap: 0;
}

.listExchangeRate .code input.amount {
  flex: 1;
  min-width: 0;
  text-align: right;
  padding: 0 8px 0 0px;
  opacity: 1;
  transform: translateX(0);
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  border: none;
  outline: none;
  font-weight: 400;
  font-size: 14px;
  color: var(--neutral-text-body);
}

.listExchangeRate .code input.amount:hover {
  background-color: var(--neutral-surface-subtle);
}

.listExchangeRate .code input.amount:focus {
  background-color: var(--neutral-background-default);
}

.listExchangeRate .code input[type="number"]::-webkit-inner-spin-button,
.listExchangeRate .code input[type="number"]::-webkit-outer-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

.listExchangeRate .code input::selection {
  background-color: var(--primary-text-subtle);
  color: var(--neutral-background-default);
}

.listExchangeRate .code.collapsed input.amount {
  opacity: 0;
  transform: translateX(10px);
  width: 0;
  padding: 0;
  pointer-events: none;
}

.listExchangeRate .code span.tag {
  height: 24px;
  border-radius: 8px;
  background-color: var(--secondary-surface-softer);
  display: flex;
  align-items: center;
  padding: 0 4px;
  font-weight: 600;
  cursor: pointer;
  user-select: none;
  flex-shrink: 0;
  transition: background-color 0.2s ease;
}

.listExchangeRate .code span.tag:hover {
  background-color: var(--secondary-surface-light);
}

.listExchangeRate .code span.tag:active {
  transform: scale(0.98);
}

.listExchangeRate:disabled {
  border: 1px solid var(--neutral-text-disabled) !important;
}
.listExchangeRate:disabled span {
  color: var(--neutral-text-disabled) !important;
}
</style>
