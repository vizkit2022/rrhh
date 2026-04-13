<script setup>
// Imports
import { ref, computed, onMounted, onBeforeUnmount, nextTick, defineEmits, defineExpose } from 'vue';
import {
  IncomesCardsV2Units,
  IncomesCardsV2Vars,
  IncomesCardsV2VarsAndCurrencies,
  IncomesCardsTime,
  IncomesCardsV2Purchases
} from "#components";
import useGrillaStore from "@/stores/grilla";

const grillaStore = useGrillaStore();
const emit = defineEmits(["saveDropdown"]);

// Vistas
const views = {
  units: IncomesCardsV2Units,
  vars: IncomesCardsV2Vars,
  varsAndCurrencies: IncomesCardsV2VarsAndCurrencies,
  time: IncomesCardsTime,
  purchases: IncomesCardsV2Purchases,
};

const contentView = computed(() => {
  return views[grillaStore.configDropdownCell?.header?.dropdown || "vars"];
});

// Posición calculada
const dropdownPositionStyle = ref(null);

const calculatePosition = () => {
  const config = grillaStore.configDropdownCell;
  if (!config) return;

  const input = document.getElementById(config.idParent);
  const container = document.getElementById(config.idContainer);

  if (!input || !container) {
    console.error("Elementos no encontrados.");
    return;
  }

  const dropdownHeight = config.height || 150;
  const dropdownWidth = config.width || 200;

  const inputRect = input.getBoundingClientRect();
  const containerRect = container.getBoundingClientRect();

  const inputRight = inputRect.right;
  const inputBottom = inputRect.bottom;

  const relativeX = inputRight - containerRect.left;
  const relativeY = inputBottom - containerRect.top;

  const viewportHeight = window.innerHeight;
  const hasSpaceBelow = inputBottom + 42 + dropdownHeight < viewportHeight;

  dropdownPositionStyle.value = hasSpaceBelow
    ? {
        left: relativeX - dropdownWidth + "px",
        top: relativeY + 49 + "px",
      }
    : {
        left: relativeX - dropdownWidth + "px",
        bottom:
          containerRect.height - (inputRect.top - containerRect.top) + 1 + "px",
      };
};

const updatePosition = () => {
  nextTick(() => {
    calculatePosition();
  });
};

const handleClickOutside = (event) => {
  const dropdown = document.querySelector(".dropdown-cell");
  if (dropdown && !dropdown.contains(event.target)) {
    grillaStore.dropdownCloseEvent();
  }
};

// Ciclos de vida
onMounted(() => {
  if (grillaStore.configDropdownCell) {
    nextTick(() => {
      calculatePosition();
    });
  }
  document.addEventListener("click", handleClickOutside);
});

onBeforeUnmount(() => {
  document.removeEventListener("click", handleClickOutside);
});

// Exposición
defineExpose({
  updatePosition,
});
</script>

<template>
  <div class="dropdown-cell" :style="dropdownPositionStyle">
    <component v-if="contentView" :is="contentView" />
  </div>
</template>

<style scoped>
.dropdown-cell {
  position: absolute;
  width: v-bind("(grillaStore.configDropdownCell?.width || 0) + 'px'");
  height: v-bind("(grillaStore.configDropdownCell?.height || 0) + 'px'");
  background-color: var(--neutral-background-default);
  border-radius: 8px;
  box-shadow: var(--elevation-l);
  z-index: 20;
  overflow: hidden;
  box-sizing: border-box;
  animation: dropdownFadeIn 0.2s ease-out;
  padding: 12px;
}

@keyframes dropdownFadeIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
