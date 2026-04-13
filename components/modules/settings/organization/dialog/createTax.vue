<script setup>
import { ref, defineEmits, computed, defineProps, onMounted } from "vue";
import { taxes } from "@/utils/labels/settings.json";
import { onlyNumbers } from "@/utils/helpers";
import useGlobalStore from "@/stores/global";
import useOrganizationStore from "@/stores/organization";

// STORE
const globalStore = useGlobalStore();
const organizationStore = useOrganizationStore();

//EMITS
const emit = defineEmits(["closeModal", "lockModal"]);

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
const type = ref("surcharge");
const otherForm = ref(false);
const isGlobal = ref(false);
const form = ref({
  _id: null,
  // nombre
  name: "",
  // abreviacion
  abbr: "",
  // comportamiento
  retention: "",
  retentionName: "",
  // añadir total
  addToTotal: false,
  // calculo
  calc: "",
  calcName: "",
  // porcentaje
  percentage: "",
  // calculo compra
  calcPurchase: "default",
  calcPurchaseName: t(`${module}.inputs.calcPurchase.options[0].label`),
  // descripcion
  description: "",

  // aplicacion en el valor de venta
  appliedName: "",
  applied: "",
  // Calculo del costo presupuestado
  costCalcName: "",
  costCalc: "", // si es 1 se deshabilita el checkbox
});

const errors = ref({});
const options = ref({
  behavior: [
    {
      label: t(`${module}.inputs.behavior.options[0].label`),
      text: t(`${module}.inputs.behavior.options[0].text`),
      value: true,
    },
    {
      label: t(`${module}.inputs.behavior.options[1].label`),
      text: t(`${module}.inputs.behavior.options[1].text`),
      value: false,
    },
  ],
  calc: [
    {
      label: t(`${module}.inputs.calc.options[0].label`),
      value: "percentageFix",
    },
    {
      label: t(`${module}.inputs.calc.options[1].label`),
      value: "editPercentage",
    },
    { label: t(`${module}.inputs.calc.options[2].label`), value: "editValue" },
  ],
  calcPurchase: [
    {
      label: t(`${module}.inputs.calcPurchase.options[0].label`),
      value: "default",
    },
    {
      label: t(`${module}.inputs.calcPurchase.options[1].label`),
      value: "editValue",
    },
  ],
  applied: [
    {
      label: t(`${module}.inputs.additionalText1.options[0].label`),
      value: "toTotals",
    },
    {
      label: t(`${module}.inputs.additionalText1.options[1].label`),
      value: "toLines",
    },
    {
      label: t(`${module}.inputs.additionalText1.options[3].label`),
      value: "noTotal",
    },
    {
      label: t(`${module}.inputs.additionalText1.options[5].label`),
      value: "agencyCommission",
    },
  ],
  costCalc: [
    {
      label: t(`${module}.inputs.additionalText2.options[0].label`),
      value: "toTotals",
    },
    {
      label: t(`${module}.inputs.additionalText2.options[1].label`),
      value: "equalValue",
    },
    {
      label: t(`${module}.inputs.additionalText2.options[3].label`),
      value: "noTotal",
    },
    {
      label: t(`${module}.inputs.additionalText2.options[4].label`),
      value: "toLines",
    },
  ],
});

// FUNCTIONS
const changeType = (t) => {
  console.log("change", t, isGlobal);
  type.value = t;
  // if (!isGlobal) {
  // }
};

const inputPercentage = () => {
  let { percentage } = form.value;

  validInputForm("percentage");

  return onlyNumbers(percentage);
};

const blurPercentage = () => {
  let { percentage } = form.value;

  errors.value.percentage = false;

  if (typeof percentage !== "string") return "0,001 %";

  let cleanedValue = "";
  let hasDecimal = false;

  for (let i = 0; i < percentage.length; i++) {
    const char = percentage[i];

    if (char === "." || char === ",") {
      if (!hasDecimal) {
        cleanedValue += ".";
        hasDecimal = true;
      }
    } else {
      cleanedValue += char;
    }
  }

  let numericValue = parseFloat(cleanedValue);
  if (isNaN(numericValue) || numericValue <= 0) return "0,001 %";
  if (numericValue > 100) return "100 %";

  if (!hasDecimal) return numericValue.toString() + " %";

  return numericValue.toFixed(3).replace(".", ",") + " %";
};

const inputAbbr = () => {
  let abbr = form.value.abbr.trim();
  if (abbr.length > 6) {
    abbr = abbr.slice(0, 6);
  }
  return abbr.toLocaleUpperCase();
};

const validInputForm = (prop) => {
  errors.value[prop] = form.value[prop].trim() === "";
};

const fullDataBehavior = (data) => {
  form.value.retention = data.value;

  if (data.value) {
    // Si es retención, por defecto en false
    form.value.addToTotal = false;
  } else {
    // Si es valor agregado, por defecto en true
    form.value.addToTotal = true;
  }

  setTimeout(() => validInputForm("retentionName"), 0);
};

const fullDataCalc = (data) => {
  console.log("entra aqui");
  form.value.calc = data.value;
  if (data.value === "editPercentage") {
    // solo pasa si la forma de pago es "Monto ingresado manualmente"
    form.value.percentage = "";
    errors.value.percentage = false;
  }
  setTimeout(() => validInputForm("calcName"), 0);
};

const fullDataCalcPurchase = (data) => {
  form.value.calcPurchase = data.value;
  setTimeout(() => validInputForm("calcPurchaseName"), 0);
};

const fullDataApplied = (data) => {
  form.value.applied = data.value;
  setTimeout(() => validInputForm("appliedName"), 0);
};

const fullDataCostCalc = (data) => {
  form.value.costCalc = data.value;
  setTimeout(() => validInputForm("costCalcName"), 0);
};

const nextDefault = () => {
  let props = ["name", "retentionName", "calcName", "percentage"];
  if (form.value.calc === "editPercentage") props.pop();
  props.forEach((prop) => validInputForm(prop));
  if (!Object.values(errors.value).includes(true)) {
    otherForm.value = true;
  }
};

const create = async () => {
  const props = ["appliedName", "costCalcName"];
  props.forEach((prop) => validInputForm(prop));

  if (!Object.values(errors.value).includes(true)) {
    let body = {
      name: form.value.name,
      code: form.value.abbr,
      description: form.value.description,
      typeTax: type.value,
      value: (() => {
        const percentage = form.value.percentage.replace(" %", "");
        return percentage.includes(",") || percentage.includes(".")
          ? parseFloat(percentage.replace(",", "."))
          : Number(percentage);
      })(),
      retention: form.value.retention,
      addToTotal: form.value.addToTotal,

      surchargeVariables: {
        field: form.value.calc,
        sumPrice: { state: form.value.applied },
        sumBudget: { state: form.value.costCalc },
      },
      surchargesDocumentType:
        form.value.calcPurchase === "editValue" ? { field: "editValue" } : null,
    };

    globalStore.loading = true;

    if (form.value._id) body._id = form.value._id;

    await organizationStore[form.value._id ? "updateTax" : "createTax"](body);

    const resp = await organizationStore.taxesByOrganization();
    organizationStore.taxes = resp;

    emit("closeModal");
    globalStore.loading = false;
  }
};

const createSingle = async () => {
  console.log("entro al single");
  let props = ["name", "retentionName", "calcName"];
  props.forEach((prop) => validInputForm(prop));
  if (!Object.values(errors.value).includes(true)) {
    let body = {
      name: form.value.name,
      code: form.value.abbr,
      description: form.value.description,
      typeTax: type.value,
      value: 0,
      retention: form.value.retention,
      addToTotal: form.value.addToTotal,
      surchargeVariables: {
        field: form.value.calc,
      },
    };
    globalStore.loading = true;
    if (form.value._id) body._id = form.value._id;
    await organizationStore[form.value._id ? "updateTax" : "createTax"](body);
    const resp = await organizationStore.taxesByOrganization();
    organizationStore.taxes = resp;
    emit("closeModal");
    globalStore.loading = false;
  }
};

const formatData = (data) => {
  return {
    _id: data?._id || null,
    name: data?.name || "",
    abbr: data?.code || "",
    retention: data?.retention || false,
    retentionName: getName(data?.retention || false, "behavior"),
    addToTotal: data?.addToTotal || false,
    calc: data?.surchargeVariables?.field || "",
    calcName: getName(data?.surchargeVariables?.field || "", "calc"),
    percentage: data?.value + " %",
    calcPurchase:
      data?.surchargesDocumentType?.field === "null" ||
      !data?.surchargesDocumentType?.field
        ? "default"
        : data.surchargesDocumentType.field,
    calcPurchaseName: getName(
      data?.surchargesDocumentType?.field === "null" ||
        !data?.surchargesDocumentType?.field
        ? "default"
        : data.surchargesDocumentType.field,
      "calcPurchase"
    ),
    description: data?.description || "",

    appliedName: getName(
      data?.surchargeVariables?.sumPrice?.state || "",
      "applied"
    ),
    applied: data?.surchargeVariables?.sumPrice?.state || "",
    costCalcName: getName(
      data?.surchargeVariables?.sumBudget?.state || "",
      "costCalc"
    ),
    costCalc: data?.surchargeVariables?.sumBudget?.state || "",
  };
};

const getName = (name, prop) => {
  if (String(name).trim() !== "") {
    const option = options.value[prop].find((op) => op.value === name);
    return option?.label ?? "";
  }
  return "";
};

// Computed
const percentageComputed = computed(() => {
  if (form.value.percentage === "") {
    return "";
  }
  return form.value.percentage;
});

// Mounted
onMounted(() => {
  document.addEventListener("keydown", (e) => {
    if (["Escape", "Esc"].includes(e.key)) {
      if (!globalStore.loading) emit("closeModal");
    }
  });

  if (props.edit) {
    form.value = formatData(props.tax);
    type.value = props.tax.typeTax;
    isGlobal.value = props.tax.global;
  }
});
</script>

<template>
  <div class="createTax">
    <div class="createTaxt__header">
      <span class="title">{{ t(module + ".title") }}</span>
      <u-button-icon
        icon="close"
        class="btnIconModify"
        color="--neutral-text-caption"
        size="s"
        type="outlined"
        @action-btn="emit('closeModal')"
      />
    </div>
    <div class="createTaxt__form">
      <template v-if="!otherForm">
        <div class="group">
          <div class="label">
            <span>{{ t(module + ".inputs.type.label") }}</span>
          </div>
          <div class="cards">
            <button
              :class="{ card: true, selected: type === 'tax' }"
              @click="changeType('tax')"
              :disabled="isGlobal"
            >
              <img src="/img/tax.svg" alt="tax" />
              <div>
                <span>{{ t(module + ".inputs.type.options.tax.title") }}</span>
                <p>{{ t(module + ".inputs.type.options.tax.text") }}</p>
              </div>
            </button>
            <button
              :class="{ card: true, selected: type === 'surcharge' }"
              @click="changeType('surcharge')"
              :disabled="isGlobal"
            >
              <img src="/img/fee.svg" alt="" />
              <div>
                <span>{{
                  t(module + ".inputs.type.options.surcharge.title")
                }}</span>
                <p>{{ t(module + ".inputs.type.options.surcharge.text") }}</p>
              </div>
            </button>
          </div>
        </div>
        <div class="col4-1">
          <div class="group">
            <div class="label">
              <span>{{ t(module + `.inputs.name.${type}.label`) }}</span>
            </div>
            <u-input
              :placeholder="t(module + `.inputs.name.${type}.placeholder`)"
              v-model="form.name"
              @input="validInputForm('name')"
              :error="errors.name"
              :disabled="isGlobal"
            />
          </div>
          <div class="group">
            <div class="label">
              <span>{{ t(module + ".inputs.abbr.label") }}</span>
              <span>({{ t(module + ".inputs.optional") }})</span>
            </div>
            <u-input
              v-model="form.abbr"
              :placeholder="t(module + '.inputs.abbr.placeholder')"
              @input="form.abbr = inputAbbr()"
              :disabled="isGlobal"
            />
          </div>
        </div>

        <div class="col4-1" v-if="form.retentionName">
          <div class="group">
            <div class="label">
              <span>{{ t(module + `.inputs.behavior.${type}.label`) }}</span>
            </div>
            <u-select
              :placeholder="t(module + `.inputs.behavior.${type}.placeholder`)"
              :custom="true"
              :options="options.behavior"
              v-model="form.retentionName"
              :full-data="true"
              @full-data="fullDataBehavior"
              :alert="errors.retentionName ? 'error' : ''"
              @updatedAlert="errors.retentionName = false"
              :disabled="isGlobal"
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
              <span>{{ t(module + ".inputs.addToTotal.label") }}</span>
            </div>
            <div class="groupCheckbox">
              <u-checkbox
                v-model="form.addToTotal"
                :disabled="form.retention"
              />
            </div>
          </div>
        </div>

        <div class="group" v-else>
          <div class="label">
            <span>{{ t(module + `.inputs.behavior.${type}.label`) }}</span>
          </div>
          <u-select
            :placeholder="t(module + `.inputs.behavior.${type}.placeholder`)"
            :custom="true"
            :options="options.behavior"
            v-model="form.retentionName"
            :full-data="true"
            @full-data="fullDataBehavior"
            :alert="errors.retentionName ? 'error' : ''"
            @updatedAlert="errors.retentionName = false"
            :disabled="isGlobal"
          >
            <template v-slot:option="item">
              <div class="selectOption">
                <span class="label">{{ item.item.label }}</span>
                <span class="text">{{ item.item.text }}</span>
              </div>
            </template>
          </u-select>
        </div>

        <div class="col4-1">
          <div class="group">
            <div class="label">
              <span>{{ t(module + `.inputs.calc.${type}.label`) }}</span>
            </div>
            <u-select
              :placeholder="t(module + `.inputs.calc.${type}.placeholder`)"
              :options="options.calc"
              v-model="form.calcName"
              :full-data="true"
              @full-data="fullDataCalc"
              :alert="errors.calcName ? 'error' : ''"
              @updatedAlert="errors.calcName = false"
              :disabled="isGlobal"
            />
          </div>
          <div class="group">
            <div class="label">
              <span>{{ t(module + ".inputs.percentage.label") }}</span>
            </div>
            <u-input
              v-model="form.percentage"
              :placeholder="t(module + '.inputs.percentage.placeholder')"
              :align="'right'"
              @input="form.percentage = inputPercentage()"
              @focus="form.percentage = form.percentage.replace(' %', '')"
              @blur="form.percentage = blurPercentage()"
              :error="errors.percentage"
              :disabled="isGlobal || form.calc === 'editValue'"
            />
          </div>
        </div>
        <div class="col4-1">
          <div class="group">
            <div class="label">
              <span>{{
                t(module + `.inputs.calcPurchase.${type}.label`)
              }}</span>
            </div>
            <u-select
              :placeholder="
                t(module + `.inputs.calcPurchase.${type}.placeholder`)
              "
              :options="options.calcPurchase"
              v-model="form.calcPurchaseName"
              :full-data="true"
              @full-data="fullDataCalcPurchase"
              :disabled="isGlobal"
            />
          </div>
        </div>
        <div class="group groupTextarea">
          <div class="label">
            <span>{{ t(module + `.inputs.description.${type}.label`) }}</span>
            <span>({{ t(module + ".inputs.optional") }})</span>
          </div>
          <u-textarea
            :placeholder="t(module + `.inputs.description.${type}.placeholder`)"
            v-model="form.description"
            :disabled="isGlobal"
          />
        </div>
      </template>
      <template v-else>
        <div class="resumen">
          <span class="main"
            >{{ form.name }}
            <strong v-if="form.abbr">({{ form.abbr }})</strong></span
          >
          <div class="percentage">
            <span>{{ form.retentionName }}</span>
            <span v-if="percentageComputed">{{ percentageComputed }}</span>
          </div>
        </div>
        <div class="group">
          <div class="label">
            <span>{{ t(module + `.inputs.additionalText1.label`) }}</span>
          </div>
          <u-select
            :placeholder="t(module + '.inputs.additionalText1.placeholder')"
            :custom="true"
            :options="options.applied"
            v-model="form.appliedName"
            :full-data="true"
            @full-data="fullDataApplied"
            :alert="errors.appliedName ? 'error' : ''"
            @updatedAlert="errors.appliedName = fasle"
            :disabled="isGlobal"
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
            <span>{{ t(module + `.inputs.additionalText2.label`) }}</span>
          </div>
          <u-select
            :placeholder="t(module + '.inputs.additionalText2.placeholder')"
            :custom="true"
            :options="options.costCalc"
            v-model="form.costCalcName"
            :full-data="true"
            @full-data="fullDataCostCalc"
            :alert="errors.costCalcName ? 'error' : ''"
            @updatedAlert="errors.costCalcName = fasle"
            :disabled="isGlobal"
          >
            <template v-slot:option="item">
              <div class="selectOption">
                <span class="label">{{ item.item.label }}</span>
                <span class="text">{{ item.item.text }}</span>
              </div>
            </template>
          </u-select>
        </div>
      </template>
    </div>
    <div class="createTaxt__footer">
      <template v-if="!otherForm">
        <div>
          <u-button
            v-if="props.edit"
            :text="t(module + '.buttons.cancel')"
            type="outlined"
            class="mainBtnModify"
            size="s"
          />
        </div>
        <u-button
          :text="t(module + '.buttons.next')"
          class="mainBtnModify"
          size="s"
          @click="nextDefault"
          v-if="form.calc !== 'editValue'"
        />
        <u-button
          :text="t(module + `.buttons.${props.edit ? 'edit' : 'create'}`)"
          class="mainBtnModify"
          size="s"
          @click="createSingle"
          v-else
        />
      </template>
      <template v-else>
        <u-button
          :text="t(module + '.buttons.back')"
          type="outlined"
          class="mainBtnModify"
          size="s"
          @click="otherForm = false"
        />
        <u-button
          v-if="!isGlobal"
          :text="t(module + `.buttons.${props.edit ? 'edit' : 'create'}`)"
          class="mainBtnModify"
          size="s"
          @click="create"
        />
      </template>
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

.createTaxt__header,
.createTaxt__footer,
.createTaxt__form .group .label {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.createTaxt__header span.title {
  font-size: 16px;
  font-weight: 600;
  line-height: 20px;
  text-align: left;
  color: var(--neutral-text-body);
}

/* Form */
.createTaxt__form {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.createTaxt__form .group {
  display: grid;
  grid-template-rows: 16px 1fr;
  gap: 8px;
}

.createTaxt__form .col4-1 {
  display: grid;
  grid-template-columns: 4fr 1.2fr;
  gap: 20px;
}

.groupCheckbox {
  display: flex;
  align-items: center;
}

.groupTextarea {
  flex-grow: 1;
}

.groupTextarea .containerTextarea {
  height: 95%;
}

.createTaxt__form .group .label span {
  font-size: 12px;
  font-weight: 600;
  line-height: 16px;
  text-align: left;
}

.createTaxt__form .group span:nth-child(1) {
  color: var(--neutral-text-body);
}
.createTaxt__form .group span:nth-child(2) {
  color: var(--neutral-text-caption);
}
.group .info {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 16px 0 5px;
}
.group .info p {
  font-size: 14px;
  font-weight: 400;
  line-height: 14px;
  text-align: left;
  padding-top: 2px;
  color: var(--neutral-text-body);
}
.group .info p.disabled {
  opacity: 0.5;
}
.group .info p strong {
  font-size: 12px;
  font-weight: 400;
  line-height: 12px;
  text-align: left;
  color: var(--neutral-text-caption);
  margin-left: 10px;
  text-transform: uppercase;
}

/* Cards */
.cards {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
}

.cards button {
  border: 1px solid var(--neutral-border-subtle);
  border-radius: 16px;
  padding: 16px;
  box-sizing: border-box;
  box-shadow: var(--elevation-xs);
  display: grid;
  grid-template-columns: 100px 1fr;
  gap: 16px;
  background-color: var(--neutral-background-default);
  transition: 0.3s ease-in;
}

.cards button:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.cards button.selected {
  background-color: var(--primary-surface-shadow-8a);
  border: 1px solid var(--primary-border-subtle);
}
.cards button:hover {
  border: 1px solid var(--primary-border-light);
}

.cards button img {
  height: 100px;
  width: 100px;
}

.cards button div {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.cards button span {
  font-size: 14px;
  font-weight: 600;
  line-height: 18px;
  text-align: left;
  color: var(--neutral-text-body);
}

.cards button p {
  font-size: 12px;
  font-weight: 600;
  line-height: 16px;
  text-align: left;
  color: var(--neutral-text-caption);
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

/* RESUMEN */
.resumen {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-radius: 8px;
  padding: 16px;
  box-sizing: border-box;
  box-shadow: var(--elevation-xs);
  border: 1px solid var(--neutral-border-subtle);
}
.resumen .main {
  font-weight: 600;
  font-size: 14px;
  line-height: 18px;
  color: var(--primary-text-default);
}
.resumen .main strong {
  font-weight: 400;
  font-size: 14px;
  line-height: 18px;
  color: var(--neutral-text-caption);
}
.resumen .percentage {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}
.resumen .percentage span:nth-child(1) {
  font-weight: 400;
  font-size: 10px;
  line-height: 14px;
  color: var(--neutral-text-caption);
  text-transform: uppercase;
}
.resumen .percentage span:nth-child(2) {
  font-weight: 600;
  font-size: 14px;
  line-height: 18px;
  color: var(--neutral-text-body);
}

/* CUSTOM COMPONENTS - MODIFY */
.btnIconModify {
  border-radius: 50%;
}
.mainBtnModify {
  width: 135px;
}
</style>
