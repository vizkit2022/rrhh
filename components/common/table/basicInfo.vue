<script setup>
  import { defineEmits, defineProps, ref, watch } from "vue";
  import useGlobalStore from "@/stores/global";
  const globalStore = useGlobalStore();

  import { useVirtualList } from "@vueuse/core";

  const router = useRouter();
  const { params } = useRoute();
  const idIncome = params && params.id ? params.id : null;
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
      default: false,
    },
    redirect: {
      type: Boolean,
      default: false,
    },
    showModal: {
      type: Boolean,
      default: false,
    },
    refreshHeaders: {
      type: Number,
      default: 0,
    },
    height: {
      type: String,
      default: "100vh - 372px",
    },
    fullScreenHeight: {
      type: String,
      default: "100vh - 80px",
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
    emit("selectAllItems", allItems.value);
  };

  const selectItem = (val, pos) => {
    emit("selectItem", val.selected, val.id, pos);
    allItems.value = props.content.every((c) => c.selected);
  };

  const goToPage = (item) => {
    if (item.path) {
      if (item.path.includes("withoutProjectId")) {
        const newPath = item.path.replace("withoutProjectId", idIncome);
        router.push(newPath);
      } else {
        router.push(item.path);
      }
    } else {
      const path = `/incomesv2/project/${item.project}/income/${item.id}`;
      router.push(path);
    }
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
        Conciliado:
          "background-color: var(--bg-success-200); color: var(--bg-success-500);",
        "No Conciliado":
          "background-color: var(--bg-danger-200); color: var(--bg-danger-500);",
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
    "showModal",
  ]);

  const showModal = (item) => {
    emit("showModal", item);
  };

  watch(
    () => props.headers,
    () => {
      gridColumns.value = getGridColumns();
      minWidth.value = sumGridValues(props.headers);
    }
  );

  const contentTable = computed(() => {
    return props.content;
  });

  //Virtual List
  const { list, containerProps, wrapperProps } = useVirtualList(contentTable, {
    itemWidth: 200,
    itemHeight: 52,
  });

  const calcHeight = () => {
    const height = props.fullScreen ? props.fullScreenHeight : props.height;
    return `calc(${height})`;
  };
</script>

<template>
  <div v-bind="containerProps" class="table">
    <div class="table__header">
      <div v-for="(header, h) in props.headers" :key="h">
        <u-checkbox
          v-if="header.type === 'checkbox'"
          v-model="allItems"
          @click="selectAll"
          :disabled="!contentTable.length"
        />
        <div v-else>
          <span>{{ header.label }}</span>
          <button v-if="header.button"><span class="u u-Sort"></span></button>
        </div>
      </div>
    </div>
    <div v-if="props.loading" class="containerMsg">
      <u-loading />
      <span>Cargando...</span>
    </div>
    <template v-else-if="contentTable.length">
      <div class="table__item" v-for="(item, i) in contentTable" :key="i">
        <button
          v-for="(col, c) in props.headers"
          :key="c"
          :class="getClassByCol(col.type)"
          class="col"
          @click="
            props.redirect && col.type !== 'checkbox'
              ? goToPage(item)
              : props.showModal
              ? col.type === 'checkbox'
                ? ''
                : showModal(item)
              : ''
          "
        >
          <u-checkbox
            v-if="col.type === 'checkbox'"
            v-model="item[col.property]"
            @click="selectItem(item, i)"
          />
          <span
            class="truncateText"
            style="width: 100%; display: block"
            v-if="col.type === 'text'"
            v-text="item[col.property]"
          ></span>
          <div class="tag">
            <span
              v-if="col.type === 'tag'"
              v-text="getNameByType(item[col.property], col.property)"
              :style="stylesColorState(item[col.property], col.property)"
            ></span>
          </div>
          <template v-if="col.type === 'avatar'">
            <u-avatar
              :size="32"
              :user="{ name: item.name, src: item[col.property + '_img'] }"
            />
            <span class="truncateText">{{ item[col.property] }} </span>
          </template>
          <div class="tagsRoles" v-if="col.type === 'tagsRoles'">
            <u-tags
              v-for="(tag, t) in item['rol']"
              :key="t"
              :text="tag.name[globalStore.lang]"
              size="s"
              color="--bg-primary-500"
              background="--bg-primary-100"
              :delete="false"
            />
          </div>

          <template v-if="col.type === 'avatar-crew'">
            <div class="avatar-crew">
              <div>
                <u-avatar
                  :size="32"
                  :user="{ name: item.name, src: item[col.property + '_img'] }"
                />
                <span class="truncateText">{{ item[col.property] }} </span>
              </div>
              <span id="staff" v-if="col.property === 'nameUser' && item.member"
                >MIEMBRO</span
              >
            </div>
          </template>
          <span
            v-if="col.type === 'mount'"
            v-text="item[col.property] !== null ? item[col.property] : '-'"
          ></span>
          <button
            v-if="col.type === 'btnAmount'"
            class="btnAmount"
            @click="showModal(item)"
          >
            <span>{{ item[col.property] }}</span>
          </button>
          <div v-if="col.type === 'row2'" class="row2">
            <span
              v-text="item[col.property]?.textMain || '...'"
              class="truncateText"
            ></span>
            <span
              v-text="item[col.property]?.textSecond || '...'"
              class="truncateText"
            ></span>
          </div>
        </button>
      </div>
    </template>
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
    color: var(--neutral-text-caption);
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
  .table::-webkit-scrollbar,
  .tagsRoles::-webkit-scrollbar {
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
    border-bottom: 1px solid var(--neutral-border-light);
  }
  .table__header {
    position: sticky;
    left: 0;
    top: 0;
    height: 56px;
    background-color: var(--neutral-surface-softer);
    z-index: 1;
  }
  .table__item {
    height: 52px;
    background-color: var(--neutral-background-default);
    transition: 0.3s;
  }

  .table__item:hover {
    background-color: var(--primary-surface-shadow-8a);
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
    color: var(--neutral-text-caption);
  }

  .table__item .col {
    text-align: left;
    padding-right: 5px;
    cursor: v-bind("props.redirect || props.showModal ? 'pointer' : 'auto'");
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
    color: var(--bg-neutral-300);
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
    color: var(--neutral-text-body);
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
  .avatar-crew {
    width: 100%;
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 10px;
  }
  .avatar-crew div {
    display: flex;
    gap: 10px;
    align-items: center;
  }
  #staff {
    color: var(--bg-secondary-500);
    font-family: Nunito;
    font-size: 10px;
    font-weight: 800;
    line-height: 14px;
    letter-spacing: 0.1em;
    text-align: left;
  }
  .tagsRoles {
    display: flex;
    width: 100%;
    gap: 5px;
    overflow-x: auto;
  }

  .btnAmount {
    width: 100%;
    height: 100%;
    transition: 0.3s;
  }
  .btnAmount span {
    font-family: Nunito;
    font-size: 14px;
    font-weight: 600;
    line-height: 18px;
    letter-spacing: 0em;
    text-align: left;
    color: var(--bg-primary-500);
    transition: 0.3s;
  }

  .btnAmount:hover span {
    color: var(--bg-secondary-500);
  }

  @media only screen and (max-width: 768px) {
    .table {
      width: v-bind(
        "props.fullScreen ? 'calc(100vw - 40px)' : 'calc(100vw - 80px)'"
      );
      height: v-bind(
        "fullScreen ? 'calc(100vh - 40px - 36px - 20px)' : 'calc(100vh - 80px - 84px - 85px - 35px - 96px - 60px)'"
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
