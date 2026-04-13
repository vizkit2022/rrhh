<script setup>
import { defineEmits, computed, onMounted } from "vue";
import usePaymentsStore from "@/stores/payments";
import useOrganizationStore from "@/stores/organization";
import useGlobalStore from "@/stores/global";
import { capitalizeName, formatDateToYMD } from "@/utils/helpers";

// Stores
const paymentsStore = usePaymentsStore();
const globalStore = useGlobalStore();
const organizationStore = useOrganizationStore();

// Emits
const emit = defineEmits(["closeModal", "changeStep"]);

// Props
const props = defineProps({
  body: {
    type: Object,
    default: () => ({}),
  },
});

// Constants
const color = "--neutral-text-caption";
const colorHover = "--danger-text-default";
const { t } = useI18n();
const module = "modules.outcomes.pages.oc.modals.goToPay.step3";
const buttons = "modules.outcomes.pages.oc.modals.goToPay.buttons";
const sameCurrency = ref(true); // Sirve para saber si no cambie la moneda (true no cambie), (false si cambie)

// Computed
const title = computed(() => t(module + ".title2"));
const invalidForm = computed(() => {
  const { paymentMethod, transactionNumber, reference } =
    paymentsStore.formGoToPay;

  return (
    Object.keys(paymentMethod).length === 0 ||
    transactionNumber.trim() === "" ||
    reference.trim() === ""
  );
});

const paymentMethodsOptions = computed(() => {
  return paymentsStore.paymentMethods.map((pay) => ({
    ...pay,
    label: pay.name[globalStore.lang],
  }));
});

const currenciesOptions = computed(() => {
  return paymentsStore.formGoToPay.currencies.map((item) => {
    return {
      label: item?.name?.[globalStore.lang] || "-",
      value: item._id,
      data: item,
    };
  });
});

// Functions
const nextStep = async () => {
  if (!invalidForm.value) {
    globalStore.loading = true;

    // CAMBIO DE MONEDAS
    // let resp = null;
    // Si no cambie la moneda, uso el getMyCurrencies ya cargado
    // if (!sameCurrency.value) {
    //   // Cambie la moneda, debo hacer get del getMyCurrencies con nuevos valores
    //   const currencyBase = paymentsStore?.formGoToPay?.currency?._id || null;
    //   if (currencyBase) {
    //     resp = await globalStore.getMyCurrencies(false, currencyBase);

    //     console.log("resp", resp);

    //     paymentsStore.formGoToPay.othersCurrency = resp?.currencies.map(
    //       (c) => ({
    //         ...c,
    //         currency: c._id,
    //         value: c.value?.replace(/,/g, ""),
    //         valueManual: Number(c.value?.replace(/,/g, "")),
    //         valueToday: Number(c.value?.replace(/,/g, "")),
    //       }),
    //     );
    //   }
    // } else {
    //   resp = await globalStore.getMyCurrencies();
    // }
    // paymentsStore.formGoToPay.currencies = [];
    // if (resp) {
    //   paymentsStore.formGoToPay.currencies = resp.currencies;
    //   paymentsStore.formGoToPay.currencies.unshift(resp.currency);
    // }

    // Cargar cuentas de la organización - ORIGEN
    if (
      paymentsStore.formGoToPay.prevCurrencyId !==
      paymentsStore.formGoToPay.currency._id
    ) {
      const params = {
        currency: paymentsStore?.formGoToPay?.currency?._id || null,
      };
      const resOrigin =
        await organizationStore.fetchCurrentOrgBankAccounts(params);
      paymentsStore.formGoToPay.originBankAccounts = resOrigin?.resp || [];
    }

    emit("changeStep", true);
    globalStore.loading = false;
  } else {
    null;
  }
};
const handleChangeCurrency = (currency) => {
  sameCurrency.value =
    paymentsStore?.formGoToPay?.currency?._id === currency.value;
  paymentsStore.formGoToPay.currencyName = currency.label;
  paymentsStore.formGoToPay.currency = currency.data;
};
const getDataPayMethods = (data) => {
  paymentsStore.formGoToPay.paymentMethod = data._id;
};
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

// Escape
// const handleEscClose = (e) => {
//   if (e.key === "Escape") {
//     emit("closeModal");
//   }
// }

// Mounted
onMounted(async () => {
  // document.addEventListener("keydown", handleEscClose);
  if (paymentsStore.formGoToPay.issueDate === "")
    paymentsStore.formGoToPay.issueDate = formatDateToYMD();
  if (paymentsStore.formGoToPay.paymentDate === "")
    paymentsStore.formGoToPay.paymentDate = formatDateToYMD();
});

// onUnmounted(() => {
//   document.removeEventListener("keydown", handleEscClose)
// })
</script>

<template>
  <div class="step3">
    <div class="step3__header">
      <span v-text="title"></span>
      <u-button-icon
        icon="close"
        class="btnIconModify"
        :color="color"
        @action-btn="emit('closeModal')"
        type="outlined"
        size="s"
      />
    </div>
    <div class="step3__body">
      <div class="step3__body-header">
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
        <span v-text="t(module + '.subTitle')" class="subTitle"></span>
        <div class="step3__body-form">
          <div class="step3__body-group">
            <span class="u u-user"></span>
            <span v-text="t(module + '.inputs.paymentMethod.label')"></span>
            <u-select
              v-model="paymentsStore.formGoToPay.paymentMethodName"
              :placeholder="t(module + '.inputs.paymentMethod.placeholder')"
              size="s"
              :iconOption="true"
              :options="paymentMethodsOptions"
              :full-data="true"
              @fullData="(data) => getDataPayMethods(data)"
            />
          </div>
          <!-- Se debe ir cuando seleccione efectivo -->
          <div class="step3__body-group">
            <span class="u u-star"></span>
            <span v-text="t(module + '.inputs.transactionNumber.label')"></span>
            <u-input
              v-model="paymentsStore.formGoToPay.transactionNumber"
              :placeholder="t(module + '.inputs.transactionNumber.placeholder')"
              size="s"
            />
          </div>
          <div class="step3__body-group">
            <span class="u u-open-book"></span>
            <span v-text="t(module + '.inputs.currency.label')"></span>
            <u-select
              v-model="paymentsStore.formGoToPay.currencyName"
              :options="currenciesOptions"
              :placeholder="t(module + '.inputs.currency.placeholder')"
              :full-data="true"
              @full-data="handleChangeCurrency"
              :disabled="true"
              size="s"
            />
          </div>
          <div class="step3__body-group">
            <span class="u u-calendar"></span>
            <span v-text="t(module + '.inputs.issueDate.label')"></span>
            <u-calendar
              v-model="paymentsStore.formGoToPay.issueDate"
              size="s"
            />
          </div>
          <div class="step3__body-group">
            <span class="u u-calendar"></span>
            <span v-text="t(module + '.inputs.paymentDate.label')"></span>
            <u-calendar
              v-model="paymentsStore.formGoToPay.paymentDate"
              size="s"
            />
          </div>
          <div class="step3__body-group">
            <span class="u u-new-project"></span>
            <span v-text="t(module + '.inputs.reference.label')"></span>
            <u-input
              v-model="paymentsStore.formGoToPay.reference"
              :placeholder="t(module + '.inputs.reference.placeholder')"
              size="s"
            />
          </div>
          <div class="step3__body-group">
            <span class="u u-star"></span>
            <span v-text="t(module + '.inputs.observations.label')"></span>
            <u-textarea
              v-model="paymentsStore.formGoToPay.observations"
              :placeholder="t(module + '.inputs.observations.placeholder')"
              style="height: 100px"
              size="s"
            />
          </div>
        </div>
      </div>
    </div>
    <div class="step3__footer">
      <u-button
        :text="t(buttons + '.back')"
        type="outlined"
        class="mainBtnModify"
        @click="emit('changeStep', false)"
        size="s"
      />
      <u-button
        :text="t(buttons + '.next')"
        class="mainBtnModify"
        @click="nextStep"
        size="s"
        :disabled="invalidForm"
      />
    </div>
  </div>
</template>

<style scoped>
.step3 {
  width: min(80vw, 719px);
  height: min(80vh, 752px);
  display: grid;
  grid-template-rows: auto 1fr auto;
  gap: 16px;
  overflow: hidden;
}

@media only screen and (max-width: 768px) {
  .step3 {
    width: calc(100vw - 40px);
    height: calc(100vh - 40px);
  }
}

/* header */
.step3__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  min-height: 40px;
  flex-shrink: 0;
  width: 100%;
}

.step3__header span {
  font-size: 16px;
  font-weight: 600;
  line-height: 20px;
  letter-spacing: 0em;
  text-align: left;
  color: var(--neutral-text-body);
}

/* body */
.step3__body {
  height: 100%;
  display: grid;
  grid-template-rows: auto 1px 1fr;
  min-height: 0;
  overflow: hidden;
  gap: 24px;
}

.line {
  background-color: var(--neutral-border-subtle);
  height: 1px;
  width: 100%;
}

.step3__body-header {
  height: 44px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.step3__body-header span:nth-child(1) {
  font-weight: 600;
  font-size: 18px;
  line-height: 24px;
  letter-spacing: 0%;
  vertical-align: middle;
  color: var(--neutral-text-body);
}

.step3__body-header span:nth-child(2) {
  font-weight: 600;
  font-size: 16px;
  line-height: 20px;
  letter-spacing: 0%;
  vertical-align: middle;
  color: var(--neutral-text-caption);
}

.step3__body-header .box {
  display: flex;
  flex-direction: column;
}

.step3__body-container {
  height: fit-content;
  display: grid;
  height: 100%;
  grid-template-rows: auto 1fr;
  gap: 24px;
  min-height: 0;
}

.step3__body-form {
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 16px;
  overflow-y: auto;
  scrollbar-gutter: stable both-edges;
}

.step3__body-form::-webkit-scrollbar {
  width: 8px;
  height: 0px;
  background: var(--neutral-surface-light);
  border-radius: 20px;
}
.step3__body-form::-webkit-scrollbar-thumb {
  background: var(--neutral-surface-subtle);
  border-radius: 5px;
}

.step3__body-group {
  display: grid;
  grid-template-columns: 16px 200px 1fr;
  padding-right: 12px;
  gap: 10px;
}

.step3__body-group span {
  font-size: 14px;
  line-height: 18px;
  letter-spacing: 0%;
  vertical-align: middle;
  color: var(--neutral-text-caption);
  height: 32px;
  padding-top: 8px;
}

.step3__body-group span:nth-child(2) {
  font-weight: 600;
}
.subTitle {
  font-weight: 600;
  font-size: 16px;
  line-height: 20px;
  letter-spacing: 0%;
  vertical-align: middle;
  color: var(--neutral-text-body);
}

/* footer */
.step3__footer {
  width: 100%;
  display: flex;
  justify-content: space-between;
}

.file {
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
