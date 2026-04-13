<script setup>
import { ref, defineEmits, defineProps, watch, computed } from "vue";
import useIncomeStore from "@/stores/incomes";
const incomesStore = useIncomeStore();

const emit = defineEmits(["closeModal", "updatedConfigTable"]);

const props = defineProps({
  headers: {
    type: Object,
    default: () => { },
  },
});

const sizeRow = ref(0);
const columnCode = ref(true);
const columnName = ref(0);

const sizeRows = [
  {
    label: "Small",
    color: "--primary-text-default",
    background: "--primary-surface-shadow-12a",
  },
  {
    label: "Medium",
    color: "--primary-text-default",
    background: "--primary-surface-shadow-12a",
  },
  {
    label: "Large",
    color: "--primary-text-default",
    background: "--primary-surface-shadow-12a",
  },
  {
    label: "ExtraLarge",
    color: "--primary-text-default",
    background: "--primary-surface-shadow-12a",
  },
];
const sizeColumnName = [
  {
    label: "Small",
    color: "--primary-text-default",
    background: "--primary-surface-shadow-12a",
  },
  {
    label: "Medium",
    color: "--primary-text-default",
    background: "--primary-surface-shadow-12a",
  },
];

const stateTooltip = ref([false, false, false, false]);

const config = ref([]);

onMounted(() => {
  const GRILLA_VERSION = "1.0";
  const storedVersion = localStorage.getItem("grillaVersion");
  const gridTableSettings = JSON.parse(localStorage.getItem("gridTableSettings"));

  if (storedVersion === GRILLA_VERSION && gridTableSettings !== null) {
    sizeRow.value = gridTableSettings.rowHeight;
    columnName.value = gridTableSettings.columnNameWidth;
    columnCode.value = gridTableSettings.columnCode;
    config.value = gridTableSettings.config;
  } else {
    const headers = filtered(props.headers);
    config.value = transformArray(headers);
    localStorage.setItem("grillaVersion", "1.0");
  }
});

const filtered = (arr) => {
  return arr
    .map(h => {
      const validSubHeaders = h.headers.filter(
        sub => sub.type === incomesStore.typeTemplate && sub.isWritable
      );
      return validSubHeaders.length > 0 ? { ...h, headers: validSubHeaders } : null;
    })
    .filter(Boolean);
};

watch(ref(sizeRow), (s) => {
  localStorage.setItem(
    "gridTableSettings",
    JSON.stringify({
      rowHeight: s,
      config: [...config.value],
      columnCode: columnCode.value,
      columnNameWidth: columnName.value,
    })
  );
  emit(
    "updatedConfigTable",
    s,
    config.value,
    columnCode.value,
    columnName.value
  );
});

watch(ref(columnName), (n) => {
  localStorage.setItem(
    "gridTableSettings",
    JSON.stringify({
      rowHeight: sizeRow.value,
      config: [...config.value],
      columnCode: n,
      columnNameWidth: columnName.value,
    })
  );
  emit(
    "updatedConfigTable",
    sizeRow.value,
    config.value,
    columnCode.value,
    n
  );
});

watch(ref(columnCode), (c) => {
  localStorage.setItem(
    "gridTableSettings",
    JSON.stringify({
      columnCode: c,
      rowHeight: sizeRow.value,
      columnNameWidth: columnName.value,
      config: [...config.value],
    })
  );
  emit(
    "updatedConfigTable",
    sizeRow.value,
    config.value,
    c,
    columnName.value
  );
});

watch(
  ref(config),
  () => {
    localStorage.setItem(
      "gridTableSettings",
      JSON.stringify({
        rowHeight: sizeRow.value,
        config: [...config.value],
        columnCode: columnCode.value,
        columnNameWidth: columnName.value,
      })
    );
    emit(
      "updatedConfigTable",
      sizeRow.value,
      config.value,
      columnCode.value,
      columnName.value
    );
  },
  { deep: true }
);

const transformArray = (inputArray) => {
  return inputArray.map((entry) => {
    const { type, name, pos, headers } = entry;
    const transformedHeaders = headers.map((header) => {
      const { id, default: defaultValue, show, label: name, type } = header;
      return { id, default: defaultValue, show, name, type };
    });

    return { type, name, pos, headers: transformedHeaders };
  });
};

const changeDefaultColumn = (i, j, state) => {
  if (!state) {
    config.value[i].headers.forEach((header, h) => {
      header.default = h === j;
    });
  }
};

const getName = (name) => {
  const names = {
    Unit: "X",
    C: "Unit",
    X: "Unit",
    QTY: "QTY",
    J: "QTY",
    HE: "Horas Extras (HE)",
    EFC: "Costo Est. (EFC)",
  };
  return names[name] || name;
};

const getColor = (type) => {
  const colors = {
    incomes: "--warning-surface-shadow-8a",
    budgets: "--info-surface-shadow-8a",
    outcomes: "--danger-surface-shadow-8a",
    projected: "--success-surface-shadow-8a",
  };
  return colors[type] || "--neutral-surface-shadow-8a";
};

const draggenItem = ref(null);
const handleDragStart = (index) => {
  draggenItem.value = index;
};
const handleDragOver = (event) => {
  event.preventDefault();
};
const handleDrop = (index) => {
  const droppedItem = config.value.splice(draggenItem.value, 1)[0];
  config.value.splice(index, 0, droppedItem);
  config.value = config.value.map((item, index) => ({ ...item, pos: index }));
  draggenItem.value = null;
};

onMounted(() => {
  window.addEventListener("keydown", handleEscapeKey);
});

onUnmounted(() => {
  window.removeEventListener("keydown", handleEscapeKey);
});

const handleEscapeKey = (event) => {
  if (event.key === "Escape" || event.key === "Esc") {
    emit('closeModal');
  }
};

const colsWithPermission = computed(() => {
  const list = config.value.filter(h => h.headers.some(sub => sub.type === incomesStore.typeTemplate && sub.isWritable));
  return list.length;
})
</script>

<template>
  <div class="containerGridTableData">
    <div class="containerGridTableData__header">
      <span>Configurar Tabla</span>
      <u-button-icon icon="close" class="btnIconModify" color="--neutral-text-caption" type="outlined" size="l"
        @action-btn="emit('closeModal')" />
    </div>
    <div class="containerGridTableData__body">
      <div class="containerGridTableData__body-item">
        <span>Altura de las Filas</span>
        <div class="container__rowsBtn">
          <u-pills :pills="sizeRows" v-model="sizeRow" />
        </div>
      </div>
      <div class="containerGridTableData__body-item" v-if="false">
        <span>Posición de Columnas</span>
        <div class="container__rowsBtn">
          <div class="btnPosCol" v-for="(c, i) in config" :key="i"
            :style="`background-color: var(${getColor(c.type)});`" :draggable="true" @dragstart="handleDragStart(i)"
            @dragover="handleDragOver" @drop="handleDrop(i)">
            <span class="u u-dragndrop"></span>
            <span>{{ c.name }}</span>
          </div>
        </div>
      </div>
      <div class="containerGridTableData__body-itemDouble">
        <div class="containerGridTableData__body-item">
          <span>Columna Código</span>
          <div class="container__rowsBtn">
            <u-switch v-model="columnCode" /> <span>Visible</span>
          </div>
        </div>
        <div class="containerGridTableData__body-item">
          <span>Ancho Nombre</span>
          <div class="container__rowsBtn">
            <u-pills :pills="sizeColumnName" v-model="columnName" />
          </div>
        </div>
      </div>
      <div class="containerGridTableData__body-item" v-if="false">
        <span>Visibilidad de Columnas</span>
        <div v-for="(c, i) in config" :key="i" class="container">
          <span><strong>{{ c.name }}</strong></span>
          <div class="container__rows">
            <div v-for="(header, h) in c.headers.filter(
              (m) => m.type === incomesStore.typeTemplate
            )" :key="h">
              <div>
                <u-switch v-model="header.show" :disabled="header.default" :color="header.default ? '--neutral-text-disabled' : '--primary-text-default'
                  " :style="`cursor: ${header.default ? 'not-allowed' : 'pointer'
                    };`" />
                <span>
                  {{ getName(header.name) }}
                </span>
              </div>
              <div class="buttonTooltip">
                <u-button-icon @mouseover="header.default ? (stateTooltip[i] = true) : ''"
                  @mouseleave="header.default ? (stateTooltip[i] = false) : ''"
                  @action-btn="changeDefaultColumn(i, h, header.default)" :disabled="!header.show" icon="star" size="s"
                  type="text" :color="header.default ? '--warning-text-default' : '--neutral-text-caption'
                    " colorHover="--warning-text-subtle" colorActive="--warning-text-darker" />
                <template v-if="header.default">
                  <span class="buttonTooltip__tooltip"
                    :style="`transform: scale(${stateTooltip[i] ? 1 : 0});`">Principal</span>
                </template>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div class="containerGridTableData__action">
      <span>Estos cambios solo se verán en este dispositivo.</span>
    </div>
  </div>
</template>

<style scoped>
.containerGridTableData {
  height: 100%;
  display: grid;
  grid-template-rows: 40px 1fr 20px;
  gap: 20px;
  font-family: Nunito;
}

.containerGridTableData__header {
  font-size: 18px;
  line-height: 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.containerGridTableData__body {
  display: flex;
  gap: 20px;
  flex-direction: column;
  overflow-y: auto;
}

.containerGridTableData__body::-webkit-scrollbar {
  width: 5px;
  height: 0px;
}

.containerGridTableData__body::-webkit-scrollbar-thumb {
  border-radius: 3px;
  background-color: var(--neutral-border-subtle);
}

.containerGridTableData__body::-webkit-scrollbar-track {
  background-color: var(--neutral-border-darker);
  border-radius: 4px;
}

.containerGridTableData__body-itemDouble {
  display: grid;
  grid-template-columns: 1fr 2fr;
  gap: 20px;
  border-bottom: 1px solid var(--neutral-border-subtle);
  padding-bottom: 10px;
}

.containerGridTableData__body-item {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-right: 10px;
  padding-bottom: 10px;
  border-bottom: 1px solid var(--neutral-border-subtle);
}

.containerGridTableData__body-itemDouble .containerGridTableData__body-item {
  justify-content: space-between;
}

.containerGridTableData__body-itemDouble .containerGridTableData__body-item,
.containerGridTableData__body-item:last-child {
  border-bottom: none;
  padding-bottom: 0px;
}

.container__rowsBtn {
  display: flex;
  gap: 16px;
  padding: 0 20px;
  overflow-x: auto;
  width: 100%;
}

.container__rowsBtn::-webkit-scrollbar {
  width: 0px;
  height: 0px;
}

.container {
  background-color: var(--neutral-surface-softer);
  border-radius: 10px;
  padding: 15px 30px 20px;
  box-sizing: border-box;
}

.container__rows {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  grid-template-rows: repeat(auto-fill, 20px);
  row-gap: 15px;
  column-gap: 30px;
  padding: 15px 0 0;
  box-sizing: border-box;
}

.container__rows div {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  align-items: center;
}

.container__rows span {
  font-size: 14px;
  line-height: 16px;
  text-align: left;
  font-weight: 600;
  letter-spacing: 0em;
  color: var(--neutral-text-body);
}

.buttonTooltip {
  position: relative;
}

.buttonTooltip .buttonTooltip__tooltip {
  position: absolute;
  font-size: 10px;
  background-color: var(--warning-surface-darker);
  padding: 2px 10px;
  border-radius: 10px;
  color: var(--white);
  left: -15px;
  top: -20px;
  transition: transform 0.3s cubic-bezier(0.075, 0.82, 0.165, 1);
  transform-origin: center bottom;
}

.containerGridTableData__action {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  align-items: center;
}

.containerGridTableData__header,
.containerGridTableData__action {
  text-align: left;
  font-weight: 600;
  letter-spacing: 0em;
  color: var(--neutral-text-body);
}

.containerGridTableData__action {
  font-size: 14px;
  line-height: 14px;
  font-weight: 600;
  color: var(--danger-text-default);
}

.containerGridTableData__body-item span {
  font-family: Nunito;
  font-size: 14px;
  line-height: 16px;
  font-weight: 600;
  color: var(--neutral-text-caption);
}

.containerGridTableData__body-item strong {
  color: var(--neutral-text-caption);
}

.btnPosCol {
  height: 28px;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 2px 15px;
  border-radius: 40px;
  transition: background-color 0.3s, color 0.1s;
  color: var(--neutral-text-caption);
  cursor: move;
}

.btnPosCol:hover {
  background-color: var(--neutral-surface-harder);
  color: var(--neutral-text-subtitle);
}

.btnPosCol span {
  font-size: 12px;
}

/* modifications of customs components */
.btnIconModify {
  border-radius: 50%;
}

@media only screen and (max-width: 500px) {
  .container__rows {
    grid-template-columns: repeat(1, 1fr);
  }
}
</style>
