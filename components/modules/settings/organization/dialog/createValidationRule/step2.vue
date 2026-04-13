<script setup>
import useValidationStore from '@/stores/validations';
import useGlobalStore from '@/stores/global';

//store 
const validationStore = useValidationStore();
const globalStore = useGlobalStore();

const props = defineProps({
  edit: {
    type: Boolean,
  },
  editItem: {
    type: Object,
  },
});

//emits
const emit = defineEmits(["closeModal", "updateDimensions", "nextStep", "prevStep"]); 

//computada 
const titleMotive = computed(() => {
  const baseTitle = props.edit ? 'Editar Regla' : 'Crear Regla';
  if (validationStore.formCVR.selectCodeReason !== 'higher_amount') {
    return `${baseTitle} - ${validationStore.formCVR.selectNameReason[globalStore.lang] ? validationStore.formCVR.selectNameReason[globalStore.lang] : validationStore.formCVR.selectNameReason}`;
  } else {
    return `${baseTitle} - Monto mayor a - ${validationStore.formCVR.monto.label}`;
  }
});


//const 
const options = ref([{ label: 'Directa', value: 'simple' }, { label: 'Excluyente', value: 'exclusive' }, { label: 'Incluyente', value: 'inclusive' }, { label: 'Jerarquía', value: 'hierarchical' }]);
const validators = ref([]);
const msjValidador = ref({
  "": "SELECCIONA UN TIPO DE VALIDADOR",
  inclusive: "VALIDACIÓN INCLUYENTE: TODOS DEBEN VALIDAR PARA APROBAR",
  exclusive: "VALIDACIÓN EXCLUYENTE: UNO DEBE VALIDAR PARA APROBAR",
  hierarchical: "VALIDACIÓN JERARQUÍA: TODOS DEBEN VALIDAR EN ORDEN PARA APROBAR",
  simple: "VALIDACIÓN DIRECTA: UNO DEBE VALIDAR PARA APROBAR"
});
                        

//functions
const updateValidators = (newValidators) => {
  validators.value = [...newValidators]; 
};

const handleSelectedTypeValidation = (option) => {
  validationStore.formCVR.selectTypeValidation = option;
}

// Computed para habilitar/deshabilitar el botón "Siguiente"
const isNextDisabled = computed(() => {
  return !validationStore.formCVR.selectTypeValidation || validators.value.length === 0 || validators.value.some(v => !v.members || Object.keys(v.members).length === 0);
});

const persistenceUsers = () => {
  if (validators.value.length === 0) {
    validationStore.formCVR.membersValidators = [];
    validationStore.formCVR.membersIdsValidators = [];
  } else {
    validationStore.formCVR.membersValidators = validators.value;

    const arrayIdsMembers = validators.value.map((m) => {
      // Normalizar
      if (m.members?.user?._id) return m.members.user._id;
      if (m.members?._id) return m.members._id;
      return null;
    }).filter(Boolean);

    validationStore.formCVR.membersIdsValidators = arrayIdsMembers;
  }
};


const Close = () => {
  emit("updateDimensions", { width: "1000px", height: "720px" });
  emit("closeModal"); 
};

const Back = () => {
  try {
    persistenceUsers();
    emit("prevStep");
    emit("updateDimensions", { width: "1000px", height: "720px" });
  } catch (error) {
    console.error("Error en Back:", error);
  }
};

const Next = () => {
  try {
    persistenceUsers();
    emit("nextStep");
  } catch (error) {
    console.error("Error en Next:", error);
  }
};

const handleEscape = (event) => {
  if (event.key === "Escape") {
    emit("updateDimensions", { width: "1000px", height: "720px" });
    emit("closeModal");
  }
}

onMounted(() => {
  document.addEventListener("keydown", handleEscape);

  if (props.edit && !validationStore.formCVR.hasInitializedEdit.step2) {
    validationStore.formCVR.hasInitializedEdit.step2 = true;
    console.log("Editando regla de validación", props.editItem);
    const selectedOption = options.value.find(opt => opt.value === props.editItem.type);
    if (selectedOption) {
      validationStore.formCVR.selectTypeValidation = selectedOption;
    }
    const validatorsEditItem = props.editItem.validatorsFull.map((validator) => {
      console.log("validator", validator);
      return {
        members : validator,
        search: validator.data.legalName, 
      };
    });
    console.log("validatorsEditItem", validatorsEditItem);
    validationStore.formCVR.membersValidators = validatorsEditItem;
    // validationStore.formCVR.membersIdsValidators = props.editItem.validatorsFull.map((validator) => validator._id);
    validationStore.formCVR.membersIdsValidators = validatorsEditItem.map((validator) => validator.members._id);

  }
})

onUnmounted(() => {
  document.removeEventListener("keydown", handleEscape);
})

</script>

<template>
  <div class="modal">
    <div class="modal__header">
      <span class="truncateText">{{ titleMotive }}</span>
      
      <u-button-icon type="outlined" icon="close" class="btnIconModify" color="--neutral-text-caption" size="s" @action-btn="Close" />
    </div>

    <div class="modal__input">
      
     <span>Tipo de Validación</span>
     <u-select v-model="validationStore.formCVR.selectTypeValidation.label" :options="options" :full-data="true" @full-data="handleSelectedTypeValidation" placeholder="Elige el tipo de validación" size="l" iconDropdown="selector_down"/>
    </div>

    <div class="modal__validadores">
      <span>Validadores</span>
      <div class="container__validadores">
        <span>{{ msjValidador[validationStore.formCVR.selectTypeValidation.value] || msjValidador[""] }}</span>
        <ComponentsValidationCreator v-if="validationStore.formCVR.selectTypeValidation.value" :optionSelectedValidator="validationStore.formCVR.selectTypeValidation.value || ''" @updateValidators="updateValidators" />
        
      </div>
    </div>

    <div class="modal__actions">
      <u-button text="Volver" type="outlined" @click="Back" />
      <u-button text="Siguiente" @click="Next" :disabled="isNextDisabled" /> 
      </div>

  </div>
</template>

<style scoped>  
  .modal {
    display: grid;
    grid-template-rows: 40px 64px 435px 1fr;
    gap: 24px;
    width: 100%;
    height: 100%;
  }

  .modal__header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    height: 40px;
    width: 100%;
  }

  .modal__header span {
    font-size: 16px;
    font-weight: 600;
    line-height: 20px;
    letter-spacing: 0em;
    width: 500px;
    text-align: left;
    color: var(--neutral-text-body);
}

  .modal__input {
    display: flex;
    flex-direction: column;
    width: 100%;
    height: 60px;
    gap: 8px;
  }

  .modal__input span {
    font-size: 12px;
    font-weight: 600;
    line-height: 16px;
    letter-spacing: 0em;
    text-align: left;
    color: var(--neutral-text-body);
  }

  .modal__header .btnIconModify {
    border-radius: 50%;
    color: var(--neutral-surface-default);
    }


    .modal__validadores {
      display: grid;
      grid-template-rows: 16px 411px;
      gap: 8px;
      width: 100%;
      height: 544px;
    }

    .modal__validadores span {
      font-size: 12px;
      font-weight: 600;
      line-height: 16px;
      letter-spacing: 0em;
      color: var(--neutral-text-body);
    }

    .container__validadores {
      display: flex;
      flex-direction: column;
      width: 100%;
      height: 411px;
      padding: 16px;
      border-radius: 16px;
      gap: 16px;
      border: 1px solid var(--neutral-border-subtle);
    }

    .container__validadores span {
        font-size: 10px;
        font-weight: 600;
        line-height: 14px;
        letter-spacing: 0.1em;
        text-align: left;
        color: var(--neutral-text-caption);
    }

    .modal__actions {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: 25px;
      height: 36px;
      width: 100%;
    }

</style>
