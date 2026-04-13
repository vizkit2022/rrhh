<script setup>
import { ref, computed, onMounted } from 'vue';
import configTable from "@/utils/configTables/incomes.json";
import useIncomeStore from "@/stores/incomes";
import useGlobalStore from "@/stores/global";

// Stores
const incomeStore = useIncomeStore();
const globalStore = useGlobalStore();

// Constants
const search = ref("");
const modal = ref({});
const mainColor = "--bg-neutral-500";
const secondColor = "--bg-neutral-600";
const currentUser = ref({});
const isDeleteModalVisible = ref(false);
const { params } = useRoute();
const idProject = ref(params?.id ?? null);

// Computed
const disabledCrew = computed(() => {
  return !incomeStore.income.crew.some(c => c.selected);
})
const filteredListCrew = computed(() => {
  if(search.value.trim() === '') {
    return incomeStore.income.crew
  } else {
    const searchTerm = search.value.trim().toLowerCase();
    return incomeStore.income.crew.filter(item => {
      const legalName = item.contact?.data?.legalName?.toLowerCase() || '';
      const email = item.contact?.email?.toLowerCase() || '';
      return legalName.includes(searchTerm) || email.includes(searchTerm);
    });
  }
})

// Mounted
onMounted(async () => {
  globalStore.loading = true;
  await incomeStore.getCrew()
  globalStore.loading = false;
})

// Actions
const actionTable = (obj) => {
  const { emit, data, pos } = obj;
  const emits = {
    showCrew: () => editCrew(data),
  };
  emits[emit]();
};
const hideModal = () => {
  modal.value = {};
  currentUser.value = {};
}
const addCrew = () => {
  modal.value.add = true;
}
const editCrew = (data) => {
  modal.value.edit = true;
  currentUser.value = data;
}

const showModalDelete = () => {
  isDeleteModalVisible.value = true;
}

const removeCrew = async () => {
  try {
      globalStore.loading = true;

      let crews = incomeStore.income.crew.filter(c => !c.selected);
      
      const body = {
        _id: incomeStore.income._id,
        crew: crews,
        idProject: idProject.value,
      };
  
      const resp = await incomeStore.updateMovement(body);
      incomeStore.income.crew = resp.crew;

  } catch (error) {
      console.error(error)
  } finally {
      isDeleteModalVisible.value = false;
      globalStore.loading = false;
  }

}

</script>

<template>
  <div class="crew">
    <div class="crew__header">
      <u-input size="s" v-model="search" class="search" icon="search" :revers="true" placeholder="Buscar usuarios por nombre..." />
      <div class="crew__header">
        <u-button-icon icon="delete" type="outlined" size="s" :color="mainColor" :colorActive="secondColor" :colorHover="secondColor" @click="showModalDelete" :disabled="disabledCrew" />
        <u-button text="Asignar Líneas" icon="group" type="outlined" size="s" v-if="false" />  
        <u-button text="Agregar Crew" icon="user-new" size="s" @click="addCrew" />  
      </div>
    </div>
    <TableBasic :configTable="configTable.crew" :content="filteredListCrew" @actionTable="actionTable">
      <template v-slot:name="item">
        <IncomesCardsCellCrewUser :data="item?.item" />
      </template>
      <template v-slot:roles="item">
        <IncomesCardsCellCrewRoles :roles="item?.item?.roles || []" />
      </template>
      <template v-slot:lines="item">
        <IncomesCardsCellCrewAssignedLines :data="item?.item" />
      </template>
    </TableBasic>
  </div>
  <u-dialog
    :showModal="modal.add"
    @closeModal="hideModal"
    width="600px"
    height="auto"
    :persistent="true">
    <IncomesDialogAddCrew @closeModal="hideModal" />
  </u-dialog>

  <u-dialog
    :showModal="modal.edit"
    @closeModal="hideModal"
    width="auto"
    height="auto"
    :persistent="true"
  >
    <IncomesDialogEditCrew @closeModal="hideModal" :crew="currentUser" />
  </u-dialog>

  <dialog-confirm
    width="600px"
    height="auto"
    title="Estas seguro de eliminar a estos usuarios."
    description="Esta acción es irreversible."
    :showInput="false"
    :actionModal="removeCrew"
    :showModal="isDeleteModalVisible"
    @closeModal="isDeleteModalVisible = false"
  />
</template>

<style scoped>
.crew {
  width: 100%;
  height: calc(100vh - 166px);
  border-radius: 24px;
  box-sizing: border-box;
  display: grid;
  grid-template-rows: 32px 1fr;
  gap: 10px;
  background-color: var(--neutral-background-default);
  padding: 20px;
  box-shadow: var(--elevation-l);
}
.crew__header {
  display: flex;
  gap: 10px;
  justify-content: space-between;
  align-items: center;
}
.search {
  width: 400px;
}
</style>