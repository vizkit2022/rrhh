<script setup>
import useIncomesStore from '@/stores/incomes';

//STORE
const incomesStore = useIncomesStore();

</script>

<template>
    <!-- pdfs informations -->
     <div class="pdfsContent">
     <IncomesContainerInformationInfoPdfsAmfi v-if="incomesStore.informationStates.currentPdf === 'AMFI'" />
     </div> 
</template>

<style scoped>
.pdfsContent {
    display: flex;
    padding: 0px 24px;
    width: 100%;
    overflow-x: auto;
}
</style>