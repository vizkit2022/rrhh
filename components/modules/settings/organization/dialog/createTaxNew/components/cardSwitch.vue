<script setup>
const modelValue = defineModel({
  type: Boolean,
  default: false,
});

const props = defineProps({
  title: {
    type: String,
    default: "...",
  },
  disableSwitch: {
    type: Boolean,
    default: false,
  },
});
</script>

<template>
  <div class="cardSwitch">
    <div class="cardSwitch__switch">
      <u-switch v-model="modelValue" :disabled="props.disableSwitch" />
    </div>
    <div class="cardSwitch__content">
      <span class="body-m-sb">{{ props.title }}</span>
      <slot />
    </div>
  </div>
</template>

<style scoped>
.cardSwitch {
  display: grid;
  grid-template-columns: 52px 1fr;
  padding: 12px 16px;
  height: 78px;
  border: 1px solid var(--neutral-border-subtle);
  border-radius: 16px;
  gap: 16px;
}

.cardSwitch__switch {
  display: flex;
  justify-content: center;
  align-items: center;
}

.cardSwitch__content {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: center;
  gap: 6px;
}

.cardSwitch__content span {
  color: var(--neutral-text-body);
}
</style>
