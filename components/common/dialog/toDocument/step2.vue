<script setup>
import { ref, watch, computed, onMounted } from "vue";
import useGlobalStore from "@/stores/global";
import useOutcomesStore from "@/stores/outcomes";
import useOrganizationStore from "@/stores/organization";
import useContactStore from "@/stores/contacts";
import labels from "@/utils/labels/common.json";
import useUserStore from "@/stores/user";
import { regexEmail, capitalizeName } from "@/utils/helpers";
import { formatCurrency, convertToNumber } from "@/utils/formatAmount";
const { t } = useI18n();
const { $bus } = useNuxtApp();
$bus.$emit("updateDimensions", { width: "800px", height: "90vh" });
// EventBus
onMounted(() => {
  if (outcomesStore.toDocument.outcomes.type == "OC") {
    console.log("Recuperando suplier por que es OC");
    outcomesStore.toDocument.supplier = transformData(
      outcomesStore.toDocument.outcomes.supplier
    );
    handleChangeDocument( 
      outcomesStore.toDocument.outcomes.documentType._id ||
        outcomesStore.toDocument.outcomes.documentType,
         false);
    mode.value = "building";
  } else {
    mode.value = "Searching";
  }
  validateDocumentNumber();
});

const transformData = (data) => {
  const transformed = {
    // `_id` no está en el nivel superior, lo obtenemos de `contact`
    _id: data.contact._id,

    // `imgUrl`: prioriza el nivel superior, si no existe usa el de `contact`
    imgUrl: data.imgUrl || data.contact.imgUrl,

    // `data`: combina `data` del nivel superior y `contact.data`, priorizando el nivel superior
    data: {
      ...data.contact.data, // Primero los datos de `contact.data`
      ...data.data, // Luego, sobrescribimos con los del nivel superior si existen
    },

    // `payment`: prioriza el nivel superior, si no existe usa el de `contact.payment`
    payment: data.payment || data.contact.payment,

    // `email`: solo está en `contact`
    email: data.contact.email,
  };

  return transformed;
};

// Stores
const mode = ref("waiting"); // Estados posibles: 'waiting', 'creating', 'building'
const userStore = useUserStore();
const globalStore = useGlobalStore();
const outcomesStore = useOutcomesStore();
const organizationStore = useOrganizationStore();
const contactStore = useContactStore();

const validDocumentNumber = ref(false);
const loadingDocument = ref(false);
const errors = ref({ documentNumber: false });
const msg = ref({ documentNumber: "" });
const step1 = labels.modal.createOc.step1;

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
const currencyDefault = ref(organizationStore.organization.currency);

// Event Email
let timeoutId;

const handleEmail = async () => {
  clearTimeout(timeoutId);
  loadingEmail.value = false;
  errors.value.email = false;
  userEmail.value = false;
  if (outcomesStore.toDocument.isContact) {
    errors.value.email = false;
  } else {
    const email = outcomesStore.toDocument.supplier.email;
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

const cleanForm = () => {
  search.value = "";
};

console.log("currencyDefault", currencyDefault);

// Form fields
try {
  outcomesStore.toDocument.currency = currencyDefault.value;
  outcomesStore.toDocument.taxes.value = formatCurrency(
    outcomesStore.toDocument.taxes.value,
    currencyDefault,
    false
  );
  outcomesStore.toDocument.subtotal.value = formatCurrency(
    outcomesStore.toDocument.subtotal.value,
    currencyDefault,
    false
  );
  outcomesStore.toDocument.totalWithTaxes.value = formatCurrency(
    outcomesStore.toDocument.totalWithTaxes.value,
    currencyDefault,
    false
  );
} catch (error) {}

// Watch for changes in taxes
const calctotalWithTaxes = () => {
  const subtotal = parseFloat(outcomesStore.toDocument.subtotal.number) || 0;
  const taxes = parseFloat(outcomesStore.toDocument.taxes.number) || 0;
  outcomesStore.toDocument.totalWithTaxes.number = subtotal + taxes;
  outcomesStore.toDocument.totalWithTaxes.value = formatCurrency(
    outcomesStore.toDocument.totalWithTaxes.number,
    currencyDefault,
    false
  );
};

watch(
  () => outcomesStore.toDocument.taxes.value,
  (newValue) => {
    if (newValue) {
      outcomesStore.toDocument.taxes.value = formatCurrency(
        newValue,
        currencyDefault,
        true
      );
      outcomesStore.toDocument.taxes.number = convertToNumber(
        newValue,
        currencyDefault
      );

      // Calculate total with taxes
      calctotalWithTaxes();
    }
  }
);

// Watch for changes in subtotal
watch(
  () => outcomesStore.toDocument.subtotal.value,
  (newValue) => {
    if (newValue) {
      outcomesStore.toDocument.subtotal.value = formatCurrency(
        newValue,
        currencyDefault,
        true
      );
      outcomesStore.toDocument.subtotal.number = convertToNumber(
        newValue,
        currencyDefault
      );

      // Calculate total with taxes
      calctotalWithTaxes();
    }
  }
);

const isPrimaryFileEmpty = computed(() => {
  const primaryFile = outcomesStore.toDocument.primaryFile;
  return !(primaryFile instanceof File) || !primaryFile.name;
});

const handleFileUpload = () => {
  const fileInput = document.createElement("input");
  fileInput.type = "file";
  fileInput.onchange = (event) => {
    const file = event.target.files[0];
    if (file) {
      // Guardar el archivo en outcomesStore.toDocument.primaryFile
      outcomesStore.toDocument.primaryFile = file;
      console.log(file);
    }
  };
  fileInput.click();
};

// Variable para el identificador de llamadas
let lastCallId = 0;

watch(
  () => outcomesStore.toDocument.documentNumber,
  () => {
    validateDocumentNumber();
  }
);

// Función de validación con control de última llamada
const validateDocumentNumber = async () => {
  // Incrementar el identificador de la llamada actual
  const currentCallId = ++lastCallId;
  console.log("currentCallId", currentCallId);
  const number = outcomesStore.toDocument.documentNumber;
  const documentTypeId =
    outcomesStore?.toDocument?.supplier?.payment?.document?._id ||
    outcomesStore?.toDocument?.supplier?.payment?.document;
  const providerId =
    outcomesStore?.toDocument?.supplier?._id ||
    outcomesStore?.toDocument?.supplier?.contact;

  if (!providerId) {
    // por si el proveedor es new no se realiza validacion
    validDocumentNumber.value = true;
    return;
  }

  // Verificar que todos los datos necesarios estén presentes
  if (!number || !documentTypeId) {
    // Opcional: Puedes establecer errores o simplemente retornar
    console.log(!number, !documentTypeId, !providerId);
    return;
  }

  validDocumentNumber.value = false;
  loadingDocument.value = true;

  try {
    const response = await outcomesStore.validateDocumentNumber(
      number,
      documentTypeId,
      providerId
    );

    // Verificar si esta es la última llamada
    if (currentCallId === lastCallId) {
      if (response.data.valid) {
        validDocumentNumber.value = true;
        errors.value.documentNumber = false;
        msg.value.documentNumber = "";
      } else {
        errors.value.documentNumber = true;
        validDocumentNumber.value = false;
        msg.value.documentNumber = "Documento ya ingresado";
      }
    }
  } catch (error) {
    // Verificar si esta es la última llamada
    if (currentCallId === lastCallId) {
      errors.value.documentNumber = true;
      msg.value.documentNumber =
        "No fue posible comprobar el número de documento";
    }
  } finally {
    // Verificar si esta es la última llamada
    if (currentCallId === lastCallId) {
      loadingDocument.value = false;
    }
  }
};

const useUserFoundByMail = () => {
  console.log("oldUserByEmail.value", oldUserByEmail.value);
  outcomesStore.toDocument.supplier = oldUserByEmail.value;

  if (!outcomesStore.toDocument.supplier.hasOwnProperty("data")) {
    outcomesStore.toDocument.supplier.data = {};
  }
  outcomesStore.toDocument.supplier.data.nickName ??= null;

  if (!outcomesStore.toDocument.supplier.hasOwnProperty("payment")) {
    outcomesStore.toDocument.supplier.payment = {};
  }
  outcomesStore.toDocument.supplier.payment.condition ??= null;
  outcomesStore.toDocument.supplier.payment.document ??= null;

  outcomesStore.toDocument.supplier.user = {
    _id: outcomesStore.toDocument.supplier._id,
  };
  delete outcomesStore.toDocument.supplier._id;

  showMenuOldUserByEmail.value = false;
  errors.value.email = false;
  msg.value.email = "";
  disabledEmail.value = true;
};

const cleanMenuUserByEmail = () => {
  oldUserByEmail.value = {};
  showMenuOldUserByEmail.value = false;
  errors.value.email = false;
  msg.value.email = "";
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
    newContact.user = { _id: contact?._id };
  }

  return newContact;
};

const selectedSupplier = async (obj) => {
  console.log("selectedSupplier", obj);
  outcomesStore.toDocument.supplier = newContactMapperToDocument(obj.oldData);

  console.log("Selecionado filtrado", outcomesStore.toDocument.supplier);
  if (obj?.oldData?.payment?.document) {
    handleChangeDocument(
      obj.oldData.payment.document._id ||
        obj.oldData.payment.document
      );
  } 

  cleanMenuUserByEmail();
  search.value = "";
  disabledEmail.value = obj.id && obj.user;
  supplierSelected.value = true;
  mode.value = "building";
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

const createSupplier = () => {
  outcomesStore.toDocument.supplier = {
    contact: null,
    isContact: false,
    email: "",
    imgUrl: "",
    data: {
      legalName: search.value,
      typeName:
        defaultType[globalStore.lang][
          getIconForm.value === "building" ? "business" : "personal"
        ],
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
    outcomesStore.toDocument.supplier._id = receiveContact._id;
    outcomesStore.toDocument.supplier.data.legalName =
      receiveContact.data.legalName;
    outcomesStore.toDocument.supplier.data.nickName =
      receiveContact.data.nickName;
    outcomesStore.toDocument.supplier.email = receiveContact.email;
    outcomesStore.toDocument.supplier.imgUrl = receiveContact.imgUrl;

    if (outcomesStore.toDocument.outcomes.type == "OC") {
      handleChangeDocument(
        receiveContact?.payment?.document?._id ||
          receiveContact.payment.document
      );
    }
    mode.value = "building";
  });
};

const changeSupplier = () => {
  // Reset the supplier information
  outcomesStore.toDocument.supplier = {
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
  cleanForm(); // Clear the search input
  mode.value = "Searching";
};

// Calcular la fecha de vencimiento
const calculateDueDate = () => {
  const issueDate = new Date(outcomesStore.toDocument.issueDate);
  const conditionDays =
    parseInt(outcomesStore.toDocument.payment.condition) || 0;
  issueDate.setDate(issueDate.getDate() + conditionDays);
  outcomesStore.toDocument.dueDate = issueDate.toISOString().substring(0, 10); // Formato YYYY-MM-DD
  console.log(outcomesStore.toDocument.dueDate);
};

// Recalcular la fecha de vencimiento cuando cambien la fecha de emisión o la condición de pago
watch(
  () => [
    outcomesStore.toDocument.issueDate,
    outcomesStore.toDocument.payment.condition,
  ],
  calculateDueDate
);
calculateDueDate();
// Recalcular la fecha de vencimiento cuando cambien la fecha de emisión o la condición de pago

const handleNext = () => {
  if (mode.value === "creating") {
    mode.value = "building";
  } else if (mode.value === "building") {
    $bus.$emit("updatedStepDocument");
  }
};

const handleChangeDocument = async (documentId, changeTaxDefault = true) => {
  try {
    console.log(`handleChangeDocument`);
    // Asignar el ID del documento al pago del proveedor
    outcomesStore.toDocument.supplier.payment.document = documentId;

    // Buscar el tipo de documento en outcomesStore.documentTypes donde id === documentId
    const resp = outcomesStore.documentTypes.find(
      (dt) => dt._id === documentId
    );

    if (!resp) {
      console.log(`Tipo de documento con ID ${documentId} no encontrado.`);
      throw new Error(`Tipo de documento con ID ${documentId} no encontrado.`);
    }

    // Asignar el tipo de documento obtenido a toDocument
    outcomesStore.toDocument.documentType = resp;

    // Validar el número de documento
    validateDocumentNumber();

    // Asignar los impuestos obtenidos al store
    outcomesStore.taxes = resp.taxes;
    outcomesStore.toDocument.taxes = resp.taxes;

    // Iterar sobre cada línea del documento y actualizar los impuestos y números de impuestos
    outcomesStore.toDocument_lines.forEach((line) => {
      // Asignar una copia de taxDefault si existe, de lo contrario, asignar un arreglo vacío
      if (changeTaxDefault) {
        line.taxes = resp.taxDefault ? [...resp.taxDefault] : [];
      }

      // Reiniciar los valores de impuestos en números
      line.numbers.tax = {
        value: "$ 0",
        number: 0,
        lastValue: "$ 0",
        lastNumber: 0,
      };
    });
  } catch (error) {
    console.error("Error en handleChangeDocument:", error);
    // Opcional: Manejo adicional de errores, como notificaciones al usuario
  }
};

const search = ref("");
const results = ref([]);
const loadingSearch = ref(false);

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

const checkSupplierData = computed(() => {
  if (errors.value.email) {
    return false;
  } else {
    const supplier = outcomesStore.toDocument.supplier;

    return supplier.data.legalName.trim() !== "";
  }
});

const checkDocumentedData = computed(() => {
  return (
    outcomesStore.toDocument.reference.trim() !== "" &&
    loadingDocument.value !== true &&
    validDocumentNumber.value !== false &&
    outcomesStore.toDocument.documentType?.name !== "" &&
    outcomesStore.toDocument.documentNumber !== "" &&
    outcomesStore.toDocument.issueDate !== "" &&
    outcomesStore.toDocument.receiptDate.trim() !== ""
  );
});

const getLabel = (prop) => {
  return changeLabelsByType.value === "personal" ? `${prop}User` : prop;
};

const getIconForm = computed(() => {
  const types = {
    business: "building",
    personal: "user",
  };
  return types[outcomesStore.toDocument.supplier.data.type] || "building";
});
</script>

<template>
  <div class="containerModal">
    <div class="containerModal__header">
      <span>{{ mode === "Searching" ? 'Documentar - Seleccionar proveedor' : 'Documentar - Datos del Documento' }}</span>
      <u-button-icon
        icon="close"
        class="btnIconModify"
        type="outlined"
        color="--neutral-text-caption"
        size="m"
        @click="$bus.$emit('closeAndBack')"
      />
    </div>

    <div class="containerModal__content">
      <div class="container_header">
        <u-avatar
          :user="{
            src:
              mode != 'Searching'
                ? outcomesStore?.toDocument?.supplier?.imgUrl || ''
                : '',
          }"
          :size="68"
        />

        <div v-if="mode == 'Searching'" class="container_search header_content">
          <u-search-by-type
            v-model="search"
            size="m"
            :placeholder="'Buscar Proveedor'"
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
              {{ outcomesStore.toDocument.supplier.data.legalName || "-" }}
              <template v-if="outcomesStore.toDocument.supplier.isContact">
                <img
                  src="/img/TempMiguelPendienteAMigrar/verified.svg"
                  alt="Verified"
                  class="verified-icon"
                />
              </template>
            </span>
            <span class="nickName">
              {{ outcomesStore.toDocument.supplier.data.nickName || "-" }}
            </span>
            <span class="address">
              {{ outcomesStore.toDocument.supplier.email || "-" }}
            </span>
          </div>
          <div class="container_provedor-actions">
            <!-- Botones -->
          <u-button
            v-if="isPrimaryFileEmpty"
            size="s"
            icon="attach"
            :text="'Subir Documento'"
            type="outlined"
            @click="handleFileUpload"
            style="width: 100%;"
          />

          <OutcomesComponentsFileCard
            v-else
            :nombreArchivo="outcomesStore.toDocument.primaryFile.name"
            page="modalDocumentar"
          />
          <div
            class="buttons"
            v-if="outcomesStore.toDocument.outcomes.type == 'FXR'"
          >
            <u-button
              size="s"
              icon="change"
              :text="'Cambiar Proveedor'"
              type="outlined"
              color="--bg-primary-500"
              colorHover="--bg-primary-600"
              colorActive="--bg-primary-700"
              @click="changeSupplier"
              style="width: 100%;"
            />
            <u-button-icon
              v-if="mode !== 'creating'"
              size="s"
              icon="edit"
              class="btnFloat"
              @click="
                showContact(outcomesStore?.toDocument?.supplier?._id || null)
              "
            />
          </div>
          </div>
        </div>
      </div>
      <div v-if="mode === 'creating'" class="container__form supplier_info">
        <span>{{ "Información General " }}</span>
        <div class="group">
          <label
            ><span class="icon u-user"></span>
            {{ "Nombre" }}
          </label>

          <u-input
            v-model="outcomesStore.toDocument.supplier.data.legalName"
            placeholder="Nombre"
            @input="
              outcomesStore.toDocument.supplier.data.legalName = capitalizeName(
                outcomesStore.toDocument.supplier.data.legalName
              )
            "
          />
        </div>
        <div class="group">
          <label
            ><span class="icon u-star"></span>
            {{ step1.inputs.alias.label[globalStore.lang] }}
          </label>

          <u-input
            v-model="outcomesStore.toDocument.supplier.data.nickName"
            placeholder="nickName"
            @input="
              outcomesStore.toDocument.supplier.data.nickName = capitalizeName(
                outcomesStore.toDocument.supplier.data.nickName
              )
            "
          />
        </div>
        <div class="group">
          <label>
            <span class="icon u-email"></span>
            {{ step1.inputs.email.label[globalStore.lang] }}
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
                  {{ globalStore.lang === "es" ? "Ir" : "Go to" }}
                </button>
              </div>
            </div>
            <div v-if="loadingEmail" class="loadMsg">
              <u-loading :width="12" />
              {{ labels.config.verifying[globalStore.lang] }}
            </div>
          </label>
          <u-input
            :error="errors.email"
            v-model="outcomesStore.toDocument.supplier.email"
            :placeholder="step1.inputs.email.placeholder[globalStore.lang]"
            :disabled="disabledEmail"
            @input="handleEmail($event)"
          />
        </div>
        <div class="group">
          <label
            ><span class="icon u-star"></span>
            {{ step1.inputs[getLabel("giro")].label[globalStore.lang] }}
          </label>

          <u-input
            v-model="outcomesStore.toDocument.supplier.data.giro"
            :placeholder="
              step1.inputs[getLabel('giro')].placeholder[globalStore.lang]
            "
          />
        </div>
        <div class="group" v-if="false">
          <label
            ><span class="icon u-star"></span>
            {{ step1.inputs.address.label[globalStore.lang] }}
          </label>

          <u-search
            v-model="outcomesStore.fortoDocumentmOc.supplier.data.address"
            :options="placesPredictions"
            :loading="loadingLocations"
            :placeholder="
              step1.inputs[getLabel('address')].placeholder[globalStore.lang]
            "
            @cleanInput="
              () => (outcomesStore.toDocument.supplier.data.address = '')
            "
            @input="
              searchPlaces(outcomesStore.toDocument.supplier.data.address)
            "
          />
        </div>
        <div class="group">
          <label
            ><span class="icon u-star"></span>
            {{ step1.inputs.rut.label[globalStore.lang] }}
          </label>

          <u-input
            v-model="outcomesStore.toDocument.supplier.data.idNumber"
            :placeholder="
              step1.inputs[getLabel('rut')].placeholder[globalStore.lang]
            "
          />
        </div>
        <div class="group">
          <label
            ><span class="icon u-phone"></span>
            {{ "Telefono" }}
          </label>

          <u-input
            v-model="outcomesStore.toDocument.supplier.data.phone"
            :placeholder="
              step1.inputs[getLabel('rut')].placeholder[globalStore.lang]
            "
          />
        </div>
      </div>
      <div v-if="mode == 'building'" class="container__form outcomes_info">
        <span> {{ "Datos del Documento " }} </span>

        <div class="group">
          <label>
            <span class="icon u-user"></span>
            {{ $t("global.text.reference") }}
          </label>
          <u-input v-model="outcomesStore.toDocument.reference" />
        </div>
        <div class="group" v-if="!outcomesStore.toDocument.documentTypeBlock">
          <label>
            <span class="icon u-user"></span>
            {{ "Moneda" }}
          </label>
          <u-select
            :disabled="true"
            v-model="outcomesStore.toDocument.currency.code"
            placeholder="Moneda"
            :full-data="true"
            @full-data="
              (data) => {
                outcomesStore.toDocument.currency = { ...data };
              }
            "
          />
        </div>

        <div class="group">
          <label>
            <span class="icon u-user"></span>
            {{ "Tipo de Documento" }}
          </label>
          <u-select
            :disabled="outcomesStore.toDocument.documentTypeBlock"
            v-model="outcomesStore.toDocument.documentType.name"
            :options="outcomesStore.documentTypes"
            placeholder="Documento"
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
          <div class="contentLabel">
            <label>
              <span class="icon u-user"></span>
              {{ "N° del Documento" }}
            </label>
          </div>
          <div class="container-document-Number">
            <u-input v-model="outcomesStore.toDocument.documentNumber" />
            <div v-if="loadingDocument" class="loadMsg">
              <u-loading :width="12" />
              {{ "Verificando..." }}
            </div>

            <!-- Mensaje de error si existe -->
            <div
              v-if="errors.documentNumber && !loadingDocument"
              class="errorMsg"
            >
              <span v-text="msg.documentNumber"></span>
            </div>
          </div>
        </div>
        <div class="group">
          <label
            ><span class="icon u-star"></span> {{ "Fecha de Emision" }}
          </label>
          <u-calendar v-model="outcomesStore.toDocument.issueDate" />
        </div>
        <div class="group">
          <label
            ><span class="icon u-star"></span>{{ "Fecha de Recepcion" }}</label
          >
          <u-calendar v-model="outcomesStore.toDocument.receiptDate" />
        </div>

        <div class="group">
          <label>
            <span class="icon u-new-project"></span>
            {{ "Observaciones" }}
          </label>
          <u-textarea
            style="height: 100px"
            v-model="outcomesStore.toDocument.observation"
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
        @click="$bus.$emit('closeAndBack')"
      />
      <u-button
        :text="labels.modal.createOc.step1.buttons.next[globalStore.lang]"
        class="mainBtnModify"
        @click="handleNext()"
        :disabled="
          mode === 'Searching' || (mode === 'building' && !checkDocumentedData)
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

.container-document-Number {
  position: relative;
}

.container-document-Number::v-deep(.containerInput input) {
  padding-right: 180px !important;
}

.container-document-Number > div.loadMsg,
.container-document-Number > div.errorMsg {
  position: absolute;
  top: 7px;
  right: 18px;
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
  font-size: 18px;
  font-weight: 600;
  line-height: 24px;
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
  gap: 16px;
  margin-bottom: 24px;
  padding-bottom: 24px;
  border-bottom: 1px solid var(--neutral-border-subtle);
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

.container_provedor-actions {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  align-items: flex-end;
  gap: 8px;
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
}

.buttons ::v-deep u-button {
  width: 100%;
}

.btnFloat {
  border-radius: 50%;
  position: absolute;
  left: -40px;
  bottom: 0px;
}
</style>
