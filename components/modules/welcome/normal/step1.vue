<script setup>
  import { ref, watch, onMounted } from "vue";

  // STORES
  import useWizardStore from "@/stores/wizard";
  import useUserStore from "@/stores/user";
  import useGlobalStore from "@/stores/global";
  
  const wizardStore = useWizardStore();
  const userStore = useUserStore();
  const globalStore = useGlobalStore();

  const { t } = useI18n();
  const module = "modules.wizard.steps.roles";
  const button = "modules.wizard.buttons";

  // Variables
  const loading = ref(false);
  const options = ref([]);
  const data = ref({
    role: "",
    roles: [],
  });
  const inputs = ref([
    {
      prop: "role",
      label: "",
      placeholder: t(module + ".inputs.role.placeholder"),
      error: false,
    },
  ]);

  // Funciones
  const nextStep = () => {
    wizardStore.data.roles = data.value.roles;
    wizardStore.step = 3;
    wizardStore.oldStep = 2;
  };
  const backStep = () => {
    wizardStore.data.roles = [];
    wizardStore.step =
      wizardStore.type === "normal"
        ? 1
        : wizardStore.type === "company"
        ? 10
        : 6;
    wizardStore.oldStep =
      wizardStore.type === "normal"
        ? null
        : wizardStore.type === "company"
        ? 9
        : 1;
  };
  const removeRol = (pos) => {
    data.value.roles.splice(pos, 1);
  };
  const selectRol = (rol) => {
    if (!!data.value.roles) {
      const rolExists = data.value.roles.some(
        (existingRol) =>
          existingRol.name[globalStore.lang].toLowerCase() ===
          rol.label.toLowerCase()
      );
      if (!rolExists) {
        data.value.roles.push({
          name: { [globalStore.lang]: rol.label },
          _id: rol.id,
        });
      }
      data.value.role = "";
    }
  };
  const mapperRoles = () => {
    let resp = [];
    userStore.roles_list.forEach((t) => {
      resp.push({
        label: t.name[globalStore.lang],
        id: t._id,
      });
    });
    return resp;
  };

  // Mounted
  onMounted(async () => {
    if (userStore?.userSession && Object.values(userStore.userSession).length) {
      data.value.roles = userStore.userSession.roles;
    }
  });

  // Watch
  watch(
    () => data.value.role,
    async (newValue) => {
      const trimmedSearch = newValue.trim();
      if (trimmedSearch !== "") {
        loading.value = true;
        await userStore.filterRolesByName(trimmedSearch);
        if (userStore.roles_list && userStore.roles_list.length) {
          options.value = mapperRoles();
        } else {
          options.value = [];
        }
        loading.value = false;
      }
    }
  );
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
          <p class="subtitle body-l-r">{{ t(module + ".text") }} <br/> {{ t(module + ".text2") }}</p>
          <div class="form">
            <div class="groupInput" v-for="input in inputs" :key="input.prop">
              <u-search
                v-model="data[input.prop]"
                :placeholder="input.placeholder"
                :error="input.error"
                :options="options"
                :loading="loading"
                :updated="false"
                @cleanInput="data[input.prop] = ''"
                @selectedOption="selectRol"
              />
              <div class="containerPage__tags" v-if="data.roles.length">
                <u-tags
                  v-for="(rol, i) in data.roles"
                  :key="rol.i"
                  :text="rol.name[globalStore.lang]"
                  @closeButton="removeRol(i)"
                />
              </div>
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
          :text="t(button + '.next')"
          @action-btn="nextStep"
          style="width: 200px"
        ></u-button>
      </div>
    </div>
    <img class="containerPage__img" :src="`/img/roles${globalStore.isDark ? '-dark' : ''}.svg`" alt="Vector company" />
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
  color: var(--neutral-text-body);
  margin: 10px 0 5px;
  text-align: center;
}

.subtitle {
  color: var(--neutral-text-caption);
  line-height: 20px !important;
}

.groupInput {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 16px;
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

.containerPage__tags {
  display: flex;
  align-items: flex-start;
  align-self: flex-start;
  flex-wrap: wrap;
  column-gap: 10px;
  row-gap: 5px;
  overflow-y: auto;
  height: auto;
  padding: 0 0 0 20px;
  margin-right: 20px;
  max-height: 148px;
  flex-shrink: 1;
}

.containerPage__tags::-webkit-scrollbar {
  width: 5px;
  height: 5px;
}

.containerPage__tags::-webkit-scrollbar-thumb {
  border-radius: 3px;
  background-color: var(--bg-neutral-300);
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
