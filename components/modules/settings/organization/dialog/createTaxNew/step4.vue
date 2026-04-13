<script setup>
import useGlobalStore from "@/stores/global";
import useOrganizationStore from "@/stores/organization";

// STORE
const globalStore = useGlobalStore();
const organizationStore = useOrganizationStore();

// TRANSLATIONS
const { t } = useI18n();
const module = "modules.organizations.settings.taxes.modal.create";
const moduleStep1 = "modules.organizations.settings.taxes.modal.create.step1";
const moduleStep4 = "modules.organizations.settings.taxes.modal.create.step4";

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

// CONSTANTS
//form
const form = organizationStore.formCreateTax;
const type = computed(() => form.step1.type);

// COMPUTED
// ordenar doc de vcompra y venta
const purchaseDocsSelected = computed(() =>
  (form.step3.purchaseDocs || [])
    .filter((doc) => doc.active)
    .sort((a, b) => b.default - a.default),
);

const salesDocsSelected = computed(() =>
  (form.step3.salesDocs || [])
    .filter((doc) => doc.active)
    .sort((a, b) => b.default - a.default),
);

// FUNCTIONS
// parsear porcentaje
const parsePercentage = (percentage) => {
  if (!percentage) return 0;

  const clean = String(percentage).replace(" %", "").trim();

  return clean.includes(",") || clean.includes(".")
    ? parseFloat(clean.replace(",", "."))
    : Number(clean);
};

// Functiones de moverse entre steps
const createTax = async () => {
  try {
    globalStore.loading = true;
    const body = {
      name: form.step1.name,
      code: form.step1.abbr,
      description: form.step1.description,
      typeTax: form.step1.type,
      value: parsePercentage(form.step1.percentage),
      retention: form.step1.retention,
      addToTotal: !form.step2.addToTotal,
      surchargeVariables: {
        field: form.step1.calc,
        sumPrice: {
          state: form.step2.saleValue,
        },
        sumBudget: {
          state: form.step2.budgetedValue,
        },
      },
      surchargesDocumentType: form.step3.taxManual
        ? { field: "editValue" }
        : null,
      associateDocuments: {
        docsOutcomes: form.step3.purchaseDocs.map((doc) => ({
          _id: doc.id,
          active: doc.active,
          default: doc.default,
        })),
        docsSales: form.step3.salesDocs.map((doc) => ({
          _id: doc.id,
          active: doc.active,
          default: doc.default,
        })),
      },
    };

    await organizationStore.createTax(body);
    const resp = await organizationStore.taxesByOrganization();
    organizationStore.taxes = resp;
  } catch (error) {
    console.error(`Error fetching from ${API_PATH}:`, error);
  } finally {
    globalStore.loading = false;
    emit("closeModal");
  }
};
const editTax = async () => {
  console.log("edit tax id", props.tax._id);
  try {
    globalStore.loading = true;
    const body = {
      _id: props.tax._id,
      name: form.step1.name,
      code: form.step1.abbr,
      description: form.step1.description,
      typeTax: form.step1.type,
      value: parsePercentage(form.step1.percentage),
      retention: form.step1.retention,
      addToTotal: !form.step2.addToTotal,
      surchargeVariables: {
        field: form.step1.calc,
        sumPrice: {
          state: form.step2.saleValue,
        },
        sumBudget: {
          state: form.step2.budgetedValue,
        },
      },
      surchargesDocumentType: form.step3.taxManual
        ? { field: "editValue" }
        : null,
      associateDocuments: {
        docsOutcomes: form.step3.purchaseDocs.map((doc) => ({
          _id: doc.id,
          active: doc.active,
          default: doc.default,
        })),
        docsSales: form.step3.salesDocs.map((doc) => ({
          _id: doc.id,
          active: doc.active,
          default: doc.default,
        })),
      },
    };
    await organizationStore.updateTax(body);
    const resp = await organizationStore.taxesByOrganization();
    organizationStore.taxes = resp;
  } catch (error) {
    console.error(`Error fetching from ${API_PATH}:`, error);
  } finally {
    globalStore.loading = false;
    emit("closeModal");
  }
};
const prevStep = () => {
  if (type.value === "surcharge") {
    emit("nextStep", 1);
    return;
  }
  emit("prevStep");
};
const closeModal = () => {
  emit("closeModal");
};

onBeforeMount(() => {
  if (type.value === "surcharge") {
    organizationStore.formCreateTax.step3.taxManual = false;
  }
});
</script>

<template>
  <div class="createTax">
    <div class="createTax__header">
      <div class="info">
        <span class="title">{{ t(module + ".title") }}</span>
        <span class="subtitle">{{ t(moduleStep4 + ".subTitle") }}</span>
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
      <!--CARD INFORMACION GENERAL-->
      <settings-organization-dialog-create-tax-new-components-card-info
        :title="t(moduleStep4 + '.cards.generalInfo.title')"
        icon="information"
      >
        <template v-slot:content>
          <div class="info-card">
            <div class="info-grid">
              <span class="label body-s-sb">{{
                t(moduleStep4 + ".cards.generalInfo.labels.type")
              }}</span>
              <span class="value body-s-sb">{{
                t(`${moduleStep1}.inputs.type.options.${type}.title`)
              }}</span>

              <span class="label body-s-sb"
                >{{
                  t(moduleStep4 + ".cards.generalInfo.labels.behavior")
                }}:</span
              >
              <span class="value body-s-sb">{{
                form.step1.retentionName || "-"
              }}</span>

              <span class="label body-s-sb"
                >{{ t(moduleStep4 + ".cards.generalInfo.labels.name") }}:</span
              >
              <span class="value body-s-sb">{{ form.step1.name || "-" }}</span>

              <span class="label body-s-sb"
                >{{
                  t(moduleStep4 + ".cards.generalInfo.labels.calculation")
                }}:</span
              >
              <span class="value body-s-sb">
                {{ form.step1.calcName }}
                <span class="muted body-xs-r"
                  >({{ form.step1.percentage || "-" }})</span
                ></span
              >

              <span class="label body-s-sb"
                >{{ t(moduleStep4 + ".cards.generalInfo.labels.abbr") }}:</span
              >
              <span class="value body-s-sb">{{ form.step1.abbr || "-" }}</span>

              <span class="label body-s-sb"
                >{{
                  t(moduleStep4 + ".cards.generalInfo.labels.description")
                }}:</span
              >
              <span class="value body-s-sb">{{
                form.step1.description || "-"
              }}</span>
            </div>
          </div>
        </template>
      </settings-organization-dialog-create-tax-new-components-card-info>
      <!--CARD APLICACION DEL CARGO-->
      <settings-organization-dialog-create-tax-new-components-card-info
        :title="t(moduleStep4 + '.cards.applicationPosition.title')"
        icon="calculator"
      >
        <template v-slot:content>
          <div class="info-card">
            <div class="info-grid-one">
              <span class="label body-s-sb"
                >{{
                  t(
                    moduleStep4 + ".cards.applicationPosition.labels.salePrice",
                  )
                }}:</span
              >
              <span class="value body-s-sb">{{
                form.step2.saleValueName
              }}</span>

              <span class="label body-s-sb"
                >{{
                  t(
                    moduleStep4 +
                      ".cards.applicationPosition.labels.budgetedValue",
                  )
                }}:</span
              >
              <span class="value body-s-sb">{{
                form.step2.budgetedValueName
              }}</span>

              <!-- <span class="label body-s-sb"
                >{{
                  t(
                    moduleStep4 + ".cards.applicationPosition.labels.documents",
                  )
                }}:</span
              >
              <span class="value body-s-sb">{{
                form.step2.calcPurchaseName
              }}</span> -->
            </div>
          </div>
        </template>
      </settings-organization-dialog-create-tax-new-components-card-info>
      <!--CARD DOCUMENTOS ASOCIADOS-->
      <settings-organization-dialog-create-tax-new-components-card-info
        :title="t(moduleStep4 + '.cards.associatedDocuments.title')"
        icon="invoice"
        v-if="type !== 'surcharge'"
      >
        <template v-slot:content>
          <div class="info-card">
            <div class="info-grid-docs scroll">
              <!--LISTA DE DOCUMENTOS DE COMPRA-->
              <span class="label body-s-sb"
                >{{
                  t(
                    moduleStep4 +
                      ".cards.associatedDocuments.labels.purchaseDoc",
                  )
                }}:</span
              >
              <div class="values">
                <span
                  v-for="doc in purchaseDocsSelected"
                  :key="doc.id"
                  class="value body-s-sb"
                >
                  {{ doc.name }}
                  <span v-if="doc.default" class="muted">(POR DEFECTO)</span>
                </span>

                <span
                  v-if="!purchaseDocsSelected.length"
                  class="value muted body-xs-r"
                >
                  -
                </span>
              </div>

              <!--LISTA DE DOCUMENTOS DE VENTA-->
              <span class="label body-s-sb"
                >{{
                  t(moduleStep4 + ".cards.associatedDocuments.labels.salesDoc")
                }}:</span
              >
              <div class="values">
                <span
                  v-for="doc in salesDocsSelected"
                  :key="doc.id"
                  class="value body-s-sb"
                >
                  {{ doc.name }}
                  <span v-if="doc.default" class="muted"
                    >({{
                      t(
                        `${moduleStep4}.cards.associatedDocuments.labels.default`,
                      )
                    }})</span
                  >
                </span>

                <span
                  v-if="!salesDocsSelected.length"
                  class="value muted body-xs-r"
                >
                  -
                </span>
              </div>
            </div>
          </div>
        </template>
      </settings-organization-dialog-create-tax-new-components-card-info>
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
        v-if="!props.edit"
        :text="t(module + '.buttons.create')"
        class="mainBtnModify"
        size="s"
        @click="createTax"
      />
      <u-button
        v-else
        :text="t(module + '.buttons.edit')"
        class="mainBtnModify"
        size="s"
        @click="editTax"
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

/* info cards */

.createTax__form {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.info-card {
  border-radius: 16px;
  padding: 16px 0px 16px 0px;
}

.info-grid {
  display: grid;
  grid-template-columns: max-content 1fr max-content 1fr;
  column-gap: 12px;
  row-gap: 8px;
  align-items: start;
}

.info-grid-one {
  display: grid;
  grid-template-columns: max-content 1fr;
  column-gap: 12px;
  row-gap: 8px;
  align-items: start;
}

.info-grid-docs {
  display: grid;
  grid-template-columns: max-content 1fr;
  column-gap: 12px;
  row-gap: 8px;
  height: 105px;
  align-items: start;
}

.values {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.scroll {
  max-height: 130px;
  overflow-y: auto;
  padding-right: 4px;
}

.scroll::-webkit-scrollbar {
  width: 4px;
  height: 0px;
  background: var(--neutral-surface-light);
  border-radius: 20px;
}

.scroll::-webkit-scrollbar-thumb {
  background: var(--neutral-surface-subtle);
  border-radius: 5px;
}

.label {
  color: var(--neutral-text-caption);
}

.value {
  color: var(--neutral-text-body);
}

.muted {
  color: var(--neutral-text-caption);
  font-weight: 400;
  text-align: left;
  letter-spacing: 0.05em;
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
