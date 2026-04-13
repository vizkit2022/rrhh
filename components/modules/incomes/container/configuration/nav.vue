<script setup>
import { ref, defineEmits } from "vue";
import { useI18n } from "vue-i18n";

// Translations
const { locale } = useI18n();

const props = defineProps({
  posId: {
    type: Number,
  },
});

const expanded = ref(false);

const toggleExpand = () => {
  expanded.value = !expanded.value;
};

const title = computed(() => {
  return locale.value === "es" ? "Configuración" : "Configuration";
});

const options = ref([
  {
    label: {
      es: "Fórmulas Globales",
      en: "Globals",
    },
    icon: "u u-calculator",
    disabled: false,
    id: 0,
  },
  {
    label: {
      es: "Unidades",
      en: "Units",
    },
    icon: "u u-ruler",
    disabled: false,
    id: 1,
  },
  {
    label: {
      es: "Monedas",
      en: "Currencies",
    },
    icon: "u u-dollar-sign",
    disabled: true,
    id: 2,
  },
  {
    label: {
      es: "Horas Extra",
      en: "Extra Hours",
    },
    icon: "u u-clock",
    disabled: true,
    id: 3,
  },
  // {
  //   label: {
  //     es: "Informacion del Proyecto",
  //     en: "Project Information",
  //   },
  //   icon: "u u-file-text",
  //   disabled: true,
  //   id: 4,
  // }
]);

const emit = defineEmits(["selectedOption"]);
</script>

<template>
  <div class="configurationNav">
    <button class="titleNav" style="width: auto" @click="toggleExpand">
      <div v-if="expanded" class="containerTitle">
        <span class="u u-settings icons"></span>
        <p class="containerTitle__label">{{ title }}</p>
      </div>
      <span
        class="u u-chevron-left icons"
        :style="{
          transform: expanded ? 'rotate(0deg)' : 'rotate(-180deg)',
          transition: 'transform 0.3s',
        }"
      ></span>
    </button>

    <span class="borderSeparator"></span>

    <div style="display: flex; flex-direction: column; gap: 8px">
      <button
        class="options"
        v-for="(option, op) in options"
        :key="op"
        @click="emit('selectedOption', option.id)"
        :class="posId === option.id ? 'selected' : ''"
        :disabled="option.disabled"
      >
        <span :class="option.icon" class="icons"></span>
        <span v-if="expanded" class="options__label">{{
          option.label[locale]
        }}</span>
      </button>
    </div>
  </div>
</template>

<style scoped>
.configurationNav {
  width: v-bind("expanded ? '264px' : '80px'");
  transition: 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  display: flex;
  flex-direction: column;
  position: relative;
  z-index: 999;
  gap: 16px;
  flex-shrink: 0;
  border-right: 1px solid var(--neutral-border-light);
  padding-right: 20px;
  overflow: hidden;
}

.configurationNav::-webkit-scrollbar {
  width: 0px;
  height: 0px;
}

.titleNav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-family: Nunito;
  font-size: 16px;
  font-weight: 600;
  line-height: 20px;
  letter-spacing: 0em;
  text-align: left;
  padding-left: 20px;
  color: var(--neutral-text-body);
}

.containerTitle {
  display: flex;
  align-items: center;
  gap: 8px;
}

.containerTitle__label {
  font-size: 14px;
  font-weight: 600;
  line-height: 18px;
  transition: 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  white-space: nowrap;
}

.titleNav span {
  display: flex;
  align-items: center;
  gap: 8px;
}

.titleNav button {
  width: 10px;
  height: 40px;
  border-radius: 8px;
  border: none;
  background-color: var(--neutral-background-default);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.borderSeparator {
  width: 100%;
  height: 1px;
  background-color: var(--neutral-border-light);
}

.options {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 8px;
  padding-left: 20px;
  overflow: hidden;
  transition: 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}

.options__label {
  font-size: 14px;
  font-weight: 600;
  line-height: 18px;
  transition: 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  white-space: nowrap;
}

.icons {
  width: 24px;
  height: 24px;
  flex-shrink: 0;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 20px;
}

.configurationNav button {
  height: 40px;
  width: 100%;
  background-color: var(--neutral-background-default);
  transition: 0.3s;
  font-family: Nunito;
  font-size: 16px;
  font-weight: 600;
  line-height: 20px;
  letter-spacing: 0em;
  text-align: left;
  color: var(--neutral-text-caption);
  padding: 0 20px;
  border-radius: 8px;
}
.configurationNav button:not(:disabled):hover,
.configurationNav button:not(:disabled).selected {
  background-color: var(--primary-surface-shadow-8a);
  color: var(--primary-text-default);
}
.configurationNav button:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}
</style>
