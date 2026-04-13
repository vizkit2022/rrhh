<script setup>
import { computed } from "vue";
import useGrillaStore from "@/stores/grilla";
import useLinesStore from "@/stores/lines";
import useIncomesStore from "@/stores/incomes";
import usePermissionsStore from "@/stores/permissions";

// Store
const grillaStore = useGrillaStore();
const linesStore = useLinesStore();
const incomesStore = useIncomesStore();
const permissionsStore = usePermissionsStore();

// Constants
const { t } = useI18n();
const uiLabel = "grilla.headers.actions";

// Functions
const addItem = (whatToCreate) => {

  if(linesStore.lines.some(l => l.name === "")) {
    const l = linesStore.lines.filter(l => l.isVisible).findIndex(l => l.name === "");
    const input = document.getElementById(`input-${l}-name`);
    if (input) {
      input.focus();
    }
    return;
  }

  let pos = 0;
  if(hollywood.value) {
    if(grillaStore.breadcrumb.length === 0) {
      pos = 0;
    } else {
      pos = 1;
    }
  }

  const newIdInput = `input-${pos}-name`;

  const config = {
    enterEvent: false,
    newIdInput,
    creatorType: "global",
    creationTarget: whatToCreate
  };
  
  linesStore.addEmptyLine(config); 

};

// Permisos
const addLinePemission = computed(() => permissionsStore?.myPermissions?.income__grid_line_add);

// Computed
const hollywood = computed(() => incomesStore.hollywood);
const levelHollywoodPermitted = computed(() => {
  if(hollywood.value) return grillaStore.breadcrumb.length !== 0;
  return false;
});

</script>

<template>
  <th :style="grillaStore.getColumnStyle('actions')" class="actions">
    <div class="actions__inf">
      <div class="actions__box">
        <u-checkbox-single
          :value="grillaStore.areAllSelected"
          @change="grillaStore.toggleSelectAll()"
          :height="16"
          :disabled="grillaStore.updating || grillaStore.loading || linesStore.lines.length === 0 || grillaStore.applySearch"
        />
      </div>
      <div class="actions__box"></div>
      <div class="actions__box">
        <button @click="addItem('category')" :title="t(uiLabel + '.folder')" :disabled="!addLinePemission || grillaStore.updating || grillaStore.loading || levelHollywoodPermitted"><span class="u u-folder-add"></span></button>
      </div>
      <div class="actions__box"></div>
      <div class="actions__box">
        <button @click="addItem('line')" :title="t(uiLabel + '.line')" :disabled="!addLinePemission || grillaStore.updating || grillaStore.loading"><span class="u u-new"></span></button>
      </div>
    </div>
  </th>
</template>

<style scoped>
.actions__inf {
  height: 100%;
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  align-items: center;
  padding: 0 12px;
  gap: 4px;
}
.actions__box {
  display: flex;
  justify-content: center;
}
.actions__inf button {
  transition: 0.3s;
}
.actions__inf button span {
  color: var(--neutral-text-caption);
  font-size: 18px;
  line-height: 18px;
  transition: 0.3s;
}
.actions__inf button:disabled {
  cursor: not-allowed;
}
.actions__inf button:disabled span {
  color: var(--neutral-text-disabled);
}
</style>
