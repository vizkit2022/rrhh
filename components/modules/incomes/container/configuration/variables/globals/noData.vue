<script setup>
import useIncomeStore from "@/stores/incomes";
import { useI18n } from "vue-i18n";

// Translations
const { t } = useI18n();
const module = "ui.income.sections.globals";

// Stores
const incomesStore = useIncomeStore();

// Functions
const newGroupModal = () => {
  incomesStore.configGlobals.modal.group = null;
  incomesStore.configGlobals.modal.show = true;
};
</script>

<template>
  <div class="noData">
    <span class="title">
      {{ t(`${module}.info.noGroups.title`) }}
    </span>
    <img src="/img/banking-transactions/lupa.svg" alt="empty variables" />
    <u-button
      :text="t(`${module}.info.noGroups.buttons.addGroup`)"
      icon="new"
      @click="newGroupModal"
    />
  </div>
</template>

<style scoped>
.noData {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 24px;
}
.noData .title {
  font-size: 16px;
  line-height: 16px;
  color: var(--neutral-text-caption);
}
</style>
