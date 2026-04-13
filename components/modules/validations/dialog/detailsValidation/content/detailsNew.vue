<script setup>
import useValidationStore from "@/stores/validations";
import useGlobalStore from "@/stores/global";
import useOrganizationStore from "@/stores/organization";
import { formatCurrency } from "@/utils/formatAmount";

//STORE
const validationStore = useValidationStore();
const globalStore = useGlobalStore();
const organizationStore = useOrganizationStore();

//PROPS 
const props = defineProps({
  data: {
    type: Object,
    required: false
  }
})

//CONSTANTS
const dataDetails = ref({});
const currency = organizationStore.organization.currency;
const lines = ref([]);
const rutaOutcome = ref('');

// Cambiar de un solo ref a un objeto que maneje el estado por línea
const amplificacionStates = ref({});

// COMPUTED 

//style de emitido por y monto superior
const textRedCreate = computed(() => {
  return dataDetails.value.reason?.code === 'issued_by' ? 'text-danger' : 'text-gray';
});

// style de emitido por y monto superior
const textRedTotal = computed(() => {
  return dataDetails.value.reason?.code === 'higher_amount' ? 'text-danger' : 'text-neutral-body';
})


//FUNCIONES

const getDifferenceClass = (value) => {
  const num = Number(value);
  if (isNaN(num)) return 'text-neutral-body';
  if (num < 0) return 'text-danger';
  if (num > 0) return 'text-success';
  return 'text-neutral-body';
};

// Función para toggle individual por línea
const toggleAmplificacion = (lineIndex) => {
  if (amplificacionStates.value[lineIndex] === undefined) {
    amplificacionStates.value[lineIndex] = false;
  }
  amplificacionStates.value[lineIndex] = !amplificacionStates.value[lineIndex];
}

// Función para verificar si una línea específica está abierta
const isAmplificacionOpen = (lineIndex) => {
  return amplificacionStates.value[lineIndex] || false;
}

// Función para verificar si un monto es negativo (para diferencia)
// const isNegative = (value) => {
//   return typeof value === 'number'
//     ? value < 0
//     : String(value).includes('-');
// }

// Función para calcular la diferencia
const diference = (spentAmount, currentSpending) => {
  return spentAmount - currentSpending;
}

onMounted(async () => {

  try{
    globalStore.loading = true;
    const resp = await validationStore.getValidationOutcomeById( 'validation' , validationStore.idValidationDetail, false);
    dataDetails.value = resp;
    lines.value = dataDetails.value.outcome.lines
    rutaOutcome.value = `/outcomes/${dataDetails.value.outcome._id}`
    console.log('lines', lines.value);
    console.log('dataDetailsNew', dataDetails.value.outcome._id);
    console.log('style color red', textRedClass.value)
  } catch(error) {
    console.log(error);
  } finally {
    validationStore.isfetchDetails = true
    globalStore.loading = false;
  }
})

</script>

<template>
  <div class="content__details">
    <!-- Lineas (EXCEDE MONTO POR GASTAR) -->
    <div class="content__lineas" v-if="dataDetails.reason?.code === 'exceeds_amount_to_spend'">
      <div class="content_title_lines">
        <span>Líneas fuera del presupuesto</span>
        <span>Monto</span>
      </div>
      
      <!-- Contenedor con scroll -->
      <div class="lines-container">
        <div class="content__amplificacion" v-for="(line, index) in lines" :key="index">
          <div class="linea" @click="toggleAmplificacion(index)">
            <div class="ladoIzq">
              <span 
                class="u u-chevron-down flecha"
                :class="{ 'rotated': isAmplificacionOpen(index) }"
              ></span>
              <span>{{ line.name }}</span>
            </div>
            <span :class="['ladoDer', getDifferenceClass(diference(line.numbers.sumBudget.number, line.numbers.toSpend.number))]">{{ formatCurrency(diference(line.numbers.sumBudget.number, line.numbers.toSpend.number), currency, true) }}</span>
          </div>
          
          <!-- Detalles de amplificación individual -->
          <div
            class="detailsAmplificacion"
            :class="{ 'is-open': isAmplificacionOpen(index) }"
          >
            <div class="details-content">
              <div class="data monto">
                <span class="label">Monto por gastar</span>
                <span class="value">{{ line.numbers.sumBudget.value }}</span>
              </div>
              <div class="data gasto">
                <span class="label">Gasto Actual</span>
                <span class="value value_gasto">{{ line.numbers.toSpend.value }}</span>
              </div>
              <div class="data final">
                <span class="label">Diferencia</span>
                <span   :class="[ 'value value_final', getDifferenceClass( diference(line.numbers.sumBudget.number, line.numbers.toSpend.number) )]">{{ formatCurrency(diference(line.numbers.sumBudget.number, line.numbers.toSpend.number), currency, true) }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

        <!-- EMITIDO POR y MONTO SUPERIOR -->
          <div v-if="dataDetails.reason?.code === 'higher_amount' || dataDetails.reason?.code === 'issued_by'">
      
                  <div class="containerBody">
                <!-- Contenido actual -->

                <div class="bodyIzq">

                    <div class="containerTransactions">
                        <span class="titleTransactions">ORDEN DE COMPRA N°{{ dataDetails.outcome.idNumber }}</span>
                        <div class="containerAccount" >
                            <span :class="textRedCreate">CREADA POR</span>
                            <u-avatar :user="{ name: 'Banco de Chile', src: `${dataDetails.applicant.at(0).imgUrl}` }" :size="24" />
                            <span :class="textRedCreate">{{ dataDetails.applicant.at(0).data.legalName.toUpperCase() }}</span>
                        </div>
                    </div>

                    <div class="containerInfoTransaction">
                        <div class="left">
                            <div class="info">
                                <u-avatar :user="{ name: 'Banco de Chile', src: 'texto'}" :size="24" />
                                <div class="infoText">
                                    <span class="title">{{ dataDetails.outcome.reference }}</span>
                                    <span class="subtitle">{{ dataDetails.outcome.income.at(0).name }} - {{ dataDetails.outcome.income.at(0).project.name }} </span>
                                </div>
                            </div>
                        </div>

                        <div class="right">
                            <div class="flujo">
                                <span class="u" ></span>
                                <span :class="textRedTotal" class="title">{{ dataDetails.outcome.numbers.total.value }}</span>
                            </div>
                            <span class="date">Total de compra</span>
                        </div>
                    </div>
                </div>
            </div>

    </div>

        <div class="content__action" v-if="validationStore.typeValidation === 'validation'">
     <!-- <NuxtLink :to="`outcomes/${rutaOutcome}`" target="_blank">
        <u-button text="Ver Compra" type="outlined" icon="open" :revers="true" size="m"  />
     </NuxtLink>  -->

     <NuxtLink :to="`${rutaOutcome}`"  >
        <u-button text="Revisar Compra" type="outlined" icon="open" :revers="true" size="m"  />
     </NuxtLink> 

    </div>

  </div>

</template>

<style scoped>
.content__details {
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;
  width: 100%;
}

/* STYLES EXCEDE MONTO POR GASTAR */

.content__lineas {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  border: 1px solid var(--neutral-border-subtle);
  border-radius: 16px;
}

.content_title_lines {
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  width: 568px;
  height: 40px;
  padding: 8px 18px;
  margin-top: 16px;
  border-bottom: 1px solid var(--neutral-border-subtle);
}

.content_title_lines span {
  display: flex;
  width: auto;
  height: 24px;
  justify-content: flex-end;
  align-items: center;
  font-size: 14px;
  line-height: 18px;
  font-weight: 600;
  color: var(--neutral-text-caption);
}

.lines-container {
  width: 568px;
  /* max-height: calc(100vh - 600px);  */
  max-height: v-bind("validationStore.typeValidation === 'validation' ? 'calc(100vh - 600px)' : 'calc(100vh - 500px)'");
  overflow-y: auto;
  padding: 8px 0;
}

.content__amplificacion {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  width: 100%;
  margin-bottom: 8px;
}

.linea {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  height: 44px;
  font-size: 14px;
  padding: 8px 16px;
  color: var(--neutral-text-body);
  box-shadow: 0px 1px 1px 1px var(--neutral-border-subtle);
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.linea:hover {
  background-color: var(--neutral-background-hover, rgba(0, 0, 0, 0.02));
}

.ladoIzq {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: var(--neutral-text-body);
  cursor: pointer;
}

.flecha {
  transition: transform 0.3s ease;
}

.flecha.rotated {
  transform: rotate(180deg);
}

.ladoDer {
  color: var(--neutral-text-body);
}

.detailsAmplificacion {
  width: calc(100% - 32px);
  margin: 0 16px;
  border: 1px solid var(--neutral-border-subtle);
  border-radius: 16px;
  opacity: 0;
  max-height: 0;
  overflow: hidden;
  transition: opacity 0.3s ease, max-height 0.3s ease, margin 0.3s ease;
}

.detailsAmplificacion.is-open {
  opacity: 1;
  max-height: 140px; 
  margin-bottom: 16px;
  margin-top: 16px;
}

.details-content {
  padding: 8px 0;
}

.detailsAmplificacion .data {
  display: flex;
  width: 100%;
  height: 40px;
  justify-content: space-between;
  align-items: center;
  padding: 0 24px;
}

.detailsAmplificacion .data.gasto {
  border-bottom: 1px solid var(--neutral-border-subtle);
}

.detailsAmplificacion .data .label {
  font-size: 14px;
  color: var(--neutral-text-body);
  font-weight: 600;
  line-height: 18px;
}

.detailsAmplificacion .data .value {
  font-size: 14px;
  /* color: var(--neutral-text-body); */
  font-weight: 600;
  line-height: 18px;
}

.detailsAmplificacion .data .value_gasto {
  color: var(--danger-text-darker);
}

.detailsAmplificacion .data .value_final {
  font-weight: 800;
}

/* Estilos para el scrollbar */
/* .lines-container::-webkit-scrollbar {
  width: 6px;
} */

/* .lines-container::-webkit-scrollbar-track {
  background: var(--neutral-background-subtle, #f5f5f5);
  border-radius: 3px;
}

.lines-container::-webkit-scrollbar-thumb {
  background: var(--neutral-border-default, #d1d5db);
  border-radius: 3px;
}

.lines-container::-webkit-scrollbar-thumb:hover {
  background: var(--neutral-border-strong, #9ca3af);
} */

/* STYLES EMITIDO POR - MONTO SUPERIOR */

    .containerBody {
        position: relative;
        display: flex;
        flex-direction: row;
        align-items: center;
        width: 600px;
        height: auto;
        border: 1px solid var(--neutral-border-light);
        border-top-left-radius: v-bind("!props.showHeader ? '8px' : '0px'");
        border-top-right-radius:  v-bind("!props.showHeader ? '8px' : '0px'");
        border-top-right-radius: v-bind("!props.showHeader ? '8px' : '0px'");
        border-bottom-left-radius: 8px;
        border-bottom-right-radius: 8px;
    }

    .containerBody .bodyIzq {
        position: relative;
        display: grid;
        grid-template-rows: auto 1fr;
        width: v-bind("props.showButtonDesconciliar ? '746px' : '804px'");
        height: auto;
        padding: 0px 24px;
        border: v-bind("props.showButtonDesconciliar ? '0' : '1px solid var(--neutral-border-light)'");
        border-top-left-radius: v-bind("!props.showHeader ? '8px' : '0px'");
        border-top-right-radius:  v-bind("!props.showHeader ? '8px' : '0px'");
        border-top-right-radius: v-bind("!props.showHeader ? '8px' : '0px'");
        border-bottom-left-radius: 8px;
        border-bottom-right-radius: 8px;
    }

    .containerBody .containerTransactions {
        display: flex;
        flex-direction: row;
        justify-content: space-between;
        align-items: center;
        height: 28px;
        margin-top: 4px;
        border-bottom: 1px solid var(--neutral-border-light);
        gap: 8px;
    }

    .containerBody .containerTransactions .titleTransactions {
        font-size: 10px;
        font-weight: 400;
        line-height: 14px;
        letter-spacing: 0.1em;
        color: var(--neutral-text-caption);
    }

    .containerBody .containerTransactions .containerAccount {
        display: flex;
        flex-direction: row;
        height: 24px;
        gap: 8px;
        width: auto;
        align-items: center;
    }

     .containerAccount span {
        font-size: 10px;
        font-weight: 400;
        line-height: 14px;
        letter-spacing: 0.1em;
    }

    .containerBody .containerInfoTransaction {
        display: flex;
        flex-direction: row;
        justify-content: space-between;
        align-items: center;
        margin: 12px 0px;
        height: 36px;
        width: 100%;
    }

    .containerBody .containerInfoTransaction .left {
        display: flex;
        flex-direction: row;
        align-items: center;
        gap: 8px;
    }

    .containerBody .containerInfoTransaction .left .info {
        display: flex;
        flex-direction: row;
        align-items: center;
        gap: 8px;
    }

    .containerBody .containerInfoTransaction .left .info .infoText {
        display: flex;
        flex-direction: column;
    }

    .containerBody .containerInfoTransaction .left .info .infoText .title {
        font-size: 14px;
        font-weight: 600;
        line-height: 18px;
        color: var(--neutral-text-body);
    }

    .containerBody .containerInfoTransaction .left .info .infoText .subtitle {
        font-size: 12px;
        font-weight: 400;
        line-height: 16px;
        color: var(--neutral-text-caption);
    }

    .containerBody .containerInfoTransaction .right {
        display: flex;
        flex-direction: column;
        align-items: flex-end;
        height: 32px;
        width: auto;
        justify-content: center;
        gap: 2px;
    }

    .containerBody .containerInfoTransaction .right .flujo {
        display: flex;
        flex-direction: row;
        align-items: center;
        gap: 4px;
    }
    .containerBody .containerInfoTransaction .right .flujo .title {
        font-size: 14px;
        font-weight: 600;
        line-height: 18px;
    }
    .containerBody .containerInfoTransaction .right .flujo .u-trend-up {
        font-size: 20px;
        color: var(--success-text-default);
    }
    .containerBody .containerInfoTransaction .right .flujo .u-trend-down {
        font-size: 20px;
        color: var(--danger-text-default);
    }
    .containerBody .containerInfoTransaction .right .date {
        font-size: 12px;
        font-weight: 400;
        line-height: 16px;
        color: var(--neutral-text-caption);
        text-align: right;
    }

    .bodyDer {
        display: flex;
        flex-direction: row;
        align-items: center;
        justify-content: center;
        margin: 0px 24px;
    }

    .content__action {
        display: flex;
        width: 100%;
        height: 60px;
        justify-content: flex-end;
        align-items: flex-end;
    }

  /*colors emitido por y monto superior */
  .text-danger {
    color: var(--danger-text-default);
  }

  .text-gray {
    color: var(--neutral-text-caption);
  }

  .text-neutral-body {
    color: var(--neutral-text-body);
  }

  .text-success {
    color: var(--success-text-default);
  }

</style>