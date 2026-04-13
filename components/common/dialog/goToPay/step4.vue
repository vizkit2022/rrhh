<script setup>
import { defineEmits, onMounted } from "vue";
import usePaymentsStore from "@/stores/payments";

// Stores
const paymentsStore = usePaymentsStore();

// Emits
const emit = defineEmits(["closeModal", "changeStep"]);

// Constants
const color = "--neutral-text-caption";
const colorHover = "--neutral-text-body";
const { t } = useI18n();
const module = "modules.outcomes.pages.oc.modals.goToPay.step4";
const buttons = "modules.outcomes.pages.oc.modals.goToPay.buttons";

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

      paymentsStore.formGoToPay.file = file;

      console.log(getMimeType(paymentsStore?.formGoToPay?.file?.name));
    }
  };

  fileInput.click();
};
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
const bankAccountSelected = (id) => {
  paymentsStore.formGoToPay.originAccount = id;
};
const nextStep = () => {
  if (paymentsStore.formGoToPay.originAccount !== "") {
    emit("changeStep", true);
    paymentsStore.formGoToPay.originBankAccounts = JSON.parse(
      JSON.stringify(paymentsStore.bankAccountsByUser),
    );
  }
};

// Escape
// const handleEscClose = (e) => {
//   if (e.key === "Escape") {
//     emit("closeModal")
//   }
// }

// Mounted
onMounted(() => {
  // document.addEventListener("keydown", handleEscClose);
  paymentsStore.formGoToPay.prevCurrencyId =
    paymentsStore.formGoToPay.currency._id;

  paymentsStore.bankAccountsByUser =
    paymentsStore.formGoToPay.originBankAccounts;
});

// onUnmounted(() => {
//   document.removeEventListener("keydown", handleEscClose)
// })

const childRef = ref(null);
const createAccount = () => {
  childRef.value?.save();
  if (childRef.value?.bankAccountCreated) {
    nextStep();
  }
};
</script>

<template>
  <div class="step4">
    <div class="step4__header">
      <span v-text="t(module + '.title2')"></span>
      <u-button-icon
        icon="close"
        class="btnIconModify"
        :color="color"
        @action-btn="emit('closeModal')"
        type="outlined"
        size="s"
      />
    </div>
    <div class="step4__body">
      <div class="step4__body-header">
        <div class="box">
          <span v-text="paymentsStore.formGoToPay.totalToPay.value"></span>
          <span v-text="t(module + '.text')"></span>
        </div>
        <div class="file" v-if="paymentsStore?.formGoToPay?.file?.name">
          <img
            :src="getMimeType(paymentsStore.formGoToPay.file.name)"
            alt="iconPayFile"
          />
          <span
            class="truncateText"
            v-text="paymentsStore.formGoToPay.file?.name"
          ></span>
          <u-button-icon
            icon="close"
            size="xs"
            type="outlined"
            :color="color"
            @click="paymentsStore.formGoToPay.file = null"
            :colorHover="colorHover"
          />
        </div>
        <u-button
          v-else
          icon="attach"
          :text="t(module + '.buttons.upload')"
          size="s"
          type="outlined"
          @click="handleFileUpload"
        />
      </div>
      <div class="line"></div>
      <div class="step3__body-container">
        <div class="step3__body-container-subTitle">
          <span v-text="t(module + '.subTitle')" class="subTitle"></span>
        </div>
        <DialogCoverInfoCardsPayMethod
          ref="childRef"
          :refresh="false"
          width="700px"
          :by-user="false"
          maxHeight="320px"
          @bankAccountSelected="bankAccountSelected"
          bankAccountSelected="true"
          :onAction="createAccount"
          :initial-bank-account-id="paymentsStore.formGoToPay.originAccount"
          :paramsGetBankAccounts="{
            currency: paymentsStore.formGoToPay.currency._id,
          }"
        />
      </div>
    </div>
    <div class="step4__footer">
      <u-button
        :text="t(buttons + '.back')"
        type="outlined"
        class="mainBtnModify"
        @click="emit('changeStep', false)"
        size="s"
      />
      <u-button
        v-if="childRef?.showForm"
        :text="t(buttons + '.account')"
        @click="createAccount"
        size="s"
      />
      <u-button
        :text="t(buttons + '.next')"
        class="mainBtnModify"
        @click="nextStep"
        size="s"
        :disabled="paymentsStore.formGoToPay.originAccount === ''"
        v-else
      />
    </div>
  </div>
</template>

<style scoped>
.step4 {
  width: 700px;
  height: auto;
  display: grid;
  grid-template-rows: 40px 1fr 40px;
  gap: 16px;
}

/* header */
.step4__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 40px;
  width: 100%;
}

.step4__header span {
  font-size: 16px;
  font-weight: 600;
  line-height: 20px;
  letter-spacing: 0em;
  text-align: left;
  color: var(--neutral-text-body);
}

/* body */
.step4__body {
  height: 100%;
  display: grid;
  grid-template-rows: 44px 1px 1fr;
  gap: 24px;
}

.line {
  background-color: var(--neutral-border-subtle);
  height: 1px;
  width: 100%;
}

.step4__body-header {
  height: 44px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.step4__body-header span:nth-child(1) {
  font-weight: 600;
  font-size: 18px;
  line-height: 24px;
  letter-spacing: 0%;
  vertical-align: middle;
  color: var(--neutral-text-body);
}

.step4__body-header span:nth-child(2) {
  font-weight: 600;
  font-size: 16px;
  line-height: 20px;
  letter-spacing: 0%;
  vertical-align: middle;
  color: var(--neutral-text-caption);
}

.step4__body-header .box {
  display: flex;
  flex-direction: column;
}

.subTitle {
  font-weight: 600;
  font-size: 16px;
  line-height: 20px;
  letter-spacing: 0%;
  vertical-align: middle;
  color: var(--neutral-text-body);
}

.step3__body-container {
  display: flex;
  flex-direction: column;
  gap: 16px;
  height: 488px;
}

.step4__body-cards {
  display: flex;
  flex-direction: column;
  gap: 16px;
  overflow-y: auto;
  scrollbar-gutter: stable both-edges;
  padding-right: 10px;
  height: calc(85vh - 80px - 80px - 44px - 32px - 120px);
}

.step4__body-cards::-webkit-scrollbar {
  width: 8px;
  height: 0px;
  background: var(--neutral-surface-light);
  border-radius: 20px;
}
.step4__body-cards::-webkit-scrollbar-thumb {
  background: var(--neutral-surface-subtle);
  border-radius: 5px;
}

.step4__body-card {
  display: grid;
  grid-template-columns: auto 1fr 40px;
  gap: 20px;
  padding: 16px;
  box-sizing: border-box;
  border: 1px solid var(--neutral-border-subtle);
  border-radius: 16px;
  align-items: center;
}

.step4__body-card-details {
  display: flex;
  flex-direction: column;
}

.step4__body-card-details-title,
.step4__body-card-details-account {
  display: flex;
  gap: 10px;
  align-items: center;
}

.step4__body-card-details-title span {
  font-weight: 600;
  font-size: 14px;
  line-height: 14px;
  letter-spacing: 0%;
  vertical-align: middle;
  color: var(--neutral-text-body);
}

.step4__body-card-details-account span:nth-child(1) {
  font-size: 17px;
  color: var(--primary-text-default);
}

.step4__body-card-details-account span:nth-child(2) {
  font-weight: 400;
  font-size: 12px;
  line-height: 12px;
  letter-spacing: 0%;
  vertical-align: middle;
  color: var(--neutral-text-caption);
}

.step3__body-container-subTitle {
  display: flex;
  justify-content: space-between;
}

/* footer */
.step4__footer {
  width: 100%;
  height: 40px;
  display: flex;
  justify-content: space-between;
  padding-top: 10px;
}

.file {
  display: grid;
  grid-template-columns: auto 1fr auto;
  width: auto;
  max-width: 268px;
  padding: 0px 12px;
  gap: 16px;
  height: 48px;
  align-items: center;
  gap: 4px;
  justify-content: flex-end;
  border: 1px solid var(--neutral-border-subtle);
  border-radius: 8px;
}

.file span {
  color: var(--neutral-text-caption);
  font-size: 12px;
  line-height: 12px;
  width: 158px;
}

/* CUSTOM COMPONENTS - MODIFY */
.btnIconModify {
  border-radius: 50%;
  color: var(--bg-neutral-500);
}

.mainBtnModify {
  width: 135px;
}
</style>
