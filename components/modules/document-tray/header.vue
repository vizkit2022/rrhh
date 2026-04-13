<script setup>
import useDocumentTrayStore from "@/stores/documentTray";
import useGlobalStore from "@/stores/global";
import { useI18n } from "vue-i18n";

// Translations I18n
const { t } = useI18n();
const module = "modules.documentsTray";

// EMITS
const emits = defineEmits(["reloadDocTray"]);

// STORE
const documentTrayStore = useDocumentTrayStore();
const globalStore = useGlobalStore();

// CONSTANTS

//--FILTROS COMENTADO
const allFilters = {
  filters: [
    {
      prop: "statusDocumentTray",
      type: "list",
      options: [
        { value: "missingInformation", active: false },
        { value: "forRevieweb", active: false },
        { value: "pending", active: false },
        { value: "discarded", active: false },
        { value: "coincidences", active: false },
        { value: "associate", active: false },
        { value: "voided", active: false },
      ],
      expand: false,
    },
  ],
};

// COMPUTED

const isSelectedDocument = computed(() => {
  const selected = documentTrayStore.documentsTray.docs.filter(
    (doc) => doc.selected,
  );
  return selected.length > 0;
});

const docs = computed(() => {
  return documentTrayStore?.documentsTray?.docs ?? [];
});

const indicators = computed(() => {
  const list = docs.value;

  return [
    {
      label: t(`${module}.tabs.tab1`),
      mount: list.length,
      icon: "invoice",
      color: "secondary",
      showMoney: false,
      action: true,
      default: documentTrayStore.selectedIndicator === 0,
    },
    {
      label: t(`${module}.tabs.tab2`),
      mount: list.filter((doc) => doc.status === "coincidences").length,
      icon: "search",
      color: "info",
      action: true,
      showMoney: false,
      default: documentTrayStore.selectedIndicator === 1,
    },
    {
      label: t(`${module}.tabs.tab3`),
      mount: list.filter((doc) => doc.status === "pending").length,
      icon: "hourglass",
      color: "warning",
      action: true,
      showMoney: false,
      default: documentTrayStore.selectedIndicator === 2,
    },
    {
      label: t(`${module}.tabs.tab4`),
      mount: list.filter((doc) => doc.status === "missingInformation").length,
      icon: "alert",
      color: "danger",
      action: true,
      showMoney: false,
      default: documentTrayStore.selectedIndicator === 3,
    },
    {
      label: t(`${module}.tabs.tab5`),
      mount: list.filter((doc) => doc.status === "discarded").length,
      icon: "close",
      color: "neutral",
      action: true,
      showMoney: false,
      default: documentTrayStore.selectedIndicator === 4,
    },
  ];
});

//FUNCION
const selectedInd = (pos) => {
  documentTrayStore.selectedIndicator = pos;
};

const search = debounce(() => {
  emits("reloadDocTray");
}, 600);

const filterDataByDate = (c_date) => {
  // currentDateMounted.value = c_date;
  globalStore.setDate(c_date);
  emits("reloadDocTray");
};

// CYCLES
onMounted(async () => {
  globalStore.initFilters(allFilters);
});
</script>

<template>
  <div class="header">
    <u-indicators
      :indicators="indicators"
      :height="70"
      :iconSize="48"
      :widthGridIcon="50"
      @selected-ind="selectedInd"
    />

    <div class="container_actions">
      <div class="izq">
        <u-input
          icon="search"
          v-model="documentTrayStore.search"
          :placeholder="t(`${module}.inputs.search.placeholder`)"
          size="s"
          :revers="true"
          style="width: 320px"
          @input="search()"
        />
        <u-datepicker
          size="s"
          :date="globalStore.currentDate"
          @updated-date="filterDataByDate"
        />
        <u-button
          class="btnDesktop"
          :text="t(`${module}.buttons.filter`)"
          icon="filter"
          :revers="true"
          type="outlined"
          color="--neutral-surface-default"
          size="s"
          @click="globalStore.showFilters = true"
        />
      </div>
      <div class="der">
        <u-button-icon
          icon="delete"
          type="outlined"
          :title="t(`${module}.buttons.delete`)"
          color="--neutral-surface-default"
          colorHover="--danger-surface-default"
          colorActive="--danger-surface-darker"
          size="s"
          :disabled="!isSelectedDocument"
          @click="documentTrayStore.dialogs.showDeleteDocument = true"
        />
        <u-button-icon
          icon="close"
          type="outlined"
          :title="t(`${module}.buttons.dismiss`)"
          color="--neutral-surface-default"
          color-hover="--neutral-surface-subtle"
          color-active="--neutral-surface-default"
          size="s"
          :disabled="!isSelectedDocument"
          @click="documentTrayStore.dialogs.showDiscardedDocument = true"
        />

        <u-button
          :text="t(`${module}.buttons.uploadDoc`)"
          icon="upload"
          @click="documentTrayStore.dialogs.showUploadDocument = true"
        />
        <!-- <u-button-icon icon="more" type="outlined" color="--neutral-surface-default" color-hover="--neutral-surface-subtle" color-active="--neutral-surface-default" size="s" /> -->
      </div>
    </div>
  </div>
</template>

<style scoped>
.header {
  height: 100%;
  width: 100%;
  display: grid;
  grid-template-rows: 72px 34px;
  gap: 24px;
}

.container_actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.container_actions .izq {
  display: flex;
  align-items: center;
  gap: 12px;
}

.container_actions .der {
  display: flex;
  align-items: center;
  gap: 12px;
}

.btnDesktop {
  display: flex;
}
.btnMobile {
  display: none;
}

@media only screen and (max-width: 1330px) {
  .btnDesktop {
    display: none;
  }
  .btnMobile {
    display: flex;
  }
}
</style>
