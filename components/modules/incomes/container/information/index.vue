<script setup>
import useIncomesStore from "@/stores/incomes";

// STORES
const incomesStore = useIncomesStore();

// const pos = ref(0);
// const currentPdf = ref('AMFI');

onMounted(() => {
  incomesStore.informationStates.posNav = 0;
  incomesStore.informationStates.currentPdf = "AMFI";
});

onActivated(async () => {
  await incomesStore.getMovementBasicData(incomesStore.income._id);
});

function selectedOption(id) {
  incomesStore.informationStates.posNav = id;
}
</script>

<template>
  <div class="informacion">
    <IncomesContainerInformationNav @selectedOption="selectedOption" />
    <IncomesContainerInformationInfoPdfs />
  </div>
</template>

<style scoped>
.informacion {
  display: grid;
  width: 100%;
  height: calc(100vh - 166px);
  border-radius: 24px;
  box-sizing: border-box;
  grid-template-columns: auto 1fr;
  gap: 10px;
  background-color: var(--neutral-background-default);
  padding: 24px;
  box-shadow: var(--elevation-l);
}
</style>
