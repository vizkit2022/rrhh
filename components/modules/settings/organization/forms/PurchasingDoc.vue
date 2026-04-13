<script setup>
import { ref, computed, onMounted } from "vue";
import { purchasingDocuments } from "@/utils/labels/settings.json";
import useGlobalStore from "@/stores/global";
import useOrganizationStore from "@/stores/organization";

// STORE
const globalStore = useGlobalStore();
const organizationStore = useOrganizationStore();

// Variables
const search = ref("");
const selectAll = ref(false);
const createTypeDoc = ref(false);
const edit = ref(false);
const currentDoc = ref({});
const lockModal = ref(false);
const imgUrlFakeUnabase = "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTtV1oAuLCQpYkpghQseJfBlAleaEpgD1cZ7A&s"

const hideModal = () => {
  if (!lockModal.value) {
    createTypeDoc.value = false;
    lockModal.value = false;
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
      es: "Deshabilitado",
      en: "Disabled",
    },
  };
  return states[state ? "active" : "inactive"][globalStore.lang];
};
const getCreateBy = (doc) => {
  if (doc.global) return { name: "Unabase", src: imgUrlFakeUnabase };
  else
    return {
      name: doc?.creator?.data?.legalName || '-',
      src: doc?.creator?.imgUrl,
    };
};
const editDoc = (doc) => {
  createTypeDoc.value = true;
  currentDoc.value = doc;
  edit.value = true;
};
const deleteDocs = async () => {
  let docs = [];
  organizationStore.docs.forEach((t) => {
    if (t.select) docs.push(t._id);
  });
  globalStore.loading = true;
  await organizationStore.deleteDoc(docs);
  const resp = await organizationStore.getDocs();
  if (resp) organizationStore.docs = resp;
  selectAll.value = false;
  globalStore.loading = false;
};
const selectAllItems = () => {
  organizationStore.docs.forEach((t) => {
    if (!t.global) t.select = selectAll.value;
  });
};
const selectMinItems = () => {
  selectAll.value = organizationStore.docs
    .filter((t) => !t.global)
    .every((t) => t.select);
};
const getTagByType = (type) => {
  const types = {
    OC: {
      es: "Único Proveedor",
      en: "Uni-Vendor",
    },
    FXR: {
      es: "Multiproveedor",
      en: "Multi-Vendor",
    },
  };
  return types[type][globalStore.lang] || "";
};

// COMPUTED
const lang = computed(() => globalStore.lang);
const title = computed(() => purchasingDocuments.title);
const subtitle = computed(() => purchasingDocuments.subtitle);
const buttons = computed(() => purchasingDocuments.buttons);
const inputs = computed(() => purchasingDocuments.inputs);
const headers = computed(() => purchasingDocuments.table.headers);
const additional = computed(() => purchasingDocuments.additionalText);
const filteredDocs = computed(() => {
  const lowerCaseValue = search.value.toLowerCase();
  if (lowerCaseValue === "") {
    return organizationStore.docs;
  }
  return organizationStore.docs.filter(
    (t) =>
      t.name.toLowerCase().includes(lowerCaseValue) ||
      t.code.toLowerCase().includes(lowerCaseValue)
  );
});

// MOUNTED
onMounted(async () => {
  globalStore.loading = true;
  const resp = await organizationStore.getDocs();
  if (resp) organizationStore.docs = resp;
  globalStore.loading = false;
});
</script>

<template>
  <div class="containerSection">
    <div class="containerSection__header">
      <h2>{{ title[lang] }}</h2>
      <span>{{ subtitle[lang] }}</span>
    </div>
    <div class="containerSection__filters">
      <u-input
        style="width: 400px"
        v-model="search"
        class="selecteddocTypes"
        :placeholder="inputs.search.placeholder[lang]"
        :label="inputs.search[lang]"
      />
      <div class="containerSection__filters-space">
        <u-button-icon
          type="outlined"
          icon="delete"
          color="--neutral-text-caption"
          color-hover="--neutral-text-body"
          color-active="--neutral-text-body"
          @click="deleteDocs"
          :disabled="!filteredDocs.filter((t) => t.select).length"
        />
        <u-button
          :text="buttons.create[lang]"
          icon="new"
          @click="createTypeDoc = true"
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
        <div class="col center">
          <span class="label">{{ headers.type[lang] }}</span>
        </div>
        <div class="col">
          <span class="label">{{ headers.createBy[lang] }}</span>
        </div>
        <div class="col last center">
          <span class="label">{{ headers.state[lang] }}</span>
        </div>
      </div>
      <div
        class="containerSection__table-item"
        v-for="(doc, d) in filteredDocs"
        :key="d"
        :class="doc.global ? 'disabled' : ''"
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
          class="col colBtn"
          :class="doc.select ? 'selected' : ''"
          @click="editDoc(doc)"
        >
          <span class="text">{{ doc.name }}</span>
        </button>
        <div class="col center" :class="doc.select ? 'selected' : ''">
          <span class="text">{{ doc.code }}</span>
        </div>
        <div
          class="col center"
          :class="`${doc.select ? 'selected' : ''} ${doc.type}`"
        >
          <span class="text">{{ getTagByType(doc.type) }}</span>
        </div>
        <div
          class="col avatar"
          :class="doc.select ? 'selected' : ''"
          style="padding: 0 12px"
        >
          <u-avatar :user="getCreateBy(doc)" :size="36" />
          <span class="text">{{ getCreateBy(doc).name }}</span>
        </div>
        <div class="col last center" :class="doc.select ? 'selected' : ''">
          <div :class="`state-${doc.isActive ? 'active' : 'inactive'}`">
            <span>{{ getNameState(doc.isActive) }}</span>
          </div>
        </div>
      </div>
      <div
        v-if="!filteredDocs.length || !organizationStore.docs.length"
        class="noDocs"
      >
        <span
          v-text="
            additional[
              !filteredDocs.length && organizationStore.docs.length
                ? 'noDocsFilter'
                : 'noDocs'
            ][lang]
          "
        ></span>
      </div>
    </div>
    <u-dialog
      :showModal="createTypeDoc"
      :lockModal="lockModal"
      @closeModal="hideModal"
      :persistent="true"
      width="500px"
      height="600px"
    >
      <SettingsOrganizationDialogCreatePurchasingDoc
        @closeModal="hideModal"
        @lockModal="lock"
        :document="currentDoc"
        :edit="edit"
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
  grid-template-rows: 60px 36px 1fr;
  gap: 24px;
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
  min-width: 771px;
  height: 52px;
  display: grid;
  grid-template-columns:
    48px minmax(237.5px, 1fr) minmax(90px, 1fr) 160px minmax(237.5px, 1fr)
    repeat(1, 158px);
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
.containerSection__table-item .col.avatar {
  gap: 10px;
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
.containerSection__table-item .col.OC span.text {
  background-color: var(--info-surface-shadow-12a);
  color: var(--info-text-default);
}
.containerSection__table-item .col.FXR span.text {
  background-color: var(--warning-surface-shadow-12a);
  color: var(--warning-text-default);
}
.containerSection__table-item .col.OC span.text,
.containerSection__table-item .col.FXR span.text {
  padding: 0px 8px;
  border-radius: 16px;
  font-size: 12px;
  line-height: 16px;
  height: 24px;
  display: flex;
  justify-content: center;
  align-items: center;
}
.colBtn:disabled {
  cursor: not-allowed;
}
@media only screen and (max-width: 1270px) {
  .containerSection__filters .selecteddocTypes {
    width: 40%;
  }
}
</style>
