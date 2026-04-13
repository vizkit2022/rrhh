<script setup>
  import {
    computed,
    defineProps,
    defineEmits,
    ref,
    watch,
    onMounted,
  } from "vue";

  import { generateRandomId } from "@/utils/helpers";
  import { useI18n } from "vue-i18n";
  import useGlobalStore from "@/stores/global";
  const globalStore = useGlobalStore();

  // Define props
  const props = defineProps({
    modelValue: {
      type: String,
      required: true,
    },
    size: {
      type: String,
      default: "m", // xl, l, m, s
    },
    disabled: {
      type: Boolean,
      default: false,
    },
    showSearchIcon: {
      type: Boolean,
      default: false,
    },
    avatar: {
      type: Boolean,
      default: false,
    },
    create: {
      type: Boolean,
      default: false,
    },
    visibleOptions: {
      type: Number,
      default: 5,
    },
    options: {
      type: Array,
      default: () => [],
      // EXAMPLE OPTIONS
      // [{label: 'Example Label', img: 'url' (solo se usa si la propiedad props.modelValue esta en true), text: 'texto' (solo si se usa la propiedad snippet en true)}]
    },
    snippet: {
      type: Boolean,
      default: false,
    },
    error: {
      type: Boolean,
      default: false,
    },
    loading: {
      type: Boolean,
      default: false,
    },
    // Propidad que actualiza el valor del v-model en el parent component
    updated: {
      type: Boolean,
      default: true,
    },
    img: {
      type: String,
      default: "",
    },
    parent: {
      type: String,
      default: null,
    },
    iconSelect: {
      type: String,
      default: "building",
    },
    types: {
      type: Array,
      default: () => [],
    },
    createLabel: {
      type: String,
      default: ""
    }
  });

  // Define variables
  const emit = defineEmits([
    "update:modelValue",
    "newOption",
    "updatedTypeOp",
    "selectedOption",
    "cleanInput",
    "close",
  ]);
  const expand = ref(false);
  const selected = ref(true);
  const currentImg = ref("");
  const idRandomComponent = ref("");
  const orientation = ref("top");
  const isSelectingOption = ref(false);
  const { t } = useI18n();


  // Define watch
  watch(
    () => props.modelValue,
    (newVal, oldVal) => {
      if (!newVal.trim()) expand.value = false;
      if (newVal.trim() !== oldVal.trim() && expand.value) {
        selected.value = true;
        currentImg.value = "";
      }
    }
  );

  watch(
    () => props.img,
    (newVal, oldVal) => {
      currentImg.value = newVal;
    },
    { immediate: true }
  );

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
  const heightInput = computed(() => {
    const sizes = {
      xl: 48,
      l: 40,
      m: 36,
      s: 32,
    };
    return sizes[props.size] || sizes["m"];
  });

  const padInput = computed(() => {
    const padd = {
      xl: 24,
      l: 24,
      m: 18,
      s: 12,
    };
    return padd[props.size] || padd["m"];
  });

  const paddindInput = computed(() => {
    const pd = padInput.value;
    return `0 ${
      pd + (props.create && !!props.modelValue && selected.value ? 32 : 16)
    }px 
    0 ${
      pd + (props.avatar && !!currentImg.value && !!props.modelValue ? 40 : 0)
    }px`;
  });

  const containerOptions = computed(() => {
    return `${borderOption()}
          box-shadow: ${
            expand.value ? "var(--elevation-xs)" : ""
          }; transform: scaleY(${expand.value ? 1 : 0});`;
  });

  const sizeAvatar = computed(() => {
    return ["m", "s"].includes(props.size) ? 24 : 28;
  });

  const heightOption = computed(() => {
    if (props.size === "xl") return `height: ${props.snippet ? 50 : 44}px;`;
    if (props.size === "l") return `height: ${props.snippet ? 50 : 36}px;`;
    if (props.size === "s") return `height: ${props.snippet ? 40 : 32}px;`;
    return `height: ${props.snippet ? 40 : 32}px;`;
  });

  const optionStyle = computed(() => {
    const grid = props.avatar
      ? `${
          ["m", "s"].includes(props.size)
            ? props.snippet
              ? 32
              : 24
            : props.snippet
            ? 36
            : 24
        }px 1fr`
      : "1fr";
    return `grid-template-columns: ${grid};`;
  });

  // Define functions
  const handleInput = (event) => {
    emit("update:modelValue", event.target.value);
    expand.value = true;

    if (props.parent) {
      const input = event.target;
      const containerForm = document.getElementById(props.parent);

      // Obtener la altura visible del #containerForm
      const containerFormVisibleHeight = containerForm.clientHeight;

      // Obtener la posición del input con respecto al #containerForm
      const inputRect = input.getBoundingClientRect();
      const inputY = inputRect.top - containerForm.getBoundingClientRect().top;

      // Obtener la altura del input
      const inputHeight = input.getBoundingClientRect().height;

      const posDownInput = inputY + inputHeight;

      orientation.value =
        posDownInput <= containerFormVisibleHeight - 280 ? "top" : "bottom";
    }
  };
  const handleBlur = () => {
    setTimeout(() => {
      if (!isSelectingOption.value) {
        emit("close");
      }
      isSelectingOption.value = false; // Restablecer la bandera
    }, 100); // Dar tiempo para que el click en la opción sea registrado
  };

  const selectOption = (option) => {
    isSelectingOption.value = true; // Activar la bandera
    currentImg.value = option.img;
    expand.value = false;
    emit("selectedOption", option);
    selected.value = false;
  };

  const newOption = (type) => {
    currentImg.value = "";
    expand.value = false;
    emit("newOption");
    emit("updatedTypeOp", type);
    selected.value = false;
  };

  const borderOption = () => {
    if (props.size === "xl") return "border-radius: 18px;";
    if (props.size === "l") return "border-radius: 16px;";
    if (props.size === "s") return "border-radius: 12px;";
    return "border-radius: 14px;";
  };

  const heightContainerOptions = () => {
    if (props.size === "xl")
      return `max-height: ${props.visibleOptions * (48 - 4)}px;`;
    if (props.size === "l")
      return `max-height: ${props.visibleOptions * (40 - 4)}px;`;
    if (props.size === "s")
      return `max-height: ${props.visibleOptions * 32}px;`;
    return `max-height: ${props.visibleOptions * (36 - 4)}px;`;
  };

  // Text
  const textOptionCreate = computed(() => {
    const texts = {
      es: "Crear",
      en: "Create",
    };
    return texts[globalStore.lang] || "Crear";
  });
  const textLabelCreate = computed(() => {
    const texts = {
      es: "como",
      en: "as",
    };
    return texts[globalStore.lang] || "Crear";
  });
</script>

<template>
  <div :class="['containerSearch search', size, { 'no-icon': !props.iconSelect }]"
    :id="idRandomComponent"
  >
    <!-- Conditionally render the searchType div -->
    <div v-if="props.iconSelect" class="searchType">
      <span :class="`u u-${props.iconSelect}`"></span>
    </div>
    <div
      v-if="props.avatar && !!currentImg && !!props.modelValue"
      class="avatarModify"
    >
      <u-avatar
        :user="{ name: props.modelValue, src: currentImg }"
        :size="sizeAvatar"
        :nothover="true"
      ></u-avatar>
    </div>
    <input
      :class="size"
      type="text"
      v-bind="$attrs"
      :value="modelValue"
      :disabled="disabled"
      autocomplete="nope"
      @input="handleInput($event)"
      @blur="handleBlur"
    />
    <button
      class="cleanBtn"
      v-if="!!props.modelValue"
      @click="$emit('cleanInput')"
      :disabled="disabled"
    >
      <span class="u u-cancel"></span>
    </button>
    <button
      class="cleanBtn"
      v-if="!!!props.modelValue && props.showSearchIcon"
      :disabled="true"
      style="cursor: default;"
    >
      <span class="u u-search"></span>
    </button>
    <!-- <button
      class="searchBtn"
      v-if="props.create && !!props.modelValue && selected && !loading"
      :disabled="disabled"
      @click="newOption()"
    >
      Crear
    </button> -->
    <div
      class="containerOptions"
      :style="`${containerOptions}${
        orientation === 'top'
          ? 'top: calc(100% + 8px);'
          : 'bottom: calc(100% + 8px);'
      } `"
    >
      <div class="containerOptionsOnly scroll" :style="heightContainerOptions()">
        <div v-if="props.loading" class="withoutResults">
          <u-loading :width="16" />
          <span style="margin-left: 10px" v-text="t('global.text.text')"></span>
        </div>
        <template v-else>
          <template v-if="props.options.length">
            <button
              v-for="(option, op) in props.options"
              :key="op"
              :style="`${borderOption()}${heightOption}${optionStyle}`"
              @click="
                selectOption(option),
                  props.updated ? $emit('update:modelValue', option.label) : ''
              "
            >
              <u-avatar
                v-if="props.avatar"
                :user="{ name: option.label, src: option.img }"
                :size="sizeAvatar - 2 + (props.snippet ? 8 : 0)"
                :nothover="true"
              ></u-avatar>
              <div class="optionText">
                <span class="optionText__main truncateText body-l-sb">{{
                  option.label
                }}</span>
                <span class="optionText__second truncateText" v-if="snippet">{{
                  option.text
                }}</span>
              </div>
            </button>
          </template>
          <div v-else class="withoutResults body-xs-r spacer">
            <span v-text="t('global.text.noResults')"></span>
          </div>
        </template>

      </div>
      <div>
        <template
          v-if="props.create && !!props.modelValue && selected && !loading"
        >
          <div v-if="props.options.length !== 0" class="withoutResults spacerLabel body-xs-r spacer">
            <span>{{ props.createLabel }}</span>
          </div>
          <button
            class="btnCreateOp"
            v-for="(type, t) in props.types"
            :key="t"
            :disabled="disabled"
            @click="newOption(type.value)"
          >
            <span class="body-l-sb">{{ textOptionCreate }}</span>
            <span class="truncateText main body-l-sb">{{ props.modelValue }}</span>
            <span class="body-m-r second">{{ textLabelCreate + " " +  type.name[globalStore.lang] }}</span>
            <span :class="`u u-${type.icon} body-m-r second`"></span>
          </button>
        </template>
      </div>
    </div>
  </div>
</template>

<style scoped>
  .optionText {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .optionText__main {
    color: var(--neutral-text-body);
  }

  .optionText__second {
    font-weight: 400;
    font-size: 12px !important;
    line-height: 12px !important;
    color: var(--neutral-text-caption);
    font-family: Nunito;
  }
  .containerSearch {
    position: relative;
  }
  .containerSearch input {
    width: calc(100% - 50px);
    caret-color: var(--neutral-text-body);
    border: 1px solid
      v-bind("props.error ? 'var(--danger-border-default)' : 'var(--neutral-border-default)'");
    box-shadow: v-bind(
      "props.error ? 'inset var(--danger-border-default) 0px 0px 0px 1px' : ''"
    );
    color: var(--neutral-text-body);
    font-size: 14px;
    line-height: 16px;
    font-weight: 400;
    transition: 0.3s;
    padding: v-bind("paddindInput");
    font-family: Nunito;
    margin-left: 50px;
    transition: 0.3s;
  }

  .containerSearch input:hover:not(:focus) {
    border: 1px solid var(--primary-border-subtle);
  }

  .containerSearch.no-icon input {
    width: 100%;       /* Full width */
    margin-left: 0;    /* No left margin */
  }

  .cleanBtn {
    height: 24px;
    width: 18px;
    position: absolute;
    top: v-bind("(heightInput / 2) - 12 + 'px'");
    font-weight: 400;
    right: v-bind(
      "padInput + (props.create && selected && !loading ? 0 : 0) + 'px'"
    );
    font-size: 24px;
    line-height: 12px;
    color: var(--neutral-text-caption);
  }

  .cleanBtn:not(:disabled):hover {
    color: var(--neutral-text-caption);
  }
  .cleanBtn:disabled {
    cursor: not-allowed;
  }
  .containerOptionsOnly {
    height: auto;
    overflow-y: auto;
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
  }
  .containerOptions {
    position: absolute;
    flex-direction: column;
    display: flex;
    left: 4px;
    width: calc(100% - 8px);
    z-index: 20;
    transition: 0.3s;
    transform-origin: v-bind(orientation);
    background-color: var(--neutral-background-default);
    padding: 4px;
  }
  .containerOptions::-webkit-scrollbar-thumb {
    background-color: var(--neutral-border-default);
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
    border-radius: 10px;
  }
  .containerOptions button:hover {
    background-color: var(--primary-surface-shadow-8a);
    color: var(--neutral-text-caption);
    transition: 0.3s;
  }

  .withoutResults {
    height: 40px;
    display: flex;
    justify-content: center;
    align-items: center;
  }
  .withoutResults.spacerLabel {
    height: 28px !important;
  }
  .withoutResults span {
    color: var(--neutral-text-caption);
  }
  .containerOptions button span {
    text-align: start;
  }
  .xl {
    height: 48px;
    border-radius: 18px;
    font-size: var(--size-body-xl) !important;
    line-height: var(--line-height-body-xl) !important;
  }

  .l {
    height: 40px;
    border-radius: 16px;
    font-size: var(--size-body-l) !important;
    line-height: var(--line-height-body-l) !important;
  }
  .m {
    height: 36px;
    border-radius: 14px;
    font-size: var(--size-body-m) !important;
    line-height: var(--line-height-body-m) !important;
  }
  .s {
    height: 32px;
    border-radius: 12px;
    font-size: var(--size-body-m) !important;
    line-height: var(--line-height-body-m) !important;
  }

  .containerSearch.no-icon .xl {
    border-radius: 16px; /* Rounded on both sides */
  }

  .containerSearch.no-icon .l {
    border-radius: 14px;
  }

  .containerSearch.no-icon .m {
    border-radius: 12px;
  }

  .containerSearch.no-icon .s {
    border-radius: 8px;
  }

  input:not(:disabled):hover {
    border: v-bind(
      "props.error ? '1px solid var(--danger-border-default)' : '1px solid var(--neutral-border-default)'"
    );
  }
  input:not(:disabled):active,
  input:not(:disabled):focus {
    caret-color: v-bind(
      "props.error ? 'var(--danger-border-default)' : 'var(--neutral-border-default)'"
    );
    border: v-bind(
      "props.error ? '1px solid var(--danger-border-default)' : '1px solid var(--primary-border-default)'"
    );
    box-shadow: v-bind(
      "props.error ? 'inset var(--danger-border-default) 0px 0px 0px 1px' : 'inset var( --primary-border-default) 0px 0px 0px 1px'"
    );
  }
  input:disabled,
  input:disabled:active {
    cursor: not-allowed;
    border: 1px solid var(--neutral-text-disabled);
    box-shadow: inset transparent 0px 0px 0px 1px;
  }
  input:disabled,
  input:disabled::placeholder {
    color: var(--neutral-text-disabled);
  }
  input::placeholder {
    color: var(--neutral-border-default);
  }
  input:disabled:hover {
    border: 1px solid var(--neutral-border-disabled);
  }

  .search.xl .searchType {
    border-radius: 18px 0 0 18px;
  }
  .search.l .searchType {
    border-radius: 16px 0 0 16px;
  }
  .search.m .searchType {
    border-radius: 14px 0 0 14px;
  }
  .search.s .searchType {
    border-radius: 12px 0 0 12px;
  }
  /* Boton del tipo del buscador */
  .searchType {
    width: 50px;
    height: 100%;
    border-top: 1px solid var(--neutral-border-default);
    border-bottom: 1px solid var(--neutral-border-default);
    border-left: 1px solid var(--neutral-border-default);
    background-color: var(--neutral-surface-shadow-8a);
    position: absolute;
    left: 0px;
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 5px;
    padding-left: 2px;
  }
  .searchType span {
    color: var(--neutral-text-caption);
    font-size: 18px;
  }
  .btnCreateOp {
    height: 32px;
    display: grid;
    grid-template-columns: auto 1fr auto auto;
    gap: 5px !important;
  }
  .btnCreateOp span {
    color: var(--neutral-text-subtitle);
  }
  .btnCreateOp span.main {
    color: var(--primary-text-default);
  }
  .btnCreateOp span.second {
    color: var(--neutral-text-caption);
  }
  .spacer span {
    background-color: var(--neutral-background-default);
    padding: 0 20px;
  }
  .spacer {
    position: relative;
    display: flex;
    justify-content: center;
    align-items: center;
  }
  .spacer::before {
    content: "";
    height: 1px;
    width: calc(100% - 20px);
    position: absolute;
    background-color: var(--neutral-border-subtle);
    z-index: -1;
    left: 11px;
  }
  /* modifications of customs components */
  .avatarModify {
    position: absolute;
    left: v-bind("padInput + 0 + 'px'");
    top: v-bind("(heightInput / 2) - (sizeAvatar / 2 ) + 'px'");
  }
</style>
