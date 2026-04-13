<script setup>
import { ref, defineEmits, defineProps, onMounted, computed } from "vue";
import useUsersStore from "@/stores/user";
import useGlobalStore from "@/stores/global";
import useLinesStore from "@/stores/lines";
import useIncomeStore from "@/stores/incomes";

const { params } = useRoute();
const idProject = ref(params?.id ?? null);

const userStore = useUsersStore();
const globalStore = useGlobalStore();
const linesStore = useLinesStore();
const incomeStore = useIncomeStore();

// Emits
const emit = defineEmits(["closeModal"]);

// Props
const props = defineProps({
  crew: {
    type: Object,
    default: () => {},
  },
});

// Constants
const user = ref({});
const role = ref("");
const searchLine = ref("");
const loadings = ref({});
const results = ref({ roles: [], lines: [] });
const mainColor = "--bg-neutral-500";
const secondColor = "--bg-neutral-600";
const tabSelected = ref(0);
const texts = {
  es: "Miembro",
  en: "Member",
};
const tabs = ref([
  {
    label: "Detalles",
    icon: "",
    tab: 0,
    indicator: false,
    disabled: false,
    main: false,
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
const breadcrumbs = ref([
  {
    name: { es: "Categorías", en: "Categories" },
    __id: "",
    income: incomeStore.income._id,
  },
]);
const counterLinesAssigned = ref({});

// Mounted
onMounted(() => {
  if (props.crew.member) {
    const newTab = {
      label: "Líneas Asignadas",
      icon: "",
      tab: 1,
      indicator: false,
      disabled: false,
      main: false,
    };
    tabs.value.push(newTab);
  }
  user.value = props.crew;
});

watch(ref(tabSelected), async (newValue, oldValue) => {
  if (newValue === 1) {
    globalStore.loading = true;
    await linesStore.getAllLinesIncomes({
      parent: "null",
      assignment: true,
      idUser: user.value.contact.user._id,
    });
    counterLinesAssigned.value = await linesStore.countLinesAssigned(
      user.value.contact.user._id
    );
    linesStore.breadcrumbs = [
      { icon: "folder", label: "Categorías", sub: false, id: null },
    ];
    globalStore.loading = false;
  }
});

// Actions
const removeRol = (pos) => {
  user.value.roles.splice(pos, 1);
};

const selectRol = (rol) => {
  if (!!user.value.roles) {
    const rolExists = user.value.roles.some(
      (existingRol) =>
        existingRol.name[globalStore.lang].toLowerCase() ===
        rol.label.toLowerCase()
    );
    if (!rolExists) {
      user.value.roles.unshift({
        name: { [globalStore.lang]: rol.label },
        _id: rol.id,
      });
    }
    setTimeout(() => {
      role.value = "";
    }, 10);
  }
};

const searchRoles = async () => {
  const trimmedSearch = role.value.trim();
  if (trimmedSearch !== "") {
    loadings.value.roles = true;
    await userStore.filterRolesByName(trimmedSearch);
    if (userStore.roles_list && userStore.roles_list.length) {
      results.value.roles = mapperRoles();
    } else {
      results.value.roles = [];
    }
    loadings.value.roles = false;
  }
};

const mapperRoles = () => {
  return userStore.roles_list.map((t) => ({
    label: t.name[globalStore.lang],
    id: t._id,
  }));
};

const showUser = () => {
  userStore.showModalDataSheet = true;
  userStore.dataSheet.state = "edit";
  userStore.userDataSheetId = user.value.contact._id;
  userStore.dataSheet.onlyEdit = true;
  userStore.showBtnBack = true;
};

// Lines
watch(ref(searchLine), async (newVal, oldVal) => {
  const text = removeExtraSpaces(newVal);
  if (text !== "") {
    loadings.value.lines = true;
    const resp = await linesStore.searchLine(incomeStore.income._id, text);
    results.value.lines = mapperLine(resp);
    loadings.value.lines = false;
  }
});
const clearSearchLine = () => {
  loadings.value.lines = false;
  searchLine.value = "";
  results.value.lines = [];
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
      idUser: user.value.contact.user._id,
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
      idUser: user.value.contact.user._id,
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
    parent: category.__id || "null",
    assignment: true,
    idUser: user.value.contact.user._id,
    search: true,
  });
  linesStore.loading = false;
};

const assignLine = async () => {
  let body = {
    user: user.value.contact.user._id,
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
    user.value.contact.user._id
  );
  await incomeStore.getCrew();
  globalStore.loading = false;
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

// Save
const save = async () => {
  let crews = [...incomeStore.income.crew];

  const index = incomeStore.income.crew.findIndex(
    (c) => c.contact._id === user.value.contact._id
  );

  crews[index] = user.value;

  const body = {
    _id: incomeStore.income._id,
    crew: crews,
    idProject: idProject.value,
    idContact: user.value.contact._id,
    member: false,
  };

  globalStore.loading = true;
  await assignLine();
  globalStore.loading = true;
  const resp = await incomeStore.updateMovement(body);
  incomeStore.income.crew = resp.crew;
  globalStore.loading = false;
  emit("closeModal");
};

// Computed
const textIsMember = computed(() => {
  return props.crew.member ? texts[globalStore.lang] : "";
});
</script>

<template>
  <div class="editCrew">
    <div class="editCrew__title space-between">
      <span>Crew - {{ user?.contact?.data?.legalName }}</span>
      <u-button-icon
        icon="close"
        class="btnIconModify"
        type="outlined"
        :color="mainColor"
        :colorActive="secondColor"
        :colorHover="secondColor"
        @click="emit('closeModal')"
      />
    </div>
    <div class="editCrew__header">
      <u-avatar
        :size="80"
        style="flex-shrink: 1"
        :user="{
          name: user?.contact?.data?.legalName,
          src: user?.contact?.imgUrl,
        }"
      />
      <div class="editCrew__header-content">
        <div class="editCrew__header-name">
          <span class="name">{{ user?.contact?.data?.legalName }}</span>
          <span class="nickname" v-if="user?.contact?.data?.nickName"
            >({{ user?.contact?.data?.nickName }})</span
          >
          <span class="u u-verified" v-if="user?.contact?.user"></span>
          <span v-text="textIsMember" v-if="textIsMember" class="member"></span>
        </div>
        <span class="email">{{ user?.contact?.email }}</span>
        <div class="editCrew__header-tags" v-if="props?.crew?.contact?.roles">
          <span
            v-for="role in props.crew.contact.roles"
            :key="role._id"
            class="tag"
            >{{ role?.name?.[globalStore.lang] }}</span
          >
        </div>
        <u-button-icon
          icon="edit"
          size="s"
          class="floatBtn"
          @click="showUser"
        />
      </div>
    </div>
    <u-tabs class="tabs" :tabs="tabs" v-model="tabSelected" />
    <div class="editCrew__content">
      <div class="editCrew__content-details" v-if="tabSelected === 0">
        <div class="editCrew__content-group">
          <span>Roles Asignados</span>
          <u-search
            v-model="role"
            size="s"
            placeholder="Ingresa un rol"
            :loading="loadings.roles"
            :options="results.roles"
            @cleanInput="role = ''"
            @selectedOption="selectRol"
            @input="searchRoles"
          />
          <div class="editCrew__content-roles">
            <u-tags
              v-for="(role, r) in user.roles"
              size="s"
              :key="r"
              :text="role?.name?.[globalStore.lang] || '-'"
              @closeButton="removeRol(r)"
              :delete="true"
              background="--info-surface-shadow-12a"
              color="--info-text-default"
            />
          </div>
        </div>
      </div>
      <div class="editCrew__content-lines" v-if="tabSelected === 1">
        <div class="editCrew__content-lines-header">
          <div class="editCrew__content-lines-left">
            <span v-text="incomeStore?.incomeName || '-'"></span>
            <span v-text="incomeStore?.projectName || '-'"></span>
          </div>
          <div class="editCrew__content-lines-right">
            <span
              >{{ counterLinesAssigned.assignedLines }} de
              {{ counterLinesAssigned.numberChildren }}</span
            >
            <span>Líneas Asignadas</span>
          </div>
        </div>
        <div class="editCrew__content-lines-body">
          <NavigationFolderExplorer
            :save="true"
            class="navigator"
            :config="configExplorer"
            @searching="(text) => (searchLine = text)"
            :resultsSearch="results.lines"
            :loadingSearch="loadings.lines"
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
    <div class="editCrew__actions space-between" v-if="tabSelected === 0">
      <u-button
        text="Volver"
        type="outlined"
        size="s"
        class="btnAction"
        @click="emit('closeModal')"
      />
      <u-button text="Guardar" size="s" class="btnAction" @click="save" />
    </div>
  </div>
</template>

<style scoped>
.editCrew {
  width: 760px;
  height: 650px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.editCrew__title {
  height: 40px;
}

.editCrew__header {
  height: 100px;
  padding-bottom: 20px;
}

.editCrew__tabs {
  height: 32px;
}

.editCrew__content {
  flex-grow: 1;
}

.editCrew__actions {
  height: 52px;
  padding-top: 20px;
}

/* Title */
.editCrew__title span {
  font-size: 16px;
  font-weight: 600;
  line-height: 20px;
  color: var(--neutral-text-body);
}

/* Header */
.editCrew__header {
  display: grid;
  grid-template-columns: 80px 1fr;
  gap: 20px;
  position: relative;
}

.editCrew__header-content {
  height: 80px;
  width: 100%;
  display: flex;
  flex-shrink: 1;
  flex-direction: column;
  justify-content: center;
}

.editCrew__header-name {
  display: flex;
  gap: 8px;
  align-items: center;
}

.editCrew__header-name span:not(.u) {
  font-size: 14px;
  font-weight: 600;
  line-height: 18px;
}

.editCrew__header-name .name {
  color: var(--neutral-text-body);
}

.editCrew__header-name .nickname {
  color: var(--neutral-text-caption);
}

.editCrew__header-name .u {
  font-size: 18px;
}

.editCrew__header-content .email {
  font-size: 12px;
  font-weight: 600;
  line-height: 16px;
  color: var(--neutral-text-caption);
  margin-bottom: 8px;
}

.editCrew__header-tags {
  display: flex;
  gap: 5px;
  width: 100%;
  overflow-x: auto;
}

.editCrew__header-tags::-webkit-scrollbar {
  width: 0px;
  height: 0px;
}

.editCrew__header-tags .tag {
  font-size: 12px;
  font-weight: 600;
  line-height: 16px;
  color: var(--primary-text-default);
  background-color: var(--primary-surface-shadow-12a);
  padding: 4px 12px 2px;
  border-radius: 14px;
  flex-shrink: 0;
}

/* Content */
.editCrew__content-details {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding-top: 20px;
}

.editCrew__content-group {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.editCrew__content-group span {
  font-size: 12px;
  font-weight: 600;
  line-height: 16px;
  color: var(--neutral-text-body);
}

.editCrew__content-roles {
  display: flex;
  gap: 2px;
  width: 100%;
  flex-wrap: wrap;
  height: auto;
  max-height: 95px;
  overflow-y: auto;
  gap: 10px;
}

.editCrew__content-roles::-webkit-scrollbar {
  width: 8px;
  height: 8px;
  background: var(--neutral-surface-light);
  border-radius: 20px;
}

.editCrew__content-roles::-webkit-scrollbar-thumb {
  background: var(--neutral-surface-subtle);
  border-radius: 5px;
}

/* Lines */
.editCrew__content-lines {
  height: fit-content;
  width: 100%;
  flex-grow: 1;
  border-radius: 10px;
  border: 2px solid var(--neutral-border-light);
}

.editCrew__content-lines-header {
  height: 60px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 4px solid var(--neutral-border-light);
  padding: 0 16px;
}

.editCrew__content-lines-left,
.editCrew__content-lines-right {
  display: flex;
  flex-direction: column;
}

.editCrew__content-lines-right {
  align-items: flex-end;
}

.editCrew__content-lines-left span:nth-child(1),
.editCrew__content-lines-right span:nth-child(1) {
  font-size: 14px;
  font-weight: 600;
  line-height: 18px;
}

.editCrew__content-lines-left span:nth-child(1) {
  color: var(--primary-text-default);
}

.editCrew__content-lines-left span:nth-child(2),
.editCrew__content-lines-right span:nth-child(2) {
  font-size: 12px;
  font-weight: 600;
  line-height: 18px;
}

.editCrew__content-lines-left span:nth-child(2),
.editCrew__content-lines-right span:nth-child(1) {
  color: var(--neutral-text-body);
}

.editCrew__content-lines-right span:nth-child(2) {
  color: var(--neutral-text-caption);
}

.editCrew__content-lines-body {
  padding: 15px 30px;
  box-sizing: border-box;
  flex-grow: 1;
  height: 320px;
  overflow-y: auto;
}

@media only screen and (max-width: 768px) {
  .editCrew {
    height: 100%;
    width: 100%;
  }
  .editCrew__content-lines-body {
    height: calc(100vh - 400px);
  }
  .editCrew__header-tags {
    width: calc(100vw - 80px - 60px);
  }
}

span.member {
  color: var(--secondary-text-default);
  font-weight: 600;
  font-size: 12px !important;
  background-color: var(--secondary-surface-shadow-12a);
  padding: 2px 12px;
  border-radius: 20px;
}

/* Global */
span {
  font-family: Nunito;
}

.space-between {
  display: flex;
  align-items: center;
  gap: 12px;
  justify-content: space-between;
}

.btnAction {
  width: 120px;
}

.btnIconModify {
  border-radius: 50%;
}

.floatBtn {
  position: absolute;
  left: 50px;
  top: 50px;
  border-radius: 50%;
  box-shadow: var(--shadow-2);
}
</style>
