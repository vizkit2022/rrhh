<script setup>
import { defineProps } from "vue";

// Define props
const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
  color: {
    type: String,
    default: "--bg-primary-500",
  },
  colorHover: {
    type: String,
    default: "--bg-primary-400",
  },
  disabled: {
    type: Boolean,
    default: false,
  },
});

// Define los eventos que el componente emitirá
const emit = defineEmits(["update:modelValue", "select"]);

// Maneja el clic y emite eventos
function handleClick() {
  if (!props.disabled) {
    emit("update:modelValue", !props.modelValue); // Actualiza el estado
    emit("select"); // Emite el evento select
  }
}

// Define variables
const color = `var(${props.color})`;
const colorHover = `var(${props.colorHover})`;
</script>

<template>
  <button
    class="containerRadio"
    @click.prevent="handleClick"
    :style="`border: 1px solid var(${
      modelValue ? props.color : '--bg-neutral-300'
    })`"
    :disabled="disabled"
  >
    <div class="containerRadio__space"></div>
    <div
      class="containerRadio__radio"
      :style="`transform: scale(${modelValue ? 1 : 0});`"
    ></div>
  </button>
</template>

<style scoped>
.containerRadio {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  transition: 0.3s;
  background-color: var(--neutral-background-light);
  display: flex;
  justify-content: center;
  align-items: center;
  overflow: hidden;
  position: relative;
}
.containerRadio__space {
  position: absolute;
  background-color: var(--neutral-background-light);
  width: 20px;
  height: 20px;
  border-radius: 50%;
  transition: 0.3s;
}
.containerRadio__radio {
  background-color: v-bind("color");
  width: 12px;
  height: 12px;
  border-radius: 50%;
  transition: 0.3s;
}
.containerRadio:not(:disabled):hover {
  border: 1px solid v-bind("colorHover") !important;
  transition: 0.3s;
}
.containerRadio:not(:disabled):hover .containerRadio__space {
  background-color: v-bind("colorHover");
  opacity: 0.1;
}
.containerRadio:not(:disabled):hover .containerRadio__radio {
  background-color: v-bind("colorHover");
  transition: 0.3s;
}
.containerRadio:disabled {
  border: 1px solid var(--bg-neutral-400) !important;
  cursor: not-allowed;
}
.containerRadio:disabled .containerRadio__space {
  background-color: var(--bg-neutral-300) !important;
  opacity: 0.1;
}
.containerRadio:disabled .containerRadio__radio {
  background-color: var(--bg-neutral-400) !important;
  transition: 0.3s;
}
</style>
