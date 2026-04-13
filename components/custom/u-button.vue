<script setup>
import { computed, defineProps } from "vue";
import useGlobalStore from "@/stores/global";

// Stores
const globalStore = useGlobalStore();

// Define props
const props = defineProps({
  size: {
    type: String,
    default: "m", // xl, l, m, s
  },
  text: {
    type: String,
    default: "Button",
  },
  truncateText: {
    type: Boolean,
    default: false,
  },
  showTitleText: {
    type: Boolean,
    default: true,
  },
  titleText: {
    type: String,
    default: "",
  },
  icon: {
    type: String,
    default: "",
  },
  revers: {
    type: Boolean,
    default: false,
  },
  color: {
    type: String,
    default: "--primary-surface-default",
  },
  colorText: {
    type: String,
    default: "--white",
  },
  colorTextHover: {
    type: String,
    default: "--white",
  },
  colorHover: {
    type: String,
    default: "--primary-surface-subtle",
  },
  colorActive: {
    type: String,
    default: "--primary-surface-darker",
  },
  type: {
    type: String,
    default: "normal", // outlined, text, normal
  },
  disabled: {
    type: Boolean,
    default: false,
  },
    noSpanTextZIndex: {
    type: Boolean,
    default: false,
  },

  // Exlclusivo para los filtros
  counter: {
    type: Number,
    default: 0,
  },
});

// Define variables
const color = computed(() => `var(${props.color})`);
const colorText = computed(() => `var(${props.colorText})`);
const colorTextHover = computed(() => `var(${props.colorTextHover})`);
const colorHover = computed(() => `var(${props.colorHover})`);
const colorActive = computed(() => `var(${props.colorActive})`);

// Define computed properties
const size = computed(() => {
  const sizes = {
    xl: "xl",
    l: "l",
    m: "m",
    s: "s",
    xs: "xs",
  };
  return sizes[props.size] || sizes.m;
});

const colorCounterAnimate = computed(() => {
  return globalStore.isDark ? "var(--white)" : "var(--secondary-surface-default)"
});

const fontClass = computed(() => {
  const fontsClass = {
    xl: "body-xl-sb",
    l: "body-xl-sb",
    m: "body-xl-sb",
    s: "body-xl-sb",
    xs: "body-m-sb",
  };
  return fontsClass[props.size] || fontsClass.m;
});

const spanZIndex = computed(() => {
  return props.noSpanTextZIndex ? 0 : 2;
});

</script>

<template>
  <button
    class="btn"
    :class="[
      { revers, disabled, counterBtn: props.counter !== 0 },
      size,
      type,
      fontClass,
    ]"
    @click="$emit('action-btn')"
    :disabled="disabled"
  >
    <span v-if="!!icon" :class="[`u`, `u-${icon}`]"></span>
    <div v-if="props.counter" class="counter">
      <span v-text="props.counter"></span>
    </div>
    <span :title="showTitleText ? titleText : ''" :class="props.truncateText ? 'truncateText' : ''">{{ text }}</span>
  </button>
</template>

<style scoped>
.btn {
  display: flex;
  justify-content: center;
  align-items: center;
  transition: 0.3s;
  position: relative;
  overflow: hidden;
  color: v-bind("colorText");
}

.counter {
  background-color: var(--secondary-text-default);
  height: 24px;
  width: 24px;
  border-radius: 20px;
  display: flex;
  justify-content: center;
  align-items: center;
  /* animation: pulse 1.5s infinite cubic-bezier(0.215, 0.61, 0.355, 1); */
}
.counter span {
  color: var(--white);
  font-size: 16px;
  line-height: 16px;
}
.counterBtn {
  position: relative;
  overflow: hidden;
}
.counterBtn::before {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  background: v-bind("colorCounterAnimate");
  opacity: 0.1;
  height: 100%;
  width: 100%;
  transform: skewX(-45deg);
  background: linear-gradient(to right, v-bind("colorCounterAnimate"), v-bind("colorCounterAnimate") 40px, transparent 40px);
  transform-origin: left bottom;
  animation: shine 15s ease-in infinite;
}
@keyframes shine {
  0% {
    transform: skewX(-45deg) translateX(-100%);
  }
  8% {
    transform: skewX(-45deg) translateX(100%);
  }
  100% {
    transform: skewX(-45deg) translateX(100%);
  }
}
.counterBtn.normal .counter {
  background-color: var(--white);
}
.counterBtn.normal .counter span {
  color: var(--secondary-text-default);
}

.btn span:not(.u) {
  z-index: v-bind("spanZIndex");
}


.btn:hover,
.btn:active {
  transition: 0.3s;
}
button:not(:disabled).normal {
  background-color: v-bind("color");
}
button.normal:hover {
  background-color: v-bind("colorHover");
  color: v-bind("colorTextHover");
}

button.normal:active {
  background-color: v-bind("colorActive");
}
button.counterBtn:not(:disabled).normal,
button.counterBtn:not(:disabled).normal:hover,
button.counterBtn:not(:disabled).normal:focus,
button.counterBtn:not(:disabled).normal:active {
  background-color: var(--secondary-text-default) !important;
}

.btn.outlined {
  border: 1px v-bind("color") solid;
}
.btn:not(:disabled).outlined:hover {
  border: 1px v-bind("colorHover") solid;
}
.btn:not(:disabled).outlined:active {
  border: 1px v-bind("colorActive") solid;
}
button.counterBtn:not(:disabled).outlined,
button.counterBtn:not(:disabled).outlined:hover,
button.counterBtn:not(:disabled).outlined:focus,
button.counterBtn:not(:disabled).outlined:active {
  border: 1px var(--secondary-text-default) solid !important;
}

.btn.text,
.btn.outlined {
  color: v-bind("colorText !== 'var(--white)' ? colorText : color");
}

.btn:not(:disabled).text:hover,
.btn:not(:disabled).outlined:hover {
  color: v-bind("colorHover");
}

.btn:not(:disabled).text:active,
.btn:not(:disabled).outlined:active {
  color: v-bind("colorActive");
}

button.counterBtn:not(:disabled).outlined,
button.counterBtn:not(:disabled).outlined:hover,
button.counterBtn:not(:disabled).outlined:focus,
button.counterBtn:not(:disabled).outlined:active,
button.counterBtn:not(:disabled).text,
button.counterBtn:not(:disabled).text:hover,
button.counterBtn:not(:disabled).text:focus,
button.counterBtn:not(:disabled).text:active {
  color: var(--secondary-text-default) !important;
  background-color: var(--secondary-surface-shadow-8a);
}

.btn.disabled {
  color: var(--neutral-text-disabled);
  cursor: not-allowed;
}
.btn.disabled.normal {
  background-color: var(--neutral-surface-disabled);
}

.btn.disabled.outlined {
  border: 1px var(--neutral-border-disabled) solid;
}

.btn.btn.disabled.none {
  color: var(--neutral-text-disabled);
}

.revers {
  flex-direction: row-reverse;
}

.btn.none {
  color: v-bind("colorText !== 'var(--white)' ? colorText : color");
  background-color: transparent;
}

.btn:not(:disabled).none:hover {
  color: v-bind("colorHover");
  background-color: transparent;
}

.btn:not(:disabled).none:active {
  color: v-bind("colorActive");
  background-color: transparent;
}

button.counterBtn:not(:disabled).none,
button.counterBtn:not(:disabled).none:hover,
button.counterBtn:not(:disabled).none:focus,
button.counterBtn:not(:disabled).none:active {
  color: var(--secondary-text-default) !important;
  background-color: var(--secondary-surface-shadow-8a);
}

.xl {
  height: 48px;
  padding: 0 24px;
  border-radius: 16px;
  gap: 12px;
}

.l {
  height: 40px;
  padding: 0 24px;
  border-radius: 14px;
  gap: 12px;
}
.m {
  height: 36px;
  padding: 0 18px;
  border-radius: 12px;
  gap: 8px;
}
.s {
  height: 32px;
  padding: 0 12px;
  border-radius: 8px;
  gap: 8px;
}
.xs {
  height: 28px;
  padding: 0 10px;
  border-radius: 4px;
  gap: 8px;
}
.u {
  font-size: 24px;
  line-height: 24px;
}
.xs .u {
  font-size: 18px;
  line-height: 18px;
}
</style>
