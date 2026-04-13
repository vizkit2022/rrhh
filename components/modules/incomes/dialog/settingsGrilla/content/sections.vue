<script setup>
import { ref } from "vue";
import useGrillaStore from "@/stores/grilla";

// STORES
const grillaStore = useGrillaStore();

// Constants
const { t } = useI18n();
const uiLabel = "grilla.dialogs.settings";
const color = "--neutral-text-caption";
const templateDef = grillaStore.template;
const labels = {
  incomes: {
    name: t(uiLabel + ".incomes.name"),
    icon: "invoice",
    subcolumns: {
      amount1: {
        name: t(uiLabel + ".incomes.subcolumns.amount1.name"),
        text: t(uiLabel + ".incomes.subcolumns.amount1.text"),
      },
      amount2: {
        name: t(uiLabel + ".incomes.subcolumns.amount2.name"),
        text: t(uiLabel + ".incomes.subcolumns.amount2.text"),
      },
      amount3: {
        name: t(uiLabel + ".incomes.subcolumns.amount3.name"),
        text: t(uiLabel + ".incomes.subcolumns.amount3.text"),
      },
      unit: {
        name: t(uiLabel + ".incomes.subcolumns.unit.name"),
      },
      base: {
        name: t(uiLabel + ".incomes.subcolumns.base.name"),
      },
      rate: {
        name: t(uiLabel + ".incomes.subcolumns.rate.name"),
      },
      overTime1: {
        name: t(uiLabel + ".incomes.subcolumns.overTime1.name"),
      },
      overTime2: {
        name: t(uiLabel + ".incomes.subcolumns.overTime2.name"),
      },
      overTime3: {
        name: t(uiLabel + ".incomes.subcolumns.overTime3.name"),
      },
      price: {
        name: t(uiLabel + ".incomes.subcolumns.price.name"),
      },
      sumPrice: {
        name: t(uiLabel + ".incomes.subcolumns.sumPrice.name"),
      },
    },
  },
  budget: {
    name: t(uiLabel + ".budget.name"),
    icon: "calculator",
    subcolumns: {
      budgetAmount1: {
        name: t(uiLabel + ".budget.subcolumns.budgetAmount1.name"),
        text: t(uiLabel + ".budget.subcolumns.budgetAmount1.text"),
      },
      budgetAmount2: {
        name: t(uiLabel + ".budget.subcolumns.budgetAmount2.name"),
        text: t(uiLabel + ".budget.subcolumns.budgetAmount2.text"),
      },
      budgetAmount3: {
        name: t(uiLabel + ".budget.subcolumns.budgetAmount3.name"),
        text: t(uiLabel + ".budget.subcolumns.budgetAmount3.text"),
      },
      unitBudget: {
        name: t(uiLabel + ".budget.subcolumns.unitBudget.name"),
      },
      budget: {
        name: t(uiLabel + ".budget.subcolumns.budget.name"),
      },
      sumBudget: {
        name: t(uiLabel + ".budget.subcolumns.sumBudget.name"),
      },
    },
  },
  outcomes: {
    name: t(uiLabel + ".outcomes.name"),
    icon: "shopping-cart",
    subcolumns: {
      cost: {
        name: t(uiLabel + ".outcomes.subcolumns.cost.name"),
      },
      toSpend: {
        name: t(uiLabel + ".outcomes.subcolumns.toSpend.name"),
      },
      efc: {
        name: `${t(uiLabel + ".outcomes.subcolumns.efc.name")} (${t(
          uiLabel + ".outcomes.subcolumns.efc.text"
        )})`,
        text: t(uiLabel + ".outcomes.subcolumns.efc.text"),
      },
    },
  },
  projected: {
    name: t(uiLabel + ".projected.name"),
    icon: "trend-up",
    subcolumns: {
      projectedMargin: {
        name: t(uiLabel + ".projected.subcolumns.projectedMargin.name"),
      },
      projectedUtility: {
        name: t(uiLabel + ".projected.subcolumns.projectedUtility.name"),
      },
      varianceMount: {
        name: t(uiLabel + ".projected.subcolumns.varianceMount.name"),
        text: t(uiLabel + ".projected.subcolumns.varianceMount.text"),
      },
      variancePerc: {
        name: t(uiLabel + ".projected.subcolumns.variancePerc.name"),
        text: t(uiLabel + ".projected.subcolumns.variancePerc.text"),
      },
    },
  },
};

const draggingIndex = ref(null);
const dragOverIndex = ref(null);

const handleDragStart = function (index) {
  draggingIndex.value = index;
};

const handleDragEnd = function () {
  draggingIndex.value = null;
  dragOverIndex.value = null;
};

const handleDragOver = function (e, index) {
  e.preventDefault();
  dragOverIndex.value = index;
};

const handleDrop = function (e, dropIndex) {
  e.preventDefault();

  if (draggingIndex.value === null || draggingIndex.value === dropIndex) {
    dragOverIndex.value = null;
    return;
  }

  // Contar columnas ocultas (available: false)
  const hiddenCount = grillaStore.configTemp.columns.filter(c => !c.available).length;

  // Trabajar solo con columnas visibles
  const visibleColumns = grillaStore.configTemp.columns.filter(c => c.available);
  const newCards = visibleColumns.slice();
  const draggedCard = newCards[draggingIndex.value];

  newCards.splice(draggingIndex.value, 1);
  newCards.splice(dropIndex, 0, draggedCard);

  // Actualizar orders empezando después de las ocultas
  newCards.forEach(function (col, i) {
    col.order = hiddenCount + i;
  });

  // Reconstruir el array completo: ocultas primero, luego visibles reordenadas
  const hiddenColumns = grillaStore.configTemp.columns.filter(c => !c.available);
  grillaStore.configTemp.columns = [...hiddenColumns, ...newCards];
  
  dragOverIndex.value = null;
};

const moveUp = function (index) {
  if (index === 0) return;

  // Contar columnas ocultas
  const hiddenCount = grillaStore.configTemp.columns.filter(c => !c.available).length;

  // Trabajar solo con columnas visibles
  const visibleColumns = grillaStore.configTemp.columns.filter(c => c.available);
  const newCards = visibleColumns.slice();
  
  const temp = newCards[index];
  newCards[index] = newCards[index - 1];
  newCards[index - 1] = temp;

  // Actualizar orders empezando después de las ocultas
  newCards.forEach(function (col, i) {
    col.order = hiddenCount + i;
  });

  // Reconstruir el array completo
  const hiddenColumns = grillaStore.configTemp.columns.filter(c => !c.available);
  grillaStore.configTemp.columns = [...hiddenColumns, ...newCards];
};

const moveDown = function (index) {
  const visibleColumns = grillaStore.configTemp.columns.filter(c => c.available);
  if (index === visibleColumns.length - 1) return;

  // Contar columnas ocultas
  const hiddenCount = grillaStore.configTemp.columns.filter(c => !c.available).length;

  // Trabajar solo con columnas visibles
  const newCards = visibleColumns.slice();
  
  const temp = newCards[index];
  newCards[index] = newCards[index + 1];
  newCards[index + 1] = temp;

  // Actualizar orders empezando después de las ocultas
  newCards.forEach(function (card, i) {
    card.order = hiddenCount + i;
  });

  // Reconstruir el array completo
  const hiddenColumns = grillaStore.configTemp.columns.filter(c => !c.available);
  grillaStore.configTemp.columns = [...hiddenColumns, ...newCards];
};

// Optiones
const buildSectionOptions = (key) => {
  const column = grillaStore?.configTemp?.columns?.find(
    (col) => col.prop === key
  );
  const subcolumns = column?.subcolumns.filter(s => s.show) || [];

  const defaultProp = subcolumns.find((op) => op.default)?.prop;

  const getLabel = (prop) => labels?.[key]?.subcolumns?.[prop]?.name || "-";

  // Aplica filtro condicional solo para "incomes"
  const filtered =
    key === "incomes"
      ? subcolumns.filter((sub) =>
          [templateDef, "multiple"].includes(sub.template)
        )
      : subcolumns;

  const options = filtered.map((sub) => ({
    oldData: sub,
    label: getLabel(sub.prop),
  }));

  return {
    valueName: defaultProp ? getLabel(defaultProp) : "-",
    options,
  };
};

const options = ref({
  incomes: buildSectionOptions("incomes"),
  budget: buildSectionOptions("budget"),
  outcomes: buildSectionOptions("outcomes"),
  projected: buildSectionOptions("projected"),
});

const changeDefaultCol = (op, col) => {
  const pos = grillaStore.configTemp.columns.findIndex(
    (c) => c.prop === col.prop
  );
  grillaStore.configTemp.columns[pos].subcolumns.forEach((subcol) => {
    subcol.default = subcol.prop === op.oldData.prop;
  });
};
</script>

<template>
  <div
    class="card"
    v-for="(col, c) in grillaStore?.configTemp?.columns?.filter(c => c.available)"
    :key="col.prop"
    :class="`${draggingIndex === c ? 'is-dragging' : ''} ${
      dragOverIndex === c ? 'drag-over' : ''
    } ${col.prop}`"
    :draggable="true"
    @dragstart="handleDragStart(c)"
    @dragend="handleDragEnd"
    @dragover="handleDragOver($event, c)"
    @drop="handleDrop($event, c)"
  >
    <div class="card_dragAndDrop">
      <span class="u u-dragndrop"></span>
    </div>

    <div class="card_body" :class="{ hidden: draggingIndex === c }">
      <div class="card_body-title">
        <span :class="`u u-${labels[col.prop].icon} icon`"></span>
        <span class="name">{{ labels[col.prop].name }}</span>
        <div :class="`tag ${col.show ? 'show' : ''}`">
          <span class="u u-show"></span>
          <span>{{ t(uiLabel + (col.show ? ".show" : ".noShow")) }}</span>
        </div>
      </div>
      <span class="text">{{ t(uiLabel + ".sections.text1") }}</span>
      <u-select
        v-model="options[col.prop].valueName"
        size="s"
        :top="[2, 3].includes(c)"
        :options="options?.[col.prop]?.options || []"
        :full-data="true"
        @fullData="(data) => changeDefaultCol(data, col)"
        :capitalize="false"
      />
    </div>

    <div :class="{ hidden: draggingIndex === c }"></div>

    <div class="card_actions" :class="{ hidden: draggingIndex === c }">
      <u-button-icon
        icon="chevron-up"
        type="outlined"
        :color="color"
        size="xs"
        :disabled="c === 0"
        @click="moveUp(c)"
      />
      <u-button-icon
        icon="chevron-down"
        type="outlined"
        :color="color"
        size="xs"
        :disabled="c === grillaStore?.configTemp?.columns.filter(c => c.available).length - 1"
        @click="moveDown(c)"
      />
    </div>

    <div class="card_move" :class="{ visible: draggingIndex === c }">
      <span
        >{{ t(uiLabel + ".sections.text2") }} {{ labels[col.prop].name }}</span
      >
    </div>
  </div>
</template>

<style scoped>
.card {
  padding: 8px 16px;
  border: 1px solid var(--neutral-border-subtle);
  border-radius: 16px;
  display: grid;
  grid-template-columns: 60px 360px 1fr auto;
  column-gap: 12px;
  background-color: var(--neutral-background-default);
  position: relative;
  transition: opacity 0.2s;
  cursor: move;
}

.card.is-dragging {
  opacity: 0.5;
}

.card.drag-over {
  border-color: var(--primary-border-subtle);
}

.card_dragAndDrop {
  height: 90px;
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: grab;
  background: none;
  border: none;
  padding: 0;
}

.card_dragAndDrop:active {
  cursor: grabbing;
}

.card_dragAndDrop span {
  font-size: 28px;
  line-height: 28px;
  color: var(--neutral-text-caption);
  transition: 0.3s;
}

.card_dragAndDrop:hover span {
  color: var(--primary-text-subtle);
}

.card_body {
  height: 90px;
  transition: opacity 0.2s;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 4px 0;
}

.card_body-title {
  display: grid;
  grid-template-columns: 24px 1fr auto;
  gap: 8px;
  align-items: center;
}

.card_body-title span.icon {
  font-size: 24px;
  line-height: 24px;
}
.card.incomes .card_body-title span.icon {
  color: var(--warning-text-subtle);
}
.card.budget .card_body-title span.icon {
  color: var(--info-text-subtle);
}
.card.outcomes .card_body-title span.icon {
  color: var(--danger-text-subtle);
}
.card.projected .card_body-title span.icon {
  color: var(--success-text-subtle);
}

.card_body-title span.name {
  font-weight: 600;
  font-size: 14px;
  line-height: 18px;
  letter-spacing: 0%;
  vertical-align: middle;
  color: var(--neutral-text-body);
}

.card_body-title div.tag {
  height: 24px;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 0 16px;
  border-radius: 16px;
  font-size: 12px;
  font-weight: 600;
  background-color: var(--neutral-surface-light);
  color: var(--neutral-text-caption);
}
.card_body-title div.tag span:nth-child(1) {
  font-size: 16px;
}
.card_body-title div.tag.show {
  background-color: var(--info-surface-light);
  color: var(--info-text-darker);
}
.card_body .text {
  font-size: 12px;
  line-height: 16px;
  letter-spacing: 0%;
  vertical-align: middle;
  color: var(--neutral-text-caption);
}

.card_body.hidden {
  opacity: 0;
  pointer-events: none;
}

.card_actions {
  height: 90px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 6px 0;
  transition: opacity 0.2s;
}

.card_actions.hidden {
  opacity: 0;
  pointer-events: none;
}

.card_move {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: var(--neutral-background-default);
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
  transition: opacity 0.2s;
  z-index: 1;
  opacity: 0;
}
.card_move span {
  font-weight: 600;
  color: var(--primary-text-subtle);
  font-size: 20px;
}

.card_move.visible {
  opacity: 1;
  pointer-events: all;
}
</style>
