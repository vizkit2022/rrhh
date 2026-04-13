<script setup>
import { defineProps, ref, defineEmits, computed, onMounted } from "vue";
import { useI18n } from "vue-i18n";

// Props
const props = defineProps({
  modelValue: {
    type: [String, Number],
    required: true,
  },
  config: {
    type: Object,
    default: () => ({
      defaultTab: "overview",
      size: "m",
      options: [],
    }),
  },
  disabled: {
    type: Boolean,
    default: false,
  },
});

// Emits
const emit = defineEmits(["update:modelValue"]);

// Computed
const computeStyles = computed(() => {
  switch (props.config.size) {
    case "s":
      return {
        height: "32px",
        heightBtn: "24px",
        fontSize: "14px",
      };
    case "m":
      return {
        height: "40px",
        heightBtn: "32px",
        fontSize: "16px",
      };
    case "l":
      return {
        height: "48px",
        heightBtn: "40px",
        fontSize: "16px",
      };
    default:
      return {
        height: "64px",
        heightBtn: "48px",
        fontSize: "16px",
      };
  }
});

// Constants
const { t } = useI18n();

// Variables
const expand = ref(false);
const optionsRef = ref(null);
const widthOption = ref(0);
const smartTabRef = ref(null);

// Funcionts
const handleClickOutside = (event) => {
  if (smartTabRef.value && !smartTabRef.value.contains(event.target)) {
    expand.value = false;
  }
};

const selectedOption = (option) => {
  emit("update:modelValue", option.value);

  let selected = null;
  const rest = [];

  props.config.options.forEach((op) => {
    if (op.value === option.value) {
      op.selected = true;
      selected = op;
    } else {
      op.selected = false;
      rest.push(op);
    }
  });

  // ordenar los restantes por order ascendente
  rest.sort((a, b) => a.order - b.order);

  expand.value = false;

  props.config.options.splice(
    0,
    props.config.options.length,
    selected,
    ...rest
  );
};


// Mounted
onMounted(() => {
  // Set default tab on mount
  if (props.config.defaultTab) {
    emit("update:modelValue", props.config.defaultTab);
  }

  if (props.config.defaultTab) {
    const option = props.config.options.find(
      (op) => op.value === props.config.defaultTab,
    );
    selectedOption(option);
  }

  requestAnimationFrame(() => {
    const contentWidth = optionsRef.value.offsetWidth;
    widthOption.value = contentWidth / 3 - 16 + "px";
  });

  document.addEventListener("click", handleClickOutside);
});

onBeforeUnmount(() => {
  document.removeEventListener("click", handleClickOutside);
});
</script>

<template>
  <div class="smartTabs" ref="smartTabRef">
    <div class="smartTabs__container" :class="{ expanded: expand }">
      <div class="smartTabs__container-options" ref="optionsRef">
        <button
          v-for="op in props.config.options"
          :key="op.value"
          :class="['option', { default: op.selected }]"
          @click="selectedOption(op)"
        >
          <span class="truncateText">{{ t(op.label) }}</span>
        </button>
      </div>

      <button
        :disabled="props.disabled || props.config.options.length <= 3"
        class="expand"
        :class="{ expanded: expand }"
        @click="expand = !expand"
      >
        <span class="u u-chevron-up"></span>
      </button>
    </div>
  </div>
</template>

<style scoped>
.smartTabs {
  position: relative;
  width: 100%;
  height: v-bind("computeStyles.height");
}

/* CONTAINER */
.smartTabs__container {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  background-color: var(--secondary-surface-softer);
  display: grid;
  grid-template-columns: 1fr 24px;
  column-gap: 4px;
  border-radius: 8px;
  overflow: hidden;

  max-height: v-bind("computeStyles.height");
  transition:
    max-height 0.35s ease,
    box-shadow 0.25s ease;
}

.smartTabs__container.expanded {
  max-height: 400px;
  box-shadow: var(--elevation-s);
}

/* OPTIONS GRID */
.smartTabs__container-options {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  column-gap: 8px;
  row-gap: 12px;
  padding: 4px;
}

/* OPTION BUTTON */
.smartTabs__container-options .option {
  height: v-bind("computeStyles.heightBtn");
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 4px;
  border-radius: 5px;
  cursor: pointer;
}

/* OPTION STATES */
.smartTabs__container-options .option.default {
  background-color: var(--secondary-surface-light);
}

.smartTabs__container-options .option span {
  font-size: v-bind("computeStyles.fontSize");
  line-height: v-bind("computeStyles.fontSize");
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  width: v-bind("widthOption || '100px'");
  color: var(--neutral-text-caption);
  transition: color 0.25s ease;
}

.smartTabs__container-options .option.default span,
.smartTabs__container-options .option:hover span {
  color: var(--neutral-text-body);
}

/* EXPAND BUTTON */
button.expand {
  height: v-bind("computeStyles.height");
  font-size: 16px;
  color: var(--secondary-text-default);
  background: transparent;
  transition: color 0.25s ease;
}

button.expand:hover,
button.expand.expanded {
  color: var(--secondary-text-darker);
}

button.expand span {
  display: inline-block;
  transition: transform 0.3s ease;
}

button.expand.expanded span {
  transform: rotate(180deg);
}

/* ACCESSIBILITY */
button.option:focus-visible {
  outline: 2px solid var(--secondary-text-darker);
  outline-offset: 2px;
}
</style>
