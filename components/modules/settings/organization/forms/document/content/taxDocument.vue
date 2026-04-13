<script setup>
import { ref, computed, onMounted } from "vue";
import { taxDocument } from "@/utils/labels/settings.json";
import useGlobalStore from "@/stores/global";
import useOrganizationStore from "@/stores/organization";

// STORE
const globalStore = useGlobalStore();
const organizationStore = useOrganizationStore();

// Variables
const search = ref("");
const selectAll = ref(false);
const createTaxDoc = ref(false);
const showTaxes = ref(false);
const currentDoc = ref({});
const lockModal = ref(false);
const imgUrlFakeUnabase = "/Unabase.svg";

const hideModal = () => {
  if (!lockModal.value) {
    createTaxDoc.value = false;
    lockModal.value = false;
    showTaxes.value = false;
    edit.value = false;
    currentDoc.value = {};
  }
};

const lock = (state) => {
  lockModal.value = state;
};

// FUNCTIONS
const getNameState = (state) => {
  const states = {
    active: {
      es: "Habilitado",
      en: "Enabled",
    },
    inactive: {
      es: "Desabilitado",
      en: "Disabled",
    },
  };
  return states[state ? "active" : "inactive"][globalStore.lang];
};
const selectAllItems = () => {
  organizationStore.docsType.forEach((t) => {
    t.select = selectAll.value;
  });
};
const selectMinItems = () => {
  selectAll.value = organizationStore.docsType.every((t) => t.select);
};
const deleteDocsType = async () => {
  let docsType = [];
  organizationStore.docsType.forEach((t) => {
    if (t.select) docsType.push(t._id);
  });
  globalStore.loading = true;
  await organizationStore.deleteDocType(docsType);
  const resp = await organizationStore.getDocsType();
  if (resp) organizationStore.docsType = resp;
  selectAll.value = false;
  globalStore.loading = false;
};
const editDoc = (doc) => {
  createTaxDoc.value = true;
  currentDoc.value = doc;
  edit.value = true;
};
const getCreateBy = (doc) => {
  if (doc.global) return { name: "Unabase", src: imgUrlFakeUnabase };
  else
    return {
      name: doc?.creator?.data?.legalName || "-",
      src: doc?.creator?.imgUrl,
    };
};

// COMPUTED
const lang = computed(() => globalStore.lang);
const edit = ref(false);
const title = computed(() => taxDocument.title);
const subtitle = computed(() => taxDocument.subtitle);
const buttons = computed(() => taxDocument.buttons);
const inputs = computed(() => taxDocument.inputs);
const headers = computed(() => taxDocument.table.headers);
const additional = computed(() => taxDocument.additionalText);
const filteredDocsType = computed(() => {
  const lowerCaseValue = search.value.toLowerCase();
  if (lowerCaseValue === "") {
    return organizationStore.docsType;
  }
  return organizationStore.docsType.filter(
    (t) =>
      t.name.toLowerCase().includes(lowerCaseValue) ||
      t.code.toLowerCase().includes(lowerCaseValue),
  );
});

const handleEsc = (e) => {
  if (e.key === "Escape") {
    hideModal();
  }
};

// MOUNTED
onMounted(async () => {
  globalStore.loading = true;
  const resp = await organizationStore.getDocsType();
  if (resp) organizationStore.docsType = resp;
  const resp2 = await organizationStore.taxesByOrganization();
  if (resp2) organizationStore.taxes = resp2;
  globalStore.loading = false;
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
          :disabled="!filteredDocsType.filter((t) => t.select).length"
          @click="deleteDocsType"
        />
        <u-button
          :text="buttons.create[lang]"
          icon="new"
          @click="createTaxDoc = true"
        />
      </div>
    </div>
    <div class="containerSection__table">
      <div class="containerSection__table-header">
        <div class="col first center" @click="selectAllItems">
          <u-checkbox
            v-model="selectAll"
            :height="16"
            @click="selectAllItems"
          />
        </div>
        <div class="col withBtn">
          <span class="label">{{ headers.name[lang] }}</span>
          <button><span class="u u-selector_down"></span></button>
        </div>
        <div class="col center">
          <span class="label">{{ headers.tag[lang] }}</span>
        </div>
        <div class="col">
          <span class="label">{{ headers.createBy[lang] }}</span>
        </div>
        <div class="col center">
          <span class="label">{{ headers.state[lang] }}</span>
        </div>
        <div class="col last center">
          <span class="label">{{ headers.tax[lang] }}</span>
        </div>
      </div>
      <div
        class="containerSection__table-item"
        v-for="(doc, d) in filteredDocsType"
        :key="d"
      >
        <div
          class="col first center"
          :class="doc.select ? 'selected' : ''"
          @click="selectMinItems"
        >
          <span v-if="doc.global" class="text">-</span>
          <u-checkbox
            v-else
            v-model="doc.select"
            :height="16"
            @click="selectMinItems"
          />
        </div>
        <button
          class="col"
          :class="doc.select ? 'selected' : ''"
          @click="editDoc(doc)"
        >
          <span class="text">{{ doc.name }}</span>
        </button>
        <div class="col center" :class="doc.select ? 'selected' : ''">
          <span class="text tag">{{ doc.code }}</span>
        </div>
        <div
          class="col avatar"
          :class="doc.select ? 'selected' : ''"
          style="padding: 0 12px"
        >
          <u-avatar :user="getCreateBy(doc)" :size="36" /><span
            class="text truncateText"
            >{{ getCreateBy(doc).name }}</span
          >
        </div>
        <div class="col center" :class="doc.select ? 'selected' : ''">
          <div :class="`state-${doc.isActive ? 'active' : 'inactive'}`">
            <span>{{ getNameState(doc.isActive) }}</span>
          </div>
        </div>
        <div class="col last center" :class="doc.select ? 'selected' : ''">
          <button
            @click="
              showTaxes = true;
              currentDoc = doc;
            "
          >
            <span class="u u-taxes"></span>
          </button>
        </div>
      </div>
      <div
        v-if="!filteredDocsType.length || !organizationStore.docsType.length"
        class="noDocs"
      >
        <span
          v-text="
            additional[
              !filteredDocsType.length && organizationStore.docsType.length
                ? 'noDocsFilter'
                : 'noDocs'
            ][lang]
          "
        ></span>
      </div>
    </div>
    <u-dialog
      :showModal="createTaxDoc"
      :lockModal="lockModal"
      @closeModal="hideModal"
      :persistent="true"
      width="500px"
      height="auto"
    >
      <SettingsOrganizationDialogCreateTaxDocuments
        @closeModal="hideModal"
        @lockModal="lock"
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
.containerSection__table {
  height: calc(100vh - 402px);
  overflow-y: scroll;
}
.containerSection__table::-webkit-scrollbar {
  width: 0px;
  height: 0px;
}
/* .containerSection__table::-webkit-scrollbar-thumb {
    border-radius: 4px;
    background-color: var(--bg-neutral-400);
  } */
.containerSection__table-header {
  position: sticky;
  top: 0px;
  z-index: 1;
  background-color: var(--neutral-background-default);
}
.containerSection__table-header,
.containerSection__table-item {
  width: 100%;
  min-width: 700px;
  height: 52px;
  display: grid;
  grid-template-columns:
    48px minmax(237.5px, 2fr) minmax(90px, 1fr) minmax(200px, 2fr)
    minmax(158px, 1.5fr) 100px;
}
.containerSection__table-item:hover .col {
  background-color: var(--primary-surface-shadow-8a);
}
.containerSection__table-item .col.selected {
  background-color: var(--primary-surface-shadow-8a);
}
.containerSection__table-header .col,
.containerSection__table-item .col {
  display: flex;
  align-items: center;
  padding: 12px;
  background-color: var(--neutral-surface-softer);
  transition: 0.3s;
}
.containerSection__table-header .col {
  border-top: 1px solid var(--neutral-border-light);
  border-bottom: 1px solid var(--neutral-border-light);
}
.containerSection__table-item .col {
  background-color: var(--neutral-background-default);
  border-bottom: 1px solid var(--neutral-border-light);
}
.containerSection__table-header .col.withBtn {
  justify-content: space-between;
}
.containerSection__table-header .col.first {
  border-radius: 12px 0 0 0;
}
.containerSection__table-header .col.first,
.containerSection__table-item .col.first {
  border-left: 1px solid var(--neutral-border-light);
}
.containerSection__table-header .col.last {
  border-radius: 0 12px 0 0;
}
.containerSection__table-header .col.last,
.containerSection__table-item .col.last {
  border-right: 1px solid var(--neutral-border-light);
  text-align: right;
}
.containerSection__table-item:last-child .col.last {
  border-radius: 0 0 12px 0;
}
.containerSection__table-item:last-child .col.col.first {
  border-radius: 0 0 0 12px;
}
.containerSection__table-header .col .label {
  font-size: 14px;
  font-weight: 600;
  line-height: 18px;
  color: var(--neutral-text-caption);
}
.containerSection__table-header .col .u {
  font-size: 18px;
  font-weight: 600;
  line-height: 18px;
  color: var(--neutral-text-caption);
}
.contTag {
  position: relative;
}
.contTag .tag {
  width: 100%;
  padding: 3px 3px 3px 10px;
  border-radius: 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.col.center {
  justify-content: center;
}
.col.right {
  justify-content: flex-end;
}
.contTag .tag span {
  font-size: 12px;
  font-weight: 600;
  line-height: 16px;
  text-align: left;
}
.contTag .tag span.u {
  font-size: 14px;
}
.containerSection__table-item span.text {
  font-size: 14px;
  font-weight: 600;
  line-height: 18px;
  text-align: left;
  color: var(--neutral-text-body);
}
.containerSection__table-item .active {
  background-color: var(--success-surface-harder);
  color: var(--success-text-darker);
}
.containerSection__table-item .inactive {
  background-color: var(--neutral-surface-harder);
  color: var(--neutral-text-body);
}
.containerSection__table-item .col.avatar {
  display: grid;
  grid-template-columns: 32px 1fr;
  align-items: center;
  gap: 10px;
}
.tag {
  padding: 2px 8px;
  background-color: var(--neutral-surface-light);
  border-radius: 20px;
  color: var(--neutral-text-caption) !important;
  font-size: 12px;
  font-weight: 600;
  line-height: 12px;
}
.col button {
  display: flex;
  align-items: center;
}

.col button span {
  font-size: 20px;
  font-weight: 400;
  color: var(--neutral-text-caption);
  transition: color 0.3s;
}

.col button:not(:disabled):hover span {
  color: var(--primary-text-subtle);
}

.col button:not(:disabled) span.selected {
  color: var(--primary-text-subtle);
}

.col button:disabled {
  cursor: not-allowed;
}

.col button:disabled span {
  color: var(--neutral-text-disabled);
}

.state-active,
.state-inactive {
  padding: 0 8px;
  height: 24px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  gap: 8px;
}
.state-active {
  background-color: var(--success-surface-light);
}
.state-inactive {
  background-color: var(--danger-surface-light);
}
.state-active span,
.state-inactive span {
  font-size: 12px;
  font-weight: 600;
  line-height: 16px;
}
.state-active span {
  color: var(--success-text-darker);
}
.state-inactive span {
  color: var(--danger-text-darker);
}
.noDocs {
  display: flex;
  justify-content: center;
  align-items: center;
  position: sticky;
  left: 0;
  height: 100px;
}
.noDocs span {
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
