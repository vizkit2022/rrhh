<script setup>
import useIncomesStore from "@/stores/incomes";
import { useI18n } from "vue-i18n";

// EMITS
const emit = defineEmits(["save"]);

// STORE
const incomesStore = useIncomesStore();

// TRANSLATIONS
const { t } = useI18n();
const module = "ui.income.sections.information.sections.cancellations";

const loading = ref(false);
const cancellations = ref("");

const save = () => {
  incomesStore.informationForm.amfi.cancellations = {
    htmlText: cancellations.value,
  };

  emit("save");
};

onMounted(() => {
  cancellations.value =
    incomesStore.informationForm?.amfi?.cancellations?.htmlText;
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
        v-model="cancellations"
        :disabled="loading"
        heightCustom="300px"
        :isExpand="true"
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
