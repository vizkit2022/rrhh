<script setup>
import { ref, computed, watch, onMounted } from "vue";
import { useRoute } from "vue-router";
import useGlobalStore from "@/stores/global";
import useIncomesStore from "@/stores/incomes";
import useUserStore from "@/stores/user";
import useOrganizationStore from "@/stores/organization";
import useContactsStore from "@/stores/contacts";
import { capitalizeFirstLetter } from "@/utils/helpers";


const router = useRouter()

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
const userStore = useUserStore();
const organizationStore = useOrganizationStore();
const contactsStore = useContactsStore();
const incomesStore = useIncomesStore();
const { params } = useRoute();

// ========================================
// REACTIVE STATE
// ========================================
const search = ref("");
const results = ref([]);
const isSearching = ref(false);
const isLoadingInitial = ref(false);

// ========================================
// CONSTANTS
// ========================================
const SEARCH_TYPES = {
  CONTACTS: "contacts",
  USERS_ORGANIZATION: "usersOrganization"
};

const idIncome = params?.id || null;

// ========================================
// UTILITY FUNCTIONS
// ========================================
const selectContent = (event) => {
  event.target.select();
};

const getUser = (option) => {
  return { 
    name: option?.data?.legalName || "-", 
    src: option.imgUrl 
  };
};

const getUserId = (option, searchType) => {
  if (searchType === SEARCH_TYPES.USERS_ORGANIZATION) {
    return option.user?._id || option.id || option._id;
  }
  return option.id || option._id;
};

const createNewOption = (option, searchType) => {
  const newOption = {
    _id: getUserId(option, searchType),
    id: option.id,
    data: option.data,
    imgUrl: option.imgUrl,
    email: option.email,
    active: true
  };

  if (searchType === SEARCH_TYPES.USERS_ORGANIZATION && option.user) {
    newOption.user = option.user;
  }

  return newOption;
};

// ========================================
// API FUNCTIONS
// ========================================
const searchUsers = async (searchTerm, searchType) => {
  try {
    switch (searchType) {
      case SEARCH_TYPES.CONTACTS:
        return await userStore.findByUsersByNameOrEmail(
          true, false, searchTerm, { onlyContacts: true }
        );
      
      case SEARCH_TYPES.USERS_ORGANIZATION:
        return await organizationStore.findUserByOrganization(searchTerm);
      
      default:
        return [];
    }
  } catch (error) {
    console.error("Error fetching users:", error);
    return [];
  }
};

const loadDefaultData = async () => {
  if (props.filter.options?.length > 0) return;

  try {
    const searchType = props.filter.typeSearch;
    let defaultData = [];

    if (searchType === SEARCH_TYPES.CONTACTS) {
      defaultData = await loadContactsData();
    } else if (searchType === SEARCH_TYPES.USERS_ORGANIZATION) {
      defaultData = await loadOrganizationData();
    }

    if (defaultData?.length > 0) {
      props.filter.options = defaultData.map(item => ({ ...item }));
    }
  } catch (error) {
    console.error("Error loading default data:", error);
  }
};

const loadContactsData = async () => {
  const contactsFilters = globalStore.filters.filter(f => f.typeSearch === SEARCH_TYPES.CONTACTS);
  const isFirstFilter = contactsFilters[0]?.prop === props.filter.prop;

  if (!globalStore.filterUsersContactLoader && isFirstFilter) {
    isSearching.value = true;
    await contactsStore.getAllContacts();
    globalStore.filterUsersContactLoader = true;
    isSearching.value = false;
  }

  // Esperar a que termine la carga
  while (!globalStore.filterUsersContactLoader) {
    await new Promise(resolve => setTimeout(resolve, 50));
  }

  return contactsStore.contacts || [];
};

const loadOrganizationData = async () => {
  const orgFilters = globalStore.filters.filter(f => f.typeSearch === SEARCH_TYPES.USERS_ORGANIZATION);
  const isFirstFilter = orgFilters[0]?.prop === props.filter.prop;

  if (!globalStore.filterUsersOrganizationLoader && isFirstFilter) {
    isSearching.value = true;
    await organizationStore.getOrganizationById();
    globalStore.filterUsersOrganizationLoader = true;
    isSearching.value = false;
  }

  // Esperar a que termine la carga
  while (!globalStore.filterUsersOrganizationLoader) {
    await new Promise(resolve => setTimeout(resolve, 50));
  }

  return organizationStore.organization?.users || [];
};

// ========================================
// MAIN FUNCTIONS
// ========================================
const selectUser = async (option) => {
  const filterStore = globalStore.filters.find(f => f.prop === props.filter.prop);
  if (!filterStore) return;

  const searchType = props.filter.typeSearch;
  const optionId = getUserId(option, searchType);
  
  // Buscar la opción existente
  const existingIndex = props.filter.options.findIndex((op) => {
    if (searchType === SEARCH_TYPES.USERS_ORGANIZATION) {
      return op.user?._id === optionId || op._id === optionId;
    }
    return op._id === optionId;
  });

  // Toggle o agregar opción
  if (existingIndex !== -1) {
    props.filter.options[existingIndex].active = !props.filter.options[existingIndex].active;
  } else {
    const newOption = createNewOption(option, searchType);
    props.filter.options.push(newOption);
  }

  // Aplicar filtros (comentado según el código original)
  // await applyFilters();
};

const applyFilters = async () => {
  const activeFilters = globalStore.activeFilters.filter((f) => f.expand);
  const filters = {};
  
  activeFilters.forEach((fil) => {
    const activeOptions = fil.options.filter((opt) => opt.active);
    if (activeOptions.length) {
      filters[fil.prop] = activeOptions.map((opt) => {
        if (fil.typeSearch === SEARCH_TYPES.USERS_ORGANIZATION) {
          return opt.user?._id || opt._id || opt.id;
        }
        return opt._id || opt.id;
      });
    }
  });

  const state = "budget";
  await incomesStore.filterIncomeByFilter(state, idIncome, filters);
};

// ========================================
// COMPUTED PROPERTIES
// ========================================
const validLocalOptions = computed(() => {
  return (props?.filter?.options || []).filter(
    (op) => op && op.data && typeof op.data.legalName === "string"
  );
});

const validApiResults = computed(() => {
  return (results.value || []).filter(
    (op) => op && op.data && typeof op.data.legalName === "string"
  );
});

const filteredUsers = computed(() => {
  try {
    const toSearch = (search.value ?? "").toLowerCase().trim();

    // Sin búsqueda: mostrar todos los datos disponibles
    if (!toSearch) {
      return getCombinedResults();
    }

    // Mientras busca: no mostrar nada
    if (isSearching.value) {
      return [];
    }

    // Con búsqueda: solo resultados de API filtrados
    return getFilteredApiResults(toSearch);

  } catch (err) {
    console.error("[filteredUsers] Error:", err);
    return [];
  }
});

const getCombinedResults = () => {
  // Crear Set de IDs de API para evitar duplicados
  const apiIds = new Set();
  validApiResults.value.forEach(item => {
    if (item.id) apiIds.add(item.id);
    if (item._id) apiIds.add(item._id);
    if (item.email) apiIds.add(item.email);
  });
  
  // Filtrar opciones locales únicas
  const uniqueLocalOptions = validLocalOptions.value.filter(local => {
    return !apiIds.has(local._id) && 
           !apiIds.has(local.id) && 
           !apiIds.has(local.email);
  });

  // Combinar y ordenar
  const combined = [...validApiResults.value, ...uniqueLocalOptions];
  return combined.sort((a, b) => a.data.legalName.localeCompare(b.data.legalName));
};

const getFilteredApiResults = (searchTerm) => {
  const filtered = validApiResults.value.filter((op) => {
    const name = op?.data?.legalName?.toLowerCase() || "";
    const email = op?.email?.toLowerCase() || "";
    return name.includes(searchTerm) || email.includes(searchTerm);
  });

  return filtered.sort((a, b) => a.data.legalName.localeCompare(b.data.legalName));
};

const showLoading = computed(() => {
  return (isSearching.value && search.value.trim() !== "") || isLoadingInitial.value;
});

const hasActiveUser = computed(() => {
  return Array.isArray(props?.filter?.options) &&
         props.filter.options.some((op) => op.active) && 
         props.filter.canDisableOptionsUsers;
});

// ========================================
// WATCHERS
// ========================================
watch(search, async (newValue) => {
  if (newValue !== "") {
    isSearching.value = true;
    
    try {
      const searchResults = await searchUsers(newValue, props.filter.typeSearch);
      results.value = searchResults || [];
    } finally {
      isSearching.value = false;
    }
  } else {
    results.value = [];
  }
});

// ========================================
// LIFECYCLE
// ========================================
onMounted(async () => {
  isLoadingInitial.value = true;
  await loadDefaultData();
  isLoadingInitial.value = false;
});

const cleanup = () => {
  globalStore.filterUsersContactLoader = false;
  globalStore.filterUsersOrganizationLoader = false;

  results.value = [];
}

onBeforeUnmount(() => {
  cleanup();
});



</script>

<template>
  <div class="user-filter">
    <!-- SEARCH INPUT -->
    <div class="user-filter__search">
      <input
        type="text"
        :placeholder="$t('filters.user.inputs.placeholder')"
        :disabled="globalStore.savingFilter || hasActiveUser"
        v-model="search"
        @click="selectContent"
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
        :class="{ 'user-filter__item': true, selected: option.active }"
        :disabled="globalStore.savingFilter || option.custom || hasActiveUser"
        @click="selectUser(option)"
      >
        <u-avatar :user="getUser(option)" :size="28" />
        <span class="truncateText" v-text="option.data.legalName"></span>
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
  min-height: 130px;
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
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
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