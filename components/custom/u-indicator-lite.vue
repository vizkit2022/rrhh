<script setup>
import { computed, defineProps } from "vue";
import { formatMoneyWithSuffix } from "@/utils/formatters";
const { $bus } = useNuxtApp();

// Define props
const props = defineProps({
  indicator: {
    type: Object,
    default: () => ({}),
  },
  disabled: {
    type: Boolean,
    default: false,
  },
  loading: {
    type: Boolean,
    default: false,
  },
});

const color = computed(() => {
  const colorCode = props.indicator.color
    ? `--bg-${props.indicator.color}-100`
    : `--bg-primary-100`;
  return `var(${colorCode})`;
});

const action = () => {
  if (props.indicator.action) {
    $bus.$emit("selectedInd", { pos: props.indicator.pos, loading: true });
  }
};

const getIcon = (ind) => {
  if (ind?.percentage?.includes("-")) {
    return "trend-down";
  }
  return "trend-up";
};

const statePercentage = () => {
  if (props.indicator?.percentage?.includes("-")) {
    return "down";
  }
  return "up";
};

const getCurrencyColor = (amount) => {
  if (amount && String(amount).includes("-"))
    return "var(--danger-text-default)";
  return "var(--neutral-text-body)";
};
</script>

<template>
  <div class="indicator" @click="action">
    <div class="indicator__icon">
      <span :class="`u u-${props.indicator.icon || 'contabilidad'}`"></span>
    </div>
    <div class="indicator__text">
      <div class="indicator__text-title">
        <span class="truncateText" v-if="props.indicator.traslateRute">
          {{ $t(props.indicator.traslateRute) }}
        </span>
        <span class="truncateText" v-else v-if="!props.disabled">
          {{ props.indicator.label }}
        </span>
      </div>
      <div
        v-if="
          props.indicator.hasOwnProperty('mount') ||
          props.indicator.hasOwnProperty('value')
        "
        class="indicator__text-mount"
      >
        <div v-if="!props.disabled" style="display: contents">
          <span
            :style="`color: ${getCurrencyColor(props.indicator.mount)};`"
            v-if="!props.loading"
            >{{ props.indicator.mount }}</span
          >
          <u-loading v-else :width="16" />
        </div>
        <div
          v-if="!!props.indicator?.percentage"
          class="indicator__text-state"
          :class="statePercentage()"
        >
          <span
            :class="`u u-${getIcon(props.indicator)}`"
            v-if="!props.disabled"
          ></span>
          <span v-if="!props.disabled">{{ props.indicator?.percentage }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.indicator {
  height: fit-content;
  width: 100%;
  border-radius: 12px;
  background-color: var(--neutral-background-light);
  display: grid;
  grid-template-columns: min-content 1fr;
  gap: 6px;
  align-items: center;
  box-sizing: border-box;
  box-shadow: var(--elevation-xs);
  cursor: v-bind("props.indicator.action ? 'pointer' : 'auto'");
  transition: border 0.3s;
  border: solid 3px
    v-bind(
      "props.indicator.default ? color.replace('100','400') : 'transparent'"
    );
}

.indicator__icon {
  margin: 6px 8px;
  width: 36px;
  height: 36px;
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
  font-size: 28px;
}

.indicator__text {
  margin-right: 10px;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.indicator__text-title {
  height: 18px;
}

.indicator__text-title span {
  width: 100%;
  display: inline-block;
  color: var(--neutral-text-caption);
  font-family: Nunito;
  font-size: 14px;
  font-weight: 600;
  line-height: 18px;
  text-align: left;
}

.indicator__text-mount {
  height: 20px;
  width: 100%;
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  display: flex;
  width: max-content;
}

.indicator__text-mount span {
  font-family: Nunito;
  font-size: 16px;
  font-weight: 600;
  line-height: 20px;
  text-align: left;
}

.indicator__text-state {
  margin-left: auto;
  display: flex;
  margin-left: 16px;
  align-items: center;
}

.indicator__text-state span {
  font-family: Nunito;
  font-size: 12px;
  font-weight: 600;
  line-height: 12px;
  text-align: left;
}
.indicator__text-state.up span {
  color: var(--success-text-default);
}
.indicator__text-state.down span {
  color: var(--danger-text-default);
}
.indicator__text-state.normal span {
  color: var(--neutral-text-caption);
}
</style>
