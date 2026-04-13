<script setup>
import { defineEmits } from "vue";
import useGlobalStore from "@/stores/global";
import useBankingTransactionsStore from "@/stores/bankingTransactions";
import useDocumentsTrayStore from "@/stores/documentTray";
import useOutcomesStore from "@/stores/outcomes";
import {
  BankingTransactionsDialogSectionsPay,
  BankingTransactionsDialogSectionsPayObservations,
  BankingTransactionsDialogSectionsPayFiles,
  DocumentTrayDialogSectionsDetails,
  DocumentTrayDialogSectionsDetailsFiles,
} from "#components";
import { get } from "@vueuse/core";

/*
::::::::-STORES-:::::::
*/
const globalStore = useGlobalStore();
const bankingTransactionsStore = useBankingTransactionsStore();
const documentsTrayStore = useDocumentsTrayStore();
const outcomesStore = useOutcomesStore();

// Emits
const emit = defineEmits(["closeModal", "reloadDocTray"]);

// Constants
const { t } = useI18n();
const LABEL_KEY = "modules.documentsTray.dialogs.detailsDocument";

const exchangeRateX = ref("0px");
const showMenuERX = ref(false);
const othersCurrency = computed(() => {
  return bankingTransactionsStore?.dataDetailsPayment?.currency?.others ?? [];
});


const matchCurrency = ref([]);

// vars
const tabSelected = ref(0);
const views = {
  0: DocumentTrayDialogSectionsDetails,
  1: DocumentTrayDialogSectionsDetailsFiles,
};
const tabs = computed(() => [
  {
    label: t(LABEL_KEY + ".tabs.tab1"),
    tab: 0,
  },
  {
    label: t(LABEL_KEY + ".tabs.tab2"),
    tab: 1,
  },
]);
const contentView = computed(() => views[tabSelected.value]);

const hasCurrency = computed(() => { // Tiene moneda el pago?
  return !!bankingTransactionsStore?.dataDetailsPayment?.currency;
});

//funtions

const getInfoType = (item) => {
  if (typeof item.isPartialPayment === "boolean") {
    if (item.isPartialPayment === true) {
      // ES ABONO
      return {
        firstAccount: item?.destinationAccount,
        secondAccount: item?.originAccount,
        supplierClient: item?.supplier,
      };
    } else {
      // ES PAGO
      return {
        firstAccount: item?.originAccount,
        secondAccount: item?.destinationAccount,
        supplierClient: item?.supplier,
      };
    }
  }
};
const getNameStatus = (status) => {
  const statusObj = {
    coincidences: {
      label: t(LABEL_KEY + ".statusRelation.coincidence"),
    },
    pending: {
      label: t(LABEL_KEY + ".statusRelation.pending"),
    },
    missingInformation: {
      label: t(LABEL_KEY + ".statusRelation.missingInformation"),
    },
    discarded: {
      label: t(LABEL_KEY + ".statusRelation.discarded"),
    }
  };

  const statusData = statusObj?.[status];

  console.log("statusData", statusData);

  if (!statusData) return { label: "-" };

  return statusData;
};

const handleEsc = (event) => {
  if (event.key === "Escape") {
    emit("closeModal");
  }
};

const handleClickOutside = (event) => {
  const dropdown = document.querySelector(".exchangeRate");
  const btn = document.querySelector(".buttonOC_step3");
  if (
    dropdown &&
    btn &&
    !dropdown.contains(event.target) &&
    !btn.contains(event.target)
  ) {
    showMenuERX.value = false;
  }
};

const normalizeNumber = (value) => {
  if (value === null || value === undefined) return "";

  return String(value)
    .replace(/,/g, "") // elimina todas las comas
    .trim();
};

const othersMap = new Map(
  othersCurrency.value.map((item) => [item.currency, item])
);

onMounted(async () => {
  // POR SI SE MANEJA EN EL FUTURO CURRENCY
  // globalStore.loading = true;
  // const getMyCurrencies = await globalStore.getMyCurrencies();
  // globalStore.loading = false;
  // getMyCurrencies.currencies.unshift(getMyCurrencies.currency);

  // matchCurrency.value = getMyCurrencies.currencies
  //   .filter((item) => othersMap.has(item._id))
  //   .map((item) => {
  //     const other = othersMap.get(item._id);
  //     return {
  //       _id: item._id,
  //       code: item.code,
  //       name: item.name,
  //       valueToday: other?.valueToday ?? null,
  //       valueManual: other?.valueManual ?? null,
  //     };
  //   });

  // exchangeRateX.value = getButtonDistanceFromDivLeft(
  //   "modal-header",
  //   "buttonOC_step3"
  // );
  document.addEventListener("click", handleClickOutside);

  document.addEventListener("keydown", handleEsc);
});

onUnmounted(() => {
  document.removeEventListener("keydown", handleEsc);
});

// const hideModal = () => {
//   if (!lockModal.value) {
//     modalShare.value = false;
//     lockModal.value = false;
//   }
// };
const getButtonDistanceFromDivLeft = (divId, buttonId) => {
  const div = document.getElementById(divId);
  const button = document.getElementById(buttonId);

  if (!div || !button) {
    // console.warn("Div o botón no encontrados");
    return 0;
  }

  const divRect = div.getBoundingClientRect();
  const buttonRect = button.getBoundingClientRect();

  const distance = buttonRect.left - divRect.left;

  return Math.round(distance) + "px";
};

const typeLabel = computed(() => {
  const prop = bankingTransactionsStore?.dataDetailsPayment?.isPartialPayment
    ? "deposit"
    : "pay";
  return t(LABEL_KEY + "." + prop);
});
</script>

<template>
  <div class="modal-content">
    <div class="modal-header" id="modal-header">
      <div class="izq">
        <span class="title">
          {{ t(LABEL_KEY + ".title") }}
        </span>

        <span
          class="status-tag"
          :class="`tag ${documentsTrayStore?.detailsDocumentTray.status}`"
          v-text="
            getNameStatus(documentsTrayStore?.detailsDocumentTray.status)
              .label
          "
        >
        </span>
      </div>

      <u-button-icon
        icon="close"
        class="btnIconModify"
        @action-btn="emit('closeModal')"
        color="--neutral-text-caption"
        type="outlined"
        size="s"
      />
    </div>
    <div class="modal-body">
      <!--DIV 1 SUPERIOR DATA GENERAL DE LA TRANSACCION-->
      <!-- <div class="data-general"> -->
        <!--Referencia-->
        <div class="info-group">
          <span class="label">{{ t(LABEL_KEY + ".labels.label1") }}</span>
          <span
            class="text"
            v-text="
              documentsTrayStore?.detailsDocumentTray?.reference || '-'
            "
          >
          </span>
        </div>
        <!--Creador por-->
        <div class="info-group">
          <span class="label">{{
            t(
              LABEL_KEY + ".labels.label2"
            )
          }}</span>
          <div class="supplier">
            <u-avatar
              :user="{
                name: documentsTrayStore?.detailsDocumentTray?.creator?.user?.data?.legalName,
                src: documentsTrayStore?.detailsDocumentTray?.creator?.user?.imgUrl,
              }"
              :size="24"
            />
            <span
              class="text"
              v-text="
                documentsTrayStore?.detailsDocumentTray?.creator?.user?.data?.legalName || '-'
              "
            ></span>
          </div>
        </div>
        <!--Tipo de documento-->
        <div class="info-group">
          <span class="label">{{ t(LABEL_KEY + ".labels.label3") }}</span>
            <u-tags size="xs" :text="documentsTrayStore?.detailsDocumentTray?.documentType?.code || '-'" background="--neutral-surface-light" color="--neutral-text-caption" :delete="false" max-width="40px" style="width: max-content;" />
        </div>
      <!-- </div> -->
      <!--DIV 2 INFERIOR DATA-->
      <!-- <div class="data-bank"> -->
        <!--Numero de documento -->
        <div class="info-group">
          <span class="label">{{ t(LABEL_KEY + ".labels.label4") }}</span>
          <span
            class="text"
            v-text="
              documentsTrayStore?.detailsDocumentTray?.documentNumber ||
              '-'
            "
          ></span>
        </div>
        <!--Proveedor-->
        <div class="info-group">
          <span class="label">{{ t(LABEL_KEY + ".labels.label5") }}</span>
            <div class="supplier">
            <u-avatar
              :user="{
                name: documentsTrayStore?.detailsDocumentTray?.supplier?.data?.legalName,
                src: documentsTrayStore?.detailsDocumentTray?.supplier?.imgUrl,
              }"
              :size="24"
            />
            <span
              class="text"
              v-text="
                documentsTrayStore?.detailsDocumentTray?.supplier?.data?.legalName || '-'
              "
            ></span>
          </div>
        </div>
        <!--Moneda-->
        <div class="info-group">
          <span class="label">{{
            t(
              LABEL_KEY +".labels.label6"
            )
          }}</span>
          <span
            class="text"
            v-text="
              documentsTrayStore?.detailsDocumentTray?.currency?.default?.name?.[globalStore.lang] ||
              '-'
            "
          ></span>
        </div>
        <!--Fechas-->
        <div class="info-group date-group">
          <span class="label">{{ t(LABEL_KEY + ".labels.label7") }}</span>
          <div class="date">
            <div>
              <span>{{ t(LABEL_KEY + ".labels.label8") }}</span>
              <span
                v-text="
                  transformedDate(
                    documentsTrayStore?.detailsDocumentTray?.issueDate
                  )
                "
              ></span>
            </div>
            <div>
              <span>{{
                t(
                  LABEL_KEY +
                    ".labels.label9"
                )
              }}</span>
              <span
                v-text="
                  transformedDate(
                    documentsTrayStore?.detailsDocumentTray?.dateReceived
                  )
                "
              ></span>
            </div>
          </div>
        </div>
      <!-- </div> -->
    </div>

    <u-tabs class="tabs" :tabs="tabs" v-model="tabSelected" />
    <component v-if="contentView" :is="contentView" />
  </div>

  <!-- Compartir -->
  <!-- <u-dialog
    :showModal="modalShare"
    :lockModal="lockModal"
    @closeModal="hideModal"
    width="auto"
    height="auto"
    :persistent="true"
  >
    <OutcomesDialogShare @closeModal="hideModal" module="payment" />
  </u-dialog> -->
</template>

<style scoped>
.modal-content {
  width: 700px;
  height: 90vh;
  display: grid;
  grid-template-rows: 40px auto auto 1fr;
  gap: 16px;
}

/* header */
.modal-header {
  display: grid;
  grid-template-columns: auto 35px; /* texto - tag - botón */
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  height: 40px;
  width: 100%;
}

.modal-header .izq {
  display: grid;
  grid-template-columns: auto auto auto auto;
  align-items: center;
  position: relative;
  gap: 10px;
  width: 100%;
}

.modal-header .title {
  font-size: 16px;
  font-weight: 600;
  line-height: 20px;
  color: var(--secondary-text-default);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.modal-header span {
  font-size: 16px;
  font-weight: 600;
  line-height: 20px;
  letter-spacing: 0em;
  text-align: left;
  color: var(--neutral-text-body);
}

.modal-header .status-tag {
  justify-self: center;
}

.modal-header .btnIconModify {
  justify-self: end;
}

/* body */
.modal-body {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.modal-body .info-group {
  display: grid;
  grid-template-columns: 150px 1fr;
  gap: 24px;
  align-items: center;
  height: 28px;
}
.modal-body span.label {
  font-weight: 600;
  font-size: 14px;
  line-height: 18px;
  letter-spacing: 0%;
  vertical-align: middle;
  color: var(--neutral-text-caption);
}
.modal-body span.text {
  display: flex;
  align-items: center;
  height: 100%;
  font-weight: 600;
  font-size: 14px;
  letter-spacing: 0%;
  vertical-align: middle;
  color: var(--neutral-text-body);
}
.modal-body .info-group .supplier {
  display: flex;
  gap: 10px;
  align-items: center;
}
.date-group {
  height: 48px !important;
  align-items: flex-start !important;
}
.date-group span.label {
  padding-top: 7px;
}
.modal-body .info-group .date {
  width: 100%;
  border: 1px solid var(--neutral-border-subtle);
  border-radius: 8px;
  height: 48px;
  padding: 6px 12px;
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 24px;
}
.modal-body .info-group .date div {
  display: flex;
  flex-direction: column;
  padding-top: 1px;
}
.modal-body .info-group .date div span:nth-child(1) {
  font-weight: 600;
  font-size: 14px;
  line-height: 16px;
  letter-spacing: 0%;
  vertical-align: middle;
  color: var(--neutral-text-caption);
}
.modal-body .info-group .date div span:nth-child(2) {
  font-weight: 600;
  font-size: 14px;
  line-height: 18px;
  letter-spacing: 0%;
  vertical-align: middle;
  color: var(--neutral-text-body);
}
.modal-body .info-group .date div:not(:last-child) {
  border-right: 1px solid var(--neutral-border-subtle);
}

.data-general {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 16px;
  /* border: 1px solid var(--neutral-border-subtle); */
  border-radius: 8px;
  /* background-color: var(--neutral-background-light); */
}

.data-bank {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 16px;
  /* border: 1px solid var(--neutral-border-subtle); */
  border-radius: 8px;
  /* background-color: var(--neutral-background-light); */
}

.tag {
  font-size: 12px !important;
  padding: 4px 12px;
  border-radius: 20px;
  font-weight: 600;
  margin-left: 10px;
}
.coincidences {
  color: var(--info-text-darker) !important;
  background-color: var(--info-surface-shadow-12a) !important;
}
.dimissed {
  color: var(--neutral-text-caption) !important;
  background-color: var(--success-surface-shadow-12a) !important;
}
.pending {
  color: var(--warning-text-darker) !important;
  background-color: var(--warning-surface-shadow-12a) !important;
}
.missingInformation {
  color: var(--danger-text-darker) !important;
  background-color: var(--danger-surface-shadow-12a) !important;
}

/* CUSTOM COMPONENTS 

/* MODIFY */
.btnIconModify {
  border-radius: 50%;
  color: var(--bg-neutral-500);
}

.mainBtnModify {
  width: 135px;
}

/* TASA DE CAMBIO */
/* Exchange Rate */
.exchangeRate {
  width: 320px;
  height: auto;
  position: absolute;
  background-color: var(--neutral-background-default);
  border-radius: 12px;
  box-shadow: var(--elevation-l);
  top: 32px;
  left: v-bind("exchangeRateX");
  padding: 16px;
  transform-origin: top left;
  transform: scale(v-bind("showMenuERX ? 1 : 0"));
  transition: 0.3s;
}
.exhangeRate__list {
  display: grid;
  row-gap: 12px;
  overflow: auto;
  width: 288px;
  max-height: 170px;
  padding-right: 2px;
}
.exhangeRate__list::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}
.exhangeRate__list::-webkit-scrollbar-thumb {
  background-color: var(--neutral-border-subtle);
  border-radius: 5px;
}
.exhangeRate__list::-webkit-scrollbar-track {
  background-color: var(--neutral-border-darker);
  border-radius: 5px;
}
.exchangeRate__op {
  display: grid;
  grid-template-columns: auto 1fr 100px;
  gap: 12px;
  align-items: center;
}
.exchangeRate__op div.tag {
  height: 24px;
  border: 1px solid var(--secondary-border-subtle);
  border-radius: 8px;
  background-color: var(--secondary-surface-softer);
  display: flex;
  align-items: center;
  padding: 0 4px;
}
.exchangeRate__op div.tag span {
  font-weight: 600;
  font-size: 14px;
  line-height: 14px;
  letter-spacing: 0%;
  vertical-align: middle;
  color: var(--secondary-text-darker);
}
.exchangeRate__op span.label {
  font-weight: 600;
  font-size: 12px;
  line-height: 12px;
  letter-spacing: 0%;
  vertical-align: middle;
  color: var(--neutral-text-body);
}
.exchangeRate__op input {
  border: 1px solid var(--neutral-border-subtle);
  border-radius: 8px;
  transition: 0.3s;
  font-weight: 400;
  font-size: 14px;
  line-height: 14px;
  letter-spacing: 0%;
  vertical-align: middle;
  color: var(--neutral-text-body);
  text-align: end;
  padding: 0 8px;
}
.exchangeRate__op input:hover {
  border: 1px solid var(--primary-border-subtle);
}
.exchangeRate__op input[type="number"]::-webkit-inner-spin-button,
.exchangeRate__op input[type="number"]::-webkit-outer-spin-button {
  -webkit-appearance: none;
  margin: 0;
}
.exchangeRate__op input::selection {
  background-color: var(--primary-text-subtle);
  color: var(--neutral-background-default);
}
.noData {
  color: var(--neutral-text-caption) !important;
  height: 40px;
  font-size: 14px !important;
  line-height: 14px !important;
  width: 100%;
  text-align: center !important;
  padding-top: 18px;
}
</style>
