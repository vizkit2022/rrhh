<script setup>
  import { defineProps } from "vue";

  const props = defineProps({
    data: {
      type: Object,
      default: () => {},
    },
    option: {
      type: Number,
      default: 0,
    },
  });
</script>

<template>
  <div>form 5</div>
</template>

<script scoped></script>
