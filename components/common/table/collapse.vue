<script setup>
import { ref, computed, defineProps, onMounted, defineEmits } from "vue";
import { useVirtualList } from "@vueuse/core";
import { capitalizeName, transformedDate } from "@/utils/helpers";
import { useI18n } from "vue-i18n";

// Props
const props = defineProps({
  config: {
    type: Object,
    default: () => ({
      maxheight: "880px",
      maxwidth: "100%",
    }),
  },
  content: {
    type: Array,
    default: () => [],
  },
  loading: {
    type: Boolean,
    default: false
  }
});

// Emits
const emit = defineEmits(["actionTable"]);

// Vars
const headers = ref([]);
const router = useRouter();
const selectAll = ref(false);
const { t } = useI18n();

// Computed
const computedList = computed(() => props.content);

// Virtual List
const { list, containerProps, wrapperProps } = useVirtualList(computedList, {
  itemHeight: props.config?.item?.height || 48,
});

// Mounted
onMounted(() => {
  if (Array.isArray(props.config.cols)) {
    headers.value = JSON.parse(JSON.stringify(props.config.cols));
  } else {
    console.warn("props.config.cols debe ser un array");
  }
});

// Functions
const expandCol = (col, c) => {
  col.expand = !col.expand;
  headers.value[c].subcols.forEach((sub) => {
    if (sub.noShowCollapse) {
      sub.show = col.expand;
    }
  });
};
const gridColumns = (col) => {
  let cols = col.subcols.filter((cl) => cl.show);
  let grid = [];
  cols.forEach((c) => {
    grid.push(c.width);
  });
  return grid.join(" ");
};
const getValueUser = (item, subCol) => {
  const user =  {  
    name: getValueByPath(item.data, subCol.prop.name, subCol.prop.name_fallback),
    src: getValueByPath(item.data, subCol.prop.src, subCol.prop.src_fallback),
  };
  return user;
};
const selectedList = () => {
  for (const obj of props.content) {
    obj.selected = selectAll.value;
  }
};
const selectedItem = (state) => {
  if (!state) selectAll.value = false;
  else {
    selectAll.value = props.content.every((c) => c.selected);
  }
};

// Functions puras
const getValueByPath = (obj, path, path_fallback = "") => {
  if (path) {
    const segments = path.split("/");

    let currentObj = obj;

    for (const segment of segments) {
      if (segment.startsWith("[") && segment.endsWith("]")) {
        const index = parseInt(segment.slice(1, -1));
        if (!Array.isArray(currentObj)) {
          throw new Error("Expected an array");
        }
        currentObj = currentObj[index];
      } else {
        if (typeof currentObj !== "object" || currentObj === null) {
          return ""
        }
        if (!(segment in currentObj)) {
          if (path_fallback) {
            return getValueByPath(obj, path_fallback);
          } else {
            return "";
          }
        }
        currentObj = currentObj[segment];
      }
    }

    return currentObj;
  }

  return "";
};
const goToPage = (header, data, pos) => {
  if (header.path) {
    const dinamicPath = getDinamicPath(header.path.route);
    let newPath = header.path.route;
    dinamicPath.forEach((q) => {
      const query = getValueByPath(data, header.path[q]);
      const param = `[${q}]`;
      newPath = newPath.replace(param, query);
    });
    console.log(newPath)
    return navigateTo(newPath);
  }
  if (header.emit) {
    emit("actionTable", { emit: header.emit.name, data, pos });
  }
};
const getDinamicPath = (path) => {
  const regex = /\[(.*?)\]/g;
  const segments = [];
  let match;

  while ((match = regex.exec(path)) !== null) {
    segments.push(match[1]);
  }

  return segments;
};
</script>

<template>
  <div class="collapse" v-bind="containerProps">
    <div class="collapse__header">
      <div
        :class="`collapse__header__main ${c === 0 ? 'first' : ''} ${ c === headers.length - 1 ? 'last' : '' }`"
        v-for="(col, c) in headers"
        :key="c"
      >
        <div class="collapse__header__col">
          <button @click="expandCol(col, c)">
            <span class="label">{{ col.name.translate ? t(col.name.translate) : col.name.label }}</span>
            <span
              :class="`u u-chevron-${col.expand ? 'right' : 'left'}`"
            ></span>
          </button>
        </div>
        <div
          :class="`collapse__header__subcols ${ c === headers.length - 1 ? 'last' : '' }`"
          :style="`grid-template-columns: ${gridColumns(col)};`"
        >
          <template v-for="(subCol, s) in col.subcols.filter((cl) => cl.show)" :key="s"
          >
            <!-- Checkbox -->
            <div v-if="subCol.typeHeader === 'selected'" :class="`collapse__header__subcol ${subCol.flex}`">
                <u-checkbox
                  v-if="props.content.length"
                  v-model="selectAll"
                  @click="selectedList"
                />
            </div>
            <!-- Custom -->
            <div  v-else-if="subCol.typeHeader === 'custom'" :class="`collapse__header__subcol ${subCol.flex}`">
              <slot :name="subCol?.slotName || 'default'" :item="subCol"></slot>
            </div>
            <!-- Unknown or Text -->
            <div v-else :class="`collapse__header__subcol ${subCol.flex}`">
              <span>{{ subCol.name.translate ? t(subCol.name.translate) : subCol.name.label }}</span>
            </div>
          </template>
        </div>
      </div>
    </div>
    <div v-if="props.loading" class="waitData">
      <u-loading :width="18" />
      <span style="margin-left: 10px" v-text="t(props?.config?.msg?.loading)"></span>
    </div>
    <div v-else-if="!props.content.length" class="notData">
      <u-tax :width="80" />
      <span v-text="t(props?.config?.msg?.noData)"></span>
    </div>
    <div v-else v-bind="wrapperProps" style="z-index: -1;">
        <div class="collapse__item" v-for="item in list" :key="item.index">
            <div v-for="(col, c) in headers" :key="c" :class="`collapse__item-col ${ c === headers.length - 1 ? 'last' : '' }`"  :style="`grid-template-columns: ${gridColumns(col)};`">
                <template v-for="(subCol, s) in col.subcols.filter((cl) => cl.show)" :key="s">
                    <!-- Checkbox -->
                    <div v-if="subCol.type === 'selected'" :class="`collapse__item-cell ${subCol.flex}`" :style="`width: ${subCol.width};`">
                        <u-checkbox
                          v-model="item.data.selected"
                          @click="selectedItem(item.data.selected)"
                        />
                    </div>
                    <!-- Custom -->
                     <div v-else-if="subCol.type === 'custom'" class="customCell" @click="goToPage(subCol, item.data, item.index)">
                        <slot :name="subCol.slotName" :item="item.data"></slot>
                     </div>
                    <!-- Others Types -->
                    <button v-else :class="`collapse__item-cell ${subCol.flex} ${subCol.type}`"
                        @click="goToPage(subCol, item.data, item.index)">
                        <!-- Avatar Text -->
                        <template v-if="subCol.type === 'avatarText'" >
                            <u-avatar :user="getValueUser(item, subCol)" :size="32" />
                            <span class="truncateText" v-text="getValueUser(item, subCol)?.name"></span>
                        </template>
                        <!-- Double Text -->
                        <template v-else-if="subCol.type === 'textDouble'">
                            <span class="truncateText" v-text="getValueByPath(item.data, subCol.prop.text) || '-'" ></span>
                            <span class="truncateText" v-text="getValueByPath(item.data, subCol.prop.subtext) || '-'"></span>
                        </template>
                        <!-- Date -->
                        <template v-else-if="subCol.type === 'date'">
                            <span v-text="transformedDate(getValueByPath(item.data, subCol.prop.text))"></span>
                        </template>
                        <!-- Currency -->
                        <template v-else-if="subCol.type === 'currency'">
                            <span :class="`defaultText truncateText ${getValueByPath(item.data, subCol.prop.text).includes('-') ? 'negative' : ''}`" v-text="getValueByPath(item.data, subCol.prop.text) || '-'" 
                                :title="getValueByPath(item.data, subCol.prop.number)"></span>
                        </template>
                        <!-- Default or Text -->
                        <template v-else>
                            <span class="defaultText truncateText" v-text="capitalizeName(getValueByPath(item.data, subCol.prop.text) || '-')"></span>
                        </template>
                    </button>
                </template>
            </div>
        </div>
    </div>
  </div>
</template>

<style scoped>
.collapse {
  width: v-bind("props.config.maxwidth");
  height: v-bind("props.config.maxheight");
  overflow: auto;
  border-radius: 16px;
  position: relative;
}
.collapse::-webkit-scrollbar {
  width: 10px;
  height: 10px;
}
.collapse::-webkit-scrollbar-thumb {
  border-radius: 5px;
  background-color: var(--neutral-border-default);
}
.collapse::-webkit-scrollbar-track {
  background-color: var(--neutral-border-darker);
  border-radius: 4px;
}
.collapse__header {
  display: flex;
  position: sticky;
  top: 0px;
  z-index: 1;
}
.collapse__header__main {
    background-color: var(--neutral-background-default);
}
.collapse__header__main.first .collapse__header__col {
  border-radius: 16px 0 0 0;
}
.collapse__header__main.last .collapse__header__col {
  border-radius: 0 16px 0 0;
  border-right: 1px solid var(--neutral-border-subtle);
}
.collapse__header__col {
  background-color: var(--neutral-surface-light);
  border-bottom: 1px solid var(--neutral-border-subtle);
  border-top: 1px solid var(--neutral-border-subtle);
  border-left: 1px solid var(--neutral-border-subtle);
  height: v-bind("props.config.header.height + 'px'");
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 0 12px;
}
.collapse__header__col button {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
}
.collapse__header__col button span.u {
  transition: 0.3s;
  color: var(--neutral-text-caption);
  font-size: 18px;
}
.collapse__header__col button:hover span {
  color: var(--primary-text-subtle);
}
.collapse__header__col span.label {
  font-weight: 600;
  font-size: 14px;
  line-height: 18px;
  letter-spacing: 0%;
  text-align: justify;
  vertical-align: bottom;
  color: var(--neutral-text-caption);
  transition: 0.3s;
}
.collapse__header__subcols {
  display: grid;
  align-items: center;
  background-color: var(--neutral-surface-softer);
  border-left: 1px solid var(--neutral-border-subtle);
}
.collapse__header__subcols.last {
  border-right: 1px solid var(--neutral-border-subtle);
}
.collapse__header__subcol {
  height: v-bind("props.config.header.subheight + 'px'");
  display: flex;
  align-items: center;
  padding: 0 12px;
  border-bottom: 1px solid var(--neutral-border-subtle);
}
.collapse__header__subcol span {
    font-weight: 400;
    font-size: 14px;
    line-height: 18px;
    letter-spacing: 0%;
    text-align: justify;
    vertical-align: bottom;
    color: var(--neutral-text-caption);
}
.collapse__item {
    display: flex;
}
.collapse__item-cell {
    display: flex;
    align-items: center;
    padding: 0 12px;
    border-bottom: 1px solid var(--neutral-border-subtle);
    height: v-bind("props.config.item.height + 'px'");
    transition: 0.3s background;
}
.collapse__item-col {
    display: grid;
    align-items: center;
    border-left: 1px solid var(--neutral-border-subtle);
}
.collapse__item-col.last {
    border-right: 1px solid var(--neutral-border-subtle);
}
.collapse__item:hover .collapse__item-cell,
.collapse__item:hover .customCell {
    background-color: var(--primary-surface-shadow-8a);
}

/* Avatar Text */
.avatarText {
    display: grid !important;
    grid-template-columns: 32px 1fr !important;
    align-items: center;
    gap: 8px;
}
.avatarText span {
    font-weight: 600;
    font-size: 14px;
    line-height: 18px;
    letter-spacing: 0%;
    color: var(--neutral-text-body);
    text-align: left;
}
/* Default Text */
.defaultText {
    font-weight: 600;
    font-size: 14px;
    line-height: 18px;
    letter-spacing: 0%;
    vertical-align: middle;
    color: var(--neutral-text-body);
}
/* Custom */
.customCell {
    border-bottom: 1px solid var(--neutral-border-subtle);
    height: v-bind("props.config.item.height + 'px'");
    cursor: pointer;
    transition: 0.3s background;
}
/* Text Double */
.textDouble {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center !important;
}
.textDouble span {
    font-weight: 600;
    font-size: 14px;
    line-height: 16px;
    letter-spacing: 0%;
    vertical-align: middle;
    text-align: start;
    width: 100%;
}
.textDouble span:nth-child(1) {
    color: var(--neutral-text-body);
}
.textDouble span:nth-child(2) {
    color: var(--neutral-text-caption);
}
/* Date */
.date span {
    font-weight: 600;
    font-size: 14px;
    line-height: 16px;
    letter-spacing: 0%;
    vertical-align: middle;
    text-align: start;
    width: 100%;
    color: var(--neutral-text-body);
}
/* Currency */
.defaultText.negative {
    color: var(--danger-text-default);
}

/* Global */
.left {
  justify-content: flex-start;
}
.right {
  justify-content: flex-end;
}
.center {
  justify-content: center;
}
.notData, .waitData {
  height: 200px;
  display: flex;
  justify-content: center;
  align-items: center;
  position: sticky;
  left: 0;
  width: 100%;
  gap: 0px;
}
.notData {
  flex-direction: column;
  gap: 20px;
}
.notData span, .waitData {
  font-size: 16px;
  font-weight: 400;
  color: var(--neutral-text-caption);
}
</style>
