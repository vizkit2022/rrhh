<script setup>
import useGrillaStore from "@/stores/grilla";
import { defineEmits, computed } from "vue";
import {
  IncomesDialogSettingsGrillaContentColumns,
  IncomesDialogSettingsGrillaContentSections,
  IncomesDialogSettingsGrillaContentVisualization
} from "#components";

// Stores
const grillaStore = useGrillaStore();

// Emits
const emit = defineEmits(["closeModal"]);

// Components
const views = {
    0: IncomesDialogSettingsGrillaContentColumns,
    1: IncomesDialogSettingsGrillaContentSections,
    2: IncomesDialogSettingsGrillaContentVisualization
};

// Constants
const { t } = useI18n();
const uiLabel = "grilla.dialogs.settings";
const color = "--neutral-text-caption";

// Variables
const tabSelected = ref(0);
const tabs = computed(() => ([
  {
    label: t(uiLabel + '.tabs.columns'),
    tab: 0,
    indicator: false,
    disabled: false,
    main: false,
  },
  {
    label: t(uiLabel + '.tabs.sections'),
    tab: 1,
    indicator: false,
    disabled: false,
    main: false,
  },
  {
    label: t(uiLabel + '.tabs.visualization'),
    tab: 2,
    indicator: false,
    disabled: false,
    main: false,
  },
]));

// Computed
const contentView = computed(() => views[tabSelected.value]);

// Inicializar temp
grillaStore.configTemp = JSON.parse(JSON.stringify(grillaStore.config));

// Functions
const applySettings = () => {
  grillaStore.config = JSON.parse(JSON.stringify(grillaStore.configTemp));
  grillaStore.saveGridSettingsLocalStorage(grillaStore.config);
  grillaStore.paintTable();
  grillaStore.refreshHTML++;
  grillaStore.refresh = false;
  grillaStore.configTemp = {};
  emit("closeModal");
};

</script>

<template>
  <div class="settingsGrilla">
    <div class="settingsGrilla__header">
      <span class="title">{{ t(uiLabel + '.title') }}</span>
      <u-button-icon icon="close" type="outlined" size="s" :color="color" @click="emit('closeModal')" />
    </div>
    <u-tabs class="settingsGrilla__tabs" :tabs="tabs" v-model="tabSelected" textAlign="center" />
    <div class="settingsGrilla__content">
      <component v-if="contentView" :is="contentView" />
    </div>
    <div class="settings__actions">
      <span class="msg">{{ t(uiLabel + '.text') }}</span>
      <u-button :text="t(uiLabel + '.save')" size="s" @click="applySettings" />
    </div>
  </div>
</template>

<style scoped>
.settingsGrilla {
  width: 720px;
  height: 654px;
  display: grid;
  grid-template-rows: 32px 32px 1fr 32px;
  row-gap: 24px;
}
.settingsGrilla__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.settingsGrilla span.title {
  font-weight: 600;
  font-size: 16px;
  line-height: 20px;
  letter-spacing: 0%;
  vertical-align: middle;
  color: var(--neutral-text-body);
}
.settingsGrilla__header button {
  border-radius: 50%;
}
.settingsGrilla__content {
  height: 486px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  row-gap: 16px;
  padding-right: 2px;
}
.settingsGrilla__content::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}
.settingsGrilla__content::-webkit-scrollbar-thumb {
  background-color: var(--neutral-border-default);
  border-radius: 5px;
}
.settingsGrilla__content::-webkit-scrollbar-track {
  background-color: var(--neutral-border-subtle);
}
.settings__actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.settings__actions span.msg {
  font-size: 12px;
  line-height: 12px;
  color: var(--danger-text-default);
}
.settings__actions button {
  min-width: 180px;
}

</style>
