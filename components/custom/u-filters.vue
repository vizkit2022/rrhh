<script setup>
import { ref, defineProps, defineEmits, watch, computed } from "vue";
import useGlobalStore from "@/stores/global";

// Components
import { FiltersList, FiltersUser, FiltersContacts } from "#components";

// Stores
const globalStore = useGlobalStore();

// Define props
const props = defineProps({
  showFilter: {
    type: Boolean,
    default: false,
  },
});

// Define variables
const showfilter = ref(false);
const show = ref(false);
const emit = defineEmits(["closeModal"]);
const isShaking = ref(false);

// Lista de reglas: cada una define una condición y una acción a ejecutar para los filtros que requieran llamar un endpoint
const filterRules = [
  {
    // REGLA DE FILTRO DE CONTACTOS POR INCOMES (PROYECTOS)
    condition: (filter) =>
      filter.type === "contacts" && filter.typeSearch === "project", // Condicion
    cacheKey: "projects", // Clave para el cache
    execute: () => globalStore.getFiltersTypeContacts({ filterType: "project" }), // Ejecuta la accion
    assignOptions: (filter, result) => result?.[filter.prop] || [], // Asigna los resultados a la propiedad correspondiente
  },
  { // Regla de filtro de incomes por business o budget
    condition: (filter) =>
      filter.type === "contacts" && filter.typeSearch === "income",
    cacheKey: "income",
    execute: (filter) => {
      const params = {
        filterType: filter.typeSearch,
        idProject: filter.idProject,
        state: filter.typeIncome
      }

      return globalStore.getFiltersTypeContacts(params)
    },
    assignOptions: (filter, result) => result?.[filter.prop] || [],
  },
  {
    // REGLA DE FILTRO DE CONTACTOS POR OUTCOME (COMPRAS)
    condition: (filter) =>
      filter.type === "contacts" && filter.typeSearch === "outcome",
    cacheKey: "outcome",
    execute: () => globalStore.getFiltersTypeContacts({ filterType: "outcome" }),
    assignOptions: (filter, result) => result || [], // Asigna los resultados sin propiedades
  },
  // añadir mas si se necesita
];

// Watch
watch(
  () => props.showFilter,
  async (newVal) => {
    if (!newVal) {
      showfilter.value = false;
      setTimeout(() => (show.value = false), 300);
      return;
    }

    show.value = true;
    setTimeout(() => (showfilter.value = true), 100);

    // Cache para resultados
    const cache = new Map();

    globalStore.filterContactsLoader = true;

    for (const filter of globalStore.filters) {
      const matchingRule = filterRules.find((rule) => rule.condition(filter));
      if (!matchingRule) continue;

      // Si ya tiene opciones seleccioandas en el filtro, no hacer nada
      if (globalStore.appliedFiltersCount > 0) {
        continue;
      }
      // old si ya tiene 
      // if (filter.options && filter.options.length > 0) {
      //   continue;
      // }

      // Obtener del cache o ejecutar
      if (!cache.has(matchingRule.cacheKey)) {
        const result = await matchingRule.execute(filter);
        cache.set(matchingRule.cacheKey, result);
      }

      const result = cache.get(matchingRule.cacheKey);
      filter.options = matchingRule.assignOptions(filter, result);
    }

    globalStore.filterContactsLoader = false;
  }
);

// Variables
const SHAKE_DURATION = 500;
const shakeTimeout = ref(null);
const views = {
  list: FiltersList,
  user: FiltersUser, // Filtros de usuarios (old version)
  contacts: FiltersContacts, // Filtros de contactos (new version)
};
const expandCustom = ref(false);

const triggerShake = () => {
  if (globalStore.savingFilter) {
    clearTimeout(shakeTimeout.value);
    isShaking.value = true;
    shakeTimeout.value = setTimeout(() => {
      isShaking.value = false;
    }, SHAKE_DURATION);
  } else {
    emit("closeModal");
  }
};

// Actions
const getComponentItem = (type) => {
  try {
    if (!views[type]) {
      console.warn(`Tipo de filtro desconocido: ${type}`);
    }
    const item = views[type] || FiltersList;
    if (!item) {
      // Si ni views[type] ni FiltersList existen, devuelve un componente "dummy" para evitar el error
      return {
        template: "<div>Componente no disponible</div>",
      };
    }
    return item;
  } catch (ex) {
    console.log(ex);
  }
};

// Computed
const isAnyActiveFilters = computed(() =>
  globalStore.filters.some((filter) =>
    filter.options.some((option) => option.active)
  )
);
</script>

<template>
  <div class="filter" v-if="show">
    <button class="filter__overlay" @click="triggerShake()"></button>
    <div class="filter__container" :class="[{ shake: isShaking }]">
      <div class="filter__header">
        <span v-text="$t('filters.title')" class="body-l-r"></span>
        <u-button-icon
          icon="close"
          color="--neutral-text-caption"
          type="outlined"
          @action-btn="emit('closeModal')"
          :disabled="globalStore.savingFilter"
        />
      </div>
      <div class="filter__body">
        <filters-applied v-if="isAnyActiveFilters" />
        <div
          class="filter__item"
          v-for="filter in globalStore.filters"
          :key="filter.prop"
          :style="`height: ${filter.expand ? 'auto' : '48px'};`"
        >
          <button
            class="filter__item-sup"
            @click="filter.expand = !filter.expand"
            :disabled="globalStore.savingFilter"
          >
            <span
              v-text="$t(`filters.${filter.prop}.label`)"
              class="body-l-sb"
            ></span>
            <span
              class="u u-chevron-down btnArrow"
              :class="{ expand: filter.expand }"
            ></span>
          </button>
          <component :is="getComponentItem(filter.type)" :filter="filter" />
        </div>
        <div
          v-if="globalStore.filtersCustoms?.length"
          class="filter__item"
          :style="`height: ${expandCustom ? 'auto' : '48px'};`"
        >
          <button
            class="filter__item-sup"
            @click="expandCustom = !expandCustom"
            :disabled="globalStore.savingFilter"
          >
            <span v-text="$t('filters.customs.label')" class="body-l-sb"></span>
            <span
              class="u u-chevron-down btnArrow"
              :class="{ expand: expandCustom }"
            ></span>
          </button>
          <filters-customs />
        </div>
        <span
          v-if="globalStore.filters.length === 0"
          v-text="$t('filters.noData')"
          class="body-m-r noFilters"
        ></span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.filter {
  position: absolute;
  height: 100vh;
  top: 0;
  left: 0;
  width: 100vw;
  z-index: 999;
  display: flex;
  align-items: center;
  overflow: hidden;
  justify-content: flex-end;
}
.filter__overlay {
  width: 100vw;
  height: 100vh;
  background-color: var(--neutral-background-shadow);
  position: absolute;
}
.filter__container {
  width: 445px;
  height: 100vh;
  position: relative;
  box-shadow: var(--elevation-l);
  background-color: var(--neutral-background-default);
  z-index: 1;
  transition: 0.3s;
  padding: 24px 36px 36px;
  box-sizing: border-box;
  transform-origin: right;
  border-radius: 20px 0 0 20px;
  transform: translateX(v-bind("showfilter ? ('100% - 445px') : '100%'"));
  display: flex;
  flex-direction: column;
  gap: 24px;
}
.filter__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 40px;
}
.filter__body {
  flex-grow: 1;
  display: flex;
  flex-direction: column;
  gap: 10px;
  overflow-y: auto;
  position: relative;
}
.filter__body::-webkit-scrollbar {
  width: 0px;
  height: 0px;
}
.filter__item {
  flex-shrink: 0;
  overflow-y: hidden;
  transition: 0.3s ease-in;
  padding: 0 16px 0 20px;
}
.filter__item-sup {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 48px;
  overflow: hidden;
  width: 100%;
}
.filter__item-sup:disabled {
  cursor: not-allowed;
}
.filter__item-sup:disabled span {
  color: var(--neutral-text-disabled);
}
.filter__item-sup:not(:disabled):hover span {
  color: var(--primary-text-default);
}
.filter__item-sup .btnArrow {
  font-size: 24px;
  transition: 0.3s;
}
.filter__item-sup span {
  transition: 0.3s;
  color: var(--neutral-text-body);
}
.filter__item-sup .expand {
  transform: rotate(180deg);
}
.filter__header span {
  color: var(--neutral-text-body);
}
.noFilters {
  width: 100%;
  text-align: center;
  color: var(--neutral-text-caption);
}

/* New: Shake animation */
.shake {
  animation: shake 0.5s ease;
}
@keyframes shake {
  0%,
  100% {
    transform: translateX(0);
  }
  25% {
    transform: translateX(-10px);
  }
  50% {
    transform: translateX(10px);
  }
  75% {
    transform: translateX(-10px);
  }
}

/* CUSTOM COMPONENTS - MODIFY */
.filter__header ::v-deep(.btn) {
  border-radius: 50%;
}

@media only screen and (max-width: 768px) {
  .filter__container {
    box-shadow: none;
    padding: 20px;
    width: 100vw;
    height: 100vh;
    transform-origin: right;
    border-radius: 0;
    transform: translateX(v-bind("showfilter ? '100% - 100vw' : '100%'"));
  }
}
</style>
