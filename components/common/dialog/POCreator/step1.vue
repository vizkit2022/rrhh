<script setup>
import { defineEmits, ref, defineProps, onMounted, computed } from "vue";
import useUserStore from "@/stores/user";
import useOutcomesStore from "@/stores/outcomes";
import useGlobalStore from "@/stores/global";
import useOrganizationStore from "@/stores/organization";
import useIncomesStore from "@/stores/incomes";
import usePaymentsStore from "@/stores/payments";

import { debounce } from "@/utils/helpers";

// Stores
const userStore = useUserStore();
const outcomesStore = useOutcomesStore();
const globalStore = useGlobalStore();
const organizationStore = useOrganizationStore();
const incomesStore = useIncomesStore();
const paymentsStore = usePaymentsStore();

// EventBus
const { $bus } = useNuxtApp();

// Emits
const emit = defineEmits(["closeModal", "changeStep", "updatedBody"]);

// Props
const props = defineProps({
  body: {
    type: Object,
    default: () => ({}),
  },
});

// Constants
const color = "--neutral-text-caption";
const secondaryColor = "--secondary-text-default";
const secondaryColorHover = "--secondary-surface-subtle";
const secondaryColorActive = "--secondary-surface-darker";
const hasSupplier = ref(false);
const sameCurrency = ref(true); // Sirve para saber si no cambie la moneda (true no cambie), (false si cambie)
const { t } = useI18n();
const module = "modules.outcomes.pages.oc.modals.buy.step1";
const buttons = "modules.outcomes.pages.oc.modals.buy.buttons";
const search = ref("");
const loading = ref(false);
const results = ref([]);
const typesUser = [
  { name: { es: "Empresa", en: "Business" }, value: "business" },
  { name: { es: "Persona", en: "Personal" }, value: "personal" },
];
const paymentsTermns = ref([]);
const conditionOfPayOptions = computed(() => {
  return paymentsTermns.value.map((item) => {
    return {
      label: item?.name?.[globalStore.lang] || "-",
      value: item._id,
      data: item,
    };
  });
});
const currenciesOptions = computed(() => {
  return outcomesStore.formPO.currencies.map((item) => {
    return {
      label: item?.name?.[globalStore.lang] || "-",
      value: item._id,
      data: item,
    };
  });
});

const titleText = computed(() => {
  const key = hasSupplier.value ? ".titleDataBuy" : ".titleSelected";
  return key;
});

// Functions
const nextStep = async () => {
  globalStore.loading = true;
  let resp = null;
  // Si no cambie la moneda, uso el getMyCurrencies ya cargado
  if (!sameCurrency.value) {
    console.log('entre y no cambie la moneda');
    // Cambie la moneda, debo hacer get del getMyCurrencies con nuevos valores
    const currencyBase = outcomesStore?.formPO?.currency?._id || null;
    if (currencyBase) {
      resp = await globalStore.getMyCurrencies(false, currencyBase);
    }
  } else {
      console.log('entre y si cambie la moneda');
      if (Object.keys(incomesStore.income).length > 0) {
        console.log('entre y si cambie la moneda y tengo incomes');
        resp = await globalStore.getMyCurrencies(false, incomesStore?.income?.currency?.default?._id);
      } else {
        console.log('entre y si cambie la moneda y no tengo incomes');
        resp = await globalStore.getMyCurrencies(false, outcomesStore?.formPO?.currency?._id);
      }
  }
  outcomesStore.formPO.currencies = [];
  if (resp) {
    outcomesStore.formPO.currencies = resp.currencies;
    outcomesStore.formPO.currencies.unshift(resp.currency);
  }
  globalStore.loading = false;
  emit("changeStep", true);
};

// Mounted
onMounted(async () => {
  if (outcomesStore.formPO.supplier._id) {
    hasSupplier.value = true;
  }

  paymentsTermns.value = await paymentsStore.getPaymentTerms();
});

const searchTimeout = ref(null);
const lastSearch = ref("");

// Buscador optimizado
const searchUsers = (e) => {
  const val = e.target.value.trim();

  results.value = [];

  // Cancelar timeout anterior
  if (searchTimeout.value) {
    clearTimeout(searchTimeout.value);
  }

  // Si el valor no cambió, no buscar
  if (val === lastSearch.value) return;

  // Nuevo timeout de espera (ej: 300 ms tras dejar de tipear)
  searchTimeout.value = setTimeout(async () => {
    if (val === "") {
      results.value = [];
      return;
    }

    lastSearch.value = val;
    loading.value = true;

    try {
      outcomesStore.formPO.processing = true;
      const resp = await userStore.findByUsersByNameOrEmail(true, true, val, {
        archived: true,
        onlyContacts: true,
      });

      results.value = resp?.length ? mapperSearchResultUsers(resp) : [];
    } catch (error) {
      console.error(error);
    } finally {
      loading.value = false;
      outcomesStore.formPO.processing = false;
    }
  }, 600);
};

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

const createSupplier = () => {
  // Aqui debo pasar los datos al store
  userStore.dataSheet.alertCustom.show = false;
  setTimeout(() => {
    userStore.showModalDataSheet = true;
    userStore.dataSheet.state = "create";
    userStore.showBtnBack = true;
    setTimeout(() => {
      userStore.dataSheet.data.data.legalName = search.value;
    }, 10);
    $bus.$on("receiveContact", (receiveContact) => {
      hasSupplier.value = true;
      outcomesStore.formPO.supplier = {
        data: {
          address: receiveContact?.data?.address ?? "",
          idNumber: receiveContact?.data?.idNumber ?? "",
          legalName: receiveContact?.data?.legalName ?? "",
          nickName: receiveContact?.data?.nickName ?? "",
          type: receiveContact?.data?.type ?? "",
          typeName: "", // Falta
          icon: "building", // Talta
        },
        email: receiveContact?.email ?? "",
        imgUrl: receiveContact?.imgUrl ?? "",
        isUser: receiveContact?.isUser ?? false,
        payment: {
          condition: receiveContact?.payment.condition,
          document: receiveContact?.payment?.document ?? "",
          documentName: getDocumentName(receiveContact?.payment?.document),
        },
        _id: receiveContact?._id ?? "", // Falta - body.user._id
      };
    });
  }, 10);
};
const selectedSupplier = async (obj) => {
  hasSupplier.value = true;
  const body = obj.oldData;
  outcomesStore.formPO.supplier = {
    data: {
      address: body?.data?.address ?? "",
      idNumber: body?.data?.idNumber ?? "",
      legalName: body?.data?.legalName ?? "",
      nickName: body?.data?.nickName ?? "",
      type: body?.data?.type ?? "",
      typeName: "", // Falta
      icon: "building", // Talta
    },
    email: body?.email ?? "",
    imgUrl: body?.imgUrl ?? "",
    payment: {
      paymentTerm: body?.payment.paymentTerm,
      condition: body?.payment.paymentTerm,
      document: body?.payment?.document ?? "",
      documentName: getDocumentName(body?.payment?.document),
    },
    _id: body?._id ?? "", // Falta - body.user._id
  };

  outcomesStore.formPO.documentType = body?.payment?.document ?? "";
  outcomesStore.formPO.documentTypeName = getDocumentName(
    body?.payment?.document,
  );

  if (outcomesStore?.formPO?.supplier?.payment?.paymentTerm) {
    const condition = paymentsTermns.value.find(
      (item) => item._id === body?.payment?.paymentTerm,
    );
    if (condition) {
      outcomesStore.formPO.paymentTerm = condition._id;
      outcomesStore.formPO.paymentTermName = condition.name[globalStore.lang];
    }
  } else {
    outcomesStore.formPO.paymentTerm = "";
    outcomesStore.formPO.paymentTermName = "";
  }

  if (outcomesStore.formPO.type === "OC" && outcomesStore.formPO.documentType) {
    const _id = outcomesStore.formPO.documentType;
    const doc = outcomesStore.documentTypes.find((d) => d._id === _id);
    if (doc) handleChangeDocument(doc);
  }
};

const getDocumentName = (id) => {
  const doc = outcomesStore.documentTypes.find((doc) => doc._id === id);
  if (doc) {
    return capitalizeName(doc.name);
  }
  return "";
};

const user = computed(() => {
  return {
    name: outcomesStore?.formPO?.supplier?.data?.legalName,
    src: outcomesStore?.formPO?.supplier?.imgUrl,
    email: outcomesStore?.formPO?.supplier?.email,
    nickName: outcomesStore?.formPO?.supplier?.data?.nickName,
  };
});

// Abrir moda de contactos
const showContact = () => {
  userStore.dataSheet.alertCustom.show = false;
  setTimeout(() => {
    const id = outcomesStore.formPO.supplier._id;
    userStore.showModalDataSheet = true;
    if (id) userStore.userDataSheetId = id;
    userStore.dataSheet.state = "edit";
    userStore.showBtnBack = true;
    $bus.$on("receiveContact", (receiveContact) => {
      outcomesStore.formPO.supplier.data = {
        legalName: receiveContact?.data?.legalName || "",
        nickName: receiveContact?.data?.nickName || "",
      };
      outcomesStore.formPO.supplier.email = receiveContact?.email || "";
    });
  }, 10);
};

const cleanSupplier = () => {
  hasSupplier.value = false;
  search.value = "";
  outcomesStore.formPO.supplier = {
    data: {
      address: "",
      idNumber: "",
      legalName: "",
      nickName: "",
      type: "",
      icon: "building",
    },
    email: "",
    imgUrl: "",
    isUser: false,
    payment: {
      condition: "",
      document: "",
      documentName: "",
    },
    _id: "",
  };
  outcomesStore.formPO.documentType = "";
  outcomesStore.formPO.documentTypeName = "";
};

const handleChangeDocument = (doc) => {
  outcomesStore.formPO.documentType = doc._id;
  outcomesStore.formPO.documentTypeName = capitalizeName(doc.name);
  outcomesStore.formPO.supplier.payment.document = doc._id;
  outcomesStore.formPO.supplier.payment.documentName = capitalizeName(doc.name);
  // outcomesStore.formPO.currency = doc?.country?.currency || {}; // No se pq cambia la moneda aqui??
};

const handleChangeCondition = (condition) => {
  outcomesStore.formPO.paymentTerm = condition.value;
  outcomesStore.formPO.paymentTermName = condition.label;
};

const handleChangeCurrency = (currency) => {
  sameCurrency.value =
    organizationStore?.organization?.currency?._id === currency.value;
  outcomesStore.formPO.currencyName = currency.label;
  outcomesStore.formPO.currency = currency.data;
};

const invalidForm = computed(() => {
  const form = outcomesStore.formPO;

  return (
    !form.supplier._id ||
    (form.type === "OC" && !form.documentType) ||
    !form.paymentTerm ||
    form.reference === ""
  );
});
</script>

<template>
  <div class="step1">
    <div class="step1__header">
      <span
        v-text="t(module + titleText, { type: outcomesStore.formPO.typeName })"
      ></span>
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
      <div class="step1__body-header">
        <u-avatar :size="76" :user="user" />
        <div v-if="hasSupplier" class="step1__body-header-snippet">
          <span class="truncateText" v-text="user.name"></span>
          <span class="truncateText" v-text="user.nickName"></span>
          <span class="truncateText" v-text="user.email"></span>
        </div>
        <u-search-by-type
          v-else
          size="s"
          style="flex-grow: 1"
          v-model="search"
          :placeholder="t(module + '.inputs.search.placeholder')"
          :options="results"
          :loading="loading"
          :showSearchIcon="true"
          :avatar="true"
          :create="true"
          :updated="false"
          :snippet="true"
          :iconSelect="null"
          :types="typesUser"
          @input="searchUsers($event)"
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
        <div v-if="hasSupplier" class="step1__body-header-actions">
          <u-button-icon
            class="editContact"
            icon="edit"
            size="s"
            @click="showContact"
          />
        </div>
        <u-button
          class=""
          style="width: auto"
          :text="t(module + '.changeProvider')"
          icon="change"
          size="s"
          type="outlined"
          @click="cleanSupplier"
          v-if="hasSupplier"
        />
      </div>
      <div class="line" v-if="hasSupplier"></div>
      <div class="step1__body-container">
        <template v-if="hasSupplier">
          <span v-text="t(module + '.subTitle')" class="subTitle"></span>
          <div class="step1__body-form">
            <div
              class="step1__body-group"
              v-if="outcomesStore.formPO.type === 'OC'"
            >
              <span class="u u-invoice"></span>
              <span v-text="t(module + '.inputs.documentType.label')"></span>
              <u-select
                v-model="outcomesStore.formPO.documentTypeName"
                :options="outcomesStore?.documentTypes || []"
                :placeholder="t(module + '.inputs.documentType.placeholder')"
                size="s"
                :full-data="true"
                @full-data="handleChangeDocument"
              />
            </div>
            <div class="step1__body-group">
              <span class="u u-open-book"></span>
              <span v-text="t(module + '.inputs.currency.label')"></span>
              <u-select
                v-model="outcomesStore.formPO.currencyName"
                :options="currenciesOptions"
                :placeholder="t(module + '.inputs.currency.placeholder')"
                :full-data="true"
                @full-data="handleChangeCurrency"
                size="s"
              />
            </div>
            <div class="step1__body-group">
              <span class="u u-open-book"></span>
              <span v-text="t(module + '.inputs.termsOfPayment.label')"></span>
              <u-select
                v-model="outcomesStore.formPO.paymentTermName"
                :options="conditionOfPayOptions"
                :placeholder="t(module + '.inputs.termsOfPayment.placeholder')"
                :full-data="true"
                @full-data="handleChangeCondition"
                size="s"
              />
            </div>
            <div class="step1__body-group">
              <span class="u u-new-project"></span>
              <span v-text="t(module + '.inputs.reference.label')"></span>
              <u-input
                v-model="outcomesStore.formPO.reference"
                :placeholder="t(module + '.inputs.reference.placeholder')"
                size="s"
              />
            </div>
            <div class="step1__body-group">
              <span class="u u-calendar"></span>
              <span v-text="t(module + '.inputs.issueDate.label')"></span>
              <u-calendar
                v-model="outcomesStore.formPO.issueDate"
                style="width: 100%"
                size="m"
                :use-iso="true"
                :error="false"
              />
            </div>
            <div class="step1__body-group">
              <span class="u u-message"></span>
              <span v-text="t(module + '.inputs.observations.label')"></span>
              <u-textarea
                v-model="outcomesStore.formPO.observation"
                :placeholder="t(module + '.inputs.observations.placeholder')"
                size="s"
                style="height: 120px"
              />
            </div>
          </div>
        </template>
      </div>
    </div>
    <div class="step1__footer">
      <u-button
        :text="t(buttons + '.cancel')"
        type="outlined"
        class="mainBtnModify"
        @action-btn="emit('closeModal')"
        size="s"
      />
      <u-button
        :text="t(buttons + '.next')"
        class="mainBtnModify"
        @click="nextStep"
        size="s"
        :disabled="invalidForm"
      />
    </div>
  </div>
</template>

<style scoped>
.step1 {
  width: min(80vw, 719px);
  height: min(80vh, 752px);
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* header */
.step1__header {
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  height: 40px;
  flex-shrink: 0;
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
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.step1__body-header {
  display: flex;
  gap: 24px;
  align-items: center;
  position: relative;
}

.step1__body-header-snippet {
  flex-grow: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.step1__body-header-snippet span {
  font-weight: 600;
  letter-spacing: 0%;
  vertical-align: middle;
  width: 210px;
}

.step1__body-header-snippet span:nth-child(1) {
  font-size: 24px;
  line-height: 36px;
  color: var(--neutral-text-body);
}

.step1__body-header-snippet span:nth-child(2) {
  font-size: 18px;
  line-height: 24px;
  color: var(--neutral-text-caption);
}

.step1__body-header-snippet span:nth-child(3) {
  font-size: 16px;
  line-height: 20px;
  color: var(--primary-text-default);
}

.step1__body-header-actions {
  position: absolute;
  width: 40px;
  height: 40px;
  left: 40px;
  top: 40px;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 8px 0 0 8px;
}

.btnIconAvatarModify {
  position: absolute;
  transform: scale(0.9);
  transition: 0.3s;
}

.btnIconAvatarModify:not(.first) {
  margin-top: -10px;
  margin-left: -10px;
}

.btnIconAvatarModify.first {
  z-index: 0;
  margin-top: 10px;
  margin-left: 10px;
}

.step1__body-header-actions:hover .btnIconAvatarModify {
  box-shadow: var(--elevation-s);
}

.step1__body-header-actions:hover .btnIconAvatarModify:not(.first) {
  transform: translate(-5px, -5px) scale(0.7);
}

.step1__body-header-actions:hover .btnIconAvatarModify.first {
  transform: translate(8px, 8px) scale(0.7);
}

.step1__body-header-actions .btnIconAvatarModify::v-deep(.u) {
  font-size: 22px !important;
}

.editContact {
  border-radius: 50%;
}

.line {
  width: 100%;
  height: 1px;
  background-color: var(--neutral-border-subtle);
  margin: 24px 0;
}

.step1__body-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 24px;
  min-height: 0;
}

.step1__body-form {
  display: flex;
  flex: 1;
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
  grid-template-columns: 16px 150px 1fr;
  gap: 10px;
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
.subTitle {
  font-weight: 600;
  font-size: 16px;
  line-height: 20px;
  letter-spacing: 0%;
  vertical-align: middle;
  color: var(--neutral-text-body);
}

/* footer */
.step1__footer {
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  height: 40px;
  flex-shrink: 0;
  padding-top: 10px;
}

/* CUSTOM COMPONENTS - MODIFY */
.btnIconModify {
  border-radius: 50%;
  color: var(--bg-neutral-500);
}

.btnIconAvatarModify {
  border-radius: 50%;
}

.mainBtnModify {
  width: 135px;
}
</style>
