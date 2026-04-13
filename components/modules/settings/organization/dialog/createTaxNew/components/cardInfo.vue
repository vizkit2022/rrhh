<script setup>
const props = defineProps({
  title: {
    type: String,
    default: "...",
  },
  icon: {
    type: String,
    default: "",
  },
});
</script>

<template>
  <div class="card">
    <div class="card__header">
      <span :class="`u u-${icon}`"></span>
      <span class="body-l-sb">{{ title }}</span>
    </div>
    <div class="card__body">
      <slot name="content"></slot>
    </div>
  </div>
</template>

<style scoped>
.card {
  display: grid;
  grid-template-rows: 32px 1fr;
  border: 1px solid var(--neutral-border-subtle);
  border-radius: 16px;
  padding: 14px 16px;
  gap: 12px;
}

.card__header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--neutral-border-subtle);
}

.card__header span:nth-child(1) {
  width: 24px;
  height: 24px;
  font-size: 24px;
  color: var(--secondary-text-default);
}
</style>
