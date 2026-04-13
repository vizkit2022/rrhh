<script setup>
import useGrillaStore from "@/stores/grilla";

// STORES
const grillaStore = useGrillaStore();

// Constants
const { t } = useI18n();
const uiLabel = "grilla.dialogs.settings.visualization";
const rowsBtn = ["small", "medium", "large", "extraLarge"];
const colsNameBtn = ["small", "medium", "large"];

</script>

<template>
  <div class="card">
    <div class="card_header">
      <span class="u u-height icon"></span>
      <span class="title">{{ t(uiLabel + '.heights.name') }}</span>
    </div>
    <div class="card_body">
      <div class="card_body-group rows">
        <button 
          @click="grillaStore.configTemp.sizeRow = row"
          v-for="row in rowsBtn" :key="row" 
          :class="`${row} ${grillaStore.configTemp.sizeRow === row ? 'selected' : ''}`">
          <span>{{ t(uiLabel + '.heights.buttons.' + row) }}</span>
        </button>
      </div>
    </div>
  </div>
  <div class="card">
    <div class="card_header">
      <span class="u u-width icon"></span>
      <span class="title">{{ t(uiLabel + '.colNameWidth.name') }}</span>
    </div>
    <div class="card_body">
      <div class="card_body-group lines">
        <button 
          @click="grillaStore.configTemp.sizeColName = col"
          v-for="col in colsNameBtn" :key="col" 
          :class="`${col} ${grillaStore.configTemp.sizeColName === col ? 'selected' : ''}`">
          <span>{{ t(uiLabel + '.colNameWidth.buttons.' + col) }}</span>
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.card {
  padding: 8px 16px;
  border: 1px solid var(--neutral-border-subtle);
  border-radius: 16px;
  display: grid;
  grid-template-rows: 40px auto;
  row-gap: 12px;
}
.card_header {
  display: grid;
  grid-template-columns: 20px auto 1fr;
  border-bottom: 1px solid var(--neutral-border-subtle);
  align-items: center;
  column-gap: 12px;
}
.card_header span.icon {
  font-size: 24px;
  line-height: 24px;
  color: var(--secondary-text-subtle);
}
.card_header span.title {
  font-weight: 600;
  font-size: 14px;
  line-height: 14px;
  padding-top: 2px;
  color: var(--neutral-text-body);
}
.card_body {
  padding: 8px 12px 12px;
}
.card_body-group.rows {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    column-gap: 12px;
    align-items: flex-end;
}
.card_body-group.lines {
    display: flex;
    flex-direction: column;
    gap: 12px;
}
.card_body-group > button {
    padding: 12px;
    background-color: var(--neutral-surface-light);
    border-radius: 8px;
    display: flex;
    align-items: center;
    transition: 0.3s;
}
.card_body-group > button span {
  font-weight: 600;
  font-size: 14px;
  line-height: 18px;
  letter-spacing: 0%;
  vertical-align: middle;
  color: var(--neutral-text-body);
    transition: 0.3s;
}
.card_body-group > button:hover,
.card_body-group > button.selected {
    background-color: var(--primary-surface-shadow-8a);
}
.card_body-group > button.selected {
  border: 1px solid var(--primary-border-subtle);
}
.card_body-group > button:hover span,
.card_body-group > button.selected span {
    color: var(--primary-text-default);
}
.card_body-group.rows .small { height: 32px; }
.card_body-group.rows .medium { height: 36px; }
.card_body-group.rows .large { height: 48px; }
.card_body-group.rows .extraLarge { height: 52px; }

.card_body-group.lines .small { height: 40px; width: 300px; }
.card_body-group.lines .medium { height: 40px; width: 400px; }
.card_body-group.lines .large { height: 40px; width: 500px; }
</style>
