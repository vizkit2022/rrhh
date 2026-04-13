<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from "vue";
import useSalesStore from "@/stores/sales";
import useGlobalStore from "@/stores/global";
import useOrganizationStore from "@/stores/organization";
import {
  formatCurrency as formatCurrencyHelper,
  convertToNumber,
  getValueFormaRealTime,
} from "@/utils/formatAmount";
import { useI18n } from "vue-i18n";

// Translations I18n
const { t } = useI18n();
const module = "modules.sales.createCreditDebitNote";

//STATES
const salesStore = useSalesStore();
const globalStore = useGlobalStore();
const organizationStore = useOrganizationStore();
const edit = ref(false);
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

// para popup info
const showInfoMenu = ref(false);
const posInfoMenu = ref({});
const currentInfoLine = ref("");

// para popup taxes
const showTaxesMenu = ref(false);
const posTaxesMenu = ref({});
const currentTaxesLine = ref("");

// COMPUTED

//ref del tipo de documento
const currentTypeDocumentCode = computed(() => {
  return salesStore?.formCreditDebitNote?.typeDocument?.code; // credit | debit
})

//UI computed

const labelAmount = computed(() => {
  if (currentTypeDocumentCode.value === "debit") {
    return t(module + ".step4.table.cols.amountInvoiced.label")
  } else {
    return t(module + ".step4.table.cols.amountDiscount.label")
  }
})

// Mock de impuestos disponibles
// const availableTaxes = computed(() => organizationStore?.taxes || []);
const availableTaxes = computed(
  () => salesStore?.formCreditDebitNote?.typeDocument?.taxes || []
);

const currency = computed(() => {
  return organizationStore?.organization?.currency;
});

// Computed para el subtotal (valor a facturar)
const subtotal = computed(() => {
  const total =
    salesStore.formCreditDebitNote.formRegister.businessSaleDocument?.lines?.reduce(
      (sum, item) => {
        return sum + (item.amountPaid?.number || 0);
      },
      0
    );
  return formatData(total, currency.value);
});

// Computed para calcular impuestos totales
const totalTaxes = computed(() => {
  let taxSum = 0;
  let retentionSum = 0;

  salesStore?.formCreditDebitNote?.formRegister?.businessSaleDocument?.lines?.forEach((line) => {
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

  return salesStore?.formCreditDebitNote?.formRegister?.businessSaleDocument?.lines?.some(
    (line) => {
      const amount = line?.totalTaxes?.totalWithTaxes?.number || 0;
      const saldo = line.referenceIncome?.numbersGross?.invoiced?.number || 0;
      const descripcionVacia =
        !line.description || line.description.trim() === "";

      if (currentTypeDocumentCode.value === "debit") {
        return amount === 0 || descripcionVacia;
      }

      return amount === 0 || amount > saldo || descripcionVacia;
    }
  );
});

// Mostrar alerta SOLO si es mayor al saldo
const invalidNumbers = computed(() => {
  if (salesStore?.formCreditDebitNote?.typeDocument?.code === "debit")
    return false;

  return salesStore?.formCreditDebitNote?.formRegister?.businessSaleDocument?.lines?.some(
    (line) => {
      const amount = line?.totalTaxes?.totalWithTaxes?.number || 0;
      const saldo = line.referenceIncome?.numbersGross?.invoiced?.number || 0;
      return amount > saldo;
    }
  );
});

const invalidNumbersLine = ((line) => {  
  const amount = line?.totalTaxes?.totalWithTaxes?.number || 0;
  const saldo = line.referenceIncome?.numbersGross?.invoiced?.number || 0;

  if (salesStore?.formCreditDebitNote?.typeDocument?.code === "debit")
    return false;

  return amount > saldo;
})

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

  salesStore?.formCreditDebitNote?.formRegister?.businessSaleDocument?.lines?.forEach((line) => {
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
  const URL_BUSINESS = `/incomesv2/project/${item.referenceIncome.project._id}/income/${item.referenceIncome._id}`;
  navigateTo(URL_BUSINESS, { external: true, open: { target: "_blank" } });
};

const confirmReference = () => {
  const current =
    salesStore.formCreditDebitNote.formRegister.dataNote.reference;
  salesStore.formCreditDebitNote.formRegister.dataNote.reference =
    current.replace(/\s{2,}/g, " ");
  edit.value = false;
};

const inputEventReference = (e) => {
  const val = e.target.value;
  salesStore.formCreditDebitNote.formRegister.dataNote.reference = val;
};

const deleteItem = (pos) => {
  if (
    salesStore.formCreditDebitNote.formRegister.businessSaleDocument.lines
      .length > 1
  ) {
    salesStore.formCreditDebitNote.formRegister.businessSaleDocument.lines.splice(
      pos,
      1
    );
  }
};

const onValueToInvoiceInput = (event, p) => {
  const rawValue = event.target.value;
  change.value = true;

  // Si está vacío, resetear valores
  if (rawValue === "") {
    const line =
      salesStore.formCreditDebitNote.formRegister.businessSaleDocument.lines[p];
    line.amountPaid.tempNumber = 0;
    line.amountPaid.number = 0;
    line.amountPaid.value = "0";
    line.amountPaid.tempValue = "0";

    // 🔑 Recalcular impuestos en base a 0
    calcTaxesForLine(line);
    return;
  }

  // Usar helper existente para formateo en tiempo real
  const numbers = getValueFormaRealTime(rawValue, currency.value, "amount");
  if (numbers) {
    salesStore.formCreditDebitNote.formRegister.businessSaleDocument.lines[
      p
    ].amountPaid.number = numbers.numericValue;
    salesStore.formCreditDebitNote.formRegister.businessSaleDocument.lines[
      p
    ].amountPaid.tempValue = numbers.formattedValue;
    salesStore.formCreditDebitNote.formRegister.businessSaleDocument.lines[
      p
    ].amountPaid.value = formatCurrency(numbers.numericValue, currency.value);

    // Recalcular impuestos cuando cambia el valor
    calcTaxesForLine(
      salesStore.formCreditDebitNote.formRegister.businessSaleDocument.lines[p]
    );
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
      true
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
  salesStore.formCreditDebitNote.formRegister.businessSaleDocument.lines[
    p
  ].description = val;
};

const onFocusDescription = (event, line) => {
  event.target.select();
};

// funciones popup del button icon info de descripcion
const showInfo = (event, line) => {
  if (showInfoMenu.value && currentInfoLine.value === line) {
    closeInfo();
    return;
  }

  currentInfoLine.value = line;
  calcPositionPopUp(event, "info");
  setTimeout(() => {
    showInfoMenu.value = true;
    showTaxesMenu.value = false;
  }, 10);
};

// popup taxes
const showTaxes = (event, line) => {
  if (showTaxesMenu.value && currentTaxesLine.value === line) {
    closeTaxes();
    return;
  }

  // Calcular impuestos antes de mostrar el menú
  calcTaxesForLine(line);
  currentTaxesLine.value = line;
  calcPositionPopUp(event, "taxes");
  setTimeout(() => {
    showTaxesMenu.value = true;
    showInfoMenu.value = false;
  }, 10);
};

const closeTaxes = () => {
  showTaxesMenu.value = false;
};

const calcPositionPopUp = (event, type = "info") => {
  const target = event.target.closest("button");
  const rect = target.getBoundingClientRect();
  const container = document.querySelector(".container");
  const containerRect = container.getBoundingClientRect();

  let top = rect.top - containerRect.top + rect.height + 40;

  // Ajuste de left según el tipo
  let left;
  if (type === "info") {
    left = rect.left - containerRect.left - 295;
  } else if (type === "taxes") {
    left = rect.left - containerRect.left - 420;
  } else {
    left = rect.left - containerRect.left;
  }

  // ajuste si se pasa del lado derecho
  const popupWidth = type === "taxes" ? 420 : 260;
  if (left + popupWidth > containerRect.width) {
    left = containerRect.width - popupWidth - 12;
  }

  // ajuste si se pasa del fondo
  const popupHeight = type === "taxes" ? 300 : 140;
  if (top + popupHeight > containerRect.height) {
    top = rect.top - containerRect.top - popupHeight - 8;
  }

  if (type === "info") {
    posInfoMenu.value = { top, left };
  } else if (type === "taxes") {
    posTaxesMenu.value = { top, left };
  }
};

const closeInfo = () => {
  showInfoMenu.value = false;
};

// Función para calcular impuestos de una línea
const calcTaxesForLine = (line) => {
  line.fullTaxes = [];

  const taxDefault =
    salesStore?.formCreditDebitNote?.typeDocument?.taxDefault || [];

  availableTaxes.value.forEach((availableTax) => {
    const baseAmount = line.amountPaid?.number || 0;
    let taxAmount = 0;

    // condición inicial: está en la línea o es default
    let isSelected = line.taxes?.includes(availableTax._id);

    // primera vez → activar defaults
    if (!line._initialized && taxDefault.includes(availableTax._id)) {
      isSelected = true;
      if (!line.taxes.includes(availableTax._id)) {
        line.taxes.push(availableTax._id);
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
  
  // Calcular totalTaxes para la línea
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

  // marcar línea como inicializada para no reactivar defaults después
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
  const lineIndex =
    salesStore.formCreditDebitNote.formRegister.salesDocument.findIndex(
      (line) => line._id === currentTaxesLine.value._id
    );

  if (lineIndex !== -1) {
    salesStore.formCreditDebitNote.formRegister.salesDocument[lineIndex] = {
      ...currentTaxesLine.value,
    };
  }
};

const handleClickOutside = (event) => {
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
    salesStore.formCreditDebitNote.formRegister.dataNote.issueDate
  ).toISOString();

  // Fecha de expiración
  const formExpirationDate = new Date(
    salesStore.formCreditDebitNote.formRegister.dataNote.expirationDate
  ).toISOString();

  // Función para agrupar impuestos de todas las líneas
  const aggregateTaxes = () => {
    const taxMap = new Map();

    salesStore.formCreditDebitNote.formRegister.salesDocument.forEach(
      (line) => {
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
      }
    );

    return Array.from(taxMap.values());
  };

  // PENDIENTE CON REINA PARA MANDAR LOS CAMPOS CORRECTOS DE NOTAS DE CREDITO Y DEBIT
  const body = {
    salesDocumentType: salesStore.formCreditDebitNote.typeDocument._id,
    salesDocument:
      salesStore.formCreditDebitNote.formRegister.salesDocument.at(0)._id, // PENDIENTE solo credito o debito
    organization: globalStore.organizationId,
    client: {
      _id:
        salesStore.formCreditDebitNote.formRegister.salesDocument.at(0).client
          .contact ||
        salesStore.formCreditDebitNote.formRegister.salesDocument.at(0).client
          ._id,
    },
      clientData: {
      data: {
        idNumber: salesStore.formCreditDebitNote.formRegister.salesDocument[0].client.data.idNumber || "",
        legalName: salesStore.formCreditDebitNote.formRegister.salesDocument[0].client.data.legalName || "",
        businessActivity: salesStore.formCreditDebitNote.formRegister.salesDocument[0].client.data.businessActivity || "",
      },
      address: { ...salesStore.formCreditDebitNote.formRegister.salesDocument[0].client.address }
    },
    currency: {
      _id: organizationStore?.organization?.currency?._id,
    },
    reference: salesStore.formCreditDebitNote.formRegister.dataNote.reference,
    number: salesStore.formCreditDebitNote.formRegister.dataNote.noteNumber,
    paymentTerm:
      salesStore.formCreditDebitNote.formRegister.dataNote.paymentCondition
        .value,
    issueDate: formIssueDate,
    expirationDate: formExpirationDate,
    status: "issue",
    lines:
      salesStore.formCreditDebitNote.formRegister.businessSaleDocument.lines.map(
        (line, order) => ({
          referenceIncome: line.referenceIncome._id,
          name: line.referenceIncome.name,
          description: line.description,
          longDescription: line.longDescription,
          order: order,
          numbers: {
            totalNet: { number: line?.amountPaid?.number || 0 },
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
        })
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

  // PENDIENTE EL ENDPOINT PARA CREAR NOTAS DE CREDITO O DEBITO
  globalStore.loading = true;
  await salesStore.createFV(body);
  emit("reloadSales");
  globalStore.loading = false;

  emit("updatePadding", "24px 24px");
  emit("closeModal");
};

const backStep = () => {
  emit("updatePadding", "24px 24px");
  emit("changeStep", false);
};

const closeStep = () => {
  salesStore?.cleanFormCreditDebitNote?.();
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

onMounted(async () => {
  document.addEventListener("click", handleClickOutside);
  // document.addEventListener("keydown", handleEscape);

  globalStore.loading = true;

  // Carga de lineas de documentos de venta seleccionado
  const respLines = await salesStore.getSalesDocumentLinesByDocumentId(
    salesStore.formCreditDebitNote.formRegister.salesDocument.at(0)._id,
    false
  );
  salesStore.formCreditDebitNote.formRegister.businessSaleDocument = respLines;

  salesStore.formCreditDebitNote.formRegister.businessSaleDocument.lines.forEach(
    (line) => {
      line.description = ""
      line.longDescription = ""
      line.amountPaid = {
        number: 0,
        value: "0",
        tempNumber: 0,
        tempValue: "0",
      };
    }
  );

  // Cargar impuestos
  const resp = await organizationStore.taxesByOrganization();
  organizationStore.taxes = resp;

  globalStore.loading = false;

  salesStore.formCreditDebitNote.formRegister.businessSaleDocument.lines.forEach((line) => {
    if (!line?.taxes) line.taxes = [];
    if (!line?.fullTaxes) line.fullTaxes = [];
    calcTaxesForLine(line);
  });
});

onBeforeUnmount(() => {
  document.removeEventListener("click", handleClickOutside);
  // document.removeEventListener("keydown", handleEscape);
});
</script>

<template>
  <div class="container">
    <div class="header">
      <!-- <span>{{ `Crear ${salesStore?.formDocInvoice?.typeDocument?.code} - Asignar Valores` }}</span> -->
      <span>{{
        t(`${module}.step4.titleHeader`, {
          typeDoc: salesStore?.formCreditDebitNote?.typeDocument?.name,
        })
      }}</span>
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
                salesStore?.formCreditDebitNote?.formRegister?.dataNote
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
                name: salesStore?.formCreditDebitNote?.formRegister?.salesDocument?.at(
                  0
                )?.client?.data?.legalName,
                src: salesStore?.formCreditDebitNote?.formRegister?.salesDocument?.at(
                  0
                )?.client?.imgUrl,
              }"
              :size="24"
            />
            <span
              v-text="
                salesStore?.formCreditDebitNote?.formRegister?.salesDocument?.at(
                  0
                )?.client?.data?.legalName
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
                salesStore.formCreditDebitNote.formRegister.dataNote.reference
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
        <div class="alert" v-if="invalidNumbers && change">
          <span class="u u-info-circle"></span>
          <span>{{ t(module + ".step4.alert.invalidAmountInvoiced") }}</span>
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
              <span> {{ t(module + ".step4.table.cols.AmountBilled.label") }}</span>
            </div>
            <div v-if="currentTypeDocumentCode === 'debit'" class="col right">
              <span>{{
                t(module + ".step4.table.cols.balanceInvoice.label")
              }}</span>
            </div>
            <div class="col right">
              <span>{{
                labelAmount
              }}</span>
            </div>
            <div class="col right"></div>
            <div class="col right last"></div>
          </div>
          <div
            class="table-item"
            v-for="(item, p) in salesStore?.formCreditDebitNote?.formRegister
              ?.businessSaleDocument?.lines"
            :key="item._id"
          >
            <div class="col left first">
              <u-tags
                :text="`NEG-${item?.referenceIncome?.idNumber || '-'} `"
                icon="click"
                size="xs"
                :delete="false"
                color="--info-surface-darker"
                background="--info-surface-light"
                class="truncateText"
                style="cursor: pointer"
                max-width="80px"
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
                icon="info"
                type="text"
                color="--neutral-text-caption"
                size="s"
                @click="showInfo($event, item)"
              />
            </div>
            <div class="col right">
              <span v-text="formatCurrency(item?.referenceIncome?.numbersGross?.invoiced?.number, currency)" :title="item?.referenceIncome?.numbersGross?.invoiced?.number"></span>
            </div>
            <div v-if="currentTypeDocumentCode === 'debit'" class="col right">
              <span
                v-text="
                  formatCurrency(
                    item?.referenceIncome?.numbersGross?.toInvoice?.number,
                    currency
                  )
                "
                :title="item?.referenceIncome?.numbersGross?.toInvoice?.number"
              ></span>
            </div>
            <div class="col right">
              <input
                type="text"
                :id="`input-${p}-value`"
                @focus="selectAll($event)"
                @input="onValueToInvoiceInput($event, p)"
                @keydown="handleKeyDown($event, p)"
                @focusin="onFocusInput($event, item)"
                @focusout="onBlurInput($event, item)"
                :value="item?.amountPaid?.tempValue || item?.amountPaid?.value"
                :class="invalidNumbersLine(item) ? 'error' : ''"
                autocomplete="off"
              />
            </div>
            <div class="col right">
              <u-button-icon
                icon="taxes"
                size="s"
                type="text"
                :color="item?.taxes?.length ? '--primary-text-subtle' : color"
                :disabled="false"
                @click="showTaxes($event, item)"
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
                  salesStore.formCreditDebitNote.formRegister
                    .businessSaleDocument.lines.length === 1
                "
              />
            </div>
          </div>
        </div>

        <!-- popup info -->
        <div
          class="info-popup"
          :class="{ show: showInfoMenu }"
          :style="{
            top: posInfoMenu.top + 'px',
            left: posInfoMenu.left + 'px',
          }"
        >
          <span class="body-s-sb">{{
            t(
              module +
                ".step4.table.cols.shortDescription.longDescription.label"
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
                  '.step4.table.cols.shortDescription.longDescription.placeholder'
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
          :class="{ show: showTaxesMenu }"
          :style="{
            top: posTaxesMenu.top + 'px',
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
                <u-switch v-model="tax.select" @click="changeStateTax" />
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
              <span>{{ t(module + ".step4.table.tooltips.taxes.noTaxes") }}</span>
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

        <div class="taxes">
          <div class="taxes__header">
            <div class="taxes__header-col first">
              <span>{{ t(module + ".step4.table.tableTaxes.subtotal") }}</span>
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
              <span>{{ t(module + ".step4.table.tableTaxes.emptyTax") }}</span>
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
                v-text="'-' + (totalTaxes.retentions?.value || '$0')"
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
.container {
  display: grid;
  grid-template-rows: auto 1fr auto;
  gap: 24px;
  width: 80vw;
  max-width: v-bind(
    "currentTypeDocumentCode === 'credit' ? '1104px' : '1204px'"
  );
  height: 80vh;
  max-height: 752px;
  box-sizing: border-box;
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

.body {
  display: grid;
  grid-template-rows: auto 1fr;
  gap: 24px;
  min-height: 0; 
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
  grid-template-columns: auto 300px;
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
}

.table {
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
  grid-template-columns: v-bind("currentTypeDocumentCode == 'credit' ? ' minmax(200px, 1fr) minmax(350px, 1fr) minmax(150px, 1fr) minmax(150px, 1fr)  45px 45px' : 'minmax(200px, 1fr) minmax(350px, 1fr)  minmax(150px, 1fr) minmax(150px, 1fr)minmax(200px, 1fr) 45px 45px' ");
  /* grid-template-columns:
    minmax(200px, 1fr) minmax(350px, 1fr) minmax(150px, 1fr) minmax(150px, 1fr)
    minmax(200px, 1fr) 45px 45px; */
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
  padding: 0 20px 0 70px;
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
  max-height: 138px;
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
</style>
