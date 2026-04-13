<script setup>
import { defineProps, defineEmits } from "vue";
import { useI18n } from "vue-i18n";

const props = defineProps({
  option: {
    type: Number,
    default: 0,
  },
});

// TRANSLATIONS
const { t } = useI18n();
const module = "modules.organizations.settingsOrganizations";

const emit = defineEmits(["selectedOp"]);

const options = [
  { label: `${module}.nav.nav1`, value: 0, disabled: true },
  { label: `${module}.nav.nav2`, value: 1, disabled: true },
  { label: `${module}.nav.nav3`, value: 2, disabled: false },
  { label: `${module}.nav.nav4`, value: 3, disabled: true },
  { label: `${module}.nav.nav5`, value: 4, disabled: true },
  { label: `${module}.nav.nav6`, value: 5, disabled: true },
];
</script>

<template>
  <div class="nav">
    <button
      v-for="(option, op) in options"
      :key="op"
      :class="props.option === option.value ? 'selected' : ''"
      @click="emit('selectedOp', option)"
      :disabled="option.disabled"
    >
      {{ t(`${option.label}`) || "..." }}
    </button>
  </div>
</template>

<style scoped>
.nav {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.nav button {
  height: 40px;
  width: 240px;
  background-color: var(--neutral-background-default);
  transition: 0.3s;
  font-family: Nunito;
  font-size: 16px;
  font-weight: 600;
  line-height: 20px;
  letter-spacing: 0em;
  text-align: left;
  color: var(--neutral-text-caption);
  padding: 0 20px;
  border-radius: 8px;
}
.nav button:not(:disabled):hover,
.nav button:not(:disabled).selected {
  background-color: var(--primary-surface-shadow-8a);
  color: var(--primary-text-default);
}
.nav button:disabled {
  background-color: var(--neutral-background-default);
  cursor: not-allowed;
  opacity: 0.5;
}
</style>
