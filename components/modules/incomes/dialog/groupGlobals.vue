<script setup>
import { ref, defineEmits, onMounted, computed } from "vue";
import useIncomesStore from "@/stores/incomes";
import useGlobalStore from "@/stores/global";
import { useI18n } from "vue-i18n";

// Translations
const { t } = useI18n();
const module = "ui.income.sections.globals";

// Router
const { params } = useRoute();

// Stores
const incomesStore = useIncomesStore();
const globalStore = useGlobalStore();

// Emits
const emit = defineEmits(["closeModal", "updatingGlobals"]);

// Constans
const colors = {
  color: "--neutral-text-caption",
};
const idIncome = incomesStore.income?._id;

// Variables
const name = ref("");
const printPdf = ref(false);
const loading = ref(false);

// Computed
const currentGlobal = computed(() => incomesStore?.configGlobals?.modal?.group);
const title = computed(() =>
  currentGlobal.value
    ? t(`${module}.modals.addEditGroup.titles.edit`)
    : t(`${module}.modals.addEditGroup.titles.add`),
);
const btnCloseProperties = computed(() => ({
  ...colors,
  icon: "close",
  size: "s",
  type: "outlined",
  disabled: loading.value,
}));
const btnCancelProperties = computed(() => ({
  ...colors,
  text: t(`${module}.buttons.cancel`),
  size: "s",
  type: "outlined",
  disabled: loading.value,
}));
const btnSaveProperties = computed(() => ({
  text: currentGlobal.value
    ? t(`${module}.buttons.editGroup`)
    : t(`${module}.buttons.createGroup`),
  size: "s",
  disabled: loading.value || !name.value.trim(),
}));

// Mounted
onMounted(() => {
  if (currentGlobal.value) {
    name.value = currentGlobal.value.name;
    printPdf.value = currentGlobal.value.printGroup;
  }
  window.addEventListener("keydown", handleEscapeKey);
});
onUnmounted(() => {
  window.removeEventListener("keydown", handleEscapeKey);
  incomesStore.configGlobals.modal = {
    group: null,
    show: false,
  };
});

// Functions
const handleEscapeKey = (event) => {
  if (event.key === "Escape" || event.key === "Esc") {
    if (!loading.value) emit("closeModal");
  }
};
const save = async () => {
  if (name.value.trim().length !== 0) {
    try {
      globalStore.loading = true;

      let body = {
        name: name.value,
        printGroup: printPdf.value,
      };

      if (currentGlobal.value) body._id = currentGlobal.value._id;
      else body.income = idIncome;

      const resp =
        await incomesStore[
          currentGlobal.value ? "updateGroupGlobals" : "createGroupGlobals"
        ](body);
      if (resp._id) {
        incomesStore.configGlobals.group = resp;
        emit("updatingGlobals");
      }
    } catch (error) {
      console.error(error);
    } finally {
      globalStore.loading = false;
      emit("closeModal");
    }
  }
};
</script>

<template>
  <div class="modalGroup">
    <div class="modalGroup__header">
      <span class="title">{{ title }}</span>
      <u-button-icon v-bind="btnCloseProperties" @click="emit('closeModal')" />
    </div>
    <div class="modalGroup__img">
      <img :src="`/img/saveTemplate.svg`" alt="Icon" />
    </div>
    <span class="modalGroup__label">
      {{ t(`${module}.modals.addEditGroup.inputs.label`) }}
    </span>
    <u-input
      v-model="name"
      :placeholder="t(`${module}.modals.addEditGroup.inputs.placeholder`)"
    />
    <div class="modalGroup__print">
      <u-switch :disabled="loading" v-model="printPdf" />
      <div class="modalGroup__print-text">
        <span>{{ t(`${module}.modals.addEditGroup.switchs.title`) }}</span>
        <i18n-t
          class="print-desc"
          tag="span"
          :keypath="`${module}.modals.addEditGroup.switchs.description`"
        >
          <template #names
            ><strong>{{
              t(`${module}.modals.addEditGroup.switchs.strongs.names`)
            }}</strong></template
          >
          <template #values
            ><strong>{{
              t(`${module}.modals.addEditGroup.switchs.strongs.values`)
            }}</strong></template
          >
        </i18n-t>
      </div>
    </div>
    <div class="modalGroup__footer">
      <u-button v-bind="btnCancelProperties" @click="emit('closeModal')" />
      <u-button v-bind="btnSaveProperties" @click="save" />
    </div>
  </div>
</template>

<style scoped>
.modalGroup {
  width: 520px;
  display: grid;
  grid-template-rows: 32px 100px auto 32px 110px 64px;
  row-gap: 16px;
}
.modalGroup__header,
.modalGroup__footer,
.modalGroup__img {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.modalGroup__img {
  justify-content: center;
}
.modalGroup__footer {
  align-items: flex-end;
}
.modalGroup__header span.title {
  font-weight: 600;
  font-size: 16px;
  line-height: 16px;
  letter-spacing: 0%;
  vertical-align: middle;
  color: var(--neutral-text-body);
}
.modalGroup__label {
  font-weight: 600;
  font-size: 14px;
  line-height: 14px;
  letter-spacing: 0%;
  color: var(--neutral-text-caption);
}
.modalGroup__print {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 24px;
  align-items: center;
  border: 1px solid var(--neutral-border-subtle);
  border-radius: 12px;
  padding: 10px 24px;
  margin-top: 20px;
}
.modalGroup__print-text {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.modalGroup__print-text span:nth-child(1) {
  font-weight: 600;
  font-size: 14px;
  line-height: 18px;
  letter-spacing: 0%;
  vertical-align: middle;
  color: var(--neutral-text-body);
}
.modalGroup__print-text span:nth-child(2) {
  font-weight: 400;
  font-size: 12px;
  line-height: 16px;
  letter-spacing: 0%;
  vertical-align: middle;
  color: var(--neutral-text-caption);
}
.modalGroup__header::v-deep(.btn) {
  border-radius: 50%;
}
.modalGroup__footer::v-deep(.btn) {
  min-width: 150px;
}
</style>
