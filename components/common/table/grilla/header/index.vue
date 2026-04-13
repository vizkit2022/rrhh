<script setup>
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import useGrillaStore from "@/stores/grilla";
import useIncomesStore from "@/stores/incomes";
import useLinesStore from "@/stores/lines";

// Store
const grillaStore = useGrillaStore();
const incomesStore = useIncomesStore();
const linesStore = useLinesStore();

// Constants
const { t } = useI18n();
const module = "grilla.headers";

// Computed
const fixedDisabled = computed(() => grillaStore.updating || grillaStore.loading || linesStore.lines.length === 0);
const expandGroupsDisabled = computed(() => grillaStore.updating || grillaStore.loading);
const colsSpan = computed(() => {
  let cols = 1;
  if(grillaStore.config.showIdName) cols += 1;
  if(grillaStore.config.showCodeName) cols += 1;
  return cols;
});
const stickyPositions = computed(() => {
  const { showIdName, showCodeName } = grillaStore.config

  const name =
    showIdName && showCodeName ? "145px" :
    showIdName ? "60px" :
    showCodeName ? "85px" :
    "0px"

  return {
    id: "0px",
    code: showIdName ? "60px" : "0px",
    name
  }
});

// Function
const expandCol = (column) => {
  const colConfig = { ...column, expand: !column.expand };
  grillaStore.paintTable(colConfig);
  grillaStore.toggleGroup(column.prop);
};
const getNameSubColum = (column, subcolumn) => {
  return t(module + '.' + (column?.prop || 'incomes') + '.sublabels.' + (subcolumn?.prop || 'incomes'));
}

</script>

<template>
  <thead class="header">
    <tr>
      <!-- Actions -->
      <table-grilla-header-actions-upper />

      <!-- Lines -->
      <th :style="grillaStore.getColumnStyle('lines')" :class="{ 'fixed-column4': grillaStore.fixed, 'lines': true }" :colspan="colsSpan">
        <div class="flex" style="justify-content: space-between;">
          <div class="label">
            <span v-text="t(module + '.lines.label')"></span>
          </div>
          <div class="flex">
            <table-grilla-custom-btn-group v-if="!incomesStore.hollywood"/>
            <button :disabled="fixedDisabled" :class="`toggle-btn ${grillaStore.fixed ? 'selected' : ''}`" @click="grillaStore.fixed = !grillaStore.fixed" :title="t(module + '.lines.tooltips.' + (grillaStore.fixed ? 'unpin' : 'pin'))">
              <span class="u u-pin"></span>  
            </button>  
          </div>
        </div>
      </th>

      <!-- Groups -->
      <template v-for="column in grillaStore.columnsSetup.filter(c => c.available)" :key="column.prop">
        <th :style="grillaStore.getColumnStyle()" :colspan="grillaStore.collapsed[column.prop] ? 1 : column.subcolumns.length" class="group">
          <div :class="`flex ${column.prop}`">
            <div class="label">
              <span v-text="t(module + '.' + column.prop + '.label')"></span>
            </div>
            <button :disabled="expandGroupsDisabled" class="collapse-btn" :style="`transform: rotate(${column.expand ? 180 : 0}deg)`" @click="expandCol(column)">
              <span class="u u-chevron-right"></span>  
            </button>  
          </div>
        </th>
      </template>
    </tr>
    <tr>
      <!-- Actions -->
      <table-grilla-header-actions-lower />

      <!-- Lines -->
      <th v-if="grillaStore.config.showIdName" :style="grillaStore.getColumnStyle('id')" :class="{ 'fixed-column': grillaStore.fixed }" class="id">
        <div class="label">
          <span v-text="t(module + '.id.label')"></span>
        </div>
      </th>
      <th v-if="grillaStore.config.showCodeName" :style="grillaStore.getColumnStyle('code')" :class="{ 'fixed-column-2': grillaStore.fixed, 'code': true }">
        <div class="label">
          <span v-text="t(module + '.code.label')"></span>
        </div>
      </th>
      <th :style="grillaStore.getColumnStyle('name')" :class="{ 'fixed-column-3': grillaStore.fixed, 'name': true }">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <div class="label">
            <span v-text="t(module + '.name.label')"></span>
          </div>
        </div>
      </th>

      <!-- Groups -->
      <template v-for="column in grillaStore.columnsSetup.filter(c => c.available)" :key="column.prop">
        <template v-for="(subcolumn, s) in column.subcolumns" :key="subcolumn.prop">
          <th
            v-if="subcolumn.default || !grillaStore?.collapsed?.[column?.prop || 'incomes']"
            :style="grillaStore.getColumnStyle(subcolumn.typeCell)"
            :class="`group ${s === (column.subcolumns.length - 1) ? 'end' : 'between'}`"
          >
            <div :class="`label ${['unit','number'].includes(subcolumn.type) ? 'center' : 'right'}`">
              <span v-text="getNameSubColum(column, subcolumn)"></span>
            </div>
          </th>
        </template>
      </template>
    </tr>
  </thead>
</template>

<style scoped>

.header {
  position: sticky;
  top: 0;
  z-index: 10;
  background-color: var(--neutral-background-default);
}

.header th {
  color: var(--neutral-text-caption);
  font-weight: 600;
  text-align: left;
  position: relative;
}

.header tr:first-child th {
  height: 46px;
  border-bottom: 2px solid var(--neutral-border-subtle);
}
.header tr:last-child th {
  height: 36px;
}
.header tr:last-child th div.label {
  padding: 0 12px;
}
.header tr:last-child th div.label.center span {
  text-align: center;
}
.header tr:last-child th div.label.right span {
  text-align: right;
}
.header tr th {
  padding: 0px;
  height: 46px;
  border-bottom: 2px solid var(--neutral-border-subtle);
}
.header tr th.lines,
.header tr th.name,
.header tr th.actions {
  border-right: 2px solid var(--neutral-border-subtle);
}
.header th:last-child {
  border-right: none;
}
.header tr th div.flex {
  display: flex;
  align-items: center;
  padding: 0 12px;
  gap: 12px;
  height: 100%;
}
.header tr:last-child th div.label span,
.header tr th div.flex div.label span {
  font-size: 12px;
  line-height: 12px;
  color: var(--neutral-text-caption);
  width: 100%;
  display: block;
}
.header tr th div.flex.incomes {
  background-color: var(--warning-focus-input);
}
.header tr th div.flex.budget {
  background-color: var(--info-focus-input);
}
.header tr th div.flex.outcomes {
  background-color: var(--danger-focus-input);
}
.header tr th div.flex.projected {
  background-color: var(--success-focus-input);
}
.header:first-child tr th.group:not(:last-child) {
  border-right: 2px solid var(--neutral-border-subtle);
}
.header:last-child tr th:not(:last-child).group.end {
  border-right: 2px solid var(--neutral-border-subtle);
}
.header tr th.id,
.header:last-child tr th.group.between,
.header tr th.code {
  border-right: 1px solid var(--neutral-border-subtle);
}
.header tr:last-child th.code span {
  text-align: center;
}










.fixed-column {
  position: sticky !important;
  left: v-bind("stickyPositions.id");
  z-index: 5;
  background-color: var(--neutral-background-default);
}

.fixed-column-2 {
  position: sticky !important;
  left: v-bind("stickyPositions.code");
  z-index: 5;
  background-color: var(--neutral-background-default);
}

.fixed-column-3 {
  position: sticky !important;
  left: v-bind("stickyPositions.name");
  z-index: 5;
  background-color: var(--neutral-background-default);
}

button.toggle-btn {
  width: 26px;
  height: 26px;
  display: flex;
  justify-content: center;
  align-items: center;
  border: 1px solid var(--neutral-border-default);
  border-radius: 8px;
  background-color: var(--neutral-background-default);
  transition: 0.3s;
}
button.toggle-btn span {
  color: var(--neutral-text-caption);
  font-size: 18px;
  line-height: 18px;
  transition: 0.3s;
}
button.toggle-btn:not(:disabled):hover {
  border: 1px solid var(--primary-border-subtle);
}
button.toggle-btn:not(:disabled):hover span {
  color: var(--primary-text-subtle);
}
button.toggle-btn.selected {
  border: 1px solid var(--primary-border-subtle);
  background-color: var(--primary-surface-softer);
}
button.toggle-btn.selected span {
  color: var(--primary-text-subtle);
}
button.toggle-btn:disabled {
  border: 1px solid var(--neutral-border-disabled);
  cursor: not-allowed;
}
button.toggle-btn:disabled span {
  color: var(--neutral-text-disabled);
}

button.collapse-btn {
  height: 20px;
  width: 20px;
  display: grid;
  place-content: center;
  transition: 0.3s;
}
button.collapse-btn span {
  font-size: 16px;
  font-weight: 400;
  line-height: 16px;
}
button.collapse-btn:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

.incomes button.collapse-btn span {
  color: var(--warning-text-default);
}
.budget button.collapse-btn span {
  color: var(--info-text-default);
}
.outcomes button.collapse-btn span {
  color: var(--danger-text-default);
}
.projected button.collapse-btn span {
  color: var(--success-text-default);
}

.fixed-column4 {
  position: sticky !important;
  left: 0px;
  z-index: 9;
  background-color: var(--neutral-background-default);
}

.icon {
  width: 16px;
  height: 16px;
  fill: currentColor;
}
</style>
