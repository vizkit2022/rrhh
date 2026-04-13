<script setup>
import { defineProps, ref, onMounted, onBeforeUnmount, watch } from "vue";
import useGlobalStore from "@/stores/global";
import useOutcomesStore from "@/stores/outcomes";
import { useVirtualList } from "@vueuse/core";
import labels from "@/utils/labels/outcomes.json";
import { onlyNumbers } from "@/utils/helpers";
import {
  formatCurrency,
  convertToNumberByCurrency,
  getValueFormaRealTime,
} from "@/utils/formatAmount";
import useOrganizationStore from "@/stores/organization";
// EventBus
const { $bus } = useNuxtApp();
// Stores
const organizationStore = useOrganizationStore();
const globalStore = useGlobalStore();
const outcomesStore = useOutcomesStore();
const props = defineProps({
  loading: {
    type: Boolean,
    default: false,
  },
  page: {
    type: String,
    default: "incomes",
  },
  showTotals: {
    type: Boolean,
    default: false,
  },
  propertyStoreTotals: {
    type: String,
    default: "outcome_active", //formOc para el formulario de creacion
  },
  propertyStoreLines: {
    type: String,
    default: "lines", //linesOcSelected Para la creacion de la OC
  },
  update: {
    //Indica que las lineas ya existen, y se usa para actualizarlas y Borrarlas en el Back.
    type: Boolean,
    default: false, //linesOcSelected Para la creacion de la OC
  },
  readOnly: {
    type: Boolean,
    default: false,
  },
  readOnlyTax: {
    type: Boolean,
    default: false,
  },
  readOnlyLines: {
    type: Array,
    default: () => [],
  },
});
// Constants
// Currency
console.log("Modo ", props.propertyStoreTotals);

const currencyDefault =
  outcomesStore[props.propertyStoreTotals]?.currency?.default ||
  organizationStore?.organization?.currency ||
  null;

console.log("currencyDefault", currencyDefault);
// Arrays para el estado de los checkboxes y los IDs seleccionados

const valueAllSelected = ref(false);
const indexToDelete = ref(0);
const lineaToDelete = ref({});
const modalDelete = ref(false);
const labelHeader = labels.table.header;
let TaxesOld = {};
const taxModalX = ref(0);
const taxModalY = ref(0);
const showTaxModal = ref(false);
const posLine = ref(0);
const taxesByLine = ref([]);
let debounceTimeout;

const lines = computed(() => {
  if (!props.readOnly) {
    if(props.page === "CreateOC") {
      return outcomesStore[props.propertyStoreLines].filter(l => !l.isParent);
    }
    if(props.page === "toDocument") {
      return outcomesStore[props.propertyStoreLines].filter(l => l.select);
    }
    return outcomesStore[props.propertyStoreLines];
  } else {
    return props.readOnlyLines;
  }
});

const handleEscapeKey = (event) => {
  if (event.key === "Escape" || event.key === "Esc") {
    hideModalTax(posLine.value);
  }
};

// Watch the showTaxModal ref
watch(showTaxModal, (newVal) => {
  if (newVal) {
    // Modal is now open, add the keydown listener
    window.addEventListener("keydown", handleEscapeKey);
  } else {
    // Modal is now closed, remove the listener
    window.removeEventListener("keydown", handleEscapeKey);
  }
});

// Ensure the listener is removed when the component is unmounted
onBeforeUnmount(() => {
  window.removeEventListener("keydown", handleEscapeKey);
});

// Virtual List
let { list, containerProps, wrapperProps } = useVirtualList(lines.value, {
  itemHeight: 40,
});

onMounted(() => {
  if (!props.readOnly) {
    const store = outcomesStore[props.propertyStoreTotals];

    // Inicializa propiedades del store si no existen
    if (!store.numbers?.totalRetencion || !store.numbers?.totalTaxAddition) {
      store.numbers.totalRetencion = store.numbers.totalRetencion || {
        value: formatCurrency(0, currencyDefault, false),
        number: 0,
      };
      store.numbers.totalTaxAddition = store.numbers.totalTaxAddition || {
        value: formatCurrency(0, currencyDefault, false),
        number: 0,
      };
    }

    // Lógica específica si la página es "CreateOC"
    if (props.page === "CreateOC") {
      lines.value.forEach((item) => {
        item.taxes = [...(store.taxDefault ?? [])];
        const formattedValue = formatCurrency(
          item.numbers.toSpend.number,
          currencyDefault,
          false
        );

        item.numbers.toSpend.value = formattedValue;
        item.numbers.budget.value = formattedValue;
        item.numbers.budget.number = item.numbers.toSpend.number;

        // Inicializar cantidades
        item.numbers.amount1 = { number: 1, value: "1" };
        item.numbers.amount2 = { number: 1, value: "1" };
        item.numbers.amount3 = { number: 0, value: "0" };

        calcTotalLine(item, false); // Calcular el total sin actualizaciones en cascada
      });
    }

    if (props.page === "toDocument") {
      // Si hay líneas, procesar cada una
      lines.value.forEach((item) => {
        // Determinar el tipo de outcome con valor por defecto
        const type =
          outcomesStore[props.propertyStoreTotals]?.outcomes?.type ?? "UNKNOWN";
        // Actualizar el valor formateado de 'documented'
        let totalNumber = item.numbers.sumBudget?.number ?? 0; // Monto neto total original
        let documentedNumber = item.numbers.documentedNet?.numberAprox ?? 0; // Monto neto ya documentado

        documentedNumber = convertToNumberByCurrency(
          documentedNumber,
          currencyDefault
        );
        totalNumber = convertToNumberByCurrency(totalNumber, currencyDefault);

        console.log("totalNumber", totalNumber);
        console.log("documentedNumber", documentedNumber);
        //formatear el numero mejor visualizacion (formatCurrency toma)
        item.numbers.documented.value = formatCurrency(
          documentedNumber,
          currencyDefault,
          false
        );
        // Calcular el monto neto pendiente por documentar
        let toBeDocumentedNeto = Math.max(totalNumber - documentedNumber, 0);
        console.log("toBeDocumentedNeto", toBeDocumentedNeto);
        // Bloque 1: Calcular Validaciones (Compartido)
        item.validations = {
          maxMount: toBeDocumentedNeto, // Monto neto máximo permitido
          validate: false,
        };
        console.log("wenaaa2", item.validations);

        // Bloque 2: Calculo de To Document

        if (type === "OC") {
          // Proceso Inverso: Calcular el monto neto a partir del monto final

          let toBeDocumentedFinal = calculateTargetAmount(
            toBeDocumentedNeto,
            item.taxes
          );
          console.log("toBeDocumentedFinal", toBeDocumentedFinal);
          item.numbers.toBeDocumented = {
            number: toBeDocumentedNeto, // Monto bruto
            value: formatCurrency(toBeDocumentedNeto, currencyDefault, false),
            numberAprox: convertToNumberByCurrency(
              toBeDocumentedNeto,
              currencyDefault
            ),
          };

          console.log(
            "item.numbers.toBeDocumented",
            item.numbers.toBeDocumented
          );
        } else if (type === "FXR") {
          // Para tipo FXR, ambos valores deben ser cero
          item.numbers.toBeDocumented = {
            number: 0, // Monto bruto
            value: formatCurrency(0, currencyDefault, false),
            numberAprox: 0,
          };
        } else {
          // Tipo desconocido, emitir advertencia
          console.warn("El tipo no concuerda con OC ni FXR", type);
        }

        // Bloque 3: Llamar a calcTotalLine (Compartido)
        calcTotalLine(item, false);
      });
    }

    if (props.page === "outcomes") {
      // Si hay líneas, procesar cada una
      lines.value.forEach((item) => {
        calcTotalLine(item, true); // Calcular el total sin actualizaciones en cascada
      });
    }

    // Realiza una sola actualización del total de todas las líneas
    calcDetalleTax();

    // Escuchar el evento de actualización de lista
    $bus.$on("Updatelist", () => {
      ({ list, containerProps, wrapperProps } = useVirtualList(lines.value, {
        itemHeight: 40,
      }));
      console.log("updateListsss");
      calcDetalleTax();
    });

    $bus.$on("BusCompareTotals", () => {
      console.log("entro al bus");
      comparetotals();
    });
  }
});

const calculateTargetAmount = (finalAmount, taxIDs) => {
  let totalTaxOnNet = 0;
  let totalTaxOnGross = 0;

  // Separar impuestos en dos grupos: con y sin retención
  taxIDs.forEach((taxID) => {
    const tax = outcomesStore.taxes.find((t) => t._id === taxID);
    if (tax) {
      const taxRate = tax.value / 100;
      if (tax.retention) {
        totalTaxOnNet += taxRate;
      } else {
        totalTaxOnGross += taxRate;
      }
    } else {
      throw new Error("Impuesto con ID ${taxID} no encontrado.");
    }
  });

  // Verificar para evitar la división por cero con impuestos de retención
  if (totalTaxOnNet >= 1) {
    throw new Error(
      "La tasa total de impuestos con retención no puede ser igual o mayor a 100%."
    );
  }

  // Calcular el monto neto a partir del monto final
  const netAmount = finalAmount / (1 + totalTaxOnGross);
  const targetAmount = netAmount * (1 - totalTaxOnNet);

  return targetAmount;
};

if (!props.readOnly) {
  onBeforeUnmount(() => {
    $bus.$off("Updatelist");
    $bus.$off("BusCompareTotals");
  });
}

const valueAllSelectedChange = () => {
  outcomesStore[props.propertyStoreLines].forEach((item) => {
    item.select = valueAllSelected.value;
  });
};

const evaluatedAllSelected = () => {
  valueAllSelected.value = outcomesStore[props.propertyStoreLines].every(
    (item) => item.select
  );
};

// Actions
const clickInput = (e, item) => {
  e.target.select();
};

const moveInput = (event, posX, posY) => {
  const visibleList = list.value;
  const limit = visibleList.length - 1;
  const options = ["ArrowDown", "ArrowUp", "ArrowLeft", "ArrowRight"];

  if (options.indexOf(event.key) > -1) {
    const inputPositions = {
      ArrowDown: () => moveInputDown(posX, posY, visibleList, limit),
      ArrowUp: () => moveInputUp(posX, posY, visibleList, limit),
      ArrowLeft: () => moveInputLeft(posX, posY, visibleList, limit),
      ArrowRight: () => moveInputRight(posX, posY, visibleList, limit),
    };
    const newId = inputPositions[event.key](posX, posY, visibleList, limit);
    const newInput = document.getElementById(newId);
    newInput.focus();
    setTimeout(() => newInput.select(), 0);
  }
};

const handleKeyDown = (
  event,
  typeFormat,
  precision,
  currentValue = "",
  posX,
  posY
) => {
  // Asegúrate de que currentValue sea una cadena
  currentValue = currentValue.toString();

  const decimalSeparator = typeFormat === "de-DE" ? "," : ".";
  const navigationKeys = ["ArrowDown", "ArrowUp", "ArrowLeft", "ArrowRight"];
  const controlKeys = ["Backspace", "Delete", "Tab"];

  // Navegación con flechas
  if (navigationKeys.includes(event.key)) {
    moveInput(event, posX, posY);
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

  // Bloquear teclas no válidas
  if (!/^[0-9]$/.test(event.key) && event.key !== decimalSeparator) {
    event.preventDefault();
    return;
  }

  // Si precision es 0, bloquear cualquier entrada de separador decimal
  if (precision === 0 && event.key === decimalSeparator) {
    event.preventDefault();
    return;
  }

  // Verifica si ya se alcanzó el máximo número de decimales permitidos
  if (currentValue.includes(decimalSeparator)) {
    const [_, decimalPart] = currentValue.split(decimalSeparator);
    if (decimalPart && decimalPart.length >= precision) {
      event.preventDefault(); // Bloquear entrada adicional en la parte decimal
      return;
    }
  }
};

const moveInputLeft = (posX, posY, visibleList, limit) => {
  const newY = posY === limit ? visibleList[0].index : posY + 1;
  return posX === 1 ? `input-grid-${newY}-4` : `input-grid-${posY}-${posX - 1}`;
};
const moveInputRight = (posX, posY, visibleList, limit) => {
  const newY = posY === limit ? visibleList[0].index : posY + 1;
  return posX === 4 ? `input-grid-${newY}-1` : `input-grid-${posY}-${posX + 1}`;
};

const moveInputUp = (posX, posY, visibleList, limit) => {
  const newY = posY === 0 ? limit : posY - 1;
  return `input-grid-${newY}-${posX}`;
};

const moveInputDown = (posX, posY, visibleList, limit) => {
  const newY = posY === limit ? 0 : posY + 1;
  return `input-grid-${newY}-${posX}`;
};

//REVISAR POR EL TEMA DE STORE
const deleteItemBack = async () => {
  const resp = await outcomesStore.deleteLineOutcome(lineaToDelete.value);

  if (resp.success) {
    deleteItem();
  }
};
const deleteItem = () => {
  outcomesStore[props.propertyStoreLines].splice(indexToDelete.value, 1); //este borra
  list.value.splice(indexToDelete.value, 1);
  calcDetalleTax();
};

const modalTax = (item, e) => {
  posLine.value = item.index;
  const divMain = e.target.closest(".divMain");
  const buttonRect = e.target.getBoundingClientRect();
  const divMainRect = divMain.getBoundingClientRect();

  const positionX =
    props.page == "outcomes"
      ? buttonRect.right - 420
      : buttonRect.right - 420 - window.innerWidth / 10;

  const positionY =
    props.page == "outcomes"
      ? buttonRect.top
      : -divMainRect.top + 90 + buttonRect.top;

  //console.log("divMainRect top",buttonRect.top ,"height",divMainRect.height, "button", divMainRect.height + buttonRect.top) ;
  //
  //console.log("divMainRect top",buttonRect.top ,"height",divMainRect.height, "button", divMainRect.height + buttonRect.top) ;

  taxModalX.value = positionX;
  taxModalY.value = positionY;

  taxesByLine.value = printTax(item.data);
  console.log("taxesByLine.value ", taxesByLine.value);
  showTaxModal.value = true;
  TaxesOld = [...item.data.taxes];
  //console.log("TaxesOld",TaxesOld);
};

const handleInput = (item, prop) => {
  if (
    prop == "toBeDocumented" &&
    outcomesStore[props.propertyStoreTotals]?.outcomes.type === "OC"
  ) {
    validateDocumentedMAX(item);
  }

  calcTotalLine(item);
};

const validateDocumentedMAX = (line) => {
  if (line.numbers.toBeDocumented?.max < line.numbers.toBeDocumented?.number) {
    // Añadir un indicador de error dentro de numbers.toBeDocumented
    line.numbers.toBeDocumented.error = true;
  } else {
    line.numbers.toBeDocumented.error = false;
  }
};

const calculateSingleTaxAmount = (targetAmount, taxRate, hasRetention) => {
  const taxMultiplier = taxRate / 100;

  if (hasRetention) {
    // Si el impuesto tiene retención, calcular el monto bruto necesario para que el target sea el neto
    const grossAmount = targetAmount / (1 - taxMultiplier);
    const taxAmount = grossAmount - targetAmount; // El monto del impuesto (diferencia entre bruto y neto)
    return {
      total: grossAmount,
      tax: taxAmount,
    };
  } else {
    // Si no tiene retención, calcular el monto total con impuesto
    const grossAmount = targetAmount * (1 + taxMultiplier);
    const taxAmount = grossAmount - targetAmount; // El monto del impuesto
    return {
      total: grossAmount,
      tax: taxAmount,
    };
  }
};

const calcTotalLine = async (line, UpdateTotals = true) => {
  const quantity = line.numbers.amount1.number || 0;
  const days = line.numbers.amount2.number || 0;
  const ot = line.numbers.amount3.number != 0 ? line.numbers.amount3.number : 1;
  const unit = line.numbers.budget.number || 0;
  const newVal = quantity * days * ot * unit || 0;
  line.numbers.sumBudget.number = newVal;
  line.numbers.sumBudget.value = formatCurrency(newVal, currencyDefault, true);

  calcTaxByLine(line, UpdateTotals);
};

const calcTaxByLine = (line, updateTotals = true) => {
  let amountTax = 0;
  const taxDicc = {}; // Diccionario para acumular los valores por ID de impuesto.

  // Verificar si line.taxes es un arreglo válido
  if (Array.isArray(line.taxes)) {
    line.taxes.forEach((taxID) => {
      // Buscar el impuesto correspondiente por taxID
      const tax = outcomesStore.taxes.find((t) => t._id === taxID);

      if (tax) {
        // Asegurarse de que el impuesto exista
        const baseNumber =
          props.page === "toDocument"
            ? line.numbers?.toBeDocumented?.number
            : line.numbers?.sumBudget?.number;

        // Calcular el monto del impuesto individual (monto total después de aplicar el impuesto)
        let { value: individualTaxAmount, tax: taxAmountForThisTax } =
          calculateSingleTaxAmount(baseNumber, tax.value, tax.retention);

        // Acumular el monto total de impuestos
        amountTax += taxAmountForThisTax;

        // Acumular el impuesto en el diccionario
        if (!taxDicc[taxID]) taxDicc[taxID] = { value: 0 };
        taxDicc[taxID].value += taxAmountForThisTax;
      }
    });
  } else {
    // Inicializar line.taxes como un arreglo vacío si no lo es
    line.taxes = [];
  }

  // Asignar el monto del impuesto calculado (solo impuesto).
  line.numbers.tax.number = amountTax;
  line.numbers.tax.value = formatCurrency(amountTax, currencyDefault, true);

  // Calcular el total basado en la página actual.
  const baseNumber =
    props.page === "toDocument"
      ? line.numbers.toBeDocumented.number
      : line.numbers.sumBudget.number;

  // Calcular el total considerando el signo del impuesto
  line.numbers.total.number = baseNumber + amountTax; /* Impuesto más neto */
  line.numbers.total.value = formatCurrency(
    line.numbers.total.number,
    currencyDefault,
    true
  );
  line.numbers.total.numberAprox = convertToNumber(
    line.numbers.total.number,
    currencyDefault.typeFormat,
    currencyDefault.precision
  );

  // Validar el total si estamos en la página 'toDocument'.
  if (props.page === "toDocument") {
    console.log(
      "perro",
      line.numbers.totalNet.numberAprox,
      line.validations.maxMount
    );
    line.validations.validate =
      line.numbers.toBeDocumented.number <= line.validations.maxMount;
  }

  // Asignar los impuestos detallados a la línea.
  line.numbers.taxes = Object.keys(taxDicc)
    .map((taxID) => {
      const taxObj = outcomesStore.taxes.find((t) => t._id === taxID);
      if (taxObj) {
        return {
          ...taxObj,
          total: {
            number: taxDicc[taxID].value /* Solo impuesto sin neto */,
            value: formatCurrency(taxDicc[taxID].value, currencyDefault, true),
            numberAprox: convertToNumber(
              taxDicc[taxID].value,
              currencyDefault.typeFormat,
              currencyDefault.precision
            ),
          },
          tax: taxID,
        };
      }
      return null;
    })
    .filter((tax) => tax !== null); // Filtrar impuestos nulos.

  // Opcional: Actualizar los totales si es necesario.
  if (updateTotals) {
    calcDetalleTax();
  }
};

const printTax = (item) => {
  let taxes = [];
  const baseNumber =
    props.page === "toDocument"
      ? (item.numbers &&
          item.numbers.toBeDocumented &&
          item.numbers.toBeDocumented.number) ||
        0
      : (item.numbers &&
          item.numbers.sumBudget &&
          item.numbers.sumBudget.number) ||
        0;

  if (item.taxes && item.taxes.length) {
    outcomesStore.taxes.forEach((t) => {
      const select = item.taxes.includes(t._id);

      let taxAmount = 0;
      if (select) {
        // Calcular el monto total después de aplicar el impuesto
        const { value: individualTaxAmount, tax: taxAmountForThisTax } =
          calculateSingleTaxAmount(baseNumber, t.value, t.retention);
        // El monto del impuesto es la diferencia entre el total y el monto base
        taxAmount = taxAmountForThisTax;
      }

      taxes.push({
        ...t,
        number: taxAmount,
        select: select,
      });
    });
  } else {
    // Si no hay impuestos seleccionados, devolver la lista de impuestos con montos cero
    taxes = outcomesStore.taxes.map((t) => {
      return {
        ...t,
        number: 0,
        select: false,
      };
    });
  }
  return taxes;
};

const handleSwitchTax = (tax) => {
  const line = outcomesStore[props.propertyStoreLines][posLine.value];
  const action = tax.select ? "add" : "remove";
  changeTaxStatusLine(action, line, tax._id);
};

const changeTaxStatusLine = (action, line, taxID) => {
  let change = false;

  const TaxOC = outcomesStore.taxes.findIndex((t) => t._id === taxID);
  if (TaxOC === -1) {
    console.warn("Tax no existe en la Compra");
  }

  const posTaxLine = outcomesStore[props.propertyStoreLines][
    posLine.value
  ].taxes.findIndex((t) => t === taxID);

  if (action == "add") {
    if (posTaxLine === -1) {
      line.taxes.push(taxID);
      change = true;
    } else {
      console.warn(
        "Se intento Agregar un impuesto inexistente en la linea",
        line,
        taxID
      );
    }

    line.taxes;
  } else if (action == "remove") {
    if (posTaxLine != -1) {
      outcomesStore[props.propertyStoreLines][posLine.value].taxes.splice(
        posTaxLine,
        1
      );
      change = true;
    } else {
      console.warn(
        "Se intento Borrar un impuesto ya existente en la linea",
        line,
        taxID
      );
    }
  }

  if (change) {
    calcTaxByLine(line);
    taxesByLine.value = printTax(line);
  }
};

const calcDetalleTax = () => {
  console.log("las lineas", outcomesStore[props.propertyStoreLines]);
  let outcomeMode = false;
  if (
    props.propertyStoreTotals == "outcome_active" ||
    props.propertyStoreTotals == "formOc"
  ) {
    outcomeMode = true;
  }
  //variables a setear
  let total = 0;
  let totalNet = 0;
  let taxApplied = 0;
  let retention = 0;
  let taxExempt = 0;
  let taxable = 0;
  let taxes = [];
  //Funcion que actualizas valores de impuestos por separado para setear despues en totales
  const updateTax = (tax) => {
    console.log("el tax", tax.name, tax.total);
    const existingTax = taxes.find((obj) => obj.tax === tax.tax);
    if (existingTax) {
      console.log("existe", tax.total.number);
      existingTax.total.number += tax.total.number;
    } else {
      console.log("no existe", tax.total.number);
      taxes.push({
        tax: tax.tax,
        name: tax.name,
        value: tax.value,
        retention: tax.retention,
        total: {
          number: tax.total.number,
          numberAprox: tax.total.number,
          value: tax.total.number,
        },
      });
    }
    tax.retention
      ? (retention += tax.total.number)
      : (taxApplied += tax.total.number);
  };

  outcomesStore[props.propertyStoreLines].forEach((line) => {
    const valor = (outcomeMode
      ? line.numbers?.sumBudget?.number
      : line.numbers?.toBeDocumented?.number) || 0;

    totalNet += valor;

    if (line.numbers.taxes.length > 0) {
      taxable += valor;
      line.numbers.taxes.forEach(updateTax);
    } else {
      taxExempt += valor;
    }
  });
  //formateo de valores de taxes
  taxes.forEach((tax) => {
    tax.total.numberAprox = convertToNumber(
      tax.total.number,
      currencyDefault.typeFormat,
      currencyDefault.precision
    );
    tax.total.value = formatCurrency(tax.total.number, currencyDefault, true);
  });

  console.log("los taxes", taxes);
  outcomesStore[props.propertyStoreTotals].numbers.taxes = taxes;

  const totalTax = taxApplied + retention;
  total = totalNet + totalTax;

  const fields = [
    {
      key: "totalNet",
      value: totalNet,
    },
    { key: "totalRetencion", value: retention },
    { key: "totalTaxAddition", value: taxApplied },
    { key: "taxable", value: taxable },
    { key: "taxExempt", value: taxExempt },
    { key: "totalTax", value: totalTax },
    { key: "total", value: total },
  ];

  // Itera sobre los campos y aplica las actualizaciones para el resto de campos
  fields.forEach(({ key, value }) => {
    const formattedValue = formatCurrency(value, currencyDefault, true);
    const approximatedValue = convertToNumber(
      value,
      currencyDefault.typeFormat,
      currencyDefault.precision
    );

    outcomesStore[props.propertyStoreTotals].numbers[key] = {
      value: formattedValue,
      number: value,
      numberAprox: approximatedValue,
    };
  });
};

// Inputs Events
const inputEvent = async (state, prop, item, index) => {
  if (state) {
    console.log("focus", prop);
    // Focus: Elimina el formato para edición
    item.numbers[prop].tempValue = item.numbers[prop].number;
    item.numbers[prop].lastNumber = item.numbers[prop].number;
    item.numbers[prop].lastValue = item.numbers[prop].value;
  } else {
    // Blur: Maneja el caso de un campo vacío o inválido
    console.log("blur", item.numbers[prop]);

    try {
      // Aplica el formato final
      const currency = { ...currencyDefault };
      if (prop.includes("amount")) {
        currency.symbol = "";
        currency.precision = 2;
      }
      item.numbers[prop].value = formatCurrency(
        item.numbers[prop].number,
        currency,
        true
      );

      if (
        props.page === "outcomes" &&
        item.numbers[prop].lastValue !== item.numbers[prop].value
      ) {
        updateLine(outcomesStore[props.propertyStoreLines][index]);
      }

      // Limpia el valor temporal
      delete item.numbers[prop].tempValue;
    } catch (error) {
      console.error("Error al formatear el valor:", error);
      item.numbers[prop].value = formatCurrency(0, currencyDefault, true);
      item.numbers[prop].number = 0;
      delete item.numbers[prop].tempValue;
    }
  }
};
const handleInputRealTime = (event, prop, item) => {
  const rawValue = event.target.value;
  const currency = { ...currencyDefault };
  const numbers = getValueFormaRealTime(rawValue, currency, prop);
  //actualiza valor numberico
  item.numbers[prop].number = numbers.numericValue;
  // Actualiza el valor temporal en tiempo real
  item.numbers[prop].tempValue = numbers.formattedValue;
  handleInput(item, prop);
};

const updateLine = async (line, prop) => {
  console.log("updateLine");
  await $bus.$emitWithPromise("refreshOutcome", false);
  const { success, data, error } = await outcomesStore.updateOutcomeLines(line);

  // Cancelar cualquier ejecución pendiente de comparetotals
  clearTimeout(debounceTimeout);

  // Programar comparetotals con un retraso
  debounceTimeout = setTimeout(() => {
    comparetotals();
  }, 2500); // Retraso de 4 segundos
};

let compareTotalsToken = null;
let compareTotalsTimeout = null;

const comparetotals = async () => {
  // Cancelar la ejecución anterior
  if (compareTotalsTimeout) {
    clearTimeout(compareTotalsTimeout);
  }
  const copyOutcome = JSON.parse(
    JSON.stringify(outcomesStore[props.propertyStoreTotals])
  );
  const totalLocal = copyOutcome.numbers.total.number;
  console.log("el totalsss", totalLocal);
  // const totalLocal =
  //   outcomesStore[props.propertyStoreTotals].numbers.total.number;
  // Crear un nuevo token para esta ejecución
  const token = { cancelled: false };
  compareTotalsToken = token;

  // Configurar el debounce con 3 segundos de retraso
  compareTotalsTimeout = setTimeout(async () => {
    // Verificar si la ejecución actual ha sido cancelada
    if (token.cancelled) {
      console.log("La ejecución anterior fue cancelada.");
      return;
    }
    console.log("Consultando");
    // const { success, data, error } = await outcomesStore.getTotals();
    await $bus.$emitWithPromise("refreshOutcome", true);

    // Si el token fue cancelado después de la petición, no continuar
    if (token.cancelled) {
      console.log(
        "La ejecución anterior fue cancelada después de la petición."
      );
      return;
    }

    const totalBack = outcomesStore[props.propertyStoreTotals].numbers;
    console.log("totalBack", totalBack.total.number);
    console.log("totalLocal", totalLocal);

    const areEqual = totalBack.total.number === totalLocal;

    if (areEqual) {
      console.log("Los objetos son iguales");
      outcomesStore.StatusSave = "ok";
      // outcomesStore[props.propertyStoreTotals] = data;
      // $bus.$emit("refreshOutcome", true);
      // outcomesStore.updateOutcome(outcomesStore.outcome_active);
    } else {
      console.log("Los objetos no son iguales");
      outcomesStore.StatusSave = "Error";
    }
  }, 1000);
};

const totalTaxByLine = computed(() => {
  if (!props.readOnly) {
    let resp = 0;
    if (taxesByLine.value.length) {
      resp = taxesByLine.value.reduce((acc, act) => {
        return acc + act.number;
      }, 0);
    }
    return formatCurrency(resp, currencyDefault, false);
  }
  return "";
});

const hideModalTax = (posLine) => {
  showTaxModal.value = false;
  let newTax = [...outcomesStore[props.propertyStoreLines][posLine].taxes];
  //console.log("TaxesOld", TaxesOld, "NewTax", newTax);

  // Ordenar ambos arrays antes de convertirlos a JSON
  const sortedTaxesOld = [...TaxesOld].sort();
  const sortedNewTax = [...newTax].sort();

  // Convertir los arrays ordenados a JSON
  const oldTaxJson = JSON.stringify(sortedTaxesOld);
  const newTaxJson = JSON.stringify(sortedNewTax);

  // Comparar las cadenas JSON
  if (props.page == "outcomes" && oldTaxJson !== newTaxJson) {
    //console.log("guardo");
    updateLine(outcomesStore[props.propertyStoreLines][posLine], "tax");
  }
};

const deleteLine = (item, index) => {
  lineaToDelete.value = item;
  indexToDelete.value = index;
  if (props.page == "outcomes") {
    modalDelete.value = true;
  } else {
    if (outcomesStore[props.propertyStoreLines].length !== 1) {
      deleteItem();
    }
  }
};

const titleDialogConfirm = computed(() => {
  if (!props.readOnly) {
    const text = {
      es: "¿Deseas eliminar la lineassss?",
      en: "Do you wish to eliminate the line?",
    };
    return text[globalStore.lang] || text["es"];
  }
  return "";
});

const descriptionDialogConfirm = computed(() => {
  if (!props.readOnly) {
    const text = {
      es: "Al hacer clic en el botón 'Eliminar', se borrará permanentemente la linea. Esta acción no podrá ser revertida.",
      en: "By clicking the “Delete” button, the line will be permanently deleted. This action cannot be reversed.",
    };
    return text[globalStore.lang] || text["es"];
  }
  return "";
});
const textConfirm = computed(() => {
  if (!props.readOnly) {
    const text = {
      es: "Eliminar",
      en: "Delete",
    };
    return text[globalStore.lang] || text["es"];
  }
  return "";
});
</script>

<template>
  <div class="divMain">
    <div class="table" v-bind="containerProps">
      <div class="header">
        <div class="col center" v-if="props.page == 'outcomes'">
          <!-- checkbox GlobalTable -->
          <u-checkbox
            v-model="valueAllSelected"
            @click="valueAllSelectedChange()"
          />
        </div>
        <div class="col right">
          <span v-text="labelHeader.code[globalStore.lang]"></span>
        </div>
        <div class="col left">
          <span v-text="labelHeader.line[globalStore.lang]"></span>
        </div>
        <div class="col left">
          <span v-text="labelHeader.movement[globalStore.lang]"></span>
        </div>
        <template v-if="props.page == 'toDocument'">
          <div class="col right">
            <span v-text="'Valor de Compra'"></span>
          </div>
          <div class="col right">
            <span v-text="'Documentado'"></span>
          </div>
          <div class="col right">
            <span v-text="'Por Documentar'"></span>
          </div>
        </template>
        <template v-else>
          <template v-if="props.page == 'outcomes'">
            <div class="col center">
              <!-- ocultar en createOC -->
              <span
                v-text="labelHeader.numberDocuments[globalStore.lang]"
              ></span>
            </div>
          </template>
          <div class="col right">
            <span v-text="labelHeader.quantity[globalStore.lang]"></span>
          </div>
          <div class="col right">
            <span v-text="labelHeader.days[globalStore.lang]"></span>
          </div>
          <div class="col right">
            <span v-text="labelHeader.ot[globalStore.lang]"></span>
          </div>
          <div class="col right">
            <span v-text="labelHeader.unitp[globalStore.lang]"></span>
          </div>
          <div class="col right">
            <span v-text="labelHeader.purchasev[globalStore.lang]"></span>
          </div>
        </template>
        <div class="col right" v-if="!props.readOnly">
          <span
            v-if="props.page == 'outcomes' || props.page == 'toDocument'"
            v-text="labelHeader.tax[globalStore.lang]"
          ></span>
        </div>
      </div>

      <!-- validar cuando llega data vacia -->
      <!-- Mensaje de error -->
      <!-- v-if="outcomesStore.outcomes.length" -->
      <div v-if="list" v-bind="wrapperProps" style="height: auto !important">
        <div class="item" v-for="item in list" :key="item.index">
          <div class="col center" v-if="props.page == 'outcomes'">
            <!-- checkbox line -->
            <u-checkbox
              v-model="item.data.select"
              @click="evaluatedAllSelected"
            />
          </div>
          <div class="col center">
            <div class="truncateTextCustom">
              <span>{{
                (
                  item?.data?.code ||
                  item?.data?.referenceLine?.code ||
                  "-"
                ).trim() || "-"
              }}</span>
            </div>
          </div>
          <div class="col left">
            <div class="truncateTextCustom">
              <span v-text="item.data?.name || ''"></span>
            </div>
          </div>
          <div class="col doble_linea">
            <div>
              <span
                class="truncateTextCustom"
                v-text="item.data?.income?.name || ''"
              ></span>
            </div>
            <div>
              <span
                class="truncateTextCustom"
                v-text="item.data?.income?.project?.name || ''"
              ></span>
            </div>
          </div>
          <template v-if="props.page == 'toDocument'">
            <div class="col right truncateText">
              <span
                v-text="item.data?.numbers?.sumBudget?.value || 'PH'"
              ></span>
            </div>
            <div class="col right truncateText">
              <span
                v-text="item.data?.numbers.documentedNet.value || 'PH'"
              ></span>
            </div>
            <div class="col right truncateText">
              <input
                :class="{ error: !item?.data?.validations?.validate ?? false }"
                v-if="!props.readOnly && item.data.numbers.toBeDocumented.value"
                autocomplete="off"
                type="text"
                :id="`input-grid-${item.index}-1`"
                :value="
                  item.data.numbers.toBeDocumented.tempValue ||
                  item.data.numbers.toBeDocumented.value
                "
                @click="clickInput($event, item)"
                @keydown="
                  handleKeyDown(
                    $event,
                    currencyDefault.typeFormat,
                    currencyDefault.precision,
                    item.data.numbers.budget.tempValue || '',
                    1,
                    item.index
                  )
                "
                @input="
                  handleInputRealTime($event, 'toBeDocumented', item.data)
                "
                @focus="
                  inputEvent(true, 'toBeDocumented', item.data, item.index)
                "
                @blur="
                  inputEvent(false, 'toBeDocumented', item.data, item.index)
                "
              />
              <span v-else>{{ item.data.numbers.toBeDocumented.value }}</span>
            </div>
          </template>
          <template v-else>
            <template v-if="props.page == 'outcomes'">
              <div class="col center truncateText">
                <span v-text="item.data?.numberDocuments || '-'"></span>
              </div>
            </template>
            <div class="col right truncateText">
              <input
                v-if="!props.readOnly"
                autocomplete="off"
                type="text"
                :id="`input-grid-${item.index}-1`"
                :value="
                  item.data.numbers.amount1.tempValue ||
                  item.data.numbers.amount1.value
                "
                @click="clickInput($event, item)"
                @keydown="
                  handleKeyDown(
                    $event,
                    currencyDefault.typeFormat,
                    2,
                    item.data.numbers.amount1.tempValue || '',
                    1,
                    item.index
                  )
                "
                @focus="inputEvent(true, 'amount1', item.data, item.index)"
                @input="handleInputRealTime($event, 'amount1', item.data)"
                @blur="inputEvent(false, 'amount1', item.data, item.index)"
              />
              <span v-else>{{ item.data.numbers.amount1.value }}</span>
            </div>
            <div class="col right truncateText">
              <input
                v-if="!props.readOnly"
                autocomplete="off"
                type="text"
                :id="`input-grid-${item.index}-2`"
                :value="
                  item.data.numbers.amount2.tempValue ||
                  item.data.numbers.amount2.value
                "
                @click="clickInput($event, item)"
                @keydown="
                  handleKeyDown(
                    $event,
                    currencyDefault.typeFormat,
                    2,
                    item.data.numbers.amount2.tempValue || '',
                    2,
                    item.index
                  )
                "
                @focus="inputEvent(true, 'amount2', item.data, item.index)"
                @input="handleInputRealTime($event, 'amount2', item.data)"
                @blur="inputEvent(false, 'amount2', item.data, item.index)"
              />
              <span v-else>{{ item.data.numbers.amount2.value }}</span>
            </div>
            <div class="col right input">
              <input
                v-if="!props.readOnly"
                autocomplete="off"
                type="text"
                :id="`input-grid-${item.index}-3`"
                :value="
                  item.data.numbers.amount3.tempValue ||
                  item.data.numbers.amount3.value
                "
                @click="clickInput($event, item)"
                @keydown="
                  handleKeyDown(
                    $event,
                    currencyDefault.typeFormat,
                    2,
                    item.data.numbers.amount3.tempValue || '',
                    3,
                    item.index
                  )
                "
                @focus="inputEvent(true, 'amount3', item.data, item.index)"
                @input="handleInputRealTime($event, 'amount3', item.data)"
                @blur="inputEvent(false, 'amount3', item.data, item.index)"
              />
              <span v-else>{{ item.data.numbers.amount3.value }}</span>
            </div>
            <div class="col right input">
              <input
                v-if="!props.readOnly"
                autocomplete="off"
                type="text"
                :id="`input-grid-${item.index}-4`"
                :value="
                  item.data.numbers.budget.tempValue ||
                  item.data.numbers.budget.value
                "
                @click="clickInput($event, item)"
                @keydown="
                  handleKeyDown(
                    $event,
                    currencyDefault.typeFormat,
                    currencyDefault.precision,
                    item.data.numbers.budget.tempValue || '',
                    4,
                    item.index
                  )
                "
                @focus="inputEvent(true, 'budget', item.data, item.index)"
                @input="handleInputRealTime($event, 'budget', item.data)"
                @blur="inputEvent(false, 'budget', item.data, item.index)"
              />

              <span v-else>{{ item.data.numbers.budget.value }}</span>
            </div>
            <div
              class="col right truncateText"
              v-if="item?.data?.numbers?.sumBudget?.value || false"
            >
              <span v-text="item.data.numbers.sumBudget.value"></span>
            </div>
          </template>

          <!-- revisar -->
          <div class="col center col-action" v-if="!props.readOnly">
            <button
              @click="modalTax(item, $event)"
              :title="labels.buttons.tax[globalStore.lang]"
              :disabled="outcomesStore.taxes.length === 0"
            >
              <span
                class="u u-taxes"
                :class="item.data?.taxes?.length ? 'selected' : ''"
              ></span>
            </button>

            <button
              v-if="props.page == 'CreateOC'"
              @click="deleteLine(item.data, item.index)"
              :title="labels.buttons.delete[globalStore.lang]"
              :disabled="
                props.page == 'outcomes' &&
                outcomesStore[propertyStoreLines].length === 1
              "
            >
              <span class="u u-close"></span>
            </button>
          </div>
        </div>
      </div>
      <div v-else class="notData">
        <span v-text="labels.config.msgNoData[globalStore.lang]"></span>
      </div>
    </div>

    <div style="width: 400px" v-if="props.showTotals && !props.readOnly">
      <table-taxes-min
        :taxesList="outcomesStore[props.propertyStoreTotals].numbers"
        :heightList="
          (outcomesStore[props.propertyStoreTotals]?.numbers?.taxes?.length ??
            0) *
            32 +
          'px'
        "
      />
    </div>
  </div>
  <div class="tax" v-if="!props.readOnly">
    <div class="tax__header">
      <span>{{ outcomesStore[propertyStoreLines][posLine]?.name || "" }}</span>
      <span class="amount">
        {{
          props.page === "toDocument"
            ? outcomesStore[propertyStoreLines][posLine]?.numbers
                ?.toBeDocumented?.value
            : outcomesStore[propertyStoreLines][posLine]?.numbers?.sumBudget
                ?.value || ""
        }}
      </span>
    </div>
    <div
      class="tax__list"
      :style="`padding-right: ${outcomesStore.taxes.length >= 6 ? 10 : 20}px`"
    >
      <div class="tax__item" v-for="tax in taxesByLine" :key="tax._id">
        <u-switch
          v-model="tax.select"
          @click="handleSwitchTax(tax, posLine)"
          :disabled="readOnlyTax"
        />
        <div class="text">
          <span class="truncateText">{{ tax.name }}</span>
          <strong>({{ tax.value }}%)</strong>
        </div>
        <span class="amount">{{
          formatCurrency(tax.number, currencyDefault)
        }}</span>
      </div>
    </div>
    <div class="tax__footer">
      <div>
        <span>{{ $t("minitaxes.text.tax") }}</span
        ><span class="amount">{{ totalTaxByLine }}</span>
      </div>
      <div>
        <span>{{ $t("minitaxes.text.totalwithtax") }}</span
        ><span class="amount">{{
          outcomesStore?.[propertyStoreLines][posLine]?.numbers?.total?.value ||
          ""
        }}</span>
      </div>
    </div>
  </div>
  <button
    class="btnFloat"
    @click="hideModalTax(posLine)"
    v-if="showTaxModal && !props.readOnly"
  ></button>

  <dialog-confirm
    v-if="!props.readOnly"
    width="600px"
    height="auto"
    :title="titleDialogConfirm"
    :description="descriptionDialogConfirm"
    :showInput="true"
    :confirmationText="textConfirm"
    :actionModal="deleteItemBack"
    :showModal="modalDelete"
    @closeModal="modalDelete = false"
  />
</template>

<style scoped>
span,
button,
input {
  font-family: Nunito;
}
/* General */
.col {
  display: flex;
  align-items: center;
  padding: 0 12px;
  flex-shrink: 1;
}

.center {
  justify-content: center;
}

.left {
  justify-content: flex-start;
}

.right {
  justify-content: flex-end;
}

.divMain {
  padding: 1px;
  overflow: auto;
  gap: 10px;
  width: 100%;
  display: flex;
  flex-direction: column; /* Asegura que los hijos se apilen en columna */
  align-items: flex-end; /* Alinea el contenido a la derecha */
  position: relative;
  height: 100%;
}

.table::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

.table::-webkit-scrollbar-thumb {
  border-radius: 5px;
  background-color: var(--bg-neutral-500);
}

.table::-webkit-scrollbar-track {
  background-color: var(--bg-neutral-300);
  border-radius: 4px;
}

.table {
  min-height: 82px;
  height: fit-content;
  width: 100%;
  position: relative;
  transition: 0.3s;
  border-radius: 18px;
  border: 2px solid var(--neutral-border-subtle);
  box-sizing: border-box;
  flex-shrink: 1; /* Permite que la tabla se encoja cuando sea necesario */
  flex-grow: 0; /* Evita que la tabla crezca más allá de su tamaño contenido */
}

.header {
  position: sticky;
  top: 0;
  z-index: 1;
}
.header,
.item {
  width: 100%;
  height: 40px;
  display: grid;
  grid-template-columns:
    v-bind(
      "props.page == 'outcomes' ? '55px 75px repeat(3, minmax(130px, 1.6fr))' :props.page == 'toDocument' ? '75px  ' : '75px repeat(2, minmax(150px, 2fr))'"
    )
    v-bind(
      "!props.readOnly ? 'repeat(3, minmax(140px, 1fr)) repeat(2, minmax(130px, 1fr)) 80px' : 'repeat(3, minmax(90px, 1fr)) repeat(2, minmax(130px, 1fr))'"
    );
}

.header span,
.item span {
  font-size: 14px;
  font-weight: 600;
  line-height: 18px;
}

.header span {
  color: var(--neutral-text-caption);
}

.item:last-child .col {
  border-bottom: none;
}

.item span {
  color: var(--neutral-text-body);
}

.header .col {
  background-color: var(--neutral-surface-softer);
  border-bottom: 2px solid var(--neutral-border-subtle);
}

.header,
.item .col {
  background-color: var(--neutral-background-default);
  transition: 0.3s;
}

.item:hover .col {
  background-color: var(--primary-surface-shadow-8a);
}

.item .col {
  transition: 0.3s;
  border-bottom: 1px solid var(--neutral-border-subtle);
}

.col-action {
  gap: 8px;
}

.col button {
  display: flex;
  align-items: center;
}

.col button span {
  font-size: 20px;
  font-weight: 400;
  color: var(--neutral-text-caption);
  transition: color 0.3s;
}

.col button:not(:disabled):hover span {
  color: var(--primary-text-subtle);
}

.col button:not(:disabled) span.selected {
  color: var(--primary-text-subtle);
}

.col button:disabled {
  cursor: not-allowed;
}

.col button:disabled span {
  color: var(--neutral-text-disabled);
}

.col input {
  width: 100%;
  height: 24px;
  padding: 0 12px;
  text-align: right;
  border-radius: 8px;
  border: 1px solid var(--neutral-border-subtle);
  font-size: 14px;
  line-height: 24px;
  color: var(--neutral-text-body);
  transition: 0.3s;
  padding-top: 1px;
}

.col > input.error {
  border: 1px solid var(--danger-border-light);
  color: var(--danger-text-default);
}

.col input:hover {
  border: 1px solid var(--primary-border-subtle);
}

.col input:active,
.col input:focus {
  border: none;
  box-shadow: inset 0px 0px 0px 2px rgba(58, 199, 165, 1);
  background-color: var(--primary-surface-shadow-8a);
}

.col input::selection {
  background-color: var(--primary-text-subtle);
  color: var(--neutral-background-default);
}

.notData {
  width: 100%;
  position: sticky;
  left: 0;
  height: 56px;
  display: flex;
  justify-content: center;
  align-items: center;
}

.notData span {
  color: var(--neutral-text-caption);
  text-align: center;
}

.truncateTextCustom {
  display: block;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  align-items: center;
  justify-content: flex-start;
}

.doble_linea {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: flex-start;
  flex-wrap: nowrap;
}

.doble_linea > div {
  width: 100%;
  overflow: hidden;
  display: grid;
  align-items: center;
  align-items: center;
  flex-wrap: nowrap;
}

.doble_linea > div:first-child > span {
  font-weight: 700;
}

.doble_linea > div:last-child > span {
  font-weight: 300;
  color: var(--neutral-text-subtitle);
}

.miniTable {
  color: var(--neutral-text-body);
  border: 1px solid var(--neutral-border-subtle);
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  font-size: 14px;
  flex-grow: 0; /* Evita que la mini tabla crezca más allá de su contenido */
  flex-shrink: 0; /* Evita que la mini tabla se reduzca */
}

.miniTable > div {
  display: grid;
  grid-template-columns: 210px 80px 150px 80px; /* Ajusta el tamaño de cada columna */

  width: 100%; /* Asegura que los div internos no sean más anchos */
  box-sizing: border-box;
  align-content: center;
}

.miniTable > div > div {
  padding-inline: 12px;
}

.miniTable div > div:first-child {
  text-align: left; /* Alinea el primer div de cada fila a la izquierda */
}

.miniTable div > div:not(:first-child) {
  text-align: right; /* Alinea los demás divs de cada fila a la derecha */
}

.AntesImpuestos,
.impuesto,
.Totales {
  background-color: inherit;
  height: 40px;
  font-weight: 600;
}

.tax {
  width: 420px;
  height: auto;
  position: absolute;
  top: v-bind("taxModalY + 'px'");
  left: v-bind("taxModalX + 'px'");
  z-index: 2;
  background-color: var(--neutral-background-default);
  border-radius: 16px;
  padding: 5px 10px 10px 20px;
  box-sizing: border-box;
  box-shadow: var(--shadow-2);
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 16px;
  transition: opacity 0.3s ease, transform 0.3s ease; /* Limit transitions */
  transform-origin: right;
  transform: scale(v-bind("showTaxModal ? 1 : 0"));
}
.tax .tax__list {
  width: 100%;
  overflow-y: auto;
  max-height: 165px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.tax .tax__list::-webkit-scrollbar {
  width: 10px;
  height: 10px;
}
.tax .tax__list::-webkit-scrollbar-thumb {
  border-radius: 5px;
  background-color: var(--bg-neutral-500);
}
.tax .tax__list::-webkit-scrollbar-track {
  background-color: var(--bg-neutral-300);
  border-radius: 4px;
}
.tax .tax__list .tax__item {
  display: grid;
  grid-template-columns: 40px 1fr 120px;
  align-items: center;
}
.tax .tax__list .tax__item span {
  font-size: 14px;
  font-weight: 600;
  line-height: 18px;
  color: var(--neutral-text-body);
}
.tax .tax__list .tax__item > div {
  display: grid;
  grid-template-columns: auto 1fr;
  align-items: center;
  gap: 5px;
  padding: 0 20px;
}
.tax .tax__list .tax__item div strong {
  font-size: 10px;
  color: var(--neutral-text-caption);
}
.tax .tax__header {
  width: 100%;
  border-bottom: 1px solid var(--neutral-border-subtle);
  height: 40px;
  display: grid;
  align-items: center;
  grid-template-columns: 1fr 120px;
  padding-right: 20px;
}
.tax .tax__footer {
  width: calc(100% - 40px);
  height: 80px;
  border-top: 1px solid var(--neutral-border-subtle);
  display: grid;
  grid-template-rows: 40px 40px;
}
.tax .tax__footer div span,
.tax .tax__header span {
  font-size: 14px;
  font-weight: 800;
  line-height: 18px;
  color: var(--neutral-text-body);
}
.tax .tax__footer div span.amount,
.tax .tax__list .tax__item span.amount,
.tax .tax__header span.amount {
  text-align: right;
}
.tax .tax__footer div {
  padding: 0 20px;
  display: grid;
  align-items: center;
  grid-template-columns: 1fr 120px;
}
.tax .tax__footer div:nth-child(2) {
  background-color: var(--primary-surface-shadow-12a);
  border-radius: 14px;
}
.btnFloat {
  height: calc(100%);
  position: fixed;
  width: calc(100%);
  z-index: 1;
  top: 0px;
  left: 0px;
}
</style>
