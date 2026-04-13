<script setup>
import { ref, watch, defineProps, defineEmits, onMounted } from "vue";
import {
  defaultOptionsSubBudget,
  defaultOptionsSubBusiness,
  headersBasicInfo,
} from "@/utils/constants";
import { mapperColumnsBasicInfo } from "@/utils/formatters";
import { toast } from "vue3-toastify";
import useIncomesStore from "@/stores/incomes";
import useGlobalStore from "@/stores/global";
const incomesStore = useIncomesStore();
const globalStore = useGlobalStore();

const emit = defineEmits(["updtedMetrics"]);
const { params } = useRoute();
const id = params && params.id ? params.id : null;

const loading = ref(false);
const visibleDataModal = ref(false);
const uploadAction = ref(false);
const search = ref("");
const fullScreen = ref(false);
const options = ref([]);
const headers = ref(headersBasicInfo);
const typePage = ref("budgets");
const columns = {
  0: ["columnsSubBudget", defaultOptionsSubBudget],
  1: ["columnsSubBusiness", defaultOptionsSubBusiness],
};

// Props
const props = defineProps({
  tab: {
    type: Number,
    default: 0,
  },
});

//   Mounted
onMounted(() => {
  getOptions();
});

// Watch
watch(
  () => props.tab,
  async () => {
    search.value = "";
    globalStore.loading = true;
    loading.value = true;
    incomesStore.selectedIncomes.all = false;
    incomesStore.selectedIncomes.list = [];
    if (props.tab === 0) {
      typePage.value = "budgets";
      await incomesStore.getIncomesByProject(id, "budget");
    } else if (props.tab === 1) {
      typePage.value = "business";
      await incomesStore.getIncomesByProject(id, "business");
    }
    getOptions();
    loading.value = false;
    globalStore.loading = false;
  }
);

watch(ref(search), async (newValue) => {
  loading.value = true;
  if (newValue.trim() !== "") {
    await incomesStore.filterIncomeByName(newValue, typePage.value, id);
  } else {
    if (props.tab === 0) {
      await incomesStore.getAllProjects();
    } else if (props.tab === 1) {
      await incomesStore.getAllMovements("budget");
    } else if (props.tab === 2) {
      await incomesStore.getAllMovements("business");
    }
  }
  loading.value = false;
});

watch(ref(uploadAction), async (newValue) => {
  loading.value = true;
  document.getElementById("uploadFileInput").click();
  loading.value = false;
});

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
  await incomesStore.deleteIncome("movements");
  await incomesStore.getTotalsByProject(id);
  emit("updtedMetrics", props.tab === 0 ? "budget" : "business");
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
  const localOptions = JSON.parse(localStorage.getItem(columns[props.tab][0]));
  if (localOptions !== null) options.value = localOptions;
  else options.value = columns[props.tab][1];
  headers.value = mapperColumnsBasicInfo(options.value, headersBasicInfo);
};

const uploadFile = async (e) => {
  if (!e.target.files || !e.target.files[0]) {
    return;
  }

  const file = e.target.files[0];
  let fileType = "unknown";
  if (file.type === "application/xml" || file.type === "text/xml") {
    fileType = "xml";
  } else if (
    file.type === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  ) {
    fileType = "xlsx";
  } else if (file.type === "application/vnd.ms-excel") {
    fileType = "xls";
  }

  if(fileType !== 'xml'){
    return toast.warning("El archivo debe ser XML", {
        autoClose: 2000,
      });
  }
  
  const formData = new FormData();
  formData.append("file", file);
  formData.append("idProject", id);
  if (file.size) {
    const fileSizeKB = file.size / 1024;
    const fileSizeMB = fileSizeKB / 1024;
    await incomesStore.uploadFile(formData, fileType);
    e.target.value = null;
  } else {
    console.warn("File size information unavailable.");
  }
};
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
          :disabled="!incomesStore.movements.some((c) => c.selected)"
        />
        <u-button-icon
          icon="attach"
          type="outlined"
          color="--bg-info-500"
          colorHover="--bg-info-400"
          colorActive="--bg-info-600"
          @action-btn="uploadAction = !uploadAction"
        />

        <input
          type="file"
          name="cover"
          id="uploadFileInput"
          @change="uploadFile($event)"
          style="display: none"
        />
        <u-button
          class="btnDesktop"
          :text="`Crear ${props.tab === 0 ? 'Cotización' : 'Negocio'}`"
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
    <TableBasicInfo
      :headers="headers"
      :content="incomesStore.movements"
      :fullScreen="fullScreen"
      :loading="loading"
      :redirect="true"
      @selectAllItems="selectAllItems"
      @selectItem="selectItem"
    />
    <u-dialog
      :showModal="createModal"
      :lockModal="lockModal"
      @closeModal="hideModal"
      position="right"
      width="445px"
    >
      <IncomesDialogCreateMovement
        @closeModal="hideModal"
        @lockModal="lock"
        :state="props.tab === 0 ? 'budget' : 'business'"
      />
    </u-dialog>
    <u-dialog
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
    </u-dialog>
    <u-dialog
      :showModal="visibleDataModal"
      @closeModal="visibleDataModal = false"
      width="550px"
    >
      <DialogVisibleData
        @closeModal="visibleDataModal = false"
        @updatedHeaders="getOptions()"
        :options="options"
        :colection="columns[props.tab][0]"
      />
    </u-dialog>
  </div>
</template>

<style scoped>
.container {
  height: v-bind(
    "fullScreen ? '100vh' : 'calc(100vh - 80px - 84px - 70px - 52px)'"
  );
  width: v-bind("fullScreen ? '100vw' : 'calc(100vw - 100px)'");
  background-color: var(--white);
  box-shadow: v-bind("fullScreen ? 'none' : 'var(--shadow-1)'");
  border-radius: v-bind("fullScreen ? '0px' : '24px'");
  padding: 20px;
  box-sizing: border-box;
  display: grid;
  grid-template-rows: 36px 1fr;
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
  color: var(--bg-neutral-700);
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
    height: v-bind(
      "fullScreen ? '100vh' : 'calc(100vh - 80px - 84px - 85px - 52px - 60px)'"
    );
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
