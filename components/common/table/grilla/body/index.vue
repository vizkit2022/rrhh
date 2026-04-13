<script setup>
import { defineProps, computed } from "vue";
import useGrillaStore from "@/stores/grilla";
import useLinesStore from "@/stores/lines";
import { cellComponents } from "@/utils/componentsMap";

// Stores
const grillaStore = useGrillaStore();
const linesStore = useLinesStore();

// Props
const props = defineProps({
  list: {
    type: Array,
    default: () => [],
  },
});

// Computed
const columnsWithInputIndex = computed(() => grillaStore.columnsWithInputIndex);
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
</script>

<template>
  <table class="tableBody">
    <tbody>
      <tr
        v-for="line in props.list"
        :key="line?.data?.__id || line?.data?._id || line.index"
        :class="`row ${line?.data?.isParent ? 'category' : 'line'} level-${(line?.data?.parents?.length || 0) + 1}`"
      >
        <!-- Actions -->
        <table-grilla-body-actions
          :line="line"
          :config="{
            type: line?.data?.isParent ? 'category' : 'line',
            level: (line?.data?.parents?.length || 0) + 1,
          }"
        />

        <!-- Fixed columns -->
        <table-grilla-body-lines-id :line="line" v-if="grillaStore.config.showIdName" />
        <table-grilla-body-lines-code
          v-if="grillaStore.config.showCodeName"
          :index="line.index"
          :line="line"
          :id="`input-${line.index}-code`"
        />
        <table-grilla-body-lines-name
          :index="line.index"
          :line="line"
          :id="`input-${line.index}-name`"
          :config="{
            type: line?.data?.isParent ? 'category' : 'line',
            level: (line?.data?.parents?.length || 0) + 1,
          }"
        />

        <!-- Dynamic groups -->
        <template v-for="column in columnsWithInputIndex" :key="column.prop">
          <template v-for="(subcolumn, s) in column.subcolumns" :key="subcolumn.prop">
            <td
              v-if="subcolumn.default || !grillaStore?.collapsed?.[column?.prop || 'incomes']"
              :style="grillaStore.getColumnStyle(((subcolumn.default && grillaStore?.collapsed?.[column?.prop]) || column.subcolumns.length === 1) ? undefined : subcolumn.typeCell)"
              :class="`group ${s === (column.subcolumns.length - 1) ? 'end' : 'between'}`"
            >
              <component
                v-if="(line.data.isParent && subcolumn.type === 'amount') || !line.data.isParent"

                :is="['realCost','percentage'].includes(subcolumn.typeCell) ? cellComponents[subcolumn.typeCell] : (cellComponents[subcolumn.type] || 'span')"
                class="cell"
                :config="{ column, subcolumn }"
                :id="subcolumn.__inputIndex !== null  ? `${subcolumn.type === 'unit' ? 'button' : 'input'}-${line.index}-${subcolumn.__inputIndex}` : null"
                :line="line"
              />
            </td>
          </template>
        </template>
      </tr>
    </tbody>
  </table>
</template>


<style scoped>
.tableBody {
  width: max-content;
  min-width: 100%;
  border-collapse: separate;
  border-spacing: 0;
}

.tableBody {
  padding-bottom: 200px;
}

.body-fixed-column {
  position: sticky;
  left: v-bind("stickyPositions.id");
  z-index: 3;
  background: var(--neutral-background-default);
}

.body-fixed-column-2 {
  position: sticky;
  left: v-bind("stickyPositions.code");
  z-index: 3;
  background: var(--neutral-background-default);
}

.body-fixed-column-3 {
  position: sticky;
  left: v-bind("stickyPositions.name");
  z-index: 3;
  background: var(--neutral-background-default);
}

.row {
  transition: background-color 0.2s ease;
}

.row td {
  border-bottom: 1px solid var(--neutral-border-subtle) !important;
}

.row td:not(:last-child).group.end {
  border-right: 2px solid var(--neutral-border-subtle);
}

.row td.group.between {
  border-right: 1px solid var(--neutral-border-subtle);
}

.row.category td .cell.amount span.amountText {
  font-weight: 800 !important;
}


/* Level 1 */
.row.level-1.line .body-fixed-column,
.row.level-1.line .body-fixed-column-2,
.row.level-1.line .body-fixed-column-3 {
  background-color: var(--neutral-background-default);
}
.row.level-1.category .body-fixed-column,
.row.level-1.category .body-fixed-column-2,
.row.level-1.category .body-fixed-column-3 {
  background-color: var(--grilla-category-1);
}

/* Level 2 */
.row.level-2.line .body-fixed-column,
.row.level-2.line .body-fixed-column-2,
.row.level-2.line .body-fixed-column-3 {
  background-color: var(--neutral-background-default);
}
.row.level-2.category .body-fixed-column,
.row.level-2.category .body-fixed-column-2,
.row.level-2.category .body-fixed-column-3 {
  background-color: var(--grilla-category-2);
}
/* Level 3 */
.row.level-3.line .body-fixed-column,
.row.level-3.line .body-fixed-column-2,
.row.level-3.line .body-fixed-column-3 {
  background-color: var(--neutral-background-default);
}
.row.level-3.category .body-fixed-column,
.row.level-3.category .body-fixed-column-2,
.row.level-3.category .body-fixed-column-3 {
  background-color: var(--grilla-category-3);
}


.row.level-4 .body-fixed-column,
.row.level-4 .body-fixed-column-2,
.row.level-4 .body-fixed-column-3 {
  background-color: var(--neutral-background-default);
}

.collapsing-column {
  animation: collapseColumn 0.4s ease-in forwards;
}

td.noSelectedCell {
  background-color: var(--neutral-surface-light);
}
td.selectedCell {
  background-color: var(--neutral-background-default);
}

@keyframes collapseColumn {
  from {
    transform: scaleX(1);
    opacity: 1;
  }

  to {
    transform: scaleX(0);
    opacity: 0;
  }
}

.icon {
  width: 16px;
  height: 16px;
  fill: currentColor;
}
</style>

<style>
.row.category td .cell.amount span.amountText {
  font-weight: 800 !important;
}
</style>