<script setup>
import useOutcomesStore from "@/stores/outcomes";
import useGlobalStore from "@/stores/global";
import { computed, ref } from "vue";
import { transformedDate, capitalizeName } from "@/utils/helpers";
import { toast } from "vue3-toastify";

// Stores
const outcomesStore = useOutcomesStore();
const globalStore = useGlobalStore();

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

// Vars
const fileInput = ref(null);

// Computed
const files = computed(() => outcomesStore?.outcome?.files || []);

// Functions
const getCreator = (file, fullData = true) => {
    const creator = {
        name: capitalizeName(file?.creator?.data?.legalName || "-"),
        src: file?.creator?.imgUrl
    }
    return fullData ? creator : creator.name
}
const getTypeFile = (file) => {
    const extension = fileTypeMap?.[file?.typeFile] || null;
    return extension ? `/img/iconsFile/${extension}.svg` : null;
}
const triggerFileInput = () => {
  fileInput.value?.click();
};
const handleFileChange = async (event) => {
  if(outcomesStore.outcome.status !== 'voided') {
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
      globalStore.loading = true;
      const resp = await outcomesStore.uploadOutcomeFile(outcomesStore.outcome._id, file);
      if(resp.success) await outcomesStore.get_outcomes(idOC);
    } catch (error) {
      console.error(error);
    } finally {
      globalStore.loading = false;
      event.target.value = null;
    }
  }
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
    globalStore.loading = true;
    const resp = await outcomesStore.uploadOutcomeFile(outcomesStore.outcome._id, file);
    if(resp.success) await outcomesStore.get_outcomes(idOC);
  } catch (error) {
    console.error(error);
  } finally {
    globalStore.loading = false;
    event.target.value = null;
  }
};
const deleteFile = async (file) => {
  if(outcomesStore.outcome.status !== 'voided') {
    try {
        globalStore.loading = true;
        const fileToDelete = {
            fileName: file?.url,
            outcome: outcomesStore?.outcome?._id
        };
        const resp = await outcomesStore.deleteOutcomeFile(fileToDelete);
        if(resp.success) await outcomesStore.get_outcomes(idOC);
    } catch (error) {
        console.error(error);
    } finally {
        globalStore.loading = false;
    }
  }
}
const seeFile = (file) => {
  const { url } = file;
  const link = document.createElement('a');
  link.href = url;
  link.target = '_blank';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

const noActions = computed(() => !["closed","voided"].includes(outcomesStore.outcome.status));

</script>

<template>
  <div class="files">
    <div class="files__list">
      <div class="files_item" v-for="file in files" :key="file._id">
        <div class="files_item-sup">
          <span class="body-xs-r" v-text="transformedDate(file.date)"></span>
          <button @click="deleteFile(file)" v-if="noActions" :disabled="outcomesStore.outcome.status === 'voided'"><span class="u u-cancel"></span></button>
        </div>
        <div class="files_item-inf">
          <img v-if="getTypeFile(file)" :src="getTypeFile(file)" alt="image" />
          <u-unknown-file v-else :text="file.typeFile" />
          <div class="files_item-text">
            <span class="name truncateText" v-text="file.name"></span>
            <div class="creator">
              <span v-text="t(module + '.uploadedBy')"></span>
              <u-avatar :size="16" :user="getCreator(file)" />
              <span class="truncateText" v-text="getCreator(file,false)"></span>
            </div>
          </div>
          <u-button :text="t(module + '.see')" type="text" size="s" style="scale: 0.8" @click="seeFile(file)" />
        </div>
      </div>
    </div>
    <label>
        <u-button type="outlined" v-if="noActions" :text="t(module + '.attachFile')" icon="attach" size="s" @click="triggerFileInput" :disabled="outcomesStore.outcome.status === 'voided'" />   
        <input ref="fileInput" type="file" @change="handleFileChange" style="display: none" />
    </label>
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
  width: 8px;
  height: 8px;
}
.files__list::-webkit-scrollbar-thumb {
  border-radius: 3px;
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
</style>
