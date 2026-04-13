<script setup>
  import { defineProps } from "vue";

  // Define props
  const props = defineProps({
    orientation: {
      type: String,
      default: "x",
    },
  });
</script>

<template>
  <div class="divider">
    <span>o</span>
  </div>
</template>

<style scoped>
  .divider {
    position: relative;
    width: v-bind("props.orientation === 'x' ? '100%' : '16px'");
    height: v-bind("props.orientation === 'x' ? '16px' : '100%'");
    display: flex;
    justify-content: center;
    align-items: center;
  }

  .divider::after {
    content: "";
    position: absolute;
    width: v-bind("props.orientation === 'x' ? '100%' : '1px'");
    height: v-bind("props.orientation === 'x' ? '1px' : '100%'");
    background-color: var(--neutral-text-caption);
  }

  .divider span {
    color: var(--neutral-text-caption);
    z-index: 2;
    padding: v-bind("props.orientation === 'x' ? '4px 8px' : '8px 4px'");
    background-color: var(--neutral-background-default);
    font-family: Nunito;
    font-size: 14px;
    font-weight: 500;
    line-height: 16px;
    letter-spacing: -0.02em;
    text-align: center;
  }
</style>
