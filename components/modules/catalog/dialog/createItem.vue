<script setup>
import {
  ref,
  defineEmits,
  computed,
  onMounted,
  defineProps
} from "vue";
import { capitalizeFirstLetter, onlyNumbersAndLetters } from "@/utils/helpers";
import { formatCurrency, getValueFormaRealTime } from "@/utils/formatAmount";
import configTable from "@/utils/configTables/catalog.json";

import useGlobalStore from "@/stores/global";
import useUserStore from "@/stores/user";
import useCatalogStore from "@/stores/catalog";
import useOrganizationStore from "@/stores/organization"; // cambiar

// STORES
const globalStore = useGlobalStore();
const userStore = useUserStore();
const catalogStore = useCatalogStore();
const organizationStore = useOrganizationStore();

// PROPS
const props = defineProps({
  id: {
    type: String,
    default: "",
  },
});

// EVENT BUS
const { $bus } = useNuxtApp();

// Emits
const emit = defineEmits(["closeModal"]);

// Constants
const mainColor = "--neutral-text-caption";
const { t } = useI18n();
const mainLabel = computed(() => ("modules.catalog.tabs.tab1.modals.create"));
const form = ref({
  name: "",
  code: "",
  accountNumber: "",
  parents: [],
  description: "",
  observation: "",
  numbers: {
    price: { default: { value: "", number: 0 } },
    cost: { default: { value: "", number: 0 } },
  },
  suppliers: [],
});
const currency = { ...(organizationStore?.organization?.currency || {}) };
const supplier = ref({ legalName: "", email: "", type: "", typeName: "" });
const newSupplier = ref(false);
const newSupplierForm = ref(false);
const search = ref({ category: "", supplier: "" });
const errors = ref({});
const loadings = ref({});
const results = ref({});
const tabSelected = ref(0);
const tabs = computed(() => ([
  {
    label: t(`${mainLabel.value}.tabs.tab1.label`),
    icon: "",
    tab: 0,
    indicator: false,
    disabled: false,
    main: false,
  },
  {
    label: t(`${mainLabel.value}.tabs.tab2.label`),
    icon: "",
    tab: 1,
    indicator: false,
    disabled: false,
    main: false,
  },
  {
    label: t(`${mainLabel.value}.tabs.tab3.label`),
    icon: "",
    tab: 2,
    indicator: false,
    disabled: false,
    main: false,
  },
  {
    label: t(`${mainLabel.value}.tabs.tab4.label`),
    icon: "",
    tab: 3,
    indicator: false,
    disabled: false,
    main: false,
  },
]));
const typesUser = [
  { name: { es: "Empresa", en: "Business" }, value: "business" },
  { name: { es: "Persona", en: "Personal" }, value: "personal" },
];
const typeSupplierOptions = [
  { label: "Empresa", icon: "building", value: "business" },
  { label: "Persona", icon: "user", value: "personal" },
];

// MOUNTED
onMounted(async () => {
  if (props.id) {
    try {
      globalStore.loading = true;
      const resp = await catalogStore.getItemById(props.id);
      form.value = catalogStore.basicFormattingItem(resp);
    } catch (error) {
      console.error(error);
    } finally {
      globalStore.loading = false;
    }
  } else {
    const defaultValue = formatCurrency("", currency, true);
    form.value.numbers.price.default.value = defaultValue;
    form.value.numbers.cost.default.value = defaultValue;
  }
});

// ACTIONS
const verifyName = () => {
  form.value.name = capitalizeFirstLetter(form.value.name);
};
const showSearch = () => {
  newSupplier.value = true;
};
const verifyNameSupplier = () => {
  supplier.value.name = capitalizeFirstLetter(supplier.value.name);
};
const filterUsers = async () => {
  const toSearch = search.value.supplier.trim();
  if (toSearch !== "") {
    loadings.value.supplier = true;
    const resp = await userStore.findByUsersByNameOrEmail(
      true,
      false,
      toSearch
    );
    results.value.users = mapperUsers(resp || []);
    loadings.value.supplier = false;
  }
};
const mapperUsers = (list = []) => {
  let resp = [];
  list.forEach((l) => {
    const exist = form.value.suppliers.find((c) => c._id === l._id);
    if (!exist) {
      resp.push({
        label: l?.data?.legalName,
        text: l?.email || "-",
        img: l?.imgUrl,
        type: l?.data?.type || "business",
        oldData: { ...l },
      });
    }
  });
  return resp;
};
const updatedTypeOp = (type) => {
  const types = {
    personal: () => {
      // supplier.value.type = "personal";
      // const names = { es: "Persona", en: "Personal" };
      // const typeName = names[globalStore.lang];
      // supplier.value.typeName = typeName;
      userStore.dataSheet.data.data.type = "personal";
      const names = { es: "Persona", en: "Personal" };
      const typeName = names[globalStore.lang];
      userStore.dataSheet.data.data.typeName = typeName;
    },
    business: () => {
      // supplier.value.type = "business";
      // const names = { es: "Empresa", en: "Business" };
      // const typeName = names[globalStore.lang];
      // supplier.value.typeName = typeName;
      userStore.dataSheet.data.data.type = "business";
      const names = { es: "Empresa", en: "Business" };
      const typeName = names[globalStore.lang];
      userStore.dataSheet.data.data.typeName = typeName;
    },
  };
  setTimeout(() => {
    types[type]();
  }, 10);
};
const createUser = () => {
  // supplier.value.legalName = capitalizeFirstLetter(search.value.supplier);
  // newSupplierForm.value = true;
  // setTimeout(() => {
  //   cleanSearch()
  // }, 0)

  userStore.dataSheet.state = "create";
  userStore.showModalDataSheet = true;
  userStore.showBtnBack = true;
  setTimeout(() => {
    userStore.dataSheet.data.data.legalName = capitalizeFirstLetter(
      search.value.supplier
    );
    $bus.$on("receiveContact", (receiveContact) => {
      newSupplier.value = false;
      newSupplierForm.value = false;
      form.value.suppliers.unshift(receiveContact);
      search.value.supplier = "";
    });
  }, 10);
};
const cleanSearch = () => {
  search.value.supplier = "";
};
const selectedUser = (user) => {
  newSupplier.value = false;
  newSupplierForm.value = false;
  form.value.suppliers.unshift(user.oldData);
  search.value.supplier = "";
};
const closeForm = () => {
  newSupplier.value = false;
  newSupplierForm.value = false;
  setTimeout(() => {
    cleanSearch();
  }, 0);
};
const getIconForm = computed(() => {
  const types = {
    business: "building",
    personal: "user",
  };
  return types[supplier.value.type] || "building";
});
const validFormItem = computed(() => {
  return (
    form.value.name.trim() !== ""
    // form.value.code.trim() !== "" &&
    // form.value.accountNumber.trim() !== ""
  );
});
const clearForm = () => {
  supplier.value = { legalName: "", email: "", type: "", typeName: "" };
  newSupplierForm.value = false;
};

const createItem = async () => {
  try {
    globalStore.loading = true;

    let body = catalogStore.basicFormattingItem(form.value);
    const parents = body.parents.map((parent) => {
      return parent._id;
    });
    body.parents = parents;
    if (props.id) {
      await catalogStore.updateItem({ ...body, _id: props.id });
    } else {
      await catalogStore.createItem(body);
    }

    catalogStore.page = 1;
    catalogStore.nextPage = 2;
    
    await catalogStore.getItemsWithPaginate();
    emit("closeModal");
  } catch (error) {
    console.error(error);
  } finally {
    globalStore.loading = false;
  }
};

const findCategory = debounce(async (event) => {
  const toSearch = search.value.category.trim();

  loadings.value.category = true;

  if (toSearch === "") {
    results.value.categories = [];
  } else {
    catalogStore.page = 1;
    catalogStore.nextPage = 20;
    await catalogStore.findItem(toSearch, "groups");
    results.value.categories = mapperCategories(catalogStore.groups);
  }
  loadings.value.category = false;
}, 10);

const mapperCategories = (list) => {
  return list.map((l) => ({
    label: l.name,
    _id: l._id,
    oldData: { ...l },
  }));
};

const selectedCategory = (group) => {
  const parentExists = form.value.parents.some(
    (existingParent) =>
      existingParent.name.toLowerCase() === group.label.toLowerCase()
  );
  if (!parentExists) {
    form.value.parents.unshift({ name: group.label, _id: group._id });
  }
  setTimeout(() => {
    search.value.category = "";
  }, 10);
};

const cleanInput = (type) => {
  if (type === "category") {
    results.value.categories = [];
    search.value.category = "";
  }
};

const removeCategory = (pos) => {
  form.value.parents.splice(pos, 1);
};

// Formateador de montos
const inputAmount = (prop, event) => {
  const valueInput = event.target.value;
  const numbers = getValueFormaRealTime(valueInput, currency, prop);
  form.value.numbers[prop].default.number = numbers.numericValue;
  form.value.numbers[prop].default.value = numbers.formattedValue;
};
const toggleInputState = (prop, focusIn) => {
  const valueInput = form.value.numbers[prop].default.number;
  console.log("currency", currency);
  form.value.numbers[prop].default.value = focusIn
    ? valueInput
    : formatCurrency(valueInput, currency, true);
};
const handleKeyDown = (event) => {
  const { typeFormat, precision } = currency;
  const decimalSeparator = typeFormat === "de-DE" ? "," : ".";
  const inputValue = event.target.value;

  // Bloquear teclas no válidas
  if (!/^[0-9]$/.test(event.key) && event.key !== decimalSeparator) {
    event.preventDefault();
    return;
  }

  // Bloquear entrada de separador decimal si `precision` es 0
  if (precision === 0 && event.key === decimalSeparator) {
    event.preventDefault();
    return;
  }

  // Bloquear más de un separador decimal
  if (event.key === decimalSeparator && inputValue.includes(decimalSeparator)) {
    event.preventDefault();
    return;
  }
};

const defaultName = computed(() => {
  return props.id ? t(`${mainLabel.value}.title2`) : t(`${mainLabel.value}.title`)
});

const deleteSupplierValid = computed(() => !form.value.suppliers.some(s => s.selected));

const deleteSupplier = () => {
  form.value.suppliers = form.value.suppliers.filter(s => !s.selected);
}
</script>

<template>
  <div class="createItem">
    <div class="createItem__title space-between">
      <span>{{ form.name || defaultName }}</span>
      <u-button-icon
        icon="close"
        class="btnIconModify"
        type="outlined"
        :color="mainColor"
        @click="emit('closeModal')"
      />
    </div>
    <u-tabs class="createItem__tabs" :tabs="tabs" v-model="tabSelected" />
    <div class="createItem__container">
      <template v-if="tabSelected === 0">
        <div class="createItem__container-group">
          <div class="createItem__container-group-div">
            <span class="u u-user"></span>
          </div>
          <div class="createItem__container-group-div">
            <span v-text="$t(`${mainLabel}.tabs.tab1.inputs.name.label`)"></span>
          </div>
          <u-input
            v-model="form.name"
            :placeholder="$t(`${mainLabel}.tabs.tab1.inputs.name.placeholder`)"
            size="s"
            :error="errors.name"
            @input="verifyName"
          />
        </div>
        <div class="createItem__container-group">
          <div class="createItem__container-group-div">
            <span class="u u-user"></span>
          </div>
          <div class="createItem__container-group-div">
            <span v-text="$t(`${mainLabel}.tabs.tab1.inputs.code.label`)"></span>
          </div>
          <u-input
            v-model="form.code"
            :placeholder="$t(`${mainLabel}.tabs.tab1.inputs.code.placeholder`)"
            size="s"
            :error="errors.code"
            @input="form.code = onlyNumbersAndLetters(form.code)"
          />
        </div>
        <div class="createItem__container-group">
          <div class="createItem__container-group-div">
            <span class="u u-star"></span>
          </div>
          <div class="createItem__container-group-div">
            <span v-text="$t(`${mainLabel}.tabs.tab1.inputs.numberAccount.label`)"></span>
          </div>
          <u-input
            v-model="form.accountNumber"
            :placeholder="$t(`${mainLabel}.tabs.tab1.inputs.numberAccount.label`)"
            size="s"
            :error="errors.accountNumber"
            @input="
              form.accountNumber = onlyNumbersAndLetters(form.accountNumber)
            "
          />
        </div>
        <div class="createItem__container-group">
          <div class="createItem__container-group-div">
            <span class="u u-user"></span>
          </div>
          <div class="createItem__container-group-div">
            <span v-text="$t(`${mainLabel}.tabs.tab1.inputs.categories.label`)"></span>
          </div>
          <div class="createItem__container-group-list">
            <u-search
              v-model="search.category"
              :placeholder="$t(`${mainLabel}.tabs.tab1.inputs.categories.placeholder`)"
              size="s"
              @input="findCategory"
              :loading="loadings.category"
              :options="results.categories"
              @selectedOption="selectedCategory"
              @cleanInput="cleanInput('category')"
            />
            <div class="categories">
              <u-tags
                v-for="(role, r) in form.parents"
                size="s"
                :key="r"
                :text="role?.name || '-'"
                @closeButton="removeCategory(r)"
                :delete="true"
              />
            </div>
          </div>
        </div>
      </template>
      <template v-if="tabSelected === 1">
        <div class="createItem__container-group">
          <div class="createItem__container-group-div">
            <span class="u u-star"></span>
          </div>
          <div class="createItem__container-group-div">
            <span v-text="$t(`${mainLabel}.tabs.tab2.inputs.description.label`)"></span>
          </div>
          <u-textarea
            v-model="form.description"
            class="textareaCustom"
            :placeholder="$t(`${mainLabel}.tabs.tab2.inputs.description.placeholder`)"
          />
        </div>
        <div class="createItem__container-group">
          <div class="createItem__container-group-div">
            <span class="u u-star"></span>
          </div>
          <div class="createItem__container-group-div">
            <span v-text="$t(`${mainLabel}.tabs.tab2.inputs.observation.label`)"></span>
          </div>
          <u-textarea
            v-model="form.observation"
            class="textareaCustom"
            :placeholder="$t(`${mainLabel}.tabs.tab2.inputs.observation.placeholder`)"
          />
        </div>
      </template>
      <template v-if="tabSelected === 2">
        <div class="createItem__container-group">
          <div class="createItem__container-group-div">
            <span class="u u-invoice"></span>
          </div>
          <div class="createItem__container-group-div">
            <span v-text="$t(`${mainLabel}.tabs.tab3.inputs.price.label`)"></span>
          </div>
          <u-input
            v-model="form.numbers.price.default.value"
            :placeholder="$t(`${mainLabel}.tabs.tab3.inputs.price.placeholder`)"
            size="s"
            :error="errors.price"
            @input="inputAmount('price', $event)"
            @keydown="handleKeyDown($event)"
            @focusin="toggleInputState('price', true)"
            @focusout="toggleInputState('price', false)"
          />
        </div>
        <div class="createItem__container-group">
          <div class="createItem__container-group-div">
            <span class="u u-pay"></span>
          </div>
          <div class="createItem__container-group-div">
            <span v-text="$t(`${mainLabel}.tabs.tab3.inputs.cost.label`)"></span>
          </div>
          <u-input
            v-model="form.numbers.cost.default.value"
            :placeholder="$t(`${mainLabel}.tabs.tab3.inputs.cost.label`)"
            size="s"
            :error="errors.cost"
            @input="inputAmount('cost', $event)"
            @focusin="toggleInputState('cost', true)"
            @focusout="toggleInputState('cost', false)"
          />
        </div>
      </template>
      <template v-if="tabSelected === 3">
        <div v-if="newSupplier" class="createItem__newSupplier">
          <div class="createItem__newSupplier-header">
            <u-avatar :size="80" />
            <div class="createItem__newSupplier-content" v-if="newSupplierForm">
              <div class="createItem__newSupplier-top">
                <span class="createItem__newSupplier-main truncateText">{{
                  supplier.legalName || "-"
                }}</span>
                <span class="createItem__newSupplier-second truncateText">{{
                  supplier.typeName || "-"
                }}</span>
                <span class="createItem__newSupplier-third truncateText">{{
                  supplier.email || "-"
                }}</span>
              </div>
              <u-button
                text="Cambiar"
                icon="change"
                type="outlined"
                size="s"
                @click="clearForm"
              />
            </div>
            <u-search-by-type
              v-else
              v-model="search.supplier"
              @input="filterUsers"
              class="search"
              placeholder="Buscar usuarios por nombre..."
              :loading="loadings.supplier"
              :options="results.users"
              :showSearchIcon="true"
              :avatar="true"
              :create="true"
              size="s"
              :updated="false"
              :snippet="true"
              :iconSelect="null"
              :types="typesUser"
              @updatedTypeOp="updatedTypeOp"
              @newOption="createUser"
              @selectedOption="selectedUser"
              @cleanInput="cleanSearch"
            />
            <u-button-icon
              icon="undo"
              size="s"
              type="outlined"
              @click="closeForm"
            />
          </div>
          <div class="createItem__container" v-if="newSupplierForm">
            <div class="createItem__container-group">
              <div class="createItem__container-group-div">
                <span class="u u-user"></span>
              </div>
              <div class="createItem__container-group-div">
                <span>Nombre</span>
              </div>
              <u-input
                v-model="supplier.legalName"
                placeholder="Ingresa el nombre"
                size="s"
                :error="errors.nameSupplier"
                @input="verifyNameSupplier"
              />
            </div>
            <div class="createItem__container-group">
              <div class="createItem__container-group-div">
                <span class="u u-building"></span>
              </div>
              <div class="createItem__container-group-div">
                <span>Tipo</span>
              </div>
              <u-select
                :options="typeSupplierOptions"
                :iconOption="true"
                :icon="getIconForm"
                size="s"
                v-model="supplier.typeName"
                :full-data="true"
                @full-data="(data) => (supplier.type = data.value)"
              />
            </div>
            <div class="createItem__container-group">
              <div class="createItem__container-group-div">
                <span class="u u-email"></span>
              </div>
              <div class="createItem__container-group-div">
                <span>Correo</span>
              </div>
              <u-input
                v-model="supplier.email"
                placeholder="Ingresa el correo electrónico"
                size="s"
                :error="errors.eamilSupplier"
              />
            </div>
            <div class="createItem__container-action">
              <u-button icon="user-new" text="Agregar Proveedor" size="s" />
            </div>
          </div>
        </div>
        <div v-else class="createItem__supplierDefault">
          <div class="createItem__supplierDefault-filter">
            <u-button-icon
              icon="delete"
              size="s"
              type="outlined"
              color="--bg-danger-500"
              colorHover="--bg-danger-400"
              colorActive="--bg-danger-600"
              @click="deleteSupplier"
              :disabled="deleteSupplierValid"
            />
            <u-button
              text="Agregar Proveedor"
              size="s"
              icon="user-new"
              @click="showSearch"
            />
          </div>
          <TableBasic
            :configTable="configTable.suppliers"
            :content="form.suppliers"
          >
            <template v-slot:roles="item">
              <div class="roles">
                <u-tags 
                  v-for="(role, r) in item?.item?.roles"
                  size="s"
                  :key="r"
                  :text="role.name[globalStore.lang]"
                  :delete="false" />
              </div>
            </template>
            <template v-slot:counter="item">
              <span class="counter body-m-sb">{{ item?.item?.counter || 12 }}</span>
            </template>
          </TableBasic>
        </div>
      </template>
    </div>
    <div class="createItem__actions space-between">
      <u-button
        :text="$t(`${mainLabel}.buttons.button1.label`)"
        type="outlined"
        size="s"
        class="btnAction"
        @click="emit('closeModal')"
      />
      <u-button
        :text="$t(`${mainLabel}.buttons.button2.label`)"
        size="s"
        class="btnAction"
        @click="createItem"
        :disabled="!validFormItem"
      />
    </div>
  </div>
</template>

<style scoped>
.createItem {
  width: 720px;
  height: 80vh;
  max-height: 720px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.createItem__title {
  height: 40px;
}

.createItem__title span {
  font-size: 16px;
  font-weight: 600;
  line-height: 20px;
  text-align: left;
  color: var(--neutral-text-body);
}

.createItem__tabs {
  height: 32px;
}

.createItem__container {
  flex-grow: 1;
}

.createItem__actions {
  height: 32px;
}

/* Container */
.createItem__container {
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding: 40px 20px;
  box-sizing: border-box;
}

.createItem__container-group {
  display: grid;
  grid-template-columns: 16px 150px 1fr;
  gap: 10px;
}

.createItem__container-group-div {
  height: 32px;
  display: flex;
  align-items: center;
}

.createItem__container-group span {
  font-size: 14px;
  font-weight: 600;
  line-height: 18px;
  color: var(--neutral-text-caption);
}

.createItem__container-group-div .u {
  font-size: 16px;
  font-weight: 400;
  line-height: 16px;
}

/* Suppliers */
.createItem__supplierDefault {
  display: grid;
  grid-template-rows: 32px 1fr;
  gap: 16px;
}

.createItem__supplierDefault-filter {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 16px;
}

/* Form */
.createItem__newSupplier {
  display: grid;
  grid-template-rows: 80px 1fr;
  gap: 16px;
  flex-grow: 1;
}

.createItem__newSupplier .createItem__container {
  border-top: 1px solid var(--neutral-border-subtle);
}

.createItem__newSupplier-header {
  display: grid;
  grid-template-columns: 80px 1fr 32px;
  gap: 16px;
  align-items: center;
}

.createItem__newSupplier-form {
  background-color: blue;
}

.createItem__newSupplier-content {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 20px;
  align-items: center;
}

.createItem__newSupplier-top {
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.createItem__newSupplier-main {
  font-size: 16px;
  font-weight: 600;
  line-height: 20px;
  color: var(--neutral-text-body);
  max-width: 400px;
}

.createItem__newSupplier-second {
  font-size: 14px;
  font-weight: 400;
  line-height: 18px;
  color: var(--neutral-text-caption);
}

.createItem__newSupplier-third {
  font-size: 14px;
  font-weight: 600;
  line-height: 18px;
  color: var(--primary-text-default);
  max-width: 396px;
}

.createItem__container-action {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  height: 32px;
}

.categories {
  display: flex;
  gap: 8px;
  width: 100%;
  flex-wrap: wrap;
  max-height: 78px;
  overflow-y: auto;
  margin-top: 10px;
}

.categories::-webkit-scrollbar {
  width: 8px;
  height: 8px;
  background: var(--neutral-surface-light);
  border-radius: 20px;
}

.categories::-webkit-scrollbar-thumb {
  background: var(--neutral-surface-subtle);
  border-radius: 5px;
}

.roles {
  display: flex;
  gap: 8px;
  width: 100%;
  flex-wrap: no-wrap;
  overflow-y: auto;
}

.roles::-webkit-scrollbar {
  width: 0px;
  height: 0px;
}

.counter {
  color: var(--neutral-text-caption);
}

/* Global Styles */
.space-between {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.btnIconModify {
  border-radius: 50%;
}

.btnAction {
  width: 120px;
}

.textareaCustom {
  height: 150px;
}

span {
  font-family: Nunito;
}
</style>
