<script setup>
import {
  defineProps,
  ref,
  defineEmits,
  watch,
  computed,
  onMounted,
  onUnmounted,
} from "vue";
import { generateRandomId } from "@/utils/helpers";
import { useI18n } from "vue-i18n";

// Translation
const { t } = useI18n();
const module = "global.inputLinks";

// Props
const props = defineProps({
  modelValue: {
    type: Object,
    default: () => ({
      type: "",
      url: "",
    }),
  },
  size: {
    type: String,
    default: "m",
  },
  disabled: Boolean,
  required: Boolean,
  error: Boolean,
  usedNetworks: {
    type: Array,
    default: () => [],
  },
  autoFocus: {
    type: Boolean,
    default: false,
  },
});

// Emits
const emit = defineEmits(["update:modelValue", "msgError", "save"]);

// Redes disponibles
const socialOptions = [
  { label: t(`${module}.options.web`), value: "web", icon: "network" },
  {
    label: t(`${module}.options.instagram`),
    value: "instagram",
    icon: "instagram",
  },
  {
    label: t(`${module}.options.facebook`),
    value: "facebook",
    icon: "facebook",
  },
  {
    label: t(`${module}.options.linkedin`),
    value: "linkedin",
    icon: "linkedin",
  },
  { label: t(`${module}.options.github`), value: "github", icon: "github" },
  { label: t(`${module}.options.youtube`), value: "youtube", icon: "youtube" },
  { label: t(`${module}.options.x`), value: "x", icon: "x" },
  { label: t(`${module}.options.behance`), value: "behance", icon: "behance" },
  {
    label: t(`${module}.options.soundCloud`),
    value: "soundCloud",
    icon: "soundcloud",
  },
  { label: t(`${module}.options.spotify`), value: "spotify", icon: "spotify" },
  { label: t(`${module}.options.vimeo`), value: "vimeo", icon: "vimeo" },
];

// Constantes
const inputRef = ref(null);
const selected = ref(
  socialOptions.find((op) => !props.usedNetworks.includes(op.value)) ??
    socialOptions[0],
);
const expand = ref(false);
const inputValue = ref("");
const errorState = ref(false);
const idInput = generateRandomId();

// Computed
const availableOptions = computed(() =>
  socialOptions.filter((op) => !props.usedNetworks.includes(op.value)),
);

// Sync externo
watch(
  () => props.modelValue,
  (newVal) => {
    if (!newVal) return;

    const found = socialOptions.find((op) => op.value === newVal.type);
    if (found) selected.value = found;

    inputValue.value = newVal.url || "";
  },
  { immediate: true },
);

// Focus input externo
watch(
  () => props.autoFocus,
  async (newVal) => {
    if (newVal && !props.disabled) {
      await nextTick();
      inputRef.value?.focus();
    }
  },
  { immediate: true },
);

// Seleccionar red
const selectOption = (op) => {
  selected.value = op;
  expand.value = false;
  updateValue();
};

// Input change
const handleInput = (event) => {
  inputValue.value = event.target.value;
  updateValue();
};

const handleSelect = () => {
  inputRef.value?.select();
};

// Update v-model
const updateValue = () => {
  if (props.required && !inputValue.value) {
    errorState.value = true;
    emit("msgError", "Este campo es obligatorio.");
  } else {
    errorState.value = false;
    emit("msgError", "");
  }

  emit("update:modelValue", {
    type: selected.value.value,
    url: inputValue.value,
  });
};

const handleSave = () => {
  emit("save", {
    type: selected.value.value,
    url: inputValue.value,
  });
  inputValue.value = "";
  selected.value =
    socialOptions.find((op) => !props.usedNetworks.includes(op.value)) ??
    socialOptions[0];
};
</script>

<template>
  <div class="containerInput">
    <div class="main" @click="expand = !expand">
      <!-- Icon -->
      <div :class="`${size}Icon mainIcon`">
        <span :class="`u u-${selected.icon}`"></span>
      </div>

      <!-- Selector -->
      <button :class="`${size}Btn mainBtn`" :disabled="disabled">
        <!-- <span class="label">{{ selected.label }}</span> -->
        <span class="u u-chevron-down"></span>
      </button>
    </div>

    <!-- Opciones -->
    <div
      :class="`${size}Options options`"
      :style="`transform: scaleY(${expand ? 1 : 0});`"
    >
      <button
        v-for="op in availableOptions"
        :key="op.value"
        :class="`${size}Op btnOp ${selected.value === op.value ? 'selected' : ''}`"
        @click="selectOption(op)"
      >
        <span :class="`u u-${op.icon}`"></span>
        <span>{{ op.label }}</span>
      </button>
    </div>

    <!-- Input -->
    <input
      ref="inputRef"
      :id="idInput"
      type="text"
      :class="`inputSocial ${size} ${errorState ? 'errorCustom' : ''} ${inputValue ? 'withSave' : ''}`"
      :placeholder="t(`${module}.placeholder`)"
      :disabled="disabled"
      :value="inputValue"
      @input="handleInput"
      @click="handleSelect"
    />

    <!-- Botón guardar -->
    <div class="savWrapper" :class="`${size}SavWrapper`">
      <button
        :class="`savBtn ${size}Sav ${inputValue ? 'savVisible' : ''}`"
        @click="handleSave"
      >
        <span class="u u-check"></span>
      </button>
    </div>
  </div>
</template>

<style scoped>
.containerInput {
  position: relative;
}

.main {
  position: absolute;
  left: 0;
  top: 0;
  height: 100%;
  width: 80px;
  z-index: 2;
  cursor: pointer;
  display: flex;
  align-items: center;
}

/* ─── Input base ─────────────────────────────────────── */
.inputSocial {
  width: 100%;
  background-color: var(--neutral-background-default);
  border: 1px solid var(--neutral-border-subtle);
  transition:
    padding 0.3s ease,
    border 0.3s ease,
    box-shadow 0.3s ease;
  font-family: Nunito;
  font-size: 14px;
  line-height: 16px;
  font-weight: 400;
  color: var(--neutral-text-body);
}

.inputSocial:disabled {
  cursor: not-allowed;
  color: var(--neutral-text-disabled) !important;
}

/* ─── Input tamaños ──────────────────────────────────── */
.xl {
  height: 48px;
  padding: 0 24px 0 175px;
  border-radius: 18px;
}
.l {
  height: 40px;
  padding: 0 24px 0 165px;
  border-radius: 16px;
}
.m {
  height: 36px;
  padding: 0 18px 0 80px;
  border-radius: 14px;
}
.s {
  height: 32px;
  padding: 0 12px 0 150px;
  border-radius: 12px;
}

/* ─── Padding derecho extra cuando hay botón save visible ── */
.inputSocial.withSave.xl {
  padding-right: 52px;
}
.inputSocial.withSave.l {
  padding-right: 44px;
}
.inputSocial.withSave.m {
  padding-right: 38px;
}
.inputSocial.withSave.s {
  padding-right: 32px;
}

/* ─── Input estados ──────────────────────────────────── */
.inputSocial:focus,
.inputSocial:active {
  caret-color: var(--primary-border-subtle);
  border: 1px solid var(--primary-border-subtle);
  box-shadow: inset var(--primary-border-subtle) 0px 0px 0px 1px;
  outline: none;
}

.inputSocial:hover {
  border: 1px solid var(--primary-border-subtle);
}

.errorCustom {
  border: 1px solid var(--danger-border-darker) !important;
  box-shadow: inset var(--danger-border-darker) 0px 0px 0px 1px !important;
}

/* ──── Wrapper que recorta el botón ────────────────────── */
.savWrapper {
  position: absolute;
  right: 0;
  top: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center; /* opcional pero recomendable */
  overflow: hidden;
  padding: 4px 8px 4px 4px;
}

/* ──── Boton guardar ──────────────────────────────────── */
.savBtn {
  position: relative;
  transform: translateX(calc(100% + 12px));
  background-color: var(--primary-surface-subtle);
  color: var(--neutral-text-negative);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
  cursor: pointer;
  pointer-events: none;
}

.savBtn.savVisible {
  transform: translateX(calc(100% + 12px));
}

.savBtn.savVisible {
  transform: translateX(0);
  pointer-events: auto;
}

.xlSav {
  width: 32px;
  height: 32px;
  font-size: 18px;
}
.lSav {
  width: 28px;
  height: 28px;
  font-size: 16px;
}
.mSav {
  width: 24px;
  height: 24px;
  font-size: 14px;
}
.sSav {
  width: 20px;
  height: 20px;
  font-size: 12px;
}

.savBtn span {
  color: var(--neutral-text-inverse);
}

/* ─── Icono principal ────────────────────────────────── */
.mainIcon {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--neutral-text-body);
  opacity: v-bind("disabled ? '0.5' : '1'");
}

.xlIcon {
  font-size: 22px;
  left: 24px;
}
.lIcon {
  font-size: 20px;
  left: 24px;
}
.mIcon {
  font-size: 18px;
  left: 18px;
}
.sIcon {
  font-size: 16px;
  left: 12px;
}

/* ─── Botón selector ─────────────────────────────────── */
.mainBtn {
  position: absolute;
  top: 8px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-right: 1px solid var(--neutral-border-subtle);
  padding-right: 10px;
  transition: 0.3s;
  width: 20px;
}

.mainBtn:disabled {
  cursor: not-allowed;
}

.xlBtn {
  height: 32px;
  left: 58px;
}
.lBtn {
  height: 24px;
  left: 54px;
}
.mBtn {
  height: 20px;
  left: 48px;
}
.sBtn {
  height: 16px;
  left: 40px;
}

.mainBtn span {
  color: var(--neutral-text-body);
  transition: 0.3s;
}
.mainBtn:disabled span {
  color: var(--neutral-text-disabled) !important;
}
.mainBtn span.label {
  font-family: Nunito;
  font-size: 14px;
  line-height: 16px;
  font-weight: 600;
}
.mainBtn:hover span.u {
  color: var(--neutral-text-caption);
}

/* ─── Dropdown opciones ──────────────────────────────── */
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

/* Scrollbar opciones */
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

/* ─── Botones opción ─────────────────────────────────── */
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
  height: 35px;
  display: flex;
  align-items: center;
  overflow: auto;
  overflow-x: auto;
}

/* Scrollbar horizontal del span */
.btnOp span::-webkit-scrollbar {
  height: 8px;
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
</style>
