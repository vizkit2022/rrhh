<script setup>
import { ref, defineProps, computed, onMounted, defineEmits } from "vue";
import {
  getCurrentDateAndTimeZone,
  generateDescendingArray,
} from "@/utils/helpers";
import useGlobalStore from "@/stores/global";
import useOrganization from "@/stores/organization";

// Stores
const globalStore = useGlobalStore();
const organizationStore = useOrganization();

// Props
const props = defineProps({
  date: {
    type: Object,
    default: () => ({}),
  },
  size: {
    type: String,
    default: "s",
  },
  showFilters: {
    type: Boolean,
    default: false,
  },
});

// Emit
const emit = defineEmits(["updatedDate"]);

// Constants
const module = "global.datepicker";
const months = ref([
  { month: 0, prop: "january", selected: false },
  { month: 1, prop: "february", selected: false },
  { month: 2, prop: "march", selected: false },
  { month: 3, prop: "april", selected: false },
  { month: 4, prop: "may", selected: false },
  { month: 5, prop: "june", selected: false },
  { month: 6, prop: "july", selected: false },
  { month: 7, prop: "august", selected: false },
  { month: 8, prop: "september", selected: false },
  { month: 9, prop: "october", selected: false },
  { month: 10, prop: "november", selected: false },
  { month: 11, prop: "december", selected: false },
]);
const border = ref({});
const currentDate = ref(props.date || getCurrentDateAndTimeZone());
const showDatePicker = ref(false);
const showMonths = ref(true);
const allMonths = ref(false);
const { t } = useI18n();
const color = "--neutral-text-caption";
const years = ref([]);
const tempYear = ref(null);
const zone = computed(() => {
  return (
    organizationStore?.organization?.country?.timezone ||
    Intl.DateTimeFormat().resolvedOptions().timeZone
  );
});

// filtros
const currentFilter = ref(null);

const filterOptions = computed(() => [
  { value: "noFilter", label: t(`${module}.filters.noFilter.name`) },
  { value: "7days", label: t(`${module}.filters.7days.name`) },
  { value: "15days", label: t(`${module}.filters.15days.name`) },
  { value: "30days", label: t(`${module}.filters.30days.name`) },
  { value: "3months", label: t(`${module}.filters.3months.name`) },
  { value: "4months", label: t(`${module}.filters.4months.name`) },
  { value: "6months", label: t(`${module}.filters.6months.name`) },
  { value: "all", label: t(`${module}.filters.all.name`) },
]);

// INICIO: Funcion para sincronizar la fecha con el defined prop "date"
const syncFromPropsDate = (date) => {
  const base =
    date && Object.keys(date).length
      ? { ...date }
      : getCurrentDateAndTimeZone();

  // Año
  if (!base.year) {
    base.year = getCurrentDateAndTimeZone().year;
  }

  currentDate.value = base;
  currentDate.value.zone = zone.value;

  // Filtros
  if (props.showFilters) {
    currentFilter.value =
      base.rangeDate && base.rangeDate !== "noFilter" ? base.rangeDate : null;
  } else {
    currentFilter.value = null;
  }

  years.value = generateDescendingArray(base.year);
  tempYear.value = base.year;

  // Meses
  months.value.forEach((m) => (m.selected = false));

  if (base.month === null && base.prop === null) {
    allMonths.value = true;
  } else {
    const m = base.month ?? getCurrentDateAndTimeZone().month;
    months.value[m].selected = true;
    currentDate.value.month = m;
    currentDate.value.prop = months.value[m].prop;
    allMonths.value = false;
  }
};

// onMounted
onMounted(() => {
  document.addEventListener("click", handleClickOutside);
  // Sincronizar la fecha
  syncFromPropsDate(props.date);
});

onBeforeUnmount(() => {
  document.removeEventListener("click", handleClickOutside);
});

// Watch -> escuchar que se ingreso por props y sincronizar la fecha
watch(
  () => props.date,
  (newDate) => {
    syncFromPropsDate(newDate);
  },
  { deep: true },
);

// Método para detectar clic fuera del calendario
const handleClickOutside = (event) => {
  const dropdown = document.querySelector(".datepicker");
  if (dropdown && !dropdown.contains(event.target)) {
    showDatePicker.value = false;
  }
};

// Functions
const changeFilter = (next) => {
  const index = currentFilterIndex.value;
  if (index === -1) return;

  let newIndex = next ? index + 1 : index - 1;

  // ciclo infinito
  if (newIndex < 0) newIndex = orderedFilters.value.length - 1;
  if (newIndex >= orderedFilters.value.length) newIndex = 0;

  currentFilter.value = orderedFilters.value[newIndex].value;

  emit("updatedDate", {
    ...currentDate.value,
    rangeDate: currentFilter.value,
  });
};

const changeDate = (next) => {
  //  SI HAY FILTRO → navegar filtros
  if (isFilterSelected.value) {
    changeFilter(next);
    return;
  }

  // comportamiento actual (mes/año)
  if (allMonths.value) {
    currentDate.value = {
      ...currentDate.value, // ← Preserva rangeDate y otras props
      year: next ? currentDate.value.year + 1 : currentDate.value.year - 1,
      month: null,
      prop: null,
      zone: zone.value,
    };

    emit("updatedDate", currentDate.value);
    return;
  }

  months.value.forEach((month) => (month.selected = false));

  const c_year = currentDate.value.year;

  if (next) {
    if (currentDate.value.month === 11) {
      currentDate.value = {
        ...currentDate.value,
        year: c_year + 1,
        month: 0,
        prop: "january",
      };
      months.value[0].selected = true;
    } else {
      const c_month = currentDate.value.month + 1;
      months.value[c_month].selected = true;
      currentDate.value = {
        ...currentDate.value,
        year: c_year,
        month: c_month,
        prop: months.value[c_month].prop,
        zone: zone.value,
      };
    }
  } else {
    if (currentDate.value.month === 0) {
      currentDate.value = {
        ...currentDate.value,
        year: c_year - 1,
        month: 11,
        prop: "december",
      };
      months.value[11].selected = true;
    } else {
      const c_month = currentDate.value.month - 1;
      months.value[c_month].selected = true;
      currentDate.value = {
        ...currentDate.value,
        year: c_year,
        month: c_month,
        prop: months.value[c_month].prop,
      };
    }
  }

  currentDate.value.zone = zone.value;
  emit("updatedDate", currentDate.value);
};

const selectMounth = (pos = null) => {
  if (pos !== null) {
    const s_month = months.value[pos];
    currentDate.value.month = s_month.month;
    currentDate.value.prop = s_month.prop;
  } else {
    currentDate.value.month = null;
    currentDate.value.prop = null;
  }

  months.value.forEach((month, m) => {
    if (pos !== null) month.selected = pos === m;
    else month.selected = false;
  });

  allMonths.value = pos === null;

  setTimeout(() => {
    currentDate.value.zone = zone.value;
    emit("updatedDate", currentDate.value);
  }, 300);
};

const selectYear = (year) => {
  currentDate.value.year = year;
  setTimeout(() => {
    currentDate.value.zone = zone.value;
    emit("updatedDate", currentDate.value);
  }, 300);
};

const changeDateSecond = (next) => {
  if (showMonths.value) {
    if (next) currentDate.value.year += 1;
    else currentDate.value.year -= 1;

    const year = currentDate.value.year;
    tempYear.value = year;

    if (year > years.value.at(-1)) {
      years.value = generateDescendingArray(year + 8);
    } else if (year < years.value[0]) {
      years.value = generateDescendingArray(year);
    }
  } else {
    tempYear.value = next ? tempYear.value + 9 : tempYear.value - 9;
    years.value = generateDescendingArray(tempYear.value);
  }

  currentDate.value.zone = zone.value;
  emit("updatedDate", currentDate.value);
};

const selectedFilter = (filter) => {
  if (filter.value === "noFilter") {
    currentFilter.value = null;
    emit("updatedDate", {
      ...currentDate.value,
      rangeDate: "noFilter",
    });
  } else {
    currentFilter.value = filter.value;
    emit("updatedDate", {
      ...currentDate.value,
      rangeDate: currentFilter.value,
    });
  }
};

// Computed
const mainLabelMonth = computed(() => {
  const prop = allMonths.value ? "all" : currentDate.value.prop;
  return t(`${module}.${prop}.abbr`);
});
const secondLabelMonth = computed(() => {
  const { year } = currentDate.value;
  return showMonths.value ? String(year) : mainLabelMonth.value;
});

// Compured filtros
const isFilterSelected = computed(() => {
  // Si hay un filtro seleccionado
  return currentFilter.value !== null;
});
const currentFilterLabel = computed(() => {
  // Label del filtro seleccionado
  if (!currentFilter.value) return "";
  return t(`${module}.filters.${currentFilter.value}.name`);
});
const mainLabelFilter = computed(() => {
  // Label del datepicker principal
  const prop = currentFilter.value;
  return t(`${module}.filters.${prop}.abbr`);
});

const orderedFilters = computed(() =>
  // Filtros ordenados sin noFilter
  filterOptions.value.filter((f) => f.value !== "noFilter"),
);

const currentFilterIndex = computed(() => {
  // Indice del filtro seleccionado
  if (!currentFilter.value) return -1;
  return orderedFilters.value.findIndex((f) => f.value === currentFilter.value);
});
</script>

<template>
  <div :class="[size, { datepicker: true }]">
    <div class="datepicker__header">
      <button
        class="left"
        @mouseenter="border.left = true"
        @mouseleave="border = {}"
        @click="changeDate(false)"
      >
        <span class="u u-chevron-left"></span>
      </button>
      <div class="lineLeft"></div>
      <button
        class="center"
        @mouseenter="border = { left: true, right: true }"
        @mouseleave="border = {}"
        @click="showDatePicker = !showDatePicker"
      >
        <span class="u u-calendar"></span>
        <span
          class="body-xl-sb"
          v-text="isFilterSelected ? mainLabelFilter : mainLabelMonth"
        ></span>
        <span
          class="body-xl-sb"
          v-text="!isFilterSelected ? currentDate.year : ''"
        ></span>
      </button>
      <div class="lineRight"></div>
      <button
        class="right"
        @mouseenter="border.right = true"
        @mouseleave="border = {}"
        @click="changeDate(true)"
      >
        <span class="u u-chevron-right"></span>
      </button>
    </div>
    <div class="datepicker__body">
      <div class="datepicker__body-header">
        <u-button-icon
          icon="chevron-left"
          type="outlined"
          size="s"
          :color="color"
          :disabled="(allMonths && !showMonths) || isFilterSelected"
          @click="changeDateSecond(false)"
        />
        <u-button
          :text="secondLabelMonth"
          type="text"
          size="s"
          :color="color"
          :disabled="isFilterSelected"
          @click="showMonths = !showMonths"
        />
        <u-button-icon
          icon="chevron-right"
          type="outlined"
          size="s"
          :color="color"
          :disabled="(allMonths && !showMonths) || isFilterSelected"
          @click="changeDateSecond(true)"
        />
      </div>
      <div v-if="!showFilters" class="datepicker__body-line"></div>
      <div v-else class="datepicker__body-filters">
        <u-select
          :model-value="currentFilterLabel"
          :options="filterOptions"
          size="s"
          border-radius="8px"
          :placeholder="t(`${module}.filters.placeholder`)"
          icon-dropdown="selector_down"
          size-icon-dropdown="m"
          :full-data="true"
          @full-data="selectedFilter"
        />
      </div>
      <div class="datepicker__body-months" v-if="showMonths">
        <button
          v-for="(month, m) in months"
          :key="month.prop"
          @click="selectMounth(m)"
          :class="{ selected: month.selected, disabled: isFilterSelected }"
          :disabled="isFilterSelected"
        >
          <span
            v-text="$t(`${module}.${month.prop}.name`)"
            class="body-m-r"
          ></span>
        </button>
      </div>
      <button
        class="datepicker__body-allMonths"
        v-if="showMonths"
        @click="selectMounth()"
        :class="{ selected: allMonths, disabled: isFilterSelected }"
        :disabled="isFilterSelected"
      >
        <span v-text="$t(`${module}.all.name`)"></span>
      </button>
      <div class="datepicker__body-year" v-else>
        <button
          v-for="year in years"
          :key="year"
          @click="selectYear(year)"
          :disabled="isFilterSelected"
          :class="{
            selected: year === currentDate.year,
            disabled: isFilterSelected,
          }"
        >
          <span v-text="year" class="body-m-r"></span>
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.datepicker {
  width: 200px;
  position: relative;
  display: flex;
  justify-content: center;
}
.datepicker__header {
  width: 200px;
  display: grid;
  grid-template-columns: 28px 1px 1fr 1px 28px;
}
.datepicker.xl {
  height: 48px;
}

.datepicker.l {
  height: 40px;
}
.datepicker.m {
  height: 36px;
}
.datepicker.s {
  height: 32px;
}

/* Header */
.datepicker__header button {
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 8px;
  transition: 0.3s;
}
.datepicker__header button.center {
  border-right: none;
  border-left: none;
  border-top: 1px solid var(--neutral-border-default);
  border-bottom: 1px solid var(--neutral-border-default);
}
.datepicker__header button.left {
  border-right: none;
  border-left: 1px solid var(--neutral-border-default);
  border-top: 1px solid var(--neutral-border-default);
  border-bottom: 1px solid var(--neutral-border-default);
}
.datepicker__header button.right {
  border-left: none;
  border-right: 1px solid var(--neutral-border-default);
  border-top: 1px solid var(--neutral-border-default);
  border-bottom: 1px solid var(--neutral-border-default);
}

.datepicker__header button.left.disabled,
.datepicker__header button.right.disabled {
  opacity: 0.5;
  pointer-events: none;
}

.datepicker.xl .datepicker__header button {
  height: 48px;
}
.datepicker.l .datepicker__header button {
  height: 40px;
}
.datepicker.m .datepicker__header button {
  height: 36px;
}
.datepicker.s .datepicker__header button {
  height: 32px;
}

.datepicker.xl .datepicker__header button.left {
  border-radius: 16px 0 0 16px;
}
.datepicker.l .datepicker__header button.left {
  border-radius: 14px 0 0 14px;
}
.datepicker.m .datepicker__header button.left {
  border-radius: 12px 0 0 12px;
}
.datepicker.s .datepicker__header button.left {
  border-radius: 8px 0 0 8px;
}

.datepicker.xl .datepicker__header button.right {
  border-radius: 0 16px 16px 0;
}
.datepicker.l .datepicker__header button.right {
  border-radius: 0 14px 14px 0;
}
.datepicker.m .datepicker__header button.right {
  border-radius: 0 12px 12px 0;
}
.datepicker.s .datepicker__header button.right {
  border-radius: 0 8px 8px 0;
}

/* Icono */
.datepicker__header button span.u {
  font-size: 24px;
  line-height: 24px;
}
.datepicker__header button span {
  color: var(--neutral-text-caption);
  transition: 0.3s;
}

.datepicker__header button:hover {
  background-color: var(--primary-surface-softer);
}
.datepicker__header button:hover span {
  color: var(--primary-text-default);
}
.datepicker__header button.center:hover {
  border-left: none;
  border-right: none;
  border-top: 1px solid var(--primary-border-default);
  border-bottom: 1px solid var(--primary-border-default);
}
.datepicker__header button.left:hover {
  border-right: none;
  border-top: 1px solid var(--primary-border-default);
  border-bottom: 1px solid var(--primary-border-default);
  border-left: 1px solid var(--primary-border-default);
}
.datepicker__header button.right:hover {
  border-left: none;
  border-top: 1px solid var(--primary-border-default);
  border-bottom: 1px solid var(--primary-border-default);
  border-right: 1px solid var(--primary-border-default);
}

.lineRight,
.lineLeft {
  height: 100%;
}
.lineLeft {
  background-color: v-bind(
    "border.left ? 'var(--primary-border-default)' : 'var(--neutral-border-default)'"
  );
}
.lineRight {
  background-color: v-bind(
    "border.right ? 'var(--primary-border-default)' : 'var(--neutral-border-default)'"
  );
}

/* Body */
.datepicker__body {
  position: absolute;
  background: var(--neutral-background-default);
  top: calc(100% + 10px);
  z-index: 10;
  width: 280px;
  box-shadow: var(--elevation-l);
  border-radius: 12px;
  padding: 16px;
  box-sizing: border-box;
  height: auto;
  display: flex;
  flex-direction: column;
  gap: 10px;
  transform: scale(v-bind("showDatePicker ? 1 : 0"));
  transition: 0.3s;
  transform-origin: top center;
}
.datepicker__body-header {
  height: 32px;
  display: grid;
  grid-template-columns: 32px 1fr 32px;
  gap: 10px;
}
.datepicker__body-line {
  height: 2px;
  background-color: var(--neutral-border-light);
  border-radius: 2px;
}
.datepicker__body-filters {
  display: flex;
  width: 90%;
  height: 32px;
  align-self: center;
  justify-content: center;
}
.datepicker__body-months,
.datepicker__body-year {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 2px;
}
.datepicker__body-months button,
.datepicker__body-allMonths,
.datepicker__body-year button {
  height: 32px;
  background-color: var(--neutral-background-default);
  transition: 0.3s ease-out;
  border-radius: 10px;
}
.datepicker__body-months button span,
.datepicker__body-allMonths span,
.datepicker__body-year button span {
  color: var(--neutral-text-body);
  transition: 0.3s ease-out;
}
.datepicker__body-months button:hover span,
.datepicker__body-months button.selected span,
.datepicker__body-allMonths:hover span,
.datepicker__body-allMonths.selected span,
.datepicker__body-year button:hover span,
.datepicker__body-year button.selected span {
  color: var(--white);
}
.datepicker__body-months button:not(.selected):hover,
.datepicker__body-allMonths:not(.selected):hover,
.datepicker__body-year button:not(.selected):hover {
  background-color: var(--primary-surface-default);
}
.datepicker__body-months button.selected,
.datepicker__body-allMonths.selected,
.datepicker__body-year button.selected {
  background-color: var(--primary-surface-subtle);
}

.datepicker__body-months button.disabled,
.datepicker__body-allMonths.disabled,
.datepicker__body-year button.disabled {
  opacity: 0.5;
  pointer-events: none;
}
</style>
