<script setup>
import { ref, defineEmits, defineProps, computed, onMounted, watch } from "vue";

import { onlyNumbers } from "@/utils/helpers";

import useGlobalStore from "@/stores/global";
import useLinesStore from "@/stores/lines";
import useIncomesStore from "@/stores/incomes";
import usePermissionsStore from "@/stores/permissions";

const { params } = useRoute();
const idIncome = params && params.income ? params.income : null;

// STORES
const globalStore = useGlobalStore();
const linesStore = useLinesStore();
const incomesStore = useIncomesStore();
const permissionsStore = usePermissionsStore();

// EMITS
const emit = defineEmits(["closeModal"]);

// Props
const props = defineProps({
  line: {
    type: Object,
    defuault: () => {},
  },
  currentPostLine: {
    type: Number,
    default: null,
  },
});

// CONSTANTS
const color = "--neutral-text-caption";
const { t } = useI18n();
const module = "modules.incomes.pages.summary.modal.info";
const tabSelected = ref(0);
const change = ref(false);
const loading = ref(false);
const showCategories = ref(true);
const counters = ref({
  numberLines: 0,
  numberSelected: 0
})
const showDescription = ref(false);
const tabs = computed(() => ([
  {
    label: t(`${module}.tabs.tab1`),
    icon: "",
    tab: 0,
    indicator: false,
    disabled: false,
    main: false,
  },
  {
    label: t(`${module}.tabs.tab2`),
    icon: "",
    tab: 1,
    indicator: false,
    disabled: !permissionsStore.myPermissions.surcharges__add || form.value.applied !== "toLines",
    main: false,
  },
]));
const options = ref({
  applied: [
    {
      label: t(`${module}.inputs.select1.options[0].label`),
      value: "toTotals",
    },
    {
      label: t(`${module}.inputs.select1.options[1].label`),
      value: "toLines",
    },
    {
      label: t(`${module}.inputs.select1.options[2].label`),
      value: "noTotal",
    },
    // {
    //   label: t(`${module}.inputs.select1.options[3].label`),
    //   value: "editValue",
    // },
    {
      label: t(`${module}.inputs.select1.options[4].label`),
      value: "agencyCommission"
    }
  ],
  costCalc: [
    {
      label: t(`${module}.inputs.select2.options[0].label`),
      value: "toTotals",
    },
    {
      label: t(`${module}.inputs.select2.options[1].label`),
      value: "equalValue",
    },
    // {
    //   label: t(`${module}.inputs.select2.options[2].label`),
    //   value: "editValue",
    // },
    {
      label: t(`${module}.inputs.select2.options[3].label`),
      value: "noTotal",
    },
    {
      label: t(`${module}.inputs.select2.options[4].label`),
      value: "toLines",
    },
  ],
});
const form = ref({
  // aplicacion en el valor de venta
  appliedName: "",
  applied: "",
  // Calculo del costo presupuestado
  costCalcName: "",
  costCalc: "", // si es 1 se deshabilita el checkbox
  percentage: "",
  numberLinesSurcharges: props.line.numberLinesSurcharges || 0,
  surchargesDependencies: {
    value: "",
    options: [],
    surcharge: [],
  },
});
const states = ref({});
const editForm = ref(false);

// WATCH
watch(
  () => tabSelected.value,
  async (newVal, oldVal) => {
    if (newVal === 1) {
      loading.value = true;

      try {
        const project = incomesStore?.income?._id;
        const surcharge = props?.line?._id;
      
        const [, countersResult] = await Promise.all([
          changeType(),
          incomesStore.getTotalLinesByProject(project, surcharge)
        ]);
      
        counters.value = countersResult;
      } finally {
        loading.value = false;
      }
    }

  }
);

// MOUNTED
onMounted(async () => {
  form.value.percentage = props.line?.numbers?.percentage?.value;
  form.value.applied = props.line?.surchargeVariables?.sumPrice?.state;
  (form.value.appliedName = getName(
    props.line?.surchargeVariables?.sumPrice?.state || "",
    "applied"
  )),
    (form.value.costCalc = props.line?.surchargeVariables?.sumBudget?.state);
  (form.value.costCalcName = getName(
    props.line?.surchargeVariables?.sumBudget?.state || "",
    "costCalc"
  )),
    (states.value = {
      addedValueShow: !props.line?.surchargeVariables?.field !== "editValue",
      addedValueDisabled:
        props.line?.surchargeVariables?.field !== "editPercentage",
    });

  // form.value.surchargesDependencies.surcharge = JSON.parse(
  //   JSON.stringify(props.line?.surchargeVariables?.surchargesDependencies || [])
  // );

  form.value.surchargesDependencies.surcharge = linesStore.linesSurcharges
    .filter((l) => {
      return JSON.stringify(
        props.line?.surchargeVariables?.sumPrice?.surchargesDependencies || []
      ).includes(l._id);
    })
    .map((l) => {
      return {
        name: l.name,
        _id: l._id,
      };
    });

  form.value.surchargesDependencies.options = linesStore.linesSurcharges
    .filter(
      (l) =>
        l.order < props.line?.order &&
        !form.value.surchargesDependencies.surcharge.some(
          (s) => s._id === l._id
        )
    )
    .map((l) => ({
      label: l.name,
      value: l._id,
    }));

  tabs.value[1].disabled =
    props.line?.surchargeVariables?.field === "editValue" ||
    props.line?.surchargeVariables?.sumPrice?.state === "toTotals";

});

// COMPUTED
const textButton = computed(() => {
  return t(
    module + `.buttons.${showCategories.value ? "surcharge" : "categories"}`
  );
});
const appliedLinesText = computed(() => {
  return t(module + ".texts.text2", {
    count: counters.value.numberSelected,
    total: counters.value.numberLines || 0,
  });
});

// FUNCTIONS
const fullDataApplied = (data) => {
  form.value.applied = data.value;
  change.value = true
  editForm.value = true;
  if (data === "toTotals") {
    tabs.value[1].disabled =
      props.line?.surchargeVariables?.field === "editValue" ||
      data === "toTotals";
  }
};
const fullDataCostCalc = (data) => {
  form.value.costCalc = data.value;
  editForm.value = true;
  change.value = true;
  if (data.value === "toTotals") form.value.costCalcEnable = false;
};
const inputPercentage = () => {
  let { percentage } = form.value;
  editForm.value = true;
  return onlyNumbers(percentage);
};

const searchsurchargesDependencies = (e) => {
  const newValue = e.target.value;

  const selectedIds = form.value.surchargesDependencies.surcharge.map(
    (s) => s._id
  );

  const filtered = linesStore.linesSurcharges
    .filter(
      (l) =>
        l.name.toLowerCase().includes(newValue.toLowerCase()) &&
        l.order < props.line?.order &&
        !selectedIds.includes(l._id)
    )
    .map((l) => ({
      label: l.name,
      value: l._id,
    }));

  form.value.surchargesDependencies.options = filtered;
};

const selectedsurchargesDependencies = (option) => {
  if (option) {
    const surcharge = linesStore.linesSurcharges.find(
      (l) => l._id === option.value
    );
    if (surcharge) {
      change.value = true;
      form.value.surchargesDependencies.surcharge.push({
        name: surcharge.name,
        _id: surcharge._id,
      });
      form.value.surchargesDependencies.options =
        form.value.surchargesDependencies.options.filter(
          (o) => o.value !== option.value
        );
      editForm.value = true;
    }
  }
};

const cleansurchargesDependencies = () => {
  form.value.surchargesDependencies.value = "";

  const selectedIds = form.value.surchargesDependencies.surcharge.map(
    (s) => s._id
  );

  form.value.surchargesDependencies.options = linesStore.linesSurcharges
    .filter((l) => l.order < props.line?.order && !selectedIds.includes(l._id))
    .map((l) => ({
      label: l.name,
      value: l._id,
    }));
};

const removeTagsurchargesDependencies = (index) => {
  form.value.surchargesDependencies.surcharge.splice(index, 1);
  change.value = true;
  // Opciones = todas menos las ya seleccionadas
  form.value.surchargesDependencies.options = linesStore.linesSurcharges
    .filter(
      (l) =>
        l.order < props.line?.order &&
        !form.value.surchargesDependencies.surcharge.some(
          (s) => s._id === l._id
        )
    )
    .map((l) => ({
      label: l.name,
      value: l._id,
    }));
  editForm.value = true;
};

const blurPercentage = () => {
  let { percentage } = form.value;

  if (typeof percentage !== "string") return "0,01 %";

  let cleanedValue = "";
  let hasDecimal = false;

  for (let i = 0; i < percentage.length; i++) {
    const char = percentage[i];

    if (char === "." || char === ",") {
      if (!hasDecimal) {
        cleanedValue += ".";
        hasDecimal = true;
      }
    } else {
      cleanedValue += char;
    }
  }

  let numericValue = parseFloat(cleanedValue);
  if (isNaN(numericValue) || numericValue <= 0) return "0,01 %";
  if (numericValue > 100) return "100 %";

  if (!hasDecimal) return numericValue.toString() + " %";

  return numericValue.toFixed(2).replace(".", ",") + " %";
};
const getName = (name, prop) => {
  if (String(name).trim() !== "") {
    const option = options?.value?.[prop].find((op) => op.value === name);
    return option?.label || '';
  }
  return "";
};

/* Navigator */
const configExplorer = {
  minWidthCols: "408px",
  cols: [
    { type: "checkbox" },
    { type: "code", width: "80px" },
    { type: "name", width: "minmax(200px, 1fr)" },
    {
      type: "assigned",
      width: "100px",
      prop: { num1: "numberLinesSurcharges", num2: "numberChildren" },
      label: { es: "Aplicadas", en: "Applied" },
    },
  ],
};
const surchargeLinesModified = ref(false);
const searchLine = ref("");
const resultLines = ref([]);
const loadingLines = ref(false);
const lines = ref([]);
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
    lines.value = await linesStore.getLinesWithSurcharge(
      props.line._id,
      option.oldData.__id
    );
  } else {
    breadcrumbs.value = [
      {
        name: { es: "Categorías", en: "Categories" },
        __id: "",
        income: { _id: option.oldData.income._id },
      },
    ];

    lines.value = await linesStore.getLinesWithSurcharge(
      props.line._id,
      option.oldData.parent
    );

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
  if (showCategories.value) {
    lines.value = await linesStore.getLinesWithSurcharge(
      props.line._id,
      category.__id
    );
  } else {
    const resp = await linesStore.getLinesSurcharges(false);
    lines.value = [];
    const index = resp.findIndex((r) => r._id === props.line._id);

    resp.slice(0, index).forEach((l) => {
      if (!l.isCut) {
        lines.value.push(l);
      }
    });
  }
  linesStore.loading = false;
};
const updatedCount = async () => {
  const resp = await linesStore.countLinesSurcharge(props.line._id);
  if (resp) {
    countSurcharge.value = resp;
  }
};
const breadcrumbs = ref([
  {
    name: { es: "Categorías", en: "Categories" },
    __id: "",
    income: idIncome,
  },
]);
const applySurchargeToLines = async () => {
  
  const someChange = lines.value.some((l) => l.change);
  if (someChange) {
    const allSelected = lines.value.every((l) => l.selected);
    if (breadcrumbs.value.length === 1 && allSelected) {
      save();
    } else {
      let body = {
        surcharge: props.line._id,
        income: idIncome,
        lines: [],
        parents: [],
        isSurcharge: false,
      };

      if (showCategories.value) {
        if (lines.value.some((l) => l.selected)) {
          body["parent"] = {
            __id: linesStore.lines[0].parent || null,
            state: true,
          };
        }

        lines.value.forEach((line) => {
          if (line.change) {
            body.isSurcharge = false;
            if (line.isParent) {
              body.parents.push({ __id: line.__id, state: line.selected });
              line.numberLinesSurcharges = line.selected
                ? line.numberChildren
                : 0;
            } else {
              body.lines.push({ __id: line.__id, state: line.selected });
            }
          }
        });
      } else {
        body.parents = [{ __id: null, state: true }];
        body.isSurcharge = true;
        lines.value.forEach((line) => {
          if (line.change) {
            body.lines.push({ __id: line.__id, state: line.selected });
          }
        });
      }

      globalStore.loading = true;

      try {
        loading.value = true;
        await linesStore.applySurchargeToSelectedLines(body);
        
        const project = incomesStore?.income?._id;
        const surcharge = props?.line?._id;

        const countersResult = await incomesStore.getTotalLinesByProject(project, surcharge)

        counters.value = countersResult;
      
        surchargeLinesModified.value = false;
        
      } catch (error) {
        emit("closeModal");
        console.error("Error applying surcharge to lines:", error);
      } finally {
        loading.value = false;
        globalStore.loading = false;
      }
    }

    if(change.value) {
      await singleSave();
    } else {
      const surchargeResponse = await linesStore.saveTotalsSurcharges(
        props.currentPostLine
      );
      incomesStore.loadings.metrics = true;
      if (surchargeResponse) {
        linesStore.linesSurcharges = surchargeResponse.linesSurcharges;
        incomesStore.totalGrossIncome = surchargeResponse.totals;
      }
    }

    linesStore.updateDataGrid();
  }
};
const propsPartial = {
  prop1: "numberLinesSurcharges",
  prop2: "numberChildren",
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
const changeType = async (change = false) => {
  if (change) showCategories.value = !showCategories.value;

  linesStore.loading = true;

  if (showCategories.value) {
    breadcrumbs.value = [
      {
        name: { es: "Categorías", en: "Categories" },
        __id: "",
        income: idIncome,
      },
    ];
    lines.value = await linesStore.getLinesWithSurcharge(props.line._id);
  } else {
    breadcrumbs.value = [
      {
        name: { es: "Sobrecargos", en: "Fees" },
        __id: "",
        income: idIncome,
      },
    ];
    const resp = await linesStore.getLinesSurcharges(false);
    lines.value = [];
    const index = resp.findIndex((r) => r._id === props.line._id);

    resp.slice(0, index).forEach((l) => {
      if (!l.isCut) {
        lines.value.push(l);
      }
    });
  }
  // await updatedCount();
  linesStore.loading = false;
};

const save = async () => {
  try {
    globalStore.loading = true;
    await saveCurrentLine();
  } catch (error) {
    console.error(error);
    emit("closeModal");
  } finally {
    globalStore.loading = false;
  }
};

const closeModal = async () => {
  globalStore.loading = true;
  form.value.surchargesDependencies.surcharge = [];
  if (surchargeLinesModified.value) await saveCurrentLine();
  globalStore.loading = false;
  emit("closeModal");
};

const saveCurrentLine = async () => {
  const number = form.value.percentage.replace("%", "").replace(" ", "");

  const line = {
    ...props.line,
    name: form.value.name,
    numbers: {
      ...props.line.numbers,
      percentage: {
        ...props.line.numbers.percentage,
        value: form.value.percentage,
        number: Number(number),
      },
    },
  };

  const index = linesStore.linesSurcharges.findIndex(
    (s) => s._id === props.line._id
  );

  linesStore.linesSurcharges[index] = line;

  await linesStore.applySurchargeToAllLines(line);
  await linesStore.calculateLineSurcharge(null, line);
  await linesStore.saveTotalsSurcharges();
  await incomesStore.getMovementBasicData(idIncome);
  await linesStore.getLinesSurcharges();
  await linesStore.getAllGroups(idIncome);
};

const singleSave = async () => {
  globalStore.loading = true;
  const surchargeResponse = await linesStore.saveTotalsSurchargesByObject({
    ...props.line,
    numbers: {
      ...props.line.numbers,
      percentage: {
        ...props.line.numbers.percentage,
        value: form.value.percentage,
        number: Number(form.value.percentage.replace("%", "")),
      },
    },
    surchargeVariables: {
      ...props.line.surchargeVariables,
      sumPrice: {
        state: form.value.applied,
        surchargesDependencies: form.value.surchargesDependencies.surcharge.map(
          (s) => s._id
        ),
      },
      sumBudget: {
        state: form.value.costCalc,
      },
    },
  });

  incomesStore.loadings.metrics = true;

  if (surchargeResponse) {
    linesStore.linesSurcharges = surchargeResponse.linesSurcharges;
    incomesStore.totalGrossIncome = surchargeResponse.totals;
  }

  linesStore.updateDataGrid();

  await closeModal();

  globalStore.loading = false;
};

const updateSelected = (line) => {
  const pos = lines.value.findIndex((l) => l._id === line._id);
  if (pos !== -1) lines.value[pos] = { ...line, change: true };
};
</script>

<template>
  <div class="surchargeInf">
    <div class="surchargeInf__header">
      <span class="title" v-text="props.line.name"></span>
      <u-button-icon
        icon="close"
        class="btnIconModify"
        :color="color"
        size="s"
        type="outlined"
        @action-btn="closeModal"
      />
    </div>
    <u-tabs class="surchargeInf__tabs" :tabs="tabs" v-model="tabSelected" />
    <div v-if="tabSelected === 0" class="surchargeInf__form">
      <div class="card">
        <div class="card__title">
          <span v-text="props.line.name"></span>
          <span v-if="props?.line?.code">{{ props.line.code }}</span>
          <button
            class="u u-question-filled"
            @click="showDescription = !showDescription"
            v-if="props?.line?.description"
          ></button>
        </div>
        <div class="card__amount" v-if="states.addedValueShow">
          <span v-text="t(module + '.texts.text3')"></span>
          <u-input
            v-model="form.percentage"
            size="s"
            :align="'right'"
            style="width: 120px"
            @input="form.percentage = inputPercentage(); change = true"
            @focus="form.percentage = form.percentage.replace(' %', '')"
            @blur="form.percentage = blurPercentage()"
            :disabled="!permissionsStore.myPermissions.surcharges__add || states.addedValueDisabled"
          />
        </div>
        <div class="card__description" v-if="showDescription">
          <p>
            Lorem ipsum, dolor sit amet consectetur adipisicing elit. Voluptas
            commodi rem dignissimos unde beatae neque quam placeat vitae
            corrupti optio harum adipisci doloribus quisquam iusto recusandae,
            mollitia quibusdam aliquid ab.
          </p>
        </div>
      </div>
      <div class="group" v-if="states.addedValueShow">
        <span v-text="t(module + '.inputs.select1.label')"></span>
        <u-select
          :placeholder="t(module + '.inputs.select1.placeholder')"
          :custom="true"
          size="s"
          :options="options.applied"
          v-model="form.appliedName"
          :full-data="true"
          :disabled="!permissionsStore.myPermissions.surcharges__add"
          @full-data="fullDataApplied"
        >
          <template v-slot:option="item">
            <div class="selectOption">
              <span class="label">{{ item.item.label }}</span>
            </div>
          </template>
        </u-select>
      </div>
      <div v-if="form.applied === 'toLines'" class="card__item">
        <div class="group">
          <span v-text="t(module + '.inputs.select3.label')"></span>
          <u-search
            v-model="form.surchargesDependencies.value"
            :options="form.surchargesDependencies.options"
            :alwaysShowOptions="true"
            :placeholder="t(module + '.inputs.select3.placeholder')"
            size="s"
            :disabled="!permissionsStore.myPermissions.surcharges__add"
            @input="searchsurchargesDependencies($event)"
            @selectedOption="selectedsurchargesDependencies($event)"
            @cleanInput="cleansurchargesDependencies"
          />
        </div>
        <div
          class="card__item-inf"
          v-if="form.surchargesDependencies.surcharge.length"
        >
          <u-tags
            v-for="(surcharge, index) in form.surchargesDependencies.surcharge"
            size="s"
            :key="index"
            :text="surcharge.name"
            :delete="true"
            :disabled="!permissionsStore.myPermissions.surcharges__add"
            @closeButton="removeTagsurchargesDependencies(index)"
          />
        </div>
      </div>
      <div class="group" v-if="states.addedValueShow">
        <span v-text="t(module + '.inputs.select2.label')"></span>
        <u-select
          :placeholder="t(module + '.inputs.select2.placeholder')"
          :custom="true"
          size="s"
          :options="options.costCalc"
          v-model="form.costCalcName"
          :full-data="true"
          :disabled="!permissionsStore.myPermissions.surcharges__add"
          @full-data="fullDataCostCalc"
        >
          <template v-slot:option="item">
            <div class="selectOption">
              <span class="label">{{ item.item.label }}</span>
            </div>
          </template>
        </u-select>
      </div>
    </div>
    <div class="surchargeInf__body" v-else-if="!tabs[1].disabled">
      <div class="surchargeInf__body-fixed">
        <div class="text">
          <span v-text="t(module + '.texts.text1')"></span>
          <u-loading v-if="loading" :width="12" />
          <span v-else v-text="appliedLinesText"></span>
        </div>
        <div class="action">
          <u-button
            icon="change"
            :text="textButton"
            type="outlined"
            size="s"
            @click="changeType(true)"
            :disabled="!permissionsStore.myPermissions.surcharges__add || linesStore.loading"
          />
        </div>
      </div>
      <div class="surchargeInf__body-content">
        <NavigationFolderExplorer
          :save="true"
          :isSurcharge="showCategories ? '' : props.line._id"
          :config="configExplorer"
          @searching="(text) => (searchLine = text)"
          :resultsSearch="resultLines"
          :loadingSearch="loadingLines"
          @cleanInput="clearSearchLine"
          @selectedOption="selectedLineBySearch"
          :list="lines"
          :loadingList="linesStore.loading"
          @filterByCategory="filterByCategory"
          :breadcrumbs="breadcrumbs"
          @updateSelected="(line) => updateSelected(line)"
          @save="applySurchargeToLines"
          :propsPartial="propsPartial"
        />
      </div>
    </div>
    <div class="surchergeInf__footer" v-if="tabSelected === 0">
      <u-button
        :text="t(module + '.buttons.save')"
        class="mainBtnModify"
        size="s"
        @click="singleSave"
        :disabled="!permissionsStore.myPermissions.surcharges__add || !editForm"
      />
    </div>
  </div>
</template>

<style scoped>
.surchargeInf {
  width: 720px;
  height: auto;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.surchargeInf__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 32px;
}
.surchargeInf__header span.title {
  font-size: 16px;
  font-weight: 600;
  line-height: 20px;
  text-align: left;
  color: var(--neutral-text-body);
}
.surchargeInf__tabs {
  height: 32px;
}

.card__item {
  display: flex;
  flex-direction: column;
  gap: 16px;
  width: auto;
  height: auto;
  padding: 16px;
  border-radius: 8px;
  border: 1px solid var(--neutral-border-subtle);
}

.card__item-inf {
  display: flex;
  gap: 10px;
  width: 100%;
  flex-wrap: wrap;
  max-height: 68px;
  overflow-y: auto;
  margin-bottom: 10px;
}

.card__item-inf::-webkit-scrollbar {
  width: 8px;
  height: 8px;
  background: var(--neutral-surface-light);
  border-radius: 20px;
}

.card__item-inf::-webkit-scrollbar-thumb {
  background: var(--neutral-surface-subtle);
  border-radius: 5px;
}

.surchargeInf__body {
  flex-grow: 1;
  min-height: 410px;
  border-radius: 10px;
  border: 1px solid var(--neutral-border-subtle);
  box-sizing: border-box;
}
.surchargeInf__form {
  flex-grow: 1;
  min-height: 200px;
  height: auto;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  gap: 24px;
  padding-bottom: 120px;
}
.surchargeInf__body-fixed {
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-shadow: var(--elevation-xs);
  padding: 16px;
}
.surchargeInf__body-fixed .text {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.surchargeInf__body-fixed .text span:nth-child(1) {
  font-weight: 400;
  font-size: 12px;
  line-height: 16px;
  letter-spacing: 0%;
  color: var(--neutral-text-caption);
}
.surchargeInf__body-fixed .text span:nth-child(2) {
  font-weight: 600;
  font-size: 14px;
  line-height: 16px;
  letter-spacing: 0%;
  color: var(--neutral-text-body);
}
.surchargeInf__body-content {
  padding: 16px;
  box-sizing: border-box;
}
.surchargeInf__body-content::v-deep(.listExplorer) {
  max-height: calc(100vh - 600px);
  height: auto;
}
.surchargeInf__body-fixed .action {
  padding-left: 16px;
  border-left: 1px solid var(--neutral-border-subtle);
}
.surchergeInf__footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  height: 32px;
}
/* Card */
.card {
  display: grid;
  grid-template-areas: "title input" "description description";
  grid-template-columns: 1fr auto;
  grid-template-rows: auto auto;
  border: 1px solid var(--neutral-border-subtle);
  padding: 16px;
  border-radius: 8px;
}
.card__title {
  grid-area: title;
  height: 100%;
  display: flex;
  align-items: center;
  gap: 10px;
}
.card__title span:nth-child(1) {
  font-weight: 600;
  font-size: 14px;
  line-height: 18px;
  letter-spacing: 0%;
  color: var(--primary-text-default);
}
.card__title span:nth-child(2) {
  font-weight: 600;
  font-size: 14px;
  line-height: 18px;
  letter-spacing: 0%;
  color: var(--neutral-text-caption);
}
.card__title button {
  font-size: 20px;
}
.card__amount {
  grid-area: input;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  justify-content: center;
  gap: 4px;
}
.card__amount span {
  font-weight: 400;
  font-size: 10px;
  line-height: 14px;
  letter-spacing: 10%;
  color: var(--neutral-text-caption);
  text-transform: uppercase;
}
.card__description {
  grid-area: description;
  padding-top: 10px;
}
.card__description p {
  font-weight: 600;
  font-size: 12px;
  line-height: 16px;
  letter-spacing: 0%;
  color: var(--neutral-text-caption);
}
/* GROUPS */
.group {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.group span {
  font-weight: 600;
  font-size: 12px;
  line-height: 16px;
  letter-spacing: 0%;
  color: var(--neutral-text-body);
}

/* OPTIONS - SELECT */
.selectOption {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.selectOption span:nth-child(1) {
  font-size: 14px;
  font-weight: 600;
  line-height: 18px;
  text-align: left;
  color: var(--neutral-text-body);
}
.opSelected span.truncateText,
.opSelected span.label {
  color: var(--primary-surface-darker) !important;
}

/* CUSTOM COMPONENTS - MODIFY */
.btnIconModify {
  border-radius: 50%;
}
.mainBtnModify {
  width: 135px;
}
</style>
