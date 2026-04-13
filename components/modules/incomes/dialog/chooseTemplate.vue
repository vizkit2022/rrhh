<script setup>
import { ref, onMounted, computed, defineEmits } from "vue";
import useGlobalStore from "@/stores/global";
import useTemplatesStore from "@/stores/templates";
import useIncomeStore from "@/stores/incomes";
// STORES
const globalStore = useGlobalStore();
const templateStore = useTemplatesStore();
const incomesStore = useIncomeStore();
// Emits
const emit = defineEmits(["closeModal", "updateTable"]);

// CONSTANTS
const color = "--neutral-text-caption";
const hover = "--danger-text-default";

const { t } = useI18n();
const module = "modules.incomes.pages.grilla.modal.template.choose";
const button = "modules.incomes.pages.grilla.modal.template.choose.buttons";
const tabs = ref([
  {
    label: t(`${module}.tabs.tab1.title`),
    icon: "",
    tab: 0,
    indicator: false,
    disabled: false,
    main: false,
  },
  {
    label: t(`${module}.tabs.tab2.title`),
    icon: "",
    tab: 1,
    indicator: false,
    disabled: false,
    main: false,
  },
]);
const tabSelected = ref(0);
const defaultTemplates = ref([
  {
    name: t(`${module}.tabs.tab2.options[0].name`),
    _id: "1232444",
    icon: "github",
  },
  {
    name: t(`${module}.tabs.tab2.options[1].name`),
    _id: "1232455",
    icon: "facebook",
  },
  {
    name: t(`${module}.tabs.tab2.options[2].name`),
    _id: "1232466",
    icon: "linkedin",
  },
  {
    name: t(`${module}.tabs.tab2.options[3].name`),
    _id: "1232477",
    icon: "youtube",
  },
  {
    name: t(`${module}.tabs.tab2.options[4].name`),
    _id: "1232488",
    icon: "instagram",
  },
]);
const customsTemplates = ref([]);
const currentOp = ref({});

// MOUNTED
onMounted(async () => {
  globalStore.loading = true;
  console.log("wena2");
  await templateStore.getTemplates();
  await templateStore.getTemplates(true);
  templateStore.templates.map((template) => {
    template.icon = "file";
    template.confirm = false;
    return template;
  });
  templateStore.templatesGlobal.map((template) => {
    template.icon = "file";
    template.confirm = false;
    template.isGlobal = true;
    return template;
  });
  defaultTemplates.value = templateStore.templatesGlobal;
  customsTemplates.value = templateStore.templates;

  // setTimeout(() => {
  //   customsTemplates.value = [
  //     { name: "Plantilla ABC", _id: "1232434", icon: "file", confirm: false },
  //     { name: "Plantilla DEF", _id: "1232435", icon: "file", confirm: false },
  //     { name: "Plantilla GHI", _id: "1232436", icon: "file", confirm: false },
  //     { name: "Plantilla IJK", _id: "1232437", icon: "file", confirm: false },
  //     { name: "Plantilla MNO", _id: "1232438", icon: "file", confirm: false },
  //   ];
  // }, 2000);
  tabSelected.value = customsTemplates.value.length === 0 ? 1 : 0;

  globalStore.loading = false;
});

// COMPUTED
const listTemplates = computed(() =>
  tabSelected.value === 1 ? defaultTemplates.value : customsTemplates.value
);

// FUNCTIONS
const selectedOp = (item) => {
  console.log("wena");
  currentOp.value = item;
  console.log(item);
};
const setTemplate = async () => {
  console.log("setTemplate", currentOp, currentOp.value._id);
  globalStore.loading = true;
  try {
    const body = {
      templateId: currentOp.value._id,
      incomeId: incomesStore.income._id,
      projectId: incomesStore.income.project,
      name: "hola chao",
      global: currentOp.value.isGlobal,
    };
    await templateStore.setTemplate(body);
    emit("updateTable");
    emit("closeModal");
  } catch (err) {
    globalStore.loading = false;
  }
};
const stateButton = (item) => {
  if (item.confirm) return "confirm";
  if (currentOp.value._id === item._id) return "selected";
  return "";
};
const confirmDeleteItem = (i) => {
  console.log("delete item");
  customsTemplates.value.forEach((temp, t) => {
    if (t === i) temp.confirm = !temp.confirm;
    else temp.confirm = false;
  });
};
const deleteItem = async (pos) => {
  try {
    globalStore.loading = true;
    console.log("a borrar", customsTemplates.value[pos]);
    const templateId = customsTemplates.value[pos]._id;
    const resp = await templateStore.deleteTemplate(templateId);
    if (resp) {
      if (currentOp.value._id === customsTemplates.value[pos]._id) {
        currentOp.value = {};
      }
      customsTemplates.value.splice(pos, 1);
      globalStore.loading = false;
    }
  } catch (err) {
    globalStore.loading = false;
  }
};
</script>

<template>
  <div class="choose">
    <div class="choose__header">
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
    <div></div>
    <div class="choose__title">
      <span v-text="t(module + '.subTitle')" class="title"></span>
    </div>
    <u-tabs class="choose__tabs" :tabs="tabs" v-model="tabSelected" />
    <div class="choose__content">
      <div
        :class="`choose__item ${stateButton(item)}`"
        v-for="(item, i) in listTemplates"
        :key="item._id"
      >
        <div
          class="choose__item-normal"
          :style="`transform: translateX(${item.confirm ? '-100%' : '0'});`"
        >
          <button class="text" @click="selectedOp(item)">
            <span :class="`u u-${item.icon}`"></span>
            <span v-text="item.name" class="truncateText"></span>
          </button>
          <u-button-icon
            v-if="tabSelected === 0"
            icon="delete"
            size="s"
            :color="color"
            :color-active="hover"
            :color-hover="hover"
            type="outlined"
            @click="confirmDeleteItem(i)"
          />
        </div>
        <div
          class="choose__item-delete"
          :style="`transform: translateX(${item.confirm ? '-100%' : '0'});`"
        >
          <span class="text" v-text="t(module + '.confirm')"></span>
          <u-button-icon icon="check" @click="deleteItem(i)" />
          <u-button-icon icon="close" @click="item.confirm = false" />
        </div>
      </div>
      <div class="choose__noData" v-if="listTemplates.length === 0">
        <span v-text="t(module + '.noData')"></span>
      </div>
    </div>
    <div class="choose__info">
      <template v-if="false">
        <span class="u u-info-outlined"></span>
        <span v-text="t(module + '.text')" class="title"></span>
      </template>
    </div>
    <div></div>
    <div class="choose__footer">
      <u-button
        :text="t(button + '.cancel')"
        class="mainBtnModify"
        type="outlined"
        :color="color"
        @action-btn="emit('closeModal')"
      />
      <u-button
        :text="t(button + '.use')"
        class="mainBtnModify"
        @action-btn="setTemplate()"
        :disabled="!currentOp?._id"
      />
    </div>
  </div>
</template>

<style scoped>
.choose {
  width: 520px;
  height: 540px;
  display: grid;
  grid-template-rows: 40px 0px auto 32px 1fr auto 0px 40px;
  gap: 24px;
}
.choose__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 32px;
}
.choose__header span.title {
  font-size: 16px;
  font-weight: 600;
  line-height: 20px;
  text-align: left;
  color: var(--neutral-text-body);
}
.choose__title {
  display: flex;
  justify-content: center;
  align-items: center;
}
.choose__title span.title {
  font-weight: 600;
  font-size: 14px;
  line-height: 18px;
  letter-spacing: 0%;
  color: var(--neutral-text-body);
}
.choose__info {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 10px;
}
.choose__info span:nth-child(2) {
  font-weight: 400;
  font-size: 12px;
  line-height: 16px;
  letter-spacing: 0%;
  color: var(--neutral-text-body);
}
.choose__content {
  height: auto;
  max-height: 218px;
  overflow-y: auto;
  padding: 0 10px;
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.choose__content::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

.choose__content::-webkit-scrollbar-thumb {
  border-radius: 5px;
  background: var(--neutral-surface-subtle);
}

.choose__content::-webkit-scrollbar-track {
  background: var(--neutral-surface-light);
  border-radius: 4px;
}
.choose__item {
  flex-shrink: 0;
  height: 40px;
  border-radius: 8px;
  transition: 0.3s ease;
  overflow: hidden;
  display: flex;
}
.choose__item-normal {
  transition: 0.3s cubic-bezier(0.785, 0.135, 0.15, 0.86);
  padding: 0 20px;
  flex-shrink: 0;
  display: grid;
  grid-template-columns: 1fr auto;
  align-items: center;
  gap: 24px;
  width: 100%;
  height: 40px;
  box-sizing: border-box;
}
.choose__item-delete {
  transition: 0.3s cubic-bezier(0.785, 0.135, 0.15, 0.86);
  flex-shrink: 0;
  height: 40px;
  width: 100%;
  display: grid;
  grid-template-columns: 1fr auto auto;
  gap: 10px;
  align-items: center;
  box-sizing: border-box;
  background-color: var(--danger-surface-shadow-12a);
  padding: 0 20px;
}
.choose__item-delete span.text {
  font-weight: 400;
  font-size: 14px;
  line-height: 16px;
  letter-spacing: 0%;
  color: var(--neutral-text-body);
}
.choose__item.selected,
.choose__item:not(.confirm):hover {
  background-color: var(--primary-surface-shadow-12a);
}
.choose__item.selected button.text span {
  color: var(--primary-text-default);
}
.choose__item button.text {
  display: flex;
  gap: 16px;
  align-items: center;
  height: 40px;
}
.choose__item button.text span {
  color: var(--neutral-text-caption);
}
.choose__item button.text span:nth-child(1) {
  font-size: 20px;
  line-height: 20px;
}
.choose__item button.text span:nth-child(2) {
  font-weight: 600;
  font-size: 14px;
  line-height: 18px;
  letter-spacing: 0%;
  max-width: 360px;
}
.choose__item button.btn {
  height: 28px;
  width: 28px;
  background-color: var(--neutral-background-default);
}
.choose__item ::v-deep(button.btn span.u) {
  font-size: 18px !important;
}
.choose__item-delete ::v-deep(button.btn) {
  border-radius: 8px;
}
.choose__item-delete ::v-deep(button.btn span.u) {
  color: var(--neutral-text-body);
}
.choose__noData {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 40px;
}
.choose__noData span {
  font-weight: 400;
  font-size: 14px;
  line-height: 18px;
  letter-spacing: 0%;
  color: var(--neutral-text-caption);
}
.choose__footer {
  display: flex;
  justify-content: space-between;
}

/* CUSTOM COMPONENTS - MODIFY */
.btnIconModify {
  border-radius: 50%;
}
.mainBtnModify {
  width: 165px;
}
</style>
