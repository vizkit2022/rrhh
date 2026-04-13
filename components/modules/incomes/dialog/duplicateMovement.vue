<script setup>
import { debounce } from "@/utils/helpers";
import useGlobalStore from "@/stores/global";
import useIncomesStore from "@/stores/incomes";

//STORE
const globalStore = useGlobalStore();
const incomesStore = useIncomesStore();

//EMIT
const emit = defineEmits(["closeModal"]);

//CONSTANTS

// nombre de la imagen en funcion del tema
const nameImgDuplicate = globalStore.isDark
  ? "duplicateDark"
  : "duplicateLight";

// v-model del input de busqueda de proyectos
const search = ref(incomesStore?.currentProject?.name);

const loadingSearch = ref(false);

// opciones del buscador
const options = ref([]);

// REACTIVE

// form data
const formData = reactive({
  nameProyect: incomesStore?.currentProject?.name,
  incomeId: incomesStore?.currentIncome?._id,
  projectId: incomesStore?.currentProject?._id,
  replaceZeroAmount: false,
});

// FUNCTIONS

const mapperResults = (list) => {
  return list.map((l) => ({
    label: l.name,
    value: l._id,
    fullData: l,
  }));
};

const handleInputSearch = debounce(async (e) => {
  formData.projectId = null;
  const input = e.target.value.trim();

  // Si borra el input, limpia el projectId seleccionado
  if (input === "") {
    options.value = [];
    return;
  }

  loadingSearch.value = true;
  await incomesStore.filterProjectsSimpleName(input, true);
  options.value = incomesStore.temp.length
    ? mapperResults(incomesStore.temp)
    : [];
  loadingSearch.value = false;
}, 600);

const selectedOption = (option) => {
  formData.nameProyect = option.fullData.name;
  formData.projectId = option.fullData._id;
};

const handleCleanInput = () => {
  search.value = "";
  formData.projectId = null;
  formData.nameProyect = "";
  options.value = [];
};

const saveDuplicate = async () => {
  try {
    globalStore.loading = true;

    const body = {
      incomeId: formData.incomeId,
      projectId: formData.projectId,
      replaceZeroAmount: formData.replaceZeroAmount,
    };

    const response = await incomesStore.duplicateIncome(body);

    emit("closeModal");

    // verifica si se duplico y navego a la nueva cotizacion duplicada
    if (response?.duplicatedIncome) {
      const { _id: newIncomeId, project: projectId } =
        response.duplicatedIncome;
      await navigateTo(`/incomesv2/project/${projectId}/income/${newIncomeId}`);
    }
  } catch (e) {
    console.error("Error duplicating income:", e);
  } finally {
    globalStore.loading = false;
  }
};

const handleCloseEsc = (e) => {
  if (e.key === "Escape") {
    emit("closeModal");
  }
};

onMounted(() => {
  document.addEventListener("keydown", handleCloseEsc);
});

onBeforeUnmount(() => {
  document.removeEventListener("keydown", handleCloseEsc);
});
</script>

<template>
  <div class="duplicateMovement">
    <div class="duplicateMovement__top">
      <div class="imgDuplicate">
        <img
          :src="`/img/${nameImgDuplicate}.svg`"
          alt="duplicateMovement"
          style="width: 84px; height: 84px"
        />
      </div>

      <span class="body-m-sb title"
        >Selecciona el proyecto en el que quieres duplicar esta cotización</span
      >

      <div class="selectDuplicate">
        <u-search
          class="search"
          v-model="search"
          placeholder="Busca un proyecto"
          :revers="true"
          :options="options"
          :loading="loadingSearch"
          icon="search"
          size="l"
          :alwaysShowOptions="true"
          @input="handleInputSearch"
          @selectedOption="selectedOption"
          @cleanInput="handleCleanInput"
        />
        <span class="body-s-r subtitle"
          >Puedes seleccionar otro proyecto</span
        >
      </div>
    </div>

    <div class="duplicateMovement__mid">
      <div class="izq">
        <div
          style="
            display: flex;
            width: 36px;
            height: 36px;
            justify-content: center;
            align-items: center;
          "
        >
          <u-checkbox
            v-model="formData.replaceZeroAmount"
            label="Crear nuevo proyecto"
            :height="16"
          />
        </div>
        <span class="body-m-r text_duplicate"
          >Duplicar con los valores en cero</span
        >
      </div>
      <div>
        <u-tooltip
          text="Mantiene las mismas líneas y cantidades, pero sin los montos asignados."
          orientation="top"
          background-color="var(--neutral-surface-dark)"
        >
          <span
            class="u u-question-outlined"
            style="display: flex; align-items: center; font-size: 20px"
          ></span>
        </u-tooltip>
      </div>
    </div>

    <div class="duplicateMovement__bottom">
      <u-button
        text="Cancelar"
        type="outlined"
        size="m"
        @click="emit('closeModal')"
      />
      <u-button
        text="Duplicar"
        size="m"
        @click="saveDuplicate"
        :disabled="formData.projectId === null"
      />
    </div>
  </div>
</template>

<style scoped>
.duplicateMovement {
  display: flex;
  flex-direction: column;
  width: 472px;
  height: 380px;
}

.duplicateMovement__top {
  display: grid;
  grid-template-rows: 84px 18px 64px;
  width: 100%;
  height: 214px;
  gap: 24px;
}

.duplicateMovement__top .imgDuplicate {
  display: flex;
  justify-content: center;
}

.duplicateMovement__top .title {
  color: var(--neutral-text-body);
}

.duplicateMovement__top .selectDuplicate {
  display: flex;
  gap: 8px;
  flex-direction: column;
  justify-content: center;
}

.duplicateMovement__top .selectDuplicate .search {
  width: 100%;
}

.duplicateMovement__top .selectDuplicate .subtitle {
  padding-left: 12px;
  color: var(--neutral-text-caption);
}

.duplicateMovement__mid {
  display: flex;
  align-items: center;
  border-top: 1px solid var(--neutral-border-subtle);
  width: 100%;
  height: 40px;
  margin-top: 32px;
}

.duplicateMovement__mid .izq {
  display: flex;
  align-items: center;
  width: 100%;
  gap: 8px;
}

.text_duplicate {
  color: var(--neutral-text-body);
}

.duplicateMovement__bottom {
  display: flex;
  justify-content: space-between;
  margin-top: 48px;
}
</style>
