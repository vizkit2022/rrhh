<script setup>
import usePaymentsStore from "@/stores/payments";
import useGlobalStore from "@/stores/global";

// Stores
const paymentsStore = usePaymentsStore();
const globalStore = useGlobalStore();

// Constants
const { t } = useI18n();
const module = "modules.outcomes.pages.oc.modals.goToPay.step6";

</script>

<template>
    <div class="oservations">
        <div class="observations__header"><span v-text="t(module + '.texts.observations')"></span></div>
        <div class="observations__body">
            <p v-text="paymentsStore?.payment?.observations || '-'"></p>
        </div>
    </div>
</template>    

<style scoped>
.oservations {
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