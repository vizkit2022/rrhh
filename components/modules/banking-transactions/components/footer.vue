<script setup>
import useBankingTransactionsStore from "@/stores/bankingTransactions";

// STORE
const bankingTransactionsStore = useBankingTransactionsStore();


</script>

<template>
    <div class="footer">
    <u-indicators-lite
      :indicators="bankingTransactionsStore.metrics.incomesExpenses"
      style="margin-top: auto; min-height: 60px"
    />
    </div>
</template>

<style scoped>
    .footer {
        height: 100%;
        width: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
    }
</style>