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
    disabled: {
      type: Boolean,
      default: false
    }
  });
</script>

<template>
  <button class="containerSwitch"
    @click.prevent="$emit('update:modelValue', !modelValue)"
    @change="$emit('change')"
    :style="`background-color: var(${modelValue ? props.color : '--neutral-surface-light'}); filter: ${props.disabled ? 'opacity(0.5)' : 'none'};`"
    :disabled="props.disabled">
    <div
      class="switchCustom"
      :style="`transform: translateX(${modelValue ? 20 : 0}px);`"
    ></div>
  </button>
</template>

<style scoped>
  .containerSwitch {
    width: 40px;
    height: 20px;
    border-radius: 16px;
    cursor: pointer;
    outline: none;
    box-sizing: border-box;
    padding: 0 2px;
    transition: 0.3s;
  }
  .switchCustom {
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background-color: var(--neutral-background-default);
    transition: 0.3s;
  }
  .containerSwitch:disabled {
    cursor: not-allowed;
  }
</style>
