<script setup>
// Traductor
const label = "global.text.loading";
const { t } = useI18n();

const props = defineProps({
  size: {
    type: String,
    default: "m", // xl, l, m, s, xs
  },
  // Color Text
  color: {
    type: String,
    default: "--neutral-text-caption",
  },
  colorHover: {
    type: String,
    default: "--neutral-text-body",
  },
  // Color Background
  background: {
    type: String,
    default: "--primary-surface-shadow-8a",
  },
  backgroundHover: {
    type: String,
    default: "--primary-surface-shadow-12a",
  },
  // icons
  icon: {
    type: String,
    default: "package",
  },
  // Text
  text: {
    type: String,
    default: "",
  },
  textLoading: {
    type: String,
    default: "",
  },
  // Loading
  loading: {
    type: Boolean,
    default: false,
  },
  // Disabled
  disabled: {
    type: Boolean,
    default: false,
  },
});

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

// Font Size
const fontClass = computed(() => {
  const fontsClass = {
    xl: "body-xl-sb",
    l: "body-xl-sb",
    m: "body-xl-sb",
    s: "body-xl-sb",
    xs: "body-m-sb",
  };
  return fontsClass[props.size] || fontsClass.m;
});

const loadingWidth = computed(() => {
  return props.size === "xs" ? 14 : 18;
});

// Const computed
const color = `var(${props.color})`;
const colorHover = `var(${props.colorHover})`;

const background = `var(${props.background})`;
const backgroundHover = `var(${props.backgroundHover})`;

const textLoading = computed(() => {
  return props.textLoading ? props.textLoading : t("global.text.loading");
});

const text = computed(() => {
  return props.loading ? textLoading : props.text;
});
</script>

<template>
  <button class="btn" :class="[size, fontClass]" :disabled="disabled">
    <u-loading v-if="props.loading" :width="loadingWidth" />
    <span
      v-if="props.icon && !props.loading"
      :class="`u u-${props.icon}`"
    ></span>
    <span>{{ text }}</span>
  </button>
</template>

<style scoped>
.btn {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  width: 100%;
  transition: 0.3s;
  color: v-bind("color");
  background-color: v-bind("background");
  font-size: 14px;
}

.btn:disabled {
  color: var(--neutral-text-disabled);
  background-color: var(--neutral-surface-shadow-8a);
  cursor: not-allowed;
}

.btn:not(:disabled):hover,
.btn:not(:disabled):active {
  color: v-bind("colorHover");
  background-color: v-bind("backgroundHover");
}

.xl {
  height: 48px;
  padding: 0 24px;
  border-radius: 16px;
  gap: 12px;
}

.l {
  height: 40px;
  padding: 0 24px;
  border-radius: 14px;
  gap: 12px;
}

.m {
  height: 36px;
  padding: 0 18px;
  border-radius: 12px;
  gap: 8px;
}

.s {
  height: 32px;
  padding: 0 12px;
  border-radius: 8px;
  gap: 8px;
}

.xs {
  height: 28px;
  padding: 0 10px;
  border-radius: 4px;
  gap: 8px;
}

.u {
  font-size: 18px;
  line-height: 18px;
}

.xs .u {
  font-size: 14px;
  line-height: 14px;
}
</style>
