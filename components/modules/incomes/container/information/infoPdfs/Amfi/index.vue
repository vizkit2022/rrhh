<script setup>
import useIncomesStore from "@/stores/incomes";
import useGlobalStore from "@/stores/global";
import { useI18n } from "vue-i18n";

// STORE
const globalStore = useGlobalStore();
const incomesStore = useIncomesStore();

// TRANSLATIONS
const { t } = useI18n();
const module = "ui.income.sections.information";

/**
 * Guarda los datos del formulario en la base de datos
 */
async function saveFormInformation() {
  await incomesStore.saveAmfiInformation();
}
</script>

<template>
  <div class="container">
    <div
      class="loading"
      v-if="incomesStore.informationForm.amfi.loading.status"
    >
      <u-loading width="18" />
      <span class="body-l-sb">{{
        incomesStore.informationForm.amfi.loading.message ||
        t(`${module}.loading.updated`)
      }}</span>
    </div>
    <IncomesContainerInformationInfoPdfsAmfiContentInfoProject
      v-if="incomesStore.informationStates.posNav === 0"
      @save="saveFormInformation"
    />
    <IncomesContainerInformationInfoPdfsAmfiContentProductionDetails
      v-if="incomesStore.informationStates.posNav === 1"
    />
    <IncomesContainerInformationInfoPdfsAmfiContentIntroduction
      v-if="incomesStore.informationStates.posNav === 2"
      @save="saveFormInformation"
    />
    <IncomesContainerInformationInfoPdfsAmfiContentPaymentConditions
      v-if="incomesStore.informationStates.posNav === 3"
      @save="saveFormInformation"
    />
    <IncomesContainerInformationInfoPdfsAmfiContentCancellations
      v-if="incomesStore.informationStates.posNav === 4"
      @save="saveFormInformation"
    />
    <IncomesContainerInformationInfoPdfsAmfiContentVersions
      v-if="incomesStore.informationStates.posNav === 5"
    />
    <IncomesContainerInformationInfoPdfsAmfiContentObservations
      v-if="incomesStore.informationStates.posNav === 6"
      @save="saveFormInformation"
    />
  </div>
</template>

<style scoped>
.container {
  position: relative;
  width: 100%;
  height: 100%;
}

.loading {
  position: absolute;
  z-index: 10;
  right: 10px;
  top: 10px;
  display: flex;
  flex-direction: row;
  align-items: center;
  background-color: var(--neutral-border-subtle);
  padding: 4px 8px;
  border-radius: 12px;
  gap: 10px;
}

.loading span {
  color: var(--neutral-text-body);
}

.mainBtnSave {
  position: absolute;
  z-index: 10;
  right: 10px;
  top: 0px;
}
</style>
