<script setup>
import { computed, ref } from "vue";
import useSalesStore from "@/stores/sales";
import { useI18n } from "vue-i18n";

// TRANSLATE
const { t } = useI18n();
const module = "modules.sales";

// STORES
const salesStore = useSalesStore();

const props = defineProps({
  data: {
    type: Object,
    default: null,
  },
  idSale: {
    type: String,
    default: "",
  },
  tooltipOffsetX: {
    type: Number,
    default: 0,
  },
});

const showTooltip = ref(false);
const disableReload = ref(false);

const status = computed(() => props.data?.status || "pending");
// status de prueba para mostrar el button
// const status = computed(() => {
//   return "generated";
// });

const isReloadVisible = computed(() => {
  return status.value === "generated" || status.value === "sent";
});

const bars = computed(() => {
  const baseColor = "var(--neutral-text-disabled)";
  const green = "var(--success-text-default)";
  const red = "var(--danger-text-default)";

  switch (status.value) {
    case "generated":
      return [green, baseColor, baseColor];

    case "sent":
      return [green, green, baseColor];

    case "accepted":
      return [green, green, green];

    case "rejected":
      return [green, green, red];

    case "pending":
    default:
      return [baseColor, baseColor, baseColor];
  }
});

const tooltipText = computed(() => {
  const map = {
    generated: t(`${module}.status.sii.generated`),
    sent: t(`${module}.status.sii.sent`),
    accepted: t(`${module}.status.sii.accepted`),
    rejected: t(`${module}.status.sii.rejected`),
    pending: t(`${module}.status.sii.pending`),
  };
  return map[status.value] || t(`${module}.status.sii.pending`);
});

const reloadSii = async () => {
  try {
    disableReload.value = true;
    await salesStore.updatedStatusSII(props.idSale);
  } catch (e) {
    console.error(e);
  } finally {
    disableReload.value = false;
  }
};
</script>

<template>
  <div
    class="sii_container"
    @mouseenter="showTooltip = true"
    @mouseleave="showTooltip = false"
  >
    <div
      v-if="showTooltip"
      class="tooltip"
      :style="{ transform: `translateX(calc(-50% + ${tooltipOffsetX}px))` }"
    >
      {{ tooltipText }}
    </div>

    <div class="status">
      <div
        v-for="(color, index) in bars"
        :key="index"
        class="bar"
        :style="{ backgroundColor: color }"
      ></div>
    </div>

    <div class="actions">
      <u-loading v-if="disableReload" :width="16" />
      <span
        v-if="isReloadVisible && !disableReload"
        class="u u-change buttonChange"
        :class="{ disabled: disableReload }"
        title="Recargar"
        :disabled="disableReload"
        @click.stop="reloadSii"
      ></span>
    </div>
  </div>
</template>

<style scoped>
.sii_container {
  display: grid;
  grid-template-columns: 1fr 35px;
  position: relative;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 100%;
  gap: 10px;
}

.status {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
}

.bar {
  width: 4px;
  height: 28px;
  background-color: var(--neutral-text-disabled);
  border-radius: 100px;
}

.actions {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 100%;
}

.buttonChange {
  display: flex;
  width: 24px;
  height: 24px;
  font-size: 15px;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  border-radius: 100px;
  border: 2px solid var(--neutral-border-subtle);
  transition: background-color 0.2s ease;
}

.buttonChange:hover {
  background-color: var(--neutral-surface-harder);
}

.disabled {
  background-color: var(--neutral-surface-disabled);
  cursor: not-allowed;
  opacity: 0.5;
}

/* Tooltip */
.tooltip {
  position: absolute;
  bottom: 120%;
  left: 50%;
  transform: translateX(-50%);
  background-color: var(--neutral-surface-light);
  color: var(--neutral-text-body);
  padding: 6px 10px;
  font-size: 12px;
  border-radius: 6px;
  white-space: nowrap;
  z-index: 10;
  opacity: 0;
  animation: fadeIn 0.15s ease forwards;
}

.tooltip::after {
  content: "";
  position: absolute;
  top: 100%;
  left: 50%;
  transform: translateX(-50%);
  border-width: 6px;
  border-style: solid;
  border-color: var(--neutral-surface-subtle) transparent transparent
    transparent;
}

@keyframes fadeIn {
  to {
    opacity: 1;
  }
}
</style>
