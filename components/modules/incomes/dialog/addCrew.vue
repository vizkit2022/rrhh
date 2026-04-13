<script setup>
import { ref, computed, defineEmits } from "vue";
import useGlobalStore from "@/stores/global";
import useUserStore from "@/stores/user";
import useIncomeStore from "@/stores/incomes";

import { regexEmail, capitalizeFirstLetter } from "@/utils/helpers";

// STORES
const globalStore = useGlobalStore();
const userStore = useUserStore();
const incomeStore = useIncomeStore();

// EVENT BUS
const { $bus } = useNuxtApp();

// Emits
const emit = defineEmits(["closeModal"]);

// Constants
const titleAction = ref("Seleccionar Contacto");
const search = ref("");
const mainColor = "--bg-neutral-500";
const secondColor = "--bg-neutral-600";
const loadings = ref({});
const loading = ref(false);
const results = ref({ users: [], roles: [] });
const typeAction = ref("");
const typesUser = [
  { name: { es: "Empresa", en: "Business" }, value: "business" },
  { name: { es: "Persona", en: "Personal" }, value: "personal" },
];
const typeSupplierOptions = [
  { label: "Empresa", icon: "building", value: "business" },
  { label: "Persona", icon: "user", value: "personal" },
];
const role = ref("");
const crew = ref({});
const { params } = useRoute();
const idProject = ref(params?.id ?? null);
const emailError = ref(false);
const nameError = ref(false);

// Actions
// const filterUsers = async () => {
//   console.log("wena");
//   const toSearch = search.value.trim();
//   if (toSearch !== "") {
//     loadings.value.search = true;
//     const resp = await userStore.findByUsersByNameOrEmail(true, true, toSearch);
//     results.value.users = mapperUsers(resp || []);
//     loadings.value.search = false;
//   }
// };

const searchTimeout = ref(null);
const lastSearch = ref("");

// Buscador optimizado
const filterUsers = () => {
  const val = search.value.trim();
  console.log("wena");
  // Cancelar timeout anterior
  if (searchTimeout.value) {
    clearTimeout(searchTimeout.value);
  }

  // Si el valor no cambió, no buscar
  if (val === lastSearch.value) return;

  // Nuevo timeout de espera (ej: 300 ms tras dejar de tipear)
  searchTimeout.value = setTimeout(async () => {
    if (val === "") {
      results.value = [];
      return;
    }

    lastSearch.value = val;
    loading.value = true;

    try {
      const resp = await userStore.findByUsersByNameOrEmail(true, true, val, {
        archived: true,
        onlyContacts: true,
      });

      results.value = resp?.length ? mapperUsers(resp) : [];
    } catch (error) {
      console.error(error);
    } finally {
      loading.value = false;
    }
  }, 300);
};

const mapperUsers = (list = []) => {
  let resp = [];
  console.log("list", list[0]._id);
  console.log("income", incomeStore.income.crew.length);
  list.forEach((l) => {
    const exist = incomeStore.income.crew.find((c) => c.contact._id === l._id);
    console.log("el exist", exist);
    if (!exist || incomeStore.income.crew.length === 0) {
      console.log("entro");
      resp.push({
        label: l?.data?.legalName || "-",
        text: l?.email || "-",
        img: l?.imgUrl ?? null,
        // type: l?.data?.type || "business",
        oldData: { ...l },
      });
    }
  });
  console.log("resp", resp);
  return resp;
};

const mapperRoles = () => {
  return userStore.roles_list.map((t) => ({
    label: t.name[globalStore.lang],
    id: t._id,
  }));
};

const cleanSearch = () => {
  typeAction.value = "";
  titleAction.value = "Seleccionar Contacto";
  search.value = "";
};

const createUser = () => {
  // typeAction.value = "new";
  // titleAction.value = "Crear Contacto";
  // crew.value = {
  //     data: {
  //         legalName: capitalizeFirstLetter(search.value),
  //         nickName: "",
  //         type: "personal"
  //     },
  //     email: "",
  //     roles: []
  // }
  userStore.dataSheet.state = "create";
  userStore.showModalDataSheet = true;
  userStore.showBtnBack = true;
  setTimeout(() => {
    userStore.dataSheet.data.data.legalName = capitalizeFirstLetter(
      search.value
    );
    $bus.$on("receiveContact", (receiveContact) => {
      crew.value = receiveContact;
      typeAction.value = "old";
      titleAction.value = "Seleccionar Roles";
    });
  }, 10);
};

const selectedUser = (user) => {
  crew.value = user.oldData;
  typeAction.value = "old";
  titleAction.value = "Seleccionar Roles";
};

const updatedTypeOp = (type) => {
  const types = {
    personal: () => {
      // crew.value.data.type = "personal";
      // const names = { es: "Persona", en: "Personal" };
      // const typeName = names[globalStore.lang];
      // crew.value.data.typeName = typeName;
      userStore.dataSheet.data.data.type = "personal";
      const names = { es: "Persona", en: "Personal" };
      const typeName = names[globalStore.lang];
      userStore.dataSheet.data.data.typeName = typeName;
    },
    business: () => {
      // crew.value.data.type = "business";
      // const names = { es: "Empresa", en: "Business" };
      // const typeName = names[globalStore.lang];
      // crew.value.data.typeName = typeName;
      userStore.dataSheet.data.data.type = "business";
      const names = { es: "Empresa", en: "Business" };
      const typeName = names[globalStore.lang];
      userStore.dataSheet.data.data.typeName = typeName;
    },
  };
  setTimeout(() => {
    types[type]();
  }, 10);
};

const removeRol = (pos) => {
  crew.value.roles.splice(pos, 1);
};

const selectRol = (rol) => {
  if (!!crew?.value?.roles) {
    const rolExists = crew.value.roles.some(
      (existingRol) =>
        existingRol.name[globalStore.lang].toLowerCase() ===
        rol.label.toLowerCase()
    );
    if (!rolExists) {
      crew.value.roles.unshift({
        name: { [globalStore.lang]: rol.label },
        _id: rol.id,
      });
    }
    setTimeout(() => {
      role.value = "";
    }, 10);
  }
};

const searchRoles = async () => {
  const trimmedSearch = role.value.trim();
  if (trimmedSearch !== "") {
    loadings.value.roles = true;
    await userStore.filterRolesByName(trimmedSearch);
    if (userStore.roles_list && userStore.roles_list.length) {
      results.value.roles = mapperRoles();
    } else {
      results.value.roles = [];
    }
    loadings.value.roles = false;
  }
};

const clearCrew = () => {
  cleanSearch();
  crew.value = {};
  emailError.value = false;
  nameError.value = false;
};

const editUser = () => {
  userStore.showModalDataSheet = true;
  userStore.dataSheet.state = "edit";
  userStore.userDataSheetId = crew.value._id;
  userStore.dataSheet.onlyEdit = true;
  userStore.showBtnBack = true;
};

const save = async () => {
  globalStore.loading = true;

  if (typeAction.value === "old") {
    const resp = await addNewUserToCrew();
  } else if (typeAction.value === "new") {
    const resp = await createNewUserToCrew();
  }

  globalStore.loading = false;
};

const createNewUserToCrew = async () => {
  if (!emailError.value && !nameError.value) {
    try {
      globalStore.loading = true;
      crew.value = await userStore.upsertContact(crew.value);
      await addNewUserToCrew();
    } catch (error) {
      console.error(error);
    } finally {
      globalStore.loading = false;
    }
  }
};
const addNewUserToCrew = async () => {
  try {
    globalStore.loading = true;

    const newCrew = {
      contact: crew.value._id,
      roles: [...crew.value.roles],
      permissions: [],
      creator: userStore.userSession._id,
    };

    let crews = [...incomeStore.income.crew];
    crews.unshift(newCrew);

    const body = {
      _id: incomeStore.income._id,
      crew: crews,
      idProject: idProject.value,
      idContact: newCrew.contact,
      member: false,
    };

    const resp = await incomeStore.updateMovement(body);
    incomeStore.income.crew = resp.crew;
  } catch (error) {
    console.error(error);
  } finally {
    globalStore.loading = false;
    emit("closeModal");
  }
};

const verifyEmail = async () => {
  const email = crew.value.email.trim();
  const isValidEmail = regexEmail(email);
  if (isValidEmail && email !== "") {
    try {
      const resp = await userStore.findByUsersByNameOrEmail(false, true, email);
      if (resp?.length === 0) {
        emailError.value = false;
      } else {
        emailError.value = true;
      }
    } catch (error) {
      emailError.value = true;
    }
  } else {
    if (email === "") emailError.value = false;
    else emailError.value = true;
  }
};

const verifyName = () => {
  const name = crew.value.data.legalName;
  nameError.value = name.trim() === "";
  crew.value.data.legalName = capitalizeFirstLetter(name);
};

const inputEventNickName = () => {
  crew.value.data.nickName = capitalizeFirstLetter(crew.value.data.nickName);
};

// Computed
const labelBody = computed(() => {
  const labels = {
    old: "Ingrese su Rol",
    new: "Información General",
  };
  return labels?.[typeAction.value] || "";
});
const getIconForm = computed(() => {
  const types = {
    business: "building",
    personal: "user",
  };
  return types[crew.value.data.type] || "building";
});
</script>

<template>
  <div class="addCrew">
    <div class="addCrew__title">
      <span>Agregar Crew - {{ titleAction }}</span>
      <u-button-icon
        icon="close"
        class="btnIconModify"
        type="outlined"
        :color="mainColor"
        :colorActive="secondColor"
        :colorHover="secondColor"
        @click="emit('closeModal')"
      />
    </div>
    <div class="addCrew__header">
      <div class="addCrew__header-search">
        <u-avatar
          :size="80"
          :user="{
            name: crew?.data?.legalName || 'crew',
            src: crew?.imgUrl || null,
          }"
        />
        <div class="addCrew__header-content" v-if="typeAction !== ''">
          <div class="addCrew__header-top">
            <span class="truncateText">{{ crew?.data?.legalName || "-" }}</span>
            <span :class="`u u-${crew?.user ? 'verified' : ''}`"></span>
            <u-button
              text="Cambiar"
              icon="change"
              type="outlined"
              size="s"
              @click="clearCrew"
            />
          </div>
          <span class="addCrew__header-second truncateText">{{
            crew?.data?.nickName || "-"
          }}</span>
          <span class="addCrew__header-third truncateText">{{
            crew?.email || "-"
          }}</span>
        </div>
        <u-search-by-type
          v-else
          v-model="search"
          @input="filterUsers"
          class="search"
          placeholder="Buscar usuarios por nombre..."
          :loading="loading"
          :options="results"
          :showSearchIcon="true"
          :avatar="true"
          :create="true"
          size="s"
          :updated="false"
          :snippet="true"
          :iconSelect="null"
          :types="typesUser"
          @updatedTypeOp="updatedTypeOp"
          @newOption="createUser"
          @selectedOption="selectedUser"
          @cleanInput="cleanSearch"
        />
        <u-button-icon
          v-if="crew._id"
          icon="edit"
          class="floatBtn"
          size="s"
          @click="editUser"
        />
      </div>
    </div>
    <div
      class="addCrew__body"
      :class="`addCrew__body ${typeAction !== '' ? 'withBorder' : ''}`"
    >
      <span class="addCrew__body-label">
        {{ labelBody }}
      </span>
      <template v-if="typeAction === 'new'">
        <div
          class="addCrew__body-group"
          v-if="crew?.data?.hasOwnProperty('legalName')"
        >
          <div class="addCrew__group-label">
            <span class="u u-user"></span><span>Nombre</span>
          </div>
          <div class="addCrew__group-input">
            <u-input
              v-model="crew.data.legalName"
              size="s"
              placeholder="Ingresa el nombre"
              :error="nameError"
              @input="verifyName"
            />
          </div>
        </div>
        <div
          class="addCrew__body-group"
          v-if="crew?.data?.hasOwnProperty('nickName')"
        >
          <div class="addCrew__group-label">
            <span class="u u-emoji"></span><span>Alias</span>
          </div>
          <div class="addCrew__group-input">
            <u-input
              v-model="crew.data.nickName"
              size="s"
              placeholder="Ingresa el alias"
              @input="inputEventNickName"
            />
          </div>
        </div>
        <div
          class="addCrew__body-group"
          v-if="crew?.data?.hasOwnProperty('type')"
        >
          <div class="addCrew__group-label">
            <span class="u u-building"></span><span>Tipo</span>
          </div>
          <div class="addCrew__group-input">
            <u-select
              :options="typeSupplierOptions"
              :iconOption="true"
              :icon="getIconForm"
              size="s"
              v-model="crew.data.typeName"
              :full-data="true"
              @full-data="(data) => (crew.data.type = data.value)"
            />
          </div>
        </div>
        <div class="addCrew__body-group" v-if="crew?.hasOwnProperty('email')">
          <div class="addCrew__group-label">
            <span class="u u-email"></span><span>Correo</span>
          </div>
          <div class="addCrew__group-input">
            <u-input
              v-model="crew.email"
              size="s"
              placeholder="Ingresa el correo electrónico"
              :error="emailError"
              @input="verifyEmail"
            />
          </div>
        </div>
      </template>
      <template v-if="typeAction === 'old'">
        <div class="addCrew__body-group">
          <div class="addCrew__group-label">
            <span class="u u-usuarios"></span><span>Roles</span>
          </div>
          <div
            class="addCrew__group-input"
            v-if="crew?.hasOwnProperty('roles')"
          >
            <u-search
              v-model="role"
              size="s"
              placeholder="Ingresa un rol"
              :loading="loadings.roles"
              :options="results.roles"
              @cleanInput="role = ''"
              @selectedOption="selectRol"
              @input="searchRoles"
            />
            <div class="addCrew__group-tags">
              <u-tags
                v-for="(role, r) in crew.roles"
                size="s"
                :key="r"
                :text="role?.name?.[globalStore.lang] || '-'"
                @closeButton="removeRol(r)"
                :delete="true"
              />
            </div>
          </div>
        </div>
      </template>
    </div>
    <div class="addCrew__actions">
      <u-button
        text="Cancelar"
        type="outlined"
        size="s"
        class="btnAction"
        @click="emit('closeModal')"
      />
      <u-button text="Continuar" size="s" class="btnAction" @click="save" />
    </div>
  </div>

  <!-- Preguntar sobre los roles, si los roles son los mismos del crew con los del contacto, fijarte de guardar la data con lo de crear proyecto -->
</template>

<style scoped>
.addCrew {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.addCrew__title {
  height: 40px;
}

.addCrew__title span {
  font-size: 16px;
  font-weight: 600;
  line-height: 20px;
  color: var(--neutral-text-body);
}

.addCrew__header {
  height: 80px;
}

.addCrew__header-search {
  display: grid;
  grid-template-columns: 80px 1fr;
  gap: 20px;
  align-items: center;
  position: relative;
}

.addCrew__header-content {
  flex-grow: 1;
  height: 80px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding-bottom: 5px;
}

.addCrew__header-search .search {
  flex-grow: 1;
}

.addCrew__body {
  flex-grow: 1;
  min-height: 320px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding-top: 30px;
}

.addCrew__body.withBorder {
  border-top: 1px solid var(--neutral-border-subtle);
}

.addCrew__body-group {
  display: grid;
  grid-template-columns: 100px 1fr;
  gap: 16px;
  padding: 0 20px;
  align-items: flex-start;
}

.addCrew__group-label {
  display: flex;
  align-items: center;
  gap: 10px;
  height: 32px;
}

.addCrew__group-label span {
  color: var(--neutral-text-caption);
}

.addCrew__group-label span:nth-child(2) {
  font-size: 14px;
  font-weight: 600;
  line-height: 18px;
  text-align: left;
  text-underline-position: from-font;
  text-decoration-skip-ink: none;
}

.addCrew__group-input {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.addCrew__group-tags::-webkit-scrollbar {
  width: 8px;
  height: 8px;
  background: var(--neutral-surface-light);
  border-radius: 20px;
}

.addCrew__group-tags::-webkit-scrollbar-thumb {
  background: var(--neutral-surface-subtle);
  border-radius: 5px;
}

.addCrew__group-tags {
  display: flex;
  gap: 2px;
  width: 100%;
  flex-wrap: wrap;
  max-height: 78px;
  overflow-y: auto;
  margin-bottom: 10px;
  gap: 10px;
}

.addCrew__title,
.addCrew__actions {
  height: 32px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.addCrew__header-top {
  width: 100%;
  flex-shrink: 0;
  display: grid;
  grid-template-columns: auto 1fr auto;
  gap: 10px;
  align-items: flex-end;
}

.addCrew__header-top span:nth-child(1) {
  font-size: 18px;
  font-weight: 600;
  line-height: 20px;
  text-align: left;
  text-underline-position: from-font;
  text-decoration-skip-ink: none;
  color: var(--neutral-text-body);
}

.addCrew__header-top span:nth-child(2) {
  font-size: 18px;
  margin-right: 10px;
}

.addCrew__body-label {
  font-size: 16px;
  font-weight: 600;
  line-height: 20px;
  text-align: left;
  color: var(--neutral-text-body);
}

.addCrew__header-second {
  font-size: 16px;
  line-height: 20px;
  color: var(--neutral-text-caption);
  max-width: 284px;
}

.addCrew__header-third {
  font-size: 14px;
  line-height: 18px;
  color: var(--primary-text-default);
  max-width: 284px;
}

.btnIconModify {
  border-radius: 50%;
}

.btnAction {
  width: 120px;
}

.floatBtn {
  position: absolute;
  left: 50px;
  top: 50px;
  border-radius: 50%;
  box-shadow: var(--shadow-2);
}

span {
  font-family: Nunito;
}
</style>
