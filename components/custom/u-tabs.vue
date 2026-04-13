<script setup>
import { defineProps, defineEmits } from "vue";
import { useI18n } from "vue-i18n";

// Usa la función de i18n
const { t } = useI18n();

// Emits
const emit = defineEmits(["update:modelValue","updatedTab"]);

// Define props
const props = defineProps({
  modelValue: {
    type: Number,
    default: 0,
  },
  tabs: {
    type: Array,
    default: () => [],
  },
  fullscreen: {
    type: Boolean,
    default: true,
  },
  textAlign: {
    type: String,
    default: "left"
  }
});

// Define functions
const gridText = (tab) => {
  return `grid-template-columns: ${
    !!tab.icon && tab.main
      ? "24px 1fr 24px"
      : !!tab.icon && !tab.main
      ? "24px 1fr"
      : !tab.icon && !!tab.main
      ? "1fr 24px"
      : "1fr"
  }`;
};

const getTranslatedValue = (key, fallback) => {
  // Verifica si `key` está definido y no es nulo
  if (!key) return fallback;

  // Intenta traducir usando i18n
  const translation = t(key);

  // Si la traducción existe y es diferente de la clave original, úsala; de lo contrario, usa el valor de fallback
  return translation && translation !== key ? translation : fallback;
};

const eventBtn = (tab) => {
  if(!tab.disabled) {
    emit('update:modelValue', tab.tab);
    emit('updatedTab');
  }
};
</script>

<template>
  <div class="scrollableContainer">
    <div class="containerTabs">
      <button
        :class="`tab ${tab.tab === modelValue ? 'selected' : ''}`"
        v-for="(tab, t) in tabs"
        :key="t"
        :disabled="tab.disabled"
        @click="eventBtn(tab)"
      >
        <div class="tab__text" :style="gridText(tab)">
          <span v-if="tab.icon" :class="`u u-${tab.icon} icon`"></span>
          <span class="text truncateText body-l-sb"
            >{{ getTranslatedValue(tab.translateRoute, tab.label) }}
            <span v-if="tab.subLabel" class="textSubLabel"> {{ getTranslatedValue(tab.translateRouteSubLabel, tab.subLabel) }}</span>
            <strong v-if="tab.indicator" class="body-l-sb"
              >({{ tab.number || 0 }})</strong
            ></span
          >
          <span v-if="tab.main" class="u u-bookmark main"></span>
        </div>
        <div class="tab__bar"></div>
      </button>
    </div>
  </div>
</template>

<style scoped>
.scrollableContainer {
  flex-shrink: 0;
  width: 100%;
  overflow-x: scroll;
  overflow-y: hidden;
}
.scrollableContainer::-webkit-scrollbar {
  width: 0px;
  height: 0px;
}

.containerTabs {
  position: relative;
  width: 100%;
  display: flex;
  justify-content: space-between;
  gap: 4px;
  height: 32px;
  /*     border-bottom: 4px solid var(--neutral-surface-harder); */
}

.containerTabs::before {
  z-index: 0;
  position: absolute;
  content: "";
  height: 4px;
  width: 100%;
  background-color: var(--neutral-surface-harder);
  border-radius: 4px;
  bottom: 0;
}

.tab {
  z-index: 1;
  width: 100%;
  height: 32px;
  display: grid;
  grid-template-rows: 20px 4px;
  gap: 8px;
}

.tab__text .text {
  text-align: v-bind("props.textAlign");
}

.tab__text .textSubLabel {
  text-align: left;
  font-size: 10px;
  font-weight: 400;
  line-height: 14px;
  letter-spacing: 0.1em;
  text-align: left;
  color: var(--neutral-text-caption);
}

.tab:disabled .textSubLabel {
  color: var(--neutral-text-disabled);
  transition: 0.3s;
}

.tab.selected:not(:disabled) .tab__text {
  color: var(--primary-text-default);
  transition: 0.3s;
}
.tab.selected:not(:disabled) .tab__bar {
  background-color: var(--primary-surface-default);
  transition: 0.3s;
}

.tab:not(:disabled):not(.selected):hover .tab__text {
  color: var(--primary-text-subtle);
  transition: 0.3s;
}
.tab:not(:disabled):not(.selected):hover .tab__bar {
  background-color: var(--primary-surface-harder);
  transition: 0.3s;
}

.tab:disabled {
  cursor: not-allowed;
}

.tab:disabled .tab__text {
  color: var(--neutral-text-disabled);
  transition: 0.3s;
}

.tab:disabled .tab__bar {
  background-color: var(--neutral-surface-harder);
  transition: 0.3s;
}

.tab__text {
  display: grid;
  height: 24px;
  padding: 0 8px;
  align-items: center;
  gap: 8px;
  color: var(--neutral-text-caption);
  transition: 0.3s;
}

.tab__text span.icon {
  font-size: 24px;
}

.tab__text span.main {
  color: var(--primary-text-subtle);
  font-size: 24px;
}

.tab__bar {
  background-color: var(--neutral-surface-harder);
  width: 100%;
  height: 4px;
  border-radius: 3px;
}
</style>
