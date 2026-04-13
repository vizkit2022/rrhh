<script setup>
import useCatalogStore from "@/stores/catalog";
import { watch, onMounted, ref, defineEmits } from "vue";
import { toast } from "vue3-toastify";
const catalogStore = useCatalogStore();
const search = ref("");
const searchItems = ref("");
const msgDelete = ref("");
const createItemModal = ref(false);
const showInfoItem = ref(false);
const emit = defineEmits(["updateTotal"]);
const typeTemplate = ref(0);
const headers = [
  { type: "checkbox", button: false, grid: "20px", property: "selected" },
  {
    type: "text",
    label: "Item",
    button: true,
    grid: "minmax(350px,1fr)",
    property: "name",
  },
  {
    type: "date",
    label: "Creación",
    button: true,
    grid: "150px",
    property: "createdAt",
  },
  {
    type: "mount",
    label: "Precio Promedio",
    grid: "minmax(150px,1fr)",
    property: "numbers.price.average.value",
    position: "right",
  },
  {
    type: "mount",
    label: "Precio Establecido",
    grid: "minmax(150px,1fr)",
    property: "numbers.price.default.value",
    position: "right",
  },
  {
    type: "mount",
    label: "Costo Promedio",
    button: true,
    grid: "minmax(140px,1fr)",
    property: "numbers.budget.average.value",
    position: "right",
  },
  {
    type: "mount",
    label: "Costo Establecido",
    grid: "minmax(140px,1fr)",
    property: "numbers.budget.default.value",
    position: "right",
  },
  {
    type: "mount",
    label: "Frecuencia de Uso",
    button: true,
    grid: "minmax(100px,1fr)",
    property: "numbers.budget.default.value",
    position: "right",
  },
];
const loading = ref(false);
const openGroupItems = ref(false);
// Bloquar Modal
const lockModal = ref(false);
const deleteDialog = ref(false);
const showDialogDelete = ref(false);
onMounted(async () => {
  catalogStore.page = 1;
  catalogStore.nextPage = 1;
  await catalogStore.getItemsWithPaginate();
  emit("updateTotal", catalogStore.totalItems);
});

watch(ref(searchItems), async (newValue) => {
  if (newValue) {
    const trimmedSearch = newValue.trim();
    if (trimmedSearch !== "") {
      loadingGroupItem.value = true;
      await catalogStore.findItemInStore(trimmedSearch);
      loadingGroupItem.value = false;
    }
  }
});

const hideModal = () => {
  if (!lockModal.value) {
    createItemModal.value = false;
    openGroupItems.value = false;
  }
};

const lock = (state) => {
  lockModal.value = state;
};

const selectAllItems = (checkbox) => {
  catalogStore.selectAllItems(checkbox);
};

const selectItem = (pos) => {};

const showDeleteDialog = () => {
  const selectedItems = catalogStore.items.filter((v) => v.selected);
  if (selectedItems.length > 0) {
    msgDelete.value = `¿Desea eliminar ${
      selectedItems.length > 1
        ? "los items seleccionados"
        : "el item seleccionado"
    }?`;
    deleteDialog.value = true;
  } else {
    toast.info("Debe seleccionar algun item para eliminar", {
      autoClose: 3000,
    });
  }
};

const showModalInfo = async (data) => {
  const id = data.content.data._id;
  if (id) {
    await catalogStore.getItemById(id);
    showInfoItem.value = true;
  }
};

const handleInput = async (event) => {
  let value = event.target.value;
  await catalogStore.findItemInStore(value);
};

const deleteItems = async () => {
  try {
    let res = catalogStore.items.filter((val) => val.selected);
    let size = res.length;
    let obj = null;
    let items = [];
    res.forEach((val) => {
      items.push(val._id);
      let index = catalogStore.items.findIndex((v) => v._id === val._id);
      catalogStore.items[index].archived = true;
    });
    obj = { items };
    //ACTUALIZACION EN BASE DE DATOS
    const response = await catalogStore.archivedItems(obj);
    catalogStore.items = catalogStore.items.filter((val) => !val.archived);
    let msg = "";

    if (response) {
      emit("updateTotal", catalogStore.totalItems);

      //Reiniciar el infinite scroll
      deleteDialog.value = false;
    }
  } catch (error) {
    console.error("Error al archivar los items: ", error);
  }
};

const openGroup = () => {
  let selected = catalogStore.items.filter((val) => val.selected);

  if (selected.length == 0) {
    toast.info("Debe seleccionar al menos un item para agrupar", {
      autoClose: 3000,
    });
    return;
  }

  openGroupItems.value = true;
};

const loadItems = async () =>
  catalogStore.totalItemsInRequest > 0
    ? await catalogStore.getItemsWithPaginate()
    : null;
</script>

<template>
  <div class="containerPage">
    <div class="containerPage__filters">
      <div>
        <u-input
          v-model="search"
          type="text"
          placeholder="Buscar..."
          @input="handleInput"
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
        />
      </div>
      <div>
        <u-button
          text="Eliminar"
          icon="delete"
          type="outlined"
          color="--bg-danger-500"
          colorHover="--bg-danger-400"
          colorActive="--bg-danger-600"
          @action-btn="showDeleteDialog"
        />
        <u-button
          text="Agrupar"
          icon="folder"
          type="outlined"
          @action-btn="openGroup"
        />
        <u-button
          class="btnDesktop"
          text="Agregar Item"
          icon="new-project"
          @action-btn="createItemModal = true"
        />
        <u-dialog
          :showModal="createItemModal"
          :lockModal="lockModal"
          @closeModal="createItemModal = false"
          width="900px"
          height="788px"
        >
          <catalogDialogCreateItem @closeModal="hideModal" @lockModal="lock" />
        </u-dialog>
        <u-button-icon
          class="btnMobile"
          icon="new-project"
          @action-btn="createItemModal = true"
        />

        <u-dialog
          :showModal="deleteDialog"
          @closeModal="showDialogDelete"
          width="400px"
          height="200px"
        >
          <div class="containerPageDialogDelete">
            <span>{{ msgDelete }}</span>
            <div>
              <u-button
                text="No"
                type="outlined"
                class="btnModify"
                @action-btn="deleteDialog = false"
              />
              <u-button
                text="Si"
                class="btnModify"
                color="--bg-danger-500"
                @action-btn="deleteItems"
              />
            </div>
          </div>
        </u-dialog>
      </div>
    </div>
    <TableBasicInfoinfinitescroll
      :headers="headers"
      :loading="loading"
      :redirect="true"
      @selectAllItems="selectAllItems"
      @selectItem="selectItem"
      @loadItems="loadItems"
      @showModalInfo="showModalInfo"
      :height="'100vh - 372px'"
    />
    <u-dialog
      :showModal="showInfoItem"
      @closeModal="showInfoItem = false"
      width="820px"
      height="620px"
    >
      <IncomesDialogInfoItemGrid
        @closeModal="showInfoItem = false"
        :content="typeTemplate"
      />
    </u-dialog>

    <u-dialog
      :showModal="openGroupItems"
      :lockModal="lockModal"
      @closeModal="hideModal"
      width="500px"
      height="500px"
    >
      <IncomesDialogGroupItems
        @closeModal="hideModal"
        @lockModal="lock"
        @previewPDF="openGroup"
      />
    </u-dialog>
  </div>
</template>

<style scoped>
.containerPage {
  height: calc(100vh - 50px - 52px - 86px - 90px);
  width: calc(100vw - 100px);
  background-color: var(--white);
  box-shadow: var(--shadow-1);
  border-radius: 24px;
  padding: 20px;
  box-sizing: border-box;
  display: grid;
  grid-template-rows: 36px 1fr;
  gap: 20px;
}

.containerPage__filters {
  display: flex;
  justify-content: space-between;
  gap: 24px;
}

.containerPage__filters > div {
  display: flex;
  gap: 24px;
}

.btnMobile {
  display: none;
}

@media only screen and (max-width: 768px) {
  .containerPage {
    height: calc(100vh - 80px - 84px - 140px - 52px - 60px);
    width: calc(100vw - 40px);
  }

  input {
    width: 120px;
  }
}

@media only screen and (max-width: 1060px) {
  .btnMobile {
    display: flex;
  }

  .btnDesktop {
    display: none;
  }

  .containerPage__filters > div {
    gap: 12px;
  }
}

/* Dialogo de borrar items */
.containerPageDialogDelete {
  height: 100%;
  display: grid;
  grid-template-rows: 1fr 40px;
}

.containerPageDialogDelete span {
  font-size: 20px;
  text-align: center;
  font-weight: 600;
}

.containerPageDialogDelete div {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.containerPageDialogDelete div .btnModify {
  width: calc(50% - 10px);
}
</style>
