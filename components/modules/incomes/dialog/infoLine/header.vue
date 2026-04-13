<script setup>
import { useI18n } from "vue-i18n";
import useGrillaStore from "@/stores/grilla";
import useLinesStore from "@/stores/lines";

// Stores
const linesStore = useLinesStore();
const grillaStore = useGrillaStore();

// Contants
const { t } = useI18n();
const module = "grilla.dialogs.infoLine";
</script>

<template>
  <div class="infoLine__header">
    <span class="truncateText">{{ linesStore.line.name }}</span>
    <span>{{ t(module + ".text") }}: {{ linesStore.line.code || "-" }}</span>
    <u-button-icon
      icon="close"
      class="btnIconModify"
      color="--neutral-text-caption"
      :disabled="grillaStore.configModalInfoLine.loading"
      type="outlined"
      size="s"
      @action-btn="grillaStore.closeModal()"
    />
  </div>
</template>

<style scoped>
.infoLine__header {
  display: grid;
  grid-template-areas: "titleText btn" "codeText btn";
  grid-template-columns: 1fr auto;
  column-gap: 16px;
}
span:nth-child(1) {
  grid-area: titleText;
  font-weight: 600;
  font-size: 16px;
  line-height: 16px;
  letter-spacing: 0%;
  color: var(--neutral-text-body);
}
span:nth-child(2) {
  grid-area: codeText;
  font-weight: 400;
  font-size: 10px;
  line-height: 10px;
  letter-spacing: 0%;
  color: var(--neutral-text-caption);
}
.btnIconModify {
  grid-area: btn;
  border-radius: 50%;
}
</style>
