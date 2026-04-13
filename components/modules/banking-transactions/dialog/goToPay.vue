<script setup>
import { defineEmits } from "vue";
import useGlobalStore from "@/stores/global";
import useBankingTransactionsStore from "@/stores/bankingTransactions";
import useOutcomesStore from "@/stores/outcomes";
import {
  BankingTransactionsDialogSectionsPay,
  BankingTransactionsDialogSectionsPayObservations,
  BankingTransactionsDialogSectionsPayFiles,
} from "#components";

/*
::::::::-STORES-:::::::
*/
const globalStore = useGlobalStore();
const bankingTransactionsStore = useBankingTransactionsStore();
const outcomesStore = useOutcomesStore();

// Emits
const emit = defineEmits(["closeModal", "showModal"]);

// Constants
const { t } = useI18n();
const module = "modules.outcomes.pages.oc.modals.buy.step3";
const colorBtn = "--neutral-text-caption";
const LABEL_KEY = "modules.outcomes.pages.oc.modals.viewPay";

const exchangeRateX = ref("0px");
const showMenuERX = ref(false);
const othersCurrency = computed(() => {
  return bankingTransactionsStore?.dataDetailsPayment?.currency?.others ?? [];
});

const matchCurrency = ref([]);

// vars
const tabSelected = ref(0);
const views = {
  0: BankingTransactionsDialogSectionsPay,
  1: BankingTransactionsDialogSectionsPayObservations,
  2: BankingTransactionsDialogSectionsPayFiles,
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
  {
    label: t(LABEL_KEY + ".tabs.tab3"),
    tab: 2,
  },
]);
const contentView = computed(() => views[tabSelected.value]);

const hasCurrency = computed(() => {
  // Tiene moneda el pago?
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
  othersCurrency.value.map((item) => [item.currency, item]),
);

onMounted(async () => {
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
          {{ t(LABEL_KEY + ".title", { typePay: typeLabel }) }}
        </span>

        <span
          class="status-tag"
          :class="`tag ${bankingTransactionsStore?.dataDetailsPayment?.status}`"
          v-text="
            getNameStatus(bankingTransactionsStore?.dataDetailsPayment?.status)
              .label
          "
          :title="
            getNameStatus(bankingTransactionsStore?.dataDetailsPayment?.status)
              .title
          "
        >
        </span>
        <u-button-icon
          icon="share"
          type="outlined"
          :color="colorBtn"
          size="s"
          @click="emit('showModal')"
        />
        <ComponentsExchangeRateViewer
          v-model="showMenuERX"
          :currencies="
            bankingTransactionsStore?.dataDetailsPayment?.currency?.others
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
              bankingTransactionsStore?.dataDetailsPayment?.reference || '-'
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
                  bankingTransactionsStore?.dataDetailsPayment?.isPartialPayment
                    ? "label2"
                    : "label2"
                }`,
            )
          }}</span>
          <div class="supplier">
            <u-avatar
              :user="{
                name: bankingTransactionsStore?.dataDetailsPayment?.createdBy
                  ?.legalName,
                src: bankingTransactionsStore?.dataDetailsPayment?.createdBy
                  ?.imgUrl,
              }"
              :size="24"
            />
            <span
              class="text"
              v-text="
                bankingTransactionsStore?.dataDetailsPayment?.createdBy
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
              bankingTransactionsStore?.dataDetailsPayment?.paymentMethod
                ?.name?.[globalStore.lang]
            "
          ></span>
        </div>
        <!--Moneda-->
        <div
          class="info-group"
          v-if="!bankingTransactionsStore?.dataDetailsPayment?.isPartialPayment"
        >
          <span class="label">{{ t(LABEL_KEY + ".labels.label14") }}</span>
          <span
            class="text"
            v-text="
              bankingTransactionsStore?.dataDetailsPayment?.currency?.default
                ?.name?.[globalStore.lang] || '-'
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
                    bankingTransactionsStore?.dataDetailsPayment?.issueDate,
                  )
                "
              ></span>
            </div>
            <div>
              <span>{{
                t(
                  LABEL_KEY +
                    ".labels." +
                    `${
                      bankingTransactionsStore?.dataDetailsPayment
                        ?.isPartialPayment
                        ? "label13"
                        : "label10"
                    }`,
                )
              }}</span>
              <span
                v-text="
                  transformedDate(
                    bankingTransactionsStore.dataDetailsPayment.paymentDate,
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
                  bankingTransactionsStore?.dataDetailsPayment?.isPartialPayment
                    ? "label5"
                    : "label3"
                }`,
            )
          }}</span>
          <div class="supplier">
            <u-avatar
              :user="{
                name: getInfoType(bankingTransactionsStore?.dataDetailsPayment)
                  ?.firstAccount?.bank?.name,
                src: getInfoType(bankingTransactionsStore?.dataDetailsPayment)
                  ?.firstAccount?.bank?.imgUrl,
              }"
              :size="24"
            />
            <span class="text">
              {{
                getInfoType(bankingTransactionsStore?.dataDetailsPayment)
                  ?.firstAccount?.owner?.name || "-"
              }}
              <strong
                >({{
                  getInfoType(bankingTransactionsStore?.dataDetailsPayment)
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
              bankingTransactionsStore?.dataDetailsPayment?.transactionNumber ||
              '-'
            "
          ></span>
        </div>
        <!--cliente <cobro devolucion> Proveedor<pago abono>-->
        <div class="info-group">
          <span class="label">{{ t(LABEL_KEY + ".labels.label12") }}</span>
          <div class="supplier">
            <u-avatar
              :user="{
                name: bankingTransactionsStore?.dataDetailsPayment?.supplier
                  ?.data?.legalName,
                src: bankingTransactionsStore?.dataDetailsPayment?.supplier
                  ?.imgUrl,
              }"
              :size="24"
            />
            <span
              class="text"
              v-text="
                bankingTransactionsStore?.dataDetailsPayment?.supplier?.data
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
                `${
                  bankingTransactionsStore?.dataDetailsPayment?.isPartialPayment
                    ? "label3"
                    : "label5"
                }`,
            )
          }}</span>
          <div
            class="supplier"
            v-if="
              bankingTransactionsStore?.dataDetailsPayment?.destinationAccount
            "
          >
            <u-avatar
              :user="{
                name: getInfoType(bankingTransactionsStore?.dataDetailsPayment)
                  ?.secondAccount?.bank?.name,
                src: getInfoType(bankingTransactionsStore?.dataDetailsPayment)
                  ?.secondAccount?.bank?.imgUrl,
              }"
              :size="24"
            />
            <span class="text">
              {{
                getInfoType(bankingTransactionsStore?.dataDetailsPayment)
                  ?.secondAccount?.owner?.name || "-"
              }}
              <strong
                >({{
                  getInfoType(bankingTransactionsStore?.dataDetailsPayment)
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

/* CUSTOM COMPONENTS 

/* MODIFY */
.btnIconModify {
  border-radius: 50%;
  color: var(--bg-neutral-500);
}

.mainBtnModify {
  width: 135px;
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
