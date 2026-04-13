<script setup>
import { ref, watch } from "vue";

const props = defineProps({
  modelValue: {
    type: String,
    default: "#20a789",
  },
  width: {
    type: String,
    default: "18px"
  }
});

const emit = defineEmits(["update:modelValue"]);

const colorInputRef = ref(null);
const localColor = ref(props.modelValue || "#20a789");

watch(
  () => props.modelValue,
  (val) => {
    if (val) localColor.value = val;
  },
);

const openPicker = () => {
  colorInputRef.value?.click();
};

const onColorChange = (e) => {
  localColor.value = e.target.value.toUpperCase();
  emit("update:modelValue", localColor.value);
};

const onHexInput = (e) => {
  let val = e.target.value;
  // Asegurar que empiece con #
  if (!val.startsWith("#")) val = "#" + val;
  // Solo caracteres hexadecimales
  val = "#" + val.slice(1).replace(/[^0-9a-fA-F]/g, "").slice(0, 6);
  localColor.value = val.toUpperCase();
  emit("update:modelValue", localColor.value);
};
</script>

<template>
  <div class="color-picker-wrapper" @click="openPicker">
    <!-- Input nativo oculto -->
    <input
      ref="colorInputRef"
      type="color"
      :value="localColor"
      @input="onColorChange"
      class="color-native-input"
      @click.stop
    />

    <!-- Swatch del color -->
    <div
      class="color-swatch"
      :style="{ backgroundColor: localColor }"
    />

    <!-- Valor hexadecimal -->
    <input
      class="color-hex-input"
      :value="localColor"
      @input="onHexInput"
      @click.stop
      maxlength="7"
      spellcheck="false"
    />
  </div>
</template>

<style scoped>
.color-picker-wrapper {
  display: flex;
  align-items: center;
  gap: 8px;
  height: 36px;
  padding: 0 10px;
  border: 1px solid var(--neutral-border-default);
  border-radius: 12px;
  background-color: var(--neutral-background-light);
  cursor: pointer;
  transition: border-color 0.2s;
  position: relative;
  user-select: none;
}

.color-picker-wrapper:hover {
  border-color: var(--primary-border-subtle);
}

.color-picker-wrapper:focus-within {
  border-color: var(--primary-border-default);
  box-shadow: inset var(--primary-border-default) 0px 0px 0px 1px;
  outline: none;
}

.color-native-input {
  position: absolute;
  width: 0;
  height: 0;
  opacity: 0;
  pointer-events: none;
  border: none;
  padding: 0;
}

.color-swatch {
  width: v-bind("props.width");
  height: 18px;
  border-radius: 4px;
  border: 1px solid rgba(0, 0, 0, 0.12);
  flex-shrink: 0;
  transition: background-color 0.15s;
}

.color-hex-input {
  flex: 1;
  border: none;
  outline: none;
  background: transparent;
  font-size: 14px;
  line-height: 14px;
  color: var(--neutral-text-body);
  cursor: pointer;
  font-family: monospace;
  letter-spacing: 0.5px;
  min-width: 0;
}

.color-hex-input::placeholder {
  color: var(--neutral-text-caption);
}
</style>
