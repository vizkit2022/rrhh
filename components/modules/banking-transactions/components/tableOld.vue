<script setup>
import configBankingTransactions from "@/utils/configTables/bankingTransactions.json";
import useBankingTransactionsStore from "@/stores/bankingTransactions";
import { transformedDate } from "@/utils/helpers";
import { onClickOutside } from '@vueuse/core'

const bankingTransactionsStore = useBankingTransactionsStore();

//constants
const showTransaction = ref(false);
const showDropdown = ref(false);
const isEmpty = ref(false);
const showConciliadoDropdown = ref(false); 
const posConciliado = ref({x: 40, y: 40}); 
const conciliadoData = ref([]); 
const conciliadoDropdownRef = ref(null)

// Function to close the modal
const hideModal = () => {
    showTransaction.value = false;
}

// Función para cerrar el dropdown de Conciliado
const hideConciliadoDropdown = () => {
    showConciliadoDropdown.value = false;
}

// array of payments and banks
const arrayPagosCobros = [
    {
        selected : false,
        date : "2025-04-23T20:07:12.427Z",
        account : {
            name: "Tarjeta Santander",
            logo: "./img/iconsTarjetasBancos/santander.png"
        },
        recipient: {
            name: "Loreto Miranda",
            logo: "./img/iconsDestinatariosBancos/loreto.png"
        },
        modality : "Tarjeta de Credito",
        total : '700.000',
        transaction : {
            name: "Conciliado",
            amount: 0 
        },
    },
    {
        selected : false,
        date : "2025-04-23T20:07:12.427Z",
        account : {
            name: "bici",
            logo: "./img/iconsTarjetasBancos/bici.png"
        },
        recipient: {
            name: "Loreto Miranda",
            logo: "./img/iconsDestinatariosBancos/Lipigas.png"
        },
        modality : "Transferencia",
        total : '-523.000',
        transaction : {
            name: "Conciliar",
            amount: 2 
        },
    },
    {
        selected : false,
        date : "2025-04-23T20:07:12.427Z",
        account : {
            name: "Tarjeta Santander",
            logo: "./img/iconsTarjetasBancos/santander.png"
        },
        recipient: {
            name: "Dortz",
            logo: "./img/iconsDestinatariosBancos/Dortz.png"
        },
        modality : "Cheque",
        total : '200.000',
        transaction : {
            name: "Conciliar",
            amount: 0 
        },
    },
    {
        selected : false,
        date : "2025-04-23T20:07:12.427Z",
        account : {
            name: "bici",
            logo: "./img/iconsTarjetasBancos/bici.png"
        },
        recipient: {
            name: "Loreto Miranda",
            logo: "./img/iconsDestinatariosBancos/Lipigas.png"
        },
        modality : "Transferencia",
        total : '-523.000',
        transaction : {
            name: "Conciliar",
            amount: 2 
        },
    },
    {
        selected : false,
        date : "2025-04-23T20:07:12.427Z",
        account : {
            name: "Tarjeta Santander",
            logo: "./img/iconsTarjetasBancos/santander.png"
        },
        recipient: {
            name: "Loreto Miranda",
            logo: "./img/iconsDestinatariosBancos/loreto.png"
        },
        modality : "Tarjeta de Credito",
        total : '700.000',
        transaction : {
            name: "Conciliado",
            amount: 0 
        },
    },
]

const arrayBanco = [
    {
        selected : false,
        date : "2025-04-23T20:07:12.427Z",
        account : {
            name: "Banco de Chile",
            logo: "./img/iconsTarjetasBancos/bchile.png"
        },
        description: "Transferencia a cuenta corriente",
        recipient: {
            name: "Movistar",
            logo: "./img/iconsDestinatariosBancos/movistar.png"
        },
        total : '3.923.000',
        transaction : {
            name: "Conciliado",
            amount: 0,
            matches: []
        }
    },
    {
        selected : false,
        date : "2025-04-23T20:07:12.427Z",
        account : {
            name: "Estado",
            logo: "./img/iconsTarjetasBancos/estado.png"
        },
        description: "Traspaso de mi empresa",
        recipient: {
            name: "Lipigas",
            logo: "./img/iconsDestinatariosBancos/Lipigas.png"
        },
        total : '200.000',
        transaction : {
            name: "Conciliar",
            amount: 2,
            matches: [] 
        },
    },
    {
        selected : false,
        date : "2025-04-23T20:07:12.427Z",
        account : {
            name: "Estado",
            logo: "./img/iconsTarjetasBancos/scotiabank.png"
        },
        description: "Reembolso de PC Factory",
        recipient: {
            name: "Lipigas",
            logo: "./img/iconsDestinatariosBancos/pcfactory.png"
        },
        total : '240.000',
        transaction : {
            name: "Conciliar",
            amount: 0,
            matches: []
        },
    },
    {
        selected : false,
        date : "2025-04-23T20:07:12.427Z",
        account : {
            name: "Banco de Chile",
            logo: "./img/iconsTarjetasBancos/bici.png"
        },
        description: "Transferencia a cuenta corriente",
        recipient: {
            name: "Movistar",
            logo: "./img/iconsDestinatariosBancos/movistar.png"
        },
        total : '6.451.000',
        transaction : {
            name: "Conciliar",
            amount: 0,
            matches: []
        },
    },
    {
        selected : false,
        date : "2025-04-23T20:07:12.427Z",
        account : {
            name: "Estado",
            logo: "./img/iconsTarjetasBancos/estado.png"
        },
        description: "Traspaso de mi empresa",
        recipient: {
            name: "Lipigas",
            logo: "./img/iconsDestinatariosBancos/Lipigas.png"
        },
        total : '200.000',
        transaction : {
            name: "Conciliar",
            amount: 2,
            matches: [] 
        },
    },
]

// Función para calcular posición del dropdown de Conciliado
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

//emit event conciliar 
const actionTable = (obj) => {
    const { emit, data, pos, event } = obj;

    console.log(event.x)
    console.log(event.y)

    const emits = {
        showTransactionPayments: () => {
            if (bankingTransactionsStore.tab == 0 && data.transaction.amount > 0 && !data.transaction.matches.some(a => a.conciliado === true)) {
                showTransaction.value = true;
                bankingTransactionsStore.data = data;
                isEmpty.value = false;
            } else if (bankingTransactionsStore.tab == 0 && data.transaction.amount == 0 && !data.transaction.matches.some(a => a.conciliado === true)) {
                showTransaction.value = true
                bankingTransactionsStore.data = data;
                isEmpty.value = true;
            } 
            else if (bankingTransactionsStore.tab == 0 && data.transaction.matches.some(a => a.conciliado === true)) {
                if (!showConciliadoDropdown.value) {
                    showConciliadoDropdown.value = true;
                    conciliadoData.value = data.transaction?.matches.filter(a => a.conciliado === true);
                    console.log('conciliadoData',conciliadoData.value)
                    calcPositionConciliadoDropdown(event);
                }
            } 
        },

        showTransactionBank: () => {
            if (bankingTransactionsStore.tab == 1 && data.transaction.amount > 0 && !data.transaction.matches.some(a => a.conciliado === true)) {
                showTransaction.value = true;
                bankingTransactionsStore.data = data;
                isEmpty.value = false;
            } else if (bankingTransactionsStore.tab == 1 && data.transaction.amount == 0 && !data.transaction.matches.some(a => a.conciliado === true)) {
                showTransaction.value = true
                bankingTransactionsStore.data = data;
                isEmpty.value = true;
            } 
            else if (bankingTransactionsStore.tab == 1 && data.transaction.matches.some(a => a.conciliado === true)) {
                if (!showConciliadoDropdown.value) {
                    showConciliadoDropdown.value = true;
                    conciliadoData.value = data.transaction.matches.filter(a => a.conciliado === true);
                    console.log('conciliadoData',conciliadoData.value)
                    calcPositionConciliadoDropdown(event);
                }
            } 
        }
    }
    emits[emit]();
}



// Function to transform the date format

const getIconColorTotal = (total) => {
    if(total && String(total).includes('-')) return "u u-trend-down red";
    return "u u-trend-up green";
}

const parseTotal = str =>
  Number(
    String(str)
      .replace(/\./g, '')    // quita separadores de miles
      .replace(/,/g, '.')    // si hubiera decimales con coma
  );

//   function reconcileAmounts(pagos, bancos) {
//   pagos.forEach(p => {
//     const valP = parseTotal(p.total);
//     p.transaction.amount = bancos.filter(b => parseTotal(b.total) === valP).length;
//   });
//   bancos.forEach(b => {
//     const valB = parseTotal(b.total);
//     b.transaction.amount = pagos.filter(p => parseTotal(p.total) === valB).length;
//   });
// }

// Count el numero de pagos y bancos que tienen el mismo total


// computed que cuenta coincidencias
const pagosConAmount = computed(() => {
  return arrayPagosCobros.map(p => {
    const valP = parseTotal(p.total)
    const matches = arrayBanco.filter(b => parseTotal(b.total) === valP).
    map(m => ({
        ...m,
        conciliado: false
    }))
    return {
      ...p,
      transaction: {
        ...p.transaction,
        amount: matches.length,
        matches   
      }
    }
  })
})

const bancosConAmount = computed(() => {
  return arrayBanco.map(b => {
    const valB = parseTotal(b.total)
    const matches = arrayPagosCobros.filter(p => parseTotal(p.total) === valB).
    map(m => ({
        ...m,
        conciliado: false
    }))
    return {
      ...b,
      transaction: {
        ...b.transaction,
        amount: matches.length,
        matches    
      }
    }
  })
})

// Watchers que vuelcan al array original y al store
watch(pagosConAmount, (nuevos) => {
  nuevos.forEach((p, i) => {
    arrayPagosCobros[i].transaction.amount  = p.transaction.amount
    arrayPagosCobros[i].transaction.matches = p.transaction.matches
  })
  // actualizo el store para que tu tabla vea también el matches
  bankingTransactionsStore.dataPagos = [...arrayPagosCobros]
}, { immediate: true })

watch(bancosConAmount, (nuevos) => {
  nuevos.forEach((b, i) => {
    arrayBanco[i].transaction.amount  = b.transaction.amount
    arrayBanco[i].transaction.matches = b.transaction.matches
  })
  bankingTransactionsStore.dataBanco = [...arrayBanco]
}, { immediate: true })


onMounted(() => {
  // Click fuera del dropdown
  onClickOutside(conciliadoDropdownRef, () => {
    showConciliadoDropdown.value = false
  })
  
  console.log("pagos", bankingTransactionsStore.dataPagos)
  console.log("bancos", bankingTransactionsStore.dataBanco)

  // Escape key handler
  const handleEscape = (event) => {
    if (event.key === 'Escape' && showConciliadoDropdown.value) {
      showConciliadoDropdown.value = false
    }
  }

  document.addEventListener('keydown', handleEscape)

})

  // Limpieza al desmontar
  onBeforeUnmount(() => {
    document.removeEventListener('keydown', handleEscape)
  })

</script>

<template>
    <TableBasic :configTable="configBankingTransactions[bankingTransactionsStore.tab == 0 ? 'payments' : 'bank']" :content="bankingTransactionsStore.tab == 0 ? bankingTransactionsStore.dataPagos : bankingTransactionsStore.dataBanco" @actionTable="actionTable">

        <template v-slot:date="item">
            <div>
                <span>{{ transformedDate(item.item.date) }}</span>
            </div>
        </template>
    
        <template v-slot:account="item">
            <div class="account">
                <u-avatar :user="{ name: item.item.account.name, src: item.item.account.logo }" :size="32" />
                <span>{{ item.item.account.name }}</span>
            </div>
        </template>

        <template v-if="bankingTransactionsStore.tab == 1" v-slot:description="item">
            <div>
                <span class="description">{{ item.item.description }}</span>
            </div>
        </template>


        <template v-slot:recipient="item">
            <div class="recipient">
                <u-avatar :user="{ name: item.item.recipient.name, src: item.item.recipient.logo }" :size="32" />
                <span>{{ item.item.recipient.name }}</span>
            </div>
        </template>

        <template v-if="bankingTransactionsStore.tab == 0" v-slot:modality="item">
                <u-tags style="margin: 0 auto;" :text="item.item.modality" size="xs" :delete="false" color="--neutral-text-caption" background="--neutral-surface-light" />
        </template>

        <template v-slot:total="item">
            <div class="total">
                <span class="icon" :class="getIconColorTotal(item.item.total)"></span>
                <span>$ {{ item.item.total }}</span>
            </div>
        </template>
        <template v-slot:transaction="item">
    <div class="transaction">
        <u-tags v-if="!item.item.transaction.matches.some(a => a.conciliado === true)" 
                :text="`Conciliar (${item.item.transaction.amount})`" 
                size="xs" 
                :delete="false" 
                color="--secondary-surface-darker" 
                background="--secondary-surface-light"/>
        <u-tags v-else text="Conciliado" 
                icon="click" 
                size="xs" 
                :delete="false" 
                color="--info-text-darker" 
                background="--info-surface-light" />
    </div>
</template>


    </TableBasic>

    <u-dialog :showModal="showTransaction" @closeModal="hideModal" width="800px" height="818px" padding="24px 40px" >
        <BankingTransactionsDialogConciliar @closeModal="hideModal" :isEmpty="isEmpty" />
    </u-dialog>
    
    <!-- Dropdown para Conciliado -->
    <div class="conciliado-dropdown" ref="conciliadoDropdownRef" :class="{ 'show': showConciliadoDropdown }" :style="{ top: posConciliado.y, left: posConciliado.x }">
        <BankingTransactionsComponentsMovementCard  :data="conciliadoData[0]" :isTagPerfectMatchHeader="false" :showButtonDesconciliar="true" :show-header="bankingTransactionsStore.tab == 1" />
    </div>
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

    /* Resto de estilos existentes */
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
        justify-content: space-between;
    }

    .total span {
        font-size: 14px;
        color: var(--neutral-text-body);
        font-weight: 600;
        line-height: 18px;
    }

    .icon  {
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
</style>