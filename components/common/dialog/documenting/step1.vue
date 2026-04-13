<script setup>
import { defineEmits, ref, defineProps, onMounted } from "vue";
import { debounce, capitalizeName } from "@/utils/helpers";
import useOutcomesStore from "@/stores/outcomes";
import useGlobalStore from "@/stores/global";
import useOrganizationStore from "@/stores/organization";
import usePaymentsStore from "@/stores/payments";
import useUserStore from "@/stores/user";

// Stores
const outcomesStore = useOutcomesStore();
const globalStore = useGlobalStore();
const organizationStore = useOrganizationStore();
const paymentsStore = usePaymentsStore();
const userStore = useUserStore();

// EventBus
const { $bus } = useNuxtApp();

// Emits
const emit = defineEmits([
  "closeModal",
  "changeStep",
  "updatedType",
  "returnToCreatePO",
  "backStep",
  "changeUpdatedDocStep1"
]);

// Constants
const color = "--neutral-text-caption";
const colorHover = "--danger-text-default";
const { t } = useI18n();
const module = "modules.outcomes.pages.oc.modals.documenting.step1";
const buttons = "modules.outcomes.pages.oc.modals.documenting.buttons";

const userSelected = computed(
  () => Object.values(outcomesStore.formDocumenting.supplier).length !== 0,
);
// const selectedSupplierTemp = ref(null);
const shouldShowUserInfo = computed(() => {
  return (
    outcomesStore.outcome.type === "OC" ||
    (outcomesStore.outcome.type === "FXR" && userSelected.value)
  );
});

const search = ref("");
const results = ref([]);
const loading = ref(false);
const change = ref(false);
const typesUser = [
  { name: { es: "Empresa", en: "Business" }, value: "business" },
  { name: { es: "Persona", en: "Personal" }, value: "personal" },
];
const abortController = ref(null);
const sameCurrency = ref(true); // Sirve para saber si no cambie la moneda (true no cambie), (false si cambie)
// Vars
const states = ref({
  loading: false,
  inValid: false,
  inUse: true,
});
const paymentsTermns = ref([]);

// Props
const props = defineProps({
  fromCreatePO: {
    type: Boolean,
    default: false,
  },
  withSelectedLines: {
    type: Boolean,
    default: false,
  },
  updatedDocStep1: {
    type: Boolean,
    default: false,
  },
});

// Mounted
onMounted(async () => {
  window.addEventListener("keydown", handleEscapeKey);

  // Si es true se actualiza desde el paso 1 
  if (props.updatedDocStep1) {
    try {
      globalStore.loading = true;
      outcomesStore.formDocumenting.processing = true;
      if (outcomesStore.outcome.type === "FXR") {
        // outcomesStore.formDocumenting.supplier = {};
      } else {
        outcomesStore.formDocumenting.supplier = JSON.parse(
          JSON.stringify(outcomesStore?.outcome?.supplier),
        );
      }

      outcomesStore.formDocumenting.numbers = JSON.parse(
        JSON.stringify(outcomesStore?.outcome?.numbers),
      );

      if (outcomesStore?.outcome?.reference) {
        outcomesStore.formDocumenting.reference = capitalizeName(
          outcomesStore?.outcome?.reference,
        );
      }

      // Settear fechas al dia de hoy
      outcomesStore.formDocumenting.dateIssue = formatDateToYMD();
      outcomesStore.formDocumenting.dateReceipt = formatDateToYMD();

      // Limpiar campos
      outcomesStore.formDocumenting.documentNumber = "";
      outcomesStore.formDocumenting.primaryFile = null;

      await paymentsStore.getPaymentTerms();

      // Settear monedas
      if (outcomesStore?.outcome?.type === "FXR") {
        const currencies = await globalStore.getMyCurrencies(
          false,
          outcomesStore?.formDocumenting?.currency?._id,
        );
        outcomesStore.formDocumenting.currencies = currencies?.currencies;
      } else {
        const currencies = await globalStore.getMyCurrencies();
        outcomesStore.formDocumenting.currencies = currencies?.currencies;
        outcomesStore.formDocumenting.currencies.unshift(currencies?.currency);
      }

      await outcomesStore.getDocumentTypesByCountry();
    } catch (error) {
      console.error(error);
    } finally {
      globalStore.loading = false;
      outcomesStore.formDocumenting.processing = false;
    }
  }

  emit("changeUpdatedDocStep1", false);

  paymentsTermns.value = paymentsStore.paymentTerms;

  // Settear tipo de documento
  if (outcomesStore?.outcome?.documentType?._id) {
    outcomesStore.formDocumenting.documentType =
      outcomesStore.outcome.documentType._id;
    outcomesStore.formDocumenting.documentTypeName =
      outcomesStore.outcome.documentType.name;
  }

  // Settear el Condiciones de Pago
  const oldPaymentsTermns = outcomesStore?.outcome?.paymentTerm?._id;
  if (oldPaymentsTermns) {
    const payTerm = paymentsTermns.value.find(
      (item) => item._id === oldPaymentsTermns,
    );
    if (payTerm) {
      outcomesStore.formDocumenting.paymentTerm = payTerm?._id;
      outcomesStore.formDocumenting.paymentTermName =
        payTerm?.name?.[globalStore.lang];
    }
  }

  if (!outcomesStore.formDocumenting.backStep) {
    getCurrency();
  }
});

onUnmounted(() => {
  window.removeEventListener("keydown", handleEscapeKey);
});

const handleEscapeKey = (event) => {
  if (event.key === "Escape" || event.key === "Esc") {
    if (!outcomesStore.formDocumenting.processing) emit("closeModal");
  }
};

// Functions
const nextStep = async () => {
  // getCurrency();
  globalStore.loading = true;
  if (change.value) await getOthersCurrency();
  getTypeDocTaxes();

  // Si hice un cambio en la moneda
  if (outcomesStore.formDocumenting.backStep) {
    if (change.value) {
      if (props.fromCreatePO) {
        outcomesStore.formDocumenting.lines = JSON.parse(
          JSON.stringify(
            outcomesStore?.outcome?.lines.map((line) => ({
              ...line,
              numbers: { ...line.numbers, toDocument: getCalcToDocument(line) },
            })),
          ),
        );
      } else if (props.withSelectedLines) {
        outcomesStore.formDocumenting.lines = JSON.parse(
          JSON.stringify(
            outcomesStore.formDocumenting.lines.map((line) => ({
              ...line,
              numbers: { ...line.numbers, toDocument: getCalcToDocument(line) },
            })),
          ),
        );
      } else {
        outcomesStore.formDocumenting.lines = JSON.parse(
          JSON.stringify(
            outcomesStore?.lines.map((line) => ({
              ...line,
              numbers: { ...line.numbers, toDocument: getCalcToDocument(line) },
            })),
          ),
        );
      }
    }
  } else {
    if (props.fromCreatePO) {
      outcomesStore.formDocumenting.lines = JSON.parse(
        JSON.stringify(
          outcomesStore?.outcome?.lines.map((line) => ({
            ...line,
            numbers: { ...line.numbers, toDocument: getCalcToDocument(line) },
          })),
        ),
      );
    } else if (props.withSelectedLines) {
      outcomesStore.formDocumenting.lines = JSON.parse(
        JSON.stringify(
          outcomesStore.formDocumenting.lines.map((line) => ({
            ...line,
            numbers: { ...line.numbers, toDocument: getCalcToDocument(line) },
          })),
        ),
      );
    } else {
      outcomesStore.formDocumenting.lines = JSON.parse(
        JSON.stringify(
          outcomesStore?.lines.map((line) => ({
            ...line,
            numbers: { ...line.numbers, toDocument: getCalcToDocument(line) },
          })),
        ),
      );
    }
  }

  globalStore.loading = false;
  props.fromCreatePO ? emit("documenting", 2) : emit("changeStep", true);
};
const checkDocumentNumber = debounce(async (event = null, str = null) => {
  const idNumber = (str || event?.target?.value).replace(/\s+/g, "");
  if (idNumber !== "") {
    states.value.inValid = false;
    states.value.loading = true;
    outcomesStore.formDocumenting.documentNumber = idNumber;
    const documentType = outcomesStore?.formDocumenting?.documentType;
    const supplier =
      outcomesStore?.formDocumenting?.supplier?.contact?._id ||
      outcomesStore?.formDocumenting?.supplier?._id;
    const resp = await outcomesStore.validateDocumentNumber(
      idNumber,
      documentType,
      supplier,
    );
    if (!resp.success) {
      states.value.inUse = resp.error !== "Invalid parameters";
    }
    states.value.loading = false;
    states.value.inValid = !resp.success;
  }
}, 100);
const handleFileUpload = () => {
  const fileInput = document.createElement("input");
  fileInput.type = "file";
  fileInput.accept = [
    ".csv",
    ".doc",
    ".docx",
    ".gif",
    ".jpg",
    ".jpeg",
    ".pdf",
    ".png",
    ".ppt",
    ".rar",
    ".txt",
    ".xml",
    ".xsl",
    ".zip",
  ].join(", ");

  fileInput.onchange = (event) => {
    const file = event.target.files[0];
    if (file) {
      const allowedTypes = [
        "application/pdf",
        "image/jpeg",
        "image/jpg",
        "image/png",
        "image/gif",
        "text/csv",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/vnd.ms-powerpoint",
        "application/vnd.openxmlformats-officedocument.presentationml.presentation",
        "application/x-rar-compressed",
        "text/plain",
        "application/xml",
        "application/zip",
        "application/vnd.ms-excel",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      ];

      if (!allowedTypes.includes(file.type)) {
        alert("Tipo de archivo no permitido.");
        return;
      }

      outcomesStore.formDocumenting.primaryFile = file;

      console.log(
        getMimeType(outcomesStore?.formDocumenting?.primaryFile?.name),
      );
    }
  };

  fileInput.click();
};

const getCurrency = async () => {
  let currency = null;
  if (outcomesStore.outcome.type === "FXR") {
    const documentType = outcomesStore.formDocumenting.documentType;
    const documentTypeNew = outcomesStore.documentTypes.find(
      (docType) => docType._id === documentType,
    );
    outcomesStore.formDocumenting.taxes = JSON.parse(
      JSON.stringify(documentTypeNew?.taxes || []),
    );
    currency =
      outcomesStore?.outcome?.currency?.default ||
      documentTypeNew?.currency ||
      organizationStore?.organization?.currency ||
      {};
  } else {
    currency =
      outcomesStore?.outcome?.currency?.default ||
      outcomesStore?.outcome?.documentType?.currency ||
      organizationStore?.organization?.currency ||
      {};
    outcomesStore.formDocumenting.taxes = JSON.parse(
      JSON.stringify(outcomesStore?.outcome?.numbers?.taxes || []),
    );
  }
  // outcomesStore.formDocumenting.currencies = JSON.parse(
  //   JSON.stringify([currency])
  // );
  outcomesStore.formDocumenting.currency = JSON.parse(JSON.stringify(currency));

  outcomesStore.formDocumenting.money = currency._id;
  outcomesStore.formDocumenting.moneyName = currency.name[globalStore.lang];
};

const getOthersCurrency = async () => {
  // Si la moneda es la misma no hace nada
  if (
    outcomesStore?.outcome?.currency?.default._id ===
    outcomesStore?.formDocumenting?.currency?._id
  )
    return;

  // Si la moneda es diferente se buscan las otras monedas
  const selectedCurrency = await globalStore.getMyCurrencies(
    false,
    outcomesStore?.formDocumenting?.currency?._id,
  );

  outcomesStore.formDocumenting.othersCurrency =
    selectedCurrency?.currencies.map((c) => ({
      ...c,
      currency: c._id,
      value: c.value?.replace(/,/g, ""),
      valueManual: Number(c.value?.replace(/,/g, "")),
      valueToday: Number(c.value?.replace(/,/g, "")),
    }));
};

const getTypeDocTaxes = () => {
  const documentType = outcomesStore.formDocumenting.documentType;
  const documentTypeNew = outcomesStore.documentTypes.find(
    (docType) => docType._id === documentType,
  );
  outcomesStore.formDocumenting.taxes = JSON.parse(
    JSON.stringify(documentTypeNew?.taxes || []),
  );
};

//buscador
const handleInputSearchUsers = (e) => {
  const val = e.target.value;

  // 🔹 Limpiar los resultados inmediatamente (antes del debounce)
  results.value = [];

  // 🔹 Llamar al debounce con el valor
  searchUsers(val);
};

// 🔸 La función con debounce (solo se encarga de buscar)
const searchUsers = debounce(async (val) => {
  if (val.trim() === "") return;

  try {
    loading.value = true;
    outcomesStore.formDocumenting.processing = true;

    const resp = await userStore.findByUsersByNameOrEmail(true, true, val, {
      archived: true,
      onlyContacts: true,
    });

    results.value = resp && resp.length ? mapperSearchResultUsers(resp) : [];
  } catch (error) {
    console.error(error);
  } finally {
    loading.value = false;
    outcomesStore.formDocumenting.processing = false;
  }
}, 600);

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
const updatedTypeOp = (type) => {
  setTimeout(() => {
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

// select buscador:
const createSupplier = () => {
  // Aqui debo pasar los datos al store
  outcomesStore.formDocumenting.processing = true;
  userStore.dataSheet.alertCustom.show = false;
  setTimeout(() => {
    userStore.showModalDataSheet = true;
    userStore.dataSheet.state = "create";
    userStore.showBtnBack = true;
    setTimeout(() => {
      userStore.dataSheet.data.data.legalName = search.value;
    }, 10);
    $bus.$on("receiveContact", (receiveContact) => {
      userSelected.value = true;
      search.value = "";
      outcomesStore.formDocumenting.supplier = receiveContact;
      outcomesStore.formDocumenting.processing = false;
      outcomesStore.formDocumenting.documentNumber = "";
    });
  }, 10);
};
const selectedSupplier = async (obj) => {
  // hasSupplier.value = true;
  const body = obj.oldData;

  outcomesStore.formDocumenting.supplier = { ...body };
  outcomesStore.formDocumenting.documentNumber = "";
  userSelected.value = true;
};

const getMimeType = (fileText) => {
  const extension = fileText.split(".").pop().toLowerCase();

  const types = {
    pdf: "/img/iconsFile/PDF.svg",
    jpg: "/img/iconsFile/JPG.svg",
    jpeg: "/img/iconsFile/JPG.svg",
    png: "/img/iconsFile/PNG.svg",
    gif: "/img/iconsFile/GIF.svg",
    xsl: "/img/iconsFile/XSL.svg",
    zip: "/img/iconsFile/ZIP.svg",
    xml: "/img/iconsFile/XML.svg",
    txt: "/img/iconsFile/TXT.svg",
    rar: "/img/iconsFile/PPT.svg",
    docx: "/img/iconsFile/DOCX.svg",
    doc: "/img/iconsFile/DOC.svg",
    csv: "/img/iconsFile/CSV.svg",
  };

  return types[extension] || "unknown";
};

const cancel = () => {
  if (outcomesStore.outcome.type === "FXR" && userSelected.value) {
    search.value = "";
    userSelected.value = false;
    emit("returnToCreatePO", 4);
    return;
  }

  props.fromCreatePO ? emit("returnToCreatePO", 4) : emit("closeModal");
};
const getCalcToDocument = (line) => {
  let val = line.numbers.sumBudget.number - line.numbers.documentedNet.number;

  val = Math.max(val, 0);

  const total = formatData(val, outcomesStore.formDocumenting.currency);
  return {
    lastNumber: val,
    lastValue: total.value,
    ...total,
  };
};
const formatData = (number, currency) => {
  const { precision, typeFormat } = currency;
  const numberAprox = convertToNumber(number, typeFormat, precision);
  return {
    number,
    value: formatCurrency(numberAprox, currency, true),
    numberAprox,
  };
};
const handleChangeCondition = (condition) => {
  outcomesStore.formDocumenting.paymentTerm = condition.value;
  outcomesStore.formDocumenting.paymentTermName = condition.label;
};
const handleChangeDocumentType = (documentType) => {
  outcomesStore.formDocumenting.documentType = documentType._id;
  if (outcomesStore.formDocumenting.documentNumber.trim() !== "") {
    const idNumber = outcomesStore.formDocumenting.documentNumber;
    checkDocumentNumber(null, idNumber);
  }
};

const handleChangeCurrency = (currency) => {
  sameCurrency.value =
    outcomesStore?.formDocumenting?.currency?._id === currency.value;

  outcomesStore.formDocumenting.currency = currency.data;
  change.value = true;
};

// Computed
const titleKey = computed(() =>
  (outcomesStore.outcome.type === "FXR" && userSelected.value) ||
  shouldShowUserInfo.value
    ? `${module}.title`
    : `${module}.selectTitle`,
);
const supplier = computed(() => {
  return {
    name: capitalizeName(
      outcomesStore?.formDocumenting?.supplier?.data?.legalName || "-",
    ),
    nickName: capitalizeName(
      outcomesStore?.formDocumenting?.supplier?.data?.nickName || "-",
    ),
    email:
      outcomesStore?.formDocumenting?.supplier?.contact?.email ||
      outcomesStore?.formDocumenting?.supplier?.email ||
      "-",
    src: outcomesStore?.formDocumenting?.supplier?.imgUrl,
  };
});
const validForm = computed(() => {
  if (states.value.loading) {
    return false;
  } else {
    return (
      outcomesStore?.formDocumenting?.money &&
      outcomesStore?.formDocumenting?.documentNumber &&
      outcomesStore?.formDocumenting?.documentType &&
      outcomesStore?.formDocumenting?.dateIssue &&
      outcomesStore?.formDocumenting?.dateReceipt &&
      outcomesStore?.formDocumenting?.paymentTerm &&
      !states.value.inValid
    );
  }
});
const conditionOfPayOptions = computed(() => {
  return paymentsTermns.value.map((item) => {
    return {
      label: item?.name?.[globalStore.lang] || "-",
      value: item._id,
      data: item,
    };
  });
});

const currencies = computed(() => {
  const outcome = outcomesStore?.outcome;

  if (outcome?.type === "FXR") {
    const resp = outcomesStore.formDocumenting.currencies.map((item) => {
      return {
        label: item?.name?.[globalStore.lang] || "-",
        value: item._id,
        data: item,
      };
    });
    return resp;
  } else {
    return [];
  }

  // outcomesStore.allCurrencies.currencies.map((item) => {
  //     return {
  //       label: item?.name?.[globalStore.lang] || "-",
  //       value: item._id,
  //       data: item,
  //     };
  //   });;

  // OLD
  // const outcome = outcomesStore?.outcome;

  // if (outcome?.type === "FXR") return [];

  // const currency = outcome?.documentType?.currency;
  // if (!currency) return [];

  // const label = currency.name?.[globalStore.lang];
  // return [{ ...currency, label }];
});
</script>

<template>
  <div class="step1">
    <div class="step1__header">
      <span v-text="t(titleKey)"></span>
      <u-button-icon
        icon="close"
        class="btnIconModify"
        :color="color"
        @action-btn="emit('closeModal')"
        type="outlined"
        size="s"
      />
    </div>
    <div class="step1__body">
      <div
        v-if="outcomesStore.outcome.type === 'FXR' && userSelected === false"
        class="step1__body-header"
      >
        <u-avatar :size="76" :user="{ src: '', name: '' }" />
        <u-search-by-type
          size="s"
          style=""
          v-model="search"
          :placeholder="t(module + '.inputs.supplier.placeholder')"
          :options="results"
          :loading="loading"
          :showSearchIcon="true"
          :avatar="true"
          :create="true"
          :updated="false"
          :snippet="true"
          :iconSelect="null"
          :types="typesUser"
          @input="handleInputSearchUsers($event)"
          @updatedTypeOp="updatedTypeOp"
          @newOption="createSupplier"
          @cleanInput="search = ''"
          @selectedOption="selectedSupplier"
        />
        <!-- Buttons de cambiar proveedor y editar contacto -->
        <!-- <div class="step1__body-header-actions" v-if="hasSupplier">
              <u-button-icon class="btnIconAvatarModify first" icon="change" size="s" :color="secondaryColor" :color-hover="secondaryColorHover" :color-active="secondaryColorActive" @click="cleanSupplier" />
              <u-button-icon class="btnIconAvatarModify " icon="edit" size="s" @click="showContact" />
          </div> -->
      </div>

      <div v-if="shouldShowUserInfo" class="step1__body-header">
        <u-avatar :size="64" :user="supplier" />
        <div class="step1__body-header-text">
          <div class="title">
            <span v-text="supplier.name"></span>
            <span class="u u-verify"></span>
          </div>
          <span class="text" v-text="supplier.nickName"></span>
          <span class="email" v-text="supplier.email"></span>
        </div>
        <div v-if="outcomesStore.formDocumenting.primaryFile" class="fileName">
          <img
            :src="
              getMimeType(outcomesStore?.formDocumenting?.primaryFile?.name)
            "
            alt="iconDocumentAdjunto"
          />
          <span
            class="truncateText"
            v-text="outcomesStore?.formDocumenting?.primaryFile?.name"
          ></span>
          <u-button-icon
            icon="close"
            size="xs"
            type="outlined"
            :color="color"
            @click="outcomesStore.formDocumenting.primaryFile = null"
            :colorHover="colorHover"
          />
        </div>
        <u-button
          v-else
          class="step1__body-header-button"
          icon="attach"
          :text="t(module + '.buttons.upload')"
          size="s"
          type="outlined"
          @click="handleFileUpload"
        />
      </div>
      <div v-if="shouldShowUserInfo" class="line"></div>
      <div v-if="shouldShowUserInfo" class="step1__body-container">
        <span v-text="t(module + '.subTitle')" class="subTitle"></span>
        <div class="step1__body-form">
          <div class="step1__body-group">
            <span class="u u-new-project"></span>
            <span
              >{{ t(module + ".inputs.reference.label") }}
              <strong>({{ t("global.text.optional") }})</strong></span
            >
            <u-input
              v-model="outcomesStore.formDocumenting.reference"
              :placeholder="t(module + '.inputs.reference.placeholder')"
              size="s"
            />
          </div>
          <div class="step1__body-group">
            <span class="u u-pay"></span>
            <span v-text="t(module + '.inputs.currency.label')"></span>
            <u-select
              v-model="outcomesStore.formDocumenting.moneyName"
              :placeholder="t(module + '.inputs.currency.placeholder')"
              size="s"
              :options="currencies"
              :full-data="true"
              :disabled="!(outcomesStore.outcome.type === 'FXR')"
              @full-data="handleChangeCurrency"
            />
          </div>
          <div class="step1__body-group" v-if="shouldShowUserInfo">
            <span class="u u-invoice"></span>
            <span v-text="t(module + '.inputs.documentType.label')"></span>
            <u-select
              v-model="outcomesStore.formDocumenting.documentTypeName"
              :placeholder="t(module + '.inputs.documentType.placeholder')"
              size="s"
              :options="outcomesStore.documentTypes"
              :full-data="true"
              :disabled="!(outcomesStore.outcome.type === 'FXR')"
              @full-data="handleChangeDocumentType"
            />
          </div>
          <div class="step1__body-group">
            <span class="u u-open-book"></span>
            <span v-text="t(module + '.inputs.conditions.label')"></span>
            <u-select
              v-model="outcomesStore.formDocumenting.paymentTermName"
              :full-data="true"
              @full-data="handleChangeCondition"
              :placeholder="t(module + '.inputs.conditions.placeholder')"
              :options="conditionOfPayOptions"
              size="s"
            />
          </div>
          <div class="step1__body-group idNumber">
            <span class="u u-hashtag"></span>
            <span v-text="t(module + '.inputs.documentNumber.label')"></span>
            <u-input
              v-model="outcomesStore.formDocumenting.documentNumber"
              :placeholder="t(module + '.inputs.documentNumber.placeholder')"
              size="s"
              @input="checkDocumentNumber($event)"
              :error="states.inValid"
            />
            <div v-if="states.loading" class="verifying">
              <u-loading :width="16" />
              <span v-text="t('global.text.verifying')"></span>
            </div>
            <div v-else-if="states.inValid" class="verifying error">
              <span
                v-text="
                  t(module + `.msg.${states.inUse ? 'inUse' : 'noDocType'}`)
                "
              ></span>
            </div>
          </div>
          <div class="step1__body-group">
            <span class="u u-calendar"></span>
            <span v-text="t(module + '.inputs.issueDate.label')"></span>
            <u-calendar
              v-model="outcomesStore.formDocumenting.dateIssue"
              size="s"
            />
          </div>
          <div class="step1__body-group">
            <span class="u u-calendar"></span>
            <span v-text="t(module + '.inputs.receiptDate.label')"></span>
            <u-calendar
              v-model="outcomesStore.formDocumenting.dateReceipt"
              size="s"
            />
          </div>
        </div>
      </div>
    </div>
    <div class="step1__footer">
      <u-button
        :text="
          outcomesStore.outcome.type === 'FXR' && userSelected
            ? t(buttons + '.back')
            : t(buttons + '.cancel')
        "
        type="outlined"
        class="mainBtnModify"
        @action-btn="cancel"
        size="s"
      />
      <u-button
        :text="t(buttons + '.next')"
        class="mainBtnModify"
        @click="nextStep"
        size="s"
        :disabled="!validForm"
      />
    </div>
  </div>
</template>

<style scoped>
.step1 {
  width: 100%;
  height: 100%;
  display: grid;
  grid-template-rows: 40px minmax(549px, auto) 40px;
  gap: 16px;
}

/* header */
.step1__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 40px;
  width: 100%;
}

.step1__header span {
  font-size: 16px;
  font-weight: 600;
  line-height: 20px;
  letter-spacing: 0em;
  text-align: left;
  color: var(--neutral-text-body);
}

/* body */
.step1__body {
  display: flex;
  flex-direction: column;
  gap: 24px;
}
.step1__body-header {
  font-weight: 600;
  font-size: 14px;
  line-height: 20px;
  letter-spacing: 0em;
  text-align: left;
  color: var(--neutral-text-body);
  height: auto;
}
.step1__body-container {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.line {
  background-color: var(--neutral-border-subtle);
  height: 1px;
  width: 100%;
}

.step1__body-header {
  height: 64px;
  display: grid;
  grid-template-columns: 110px 1fr;
  grid-template-areas: "avatar text button";
  align-items: center;
}

.step1__body-header-text {
  display: flex;
  flex-direction: column;
}

.step1__body-header .title {
  display: flex;
  gap: 16px;
}

.step1__body-header .title span {
  font-weight: 600;
  font-size: 18px;
  line-height: 24px;
  letter-spacing: 0%;
  vertical-align: middle;
  color: var(--neutral-text-body);
}

.step1__body-header span.text {
  font-weight: 600;
  font-size: 18px;
  line-height: 18px;
  letter-spacing: 0%;
  vertical-align: middle;
  color: var(--neutral-text-caption);
}

.step1__body-header span.email {
  font-weight: 600;
  font-size: 16px;
  line-height: 16px;
  letter-spacing: 0%;
  vertical-align: middle;
  color: var(--primary-text-default);
}

.step1__body-header-avatar {
  grid-area: avatar;
}

.step1__body-header-title {
  grid-area: title;
}

.step1__body-header-subTitle {
  grid-area: subTitle;
}

.step1__body-header-email {
  grid-area: email;
}

.step1__body-header-button {
  grid-area: button;
}

.subTitle {
  font-weight: 600;
  font-size: 16px;
  line-height: 20px;
  letter-spacing: 0%;
  vertical-align: middle;
  color: var(--neutral-text-body);
}

.step1__body-header .fileName {
  display: grid;
  grid-template-columns: auto 1fr auto;
  width: auto;
  max-width: 268px;
  padding: 0px 12px;
  gap: 16px;
  height: 48px;
  align-items: center;
  gap: 4px;
  justify-content: flex-end;
  border: 1px solid var(--neutral-border-subtle);
  border-radius: 8px;
}

.step1__body-header .fileName span {
  color: var(--neutral-text-caption);
  font-size: 12px;
  line-height: 12px;
  width: 158px;
}

.step1__body-form {
  height: 340px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  overflow-y: auto;
  scrollbar-gutter: stable both-edges;
  padding-right: 10px;
}

.step1__body-form::-webkit-scrollbar {
  width: 8px;
  height: 0px;
  background: var(--neutral-surface-light);
  border-radius: 20px;
}
.step1__body-form::-webkit-scrollbar-thumb {
  background: var(--neutral-surface-subtle);
  border-radius: 5px;
}

.step1__body-group {
  display: grid;
  grid-template-columns: 16px 200px 1fr;
  gap: 10px;
  flex-shrink: 1;
}

.step1__body-group span {
  font-size: 14px;
  line-height: 18px;
  letter-spacing: 0%;
  vertical-align: middle;
  color: var(--neutral-text-caption);
  height: 32px;
  padding-top: 8px;
}

.step1__body-group span:nth-child(2) {
  font-weight: 600;
}

.step1__body-group span strong {
  font-weight: 400;
  font-size: 12px;
}

/* footer */
.step1__footer {
  width: 100%;
  height: 40px;
  display: flex;
  justify-content: space-between;
  padding-top: 10px;
}

/* CUSTOM COMPONENTS - MODIFY */
.btnIconModify {
  border-radius: 50%;
  color: var(--bg-neutral-500);
}

.mainBtnModify {
  width: 135px;
}

.idNumber {
  position: relative;
}

.idNumber::v-deep(.containerInput input) {
  padding-right: 195px !important;
}

.verifying {
  position: absolute;
  right: 0px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
  padding-right: 16px;
}
.verifying span {
  font-weight: 400 !important;
}
.verifying.error span {
  color: var(--danger-text-default);
}
</style>
