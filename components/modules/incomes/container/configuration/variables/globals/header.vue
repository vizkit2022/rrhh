<script setup>
import { defineProps, computed, defineEmits } from "vue";
import useIncomeStore from "@/stores/incomes";
import { useI18n } from "vue-i18n";

// Translations
const { t } = useI18n();
const module = "ui.income.sections.globals";

// Stores
const incomesStore = useIncomeStore();

// Props
const props = defineProps({
  disabled: {
    type: Boolean,
    default: false,
  },
  deleteVariableLoading: {
    type: Array,
    default: () => [],
  },
});

// Emits
const emit = defineEmits(["updatingGlobals", "newGroup"]);

// Computed
const mainButtonProperties = computed(() => ({
  color: "--secondary-text-default",
  colorHover: "--secondary-text-subtle",
  colorActive: "--secondary-text-subtle",
  size: "s",
  icon: "new",
  text: t(`${module}.buttons.addGlobal`),
  disabled:
    props.disabled ||
    props.deleteVariableLoading.length !== 0 ||
    incomesStore.configGlobals.group === null,
}));
const secondButtonProperties = computed(() => ({
  color: "--secondary-text-default",
  colorHover: "--secondary-text-subtle",
  colorActive: "--secondary-text-subtle",
  size: "s",
  type: "outlined",
  icon: "new",
  text: t(`${module}.buttons.addGroup`),
  disabled: props.disabled || props.deleteVariableLoading.length !== 0,
}));
const updatingButtonProperties = computed(() => ({
  color: "--neutral-text-caption",
  size: "s",
  type: "outlined",
  icon: "change",
  disabled: props.disabled || props.deleteVariableLoading.length !== 0,
}));
const editButtonProperties = computed(() => ({
  color: "--primary-text-default",
  colorHover: "--primary-text-subtle",
  colorActive: "--primary-text-subtle",
  size: "s",
  icon: "edit",
  text: t(`${module}.buttons.editGlobal`),
  disabled:
    props.disabled ||
    props.deleteVariableLoading.length !== 0 ||
    incomesStore.configGlobals.group === null ||
    incomesStore.configGlobals.group.globalVariables.length === 0
}));
const saveButtonProperties = computed(() => {
  const withErrors =
    incomesStore.configGlobals.group?.globalVariables.some((g) => g.error) ??
    false;
  const baseProperties = {
    size: "s",
    icon: "save",
    color: "--primary-text-default",
    colorHover: "--primary-text-subtle",
    colorActive: "--primary-text-subtle",
    text: t(`${module}.buttons.saveChanges`),
    disabled:
      props.disabled ||
      props.deleteVariableLoading.length !== 0 ||
      incomesStore.configGlobals.group === null ||
      !incomesStore.configGlobals.change ||
      withErrors,
  };

  return baseProperties;
});
const cancelButtonProperties = computed(() => ({
  color: "--neutral-text-caption",
  size: "s",
  icon: "close",
  text: t(`${module}.buttons.undoChanges`),
  type: "outlined",
  disabled:
    props.disabled ||
    props.deleteVariableLoading.length !== 0 ||
    incomesStore.configGlobals.group === null,
}));

// Functions
const newGroupModal = () => {
  incomesStore.configGlobals.modal.group = null;
  incomesStore.configGlobals.modal.show = true;
};

const newVariable = async () => {
  incomesStore.configGlobals.modal.new = true;
};
const editVariables = () => {
  incomesStore.configGlobals.edit = true;
  const group = incomesStore.configGlobals.group;
  incomesStore.configGlobals.originalGroup = JSON.parse(JSON.stringify(group));
};
const cancelEditVariables = () => {
  incomesStore.configGlobals.edit = false;
  incomesStore.configGlobals.change = false;
  const originalGroup = incomesStore.configGlobals.originalGroup;
  incomesStore.configGlobals.group = JSON.parse(JSON.stringify(originalGroup));
};
const saveVariables = async () => {
  const { change } = incomesStore.configGlobals;
  if (change) {
    try {
      const variables = incomesStore.configGlobals.group.globalVariables.filter(
        (g) => g.change,
      );
      const body = { variables };
      incomesStore.configGlobals.loadings.updating = true;
      const resp = await incomesStore.multiEditGlobals(body);
      console.log(resp);
    } catch (error) {
      console.log(error);
    } finally {
      incomesStore.configGlobals.loadings.updating = false;
      emit("updatingGlobals");
      cancelEditVariables();
    }
  } else {
    cancelEditVariables();
  }
};
</script>

<template>
  <header class="header">
    <span class="header__title">{{ t(`${module}.title`) }}</span>
    <template v-if="!incomesStore.configGlobals.edit">
      <u-button-icon
        v-bind="updatingButtonProperties"
        @click="emit('updatingGlobals')"
      />
      <u-button v-bind="secondButtonProperties" @click="newGroupModal" />
      <u-button v-bind="mainButtonProperties" @click="newVariable" />
      <u-button v-bind="editButtonProperties" @click="editVariables" />
    </template>
    <template v-else>
      <u-button v-bind="cancelButtonProperties" @click="cancelEditVariables" />
      <u-button v-bind="saveButtonProperties" @click="saveVariables" />
    </template>
  </header>
</template>

<style scoped>
.header {
  padding-bottom: 8px;
  display: grid;
  grid-template-columns: v-bind(
    "incomesStore.configGlobals.edit ? '1fr auto auto' : '1fr auto auto auto auto'"
  );
  align-items: flex-end;
  gap: 12px;
}

.header__title {
  font-size: 24px;
  line-height: 24px;
  font-weight: 600;
  color: var(--neutral-text-body);
}
</style>
