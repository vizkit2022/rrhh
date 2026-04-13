<script setup>
import { defineProps, computed } from "vue";
import useGrillaStore from "@/stores/grilla";
import useLinesStore from "@/stores/lines";
import usePermissionsStore from "@/stores/permissions";

// Store
const grillaStore = useGrillaStore();
const linesStore = useLinesStore();
const permissionsStore = usePermissionsStore();

// Props
const props = defineProps({
  config: {
    type: Object,
    default: () => ({}),
  },
  line: {
    type: Object,
    default: () => ({}),
  },
  id: {
    type: String,
    default: ""
  }
});

// Constant (memoizados eficientemente)
const index = computed(() => linesStore.lines.findIndex(l => l.__id === props.line.data.__id));

const showMenuCell = () => {
  const id = props.id;
  const obj = { 
    id, 
    type: props?.config?.column?.prop || '', 
    header: props?.config?.subcolumn || {}, 
    line: props?.line || {}, 
    posLine: index.value || 0 
  };
  document.querySelectorAll("input.focusInput").forEach(input => {
    input.classList.remove("focusInput");
  });
  setTimeout(() => {
    const input = document.getElementById(id);
    if (input) input.classList.add("focusInput");
    grillaStore.showMenuCell(obj);
  }, 10);
};

// Computed
const unit = computed(() => {
  const prop = props?.config?.subcolumn?.prop;
  return props?.line?.data?.[prop] ?? null;
});
const qty = computed(() => {
  const type = props?.config?.column?.prop;
  const prop = type === 'incomes' ? 'amount1' : 'budgetAmount1';
  const number = props?.line?.data?.numbers?.[prop]?.number || 0;
  return number === 1 ? 'name' : 'plural';
});
const unitName = computed(() => {
  if(unit) return unit.value?.[qty.value] || '-'
  return ""
});
const isDeleting = computed(() => props?.line?.data?.__deleting || false);
const existsInBackend = computed(() => props?.line?.data?._id);
const disabled = computed(() => !existsInBackend.value || isDeleting.value || grillaStore.updating);
const editCellPemission = computed(() => {
  if(props.config?.column?.prop === 'incomes') return permissionsStore?.myPermissions?.income_grid_col_incomes_edit;
  return permissionsStore?.myPermissions?.income_grid_col_budget_edit;
});

</script>

<template>
  <button class="unit" @click="showMenuCell" :id="props.id" :disabled="!editCellPemission || disabled">
    <span v-if="unit" class="truncateText">{{ unitName }}</span>
  </button>
</template>

<style scoped>
.unit {
  width: 100%;
  height: 100%;
  display: grid;
  place-content: center;
  padding: 0 10px;
}
.unit:disabled {
  cursor: not-allowed;
}
span {
  width: 100%;
  height: 100%;
  font-size: 10px;
  line-height: 10px;
  font-weight: 600;
  padding: 4px 10px;
  border-radius: 16px;
  background-color: v-bind("unit?.colorLabel");
  color: var(--neutral-text-body);
}
.unit:disabled span {
  background-color: var(--neutral-background-darker);
  color: var(--neutral-text-disabled);
}
</style>