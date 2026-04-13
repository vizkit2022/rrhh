<script setup>
import { ref, computed, onMounted } from "vue";
import useIncomesStore from "@/stores/incomes";
import useGlobalStore from "@/stores/global";

// Stores
const incomesStore = useIncomesStore();
const globalStore = useGlobalStore();

// Constants
const { params } = useRoute();
const IdIncome = params && params.income ? params.income : null;

// Variables
const lockModal = ref(false);
const loading = ref(false);

onMounted(async () => {
  await getInitVars();
});

// Computed
const disabled = computed(() =>
  Object.values(incomesStore.configGlobals.loadings).some(Boolean),
);
const deleteVariableLoading = computed(() =>
  incomesStore?.configGlobals?.group?.globalVariables?.filter((v) => v.loading),
);

// Functions
const getInitVars = async() => {
  try {
    loading.value = true;

    incomesStore.configGlobals.loadings.updating = true;
    let resp = await incomesStore.getGlobalsList(IdIncome);

    incomesStore.configGlobals = {
      modal: {
        group: null,
        show: false,
        new: false,
        delete: false,
      },
      loadings: {
        updating: false
      },
      groups: [],
      group: null,
      edit: false, 
      change: false,
      originalGroup: null
    };

    if(resp.length) {  
      incomesStore.configGlobals.groups = resp.map((r, index) => ({
        ...r,
        order: index,
        current: index === 0,
        globalVariables: r.globalVariables.map((g) => ({
          ...g,
          typeName: getType(g.type),
          unitName: g?.unit?.name || "Sin Unidad",
        })),
      }));
      incomesStore.configGlobals.group = incomesStore.configGlobals.groups[0];
    }
    incomesStore.getUnitsByIncome(IdIncome);
  } catch (e) {
    console.error("Error:", e);
  } finally {
    incomesStore.configGlobals.loadings.updating = false;
    loading.value = false;
  }
};
const updatingGlobals = async () => {
  try {
    incomesStore.configGlobals.loadings.updating = true;
    let resp = await incomesStore.getGlobalsList(IdIncome);

    const idCurrent = incomesStore.configGlobals.group._id;

    incomesStore.configGlobals.groups = [];
    resp.forEach((r, index) => {
      if (r._id == idCurrent)
        incomesStore.configGlobals.groups.unshift({
          ...r,
          order: index,
          current: true,
        });
      else
        incomesStore.configGlobals.groups.push({
          ...r,
          order: index,
          current: false,
        });
    });
    const group = incomesStore.configGlobals.groups.find(
      (g) => g._id === idCurrent,
    );
    incomesStore.configGlobals.group = {
      ...group,
      globalVariables: group.globalVariables.map((g) => ({
        ...g,
        typeName: getType(g.type),
        unitName: g?.unit?.name || "Sin Unidad",
      })),
    };
  } catch (e) {
    console.error("Error:", e);
  } finally {
    incomesStore.configGlobals.loadings.updating = false;
  }
};
const getType = (type) => {
  const types = {
    constant: { es: "Constante", en: "Constant" },
    variable: { es: "Variable", en: "Variable" },
    text: { es: "Texto", en: "Text" },
  };
  return (
    types?.[type]?.[globalStore.lang] || types.constant[[globalStore.lang]]
  );
};
const hideModal = () => {
  if (!lockModal.value) {
    incomesStore.configGlobals.modal.show = false;
    incomesStore.configGlobals.modal.new = false;
    incomesStore.configGlobals.modal.delete = false;
  }
};
async function deleteGroup() {
  try {
    globalStore.loading = true;
    const groupId = incomesStore.configGlobals.modal.group._id;
    await incomesStore.deleteGroupGlobals(groupId);
    await getInitVars();
  } catch (e) {
    console.error("Error al eliminar el grupo de variables:", e);
  } finally {
    globalStore.loading = false;
  }
}
</script>

<template>
  <div class="globals">
    <IncomesContainerConfigurationVariablesGlobalsHeader
      :disabled="disabled"
      :deleteVariableLoading="deleteVariableLoading"
      @updatingGlobals="updatingGlobals"
    />
    <IncomesContainerConfigurationVariablesGlobalsLoading v-if="loading" />
    <template v-else>
      <IncomesContainerConfigurationVariablesGlobalsNoData
        v-if="incomesStore.configGlobals.group === null"
      />
      <template v-else>
        <IncomesContainerConfigurationVariablesGlobalsSubHeaders
          :disabled="disabled"
          :deleteVariableLoading="deleteVariableLoading"
        />
        <IncomesContainerConfigurationVariablesGlobalsContent
          :disabled="disabled"
          :deleteVariableLoading="deleteVariableLoading"
        />
      </template>
    </template>
  </div>

  <u-dialog
    :showModal="incomesStore.configGlobals.modal.show"
    :lockModal="lockModal"
    @closeModal="hideModal"
    width="auto"
    height="auto"
  >
    <IncomesDialogGroupGlobals
      @closeModal="hideModal"
      @updatingGlobals="updatingGlobals"
    />
  </u-dialog>
  <u-dialog
    :showModal="incomesStore.configGlobals.modal.new"
    :lockModal="lockModal"
    @closeModal="hideModal"
    width="auto"
    height="auto"
  >
    <IncomesDialogCreateGlobals
      @closeModal="hideModal"
      @updatingGlobals="updatingGlobals"
    />
  </u-dialog>

  <dialog-confirm
      width="600px"
      height="auto"
      :title="`Eliminar al grupo ${incomesStore?.configGlobals?.modal?.group?.name || '-'}`"
      description="Si el grupo de variables contiene alguna variable que se encuentra en uso, la variable se mostrará con el valor numérico correspondiente y no podrá volver a ser utilizada en el proyecto"
      :showInput="true"
      confirmationText="Eliminar"
      :actionModal="() => deleteGroup()"
      :showModal="incomesStore.configGlobals.modal.delete"
      @closeModal="incomesStore.configGlobals.modal.delete = false"
    />
</template>

<style scoped>
.globals {
  width: 100%;
  display: grid;
  grid-template-rows: v-bind(
    "(loading || incomesStore.configGlobals.group === null) ? '40px 400px' : '40px auto 1fr'"
  );
  row-gap: 16px;
}
</style>
