<!-- MODO DE USO -->
<!-- 
1. Modo Lectura -> props(save, search y breadcrumb) = false, y el props.config no pasar el col tipo checkbox
2. Breadcrumbs -> es un array cualquiera, el primer elemto debe tener esta forma -> { name: { es: "Categorías", en: "Categories" }, aqui va todo lo demas que necesitemos para hacer las peticiones, como ids},
3. 

-->

<script setup>
import { computed, defineEmits, defineProps, ref, watch, onMounted } from "vue";
import useGlobalStore from "@/stores/global";

// STORE
const globalStore = useGlobalStore();

// EMITS
const emit = defineEmits([
  "save",
  "searching",
  "selectedOption",
  "cleanInput",
  "filterByCategory",
  "updatedBreadcrumb",
  "updateSelected",
]);

// PROPS
const props = defineProps({
  save: {
    type: Boolean,
    default: false,
  },
  search: {
    type: Boolean,
    default: true,
  },
  breadcrumb: {
    type: Boolean,
    default: true,
  },
  config: {
    type: Object,
    default: {
      minWidthCols: "768px", // suma de los width, checkbox es 48px
      cols: [
        { type: "checkbox" },
        { type: "code", width: "80px" },
        { type: "name", width: "minmax(200px, 1fr)" },
        {
          type: "assigned",
          label: { es: "Aplicadas", en: "Real Value" },
          width: "100px",
          prop: { num1: "assignedLines", num2: "numberChildren" },
        },
        // Si viene prop, se ignora al por defecto
        {
          type: "amount",
          label: { es: "Valor Real", en: "Real Value" },
          align: "right",
          width: "120px",
          prop: "numbers/amount1/value",
        },
      ],
    },
  },
  list: {
    type: Array,
    default: () => [
      //   {
      //     select: false,
      //     code: "12347",
      //     name: "Linea 1 dasdasd asdasdadsasd asdasdasda dasdasd",
      //     numbers: { amount1: { value: "$ 180.000" } },
      //     isParent: false,
      //   },
    ],
  },
  resultsSearch: {
    type: Array,
    default: () => [],
  },
  selectParents: {
    type: Boolean,
    default: true,
  },
  loadingSearch: {
    type: Boolean,
    default: false,
  },
  loadingList: {
    type: Boolean,
    default: false,
  },
  breadcrumbs: {
    type: Array,
    default: () => [],
  },
  selectedLines: {
    type: Array,
    default: () => [],
  },
  showSelectedLines: {
    type: Boolean,
    default: false,
  },
  propsPartial: {
    type: Object,
    default: () => {
      return {
        prop1: "assignedLines",
        prop2: "numberChildren"
      }
    }
  },
  verifyProp: {
    type: String,
    default: "_id"
  },
  isSurcharge: {
    type: String,
    default: ""
  },
  maxHeight: {
    type: String,
    default: "fit-content",
  }
});

onMounted(() => {
  if(props.isSurcharge.trim() !== "") {
    list.value = props.list.map(item => {
      return {
        ...item,
        selected: item.surchargesLines.includes(props.isSurcharge)
      }
    });
    allSelected.value = list.value.every(l => l.selected);

  } else {
    if (props.selectedLines.filter(s => s.selected).length) {
      list.value = props.list.map((item) => {
        const isSelected = props.selectedLines.some(
          (selectedItem) => selectedItem[props.verifyProp] === item[props.verifyProp]
        );
        return {
          ...item,
          selected: isSelected,
        };
      });
    } else {
      list.value = props.list;
    }
    allSelected.value = list.value.every(l => props.selectParents ? l.selected : (!l.isParent && l.selected));
  }
});

watch(
  () => props.list,
  () => {
    if(props.isSurcharge.trim() === "") {
      if (props.selectedLines.length) {
        list.value = props.list.map((item) => {
          const isSelected = props.selectedLines.some(
            (selectedItem) => selectedItem[props.verifyProp] === item[props.verifyProp]
          );
          return {
            ...item,
            selected: isSelected,
          };
        });
      } else {
        list.value = props.list;
      }
      allSelected.value = list.value.every(l => props.selectParents ? l.selected : (!l.isParent && l.selected))
    } else {
      list.value = props.list.map(item => {
        return {
          ...item,
          selected: item.surchargesLines.includes(props.isSurcharge)
        }
      });
      allSelected.value = list.value.every(l => l.selected);
    }
  }
);

// COMPUTED
const lang = computed(() => globalStore.lang);
const templeteCols = computed(() => {
  if (props.config.cols.length) {
    return getWidthsString(props.config.cols);
  }
  return "1fr";
});

// CONSTANTS
const labels = {
  code: { es: "Código", en: "Code" },
  name: { es: "Nombre", en: "Name" },
  assigned: { es: "Asignadas", en: "Assigned" },
  amount: { es: "Costo", en: "Cost" },
};
const btnSearch = {
  es: "Guardar",
  en: "Save",
};
const placeholderSearch = {
  es: "Buscar Línea o Categoría",
  en: "Search Line or Category",
};
const withoutResults = {
  es: "Sin Resultados",
  en: "Without results",
};
// search
const list = ref([]);
const search = ref("");
const loading = ref({
  text: { es: "Cargando...", en: "Loading..." },
  search: false,
  list: false,
});
const allSelected = ref(false);

// ACTIONS
const save = () => {
  emit("save");
};
const filterByCategory = async (category, c) => {
  emit("filterByCategory", category, c);
};
const getValue = (line, col) => {
  if (col.type === "code") {
    if (props.config.cols) {
      const data = props.config.cols.find((c) => c.type === "code");
      if (data && data.prop) return getValueBySinglePath(line, data.prop);
      return line.code || "-";
    }
  }
  if (col.type === "name") {
    if (props.config.cols) {
      const data = props.config.cols.find((c) => c.type === "name");
      if (data && data.prop) return getValueBySinglePath(line, data.prop);
      return line.name || "-";
    }
  }
  if (col.type === "assigned") {
    if (props.config.cols) {
      const data = props.config.cols.find((c) => c.type === "assigned");
      if (data && data.prop)
        return (
          getValueBySinglePath(line, data.prop.num1) +
          " de " +
          getValueBySinglePath(line, data.prop.num2)
        );
      return "-";
    }
  }
  if (col.type === "amount") {
    if (props.config.cols) {
      const data = props.config.cols.find((c) => c.type === "amount");
      if (data && data.prop) return getValueBySinglePath(line, data.prop);
      return "-";
    }
  }

  return "-";
};
const searching = () => {
  emit("searching", search.value);
};
const cleanInput = () => {
  emit("cleanInput");
  search.value = "";
};
const selectedOption = (op) => {
  emit("selectedOption", op);
  setTimeout(() => {
    search.value = "";
  }, 10);
};
const updateSelected = (item) => {
  emit("updateSelected", item);
  allSelected.value = list.value.every((l) => props.selectParents ? l.selected : (!l.isParent && l.selected));
};
const updateSelectedAll = () => {
  list.value.forEach((item) => {
    item.selected = allSelected.value;
    emit("updateSelected", item);
  });
};

// FUNCTIONS
const getWidthsString = (arr) => {
  const widths = arr.map((item) => {
    if (item.type === "checkbox") {
      return "48px";
    }
    return item.width || "";
  });
  return widths.join(" ");
};
const getValueBySinglePath = (obj, path) => {
  if (Object.keys(obj).length && path) {
    const keys = path.split("/");
    let result = obj;
    for (const key of keys) {
      if (result && key in result) {
        result = result[key];
      } else {
        return "-";
      }
    }
    return result;
  }
  return "-";
};
const isPartial = (item) => {
  return (
    item[props.propsPartial.prop1] &&
    (item[[props.propsPartial.prop2]] > item[[props.propsPartial.prop1]] || item[[props.propsPartial.prop1]] === 0)
  );
};
const getAlignment = (col) => {
  return col.type === "assigned"
    ? "center"
    : col.type === "amount"
    ? "right"
    : "left";
};
const getLabel = (col) => {
  const defaultLabel = props.config.cols.find((c) => c.type === col.type);
  if (
    defaultLabel &&
    defaultLabel.label &&
    Object.keys(defaultLabel.label).length
  ) {
    return defaultLabel.label[globalStore.lang];
  }
  return labels[col.type][globalStore.lang];
};
</script>

<template>
  <div class="explorer">
    <div class="explorer__search" v-if="props.search">
      <div>
        <u-search
          v-if="props.isSurcharge === ''"
          v-model="search"
          :options="props.resultsSearch"
          :loading="props.loadingSearch"
          :placeholder="placeholderSearch[lang]"
          @input="searching"
          @cleanInput="cleanInput"
          @selectedOption="selectedOption"
          :updated="false"
          :snippet="true"
        />
      </div>
      <u-button :text="btnSearch[lang]" @click="save" v-if="props.save" />
      <u-button-icon icon="group" @click="list = props.selectedLines" v-if="props.showSelectedLines" title="Ver últimos cambios" type="outlined" :disabled="props.selectedLines.filter(s => s.selected).length === 0" />
    </div>
    <div class="explorer__content">
      <div class="explorer__content-breadcrumb" v-if="props.breadcrumb">
        <template v-for="(breadcrumb, b) in props.breadcrumbs" :key="b">
          <button
            @click="filterByCategory(breadcrumb, b)"
            :class="b === props.breadcrumbs.length - 1 ? 'current' : ''"
          >
            <span class="u u-folder"></span>
            <span>{{ b === 0 ? breadcrumb.name[lang] : breadcrumb.name }}</span>
          </button>
          <span v-if="b !== props.breadcrumbs.length - 1">/</span>
        </template>
      </div>
      <div class="explorer__content-table">
        <div class="explorer__content-header">
          <template v-for="(col, c) in props.config.cols" :key="c">
            <div v-if="col.type === 'checkbox'" class="col center">
              <span v-if="!props.selectParents && list.every((l) => l.isParent)">-</span>
              <u-checkbox
                v-else
                v-model="allSelected"
                :height="16"
                @click="updateSelectedAll"
              />
            </div>
            <div v-else class="col" :class="getAlignment(col)">
              <span v-text="getLabel(col)"></span>
            </div>
          </template>
        </div>
        <div v-if="props.loadingList" class="explorer__content-loading">
          <u-loading :width="16" /> <span v-text="loading.text[lang]"></span>
        </div>
        <div v-else-if="props.list.length" class="listExplorer">
          <div
            class="explorer__content-item"
            v-for="(item, i) in list"
            :key="i"
            :class="item.selected ? 'select' : isPartial(item) ? 'partial' : ''"
          >
            <template v-for="(col, c) in props.config.cols" :key="c">
              <div v-if="col.type === 'checkbox'" class="col center">
                <span v-if="!props.selectParents && item.isParent">-</span>
                <u-checkbox
                  v-else
                  v-model="item.selected"
                  :height="16"
                  :partial="isPartial(item)"
                  @click="updateSelected(item)"
                />
              </div>
              <template v-else>
                <button
                  class="col parent"
                  :class="`${getAlignment(col)}`"
                  v-if="item.isParent && col.type === 'name'"
                  @click="filterByCategory(item)"
                >
                  <span class="u u-folder"></span>
                  <span class="truncateText">{{
                    col.type === "assigned" && !item.isParent
                      ? "-"
                      : getValue(item, col)
                  }}</span>
                </button>
                <div
                  v-else
                  class="col"
                  :class="`${getAlignment(col)} ${
                    col.type === 'name' && list.some((l) => l.isParent)
                      ? 'nameItem'
                      : ''
                  } ${col.type === 'amount' && item.isParent ? 'amount' : ''}`"
                >
                  <span class="truncateText">{{
                    col.type === "assigned" && !item.isParent
                      ? "-"
                      : getValue(item, col)
                  }}</span>
                </div>
              </template>
            </template>
          </div>
        </div>
        <div v-else class="explorer__content-loading">
          <span v-text="withoutResults[lang]"></span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
span,
label,
button {
  font-family: Nunito;
}
/* ----- Container ----- */
.explorer {
  display: grid;
  grid-template-rows: v-bind("props.search ? '36px 1fr' : '1fr'");
  gap: 12px;
  min-height: 120px;
  height: 100%;

}
/* ----- Search ----- */
.explorer__search {
  display: grid;
  grid-template-columns: v-bind("props.save && !props.showSelectedLines ? '1fr 120px' : props.save && props.showSelectedLines  ? '1fr 120px 40px' : !props.save && props.showSelectedLines ? '1fr 40px' : '1fr'");
  gap: 12px;
}
/* ----- Content ----- */
.explorer__content {
  display: flex;
  flex-direction: column;
  border-radius: 8px;
  border: 1px solid var(--neutral-border-light);
  overflow: hidden;
  transition: 0.3s cubic-bezier(0.215, 0.61, 0.355, 1);
  height: 100%;
}
.explorer__content-breadcrumb {
  background-color: var(--neutral-surface-light);
  display: flex;
  gap: 10px;
  align-items: center;
  padding: 0 16px;
  height: 28px;
}
.explorer__content-table {
  background-color: var(--neutral-background-default);
  transition: 0.3s cubic-bezier(0.215, 0.61, 0.355, 1);
  overflow-y: auto;
  position: relative;
  flex: 1;
  max-height: v-bind("props.maxHeight");
}
.explorer__content-table::-webkit-scrollbar {
  width: 8px;
  background: var(--neutral-surface-light);
  border-radius: 20px;
}
.explorer__content-table::-webkit-scrollbar-thumb {
  background: var(--neutral-surface-subtle);
  border-radius: 5px;
}
/* Breadcrumb */
.explorer__content-breadcrumb button {
  display: flex;
  gap: 5px;
}
.explorer__content-breadcrumb button span:not(.u) {
  font-size: 14px;
  font-weight: 600;
  line-height: 18px;
}
.explorer__content-breadcrumb span {
  color: var(--neutral-text-caption);
  transition: 0.3s;
}
.explorer__content-breadcrumb button span.u {
  font-size: 16px;
  line-height: 16px;
}
.explorer__content-breadcrumb button:hover span {
  color: var(--primary-text-default);
}
.explorer__content-breadcrumb button.current span {
  color: var(--primary-text-subtle);
}
/* List */
.explorer__content-loading {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 5px;
  padding: 10px 0;
}
.explorer__content-loading span {
  color: var(--neutral-text-caption);
  font-size: 14px;
}
/* Header */
.explorer__content-header,
.explorer__content-item {
  display: grid;
  grid-template-columns: v-bind("templeteCols");
  gap: 10px;
  height: 28px;
}
.explorer__content-header {
  background-color: var(--neutral-surface-softer);
  border-bottom: 1px solid var(--neutral-border-light);
  position: sticky;
  top: 0;
  z-index: 2;
}
.explorer__content-header span {
  color: var(--neutral-text-caption);
  font-weight: 600;
  text-align: right;
  font-size: 14px;
}
.explorer__content-header .col,
.explorer__content-item .col:not(.parent) {
  display: flex;
  align-items: center;
}
.center {
  justify-content: center;
}
.left {
  justify-content: flex-start;
}
.right {
  justify-content: flex-end;
}
.explorer__content-header .col:last-child.right,
.explorer__content-item .col:last-child.right {
  padding-right: 16px;
}
.explorer__content-header .col:first-child.left,
.explorer__content-item .col:first-child.left {
  padding-left: 16px;
}
/* Item */
.explorer__content-item {
  transition: 0.3s cubic-bezier(0.215, 0.61, 0.355, 1);
  background-color: var(--neutral-background-default);
}
/* .explorer__content-item:not(:last-child) {
  border-bottom: 1px solid var(--neutral-border-darker);
} */
.explorer__content-item.select {
  background-color: var(--primary-surface-shadow-12a);
}
.explorer__content-item.partial {
  background-color: var(--warning-surface-shadow-12a);
}
.explorer__content-item:not(.partial):not(.select):hover {
  background-color: var(--primary-surface-shadow-8a);
}
.explorer__content-item span {
  color: var(--neutral-text-body);
  font-weight: 600;
  font-size: 14px;
}
.explorer__content-item .col.parent {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 8px;
  align-items: center;
}
.explorer__content-item .col.parent span.u {
  font-size: 16px;
  line-height: 16px;
  color: var(--neutral-text-caption);
}
.explorer__content-item .col.parent span {
  text-align: left;
}
.explorer__content-item .col.parent span,
.explorer__content-item .col.amount span {
  font-weight: 800;
}
.explorer__content-item .col.nameItem {
  padding-left: 24px;
}
</style>