<script setup>
import { ref } from 'vue'

const props = defineProps({
  data: {
    type: Object,
    required: true,
  },
  fullData: {
    type: Object,
    required: true
  }
})

const numbersOutcome = {
  spentAmount : props.data.numbers.total.value,
  currentSpending : props.data.numbers.totalNet.value,
  diference : props.data.numbers.totalTax.value
}

const router = useRouter();
const rutaOutcome = props.data._id;


const showAmplificacion = ref(false)

const toggleAmplificacion = () => {
  showAmplificacion.value = !showAmplificacion.value
}

const isNegative = (value) => {
  return typeof value === 'number'
    ? value < 0
    : String(value).includes('-');
}

onMounted(() => {
  console.log("data detalles", props.data)
  console.log("fullData detalles", props.fullData)  
})

</script>

<template>
  <div class="content__details">
    <!-- Lineas (EXCEDE MONTO POR GASTAR) -->
    <div class="content__lineas" v-if="fullData.reasonData.name.en === 'Exceeds amount to spend'" :style="{ height: showAmplificacion ? '264px' : '120px' }">
      <div class="content_title_lines">
        <span>Lineas</span>
      </div>
      <div class="content__amplificacion">
        <div class="ladoIzq" @click="toggleAmplificacion">
          <span class="u u-chevron-down flecha"></span>
          <span>Amplificación</span>
        </div>
        <span class="total">{{ numbersOutcome.diference }}</span>
      </div>
      
      <div
        class="detailsAmplificacion"
        :class="{ 'is-open': showAmplificacion }"
      >
        <div>
          <div class="data monto">
            <span class="label">Monto por gastar</span>
            <span class="value">{{ numbersOutcome.spentAmount }}</span>
          </div>
          <div class="data gasto">
            <span class="label">Gasto Actual</span>
            <span class="value value_gasto">{{ numbersOutcome.currentSpending }}</span>
          </div>
          <div class="data final">
            <span class="label">Diferencia</span>
            <span class="value value_final"> {{ numbersOutcome.diference }}</span>
          </div>
        </div>
      </div>
    </div>
    <!-- EMITIDO POR y MONTO SUPERIOR -->

    <div v-if="fullData.reasonData.name.en === 'Issued by' || fullData.reasonData.name.en === 'Higher Amount'">
      
                  <div class="containerBody">
                <!-- Contenido actual -->

                <div class="bodyIzq">

                    <div class="containerTransactions">
                        <span class="titleTransactions">ORDEN DE COMPRA N°</span>
                        <div class="containerAccount">
                            <span>CREADA POR</span>
                            <u-avatar :user="{ name: 'Banco de Chile', src: 'a' }" :size="24" />
                            <span>Una Chilena</span>
                        </div>
                    </div>

                    <div class="containerInfoTransaction">
                        <div class="left">
                            <div class="info">
                                <u-avatar :user="{ name: 'Banco de Chile', src: 'texto'}" :size="24" />
                                <div class="infoText">
                                    <span class="title">Arriendo de Cámaras</span>
                                    <span class="subtitle">Comercial del dia del niño</span>
                                </div>
                            </div>
                        </div>

                        <div class="right">
                            <div class="flujo">
                                <span class="u" ></span>
                                <span class="title">1.600.000</span>
                            </div>
                            <span class="date">Total de compra</span>
                        </div>
                    </div>
                </div>
            </div>

    </div>



    <div class="content__action">



     <!-- <NuxtLink :to="`outcomes/${rutaOutcome}`" target="_blank">
        <u-button text="Ver Compra" type="outlined" icon="open" :revers="true" size="m"  />
     </NuxtLink>  -->

     <NuxtLink :to="`/outcomes/${rutaOutcome}`"  >
        <u-button text="Revisar Compra" type="outlined" icon="open" :revers="true" size="m"  />
     </NuxtLink> 

    </div>
  </div>
</template>

<style scoped>
.content__details {
  display: flex;
  flex-direction: column;
  height: auto;
  width: 100%;
}

.content__lineas {
  display: flex;
  flex-direction: column;
  align-items: center;
  transition: height 0.3s ease; 
  width: 100%;
  border: 1px solid var(--neutral-border-subtle);
  border-radius: 16px;
}

.content_title_lines {
  display: flex;
  width: 568px;
  height: 40px;
  padding: 8px 16px;
  margin-top: 16px;
  border-bottom: 1px solid var(--neutral-border-subtle);
}

.content_title_lines span {
  display: flex;
  width: 74px;
  height: 24px;
  justify-content: flex-end;
  align-items: center;
  font-size: 14px;
  line-height: 18px;
  font-weight: 600;
  color: var(--neutral-text-caption);
}

.content__amplificacion {
  display: flex;
  justify-content: space-between;
  width: 568px;
  height: 40px;
  padding: 8px 16px;
  margin-top: 8px;
}

.ladoIzq {
  display: flex;
  align-items: center;
  width: 119px;
  height: 24px;
  font-size: 14px;
  color: var(--neutral-text-body);
  cursor: pointer;
}

.ladoIzq .flecha {
  display: flex;
  width: 24px;
  height: 24px;
  align-items: center;
  justify-content: center;
}

.detailsAmplificacion {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 472px;
  height: 120px;
  margin: 12px 48px;
  border: 1px solid var(--neutral-border-subtle);
  border-radius: 16px;
  opacity: 0; 
  max-height: 0; 
  overflow: hidden;
  transition: opacity 0.3s ease, max-height 0.3s ease; 
}

.detailsAmplificacion.is-open {
  opacity: 1; 
  max-height: 120px; 
}

.detailsAmplificacion .data {
  display: flex;
  width: 456px;
  height: 40px;
  justify-content: space-between;
  align-items: center;
}

.detailsAmplificacion .data.monto {
  padding: 11px 24px;
}

.detailsAmplificacion .data.gasto {
  padding: 11px 24px;
  border-bottom: 1px solid var(--neutral-border-subtle);
}

.detailsAmplificacion .data.final {
  padding: 11px 24px;
}

.detailsAmplificacion .data .label {
  font-size: 14px;
  color: var(--neutral-text-body);
  font-weight: 600;
  line-height: 18px;
}

.detailsAmplificacion .data .value {
  font-size: 14px;
  color: var(--neutral-text-body);
  font-weight: 600;
  line-height: 18px;
}

.detailsAmplificacion .data .value_gasto {
  color: var(--danger-text-darker);
}

.detailsAmplificacion .data .value_final {
  color: v-bind("isNegative(numbersOutcome.diference) ? 'var(--danger-text-darker)' : 'var(--success-text-darker)'");
  font-weight: 800;
}

.content__action {
  display: flex;
  height: 60px;
  justify-content: flex-end;
  align-items: flex-end;
}

.total {
  font-size: 14px;
  font-weight: 600;
  line-height: 18px;
  color: v-bind("isNegative(numbersOutcome.diference) ? 'var(--danger-text-darker)' : 'var(--success-text-darker)'");
}

/* styles emitido por y monto superior */

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
        color: var(--neutral-text-caption);
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
        color: var(--neutral-text-body);
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


</style>
