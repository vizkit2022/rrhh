<script setup>
import useSalesStore from "@/stores/sales";
import { useI18n } from "vue-i18n";
import useGlobalStore from "@/stores/global";

// Translations I18n
const { t } = useI18n();
const module = "modules.sales.createCreditDebitNote";

//STATES
const salesStore = useSalesStore();
const globalStore = useGlobalStore();

// EMITS
const emit = defineEmits(["closeModal", "changeStep"]);

//CONSTANTS
// // tipos de ingresos
// const INCOMES_TYPE = ["createDoc", "registerDoc"];

//FUNCTIONS

// acciones de las cards
const selectCard = (type) => {
  salesStore.formCreditDebitNote.invoicing = type;
};

const getNameCode = (code) => {
  switch (code) {
    case "credit":
      return {
        es: "Nota de Crédito",
        en: "Credit Note",
      };
    case "debit":
      return {
        es: "Nota de Débito",
        en: "Debit Note",
      };
    default:
      return "";
  }
};

// Acciones para cambiar de step
const nextStep = () => {
  emit("changeStep", true);
};

const closeStep = () => {
  emit("closeModal");
};

const handleEscape = (event) => {
  if (event.key === "Escape") {
    closeStep();
  }
};

onMounted(() => {
  window.addEventListener("keydown", handleEscape);
});

onBeforeUnmount(() => {
  window.removeEventListener("keydown", handleEscape);
});
</script>

<template>
  <div class="container">
    <div class="header">
      <!-- <span class="body-l-sb textTitleColor">{{ `Crear ${salesStore?.formDocInvoice?.typeDocument?.code} - Seleccionar forma de ingreso` }}</span> -->
      <!-- <span class="body-l-sb textTitleColor">{{ t(`${module}.step1.titleHeader`, { typeDoc: salesStore?.formCreditDebitNote?.typeDocument?.tag || getNameCode(salesStore?.formCreditDebitNote?.typeDocument?.code)[globalStore.lang] }) }}</span> -->
      <span>{{
        t(`${module}.step1.titleHeader`, {
          typeDoc: salesStore?.formCreditDebitNote?.typeDocument?.name,
        })
      }}</span>
      <u-button-icon
        @click="closeStep"
        icon="u u-close"
        type="outlined"
        color="--neutral-text-caption"
        size="l"
        style="border-radius: 50%"
      />
    </div>

    <DialogCreateSalesDocComponentsSelectInputMethod
      :model-value="salesStore.formCreditDebitNote.invoicing"
      @update:model-value="selectCard"
    />

    <div class="footer">
      <u-button
        @click="closeStep"
        :text="t(`${module}.buttons.cancel`)"
        type="outlined"
      />
      <u-button
        :disabled="salesStore?.formCreditDebitNote?.invoicing === null"
        @click="nextStep"
        :text="t(`${module}.buttons.next`)"
      />
    </div>
  </div>
</template>

<style scoped>
.container {
  display: grid;
  grid-template-rows: auto 1fr auto;
  gap: 24px;
  height: 80vh;
  width: 80vw;
  max-height: 752px;
  max-width: 556px;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 40px;
  width: 100%;
}

.textTitleColor {
  color: var(--neutral-text-body);
}

.body {
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
  gap: 24px;
  overflow: auto;
}

.card {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px;
  width: 242px;
  height: 198px;
  border-radius: 16px;
  border: 2px solid transparent;
  background-color: var(--neutral-background-default);
  box-shadow: var(--shadow-1);
}

.card.disabled {
  cursor: not-allowed;
  opacity: 0.5;
  border: 2px solid transparent;
  background-color: var(--neutral-surface-soft);
  pointer-events: none;
}

.card:not(.disabled):hover,
.card.active {
  border: 2px solid var(--primary-border-subtle);
  cursor: pointer;
}

.card img {
  width: 112px;
  height: 100px;
}

.card span {
  text-align: center;
  color: var(--neutral-text-body);
}

.card p {
  text-align: center;
  color: var(--neutral-text-caption);
}

.footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>
