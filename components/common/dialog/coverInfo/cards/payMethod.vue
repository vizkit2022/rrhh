<script setup>
import {
  ref,
  computed,
  onMounted,
  defineProps,
  defineEmits,
  defineExpose,
} from "vue";
import { debounce } from "@/utils/helpers";
import useUserStore from "@/stores/user";
import useGlobalStore from "@/stores/global";
import usePaymentsStore from "@/stores/payments";
import useOrganizationStore from "@/stores/organization";
import {
  searchLocationByGoogleMaps,
  testGoogleMapsPlaces,
} from "@/utils/helpers";

// STORES
const userStore = useUserStore();
const globalStore = useGlobalStore();
const paymentsStore = usePaymentsStore();
const organizationStore = useOrganizationStore();

// EMITS
const emit = defineEmits(["bankAccountSelected"]);

// PROPS
const props = defineProps({
  user: {
    type: Object,
    default: () => ({}),
  },
  // sirve para hacer independiente al componente, hace un get de las cuentas con la prop user
  refresh: {
    type: Boolean,
    default: true,
  },
  width: {
    type: String,
    default: "50%",
  },
  maxWidth: {
    type: String,
    default: "",
  },
  byUser: {
    type: Boolean,
    default: true,
  },
  bankAccountSelected: {
    type: Boolean,
    default: false,
  },
  maxHeight: {
    type: String,
    default: "",
  },
  unknownAccount: {
    type: Boolean,
    default: false,
  },
  initialBankAccountId: {
    type: String,
    default: null,
  },
  paramsGetBankAccounts: {
    type: Object, // currency (para obtener las cuentas por medio de un 'id' de una moneda en particular)
    default: () => ({}),
  }
});

// CONSTANTS
const { t } = useI18n();
const module = "modules.payments.bankAccounts";
const bankAccountCreated = ref(false);
const form = ref({
  country: {
    name: "",
    place_id: null,
    short_name: "",
  },
  accountNumberMin: 12,
  accountNumberMax: 12,
  bank: "",
  bankName: "",
  bankObj: {},
  accountType: {
    nameFront: "",
  },
  transferMethod: {
    nameFront: "",
  },
  accountNumber: "",
  owner: {
    name: "",
    typeDocument: {
      nameFront: "",
    },
    idNumber: "",
  },
});
const unknownAccountSelected = ref(false);
const errors = ref({});
const showForm = ref(false);
const loading = ref({
  country: false,
  search: false,
  favorite: false,
});
const showInputName = ref(false);
const formWithInfo = ref(false);
const options = ref({
  country: [],
  countryOriginal: [],
  banks: [],
  accountTypes: [],
  transferMethod: [],
  typeDocuments: [],
});
const googleMapsAvailable = ref(true);

// ACTIONS
const save = async () => {
  if (invalidForm.value) return;
  else {
    let body = {
      bank: form.value.bank,
      accountType: form.value.accountType.name,
      transferMethod: form.value.transferMethod.name,
      accountNumber: form.value.accountNumber,
    };

    // Para organizaciones no se manda el user ni contact
    if (props.byUser) {
      body.contact = props.user._id;
    }

    // Inicializar `owner` si es necesario
    const needsOwner =
      form.value?.bankObj?.countryRequirements?.nameUser ||
      form.value.bankObj.countryRequirements?.documents?.length > 0;

    if (needsOwner) {
      body.owner = {};

      if (form.value?.bankObj?.countryRequirements?.nameUser) {
        body.owner.name = form.value.owner.name;
      }

      if (form.value.bankObj.countryRequirements.documents.length > 0) {
        body.owner.typeDocument = form.value.owner.typeDocument.name;
        body.owner.idNumber = form.value.owner.idNumber;
      }
    }

    if (form.value._id) {
      body.bankAccountId = form.value._id;
    }

    // Para usuarios y contactos
    if (props.byUser) {
      try {
        globalStore.loading = true;
        // Si se está editando, agregar el ID
        const resp = await paymentsStore.upsertBankAccount(body);
        if (resp.success) {
          await paymentsStore.getBankAccountsByUser(
            props.user._id,
            props.user.isContact
          );
          if (props.bankAccountSelected) {
            const pos = paymentsStore.bankAccountsByUser.findIndex(
              (b) => b._id === resp.data._id
            );
            selectedAccount(pos);
          }
          showForm.value = false;
          cleanForm();
        }
      } catch (error) {
        console.error("Error saving payment method:", error);
      } finally {
        setTimeout(() => {
          bankAccountCreated.value = true;
          globalStore.loading = false;
        }, 10);
      }
    } // Para organizaciones
    else {
      try {
        globalStore.loading = true;
        // Si se está editando, agregar el ID
        const resp = await organizationStore.upsertBankAccount(body);
        if (resp.success) {
          const res = await organizationStore.fetchCurrentOrgBankAccounts(props.paramsGetBankAccounts);
          paymentsStore.bankAccountsByUser = res?.resp || [];
          if (props.bankAccountSelected) {
            const pos = paymentsStore.bankAccountsByUser.findIndex(
              (b) => b._id === resp.data._id
            );
            selectedAccount(pos);
          }
          showForm.value = false;
          cleanForm();
        }
      } catch (error) {
        console.error("Error saving payment method:", error);
      } finally {
        setTimeout(() => {
          bankAccountCreated.value = true;
          globalStore.loading = false;
        }, 10);
      }
    }
  }
};
const changeDefault = async (pos) => {
  const currentFavorite = paymentsStore.bankAccountsByUser[pos];

  // Solo cambiar si no es el favorito actual
  if (!currentFavorite.isFavorite) {
    try {
      loading.value.favorite = true;
      let resp = null;
      // Para usuarios y contactos
      const id = currentFavorite._id;
      if (props.byUser) {
        resp = await paymentsStore.setDefaultBankAccount(id);
      } // Para organizaciones
      else {
        resp = await organizationStore.setDefaultBankAccount(id);
      }
      if (resp.success) {
        paymentsStore.bankAccountsByUser.forEach((pay, p) => {
          pay.isFavorite = pos === p;
        });
      }
    } catch (error) {
      console.error("Error changing default bank account:", error);
    } finally {
      loading.value.favorite = false;
    }
  }
};
const deletePayMethod = async (pos) => {
  try {
    globalStore.loading = true;
    // para usuario y contactos
    let resp = null;
    const id = paymentsStore.bankAccountsByUser[pos]._id;
    if (props.byUser) {
      resp = await paymentsStore.deleteBankAccountByUser(id);
    }
    // para organizaciones
    else {
      resp = await organizationStore.deleteBankAccountByUser(id);
    }
    if (resp) paymentsStore.bankAccountsByUser.splice(pos, 1);
  } catch (error) {
    console.error("Error deleting payment method:", error);
  } finally {
    globalStore.loading = false;
  }
};

// COMPUTED
const maxHeightList = computed(() => {
  if (props.maxHeight !== "") return props.maxHeight;
  return `calc(90vh - 60px - 290px ${
    userStore.showBtnBack ? "- 0px" : "+ 46px"
  })`;
});
const maxHeightListForm = computed(() => {
  return `calc(90vh - 60px - 252px ${
    userStore.showBtnBack ? "- 0px" : "+ 46px"
  })`;
});
const lang = computed(() => globalStore.lang);
const getSortedRange = computed(() => {
  const a = form.value.accountNumberMin || 12;
  const b = form.value.accountNumberMax || 12;
  if (a === b) {
    return [a];
  }
  return a < b ? [a, b] : [b, a];
});
const invalidForm = computed(() => {
  const formData = form.value;
  const opts = options.value;
  const errs = errors.value;

  const countryInvalid = formData?.country?.place_id === null;
  const bankInvalid = formData?.bank === "";
  const accountTypeInvalid = formData?.accountType?.nameFront === "";
  const transferMethodInvalid = formData?.transferMethod?.nameFront === "";

  const ownerNameInvalid = showInputName.value
    ? formData?.owner?.name.trim() === ""
    : false;

  const requiresDocs = opts?.typeDocuments?.length !== 0;

  const typeDocumentInvalid = requiresDocs
    ? formData?.owner?.typeDocument?.nameFront === ""
    : false;

  const idNumberInvalid = requiresDocs
    ? formData?.owner?.idNumber.trim() === ""
    : false;

  const accountNumberInvalid =
    formData?.accountNumber === "" ||
    (formData?.accountNumber.trim() !== "" && errs?.accountNumber === true);

  return (
    countryInvalid ||
    bankInvalid ||
    accountTypeInvalid ||
    transferMethodInvalid ||
    ownerNameInvalid ||
    typeDocumentInvalid ||
    idNumberInvalid ||
    accountNumberInvalid
  );
});

// MOUNTED
onMounted(async () => {
  globalStore.loading = true;
  try {
    const short_name = userStore?.userSession?.address?.country?.short_name;
    form.value.country = {
        name: userStore?.userSession?.address?.country?.name,
        place_id: userStore?.userSession?.address?.country?.place_id,
        short_name,
      };
  
      if (short_name) {
        await userStore.getBanksByCountry(short_name);
        options.value.banks = userStore.bankAccounts.map((bank) => ({
          ...bank,
          label: bank.name,
          img: bank.imgUrl,
        }));
        formWithInfo.value = true;
      }
  } catch (error) {
    console.error(error);
  } finally {
    globalStore.loading = false;
  }


  if (props.refresh) {
    globalStore.loading = true;
    try {
      await paymentsStore.getBankAccountsByUser(
        props.user._id,
        props.user.isContact
      );
    } catch (error) {
      console.error("Error fetching banks:", error);
    } finally {
      globalStore.loading = false;
    }
  }
  googleMapsAvailable.value = await testGoogleMapsPlaces();

  if (props.bankAccountSelected) { // si se selecciono un banco
    //  Si no hay cuentas
    if (paymentsStore.bankAccountsByUser.length === 0) {
       selectBankById("unknown");
    }

    // Si hay cuentas
    else if (paymentsStore.bankAccountsByUser.length > 0) {

      if (props.initialBankAccountId) {
        if (props.initialBankAccountId === "unknown") {
          selectBankById("unknown");
        } else {
          paymentsStore.bankAccountsByUser.forEach((pay, p) => {
            if (pay._id === props.initialBankAccountId) {
              pay.selected = true;
              emit("bankAccountSelected", pay._id);
            }
        });
        }
      } else {
        paymentsStore.bankAccountsByUser.forEach((pay, p) => {
          if (pay.isFavorite) {
            pay.selected = true;
            emit("bankAccountSelected", pay._id);
          }
        });
      }
    }
  }

  // En caso google Maps no este disponible, los países se pre cargan
  if (!googleMapsAvailable.value) {
    const countries = await globalStore.getCountries();
    options.value.countryOriginal = countries.map((country) => ({
      label: country.name[globalStore.lang],
      place_id: country.place_id || "",
      fullData: country,
    }));
  }
});

// País
const searchCountry = debounce(async (event) => {
  const toSearch = event.target.value.trim();
  cleanForm(true);
  loading.value.country = true;
  if (toSearch !== "") {
    // Si funciona Google Maps
    if (googleMapsAvailable.value) {
      const config = {
        str: toSearch,
        type: "country",
      };
      options.value.country = await searchLocationByGoogleMaps(config);
    }
    // No Funciona Google Mpas
    else {
      options.value.country = options.value.countryOriginal.filter((country) =>
        country.label
          ?.toLocaleLowerCase()
          .includes(toSearch.toLocaleLowerCase())
      );
    }
  }
  loading.value.country = false;
}, 10);
const selectedCountry = async (op) => {
  loading.value.search = true;
  const short_name = op.countryCode;
  try {
    form.value.country = {
      name: op.label,
      place_id: op.place_id,
      short_name,
    };

    if (short_name) {
      await userStore.getBanksByCountry(short_name);
      options.value.banks = userStore.bankAccounts.map((bank) => ({
        ...bank,
        label: bank.name,
        img: bank.imgUrl,
      }));
      formWithInfo.value = true;
    }
  } catch (error) {
    console.error("Error selecting country:", error);
  } finally {
    loading.value.search = false;
  }
};

// Banco
const selectedBank = debounce((data) => {
  form.value.country._id = data._id;
  form.value.bank = data._id;
  form.value.bankObj = data;
  form.value.accountNumberMin = data.accountNumberMin || 12;
  form.value.accountNumberMax = data.accountNumberMax || 12;
  // Settear Tipo de Cuenta - opciones
  options.value.accountTypes = data.accountTypes.map((aType) => ({
    ...aType,
    label: aType?.name?.[lang.value],
  }));
  // Settear Medio de Pago - opciones
  options.value.transferMethod = data.transferMethod.map((tMethod) => ({
    ...tMethod,
    label: tMethod?.name?.[lang.value],
  }));

  // Evaluar si se muestra el campo Name
  showInputName.value = data.countryRequirements.nameUser;

  // Settear Tipo de Documento - opciones
  options.value.typeDocuments = data.countryRequirements.documents.map(
    (doc) => ({ ...doc, label: doc.name[lang.value] })
  );
}, 10);
// Tipo de Cuenta
const selectedAccountType = debounce((data) => {
  form.value.accountType.name = data.name;
}, 10);
// Medio de Pago
const selectedTransferMethod = debounce((data) => {
  form.value.transferMethod.name = data.name;
}, 10);
// Tipo de Cuenta
const selectedTypeDocuments = debounce((data) => {
  form.value.owner.typeDocument.name = data.name;
}, 10);
// Limpiar Formulario
const cleanForm = (keepCountry = false) => {
  formWithInfo.value = false;
  options.value.banks = [];
  userStore.bankAccounts = [];
  errors.value = {};
  const country = keepCountry
    ? { ...form.value.country }
    : { name: "", place_id: null, short_name: "" };

  form.value = {
    country,
    contact: "",
    accountNumberMin: 12,
    accountNumberMax: 12,
    bank: "",
    bankName: "",
    bankObj: {},
    accountType: {
      nameFront: "",
    },
    transferMethod: {
      nameFront: "",
    },
    accountNumber: "",
    owner: {
      name: "",
      typeDocument: {
        nameFront: "",
      },
      idNumber: "",
    },
  };
};
// Verificar número de cuenta
const verifyAccountNumber = (event) => {
  const val = event.target.value;
  const onlyDigits = val.replace(/\D/g, "");
  form.value.accountNumber = onlyDigits;
  errors.value.accountNumber = !validateStringLength(
    getSortedRange.value,
    onlyDigits
  );
};
// Cancelar Formulario - ocultar y limpiar - mostrar lista
const cancelForm = () => {
  showForm.value = false;
  cleanForm();
};
// Editar Cuenta
const editBankAccount = async (pay) => {
  try {
    globalStore.loading = true;
    showForm.value = true;
    formWithInfo.value = true;
    const short_name = pay?.bank?.country?.code || "";

    await userStore.getBanksByCountry(short_name);
    options.value.banks = userStore.bankAccounts.map((bank) => ({
      ...bank,
      label: bank.name,
      img: bank.imgUrl,
    }));

    // Simular selección de país
    const bank = pay?.bank || {};
    console.log(pay);
    selectedBank(bank);

    // Obetner max y min caracters de accountNumber
    const currentBank = userStore.bankAccounts.find(
      (b) => b._id === pay?.bank?._id
    );
    const accountNumberMin = currentBank?.accountNumberMin || 12;
    const accountNumberMax = currentBank?.accountNumberMax || 12;

    form.value = {
      _id: pay?._id || "",
      country: {
        name: pay?.bank?.country?.name?.[lang.value] || "",
        place_id: pay?.bank?.country?.place_id || null,
        short_name,
      },
      accountNumberMin,
      accountNumberMax,
      bank: pay?.bank?._id || "",
      bankName: pay?.bank?.name || "",
      bankObj: pay?.bank || {},
      accountType: {
        nameFront: pay?.accountType?.[lang.value] || "",
        name: pay?.accountType || {},
      },
      transferMethod: {
        nameFront: pay?.transferMethod?.[lang.value] || "",
        name: pay?.transferMethod || {},
      },
      accountNumber: pay?.accountNumber || "",
      owner: {
        name: pay?.owner?.name || "",
        typeDocument: {
          nameFront: pay?.owner?.typeDocument?.[lang.value] || "",
          name: pay?.owner?.typeDocument || {},
        },
        idNumber: pay?.owner?.idNumber || "",
      },
    };
  } catch (error) {
    console.error("Error editing bank account:", error);
  } finally {
    globalStore.loading = false;
  }
};
// Rango
const validateStringLength = (range, str) => {
  const len = str.length;

  if (range.length === 2) {
    const [min, max] = range;
    return len >= min && len <= max;
  }

  if (range.length === 1) {
    return len === range[0];
  }

  // Si el array no tiene 1 o 2 elementos, puedes lanzar un error si lo deseas
  throw new Error("Invalid range array: must contain 1 or 2 elements");
};
// Cuenta seleccionada
const selectedAccount = (pos) => {
  if(pos === null) {
    paymentsStore.bankAccountsByUser.forEach((pay, p) => {
      pay.selected = false;
    });
    emit("bankAccountSelected", unknownAccountSelected.value ? "unknown" : "");
    return;
  } 

  if(props.unknownAccount) {
    unknownAccountSelected.value = false;
  }
  paymentsStore.bankAccountsByUser.forEach((pay, p) => {
    pay.selected = pos === p;
  });
  const bank = paymentsStore?.bankAccountsByUser?.[pos];
  emit("bankAccountSelected", bank?._id);
};

const selectBankById = (id) => {
  if (!id) return;

  if (id === "unknown" && props.unknownAccount) {
    paymentsStore.bankAccountsByUser.forEach((b) => (b.selected = false));
    unknownAccountSelected.value = true;
    emit("bankAccountSelected", "unknown");
    return;
  }

  const pos = paymentsStore.bankAccountsByUser.findIndex(
    (b) => b._id === id
  );

  if (pos !== -1) {
    selectedAccount(pos);
  }
};

// Función Expuesta
defineExpose({
  save,
  showForm,
  bankAccountCreated,
});
</script>

<template>
  <div class="box">
    <div class="card">
      <div class="card__header">
        <h2 v-text="t(module + '.title')"></h2>
        <div v-if="showForm" class="flex">
          <u-button
            icon="save"
            :text="t(module + '.buttons.save')"
            @click="save"
            size="s"
            type="outlined"
            :disabled="invalidForm"
          />
          <u-button-icon
            icon="close"
            @click="cancelForm"
            size="s"
            type="outlined"
          />
        </div>
      </div>
      <div class="card__form" v-if="showForm">
        <div class="card__input country">
          <span class="u u-world"></span>
          <span class="label" v-text="t(module + '.form.country.label')"></span>
          <u-search
            v-model="form.country.name"
            :placeholder="t(module + '.form.country.placeholder')"
            size="s"
            :error="errors.country"
            @input="searchCountry($event)"
            :options="options.country"
            @cleanInput="cleanForm"
            @selectedOption="selectedCountry"
            :loading="loading.country"
          />
        </div>
        <div v-if="loading.search" class="laoding">
          <u-loading :width="12" />
          <span v-text="t(module + '.msg.loading')"></span>
        </div>
        <div class="card__input">
          <span class="u u-address"></span>
          <span class="label" v-text="t(module + '.form.bank.label')"></span>
          <u-select
            v-model="form.bankName"
            :placeholder="t(module + '.form.bank.placeholder')"
            size="s"
            :error="errors.bank"
            :disabled="!form.country.place_id || options.banks.length === 0"
            :options="options.banks"
            :full-data="true"
            @full-data="selectedBank"
            :avatar="true"
            :iconOption="true"
            icon="address"
          />
        </div>
        <div class="card__input">
          <span class="u u-duplicate"></span>
          <span
            class="label"
            v-text="t(module + '.form.accountType.label')"
          ></span>
          <u-select
            v-model="form.accountType.nameFront"
            :placeholder="t(module + '.form.accountType.placeholder')"
            size="s"
            :error="errors.accountType"
            :disabled="!form.bank"
            :options="options.accountTypes"
            :full-data="true"
            @full-data="selectedAccountType"
          />
        </div>
        <div class="card__input">
          <span class="u u-credit-card"></span>
          <span
            class="label"
            v-text="t(module + '.form.payMethod.label')"
          ></span>
          <u-select
            v-model="form.transferMethod.nameFront"
            :placeholder="t(module + '.form.payMethod.placeholder')"
            size="s"
            :error="errors.transferMethod"
            :disabled="!form.bank"
            :options="options.transferMethod"
            :full-data="true"
            @full-data="selectedTransferMethod"
            :capitalize="false"
          />
        </div>
        <div
          class="card__input"
          :class="{
            card__inputWithRange:
              form.accountNumber !== '' && errors.accountNumber,
          }"
        >
          <span class="u u-hashtag"></span>
          <span
            class="label"
            v-text="t(module + '.form.accountNumber.label')"
          ></span>
          <u-input
            v-model="form.accountNumber"
            :placeholder="t(module + '.form.accountNumber.placeholder')"
            size="s"
            :error="errors.accountNumber"
            :disabled="!form.bank"
            @input="verifyAccountNumber($event)"
          />
          <div
            class="msgRange"
            v-if="form.accountNumber !== '' && errors.accountNumber"
          >
            <span class="u u-info-circle"></span>
            <span class="text truncateText">
              {{
                t(
                  module +
                    ".form.accountNumber.errors.error" +
                    getSortedRange.length,
                  {
                    count1: getSortedRange[0],
                    count2: getSortedRange?.[1] || 0,
                  }
                )
              }}
            </span>
          </div>
        </div>
        <div class="card__input" v-if="showInputName">
          <span class="u u-user-type"></span>
          <span class="label" v-text="t(module + '.form.name.label')"></span>
          <u-input
            v-model="form.owner.name"
            :placeholder="t(module + '.form.name.placeholder')"
            size="s"
            :error="errors.name"
            :disabled="!formWithInfo"
          />
        </div>
        <div class="card__input" v-if="options.typeDocuments.length > 0">
          <span class="u u-building"></span>
          <span class="label" v-text="t(module + '.form.docType.label')"></span>
          <u-select
            v-model="form.owner.typeDocument.nameFront"
            :placeholder="t(module + '.form.docType.placeholder')"
            size="s"
            :error="errors.docType"
            :disabled="!form.bank"
            :top="true"
            :options="options.typeDocuments"
            :full-data="true"
            @full-data="selectedTypeDocuments"
            :capitalize="false"
          />
        </div>
        <div class="card__input" v-if="form?.owner?.typeDocument?.nameFront">
          <span class="u u-id"></span>
          <span
            class="label"
            v-text="form?.owner?.typeDocument?.nameFront"
          ></span>
          <u-input
            v-model="form.owner.idNumber"
            :placeholder="
              t(module + '.form.docTypeOption.placeholder', {
                docTypeOption: form?.owner?.typeDocument?.nameFront,
              })
            "
            size="s"
            :error="errors.doc"
            @input="
              (e) => (form.owner.idNumber = e.target.value.replace(/\s/g, ''))
            "
          />
        </div>
      </div>
      <template v-else>
        <div
          class="card__list"
          v-if="paymentsStore.bankAccountsByUser.length > 0 || props.unknownAccount"
        >
          <div class="card__item-unknown" v-if="props.unknownAccount">
              <u-radio
                v-model="unknownAccountSelected"
                v-if="props.bankAccountSelected"
                @click="selectedAccount(null)"
                
              />
              <span class="u u-question"></span>
              <span class="text_unknown mainText">{{ t(module + '.unknown') }}</span>
          </div>
          <div
            class="card__item"
            v-for="(pay, p) in paymentsStore.bankAccountsByUser"
            :key="p"
          >
            <div
              class="card__normal"
              :style="`transform: translateX(${pay.confirm ? '-100%' : '0'});`"
            >
              <u-radio
                v-model="pay.selected"
                v-if="props.bankAccountSelected"
                @click="selectedAccount(p)"
              />
              <u-avatar
                :user="{ name: pay?.bank?.name, src: pay?.bank?.imgUrl }"
                :size="36"
              />
              <div class="card__normal-text">
                <span class="main">{{ pay?.owner?.name || "-" }}</span>
                <div class="text">
                  <span class="u u-credit-card"></span>
                  <span>{{ pay?.accountType?.[lang] || "-" }}</span>
                </div>
                <div class="text">
                  <span class="u u-hashtag"></span>
                  <span>N° {{ pay?.accountNumber || "-" }}</span>
                </div>
              </div>
              <div class="card__actions">
                <button
                  @click="changeDefault(p)"
                  :disabled="loading.favorite"
                  class="isFavorite"
                >
                  <span
                    :class="`u ${
                      pay?.isFavorite ? 'u-star-filled select' : 'u-star'
                    }`"
                  ></span>
                </button>
                <button
                  @click="editBankAccount(pay)"
                  :disabled="loading.favorite"
                  class="edit"
                >
                  <span class="u u-edit"></span>
                </button>
                <button
                  :disabled="pay?.isFavorite || loading.favorite"
                  @click="pay.confirm = true"
                  class="delete"
                >
                  <span class="u u-delete"></span>
                </button>
              </div>
            </div>
            <div
              class="card__confirm"
              :style="`transform: translateX(${pay.confirm ? '-100%' : '0'});`"
            >
              <u-avatar
                :user="{ name: pay.label, src: pay.imgUrl }"
                :size="36"
              />
              <div class="card__normal-text">
                <p class="main">
                  ¿Estás seguro de eliminar el medio de pago
                  <strong>{{ pay?.bank?.name || "-" }}</strong> con cuenta N°
                  <strong>{{ pay?.accountNumber || "-" }}</strong
                  >?
                </p>
              </div>
              <div class="flex">
                <button class="no" @click="pay.confirm = false">NO</button>
                <button class="yes" @click="deletePayMethod(p)">SI</button>
              </div>
            </div>
          </div>
        </div>
        <div v-else class="noList">
          <span v-text="t(module + '.msg.noPaymentsMethods')"></span>
        </div>
      </template>
    </div>
    <u-button
      v-if="!showForm"
      @click="
        showForm = true;
        bankAccountCreated = false;
      "
      :text="t(module + '.buttons.add')"
      icon="new"
      type="outlined"
      size="s"
      class="add"
      :disabled="loading.favorite"
    />
  </div>
</template>

<style scoped>
.box {
  width: v-bind("props.width");
  max-width: v-bind("props.maxWidth ? props.maxWidth : 'auto'");
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.card {
  background-color: var(--neutral-surface-softer);
  display: flex;
  flex-direction: column;
  gap: 10px;
  border-radius: 16px;
  padding: 12px;
  height: auto;
}
.card__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.card__list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  overflow-y: auto;
  max-height: v-bind("maxHeightList");
  padding-right: 2px;
}
.card__form {
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  max-height: v-bind("maxHeightListForm");
  padding-right: 2px;
  min-height: 300px;
}
.card__list::-webkit-scrollbar,
.card__form::-webkit-scrollbar {
  width: 8px;
  height: 8px;
  background: var(--neutral-surface-light);
  border-radius: 20px;
}
.card__list::-webkit-scrollbar-thumb,
.card__form::-webkit-scrollbar-thumb {
  background: var(--neutral-surface-subtle);
  border-radius: 5px;
}
.card__item-unknown {
  display: grid;
  grid-template-columns: 32px 36px 1fr;
  align-items: center;
  padding: 16px;
  background-color: var(--neutral-background-default);
  border-radius: 16px;
}
.card__item-unknown span.u {
  background-color: var(--secondary-surface-shadow-8a);
  padding: 8px;
  border-radius: 50%;
  width: 36px;
  height: 36px;
  font-size: 26px;
  line-height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--secondary-text-default);
}
.card__item-unknown .text_unknown {
  display: flex;
  width: 100%;
  margin-left: 12px;
}
.card__item {
  flex-shrink: 0;
  position: relative;
  height: 82px;
  overflow: hidden;
  border-radius: 16px;
  display: inline-flex;
}
.card__confirm {
  background-color: var(--neutral-surface-harder);
}
.card__normal {
  background-color: var(--neutral-background-default);
}
.card__normal,
.card__confirm {
  transition: 0.3s cubic-bezier(0.785, 0.135, 0.15, 0.86);
  flex: 0 0 100%;
  display: grid;
  align-items: center;
  gap: 12px;
  height: 82px;
  padding: 0 16px;
  box-sizing: border-box;
}
.card__confirm {
  grid-template-columns: 36px 1fr auto;
}
.card__normal {
  grid-template-columns: v-bind(
    "props.bankAccountSelected ? '20px 36px 1fr auto' : '36px 1fr auto'"
  );
}
.card__item-unknown .mainText,
.card__confirm .main,
.card__normal .main {
  font-size: 14px;
  font-weight: 600;
  line-height: 14px;
  color: var(--neutral-text-body);
}
.card__confirm .main strong {
  color: var(--primary-surface-default);
  font-weight: 700;
}
.card__confirm .main {
  line-height: 18px;
  font-weight: 400;
}
.card__normal-text {
  display: flex;
  flex-direction: column;
  gap: 3px;
}
.card__normal-text .text {
  display: flex;
  gap: 10px;
  align-items: center;
}
.card__normal-text .text span.u {
  color: var(--primary-text-default);
  font-size: 16px;
  line-height: 16px;
}
.card__normal-text .text span:not(.u) {
  font-size: 12px;
  font-weight: 400;
  line-height: 16px;
  text-align: left;
  color: var(--neutral-text-caption);
}
.card__actions {
  display: flex;
  gap: 16px;
}
.card__actions button span {
  font-size: 20px;
}
.card__actions button:disabled span {
  color: var(--neutral-text-disabled) !important;
  cursor: not-allowed;
}
.card__actions button.isFavorite span {
  color: var(--neutral-text-caption);
}
.card__actions button.isFavorite span.select {
  color: var(--secondary-text-default);
  font-size: 22px;
}
.card__actions button.edit span {
  color: var(--neutral-text-caption);
}
.card__actions button.delete span {
  color: var(--danger-text-default);
}
.card__form {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.card h2 {
  font-size: 14px;
  font-weight: 600;
  line-height: 18px;
  text-align: left;
  color: var(--neutral-text-body);
}
.card__input {
  flex-shrink: 0;
  display: grid;
  grid-template-columns: 8px 120px 1fr;
  align-items: center;
  gap: 16px;
  height: 40px;
  padding: 0 8px 0 10px;
  box-sizing: border-box;
  border-radius: 8px;
  background-color: var(--neutral-background-default);
  position: relative;
}
.card__inputWithRange {
  height: 64px;
  padding-bottom: 24px;
}
.msgRange {
  font-size: 13px;
  font-weight: 400;
  line-height: 13px;
  margin-top: 4px;
  width: calc(100% - 192px);
  position: absolute;
  bottom: 10px;
  right: 10px;
  display: flex;
  align-items: center;
  gap: 5px;
}
.card__input:not(.country) {
  opacity: v-bind("formWithInfo ? '1' : '0.5'");
}
.card__input span:not(.label) {
  color: var(--neutral-text-caption);
}
.card__input span.label {
  font-size: 12px;
  font-weight: 600;
  line-height: 18px;
  text-align: left;
  color: var(--neutral-text-caption);
}
.flex {
  display: flex;
}
.card__confirm .flex {
  gap: 10px;
}
.card__confirm button {
  background-color: var(--neutral-background-default);
  width: 30px;
  padding: 5px 0;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 600;
  transition: 0.3s cubic-bezier(0.445, 0.05, 0.55, 0.95);
}
.card__confirm button:hover {
  color: var(--bg-neutral-0) !important;
}
.card__confirm button.yes:hover {
  background-color: var(--danger-text-default);
}
.card__confirm button.no:hover {
  background-color: var(--neutral-surface-default);
}
.card__confirm button.yes {
  color: var(--danger-text-default);
}
.card__confirm button.no {
  color: var(--neutral-surface-default);
}
.add {
  width: 220px;
  margin-left: auto;
}
.card__header::v-deep(.btn) {
  transform: scale(0.8);
  border: transparent;
}
.card__input::v-deep(.containerInput input),
.card__input::v-deep(.containerSearch input),
.card__input::v-deep(input::-webkit-calendar-picker-indicator) {
  border: transparent !important;
}
.card__input::v-deep(.containerSelectInput) {
  border: var(--neutral-background-default) solid 1px !important;
}
.noList {
  height: 56px;
  display: flex;
  justify-content: center;
  align-items: center;
}
.noList span {
  color: var(--neutral-text-caption);
  font-size: 12px;
}
span,
button,
p {
  font-family: Nunito;
}
.laoding {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  height: 40px;
}
.laoding span {
  color: var(--neutral-text-caption);
  font-size: 12px;
}
</style>