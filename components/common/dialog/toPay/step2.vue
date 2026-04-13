<script setup>
// Importaciones
import { ref, computed, onMounted } from "vue";
import { formatCurrency, convertToNumber } from "@/utils/formatAmount";
import useOrganizationStore from "@/stores/organization";
import usepaymentsStore from "@/stores/payments";

// Stores
const organizationStore = useOrganizationStore();
const paymentsStore = usepaymentsStore();  

// Props
const props = defineProps({
  mode: String, // Modo: "pagarDocumento" o "pagarCompra"
});

// Variables y constantes
const currencyDefault = ref(organizationStore.organization.currency);
const lines = paymentsStore.toPay.lines;

// Configuración del Bus de Eventos
const { $bus } = useNuxtApp();
$bus.$emit("updateDimensions", { width: "800px", height: "90vh" });

// Inicialización de `percentage` y `amountPaid` en cada línea
lines.forEach(line => {
  const maxAmount = line.totalPayable.number - line.totalPaid.number;
  line.amountPaid = { number: maxAmount, value: formatCurrency(maxAmount, currencyDefault.value, false) };
});

const validateTotalToPay = (line) => {
  const maxAmount = line.totalPayable.number - line.totalPaid.number;
  console.log("maxAmount",maxAmount);
  if (line.amountPaid.number > maxAmount) {
    line.amountPaid.value = formatCurrency(maxAmount, currencyDefault.value, false);
    handleInputToPay(line);
    //toast.error("El total a pagar no puede exceder el monto permitido.");
  }
};

const handleInputPercentage = (line) => {
  // Convertir el valor de porcentaje a número
  let percentageValue = convertToNumber(line.percentage.value, currencyDefault.value);

  // Limitar el porcentaje a un máximo de 100
  percentageValue = Math.min(percentageValue, 100);
  line.percentage.number = percentageValue;

  // Formatear el valor del porcentaje
  line.percentage.value = percentageValue.toString();

  // Calcular el monto a pagar basado en el porcentaje
  const toPay = (line.totalPayable.number * percentageValue) / 100;

  // Actualizar `amountPaid` con el monto calculado
  line.amountPaid.number = toPay;
  line.amountPaid.value = formatCurrency(toPay, currencyDefault.value, false);

  validateTotalToPay(line);
};

const handleInputToPay = (line) => {
  // Convertir el valor de `amountPaid` a número
  let amountValue = convertToNumber(line.amountPaid.value, currencyDefault.value);

  // Limitar el monto a pagar al total pagable
  amountValue = Math.min(amountValue, line.totalPayable.number);
  line.amountPaid.number = amountValue;

  // Formatear el valor de `amountPaid`
  line.amountPaid.value = formatCurrency(amountValue, currencyDefault.value, false);

  // Calcular el porcentaje basado en el monto a pagar
  const percentage = parseFloat(((amountValue / line.totalPayable.number) * 100).toFixed(2));

  // Actualizar `percentage` con el valor calculado
  line.percentage.number = percentage;
  line.percentage.value = percentage.toString();

  validateTotalToPay(line);
};

// Inicialización de `percentage` y `amountPaid` en cada línea
lines.forEach(line => {
  handleInputToPay(line);
});

// Cálculo del total a pagar
paymentsStore.toPay.totalToPay = computed(() => {
  const totalAmount = lines.reduce((acc, line) => acc + line.amountPaid.number, 0);
  return {
    number: totalAmount,
    value: formatCurrency(totalAmount, currencyDefault.value, false),
  };
});


const abbreviateWords = (text) => {
  return text
    .split(' ') // Divide el texto en palabras
    .map(word => word.charAt(0).toUpperCase()) // Toma la primera letra en mayúscula
    .join('.') // Une las iniciales con un punto
    .replace(/\.$/, ''); // Elimina el punto final
}
// Configuración de la tabla
const configDocumento = {
  header: {
    height: 52,
    subheight: 52,
  },
  item: {
    height: 52,
  },
  cols: [
    {
      translateRoute: "topay.tabla.documento",
      flex: "left",
      width: "minmax(130px, 1fr)",
      show: true,
      order: 1,
      prop: {
        text: "reference",
      },      
      type: "custom",
      slotName: "document",
    },
    {
      translateRoute: "topay.tabla.col1",
      flex: "left",
      width: "minmax(130px, 1fr)",
      show: true,
      order: 1,
      prop: {
        text: "reference",
      },
      type: "text",
    },
    {
      translateRoute: "topay.tabla.col2-document",
      flex: "right",
      width: "minmax(130px, 1fr)",
      show: true,
      order: 1,
      prop: {
        text: "totalPayable/value",
      },
      type: "currency",
    },
    {
      name: {
        es: "%",
        en: "%",
      },
      flex: "right",
      width: "110px",
      show: true,
      order: 1,
      prop: {
        text: "percentage.value",
      },
      type: "custom",
      slotName: "percentage",
    },
    {
      translateRoute: "topay.tabla.col4",
      flex: "right",
      width: "minmax(130px, 1fr)",
      show: true,
      order: 1,
      prop: {
        text: "amountPaid.value",
      },
      type: "custom",
      slotName: "toPay",
    },
  ],
};

const configcompra = {
  header: {
    height: 52,
    subheight: 52,
  },
  item: {
    height: 52,
  },
  cols: [
    {
      translateRoute: "topay.tabla.outcome",
      flex: "left",
      width: "minmax(130px, 1fr)",
      show: true,
      order: 1,
      prop: {
        text: "reference",
      },
      type: "custom",
      slotName: "outcome",
    },
    {
      translateRoute: "topay.tabla.col1",
      flex: "left",
      width: "minmax(130px, 1fr)",
      show: true,
      order: 1,
      prop: {
        text: "reference",
      },
      type: "text",
    },
    {
      translateRoute: "topay.tabla.col2-outcome",
      flex: "right",
      width: "minmax(130px, 1fr)",
      show: true,
      order: 1,
      prop: {
        text: "totalPayable/value",
      },
      type: "currency",
    },
    {
      name: {
        es: "%",
        en: "%",
      },
      flex: "right",
      width: "110px",
      show: true,
      order: 1,
      prop: {
        text: "percentage.value",
      },
      type: "custom",
      slotName: "percentage",
    },
    {
      translateRoute: "topay.tabla.col4",
      flex: "right",
      width: "minmax(160px, 1fr)",
      show: true,
      order: 1,
      prop: {
        text: "amountPaid.value",
      },
      type: "custom",
      slotName: "toPay",
    },
  ],
};
</script>


<template>
  <div class="container-modal">
    <!-- Encabezado -->
    <div class="container-modal__header">
      <span>
        {{ $t("topay.header." + props.mode) + " - " + $t("topay.subheader.step2") }}
      </span>
      <u-button-icon
        icon="close"
        class="btnIconModify"
        type="outlined"
        color="--neutral-text-caption"
        size="m"
        @click="$bus.$emit('CloseModalPayment')"
      />
    </div>

    <!-- Contenido -->
    <div class="container-modal__content">
      <div>
        <div class="info-avatar__details">
          <u-avatar
            :user="{
              name: paymentsStore?.toPay?.supplier?.data?.legalName || '',
              src: paymentsStore?.toPay?.supplier?.imgUrl || '',
            }"
            :size="24"
          />
          <span class="slot-legalname">
            {{ paymentsStore?.toPay?.supplier?.data?.legalName || "Legal Name" }}
          </span>
        </div>
      </div>

      <!-- Tabla Interactiva -->
      <TableBasicInteractive
        :configTable="props.mode === 'pagarDocumento' ? configDocumento : configcompra"
        :content="lines"
        :loading="false"
      >

        <!-- Slot para outcome -->
        <template v-slot:outcome="item">
          <div class="container-pill-text">
            <span :class="`pill ${item.item.type}`">{{ item.item.type }}</span>
            <span class="outcome-text">{{ item.item.idNumber }}</span>
          </div>
        </template>

        <!-- Slot para documento -->
        <template v-slot:document="item">
          <div class="container-pill-text">
            <span class="pill">{{item?.item?.documentType?.code}}</span>
            <span class="outcome-text">{{item?.item?.documentNumber}}</span>
          </div>
        </template>

        <!-- Slot para porcentaje -->
        <template v-slot:percentage="item">
          <div class="container-percentage">
            <u-input
              size="s"
              align="right"
              v-model="item.item.percentage.value"
              @input="handleInputPercentage(item.item)"
            />
            <div class="percentage-symbol">
              <span>%</span>
            </div>
          </div>
        </template>

        <!-- Slot para monto a pagar -->
        <template v-slot:toPay="item">
          <u-input
            size="s"
            align="right"
            v-model="item.item.amountPaid.value"
            @input="handleInputToPay(item.item)"
          />
        </template>
      </TableBasicInteractive>

      <!-- Total a Pagar -->
      <div class="total-container">
        <div class="total-footer">
          <span>Total a Pagar</span>
          <span>{{ paymentsStore.toPay.totalToPay.value }}</span>
        </div>
      </div>
    </div>

    <!-- Pie de página -->
    <div class="container-modal__footer">
      <u-button
        :text="'Volver'"
        type="outlined"
        class="mainBtnModify"
        @click="$bus.$emit('closeDialog');" 
       />
      <!-- despues trabajar cuando exista el poder volver $bus.$emit('updatedStepPay', 1) -->
      
      <u-button
        :text="'Siguiente'"
        class="mainBtnModify"
        @click="$bus.$emit('updatedStepPay', 3)"
        :disabled="!lines.every(line => line.amountPaid.number != 0)"
      />
    </div>
  </div>
</template>

<style scoped>
span,
label,
button {
  font-family: Nunito;
}

/* Sections */
.container-modal {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  gap: 24px;
}

 
.slot-reference{
  color: var(--neutral-text-body);
  font-weight: 600;
  size: 16px;
  line-height: 20px;
}

.slot-legalname{
  color: var(--neutral-text-caption);
  font-weight: 400;
  size: 14px;
  line-height: 18px;
}

.container-modal__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.container-modal__header span {
  font-size: 16px;
  font-weight: 600;
  line-height: 20px;
  color: var(--neutral-text-body);
}

.container-modal__content {
  display: flex;
  flex-direction: column;
  gap: 24px;
  height: 100%;
  overflow-y: auto;
  padding: 0 5px 2px 0;
}

.container-modal__footer {
  margin-top: auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

.container-modal__content::-webkit-scrollbar {
  width: 8px;
  background: var(--neutral-surface-light);
  border-radius: 20px;
}

.container-modal__content::-webkit-scrollbar-thumb {
  background: var(--neutral-surface-subtle);
  border-radius: 5px;
}

.container-pill-text{
  display: flex;
  align-items: center;
  gap: 5px;
}

.outcome-text{
  color: var(--neutral-text-caption);
}

.pill {
  font-size: 12px;
  top: 0px;
  right: 0px;
  color: var(--neutral-text-caption);
  padding: 4px 8px;
  background-color: var(--neutral-surface-light);
  border-radius: 10px;
}

.OC {
 
  color: var(--info-text-darker); 
  background-color: var(--info-surface-light);
 
}

.FXR {
  color: var(--warning-text-darker); 
  background-color: var(--warning-surface-light);
}
 
 

.table-footer {
  display: flex;
  justify-content: space-between;
}
 
 

.container-percentaje {
  width: 100%;
  position: relative;
}

.container-percentaje::v-deep(.containerInput input) {
  padding-right: 32px !important;
  width: 100%;
}

.container-percentaje > div.percentaje {
  position: absolute;
  top: 7px;
  right: 14px;
  color: var(--neutral-text-caption);
}

 

.info-avatar__details {
  display: flex;
  align-items: center;
  gap: 6px;
}

.container-percentage{
  position: relative;
}

.container-percentage::v-deep(.containerInput input) {
  padding-right: 30px !important;
}

.container-percentage > div.percentage-symbol {
  position: absolute;
  top: 7px;
  right: 14px;
  z-index: 0;
} 

.percentage-symbol {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 10px;
  position: absolute;
  right: 10px;
  z-index: 1;
  color: var(--neutral-text-body);
}

.percentaje .u {
  animation: pulse ease-in-out 1s infinite;
  border-radius: 50%;
}

.total-footer{
  gap: 24px;
  min-width: 300px;
  display: flex;
  justify-content: space-between;
  padding-inline: 12px;
  padding-block: 6px;
  color: var(--neutral-text-body);
  background-color: var(--primary-surface-shadow-12a);
  border-radius: 8px;  
}
.total-container{
  align-self: flex-end;
  width: fit-content;
  padding: 6px;
  border: solid 1px var(--neutral-border-subtle) ;
  border-radius: 16px;  
}

@keyframes pulse {
  0% {
    box-shadow: 0 0 0 0 rgba(224, 85, 75, 0.3);
  }

  70% {
    box-shadow: 0 0 0 10px rgba(224, 75, 75, 0);
  }

  100% {
    box-shadow: 0 0 0 0 rgba(224, 75, 75, 0);
  }
}

/* CUSTOM COMPONENTS - MODIFY */
.btnIconModify {
  border-radius: 50%;
}

.mainBtnModify {
  min-width: 135px;
}

</style>
