<script setup>
import { ref, defineEmits, computed, defineProps, onMounted } from "vue";
import { onlyNumbers } from "@/utils/helpers";
import useGlobalStore from "@/stores/global";
import useOrganizationStore from "@/stores/organization";

// STORE
const globalStore = useGlobalStore();
const organizationStore = useOrganizationStore();

//EMITS
const emit = defineEmits(["closeModal", "lockModal", "nextStep"]);

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
const moduleStep1 = "modules.organizations.settings.taxes.modal.create.step1";

// form
const form = organizationStore.formCreateTax;
const type = computed(() => form.step1.type);
const otherForm = ref(false);
const options = ref({
  behavior: [
    {
      label: t(`${moduleStep1}.inputs.behavior.options[0].label`),
      text: t(`${moduleStep1}.inputs.behavior.options[0].text`),
      value: true,
    },
    {
      label: t(`${moduleStep1}.inputs.behavior.options[1].label`),
      text: t(`${moduleStep1}.inputs.behavior.options[1].text`),
      value: false,
    },
  ],
  calc: [
    {
      label: t(`${moduleStep1}.inputs.calc.options[0].label`),
      value: "percentageFix",
    },
    {
      label: t(`${moduleStep1}.inputs.calc.options[1].label`),
      value: "editPercentage",
    },
    {
      label: t(`${moduleStep1}.inputs.calc.options[2].label`),
      value: "editValue",
    },
  ],
  applied: [
    {
      label: t(`${moduleStep1}.inputs.additionalText1.options[0].label`),
      value: "toTotals",
    },
    {
      label: t(`${moduleStep1}.inputs.additionalText1.options[1].label`),
      value: "toLines",
    },
    {
      label: t(`${moduleStep1}.inputs.additionalText1.options[3].label`),
      value: "noTotal",
    },
    {
      label: t(`${moduleStep1}.inputs.additionalText1.options[5].label`),
      value: "agencyCommission",
    },
  ],
  costCalc: [
    {
      label: t(`${moduleStep1}.inputs.additionalText2.options[0].label`),
      value: "toTotals",
    },
    {
      label: t(`${moduleStep1}.inputs.additionalText2.options[1].label`),
      value: "equalValue",
    },
    {
      label: t(`${moduleStep1}.inputs.additionalText2.options[3].label`),
      value: "noTotal",
    },
    {
      label: t(`${moduleStep1}.inputs.additionalText2.options[4].label`),
      value: "toLines",
    },
  ],
});

// FUNCTIONS
//Funtions del formulario

// name form
const changeType = (typeCard) => {
  form.step1.type = typeCard;
};

// abbr form
const inputAbbr = () => {
  let abbr = form.step1.abbr.trim();
  if (abbr.length > 3) {
    abbr = abbr.slice(0, 3);
  }
  return abbr.toLocaleUpperCase();
};

// validaciones de inputs del form
const validInputForm = (prop) => {
  form.step1.errors[prop] = form.step1[prop].trim() === "";
};

// comportamiento
const fullDataBehavior = (data) => {
  form.step1.retention = data.value;

  if (data.value) {
    // Si es retención, por defecto en false
    form.step2.addToTotal = false;
  } else {
    // Si es valor agregado, por defecto en true
    form.step2.addToTotal = true;
  }

  setTimeout(() => validInputForm("retentionName"), 0);
};

// forma de calculo
const fullDataCalc = (data) => {
  form.step1.calc = data.value;
  if (data.value === "editPercentage") {
    // solo pasa si la forma de pago es "Monto ingresado manualmente"
    form.step1.percentage = "";
    form.step1.errors.percentage = false;
  }
  setTimeout(() => validInputForm("calcName"), 0);
};

// porcentaje
const inputPercentage = () => {
  let { percentage } = form.step1;

  validInputForm("percentage");

  return onlyNumbers(percentage);
};

const blurPercentage = () => {
  let { percentage } = form.step1;

  form.step1.errors.percentage = false;

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

// Functiones de moverse entre steps
const nextStep = () => {
  let props = ["name", "retentionName", "calcName", "percentage"];

  if (form.step1.calc === "editValue") props.pop();

  props.forEach((prop) => validInputForm(prop));
  if (!Object.values(form.step1.errors).includes(true)) {
    emit("nextStep");
  }
};
const closeModal = () => {
  emit("closeModal");
};

// CYCLE LIFE

const handleEsc = (event) => {
  if (event.key === "Escape") {
    emit("closeModal");
  }
};

onMounted(() => {
  document.addEventListener("keydown", handleEsc);
});

onUnmounted(() => {
  document.removeEventListener("keydown", handleEsc);
});
</script>

<template>
  <div class="createTax">
    <div class="createTax__header">
      <span class="title">{{ t(module + ".title") }}</span>
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
      <!--Grupo de cards de tipos de cargo-->
      <div class="group">
        <div class="label">
          <span>{{ t(moduleStep1 + ".inputs.type.label") }}</span>
        </div>
        <!--Cards de tipos de impuesto-->
        <div class="cards">
          <!--Boton de tipo de impuesto-->
          <button
            :class="{ card: true, selected: type === 'tax' }"
            @click="changeType('tax')"
            @input="validInputForm('name')"
          >
            <img
              src="/img/tax.svg"
              alt="tax"
              style="width: 64px; height: 64px"
            />
            <div>
              <span>{{
                t(moduleStep1 + ".inputs.type.options.tax.title")
              }}</span>
              <p>{{ t(moduleStep1 + ".inputs.type.options.tax.text") }}</p>
            </div>
          </button>
          <!--Boton de tipo sorbrecargo-->
          <button
            :class="{ card: true, selected: type === 'surcharge' }"
            @click="changeType('surcharge')"
          >
            <div class="contain_img">
              <img
                src="/img/fee.svg"
                alt=""
                style="width: 64px; height: 64px"
              />
            </div>
            <div>
              <span>{{
                t(moduleStep1 + ".inputs.type.options.surcharge.title")
              }}</span>
              <p>
                {{ t(moduleStep1 + ".inputs.type.options.surcharge.text") }}
              </p>
            </div>
          </button>
        </div>
      </div>
      <!--INPUTS -> NOMBRE Y ABREVIATURA-->
      <div class="col4-1">
        <div class="group">
          <div class="label">
            <span>{{ t(moduleStep1 + `.inputs.name.${type}.label`) }}</span>
          </div>
          <u-input
            :placeholder="t(moduleStep1 + `.inputs.name.${type}.placeholder`)"
            v-model="form.step1.name"
            @input="validInputForm('name')"
            :error="form.step1.errors.name"
          />
        </div>
        <div class="group">
          <div class="label">
            <span>{{ t(moduleStep1 + ".inputs.abbr.label") }}</span>
            <span>({{ t(moduleStep1 + ".inputs.optional") }})</span>
          </div>
          <u-input
            :placeholder="t(moduleStep1 + '.inputs.abbr.placeholder')"
            v-model="form.step1.abbr"
            @input="form.step1.abbr = inputAbbr()"
          />
        </div>
      </div>
      <!--OlD comportamiento-->
      <!--INPUTS -> COMPORTAMIENTO y AGREGAR A TOTAL-->
      <!-- <div class="col4-1" v-if="form.step1.retentionName">
        <div class="group">
          <div class="label">
            <span>{{ t(moduleStep1 + `.inputs.behavior.${type}.label`) }}</span>
          </div>
          <u-select
            :placeholder="
              t(moduleStep1 + `.inputs.behavior.${type}.placeholder`)
            "
            :custom="true"
            :options="options.behavior"
            v-model="form.step1.retentionName"
            :full-data="true"
            @full-data="fullDataBehavior"
            :alert="form.step1.errors.retentionName ? 'error' : ''"
            @updatedAlert="form.step1.errors.retentionName = false"
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
            <span>{{ t(moduleStep1 + ".inputs.addToTotal.label") }}</span>
          </div>
          <div class="groupCheckbox">
            <u-checkbox
              v-model="form.step1.addToTotal"
              :disabled="form.step1.retention"
            />
          </div>
        </div>
      </div> -->
      <!--INPUTS -> COMPORTAMIENTO-->
      <!-- <div class="group" v-else>
        <div class="label">
          <span>{{ t(moduleStep1 + `.inputs.behavior.${type}.label`) }}</span>
        </div>
        <u-select
          :placeholder="t(moduleStep1 + `.inputs.behavior.${type}.placeholder`)"
          :custom="true"
          :options="options.behavior"
          v-model="form.step1.retentionName"
          :full-data="true"
          @full-data="fullDataBehavior"
          :alert="form.step1.errors.retentionName ? 'error' : ''"
          @updatedAlert="form.step1.errors.retentionName = false"
        >
          <template v-slot:option="item">
            <div class="selectOption">
              <span class="label">{{ item.item.label }}</span>
              <span class="text">{{ item.item.text }}</span>
            </div>
          </template>
        </u-select>
      </div> -->
      <!--INPUTS -> FORMA DE CALCULO-->
      <div class="group">
        <div class="label">
          <span>{{ t(moduleStep1 + `.inputs.behavior.${type}.label`) }}</span>
        </div>
        <u-select
          :placeholder="t(moduleStep1 + `.inputs.behavior.${type}.placeholder`)"
          :custom="true"
          :options="options.behavior"
          v-model="form.step1.retentionName"
          :full-data="true"
          @full-data="fullDataBehavior"
          :alert="form.step1.errors.retentionName ? 'error' : ''"
          @updatedAlert="form.step1.errors.retentionName = false"
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
            <span>{{ t(moduleStep1 + `.inputs.calc.${type}.label`) }}</span>
          </div>
          <u-select
            :placeholder="t(moduleStep1 + `.inputs.calc.${type}.placeholder`)"
            :options="options.calc"
            v-model="form.step1.calcName"
            :full-data="true"
            @full-data="fullDataCalc"
            :alert="form.step1.errors.calcName ? 'error' : ''"
            @updatedAlert="form.step1.errors.calcName = false"
          />
        </div>
        <div class="group">
          <div class="label">
            <span>{{ t(moduleStep1 + ".inputs.percentage.label") }}</span>
          </div>
          <u-input
            :placeholder="t(moduleStep1 + '.inputs.percentage.placeholder')"
            v-model="form.step1.percentage"
            :align="'right'"
            @input="form.step1.percentage = inputPercentage()"
            @focus="
              form.step1.percentage = form.step1.percentage.replace(' %', '')
            "
            @blur="form.step1.percentage = blurPercentage()"
            :disabled="form.step1.calc === 'editValue'"
            :error="form.step1.errors.percentage"
          />
        </div>
      </div>
      <!--INPUTS -> DESCRIPCION-->
      <div class="group groupTextarea">
        <div class="label">
          <span>{{
            t(moduleStep1 + `.inputs.description.${type}.label`)
          }}</span>
          <span>({{ t(moduleStep1 + ".inputs.optional") }})</span>
        </div>
        <u-textarea
          :placeholder="
            t(moduleStep1 + `.inputs.description.${type}.placeholder`)
          "
          v-model="form.step1.description"
        />
      </div>
    </div>
    <div class="createTax__footer">
      <u-button
        :text="t(module + '.buttons.cancel')"
        type="outlined"
        class="mainBtnModify"
        size="s"
        @click="closeModal"
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
.createTax__footer,
.createTax__form .group .label {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.createTax__header span.title {
  font-size: 16px;
  font-weight: 600;
  line-height: 20px;
  text-align: left;
  color: var(--neutral-text-body);
}

/* Form */
.createTax__form {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.createTax__form .group {
  display: grid;
  grid-template-rows: 16px 1fr;
  gap: 8px;
}

.createTax__form .col4-1 {
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

.createTax__form .group .label span {
  font-size: 12px;
  font-weight: 600;
  line-height: 16px;
  text-align: left;
}

.createTax__form .group span:nth-child(1) {
  color: var(--neutral-text-body);
}
.createTax__form .group span:nth-child(2) {
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

.cards .contain_img {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 64px;
  width: 64px;
}

.cards button {
  border: 1px solid var(--neutral-border-subtle);
  border-radius: 16px;
  padding: 16px;
  box-sizing: border-box;
  box-shadow: var(--elevation-xs);
  display: grid;
  grid-template-columns: 64px 1fr;
  height: fit-content;
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
  justify-content: center;
  gap: 5px;
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
