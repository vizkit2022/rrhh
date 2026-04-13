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
const showModalUpdatedFileTransactions = ref(false);
const paddingModalUpdatedFile = ref("24px 48px");
const showTransaction = ref(false);
const showDropdown = ref(false);
const isEmpty = ref(false);
const showConciliadoDropdown = ref(false);
const posConciliado = ref({ x: 40, y: 40 });
const conciliadoData = ref([]);
const conciliadoDropdownRef = ref(null);

// constantes para el modal de detalles de payments
const showDetailsPayment = ref(false);
const lockModal = ref(false);

/*
::::::::-FUNCTIONS-:::::::
*/

// FUNCIONES PARA CERRAR LOS MODALS
const hideModal = () => {
  if (!lockModal.value) {
    showModalUpdatedFileTransactions.value = false;
    showTransaction.value = false;
    showDetailsPayment.value = false;
  }
};

// FUNCION PARA ACTUALIZAR PADDING DEL MODAL DE CARGAR ARCHIVOS DE TRANSACCIONES
const updatePaddingModal = (paddingText) => {
  paddingModalUpdatedFile.value = paddingText;
};

// FUNCIONES PARA LA TABLA DE PAGOS Y BANCOS

const showTransactionBank = (event, data) => {
  showTransaction.value = true;
  isEmpty.value = false;
  bankingTransactionsStore.dataReconcile.currentData = data;
};

// Cambiar el icon color del total de los pagos
const getIconColorTotal = (total) => {
  if (total && String(total).includes("-")) return "u u-trend-down red";
  return "u u-trend-up green";
};

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

  const emits = {
    showDetailsPayment: () => {
      showDetailsPayment.value = true;
      bankingTransactionsStore.dataDetailsPayment = data;
    },

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
    console.log("No se encontro la accion de la tabla");
  }
};
</script>

<template>
  <TableBasic
    :configTable="
      configBankingTransactions[
        bankingTransactionsStore.tab == 0 ? 'payments' : 'bank'
      ]
    "
    :content="bankingTransactionsStore.dataTransactions"
    @actionTable="actionTable"
  >
    <template v-slot:date="item">
      <div>
        <span class="date">{{ transformedDate(item.item.paymentDate) }}</span>
      </div>
    </template>

    <template v-slot:account="item">
      <div class="account">
        <u-avatar :user="{ name: '', src: '' }" :size="32" />
        <span>{{ "" }}</span>
      </div>
    </template>

    <template v-slot:reference="item">
      <div class="truncateText">
        <span class="description">{{ item.item.reference }}</span>
      </div>
    </template>

    <template v-slot:recipient="item">
      <div class="recipient">
        <u-avatar
          :user="{
            name: item.item.destinationAccount?.legalName,
            src: item.item.destinationAccount?.imgUrl,
          }"
          :size="32"
        />
        <span>{{ item.item.destinationAccount?.legalName }}</span>
      </div>
    </template>

    <template v-if="bankingTransactionsStore.tab == 0" v-slot:modality="item">
      <u-tags
        style="margin: 0 auto"
        :text="item?.item?.paymentMethod?.name?.[globalStore.lang]"
        size="xs"
        :delete="false"
        color="--neutral-text-caption"
        background="--neutral-surface-light"
      />
    </template>

    <template v-slot:total="item">
      <div class="total">
        <span>{{ item?.item?.numbers?.total?.value }}</span>
        <!-- <span class="icon" :class="getIconColorTotal(item.item.number)"></span> -->
        <span class="icon u u-trend-down red"></span>
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
          @click="showTransactionBank($event, item.item)"
        /> -->
        <u-tags
          v-if="['unreconciled', 'voided'].includes(item?.item?.status)"
          :icon="item.item.status"
          :text="`Conciliar (${
            item?.item?.possibleConsolidatedPaymentsCount || 0
          })`"
          size="xs"
          :delete="false"
          color="--secondary-surface-darker"
          background="--secondary-surface-light"
          @click="showTransactionBank($event, item?.item)"
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
      <div class="noTransactions">
        <div class="msg">
          <p class="body-xl-sb">Aún no hay transacciones disponibles</p>
          <img
            src="/img/banking-transactions/lupa.svg"
            alt="empy transactions"
          />
          <p class="body-m-sb">
            Para visualizar tus transacciones bancarias,<br />
            primero necesitas conectar tu cuenta bancaria o<br />
            subir un archivo con el registro de transacciones.
          </p>
        </div>

        <div class="actions">
          <u-button
            text="Vincular cuenta bancaria"
            type="outlined"
            size="l"
            icon="credit-card"
            :disabled="true"
            style="width: 100%"
          />

          <u-button
            text="Cargar archivo de transacciones"
            @click="showModalUpdatedFileTransactions = true"
            type="outlined"
            size="l"
            icon="upload"
            style="width: 100%"
          />
        </div>
      </div>
    </template>
  </TableBasic>

  <!-- dialog cargar archivo de transacciones -->
  <u-dialog
    :showModal="showModalUpdatedFileTransactions"
    :lockModal="lockModal"
    @closeModal="hideModal"
    width="auto"
    height="auto"
    :padding="paddingModalUpdatedFile"
  >
    <BankingTransactionsDialogUpdatedFileTransactionsUpload
      @closeModal="hideModal"
      @updatePadding="updatePaddingModal"
    />
  </u-dialog>

  <!--dialog conciliar -->
  <u-dialog
    :showModal="showTransaction"
    :lockModal="lockModal"
    @closeModal="hideModal"
    width="800px"
    height="818px"
    padding="24px 40px"
  >
    <BankingTransactionsDialogConciliar
      @closeModal="hideModal"
      :isEmpty="false"
    />
  </u-dialog>

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
    <BankingTransactionsDialogGoToPay @closeModal="hideModal" />
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

:deep(.notData) {
  height: calc(100vh - 400px) !important;
}

.noTransactions {
  display: flex;
  flex-direction: column;
  gap: 48px;
  align-items: center;
  width: 350px;
  height: auto;
}

.noTransactions .msg {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  gap: 16px;
  width: 350px;
  height: 166px;
}

.noTransactions .msg img {
  width: 64px;
  height: 64px;
}

.noTransactions .msg p {
  text-align: justify;
  line-height: 18px;
  color: var(--neutral-text-caption);
}

.noTransactions .actions {
  display: flex;
  flex-direction: column;
  gap: 12px;
  align-items: center;
}
</style>
