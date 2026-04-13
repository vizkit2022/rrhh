<script setup>
import useSalesStore from "@/stores/sales";
import useGlobalStore from "@/stores/global";
import { useI18n } from "vue-i18n";

// Translations I18n
const { t } = useI18n();
const module = "modules.sales.createSale";

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
  salesStore.formDocInvoice.invoicing = type;
};

const getNameCode = (code) => {
  switch (code) {
    case "invoice":
      return {
        es: "Documento base",
        en: "Base Document",
      };
    default:
      return "";
  }
};

// Acciones para cambiar de step
const nextStep = () => {
  if (salesStore.formDocInvoice.invoicing) {
    if (salesStore.formDocInvoice.dialogNotices.sii) {
      emit("changeStep", true, 3);
    } else {
      emit("changeStep", true);
    }
  } else {
    emit("changeStep", true, 3);
  }
};

const closeStep = () => {
  salesStore.cleanFormDocInvoice();
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
      <span class="body-l-sb textTitleColor">{{
        t(`${module}.step1.titleHeader`, {
          typeDoc:
            salesStore?.formDocInvoice?.typeDocument?.tag ||
            getNameCode(salesStore?.formDocInvoice?.typeDocument?.code)[
              globalStore.lang
            ],
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
      :model-value="salesStore.formDocInvoice.invoicing"
      @update:model-value="selectCard"
    />
    <!-- <div class="body">
            <div class="card disabled" :class="{ active: salesStore.formDocInvoice.Incometype === INCOMES_TYPE[0] }" @click="selectCard(INCOMES_TYPE[0])">
                <img src="/img/createSalesDoc/menCreateDoc.svg" alt="men create doc">
                <span class="body-m-sb">{{ t(`${module}.step1.cards.createDocument.title`) }}</span>
                <p class="body-s-r">{{ t(`${module}.step1.cards.createDocument.description`) }}</p>
            </div>

            <div class="card" :class="{ active: salesStore.formDocInvoice.Incometype === INCOMES_TYPE[1] }" @click="selectCard(INCOMES_TYPE[1]) ">
                <img src="/img/createSalesDoc/womenRegisterDoc.svg" alt="">
                <span class="body-m-sb">{{ t(`${module}.step1.cards.registerDocument.title`) }}</span>
                <p class="body-s-r">{{ t(`${module}.step1.cards.registerDocument.description`) }}</p>
            </div>

        </div> -->

    <div class="footer">
      <u-button
        @click="closeStep"
        :text="t(`${module}.buttons.cancel`)"
        type="outlined"
      />
      <u-button
        :disabled="salesStore.formDocInvoice.invoicing === null"
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
  width: 80vw;
  max-width: 556px;
  height: 80vh;
  max-height: 752px;
  box-sizing: border-box;
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
