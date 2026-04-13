<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from "vue";
import useSalesStore from "@/stores/sales";
import useGlobalStore from "@/stores/global";
import useOrganizationStore from "@/stores/organization";
import { hasTaxProvidesNationalTaxAuthority } from "@/components/modules/sales/composables/useTaxAuthority";
import {
  formatCurrency as formatCurrencyHelper,
  convertToNumber,
  getValueFormaRealTime,
} from "@/utils/formatAmount";
import { useI18n } from "vue-i18n";

// Translations I18n
const { t } = useI18n();
const module = "modules.sales.createSale";
const moduleButtons = "modules.sales.createSale.buttons";

//STATES
const salesStore = useSalesStore();
const globalStore = useGlobalStore();
const organizationStore = useOrganizationStore();
const edit = ref(false);
const showCurrencies = ref(false);
const reference = ref("Evento Lanzamiento Salcobrand App");
const symbol = ",";
const change = ref(false);

// EMITS
const emit = defineEmits([
  "closeModal",
  "changeStep",
  "updatePadding",
  "reloadSales",
]);

//CONSTANTS
const color = "--neutral-text-caption";

// para tasas de cambio
const showMenuERX = ref(false);
const exchangeRateX = ref("0px");

// para popup info
const showInfoMenu = ref(false);
const posInfoMenu = ref({});
const currentInfoLine = ref("");
const containerRef = ref(null);

// para popup taxes
const showTaxesMenu = ref(false);
const posTaxesMenu = ref({});
const currentTaxesLine = ref("");

// COMPUTED
// Mock de impuestos disponibles
// const availableTaxes = computed(() => organizationStore?.taxes || []);
const availableTaxes = computed(
  () => salesStore?.formDocInvoice?.typeDocument?.taxes || [],
);

const currency = computed(() => {
  // return organizationStore?.organization?.currency;
  return salesStore?.formDocInvoice?.formRegister?.formDataInvoice?.currency;
});

// Computed para el subtotal (valor a facturar)
const subtotal = computed(() => {
  const total = salesStore.formDocInvoice.formRegister.business.reduce(
    (sum, item) => {
      return sum + (item.amountPaid?.number || 0);
    },
    0,
  );
  return formatData(total, currency.value);
});

// Computed para calcular impuestos totales
const totalTaxes = computed(() => {
  let taxSum = 0;
  let retentionSum = 0;

  salesStore.formDocInvoice.formRegister.business.forEach((line) => {
    line?.fullTaxes?.forEach((tax) => {
      const taxValue = tax?.total?.number || 0;
      if (tax?.retention) {
        retentionSum += taxValue;
      } else {
        taxSum += taxValue;
      }
    });
  });

  return {
    taxes: formatData(taxSum, currency.value),
    retentions: formatData(retentionSum, currency.value),
    net: formatData(taxSum - retentionSum, currency.value),
  };
});

// Computed para el total con impuestos
const totalWithTaxes = computed(() => {
  const total = subtotal.value.number + totalTaxes.value.net.number;
  return formatData(total, currency.value);
});

// Bloquear creación si es 0, mayor al saldo o sin descripción
const disableCreate = computed(() => {
  return salesStore.formDocInvoice.formRegister.business.some((line) => {
    const amount = line.amountPaid.number || 0;
    const descripcionVacia =
      !line.description || line.description.trim() === "";
    return amount === 0 || invalidNumbers.value || descripcionVacia;
  });
});

// Mostrar alerta SOLO si es mayor al saldo
const invalidNumbers = computed(() => {
  return salesStore.formDocInvoice.formRegister.business.some((line) => {
    const amount =
      line?.totalTaxes?.totalWithTaxes?.number || line.amountPaid.number || 0;
    const saldo =
      line.numbersGross?.toInvoice?.number ||
      line.numbersGross?.sumPrice?.number;
    return amount > saldo;
  });
});

const isInvalidLine = (line) => {
  const amount =
    line?.totalTaxes?.totalWithTaxes?.number || line.amountPaid?.number || 0;

  const saldo =
    line?.numbersGross?.toInvoice?.number ||
    line?.numbersGross?.sumPrice?.number ||
    0;

  return amount > saldo;
};

// Computed para el resumen de impuestos de la línea actual
const menuLineTaxSum = computed(() => {
  if (currentTaxesLine.value && currentTaxesLine.value.fullTaxes) {
    let sum = 0;
    currentTaxesLine.value.fullTaxes.forEach((tax) => {
      if (tax.retention) {
        sum -= tax.total.number;
      } else {
        sum += tax.total.number;
      }
    });

    const totalTax = formatData(sum, currency.value);
    const baseAmount = currentTaxesLine.value.amountPaid?.number || 0;
    const total = formatData(sum + baseAmount, currency.value);

    return { total, totalTax };
  }
  return {
    total: { value: "-", number: 0 },
    totalTax: { value: "-", number: 0 },
  };
});
// Computed para agrupar impuestos por nombre y porcentaje
const groupedTaxes = computed(() => {
  const taxMap = {};

  salesStore.formDocInvoice.formRegister.business.forEach((line) => {
    line.fullTaxes?.forEach((tax) => {
      if (!tax.select) return;

      const key = `${tax.name}_${tax.value}`;
      if (!taxMap[key]) {
        taxMap[key] = {
          name: tax.name,
          value: tax.value,
          retention: tax.retention,
          total: 0,
        };
      }
      taxMap[key].total += tax.total.number;
    });
  });

  // Convertir a array y formatear valores
  return Object.values(taxMap).map((t) => ({
    ...t,
    totalFormatted: formatCurrency(t.total, currency.value),
  }));
});

//FUNCTIONS

// CONDICIONES PARA AUTORIDADES FISCALES
// const hasTaxProvidesNationalTaxAuthority = (tax) => {
//   const countryCode = organizationStore?.organization?.country?.code;
//   const taxCode = salesStore?.formDocInvoice?.typeDocument?.taxCode;

//   console.log(countryCode, taxCode);

//   if (!countryCode || !taxCode) return false;

//   switch (countryCode) {
//     case "CL":
//       if ([33, 39].includes(taxCode)) {
//         // Solo el IVA lo controla el SII, los demás son editables
//         const ivaRegex = /\biva\b/i;

//         return ivaRegex.test(tax.name);
//       }
//       return false;

//     case "CO":
//       return false;

//     case "MX":
//       return false;

//     case "PE":
//       return false;

//     case "US":
//       return false;

//     default:
//       return false;
//   }
// };

const getCurrenciesEXR = () => {
  const currencyOrg = organizationStore?.organization?.currency?._id; // Moneda de la organizacion
  const currencyDefaultId =
    salesStore?.formDocInvoice?.formRegister?.formDataInvoice?.currency?._id; // Moneda por defecto
  const currentLines = salesStore.formDocInvoice.formRegister.business || []; // Lineas actuales
  const currencies =
    salesStore?.formDocInvoice?.formRegister?.formDataInvoice?.currencies; // Todas las monedas

  const linesCurrencies = [
    ...new Set(
      currentLines.map((line) => line?.currency?.default?._id).filter(Boolean),
    ),
  ];

  const currenciesForRates = new Set(); // Set deMonedas para tasas

  // CONDICIONES PARA INCLUIR MONEDAS EN RATES

  // 1️. Monedas de líneas distintas a la org
  linesCurrencies.forEach((currencyId) => {
    if (currencyId !== currencyOrg) {
      currenciesForRates.add(currencyId);
    }
  });

  // 2. Si la moneda default ≠ moneda org, incluir moneda org
  if (currencyDefaultId && currencyDefaultId !== currencyOrg) {
    currenciesForRates.add(currencyOrg);
  }

  // Construir othersCurrency
  const normalizeToNumber = (value) => {
    if (value === null || value === undefined || value === "") return 0;

    return Number(value.replace(",", ""));
  };

  salesStore.formDocInvoice.formRegister.formDataInvoice.othersCurrency =
    currencies
      .filter((currency) => currenciesForRates.has(currency._id))
      .map((currency) => ({
        ...currency,
        valueToday: normalizeToNumber(currency.value),
        valueManual: normalizeToNumber(currency.value),
      }));
};

const recalculateAllLines = () => {
  /**
   * 🎯 Objetivo
   * Recalcular todas las líneas (`lineBusiness`) según la moneda actualmente seleccionada (`currentCurrency`).
   *
   * 📌 Reglas de cálculo
   * 1. Cada línea debe recalcularse usando como valor base
   *    la propiedad `lineBusiness.numberBaseToInvoice`,
   *    la cual representa el valor fijo original de la línea (sin conversiones).
   *
   * 2. El valor final de cada línea se obtiene aplicando
   *    la tasa de cambio vigente (`valueToday`)
   *    correspondiente a la moneda involucrada.
   *
   * 🔁 Lógica de conversión
   * - Cada `lineBusiness` posee su propia moneda (`lineBusiness.currency`).
   * - La tasa de cambio debe obtenerse desde
   *   `othersCurrencies[currency].valueToday`.
   * - El cálculo debe considerar:
   *   - la moneda de la línea (`lineBusiness.currency`)
   *   - la moneda actual seleccionada (`currentCurrency`)
   *
   * 3. Si la moneda de la línea es distinta a `currentCurrency`,
   *    se debe convertir el valor base usando la tasa de cambio actual.
   *
   * 4. Si la moneda de la línea coincide con `currentCurrency`,
   *    el valor se mantiene (o se recalcula con factor 1).
   *
   * ⚠️ Importante
   * - Nunca se debe recalcular a partir de un valor ya convertido.
   * - Siempre se debe usar `numberBaseToInvoice` como fuente única de verdad
   *   para evitar errores acumulados por múltiples conversiones.
   */

  // DATOS BASE (moneda actual, moneda org, otras monedas (tasas de cambio), lineas de negocio)
  const currentCurrency =
    salesStore.formDocInvoice.formRegister.formDataInvoice.currency;
  const currencyOrg = organizationStore?.organization?.currency;
  const othersCurrencies =
    salesStore.formDocInvoice.formRegister.formDataInvoice.othersCurrency || [];
  const linesBusiness = salesStore.formDocInvoice.formRegister.business || [];

  /* Recorrer todas las lineas */
  linesBusiness.forEach((line) => {
    if (!line?.taxes) line.taxes = [];
    if (!line?.fullTaxes) line.fullTaxes = [];
    // 1. Obtener valores base
    const baseLineToInvoice = line.numberBaseToInvoice || 0;
    const numberToInvoice = line.numbersGross.toInvoice.number || 0;

    // 2. Convertir la moneda base a la moneda extrangera con la tasa de cambio
    let convertedToInvoice;
    let convertedAmount;

    if (line.currency._id === currentCurrency._id) {
      // Si la moneda de la linea es igual a la moneda actual, no hay conversion
      convertedToInvoice = baseLineToInvoice;
    } else {
      // Buscar la tasa de cambio apropiada
      const currencyRate = othersCurrencies.find(
        (c) => c._id === line.currency.default._id,
      );

      if (currencyRate) {
        convertedToInvoice = baseLineToInvoice * currencyRate.valueManual || 0;
      } else {
        convertedToInvoice = baseLineToInvoice;
      }
    }

    const newToInvoice = formatData(convertedToInvoice, currentCurrency);
    line.numbersGross.toInvoice = {
      ...line.numbersGross.toInvoice,
      numberReal: newToInvoice.number,
      numberAprox: newToInvoice.numberAprox,
      number: newToInvoice.numberAprox,
      value: newToInvoice.value,
    };

    // 3.

    // Convertir moneda a 0 al cambiar de moneda
    const baseAmountPaid = 0;

    const newAmountPaid = formatData(baseAmountPaid, currentCurrency);
    line.amountPaid = {
      ...line.amountPaid,
      numberReal: newAmountPaid.number,
      numberAprox: newAmountPaid.numberAprox,
      number: newAmountPaid.numberAprox,
      value: newAmountPaid.value,
    };

    // Convertir el amount paid a la moneda con su valor actual (comentado por si se necesita)
    // const baseAmountPaid = line.amountPaid.number || 0;
    // convertedAmount = baseAmountPaid * currentCurrency.valueToday || 0;

    // const newAmountPaid = formatData(convertedAmount, currentCurrency);
    // line.amountPaid = {
    //   ...line.amountPaid,
    //   numberReal: newAmountPaid.number,
    //   numberAprox: newAmountPaid.numberAprox,
    //   number: newAmountPaid.numberAprox,
    //   value: newAmountPaid.value,
    // };

    // 4. Calcular impuesto de la linea por cambiar de moneda
    calcTaxesForLine(line);
  });
};

// Obtiene la distancia entre el botón y el div para tasas de cambio
const getButtonDistanceFromDivLeft = (divId, buttonId) => {
  const div = document.getElementById(divId);
  const button = document.getElementById(buttonId);

  if (!div) {
    console.error("Div no encontrado");
    return 0;
  }

  if (!button) {
    console.error("Botón no encontrado");
    return 0;
  }

  const divRect = div.getBoundingClientRect();
  const buttonRect = button.getBoundingClientRect();

  const distance = buttonRect.left - divRect.left;

  return Math.round(distance) + "px";
};

// Obtiene el nombre del documento base
const getNameCode = (code) => {
  switch (code) {
    case "invoice":
      return {
        es: "Documento base",
        en: "Base Document",
      };
    default:
      return "";
  }
};

const formatData = (number, currencyObj = null) => {
  const curr = currencyObj || currency.value;
  const numberAprox = convertToNumber(number, curr.typeFormat, curr.precision);

  return {
    number,
    value: formatCurrencyHelper(numberAprox, curr, true),
    numberAprox,
  };
};

const formatCurrency = (number, currencyObj = null, showSymbol = true) => {
  const curr = currencyObj || currency.value;
  return formatCurrencyHelper(number, curr, true, showSymbol);
};

const capitalizeName = (name) => {
  return name.toLowerCase().replace(/\b\w/g, (l) => l.toUpperCase());
};

const cancelReference = () => {
  edit.value = false;
};

const redirectToBusiness = (item) => {
  const URL_BUSINESS = `/incomesv2/project/${item.project._id}/income/${item._id}`;
  navigateTo(URL_BUSINESS, { external: true, open: { target: "_blank" } });
};

const confirmReference = () => {
  const current =
    salesStore.formDocInvoice.formRegister.formDataInvoice.reference;
  salesStore.formDocInvoice.formRegister.formDataInvoice.reference =
    current.replace(/\s{2,}/g, " ");
  edit.value = false;
};

const inputEventReference = (e) => {
  const val = e.target.value;
  salesStore.formDocInvoice.formRegister.formDataInvoice.reference = val;
};

const deleteItem = (pos) => {
  if (salesStore.formDocInvoice.formRegister.business.length > 1) {
    salesStore.formDocInvoice.formRegister.business.splice(pos, 1);
  }

  getCurrenciesEXR();
  recalculateAllLines();
};

const onValueToInvoiceInput = (event, p) => {
  const rawValue = event.target.value;
  change.value = true;

  // Si está vacío, resetear valores
  if (rawValue === "") {
    const line = salesStore.formDocInvoice.formRegister.business[p];
    line.amountPaid.tempNumber = 0;
    line.amountPaid.number = 0;
    line.amountPaid.value = "";
    line.amountPaid.tempValue = "";

    // 🔑 Recalcular impuestos en base a 0
    calcTaxesForLine(line);
    return;
  }

  // Usar helper existente para formateo en tiempo real
  const numbers = getValueFormaRealTime(
    rawValue,
    currency.value,
    "toAmountPaid",
  );
  if (numbers) {
    salesStore.formDocInvoice.formRegister.business[p].amountPaid.number =
      numbers.numericValue;
    salesStore.formDocInvoice.formRegister.business[p].amountPaid.tempValue =
      numbers.formattedValue;
    salesStore.formDocInvoice.formRegister.business[p].amountPaid.value =
      formatCurrency(numbers.numericValue, currency.value);

    // Recalcular impuestos cuando cambia el valor
    calcTaxesForLine(salesStore.formDocInvoice.formRegister.business[p]);
  }
};

const selectAll = (event) => {
  event.target.select();
};

const onFocusInput = (event, line) => {
  line.amountPaid.tempNumber = line.amountPaid.number;
  line.amountPaid.tempValue = line.amountPaid.number;
};

const onBlurInput = (event, line) => {
  try {
    line.amountPaid.value = formatCurrency(
      line.amountPaid.number,
      currency.value,
      true,
    );
    delete line.amountPaid.tempValue;
  } catch (error) {
    console.error("Error al formatear el valor:", error);
    line.amountPaid.number = 0;
    delete line.amountPaid.tempValue;
  }
};

const onDescriptionInput = (event, p) => {
  const val = event.target.value;
  salesStore.formDocInvoice.formRegister.business[p].description = val;
};

const onFocusDescription = (event, line) => {
  event.target.select();
};

// funciones popup del button icon info de descripcion
const showInfo = (p, line) => {
  const btnId = `btn-info-${p}`;
  if (showInfoMenu.value && currentInfoLine.value === line) {
    closeInfo();
    return;
  }

  currentInfoLine.value = line;
  calcPositionPopUp(btnId, "info");
  setTimeout(() => {
    showInfoMenu.value = true;
    showTaxesMenu.value = false;
  }, 10);
};

// popup taxes
const showTaxes = (p, line) => {
  const btnId = `btn-taxes-${p}`;
  if (showTaxesMenu.value && currentTaxesLine.value === line) {
    closeTaxes();
    return;
  }

  // Calcular impuestos antes de mostrar el menú
  calcTaxesForLine(line);
  currentTaxesLine.value = line;
  calcPositionPopUp(btnId, "taxes");
  setTimeout(() => {
    showTaxesMenu.value = true;
    showInfoMenu.value = false;
  }, 10);
};

const closeTaxes = () => {
  showTaxesMenu.value = false;
};

const calcPositionPopUp = (btnId, type = "info") => {
  const target = document.getElementById(btnId);
  if (!target) return;
  const rect = target.getBoundingClientRect();
  const container = containerRef.value;
  if (!container) return;
  const containerRect = container.getBoundingClientRect();

  // Ajuste de left según el tipo
  let left;
  const popupWidth = type === "taxes" ? 480 : 730;
  // Estimación de altura (ajustar según el contenido real si es posible)
  const popupHeight = type === "taxes" ? 280 : 500;

  if (type === "info") {
    left = rect.left - containerRect.left - (popupWidth - rect.width);
  } else if (type === "taxes") {
    left = rect.left - containerRect.left - (popupWidth - rect.width);
  } else {
    left = rect.left - containerRect.left;
  }

  // ajuste si se pasa del lado izquierdo
  if (left < 12) {
    left = 12;
  }

  // ajuste si se pasa del lado derecho
  if (left + popupWidth > containerRect.width) {
    left = containerRect.width - popupWidth - 12;
  }

  // LÓGICA DE FLIPPING: Intentar ARRIBA por defecto si el usuario lo prefiere
  // o si no hay espacio ABAJO.

  let top = "auto";
  let bottom = "auto";
  let isFlipped = false;

  // Calculamos si cabe ARRIBA
  const spaceAbove = rect.top - containerRect.top;
  const spaceBelow =
    containerRect.height - (rect.top - containerRect.top + rect.height);

  if (spaceAbove > popupHeight) {
    // Cabe ARRIBA (Preferido por el usuario)
    isFlipped = true;
    bottom = containerRect.height - (rect.top - containerRect.top) + 8;
  } else if (spaceBelow > popupHeight) {
    // No cabe arriba, pero si cabe ABAJO
    isFlipped = false;
    top = rect.top - containerRect.top + rect.height + 8;
  } else {
    // No cabe en ningún lado cómodamente, forzar ARRIBA con limitación si es posible
    // o simplemente el lugar con más espacio
    if (spaceAbove > spaceBelow) {
      isFlipped = true;
      bottom = containerRect.height - (rect.top - containerRect.top) + 8;
    } else {
      isFlipped = false;
      top = rect.top - containerRect.top + rect.height + 8;
    }
  }

  if (type === "info") {
    posInfoMenu.value = { top, left, bottom, isFlipped };
  } else if (type === "taxes") {
    posTaxesMenu.value = { top, left, bottom, isFlipped };
  }
};

const closeInfo = () => {
  showInfoMenu.value = false;
};

// Función para calcular impuestos de una línea
const calcTaxesForLine = (line) => {
  line.fullTaxes = [];

  const taxDefault = salesStore?.formDocInvoice?.typeDocument?.taxDefault || [];

  availableTaxes.value.forEach((availableTax) => {
    const baseAmount = line.amountPaid?.number || 0;
    let taxAmount = 0;

    let isSelected = line.taxes?.includes(availableTax._id);

    if (!line._initialized && taxDefault.includes(availableTax._id)) {
      isSelected = true;
      if (!line?.taxes?.includes(availableTax._id)) {
        line?.taxes?.push(availableTax._id);
      }
    }

    if (isSelected) {
      taxAmount = baseAmount * (availableTax.value / 100);
    }

    const formattedTax = formatData(taxAmount, currency.value);

    line.fullTaxes.push({
      name: availableTax.name,
      retention: availableTax.retention,
      tax: availableTax._id,
      value: availableTax.value,
      select: isSelected,
      total: {
        number: formattedTax.number,
        numberAprox: formattedTax.numberAprox,
        value: formattedTax.value,
      },
    });
  });

  // 🔑 NUEVO: Calcular totalTaxes para la línea
  let sumTaxes = 0;
  line.fullTaxes.forEach((tax) => {
    if (tax.select) {
      if (tax.retention) {
        sumTaxes -= tax.total.number;
      } else {
        sumTaxes += tax.total.number;
      }
    }
  });

  const baseAmount = line.amountPaid?.number || 0;
  const totalWithTaxes = baseAmount + sumTaxes;

  // Guardar totalTaxes en la línea
  line.totalTaxes = {
    totalTax: formatData(sumTaxes, currency.value),
    totalWithTaxes: formatData(totalWithTaxes, currency.value),
  };

  if (!line._initialized) {
    line._initialized = true;
  }
};

// Función para cambiar estado de impuesto
const changeStateTax = () => {
  if (!currentTaxesLine.value) return;

  // Actualizar array de impuestos aplicados
  currentTaxesLine.value.taxes = [];
  currentTaxesLine.value.fullTaxes.forEach((tax) => {
    if (tax.select) {
      currentTaxesLine.value.taxes.push(tax.tax);
    }
  });

  // Recalcular impuestos
  calcTaxesForLine(currentTaxesLine.value);

  // Encontrar la línea en el store y actualizarla
  const lineIndex = salesStore.formDocInvoice.formRegister.business.findIndex(
    (line) => line._id === currentTaxesLine.value._id,
  );

  if (lineIndex !== -1) {
    salesStore.formDocInvoice.formRegister.business[lineIndex] = {
      ...currentTaxesLine.value,
    };
  }
};

const handleClickOutside = (event) => {
  const dropdown = document.querySelector(".exchangeRate");
  const btn = document.querySelector(".buttonERX");
  if (
    dropdown &&
    btn &&
    !dropdown.contains(event.target) &&
    !btn.contains(event.target)
  ) {
    showMenuERX.value = false;
  }

  if (
    !event.target.closest(".info-popup") &&
    !event.target.closest(".taxes-popup") &&
    !event.target.closest("button")
  ) {
    closeInfo();
    closeTaxes();
  }
};

const cutToTwoDecimals = (num) => {
  return String(Math.trunc(num * 100) / 100);
};

// Acciones para cambiar de step
const nextStep = () => {
  emit("updatePadding", "24px 24px");
  emit("closeModal");
};

const createInvoice = async () => {
  // Fecha de emisión
  const formIssueDate = new Date(
    salesStore.formDocInvoice.formRegister.formDataInvoice.issueDate,
  ).toISOString();

  // Fecha de expiración
  const formExpirationDate = new Date(
    salesStore.formDocInvoice.formRegister.formDataInvoice.expirationDate,
  ).toISOString();

  // Función para agrupar impuestos de todas las líneas
  const aggregateTaxes = () => {
    const taxMap = new Map();

    salesStore.formDocInvoice.formRegister.business.forEach((line) => {
      line.fullTaxes?.forEach((tax) => {
        if (!tax.select) return;

        const taxId = tax.tax;
        const amount = tax.total?.number || 0;

        if (taxMap.has(taxId)) {
          taxMap.get(taxId).total.number += amount;
        } else {
          taxMap.set(taxId, {
            name: tax.name,
            retention: tax.retention || false,
            total: { number: amount },
          });
        }
      });
    });

    return Array.from(taxMap.values());
  };

  const body = {
    salesDocumentType: salesStore.formDocInvoice.typeDocument._id,
    organization: globalStore.organizationId,
    invoicing: salesStore.formDocInvoice.invoicing,
    client: {
      _id:
        salesStore.formDocInvoice.formRegister.client.contact ||
        salesStore.formDocInvoice.formRegister.client._id,
    },
    clientData: {
      data: {
        idNumber:
          salesStore.formDocInvoice.formRegister.formDataClient.numberID || "",
        legalName:
          salesStore.formDocInvoice.formRegister.formDataClient.legalName || "",
        businessActivity:
          salesStore.formDocInvoice.formRegister.formDataClient
            .economicActivity || "",
      },
      address: {
        ...salesStore.formDocInvoice.formRegister.formDataClient.dataAddress,
      },
    },
    // currency: {
    //   _id: organizationStore?.organization?.currency?._id,
    // },
    currency: {
      _id:
        salesStore.formDocInvoice.formRegister.formDataInvoice.currency._id ||
        organizationStore?.organization?.currency?._id,
    },
    othersCurrency:
      salesStore.formDocInvoice.formRegister.formDataInvoice.othersCurrency.map(
        (currency) => ({
          currency: currency._id,
          valueToday: currency.valueToday,
          valueManual: currency.valueManual,
        }),
      ),
    reference: salesStore.formDocInvoice.formRegister.formDataInvoice.reference,
    ...(!salesStore.formDocInvoice.invoicing && {
      number:
        salesStore.formDocInvoice.formRegister.formDataInvoice.invoiceNumber,
    }),
    paymentMethod:
      salesStore.formDocInvoice.formRegister.formDataInvoice.paymentMethod
        .value,
    paymentTerm:
      salesStore.formDocInvoice.formRegister.formDataInvoice.paymentCondition
        .value,
    issueDate: formIssueDate,
    expirationDate: formExpirationDate,
    status: "issue",
    description:
      salesStore.formDocInvoice.formRegister.business.at(0).description,
    lines: salesStore.formDocInvoice.formRegister.business.map(
      (line, order) => ({
        referenceIncome: line._id,
        name: line.name,
        description: line.description,
        longDescription: line.longDescription,
        order: order,
        numbers: {
          // totalNet: { number: line?.numbersGross?.sumPrice?.number || line?.numbers?.sumPrice?.number },
          totalNet: {
            number: line?.amountPaid?.number || 0,
          },
          taxes: line.fullTaxes.map((tax) => ({
            tax: tax.tax,
            name: tax.name,
            value: tax.value,
            retention: tax.retention,
            total: {
              number: tax.total.number,
              // value: tax.total.value, //
            },
          })),
        },
      }),
    ),
    numbers: {
      taxes: aggregateTaxes(),
      totalNet: {
        number: subtotal?.value?.number,
        value: subtotal?.value?.value,
        numberAprox: subtotal?.value?.numberAprox,
      },
      totalTaxes: {
        number: totalTaxes?.value?.net?.number,
        value: totalTaxes?.value?.net?.value,
        numberAprox: totalTaxes?.value?.net?.numberAprox,
      },
      totalWithTaxes: {
        number: totalWithTaxes?.value?.number,
        value: totalWithTaxes?.value?.value,
        numberAprox: totalWithTaxes?.value?.numberAprox,
      },
    },
  };

  try {
    globalStore.loading = true;
    const resp = await salesStore.createFV(body);

    // Create Documentos de referencia
    if (salesStore.formDocInvoice.formRegister.documentReferences.length > 0) {
      const formData = new FormData();

      const documents =
        salesStore.formDocInvoice.formRegister.documentReferences;

      documents.forEach((docRef, index) => {
        const json = {
          salesDocumentId: resp._id,
          SalesDocumentType: docRef.typeDocument.id || "",
          number: docRef.numberDocument || "",
          amount: docRef.amountDocument.total || {},
          date: new Date(docRef.dateDocument).toISOString().slice(0, 10),
        };

        formData.append(`documents[${index}][data]`, JSON.stringify(json));

        if (docRef.fileDocument instanceof File) {
          formData.append(`documents[${index}][file]`, docRef.fileDocument);
        }
      });

      await salesStore.createDocReferenceSalesDocument(formData);
    }
  } catch (error) {
    console.error(`Error fetching from:`, error);
  } finally {
    emit("reloadSales");
    globalStore.loading = false;

    emit("updatePadding", "24px 24px");
    emit("closeModal");
  }
};

const backStep = () => {
  emit("updatePadding", "24px 24px");
  emit("changeStep", false);
};

const closeStep = () => {
  salesStore?.cleanFormDocInvoice?.();
  emit("updatePadding", "24px 24px");
  emit("closeModal");
};

const handleEscape = (event) => {
  if (event.key === "Escape") {
    // Primero cierro los popups si están abiertos
    if (showInfoMenu.value) {
      showInfoMenu.value = false;
      return;
    }
    if (showTaxesMenu.value) {
      showTaxesMenu.value = false;
      return;
    }

    // Si ningún popup estaba abierto, cierro el modal
    closeStep();
  }
};

const handleKeyDown = (event, p) => {
  const curr = currency.value;
  if (!curr) return;

  const decimalSeparator = curr.typeFormat === "de-DE" ? "," : ".";

  // Permitir teclas de control
  const controlKeys = [
    "Backspace",
    "Delete",
    "Tab",
    "Escape",
    "Enter",
    "ArrowLeft",
    "ArrowRight",
  ];
  if (controlKeys.includes(event.key)) {
    return;
  }

  // Permitir números
  if (event.key >= "0" && event.key <= "9") {
    return;
  }

  // Permitir separador decimal solo si precision > 0 y no existe ya uno
  if (event.key === decimalSeparator && curr.precision > 0) {
    const currentValue = event.target.value;
    if (!currentValue.includes(decimalSeparator)) {
      return;
    }
  }

  // Bloquear cualquier otra tecla
  event.preventDefault();
};

onBeforeMount(() => {
  const initAmountPaid = formatCurrency(0, currency.value);

  salesStore.formDocInvoice.formRegister.business.forEach((b) => {
    b.amountPaid = {
      value: initAmountPaid,
      number: 0,
      tempNumber: 0,
      tempValue: initAmountPaid,
    };
    b.numberBaseToInvoice = b.numbersGross.toInvoice.number;
  });
});

onMounted(async () => {
  exchangeRateX.value = getButtonDistanceFromDivLeft("headerId", "buttonERX"); // Calcular la posicion del exchangeRate
  document.addEventListener("click", handleClickOutside); // Capturar click fuera del modal
  // document.addEventListener("keydown", handleEscape);

  try {
    globalStore.loading = true;
    // Cargar impuestos
    const resp = await organizationStore.taxesByOrganization();
    organizationStore.taxes = resp;

    // Cargar monedas: para tasas de cambio
    getCurrenciesEXR();

    // Calcular impuestos iniciales

    recalculateAllLines();
    // calcTaxesForLine(line);
  } catch (error) {
    console.error(error);
  } finally {
    globalStore.loading = false;
  }
});

onBeforeUnmount(() => {
  document.removeEventListener("click", handleClickOutside);
  salesStore.formDocInvoice.formRegister.formDataInvoice.othersCurrency = [];
  // document.removeEventListener("keydown", handleEscape);
});
</script>

<template>
  <div class="container" ref="containerRef">
    <div class="header">
      <div class="header_izq">
        <span>{{
          t(`${module}.step4.titleHeader`, {
            typeDoc:
              salesStore?.formDocInvoice?.typeDocument?.tag ||
              getNameCode(salesStore?.formDocInvoice?.typeDocument?.code)[
                globalStore.lang
              ],
          })
        }}</span>
      </div>
      <u-button-icon
        @click="closeStep"
        icon="close"
        type="outlined"
        :color="color"
        size="l"
        style="border-radius: 50%"
      />
    </div>

    <div class="body">
      <div class="body_header">
        <div>
          <div class="reference" v-show="!edit">
            <span
              style="max-width: 500px"
              class="title truncateText"
              v-text="
                salesStore?.formDocInvoice?.formRegister?.formDataInvoice
                  ?.reference
              "
            ></span>
            <u-button-icon
              icon="edit"
              size="s"
              type="text"
              class="iconBtn"
              @click="edit = true"
            />
          </div>
          <div class="body-creator" v-show="!edit">
            <u-avatar
              :user="{
                name: salesStore?.formDocInvoice?.formRegister?.client?.data
                  ?.legalName,
                src: salesStore?.formDocInvoice?.formRegister?.client?.imgUrl,
              }"
              :size="24"
            />
            <span
              v-text="
                salesStore?.formDocInvoice?.formRegister?.client?.data
                  ?.legalName
              "
              style="max-width: 460px"
            ></span>
          </div>
          <div class="body_header-input" v-show="edit">
            <span class="u u-new-project"></span>
            <span>{{ t(module + ".step4.inputs.editReference.label") }}</span>
            <u-input
              :placeholder="
                t(module + '.step4.inputs.editReference.placeholder')
              "
              size="s"
              style="width: 280px"
              v-model="
                salesStore.formDocInvoice.formRegister.formDataInvoice.reference
              "
              @input="inputEventReference($event)"
            />
            <u-button-icon
              icon="check"
              size="s"
              type="outlined"
              @click="confirmReference"
            />
            <u-button-icon
              icon="close"
              size="s"
              type="outlined"
              :color="color"
              @click="cancelReference"
            />
          </div>
        </div>
        <!--Aqui va la nueva tasa de cambio-->
        <div class="containerCurrencies" id="headerId">
          <dialog-create-sales-doc-components-list-exchange-rate
            @recalculateTable="recalculateAllLines"
          />

          <dialog-create-sales-doc-components-btn-exchange
            class="buttonERX"
            @click="showCurrencies = !showCurrencies"
          />
          <dialog-create-sales-doc-components-exchange-rate
            :show-menu="showCurrencies"
            classNameBtn="buttonERX"
            @recalculateTable="recalculateAllLines"
            @realoadGetCurrencies="getCurrenciesEXR"
            @closeMenu="showCurrencies = false"
          />
        </div>
      </div>

      <div class="body_body">
        <div class="table">
          <div class="table-header">
            <div class="col left">
              <span>{{ t(module + ".step4.table.cols.business.label") }}</span>
            </div>
            <div class="col left">
              <span>{{
                t(module + ".step4.table.cols.shortDescription.label")
              }}</span>
            </div>
            <div class="col right">
              <span>{{
                t(module + ".step4.table.cols.totalBusiness.label")
              }}</span>
            </div>
            <div class="col right">
              <span>{{
                t(module + ".step4.table.cols.balanceInvoice.label") +
                " " +
                `[${salesStore.formDocInvoice.formRegister.formDataInvoice.currency.code}]`
              }}</span>
            </div>
            <div class="col right">
              <span>{{
                t(module + ".step4.table.cols.amountInvoiced.label") +
                " " +
                `[${salesStore.formDocInvoice.formRegister.formDataInvoice.currency.code}]`
              }}</span>
            </div>
            <div class="col right"></div>
            <div class="col right last"></div>
          </div>
          <div
            class="table-item"
            v-for="(item, p) in salesStore.formDocInvoice.formRegister.business"
            :key="item._id"
          >
            <div class="col left first">
              <u-tags
                :text="`NEG-${item?.idNumber}`"
                icon="click"
                size="xs"
                :delete="false"
                color="--info-surface-darker"
                background="--info-surface-light"
                class="truncateText"
                style="cursor: pointer"
                @click="redirectToBusiness(item)"
              />
            </div>
            <div class="col left" style="gap: 10px">
              <input
                type="text"
                :id="`input-${p}-description`"
                class="input-description"
                @focus="selectAll($event)"
                @input="onDescriptionInput($event, p)"
                @focusin="onFocusDescription($event, item)"
                :value="item.description"
              />
              <u-button-icon
                :id="`btn-info-${p}`"
                icon="info"
                type="text"
                color="--neutral-text-caption"
                size="s"
                @click="showInfo(p, item)"
              />
            </div>
            <div class="col right">
              <span
                class="truncateText"
                v-text="
                  item?.numbersGross?.sumPrice?.value ||
                  item?.numbersGross?.sumPrice?.value
                "
                :title="item?.numbersGross?.sumPrice?.value"
              ></span>
              <!--Viejo span con currency de saldo por facturar-->
              <!-- <span
                v-text="
                  formatCurrency(
                    item?.numbersGross?.toInvoice?.number ||
                      item?.numbersGross?.sumPrice?.number,
                    currency
                  )
                "
                :title="item?.numbersGross?.toInvoice?.number"
              ></span> -->
            </div>
            <div class="col right">
              <span
                class="truncateText"
                v-text="
                  item?.numbersGross?.toInvoice?.value ||
                  item?.numbersGross?.sumPrice?.value
                "
                :class="{
                  completed:
                    item?.numbersGross?.toInvoice?.number ===
                    item?.amountPaid?.number,
                }"
                :title="item?.numbersGross?.toInvoice?.number"
              ></span>
              <!--Viejo span con currency de saldo por facturar-->
              <!-- <span
                v-text="
                  formatCurrency(
                    item?.numbersGross?.toInvoice?.number ||
                      item?.numbersGross?.sumPrice?.number,
                    currency
                  )
                "
                :title="item?.numbersGross?.toInvoice?.number"
              ></span> -->
            </div>
            <div class="col right">
              <input
                type="text"
                :id="`input-${p}-value`"
                @click="selectAll($event)"
                @input="onValueToInvoiceInput($event, p)"
                @keydown="handleKeyDown($event, p)"
                @focusin="onFocusInput($event, item)"
                @focusout="onBlurInput($event, item)"
                :value="
                  item?.amountPaid?.tempValue ?? item?.amountPaid?.value ?? ''
                "
                :class="{ error: isInvalidLine(item) }"
                autocomplete="off"
              />
            </div>
            <div class="col right">
              <u-button-icon
                :id="`btn-taxes-${p}`"
                icon="taxes"
                size="s"
                type="text"
                :color="item?.taxes?.length ? '--primary-text-subtle' : color"
                :disabled="false"
                @click="showTaxes(p, item)"
                :class="item?.taxes?.length ? 'applied' : ''"
              />
            </div>
            <div class="col right last">
              <u-button-icon
                icon="close"
                type="text"
                size="s"
                :color="color"
                @click="deleteItem(p)"
                :disabled="
                  salesStore.formDocInvoice.formRegister.business.length === 1
                "
              />
            </div>
          </div>
        </div>

        <!-- popup info -->
        <div
          class="info-popup"
          :class="{ show: showInfoMenu, flipped: posInfoMenu.isFlipped }"
          :style="{
            top: posInfoMenu.top === 'auto' ? 'auto' : posInfoMenu.top + 'px',
            bottom:
              posInfoMenu.bottom === 'auto'
                ? 'auto'
                : posInfoMenu.bottom + 'px',
            left: posInfoMenu.left + 'px',
          }"
        >
          <span class="body-s-sb">{{
            t(
              module +
                ".step4.table.cols.shortDescription.longDescription.label",
            )
          }}</span>
          <!-- <u-textarea
            v-model="currentInfoLine.longDescription"
            :placeholder="t(module + '.step4.table.cols.shortDescription.longDescription.placeholder')"
          /> -->
          <u-textarea-html
            v-model="currentInfoLine.longDescription"
            :placeholder="
              t(
                module +
                  '.step4.table.cols.shortDescription.longDescription.placeholder',
              )
            "
            :tooltips-config="{
              bold: true,
              italic: false,
              underline: true,
              strike: false,
              font: false,
              size: false,
              listOrdered: true,
              listBullet: true,
              align: false,
              link: false,
              image: false,
              clean: false,
            }"
            style="height: 100%"
          />
        </div>

        <!-- popup taxes -->
        <div
          class="taxes-popup"
          :class="{ show: showTaxesMenu, flipped: posTaxesMenu.isFlipped }"
          :style="{
            top: posTaxesMenu.top === 'auto' ? 'auto' : posTaxesMenu.top + 'px',
            bottom:
              posTaxesMenu.bottom === 'auto'
                ? 'auto'
                : posTaxesMenu.bottom + 'px',
            left: posTaxesMenu.left + 'px',
          }"
        >
          <div class="taxes-popup__header">
            <span
              class="truncateText left"
              v-text="
                currentTaxesLine?.business ||
                t(module + '.step4.table.tooltips.taxes.lineBusiness')
              "
            ></span>
            <span
              class="truncateText right"
              v-text="currentTaxesLine?.amountPaid?.value || '$0'"
              :title="currentTaxesLine?.amountPaid?.number || 0"
            ></span>
          </div>

          <div class="taxes-popup__list">
            <div
              class="taxes-popup__item"
              v-for="(tax, t) in currentTaxesLine?.fullTaxes"
              :key="t"
            >
              <div>
                <u-switch
                  v-model="tax.select"
                  @click="changeStateTax"
                  :disabled="hasTaxProvidesNationalTaxAuthority(tax)"
                />
              </div>
              <span class="left truncateText">
                {{ tax?.name }} <strong>{{ "(" + tax?.value + " %)" }}</strong>
              </span>
              <span
                class="truncateText right"
                v-text="tax?.total?.value"
                :title="tax?.total?.number"
              ></span>
            </div>

            <div class="taxes-popup__empty" v-if="availableTaxes.length === 0">
              <span>{{
                t(module + ".step4.table.tooltips.taxes.noTaxes")
              }}</span>
            </div>
          </div>

          <div class="taxes-popup__taxes">
            <span class="left">{{
              t(module + ".step4.table.tooltips.taxes.taxe")
            }}</span>
            <span
              class="truncateText right"
              v-text="menuLineTaxSum?.totalTax?.value || '-'"
              :title="menuLineTaxSum?.totalTax?.number || '-'"
            ></span>
          </div>

          <div class="taxes-popup__footer">
            <span class="left">{{
              t(module + ".step4.table.tooltips.taxes.total")
            }}</span>
            <span
              class="truncateText right"
              v-text="menuLineTaxSum?.total?.value || '-'"
              :title="menuLineTaxSum?.total?.number || '-'"
            ></span>
          </div>
        </div>

        <!--Old summary taxes -->
        <!-- <div class="summary-box">
                <div class="summary-row">
                    <span class="body-m-xb">Subtotal</span>
                    <span class="body-m-xb truncateText" v-text="subtotal?.value" :title="subtotal?.number"></span>
                </div>

                <div 
                    class="summary-row" 
                    v-for="(tax, idx) in groupedTaxes" 
                    :key="idx"
                >
                    <span class="body-m-r">
                        {{ tax.name }} ({{ tax.value }}%)
                    </span>
                    <span class="body-m-r truncateText" v-text="tax.totalFormatted" :title="tax.total"></span>
                </div>

                            <div class="summary-row">
                                <span class="body-m-r">Impuestos</span>
                                <span 
                                    class="body-m-r truncateText" 
                                    v-text="totalTaxes.taxes?.value || '$0'" 
                                    :title="totalTaxes.taxes?.number || 0"
                                ></span>

                                <span class="body-m-r">Retenciones</span>
                                <span 
                                    class="body-m-r truncateText" 
                                    v-text="'-' + (totalTaxes.retentions?.value || '$0')" 
                                    :title="totalTaxes.retentions?.number || 0"
                                ></span>
                            </div>


                <div class="summary-row total-row">
                    <span class="body-m-xb">Total</span>
                    <span class="body-m-xb truncateText" v-text="totalWithTaxes?.value" :title="totalWithTaxes?.number"></span>
                </div>
            </div> -->

        <div class="body_footer">
          <div class="alert" v-if="invalidNumbers && change">
            <span class="u u-info-circle"></span>
            <span>{{ t(module + ".step4.alert.invalidAmountInvoiced") }}</span>
          </div>
          <div class="taxes">
            <div class="taxes__header">
              <div class="taxes__header-col first">
                <span>{{
                  t(module + ".step4.table.tableTaxes.subtotal")
                }}</span>
              </div>
              <div class="truncateText taxes__header-col right colFXR">
                <span
                  class="truncateText"
                  v-text="subtotal?.value"
                  :title="subtotal?.number"
                ></span>
              </div>
            </div>

            <div class="taxes__list">
              <div
                class="taxes__list-item"
                v-for="(tax, idx) in groupedTaxes"
                :key="idx"
              >
                <div class="taxes__list-item-col first">
                  <span
                    class="truncateText"
                    :title="`${tax.name} (${tax.value}%)`"
                  >
                    {{ tax.name }}
                    <strong class="percentage">({{ tax.value + "%" }})</strong>
                  </span>
                </div>
                <div class="truncateText taxes__list-item-col right percentage">
                  <span
                    class="truncateText"
                    v-text="tax.totalFormatted"
                    :title="tax.total"
                  ></span>
                </div>
              </div>
              <div class="emptyTax" v-if="groupedTaxes.length === 0">
                <span>{{
                  t(module + ".step4.table.tableTaxes.emptyTax")
                }}</span>
              </div>
            </div>

            <div class="taxes__default tax">
              <div class="taxes__default-col first">
                <span>{{ t(module + ".step4.table.tableTaxes.taxes") }}</span>
              </div>
              <div class="truncateText colFXR right">
                <span
                  class="truncateText"
                  v-text="totalTaxes.taxes?.value || '$0'"
                  :title="totalTaxes.taxes?.number || 0"
                ></span>
              </div>
            </div>

            <div class="taxes__default">
              <div class="taxes__default-col first">
                <span>{{
                  t(module + ".step4.table.tableTaxes.retentions")
                }}</span>
              </div>
              <div class="truncateText colFXR right">
                <span
                  class="truncateText"
                  v-text="totalTaxes.retentions?.value || '$0'"
                  :title="totalTaxes.retentions?.number || 0"
                ></span>
              </div>
            </div>

            <div class="taxes__footer">
              <div class="taxes__footer-col first">
                <span>{{ t(module + ".step4.table.tableTaxes.total") }}</span>
              </div>
              <div class="truncateText taxes__footer-col right colFXR">
                <span
                  class="truncateText"
                  v-text="totalWithTaxes?.value"
                  :title="totalWithTaxes?.number"
                ></span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="footer">
      <u-button
        @click="backStep"
        :text="t(`${module}.buttons.back`)"
        type="outlined"
      />
      <u-button
        :disabled="disableCreate"
        @click="createInvoice"
        :text="t(`${module}.buttons.create`)"
      />
    </div>
  </div>
</template>

<style scoped>
/* .container {
  display: grid;
  grid-template-rows: 40px 628px 36px;
  gap: 24px;
  height: 752px;
  width: 1104px;
} */

.container {
  display: grid;
  grid-template-rows: auto 1fr auto;
  gap: 24px;
  height: 80vh;
  width: 90vw;
  max-height: 779px;
  max-width: 1204px;
  position: relative;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 40px;
  width: 100%;
}

.header span {
  font-size: 16px;
  font-weight: 600;
  line-height: 20px;
  letter-spacing: 0em;
  text-align: left;
  color: var(--neutral-text-body);
}

.header_izq {
  display: flex;
  align-items: center;
  gap: 16px;
  position: relative;
  z-index: 4;
}

.body {
  display: grid;
  grid-template-rows: auto 1fr;
  min-height: 0;
  gap: 24px;
}

.body_header {
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  gap: 8px;
  min-height: 56px;
}

.reference,
.body-creator {
  display: flex;
  gap: 8px;
  align-items: center;
}

.reference {
  gap: 2px;
}

.reference span.title {
  font-weight: 600;
  font-size: 16px;
  line-height: 20px;
  letter-spacing: 0%;
  vertical-align: middle;
  color: var(--neutral-text-body);
}

.iconBtn {
  transform: scale(0.8);
}

.body-creator span {
  font-weight: 400;
  font-size: 14px;
  line-height: 18px;
  letter-spacing: 0%;
  vertical-align: middle;
  color: var(--neutral-text-caption);
}

.body_header-input {
  display: flex;
  gap: 10px;
  align-items: center;
}

.body_header-input span {
  font-size: 14px;
  line-height: 18px;
  letter-spacing: 0%;
  vertical-align: middle;
  color: var(--neutral-text-caption);
}

.body_header-input span:nth-child(2) {
  font-weight: 600;
}

.alert {
  display: grid;
  grid-template-columns: auto auto;
  border: 1px solid var(--danger-border-default);
  border-radius: 10px;
  padding: 0 10px;
  box-sizing: border-box;
  gap: 20px;
  align-items: center;
  height: 48px;
}

.alert span:nth-child(1) {
  font-size: 20px;
  color: var(--danger-border-default);
}

.alert span:nth-child(2) {
  font-size: 14px;
  line-height: 16px;
  letter-spacing: 0%;
  vertical-align: middle;
  font-weight: 600;
  color: var(--neutral-text-body);
}

.body_body {
  display: flex;
  flex-direction: column;
  gap: 16px;
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  scrollbar-gutter: stable;
}

.body_body::-webkit-scrollbar {
  width: 8px;
  height: 0px;
  background: var(--neutral-surface-light);
  border-radius: 20px;
}

.body_body::-webkit-scrollbar-thumb {
  background: var(--neutral-surface-subtle);
  border-radius: 5px;
}

.table {
  min-height: 205px;
  max-height: 370px;
  overflow: auto;
  border-radius: 16px;
  border: 1px solid var(--neutral-border-light);
  flex-grow: 0;
  position: relative;
}

.table::-webkit-scrollbar {
  width: 8px;
  height: 0px;
  background: var(--neutral-surface-light);
  border-radius: 20px;
}

.table::-webkit-scrollbar-thumb {
  background: var(--neutral-surface-subtle);
  border-radius: 5px;
}

.table-header {
  position: sticky;
  top: 0;
  z-index: 2;
}

.table-header,
.table-item {
  display: grid;
  width: 100%;
  grid-template-columns:
    minmax(150px, 1fr) minmax(350px, 1fr) minmax(150px, 1fr) minmax(150px, 1fr)
    minmax(200px, 1fr) 45px 45px;
}

.table-header .col {
  background-color: var(--neutral-surface-softer);
  border-bottom: 1px solid var(--neutral-border-light);
}

.col {
  display: flex;
  align-items: center;
  padding: 0 12px;
  height: 40px;
}

.col span {
  width: 100%;
}

.col.description {
  align-items: flex-start;
  padding-top: 12px;
  min-height: 40px;
  height: auto;
}

.description-text {
  font-size: 12px;
  color: var(--neutral-text-caption);
  line-height: 14px;
  white-space: normal;
  overflow: visible;
  text-overflow: initial;
}

.info-popup {
  display: flex;
  flex-direction: column;
  position: absolute;
  z-index: 20;
  background: var(--neutral-background-default);
  border: 1px solid var(--neutral-border-light);
  border-radius: 12px;
  padding: 16px;
  box-shadow: var(--elevation-s);
  min-width: 240px;
  width: 730px;
  height: 550px;
  color: var(--neutral-text-body);
  gap: 12px;
  overflow: auto;
  transform: scale(0);
  transition: 0.3s;
  transform-origin: top center;
}

.info-popup.flipped {
  transform-origin: bottom center;
}

.info-popup span {
  display: flex;
  align-items: center;
  padding-left: 10px;
}

.info-popup.show {
  opacity: 1;
  transform: scale(1);
}

.info-popup p {
  margin: 0 0 8px 0;
  font-size: 14px;
  line-height: 18px;
  color: var(--neutral-text-body);
}

.info-popup p:last-of-type {
  margin-bottom: 0;
}

.info-popup strong {
  font-weight: 600;
  color: var(--neutral-text-body);
}

/* Taxes popup styles - similar to the original component */
.taxes-popup {
  display: flex;
  flex-direction: column;
  position: absolute;
  z-index: 20;
  background: var(--neutral-background-default);
  border: 1px solid var(--neutral-border-light);
  border-radius: 16px;
  padding: 12px 20px 16px;
  box-shadow: var(--elevation-s);
  width: 480px;
  height: auto;
  color: var(--neutral-text-body);
  overflow: auto;
  transform: scale(0);
  transition: 0.3s;
  transform-origin: right top;
}

.taxes-popup.flipped {
  transform-origin: right bottom;
}

.taxes-popup.show {
  opacity: 1;
  transform: scale(1);
}

.taxes-popup__header {
  width: 100%;
  height: 42px;
  border-bottom: 1px solid var(--neutral-border-subtle);
  display: grid;
  grid-template-columns: 200px 1fr;
  align-items: center;
  gap: 20px;
  padding-right: 20px;
}

.taxes-popup__header span,
.taxes-popup__footer span,
.taxes-popup__taxes span {
  color: var(--neutral-text-body);
  font-weight: 800;
  font-size: 14px;
  line-height: 18px;
  letter-spacing: 0%;
  vertical-align: bottom;
}

.taxes-popup__header span.left,
.taxes-popup__footer span.left,
.taxes-popup__taxes span.left,
.taxes-popup__item span.left {
  width: 170px;
  text-align: left;
}

.taxes-popup__header span.right,
.taxes-popup__footer span.right,
.taxes-popup__taxes span.right,
.taxes-popup__item span.right {
  text-align: right;
}

.taxes-popup__footer {
  background-color: var(--primary-surface-shadow-12a);
  height: 40px;
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 20px;
  align-items: center;
  padding: 0 20px;
  border-radius: 10px;
  /* margin-left: 50px; */
}

.taxes-popup__taxes {
  height: 40px;
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 20px;
  align-items: center;
  padding: 0 20px;
  /* margin-left: 50px; */
  border-top: 1px solid var(--neutral-border-subtle);
}

.taxes-popup__empty {
  height: 40px;
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
}

.taxes-popup__empty span {
  color: var(--neutral-text-caption);
  font-size: 14px;
  /* padding: 0 20px 0 70px; */
  flex-shrink: 1;
  width: 100%;
  text-align: center;
}

.taxes-popup__item {
  height: 32px;
  display: grid;
  grid-template-columns: 50px auto 1fr;
  gap: 14px;
  align-items: center;
  padding-right: 12px;
}

.taxes-popup__item span {
  color: var(--neutral-text-body);
  font-size: 14px;
  font-weight: 600;
}

.taxes-popup__item span strong {
  color: var(--neutral-text-caption);
  font-size: 12px;
  font-weight: 400;
}

.taxes-popup__list {
  max-height: 128px;
  overflow: auto;
  scrollbar-gutter: stable both-edges;
  position: relative;
  margin: 10px 0;
}

.taxes-popup__list::-webkit-scrollbar {
  width: 8px;
  height: 0px;
  background: var(--neutral-surface-light);
  border-radius: 20px;
}

.taxes-popup__list::-webkit-scrollbar-thumb {
  background: var(--neutral-surface-subtle);
  border-radius: 5px;
}

.table-item .col span {
  color: var(--neutral-text-body);
}

.col.first {
  padding-left: 20px;
}

.col.last {
  padding-right: 20px;
}

.col.right span {
  text-align: right;
}

.col.left {
  text-align: left;
}

.col span {
  font-weight: 600;
  font-size: 14px;
  line-height: 14px;
  letter-spacing: 0%;
  color: var(--neutral-text-caption);
}

.col a.tag {
  font-size: 11px;
  line-height: 11px;
  font-weight: 600;
  padding: 5px 10px;
  border-radius: 999px;
  text-align: center;
  display: flex;
  align-items: center;
  gap: 5px;
  text-decoration: none;
  width: auto;
  height: 26px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.col a.tag.NEG {
  background-color: var(--primary-surface-shadow-12a);
  color: var(--primary-text-darker);
}

.col a.tag.NEG span.u {
  color: var(--primary-text-darker);
}

input {
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

.input-description {
  text-align: start;
}

input::selection {
  background-color: var(--primary-text-subtle);
  color: var(--neutral-background-default);
}

input:hover:not(:focus):not(.error) {
  border: 1px solid var(--primary-border-subtle);
}

input:focus,
input:active {
  caret-color: var(--primary-text-subtle);
  border: 1px solid var(--primary-text-subtle);
  box-shadow: inset var(--primary-text-subtle) 0px 0px 0px 1px;
}

input.error {
  caret-color: var(--danger-text-subtle);
  border: 1px solid var(--danger-text-subtle);
  box-shadow: inset var(--danger-text-subtle) 0px 0px 0px 1px;
}

.summary-box {
  margin-left: auto;
  border: 1px solid var(--neutral-border-subtle);
  padding: 8px;
  width: 300px;
  height: auto;
  min-width: 300px;
  border-radius: 16px;
  background-color: var(--neutral-background-default);
}

.summary-row {
  display: flex;
  justify-content: space-between;
  gap: 20px;
  align-items: center;
  height: 48px;
  padding: 7px 12px;
}

.summary-row:not(:last-child) {
  border-bottom: 1px solid var(--neutral-border-light);
}

.summary-row.total-row {
  background-color: var(--primary-surface-shadow-12a);
  border-radius: 8px;
  padding: 8px 16px;
  margin: 8px 1px 1px 1px;
  border: none;
  height: 32px;
}

.summary-row span {
  color: var(--neutral-text-body);
}

.summary-row span:nth-child(2) {
  color: var(--neutral-text-body);
}

.total-row span {
  color: var(--neutral-text-body);
}

.body_footer {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.taxes {
  margin-left: auto;
  width: 400px;
  height: auto;
  border: 1px solid var(--neutral-border-light);
  border-radius: 16px;
  overflow: hidden;
  padding: 8px;
}

.taxes__header,
.taxes__footer,
.taxes__default,
.taxes__list-item {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.taxes__header-col,
.taxes__footer-col,
.taxes__default-col {
  display: flex;
  align-items: center;
  height: 32px;
}

.taxes__list-item-col.first span {
  flex-grow: 1;
}

.taxes__default-col.first,
.taxes__list-item-col.first,
.taxes__header-col.first,
.taxes__footer-col.first {
  padding-left: 25px;
}

.taxes__list-item-col {
  display: flex;
  align-items: center;
  height: 32px;
}

.taxes__footer {
  border-radius: 8px;
  overflow: hidden;
}

.taxes__footer-col {
  border-bottom: none;
}

.taxes__footer {
  background-color: var(--primary-surface-shadow-12a);
}

.taxes__default-col,
.taxes__list-item-col {
  border-bottom: none;
}

.taxes__list-item {
  position: sticky;
  left: 0;
}

.taxes__list-item-col {
  height: 28px;
}

.right {
  justify-content: flex-end;
}

.taxes__header-col span,
.taxes__footer-col span,
.taxes__default span,
.taxes__list-item-col span {
  font-weight: 800;
  font-size: 14px;
  line-height: 18px;
  letter-spacing: 0%;
  vertical-align: bottom;
  color: var(--neutral-text-body);
}

.taxes__list {
  overflow: auto;
  max-height: 100px;
  scrollbar-gutter: stable;
  position: relative;
  border-top: 1px solid var(--neutral-border-subtle);
  border-bottom: 1px solid var(--neutral-border-subtle);
  padding: 10px 0;
  margin-bottom: 10px;
}

.taxes__list::-webkit-scrollbar {
  width: 8px;
  height: 0px;
  background: var(--neutral-surface-light);
  border-radius: 20px;
}

.taxes__list::-webkit-scrollbar-thumb {
  background: var(--neutral-surface-subtle);
  border-radius: 5px;
}

.taxes__list-item-col span {
  font-weight: 600;
}

.taxes__default.first {
  border-top: 1px solid var(--neutral-border-light);
}

.taxes__list-item-col strong.percentage {
  color: var(--neutral-text-caption);
  font-size: 12px;
}

.taxes__list-item-col.percentage {
  padding-right: 12px;
}

.colFXR {
  display: flex;
  align-items: center;
  padding-right: 14px;
}

.emptyTax {
  height: 40px;
  display: flex;
  justify-content: center;
  align-items: center;
}

.emptyTax span {
  color: var(--neutral-text-caption);
  font-size: 14px;
}

.taxes__header {
  margin-bottom: 10px;
}

.taxes__footer {
  margin-top: 10px;
}

.footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

/* Button styles for taxes */
.applied {
  color: var(--primary-text-subtle) !important;
}

/* Tax button states */
.col .u-button-icon {
  transition: 0.3s;
}

.col .u-button-icon:not(.applied):hover {
  color: var(--neutral-text-body) !important;
}

.col .u-button-icon.applied:hover {
  color: var(--primary-text-default) !important;
}

.col .u-button-icon:disabled {
  color: var(--neutral-text-disabled) !important;
  cursor: not-allowed;
}

.containerCurrencies {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  position: relative;
  z-index: 9;
}

.noData {
  color: var(--neutral-text-caption) !important;
  height: 40px;
  font-size: 14px !important;
  line-height: 14px !important;
  width: 100%;
  text-align: center !important;
  padding-top: 18px;
}

span.completed {
  color: var(--success-text-darker) !important;
}
</style>
