<script setup>
import useOutcomesStore from "@/stores/outcomes";
import useSalesStore from "@/stores/sales";
import useGlobalStore from "@/stores/global";
import { computed, ref } from "vue";
import { transformedDate, capitalizeName } from "@/utils/helpers";
import { toast } from "vue3-toastify";

// Stores
const outcomesStore = useOutcomesStore();
const salesStore = useSalesStore();
const globalStore = useGlobalStore();

// Emits
const emit = defineEmits(["reloadData"]);

// Constants
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
const { t } = useI18n();
const module = "global.text";
const alerts = "modules.outcomes.pages.oc.sections.information.alerts";
const { params } = useRoute();
const idOC = params && params.id ? params.id : null;
const idSaleDoc = params && params.id ? params.id : null;

// Vars
const fileInput = ref(null);

// Computed
const files = computed(
  () => salesStore?.sale?.documentInformation?.files || [],
);

// Functions
const getCreator = (file, fullData = true) => {
  const creator = {
    name: capitalizeName(file?.createdBy?.data?.legalName || "-"),
    src: file?.createdBy?.imgUrl,
  };
  return fullData ? creator : creator.name;
};
const getTypeFile = (file) => {
  const extension = fileTypeMap?.[file?.typeFile] || null;
  return extension ? `/img/iconsFile/${extension}.svg` : null;
};
const triggerFileInput = () => {
  fileInput.value?.click();
};
const handleFileChange = async (event) => {
  const file = event.target.files[0];
  if (!file) return;

  // Validar tamaño
  const maxSizeInBytes = 5 * 1024 * 1024; // 5MB
  const isValidSize = file.size <= maxSizeInBytes;

  if (!isValidSize) {
    toast.error(t(alerts + ".size"));
    event.target.value = null;
    return;
  }

  // Solo subir si el documento no está anulado
  if (salesStore.sale.salesDoc.status !== "voided") {
    // Crear FormData para enviar el archivo
    const formData = new FormData();
    formData.append("File", file);

    const queryParams = {
      salesDocumentId: idSaleDoc,
    };

    try {
      globalStore.loading = true;
      const resp = await salesStore.uploadAdditionalFiles(
        formData,
        queryParams,
      );
      if (resp.success) {
        emit("reloadData");
        // Recargar los archivos
        // await salesStore.getSaleDocumentDetails(idSaleDoc);
      }
    } catch (error) {
      console.error(error);
    } finally {
      globalStore.loading = false;
      event.target.value = null;
    }
  } else {
    event.target.value = null;
  }
};
const deleteFile = async (file) => {
  if (salesStore.sale.salesDoc.status !== "voided") {
    try {
      globalStore.loading = true;
      const fileToDelete = {
        fileId: file?._id,
        salesDocumentId: salesStore?.sale?.salesDoc?._id,
      };
      const resp = await salesStore.deleteAdditionalFiles(fileToDelete);
      if (resp.success) emit("reloadData");
      //       const resp = await outcomesStore.deleteOutcomeFile(fileToDelete);
      // if (resp.success) await outcomesStore.get_outcomes(idOC);
    } catch (error) {
      console.error(error);
    } finally {
      globalStore.loading = false;
    }
  }
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
</script>

<template>
  <div class="files">
    <div class="files__list">
      <div class="files_item" v-for="file in files" :key="file._id">
        <div class="files_item-sup">
          <span class="body-xs-r" v-text="transformedDate(file.date)"></span>
          <button
            @click="deleteFile(file)"
            :disabled="salesStore.sale.salesDoc.status === 'voided'"
          >
            <span class="u u-cancel"></span>
          </button>
        </div>
        <div class="files_item-inf">
          <img v-if="getTypeFile(file)" :src="getTypeFile(file)" alt="image" />
          <u-unknown-file v-else :text="file.typeFile" />
          <div class="files_item-text">
            <span class="name truncateText" v-text="file.name"></span>
            <div class="creator">
              <span v-text="t(module + '.uploadedBy')"></span>
              <u-avatar :size="16" :user="getCreator(file)" />
              <span
                class="truncateText"
                v-text="getCreator(file, false)"
              ></span>
            </div>
          </div>
          <u-button
            :text="t(module + '.see')"
            type="text"
            size="s"
            style="scale: 0.8"
            @click="seeFile(file)"
          />
        </div>
      </div>
    </div>
    <div class="files__add">
      <u-button
        type="outlined"
        :text="t(module + '.attachFile')"
        icon="attach"
        size="s"
        @click="triggerFileInput"
        :disabled="salesStore?.sale?.salesDoc?.status === 'voided'"
      />
      <input
        ref="fileInput"
        type="file"
        @change="handleFileChange"
        style="display: none"
      />
    </div>
  </div>
</template>

<style scoped>
.files {
  height: 105px;
  width: 100%;
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 16px;
  align-items: center;
}
.files__list {
  height: 105px;
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 0 5px;
  overflow-x: auto;
  transition: 0.3s;
  scrollbar-gutter: stable;
}
.files__list::-webkit-scrollbar {
  width: 4px;
  height: 4px;
}
.files__list::-webkit-scrollbar-thumb {
  border-radius: 5px;
  background-color: var(--neutral-surface-harder);
}
.files__list::-webkit-scrollbar-track {
  background: var(--neutral-surface-softer);
  border-radius: 8px;
}
.files_item {
  width: 300px;
  height: 81px;
  flex-shrink: 0;
  background-color: var(--neutral-background-default);
  padding: 8px;
  box-sizing: border-box;
  display: grid;
  grid-template-rows: auto 1fr;
  gap: 4px;
  transition: 0.3s;
  border-radius: 8px;
  box-shadow: var(--elevation-xs);
}
.files_item-sup {
  width: 100%;
  display: grid;
  grid-template-columns: 1fr auto;
  align-items: center;
  gap: 16px;
}
.files_item-sup span {
  color: var(--neutral-text-caption);
}
.files_item-sup button {
  width: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.files_item-sup button span {
  font-size: 18px;
  line-height: 18px;
  transition: 0.3s;
}
.files_item-sup button:hover span {
  color: var(--neutral-text-body);
}
.files_item-inf {
  display: grid;
  grid-template-columns: auto 1fr auto;
  gap: 10px;
  align-items: center;
}
.files_item-text {
  width: 190px;
  display: grid;
  grid-template-rows: auto auto;
  gap: 5px;
}
.files_item-text .name {
  font-weight: 600;
  font-size: 14px;
  line-height: 18px;
  letter-spacing: 0%;
  vertical-align: middle;
  color: var(--neutral-text-body);
}
.files_item-text .creator {
  display: grid;
  grid-template-columns: auto 16px 1fr;
  gap: 10px;
  align-items: center;
}
.files_item-text .creator span {
  font-weight: 600;
  font-size: 12px;
  line-height: 16px;
  letter-spacing: 0%;
  vertical-align: middle;
  color: var(--neutral-text-caption);
}
.files__add {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}
</style>
