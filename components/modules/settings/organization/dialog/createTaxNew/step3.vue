<script setup>
import useGlobalStore from "@/stores/global";
import useOrganizationStore from "@/stores/organization";

// STORE
const globalStore = useGlobalStore();
const organizationStore = useOrganizationStore();

//EMITS
const emit = defineEmits(["closeModal", "lockModal", "nextStep", "prevStep"]);

// PROPS
const props = defineProps({
  tax: {
    type: Object,
    default: () => {},
  },
  edit: {
    type: Boolean,
    default: false,
  },
});

const columns = computed(() => [
  {
    key: "name",
    label: t(`${moduleStep3}.tableBase.cols.col1.label`),
    width: "minmax(200px, 1fr)",
  },
  {
    key: "tag",
    label: t(`${moduleStep3}.tableBase.cols.col2.label`),
    type: "tag",
    width: "80px",
  },
  {
    key: "active",
    label: t(`${moduleStep3}.tableBase.cols.col3.label`),
    type: "checkbox",
    width: "1fr",
  },
  {
    key: "default",
    label: t(`${moduleStep3}.tableBase.cols.col4.label`),
    type: "checkbox",
    width: "1fr",
  },
]);

const rows = reactive([
  {
    id: 1,
    name: "Boleta exenta electrónica",
    tag: "BEE",
    chargeable: false,
    default: false,
  },
  {
    id: 2,
    name: "Boleta honorarios",
    tag: "BH",
    chargeable: false,
    default: false,
  },
  {
    id: 3,
    name: "Factura electrónica",
    tag: "FE",
    chargeable: false,
    default: false,
  },
  {
    id: 4,
    name: "Factura electrónica a terceros",
    tag: "FET",
    chargeable: false,
    default: false,
  },
  {
    id: 5,
    name: "Factura exenta electrónica",
    tag: "FEE",
    chargeable: false,
    default: false,
  },
  {
    id: 6,
    name: "Factura exenta a terceros",
    tag: "FETE",
    chargeable: false,
    default: false,
  },
  {
    id: 7,
    name: "Factura honorarios",
    tag: "FH",
    chargeable: false,
    default: false,
  },
  {
    id: 8,
    name: "Factura honorarios a terceros",
    tag: "FHT",
    chargeable: false,
    default: false,
  },
]);

// TRANSLATIONS
const { t } = useI18n();
const module = "modules.organizations.settings.taxes.modal.create";
const moduleStep3 = "modules.organizations.settings.taxes.modal.create.step3";

// CONSTANTS
const loadingTables = ref(false);
//form
const form = organizationStore.formCreateTax;
const type = computed(() => form.step1.type);

// FUNCTIONS

// mapear rows de la tabla
const mapDocsToRows = (docs = []) => {
  return docs.map((doc) => ({
    id: doc._id,
    name: doc.name,
    tag: doc.code ?? "-",
    active: false,
    default: false,
    activableByDefault: false,
  }));
};

const onToggle = ({ row, key, value }) => {
  row[key] = value;

  // 1️ DEFAULT
  if (key === "default") {
    if (value) {
      // default ON → active ON
      row.active = true;
      row.activableByDefault = true;
    } else {
      // default OFF → NO tocar active
      row.activableByDefault = false;
    }
  }

  //  Activable manual
  if (key === "activable" && value) {
    row.default = false;
    row.activableByDefault = false;
  }

  // Active OFF → default OFF
  if (key === "active" && !value) {
    row.default = false;
    row.activableByDefault = false;
  }
};

// Functiones de moverse entre steps
const nextStep = () => {
  emit("nextStep");
};
const prevStep = () => {
  emit("prevStep");
};
const closeModal = () => {
  emit("closeModal");
};

// CYCLES
onMounted(async () => {
  // obtener tipos de documentos compra y venta
  try {
    if (form.step3.docsLoaded) return;

    loadingTables.value = true;
    const [docsType, salesDocs] = await Promise.all([
      organizationStore.getDocsType(),
      organizationStore.getTypeSalesDocuments(),
    ]);

    if (!props.edit) {
      form.step3.purchaseDocs = mapDocsToRows(docsType);
      form.step3.salesDocs = mapDocsToRows(salesDocs);
    } else {
      const allPurchaseDocs = mapDocsToRows(docsType);
      const allSalesDocs = mapDocsToRows(salesDocs);

      form.step3.purchaseDocs = allPurchaseDocs.map((doc) => {
        const docEdit = form.step3.purchaseDocs.find((d) => d._id === doc.id);
        return {
          ...doc,
          active: docEdit?.active ?? false,
          default: docEdit?.default ?? false,
          activableByDefault: docEdit?.activableByDefault ?? false,
        };
      });

      form.step3.salesDocs = allSalesDocs.map((doc) => {
        const docEdit = form.step3.salesDocs.find((d) => d._id === doc.id);
        return {
          ...doc,
          active: docEdit?.active ?? false,
          default: docEdit?.default ?? false,
          activableByDefault: docEdit?.activableByDefault ?? false,
        };
      });
    }

    form.step3.docsLoaded = true;
  } catch (error) {
    console.error(error);
  } finally {
    loadingTables.value = false;
  }
});
</script>

<template>
  <div class="createTax">
    <div class="createTax__header">
      <div class="info">
        <span class="title">{{ t(module + ".title") }}</span>
        <span class="subtitle">{{ t(moduleStep3 + ".subTitle") }}</span>
      </div>
      <u-button-icon
        icon="close"
        class="btnIconModify"
        color="--neutral-text-caption"
        size="s"
        type="outlined"
        @click="closeModal"
      />
    </div>
    <div class="createTax__form">
      <!--CARD INFO RESUMEN-->
      <SettingsOrganizationDialogCreateTaxNewComponentsCardResumen />
      <!--TABLES-->
      <div class="tables">
        <div class="group">
          <div class="label">
            <span>{{ t(moduleStep3 + `.tables.tableDocPurchase.label`) }}</span>
            <span
              >({{ t(moduleStep3 + ".tables.tableDocPurchase.hint") }})</span
            >
          </div>
          <SettingsOrganizationDialogCreateTaxNewComponentsTableDocs
            :columns="columns"
            :rows="form.step3.purchaseDocs"
            :loading="loadingTables"
            max-height="128px"
            @toggle="onToggle"
          />
        </div>
        <div class="group">
          <div class="label">
            <span>{{ t(moduleStep3 + `.tables.tableDocSale.label`) }}</span>
            <span>({{ t(moduleStep3 + ".tables.tableDocSale.hint") }})</span>
          </div>
          <SettingsOrganizationDialogCreateTaxNewComponentsTableDocs
            :columns="columns"
            :rows="form.step3.salesDocs"
            :loading="loadingTables"
            max-height="128px"
            @toggle="onToggle"
          />
        </div>
        <SettingsOrganizationDialogCreateTaxNewComponentsCardSwitch
          v-model="form.step3.taxManual"
          :title="t(moduleStep3 + '.switchs.taxManual.label')"
        >
          <p class="body-m-r" style="color: var(--neutral-text-caption)">
            {{ t(moduleStep3 + ".switchs.taxManual.info") }}
          </p>
        </SettingsOrganizationDialogCreateTaxNewComponentsCardSwitch>
      </div>
    </div>
    <div class="createTax__footer">
      <u-button
        :text="t(module + '.buttons.back')"
        type="outlined"
        class="mainBtnModify"
        size="s"
        @click="prevStep"
      />
      <u-button
        :text="t(module + '.buttons.next')"
        class="mainBtnModify"
        size="s"
        @click="nextStep"
      />
    </div>
  </div>
</template>

<style scoped>
.createTax {
  display: grid;
  grid-template-rows: 32px 1fr 32px;
  height: 740px;
  gap: 24px;
}

.createTax__header,
.createTax__footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.createTax__form .group .label {
  display: flex;
  align-items: center;
  gap: 4px;
}

.createTax__form .group .label span:nth-child(2) {
  font-size: 12px;
  font-weight: 400;
  line-height: 16px;
  text-align: left;
  letter-spacing: 0.05em;
  color: var(--neutral-text-caption);
}

.createTax__header .info {
  display: flex;
  flex-direction: column;
  gap: 4px;
  justify-content: center;
}

.createTax__header span.title {
  font-size: 16px;
  font-weight: 600;
  line-height: 20px;
  text-align: left;
  color: var(--neutral-text-body);
}

.createTax__header span.subtitle {
  font-size: 12px;
  font-weight: 400;
  line-height: 14px;
  text-align: left;
  color: var(--neutral-text-caption);
}

.createTax__form {
  display: flex;
  flex-direction: column;
  gap: 24px;
  min-height: 0;
  overflow: hidden;
}

.createTax__form .tables {
  display: grid;
  grid-template-rows: auto auto 1fr;
  gap: 24px;
  min-height: 0;
  overflow: hidden;
}

.createTax__form .tables .group {
  display: grid;
  grid-template-rows: 16px 1fr;
  gap: 8px;
  min-height: 0;
  overflow: hidden;
}

.createTax__form .group .label span {
  font-size: 12px;
  font-weight: 600;
  line-height: 16px;
  text-align: left;
}

/* CUSTOM COMPONENTS - MODIFY */
.btnIconModify {
  border-radius: 50%;
}
.mainBtnModify {
  width: 135px;
}
</style>
