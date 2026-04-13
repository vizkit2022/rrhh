<script setup>
import configTable from "@/utils/configTables/incomesConfiguration.json";
import useIncomesStore from "@/stores/incomes";
import useGlobalStore from "@/stores/global";

// STORE
const incomesStore = useIncomesStore();
const globalStore = useGlobalStore();

//CONSTANTS
const temporalUnits = ref([]);
const colorInputs = reactive({});
const creatingTemporal = ref(false);

//FUNCTIONS

async function openColorPicker(index, item) {
  item.focus = true;
  await nextTick(); // Esperar a que Vue actualice el DOM
  colorInputs[index]?.click();
}

// Función para ajustar colores hex
function adjustHexColor(hex, amount) {
  hex = hex.replace("#", "");
  let r = parseInt(hex.substring(0, 2), 16);
  let g = parseInt(hex.substring(2, 4), 16);
  let b = parseInt(hex.substring(4, 6), 16);

  r = Math.min(255, Math.max(0, r + amount));
  g = Math.min(255, Math.max(0, g + amount));
  b = Math.min(255, Math.max(0, b + amount));

  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

// Función para calcular la luminosidad de un color
function getLuminance(hex) {
  hex = hex.replace("#", "");
  const r = parseInt(hex.substring(0, 2), 16) / 255;
  const g = parseInt(hex.substring(2, 4), 16) / 255;
  const b = parseInt(hex.substring(4, 6), 16) / 255;

  // Aplicar la fórmula de luminosidad relativa (sRGB)
  const rLinear = r <= 0.03928 ? r / 12.92 : Math.pow((r + 0.055) / 1.055, 2.4);
  const gLinear = g <= 0.03928 ? g / 12.92 : Math.pow((g + 0.055) / 1.055, 2.4);
  const bLinear = b <= 0.03928 ? b / 12.92 : Math.pow((b + 0.055) / 1.055, 2.4);

  return 0.2126 * rLinear + 0.7152 * gLinear + 0.0722 * bLinear;
}

// Función para calcular el ratio de contraste entre dos colores
function getContrastRatio(color1, color2) {
  const lum1 = getLuminance(color1);
  const lum2 = getLuminance(color2);
  const brightest = Math.max(lum1, lum2);
  const darkest = Math.min(lum1, lum2);
  return (brightest + 0.05) / (darkest + 0.05);
}

// Función mejorada para obtener los colores ajustados
function getAdjustedColors(originalColor, isDarkMode) {
  const originalLuminance = getLuminance(originalColor);
  
  // Crear color de fondo basado en el modo y el color original
  let backgroundColor;
  
if (isDarkMode) {
  // En modo oscuro, oscurecer el color
  if (originalLuminance > 0.5) {
    // Si el color es claro, oscurecer bastante
    backgroundColor = adjustHexColor(originalColor, -120);
  } else {
    // Si ya es oscuro, oscurecer un poco
    backgroundColor = adjustHexColor(originalColor, -60);
  }
} else {
  // En modo claro
  if (originalLuminance > 0.95) {
    // Si es blanco o casi blanco, oscurecerlo para que no se pierda
    backgroundColor = adjustHexColor(originalColor, -30);
  } else if (originalLuminance < 0.5) {
    // Si es oscuro, aclararlo bastante
    backgroundColor = adjustHexColor(originalColor, 70);
  } else {
    // Si es un color intermedio claro, aclararlo ligeramente
    backgroundColor = adjustHexColor(originalColor, 40);
  }
}

  
  // Determinar el color del texto basado en el contraste
  const backgroundLuminance = getLuminance(backgroundColor);
  let textColor;
  
  if (backgroundLuminance > 0.5) {
    // Fondo claro = texto oscuro
    textColor = '#1a1a1a';
  } else {
    // Fondo oscuro = texto claro
    textColor = '#ffffff';
  }
  
  // Verificar si el contraste es suficiente (mínimo 4.5:1 para WCAG AA)
  const contrastRatio = getContrastRatio(backgroundColor, textColor);
  
  if (contrastRatio < 4.5) {
    // Si el contraste no es suficiente, usar colores más extremos
    if (backgroundLuminance > 0.5) {
      textColor = '#000000';
    } else {
      textColor = '#ffffff';
    }
  }
  
  return {
    backgroundColor: backgroundColor,
    color: textColor
  };
}


async function addUnit() {
  const idIncome = incomesStore.income._id;

  if(temporalUnits.value.length === 0) {
    temporalUnits.value.push({
      _id: 'TEMPORAL_ID',
      error: { name: false, plural: false },
      isTemporal: true,
      name: "",
      plural: "",
      colorLabel: "#10B981",
      income: idIncome,
    })

    incomesStore.configuration.units.unitsByIncomes.push({
      ...temporalUnits.value[0]
    })    
  } else if (temporalUnits.value.length === 1) {
    const errors = temporalUnits.value[0].error;
    ['name', 'plural'].forEach((key) => {
      errors[key] = true
    });
  }

  await nextTick();
  document.getElementById('TEMPORAL_ID').focus();
}

// Función para crear unidad temporal (con flag para evitar duplicados)
async function createTemporalUnit(item) {
  if (creatingTemporal.value) return; // Evitar ejecución múltiple
  
  const body = {
    name: item.name,
    plural: item.plural,
    colorLabel: item.colorLabel,
    income: incomesStore.income._id,
  }

  try {
    creatingTemporal.value = true;
    globalStore.loading = true;
    
    // Crear la unidad en el servidor
    await incomesStore.createUnit(body);
    
    // Refrescar la lista PRIMERO
    await incomesStore.getUnitsByIncome(incomesStore.income?._id);
    
    // DESPUÉS de que la lista se haya actualizado, remover el item temporal
    const temporalIndex = temporalUnits.value.findIndex(unit => unit.isTemporal);
    if (temporalIndex !== -1) {
      temporalUnits.value.splice(temporalIndex, 1);
    }
    
    // Remover también del store
    const storeIndex = incomesStore.configuration.units.unitsByIncomes.findIndex(unit => unit.isTemporal);
    if (storeIndex !== -1) {
      incomesStore.configuration.units.unitsByIncomes.splice(storeIndex, 1);
    }
    
  } catch (e) {
    console.error(e);
    // En caso de error, mantener el item temporal para que el usuario pueda intentar de nuevo
  } finally {
    globalStore.loading = false;
    creatingTemporal.value = false;
  }
}
// Función para actualizar unidad (PUT si existe, POST si es temporal)
async function updatedUnit(item) {
  // Si es temporal y tiene nombre y plural, crear la unidad
  if (item.isTemporal && item.name.trim() && item.plural.trim()) {
    await createTemporalUnit(item);
    return;
  }
  
  // Si no es temporal, hacer PUT normal
  if (!item.isTemporal && item._id) {
    const body = {
      _id: item._id,
      name: item.name,
      plural: item.plural,
      colorLabel: item.colorLabel,
      income: incomesStore.income._id,
    }
    
    try {
      globalStore.loading = true;
      await incomesStore.updateUnit(body);
      await incomesStore.getUnitsByIncome(incomesStore.income?._id);
    } catch (e) {
      console.error(e);
    } finally {
      globalStore.loading = false;
    }
  }
}

// Función de eliminación actualizada
async function deleteUnit(item) {
  // Si es temporal, solo removerlo del array local
  if (item.isTemporal) {
    const temporalIndex = temporalUnits.value.findIndex(unit => unit.isTemporal);
    if (temporalIndex !== -1) {
      temporalUnits.value.splice(temporalIndex, 1);
    }
    
    const storeIndex = incomesStore.configuration.units.unitsByIncomes.findIndex(unit => unit.isTemporal);
    if (storeIndex !== -1) {
      incomesStore.configuration.units.unitsByIncomes.splice(storeIndex, 1);
    }
    return;
  }

  // Si no es temporal, hacer DELETE normal
  if (item._id) {
    try {
      globalStore.loading = true;
      await incomesStore.deleteUnit(item._id);
      await incomesStore.getUnitsByIncome(incomesStore.income?._id);
    } catch (e) {
      console.error(e);
    } finally {
      globalStore.loading = false;
    }
  }
}

// Función para eliminar solo los items temporales
function cancelTemporalUnit() {
  // Buscar y eliminar solo los items temporales del array local
  const temporalIndex = temporalUnits.value.findIndex(unit => unit.isTemporal);
  if (temporalIndex !== -1) {
    temporalUnits.value.splice(temporalIndex, 1);
  }
  
  // Remover en el store solo los temporales
  const storeIndex = incomesStore.configuration.units.unitsByIncomes.findIndex(unit => unit.isTemporal);
  if (storeIndex !== -1) {
    incomesStore.configuration.units.unitsByIncomes.splice(storeIndex, 1);
  }
}

function handleEscKey(event) {
  if (event.key === "Escape") {
    cancelTemporalUnit();
  }
}

onMounted(async () => {
  window.addEventListener("keydown", handleEscKey)

  try{
    globalStore.loading = true;
    await incomesStore.getUnitsByIncome(incomesStore.income?._id)
  } catch (e) {
    console.error(e);
  } finally {
    globalStore.loading = false
  }
})

onBeforeMount(() => {
  window.removeEventListener("keydown", handleEscKey)
})

</script>

<template>
    <div class="units__container">
        <div class="units__header">
            <span>Unidades</span>
              <u-button
                text="Agregar unidad"
                icon="new"
                color="--neutral-surface-shadow-8a"
                color-text="--neutral-text-caption"
                colorHover="--success-surface-shadow-8a"
                color-text-hover="--primary-text-default"
                color-active="--success-surface-shadow-12a"
                size="s"
                @click="addUnit"
              />
        </div>

        <div class="units__body">
          <TableBasic 
          :configTable="configTable.configurationUnits"
          :content="incomesStore.configuration.units.unitsByIncomes"
          :key="incomesStore.configuration.units.unitsByIncomes.length"
          >

          <template v-slot:name="item">
            <u-input
              class="inputsUnits"
              placeholder="-"
              v-model="item.item.name"
              @change="updatedUnit(item.item)"
              @input="item.item.error.name = false"
              :error="item.item.error?.name"
              :id="item.item._id"
            />
          </template>

          <template v-slot:plural="item">
            <u-input
              class="inputsUnits"
              placeholder="-"
              v-model="item.item.plural"
              @change="updatedUnit(item.item)"
              @input="item.item.error.plural = false"
              :error="item.item.error?.plural"
            />
          </template>

        <template v-slot:labelColor="item">
          <div v-if="item.item.focus" class="color-input-container">
            <u-input
              class="inputsUnits color-input-field"
              placeholder="Color"
              v-model="item.item.colorLabel"
              @click="openColorPicker(item.item.order, item.item)"
              icon="selector_down"
              :revers="true"
              @blur="item.item.focus = false"
              readonly
              :auto-focus="item.item.focus"
            />
            <input
              class="color-picker"
              type="color"
              v-model="item.item.colorLabel"
              :ref="el => colorInputs[item.item.order] = el"
              @change="updatedUnit(item.item)"
            />
          </div>

          <div class="units-color-container" v-else @click="item.item.focus = true">
            <!-- <u-tags :text="item.item.name" :style="{ backgroundColor: item.item.colorLabel, color: item.item.colorLabel }" :delete="false" /> -->
            <div class="units-color-tag" :style="getAdjustedColors(item.item.colorLabel, globalStore.isDark)">
                <span v-text="item.item.name"></span>
            </div>
          </div>
        </template>


          <template v-slot:used="item">
            <span class="units__used" v-text="item.item.used"></span>
          </template>

          <template v-slot:actions="item">
            <span class="units__delete u u-delete" @click="deleteUnit(item.item)"></span>
          </template>

          </TableBasic>
        </div>

        <!-- <div class="units__footer">
        </div> -->

    </div>
</template>

<style scoped>

  .units__container {
      display: flex;
      flex-direction: column;
      gap: 24px;
      height: 100%;
      width: 100%;
      container-type: inline-size;
  }

    .units__header {
      display: flex;
      justify-content: space-between;
      width: 100%;
      height: 36px;
  }

    .units__header span {
      font-size: 24px;
      font-weight: 600;
      line-height: 36px;
      letter-spacing: 0em;
      text-align: left;
      color: var(--neutral-text-body);
  }

    .units__body {
      display: flex;
      flex-direction: column;
      width: 100%;
      height: 100%;
      overflow-y: auto;
    }

    .color-input-container {
      position: relative;
      width: 100%;
    }

    .color-input-field {
      cursor: pointer;
    }
    
    .color-picker {
      position: absolute;
      opacity: 0;
      width: 0;
      height: 0;
      pointer-events: none;
    }

    .units-color-container {
      display: flex;
      align-items: center;
      justify-content: space-between;
      width: 100%; 
      height: 36px;
      padding: 12px 6px;
      cursor: pointer;
      border-radius: 12px;
    }

    .units-color-container:hover {
      background-color: var(--success-surface-shadow-8a);
    }

    .units-color-tag {
      display: inline-flex; 
      align-items: center;
      justify-content: center;
      padding: 0 8px;
      width: auto;
      max-width: 100%;
      height: 28px;
      border-radius: 999px;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .units-color-tag span {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }



    /* input globals */

    ::v-deep(.inputsUnits) {
      border: 0 ;
      width: 100%;
    }
    ::v-deep(.inputsUnits:hover) {
      background-color: var(--success-surface-shadow-8a);
    }

    ::v-deep(.inputsUnits:hover:not(:focus)) {
      border: none !important;
    }

    ::v-deep(.inputsUnits:focus) {
      background-color: var(--success-surface-shadow-8a);
    }

    .units__used {
      margin-left: auto;
      color: var(--neutral-text-body);
    }

    .units__delete {
      width: 100%;
      font-size: 20px;
      display: flex;  
      justify-content: center;
      align-items: center;
      color: var(--danger-text-default);
      cursor: pointer;
    }

  .units__footer {
      display: flex;
      justify-content: center;
      align-items: center;
      width: 100%;
      margin-top: 8px;
  }

</style>