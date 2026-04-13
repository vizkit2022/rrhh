<script setup>
import { ref } from 'vue';
import { onlyNumbersWithoutDots} from '@/utils/helpers';
import useValidationStore from '@/stores/validations';
import useGlobalStore from '@/stores/global';
import useOrganizationStore from '@/stores/organization';
import {
  formatNumber,
  formatCurrency,
  getValueFormaRealTime,
  convertToNumberByCurrency,
} from "@/utils/formatAmount";

const props = defineProps({
  edit: {
    type: Boolean,
  },
  editItem: {
    type: Object,
  },
});

//store
const organizationStore = useOrganizationStore();
const validationStore = useValidationStore();
const globalStore = useGlobalStore();

//const
const emit = defineEmits(["closeModal", "lockModal", "updateDimensions", "nextStep"]);


//const options select
const optionsSelect = ref([{ label: 'Compras', value: 'outcomes', disabled: false }, { label: 'Contabilidad', value: 'accounting', disabled: true }, { label: 'Proyectos', value: 'projects', disabled: true }, { label: 'Pagos', value: 'payments', disabled: true },]);
const selectedInput = ref(optionsSelect.value[0].label);

// const input monto
const isInputFocused = ref(false);
const monto = ref('');
const montoString = ref('');
const montoNumber = ref(0);

// const motivos
const motivosList = ref([]);
const motivosAssets = {
  exceeds_amount_to_spend: '/img/validationRules/AvatarsModal/primera.svg',
  higher_amount: '/img/validationRules/AvatarsModal/segunda.svg',
  issued_by: '/img/validationRules/AvatarsModal/tercera.svg',
}

//computed
const isDisabledConfirmed = computed(() => {
  if ((validationStore.formCVR.selectCodeReason !== '' && validationStore.formCVR.selectCodeReason !== 'higher_amount') || (validationStore.formCVR.selectCodeReason === 'higher_amount' && validationStore.formCVR.monto.number > 0)) {
    return false;
  }
  return true;
})

// Computed para el valor del input según el estado del focus
// Computed para el valor del input
const inputValue = computed(() => {
  if (validationStore.formCVR.selectCodeReason === 'higher_amount') {
    return isInputFocused.value
      ? montoString.value            // muestro el string crudo
      : validationStore.formCVR.monto.label; // muestro el label formateado
  }
  return '';
});

const handleEscape = (event) => {
    if (event.key === "Escape") {
      emit("closeModal");
    }
}

//functions
function selectItem(id, name, _id) {
  validationStore.formCVR.selectCodeReason = id;
  validationStore.formCVR.selectNameReason = name;
  validationStore.formCVR.selectIdReason = _id;
  if (id !== 'higher_amount') {
    validationStore.formCVR.monto.label = '';
    validationStore.formCVR.monto.number = 0;
  } 
}

function emitNextStep() {
  emit('updateDimensions', { width: '640px', height: '720px' });
  emit('nextStep');
}

function handleSelectedInput(option) {
  console.log(option);
  selectedInput.value = option.label;
  validationStore.formCVR.applicationArea = option.value;
}

const currencyFormatDefault = computed(
  () =>  organizationStore.organization.currency
)

function updateMonto(event) {
  const monto = event.target.value;
  const number = getValueFormaRealTime(monto, {...currencyFormatDefault.value }, 'monto');
  montoString.value = number.formattedValue;
  montoNumber.value = number.numericValue;
  //monto string es igual a 200.111.222 example
}



function handleFocus() {
  isInputFocused.value = true;

  montoString.value = validationStore.formCVR.monto.number.toString();
}

function handleBlur() {
  isInputFocused.value = false;


// Guardamos un verdadero Number, no un String
validationStore.formCVR.monto.number = montoNumber.value;

// Ahora sí formateamos un Number correctamente
validationStore.formCVR.monto.label = formatCurrency(
  montoNumber.value,
  currencyFormatDefault.value,
  true
);

// Reiniciamos el string crudo
montoString.value = '';

}

function handleChangeNumber(event) {
  validationStore.formCVR.monto.label = formatCurrency(validationStore.formCVR.monto.number, currencyFormatDefault.value, true);
}

function onlyAllowNumbers(event) {
  const isNumber = /^[0-9]$/.test(event.key);
  const allowedControlKeys = [
    'Backspace', 'Tab', 'Delete', 'Enter',
    'Control', 'Meta', 'Escape', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'
  ];

  const isShortcut = (event.ctrlKey || event.metaKey) && ['a', 'c', 'v', 'x'].includes(event.key.toLowerCase());

  if (!isNumber && !allowedControlKeys.includes(event.key) && !isShortcut) {
    event.preventDefault();
  }

  // if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
  //   event.preventDefault();
  // }
}

function validatePaste(event) {
  const pastedData = (event.clipboardData || window.clipboardData).getData('text');
  if (!/^\d+$/.test(pastedData)) {
    event.preventDefault();
  }
}

// onMounted
onMounted(async () => {

  try{
    globalStore.loading = true;

    await validationStore.getValidationsReason();
    motivosList.value = validationStore.validatonsReason.map((motivo) => ({
      ...motivo,
      img: motivosAssets[motivo.code]
    })).sort((a, b) => a.order - b.order);

    validationStore.formCVR.applicationArea = optionsSelect.value[0].value;
    
    if (props.edit && !validationStore.formCVR.hasInitializedEdit.step1) {
      const editItem = props.editItem;
      validationStore.formCVR.hasInitializedEdit.step1 = true;

      // set step 1
      validationStore.formCVR.selectCodeReason = editItem.codeReason;
      validationStore.formCVR.selectIdReason = editItem.idReason;
      validationStore.formCVR.selectNameReason = editItem.reason
      validationStore.formCVR.applicationArea = editItem.area;

      if (editItem.codeReason === 'higher_amount') {
        validationStore.formCVR.monto.label = editItem.amount.value;
        validationStore.formCVR.monto.number = String(editItem.amount.number);
      }

    }

  } finally {
    globalStore.loading = false;
  }

   document.addEventListener('keydown', handleEscape);

 })

 onUnmounted(() => {
   document.removeEventListener('keydown', handleEscape);
 })

</script>

<template>
  <div class="modal">
    <div class="modal__header">
      <span v-if="props.edit">Editar Regla de Validación</span>
      <span v-else>Crear Regla de Validación</span>
      <u-button-icon type="outlined" icon="close" class="btnIconModify" color="--neutral-text-caption" size="s"
         @action-btn="emit('closeModal')" />
    </div>

    <div class="modal__form">
      <span>Motivos</span>
      <div class="gridColumn">     
        <div class="gridColumn__colIzq">
          
        <div
          v-for="motivo in motivosList"
          :key="motivo.code"
          class="gridColumn__colIzq-item"
          :class="{ selected: validationStore.formCVR.selectCodeReason === motivo.code }"
          @click="selectItem(motivo.code, motivo.name[globalStore.lang], motivo._id)"
        >
          <img :src="motivo.img" :class="motivo.clase" />
          <div class="gridColumn__colIzq-item-text">
            <div class="header">
              <span>{{ motivo.name[globalStore.lang] }}</span>
              <p>{{ motivo?.description?.[globalStore.lang] || 'descripcion temporal' }}</p>
            </div>
            <div class="actions">
              <u-button
                text="Ver tutorial"
                type="normal"
                icon="youtube"
                color="--neutral-surface-light"
                color-text="--neutral-text-caption"
                size="xs"
                :disabled="true"
                class="btnTutorial"
              />
              <u-button
                text="Conocer más"
                type="normal"
                icon="open-book"
                color="--neutral-surface-light"
                color-text="--neutral-text-caption"
                size="xs"
                :disabled="true"
                class="btnTutorial"
              />
            </div>
          </div>
        </div>

        </div>   
          <div class="gridColumn__colDer">
          <span v-if="!validationStore.formCVR.selectCodeReason">PRIMERO DEBES SELECCIONAR UN MOTIVO, LUEGO PODRÁS RELLENAR LOS CAMPOS REQUERIDOS</span>

          <span v-if="validationStore.formCVR.selectCodeReason">COMPLETA LOS SIGUIENTES CAMPOS</span>
          <div v-if="validationStore.formCVR.selectCodeReason" class="containerInputArea">
            <p>Área de aplicación</p>
            <u-select v-model="selectedInput" :options="optionsSelect" size="l"  iconDropdown="selector_down" :full-data="true" @full-data="handleSelectedInput" />
          </div>

          <div v-if="validationStore.formCVR.selectCodeReason === 'higher_amount'" class="containerInputMonto">
          <p>Monto</p>
          <u-input 
            class="inputMonto" 
            :model-value="inputValue"
            size="l" 
            placeholder="Ingresa el monto límite" 
            @input="updateMonto"
            @focus="handleFocus"
            @blur="handleBlur"
            @keydown="onlyAllowNumbers" 
            @change="handleChangeNumber" 
            @paste="validatePaste"
          />
        </div>

        </div>
      </div>
    </div>

    <div class="modal__actions">
      <u-button text="Cancelar" type="outlined" class="mainBtnModify" size="m"
         @action-btn="emit('closeModal')" />
      <u-button text="Confirmar" class="mainBtnModify" size="m" :disabled="isDisabledConfirmed"
        @click="emitNextStep" />
    </div>
  </div>
</template>

<style scoped>
    .modal {
        width: 904px;
        height: 100%;
        display: grid;
        grid-template-rows: 40px 1fr 36px;
        gap: 16px;
        margin : 0 auto;
    }

    .modal__header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        height: 40px;
        width: 904px;
    }

    .modal__header span {
        font-size: 16px;
        font-weight: 600;
        line-height: 20px;
        letter-spacing: 0em;
        width: 880px;
        text-align: left;
        color: var(--neutral-text-body);
    }

    .modal__header .btnIconModify {
      border-radius: 50%;
      color: var(--neutral-surface-default);
    }

    .modal__form {
        display: grid;
        grid-template-rows: 16px 1fr;
        width: 100%;
        height: 100%;
        gap: 10px;
    }

    .modal__form span {
        font-size: 12px;
        font-weight: 600;
        line-height: 16px;
        letter-spacing: 0em;
        text-align: left;
        color: var(--neutral-text-body);
    }

    .gridColumn {
        display: grid;
        height: 524px;
        width: 100%;
        grid-template-columns: 540px 364px;
    }

    .gridColumn .gridColumn__colIzq {
        display: flex;
        flex-direction: column;
        gap: 16px;
        border-right: 2px solid var(--neutral-border-light);
        overflow: auto;
    }

    .gridColumn .gridColumn__colIzq-item {
        display: flex;
        flex-direction: row;
        width: 516px;
        height: 160px;
        border-radius: 16px;
        padding: 16px;
        justify-content: center;
        gap: 16px;
        border: 1px solid var(--neutral-border-subtle);
        background: var(--neutral-background-default); 
        box-shadow: 0px 2px 4px rgba(56, 64, 76, 0.04), 
        0px 2px 4px rgba(56, 64, 76, 0.16);
    }

    .gridColumn__colIzq-item-text {
        display: grid;
        grid-template-rows: 88px 24px;
        width: 348px;
        height: 128px;
        gap: 16px;
    }

    /* Efecto hover y estado seleccionado */
    .gridColumn__colIzq-item {
        cursor: pointer;
        transition: background-color 0.3s ease, border-color 0.3s ease;
    }
    .gridColumn__colIzq-item:hover,
    .gridColumn__colIzq-item.selected {
        background-color: #20A78914; 
        border-color: var(--primary-border-subtle);
    }

    .gridColumn__colIzq-item-text .header {
        display: flex;
        flex-direction: column;
        gap: 4px;
    }

    .gridColumn__colIzq-item-text .header span {
        font-size: 14px;
        font-weight: 600;
        line-height: 18px;
        letter-spacing: 0em;
        text-align: left;
        color: var(--neutral-text-body);
    }

    .gridColumn__colIzq-item-text .header p {
        font-size: 12px;
        font-weight: 600;
        line-height: 16px;
        letter-spacing: 0em;
        text-align: left;
        color: var(--neutral-text-caption);
    }

    .gridColumn__colIzq-item-text .actions {
        display: flex;
        flex-direction: row;
        gap: 8px;
    }

    .btnTutorial {
        width: auto;
        height: 24px;
        border-radius: 40px;
        font-size: 12px;
        gap: 4px;
    }

    .gridColumn__colIzq-item-text span {
        font-size: 16px;
        font-weight: 600;
        line-height: 20px;
        letter-spacing: 0em;
        text-align: left;
        color: var(--neutral-text-body);
    }

    .gridColumn .gridColumn__colDer {
        display: flex;
        flex-direction: column;
        width: 364px;
        height: 258px;
        gap: 24px;
        padding: 24px;
    }

    .gridColumn .gridColumn__colDer span {
        height: 28px;
        font-size: 10px;
        font-weight: 600;
        line-height: 14px;
        letter-spacing: 0.1em;
        text-align: left;
        color: var(--neutral-text-caption);
    }

    .gridColumn .gridColumn__colDer .containerInputArea {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .gridColumn .gridColumn__colDer .containerInputArea p {
      color: var(--neutral-text-body);
        font-size: 12px;
        font-weight: 600;
    }

    .gridColumn .gridColumn__colDer .containerInputMonto {
        display: flex;
        flex-direction: column;
        height: 64px;
    }

    .gridColumn .gridColumn__colDer .containerInputMonto p {
        color: var(--neutral-text-body);
        font-size: 12px;
        font-weight: 600;
        margin-bottom: 4px;
    }
    
    .modal__actions {
        display: flex;
        justify-content: space-between;
        align-items: center;
        width: 100%;
        height: 40px;
    }

    .avatarPrimary {
        width: 120px;
        height: 100px;
    }

    .avatarSecondary {
        width: 120px;
        height: 110px;
    }

    .avatarTertiary {
        width: 120px;
        height: 96px;
    }

</style>