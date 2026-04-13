<script setup>
import { ref, defineEmits } from "vue";
import { onlyNumbers } from "@/utils/helpers";
import { formatCurrency } from "@/utils/formatAmount";
import useCatalogStore from "@/stores/catalog";
const emit = defineEmits(["closeModal"]);
const catalogStore = useCatalogStore();
// Tabs
const tabSelected = ref(0);
const infoItem = catalogStore.currentItem;

const tabs = [
  {
    label: "Datos Generales",
    tab: 0,
  },
  {
    label: "Descripción",
    tab: 1,
  },
  {
    label: "Precio",
    tab: 2,
  },
  {
    label: "Proveedores",
    tab: 3,
  },
];

// Formulario
const form = ref({
  name: "",
  code: "",
  createdBy: "",
  accountNumber: "",
  group: "",
  description: "",
  observation: "",
  numbers: {
    price: {
      default: {
        number: 0,
        value: "$ 0,00",
      },
      min: {
        number: 0,
        value: "$ 0,00",
      },
      max: {
        number: 0,
        value: "$ 0,00",
      },
      average: {
        number: 0,
        value: "$ 0,00",
      },
    },
    budget: {
      default: {
        number: 0,
        value: "$ 0,00",
      },
      min: {
        number: 0,
        value: "$ 0,00",
      },
      max: {
        number: 0,
        value: "$ 0,00",
      },
      average: {
        number: 0,
        value: "$ 0,00",
      },
    },
    margin: {
      default: {
        number: 0,
        value: "$ 0,00",
      },
      min: {
        number: 0,
        value: "$ 0,00",
      },
      max: {
        number: 0,
        value: "$ 0,00",
      },
      average: {
        number: 0,
        value: "$ 0,00",
      },
    },
  },
});

const symbol = ref("$");

// Inputs Events
const inputEvent = (state, prop1, prop2) => {
  let num;
  if (!state) {
    num = form.value.numbers[prop1][prop2].number;
  } else {
    num = form.value.numbers[prop1][prop2].value;
  }
  if (state) {
    form.value.numbers[prop1][prop2].value = num
      .replace(/\s+/g, "")
      .replace(symbol.value, "");
  } else {
    form.value.numbers[prop1][prop2].value = `${formatCurrency(num)}`;
  }
};

// STEP 4 - Contactos
const search = ref("");
const selectedAll = ref(false);
const suppliers = ref([
  { name: "supplier 1", selected: false, cost: 12, cont: 2 },
]);

const save = async () => {
  try {
    let formToSave = JSON.parse(JSON.stringify(form.value));
    await catalogStore.createItem(formToSave);
  } catch (err) {
    console.error(err);
  } finally {
    emit("closeModal");
  }
};
</script>

<template>
  <div class="containerModal">
    <div class="containerModal__header">
      <span>Información</span>
      <u-button-icon
        icon="cancel"
        class="btnIconModify"
        color="--bg-neutral-200"
        colorHover="--bg-neutral-400"
        colorActive="--bg-neutral-600"
        size="l"
        @action-btn="emit('closeModal')"
      />
    </div>
    <u-tabs
      :tabs="tabs"
      v-model="tabSelected"
      :fullscreen="false"
      class="containerTabsModify"
    />
    <div v-show="tabSelected === 0" class="containerModal__sept1">
      <div class="containerModal__sept1-group">
        <span>Nombre</span>
        <u-input v-model="form.name" size="s" />
      </div>
      <div class="containerModal__sept1-group">
        <span>Código</span>
        <u-input v-model="form.code" size="s" />
      </div>
      <div class="containerModal__sept1-group">
        <span>Creado por:</span>
        <u-input v-model="form.createdBy" size="s" :disabled="true" />
      </div>
      <div class="containerModal__sept1-group">
        <span>Numero de cuenta</span>
        <u-input v-model="form.accountNumber" size="s" />
      </div>
      <div class="containerModal__sept1-group">
        <span>Categoría</span>
        <u-input v-model="form.group" size="s" :disabled="true" />
      </div>
    </div>
    <div v-show="tabSelected === 1" class="containerModal__sept2">
      <div class="containerModal__sept2-group">
        <span>Descripción</span>
        <div style="height: 120px">
          <u-textarea
            v-model="form.description"
            :heightCustom="120"
            placeholder="Ingrese una descripción acerca del item..."
          />
        </div>
      </div>
      <div class="containerModal__sept2-group">
        <span>Observaciones</span>
        <div style="height: 120px">
          <u-textarea
            v-model="form.observation"
            :heightCustom="120"
            placeholder="Ingrese una observación interna del item..."
          />
        </div>
      </div>
    </div>
    <div v-show="tabSelected === 2" class="containerModal__sept3">
      <div class="customTable">
        <div class="customTable-header">
          <div class="label-header">
            <span class="nunito-semi-bold-santas-gray-12px first-col"
              >Valores</span
            >
          </div>
          <div class="label-header">
            <span class="nunito-semi-bold-santas-gray-12px text-right"
              >Promedio</span
            >
          </div>
          <div class="label-header">
            <span class="nunito-semi-bold-santas-gray-12px text-right"
              >Último</span
            >
          </div>
          <div class="label-header">
            <span class="nunito-semi-bold-santas-gray-12px text-right"
              >Mínimo</span
            >
          </div>
          <div class="label-header">
            <span class="nunito-semi-bold-santas-gray-12px text-right"
              >Máximo</span
            >
          </div>
          <div class="label-header">
            <span class="nunito-semi-bold-santas-gray-12px text-right"
              >Por Defecto</span
            >
          </div>
        </div>
        <div class="customTable-body">
          <div class="customTable-row">
            <div class="first-col-div">
              <span class="nunito-semi-bold-14px first-col truncateText"
                >Precio de Venta</span
              >
            </div>
            <div>
              <u-input
                align="right"
                class="nunito-semi-bold-14px first-col inputModified"
                v-model="form.numbers.price.average.value"
                @input="
                  form.numbers.price.average.value = onlyNumbers(
                    form.numbers.price.average.value
                  )
                "
                @focus="inputEvent(true, 'price', 'average')"
                @blur="inputEvent(false, 'price', 'average')"
                :disabled="true"
              />
            </div>
            <div>
              <u-input
                align="right"
                class="nunito-semi-bold-14px first-col inputModified"
                value="0"
                :disabled="true"
                v-model="form.numbers.price.min.value"
              />
            </div>
            <div>
              <u-input
                align="right"
                class="nunito-semi-bold-14px first-col inputModified"
                v-model="form.numbers.price.min.value"
                @input="
                  form.numbers.price.min.value = onlyNumbers(
                    form.numbers.price.min.value
                  )
                "
                @focus="inputEvent(true, 'price', 'min')"
                @blur="inputEvent(false, 'price', 'min')"
                :disabled="true"
              />
            </div>
            <div>
              <u-input
                align="right"
                class="nunito-semi-bold-14px first-col inputModified"
                v-model="form.numbers.price.max.value"
                @input="
                  form.numbers.price.max.value = onlyNumbers(
                    form.numbers.price.max.value
                  )
                "
                @focus="inputEvent(true, 'price', 'max')"
                @blur="inputEvent(false, 'price', 'max')"
                :disabled="true"
              />
            </div>
            <div>
              <u-input
                align="right"
                v-model="form.numbers.price.default.value"
                @input="
                  form.numbers.price.default.value = onlyNumbers(
                    form.numbers.price.default.value
                  )
                "
                @focus="inputEvent(true, 'price', 'default')"
                @blur="inputEvent(false, 'price', 'default')"
              />
            </div>
          </div>
          <div class="customTable-row">
            <div class="first-col-div">
              <span class="nunito-semi-bold-14px first-col truncateText"
                >Costo Presupuestado</span
              >
            </div>
            <div>
              <u-input
                align="right"
                class="nunito-semi-bold-14px text-right inputModified"
                v-model="form.numbers.budget.average.value"
                @input="
                  form.numbers.budget.average.value = onlyNumbers(
                    form.numbers.budget.average.value
                  )
                "
                @focus="inputEvent(true, 'budget', 'average')"
                @blur="inputEvent(false, 'budget', 'average')"
                :disabled="true"
              />
            </div>
            <div>
              <u-input
                align="right"
                class="nunito-semi-bold-14px text-right inputModified"
                value="0"
                :disabled="true"
                v-model="form.numbers.price.min.value"
              />
            </div>
            <div>
              <u-input
                align="right"
                class="nunito-semi-bold-14px text-right inputModified"
                v-model="form.numbers.budget.min.value"
                @input="
                  form.numbers.budget.min.value = onlyNumbers(
                    form.numbers.budget.min.value
                  )
                "
                @focus="inputEvent(true, 'budget', 'min')"
                @blur="inputEvent(false, 'budget', 'min')"
                :disabled="true"
              />
            </div>
            <div>
              <u-input
                align="right"
                class="nunito-semi-bold-14px text-right inputModified"
                v-model="form.numbers.budget.max.value"
                @input="
                  form.numbers.budget.max.value = onlyNumbers(
                    form.numbers.budget.max.value
                  )
                "
                @focus="inputEvent(true, 'budget', 'max')"
                @blur="inputEvent(false, 'budget', 'max')"
                :disabled="true"
              />
            </div>
            <div>
              <u-input
                align="right"
                v-model="form.numbers.budget.default.value"
                @input="
                  form.numbers.budget.default.value = onlyNumbers(
                    form.numbers.budget.default.value
                  )
                "
                @focus="inputEvent(true, 'budget', 'default')"
                @blur="inputEvent(false, 'budget', 'default')"
              />
            </div>
          </div>
          <div class="customTable-row">
            <div class="first-col-div">
              <span class="nunito-semi-bold-14px first-col truncateText"
                >Margen Presupuestado</span
              >
            </div>
            <div>
              <u-input
                align="right"
                class="nunito-semi-bold-14px text-right inputModified"
                v-model="form.numbers.margin.average.value"
                @input="
                  form.numbers.margin.average.value = onlyNumbers(
                    form.numbers.margin.average.value
                  )
                "
                @focus="inputEvent(true, 'margin', 'average')"
                @blur="inputEvent(false, 'margin', 'average')"
                :disabled="true"
              />
            </div>
            <div>
              <u-input
                align="right"
                class="nunito-semi-bold-14px text-right inputModified"
                value="0"
                :disabled="true"
                v-model="form.numbers.price.min.value"
              />
            </div>
            <div>
              <u-input
                align="right"
                class="nunito-semi-bold-14px text-right inputModified"
                v-model="form.numbers.margin.min.value"
                @input="
                  form.numbers.margin.min.value = onlyNumbers(
                    form.numbers.margin.min.value
                  )
                "
                @focus="inputEvent(true, 'margin', 'min')"
                @blur="inputEvent(false, 'margin', 'min')"
                :disabled="true"
              />
            </div>
            <div>
              <u-input
                align="right"
                class="nunito-semi-bold-14px text-right inputModified"
                v-model="form.numbers.margin.max.value"
                @input="
                  form.numbers.margin.max.value = onlyNumbers(
                    form.numbers.margin.max.value
                  )
                "
                @focus="inputEvent(true, 'margin', 'max')"
                @blur="inputEvent(false, 'margin', 'max')"
                :disabled="true"
              />
            </div>
            <div>
              <u-input
                align="right"
                v-model="form.numbers.margin.default.value"
                @input="
                  form.numbers.margin.default.value = onlyNumbers(
                    form.numbers.margin.default.value
                  )
                "
                @focus="inputEvent(true, 'margin', 'default')"
                @blur="inputEvent(false, 'margin', 'default')"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
    <div v-show="tabSelected === 3" class="containerModal__sept4">
      <div class="containerModal__sept4-search">
        <u-input v-model="search" placeholder="Buscar proveedores ..." />
      </div>
      <div class="containerModal__sept4-table">
        <div class="containerModal__sept4-table-header">
          <div class="containerModal__sept4-table-header-actions">
            <u-checkbox v-model="selectedAll" :height="19" />
            <button class="btnIcon"><span class="u u-delete"></span></button>
          </div>
          <div class="containerModal__sept4-table-header-col">
            <span>Nombre</span>
          </div>
          <div class="containerModal__sept4-table-header-col">
            <span>Rol</span>
          </div>
          <div class="containerModal__sept4-table-header-col">
            <span>Costo</span>
          </div>
          <div class="containerModal__sept4-table-header-col">
            <span>Veces contratado</span>
          </div>
        </div>
        <div
          class="containerModal__sept4-table-item"
          v-for="(supplier, s) in suppliers"
          :key="s"
        >
          <div class="containerModal__sept4-table-item-actions">
            <u-checkbox v-model="supplier.selected" :height="16" />
          </div>
          <div class="containerModal__sept4-table-item-col">
            <span>{{ supplier.name }}</span>
          </div>
          <div class="containerModal__sept4-table-item-col">
            <span>Gamer</span>
          </div>
          <div class="containerModal__sept4-table-item-col">
            <span>{{ formatCurrency(supplier.cost) }}</span>
          </div>
          <div class="containerModal__sept4-table-item-col">
            <span>{{ supplier.cont }}</span>
          </div>
        </div>
      </div>
    </div>
    <div class="containerModal__actions">
      <u-button text="Cancelar" type="outlined" class="btnModifyActions" />
      <u-button text="Guardar" class="btnModifyActions" @click="save()" />
    </div>
  </div>
</template>

<style scoped>
.containerModal {
  height: 100%;
  display: grid;
  grid-template-rows: 40px 32px 1fr 36px;
  gap: 20px;
  font-family: Nunito;
}

.containerModal__header,
.containerModal__actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.containerModal__header span {
  text-align: left;
  font-weight: 600;
  letter-spacing: 0em;
  color: var(--bg-neutral-700);
}

.containerModal__sept1,
.containerModal__sept2 {
  display: flex;
  flex-direction: column;
  margin-top: 20px;
  gap: 30px;
  padding: 0 50px;
  box-sizing: border-box;
}

.containerModal__sept1-group {
  display: grid;
  grid-template-columns: 150px 1fr;
  align-items: center;
}

.containerModal__sept1-group span,
.containerModal__sept2-group span,
.containerModal__sept3-group-content .label {
  text-align: left;
  font-weight: 600;
  letter-spacing: 0em;
  color: var(--bg-neutral-600);
  font-size: 14px;
  line-height: 14px;
}

.containerModal__sept2-group {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.containerModal__sept3 {
  grid-template-columns: 1fr 1fr;
  gap: 40px;
  box-sizing: border-box;
}

.containerModal__sept3-group {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.containerModal__sept3-item {
  display: grid;
  grid-template-columns: 1fr 1fr;
  align-items: center;
  height: 32px;
}

.containerModal__sept3-group-header span {
  text-align: left;
  font-weight: 600;
  letter-spacing: 0em;
  color: var(--bg-neutral-700);
  font-size: 16px;
  line-height: 16px;
}

.containerModal__sept3-group-content {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.containerModal__sept3-group-content .val {
  text-align: left;
  font-weight: 700;
  letter-spacing: 0em;
  color: var(--bg-neutral-700);
  font-size: 14px;
  line-height: 14px;
  padding-left: 14px;
}

.containerModal__sept4 {
  display: grid;
  grid-template-rows: 40px 1fr;
  gap: 20px;
}

.containerModal__sept4-search {
  display: grid;
  grid-template-columns: 400px;
  align-items: center;
  justify-content: center;
}

.containerModal__sept4-table {
  position: relative;
  overflow-y: auto;
  height: 310px;
  padding-right: 5px;
}

.containerModal__sept4-table::-webkit-scrollbar {
  width: 3px;
  height: 0px;
}

.containerModal__sept4-table::-webkit-scrollbar-thumb {
  border-radius: 3px;
  background-color: var(--bg-neutral-500);
}

.containerModal__sept4-table::-webkit-scrollbar-track {
  background-color: var(--bg-neutral-300);
  border-radius: 3px;
}

.containerModal__sept4-table-header {
  height: 40px;
  border-bottom: 2px solid var(--bg-neutral-400);
  position: sticky;
  top: 0px;
  background-color: var(--white);
  z-index: 10;
}

.containerModal__sept4-table-header,
.containerModal__sept4-table-item {
  display: grid;
  grid-template-columns: 100px repeat(4, 1fr);
  min-width: 600px;
}

.containerModal__sept4-table-item {
  height: 32px;
}

.containerModal__sept4-table-header-actions,
.containerModal__sept4-table-item-actions {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 10px;
  border-left: 2px solid var(--bg-neutral-400);
  border-right: 2px solid var(--bg-neutral-400);
}

.containerModal__sept4-table-item-actions {
  background-color: var(-white);
  border-bottom: 2px solid var(--bg-neutral-400);
}

.containerModal__sept4-table-item:last-child
  .containerModal__sept4-table-item-actions {
  border-radius: 0 0 0 16px;
}

.containerModal__sept4-table-item:last-child
  .containerModal__sept4-table-item-col:last-child {
  border-radius: 0 0 16px 0;
}

.containerModal__sept4-table-header-actions {
  background-color: var(--bg-neutral-100);
  border-radius: 16px 0 0 0;
  border-top: 2px solid var(--bg-neutral-400);
}

.containerModal__sept4-table-header-col,
.containerModal__sept4-table-item-col {
  padding: 0 20px;
  display: flex;
  align-items: center;
  border-right: 2px solid var(--bg-neutral-400);
}

.containerModal__sept4-table-item-col {
  border-bottom: 2px solid var(--bg-neutral-400);
}

.containerModal__sept4-table-header-col {
  background-color: var(--bg-neutral-100);
  border-top: 2px solid var(--bg-neutral-400);
}

.containerModal__sept4-table-item-col {
  background-color: var(--white);
}

.containerModal__sept4-table-header-col:last-child {
  border-radius: 0 16px 0 0;
}

.containerModal__sept4-table-header-col span {
  font-weight: 600;
  letter-spacing: 0em;
  color: var(--bg-neutral-500);
  font-size: 12px;
  line-height: 12px;
}

.containerModal__sept4-table-item-col span {
  letter-spacing: 0em;
  color: var(--bg-neutral-500);
  font-size: 12px;
  line-height: 12px;
}

/* modifications of customs components */
.btnIconModify {
  border-radius: 50%;
  color: var(--bg-neutral-500);
}

.btnModifyActions {
  width: 135px;
}

.btnIcon {
  border-radius: 4px;
  width: 20px;
  height: 20px;
  border: 1px solid var(--bg-neutral-400);
  display: flex;
  justify-content: center;
  align-items: center;
  align-content: center;
  background-color: var(--white);
  transition: border 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

.btnIcon span {
  color: var(--bg-neutral-400);
  font-size: 16px;
  line-height: 16px;
  transition: color 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

.btnIcon:hover {
  border: 1px solid var(--bg-primary-400);
}

.btnIcon:hover span {
  color: var(--bg-primary-500);
}

@media only screen and (max-width: 768px) {
  .btnModifyActions {
    width: calc(50% - 10px);
  }

  .containerModal__sept3 {
    min-height: calc(100vh - 40px - 40px - 40px - 32px - 60px);
    overflow-y: auto;
    grid-template-columns: 1fr;
    gap: 20px;
    padding: 0px;
    align-items: center;
  }

  .containerModal__sept1,
  .containerModal__sept2 {
    padding: 40px 0px;
    justify-content: flex-start;
  }

  .containerModal__sept4-table {
    height: calc(100vh - 40px - 40px - 32px - 40px - 36px - 80px);
    padding-right: 0px;
  }
}

/* Tabla de valores */
.customTable {
  width: 100%;
  color: #444;
}

.customTable-header,
.customTable-row {
  padding: 10px;
  border-bottom: 1px solid #e1e1e1;
  background-color: #fff;
  display: grid;
  gap: 10px;
  grid-template-columns: 1.2fr repeat(5, 1fr);
}

.customTable-header {
  background-color: #fafafb;
  font-weight: 600;
  border-top-right-radius: 10px;
  border-top-left-radius: 10px;
  height: 50px;
}

.customTable-row:not(:last-child) {
  border-bottom: 1px solid #e1e1e1;
}

.customTable-row > span {
  display: block;
  margin: 5px 0;
}

.customTable-btn {
  padding: 5px 10px;
  border: 1px solid #ccc;
  border-radius: 4px;
  background-color: #f3f3f3;
  cursor: pointer;
}

.customTable-btn:hover {
  background-color: #e1e1e1;
}

@media (max-width: 768px) {
  .customTable-header,
  .customTable-row {
    grid-template-columns: repeat(3, 1fr);
  }
}

.text-right {
  text-align: right;
}

.inputModified::v-deep(input) {
  border: none !important;
}

.first-col-div {
  display: flex;
  align-items: center;
  width: 130px;
}

.label-header {
  text-align: right;
  padding-right: 20px;
}

.label-header:nth-child(1) {
  text-align: left;
  padding-right: 20px;
}
</style>
