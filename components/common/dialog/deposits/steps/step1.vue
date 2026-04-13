<script setup>
import { onMounted } from "vue";
import usePaymentsStore from "@/stores/payments";
import useGlobalStore from "@/stores/global";
import {
  formatCurrency,
  getValueFormaRealTime,
  convertToNumber,
} from "@/utils/formatAmount";

// Stores
const paymentsStore = usePaymentsStore();
const globalStore = useGlobalStore();

// Constants
const idSupplier = ref(null);

// Computed
const baseCurrency = computed(() => paymentsStore.formDeposits.currencyInitial);

//Functions
const formatData = (number, currency) => {
  const { precision, typeFormat } = currency;
  const numberAprox = convertToNumber(number, typeFormat, precision);
  return {
    number,
    value: formatCurrency(numberAprox, currency, true),
    numberAprox,
  };
};

const recalculateTableDeposits = (newCurrency) => {
  console.log('recalculateTableDeposits');
  console.log('newCurrency', newCurrency);
  console.log('currencies', paymentsStore.formDeposits.currencies);

  if (!newCurrency || !baseCurrency.value) return;

  const rateBase = paymentsStore.formDeposits.currencies.find((c) => c.code === baseCurrency.value.code);

  paymentsStore.formDeposits.lines.forEach((line) => {
    // 1. Guardar porcentaje actual
    const currentPercentage = parseFloat(line.numbers.percentage.replace(",", ".")) || 0;

    // 2. valores bases
    const baseUnpaid = line.numbers.unpaidBase || 0;
    const baseTotal = line.numbers.totalBase || 0;

    // 3. Convertir la moneda base a la moneda extranjera con la tasa de cambio
    let convertedUnpaid, convertedTotal;

    if (newCurrency.code === baseCurrency.value.code) {
      // Volviendo a moneda base - usar valores originales
      convertedUnpaid = baseUnpaid;
      convertedTotal = baseTotal;
    } else {
      // Convirtiendo a moneda extranjera - multiplicar por la tasa
      convertedUnpaid = baseUnpaid * rateBase.valueManual;
      convertedTotal = baseTotal * rateBase.valueManual;
    }

    // 4. Actualizar valores mostrados
    line.numbers.unpaid = formatData(convertedUnpaid, newCurrency);
    // line.numbers.total = formatData(convertedTotal, newCurrency); // No se actualiza el total

    // 5. Recalcular amountDeposit basandonos en el porcentaje
    const newAmount = currentPercentage === 0 
      ? 0 
      : Math.trunc(convertedUnpaid * currentPercentage * 100) / 10000;
    
    line.numbers.amountDeposit = {
      ...line.numbers.amountDeposit,
      ...formatData(newAmount, newCurrency),
    };
  });

  // 6. Recalcular total de depósitos
  const total = paymentsStore.formDeposits.lines.reduce((sum, l) => sum + (l.numbers.amountDeposit.number || 0), 0);
  
  paymentsStore.formDeposits.totalDeposits = formatData(total, newCurrency);
};
const recalculateTableRefund = (newCurrency) => {
  console.log('recalculateTableRefund');
  console.log('newCurrency', newCurrency);
  console.log('currencies', paymentsStore.formDeposits.currencies);

  if (!newCurrency || !baseCurrency.value) return;

  const rateBase = paymentsStore.formDeposits.currencies.find((c) => c.code === baseCurrency.value.code);

  paymentsStore.formDeposits.lines.forEach((line) => {
    // 1. Guardar porcentaje actual
    const currentPercentage = parseFloat(line.numbers.percentage.replace(",", ".")) || 0;

    // 2. valores bases
    const baseCharged = line.numbers.chargedBase || 0;
    const baseTotal = line.numbers.totalBase || 0;

    // 3. Convertir la moneda base a la moneda extranjera con la tasa de cambio
    let convertedCharged, convertedTotal;

    if (newCurrency.code === baseCurrency.value.code) {
      // Volviendo a moneda base - usar valores originales
      convertedCharged = baseCharged;
      convertedTotal = baseTotal;
    } else {
      // Convirtiendo a moneda extranjera - multiplicar por la tasa
      convertedCharged = baseCharged * rateBase.valueManual;
      convertedTotal = baseTotal * rateBase.valueManual;
    }

    // 4. Actualizar valores mostrados
    line.numbers.charged = formatData(convertedCharged, newCurrency);
    // line.numbers.total = formatData(convertedTotal, newCurrency); // No se actualiza el total

    // 5. Recalcular amountDeposit basandonos en el porcentaje
    const newAmount = currentPercentage === 0 
      ? 0 
      : Math.trunc(convertedCharged * currentPercentage * 100) / 10000;
    
    line.numbers.amountDeposit = {
      ...line.numbers.amountDeposit,
      ...formatData(newAmount, newCurrency),
    };
  });

  // 6. Recalcular total de depósitos
  const total = paymentsStore.formDeposits.lines.reduce((sum, l) => sum + (l.numbers.amountDeposit.number || 0), 0);
  
  paymentsStore.formDeposits.totalDeposits = formatData(total, newCurrency);
};
const recalculateTableCharged = (newCurrency) => {
  console.log('recalculateTableCharged');
  console.log('newCurrency', newCurrency);
  console.log('currencies', paymentsStore.formDeposits.currencies);

  if (!newCurrency || !baseCurrency.value) return;

  const rateBase = paymentsStore.formDeposits.currencies.find((c) => c.code === baseCurrency.value.code);

  paymentsStore.formDeposits.lines.forEach((line) => {
    // 1. Guardar porcentaje actual
    const currentPercentage = parseFloat(line.numbers.percentage.replace(",", ".")) || 0;

    // 2. valores bases
    const baseUnCharged = line.numbers.unChargedBase || 0;
    const baseTotal = line.numbers.totalBase| 0;

    // 3. Convertir la moneda base a la moneda extragera con la tasa de cambio
    let convertedUnCharged, convertedTotal;

    if (newCurrency.code === baseCurrency.value.code) {
      // Volviendo a moneda base - usar valores originales
      convertedUnCharged = baseUnCharged;
      convertedTotal = baseTotal;
    } else {
      // Convirtiendo a moneda extranjera - multiplicar por la tasa
      convertedUnCharged = baseUnCharged * rateBase.valueManual;
      convertedTotal = baseTotal * rateBase.valueManual;
    }

    // 4. Actualizar valores mostrados
    line.numbers.unCharged = formatData(convertedUnCharged, newCurrency);
    // line.numbers.total = formatData(convertedTotal, newCurrency); // No se actualiza el total 

    // 5. Recalcular amountDeposit basandonos en el porcentaje
    const newAmount = currentPercentage === 0 
      ? 0 
      : Math.trunc(convertedUnCharged * currentPercentage * 100) / 10000;
    
    line.numbers.amountDeposit = {
      ...line.numbers.amountDeposit,
      ...formatData(newAmount, newCurrency),
    };
  });

      // 7. Recalcular total de depósitos
    const total = paymentsStore.formDeposits.lines.reduce((sum, l) => sum + (l.numbers.amountDeposit.number || 0), 0);
    
    paymentsStore.formDeposits.totalDeposits = formatData(total, newCurrency);
}


const funtionsRecalculateTables = (type) => {
  switch (type) {
    case 'outcome': {
      recalculateTableDeposits(paymentsStore.formDeposits.currency);
      break;
    } case 'sales-documents-charged': {
      recalculateTableCharged(paymentsStore.formDeposits.currency);
      break;
    } case 'sales-documents-refund': {
      recalculateTableRefund(paymentsStore.formDeposits.currency);
      break;
    }
  }
}


// Cicles
onMounted(async () => {
  // Si ya cargaron las monedas, no volver a cargarlas
  if( paymentsStore.formDeposits.currencies.length > 0 ) return;

  let resp = null;
  const currencyBase = paymentsStore?.formDeposits?.currency?._id || paymentsStore?.formDeposits?.currency || null;

  if (currencyBase) {
    paymentsStore.formDeposits.currencyLoading = true;
    resp = await globalStore.getMyCurrencies(true, currencyBase);
    paymentsStore.formDeposits.currencyLoading = false;
  }

  if (paymentsStore.type !== 'outcome') {
    paymentsStore.formDeposits.currencyInitial = globalStore.currencies.find(c => c._id === currencyBase) || null;
    paymentsStore.formDeposits.currency = globalStore.currencies.find(c => c._id === currencyBase) || null;
  } else {
    paymentsStore.formDeposits.currencyInitial =paymentsStore.formDeposits.currency
  }


  paymentsStore.formDeposits.currencies = [];
  if (resp) {

      const normalizeToNumber = (value) => {
      if (value === null || value === undefined || value === '') return 0;

      return Number(value.replace(",",""))
    };

    paymentsStore.formDeposits.currencies = resp.currencies.filter(c => c._id !== currencyBase).map((c) => {
      return {
        ...c,
        valueToday: normalizeToNumber(c.value),
        valueManual: normalizeToNumber(c.value),
      }
    });
    // paymentsStore.formDeposits.currencies.shift(paymentsStore.formDeposits.currency);

  }
  
  if (paymentsStore.formDeposits.type === "outcome") {
    console.log('entre a outcome id supplier');
    idSupplier.value = paymentsStore?.formDeposits?.supplier?.contact?._id || null;
  } else if (paymentsStore.formDeposits.type === "sales-documents-charged" || paymentsStore.formDeposits.type === "sales-documents-refund") {
    console.log('entre a sales-documents-charged id supplier');
    idSupplier.value = paymentsStore?.formDeposits?.supplier?.contact || null;
  }



  if(idSupplier.value) {
    const resDestination = await paymentsStore.getBankAccountsByUser(idSupplier.value, true);
    paymentsStore.formDeposits.originBankAccounts = resDestination || [];
  }
});
</script>

<template>
  <div class="step">
    <DialogDepositsComponentsHeaderStep1 @recalculateTable="funtionsRecalculateTables(paymentsStore.formDeposits.type)" />
    <DialogDepositsComponentsTableOutcome v-if="paymentsStore.formDeposits.type === 'outcome'" />
    <DialogDepositsComponentsSalesDocChargeTable v-else-if="paymentsStore.formDeposits.type === 'sales-documents-charged'" />
    <DialogDepositsComponentsSalesDocRefundTable v-else-if="paymentsStore.formDeposits.type === 'sales-documents-refund'" />
    <span v-else>Tipo no reconocido</span>
  </div>
</template>

<style scoped>
.step {
  width: 85vw;
  min-width: 680px;
  max-width: 1100px;
  height: auto;
  /* max-height: 600px; */
  display: grid;
  row-gap: 16px;
}
@media only screen and (max-width: 768px) {
  .step {
    max-height: calc(100vh - 140px);
  }
}
</style>
