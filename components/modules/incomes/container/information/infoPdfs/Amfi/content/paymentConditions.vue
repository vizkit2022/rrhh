<script setup>
import useIncomesStore from "@/stores/incomes";
import { useI18n } from "vue-i18n";

// EMITS
const emit = defineEmits(["save"]);

// STORE
const incomesStore = useIncomesStore();

// TRANSLATIONS
const { t } = useI18n();
const module = "ui.income.sections.information.sections.paymentTerms";

const loading = ref(false);
const paymentCondition = ref("");

const save = () => {
  incomesStore.informationForm.amfi.paymentConditions = {
    htmlText: paymentCondition.value,
  };

  emit("save");
};

onMounted(() => {
  paymentCondition.value =
    incomesStore.informationForm.amfi.paymentConditions.htmlText;
});
</script>

<template>
  <div class="container">
    <div class="header">
      <span>{{ t(module + ".title") }}</span>
      <p>{{ t(module + ".description") }}</p>
    </div>

    <div class="body">
      <u-textarea-html
        v-model="paymentCondition"
        :disabled="loading"
        :isExpand="true"
        heightCustom="300px"
        :placeholder="t(module + '.textHtml.placeholder')"
        @change="save()"
      />
    </div>
  </div>
</template>

<style scoped>
.container {
  display: grid;
  grid-template-rows: 66px 1fr;
  width: 100%;
  height: 100%;
  gap: 24px;
}

.header {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.header span:first-child {
  font-size: 24px;
  font-weight: 600;
  line-height: 36px;
  color: var(--neutral-text-body);
}

.header p {
  color: var(--neutral-text-caption);
  font-size: 14px;
  font-weight: 400;
  line-height: 18px;
}

.body {
  height: 100%;
  overflow: hidden;
}
</style>
