<script setup>
import { defineEmits } from "vue";
import useGlobalStore from "@/stores/global";
import useBankingTransactionsStore from "@/stores/bankingTransactions";
import {
  BankingTransactionsDialogSectionsFlowSaleDocDetails,
  BankingTransactionsDialogSectionsFlowSaleDocObservations,
  BankingTransactionsDialogSectionsFlowSaleDocFiles,
} from "#components";
import { get } from "@vueuse/core";

/*
::::::::-STORES-:::::::
*/
const globalStore = useGlobalStore();
const bankingTransactionsStore = useBankingTransactionsStore();

// Emits
const emit = defineEmits(["closeModal", "showModal"]);

// Constants
const { t } = useI18n();
const colorBtn = "--neutral-text-caption";
const LABEL_KEY = "modules.bankingTransactions.modals.detailsFlowSaleDoc";
const showMenuERX = ref(false);
const exchangeRateX = ref("0px");

// vars
const tabSelected = ref(0);
const views = {
  0: BankingTransactionsDialogSectionsFlowSaleDocDetails,
  1: BankingTransactionsDialogSectionsFlowSaleDocObservations,
  2: BankingTransactionsDialogSectionsFlowSaleDocFiles,
};

// COMPUTED
const tabs = computed(() => [
  {
    label: t(LABEL_KEY + ".tabs.tab1"),
    tab: 0,
  },
  {
    label: t(LABEL_KEY + ".tabs.tab2"),
    tab: 1,
  },
  {
    label: t(LABEL_KEY + ".tabs.tab3"),
    tab: 2,
  },
]);
const contentView = computed(() => views[tabSelected.value]);
const hasCurrency = computed(() => {
  // Tiene moneda el pago?
  return !!bankingTransactionsStore?.dataDetailsFlowsSalesDoc?.currency;
});

//funtions

const getInfoType = (item) => {
  if (typeof item.isRefund === "boolean") {
    if (item.isRefund === true) {
      // ES DEVOLUCION
      return {
        firstAccount: item?.originAccount,
        secondAccount: item?.destinationAccount,
        supplierClient: item?.client,
      };
    } else {
      // ES COBRO
      return {
        firstAccount: item?.destinationAccount,
        secondAccount: item?.originAccount,
        supplierClient: item?.client,
      };
    }
  }
};
const getNameStatus = (status) => {
  const statusObj = {
    reconciled: {
      label: {
        es: "Conciliado",
        en: "Reconciled",
      },
      title: {
        es: "Con transacción bancaria asociada",
        en: "With associated bank transaction",
      },
    },
    unreconciled: {
      label: {
        es: "No Conciliado",
        en: "Unreconciled",
      },
      title: {
        es: "Sin transacción bancaria asociada",
        en: "Without associated bank transaction",
      },
    },
    voided: {
      label: {
        es: "Anulado",
        en: "Voided",
      },
      title: {
        es: "Anulado",
        en: "Voided",
      },
    },
  };

  const lang = globalStore.lang;
  const statusData = statusObj?.[status];

  if (!statusData) return { label: "-", title: "-" };

  return {
    label: statusData.label[lang] || "-",
    title: statusData.title[lang] || "-",
  };
};

const handleEsc = (event) => {
  if (event.key === "Escape") {
    emit("closeModal");
  }
};

const handleClickOutside = (event) => {
  const dropdown = document.querySelector(".exchangeRate");
  const btn = document.querySelector(".buttonEX");
  if (
    dropdown &&
    btn &&
    !dropdown.contains(event.target) &&
    !btn.contains(event.target)
  ) {
    showMenuERX.value = false;
  }
};

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

onMounted(async () => {
  document.addEventListener("click", handleClickOutside);
  document.addEventListener("keydown", handleEsc);
  await nextTick();

  requestAnimationFrame(() => {
    exchangeRateX.value = getButtonDistanceFromDivLeft(
      "modal-header",
      "buttonEX",
    );
  });
});

onUnmounted(() => {
  document.removeEventListener("click", handleClickOutside);
  document.removeEventListener("keydown", handleEsc);
});

// const hideModal = () => {
//   if (!lockModal.value) {
//     modalShare.value = false;
//     lockModal.value = false;
//   }
// };

const typeLabel = computed(() => {
  const prop = bankingTransactionsStore.dataDetailsFlowsSalesDoc.isRefund
    ? "refund"
    : "charges";
  return t(LABEL_KEY + "." + prop);
});
</script>

<template>
  <div class="modal-content">
    <div class="modal-header" id="modal-header">
      <div class="izq">
        <span class="title">
          {{ t(LABEL_KEY + ".title", { typeFlowSaleDoc: typeLabel }) }}
        </span>

        <span
          class="status-tag"
          :class="`tag ${bankingTransactionsStore.dataDetailsFlowsSalesDoc.status}`"
          v-text="
            getNameStatus(
              bankingTransactionsStore.dataDetailsFlowsSalesDoc.status,
            ).label
          "
          :title="
            getNameStatus(
              bankingTransactionsStore.dataDetailsFlowsSalesDoc.status,
            ).title
          "
        >
        </span>
        <u-button-icon
          icon="share"
          type="outlined"
          :color="colorBtn"
          :disabled="true"
          size="s"
          @click="emit('showModal')"
        />

        <ComponentsExchangeRateViewer
          v-if="hasCurrency"
          v-model="showMenuERX"
          :currencies="
            bankingTransactionsStore?.dataDetailsFlowsSalesDoc?.currency?.others
          "
        />
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
      <div class="data-general">
        <!--Referencia-->
        <div class="info-group">
          <span class="label">{{ t(LABEL_KEY + ".labels.label1") }}</span>
          <span
            class="text"
            v-text="
              bankingTransactionsStore.dataDetailsFlowsSalesDoc.reference || '-'
            "
          >
          </span>
        </div>
        <!--Emisor-->
        <div class="info-group">
          <span class="label">{{
            t(
              LABEL_KEY +
                ".labels." +
                `${
                  bankingTransactionsStore.dataDetailsFlowsSalesDoc.isRefund
                    ? "label2"
                    : "label2"
                }`,
            )
          }}</span>
          <div class="supplier">
            <u-avatar
              :user="{
                name: bankingTransactionsStore.dataDetailsFlowsSalesDoc.creator
                  ?.legalName,
                src: bankingTransactionsStore.dataDetailsFlowsSalesDoc.creator
                  ?.imgUrl,
              }"
              :size="24"
            />
            <span
              class="text"
              v-text="
                bankingTransactionsStore.dataDetailsFlowsSalesDoc.creator
                  ?.legalName || '-'
              "
            ></span>
          </div>
        </div>
        <!--Modalidad-->
        <div class="info-group">
          <span class="label">{{ t(LABEL_KEY + ".labels.label6") }}</span>
          <span
            class="text"
            v-text="
              bankingTransactionsStore.dataDetailsFlowsSalesDoc.paymentMethod
                ?.name?.[globalStore.lang]
            "
          ></span>
        </div>
        <div class="info-group">
          <span class="label">{{ t(LABEL_KEY + ".labels.label14") }}</span>
          <span
            class="text"
            v-text="
              bankingTransactionsStore?.dataDetailsFlowsSalesDoc?.currency
                ?.default?.name?.[globalStore.lang] || '-'
            "
          ></span>
        </div>
        <div class="info-group date-group">
          <span class="label">{{ t(LABEL_KEY + ".labels.label8") }}</span>
          <div class="date">
            <div>
              <span>{{ t(LABEL_KEY + ".labels.label9") }}</span>
              <span
                v-text="
                  transformedDate(
                    bankingTransactionsStore.dataDetailsFlowsSalesDoc.issueDate,
                  )
                "
              ></span>
            </div>
            <div>
              <span>{{ t(LABEL_KEY + ".labels.label10") }}</span>
              <span
                v-text="
                  transformedDate(
                    bankingTransactionsStore.dataDetailsFlowsSalesDoc
                      .chargeDate,
                  )
                "
              ></span>
            </div>
          </div>
        </div>
      </div>
      <!--DIV 2 INFERIOR DATA BANCARIA: isPartialPayment (abono: true, pago: false)-->
      <div class="data-bank">
        <!--Cuenta de destino ( abono y cobro ) Cuenta de origen ( pago y devolucion )-->
        <div class="info-group">
          <span class="label">{{
            t(
              LABEL_KEY +
                ".labels." +
                `${
                  bankingTransactionsStore.dataDetailsFlowsSalesDoc.isRefund
                    ? "label5"
                    : "label3"
                }`,
            )
          }}</span>
          <div class="supplier">
            <u-avatar
              :user="{
                name: getInfoType(
                  bankingTransactionsStore?.dataDetailsFlowsSalesDoc,
                )?.firstAccount?.bank?.name,
                src: getInfoType(
                  bankingTransactionsStore?.dataDetailsFlowsSalesDoc,
                )?.firstAccount?.bank?.imgUrl,
              }"
              :size="24"
            />
            <span class="text">
              {{
                getInfoType(bankingTransactionsStore?.dataDetailsFlowsSalesDoc)
                  ?.firstAccount?.owner?.name || "-"
              }}
              <strong
                >({{
                  getInfoType(
                    bankingTransactionsStore?.dataDetailsFlowsSalesDoc,
                  )
                    ?.firstAccount?.accountNumber?.slice(-4)
                    .padStart(6, "•")
                    .split("")
                    .join(" ") || "-"
                }})</strong
              >
            </span>
          </div>
        </div>
        <!--Numero de transferencia-->
        <div class="info-group">
          <span class="label">{{ t(LABEL_KEY + ".labels.label7") }}</span>
          <span
            class="text"
            v-text="
              bankingTransactionsStore.dataDetailsFlowsSalesDoc
                .transactionNumber || '-'
            "
          ></span>
        </div>
        <!--cliente <cobro devolucion> Proveedor<pago abono>-->
        <div class="info-group">
          <span class="label">{{ t(LABEL_KEY + ".labels.label12") }}</span>
          <div class="supplier">
            <u-avatar
              :user="{
                name: bankingTransactionsStore.dataDetailsFlowsSalesDoc.client
                  ?.data?.legalName,
                src: bankingTransactionsStore.dataDetailsFlowsSalesDoc.client
                  ?.imgUrl,
              }"
              :size="24"
            />
            <span
              class="text"
              v-text="
                bankingTransactionsStore.dataDetailsFlowsSalesDoc.client?.data
                  ?.legalName || '-'
              "
            ></span>
          </div>
        </div>
        <!--Cuenta origen <abono cobro> Cuenta destino<pago devolucion>-->
        <div class="info-group">
          <span class="label">{{
            t(
              LABEL_KEY +
                ".labels." +
                `${bankingTransactionsStore.dataDetailsFlowsSalesDoc.isRefund ? "label3" : "label5"}`,
            )
          }}</span>
          <div
            class="supplier"
            v-if="
              bankingTransactionsStore.dataDetailsFlowsSalesDoc
                .destinationAccount
            "
          >
            <!-- <u-avatar
              :user="{
                name: bankingTransactionsStore?.dataDetailsFlowsSalesDoc
                  ?.destinationAccount?.bank?.name,
                src: bankingTransactionsStore?.dataDetailsFlowsSalesDoc
                  ?.destinationAccount?.bank?.imgUrl,
              }"
              :size="24"
            /> -->
            <u-avatar
              :user="{
                name: getInfoType(
                  bankingTransactionsStore?.dataDetailsFlowsSalesDoc,
                )?.secondAccount?.bank?.name,
                src: getInfoType(
                  bankingTransactionsStore?.dataDetailsFlowsSalesDoc,
                )?.secondAccount?.bank?.imgUrl,
              }"
              :size="24"
            />
            <span class="text">
              {{
                getInfoType(bankingTransactionsStore?.dataDetailsFlowsSalesDoc)
                  ?.secondAccount?.owner?.name || "-"
              }}
              <strong
                >({{
                  getInfoType(
                    bankingTransactionsStore?.dataDetailsFlowsSalesDoc,
                  )
                    ?.secondAccount?.accountNumber?.slice(-4)
                    .padStart(6, "•")
                    .split("")
                    .join(" ") || "-"
                }})</strong
              >
            </span>
          </div>
          <span v-else>-</span>
        </div>
      </div>
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
  height: 80vh;
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
  position: relative;
  align-items: center;
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
.modal-body span.text strong {
  font-size: 10px;
  color: var(--neutral-text-caption);
  margin: 2px 0 0 5px;
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
  border: 1px solid var(--neutral-border-subtle);
  border-radius: 8px;
  /* background-color: var(--neutral-background-light); */
}

.data-bank {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 16px;
  border: 1px solid var(--neutral-border-subtle);
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
.reconciled {
  color: var(--success-text-darker) !important;
  background-color: var(--success-surface-shadow-12a) !important;
}
.unreconciled {
  color: var(--warning-text-darker) !important;
  background-color: var(--warning-surface-shadow-12a) !important;
}
.voided {
  color: var(--danger-text-darker) !important;
  background-color: var(--danger-surface-shadow-12a) !important;
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

.exchangeRate__op span:nth-child(3) {
  display: flex;
  align-items: center;
  justify-content: flex-end;
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

/* CUSTOM COMPONENTS - MODIFY */
.btnIconModify {
  border-radius: 50%;
  color: var(--bg-neutral-500);
}

.mainBtnModify {
  width: 135px;
}
</style>
