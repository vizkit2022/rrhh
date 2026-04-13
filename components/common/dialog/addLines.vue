<script setup>
import { defineEmits, ref, onMounted } from "vue";
import useOutcomesStore from "@/stores/outcomes";
import useIncomesStore from "@/stores/incomes";
import useGlobalStore from "@/stores/global";
import useUserStore from "@/stores/user";
import useLinesStore from "@/stores/lines";
import { capitalizeName } from "@/utils/helpers";

// Stores
const outcomesStore = useOutcomesStore();
const incomesStore = useIncomesStore();
const globalStore = useGlobalStore();
const userStore = useUserStore();
const linesStore = useLinesStore();

// Emits
const emit = defineEmits(["closeModal", "updatedTable", "updateMetrics"]);

// Constants
const color = "--neutral-text-caption";
const deleteColor = "--danger-text-default";
const deleteColorHover = "--danger-text-subtle";
const deleteColorActive = "--danger-text-darker";
const { t } = useI18n();
const module = "modules.outcomes.pages.oc.modals.buy.step2";
const buttons = "modules.outcomes.pages.oc.modals.buy.buttons";

// Mounted
onMounted(async () => {
  try {
    globalStore.loading = true;

    const projects = await incomesStore.searchProject("");

    // Limitar a máximo 5 proyectos
    const limitedProjects = projects.slice(0, 5);

    const promises = limitedProjects.map(async (project) => {
      const amountLines = await incomesStore.getTotalLinesByProject(
        project._id
      );
      return {
        name: project.name,
        project: project.project.name,
        expand: false,
        _id: project._id,
        totalLines: amountLines,
      };
    });

    // Esperar a que todas las promesas se resuelvan
    const projectMovements = await Promise.all(promises);

    // Añadir los resultados al arreglo movements
    movements.value.push(...projectMovements);
  } catch (error) {
    console.error("Error al obtener proyectos:", error);
  } finally {
    globalStore.loading = false;
  }
});

// Functions

// Explorador
const configExplorer = {
  minWidthCols: "328px",
  cols: [
    { type: "checkbox" },
    { type: "code", width: "80px" },
    { type: "name", width: "minmax(200px, 1fr)" },
  ],
};
const movements = ref([]);
const searchLine = ref("");
const resultLines = ref([]);
const loadingLines = ref(false);
const currentMov = ref("");
const clearSearchLine = () => {
  loadingLines.value = false;
  searchLine.value = "";
  resultLines.value = [];
};
const selectedLineBySearch = async (option) => {
  outcomesStore.loading = true;
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
    await outcomesStore.getAllToOutcome({
      income: option.oldData.income._id,
      parent: option.oldData.__id,
    });
  } else {
    const resp = await outcomesStore.getLine(
      option.oldData.parent,
      userStore.userSession._id
    );
    outcomesStore.linesOc = [resp.line];
  }
  outcomesStore.loading = false;
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
watch(ref(searchLine), async (newVal, oldVal) => {
  const text = removeExtraSpaces(newVal);
  if (text !== "") {
    loadingLines.value = true;
    const resp = await linesStore.searchLine(currentMov.value, text);
    resultLines.value = mapperLine(resp);
    loadingLines.value = false;
  }
});
const filterByCategory = async (category, pos) => {
  console.log("filterCategoryss");
  outcomesStore.loading = true;
  updatedBreadcrumb(category, pos);
  await outcomesStore.getAllToOutcome({
    income: category.income._id,
    parent: category.__id || "null",
  });
  outcomesStore.loading = false;
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
const selectedLines = ref([]);
const updateSelected = (line) => {
  if (line.selected) {
    if (!selectedLines.value.includes(line)) {
      selectedLines.value.push(line);
    }
  } else {
    const index = selectedLines.value.findIndex(
      (selectedLine) => selectedLine._id === line._id
    );
    if (index !== -1) {
      selectedLines.value.splice(index, 1);
    }
  }
};
const breadcrumbs = ref([
  { name: { es: "Categorías", en: "Categories" }, __id: null, income: "" },
]);

// Cargas las lineas
const expandMov = async (pos) => {
  movements.value.forEach((mov, m) => {
    mov.expand = m === pos ? !mov.expand : false;
  });

  setTimeout(() => {
    const itemToScroll = document.getElementById(`item-${pos}`);
    if (itemToScroll) {
      itemToScroll.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, 300);

  currentMov.value = movements.value[pos]._id;
  searchLine.value = "";

  if (movements.value[pos].expand) {
    outcomesStore.loading = true;
    breadcrumbs.value = [
      {
        name: { es: "Categorías", en: "Categories" },
        __id: "",
        income: { _id: movements.value[pos]._id },
      },
    ];
    await outcomesStore.getAllToOutcome({
      income: movements.value[pos]._id,
      parent: "null",
    });
    outcomesStore.loading = false;
  }
};
const filterLineByMov = (id) => {
  return selectedLines.value.filter((l) => l.income._id === id).length;
};
const deleteMov = (id) => {
  selectedLines.value = selectedLines.value.filter((l) => l.income._id !== id);
  movements.value = movements.value.filter((m) => m._id !== id);
};

const movement = ref("");
const movementResults = ref([]);
const movementLoading = ref(false);
const cleanForm = () => {
  movement.value = "";
  movementResults.value = [];
};
const selectedMovement = async (obj) => {
  const exists = movements.value.some((movement) => movement._id === obj.id);
  if (!exists) {
    globalStore.loading = true;
    try {
      const total = await incomesStore.getTotalLinesByProject(obj.id);
      movements.value.unshift({
        name: capitalizeFirstLetter(obj.name),
        project: capitalizeFirstLetter(obj.project.name),
        projectId: obj.project._id,
        expand: false,
        _id: obj.id,
        totalLines: total,
      });
      await expandMov(0);
      cleanForm();
    } catch (error) {
      console.error(error);
    } finally {
      globalStore.loading = false;
    }
  }
};
const searchMovement = async (e) => {
  const newValue = e.target.value;
  if (newValue.trim() !== "") {
    movementLoading.value = true;
    const results = await incomesStore.searchProject(newValue);
    if (results.length) {
      movementResults.value = mapperSearchMov(results);
    } else {
      movementResults.value = [];
    }
    movementLoading.value = false;
  }
};
const mapperSearchMov = (list) => {
  const movementIds = new Set(movements.value.map((movement) => movement._id));

  const filteredList = list.filter((item) => !movementIds.has(item._id));

  for (let l of filteredList) {
    l.label = capitalizeFirstLetter(l?.name) ?? "";
    l.text = l?.project?.name || "";
    l.oldData = { ...l };
  }
  return filteredList;
};

// Agregar lineas
const addLines = async () => {
  try {
    globalStore.loading = true;
    selectedLines.value = selectedLines.value;
    for (const line of selectedLines.value) {
      line.numbers.budget = line.numbers.toSpend;
      const newLine = await linesStore.calculateSimpleLine(
        line,
        outcomesStore.outcome.currency
      );
      if (!newLine) {
        throw new Error("Failed to calculate line");
      }
      line.numbers = newLine.numbers;
    }

    var newLines = {
      documentType: outcomesStore.outcome.documentType,
      outcome: outcomesStore.outcome._id,
      lines: selectedLines.value,
      numbers: { ...outcomesStore.outcome.numbers },
      observation: outcomesStore.outcome.observation,
      reference: outcomesStore.outcome.reference,
      supplier: { ...outcomesStore.outcome.supplier },
      type: outcomesStore.outcome.type,
    };

    const { success, data, error } = await outcomesStore.addLineOutcomeMany(
      newLines
    );

    outcomesStore.outcome = data.outcome;
    const total = outcomesStore.outcome.numbers.total.value;
    emit("updateMetrics", total);

    emit("updatedTable");
  } catch (err) {
    console.error("err", err);
  } finally {
    globalStore.loading = false;
  }
};
</script>

<template>
  <div class="step2">
    <div class="step2__header">
      <span v-text="t(module + '.title')"></span>
      <u-button-icon
        icon="close"
        class="btnIconModify"
        :color="color"
        @action-btn="emit('closeModal')"
        type="outlined"
        size="s"
      />
    </div>
    <div class="step2__body">
      <span class="label" v-text="t(module + '.inputs.movement.label')"></span>
      <u-search
        v-model="movement"
        :placeholder="t(module + '.inputs.movement.placeholder')"
        :loading="movementLoading"
        :snippet="true"
        :updated="false"
        :options="movementResults"
        @input="searchMovement($event)"
        @cleanInput="cleanForm"
        @selectedOption="selectedMovement"
        size="s"
        style="margin: 2px 0 20px"
      />
      <span class="label" v-text="t(module + '.inputs.lineList.label')"></span>
      <div class="list">
        <span
          v-if="movements.length === 0"
          v-text="t(module + '.inputs.lineList.noData')"
          class="noData"
        ></span>
        <div
          class="card"
          v-for="(mov, m) in movements"
          :key="mov._id"
          :id="`item-${m}`"
        >
          <div class="card__header">
            <button class="card__header-text" @click="expandMov(m)">
              <span
                class="truncateText"
                v-text="capitalizeName(mov.name)"
              ></span>
              <span
                class="truncateText"
                v-text="capitalizeName(mov.project)"
              ></span>
              <span>{{
                filterLineByMov(mov._id) +
                " " +
                t(module + ".inputs.lineList.of") +
                " " +
                mov.totalLines
              }}</span>
              <span v-text="t(module + '.inputs.lineList.text')"></span>
            </button>
            <div class="card__header-action">
              <u-button-icon
                @click="deleteMov(mov._id)"
                icon="close"
                type="text"
                size="s"
                :color="deleteColor"
                :color-hover="deleteColorHover"
                :color-active="deleteColorActive"
              />
            </div>
          </div>
          <div class="card__body" v-if="mov.expand">
            <NavigationFolderExplorer
              maxHeight="calc(85vh - 440px)"
              :config="configExplorer"
              @searching="(text) => (searchLine = text)"
              :resultsSearch="resultLines"
              :loadingSearch="loadingLines"
              @cleanInput="clearSearchLine"
              @selectedOption="selectedLineBySearch"
              :list="outcomesStore.linesOc"
              :loadingList="outcomesStore.loading"
              @filterByCategory="filterByCategory"
              :breadcrumbs="breadcrumbs"
              @updateSelected="updateSelected"
              :selectedLines="selectedLines"
              :selectParents="false"
            />
          </div>
        </div>
      </div>
    </div>
    <div class="step2__footer">
      <u-button
        :text="t(buttons + '.cancel')"
        type="outlined"
        class="mainBtnModify"
        size="s"
        @action-btn="emit('closeModal')"
      />
      <u-button
        :text="t(buttons + '.add')"
        class="mainBtnModify"
        size="s"
        :disabled="selectedLines.length === 0"
        @click="addLines"
      />
    </div>
  </div>
</template>

<style scoped>
.step2 {
  width: 100%;
  height: auto;
  display: grid;
  grid-template-rows: 40px auto 40px;
  gap: 16px;
}

/* header */
.step2__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 40px;
  width: 100%;
}

.step2__header span {
  font-size: 16px;
  font-weight: 600;
  line-height: 20px;
  letter-spacing: 0em;
  text-align: left;
  color: var(--neutral-text-body);
}

/* body */
.step2__body {
  height: auto;
}

.step2__body span.label {
  font-weight: 600;
  font-size: 12px;
  line-height: 16px;
  letter-spacing: 0%;
  vertical-align: middle;
  color: var(--neutral-text-body);
}

.list {
  margin-top: 4px;
  height: calc(85vh - 250px);
  display: flex;
  flex-direction: column;
  gap: 16px;
  overflow-y: auto;
  scrollbar-gutter: stable both-edges;
  padding-right: 10px;
}

.list::-webkit-scrollbar {
  width: 8px;
  height: 0px;
  background: var(--neutral-surface-light);
  border-radius: 20px;
}

.list::-webkit-scrollbar-thumb {
  background: var(--neutral-surface-subtle);
  border-radius: 5px;
}

.card {
  border: 1px solid var(--neutral-border-subtle);
  border-radius: 8px;
}

.card__header {
  overflow: hidden;
  display: flex;
  height: 60px;
  align-items: center;
  border-radius: 8px;
  position: relative;
  box-shadow: var(--elevation-xs);
}

.card__header:hover .card__header-text {
  width: calc(100% - 50px);
}

.card__header:hover .card__header-action {
  left: calc(100% - 50px);
}

.card__header-text {
  display: grid;
  grid-template-columns: 1fr auto;
  column-gap: 16px;
  grid-template-areas: "mov number" "project text";
  align-items: center;
  box-sizing: border-box;
  width: 100%;
  height: 60px;
  padding: 8px 20px;
  transition: 0.3s;
  position: absolute;
}

.card__header-action {
  transition: 0.3s;
  width: 50px;
  padding: 0 20px 0 0;
  position: absolute;
  left: 100%;
}

.card__header-text span:nth-child(1) {
  grid-area: mov;
  font-weight: 600;
  font-size: 14px;
  line-height: 18px;
  letter-spacing: 0%;
  vertical-align: middle;
  color: var(--primary-text-default);
  text-align: left;
}

.card__header-text span:nth-child(2) {
  grid-area: project;
  font-weight: 400;
  font-size: 12px;
  line-height: 16px;
  letter-spacing: 0%;
  vertical-align: middle;
  color: var(--neutral-text-body);
  text-align: left;
}

.card__header-text span:nth-child(3) {
  grid-area: number;
  font-weight: 600;
  font-size: 14px;
  line-height: 16px;
  letter-spacing: 0%;
  vertical-align: middle;
  color: var(--neutral-text-body);
  text-align: right;
}

.card__header-text span:nth-child(4) {
  grid-area: text;
  font-weight: 400;
  font-size: 12px;
  line-height: 16px;
  letter-spacing: 0%;
  vertical-align: middle;
  color: var(--neutral-text-caption);
  text-align: right;
}

.card__body {
  padding: 20px;
  box-sizing: border-box;
  height: auto;
  max-height: calc(85vh - 320px);
}

.noData {
  width: 100%;
  height: 60px;
  text-align: center;
  color: var(--neutral-text-caption);
  font-weight: 400;
  font-size: 14px;
  line-height: 16px;
  padding-top: 22px;
}

/* footer */
.step2__footer {
  width: 100%;
  height: 40px;
  display: flex;
  justify-content: space-between;
  padding-top: 10px;
}

/* CUSTOM COMPONENTS - MODIFY */
.btnIconModify {
  border-radius: 50%;
  color: var(--bg-neutral-500);
}

.mainBtnModify {
  width: 175px;
}
</style>
