<script setup>
import { ref, defineProps, defineEmits, watch, onMounted, computed } from "vue";
import { removeExtraSpaces, formatTitle } from "@/utils/helpers";
import useUsersStore from "@/stores/user";
import useGlobalStore from "@/stores/global";
import useLinesStore from "@/stores/lines";
import useIncomeStore from "@/stores/incomes";

const usersStore = useUsersStore();
const globalStore = useGlobalStore();
const linesStore = useLinesStore();
const incomeStore = useIncomeStore();

const props = defineProps({
  data: {
    type: Object,
    default: () => {},
  },
  idIncome: {
    type: String,
    default: "",
  },
});

const currentCrew = ref(null);
const currentCrewPos = ref(null);
const loading = ref(false);
const emit = defineEmits(["closeModal", "lockModal"]);
const tabSelected = ref(0);
const tabs = ref([
  { label: "Detalles", tab: 0 },
  { label: "Líneas Asignadas", tab: 1, disabled: true },
]);
const counterLinesAssigned = ref({});

onMounted(async () => {
  currentCrewPos.value = incomeStore.income.crew.findIndex(
    (c) => c.user._id === props.data.user._id
  );
  currentCrew.value = JSON.parse(
    JSON.stringify(incomeStore.income.crew[currentCrewPos.value])
  );

  tabs.value[1].disabled = !currentCrew.value.member;
});

// Roles
const role = ref("");
const resultsRoles = ref([]);
const loadingRoles = ref(false);

watch(ref(role), async () => {
  if (role.value.trim()) {
    loadingRoles.value = true;
    await usersStore.filterRolesByName(role.value.trim());
    loadingRoles.value = false;
    resultsRoles.value = usersStore.roles_list.map((l) => {
      return {
        label: l.name[globalStore.lang],
        oldData: l,
      };
    });
  }
});

const cleanRole = () => {
  role.value = "";
  loadingRoles.value = false;
};

const selectRoleResult = (selected) => {
  cleanRole();
  if (!currentCrew.value.roles.some((r) => r._id === selected.oldData._id)) {
    currentCrew.value.roles.unshift({
      name: selected.oldData.name,
      _id: selected.oldData._id,
    });
  }
};

const deleteTag = (id) => {
  const index = currentCrew.value.roles.findIndex((r) => r._id === id);
  currentCrew.value.roles.splice(index, 1);
};

// Tab
watch(ref(tabSelected), async (newValue, oldValue) => {
  if (newValue === 1) {
    globalStore.loading = true;
    await linesStore.getAllLinesIncomes({
      parent: "null",
      assignment: true,
      idUser: currentCrew.value.user._id,
    });
    counterLinesAssigned.value = await linesStore.countLinesAssigned(
      currentCrew.value.user._id
    );
    linesStore.breadcrumbs = [
      { icon: "folder", label: "Categorías", sub: false, id: null },
    ];
    globalStore.loading = false;
  }
});

//Permission
const permission = ref("");
const resultsPermissions = ref([
  { label: "Asistente" },
  { label: "Productor" },
  { label: "Director" },
]);

// Visitar Perfil
const router = useRouter();

const goToPage = () => {
  const path = `/profile/${props.data.user._id}`;
  window.open(router.resolve(path).href, "_blank");
};

// Buscador
const search = ref("");
const resultSearch = ref([]);
const searchLoading = ref(false);

// watch(ref(search), async (newVal, oldVal) => {
//   const text = removeExtraSpaces(newVal);
//   if (text !== "") {
//     searchLoading.value = true;
//     const resp = await linesStore.searchLine(props.idIncome, text);
//     resultSearch.value = mapperLine(resp);
//     searchLoading.value = false;
//   }
// });

// const clearSearchLine = () => {
//   searchLoading.value = false;
//   search.value = "";
// };

const selectedLine = async (option) => {
  search.value = "";

  linesStore.breadcrumbs = [
    { icon: "folder", label: "Categorías", sub: false, id: null },
  ];

  option.oldData.parents.forEach((l, i) => {
    linesStore.breadcrumbs.push({
      icon: "",
      label: option.oldData.parentsName[i],
      sub: true,
      id: l,
    });
  });
  if (!!option.oldData.parent) {
    await linesStore.getLine(option.oldData.parent, currentCrew.value.user._id);
  }

  if (!option.oldData.isParent) {
    let line = option.oldData;
    line.selected = option.oldData.users.includes(currentCrew.value.user._id);
    linesStore.lines = [line];
  } else {
    linesStore.loading = true;
    linesStore.breadcrumbs.push({
      icon: "",
      label: option.oldData.name,
      sub: true,
      id: option.oldData.__id,
    });
    await linesStore.getAllLinesIncomes({
      parent: option.oldData.__id,
      assignment: true,
      idUser: currentCrew.value.user._id,
      search: true,
    });
    linesStore.loading = false;
  }
};

const mapperLine = (lines) => {
  return lines.map((l) => {
    const text = l.parentsName ? l.parentsName.join(" / ") : "";
    return {
      label: l.name,
      text,
      search: true,
      oldData: l,
    };
  });
};

// Funciones
const saveDetails = async () => {
  let crew = [...incomeStore.income.crew];
  crew[currentCrewPos.value] = currentCrew.value;
  const body = {
    _id: incomeStore.income._id,
    crew,
  };
  emit("lockModal", true);
  loading.value = true;
  await incomeStore.updateMovement(body);
  await incomeStore.getCrew();
  loading.value = false;
  emit("lockModal", false);
  emit("closeModal");
};

// Boton de guardar
const assignLine = async () => {
  let body = {
    user: currentCrew.value.user._id,
    income: incomeStore.income._id,
    lines: [],
    parents: [],
  };

  if (linesStore.lines.some((l) => l.selected)) {
    body["parent"] = {
      __id: linesStore.lines[0].parent || null,
      state: true,
    };
  }

  linesStore.lines.forEach((line) => {
    if (line.change) {
      if (line.isParent) {
        body.parents.push({ __id: line.__id, state: line.selected });
        line.assignedLines = line.selected ? line.numberChildren : 0;
      } else {
        body.lines.push({ __id: line.__id, state: line.selected });
      }
    }
  });

  globalStore.loading = true;
  await linesStore.addMemberLine(body);
  counterLinesAssigned.value = await linesStore.countLinesAssigned(
    currentCrew.value.user._id
  );
  globalStore.loading = false;
};

const connector = computed(() => {
  const connectors = {
    es: "de",
    en: "of",
  };
  return connectors[globalStore.lang] || "de";
});

// ASIGNAR LINEAS
const loadingLines = ref(false);
const resultLines = ref([]);
const searchLine = ref("");
const breadcrumbs = ref([
  {
    name: { es: "Categorías", en: "Categories" },
    __id: "",
    income: incomeStore.income._id,
  },
]);
const configExplorer = {
  minWidthCols: "408px",
  cols: [
    { type: "checkbox" },
    { type: "code", width: "80px" },
    { type: "name", width: "minmax(200px, 1fr)" },
    {
      type: "assigned",
      width: "100px",
      prop: { num1: "assignedLines", num2: "numberChildren" },
    },
  ],
};

watch(ref(searchLine), async (newVal, oldVal) => {
  const text = removeExtraSpaces(newVal);
  if (text !== "") {
    loadingLines.value = true;
    const resp = await linesStore.searchLine(incomeStore.income._id, text);
    resultLines.value = mapperLine(resp);
    loadingLines.value = false;
  }
});

const clearSearchLine = () => {
  loadingLines.value = false;
  searchLine.value = "";
  resultLines.value = [];
};

const selectedLineBySearch = async (option) => {
  linesStore.loading = true;
  searchLine.value = "";
  breadcrumbs.value = [
    {
      name: { es: "Categorías", en: "Categories" },
      __id: "",
      income: { _id: option.oldData.income._id },
    },
  ];
  if (option.oldData.isParent) {
    if (option.oldData.parents.length) {
      option.oldData.parents.forEach((parent, p) => {
        breadcrumbs.value.push({
          name: option.oldData.parentsName[p],
          __id: parent,
          income: { _id: option.oldData.income._id },
        });
      });
    }
    breadcrumbs.value.push({
      name: option.oldData.name,
      __id: option.oldData.__id,
      income: { _id: option.oldData.income._id },
    });
    await linesStore.getAllLinesIncomes({
      parent: option.oldData.__id,
      assignment: true,
      idUser: currentCrew.value.user._id,
      search: true,
    });
  } else {
    breadcrumbs.value = [
      {
        name: { es: "Categorías", en: "Categories" },
        __id: "",
        income: { _id: option.oldData.income._id },
      },
    ];

    await linesStore.getAllLinesIncomes({
      parent: option.oldData.parent,
      assignment: true,
      idUser: currentCrew.value.user._id,
      search: true,
    });

    option.oldData.parents.forEach((p, index) => {
      breadcrumbs.value.push({
        name: option.oldData.parentsName[index],
        __id: p,
        income: { _id: option.oldData.income._id },
      });
    });
  }
  linesStore.loading = false;
};

const filterByCategory = async (category, pos) => {
  linesStore.loading = true;
  updatedBreadcrumb(category, pos);
  await linesStore.getAllLinesIncomes({
    parent: category.__id,
    assignment: true,
    idUser: currentCrew.value.user._id,
    search: true,
  });
  linesStore.loading = false;
};
const updatedBreadcrumb = (category, pos = null) => {
  if (pos !== null || pos === 0) {
    breadcrumbs.value.splice(pos + 1);
  } else {
    breadcrumbs.value.push({
      name: category.name,
      __id: category.__id,
      income: { _id: category.income._id },
    });
  }
};
</script>

<template>
  <div class="containerModal" v-if="currentCrew">
    <div class="containerModal__header">
      <span
        >Crew - {{ data?.user?.name?.first }} {{ data?.user?.name?.last }}</span
      >
      <u-button-icon
        icon="close"
        class="btnIconModify"
        color="--bg-neutral-200"
        colorHover="--bg-neutral-400"
        colorActive="--bg-neutral-600"
        size="l"
        :disabled="loading"
        @action-btn="emit('closeModal')"
      />
    </div>
    <div class="containerModal__body">
      <div class="containerModal__body-header">
        <div class="containerModal__body-header-img">
          <u-avatar
            :user="{
              name: `${data?.user?.name?.first} ${data?.user?.name?.last}`,
              src: data?.user?.imgUrl,
            }"
            :size="80"
            :nothover="true"
          />
        </div>
        <div class="containerModal__body-header-text">
          <div class="containerModal__body-header-name">
            <div class="containerModal__body-header-name-main">
              <h2>
                {{ data?.user?.name?.first }} {{ data?.user?.name?.last }}
              </h2>
              <span v-if="!!data?.user?.name?.nickName"
                >({{ data?.user?.name?.nickName }})</span
              >
              <u-verify style="height: 18px" />
            </div>
            <u-button
              text="Ver Perfil"
              icon="open"
              type="outlined"
              size="s"
              class="btnProfile"
              :disabled="loading"
              @action-btn="goToPage"
            />
          </div>
          <div class="containerModal__body-header-nick">
            <span v-if="!!data?.user?.name?.nickName"
              >@{{ data?.user?.name?.nickName ?? "" }}</span
            >
            <div v-if="currentCrew.member" class="orgTag">
              <span class="u u-user"></span>
              <span>MIEMBRO</span>
            </div>
          </div>
          <div class="containerModal__body-header-roles">
            <u-tags
              v-for="n in data.roles"
              :key="n._id"
              :text="n.name[globalStore.lang]"
              size="s"
              color="--bg-primary-500"
              background="--bg-primary-100"
              :delete="false"
            />
          </div>
        </div>
      </div>
      <u-tabs :tabs="tabs" v-model="tabSelected" :fullscreen="false" />
      <div class="containerModal__body-content" v-if="tabSelected === 0">
        <div class="containerModal__body-content-group">
          <label>Rol</label>
          <u-search
            v-model="role"
            size="l"
            :options="resultsRoles"
            :loading="loadingRoles"
            placeholder="Ingresa el rol"
            :updated="false"
            :disabled="loading"
            @cleanInput="cleanRole"
            @selectedOption="selectRoleResult"
          />
          <div class="containerModal__body-content-tags" v-if="!!currentCrew">
            <u-tags
              v-for="rol in currentCrew.roles"
              :key="rol._id"
              :text="rol.name[globalStore.lang]"
              :delete="!loading && currentCrew.roles.length !== 1"
              @closeButton="deleteTag(rol._id)"
            />
          </div>
        </div>
        <div class="containerModal__body-content-group">
          <label>Permisos</label>
          <u-select
            v-model="permission"
            size="l"
            :options="resultsPermissions"
            placeholder="Asigne un permiso"
            :disabled="loading"
          />
        </div>
        <div class="containerModal__body-content-actions">
          <u-button
            class="btnMainModify"
            :text="loading ? 'Guardando' : 'Guardar'"
            :disabled="loading"
            size="l"
            @action-btn="saveDetails"
          />
        </div>
      </div>
      <div
        class="containerModal__body-content"
        v-if="tabSelected === 1 && currentCrew.member"
      >
        <div class="containerModal__body-lines">
          <div class="containerModal__body-lines-part1">
            <div>
              <span>{{ formatTitle(incomeStore.projectName) }}</span>
              <span>{{ formatTitle(incomeStore.income.name) }}</span>
            </div>
            <div>
              <span
                >{{ counterLinesAssigned.assignedLines }} {{ connector }}
                {{ counterLinesAssigned.numberChildren }}</span
              ><span>Líneas Asignadas</span>
            </div>
          </div>
          <div class="containerModal__body-lines-part2">
            <NavigationFolderExplorer
              :save="true"
              class="navigator"
              :config="configExplorer"
              @searching="(text) => (searchLine = text)"
              :resultsSearch="resultLines"
              :loadingSearch="loadingLines"
              @cleanInput="clearSearchLine"
              @selectedOption="selectedLineBySearch"
              :list="linesStore.lines"
              :loadingList="linesStore.loading"
              @filterByCategory="filterByCategory"
              :breadcrumbs="breadcrumbs"
              @updateSelected="(line) => (line.change = true)"
              @save="assignLine"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.containerModal {
  height: calc(90vh - 80px);
  display: grid;
  grid-template-rows: 40px 1fr;
  gap: 20px;
}
.containerModal__header,
.containerModal__actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.containerModal__header span {
  font-family: Nunito;
  font-size: 16px;
  font-weight: 600;
  line-height: 20px;
  letter-spacing: 0em;
  text-align: left;
  color: var(--bg-neutral-700);
  text-transform: capitalize;
}
.containerModal__body {
  display: grid;
  grid-template-rows: 80px 32px 1fr;
  gap: 20px;
  overflow-y: auto;
  padding-right: 2px;
}
.containerModal__body::-webkit-scrollbar {
  width: 8px;
  background: var(--neutral-surface-light);
  border-radius: 20px;
}
.containerModal__body::-webkit-scrollbar-thumb {
  background: var(--neutral-surface-subtle);
  border-radius: 5px;
}
.containerModal__body-header {
  display: grid;
  grid-template-columns: 80px 1fr;
  gap: 20px;
}
.containerModal__body-header-img {
  display: flex;
  justify-content: center;
  align-items: center;
}
.containerModal__body-header-text {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}
.containerModal__body-header-name {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 20px;
  position: relative;
}
.containerModal__body-header-name-main {
  display: flex;
  align-items: center;
  gap: 10px;
}
.containerModal__body-header-name-main h2 {
  font-family: Nunito;
  font-size: 16px;
  font-weight: 600;
  line-height: 16px;
  letter-spacing: 0em;
  text-align: left;
  color: var(--bg-neutral-700);
  text-transform: capitalize;
}
.containerModal__body-header-name-main span {
  font-family: Nunito;
  font-size: 14px;
  font-weight: 600;
  line-height: 14px;
  letter-spacing: 0em;
  text-align: left;
  color: var(--bg-neutral-500);
}
.containerModal__body-header-nick span {
  font-family: Nunito;
  font-size: 12px;
  font-weight: 600;
  line-height: 12px;
  letter-spacing: 0em;
  text-align: left;
  color: var(--bg-neutral-500);
  text-transform: capitalize;
}
.containerModal__body-header-roles {
  display: flex;
  gap: 10px;
  flex-wrap: nowrap;
  overflow-x: scroll;
  width: 625px;
  margin-top: 5px;
}
.containerModal__body-header-roles::-webkit-scrollbar {
  width: 0px;
  height: 0px;
}
.containerModal__body-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
}
.containerModal__body-content-group {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.containerModal__body-content-group label {
  font-size: 12px;
  font-weight: 600;
  line-height: 16px;
  color: var(--neutral700);
}
.containerModal__body-content-groupline {
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 20px 0;
}
.orgTag {
  display: flex;
  justify-content: center;
  padding: 5px 10px;
  gap: 5px;
  background-color: var(--bg-secondary-100);
  width: 90px;
  border-radius: 10px;
}
.orgTag span:nth-child(1) {
  font-size: 12px;
  line-height: 12px;
  color: var(--bg-secondary-500);
}
.orgTag span:nth-child(2) {
  font-family: Nunito;
  font-size: 12px;
  font-weight: 600;
  line-height: 12px;
  color: var(--bg-secondary-500);
}
.containerModal__body-content-tags {
  height: auto;
  max-height: 116px;
  overflow-y: auto;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
}
.containerModal__body-content-tags::-webkit-scrollbar {
  width: 2px;
  height: 0px;
}
.containerModal__body-content-tags::-webkit-scrollbar-thumb {
  border-radius: 3px;
  background-color: var(--bg-neutral-400);
}
.containerModal__body-content-actions {
  display: flex;
  justify-content: flex-end;
}
.btnMainModify {
  width: 135px;
}

/* modifications of customs components */
.mainBtnModify {
  width: 135px;
}
.btnIconModify {
  border-radius: 50%;
  color: var(--bg-neutral-500);
}
.btnProfile {
  position: absolute;
  right: -5px;
  top: 0px;
  transform: scale(0.9);
}

.containerModal__body-lines {
  display: grid;
  grid-template-rows: 60px 1fr;
}
.containerModal__body-lines-part1 {
  display: flex;
  justify-content: space-between;
  padding: 8px 24px;
  border: 1px solid var(--bg-neutral-300);
  border-bottom: none;
  border-radius: 8px 8px 0 0;
  box-shadow: 0px 2px 2px 0px #38404c29;
}
.containerModal__body-lines-part1 div {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}
.containerModal__body-lines-part1 div:nth-child(1) span:nth-child(1) {
  font-family: Nunito;
  font-size: 14px;
  font-weight: 600;
  line-height: 18px;
  letter-spacing: 0em;
  text-align: left;
  color: var(--bg-primary-500);
}
.containerModal__body-lines-part1 div:nth-child(1) span:nth-child(2),
.containerModal__body-lines-part1 div:nth-child(2) span:nth-child(2) {
  font-family: Nunito;
  font-size: 12px;
  font-weight: 400;
  line-height: 16px;
  letter-spacing: 0em;
  text-align: left;
  color: var(--bg-neutral-500);
}

.containerModal__body-lines-part1 div:nth-child(2) span:nth-child(1) {
  font-family: Nunito;
  font-size: 14px;
  font-weight: 600;
  line-height: 18px;
  letter-spacing: 0em;
  text-align: right;
  color: var(--bg-neutral-700);
}

.containerModal__body-lines-part2 {
  padding: 18px 48px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  border-radius: 0 0 8px 8px;
  border: 1px solid var(--bg-neutral-300);
  height: auto;
  max-height: 100%;
}
.containerModal__body-lines-filter {
  display: grid;
  grid-template-columns: 1fr 120px;
  gap: 10px;
}

.check {
  color: var(--bg-primary-500) !important;
  font-weight: 600 !important;
}

@media only screen and (max-width: 950px) {
  .btnProfile {
    display: none;
  }
}

@media only screen and (max-width: 805px) {
  .containerModal__body-header-roles {
    width: calc(100vw - 80px - 80px - 20px);
  }
}

@media only screen and (max-width: 768px) {
  .containerModal {
    height: calc(100vh - 40px);
  }
  .containerModal__body-header-roles {
    width: calc(100vw - 40px - 80px - 20px);
  }
}
</style>
