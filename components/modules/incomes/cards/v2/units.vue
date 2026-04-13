<script setup>
import { computed, onMounted } from "vue";
import useGlobalStore from "@/stores/global";
import useIncomesStore from "@/stores/incomes";
import useGrillaStore from "@/stores/grilla";

// Stores
const globalStore = useGlobalStore();
const incomesStore = useIncomesStore();
const grillaStore = useGrillaStore();

// Computed
const units = computed(() => {
  let units = JSON.parse(
    JSON.stringify(incomesStore?.configuration?.units?.unitsByIncomes || [])
  );
  units.unshift({
    id: 0,
    name: globalStore.lang === "es" ? "Sin Unidad" : "No Unit",
    plural: globalStore.lang === "es" ? "Sin Unidad" : "No Unit",
    colorLabel: "",
  });
  return units;
});
const isPluralProp = computed(() => {
  const prop =
    grillaStore.configDropdownCell?.type === "incomes"
      ? "amount1"
      : "budgetAmount1";
  return grillaStore.configDropdownCell?.line?.data?.numbers?.[prop].number ===
    1
    ? "name"
    : "plural";
});

// Constants
const { t } = useI18n();
const module = "modules.incomes.pages.grilla.menus.units";

// Methods
const selectUnit = (unit) => {
  const TYPE = grillaStore.configDropdownCell?.type || "incomes";
  const data = {
    // Tipo de Dropdown
    type: "unit",
    // Propiedad a actualizar
    prop: TYPE === "incomes" ? "unit" : "unitBudget",
    // Nuevos valores
    newValue: unit.id === 0 ? null : unit,
    // Posición de la línea
    posLine: grillaStore.configDropdownCell?.posLine || 0,
  };
  grillaStore.startCloudSync();
  grillaStore.saveDropdown(data);
};

// Mounted
onMounted(() => {
  document.addEventListener("keydown", handleEscapeKey);
});

onUnmounted(() => {
  document.removeEventListener("keydown", handleEscapeKey);
});

const handleEscapeKey = (event) => {
  if (event.key === "Escape" || event.key === "Esc") {
    grillaStore.dropdownCloseEvent();
  }
};
</script>

<template>
  <div class="dropdown">
    <span class="title" v-text="t(module + '.label')"></span>
    <div class="dropdown__list">
      <button
        v-for="(unit, u) in units"
        :key="u"
        class="btn"
        @click="selectUnit(unit)"
        :style="`background-color: ${
          unit.colorLabel || 'var(--neutral-surface-shadow-12a)'
        };`"
      >
        <span v-text="unit[isPluralProp]" class="truncateText"></span>
      </button>
    </div>
  </div>
</template>

<style scoped>
.dropdown {
  width: 100%;
  height: 100%;
  display: grid;
  gap: 10px;
  grid-template-rows: auto 1fr;
}
.dropdown span.title {
  font-weight: 700;
  font-size: 10px;
  line-height: 14px;
  letter-spacing: 10%;
  vertical-align: middle;
  text-transform: uppercase;
  color: var(--neutral-text-caption);
}
.dropdown__list {
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 5px;
  width: 96px;
}
.dropdown__list::-webkit-scrollbar {
  width: 8px;
}
.dropdown__list::-webkit-scrollbar-thumb {
  background-color: var(--neutral-border-subtle);
  border-radius: 5px;
}
.dropdown__list button.btn {
  display: grid;
  align-items: center;
  width: 96px;
  padding: 0px;
  border-radius: 16px;
  transition: 0.3s;
}
.dropdown__list button.btn span {
  width: 96px;
  font-weight: 600;
  font-size: 12px;
  line-height: 12px;
  letter-spacing: 0%;
  vertical-align: middle;
  color: var(--neutral-text-body);
  text-align: center;
  padding: 4px;
}
</style>
