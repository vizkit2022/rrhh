<script setup>
import { ref, defineEmits, computed, watch, onMounted } from "vue";
import { coins } from "@/utils/labels/settings.json";
import useGlobalStore from "@/stores/global";

// STORE
const globalStore = useGlobalStore();

//EMITS
const emit = defineEmits(["closeModal", "lockModal"]);

// CONSTANTS
const search = ref("");
const loadingSearch = ref(false);
const results = ref([]);
const saving = ref(false);
const currencies = ref([]);
const change = ref(false)
const currenciesList = ref([
  {
    select: false,
    name: { es: "Peso Mexicano", en: "Mexican Peso" },
    abbr: "MXN",
    country: {
      name: { es: "México", en: "Mexico" },
      img: "MXN",
    },
    value: "0",
  },
  {
    select: false,
    name: { es: "Euro", en: "Euro" },
    abbr: "EUR",
    country: {
      name: { es: "Unión Europea", en: "European Union" },
      img: "EUR",
    },
    value: "0",
  },
  {
    select: false,
    name: { es: "Peso Chileno", en: "Chilean Peso" },
    abbr: "CLP",
    country: {
      name: { es: "Chile", en: "Chile" },
      img: "CLP",
    },
    value: "0",
  },
  {
    select: false,
    name: { es: "Nuevo Sol Peruano", en: "Peruvian Sol" },
    abbr: "PEN",
    country: {
      name: { es: "Perú", en: "Peru" },
      img: "PEN",
    },
    value: "0",
  },
  {
    select: false,
    name: { es: "Dólar Estadounidense", en: "US Dollar" },
    abbr: "USD",
    country: {
      name: { es: "Estados Unidos", en: "United States" },
      img: "USD",
    },
    value: "0",
  },
]);

//WATCH
watch(ref(search), async (newValue) => {
  if (newValue !== "") {
    loadingSearch.value = true;
    const resp = await globalStore.searchCurrencies(newValue);
    results.value = resp ? mapperCurrency(resp) : [];
    loadingSearch.value = false;
  }
});

//MOUNTED
onMounted(() => {
  currencies.value = JSON.parse(JSON.stringify(globalStore.currencies));
  currencies.value.unshift(globalStore.defCurrency)
});

// FUNCTIONS
const save = async () => {
   globalStore.loading = true
   const body = {
    currency: globalStore.defCurrency._id,
    currencies: currencies.value.filter(c => c._id !== globalStore.defCurrency._id).map(c => (c._id))
   }
   const resp = await globalStore.editCurrencies(body)
   const response = await globalStore.getMyCurrencies()
   globalStore.currencies = response.currencies
   globalStore.loading = false
   emit('closeModal')
};
const mapperCurrency = (list) => {
  const existingIds = new Set(currencies.value.map((c) => c._id));

  const filteredList = list.filter((l) => !existingIds.has(l._id));

  return filteredList.map((l) => ({
    label: l.name[globalStore.lang],
    _id: l._id,
    name: {...l.name},
    oldData: { ...l },
  }));
};
const selectCurrency = (item) => {
  change.value = true
  cleanSearch();
  currencies.value.unshift(item);
};
const cleanSearch = () => {
  setTimeout(() => {
    search.value = "";
  }, 0);
};
const deleteCurrency = (coin, pos) => {
  if(coin._id !== globalStore.defCurrency._id) {
    currencies.value.splice(pos, 1)
    change.value = true
  }
}

//COMPUTED

const lang = computed(() => globalStore.lang);
const title = computed(() => coins.modal.title);
const buttons = computed(() => coins.buttons);
const inputs = computed(() => coins.modal.inputs);
const headers = computed(() => coins.table.headers);
const additional = computed(() => coins.additionalText);
</script>

<template>
  <div class="modal">
    <div class="modal__header">
      <span>{{ title[lang] }}</span>
      <u-button-icon
        icon="close"
        class="btnIconModify"
        color="--neutral-text-caption"
        type="outlined"
        size="m"
        :disabled="saving"
        @action-btn="emit('closeModal')"
      />
    </div>
    <div class="modal__form">
      <div class="groupInput">
        <label>
          {{ inputs.search[lang] }}
        </label>
        <u-search
          v-model="search"
          :placeholder="inputs.search.placeholder[lang]"
          :loading="loadingSearch"
          :options="results"
          @cleanInput="cleanSearch"
          @selectedOption="selectCurrency"
        />
      </div>
      <div class="groupInput">
        <label>
          {{ inputs.add[lang] }}
        </label>
        <div class="containerSection__table">
          <div class="containerSection__table-header">
            <div class="col withBtn">
              <span class="label">{{ headers.coin[lang] }}</span>
            </div>
          </div>
          <div
            class="containerSection__table-item"
            v-for="(currency, c) in currencies"
            :key="c"
          >
            <div class="col">
              <span
                class="text truncateText"
                :class="
                  currency._id === globalStore.defCurrency._id ? 'default' : ''
                "
                >{{ currency.name[globalStore.lang] }}</span
              >
              <button :disabled="currency._id === globalStore.defCurrency._id" @click="deleteCurrency(currency, c)">
                <span class="u u-close"></span>
              </button>
            </div>
          </div>
          <div v-if="!currencies.length" class="noCurrencies">
            <span v-text="additional.noCurrencies[lang]"></span>
          </div>
        </div>
      </div>
    </div>
    <div class="modal__actions">
      <u-button
        :text="buttons.cancel[lang]"
        type="outlined"
        class="mainBtnModify"
        size="l"
        :disabled="saving"
        @action-btn="emit('closeModal')"
      />
      <u-button
        :text="buttons.add[lang]"
        class="mainBtnModify"
        size="l"
        :disabled="saving || !change"
        @action-btn="save"
      />
    </div>
  </div>
</template>

<style scoped>
span {
  font-family: Nunito;
}
.modal {
  height: 520px;
  display: grid;
  grid-template-rows: 40px 1fr 50px;
  gap: 16px;
}
.modal__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 40px;
  width: 100%;
}
.modal__header span {
  font-size: 16px;
  font-weight: 600;
  line-height: 20px;
  letter-spacing: 0em;
  text-align: left;
  color: var(--neutral-text-body);
}
.modal__actions {
  width: 100%;
  height: 40px;
  display: flex;
  justify-content: space-between;
  padding-top: 10px;
}
.modal__form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}
.groupInput {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.groupInput label {
  font-size: 12px;
  font-weight: 600;
  line-height: 16px;
  text-align: left;
  color: var(--neutral-text-body);
}
.addInput {
  display: grid;
  grid-template-columns: 35px 1fr;
  align-items: center;
}
.addInput span {
  font-size: 14px;
  font-weight: 400;
  line-height: 18px;
  text-align: left;
  color: var(--neutral-text-body);
}
.addInput.first {
  margin-top: 10px;
}
/* Tabla */
.containerSection__table {
  width: 100%;
  height: 280px;
  overflow-y: scroll;
}
.containerSection__table::-webkit-scrollbar {
  width: 0px;
  height: 0px;
}
/* .containerSection__table::-webkit-scrollbar-thumb {
    border-radius: 4px;
    background-color: var(--bg-neutral-400);
  } */
.containerSection__table-header {
  position: sticky;
  top: 0px;
  z-index: 1;
  background-color: var(--neutral-background-default);
}
.containerSection__table-header,
.containerSection__table-item {
  width: 100%;
}
.containerSection__table-header .col {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px;
  background-color: var(--neutral-surface-softer);
}
.containerSection__table-item .col {
  display: grid;
  grid-template-columns: 1fr 10px;
  gap: 10px;
  padding: 12px;
}
.containerSection__table-item .col button {
  display: flex;
  justify-content: center;
  align-items: center;
}
.containerSection__table-item .col button span {
  color: var(--neutral-text-caption);
  font-size: 16px;
  transition: 0.3s;
}
.containerSection__table-item .col button:hover span {
  color: var(--primary-text-darker);
}
.containerSection__table-header .col {
  border: 1px solid var(--neutral-border-light);
  border-radius: 12px 12px 0 0;
}
.containerSection__table-item .col {
  background-color: var(--neutral-background-default);
  border-bottom: 1px solid var(--neutral-border-light);
  border-right: 1px solid var(--neutral-border-light);
  border-left: 1px solid var(--neutral-border-light);
}
.containerSection__table-item:last-child .col {
  border-radius: 0 0 12px 12px;
}
.containerSection__table-header .col .label {
  font-size: 14px;
  font-weight: 600;
  line-height: 18px;
  color: var(--neutral-text-caption);
}
.containerSection__table-header .col .u {
  font-size: 18px;
  font-weight: 600;
  line-height: 18px;
  color: var(--neutral-text-caption);
}
.col.center {
  justify-content: center;
}
.col.right {
  justify-content: flex-end;
}
.containerSection__table-item span.text {
  font-size: 14px;
  font-weight: 600;
  line-height: 18px;
  text-align: left;
}
.containerSection__table-item span.text.default {
  color: var(--primary-text-default);
}
.containerSection__table-item span.text {
  color: var(--neutral-text-body);
}
.containerSection__table-item .col button:disabled .u {
  color: var(--neutral-text-disabled);
}
.noCurrencies {
  display: flex;
  justify-content: center;
  align-items: center;
  position: sticky;
  left: 0;
  height: 100px;
}
.noCurrencies span {
  font-size: 14px;
  font-weight: 400;
  line-height: 18px;
  color: var(--neutral-text-caption);
}
/* CUSTOM COMPONENTS - MODIFY */
.btnIconModify {
  border-radius: 50%;
}
.mainBtnModify {
  width: 135px;
}
</style>