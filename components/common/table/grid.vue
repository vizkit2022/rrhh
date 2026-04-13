<script setup>
import {
  ref,
  defineProps,
  watch,
  computed,
  defineEmits,
  onUnmounted,
} from "vue";
import { useVirtualList, useInfiniteScroll } from "@vueuse/core";
import { nextTick } from "vue";
import useLinesStore from "@/stores/lines";
import useIncomeStore from "@/stores/incomes";
import useGlobalStore from "@/stores/global";
import { toast } from "vue3-toastify";
import { onlyNumbersAndLetters } from "@/utils/helpers";

import { grilla } from "@/utils/labels/incomes.json";
const linesStore = useLinesStore();
const incomesStore = useIncomeStore();
const globalStore = useGlobalStore();
import {
  formatNumber,
  formatCurrency,
  getValueFormaRealTime,
  convertToNumberByCurrency,
  convertToNumber,
} from "@/utils/formatAmount";

const staticCol = ref(false);
const expandCol = ref({
  incomes: true,
});
const stylesByType = ref({
  incomes: {
    grid: "85px 85px 85px 85px 180px 180px",
    width: "615px",
    color: "--warning-text-default",
  },
  budgets: {
    grid: "85px 85px 85px 85px 180px 180px",
    width: "700px",
    color: "--info-text-default",
  },
  outcomes: {
    grid: "180px 180px 180px",
    width: "540px",
    color: "--danger-text-default",
  },
  projected: {
    grid: "180px 180px 180px 180px",
    width: "720px",
    color: "--success-text-default",
  },
});
// ******* MENU CONTEXTUAL *******
const emit = defineEmits([
  "showSuperMenu",
  "showModalInfo",
  "loading",
  "updatedExpand",
  "updatedGoToDropdown",
  "updatedPosDropdown",
  "showMenuCell",
  "updatedSaveDropdownObj",
]);

// ******* Props *******
const props = defineProps({
  loading: {
    type: Boolean,
    default: true,
  },
  fullScreen: {
    type: Boolean,
    default: false,
  },
  headers: {
    type: Array,
    default: () => [],
  },
  sizeRow: {
    type: Number,
    default: 2,
  },
  columnName: {
    type: Number,
    default: 0,
  },
  columnCode: {
    type: Boolean,
    default: true,
  },
  isBottomDropdown: {
    type: Boolean,
    default: true,
  },
  posDropdown: {
    type: Number,
    default: null,
  },
  saveDropdownObj: {
    type: Object,
    default: () => ({}),
  },
});

// ******* ESTILOS DE LA TABLA *******
// Expand

// Altura de las filas
const sizeRowPx = computed(() => {
  const pixeles = {
    0: 32,
    1: 40,
    2: 48,
    3: 52,
  };
  return pixeles[props.sizeRow] || 48;
});

const columnNamePx = computed(() => {
  const pixeles = {
    0: 500,
    1: 600,
  };
  let width = pixeles[props.columnName] || 500;
  width = width + (props.columnCode ? 40 : 0);
  return width;
});

// Widths, grids y colors de las columnas
const processHeaders = () => {
  let headers = [];
  props.headers.forEach((h) => {
    const { type } = h;

    if (props.headers) {
      headers.push({ type: h.type });
      if (h.headers.length === 1) {
        stylesByType.value[type].width = "180px";
        stylesByType.value[type].grid = "180px";
      } else {
        stylesByType.value[type].grid = h.headers
          .filter((income) => income.show)
          .map((income) =>
            income.default && !expandCol.value[type] ? "180px" : income.width,
          )
          .join(" ");
        if (stylesByType.value[type].grid === "85px 85px") {
          stylesByType.value[type].grid = "90px 180px";
          stylesByType.value[type].width = "270px";
        } else {
          let totalWidth = 0;
          h.headers.forEach((col) => {
            totalWidth +=
              col.default && !expandCol.value[type]
                ? 180
                : parseInt(col.width, 10);
          });
          stylesByType.value[type].width = totalWidth.toString() + "px";
        }
      }
    }
  });
};

watch(
  () => props.headers,
  () => processHeaders(),
);

onUnmounted(() => {
  linesStore.lines = linesStore.lines.map((l) => ({ ...l, selected: false }));
  return false;
});

// ******* Virtual List *******
// const loadMoreLines = async () =>
//   linesStore.lines.length ? await linesStore.getAllLinesIncomes() : null;
const computedLines = computed(() =>
  linesStore.lines.filter((l) => l.isVisible),
);

const { list, containerProps, wrapperProps } = useVirtualList(computedLines, {
  itemHeight: sizeRowPx.value,
});

// ******* Infinite Scroll *******

// useInfiniteScroll(containerProps.ref, () => loadMoreLines(), {
//   distance: 10,
// });

// ******* Variables para los estados de los Focus *******
const readonlyInput = ref({});

const click = ref(0);
const handleInputClick = (index, event) => {
  click.value = click.value + 1;
  if (click.value === 2) {
    readonlyInput.value[`line-${index}`] = true;
  }
};
const handleInputDdClick = (index, event) => {
  event.preventDefault();
};

// ***** TODAS LAS CELDAS *****
const cellHovers = ref({});

const findKeyObject = (section, prop) => {
  const obj = props.headers.find((h) => h.type === section);
  const property = obj.headers.find((p) => p.label === prop);
  return property["prop"];
};

const currencyFormatDefault = computed(
  () => incomesStore.currencyFormat.default,
);

const handleInputChange = (event, type, label, line) => {
  line = line.data;
  let prop = findKeyObject(type, label);
  const rawValue = event.target.value;
  const currency = { ...currencyFormatDefault.value };

  // Validación: Solo continuar si el valor contiene al menos un número o es vacío
  const isValidInput = /^[\d.,\s]+$/.test(rawValue) || rawValue === "";

  if (!isValidInput) {
    console.warn("Entrada inválida: solo se permiten números, comas o puntos");
    return; // Ignora el cambio
  }

  const numbers = getValueFormaRealTime(rawValue, currency, prop);
  //actualiza valor numberico
  line.numbers[prop].number = numbers.numericValue;
  // Actualiza el valor temporal en tiempo real
  line.numbers[prop].tempValue = numbers.formattedValue;
};

const chooseTemplate = () => {
  emit("showModalTemplate", true);
};

const startEditing = (event, type, label, LINE, id) => {
  const { index } = LINE;
  const line = LINE.data;
  const state = event.type == "focusin" ? true : false;
  const labelTypeKey = `${label}-${type}`;
  cellHovers.value[labelTypeKey] = state;
  cellHovers.value[index] = state;
  let prop = findKeyObject(type, label);
  if (state) {
    const input = document.getElementById(id);

    if (input) {
      input.focus();
      setTimeout(() => {
        input.select();
      }, 0);
    }

    // Focus: Elimina el formato para edición
    line.numbers[prop].tempValue = line.numbers[prop].number;
    line.numbers[prop].lastNumber = line.numbers[prop].number;
    line.numbers[prop].lastValue = line.numbers[prop].value;
  } else {
    // Blur: Maneja el caso de un campo vacío o inválido
    console.log("blur", line.numbers[prop]);

    try {
      // Aplica el formato final
      const precision = Number.isInteger(line.numbers[prop].number) ? 0 : 2;

      const currency = { ...currencyFormatDefault.value };
      if (prop.includes("mount")) {
        // para amount(1,2,3) y budgetAmount(1,2,3)
        currency.symbol = "";
        currency.precision = precision;
      }
      line.numbers[prop].value = formatCurrency(
        line.numbers[prop].number,
        currency,
        true,
        !["price", "budget"].includes(prop),
      );
      // Limpia el valor temporal
      delete line.numbers[prop].tempValue;
    } catch (error) {
      console.error("Error al formatear el valor:", error);
      line.numbers[prop].number = 0;
      delete line.numbers[prop].tempValue;
    }
  }

  linesStore.hideSuperMenu();
};

// Crear Categoría, subCategoría o linea
const startTime = ref(0);
const timer = ref(null);

const initTimerAndShowMenuGroup = (e, index, type) => {
  linesStore.line = index;
  startTime.value = Date.now();
  timer.value = setTimeout(() => {
    emit("showSuperMenu", {
      e,
      index: index,
      type,
      ...index,
    });
  }, 400);
};

const addPointLine = (index) => {
  console.log("nueva linea");
  const elapsedTime = Date.now() - startTime.value;
  if (elapsedTime < 1000) {
    // alert("Nueva linea" + linesStore.lines[index].name);
  }
  clearTimeout(timer.value);
};

const clearTimer = () => {
  clearTimeout(timer.value);
};

const handleChangeNumber = async (event, type, label, line, index, m) => {
  try {
    incomesStore.loadings.metrics = true;
    line = line.data;
    let prop = findKeyObject(type, label);
    const currency = { ...currencyFormatDefault.value };

    const precision = Number.isInteger(line.numbers[prop].number) ? 0 : 2;
    if (prop.includes("mount")) {
      // para amount(1,2,3) y budgetAmount(1,2,3)
      currency.symbol = "";
      currency.precision = precision;
    }
    if (["price", "budget"].includes(prop)) {
      line.numbers[prop].valueNoSymbol = formatCurrency(
        line.numbers[prop].number,
        currency,
        true,
        false,
      );
    }
    line.numbers[prop].value = formatCurrency(
      line.numbers[prop].number,
      currency,
      true,
      true,
    );
    // Si detecto un cambio en el presupuesto, cambio la variable changeBudget
    const varsBudget = [
      "budgetAmount1",
      "budgetAmount2",
      "budgetAmount3",
      "budget",
    ];
    if (varsBudget.includes(prop)) line.changeBudget = true;

    // Limpia el valor temporal
    delete line.numbers[prop].tempValue;

    // Limpiar las formulas
    const cleanVars = [
      "amount1",
      "amount3",
      "budgetAmount1",
      "budgetAmount2",
      "price",
      "budget",
    ];
    if (cleanVars.includes(prop)) {
      line = {
        ...line,
        numbers: {
          ...line.numbers,
          [prop]: {
            ...line.numbers[prop],
            calculation: { dependencies: [], formula: "", displayFormula: "" },
          },
        },
      };
    }

    const resp = await linesStore.calculateLine(event, line, prop);
    linesStore.allChangeFunctions(line); //Aqui se guarda los cambios

    linesStore.lines[index] = resp;
  } catch (e) {
    console.log(e);
  }
};

const pressEnter = ref(false);

const cellEditable = (label) => {
  const field =
    label == "name" ||
    label == "Unit" ||
    label == "QTY" ||
    label == "X" ||
    label == "HE" ||
    label == "Unitario" ||
    label == "Days" ||
    label == "Base" ||
    label == "Rate" ||
    label == "OT 1.5" ||
    label == "OT 2" ||
    label == "OT 2.5"
      ? true
      : false;
  return field;
};

const inputEditable = (label, line) => {
  return line.data.isParent || line.data._id == "" || !cellEditable(label)
    ? true
    : false;
};

const onlyNumberAndDotComma = (event, label, index) => {
  console.log("onlyNumbers");
  //console.log("onlyNumberAndDotComma", label);
  if (!cellEditable(label)) {
    console.log("no editable");
    event.preventDefault();
  } else {
    console.log("editable", label);
    let charCode = event.which ? event.which : event.keyCode;
    console.log("charcode", charCode);

    if (
      charCode !== 46 &&
      charCode !== 44 &&
      charCode > 31 &&
      (charCode < 48 || charCode > 57)
    ) {
      console.log("no editable");
      event.preventDefault();
    } else if (charCode == 13 && event.target.name != "name") {
      console.log("enter", event.target.name);
      handleKeyUp(event, index);
    }
  }
};

const handleKeyDown = (event, type, label, line, index) => {
  // Encuentra la propiedad correspondiente
  let prop = findKeyObject(type, label);

  // Asegúrate de que `currentValue` sea una cadena válida
  let currentValue = (line.data.numbers[prop].tempValue || "").toString();

  // Obtén la configuración de formato
  const currency = { ...currencyFormatDefault.value };
  const typeFormat = currency.typeFormat;
  let precision = currency.precision;

  if (prop.includes("amount")) {
    precision = 2;
  }

  // Define el separador decimal y de miles
  const decimalSeparator = typeFormat === "de-DE" ? "," : ".";
  const navigationKeys = ["ArrowDown", "ArrowUp", "ArrowLeft", "ArrowRight"];
  const controlKeys = ["Backspace", "Delete", "Tab"];

  // Navegación con flechas
  if (navigationKeys.includes(event.key)) {
    handleKeyUp(event, index);
    return;
  }

  // Permitir siempre teclas de control
  if (controlKeys.includes(event.key)) {
    return; // Permitir sin restricciones
  }

  // Permitir sobrescribir directamente si todo el texto está seleccionado
  const inputElement = event.target;
  const isAllSelected =
    inputElement.selectionStart === 0 &&
    inputElement.selectionEnd === inputElement.value.length;

  if (isAllSelected) {
    return; // Permitir reescritura sin restricciones
  }

  console.log("eventKey", decimalSeparator, precision);

  // Bloquear teclas no válidas
  if (!/^[0-9]$/.test(event.key) && event.key !== decimalSeparator) {
    console.log("no es numero");
    event.preventDefault();
    return;
  }

  // Bloquear entrada de separador decimal si `precision` es 0
  if (precision === 0 && event.key === decimalSeparator) {
    console.log("no es numero2");
    event.preventDefault();
    return;
  }

  // Verifica si ya se alcanzó el número máximo de decimales permitidos
  if (currentValue.includes(decimalSeparator)) {
    const [_, decimalPart] = currentValue.split(decimalSeparator);
    if (decimalPart && decimalPart.length >= precision) {
      event.preventDefault(); // Bloquear entrada adicional en la parte decimal
      return;
    }
  }
};

const handleKeyUp = async (event, index) => {
  console.log("AQUI");
  pressEnter.value = true;
  const key = event.key;
  let inputsInSameRow = null;
  let currentInputIndex = null;
  var array = event.target.id.split("-");
  var num = Number(index);

  const forbiddenBottom = !props.isBottomDropdown && key === "ArrowDown";
  const forbiddenTop = !props.isBottomDropdown && key === "ArrowUp";
  const forbiddenY =
    linesStore.loadingSearch && (forbiddenBottom || forbiddenTop);

  if (!forbiddenY) {
    function focusElement(startNum, direction, limit, array) {
      var num = startNum;
      var indexCode = array[0] + "-" + array[1] + "-" + num;

      while (direction === "up" ? num >= 0 : num <= limit) {
        let element = document.querySelector(`input[id$='${indexCode}']`);
        if (element && element.offsetParent !== null) {
          element.focus();
          return;
        }
        num = direction === "up" ? num - 1 : num + 1;
        indexCode = array[0] + "-" + array[1] + "-" + num;
      }
      var fallbackIndexCode =
        array[0] + "-" + array[1] + "-" + (direction === "up" ? limit : 0);
      document.querySelector(`input[id$='${fallbackIndexCode}']`).focus();
    }

    function focusElementInSameRow(startIndex, direction, inputsInSameRow) {
      //console.log("focusElementInSameRow");
      let index = startIndex;

      if (index < 0) index = inputsInSameRow.length - 1;
      if (index >= inputsInSameRow.length) index = 0;

      while (index >= 0 && index < inputsInSameRow.length) {
        let element = inputsInSameRow[index];
        if (element && element.offsetParent !== null) {
          element.focus();
          return;
        }
        index =
          direction === "left"
            ? index - 1 < 0
              ? inputsInSameRow.length - 1
              : index - 1
            : index + 1 >= inputsInSameRow.length
              ? 0
              : index + 1;
      }
    }
    var button = null;

    if (
      props.posDropdown !== null &&
      props.isBottomDropdown &&
      ["ArrowUp", "ArrowLeft", "ArrowRight"].includes(key)
    ) {
      emit("updatedPosDropdown", null);
      emit("updatedGoToDropdown", false);
      const line = linesStore.lines[index];
      updatedLine(line, event);
    }
    if (
      props.posDropdown !== null &&
      !props.isBottomDropdown &&
      ["ArrowDown", "ArrowLeft", "ArrowRight"].includes(key)
    ) {
      emit("updatedPosDropdown", null);
      emit("updatedGoToDropdown", false);
      const line = linesStore.lines[index];
      updatedLine(line, event);
    }
    if (
      props.posDropdown !== null &&
      ((props.isBottomDropdown && key === "ArrowDown") ||
        (!props.isBottomDropdown && key === "ArrowUp"))
    ) {
      emit("updatedGoToDropdown", true);
    }

    switch (key) {
      case "Enter":
        if (event.target.name != "name") {
          if (event.shiftKey) {
            event.preventDefault();
            button = document.getElementById(`itemSearch-${index}-0`);
            if (button) {
              button.focus();
            } else {
              focusElement(num - 1, "up", linesStore.lines.length - 1, array);
            }
            break;
          } else {
            event.preventDefault();
            button = document.getElementById(`itemSearch-${index}-0`);
            if (button) {
              button.focus();
            } else {
              // Si se alcanza el último, vuelve al primero
              if (num >= linesStore.lines.length - 1) {
                focusElement(0, "down", linesStore.lines.length - 1, array);
              } else {
                focusElement(
                  num + 1,
                  "down",
                  linesStore.lines.length - 1,
                  array,
                );
              }
            }
            break;
          }
        } else {
          break;
        }
      case "ArrowUp":
        event.preventDefault();
        if ([undefined, null].includes(props.posDropdown)) {
          focusElement(num - 1, "up", linesStore.lines.length - 1, array);
        }
        break;
      case "ArrowDown":
        event.preventDefault();
        if ([undefined, null].includes(props.posDropdown)) {
          // Si se alcanza el último, vuelve al primero
          if (num >= linesStore.lines.length - 1) {
            focusElement(0, "down", linesStore.lines.length - 1, array);
          } else {
            focusElement(num + 1, "down", linesStore.lines.length - 1, array);
          }
        }
        break;
      case "ArrowRight":
        event.preventDefault();
        inputsInSameRow = Array.from(
          document.querySelectorAll(
            `input[id$='-${index}']:not([disabled]):not([readOnly])`,
          ),
        );
        currentInputIndex = inputsInSameRow.indexOf(event.target);
        focusElementInSameRow(currentInputIndex + 1, "right", inputsInSameRow);
        break;
      case "ArrowLeft":
        event.preventDefault();
        inputsInSameRow = Array.from(
          document.querySelectorAll(
            `input[id$='-${index}']:not([disabled]):not([readOnly])`,
          ),
        );
        currentInputIndex = inputsInSameRow.indexOf(event.target);
        focusElementInSameRow(currentInputIndex - 1, "left", inputsInSameRow);
        break;
      case "Tab":
        event.preventDefault();
        if (event.shiftKey) {
          inputsInSameRow = Array.from(
            document.querySelectorAll(
              `input[id$='-${index}']:not([disabled]):not([readOnly])`,
            ),
          );
          currentInputIndex = inputsInSameRow.indexOf(event.target);
          focusElementInSameRow(currentInputIndex - 1, "left", inputsInSameRow);
          break;
        } else {
          inputsInSameRow = Array.from(
            document.querySelectorAll(
              `input[id$='-${index}']:not([disabled]):not([readOnly])`,
            ),
          );
          currentInputIndex = inputsInSameRow.indexOf(event.target);
          focusElementInSameRow(
            currentInputIndex + 1,
            "right",
            inputsInSameRow,
          );
          break;
        }
    }
  }
};
const cleanLines = () => {
  if (linesStore.lines) {
    linesStore.lines = linesStore.lines.filter((el) => el.name !== "");
  }
  linesStore.hideSuperMenu();
  linesStore.posContainerSearch = null;

  !list.value.some((l) => l.data.selected == false)
    ? (linesStore.selectedLines.all = true)
    : (linesStore.selectedLines.all = false);
};

//EVENTOS GLOBALES
document.addEventListener("keyup", (event) =>
  !event.isComposing ? (event.key === "Escape" ? cleanLines() : null) : null,
);

const handleInputChangeName = async (event, line) => {
  stopInput.value = "";
  const input = event.target;
  const tableDiv = input.closest(".table");
  const inputRect = input.getBoundingClientRect();
  const tableRect = tableDiv.getBoundingClientRect();
  const inputTopRelativeToTable = inputRect.top - tableRect.top;
  // const fullHeight = window.innerHeight;
  // linesStore.top = fullHeight - inputTopRelativeToTable < 300;
  if (!!event.target.value.trim()) {
    linesStore.top = inputTopRelativeToTable <= 446;
    linesStore.posContainerSearch = line.index;
    linesStore.loadingSearch = true;
    await linesStore.searchForLineNames(line.data.name);
    linesStore.loadingSearch = false;
  }
};

const stopInput = ref("");

const clickHandlerOption = (e, item, line) => {
  stopInput.value = item.name;
  setTimeout(() => {
    linesStore.enterEvent = false;
    const input = document.getElementById(line.__id);
    line.name = item.name;

    linesStore.posContainerSearch = null;

    if (input) {
      input.focus();
    }
    console.log("linea a crear", line);
    linesStore.addNewLine("line", line, line.isParent ? true : false, true, e);
    updatedLine(line, e);
    stopInput.value = "";
  }, 10);
};

// Seleccionar Lineas
const selectLines = async (type, line = {}) => {
  console.log("selectLine", line.name);
  //console.log(type, line.name, line.__id, line.parent);
  switch (type) {
    case "all":
      linesStore.lines.forEach(
        (l) => (l.selected = linesStore.selectedLines.all),
      );
      if (linesStore.selectedLines.all) {
        linesStore.selectedLines.list = linesStore.lines.map((l) => l.__id);
      } else {
        linesStore.selectedLines.list = [];
        linesStore.selectedParents = [];
      }
      break;

    default:
      console.log("entro al default");
      linesStore.selectedLines.all = false;
      if (Object.values(line).length == 0) return;
      if (line.isParent) {
        console.log("es parent");
        linesStore.lines.forEach((l) => {
          if (l.parents.includes(line.__id)) {
            l.selected = line.selected;
            updateSelectedLinesList(l.__id, line.selected);
          }
        });
        updateSelectedLinesList(line.__id, line.selected);
      } else {
        updateSelectedLinesList(line.__id, line.selected);
        if (!line.selected && line.parent && line.parent != "") {
          const parent = linesStore.lines.find((l) => l.__id == line.parent);
          if (parent) {
            parent.selected = false;
            updateSelectedLinesList(parent.__id, false);
          }
        }
      }
      selectParents(line);
  }
  //console.log("line", linesStore.selectedLines);
  //console.log("parents", linesStore.selectedParents);
};

function updateSelectedLinesList(id, add) {
  console.log("updateSelected", id, add);
  const index = linesStore.selectedLines.list.indexOf(id);
  console.log("index", index);
  if (add) {
    if (index === -1) {
      linesStore.selectedLines.list.push(id);
    }
  } else {
    if (index !== -1) {
      linesStore.selectedLines.list.splice(index, 1);
    }
  }
  console.log("selectedLines", linesStore.selectedLines.list);
}

const selectParents = async (line) => {
  if (line.parent) {
    if (line.selected) {
      if (!linesStore.selectedParents.includes(line.parent)) {
        linesStore.selectedParents.push(line.parent);
      }
    } else {
      const hasSelectedChildren = linesStore.lines.some(
        (l) => l.selected && l.parent === line.parent,
      );
      if (!hasSelectedChildren) {
        linesStore.selectedParents = linesStore.selectedParents.filter(
          (l) => l != line.parent,
        );
      }
    }
  }
};

/*
const selectParents = async (line) => {
  if (line.parent) {
    // Crear el nuevo objeto que queremos agregar
    const newParentObject = {
      parent: line.parent,
      parents: line.parents
    };

    if (line.selected) {
      // Verifica si ya existe en selectedParents
      const exists = linesStore.selectedParents.some(
        (obj) => obj.parent === line.parent
      );
      if (!exists) {
        linesStore.selectedParents.push(newParentObject);
      }
    } else {
      // Verifica si hay hijos seleccionados
      const hasSelectedChildren = linesStore.lines.some(
        (l) => l.selected && l.parent === line.parent
      );

      if (!hasSelectedChildren) {
        // Filtrar y eliminar el objeto correspondiente
        linesStore.selectedParents = linesStore.selectedParents.filter(
          (obj) => obj.parent !== line.parent
        );
      }
    }
  }
};
*/

const showDialogDeleteLines = async () => {
  incomesStore.loadings.metrics = true;
  console.log("borrando lineas");
  if (!linesStore.selectedLines.all && !linesStore.selectedLines.list.length) {
    toast.warning("Debe seleccionar al menos una línea.", {
      autoClose: 2000,
    });
    return;
  }
  if (linesStore.selectedLines.all) {
    linesStore.confirmDelete = true;
  } else {
    const deleteLines = await linesStore.allDeleteFunctions();
  }
};

const navigateOptions = (direction, lineData, lineIndex) => {
  const button = document.getElementById(`itemSearch-${lineIndex}-0`);
  console.log("navigateOptions", button);
  if (button) {
    button.focus();
  }
};

const navigateOptionsButton = (e, item, row) => {
  const button = document.getElementById(
    `itemSearch-${row}-${
      e.key == "ArrowUp" ? (parseInt(item) == 0 ? item : item - 1) : item + 1
    }`,
  );
  if (button) {
    button.focus();
  }
};

const lineDetails = (line) => {
  console.log("AQUIII");
  console.log("el index", line.index, line.data);
  line.data["index"] = line.index;
  line.data["pos"] = line.index;
  console.log("linedagta", line.data);
  // linesStore.line = { ...line.data, pos: line.index };
  linesStore.line = line.data;
  console.log("wena", linesStore.line);
  linesStore.switches = [];
  linesStore.switchesBudget = [];
  for (let i = 0; i < linesStore.linesSurcharges.length; i++) {
    const existsIncome = line.data.surchargesLines.includes(
      linesStore.linesSurcharges[i]._id,
    );
    const existsBudget = line.data.surchargesLinesBudget?.includes(
      linesStore.linesSurcharges[i]._id,
    );
    linesStore.switches.push(existsIncome);
    linesStore.switchesBudget.push(existsBudget);
  }
  linesStore.calculateTotalLine();
  emit("showModalInfo", {
    type: "line",
    content: line.data,
  });
};

// Expandir / colapsar Categorías
const onlyLevel1 = ref(false);
const showOnlyLinesLevel1 = () => {
  onlyLevel1.value = !onlyLevel1.value;
  linesStore.lines = linesStore.lines.map((line) => {
    return {
      ...line,
      isVisible: onlyLevel1.value ? line.parents.length === 0 : true,
      expand: !onlyLevel1.value,
    };
  });

  if (onlyLevel1.value) {
    const listLines = document.querySelector(".table");
    listLines.scrollTop = 0;
  }
};
const expandLine = (line) => {
  if (!line.isParent) return; // Solo carpetas

  const openFolder = !line.expand;
  const id = line.__id;
  const level = line.parents.length;
  let found = false;

  for (let index = 0; index < linesStore.lines.length; index++) {
    const item = linesStore.lines[index];
    if (!(item.parents === 0 && !item.isParent)) {
      if (item.parents.includes(id)) {
        found = true;
        if (item.parents.length === level + 1) {
          item.isVisible = openFolder;
          if (item.isParent) item.expand = false;
        } else {
          item.isVisible = false;
        }
      } else {
        if (found) break;
      }
    }
  }
};

// Filtrar por Categoría // Modo Hollywood
const filterParent = async (line) => {
  if (incomesStore.hollywood)
    linesStore.hollywood_parent = JSON.parse(JSON.stringify(line));

  line.expand = !line.expand;
  emit("loading", true);
  linesStore.breadcrumbsUpdate(line);
  console.log("wena wena");
  await linesStore.getAllLinesIncomes({ parent: line.__id });
  emit("loading", false);
};

// Delete one Line
const deleteSingleLine = async (line) => {
  incomesStore.loadings.metrics = true;
  line.selected = true;
  await selectLines("line", line);
  linesStore.allDeleteFunctions();
};

// Actualizar linea
const updatedLine = async (line, event) => {
  if (event.target.name == "code") {
    await linesStore.changeLine(null, line);
  } else if (line.name.trim() !== "") {
    if (line._id == "") {
      await linesStore.changeLine(null, line);
    } else {
      await linesStore.updateSurchargeName(line);
    }
  }
};

//Hovers - Buttons
const btnGroupMain = ref(false);
const btnMoreMain = ref(false);

// DropDown
const findLinesByName = async (line) => {
  emit("updatedPosDropdown", line.index);
  console.log("buscando items");
  const toSearch = line.data.name.trim();

  if (toSearch !== "") {
    linesStore.loadingSearch = true;
    await linesStore.searchForLineNames(line.data.name, line.data.isParent);
    linesStore.loadingSearch = false;
  }
};
const saveLine = async (line, e) => {
  if (line?.data?.name?.trim() !== "") {
    linesStore.enterEvent
      ? linesStore.addNewLine(
          "line",
          line.data,
          line.data.isParent ? true : false,
          true,
          e,
        )
      : null;
    emit("updatedPosDropdown", null);
    emit("updatedGoToDropdown", false);
    await updatedLine(line.data, e);
  }
};

// Menu de Celdas
const showMenuCell = (header, line, h) => {
  const { type } = header;
  const { index } = line;
  const { label } = h;
  const id = `${type}-${label}-${index}`;
  const obj = { id, type, header: h, line: line.data, posLine: index };

  document.querySelectorAll("input.focusInput").forEach((input) => {
    input.classList.remove("focusInput");
  });

  setTimeout(() => {
    const input = document.getElementById(id);
    if (input) input.classList.add("focusInput");

    emit("showMenuCell", obj);
  }, 10);
};
const clearEvents = () => {
  emit("updatedPosDropdown", null);
  emit("showMenuCell", null);
};

watch(
  () => props.saveDropdownObj,
  async () => {
    const newValue = props.saveDropdownObj.newValue;
    const prop = props.saveDropdownObj.prop;
    let line = JSON.parse(
      JSON.stringify(linesStore.lines[props.saveDropdownObj.posLine]),
    );
    if (props.saveDropdownObj.type === "unit") {
      line = { ...line, [prop]: newValue?._id || null };
    }
    if (props.saveDropdownObj.type === "currency") {
      incomesStore.loadings.metrics = true;

      const propCurrency =
        props.saveDropdownObj.prop === "price" ? "currency" : "currencyBudget";
      line[propCurrency] = props.saveDropdownObj.newValue;
      console.log(line);

      if (props.saveDropdownObj.prop === "budget") {
        // Romper el espejo
        line.changeBudget = true;
      }
    } else {
      incomesStore.loadings.metrics = true;
      line = { ...line, numbers: { ...line.numbers, [prop]: newValue } };
    }

    try {
      const resp = await linesStore.calculateLine(null, line, prop);
      linesStore.lines[props.saveDropdownObj.posLine] = resp;
      linesStore.allChangeFunctions(line);
    } catch (error) {
      console.error("Error al actualizar la línea:", error);
    } finally {
      emit("updatedSaveDropdownObj");
    }
  },
);

const formatData = (number, currency) => {
  const { precision, typeFormat } = currency;
  const numberAprox = convertToNumber(number, typeFormat, precision);
  return {
    number,
    value: formatCurrency(numberAprox, currency, true),
    numberAprox,
  };
};

const getUnitName = (line, type, prop) => {
  const propNumeric = type === "incomes" ? "amount1" : "budgetAmount1";
  const propName =
    line?.numbers?.[propNumeric]?.number === 1 ? "name" : "plural";
  return line?.[prop]?.[propName] || "";
};
</script>

<template>
  <div
    class="table"
    id="grid"
    v-bind="containerProps"
    @scroll="clearEvents"
    @contextmenu.prevent="linesStore.hideSuperMenu()"
  >
    <!-- Header -->
    <div class="table__header">
      <div class="table__header-row">
        <div class="table__header-col table__header-col-actions">
          <button class="btnIcon"><span class="u u-locked"></span></button>
          <!-- <button class="btnIcon"><span class="u u-undo"></span></button> -->
          <button class="btnIcon" @click="showDialogDeleteLines()">
            <span class="u u-delete"></span>
          </button>
        </div>
        <div class="table__header-col table__header-col-sticky">
          <span>Líneas</span>
          <div class="flex">
            <button
              @click="showOnlyLinesLevel1"
              v-if="!incomesStore.hollywood"
              class="btnIcon btnIconHeader"
              :title="onlyLevel1 ? 'Descomprimir' : 'Comprimir'"
            >
              <span :class="`u u-folder${onlyLevel1 ? '' : '-open'}`"></span>
            </button>
            <button
              :class="`${
                staticCol ? 'fixed' : ''
              } btnIcon btnIconFixColumn btnIconHeader`"
              @click="staticCol = !staticCol"
            >
              <span class="u u-pin"></span>
            </button>
          </div>
        </div>
        <div
          class="table__header-col"
          v-for="header in props.headers.filter((h) =>
            h.headers.some(
              (sub) => sub.type === incomesStore.typeTemplate && sub.isWritable,
            ),
          )"
          :key="header.pos"
          :class="`table__header-col-${header.type}`"
        >
          <span>{{ header.name }}</span>
          <button
            v-if="header.headers.length > 1"
            class="btnIconByCol"
            @click="
              ((expandCol[header.type] = !expandCol[header.type]),
              emit('updatedExpand', expandCol))
            "
            :style="`transform: rotate(${expandCol[header.type] ? 180 : 0}deg)`"
          >
            <span
              class="u u-chevron-right"
              :style="`color: var(${stylesByType[header.type].color});`"
            ></span>
          </button>
        </div>
      </div>
      <div class="table__header-row">
        <div class="table__header-col table__header-col-actions">
          <u-checkbox
            v-model="linesStore.selectedLines.all"
            v-if="!incomesStore.hollywood"
            :height="16"
            @click="selectLines('all')"
            :disabled="!linesStore.lines.length"
          />
          <div v-else></div>
          <div></div>
          <button class="btnIcon" @click="linesStore.addNewLine('group')">
            <span class="u u-folder-add"></span>
          </button>
          <div v-if="!incomesStore.hollywood"></div>
          <button
            class="btnIcon"
            style="margin-right: 3px"
            @click="linesStore.addNewLine()"
          >
            <span class="u u-new"></span>
          </button>
        </div>
        <div class="table__header-col table__header-col-sticky">
          <div class="codeCol">
            <span>ID</span>
          </div>
          <div v-if="props.columnCode" class="codeCol">
            <span style="width: 100%; text-align: center">Código</span>
          </div>
          <div class="nameCol">
            <span>Nombre</span>
          </div>
        </div>
        <div
          v-for="header in props.headers.filter((h) =>
            h.headers.some(
              (sub) => sub.type === incomesStore.typeTemplate && sub.isWritable,
            ),
          )"
          :key="header.pos"
          :class="`table__header-col-${header.type} table__header-col-${header.type}-grid`"
        >
          <div
            v-for="h in header.headers.filter(
              (h) => h.type === incomesStore.typeTemplate && h.show,
            )"
            :key="h.id"
            :class="
              cellHovers[h.label + '-' + header.type] ? 'selectedCell' : 'cell'
            "
            :style="`justify-content: ${h.align};`"
          >
            <span>{{ h.label }}</span>
          </div>
        </div>
      </div>
    </div>
    <!--**************************************** Items *************************************** -->
    <div
      v-if="linesStore.lines.length && !props.loading"
      v-bind="wrapperProps"
      class="listLines"
    >
      <div
        class="table__item"
        v-for="line in list"
        :key="`${line.data.__id}`"
        :class="`table__item-level-${
          line.data.isParent
            ? line.data.parents.length + 1
            : line.data.parents.length
              ? line.data.parents.length + 1
              : 0
        } ${line.data.isParent ? '' : 'table__item-line'} ${
          line.data.expand ? 'expand' : ''
        }`"
      >
        <div class="table__item-row">
          <div class="table__item-col-actions item-cell">
            <u-checkbox
              v-model="line.data.selected"
              :height="16"
              @click="selectLines('line', line.data)"
            />
            <button
              class="btnIcon"
              @click="deleteSingleLine(line.data)"
              title="Eliminar línea"
            >
              <span class="u u-delete"></span>
            </button>
            <button
              class="btnIcon btnIconGroup"
              @click="linesStore.addNewLine('group', line.data, false)"
              :disabled="!line.data.isParent"
              :title="`Crear ${
                line.data.parents.length === 1 ? 'subcategoría' : 'categoría'
              } al mismo nivel de ${line.data.name}`"
            >
              <span class="u u-folder-add"></span>
            </button>
            <button
              v-if="!incomesStore.hollywood"
              class="btnIcon"
              @click="linesStore.addNewLine('group', line.data)"
              :disabled="!line.data.isParent || line.data.parents.length === 2"
              :title="`Crear subcategoría en ${line.data.name}`"
            >
              <span class="u u-group-child"></span>
            </button>
            <button
              @click="linesStore.addNewLine('line', line.data)"
              @mousedown="
                line.data.isParent
                  ? initTimerAndShowMenuGroup($event, line.data, 'menuLine')
                  : null
              "
              @mouseup="addPointLine(line.index)"
              @mouseleave="clearTimer"
              class="btnIcon"
              title="Crear línea"
            >
              <span class="u u-new"></span>
            </button>
          </div>
          <div class="table__item-col-sticky item-cell" style="z-index: 2">
            <div
              class="codeCol"
              :style="`background-color: var(${
                cellHovers[line.index] ? '--secondary-surface-shadow-12a' : ''
              })`"
            >
              <span v-text="line.index + 1"></span>
            </div>
            <div
              v-if="props.columnCode"
              class="codeColInput"
              :style="`background-color: var(${
                cellHovers[line.index] ? '--secondary-surface-shadow-12a' : ''
              })`"
            >
              <input
                name="code"
                :id="'lines-code-' + line.index"
                v-model="line.data.code"
                autocomplete="off"
                placeholder="-"
                @change="updatedLine(line.data, $event)"
                @input="line.data.code = onlyNumbersAndLetters(line.data.code)"
                @keydown="handleKeyUp($event, line.index)"
              />
            </div>
            <div
              class="table__item-col-sticky-name nameCol"
              :style="`background-color: var(${
                cellHovers[line.index] ? '--secondary-surface-shadow-12a' : ''
              })`"
              :id="`row-${line.index}`"
            >
              <div class="lineTab" v-if="!incomesStore.hollywood"></div>
              <div class="lineTabTwo" v-if="!incomesStore.hollywood"></div>
              <template v-if="incomesStore.hollywood">
                <button
                  v-show="line.data.isParent"
                  class="btnIcon btnIconSpacer btnFolder"
                  @click="filterParent(line.data)"
                  style="z-index: 2"
                >
                  <div style="padding: 2px">
                    <span
                      :class="`u u-folder${line.data.expand ? '' : '-open'}`"
                    ></span>
                  </div>
                </button>
              </template>
              <template v-else>
                <button
                  v-show="line.data.isParent"
                  class="btnIcon btnIconSpacer btnFolder"
                  @click="
                    (expandLine(line.data),
                    (line.data.expand = !line.data.expand))
                  "
                  style="z-index: 2"
                >
                  <div style="padding: 2px">
                    <span
                      :class="`u u-folder${line.data.expand ? '-open' : ''}`"
                    ></span>
                  </div>
                </button>
              </template>
              <input
                name="name"
                :id="'lines-name-' + line.index"
                type="text"
                autocomplete="off"
                :placeholder="
                  line.data.isParent
                    ? line.data.parents.length === 2
                      ? 'Nombre de la Sub-subcategoría'
                      : line.data.parents.length === 1
                        ? 'Nombre de la Subcategoría'
                        : 'Nombre de la Categoría'
                    : 'Nombre de la Línea'
                "
                v-model="line.data.name"
                @input="findLinesByName(line)"
                @keyup.enter="saveLine(line, $event)"
                @keyup.esc="saveLine(line, $event)"
                @keydown="handleKeyUp($event, line.index)"
              />

              <!--
                @keydown="handleKeyUp($event, line.index)"
                -->

              <!-- @keyup.down="navigateOptions('down', line.data, line.index)" -->

              <!-- @keyup.up="navigateOptions('up', line.data, line.index)" -->
              <button
                style="display: none"
                class="btnIcon btnByLine"
                @click="
                  emit('showModalInfo', { type: 'item', content: line.data })
                "
              >
                <span class="u u-book"></span>
              </button>
              <button class="btnIcon" @click="lineDetails(line)">
                <span class="u u-info"></span>
              </button>
              <button class="btnIcon btnByGroup">
                <span
                  >({{
                    incomesStore.hollywood
                      ? line.data.numberChildren
                      : linesStore.countParents(line.data.__id)
                  }})</span
                >
              </button>
              <div
                class="table__item-col-search"
                v-if="line.index === linesStore.posContainerSearch"
                :style="
                  linesStore.top
                    ? 'top: calc(100% + 2px)'
                    : 'bottom: calc(100% + 2px)'
                "
              >
                <div v-if="linesStore.loadingSearch" class="notData">
                  <u-loading :width="14" />
                  <span style="margin-left: 10px">cargando...</span>
                </div>
                <template v-else>
                  <button
                    class="table__item-col-search-option"
                    v-for="(item, indexItem) in linesStore.searchLineNames"
                    :key="item._id"
                    :id="`itemSearch-${line.index}-${indexItem}`"
                    @mousedown="clickHandlerOption($event, item, line.data)"
                    @keydown.down="
                      navigateOptionsButton($event, indexItem, line.index)
                    "
                    @keydown.up="
                      navigateOptionsButton($event, indexItem, line.index)
                    "
                    @keydown.enter="clickHandlerOption($event, item, line.data)"
                  >
                    {{ item.name }}
                  </button>
                  <span
                    v-if="linesStore.searchLineNames.length === 0"
                    class="msgSearch"
                    >{{ grilla.fillerTexts.noResults[globalStore.lang] }}</span
                  >
                </template>
              </div>
            </div>
          </div>
          <div
            v-for="header in props.headers.filter((h) =>
              h.headers.some(
                (sub) =>
                  sub.type === incomesStore.typeTemplate && sub.isWritable,
              ),
            )"
            :key="header.pos"
            :class="`table__item-col-${header.type} table__item-col-${header.type}-grid item-cell`"
          >
            <div
              v-for="h in header.headers.filter(
                (h) => h.type === incomesStore.typeTemplate && h.show,
              )"
              :key="h.id"
              :class="`cellContainer ${header.type}-${h.label}`"
            >
              <template
                v-for="(headerType, index) in [
                  'incomes',
                  'budgets',
                  'outcomes',
                  'projected',
                ]"
                :key="`headerType-${index}`"
              >
                <template v-if="header.type === headerType">
                  <div
                    v-if="h.dropdown === 'units' && line.data.isParent"
                  ></div>
                  <button
                    v-else-if="
                      ['unit', 'unitBudget'].includes(h.prop) &&
                      h.dropdown !== '' &&
                      h.tag &&
                      !line.data.isParent
                    "
                    class="tagGrid"
                    :id="`${header.type}-${h.label}-${line.index}`"
                    @click="showMenuCell(header, line, h)"
                    :disabled="!h.isReadable"
                  >
                    <span
                      v-if="
                        line?.data?.[
                          headerType === 'incomes' ? 'unit' : 'unitBudget'
                        ]
                      "
                      :style="`background-color: ${line?.data?.[h.prop]?.colorLabel};`"
                      >{{ getUnitName(line.data, header.type, h.prop) }}</span
                    >
                  </button>
                  <template v-else>
                    <input
                      autocomplete="off"
                      :class="`${
                        typeof line.data._id == 'undefined' ||
                        line.data._id == ''
                          ? 'disable_'
                          : ''
                      }`"
                      :readonly="!h.isReadable || inputEditable(h.label, line)"
                      :disabled="!h.isReadable"
                      type="text"
                      :name="h.label"
                      :id="`${header.type}-${h.label}-${line.index}`"
                      :value="
                        line.data.numbers[findKeyObject(headerType, h.label)]
                          ?.tempValue ||
                        line.data.numbers[findKeyObject(headerType, h.label)][
                          ['price', 'budget'].includes(h.prop)
                            ? 'valueNoSymbol'
                            : 'value'
                        ]
                      "
                      :style="`color: var(${
                        line.data.isParent && !line.data.expand
                          ? '--neutral-text-caption'
                          : '--neutral-text-body'
                      })`"
                      @input="
                        handleInputChange($event, header.type, h.label, line)
                      "
                      @keydown="
                        handleKeyDown(
                          $event,
                          header.type,
                          h.label,
                          line,
                          line.index,
                        )
                      "
                      @focusin="
                        startEditing(
                          $event,
                          header.type,
                          h.label,
                          line,
                          `${header.type}-${h.label}-${line.index}`,
                        )
                      "
                      @focusout="
                        startEditing(
                          $event,
                          header.type,
                          h.label,
                          line,
                          `${header.type}-${h.label}-${line.index}`,
                        )
                      "
                      @change="
                        handleChangeNumber(
                          $event,
                          header.type,
                          h.label,
                          line,
                          line.index,
                          h.prop,
                        )
                      "
                    />
                    <button
                      class="u u-link btnFloat"
                      :class="
                        line?.data?.numbers?.[h.prop]?.calculation?.dependencies
                          ?.length
                          ? 'selected'
                          : ''
                      "
                      v-if="h.dropdown && h.isReadable"
                      @click="showMenuCell(header, line, h)"
                    ></button>
                    <span
                      class="symbolCurrency"
                      v-if="['price', 'budget'].includes(h.prop)"
                    >
                      {{
                        line.data?.[
                          h.prop === "price" ? "currency" : "currencyBudget"
                        ]?.code || incomesStore?.income?.currency?.default?.code
                      }}
                    </span>
                  </template>
                </template>
              </template>
            </div>
          </div>
        </div>
      </div>
    </div>
    <!-- Mensaje de Sin Resultados y botones por defecto -->
    <div
      v-if="!linesStore.lines.length && !props.loading"
      class="table__withoutReuslt"
    >
      <div class="table__withoutReuslt-container">
        <span>{{ grilla.fillerTexts.default[globalStore.lang] }}</span>
      </div>
      <div>
        <button @click="chooseTemplate()">
          <span class="u u-book"></span>
          <span>{{
            grilla.buttons.createTemplate.text[globalStore.lang]
          }}</span>
        </button>
        <button @click="linesStore.addNewLine('group')">
          <span class="u u-folder-add"></span>
          <span>{{ grilla.buttons.createGroup.text[globalStore.lang] }}</span>
        </button>
        <button @click="linesStore.addNewLine()">
          <span class="u u-new"></span>
          <span>{{ grilla.buttons.createLine.text[globalStore.lang] }}</span>
        </button>
      </div>
    </div>
    <!-- Loading -->
    <div v-if="props.loading" class="table__loading">
      <u-loading />
      <span>Cargando</span>
    </div>
  </div>
</template>

<style scoped>
/* ***** Global Styles ***** */
input {
  font-family: Nunito;
}
span {
  font-family: Nunito;
  font-size: 12px;
  line-height: 16px;
  font-weight: 600;
  color: var(--neutral-text-caption);
}

.flex {
  display: flex;
  gap: 10px;
}

input[type="text"] {
  box-sizing: border-box;
  text-align: left;
  font-family: Nunito;
  font-size: 14px;
  line-height: 18px;
  font-weight: 600;
  color: var(--neutral-text-body);
}

input[type="text"]:active,
input[type="text"]:focus {
  color: var(--neutral-text-body);
}

.table__item-col-sticky input::selection {
  background-color: var(--primary-text-subtle);
  color: var(--neutral-background-default);
}

.table__item-col-incomes input::selection {
  background-color: var(--warning-text-subtle);
  color: var(--neutral-background-default);
}
.table__item-col-budgets input::selection {
  background-color: var(--info-text-subtle);
  color: var(--neutral-background-default);
}
.table__item-col-outcomes input::selection {
  background-color: var(--danger-text-subtle);
  color: var(--neutral-background-default);
}
.table__item-col-projected input::selection {
  background-color: var(--success-text-subtle);
  color: var(--neutral-background-default);
}

/* Customs Locales */
.btnIconByCol {
  transition: 0.3s;
}

.btnIconByCol span {
  font-size: 16px;
  line-height: 24px;
  font-weight: 400;
}

.btnIcon {
  border-radius: 8px;
  width: 28px;
  height: 28px;
  border: 1px solid var(--neutral-border-default);
  display: flex;
  justify-content: center;
  align-items: center;
  align-content: center;
  background-color: var(--neutral-background-default);
  transition: border 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

.btnIconHeader:hover {
  border: 1px solid var(--primary-border-default) !important;
}

.btnIcon span {
  color: var(--neutral-text-caption);
  font-size: 20px;
  line-height: 20px;
  transition: color 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  font-weight: 400;
}

.btnIcon:hover {
  border: 1px solid var(--neutral-border-default);
}

.btnIcon:hover span {
  color: var(--primary-text-default);
}

.btnIcon:disabled {
  cursor: not-allowed;
}
.btnIcon:disabled span {
  color: var(--neutral-text-disabled);
}

.table__header-row:nth-child(1) .table__header-col-actions .btnIcon span {
  font-size: 18px;
}

.table__item-col-actions .btnIcon,
.table__header-row:nth-child(2) .table__header-col-actions .btnIcon {
  border-radius: 6px;
  width: 20px;
  height: 20px;
  border: none;
  background-color: transparent;
}

.table__header-row:nth-child(2) .table__header-col-actions {
  display: grid;
  grid-template-columns: v-bind(
    "incomesStore.hollywood ? '24px 25px 25px 25px ' : '24px 25px 25px 25px 24px'"
  );
  gap: 2px;
  justify-content: center;
  align-items: center;
  width: v-bind("incomesStore.hollywood ? '132px' : '156px'");
}

.table__item-col-sticky-name .btnIcon {
  border: none;
  position: absolute;
  width: 20px;
  background-color: transparent;
}

.table__item-col-sticky-name .btnIconSpacer {
  height: 16px;
  width: 16px;
  border-radius: 50%;
  transition: border 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  margin-top: -1px;
}

.table__item-col-sticky-name .btnIconSpacer span {
  font-size: 16px;
  color: var(--neutral-text-body);
  font-weight: 600;
}

.table__item-col-sticky-name .btnIconSpacer:hover span {
  color: var(--primary-text-default);
}

/* ***** Tabla GLobal ***** */
.table {
  overflow: auto;
  position: relative;
  border-radius: 20px;
  padding: 0 10px 250px 0;
  height: auto;
}

.table::-webkit-scrollbar {
  width: 7px;
  height: 7px;
}

.table::-webkit-scrollbar-thumb {
  border-radius: 5px;
  background-color: var(--neutral-border-default);
}

.table::-webkit-scrollbar-track {
  background-color: var(--neutral-border-darker);
  border-radius: 4px;
}

/* ***** Header ***** */
.table__header {
  height: 82px;
  display: grid;
  grid-template-rows: repeat(2, 1fr);
  position: sticky;
  top: 0px;
  z-index: 5;
}

.table__header-row:nth-child(1) {
  height: 46px;
}

.table__header-row:nth-child(2) {
  height: 36px;
}

.table__header-row {
  display: flex;
  position: relative;
  background-color: var(--neutral-background-darker);
  transition: 0.3s;
}

.table__header-row .table__header-col {
  display: flex;
  gap: 10px;
  align-items: center;
  box-sizing: border-box;
  transition: width 0.3s;
}

.table__header-row:nth-child(1) .table__header-col-actions {
  padding: 0 20px;
  box-sizing: border-box;
  border-bottom: 2px solid var(--neutral-border-subtle);
  border-top: 2px solid var(--neutral-border-subtle);
  border-left: 2px solid var(--neutral-border-subtle);
  border-radius: 20px 0 0 0;
  gap: 5px;
}

.table__header-row:nth-child(1) .table__header-col:last-child {
  border-radius: 0 20px 0 0;
  position: relative;
}

.table__header-row:nth-child(1) .table__header-col:last-child::after {
  content: "";
  width: 100%;
  height: 46px;
  position: absolute;
  left: 2px;
  z-index: -1;
}

.table__header-col-actions {
  padding: 0px 12px;
  background-color: var(--neutral-background-default);
  width: v-bind("incomesStore.hollywood ? '132px' : '156px'");
  flex-shrink: 0;
  display: flex;
  justify-content: center;
  align-items: center;
  border-bottom: 1px solid var(--neutral-border-subtle);
  border-left: 2px solid var(--neutral-border-subtle);
}

.table__header-col-sticky {
  position: v-bind("staticCol ? 'sticky' : 'relative'");
  left: 0;
  top: 0;
  width: 100%;
  max-width: calc(
    50vw - 800px - v-bind("props.fullScreen ? '80px' : '180px'") - 60px - 80px
  );
  min-width: v-bind("columnNamePx + 'px'");
  background-color: var(--neutral-background-default);
  flex-shrink: 0;
  border-right: 2px solid var(--neutral-border-subtle);
  border-left: 2px solid var(--neutral-border-subtle);
  z-index: 1;
}

.table__header-row:nth-child(1) .table__header-col-sticky {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 2px solid var(--neutral-border-subtle);
  border-top: 2px solid var(--neutral-border-subtle);
  padding: 0 20px;
  box-sizing: border-box;
}

.table__header-row:nth-child(2) .table__header-col-sticky {
  display: grid;
  grid-template-columns: v-bind(
    "props.columnCode ? '60px 85px 1fr' : '80px 1fr'"
  );
  border-bottom: 1px solid var(--neutral-border-subtle);
  gap: 0px;
}

.table__header-row:nth-child(2) .table__header-col-sticky div {
  height: 100%;
  padding: 0 12px;
  display: flex;
  align-items: center;
  box-sizing: border-box;
}

.table__header-row:nth-child(2) .table__header-col-sticky div.nameCol {
  padding: 0 16px;
}

.table__header-row:nth-child(2) .table__header-col-sticky div.codeCol,
.table__header-row:nth-child(2) .table__header-col-sticky div.codeCol {
  border-right: 1px solid var(--neutral-border-subtle);
}

.fixed {
  border: 1px solid var(--primary-border-subtle);
}

.fixed span {
  color: var(--primary-text-default);
}

/* Incomes */
.table__header-row:nth-child(1) .table__header-col-incomes {
  padding: 0 20px;
  box-sizing: border-box;
  border-bottom: 2px solid var(--neutral-border-subtle);
  background-color: var(--warning-focus-input);
  border-top: 2px solid var(--neutral-border-subtle);
}

.table__header-col-incomes {
  width: v-bind("expandCol.incomes ? stylesByType.incomes.width : '180px'");
  transition: width 0.3s;
  flex-shrink: 0;
  border-bottom: 1px solid var(--neutral-border-subtle);
  border-right: 2px solid var(--neutral-border-subtle);
}

.table__header-row:nth-child(2) .table__header-col-incomes .cell {
  background-color: var(--neutral-background-default);
}

.table__header-row:nth-child(2) .table__header-col-incomes .selectedCell {
  background-color: var(--warning-surface-shadow-8a);
}

.table__header-col-incomes-grid {
  display: grid;
  grid-template-columns: v-bind("stylesByType.incomes.grid");
  overflow: hidden;
  justify-content: flex-end;
}

.table__header-col-incomes-grid div:not(:last-child) {
  border-right: 1px solid var(--neutral-border-subtle);
}

.table__header-col-incomes-grid div,
.table__header-col-budgets-grid div,
.table__header-col-outcomes-grid div,
.table__header-col-projected-grid div {
  display: flex;
  align-items: center;
  padding: 0 12px;
}

/* Budgets */
.table__header-row:nth-child(1) .table__header-col-budgets {
  padding: 0 12px;
  box-sizing: border-box;
  border-bottom: 2px solid var(--neutral-border-subtle);
  background-color: var(--info-focus-input);
  border-right: 2px solid var(--neutral-border-subtle);
  border-top: 2px solid var(--neutral-border-subtle);
}

.table__header-col-budgets {
  width: v-bind("expandCol.budgets ? stylesByType.budgets.width : '180px'");
  transition: width 0.3s;
  flex-shrink: 0;
  border-bottom: 1px solid var(--neutral-border-subtle);
  border-right: 2px solid var(--neutral-border-subtle);
}

.table__header-col-budgets-grid {
  display: grid;
  grid-template-columns: v-bind("stylesByType.budgets.grid");
  overflow: hidden;
  justify-content: flex-end;
}

.table__header-row:nth-child(2) .table__header-col-budgets .cell {
  background-color: var(--neutral-background-default);
}

.table__header-row:nth-child(2) .table__header-col-budgets .selectedCell {
  background-color: var(--info-surface-shadow-8a);
}

.table__header-col-budgets-grid div:not(:last-child) {
  border-right: 1px solid var(--neutral-border-subtle);
}

/* Outcomes */
.table__header-row:nth-child(1) .table__header-col-outcomes {
  padding: 0 12px;
  box-sizing: border-box;
  border-bottom: 2px solid var(--neutral-border-subtle);
  background-color: var(--danger-focus-input);
  border-top: 2px solid var(--neutral-border-subtle);
}

.table__header-col-outcomes {
  width: v-bind("expandCol.outcomes ? stylesByType.outcomes.width : '180px'");
  transition: width 0.3s;
  flex-shrink: 0;
  border-bottom: 1px solid var(--neutral-border-subtle);
  border-right: 2px solid var(--neutral-border-subtle);
}

.table__header-row:nth-child(2) .table__header-col-outcomes .cell {
  background-color: var(--neutral-background-default);
}

.table__header-row:nth-child(2) .table__header-col-outcomes .selectedCell {
  background-color: var(--danger-surface-shadow-8a);
}

.table__header-col-outcomes-grid {
  display: grid;
  grid-template-columns: v-bind("stylesByType.outcomes.grid");
  overflow: hidden;
  justify-content: flex-end;
}

.table__header-col-outcomes-grid div:not(:last-child) {
  border-right: 1px solid var(--neutral-border-subtle);
}

/* Projected */
.table__header-row:nth-child(1) .table__header-col-projected {
  padding: 0 12px;
  box-sizing: border-box;
  border-bottom: 2px solid var(--neutral-border-subtle);
  background-color: var(--success-focus-input);
  border-top: 2px solid var(--neutral-border-subtle);
}

.table__header-col-projected {
  width: v-bind("expandCol.projected ? stylesByType.projected.width : '180px'");
  transition: width 0.3s;
  flex-shrink: 0;
  border-bottom: 1px solid var(--neutral-border-subtle);
  border-right: 2px solid var(--neutral-border-subtle);
}

.table__header-row:nth-child(2) .table__header-col-projected .cell {
  background-color: var(--neutral-background-default);
}

.table__header-row:nth-child(2) .table__header-col-projected .selectedCell {
  background-color: var(--success-surface-shadow-8a);
}

.table__header-col-projected-grid {
  display: grid;
  grid-template-columns: v-bind("stylesByType.projected.grid");
  overflow: hidden;
  justify-content: flex-end;
}

.table__header-col-projected-grid div:not(:last-child) {
  border-right: 1px solid var(--neutral-border-subtle);
}

/* ***** Items ***** */
.table__item {
  height: v-bind("sizeRowPx + 'px'");
  display: grid;
  grid-template-rows: 1fr;
  z-index: 0;
}

.table__item div {
  transition:
    background-color 0.3s,
    width 0.3s;
}

.table__item-line .btnByGroup {
  display: none;
}

.table__item-level-0:not(.table__item-line) .btnByLine,
.table__item-level-1:not(.table__item-line) .btnByLine,
.table__item-level-2:not(.table__item-line) .btnByLine,
.table__item-level-3:not(.table__item-line) .btnByLine,
.table__item-level-4:not(.table__item-line) .btnByLine {
  display: none;
}
.table__item-level-0:not(.table__item-line) .btnByLine,
.table__item-level-1:not(.table__item-line) .btnByLine,
.table__item-level-2:not(.table__item-line) .btnByLine,
.table__item-level-3:not(.table__item-line) .btnByLine {
  display: none;
}

.table__item-level-0:not(.table__item-line)
  .table__item-col-incomes
  input:not([name="Subtotal"]),
.table__item-level-1:not(.table__item-line)
  .table__item-col-incomes
  input:not([name="Subtotal"]),
.table__item-level-2:not(.table__item-line)
  .table__item-col-incomes
  input:not([name="Subtotal"]),
.table__item-level-3:not(.table__item-line)
  .table__item-col-incomes
  input:not([name="Subtotal"]),
.table__item-level-4:not(.table__item-line)
  .table__item-col-incomes
  input:not([name="Subtotal"]) {
  display: none;
}

.table__item-level-0:not(.table__item-line)
  .table__item-col-budgets
  input[name="Unitario"],
.table__item-level-1:not(.table__item-line)
  .table__item-col-budgets
  input[name="Unitario"],
.table__item-level-2:not(.table__item-line)
  .table__item-col-budgets
  input[name="Unitario"],
.table__item-level-3:not(.table__item-line)
  .table__item-col-budgets
  input[name="Unitario"],
.table__item-level-4:not(.table__item-line)
  .table__item-col-budgets
  input[name="Unitario"] {
  display: none;
}

.table__item-level-0:not(.table__item-line)
  .table__item-col-budgets
  input[name="QTY"],
.table__item-level-1:not(.table__item-line)
  .table__item-col-budgets
  input[name="QTY"],
.table__item-level-2:not(.table__item-line)
  .table__item-col-budgets
  input[name="QTY"],
.table__item-level-3:not(.table__item-line)
  .table__item-col-budgets
  input[name="QTY"],
.table__item-level-4:not(.table__item-line)
  .table__item-col-budgets
  input[name="QTY"] {
  display: none;
}

.table__item-level-0:not(.table__item-line)
  .table__item-col-budgets
  input[name="Unit"],
.table__item-level-1:not(.table__item-line)
  .table__item-col-budgets
  input[name="Unit"],
.table__item-level-2:not(.table__item-line)
  .table__item-col-budgets
  input[name="Unit"],
.table__item-level-3:not(.table__item-line)
  .table__item-col-budgets
  input[name="Unit"],
.table__item-level-4:not(.table__item-line)
  .table__item-col-budgets
  input[name="Unit"] {
  display: none;
}

.table__item-level-0:not(.table__item-line)
  .table__item-col-budgets
  input[name="X"],
.table__item-level-1:not(.table__item-line)
  .table__item-col-budgets
  input[name="X"],
.table__item-level-2:not(.table__item-line)
  .table__item-col-budgets
  input[name="X"],
.table__item-level-3:not(.table__item-line)
  .table__item-col-budgets
  input[name="X"],
.table__item-level-4:not(.table__item-line)
  .table__item-col-budgets
  input[name="X"] {
  display: none;
}

.table__item-level-0:not(.table__item-line)
  .table__item-col-budgets
  input[name="HE"],
.table__item-level-1:not(.table__item-line)
  .table__item-col-budgets
  input[name="HE"],
.table__item-level-2:not(.table__item-line)
  .table__item-col-budgets
  input[name="HE"],
.table__item-level-3:not(.table__item-line)
  .table__item-col-budgets
  input[name="HE"],
.table__item-level-4:not(.table__item-line)
  .table__item-col-budgets
  input[name="HE"] {
  display: none;
}

.table__item:hover div.item-cell,
.table__item:hover .btnFolder {
  /* background-color: #f1f2fd !important; consultar con Cami */
  background-color: var(--info-surface-shadow-12a) !important;
}

.table__item-level-1:not(.table__item-line) div.item-cell,
.table__item-level-1:not(.table__item-line) .btnFolder:not(.btnIconSpacer) {
  /* background-color: #cef5ed; consultar con Cami */
  background-color: var(--primary-surface-shadow-12a);
}

.table__item-level-2:not(.table__item-line) div.item-cell,
.table__item-level-2:not(.table__item-line) .btnFolder:not(.btnIconSpacer) {
  /* background-color: #dff9f3; consultar con Cami */
  background-color: var(--primary-surface-shadow-8a);
}

.table__item-level-3:not(.table__item-line) div.item-cell,
.table__item-level-3:not(.table__item-line) .btnFolder:not(.btnIconSpacer) {
  /* background-color: #dff9f3; consultar con Cami */
  background-color: var(--neutral-surface-shadow-8a);
}

.table__item-level-0.table__item-line div.item-cell,
.table__item-level-1.table__item-line div.item-cell,
.table__item-level-2.table__item-line div.item-cell,
.table__item-level-3.table__item-line div.item-cell,
.table__item-level-4.table__item-line div.item-cell {
  background-color: var(--neutral-background-default);
}

.table__item-row {
  display: flex;
  position: relative;
}

.table__item-row .table__item-col {
  display: flex;
  gap: 10px;
  align-items: center;
  box-sizing: border-box;
  transition: width 0.3s;
}

.table__item-col-actions {
  width: 156px;
  padding: 0px 12px;
  width: v-bind("incomesStore.hollywood ? '132px' : '156px'");
  flex-shrink: 0;
  display: grid;
  grid-template-columns: v-bind(
    "incomesStore.hollywood ? '24px 25px 25px 25px ' : '24px 25px 25px 25px 24px'"
  );
  justify-content: center;
  align-items: center;
  border-left: 2px solid var(--neutral-border-subtle);
  gap: 2px;
  position: relative;
}

.table__item-col-sticky {
  position: v-bind("staticCol ? 'sticky' : 'relative'");
  left: 0;
  top: 0;
  width: 100%;
  max-width: calc(
    50vw - 800px - v-bind("props.fullScreen ? '80px' : '180px'") - 60px - 80px
  );
  min-width: v-bind("columnNamePx + 'px'");
  flex-shrink: 0;
  display: grid;
  grid-template-columns: v-bind(
    "props.columnCode ? '60px 85px 1fr' : '80px 1fr'"
  );
  border-right: 2px solid var(--neutral-border-subtle);
  border-left: 2px solid var(--neutral-border-subtle);
}

.table__item-col-sticky div {
  display: flex;
  align-items: center;
}

.table__item-col-sticky div.codeCol {
  border-right: 1px solid var(--neutral-border-subtle);
  padding: 0 12px;
}

.table__item-col-sticky div.codeColInput {
  border-right: 1px solid var(--neutral-border-subtle);
}
.table__item-col-sticky div.codeColInput input {
  padding: 0 8px;
  font-weight: 300;
  color: var(--neutral-text-body) !important;
  text-align: center;
}
.table__item-col-sticky div.codeColInput input::placeholder {
  color: var(--neutral-text-body) !important;
  font-weight: 900 !important;
}

.table__item-col-sticky div.codeColInput input:focus,
.table__item-col-sticky div.codeColInput input:active {
  box-shadow: inset 0px 0px 0px 2px rgba(58, 199, 165, 1);
  background-color: var(--primary-surface-shadow-8a);
}

.table__item-level-1 .table__item-col-sticky div:nth-child(1) input,
.table__item-level-2 .table__item-col-sticky div:nth-child(1) input {
  font-weight: 700;
}

.table__item-level-3 .table__item-col-sticky div:nth-child(1) input {
  font-weight: 700;
}

.table__item-level-4 .table__item-col-sticky div:nth-child(1) input {
  font-weight: 600;
}

.table__item-col-sticky-name {
  position: relative;
}

.table__item-col-search {
  position: absolute !important;
  background-color: var(--neutral-background-default) !important;
  height: auto;
  max-height: 200px;
  margin: 5px 5px 0 5px;
  width: calc(100% - 10px);
  box-shadow: var(--shadow-4);
  border-radius: 10px;
  padding: 5px;
  box-sizing: border-box;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 10px;
  z-index: 5;
}

.table__item-col-search::-webkit-scrollbar {
  width: 0px;
  height: 0px;
}

.table__item-col-search-option {
  background-color: var(--neutral-background-default);
  padding: 0 12px;
  border-radius: 10px;
  box-sizing: border-box;
  height: 40px;
  width: 100%;
  transition: 0.3s;
  flex-shrink: 0;
  text-align: left;
  font-family: Nunito;
  font-size: 14px;
  line-height: 18px;
  font-weight: 600;
  color: var(--neutral-text-body);
}

.table__item-col-search-option:hover,
.table__item-col-search-option:focus {
  background-color: var(--primary-surface-shadow-8a);
}

.table__item-col-sticky-name .lineTab,
.table__item-col-sticky-name .lineTabTwo {
  height: calc(100% + 2px);
  border-right: 1px solid var(--primary-border-default);
  position: absolute;
  padding: 0px !important;
  top: -50%;
  width: 0px;
}

.table__item-col-sticky-name .lineTab::after {
  content: " ";
  width: 6px;
  height: 0px;
  border-bottom: 1px solid var(--primary-border-default);
  position: absolute;
  bottom: 0;
}

.table__item-level-1 .lineTab,
.table__item-level-0.table__item-line .lineTab,
.table__item-level-0 .lineTabTwo,
.table__item-level-1 .lineTabTwo,
.table__item-level-2 .lineTabTwo,
.table__item-level-3 .lineTabTwo {
  display: none;
}

.table__item-level-2 .lineTab {
  left: 16px;
}

.table__item-level-3 .lineTab {
  left: 32px;
}

.table__item-level-3 .lineTab::before,
.table__item-level-4 .lineTab::before {
  content: " ";
  width: 0px;
  height: 100%;
  border-left: 1px solid var(--primary-border-default);
  position: absolute;
  bottom: 0;
  left: -16px;
}

.table__item-level-4 .lineTabTwo {
  left: 16px;
}

.table__item-level-4 .lineTab {
  left: 48px;
}

.table__item-col-sticky input {
  height: 100%;
  width: 100%;
  flex-shrink: 0;
  caret-color: var(--primary-text-default);
  font-size: 14px;
  line-height: 14px;
  padding: 0 12px;
}

.table__item-level-1:not(.table__item-line) .table__item-col-sticky-name input {
  padding: 0 72px 0 32px;
  font-weight: 800;
}
.table__item-level-2 .table__item-col-sticky-name input {
  padding: v-bind("incomesStore.hollywood ? '0 72px 0 32px' : '0 72px 0 48px'");
  font-weight: 800;
}
.table__item-level-3:not(.table__item-line) .table__item-col-sticky-name input {
  padding: v-bind("incomesStore.hollywood ? '0 72px 0 32px' : '0 72px 0 64px'");

  font-weight: 800;
}
.table__item-level-0.table__item-line .table__item-col-sticky-name input {
  padding: v-bind("incomesStore.hollywood ? '0 42px 0 10px' : '0 60px 0 16px'");
  font-weight: 600;
}
.table__item-level-2.table__item-line .table__item-col-sticky-name input {
  padding: v-bind("incomesStore.hollywood ? '0 42px 0 10px' : '0 60px 0 32px'");
  font-weight: 600;
}
.table__item-level-3.table__item-line .table__item-col-sticky-name input {
  padding: v-bind("incomesStore.hollywood ? '0 42px 0 10px' : '0 60px 0 48px'");
  font-weight: 600;
}
.table__item-level-4.table__item-line .table__item-col-sticky-name input {
  padding: v-bind("incomesStore.hollywood ? '0 42px 0 10px' : '0 60px 0 64px'");
  font-weight: 600;
}

.table__item-col-sticky-name input:focus,
.table__item-col-sticky-name input:active {
  box-shadow: inset 0px 0px 0px 2px rgba(58, 199, 165, 1);
  /* Consultar con Cami */
  background-color: var(--primary-focus-input);
  padding: 0 20px !important;
  z-index: 2;
}

.table__item-level-1 .btnIconSpacer {
  left: 8px;
}

.table__item-level-2 .btnIconSpacer {
  left: v-bind("incomesStore.hollywood ? '8px' : '24px'");
}

.table__item-level-3 .btnIconSpacer {
  left: v-bind("incomesStore.hollywood ? '8px' : '40px'");
}

.table__item-level-4 .btnIconSpacer {
  display: none;
}

.table__item-col-sticky-name button:nth-of-type(2),
.table__item-col-sticky-name button.btnByGroup {
  right: 35px;
}

.table__item-col-sticky-name button:nth-of-type(3) {
  right: 10px;
}

.table__item-col-sticky-name button.btnByGroup {
  cursor: auto;
  width: auto;
}

.table__item-col-sticky-name button.btnByGroup span {
  font-size: 12px;
  color: var(--secondary-text-subtle);
  font-weight: 600;
}
.table__item-col-sticky-name button.btnByGroup span {
  font-size: 14px;
  line-height: 14px;
  color: var(--secondary-text-subtle);
  font-weight: 600;
}

/* Incomes */
.table__item-col-incomes {
  width: v-bind("expandCol.incomes ? stylesByType.incomes.width : '180px'");
  transition: width 0.3s;
  flex-shrink: 0;
  border-right: 2px solid var(--neutral-border-subtle);
}

.table__item-col-incomes div.cellContainer:not(:last-child) {
  border-right: 1px solid var(--neutral-border-subtle);
}

.table__item-col-incomes div.cellContainer .btnFloat,
.table__item-col-budgets div.cellContainer .btnFloat,
.table__item-col-projected div.cellContainer .btnFloat,
.table__item-col-outcomes div.cellContainer .btnFloat {
  display: none;
}

.table__item-level-0.table__item-line
  .table__item-col-incomes
  div.cellContainer.incomes-Unitario
  .symbolCurrency,
.table__item-level-0.table__item-line
  .table__item-col-budgets
  div.cellContainer.budgets-Unitario
  .symbolCurrency,
.table__item-level-1.table__item-line
  .table__item-col-incomes
  div.cellContainer.incomes-Unitario
  .symbolCurrency,
.table__item-level-1.table__item-line
  .table__item-col-budgets
  div.cellContainer.budgets-Unitario
  .symbolCurrency,
.table__item-level-2.table__item-line
  .table__item-col-incomes
  div.cellContainer.incomes-Unitario
  .symbolCurrency,
.table__item-level-2.table__item-line
  .table__item-col-budgets
  div.cellContainer.budgets-Unitario
  .symbolCurrency,
.table__item-level-3.table__item-line
  .table__item-col-incomes
  div.cellContainer.incomes-Unitario
  .symbolCurrency,
.table__item-level-3.table__item-line
  .table__item-col-budgets
  div.cellContainer.budgets-Unitario
  .symbolCurrency,
.table__item-level-4.table__item-line
  .table__item-col-incomes
  div.cellContainer.incomes-Unitario
  .symbolCurrency,
.table__item-level-4.table__item-line
  .table__item-col-budgets
  div.cellContainer.budgets-Unitario
  .symbolCurrency {
  display: flex;
}

.table__item-level-0.table__item-line
  .table__item-col-incomes
  div.cellContainer:hover
  .btnFloat,
.table__item-level-0.table__item-line
  .table__item-col-budgets
  div.cellContainer:hover
  .btnFloat,
.table__item-level-0.table__item-line
  .table__item-col-projected
  div.cellContainer:hover
  .btnFloat,
.table__item-level-0.table__item-line
  .table__item-col-outcomes
  div.cellContainer:hover
  .btnFloat,
.table__item-level-1.table__item-line
  .table__item-col-incomes
  div.cellContainer:hover
  .btnFloat,
.table__item-level-1.table__item-line
  .table__item-col-budgets
  div.cellContainer:hover
  .btnFloat,
.table__item-level-1.table__item-line
  .table__item-col-projected
  div.cellContainer:hover
  .btnFloat,
.table__item-level-1.table__item-line
  .table__item-col-outcomes
  div.cellContainer:hover
  .btnFloat,
.table__item-level-2.table__item-line
  .table__item-col-incomes
  div.cellContainer:hover
  .btnFloat,
.table__item-level-2.table__item-line
  .table__item-col-budgets
  div.cellContainer:hover
  .btnFloat,
.table__item-level-2.table__item-line
  .table__item-col-projected
  div.cellContainer:hover
  .btnFloat,
.table__item-level-2.table__item-line
  .table__item-col-outcomes
  div.cellContainer:hover
  .btnFloat,
.table__item-level-3.table__item-line
  .table__item-col-incomes
  div.cellContainer:hover
  .btnFloat,
.table__item-level-3.table__item-line
  .table__item-col-budgets
  div.cellContainer:hover
  .btnFloat,
.table__item-level-3.table__item-line
  .table__item-col-projected
  div.cellContainer:hover
  .btnFloat,
.table__item-level-3.table__item-line
  .table__item-col-outcomes
  div.cellContainer:hover
  .btnFloat,
.table__item-level-4.table__item-line
  .table__item-col-incomes
  div.cellContainer:hover
  .btnFloat,
.table__item-level-4.table__item-line
  .table__item-col-budgets
  div.cellContainer:hover
  .btnFloat,
.table__item-level-4.table__item-line
  .table__item-col-projected
  div.cellContainer:hover
  .btnFloat,
.table__item-level-4.table__item-line
  .table__item-col-outcomes
  div.cellContainer:hover
  .btnFloat {
  display: flex;
}
.table__item:not(.table__item-line)
  div.cellContainer.incomes-Unitario
  .symbolCurrency,
.table__item-col-incomes
  div.cellContainer:not(.incomes-Unitario)
  .symbolCurrency,
.table__item-col-budgets
  div.cellContainer:not(.budgets-Unitario)
  .symbolCurrency,
.table__item-col-incomes
  div.cellContainer.incomes-Unitario:hover
  .symbolCurrency,
.table__item-col-budgets
  div.cellContainer.budgets-Unitario:hover
  .symbolCurrency {
  display: none !important;
}

.table__item-col-incomes-grid {
  display: grid;
  grid-template-columns: v-bind("stylesByType.incomes.grid");
  overflow: hidden;
  justify-content: flex-end;
}

.table__item-col-incomes-grid div {
  height: 100%;
}

.table__item-col-incomes input {
  height: 100%;
  padding: 0 12px;
  box-sizing: border-box;
  width: 100%;
  text-align: right;
}

.table__item-level-1:not(.table__item-line) .table__item-col-incomes input {
  font-weight: 800;
}

.table__item-level-2:not(.table__item-line) .table__item-col-incomes input {
  font-weight: 700;
}

.table__item-level-3:not(.table__item-line) .table__item-col-incomes input {
  font-weight: 700;
}

.table__item-level-1.table__item-line .table__item-col-incomes input,
.table__item-level-2.table__item-line .table__item-col-incomes input,
.table__item-level-3.table__item-line .table__item-col-incomes input,
.table__item-level-4.table__item-line .table__item-col-incomes input {
  font-weight: 600;
}

.table__item-col-incomes div:nth-child(1) input {
  width: calc(100% - 1px);
  margin-left: 2px;
}

.table__item-col-incomes div:last-child:not(:nth-child(1)) input {
  width: v-bind("expandCol.incomes ? '180px' : 'calc(180px - 1px)'");
  margin-left: v-bind("expandCol.incomes ? '0px' : '2px'");
}

.table__item-col-incomes input:not(:read-only).focusInput,
.table__item-col-incomes input:not(:disabled).focusInput,
.table__item-col-incomes input:not(:read-only):focus,
.table__item-col-incomes input:not(:disabled):focus,
.table__item-col-incomes input:not(:read-only):active,
.table__item-col-incomes input:not(:disabled):active {
  box-shadow: inset 0px 0px 0px 2px rgba(255, 161, 32, 1);
  background-color: var(--warning-surface-shadow-8a);
}

.table__item-col-incomes-grid div,
.table__item-col-budgets-grid div,
.table__item-col-outcomes-grid div,
.table__item-col-projected-grid div {
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Budgets */
.table__item-col-budgets {
  width: v-bind("expandCol.budgets ? stylesByType.budgets.width : '180px'");
  transition: width 0.3s;
  flex-shrink: 0;
  border-right: 2px solid var(--neutral-border-subtle);
}

.table__item-col-budgets div.cellContainer:not(:last-child) {
  border-right: 1px solid var(--neutral-border-subtle);
}

.table__item-col-budgets-grid {
  display: grid;
  grid-template-columns: v-bind("stylesByType.budgets.grid");
  overflow: hidden;
  justify-content: flex-end;
}

.table__item-col-budgets-grid div {
  height: 100%;
}

.table__item-col-budgets input {
  height: 100%;
  padding: 0 12px;
  box-sizing: border-box;
  width: 100%;
  text-align: right;
}

.table__item-level-1:not(.table__item-line) .table__item-col-budgets input {
  font-weight: 800;
}

.table__item-level-2:not(.table__item-line) .table__item-col-budgets input {
  font-weight: 700;
}

.table__item-level-3:not(.table__item-line) .table__item-col-budgets input {
  font-weight: 700;
}

.table__item-level-1.table__item-line .table__item-col-budgets input,
.table__item-level-2.table__item-line .table__item-col-budgets input,
.table__item-level-3.table__item-line .table__item-col-budgets input,
.table__item-level-4.table__item-line .table__item-col-budgets input {
  font-weight: 600;
}

.table__item-col-budgets div:nth-child(1) input {
  width: calc(100% - 1px);
  margin-left: 2px;
}

.table__item-col-budgets div:last-child:not(:nth-child(1)) input {
  width: v-bind("expandCol.budgets ? '180px' : 'calc(180px - 1px)'");
  margin-left: v-bind("expandCol.budgets ? '0px' : '2px'");
}

.table__item-col-budgets input:not(:read-only).focusInput,
.table__item-col-budgets input:not(:disabled).focusInput,
.table__item-col-budgets input:not(:read-only):focus,
.table__item-col-budgets input:not(:disabled):focus,
.table__item-col-budgets input:not(:read-only):active,
.table__item-col-budgets input:not(:disabled):active {
  box-shadow: inset 0px 0px 0px 2px rgba(32, 161, 255, 1);
  background-color: var(--info-surface-shadow-8a);
}

/* Outcomes */
.table__item-col-outcomes {
  width: v-bind("expandCol.outcomes ? stylesByType.outcomes.width : '180px'");
  transition: width 0.3s;
  flex-shrink: 0;
  border-right: 2px solid var(--neutral-border-subtle);
}

.table__item-col-outcomes div:not(:last-child) {
  border-right: 1px solid var(--neutral-border-subtle);
}

.table__item-col-outcomes-grid {
  display: grid;
  grid-template-columns: v-bind("stylesByType.outcomes.grid");
  overflow: hidden;
  justify-content: flex-end;
}

.table__item-col-outcomes-grid div {
  height: 100%;
}

.table__item-col-outcomes input {
  height: 100%;
  padding: 0 12px;
  box-sizing: border-box;
  width: 100%;
  text-align: right;
}

.table__item-col-incomes input:read-only,
.table__item-col-incomes input:disabled,
.table__item-col-budgets input:read-only,
.table__item-col-budgets input:disabled,
.table__item-col-projected input:read-only,
.table__item-col-projected input:disabled,
.table__item-col-outcomes input:read-only,
.table__item-col-outcomes input:disabled {
  color: var(--neutral-text-caption) !important;
  cursor: not-allowed !important;
}

.table__item-level-1:not(.table__item-line) .table__item-col-outcomes input {
  font-weight: 800;
}

.table__item-level-2:not(.table__item-line) .table__item-col-outcomes input {
  font-weight: 700;
}

.table__item-level-3:not(.table__item-line) .table__item-col-outcomes input {
  font-weight: 700;
}

.table__item-level-1.table__item-line .table__item-col-outcomes input,
.table__item-level-2.table__item-line .table__item-col-outcomes input,
.table__item-level-3.table__item-line .table__item-col-outcomes input,
.table__item-level-4.table__item-line .table__item-col-outcomes input {
  font-weight: 600;
}

.table__item-col-outcomes div:nth-child(1) input {
  width: calc(100% - 1px);
  margin-left: 2px;
}

.table__item-col-outcomes div:last-child:not(:nth-child(1)) input {
  width: v-bind("expandCol.outcomes ? '180px' : 'calc(180px - 1px)'");
  margin-left: v-bind("expandCol.outcomes ? '0px' : '2px'");
}

.table__item-col-outcomes input:not(:read-only).focusInput,
.table__item-col-outcomes input:not(:disabled).focusInput,
.table__item-col-outcomes input:not(:read-only):focus,
.table__item-col-outcomes input:not(:disabled):focus,
.table__item-col-outcomes input:not(:read-only):active,
.table__item-col-outcomes input:not(:disabled):active {
  box-shadow: inset 0px 0px 0px 2px rgba(244, 121, 117, 1);
  background-color: var(--danger-surface-shadow-8a);
}

/* Projected */
.table__item-col-projected {
  width: v-bind("expandCol.projected ? stylesByType.projected.width : '180px'");
  transition: width 0.3s;
  flex-shrink: 0;
  border-right: 2px solid var(--neutral-border-subtle);
}

.table__item:not(:first-child) .table__item-col-actions,
.table__item:not(:first-child) .table__item-col-sticky,
.table__item:not(:first-child) .table__item-col-incomes,
.table__item:not(:first-child) .table__item-col-budgets,
.table__item:not(:first-child) .table__item-col-outcomes,
.table__item:not(:first-child) .table__item-col-projected {
  border-top: 1px solid var(--neutral-border-subtle);
}

.table__item:last-child .table__item-col-actions,
.table__item:last-child .table__item-col-sticky,
.table__item:last-child .table__item-col-incomes,
.table__item:last-child .table__item-col-budgets,
.table__item:last-child .table__item-col-outcomes,
.table__item:last-child .table__item-col-projected {
  border-bottom: 2px solid var(--neutral-border-subtle);
}

.table__item-col-projected div:not(:last-child) {
  border-right: 1px solid var(--neutral-border-subtle);
}

.table__item-col-projected-grid {
  display: grid;
  grid-template-columns: v-bind("stylesByType.projected.grid");
  overflow: hidden;
  justify-content: flex-end;
}

.table__item-col-projected-grid div {
  height: 100%;
}

.table__item-col-projected input {
  height: 100%;
  padding: 0 12px;
  box-sizing: border-box;
  width: 100%;
  text-align: right;
}

.table__item-level-1:not(.table__item-line) .table__item-col-projected input {
  font-weight: 800;
}

.table__item-level-2:not(.table__item-line) .table__item-col-projected input {
  font-weight: 700;
}

.table__item-level-3:not(.table__item-line) .table__item-col-projected input {
  font-weight: 700;
}

.table__item-level-1.table__item-line .table__item-col-projected input,
.table__item-level-2.table__item-line .table__item-col-projected input,
.table__item-level-3.table__item-line .table__item-col-projected input,
.table__item-level-4.table__item-line .table__item-col-projected input {
  font-weight: 600;
}

.table__item-col-projected div:nth-child(1) input {
  width: calc(100% - 1px);
  margin-left: 2px;
}

.table__item-col-projected div:last-child:not(:nth-child(1)) input {
  width: v-bind("expandCol.projected ? '180px' : 'calc(180px - 1px)'");
  margin-left: v-bind("expandCol.projected ? '0px' : '2px'");
}

.table__item-col-projected input:not(:read-only).focusInput,
.table__item-col-projected input:not(:disabled).focusInput,
.table__item-col-projected input:not(:read-only):focus,
.table__item-col-projected input:not(:disabled):focus,
.table__item-col-projected input:not(:read-only):active,
.table__item-col-projected input:not(:disabled):active {
  box-shadow: inset 0px 0px 0px 2px rgba(78, 194, 117, 1);
  background-color: var(--success-surface-shadow-8a);
}

/* ***** Loading ***** */
.table__loading {
  width: v-bind(
    "props.fullScreen ? 'calc(100vw - 40px)' : 'calc(100vw - 140px)'"
  );
  height: 100px;
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;
  gap: 10px;
}

.table__loading span {
  color: var(--neutral-text-caption);
  font-weight: 600;
  font-size: 16px;
}

/* ***** Without Reuslt ***** */
.table__withoutReuslt {
  height: 280px;
  display: flex;
  flex-direction: column;
  gap: 20px;
  align-items: center;
  padding-top: 50px;
  text-align: center;
}

.table__withoutReuslt div:nth-child(1) span {
  font-size: 16px;
  line-height: 20px;
  font-weight: 600;
}

.table__withoutReuslt div:nth-child(2) {
  display: flex;
  gap: 10px;
  height: 100px;
}

.table__withoutReuslt div:nth-child(2) button {
  width: 150px;
  height: 100%;
  background-color: var(--neutral-surface-light);
  border-radius: 16px;
  display: grid;
  place-content: center;
  gap: 10px;
  box-shadow: var(--elevation-xs);
  transform: scale(0.9);
  transition: 0.3s;
}

.table__withoutReuslt div:nth-child(2) button:hover {
  transform: scale(1);
  box-shadow: var(--shadow-2);
}

.table__withoutReuslt div:nth-child(2) button:hover span {
  color: var(--primary-text-subtle);
}

.table__withoutReuslt div:nth-child(2) button span:nth-child(1) {
  font-size: 40px;
  line-height: 40px;
  font-weight: 400;
}

.table__withoutReuslt div:nth-child(2) button span:nth-child(2) {
  font-size: 16px;
}
.table__header-col-actions {
  position: relative;
}
.subActionsMain {
  background-color: var(--white) !important;
  position: absolute;
  z-index: 3;
  padding: 8px;
  border-radius: 10px;
  display: flex;
  flex-direction: column;
  gap: 5px;
  box-shadow: var(--shadow-3);
  transform-origin: left;
  transform: scale(0);
  transition: 0.3s;
}
.subActionsMain {
  bottom: -35px;
}
.subActionsMain:nth-of-type(1) {
  right: -105px;
}
.subActionsMain:nth-of-type(2) {
  right: -130px;
}
.subActionsMain .btnIcon {
  display: flex;
  justify-content: flex-start;
  background-color: var(--white) !important;
  gap: 8px;
  padding: 15px 8px !important;
  transition: 0.3s;
}
.subActionsMain .btnIcon {
  width: 150px !important;
}
.subActionsMain .btnIcon:hover {
  background-color: var(--primary-surface-shadow-8a) !important;
}
.subActionsMain .btnIcon span:nth-child(2) {
  font-size: 12px;
  font-weight: 600;
}

.notData {
  width: 100%;
  height: 40px;
  display: flex;
  justify-content: center;
  align-items: center;
}

.notData span {
  color: var(--neutral-text-caption);
  text-align: center;
}

.msgSearch {
  padding: 10px 0;
}
.tagGrid {
  display: flex;
  justify-content: center;
  align-items: center;
  flex-shrink: 0;
  width: 100%;
  height: 100%;
}
.tagGrid span {
  border-radius: 20px;
  padding: 5px 10px;
  color: var(--neutral-text-body);
  font-size: 10px;
  line-height: 10px;
  font-weight: 600;
}

.cellContainer {
  position: relative;
}
.cellContainer .btnFloat {
  position: absolute;
  left: 10px;
  color: var(--neutral-text-caption);
  font-size: 12px;
}
.cellContainer .symbolCurrency {
  position: absolute;
  left: 10px;
  font-weight: 400;
  font-style: Regular;
  font-size: 14px;
  line-height: 14px;
  letter-spacing: 10%;
  vertical-align: middle;
  text-transform: uppercase;
  color: var(--neutral-text-caption);
}
.cellContainer .btnFloat.selected,
.cellContainer .btnFloat:hover {
  color: var(--primary-text-default);
}
.cellContainer .btnFloat.selected {
  font-weight: 600;
}
.table__item-level-1:not(.table__item-line) .btnFloat,
.table__item-level-2:not(.table__item-line) .btnFloat,
.table__item-level-3:not(.table__item-line) .btnFloat {
  display: none;
}

@media only screen and (max-width: 625px) {
  .table__withoutReuslt {
    height: calc(100% - 96px);
  }

  .table__withoutReuslt div:nth-child(2) {
    flex-direction: column;
    height: auto;
    width: auto;
  }

  .table__withoutReuslt div:nth-child(2) button {
    padding: 0 40px;
    width: auto;
    height: 80px;
    grid-template-columns: 40px 1fr;
    gap: 10px;
  }

  .table__withoutReuslt div:nth-child(2) button span:nth-child(1) {
    font-size: 30px;
    line-height: 30px;
  }

  .table__withoutReuslt div:nth-child(2) button span:nth-child(2) {
    font-size: 20px;
    line-height: 30px;
  }
}

@media only screen and (max-width: 940px) {
  .table__item-col-sticky,
  .table__header-col-sticky {
    position: relative;
  }

  .btnIconFixColumn {
    display: none;
  }
}

input.disable_ {
  opacity: 0;
}
</style>
