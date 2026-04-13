<script setup>
import { defineEmits, ref, onMounted } from "vue";
import useCatalogStore from "@/stores/catalog";
import { toast } from "vue3-toastify";

const emit = defineEmits(["closeModal", "lockModal", "updateTotal"]);
const loading = ref(false);

const catalogStore = useCatalogStore();

const searchGroupItem = ref("");
const selectItem = ref("");
const loadingGroupItem = ref(false);
const errorNameGroupItem = ref(false);
const resultsGroupItem = ref([]);
const itemParents = ref([]);

const cleanNameGroupItem = () => {
  form.value.GroupItem = "";
  form.value.GroupItemEmail = "";
  searchGroupItem.value = "";
  errorNameGroupItem.value = false;
  newGroupItem.value = false;
};
const newNameGroupItem = async () => {
  try {
    let isParent = false;
    let obj = {
      name: searchGroupItem.value,
      isParent: isParent,
    };
    const itemSaved = await catalogStore.createItem(obj);
    if (itemSaved) {
      let obj = {
        label: itemSaved.name,
        id: itemSaved._id,
      };
      itemParents.value.push(obj);
      catalogStore.page = 1;
      catalogStore.nextPage = 1;
      await catalogStore.getItemsGroups();
    }
  } catch (err) {
    console.error(err);
  } finally {
    loadingGroupItem.value = false;
  }
};

const selectedNameGroupItem = (item) => {
  searchGroupItem.value = item;
  selectItem.value = item;

  itemParents.value.push({ label: item.label, id: item.id });
};

const mapperSearchResultUsers = (list) => {
  const resp = [];
  list.forEach((l) => {
    resp.push({
      label: l.name,
      id: l._id,
      oldData: { ...l },
    });
  });
  return resp;
};

const groupItem = async () => {
  try {
    let childrens = [];
    let parents = [];
    let items_select = catalogStore.items.filter((v) => v.selected);
    items_select.forEach((i) => {
      childrens.push(i._id);
    });

    if (itemParents.value.length === 0) {
      toast.error("Debe seleccionar una Categoría para agrupar los items", {
        autoClose: 3000,
      });
      return;
    }

    itemParents.value.forEach((i) => {
      parents.push(i.id);
    });

    await catalogStore.groupItem({ parents, childrens });

    catalogStore.page = 1;
    catalogStore.nextPage = 1;
    await catalogStore.getItemsGroups();
  } catch (err) {
    console.error(err);
  } finally {
    loadingGroupItem.value = false;
    emit("closeModal");
  }
};

watch(ref(searchGroupItem), async (newValue) => {
  if (newValue) {
    const trimmedSearch = newValue.trim();
    if (trimmedSearch !== "") {
      loadingGroupItem.value = true;
      await catalogStore.findItem(trimmedSearch);
      if (catalogStore.foundItems && catalogStore.foundItems.length) {
        resultsGroupItem.value = mapperSearchResultUsers(
          catalogStore.foundItems
        );
      } else {
        resultsGroupItem.value = [];
      }
      loadingGroupItem.value = false;
    }
  }
});

onMounted(() => {});
</script>

<template>
  <div class="containerDialog">
    <div class="modalShareTitle">
      <span>Agrupar items</span>
      <u-button-icon
        icon="close"
        class="btnIconModify"
        color="--bg-neutral-200"
        colorHover="--bg-neutral-400"
        colorActive="--bg-neutral-600"
        size="l"
        :disabled="loading"
        @action-btn="emit('closeModal')"
      />
    </div>
    <div class="modalShareBody">
      <span class="modalShareBodyText"
        >¿Cómo deseas agrupar los N° items seleccionados?</span
      >
      <div class="groupInput">
        <u-search
          class="inputGroupItem"
          v-model="searchGroupItem"
          size="l"
          :create="true"
          :loading="loadingGroupItem"
          :disabled="loading"
          placeholder="Crear o buscar Categoría"
          :options="resultsGroupItem"
          :error="errorNameGroupItem"
          @newOption="newNameGroupItem"
          @selectedOption="selectedNameGroupItem"
          @cleanInput="cleanNameGroupItem"
        />
        <div class="containerPage__tags" v-if="itemParents.length">
          <u-tags
            v-for="(item, i) in itemParents"
            :key="i"
            :text="item.label"
            @closeButton="removeRol(i)"
          />
        </div>
      </div>
    </div>
    <div class="containerDialog__actions">
      <u-button
        text="Cancelar"
        type="outlined"
        size="l"
        class="mainBtnModify"
        :disabled="loading"
        @action-btn="emit('closeModal')"
      />
      <u-button
        text="Agrupar"
        size="l"
        class="mainBtnModify"
        :disabled="loading"
        @action-btn="groupItem"
      />
    </div>
  </div>
</template>

<style scoped>
.inputGroupItem {
  width: 400px;
}

.containerDialog {
  height: 100%;
  display: grid;
  grid-template-rows: 40px 1fr 40px;
  gap: 20px;
}

.containerDialog__title {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 40px;
  width: 100%;
}

.containerDialog__title span {
  font-family: Nunito;
  font-size: 16px;
  font-weight: 600;
  line-height: 20px;
  letter-spacing: 0em;
  text-align: left;
  color: var(--bg-neutral-700);
}

.containerDialog__content {
  display: grid;
  justify-content: center;
  grid-template-rows: auto 1fr auto;
  padding: 20px 0;
}

.containerDialog__content-title {
  text-align: center;
  font-size: 18px;
  font-weight: 600;
  color: var(--bg-neutral-700);
}

.containerDialog__content-msg {
  display: flex;
  gap: 10px;
}

.containerDialog__content-msg p,
.containerDialog__content-msg span {
  font-size: 12px;
  color: var(--bg-danger-500);
}

.containerDialog__content-msg span {
  margin-top: 2px;
}

.containerDialog__content-msg p {
  text-align: justify;
}

.containerDialog__actions {
  width: 100%;
  height: 40px;
  display: flex;
  justify-content: space-between;
}

.containerDialog__content-types {
  display: flex;
  gap: 20px;
  justify-content: center;
  align-items: center;
}

.containerDialog__content-types button {
  display: flex;
  gap: 10px;
  flex-direction: column;
  align-items: center;
}

.containerDialog__content-types img {
  height: 80px;
}

.containerDialog__content-types span {
  font-size: 12px;
  font-weight: 600;
  padding: 8px;
  width: 100px;
  border-radius: 20px;
  background-color: var(--bg-neutral-100);
  color: var(--bg-neutral-500);
}

.mainBtnModify {
  width: calc(50% - 10px);
}

.btnIconModify {
  border-radius: 50%;
  color: var(--bg-neutral-500);
}

.btnCloseModal:hover .v-icon {
  color: #20a789;
  transition: 0.3s;
}

.modalShare {
  width: 100%;
  height: 544px;
  padding: 30px 30px 15px;
  display: grid;
  grid-template-rows: 30px 1fr 70px;
  gap: 20px;
  font-family: var(--font-family-nunito) !important;
}

.modalShareTitle {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 20px;
  font-weight: bold;
}

.modalShareActions {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
}

.modalShareBody {
  display: grid;
  grid-template-rows: 30px 1fr 24px;
  gap: 30px;
}

.modalShareBodyItems {
  display: grid;
  grid-template-columns: 1fr 1fr;
  grid-auto-rows: 40px;
  column-gap: 5px;
  row-gap: 5px;
}

.modalShareBodyText {
  text-align: center;
  font-size: 14px;
  margin-top: auto;
}

.modalShareBodyMsg {
  display: grid;
  grid-template-columns: 30px 1fr;
  font-size: 12px;
  line-height: 12px;
}

.modalShareBodyMsg div {
  display: flex;
  align-items: center;
}

.modalShareBodyMsg p {
  margin: 0px;
  text-align: justify;
}

.groupInput {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.groupInput label {
  font-size: 12px;
  font-weight: 600;
  line-height: 16px;
  text-align: left;
  color: var(--bg-neutral-700);
}

.containerPage__tags {
  display: flex;
  align-items: flex-start;
  align-self: flex-start;
  flex-wrap: wrap;
  column-gap: 10px;
  row-gap: 5px;
  overflow-y: auto;
  max-height: 148px;
}
.containerPage__tags::-webkit-scrollbar {
  width: 5px;
  height: 5px;
}

.containerPage__tags::-webkit-scrollbar-thumb {
  border-radius: 3px;
  background-color: var(--bg-neutral-300);
}
</style>
