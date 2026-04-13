<script setup>
import { defineProps } from "vue";

const props = defineProps({
  value: {
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
});
</script>

<template>
  <button
    class="containerCheckbox"
    :disabled="disabled"
    :style="`border: 1px solid var(${
      value ? props.color : '--neutral-border-light'
    })`"
    @click.prevent="$emit('change', !value)"
  >
    <div class="containerCheckbox__space"></div>
    <span
      v-if="value"
      class="u u-check"
      :style="`transform: scale(${value ? 1 : 0}); transition: 0.2s;`"
    ></span>
  </button>
</template>

<style scoped>
.containerCheckbox {
  width: v-bind("props.height + 'px'");
  height: v-bind("props.height + 'px'");
  border-radius: 2px;
  transition: 0.2s;
  background-color: var(--neutral-background-default);
  display: flex;
  justify-content: center;
  align-items: center;
  overflow: hidden;
  position: relative;
  cursor: pointer;
}
.containerCheckbox__space {
  position: absolute;
  background-color: v-bind(
    "props.value ? 'var(' + props.color + ')' : 'var(--neutral-background-default)'"
  );
  width: v-bind("props.height + 4 + 'px'");
  height: v-bind("props.height + 4 + 'px'");
  border-radius: 2px;
  transition: 0.2s;
}
.containerCheckbox:not(:disabled):hover {
  border: 1px solid var(v-bind("colorHover")) !important;
}
.containerCheckbox:not(:disabled):hover .containerCheckbox__space {
  background-color: var(v-bind("colorHover")) !important;
  opacity: v-bind("props.value ? '1' : '0.1'");
}
.containerCheckbox span {
  color: var(--white) !important;
  line-height: v-bind("props.height + 4 + 'px'");
  font-size: v-bind("props.height - 4 + 'px'");
  transition: 0.2s;
}
.containerCheckbox:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
