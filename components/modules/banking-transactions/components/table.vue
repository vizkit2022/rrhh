<script setup>
import configBankingTransactions from "@/utils/configTables/bankingTransactions.json";
import useGlobalStore from "@/stores/global";
import useBankingTransactionsStore from "@/stores/bankingTransactions";
import { transformedDate } from "@/utils/helpers";

/*
::::::::-STORES-:::::::
*/
const globalStore = useGlobalStore();
const bankingTransactionsStore = useBankingTransactionsStore();

/*
::::::::-CONSTANTS-:::::::
*/

// Constantes para el modal de conciliar
const showTransaction = ref(false);
const showDropdown = ref(false);
const isEmpty = ref(false);
const showConciliadoDropdown = ref(false);
const posConciliado = ref({ x: 40, y: 40 });
const conciliadoData = ref([]);
const conciliadoDropdownRef = ref(null);
const modalShare = ref(false);

// constantes para el modal de detalles de payments
const showDetailsPayment = ref(false);
const showDetailsFlowsSalesDoc = ref(false);
const lockModal = ref(false);

/*
::::::::-COMPUTED-:::::::
*/

const tableContent = computed(() => {
  return bankingTransactionsStore.tab == 0
    ? bankingTransactionsStore.dataPaymentsCharges
    : bankingTransactionsStore.dataBanco;
});

/*
::::::::-FUNCTIONS-:::::::
*/

// style

const isPartialPayment = (isPartialPayment) => {
  return isPartialPayment ? "u u-trend-up green" : "u u-trend-down red";
};

// FUNCIONES PARA EL MODAL DE CONCILIAR
const hideModal = () => {
  if (!lockModal.value) {
    modalShare.value = false;
    showTransaction.value = false;
    showDetailsPayment.value = false;
    showDetailsFlowsSalesDoc.value = false;
  }
};
const hideModalShare = () => {
  if (!lockModal.value) {
    modalShare.value = false;
  }
};

const showTransactionPayments = (event, data) => {
  event.stopPropagation();

  showTransaction.value = true;
  isEmpty.value = false;
  bankingTransactionsStore.dataReconcile.currentData = data;
};

// FUNCIONES PARA LA TABLA DE PAGOS Y BANCOS

// Cambiar el icon color del total de los pagos
// const getIconColorTotal = (total) => {
//   if (total && String(total).includes("-")) return "u u-trend-down red";
//   return "u u-trend-up green";
// };

// Funcion para calcular posición del dropdown de Conciliado
const calcPositionConciliadoDropdown = (event) => {
  const btnRect = event.target.getBoundingClientRect();
  const dropdownWidth = 1015;
  const margin = 1;

  // intenta centrar bajo el botón
  let x = btnRect.left + window.scrollX + btnRect.width / 2 - dropdownWidth / 2;
  const y = btnRect.top + window.scrollY + btnRect.height + 10;

  // fuerza un mínimo/máximo para que no choque con los bordes
  const minX = window.scrollX + margin;
  const maxX = window.scrollX + window.innerWidth - dropdownWidth - margin;

  if (x < minX) x = minX;
  if (x > maxX) x = maxX;

  posConciliado.value = { x: `${x}px`, y: `${y}px` };
};

// Funcion para la accion de la tabla
const actionTable = (obj) => {
  const { emit, data, pos, event } = obj;

  const propType = Object.keys(data).find((key) =>
    ["isRefund", "isPartialPayment"].includes(key),
  );

  const emits = {
    showDetailsPayment: () => {
      if (propType === "isPartialPayment") {
        showDetailsPayment.value = true;
        bankingTransactionsStore.dataDetailsPayment = data;
      }
      if (propType === "isRefund") {
        showDetailsFlowsSalesDoc.value = true;
        bankingTransactionsStore.dataDetailsFlowsSalesDoc = data;
      } else {
        return;
      }
    },

    // OLD SHOW CONCILIAR Y DROPDOWN DEL CONCILIADO

    // showTransactionPayments: () => {
    //   console.log('action table showTransactionPayments');
    //   // console.log('showTransactionPayments data:', data)
    //   // console.log('showTransactionPayments pos:', event.x)
    // }

    // showTransactionPayments: () => {
    //     if(bankingTransactionsStore.tab === 0 && data.status === 'unreconciled') {
    //         showTransaction.value = true;
    //         isEmpty.value = false;
    //         bankingTransactionsStore.dataReconcile.currentData = data;
    //     }
    //     else if (bankingTransactionsStore.tab === 0 && data.status === 'unreconciled') {
    //         showTransaction.value = true
    //         isEmpty.value = true;
    //         bankingTransactionsStore.dataReconcile.currentData = data;
    //     }
    //     else if (bankingTransactionsStore.tab === 0 && data.status === 'reconciled') {
    //         if(!showConciliadoDropdown.value) {
    //             showConciliadoDropdown.value = true;
    //             conciliadoData.value = data.status === 'reconciled';
    //             console.log('conciliadoData',conciliadoData.value)
    //             calcPositionConciliadoDropdown(event);
    //         }
    //     }
    // }
  };

  if (emits[emit]) {
    emits[emit]();
  } else {
    console.log("No se encontro la accion");
  }
};

const getStatus = (prop) => {
  const status = {
    unreconciled: { es: "No Reconciliado", en: "Unreconciled" },
    reconciled: { es: "Reconciliado", en: "Reconciled" },
    voided: { es: "Anulado", en: "Voided" },
  };
  if (["unreconciled", "reconciled", "voided"].includes(prop))
    return status[prop][globalStore.lang];
  return "-";
};

const getInfoType = (item) => {
  // TRANSACCIONES BANCARIAS -> abonos | pagos
  if (typeof item.isPartialPayment === "boolean") {
    if (item.isPartialPayment === true) {
      // ES ABONO
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

    return {
      // ES PAGO
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
</script>

<template>
  <TableBasic
    :configTable="
      configBankingTransactions[
        bankingTransactionsStore.tab == 0 ? 'payments' : 'bank'
      ]
    "
    :content="tableContent"
    :loading="bankingTransactionsStore.loadingTables"
    @actionTable="actionTable"
  >
    <template v-slot:date="item">
      <div>
        <span class="date">{{ transformedDate(item.item.issueDate) }}</span>
      </div>
    </template>

    <template v-slot:status="item">
      <div :class="`status ${item.item.status}`">
        <span>{{ getStatus(item.item.status) }}</span>
      </div>
    </template>

    <template v-slot:account="item">
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

    <template
      v-if="bankingTransactionsStore.tab == 1"
      v-slot:description="item"
    >
      <div>
        <span class="description">{{ item.item.description }}</span>
      </div>
    </template>

    <template v-slot:recipient="item">
      <div class="truncateText recipient">
        <div>
          <u-avatar :user="getInfoType(item.item).user" :size="32" />
        </div>
        <span class="truncateText">{{ getInfoType(item.item).user.name }}</span>
      </div>
    </template>

    <template v-slot:type="item" v-if="bankingTransactionsStore.tab == 0">
      <u-tags
        style="margin: 0 auto"
        :text="getInfoType(item.item).type[globalStore.lang]"
        size="xs"
        :delete="false"
        color="--neutral-text-caption"
        background="--neutral-surface-light"
      />
    </template>

    <template v-if="bankingTransactionsStore.tab == 0" v-slot:modality="item">
      <u-tags
        style="margin: 0 auto"
        :text="item.item.paymentMethod.name[globalStore.lang]"
        size="xs"
        :delete="false"
        color="--neutral-text-caption"
        background="--neutral-surface-light"
      />
    </template>

    <template
      v-if="bankingTransactionsStore.tab == 0"
      v-slot:numberTransaction="item"
    >
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
        <span class="icon" :class="getInfoType(item.item).icon"></span>
        <span> </span>
      </div>
    </template>

    <template v-slot:transaction="item">
      <div class="transaction">
        <!-- <u-tags
          v-if="['unreconciled', 'voided'].includes(item.item.status)"
          :icon="item.item.status"
          :text="`Conciliar (0)`"
          size="xs"
          :delete="false"
          :disabled="true || item.item.status === 'voided'"
          color="--secondary-surface-darker"
          background="--secondary-surface-light"
        /> -->
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
          @click="showTransactionPayments($event, item.item)"
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
  </TableBasic>

  <!--dialog conciliar -->

  <u-dialog
    :showModal="showTransaction"
    @closeModal="hideModal"
    width="800px"
    height="818px"
    padding="24px 40px"
  >
    <BankingTransactionsDialogConciliar
      @closeModal="hideModal"
      :isEmpty="isEmpty"
    />
  </u-dialog>

  <!-- <template v-slot:total="item">-->
  <!-- <div class="total"> -->
  <!-- <span>{{ item.item.numbers.total.value }}</span> -->
  <!-- <span class="icon" :class="getIconColorTotal(item.item.number)"></span> -->
  <!-- <span v-if="bankingTransactionsStore.tab == 0" class="icon u u-trend-down"></span> -->
  <!-- </div> -->
  <!-- </template> -->

  <!--dialog detalles -->

  <u-dialog
    :showModal="showDetailsPayment"
    :lockModal="lockModal"
    @closeModal="hideModal"
    width="auto"
    height="auto"
    :persistent="false"
    position="right"
  >
    <BankingTransactionsDialogGoToPay
      @closeModal="hideModal"
      @showModal="modalShare = true"
    />
  </u-dialog>

  <u-dialog
    :showModal="showDetailsFlowsSalesDoc"
    :lockModal="lockModal"
    @closeModal="hideModal"
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
</template>

<style scoped>
/* Estilos para la animación del .menu replicada */
.conciliado-dropdown {
  position: absolute;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  width: 974px;
  height: 139px;
  background-color: var(--neutral-background-default);
  border-radius: 16px;
  box-shadow: var(--elevation-s);
  z-index: 3;
  overflow: hidden;
  transform: scale(0); /* Inicialmente oculto */
  transition: transform 0.3s; /* Misma duración que el .menu */
  transform-origin: top right; /* Ajustado a top center como antes */
}

.conciliado-dropdown.show {
  transform: scale(1); /* Visible cuando la clase 'show' está presente */
}

/* Resto de estilos del dropdown (sin cambios importantes) */
.conciliado-dropdown__header {
  padding: 12px 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid var(--neutral-border-subtle);
}

.conciliado-dropdown__header span {
  font-weight: 600;
  font-size: 14px;
  color: var(--neutral-text-body);
}

.close-btn {
  background: none;
  border: none;
  font-size: 18px;
  color: var(--neutral-text-caption);
  cursor: pointer;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  transition: 0.2s;
}

.close-btn:hover {
  background-color: var(--neutral-surface-light);
  color: var(--neutral-text-body);
}

.conciliado-dropdown__content {
  padding: 12px 16px;
}

.conciliado-dropdown__item {
  margin-bottom: 10px;
  display: flex;
  flex-direction: column;
}

.conciliado-dropdown__item .label {
  font-size: 12px;
  color: var(--neutral-text-caption);
  margin-bottom: 2px;
}

.conciliado-dropdown__item .value {
  font-size: 14px;
  color: var(--neutral-text-body);
  font-weight: 500;
}

.conciliado-dropdown__empty {
  padding: 20px 16px;
  text-align: center;
  color: var(--neutral-text-caption);
  font-size: 14px;
}

/*estilos tabla */

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

.description {
  font-size: 14px;
  color: var(--neutral-text-body);
  font-weight: 400;
  line-height: 18px;
}

.recipient {
  display: flex;
  align-items: center;
  gap: 12px;
}

.recipient span {
  font-size: 14px;
  text-align: left;
  color: var(--neutral-text-body);
  font-weight: 600;
  line-height: 18px;
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

.numberTransaction {
  color: var(--neutral-text-body);
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

/* Status */
.status {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  width: 100%;
  gap: 5px;
  padding: 0 12px;
}
.status span {
  background-color: var(--neutral-surface-shadow-12a);
  color: var(--neutral-text-body);
  padding: 4px 10px;
  border-radius: 16px;
  font-size: 12px;
  font-weight: 600;
}
.status.unreconciled span {
  background-color: var(--warning-surface-shadow-12a);
  color: var(--warning-text-default);
}
.status.reconciled span {
  background-color: var(--success-surface-shadow-12a);
  color: var(--success-text-default);
}
.status.voided span {
  background-color: var(--danger-surface-shadow-12a);
  color: var(--danger-text-default);
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
