<script setup>
import { defineEmits, defineProps } from "vue";
import { useI18n } from "vue-i18n";
import useOrganizationStore from "@/stores/organization";

// Translations I18n
const { t } = useI18n();
const module = "modules.sales.createSale";

//STORE
const organizationStore = useOrganizationStore();

// Props
const props = defineProps({
  modelValue: {
    type: String,
    default: null,
  },
});

// Emit para v-model
const emit = defineEmits(["update:modelValue"]);

// Constantes
const INCOMES_TYPE = ["createDoc", "registerDoc"];

// Función que emite el valor seleccionado
const selectCard = (type) => {
  if (type === INCOMES_TYPE[0]) {
    emit("update:modelValue", true);
  } else {
    emit("update:modelValue", false);
  }
};
</script>

<template>
  <div class="body">
    <div
      class="card"
      :class="{
        active: props.modelValue === true,
        disabled: organizationStore.organization.country.code !== 'CL',
      }"
      @click="selectCard(INCOMES_TYPE[0])"
    >
      <img src="/img/createSalesDoc/menCreateDoc.svg" alt="men create doc" />
      <span class="body-m-sb">
        {{ t(`${module}.step1.cards.createDocument.title`) }}
      </span>
      <p class="body-s-r">
        {{ t(`${module}.step1.cards.createDocument.description`) }}
      </p>
    </div>

    <div
      class="card"
      :class="{ active: props.modelValue === false }"
      @click="selectCard(INCOMES_TYPE[1])"
    >
      <img src="/img/createSalesDoc/womenRegisterDoc.svg" alt="" />
      <span class="body-m-sb">
        {{ t(`${module}.step1.cards.registerDocument.title`) }}
      </span>
      <p class="body-s-r">
        {{ t(`${module}.step1.cards.registerDocument.description`) }}
      </p>
    </div>
  </div>
</template>

<style scoped>
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
</style>
