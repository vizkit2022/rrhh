<script setup>
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import useGrillaStore from "@/stores/grilla";
import useLinesStore from "@/stores/lines";
import useIncomesStore from "@/stores/incomes";
import { toast } from "vue3-toastify";

// Store
const grillaStore = useGrillaStore();
const linesStore = useLinesStore();
const incomesStore = useIncomesStore();

// Constants
const color = "--neutral-text-caption";
const { t } = useI18n();
const module = "grilla.dialogs.deleteLines";

// Computed
const title = computed(() => {
  const size = grillaStore.areAllSelected ? 0 : grillaStore.selectedIds.size;
  return t(module + ".title", { count: size });
});
const subtitle = computed(() => {
  const size = grillaStore.areAllSelected ? 0 : grillaStore.selectedIds.size;
  return t(module + ".subtitle", { count: size });
});
const yes = computed(() => t(module + ".yes"));
const cancel = computed(() => t(module + ".cancel"));

// Functions
const closeModal = () => {
  grillaStore.showModal = false;
  grillaStore.showModalType = "";
  grillaStore.showModalPosition = "center";
  grillaStore.showModalInfoAdditional = {};
  grillaStore.showModalTextAdditional = "";
};

const deleteItem = async () => {
  const incomeId = linesStore.income_id; 
  const all = grillaStore.areAllSelected;
  let ids = [];
  let backBreadcrumb = false;
  
  if(Object.values(grillaStore.showModalInfoAdditional).length === 0) {
    ids = [...grillaStore.selectedIds];
  } else {
    const id = grillaStore.showModalInfoAdditional?.__id;
    ids.push(id); // Agregar al padre


    const childLines = linesStore.lines.filter(
      line => Array.isArray(line.parents) && line.parents.includes(id)
    );

    childLines.forEach(l => {
      ids.push(l.__id); // Agregar a los hijos
    });
  }

  let config = { all, incomeId, ids };

  let uniqueParents  = [];
  // Borrado por selección
  if(Object.values(grillaStore.showModalInfoAdditional).length === 0) {
    const parentsIds = new Set();
    linesStore.lines.forEach(line => {
      if (ids.includes(line.__id)) {
        (line.parents || []).forEach(pId => parentsIds.add(pId));
      }
    });
    uniqueParents = Array.from(parentsIds);
  } else {
    // Borrado por categoría
    uniqueParents = grillaStore.showModalInfoAdditional.parents || [];
    if(incomesStore.hollywood && grillaStore.showModalInfoAdditional.superParent) {
      backBreadcrumb = true;
    }
  }

  let line = null;
  if (backBreadcrumb) {
    grillaStore.breadcrumb = grillaStore.breadcrumb.map((b) => ({
      ...b,
      disabled: true,
    }));
    line = grillaStore.showModalInfoAdditional;
    config.noSet = true;
  }

  closeModal();

  try {
    grillaStore.updating = true;
    grillaStore.loadings.delete = true;

    grillaStore.stopCloudSync();
    const resp = await linesStore.deleteLinesByIncome(config);
    grillaStore.startCloudSync();
  
    if (!resp.success) {
      const msg = t('grilla.alerts.deleteLinesCost', { count: resp.count });
      toast.error(msg, { autoClose: 2000 });
      grillaStore.updating = false;
      grillaStore.loadings.delete = false;
      return;
    }  

    if (backBreadcrumb) {
      if (grillaStore.breadcrumb.length === 1) {
        await linesStore.getAllLinesIncomes({ parent: "null" });
      } else {
        await linesStore.getAllLinesIncomes({
          parent: line.parent,
          hollywood: true,
        });
      }
      // Retroceder un nivel
      grillaStore.breadcrumb.pop();
    }

    await linesStore.calculateParentsBackIds(uniqueParents);
    // incomesStore.loadings.metrics = true;
    // await linesStore.updateDataGrid(); // revisar grilla
    grillaStore.loadings.delete = false;
    grillaStore.loadings.parents = true;
    grillaStore.updating = false;
  } catch (error) {
    console.error("Error eliminando líneas:", error);
  } finally {
    grillaStore.loadings.delete = false;
    grillaStore.loadings.parents = false;
    // incomesStore.loadings.metrics = false;
    grillaStore.updating = false;
    
    if(backBreadcrumb) {
      grillaStore.breadcrumb = grillaStore.breadcrumb.map((b) => ({
        ...b,
        disabled: false,
      }));
    }
  }
};

</script>

<template>
  <div class="delete">
    <span class="delete__title">{{grillaStore.showModalTextAdditional || title }}</span>
    <div class="delete__subtitle">
      <span class="u u-info"></span>
      <span>{{ subtitle }}</span>
    </div>
    <div class="delete__actions">
      <u-button :text="cancel" size="s" type="outlined" :color="color" @click="closeModal" />
      <u-button :text="yes" size="s" @click="deleteItem" />
    </div>
  </div>
</template>

<style scoped>
.delete {
  max-width: 700px;
  display: grid;
  gap: 24px;
}
.delete__title {
  font-size: 24px;
  line-height: 24px;
  font-weight: 600;
  color: var(--neutral-text-body);
  text-align: center;
}
.delete__subtitle {
  display: grid;
  grid-template-columns: 20px 0.9fr;
  column-gap: 4px;
  margin-bottom: 24px;
}
.delete__subtitle span {
  font-size: 16px;
  line-height: 16px;
  color: var(--neutral-text-caption);
}
.delete__actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 24px;
}
.delete__actions button {
  min-width: 160px;
}
</style>
