<script setup>
import useOutcomesStore from "@/stores/outcomes";
import useGlobalStore from "@/stores/global";
import usePaymentsStore from "@/stores/payments";
import useBankingTransactionsStore from "@/stores/bankingTransactions";
import { ref, onMounted, computed, defineEmits } from "vue";
import configTable from "@/utils/configTables/outcomes.json";
import { transformedDate } from "@/utils/helpers";

// Stores
const outcomesStore = useOutcomesStore();
const globalStore = useGlobalStore();
const paymentsStore = usePaymentsStore();
const bankingTransactionsStore = useBankingTransactionsStore();

// Constants
const color = "--neutral-text-caption";
const deleteColor = "--danger-text-subtle";
const deleteColorHover = "--danger-text-darker";
const { params } = useRoute();
const idOC = params && params.id ? params.id : null;
const { t } = useI18n();
const module = "modules.outcomes.pages.oc.sections.banks";

// Vars
const search = ref("");
const bankMovements = ref([]);
const loadingTable = ref(false);
const goToPayModal = ref(false);
const goToDetails = ref(false);
const modalShare = ref(false);
const lockModal = ref(false);
const initTab = ref(2);
const modalVoidPayment = ref(false);
const modalDeletePayment = ref(false);

// Emits
const emit = defineEmits(["updateMetrics"]);

// Computed
const noPay = computed(() => {
  return (
    outcomesStore.outcome !== "inProcess" &&
    outcomesStore.outcome.numbers.paid.number ===
      outcomesStore.outcome.numbers.total.number
  );
});
const selectedValidPaymentsCount = computed(() => {
  const lines = paymentsStore?.payments?.filter((pay) => pay.selected);
  if (lines.some((pay) => pay.status === "voided")) {
    return 0;
  } else {
    return lines.length;
  }
});
const selectedNoValidPaymentsCount = computed(() => {
  const lines = paymentsStore?.payments?.filter((pay) => pay.selected);
  if (lines.some((pay) => pay.status !== "voided")) {
    return 0;
  } else {
    return lines.length;
  }
});

// Mounted
onMounted(async () => {
  globalStore.loading = true;
  await getBankMovementsByOutcomes();
  await paymentsStore.getPaymentMethods();
  globalStore.loading = false;
});

// Functions
const getBankMovementsByOutcomes = async () => {
  loadingTable.value = true;
  await outcomesStore.get_outcomes(idOC);
  await paymentsStore.getPaymentbyOutcomes(idOC);
  loadingTable.value = false;
  bankMovements.value = JSON.parse(JSON.stringify(paymentsStore?.payments));
  const total = outcomesStore?.outcome?.numbers?.paid?.value ?? "";
  emit("updateMetrics", { total, section: "bankMovements" });
  globalStore.loading = false;
};
const updateSection = async () => {
  await getBankMovementsByOutcomes();
};
const openPayModal = () => {
  initTab.value = 2;
  const linesToPay = [outcomesStore.outcome];
  outcomesStore.duePurchases = JSON.parse(JSON.stringify(linesToPay));
  paymentsStore.formGoToPay.supplier = JSON.parse(
    JSON.stringify(outcomesStore?.outcome?.supplier || {})
  );
  paymentsStore.formGoToPay.lines = JSON.parse(
    JSON.stringify([outcomesStore?.outcome] || [])
  );
  paymentsStore.formGoToPay.currency =
    outcomesStore?.outcome?.currency?.default || {};
  paymentsStore.formGoToPay.lines.forEach((item) => {
    item.numbers.percentage = "0";
    item.numbers.amountPaid = formatData(0, paymentsStore.formGoToPay.currency);
  });
  goToPayModal.value = true;
};
const showPayModal = (payment) => {
  bankingTransactionsStore.dataDetailsPayment = payment;
  goToDetails.value = true;
  
};
const hideModal = () => {
  if (!lockModal.value) {
    goToPayModal.value = false;
    goToDetails.value = false;
    lockModal.value = false;
  }
};

const hideModalShare = () => {
  if (!lockModal.value) {
    modalShare.value = false;
  }
};

const formatData = (number, currency) => {
  const { precision, typeFormat } = currency;
  const numberAprox = convertToNumber(number, typeFormat, precision);
  return {
    number,
    value: formatCurrency(numberAprox, currency, true),
    numberAprox,
  };
};
function actionTable(obj) {
  const { emit, data } = obj;
  const emits = {
    showModalPayment: () => showPayModal(data),
  };
  if (emits[emit]) {
    emits[emit]();
  }
}
const voidSelectedPayment = async () => {
  let response = null;
  try {
    globalStore.loading = true;

    // Extraer los IDs de los pagos seleccionados
    const payIds = paymentsStore?.payments
      .filter((pay) => pay.selected)
      .map((doc) => doc._id);
    response = await paymentsStore.voidManyPayments(payIds);
  } catch (err) {
    console.error("Error al anular los pagos seleccionados:", err);
  } finally {
    setTimeout(async () => {
      if (response.success) await updateSection();
      modalVoidPayment.value = false;
      globalStore.loading = false;
    }, 1000);
  }
};
const deleteSelectedPayment = async () => {
  let response = null;
  try {
    globalStore.loading = true;

    // Extraer los IDs de los pagos seleccionados
    const payIds = paymentsStore?.payments
      .filter((pay) => pay.selected)
      .map((doc) => doc._id);
    response = await paymentsStore.deleteManyPayments(payIds);
  } catch (err) {
    console.error("Error al eliminar los pagos seleccionados:", err);
  } finally {
    setTimeout(async () => {
      if (response.success) await updateSection();
      modalDeletePayment.value = false;
      globalStore.loading = false;
    }, 1000);
  }
};

const isPartialPayment = (isPartialPayment) => {
  return isPartialPayment ? "u u-trend-up green" : "u u-trend-down red";
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

const getInfoType = (item) => {
  // TRANSACCIONES BANCARIAS -> abonos | pagos
  if (typeof item.isPartialPayment === "boolean") {
    if (item.isPartialPayment === true) { // ES ABONO
      return {
        type: {
          es: "Abono",
          en: "Payment",
        },
        user: {
          name: item?.supplier?.contact?.data?.legalName,
          src: item?.supplier?.imgUrl,
        },
        account: item.destinationAccount,
        icon: "u u-trend-up green",
        direction: "in", // ENTRADA de dinero
      };
    }

    return { // ES PAGO
      type: {
        es: "Pago",
        en: "Payment",
      },
      user: {
        name: item?.supplier?.contact?.data?.legalName,
        src: item?.supplier?.imgUrl,
      },
      account: item.originAccount,
      icon: "u u-trend-down red",
      direction: "out", // SALIDA de dinero
    };
  }

  return null;
};

const noActions = computed(() => !["closed","voided"].includes(outcomesStore.outcome.status));

</script>

<template>
  <div class="bankMovements">
    <div class="bankMovements__header">
      <u-input
        v-model="search"
        size="s"
        :placeholder="t(module + '.inputs.search.placeholder')"
        icon="search"
        :revers="true"
      />
      <div></div>
      <u-button-icon
        icon="delete"
        type="outlined"
        :color="deleteColor"
        :color-hover="deleteColorHover"
        :color-active="deleteColorHover"
        size="s"
        :disabled="
          outcomesStore.outcome.status === 'voided' ||
          selectedNoValidPaymentsCount === 0
        "
        @click="modalDeletePayment = true"
        v-if="noActions"
      />
      <u-button
        icon="close"
        :text="t(module + '.buttons.void')"
        type="outlined"
        :color="deleteColor"
        :color-hover="deleteColorHover"
        :color-active="deleteColorHover"
        size="s"
        :disabled="
          outcomesStore.outcome.status === 'voided' ||
          selectedValidPaymentsCount === 0
        "
        @click="modalVoidPayment = true"
        v-if="noActions"
      />
      <u-button
        icon="pay"
        :text="t(module + '.buttons.bonus')"
        type="outlined"
        :color="color"
        size="s"
        :disabled="true"
        v-if="noActions"
      />
      <u-button
        icon="pay"
        :disabled="noPay"
        @click="openPayModal"
        :text="t(module + '.buttons.create')"
        size="s"
        v-if="noActions"
      />
    </div>
    <TableBasic
      :configTable="configTable.bankMovements"
      :content="paymentsStore?.payments || []"
      @action-table="actionTable"
      :loading="loadingTable"
    >
      <template #paymentDate="item">
        <span class="date">{{ transformedDate(item.item.issueDate) }}</span>
      </template>

      <template #account="item">
        <div class="truncateText paymentAccount">
        <div>
          <u-avatar
            :user="{
              name: getInfoType(item?.item)?.account?.bank?.name,
              src: getInfoType(item?.item)?.account?.bank?.imgUrl,
            }"
            :size="32"
          />
        </div>
        <div class="divAlias">
          <span class="truncateText">{{ item?.item?.destinationAccount?.owner?.name || '-' }}</span>
          <span
            class="truncateText"
            v-text="getInfoType(item?.item)?.account?.accountNumber?.slice(-4).padStart(6, '•').split('').join(' ') || '-'"
          ></span>
        </div>
        </div>
      </template>

      <template v-slot:recipient="item">
        <div class="truncateText paymentAccount">
          <div>
            <u-avatar
              :user="{
                name: item.item.supplier.data.legalName,
                src: item.item.supplier.imgUrl,
              }"
              :size="32"
            />
          </div>
          <span class="truncateText">{{
            item.item.supplier.data.legalName
          }}</span>
        </div>
      </template>

      <template v-slot:type="item"> 
      <u-tags
        style="margin: 0 auto"
        :text="getInfoType(item.item).type[globalStore.lang]"
        size="xs"
        :delete="false"
        color="--neutral-text-caption"
        background="--neutral-surface-light"
      />
    </template>

      <template v-slot:modality="item">
        <u-tags
          style="margin: 0 auto"
          :text="item.item.paymentMethod.name[globalStore.lang]"
          size="xs"
          :delete="false"
          color="--neutral-text-caption"
          background="--neutral-surface-light"
        />
      </template>

      <template v-slot:numberTransaction="item">
        <span
          :title="item.item.transactionNumber"
          class="truncateText numberTransaction body-m-sb"
          >{{ item.item.transactionNumber }}</span
        >
      </template>

      <template v-slot:total="item">
        <div class="total">
          <span>{{ item.item.numbers.total.value }}</span>
          <!-- <span class="icon" :class="getIconColorTotal(item.item.number)"></span> -->
          <span
            class="icon"
            :class="isPartialPayment(item.item.isPartialPayment)"
          ></span>
          <span> </span>
        </div>
      </template>

      <template v-slot:transaction="item">
        <div class="transaction">
          <u-tags
            v-if="['unreconciled', 'voided'].includes(item.item.status)"
            :icon="item.item.status"
            :text="`Conciliar (${
              item?.item?.associatedBankTransactionsCount || 0
            })`"
            size="xs"
            :delete="false"
            color="--secondary-surface-darker"
            background="--secondary-surface-light"
          />
          <u-tags
            v-else
            text="Conciliado"
            icon="click"
            size="xs"
            :delete="false"
            color="--info-text-darker"
            background="--info-surface-light"
          />
        </div>
      </template>

      <!-- <template v-slot:status="item">
            <span :class="`tag ${item.item.status}`" v-text="getNameStatus(item.item.status).label" :title="getNameStatus(item.item.status).title"></span>
          </template> -->
    </TableBasic>
  </div>
  <!-- Pagar -->
  <u-dialog
    :showModal="goToPayModal"
    :lockModal="lockModal"
    @closeModal="hideModal"
    width="auto"
    height="auto"
    :persistent="true"
    :position="initTab === 2 ? 'center' : 'right'"
  >
    <DialogGoToPay
      @closeModal="hideModal"
      :init-tab="initTab"
      page="oc"
      @updateSection="updateSection"
    />
  </u-dialog>

  <u-dialog
    :show-modal="goToDetails"
    :lock-modal="lockModal"
    @close-modal="hideModal"
    width="auto"
    height="auto"
    :persistent="true"
    position="right"
  >
      <BankingTransactionsDialogGoToPay
      @closeModal="hideModal"
      @showModal="modalShare = true"
    />
  </u-dialog>

    <!-- Compartir -->
  <u-dialog
    :showModal="modalShare"
    :lockModal="lockModal"
    @closeModal="hideModal"
    width="auto"
    height="auto"
    :persistent="true"
  >
    <OutcomesDialogShare @closeModal="hideModalShare" module="payment" />
  </u-dialog>

  <!-- Anular Pagos -->
  <dialog-cancel
    width="600px"
    height="auto"
    :title="
      t(
        module +
          '.modals.void.title.' +
          (selectedValidPaymentsCount == 1 ? 'single' : 'plural')
      )
    "
    :description="t(module + '.modals.void.description')"
    :showInput="true"
    :confirmationText="t(module + '.modals.void.confirmationText')"
    :customTextBtnDelete="t(module + '.modals.void.confirmationText')"
    :actionModal="voidSelectedPayment"
    :showModal="modalVoidPayment"
    @closeModal="modalVoidPayment = false"
  />
  <!-- Eliminar Pagos -->
  <dialog-confirm
    width="600px"
    height="auto"
    :title="
      t(
        module +
          '.modals.delete.title.' +
          (selectedNoValidPaymentsCount == 1 ? 'single' : 'plural')
      )
    "
    :description="t(module + '.modals.delete.description')"
    :showInput="true"
    :confirmationText="t(module + '.modals.delete.confirmationText')"
    :customTextBtnDelete="t(module + '.modals.delete.confirmationText')"
    :actionModal="deleteSelectedPayment"
    :showModal="modalDeletePayment"
    @closeModal="modalDeletePayment = false"
  />
</template>

<style scoped>
.bankMovements {
  width: 100%;
  display: grid;
  grid-template-rows: 36px 1fr;
  gap: 20px;
}
.bankMovements__header {
  width: 100%;
  display: grid;
  grid-template-columns: 300px 1fr repeat(4, auto);
  gap: 12px;
}
.record {
  display: inline-flex;
  position: relative;
  font-size: 12px;
  padding: 2px 10px;
  border-radius: 15px;
  background-color: var(--info-surface-light);
  color: var(--info-text-darker);
}
.record__icon {
  margin-inline: auto;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background-color: var(--success-surface-softer);
  display: flex;
  justify-content: center;
  align-items: center;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.record__icon span {
  color: var(--success-text-default);
  font-size: 24px;
}

/* Table styles  */

.date {
  font-size: 14px;
  color: var(--neutral-text-body);
  font-weight: 600;
  line-height: 18px;
}

.tag {
  font-size: 12px;
  padding: 4px 12px;
  border-radius: 20px;
  font-weight: 600;
}
.reconciled {
  color: var(--success-text-darker);
  background-color: var(--success-surface-shadow-12a);
}
.unreconciled {
  color: var(--warning-text-darker);
  background-color: var(--warning-surface-shadow-12a);
}
.voided {
  color: var(--danger-text-darker);
  background-color: var(--danger-surface-shadow-12a);
}

.paymentAccount {
  display: grid;
  grid-template-columns: 32px 1fr;
  gap: 12px;
  align-items: center;
}

.numberTransaction {
  color: var(--neutral-text-body);
}

.paymentAccount span {
  color: var(--neutral-text-body);
}

.total {
  display: flex;
  width: 100%;
  height: 100%;
  align-items: center;
  justify-content: right;
  gap: 12px;
}

.total span {
  font-size: 14px;
  color: var(--neutral-text-body);
  font-weight: 600;
  line-height: 18px;
}

.icon {
  font-size: 20px;
}

.icon.u-trend-up {
  color: var(--success-text-default);
}
.icon.u-trend-down {
  color: var(--danger-text-default);
}

.transaction {
  display: flex;
  align-items: center;
  margin: 0 auto;
  gap: 12px;
}

.transaction span {
  font-size: 14px;
  color: var(--neutral-text-body);
  font-weight: 600;
  line-height: 18px;
}

.mode {
  color: var(--neutral-text-body);
}

.divAlias {
  display: grid;
}
.divAlias span {
  text-align: left;
}
.divAlias span:nth-child(1) {
  color: var(--neutral-text-body);
}
.divAlias span:nth-child(2) {
  color: var(--neutral-text-caption);
  font-size: 10px;
  line-height: 10px;
}
</style>
