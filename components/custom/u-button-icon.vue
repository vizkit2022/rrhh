<script setup>
  import { computed, defineProps, watch, ref } from "vue";
  import useGlobalStore from "@/stores/global";

  // Stores
  const globalStore = useGlobalStore();
  
  // Define props
  const props = defineProps({
    size: {
      type: String, 
      default: "m", // xl, l, m, s
    },
    icon: {
      type: String,
      default: "edit",
    },
    textSize: {
      type: Number,
      default: 24,
    },
    color: {
      type: String,
      default: "--bg-primary-500",
    },
    colorHover: {
      type: String,
      default: "--bg-primary-400",
    },
    colorActive: {
      type: String,
      default: "--bg-primary-600",
    },
    type: {
      type: String,
      default: "normal", // outlined, text, normal, rounded
    },
    disabled: {
      type: Boolean,
      default: false,
    },
    tooltip: {
      type: String,
      default: ""
    },
    orientationTooltip: {
      type: String,
      default: "top"
    },
    // Exlclusivo para los filtros
    counter: {
      type: Number,
      default: 0,
    },
  });

  // Define variables
  const color = ref(`var(${props.color})`);
  const colorHover = ref(`var(${props.colorHover})`);
  const colorActive = ref(`var(${props.colorActive})`);

  // Constants
  const showTooltip = ref(false);

  // Define Watch
  watch(
    () => props.color,
    () => {
      color.value = `var(${props.color})`;
      colorActive.value = `var(${props.color})`;
    }
  );

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
</script>

<template>
  <button
    class="btn"
    :class="[{ disabled, counterBtn: props.counter !== 0 }, size, type]"
    @click="$emit('action-btn')"
    :disabled="disabled"
    @mouseenter="showTooltip = true"
    @mouseleave="showTooltip = false"
  >
    <div v-if="props.counter" class="counter">
      <span v-text="props.counter"></span>
    </div>
    <span :class="[`u`, `u-${icon}`]"></span>
    <div :class="`tooltip ${props.orientationTooltip}`" v-if="props.tooltip"><span class="body-m-sb">{{ props.tooltip }}</span></div>
  </button>
</template>

<style scoped>
.tooltip {
  position: absolute;
  background-color: var(--neutral-surface-dark);
  padding: 0 12px;
  height: 32px;
  width: auto;
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 2;
  border-radius: 8px;
  box-shadow: var(--elevation-xs);
  transition: 0.3s ease v-bind("showTooltip ? '1s' : '0s'");
  transform-origin: center;
  transform: scale(v-bind("showTooltip ? 1 : 0"));
}
.tooltip.top {
  top: -40px;
}
.tooltip.bottom {
  bottom: -42px;
}
.tooltip span {
  color: var(--neutral-text-negative);
  white-space: nowrap;
}
.tooltip.top::before {
  content: "";
  position: absolute;
  width: 0;
  height: 0;
  border-left: 7px solid transparent;
  border-right: 7px solid transparent;
  border-top: 7px solid var(--neutral-surface-dark);
  bottom: -5px;
}
.tooltip.bottom::before {
  content: "";
  position: absolute;
  width: 0;
  height: 0;
  border-left: 7px solid transparent;
  border-right: 7px solid transparent;
  border-bottom: 7px solid var(--neutral-surface-dark);
  top: -5px;
}
  button {
    font-family: Nunito;
  }
  .btn {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 10px;
    transition: 0.3s;
    position: relative;
    color: var(--white);
  }

  .btn:hover,
  .btn:active {
    transition: 0.3s;
  }

  /* En xs esto cambia */
  .btn .u {
    font-size: v-bind("`${props.textSize}px`");
    line-height: v-bind("`${props.textSize}px`");
  }
  button:not(:disabled).normal {
    background-color: v-bind("color");
  }
  button.normal:hover {
    background-color: v-bind("colorHover");
  }

  button.normal:active {
    background-color: v-bind("colorActive");
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

  .btn.text,
  .btn.outlined {
    color: v-bind("color");
  }

  .btn:not(:disabled).text:hover,
  .btn:not(:disabled).outlined:hover {
    color: v-bind("colorHover");
  }

  .btn:not(:disabled).text:active,
  .btn:not(:disabled).outlined:active {
    color: v-bind("colorActive");
  }

  .btn.disabled {
    color: var(--neutral-text-disabled);
    cursor: not-allowed;
  }
  .btn.disabled.normal {
    background-color: var(--neutral-text-disabled);
    color: var(--white);
  }

  .btn.disabled.outlined {
    border: 1px var(--neutral-text-disabled) solid;
  }

  button:not(:disabled).rounded {
    background-color: v-bind("color");
  }
  button.rounded:hover {
    background-color: v-bind("colorHover");
  }

  button.rounded:active {
    background-color: v-bind("colorActive");
  }
  .btn.rounded {
    border-radius: 50%;
  }
  .btn.disabled.rouded {
    background-color: var(--neutral-text-disabled);
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

button.counterBtn:not(:disabled).normal,
button.counterBtn:not(:disabled).normal:hover,
button.counterBtn:not(:disabled).normal:focus,
button.counterBtn:not(:disabled).normal:active {
  background-color: var(--secondary-text-default) !important;
}

button.counterBtn:not(:disabled).outlined,
button.counterBtn:not(:disabled).outlined:hover,
button.counterBtn:not(:disabled).outlined:focus,
button.counterBtn:not(:disabled).outlined:active {
  border: 1px var(--secondary-text-default) solid !important;
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

  .xl {
    height: 48px;
    width: v-bind("props.counter !== 0 ? '80px' : '48px'");
    border-radius: 16px;
  }

  .l {
    height: 40px;
    width: v-bind("props.counter !== 0 ? '80px' : '40px'");
    border-radius: 14px;
  }
  .m {
    height: 36px;
    width: v-bind("props.counter !== 0 ? '80px' : '36px'");
    border-radius: 12px;
  }
  .s {
    height: 32px;
    width: v-bind("props.counter !== 0 ? '80px' : '32px'");
    border-radius: 8px;
  }
  .xs {
    height: 28px;
    width: v-bind("props.counter !== 0 ? '80px' : '28px'");
    border-radius: 8px;
  }
</style>