<script setup>
import { ref, onMounted, computed, defineEmits } from "vue";
import { areStringsEqual } from "@/utils/helpers";
import useGlobalStore from "@/stores/global";
import useTemplatesStore from "@/stores/templates";
import useIncomeStore from "@/stores/incomes";
// STORES
const globalStore = useGlobalStore();
const templateStore = useTemplatesStore();
const incomesStore = useIncomeStore();
// Emits
const emit = defineEmits(["closeModal"]);

// CONSTANTS
const color = "--neutral-text-caption";

const { t } = useI18n();
const module = "modules.incomes.pages.grilla.modal.template.create";
const button = "modules.incomes.pages.grilla.modal.template.create.buttons";
const template = ref({ name: "", shouldShowZeroAmountLines: false });
const customsTemplates = ref([]);
const error = ref(false);

// MOUNTED
onMounted(async () => {
  globalStore.loading = true;
  setTimeout(() => {
    customsTemplates.value = [
      { name: "Plantilla ABC", _id: "1232434", icon: "file" },
      { name: "Plantilla DEF", _id: "1232435", icon: "file" },
      { name: "Plantilla GHI", _id: "1232436", icon: "file" },
      { name: "Plantilla IJK", _id: "1232437", icon: "file" },
      { name: "Plantilla MNO", _id: "1232438", icon: "file" },
    ];
    globalStore.loading = false;
  }, 2000);
});

// COMPUTED
const isInvalidTemplate = computed(() => {
  if (template.value.name.trim() === "") {
    error.value = false;
    return true;
  }
  const errorStr = customsTemplates.value.some((t) =>
    areStringsEqual(t.name, template.value.name)
  );
  error.value = errorStr;
  return errorStr;
});

// FUNCTION
const save = async () => {
  try {
    if (!isInvalidTemplate.value) {
      globalStore.loading = true;
      console.log("buenas", template.value);
      console.log("el income", incomesStore.income._id);
      const body = {
        name: template.value.name,
        options: {
          replaceZeroAmount: template.value.shouldShowZeroAmountLines,
          templateGlobal: template.value.templateGlobal
        },
        incomeId: incomesStore.income._id,
        templateGlobal: template.value.templateGlobal || false,
      };
      const response = await templateStore.saveTemplate(body);
      if (response) {
        globalStore.loading = false;
        emit("closeModal");
      } else {
        globalStore.loading = false;
        error.value = true;
      }
    }
  } catch (e) {
    globalStore.loading = false;
  }
};
const shortText = () => {
  return (template.value.name = template.value.name.slice(0, 50));
};
</script>

<template>
  <div class="saveTemplate">
    <div class="saveTemplate__header">
      <span v-text="t(module + '.title')" class="title"></span>
      <u-button-icon
        icon="close"
        class="btnIconModify"
        :color="color"
        size="s"
        type="outlined"
        @action-btn="emit('closeModal')"
      />
    </div>
    <div class="saveTemplate__content">
      <img
        :src="`/img/saveTemplate${globalStore.isDark ? 'Dark' : ''}.svg`"
        alt="logo"
      />
      <span v-text="t(module + '.subTitle')" class="title"></span>
      <u-input
        v-model="template.name"
        :placeholder="t(module + '.inputs.placeholder')"
        style="width: 100%"
        :hint="true"
        :error="error"
        autoFocus
        @input="template.name = shortText()"
      />
      <span v-if="error" class="error" v-text="t(module + '.msgError')"></span>
      <div class="saveTemplate__info">
        <u-checkbox v-model="template.shouldShowZeroAmountLines" />
        <span v-text="t(module + '.info')" class="title"></span>
        
      </div>
    </div>
    <div class="saveTemplate__footer">
      <u-button
        :text="t(button + '.cancel')"
        class="mainBtnModify"
        type="outlined"
        :color="color"
        @action-btn="emit('closeModal')"
      />
      <u-button
        :text="t(button + '.save')"
        class="mainBtnModify"
        :disabled="isInvalidTemplate"
        @click="save"
      />
    </div>
  </div>
</template>

<style scoped>
.saveTemplate {
  width: 400px;
  height: 400px;
  display: grid;
  grid-template-rows: 40px 1fr 40px;
  gap: 24px;
}
.saveTemplate__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 32px;
}
.saveTemplate__header span.title {
  font-size: 16px;
  font-weight: 600;
  line-height: 20px;
  text-align: left;
  color: var(--neutral-text-body);
}
.saveTemplate__content {
  display: flex;
  flex-direction: column;
  gap: 24px;
  justify-content: center;
  align-items: center;
  padding: 0 20px;
}
.saveTemplate__content span.title {
  font-weight: 600;
  font-size: 14px;
  line-height: 18px;
  letter-spacing: 0%;
  color: var(--neutral-text-body);
}
.saveTemplate__content span.error {
  color: var(--danger-text-default);
  width: 100%;
  text-align: end;
  font-size: 12px;
  margin-top: -16px;
}
.saveTemplate__content .saveTemplate__info {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 10px;
  align-items: center;
}
.saveTemplate__content .saveTemplate__info span:nth-child(2) {
  font-weight: 400;
  font-size: 12px;
  line-height: 16px;
  letter-spacing: 0%;
  color: var(--neutral-text-body);
}
.saveTemplate__footer {
  display: flex;
  justify-content: space-between;
}

/* CUSTOM COMPONENTS - MODIFY */
.btnIconModify {
  border-radius: 50%;
}
.mainBtnModify {
  width: calc(50% - 10px);
}
</style>
