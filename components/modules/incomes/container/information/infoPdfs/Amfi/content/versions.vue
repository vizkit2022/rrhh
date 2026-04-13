<script setup>
import { ref } from "vue";
import configTable from "@/utils/configTables/informationAmfi.json";
import useIncomesStore from "@/stores/incomes";
import { useI18n } from "vue-i18n";

//STORE
const incomesStore = useIncomesStore();

// TRANSLATION
const { t } = useI18n();
const module = "ui.income.sections.information.sections.versions";

const arrayVersion = ref([]);
const currentVersion = ref(0);
const lastVersionNumber = ref(0);

const addVersion = () => {
  lastVersionNumber.value += 1;
  arrayVersion.value.push({
    version: lastVersionNumber.value,
    nameVersion: "",
    duration: "",
    lift: "",
  });
  currentVersion.value = arrayVersion.value.length - 1;
  incomesStore.informationForm.amfi.versions = arrayVersion.value;
};

// Función para recalcular los números de versión
const recalculateVersionNumbers = () => {
  arrayVersion.value.forEach((item, index) => {
    item.version = index + 1;
  });
  // Actualizar el último número de versión
  lastVersionNumber.value = arrayVersion.value.length;
};

// Eliminar versión por número de version
const deleteVersionArray = (versionNumber) => {
  const index = arrayVersion.value.findIndex(
    (item) => item.version === versionNumber,
  );
  if (index !== -1) {
    arrayVersion.value.splice(index, 1);

    // Recalcular números de versión después de eliminar
    recalculateVersionNumbers();

    if (currentVersion.value >= arrayVersion.value.length) {
      currentVersion.value = Math.max(0, arrayVersion.value.length - 1);
    }
    incomesStore.informationForm.amfi.versions = arrayVersion.value;
  }
};

function actionTable({ emit, versionNumber }) {
  if (emit === "deleteVersion") deleteVersionArray(versionNumber);
}

// const onVersionInput = (item) => {
//   const clean = String(item.item.version).replace(/\D/g, '') //
//   item.item.version = clean
// }

onMounted(() => {
  arrayVersion.value = incomesStore.informationForm.amfi.versions;
  // Recalcular números al montar en caso de que haya datos previos
  if (arrayVersion.value.length > 0) {
    recalculateVersionNumbers();
  }
});
</script>

<template>
  <div class="container">
    <div class="header">
      <span>{{ t(`${module}.title`) }}</span>
      <p>{{ t(`${module}.description`) }}</p>
    </div>
    <div class="body">
      <TableBasic
        :configTable="configTable.version"
        :content="arrayVersion"
        @action-table="actionTable"
        :key="`table-${arrayVersion.length}`"
        class="tableVersions"
      >
        <!-- Campo de versión (solo números enteros) -->
        <template v-slot:version="item">
          <span class="version">{{ item.item.version }}</span>
          <!-- <u-input
            class="inputsVersions"
            placeholder="-"
            v-model="item.item.version"
            @input="onVersionInput(item)"
          /> -->
        </template>

        <!-- Campo de nombre de versión -->
        <template v-slot:nameVersion="item">
          <u-input
            class="inputsVersions"
            placeholder="-"
            v-model="item.item.nameVersion"
          />
        </template>

        <!-- Campo de duración -->
        <template v-slot:duration="item">
          <u-input
            class="inputsVersions"
            placeholder="-"
            v-model="item.item.duration"
          />
        </template>

        <!-- Campo de lift -->
        <template v-slot:lift="item">
          <u-input
            class="inputsVersions"
            placeholder="-"
            v-model="item.item.lift"
          />
        </template>

        <!-- Botón de eliminar -->
        <template v-slot:actions="item">
          <span
            class="u u-delete versionsDelete"
            @click="
              () =>
                actionTable({
                  emit: 'deleteVersion',
                  versionNumber: item.item.version,
                })
            "
          />
        </template>
      </TableBasic>

      <div class="footer">
        <u-button
          :text="t(`${module}.buttons.addVersion`)"
          style="width: 100%"
          color="--neutral-surface-shadow-8a"
          color-text="--neutral-text-caption"
          colorHover="--success-surface-shadow-8a"
          color-text-hover="--primary-text-default"
          color-active="--success-surface-shadow-12a"
          icon="new"
          @click="addVersion"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
.container {
  display: grid;
  grid-template-rows: 66px 1fr;
  width: 100%;
  gap: 24px;
}

.header {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.header span:first-child {
  font-size: 24px;
  font-weight: 600;
  line-height: 36px;
  color: var(--neutral-text-body);
}

.header p {
  color: var(--neutral-text-caption);
  font-size: 14px;
  font-weight: 400;
  line-height: 18px;
}

.body {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  overflow-y: auto;
  gap: 12px;
}

.footer {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  margin-top: 8px;
}

.version {
  width: 100%;
  display: flex;
  justify-content: left;
  padding: 0px 20px;
  align-items: center;
  color: var(--neutral-text-body);
}

/* Inputs de versiones */
::v-deep(.inputsVersions) {
  border: 0;
  width: 100%;
}
::v-deep(.inputsVersions:hover) {
  background-color: var(--success-surface-shadow-8a);
}
::v-deep(.inputsVersions:hover:not(:focus)) {
  border: none !important;
}
::v-deep(.inputsVersions:focus) {
  background-color: var(--success-surface-shadow-8a);
}
::v-deep(.input-empty) {
  background-color: var(--neutral-surface-shadow-8a);
}

.versionsDelete {
  width: 100%;
  font-size: 20px;
  display: flex;
  justify-content: center;
  align-items: center;
  color: var(--danger-text-default);
  cursor: pointer;
}
</style>
