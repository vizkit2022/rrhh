<script setup>
import { onMounted, computed } from "vue";
import usePaymentsStore from "@/stores/payments";
import useOrganizationStore from "@/stores/organization";
import useGlobalStore from "@/stores/global";

// Stores
const paymentsStore = usePaymentsStore();
const organizationStore = useOrganizationStore();
const globalStore = useGlobalStore();

onMounted(async () => {
    try {
      globalStore.loading = true;
      const resOrigin = await organizationStore.fetchCurrentOrgBankAccounts();
      paymentsStore.bankAccountsByUser = resOrigin?.resp || []; 
    } catch (error) {
      console.error(error);
    } finally {
      globalStore.loading = false;
    }
});

const width = computed(() => {
    const sliderExpand = globalStore.sliderExpand ? "240px" : "80px";
    return `calc(100vw - 360px - ${sliderExpand})`
});
</script>

<template>
    <div>
        <DialogCoverInfoCardsPayMethod :refresh="false" :width="width" maxWidth="800px" :by-user="false" />
    </div>
</template>

<style scoped></style>
