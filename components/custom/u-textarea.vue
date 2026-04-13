<script setup>
import { defineProps, defineEmits } from "vue";

// Define props
const props = defineProps({
  modelValue: {
    type: String,
    default: "",
    required: true,
  },
  placeholder: {
    type: String,
    default: "",
  },
  size: {
    type: String,
    default: "l", // xl, l, m, s
  },
  disabled: {
    type: Boolean,
    default: false,
  },
  error: {
    type: Boolean,
    default: false,
  },
  success: {
    type: Boolean,
    default: false,
  },
  warning: {
    type: Boolean,
    default: false,
  },
});

// Define variables
const emit = defineEmits(["update:modelValue"]);

// Define computed properties
const color = computed(() => {
  return `var(${
    props.disabled
      ? "--neutral-text-disabled"
      : props.error
      ? "--danger-text-default"
      : props.success
      ? "--success-text-default"
      : props.warning
      ? "--warning-text-default"
      : "--neutral-text-default"
  })`;
});

const alert = computed(() => {
  return props.success || props.error || props.warning;
});

// Define functions
const handleInput = (event) => {
  emit("update:modelValue", event.target.value);
};
</script>

<template>
  <div class="containerTextarea">
    <textarea
      :class="size"
      class="scroll"
      :placeholder="props.placeholder"
      @input="handleInput"
      :value="props.modelValue"
      :disabled="props.disabled"
      v-bind="$attrs"
    />
  </div>
</template>

<style scoped>
.containerTextarea {
  width: 100%;
  height: 100%;
  position: relative;
}

textarea {
  width: 100%;
  height: 100%;
  font-family: Nunito;
  font-size: 14px;
  line-height: 16px;
  font-weight: 600;
  transition: 0.3s;
  caret-color: var(--neutral-text-body);
  border: 1px solid var(--neutral-border-default);
  color: var(--neutral-text-body);
  transition: 0.3s;
  resize: none;
  outline: none;
  box-shadow: inset v-bind("alert ? color : ''") 0px 0px 0px 1px;
  background-color: var(--neutral-background-default);
}

textarea::placeholder {
  font-weight: 400;
  color: var(--neutral-border-default);
}

textarea:not(:disabled):hover {
  border: 1px solid v-bind("alert ? color : 'var(--primary-border-subtle)'");
  transition: 0.3s;
}

textarea:not(:disabled):active,
textarea:not(:disabled):focus {
  caret-color: v-bind("alert ? color : 'var(--primary-border-light)'");
  border: 1px solid v-bind("alert ? color : 'var(--primary-border-light)'") !important;
  box-shadow: inset v-bind("alert ? color : 'var(--primary-border-light)'") 0px
    0px 0px 1px;
}

textarea:disabled {
  cursor: not-allowed;
  border: 1px solid var(--neutral-text-disabled);
  box-shadow: inset transparent 0px 0px 0px 1px;
}

textarea:disabled,
textarea:disabled::placeholder {
  color: var(--neutral-text-disabled);
}

.xl {
  min-height: 48px;
  border-radius: 18px;
  padding: 8px 16px;
}

.l {
  min-height: 40px;
  border-radius: 16px;
  padding: 8px 16px;
}
.m {
  min-height: 36px;
  border-radius: 14px;
  padding: 4px 16px;
}
.s {
  min-height: 32px;
  border-radius: 12px;
  padding: 4px 16px;
}
</style>
