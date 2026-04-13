<script setup>
  import { computed, defineEmits, defineProps, onMounted, onUnmounted } from "vue";
  import { generateRandomId } from "@/utils/helpers";
  
  // Define props
  const props = defineProps({
    modelValue: {
      type: [String, Number],
      required: true,
    },
    disabled: {
      type: Boolean,
      default: false,
    },
    icon: {
      type: String,
      require: false,
      default: "",
    },
    color: {
      type: String,
      default: "var(--neutral-text-caption)",
    },
    revers: {
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
    align: {
      type: String,
      default: "left",
    },
    size: {
      type: String,
      default: "m", // xl, l, m, s
    },
    autoFocus: {
      type: Boolean,
      default: false
    },
    id: {
      type: String,
      default: ""
    }
  });

  // Define variables
  const emit = defineEmits(["update:modelValue","focusin","focusout"]);

  // Define computed properties
  const alert = computed(() => {
    return props.error || props.success || props.warning;
  });

  const classAlert = computed(() => {
    if (props.error) return "errorCustom";
    if (props.success) return "successCustom";
    if (props.warning) return "warningCustom";
    return "";
  });

  const iconAlert = computed(() => {
    if (props.success) return "u-Check";
    if (props.warning) return "u-info-circle";
    return "u-Error";
  });

  const paddindInput = computed(() => {
    const padd = {
      xl: 24,
      l: 24,
      m: 18,
      s: 12,
    };
    const paddLeft = !props.revers && !!props.icon ? 44 : padd[props.size];
    const paddRight =
      props.revers && !!props.icon && alert.value
        ? 68
        : (props.revers && !!props.icon) || alert.value
        ? 18
        : padd[props.size];
    return `0 ${paddRight}px 0 ${paddLeft}px`;
  });

  const colorAlert = computed(() => {
    return `color: var(${
      props.disabled
        ? "--neutral-text-disabled"
        : props.error
        ? "--danger-text-default"
        : props.success
        ? "--success-text-default"
        : "--warning-text-default"
    });`;
  });

  // Define functions
  const handleInput = (event) => {
    emit("update:modelValue", event.target.value);
  };

  const handleFocusIn = (event) => {
    emit("focusin", event);
  };

  const handleFocusOut = (event) => {
    emit("focusout", event);
  };

  const handleChange = (event) => {
    emit("update:modelValue", event.target.value);
  };

  const selectContent = (event) => {
  event.target.select();
};

  // Define event listeners
  const idRandomComponent = ref("");
  onMounted(() => {
    idRandomComponent.value = props.id || generateRandomId("div");
    setTimeout(() => {
      if(props.autoFocus) {
        const idInput = idRandomComponent.value;
        document.getElementById(idInput)?.focus();
      }
    }, 400);

  });
</script>

<template>
  <div class="containerInput" v-if="idRandomComponent">
    <span
      v-if="!!props.icon && !props.revers"
      :style="`color: ${
        props.disabled ? 'var(--neutral-text-disabled)' : props.color
      };`"
      :class="`leftIcon u u-${props.icon}`"
    ></span>
    <input
      :class="[alert ? classAlert : 'default', size]"
      :value="modelValue"
      v-bind="$attrs"
      :id="idRandomComponent"
      :style="`text-align: ${props.align === 'right' ? 'right' : 'left'};`"
      :disabled="props.disabled"
      @input="handleInput"
      @click="selectContent"
      @focusin.stop="handleFocusIn"
      @focusout.stop="handleFocusOut"
      @change.stop="handleChange"
    />
    <span
      v-if="!!props.icon && props.revers"
      :style="`color: ${
        props.disabled ? 'var(--neutral-text-disabled)' : props.color
      }; right: ${alert ? 40 : 16}px;`"
      :class="`rightIcon u u-${props.icon}`"
    ></span>
    <span
      v-if="!!alert"
      :class="`alertIcon u ${iconAlert}`"
      :style="colorAlert"
    ></span>
  </div>
</template>

<style scoped>
  .containerInput {
    position: relative;
    border-radius: 12px;
    display: flex;
    align-items: center;
    background-color: var(--neutral-background-default);
  }

  span {
    font-size: 20px;
    line-height: 22px;
  }

  input {
    width: 100%;
    transition: 0.3s;
    padding: v-bind("paddindInput");
    font-weight: var(--font-weight-regular) !important;
    transition: 0.3s;
  }
  input::placeholder {
    font-weight: 400;
  }
  /* Estados */
  .default {
    caret-color: var(--neutral-text-body);
    border: 1px solid var(--neutral-border-default);
    color: var(--neutral-text-body);
    transition: 0.3s;
  }
  input::placeholder {
    color: var(--neutral-border-default);
    transition: 0.3s;
  }
  .default:hover:not(:focus) {
    border: 1px solid var(--primary-border-subtle);
  }
  .default:active,
  .default:focus {
    caret-color: var(--primary-border-default);
    border: 1px solid var(--primary-border-default);
    box-shadow: inset var(--primary-border-default) 0px 0px 0px 1px;
  }
  input::selection {
    background-color: var(--primary-text-subtle);
    color: var(--neutral-background-default);
  }
  input:disabled,
  input:disabled:active {
    cursor: not-allowed;
    border: 1px solid var(--neutral-border-disabled);
    box-shadow: inset transparent 0px 0px 0px 1px;
  }
  input:disabled,
  input:disabled::placeholder {
    color: var(--neutral-text-disabled);
  }
  input:disabled:hover {
    border: 1px solid var(--neutral-border-disabled);
  }
  .errorCustom {
    border: 1px solid var(--danger-border-default);
    box-shadow: inset var(--danger-border-default) 0px 0px 0px 1px;
    color: var(--neutral-text-body);
  }
  .successCustom {
    border: 1px solid var(--success-border-default);
    box-shadow: inset var(--success-border-default) 0px 0px 0px 1px;
    color: var(--neutral-text-body);
  }
  .warningCustom {
    border: 1px solid var(--warning-border-default);
    box-shadow: inset var(--warning-border-default) 0px 0px 0px 1px;
    color: var(--neutral-text-body);
  }
  .leftIcon {
    position: absolute;
    left: 16px;
  }
  .rightIcon {
    position: absolute;
  }
  .alertIcon {
    position: absolute;
    right: 16px;
  }

  .xl {
    height: 48px;
    border-radius: 16px;
    font-size: var(--size-body-xl) !important;
    line-height: var(--line-height-body-xl) !important;
  }

  .l {
    height: 40px;
    border-radius: 14px;
    font-size: var(--size-body-l) !important;
    line-height: var(--line-height-body-l) !important;
  }
  .m {
    height: 36px;
    border-radius: 12px;
    font-size: var(--size-body-m) !important;
    line-height: var(--line-height-body-m) !important;
  }
  .s {
    height: 32px;
    border-radius: 8px;
    font-size: var(--size-body-m) !important;
    line-height: var(--line-height-body-m) !important;
  }
</style>
