<script setup>
import { ref, computed } from "vue";
import useUserStore from "@/stores/user";
import useOutcomesStore from "@/stores/outcomes";
import usePaymentsStore from "@/stores/payments";
import useGlobalStore from "@/stores/global";
import useContactsStore from "@/stores/contacts";
import { useI18n } from "vue-i18n";

//Traducciones
const { t } = useI18n();
const module = "modules.contacts.modalContacts.infBusiness.cards.defaultConditions";


// STORES
const userStore = useUserStore();
const outcomesStore = useOutcomesStore();
const paymentsStore = usePaymentsStore();
const globalStore = useGlobalStore();
const contactsStore = useContactsStore();

// CONSTANTS
const errors = ref({});
const edit = ref(false);
const form = ref({
  documentType: "",
  payMethod: ""
});
const inputs = ref([
    {
        label: t(module + ".typeDocument.label"),
        required: true,
        disabled: true,
        icon: "invoice",
        prop: "document",
        placeholder: t(module + ".typeDocument.placeholder"),
        show: true,
        type: "select",
    },
    {
        label: t(module + ".termsPayment.label"),
        required: true,
        disabled: true,
        icon: "open-book",
        prop: "paymentTerm",
        placeholder: t(module + ".termsPayment.placeholder"),
        show: true,
        type: "select",
    }
])
const options = ref({
  document: [],
  paymentTerm: []
});
const paymenTermNameUser = ref({
  document: {},
  paymentTerm: {}
});


// COMPUTED
const icon = computed(() => {
  return edit.value ? "save" : "new";
});
const filteredInputs = computed(() =>
  edit.value ? inputs.value : inputs.value.filter((input) => input.show)
);


// function handleChangeCondition(data, prop) {

//   if (prop === "document") {
//     userStore.dataSheet.data.payment
//   }

// }



onMounted(async () => {
  if(contactsStore.alreadyLoadedConditionsPred) return

  try {
    globalStore.loading = true;
    const types = await outcomesStore.getDocumentTypesByCountry();
    const days = await paymentsStore.getPaymentTerms();

    options.value.document = outcomesStore.documentTypes.map(type => ({ label: type.name, value: type._id }));
    options.value.paymentTerm = days.map(day => ({ label: day.name.es, value: day._id }));

    contactsStore.optionConditionsPred = options.value

    const matchOption = (options, value) => options.find(option => option.value === value) || { label: "", value: "" };

    console.log('user payment data', userStore.dataSheet.data.payment);

    paymenTermNameUser.value.document = matchOption(options.value.document, userStore.dataSheet.data.payment?.document);
    paymenTermNameUser.value.paymentTerm = matchOption(options.value.paymentTerm, userStore.dataSheet.data.payment?.paymentTerm);

    userStore.dataSheet.dataPaymentUser.document = paymenTermNameUser.value.document;
    userStore.dataSheet.dataPaymentUser.paymentTerm = paymenTermNameUser.value.paymentTerm;



    console.log('optionValue',options.value);
    console.log('user actual payment data', userStore.dataSheet.data.payment);
  } catch (error) {
    console.log(error);
  } finally {
    contactsStore.alreadyLoadedConditionsPred = true;
    globalStore.loading = false
  }
});

</script>

<template>
  <div class="card">
    <div class="card__header">
      <h2>{{ t(module + ".title") }}</h2>
      <u-button-icon
        :icon="icon"
        @click="edit = !edit"
        size="s"
        type="outlined"
      />
    </div>
    <div class="card__list">
      <div
        class="card__item"
        v-for="item in filteredInputs"
        :key="item.prop"
        :class="item.type === 'search' ? 'search' : ''"
      >
        <span :class="`u u-${item.icon}`"></span>
        <span class="label">{{ item.label }}</span>
        <div class="card__item-action" :class="item.type === 'date' ? 'calendar' : ''">
          <u-select
            v-if="!edit && item.type === 'select'"
            :placeholder="item.placeholder"
            size="s"
            v-model="userStore.dataSheet.dataPaymentUser[item.prop].label"
            :error="errors[item.prop]"
            :options="contactsStore.optionConditionsPred[item.prop]"
            :full-data="true"
            @full-data="
              (data) => {
                userStore.dataSheet.data.payment[item.prop] = data.value;
                userStore.dataSheet.dataPaymentUser[item.prop] = data;
              }
            "            
            @click="userStore.dataSheet.change = true"
          />
          <u-switch v-if="edit" class="switch" v-model="item.show" />
        </div>
      </div>
    </div>
  </div>
</template>
<style scoped>
.card {
  width: 50%;
  background-color: var(--neutral-surface-softer);
  display: flex;
  flex-direction: column;
  gap: 10px;
  border-radius: 16px;
  padding: 12px;
  align-self: flex-start;
}
.card__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.card h2 {
  font-size: 14px;
  font-weight: 600;
  line-height: 18px;
  text-align: left;
  color: var(--neutral-text-body);
}
.card__list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding-right: 2px;
}
.card__item {
  display: flex;
  align-items: center;
  gap: 16px;
  height: 40px;
  padding: 0 8px 0 10px;
  box-sizing: border-box;
  border-radius: 8px;
  background-color: var(--neutral-background-default);
}
.card__item span:not(.label) {
  width: 8px;
  color: var(--neutral-text-caption);
  font-size: 16px;
  line-height: 16px;
  margin-top: -1px !important;
}
.card__item span.label {
  width: 120px;
  font-size: 12px;
  font-weight: 600;
  line-height: 18px;
  text-align: left;
  color: var(--neutral-text-caption);
}
.card__item-action {
  flex-grow: 1;
  display: flex;
  justify-content: flex-end;
}
.card__item-action::v-deep(.containerSelectInput) {
  border: var(--neutral-background-default) solid 1px !important;
}
.card__header::v-deep(.btn) {
  transform: scale(0.8);
  border: transparent;
}
h2,
span {
  font-family: Nunito;
}
</style>
