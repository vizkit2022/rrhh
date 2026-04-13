<script setup>
import { ref, computed, onMounted } from "vue";
import { taxes } from "@/utils/labels/settings.json";
import useGlobalStore from "@/stores/global";
import useOrganizationStore from "@/stores/organization";

// STORE
const globalStore = useGlobalStore();
const organizationStore = useOrganizationStore();

// Variables
const search = ref("");
const selectAll = ref(false);
const createTax = ref(false);
const archiveTaxes = ref(false);
const currentTax = ref({});
const editTaxModal = ref(false);
const lockModal = ref(false);
const imgUrlFakeUnabase = "/Unabase.svg";

const hideModal = () => {
  if (!lockModal.value) {
    createTax.value = false;
    archiveTaxes.value = false;
    lockModal.value = false;
    currentTax.value = {};
    editTaxModal.value = false;
  }
};

const lock = (state) => {
  lockModal.value = state;
};

// FUNCTIONS
const getNameState = (state) => {
  const states = {
    active: {
      es: "Activo",
      en: "Enabled",
    },
    inactive: {
      es: "Inactivo",
      en: "Disabled",
    },
  };
  return states[state ? "active" : "inactive"][globalStore.lang];
};
const getType = (type) => {
  const types = {
    surcharge: {
      es: "Sobrecargo",
      en: "Fees",
    },
    tax: {
      es: "Impuesto",
      en: "Tax",
    },
  };
  return types[type]?.[globalStore.lang] || "-";
};

const getLabelFromBoolean = (isActive) => {
  return isActive
    ? lang.value === "es"
      ? "Habilitado"
      : "Enabled"
    : lang.value === "es"
      ? "Desabilitado"
      : "Disabled";
};

// Mapeo reactivo entre id y texto de estado
const statusMap = computed(() => {
  return Object.fromEntries(
    organizationStore.taxes.map((t) => [
      t._id,
      getLabelFromBoolean(t.isActive), // Siempre traduce según idioma actual
    ]),
  );
});

const optionsStatus = computed(() => [
  {
    label: lang.value === "es" ? "Habilitado" : "Enabled",
    value: true, // valor interno
  },
  {
    label: lang.value === "es" ? "Desabilitado" : "Disabled",
    value: false, // valor interno
  },
]);

// const updatedStatus = async (data, doc) => {
//   // data.value es boolean true (activo) o false (inactivo)
//   const newValue = data.value;
//   const oldValue = doc.isActive;
//   const idTax = doc._id;

//   // Actualizar en el documento
//   if (oldValue === newValue) {
//     return; // No hacer nada si el valor no ha cambiado
//   } else {
//     // Actualizar
//     globalStore.loading = true;
//     await organizationStore.updatedStatusTax(idTax);
//     const resp = await organizationStore.taxesByOrganization();
//     organizationStore.taxes = resp;
//     globalStore.loading = false;
//   }
// };

const toogleStatus = async (doc) => {
  // Actualizar
  globalStore.loading = true;
  await organizationStore.updatedStatusTax(doc._id);
  const resp = await organizationStore.taxesByOrganization();
  organizationStore.taxes = resp;
  globalStore.loading = false;
};

const getBehavior = (type) => {
  const types = {
    retention: {
      es: "Retención",
      en: "Retención",
    },
    noRetention: {
      es: "Valor Agregado",
      en: "Value Added",
    },
  };
  return types[type ? "retention" : "noRetention"][globalStore.lang];
};
const getCreateBy = (doc) => {
  if (doc.global) return { name: "Unabase", src: imgUrlFakeUnabase };
  else {
    const name = doc?.creator?.data?.legalName;
    return {
      name: name || "-",
      src: doc.creator.imgUrl,
    };
  }
};
const editTax = (doc) => {
  currentTax.value = doc;
  createTax.value = true;
  editTaxModal.value = true;
};
const selectAllItems = () => {
  organizationStore.taxes.forEach((t) => {
    if (!t.global) t.select = selectAll.value;
  });
};
const selectMinItems = () => {
  selectAll.value = organizationStore.taxes
    .filter((t) => !t.global)
    .every((t) => t.select);
};
const deleteTaxes = async () => {
  let taxes = [];
  organizationStore.taxes.forEach((t) => {
    if (t.select) taxes.push(t._id);
  });
  globalStore.loading = true;
  await organizationStore.deleteTax(taxes);
  const resp = await organizationStore.taxesByOrganization();
  organizationStore.taxes = resp;
  selectAll.value = false;
  globalStore.loading = false;
};

// COMPUTED
const lang = computed(() => globalStore.lang);
const title = computed(() => taxes.title);
const subtitle = computed(() => taxes.subtitle);
const buttons = computed(() => taxes.buttons);
const inputs = computed(() => taxes.inputs);
const headers = computed(() => taxes.table.headers);
const additional = computed(() => taxes.additionalText);
const modalArchive = computed(() => taxes.modalArchive);
const filteredTaxes = computed(() => {
  const lowerCaseValue = search.value.toLowerCase();
  if (lowerCaseValue === "") {
    return organizationStore.taxes;
  }
  return organizationStore.taxes.filter(
    (t) =>
      t.name.toLowerCase().includes(lowerCaseValue) ||
      t.description.toLowerCase().includes(lowerCaseValue),
  );
});

// MOUNTED
onMounted(async () => {
  globalStore.loading = true;
  const resp = await organizationStore.taxesByOrganization();
  organizationStore.taxes = resp;
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
          icon="folder-open"
          color="--danger-surface-default"
          colorHover="--danger-surface-darker"
          colorActive="--danger-surface-darker"
          @click="() => (archiveTaxes = true)"
          :disabled="!organizationStore.taxes.filter((t) => t.select).length"
          :tooltip="buttons.archive[lang]"
        />
        <u-button
          :text="buttons.create[lang]"
          icon="new"
          @click="createTax = true"
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
        <div class="col center" v-if="false">
          <span class="label">{{ headers.abbr[lang] }}</span>
        </div>
        <div class="col withBtn">
          <span class="label">{{ headers.name[lang] }}</span>
          <button><span class="u u-selector_down"></span></button>
        </div>
        <div class="col center">
          <span class="label">{{ headers.percentage[lang] }}</span>
        </div>
        <div class="col center">
          <span class="label">{{ headers.type[lang] }}</span>
        </div>
        <div class="col center">
          <span class="label">{{ headers.behavior[lang] }}</span>
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
        v-for="(doc, d) in filteredTaxes"
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
          @click="editTax(doc)"
        >
          <span class="text">{{ doc.name }}</span>
        </button>
        <div class="col center" :class="doc.select ? 'selected' : ''">
          <span class="text">{{ doc.value }}%</span>
        </div>
        <div class="col center" :class="doc.select ? 'selected' : ''">
          <span class="text">{{ getType(doc.typeTax) }}</span>
        </div>
        <div class="col center" :class="doc.select ? 'selected' : ''">
          <span class="text">{{ getBehavior(doc.retention) }}</span>
        </div>
        <div
          class="col avatar"
          :class="doc.select ? 'selected' : ''"
          style="padding: 0 12px"
        >
          <u-avatar :user="getCreateBy(doc)" :size="36" />
          <span class="text">{{ getCreateBy(doc)?.name || "" }}</span>
        </div>
        <div class="col last center" :class="doc.select ? 'selected' : ''">
          <div class="contTag">
            <div :class="`tag ${doc.isActive ? 'active' : 'inactive'}`">
              <span>{{ getNameState(doc.isActive) }}</span>
              <u-radio
                v-model="doc.isActive"
                @click="toogleStatus(doc)"
                color="--success-text-default"
                color-hover="--success-text-darker"
              />
            </div>
          </div>
          <!-- <div class="selectState" >
            <u-select v-model="statusMap[doc._id]" :options="optionsStatus" size="s" placeholder="-" :full-data="true"  @full-data="(data) => updatedStatus(data, doc)" :custom="true"  >
            <template #label="{ option }">
              <u-tags
              :text="option?.label"
              :align-center-text="true"
              :delete="false"
              :background="option?.value ? '--success-surface-light' : '--danger-surface-light'"
              :color="option.value ? '--success-text-darker' : '--danger-text-darker'"
              size="xs"
              />
            </template>

            <template #option="{ item, selected }">
              <span class="body-s-sb" style="font-size: 12px;" :style="{ color: selected ? 'var(--success-text-darker)' : '' }">{{ item.label }}</span>
            </template>

          </u-select>
          </div> -->
          <!-- <div :class="`state-${doc.isActive ? 'active' : 'inactive'}`">
            <span>{{ getNameState(doc.isActive) }}</span>
          </div> -->
        </div>
      </div>
      <div
        v-if="!filteredTaxes.length || !organizationStore.taxes.length"
        class="noTaxes"
      >
        <span
          v-text="
            additional[
              !filteredTaxes.length && organizationStore.taxes.length
                ? 'noTaxesFilter'
                : 'noTaxes'
            ][lang]
          "
        ></span>
      </div>
    </div>
    <u-dialog
      :showModal="createTax"
      :lockModal="lockModal"
      @closeModal="hideModal"
      :persistent="true"
      width="800px"
      height="auto"
    >
      <!-- <SettingsOrganizationDialogCreateTax
        @closeModal="hideModal"
        @lockModal="lock"
        :edit="editTaxModal"
        :tax="currentTax"
      /> -->
      <SettingsOrganizationDialogCreateTaxNew
        @closeModal="hideModal"
        @lockModal="lock"
        :edit="editTaxModal"
        :tax="currentTax"
      />
    </u-dialog>

    <DialogConfirm
      :showModal="archiveTaxes"
      @closeModal="archiveTaxes = false"
      @lockModal="lock"
      width="600px"
      height="auto"
      :title="modalArchive.title[lang]"
      :description="modalArchive.description[lang]"
      :customTextBtnDelete="modalArchive.buttons.archive[lang]"
      :action-modal="deleteTaxes"
    />
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
    48px minmax(237.5px, 1.2fr) 90px repeat(2, 158px) repeat(
      1,
      minmax(220px, 1fr)
    )
    178px;
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
.containerSection__table-item .col.avatar {
  gap: 10px;
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
  width: 85px;
  padding: 3px 3px 3px 10px;
  border-radius: 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.contTag .tag span {
  font-size: 12px;
  font-weight: 600;
  line-height: 16px;
}

.containerSection__table-item span.text {
  font-size: 14px;
  font-weight: 600;
  line-height: 18px;
  text-align: left;
  color: var(--neutral-text-body);
}
.containerSection__table-item .active {
  background-color: var(--success-surface-shadow-12a);
  color: var(--success-text-default);
}
.containerSection__table-item .inactive {
  background-color: var(--neutral-surface-shadow-12a);
  color: var(--neutral-text-subtitle);
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

.selectState {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 20px;
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

.noTaxes {
  display: flex;
  justify-content: center;
  align-items: center;
  position: sticky;
  left: 0;
  height: 100px;
}
.noTaxes span {
  font-size: 14px;
  font-weight: 400;
  line-height: 18px;
  color: var(--neutral-text-caption);
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
