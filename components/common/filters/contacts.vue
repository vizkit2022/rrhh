<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from "vue";
import { useRouter } from "vue-router";
import useGlobalStore from "@/stores/global";
import { useI18n } from "vue-i18n";

// ========================================
// TRANSLATION
// ========================================
const { t } = useI18n();
const module = "filters";

// ========================================
// ROUTER
// ========================================
const router = useRouter();

// ========================================
// PROPS & STORES
// ========================================
const props = defineProps({
  filter: {
    type: Object,
    default: () => {},
  },
});

const globalStore = useGlobalStore();

// ========================================
// REACTIVE STATE
// ========================================
const search = ref(""); 
const isSelecting = ref(false);
const selectedId = ref(null); // ID del contacto seleccionado
const localOptions = ref([]); // Opciones locales
// const isSearching = ref(false);

// ========================================
// CONSTANTS
// ========================================


// ========================================
// COMPUTED
// ========================================
// const filteredUsers = computed(() => {
//   return props.filter?.options || [];
// });
const filteredUsers = computed(() => {
  return props.filter.isLoading ? [] : localOptions.value;
});


const showLoading = computed(() => {
  return props.filter.isLoading || globalStore.filterContactsLoader;
});

// ========================================
// UTILITY FUNCTIONS
// ========================================
const getUser = (option) => {
  return {
    name: option?.data?.legalName || "-",
    src: option.imgUrl,
  };
};

const getSearchType = (filterProp) => {
  switch (filterProp) {
    //CASES CLIENTS, CONTACTS, EXECUTIVES (PROYECTS Y MOVEMENTS)
    case "clients": {
      return "client";
    }
    case "contacts": {
      return "contact";
    }
    case "executives": {
      return "executive";
    }
    // CASE PROVEEDOR (OUTCOMES)
    default: {
      return "";
    }
  }
};

  // Lista de reglas para búsqueda (igual estilo a tu mounted)
  const searchRules = [
    {
      condition: (f) => f.typeSearch === "project",
      execute: async (f) => {

        const params = {
          filterType: f.typeSearch,
          name: f.search,
          searchType: getSearchType(f.prop),
        }

        return await globalStore.getFiltersTypeContacts(params);
      },
      assignOptions: (f, result) => result?.[f.prop] || [],
    },
    {
      condition: (f) => f.typeSearch === "income",
      execute: async (f) => {
        const params = {
          filterType: f.typeSearch,
          name: f.search,
          idProject: f.idProject,
          searchType: getSearchType(f.prop),
          state: f.typeIncome
        }

        return await globalStore.getFiltersTypeContacts(params);
      },
      assignOptions: (f, result) => result?.[f.prop] || []
    },
    {
      condition: (f) => f.typeSearch === "outcome",
      execute: async (f) => {

        const params = {
          filterType: f.typeSearch,
          name: f.search
        }

        return await globalStore.getFiltersTypeContacts(params);
      },
      assignOptions: (f, result) => result || [],
    },
    // Puedes agregar más reglas aquí luego 👇
    // {
    //   condition: (f) => f.typeSearch === "usersOrganization",
    //   execute: async (f) => globalStore.getUsersOrganization(f.search),
    //   assignOptions: (f, result) => result.users,
    // },
  ];

const reloadFilterIfNoActiveOption = async () => {
    // SI EL FILTRO TIENE UNA BUSQUEDA Y NO TIENE OPCIONES SELECCIONADAS ENTONCES RELOAD
    if (props.filter.search && !props.filter.options.some((op) => op.active)) {

    props.filter.isLoading = true;
    props.filter.options = [];

    //FILTER PROJECT
    props.filter.search = "";

    const params = {
      filterType: props.filter.typeSearch,
      name: props.filter.search,
      searchType: getSearchType(props.filter.prop),
    }

    const resp = await globalStore.getFiltersTypeContacts(params);

    if (resp) {
      props.filter.options = resp?.[props.filter.prop] || [];
    }

    props.filter.isLoading = false;
  }
}

// ========================================
// MAIN FUNCTIONS
// ========================================

// guarda el ID y mantiene activo
const selectUser = (option) => {
  const isAlreadyActive = option.active; // estaba activo?

  isSelecting.value = true;

  // Si ya estaba activo → desactivar todo
  if (isAlreadyActive) {
    selectedId.value = null;

    // Desactivar global
    props.filter.options = props.filter.options.map(op => ({
      ...op,
      active: false
    }));

    // Desactivar local
    localOptions.value = localOptions.value.map(op => ({
      ...op,
      active: false
    }));

  } else {
    // Activar nuevo
    selectedId.value = option._id;

    props.filter.options = props.filter.options.map(op => ({
      ...op,
      active: op._id === option._id
    }));

    localOptions.value = localOptions.value.map(op => ({
      ...op,
      active: op._id === option._id
    }));
  }

  requestAnimationFrame(() => (isSelecting.value = false));
};



const handleSearch = (e) => {
  props.filter.search = e.target.value;
  props.filter.isLoading = true;

  searchContact();
};

const searchContact = debounce(async () => {
  const filter = props.filter;
  props.filter.isLoading = true;

  const rule = searchRules.find((r) => r.condition(filter));
  if (!rule) {
    props.filter.isLoading = false;
    return;
  }

  const result = await rule.execute(filter);
  const data = rule.assignOptions(filter, result);

  localOptions.value = data.map(op => ({
    ...op,
    active: op._id === selectedId.value
  }));

  props.filter.isLoading = false;
}, 600);

const searchContactFast = async () => {
  const filter = props.filter;
  props.filter.isLoading = true;

  console.log('select filter id', selectedId.value);

  const rule = searchRules.find((r) => r.condition(filter));
  if (!rule) {
    props.filter.isLoading = false;
    return;
  }

  const result = await rule.execute(filter);
  const data = rule.assignOptions(filter, result);

  localOptions.value = data.map(op => ({
    ...op,
    active: op._id === selectedId.value
  }));

  props.filter.isLoading = false;
};

// ========================================
// WATCHERS
// ========================================

// Si el filtro no tiene ninguna activa, limpiamos
// Si la opcion seleccionada ya no estaba activa, limpiamos
watch(
  () => props.filter.options,
  (newOptions) => {

    if (isSelecting.value) {
      // No vuelve a buscar si viene de selección
      selectedId.value = newOptions?.find(op => op.active)?._id;
      return;
    }

    if (props.filter.search) {
      selectedId.value = newOptions?.find(op => op.active)?._id;
      searchContactFast(); // ahora solo si viene de una búsqueda real
    }

    if (!props.filter.isLoading) {
      localOptions.value = JSON.parse(JSON.stringify(newOptions ?? []));
      selectedId.value = newOptions?.find(op => op.active)?._id;
    }
  },
  { immediate: true, deep: true }
);


onMounted(async () => {
  // RELOAD FILTER SI NO TIENE OPCIONES SELECCIONADAS Y HAY UNA BUSQUEDA EN EL FILTRO
  await reloadFilterIfNoActiveOption();
});

onUnmounted(() => {
  if (globalStore.appliedFiltersCount === 0) {
    props.filter.search = "";
    props.filter.options = [];
  }
});
</script>

<template>
  <div class="user-filter">
    <!-- SEARCH INPUT -->
    <div class="user-filter__search">
      <input
        type="text"
        :placeholder="t(`${module}.${filter.prop}.inputs.placeholder`)"
        :value="props.filter.search"
        @input="handleSearch"
      />
      <span class="u u-search"></span>
    </div>

    <!-- RESULTS LIST -->
    <div class="user-filter__list">
      <!-- Loading State -->
      <div v-if="showLoading" class="loading-container">
        <div class="loading-spinner"></div>
        <span class="loading-text body-xs-r">Buscando...</span>
      </div>

      <!-- User Options -->
      <button
        v-for="option in filteredUsers"
        :key="option._id"
        :class="{ 'user-filter__item': true, selected: option?.active }"
        @click="selectUser(option)"
      >
        <u-avatar :user="getUser(option)" :size="28" />
        <span class="truncateText">{{ option?.data?.legalName }}</span>
      </button>

      <!-- Empty State -->
      <span
        v-if="filteredUsers.length === 0 && !showLoading"
        v-text="$t('filters.user.inputs.noData')"
        class="noData body-xs-r"
      ></span>
    </div>
  </div>
</template>

<style scoped>
.user-filter {
  display: grid;
  grid-template-rows: 36px 1fr;
  gap: 10px;
  min-height: v-bind(
    "showLoading || filteredUsers.length === 0 ? '130px' : 'auto'"
  );
  background-color: var(--secondary-surface-shadow-8a);
  border-radius: 20px;
  padding: 8px 16px;
}

.user-filter__search {
  background-color: var(--secondary-surface-shadow-12a);
  border-radius: 12px;
  position: relative;
}

.user-filter__search input {
  height: 36px;
  width: 100%;
  padding: 8px 36px 8px 12px;
  font-size: 14px;
  line-height: 14px;
  border-radius: 12px;
  color: var(--neutral-text-subtitle);
  transition: 0.3s;
  caret-color: var(--secondary-border-subtle);
}

.user-filter__search input::placeholder {
  color: var(--neutral-text-caption);
}

.user-filter__search input:focus,
.user-filter__search input:active {
  box-shadow: inset 0px 0px 0px 2px var(--secondary-border-subtle);
}

.user-filter__search input::selection {
  background-color: var(--secondary-border-subtle);
  color: var(--neutral-background-default);
}

.user-filter__search input:not(:focus):not(:active):not(:disabled):hover {
  box-shadow: inset 0px 0px 0px 2px var(--secondary-border-light);
}

.user-filter__search input:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.user-filter__search .u {
  position: absolute;
  right: 8px;
  top: 8px;
  color: var(--neutral-text-caption);
  font-size: 20px;
  line-height: 20px;
  opacity: v-bind("globalStore.savingFilter ? '0.3' : '1'");
  cursor: v-bind("globalStore.savingFilter ? 'not-allowed' : ''");
}

.user-filter__list {
  overflow-y: auto;
  max-height: 200px;
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding-right: 2px;
}

.user-filter__list::-webkit-scrollbar {
  width: 8px;
  background: var(--secondary-surface-shadow-12a);
  border-radius: 20px;
}

.user-filter__list::-webkit-scrollbar-thumb {
  background: var(--secondary-surface-harder);
  border-radius: 5px;
}

.user-filter__list .noData {
  color: var(--neutral-text-caption);
  text-align: center;
  margin-top: 26px;
}

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 20px 0;
}

.loading-spinner {
  width: 24px;
  height: 24px;
  border: 2px solid var(--secondary-surface-shadow-12a);
  border-top: 2px solid var(--secondary-border-subtle);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.loading-text {
  color: var(--neutral-text-caption);
  text-align: center;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.user-filter__item {
  flex-shrink: 0;
  display: grid;
  grid-template-columns: 28px 1fr;
  gap: 8px;
  align-items: center;
  padding: 0 5px;
  transition: 0.3s;
  height: 36px;
  border-radius: 12px;
}

.user-filter__item span {
  font-size: 16px;
  line-height: 16px;
  color: var(--neutral-text-body);
  transition: 0.3s;
  text-align: left;
}

.user-filter__item:hover span,
.user-filter__item.selected span {
  color: var(--secondary-text-default);
}

.user-filter__item:hover,
.user-filter__item.selected {
  background-color: var(--secondary-surface-shadow-12a);
}

.user-filter__item:disabled {
  cursor: not-allowed;
  opacity: 0.3;
}
</style>
