<script setup>
import { defineProps, computed } from "vue";
import useIncomesStore from "@/stores/incomes";
import useGlobalStore from "@/stores/global";

//Store
const incomesStore = useIncomesStore();
const globalStore = useGlobalStore();

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

// Constants
const colors = {
  color: "--neutral-text-caption",
  colorHover: "--secondary-text-default",
  colorActive: "--secondary-text-default",
};

// Computed
const editing = computed(() => incomesStore.configGlobals.edit);
const textButtonEditProperties = computed(() => ({
  ...colors,
  size: "xs",
  type: "text",
  icon: "edit",
  disabled:
    editing.value || props.disabled || props.deleteVariableLoading.length !== 0,
}));
const textButtonDeleteProperties = computed(() => ({
  ...colors,
  size: "xs",
  type: "text",
  icon: "delete",
  disabled:
    editing.value || props.disabled || props.deleteVariableLoading.length !== 0,
}));

// Functions
const getType = (type) => {
  const types = {
    constant: { es: "Constante", en: "Constant" },
    variable: { es: "Variable", en: "Variable" },
    text: { es: "Texto", en: "Text" },
  };
  return (
    types?.[type]?.[globalStore.lang] || types.constant[[globalStore.lang]]
  );
};
const selectCurrent = async (index) => {
  const IdIncome = incomesStore.income?._id;
  if (!IdIncome) return;

  incomesStore.configGlobals.loadings.updating = true;

  try {
    const resp = await incomesStore.getGlobalsList(IdIncome);

    const selectedId = incomesStore.configGlobals.groups[index]?._id;

    const groups = resp
      .map((g, i) => ({
        ...g,
        order: i,
        current: g._id === selectedId,
        globalVariables: g.globalVariables.map((gv) => ({
          ...gv,
          typeName: getType(gv.type),
          unitName: gv?.unit?.name || "Sin Unidad",
        })),
      }))
      .sort((a, b) => {
        if (a.current) return -1;
        if (b.current) return 1;
        return a.order - b.order;
      });

    incomesStore.configGlobals.groups = groups;
    incomesStore.configGlobals.group = groups[0];
  } finally {
    incomesStore.configGlobals.loadings.updating = false;
  }
};
const editGroupModal = (group) => {
  incomesStore.configGlobals.modal.group = group;
  incomesStore.configGlobals.modal.show = true;
};
const deleteGroupModal = (group) => {
  incomesStore.configGlobals.modal.group = group;
  incomesStore.configGlobals.modal.delete = true;
};
</script>

<template>
  <div class="subHeader">
    <span v-if="incomesStore.configGlobals.groups.length === 0" class="noData">
      Sin grupos registrados
    </span>
    <template
      v-for="(group, indexGroup) in incomesStore.configGlobals.groups"
      :key="indexGroup"
    >
      <div v-if="group.current" class="subHeader__option subHeader__optionDiv">
        <span class="name truncateText">{{ group?.name }}</span>
        <u-button-icon
          v-bind="textButtonEditProperties"
          @click="editGroupModal(group)"
        />
        <u-button-icon v-bind="textButtonDeleteProperties" @click="deleteGroupModal(group)" />
      </div>
      <button
        v-else
        class="subHeader__option subHeader__optionBtn"
        @click="selectCurrent(indexGroup)"
        :disabled="
          editing || props.disabled || props.deleteVariableLoading.length !== 0
        "
      >
        <span class="name truncateText">{{ group?.name }}</span>
      </button>
    </template>
  </div>
</template>

<style scoped>
.subHeader {
  padding: 6px 8px;
  background-color: var(--secondary-surface-shadow-8a);
  min-height: 44px;
  border-radius: 10px;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  column-gap: 12px;
  row-gap: 8px;
}
.subHeader__option {
  background-color: var(--secondary-surface-shadow-12a);
  height: 32px;
  width: auto;
  border-radius: 6px;
  padding: 0 8px;
}
.subHeader__optionBtn {
  display: flex;
  justify-content: center;
  align-items: center;
  max-width: 180px;
}
.subHeader__optionBtn:not(:disabled):hover .name {
  color: var(--secondary-text-default);
}
.subHeader__optionBtn:disabled {
  cursor: not-allowed;
}
.subHeader__optionDiv {
  display: grid;
  grid-template-columns: 1fr auto auto;
  align-items: center;
  column-gap: 6px;
  min-width: 180px;
  max-width: 200px;
}
.subHeader__option::v-deep(.btn .u) {
  font-size: 18px !important;
}
.subHeader__option::v-deep(.btn) {
  width: 18px;
}
.subHeader__option .name {
  font-weight: 600;
  font-size: 14px;
  line-height: 14px;
  transition: 0.3s;
}
.subHeader__option .name {
  color: v-bind(
    "editing || props.disabled || props.deleteVariableLoading.length !== 0 ? 'var(--neutral-text-disabled)' : 'var(--neutral-text-body)'"
  );
}
.noData {
  font-size: 14px;
  line-height: 14px;
  color: var(--neutral-text-caption);
  text-align: center;
  width: 100%;
}
</style>
