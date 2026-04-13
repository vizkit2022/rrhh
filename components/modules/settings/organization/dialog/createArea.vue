<script setup>
import { defineEmits, ref, watch } from "vue";
import useBusinessAreasStore from "@/stores/businessAreas";

//store
const businessAreasStore = useBusinessAreasStore();

//const
const emit = defineEmits(["closeModal", "lockModal", "updated"]);
const { t } = useI18n();
const module = "modules.organizations.settings.businessAreas";

const inputs = ref([
  {
    prop: "name",
    label: t(module + ".modal.name"),
    placeholder: t(module + ".modal.namePlaceholder"),
    error: false,
    msgError: "Campo Obligatorio",
  },
  {
    prop: "description",
    label: t(module + ".modal.description"),
    placeholder: t(module + ".modal.descriptionPlaceholder"),
    error: false,
    msgError: "Campo Obligatorio",
  },
  {
    prop: "abbreviation",
    label: t(module + ".modal.abbreviation"),
    placeholder: t(module + ".modal.abbreviationPlaceholder"),
    error: false,
    msgError: "Campo Obligatorio",
  },
]);

const form = ref({
  name: "",
  description: "",
  abbreviation: "",
  // default: false,
  // customDocument: false,
});

const saving = ref(false);

// Función para validar el formulario
const isValidForm = () => {
  let isValid = true;
  
  inputs.value.slice(0, 3).forEach((input) => {
    const isEmpty = !form.value[input.prop].trim();
    input.error = isEmpty;
    
    if (isEmpty) {
      isValid = false;
    }
  });
  
  return isValid;
};

const save = async () => {
  if (!isValidForm()) {
    return; 
  }
  
  saving.value = true;

  const body = {
    name: form.value.name,
    description: form.value.description,
    abbreviation: form.value.abbreviation,
    // default: form.value.default,
  };

  try {
    const resp = await businessAreasStore.createBusinessArea(body);

    if (resp) {
      emit('updated')
      emit("closeModal");
    }
  } catch (error) {
    console.error("Error al guardar:", error);
  } finally {
    saving.value = false;
  }
};

// Observar cambios en los campos para limpiar errores
watch(() => form.value.name, (newVal) => {
  if (newVal.trim()) {
    inputs.value[0].error = false;
  }
});

watch(() => form.value.description, (newVal) => {
  if (newVal.trim()) {
    inputs.value[1].error = false;
  }
});

watch(() => form.value.abbreviation, (newVal) => {
  if (newVal.trim()) {
    inputs.value[2].error = false;
  }
});
</script>

<template>
  <div class="modal">
    <div class="modal__header">
      <span v-text="t(module + '.modal.title')"></span>
      <u-button-icon type="outlined" icon="close" class="btnIconModify" color="--neutral-text-caption" size="s"
        :disabled="saving" @action-btn="emit('closeModal')" />
    </div>
    <div class="modal__form">
      <div class="groupInput" v-for="input in inputs" :key="input.prop">
        <div class="groupInput__label">
          <label>{{ input.label }}</label>
          <span v-if="input.error" class="error">{{ input.msgError }}</span>
        </div>
        <u-input v-model="form[input.prop]" :placeholder="input.placeholder" :error="input.error" />
      </div>
      <!-- <div class="addInput first">
         <u-checkbox v-model="form.default" :height="16" />
         <span>{{ t(module + ".modal.checkboxPredet") }}</span>
      </div> -->

    </div>
    <div class="modal__actions">
      <u-button :text="t(module + '.modal.buttonCancel')" type="outlined" class="mainBtnModify" size="l"
        :disabled="saving" @action-btn="emit('closeModal')" />
      <u-button :text="saving ? t(module + '.modal.buttonCreating') : t(module + '.modal.buttonCreate')"
        class="mainBtnModify" size="l" :disabled="saving" @action-btn="save" />
    </div>
  </div>
</template>

<style scoped>
span {
  font-family: Nunito;
}

.modal {
  height: 520px;
  display: grid;
  grid-template-rows: 40px 1fr 50px;
  gap: 16px;
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
  text-align: left;
  color: var(--neutral-text-body);
}

.modal__actions {
  width: 100%;
  height: 40px;
  display: flex;
  justify-content: space-between;
  padding-top: 10px;
}

.modal__form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.groupInput {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.groupInput__label {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.groupInput label {
  font-size: 12px;
  font-weight: 600;
  line-height: 16px;
  text-align: left;
  color: var(--neutral-text-body);
}

.groupInput .error {
  font-size: 12px;
  font-weight: 600;
  line-height: 16px;
  color: var(--danger-text-default);
}

.addInput {
  display: grid;
  grid-template-columns: 35px 1fr;
  align-items: center;
}

.addInput span {
  font-size: 14px;
  font-weight: 400;
  line-height: 18px;
  text-align: left;
  color: var(--neutral-text-body);
}

.addInput.first {
  margin-top: 10px;
}

/* CUSTOM COMPONENTS - MODIFY */
.btnIconModify {
  border-radius: 50%;
  color: var(--neutral-surface-default);
}

.mainBtnModify {
  width: 135px;
}
</style>