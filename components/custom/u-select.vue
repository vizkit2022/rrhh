<script setup>
import {
  computed,
  defineProps,
  onMounted,
  onUnmounted,
  ref,
  defineEmits,
  watch,
} from "vue";
import { generateRandomId, capitalizeName } from "@/utils/helpers";
import { useI18n } from "vue-i18n";

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
    // Ejemplo de cada opción:
    // {
    //   label: 'Example Label',
    //   translateRoute: ruta (aquí va la ruta del JSON, si no llega, se pinta el label),
    //   img: 'url' (solo se usa si props.avatar=true),
    //   icon: 'new' (solo se usa si props.iconOption=true)
    // }
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
  img: {
    type: String,
    default: "",
  },
  imgRounded: {
    type: Boolean,
    default: false,
  },
  icon: {
    type: String,
    default: "",
  },
  iconOption: {
    type: Boolean,
    default: false,
  },
  iconDropdown: {
    type: String,
    default: "chevron-down",
  },
  sizeIconDropdown: {
    type: String,
    default: "s",
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
  custom: {
    type: Boolean,
    default: false,
  },
  borderStyle: {
    type: String,
    default: "",
  },
  borderRadius: {
    type: String,
    default: "",
  },
  borderHoverStyle: {
    type: String,
    default: "",
  },
  widthOptions: {
    type: String,
    default: "",
  },
  paddingOptionsHorizontal: {
    type: String,
    default: "10",
  },
  capitalize: {
    type: Boolean,
    default: true,
  },
  parent: {
    type: String,
    default: null,
  },
});

const emit = defineEmits(["fullData", "update:modelValue", "updatedAlert"]);
const { t } = useI18n();

// Variables internas
const expand = ref(false);
const currentImg = ref("");
const idRandomComponent = ref("");

// Computed: obtener la opción completa a partir de modelValue
const selectedOption = computed(() => {
  return props.options.find((opt) => opt.label === props.modelValue) || null;
});

// Inicializar la imagen y emitir fullData si corresponde
const initializeOption = () => {
  if (props.modelValue && props.options.length) {
    const sel = selectedOption.value;
    if (sel) {
      if (props.avatar && sel.img) {
        currentImg.value = sel.img;
      }
      // if (props.fullData) {
      //   emit("fullData", sel);
      // }
    }
  }
};

// Listeners para cerrar dropdown al hacer click afuera
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

// Watch para actualizar currentImg/fullData cuando cambie modelValue
watch(
  () => props.modelValue,
  () => {
    initializeOption();
  },
);

// Computeds de estilos (como ya tenías)
const heightOption = computed(() => {
  if (props.size === "xl") return "height: 44px;";
  if (props.size === "l") return "height: 36px;";
  if (props.size === "s") return "height: 32px;";
  return "height: 32px;";
});
const sizeIcon = computed(() => {
  if (props.sizeIconDropdown === "xl")
    return "font-size: 26px; line-height: 26px;";
  if (props.sizeIconDropdown === "l")
    return "font-size: 24px; line-height: 24px;";
  if (props.sizeIconDropdown === "m")
    return "font-size: 22px; line-height: 22px;";
  if (props.sizeIconDropdown === "s")
    return "font-size: 16px; line-height: 16px;";
  return "font-size: 16px; line-height: 16px;";
});
const motionIcon = computed(() => {
  return `transform: rotate(${expand.value ? 180 : 0}deg);
        color: var(
          ${
            expand.value
              ? "--neutral-text-subtitle"
              : props.disabled
                ? "--neutral-text-disabled"
                : ["success", "error", "warning"].includes(props.alert)
                  ? "--neutral-text-body"
                  : "--neutral-text-caption"
          }
        );`;
});
const selectStyle = computed(() => {
  const defaultBorder = `1px solid var(
    ${
      props.disabled
        ? "--neutral-border-disabled"
        : expand.value && props.alert === ""
          ? "--primary-border-light"
          : ["success", "error", "warning"].includes(props.alert)
            ? colorAlter(props.alert)
            : "--neutral-border-default"
    }
  )`;

  return `grid-template-columns: 
    ${!!props.icon || !!props.avatar || !!props.img ? "auto 1fr 10px" : "1fr 10px"};
    border: ${props.borderStyle || defaultBorder};
    border-radius: ${props.borderRadius || "12px"};
    color: var(
      ${props.modelValue != "" ? "--neutral-text-body" : "--neutral-text-caption"}
    );`;
});

const colorPlaceholder = computed(() => {
  if (props.modelValue === "") return "var(--neutral-border-default)";
  return "";
});
const sizeAvatar = computed(() => {
  return ["m", "s"].includes(props.size) ? 24 : 28;
});
const containerOptions = computed(() => {
  return `${borderOption()}${heightContainerOptions()}
          box-shadow: ${
            expand.value ? "var(--elevation-xs)" : ""
          }; transform: scaleY(${expand.value ? 1 : 0}); ${
            isTopPosition.value
              ? "bottom: calc(100% + 5px);"
              : "top: calc(100% + 8px)"
          };`;
});
const optionStyle = computed(() => {
  const grid =
    props.avatar || props.img
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
          : "--info-text-default"
      }
    );`;
});

// Funciones internas
const isTopPosition = ref(props.top);

const expandOptions = () => {
  expand.value = !expand.value;

  if (expand.value && props.parent) {
    const input = event.target;
    const containerForm = document.getElementById(props.parent);

    if (containerForm) {
      // Obtener la altura visible del #containerForm
      const containerFormVisibleHeight = containerForm.clientHeight;

      // Obtener la posición del input con respecto al #containerForm
      const inputRect = input.getBoundingClientRect();
      const containerFormRect = containerForm.getBoundingClientRect();
      const inputY = inputRect.top - containerFormRect.top;

      // Obtener la altura del input
      const inputHeight = inputRect.height;

      // Posición donde termina el input
      const posDownInput = inputY + inputHeight;

      // Espacio disponible debajo del input (240 es la altura estimada del dropdown)
      const spaceBelow = containerFormVisibleHeight - posDownInput;

      // Si hay menos de 240px de espacio abajo, abrir hacia arriba
      isTopPosition.value = spaceBelow < 240;
    }
  } else if (!props.parent) {
    // Si no hay parent, usar el valor de la prop
    isTopPosition.value = props.top;
  }
};
const selectOption = (opt) => {
  if (props.modelValue) currentImg.value = opt.img;
  if (props.fullData) emit("fullData", opt);
  if (props.alert !== "") emit("updatedAlert");
  expand.value = false;
};
const colorAlter = (alert) => {
  if (alert === "success") return "--success-text-default";
  if (alert === "error") return "--danger-text-default";
  return "--warning-text-default";
};
const borderOption = () => {
  if (props.size === "xl") return "border-radius: 16px;";
  if (props.size === "l") return "border-radius: 14px;";
  if (props.size === "s") return "border-radius: 8px;";
  return "border-radius: 8px;";
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
    <!-- Botón principal: aquí es donde inyectamos el slot "label" -->
    <button
      class="containerSelectInput"
      :class="[props.size, props.alert + 'Alert']"
      @click="expandOptions()"
      :style="selectStyle"
      :disabled="props.disabled"
    >
      <!-- SLOT para personalizar el área de la etiqueta/label -->
      <slot name="label" :option="selectedOption" :value="props.modelValue">
        <!-- RENDER POR DEFECTO si NO se provee el slot "label": -->
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
          v-else-if="!!props.icon || !!props.avatar"
          :class="`u u-${props.icon || 'user'}`"
          style="font-size: 20px; color: var(--neutral-text-caption)"
        ></span>
        <img
          v-else-if="!!props.img"
          :src="props.img"
          alt="selectImg"
          style="width: 20px; height: 20px"
          :style="props.imgRounded ? 'border-radius: 50%' : ''"
        />
        <span v-if="!!props.modelValue" class="truncateText">
          {{
            props.capitalize
              ? capitalizeName(props.modelValue)
              : props.modelValue
          }}
        </span>
        <span v-else class="truncateText">{{ props.placeholder }}</span>
      </slot>

      <!-- El ícono dropdown -->
      <div class="iconSelect" :style="motionIcon">
        <span :class="`u u-${props.iconDropdown}`" :style="sizeIcon"></span>
      </div>
    </button>

    <!-- Hint debajo si aplica -->
    <div v-if="props.hint" class="hint">
      <span :class="`u ${iconHint}`" :style="iconHintStyle"></span>
      <span>{{ props.msgHint }}</span>
    </div>

    <!-- Lista de opciones desplegable -->
    <div class="containerOptions" :style="containerOptions">
      <span v-if="props.options.length === 0" class="noData">
        {{ t("global.text.noOptions") }}
      </span>
      <div class="containerOptionsList scroll" v-else>
        <template v-if="!props.custom">
          <button
            v-for="(option, op) in props.options"
            :key="op"
            :style="`${borderOption()}${heightOption}${optionStyle} ${option.disabled ? 'pointer-events: none; opacity: 0.5;' : ''}`"
            @click="
              selectOption(option);
              emit('update:modelValue', option.label);
            "
            :class="option.label === props.modelValue ? 'opSelected' : ''"
            :disabled="option.disabled"
          >
            <u-avatar
              v-if="props.avatar"
              :user="{
                name: option?.translateRoute
                  ? t(option.translateRoute)
                  : option.label,
                src: option.img,
              }"
              :size="sizeAvatar - 2"
              :nothover="true"
            ></u-avatar>
            <img
              v-else-if="!!option.img && props.img"
              :src="option.img"
              alt="optionImg"
              style="width: 20px; height: 20px"
              :style="props.imgRounded ? 'border-radius: 50%' : ''"
            />
            <div class="text">
              <span
                v-if="props.iconOption"
                :class="`u u-${option.icon}`"
              ></span>
              <span class="truncateText" :title="option?.title ?? undefined">
                {{
                  props.capitalize
                    ? capitalizeName(
                        option?.translateRoute
                          ? t(option.translateRoute)
                          : option.label,
                      )
                    : option?.translateRoute
                      ? t(option.translateRoute)
                      : option.label
                }}
              </span>
            </div>
          </button>
        </template>
        <template v-else>
          <button
            v-for="(option, op) in props.options"
            :key="op"
            @click="
              selectOption(option);
              emit(
                'update:modelValue',
                option?.translateRoute
                  ? t(option.translateRoute)
                  : option.label,
              );
            "
            :class="
              option?.translateRoute
                ? t(option.translateRoute)
                : option.label === props.modelValue
                  ? 'opSelected'
                  : ''
            "
            :style="`${borderOption()}${heightOption}${optionStyle}`"
          >
            <slot
              name="option"
              :item="option"
              :selected="option.label === props.modelValue"
            />
          </button>
        </template>
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
.xl {
  height: 48px;
  padding: 0 24px 0 22px;
  border-radius: 16px;
}
.l {
  height: 40px;
  padding: 0 24px 0 22px;
  border-radius: 14px;
}
.m {
  height: 36px;
  padding: 0 18px 0 16px;
  border-radius: 12px;
}
.s {
  height: 32px;
  padding: 0 12px 0 10px;
  border-radius: 8px;
}
.containerSelectInput {
  width: 100%;
  font-size: 14px;
  line-height: 16px;
  box-sizing: border-box;
  transition: 0.3s;
  display: grid;
  align-items: center;
  gap: 8px;
  transition: 0.3s;
}
.containerSelectInput.errorAlert {
  box-shadow: inset var(--danger-border-default) 0px 0px 0px 1px;
}
.containerSelectInput.successAlert {
  box-shadow: inset var(--success-border-default) 0px 0px 0px 1px;
}
.containerSelectInput.warningAlert {
  box-shadow: inset var(--warning-border-default) 0px 0px 0px 1px;
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
}

.containerSelect
  button.containerSelectInput:not(:disabled):not(.errorAlert):not(
    .successAlert
  ):not(.warningAlert):hover {
  border: v-bind(
    "borderHoverStyle ? borderHoverStyle : '1px solid var(--primary-border-subtle)'"
  );
  transition: 0.3s;
}
button.containerSelectInput:disabled {
  cursor: not-allowed;
  color: var(--neutral-text-disabled) !important;
}
.containerOptions {
  position: absolute;
  display: flex;
  flex-direction: column;
  margin-left: 5px;
  width: v-bind(
    "props.widthOptions ? props.widthOptions : 'calc(100% - 10px)'"
  );
  height: auto;
  box-sizing: border-box;
  z-index: 20;
  padding: v-bind(
    "props.paddingOptionsHorizontal ? `10px ${props.paddingOptionsHorizontal}px` : '10 10px'"
  );
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
  background-color: var(--neutral-border-default);
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
  color: var(--neutral-border-default) !important;
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
  color: var(--info-text-default);
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
.containerSelectInput span {
  color: v-bind("colorPlaceholder") !important;
}
.opSelected {
  background-color: var(--primary-surface-shadow-8a) !important;
}
.opSelected span.u {
  color: var(--primary-surface-default) !important;
}
.opSelected span.truncateText {
  color: var(--primary-surface-darker) !important;
}
.noData {
  font-size: 14px;
  line-height: 14px;
  color: var(--neutral-text-caption);
  text-align: center;
}
</style>
