<script setup>
import { ref, watch, defineProps, onMounted, computed } from "vue";
import {
  defaultOptionsProject,
  defaultOptionsBusiness,
  defaultOptionsBudget,
  defaultTabs,
  defaultTabsForIncomes,
  headersBasicInfo,
} from "@/utils/constants";
import { mapperColumnsBasicInfo } from "@/utils/formatters";
import labels from "@/utils/labels/incomes.json";
import configTable from "@/utils/configTables/incomes.json";

import useIncomesStore from "@/stores/incomes";
import useGlobalStore from "@/stores/global";
const incomesStore = useIncomesStore();
const globalStore = useGlobalStore();
const { params } = useRoute();
const id = params && params.id ? params.id : null;
const loading = ref(false);
const visibleDataModal = ref(false);
const search = ref("");
const fullScreen = ref(false);
const options = ref([]);
const headers = ref(headersBasicInfo);
const typePage = ref("projects");
const columns = {
  0: ["columnsProjects", defaultOptionsProject],
  1: ["columnsBudget", defaultOptionsBudget],
  2: ["columnsBusiness", defaultOptionsBusiness],
};
const metrics = ref(defaultMetrics);
const tabs = ref(defaultTabs);
const tabSelected = ref(0);
const tasks = [];

// Props
const props = defineProps({
  tab: {
    type: Number,
    default: 0,
  },
});

// Constants
const textDeleteModal = labels.crew.modal.delete;

// Breadcrumb setup
const getBreadcrumb = () => {
  const breadcrumb = [{ name: "Ventas", path: "/incomes" }];
  globalStore.updatedBreadcrumb(breadcrumb);
  globalStore.updatedTitle("Ventas");
  globalStore.namePage = "Incomes";
  globalStore.tag = "";
};

globalStore.loading = true;

// Mounted lifecycle hook
onMounted(async () => {
  globalStore.edit = false;
  getBreadcrumb();

  // Perform all API calls concurrently
  await Promise.all([
    incomesStore.getAllProjects(),
    incomesStore.getTotals(),
    getMetrics("projects"),
  ]);

  //TEMPORAL
  tabSelected.value = 0;

  incomesStore.selectAllIncomes(false, "projects");
  tabs.value = incomesStore.totals.length
    ? incomesStore.totals
    : defaultTabsForIncomes;

  globalStore.loading = false;
});

// Watchers
watch(ref(tabSelected), async (newValue) => {
  globalStore.loading = true;
  loading.value = true;
  search.value = "";
  incomesStore.selectedIncomes.all = false;
  incomesStore.selectedIncomes.list = [];

  if (tabSelected.value === 0) {
    typePage.value = "projects";
    tasks.push(incomesStore.getAllProjects());
  } else if (tabSelected.value === 1) {
    typePage.value = "budgets";
    tasks.push(incomesStore.getAllMovements("budget"));
  } else if (tabSelected.value === 2) {
    typePage.value = "business";
    tasks.push(incomesStore.getAllMovements("business"));
  }

  // Perform all tasks including metrics in parallel
  await Promise.all([
    getMetrics(incomesStore.stateIncome[newValue]?.params),
    ...tasks,
  ]);

  getOptions();
  loading.value = false;
  globalStore.loading = false;

  const selectedState = incomesStore.stateIncome[newValue]?.state;
  if (selectedState) {
    incomesStore.selectAllIncomes(false, selectedState);
  }
});

const getMetrics = async (state) => {
  await incomesStore.getMetrics(state);
  metrics.value = incomesStore.metrics;
};

watch(ref(search), async (newValue) => {
  loading.value = true;
  if (newValue.trim() !== "") {
    await incomesStore.filterIncomeByName(newValue, typePage.value, id);
  } else {
    await reloadIncomes();
  }
  loading.value = false;
});

const reloadIncomes = async () => {
  const tasks = [];
  if (tabSelected.value === 0) {
    tasks.push(incomesStore.getAllProjects());
  } else if (tabSelected.value === 1) {
    tasks.push(incomesStore.getAllMovements("budget"));
  } else if (tabSelected.value === 2) {
    tasks.push(incomesStore.getAllMovements("business"));
  }
  await Promise.all(tasks);
};

// Selection
const selectAllItems = (checkbox) => {
  incomesStore.selectAllIncomes(checkbox, typePage.value);
};
const selectItem = (checkbox, id, pos) => {
  incomesStore.selectIncome(checkbox, typePage.value, id, pos);
};

// Delete
const deleteItems = async () => {
  search.value = "";
  globalStore.loading = true;
  lockModal.value = true;
  if (tabSelected.value === 0) {
    await incomesStore.deleteIncome("projects");
  } else {
    await incomesStore.deleteIncome("movements");
  }
  globalStore.loading = false;
  lockModal.value = false;
  hideModal();
};

// Modal
const lockModal = ref(false);
const createModal = ref(false);
const modalDelete = ref(false);

const hideModal = () => {
  if (!lockModal.value) {
    createModal.value = false;
    modalDelete.value = false;
    lockModal.value = false;
  }
};
const lock = (state) => {
  lockModal.value = state;
};

//   Options
const getOptions = () => {
  const localOptions = JSON.parse(
    localStorage.getItem(columns[tabSelected.value][0])
  );
  if (localOptions !== null) options.value = localOptions;
  else options.value = columns[tabSelected.value][1];
  headers.value = mapperColumnsBasicInfo(options.value, headersBasicInfo);
};

const textAux = computed(() => {
  const length = incomesStore[
    tabSelected.value === 0 ? "projects" : "movements"
  ].filter((i) => i.selected).length;
  return length === 1 ? "one" : "various";
});
</script>

<template>
  <div class="container">
    <div class="container__filters">
      <div class="search">
        <u-input
          v-model="search"
          placeholder="Buscar ..."
          :revers="true"
          icon="search"
        />
        <u-button
          class="btnDesktop"
          text="Datos Visibles"
          icon="toggle"
          :revers="true"
          type="outlined"
          color="--bg-neutral-500"
          colorHover="--bg-neutral-600"
          colorActive="--bg-neutral-700"
          @action-btn="visibleDataModal = true"
        />
      </div>
      <div>
        <u-button-icon
          class="btnMobile"
          icon="toggle"
          type="outlined"
          color="--bg-neutral-500"
          colorHover="--bg-neutral-600"
          colorActive="--bg-neutral-700"
          @action-btn="visibleDataModal = true"
        />
        <u-button-icon
          icon="delete"
          type="outlined"
          color="--bg-danger-500"
          colorHover="--bg-danger-400"
          colorActive="--bg-danger-600"
          @action-btn="modalDelete = true"
          :disabled="
            !incomesStore[tabSelected === 0 ? 'projects' : 'movements'].some(
              (c) => c.selected
            )
          "
        />
        <u-button
          class="btnDesktop"
          text="Crear Proyecto"
          icon="new-project"
          @action-btn="createModal = true"
        />
        <u-button-icon
          class="btnMobile"
          icon="new-project"
          @action-btn="createModal = true"
        />
        <u-button-icon
          :icon="fullScreen ? 'minimize-1' : 'maximize-1'"
          type="outlined"
          color="--bg-neutral-500"
          colorHover="--bg-neutral-600"
          colorActive="--bg-neutral-700"
          @action-btn="fullScreen = !fullScreen"
        />
      </div>
    </div>

    <u-tabs style="" :tabs="tabs" v-model="tabSelected" />

    <!--     <TableBasicInfo
      :headers="headers"
      :content="incomesStore[tabSelected === 0 ? 'projects' : 'movements']"
      :fullScreen="fullScreen"
      :loading="loading"
      :redirect="true"
      @selectAllItems="selectAllItems"
      @selectItem="selectItem"
    /> -->

    <TableBasic
      :fullScreen="fullScreen"
      :configTable="configTable[tabSelected === 0 ? 'projects' : 'movements']"
      :content="incomesStore.projects"
      :loading="loading"
    >
    </TableBasic>

    <u-indicators-lite :indicators="incomesStore?.metrics || []" />
    <u-dialog
      :showModal="createModal"
      :lockModal="lockModal"
      @closeModal="hideModal"
      position="right"
      width="445px"
    >
      <incomesDialogCreateProject @closeModal="hideModal" @lockModal="lock" />
    </u-dialog>
    <!-- <u-dialog
      :showModal="modalDelete"
      :lockModal="lockModal"
      @closeModal="hideModal"
      width="445px"
      height="200px"
    >
      <div class="modalConfirm">
        <h2>Estas seguro de eliminar</h2>
        <div>
          <u-button
            text="Cancelar"
            type="outlined"
            @action-btn="hideModal"
            class="btnModalModify"
            color="--neutral-border-default"
            colorHover="--primary-border-subtle"
            colorActive="--primary-border-darker"
          />
          <u-button
            text="Eliminar"
            color="--bg-danger-500"
            colorHover="--bg-danger-600"
            colorActive="--bg-danger-700"
            @action-btn="deleteItems"
            class="btnModalModify"
          />
        </div>
      </div>
    </u-dialog> -->
    <dialog-confirm
      width="600px"
      height="auto"
      :title="
        textDeleteModal.title[
          tabSelected === 0
            ? 'project'
            : tabSelected === 1
            ? 'budget'
            : 'business'
        ][textAux][globalStore.lang]
      "
      :description="textDeleteModal.description[globalStore.lang]"
      :showInput="true"
      :confirmationText="textDeleteModal.textConfirm[globalStore.lang]"
      :actionModal="deleteItems"
      :showModal="modalDelete"
      @closeModal="modalDelete = false"
    />
    <u-dialog
      :showModal="visibleDataModal"
      @closeModal="visibleDataModal = false"
      width="550px"
    >
      <DialogVisibleData
        @closeModal="visibleDataModal = false"
        @updatedHeaders="getOptions()"
        :options="options"
        :colection="columns[tabSelected][0]"
      />
    </u-dialog>
  </div>
</template>

<style scoped>
.container {
  height: v-bind("fullScreen ? '100vh' : 'calc(100vh -  49px  - 52px)'");
  width: v-bind("fullScreen ? '100vw' : 'calc(100vw - 100px )'");
  background-color: var(--neutral-background-default);
  box-shadow: v-bind("fullScreen ? 'none' : 'var(--shadow-1)'");
  border-radius: v-bind("fullScreen ? '0px' : '24px'");
  padding: 20px;
  box-sizing: border-box;
  display: grid;
  grid-template-rows: 36px 32px 1fr 60px;
  gap: 20px;
  position: v-bind("fullScreen ? 'absolute' : ''");
  top: 0;
  left: 0;
  z-index: v-bind("fullScreen ? 1000 : ''");
}

.container__filters {
  display: flex;
  justify-content: space-between;
  gap: 24px;
  align-self: center;
}

.container__filters > div {
  display: flex;
  gap: 24px;
}

.container__filters .search {
  display: grid;
  grid-template-columns: 400px auto auto;
}

.btnMobile {
  display: none;
}
.modalConfirm {
  display: flex;
  flex-direction: column;
  height: 100%;
  justify-content: space-around;
  gap: 20px;
}
.modalConfirm h2 {
  text-align: center;
  font-size: 20px;
  font-weight: 600;
  color: var(--neutral-text-body);
}
.modalConfirm div {
  display: flex;
  justify-content: space-between;
}
.btnModalModify {
  width: calc(50% - 10px);
}

@media only screen and (max-width: 818px) {
  .container__filters .search {
    grid-template-columns: 1fr;
  }
}

@media only screen and (max-width: 768px) {
  .container {
    height: v-bind("fullScreen ? '100vh' : 'calc(100vh - 80px - 84px )'");
    width: v-bind("fullScreen ? '100vw' : 'calc(100vw - 40px)'");
  }
}
@media only screen and (max-width: 1206px) {
  .btnMobile {
    display: flex;
  }
  .btnDesktop {
    display: none;
  }
  .container__filters > div {
    gap: 12px;
  }
}
</style>
