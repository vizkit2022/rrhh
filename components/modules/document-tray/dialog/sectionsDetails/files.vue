<script setup>
import useGlobalStore from "@/stores/global";
import useBankingTransactionsStore from "@/stores/bankingTransactions";
import useDocumentsTrayStore from "@/stores/documentTray";
import { ref } from "vue";
import { transformedDate } from "@/utils/helpers";

// Stores
const globalStore = useGlobalStore();
const bankingTransactionsStore = useBankingTransactionsStore();
const documentsTrayStore = useDocumentsTrayStore();

// Constants
const { t } = useI18n();
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
const color = "--neutral-text-caption";
const colorHover = "--neutral-text-body";
const LABEL_KEY = "modules.outcomes.pages.oc.modals.viewPay";

// Vars
const fileInput = ref(null);

// Functions

//Funciones para cerrar los modals y agregar los archivos
const triggerFileInput = () => {
  fileInput.value?.click();
};
const handleFileChange = async (event) => {
  const selectedFiles = Array.from(event.target.files);
  if (!selectedFiles.length) return;

  const allowedTypes = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "application/pdf",
  ];
  const allowedExtensions = ["jpg", "jpeg", "png", "pdf"];
  const maxSizeInBytes = 5 * 1024 * 1024; // 5MB

  const validFiles = [];

  for (const file of selectedFiles) {
    const fileExtension = file.name.split(".").pop().toLowerCase();

    if (
      !allowedTypes.includes(file.type) ||
      !allowedExtensions.includes(fileExtension)
    ) {
      toast.error(
        t("modules.outcomes.pages.oc.modals.viewPay.alerts.invalidFormat"),
      );
      continue;
    }

    if (file.size > maxSizeInBytes) {
      toast.error(t(alerts + ".size"));
      continue;
    }

    validFiles.push(file);
  }

  if (!validFiles.length) {
    event.target.value = null;
    return;
  }

  try {
    globalStore.loading = true;

    const resp = await documentsTrayStore.uploadDocumentFile(
      documentsTrayStore.detailsDocumentTray._id,
      validFiles, // 👈 array de archivos
    );

    if (resp.success) {
      const resGet = await documentsTrayStore.getDocumentsTray();
      documentsTrayStore.detailsDocumentTray = resGet?.docs?.find(
        (doc) => doc._id === documentsTrayStore.detailsDocumentTray._id,
      );
    }
  } catch (error) {
    console.error(error);
  } finally {
    globalStore.loading = false;
    event.target.value = null;
  }
};

// const handleFileChange = async (event) => {
//   const file = event.target.files[0];
//   if (!file) return;

//   const maxSizeInBytes = 5 * 1024 * 1024; // 5MB
//   const isValidSize = file.size <= maxSizeInBytes;

//   if (!isValidSize) {
//     toast.error(t(alerts + '.size'));
//     event.target.value = null;
//     return;
//   }

//   try {
//     bankingTransactionsStore.dataDetailsPayment.processing = true;
//     globalStore.loading = true;
//     const resp = await bankingTransactionsStore.uploadPaymentFile(bankingTransactionsStore.dataDetailsPayment._id, file);
//     if(resp.success) {
//         await bankingTransactionsStore.getPaymentById(bankingTransactionsStore.dataDetailsPayment._id);
//     }
//   } catch (error) {
//     console.error(error);
//   } finally {
//     globalStore.loading = false;
//     event.target.value = null;
//     bankingTransactionsStore.dataDetailsPayment.processing = false;
//   }
// };
const getTypeFile = (file) => {
  const extension = fileTypeMap?.[file?.typeFile] || null;
  return extension ? `/img/iconsFile/${extension}.svg` : null;
};
const seeFile = (file) => {
  const { url } = file;
  const link = document.createElement("a");
  link.href = url;
  link.target = "_blank";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
const deleteFile = async (file) => {
  try {
    globalStore.loading = true;
    const fileToDelete = {
      fileName: file?.url,
      _id: documentsTrayStore.detailsDocumentTray._id,
    };
    // Pedir endpoint para eliminar archivos de un pago por su id
    const resp = await documentsTrayStore.deleteDocumentTrayFile(fileToDelete);
    if (resp.success) {
      const resGet = await documentsTrayStore.getDocumentsTray();
      documentsTrayStore.detailsDocumentTray = resGet?.docs?.find(
        (doc) => doc._id === documentsTrayStore.detailsDocumentTray._id,
      );
    }
  } catch (error) {
    console.error(error);
  } finally {
    globalStore.loading = false;
  }
  // try {
  //   globalStore.loading = true;
  //   bankingTransactionsStore.dataDetailsPayment.processing = true;
  //   const fileToDelete = {
  //     fileName: file?.url,
  //     payment: bankingTransactionsStore.dataDetailsPayment._id,
  //   };
  //   // Pedir endpoint para eliminar archivos de un pago por su id
  //   const resp = await bankingTransactionsStore.deletePaymentFile(fileToDelete);
  //   if (resp.success)
  //     await bankingTransactionsStore.getPaymentById(
  //       bankingTransactionsStore.dataDetailsPayment._id
  //     );
  // } catch (error) {
  //   console.error(error);
  // } finally {
  //   globalStore.loading = false;
  //   bankingTransactionsStore.dataDetailsPayment.processing = false;
  // }
};

const mockFiles = ref([
  {
    _id: "1",
    name: "documento_prueba.pdf",
    typeFile: "pdf",
    size: "2.5 MB",
    date: new Date(),
    url: "#",
    confirm: false,
  },
  {
    _id: "2",
    name: "imagen_ejemplo.png",
    typeFile: "png",
    size: "1.2 MB",
    date: new Date(),
    url: "#",
    confirm: false,
  },
  {
    _id: "3",
    name: "hoja_calculo.xlsx",
    typeFile: "xlsx",
    size: "890 KB",
    date: new Date(),
    url: "#",
    confirm: false,
  },
  {
    _id: "4",
    name: "presentacion.pptx",
    typeFile: "ppt",
    size: "3.8 MB",
    date: new Date(),
    url: "#",
    confirm: false,
  },
  {
    _id: "1",
    name: "documento_prueba.pdf",
    typeFile: "pdf",
    size: "2.5 MB",
    date: new Date(),
    url: "#",
    confirm: false,
  },
  {
    _id: "2",
    name: "imagen_ejemplo.png",
    typeFile: "png",
    size: "1.2 MB",
    date: new Date(),
    url: "#",
    confirm: false,
  },
  {
    _id: "3",
    name: "hoja_calculo.xlsx",
    typeFile: "xlsx",
    size: "890 KB",
    date: new Date(),
    url: "#",
    confirm: false,
  },
  {
    _id: "4",
    name: "presentacion.pptx",
    typeFile: "ppt",
    size: "3.8 MB",
    date: new Date(),
    url: "#",
    confirm: false,
  },
  {
    _id: "1",
    name: "documento_prueba.pdf",
    typeFile: "pdf",
    size: "2.5 MB",
    date: new Date(),
    url: "#",
    confirm: false,
  },
  {
    _id: "2",
    name: "imagen_ejemplo.png",
    typeFile: "png",
    size: "1.2 MB",
    date: new Date(),
    url: "#",
    confirm: false,
  },
  {
    _id: "3",
    name: "hoja_calculo.xlsx",
    typeFile: "xlsx",
    size: "890 KB",
    date: new Date(),
    url: "#",
    confirm: false,
  },
  {
    _id: "4",
    name: "presentacion.pptx",
    typeFile: "ppt",
    size: "3.8 MB",
    date: new Date(),
    url: "#",
    confirm: false,
  },
]);

const confirmFile = (file) => {
  documentsTrayStore.detailsDocumentTray.files.forEach((f) => {
    f.confirm = f._id === file._id;
  });
};
</script>

<template>
  <div class="files">
    <div class="file__table">
      <div class="file__table-headerContent">
        <div class="file__table-header">
          <div class="col">
            <span>{{ t(LABEL_KEY + ".texts.name") }}</span>
          </div>
          <div class="col">
            <span>{{ t(LABEL_KEY + ".texts.size") }}</span>
          </div>
          <div class="col">
            <span>{{ t(LABEL_KEY + ".texts.date") }}</span>
          </div>
          <div class="col"><span></span></div>
        </div>
      </div>
      <div
        class="file__table-item"
        v-for="file in documentsTrayStore?.detailsDocumentTray?.files"
        :key="file"
      >
        <div
          class="file__table-info"
          :style="`transform: translateX(${file.confirm ? '-100%' : '0'});`"
        >
          <div class="col fileName" @click="seeFile(file)">
            <img
              v-if="getTypeFile(file)"
              :src="getTypeFile(file)"
              alt="image"
            />
            <u-unknown-file v-else :text="file?.typeFile || '-'" />
            <span class="truncateText textCol" v-text="file.name"></span>
          </div>
          <div class="col" @click="seeFile(file)">
            <span v-text="file.size" class="textCol"></span>
          </div>
          <div class="col" @click="seeFile(file)">
            <span v-text="transformedDate(file.date)" class="textCol"></span>
          </div>
          <div class="col actions">
            <u-button-icon
              icon="delete"
              type="text"
              color="--danger-text-default"
              colorHover="--danger-text-darker"
              colorActive="--danger-text-subtle"
              @click="confirmFile(file)"
              size="s"
            />
            <!-- <button @click="confirmFile(file)"><span class="u u-delete" style="color: var(--danger-text-default);"></span></button> -->
          </div>
        </div>
        <div
          class="file__table-confirm"
          :style="`transform: translateX(${file.confirm ? '-100%' : '0'});`"
        >
          <span class="question">{{ t(LABEL_KEY + ".texts.confirm") }}</span>
          <u-button
            text="Cancelar"
            type="outlined"
            @click="file.confirm = false"
            size="s"
            :color="color"
            :colorHover="colorHover"
            :colorActive="colorHover"
          />
          <u-button
            text="Eliminar"
            @click="deleteFile(file)"
            color="--danger-text-default"
            colorHover="--danger-text-subtle"
            colorActive="--danger-text-subtle"
          />
        </div>
      </div>
    </div>
    <label>
      <u-button
        class="payButton"
        type="outlined"
        :text="t(LABEL_KEY + '.texts.addFiles')"
        icon="attach"
        @click="triggerFileInput"
      />
      <input
        ref="fileInput"
        type="file"
        multiple
        accept=".jpg,.jpeg,.png,.pdf,image/jpeg,image/png,application/pdf"
        @change="handleFileChange"
        style="display: none"
      />
    </label>
  </div>
</template>

<style scoped>
.files {
  min-width: 620px;
  max-height: calc(100vh - 581px);
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
.file__table-header,
.file__table-info {
  display: grid;
  grid-template-columns: 1fr 120px 140px 70px;
}

.file__table-info {
  flex-shrink: 0;
  width: 100%;
  transition: 0.3s cubic-bezier(0.785, 0.135, 0.15, 0.86);
}

.file__table-info:hover {
  background-color: var(--primary-surface-shadow-8a);
  cursor: pointer;
}

.file__table-header div.col,
.file__table-info div.col {
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
  width: 60px;
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
.actions button span,
.textCol {
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
