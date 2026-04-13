<script setup>
  import { ref, defineEmits, onMounted } from "vue";
  import useUsersStore from "@/stores/user";
  import useIncomeStore from "@/stores/incomes";
  import useAuthStore from "@/stores/auth";
  import useContactStore from "@/stores/contacts";
  import useOrganizationStore from "@/stores/organization";
  import useGlobalStore from "@/stores/global";
  import { mapperSearchUsers, mapperSearchRoles } from "@/utils/formatters";
  import { regexEmail } from "@/utils/helpers";
  import { mapperCrew } from "@/utils/formatters";

  const usersStore = useUsersStore();
  const incomeStore = useIncomeStore();
  const authStore = useAuthStore();
  const contactStore = useContactStore();
  const organizationStore = useOrganizationStore();
  const globalStore = useGlobalStore();
  const { params } = useRoute();
  const idProject = ref(params?.id ?? null);

  // Variables
  const router = useRouter();
  const emit = defineEmits(["closeModal", "lockModal"]);
  const saving = ref(false);
  const selectOption = ref(true);
  const form = ref({
    name: "",
    id: null,
    image: "",
    email: "",
    invite: false,
    role: "",
    roles: [],
    member: false,
    permission: "Sin Permisos"
  });
  const optionsPemissions = () => {
    const options = [
      {_id: 1234, name: {es: "Asistente", en: "Assistant"}},
      {_id: 1235, name: {es: "Administrador", en: "Administrator"}},
      {_id: 1236, name: {es: "Sin Permisos", en: "Administrator"}}
    ]
    return options.map(op => ({_id: op._id, label: op.name[globalStore.lang]}))
  }
  const inputs = ref([
    {
      prop: "name",
      label: {es: "Nombre", en: "Name"},
      placeholder: {es: "Busca un nombre", en: "Search for a name"},
      type: "search",
      loading: false,
      error: false,
      disabled: false,
      show: true,
      results: [],
    },
    {
      prop: "email",
      label: {es: "Correo Electrónico", en: "Email"},
      placeholder: {es: "ejemplo@email.com", en: "example@email.com"},
      minLabel: {es: "Invitar al usuario a ingresar en Unabase", en: "Invite user to login to Unabase"},
      type: "input",
      error: false,
      disabled: false,
      show: false,
      msgEmail: "",
      loadingEmail: false,
    },
    {
      prop: "role",
      label: {es: "Roles", en: "Roles"},
      placeholder:  {es: "Asigna un rol", en: "Assign a role"},
      type: "search",
      loading: false,
      error: false,
      disabled: true,
      show: true,
      results: [],
    },
    {
      prop: "permission",
      label: {es: "Perfil de Permisos", en: "Permission Profile"},
      placeholder: {es: "Seleccionar", en: "Select"},
      type: "select",
      error: false,
      disabled: true,
      show: true,
      options: []
    },
  ]);

  const searchInputs = ["name", "role"];

  // Mounted
  onMounted(() => {
    inputs.value[3].options = optionsPemissions()
  })

  // Funciones
  const save = async () => {
    validForm();
    if (validForm()) {
      let newId = null;
      // Usuario Nuevo
      if (!form.value.id) {
        // crear usuario
        const body = {
          data: { legalName: form.value.name },
          email: form.value.email,
          roles: form.value.roles,
        };
        const newuser = await usersStore.upsertContact(body);
        newId = newuser.contact.user._id;
      }

      const newCrew = {
        user: form.value.id || newId,
        roles: [...form.value.roles],
        permissions: [],
        creator: usersStore.userSession._id,
      };
      let crew = [...incomeStore.income.crew];
      crew.unshift(newCrew);
      const body = {
        _id: incomeStore.income._id,
        crew,
        idProject: idProject.value,
        idUser: newCrew.user,
        member: form.value.permission !== '',
      };
      emit("lockModal", true);
      saving.value = true;
      const resp = await incomeStore.updateMovement(body);
      incomeStore.income.crew = resp.crew;
      saving.value = false;
      emit("lockModal", false);
      emit("closeModal");
    }
  };
  const validForm = () => {
    // Nombre vacio
    if (form.value.name.trim() === "") {
      inputs.value[0].error = true;
      return false;
    }
    // Sin Roles
    if (!form.value.roles.length) {
      inputs.value[2].error = true;
      return false;
    }

    // Nuevos Usuarios
    if (!form.value.id) {
      // Email vacio
      if (form.value.email === "") {
        inputs.value[1].error = true;
        return false;
      }
      // Email valido
      if (inputs.value[1].error) {
        return false;
      }
    }
    return true;
  };
  const newOption = () => {
    const input = inputs.value.find((i) => i.prop === "email");
    form.value.id = null;
    input.show = true;
    form.value.image = null;
    form.value.email = "";
    form.value.role = "";
    form.value.roles = [];
    inputs.value[1].error = false;
    inputs.value[2].disabled = false;
    inputs.value[3].disabled = false;
  };
  const selectedOption = (prop, op) => {
    selectOption.value = true;
    const input = inputs.value.find((i) => i.prop === prop);
    input.error = false;
    if (prop === "name") {
      const inputEmail = inputs.value.find((i) => i.prop === "email");
      inputEmail.show = false;
      inputEmail.error = false;
      form.value.email = "";
      form.value.role = "";
      form.value.id = op.oldData._id;
      form.value.image = op.oldData.imgUrl;
      form.value.roles = op.oldData.roles || [];
      inputs.value[2].disabled = false;
      inputs.value[3].disabled = false;
    }
    if (prop === "role") {
      if (!form.value.roles.some((r) => r._id === op.oldData._id)) {
        form.value.roles.unshift({
          name: op.oldData.name,
          _id: op.oldData._id,
        });
      }
    }
  };
  const cleanInput = (prop) => {
    const input = inputs.value.find((i) => i.prop === prop);
    form.value[prop] = "";
    input.error = false;
    if (prop === "name") {
      form.value.image = null;
      form.value.id = null;
      form.value.role = "";
      form.value.roles = [];
      form.value.email = "";
      inputs.value[1].show = false;
      inputs.value[1].error = false;
      inputs.value[2].disabled = true;
      inputs.value[3].disabled = true;
    }
  };
  const getResults = async (prop, value) => {
    const gets = {
      name: async () => {
        await usersStore.getUsersByName(value, "crew", incomeStore.income._id);
      },
      role: async () => {
        await usersStore.filterRolesByName(value);
      },
    };

    await gets[prop]();
  };
  const deleteTag = (id) => {
    const index = form.value.roles.findIndex((r) => r._id === id);
    form.value.roles.splice(index, 1);
  };
  let debounceTimeout = null;

const debounce = (func, delay) => {
  return function(...args) {
    clearTimeout(debounceTimeout);
    debounceTimeout = setTimeout(() => func.apply(this, args), delay);
  };
};

const checkEmail = async (email, input) => {
  if (email === "") {
    input.msgEmail = "No has asignado correo.";
    input.error = true;
    form.value.invite = false;
  } else if (!regexEmail(email)) {
    input.msgEmail = "Formato no Válido.";
    input.error = true;
    form.value.permission = "Sin Permisos";
  } else {
    input.loadingEmail = true;
    input.error = false; // Asumimos que no hay error mientras estamos verificando
    input.msgEmail = ""; // Limpiamos el mensaje anterior
    try {
      const checkEmailResponse = await authStore.getUserByEmail(email);
      if (checkEmailResponse && checkEmailResponse._id) {
        input.msgEmail = "Correo ya registrado";
        input.error = true;
        form.value.permission = "Sin Permisos";
      } else {
        input.msgEmail = "";
        input.error = false;
      }
    } catch (error) {
      input.msgEmail = "Error al verificar correo.";
      input.error = true;
    } finally {
      input.loadingEmail = false;
    }
  }
};

  const debouncedCheckEmail = debounce(checkEmail, 500);
  const goToPage = () => {
    const path = `/profile/${form.value.id}`;
    window.open(router.resolve(path).href, "_blank");
  };

  // Watch
  searchInputs.forEach((field) => {
    watch(
      () => form.value[field],
      async (newValue) => {
        if (selectOption.value) {
          selectOption.value = false;
          form.value.role = "";
          return;
        }
        const trimmedSearch = newValue.trim();
        if (field === "name") form.value.id = null;
        const input = inputs.value.find((i) => i.prop === field);
        if (
          (trimmedSearch !== "" &&
            field === "name" &&
            trimmedSearch.length >= 3) ||
          (field !== "name" && trimmedSearch !== "")
        ) {
          input.loading = true;
          await getResults(field, trimmedSearch);
          input.results =
            field === "name"
              ? mapperSearchUsers(usersStore.searchUsers)
              : mapperSearchRoles(usersStore.roles_list, globalStore.lang);
          input.loading = false;
        }
      }
    );
  });
</script>

<template>
  <div class="modal">
    <div class="modal__header">
      <span>Agregar Crew</span>
      <u-button-icon
        icon="close"
        class="btnIconModify"
        color="--bg-neutral-200"
        colorHover="--bg-neutral-400"
        colorActive="--bg-neutral-600"
        size="m"
        :disabled="saving"
        @action-btn="emit('closeModal')"
      />
    </div>
    <div class="modal__form">
      <div class="modal__form-img">
        <u-avatar
          :user="
            form.image
              ? { name: form.name, src: form.image }
              : { name: 'default', src: null }
          "
          :size="164"
          :nothover="true"
          class="avatarModify"
        />
        <button class="btnImg" v-if="form.id" @click="goToPage">
          <span class="u u-open"></span>
          <span>Ver Perfil</span>
        </button>
      </div>
      <div
        class="modal__group"
        v-for="input in inputs.filter((i) => i.show)"
        :key="input.prop"
      >
        <label>{{ input.label[globalStore.lang] }}</label>
        <u-input
          v-if="input.type === 'input'"
          v-model="form[input.prop]"
          :placeholder="input.placeholder[globalStore.lang]"
          @input="
            input.prop === 'email'
              ? (form.email = form.email.replace(' ', ''))
              : '',
            input.prop === 'email' ? debouncedCheckEmail(form.email, input) : ''
          "
          :error="input.error"
          :disabled="saving"
        />
        <span
          v-if="
            input.prop === 'email' &&
            input.msgEmail !== '' &&
            !input.loadingEmail
          "
          class="msg"
        >
          {{ input.msgEmail }}
        </span>
        <div class="load" v-if="input.prop === 'email' && input.loadingEmail">
          <u-loading :width="14" color="--bg-neutral-400" />
          <span class="load__text">Verificando...</span>
        </div>
        <u-select
          v-if="input.type === 'select'"
          v-model="form[input.prop]"
          :placeholder="input.placeholder[globalStore.lang]"
          :error="inputs[1].error"
          :disabled="inputs[1].error || form.email === '' || saving"
          :options="input.options"
        />
        <span
          v-if="
            input.type === 'select' && !form.id && form.name !== ''"
          class="load__text"
        >
          Se requiere de un Correo Electrónico.
        </span>
        <u-search
          v-if="input.type === 'search'"
          v-model="form[input.prop]"
          :placeholder="input.placeholder[globalStore.lang]"
          :loading="input.loading"
          :options="input.results"
          :avatar="input.prop === 'name'"
          :create="input.prop === 'name'"
          :disabled="input.disabled || saving"
          @newOption="newOption()"
          @selectedOption="(op) => selectedOption(input.prop, op)"
          @cleanInput="cleanInput(input.prop)"
        />
        <div class="checkboxGroup">
          <u-checkbox
            v-if="
              input.type === 'checkbox' &&
              !organizationStore.organization.default
            "
            v-model="form[input.prop]"
            :disabled="input.disabled || saving"
          />
          <label
            v-if="
              input.type === 'checkbox' &&
              !organizationStore.organization.default
            "
            >{{ input.minLabel[globalStore.lang] }}</label
          >
        </div>
        <div v-if="input.prop === 'email'">
          <div class="checkboxGroup">
            <u-checkbox
              v-model="form.invite"
              :disabled="saving"
            />
            <label>{{ input.minLabel[globalStore.lang] }}</label>
          </div>
        </div>
        <div
          class="container__form-col-tags"
          v-if="form.roles.length && input.prop === 'role'"
        >
          <u-tags
            v-for="rol in form.roles"
            :key="rol._id"
            :text="rol.name[globalStore.lang]"
            :delete="true"
            :disabled="saving"
            @closeButton="deleteTag(rol._id)"
          />
        </div>
      </div>
    </div>
    <div class="modal__actions">
      <u-button
        text="Cancelar"
        type="outlined"
        class="mainBtnModify"
        size="l"
        :disabled="saving"
        @action-btn="emit('closeModal')"
      />
      <u-button
        :text="saving ? 'Creando' : 'Crear'"
        class="mainBtnModify"
        size="l"
        :disabled="saving || form.name.trim() === '' || !form.roles.length"
        @action-btn="save"
      />
    </div>
  </div>
</template>

<style scoped>
  .modal {
    height: calc(100vh - 80px);
    display: grid;
    grid-template-rows: 40px 1fr 50px;
    gap: 16px;
  }
  .modal__header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    height: 40px;
    width: 100%;
  }
  .modal__header span {
    font-size: 16px;
    font-weight: 600;
    line-height: 20px;
    letter-spacing: 0em;
    text-align: left;
    color: var(--bg-neutral-700);
  }
  .modal__actions {
    width: 100%;
    height: 40px;
    display: flex;
    justify-content: space-between;
    padding-top: 10px;
  }
  .modal__form {
    display: flex;
    flex-direction: column;
    gap: 20px;
    width: 100%;
    height: calc(100vh - 192px);
    overflow-y: auto;
  }
  .modal__form::-webkit-scrollbar {
    width: 5px;
    height: 0px;
  }
  .modal__form::-webkit-scrollbar-thumb {
    border-radius: 3px;
    background: var(--bg-neutral-300);
  }
  .modal__group {
    gap: 8px;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
  }
  .modal__group label,
  .modal__group label span {
    font-size: 12px;
    font-weight: 600;
    line-height: 16px;
    letter-spacing: 0em;
    text-align: left;
  }
  .modal__group .msg {
    font-size: 12px;
    font-weight: 600;
    line-height: 16px;
    color: var(--bg-danger-500);
  }
  .modal__group label {
    color: var(--bg-neutral-700);
  }
  .modal__group span {
    color: var(--bg-neutral-400);
  }
  .modal__form-img {
    position: relative;
  }
  .btnImg {
    position: absolute;
    bottom: 20px;
    left: 60%;
    background-color: var(--bg-primary-500);
    width: 39px;
    height: 40px;
    padding: 0 9px;
    display: flex;
    gap: 5px;
    align-items: center;
    transition: 0.3s;
    overflow: hidden;
    border-radius: 20px;
  }
  .btnImg span {
    color: var(--white);
  }
  .btnImg span:nth-child(1) {
    font-size: 22px;
  }
  .btnImg span:nth-child(2) {
    font-size: 16px;
    line-height: 16px;
    width: 80px;
    overflow: hidden;
    flex-shrink: 0;
  }
  .btnImg:hover {
    width: 140px;
    padding: 0 20px;
    box-shadow: var(--shadow-3);
  }
  .avatarModify {
    margin: 20px auto;
  }
  .container__form-col-tags {
    height: auto;
    max-height: 116px;
    overflow-y: auto;
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 10px;
  }
  .container__form-col-tags::-webkit-scrollbar {
    width: 2px;
    height: 0px;
  }
  .container__form-col-tags::-webkit-scrollbar-thumb {
    border-radius: 3px;
    background-color: var(--bg-neutral-400);
  }
  .load {
    display: flex;
    gap: 5px;
  }
  .load__text {
    font-size: 12px;
    line-height: 12px;
  }
  .checkboxGroup {
    display: flex;
    align-items: center;
    gap: 16px;
  }

  /* CUSTOM COMPONENTS - MODIFY */
  .btnIconModify {
    border-radius: 50%;
    color: var(--bg-neutral-500);
  }
  .mainBtnModify {
    width: 135px;
  }
</style>
