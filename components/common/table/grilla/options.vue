<script setup>
import { computed } from "vue";
import useIncomesStore from "@/stores/incomes";
import useGrillaStore from "@/stores/grilla";
import useLinesStore from "@/stores/lines";
import usePermissionsStore from "@/stores/permissions";

// Stores
const incomesStore = useIncomesStore();
const grillaStore = useGrillaStore();
const linesStore = useLinesStore();
const permissionsStore = usePermissionsStore();

// Computed
const typeIncome = computed(() => {
  const state = incomesStore?.income?.state || "";
  return t(module + ".states." + state);
});
const addLinePemission = computed(
  () => permissionsStore?.myPermissions?.income__grid_line_add,
);

// Constants
const { t } = useI18n();
const module = "grilla.body.options";

// Functions
const addItem = (whatToCreate) => {
  if (linesStore.lines.some((l) => l.name === "")) {
    return;
  }

  const newIdInput = `input-${0}-name`;

  const config = {
    enterEvent: false,
    newIdInput,
    creatorType: "global",
    creationTarget: whatToCreate,
  };

  linesStore.addEmptyLine(config);
};
const chooseTemplate = () => {
  grillaStore.showModal = true;
  grillaStore.showModalType = "chooseTemplate";
  grillaStore.showModalPosition = "center";
};
</script>

<template>
  <div class="optionsGrilla">
    <template v-if="grillaStore.applySearch">
      <span class="noResults">{{ t(module + ".noResults") }}</span>
    </template>
    <template v-else>
      <span class="main">
        {{ t(module + ".title", { state: typeIncome }) }}
      </span>
      <div class="optionsGrilla__actions">
        <button
          v-if="incomesStore.numberLines === 0"
          :disabled="!addLinePemission || grillaStore.updating"
          @click="chooseTemplate"
        >
          <span class="u u-book"></span>
          <span class="label">{{ t(module + ".buttons.template.label") }}</span>
          <span class="text">
            {{ t(module + ".buttons.template.description") }}
          </span>
        </button>
        <button
          :disabled="!addLinePemission || grillaStore.updating"
          @click="addItem('category')"
        >
          <span class="u u-folder-add"></span>
          <span class="label">{{ t(module + ".buttons.category.label") }}</span>
          <span class="text">
            {{ t(module + ".buttons.category.description") }}
          </span>
        </button>
        <button
          :disabled="!addLinePemission || grillaStore.updating"
          @click="addItem('line')"
        >
          <span class="u u-new"></span>
          <span class="label">{{ t(module + ".buttons.line.label") }}</span>
          <span class="text">
            {{ t(module + ".buttons.line.description") }}
          </span>
        </button>
      </div>
    </template>
  </div>
</template>

<style scoped>
.optionsGrilla {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 22px;
  position: sticky;
  left: 0;
  width: 100%;
  height: calc(100% - 82px);
}

.optionsGrilla span.main {
  font-size: 18px;
  line-height: 18px;
  color: v-bind(
    "grillaStore.updating ? 'var(--neutral-text-disabled)' : 'var(--neutral-text-caption)'"
  );
  font-weight: 600;
}

.optionsGrilla__actions {
  display: flex;
  gap: 16px;
}

.optionsGrilla__actions button {
  width: 180px;
  height: 120px;
  background-color: var(--neutral-background-default);
  border-radius: 12px;
  box-shadow: var(--elevation-xs);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  position: relative;
  padding: 16px;
  overflow: hidden;
  transition: background 0.3s ease;
}

.optionsGrilla__actions button:disabled {
  cursor: not-allowed;
}

.optionsGrilla__actions button:disabled span.u,
.optionsGrilla__actions button:disabled span.label {
  color: var(--neutral-text-disabled) !important;
}

.optionsGrilla__actions button span.u {
  font-size: 36px;
  line-height: 36px;
  color: var(--neutral-text-caption);
}

.optionsGrilla__actions button span.label {
  font-size: 16px;
  line-height: 16px;
  color: var(--neutral-text-caption);
  margin-top: 10px;
}

.optionsGrilla__actions button span.u,
.optionsGrilla__actions button span.label {
  transition: all 0.4s ease;
  opacity: 1;
  transform: translateY(0);
}

.optionsGrilla__actions button span.text {
  font-size: 14px;
  line-height: 18px;
  color: var(--primary-text-default);
  font-weight: 600;
  opacity: 0;
  transform: translateY(20px);
  text-align: center;
  transition: all 0.4s ease;
  position: absolute;
  max-width: 140px;
}

/* Hover (ocultar icono + label, mostrar descripción con fade + slide) */
.optionsGrilla__actions button:not(:disabled):hover span.u,
.optionsGrilla__actions button:not(:disabled):hover span.label {
  opacity: 0;
  transform: translateY(-10px);
}

.optionsGrilla__actions button:not(:disabled):hover span.text {
  opacity: 1;
  transform: translateY(0);
}

.noResults {
  color: var(--neutral-text-caption);
  font-size: 16px;
  line-height: 16px;
}

@media only screen and (max-width: 680px) {
  .optionsGrilla__actions {
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 100%;
  }
  .optionsGrilla__actions button {
    width: calc(100% - 40px);
    height: 120px;
  }
  .optionsGrilla__actions button span.text {
    max-width: 400px;
  }
}
</style>
