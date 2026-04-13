<script setup>
import { ref, computed, onMounted, onUnmounted } from "vue";
import useSalesStore from "@/stores/sales";
import useGlobalStore from "@/stores/global";
import { transformedDate, capitalizeName } from "@/utils/helpers";
import { useI18n } from "vue-i18n";

//STORE
const salesStore = useSalesStore();
const globalStore = useGlobalStore();

// I18N
const { t } = useI18n();
const module = "modules.sales.sale.tabs.tab5.information.groups[1]";

// CONSTANT

const showModal = ref(false);
const showModalEdit = ref(false);

const idDocRef = ref("");

// EMIT
const emit = defineEmits(["reloadData"]);

// Estado para controlar cuál "more" está abierto
const activeMore = ref(null);

const toggleMore = (id) => {
  activeMore.value = activeMore.value === id ? null : id;
};

const filesDocRef = computed(
  () => salesStore?.sale?.documentInformation?.relatedDocuments || [],
);

const resetFormDocReference = () => {
  salesStore.formDocInvoice.formRegister.documentReferences = [];
  salesStore.formDocInvoice.formRegister.formDataDocReference = {
    typeDocument: { id: "", name: "", allData: {} },
    numberDocument: "",
    dateDocument: new Date().toISOString().slice(0, 10),
    amountDocument: {
      total: {
        value: "0",
        lastValue: "0",
        number: 0,
        lastNumber: 0,
      },
    },
    fileDocument: null,
  };
};

const showDocReference = (item) => {
  if (!item?.files || item.files.length === 0) return;

  const file = item.files[0];

  // Abre el archivo en una nueva pestaña
  window.open(file.url, "_blank", "noopener,noreferrer");
};

// ... (mantengo tus funciones editDocReference, deleteDocReference, etc) ...
const editDocReference = async (item) => {
  globalStore.loading = true;
  let fileDocument = null;

  if (item?.files && item.files.length > 0) {
    const firstFile = item.files[0];

    try {
      const response = await fetch(firstFile.url);
      const blob = await response.blob();
      const mimeTypes = {
        png: "image/png",
        jpg: "image/jpeg",
        jpeg: "image/jpeg",
        pdf: "application/pdf",
      };
      const mimeType =
        mimeTypes[firstFile.typeFile.toLowerCase()] ||
        "application/octet-stream";
      fileDocument = new File([blob], firstFile.name, { type: mimeType });
    } catch (error) {
      console.error("Error al cargar el archivo:", error);
    }
  }

  const formEditDocRef = {
    typeDocument: {
      id: item?.salesDocumentType?._id,
      name: item?.salesDocumentType?.name,
      allData: item?.salesDocumentType,
    },
    numberDocument: item?.number,
    dateDocument: new Date(item?.date).toISOString().slice(0, 10),
    amountDocument: {
      total: item?.amount,
    },
    fileDocument: fileDocument,
  };

  idDocRef.value = item?._id;
  salesStore.formDocInvoice.formRegister.formDataDocReference = formEditDocRef;

  showModalEdit.value = true;
  globalStore.loading = false;
};

const deleteDocReference = async (item) => {
  globalStore.loading = true;
  const idDocRefLocal = item._id;
  await salesStore.deleteDocReferenceSalesDocument(idDocRefLocal);
  emit("reloadData");
  globalStore.loading = false;
};

const hidenModal = () => {
  resetFormDocReference();
  showModal.value = false;
  showModalEdit.value = false;
};

const handleEsc = (event) => {
  if (event.key === "Escape") {
    hidenModal();
  }
};

onMounted(() => {
  document.addEventListener("keydown", handleEsc);
});

onUnmounted(() => {
  document.removeEventListener("keydown", handleEsc);
});
</script>

<template>
  <div class="container_documentsRef">
    <div class="documentsRef_left">
      <div
        class="container_cardDocumentsRef"
        v-for="item in filesDocRef"
        :key="item._id"
      >
        <div class="left_cardDocumentsRef">
          <span class="truncateText body-m-sb color_span">{{
            item?.salesDocumentType?.name
          }}</span>
          <span class="truncateText body-s-r color_span"
            ><span
              class="u u-hashtag"
              style="color: var(--primary-text-default)"
            ></span>
            N° {{ item?.number }}</span
          >
          <span class="truncateText body-s-r color_span"
            ><span
              class="u u-calendar"
              style="color: var(--primary-text-default)"
            ></span>
            {{ transformedDate(item?.date) }}</span
          >
        </div>
        <div class="right_cardDocumentsRef">
          <div
            class="actions-wrapper"
            :class="{ open: activeMore === item._id }"
          >
            <div
              class="actions-buttons"
              :class="{ show: activeMore === item._id }"
            >
              <u-button-icon
                icon="download"
                type="text"
                color="--neutral-text-caption"
                @click="showDocReference(item)"
              />
              <u-button-icon
                icon="edit"
                type="text"
                color="--neutral-text-caption"
                @click="editDocReference(item)"
              />
              <u-button-icon
                icon="delete"
                type="text"
                color="--danger-text-default"
                color-hover="--danger-text-darker"
                color-active="--danger-text-subtle"
                @click="deleteDocReference(item)"
              />
            </div>

            <u-button-icon
              icon="more"
              type="text"
              color="--neutral-text-caption"
              class="more-btn"
              @click.stop="toggleMore(item._id)"
              :aria-expanded="activeMore === item._id"
            />
          </div>
        </div>
      </div>
    </div>

    <div class="documentsRef_right">
      <u-button
        :text="t(module + '.buttons.addDocument')"
        size="s"
        type="outlined"
        icon="file-text"
        :disabled="false"
        @click="showModal = true"
      />
    </div>
  </div>

  <u-dialog
    :showModal="showModal"
    @closeModal="hidenModal"
    width="auto"
    height="auto"
    :persistent="true"
  >
    <SalesContainerComponentsDocumentsInfoDialogUploadDocRef
      @closeModal="hidenModal"
      @reloadData="emit('reloadData')"
    />
  </u-dialog>

  <u-dialog
    :showModal="showModalEdit"
    @closeModal="hidenModal"
    width="auto"
    height="auto"
    :persistent="true"
  >
    <SalesContainerComponentsDocumentsInfoDialogEditDocRef
      :idDocRef="idDocRef"
      @closeModal="hidenModal"
      @reloadData="emit('reloadData')"
    />
  </u-dialog>
</template>

<style scoped>
.color_span {
  color: var(--neutral-text-body);
}

.container_documentsRef {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 16px;
  padding: 12px 24px;
  align-items: center;
  height: 106px;
  width: 100%;
}

.documentsRef_left {
  display: flex;
  flex-wrap: nowrap;
  overflow-x: auto;
  gap: 16px;
  padding-bottom: 4px;
}

.documentsRef_left::-webkit-scrollbar {
  height: 4px;
  background: var(--neutral-surface-softer);
  border-radius: 20px;
}
.documentsRef_left::-webkit-scrollbar-thumb {
  background-color: var(--neutral-surface-harder);
  border-radius: 5px;
}

.container_cardDocumentsRef {
  display: flex;
  gap: 8px;
  align-items: center;
  height: 82px;
  width: 320px;
  min-width: 320px;
  max-width: 320px;
  border-radius: 16px;
  border: 1px solid var(--neutral-border-light);
}

.left_cardDocumentsRef {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-width: 0;
  gap: 8px;
  padding-left: 16px;
  color: rgb(254, 254, 255);
  transition: padding-left 0.25s ease;
}

.container_cardDocumentsRef:has(.actions-wrapper.open) .left_cardDocumentsRef {
  padding-left: 15.8px;
}

.right_cardDocumentsRef {
  display: flex;
  gap: 4px;
  padding-right: 16px;
  flex-shrink: 0;
  overflow: hidden;
}

.actions-wrapper {
  display: flex;
  align-items: center;
  position: relative;
  width: fit-content;
  overflow: hidden;
}

.actions-buttons {
  display: flex;
  gap: 4px;
  margin-right: 4px;
  max-width: 0;
  opacity: 0;
  pointer-events: none;
  transition: all 0.45s ease;
  overflow: hidden;
  white-space: nowrap;
}

.actions-wrapper.open .actions-buttons,
.actions-buttons.show {
  opacity: 1;
  max-width: 150px;
  pointer-events: auto;
}

.documentsRef_right {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 100%;
}
</style>
