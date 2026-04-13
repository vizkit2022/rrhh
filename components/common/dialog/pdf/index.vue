<script setup>
import { defineEmits } from "vue";

import useGlobalStore from "@/stores/global";
import useOrganizationStore from "@/stores/organization";

// Store
const organizationStore = useOrganizationStore();
const globalStore = useGlobalStore();

// EMITS
const emit = defineEmits(["closeModal"]);

// CONSTANTS
const { t } = useI18n();
const module = "modules.organizations.settings.pdf";

// onMounted
// Actualizo los colores de la organizacion en el store
onMounted(async () => {
  organizationStore.printPdf.color = organizationStore?.organization?.printPdf?.color || "#20A789";
  organizationStore.printPdf.solidColor = organizationStore?.organization?.printPdf?.solidColor || false;
  organizationStore.printPdf.isHeaderTextWhite = organizationStore?.organization?.printPdf?.isHeaderTextWhite || false;
  organizationStore.printPdf.shouldShowZeroAmountLines = organizationStore?.organization?.printPdf?.shouldShowZeroAmountLines|| false;
  organizationStore.printPdf.showOvertime = organizationStore?.organization?.printPdf?.showOvertime|| true;
  organizationStore.printPdf.showAmounts = organizationStore?.organization?.printPdf?.showAmounts || true;
  organizationStore.printPdf.showValues = organizationStore?.organization?.printPdf?.showValues || true;
  organizationStore.printPdf.showUnit = organizationStore?.organization?.printPdf?.showUnit || true;
  organizationStore.printPdf.showTotal = organizationStore?.organization?.printPdf?.showTotal || true;
  organizationStore.printPdf.showDescriptionLine = organizationStore?.organization?.printPdf?.showDescriptionLine || true;
  organizationStore.printPdf.showDescriptionGroup = organizationStore?.organization?.printPdf?.showDescriptionGroup || true;
});


const save = async () => {
  globalStore.loading = true;
  const body = {...organizationStore.organization, printPdf: { ...organizationStore.printPdf }}
  await organizationStore.updateOrganizationFunction(body);
  globalStore.loading = false;
  organizationStore.printPdf.showModal = false;
};

</script>

<template>
  <div class="config">
    <div class="config__header">
      <span>{{ t(module + ".modal.title") }}</span>
      <u-button-icon icon="close" class="btnIconModify" color="--neutral-text-caption" type="outlined"
        @action-btn="emit('closeModal')" />
    </div>
    <DialogPdfControls />
    <DialogPdfExample />
    <div class="controls__actions">
      <u-button :text="t(module + '.button.save')" class="mainBtnModify" @action-btn="save" />
    </div>
  </div>
</template>

<style scoped>
.config {
  width: 80vw;
  max-width: 1100px;
  height: 90vh;
  max-height: 600px;
  display: grid;
  grid-template-areas: "header header" "controls example" "action action";
  grid-template-rows: 40px 1fr 40px;
  grid-template-columns: 1fr 400px;
  gap: 24px;
}

/* header */
.config__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 40px;
  width: 100%;
  grid-area: header;
}

.config__header span {
  font-size: 16px;
  font-weight: 600;
  line-height: 20px;
  letter-spacing: 0em;
  text-align: left;
  color: var(--neutral-text-body);
}

/* actions */
.controls__actions {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  grid-area: action;
  height: 40px;
}

/* CUSTOM COMPONENTS - MODIFY */
.btnIconModify {
  border-radius: 50%;
}

.mainBtnModify {
  width: 135px;
}
</style>
