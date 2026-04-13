<script setup>
import { reactive } from 'vue'
import useIncomesStore from '@/stores/incomes';

//STORES
const incomesStore = useIncomesStore();

//CONSTANTS
const textAllowedKeys = ['pietaje_formato', 'post_produccion']

// Verifica si el campo es solo numérico
const isNumericField = (key) => !textAllowedKeys.includes(key)


const detailColumns = [
  {
    side: 'izq',
    items: [
      { name: "Preproducción", textExtra: "día(s)", key: "preproduccion" },
      { name: "Locación interiores", textExtra: "", key: "locacion_interiores" },
      { name: "Locación exteriores", textExtra: "", key: "locacion_exteriores" },
      { name: "Construcción", textExtra: "día(s)", key: "construccion" },
      { name: "Pre lite", textExtra: "día(s)", key: "pre_lite" },
      { name: "Número de sets", textExtra: "", key: "numero_sets" }
    ]
  },
  {
    side: 'der',
    items: [
      { name: "Filmación foro", textExtra: "día(s)", key: "filmacion_foro" },
      { name: "Total días de filmación", textExtra: "", key: "total_dias_filmacion" },
      { name: "Horas de filmación", textExtra: "", key: "horas_filmacion" },
      { name: "Días de viaje", textExtra: "día(s)", key: "dias_viaje" },
      { name: "Pietaje / Formato", textExtra: "", key: "pietaje_formato" },
      { name: "Post producción", textExtra: "", key: "post_produccion" }
    ]
  }
]

const formData = ref({
  preproduccion: '',
  locacion_interiores: '',
  locacion_exteriores: '',
  construccion: '',
  pre_lite: '',
  numero_sets: '',
  filmacion_foro: '',
  total_dias_filmacion: '',
  horas_filmacion: '',
  dias_viaje: '',
  pietaje_formato: '',
  post_produccion: ''
})

// FUNCTIONS

// Función para convertir valor según el tipo de campo
const convertValue = (value, key) => {
  if (!isNumericField(key)) return value
  
  const numericValue = value.replace(/[^\d]/g, '')
  return numericValue === '' ? null : Number(numericValue)
}

// Función para manejar la entrada de texto
function handleInput(e, key) {
  const value = e.target.value
  const convertedValue = convertValue(value, key)

  if (isNumericField(key)) {
    const numericString = value.replace(/[^\d]/g, '')
    
    // Actualizar el formData con string para el input
    formData[key] = numericString
    
    // Forzar actualización del input si se filtraron caracteres
    if (value !== numericString) {
      e.target.value = numericString
    }
  } else {
    formData[key] = value
  }

  // Actualizar el store con el valor convertido
  const updatedDetails = {
    ...incomesStore.informationForm.amfi.productionDetails,
    [key]: convertedValue
  }
  
  incomesStore.informationForm.amfi.productionDetails = updatedDetails
}

onMounted(() => {
    formData.value = { ...incomesStore.informationForm.amfi.productionDetails }
})


</script>

<template>
  <div class="container">
    <div class="header">
      <span>Detalles de producción</span>
      <p>Ingresa los detalles clave de tu producción...</p>
    </div>
    <div class="body">
      <div
        class="details"
        v-for="col in detailColumns"
        :key="col.side"
      >
        <div
          class="item_details"
          v-for="item in col.items"
          :key="item.key"
        >
          <label :for="item.key">{{ item.name }}</label>
          <u-input v-model="formData[item.key]" size="s" class="inputsGlobals" :class="{ 'input-empty' : !formData[item.key]}" @input="handleInput($event, item.key)" placeholder="-" />
          <span>{{ item.textExtra }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>

.container {
    display: grid;
    grid-template-rows: 66px 266px;
    width: 100%;
    height: 100%;
    gap: 24px;
}

.header {
    display: flex;
    flex-direction: column;  
    gap: 12px;
}

.header span:first-child {
    font-size: 24px;
    font-weight: 600;
    line-height: 36px;
    color: var(--neutral-text-body);
}

.header p {
    color: var(--neutral-text-caption);
    font-size: 14px;
    font-weight: 400;
    line-height: 18px;
}

.body {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 64px;
    height: 100%;
    width: 100%;
    padding: 12px;
    border-radius: 12px;
    border: 1px solid var(--neutral-border-subtle);
}

.details {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 10px;
}

.item_details {
    display: grid;
    grid-template-columns: 170px 1fr 1fr;
    gap: 12px;
    align-items: center;
    width: 100%;
    height: 32px;
    font-size: 14px;
    font-weight: 600;
    line-height: 18 px;
    color: var(--neutral-text-body);
}

/*style input */
::v-deep(.inputsGlobals) {
  border: 0 ;
  width: 100%;
    background-color: var(--neutral-surface-shadow-8a); 
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


</style>