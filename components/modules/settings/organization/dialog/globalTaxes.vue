<script setup>
import { ref, defineEmits, computed, watch, onMounted } from "vue";
import { coins } from "@/utils/labels/settings.json";
import useGlobalStore from "@/stores/global";
import useOrganizationStore from "@/stores/organization";

// STORE
const globalStore = useGlobalStore();
const organizationStore = useOrganizationStore();

//EMITS
const emit = defineEmits(["closeModal", "lockModal", "initDocTypeSales"]);

// PROPS
const props = defineProps({
  document: {
    type: Object,
    default: () => {},
  },
});

// CONSTANTS
const taxes = ref([]);
const imgUrlFakeUnabase = "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTtV1oAuLCQpYkpghQseJfBlAleaEpgD1cZ7A&s"

// BUSCADOR
const search = ref("");
const results = ref([]);
const loading = ref(false);
const cleanSearch = () => {
  search.value = "";
  results.value = [];
};
const selectTax = (tax) => {
  // evitar duplicados (aunque ya lo filtras en search)
  if (!taxes.value.some(t => t._id === tax._id)) {
    taxes.value.push({
      ...tax,
      default: tax.default || false, // mantener default si viene
    });
  }
  // ordenar después de agregar
  sortTaxes();

  setTimeout(() => {
    cleanSearch();
  }, 0);
};

const searchTaxes = async (e) => {
  const taxToSearch = e.target.value.trim();
  if(taxToSearch.length === 0) {
    results.value = []
    return
  } else {
    loading.value = true;

    let tempResults = await organizationStore.searchTaxesByType(taxToSearch, "tax");

    const existingTaxIds = new Set(taxes.value.map((t) => t._id));

    tempResults = tempResults.filter((t) => !existingTaxIds.has(t._id));

    results.value = tempResults.map((t) => ({
      ...t,
      label: `${t.name} (${t.retention ? '-' : '+'}${t.value}%)`,
      text: getCreator(t),
    }));

    loading.value = false;
  }
  
};
const getCreator = (tax) => {
  const text = {
    es: "Creado por: ",
    en: "Created by: ",
  };
  let creator = "Unabase";
  if (tax.creator) {
    creator = `${tax?.creator?.data?.name?.first} ${tax?.creator?.data?.name?.last}`;
  }
  return `${text[globalStore.lang]} ${creator}`;
};

// TAXES
const deleteTax = (pos) => {
  taxes.value.splice(pos, 1);
};

// FUNCTIONS
const save = async () => {
  if(!props.document.global) {
    globalStore.loading = true;
  
    // ACTUALIZAR TAXES DE DOCUMENTOS DE COMPRAS
    if (organizationStore.tabDocsType === 0) {
        let body = {
        name: props.document.name,
        description: props.document.description || "",
        code: props.document.code,
        isActive: props.document.isActive,
        taxes: taxes.value,
        _id: props.document._id,
      };
    
      const taxDefaults = taxes.value.filter((t) => t.default).map((t) => t._id);
    
      if (taxDefaults.length > 0) {
        body.taxDefault = taxDefaults;
      }
    
      await organizationStore.updateDocType(body);
    
      const resp = await organizationStore.getDocsType();
      if (resp) organizationStore.docsType = resp;
    }
    // ACTUALIZAR TAXES DE DOCUMENTOS DE VENTA
    else if (organizationStore.tabDocsType === 1) {

      const idTypeSalesDocument = props.document._id

      let body = {
        name: props.document.name,
        description: props.document.description || "",
        code: props.document.code,
        isActive: props.document.isActive,
        taxes: taxes.value,
        _id: props.document._id,
      };

      const taxDefaults = taxes.value.filter((t) => t.default).map((t) => t._id);
        body.taxDefault = taxDefaults;
      

      await organizationStore.updateTypeSalesDocument(idTypeSalesDocument, body);

      emit("initDocTypeSales");

    }
    
  
    emit("closeModal");
  
    globalStore.loading = false;
  }
};

// --- Helper: parse fecha segura ---
const parseDate = (d) => {
  // acepta Date, timestamp o string; si falta devuelve epoch 0 para que vaya al final
  if (!d) return 0;
  const date = (d instanceof Date) ? d : new Date(d);
  return isNaN(date.getTime()) ? 0 : date.getTime();
};

// --- Función de ordenamiento ---
const sortTaxes = () => {
  // Ordena in-place taxes.value
  taxes.value.sort((a, b) => {
    // 1) Default primero (true antes que false)
    if (a.default && !b.default) return -1;
    if (!a.default && b.default) return 1;

    // 2) Si ambos iguales en default -> ordenar por createdAt (más recientes primero)
    const at = parseDate(a.createdAt);
    const bt = parseDate(b.createdAt);

    // Descendente: bt - at (si quieres ascendente usar at - bt)
    return bt - at;
  });
};

// Observa los flags 'default' para reordenar cuando cambien
watch(
  () => taxes.value.map(t => t.default),
  () => {
    sortTaxes();
  },
  { immediate: false }
);


// MOUNTED
onMounted(() => {
  if (organizationStore.tabDocsType === 0) {
      taxes.value = JSON.parse(JSON.stringify(props.document.taxes));

      console.log("Taxes", taxes.value);

  let defaultTaxIds = null

  if (props.document.taxDefault && props.document.taxDefault.length > 0) {
    defaultTaxIds = new Set(props.document.taxDefault);
  }

  taxes.value.forEach((t) => {
    t.default = defaultTaxIds ? defaultTaxIds.has(t._id) : false;
    const creatorObj = organizationStore.taxes.find(o => o._id === t._id)
    t.creator = creatorObj?.creator
  });

  sortTaxes();
  } 
  else if (organizationStore.tabDocsType === 1) {
    taxes.value = JSON.parse(JSON.stringify(props.document.taxes));

    console.log("Taxes", taxes.value);

    let defaultTaxIds = null

    if (props.document.taxDefault && props.document.taxDefault.length > 0) {
      defaultTaxIds = new Set(props.document.taxDefault);
    }

    taxes.value.forEach((t) => {
      t.default = defaultTaxIds ? defaultTaxIds.has(t._id) : false;
      const creatorObj = organizationStore.taxes.find(o => o._id === t._id)
      t.creator = creatorObj?.creator
    });
  }

  sortTaxes();
});
</script>

<template>
  <div class="modal">
    <div class="modal__header">
      <span>Agregar Impuestos</span>
      <u-button-icon
        icon="close"
        class="btnIconModify"
        color="--neutral-text-caption"
        size="s"
        type="outlined"
        @action-btn="emit('closeModal')"
      />
    </div>
    <div class="modal__form">
      <div class="groupInput">
        <label> Tipo de Documento </label>
        <u-input v-model="props.document.name" :disabled="true" />
      </div>
      <div class="groupInput">
        <label> Buscar Impuesto </label>
        <u-search
          v-model="search"
          placeholder="Buscar impuesto que deseas agregar"
          :options="results"
          :snippet="true"
          :loading="loading"
          @cleanInput="cleanSearch"
          @selectedOption="selectTax"
          @input="searchTaxes"
          :disabled="props.document.global"
        />
      </div>
      <div class="groupInput">
        <label> Impuestos Agregados </label>
        <div class="containerSection__table">
          <div class="fakeHeader">
            <div class="containerSection__table-header">
              <div class="col withBtn">
                <span class="label">Impuesto</span>
              </div>
              <div style="display: flex; justify-content: center">
                <span>%</span>
              </div>
              <div style="display: flex; justify-content: center">
                <span>Tipo</span>
              </div>
              <div style="display: flex; justify-content: center">
                <span>Creado por</span>
              </div>
              <div style="display: flex; justify-content: center">
                <span>Default</span>
              </div>
              <span></span>
            </div>
          </div>
          <div
            class="containerSection__table-item"
            v-for="(tax, t) in taxes"
            :key="t"
          >
            <div class="col">
              <span class="text truncateText">
                {{ tax.name }}
              </span>
              <div style="display: flex; justify-content: center">
                <span class="text percentage">{{ tax.value }}</span>
              </div>
              <div style="display: flex; justify-content: center">
                <span
                  class="u"
                  :class="
                    tax.retention ? 'u-trend-down ret' : 'u-trend-up retNo'
                  "
                ></span>
              </div>
              <div style="display: flex; justify-content: center">
                <u-avatar
                  :user="{
                    name: '',
                    src:
                      tax.creator?.imgUrl ||
                      imgUrlFakeUnabase,
                  }"
                  :size="20"
                />
              </div>
              <div style="display: flex; justify-content: center">
                <u-checkbox
                  v-model="tax.default"
                  :height="16"
                  title="Predeterminado"
                  :disabled="props.document.global"
                />
              </div>

              <button :disabled="tax.default || props.document.global" @click="deleteTax(t)">
                <span class="u u-close"></span>
              </button>
            </div>
          </div>
          <div v-if="!taxes.length" class="noCurrencies">
            <span v-text="'Sin Impuestos Registrados'"></span>
          </div>
        </div>
      </div>
    </div>
    <div class="modal__actions">
      <u-button
        text="Cancelar"
        type="outlined"
        class="mainBtnModify"
        size="s"
        @action-btn="emit('closeModal')"
      />
      <u-button
        text="Guardar"
        class="mainBtnModify"
        @action-btn="save"
        size="s"
        :disabled="props.document.global"
      />
    </div>
  </div>
</template>

<style scoped>
span {
  font-family: Nunito;
}
.modal {
  height: auto;
  display: grid;
  grid-template-rows: 40px 1fr 42px;
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
  height: 42px;
  display: flex;
  justify-content: space-between;
  align-items: end;
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
.fakeHeader {
  position: sticky;
  top: 0px;
  z-index: 1;
  background-color: var(--neutral-background-default);
}
.containerSection__table-header {
  display: grid;
  align-items: center;
  grid-template-columns: 1fr 24px 25px 80px 50px 10px;
  gap: 20px;
  padding: 12px;
  background-color: var(--neutral-surface-softer);
  border-radius: 12px 12px 0 0;
  border: 1px solid var(--neutral-border-light);
  border-radius: 12px 12px 0 0;
}
.containerSection__table-header,
.containerSection__table-item {
  width: 100%;
}
.percentage {
  color: var(--neutral-text-caption) !important;
}
.containerSection__table-header .col {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.containerSection__table-item .col {
  display: grid;
  align-items: center;
  grid-template-columns: 1fr 24px 25px 80px 50px 10px;
  gap: 20px;
  padding: 12px;
}
.ret {
  color: red;
}
.retNo {
  color: green;
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
.containerSection__table-item .col {
  background-color: var(--neutral-background-default);
  border-bottom: 1px solid var(--neutral-border-light);
  border-right: 1px solid var(--neutral-border-light);
  border-left: 1px solid var(--neutral-border-light);
}
.containerSection__table-item:last-child .col {
  border-radius: 0 0 12px 12px;
}
.containerSection__table-header span {
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
