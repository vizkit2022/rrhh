<script setup>
import { ref, computed } from "vue";
import configTable from "@/utils/configTables/incomesConfiguration.json";
import useIncomesStore from "@/stores/incomes";
import useGlobalStore from "@/stores/global";
import { debounce } from "@/utils/helpers";

//STORE
const incomesStore = useIncomesStore();
const globalStore = useGlobalStore();

//CONSTANTES

// grupo actual
const currentGroup = ref(0);

// lista temporal de variables
const temporalGlobals = ref([]);

// Flag para evitar creación duplicada
const isCreatingTemporal = ref(false);

// edit group globals
const groupId = ref("");
const groupName = ref("");
const showModalEditTab = ref(false);

// eliminar group globals
const showModalDeleteTab = ref(false);

// agregar group globals
const showModalAddTab = ref(false);

// lista de abreviaciones
const arrayAbbreviationStyle = ref([]);

// referencia del contenedor de cálculo de variables
const calcContainer = ref(null);

// opciones de unidades
const optionsSelectUnit = ref([{ value: 0, label: "Sin unidad" }]);

const optionSelectType = ref([
  { label: "Constante", value: "constant" },
  { label: "Variable", value: "variable" },
]);

// error campos temporal globals
const errorTemporalGlobals = ref(false);

// COMPUTADAS

// Computed que crea un objeto { abreviación: { id, valorNumérico } }
const variablesMap = computed(() => {
  const mapa = {};

  incomesStore.configuration.globals.globalsByGroup.forEach((item) => {
    if (item.abbreviation) {
      const valorNum = item.value;
      if (!isNaN(valorNum)) {
        mapa[item.abbreviation] = {
          value: valorNum,
          id: item._id,
          type: item.type,
        };
      }
    }
  });
  return mapa;
});

//FUNCIONES

// Funcion para cambiar el estilo de la abreviación en el campo de cálculo
function getStyledCalculation(item, mapa) {
  const expression = item.calculation.displayFormula;
  if (!expression) return "<span class='abbr-style-empty'>-</span>";

  const tokens = expression.split(/(\s+|[+*/()-])/).filter((t) => t !== "");
  return tokens
    .map((token) => {
      if (mapa[token]) {
        if (mapa[token].type === "constant") {
          return `<span class="abbr-style">${token}</span>`;
        } else {
          return token;
        }
      } else if (["+", "-", "*", "/", "(", ")", "^", "%"].includes(token)) {
        // Agregar espacios alrededor de operadores
        return ` ${token} `;
      } else {
        return token;
      }
    })
    .join("")
    .replace(/\s+/g, " ")
    .trim();
}

//FUNCIONES PARA GRUPOS GLOBALES

// Función para agregar un nuevo grupo
async function addNewGroup(newName) {
  const body = {
    name: newName,
    income: incomesStore.income?._id,
  };

  try {
    globalStore.loading = true;
    await incomesStore.createGroupGlobals(body);
    await incomesStore.getGroupGlobals(incomesStore.income?._id);
    currentGroup.value = incomesStore.configuration.globals.groups.length - 1;
    await incomesStore.getGlobalByGroup(
      incomesStore.configuration.globals.groups[currentGroup.value]?._id
    );
  } catch (e) {
    console.error("Error al agregar nuevo grupo de globals:", e);
  } finally {
    globalStore.loading = false;
  }
}

// Funcion para cambiar de grupo
async function changeGroup(index) {
  if (index === currentGroup.value) return;

  temporalGlobals.value = [];
  currentGroup.value = index;

  try {
    globalStore.loading = true;
    await incomesStore.getGlobalByGroup(
      incomesStore.configuration.globals.groups[index]?._id,
      true
    );

    // Cargar todas las variables globales para checkear las abreviaciones repetidas
    await incomesStore.getGlobalbyIncome(incomesStore.income?._id);
  } catch (e) {
    console.error("Error al cargar variables globales:", e);
  } finally {
    globalStore.loading = false;
  }
}

// Función para editar un grupo
async function editGroup(newName) {
  const body = {
    _id: groupId.value,
    name: newName,
  };

  try {
    globalStore.loading = true;
    await incomesStore.updateGroupGlobals(body);
    await incomesStore.getGroupGlobals(incomesStore.income?._id);
  } catch (e) {
    console.error("Error al editar el grupo de variables:", e);
  } finally {
    globalStore.loading = false;
  }
}

// Función para eliminar un grupo
async function deleteGroup() {
  try {
    globalStore.loading = true;
    await incomesStore.deleteGroupGlobals(groupId.value);
    await incomesStore.getGroupGlobals(incomesStore.income?._id);
    currentGroup.value = 0;
    if (incomesStore.configuration.globals.groups.length > 0) {
      await incomesStore.getGlobalByGroup(
        incomesStore.configuration.globals.groups[currentGroup.value]?._id
      );
    }
        await incomesStore.getGlobalbyIncome(incomesStore.income?._id);
  } catch (e) {
    console.error("Error al eliminar el grupo de variables:", e);
  } finally {
    globalStore.loading = false;
  }
}

//FUNCIONES PARA VARIABLES GLOBALS

// Función para agregar un nuevo global
async function addContentGlobals() {
  const idIncome = incomesStore.income?._id;
  const idGroup =
    incomesStore.configuration?.globals?.groups[currentGroup.value]?._id;

  // AGREGAR UN NUEVO GLOBAL Y CREARLO TEMPORALMENTE
  if (temporalGlobals.value.length === 0) {
    temporalGlobals.value.push({
      _id: "TEMPORAL_ID",
      error: {
        name: false,
        abbreviation: { isEmpty: false, isRepeated: false },
        calculation: false,
      },
      isTemporal: true,
      disabledInput: {
        abbreviation: false,
      },
      name: "",
      groupVariable: idGroup,
      abbreviation: "",
      calculation: {
        displayFormula: "",
        formula: "",
        dependencies: [],
      },
      type: "constant",
      typeName: {
        es: "Constante",
        en: "Constant",
      },
      value: 0,
      used: 0,
      income: idIncome,
      unit: { name: "Sin unidad" },
    });
    incomesStore.configuration.globals.globalsByGroup.push(
      ...temporalGlobals.value
    );

    // focus al campo temporal cuando se agrega igual cuando ya hay un temporal
    await nextTick();
    document.getElementById("TEMPORAL_ID").focus();
  } else if (temporalGlobals.value.length === 1) {
    const item = temporalGlobals.value[0];
    const errors = item.error;

    // Validar campo name
    errors.name = !item.name?.trim();

    // Validar abreviación
    errors.abbreviation.isEmpty = !item.abbreviation?.trim();
    errors.abbreviation.isRepeated =
      false || item.error.abbreviation.isRepeated;

    // Validar cálculo
    const calcEmpty =
      !item.calculation?.displayFormula?.trim() &&
      !item.calculation?.formula?.trim();
    errors.calculation = calcEmpty;
  }
}

// Flag para evitar creación duplicada
// const isCreatingTemporal = ref(false);

// función para verificar completion cuando cambia un campo temporal
function checkTemporalCompletion(item) {
  // Si ya está en proceso de creación, no hacer nada
  if (isCreatingTemporal.value || temporalGlobals.value.length === 0) {
    return;
  }

  const isComplete =
    item.name &&
    item.name.trim() !== "" &&
    item.abbreviation &&
    item.abbreviation.trim() !== "" &&
    item.error.abbreviation.isRepeated === false &&
    item.calculation.displayFormula &&
    item.calculation.displayFormula.trim() !== "";

  if (isComplete) {
    isCreatingTemporal.value = true;
    nextTick(() => {
      createTemporalGlobal();
    });
  }
}

// función para validar si la variable temporal está completa
function isTemporalGlobalComplete(temporalGlobal) {
  return (
    temporalGlobal.name &&
    temporalGlobal.name.trim() !== "" &&
    temporalGlobal.abbreviation &&
    temporalGlobal.abbreviation.trim() !== "" &&
    temporalGlobal.calculation.displayFormula &&
    temporalGlobal.calculation.displayFormula.trim() !== "" &&
    temporalGlobal.calculation.formula &&
    temporalGlobal.calculation.formula.trim() !== "" &&
    temporalGlobal.calculation.dependencies !== undefined &&
    temporalGlobal.calculation.dependencies !== null
  );
}

// Funcion para crear un global temporal
async function createTemporalGlobal() {
  if (temporalGlobals.value.length === 0 || isCreatingTemporal.value === false)
    return;

  const temporalGlobal = temporalGlobals.value[0];

  if (!isTemporalGlobalComplete(temporalGlobal)) {
    isCreatingTemporal.value = false;
    return;
  }

  const idIncome = incomesStore.income?._id;
  const idGroup =
    incomesStore.configuration?.globals?.groups[currentGroup.value]?._id;

  const body = {
    name: temporalGlobal.name,
    groupVariable: idGroup,
    abbreviation: temporalGlobal.abbreviation,
    calculation: {
      displayFormula: temporalGlobal.calculation.displayFormula,
      formula: temporalGlobal.calculation.formula,
      dependencies: temporalGlobal.calculation.dependencies || [],
    },
    value: temporalGlobal.value || 0,
    income: idIncome,
    type: temporalGlobal.type,
    ...(temporalGlobal.unit !== null &&
    typeof temporalGlobal.unit?.name === "string" &&
    temporalGlobal.unit.name !== "Sin unidad"
      ? { unit: temporalGlobal.unit._id }
      : { unit: "" }),
  };

  try {
    globalStore.loading = true;
    await incomesStore.createGlobal(body);

    // Limpiar la variable temporal
    temporalGlobals.value = [];

    // Recargar las variables del grupo
    await incomesStore.getGlobalByGroup(idGroup);
    // Cargar todas las variables globales para checkear las abreviaciones repetidas
    await incomesStore.getGlobalbyIncome(incomesStore.income?._id);
  } catch (e) {
    console.error("Error al crear variable temporal:", e);
  } finally {
    globalStore.loading = false;
    isCreatingTemporal.value = false;
  }
}

// Funcion para eliminar un global temporal
function deleteTemporalGlobal() {
  if (temporalGlobals.value.length == 0) return;
  incomesStore.configuration.globals.globalsByGroup.pop();
  temporalGlobals.value = [];
  isCreatingTemporal.value = false;
}

// Función para eliminar un global original
async function deleteGlobalById(id, item) {
  if (item?.isTemporal === true) {
    deleteTemporalGlobal();
    return;
  }

  try {
    globalStore.loading = true;
    await incomesStore.deleteGlobal(id);
    await incomesStore.getGlobalByGroup(
      incomesStore.configuration.globals.groups[currentGroup.value]?._id
    );

    incomesStore.configuration.globals.globalsByGroup.push(
      ...temporalGlobals.value
    );

    await incomesStore.getGlobalbyIncome(incomesStore.income?._id);
    
  } catch (e) {
    console.error("Error al eliminar contenido por orden:", e);
  } finally {
    globalStore.loading = false;
  }
}

// Función para manejar el input de la expresión
function filterCalculationInput(event, item) {
  // Convertimos todo a mayúsculas
  let value = event.target.value.toUpperCase();

  // Permitir caracteres matemáticos básicos
  if (item.type === "constant") {
    value = value.replace(/[^0-9+\-*/().\s^%√πe]/g, "");
  } else if (item.type === "variable") {
    // Permitir caracteres matemáticos básicos, letras, números, operadores especiales
    value = value.replace(/[^A-Za-z0-9+\-*/\s.()%^√πe]/g, "");
  }

  // Limitar operadores consecutivos a máximo 2
  value = value.replace(/([+\-*/^%]){3,}/g, "$1$1");

  // Actualizar el valor del input
  event.target.value = value;
  item.calculation.displayFormula = value;

  // Actualizar value
  calculationValueLocal(item, value);
}

// Función directa para verificar abreviación (sin debounce) en el @change
async function checkAbreviationDirect(value, idIncome, item) {
  try {
    const resp = await incomesStore.checkAbreviation(value, idIncome);

    if (resp.message == "La abreviación de global es válido") {
      item.error.abbreviation.isRepeated = false;
      return false;
    } else {
      item.error.abbreviation.isRepeated = true;
      return true;
    }
  } catch (e) {
    console.error("Error al verificar abreviación:", e);
    item.error.abbreviation.isRepeated = true;
    return true;
  }
}

// Función con debounce para el @input
const checkAbreviation = debounce(async (value, idIncome, item) => {
  try {
    item.disabledInput.abbreviation = true;
    const resp = await incomesStore.checkAbreviation(value, idIncome);

    console.log("error", resp?.error);

    if (resp.message == "La abreviación de global es válido") {
      item.error.abbreviation.isRepeated = false;
      return false;
    } else {
      item.error.abbreviation.isRepeated = true;
      return true;
    }
  } catch (e) {
    console.error("Error al verificar abreviación:", e);
    item.error.abbreviation.isRepeated = true;
    return true;
  } finally {
    item.disabledInput.abbreviation = false;
  }
}, 1000);

function checkAbreviationLocal(value, idIncome, item) {
  const arrayGlobalAbbreviation =
    incomesStore.configuration.globals.globalsByIncomes.map(
      (global) => global.abbreviation
    );

  // Copie el item que no se modifico globalmente para verificar la abreviación si no se ha modificado
  const oldItem = incomesStore.configuration.globals.globalsByIncomes.find(
    (global) => global._id === item._id
  );

  if (
    arrayGlobalAbbreviation.includes(value) &&
    oldItem?.abbreviation !== value
  ) {
    item.error.abbreviation.isRepeated = true;
    return true;
  } else {
    item.error.abbreviation.isRepeated = false;
    return false;
  }
}

// Función  para manejar el input de abreviación
function onAbbreviationInput(item, event) {
  item.error.abbreviation.isEmpty = false;
  item.error.abbreviation.isRepeated = false;

  // Convertimos siempre a mayúsculas y filtramos caracteres
  let value = event.target.value
    .toUpperCase()
    .replace(/[^A-Z]/g, "")
    .slice(0, 8);

  // Actualizar el valor inmediatamente
  item.abbreviation = value;
  event.target.value = value;

  const idIncome = incomesStore.income?._id;

  // Solo hacer el check si hay valor y idIncome
  if (value && idIncome) {
    // checkAbreviation(value, idIncome, item);
    checkAbreviationLocal(value, idIncome, item);
  }
}

// Función auxiliar para validación y corrección automática de fórmulas
function validateFormula(processedFormula) {
  // Validar caracteres permitidos
  const mathRegex = /^[0-9+\-*/().\s%^√πeA-Za-z_]*$/;
  if (!mathRegex.test(processedFormula)) {
    throw new Error("Fórmula incorrecta, caracteres no permitidos");
  }

  let correctedFormula = processedFormula;

  // Verificar si hay 3 o más operadores consecutivos (ERROR)
  if (/[+\-*/^%]{3,}/.test(correctedFormula)) {
    throw new Error("Más de 2 operadores consecutivos no permitidos");
  }

  // Corregir operadores duplicados (solo 2)
  correctedFormula = correctedFormula
    .replace(/\+{2}/g, "+") // ++ -> +
    .replace(/\-{2}/g, "-") // -- -> -
    .replace(/\/{2}/g, "/") // // -> /
    .replace(/\^{2}/g, "^") // ^^ -> ^
    .replace(/%{2}/g, "%"); // %% -> %

  // Paréntesis de apertura sin cierre - remover paréntesis huérfanos
  let openCount = 0;
  let closeCount = 0;

  // Contar paréntesis
  for (let char of correctedFormula) {
    if (char === "(") openCount++;
    if (char === ")") closeCount++;
  }

  // Si hay paréntesis de cierre sin apertura -> ERROR
  if (closeCount > openCount) {
    throw new Error("Paréntesis de cierre sin apertura correspondiente");
  }

  // Si hay paréntesis de apertura sin cierre -> remover los sobrantes
  if (openCount > closeCount) {
    let excessOpen = openCount - closeCount;
    // Remover paréntesis de apertura sobrantes desde el final
    for (let i = correctedFormula.length - 1; i >= 0 && excessOpen > 0; i--) {
      if (correctedFormula[i] === "(") {
        correctedFormula =
          correctedFormula.slice(0, i) + correctedFormula.slice(i + 1);
        excessOpen--;
      }
    }
  }

  // Paréntesis vacíos - remover ()
  correctedFormula = correctedFormula.replace(/\(\s*\)/g, "");

  // Operadores al inicio (excepto -)
  correctedFormula = correctedFormula.replace(/^[\s]*[+/*^%]+/, "");

  // Operadores al final
  correctedFormula = correctedFormula.replace(/[+\-/*^%]+[\s]*$/, "");

  correctedFormula = correctedFormula.trim();

  if (!correctedFormula) {
    throw new Error(
      "La fórmula resultante está vacía después de las correcciones"
    );
  }

  return correctedFormula;
}

// Función para manejar el calculo de la expresion local
function calculationValueLocal(item, expression) {
  if (!item) return;

  if (!expression || expression.trim() === "") {
    item.calculation.formula = "";
    item.value = 0;
    return;
  }

  try {
    let validatedExpression = validateFormula(expression);

    // 1) Parto de la expresión validada y corregida
    let expr = validatedExpression;
    let exprGlobalsId = validatedExpression;
    let arraysIdsGlobals = [];

    // 2) Reemplazo cada abreviación por su valor numérico en variablesMap
    const mapa = variablesMap.value;

    expr = expr.replace(/\b([A-Za-z][A-Za-z0-9_]*)\b/g, (match) => {
      if (mapa.hasOwnProperty(match)) {
        if (mapa[match].type === "constant") {
          return mapa[match].value;
        } else {
          return "Error";
        }
      } else {
        return "Error";
      }
    });

    // Reemplazo cada abreviación por su id en variablesMap
    exprGlobalsId = exprGlobalsId.replace(
      /\b([A-Za-z][A-Za-z0-9_]*)\b/g,
      (match) => {
        if (mapa.hasOwnProperty(match)) {
          if (mapa[match].type === "constant") {
            arraysIdsGlobals.push(mapa[match].id);
            return mapa[match].id;
          }
        } else {
          return "Error";
        }
      }
    );

    // Validar la expresión final antes de evaluarla
    try {
      validateFormula(expr);
    } catch (finalValidationError) {
      item.value = "Error";
      return;
    }

    let jsExpression = expr
      .replace(/\^/g, "**") // Potencia
      .replace(/√/g, "Math.sqrt") // Raíz cuadrada
      .replace(/π/g, "Math.PI") // Pi
      .replace(/e/g, "Math.E"); // Euler

    const result = Function(`"use strict"; return (${jsExpression})`)();

    if (isNaN(result) || !isFinite(result)) {
      item.value = "Error";
      return;
    }

    // 4) Redondear el resultado a un número entero
    const resultRounded = Math.round(result);
    item.value = resultRounded;
  } catch (error) {
    console.error("Error al calcular la expresión:", error);
    item.value = "Error";
  }
}

// Función para manejar el calculo de la expresion en el servidor
async function calculationValue(item, expression) {
  if (!item) return;

  if (!expression || expression.trim() === "") {
    item.calculation.formula = "";
    item.value = 0;
    return;
  }

  try {
    if (!item.isTemporal) {
      globalStore.loading = true;
    }

    // validar y corregir la fórmula original
    let validatedExpression;
    try {
      validatedExpression = validateFormula(expression);
    } catch (validationError) {
      console.error("Error de validación:", validationError.message);
      item.value = "Error";

      // Opcional pensando en enviar un toast, notification, etc.
      return;
    }

    // Si la expresión fue corregida, actualizar el displayFormula
    if (validatedExpression !== expression) {
      item.calculation.displayFormula = validatedExpression;
    }

    // 1) Parto de la expresión validada y corregida
    let expr = validatedExpression;
    let exprGlobalsId = validatedExpression;
    let arraysIdsGlobals = [];

    arrayAbbreviationStyle.value = changeStyleAbbreviation(expr, item);

    // 2) Reemplazo cada abreviación por su valor numérico en variablesMap
    const mapa = variablesMap.value;

    // Reemplazo cada abreviación por su valor numérico en variablesMap
    expr = expr.replace(/\b([A-Za-z][A-Za-z0-9_]*)\b/g, (match) => {
      if (mapa.hasOwnProperty(match)) {
        if (mapa[match].type === "constant") {
          return mapa[match].value;
        } else {
          return "Error";
        }
      } else {
        // console.warn(`La abreviación '${match}' no existe en variablesMap.`);
        return "Error";
      }
    });

    // Reemplazo cada abreviación por su id en variablesMap
    exprGlobalsId = exprGlobalsId.replace(
      /\b([A-Za-z][A-Za-z0-9_]*)\b/g,
      (match) => {
        if (mapa.hasOwnProperty(match)) {
          if (mapa[match].type === "constant") {
            arraysIdsGlobals.push(mapa[match].id);
            return mapa[match].id;
          } else {
            return "Error";
          }
        } else {
          // console.warn(`La abreviación '${match}' no existe en variablesMap.`);
          return "Erro";
        }
      }
    );

    // Validar la expresión final antes de evaluarla
    try {
      validateFormula(expr);
    } catch (finalValidationError) {
      console.error("Error en validación final:", finalValidationError.message);
      item.value = "Error";
      return;
    }

    // 3) Evaluar la expresión ya con números
    // Reemplazar operadores especiales para JavaScript
    let jsExpression = expr
      .replace(/\^/g, "**") // Potencia
      .replace(/√/g, "Math.sqrt") // Raíz cuadrada
      .replace(/π/g, "Math.PI") // Pi
      .replace(/e/g, "Math.E"); // Euler

    const result = Function(`"use strict"; return (${jsExpression})`)();

    if (isNaN(result) || !isFinite(result)) {
      item.value = "Error";
      return;
    }

    // 4) Redondear el resultado a un número entero
    const resultRounded = Math.round(result);
    item.value = resultRounded;

    // 5) actualizar endpoint por el cambio del formula
    const body = {
      _id: item._id,
      value: item.value,
      groupVariable: item.groupVariable,
      abbreviation: item.abbreviation,
      calculation: {
        displayFormula: validatedExpression,
        formula: exprGlobalsId,
        dependencies: arraysIdsGlobals,
      },
      income: incomesStore.income?._id,
      ...(item.unit !== null &&
      typeof item.unit?.name === "string" &&
      item.unit.name !== "Sin unidad"
        ? { unit: item.unit._id }
        : { unit: "" }),
    };

    if (!item.isTemporal) {
      console.log("actualiza");
      await incomesStore.updateGlobal(body);
      setTimeout(() => {
        const idIncome = incomesStore.income?._id;
        incomesStore.getMovementBasicData(idIncome);
        incomesStore.informationForm.amfi = {
          ...incomesStore.informationForm.amfi,
          ...incomesStore.income.informationForm.amfi,
        };
      }, 8000);
      await incomesStore.getGlobalByGroup(
        incomesStore.configuration.globals.groups[currentGroup.value]?._id
      );
      incomesStore.configuration.globals.globalsByGroup.push(
        ...temporalGlobals.value
      );
    } else {
      // Si es temporal, verificar completion después del cálculo
      item.calculation.formula = exprGlobalsId;
      item.calculation.dependencies = arraysIdsGlobals;
      checkTemporalCompletion(item);
    }
  } catch (e) {
    console.error("Error evaluando expresión:", expression, e);
    item.value = "Error";
  } finally {
    if (!item.isTemporal) {
      globalStore.loading = false;
    }
  }
}

// Funcion para cambiar el estilo de la abreviación
function changeStyleAbbreviation(expresion, item) {
  const mapa = variablesMap.value;
  if (!expresion) return [];

  const tokens = expresion
    .split(/(\s+|[+*/()-])/)
    .filter((token) => token !== "");

  return tokens.map((token) => {
    if (mapa[token]) {
      return {
        value: token,
        isAbbreviation: true,
        fullGlobal: item,
      };
    } else {
      return {
        value: token,
        isAbbreviation: false,
        fullGlobal: item,
      };
    }
  });
}

// Cambia el nombre de un global
async function updatedNameGlobal(item, value) {
  if (item.isTemporal) {
    // Solo verificar completion cuando es temporal
    checkTemporalCompletion(item);
    return;
  }

  const body = {
    _id: item._id,
    name: value,
    groupVariable: item.groupVariable,
    abbreviation: item.abbreviation,
    calculation: {
      displayFormula: item.calculation.displayFormula,
      formula: item.calculation.formula,
      dependencies: item.calculation.dependencies,
    },
    value: item.value,
    income: incomesStore.income?._id,
    ...(item.unit !== null && item.unit.name !== "Sin unidad"
      ? { unit: item.unit._id }
      : { unit: "" }),
  };

  try {
    globalStore.loading = true;

    await incomesStore.updateGlobal(body);
    await incomesStore.getGlobalByGroup(
      incomesStore.configuration.globals.groups[currentGroup.value]?._id
    );
    incomesStore.configuration.globals.globalsByGroup.push(
      ...temporalGlobals.value
    );

    // temporalGlobals.value = [];
  } catch (e) {
    console.error("Error al cambiar el nombre del global:", e);
  } finally {
    globalStore.loading = false;
  }
}

// cambiar la abreviación de un global
async function updatedAbbreviationGlobal(item, value) {
  // Usar la función directa sin debounce
  // const hasError = await checkAbreviationDirect(value, incomesStore.income?._id, item);
  // console.log('checkeo', hasError);

  // funcion error local
  const hasError = item.error.abbreviation.isRepeated;

  if (hasError) {
    return;
  }

  if (item.isTemporal) {
    // Solo verificar completion cuando es temporal
    checkTemporalCompletion(item);
    return;
  }

  const body = {
    _id: item._id,
    name: item.name,
    groupVariable: item.groupVariable,
    abbreviation: value,
    calculation: {
      displayFormula: item.calculation.displayFormula,
      formula: item.calculation.formula,
      dependencies: item.calculation.dependencies,
    },
    value: item.value,
    income: incomesStore.income?._id,
    ...(item.unit !== null && item.unit !== "Sin unidad"
      ? { unit: item.unit._id }
      : { unit: "" }),
  };

  try {
    globalStore.loading = true;

    await incomesStore.updateGlobal(body);
    // Cargar todas las variables globales para checkear las abreviaciones repetidas
    await incomesStore.getGlobalbyIncome(incomesStore.income?._id);
    await incomesStore.getGlobalByGroup(
      incomesStore.configuration.globals.groups[currentGroup.value]?._id
    );
    incomesStore.configuration.globals.globalsByGroup.push(
      ...temporalGlobals.value
    );
  } catch (e) {
    console.error("Error al cambiar la abreviación del global:", e);
  } finally {
    globalStore.loading = false;
  }
}

async function updatedTypeGlobal(data, item) {
  if (item.isTemporal) {
    item.type = data.value;
    checkTemporalCompletion(item);
    return;
  } else {
    const body = {
      _id: item._id,
      name: item.name,
      groupVariable: item.groupVariable,
      abbreviation: item.abbreviation,
      calculation: {
        displayFormula: item.calculation.displayFormula,
        formula: item.calculation.formula,
        dependencies: item.calculation.dependencies,
      },
      value: item.value,
      type: data.value,
      income: incomesStore.income?._id,
      ...(item.unit !== null && item.unit !== "Sin unidad"
        ? { unit: item.unit._id }
        : { unit: "" }),
    };

    try {
      globalStore.loading = true;
      await incomesStore.updateGlobal(body);
      await incomesStore.getGlobalByGroup(
        incomesStore.configuration.globals.groups[currentGroup.value]?._id
      );
      incomesStore.configuration.globals.globalsByGroup.push(
        ...temporalGlobals.value
      );
    } catch (e) {
      console.error("Error al cambiar el tipo del global:", e);
    } finally {
      globalStore.loading = false;
    }
  }
}

// cambiar el unit de un global
async function updatedUnitGlobal(data, item) {
  // Si es temporal, actualiza la unidad y verifica si ya se puede crear
  if (item.isTemporal) {
    const selectedUnit = optionsSelectUnit.value.find(
      (u) => u.value === data.value
    );
    if (selectedUnit) {
      item.unit = {
        _id: selectedUnit.value,
        name: selectedUnit.label,
      };
    } else {
      item.unit = { name: "Sin unidad" };
    }

    // Verifica si los campos requeridos ya están completos
    checkTemporalCompletion(item);
    return;
  }

  // Si no es temporal, actualiza normalmente
  let unitValue = data.value;

  const body = {
    _id: item._id,
    name: item.name,
    groupVariable: item.groupVariable,
    abbreviation: item.abbreviation,
    calculation: {
      displayFormula: item.calculation.displayFormula,
      formula: item.calculation.formula,
      dependencies: item.calculation.dependencies,
    },
    value: item.value,
    income: incomesStore.income?._id,
  };

  if (unitValue !== 0) {
    body.unit = unitValue;
  } else {
    body.unit = "";
  }

  try {
    globalStore.loading = true;
    await incomesStore.updateGlobal(body);
    await incomesStore.getGlobalByGroup(
      incomesStore.configuration.globals.groups[currentGroup.value]?._id
    );
    incomesStore.configuration.globals.globalsByGroup.push(
      ...temporalGlobals.value
    );
  } catch (e) {
    console.error("Error al cambiar la unidad del global:", e);
  } finally {
    globalStore.loading = false;
  }
}

function actionTable(obj) {
  const { emit, id, data } = obj;
  const emits = {
    deleteByOrden: () => deleteGlobalById(id, data),
  };
  if (emits[emit]) {
    emits[emit]();
  }
}

function onWheelHorizontal(event) {
  const target = event.currentTarget;
  if (target.scrollWidth > target.clientWidth) {
    target.scrollLeft += event.deltaY;
  }
}

function handleEscKey(event) {
  if (event.key === "Escape") {
    deleteTemporalGlobal();
  }
}

onMounted(async () => {
  window.addEventListener("keydown", handleEscKey);

  try {
    globalStore.loading = true;

    // Cargar las opciones en el select de unidades de los globals
    console.log("promesa");
    const prom = incomesStore.getUnitsByIncome(incomesStore.income?._id);

    // cuando termine, recién arma las opciones
    prom
      .then(() => {
        const nuevasOpciones =
          incomesStore.configuration.units.unitsByIncomes.map((unit) => ({
            value: unit._id,
            label: unit.name,
          }));

        optionsSelectUnit.value.push(...nuevasOpciones);
      })
      .catch(console.error);

    // Cargar todas las variables globales para checkear las abreviaciones repetidas
    await incomesStore.getGlobalbyIncome(incomesStore.income?._id);

    // Cargar los grupos de los globals y si hay un grupo seleccionado, cargar los globals
    await incomesStore.getGroupGlobals(incomesStore.income?._id);
    if (incomesStore.configuration?.globals?.groups[currentGroup.value]) {
      await incomesStore.getGlobalByGroup(
        incomesStore.configuration?.globals?.groups[currentGroup.value]?._id
      );
    }
  } catch (e) {
    console.error("Error al cargar grupos de variables globales:", e);
  } finally {
    globalStore.loading = false;
  }
});

onBeforeUnmount(() => {
  window.removeEventListener("keydown", handleEscKey);
});

onUnmounted(() => {
  incomesStore.cleanConfigurationGlobals();
});
</script>

<template>
  <div class="globals__container">
    <div class="globals__header">
      <div class="sup">
        <span>Variables Globales</span>
        <div class="supp__buttons">
          <u-button
            v-if="incomesStore.configuration.globals.groups.length > 0"
            text="Agregar variable"
            icon="new"
            color="--neutral-surface-shadow-8a"
            color-text="--neutral-text-caption"
            colorHover="--success-surface-shadow-8a"
            color-text-hover="--primary-text-default"
            color-active="--success-surface-shadow-12a"
            size="s"
            @click="addContentGlobals"
          />
          <u-button
            text="Grupo de variables"
            type="outlined"
            icon="new"
            color="--secondary-text-default"
            color-hover="--secondary-text-subtle"
            color-active="--secondary-text-subtle"
            size="s"
            @click="showModalAddTab = true"
          />
        </div>
      </div>
      <div
        class="inf"
        v-if="incomesStore.configuration.globals.groups.length > 0"
      >
        <div class="tabs">
          <div
            class="tab"
            :class="{ activeTab: indexGroup === currentGroup }"
            v-for="(group, indexGroup) in incomesStore.configuration.globals
              .groups"
            :key="indexGroup"
            @click="changeGroup(indexGroup)"
          >
            <span class="name truncateText">{{ group.name }}</span>
            <div
              class="actions"
              :class="{ visible: indexGroup === currentGroup }"
            >
              <span
                class="u u-edit"
                @click="
                  () => {
                    groupId = group._id;
                    groupName = group.name;
                    showModalEditTab = true;
                  }
                "
              ></span>
              <span
                class="u u-delete"
                @click="
                  () => {
                    groupId = group._id;
                    showModalDeleteTab = true;
                  }
                "
              ></span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="globals__body">
      <TableBasic
        v-if="
          incomesStore.configuration.globals.groups.length > 0 &&
          incomesStore.configuration.globals.groups[currentGroup]
        "
        class="tableGlobals"
        :configTable="configTable.configurationGlobals"
        :content="incomesStore.configuration.globals.globalsByGroup"
        :key="incomesStore.configuration.globals.globalsByGroup.length"
        @action-table="actionTable"
      >
        <template v-slot:name="item">
          <u-input
            class="inputsGlobals"
            :class="{ 'input-empty': !item.item.name }"
            v-model="item.item.name"
            placeholder="-"
            :error="item.item.error?.name"
            @change="updatedNameGlobal(item.item, item.item.name)"
            @input="
              (event) => {
                item.item.error.name = false;
              }
            "
            :id="item.item._id"
          />
        </template>

        <template v-slot:abbreviation="item">
          <u-input
            class="inputsGlobals"
            :class="{ 'input-empty': !item.item.abbreviation }"
            v-model="item.item.abbreviation"
            @input="onAbbreviationInput(item.item, $event)"
            placeholder="-"
            @change="
              updatedAbbreviationGlobal(item.item, item.item.abbreviation)
            "
            :error="
              item.item.error?.abbreviation?.isEmpty ||
              item.item.error?.abbreviation?.isRepeated
            "
            :disabled="item.item.disabledInput?.abbreviation"
          />
        </template>

        <template v-slot:type="item">
          <u-select
            class="selectGlobals"
            v-model="item.item.typeName[globalStore.lang]"
            :options="optionSelectType"
            :full-data="true"
            @full-data="(data) => updatedTypeGlobal(data, item.item)"
            border-style="0px"
            :border-hover-style="'0px'"
            iconDropdown="selector_down"
          />
        </template>

        <template v-slot:calculation="item">
          <u-input
            v-if="item.item.focus || !item.item.calculation.displayFormula"
            class="inputsGlobals"
            :class="{ 'input-empty': !item.item.calculation.displayFormula }"
            v-model="item.item.calculation.displayFormula"
            :placeholder="
              item.item.type === 'constant' ? '10 * (5 + 2)' : '10 * (C + D)'
            "
            @blur="
              () => {
                item.item.focus = false;
              }
            "
            @input="
              (event) => {
                filterCalculationInput(event, item.item);
                item.item.focus = true;
                item.item.error.calculation = false;
              }
            "
            @change="
              {
                calculationValue(
                  item.item,
                  item.item.calculation.displayFormula
                );
                item.item.focus = false;
              }
            "
            :auto-focus="item.item.focus"
            :error="item.item.error?.calculation"
          />
          <div
            v-else
            @click="item.item.focus = true"
            class="calculation_container truncateText"
            v-html="getStyledCalculation(item.item, variablesMap)"
            @wheel.passive="onWheelHorizontal"
          ></div>
        </template>

        <template v-slot:value="item">
          <span
            class="valueGlobals truncateText"
            :style="{
              color:
                item.item.value === 'Error' ? 'var(--danger-text-default)' : '',
              fontWeight: 600,
            }"
            >{{ item.item.value || item.item.calculation.value }}</span
          >
        </template>

        <template v-slot:unit="item">
          <u-select
            class="selectGlobals"
            :options="optionsSelectUnit"
            v-model="item.item.unit.name"
            placeholder="-"
            style="width: 100%"
            border-style="0px"
            :border-hover-style="'0px'"
            iconDropdown="selector_down"
            :full-data="true"
            @full-data="(data) => updatedUnitGlobal(data, item.item)"
          >
            <template #label="{ option, value }">
              <u-tags
                class="truncateText tagsSelectUnit"
                :text="option?.label"
                :delete="false"
              />
            </template>
          </u-select>
        </template>

        <template v-slot:used="item">
          <span class="valueGlobals truncateText">{{ item.item.used }}</span>
        </template>

        <template v-slot:actions="item">
          <span
            class="u u-delete deleteGlobals"
            @click="
              () =>
                actionTable({
                  emit: 'deleteByOrden',
                  id: item.item._id,
                  data: item.item,
                })
            "
          ></span>
        </template>
      </TableBasic>

      <div class="empty" v-else>
        <span
          >Para poder crear variables debes tener un grupo de variables</span
        >
        <img src="/img/banking-transactions/lupa.svg" alt="empty variables" />
        <u-button
          text="Crear grupo de variables"
          size="l"
          @click="showModalAddTab = true"
          icon="new"
        />
      </div>
    </div>

    <!-- <div class="globals__footer" v-if="incomesStore.configuration.globals.groups.length > 0 && incomesStore.configuration.globals.groups[currentGroup]">

    </div> -->

    <!-- Modal para eliminar pestaña -->
    <dialog-confirm
      width="600px"
      height="auto"
      title="Eliminar grupo de variables"
      description="Si el grupo de variables contiene alguna variable que se encuentra en uso, la variable se mostrará con el valor numérico correspondiente y no podrá volver a ser utilizada en el proyecto"
      :showInput="true"
      confirmationText="Eliminar"
      :actionModal="() => deleteGroup()"
      :showModal="showModalDeleteTab"
      @closeModal="showModalDeleteTab = false"
    />

    <!-- Modal para editar nombre de pestaña -->
    <dialog-variables
      width="596px"
      height="370px"
      :valueInput="groupName"
      title="Editar grupo de variables"
      description="Ingresa el nombre del grupo de variables"
      :showInput="true"
      @updatedVariables="editGroup"
      :showModal="showModalEditTab"
      @closeModal="showModalEditTab = false"
    />

    <!-- Modal para agregar nueva pestaña -->
    <dialog-variables
      width="596px"
      height="370px"
      title="Agregar grupo de variables"
      description="Ingresa el nombre del grupo de variables"
      customTextBtnVariables="Crear Grupo"
      :showInput="true"
      @updatedVariables="addNewGroup"
      :showModal="showModalAddTab"
      @closeModal="showModalAddTab = false"
    />
  </div>
</template>

<style scoped>
.globals__container {
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
}

.globals__header {
  display: grid;
  grid-template-rows: 36px 1fr;
  width: 100%;
  gap: 8px;
  margin-bottom: 16px;
}

.globals__header .sup {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.globals__header .sup span {
  color: var(--neutral-text-body);
  font-family: Nunito;
  font-size: 24px;
  font-weight: 600;
  line-height: 36px;
  letter-spacing: 0em;
  text-align: left;
}

.globals__header .supp__buttons {
  display: flex;
  gap: 12px;
}

.globals__header .inf {
  display: flex;
}

.globals__header .inf .tabs {
  display: flex;
  flex-wrap: wrap;
  height: auto;
  max-height: calc(43px * 3 + 8px);
  width: auto;
  align-items: center;
  gap: 8px;
  padding: 6px 8px;
  background-color: var(--secondary-surface-shadow-8a);
  border-radius: 16px;
  justify-content: flex-start;
  overflow-y: auto;
  overflow-x: hidden;
}

.globals__header .inf .tabs .tab {
  cursor: pointer;
  display: flex;
  min-width: 160px;
  height: 36px;
  width: 192px;
  border-radius: 12px;
  padding: 0px 12px;
  gap: 8px;
  align-items: center;
  justify-content: space-between;
}

.globals__header .inf .tabs .tab:hover {
  background-color: var(--secondary-surface-shadow-12a);
  transition: 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}

.activeTab {
  background-color: var(--secondary-surface-shadow-12a);
}

.globals__header .inf .tabs .tab .name {
  color: var(--neutral-text-body);
  font-size: 14px;
  font-weight: 600;
  line-height: 18px;
  letter-spacing: 0em;
  text-align: center;
}

.globals__header .inf .tabs .tab .actions {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 0px;
  opacity: 0;
  transform: translateX(10px);
  transition: opacity 0.3s ease, transform 0.3s ease;
  pointer-events: none;
}

.globals__header .inf .tabs .tab .actions.visible {
  width: auto;
  opacity: 1;
  transform: translateX(0);
  pointer-events: auto;
}

.globals__header .inf .tabs .tab .actions span {
  width: 28px;
  height: 28px;
  font-size: 20px;
  display: flex;
  justify-content: center;
  align-items: center;
  color: var(--neutral-text-caption);
}

/*body */
.globals__body {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  overflow-y: auto;
}

/* table globals */
::v-deep(.tableGlobals) {
  overflow-y: visible !important;
  height: 100% !important;
}

/* ::v-deep(.tableGlobals td) {
  overflow: visible !important;
  position: relative; 
  z-index: 9999;
} */

/* ::v-deep(.tableGlobals) {
  overflow: visible !important;
}

::v-deep(.tableGlobals td),
::v-deep(.tableGlobals th) {
  overflow: visible !important;
  position: relative;
  z-index: 1;
}

::v-deep(.u-select .dropdown-list) {
  z-index: 9999 !important;
} */

/* input globals */

::v-deep(.inputsGlobals) {
  border: 0;
  width: 100%;
}
::v-deep(.inputsGlobals:hover) {
  background-color: var(--success-surface-shadow-8a);
}

::v-deep(.inputsGlobals:hover:not(:focus)) {
  border: none !important;
}

::v-deep(.inputsGlobals:focus) {
  background-color: var(--success-surface-shadow-8a);
}

::v-deep(.input-empty) {
  background-color: var(--neutral-surface-shadow-8a);
}

/* container span de abreviación */
.calculation_container {
  display: flex;
  align-items: center;
  justify-content: left;
  padding: 0 18px;
  width: 100%;
  height: 36px;
  border-radius: 12px;
  gap: 6px;
  overflow-x: hidden;
  color: var(--neutral-text-body);
}

.calculation_container:hover {
  background-color: var(--primary-surface-shadow-12a);
  transition: 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}

/* para el span de abreviación */
::v-deep(.abbr-style) {
  display: flex;
  align-items: center;
  justify-content: center;
  width: auto;
  height: 24px;
  padding: 0 8px;
  font-size: 14px;
  font-weight: 600;
  line-height: 18px;
  color: var(--secondary-text-darker);
  border: 1px solid var(--secondary-border-subtle);
  border-radius: 8px;
  background-color: var(--secondary-surface-softer);
  font-weight: bold;
}

::v-deep(.abbr-style-empty) {
  color: var(--neutral-text-caption);
}

/* select */

.selectGlobals {
  width: 100%;
  padding: 0 !important;
}

.selectGlobals.select-active {
  border: 2px solid var(--primary-border-default);
  border-radius: 8px;
}

.selectGlobals:focus-within {
  background-color: var(--neutral-surface-shadow-12a);
  border: 2px solid var(--primary-border-default);
  border-radius: 16px;
}

.tagsSelectUnit {
  height: 28px;
  width: auto;
  max-width: 100%;
  justify-content: center;
  margin-right: auto;
}

/*value */
.valueGlobals {
  margin-left: auto;
  color: var(--neutral-text-body);
}

/* actions */
.deleteGlobals {
  width: 100%;
  font-size: 20px;
  display: flex;
  justify-content: center;
  align-items: center;
  color: var(--danger-text-default);
  cursor: pointer;
}

.empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-top: 106px;
  width: 100%;
  height: 100%;
  gap: 24px;
}

.empty span {
  font-size: 16px;
  line-height: 20px;
  text-align: center;
  letter-spacing: 0em;
  margin-bottom: 8px;
  color: var(--neutral-text-caption);
}

.globals__footer {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  margin-top: 8px;
}
</style>
