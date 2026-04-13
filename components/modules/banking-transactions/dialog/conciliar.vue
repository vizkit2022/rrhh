<script setup>
import useBankingTransactionsStore from "@/stores/bankingTransactions";
import useGlobalStore from "@/stores/global";

const bankingTransactionsStore = useBankingTransactionsStore();
const globalStore = useGlobalStore();

const props = defineProps({
  isEmpty: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(["closeModal"]);
const currentData = ref(bankingTransactionsStore.dataReconcile.currentData);
const loadingMatch = ref(false);

const pendingChanges = ref([]);

// const handleConciliadoChange = (newValue) => {
//     console.log("Conciliado changed devuelve true o false:", newValue);
//     const { value, data } = newValue;

//     pendingChanges.value.push({
//         account: data.account,
//         conciliado: value
//     });

//     console.log("Changes pending to save:", pendingChanges.value);
// }

const handleConciliadoChange = ({ value, data }) => {
  data.select = value;
  bankingTransactionsStore.updateSelectedMatches();
};

const isEmptySuggestions = computed(() => {
  if (loadingMatch.value) return false;

  const data =
    bankingTransactionsStore.tab === 0
      ? bankingTransactionsStore.dataReconcile?.dataPayments
      : bankingTransactionsStore.dataReconcile?.dataBank;

  const bestMatchEmpty = !(data?.bestMatch?.length > 0);
  const othersEmpty = !(data?.others?.length > 0);

  return bestMatchEmpty && othersEmpty;
});

const getBestMatchArray = () => {
  if (bankingTransactionsStore.tab === 0) {
    // payments
    const bm = bankingTransactionsStore.dataReconcile?.dataPayments?.bestMatch;
    return bm ? (Array.isArray(bm) ? bm : [bm]) : [];
  } else {
    // bank transactions
    const bm = bankingTransactionsStore.dataReconcile?.dataBank?.bestMatch;
    return bm ? (Array.isArray(bm) ? bm : [bm]) : [];
  }
};

const getOthersArray = () => {
  if (bankingTransactionsStore.tab === 0) {
    // payments
    return bankingTransactionsStore.dataReconcile?.dataPayments?.others || [];
  } else {
    // bank transactions
    return bankingTransactionsStore.dataReconcile?.dataBank?.others || [];
  }
};

const saveChangesToStore = async () => {
  const body = {
    paymentId: bankingTransactionsStore.dataReconcile.currentData.id,
    bankTransactionId: bankingTransactionsStore.dataReconcile.dataMatches.id,
  };

  try {
    globalStore.loading = true;
    await bankingTransactionsStore.matchPayments(body);
    emit("closeModal");
  } catch (error) {
    console.error(error);
  } finally {
    globalStore.loading = false;
  }
};

// const saveChangesToStore = () => {
//   if (pendingChanges.value.length === 0) {
//     console.log("No changes to save");
//     return;
//   }

//   // Actualizar match en el store
//   // bankingTransactionsStore.data.transaction.matches = bankingTransactionsStore.data.transaction.matches.map((item) => {
//   //     const change = pendingChanges.value.find(change => change.account === item.account);
//   //     if (change) {
//   //         return { ...item, conciliado: change.conciliado }
//   //     }
//   //     return item;
//   // });

//   pendingChanges.value = [];

//   bankingTransactionsStore.data = [];
//   emit("closeModal");
// };

const handleEscape = (event) => {
  if (event.key === "Escape") {
    emit("closeModal");
  }
};

onMounted(async () => {
  document.addEventListener("keyup", handleEscape);

  try {
    if (bankingTransactionsStore.tab === 0) {
      loadingMatch.value = true;
      await bankingTransactionsStore.getPossibleConciliationsPayments(
        bankingTransactionsStore.dataReconcile.currentData._id,
        "payment"
      );
    } else if (bankingTransactionsStore.tab === 1) {
      loadingMatch.value = true;
      await bankingTransactionsStore.getPossibleConciliationsBankTransactions(
        bankingTransactionsStore.dataReconcile.currentData._id,
        "transaction"
      );
    }
  } catch (error) {
    console.error("Error fetching payments:", error);
  } finally {
    loadingMatch.value = false;
  }
});

onUnmounted(() => {
  document.removeEventListener("keyup", handleEscape);

  bankingTransactionsStore.dataReconcile.dataBank = [];
  bankingTransactionsStore.dataReconcile.dataPayments = [];
  bankingTransactionsStore.dataReconcile.dataMatches = {};
});
</script>

<template>
  <div class="createModal">
    <!-- salida -->
    <div class="header">
      <span
        >Conciliar -
        {{
          bankingTransactionsStore.tab === 0 ? "Pago" : "Transacción Bancaria"
        }}
      </span>
      <u-button-icon
        type="outlined"
        icon="close"
        class="btnIconModify"
        color="--neutral-text-caption"
        size="s"
        @action-btn="emit('closeModal')"
      />
    </div>

    <!-- card a conciliar -->
    <BankingTransactionsComponentsMovementCard
      :data="currentData"
      :is-banking-transaction="bankingTransactionsStore.tab === 1"
      :show-header="bankingTransactionsStore.tab === 0"
      :model-value="true"
    />

    <!-- separador sugerencias -->
    <div class="separator">
      <div class="line"></div>
      <u-tags
        class="separator-text"
        text="Sugerencias"
        size="xs"
        :delete="false"
        color="--secondary-text-darker"
        background="--secondary-surface-light"
      />
      <div class="line"></div>
    </div>

    <!-- cards sugerencias -->
    <!-- cards sugerencias -->

    <div class="containerCards">
      <div
        v-if="isEmptySuggestions"
        class="emptyState"
        style="margin: 0 auto; height: 100%; gap: 12px"
      >
        <span class="emptyState-title">No existen pagos que coincidan</span>
        <img
          src="/img/banking-transactions/lupa.svg"
          alt="lupa"
          style="width: 64px; height: 64px"
        />
        <u-button text="Crear Compra" type="outlined" :disabled="true" />
        <u-button text="Vincular Compra" type="outlined" :disabled="true" />
      </div>
      <div class="loaderContainer" v-else-if="loadingMatch">
        <img
          src="/img/cargandoMatch.gif"
          alt="miauCargando"
          style="width: 64px; height: 64px"
        />
        <span class="body-l-sb">Buscando matches...</span>
      </div>
      <!-- cards sugerencias -->
      <div v-else class="cards">
        <BankingTransactionsComponentsMovementCard
          v-for="(item, index) in getBestMatchArray()"
          :key="'bestMatch-' + index"
          :data="item"
          :isTagPerfectMatchHeader="true"
          :showCheckBox="true"
          :showHeader="bankingTransactionsStore.tab === 1 ? true : false"
          :model-value="item.select"
          @update:conciliado="handleConciliadoChange"
        />

        <BankingTransactionsComponentsMovementCard
          v-for="(item, index) in getOthersArray()"
          :key="'others-' + index"
          :data="item"
          :isTagPerfectMatchHeader="false"
          :showCheckBox="true"
          :showHeader="bankingTransactionsStore.tab === 1 ? true : false"
        />
      </div>
    </div>

    <!-- botones -->
    <div class="actions">
      <u-button
        v-if="!props.isEmpty"
        class="btn"
        text="Conciliar"
        :disabled="
          Object.keys(bankingTransactionsStore.dataReconcile.dataMatches)
            .length === 0
        "
        size="m"
        @action-btn="saveChangesToStore"
      />
      <u-button
        v-else
        class="btn"
        text="Volver al listado"
        icon="undo"
        :revers="true"
        type="outlined"
        size="m"
        @action-btn="emit('closeModal')"
      />
    </div>
  </div>
</template>

<style scoped>
.emptyState {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 8px;
}

.emptyState-title {
  font-size: 16px;
  font-weight: 600;
  line-height: 20px;
  text-align: center;
  color: var(--bg-neutral-500);
}

.createModal {
  height: 100%;
  display: grid;
  grid-template-rows: 32px 1fr 24px 466px 36px;
  gap: 24px;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 32px;
}

.header span {
  font-size: 16px;
  font-weight: 600;
  line-height: 20px;
  text-align: left;
  color: var(--neutral-text-body);
}

.btnIconModify {
  border-radius: 50%;
  color: var(--neutral-surface-default);
}

.separator {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  gap: 24px;
}

.separator .line {
  flex-grow: 1;
  height: 1px;
  background-color: var(--neutral-border-subtle);
}

.separator-text {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 160px;
  height: 24px;
  font-size: 12px;
  font-weight: 600;
  color: var(--neutral-text-body);
  white-space: nowrap;
}

.containerCards {
  display: flex;
  flex-direction: column;
  gap: 16px;
  height: 466px;
  overflow-y: auto;
}

.containerCards .cards {
  display: flex;
  flex-direction: column;
  gap: 30px;
  height: 100%;
}

.containerCards > :first-child {
  margin-top: 14px;
}

.loaderContainer {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 12px;
  height: 100%;
}

.loaderContainer span {
  color: var(--neutral-text-caption);
}

.actions {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 8px;
}
</style>
