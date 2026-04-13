<script setup>
import useBankingTransactionsStore from "@/stores/bankingTransactions";

/*
::::::::-STORES-:::::::
*/
const bankingTransactionsStore = useBankingTransactionsStore();

// Constants
const { t } = useI18n();
const LABEL_KEY = "modules.outcomes.pages.oc.modals.viewPay";


</script>

<template>
        <div class="observations">
        <div class="observations__header"><span>{{ t(LABEL_KEY + ".texts.observations") }}</span></div>
        <div class="observations__body">
            <p v-text="bankingTransactionsStore?.dataDetailsPayment.observations || '-'"></p>
        </div>
    </div>
</template>

<style scoped>
.observations {
    overflow: hidden;
    border-radius: 12px;
    border: 1px solid var(--neutral-border-subtle);
}
.observations__header {
    padding: 0 12px;
    display: flex;
    align-items: center;
    background-color: var(--neutral-surface-softer);
    height: 48px;
    border-bottom: 1px solid var(--neutral-border-subtle);
}
.observations__header span {
    font-weight: 600;
    font-size: 14px;
    line-height: 18px;
    letter-spacing: 0%;
    vertical-align: middle;
    color: var(--neutral-text-body);
}
.observations__body {
    padding: 12px;
}
.observations__body p {
    padding: 12px 20px;
    font-weight: 400;
    font-size: 14px;
    line-height: 18px;
    letter-spacing: 0%;
    vertical-align: middle;
    color: var(--neutral-text-body);
}
</style>