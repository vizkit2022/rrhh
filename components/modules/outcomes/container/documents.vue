<script setup>
import useOutcomesStore from "@/stores/outcomes";
import useGlobalStore from "@/stores/global";
import { ref, onMounted, computed, defineEmits } from "vue";
import configTable from "@/utils/configTables/outcomes.json";

// Stores
const outcomesStore = useOutcomesStore();
const globalStore = useGlobalStore();

// Constants
const color = "--neutral-text-caption";
const deleteColor = "--danger-text-subtle";
const deleteColorHover = "--danger-text-darker";
const { params } = useRoute();
const idOC = params && params.id ? params.id : null;
const { t } = useI18n();
const module = "modules.outcomes.pages.oc.sections.documents";

// Vars
const search = ref("");
const loadingTable = ref(false);
const documentingModal = ref(false);
const showModalViewDocument = ref(false);
const lockModal = ref(false);
const dimensions = ref({
  width: "auto",
  height: "auto",
});
const modalDeleteDocument = ref(false);
const modalVoidDocument = ref(false);

// Emits
const emit = defineEmits(["updateMetrics"]);

// Mounted
onMounted(async () => {
  await getDocumentsByOutcomes();
});

// Functions
const getDocumentsByOutcomes = async () => {
  globalStore.loading = true;
  const filters = { outcomeId: idOC };
  loadingTable.value = true;
  await outcomesStore.get_outcomes(idOC);
  await outcomesStore.getDocument(filters);
  loadingTable.value = false;
  const total = outcomesStore?.outcome?.numbers?.documented?.value ?? "";
  emit("updateMetrics", { total, section: "documents" });
  globalStore.loading = false;
};
const hideModal = () => {
  if (!lockModal.value) {
    documentingModal.value = false;
    showModalViewDocument.value = false;
    modalDeleteDocument.value = false;
    modalVoidDocument.value = false;

    dimensions.value = {
      width: "auto",
      height: "auto",
    };

    lockModal.value = false;
  }
};
const updateDimensions = (newDimensions) => {
  dimensions.value = newDimensions;
};
const documenting = () => {
  dimensions.value = {
    width: "780px",
    height: "auto",
  };
  documentingModal.value = true;
};
const openModalViewDocument = async (id) => {
  globalStore.loading = true;
  await outcomesStore.getDocumentWithLines(id);
  dimensions.value = {
    width: "780px",
    height: "100%",
  };
  showModalViewDocument.value = true;
  globalStore.loading = false;
};
const actionTable = (obj) => {
  const { emit, data, pos } = obj;
  const emits = {
    showModalDocument: () => {
      openModalViewDocument(data._id);
    },
  };
  emits[emit]();
};
const deleteSelectedDocument = async () => {
  try {
    globalStore.loading = true;

    // Extraer los IDs de los documentos seleccionados
    const docsIds = selectDocs.value.map((doc) => doc._id);
    const response = await outcomesStore.deleteManyDocuments(docsIds);

    if (response.success) {
      await getDocumentsByOutcomes();
      await outcomesStore.get_outcomes(idOC);
      const total = outcomesStore?.outcome?.numbers?.documented?.value ?? "";
      emit("updateMetrics", { total, section: "documents" });
    }

  } catch (err) {
    console.error("Error al eliminar los documentos seleccionados:", err);
  } finally {
    modalDeleteDocument.value = false;
    globalStore.loading = false;
  }
};
const voidSelectedDocument = async () => {
  try {
    globalStore.loading = true;

    // Extraer los IDs de los documentos seleccionados
    const docsIds = selectDocs.value.map((doc) => doc._id);
    const response = await outcomesStore.voidManyDocuments(docsIds);

    if (response.success) {
      await getDocumentsByOutcomes();
      await outcomesStore.get_outcomes(idOC);
      const total = outcomesStore?.outcome?.numbers?.documented?.value ?? "";
      emit("updateMetrics", { total, section: "documents" });
    }

  } catch (err) {
    console.error("Error al anular los documentos seleccionados:", err);
  } finally {
    modalVoidDocument.value = false;
    globalStore.loading = false;
  }
};
const getNameStatus = (st) => {
  const status = {
    voided: {
      en: "Void",
      es: "Anulado"
    },
    active: {
      en: "Assigned",
      es: "Asignado"
    }
  };
  return status?.[st]?.[globalStore.lang] || '-'
}

// Computed
const selectDocs = computed(() => filteredDocuments.value.filter(l => l.selected));
const noDocs = computed(() => filteredDocuments.value.length === 0);
const filteredDocuments = computed(() => {
  const searchTerm = search.value?.toLowerCase().trim();
  const documents = outcomesStore?.documents_list || [];

  if (!searchTerm) return documents;

  return documents.filter((doc) => {
    const reference = doc.reference?.toLowerCase() || "";
    const documentNumber = doc.documentNumber?.toLowerCase() || "";
    const supplierName = doc.supplier?.data?.legalName?.toLowerCase() || "";
    const docTypeName = doc.documentType?.name?.toLowerCase() || "";
    const docTypeCode = doc.documentType?.documentType?.toLowerCase() || "";

    return (
      reference.includes(searchTerm) ||
      documentNumber.includes(searchTerm) ||
      supplierName.includes(searchTerm) ||
      docTypeName.includes(searchTerm) ||
      docTypeCode.includes(searchTerm)
    );
  });
});

const noActions = computed(() => !["closed","voided"].includes(outcomesStore.outcome.status));

</script>

<template>
  <div class="documents">
    <div class="documents__header">
      <u-input
        v-model="search"
        size="s"
        :placeholder="t(module + '.inputs.search.placeholder')"
        icon="search"
        :revers="true"
      />
      <div></div>
      <u-button-icon
        icon="delete"
        type="outlined"
        :color="deleteColor"
        :color-hover="deleteColorHover"
        :color-active="deleteColorHover"
        size="s"
        :disabled="outcomesStore.outcome.status === 'voided' || selectDocs.length === 0"
        @click="modalDeleteDocument = true"
        v-if="noActions"
      />
      <u-button
        icon="close"
        :text="t(module + '.buttons.void')"
        :color="color"
        :color-hover="deleteColorHover"
        :color-active="deleteColorHover"
        type="outlined"
        size="s"
        :disabled="outcomesStore.outcome.status === 'voided' || selectDocs.length === 0"
        @click="modalVoidDocument = true"
        v-if="noActions"
      />
      <u-button
        icon="pay"
        :text="t(module + '.buttons.pay')"
        :color="color"
        type="outlined"
        size="s"
        :disabled="outcomesStore.outcome.status === 'voided' ||  noDocs"
        v-if="false"
      />
      <u-button
        icon="pay"
        :text="t(module + '.buttons.document')"
        type="outlined"
        size="s"
        :disabled="outcomesStore.outcome.status === 'voided'"
        @click="documenting"
        v-if="noActions"
      />
    </div>
    <TableBasic
      :configTable="configTable.documentsByPurchases"
      :content="filteredDocuments"
      @actionTable="actionTable"
      :loading="loadingTable"
    >
      <!-- Etiqueta del documento -->
      <template v-slot:status="item">
        <span :class="`statusDoc ${item?.item?.status}`">{{ getNameStatus(item?.item?.status) }}</span>
      </template>

      <!-- Tipo de Docuemnto -->
      <template v-slot:docType="item">
        <span class="typeDoc truncateText" :title="item?.item?.documentType?.name">{{ item?.item?.documentType?.code || '-' }}</span>
      </template>
    </TableBasic>
  </div>
  <!-- Documentar -->
  <u-dialog
    :showModal="documentingModal"
    :lockModal="lockModal"
    @closeModal="hideModal"
    :width="dimensions.width"
    :height="dimensions.height"
    :persistent="true"
  >
    <DialogDocumenting
      :updatedDocStep1="false"
      @closeModal="hideModal"
      @updateDimensions="updateDimensions"
      @updateTable="getDocumentsByOutcomes()"
      @updateMetrics="(obj) => emit('updateMetrics', obj)"
    />
  </u-dialog>

  <!-- Ver Documento -->
  <u-dialog
    position="right"
    :showModal="showModalViewDocument"
    :lockModal="lockModal"
    @closeModal="hideModal"
    :width="dimensions.width"
    :height="dimensions.height"
    :persistent="false"
  >
    <DialogViewDocument @closeModal="hideModal" />
  </u-dialog>

  <!-- Eliminar Documentos -->
  <dialog-confirm
    width="600px"
    height="auto"
    :title="t(module + '.modals.delete.title.' + (selectDocs.length == 1 ? 'single' : 'plural'))"
    :description="t(module + '.modals.delete.description')"
    :showInput="true"
    :confirmationText="t(module + '.modals.delete.confirmationText')"
    :customTextBtnDelete="t(module + '.modals.delete.confirmationText')"
    :actionModal="deleteSelectedDocument"
    :showModal="modalDeleteDocument"
    @closeModal="modalDeleteDocument = false"
  />

  <!-- Anular Documentos -->
  <dialog-cancel
    width="600px"
    height="auto"
    :title="t(module + '.modals.void.title.' + (selectDocs.length == 1 ? 'single' : 'plural'))"
    :description="t(module + '.modals.void.description')"
    :showInput="true"
    :confirmationText="t(module + '.modals.void.confirmationText')"
    :customTextBtnDelete="t(module + '.modals.void.confirmationText')"
    :actionModal="voidSelectedDocument"
    :showModal="modalVoidDocument"
    @closeModal="modalVoidDocument = false"
  />
</template>

<style scoped>
.documents {
  width: 100%;
  display: grid;
  grid-template-rows: 36px 1fr;
  gap: 20px;
}
.documents__header {
  width: 100%;
  display: grid;
  grid-template-columns: 300px 1fr repeat(4, auto);
  gap: 12px;
}
.statusDoc {
  padding: 4px 10px;
  border-radius: 20px;
  font-size: 12px;
  line-height: 12px;
  font-weight: 600;
}
.statusDoc.voided {
  color: var(--danger-text-darker);
  background-color: var(--danger-surface-light);
}
.statusDoc.active {
  color: var(--success-text-darker);
  background-color: var(--success-surface-light);
}
.typeDoc {
  font-size: 14px;
  font-weight: 600;
  color: var(--neutral-text-body);
}
</style>
