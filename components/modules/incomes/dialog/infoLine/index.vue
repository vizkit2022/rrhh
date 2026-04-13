<script setup>
import { ref } from "vue";
import useGrillaStore from "@/stores/grilla";

// Stores
const grillaStore = useGrillaStore();

// Variables
const change = ref(false);
</script>

<template>
  <div class="infoLine">
    <IncomesDialogInfoLineHeader />
    <u-tabs-smart
      class="infoLine__tabs"
      :config="grillaStore.configModalInfoLine"
      v-model="grillaStore.configModalInfoLine.defaultTab"
    />
    <IncomesDialogInfoLineContent v-model:change="change" />
    <IncomesDialogInfoLineFooter v-model:change="change" />
  </div>
</template>

<style scoped>
.infoLine {
  width: 400px;
  height: calc(100vh - 48px);
  display: grid;
  grid-template-rows: 32px 32px 1fr 32px;
  row-gap: 16px;
}
.infoLine__content {
  background-color: green;
}
</style>
