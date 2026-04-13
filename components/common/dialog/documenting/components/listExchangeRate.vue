<script setup>
import { computed, ref, watch } from "vue";
import useSalesStore from "@/stores/sales";
import useOutcomesStore from "@/stores/outcomes";

// Stores
const salesStore = useSalesStore();
const outcomesStore = useOutcomesStore();

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
const loading = computed(
  () => outcomesStore.formDocumenting.loadings.currencies,
);

const listExchangeRate = computed(() => {
  const formData = outcomesStore.formDocumenting;

  if (!formData) return [];

  // Retornar las monedas de tasas de cambio (othersCurrency)
  return formData.othersCurrency || [];
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

// Función para asignar refs dinámicamente
const setTagRef = (el, currencyId) => {
  if (el) tagRefs.value[currencyId] = el;
};

// Función para obtener el ancho colapsado de cada code
const collapsedWidth = (currencyId) => {
  const tag = tagRefs.value[currencyId];
  if (!tag) return "41px";
  return `${tag.offsetWidth + 1}px`; // +1 por el border
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
  const others = outcomesStore.formDocumenting.othersCurrency;
  const index = others.findIndex((c) => c._id === currency._id);

  if (index !== -1) {
    others[index] = {
      ...others[index],
      valueManual: Number(currency.valueManual),
    };
  }

  // Emitir evento para recalcular tabla
  // emit("recalculateTable");
};

// Función para manejar el scroll del mause al hacer scroll con el ratón
const handleWheelScroll = (event) => {
  event.currentTarget.scrollLeft += event.deltaY;
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
      <div class="codes-wrapper" @wheel.prevent="handleWheelScroll">
        <div
          class="code"
          v-for="c in listExchangeRate"
          :key="c._id"
          :style="
            collapsedStates[c._id] ? { width: collapsedWidth(c._id) } : {}
          "
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
  overflow-x: auto;
  overflow-y: hidden;
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

.codes-wrapper {
  display: flex;
  gap: 17px;
  overflow-x: auto;
  overflow-y: hidden;
  flex: 1;
}

.codes-wrapper::-webkit-scrollbar {
  height: 2px;
}

.codes-wrapper::-webkit-scrollbar-track {
  background: transparent;
}

.codes-wrapper::-webkit-scrollbar-thumb {
  background-color: var(--secondary-border-default);
  border-radius: 8px;
}

.codes-wrapper::-webkit-scrollbar-thumb:hover {
  background-color: var(--secondary-text-default);
}

.listExchangeRate .code {
  display: flex;
  gap: 4px;
  width: 132px;
  height: 24px;
  border-radius: 8px;
  border: 1px solid var(--secondary-border-subtle);
  overflow: hidden;
  flex-shrink: 0;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
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
