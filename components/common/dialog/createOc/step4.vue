<script setup>
import useGlobalStore from "@/stores/global";
import useOutcomesStore from "@/stores/outcomes";
import labels from "@/utils/labels/common.json";
import {onMounted, onUnmounted } from "vue";


import { transformedDate, capitalizeFirstLetter } from "@/utils/helpers";

// EventBus
const { $bus } = useNuxtApp();
$bus.$emit("updateDimensions", { width: "80vw", height: "90vh" });

// Stores
const globalStore = useGlobalStore();
const outcomesStore = useOutcomesStore();

// Constants
const expand = ref(true);
const { outcome } = outcomesStore.outcome;
const step4 = labels.modal.createOc.step4;

const formattedObservation = () => {
  return outcome?.observation.replace(/\n/g, '<br>') ?? '-';
}

const printCompras = async () => {
  console.log("Imprimir Compras");
  try {
    globalStore.loading = true;
    const response = await outcomesStore.generarPDF(outcomesStore.outcome.outcome);
    if (response) {
      window.open(response, "_blank");
    } else {
      console.error("No se pudo generar el Blob para la descarga del PDF.");
    }
  } catch (error) {
    console.error("Error al descargar el PDF:", error);
    [];
  } finally {
    globalStore.loading = false
  }
};

const handleEscapeKey = (event) => {
  if (event.key === "Escape" || event.key === "Esc") {
    $bus.$emit('closeDialog');
    $bus.$off('closeDialog');
  }
};

onMounted(() => {
  window.addEventListener("keydown", handleEscapeKey);
});

onUnmounted(() => {
  window.removeEventListener("keydown", handleEscapeKey);
});

</script>

<template>
  <div class="containerModal">
    <div class="containerModal__header">
      <div class="containerModal__header-text">
        <div>
          <span class="number"
            >{{ outcome.type }} N°{{ outcome.idNumber }}</span
          >
          <span class="title">
<!--             {{$t('modules.outcomes.pages.outcome.tabs.tab1.modals.create.step1.title.text1')
            +' '
            +outcomesStore.formOc.name
            +' '
            +$t('modules.outcomes.pages.outcome.tabs.tab1.modals.create.step1.title.text2')}} -->
          </span>
          
          <!-- toValidate, rejected, inProcess, closed, canceled -->
          <span class="tagState toValidate">Por Validar</span>
        </div>
        <div>
          <u-avatar
            :user="{
              name: outcome?.supplier?.data?.legalName ?? '',
              src: outcome.supplier?.imgUrl ?? null,
            }"
            :size="24"
          />
          <span
            class="textSecond"
            v-text="outcome?.supplier?.data?.legalName ?? ''"
          ></span>
          <span
            class="textSecond"
            v-text="transformedDate(outcome?.dueDate)"
          ></span>
        </div>
      </div>
      <u-button-icon
        icon="close"
        class="btnIconModify"
        type="outlined"
        color="--neutral-text-caption"
        size="m"
        @click="
          $bus.$emit('closeDialog');
          $bus.$off('closeDialog');
        "
      />
    </div>
    <div class="containerModal__actions">
      <u-button
        :text="step4.buttons.canceled[globalStore.lang]"
        type="outlined"
        color="--bg-secondary-400"
        colorHover="--bg-secondary-500"
        colorActive="--bg-secondary-600"
        icon="close"
      />
      <u-button
        :text="step4.buttons.pdf[globalStore.lang]"
        type="outlined"
        color="--bg-neutral-400"
        colorHover="--bg-neutral-500"
        colorActive="--bg-neutral-600"
        icon="download"
        @click="printCompras()"
      />
      <u-button
        :text="step4.buttons.justify[globalStore.lang]"
        type="outlined"
        color="--bg-primary-400"
        colorHover="--bg-primary-500"
        colorActive="--bg-primary-600"
        icon="invoice"
        @click="$bus.$emit('updatedStep', 4.1)"
      />
    </div>
    <div class="containerModal__content">
      <TableMiniGrid 
        :showTotals="false"
        :readOnly="true"
        :readOnlyLines="outcomesStore.outcome.lines"
        page="CreateOC"
        />  
    </div>
    <div class="containerModal__footer">
      <div class="containerModal__footer-description">
        <span>{{ step4.additionalText.description[globalStore.lang] }}</span>
        <p v-html="formattedObservation()"></p>
      </div>
      <table-taxes-min :taxesList="outcome.numbers" heightList="100px"/>
    </div>
  </div>
</template>

<style scoped>
span {
  font-family: Nunito;
}

/* Sections */
.containerModal {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  gap: 20px;
  overflow-y: auto;
  position: relative;
}
.containerModal__header {
  height: auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
  position: sticky;
  top: 0;
  background-color: var(--neutral-background-default);
  z-index: 2;
}
.containerModal__actions {
  height: 36px;
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 10px;
}
.containerModal__content {
  height: auto;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 20px;
  flex-shrink: 1;
}
.containerModal__footer {
  display: grid;
  gap: 12px;
  grid-template-columns: 1fr 420px;
}
.containerModal::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}
.containerModal::-webkit-scrollbar-thumb {
  border-radius: 5px;
  background: var(--neutral-surface-light);
}
.containerModal::-webkit-scrollbar-track {
  background: var(--neutral-surface-subtle);
  border-radius: 4px;
}

/* Header */

.containerModal__header span.title,
.containerModal__header span.number {
  font-size: 16px;
  font-weight: 600;
  line-height: 20px;
  text-align: left;
}
.containerModal__header span.title {
  color: var(--neutral-text-body);
}
.containerModal__header span.number {
  position: relative;
  color: var(--secondary-text-default);
  margin-right: 10px;
}
.containerModal__header span.number::before {
  position: absolute;
  content: "";
  width: 5px;
  height: 5px;
  background-color: var(--neutral-text-caption);
  border-radius: 50%;
  top: 7px;
  right: -12px;
}
.containerModal__header-text {
  display: flex;
  flex-direction: column;
}
.containerModal__header-text div {
  display: flex;
  align-items: center;
  gap: 10px;
}
.tagState {
  height: 24px;
  display: flex;
  align-items: center;
  padding: 0 10px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
  line-height: 16px;
}
.tagState.toValidate {
  color: var(--warning-text-darker);
  background-color: var(--warning-surface-shadow-12a);
}
.tagState.rejected {
  color: var(--danger-text-darker);
  background-color: var(--danger-surface-shadow-12a);
}
.tagState.inProcess {
  color: var(--primary-text-darker);
  background-color: var(--primary-surface-shadow-12a);
}
.tagState.closed {
  color: var(--neutral-text-darker);
  background-color: var(--neutral-surface-shadow-12a);
}
.tagState.canceled {
  color: var(--secondary-text-darker);
  background-color: var(--secondary-surface-shadow-12a);
}
.containerModal__header span.textSecond {
  font-size: 14px;
  font-weight: 400;
  line-height: 18px;
  color: var(--neutral-text-caption);
}

/* Footer */
.containerModal__footer-description {
border: 1px solid var(--neutral-border-light);
border-radius: 16px;
position: relative;
overflow-y: auto;
display: flex;
flex-direction: column;
gap: 10px;
padding: 0px 12px 8px;
}
.containerModal__footer-description span {
  background-color: var(--neutral-background-default);
  position: sticky;
  top: 0;
  padding-top: 8px;
}
.containerModal__footer-description span, .containerModal__footer-description p {
  font-size: 12px;
  font-weight: 600;
  line-height: 16px;
  text-align: left;
  color: var(--neutral-text-body);
}

/* CUSTOM COMPONENTS - MODIFY */
.btnIconModify {
  border-radius: 50%;
}
</style>
