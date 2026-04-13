<script setup>
import { defineEmits, ref, onMounted } from "vue";

import useIncomesStore from "@/stores/incomes";
const incomesStore = useIncomesStore();

const emit = defineEmits(["closeModal", "lockModal"]);
const loading = ref(false);
const posBtn = ref(0);
const type = ref("opportunity");


onMounted(() => {
  type.value = incomesStore.currentIncome.state;
});

</script>

<template>
  <div class="containerDialog">
    <div class="modalShareTitle">
      <span>Compartir</span>
      <u-button-icon icon="close" class="btnIconModify" color="--bg-neutral-200" colorHover="--bg-neutral-400"
        colorActive="--bg-neutral-600" size="l" :disabled="loading" @action-btn="emit('closeModal')" />
    </div>
    <div class="modalShareBody">
      <span class="modalShareBodyText">Vista previa PDF</span>
      <div class="modalShareBodyItems">
          {{ incomesStore.urlPdf }}
          <iframe :src="incomesStore.urlPdf" width="100%" height="500px"></iframe>

        
      </div>

    </div>
    <div class="containerDialog__actions">
      <u-button text="Cancelar" type="outlined" size="l" class="mainBtnModify" :disabled="loading"
        @action-btn="emit('closeModal')" />
      <u-button text="Continuar" size="l" class="mainBtnModify" @action-btn="save" :disabled="loading" />
    </div>
  </div>
</template>

<style scoped>
.containerDialog {
  height: 100%;
  display: grid;
  grid-template-rows: 40px 1fr 40px;
  gap: 20px;
}

.containerDialog__title {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 40px;
  width: 100%;
}

.containerDialog__title span {
  font-family: Nunito;
  font-size: 16px;
  font-weight: 600;
  line-height: 20px;
  letter-spacing: 0em;
  text-align: left;
  color: var(--bg-neutral-700);
}

.containerDialog__content {
  display: grid;
  justify-content: center;
  grid-template-rows: auto 1fr auto;
  padding: 20px 0;
}

.containerDialog__content-title {
  text-align: center;
  font-size: 18px;
  font-weight: 600;
  color: var(--bg-neutral-700);
}

.containerDialog__content-msg {
  display: flex;
  gap: 10px;
}

.containerDialog__content-msg p,
.containerDialog__content-msg span {
  font-size: 12px;
  color: var(--bg-danger-500);
}

.containerDialog__content-msg span {
  margin-top: 2px;
}

.containerDialog__content-msg p {
  text-align: justify;
}

.containerDialog__actions {
  width: 100%;
  height: 40px;
  display: flex;
  justify-content: space-between;
}

.containerDialog__content-types {
  display: flex;
  gap: 20px;
  justify-content: center;
  align-items: center;
}

.containerDialog__content-types button {
  display: flex;
  gap: 10px;
  flex-direction: column;
  align-items: center;
}

.containerDialog__content-types img {
  height: 80px;
}

.containerDialog__content-types span {
  font-size: 12px;
  font-weight: 600;
  padding: 8px;
  width: 100px;
  border-radius: 20px;
  background-color: var(--bg-neutral-100);
  color: var(--bg-neutral-500);
}

.btnType {
  transition: 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  transform: scale(0.9);
}

.btnType:hover,
.btnType.selected {
  transform: scale(1);
}

.btnType:nth-child(1):hover span,
.btnType:nth-child(1).selected span {
  background-color: var(--bg-warning-100);
  color: var(--bg-warning-500);
}

.btnType:nth-child(2):hover span,
.btnType:nth-child(2).selected span {
  background-color: var(--bg-info-100);
  color: var(--bg-info-500);
}

.btnType:nth-child(3):hover span,
.btnType:nth-child(3).selected span {
  background-color: var(--bg-success-100);
  color: var(--bg-success-500);
}

/* modifications of customs components */

.mainBtnModify {
  width: calc(50% - 10px);
}

.btnIconModify {
  border-radius: 50%;
  color: var(--bg-neutral-500);
}


.btnCloseModal:hover .v-icon {
  color: #20a789;
  transition: 0.3s;
}

.modalShare {
  width: 100%;
  height: 544px;
  padding: 30px 30px 15px;
  display: grid;
  grid-template-rows: 30px 1fr 70px;
  gap: 20px;
  font-family: var(--font-family-nunito) !important;
}

.modalShareTitle {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 20px;
  font-weight: bold;
}

.modalShareActions {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
}

.btnShare {
  border-radius: 16px;
  padding: 10px 30px;
  font-size: 16px;
  line-height: 16px;
  width: 48%;
  transition: 0.3s;
  height: 38px;
}

.btnShareCancel {
  border: 2px solid #20a789;
  color: #20a789;
}

.btnShareCancel:hover {
  background-color: #20a78a27;
  transition: 0.3s;
}

.btnShareContinue {
  background-color: #20a789;
  color: #ffffff;
}

.btnShareContinue:hover {
  background-color: #35cbab;
  transition: 0.3s;
}

.modalShareBody {
  display: grid;
  grid-template-rows: 30px 1fr 24px;
  gap: 30px;
}

.modalShareBodyItems {
  display: grid;
  grid-template-columns: 1fr 1fr;
  grid-auto-rows: 40px;
  column-gap: 5px;
  row-gap: 5px;
}

.modalShareBodyText {
  text-align: center;
  font-size: 14px;
  margin-top: auto;
}

.btnItem {
  background: #20a78a10;
  height: 40px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 0 16px;
  transition: 0.3s;
  border: 1px solid transparent;
}

.btnItem span {
  font-size: 14px;
  margin-top: 2px;
}

.btnItem:hover {
  background: #ffffff;
  border: 1px solid #20a789;
  transition: 0.3s;
  color: #20a789;
}

.btnItem:hover .v-icon {
  transition: 0.3s;
  color: #20a789;
}

.modalShareBodyMsg {
  display: grid;
  grid-template-columns: 30px 1fr;
  font-size: 12px;
  line-height: 12px;
}

.modalShareBodyMsg div {
  display: flex;
  align-items: center;
}

.modalShareBodyMsg p {
  margin: 0px;
  text-align: justify;
}

.btnDisabled {
  background-color: #a8acab34;
}

.btnDisabled:hover {
  background-color: #a8acab34;
  border: 1px solid transparent;
  color: #4f504f;
  cursor: not-allowed;
}

.btnDisabled:hover .v-icon {
  color: #525452;
}

.sub {
  font-size: 10px !important;
}
</style>
