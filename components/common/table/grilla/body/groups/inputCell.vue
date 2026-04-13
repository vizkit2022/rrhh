<script setup>
import { computed } from "vue";
import useGrillaStore from "@/stores/grilla";
import usePermissionsStore from "@/stores/permissions";

// Stores
const grillaStore = useGrillaStore();
const permissionsStore = usePermissionsStore();

// Props
const props = defineProps({
  config: Object,
  line: Object,
  id: String,
});

// Computed optimizados con memoización
const type = computed(() => props.config?.column?.prop);
const col = computed(() => props.config?.subcolumn?.prop);
const isDeleting = computed(() => props.line?.data?.__deleting || false);
const existsInBackend = computed(() => !!props.line?.data?._id);
const disabled = computed(() => !existsInBackend.value || isDeleting.value || grillaStore.updating);

const editCellPemission = computed(() => {
  return type.value === "incomes"
    ? permissionsStore.myPermissions?.income_grid_col_incomes_edit
    : permissionsStore.myPermissions?.income_grid_col_budget_edit;
});

</script>

<template>
  <input
    :id="props.id"
    :class="`inputCell ${type}`"
    type="text"
    autocomplete="off"
    :disabled="!editCellPemission || disabled"
  />
</template>

<style scoped>
.inputCell {
  text-align: right;
  padding: v-bind("['price','budget'].includes(col) ? '0 10px 0 48px' : '0 10px'");
  width: 100%;
  height: 100%;
  color: var(--neutral-text-body);
  font-size: 12px;
  line-height: 12px;
  font-weight: 600;
}

.inputCell:disabled {
  cursor: not-allowed;
  color: var(--neutral-text-disabled);
}

/* Colores */
input:not(:disabled):not(:read-only).inputCell.incomes.selected,
input:not(:disabled):not(:read-only).inputCell.incomes:focus,
input:not(:disabled):not(:read-only).inputCell.incomes:active {
  box-shadow: inset 0px 0px 0px 2px rgba(255, 161, 32, 1);
  background-color: var(--warning-surface-shadow-8a);
}

input:not(:disabled):not(:read-only).inputCell.budget.selected,
input:not(:disabled):not(:read-only).inputCell.budget:focus,
input:not(:disabled):not(:read-only).inputCell.budget:active {
  box-shadow: inset 0px 0px 0px 2px rgba(32, 161, 255, 1);
  background-color: var(--info-surface-shadow-8a);
}

input:not(:disabled):not(:read-only).inputCell.outcomes.selected,
input:not(:disabled):not(:read-only).inputCell.outcomes:focus,
input:not(:disabled):not(:read-only).inputCell.outcomes:active {
  box-shadow: inset 0px 0px 0px 2px rgba(244, 121, 117, 1);
  background-color: var(--danger-surface-shadow-8a);
}

input:not(:disabled):not(:read-only).inputCell.projected.selected,
input:not(:disabled):not(:read-only).inputCell.projected:focus,
input:not(:disabled):not(:read-only).inputCell.projected:active {
  box-shadow: inset 0px 0px 0px 2px rgba(78, 194, 117, 1);
  background-color: var(--success-surface-shadow-8a);
}

input.inputCell.incomes::selection {
  background-color: var(--warning-text-subtle);
  color: var(--neutral-background-default);
}
input.inputCell.budget::selection {
  background-color: var(--info-text-subtle);
  color: var(--neutral-background-default);
}
input.inputCell.outcomes::selection {
  background-color: var(--danger-text-subtle);
  color: var(--neutral-background-default);
}
input.inputCell.projected::selection {
  background-color: var(--success-text-subtle);
  color: var(--neutral-background-default);
}
</style>
