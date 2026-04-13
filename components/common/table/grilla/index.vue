<script setup>
import { ref, computed, defineProps, onMounted, onUnmounted } from "vue";
import { useVirtualList } from "@vueuse/core";
import useGrillaStore from "@/stores/grilla";
import useLinesStore from "@/stores/lines";
import useIncomeStore from "@/stores/incomes";

// Store
const grillaStore = useGrillaStore();
const linesStore = useLinesStore();
const incomesStore = useIncomeStore();

// Props
const props = defineProps({
  fullScreen: {
    type: Boolean,
    default: false,
  },
});

// ******* Virtual List *******
const computedLines = computed(() => {
  const lines = linesStore.lines.filter((l) => l.isVisible);
  grillaStore.totalLines = lines.length;
  return lines;
});

// Tamaños de fila
const sizesRow = {
  small: 32,
  medium: 40,
  large: 48,
  extraLarge: 52,
};

const sizeRow = computed(
  () => sizesRow?.[grillaStore?.config?.sizeRow || "small"] || 32
);

const { list, containerProps, wrapperProps } = useVirtualList(computedLines, {
  itemHeight: () => sizeRow.value,
});

// Constants
const containerWidth = ref(0);
// Computed
const visibleColumnsCount = computed(() => {
  let count = 4; // Siempre columnas 1 y 2
  count += grillaStore.collapsed.incomes ? 1 : 4; // Grupo 1: columnas 3,4,5,6
  count += grillaStore.collapsed.budget ? 1 : 4; // Grupo 2: columnas 7,8,9,10
  count += grillaStore.collapsed.outcomes ? 1 : 4; // Grupo 3: columnas 11,12,13,14
  count += grillaStore.collapsed.projected ? 1 : 4; // Grupo 4: columnas 15,16,17,18
  return count;
});
const availableWidth = computed(() => Math.max(containerWidth.value - 665, 0));
const dynamicColumnWidth = computed(() => {
  let remainingColumns = visibleColumnsCount.value - 4;
  if (remainingColumns === 0) return 200;
  let calculatedWidth = availableWidth.value / remainingColumns;
  const result = Math.max(calculatedWidth, 200);
  grillaStore.dynamicColumnWidth = result;
  return result;
});
const heightTable = computed(() => {
  if (props.fullScreen)
    return incomesStore.hollywood
      ? "calc(100vh - 32px - 40px - 10px - 52px)"
      : "calc(100vh - 32px - 40px - 10px - 18px)";
  return incomesStore.hollywood
    ? "calc(100vh - 16px - 48px - 68px - 52px - 32px - 42px - 10px - 32px)"
    : "calc(100vh - 16px - 48px - 68px - 52px - 32px - 42px - 10px)";
});

// Mounted
onMounted(() => {
  updateWidth();
  window.addEventListener("resize", updateWidth);
  document.addEventListener("keydown", handleEscapeKey);
  document.addEventListener("wheel", handleCtrlScroll, { passive: false});
});

onUnmounted(() => {
  window.removeEventListener("resize", updateWidth);
  document.removeEventListener("keydown", handleEscapeKey);
  document.removeEventListener("wheel", handleCtrlScroll);  
});

onBeforeMount(() => {
  grillaStore.logGridSettingsIfExists();
  grillaStore.paintTable();
  grillaStore.refresh = false;
});

const clearEvents = () => {
  grillaStore.posDropdown = null;
};
const handleEscapeKey = (event) => {
  if (event.key === "Escape" || event.key === "Esc") {
    grillaStore.goToDropdown = false;
    grillaStore.posDropdown = null;
    
    const posUnnamedLined = linesStore.lines.findIndex(l => l.name === "");
    const unnamedLine = linesStore.lines[posUnnamedLined];
    if(unnamedLine) {
      // Si la linea ya existe
      if(unnamedLine._id) {
        const id = `input-${posUnnamedLined}-name`;
        const input = document.getElementById(id);
        if (input) input.focus();
        return;
      }
      // Si la linea es nueva
      grillaStore.refreshHTML++;
      linesStore.lines.splice(posUnnamedLined, 1);
      return;
    }
  }
};
const handleCtrlScroll = (event) => {
  if (event.ctrlKey) {
    event.preventDefault();
    const wrapper = document.querySelector(".table-wrapper")
    if (wrapper) {
      wrapper.scrollBy({
        left: event.deltaY,
        behavior: "smooth"
      })
    }
  }
}

// Functions
const updateWidth = () => {
  let wrapper = document.querySelector(".table-wrapper");
  if (wrapper) {
    containerWidth.value = wrapper.clientWidth;
  }
};
</script>

<template>
  <TableGrillaCustomBreadcrumb v-if="incomesStore.hollywood" />
  <div class="grilla" id="grid">
    <div class="table-wrapper" v-bind="containerProps" @scroll="clearEvents">
      <table class="table">
        <TableGrillaHeader />
      </table>
      <TableGrillaLoading v-if="grillaStore.loading" />
      <template v-else>
        <div v-bind="wrapperProps" class="containerTable" v-if="list.length">
          <TableGrillaBody :list="list" />
        </div>
        <TableGrillaOptions v-else />
      </template>
    </div>
  </div>
</template>

<style scoped>
.grilla {
  max-width: 100%;
  background: var(--neutral-background-default);
  border-radius: 12px;
  overflow: hidden;
  border: 2px solid var(--neutral-border-subtle);
}

.table-wrapper {
  position: relative;
  height: v-bind("heightTable");
  overflow: v-bind(
    "grillaStore.updating || grillaStore.loading ? 'hidden' : 'auto'"
  );
  border-radius: 12px;
}

.table-wrapper::-webkit-scrollbar {
  width: 16px;
  height: 16px;
}

.table-wrapper::-webkit-scrollbar-thumb {
  background-color: var(--neutral-border-default);
  border-radius: 10px;
}

.table-wrapper::-webkit-scrollbar-track,
.table-wrapper::-webkit-scrollbar-corner {
  background-color: var(--neutral-border-subtle);
}

.table {
  position: sticky;
  top: 0;
  z-index: 12;
}

.containerTable {
  position: absolute;
  z-index: 0;
}

.table,
.containerTable {
  width: max-content;
  min-width: 100%;
  border-collapse: separate;
  border-spacing: 0;
}
</style>

<style>
.grilla * {
  box-sizing: border-box;
}

.grilla table tbody tr td {
  padding: 0;
  margin: 0;
  height: v-bind("sizeRow + 'px'");
}

.grilla table tbody tr.row.category.level-1,
.grilla table tbody tr.row.category.level-1 td .name button.folder {
  background-color: var(--grilla-category-1);
  transition: background 0.3s !important;
}

.grilla table tbody tr.row.category.level-2,
.grilla table tbody tr.row.category.level-2 td .name button.folder {
  background-color: var(--grilla-category-2);
  transition: background 0.3s !important;
}

.grilla table tbody tr.row.category.level-3,
.grilla table tbody tr.row.category.level-3 td .name button.folder {
  background-color: var(--grilla-category-3);
  transition: background 0.3s !important;
}

.grilla table tbody tr.row.line.level-1,
.grilla table tbody tr.row.line.level-2,
.grilla table tbody tr.row.line.level-3,
.grilla table tbody tr.row.line.level-4 {
  background-color: var(--grilla-line);
}
</style>
