<script setup>
import { defineEmits, ref, computed } from "vue";
import useIncomesStore from "@/stores/incomes";
import useGlobalStore from "@/stores/global";
import { useI18n } from "vue-i18n";

// Stores
const incomesStore = useIncomesStore();
const globaltore = useGlobalStore();

// Constants
const emit = defineEmits(["closeModal", "lockModal"]);
const loading = ref(false);
const type = incomesStore.currentIncome.state;
const selected = ref(false);
const color = "--neutral-text-caption";
const img = `/img/${type === "budget" ? "invoice" : "business"}_${globaltore.isDark ? "dark" : "light"}.gif`;
const { t } = useI18n();
const module = "modules.incomes.pages.grilla.modal.changeType";
const typeToConvert = t(
  module + "." + `${type === "budget" ? "business" : "budget"}`
); // A lo que quiero cambiar
const btnSave = computed(() => {
  return loading.value ? ".process" : ".btnSave";
});
const title = computed(() => {
  return type === "budget" ? ".title1" : ".title2";
});
const info = computed(() => {
  return type === "budget" ? ".info1" : ".info2";
});

// Functions
const save = async () => {
  document.querySelectorAll(".modalType span").forEach((span) => {
    span.style.color = "var(--neutral-text-disabled) !important";
  });
  emit("lockModal", true);
  loading.value = true;
  const newType = type === "budget" ? "business" : "budget";
  incomesStore.currentIncome.state = newType;
  await incomesStore.updateMovement(incomesStore.currentIncome);
  globaltore.tag = newType;
  incomesStore.income.state = newType;
  emit("lockModal", false);
  emit("closeModal");
  loading.value = false;
};
</script>

<template>
  <div class="modalType">
    <div class="modalType__content">
      <img :src="img" alt="" />
      <span class="title">{{ t(module + title) }}</span>
      <div class="info">
        <span class="u u-danger-outlined"></span>
        <span>{{ t(module + info) }}</span>
      </div>
      <div class="snippet">
        <u-checkbox :height="20" v-model="selected" :disabled="loading" />
        <span>{{ t(module + ".text") }}</span>
      </div>
    </div>
    <div class="modalType__actions">
      <u-button
        type="outlined"
        size="s"
        :color="color"
        :text="t(module + '.btnCancel')"
        :disabled="loading"
        @click="emit('closeModal')"
      />
      <u-button
        type="outlined"
        size="s"
        :text="t(module + btnSave, { text: typeToConvert })"
        :disabled="loading"
        @click="save"
      />
    </div>
  </div>
</template>

<style scoped>
.modalType {
  height: 320px;
  width: 400px;
  display: grid;
  grid-template-rows: 1fr auto;
  gap: 24px;
}
.modalType__content {
  display: flex;
  flex-direction: column;
  gap: 24px;
  justify-content: center;
  align-items: center;
}
.modalType__actions {
  display: flex;
  justify-content: space-between;
  gap: 12px;
}
.title {
  font-weight: 600;
  font-size: 14px;
  line-height: 18px;
  letter-spacing: 0%;
  text-align: center;
  vertical-align: middle;
  color: var(--neutral-text-body);
}
.info,
.snippet {
  display: grid;
  grid-template-columns: 24px auto;
  gap: 10px;
  width: 100%;
  padding: 0 20px;
}
.info {
  font-weight: 600;
  font-size: 12px;
  line-height: 16px;
  letter-spacing: 0%;
  vertical-align: middle;
  color: var(--neutral-text-caption);
}
.info .u {
  color: var(--danger-text-default);
  font-size: 24px;
}
.snippet {
  border-top: 1px solid var(--neutral-border-subtle);
  height: 36px;
  align-items: center;
  font-weight: 400;
  font-size: 14px;
  line-height: 18px;
  letter-spacing: 0%;
  vertical-align: bottom;
  color: var(--neutral-text-body);
}
</style>
