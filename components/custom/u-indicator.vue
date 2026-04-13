<script setup>
import { computed, defineProps, defineEmits } from "vue";
import { formatMoneyWithSuffix } from "@/utils/formatters";

const { t } = useI18n();

// Define props
const props = defineProps({
  indicator: {
    type: Object,
    default: () => {},
  },
  height: {
    type: Number,
    default: 82,
  },
  iconSize: {
    type: Number,
    default: 64,
  },
  widthGridIcon: {
    type: Number,
    default: 64,
  }
});

// Emits
const emit = defineEmits(["selectedInd"]);

// Computed
const color = computed(() => {
  const colorCode = props.indicator.color
    ? `--bg-${props.indicator.color}-100`
    : `--bg-primary-100`;
  return `var(${colorCode})`;
});

// color: --primary-text-default
// bacgroundColor: --primary-surface-light

const action = () => {
  if (props.indicator.disabled) return; 
  if (props.indicator.action) {
    emit("selectedInd", props.indicator.pos );
  }
};

const getTranslatedValue = (key, fallback) => {
  // Verifica si `key` está definido y no es nulo
  if (!key) return fallback;

  // Intenta traducir usando i18n
  const translation = t(key);

  // Si la traducción existe y es diferente de la clave original, úsala; de lo contrario, usa el valor de fallback
  return translation && translation !== key ? translation : fallback;
};
</script>

<template>
  <div class="indicator" :class="{ disabled: props.indicator.disabled }"  @click="action">
    <div class="indicator__icon">
      <span :class="`u u-${props.indicator.icon || 'contabilidad'}`"></span>
    </div>
    <div class="indicator__text">
      <div class="indicator__text-title">
        <span class="truncateText">{{ getTranslatedValue(props.indicator?.translateRoute, props.indicator.label) }}</span>
      </div>
      <div
        class="indicator__text-mount"
        v-if="props.indicator.hasOwnProperty('mount')"
      >
        <span>{{
          formatMoneyWithSuffix(
            props.indicator.mount,
            props.indicator.showMoney,
            props.indicator.money
          )
        }}</span>
      </div>
      <div
        class="indicator__text-mount"
        v-if="props.indicator.hasOwnProperty('text')"
      > 
        <span>{{ props.indicator.text }}</span>
      </div>
      <div v-if="props.indicator.percentage" class="indicator__text-state">
        <span
          :class="`u u-${
            props.indicator.percentage > 0 ? 'trend-up' : 'trend-down'
          }`"
        ></span>
        <span>
          {{ props.indicator.percentage > 0 ? "+" : ""
          }}{{ props.indicator.percentage ? props.indicator.percentage.toFixed(2) : 0 }}%
        </span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.indicator {
  height: v-bind("`${props.height}px`");
  width: 100%;
  border-radius: 24px;
  padding: 0 18px 0 12px;
  background-color: var(--neutral-background-default);
  display: grid;
  grid-template-columns: v-bind("`${props.widthGridIcon}px`")  1fr;
  gap: 12px;
  /* border: 1px solid var(--neutral-border-light); */
  align-items: center;
  box-sizing: border-box;
  box-shadow: var(--elevation-xs);
  cursor: v-bind("props.indicator.action ? 'pointer' : 'auto'");
  transition: border 0.3s;
  border: 3px solid
    v-bind(
      "props.indicator.default ? color.replace('100','400') : 'transparent'"
    );
}

.disabled {
  opacity: 0.5;
  cursor: not-allowed;
  filter: grayscale(0.4);
  transition: opacity 0.3s ease, filter 0.3s ease;
}


.indicator__icon {
  width: v-bind("`${props.iconSize}px`");
  height: v-bind("`${props.iconSize}px`");
  border-radius: 50%;
  background-color: v-bind("color");
  display: flex;
  justify-content: center;
  align-items: center;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.indicator__icon:before {
  position: absolute;
  content: "";
  top: -180px;
  left: 0;
  width: 30px;
  height: 100%;
  background-color: #fff;
  animation: flash 50s ease-in-out infinite;
}

.indicator__icon span {
  color: v-bind("color.replace('100','500')");
  font-size: v-bind("`${props.iconSize / 1.5}px`");
}
.indicator__text {
  display: flex;
  flex-direction: column;
  justify-content: center; /* Centra los elementos por defecto */
}
.indicator__text-title {
  height: 20px;
}
.indicator__text-title span {
  display: inline-block;
  color: var(--neutral-text-caption);
  font-family: Nunito;
  font-size: 12px;
  font-weight: 600;
  line-height: 14px;
  letter-spacing: 0em;
  text-align: left;
}
.indicator__text-mount span {
  width: fit-content;
  font-size: 18px;
  font-weight: 600;
  line-height: 20px;
  letter-spacing: 0em;
  text-align: left;
  color: var(--neutral-text-body);
}
.indicator__text-state {
  display: flex;
  gap: 5px;
}
.indicator__text-state span {
  color: var(--success-text-default);
  font-size: 10px;
  font-weight: 600;
  line-height: 12px;
  letter-spacing: 0em;
  text-align: left;
}
</style>
