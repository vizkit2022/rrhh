<script setup>
import { computed } from "vue";
import useGlobalStore from "@/stores/global";

// Stores
const globalStore = useGlobalStore();

// Constants
const colorDelete = "--neutral-text-caption";
const colorDeleteActive = "--danger-text-darker";

// Functions
const activeCustomFilter = (pos) => {
  globalStore.filtersCustoms.forEach((filter, f) => {
    if (pos === f) filter.active = !filter.active;
    else filter.active = false;
  });
  const active = globalStore.filtersCustoms[pos].active;
  if (active) {
    const filters = globalStore.filtersCustoms[pos].filters;
    globalStore.filters = JSON.parse(JSON.stringify(filters));
  } else globalStore.cleanFilters();
};

const deleteCustomFilter = async (pos, filter) => {
  try {
    globalStore.savingFilter = true;
    // await deleteFilters(filter);
    if (filter.active) {
      globalStore.filters = globalStore.filters.map((filter) => {
        return {
          ...filter,
          options: filter.options.map((option) => {
            return {
              ...option,
              custom: false,
              active: option.custom != option.active,
            };
          }),
        };
        // aplicar el filtro con el back
      });
    }
    globalStore.filtersCustoms.splice(pos, 1);
    globalStore.savingFilter = false;
  } catch (error) {
    console.log(error);
  }
};
</script>

<template>
  <div class="list-filter">
    <div
      v-for="(filter, f) in globalStore.filtersCustoms"
      :key="filter.value"
      :class="{ 'list-filter__button': true, selected: filter.active }"
    >
      <button
        class="onlyText"
        @click="activeCustomFilter(f)"
        :disabled="globalStore.savingFilter"
      >
        <span class="body-m-sb truncateText" v-text="filter.name"></span>
      </button>
      <u-button-icon
        icon="delete"
        size="s"
        type="text"
        :color="colorDelete"
        :colorHover="colorDeleteActive"
        :colorActive="colorDeleteActive"
        :disabled="globalStore.savingFilter"
        @click="deleteCustomFilter(f, filter)"
      />
    </div>
  </div>
</template>

<style scoped>
.list-filter {
  display: flex;
  flex-direction: column;
  background-color: var(--secondary-surface-shadow-8a);
  border-radius: 14px;
  overflow: hidden;
  padding: 4px;
  gap: 4px;
}
.list-filter__button {
  height: 42px;
  flex-shrink: 1;
  display: grid;
  grid-template-columns: 278px 25px;
  gap: 10px;
  align-items: center;
  border: none;
  background: none;
  cursor: pointer;
  transition: 0.3s ease-in;
  border-radius: 10px;
}
.list-filter__button button.onlyText:disabled {
  cursor: not-allowed;
  opacity: 0.3;
}
.list-filter__button button.onlyText {
  display: flex;
  width: 280px;
  height: 100%;
  align-items: center;
  padding-left: 12px;
}
.list-filter__button button.onlyText span:nth-child(1) {
  color: var(--neutral-text-body);
  transition: 0.3s ease-in;
}
.list-filter__button span:nth-child(2) {
  color: var(--neutral-text-caption);
}
.list-filter__button.selected,
.list-filter__button:hover {
  background-color: var(--secondary-surface-shadow-12a);
}
.list-filter__button.selected button.onlyText span,
.list-filter__button:hover button.onlyText span {
  color: var(--secondary-text-subtle);
}
</style>
