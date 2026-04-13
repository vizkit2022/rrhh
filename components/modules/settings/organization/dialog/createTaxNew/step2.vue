<script setup>
import { ref, defineEmits, computed, defineProps, onMounted } from "vue";
import { onlyNumbers } from "@/utils/helpers";
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

// CONSTANTS
const { t } = useI18n();
const module = "modules.organizations.settings.taxes.modal.create";
const moduleStep2 = "modules.organizations.settings.taxes.modal.create.step2";

//form
const form = organizationStore.formCreateTax;
const type = computed(() => form.step1.type);
const options = ref({
  saleValue: [
    {
      label: t(`${moduleStep2}.inputs.saleValue.options[0].label`),
      text: t(`${moduleStep2}.inputs.saleValue.options[0].text`),
      value: "toTotals",
    },
    {
      label: t(`${moduleStep2}.inputs.saleValue.options[1].label`),
      text: t(`${moduleStep2}.inputs.saleValue.options[1].text`),
      value: "toLines",
    },
    {
      label: t(`${moduleStep2}.inputs.saleValue.options[2].label`),
      text: t(`${moduleStep2}.inputs.saleValue.options[2].text`),
      value: "agencyCommission",
    },
    {
      label: t(`${moduleStep2}.inputs.saleValue.options[4].label`),
      text: t(`${moduleStep2}.inputs.saleValue.options[4].text`),
      value: "noTotal",
    },
  ],
  budgetedValue: [
    {
      label: t(`${moduleStep2}.inputs.budgetedValue.options[0].label`),
      text: t(`${moduleStep2}.inputs.budgetedValue.options[0].text`),
      value: "equalValue",
    },
    {
      label: t(`${moduleStep2}.inputs.budgetedValue.options[1].label`),
      text: t(`${moduleStep2}.inputs.budgetedValue.options[1].text`),
      value: "toLines",
    },
    {
      label: t(`${moduleStep2}.inputs.budgetedValue.options[2].label`),
      text: t(`${moduleStep2}.inputs.budgetedValue.options[2].text`),
      value: "toTotals",
    },
    {
      label: t(`${moduleStep2}.inputs.budgetedValue.options[4].label`),
      text: t(`${moduleStep2}.inputs.budgetedValue.options[4].text`),
      value: "noTotal",
    },
  ],
  calcPurchase: [
    {
      label: t(`${moduleStep2}.inputs.calcPurchase.options[0].label`),
      text: t(`${moduleStep2}.inputs.calcPurchase.options[0].text`),
      value: "toTotals",
    },
    {
      label: t(`${moduleStep2}.inputs.calcPurchase.options[1].label`),
      text: t(`${moduleStep2}.inputs.calcPurchase.options[1].text`),
      value: "equalValue",
    },
    {
      label: t(`${moduleStep2}.inputs.calcPurchase.options[2].label`),
      text: t(`${moduleStep2}.inputs.calcPurchase.options[2].text`),
      value: "noApply",
    },
  ],
});

// FUNCTIONS

// validaciones de inputs del form
const validInputForm = (prop) => {
  form.step2.errors[prop] = form.step2[prop].trim() === "";
};

// valor de venta
const fullDataSaleValue = (data) => {
  form.step2.saleValue = data.value;
  setTimeout(() => validInputForm("saleValue"), 0);
};

// valor presupuestado
const fullDataBudgetedValue = (data) => {
  form.step2.budgetedValue = data.value;
  setTimeout(() => validInputForm("budgetedValue"), 0);
};

// valor de compra
const fullDataCalcPurchase = (data) => {
  form.step2.calcPurchase = data.value;
  setTimeout(() => validInputForm("calcPurchase"), 0);
};

// Functiones de moverse entre steps
const nextStep = () => {
  let props = ["saleValueName", "budgetedValueName"];

  props.forEach((prop) => validInputForm(prop));
  if (!Object.values(form.step2.errors).includes(true)) {
    if (type.value === "surcharge") {
      emit("nextStep", 3);
      // Limpiar el loader de docs cargados para el paso 3 si es sobrecargo
      // para que se carguen de nuevo si cambia a impuesto
      organizationStore.formCreateTax.step3.docsLoaded = false;
      return;
    }
    emit("nextStep");
  }
};
const prevStep = () => {
  emit("prevStep");
};
const closeModal = () => {
  emit("closeModal");
};
</script>

<template>
  <div class="createTax">
    <div class="createTax__header">
      <div class="info">
        <span class="title">{{ t(module + ".title") }}</span>
        <span class="subtitle">{{ t(moduleStep2 + ".subTitle") }}</span>
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
      <!--FORM-->
      <div class="form">
        <div class="group">
          <div class="label">
            <span>{{ t(moduleStep2 + `.inputs.saleValue.label`) }}</span>
            <span>({{ t(moduleStep2 + ".inputs.saleValue.hint") }})</span>
          </div>
          <u-select
            :placeholder="t(moduleStep2 + '.inputs.saleValue.placeholder')"
            v-model="form.step2.saleValueName"
            :options="options.saleValue"
            :custom="true"
            :alert="form.step2.errors.saleValueName ? 'error' : ''"
            :visible-options="6"
            @full-data="fullDataSaleValue"
            :full-data="true"
            @updatedAlert="form.step2.errors.saleValueName = false"
          >
            <template v-slot:option="item">
              <div class="selectOption">
                <span class="label">{{ item.item.label }}</span>
                <span class="text">{{ item.item.text }}</span>
              </div>
            </template>
          </u-select>
        </div>
        <div class="group">
          <div class="label">
            <span>{{ t(moduleStep2 + `.inputs.budgetedValue.label`) }}</span>
            <span>({{ t(moduleStep2 + ".inputs.budgetedValue.hint") }})</span>
          </div>
          <u-select
            :placeholder="t(moduleStep2 + '.inputs.budgetedValue.placeholder')"
            v-model="form.step2.budgetedValueName"
            :options="options.budgetedValue"
            :custom="true"
            :alert="form.step2.errors.budgetedValueName ? 'error' : ''"
            :visible-options="6"
            @full-data="fullDataBudgetedValue"
            :full-data="true"
            @updatedAlert="form.step2.errors.budgetedValueName = false"
          >
            <template v-slot:option="item">
              <div class="selectOption">
                <span class="label">{{ item.item.label }}</span>
                <span class="text">{{ item.item.text }}</span>
              </div>
            </template>
          </u-select>
        </div>
        <!--OLD CALCULO EDITABLE DE DOCUMENTOS DE VENTA Y COMPRA-->
        <!-- <div class="group">
          <div class="label">
            <span>{{ t(moduleStep2 + `.inputs.calcPurchase.label`) }}</span>
            <span>({{ t(moduleStep2 + ".inputs.calcPurchase.hint") }})</span>
          </div>
          <u-select
            :placeholder="t(moduleStep2 + `.inputs.calcPurchase.placeholder`)"
            v-model="form.step2.calcPurchaseName"
            :options="options.calcPurchase"
            :custom="true"
            :alert="form.step2.errors.calcPurchaseName ? 'error' : ''"
            :visible-options="6"
            @full-data="fullDataCalcPurchase"
            :full-data="true"
            @updatedAlert="form.step2.errors.calcPurchaseName = false"
          >
            <template v-slot:option="item">
              <div class="selectOption">
                <span class="label">{{ item.item.label }}</span>
                <span class="text">{{ item.item.text }}</span>
              </div>
            </template>
          </u-select>
        </div> -->
        <SettingsOrganizationDialogCreateTaxNewComponentsCardSwitch
          v-model="form.step2.addToTotal"
          title="Excluir este cargo de las métricas"
          :disable-switch="form.step1.retention"
        >
          <i18n-t
            :keypath="moduleStep2 + '.switchs.addToTotal.info'"
            tag="p"
            class="body-m-r"
            style="color: var(--neutral-text-caption)"
          >
            <template #saleTotal>
              <strong>{{
                t(moduleStep2 + ".switchs.addToTotal.tags.saleTotal")
              }}</strong>
            </template>

            <template #budgetTotal>
              <strong>{{
                t(moduleStep2 + ".switchs.addToTotal.tags.budgetTotal")
              }}</strong>
            </template>
          </i18n-t>
          <!-- <p class="body-m-r" style="color: var(--neutral-text-caption)">
            El monto de este cargo no se considerará en las métricas de
            <strong>total de venta</strong> ni
            <strong>total presupuestado</strong>
          </p> -->
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

.createTax__form {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.createTax__form .form {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.createTax__form .form .group {
  display: grid;
  grid-template-rows: 16px 1fr;
  gap: 8px;
}

.createTax__form .group .label span {
  font-size: 12px;
  font-weight: 600;
  line-height: 16px;
  text-align: left;
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

.form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* OPTIONS - SELECT */
.selectOption {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.selectOption span:nth-child(1) {
  font-size: 14px;
  font-weight: 600;
  line-height: 18px;
  text-align: left;
  color: var(--neutral-text-body);
}
.selectOption span:nth-child(2) {
  font-size: 10px;
  font-weight: 400;
  line-height: 14px;
  text-align: left;
  color: var(--neutral-text-caption);
  text-transform: uppercase;
}
.opSelected span.truncateText,
.opSelected span.label {
  color: var(--primary-surface-darker) !important;
}
.opSelected span.text {
  color: var(--primary-surface-subtle) !important;
}

/* CUSTOM COMPONENTS - MODIFY */
.btnIconModify {
  border-radius: 50%;
}
.mainBtnModify {
  width: 135px;
}
</style>
