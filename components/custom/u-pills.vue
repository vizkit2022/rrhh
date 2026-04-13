<script setup>
  import { computed, defineProps } from "vue";

  // Define props
  const props = defineProps({
    modelValue: {
      type: Number,
      default: 0,
    },
    pills: {
      type: Array,
      default: () => [],
      // example { label: "", color: "--bg-secondary-500", background: "--bg-secondary-100"},
    },
    height: {
      type: String,
      default: "28px",
    },
    icon: {
      type: String,
      default: "",
    },
    disabled: {
      type: Boolean,
      default: false,
    },
    revers: {
      type: Boolean,
      default: false,
    },
  });

  const stylePill = (i) => {
    return `background-color: var(${
      props.modelValue === i ? props.pills[i].background : "--neutral-surface-shadow-12a"
    });
    color: var(${
      props.modelValue === i ? props.pills[i].color : "--neutral-text-caption"
    });`;
  };
</script>

<template>
  <div class="containerGroup">
    <button
      :disabled="props.disabled"
      v-for="(pill, p) in pills"
      :key="p"
      class="containerGroup__btn"
      :style="stylePill(p)"
      @click.prevent="$emit('update:modelValue', p)"
    >
      <span v-if="!!props.icon" :class="`u u-${props.icon}`"></span>
      <span>{{ pill.label }}</span>
    </button>
  </div>
</template>

<style scoped>
  .containerGroup {
    display: flex;
    gap: 16px;
    align-items: center;
    height: v-bind("props.height");
    overflow-x: auto;
    width: 100%;
  }

  .containerGroup::-webkit-scrollbar {
    width: 0px;
    height: 0px;
  }
  .containerGroup__btn {
    height: v-bind("props.height");
    display: flex;
    flex-direction: v-bind("props.revers ? 'row-reverse' : 'row'");
    gap: 5px;
    padding: 2px 15px;
    border-radius: 40px;
    align-items: center;
    font-family: Nunito;
    font-size: 12px;
    font-weight: 600;
    line-height: 16px;
    letter-spacing: 0em;
    text-align: left;
    min-width: auto;
    flex-shrink: 0;
    transition: background-color 0.3s, color 0.1s;
  }
  button.containerGroup__btn:disabled {
    background-color: var(--bg-neutral-100) !important;
    color: var(--bg-neutral-400) !important;
  }
</style>
