<script setup>
import useGlobalStore from "@/stores/global";
import useOutcomesStore from "@/stores/outcomes";
import { ref } from "vue";
import { transformedDate } from "@/utils/helpers";

// Stores
const globalStore = useGlobalStore();
const outcomesStore = useOutcomesStore();

// Constants
const config = {
  header: {
    height: 40
  },
  item: {
    height: 60,
  },
  cols: [
    {
      name: { es: "Nombre", en: "File" },
      flex: "left",
      width: "minmax(150px, 5fr)",
      prop: { text: "name" }, // Mostrar el nombre del archivo
      type: "custom",
      slotName: "fileName", // Aquí se puede agregar un ícono o miniatura del archivo
      emit: {
        name: "openNewLink",
      },
    },
    {
      name: { es: "Tamaño", en: "Size" },
      flex: "left",
      width: "minmax(100px, 1fr)",
      prop: { text: "size" }, // Mostrar tamaño del archivo
      type: "text",
    },
    {
      name: { es: "Fecha", en: "Date" },
      flex: "left",
      width: "minmax(130px, 1fr)",
      show: true,
      prop: { text: "fecha" },
      slotName: "fechaFormatted", // Slot para personalizar la acción de clic en el nombre
      type: "custom",
    },
    {
      name: { es: "", en: "" },
      flex: "left",
      width: "80px",
      show: true,
      prop: { text: "" },
      slotName: "actions",
      type: "custom",
    },
  ],
};
const { t } = useI18n();
const module = "modules.outcomes.pages.oc.sections.documents.modals.document.files";
const fileTypeMap = {
  csv: "CSV",
  doc: "DOC",
  docx: "DOCX",
  gif: "GIF",
  jpg: "JPG",
  pdf: "PDF",
  png: "PNG",
  ppt: "PPT",
  rar: "RAR",
  txt: "TXT",
  xsl: "XSL",
  xlsx: "XLSX",
  zip: "ZIP",
};
const color = "--neutral-text-caption"
const colorHover = "--neutral-text-body"

// Vars
const fileInput = ref(null);

// Functions
const triggerFileInput = () => {
  fileInput.value?.click();
};
const handleFileChange = async (event) => {
  const file = event.target.files[0];
  if (!file) return;

  const maxSizeInBytes = 5 * 1024 * 1024; // 5MB
  const isValidSize = file.size <= maxSizeInBytes;

  if (!isValidSize) {
    toast.error(t(alerts + '.size'));
    event.target.value = null;
    return;
  }

  try {
    outcomesStore.document_active.processing = true;
    globalStore.loading = true;
    const resp = await outcomesStore.uploadDocumentFile(outcomesStore.document_active._id, file);
    if(resp.success) await outcomesStore.getDocumentWithLines(outcomesStore.document_active._id);
  } catch (error) {
    console.error(error);
  } finally {
    globalStore.loading = false;
    event.target.value = null;
    outcomesStore.document_active.processing = false;
  }
};
const getTypeFile = (file) => {
    const extension = fileTypeMap?.[file?.typeFile] || null;
    return extension ? `/img/iconsFile/${extension}.svg` : null;
};
const seeFile = (file) => {
  const { url } = file;
  const link = document.createElement('a');
  link.href = url;
  link.target = '_blank';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
const deleteFile = async (file) => {
try {
    globalStore.loading = true;
    outcomesStore.document_active.processing = true;
    const fileToDelete = {
      fileName: file?.url,
      documentId: outcomesStore?.document_active?._id
    };
    const resp = await outcomesStore.deleteDocumentFile(fileToDelete);
    if(resp.success) await outcomesStore.getDocumentWithLines(outcomesStore.document_active._id)
  } catch (error) {
    console.error(error);
  } finally {
    globalStore.loading = false;
    outcomesStore.document_active.processing = false;
  }
};
const confirmFile = (file) => {
  if(outcomesStore.document_active.status === 'active') {
    outcomesStore.document_active.files.forEach(f => {
      f.confirm = f._id === file._id;
    });
  }
};
</script>

<template>
  <div class="files">
    <div class="file__table">
      <div class="file__table-headerContent">
        <div class="file__table-header">
          <div class="col"><span  v-text="t(module + '.name')"></span></div>
          <div class="col"><span  v-text="t(module + '.size')"></span></div>
          <div class="col"><span  v-text="t(module + '.date')"></span></div>
          <div class="col"><span></span></div>
        </div>
      </div>
      <div class="file__table-item" v-for="file in outcomesStore.document_active.files" :key="file">
        <div class="file__table-info" :style="`transform: translateX(${file.confirm ? '-100%' : '0'});`">
          <div class="col fileName">
            <img v-if="getTypeFile(file)" :src="getTypeFile(file)" alt="image" />
            <u-unknown-file v-else :text="file?.typeFile || '-'" />
            <span class="truncateText textCol" v-text="file.name"></span>
          </div>
          <div class="col"><span v-text="file.size" class="textCol"></span></div>
          <div class="col"><span v-text="transformedDate(file.date)" class="textCol"></span></div>
          <div class="col actions">
            <button @click="seeFile(file)"><span v-text="t(module + '.see')"></span></button>
            <button @click="confirmFile(file)" :disabled="outcomesStore.document_active.status === 'voided'"><span class="u u-close"></span></button>
          </div>
        </div>
        <div class="file__table-confirm" :style="`transform: translateX(${file.confirm ? '-100%' : '0'});`">
          <span class="question" v-text="t(module + '.confirm')"></span>
          <u-button :text="t(module + '.no')" @click="file.confirm = false" size="s" :color="color" :colorHover="colorHover" :colorActive="colorHover"/>
          <u-button :text="t(module + '.yes')" @click="deleteFile(file)" size="s" />
        </div>
      </div>
    </div>
    <label v-if="outcomesStore.document_active.status === 'active'">
      <u-button class="payButton" type="outlined" :text="t(module + '.addFiles')" icon="attach" size="s" @click="triggerFileInput" />   
      <input ref="fileInput" type="file" @change="handleFileChange" style="display: none" />
    </label>
  </div>
</template>

<style scoped>
.files {
  min-width: 620px;
}
.file__table {
  /* border-radius: 20px; */
  overflow: auto;
  max-height: 300px;
  position: relative;
  max-height: calc(100vh - 540px);
}
.file__table::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

.file__table::-webkit-scrollbar-thumb {
  background: var(--neutral-surface-subtle);
  border-radius: 5px;
}

.file__table::-webkit-scrollbar-track {
  background: var(--neutral-surface-light);
  border-radius: 4px;
}
.file__table-headerContent {
  position: sticky;
  top: 0;
  left: 0;
  background: var(--neutral-background-default);
  z-index: 2;
}
.file__table-header {
  border-top: 1px solid var(--neutral-border-subtle);
  border-left: 1px solid var(--neutral-border-subtle);
  border-right: 1px solid var(--neutral-border-subtle);
  border-bottom: 1px solid var(--neutral-border-subtle);
  border-radius: 20px 20px 0 0;
}
.file__table-header, 
.file__table-item {
  margin-right: 2px;
}
.file__table-header, .file__table-info {
  display: grid;
  grid-template-columns: 1fr 120px 140px 90px;
}
.file__table-info {
  flex-shrink: 0;
  width: 100%;
  transition: 0.3s cubic-bezier(0.785, 0.135, 0.15, 0.86);
}
.file__table-header div.col, .file__table-info div.col {
  display: flex;
  align-items: center;
  padding: 0 20px;
  justify-content: flex-start;
}
.file__table-header div.col {
  height: 40px;
  background-color: var(--neutral-surface-softer);
}
.file__table-item {
  border-left: 1px solid var(--neutral-border-subtle);
  border-right: 1px solid var(--neutral-border-subtle);
  border-bottom: 1px solid var(--neutral-border-subtle);
  z-index: 0;
  overflow: hidden;
  display: flex;
  position: relative;
}
.file__table-item:last-child {
  border-radius: 0 0 20px 20px;
}
.file__table-info div.col {
  height: 60px;
}
.file__table-header div.col:nth-child(1) {
  border-radius: 20px 0 0 0;
}
.file__table-header div.col:nth-child(4) {
  border-radius: 0 20px 0 0;
}
.file__table-header div.col span {
  color: var(--neutral-text-caption);
  font-size: 12px;
  font-weight: 600;
  line-height: 12px;
}
.fileName {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 10px;
  width: 320px;
}
.file__table-confirm {
  flex-shrink: 0;
  width: 100%;
  transition: 0.3s cubic-bezier(0.785, 0.135, 0.15, 0.86);
  display: grid;
  grid-template-columns: 1fr auto auto;
  gap: 10px;
  align-items: center;
  padding: 0 20px;
}
.file__table-confirm span.question {
  color: var(--danger-text-default);
  font-weight: 600;
  font-size: 16px;
}
.file__table-confirm button {
  font-size: 12px;
  height: 24px;
  width: 40px;
}





.payButton {
  margin-top: 20px;
  margin-left: auto;
}
.actions {
  display: flex;
  justify-content: space-between !important;
  align-items: center;
}
.actions button {
  height: 20px;
  width: auto;
  display: flex;
  justify-content: center;
  align-items: center;
}
.actions button:disabled {
  cursor: not-allowed;
}
.actions button:disabled span {
  color: var(--neutral-text-disabled);
}
.actions button span, .textCol {
  font-size: 14px;
  line-height: 14px;
  font-weight: 600;
  transition: 0.3s;
  color: var(--neutral-text-body);
}
.actions button:nth-child(1) span {
  color: var(--primary-text-default);
}
.actions button:nth-child(1):hover span {
  color: var(--primary-text-subtle);
}
.actions button:nth-child(2) span {
  font-size: 16px;
  color: var(--neutral-text-caption);
}
.actions button:nth-child(2):not(:disabled):hover span {
  color: var(--neutral-text-body);
}
</style>
