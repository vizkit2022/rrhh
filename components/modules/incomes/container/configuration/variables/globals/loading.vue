<script setup>
import { useI18n } from "vue-i18n";

// Translations
const { t } = useI18n();
const module = "ui.income.sections.globals";
</script>

<template>
  <div class="noData-content">
    <u-loading />
    <span class="main">{{ t(`${module}.table.body.loader.label`) }}</span>
    <span class="second">{{ t(`${module}.table.body.loader.loading`) }}</span>
    <u-logo />
  </div>
</template>

<style scoped>
.noData-content {
  width: 100%;
  height: 300px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  gap: 16px;
}

.noData-content span {
  color: var(--neutral-text-caption);
  font-size: 14px;
  line-height: 14px;
  font-weight: 500;
}

.noData-content span.main {
  font-size: 18px;
  line-height: 18px;
  color: var(--neutral-text-body);
  font-weight: 600;
}
.noData-content span.second {
  font-size: 14px;
  line-height: 14px;
  color: var(--neutral-text-caption);
  font-weight: 500;
}
</style>
