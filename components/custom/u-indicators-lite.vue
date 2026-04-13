<script setup>
import useGlobalStore from "@/stores/global";
import { defineProps, ref, computed } from "vue";

// Stores
const globalStore = useGlobalStore();

// Define props
const props = defineProps({
  indicators: {
    type: Array,
    default: () => [],
  },
  disabled: {
    type: Boolean,
    default: false,
  },
  loading: {
    type: Boolean,
    default: false,
  },
});

const textNoMetrics = computed(() => {
  return globalStore.lang === "es" ? "No hay métricas" : "No metrics";
});

// Define variables
const containerRef = ref(null);
const indicatorArr = computed(() => {
  return props.indicators.map((ind, i) => {
    return {
      ...ind,
      pos: i,
      selected: ind.default || false,
    };
  });
});

function handleWheel(event) {
  if (event.deltaY !== 0) {
    event.preventDefault();
    containerRef.value.scrollLeft += event.deltaY; // Scroll horizontal
  }
}

onMounted(() => {
  const container = containerRef.value;
  if (container) {
    container.addEventListener("wheel", handleWheel, { passive: false });
  }
});

onBeforeUnmount(() => {
  const container = containerRef.value;
  if (container) {
    container.removeEventListener("wheel", handleWheel);
  }
});
</script>

<template>
  <div class="container-indicators" ref="containerRef">
    <template v-if="props.indicators.length">
      <u-indicator-lite
        v-for="(indicator, i) in indicatorArr"
        :key="i"
        :indicator="indicator"
        :disabled="disabled"
        :loading="props.loading"
      />
    </template>
    <div v-else class="without-results">
      <span>{{ textNoMetrics }}</span>
    </div>
  </div>
</template>

<style scoped>
.container-indicators {
  display: flex;
  gap: 20px;
  padding: 2px 3px 4px 3px;
  width: 100%;
  max-width: min(100%, 1300px); /* Aplica el menor valor entre 100% y 1300px */
  overflow-x: auto;
  margin-inline: auto;
}

.container-indicators::-webkit-scrollbar {
  width: 0px;
  height: 0px;
}

.u-indicator-lite {
  min-width: 270px; /* Ajusta el tamaño mínimo para que no se comprima */
  flex: 0 0 auto; /* Evita que el elemento se comprima */
}

.without-results {
  color: var(--bg-neutral-500);
  font-weight: 600;
  font-size: 16px;
  height: 100%;
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
}
</style>
