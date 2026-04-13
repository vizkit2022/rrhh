<script setup>
// Imports
import {
  defineProps,
  ref,
  computed,
  onMounted,
  onBeforeUnmount,
  nextTick,
  defineEmits,
  defineExpose,
} from "vue";
import {
  IncomesCardsUnits,
  IncomesCardsVars,
  IncomesCardsVarsAndCurrencies,
  IncomesCardsTime,
} from "#components";

// Props
const props = defineProps({
  config: {
    type: Object,
    default: () => ({}),
  },
});
const { idParent, idContainer, height, width } = props.config;

// Emits
const emit = defineEmits(["dropdownClose", "saveDropdown"]);

// Vistas
const views = {
  units: IncomesCardsUnits,
  vars: IncomesCardsVars,
  varsAndCurrencies: IncomesCardsVarsAndCurrencies,
  time: IncomesCardsTime,
};

const contentView = computed(
  () => views[props?.config?.header?.dropdown || "vars"]
);

// Referencias reactivas
const dropdownPositionStyle = ref(null);

// Métodos
const calculatePosition = () => {
  const input = document.getElementById(idParent);
  const container = document.getElementById(idContainer);

  if (!input || !container) {
    console.error("Elementos no encontrados.");
    return;
  }

  const dropdownHeight = height || 150;
  const dropdownWidth = width || 200;

  const inputRect = input.getBoundingClientRect();
  const containerRect = container.getBoundingClientRect();

  const inputRight = inputRect.right;
  const inputBottom = inputRect.bottom;

  const relativeX = inputRight - containerRect.left;
  const relativeY = inputBottom - containerRect.top;

  const viewportHeight = window.innerHeight;
  const hasSpaceBelow = inputBottom + 42 + dropdownHeight < viewportHeight;

  if (hasSpaceBelow) {
    dropdownPositionStyle.value = {
      left: relativeX - dropdownWidth + "px",
      top: relativeY + 43 + "px",
    };
  } else {
    const distanceFromTopToInput = inputRect.top - containerRect.top;
    dropdownPositionStyle.value = {
      left: relativeX - dropdownWidth + "px",
      bottom: containerRect.height - distanceFromTopToInput + 1 + "px",
    };
  }
};

const updatePosition = () => {
  nextTick(() => {
    calculatePosition();
  });
};

const handleClickOutside = (event) => {
  const dropdown = document.querySelector(".dropdown-cell");
  if (dropdown && !dropdown.contains(event.target)) {
    emit("dropdownClose");
  }
};

const saveDropdown = (data) => {
  emit("saveDropdown", data);
  setTimeout(() => {
    emit("dropdownClose");
  }, 100);
};

// Ciclos de vida
onMounted(() => {
  nextTick(() => {
    calculatePosition();
  });
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
    <component
      v-if="contentView"
      :is="contentView"
      :config="config"
      @saveDropdown="saveDropdown"
      @dropdownClose="emit('dropdownClose')"
    />
  </div>
</template>

<style scoped>
.dropdown-cell {
  position: absolute;
  width: v-bind("(width || 0) + 'px'");
  height: v-bind("(height || 0) + 'px'");
  background-color: var(--neutral-background-default);
  border-radius: 8px;
  box-shadow: var(--elevation-l);
  z-index: 6;
  overflow: hidden;
  box-sizing: border-box;
  padding: 16px;
}

/* Animación de entrada */
.dropdown-cell {
  animation: dropdownFadeIn 0.2s ease-out;
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
