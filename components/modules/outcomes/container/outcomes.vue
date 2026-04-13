<script setup>
import { ref } from "vue";
import useGlobalStore from "@/stores/global";
import labels from "@/utils/labels/outcomes.json";
import useOutcomesStore from "@/stores/outcomes";

// EventBus
const { $bus } = useNuxtApp();

// Stores
const globalStore = useGlobalStore();
const outcomesStore = useOutcomesStore();

//   Constants
const update = 1;
const modalDelete = ref(false);
const search = ref("");
const toPayLines = ref([]);
const toPayMode = ref("");
const showModalPay = ref(false);

const initCloseModal = () => {
  outcomesStore.formOc.type = "OC";
  $bus.$on("closeDialog", () => {
    console.log("ejecutando cierre de add lines");
    hideModal();
  });
  showModalAddLines.value = true;
};

// Modal
const showModalAddLines = ref(false);
const lockModal = ref(false);

const hideModal = () => {
  if (!lockModal.value) {
    showModalAddLines.value = false;
    lockModal.value = false;
  }
};
const lock = (status) => {
  lockModal.value = status;
};

const titleDialogConfirm = computed(() => {
  const text = {
    es: "¿Deseas eliminar la lineaqweq?",
    en: "Do you wish to eliminate the line?",
  };
  return text[globalStore.lang] || text["es"];
});

const descriptionDialogConfirm = computed(() => {
  const text = {
    es: "Al hacer clic en el botón 'Eliminar', se borrará permanentemente la linea. Esta acción no podrá ser revertida.",
    en: "By clicking the “Delete” button, the line will be permanently deleted. This action cannot be reversed.",
  };
  return text[globalStore.lang] || text["es"];
});
const textConfirm = computed(() => {
  const text = {
    es: "Eliminar",
    en: "Delete",
  };
  return text[globalStore.lang] || text["es"];
});

const OpenModalDocument = () => {
  // Obtiene todas las líneas donde `select` es `true`
  const lineasSeleccionadas = outcomesStore.lines.filter((item) => item.select);
  console.log("Que Envie?", lineasSeleccionadas);
  $bus.$emit("openModalDocument", lineasSeleccionadas);
};

const deleteItems = async () => {
  const itemToDelete = outcomesStore.lines.find((item) => item.select);

  const outcome = itemToDelete ? itemToDelete.outcome : null;

  const itemsToDelete = outcomesStore.lines
    .filter((item) => item.select)
    .map((item) => ({
      _id: item._id,
      referenceLine: item.referenceLine,
      income: { ...item.income },
    }));

  const Body = {
    outcome: outcome,
    outcomeLines: itemsToDelete,
  };
  console.log("Items to delete:", Body);
  const resp = await outcomesStore.deleteLineOutcomeMany(Body);
  console.log("respuesta:", resp);
  if (resp.success) {
    itemsToDelete.forEach((item) => {
      const index = outcomesStore.lines.findIndex(
        (line) => line._id === item._id
      );
      if (index !== -1) {
        outcomesStore.lines.splice(index, 1);
      }
    });
    console.log("Borrado, ", itemsToDelete);
    $bus.$emit("Updatelist");
    $bus.$emit("BusCompareTotals");
  }
  // Lógica para eliminar los elementos con los objetos obtenidos
};

const refreshTable = () => {
  console.log("asda");
  $bus.$emit("selectedInd", { pos: 1, loading: true });
  outcomesStore.StatusSave = "ok";
};

const isAnyOutcomeSelected = computed(() => {
  const valor = outcomesStore.lines?.some((line) => line.select) || false;
  console.log("Buton compra interna", valor);
  return valor;
});

const ModalPayEnabledOutcome = computed(() => {
  let outcome = outcomesStore.outcome_active;
  if (outcome.payBy == "Document") return { isValid: false, error: { code: 'OUTCOME_NOT_FOUND', message: "Error: Esta compra esta siendo pagada por documentos, no puede ser pagada directamente." } };
  if (outcome.numbers.paid.number >= outcome.numbers.total.number) return { isValid: false, error: { code: 'OUTCOME_NOT_FOUND', message: "Error: no se encontró la compra activa. Intente nuevamente." } };
  return { isValid: true, error: null }; // Si todo está bien
});

const searchLines = (e) => {
  const search = e.target.value.trim().toLowerCase();
  if(search === "") {
    // Lista complete
  } else {
    // aplicar filtro
  }

};

</script>

<template>
  <div class="outcomes">
    <div class="flex outcomes__actions">
      <div class="flex">
        <u-input
          icon="search"
          revers
          v-model="search"
          style="width: 300px;"
          :placeholder="labels.inputs.search.placeholder[globalStore.lang]"
        />
        <u-button
          icon="filter"
          :text="labels.buttons.filter[globalStore.lang]"
          type="outlined"
          :revers="true"
          color="--bg-neutral-500"
          colorHover="--bg-neutral-600"
          colorActive="--bg-neutral-700"
          :disabled="true"
        />
      </div>

      <div v-if="outcomesStore.StatusSave == 'Error'" class="alerta_Container">
        <span class="alerta_spam">
          Se detecto Error de Sincronizacion Porfavor actualice
        </span>
        <u-button-icon
          type="outlined"
          size="m"
          icon="emoji"
          color="--bg-neutral-500"
          colorHover="--bg-neutral-600"
          colorActive="--bg-neutral-700"
          @click="refreshTable()"
        />
      </div>

      <div class="flex">
        <u-button
          type="outlined"
          icon="pay"
          text="Pagar"
          @action-btn="$bus.$emit('OpenModalPayOutcome')"
          title="Haz clic para realizar el pago a documentos seleccionados"
          :disabled="!ModalPayEnabledOutcome.isValid"
        />
        <u-button-icon
          :disabled="!isAnyOutcomeSelected"
          type="outlined"
          size="m"
          icon="delete"
          color="--bg-danger-500"
          colorHover="--bg-danger-600"
          colorActive="--bg-danger-700"
          @click="isAnyOutcomeSelected && (modalDelete = true)"
        />
        <u-button
          :disabled="!isAnyOutcomeSelected"
          icon="new"
          :text="labels.buttons.addDoc[globalStore.lang]"
          type="outlined"
          @click="isAnyOutcomeSelected && OpenModalDocument()"
        />
        <u-button
          icon="new"
          :text="labels.buttons.addLines[globalStore.lang]"
          @click="initCloseModal()"
        />
      </div>
    </div>
    <div class="scroll">
      <!--  -->
      <TableMiniGrid
        :showTotals="true"
        propertyStoreTotals="outcome_active"
        propertyStoreLines="lines"
        page="outcomes"
      />
    </div>
  </div>
  <u-dialog
    :showModal="showModalAddLines"
    :lockModal="lockModal"
    @closeModal="hideModal"
    width="800px"
    height="90vh"
    :persistent="true"
  >
    <DialogCreateOc page="outcomes-2" />
  </u-dialog>

  <dialog-confirm
    width="600px"
    height="auto"
    :title="titleDialogConfirm"
    :description="descriptionDialogConfirm"
    :showInput="true"
    :confirmationText="textConfirm"
    :actionModal="deleteItems"
    :showModal="modalDelete"
    @closeModal="modalDelete = false"
  />
</template>

<style scoped>
.alerta_Container {
  display: inline-flex;
  gap: 10px;
  align-items: center;
}
.alerta_spam {
  color: var(--neutral-text-body);
  font-size: 14px;
  font-weight: 600;
  line-height: 18px;
}
.scroll {
  width: 100%;
  height: 100%;
}

.scroll::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

.scroll::-webkit-scrollbar-thumb {
  border-radius: 3px;
  background-color: var(--bg-neutral-500);
}

.scroll::-webkit-scrollbar-track {
  background: var(--bg-neutral-0);
  border-radius: 8px;
}
.outcomes {
  display: contents;
  flex-direction: column;
  align-items: stretch;
  gap: 20px;
  height: 100%;
  width: 100%;
  flex-grow: 1;
  flex-shrink: 1;
}
.outcomes__actions {
  justify-content: space-between;
  width: 100%;
}

/* Generic */
.flex {
  display: flex;
  align-items: center;
  gap: 16px;
}

.status-save {
  animation: fadeOut 3s forwards;
}

.status-error {
  color: red;
  padding: 10px;
  border-radius: 5px;
}

@keyframes fadeOut {
  0% {
    opacity: 1;
  }
  50% {
    opacity: 1;
  }
  100% {
    opacity: 0;
  }
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.5s;
}
.fade-enter,
.fade-leave-to {
  opacity: 0;
}
</style>
