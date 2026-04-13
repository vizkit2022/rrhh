<script setup>
import { computed } from "vue";
import useGlobalStore from "@/stores/global";
import { useI18n } from "vue-i18n";

// TRANSLATION
const { t } = useI18n();
const module = "common.exchangeRateViewer";

const props = defineProps({
  currencies: {
    type: Array,
    default: () => [],
  },
  modelValue: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(["update:modelValue"]);

const globalStore = useGlobalStore();

const lang = computed(() => globalStore.lang);

const toggleMenu = () => {
  emit("update:modelValue", !props.modelValue);
};

const handleEscape = (event) => {
  if (event.key === "Escape") {
    emit("update:modelValue", false);
  }
};

const handleClickOutside = (event) => {
  const dropdown = document.querySelector(".exchangeRate");
  const btn = document.querySelector(".buttonRTX");
  if (
    dropdown &&
    btn &&
    !dropdown.contains(event.target) &&
    !btn.contains(event.target)
  ) {
    emit("update:modelValue", false);
  }
};

onMounted(() => {
  document.addEventListener("keydown", handleEscape);
  document.addEventListener("click", handleClickOutside);
});

onUnmounted(() => {
  document.removeEventListener("keydown", handleEscape);
  document.removeEventListener("click", handleClickOutside);
});
</script>

<template>
  <div class="exchangeRate-wrapper">
    <u-button
      type="outlined"
      size="s"
      :text="t(`${module}.title`)"
      class="buttonRTX"
      @click="toggleMenu"
      color="--secondary-text-default"
      colorHover="--secondary-text-darker"
      colorActive="--secondary-text-darker"
    />

    <div class="exchangeRate" :class="{ open: modelValue }">
      <div class="exhangeRate__list">
        <div
          v-for="currency in currencies"
          :key="currency._id"
          class="exchangeRate__op truncateText"
        >
          <div class="tag">
            <span>{{ currency.code || currency.currency.code || "-" }}</span>
          </div>

          <span
            class="label truncateText"
            :title="currency?.name?.[lang] || currency?.currency?.name?.[lang]"
          >
            {{
              currency?.name?.[lang] || currency?.currency?.name?.[lang] || "-"
            }}
          </span>

          <span class="label truncateText">
            {{ currency?.valueManual || "-" }}
          </span>
        </div>

        <span v-if="currencies.length === 0" class="noData">
          {{ t(`${module}.noData`) }}
        </span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.exchangeRate-wrapper {
  position: relative;
}

.exchangeRate {
  width: 320px;
  position: absolute;
  top: 36px;
  left: 0;
  background-color: var(--neutral-background-default);
  border-radius: 12px;
  box-shadow: var(--elevation-l);
  padding: 16px;
  transform-origin: top left;
  transform: scale(0);
  transition: transform 0.3s ease;
  z-index: 100;
}

.exchangeRate.open {
  transform: scale(1);
}

.exhangeRate__list {
  display: grid;
  row-gap: 12px;
  overflow: auto;
  max-height: 170px;
  padding-right: 4px;
}

.exhangeRate__list::-webkit-scrollbar {
  width: 8px;
}

.exhangeRate__list::-webkit-scrollbar-thumb {
  background-color: var(--neutral-border-subtle);
  border-radius: 5px;
}

.exhangeRate__list::-webkit-scrollbar-track {
  background-color: var(--neutral-border-darker);
  border-radius: 5px;
}

.exchangeRate__op {
  display: grid;
  grid-template-columns: auto 1fr 100px;
  gap: 12px;
  align-items: center;
}

.exchangeRate__op div.tag {
  height: 24px;
  border: 1px solid var(--secondary-border-subtle);
  border-radius: 8px;
  background-color: var(--secondary-surface-softer);
  display: flex;
  align-items: center;
  padding: 0 6px;
}

.exchangeRate__op div.tag span {
  font-weight: 600;
  font-size: 13px;
  color: var(--secondary-text-darker);
}

.exchangeRate__op span.label {
  font-weight: 600;
  font-size: 12px;
  color: var(--neutral-text-body);
}

.exchangeRate__op span:nth-child(3) {
  display: flex;
  justify-content: flex-end;
}

.noData {
  color: var(--neutral-text-caption);
  height: 40px;
  font-size: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
