<script setup>
import { defineProps, computed } from "vue";
import { useI18n } from "vue-i18n";
import useGrillaStore from "@/stores/grilla";
import useLinesStore from "@/stores/lines";
import useIncomesStore from "@/stores/incomes";
import usePermissionsStore from "@/stores/permissions";
import { toast } from "vue3-toastify";

// Stores
const grillaStore = useGrillaStore();
const linesStore = useLinesStore();
const incomesStore = useIncomesStore();
const permissionsStore = usePermissionsStore();

// Props
const props = defineProps({
  line: {
    type: Object,
    default: () => ({}),
  },
  config: {
    type: Object,
    default: () => ({}),
  },
});

// Constants
const { t } = useI18n();
const module = "grilla.body.actions.titles";
const moduleAlerts = "grilla.alerts";
const index = computed(() =>
  linesStore.lines.findIndex((l) => l.__id === props.line.data.__id)
);
const hollywood = computed(() => incomesStore.hollywood);

// Computed
const isParent = computed(() => props.config?.type === "category");
const level = computed(() => props.config?.level || 1);
const titles = computed(() => {
  const type = isParent.value ? ".category" : ".line";
  const lineName = props?.line?.data?.name ?? "";

  const base = {
    select: t(`${module}${type}.select`),
    delete: t(`${module}${type}.delete`),
    category: "",
    subcategory: "",
    new: t(`${module}${type}.new`),
  };

  if (isParent.value) {
    base.category = `${t(`${module}${type}.category`)} ${lineName}`.trim();
    base.subcategory = `${t(
      `${module}${type}.subcategory`
    )} ${lineName}`.trim();
    base.new = `${base.new} ${lineName}`.trim();
  }

  return base;
});
const isLocked = computed(() => props?.line?.data?.isClosedLine)

// ID estable de la fila
const lineId = computed(() => props?.line?.data?.__id || "");
// Bloquear si la línea se está eliminando
const isDeleting = computed(() => props?.line?.data?.__deleting || false);
const existsInBackend = computed(() => props?.line?.data?._id);
const disabled = computed(
  () => !existsInBackend.value || isDeleting.value || grillaStore.updating
);
const disabledHollywoodCategory = computed(() => {
  if (hollywood.value) {
    if (props.line.data.superParent) {
      return true;
    } else {
      return grillaStore.breadcrumb.length === 3;
    }
  }
  return false;
});
const disabledHollywoodSubcategory = computed(() => {
  if (hollywood.value) {
    if (grillaStore.breadcrumb.length === 0) {
      return true;
    }
    return !props.line.data.superParent;
  }
  return false;
});

// Permisos
const deletePemission = computed(
  () => permissionsStore?.myPermissions?.income__grid_line_delete
);
const addLinePemission = computed(
  () => permissionsStore?.myPermissions?.income__grid_line_add
);

// Functions
const addItem = (whatToCreate) => {
  if (linesStore.lines.some((l) => l.name === "")) {
    const l = linesStore.lines
      .filter((l) => l.isVisible)
      .findIndex((l) => l.name === "");
    const input = document.getElementById(`input-${l}-name`);
    if (input) {
      input.focus();
    }
    return;
  }

  const posVirtualList = props.line.index + 1;
  const posArrayList = index.value; // Posicion de la linea
  const newIdInput = `input-${posVirtualList}-name`;

  // Para catergorias -> comprimir la categoria quien creó y crear la nueva en la posicion siguiente
  if (whatToCreate === "category") {
    const ID = props?.line?.data?.__id;

    grillaStore.filterParent(props.line.data, { open: false });

    const config = {
      enterEvent: false,
      newIdInput,
      index: props.line.index, // Nueva posicion virtual cuando ya se comprimio
      idCurrentCategory: props.line.data.__id, // Sirve para encontrar la prosicion real
      origin: {
        parents: [...(props?.line?.data?.parents || [])],
        parent: props?.line?.data?.parent || "",
        __id: ID || "",
        level: props?.line?.data?.level || 1,
      },
      creatorType: isParent.value ? "category" : "line",
      creationTarget: whatToCreate,
    };

    linesStore.addEmptyLine(config);
  }
  // Para catergorias -> crear la nueva en la posicion 0
  else if (whatToCreate === "subcategory") {
    const config = {
      enterEvent: false,
      newIdInput,
      index: posArrayList,
      origin: {
        parents: [...(props?.line?.data?.parents || [])],
        parent: props?.line?.data?.parent || "",
        __id: props?.line?.data?.__id || "",
        level: props?.line?.data?.level || 1,
      },
      creatorType: isParent.value ? "category" : "line",
      creationTarget: whatToCreate,
    };

    linesStore.addEmptyLine(config);
  }
  // Para Lineas -> crear la nueva en la posicion 0
  else if (whatToCreate === "line") {
    const config = {
      enterEvent: false,
      newIdInput,
      index: posArrayList,
      origin: {
        parents: [...(props?.line?.data?.parents || [])],
        parent: props?.line?.data?.parent || "",
        __id: props?.line?.data?.__id || "",
        level: props?.line?.data?.level || 1,
      },
      creatorType: isParent.value ? "category" : "line",
      creationTarget: whatToCreate,
    };

    linesStore.addEmptyLine(config);
  }

  return;
};

const deleteItem = async () => {
  if(props?.line?.data?.isClosedLine) return "";

  if (props?.line?.data?._id === "") {
    // Borrar solo en front
    linesStore.lines.splice(index.value, 1);
    return;
  }

  const isParent = props?.line?.data?.isParent;
  if (isParent) {
    grillaStore.showModal = true;
    grillaStore.showModalType = "delete";
    grillaStore.showModalPosition = "center";
    grillaStore.showModalInfoAdditional = props?.line?.data || {};
    grillaStore.showModalTextAdditional = t(
      "grilla.dialogs.deleteLines.customTitle",
      { category: props?.line?.data?.name || "-" }
    );

    return; // Siguen en el Modal
  } else {
    // Marcar hijos si aplica
    const id = props?.line?.data?.__id || "";
    const incomeId = linesStore.income_id;

    linesStore.lines[index.value].__deleting = true;
    grillaStore.loadings.delete = true;

    const ids = [id];

    if (!id) return;

    try {
      const config = { incomeId, ids };
      incomesStore.loadings.metrics = true;
      grillaStore.stopCloudSync();
      const resp = await linesStore.deleteLinesByIncome(config);
      grillaStore.startCloudSync();

      if (!resp.success) {
        const msg = t(moduleAlerts + ".deleteLinesCost", { count: resp.count });
        toast.error(msg, { autoClose: 2000 });
        if (linesStore?.lines?.[index.value]?.__deleting !== undefined)
          linesStore.lines[index.value].__deleting = false;
      } else {
        grillaStore.loadings.delete = false;
        if (linesStore?.lines?.[index.value]?.__deleting !== undefined)
          linesStore.lines[index.value].__deleting = false;
        const parentsIds = props?.line?.data?.parents || [];
        grillaStore.loadings.parents = true;
        await linesStore.updateDataGridTotals(); // revisar grilla
        await linesStore.calculateParentsBackIds(parentsIds);
        grillaStore.loadings.parents = false;
      }
    } catch (err) {
      console.error("Error eliminando líneas:", err);
      // Revertir flags en error
      linesStore.lines[index.value].__deleting = false;
    } finally {
      grillaStore.loadings.delete = false;
      grillaStore.loadings.parents = false;
      incomesStore.loadings.metrics = false;
    }
  }
};
</script>

<template>
  <td :style="grillaStore.getColumnStyle('actions')">
    <div class="actions">
      <div class="actions__box">
        <u-checkbox-single
          :value="grillaStore.isSelected(lineId)"
          @change="grillaStore.toggleSelect(lineId, isParent)"
          :height="16"
          :title="titles.select"
          :disabled="isDeleting || grillaStore.updating || grillaStore.applySearch"
        />
      </div>
      <div class="actions__box">
        <button
          class="actions__btn"
          @click="deleteItem"
          :title="titles.delete"
          :disabled="isLocked || !deletePemission || isDeleting || grillaStore.applySearch"
        >
          <span class="u u-delete"></span>
        </button>
      </div>
      <div class="actions__box">
        <button
          class="actions__btn"
          @click="addItem('category')"
          :disabled="
            !addLinePemission ||
            disabled ||
            !isParent ||
            disabledHollywoodCategory || grillaStore.applySearch
          "
          v-bind="titles.category ? { title: titles.category } : {}"
        >
          <span class="u u-folder-add"></span>
        </button>
      </div>
      <div class="actions__box">
        <button
          class="actions__btn"
          @click="addItem('subcategory')"
          :disabled="
            !addLinePemission ||
            disabled ||
            !isParent ||
            disabledHollywoodSubcategory ||
            level === 3 || grillaStore.applySearch
          "
          v-bind="titles.subcategory ? { title: titles.subcategory } : {}"
        >
          <span class="u u-group-child"></span>
        </button>
      </div>
      <div class="actions__box">
        <button
          class="actions__btn"
          @click="addItem('line')"
          v-bind="titles.new ? { title: titles.new } : {}"
          :disabled="!addLinePemission || disabled"
        >
          <span class="u u-new"></span>
        </button>
      </div>
    </div>
  </td>
</template>

<style scoped>
td {
  border-right: 2px solid var(--neutral-border-subtle);
}
.actions {
  width: 100%;
  height: 100%;
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  align-items: center;
  padding: 0 12px;
  gap: 8px;
}
.actions__box {
  display: flex;
  justify-content: center;
}
.actions button.actions__btn {
  width: 16px;
  height: 16px;
  transition: 0.3s;
}
.actions button span {
  color: var(--neutral-text-caption);
  font-size: 16px;
  line-height: 16px;
  transition: 0.3s;
}
.actions button:not(:disabled):hover span {
  color: var(--primary-text-subtle);
}
.actions button:disabled span {
  color: var(--primary-text-disabled);
}
.actions button:disabled {
  cursor: not-allowed;
}
</style>
