<script setup>
import { ref, onMounted, watch } from "vue";
import { debounce, isEqual } from "lodash";
import useOrganizationStore from "@/stores/organization";
import useUserStore from "@/stores/user";
import useIncomesStore from "@/stores/incomes";
import useContactsStore from "@/stores/contacts";
import useGlobalStore from "@/stores/global";
import { useI18n } from "vue-i18n";

//  STORES
const userStore = useUserStore();
const organizationStore = useOrganizationStore();
const incomesStore = useIncomesStore();
const contactsStore = useContactsStore();
const globalStore = useGlobalStore();

// EMITS
const emit = defineEmits(["save"]);

// TRANSLATIONS
const { t } = useI18n();
const module = "ui.income.sections.information.sections.paymentInformation";
const moduleNav = "ui.income.sections.information";

// EVENT BUS CREATE CONTACT
const { $bus } = useNuxtApp();

// CONSTANTES CREATE CONTACT
const errors = ref({});

// DATOS DEL FORMULARIO

// Este es nuestro formulario principal - aquí guardamos toda la información
const form = ref({
  // Información básica del proyecto
  client: null,
  agency: null,
  product: "",
  validity: "",

  // Equipo de trabajo
  production_director: null,
  executive_producer: null,
  director: null,
  client_contact: null,
  creative_director: null,
  account_director: null,
  agency_producer: null,
});

// Para los campos de búsqueda - aquí guardamos lo que el usuario escribe
const searches = ref({
  client: "",
  agency: "",
  production_director: "",
  executive_producer: "",
  director: "",
  client_contact: "",
  creative_director: "",
  account_director: "",
  agency_producer: "",
});

// Aquí guardamos los resultados cuando buscamos personas
const searchResults = ref({
  client: [],
  agency: [],
  production_director: [],
  executive_producer: [],
  director: [],
  client_contact: [],
  creative_director: [],
  account_director: [],
  agency_producer: [],
});

// Para mostrar el spinner de "cargando" mientras buscamos
const searchLoading = ref({
  client: false,
  agency: false,
  production_director: false,
  executive_producer: false,
  director: false,
  client_contact: false,
  creative_director: false,
  account_director: false,
  agency_producer: false,
});

const typesUser = [
  { name: { es: "Empresa", en: "Business" }, value: "business" },
  { name: { es: "Persona", en: "Personal" }, value: "personal" },
];

// FUNCIONES DE AYUDA

/**
 * Convierte la lista de usuarios que viene del servidor
 * al formato que necesita nuestro componente de búsqueda
 */
function convertUserListForSearch(userList) {
  return userList.map((user) => {
    return {
      label: user?.data?.legalName || "",
      text: user?.email || "",
      img: user?.imgUrl || null,
      oldData: { ...user },
    };
  });
}

/**
 * Crea un objeto de contacto con la estructura que necesita nuestro formulario
 */
function createContactFromSelection(selectedOption) {
  console.log("data usuario seleccionado", selectedOption);
  return {
    _id: selectedOption?.oldData?._id || "",
    data: {
      legalName: selectedOption?.label || "",
    },
    email: selectedOption?.oldData?.email || "",
    imgUrl: selectedOption?.oldData?.imgUrl || "",
  };
}

function createContactFromSelectionServer(selectedOption) {
  console.log("data usuario seleccionado", selectedOption);
  return {
    contact: selectedOption?.oldData?._id || "",
    data: {
      legalName: selectedOption?.label || "",
    },
    email: selectedOption?.oldData?.email || "",
    imgUrl: selectedOption?.oldData?.imgUrl || "",
  };
}

/**
 * Guarda los datos del formulario en el store para no perderlos
 */
function saveFormToStore() {
  incomesStore.informationForm.amfi.projectInformation = form.value;
}

/**
 * Guarda los datos del formulario en la base de datos
 */
async function saveFormInformation() {
  await incomesStore.saveAmfiInformation();
}

// FUNCIONES DE BÚSQUEDA

// create contacts:
const getIconByType = (type) => {
  setTimeout(() => {
    console.log("type", type);
    userStore.dataSheet.data.data.type = type;
    const types = {
      personal: {
        es: "Personal",
        en: "Personal",
      },
      business: {
        es: "Empresa",
        en: "Business",
      },
    };
    userStore.dataSheet.data.data.typeName =
      types?.[type]?.[globalStore.lang] || "";
  }, 100);
};

const newOption = (input) => {
  const inputs = {
    client: () => contactFromDataSheet("client"),
    agency: () => contactFromDataSheet("agency"),
    contact: () => contactFromDataSheet("contact"),
    production_director: () => contactFromDataSheet("production_director"),
    executive_producer: () => contactFromDataSheet("executive_producer"),
    director: () => contactFromDataSheet("director"),
    client_contact: () => contactFromDataSheet("client_contact"),
    creative_director: () => contactFromDataSheet("creative_director"),
    account_director: () => contactFromDataSheet("account_director"),
    agency_producer: () => contactFromDataSheet("agency_producer"),
  };

  if (inputs[input]) inputs[input]();
};

const contactFromDataSheet = (type, id = null) => {
  userStore.dataSheet.alertCustom.show = false;
  setTimeout(() => {
    userStore.showModalDataSheet = true;
    if (id) userStore.userDataSheetId = id;
    userStore.dataSheet.state = id ? "edit" : "create";
    userStore.showBtnBack = true;
    errors.value[type] = false;
    setTimeout(() => {
      userStore.dataSheet.data.data.legalName = searches.value[type];
    }, 10);
    $bus.$on("receiveContact", async (receiveContact) => {
      const formatearReceiveContact = {
        _id: receiveContact?._id || "",
        data: {
          legalName: receiveContact?.data?.legalName || "",
        },
        email: receiveContact?.email || "",
        imgUrl: receiveContact?.imgUrl || "",
      };

      form.value[type] = formatearReceiveContact;

      searches.value[type] = receiveContact?.data?.legalName || "";

      saveFormToStore();

      console.log("receiveContact", receiveContact);
      // updateServerData(type, receiveContact);

      const updareSercerDataReceiveContact = async (type, receiveContact) => {
        if (type !== "client" && type !== "client_contact") {
          return;
        }

        if (type === "client") {
          // Actualizar cliente
          incomesStore.income.client = formatearReceiveContact;
        }

        if (type === "client_contact") {
          // Actualizar contacto
          incomesStore.income.contact = formatearReceiveContact;
        }

        await incomesStore.saveAmfiInformation();
      };

      await updareSercerDataReceiveContact(type, receiveContact);
    });
  }, 10);
};

/**
 * Limpia la búsqueda de un campo específico
 * (cuando el usuario hace clic en la X)
 */
function clearSearch(fieldName) {
  searches.value[fieldName] = ""; // Limpiar el texto de búsqueda
  searchResults.value[fieldName] = []; // Limpiar los resultados
  form.value[fieldName] = null; // Limpiar la selección del formulario

  if (!["client", "client_contact"].includes(fieldName)) {
    emit("save");
  }
}

/**
 * Busca personas en el servidor cuando el usuario escribe
 */
function searchForPeople(fieldName) {
  // debounce = espera 300ms después de que el usuario deje de escribir
  return debounce(async (inputEvent) => {
    const textToSearch = inputEvent.target.value.trim();

    // Si no hay texto, no buscar nada
    if (textToSearch === "") {
      searchResults.value[fieldName] = [];
      return;
    }

    try {
      // Mostrar que estamos cargando
      searchLoading.value[fieldName] = true;

      // Buscar en el servidor
      const foundUsers = await userStore.findByUsersByNameOrEmail(
        true,
        true,
        textToSearch,
        {
          archived: true,
          onlyContacts: true,
        },
      );

      // Convertir los resultados al formato que necesitamos
      if (foundUsers && foundUsers.length > 0) {
        searchResults.value[fieldName] = convertUserListForSearch(foundUsers);
      } else {
        searchResults.value[fieldName] = [];
      }
    } catch (error) {
      console.error(`Error buscando en el campo ${fieldName}:`, error);
      searchResults.value[fieldName] = [];
    } finally {
      // Ocultar el loading
      searchLoading.value[fieldName] = false;
    }
  }, 300); // Esperar 300ms
}

// Crear una función de búsqueda para cada campo
const searchFunctions = {
  client: searchForPeople("client"),
  agency: searchForPeople("agency"),
  production_director: searchForPeople("production_director"),
  executive_producer: searchForPeople("executive_producer"),
  director: searchForPeople("director"),
  client_contact: searchForPeople("client_contact"),
  creative_director: searchForPeople("creative_director"),
  account_director: searchForPeople("account_director"),
  agency_producer: searchForPeople("agency_producer"),
};

// MANEJAR SELECCIÓN DE OPCIONES

/**
 * Actualiza la información en el servidor para algunos campos especiales
 */
async function updateServerData(fieldName, selectedOption) {
  // Solo algunos campos necesitan actualizar el servidor inmediatamente (client, client_contact)
  if (fieldName !== "client" && fieldName !== "client_contact") {
    return; // No hacer nada para otros campos
  }

  try {
    if (fieldName === "client") {
      // Actualizar cliente
      incomesStore.income.client =
        createContactFromSelectionServer(selectedOption);
    } else if (fieldName === "client_contact") {
      // Actualizar contacto del cliente
      incomesStore.income.contact =
        createContactFromSelectionServer(selectedOption);
    }

    await incomesStore.saveAmfiInformation();
  } catch (error) {
    console.error(`Error actualizando ${fieldName} en el servidor:`, error);
  }
}

/**
 * Cuando el usuario selecciona una opción de la lista de búsqueda
 */
async function onOptionSelected(selectedOption, fieldName) {
  // Actualizar nuestro formulario local
  form.value[fieldName] = createContactFromSelection(selectedOption);

  // Actualizar el servidor si es necesario
  await updateServerData(fieldName, selectedOption);

  saveFormToStore();
  // Si no es client o client_contact no guardamos
  if (!["client", "client_contact"].includes(fieldName)) {
    emit("save");
  }
}

// CARGAR DATOS INICIALES

/**
 * Carga los datos cuando se abre el componente por primera vez
 */
function loadInitialFormData() {
  //   // Inicializar el formulario con los datos del income actual
  //    const isEqualIncomesInformationFormStore = isEqual(incomesStore.informationForm, incomesStore.income.informationForm)

  //   // // Si no son iguales, usamos los datos del income actual de la BD
  //    if (!isEqualIncomesInformationFormStore) {
  //     incomesStore.informationForm = incomesStore.income.informationForm;
  //  }

  // Verificar si ya hay datos guardados en el store
  const savedData = incomesStore.informationForm.amfi.projectInformation;

  if (savedData && Object.keys(savedData).length > 0) {
    // Cargar todos los campos EXCEPTO client y client_contact
    // (estos se cargan automáticamente desde el income)
    const fieldsToRestore = [
      "agency",
      "product",
      "validity",
      "production_director",
      "executive_producer",
      "director",
      "creative_director",
      "account_director",
      "agency_producer",
    ];

    fieldsToRestore.forEach((fieldName) => {
      if (savedData[fieldName]) {
        form.value[fieldName] = savedData[fieldName];

        // Si tiene un nombre, también restaurar la búsqueda
        if (savedData[fieldName]?.data?.legalName) {
          searches.value[fieldName] = savedData[fieldName].data.legalName;
        }
      }
    });
  }

  // Guardar el estado actual
  saveFormToStore();
}

// CICLO DE VIDA

onMounted(() => {
  loadInitialFormData();
});

// OBSERVADORES (WATCHERS)

/**
 * Observa cambios en el income actual y actualiza cliente y contacto
 */
watch(
  () => incomesStore.income,
  (newIncome, oldIncome) => {
    // Si no hay información (ej. store limpiándose), no hacer nada
    // if (!newIncome || !newIncome._id) return;
    // si no hay cambios, no hacer nada
    console.log("newIncome", newIncome);
    console.log("oldIncome", oldIncome);
    // if (isEqual(newIncome, oldIncome)) return;

    // Función auxiliar para crear objetos de contacto desde el income
    function createContactFromIncome(contactType) {
      const contact = newIncome[contactType];
      if (!contact || !contact.contact) return null;

      return {
        _id: contact.contact._id || contact.contact || "",
        data: { legalName: contact.data?.legalName || "" },
        email: contact.email || "",
        imgUrl: contact.imgUrl || "",
      };
    }

    // Actualizar los campos del formulario
    form.value.client = createContactFromIncome("client");
    form.value.client_contact = createContactFromIncome("contact");

    // Actualizar también lo que se muestra en los campos de búsqueda
    searches.value.client = newIncome.client?.data?.legalName || "";
    searches.value.client_contact = newIncome.contact?.data?.legalName || "";
  },
  {
    immediate: true,
    deep: true,
  },
);
</script>

<template>
  <div class="container">
    <div class="header">
      <div class="header__title">
        <span>{{ t(`${moduleNav}.nav.nav1`) }}</span>
        <p>
          {{ t(`${module}.description`) }}
        </p>
      </div>
    </div>

    <!-- ===== FORMULARIO ===== -->
    <div class="body">
      <div class="row">
        <div class="column">
          <div class="itemInput">
            <span class="labelText">{{
              t(`${module}.inputs.client.label`)
            }}</span>
            <u-search-by-type
              class="input1 inputsInfoProject"
              v-model="searches.client"
              :create="true"
              :update="true"
              :avatar="true"
              :snippet="true"
              :options="searchResults.client"
              :img="form.client?.imgUrl"
              :loading="searchLoading.client"
              :disabled="false"
              :types="typesUser"
              icon="user"
              :placeholder="t(`${module}.inputs.client.placeholder`)"
              :iconSelect="null"
              size="s"
              style="width: 100%"
              @updatedTypeOp="getIconByType"
              @newOption="newOption('client')"
              @selectedOption="onOptionSelected($event, 'client')"
              @cleanInput="() => clearSearch('client')"
              @input="searchFunctions.client($event)"
            />
          </div>

          <div class="itemInput">
            <span class="labelText">{{
              t(`${module}.inputs.agency.label`)
            }}</span>
            <u-search-by-type
              class="input1 inputsInfoProject"
              v-model="searches.agency"
              :create="true"
              :update="true"
              :avatar="true"
              :snippet="true"
              :options="searchResults.agency"
              :img="form.agency?.imgUrl"
              :loading="searchLoading.agency"
              :disabled="false"
              :types="typesUser"
              icon="user"
              :placeholder="t(`${module}.inputs.agency.placeholder`)"
              :iconSelect="null"
              size="s"
              style="width: 100%"
              @updatedTypeOp="getIconByType"
              @newOption="newOption('agency')"
              @selectedOption="onOptionSelected($event, 'agency')"
              @cleanInput="() => clearSearch('agency')"
              @input="searchFunctions.agency($event)"
            />
          </div>
        </div>

        <div class="column">
          <div class="itemInput">
            <span class="labelText">{{
              t(`${module}.inputs.product.label`)
            }}</span>
            <u-input
              v-model="form.product"
              class="input1 inputsInfoProject"
              :placeholder="t(`${module}.inputs.product.placeholder`)"
              size="s"
              @change="emit('save')"
              @input="saveFormToStore"
            />
          </div>

          <div class="itemInput">
            <span class="labelText">{{
              t(`${module}.inputs.validity.label`)
            }}</span>
            <u-input
              v-model="form.validity"
              class="input1 inputsInfoProject"
              :placeholder="t(`${module}.inputs.validity.placeholder`)"
              size="s"
              @change="emit('save')"
              @input="saveFormToStore"
            />
          </div>
        </div>
      </div>

      <div class="row">
        <div class="column">
          <div class="itemInput2">
            <span class="labelText labelWide">{{
              t(`${module}.inputs.productionDirector.label`)
            }}</span>
            <u-search-by-type
              class="input1 inputsInfoProject"
              v-model="searches.production_director"
              :create="true"
              :update="true"
              :avatar="true"
              :snippet="true"
              :options="searchResults.production_director"
              :img="form.production_director?.imgUrl"
              :loading="searchLoading.production_director"
              :disabled="false"
              :types="typesUser"
              icon="user"
              :placeholder="
                t(`${module}.inputs.productionDirector.placeholder`)
              "
              :iconSelect="null"
              size="s"
              style="width: 100%"
              @updatedTypeOp="getIconByType"
              @newOption="newOption('production_director')"
              @selectedOption="onOptionSelected($event, 'production_director')"
              @cleanInput="() => clearSearch('production_director')"
              @input="searchFunctions.production_director($event)"
            />
          </div>

          <div class="itemInput2">
            <span class="labelText labelWide">{{
              t(`${module}.inputs.executiveProducer.label`)
            }}</span>
            <u-search-by-type
              class="input1 inputsInfoProject"
              v-model="searches.executive_producer"
              :create="true"
              :update="true"
              :avatar="true"
              :snippet="true"
              :options="searchResults.executive_producer"
              :img="form.executive_producer?.imgUrl"
              :loading="searchLoading.executive_producer"
              :disabled="false"
              :types="typesUser"
              icon="user"
              :placeholder="t(`${module}.inputs.executiveProducer.placeholder`)"
              :iconSelect="null"
              size="s"
              style="width: 100%"
              @updatedTypeOp="getIconByType"
              @newOption="newOption('executive_producer')"
              @selectedOption="onOptionSelected($event, 'executive_producer')"
              @cleanInput="() => clearSearch('executive_producer')"
              @input="searchFunctions.executive_producer($event)"
            />
          </div>

          <div class="itemInput2">
            <span class="labelText labelWide">{{
              t(`${module}.inputs.director.label`)
            }}</span>
            <u-search-by-type
              class="input1 inputsInfoProject"
              v-model="searches.director"
              :create="true"
              :update="true"
              :avatar="true"
              :snippet="true"
              :options="searchResults.director"
              :img="form.director?.imgUrl"
              :loading="searchLoading.director"
              :disabled="false"
              :types="typesUser"
              icon="user"
              :placeholder="t(`${module}.inputs.director.placeholder`)"
              :iconSelect="null"
              size="s"
              style="width: 100%"
              @updatedTypeOp="getIconByType"
              @newOption="newOption('director')"
              @selectedOption="onOptionSelected($event, 'director')"
              @cleanInput="() => clearSearch('director')"
              @input="searchFunctions.director($event)"
            />
          </div>
        </div>

        <!-- Columna derecha -->
        <div class="column">
          <div class="itemInput2">
            <span class="labelText labelWide">{{
              t(`${module}.inputs.clientContact.label`)
            }}</span>
            <u-search-by-type
              class="input1 inputsInfoProject"
              v-model="searches.client_contact"
              :create="true"
              :update="true"
              :avatar="true"
              :snippet="true"
              :img="form.client_contact?.imgUrl"
              :options="searchResults.client_contact"
              :loading="searchLoading.client_contact"
              :disabled="false"
              :types="typesUser"
              icon="user"
              :placeholder="t(`${module}.inputs.clientContact.placeholder`)"
              :iconSelect="null"
              size="s"
              style="width: 100%"
              @updatedTypeOp="getIconByType"
              @newOption="newOption('client_contact')"
              @selectedOption="onOptionSelected($event, 'client_contact')"
              @cleanInput="() => clearSearch('client_contact')"
              @input="searchFunctions.client_contact($event)"
            />
          </div>

          <div class="itemInput2">
            <span class="labelText labelWide">{{
              t(`${module}.inputs.creativeDirector.label`)
            }}</span>
            <u-search-by-type
              class="input1 inputsInfoProject"
              v-model="searches.creative_director"
              :create="true"
              :update="true"
              :avatar="true"
              :snippet="true"
              :options="searchResults.creative_director"
              :img="form.creative_director?.imgUrl"
              :loading="searchLoading.creative_director"
              :disabled="false"
              :types="typesUser"
              icon="user"
              :placeholder="t(`${module}.inputs.creativeDirector.placeholder`)"
              :iconSelect="null"
              size="s"
              style="width: 100%"
              @updatedTypeOp="getIconByType"
              @newOption="newOption('creative_director')"
              @selectedOption="onOptionSelected($event, 'creative_director')"
              @cleanInput="() => clearSearch('creative_director')"
              @input="searchFunctions.creative_director($event)"
            />
          </div>

          <div class="itemInput2">
            <span class="labelText labelWide">{{
              t(`${module}.inputs.accountDirector.label`)
            }}</span>
            <u-search-by-type
              class="input1 inputsInfoProject"
              v-model="searches.account_director"
              :create="true"
              :update="true"
              :avatar="true"
              :snippet="true"
              :options="searchResults.account_director"
              :img="form.account_director?.imgUrl"
              :loading="searchLoading.account_director"
              :disabled="false"
              :types="typesUser"
              icon="user"
              :placeholder="t(`${module}.inputs.accountDirector.placeholder`)"
              :iconSelect="null"
              size="s"
              style="width: 100%"
              @updatedTypeOp="getIconByType"
              @newOption="newOption('account_director')"
              @selectedOption="onOptionSelected($event, 'account_director')"
              @cleanInput="() => clearSearch('account_director')"
              @input="searchFunctions.account_director($event)"
            />
          </div>

          <div class="itemInput2">
            <span class="labelText labelWide">{{
              t(`${module}.inputs.agencyProducer.label`)
            }}</span>
            <u-search-by-type
              class="input1 inputsInfoProject"
              v-model="searches.agency_producer"
              :create="true"
              :update="true"
              :avatar="true"
              :snippet="true"
              :options="searchResults.agency_producer"
              :img="form.agency_producer?.imgUrl"
              :loading="searchLoading.agency_producer"
              :disabled="false"
              :types="typesUser"
              icon="user"
              :placeholder="t(`${module}.inputs.agencyProducer.placeholder`)"
              :iconSelect="null"
              size="s"
              style="width: 100%"
              @updatedTypeOp="getIconByType"
              @newOption="newOption('agency_producer')"
              @selectedOption="onOptionSelected($event, 'agency_producer')"
              @cleanInput="() => clearSearch('agency_producer')"
              @input="searchFunctions.agency_producer($event)"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.container {
  display: grid;
  grid-template-rows: 66px 1fr;
  width: 100%;
  height: 100%;
  gap: 24px;
}

.header {
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  gap: 12px;
}

.header__title {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.header span:first-child {
  font-size: 24px;
  font-weight: 600;
  line-height: 36px;
  color: var(--neutral-text-body);
}

.header p {
  color: var(--neutral-text-caption);
  font-size: 14px;
  font-weight: 400;
  line-height: 18px;
}

.body {
  display: flex;
  flex-direction: column;
  width: 100%;
  gap: 48px;
}

.row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 64px;
  border: 1px solid var(--neutral-border-subtle);
  padding: 12px;
  border-radius: 16px;
  height: auto;
}

.column {
  display: flex;
  flex-direction: column;
  height: auto;
  width: 100%;
  gap: 10px;
}

.itemInput {
  display: flex;
  flex-direction: row;
  gap: 10px;
  width: 100%;
}

.itemInput .labelText {
  display: flex;
  align-items: center;
  width: 80px;
  color: var(--neutral-text-body);
  font-size: 14px;
  font-weight: 600;
  line-height: 18px;
  text-align: left;
}

.itemInput .input1 {
  width: 100%;
}

.itemInput2 {
  display: flex;
  flex-direction: row;
  gap: 12px;
  width: 100%;
}

.itemInput2 .labelText {
  display: flex;
  align-items: center;
  width: 200px;
  color: var(--neutral-text-body);
  font-size: 14px;
  font-weight: 600;
  line-height: 18px;
  text-align: left;
}

/* Estilos para los inputs del proyecto */
::v-deep(.inputsInfoProject) {
  border: none !important;
  width: 100%;
  background-color: var(--neutral-background-darker);
}

::v-deep(.inputsInfoProject:hover) {
  background-color: var(--success-surface-shadow-8a);
}

::v-deep(.inputsInfoProject:hover:not(:focus)) {
  border: none !important;
}

::v-deep(.inputsInfoProject:focus) {
  background-color: var(--success-surface-shadow-8a);
}

::v-deep(.inputsInfoProject:active) {
  background-color: var(--neutral-background-darker);
}

::v-deep(.input-empty) {
  background-color: var(--neutral-surface-shadow-8a);
}
</style>
