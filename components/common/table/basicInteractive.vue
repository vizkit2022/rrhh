<script setup>
  import { defineProps, ref, defineEmits, watch } from "vue";
  import useGlobalStore from "@/stores/global";
  import { useVirtualList } from "@vueuse/core";
  import { transformedDate } from "@/utils/helpers";
  import { useI18n } from "vue-i18n";

  const { t } = useI18n();

  // Stores
  const globalStore = useGlobalStore();
  
  // Props
  const props = defineProps({
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

  // Computed
  
  const computedList = ref(props.content);

  watch(
    () => props.content,
    (newContent) => {
      computedList.value = newContent;
    },
    { deep: true } // Profundizar en el array para detectar cambios
  );

  // Virtual List
  const { list, containerProps, wrapperProps } = useVirtualList(computedList, {
    itemHeight: props.configTable.item.height || 52,
  });

  // Contants
  const emit = defineEmits(["actionTable"]);
  const selectAll = ref(false);
  const router = useRouter();

  // Functions
  const getGridColumns = (type, cols) => {
    if (type === "header") {
      return cols.map((col) => col.width).join(" ") || "1fr";
    }
    return "1fr";
  };

  // Extras
  const getValueByPath = (obj, path) => {
    if (path) {
      const segments = path.split("/");

      for (const segment of segments) {
        if (segment.startsWith("[") && segment.endsWith("]")) {
          const index = parseInt(segment.slice(1, -1));
          if (!Array.isArray(obj)) {
            throw new Error("Expected an array");
          }
          obj = obj[index];
        } else {
          if (typeof obj !== "object" || obj === null) {
            throw new Error("Expected an object");
          }
          if (!(segment in obj)) {
            return "";
          }
          obj = obj[segment];
        }
      }

      return obj;
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
      router.replace(newPath);
    }
    if (header.emit) {
      emit("actionTable", { emit: header.emit.name, data, pos });
    }
  };

  const getTranslatedValue = (key, fallback='') => {
    // Verifica si `key` está definido y no es nulo
    if (!key) return fallback;
    
    // Intenta traducir usando i18n
    const translation = t(key);

    // Si la traducción existe y es diferente de la clave original, úsala; de lo contrario, usa el valor de fallback
    return translation && translation !== key ? translation : fallback;
  };

  watch(
    () => props.content,
    (newContent) => {
      computedList.value = newContent;

      // Desactiva selectAll si no hay elementos en el contenido
      if (newContent.length === 0) {
        selectAll.value = false;
      }
    },
    { deep: true }
  );

</script>

<template>
  <div
    class="table"
    v-bind="containerProps"
  >
    <div
      class="header"
      :style="`grid-template-columns: ${getGridColumns(
        'header',
        props.configTable.cols
      )}`"
    >
      <div
        :class="{ 'header--col': true, [header.flex]: true }"
        v-for="header in props.configTable.cols"
        :key="header.order"
        :style="`height: ${props.configTable.header.height}px; padding: ${
          header.type !== 'actions' ? '0 16px' : '0'
        }`"
      >
        <template v-if="header.type !== 'actions'">
          <u-checkbox
            v-if="header.type === 'selected'"
            v-model="selectAll"
            @click="selectedList"
          />
          <span v-else v-text="getTranslatedValue(header.translateRoute , header.name?.[globalStore.lang] ?? '')"></span>
        </template>
        <template v-else>
          <u-button-icon
            v-for="act in header.actionsGlobal"
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
    <div v-if="props.loading" class="waitData">
      <u-loading :width="14" />
      <span style="margin-left: 10px" v-text="getTranslatedValue('global.text.loading')"></span>
    </div>
    <div v-else-if="!props.content.length" class="notData">
      <u-tax :width="80" />
      <span> {{getTranslatedValue('global.text.noResults')}}</span>
    </div>
    <div v-else v-bind="wrapperProps">
      <div
        class="item"
        v-for="item in list"
        :key="item.index"
        :style="`grid-template-columns: ${getGridColumns(
          'header',
          props.configTable.cols
        )}`"
      >
        <template v-for="header in props.configTable.cols" :key="header.order">
          <!-- /actions /avatar /avatarText /date /currency /tag /text -->

          <!-- SELECTED -->
          <div
            :class="{
              'item--col': true,
              center: true,
              selected: item.data.selected,
            }"
            v-if="header.type === 'selected'"
          >
            <u-checkbox
              v-model="item.data.selected"
              @click="selectedItem(item.data.selected)"
            />
          </div>

          <!-- ACTIONS -->
          <div
            v-if="header.type === 'actions'"
            :class="{
              'item--col': true,
              selected: item.data.selected,
              [header.flex]: true,
            }"
            style="padding: 0"
          >
            <u-button-icon
              v-for="act in header.actions"
              :key="act.emit"
              :icon="act.icon"
              type="text"
              size="s"
              :color="act.color || '--neutral-text-caption'"
              :colorHover="act.colorHover || '--neutral-text-subtitle'"
              :colorAcctive="act.colorActive || '--neutral-text-body'"
              @click="
                emit('actionTable', { emit: act.emit, data: item.data, i })
              "
            />
          </div>

          <!-- AVATAR -->
          <button
            v-if="header.type === 'avatar'"
            @click="goToPage(header, item.data, item.index)"
            :class="{
              'item--col': true,
              center: true,
              selected: item.data.selected,
            }"
            :style="`cursor: ${
              header.path || header.emit ? 'pointer' : 'auto'
            }`"
          >
            <u-avatar
              :user="{
                name: getValueByPath(item.data, header.prop.name),
                src: getValueByPath(item.data, header.prop.src),
              }"
              :size="header.sizeAvatar || 32"
            />
          </button>

          <!-- AVATAR WITH TEXT -->
          <button
            v-if="header.type === 'avatarText'"
            @click="goToPage(header, item.data, item.index)"
            :style="`cursor: ${
              header.path || header.emit ? 'pointer' : 'auto'
            }`"
            :class="{
              'item--col': true,
              avatarText: true,
              selected: item.data.selected,
            }"
          >
            <u-avatar
              :user="{
                name: getValueByPath(item.data, header.prop.name),
                src: getValueByPath(item.data, header.prop.src),
              }"
              :size="header.sizeAvatar || 32"
            />
            <span class="truncateText">
              {{
                getValueByPath(item.data, header.prop.name) +
                " " +
                getValueByPath(item.data, header.prop.secondName)
              }}
            </span>
          </button>

          <!-- MULTI AVATAR -->
          <button
            v-if="header.type === 'multiAvatar'"
            @click="goToPage(header, item.data, item.index)"
            :style="`cursor: ${
              header.path || header.emit ? 'pointer' : 'auto'
            }`"
            :class="{
              'item--col': true,
              multiAvatar: true,
              selected: item.data.selected,
            }"
          >
            <u-avatar
              v-for="(user, u) in getValueByPath(item.data, header.prop.array)
                .length > 4
                ? getValueByPath(item.data, header.prop.array).slice(0, 4)
                : getValueByPath(item.data, header.prop.array)"
              :key="u"
              :user="{
                name: user[header.prop.name],
                src: user[header.prop.src],
              }"
              class="avatarModify"
              :size="header.sizeAvatar || 32"
            />
            <div
              v-if="getValueByPath(item.data, header.prop.array).length > 4"
              class="counter"
              :style="`background-color: var(${
                header.colorCounter || '--neutral-surface-default'
              });`"
            >
              <span
                >+{{
                  getValueByPath(item.data, header.prop.array).length >= 100
                    ? 99
                    : getValueByPath(item.data, header.prop.array).length - 4
                }}</span
              >
            </div>
          </button>

          <!-- DATE -->
          <button
            v-if="header.type === 'date'"
            @click="goToPage(header, item.data, item.index)"
            :class="{
              'item--col': true,
              date: true,
              selected: item.data.selected,
            }"
            :style="`cursor: ${
              header.path || header.emit ? 'pointer' : 'auto'
            }`"
          >
            <span>{{
              transformedDate(getValueByPath(item.data, header.prop.text))
            }}</span>
          </button>

          <!-- CURRENCY -->
          <button
            v-if="header.type === 'currency'"
            @click="goToPage(header, item.data, item.index)"
            :style="`cursor: ${
              header.path || header.emit ? 'pointer' : 'auto'
            }`"
            :class="{
              'item--col': true,
              right: true,
              selected: item.data.selected,
            }"
          >
            <span v-text="getValueByPath(item.data, header.prop.text)"></span>
          </button>

          <!-- TAG -->
          <button
            v-if="header.type === 'tag'"
            @click="goToPage(header, item.data, item.index)"
            :style="`cursor: ${
              header.path || header.emit ? 'pointer' : 'auto'
            }`"
            :class="{ 'item--col': true, selected: item.data.selected }"
          >
            <div class="pills">
              <u-tags
                v-for="(tag, t) in getValueByPath(item.data, header.prop.text)"
                :key="t"
                :text="tag.name[globalStore.lang]"
                size="s"
                :background="header.backgroundTag || '--primary-surface-shadow-8a'"
                :color="header.colorTag || '--primary-text-default'"
                :delete="false"
              />
            </div>
          </button>

          <!-- PLAIN TEXT -->
          <button
            v-if="header.type === 'text'"
            @click="goToPage(header, item.data, item.index)"
            :style="`cursor: ${
              header.path || header.emit ? 'pointer' : 'auto'
            }`"
            :class="{ 'item--col': true, selected: item.data.selected }"
          >
            <span
              v-text="getValueByPath(item.data, header.prop.text)"
              class="truncateText"
            ></span>
          </button>

          <!-- DOUBLE TEXT -->
          <button
            v-if="header.type === 'textDouble'"
            @click="goToPage(header, item.data, item.index)"
            :style="`cursor: ${
              header.path || header.emit ? 'pointer' : 'auto'
            }`"
            :class="{
              'item--col': true,
              textDouble: true,
              selected: item.data.selected,
            }"
          >
            <span
              v-text="getValueByPath(item.data, header.prop.text)"
              class="truncateText"
            ></span>
            <span
              v-text="getValueByPath(item.data, header.prop.subtext)"
              class="truncateText"
            ></span>
          </button>

          <!-- CUSTOM -->
          <button
            v-if="header.type === 'custom'"
            @click="goToPage(header, item.data, item.index)"
            :style="`cursor: ${
              header.path || header.emit ? 'pointer' : 'auto'
            }`"
            :class="{ 'item--col': true, selected: item.data.selected }"
          >
            <slot :name="header.slotName" :item="item.data"></slot>
          </button>
        </template>
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
 
  .table::-webkit-scrollbar {
    width: 10px;
    height: 10px;
  }

  .table::-webkit-scrollbar-thumb {
    border-radius: 5px;
    background-color: var(--neutral-border-subtle);
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

  /* Header */
  .header--col {
    background-color: var(--neutral-background-darker);
    border-top: 1px solid var(--neutral-border-subtle);
    border-bottom: 1px solid var(--neutral-border-subtle);
  }
  .header--col:first-child {
    border-left: 1px solid var(--neutral-border-subtle);
    border-radius: 20px 0 0 0;
  }
  .header--col:last-child {
    border-right: 1px solid var(--neutral-border-subtle);
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
    border-bottom: 1px solid var(--neutral-border-subtle);
  }
  .header--col {
    display: grid;
  }
  .header span {
    color: var(--neutral-text-caption);
    font-size: 12px;
    font-weight: 600;
    line-height: 18px;
  }

  /* Generic */
  .header--col,
  .item--col {
    display: flex;
    align-items: center;
    gap: 10px;
    box-sizing: border-box;
    padding: 0 16px;
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
    height: v-bind("props.configTable.item.height + 'px'");
  }
  .item:hover .item--col:not(.selected) {
    background-color: var(--primary-surface-shadow-8a);
  }
  .item .item--col.selected {
    background-color: var(--primary-surface-shadow-8a);
  }
  .avatarText {
    display: grid;
    grid-template-columns: auto 1fr;
  }
  .avatarText span,
  .date span {
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
    box-shadow: rgba(60, 64, 67, 0.3) 0px 1px 2px 0px,
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
    box-shadow: rgba(60, 64, 67, 0.3) 0px 1px 2px 0px,
      rgba(60, 64, 67, 0.15) 0px 1px 3px 1px;
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
    width: 100%; /* ante estaba asi pero se puede dar casos donde la tabla no sea dicho tamaño calc(100vw - v-bind("props.fullScreen ? '40px' : '140px'")); */
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
    height: 170px;
    width: 100%;
    gap: 5px;
    left: 0;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
  }
  .notData span {
    color: var(--neutral-text-caption);
    text-align: center;
  }
  
  .item--col span {
    font-size: 14px;
    font-weight: 600;
    color: var(--neutral-text-body);
  }
  .textDouble span:nth-child(2) {
    font-weight: 400;
  }
</style>

<!-- EXAMPLE -->
<!-- const configTable = {
  header: {
    height: 52,
  },
  item: {
    height: 52,
  },
  cols: [
    {
      name: { es: "", en: "" },
      flex: "center",
      width: "60px",
      order: 1,
      prop: {
        text: "state",
      },
      type: "selected",
    },
    {
      name: { es: "", en: "" },
      flex: "left",
      width: "180px",
      order: 2,
      prop: {
        text: "state",
      },
      type: "actions",
      // solo si es de type actions
      actions: [
        {
          emit: "delete",
          icon: "delete",
          color: "--bg-danger-500",
          colorHover: "--bg-danger-600",
          colorActive: "--bg-danger-700",
        },
        {
          emit: "edit",
          icon: "edit",
          color: "--bg-info-500",
          colorHover: "--bg-info-600",
          colorActive: "--bg-info-700",
        },
        {
          emit: "new",
          icon: "new-project",
          color: "--bg-primary-500",
          colorHover: "--bg-primary-600",
          colorActive: "--bg-primary-700",
        },
        {
          emit: "show",
          icon: "file-code",
          color: "--bg-warning-500",
          colorHover: "--bg-warning-600",
          colorActive: "--bg-warning-700",
        },
        // si no se pasan los colores por defecto sera la escala de neutral (500, 600 y 700)
      ],
      // solo si es de type actions a nivel del header
      actionsGlobal: [
        {
          emit: "deleteGlobal",
          icon: "delete",
          color: "--bg-danger-500",
          colorHover: "--bg-danger-600",
          colorActive: "--bg-danger-700",
        },
        {
          emit: "newGlobal",
          icon: "new-project",
          color: "--bg-primary-500",
          colorHover: "--bg-primary-600",
          colorActive: "--bg-primary-700",
        },
      ],
    },
    {
      name: { es: "Avatar", en: "Avatar" },
      flex: "left",
      width: "120px",
      order: 1,
      prop: {
        name: "user/id/name",
        src: "user/id/image",
      },
      type: "avatar",
      sizeAvatar: 32, // por defecto es 40, solo si se usa el type Avatar
      path: {
        route: "/profile/[idUser]", // lo que dentro del [] es dinamico, y ahi se pone el nombre de la prop a leer, la prop contiene la ubicacion de lo que quiero pintar ahi
        idUser: "user/id/__id",
      },
    },
    {
      name: { es: "MultiAvatars", en: "Sales" },
      flex: "left",
      width: "150px",
      order: 2,
      prop: {
        array: "users",
        name: "name", // propiedad del objeto de cadda elemento del users que contiene el nombre
        src: "imgUrl", // propiedad del objeto user que contiene la url
      },
      type: "multiAvatar",
      sizeAvatar: 32, // por defecto es 40, solo si se usa el type Avatar
      colorCounter: "--bg-danger-500", // solo para el multiAvatars, por defecto es primary
      emit: {
        name: "showModal",
      },
    },
    {
      name: { es: "AvatarText", en: "AvatarText" },
      flex: "left",
      width: "minmax(250px, 1fr)",
      order: 3,
      prop: {
        name: "user/id/name",
        src: "user/id/image",
      },
      type: "avatarText",
      sizeAvatar: 32,
      emit: {
        name: "showModal",
      },
    },
    {
      name: { es: "Date", en: "Date" },
      flex: "left",
      width: "minmax(150px, 1fr)",
      order: 1,
      prop: {
        text: "createdAt",
      },
      type: "date",
    },
    {
      name: { es: "Currency", en: "Sales" },
      flex: "right",
      width: "minmax(150px, 1fr)",
      order: 2,
      prop: {
        text: "numbers/number/sumprice/value",
      },
      type: "currency",
    },
    {
      name: { es: "Text", en: "Text" },
      flex: "left",
      width: "minmax(150px, 1fr)",
      order: 3,
      prop: { text: "ventas/ventas8" },
      type: "text",
    },
    {
      name: { es: "TextDouble", en: "TextDouble" },
      flex: "left",
      width: "minmax(150px, 1fr)",
      order: 3,
      prop: { text: "text/main", subtext: "text/second" },
      type: "textDouble",
    },
    {
      name: { es: "Pills", en: "Sales" },
      flex: "left",
      width: "minmax(200px, 5fr)",
      order: 3,
      prop: { text: "roles" },
      type: "tag",
      backgroundTag: "--bg-info-100", // opcionales, solo para type tag, por defecto usa primary-100
      colorTag: "--bg-info-500", // opcionales, solo para type tag, por defecto usa primary-500
    },
    {
      name: { es: "Custom", en: "Sales" },
      flex: "left",
      width: "minmax(200px, 5fr)",
      order: 3,
      prop: { text: "numbers/number/sumprice/value" },
      type: "custom",
      slotName: "prueba",
    },
  ],
}; -->
