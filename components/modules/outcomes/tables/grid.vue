<script setup>
import { defineProps, computed, onMounted, ref } from "vue";
import { useVirtualList } from "@vueuse/core";
import useOutcomesStore from "@/stores/outcomes";
import useGlobalStore from "@/stores/global";
import {
  convertToNumber,
  formatCurrency,
  getValueFormaRealTime,
} from "@/utils/formatAmount";
import {
  generateRandomId,
  debounce,
  transformedDate,
  getNameStatus,
} from "@/utils/helpers";

// Emits
const emit = defineEmits(["refreshData", "updateMetrics", "deselect"]);

// Stores
const outcomesStore = useOutcomesStore();
const globalStore = useGlobalStore();

// Props
const props = defineProps({
  lines: {
    type: Array,
    default: () => [],
  },
  taxes: {
    type: Object,
    default: () => {},
  },
  availableTaxes: {
    type: Array,
    default: () => [],
  },
  config: {
    type: Object,
    default: () => ({
      width: "100vw",
      modal: false,
      maxHeight: "530px",
      columns: {
        checkbox: true,
        code: true,
        name: true,
        origin: true,
        status: false,
        quantity: true,
        days: true,
        ot: true,
        price: true,
        total: true,
        totalAction: true,
        documented: true,
        documentedAction: true,
        toDocument: false,
        toDocumentAction: false,
        delete: false,
      },
    }),
  },
  updateBackend: {
    type: Boolean,
    default: true,
  },
  currency: {
    type: Object,
    default: () => ({}),
  },
  // convertCurrencyOnDocumenting: { // Se usa para convertir moneda al momento de documentar
  //   type: Boolean,
  //   default: false,
  // },
  autoCalc: {
    type: Boolean,
    default: false,
  },
  buyModal: {
    type: Boolean,
    default: false,
  },
  readOnly: {
    type: Boolean,
    default: false,
  },
  compare: {
    type: Boolean,
    default: false,
  },
  toDocument: {
    type: Boolean,
    default: false,
  },
  view: {
    type: String,
    default: "", // purcharse | createPurchase
  },
  disabled: {
    type: Boolean,
    default: false,
  },
});

// Computed
const computedList = computed(() => props.lines);

// Virtual List
const { list, containerProps, wrapperProps } = useVirtualList(computedList, {
  itemHeight: 40,
});

// Constants
const { t } = useI18n();
const module = "modules.outcomes.pages.oc.sections.purchases.table";
const allSelected = ref(false);
const posMenu = ref({ x: 40, y: 40 });
const posDocs = ref({ x: 40, y: 40 });
const showMenu = ref(false);
const showDocsByLine = ref(false);
const currentLine = ref(null);

const debounceTimeout = ref(null);
const DEBOUNCE_DELAY = 4000;

const divId = generateRandomId("grid", 2);

// Mounted
onMounted(() => {
  selectedOneList();
  document.addEventListener("click", (event) => {
    setTimeout(() => {
      const menu = document.querySelector(".menu");
      const docs = document.querySelector(".docs");

      const clickFueraDeMenu = menu && !menu.contains(event.target);
      const clickFueraDeDocs = docs && !docs.contains(event.target);

      if (clickFueraDeMenu && clickFueraDeDocs) {
        showMenu.value = false;
        showDocsByLine.value = false;
      }
    }, 0);
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      showMenu.value = false;
      showDocsByLine.value = false;
    }
  });

  if (props.buyModal) {
    outcomesStore.formPO.lines.forEach((line) => {
      line.numbers.budget = line.numbers.toSpend;
      handleChangeNumber("budget", { data: line });
    });
  }

  setTimeout(() => {
    if (props.autoCalc) {
      calculateTotals();
    }
  });

  // Aqui se formateo los valores de las lineas de acuerdo a la moneda
  // if (props.convertCurrencyOnDocumenting) {
  //   props.lines.forEach(line => {
  //     const { sumBudget, documentedNet, toDocument } = line?.numbers || {};

  //     if (outcomesStore.outcome.currency.default._id !== outcomesStore.formDocumenting.currency._id) {
  //       const otherCurrencyDefault = outcomesStore.formDocumenting.othersCurrency.find(
  //         c => c._id === outcomesStore.outcome.currency.default._id
  //       );

  //       const rate = Number(otherCurrencyDefault?.value.replace(/,/g, ''));

  //       // Lista de campos a convertir
  //       const fields = { sumBudget, documentedNet, toDocument };

  //       Object.entries(fields).forEach(([key, field]) => {
  //         if (field) {
  //           const convertedNumber = field.number * rate;
  //           const formatted = formatData(convertedNumber, props.currency);

  //           Object.assign(line.numbers[key], {
  //             value: formatted.value,
  //             numberAprox: formatted.numberAprox,
  //             number: formatted.numberAprox,
  //           });
  //         }
  //       });
  //     }
  //   });
  // }
});

// Function
const selectContent = (event) => {
  event.target.select();
};
const selectedAllList = () => {
  props.lines.forEach((line) => (line.select = allSelected.value));
};
const selectedOneList = () => {
  allSelected.value =
    props.lines.length > 0 && props.lines.every((line) => line.select === true);
};
const getPurchaseValue = (line) => {
  const data = line.numbers;
  const unit = data.amount1.number;
  const qty = data.amount2.number;
  const ot = data.amount3.number;
  const price = data.budget.number;
  const result = unit * qty * (ot || 1) * price;
  return result;
};
const calculateTotals = () => {
  const currency = { ...props.currency };

  let subTotal = 0;
  let taxNumber = 0;
  let retentionNumber = 0;
  const taxMap = new Map();

  props.lines.forEach((line) => {
    const amount =
      line.numbers?.[props.toDocument ? "toDocument" : "sumBudget"]?.number ||
      0;
    subTotal += amount;

    line.numbers?.taxes?.forEach((tax) => {
      const taxValue = tax?.total?.number || 0;

      if (tax?.retention) {
        retentionNumber -= taxValue;
      } else {
        taxNumber += taxValue;
      }

      if (taxMap.has(tax?.tax)) {
        const existingTax = taxMap.get(tax.tax);
        existingTax.total.number += taxValue;
        existingTax.total = formatData(existingTax?.total?.number, currency);
        //Si al menos una línea lo tiene seleccionado, marcarlo como seleccionado
        existingTax.select = existingTax.select || tax.select;
      } else {
        taxMap.set(tax.tax, {
          tax: tax.tax,
          name: tax.name,
          retention: tax.retention,
          value: tax.value,
          total: formatData(taxValue, currency),
          select: tax.select,
        });
      }
    });
  });

  const newTotals = {
    subTotal,
    taxes: Array.from(taxMap.values()),
    taxNumber,
    retentionNumber,
    total: subTotal + taxNumber + retentionNumber,
  };

  if (props.taxes) {
    // Impuestos (ahora cada uno tiene la propiedad 'select')
    props.taxes.taxes = newTotals.taxes;

    // Subtotal
    props.taxes.totalNet = {
      lastNumber: props.taxes?.totalNet?.number || "0",
      lastValue: props.taxes?.totalNet?.value || "",
      ...formatData(newTotals.subTotal, currency),
    };

    // Impuestos
    props.taxes.totalTaxAddition = {
      lastNumber: props.taxes?.totalTaxAddition?.number || "0",
      lastValue: props.taxes?.totalTaxAddition?.value || "",
      ...formatData(newTotals.taxNumber, currency),
    };

    // Retenciones
    props.taxes.totalRetencion = {
      lastNumber: props.taxes?.totalRetencion?.number || "0",
      lastValue: props.taxes?.totalRetencion?.value || "",
      ...formatData(newTotals.retentionNumber, currency),
    };

    // Total
    props.taxes.total = {
      lastNumber: props.taxes?.totalTax?.number || "0",
      lastValue: props.taxes?.totalTax?.value || "",
      ...formatData(newTotals.total, currency),
    };
  }

  if (!props.buyModal) {
    const total = props.toDocument
      ? props.taxes.documented.value
      : props.taxes.totalNet.value;
    emit("updateMetrics", total);
  }
};
const deselect = (pos) => {
  if (list.value.length !== 1) {
    emit("deselect", pos);
    calculateTotals();
  }
};

// Mostrar Menu de Taxes
const showTaxes = ($event, line) => {

  // Si el menú ya está abierto para esta misma línea, lo cerramos
  if (showMenu.value && currentLine.value?.posLine === line.index) {
    showMenu.value = false;
    return;
  }

  const currency = { ...props.currency };

  // recalcular si la línea no trae taxes cargados previamente
  // o si no tiene total.number cargado
  // if (!line.data.numbers.taxes || line.data.numbers.taxes.length === 0) {
  //   line.data.numbers.taxes = calcTax(line.data, currency);
  // }
  line.data.numbers.taxes = calcTax(line.data, currency);

  currentLine.value = JSON.parse(
    JSON.stringify({ ...line.data, posLine: line.index }),
  );

  calcPositionPopUp($event, true);

  setTimeout(() => {
    showMenu.value = true;
  }, 10);
};

const calcTax = (line, currency) => {
  const savedTaxes = line.numbers?.taxes || [];
  const newTaxes = [];

  props.availableTaxes.forEach((avaTax) => {
    const saved = savedTaxes.find((t) => t.tax === (avaTax._id || avaTax.tax));

    const isActive = line?.taxes?.includes(avaTax._id || avaTax.tax);

    let matchTax = {
      name: avaTax?.name || "",
      retention: avaTax.retention,
      tax: avaTax._id || avaTax.tax,
      value: avaTax.value,
      isEditTax: avaTax?.surchargesDocumentType?.field === "editValue",
      select: false,
      total: formatData(0, currency),
      manuallyEdited: false,
    };

    // Detectar si viene con valores personalizados del backend
    if (matchTax.isEditTax && saved) {
      // Verificar si el porcentaje guardado es DIFERENTE al original
      const hasCustomPercentage = saved.value && saved.value !== avaTax.value;

      // Verificar si tiene un total guardado diferente de 0
      const hasCustomTotal = saved.total && saved.total.number !== 0;

      // Si tiene porcentaje O total personalizado → fue editado antes
      const wasEditedBefore =
        hasCustomPercentage || hasCustomTotal || saved.manuallyEdited;

      if (wasEditedBefore) {
        // Restaurar valores personalizados del backend
        matchTax.total = { ...saved.total };
        matchTax.value = saved.value; // usando porcentaje personalizado
        matchTax.select = saved.select ?? isActive ?? false;
        matchTax.manuallyEdited = true; //  Marcar como editado

        newTaxes.push(matchTax);
        return;
      }
    }

    //  Si está activo (editable o no, sin personalizar)
    if (isActive) {
      const calc = taxApplied(
        avaTax,
        line.numbers[props.toDocument ? "toDocument" : "sumBudget"]?.number,
      );
      const total = formatData(calc, currency);

      matchTax.total = { ...total };
      matchTax.select = true;

      if (saved) {
        matchTax.manuallyEdited = saved.manuallyEdited || false;
      }
    }

    newTaxes.push(matchTax);
  });

  line.numbers.taxes = newTaxes;
  return newTaxes;
};
const calcPositionPopUp = (event, isTax) => {
  const button = event.target; // Asegurar que accedemos correctamente al botón
  const buttonRect = button.getBoundingClientRect();
  const container = document.getElementById("newMiniGrid");

  if (!container) {
    console.error("El contenedor con ID 'newMiniGrid' no se encontró.");
    return;
  }

  const containerRect = container.getBoundingClientRect();

  const posX = buttonRect.left - containerRect.left;
  const posY = buttonRect.top - containerRect.top;

  const axes = { x: `${posX - (isTax ? 480 : 486)}px`, y: `${posY + 20}px` };

  if (isTax) posMenu.value = axes;
  else posDocs.value = axes;
};

const changeStateTax = async () => {
  let currency = { ...props.currency };

  // 1. Detectar qué impuestos editables cambiaron de estado
  const taxStateChanges = new Map();

  currentLine.value.numbers.taxes.forEach((tax) => {
    if (tax.isEditTax) {
      const oldTax = props.lines[
        currentLine.value.posLine
      ]?.numbers?.taxes?.find((t) => t.tax === tax.tax);

      const wasSelected = oldTax?.select ?? false;
      const isNowSelected = tax.select;

      if (wasSelected !== isNowSelected) {
        taxStateChanges.set(tax.tax, {
          wasActive: wasSelected,
          isNowActive: isNowSelected,
          shouldRecalculate: !wasSelected && isNowSelected, // Se activó
        });
      }
    }
  });

  // 2. Guardar valores editados SOLO de impuestos que fueron editados manualmente
  const editedTaxValues = {};

  currentLine.value.numbers.taxes.forEach((tax) => {
    if (tax.isEditTax && tax.manuallyEdited) {
      // 👈 SOLO si fue editado manualmente
      const change = taxStateChanges.get(tax.tax);

      // Solo preservar si NO se está reactivando
      if (!change?.shouldRecalculate) {
        editedTaxValues[tax.tax] = {
          total: { ...tax.total },
          value: tax.value,
          select: tax.select,
          manuallyEdited: true, // IMPORTANTE: Preservar el flag
        };
      }
    }
  });

  // 3. Actualizar la lista de impuestos seleccionados
  currentLine.value.taxes = currentLine.value.numbers.taxes
    .filter((t) => t.select)
    .map((t) => t.tax);

  // 4. Recalcular taxes
  currentLine.value.numbers.taxes = calcTax(currentLine.value, currency);

  // 5. RESTAURAR valores editados manualmente O CALCULAR SI NO FUE EDITADO
  currentLine.value.numbers.taxes = currentLine.value.numbers.taxes.map(
    (tax) => {
      const saved = editedTaxValues[tax.tax];
      const change = taxStateChanges.get(tax.tax);

      // Si NO es editable → retornar tal cual
      if (!tax.isEditTax) return tax;

      // Si se REACTIVÓ → ya fue recalculado, dejarlo así
      if (change?.shouldRecalculate) {
        tax.manuallyEdited = false; // Reset del flag al reactivar
        return tax;
      }

      // Si está DESACTIVADO → poner en 0
      if (!tax.select) {
        tax.total = formatData(0, currency);
        tax.value = 0;
        tax.select = false;
        tax.manuallyEdited = false; // Reset del flag al desactivar

        currentLine.value.taxes = currentLine.value.taxes.filter(
          (id) => id !== tax.tax,
        );

        return tax;
      }

      // Si fue editado manualmente → restaurar valores
      if (saved?.manuallyEdited) {
        tax.total = { ...saved.total };
        tax.value = saved.value;
        tax.select = saved.select;
        tax.manuallyEdited = true; // 👈 Mantener el flag
      }
      // Si NO fue editado manualmente → ya está recalculado por calcTax

      return tax;
    },
  );

  // 6. Actualizar lista principal
  const pos = currentLine.value.posLine;
  props.lines[pos] = currentLine.value;
  list.value[pos].data = currentLine.value;

  // 7. Recalcular totales generales
  calculateTotals();

  // 8. Guardar en backend
  if (props.updateBackend) {
    await outcomesStore.updateOutcomeLines(currentLine.value);
    resetSyncDebounce();
  }
};

const taxApplied = (tax, amount) => {
  const { value, retention } = tax;
  let factor = 1;
  // Si es retencion
  // if (retention) {
  //   // factor = value / (100 - value); // formula complicada
  //   factor = value / 100;
  // }
  // // No es Retencion
  // else {
  // }
  factor = value / 100;
  return amount * factor;
};
const menuLineTaxSum = computed(() => {
  if (currentLine.value) {
    let sum = 0;
    const currency = { ...props.currency };
    currentLine?.value?.numbers?.taxes.forEach((tax) => {
      if (tax.retention) {
        sum -= tax.total.number;
      } else {
        sum += tax.total.number;
      }
    });
    const totalTax = formatData(sum, currency);
    const sumBudget =
      currentLine.value?.numbers?.[
        props.toDocument ? "toDocument" : "sumBudget"
      ]?.number || 0;
    const total = formatData(sum + sumBudget, currency);
    return { total, totalTax };
  }
  return {
    total: { value: "-", number: "-" },
    taxTax: { value: "-", number: "-" },
  };
});

// Mostrar Menu de Docs
const showDocs = async ($event, line) => {
  if (line.data.numberDocuments > 0) {
    try {
      globalStore.loading = true;
      console.log("line", line);
      currentLine.value = JSON.parse(JSON.stringify(line));
      currentLine.value.docs = await outcomesStore.documentLinesByLine(
        line.data._id,
      );
      console.log("currentLine", currentLine.value);
      calcPositionPopUp($event, false);
      setTimeout(() => {
        showDocsByLine.value = true;
      }, 10);
    } catch (error) {
      console.error(error);
    } finally {
      globalStore.loading = false;
    }
  }
};

// Eventos
const handleKeyDown = debounce(async (e) => {
  const currentInput = e.target.id;
  const parts = currentInput.split("-");
  const x = Number(parts[1] ?? 0);
  const y = Number(parts[2] ?? 0);
  const key = e.key;

  // Entrar a recorrer
  if (["ArrowDown", "ArrowUp", "ArrowLeft", "ArrowRight"].includes(key)) {
    // Hacia Abajo
    if (key === "ArrowDown") {
      if (x === props.lines.length - 1) {
        // lo mando al X = 0 y Y se mantiene
        focusInput(`${divId}-0-${y}`);
      } else {
        focusInput(`${divId}-${x + 1}-${y}`);
      }
    }
    // Hacia Arriba
    if (key === "ArrowUp") {
      if (x === 0) {
        // lo mando al X al final y Y se mantiene
        focusInput(`${divId}-${props.lines.length - 1}-${y}`);
      } else {
        focusInput(`${divId}-${x - 1}-${y}`);
      }
    }
    // Hacia la Derecha
    if (key === "ArrowRight") {
      if (y === 3) {
        // el x se mantiene y Y va al 0
        focusInput(`${divId}-${x}-0`);
      } else {
        focusInput(`${divId}-${x}-${y + 1}`);
      }
    }
    // Hacia la Izquierda
    if (key === "ArrowLeft") {
      if (y === 0) {
        // el x se mantiene y Y va al final
        focusInput(`${divId}-${x}-3`);
      } else {
        focusInput(`${divId}-${x}-${y - 1}`);
      }
    }
  }

  // Escape
  if (key === "Escape") {
    e.target.blur();
  }
}, 10);
const focusInput = (id) => {
  const input = document.getElementById(id);
  if (input) {
    input.focus();
    setTimeout(() => input.select(), 10);
  } else {
    console.warn(`No se encontró el input con id: ${id}`);
  }
};
const handleInputChange = debounce((event, prop, line) => {
  line = line.data;
  const rawValue = event.target.value.replace(/[a-zA-Z]/g, "");
  line.numbers[prop].value = rawValue;
  const currency = { ...props.currency };
  const numbers = getValueFormaRealTime(rawValue, currency, prop);
  if (numbers) {
    //actualiza valor numerico
    line.numbers[prop].number = numbers.numericValue;
    // Actualiza el valor temporal en tiempo real
    line.numbers[prop].tempValue = numbers.formattedValue;
  }
}, 10);
const handleKeyDownGrid = debounce((event, prop, line) => {
  // Asegúrate de que `currentValue` sea una cadena válida
  let currentValue = (line.data.numbers[prop].tempValue || "").toString();

  // Obtén la configuración de formato
  const currency = { ...props.currency };
  const typeFormat = currency.typeFormat;
  const precision = prop.includes("amount") ? 2 : currency.precision;

  // Define el separador decimal y de miles
  const decimalSeparator = typeFormat === "de-DE" ? "," : ".";
  const navigationKeys = ["ArrowDown", "ArrowUp", "ArrowLeft", "ArrowRight"];
  const controlKeys = ["Backspace", "Delete", "Tab"];

  // Navegación con flechas
  if (navigationKeys.includes(event.key)) {
    handleKeyDown(event);
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

  // Bloquear entrada de separador decimal si `precision` es 0
  if (precision === 0 && event.key === decimalSeparator) {
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
}, 10);
const onFocusInput = (event, prop, line) => {
  const id = event.target.id;
  line = line.data;

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
};
const onBlurInput = (event, prop, line) => {
  line = line.data;

  try {
    // Aplica el formato final
    const precision = Number.isInteger(line.numbers[prop].number) ? 0 : 2;

    const currency = { ...props.currency };
    if (prop.includes("amount")) {
      currency.symbol = "";
      currency.precision = precision;
    }
    line.numbers[prop].value = formatCurrency(
      line.numbers[prop].number,
      currency,
      true,
    );
    // Limpia el valor temporal
    delete line.numbers[prop].tempValue;
  } catch (error) {
    console.error("Error al formatear el valor:", error);
    line.numbers[prop].number = 0;
    delete line.numbers[prop].tempValue;
  }
};
const handleChangeNumber = debounce(async (prop, line) => {
  try {
    line = line.data;
    let currency = { ...props.currency };

    const formatVal = formatData(
      line?.numbers?.[prop]?.number || 0,
      prop.includes("amount")
        ? { ...currency, symbol: "", precision: 2 }
        : currency,
    );
    line.numbers[prop].value = formatVal.value;
    line.numbers[prop].numberAprox = formatVal.numberAprox;

    const newValSumBudget = getPurchaseValue(line);
    const newValSumBudgetWithFormat = formatData(newValSumBudget, currency);
    line.numbers.sumBudget = {
      lastNumber: line.numbers.sumBudget.number,
      lastValue: formatCurrency(
        line.numbers.sumBudget.number,
        currency.typeFormat,
        true,
      ),
      number: newValSumBudgetWithFormat.number,
      numberAprox: newValSumBudgetWithFormat.numberAprox,
      value: newValSumBudgetWithFormat.value,
    };

    // 👇 RECALCULAR TAXES (respetando manuallyEdited)
    const newTaxes = calcTax(line, currency);
    line.numbers.taxes = newTaxes;

    delete line.numbers[prop].tempValue;
    calculateTotals();

    if (props.updateBackend) {
      await outcomesStore.updateOutcomeLines(line);
      resetSyncDebounce();
    }
  } catch (e) {
    console.error(e);
  }
}, 10);
const handleChangeToDocument = debounce(async (line) => {
  line = line.data;
  const currency = { ...props.currency };
  const newValToDocument = line.numbers.toDocument.number;
  const newValToDocumentWithFormat = formatData(newValToDocument, currency);

  line.numbers.toDocument = {
    lastNumber: line.numbers.toDocument.lastNumber,
    lastValue: line.numbers.toDocument.lastValue,
    number: newValToDocumentWithFormat.number,
    numberAprox: newValToDocumentWithFormat.numberAprox,
    value: newValToDocumentWithFormat.value,
  };

  // Limpia el valor temporal
  delete line.numbers.toDocument.tempValue;

  // Calcular impuestos de la linea
  const newTaxes = calcTax(line, currency);
  line.numbers.taxes = newTaxes;

  calculateTotals();
}, 10);
const formatData = (number, currency) => {
  const { precision, typeFormat } = currency;
  const numberAprox = convertToNumber(number, typeFormat, precision);
  return {
    number,
    value: formatCurrency(numberAprox, currency, true),
    numberAprox,
  };
};
const resetSyncDebounce = () => {
  // Reiniciar el temporizador si ya había uno
  if (debounceTimeout.value) {
    clearTimeout(debounceTimeout.value);
  }

  // Esperar 7 segundos desde el último cambio antes de consultar al backend
  debounceTimeout.value = setTimeout(async () => {
    await compareFrontBack();
  }, DEBOUNCE_DELAY);
};
const compareFrontBack = async () => {
  await outcomesStore.get_outcomes(outcomesStore.outcome._id);
  const totalFront = props.taxes?.total?.number;
  const totalBack = outcomesStore?.outcome?.numbers?.total?.number;
  if (totalFront !== totalBack) emit("refreshData");
};

// Handler para editar impuestos manualmente
const handleInputChangeTax = debounce((event, tax, t) => {
  const rawValue = event.target.value.replace(/[a-zA-Z]/g, "");
  const currency = { ...props.currency };
  const numbers = getValueFormaRealTime(rawValue, currency, "tax");

  if (numbers) {
    // Actualiza valor temporal en tiempo real
    currentLine.value.numbers.taxes[t].total.tempValue = numbers.formattedValue;
    currentLine.value.numbers.taxes[t].total.number = numbers.numericValue;
  }
}, 10);

const handleKeyDownTax = debounce((event, tax, t) => {
  const currentValue = (
    currentLine.value.numbers.taxes[t].total.tempValue || ""
  ).toString();
  const currency = { ...props.currency };
  const typeFormat = currency.typeFormat;
  const precision = currency.precision;

  const decimalSeparator = typeFormat === "de-DE" ? "," : ".";
  const controlKeys = ["Backspace", "Delete", "Tab", "Escape"];

  // Permitir teclas de control
  if (controlKeys.includes(event.key)) {
    return;
  }

  // Permitir sobrescribir si todo está seleccionado
  const inputElement = event.target;
  const isAllSelected =
    inputElement.selectionStart === 0 &&
    inputElement.selectionEnd === inputElement.value.length;

  if (isAllSelected) {
    return;
  }

  // Bloquear teclas no válidas
  if (!/^[0-9]$/.test(event.key) && event.key !== decimalSeparator) {
    event.preventDefault();
    return;
  }

  // Bloquear entrada de separador decimal si precision es 0
  if (precision === 0 && event.key === decimalSeparator) {
    event.preventDefault();
    return;
  }

  // Verificar número máximo de decimales
  if (currentValue.includes(decimalSeparator)) {
    const [_, decimalPart] = currentValue.split(decimalSeparator);
    if (decimalPart && decimalPart.length >= precision) {
      event.preventDefault();
      return;
    }
  }
}, 10);

const onFocusTaxInput = (event, tax, t) => {
  const currency = { ...props.currency };

  // LIMITAR DECIMALES según la precisión de la moneda
  const currentNumber = currentLine.value.numbers.taxes[t].total.number;
  const limitedNumber = Number(currentNumber.toFixed(currency.precision));

  // Elimina el formato para edición con los decimales limitados
  currentLine.value.numbers.taxes[t].total.tempValue = limitedNumber;
  currentLine.value.numbers.taxes[t].total.lastNumber = limitedNumber;
  currentLine.value.numbers.taxes[t].total.lastValue =
    currentLine.value.numbers.taxes[t].total.value;

  setTimeout(() => {
    event.target.select();
  }, 0);
};
// Viejo onFocusTaxInput (decimales largos)
// const onFocusTaxInput = (event, tax, t) => {
//   // Elimina el formato para edición
//   currentLine.value.numbers.taxes[t].total.tempValue = currentLine.value.numbers.taxes[t].total.number;
//   currentLine.value.numbers.taxes[t].total.lastNumber = currentLine.value.numbers.taxes[t].total.number;
//   currentLine.value.numbers.taxes[t].total.lastValue = currentLine.value.numbers.taxes[t].total.value;

//   setTimeout(() => {
//     event.target.select();
//   }, 0);
// };

const onBlurTaxInput = (event, tax, t) => {
  try {
    const currency = { ...props.currency };
    const formatted = formatCurrency(
      currentLine.value.numbers.taxes[t].total.number,
      currency,
      true,
    );
    currentLine.value.numbers.taxes[t].total.value = formatted;
    delete currentLine.value.numbers.taxes[t].total.tempValue;
  } catch (error) {
    console.error("Error al formatear el valor del impuesto:", error);
    currentLine.value.numbers.taxes[t].total.number = 0;
    delete currentLine.value.numbers.taxes[t].total.tempValue;
  }
};

const handleInputEditTax = debounce(async (event, tax, t) => {
  try {
    const currency = { ...props.currency };

    const numericValue = currentLine.value.numbers.taxes[t].total.number;
    const formatted = formatData(numericValue, currency);

    currentLine.value.numbers.taxes[t].total = {
      number: formatted.number,
      numberAprox: formatted.numberAprox,
      value: formatted.value,
    };

    const baseAmount =
      currentLine.value.numbers[props.toDocument ? "toDocument" : "sumBudget"]
        .number;

    if (baseAmount > 0) {
      const newPercentage = (numericValue / baseAmount) * 100;
      currentLine.value.numbers.taxes[t].value = Number(
        newPercentage.toFixed(2),
      );
    }

    // MARCAR COMO EDITADO MANUALMENTE
    currentLine.value.numbers.taxes[t].manuallyEdited = true;

    props.lines[currentLine.value.posLine].numbers.taxes[t] = {
      ...currentLine.value.numbers.taxes[t],
    };

    if (!currentLine.value.taxes.includes(tax.tax)) {
      currentLine.value.taxes.push(tax.tax);
      currentLine.value.numbers.taxes[t].select = true;
    }

    props.lines[currentLine.value.posLine] = currentLine.value;
    list.value[currentLine.value.posLine].data = currentLine.value;

    calculateTotals();

    if (props.updateBackend) {
      globalStore.loading = true;
      await outcomesStore.updateOutcomeLines(currentLine.value);
      resetSyncDebounce();
      globalStore.loading = false;
    }
  } catch (error) {
    console.error("Error al editar impuesto:", error);
  }
}, 300);

// Computed
const widthTable = computed(() => {
  if (props?.config?.modal) {
    return props?.config?.width || "100%";
  } else {
    return globalStore.sliderExpand
      ? "calc(100vw - 318px)"
      : "calc(100vw - 160px)";
  }
});

const gridTable = computed(() => {
  let columns = [];
  // Checkbox
  if (props?.config?.columns?.checkbox) {
    columns.push("auto");
  }
  // Code
  if (props?.config?.columns?.code) {
    columns.push("100px");
  }
  // Name
  if (props?.config?.columns?.name) {
    columns.push("minmax(240px, 1fr)");
  }
  // Origin
  if (props?.config?.columns?.origin) {
    columns.push("minmax(200px, 1fr)");
  }
  // Status
  if (props?.config?.columns?.status) {
    columns.push("minmax(100px, 1fr)");
  }
  // Quantity
  if (props?.config?.columns?.quantity) {
    columns.push("85px");
  }
  // Days
  if (props?.config?.columns?.days) {
    columns.push("85px");
  }
  // OT
  if (props?.config?.columns?.ot) {
    columns.push("85px");
  }
  // Price
  if (props?.config?.columns?.price) {
    columns.push("160px");
  }
  // Total
  if (props?.config?.columns?.total) {
    columns.push("160px");
  }
  if (props?.config?.columns?.totalAction && !props.readOnly)
    columns.push("40px");
  // Documented
  if (props?.config?.columns?.documented) {
    columns.push("155px");
  }
  if (props?.config?.columns?.documentedAction && !props.readOnly)
    columns.push("50px");
  // To Document
  if (props?.config?.columns?.toDocument) {
    columns.push("160px");
  }
  if (props?.config?.columns?.toDocumentAction && !props.readOnly)
    columns.push("50px");
  // Eliminar lineas
  if (props?.config?.columns?.delete && !props.readOnly) columns.push("50px");
  return columns.join(" ");
});

// Pures
const compareAmounts = (line) => {
  return props.compare &&
    !props.readOnly &&
    line?.data?.numbers?.documentedNet?.value !==
      line?.data?.numbers?.sumBudget?.value
    ? "compareAmounts"
    : "";
};
const getNameDocument = (idDoc) => {
  const docType = outcomesStore.documentTypes.find((doc) => doc._id === idDoc);
  return docType?.name || "-";
};
defineExpose({
  calcTax,
  calculateTotals,
});
</script>

<template>
  <div class="gridContainer">
    <div
      class="grid"
      v-bind="containerProps"
      id="newMiniGrid"
      @scroll="
        showMenu = false;
        showDocsByLine = false;
      "
    >
      <div class="grid__header">
        <div
          v-if="props?.config?.columns?.checkbox"
          class="grid__header-item center"
        >
          <u-checkbox
            :disabled="props.disabled || list.some((l) => l.data.isClosedLine)"
            :height="18"
            v-model="allSelected"
            @click="selectedAllList"
          />
        </div>
        <div
          v-if="props?.config?.columns?.code"
          class="grid__header-item right"
        >
          <span v-text="t(module + '.headers.code')"></span>
        </div>
        <div v-if="props?.config?.columns?.name" class="grid__header-item left">
          <span v-text="t(module + '.headers.line')"></span>
        </div>
        <div
          v-if="props?.config?.columns?.origin"
          class="grid__header-item left"
        >
          <span v-text="t(module + '.headers.origin')"></span>
        </div>
        <div
          v-if="props?.config?.columns?.status"
          class="grid__header-item left"
        >
          <span v-text="t(module + '.headers.status')"></span>
        </div>
        <div
          v-if="props?.config?.columns?.quantity"
          class="grid__header-item right"
        >
          <span v-text="t(module + '.headers.quantity')"></span>
        </div>
        <div
          v-if="props?.config?.columns?.days"
          class="grid__header-item right"
        >
          <span v-text="t(module + '.headers.days')"></span>
        </div>
        <div v-if="props?.config?.columns?.ot" class="grid__header-item right">
          <span v-text="t(module + '.headers.ot')"></span>
        </div>
        <div
          v-if="props?.config?.columns?.price"
          class="grid__header-item right"
        >
          <span v-text="t(module + '.headers.price')"></span>
        </div>
        <div
          v-if="props?.config?.columns?.total"
          class="grid__header-item right"
        >
          <span
            v-text="
              t(module + '.headers.total') +
              ' [' +
              (outcomesStore?.formPO?.currency?.code ||
                outcomesStore?.outcome?.currency?.default?.code) +
              ']'
            "
          ></span>
        </div>
        <div
          v-if="props?.config?.columns?.totalAction && !props.readOnly"
          class="grid__header-item center"
        ></div>
        <div
          v-if="props?.config?.columns?.documented"
          class="grid__header-item right"
        >
          <span
            v-text="
              t(module + '.headers.documented') +
              ' [' +
              outcomesStore?.outcome?.currency?.default?.code +
              ']'
            "
          ></span>
        </div>
        <div
          v-if="props?.config?.columns?.documentedAction && !props.readOnly"
          class="grid__header-item center"
        ></div>
        <div
          v-if="props?.config?.columns?.toDocument"
          class="grid__header-item right"
        >
          <span
            v-text="
              t(module + '.headers.toDocument') +
              ' [' +
              (outcomesStore?.formDocumenting?.currency?.code ||
                outcomesStore?.outcome?.currency?.default?.code) +
              ']'
            "
          ></span>
        </div>
        <div
          v-if="props?.config?.columns?.toDocumentAction && !props.readOnly"
          class="grid__header-item center"
        ></div>
        <div
          v-if="props?.config?.columns?.delete && !props.readOnly"
          class="grid__header-item center"
        ></div>
      </div>
      <div class="grid__list" v-bind="wrapperProps" v-if="list.length">
        <div class="grid__item" v-for="line in list" :key="line">
          <div
            v-if="props?.config?.columns?.checkbox"
            class="grid__item-col center"
          >
            <u-checkbox
              :height="18"
              v-model="line.data.select"
              @click="selectedOneList"
              :disabled="props.disabled || line.data.isClosedLine"
            />
          </div>
          <div v-if="props?.config?.columns?.code" class="grid__item-col right">
            <span v-text="line.data.code || '-'"></span>
          </div>
          <div v-if="props?.config?.columns?.name" class="grid__item-col left">
            <div class="originLine">
              <span
                v-text="line.data.name"
                class="truncateText"
                :title="line.data.name"
              ></span>
              <!-- Aqui va la categoria de la linea -->
              <span
                class="truncateText category"
                v-text="
                  line?.data?.parent?.name ||
                  line?.data?.referenceLine?.parent?.name ||
                  '-'
                "
              >
              </span>
            </div>
          </div>
          <div
            v-if="props?.config?.columns?.origin"
            class="grid__item-col left"
          >
            <div class="origin">
              <a
                :href="`/incomesv2/project/${line?.data?.income?.project?._id}/income/${line?.data?.income?._id}`"
                target="_blank"
                rel="noopener noreferrer"
                v-text="line?.data?.income?.name || '-'"
                class="truncateText"
                :title="line?.data?.income?.name || '-'"
              >
              </a>
              <a
                :href="`/incomes/project/${line?.data?.income?.project?._id}`"
                target="_blank"
                rel="noopener noreferrer"
              >
                <span class="u u-open"></span>
                <span
                  v-text="line?.data?.income?.project?.name || '-'"
                  class="truncateText"
                  :title="line?.data?.income?.project?.name || '-'"
                ></span>
              </a>
            </div>
          </div>
          <div
            v-if="props?.config?.columns?.status"
            class="grid__item-col left"
          >
            <span
              class="tagStatus"
              :style="
                line.data.isClosedLine
                  ? {
                      backgroundColor: `var(${getColorStatus('closed').background})`,
                      color: `var(${getColorStatus('closed').color})`,
                    }
                  : {}
              "
              >{{
                line.data.isClosedLine ? getNameStatus("closed", t) : "-"
              }}</span
            >
          </div>
          <div
            v-if="props?.config?.columns?.quantity"
            class="grid__item-col right"
          >
            <span
              v-if="props.readOnly"
              v-text="line.data.numbers.amount1.value"
            ></span>
            <input
              v-else
              :disabled="props.disabled || line.data.isClosedLine"
              v-model="line.data.numbers.amount1.value"
              @click="selectContent"
              @input="handleInputChange($event, 'amount1', line)"
              @keydown="handleKeyDownGrid($event, 'amount1', line)"
              @focusin="onFocusInput($event, 'amount1', line)"
              @focusout="onBlurInput($event, 'amount1', line)"
              @change="handleChangeNumber('amount1', line)"
              :id="`${divId}-${line.index}-0`"
            />
          </div>
          <div v-if="props?.config?.columns?.days" class="grid__item-col right">
            <span
              v-if="props.readOnly"
              v-text="line.data.numbers.amount2.value"
            ></span>
            <input
              v-else
              :disabled="props.disabled || line.data.isClosedLine"
              v-model="line.data.numbers.amount2.value"
              @click="selectContent"
              @input="handleInputChange($event, 'amount2', line)"
              @keydown="handleKeyDownGrid($event, 'amount2', line)"
              @focusin="onFocusInput($event, 'amount2', line)"
              @focusout="onBlurInput($event, 'amount2', line)"
              @change="handleChangeNumber('amount2', line)"
              :id="`${divId}-${line.index}-1`"
            />
          </div>
          <div v-if="props?.config?.columns?.ot" class="grid__item-col right">
            <span
              v-if="props.readOnly"
              v-text="line.data.numbers.amount3.value"
            ></span>
            <input
              v-else
              :disabled="props.disabled || line.data.isClosedLine"
              v-model="line.data.numbers.amount3.value"
              @click="selectContent"
              @input="handleInputChange($event, 'amount3', line)"
              @keydown="handleKeyDownGrid($event, 'amount3', line)"
              @focusin="onFocusInput($event, 'amount3', line)"
              @focusout="onBlurInput($event, 'amount3', line)"
              @change="handleChangeNumber('amount3', line)"
              :id="`${divId}-${line.index}-2`"
            />
          </div>
          <div
            v-if="props?.config?.columns?.price"
            class="grid__item-col right"
          >
            <span
              v-if="props.readOnly"
              v-text="line.data.numbers.budget.value"
            ></span>
            <input
              v-else
              :disabled="props.disabled || line.data.isClosedLine"
              @click="selectContent"
              @input="handleInputChange($event, 'budget', line)"
              @keydown="handleKeyDownGrid($event, 'budget', line)"
              @focusin="onFocusInput($event, 'budget', line)"
              @focusout="onBlurInput($event, 'budget', line)"
              @change="handleChangeNumber('budget', line)"
              :id="`${divId}-${line.index}-3`"
              :value="
                line.data.numbers.budget.tempValue ||
                line.data.numbers.budget.value
              "
              autocomplete="off"
            />
          </div>
          <div
            v-if="props?.config?.columns?.total"
            :class="`grid__item-col right ${compareAmounts(line)}`"
          >
            <span
              class="truncateText"
              v-text="line.data.numbers.sumBudget.value"
              :title="line?.data?.numbers?.sumBudget?.number"
            ></span>
          </div>
          <div
            v-if="props?.config?.columns?.totalAction && !props.readOnly"
            class="grid__item-col center"
          >
            <button
              :class="`u u-taxes taxesBtn ${
                line?.data?.taxes?.length ? 'applied' : ''
              }`"
              :disabled="!props.availableTaxes.length"
              @click="showTaxes($event, line)"
              :title="t(module + '.headers.taxes')"
            ></button>
          </div>
          <div
            v-if="props?.config?.columns?.documented"
            :class="`grid__item-col right ${compareAmounts(line)}`"
          >
            <span
              class="truncateText"
              :title="line.data.numbers.documentedNet.number"
              v-text="line.data.numbers.documentedNet.value"
            ></span>
          </div>
          <div
            v-if="props?.config?.columns?.documentedAction && !props.readOnly"
            class="grid__item-col center btnDocs"
          >
            <button
              :class="`u u-click taxesBtn ${
                line.data.numberDocuments !== 0 ? 'applied' : ''
              }`"
              :disabled="line.data.numberDocuments === 0"
              @click="showDocs($event, line)"
              :title="t(module + '.headers.docs')"
            ></button>
          </div>
          <div
            v-if="props?.config?.columns?.toDocument"
            class="grid__item-col right"
          >
            <span
              v-if="props.readOnly"
              v-text="line?.data?.numbers?.toDocument?.value || '-'"
            ></span>
            <input
              v-else
              :disabled="props.disabled"
              @click="selectContent"
              @input="handleInputChange($event, 'toDocument', line)"
              @keydown="handleKeyDownGrid($event, 'toDocument', line)"
              @focusin="onFocusInput($event, 'toDocument', line)"
              @focusout="onBlurInput($event, 'toDocument', line)"
              @change="handleChangeToDocument(line)"
              :id="`${divId}-${line.index}-4`"
              :value="
                line.data.numbers.toDocument.tempValue ||
                line.data.numbers.toDocument.value
              "
              autocomplete="off"
            />
          </div>
          <div
            v-if="props?.config?.columns?.toDocumentAction && !props.readOnly"
            class="grid__item-col center"
          >
            <button
              :class="`u u-taxes taxesBtn ${
                line?.data?.taxes?.length ? 'applied' : ''
              }`"
              :disabled="!props.availableTaxes.length"
              @click="showTaxes($event, line)"
              :title="t(module + '.headers.taxes')"
            ></button>
          </div>
          <div
            v-if="props?.config?.columns?.delete && !props.readOnly"
            class="grid__item-col center"
          >
            <button
              class="u u-close taxesBtn"
              :disabled="list.length === 1"
              :title="t(module + '.headers.delete')"
              @click="deselect(line.index)"
            ></button>
          </div>
        </div>
      </div>
      <div v-else class="empty">
        <span v-text="t(module + '.empty')"></span>
      </div>
    </div>
    <div class="menu">
      <div class="menu__header">
        <span
          class="truncateText left"
          title="Desarrollador"
          v-text="currentLine?.name"
        ></span>
        <span
          class="truncateText right"
          v-text="
            currentLine &&
            currentLine.numbers &&
            currentLine.numbers[props.toDocument ? 'toDocument' : 'sumBudget']
              ? currentLine.numbers[
                  props.toDocument ? 'toDocument' : 'sumBudget'
                ].value
              : ''
          "
          :title="
            currentLine &&
            currentLine.numbers &&
            currentLine.numbers[props.toDocument ? 'toDocument' : 'sumBudget']
              ? currentLine.numbers[
                  props.toDocument ? 'toDocument' : 'sumBudget'
                ].number
              : ''
          "
        ></span>
      </div>
      <div class="menu__list">
        <div
          class="menu__item"
          v-for="(tax, t) in currentLine?.numbers?.taxes"
          :key="t"
        >
          <div>
            <u-switch
              v-model="tax.select"
              @click="changeStateTax"
              :disabled="
                props.compare &&
                currentLine?.numbers?.documentedNet?.number !== 0
              "
            />
          </div>
          <span class="left truncateText"
            >{{ tax?.name }} <strong v-text="'(' + tax?.value + ' %)'"></strong
          ></span>
          <input
            v-if="tax.isEditTax"
            class="tax-input"
            :value="tax.total.tempValue || tax.total.value"
            :disabled="
              props.disabled ||
              !tax.select ||
              (props.compare &&
                currentLine?.numbers?.documentedNet?.number !== 0)
            "
            @click="selectContent"
            @input="handleInputChangeTax($event, tax, t)"
            @keydown="handleKeyDownTax($event, tax, t)"
            @focusin="onFocusTaxInput($event, tax, t)"
            @focusout="onBlurTaxInput($event, tax, t)"
            @change="handleInputEditTax($event, tax, t)"
            autocomplete="off"
          />
          <span
            v-else
            class="right truncateText"
            v-text="tax?.total?.value"
            :title="tax?.total?.number"
          ></span>
        </div>
        <div class="menu__empty" v-if="props.availableTaxes.length === 0">
          <span v-text="t(module + '.footer.empty')"></span>
        </div>
      </div>
      <div class="menu__taxes">
        <span class="left" v-text="t(module + '.footer.taxes')"></span>
        <span
          class="right truncateText"
          v-text="menuLineTaxSum?.totalTax?.value || '-'"
          :title="menuLineTaxSum?.totalTax?.number || '-'"
        ></span>
      </div>
      <div class="menu__footer">
        <span class="left" v-text="t(module + '.footer.total')"></span>
        <span
          class="right truncateText"
          v-text="menuLineTaxSum?.total?.value || '-'"
          :title="menuLineTaxSum?.total?.number || '-'"
        ></span>
      </div>
    </div>
    <div class="docs">
      <div class="docs__list">
        <div class="docs__item" v-for="doc in currentLine?.docs" :key="doc._id">
          <span class="docs__item-number"
            >{{ getNameDocument(doc?.document?.documentType) }} N°
            {{ doc.document.documentNumber }}</span
          >
          <u-avatar
            class="docs__item-avatar"
            :user="{
              name: doc?.document?.supplier?.contact?.data?.legalName,
              src: doc?.document?.supplier?.contact?.imgUrl,
            }"
            :size="36"
          />
          <div class="docs__item-title">
            <span
              v-text="doc?.document?.supplier?.contact?.data?.legalName"
            ></span>
            <span
              v-text="doc?.document?.supplier?.contact?.data?.idNumber || '-'"
            ></span>
          </div>
          <div class="docs__item-snippet">
            <span
              v-text="doc?.numbers?.total?.value || '-'"
              :title="doc?.numbers?.total?.number || 0"
            ></span>
            <span v-text="transformedDate(doc?.createdAt)"></span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.docs__item {
  display: grid;
  grid-template-areas: "number number number" "avatar title snippet";
  grid-template-columns: 36px 1fr 1fr;
  grid-template-rows: 1fr 36px;
  column-gap: 10px;
  flex-shrink: 1;
  height: auto;
  border: 1px solid var(--neutral-border-subtle);
  border-radius: 10px;
  padding: 4px 8px;
}
.docs__item-number {
  grid-area: number;
  font-weight: 400;
  font-size: 10px;
  line-height: 14px;
  letter-spacing: 10%;
  vertical-align: middle;
  text-transform: uppercase;
  color: var(--neutral-text-caption);
}
.docs__item-avatar {
  grid-area: avatar;
}
.docs__item-title {
  grid-area: title;
  display: flex;
  flex-direction: column;
  justify-content: center;
}
.docs__item-snippet {
  grid-area: snippet;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  justify-content: center;
}
.docs__item-title span:nth-child(1),
.docs__item-snippet span:nth-child(1) {
  font-weight: 600;
  font-size: 14px;
  line-height: 18px;
  letter-spacing: 0%;
  vertical-align: middle;
  color: var(--neutral-text-body);
}
.docs__item-title span:nth-child(2),
.docs__item-snippet span:nth-child(2) {
  font-weight: 400;
  font-size: 12px;
  line-height: 16px;
  letter-spacing: 0%;
  vertical-align: middle;
  color: var(--neutral-text-caption);
}
.docs__list {
  overflow: auto;
  max-height: 190px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding-right: 2px;
}

.gridContainer {
  position: relative;
  min-height: 80px;
}
.menu,
.docs {
  transform: scale(v-bind("showMenu ? 1 : 0"));
  transition: 0.3s;
  transform-origin: right top;
  position: absolute;
  background-color: var(--neutral-background-default);
  height: auto;
  max-height: 600px;
  z-index: 2;
  top: v-bind("posMenu.y");
  left: v-bind("posMenu.x");
  border-radius: 16px;
  box-shadow: var(--elevation-s);
  padding: 12px 20px 16px;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
}
.docs {
  transform: scale(v-bind("showDocsByLine ? 1 : 0"));
  width: 506px;
  height: auto;
  top: v-bind("posDocs.y");
  left: v-bind("posDocs.x");
  padding: 10px;
}
.menu {
  transform: scale(v-bind("showMenu ? 1 : 0"));
  width: 500px;
  height: auto;
  top: v-bind("posMenu.y");
  left: v-bind("posMenu.x");
}
.menu__header {
  width: 100%;
  height: 32px;
  border-bottom: 1px solid var(--neutral-border-subtle);
  display: grid;
  grid-template-columns: 200px 1fr;
  align-items: center;
  gap: 20px;
  padding-right: 20px;
}
.menu__header span,
.menu__footer span,
.menu__taxes span {
  color: var(--neutral-text-body);
  font-weight: 800;
  font-size: 14px;
  line-height: 18px;
  letter-spacing: 0%;
  vertical-align: bottom;
}
.menu__header span.left,
.menu__footer span.left,
.menu__taxes span.left,
.menu__item span.left {
  text-align: left;
}
.menu__header span.right,
.menu__footer span.right,
.menu__taxes span.right,
.menu__item span.right {
  text-align: right;
}
.menu__footer {
  background-color: var(--primary-surface-shadow-12a);
  height: 40px;
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 20px;
  align-items: center;
  padding: 0 20px;
  border-radius: 10px;
  margin-left: 50px;
}
.menu__taxes {
  height: 40px;
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 20px;
  align-items: center;
  padding: 0 20px;
  margin-left: 50px;
  border-top: 1px solid var(--neutral-border-subtle);
}
.menu__empty {
  height: 40px;
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
}
.menu__empty span {
  color: var(--neutral-text-caption);
  font-size: 14px;
  padding: 0 20px 0 70px;
  flex-shrink: 1;
  width: 100%;
  text-align: center;
}
.menu__item {
  height: 32px;
  display: grid;
  grid-template-columns: 50px auto 150px;
  gap: 14px 0px;
  align-items: center;
  padding-right: 12px;
}
.menu__item div:nth-child(1) {
  display: flex;
  align-items: center;
}
.menu__item span {
  color: var(--neutral-text-body);
  font-size: 14px;
  font-weight: 600;
}
.menu__item span strong {
  color: var(--neutral-text-caption);
  font-size: 12px;
  font-weight: 400;
}
.menu__list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  height: auto;
  max-height: 135px;
  overflow: auto;
  scrollbar-gutter: stable both-edges;
  position: relative;
  margin: 10px 0;
}
.menu__list::-webkit-scrollbar,
.docs__list::-webkit-scrollbar,
.grid::-webkit-scrollbar {
  width: 8px;
  height: 5px;
  background: var(--neutral-surface-light);
  border-radius: 20px;
}
.menu__list::-webkit-scrollbar-thumb,
.docs__list::-webkit-scrollbar-thumb,
.grid::-webkit-scrollbar-thumb {
  background: var(--neutral-surface-subtle);
  border-radius: 5px;
}
.grid {
  overflow: auto;
  border-radius: 16px;
  border: 1px solid var(--neutral-border-light);
  position: relative;
  height: auto;
  width: v-bind("widthTable");
  max-height: v-bind("props?.config?.maxHeight || '530px'");
  transition: 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}
.grid__header {
  position: sticky;
  top: 0px;
  z-index: 1;
}
.grid__header,
.grid__item {
  display: grid;
  grid-template-columns: v-bind("gridTable");
}
.grid__header-item {
  padding: 0 10px;
  display: flex;
  align-items: center;
  background-color: var(--neutral-surface-light);
  height: 40px;
}
.center {
  justify-content: center;
}
.right {
  justify-content: flex-end;
}
.left {
  justify-content: flex-start;
}
.grid__header-item span {
  font-weight: 600;
  font-size: 14px;
  line-height: 18px;
  letter-spacing: 0%;
  vertical-align: bottom;
  color: var(--neutral-text-caption);
}
.grid__item {
  height: 40px;
}
.grid__item-col {
  padding: 0 10px;
  display: flex;
  align-items: center;
  height: 40px;
  border-bottom: 1px solid var(--neutral-border-light);
}
.grid__item-col span {
  font-weight: 600;
  font-size: 14px;
  line-height: 18px;
  letter-spacing: 0%;
  vertical-align: middle;
  color: var(--neutral-text-body);
}
.grid__item-col span.docs {
  font-weight: 600;
  font-size: 14px;
  line-height: 18px;
  letter-spacing: 0%;
  vertical-align: middle;
  color: var(--primary-text-default);
  text-decoration: underline;
  cursor: pointer;
}
.grid__item-col span.noDocs {
  font-weight: 600;
  font-size: 14px;
  line-height: 18px;
  letter-spacing: 0%;
  vertical-align: middle;
  color: var(--neutral-text-caption);
}

.grid__item-col .originLine {
  display: grid;
  grid-template-rows: 14px 14px;
  gap: 3px;
  align-items: center;
  margin-top: 2px;
}

.grid__item-col .originLine .category {
  font-weight: 400;
  font-size: 12px;
  line-height: 12px;
  letter-spacing: 0%;
  vertical-align: middle;
  color: var(--neutral-text-caption);
}

.grid__item-col .origin {
  display: grid;
  grid-template-rows: auto auto;
  align-items: center;
  padding-top: 4px;
}
.grid__item-col .origin a:nth-child(1) {
  font-weight: 600;
  font-size: 14px;
  line-height: 14px;
  letter-spacing: 0%;
  color: var(--neutral-text-body);
  transition: 0.3s;
  display: block;
}
.grid__item-col .origin a:nth-child(1):hover {
  color: var(--primary-text-darker);
}
.grid__item-col .origin a:nth-child(2) {
  display: grid;
  grid-template-columns: 12px auto;
  gap: 5px;
  align-items: center;
}
.grid__item-col .origin a:nth-child(2) span:nth-child(2) {
  font-weight: 400;
  font-size: 12px;
  line-height: 12px;
  letter-spacing: 0%;
  vertical-align: middle;
  text-align: start;
}
.grid__item-col .origin a:nth-child(2) span {
  color: var(--neutral-text-caption);
  transition: 0.3s;
}
.grid__item-col .origin a:nth-child(2):hover span {
  color: var(--primary-text-subtle);
}
.grid__item-col .origin a {
  display: flex;
  align-items: center;
  gap: 2px;
}
.grid__item-col .origin span.u {
  font-size: 12px;
}
.grid__item-col.btnDocs {
  padding-right: 20px;
}
input,
.tax-input {
  height: 26px;
  border: 1px solid var(--neutral-border-subtle);
  border-radius: 8px;
  text-align: end;
  padding: 0 8px;
  width: 100%;
  color: var(--neutral-text-body);
  font-weight: 600;
  font-size: 14px;
  line-height: 18px;
  letter-spacing: 0%;
  vertical-align: middle;
  transition: 0.3s;
}
input::selection,
.tax-input::selection {
  background-color: var(--primary-text-subtle);
  color: var(--neutral-background-default);
}
input:hover:not(:focus),
.tax-input:hover:not(:focus) {
  border: 1px solid var(--primary-border-subtle);
}
input:focus,
input:active,
.tax-input:focus,
.tax-input:active {
  caret-color: var(--primary-text-subtle);
  border: 1px solid var(--primary-text-subtle);
  box-shadow: inset var(--primary-text-subtle) 0px 0px 0px 1px;
}
input:disabled,
.tax-input:disabled {
  cursor: not-allowed;
  border: 1px solid var(--neutral-border-disabled);
  box-shadow: inset transparent 0px 0px 0px 1px;
}
input:disabled,
.tax-input:disabled::placeholder {
  color: var(--neutral-text-disabled);
}
input:disabled:hover,
.tax-input:disabled:hover {
  border: 1px solid var(--neutral-border-disabled);
}
.empty {
  height: 52px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--neutral-text-caption);
  position: fixed;
  width: 100%;
}
.taxesBtn {
  font-size: 20px;
  line-height: 20px;
  color: var(--neutral-text-caption);
  transition: 0.3s;
}
.taxesBtn:disabled {
  color: var(--neutral-text-disabled);
  cursor: not-allowed;
}
.taxesBtn.applied:not(:disabled):hover {
  color: var(--primary-text-default);
}
.taxesBtn:not(:disabled):hover {
  color: var(--neutral-text-body);
}
.taxesBtn.applied {
  color: var(--primary-text-subtle);
}
.compareAmounts span {
  color: var(--danger-text-default) !important;
}

span.tagStatus {
  padding: 4px 10px;
  border-radius: 16px;
  font-size: 12px;
  line-height: 16px;
  font-weight: 600;
}
</style>
