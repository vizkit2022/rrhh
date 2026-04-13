<script setup>
import { defineProps, computed } from "vue";
const props = defineProps({
  color: {
    type: String,
    default: "--primary-text-darker",
  },
  background: {
    type: String,
    default: "--primary-surface-light",
  },
  text: {
    type: String,
    default: "",
  },
  alignCenterText: {
    type: Boolean,
    default: false,
  },
  icon: {
    type: String,
    default: "",
  },
  delete: {
    type: Boolean,
    default: true,
  },
  size: {
    type: String,
    default: "m",
  },
  disabled: {
    type: Boolean,
    default: false,
  },
  maxWidth: {
    type: String,
    default: "auto",
  },
  avatar: {
    type: String,
    default: "",
  },
  type: {
    type: String,
    default: "text",
  },
  cursorPointer: {
    type: Boolean,
    default: false,
  }
});

// Function
const getSize = computed(() => {
  const sizes = {
    xs: 16,
    s: 20,
    m: 20,
    l: 24,
    xl: 24,
  };
  return sizes[props.size] || 20;
});
</script>

<template>
  <div
    :class="`${props.size} tagCustom ${props.cursorPointer ? 'cursorPointer' : ''}`"
    :style="`background-color: var(${
      props.disabled ? '--neutral-surface-disabled' : props.background
    }); color: var(${props.disabled ? '--neutral-text-caption' : props.color})`"
  >
    <u-avatar
      v-if="props.type === 'avatar'"
      :user="{ name: props.text, src: props.avatar }"
      :size="getSize"
    />
    <span
      class="text truncateText"
      :class="{ centerText: props.alignCenterText }"
      >{{ props.text }}</span
    >
    <span v-if="!!props.icon" :class="`u u-${props.icon}`"> </span>
    <button
      v-if="props.delete"
      @click="$emit('closeButton', true)"
      :disabled="props.disabled"
    >
      <span :style="`color: var(${props.color});}`" class="u u-cancel"></span>
    </button>
  </div>
</template>

<style scoped>
.tagCustom {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-radius: 16px;
  height: 24px;
  flex-shrink: 0;
}

.cursorPointer {
  cursor: pointer;
}

.text {
  max-width: v-bind("props.maxWidth");
}
.centerText {
  text-align: center;
  width: 100%;
  justify-content: center;
}
.xs {
  padding: 2px 8px;
  border-radius: 16px;
  height: 24px;
  gap: 6px;
}
.s {
  padding: 2px 8px;
  border-radius: 16px;
  height: 28px;
  gap: 8px;
}
.m {
  padding: 2px 12px;
  border-radius: 18px;
  height: 32px;
  gap: 10px;
}
.l {
  padding: 2px 16px;
  border-radius: 20px;
  height: 36px;
  gap: 12px;
}
.xl {
  padding: 2px 18px;
  border-radius: 22px;
  height: 40px;
  gap: 14px;
}
.tagCustom button {
  width: 14px;
  height: 14px;
  display: flex;
  justify-content: center;
  align-items: center;
  border-radius: 50%;
}
.tagCustom button:disabled {
  cursor: not-allowed;
}
.tagCustom button:disabled span {
  color: var(--neutral-text-disabled) !important;
}
.xl .u {
  font-size: 24px;
  line-height: 24px;
}
.l .u {
  font-size: 24px;
  line-height: 24px;
}
.m .u {
  font-size: 20px;
  line-height: 20px;
}
.s .u {
  font-size: 20px;
  line-height: 20px;
}
.xs .u {
  font-size: 16px;
  line-height: 16px;
}
.xl .text {
  font-size: var(--size-body-l);
  line-height: var(--line-height-body-l);
  font-weight: var(--font-weight-semi-bold);
}
.l .text {
  font-size: var(--size-body-l);
  line-height: var(--line-height-body-l);
  font-weight: var(--font-weight-semi-bold);
}
.m .text {
  font-size: var(--size-body-m);
  line-height: var(--line-height-body-m);
  font-weight: var(--font-weight-semi-bold);
}
.s .text {
  font-size: var(--size-body-m);
  line-height: var(--line-height-body-m);
  font-weight: var(--font-weight-semi-bold);
}
.xs .text {
  font-size: var(--size-body-s);
  line-height: var(--line-height-body-s);
  font-weight: var(--font-weight-semi-bold);
}
</style>
