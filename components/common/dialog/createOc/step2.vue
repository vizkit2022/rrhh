<script setup>
import { ref, computed, defineProps, onMounted } from "vue";
import useGlobalStore from "@/stores/global";
import useIncomesStore from "@/stores/incomes";
import useLinesStore from "@/stores/lines";
import useOutcomesStore from "@/stores/outcomes";
import useUserStore from "@/stores/user";
import { removeExtraSpaces, capitalizeFirstLetter } from "@/utils/helpers";
import labels from "@/utils/labels/common.json";
// EventBus
const { $bus } = useNuxtApp();

$bus.$emit("updateDimensions", { width: "800px", height: "90vh" });
// Stores
const globalStore = useGlobalStore();
const incomesStore = useIncomesStore();
const linesStore = useLinesStore();
const outcomesStore = useOutcomesStore();
const userStore = useUserStore();

// Props
const props = defineProps({
  page: {
    type: String,
    default: "incomes",
  },
});

//   Constants
const documentID = ref("");
const movement = ref("");
const movementLoading = ref(false);
const movementResults = ref([]);
const searchLine = ref("");
const resultLines = ref([]);
const loadingLines = ref(false);
const movements = ref([]);
const currentMov = ref(null);
const breadcrumbs = ref([
  { name: { es: "Categorías", en: "Categories" }, __id: null, income: "" },
]);
const configExplorer = {
  minWidthCols: "328px",
  cols: [
    { type: "checkbox" },
    { type: "code", width: "80px" },
    { type: "name", width: "minmax(200px, 1fr)" },
  ],
};
const selectedLines = ref([]);

//   Computed
const placeholderMov = computed(() => {
  return labels.modal.createOc.step2.inputs.movement.placeholder[
    globalStore.lang
  ];
});
const textOf = computed(() => {
  return labels.modal.createOc.step2.card.of[globalStore.lang];
});
const textLineCard = computed(() => {
  return labels.modal.createOc.step2.card.text[globalStore.lang];
});
const page = computed(() => {
  if (["outcomes-1", "outcomes-2"].includes(props.page)) return "outcomes";
  return "incomes";
});

// Actions
const expandMov = async (pos) => {
  console.log("expandss");
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
    await outcomesStore.getAllLinesOutcomes({
      income: movements.value[pos]._id,
      parent: "null",
    });
    outcomesStore.loading = false;
  }
};
const filterByCategory = async (category, pos) => {
  outcomesStore.loading = true;
  updatedBreadcrumb(category, pos);
  await outcomesStore.getAllLinesOutcomes({
    income: category.income._id,
    parent: category.__id,
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
const backStep = () => {
  $bus.$emit("updatedStep", false);
};
const nextStep = () => {
  if (selectedLines.value.length) {
    outcomesStore.linesOcSelected = selectedLines.value.map((l) => ({
      ...l,
      taxes: [],
      numbers: {
        ...l.numbers,
        tax: {
          lastNumber: 0,
          lastValue: "",
          number: 0,
          value: "",
        },
        totalRetencion: {
          lastNumber: 0,
          lastValue: "",
          number: 0,
          value: "",
        },
        totalTaxAddition: {
          lastNumber: 0,
          lastValue: "",
          number: 0,
          value: "",
        },
      },
    }));
    $bus.$emit("updatedStep", true);
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
const cleanForm = () => {
  movement.value = "";
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
    await outcomesStore.getAllLinesOutcomes({
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
const addLinesToOutcomes = async () => {
  globalStore.loading = true;
  try {
    outcomesStore.linesOcSelected = selectedLines.value;
    for (const line of outcomesStore.linesOcSelected) {
      line.numbers.budget = line.numbers.toSpend;
      const newLine = await linesStore.calculateSimpleLine(
        line,
        outcomesStore.outcome_active.currency
      );
      if (!newLine) {
        throw new Error("Failed to calculate line");
      }
      line.numbers = newLine.numbers;
    }

    var NewOutcomeConlineas = {
      documentType: outcomesStore.outcome_active.documentType,
      outcome: outcomesStore.outcome_active._id,
      lines: outcomesStore.linesOcSelected,
      numbers: { ...outcomesStore.outcome_active.numbers },
      observation: outcomesStore.outcome_active.observation,
      reference: outcomesStore.outcome_active.reference,
      supplier: { ...outcomesStore.outcome_active.supplier },
      type: outcomesStore.outcome_active.type,
    };

    const { success, data, error } = await outcomesStore.addLineOutcomeMany(
      NewOutcomeConlineas
    );

    if (success) {
      $bus.$emit("selectedInd", { pos: 1, loading: true });
    }
    $bus.$emit("closeDialog");
    $bus.$off("closeDialog");
    globalStore.loading = true;
  } catch (err) {
    globalStore.loading = false;
    console.log("err", err);
  }
};
const filterLineByMov = (id) => {
  return selectedLines.value.filter((l) => l.income._id === id).length;
};
const deleteMov = (id) => {
  selectedLines.value = selectedLines.value.filter((l) => l.income._id !== id);
  movements.value = movements.value.filter((m) => m._id !== id);
};
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

// Watch
watch(ref(movement), async (newValue) => {
  if (newValue !== "") {
    movementLoading.value = true;
    const results = await incomesStore.searchProject(newValue);
    if (results.length) {
      movementResults.value = mapperSearchMov(results);
    } else {
      movementResults.value = [];
    }
    movementLoading.value = false;
  }
});
watch(ref(searchLine), async (newVal, oldVal) => {
  const text = removeExtraSpaces(newVal);
  if (text !== "") {
    loadingLines.value = true;
    const resp = await linesStore.searchLine(currentMov.value, text);
    resultLines.value = mapperLine(resp);
    loadingLines.value = false;
  }
});
// Mounted
onMounted(async () => {
  if (props.page === "incomes") {
    movements.value.push({
      name: incomesStore.income.name,
      project: incomesStore.projectName,
      expand: false,
      _id: incomesStore.income._id,
      totalLines: incomesStore.income.amountLines,
    });
  } else {
    globalStore.loading = true;
    // Llamar al endpoint de movimientos
    const projects = await incomesStore.searchProject("");
    // Ejecutar todas las promesas de getTotalLinesByProject en paralelo
    const promises = projects.map(async (project) => {
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
    globalStore.loading = false;
  }

  if (outcomesStore.linesOcSelected.length) {
    selectedLines.value = outcomesStore.linesOcSelected;
  }
});
</script>

<template>
  <div class="step2">
    <div class="step2__header">
      <span
        v-text="labels.modal.createOc.step2.title[page][globalStore.lang]"
      ></span>
      <u-button-icon
        icon="close"
        class="btnIconModify"
        type="outlined"
        color="--neutral-text-caption"
        size="m"
        @click="
          $bus.$emit('closeDialog');
          $bus.$off('closeDialog');
        "
      />
    </div>
    <div class="step2__content">
      <div class="step2__mov">
        <span>{{
          labels.modal.createOc.step2.inputs.movement.label[globalStore.lang]
        }}</span>
        <u-search
          v-model="movement"
          :placeholder="placeholderMov"
          :loading="movementLoading"
          :snippet="true"
          :updated="false"
          :options="movementResults"
          :disabled="props.page === 'incomes'"
          @cleanInput="cleanForm"
          @selectedOption="selectedMovement"
        />
      </div>
      <div class="step2__container">
        <div class="step2__lines" v-if="movements.length">
          <span>{{
            labels.modal.createOc.step2.inputs.listOfLines.label[
              globalStore.lang
            ]
          }}</span>
        </div>
        <div class="step2__list">
          <div
            class="step2__item"
            v-for="(mov, m) in movements"
            :key="mov._id"
            :class="mov.expand ? 'expand' : 'noExpand'"
            :id="`item-${m}`"
          >
            <div class="step2__item-sup">
              <button @click="expandMov(m)">
                <div>
                  <span v-text="mov.name"></span>
                  <span v-text="mov.project"></span>
                </div>
                <div>
                  <span
                    >{{ filterLineByMov(mov._id) }} {{ textOf }}
                    {{ mov.totalLines }}</span
                  >
                  <span>{{ textLineCard }}</span>
                </div>
              </button>
              <u-button-icon
                :title="
                  labels.modal.createOc.step2.buttons.delete.tooltip[
                    globalStore.lang
                  ]
                "
                size="s"
                icon="close"
                type="text"
                color="--danger-text-default"
                color-hover="--danger-text-darker"
                color-active="--danger-text-darker"
                @click="deleteMov(mov._id)"
              />
            </div>
            <div class="step2__item-inf">
              <NavigationFolderExplorer
                class="navigator"
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
    </div>
    <div class="step2__footer">
      <div>
        <u-button
          v-if="props.page !== 'outcomes-2'"
          :text="labels.modal.createOc.step2.buttons.backTo[globalStore.lang]"
          type="outlined"
          class="mainBtnModify"
          @click="backStep"
        />
      </div>
      <u-button
        v-if="props.page === 'outcomes-2'"
        :text="labels.modal.createOc.step2.buttons.save[globalStore.lang]"
        class="mainBtnModify"
        @click="addLinesToOutcomes()"
        :disabled="selectedLines.length === 0"
      />
      <u-button
        v-else
        :text="labels.modal.createOc.step2.buttons.next[globalStore.lang]"
        class="mainBtnModify"
        @click="nextStep"
        :disabled="selectedLines.length === 0"
      />
    </div>
  </div>
</template>

<style scoped>
span {
  font-family: Nunito;
}
.step2 {
  display: grid;
  grid-template-rows: 40px 1fr 36px;
  gap: 24px;
  height: 100%;
  width: 100%;
}
.step2__content {
  display: grid;
  grid-template-rows: 60px 1fr;
  gap: 12px;
}
.step2__mov {
  display: flex;
  flex-direction: column;
  gap: 8px;
  height: 60px;
}
.step2__mov span,
.step2__lines span {
  font-size: 12px;
  font-weight: 600;
  line-height: 16px;
  color: var(--neutral-text-body);
}
.step2__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.step2__header span {
  font-size: 16px;
  font-weight: 600;
  line-height: 20px;
  color: var(--neutral-text-body);
}
.step2__footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.step2__container {
  display: grid;
  grid-template-rows: auto 1fr;
  gap: 8px;
}
.step2__list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  overflow-y: auto;
  height: calc(90vh - 80px - 40px - 36px - 60px - 12px - 22px - 8px - 60px);
}
.step2__list::-webkit-scrollbar {
  width: 8px;
  background: var(--neutral-surface-light);
  border-radius: 20px;
}
.step2__list::-webkit-scrollbar-thumb {
  background: var(--neutral-surface-subtle);
  border-radius: 5px;
}
.step2__item {
  flex-shrink: 0;
  transition: height 0.3s;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  border-radius: 8px;
  border: 1px solid var(--neutral-border-light);
}
.step2__item.expand {
  height: calc(90vh - 80px - 40px - 36px - 60px - 12px - 22px - 8px - 60px);
}
.step2__item.noExpand {
  height: 56px;
}
.step2__item-inf {
  flex-shrink: 0;
  background-color: var(--neutral-background-default);
  margin-top: 4px;
  height: calc(
    90vh - 80px - 40px - 36px - 60px - 12px - 22px - 8px - 60px - 60px
  );
  padding: 20px 40px;
}
.step2__item-sup {
  box-shadow: var(--elevation-xs);
  flex-shrink: 0;
  width: 100%;
  border-radius: 8px;
  background-color: var(--neutral-background-default);
  height: 56px;
  display: grid;
  grid-template-columns: 1fr 20px;
  gap: 10px;
  padding: 0 24px;
  align-items: center;
}
.step2__item-sup button {
  display: grid;
  grid-template-columns: 1fr auto;
}
.step2__item-sup button div {
  display: flex;
  flex-direction: column;
  gap: 8px;
  justify-content: center;
}
.step2__item-sup div:nth-child(1) {
  align-items: flex-start;
}
.step2__item-sup div:nth-child(2) {
  align-items: flex-end;
}
.step2__item-sup div:nth-child(1) span:nth-child(1),
.step2__item-sup div:nth-child(2) span:nth-child(1) {
  font-size: 14px;
  font-weight: 600;
  line-height: 18px;
}
.step2__item-sup div:nth-child(1) span:nth-child(2),
.step2__item-sup div:nth-child(2) span:nth-child(2) {
  font-size: 12px;
  font-weight: 400;
  line-height: 16px;
}
.step2__item-sup div:nth-child(1) span:nth-child(1) {
  color: var(--primary-text-default);
}
.step2__item-sup div:nth-child(2) span:nth-child(1),
.step2__item-sup div:nth-child(1) span:nth-child(2) {
  color: var(--neutral-text-body);
}
.step2__item-sup div:nth-child(2) span:nth-child(2) {
  color: var(--neutral-text-caption);
}

@media only screen and (max-width: 768px) {
  .step2__list {
    height: calc(90vh - 20px - 60px - 12px - 22px - 8px - 60px);
  }
  .step2__item.expand {
    height: calc(90vh - 20px - 60px - 12px - 22px - 8px - 60px);
  }
  .step2__item-inf {
    height: calc(90vh - 26px - 60px - 12px - 22px - 8px - 60px - 60px);
  }
}

/* CUSTOM COMPONENTS - MODIFY */
.btnIconModify {
  border-radius: 50%;
}
.mainBtnModify {
  min-width: 135px;
}
</style>
