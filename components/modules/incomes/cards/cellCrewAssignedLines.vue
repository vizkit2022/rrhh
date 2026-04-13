<script setup>
import { defineProps } from "vue";

// Props
const props = defineProps({
  data: {
    type: Object,
    default: () => ({
      numberLines : 0,
    }),
  },
});
</script>

<template>
  <div class="cellCrewAssignedLines">
    <span>{{ data.numberLines || 0 }}</span>
  </div>
</template>

<style scoped>
.cellCrewAssignedLines {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}
.cellCrewAssignedLines span {
  font-size: 14px;
  font-weight: 600;
  color: var(--neutral-text-caption);
}
</style>
