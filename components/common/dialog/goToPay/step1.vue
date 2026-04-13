<script setup>
import { defineEmits, ref, defineProps } from "vue";

// Emits
const emit = defineEmits(["closeModal", "changeStep", "updatedType"]);

// Props
const props = defineProps({
  body: {
    type: Object,
    default: () => ({}),
  },
});

// Constants
const color = "--neutral-text-caption";
const { t } = useI18n();
const module = "modules.outcomes.pages.oc.modals.goToPay.step1";
const buttons = "modules.outcomes.pages.oc.modals.goToPay.buttons";
const types = ref([
  {
    icon: "u u-pay",
    text: t(module + ".buttons.document.text"),
    description: t(module + ".buttons.document.description"),
    prop: "document",
  },
  {
    icon: "u u-shopping-cart",
    text: t(module + ".buttons.purchase.text"),
    description: t(module + ".buttons.purchase.description"),
    prop: "purchase",
  },
]);
const typeSelected = ref(props?.body?.type ?? "");

// Functions
const nextStep = () => {
  if (typeSelected.value) {
    emit("changeStep", true);
    emit("updatedType", typeSelected.value);
  }
};
</script>

<template>
  <div class="step1">
    <div class="step1__header">
      <span v-text="t(module + '.title')"></span>
      <u-button-icon
        icon="close"
        class="btnIconModify"
        :color="color"
        @action-btn="emit('closeModal')"
        type="outlined"
        size="s"
      />
    </div>
    <div class="step1__body">
      <span v-text="t(module + '.text')" class="step1__body-title"></span>
      <div class="step1__body-buttons">
        <button
          v-for="type in types"
          :key="type.prop"
          @click="typeSelected = type.prop"
          :class="{ selected: type.prop === typeSelected }"
        >
          <span :class="type.icon"></span>
          <span v-text="type.text"></span>
          <span v-text="type.description"></span>
        </button>
      </div>
    </div>
    <div class="step1__footer">
      <u-button
        :text="t(buttons + '.cancel')"
        type="outlined"
        class="mainBtnModify"
        @action-btn="emit('closeModal')"
        size="s"
      />
      <u-button
        :text="t(buttons + '.next')"
        class="mainBtnModify"
        @click="nextStep"
        size="s"
        :disabled="!typeSelected"
      />
    </div>
  </div>
</template>

<style scoped>
.step1 {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* header */
.step1__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 40px;
  width: 100%;
}

.step1__header span {
  font-size: 16px;
  font-weight: 600;
  line-height: 20px;
  letter-spacing: 0em;
  text-align: left;
  color: var(--neutral-text-body);
}

/* body */
.step1__body {
  flex-grow: 1;
  display: grid;
  grid-template-rows: auto 1fr;
  gap: 24px;
}

.step1__body-title {
  font-weight: 600;
  font-size: 14px;
  line-height: 18px;
  letter-spacing: 0%;
  text-align: center;
  vertical-align: middle;
  color: var(--neutral-text-caption);
}

.step1__body-buttons {
  display: flex;
  justify-content: center;
  gap: 24px;
}

.step1__body-buttons button {
  width: 200px;
  height: 160px;
  border: 2px solid transparent;
  border-radius: 12px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  justify-content: center;
  align-items: center;
  box-shadow: var(--elevation-xs);
  transition: 0.3s;
}

.step1__body-buttons button span {
  color: var(--neutral-text-caption);
  transition: 0.3s;
}

.step1__body-buttons button span:nth-child(1) {
  font-size: 40px;
}

.step1__body-buttons button span:nth-child(2) {
  font-weight: 600;
  font-size: 18px;
  line-height: 24px;
  letter-spacing: 0%;
  vertical-align: middle;
}

.step1__body-buttons button span:nth-child(3) {
  font-weight: 400;
  font-size: 12px;
  line-height: 16px;
  letter-spacing: 0%;
  text-align: center;
}

.step1__body-buttons button.selected {
  border: 2px solid var(--primary-text-subtle);
}

.step1__body-buttons button.selected span:not(:nth-child(3)) {
  color: var(--primary-text-subtle);
}

.step1__body-buttons button:not(.selected):hover span:not(:nth-child(3)) {
  color: var(--primary-border-light);
}

.step1__body-buttons button:not(.selected):hover {
  border: 2px solid var(--primary-border-light);
}

/* footer */
.step1__footer {
  width: 100%;
  height: 40px;
  display: flex;
  justify-content: space-between;
  padding-top: 10px;
}

/* CUSTOM COMPONENTS - MODIFY */
.btnIconModify {
  border-radius: 50%;
  color: var(--bg-neutral-500);
}

.mainBtnModify {
  width: 135px;
}
</style>
