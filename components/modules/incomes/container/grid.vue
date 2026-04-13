<script setup>
import { headersGrid } from "@/utils/constants";
import {
  computed,
  onBeforeMount,
  defineExpose,
  onMounted,
  ref,
  watch,
  defineProps,
} from "vue";
import { useRoute } from "vue-router";

import useGlobalStore from "@/stores/global";
import useIncomeStore from "@/stores/incomes";
import useLinesStore from "@/stores/lines";
import useOrganizationStore from "@/stores/organization";
import useOutcomesStore from "@/stores/outcomes";
import usePermissionsStore from "@/stores/permissions";

import { toast } from "vue3-toastify";

// Store
const organizationStore = useOrganizationStore();
const outcomesStore = useOutcomesStore();
const linesStore = useLinesStore();
const incomesStore = useIncomeStore();
const globalStore = useGlobalStore();
const permissionsStore = usePermissionsStore();

const { params } = useRoute();
const idIncome = params?.income ?? null;

// Props
const props = defineProps({
  refresh: {
    type: Boolean,
    default: false,
  },
});

// EventBus
const { $bus } = useNuxtApp();

const fullScreen = ref(false);
const search = ref("");
const showSettingsTable = ref(false);
const showModalCreateOc = ref(false);
const showModalTemplate = ref(false);
const showModalSaveTemplate = ref(false);
const showModalDuplicateMovement = ref(false);
const headers = ref([]);

const permissions = ref([
  {
    type: "incomes",
    headers: [
      {
        id: 0,
        isWritable: permissionsStore?.myPermissions?.income_grid_col_incomes,
        isReadable:
          permissionsStore?.myPermissions?.income_grid_col_incomes_edit,
        type: 0,
      },
      {
        id: 1,
        isWritable: permissionsStore?.myPermissions?.income_grid_col_incomes,
        isReadable:
          permissionsStore?.myPermissions?.income_grid_col_incomes_edit,
        type: 0,
      },
      {
        id: 2,
        isWritable: permissionsStore?.myPermissions?.income_grid_col_incomes,
        isReadable:
          permissionsStore?.myPermissions?.income_grid_col_incomes_edit,
        type: 0,
      },
      {
        id: 3,
        isWritable: permissionsStore?.myPermissions?.income_grid_col_incomes,
        isReadable:
          permissionsStore?.myPermissions?.income_grid_col_incomes_edit,
        type: 0,
      },
      {
        id: 4,
        isWritable: permissionsStore?.myPermissions?.income_grid_col_incomes,
        isReadable:
          permissionsStore?.myPermissions?.income_grid_col_incomes_edit,
        type: 0,
      },
      {
        id: 5,
        isWritable: permissionsStore?.myPermissions?.income_grid_col_incomes,
        isReadable:
          permissionsStore?.myPermissions?.income_grid_col_incomes_edit,
        type: 0,
      },
      {
        id: 6,
        isWritable: permissionsStore?.myPermissions?.income_grid_col_incomes,
        isReadable:
          permissionsStore?.myPermissions?.income_grid_col_incomes_edit,
        type: 1,
      },
      {
        id: 7,
        isWritable: permissionsStore?.myPermissions?.income_grid_col_incomes,
        isReadable:
          permissionsStore?.myPermissions?.income_grid_col_incomes_edit,
        type: 1,
      },
      {
        id: 8,
        isWritable: permissionsStore?.myPermissions?.income_grid_col_incomes,
        isReadable:
          permissionsStore?.myPermissions?.income_grid_col_incomes_edit,
        type: 1,
      },
      {
        id: 9,
        isWritable: permissionsStore?.myPermissions?.income_grid_col_incomes,
        isReadable:
          permissionsStore?.myPermissions?.income_grid_col_incomes_edit,
        type: 1,
      },
      {
        id: 10,
        isWritable: permissionsStore?.myPermissions?.income_grid_col_incomes,
        isReadable:
          permissionsStore?.myPermissions?.income_grid_col_incomes_edit,
        type: 1,
      },
      {
        id: 11,
        isWritable: permissionsStore?.myPermissions?.income_grid_col_incomes,
        isReadable:
          permissionsStore?.myPermissions?.income_grid_col_incomes_edit,
        type: 1,
      },
      {
        id: 12,
        isWritable: permissionsStore?.myPermissions?.income_grid_col_incomes,
        isReadable:
          permissionsStore?.myPermissions?.income_grid_col_incomes_edit,
        type: 1,
      },
    ],
  },
  {
    type: "budgets",
    headers: [
      {
        id: 0,
        isWritable: permissionsStore?.myPermissions?.income_grid_col_budget,
        isReadable:
          permissionsStore?.myPermissions?.income_grid_col_budget_edit,
        type: 0,
      },
      {
        id: 1,
        isWritable: permissionsStore?.myPermissions?.income_grid_col_budget,
        isReadable:
          permissionsStore?.myPermissions?.income_grid_col_budget_edit,
        type: 0,
      },
      {
        id: 2,
        isWritable: permissionsStore?.myPermissions?.income_grid_col_budget,
        isReadable:
          permissionsStore?.myPermissions?.income_grid_col_budget_edit,
        type: 0,
      },
      {
        id: 3,
        isWritable: permissionsStore?.myPermissions?.income_grid_col_budget,
        isReadable:
          permissionsStore?.myPermissions?.income_grid_col_budget_edit,
        type: 0,
      },
      {
        id: 4,
        isWritable: permissionsStore?.myPermissions?.income_grid_col_budget,
        isReadable:
          permissionsStore?.myPermissions?.income_grid_col_budget_edit,
        type: 0,
      },
      {
        id: 5,
        isWritable: permissionsStore?.myPermissions?.income_grid_col_budget,
        isReadable:
          permissionsStore?.myPermissions?.income_grid_col_budget_edit,
        type: 0,
      },
      {
        id: 6,
        isWritable: permissionsStore?.myPermissions?.income_grid_col_budget,
        isReadable:
          permissionsStore?.myPermissions?.income_grid_col_budget_edit,
        type: 0,
      },
      {
        id: 7,
        isWritable: permissionsStore?.myPermissions?.income_grid_col_budget,
        isReadable:
          permissionsStore?.myPermissions?.income_grid_col_budget_edit,
        type: 0,
      },
    ],
  },
  {
    type: "outcomes",
    headers: [
      {
        id: 0,
        isWritable: permissionsStore?.myPermissions?.income_grid_col_cost,
        isReadable: false,
        type: 0,
      },
      {
        id: 1,
        isWritable: permissionsStore?.myPermissions?.income_grid_col_cost,
        isReadable: false,
        type: 0,
      },
      {
        id: 2,
        isWritable: permissionsStore?.myPermissions?.income_grid_col_cost,
        isReadable: false,
        type: 0,
      },
    ],
  },
  {
    type: "projected",
    headers: [
      {
        id: 0,
        isWritable: permissionsStore?.myPermissions?.income_grid_col_projected,
        isReadable: false,
        type: 0,
      },
      {
        id: 1,
        isWritable: permissionsStore?.myPermissions?.income_grid_col_projected,
        isReadable: false,
        type: 0,
      },
      {
        id: 2,
        isWritable: permissionsStore?.myPermissions?.income_grid_col_projected,
        isReadable: false,
        type: 0,
      },
      {
        id: 3,
        isWritable: permissionsStore?.myPermissions?.income_grid_col_projected,
        isReadable: false,
        type: 0,
      },
    ],
  },
]);
const sizeRow = ref(0);
const columnName = ref(0);
const columnCode = ref(true);
const createTable = ref(false);
const config = ref([]);
const menu = ref(false);
const menuPurchase = ref(false);

const loading = ref(true);

const showContextMenu = computed(() => linesStore.showContextMenuVar);
onBeforeMount(() => {
  // const gridTableSettings = JSON.parse(
  //   localStorage.getItem("gridTableSettings")
  // );
  // if (gridTableSettings !== null) {
  //   sizeRow.value = gridTableSettings.rowHeight;
  //   columnName.value = gridTableSettings.columnName || 0;
  //   columnCode.value = gridTableSettings.columnCode;
  // }
});

const dropdownOpen = ref(false);
const toggleDropdown = () => {
  dropdownOpen.value = !dropdownOpen.value;
};

let executedOnce = false;
onMounted(async () => {
  if (executedOnce) return;
  executedOnce = true;
  console.log("pasa");
  await mountedFunction();
});

const mountedFunction = async () => {
  // await incomesStore.getMovementBasicData(idIncome);
  organizationStore.getDocs();
  incomesStore.getVariablesByIncome(idIncome);
  // tienen que venir del back los permisos (actualizar el permissions)
  $bus.$on("updateDimensions", (newDimensions) => {
    dimensions.value = newDimensions;
  });

  // Temporal
  // const gridTableSettings = JSON.parse(
  //   localStorage.getItem("gridTableSettings")
  // );
  // if (gridTableSettings !== null) {
  //   sizeRow.value = gridTableSettings.rowHeight;
  //   columnName.value = gridTableSettings.columnNameWidth;
  //   columnCode.value = gridTableSettings.columnCode;
  //   config.value = gridTableSettings.config;
  //   headers.value = mapperHeaders(headersGrid, permissions.value, config.value);
  // } else {
  //   headers.value = mapperHeaders(headersGrid, permissions.value);
  // }
  headers.value = mapperHeaders(headersGrid, permissions.value);

  createTable.value = true;

  linesStore.breadcrumbs = [
    { icon: "folder", label: "Categorías", sub: false, id: "" },
  ];

  document.addEventListener("click", (event) => {
    if (
      event.target !== document.querySelector(".createGroupMenu") &&
      !event.target.closest(".btnIconGroup")
    ) {
      //linesStore.showGroupMenuVar = false; NO ACTIVAR,,, SOLTAR EL MOUSE SE CUENTA COMO CLICK
    }
    if (
      event.target !== document.querySelector(".searchLinesByName") &&
      !event.target.closest(".searchLinesByNameBtn")
    ) {
      linesStore.showSearchLineName = false;
      //linesStore.showLineMenuVar = false; NO ACTIVAR,,, SOLTAR EL MOUSE SE CUENTA COMO CLICK
    }
    if (
      event.target !== document.querySelector(".createLineMenu") &&
      !event.target.closest(".btnIconLine")
    ) {
      //linesStore.showLineMenuVar = false; NO ACTIVAR,,, SOLTAR EL MOUSE SE CUENTA COMO CLICK
    }
    linesStore.posContainerSearch = null;
    if (
      event.target !== document.querySelector(".btnMainMenu") &&
      event.target !== document.querySelector(".btnMainMenuIcon")
    ) {
      menu.value = false;
    }
    if (
      event.target !== document.querySelector(".btnMainMenuPurchase") &&
      event.target !== document.querySelector(".btnMainMenuIconPurchase")
    ) {
      menuPurchase.value = false;
    }
  });

  linesStore.income_id = idIncome;
  linesStore.page = 0;
  linesStore.nextPage = 1;
  linesStore.lines = [];
  linesStore.to_delete = [];
  linesStore.selectedLines.all = false;
  linesStore.selectedLines.list = [];
  linesStore.hollywood_parent = {};
  //await linesStore.getLinesWithPaginate();
  let total = 1200;
  total = await incomesStore.getTotalLinesByProject(idIncome);
  if (total > 1000) {
    await linesStore.getAllLinesIncomes({ parent: "null" });
    incomesStore.hollywood = true;
    originalLines.value = [];
  } else {
    await linesStore.getAllLinesIncomes();
    originalLines.value = JSON.parse(JSON.stringify(linesStore.lines));
    incomesStore.hollywood = false;
  }
  loading.value = false;
  globalStore.loading = false;
  linesStore.getLinesSurcharges();
  setTimeout(() => {
    incomesStore.getMovementBasicData(idIncome);
    incomesStore.informationForm.amfi = {
      ...incomesStore.informationForm.amfi,
      ...incomesStore.income.informationForm.amfi,
    };
  }, 6500);
};

const exportResumen = async () => {
  globalStore.loading = true;
  await incomesStore.exportResumen(idIncome);
  globalStore.loading = false;
};

function recreateTable() {
  createTable.value = false;
  setTimeout(() => {
    createTable.value = true;
  }, 10);
}

watch(() => sizeRow, recreateTable);
watch(() => columnName, recreateTable);

const mapperHeaders = (headers, permissions, localConfig = []) => {
  const modifiedHeaders = headers.map((header) => {
    const permission = permissions.find((perm) => perm.type === header.type);

    if (permission) {
      header.headers = header.headers.map((subHeader) => {
        const permissionHeader = permission.headers.find(
          (permHeader) => permHeader.id === subHeader.id
        );
        if (permissionHeader) {
          subHeader.isWritable = permissionHeader.isWritable;
          subHeader.isReadable = permissionHeader.isReadable;
        }
        return subHeader;
      });
    }
    if (localConfig.length) {
      const localConfigMatch = localConfig.find(
        (config) => config.type === header.type
      );
      if (localConfigMatch) {
        header.pos = localConfigMatch.pos;

        header.headers = header.headers.map((subHeader) => {
          const configHeader = localConfigMatch.headers.find(
            (configHeader) => configHeader.id === subHeader.id
          );
          if (configHeader) {
            subHeader.default = configHeader.default;
            subHeader.show = configHeader.show;
          }
          return subHeader;
        });
      }
    }

    return header;
  });

  return modifiedHeaders.sort((a, b) => a.pos - b.pos);
};

const updatedConfigTable = (size, config, code, name) => {
  sizeRow.value = size;
  config.value = config;
  columnCode.value = code;
  columnName.value = name;
  headers.value = mapperHeaders(headersGrid, permissions.value, config.value);
};

// CONTEXTUAL MENU

const currentItem = ref({});

const widthForLineNameResults = ref("516px");

const contextMenuPosition = ref({ x: "0px", y: "0px" });

const showSuperMenu = async (obj) => {
  const { e, data, pos, type } = obj;
  currentItem.value = data;

  const verticalPadding = ["menuGroup", "menuLine"].includes(type) ? 150 : 200;

  const horizontalPadding = 250;

  e.preventDefault();

  let xRelativeToContainer, yRelativeToContainer;

  if (type === "searchNameLine") {
    itemPositionToBeRenamed.value = pos;
    widthForLineNameResults.value = e.target.scrollWidth + "px";
    const { x, y } = data.inputPosition;
    xRelativeToContainer = x;
    yRelativeToContainer = y;
    await linesStore.searchForLineNames(data.name);
  } else {
    xRelativeToContainer = e.clientX;
    yRelativeToContainer = e.clientY;
  }

  linesStore.showContextMenuVar = type === "contextMenu";
  linesStore.showGroupMenuVar = type === "menuGroup";
  linesStore.showLineMenuVar = type === "menuLine";
  linesStore.showSearchLineName = type === "searchNameLine";

  if (linesStore.searchLineNames.length == 0) {
    linesStore.showSearchLineName = false;
  }

  const containerHeight = window.innerHeight;
  const containerWidth = window.innerWidth;

  const xPosition = `${Math.min(
    xRelativeToContainer,
    containerWidth - horizontalPadding
  )}px`;

  const yPosition = `${Math.min(
    yRelativeToContainer,
    containerHeight - verticalPadding
  )}px`;

  contextMenuPosition.value = {
    x: xPosition,
    y: yPosition,
  };
};

const changeLine = async (data) => {
  try {
    linesStore.showSearchLineName = true;
    const line = { ...data.line };
    const method = !line._id || line._id == "" ? "postLine" : "putLine";

    // linesStore[method](line).then((newLine) => {
    //   linesStore.lines[data.pos] = newLine;
    // });

    let newLine = await linesStore[method](line);
    linesStore.lines[data.pos] = newLine;
    //REAPER --> commented
    delete data._id;
    if (data.newLine) {
      data.top = false;
      linesStore.addNewLine(data);
    }
  } catch (err) {
    console.error(err);
  } finally {
    linesStore.searchLineNameStatus = false;
    linesStore.showSearchLineName = false;
    linesStore.optionSelected = false;
    linesStore.enterEvent = false;
  }
};

// Buscar linea por nombre
const itemPositionToBeRenamed = ref(null);
const selectedNameForLine = (name) => {
  // 2. cambiar el nombre visualmente

  linesStore.lines[itemPositionToBeRenamed.value].name = name;
  linesStore.showSearchLineName = false;
  linesStore.searchLineNameStatus = true;
  linesStore.optionSelected = true;

  changeLine({
    line: linesStore.lines[itemPositionToBeRenamed.value],
    isParent: linesStore.lines[itemPositionToBeRenamed.value].isParent,
    pos: itemPositionToBeRenamed.value,
    newLine: false,
  });
};

// Options Context Menu
const copy = () => {
  toast.info(`Copiado: $ ${currentItem.value.num}`, {
    autoClose: 2000,
  });
  linesStore.hideSuperMenu();
};

// Ordenar los headers
const expandCol = ref({
  incomes: true,
});
const expandCont = ref(0);

const updatedExpand = (colsExpand) => {
  expandCol.value = colsExpand;
  expandCont.value = expandCont.value + 1;
};

watch(
  () => expandCont.value,
  () => {
    headers.value = orderSupColHeaders(headers.value);
  }
);

const orderSupColHeaders = (mainHeaders) => {
  return mainHeaders
    ? mainHeaders.map(({ headers, type, name, pos }) => ({
        type,
        name,
        pos,
        headers: orderInfColHeader(headers, type).slice(),
      }))
    : [];
};

const orderSupColHeaders2 = (mainHeaders) => {
  if (mainHeaders) {
    let headersList = [];
    mainHeaders.forEach((header) => {
      const { type, name, pos } = header;
      const headers = orderInfColHeader(headers, type).slice();
      headersList.push({
        type,
        name,
        pos,
        headers,
        subCols: headers.length !== 0,
      });
    });
    return headersList;
  }
  return [];
};

const orderInfColHeader = (list, type) => {
  const template = incomesStore.typeTemplate;
  let filtered = list.filter(
    (el) => el.type === template && (el.isWritable || el.hide) && el.show
  );

  return expandCol.value[type]
    ? filtered.sort((a, b) => a.id - b.id)
    : filtered.sort((a, b) =>
        a.default === b.default ? 0 : a.default ? 1 : -1
      );
};

const changeTemplate = () => {
  incomesStore.typeTemplate == 1
    ? (incomesStore.typeTemplate = 0)
    : (incomesStore.typeTemplate = 1);
  menu.value = false;
};

// Modales de la Linea (info line y info Item)
const showInfoLine = ref(false);
const showInfoItem = ref(false);
const contentInfo = ref({});
const showModalInfo = async (data) => {
  const { type, content } = data;

  globalStore.loading = true;

  contentInfo.value = content;
  showInfoLine.value = type === "line";
  showInfoItem.value = type === "item";
  await linesStore.getLineById(content._id);
  linesStore.line = linesStore.currentLine;
  linesStore.calculateTotalLine();
  globalStore.loading = false;
};

const showModalChooseTemplate = async (data) => {
  showModalTemplate.value = true;
};

const showSaveTemplate = async (data) => {
  showModalSaveTemplate.value = true;
};

// Cambiar tipo de movimiento
const convertMovement = ref(false);

// Compartir movimiento
const shareMovement = ref(false);

const previewPDF = ref(false);

// Bloquar Modal
const lockModal = ref(false);

const hideModal = () => {
  if (!lockModal.value) {
    convertMovement.value = false;
    shareMovement.value = false;
    showModalCreateOc.value = false;
    showModalTemplate.value = false;
    showModalSaveTemplate.value = false;
    showModalDuplicateMovement.value = false;
    dimensions.value = {
      width: "800px",
      height: "90vh",
    };
    canceledModalPurchase.value = false;
    purchaseJustMade.value = "";
    ocCreatorModal.value = false;
    lockModal.value = false;
  }
};

const openPreview = () => {
  previewPDF.value = true;
};

const lock = (state) => {
  lockModal.value = state;
};
const loadingTable = (state) => {
  loading.value = state;
  globalStore.loading = state;
};

const dimensions = ref({
  width: "800px",
  height: "90vh",
});

const changeModeHollywood = async () => {
  if (incomesStore.income.amountLines <= 500) {
    menu.value = false;
    createTable.value = false;
    loading.value = true;
    globalStore.loading = true;
    incomesStore.hollywood = !incomesStore.hollywood;

    if (incomesStore.hollywood) {
      await linesStore.getAllLinesIncomes({ parent: "null" });
      originalLines.value = [];
    } else {
      await linesStore.getAllLinesIncomes();
      originalLines.value = JSON.parse(JSON.stringify(linesStore.lines));
    }

    loading.value = false;
    globalStore.loading = false;
    createTable.value = true;
  }
};

const originalLines = ref([]);
const resultLines = ref([]);
const loadingSearch = ref(false);

const searchLines = async (event) => {
  const toSearch = event.target.value.trim();
  if (incomesStore.hollywood) {
    if (toSearch !== "") {
      loadingSearch.value = true;
      const resp = await linesStore.searchLine(idIncome, toSearch);
      resultLines.value = mapperLine(resp);
      loadingSearch.value = false;
    } else {
      loading.value = true;
      await linesStore.getAllLinesIncomes({ parent: "null" });
      loading.value = false;
    }
  } else {
    if (toSearch === "") {
      linesStore.lines = JSON.parse(JSON.stringify(originalLines.value));
    } else {
      linesStore.lines = searchByName(toSearch, originalLines.value);
    }
  }
};

// Función principal que busca elementos por nombre y organiza los resultados
function searchByName(name, data) {
  const searchValue = name.toLowerCase();
  const initialMatches = findInitialMatches(searchValue, data);
  const result = processQueue(initialMatches, data);
  return buildFinalResult(result, data);
}

// Encuentra las coincidencias iniciales basadas en el nombre
function findInitialMatches(searchValue, data) {
  const queue = [];
  data.forEach((item) => {
    if (item.name.toLowerCase().includes(searchValue)) {
      queue.push(item);
    }
  });
  return queue;
}

// Procesa la cola para encontrar todos los elementos relacionados
function processQueue(queue, data) {
  const result = new Set();
  const childrenMap = new Map();

  while (queue.length > 0) {
    const current = queue.shift();
    result.add(current);

    if (current.isParent) {
      const children = data.filter((item) =>
        item.parents.includes(current.__id.toString())
      );
      children.forEach((child) => {
        queue.push(child);
        if (!childrenMap.has(current.__id)) {
          childrenMap.set(current.__id, []);
        }
        childrenMap.get(current.__id).push(child);
      });
    }

    current.parents.forEach((parentId) => {
      const parent = data.find((item) => item.__id.toString() === parentId);
      if (parent) {
        result.add(parent);
      }
    });
  }

  return { result: Array.from(result), childrenMap };
}

// Construye el resultado final ordenado
function buildFinalResult({ result, childrenMap }, data) {
  const finalResult = [];
  const addedItems = new Set();

  function addGroupAndChildren(groupId) {
    const group = result.find((item) => item.__id === groupId);
    if (group && !addedItems.has(group.__id)) {
      addedItems.add(group.__id);
      finalResult.push(group);
      const children = childrenMap.get(groupId) || [];
      children.forEach((child) => addGroupAndChildren(child.__id));
    }
  }

  function addItem(item) {
    if (!addedItems.has(item.__id)) {
      addedItems.add(item.__id);
      finalResult.push(item);
    }
  }

  result.forEach((item) => {
    if (item.isParent) {
      addGroupAndChildren(item.__id);
    }
  });

  result.forEach((item) => {
    if (!item.isParent) {
      const parents = [...item.parents].reverse();
      let currentItem = item;

      while (currentItem) {
        addItem(currentItem);
        const parentId = parents.shift();
        currentItem = result.find((el) => el.__id === parentId);
      }
    }
  });

  return finalResult;
}

const cleanInput = () => {
  search.value = "";
};
const selectedOption = async (option) => {
  loading.value = true;

  linesStore.breadcrumbs = [
    { icon: "folder", label: "Categorías", sub: false, id: "" },
  ];

  if (option.oldData.isParent) {
    if (option.oldData.parents.length) {
      option.oldData.parents.forEach((parent, p) => {
        const line = {
          icon: "",
          label: option.oldData.parentsName[p],
          sub: true,
          id: parent,
        };
        linesStore.breadcrumbs.push(line);
      });
    }

    const line = {
      icon: "",
      label: option.oldData.parentsName[0],
      sub: true,
      id: option.oldData.parent,
    };
    linesStore.breadcrumbs.push(line);
    await linesStore.getAllLinesIncomes({ parent: option.oldData.__id });
  } else {
    await linesStore.getAllLinesIncomes({ parent: option.oldData.parent });

    option.oldData.parents.forEach((p, index) => {
      const line = {
        icon: "",
        label: option.oldData.parentsName[index],
        sub: true,
        id: p,
      };
      linesStore.breadcrumbs.push(line);
    });
  }
  loading.value = false;
  cleanInput();
};
const mapperLine = (lines) => {
  return lines.map((l) => {
    const text = l.parentsName ? l.parentsName.join(" / ") : "-";
    return {
      label: l.name,
      text,
      search: true,
      oldData: l,
    };
  });
};

// alert
const alertCustom = ref({
  msg: "Los datos mostrados estan desactualizados",
  buttons: [{ action: "updatedAllLine", text: "Actualizar" }],
  type: "warning",
});

const getAllLines = async () => {
  loading.value = true;
  linesStore.isLinesOutdated = false;
  incomesStore.loadings.metrics = true;
  await linesStore.getAllLinesIncomes();
  loading.value = false;
  await linesStore.updateDataGrid();
};

//
const posDropdown = ref(null);
const isBottomDropdown = ref(true);
const goToDropdown = ref(false);

const dropdownClose = async () => {
  const line = linesStore.lines[posDropdown.value];
  posDropdown.value = null;
  goToDropdown.value = false;
  if (line.name.trim() !== "") {
    await updatedLine(line);
  }
};

const updateTable = async () => {
  await mountedFunction();
};

const dropdownSelect = async (op) => {
  linesStore.lines[posDropdown.value].name = op.name;
  linesStore.lines[posDropdown.value].code = op.code;
  const line = linesStore.lines[posDropdown.value];
  posDropdown.value = null;
  goToDropdown.value = false;
  await updatedLine(line);
};

const updatedPosDropdown = (pos) => {
  posDropdown.value = pos;
};

// Actualizar linea
const updatedLine = async (line) => {
  if (line.name.trim() !== "") {
    if (line._id == "") {
      await linesStore.changeLine(null, line);
    } else {
      await linesStore.updateSurchargeName(line);
    }
  }
};

// Comprar Nuevo
const ocCreatorModal = ref(false);
const typePO = ref({});
const openPOCreatorModal = (type) => {
  dimensions.value = {
    width: "auto",
    height: "auto",
  };
  const currency = incomesStore?.income?.currency?.default?._id;
  typePO.value = type;
  configPO.value.lines = linesStore.lines.filter((line) => line.selected && !line.isParent);
  configPO.value.lines = configPO.value.lines.map(line => ({...line, currency}))
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
  ocCreatorModal.value = true;
  dropdownOpen.value = false;
};
const updateDimensionsNew = (newDimensions) => {
  dimensions.value = newDimensions;
};
const configPO = ref({
  lines: [],
  income: idIncome,
  mov: {},
  skipStep2: false,
});

const updateTableGrid = async () => {
  loading.value = true;
  createTable.value = false;
  setTimeout(async () => {
    createTable.value = true;
    console.log("getAll lines previa");
    await getAllLines();
    loading.value = false;
  }, 2000);
};

// Anular Compra recien creada
const { t } = useI18n();
const tileDeleteModal = computed(() => {
  return t("modules.outcomes.pages.outcome.tabs.tab1.modals.cancel.title_new");
});
const descriptionDeleteModal = computed(() => {
  return t(
    "modules.outcomes.pages.outcome.tabs.tab1.modals.cancel.description"
  );
});
const confirmationDeleteModal = computed(() => {
  return t(
    "modules.outcomes.pages.outcome.tabs.tab1.modals.cancel.confirmationText"
  );
});
const btnDeleteModal = computed(() => {
  return t(
    "modules.outcomes.pages.outcome.tabs.tab1.modals.cancel.customTextBtnDelete"
  );
});
const canceledModalPurchase = ref(false);
const purchaseJustMade = ref("");
const canceledPurchase = async () => {
  // Anular compra recien comprada
  try {
    globalStore.loading = true;
    let body = { outcomes: [purchaseJustMade.value] };
    const { success, data, error } = await outcomesStore.archiveOutcome(body);
    if (success) {
      hideModal();
    }
  } catch (error) {
    console.error(error);
  } finally {
    globalStore.loading = false;
  }
};
const modalCanceled = (id) => {
  purchaseJustMade.value = id;
  canceledModalPurchase.value = true;
};
// Dropdown menu cell
const configDropdownCell = ref({});
const showMenuCell = (obj) => {
  if (obj === null) {
    configDropdownCell.value = {};
  } else {
    configDropdownCell.value = {};
    const widths = {
      units: 120,
      vars: 300,
      varsAndCurrencies: 300,
      time: 350,
    };
    const heights = {
      units: 190,
      vars: 310,
      varsAndCurrencies: 350,
      time: 350,
    };
    const el = {
      idParent: obj.id,
      idContainer: "grid",
      height: heights[obj?.header?.dropdown] || 250,
      width: widths[obj?.header?.dropdown] || 200,
      type: obj.type,
      header: obj.header,
      line: obj.line,
      posLine: obj.posLine,
    };
    setTimeout(() => (configDropdownCell.value = el), 0);
  }
};
const saveDropdownObj = ref({});
const saveDropdown = (newValues) => {
  saveDropdownObj.value = newValues;
};
const updatedSaveDropdownObj = () => {
  saveDropdownObj.value = {};
};
const dropdownCloseEvent = () => {
  document.querySelectorAll("input.focusInput").forEach((input) => {
    input.classList.remove("focusInput");
  });
  configDropdownCell.value = {};
};

const allDelete = () => {
  incomesStore.loadings.metrics = true;
  linesStore.allDeleteFunctions();
}

const typeToConvert = computed(() => (t("modules.incomes.pages.grilla.modal.changeType." + `${incomesStore.currentIncome.state === "budget" ? "business" : "budget"}`)));


// Función Expuesta
defineExpose({
  updateTable
})
</script>

<template>
  <div class="container" id="mainContainer">
    <div class="container__filters">
      <div class="search">
        <u-input
          v-model="search"
          placeholder="Buscar..."
          :revers="true"
          icon="search"
          size="s"
          @input="searchLines($event)"
          v-if="!incomesStore.hollywood"
        />
        <u-search
          v-else
          v-model="search"
          placeholder="Buscar..."
          :revers="true"
          icon="search"
          size="s"
          :loading="loadingSearch"
          :options="resultLines"
          :snippet="true"
          @input="searchLines($event)"
          @cleanInput="cleanInput"
          @selectedOption="selectedOption"
        />
        <u-button
          class="btnDesktop"
          text="Configurar Tabla"
          icon="settings"
          size="s"
          type="outlined"
          color="--neutral-surface-default"
          @action-btn="showSettingsTable = true"
        />
      </div>

      <div>
        <div class="group">
          <!-- Esto deberia ser un componente aparte -->
          <u-button
            class="group__button-primary"
            text="Comprar"
            icon="shopping-cart"
            @click="toggleDropdown"
            size="s"
            :disabled="organizationStore?.docs?.length === 0"
          />
          <u-button-icon
            class="group__button-secondary"
            icon="chevron-down"
            @click="toggleDropdown"
            size="s"
            :disabled="organizationStore?.docs?.length === 0"
          />

          <div
            class="dropdown-menu"
            v-if="organizationStore?.docs?.length"
            :class="{ open: dropdownOpen }"
          >
            <u-button
              v-for="outcomeType in organizationStore.docs.filter(
                (doc) => doc.isActive == true
              )"
              :key="outcomeType._id"
              class="dropdown-menu__item"
              :text="`Crear ${outcomeType.code}`"
              icon="shopping-cart"
              type="outlined"
              @click="openPOCreatorModal(outcomeType)"
            />
          </div>
        </div>
        <u-button-icon
          class="btnMobile"
          icon="settings"
          type="outlined"
          color="--neutral-surface-default"
          @action-btn="showSettingsTable = true"
          size="s"
        />
        <u-button-icon
          :icon="fullScreen ? 'minimize-1' : 'maximize-1'"
          type="outlined"
          color="--neutral-surface-default"
          @action-btn="fullScreen = !fullScreen"
          size="s"
          :tooltip="fullScreen ? 'Minimizar' : 'Maximizar'"
          :orientationTooltip="fullScreen ? 'bottom' : 'top'"
        />
        <u-button-icon
          icon="share"
          type="outlined"
          color="--neutral-surface-default"
          @click="(shareMovement = true), (menu = false)"
          size="s"
          tooltip="Compartir"
          :orientationTooltip="fullScreen ? 'bottom' : 'top'"
        />
        <div style="position: relative; height: 32px">
          <button class="btnMainMenu">
            <span class="u u-more btnMainMenuIcon" @click="menu = true"></span>
          </button>
          <div :style="`transform: scale(${menu ? 1 : 0})`" class="menu">
            <button
              class="btnMenu"
              @click="(convertMovement = true), (menu = false)"
            >
              <span class="u u-fast-zap"></span>
              <span>{{ t("modules.incomes.pages.grilla.modal.changeType.btnSave", { text: typeToConvert }) }}</span>
            </button>
            <button
              class="btnMenu"
              @click="changeTemplate()"
              v-if="linesStore.lines.length < 1001"
              :disabled="true"
            >
              <span class="u u-book"></span>
              <span>
                Template
                <b
                  :style="`color: var(--bg-${
                    incomesStore.typeTemplate === 0 ? 'primary' : 'info'
                  }-400)`"
                >
                  ({{
                    incomesStore.typeTemplate === 0 ? "Unabase" : "Hotbudget"
                  }})
                </b>
              </span>
            </button>
            <button
              class="btnMenu"
              @click="changeModeHollywood"
              v-if="incomesStore.income.amountLines <= 500"
            >
              <span class="u u-folder"></span>
              <span>
                Hollywood
                <b
                  :style="`color: var(--bg-${
                    incomesStore.hollywood ? 'primary' : 'neutral'
                  }-400)`"
                >
                  ({{ incomesStore.hollywood ? "Activo" : "Inactivo" }})
                </b>
              </span>
            </button>

            <button class="btnMenu" @click="exportResumen">
              <span class="u u-fast-zap"></span>
              <span>Exportar resumen</span>
            </button>

            <button
              class="btnMenu"
              @click="showModalSaveTemplate = !showModalSaveTemplate"
              :disabled="linesStore?.lines?.length === 0 || linesStore?.lines?.filter(line => line._id !== '').length === 0"
            >
              <span class="u u-fast-zap"></span>
              <span>Guardar Plantilla</span>
            </button>

            <button 
              class="btnMenu"
              @click="showModalDuplicateMovement = !showModalDuplicateMovement"
              :disabled="linesStore?.lines?.length === 0 || linesStore?.lines?.filter(line => line._id !== '').length === 0"
              >
              <span class="u u-duplicate"></span>
              <span>Duplicar Cotización /Negocio</span>
            </button>
          </div>
        </div>
      </div>
      <div class="alert">
        <span>Los datos mostrados están desactualizados</span>
        <button @click="getAllLines">Actualizar</button>
      </div>
    </div>

    <IncomesBreadcrumbGrid
      v-if="incomesStore.hollywood"
      @loading="loadingTable"
      :idIncome="idIncome"
    />
    <TableGrid
      v-if="createTable"
      :fullScreen="fullScreen"
      :headers="orderSupColHeaders(headers)"
      :loading="loading"
      :sizeRow="sizeRow"
      :columnName="columnName"
      :columnCode="columnCode"
      @updatedExpand="updatedExpand"
      @showSuperMenu="showSuperMenu"
      @showModalInfo="showModalInfo"
      @showModalTemplate="showModalChooseTemplate"
      @showModalSaveTemplate="showSaveTemplate"
      @loading="loadingTable"
      :isBottomDropdown="isBottomDropdown"
      :posDropdown="posDropdown"
      @updatedGoToDropdown="(state) => (goToDropdown = state)"
      @updatedPosDropdown="updatedPosDropdown"
      @showMenuCell="showMenuCell"
      :saveDropdownObj="saveDropdownObj"
    />
    <div
      class="contextualMenu"
      :style="`transform: scale(${showContextMenu ? 1 : 0})`"
      @contextmenu.prevent="linesStore.hideSuperMenu()"
    >
      <ul>
        <li>
          <button
            @contextmenu.prevent="linesStore.hideSuperMenu()"
            @click="copy"
          >
            <span class="u u-duplicate"></span>
            <span>Copiar</span>
          </button>
        </li>
        <li>
          <button @contextmenu.prevent="linesStore.hideSuperMenu()">
            <span class="u u-copy"></span>
            <span>Pegar</span>
          </button>
        </li>
        <li>
          <button @contextmenu.prevent="linesStore.hideSuperMenu()">
            <span class="u u-insert-above"></span>
            <span>Insertar 1 fila arriba</span>
          </button>
        </li>
        <li>
          <button @contextmenu.prevent="linesStore.hideSuperMenu()">
            <span class="u u-insert-below"></span>
            <span>Insertar 1 fila abajo</span>
          </button>
        </li>
        <li>
          <button
            @contextmenu.prevent="linesStore.hideSuperMenu()"
            @click="deleteLines()"
          >
            <span class="u u-delete"></span>
            <span>Eliminar</span>
          </button>
        </li>
      </ul>
    </div>
    <div
      class="createGroupMenu"
      :style="`transform: scale(${linesStore.showGroupMenuVar ? 1 : 0})`"
    >
      <ul>
        <li>
          <button
            @click="linesStore.addNewLine('group', linesStore.line, false)"
            class="btnIconGroup"
          >
            <span class="u u-folder-add"></span>
            <span>Crear Categoría</span>
          </button>
        </li>
        <li>
          <button
            @click="linesStore.addNewLine('group', linesStore.line)"
            class="btnIconGroup"
          >
            <span class="u u-folder-add"></span>
            <span>Crear sub-Categoría</span>
          </button>
        </li>
      </ul>
    </div>
    <div
      class="createLineMenu"
      :style="`transform: scale(${linesStore.showLineMenuVar ? 1 : 0})`"
    >
      <ul>
        <li>
          <button
            @click="linesStore.addNewLine('line', linesStore.line)"
            class="btnIconLine"
          >
            <span class="u u-folder-add"></span>
            <span>Crear línea dentro</span>
          </button>
        </li>
        <li>
          <button
            @click="linesStore.addNewLine('line', linesStore.line, false)"
            class="btnIconLine"
          >
            <span class="u u-folder-add"></span>
            <span>Crear línea fuera</span>
          </button>
        </li>
      </ul>
    </div>
    <div
      class="searchLinesByName scroll"
      :style="`transform: scale(${linesStore.showSearchLineName ? 1 : 0})`"
    >
      <div v-show="!linesStore.searchLineNames.length" class="withoutReuslt">
        <span>Sin resultados</span>
      </div>
      <button
        class="searchLinesByNameBtn"
        v-for="(item, n) in linesStore.searchLineNames"
        :key="n"
        @mousedown="selectedNameForLine(item.name)"
      >
        <span>{{ item.name }}</span>
      </button>
    </div>
    <u-dropdown
      v-if="![null, undefined].includes(posDropdown)"
      :idParent="`#row-${posDropdown}`"
      idContainer="mainContainer"
      maxheihtContent="128px"
      :customOptionStyle="true"
      :loading="linesStore.loadingSearch"
      :list="linesStore.searchLineNames"
      :goToDropdown="goToDropdown"
      @isBottomDropdown="(isBottom) => (isBottomDropdown = !isBottom)"
      @dropdownSelect="dropdownSelect"
      @dropdownClose="dropdownClose"
    >
      <template v-slot:cell="item">
        <span class="optionText" v-text="item.item.name"></span>
      </template>
    </u-dropdown>
    <IncomesCardsDropdown
      v-if="Object.values(configDropdownCell).length"
      :config="configDropdownCell"
      @dropdownClose="dropdownCloseEvent"
      @saveDropdown="saveDropdown"
      @updatedSaveDropdownObj="updatedSaveDropdownObj"
    />
  </div>
  <u-dialog
    :showModal="showSettingsTable"
    @closeModal="showSettingsTable = false"
    width="620px"
    height="620px"
  >
    <IncomesDialogSettingsGridTable
      @closeModal="showSettingsTable = false"
      @updatedConfigTable="updatedConfigTable"
      :headers="headers"
    />
  </u-dialog>
  <u-dialog
    :showModal="showInfoLine"
    @closeModal="showInfoLine = false"
    position="right"
    width="445px"
    :persistent="true"
  >
    <IncomesDialogInfoLineGrid @closeModal="showInfoLine = false" />
  </u-dialog>
  <u-dialog
    :showModal="showInfoItem"
    @closeModal="showInfoItem = false"
    width="820px"
    height="620px"
  >
    <IncomesDialogInfoItemGrid @closeModal="showInfoItem = false" />
  </u-dialog>
  <u-dialog
    :showModal="linesStore.confirmDelete"
    @closeModal="linesStore.confirmDelete = false"
    width="400px"
    height="200px"
  >
    <div class="containerDialogDelete">
      <span>¿Estas seguro de eliminar todas las Lineas?</span>
      <div>
        <u-button
          text="No"
          type="outlined"
          class="btnModify"
          @action-btn="linesStore.confirmDelete = false"
        />
        <u-button
          text="Si"
          class="btnModify"
          @action-btn="allDelete"
        />
      </div>
    </div>
  </u-dialog>
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
    :showModal="shareMovement"
    :lockModal="lockModal"
    @closeModal="hideModal"
    width="420px"
    height="540px"
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

  <!-- Comprar -->
  <u-dialog
    :showModal="ocCreatorModal"
    :lockModal="lockModal"
    @closeModal="hideModal"
    :width="dimensions.width"
    :height="dimensions.height"
    :persistent="true"
  >
    <DialogPOCreator
      @closeModal="hideModal"
      @updateDimensions="updateDimensionsNew"
      :typePO="typePO"
      @modalCanceled="modalCanceled"
      :config="configPO"
      @updateTableGrid="updateTableGrid"
    />
  </u-dialog>

  <!-- <u-dialog
    :showModal="showModalCreateOc"
    :lockModal="lockModal"
    @closeModal="hideModal"
    :width="dimensions.width"
    :height="dimensions.height"
    :persistent="true"
  >
    <DialogCreateOc page="incomes" />
  </u-dialog> -->

  <u-dialog
    :showModal="showModalTemplate"
    @closeModal="hideModal"
    width="auto"
    height="auto"
    :persistent="true"
  >
    <IncomesDialogChooseTemplate
      @closeModal="hideModal"
      @updateTable="updateTable"
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
    :showModal="organizationStore.printPdf.showModal"
    @closeModal="organizationStore.printPdf.showModal = false"
    width="auto"
    height="auto"
  >
    <dialog-pdf @closeModal="organizationStore.printPdf.showModal = false" />
  </u-dialog>

  <!-- Anular -->
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
</template>

<style scoped>
.container {
  height: v-bind("fullScreen ? '100vh' : 'calc(100vh - 80px - 132px)'");
  min-height: 200px;
  width: v-bind("fullScreen ? '100vw' : '100%'");
  border-radius: v-bind("fullScreen ? '0px' : '24px'");
  box-sizing: border-box;
  display: grid;
  grid-template-rows: v-bind(
    "incomesStore.hollywood ? '32px 28px 1fr' : '32px  1fr'"
  );
  gap: 10px;
  position: v-bind("fullScreen ? 'absolute' : 'relative'");
  top: 0;
  left: 0;
  background-color: v-bind(
    "fullScreen ? 'var(--neutral-background-default)' : ''"
  );
  z-index: v-bind("fullScreen ? 999 : ''");
  padding: v-bind("fullScreen ? '20px' : '0px'");
}

.btnMainMenu {
  border-radius: 8px;
  height: 32px;
  width: 32px;
  border: 1px solid var(--neutral-surface-default);
  padding: 0px;
  display: flex;
  justify-content: center;
  align-items: center;
}

.btnMainMenu span {
  width: 32px !important;
  height: 32px !important;
  font-size: 18px;
  line-height: 22px;
  color: var(--neutral-surface-default);
  padding: 5px;
}

.btnMainMenu:hover {
  border: 1px solid var(--neutral-text-subtitle);
}

.btnMainMenu:hover span {
  color: var(--neutral-text-subtitle);
}

.btnMainMenuPurchase {
  border-radius: 8px;
  height: 32px;
  width: 120px;
  background-color: var(--primary-surface-darker);
  padding: 0px;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 10px;
  transition: 0.3s;
}

.btnMainMenuPurchase span:nth-child(1) {
  font-size: 18px;
  line-height: 22px;
  color: var(--white);
}

.btnMainMenuPurchase span:nth-child(2) {
  font-size: 16px;
  font-weight: 600;
  line-height: 20px;
  color: var(--white);
  font-family: Nunito;
}

.btnMainMenuPurchase:hover {
  background-color: var(--primary-surface-default);
}

.btnMainMenuPurchase:active {
  background-color: var(--primary-surface-darker);
}

.container__filters,
.container__statistics {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  position: relative;
}

.container__filters > div,
.container__statistics div {
  display: flex;
  align-items: center;
  gap: 12px;
}

.container__filters .search {
  display: grid;
  grid-template-columns: 400px auto auto;
}

.alert {
  background-color: var(--success-surface-subtle);
  position: absolute;
  left: 50%;
  transform: translateX(-50%)
    scaleX(v-bind("linesStore.isLinesOutdated ? '1' : '0'"));
  transition: 0.3s;
  z-index: 3;
  display: flex;
  gap: 10px;
  height: 32px;
  align-items: center;
  padding: 0 16px;
  border-radius: 8px;
  box-shadow: var(--shadow-3);
}

.alert button {
  background-color: var(--neutral-background-default);
  border-radius: 4px;
  padding: 2px 8px;
  min-width: 20px;
  color: var(--neutral-surface-default);
  font-weight: 700;
  font-family: Nunito;
}

.alert span {
  color: var(--neutral-background-default);
  font-size: 14px;
  font-family: Nunito;
  font-weight: 600;
}

.btnMobile {
  display: none;
}

.container__statistics span {
  font-family: Nunito;
  font-size: 14px;
  line-height: 20px;
  font-weight: 600;
  color: var(--neutral-text-caption);
}

.container__statistics > div:nth-child(1) span {
  color: var(--neutral-text-body);
}

/* Contextual Menu */
.contextualMenu,
.createGroupMenu,
.createLineMenu,
.searchLinesByName {
  position: absolute;
  top: v-bind("contextMenuPosition.y");
  left: v-bind("contextMenuPosition.x");
  background-color: var(--neutral-background-default);
  width: 200px;
  height: auto;
  padding: 5px;
  border-radius: 10px;
  box-shadow: var(--shadow-2);
  z-index: 999;
}

.createGroupMenu,
.createLineMenu {
  transform-origin: left;
}

.searchLinesByName {
  width: v-bind("widthForLineNameResults");
  height: auto;
  max-height: 170px;
}

.searchLinesByName button {
  height: 32px;
  background-color: var(--neutral-background-default);
  width: 100%;
  display: flex;
  align-items: center;
  padding: 0 20px;
  border-radius: 10px;
  transition: background-color 0.3s;
}

.searchLinesByName button:hover {
  background-color: var(--primary-surface-shadow-8a);
}

.withoutReuslt {
  height: 32px;
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
}

.searchLinesByName button span,
.withoutReuslt span {
  color: var(--primary-text-default);
  font-size: 14px;
  line-height: 16px;
  font-weight: 600;
  font-family: Nunito;
}

.contextualMenu ul,
.createGroupMenu ul,
.createLineMenu ul {
  display: flex;
  flex-direction: column;
}

.contextualMenu ul li,
.createGroupMenu ul li,
.createLineMenu ul li {
  height: 32px;
  transition: 0.3s;
}

.contextualMenu ul li button,
.createGroupMenu ul li button,
.createLineMenu ul li button {
  width: 100%;
  height: 100%;
  background-color: var(--neutral-background-default);
  border-radius: 10px;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 0 10px;
}

.contextualMenu ul li button:hover,
.createGroupMenu ul li button:hover,
.createLineMenu ul li button:hover {
  background-color: #f3f7ff;
  /* FALTA!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!! */
}

.containerDialogDelete {
  height: 100%;
  display: grid;
  grid-template-rows: 1fr 40px;
}

.containerDialogDelete span {
  font-size: 20px;
  text-align: center;
  font-weight: 600;
}

.containerDialogDelete div {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.typeMovement__container {
  width: 250px;
  height: 40px;
  border-radius: 14px;
  background-color: var(--primary-surface-shadow-8a);
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 4px;
  padding: 0 4px;
  align-items: center;
}

.typeMovement__container div {
  border-radius: 12px;
  height: 32px;
  display: flex;
  justify-content: center;
  align-items: center;
}

.typeMovement__container div span {
  font-family: Nunito;
  font-size: 14px;
  font-weight: 600;
  line-height: 16px;
  letter-spacing: 0em;
  text-align: left;
}

.containerDialogDelete div .btnModify {
  width: calc(50% - 10px);
}

/* Menu - mas opciones */
.menu {
  position: absolute;
  right: 0;
  top: 0;
  transition: transform 0.3s;
  transition: 0.3s;
  transform: scale(0);
  transform-origin: top right;
  width: 269px;
  padding: 5px;
  box-shadow: var(--shadow-3);
  border-radius: 10px;
  z-index: 120;
  background-color: var(--neutral-background-default);
}

.group {
  display: inline-flex;
  position: relative;
  align-items: center;
}

.group__button-primary {
  border-radius: 8px 0 0 8px;
  padding-inline: 12px;
  white-space: nowrap;
  left: 1px;
}

.group__button-secondary {
  border-top-left-radius: inherit;
  border-bottom-left-radius: inherit;
}

.dropdown-menu {
  gap: 4px;
  padding: 4px 4px;
  display: flex;
  flex-direction: column;
  position: absolute;
  background-color: var(--neutral-background-darker);
  color: black;
  box-shadow: var(--shadow-3);
  z-index: 6;
  width: 100%;
  left: 0;
  top: 100%;
  border-bottom-left-radius: 16px;
  border-bottom-right-radius: 16px;
  transform-origin: top;
  transform: scaleY(0);
  opacity: 0;
  transition: transform 0.3s ease-in-out, opacity 0.3s ease-in-out;
  pointer-events: none;
}

.dropdown-menu.open {
  transform: scaleY(1);
  opacity: 1;
  pointer-events: auto;
}

.dropdown-menu__item {
  width: 100%;
  padding: 8px 16px;
}

.btnMenu {
  width: 100%;
  display: grid;
  grid-template-columns: 20px 1fr;
  gap: 10px;
  padding: 0 10px;
  height: 36px;
  align-items: center;
  border-radius: 10px;
  transition: 0.3s;
}

.btnMenu:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

.btnMenu:not(:disabled):hover {
  background-color: var(--primary-surface-shadow-8a);
}

.btnMenu span.u {
  font-size: 20px;
  line-height: 20px;
  color: var(--neutral-text-caption);
  transition: 0.3s;
}

.btnMenu span:not(.u) {
  font-size: 16px;
  line-height: 16px;
  font-family: "Nunito";
  color: var(--neutral-text-caption);
  text-align: left;
  font-weight: 600;
  transition: 0.3s;
}

.btnMenu span b {
  font-size: 12px;
  line-height: 12px;
  text-align: left;
  font-weight: 600;
  transition: 0.3s;
}

.btnMenu:hover span,
.btnMenu:hover span b {
  color: var(--primary-text-darker) !important;
}

.optionText {
  color: var(--neutral-text-body);
  font-family: Nunito;
  font-size: 14px;
  font-weight: 400;
  line-height: 16px;
  text-align: left;
  text-underline-position: from-font;
  text-decoration-skip-ink: none;
}

@media only screen and (max-width: 818px) {
  .container__filters .search {
    grid-template-columns: 1fr;
  }
}

@media only screen and (max-width: 768px) {
  .container {
    height: v-bind(
      "fullScreen ? '100vh' : 'calc(100vh - 100px - 85px - 52px)'"
    );
    width: v-bind("fullScreen ? '100vw' : 'calc(100vw - 40px)'");
  }
}

@media only screen and (max-width: 1132px) {
  .container__statistics {
    justify-content: flex-end;
  }

  .container__statistics > div:nth-child(1) {
    display: none;
  }
}

@media only screen and (max-width: 1206px) {
  .btnMobile {
    display: flex;
  }

  .btnDesktop {
    display: none;
  }

  .container__filters > div {
    gap: 12px;
  }
}
</style>
