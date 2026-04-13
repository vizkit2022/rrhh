<script setup>
import { ref, watch, computed, onMounted } from "vue";
import useGlobalStore from "@/stores/global";
import useOutcomesStore from "@/stores/outcomes";
import useUserStore from "@/stores/user";
import useOrganizationStore from "@/stores/organization";
import useContactStore from "@/stores/contacts";
import labels from "@/utils/labels/common.json";
import { regexEmail, capitalizeName } from "@/utils/helpers";
const { t } = useI18n();
// EventBus
const { $bus } = useNuxtApp();
$bus.$emit("updateDimensions", { width: "800px", height: "90vh" });
// Stores
const globalStore = useGlobalStore();
const userStore = useUserStore();
const outcomesStore = useOutcomesStore();
const contactStore = useContactStore();
const organizationStore = useOrganizationStore();

const currencyDefault = ref(organizationStore.organization.currency);
// Constants
const mode = ref("waiting"); // Estados posibles: 'waiting', 'creating', 'building'
const step1 = labels.modal.createOc.step1;
const search = ref("");
const results = ref([]);
const loadingSearch = ref(false);
const errors = ref({});
const msg = ref({});
const loadingEmail = ref(false);
const oldUserByEmail = ref({});
const showMenuOldUserByEmail = ref(false);
const userEmail = ref(false);
const disabledEmail = ref(false);
const supplierSelected = ref(false);
const defaultType = {
  es: {
    business: "Empresa",
    personal: "Persona",
  },
  en: {
    business: "Company",
    personal: "Personal",
  },
};
const typesUser = [
  { name: { es: "Empresa", en: "Business" }, value: "business" },
  { name: { es: "Persona", en: "Personal" }, value: "personal" },
];
const changeLabelsByType = ref("business");

// Watch
watch(ref(search), async (newValue) => {
  if (newValue !== "") {
    loadingSearch.value = true;
    const resp = await userStore.findByUsersByNameOrEmail(
      true,
      true,
      newValue,
      { archived: true, onlyContacts: true }
    );
    if (resp && resp.length) {
      results.value = mapperSearchResultUsers(resp);
    } else {
      results.value = [];
    }
    loadingSearch.value = false;
  }
});

// Actions
const mapperSearchResultUsers = (list) => {
  return list.map((item) => {
    return {
      label: item?.data?.legalName || "-",
      text: item?.email || "-",
      img: item?.imgUrl ?? null,
      oldData: { ...item },
    };
  });
};

const changeSupplier = () => {
  // Reset the supplier information
  outcomesStore.formOc.supplier = {
    contact: null,
    isContact: false,
    email: "",
    data: {
      legalName: "",
      typeName: "personal",
      icon: "",
      nickName: "",
      giro: "",
      idNumber: "",
      address: "",
    },
    payment: {
      currency: "",
      document: "",
      condition: "",
      type: "",
    },
  };

  supplierSelected.value = false; // Set to false to show the search component
  search.value = ""; // Clear the search input
  mode.value = "waiting";
};

const createSupplier = () => {
  outcomesStore.formOc.supplier = {
    email: "",
    data: {
      legalName: search.value,
      typeName:
        defaultType[globalStore.lang][
          getIconForm.value === "building" ? "business" : "personal"
        ],
      icon: "",
      nickName: "",
    },
    payment: {
      currency: "",
      document: "",
      condition: "",
      type: "",
    },
  };

  showContact(null);
  disabledEmail.value = false;
  supplierSelected.value = true;
  setTimeout(() => {
    userStore.dataSheet.data.data.legalName = search.value;
    userStore.dataSheet.data.data.type = TypeTemp.value;
    userStore.dataSheet.data.data.typeName = t(
      "contact.typeName." + TypeTemp.value
    );

    search.value = "";
  }, 10);
};

const newContactMapperToDocument = (contact) => {
  console.log("Seleccionado", contact);

  const newContact = {
    _id: contact?._id || null,
    isUser: contact?.isUser || null,
    imgUrl: contact?.imgUrl || null,
    data: {
      type: contact?.data?.type || null,
      legalName: contact?.data?.legalName || null,
      idNumber: contact?.data?.idNumber || null,
      nickName: contact?.data?.nickName || null,
      address: contact?.data?.address || null,
    },
    payment: {
      document: contact?.payment?.document || null,
      condition: contact?.payment?.condition || null,
      documentName: contact?.payment?.documentName || null,
    },
    email: contact?.email || null,
  };

  if (!contact?.contact) {
    // caso cuando no es contact pero si user
    newContact.user = { _id: contact?._id };
    delete newContact._id;
  }

  return newContact;
};

const selectedSupplier = async (obj) => {
  outcomesStore.formOc.supplier = newContactMapperToDocument(obj.oldData);

  if (outcomesStore.formOc.type === "FXR") {
    delete outcomesStore.formOc.supplier?.payment?.document;
  } else if (outcomesStore.formOc?.supplier) {
    handleChangeDocument(
      outcomesStore?.formOc?.supplier?.payment?.document?._id ||
        outcomesStore?.formOc?.supplier?.payment?.document
    );

    const document = outcomesStore.documentTypes.find(
      (type) => type._id === outcomesStore.formOc.supplier.payment.document
    );

    if (document) {
      outcomesStore.formOc.supplier.payment.documentName = document.name;
    }
  }

  selectTypeForm();

  search.value = "";
  disabledEmail.value = obj.id && obj.user;
  supplierSelected.value = true;
  mode.value = "building";
};

// Valid form
const checkSupplierData = computed(() => {
  if (errors.value.email) {
    return false;
  } else {
    const supplier = outcomesStore.formOc.supplier;
    console.log("supplier", supplier);
    return supplier?.data?.legalName?.trim() !== "";
  }
});

const checkDocumentedData = computed(() => {
  const isOc = outcomesStore?.formOc?.type === "OC";

  const getTrimmedValue = (value) => (value ? value.trim() : "");

  return (
    (!isOc ||
      getTrimmedValue(outcomesStore?.formOc?.supplier?.payment?.document) !==
        "") &&
    getTrimmedValue(outcomesStore?.formOc?.supplier?.payment?.condition) !== ""
  );
});

//Modular
const showContact = (id) => {
  console.log("showContact ID: ", id);
  //apertura
  userStore.userDataSheetId = id || null;
  userStore.showModalDataSheet = true;
  userStore.showBtnBack = true;
  //levantamiento escucha
  console.log("Encendiendo Escucha Al hacer click");
  $bus.$on("receiveContact", (receiveContact) => {
    console.log("receiveContact", receiveContact);
    outcomesStore.formOc.supplier._id = receiveContact._id;
    outcomesStore.formOc.supplier.data.legalName =
      receiveContact.data.legalName;
    outcomesStore.formOc.supplier.data.nickName = receiveContact.data.nickName;
    outcomesStore.formOc.supplier.email = receiveContact.email;
    outcomesStore.formOc.supplier.imgUrl = receiveContact.imgUrl;

    if (outcomesStore?.formOc?.type === "OC") {
      handleChangeDocument(
        receiveContact?.payment?.document?._id ||
          receiveContact.payment.document
      );
    }
    mode.value = "building";
  });
};

const handleChangeDocument = async (documentId, changeTaxDefault = true) => {
  try {
    console.log(`handleChangeDocument`);
    // Asignar el ID del documento al pago del proveedor
    outcomesStore.formOc.supplier.payment.document = documentId;

    // Buscar el tipo de documento en outcomesStore.documentTypes donde id === documentId
    const resp = outcomesStore.documentTypes.find(
      (dt) => dt._id === documentId
    );

    if (!resp) {
      console.warn(`Tipo de documento con ID ${documentId} no encontrado.`);
      outcomesStore.formOc.supplier.payment.document = "";
      outcomesStore.formOc.supplier.payment.documentName = "";
      return;
    }

    // Asignar el tipo de documento obtenido a toDocument
    outcomesStore.formOc.documentType = resp._id;

    // Asignar los impuestos obtenidos al store
    outcomesStore.taxes = resp.taxes;
    outcomesStore.formOc.taxes = resp.taxes;
    outcomesStore.formOc.taxDefault = resp.taxDefault;
    outcomesStore.formOc.supplier.payment.documentName = resp.name;
  } catch (error) {
    console.warn("Error en handleChangeDocument:", error);
    // Opcional: Manejo adicional de errores, como notificaciones al usuario
  }
};

// Event Email
let timeoutId;

const handleNext = () => {
  if (mode.value === "creating") {
    mode.value = "building";
  } else if (mode.value === "building") {
    $bus.$emit("updatedStep", true);
  }
};

const handleEmail = async () => {
  clearTimeout(timeoutId);
  loadingEmail.value = false;
  errors.value.email = false;
  userEmail.value = false;
  if (outcomesStore.formOc.isContact) {
    errors.value.email = false;
  } else {
    const email = outcomesStore.formOc.supplier.email;
    if (email !== "") {
      if (!regexEmail(email)) {
        msg.value.email = "Formato no válido.";
        errors.value.email = true;
      } else {
        timeoutId = setTimeout(async () => {
          loadingEmail.value = true;
          const usedUser = await contactStore.mailInUse(email);
          loadingEmail.value = false;
          if (usedUser._id) {
            msg.value.email =
              globalStore.lang === "es"
                ? "Este Email ya esta en uso."
                : "This Email is already in use.";
            errors.value.email = true;
            userEmail.value = true;
            oldUserByEmail.value = usedUser;
          } else {
            msg.value.email = "";
            errors.value.email = false;
          }
        }, 0);
      }
    }
  }
};
const useUserFoundByMail = () => {
  outcomesStore.formOc.supplier = oldUserByEmail.value;

  if (!outcomesStore.formOc.supplier.hasOwnProperty("data")) {
    outcomesStore.formOc.supplier.data = {};
  }
  outcomesStore.formOc.supplier.data.nickName ??= null;

  if (!outcomesStore.formOc.supplier.hasOwnProperty("payment")) {
    outcomesStore.formOc.supplier.payment = {};
  }

  outcomesStore.formOc.supplier.payment.condition ??= null;
  outcomesStore.formOc.supplier.payment.document ??= null;

  outcomesStore.formOc.supplier.user = {
    _id: outcomesStore.formOc.supplier._id,
  };
  delete outcomesStore.formOc.supplier._id;

  showMenuOldUserByEmail.value = false;
  errors.value.email = false;
  msg.value.email = "";
  disabledEmail.value = true;
};

// Mounted
onMounted(() => {
  document.addEventListener("click", (event) => {
    if (
      event.target !== document.querySelector(".minMenu") &&
      !event.target.closest(".btnEmail")
    ) {
      showMenuOldUserByEmail.value = false;
    }
  });
});

// Functions
const getLabel = (prop) => {
  return changeLabelsByType.value === "personal" ? `${prop}User` : prop;
};
const selectTypeForm = () => {
  changeLabelsByType.value = outcomesStore.formOc.supplier.data.type;

  if (outcomesStore.formOc.supplier.contact === null) handleEmail();
};

const TypeTemp = ref("personal");

const updatedTypeOp = (type) => {
  const types = {
    business: "building",
    personal: "user",
  };
  outcomesStore.formOc.supplier.data.icon = types[type] || "building";
  outcomesStore.formOc.supplier.data.type = type;
  TypeTemp.value = type;
};

const conditionOfPayOptions = computed(() => {
  const conditions = {
    es: [{ label: "Al día" }, { label: "30 días" }, { label: "60 días" }],
    en: [{ label: "Daily" }, { label: "30 days" }, { label: "60 days" }],
  };
  return conditions[globalStore.lang];
});

const getIconForm = computed(() => {
  const types = {
    business: "building",
    personal: "user",
  };
  return types[outcomesStore.formOc.supplier.data.type] || "building";
});
</script>

<template>
  <div class="containerModal">
    <div class="containerModal__header">
      <span>
        {{
          $t(
            "modules.outcomes.pages.outcome.tabs.tab1.modals.create.step1.title.text1"
          ) +
          " " +
          outcomesStore.formOc.nametype +
          " - " +
          $t(
            "modules.outcomes.pages.outcome.tabs.tab1.modals.create.step1.title.text2"
          )
        }}
      </span>

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
      <div class="container_header">
        <!-- u-avatar siempre presente -->
        <u-avatar
          :user="{
            src:
              mode !== 'waiting'
                ? outcomesStore.formOc.supplier.imgUrl || ''
                : '',
          }"
          :size="82"
        />
        <!-- Contenido condicional al lado del avatar -->
        <div v-if="mode === 'waiting'" class="container_search header_content">
          <u-search-by-type
            v-model="search"
            size="m"
            :placeholder="$t('CreateOC.search.placeholder')"
            :options="results"
            :loading="loadingSearch"
            :showSearchIcon="true"
            :avatar="true"
            :create="true"
            :updated="false"
            :snippet="true"
            :iconSelect="null"
            :types="typesUser"
            @updatedTypeOp="updatedTypeOp"
            @newOption="createSupplier"
            @cleanInput="search.value = ''"
            @selectedOption="selectedSupplier"
          />
        </div>
        <div v-else class="container_provedor_selected header_content">
          <!-- Información del proveedor -->
          <div class="supplier_info">
            <span class="legal-name">
              {{ outcomesStore.formOc.supplier.data.legalName || "-" }}
              <template v-if="outcomesStore.formOc.supplier.isContact">
                <img
                  src="/img/TempMiguelPendienteAMigrar/verified.svg"
                  alt="Verified"
                  class="verified-icon"
                />
              </template>
            </span>
            <span class="nickName">
              {{ outcomesStore.formOc.supplier.data.nickName || "-" }}
            </span>
            <span class="address">
              {{ outcomesStore.formOc.supplier.email || "-" }}
            </span>
          </div>
          <!-- Botones -->
          <div class="buttons">
            <u-button
              size="s"
              icon="change"
              :text="'Cambiar'"
              type="outlined"
              @click="changeSupplier"
            />
            <u-button-icon
              class="btnFloat"
              v-if="mode !== 'creating'"
              size="s"
              icon="edit"
              @click="showContact(outcomesStore?.formOc?.supplier?._id || null)"
            />
          </div>
        </div>
      </div>
      <!-- Aqui comienzan los formularios -->
      <div v-if="mode === 'creating'" class="container__form supplier_info">
        <span>{{ "Información General " }}</span>
        <div class="group">
          <label
            ><span class="icon u u-invoice"></span>
            {{ $t("CreateOC.step1.name.label") }}
          </label>

          <u-input
            v-model="outcomesStore.formOc.supplier.data.legalName"
            :placeholder="$t('CreateOC.step1.name.placeholder')"
            @input="
              outcomesStore.formOc.supplier.data.legalName = capitalizeName(
                outcomesStore.formOc.supplier.data.legalName
              )
            "
          />
        </div>
        <div class="group">
          <label
            ><span class="icon u u-id"></span>
            {{ $t("CreateOC.step1.alias.label") }}
          </label>

          <u-input
            v-model="outcomesStore.formOc.supplier.data.nickName"
            :placeholder="$t('CreateOC.step1.alias.placeholder')"
            @input="
              outcomesStore.formOc.supplier.data.nickName = capitalizeName(
                outcomesStore.formOc.supplier.data.nickName
              )
            "
          />
        </div>
        <div class="group">
          <label>
            <span class="icon u u-email"></span>
            {{ $t("CreateOC.step1.email.label") }}
            <div v-if="errors.email" class="errorMsg">
              <span v-text="msg.email"></span>
              <button
                v-if="userEmail"
                class="u u-info-circle"
                title="Ver quien lo usa"
                @mouseover="showMenuOldUserByEmail = true"
              ></button>
              <div
                class="minMenu"
                :style="`transform: scale(${showMenuOldUserByEmail ? 1 : 0});`"
              >
                <span>
                  <strong>{{ oldUserByEmail?.data?.legalName ?? "" }}</strong> -
                  {{ oldUserByEmail?.email ?? "" }}
                </span>
                <button @click="useUserFoundByMail" class="btnEmail">
                  {{ $t("global.text.useMailMessage") }}
                </button>
              </div>
            </div>
            <div v-if="loadingEmail" class="loadMsg">
              <u-loading :width="12" />
              {{ $t("global.text.verificationMessage") }}
            </div>
          </label>
          <u-input
            :error="errors.email"
            v-model="outcomesStore.formOc.supplier.email"
            placeholder="correo@ejemplo.com"
            :disabled="disabledEmail"
            @input="handleEmail($event)"
          />
        </div>
        <div class="group">
          <label
            ><span class="icon u u-open-book"></span>
            {{ step1.inputs[getLabel("giro")].label[globalStore.lang] }}
          </label>

          <u-input
            v-model="outcomesStore.formOc.supplier.data.giro"
            :placeholder="
              step1.inputs[getLabel('giro')].placeholder[globalStore.lang]
            "
          />
        </div>
        <div class="group">
          <label
            ><span class="icon u u-id"></span>
            {{ step1.inputs.rut.label[globalStore.lang] }}
          </label>

          <u-input
            v-model="outcomesStore.formOc.supplier.data.idNumber"
            :placeholder="
              step1.inputs[getLabel('rut')].placeholder[globalStore.lang]
            "
          />
        </div>
        <div class="group">
          <label
            ><span class="icon u u-phone"></span>
            {{ $t("CreateOC.step1.Telefono.label") }}
          </label>

          <u-input
            v-model="outcomesStore.formOc.supplier.data.phone"
            :placeholder="$t('CreateOC.step1.Telefono.placeholder')"
          />
        </div>
      </div>
      <div v-if="mode === 'building'" class="container__form outcomes_info">
        <span>{{ "Datos de la Compra" }}</span>

        <div class="group" v-if="outcomesStore.formOc.type != 'FXR'">
          <label>
            <span class="icon u u-invoice"></span>
            {{ "Tipo de Documento" }}
          </label>
          <u-select
            v-model="outcomesStore.formOc.supplier.payment.documentName"
            :options="outcomesStore.documentTypes"
            :placeholder="step1.inputs.doc.placeholder[globalStore.lang]"
            :top="false"
            :full-data="true"
            @full-data="
              (data) => {
                handleChangeDocument(data._id);
              }
            "
          />
        </div>
        <div class="group">
          <label>
            <span class="icon u u-open-book"></span>
            {{ "Condiciones de Pago" }}
          </label>
          <u-select
            v-model="outcomesStore.formOc.supplier.payment.condition"
            :options="conditionOfPayOptions"
            :top="false"
            :placeholder="step1.inputs.termsPay.placeholder[globalStore.lang]"
          />
        </div>
        <div class="group" v-if="false">
          <label>
            <span class="icon u u-user"></span>
            {{ "Contacto" }}
          </label>
          <u-select
            :disabled="true"
            v-model="outcomesStore.formOc.contact"
            :options="[]"
            :top="false"
            :placeholder="'contacto'"
          />
        </div>
        <div class="group">
          <label>
            <span class="icon u u-edit"></span>
            {{ $t("global.text.reference") }}
          </label>
          <u-input
            v-model="outcomesStore.formOc.reference"
            :placeholder="'Ingresa una referencia sobre la orden de compra'"
          />
        </div>

        <div class="group">
          <label>
            <span class="icon u u-info-bubble"></span>
            {{ "Observaciones" }}
          </label>
          <u-textarea
            style="height: 100px"
            v-model="outcomesStore.formOc.observation"
            size="xl"
            :top="true"
            :placeholder="'Ingresa las observaciones de la orden de compra'"
          />
        </div>
      </div>
    </div>
    <div class="containerModal__footer">
      <u-button
        :text="labels.modal.createOc.step1.buttons.cancel[globalStore.lang]"
        type="outlined"
        class="mainBtnModify"
        @click="
          $bus.$emit('closeDialog');
          $bus.$off('closeDialog');
        "
      />
      <u-button
        :text="labels.modal.createOc.step1.buttons.next[globalStore.lang]"
        class="mainBtnModify"
        @click="handleNext"
        :disabled="
          mode === 'waiting' || (mode === 'building' && !checkDocumentedData)
        "
      />
    </div>
  </div>
</template>

<style scoped>
.containerModal span,
.containerModal label,
.containerModal button {
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
  overflow-y: auto;
  padding: 0 5px 2px 0;
}

.containerModal__footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.containerModal__content::-webkit-scrollbar {
  width: 8px;
  background: var(--neutral-surface-light);
  border-radius: 20px;
}

.containerModal__content::-webkit-scrollbar-thumb {
  background: var(--neutral-surface-subtle);
  border-radius: 5px;
}

/* Sections */
.containerModal__search {
  display: grid;
  grid-template-columns: 1fr;
  column-gap: 48px;
  row-gap: 16px;
}

.container__form {
  display: grid;
  gap: 18px;
}

.container__form > span {
  font-size: 16px;
  font-weight: 600;
  line-height: 20px;
  text-align: left;
  color: var(--neutral-text-body);
}

.container__form .second {
  border-radius: 0 0 10px 10px;
}

.container__form .group {
  display: grid;
  grid-template-columns: 1fr 3fr;
  align-items: none;
  gap: 8px;
}

.container__form .search {
  display: grid;
  align-items: center;
}

.container__form .group label {
  display: flex;
  font-size: 14px;
  font-weight: 600;
  color: var(--neutral-text-caption);
  padding-top: 9px;
}

.container__form .group .icon {
  margin-right: 8px;
  font-size: 16px;
}

.container__form .group span.optional {
  font-size: 12px;
  font-weight: 600;
  line-height: 16px;
  color: var(--neutral-text-caption);
}

.containerModal__content-title {
  width: 100%;
  height: 32px;
  background-color: var(--neutral-surface-light);
  padding: 0 24px;
  display: flex;
  align-items: center;
}

.containerModal__content-title span {
  font-size: 12px;
  font-weight: 600;
  line-height: 16px;
  color: var(--neutral-text-body);
}

.contentLabel {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.loadMsg {
  color: var(--neutral-surface-subtle);
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 5px;
  position: absolute;
  right: 68px;
  z-index: 1;
}

.errorMsg {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 10px;
  position: absolute;
  right: 68px;
  z-index: 1;
}

.errorMsg span,
.errorMsg button {
  color: var(--danger-surface-darker);
}

.errorMsg .u {
  animation: pulse ease-in-out 1s infinite;
  border-radius: 50%;
}

.minMenu {
  position: absolute;
  transition: 0.3s;
  transform-origin: center right;
  background-color: var(--neutral-background-default);
  padding: 16px 20px;
  border-radius: 10px;
  box-shadow: var(--shadow-2);
  z-index: 2;
  display: grid;
  grid-template-rows: auto auto;
  gap: 10px;
  max-width: 280px;
}

.minMenu span {
  color: var(--neutral-text-body);
}

.minMenu strong {
  color: var(--primary-text-default);
}

.minMenu button {
  width: auto;
  margin-left: auto;
  background-color: var(--primary-surface-default);
  color: var(--white);
  font-size: 12px;
  line-height: 12px;
  padding: 5px 10px;
  border-radius: 10px;
  transition: 0.3s;
}

.minMenu button:hover {
  background-color: var(--primary-surface-subtle);
}

.btnEmail {
  padding: 5px 20px !important;
}

@keyframes pulse {
  0% {
    box-shadow: 0 0 0 0 rgba(224, 85, 75, 0.3);
  }

  70% {
    box-shadow: 0 0 0 10px rgba(224, 75, 75, 0);
  }

  100% {
    box-shadow: 0 0 0 0 rgba(224, 75, 75, 0);
  }
}

/* CUSTOM COMPONENTS - MODIFY */
.btnIconModify {
  border-radius: 50%;
}

.mainBtnModify {
  min-width: 135px;
}

.Doble_line {
  display: flex;
  flex-direction: column;
  margin-left: 12px;
}

.containerModal__Provedor_selected {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  padding: 16px;
  box-sizing: border-box;
  border-radius: 8px;
  margin-bottom: 16px;
}

.container_provedor {
  display: flex;
  align-items: center;
  flex-grow: 1;
}

.legal-name {
  font-family: Nunito;
  font-size: 18px;
  font-weight: 600;
  line-height: 24px;
  text-align: left;
  color: var(--neutral-text-body);
  display: flex;
  align-items: center;
  gap: 4px;
}

.legal-name .u-check {
  color: var(--success-surface-darker);
  margin-left: 4px;
}

.verified-icon {
  width: 20px; /* Ajusta el tamaño según tus necesidades */
  height: 20px;
}

.nickName {
  font-family: Nunito;
  font-size: 16px;
  font-weight: 400;
  line-height: 20px;
  text-align: left;
  color: var(--neutral-text-caption);
}

.address {
  font-family: Nunito;
  font-size: 16px;
  font-weight: 600;
  line-height: 20px;
  text-align: left;
  color: var(--primary-text-default);
}

.container_header {
  display: flex;
  align-items: center;
  gap: 24px;
  margin-bottom: 24px;
  padding-bottom: 24px;
  border-bottom: 1px solid var(--Neutral-Border-Subtle, #d6dae1);
}

.container_header u-avatar {
  flex-shrink: 0;
}

.header_content {
  flex: 1;
  align-items: center;
}

/* Estilos para el contenedor de búsqueda */
.container_search {
  width: 100%;
}

/* Estilos para la información del proveedor */
.container_provedor_selected {
  display: flex;
  justify-content: space-between;
  position: relative;
}

.supplier_info {
  display: flex;
  flex-direction: column;

  flex: 1;
}

.buttons {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 4px;
  width: 100%;
  max-width: 120px;
  height: 82px;
}

.buttons ::v-deep u-button {
  width: 100%;
}

.btnFloat {
  border-radius: 50%;
  position: absolute;
  left: -48px;
  bottom: 0px;
}
</style>
