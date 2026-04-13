<script setup>
import { defineProps, computed, defineEmits } from "vue";

// Eventos
const emit = defineEmits(["update:modelValue", "focusin", "focusout"]);

// Props
const props = defineProps({
  modelValue: {
    type: [String, Number],
    required: true,
  },
  disabled: {
    type: Boolean,
    default: false,
  },
  width: {
    type: [String, Number],
    default: "50px", // puede ser "auto", "100%" o un número
  },
  height: {
    type: [String, Number],
    default: "27px", // puede ser "auto", "100%" o un número
  },
});

// Función de input
const handleInput = (event) => {
  if (!props.disabled) {
    emit("update:modelValue", event.target.value);
  }
};

// Computed
const widthComputed = computed(() => {
  const width = props.width;
  if(typeof width === 'number') return width + 'px';
  return width;
});

const heightComputed = computed(() => {
  const height = props.height;
  if(typeof height === 'number') return height + 'px';
  return height;
});

</script>

<template>
  <div>
    <input
      type="color"
      :value="modelValue"
      @input="handleInput"
      :disabled="disabled"
      class="color-input"
    />
  </div>
</template>

<style scoped>
.color-input {
  width: v-bind("widthComputed");
  height: v-bind("heightComputed");
  cursor: pointer;
}

/* Estado deshabilitado */
.color-input:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
