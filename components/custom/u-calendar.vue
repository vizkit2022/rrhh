<script setup>
import { defineProps, defineEmits } from "vue";

// Define vemits
const emit = defineEmits(["update:modelValue"]);

// Define props
const props = defineProps({
  disabled: {
    type: Boolean,
    default: false,
  },
  modelValue: {
    type: String,
    default: "",
  },
  useIso: {
    type: Boolean,
    default: false,
  },
  size: {
    type: String,
    default: "m",
  },
  error: {
    type: Boolean,
    default: false,
  },
  borderStyle: {
    type: String,
    default: "1px",
  },
});

// Define functions
const handleInput = (event) => {
  const value = event.target.value;
  if (!value) return;

  if (props.useIso) {
    const iso = new Date(value).toISOString();
    emit("update:modelValue", iso);
  } else {
    emit("update:modelValue", value);
  }
};
</script>

<template>
  <div :class="`calendarCustom ${props.size}`">
    <input
      :class="{ error: props.error }"
      type="date"
      :value="
        props.useIso && props.modelValue
          ? props.modelValue.slice(0, 10)
          : props.modelValue
      "
      @input="handleInput"
      :disabled="props.disabled"
    />
  </div>
</template>

<style scoped>
.calendarCustom {
  position: relative;
  display: flex;
  align-items: center;
}

.xl input,
.calendarCustom.xl {
  height: 48px;
}

.l input,
.calendarCustom.l {
  height: 40px;
}
.m input,
.calendarCustom.m {
  height: 36px;
}
.s input,
.calendarCustom.s {
  height: 32px;
}
input {
  width: 100%;
  flex-shrink: 1;
  position: absolute;
  transition: 0.3s;
  padding: 0px;
  outline: none;
  background-color: transparent;
  color: var(--neutral-text-body) !important;
}
input:not(.error)::-webkit-calendar-picker-indicator:active,
input:not(.error)::-webkit-calendar-picker-indicator:focus {
  border: 1px solid var(--primary-border-default);
  box-shadow: inset var(--primary-border-default) 0px 0px 0px 1px;
}
input::-webkit-datetime-edit {
  width: 100px;
  background-color: auto;
  position: absolute;
  cursor: text;
  font-family: Nunito;
  font-size: 14px;
  line-height: 16px;
  font-weight: 400;
}
input::-webkit-datetime-edit::placeholder {
  color: var(--neutral-surface-subtle) !important;
}
input:disabled,
input:disabled::-webkit-datetime-edit {
  cursor: not-allowed;
  color: var(--neutral-text-disabled);
}
input:disabled {
  border: 1px solid var(--neutral-text-disabled);
}
input::-webkit-calendar-picker-indicator {
  width: 100%;
  border: v-bind("props.borderStyle") solid
    v-bind(
      "props.error ? 'var(--danger-border-default)' : 'var(--neutral-border-default)'"
    );
  box-shadow: v-bind(
    "props.error ? 'inset var(--danger-border-default) 0px 0px 0px 1px' : ''"
  );
  cursor: pointer;
}
input:not(.error)::-webkit-calendar-picker-indicator:hover:not(:focus) {
  border: 1px solid var(--primary-border-subtle);
}
.xl input::-webkit-calendar-picker-indicator {
  padding: 14px 0 14px calc(100% - 40px);
  border-radius: 16px;
}
.l input::-webkit-calendar-picker-indicator {
  padding: 12px 0 12px calc(100% - 40px);
  border-radius: 14px;
}
.m input::-webkit-calendar-picker-indicator {
  padding: 10px 0 10px calc(100% - 35px);
  border-radius: 12px;
}
.s input::-webkit-calendar-picker-indicator {
  padding: 8px 0 8px calc(100% - 25px);
  border-radius: 8px;
}
.xl input::-webkit-datetime-edit {
  padding-left: 24px;
}
.l input::-webkit-datetime-edit {
  padding-left: 24px;
}
.m input::-webkit-datetime-edit {
  padding-left: 18px;
}
.s input::-webkit-datetime-edit {
  padding-left: 12px;
}

.xl input:disabled {
  border-radius: 18px;
}
.l input:disabled {
  border-radius: 16px;
}
.m input:disabled {
  border-radius: 14px;
}
.s input:disabled {
  border-radius: 12px;
}
</style>
