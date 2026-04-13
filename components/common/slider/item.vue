<script setup>
import { computed, defineProps, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import useGlobalStore from "@/stores/global";

// STORES
const globalStore = useGlobalStore();
const route = useRoute();
const router = useRouter();

// STATE
const expandOptions = ref(false);

// PROPS
const props = defineProps({
  data: {
    type: Object,
    default: () => {},
  },
});

// COMPUTED
const widthSlider = computed(() => {
  return globalStore.sliderExpand ? "240px" : "80px";
});

const widthSliderItem = computed(() => {
  return globalStore.sliderExpand ? "208px" : "48px";
});

const currentPage = computed(() => {
  return route.name === props?.data?.name ? "active" : "";
});

const showBtnSubItem = computed(() => {
  return globalStore.sliderExpand ? "1" : "0";
});

const rotateMoreOptions = computed(() => {
  return expandOptions.value ? "180deg" : "0deg";
});

const heightSubItems = computed(() => {
  return expandOptions.value ? "auto" : "0px";
});

const showSubItems = computed(() => {
  return props?.data?.subItems?.length && expandOptions.value && globalStore.sliderExpand;
});

const isDisabled = computed(() => {
  return props?.data?.disabled || false;
});

// FUNCTIONS
const showMoreOptions = () => {
  if (isDisabled.value) return;
  expandOptions.value = !expandOptions.value;
};

const currentSubPage = (subItem) => {
  return subItem.tab === globalStore.tab ? 'selected' : '';
};

const handleItemClick = (event) => {
  // Prevenir cualquier acción si está deshabilitado
  if (isDisabled.value) {
    event.preventDefault();
    event.stopPropagation();
    return;
  }

  // Lógica de navegación
  if (currentPage.value !== 'active') {
    if (!props?.data?.subItems?.length) {
      globalStore.tab = null;
    } else {
      globalStore.tab = 0;
    }
  }

  // Navegar solo si no está deshabilitado y hay una ruta
  if (props?.data?.path) {
    router.push(props.data.path);
  }
};

const handleSubItemClick = (subItem) => {
  if (isDisabled.value) return;
  
  if (subItem.direct) {
    // Emitir evento para acciones directas
    // emit('actionSubPage', subItem.action);
  } else if (subItem.path) {
    router.push(subItem.path);
  }
};
</script>

<template>
  <div class="slider__section-item">
    <div 
      :class="['slider__section-item-box', currentPage, { 'disabled': isDisabled }]" 
      @click="handleItemClick"
    >
      <div class="slider__section-item-content">
        <div class="slider__section-icon">
          <span :class="props?.data?.icon || 'user'"></span>
        </div>
        <span class="label">{{ props?.data?.page || "-" }}</span>
      </div>
      
      <!-- BOTÓN PARA DESPLEGAR OPCIONES -->
      <!-- <button
        v-if="props?.data?.subItems?.length && globalStore.sliderExpand"
        class="btn-moreOptions center-x-y"
        :disabled="isDisabled"
        @click.stop="showMoreOptions"
      >
        <span class="u u-chevron-down"></span>
      </button> -->
    </div>

    <!-- SUB OPCIONES -->
    <!-- <div v-if="showSubItems" class="slider__sections-subItems">
      <div
        v-for="(subItem, s) in props.data.subItems"
        :key="s"
        :class="['slider__sections-subItem', currentSubPage(subItem)]"
        :style="`z-index: ${s}`"
      >
        <button 
          v-if="subItem.direct" 
          class="subItem"
          :disabled="isDisabled"
          @click="handleSubItemClick(subItem)"
        >
          <span class="truncateText">{{ subItem.subPage }}</span>
        </button>
        <div 
          v-else 
          class="subItem"
          :class="{ 'disabled': isDisabled }"
          @click="!isDisabled && handleSubItemClick(subItem)"
        >
          <span class="truncateText">{{ subItem.subPage || 'Negocios' }}</span>
        </div>
      </div>
    </div> -->
  </div>
</template>

<style scoped>
.slider__section-item {
  transition: 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  width: v-bind("widthSlider");
  padding: 0 16px;
}

.slider__section-item-box {
  transition: 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  width: v-bind("widthSliderItem");
  background-color: var(--neutral-background-default);
  height: 32px;
  border-radius: 8px;
  overflow: hidden;
  position: relative;
  cursor: pointer;
}

.slider__section-item-box.disabled {
  cursor: not-allowed !important;
  opacity: 0.5;
}

.slider__section-item-box.disabled * {
  cursor: not-allowed !important;
}

.slider__section-item-box:not(.disabled):hover,
.slider__section-item-box:not(.disabled).active {
  background-color: var(--primary-surface-shadow-8a);
}

.slider__section-item-box:not(.disabled):hover span,
.slider__section-item-box:not(.disabled).active span {
  color: var(--primary-text-default) !important;
}

.slider__section-item-content {
  transition: 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  width: v-bind("widthSliderItem");
  height: 32px;
  display: flex;
  align-items: center;
  overflow: hidden;
}

.slider__section-item-content span.label {
  font-family: Nunito;
  font-size: 14px;
  font-weight: 600;
  line-height: 18px;
  text-align: left;
  color: var(--neutral-text-body);
  transition: 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  white-space: nowrap;
  margin-left: 1px;
}

.btn-moreOptions {
  position: absolute;
  width: 20px;
  height: 20px;
  right: 14px;
  z-index: 9;
  top: 6px;
  opacity: v-bind("showBtnSubItem");
  font-size: 16px;
  color: var(--neutral-text-body);
  transition: 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  transform: rotate(v-bind("rotateMoreOptions"));
}

.btn-moreOptions:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

.slider__section-icon {
  width: 48px;
  height: 32px;
  flex-shrink: 0;
  display: flex;
  justify-content: center;
  align-items: center;
}

.slider__section-icon span {
  font-size: 18px;
  line-height: 18px;
  color: var(--neutral-text-body);
  transition: 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}

/* SubItems */
.slider__sections-subItems {
  height: v-bind("heightSubItems");
  overflow: hidden;
  transition: 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  padding-top: 0px;
}

.slider__sections-subItem {
  transition: 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}

.subItem {
  background-color: var(--neutral-background-default);
  width: calc(100% - 22px);
  height: 32px;
  transition: 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  margin-left: 22px;
  display: flex;
  align-items: center;
  padding: 0 12px;
  border-radius: 8px;
  position: relative;
  margin-top: 4px;
  cursor: pointer;
  border: none;
  font-family: inherit;
}

.subItem.disabled {
  cursor: not-allowed;
  opacity: 0.5;
  pointer-events: none;
}

.slider__sections-subItem.selected .subItem,
.subItem:not(.disabled):hover,
.subItem:not(.disabled):active {
  background-color: var(--primary-surface-shadow-8a);
}

.slider__sections-subItem.selected .subItem span,
.subItem:not(.disabled):hover span,
.subItem:not(.disabled):active span {
  color: var(--primary-text-default) !important;
}

.subItem span {
  font-family: Nunito;
  font-size: 14px;
  font-weight: 600;
  line-height: 14px;
  text-align: left;
  color: var(--neutral-text-body);
  transition: 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  width: 100%;
}

.subItem::before {
  content: "";
  position: absolute;
  left: -12px;
  top: -26px;
  width: 10px;
  height: 42px;
  border-left: 2px solid var(--neutral-border-light);
  border-bottom: 2px solid var(--neutral-border-light);
  border-radius: 0 0 0 10px;
}

/* Global Class */
.center-x-y {
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Truncate text utility */
.truncateText {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>