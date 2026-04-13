<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from "vue";
import useGlobalStore from "@/stores/global";

// Stores
const globalStore = useGlobalStore();

// Emits
const emit = defineEmits(["selectedOption"]);

// Props
const props = defineProps({
  size: {
    type: String,
    default: "m", // xs, s, m, l, xl
    validator: (value) => ["xs", "s", "m", "l", "xl"].includes(value),
  },
  icon: {
    type: String,
    default: "",
  },
  text: {
    type: Object,
    default: () => ({}),
    // ejemplo: {text: {es: "Crear", en: "Create"}, tooltip: {es: "Crear Proyecto", en: "Create project"}}
  },
  options: {
    type: Array,
    default: () => [],
    // ejemplo: [{label: {es: "Opción 1", en: "Option 1"}, value: "opt1", icon: "u-check"}, ...]
  },
  maxVisibleOptions: {
    type: Number,
    default: 5, // Máximo de opciones visibles antes de scroll
  },
  orientation: {
    type: String,
    default: "left"
  },
  disabled: {
    type: Boolean,
    default: false
  },
  type: {
    type: String,
     default: "normal", // outlined, text, normal
  },
  showArrow: {
    type: Boolean,
    default: true
  },
  colors: {
    type: Object,
    default: () => ({
      default: "--primary-text-default",
      hover: "--primary-text-subtle",
      active: "--primary-text-darker"
    })
  },
  onlyIcon: {
    type: Boolean,
    default: false
  }
});

// State
const expand = ref(false);
const menuRef = ref(null);

// Computed
const buttonText = computed(() => {
  return props.text?.text?.[globalStore.lang] || "";
});

const colors = computed(() => ({
  default: `var(${props.colors.default || '--primary-surface-default'})`,
  hover: `var(${props.colors.hover || '--primary-text-subtle'})`
}))

const tooltipText = computed(() => {
  return props.text?.tooltip?.[globalStore.lang] || "";
});

const maxHeight = computed(() => {
  // Altura aproximada por opción: 40px
  return props.maxVisibleOptions * 39 + "px";
});

// Methods
const toggleMenu = () => {
  expand.value = !expand.value;
};

const selectOption = (option) => {
  emit("selectedOption", option);

  setTimeout(() => {
    expand.value = false;
  }, 0);
};

const handleClickOutside = (event) => {
  if (menuRef.value && !menuRef.value.contains(event.target)) {
    expand.value = false;
  }
};

const getOptionLabel = (option) => {
  if(option?.label?.default) return option.label.default;
  return option.label?.[globalStore.lang] || option.label || "";
};

// Lifecycle
onMounted(() => {
  document.addEventListener("click", handleClickOutside);
});

onBeforeUnmount(() => {
  document.removeEventListener("click", handleClickOutside);
});
</script>

<template>
  <div ref="menuRef" class="containerMenuBtn">
    <button 
      class="menuButton" 
      @click="toggleMenu"
      :title="tooltipText"
      :class="{ active: expand, [props.size]: true, [props.type]: true }"
      :disabled="props.disabled"
    >
      <span v-if="icon" :class="`u u-${icon}`" class="buttonIcon"></span>
      <span v-if="buttonText" class="buttonText">{{ buttonText }}</span>
      <span 
        v-if="props.showArrow"
        class="u u-chevron-down chevronIcon" 
        :class="{ rotated: expand }"
      ></span>
    </button>
    
    <Transition name="menu">
      <div v-if="expand" class="containerMenuList" :style="props.orientation === 'left' ? 'left: 0;' : 'right: 0;'">
        <div class="containerMenuOptions">
          <button
            v-for="(option, index) in options"
            :key="index"
            class="containerMenuOption"
            @click="selectOption(option)"
            :disabled="option.disabled"
          >
            <span v-if="option.icon" :class="`u u-${option.icon}`" class="optionIcon"></span>
            <span class="optionLabel truncateText">{{ getOptionLabel(option) }}</span>
          </button>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.containerMenuBtn {
  position: relative;
  display: inline-block;
}

.menuButton {
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 16px;
  line-height: 16px;
  transition: all 0.2s ease;
  white-space: nowrap;
}

/* Estado Normal */
.menuButton.normal {
  border: none;
  background-color: v-bind("colors.default");
  color: var(--white);
}
.menuButton.outlined {
  background-color: transparent;
  color: v-bind("colors.default");
  border: 1px solid v-bind("colors.default");
}
.menuButton.text {
  background-color: transparent;
  color: v-bind("colors.default");
}

/* Estado Hover */
.menuButton.normal:not(:disabled):active,
.menuButton.normal:not(:disabled):hover {
  background-color: v-bind("colors.hover");
  color: var(--white);
}
.menuButton.outlined:not(:disabled):active,
.menuButton.outlined:not(:disabled):hover {
  background-color: transparent;
  color: v-bind("colors.hover");
  border: 1px solid v-bind("colors.hover");
}
.menuButton.text:not(:disabled):active,
.menuButton.text:not(:disabled):hover {
  background-color: transparent;
  color: v-bind("colors.hover");
}

/* Estado Disabled */
.menuButton.normal:disabled {
  background-color: var(--neutral-text-disabled);
  color: var(--white);
}
.menuButton.outlined:disabled {
  background-color: transparent;
  color:var(--neutral-text-disabled);
  border: 1px solid var(--neutral-text-disabled);
}
.menuButton.text:disabled {
  background-color: transparent;
  color: var(--neutral-text-disabled);
}

/* Estado Expandido */
.menuButton.normal.active {
  border-color: var(--primary-surface-harder);
  box-shadow: 0 0 0 4px var(--primary-surface-shadow-12a);
}
.menuButton.outlined.active {
  color: v-bind("colors.hover");
  border-color: var(--primary-surface-harder);
  box-shadow: 0 0 0 4px var(--primary-surface-shadow-12a);
}
.menuButton.text.active {
  color: v-bind("colors.hover");
  border-color: var(--primary-surface-harder);
  box-shadow: 0 0 0 4px var(--primary-surface-shadow-12a);
}


.menuButton:disabled {
  cursor: not-allowed;
  background-color: var(--neutral-text-disabled);
}

.menuButton.xl {
  height: 48px;
  padding: 0 24px;
  border-radius: 16px;
  gap: 12px;
}

.menuButton.l {
  width: v-bind("props.onlyIcon ? '40px' : 'auto'");
  height: 40px;
  padding: 0 24px;
  border-radius: 14px;
  gap: 12px;
}
.menuButton.m {
  width: v-bind("props.onlyIcon ? '36px' : 'auto'");
  height: 36px;
  padding: 0 18px;
  border-radius: 12px;
  gap: 8px;
}
.menuButton.s {
  width: v-bind("props.onlyIcon ? '32px' : 'auto'");
  height: 32px;
  padding: 0 12px;
  border-radius: 8px;
  gap: 8px;
}
.menuButton.xs {
  width: v-bind("props.onlyIcon ? '28px' : 'auto'");
  height: 28px;
  padding: 0 10px;
  border-radius: 4px;
  gap: 8px;
  font-size: 14px;
  line-height: 14px;
}
.menuButton .u {
  font-size: 24px;
  line-height: 24px;
}
.menuButton.xs .u {
  font-size: 18px;
  line-height: 18px;
}

.buttonIcon,
.chevronIcon {
  display: flex;
  align-items: center;
  font-size: 16px;
}

.chevronIcon {
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  margin-left: auto;
}

.chevronIcon.rotated {
  transform: rotate(180deg);
}

.buttonText {
  flex: 1;
}

.containerMenuList {
  max-width: 200px;
  position: absolute;
  top: calc(100% + 8px);
  min-width: 100%;
  z-index: 1000;
  background: var(--neutral-background-default);
  border: none;
  border-radius: 8px;
  box-shadow: var(--elevation-xs);
}

.containerMenuOptions {
  max-height: v-bind(maxHeight);
  overflow-y: auto;
  padding: 4px;
}

/* Estilos del scrollbar */
.containerMenuOptions::-webkit-scrollbar {
  width: 6px;
}

.containerMenuOptions::-webkit-scrollbar-track {
  background: transparent;
}

.containerMenuOptions::-webkit-scrollbar-thumb {
  background: var(--neutral-border-default);
  border-radius: 3px;
}

.containerMenuOptions::-webkit-scrollbar-track {
  background-color: var(--neutral-border-subtle);
  border-radius: 3px;
}

.containerMenuOption {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 5px 12px;
  background-color: transparent;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  line-height: 14px;
  color: var(--neutral-text-body);
  text-align: left;
  transition: all 0.15s ease;
}

.containerMenuOption:disabled {
  color: var(--neutral-text-disabled);
  cursor: not-allowed;
}

.containerMenuOption:not(:disabled):hover,
.containerMenuOption:not(:disabled):active {
  background: var(--primary-surface-shadow-8a);
  color: var(--primary-text-default);
}

.optionIcon {
  font-size: 16px;
  color: var(--neutral-text-body);
}

.containerMenuOption:disabled .optionIcon {
  color: var(--neutral-text-disabled);
}

.containerMenuOption:not(:disabled):hover .optionIcon,
.containerMenuOption:not(:disabled):active .optionIcon {
  color: var(--primary-text-default);
}

.optionLabel {
  flex: 1;
  padding-top: 3px;
}

/* Animaciones del menú */
.menu-enter-active {
  animation: menuOpen 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}

.menu-leave-active {
  animation: menuClose 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

@keyframes menuOpen {
  from {
    opacity: 0;
    transform: translateY(-10px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

@keyframes menuClose {
  from {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
  to {
    opacity: 0;
    transform: translateY(-10px) scale(0.95);
  }
}

/* Tamaños específicos del botón */
.containerMenuBtn[data-size="xs"] .menuButton {
  padding: 0 12px;
  font-size: 12px;
}

.containerMenuBtn[data-size="s"] .menuButton {
  padding: 0 14px;
  font-size: 13px;
}

.containerMenuBtn[data-size="l"] .menuButton {
  padding: 0 18px;
  font-size: 15px;
}

.containerMenuBtn[data-size="xl"] .menuButton {
  padding: 0 20px;
  font-size: 16px;
}
</style>