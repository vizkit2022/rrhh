<script setup>
import {
  defineProps,
  reactive,
  computed,
  onMounted,
  watch,
  defineEmits,
} from "vue";
import useGlobalStore from "@/stores/global";
import { useVirtualList } from "@vueuse/core";
import { transformedDate } from "@/utils/helpers";
import { useI18n } from "vue-i18n";

// Stores
const globalStore = useGlobalStore();

// Usa la función de i18n
const { t } = useI18n();

// Props
const props = defineProps({
  showModal: {
    type: Boolean,
    default: false,
  },
  LocalStorageName: {
    type: String,
    required: () => {},
  },
  fullScreen: {
    type: Boolean,
    default: false,
  },
  configTable: {
    type: Object,
    required: () => {},
  },
  content: {
    type: Array,
    default: () => [],
  },
  loading: {
    type: Boolean,
    default: false,
  },
});

// Reactive state
const configLocalName = ref(props.LocalStorageName);
const configLocalStorage = reactive({});
const configTableLive = reactive(JSON.parse(JSON.stringify(props.configTable)));

// Función para asegurar que cada elemento tenga la propiedad `selected`
const ensureSelectedProperty = (content) => {
  content.forEach((item, index) => {
    if (typeof item !== "object" || item === null) {
      content[index] = { ...item, selected: false };
    } else if (!item.hasOwnProperty("selected")) {
      item.selected = false;
    }
  });
};

const deepMerge = (template, source, allowedProps = []) => {
  // Crear una copia profunda del template para no modificar la referencia
  const result = reactive(JSON.parse(JSON.stringify(template)));

  result.cols.forEach((col) => {
    const sourceCol = source.cols.find(
      (sCol) => sCol.name.es === col.name.es && sCol.name.en === col.name.en, //Cambiar criterio de busqueda a futuro por index o similar
    );

    if (sourceCol) {
      // Actualizar las subcols
      col.subcols.forEach((subcol) => {
        const sourceSubcol = sourceCol.subcols.find(
          (sSubcol) =>
            sSubcol.name.es === subcol.name.es &&
            sSubcol.name.en === subcol.name.en,
        );

        if (sourceSubcol) {
          // Actualizar las propiedades permitidas
          allowedProps.forEach((prop) => {
            if (sourceSubcol[prop] !== undefined) {
              subcol[prop] = sourceSubcol[prop];
            }
          });
        } else {
          console.warn(
            `No matching sourceSubcol found for subcol with name: ${subcol.name.es} / ${subcol.name.en}`,
          );
        }
      });
    } else {
      console.warn(
        `No matching sourceCol found for column with name: ${col.name.es} / ${col.name.en}`,
      );
    }
  });

  return result; // Devolver la copia del template con los valores actualizados
};

// Función para cargar la configuración desde el localStorage
const loadConfigFromLocalStorage = () => {
  const storedConfig = localStorage.getItem(configLocalName.value);
  const allowedProps = ["show"];
  Object.assign(configLocalStorage, {});
  if (storedConfig) {
    try {
      const parsedConfig = JSON.parse(storedConfig); // aqui muere
      const mergedConfig = deepMerge(
        props.configTable,
        parsedConfig,
        allowedProps,
      );
      Object.assign(configTableLive, mergedConfig);
    } catch (error) {
      console.error("Invalid JSON in localStorage:", error);
      Object.assign(configTableLive, props.configTable);
    }
  } else {
    Object.assign(configTableLive, props.configTable);
  }
};
loadConfigFromLocalStorage();
// Watch para detectar cambios en LocalStorageName y configTable y ejecutar el proceso de carga

watch(
  () => props.LocalStorageName,
  (newVal, oldVal) => {
    if (newVal !== oldVal) {
      configLocalName.value = newVal;
      loadConfigFromLocalStorage();
    }
  },
);

watch(
  () => props.content,
  (newContent) => {
    ensureSelectedProperty(newContent);
  },
  { immediate: true },
);

onMounted(() => {
  if (props.LocalStorageName) {
    loadConfigFromLocalStorage();
  }
  ensureSelectedProperty(props.content);
});

// Computed
const computedList = computed(() => props.content);

// Virtual List
const { list, containerProps, wrapperProps } = useVirtualList(computedList, {
  itemHeight: configTableLive?.item?.height || 52,
});

// Constants
const expandCol = reactive(
  configTableLive.cols.reduce((acc, col) => {
    acc[col.code] = col.startExpand ?? false;
    return acc;
  }, {}),
);

const selectAll = ref(false);
const emit = defineEmits(["actionTable", "closeModalConfig"]);
const router = useRouter();

// Functions
const getGridColumns = (type, cols, colParent) => {
  if (type === "header") {
    const result =
      cols
        .filter((col) => col.show) // Filtrar columnas que tienen `show` activado
        .map((col) => calculateWidth(col, expandCol[col.code]))
        .join(" ") || "1fr";
    return result;
  }

  if (type === "subheader") {
    const result =
      cols
        .filter((col) => col.show) // Filtrar columnas que tienen `show` activado
        .filter(
          (col) =>
            !(
              (!expandCol[colParent.code] && col.showCollapse === false) ||
              col.show === false
            ),
        )
        .map((col) => (expandCol[col.code] ? parseWidth(col.width) : col.width))
        .join(" ") || "1fr";
    return result;
  }

  return "1fr";
};

const calculateWidth = (header, expanded) => {
  let totalWidth = 0;

  header.subcols.forEach((subcol) => {
    if (
      (expanded || subcol.showCollapse !== false || subcol.show === false) &&
      subcol.show
    ) {
      if (subcol.width.startsWith("minmax(")) {
        const minWidth = subcol.width.match(/\d+/g)[0];
        totalWidth += parseInt(minWidth);
      } else {
        totalWidth += parseInt(subcol.width);
      }
    }
  });

  return `${totalWidth}px`;
};

const filteredSubcols = computed(() => {
  return (header) => {
    return header.subcols.filter(
      (subheader) =>
        !(
          (!expandCol[header.code] && subheader.showCollapse === false) ||
          subheader.show === false
        ),
    );
  };
});

// Extras
const parseWidth = (widthString) => {
  if (widthString.endsWith("px")) {
    return parseInt(widthString.slice(0, -2));
  } else if (widthString.startsWith("minmax(")) {
    const regex = /\d+/g;
    const match = widthString.match(regex);
    if (match && match.length > 0) {
      return parseInt(match[0]);
    } else {
      return 0;
    }
  } else {
    return 0;
  }
};

const getTranslatedValue = (key, fallback = "") => {
  // Verifica si `key` está definido y no es nulo
  if (!key) return fallback;

  // Intenta traducir usando i18n
  const translation = t(key);

  // Si la traducción existe y es diferente de la clave original, úsala; de lo contrario, usa el valor de fallback
  return translation && translation !== key ? translation : fallback;
};

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
          return "";
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

const getDinamicPath = (path) => {
  const regex = /\[(.*?)\]/g;
  const segments = [];
  let match;

  while ((match = regex.exec(path)) !== null) {
    segments.push(match[1]);
  }

  return segments;
};

const selectedItem = (state) => {
  if (!state) selectAll.value = false;
  else {
    selectAll.value = props.content.every((c) => c.selected);
  }
};

const selectedList = () => {
  for (const obj of props.content) {
    obj.selected = selectAll.value;
  }
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
    return navigateTo(newPath);
  }
  if (header.emit) {
    emit("actionTable", { emit: header.emit.name, data, pos });
  }
};

const getCurrencyColor = (amount) => {
  if (amount && String(amount).includes("-"))
    return "var(--danger-text-default)";
  return "var(--neutral-text-body)";
};
</script>

<template>
  <u-dialog
    :showModal="props.showModal"
    @closeModal="emit('closeModalConfig')"
    width="600px"
    height="auto"
  >
    <DialogConfigTableExpand
      :configTableLive="configTableLive"
      @closeModal="emit('closeModalConfig')"
      :localStorageName="configLocalName"
    />
  </u-dialog>

  <div
    :class="{ table: true, 'table--full-screen': props.fullScreen }"
    v-bind="containerProps"
  >
    <div
      class="header"
      :style="`grid-template-columns: ${getGridColumns(
        'header',
        configTableLive.cols,
      )}`"
    >
      <div
        class="header--col"
        v-for="(header, h) in configTableLive.cols"
        :key="header.order"
      >
        <div
          :class="`header--col-sup cell ${header.flex} ${
            h === configTableLive.cols.length - 1 ? 'header--col-sup-last' : ''
          }`"
          :style="`height: ${configTableLive.header.height}px`"
        >
          <span
            v-text="
              getTranslatedValue(
                header.translateRoute,
                header.name[globalStore.lang],
              )
            "
          ></span>
          <button
            @click="expandCol[header.code] = !expandCol[header.code]"
            v-if="header.expand"
            class="btnExpand"
          >
            <span
              :class="`u u-${header.icon || 'chevron-right'}`"
              :style="`transform: rotate(${
                expandCol[header.code] ? 0 : 180
              }deg)`"
            ></span>
          </button>
        </div>
        <div
          class="header--col-inf"
          :style="`grid-template-columns: ${getGridColumns(
            'subheader',
            header.subcols,
            header,
          )}; height: ${configTableLive.header.subheight}px`"
        >
          <div
            :class="`header--col-cell cell ${subheader.flex}`"
            v-for="subheader in filteredSubcols(header)"
            :key="subheader.order"
          >
            <template v-if="subheader.type !== 'actions'">
              <u-checkbox
                v-if="subheader.type === 'selected' && props.content.length"
                v-model="selectAll"
                @click="selectedList"
              />
              <span
                v-else
                v-text="
                  getTranslatedValue(
                    subheader.translateRoute,
                    subheader.name[globalStore.lang],
                  )
                "
              ></span>
            </template>
            <template v-else>
              <u-button-icon
                v-for="act in subheader.actionsGlobal"
                :key="act.emit"
                :icon="act.icon"
                type="text"
                size="s"
                :color="act.color || '--neutral-text-caption'"
                :colorHover="act.colorHover || '--neutral-text-subtitle'"
                :colorAcctive="act.colorActive || '--neutral-text-body'"
                @click="emit('actionTable', { emit: act.emit })"
              />
            </template>
          </div>
        </div>
      </div>
    </div>
    <div v-if="props.loading" class="waitData">
      <u-loading :width="14" />
      <span
        style="margin-left: 10px"
        v-text="getTranslatedValue('global.text.loading')"
      ></span>
    </div>
    <div v-else-if="!props.content.length" class="notData">
      <span> {{ getTranslatedValue("global.text.noResults") }}</span>
      <u-tax :width="80" />
      <span> {{ getTranslatedValue("global.text.RememberDateFilters") }}</span>
    </div>
    <div v-else v-bind="wrapperProps">
      <div
        class="item"
        v-for="item in list"
        :key="item.index"
        :style="`grid-template-columns: ${getGridColumns(
          'header',
          configTableLive.cols,
        )}`"
      >
        <div
          class="item--col"
          v-for="header in configTableLive.cols"
          :key="header.order"
          :style="`grid-template-columns: ${getGridColumns(
            'subheader',
            header.subcols,
            header,
          )}`"
        >
          <template
            v-for="subheader in filteredSubcols(header)"
            :key="subheader.order"
          >
            <!-- /actions /avatar /avatarText /date /currency /tag /text -->

            <!-- SELECTED -->
            <div
              :class="{
                'item--col-cell': true,
                center: true,
                selected: item.data.selected,
              }"
              v-if="subheader.type === 'selected'"
            >
              <u-checkbox
                v-model="item.data.selected"
                @click="selectedItem(item.data.selected)"
              />
            </div>

            <!-- ACTIONS -->
            <div
              :class="{
                'item--col-cell': true,
                selected: item.data.selected,
                [subheader.flex]: true,
              }"
              v-if="subheader.type === 'actions'"
              style="padding: 0 16px 0 0"
            >
              <u-button-icon
                v-for="act in subheader.actions"
                :key="act.emit"
                :icon="act.icon"
                type="text"
                size="s"
                :color="act.color || '--neutral-text-caption'"
                :colorHover="act.colorHover || '--neutral-text-subtitle'"
                :colorAcctive="act.colorActive || '--neutral-text-body'"
                @click="
                  emit('actionTable', {
                    emit: act.emit,
                    data: item.data,
                    pos: item.index,
                  })
                "
              />
            </div>

            <!-- AVATAR -->
            <button
              v-if="subheader.type === 'avatar'"
              @click="goToPage(subheader, item.data, item.index)"
              :style="`cursor: ${
                subheader.path || subheader.emit ? 'pointer' : 'auto'
              }`"
              :class="{
                'item--col-cell': true,
                center: true,
                selected: item.data.selected,
              }"
            >
              <u-avatar
                :user="{
                  name: getValueByPath(
                    item.data,
                    subheader.prop.name,
                    subheader.prop.name_fallback,
                  ),
                  src: getValueByPath(
                    item.data,
                    subheader.prop.src,
                    subheader.prop.src_fallback,
                  ),
                }"
                :size="subheader.sizeAvatar || 32"
              />
            </button>

            <!-- AVATAR WITH TEXT -->
            <button
              v-if="subheader.type === 'avatarText'"
              :title="getValueByPath(item.data, subheader.prop.text)"
              @click="goToPage(subheader, item.data, item.index)"
              :style="`cursor: ${
                subheader.path || subheader.emit ? 'pointer' : 'auto'
              }`"
              :class="{
                'item--col-cell': true,
                avatarText: true,
                selected: item.data.selected,
              }"
            >
              <u-avatar
                :user="{
                  name: getValueByPath(
                    item.data,
                    subheader.prop.name,
                    subheader.prop.name_fallback,
                  ),
                  src: getValueByPath(
                    item.data,
                    subheader.prop.src,
                    subheader.prop.src_fallback,
                  ),
                }"
                :size="subheader.sizeAvatar || 32"
              />
              <span class="truncateText">
                {{
                  getValueByPath(
                    item.data,
                    subheader.prop.name,
                    subheader.prop.name_fallback,
                  ) +
                  " " +
                  getValueByPath(
                    item.data,
                    subheader.prop.secondName,
                    subheader.prop.secondName_fallback,
                  )
                }}
              </span>
            </button>

            <!-- MULTI AVATAR -->
            <button
              v-if="subheader.type === 'multiAvatar'"
              @click="goToPage(subheader, item.data, item.index)"
              :style="`cursor: ${
                subheader.path || subheader.emit ? 'pointer' : 'auto'
              }`"
              :class="{
                'item--col-cell': true,
                multiAvatar: true,
                selected: item.data.selected,
              }"
            >
              <u-avatar
                v-for="(user, u) in getValueByPath(
                  item.data,
                  subheader.prop.array,
                ).length > 4
                  ? getValueByPath(item.data, subheader.prop.array).slice(0, 4)
                  : getValueByPath(item.data, subheader.prop.array)"
                :key="u"
                :user="{
                  name: user[subheader.prop.name],
                  src: user[subheader.prop.src],
                }"
                class="avatarModify"
                :size="subheader.sizeAvatar || 32"
              />
              <div
                v-if="
                  getValueByPath(item.data, subheader.prop.array).length > 4
                "
                class="counter"
                :style="`background-color: var(${
                  header.colorCounter || '--primary-surface-default'
                });`"
              >
                <span
                  >+{{
                    getValueByPath(item.data, subheader.prop.array).length >=
                    100
                      ? 99
                      : getValueByPath(item.data, subheader.prop.array).length -
                        4
                  }}</span
                >
              </div>
            </button>

            <!-- DATE -->
            <button
              @click="goToPage(subheader, item.data, item.index)"
              :style="`cursor: ${
                subheader.path || subheader.emit ? 'pointer' : 'auto'
              }`"
              :class="{
                'item--col-cell': true,
                date: true,
                selected: item.data.selected,
              }"
              v-if="subheader.type === 'date'"
            >
              <span>{{
                transformedDate(getValueByPath(item.data, subheader.prop.text))
              }}</span>
            </button>

            <!-- CURRENCY -->
            <button
              v-if="subheader.type === 'currency'"
              @click="goToPage(subheader, item.data, item.index)"
              :style="`cursor: ${
                subheader.path || subheader.emit ? 'pointer' : 'auto'
              }`"
              :class="{
                'item--col-cell': true,
                right: true,
                selected: item.data.selected,
              }"
            >
              <span
                :style="`color: ${getCurrencyColor(getValueByPath(item.data, subheader.prop.text))};`"
                v-text="getValueByPath(item.data, subheader.prop.text)"
              ></span>
            </button>

            <!-- TAG -->
            <button
              v-if="subheader.type === 'tag'"
              @click="goToPage(subheader, item.data, item.index)"
              :style="`cursor: ${
                subheader.path || subheader.emit ? 'pointer' : 'auto'
              }`"
              :class="{ 'item--col-cell': true, selected: item.data.selected }"
            >
              <div class="pills">
                <u-tags
                  v-for="(tag, t) in getValueByPath(
                    item.data,
                    subheader.prop.text,
                  )"
                  :key="t"
                  :text="
                    getTranslatedValue(
                      tag.translateRoute,
                      tag.name[globalStore.lang],
                    )
                  "
                  size="s"
                  :background="
                    subheader.backgroundTag || '--primary-surface-shadow-8a'
                  "
                  :color="subheader.colorTag || '--primary-text-default'"
                  :delete="false"
                />
              </div>
            </button>

            <!-- PLAIN TEXT -->
            <button
              v-if="subheader.type === 'text'"
              :title="getValueByPath(item.data, subheader.prop.text)"
              @click="goToPage(subheader, item.data, item.index)"
              :style="`cursor: ${
                subheader.path || subheader.emit ? 'pointer' : 'auto'
              }`"
              :class="{ 'item--col-cell': true, selected: item.data.selected }"
            >
              <span
                v-text="getValueByPath(item.data, subheader.prop.text)"
                class="truncateText"
              ></span>
            </button>

            <!-- DOUBLE TEXT -->
            <button
              v-if="subheader.type === 'textDouble'"
              :title="`${getValueByPath(
                item.data,
                subheader.prop.text,
              )}\u000A${getValueByPath(item.data, subheader.prop.subtext)}`"
              @click="goToPage(subheader, item.data, item.index)"
              :style="`cursor: ${
                subheader.path || subheader.emit ? 'pointer' : 'auto'
              }`"
              :class="{
                'item--col-cell': true,
                textDouble: true,
                selected: item.data.selected,
              }"
            >
              <span
                v-text="getValueByPath(item.data, subheader.prop.text)"
                class="truncateText"
              ></span>
              <span
                v-text="getValueByPath(item.data, subheader.prop.subtext)"
                class="truncateText"
              ></span>
            </button>

            <!-- CUSTOM -->
            <button
              @click="goToPage(subheader, item.data, item.index)"
              :style="`cursor: ${
                subheader.path || subheader.emit ? 'pointer' : 'auto'
              }`"
              :class="{ 'item--col-cell': true, selected: item.data.selected }"
              v-if="subheader.type === 'custom'"
            >
              <slot :name="subheader.slotName" :item="item.data"></slot>
            </button>
          </template>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
span,
button {
  font-family: Nunito;
}
/* General */
.table {
  width: 100%;
  height: auto;
  overflow: auto;
  position: relative;
  transition: 0.3s;
}
.table--full-screen {
  width: calc(100vw - 40px);
}
.table::-webkit-scrollbar {
  width: 10px;
  height: 10px;
}

.table::-webkit-scrollbar-thumb {
  border-radius: 5px;
  background-color: var(--neutral-border-default);
}

.table::-webkit-scrollbar-track {
  background-color: var(--neutral-border-darker);
  border-radius: 4px;
}
.header {
  position: sticky;
  top: 0;
  background-color: var(--neutral-background-default);
  z-index: 1;
}
.header,
.item {
  width: 100%;
  display: grid;
}
.btnExpand {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 20px;
  height: 20px;
}
.btnExpand span {
  font-size: 20px !important;
  font-weight: 400 !important;
  transition: 0.3s;
}
.btnExpand:hover span {
  color: var(--primary-text-default);
}

/* Header */
.header--col {
  border-right: 1px solid var(--neutral-border-subtle);
  border-top: 1px solid var(--neutral-border-subtle);
  border-bottom: 1px solid var(--neutral-border-subtle);
}
.header--col:first-child {
  border-left: 1px solid var(--neutral-border-subtle);
  border-radius: 16px 0 0 0;
}
.header--col:last-child {
  border-radius: 0 20px 0 0;
}
.item--col:last-child {
  border-right: 1px solid var(--neutral-border-subtle);
}
.item:last-child .item--col:last-child {
  border-radius: 0 0 20px 0;
}
.item--col:first-child {
  border-left: 1px solid var(--neutral-border-subtle);
}
.item:last-child .item--col:first-child {
  border-radius: 0 0 0 20px;
}
.item--col {
  border-right: 1px solid var(--neutral-border-subtle);
}
.item--col:first-child {
  border-left: 1px solid var(--neutral-border-subtle);
}
.item--col-cell {
  border-bottom: 1px solid var(--neutral-border-subtle);
}

.header--col,
.item--col {
  overflow: hidden;
  display: grid;
}
.header--col-sup {
  background-color: var(--neutral-surface-light);
  border-bottom: 1px solid var(--neutral-border-subtle);
}
.header--col-inf {
  background-color: var(--neutral-surface-softer);
  display: grid;
}
.header span {
  color: var(--neutral-text-caption);
  font-size: 14px;
  font-weight: 600;
  line-height: 18px;
  text-align: justified;
}
/* .header--col-cell:not(:last-child) {
    border-right: 1px solid var(--neutral-border-subtle);
  } */

/* Generic */
.cell,
.item--col-cell {
  display: flex;
  align-items: center;
  gap: 10px;
  box-sizing: border-box;
  padding: 0 16px;
}
.item .item--col-cell {
  transition: 0.3s ease;
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

/* Item */
.item {
  height: v-bind("configTable.item.height + 'px'");
}
.item:hover .item--col-cell:not(.selected) {
  background-color: var(--primary-surface-shadow-8a);
}
.item .item--col-cell.selected {
  background-color: var(--primary-surface-shadow-8a);
}
.avatarText {
  display: grid;
  grid-template-columns: auto 1fr;
}
.avatarText span,
.date span {
  padding: 0px -2px;
  font-size: 14px;
  font-weight: 600;
  line-height: 18px;
  text-align: left;
  color: var(--neutral-text-body);
}
.textDouble {
  display: grid;
  grid-template-rows: 20px 20px;
  gap: 0px;
  align-content: center;
}
.textDouble span:nth-child(2) {
  color: var(--neutral-text-caption);
}
.textDouble span {
  line-height: 20px;
}
.multiAvatar {
  position: relative;
}
.avatarModify:not(:nth-child(1)) {
  margin-left: -30px;
  box-shadow:
    rgba(60, 64, 67, 0.3) 0px 1px 2px 0px,
    rgba(60, 64, 67, 0.15) 0px 1px 3px 1px;
}
.counter {
  height: 32px;
  width: 32px;
  border-radius: 50%;
  display: flex;
  justify-content: center;
  align-items: center;
  position: absolute;
  left: 70px;
}
.counter span {
  font-weight: 600;
  font-size: 14px;
  line-height: 14px;
  color: var(--neutral-background-default) !important;
}
.pills {
  width: 100%;
  overflow-y: auto;
  display: flex;
  gap: 10px;
}
.pills::-webkit-scrollbar {
  width: 0px;
  height: 0px;
}
.waitData {
  width: calc(100vw - v-bind("props.fullScreen ? '40px' : '140px'"));
  position: sticky;
  left: 0;
  height: 56px;
  display: flex;
  justify-content: center;
  align-items: center;
}
.waitData span {
  color: var(--neutral-text-caption);
  text-align: center;
}
.notData {
  height: 250px;
  width: 100%;
  gap: 20px;
  left: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}
.notData span {
  font-size: 16px;
  color: var(--neutral-text-caption);
  text-align: center;
}

.item--col-cell span {
  font-size: 14px;
  font-weight: 600;
  color: var(--neutral-text-body);
}
.textDouble span:nth-child(2) {
  font-weight: 400;
}
.hidden {
  display: none;
}
</style>
