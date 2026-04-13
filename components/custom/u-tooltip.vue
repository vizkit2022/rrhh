<script setup>
import { ref, onMounted, onBeforeUnmount, computed } from "vue";

const props = defineProps({
  orientation: {
    type: String,
    default: "top", // top, bottom, left, right
  },
  text: {
    type: String,
    required: true,
  },
  widthTooltip: {
    type: String,
    default: "auto",
  },
  backgroundColor: {
    type: String,
    default: "#000", // Default background color
  },
  customTextClass: {
    type: String,
    default: "", // clase extra opcional al texto del tooltip
  },
  teleport: {
    type: Boolean,
    default: false, // si es true, usa <teleport>
  },
});

const isHovered = ref(false);
const targetEl = ref(null);
const tooltipEl = ref(null);
const coords = ref({ top: 0, left: 0 });

//computed
const tooltipStyle = computed(() => {
  const width = props.widthTooltip ? props.widthTooltip : "auto";
  return width;
})

function showTooltip() {
  isHovered.value = true;
  if (props.teleport) {
    requestAnimationFrame(updatePosition);
  }
}

function hideTooltip() {
  isHovered.value = false;
}

function updatePosition() {
  if (!targetEl.value || !tooltipEl.value) return;
  const rect = targetEl.value.getBoundingClientRect();
  const tooltipRect = tooltipEl.value.getBoundingClientRect();

  let top = 0;
  let left = 0;

  switch (props.orientation) {
    case "top":
      top = rect.top - tooltipRect.height - 8;
      left = rect.left + rect.width / 2 - tooltipRect.width / 2;
      break;
    case "bottom":
      top = rect.bottom + 8;
      left = rect.left + rect.width / 2 - tooltipRect.width / 2;
      break;
    case "left":
      top = rect.top + rect.height / 2 - tooltipRect.height / 2;
      left = rect.left - tooltipRect.width - 8;
      break;
    case "right":
      top = rect.top + rect.height / 2 - tooltipRect.height / 2;
      left = rect.right + 8;
      break;
  }

  coords.value = { top, left };
}

onMounted(() => {
  if (props.teleport) {
    window.addEventListener("scroll", updatePosition, true);
    window.addEventListener("resize", updatePosition);
  }
});

onBeforeUnmount(() => {
  if (props.teleport) {
    window.removeEventListener("scroll", updatePosition, true);
    window.removeEventListener("resize", updatePosition);
  }
});
</script>

<template>
  <div
    class="tooltip-container"
    ref="targetEl"
    @mouseenter="showTooltip"
    @mouseleave="hideTooltip"
  >
    <!-- SIN TELEPORT -->
    <div
      v-if="isHovered && !teleport"
      :class="['tooltip', orientation]"
      :style="{ backgroundColor: backgroundColor }"
    >
      {{ text }}
    </div>

    <!-- CON TELEPORT -->
    <teleport to="body" v-if="isHovered && teleport">
      <div
        ref="tooltipEl"
        :class="['tooltip', 'teleport', orientation]"
        :style="{
          top: coords.top + 'px',
          left: coords.left + 'px',
          backgroundColor: backgroundColor
        }"
      >
      <span :class="customTextClass">{{ text }}</span>
      </div>
    </teleport>

    <slot></slot>
  </div>
</template>

<style scoped>
.tooltip-container {
  position: relative;
  display: inline-flex;
  pointer-events: none;
}

.tooltip-container > * {
  pointer-events: auto;
}

.tooltip {
  position: absolute;
  padding: 8px;
  color: var(--neutral-text-body);
  background-color: v-bind("backgroundColor");
  border-radius: 4px;
  width: v-bind("tooltipStyle");
  text-align: justify;
  z-index: 1000;
  pointer-events: none;
}

/* Triángulos para cada orientación */
.tooltip::after {
  content: '';
  position: absolute;
  width: 0;
  height: 0;
  border: 6px solid transparent;
}

/* Triángulo apuntando hacia abajo (tooltip en TOP) */
.tooltip.top::after {
  top: 100%;
  left: 50%;
  transform: translateX(-50%);
  border-top-color: v-bind("backgroundColor");
  border-bottom: none;
}

/* Triángulo apuntando hacia arriba (tooltip en BOTTOM) */
.tooltip.bottom::after {
  bottom: 100%;
  left: 50%;
  transform: translateX(-50%);
  border-bottom-color: v-bind("backgroundColor");
  border-top: none;
}

/* Triángulo apuntando hacia la derecha (tooltip en LEFT) */
.tooltip.left::after {
  left: 100%;
  top: 50%;
  transform: translateY(-50%);
  border-left-color: v-bind("backgroundColor");
  border-right: none;
}

/* Triángulo apuntando hacia la izquierda (tooltip en RIGHT) */
.tooltip.right::after {
  right: 100%;
  top: 50%;
  transform: translateY(-50%);
  border-right-color: v-bind("backgroundColor");
  border-left: none;
}

/* Posicionamiento del tooltip sin teleport */
.tooltip.top:not(.teleport) {
  top: 0;
  left: 50%;
  transform: translate(-50%, -100%);
  margin-top: -8px;
}

.tooltip.bottom:not(.teleport) {
  bottom: 0;
  left: 50%;
  transform: translate(-50%, 100%);
  margin-bottom: -8px;
}

.tooltip.left:not(.teleport) {
  left: 0;
  top: 50%;
  transform: translate(-100%, -50%);
  margin-left: -8px;
}

.tooltip.right:not(.teleport) {
  right: 0;
  top: 50%;
  transform: translate(100%, -50%);
  margin-right: -8px;
}

/* Para tooltips con teleport, no aplicar transforms adicionales */
.tooltip.teleport {
  position: fixed;
}
</style>