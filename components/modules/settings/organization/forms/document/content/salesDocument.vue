<script setup>
import { ref, computed, onMounted } from "vue";
import { salesDocument } from "@/utils/labels/settings.json";
import configTable from "@/utils/configTables/documentTypeConfig.json";
import useGlobalStore from "@/stores/global";
import useOrganizationStore from "@/stores/organization";

// STORE
const globalStore = useGlobalStore();
const organizationStore = useOrganizationStore();

// CONSTANTS
const search = ref("");
const edit = ref(false);
const currentDoc = ref({});

const createTypeSalesDocument = ref(false);
const showTaxes = ref(false);
const lockModal = ref(false);

// COMPUTED
const lang = computed(() => globalStore.lang);
const title = computed(() => salesDocument.title);
const buttons = computed(() => salesDocument.buttons);

const currentTypesDocument = ref([]);

const filteredConfig = computed(() => {
  return {
    ...configTable.salesDocumentTypes,
    cols: configTable.salesDocumentTypes.cols.map((col) => ({
      ...col,
      selected: false,
    })),
  };
});

const isSelecteSalesDocType = () => {
  return currentTypesDocument.value.some((doc) => doc.selected === true);
};

//FUNCTIONS
const hideModal = () => {
  if (!lockModal.value) {
    createTypeSalesDocument.value = false;
    showTaxes.value = false;
    edit.value = false;
    currentDoc.value = {};
  }
};

const lock = (state) => {
  lockModal.value = state;
};

const deleteTypeSalesDocuments = async () => {
  const body = currentTypesDocument.value
    .filter((doc) => doc.selected)
    .map((doc) => doc._id);
  globalStore.loading = true;
  await organizationStore.deleteTypeSalesDocuments(body);
  currentTypesDocument.value = await organizationStore.getTypeSalesDocuments();
  globalStore.loading = false;
};

const getNameTypeBehavior = (code) => {
  switch (code) {
    case "invoice":
      return {
        es: "Documento Base",
        en: "Base Document",
      };
    case "credit":
      return {
        es: "Corrección Positiva",
        en: "Positive Correction",
      };
    case "debit":
      return {
        es: "Corrección Negativa",
        en: "Negative Correction",
      };
    default:
      return {
        es: "-",
        en: "-",
      };
  }
};

const getNameStatus = (isActive) => {
  return isActive
    ? {
        es: "Habilitado",
        en: "Enabled",
      }
    : {
        es: "Desabilitado",
        en: "Disabled",
      };
};

const actionTable = (obj) => {
  const { emit, data, pos } = obj;

  const emits = {
    editTypeSalesDocuments: () => {
      edit.value = true;
      currentDoc.value = data;
      createTypeSalesDocument.value = true;
    },
  };
  emits[emit]?.();
};

const initData = async () => {
  globalStore.loading = true;
  currentTypesDocument.value = await organizationStore.getTypeSalesDocuments();
  globalStore.loading = false;
};

const handleEsc = (e) => {
  if (e.key === "Escape") {
    hideModal();
  }
};

// MOUNTED
onMounted(async () => {
  await initData();
  window.addEventListener("keydown", handleEsc);
});

onBeforeUnmount(() => {
  window.removeEventListener("keydown", handleEsc);
});
</script>

<template>
  <div class="containerSection">
    <div class="containerSection__header">
      <h2>{{ title[lang] }}</h2>
      <!-- <span>{{ subtitle[lang] }}</span> -->
    </div>
    <div class="containerSection__filters">
      <SettingsOrganizationFormsDocumentComponentsButtonChangeTab />
      <!-- <u-input
        style="width: 400px"
        v-model="search"
        class="selecteddocTypes"
        :placeholder="inputs.search.placeholder[lang]"
        :label="inputs.search[lang]"
      /> -->
      <div class="containerSection__filters-space">
        <u-button-icon
          type="outlined"
          icon="delete"
          color="--neutral-text-caption"
          color-hover="--neutral-text-body"
          color-active="--neutral-text-body"
          :disabled="!isSelecteSalesDocType()"
          @action-btn="deleteTypeSalesDocuments"
        />
        <u-button
          :text="buttons.create[lang]"
          icon="new"
          @click="createTypeSalesDocument = true"
        />
      </div>
    </div>
    <TableBasic
      :configTable="filteredConfig"
      :content="currentTypesDocument"
      @actionTable="actionTable"
      class="table"
    >
      <template #name="item">
        <span class="body-m-s text" style="color: var(--neutral-text-body)">{{
          item?.item?.name
        }}</span>
      </template>

      <template #behavior="item">
        <span class="body-m-s" style="color: var(--neutral-text-body)">{{
          getNameTypeBehavior(item?.item?.code)?.[lang]
        }}</span>
      </template>

      <template #label="item">
        <span class="tag textCode">{{ item?.item?.tag }}</span>
      </template>

      <template #createdBy="item">
        <div class="container_avatar">
          <u-avatar
            :user="{
              name: item?.item.creator?.data?.legalName,
              src: item?.item.creator?.imgUrl,
            }"
            :size="32"
          />
          <span
            class="truncateText body-m-s"
            style="color: var(--neutral-text-body)"
            >{{ item?.item?.creator?.data?.legalName || "-" }}</span
          >
        </div>
      </template>

      <template #status="item">
        <u-tags
          style="margin: 0 auto"
          :title="getNameStatus(item?.item?.isActive)?.[lang]"
          :text="getNameStatus(item?.item?.isActive)?.[lang]"
          size="xs"
          :delete="false"
          :color="
            item?.item?.isActive
              ? ' --success-text-darker'
              : '--danger-text-darker'
          "
          :background="
            item?.item?.isActive
              ? '--success-surface-light'
              : '--danger-surface-light'
          "
        />
      </template>

      <template #taxes="item">
        <u-button-icon
          icon="taxes"
          type="text"
          size="s"
          color="--neutral-text-caption"
          @action-btn="
            showTaxes = true;
            currentDoc = item?.item;
          "
          style="margin: 0 auto"
        />
      </template>

      <template #noData>
        <div class="noData" style="margin-top: -70px">
          <span>No hay documentos de venta disponibles.</span>
        </div>
      </template>
    </TableBasic>
    <u-dialog
      :showModal="createTypeSalesDocument"
      :lockModal="lockModal"
      @closeModal="hideModal"
      :persistent="true"
      width="500px"
      height="auto"
    >
      <SettingsOrganizationDialogCreateTypeSalesDocuments
        @closeModal="hideModal"
        @lockModal="lock"
        @initData="initData"
        :document="currentDoc"
        :edit="edit"
      />
    </u-dialog>
    <u-dialog
      :showModal="showTaxes"
      :lockModal="lockModal"
      @closeModal="hideModal"
      :persistent="true"
      width="700px"
      height="auto"
    >
      <SettingsOrganizationDialogGlobalTaxes
        @closeModal="hideModal"
        @lockModal="lock"
        :document="currentDoc"
        @initDocTypeSales="initData"
      />
    </u-dialog>
  </div>
</template>

<style scoped>
h2,
span {
  font-family: Nunito;
}
.containerSection {
  display: grid;
  grid-template-rows: auto auto 1fr;
  gap: 20px;
  padding-right: 20px;
}
.containerSection__header h2 {
  font-size: 24px;
  font-weight: 600;
  line-height: 36px;
  text-align: left;
  color: var(--neutral-text-body);
}
.containerSection__header span {
  font-size: 14px;
  font-weight: 600;
  line-height: 18px;
  text-align: left;
  color: var(--neutral-text-caption);
}

.containerSection__filters {
  display: flex;
  justify-content: space-between;
  gap: 16px;
}

.containerSection__filters-space {
  display: flex;
  justify-content: flex-end;
  gap: 16px;
}

/* Tabla */

.table {
  color: var(--neutral-text-body);
}

.text {
  text-align: left;
}

.textCode {
  font-size: 14px;
  font-weight: 600;
  line-height: 18px;
  text-align: left;
  color: var(--neutral-text-body);
}

.tag {
  padding: 2px 8px;
  background-color: var(--neutral-surface-light);
  border-radius: 20px;
  color: var(--neutral-text-caption) !important;
  font-size: 14px;
  font-weight: 600;
  line-height: 12px;
}

.container_avatar {
  display: grid;
  grid-template-columns: 32px 1fr;
  align-items: center;
  gap: 10px;
}

.noData {
  display: flex;
  justify-content: center;
  align-items: center;
  position: sticky;
  left: 0;
  height: 100px;
}
.noData span {
  font-size: 14px;
  font-weight: 400;
  line-height: 18px;
  color: var(--neutral-text-caption);
}

@media only screen and (max-width: 1270px) {
  .containerSection__filters .selecteddocTypes {
    width: 40%;
  }
}
</style>
