<script setup>
import { ref, computed, onMounted } from "vue";
import { coins } from "@/utils/labels/settings.json";
import useGlobalStore from "@/stores/global";
import useOrganizationStore from "@/stores/organization";
import { convertirTime } from "@/utils/helpers"

// STORE
const globalStore = useGlobalStore();
const organizationStore = useOrganizationStore();

// Variables
const selectedCurrency = ref("");
const selectAll = ref(false);
const addCoin = ref(false);
const currencies = ref([]);
const lockModal = ref(false);
const lastUpdate = ref("")

const hideModal = () => {
  if (!lockModal.value) {
    addCoin.value = false;
    lockModal.value = false;
  }
};
const lock = (state) => {
  lockModal.value = state;
};

// COMPUTED
const lang = computed(() => globalStore.lang);
const title = computed(() => coins.title);
const subtitle = computed(() => coins.subtitle)
const buttons = computed(() => coins.buttons);
const inputs = computed(() => coins.inputs);
const headers = computed(() => coins.table.headers);
const additional = computed(() => coins.additionalText);

//Mounted
onMounted(async () => {
  globalStore.loading = true;
  const response = await globalStore.getMyCurrencies();
  globalStore.currencies = mapperCurrency(response.currencies);
  globalStore.defCurrency = response.currency;

  // Convertir la fecha a la hora local sin cambiar el formato
  const utcDate = new Date(response.updatedCurrency);
  const localDate = new Date(utcDate.getTime() - utcDate.getTimezoneOffset() * 60000).toISOString();

  lastUpdate.value = localDate;
  selectedCurrency.value = response.currency.name[globalStore.lang];
  globalStore.loading = false;
});

// FUNCTIONS
const mapperCurrency = (list) => {
  const existingIds = new Set(currencies.value.map((c) => c._id));

  const filteredList = list.filter((l) => !existingIds.has(l._id));

  return filteredList.map((l) => ({
    label: l.name[globalStore.lang],
    _id: l._id,
    ...l,
  }));
};
const updatedDefCurrency = async (coin) => {
  globalStore.loading = true;
  let currencies = globalStore.currencies
    .filter((c) => c._id !== coin._id)
    .map((c) => c._id);
  currencies.unshift(globalStore.defCurrency._id);
  const body = {
    currency: coin._id,
    currencies,
  };
  const resp = await globalStore.editCurrencies(body);
  const response = await globalStore.getMyCurrencies();
  globalStore.currencies = mapperCurrency(response.currencies);
  globalStore.defCurrency = response.currency;
  globalStore.loading = false;
};
const selectAllCurrencies = () => {
  globalStore.currencies = globalStore.currencies.map((c) => ({
    ...c,
    select: selectAll.value,
  }));
};
const selectAllFromItem = () => {
  selectAll.value = globalStore.currencies.every((c) => c.select);
};
const deleteCurrency = async () => {
  try {
    globalStore.loading = true;

    const currencies = globalStore.currencies
      .filter((c) => !c.select)
      .map((c) => c._id);

    const body = {
      currency: globalStore.defCurrency._id,
      currencies,
    };

    await globalStore.editCurrencies(body);

    const response = await globalStore.getMyCurrencies();

    selectAll.value = false;
    globalStore.currencies = response.currencies;
  } catch (error) {
    console.error("Error during currency deletion:", error);
  } finally {
    globalStore.loading = false;
  }
};

const changeMoney = async(data) => { 
  try {
    globalStore.loading = true;
    await updatedDefCurrency(data); 
    await organizationStore.getOrganizationById();
  } catch (error) {
    console.error(error)
  } finally {
    globalStore.loading = false;
  }
}
</script>

<template>
  <div class="containerSection">
    <div class="containerSection__header">
      <h2>{{ title[lang] }}</h2>
      <span class="lastUpdate">{{ subtitle[lang] }}: <strong>{{ convertirTime(lastUpdate) }} - {{ transformedDate(lastUpdate) }}</strong></span>
    </div>
    <div class="containerSection__filters">
      <u-select-with-label
        style="width: 400px"
        v-model="selectedCurrency"
        class="selectedCurrency"
        :options="mapperCurrency(globalStore.currencies)"
        :placeholder="inputs.search.placeholder[lang]"
        :label="inputs.search[lang]"
        :full-data="true"
        @full-data="async (data) => await changeMoney(data)"
      />
      <div class="containerSection__filters-space">
        <u-button-icon
          type="outlined"
          icon="delete"
          color="--neutral-text-caption"
          color-hover="--neutral-text-body"
          color-active="--neutral-text-body"
          :disabled="!globalStore.currencies.some((c) => c.select)"
          @click="deleteCurrency"
        />
        <u-button
          :text="buttons.addCoin[lang]"
          icon="new"
          @click="addCoin = true"
        />
        <u-button-icon
          icon="more"
          color="--bg-neutral-500"
          colorHover="--bg-neutral-600"
          colorActive="--bg-neutral-700"
          type="outlined"
        />
      </div>
    </div>
    <div class="containerSection__table">
      <div class="containerSection__table-header">
        <div class="col first center" @click="selectAllCurrencies">
          <u-checkbox
            v-model="selectAll"
            :height="16"
            @click="selectAllCurrencies"
          />
        </div>
        <div class="col withBtn">
          <span class="label">{{ headers.coin[lang] }}</span>
          <button><span class="u u-selector_down"></span></button>
        </div>
        <div class="col">
          <span class="label">{{ headers.symbol[lang] }}</span>
        </div>
        <div class="col">
          <span class="label">{{ headers.abbr[lang] }}</span>
        </div>
        <div class="col">
          <span class="label">{{ headers.country[lang] }}</span>
        </div>
        <div class="col last right">
          <span class="label">{{ headers.currentValue[lang] }}</span>
        </div>
      </div>
      <div
        class="containerSection__table-item"
        v-for="(currency, c) in globalStore.currencies"
        :key="c"
      >
        <div
          class="col first center"
          :class="currency.select ? 'selected' : ''"
          @click="selectAllFromItem"
        >
          <u-checkbox
            v-model="currency.select"
            :height="16"
            @click="selectAllFromItem"
          />
        </div>
        <div class="col" :class="currency.select ? 'selected' : ''">
          <span class="text">{{ currency.name[globalStore.lang] }}</span>
        </div>
        <div class="col" :class="currency.select ? 'selected' : ''">
          <span class="text">{{ currency.symbol }}</span>
        </div>
        <div class="col" :class="currency.select ? 'selected' : ''">
          <span class="text">{{ currency.code }}</span>
        </div>
        <div class="col" :class="currency.select ? 'selected' : ''">
          <span class="text">{{ currency.country ?? "-" }}</span>
        </div>
        <div class="col last right" :class="currency.select ? 'selected' : ''">
          <span class="text">{{ currency.value }}</span>
        </div>
      </div>
      <div v-if="!globalStore.currencies.length" class="noCurrencies">
        <span v-text="additional.noCurrencies[lang]"></span>
      </div>
    </div>
    <u-dialog
      :showModal="addCoin"
      :lockModal="lockModal"
      @closeModal="hideModal"
      :persistent="true"
      width="500px"
      height="600px"
    >
      <SettingsOrganizationDialogAddCoin
        @closeModal="hideModal"
        @lockModal="lock"
      />
    </u-dialog>
  </div>
</template>

<style scoped>
h2,
span {
  font-family: Nunito;
}
.containerSection {
  display: grid;
  grid-template-rows: 40px 36px 1fr;
  gap: 24px;
  padding-right: 20px;
}
.containerSection__header h2 {
  font-size: 24px;
  font-weight: 600;
  line-height: 36px;
  text-align: left;
  color: var(--neutral-text-body);
}
.containerSection__header .lastUpdate {
  font-size: 12px;
  line-height: 12px;
  color: var(--neutral-text-caption);
}
.containerSection__header .lastUpdate strong {
  color: var(--success-text-darker);
}

.containerSection__filters {
  display: flex;
  justify-content: space-between;
  gap: 16px;
}

.containerSection__filters-space {
  display: flex;
  justify-content: flex-end;
  gap: 16px;
}

/* Tabla */
.containerSection__table {
  height: calc(100vh - 382px);
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
  min-width: 771px;
  height: 52px;
  display: grid;
  grid-template-columns:
    48px minmax(237.5px, 1fr)  minmax(90px, 1fr) minmax(90px, 1fr) minmax(237.5px, 1fr)
    158px;
}
.containerSection__table-item:hover .col {
  background-color: var(--primary-surface-shadow-8a);
}
.containerSection__table-item .col.selected {
  background-color: var(--primary-surface-shadow-8a);
}
.containerSection__table-header .col,
.containerSection__table-item .col {
  display: flex;
  align-items: center;
  padding: 12px;
  background-color: var(--neutral-surface-softer);
  transition: 0.3s;
}
.containerSection__table-header .col {
  border-top: 1px solid var(--neutral-border-light);
  border-bottom: 1px solid var(--neutral-border-light);
}
.containerSection__table-item .col {
  background-color: var(--neutral-background-default);
  border-bottom: 1px solid var(--neutral-border-light);
}
.containerSection__table-header .col.withBtn {
  justify-content: space-between;
}
.containerSection__table-header .col.first {
  border-radius: 12px 0 0 0;
}
.containerSection__table-header .col.first,
.containerSection__table-item .col.first {
  border-left: 1px solid var(--neutral-border-light);
}
.containerSection__table-header .col.last {
  border-radius: 0 12px 0 0;
}
.containerSection__table-header .col.last,
.containerSection__table-item .col.last {
  border-right: 1px solid var(--neutral-border-light);
  text-align: right;
}
.containerSection__table-item:last-child .col.last {
  border-radius: 0 0 12px 0;
}

.last{
  padding-right: 32px !important;
}
.containerSection__table-item:last-child .col.col.first {
  border-radius: 0 0 0 12px;
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
.contTag {
  position: relative;
}
.contTag .tag {
  width: 100%;
  padding: 3px 3px 3px 10px;
  border-radius: 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.col.center {
  justify-content: center;
}
.col.right {
  justify-content: flex-end;
}
.contTag .tag span {
  font-size: 12px;
  font-weight: 600;
  line-height: 16px;
  text-align: left;
}
.contTag .tag span.u {
  font-size: 14px;
}
.containerSection__table-item span.text {
  font-size: 14px;
  font-weight: 600;
  line-height: 18px;
  text-align: left;
  color: var(--neutral-text-body);
}
.containerSection__table-item .active {
  background-color: var(--success-surface-harder);
  color: var(--success-text-darker);
}
.containerSection__table-item .inactive {
  background-color: var(--neutral-surface-harder);
  color: var(--neutral-text-body);
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

@media only screen and (max-width: 1270px) {
  .containerSection__filters .selectedCurrency {
    width: 40%;
  }
}
</style>