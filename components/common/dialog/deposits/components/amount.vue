<script setup>
import { computed } from "vue";
import usePaymentsStore from "@/stores/payments";

// Stores
const paymentsStore = usePaymentsStore();

// Constants
const { t } = useI18n();
const BASE_KEY = "modules.outcomes.pages.oc.modals.deposits.step1";
const BASE_KEY_CHARGE = "modules.sales.modals.charge.step2";
const BASE_KEY_REFUND = "modules.sales.modals.refund.step2";

// Colors
const color = "--neutral-text-caption";
const colorHover = "--danger-text-default";

// Computed
const total = computed(() => {
  return paymentsStore.formDeposits.totalDeposits.value || "0.00";
});

const subtitleKey = computed(() => {
  const type = paymentsStore.formDeposits.type;

  const map = {
    outcome: `${BASE_KEY}.subtitle`,
    "sales-documents-charged": `${BASE_KEY_CHARGE}.amountCharge`,
    "sales-documents-refund": `${BASE_KEY_REFUND}.amountRefund`,
  };

  return map[type] || null;
});


// Function Utils
const getMimeType = (fileText) => {
  const extension = fileText.split(".").pop().toLowerCase();

  const types = {
    pdf: "/img/iconsFile/PDF.svg",
    jpg: "/img/iconsFile/JPG.svg",
    jpeg: "/img/iconsFile/JPG.svg",
    png: "/img/iconsFile/PNG.svg",
    gif: "/img/iconsFile/GIF.svg",
    xsl: "/img/iconsFile/XSL.svg",
    zip: "/img/iconsFile/ZIP.svg",
    xml: "/img/iconsFile/XML.svg",
    txt: "/img/iconsFile/TXT.svg",
    rar: "/img/iconsFile/PPT.svg",
    docx: "/img/iconsFile/DOCX.svg",
    doc: "/img/iconsFile/DOC.svg",
    csv: "/img/iconsFile/CSV.svg",
  };

  return types[extension] || "unknown";
};

// Functions
const handleFileUpload = () => {
  const fileInput = document.createElement("input");
  fileInput.type = "file";
  fileInput.accept = [
    ".csv",
    ".doc",
    ".docx",
    ".gif",
    ".jpg",
    ".jpeg",
    ".pdf",
    ".png",
    ".ppt",
    ".rar",
    ".txt",
    ".xml",
    ".xsl",
    ".zip",
  ].join(", ");

  fileInput.onchange = (event) => {
    const file = event.target.files[0];
    if (file) {
      const allowedTypes = [
        "application/pdf",
        "image/jpeg",
        "image/jpg",
        "image/png",
        "image/gif",
        "text/csv",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/vnd.ms-powerpoint",
        "application/vnd.openxmlformats-officedocument.presentationml.presentation",
        "application/x-rar-compressed",
        "text/plain",
        "application/xml",
        "application/zip",
        "application/vnd.ms-excel",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      ];

      if (!allowedTypes.includes(file.type)) {
        alert("Tipo de archivo no permitido.");
        return;
      }

      paymentsStore.formDeposits.data.file = file;

      console.log(getMimeType(paymentsStore?.formDeposits?.data?.file?.name));
    }
  };

  fileInput.click();
};
</script>

<template>
  <div class="step__header">
    <div class="step__header-left">
      <span class="step__header-amount truncateText">{{ total }}</span>
      <span v-if="subtitleKey" class="step__header-label">
        {{ t(subtitleKey) }}
      </span>

    </div>
    <!-- FILE -->
    <div class="step__header-right">
      <div
        v-if="paymentsStore.formDeposits.data.file"
        class="step__header-fileName"
      >
        <img
          :src="getMimeType(paymentsStore.formDeposits.data.file?.name)"
          alt="iconDocumentAdjunto"
        />
        <span
          class="truncateText"
          v-text="paymentsStore.formDeposits.data.file?.name"
        ></span>
        <u-button-icon
          icon="close"
          size="xs"
          type="outlined"
          :color="color"
          @click="paymentsStore.formDeposits.data.file = null"
          :colorHover="colorHover"
        />
      </div>
      <u-button
        v-else
        class="step__header-btn"
        icon="attach"
        :text="t(BASE_KEY + '.btnUploadFile')"
        size="s"
        type="outlined"
        @click="handleFileUpload"
      />
    </div>
  </div>
</template>

<style scoped>
.step__header {
  display: grid;
  grid-template-columns: 50% 50%;
}

.step__header-left {
  display: flex;
  flex-direction: column;
}

.step__header-amount {
  grid-area: amount;
  font-weight: 600;
  font-size: 18px;
  line-height: 24px;
  letter-spacing: 0%;
  vertical-align: middle;
  color: var(--neutral-text-body);
}
.step__header-label {
  grid-area: label;
  font-weight: 600;
  font-size: 16px;
  line-height: 20px;
  letter-spacing: 0%;
  vertical-align: middle;
  color: var(--neutral-text-caption);
}
.step__header-btn {
  grid-area: btn;
}

.step__header-right {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  width: 100%;
  height: 100%;
}

.step__header-fileName {
  display: grid;
  grid-template-columns: auto 1fr auto;
  width: auto;
  max-width: 268px;
  padding: 0px 12px;
  gap: 16px;
  height: 44px;
  align-items: center;
  gap: 4px;
  justify-content: flex-end;
  border: 1px solid var(--neutral-border-subtle);
  border-radius: 8px;
}

.step__header-fileName img {
  width: 34px;
  height: 34px;
}

.step__header-fileName span {
  color: var(--neutral-text-caption);
  font-size: 12px;
  line-height: 12px;
  width: 158px;
}
</style>
