<script setup>
import { defineProps, computed } from "vue";
import useGrillaStore from "@/stores/grilla";
import useLinesStore from "@/stores/lines";
import usePermissionsStore from "@/stores/permissions";
import { onlyNumbersAndLetters, debounce } from "@/utils/helpers";

// Stores
const grillaStore = useGrillaStore();
const linesStore = useLinesStore();
const permissionsStore = usePermissionsStore();

// Props
const props = defineProps({
  index: Number,
  id: String,
  line: Object,
});

// Constant (memoizados eficientemente)
const index = computed(() => linesStore.lines.findIndex(l => l.__id === props.line.data.__id));

// ⚙️ Precalcular valores que no cambian por celda
const canEdit = !!permissionsStore?.myPermissions?.income__grid_line_modify_name;

// Computed ligeros
const lineData = computed(() => linesStore?.lines?.[index.value]);
const disabled = computed(() => {
  const data = props.line?.data || {};
  if (grillaStore.selectedCellsState !== null) return false;
  return !data._id || data.__deleting || grillaStore.updating;
});

// 🕒 Debounced update (para evitar llamadas seguidas)
const debouncedUpdate = debounce(async () => {
  const line = lineData.value;
  if (!line) return;
  grillaStore.startCloudSync();
  await linesStore.upsertLine(line);
}, 250);

// ✅ Handlers
function handleInput(e) {
  const val = onlyNumbersAndLetters(e.target.value);
  linesStore.lines[index.value].code = val;
}

function handleChange() {
  debouncedUpdate();
}
</script>

<template>
  <td
    :style="grillaStore.getColumnStyle('code')"
    :class="{ 'body-fixed-column-2': grillaStore.fixed }"
  >
    <div class="code">
      <input
        type="text"
        :id="props.id"
        :value="lineData?.code || '-'"
        :disabled="!canEdit || disabled"
        @focus="$event.target.select()"
        @input="handleInput"
        @change="handleChange"
        @keydown="grillaStore.navigateGridInputs({ e: $event, id: props.id, type: 'code' })"
      />
    </div>
  </td>
</template>

<style scoped>
td {
  border-right: 1px solid var(--neutral-border-subtle);
}
.code {
  width: 100%;
  height: 100%;
  display: flex;
}
.code input {
  padding: 0 12px;
  width: 100%;
  height: 100%;
  transition: 0.3s;
  background-color: transparent;
  color: var(--neutral-text-body);
  font-size: 12px;
  line-height: 12px;
  font-weight: 600;
  text-align: center;
}
.code input:not(:disabled):active,
.code input:not(:disabled):focus {
  background-color: var(--neutral-background-default);
  box-shadow: inset 0px 0px 0px 2px rgba(58, 199, 165, 1);
  background-color: var(--primary-surface-shadow-8a);
  color: var(--neutral-text-body);
}
.code input:disabled {
  cursor: not-allowed;
  color: v-bind(
    "grillaStore.selectedCellsState !== null ? 'var(--neutral-text-body)' : 'var(--neutral-text-disabled)'"
  );
}
.code input::selection {
  background-color: var(--primary-text-subtle);
  color: var(--neutral-background-default);
}
</style>
