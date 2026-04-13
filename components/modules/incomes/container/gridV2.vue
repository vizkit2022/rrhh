<script setup>
import { ref, onActivated, onMounted, computed, onUnmounted } from "vue";
import { useRoute } from "vue-router";
import useGrillaStore from "@/stores/grilla";
import useUserStore from "@/stores/user";
import useGlobalStore from "@/stores/global";
import useIncomeStore from "@/stores/incomes";
import useLinesStore from "@/stores/lines";
import useOrganizationStore from "@/stores/organization";
import useOutcomesStore from "@/stores/outcomes";
import usePermissionsStore from "@/stores/permissions";
import { debounce } from "@/utils/helpers";

// Store
const grillaStore = useGrillaStore();
const userStore = useUserStore();
const organizationStore = useOrganizationStore();
const outcomesStore = useOutcomesStore();
const linesStore = useLinesStore();
const incomesStore = useIncomeStore();
const globalStore = useGlobalStore();
const permissionsStore = usePermissionsStore();

// Constants
const { t } = useI18n();
const uiLabel = "ui.income.sections.lines";
const { params } = useRoute();
const idIncome = params?.income ?? null;
const color = "--neutral-text-caption";
const shareMovement = ref(false);
const textBtnMenu = {
  text: { es: "Comprar", en: "Purchase" },
  tooltip: { es: "Hacer una Compra", en: "Make a purchase" },
};
const typeToConvert = computed(() =>
  t(
    "modules.incomes.pages.grilla.modal.changeType." +
      `${incomesStore.income.state === "budget" ? "business" : "budget"}`,
  ),
);
const typeCurrent = computed(() =>
  t(
    "modules.incomes.pages.grilla.modal.changeType." +
      incomesStore.income.state,
  ),
);
const optionsBtnMenu = ref([]);
const loadingSearch = ref(false);
const resultLines = ref([]);
const total = ref(0);
const showModalDuplicateMovement = ref(false);
const showModalSaveTemplate = ref(false);
const convertMovement = ref(false);
const previewPDF = ref(false);
const lockModal = ref(false);
const optionsBtnMore = computed(() => {
  const textBase = "grilla.menus";
  const convertText = t(textBase + ".convert", { type: typeToConvert.value });
  const templateText = t(textBase + ".template", {
    type: grillaStore.template,
  });
  const stateText = t(
    textBase + `.state.${incomesStore.hollywood ? "active" : "inactive"}`,
  );
  const hollywoodText = t(textBase + ".hollywood", { state: stateText });
  const exportText = t(textBase + ".export");
  const saveTemplateText = t(textBase + ".saveTemplate");
  const duplicateText = t(textBase + ".duplicate") + " " + typeCurrent.value;
  const closeText = t(textBase + ".close") + " " + typeCurrent.value;
  const openText = t(textBase + ".open") + " " + typeCurrent.value;
  const closeLinesText = t(textBase + ".closeLines");
  const openLinesText = t(textBase + ".openLines");
  const disabledSaveTemplate =
    linesStore?.lines?.length === 0 ||
    linesStore?.lines?.filter((line) => line._id !== "").length === 0;
  const PermisoParaCerrar = true; // Falta
  const disabledCloseMovement =
    linesStore?.lines?.length === 0 && PermisoParaCerrar;
  const EstaAbierto = true; // Falta
  const disabledExport =
    userStore.userSession.email === "paula@comaaudiovisual.com";

  let options = [
    { prop: "convert", icon: "fast-zap", label: { default: convertText } },
    {
      prop: "template",
      icon: "book",
      label: { default: templateText },
      disabled: true,
    },
    {
      prop: "hollywood",
      icon: "folder",
      label: { default: hollywoodText },
      disabled: total.value > 500,
    },
    {
      prop: "export",
      icon: "folder-inside",
      label: { default: exportText },
      disabled: !permissionsStore.myPermissions.imcome__grid_export_sumary,
    },
    {
      prop: "saveTemplate",
      icon: "folder-add",
      label: { default: saveTemplateText },
      disabled: disabledSaveTemplate,
    },
    {
      prop: "duplicate",
      icon: "duplicate",
      label: { default: duplicateText },
      disabled: disabledSaveTemplate,
    },
    {
      prop: "closeLines",
      icon: "locked",
      label: { default: closeLinesText },
      disabled: disabledCloseMovement,
    },
    {
      prop: "openLines",
      icon: "unlocked",
      label: { default: openLinesText },
      disabled: disabledCloseMovement,
    },
  ];

  options.push(
    EstaAbierto
      ? {
          prop: "closeMovement",
          icon: "check",
          label: { default: closeText },
          disabled: true,
        }
      : {
          prop: "openMovement",
          icon: "edit",
          label: { default: openText },
          disabled: true,
        },
  );

  return options;
});
const colorBtnMore = {
  default: "--neutral-text-caption",
};

// Variables
const fullScreen = ref(false);
const skipNextActivation = ref(false);
const toSearch = ref("");
const parent = ref(null);

// Computed
const widthSectionLines = computed(() => {
  if (fullScreen.value) {
    return "calc(100vw - 48px)";
  }

  return globalStore.sliderExpand
    ? "calc(100vw - 280px)"
    : "calc(100vw - 120px)";
});
const msgAlertsGrilla = computed(() => {
  const label = "grilla.loadings";
  if (grillaStore.loadings.lines) return t(label + ".lines");
  if (grillaStore.loadings.parents) return t(label + ".parents");
  if (grillaStore.loadings.metrics) return t(label + ".metrics");
  if (grillaStore.loadings.docs) return t(label + ".docs");
  if (grillaStore.loadings.variables) return t(label + ".variables");
  if (grillaStore.loadings.surcharges) return t(label + ".surcharges");
  if (grillaStore.loadings.delete) return t(label + ".delete");
  if (grillaStore.selectedCellsState !== null)
    return t(label + ".selectedCellsState");
});
const showMsgGrilla = computed(() => {
  return (
    grillaStore.loading ||
    grillaStore.updating ||
    grillaStore.isAnyLoading ||
    grillaStore.selectedCellsState !== null
  );
});
const disabled = computed(
  () =>
    showMsgGrilla.value ||
    grillaStore.selectedCellsState ||
    grillaStore.updating,
);
const purchasePemission = computed(() => {
  if (incomesStore.income.state === "budget")
    return permissionsStore?.myPermissions
      ?.income__grid_line_create_purchase_budget;
  return permissionsStore?.myPermissions
    ?.income__grid_line_create_purchase_business;
});

// Functions
const showModalSettings = () => {
  grillaStore.showModal = true;
  grillaStore.showModalType = "settings";
  grillaStore.showModalPosition = "center";
};
const loadData = async (init = false) => {
  grillaStore.applySearch = false;
  toSearch.value = "";
  grillaStore[init ? "loading" : "updating"] = true;
  try {
    // Metricas actualizadas
    incomesStore.loadings.metrics = true;
    runWithLoading("metrics", () => linesStore.updateDataGrid());

    grillaStore.selectedIds.clear();

    // Loading es para la primera carga, updating solo actualizar la grilla
    grillaStore.loadings.lines = true;
    total.value = await incomesStore.getTotalLinesByProject(idIncome);

    // Previamente si hollywood esta activo, por defecto esta desactivado
    if (incomesStore.hollywood) {
      await linesStore.getAllLinesIncomes({
        parent: `${parent.value}`,
        hollywood: true,
      });
    }
    // Según el total, cargar las líneas
    else if (total.value > 500) {
      incomesStore.hollywood = true;
      await linesStore.getAllLinesIncomes({
        parent: `${parent.value}`,
        hollywood: true,
      });
    } else {
      incomesStore.hollywood = false;
      await linesStore.getAllLinesIncomes({ hollywood: false });
    }
    grillaStore.loadings.lines = false;
    grillaStore[init ? "loading" : "updating"] = false;

    // Estas corren en segundo plano
    runWithLoading("docs", () => organizationStore.getDocs());
    runWithLoading("variables", () =>
      incomesStore.getVariablesByIncome(idIncome),
    );
    runWithLoading("surcharges", () => linesStore.getLinesSurcharges());
  } catch (error) {
    console.error("Error en carga inicial:", error);
  }
};
const runWithLoading = async (key, fn) => {
  try {
    grillaStore.loadings[key] = true;
    await fn();
    if (key === "docs") mapperDocs();
  } catch (err) {
    console.error(`Error en ${key}:`, err);
  } finally {
    grillaStore.loadings[key] = false;
  }
};
function handleEsc(event) {
  if (event.key === "Escape") {
    // Si el Modo Edición Multiple esta activo, debo cancelarlo
    if (grillaStore.selectedCellsState !== null) {
      // Restaurar valor anterior
      grillaStore.selectedCells.forEach((cell) => {
        linesStore.lines[cell.pos] = cell.line;
      });

      if (grillaStore.selectedCellsState) {
        grillaStore.clearSelectedCells();
      }
    }
  }
}
const mapperDocs = () => {
  optionsBtnMenu.value = [];
  organizationStore.docs.forEach((doc) => {
    const newDoc = {
      label: { es: doc.name, en: doc.name },
      icon: "",
      fullData: doc,
    };
    optionsBtnMenu.value.push(newDoc);
  });
};

// Comprar
const typePO = ref({});
const configPO = ref({
  lines: [],
  income: idIncome,
  mov: {},
  skipStep2: false,
});
const canceledModalPurchase = ref(false);
const purchaseJustMade = ref("");
const createOC = (op) => {
  const doc = op.fullData;
  const currency = incomesStore?.income?.currency?.default?._id;
  typePO.value = doc;
  configPO.value.lines = linesStore.lines
    .filter((line) => grillaStore.selectedIds.has(line.__id) && !line.isParent)
    .map((line) => ({
      ...line,
      income: { ...line.income, currency },
      currency,
    }));
  configPO.value.skipStep2 = configPO.value.lines.length !== 0;
  configPO.value.mov = {
    currency,
    name: incomesStore.income.name,
    project: incomesStore.projectName,
    projectId: incomesStore.currentProject._id,
    expand: false,
    _id: idIncome,
    totalLines: incomesStore.income.amountLines,
  };
  grillaStore.showModal = true;
  grillaStore.showModalType = "createOC";
  grillaStore.showModalPosition = "center";
};
const modalCanceled = (id) => {
  purchaseJustMade.value = id;
  canceledModalPurchase.value = true;
};
const canceledPurchase = async () => {
  // Anular compra recien comprada
  try {
    globalStore.loading = true;
    let body = { outcomes: [purchaseJustMade.value] };
    const { success, data, error } = await outcomesStore.archiveOutcome(body);
    if (success) {
      grillaStore.closeModal();
      canceledModalPurchase.value = false;
      purchaseJustMade.value = "";
      loadData(false);
    }
  } catch (error) {
    console.error(error);
  } finally {
    globalStore.loading = false;
  }
};
const cancelLabel = "modules.outcomes.pages.outcome.tabs.tab1.modals.cancel";
const tileDeleteModal = computed(() => t(cancelLabel + ".title_new"));
const descriptionDeleteModal = computed(() => t(cancelLabel + ".description"));
const confirmationDeleteModal = computed(() =>
  t(cancelLabel + ".confirmationText"),
);
const btnDeleteModal = computed(() => t(cancelLabel + ".customTextBtnDelete"));

// Solo cuando se monta la primera vez el componente muestro el loading
onMounted(async () => {
  grillaStore.applySearch = false;
  permissionsModalInfo();
  await loadData(true);
  document.addEventListener("keydown", handleEsc);
});
onUnmounted(() => {
  grillaStore.breadcrumb = [];
  incomesStore.income = {};
  document.removeEventListener("keydown", handleEsc);
});

// Cada vez que muestro el componente recargo su info y no el html
onActivated(async () => {
  toSearch.value = "";
  grillaStore.applySearch = false;

  if (skipNextActivation.value) {
    if (grillaStore.breadcrumb.length) {
      parent.value = grillaStore.breadcrumb.at(-1).id;
    } else {
      parent.value = null;
    }
    await loadData(false);
  } else {
    skipNextActivation.value = true;
    parent.value = null;
    return;
  }
});
const mapperLine = (lines) => {
  let results = [];
  lines.forEach((l) => {
    const text = l.parentsName ? l.parentsName.join(" / ") : "";
    const body = {
      label: l.name,
      text: `/ ${text}`,
      search: true,
      oldData: l,
    };
    if (l?.parents?.length === l?.parentsName?.length) {
      results.push(body);
    }
  });
  return results;
};
const cleanInput = () => {
  toSearch.value = "";
};
const selectMoreOp = async (op) => {
  const actions = {
    convert: () => (convertMovement.value = true),
    template: "",
    hollywood: async () => {
      grillaStore.applySearch = false;
      grillaStore.breadcrumb = [];
      toSearch.value = "";
      resultLines.value = [];
      incomesStore.hollywood = !incomesStore.hollywood;
      parent.value = null;
      grillaStore.breadcrumb = [];
      await loadData(false);
    },
    export: async () => await exportResumen(),
    saveTemplate: () =>
      (showModalSaveTemplate.value = !showModalSaveTemplate.value),
    duplicate: () =>
      (showModalDuplicateMovement.value = !showModalDuplicateMovement.value),
    openMovement: () => {
      grillaStore.configCloseOpen.type = "openMovement"; // closePurchase, openPurchase, closeMovement, openMovement
      grillaStore.configCloseOpen.all = false;
      grillaStore.configCloseOpen.state = incomesStore.income.state;
      grillaStore.configCloseOpen.show = !grillaStore.configCloseOpen.show;
    },
    closeMovement: () => {
      grillaStore.configCloseOpen.type = "closeMovement";
      grillaStore.configCloseOpen.all = false;
      grillaStore.configCloseOpen.state = incomesStore.income.state;
      grillaStore.configCloseOpen.show = !grillaStore.configCloseOpen.show;
    },
    openLines: () => {
      grillaStore.configCloseOpen.type = "openPurchase";
      grillaStore.configCloseOpen.all = true;
      grillaStore.configCloseOpen.state = incomesStore.income.state;
      grillaStore.configCloseOpen.show = !grillaStore.configCloseOpen.show;
    },
    closeLines: () => {
      grillaStore.configCloseOpen.type = "closePurchase";
      grillaStore.configCloseOpen.all = true;
      grillaStore.configCloseOpen.state = incomesStore.income.state;
      grillaStore.configCloseOpen.show = !grillaStore.configCloseOpen.show;
    },
  };
  const { prop } = op;
  if (actions[prop]) await actions[prop]();
};
const exportResumen = async () => {
  globalStore.loading = true;
  await incomesStore.exportResumen(idIncome);
  globalStore.loading = false;
};
const permissionsModalInfo = () => {
  let options = [];
  if (permissionsStore.myPermissions.income__grid_line_modify_name)
    options.push({
      label: "grilla.dialogs.infoLine.details",
      value: "details",
      disabled: false,
      selected: false,
    });
  if (permissionsStore.myPermissions.income_grid_col_incomes)
    options.push({
      label: "grilla.dialogs.infoLine.incomes",
      value: "incomes",
      disabled: false,
      selected: false,
    });
  if (permissionsStore.myPermissions.income_grid_col_budget)
    options.push({
      label: "grilla.dialogs.infoLine.budget",
      value: "budget",
      disabled: false,
      selected: false,
    });
  if (permissionsStore.myPermissions.income_grid_col_cost)
    options.push({
      label: "grilla.dialogs.infoLine.purchase",
      value: "purchase",
      disabled: false,
      selected: false,
    });

  let tab = "incomes";
  const existsIncomes = options.findIndex((op) => op.value === "incomes");
  if (existsIncomes === -1) tab = options?.[0]?.value;

  grillaStore.configModalInfoLine.options = options.map((op, o) => ({
    order: o + 1,
    ...op,
  }));
  grillaStore.configModalInfoLine.defaultTab = tab;
};

const hideModal = () => {
  if (!lockModal.value) {
    convertMovement.value = false;
    showModalDuplicateMovement.value = false;
    shareMovement.value = false;
    showModalSaveTemplate.value = false;
    grillaStore.configCloseOpen = {};
    lockModal.value = false;
    previewPDF.value = false;
  }
};
const lock = (state) => {
  lockModal.value = state;
};
const openPreview = () => {
  previewPDF.value = true;
};

// Buscar Lineas
const searchLines = debounce(async (e) => {
  const toSearch = e.target.value.trim();
  if (incomesStore.hollywood) {
    grillaStore.applySearch = false;
    if (toSearch !== "") {
      showDropdown.value = true;
      resultLines.value = [];
      loadingSearch.value = true;

      const resp = await linesStore.searchLine(idIncome, toSearch);
      resultLines.value = mapperLine(resp);
      loadingSearch.value = false;
    }
  } else {
    if (toSearch === "") {
      grillaStore.applySearch = false;
      // Si borra el texto, restaurar todo visible
      linesStore.lines = linesStore.lines.map((line) => ({
        ...line,
        isVisible: true,
      }));
      grillaStore.refreshHTML++;
      return;
    }

    const search = toSearch.toLowerCase();
    grillaStore.applySearch = true;
    grillaStore.unselectAll();

    // 1. Encontrar las líneas que hacen match por name
    const matchingLines = linesStore.lines.filter((line) =>
      line.name.toLowerCase().includes(search),
    );

    // 2. Recolectar todos los IDs que deben ser visibles
    //    (las líneas que matchean + todos sus ancestros)
    const visibleIds = new Set();

    matchingLines.forEach((line) => {
      visibleIds.add(line.__id);
      // Sus padres también deben ser visibles
      line.parents.forEach((parentId) => visibleIds.add(parentId));
    });

    // 3. Aplicar visibilidad
    linesStore.lines = linesStore.lines.map((line) => ({
      ...line,
      isVisible: visibleIds.has(line.__id),
    }));

    grillaStore.refreshHTML++;
  }
}, 10);

const handleKeyUpInput = (event) => {
  const key = event.key;

  const forbiddenBottom = isBottomDropdown.value && key === "ArrowDown";
  const forbiddenTop = !isBottomDropdown.value && key === "ArrowUp";
  let loading = false;

  const forbiddenY = loading && (forbiddenBottom || forbiddenTop);

  if (!forbiddenY) {
    if (
      showDropdown.value &&
      isBottomDropdown.value &&
      ["ArrowUp", "ArrowLeft", "ArrowRight"].includes(key)
    ) {
      showDropdown.value = false;
      goToDropdownLines.value = false;
    }

    if (
      showDropdown.value &&
      !isBottomDropdown.value &&
      ["ArrowDown", "ArrowLeft", "ArrowRight"].includes(key)
    ) {
      showDropdown.value = false;
      goToDropdownLines.value = false;
    }

    if (
      showDropdown.value &&
      ((isBottomDropdown.value && key === "ArrowDown") ||
        (!isBottomDropdown.value && key === "ArrowUp"))
    ) {
      goToDropdownLines.value = true;
    }
  }

  if (key === "Escape") {
    showDropdown.value = false;
    goToDropdownLines.value = false;
  }
};
// Dropdown
const showDropdown = ref(null);
const isBottomDropdown = ref(true);
const goToDropdownLines = ref(false);
const dropdownClose = async () => {
  toSearch.value = "";
  showDropdown.value = false;
  goToDropdownLines.value = false;
};
const dropdownSelect = async (newValue) => {
  showDropdown.value = false;
  goToDropdownLines.value = false;
  await grillaStore.goToParentFromSearch(newValue);
  cleanInput();
};
</script>

<template>
  <div
    class="grilla"
    :class="{ grilla__fullscreen: fullScreen }"
    id="mainContainer"
  >
    <div class="grilla__header" id="grillaHeader">
      <div v-if="showMsgGrilla" class="grilla__header--msgUpdating">
        <u-loading :width="16" v-if="grillaStore.selectedCellsState === null" />
        <span>{{ msgAlertsGrilla }}</span>
      </div>
      <div v-else class="grilla__header--search">
        <u-input
          autocomplete="off"
          :placeholder="t(uiLabel + '.search')"
          v-model="toSearch"
          :disabled="grillaStore.updating"
          size="s"
          @input="searchLines($event)"
          @keydown="incomesStore.hollywood ? handleKeyUpInput($event) : null"
          icon="search"
          :revers="true"
        />
        <TableGrillaCustomCloud />
      </div>
      <div></div>
      <u-button-menu
        size="s"
        icon="shopping-cart"
        :text="textBtnMenu"
        :options="optionsBtnMenu"
        @selectedOption="createOC"
        :disabled="
          optionsBtnMenu.length === 0 || !purchasePemission || disabled
        "
      />
      <u-button-icon
        v-if="!incomesStore.hollywood"
        icon="change"
        size="s"
        type="outlined"
        :color="color"
        @click="loadData(false)"
        :title="t(uiLabel + '.refresh')"
        :disabled="disabled"
      />
      <u-button-icon
        icon="settings"
        size="s"
        type="outlined"
        :color="color"
        @click="showModalSettings"
        :title="t(uiLabel + '.settings')"
        :disabled="disabled"
      />
      <u-button-icon
        icon="share"
        size="s"
        type="outlined"
        :color="color"
        :title="t(uiLabel + '.share')"
        :disabled="disabled"
        @click="shareMovement = true"
      />
      <u-button-icon
        :icon="fullScreen ? 'minimize-1' : 'maximize-1'"
        size="s"
        type="outlined"
        :color="color"
        :title="t(uiLabel + (fullScreen ? '.minimize' : '.maximize'))"
        @click="fullScreen = !fullScreen"
        :disabled="disabled"
      />
      <u-button-menu
        :color="color"
        :maxVisibleOptions="10"
        :onlyIcon="true"
        type="outlined"
        :colors="colorBtnMore"
        orientation="right"
        :title="t(uiLabel + '.more')"
        :disabled="disabled"
        size="s"
        icon="more"
        :options="optionsBtnMore"
        @selectedOption="selectMoreOp"
        :showArrow="false"
      />
    </div>
    <TableGrilla :fullScreen="fullScreen" />
    <!-- Buscador de Lineas global -->
    <u-dropdown
      v-if="showDropdown"
      idParent="grillaHeader"
      idContainer="mainContainer"
      maxheihtContent="224px"
      :customOptionStyle="true"
      :loading="loadingSearch"
      :list="resultLines"
      widthParent="420px"
      :goToDropdown="goToDropdownLines"
      @isBottomDropdown="(isBottom) => (isBottomDropdown = !isBottom)"
      @dropdownSelect="dropdownSelect"
      @dropdownClose="dropdownClose"
    >
      <template v-slot:cell="item">
        <div class="searchItem">
          <span class="text truncateText">{{ item.item.label }}</span>
          <div class="searchItem__location">
            <span class="u u-folder"></span>
            <span class="truncateText">{{ item.item.text || "/.." }}</span>
          </div>
        </div>
      </template>
    </u-dropdown>
    <!-- Buscador de Lineas por item -->
    <u-dropdown
      v-if="![null, undefined].includes(grillaStore.posDropdown)"
      :idParent="`#input-${grillaStore.posDropdown}-name`"
      idContainer="mainContainer"
      maxheihtContent="128px"
      :customOptionStyle="true"
      :loading="linesStore.loadingSearch"
      :list="linesStore.searchLineNames"
      :goToDropdown="grillaStore.goToDropdown"
      @isBottomDropdown="
        (isBottom) => (grillaStore.isBottomDropdown = !isBottom)
      "
      @dropdownSelect="grillaStore.dropdownSelect"
      @dropdownClose="grillaStore.dropdownClose"
    >
      <template v-slot:cell="item">
        <span class="optionText" v-text="item.item.name"></span>
      </template>
    </u-dropdown>
    <IncomesCardsV2Dropdown
      v-if="Object.values(grillaStore.configDropdownCell).length"
    />
  </div>
  <div class="grilla__metricas">
    <IncomesContainerChipsTotal />
  </div>
  <u-dialog
    :showModal="grillaStore.showModal"
    @closeModal="grillaStore.closeModal"
    width="auto"
    height="auto"
    :position="grillaStore.showModalPosition"
    class="modalGrilla"
  >
    <IncomesDialogSettingsGrilla
      v-if="grillaStore.showModalType === 'settings'"
      @closeModal="grillaStore.closeModal"
    />
    <TableGrillaDialogDeleteLines
      v-else-if="grillaStore.showModalType === 'delete'"
    />
    <!-- <IncomesDialogInfoLineGridV2
      v-else-if="grillaStore.showModalType === 'infoLine'"
    /> -->
    <IncomesDialogInfoLine
      v-else-if="grillaStore.showModalType === 'infoLine'"
    />
    <DialogPOCreator
      v-else-if="grillaStore.showModalType === 'createOC'"
      @closeModal="grillaStore.closeModal"
      :typePO="typePO"
      :config="configPO"
      @updateTableGrid="loadData(false)"
      @modalCanceled="modalCanceled"
    />
    <IncomesDialogChooseTemplateV2
      v-else-if="grillaStore.showModalType === 'chooseTemplate'"
      @closeModal="grillaStore.closeModal"
      @updateTable="loadData(false)"
    />
  </u-dialog>
  <dialog-cancel
    width="600px"
    height="auto"
    :title="tileDeleteModal"
    :description="descriptionDeleteModal"
    :confirmationText="confirmationDeleteModal"
    :customTextBtnDelete="btnDeleteModal"
    :showInput="true"
    :actionModal="canceledPurchase"
    :showModal="canceledModalPurchase"
    @closeModal="canceledModalPurchase = false"
  />
  <u-dialog
    :showModal="convertMovement"
    :lockModal="lockModal"
    @closeModal="hideModal"
    width="auto"
    height="auto"
  >
    <IncomesDialogConvertTypeMovement
      @closeModal="hideModal"
      @lockModal="lock"
    />
  </u-dialog>
  <u-dialog
    :showModal="showModalSaveTemplate"
    @closeModal="hideModal"
    width="auto"
    height="auto"
    :persistent="true"
  >
    <IncomesDialogSaveTemplate @closeModal="hideModal" />
  </u-dialog>
  <u-dialog
    :show-modal="showModalDuplicateMovement"
    @close-modal="hideModal"
    width="auto"
    height="auto"
    padding="24px 48px"
    :persistent="true"
  >
    <IncomesDialogDuplicateMovement @close-modal="hideModal" />
  </u-dialog>
  <u-dialog
    :show-modal="grillaStore.configCloseOpen.show"
    @close-modal="hideModal"
    width="auto"
    height="auto"
  >
    <IncomesDialogLineToggle @close-modal="hideModal" @load="loadData(false)" />
  </u-dialog>
  <u-dialog
    :showModal="shareMovement"
    :lockModal="lockModal"
    @closeModal="hideModal"
    width="auto"
    height="auto"
  >
    <IncomesDialogShareMovement
      @closeModal="hideModal"
      @lockModal="lock"
      @previewPDF="openPreview"
    />
  </u-dialog>
  <u-dialog
    :showModal="previewPDF"
    :lockModal="lockModal"
    @closeModal="hideModal"
    width="500px"
    height="500px"
  >
    <IncomesDialogPreviewPDF @closeModal="hideModal" @lockModal="lock" />
  </u-dialog>
  <u-dialog
    :showModal="organizationStore.printPdf.showModal"
    @closeModal="organizationStore.printPdf.showModal = false"
    width="auto"
    height="auto"
  >
    <dialog-pdf @closeModal="organizationStore.printPdf.showModal = false" />
  </u-dialog>
</template>

<style scoped>
.grilla {
  width: v-bind("widthSectionLines");
  display: grid;
  grid-template-rows: v-bind(
    "incomesStore.hollywood ? '32px 18px 1fr' : '32px 1fr'"
  );
  gap: 16px;
  transition: width 0.3s;
  position: relative;
}
.grilla__fullscreen {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background-color: var(--neutral-background-default);
  padding: 24px;
  z-index: 1000;
}
.grilla__header {
  display: grid;
  grid-template-columns: v-bind(
      "showMsgGrilla ? '1fr' : '300px'"
    ) 1fr auto auto auto auto auto auto;
  align-items: center;
  gap: 8px;
}
.grilla__header--search {
  display: grid;
  grid-template-columns: 1fr auto;
  align-items: center;
  gap: 12px;
}
.grilla__header--msgUpdating {
  color: var(--neutral-text-caption);
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 12px;
}
.searchItem {
  display: flex;
  flex-direction: column;
  justify-content: center;
  height: 32px;
}
.searchItem span {
  display: block;
}
.searchItem span.text {
  color: var(--neutral-text-body);
  font-weight: 600;
  font-size: 14px;
  line-height: 14px;
}
.searchItem .searchItem__location {
  display: grid;
  grid-template-columns: auto 1fr;
  column-gap: 4px;
  align-items: center;
}
.searchItem .searchItem__location span {
  color: var(--neutral-text-caption);
  font-weight: 400;
  font-size: 10px;
  line-height: 10px;
}
.searchItem .searchItem__location span:not(.u) {
  padding-top: 1px;
}
.modalGrilla::v-deep(.dialog__container) {
  padding: v-bind(
    "grillaStore.showModalType === 'infoLine' ? '24px' : '40px'"
  ) !important;
}
</style>
