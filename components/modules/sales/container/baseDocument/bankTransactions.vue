<script setup>
import configTable from "@/utils/configTables/sale.json";
import useGlobalStore from "@/stores/global";
import useSalesStore from "@/stores/sales";
import usePaymentsStore from "@/stores/payments";
import useBankingTransactionsStore from "@/stores/bankingTransactions";

// ROUTE PARAMS
const { params } = useRoute();
const idSale = params && params.id ? params.id : null;

// STORES
const globalStore = useGlobalStore();
const salesStore = useSalesStore();
const paymentsStore = usePaymentsStore();
const bankingTransactionsStore = useBankingTransactionsStore();

// TRADUCTIONS
const { t } = useI18n();
const module = "modules.sales";
const moduleSaleBank = module + ".sale.tabs.tab2";

// CONSTANTS
const search = ref("");
const loadingTable = ref(false);
const modalVoid = ref(false);
const goToDetails = ref(false);
const modalShare = ref(false);
const lockModal = ref(false);
const metrics = [
  {
    mount: "$ 11.480.000",
    props: "total",
    color: "success",
    icon: "trend-up",
    traslateRute: "modules.sales.sale.tabs.tab2.metrics.totalIncome",
    value: "$ NaN",
  },
  {
    mount: "$ 4.849.000",
    props: "total",
    color: "danger",
    icon: "trend-down",
    traslateRute: "modules.sales.sale.tabs.tab2.metrics.totalExpenses",
    value: "$ NaN",
  },
  {
    mount: "$ 6.631.000",
    props: "total",
    color: "primary",
    icon: "wallet",
    traslateRute: "modules.sales.sale.tabs.tab2.metrics.balance",
    value: "$ NaN",
  },
];

// COMPUTED

// Busqueda en la tabla
const filteredSearch = computed(() => {
  const list = salesStore?.sale?.bankMovements || [];

  if (!search.value.trim()) return list;

  return list.filter((movement) =>
    movement?.transactionNumber
      ?.toString()
      .toLowerCase()
      .includes(search.value.toLowerCase()),
  );
});

const selectedBankMovements = computed(() => {
  return salesStore?.sale?.bankMovements?.filter((m) => m.selected);
});

const isBankMovementsSelected = computed(() => {
  return !salesStore?.sale?.bankMovements?.some(
    (m) => m.selected && m.status !== "voided",
  );
});

// text type anular
const voidTypeKey = computed(() => {
  const selected = selectedBankMovements.value;

  if (!selected?.length) return "transaction";

  const types = new Set(
    selected?.map((item) => (item.isRefund ? "refund" : "charge")),
  );

  // Si hay mezcla
  if (types.size > 1) {
    return "transaction";
  }

  return [...types][0];
});

// FUNCTIONS

// funciones de modal de cobros y devoluciones
const hideModal = () => {
  if (!lockModal.value) {
    salesStore.dialogSalesDocuments.showCharges = false;
    salesStore.dialogSalesDocuments.showRefund = false;
    goToDetails.value = false;
    lockModal.value = false;
  }
};

const openChargesModal = async () => {
  const linesDeposits = salesStore?.sale?.salesDoc
    ? [salesStore.sale.salesDoc]
    : [];

  try {
    globalStore.loading = true;
    // const resp = await outcomesStore.addLineToPay(ids);
    const resp = JSON.parse(JSON.stringify(toRaw(linesDeposits)));
    if (resp.length) {
      paymentsStore.formDeposits.lines = resp;

      // Validaciones para los cobros
      paymentsStore.formDeposits.validations = [
        // Unico cliente por documento
        {
          validate: (list) => {
            const clientsIds = new Set();
            const message = t(
              `${module}.modals.charge.step0.alerts.multipleClients`,
            );
            list.forEach((item) => {
              if (item.client && item.client.contact) {
                clientsIds.add(item.client.contact);
              }
            });
            return { isValid: clientsIds.size === 1, message };
          },
        },
        // Unica moneda
        {
          validate: (list) => {
            const currencyIds = new Set();
            const message = t(`${module}.modals.charge.step0.alerts.currency`);
            list.forEach((item) => {
              if (item?.currency?.default) {
                currencyIds.add(item.currency.default);
              }
            });
            return { isValid: currencyIds.size === 1, message };
          },
        },
        // Compras canceladas
        {
          validate: (list) => {
            const message = t(`${module}.modals.charge.step0.alerts.voidded`);
            const hasCanceled = list.some((item) => item?.status === "voided");

            return { isValid: !hasCanceled, message };
          },
        },
        // Monto por cobrar es cero
        {
          validate: (list) => {
            const message = t(`${module}.modals.charge.step0.alerts.amount`);
            const hasNumberUnCharged = list.some(
              (item) => item?.numbers?.unCharged?.number === 0,
            );
            return { isValid: !hasNumberUnCharged, message };
          },
        },
        // Valor negativo en monto por cobrar
        {
          validate: (list) => {
            const message = t(
              `${module}.modals.charge.step0.alerts.amountNegative`,
            );
            const hasNumberUnCharged = list.some(
              (item) => item?.numbers?.unCharged?.number < 0,
            );
            return { isValid: !hasNumberUnCharged, message };
          },
        },
      ];

      // paymentsStore.formDeposits.multiSupplier = ids.size > 1;
    }
  } catch (error) {
    console.error(error);
  } finally {
    globalStore.loading = false;
    paymentsStore.formDeposits.type = "sales-documents-charged";
    salesStore.dialogSalesDocuments.showCharges = true; // abrir modal de cobros
  }
};

const openRefundsModal = () => {
  const linesDeposits = salesStore?.sale?.salesDoc
    ? [salesStore.sale.salesDoc]
    : [];

  try {
    globalStore.loading = true;

    const resp = JSON.parse(JSON.stringify(toRaw(linesDeposits)));

    if (resp.length) {
      paymentsStore.formDeposits.lines = resp;

      paymentsStore.formDeposits.validations = [
        {
          validate: (list) => {
            const clientsIds = new Set();
            const message = t(
              `${module}.modals.refund.step0.alerts.multipleClients`,
            );
            list.forEach((item) => {
              if (item.client?.contact) {
                clientsIds.add(item.client.contact);
              }
            });
            return { isValid: clientsIds.size === 1, message };
          },
        },
        {
          validate: (list) => {
            const currencyIds = new Set();
            const message = t(`${module}.modals.refund.step0.alerts.currency`);
            list.forEach((item) => {
              if (item?.currency?.default) {
                currencyIds.add(item.currency.default);
              }
            });
            return { isValid: currencyIds.size === 1, message };
          },
        },
        {
          validate: (list) => {
            const message = t(`${module}.modals.refund.step0.alerts.voidded`);
            const hasCanceled = list.some((item) => item?.status === "voided");
            return { isValid: !hasCanceled, message };
          },
        },
        {
          validate: (list) => {
            const message = t(`${module}.modals.refund.step0.alerts.amount`);
            const hasNumberCharged = list.some(
              (item) => item?.numbers?.charged?.number === 0,
            );
            return { isValid: !hasNumberCharged, message };
          },
        },
      ];
    }
  } catch (e) {
    console.error(e);
  } finally {
    globalStore.loading = false;
    paymentsStore.formDeposits.type = "sales-documents-refund";
    salesStore.dialogSalesDocuments.showRefund = true;
  }
};

const openDetailsMovements = (Movement) => {
  bankingTransactionsStore.dataDetailsFlowsSalesDoc = Movement;
  goToDetails.value = true;
};

const handleVoidMovements = () => {
  const ids = selectedBankMovements.value.map((item) => item._id);

  try {
    loadingTable.value = true;
    bankingTransactionsStore.voidedChargesAndRefund(ids);
    reloadBankMovements();
  } catch (error) {
    console.error(error);
  } finally {
    loadingTable.value = false;
  }
};

// funciones de tabla

function actionTable(obj) {
  const { emit, data } = obj;
  const emits = {
    showDetailsMovements: () => openDetailsMovements(data),
  };
  if (emits[emit]) {
    emits[emit]();
  }
}
const isPartialPayment = (isPartialPayment) => {
  return isPartialPayment ? "u u-trend-up green" : "u u-trend-down red";
};

const getInfoType = (item) => {
  // DOCUMENTOS DE VENTA ->  devoluciones | cobros
  if (typeof item.isRefund === "boolean") {
    if (item.isRefund === true) {
      // ES DEVOLUCION
      return {
        type: {
          es: "Devolución",
          en: "Refund",
        },
        user: {
          name: item?.client?.contact?.data?.legalName,
          src: item?.client?.imgUrl,
        },
        account: item.originAccount,
        icon: "u u-trend-down red",
        direction: "out",
      };
    }

    return {
      // ES COBRO
      type: {
        es: "Cobro",
        en: "Charge",
      },
      user: {
        name: item.client.contact.data.legalName,
        src: item.client.imgUrl,
      },
      account: item.destinationAccount,
      icon: "u u-trend-up green",
      direction: "in",
    };
  }

  return null;
};

const reloadBankMovements = async () => {
  try {
    loadingTable.value = true;
    await salesStore.getBankMovementsBySalesDocumentId(idSale);
  } catch (error) {
    console.error(error);
  } finally {
    loadingTable.value = false;
  }
};

onMounted(async () => {
  await reloadBankMovements();
});
</script>

<template>
  <div class="container_bank_transactions">
    <!-- Header -->
    <div class="header_bank_transactions">
      <div class="actions_left">
        <u-input
          v-model="search"
          :placeholder="t(`${moduleSaleBank}.inputs.search.placeholder`)"
          style="width: 400px"
        />
        <!-- <u-button
          text="Filtros"
          icon="filter"
          :revers="true"
          type="outlined"
          color="--neutral-surface-default"
        /> -->
      </div>
      <div class="actions_right">
        <u-button
          :text="t(`${moduleSaleBank}.buttons.void`)"
          icon="cancel"
          type="outlined"
          color="--danger-text-default"
          color-hover="--danger-text-darker"
          :disabled="isBankMovementsSelected"
          @click="modalVoid = true"
        />
        <u-button
          :text="t(`${moduleSaleBank}.buttons.createCharge`)"
          icon="pay"
          type="outlined"
          @click="openChargesModal"
        />
        <u-button
          :text="t(`${moduleSaleBank}.buttons.createRefund`)"
          icon="pay"
          type="outlined"
          @click="openRefundsModal"
        />
      </div>
    </div>
    <!-- Tabla -->
    <TableBasic
      :content="filteredSearch"
      :configTable="configTable.bankTransactions"
      @action-table="actionTable"
      :loading="loadingTable"
    >
      <template #paymentDate="item">
        <span class="date">{{ transformedDate(item.item.issueDate) }}</span>
      </template>

      <template #account="item">
        <!-- <div class="truncateText paymentAccount">
          <div>
            <u-avatar
              :user="{
                name: getInfoType(item?.item)?.account?.bank?.name,
                src: getInfoType(item?.item)?.account?.bank?.imgUrl,
              }"
              :size="32"
            />
          </div>
          <span
            class="truncateText"
            v-text="
              getInfoType(item?.item)
                ?.account?.accountNumber?.slice(-4)
                .padStart(6, '•')
                .split('')
                .join(' ') || '-'
            "
          ></span>
        </div> -->
        <div class="truncateText account">
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
            <span
              class="truncateText"
              :title="item?.item?.destinationAccount?.owner?.name"
              >{{ item?.item?.destinationAccount?.owner?.name || "-" }}</span
            >
            <span
              class="truncateText"
              :title="getInfoType(item?.item)?.account?.accountNumber"
              v-text="
                getInfoType(item?.item)
                  ?.account?.accountNumber?.slice(-4)
                  .padStart(6, '•')
                  .split('')
                  .join(' ') || '-'
              "
            ></span>
          </div>
        </div>
      </template>

      <template v-slot:recipient="item">
        <div class="truncateText paymentAccount">
          <div>
            <u-avatar
              :user="{
                name: item?.item?.client?.data?.legalName,
                src: item?.item?.client?.imgUrl,
              }"
              :size="32"
            />
          </div>
          <span class="truncateText">{{
            item?.item?.client?.data?.legalName
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

      <template v-slot:noData>
        <div class="noData">
          <div class="msg">
            <img
              src="/img/banking-transactions/lupa.svg"
              alt="empy transactions"
            />
            <p class="body-m-sb">
              {{ t(`${moduleSaleBank}.table.noData`) }}
            </p>
          </div>
        </div>
      </template>
    </TableBasic>
    <!-- Metricas -->
    <!-- <u-indicators-lite :indicators="metrics || []" /> -->
  </div>

  <dialog-cancel
    width="600px"
    height="auto"
    :title="
      t(
        `${moduleSaleBank}.modals.void.title.${
          selectedBankMovements?.length === 1 ? 'single' : 'plural'
        }`,
        {
          type: t(
            `${moduleSaleBank}.modals.void.types.${voidTypeKey}.${
              selectedBankMovements?.length === 1 ? 'single' : 'plural'
            }`,
          ),
        },
      )
    "
    :description="t(moduleSaleBank + '.modals.void.description')"
    :showInput="true"
    :confirmationText="t(moduleSaleBank + '.modals.void.confirmationText')"
    :customTextBtnDelete="t(moduleSaleBank + '.modals.void.confirmationText')"
    :actionModal="handleVoidMovements"
    :showModal="modalVoid"
    @closeModal="modalVoid = false"
  />

  <u-dialog
    :show-modal="salesStore.dialogSalesDocuments.showCharges"
    width="auto"
    height="auto"
    @closeModal="hideModal"
    :lock-modal="lockModal"
    :persistent="true"
  >
    <DialogDeposits @closeModal="hideModal" @refresh="reloadBankMovements" />
    <!--CAMBIAR REFRESH CON EL ENDPOINT DE CRISTIAN PARA RECARGAR LOS DATOS-->
  </u-dialog>

  <u-dialog
    :show-modal="salesStore.dialogSalesDocuments.showRefund"
    width="auto"
    height="auto"
    @closeModal="hideModal"
    :lock-modal="lockModal"
    :persistent="true"
  >
    <DialogDeposits @closeModal="hideModal" @refresh="reloadBankMovements" />
    <!--CAMBIAR REFRESH CON EL ENDPOINT DE CRISTIAN PARA RECARGAR LOS DATOS-->
  </u-dialog>

  <u-dialog
    :show-modal="goToDetails"
    :lock-modal="lockModal"
    @close-modal="hideModal"
    width="auto"
    height="auto"
    :persistent="false"
    position="right"
  >
    <BankingTransactionsDialogGoToFlowsSalesDoc
      @closeModal="hideModal"
      @showModal="modalShare = true"
    />
  </u-dialog>
</template>

<style scoped>
.container_bank_transactions {
  display: grid;
  grid-template-rows: 36px 1fr;
  gap: 16px;
  width: 100%;
  height: 100%;
}

.header_bank_transactions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.actions_left {
  display: flex;
  align-items: center;
  gap: 16px;
}
.actions_right {
  display: flex;
  align-items: center;
  gap: 16px;
}

/* Table styles  */

.date {
  font-size: 14px;
  color: var(--neutral-text-body);
  font-weight: 600;
  line-height: 18px;
}

.account {
  display: flex;
  align-items: center;
  gap: 12px;
}

.account span {
  font-size: 14px;
  color: var(--neutral-text-body);
  font-weight: 600;
  line-height: 18px;
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

.noData {
  display: flex;
  flex-direction: column;
  gap: 48px;
  align-items: center;
  width: 550px;
  height: auto;
}

.noData .msg {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  gap: 16px;
  width: 550px;
  height: 166px;
}

.noData .msg img {
  width: 64px;
  height: 64px;
}

.noData .msg p {
  text-align: justify;
  line-height: 18px;
  color: var(--neutral-text-caption);
}

.noData .actions {
  display: flex;
  flex-direction: column;
  gap: 12px;
  align-items: center;
}
</style>
