<script setup>
import useBankingTransactionsStore from "@/stores/bankingTransactions";

const bankingTransactionsStore = useBankingTransactionsStore();

const props = defineProps({
    isEmpty: {
        type: Boolean,
        default: false
    }
});

const emit = defineEmits(["closeModal"]);
const dataPagos = ref([]);
const dataBanco = ref([]);

const dataMatches = computed(() => {
  const targetTotal = bankingTransactionsStore.data?.total;

  if (bankingTransactionsStore.tab === 0) {
    const pago = dataPagos.value.find(p => p.total === targetTotal);
    return pago?.transaction?.matches || [];
  } else {
    const banco = dataBanco.value.find(b => b.total === targetTotal);
    return banco?.transaction?.matches || [];
  }
});


const pendingChanges = ref([]);


const handleConciliadoChange = (newValue) => {
    console.log("Conciliado changed devuelve true o false:", newValue);
    const { value, data } = newValue;
    
    pendingChanges.value.push({
        account: data.account,
        conciliado: value
    });
    
    console.log("Changes pending to save:", pendingChanges.value);
}

const saveChangesToStore = () => {
    if (pendingChanges.value.length === 0) {
        console.log("No changes to save");
        return;
    }
    
    bankingTransactionsStore.data.transaction.matches = bankingTransactionsStore.data.transaction.matches.map((item) => {
        const change = pendingChanges.value.find(change => change.account === item.account);
        if (change) {
            return { ...item, conciliado: change.conciliado }
        }
        return item;
    });
    
    
    pendingChanges.value = [];

    bankingTransactionsStore.data = [];
    emit("closeModal"); 
}



const handleEscape = (event) => {
    if (event.key === "Escape") {
        emit("closeModal");
    }
}


onMounted(() => {
    document.addEventListener("keyup", handleEscape);

    dataPagos.value = bankingTransactionsStore.dataPagos;
    dataBanco.value = bankingTransactionsStore.dataBanco;

    console.log("dataPagos", dataPagos.value);
    console.log("dataBanco", dataBanco.value);
    console.log("dataMatches", dataMatches.value);

    console.log("dataUser", bankingTransactionsStore.data );

});


onUnmounted(() => {

    document.removeEventListener("keyup", handleEscape);
});

</script>

<template>
    <div class="createModal">

        <!-- salida -->
        <div class="header">
            <span>Conciliar - {{ bankingTransactionsStore.tab === 0 ? "Pago" : "Transacción Bancaria" }} </span>
            <u-button-icon type="outlined" icon="close" class="btnIconModify" color="--neutral-text-caption" size="s" @action-btn="emit('closeModal')" /> 
        </div>


        <!-- card a conciliar -->
        <BankingTransactionsComponentsMovementCard :data="bankingTransactionsStore.data" :show-header="bankingTransactionsStore.tab === 0"  :model-value="true"  />

        <!-- separador sugerencias -->
        <div class="separator">
            <div class="line"></div>
            <u-tags class="separator-text" text="Sugerencias" size="xs" :delete="false" color="--secondary-text-darker" background="--secondary-surface-light" />
            <div class="line"></div>
        </div>

        <!-- cards sugerencias -->
        <div class="containerCards">

            <div v-if="props.isEmpty || dataMatches.length === 0" class="emptyState" style="margin: 0 auto; height: 100%; gap: 12px;">
                <span class="emptyState-title">No existen pagos que coincidan</span>
                <img src="/img/banking-transactions/lupa.svg" alt="lupa" style="width: 64px; height: 64px;" />
                <u-button text="Crear Compra" type="outlined" />
                <u-button text="Vincular Compra" type="outlined" />
            </div>

            <!--  cards sugerencias -->
            <div v-else class="cards">
                <BankingTransactionsComponentsMovementCard
                v-for="(item, index) in dataMatches"
                :key="index"
                :data="item"
                :isTagPerfectMatchHeader="true"
                :showCheckBox="true"  
                :showHeader ="bankingTransactionsStore.tab === 1"
                :model-value="item.transaction?.matches[index]?.conciliado" 
                @update:conciliado="handleConciliadoChange" 
            />

            </div>

        </div>

        <!-- botones -->
        <div class="actions">
            <u-button v-if="!props.isEmpty" class="btn" text="Conciliar" size="m" @action-btn="saveChangesToStore" />
            <u-button v-else class="btn" text="Volver al listado" icon="undo" :revers="true" type="outlined" size="m" @action-btn="emit('closeModal')" />
        </div>

    </div>
</template>

<style scoped>

    .emptyState{
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        gap: 8px;
    }

    .emptyState-title{
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
    gap: 16px;
    height: 100%;
}

.containerCards > :first-child {
    margin-top: 13px;
}

 
.actions {
    display: flex;
    justify-content: flex-end;
    align-items: center;
    gap: 8px;
}


</style>