<script setup>
import { ref, watch } from "vue";
import useWizardStore from "@/stores/wizard";
// import { regexEmail } from "@/utils/helpers";
// import useContactsStore from "@/stores/contacts";
import useGlobalStore from "@/stores/global";
import useAuthStore from "@/stores/auth";

// Variables
const wizardStore = useWizardStore();
// const contactsStore = useContactsStore();
const globalStore = useGlobalStore();
const authStore = useAuthStore();

const { t } = useI18n();
// const module = "modules.wizard.steps.members";
const module = "modules.wizard.steps.businessAreas";
const button = "modules.wizard.buttons";

// CONST MEMBERS
// const member = ref("");
const businessAreas = ref("");

// INPUT MEMBERS
// const inputs = ref([
//   {
//     prop: "name",
//     label: t(module + ".inputs.member.label"),
//     placeholder: t(module + ".inputs.member.placeholder"),
//     error: false,
//     msgError: "",
//     loading: false,
//     results: [],
//     searching: false,
//   },
// ]);
const inputs = ref([
  {
    prop: "name",
    placeholder: t(module + ".inputs.placeholder"),
    error: false,
    msgError: "",
    loading: false,
    results: [],
    searching: false,
  },
]);


// Acciones

//SKIP MEMBER USERS VACIO
// const skip = () => {
//   wizardStore.organization.users = [];
//   nextStep();
// };
const skip = () => {
  wizardStore.organization.businessAreas = [];
  nextStep();
}

const nextStep = () => {
  businessAreas.value = "";
  wizardStore.step = 2;
  wizardStore.oldStep = 10;
};

//BACK STEP MEMBERS VACIO
// const backStep = () => {
//   wizardStore.data.company.members = [];
//   wizardStore.step = 9;
//   wizardStore.oldStep = 8;
// };
const backStep = () => {
  businessAreas.value = "";
  wizardStore.organization.businessAreas = [];
  wizardStore.step = 9;
  wizardStore.oldStep = 8;
}

//NEW OPTION MEMBERS
// const newOption = async (input) => {
//   if (regexEmail(member.value)) {
//     const existUser = wizardStore.organization.users.find(
//       (u) => u.email === member.value
//     );
//     if (!existUser) {
//       input.searching = true;
//       const checkEmail = await authStore.getUserByEmail(member.value);
//       input.searching = false;
//       if (checkEmail && checkEmail._id) {
//         input.msgError = t(module + ".inputs.member.error");
//         input.error = true;
//       } else {
//         wizardStore.organization.users.unshift({
//           id: null,
//           email: member.value,
//         });
//         cleanInput();
//       }
//     } else {
//       input.msgError = t(module + ".inputs.member.error2");
//       input.error = true;
//     }
//   } else {
//     input.msgError = t(module + ".inputs.member.error3");
//     input.error = true;
//   }
// };
const newOption = async (input) => {
  if (businessAreas.value) {
    const existBusinessArea = wizardStore.organization?.businessAreas?.find(
      (u) => u.name === businessAreas.value
    );
    if (!existBusinessArea) {
      wizardStore.organization?.businessAreas?.unshift({
        name: businessAreas.value,
      });
      businessAreas.value = "";
    } else {
      input.msgError = t(module + ".inputs.businessAreas.error2");
      input.error = true;
    }
  }
}

// SELECTED OPTION MEMBERS
// const selectedOption = (op, input) => {
//   const existUser = wizardStore.organization.users.find(
//     (u) => u.user === op.oldData._id
//   );
//   if (!existUser) {
//     wizardStore.organization.users.unshift({
//       id: op.oldData._id,
//       email: op.oldData.emails[0].email,
//     });
//     setTimeout(() => cleanInput(), 10);
//   } else {
//     input.msgError = t(module + ".inputs.member.error2");
//     input.error = true;
//   }
// };
const selectedOption = (op, input) => {
  const existBusinessArea = wizardStore.organization?.businessAreas?.find(
    (u) => u.name === op.oldData.name
  );
  if (!existBusinessArea) {
    wizardStore.organization.businessAreas.unshift({
      name: op.oldData.name,
    });
    setTimeout(() => businessAreas.value = "", 10);
  } else {
    input.msgError = t(module + ".inputs.businessAreas.error2");
    input.error = true;
  }
}

//CLEAN INPUT MEMBERS
// const cleanInput = () => {
//   member.value = "";
//   inputs.value[0].results = [];
//   inputs.value[0].error = false;
//   inputs.value[0].loading = false;
//   inputs.value[0].msgError = "";
// };
const cleanInput = () => {
  businessAreas.value = "";
  inputs.value[0].error = false;
  inputs.value[0].msgError = "";
}

//wATCH INPUT MEMBERS
// watch(ref(member), async () => {
//   if (member.value.trim() !== "") {
//     inputs.value[0].loading = true;
//     await contactsStore.filterContactsByName(member.value);
//     inputs.value[0].loading = false;
//     inputs.value[0].results = contactsStore.contacts
//       ? mapperResults(contactsStore.contacts, "contacts")
//       : [];
//   }
// });
watch(ref(businessAreas), () => {
  if (businessAreas.value.trim() !== "") {
    inputs.value[0].loading = true;
    inputs.value[0].error = false;
    const filtered = wizardStore.organization?.businessAreas
      ?.filter((u) => u.name.includes(businessAreas.value))
      ?.map((u) => ({
        label: u.name,
        oldData: u, // opcional si lo usas en selectedOption
      })) || [];
    inputs.value[0].results = filtered;
    inputs.value[0].loading = false;
  }
});



// MAPPER RESULTS
// const mapperResults = (list, type) => {
//   const resp = [];
//   list.forEach((l) => {
//     type === "project";
//     resp.push(
//       type === "project"
//         ? {
//             label: l.name,
//             oldData: { ...l },
//           }
//         : {
//             label: `${l.name.first} ${l.name.last}`,
//             text: l.emails[0]?.email || "",
//             img: l.imgUrl,
//             oldData: { ...l },
//           }
//     );
//   });
//   return resp;
// };

//DELETE TAGS
  // const deleteTag = (pos) => {
  //   wizardStore.organization.users.splice(pos, 1);
  // };
  const deleteTag = (pos) => {
    wizardStore.organization.businessAreas.splice(pos, 1);
  }
</script>

<template>
  <div class="containerPage">
    <div class="containerPage__card">
      <div class="sup">
        <div class="logo">
          <u-logo class="img" />
          <u-logo-text class="text" />
        </div>
        <!-- CONTENT Business Areas-->
        <div class="content">
          <h2 class="title">{{ t(module + ".title") }}</h2>
          <p class="subtitle">{{ t(module + ".text") }}<br/>{{ t(module + ".text2") }}</p>
          <div class="form">
            <div class="groupInput" v-for="input in inputs" :key="input.prop">
              <label>
                <span v-if="input.error" class="msg">
                  {{ input.msgError }}
                </span>
                <span class="load" v-if="input.searching">
                  <u-loading :width="14" color="--bg-neutral-400" />
                  <span class="load__text">{{
                    t(module + ".inputs.businessAreas.verifying")
                  }}</span>
                </span>
              </label>
              <u-search
                v-model="businessAreas"
                :placeholder="input.placeholder"
                :loading="input.loading"
                :options="input.results"
                :avatar="false"
                :snippet="true"
                :disabled="false"
                :create="true"
                :error="input.error"
                :labelNoResults="false"
                @newOption="newOption(input)"
                @selectedOption="(op) => selectedOption(op, input)"
                @cleanInput="cleanInput"
              />
              <div
                class="form__content-tags"
                v-if="wizardStore.organization?.businessAreas?.length"
              >
                <u-tags
                  v-for="(m, pos) in wizardStore.organization.businessAreas"
                  :key="pos"
                  :text="m.name"
                  :delete="true"
                  @closeButton="deleteTag(pos)"
                />
              </div>
              <!-- <u-button
                text="Omitir Area de negocio"
                type="text"
                class="skipBtn"
                @action-btn="skip"
              /> -->
            </div>
          </div>
        </div>
        <!-- MEMBERS OCULTA CONTENT-->
        <!-- <div class="content">
          <h2 class="title">{{ t(module + ".title") }}</h2>
          <p class="subtitle">{{ t(module + ".text") }}</p>
          <div class="form">
            <div class="groupInput" v-for="input in inputs" :key="input.prop">
              <label>
                {{ input.label }}
                <span v-if="input.error" class="msg">
                  {{ input.msgError }}
                </span>
                <span class="load" v-if="input.searching">
                  <u-loading :width="14" color="--bg-neutral-400" />
                  <span class="load__text">{{
                    t(module + ".inputs.member.verifying")
                  }}</span>
                </span>
              </label>
              <u-search
                v-model="member"
                :placeholder="input.placeholder"
                :loading="input.loading"
                :options="input.results"
                :avatar="true"
                :snippet="true"
                :disabled="true"
                :create="true"
                :error="input.error"
                @newOption="newOption(input)"
                @selectedOption="(op) => selectedOption(op, input)"
                @cleanInput="cleanInput"
              />
              <div
                class="form__content-tags"
                v-if="wizardStore?.organization?.users?.length"
              >
                <u-tags
                  v-for="(m, pos) in wizardStore.organization.users"
                  :key="pos"
                  :text="m.email"
                  :delete="true"
                  @closeButton="deleteTag(pos)"
                />
              </div>
              <u-button
                :text="t(module + '.buttons.omit')"
                type="text"
                class="skipBtn"
                @action-btn="skip"
              />
            </div>
          </div>
        </div> -->
      </div>
      <div class="actions">
        <u-button
          size="xl"
          :text="t(button + '.back')"
          @action-btn="backStep"
          type="text"
        ></u-button>
        <!-- BUSINESS AREAS button CONTENT-->
          <u-button
          size="xl"
          :text="t(button + '.next')"
          @action-btn="nextStep"
          style="width: 200px"
          :disabled="wizardStore.organization.businessAreas.length === 0"
        ></u-button> 
      </div>
    </div>
    <img class="containerPage__img" :src="`/img/miembros${globalStore.isDark ? '-dark' : ''}.svg`" alt="Vector members"/>
  </div>
</template>

<style scoped>
span,
label,
p,
h2,
button {
  font-family: Nunito;
}
.containerPage {
  display: flex;
  gap: 48px;
  justify-content: center;
  align-items: center;
  animation: section 0.8s ease-in;
}
@keyframes section {
  0%,
  5% {
    opacity: 0;
  }
  100% {
    opacity: 1;
  }
}
.containerPage__card {
  width: 500px;
  height: 85vh;
  max-height: 780px;
  min-height: 690px;

  padding: 48px 36px;
  box-sizing: border-box;
  border-radius: 24px;
  gap: 48px;
  background-color: var(--neutral-background-default);
  box-shadow: var(--elevation-xl);
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-direction: column;
}
.sup {
  display: flex;
  flex-direction: column;
  gap: 20px;
}
.content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  gap: 20px;
}
.logo {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 5px;
  margin-bottom: 5px;
}
.logo .img {
      height: 28px;
      width: 28px;
    }
  
    .logo .text {
      height: 24px;
      width: 124px;
    }
.title {
  color: var(--neutral-text-body);
  text-align: center;
  margin: 10px 0 5px;
}
.subtitle {
  color: var(--neutral-text-caption);
}
.groupInput {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.groupInput label {
  font-size: 12px;
  font-weight: 600;
  line-height: 16px;
  text-align: left;
  color: var(--neutral-text-body);
}
.form {
  display: flex;
  width: 420px;
  flex-direction: column;
  gap: 20px;
  height: auto;
  padding: 0px 4px 3px 0;
  margin: 15px 0 5px;
}
.actions {
  width: 100%;
  display: flex;
  justify-content: space-between;
}
.containerPage__img {
  width: auto;
  max-width: 600px;
  height: 60vh;
  max-height: 540px;
}
.form__content-tags {
  height: auto;
  max-height: 125px;
  overflow-y: auto;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
  padding: 10px 0 0 20px;
  margin-right: 20px;
}
.form__content-tags::-webkit-scrollbar {
  width: 2px;
  height: 0px;
}
.form__content-tags::-webkit-scrollbar-thumb {
  border-radius: 3px;
  background-color: var(--bg-neutral-400);
}
.msg {
  color: var(--bg-danger-500);
  margin-left: 5px;
}
.load {
  position: absolute;
  display: inline-flex;
  gap: 5px;
  bottom: 0px;
  margin-left: 5px;
}
.load__text {
  font-size: 12px;
  line-height: 12px;
  color: var(--bg-neutral-400);
}
.skipBtn {
  margin-top: 20px;
}

@media only screen and (max-width: 1886px) {
  .containerPage__img {
    max-width: 500px;
  }
}

@media only screen and (max-width: 1090px) {
  .containerPage__img {
    max-width: 400px;
  }
}

@media only screen and (max-width: 985px) {
  .containerPage__img {
    display: none;
  }
}
</style>
