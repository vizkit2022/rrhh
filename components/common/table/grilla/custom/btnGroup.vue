
<script setup>
import { computed, ref } from "vue";
import { useI18n } from "vue-i18n";
import useGrillaStore from "@/stores/grilla";
import useIncomesStore from "@/stores/incomes";
import useLinesStore from "@/stores/lines";

// Store
const grillaStore = useGrillaStore();
const incomesStore = useIncomesStore();
const linesStore = useLinesStore();

// Constants
const { t } = useI18n();
const module = "grilla.headers";
const isHovered = ref(false);

// Computed
const onlyLevel1Disabled = computed(() => {
  if (incomesStore.hollywood) return true;

  const isUpdating = grillaStore.updating;
  const isLoading = grillaStore.loading;
  const hasParent = linesStore.lines.some(l => l.isParent);

  return isUpdating || isLoading || !hasParent;
});


// Function
const showOnlyLinesLevel1 = () => {
  grillaStore.onlyLevel1 = !grillaStore.onlyLevel1;
  grillaStore.onlyLevel2 = false;
  grillaStore.onlyLevel3 = false;
  linesStore.lines = linesStore.lines.map((line) => {
    return {
      ...line,
      isVisible: grillaStore.onlyLevel1 ? line.parents.length === 0 : true,
      expand: !grillaStore.onlyLevel1,
    };
  });

  grillaStore.refreshHTML++;

  if (grillaStore.onlyLevel1) {
    const listLines = document.querySelector(".table");
    listLines.scrollTop = 0;
  }
};

const showOnlyLinesLevel2 = () => {
  grillaStore.onlyLevel2 = !grillaStore.onlyLevel2;
  grillaStore.onlyLevel1 = false;
  grillaStore.onlyLevel3 = false;
  linesStore.lines = linesStore.lines.map((line) => {
    return {
      ...line,
      isVisible: grillaStore.onlyLevel2 ? [0,1].includes(line.parents.length) : true,
      expand: !grillaStore.onlyLevel2,
    };
  });

  grillaStore.refreshHTML++;

  if (grillaStore.onlyLevel2) {
    const listLines = document.querySelector(".table");
    listLines.scrollTop = 0;
  }
};

const showOnlyLinesLevel3 = () => {
  grillaStore.onlyLevel3 = !grillaStore.onlyLevel3;
  grillaStore.onlyLevel1 = false;
  grillaStore.onlyLevel2 = false;
  linesStore.lines = linesStore.lines.map((line) => {
    return {
      ...line,
      isVisible: grillaStore.onlyLevel3 ? [0,1,2].includes(line.parents.length) : true,
      expand: !grillaStore.onlyLevel3,
    };
  });

  grillaStore.refreshHTML++;

  if (grillaStore.onlyLevel3) {
    const listLines = document.querySelector(".table");
    listLines.scrollTop = 0;
  }
};

</script>

<template>
  <div class="expandable-container">
    <div
      class="buttons-wrapper"
      @mouseenter="isHovered = true"
      @mouseleave="isHovered = false"
    >
      <div class="secondary-buttons">
        <button
          :class="['btnGroup', 'toggle-btn', { visible: isHovered, selected: grillaStore.onlyLevel3 }]"
          @click="showOnlyLinesLevel3"
          style="transition-delay: 0.05s"
          :title="t(module + '.lines.tooltips.' + (grillaStore.onlyLevel3 ? 'decompress3' : 'compress3'))">
            <span class="u u-folder-3"></span>  
        </button>

        <button
          :class="['btnGroup', 'toggle-btn', { visible: isHovered, selected: grillaStore.onlyLevel2 }]"
          @click="showOnlyLinesLevel2"
          style="transition-delay: 0s"
          :title="t(module + '.lines.tooltips.' + (grillaStore.onlyLevel2 ? 'decompress2' : 'compress2'))">
            <span class="u u-folder-2"></span>  
        </button>
      </div>

      <button
        :disabled="onlyLevel1Disabled"
        :class="`main-btnGroup toggle-btn ${grillaStore.onlyLevel1 ? 'selected' : ''}`" 
        @click="showOnlyLinesLevel1"
        :title="t(module + '.lines.tooltips.' + (grillaStore.onlyLevel1 ? 'decompress1' : 'compress1'))">
          <span class="u u-folder-1"></span>  
      </button>
    </div>
  </div>
</template>

<style scoped>
.buttons-wrapper {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  position: relative;
}

.secondary-buttons {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-right: 12px;
}

.btnGroup {
  transform: translateX(20px) scale(0.8);
  opacity: 0;
  pointer-events: none;
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.btnGroup.visible {
  opacity: 1;
  transform: translateX(0) scale(1);
  pointer-events: auto;
}

/* Botón principal */
.main-btnGroup {
  cursor: pointer;
  transition: transform 0.3s;
  z-index: 10;
}

button.toggle-btn {
  width: 26px;
  height: 26px;
  display: flex;
  justify-content: center;
  align-items: center;
  border: 1px solid var(--neutral-border-default);
  border-radius: 8px;
  background-color: var(--neutral-background-default);
  transition: 0.3s;
}
button.toggle-btn span {
  color: var(--neutral-text-caption);
  font-size: 18px;
  line-height: 18px;
  transition: 0.3s;
}
button.toggle-btn:not(:disabled):hover {
  border: 1px solid var(--primary-border-subtle);
}
button.toggle-btn:not(:disabled):hover span {
  color: var(--primary-text-subtle);
}
button.toggle-btn.selected {
  border: 1px solid var(--primary-border-subtle);
  background-color: var(--primary-surface-softer);
}
button.toggle-btn.selected span {
  color: var(--primary-text-subtle);
}
button.toggle-btn:disabled {
  border: 1px solid var(--neutral-border-disabled);
  cursor: not-allowed;
}
button.toggle-btn:disabled span {
  color: var(--neutral-text-disabled);
}
</style>
