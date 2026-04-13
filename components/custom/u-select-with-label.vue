<script setup>
import {
  computed,
  defineProps,
  onMounted,
  onUnmounted,
  ref,
  defineEmits,
} from "vue";

import { generateRandomId } from "@/utils/helpers";

// Define props
const props = defineProps({
  modelValue: {
    type: String,
    default: "",
  },
  size: {
    type: String,
    default: "m", // xl, l, m, s
  },
  options: {
    type: Array,
    default: () => [],
    // EXAMPLE OPTIONS
    // [{label: 'Example Label', img: 'url' (solo se usa si la propiedad props.avatar esta en true), icon: 'new' (solo se usa si la propiedad props.iconOption esta en true)}]
  },
  visibleOptions: {
    type: Number,
    default: 5,
  },
  placeholder: {
    type: String,
    default: "Seleccione...",
  },
  hint: {
    type: Boolean,
    default: false,
  },
  msgHint: {
    type: String,
    default: "Información necesaria",
  },
  icon: {
    type: String,
    default: "",
  },
  iconOption: {
    type: Boolean,
    default: false,
  },
  alert: {
    type: String,
    default: "", // success, error, warning
  },
  disabled: {
    type: Boolean,
    default: false,
  },
  avatar: {
    type: Boolean,
    default: false,
  },
  top: {
    type: Boolean,
    default: false,
  },
  fullData: {
    type: Boolean,
    default: false,
  },
  label: {
    type: String,
    default: "Label",
  },
  iconLabel: {
    type: String,
    default: "",
  },
});

// Define variables
const expand = ref(false);
const currentImg = ref("");
const idRandomComponent = ref("");
const emit = defineEmits(["fullData", "update:modelValue"]);

// Define event listeners
onMounted(() => {
  idRandomComponent.value = generateRandomId("div");
  setTimeout(() => {
    document.addEventListener("click", (event) => {
      if (!event.target.closest(`#${idRandomComponent.value}`)) {
        expand.value = false;
      }
    });
  }, 100);
});

onUnmounted(() => {
  document.removeEventListener("click", (event) => {
    if (!event.target.closest(`#${idRandomComponent.value}`)) {
      expand.value = false;
    }
  });
});

// Define computed properties
const heightOption = computed(() => {
  if (props.size === "xl") return "height: 44px;";
  if (props.size === "l") return "height: 36px;";
  if (props.size === "s") return "height: 32px;";
  return "height: 32px;";
});

const motionIcon = computed(() => {
  return `transform: rotate(${expand.value ? 180 : 0}deg);
        color: var(
          ${
            expand.value
              ? "--neutral-text-caption"
              : props.disabled
              ? "--neutral-text-disabled"
              : ["success", "error", "warning"].includes(props.alert)
              ? "--neutral-text-body"
              : "--neutral-text-negative"
          }
        );`;
});

const selectStyle = computed(() => {
  return `display: grid; grid-template-columns: 
    ${!!props.icon || props.avatar ? "auto 1fr 10px" : "1fr 10px"};
        border: 1px solid var(
          ${
            props.disabled
              ? "--neutral-text-disabled"
              : expand.value
              ? "--neutral-text-caption"
              : ["success", "error", "warning"].includes(props.alert)
              ? colorAlter(props.alert)
              : "--neutral-border-default"
          }
        ); color: var(
          ${props.modelValue != "" ? "--neutral-text-body" : "--neutral-text-caption"}
        )`;
});

const sizeAvatar = computed(() => {
  return ["m", "s"].includes(props.size) ? 24 : 28;
});

const containerOptions = computed(() => {
  return `${borderOption()}${heightContainerOptions()}
          box-shadow: ${
            expand.value ? "var(--elevation-l)" : ""
          }; transform: scaleY(${expand.value ? 1 : 0}); ${
    props.top ? "bottom: calc(100% + 5px);" : "top: calc(100% + 8px)"
  };`;
});

const optionStyle = computed(() => {
  const grid = props.avatar
    ? `${["m", "s"].includes(props.size) ? 24 : 28}px 1fr`
    : "1fr";
  return `grid-template-columns: ${grid};`;
});

const iconHint = computed(() => {
  if (props.alert === "success") return "u-X";
  if (props.alert === "error") return "u-Vimeo-1";
  if (props.alert === "warning") return "u-Cloud";
  return "u-ray";
});

const iconHintStyle = computed(() => {
  return `color: var(
      ${
        ["success", "error", "warning"].includes(props.alert)
          ? colorAlter(props.alert)
          : "--bg-info-500"
      }
    );`;
});

// Define functions
const expandOptions = () => {
  expand.value = !expand.value;
};

const selectOption = (select) => {
  if (props.modelValue) currentImg.value = select.img;
  if (props.fullData) emit("fullData", select);
  expand.value = false;
};

const colorAlter = (alert) => {
  if (alert === "success") return "--bg-success-500";
  if (alert === "error") return "--bg-danger-500";
  return "--bg-warning-500";
};

const borderOption = () => {
  if (props.size === "xl") return "border-radius: 16px;";
  if (props.size === "l") return "border-radius: 14px;";
  if (props.size === "s") return "border-radius: 8px;";
  return "border-radius: 12px;";
};

const heightContainerOptions = () => {
  if (props.size === "xl")
    return `max-height: ${props.visibleOptions * (48 - 4)}px;`;
  if (props.size === "l")
    return `max-height: ${props.visibleOptions * (40 - 4)}px;`;
  if (props.size === "s") return `max-height: ${props.visibleOptions * 32}px;`;
  return `max-height: ${props.visibleOptions * (36 - 4)}px;`;
};
</script>

<template>
  <div class="containerSelect" :id="idRandomComponent">
    <button
      class="containerSelectMain"
      :class="[props.size, props.alert + 'Alert']"
      @click="expandOptions()"
      :disabled="props.disabled"
    >
      <div class="containerLabel">
        <span v-if="props.iconLabel" :class="`u u-${props.iconLabel} icon`"></span>
        <span class="label">{{ props.label }}</span>
      </div>
      <div class="containerSelectInput" :style="selectStyle">
        <u-avatar
          v-if="props.avatar && !!props.modelValue && !!currentImg"
          :size="sizeAvatar"
          :nothover="true"
          :user="{
            name: props.modelValue,
            src:
              currentImg ||
              require('@/assets/img/default-props.modelValue.png'),
          }"
        ></u-avatar>
        <span
          v-else-if="!!props.icon || props.avatar"
          :class="`u u-${props.icon || 'user'}`"
          style="font-size: 20px; color: var(--neutral-text-caption)"
        ></span>
        <span v-if="!!props.modelValue" class="truncateText">{{
          props.modelValue
        }}</span>
        <span v-else class="truncateText">{{ props.placeholder }}</span>
        <div class="iconSelect" :style="motionIcon">
          <span :class="`u u-chevron-down`"></span>
        </div>
      </div>
    </button>
    <div v-if="props.hint" class="hint">
      <span :class="`u ${iconHint}`" :style="iconHintStyle"></span>
      <span>{{ props.msgHint }}</span>
    </div>
    <div class="containerOptions" :style="containerOptions">
      <div class="containerOptionsList scroll">
        <button
          v-for="(option, op) in props.options"
          :key="op"
          :style="`${borderOption()}${heightOption}${optionStyle}`"
          @click="selectOption(option), emit('update:modelValue', option.label)"
          :class="option.label === props.modelValue ? 'opSelected' : ''"
        >
          <u-avatar
            v-if="props.avatar"
            :user="{ name: option.label, src: option.img }"
            :size="sizeAvatar - 2"
            :nothover="true"
          ></u-avatar>
          <div class="text">
            <span v-if="props.iconOption" :class="`u u-${option.icon}`"></span>
            <span class="truncateText">{{ option.label }}</span>
          </div>
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.containerSelect {
  width: 100%;
  height: auto;
  position: relative;
}
.containerSelectMain {
  width: 100%;
  display: grid;
  grid-template-columns: auto 1fr;
}
.xl .containerSelectInput{
  height: 48px;
  padding: 0 24px 0 22px;
  border-radius: 0 16px 16px 0;
}
.l .containerSelectInput{
  height: 40px;
  padding: 0 24px 0 22px;
  border-radius: 0 14px 14px 0;
}
.m .containerSelectInput{
  height: 36px;
  padding: 0 18px 0 16px;
  border-radius: 0 12px 12px 0;
}
.s .containerSelectInput{
  height: 32px;
  padding: 0 12px 0 10px;
  border-radius: 0 8px 8px 0;
}
.containerSelectInput {
  font-size: 14px;
  line-height: 16px;
  box-sizing: border-box;
  transition: 0.3s;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: 0.3s;
}
.containerSelectInput span:nth-child(1) {
  text-align: left;
}
.containerSelectInput .iconSelect {
  text-align: center;
  transition: 0.3s;
  transform-origin: center;
  overflow: hidden;
  display: flex;
  justify-content: center;
  align-items: center;
  padding-top: 2px;
}
.containerSelectInput .iconSelect span {
  font-size: 16px;
  line-height: 16px;
  color: var(--neutral-text-body);
}
.containerLabel {
    padding: 0 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100%;
    gap: 10px;
    background-color: var(--neutral-surface-softer);
    border-left: 1px solid var(--neutral-border-default) !important;
    border-top: 1px solid var(--neutral-border-default) !important;
    border-bottom: 1px solid var(--neutral-border-default) !important;   
}
.containerLabel span.label {
font-size: 14px;
font-weight: 400;
line-height: 18px;
color: var(--neutral-text-body);
}
.containerLabel span.icon {
font-size: 16px;
font-weight: 400;
line-height: 16px;
color: var(--neutral-text-body);
}
.xl .containerLabel {
    border-radius: 16px 0 0 16px;
}
.l .containerLabel {
    border-radius: 14px 0 0 14px;
}
.m .containerLabel {
    border-radius: 12px 0 0 12px;
}
.s .containerLabel {
    border-radius: 8px 0 0 8px;
}
.containerSelect button.containerSelectInput:not(:disabled):hover .containerLabel {
    border-left: 1px solid var(--primary-border-light) !important;
    border-top: 1px solid var(--primary-border-light) !important;
    border-bottom: 1px solid var(--primary-border-light) !important;
}
button.containerSelectInput:disabled {
  cursor: not-allowed;
  color: var(--neutral-text-disabled) !important;
}
.containerOptions {
  position: absolute;
  display: flex;
  width: 100%;
  height: auto;
  box-sizing: border-box;
  z-index: 20;
  padding: 10px;
  transition: 0.3s;
  transform-origin: v-bind("props.top ? 'bottom' : 'top'");
  background-color: var(--neutral-background-default);
}
.containerOptions button {
  flex-shrink: 0;
  width: 100%;
  background-color: var(--neutral-background-default);
  display: grid;
  align-items: center;
  gap: 10px;
  padding: 0 20px;
  box-sizing: border-box;
  transition: 0.3s;
}
.containerOptions button:hover {
  background-color: var(--primary-surface-shadow-8a);
  color: var(--primary-text-default);
  transition: 0.3s;
}
.containerOptionsList {
  width: 100%;
  display: flex;
  flex-direction: column;
  overflow-y: scroll;
}
.containerOptionsList::-webkit-scrollbar-thumb {
  background-color: var(--bg-neutral-300);
}
button span {
  font-family: var(--font-family-nunito);
  font-size: 14px;
  line-height: 16px;
  text-align: start;
}
.successAlert::placeholder,
.errorAlert::placeholder,
.warningAlert::placeholder {
  color: var(--neutral-text-body) !important;
}
.hint {
  position: absolute;
  height: 16px;
  bottom: -24px;
  display: flex;
  gap: 8px;
}
.hint span:nth-child(1) {
  font-size: 16px;
  line-height: 16px;
  color: var(--bg-info-500);
}
.hint span:nth-child(2) {
  font-size: 12px;
  line-height: 16px;
  color: var(--neutral-text-caption);
}
.containerOptionsList .text span.truncateText {
  color: var(--neutral-text-body);
}
.containerOptionsList .text span.u {
  color: var(--neutral-text-caption);
}
.text {
  display: grid;
  grid-template-columns: v-bind("props.iconOption ? 'auto 1fr' : '1fr'");
  gap: 10px;
}
.opSelected {
  background-color: var(--primary-surface-light) !important;
}
.opSelected span.u {
  color: var(--primary-surface-default) !important;
}
.opSelected span.truncateText {
  color: var(--primary-surface-darker) !important;
}
</style>
