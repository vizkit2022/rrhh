<script setup>
import { defineProps, onBeforeMount } from "vue";
import useGlobalStore from "@/stores/global";
import useOutcomesStore from "@/stores/outcomes";
import labels from "@/utils/labels/common.json";
import useLinesStore from "@/stores/lines";
import useIncomeStore from "@/stores/incomes";
import useOrganizationStore from "@/stores/organization";

// EventBus
const { $bus } = useNuxtApp();
const linesStore = useLinesStore();
const { name } = useRoute();
// Stores
const globalStore = useGlobalStore();
const outcomesStore = useOutcomesStore();
const incomesStore = useIncomeStore();
const organizationStore = useOrganizationStore();

const currencyDefault = ref(organizationStore.organization.currency);
outcomesStore.formOc.currency = currencyDefault;
// Props
const props = defineProps({
  content: {
    type: Array,
    default: () => [],
  },
  page: {
    type: String,
    default: "incomes",
  },
});

$bus.$emit("updateDimensions", { width: "80vw", height: "90vh" });

const BuscarTaxes = async (documentID) => {
  const resp = await outcomesStore.getDocumentByID(documentID);
  outcomesStore.formOc.taxDefault = resp.taxDefault;
  outcomesStore.taxes = resp.taxes;
};

// Mounted
onBeforeMount(async () => {
  //Consultar el documento y sus impuestos
  if (props.page == "outcomes") {
    BuscarTaxes(outcomesStore.outcome_active?.supplier?.payment?.document);
  }

  outcomesStore.createOcNumChanges += 1;
  outcomesStore.formOc.reference = checkIncomeIds(
    outcomesStore.linesOcSelected
  )[globalStore.lang];
});

// Actions
function checkIncomeIds(array) {
  // Crear un conjunto para almacenar los IDs únicos
  const uniqueIds = new Set();

  // Recorrer el array y añadir cada ID único al conjunto
  array.forEach((item) => {
    if (item.income && item.income._id) {
      uniqueIds.add(item.income._id);
    }
  });

  // Verificar cuántos IDs únicos hay
  const numUniqueIds = uniqueIds.size;

  // Determinar el resultado basado en la cantidad de IDs únicos
  if (numUniqueIds > 1) {
    return { es: "Varios", en: "Various" };
  } else if (numUniqueIds === 1) {
    const singleIdItem = array.find((item) => item.income && item.income._id);
    const name = singleIdItem ? singleIdItem.income.name : "";
    return { es: name, en: name };
  } else {
    // Si no hay IDs, devolver un valor predeterminado o vacío
    return { es: "", en: "" };
  }
}
const backStep = () => {
  $bus.$emit("updatedStep", false);
};
const create = async () => {
  globalStore.loading = true;
  try {
    const resp = await outcomesStore.createOc();
    if (resp) {
      $bus.$emit("updatedStep", true);
      $bus.$emit("refresh");
      if (name == "movementGrid") {
        if (incomesStore.hollywood) {
          await linesStore.getAllLinesIncomes({ parent: "null" });
        } else {
          await linesStore.getAllLinesIncomes();
        }
      }
    }
  } catch (error) {
    console.error("Error al procesar la solicitud:", error);
  } finally {
    globalStore.loading = false;
  }
};

// Computed
const label = computed(() => {
  return labels.modal.createOc.step3.inputs;
});
</script>

<template>
  <div class="containerModal" v-if="label">
    <div class="containerModal__header">
      <span v-text="labels.modal.createOc.step3.title[globalStore.lang]"></span>
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
    <div class="containerModal__content">
      <div class="containerModal__table">
        <TableMiniGrid
          :showTotals="false"
          page="CreateOC"
          propertyStoreTotals="formOc"
          propertyStoreLines="linesOcSelected"
        />
      </div>
      <div class="containerModal__content-additional">
        <div class="additional-col1">
          <!--          <div class="group">
            <label>{{ label.reference.label[globalStore.lang] }}</label>
            <u-input
              v-model="outcomesStore.formOc.reference"
              size="s"
              :placeholder="label.reference.placeholder[globalStore.lang]"
            />
          </div>           <div class="group">
            <label>{{ label.observation.label[globalStore.lang] }}</label>
            <u-textarea
              v-model="outcomesStore.formOc.observation"
              size="s"
              :placeholder="label.observation.placeholder[globalStore.lang]"
            />
          </div>   -->
        </div>
        <div class="additional-col2">
          <table-taxes-min
            :taxesList="outcomesStore.formOc.numbers"
            propertyStoreTotals="formOc"
          />
        </div>
      </div>
    </div>
    <div class="containerModal__footer">
      <u-button
        :text="labels.modal.createOc.step3.buttons.backTo[globalStore.lang]"
        type="outlined"
        class="mainBtnModify"
        @click="backStep"
      />
      <u-button
        :text="labels.modal.createOc.step3.buttons.createOc[globalStore.lang]"
        class="mainBtnModify"
        @click="create"
        :disabled="outcomesStore.formOc.numbers.total.number == 0"
      />
    </div>
  </div>
</template>

<style scoped>
span,
label {
  font-family: Nunito;
}

/* Sections */
.containerModal {
  display: grid;
  grid-template-rows: 40px 1fr 36px;
  width: 100%;
  height: 100%;
  gap: 24px;
}
.containerModal__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.containerModal__header span {
  font-size: 16px;
  font-weight: 600;
  line-height: 20px;
  color: var(--neutral-text-body);
}
.containerModal__content {
  width: 100%;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 24px;
  padding-right: 5px;
}

.containerModal__table {
  overflow-x: auto;
  max-width: 100%;
  max-height: calc(100% - 274px - 28px);
}

.containerModal__table::-webkit-scrollbar,
.containerModal__content::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

.containerModal__table::-webkit-scrollbar-thumb,
.containerModal__content::-webkit-scrollbar-thumb {
  border-radius: 5px;
  background: var(--neutral-surface-light);
}

.containerModal__table::-webkit-scrollbar-track,
.containerModal__content::-webkit-scrollbar-track {
  background: var(--neutral-surface-subtle);
  border-radius: 4px;
}
.containerModal__footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

/* Additional */
.containerModal__content-list {
  height: auto;
  max-height: 290px;
  flex-shrink: 0;
}
.containerModal__content-additional {
  display: grid;
  grid-template-columns: 1fr 400px;
  gap: 24px;
}

.additional-col1 {
  display: grid;
  grid-template-rows: auto 1fr;
  gap: 24px;
  overflow: hidden;
}

.additional-col1 .group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.additional-col1 .group label {
  font-size: 12px;
  font-weight: 600;
  line-height: 16px;
  color: var(--neutral-text-body);
}

/* CUSTOM COMPONENTS - MODIFY */
.btnIconModify {
  border-radius: 50%;
}
.mainBtnModify {
  min-width: 135px;
}
</style>
