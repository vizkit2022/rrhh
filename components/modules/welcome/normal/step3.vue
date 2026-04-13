<script setup>
import { ref } from "vue";

import { useRouter } from "vue-router";

import useWizardStore from "@/stores/wizard";
import useGlobalStore from "@/stores/global";
import useUserStore from "@/stores/user";
import useBusinessAreasStore from "@/stores/businessAreas";
import useOrganizationStore from "@/stores/organization";
import useAuthStore from "@/stores/auth";

import { capitalizeFirstLetter } from "@/utils/helpers";

// STORES
const wizardStore = useWizardStore();
const globalStore = useGlobalStore();
const userStore = useUserStore();
const businessAreasStore = useBusinessAreasStore();
const authStore = useAuthStore();
const organizationStore = useOrganizationStore();

const { t } = useI18n();
const module = "modules.wizard.steps.project";
const button = "modules.wizard.buttons";

const router = useRouter();

const data = ref({
  project: "",
  movement: "",
  businessAreaName: "",
  typeMovement: "budget",
});

const inputs = ref([
  {
    prop: "project",
    label: t(module + ".inputs.project.label"),
    placeholder: t(module + ".inputs.project.placeholder"),
    error: false,
  },
  {
    prop: "movement",
    label: t(module + ".inputs.movement.label"),
    placeholder: t(module + ".inputs.movement.placeholder"),
    error: false,
  },
  {
    prop: "businessAreaName",
    label: t(module + ".inputs.businessArea.label"),
    placeholder: t(module + ".inputs.businessArea.placeholder"),
    error: false,
  },
]);

const nextStep = async (skip = false) => {
  if (skip) {
    // No crear proyecto - finalizar
    globalStore.loading = true;
    if (wizardStore.type === "normal") {
      // Usuario normal

      await userStore.saveUserRoles({ roles: wizardStore.data.roles });

      const userId =
        userStore?.userSession && Object.keys(userStore.userSession).length
          ? userStore.userSession._id
          : authStore.user._id;

      const userBody = {
        _id: userId,

        address: { places: wizardStore.data.cities.map(city => ({ name: city.name, place_id: city.place_id })) },
      };

      await userStore.updateUserfromWelcome(false, userBody );

    } else if (wizardStore.type === "company") {
      // Usuario empresa

      let org = JSON.parse(JSON.stringify(wizardStore.organization));
      org.owner = userStore?.userSession?._id ?? authStore.user._id;
      org.imgUrl = "";

      const newOrg = await organizationStore.createOrganization(org);
      const orgId = useCookie("organization");
      globalStore.organizationId = newOrg._id;
      orgId.value = newOrg._id;

      globalStore.changeOrg = true;

      if (wizardStore.organization.imgUrl !== "") {
        await organizationStore.updateImgOrganization(
          newOrg._id,
          wizardStore.organization.formData
        );
      }

      globalStore.changeOrg = false;
    }
    globalStore.loading = false;
    router.push("/incomes");
    wizardStore.cleanWizard();
  } else {
    wizardStore.data.project.name = data.value.project;
    wizardStore.data.businessAreaName = data.value.businessAreaName;
    wizardStore.data.project.movement = data.value.movement;
    wizardStore.data.project.businessAreaName = data.value.businessAreaName;
    wizardStore.data.project.typeMovement = data.value.typeMovement;
    wizardStore.step = 5;
    wizardStore.oldStep = 4;
  }
};

const backStep = () => {
  wizardStore.data.project.name = "";
  wizardStore.data.project.movement = "";
  wizardStore.data.project.businessAreaName = "";
  wizardStore.step = 3;
  wizardStore.oldStep = 2;
};
</script>

<template>
  <div class="containerPage">
    <div class="containerPage__card">
      <div class="sup">
        <div class="logo">
          <u-logo class="img" />
          <u-logo-text class="text" />
        </div>
        <div class="content">
          <h2 class="title headline-m-sb">{{ t(module + ".title") }}</h2>
          <p class="subtitle body-l-r">{{ t(module + ".text2") }}</p>
          <div class="form">
            <div class="groupInput" v-for="input in inputs" :key="input.prop">
              <label>{{ input.label }}</label>
              <u-input
                v-if="input.prop !== 'businessAreaName'"
                v-model="data[input.prop]"
                :placeholder="input.placeholder"
                @input="
                  data[input.prop] = capitalizeFirstLetter(data[input.prop])
                "
              />
              <template v-else>
                <u-select
                  v-if="wizardStore.type === 'company'"
                  v-model="data[input.prop]"
                  :placeholder="input.placeholder"
                  :options="wizardStore.organization.businessAreas.map(area => ({ label: area.name, value: area.name }))" />
                <u-input v-else v-model="data[input.prop]" :placeholder="input.placeholder" />
              </template>
            </div>
            <u-button
              :text="t(module + '.buttons.omit')"
              @click="nextStep(true)"
              type="text"
            />
          </div>
          <span class="msgAlert">{{ t(module + ".text") }}</span>
        </div>
      </div>
      <div class="actions">
        <u-button
          size="xl"
          :text="t(button + '.back')"
          type="text"
          @action-btn="backStep"
        ></u-button>
        <u-button
          size="xl"
          :text="t(button + '.next')"
          @action-btn="nextStep"
          :disabled="
            !data.project.trim() ||
            !data.movement.trim() ||
            !data.businessAreaName.trim()
          "
          style="width: 200px"
        ></u-button>
      </div>
    </div>
    <img
      class="containerPage__img"
      :src="`/img/proyectos${globalStore.isDark ? '-dark' : ''}.svg`"
      alt="Vector company"
    />
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
.containerPage__card {
  width: 500px;
  height: 85vh;
  max-height: 780px;
  min-height: 690px;

  padding: 48px 24px;
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
@keyframes section {
  0%,
  5% {
    opacity: 0;
  }
  100% {
    opacity: 1;
  }
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
  width: 420px;
}
.logo {
  display: flex;
  justify-content: center;
  align-items: center;
  margin-bottom: 15px;
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
  text-align: center;
  color: var(--neutral-text-body);
  padding: 0 20px;
}
.subtitle {
  text-align: left;
  color: var(--neutral-text-caption);
  padding-bottom: 20px;
  line-height: 20px !important;
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
  width: 100%;
  flex-direction: column;
  gap: 12px;
  height: auto;
  padding: 0px 4px 3px 0;
}
.form::-webkit-scrollbar {
  width: 5px;
}
.form::-webkit-scrollbar-thumb {
  background: var(--bg-neutral-300);
  border-radius: 8px;
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
.containerPage__option {
  display: flex;
  padding: 16px;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  flex: 1 0 0;
  border-radius: 24px;
  background: var(--white);
  box-shadow: var(--elevation-l);
  transition: 0.3s;
  cursor: pointer;
}
.containerPage__option span {
  font-family: Nunito;
}
.containerPage__option:hover {
  transform: scale(1);
}
.containerPage__option img {
  width: 100px;
}
.btnSelected {
  box-shadow: rgba(104, 113, 236, 0.2) 0px 2px 4px 0px,
    rgba(104, 113, 236, 0.5) 0px 2px 16px 0px !important;
}

.msgAlert {
  color: var(--neutral-text-caption);
  font-size: 12px;
  height: 20px;
  text-align: center;
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
