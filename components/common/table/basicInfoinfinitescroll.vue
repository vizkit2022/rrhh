<script setup>
import { defineEmits, defineProps, ref, watch, onUnmounted } from "vue";
import { useVirtualList, useInfiniteScroll } from "@vueuse/core";
import useCatalogStore from "@/stores/catalog";
const catalogStore = useCatalogStore();

// Define props
const props = defineProps({
  fullScreen: {
    type: Boolean,
    default: false,
  },
  headers: {
    type: Array,
    default: () => [],
  },
  content: {
    type: Array,
    default: () => [],
  },
  loading: {
    type: Boolean,
    default: true,
  },
  redirect: {
    type: Boolean,
    default: false,
  },
  refreshHeaders: {
    type: Number,
    default: 0,
  },
  height: {
    type: String,
    default: "100vh - 382px",
  },
  fullScreenHeight: {
    type: String,
    default: "100vh - 96px",
  },
  project: {
    type: String,
    default: null,
  },
});

const getNameByType = (val, type) => {
  if (type === "state") {
    return namesState[val] || "...";
  }
  if (type === "type") {
    return val || "...";
  }
  if (type === "stateOutcomes") {
    return val || "...";
  }
  return "-";
};

const namesState = {
  opportunity: "Oportunidad",
  budget: "Cotización",
  business: "Negocio",
};

const getGridColumns = () => {
  return props.headers.map((header) => header.grid).join(" ");
};

const sumGridValues = (arr) => {
  return arr.reduce((sum, item) => {
    const gridValue = parseInt(item.grid.match(/\d+/)[0], 10);
    return sum + gridValue;
  }, (arr.length + 1) * 20);
};

const getClassByCol = (type) => {
  const nameClass = {
    checkbox: "",
    text: "truncateText",
    avatar: "centerAvatar",
    mount: "textRight",
  };
  return nameClass[type] || "";
};

const selectAll = () => {
  catalogStore.selectAllItems(allItems.value);
};

const selectItem = (pos, value) => {
  catalogStore.selectItem();
};

const stylesColorState = (state, prop) => {
  if (prop === "state") {
    const colors = {
      opportunity:
        "background-color: var(--bg-warning-100); color: var(--bg-warning-500);",
      budget:
        "background-color: var(--bg-info-100); color: var(--bg-info-500);",
      business:
        "background-color: var(--bg-success-100); color: var(--bg-success-500);",
    };
    return colors[state] || colors["Oportunidad"];
  }
  if (prop === "type") {
    const colors = {
      "F.E":
        "background-color: var(--bg-neutral-300); color: var(--bg-neutral-500); font-size: 12px; line-height: 16px;",
      "B.E":
        "background-color: var(--bg-neutral-300); color: var(--bg-neutral-500); font-size: 12px; line-height: 16px;",
    };
    return colors[state] || colors["F.E"];
  }
  if (prop === "stateOutcomes") {
    const colors = {
      "Vinculado a OC":
        "background-color: var(--bg-info-200); color: var(--bg-info-500);",
    };
    return colors[state] || colors["Vinculado a OC"];
  }
  return "";
};

// Define variables
const allItems = ref(false);
const gridColumns = ref(getGridColumns());
const minWidth = ref(sumGridValues(props.headers));
const emit = defineEmits([
  "deleteItems",
  "selectAllItems",
  "selectItem",
  "loadItems",
  "showModalInfo",
]);

watch(
  () => props.headers,
  () => {
    gridColumns.value = getGridColumns();
    minWidth.value = sumGridValues(props.headers);
  }
);

const loadMoreLines = async () => {
  emit("loadItems");
};

const contentTable = computed(() => {
  return catalogStore.filteredItems;
  //return dataFake.value;
});

//Virtual List
const { list, containerProps, wrapperProps } = useVirtualList(contentTable, {
  itemWidth: 200,
  itemHeight: 52,
});

// ******* Infinite Scroll *******

useInfiniteScroll(containerProps.ref, () => loadMoreLines(), {
  distance: 50,
});

const calcHeight = () => {
  const height = props.fullScreen ? props.fullScreenHeight : props.height;
  return `calc(${height})`;
};

const getValueByPath = (obj, path) => {
  return path.split(".").reduce((acc, part) => acc && acc[part], obj.data);
};

const getParseDate = (date) => {
  let res;
  const monthNames = [
    "Ene",
    "Feb",
    "Mar",
    "Abr",
    "May",
    "Jun",
    "Jul",
    "Ago",
    "Sep",
    "Oct",
    "Nov",
    "Dic",
  ];
  const d = new Date(date);
  res = d.getDate() + " " + monthNames[d.getMonth()] + ", " + d.getFullYear();
  //document.write('The current month is ' + monthNames[d.getMonth()])
  return res;
};

const showModalInfo = ($event, data) => {
  const classList = $event.target.classList;
  if (
    ["u-check", "containerCheckbox__space"].some((className) =>
      classList.contains(className)
    )
  ) {
    return;
  }
  emit("showModalInfo", {
    type: "line",
    content: data,
  });
};


// Infinite Scroll Setup
let stopInfiniteScroll; // Esta será nuestra función de limpieza

// Desmontar el infinite scroll cuando el componente se desmonte
onUnmounted(() => {
  if (stopInfiniteScroll) stopInfiniteScroll(); // Ejecuta la función de limpieza si está definida
});
</script>

<template>
  <div v-bind="containerProps" class="table">
    <div class="table__header">
      <div v-for="(header, h) in props.headers" :key="h">
        <u-checkbox
          v-if="header.type === 'checkbox'"
          v-model="catalogStore.allItems"
          @click="selectAll"
          :disabled="!contentTable.length"
        />
        <div v-else :class="header.position || 'left'">
          <!--center right left -->
          <span>{{ header.label }}</span>
          <button v-if="header.button"><span class="u u-Sort"></span></button>
        </div>
      </div>
    </div>
    <div v-if="props.loading" class="containerMsg">
      <u-loading />
      <span>Cargando...</span>
    </div>
    <div v-else-if="contentTable.length" v-bind="wrapperProps">
      <div class="table__item" v-for="item in list" :key="item">
        <button
          v-for="(col, c) in props.headers"
          :key="c"
          :class="getClassByCol(col.type)"
          class="col"
          @click="showModalInfo($event, item)"
        >
          <u-checkbox
            v-if="col.type === 'checkbox'"
            v-model="item.data[col.property]"
            @click="selectItem"
          />
          <span
            class="truncateText"
            style="width: 100%; display: block"
            v-if="col.type === 'text'"
            v-text="item.data[col.property]"
          ></span>
          <div class="tag">
            <span
              v-if="col.type === 'tag'"
              v-text="getNameByType(item[col.property], col.property)"
              :style="stylesColorState(item[col.property], col.property)"
            ></span>
          </div>
          <span
            v-if="col.type === 'mount'"
            v-text="
              getValueByPath(item, col.property) !== null
                ? getValueByPath(item, col.property)
                : '-'
            "
          ></span>

          <span
            v-if="col.type === 'date'"
            v-text="getParseDate(item.data[col.property])"
          ></span>
        </button>
      </div>
    </div>
    <template v-else>
      <div class="containerMsg"><span>Sin resultados</span></div>
    </template>
  </div>
</template>

<style scoped>
.containerMsg {
  width: v-bind(
    "props.fullScreen ? 'calc(100vw - 40px)' : 'calc(100vw - 140px)'"
  );
  height: 100px;
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;
  gap: 10px;
}

.containerMsg span {
  color: var(--bg-neutral-500);
  font-weight: 600;
  font-size: 16px;
}

.table {
  width: v-bind(
    "props.fullScreen ? 'calc(100vw - 40px)' : 'calc(100vw - 140px)'"
  );
  height: v-bind("calcHeight()");
  overflow-x: auto;
  overflow-y: auto;
  padding-bottom: 10px;
  box-sizing: border-box;
  border-radius: 16px;
  position: relative;
}

.table::-webkit-scrollbar {
  width: 0px;
  height: 0px;
}

.table__header,
.table__item {
  width: v-bind(
    "props.fullScreen ? 'calc(100vw - 40px)' : 'calc(100vw - 140px)'"
  );
  min-width: v-bind("minWidth + 'px'");
  display: grid;
  grid-template-columns: v-bind("gridColumns");
  align-items: center;
  gap: 15px;
  padding: 0 20px;
  border-bottom: 1px solid var(--bg-neutral-300);
}

.table__header {
  position: sticky;
  left: 0;
  top: 0;
  height: 56px;
  background-color: var(--bg-neutral-0);
  z-index: 1;
}

.table__item {
  height: 52px;
  background-color: var(--white);
  transition: 0.3s;
}

.table__item:hover {
  background-color: var(--bg-secondary-50);
  transition: 0.3s;
}

.table__header div {
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.table__header span,
.table__item span {
  font-family: Nunito;
  font-weight: 600;
  letter-spacing: 0em;
}

.table__header span {
  font-size: 12px;
  line-height: 16px;
  color: var(--bg-neutral-500);
}

.table__item .col {
  text-align: left;
  padding-right: 5px;
  cursor: v-bind("props.redirect ? 'pointer' : 'auto'");
  height: 100%;
}

.table__item .tag {
  display: flex;
  align-items: center;
}

.table__item .row2 {
  display: flex;
  flex-direction: column;
}

.table__item .row2 span {
  font-family: Nunito;
  letter-spacing: 0em;
  text-align: left;
  font-size: 14px;
  line-height: 18px;
}

.table__item .row2 span:nth-child(1) {
  font-weight: 600;
  color: #545f72;
}

.table__item .row2 span:nth-child(2) {
  font-weight: 400;
  color: var(--bg-neutral-500);
}

.table__item .tag span {
  text-align: center;
  padding: 2px 10px;
  border-radius: 15px;
  width: 100%;
}

.table__item span {
  font-size: 14px;
  line-height: 20px;
  color: var(--bg-neutral-700);
}

.table__header button:not(.containerCheckbox) {
  padding-top: 5px;
}

.table__header button span {
  font-size: 20px;
}

.textRight {
  text-align: right !important;
}

.centerAvatar {
  display: flex;
  align-items: center;
}

.centerAvatar span {
  margin-left: 10px;
  width: calc(100% - 10px - 32px);
}

.right {
  justify-content: flex-end !important;
  gap: 10px;
}

.left {
  justify-content: flex-start !important;
  gap: 10px;
}

.center {
  justify-content: center !important;
  gap: 10px;
}
@media only screen and (max-width: 768px) {
  .table {
    width: v-bind(
      "props.fullScreen ? 'calc(100vw - 40px)' : 'calc(100vw - 80px)'"
    );
    height: v-bind(
      "fullScreen ? 'calc(100vh - 40px - 36px - 20px)' : 'calc(100vh - 80px - 84px - 85px - 52px - 96px - 60px)'"
    );
  }

  .table__header,
  .table__item {
    width: v-bind(
      "props.fullScreen ? 'calc(100vw - 40px)' : 'calc(100vw - 80px)'"
    );
  }
}
</style>
