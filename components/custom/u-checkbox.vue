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
    default: "--primary-border-default",
  },
  colorHover: {
    type: String,
    default: "--primary-border-subtle",
  },
  disabled: {
    type: Boolean,
    default: false,
  },
  height: {
    type: Number,
    default: 20,
  },
  partial: {
    type: Boolean,
    default: false,
  },
});

// Define variables
const color = `var(${props.color})`;
const colorHover = `var(${props.colorHover})`;
</script>

<template>
  <button
    class="containerCheckbox"
    @click.prevent="$emit('update:modelValue', !modelValue)"
    :style="`border: 1px solid var(${
      modelValue
        ? props.color
        : props.partial
          ? '--warning-border-default'
          : '--neutral-border-subtle'
    })`"
    :disabled="disabled"
  >
    <div class="containerCheckbox__space"></div>
    <span
      v-if="modelValue"
      class="u u-check"
      :style="`transform: scale(${modelValue ? 1 : 0}); transition: 0.3s;`"
    ></span>
    <span
      v-else-if="props.partial"
      class="u u-minus-line"
      :style="`transform: scale(${props.partial ? 1 : 0}); transition: 0.3s;`"
    ></span>
  </button>
</template>

<style scoped>
.containerCheckbox {
  width: v-bind("props.height + 'px'");
  height: v-bind("props.height + 'px'");
  border-radius: 2px;
  transition: 0.3s;
  background-color: var(--neutral-background-default);
  display: flex;
  justify-content: center;
  align-items: center;
  overflow: hidden;
  position: relative;
}
.containerCheckbox__space {
  position: absolute;
  background-color: v-bind(
    "props.modelValue ? color : props.partial ? 'var(--warning-surface-default)' : 'var(--neutral-background-default)'"
  );
  width: v-bind("props.height + 4 + 'px'");
  height: v-bind("props.height + 4 + 'px'");
  border-radius: 2px;
  transition: 0.3s;
}
.containerCheckbox:not(:disabled):hover {
  border: 1px solid
    v-bind(
      "!props.modelValue && props.partial ? 'var(--warning-border-subtle)' : colorHover"
    ) !important;
  transition: 0.3s;
}
.containerCheckbox:not(:disabled):hover .containerCheckbox__space {
  background-color: v-bind(
    "!props.modelValue && props.partial ? 'var(--warning-border-subtle)' : colorHover"
  ) !important;
  opacity: v-bind("props.modelValue || props.partial ? '1' : '0.1'");
}
.containerCheckbox span {
  color: var(--white) !important;
  transition: 0.3s;
  line-height: v-bind("props.height + 4 + 'px'");
  font-size: v-bind("props.height - 4 + 'px'");
}
.containerCheckbox:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.containerCheckbox:disabled .containerCheckbox__space {
  opacity: 0.8;
}
.containerCheckbox:disabled span {
  color: var(--white) !important;
  transition: 0.3s;
}
</style>
