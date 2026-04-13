<script setup>
import { ref } from "vue";
import { useRouter } from "vue-router";
import useWizardStore from "@/stores/wizard";
import useIncomeStore from "@/stores/incomes";
import useBusinessAreasStore from "@/stores/businessAreas";
import useUserStore from "@/stores/user";
import useAuthStore from "@/stores/auth";
import useGlobalStore from "@/stores/global";
import useOrganizationStore from "@/stores/organization";
import useTemplatesStore from "@/stores/templates";

// STORES
const wizardStore = useWizardStore();
const incomesStore = useIncomeStore();
const templateStore = useTemplatesStore();
const businessAreasStore = useBusinessAreasStore();
const userStore = useUserStore();
const authStore = useAuthStore();
const globalStore = useGlobalStore();
const organizationStore = useOrganizationStore();
const { t } = useI18n();
const module = "modules.wizard.steps.templates";
const button = "modules.wizard.buttons";

const router = useRouter();

const data = ref({
  template: null,
  templateValue: null,
});
const templates = ref([
  { label: t(module + ".inputs.template.options[0].name"), value: "unabase" },
  {
    label: t(module + ".inputs.template.options[1].name"),
    value: "hotbudget",
  },
  { label: t(module + ".inputs.template.options[2].name"), value: "" },
]);

// MOUNTED
onMounted(async () => {
  await templateStore.getTemplates(true);

  templates.value = templateStore.templatesGlobal.map((template) => ({
    label: template.name,
    value: template._id,
  }));
  const labels = {
    es: "Sin Plantilla",
    en: "No template"
  } 
  templates.value.unshift({
    label: labels[globalStore.lang],
    value: null,
  });

});

const createWizard = async () => {
  let organization = null;
  try {
    globalStore.loading = true;
    if (wizardStore.type == "company") {
      let org = JSON.parse(JSON.stringify(wizardStore.organization));
      org.owner = userStore?.userSession?._id ?? authStore.user._id;
      org.imgUrl = "";

      const newOrg = await organizationStore.createOrganization(org);
      const orgId = useCookie("organization");
      globalStore.organizationId = newOrg._id;
      orgId.value = newOrg._id;
      organization = newOrg._id;

      globalStore.changeOrg = true;

      if (wizardStore.organization.imgUrl !== "") {
        await organizationStore.updateImgOrganization(
          newOrg._id,
          wizardStore.organization.formData
        );
      }

      globalStore.changeOrg = false;
    }


    await userStore.saveUserRoles({ roles: wizardStore.data.roles });
    const businessAreas = await saveBusinessArea();


    const userBody = {
      _id: userStore?.userSession?._id || authStore?.user?._id,
      locations: wizardStore?.data?.cities || [],
    };

    organization = organizationStore?.organization?._id;

    await userStore.updateUserfromWelcome(false, userBody);

    // Crear proyecto
    await createProject(organization, businessAreas || []);
    globalStore.loading = false;
    wizardStore.cleanWizard();
  } catch (err) {
    console.error(err);
    router.push("/incomes");
  }
};

const saveBusinessArea = async () => {
  let areas = [];
  if (wizardStore.type === "company") {
    areas = wizardStore.organization.businessAreas.map((area) => area.name);
  } else {
    areas = [wizardStore.data.businessAreaName];
  }

  const response = await Promise.all(
    areas.map(async (area) => {
      const body = { name: area, description: area, abbreviation: area };
      try {
        const resp = await businessAreasStore.createBusinessArea(body);
        return { name: resp.name, _id: resp._id };
      } catch (error) {
        console.error("Error al guardar el área de negocio:", error);
        return null;
      }
    })
  );

  return response.filter(Boolean);
};

const createProject = async (organization, businessAreas) => {
  const businessArea = businessAreas && businessAreas.length > 0 ? businessAreas.find(area => area.name === wizardStore.data.project.businessAreaName)?._id : null;
  try {
    const defaultMyUser = await getDefaultUser();
    const body = {
      client: defaultMyUser,
      contact: defaultMyUser,
      executive: defaultMyUser,
      projectName: wizardStore.data.project.name,
      name: wizardStore.data.project.movement,
      businessArea,
      organization,
      wizard: true,
      state: "budget",
    };

    data.value.templateValue
      ? (body.templateId = data.value.templateValue)
      : null;

    await incomesStore.createIncome(body);
    // Clean
  } catch (error) {
    console.error("Error al procesar la solicitud:", error);
  } finally {
    globalStore.loading = false;
  }
};

const getDefaultUser = async () => {
  try {
    const query = { onlyContacts: true };
    await userStore.getUserByToken();
    const resp = await userStore.findByUsersByNameOrEmail(
      false,
      true,
      userStore?.userSession?.email,
      query
    );
    let contact = {};

    if (resp?.length) {
      contact = resp[0];
    } else {
      const data = await getDefaultContact();
      contact = await userStore.upsertContact(data);
    }

    return {
      contact: contact._id,
      data: { legalName: userStore?.userSession?.data?.legalName },
      email: userStore?.userSession?.email,
      imgUrl: userStore?.userSession?.imgUrl,
    };
  } catch (error) {
    console.error(error);
    router.push("/incomes");
  }
};

const getDefaultContact = async () => {
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

  let typeName = "";

  const type = userStore?.userSession?.data?.type || "";
  if (type) {
    typeName = types[type][globalStore.lang] || "";
  }

  let data = {
    data: {
      nickName: userStore?.userSession?.data?.nickName || "",
      businessActivity: userStore?.userSession?.data?.businessActivity || "",
      type,
      typeName: typeName,
      legalName: userStore?.userSession?.data?.legalName || "",
      address: userStore?.userSession?.data?.address || "",
      idNumber: userStore?.userSession?.data?.idNumber || "",
    },
    address: userStore?.userSession?.address || {},
    contactMethods: userStore?.userSession?.contactMethods || {},
    roles: userStore?.userSession?.roles || [],
    imgUrl: userStore?.userSession?.imgUrl || "",
    email: userStore?.userSession?.email || "",
    phone: "",
    payment: userStore?.userSession?.payment || {},
    otherAccounts: {
      instagram: "",
      twitter: "",
      facebook: "",
      web: "",
      linkedin: "",
      behance: "",
      spotify: "",
      soundCloud: "",
      vimeo: "",
      youtube: "",
      github: "",
      x: "",
    },
    relatedUsers: [],
  };

  return data;
};

const backStep = () => {
  wizardStore.step = 4;
  wizardStore.oldStep = 3;
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
          <p class="subtitle body-l-r">{{ t(module + ".text") }}</p>
          <div class="form">
            <div class="groupInput">
              <label>{{ t(module + ".inputs.template.label") }}</label>
              <u-select
                v-model="data.template"
                :placeholder="t(module + '.inputs.template.placeholder')"
                :options="templates"
                :full-data="true"
                @full-data="(op) => (data.templateValue = op.value)"
              />
            </div>
          </div>
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
          :text="t(button + '.create')"
          @action-btn="createWizard"
          :disabled="data.template === null"
          style="width: 200px"
        ></u-button>
      </div>
    </div>
    <img class="containerPage__img" :src="`/img/templates${globalStore.isDark ? '-dark' : ''}.svg`" alt="Vector company" />
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
  margin: 10px 0 5px;
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
  gap: 20px;
  height: auto;
  padding: 0px 4px 3px 0;
  margin: 15px 0 5px;
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
  box-shadow: var(--shadow-1);
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
