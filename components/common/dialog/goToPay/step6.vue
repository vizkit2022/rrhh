<script setup>
import { defineEmits, computed, defineProps } from "vue";
import usePaymentsStore from "@/stores/payments";
import useGlobalStore from "@/stores/global";
import {
  DialogGoToPaySectionsPay,
  DialogGoToPaySectionsObservations,
  DialogGoToPaySectionsFiles,
} from "#components";

// Stores
const paymentsStore = usePaymentsStore();
const globalStore = useGlobalStore();

const views = {
  0: DialogGoToPaySectionsPay,
  1: DialogGoToPaySectionsObservations,
  2: DialogGoToPaySectionsFiles,
};

const contentView = computed(() => views[tabSelected.value]);

// Emits
const emit = defineEmits(["closeModal", "changeStep"]);

// Props
const props = defineProps({
  initTab: {
    type: Number,
    default: 2,
  },
});

// Constants
const color = "--neutral-text-caption";
const { t } = useI18n();
const module = "modules.outcomes.pages.oc.modals.goToPay.step6";

// Vars
const tabSelected = ref(0);
const modalShare = ref(false);
const lockModal = ref(false);
const tabs = computed(() => [
  {
    label: t(module + ".tabs.tab1"),
    icon: "",
    tab: 0,
    indicator: false,
    disabled: false,
    main: false,
  },
  {
    label: t(module + ".tabs.tab2"),
    icon: "",
    tab: 1,
    indicator: false,
    disabled: false,
    main: false,
  },
  {
    label: t(module + ".tabs.tab3"),
    icon: "",
    tab: 2,
    indicator: false,
    disabled: false,
    main: false,
  },
]);

// Computada
const status = computed(() => {
  const st = paymentsStore?.payment?.status;
  return st || "-";
});

// Functions
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

const hideModal = () => {
  if (!lockModal.value) {
    emit("closeModal");
  }
};

const hideModalShare = () => {
  if (!lockModal.value) {
    modalShare.value = false;
  }
}

//ESCAPE
const handleEscClose = (e) => {
  if (e.key === "Escape") {
    emit("closeModal");
  }
};

onMounted(() => {
  window.addEventListener("keyup", handleEscClose);
});

onUnmounted(() => {
  window.removeEventListener("keyup", handleEscClose);
});
</script>

<template>
  <div class="step6">
    <!-- <div class="step6__header">
      <div class="izq">
        <span class="title truncateText"> N° {{ t(module + ".title") }} </span>

        <span
          class="status-tag"
          :class="`tag ${paymentsStore?.payment?.status}`"
          v-text="getNameStatus(paymentsStore?.payment?.status).label"
          :title="getNameStatus(paymentsStore?.payment?.status).title"
        >
        </span>
      </div>

      <u-button-icon
        icon="close"
        class="btnIconModify"
        :color="color"
        @action-btn="emit('closeModal')"
        type="outlined"
        size="s"
      />
    </div> -->
          <BankingTransactionsDialogGoToPay
      @closeModal="emit('closeModal')"
      @showModal="modalShare = true"
    />
    <!-- <div class="step6__body">
      <div class="group">
        <span class="label" v-text="t(module + '.labels.label1')"></span>
        <span
          class="text"
          v-text="paymentsStore?.payment?.reference || '-'"
        ></span>
      </div>
      <div class="group">
        <span class="label" v-text="t(module + '.labels.label2')"></span>
        <div class="supplier">
          <u-avatar
            :user="{
              name: paymentsStore?.payment?.createdBy?.legalName,
              src: paymentsStore?.payment?.createdBy?.imgUrl,
            }"
            :size="24"
          />
          <span
            class="text"
            v-text="paymentsStore?.payment?.createdBy?.legalName || '-'"
          ></span>
        </div>
      </div>
      <div class="group">
        <span class="label" v-text="t(module + '.labels.label3')"></span>
        <div class="supplier">
          <u-avatar
            :user="{
              name: paymentsStore?.payment?.originAccount?.bank?.name,
              src: paymentsStore?.payment?.originAccount?.bank?.imgUrl,
            }"
            :size="24"
          /><span
            class="text"
            v-text="paymentsStore?.payment?.originAccount?.bank?.name || '-'"
          ></span>
        </div>
      </div>
      <div class="group">
        <span class="label" v-text="t(module + '.labels.label4')"></span>
        <div class="supplier">
          <u-avatar
            :user="{
              name: paymentsStore?.payment?.supplier?.data?.legalName,
              src: paymentsStore?.payment?.supplier?.imgUrl,
            }"
            :size="24"
          />
          <span
            class="text"
            v-text="paymentsStore?.payment?.supplier?.data?.legalName || '-'"
          ></span>
        </div>
      </div>
      <div class="group">
        <span class="label" v-text="t(module + '.labels.label5')"></span>
        <div class="supplier">
          <u-avatar
            :user="{
              name: paymentsStore?.payment?.destinationAccount?.bank?.name,
              src: paymentsStore?.payment?.destinationAccount?.bank?.imgUrl,
            }"
            :size="24"
          /><span
            class="text"
            v-text="
              paymentsStore?.payment?.destinationAccount?.bank?.name || '-'
            "
          ></span>
        </div>
      </div>
      <div class="group">
        <span class="label" v-text="t(module + '.labels.label6')"></span>
        <span
          class="text"
          v-text="
            paymentsStore?.payment?.paymentMethod?.name?.[globalStore.lang]
          "
        ></span>
      </div>
      <div class="group">
        <span class="label" v-text="t(module + '.labels.label7')"></span>
        <span
          class="text"
          v-text="paymentsStore?.payment?.transactionNumber || '-'"
        ></span>
      </div>
      <div class="group groudDate">
        <span class="label" v-text="t(module + '.labels.label8')"></span>
        <div class="date">
          <div>
            <span v-text="t(module + '.labels.label9')"></span>
            <span
              v-text="transformedDate(paymentsStore.payment.issueDate)"
            ></span>
          </div>
          <div>
            <span v-text="t(module + '.labels.label10')"></span>
            <span
              v-text="transformedDate(paymentsStore.payment.paymentDate)"
            ></span>
          </div>
        </div>
      </div>
    </div> -->
    <!-- <u-tabs class="tabs" :tabs="tabs" v-model="tabSelected" />
    <component v-if="contentView" :is="contentView" :initTab="initTab" /> -->
  </div>
      <!-- Compartir -->
<Teleport to="body">
  <u-dialog
    :showModal="modalShare"
    :lockModal="lockModal"
    @closeModal="hideModal"
    width="auto"
    height="auto"
    :persistent="true"
  >
    <OutcomesDialogShare
      @closeModal="hideModalShare"
      module="payment"
    />
  </u-dialog>
</Teleport>

</template>

<style scoped>
.step6 {
  width: 700px;
  height: 80vh;
  display: grid;
  grid-template-rows: auto 1fr;
  gap: 16px;
}

/* header */
.step6__header {
  display: grid;
  grid-template-columns: auto 35px;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  height: 40px;
  width: 100%;
}

.step6__header .izq {
  display: grid;
  grid-template-columns: auto auto;
  align-items: center;
  gap: 10px;
  width: 100%;
}

.step6__header .title {
  font-size: 16px;
  font-weight: 600;
  line-height: 20px;
  color: var(--secondary-text-default);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.step6__header span {
  font-size: 16px;
  font-weight: 600;
  line-height: 20px;
  letter-spacing: 0em;
  text-align: left;
  color: var(--neutral-text-body);
}

/* body */
.step6__body {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.step6__body .group {
  display: grid;
  grid-template-columns: 150px 1fr;
  gap: 24px;
  align-items: center;
  height: 28px;
}
.step6__body span.label {
  font-weight: 600;
  font-size: 14px;
  line-height: 18px;
  letter-spacing: 0%;
  vertical-align: middle;
  color: var(--neutral-text-caption);
}
.step6__body span.text {
  font-weight: 600;
  font-size: 14px;
  line-height: 18px;
  letter-spacing: 0%;
  vertical-align: middle;
  color: var(--neutral-text-body);
}
.step6__body .group .supplier {
  display: flex;
  gap: 10px;
  align-items: center;
}
.groudDate {
  height: 48px !important;
  align-items: flex-start !important;
}
.groudDate span.label {
  padding-top: 7px;
}
.step6__body .group .date {
  width: 100%;
  border: 1px solid var(--neutral-border-subtle);
  border-radius: 8px;
  height: 48px;
  padding: 6px 12px;
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 24px;
}
.step6__body .group .date div {
  display: flex;
  flex-direction: column;
  padding-top: 1px;
}
.step6__body .group .date div span:nth-child(1) {
  font-weight: 600;
  font-size: 14px;
  line-height: 16px;
  letter-spacing: 0%;
  vertical-align: middle;
  color: var(--neutral-text-caption);
}
.step6__body .group .date div span:nth-child(2) {
  font-weight: 600;
  font-size: 14px;
  line-height: 18px;
  letter-spacing: 0%;
  vertical-align: middle;
  color: var(--neutral-text-body);
}
.step6__body .group .date div:not(:last-child) {
  border-right: 1px solid var(--neutral-border-subtle);
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

/* CUSTOM COMPONENTS - MODIFY */
.btnIconModify {
  border-radius: 50%;
  color: var(--bg-neutral-500);
}

.mainBtnModify {
  width: 135px;
}
</style>
