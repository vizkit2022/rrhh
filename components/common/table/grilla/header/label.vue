<script setup>
import { useI18n } from "vue-i18n";

// Constants
const { t } = useI18n();
const module = "grilla.headers";
</script>

<template>
  <div class="id">
    <span v-text="t(module + '.id.label')"></span>
  </div>
</template>

<style scoped>
.id {
  display: flex;
  align-items: center;
  padding: 0 12px;
  height: 36px;
}
.id span {
  color: var(--neutral-text-caption);
  font-size: 12px;
  font-weight: 600;
  line-height: 12px;
}
</style>
