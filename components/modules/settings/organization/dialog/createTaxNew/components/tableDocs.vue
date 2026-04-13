<script setup>
const props = defineProps({
  columns: {
    type: Array,
    required: true,
  },
  rows: {
    type: Array,
    required: true,
  },
  loading: {
    type: Boolean,
    default: false,
  },
  maxHeight: {
    type: String,
    default: "",
  },
});

const emit = defineEmits(["toggle"]);

const gridTemplateColumns = computed(() =>
  props.columns.map((col) => col.width || "1fr").join(" "),
);
</script>

<template>
  <div class="grid-table">
    <!-- Header -->
    <div class="grid-header" :style="{ gridTemplateColumns }">
      <div
        v-for="col in columns"
        :key="col.key"
        class="grid-cell header"
        :class="{ 'is-checkbox': col.type === 'checkbox' }"
      >
        {{ col.label }}
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="loading">
      <u-loading />
    </div>

    <!-- No Data -->
    <div v-else-if="rows.length === 0" class="notData">
      <u-tax :width="80" />
      <span class="body-m-r"> {{ $t("global.text.noResults") }}</span>
    </div>

    <!-- Rows -->
    <div class="grid-body" :style="{ maxHeight }" v-else>
      <div
        v-for="row in rows"
        :key="row.id"
        class="grid-row"
        :style="{ gridTemplateColumns }"
      >
        <div v-for="col in columns" :key="col.key" class="grid-cell">
          <!-- Checkbox -->
          <template v-if="col.type === 'checkbox'">
            <div class="grid-cell-checkbox">
              <u-checkbox
                v-model="row[col.key]"
                @update:model-value="
                  (val) =>
                    emit('toggle', {
                      row: row,
                      key: col.key,
                      value: val,
                    })
                "
              />
            </div>
          </template>

          <!-- Tag Cell -->
          <template v-else-if="col.type === 'tag'">
            <u-tags
              :text="row[col.key]"
              size="xs"
              :delete="false"
              color="--neutral-text-caption"
              background="--neutral-surface-softer"
              max-width="45px"
              :title="row[col.key]"
            />
          </template>

          <!-- Default cell -->
          <template v-else>
            <slot :name="`cell-${col.key}`" :row="row">
              <span class="truncateText body-m-sb"> {{ row[col.key] }}</span>
            </slot>
          </template>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.grid-table {
  border: 1px solid var(--neutral-border-subtle);
  border-radius: 8px;
  overflow: hidden;
  background-color: var(--neutral-background-default);
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
}

/* Header  */
.grid-header {
  display: grid;
  align-items: center;
  height: 32px;
  background-color: var(--neutral-surface-softer);
  flex-shrink: 0;
}

/* Contenedor de filas*/
.grid-body {
  overflow-y: auto;
  overflow-x: hidden;
  flex: 1;
  min-height: 0;
}

.grid-body::-webkit-scrollbar {
  width: 4px;
  background: var(--neutral-surface-softer);
  border-radius: 20px;
}

.grid-body::-webkit-scrollbar-thumb {
  background: var(--neutral-surface-subtle);
  border-radius: 5px;
}

.grid-row {
  display: grid;
  align-items: center;
  height: 32px;
  border-top: 1px solid var(--neutral-border-subtle);
}

.grid-cell {
  padding: 0 16px;
  color: var(--neutral-text-body);
  display: flex;
  min-width: 0;
}

.grid-cell.header {
  font-size: 13px;
  font-weight: 500;
}

.grid-cell.is-checkbox {
  justify-content: center;
  padding: 0;
}

.grid-cell-checkbox {
  margin: 0 auto;
}

.loading {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 128px;
}

.notData {
  height: 128px;
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;
  gap: 10px;
}

.notData span {
  color: var(--neutral-text-caption);
  text-align: center;
}
</style>
