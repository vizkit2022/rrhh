<script setup>
import { defineEmits, ref, defineProps, onMounted, onUnmounted } from "vue";
import useOutcomesStore from "@/stores/outcomes";
import useGlobalStore from "@/stores/global";
import useValidationStore from "@/stores/validations";

import { transformedDate, capitalizeName } from "@/utils/helpers";

// Stores
const outcomesStore = useOutcomesStore(); 
const globalStore = useGlobalStore(); 
const validationStore = useValidationStore();

// Emits
const emit = defineEmits(["closeModal", "changeStep", "modalCanceled", "documenting"]);

// Props
const props = defineProps({
  body: {
    type: Object,
    default: () => ({}),
  },
});

// Constants
const color = "--neutral-text-caption";
const colorCancel = {
    normal: "--danger-text-default",
    hover: "--danger-text-darker",
    active: "--danger-text-darker"
};
const colorDownload = {
    normal: "--neutral-text-caption",
    hover: "--neutral-text-body",
    active: "--neutral-text-body"
};
const { t } = useI18n();
const module = "modules.outcomes.pages.oc.modals.buy.step4";
const config = {
  width: "calc(85vw - 80px)",
  modal: true,
  maxHeight: "calc(85vh - 364px)",
  columns: {
    checkbox: false,
    code: true,
    name: true,
    origin: true,
    quantity: true,
    days: true,
    ot: true,
    price: true,
    total: true,
    documented: false,
  }
}
const showModalComment = ref(false);

// Functions
const supplier = computed(() => {
  return {
    name: outcomesStore?.outcome?.supplier?.data?.legalName || '-',
    src: outcomesStore?.outcome?.supplier?.imgUrl,
  }
});

const outcome = computed(() => {
   if (outcomesStore.outcome.status === "forApproval") {
      validationStore.showModalComment = true,
      validationStore.dataModalComment = {
        type: 'outcomes',
        outcome: {
          _id: outcomesStore.outcome._id,
          creator: outcomesStore.outcome?.creator?.user?.data?.legalName,
          type: outcomesStore.outcome?.type,
          idNumber: outcomesStore.outcome?.idNumber
        },
        validations: outcomesStore.outcome?.validations
      }

   }
  return outcomesStore.outcome
});

const usedIds = computed(() => {
  const ids = new Set();

  outcomesStore.outcome?.lines?.forEach(line => {
    if (Array.isArray(line.taxes)) {
      line.taxes.forEach(tax => ids.add(tax));
    }
  });

  return Array.from(ids);
});

const printPO = async () => {
  try {
    outcomesStore.formPO.processing = true;
    globalStore.loading = true;
    const response = await outcomesStore.generarPDF(outcome.value);
    if (response) {
      window.open(response, "_blank");
    } else {
      console.error("No se pudo generar el Blob para la descarga del PDF.");
    }
  } catch (error) {
    console.error("Error al descargar el PDF:", error);
  } finally {
    globalStore.loading = false;
    outcomesStore.formPO.processing = false;
  }
};

const documenting = (step) => {
  emit("documenting", step);
};

const hidenModalComment = () => {
  showModalComment.value = false;
};

const abrirModal = () => {
  showModalComment.value = true;
};

// watch(outcomesStore.outcome, (newOutcome) => {
//   console.log("entro al watch de outcome", newOutcome);
//   if (newOutcome?.status === "forApproval") {
//     showModalComment.value = true;
//   }
// });


</script>

<template>
  <div class="step4">
    <div class="step4__header">
      <div class="step4__header-snippet">
        <div class="step4__header-snippet-sup">
            <span class="number">{{ (outcome?.managementDoc?.code || '') + ' - ' + t(module + '.labels.main') + ' ' + outcome.idNumber }}</span>
            <span class="dubble"></span>
            <span v-if="outcome?.reference?.trim() !== ''" v-text="capitalizeName(outcome?.reference)" class="reference truncateText"></span>
            <span v-if="outcome?.status" v-text="t(`modules.outcomes.pages.oc.header.tags.${outcome.status}`)" :class="`tag ${outcome.status}`"></span>
        </div>
        <div class="step4__header-snippet-inf">
            <u-avatar :size="22" :user=supplier />
            <span class="supplier" v-text="capitalizeName(supplier.name)"></span>
            <span class="dubble"></span>
            <span class="date" v-text="transformedDate(outcome.createdAt, globalStore.lang)"></span>
        </div>
      </div>
      <div class="step4__subheader">
        <u-button type="outlined" size="s" icon="close" :text="t(module + '.buttons.cancel')" @click="emit('modalCanceled', outcome._id)" :color="colorCancel.normal" :color-hover="colorCancel.hover" :color-active="colorCancel.active"  />
        <u-button type="outlined" size="s" icon="invoice" :text="t(module + '.buttons.documented')" @click="documenting(1)"  />
        <u-button-icon 
          type="outlined" 
          size="s" icon="download" 
          @click="printPO()" 
          :color="colorDownload.normal" 
          :color-hover="colorDownload.hover" 
          :color-active="colorDownload.active"
          :tooltip="t(module + '.buttons.download')"
          orientationTooltip="bottom" />
        <!-- <button class="btnMotion">
          <span class="u u-close"></span>
          <span v-text="t(module + '.buttons.cancel')"></span>
        </button>
        <button class="btnMotion">
          <span class="u u-download"></span>
          <span v-text="t(module + '.buttons.download')"></span>
        </button>
        <button class="btnMotion">
          <span class="u u-invoice"></span>
          <span v-text="t(module + '.buttons.documented')"></span>
        </button> -->
    </div>
      <u-button-icon
        icon="close"
        class="btnIconModify"
        :color="color"
        @action-btn="emit('closeModal')"
        type="outlined"
        size="s"
      />
    </div>
    <OutcomesTablesGrid 
      :lines="outcomesStore?.outcome?.lines || []"
      :config="config" :updateBackend="false"  
      :currency="{}"
      :buyModal=true
      :readOnly=true />
    <div class="step4__footer">
      <div class="obs">
        <span v-text="t(module + '.labels.observations')"></span>
        <p v-text="outcome?.observation || '-'"></p>
      </div>
      <OutcomesTablesTaxes :taxes="outcome.numbers" :usedIds="usedIds" :filter-taxes="true" :single=true />
    </div>
  </div>


  <!-- <div v-if="showModalComment" class="modalComment">
    <DialogCommentValidation @closeModal="hidenModalComment" />
  </div> -->
<!-- <Teleport to="body">
  <u-dialog
    :showModal="showModalComment"
    @closeModal="hidenModalComment"
    width="auto"
    height="auto"
    class="modalComment"
  >
    <DialogCommentValidation @closeModal="hidenModalComment" />
  </u-dialog>
</Teleport> -->

</template>

<style scoped>
.btnMotion {
  overflow: hidden;
  width: 32px;
  height: 32px;
  background-color: var(--neutral-background-default);
  border-radius: 16px;
  display: grid;
  grid-template-columns: 30px 1fr;
  align-items: center;
  box-sizing: border-box;
  transition: 0.3s ease;
}
.btnMotion span {
  white-space: nowrap;
  font-size: 18px;
  text-align: start;
}
.btnMotion span.u {
  width: 30px;
  font-size: 20px;
  text-align: center;
}

.btnMotion:hover {
  border-radius: 8px;
}

.btnMotion:nth-child(1):hover {
  width: 95px;
}
.btnMotion:nth-child(1) {
  border: var(--secondary-text-default) 1px solid;
}
.btnMotion:nth-child(1) span {
  color: var(--secondary-text-default);
}

.btnMotion:nth-child(2):hover {
  width: 160px;
}
.btnMotion:nth-child(2) {
  border: var(--neutral-text-caption) 1px solid;
}
.btnMotion:nth-child(2) span {
  color: var(--neutral-text-caption);
}

.btnMotion:nth-child(3):hover {
  width: 140px;
}
.btnMotion:nth-child(3) {
  border: var(--primary-text-subtle) 1px solid;
}
.btnMotion:nth-child(3) span {
  color: var(--primary-text-subtle);
}

.step4 {
  width: 100%;
  height: auto;
  display: grid;
  grid-template-rows: 40px minmax(100px, auto) auto;
  gap: 16px;
}

/* header */
.step4__header {
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  column-gap: 20px;
  height: 40px;
  width: 100%;
}

/* body */
.step4__body {
  width: calc(85vw - 80px);
  overflow: hidden;
  height: auto;
  display: grid;
  grid-template-rows: 1fr auto;
  gap: 24px;
}

.step4__header-snippet-sup {
  margin-bottom: 5px;
}

.step4__header-snippet-sup, 
.step4__header-snippet-inf {
    display: flex;
    gap: 10px;
    align-items: center;
}

.step4__header-snippet-sup span.number {
    font-size: 14px;
    font-weight: 600;
    color: var(--secondary-text-default);
}

.step4__header-snippet-sup span.reference {
    font-size: 14px;
    font-weight: 600;
    color: var(--neutral-text-body);
    max-width: 300px;
}

.step4__header-snippet-sup span.dubble,
.step4__header-snippet-inf span.dubble {
    width: 4px;
    height: 4px;
    background-color: var(--neutral-text-caption);
    border-radius: 50%;
}

.step4__header-snippet-sup span.tag {
  padding: 2px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
}

.step4__header-snippet-sup span.tag.forApproval {
  background-color: var(--warning-surface-light);
  color: var(--warning-text-darker);
}
.step4__header-snippet-sup span.tag.inProcess {
  background-color: var(--info-surface-light);
  color: var(--info-text-darker);
}
.step4__header-snippet-sup span.tag.reject {
  background-color: var(--danger-surface-light);
  color: var(--danger-text-darker);
}
.step4__header-snippet-sup span.tag.closed {
  background-color: var(--success-surface-light);
  color: var(--success-text-darker);
}
.step4__header-snippet-sup span.tag.voided {
  background-color: var(--neutral-surface-light);
  color: var(--neutral-text-caption);
}

.step4__header-snippet-inf span.supplier,
.step4__header-snippet-inf span.date {
    color: var(--neutral-text-caption);
    font-size: 12px;
}

/* Subheader */
.step4__subheader {
    display: flex;
    align-items: center;
    gap: 10px;
    padding-left: 20px;
    border-left: 1px solid var(--neutral-border-light);
}

/* Footer */

.step4__footer {
    display: grid;
    grid-template-columns: 1fr auto;
    gap: 20px;
}

.step4__footer .obs {
    border-radius: 10px;
    border: 1px solid var(--neutral-border-light);
    padding: 16px;
    box-sizing: border-box;
    display: grid;
    grid-template-rows: auto 1fr;
    gap: 5px;
}

.step4__footer .obs span {
    font-weight: 800;
    font-size: 14px;
    line-height: 18px;
    letter-spacing: 0%;
    vertical-align: bottom;
    color: var(--neutral-text-body);
}

.step4__footer .obs p {
    font-weight: 400;
    font-size: 12px;
    line-height: 16px;
    vertical-align: bottom;
    color: var(--neutral-text-caption);
    
}

/* CUSTOM COMPONENTS - MODIFY */
.btnIconModify {
  border-radius: 50%;
  color: var(--bg-neutral-500);
}

.mainBtnModify {
  width: 135px;
}


.modalComment {
  position: fixed;
  z-index: 10000;
  top: 0px;
  left: 0px;
  width: 100vw;
  height: 100vh;
  background-color: var(--neutral-background-shadow);
  display: flex;
  justify-content: center;
  align-items: center;
}

</style>
