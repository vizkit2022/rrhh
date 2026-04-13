<script setup>
import { defineProps, ref, defineEmits, onMounted, watch, nextTick, onUnmounted } from "vue";
import { generateRandomId } from "@/utils/helpers";
import countriesPhones from "@/utils/inputs/countriesPhone.json"
import useGlobalStore from "@/stores/global";
import useOrganizationStore from "@/stores/organization";

// Stores
const globalStore = useGlobalStore();
const organizationStore = useOrganizationStore();

// Define props
const props = defineProps({
  modelValue: {
    type: String,
    default: "",
  },
  size: {
    type: String,
    default: "m",
  },
  placeholder: {
    type: String,
    default: "Seleccione...",
  },
  disabled: {
    type: Boolean,
    default: false,
  },
  required: {
    type: Boolean,
    default: false,
  },
  error: {
    type: Boolean,
    default: false,
  },
  selectedCountryCode: {
    type: String,
    default: "",
  },
});

watch(
  () => props.modelValue,
  () => {
    if (props.modelValue === "") {
      onlyNumber.value = "";
      error.value = false;
    }
  }
);

watch(
  () => props.selectedCountryCode,
  (newValue) => {
    if (newValue !== "") {
      const selectedPrefix =
        phonePrefixes.find((p) => p.code === newValue) || defaultPrefix;
      selectedOp(selectedPrefix);
    } else {
      const defaultCountryCode = "CL"; // Chile
      const defaultSelectedPrefix =
        phonePrefixes.find((p) => p.code === defaultCountryCode) ||
        defaultPrefix;
      selectedOp(defaultSelectedPrefix);
    }
    error.value = false;
    emit("msgError", "");
  }
);


// ejemplo de un pais countriesPhones:
  // {
  //   "code": "AE",
  //   "dial_code": "+971",
  //   "name": {
  //     "en": "United Arab Emirates",
  //     "es": "Emiratos Árabes Unidos",
  //     "pt": "Emirados Árabes Unidos",
  //     "fr": "Émirats Arabes Unis",
  //     "de": "Vereinigte Arabische Emirate"
  //   }
  // },


const phonePrefixes = [...countriesPhones].sort((a, b) => {
  const lang = globalStore.lang || 'en' // por si acaso
  return a.name[lang].localeCompare(b.name[lang])
})

// es el maximo de caracteres permitido
const minNumberPhone = 5;
// Definir el prefijo por defecto
const defaultPrefix = phonePrefixes[0];
// option para seleccionar el pais con una tecla
const optionsContainer = ref(null);

const handleKeyDown = (event) => {
  if (!expand.value) return;

  // sólo letras (incluye acentos y ñ)
  const letter = event.key.toLowerCase();
  if (!/[a-záéíóúüñ]$/.test(letter)) return;

  const lang = globalStore.lang || "en";

  const foundIndex = phonePrefixes.findIndex((p) => {
    return p.name[lang].toLowerCase().startsWith(letter);
  });

  if (foundIndex !== -1) {
    nextTick(() => {
      const optionElement = optionsContainer.value?.children[foundIndex];
      if (optionElement) {
        optionElement.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    })
  }

}

onMounted(() => {
  window.addEventListener("keydown", handleKeyDown);
  
  if (props.modelValue !== "") {
    const oldNumber = props.modelValue;
    const selectedPrefix = phonePrefixes.find((p) => oldNumber.includes(p.dial_code)) || defaultPrefix;

    prefix.value = selectedPrefix;
    onlyNumber.value = oldNumber.replace(`${selectedPrefix.dial_code} `, "");

    if (
      selectedPrefix === defaultPrefix &&
      !oldNumber.includes(defaultPrefix.dial_code)
    ) {
      emit("update:modelValue", `${defaultPrefix.dial_code} ${props.modelValue}`);
    }
  } else {
    if (props.selectedCountryCode !== "") {
      const selectedPrefix =
        phonePrefixes.find((p) => p.code === props.selectedCountryCode) ||
        defaultPrefix;
      selectedOp(selectedPrefix);
    } else {
      // Se usa el pais de la organizacion
      const countryNameOrganization = organizationStore.organization.address.country.name;
      const codeNameCountries = phonePrefixes.find((p) => p.name.en === countryNameOrganization);

      const defaultCountryCode = codeNameCountries?.code || "CL"; // Chile
      const defaultSelectedPrefix =
        phonePrefixes.find((p) => p.code === defaultCountryCode) ||
        defaultPrefix;
      selectedOp(defaultSelectedPrefix);
    }
  }
});

onUnmounted(() => {
  window.removeEventListener("keydown", handleKeyDown);
});

const prefix = ref(phonePrefixes[0]);
const expand = ref(false);
const emit = defineEmits(["update:modelValue", "msgError"]);
const idInput = generateRandomId();
const onlyNumber = ref("");
const init = ref(true);
const error = ref(false);

// Actions
const selectedOp = (newPrefix, errorShow = true) => {
  init.value = false;
  prefix.value = newPrefix;
  expand.value = false;
  const number = document.getElementById(idInput);
  if (number.value === "" && props.required) {
    emit("update:modelValue", `${prefix.value.dial_code} ${number.value}`);
    error.value = number.value.length < minNumberPhone;
    emit(
      "msgError",
      number.value.length >= minNumberPhone
        ? ""
        : `Mínimo ${minNumberPhone} caracteres.`
    );
    // Validación máximo comentada para uso futuro
    // error.value = !(number.value.length === prefix.value.max);
    // emit(
    //   "msgError",
    //   number.value.length === prefix.value.max
    //     ? ""
    //     : `Solo ${prefix.value.max} caracteres.`
    // );
  } else if (number.value !== "") {
    emit("update:modelValue", `${prefix.value.dial_code} ${number.value}`);
    error.value = number.value.length < minNumberPhone;
    emit(
      "msgError",
      number.value.length >= minNumberPhone
        ? ""
        : `Mínimo ${minNumberPhone} caracteres.`
    );
    // Validación máximo comentada para uso futuro
    // error.value = !(number.value.length === prefix.value.max);
    // emit(
    //   "msgError",
    //   number.value.length === prefix.value.max
    //     ? ""
    //     : `Solo ${prefix.value.max} caracteres.`
    // );
  } else {
    error.value = false;
    emit("msgError", "");
  }
};

const handleInput = (event) => {
  init.value = false;
  const number = event.target.value;
  if (number === "" && props.required) {
    emit("update:modelValue", `${prefix.value.dial_code} ${number}`);
    error.value = number.length < minNumberPhone;
    emit(
      "msgError",
      number.length >= minNumberPhone
        ? ""
        : `Mínimo ${minNumberPhone} caracteres.`
    );
    // Validación máximo comentada para uso futuro
    // error.value = !(number.length === prefix.value.max);
    // emit(
    //   "msgError",
    //   number.length === prefix.value.max
    //     ? ""
    //     : `Solo ${prefix.value.max} caracteres.`
    // );
  } else if (number !== "") {
    emit("update:modelValue", `${prefix.value.dial_code} ${number}`);
    error.value = number.length < minNumberPhone;
    emit(
      "msgError",
      number.length >= minNumberPhone
        ? ""
        : `Mínimo ${minNumberPhone} caracteres.`
    );
    // Validación máximo comentada para uso futuro
    // error.value = !(number.length === prefix.value.max);
    // emit(
    //   "msgError",
    //   number.length === prefix.value.max
    //     ? ""
    //     : `Solo ${prefix.value.max} caracteres.`
    // );
  } else {
    error.value = false;
    emit("msgError", "");
    emit("update:modelValue", "");
  }
};
</script>

<template>
  <div class="containerInput">
    <div :class="`${props.size}Flag mainFlag`">{{ prefix.code }}</div>
    <button :class="`${props.size}Btn mainBtn`" @click="expand = !expand" :disabled="props.disabled">
      <span class="label">{{ prefix.dial_code }}</span>
      <span class="u u-chevron-down"></span>
    </button>
    <div
      :class="`${props.size}Options options`"
      :style="`transform: scaleY(${expand ? 1 : 0});`"
        ref="optionsContainer"
    >
      <button
        :class="`${props.size}Op btnOp`"
        v-for="op in phonePrefixes"
        :key="op.code"
        @click="selectedOp(op)"
      >
        <div :class="`${props.size}FlagOp flagOp`">{{ op.code }}</div>
        <span>{{ op.name[globalStore.lang] }} ({{ op.dial_code }})</span>
      </button>
    </div>
    <input
      :class="`inputPhone ${props.size} ${error ? 'errorCustom' : ''}`"
      @input="handleInput"
      v-model="onlyNumber"
      :id="idInput"
      v-bind="$attrs"
      type="number"
      :disabled="props.disabled"
    />
    <!-- Atributo max comentado para uso futuro -->
    <!-- :max="prefix.max" -->
  </div>
</template>

<style scoped>
.containerInput {
  position: relative;
}
.inputPhone {
  width: 100%;
  background-color: var(--neutral-background-default);
  border: 1px solid var(--neutral-border-subtle);
  transition: 0.3s;
  font-family: Nunito;
  font-size: 14px;
  line-height: 16px;
  font-weight: 400;
  color: var(--neutral-text-body);
}
.inputPhone:disabled {
  cursor: not-allowed;
  color: var(--neutral-text-disabled) !important;
}
.xl {
  height: 48px;
  padding: 0 24px 0 125px;
  border-radius: 18px;
}
.l {
  height: 40px;
  padding: 0 24px 0 125px;
  border-radius: 16px;
}
.m {
  height: 36px;
  padding: 0 18px 0 130px;
  border-radius: 14px;
}
.s {
  height: 32px;
  padding: 0 12px 0 120px;
  border-radius: 12px;
}

/* Animations */
.inputPhone:focus,
.inputPhone:active {
  caret-color: var(--primary-border-subtle);
  border: 1px solid var(--primary-border-subtle);
  box-shadow: inset var(--primary-border-subtle) 0px 0px 0px 1px;
}
.inputPhone:hover {
  border: 1px solid var(--primary-border-subtle);
}
.errorCustom {
  border: 1px solid var(--danger-border-darker) !important;
  box-shadow: inset var(--danger-border-darker) 0px 0px 0px 1px !important;
}

/* Country Flags (texto) */
.containerInput .mainFlag {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  background-color: var(--neutral-surface-subtle);
  color: var(--neutral-text-body);
  font-size: 10px;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: v-bind("props.disabled ? '0.5' : '1'");
  border-radius: 4px;
}
.xlFlag {
  width: 40px;
  height: 24px;
  left: 24px;
}
.lFlag {
  width: 32px;
  height: 20px;
  left: 24px;
}
.mFlag {
  width: 28px;
  height: 18px;
  left: 18px;
}
.sFlag {
  width: 24px;
  height: 16px;
  left: 12px;
}

.containerInput .mainBtn {
  position: absolute;
  top: 8px;
  width: 62px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-right: 1px solid var(--neutral-border-subtle);
  padding-right: 10px;
  transition: 0.3s;
}
.containerInput .mainBtn:disabled {
  cursor: not-allowed;
}
.xlBtn {
  height: 32px;
  left: 76px;
}
.lBtn {
  height: 24px;
  left: 66px;
}
.mBtn {
  height: 20px;
  left: 56px;
}
.sBtn {
  height: 16px;
  left: 46px;
}
.containerInput .mainBtn span {
  color: var(--neutral-text-body);
  transition: 0.3s;
}
.containerInput .mainBtn:disabled span {
  color: var(--neutral-text-disabled) !important;
}
.containerInput .mainBtn span.label {
  font-family: Nunito;
  font-size: 14px;
  line-height: 16px;
  font-weight: 600;
}
.mainBtn:hover span.u {
  color: var(--neutral-text-caption);
}

/* Options */
.options {
  position: absolute;
  background-color: var(--neutral-background-default);
  box-shadow: var(--elevation-xl);
  z-index: 1;
  top: calc(100% + 5px);
  width: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  transition: 0.3s;
  transform-origin: top;
  max-height: 200px;
  overflow-y: auto;  
  overflow-x: auto;  
  gap: 8px;
  white-space: nowrap; 
}

.options::-webkit-scrollbar {
  width: 8px;      
  height: 8px;    
}

.options::-webkit-scrollbar-thumb {
  border-radius: 5px;
  background-color: var(--neutral-border-default);
}

.options::-webkit-scrollbar-track {
  background-color: var(--neutral-border-darker);
  border-radius: 4px;
}


.xlOptions {
  border-radius: 18px;
}
.lOptions {
  border-radius: 16px;
}
.mOptions {
  border-radius: 14px;
}
.sOptions {
  border-radius: 12px;
}
.xlOp {
  height: 48px;
  padding: 0 24px;
}
.lOp {
  height: 40px;
  padding: 0 24px;
}
.mOp {
  height: 36px;
  padding: 0 18px;
}
.sOp {
  height: 32px;
  padding: 0 12px;
}
.btnOp {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 10px;
  align-items: center;
  background-color: var(--neutral-background-default);
  transition: 0.3s;
  width: 100%;
}
.btnOp span {
  font-family: Nunito;
  font-size: 14px;
  line-height: 16px;
  font-weight: 600;
  color: var(--neutral-text-body);
  transition: 0.3s;
  height: 30px;
  display: flex;
  align-items: center;
  overflow: auto;
  overflow-x: auto;
}

/* Scroll horizontal del span */
.btnOp span::-webkit-scrollbar {
  height: 8px; /* solo importa height para scroll horizontal */
}

.btnOp span::-webkit-scrollbar-thumb {
  background: var(--neutral-border-default);
  border-radius: 5px;
}

.btnOp span::-webkit-scrollbar-track {
  background-color: var(--neutral-border-darker);
  border-radius: 4px;
}

.btnOp:hover,
.btnOp.selected {
  background-color: var(--primary-surface-shadow-8a);
}
.btnOp:hover span,
.btnOp.selected span {
  color: var(--neutral-text-caption);
}

.flagOp {
  background-color: var(--neutral-surface-subtle);
  color: var(--neutral-text-body);
  font-size: 9px;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 3px;
}
.xlFlagOp {
  width: 36px;
  height: 20px;
}
.lFlagOp {
  width: 28px;
  height: 16px;
}
.mFlagOp {
  width: 24px;
  height: 14px;
}
.sFlagOp {
  width: 20px;
  height: 12px;
}

/* Default */
input[type="number"]::-webkit-inner-spin-button,
input[type="number"]::-webkit-outer-spin-button {
  display: none;
}
</style>