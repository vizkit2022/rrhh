<script setup>
import useSalesStore from "@/stores/sales";
import useIncomesStore from "@/stores/incomes";
import useGlobalStore from "@/stores/global";
import { debounce } from "@/utils/helpers";
import { useI18n } from "vue-i18n";

// Translations I18n
const { t } = useI18n();
const module = "modules.sales.createSale";

//STATES
const salesStore = useSalesStore();
const incomesStore = useIncomesStore();
const globalStore = useGlobalStore();

// EMITS
const emit = defineEmits(["closeModal", "changeStep"]);

//CONSTANTS
const searchBusiness = ref("");
const loadingBusiness = ref(false);

// COMPUTED - Array filtrado

// filtro con store business actual

// const filteredBusinessCards = computed(() => {
//   if (!searchBusiness.value.trim()) {
//     return salesStore.formDocInvoice.allBusiness;
//   }

//   const searchTerm = searchBusiness.value.toLowerCase().trim();

//   return salesStore.formDocInvoice.allBusiness.filter(card => {
//     const titleMatch = card.name.toLowerCase().includes(searchTerm);
//     const projectName = card.project.name.toLowerCase().includes(searchTerm);

//     return titleMatch || projectName;
//   });
// });

// const filteredBusinessCards = computed(() => {
//   if (!searchBusiness.value.trim()) {
//     return arrayCardsBusiness.value;
//   }

//   const searchTerm = searchBusiness.value.toLowerCase().trim();

//   return arrayCardsBusiness.value.filter(card => {
//     const titleMatch = card.title.toLowerCase().includes(searchTerm);
//     const legalNameMatch = card.client.legalName.toLowerCase().includes(searchTerm);

//     return titleMatch || legalNameMatch;
//   });
// });

//FUNCTIONS

const getNameCode = (code) => {
  switch (code) {
    case "invoice":
      return {
        es: "Documento base",
        en: "Base Document",
      };
    default:
      return "";
  }
};

const filterBusiness = debounce(async (e) => {
  try {
    loadingBusiness.value = true;
    const paramsGetBusinessName = buildParamsBusinessName({
      name: e.target.value,
    });

    await salesStore.getBusinessName(paramsGetBusinessName);

    // negocios que ya estaban seleccionados en el form
    const selectedBusiness =
      salesStore.formDocInvoice.formRegister.business || [];

    salesStore.formDocInvoice.allBusiness.forEach((b) => {
      // marco como selected si está dentro del array guardado
      b.selected = selectedBusiness.some((sel) => sel._id === b._id);
      b.amountPaid = {
        value: "",
        number: 0,
        tempValue: null,
      };
    });
  } catch (error) {
    console.error(error);
  } finally {
    loadingBusiness.value = false;
  }
}, 600);

// acciones de las cards
const selectCard = () => {
  // filtro todos los que están seleccionados
  salesStore.formDocInvoice.formRegister.business =
    salesStore.formDocInvoice.allBusiness.filter((card) => card.selected);

  // inicializo amountPaid
  salesStore.formDocInvoice.formRegister.business.forEach((b) => {
    // (b.amountPaid = {
    //   value: "$0",
    //   number: 0,
    //   tempNumber: 0,
    //   tempValue: "$0",
    // }),
    b.description = "";
    b.longDescription = "";
  });

  salesStore.formDocInvoice.formRegister.client = null;
};

// Acciones para cambiar de step
const nextStep = () => {
  emit("changeStep", true);
};

const backStep = () => {
  if (salesStore.formDocInvoice.invoicing) {
    emit("changeStep", false);
  }
  emit("changeStep", false, 1);
};

const closeStep = () => {
  salesStore.cleanFormDocInvoice();
  emit("closeModal");
};

const handleEscape = (event) => {
  if (event.key === "Escape") {
    closeStep();
  }
};

const buildParamsBusinessName = (params) => {
  const paramsDate = {
    year: globalStore.currentDate.year,
    month: globalStore.currentDate.month,
    prop: globalStore.currentDate.prop,
    zone: globalStore.currentDate.zone,
  };

  const name = params.name;

  return {
    name,
    ...paramsDate,
  };
};

onMounted(async () => {
  // window.addEventListener("keydown", handleEscape);

  const paramsGetBusinessName = buildParamsBusinessName({
    name: searchBusiness.value,
  });

  // obtener negocios con endpoint de buscar negocios por nombre
  loadingBusiness.value = true;
  // await salesStore.getBusinessNameOld(paramsGetBusinessName); // FUNCION VIEJA QUE DEBE REMOVERSE DESPUES DE LA REUNION
  await salesStore.getBusinessName(paramsGetBusinessName);
  loadingBusiness.value = false;

  // obtener negocios seleccionados (local)
  const selectedFromStore =
    salesStore.formDocInvoice?.formRegister?.business || [];

  salesStore.formDocInvoice.allBusiness.forEach((card) => {
    if (selectedFromStore.some((b) => b.id === card.id)) {
      card.selected = true;
    }
  });

  // filtro todos los que están seleccionados
  salesStore.formDocInvoice.formRegister.business =
    salesStore.formDocInvoice.allBusiness.filter((card) => card.selected);

  // inicializo amountPaid
  salesStore.formDocInvoice.formRegister.business.forEach((b) => {
    // (b.amountPaid = {
    //   value: "$0",
    //   number: 0,
    //   tempNumber: 0,
    //   tempValue: "$0",
    // }),
    b.description = "";
    b.longDescription = "";
  });
});

// onBeforeUnmount(() => {
//   window.removeEventListener("keydown", handleEscape);
// });
</script>

<template>
  <div class="container">
    <div class="header">
      <!-- <span class="body-l-sb textTitleColor">{{ `Crear ${salesStore?.formDocInvoice?.typeDocument?.code} - Seleccionar Negocios` }}</span> -->
      <span class="body-l-sb textTitleColor">{{
        t(`${module}.step2.titleHeader`, {
          typeDoc:
            salesStore?.formDocInvoice?.typeDocument?.tag ||
            getNameCode(salesStore?.formDocInvoice?.typeDocument?.code)[
              globalStore.lang
            ],
        })
      }}</span>
      <u-button-icon
        @click="closeStep"
        icon="u u-close"
        type="outlined"
        color="--neutral-text-caption"
        size="l"
        style="border-radius: 50%"
      />
    </div>

    <div class="body">
      <div class="container-search">
        <!-- <span class="body-s-sb">{{ t(`${module}.step2.inputs.business.label`) }}</span> -->
        <u-input
          v-model="searchBusiness"
          :placeholder="t(`${module}.step2.inputs.business.placeholder`)"
          icon="search"
          :revers="true"
          @input="filterBusiness"
        />
      </div>

      <div class="container-business">
        <div v-if="loadingBusiness" class="loader-container">
          <u-loading size="l" />
        </div>

        <span
          v-else-if="salesStore?.formDocInvoice?.allBusiness?.length === 0"
          class="body-m-r noData"
          >{{ t(`${module}.step2.cardBusiness.noData`) }}</span
        >

        <div
          v-else
          class="card"
          v-for="card in salesStore?.formDocInvoice?.allBusiness"
          :key="card?.id"
          @click="selectCard(card?.name)"
        >
          <div>
            <u-checkbox
              v-model="card.selected"
              :height="20"
              @change="selectCard"
            />
          </div>
          <div>
            <span class="truncateText body-m-sb">{{ card?.name }}</span>
            <span class="truncateText body-s-r">{{ card?.project?.name }}</span>
          </div>
          <div>
            <span class="truncateText body-m-sb">{{
              card?.numbersGross?.toInvoice?.value ||
              card?.numbersGross?.sumPrice.value
            }}</span>
            <span class="body-s-r">{{
              t(`${module}.step2.cardBusiness.textBalanceInvoice`)
            }}</span>
          </div>
        </div>
      </div>
    </div>

    <div class="footer">
      <u-button
        @click="backStep"
        :text="t(`${module}.buttons.back`)"
        type="outlined"
      />
      <u-button
        :disabled="
          salesStore?.formDocInvoice?.formRegister?.business?.length === 0
        "
        @click="nextStep"
        :text="t(`${module}.buttons.next`)"
      />
    </div>
  </div>
</template>

<style scoped>
.container {
  display: grid;
  grid-template-rows: auto 1fr auto;
  gap: 24px;
  width: 80vw;
  max-width: 719px;
  height: 80vh;
  max-height: 752px;
  box-sizing: border-box;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 40px;
  width: 100%;
}

.textTitleColor {
  color: var(--neutral-text-body);
}

.body {
  display: grid;
  grid-template-rows: auto 1fr;
  gap: 24px;
  min-height: 0;
}

.container-search {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.container-search span {
  color: var(--neutral-text-body);
}

.loader-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
}

.container-business {
  display: flex;
  flex-direction: column;
  gap: 8px;
  overflow: auto;
  min-height: 0;
}

.container-business::-webkit-scrollbar {
  width: 8px;
  height: 0px;
  background: var(--neutral-surface-light);
  border-radius: 20px;
}

.container-business::-webkit-scrollbar-thumb {
  background-color: var(--neutral-border-darker);
  border-radius: 5px;
}

.noData {
  display: flex;
  height: 100%;
  width: 100%;
  margin-top: 30px;
  justify-content: center;
  color: var(--neutral-text-caption);
}

.card {
  display: grid;
  grid-template-columns: 40px 1fr 200px; /* checkbox - info - saldo */
  align-items: center;
  height: 56px;
  border: 1px solid var(--neutral-border-subtle);
  border-radius: 8px;
  padding: 8px 24px;
  gap: 8px;
}

.card > div:nth-child(1) {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 36px;
  height: 36px;
}

.card > div:nth-child(2) {
  display: flex;
  flex-direction: column;
  justify-content: center;
  overflow: hidden; /* importante para truncate */
}

.card > div:nth-child(2) > span:nth-child(1) {
  display: block;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: 1.5;
  color: var(--primary-text-default);
}

.card > div:nth-child(2) > span:nth-child(2) {
  display: block;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: 1.7;
  color: var(--neutral-text-body);
}

.card > div:nth-child(3) {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 4px;
}

.card > div:nth-child(3) > span:nth-child(1) {
  text-align: right;
  color: var(--neutral-text-body);
}

.card > div:nth-child(3) > span:nth-child(2) {
  color: var(--neutral-text-caption);
  text-align: right;
}

.footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>
