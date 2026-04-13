<script setup>
import { ref, defineEmits, computed, onMounted } from "vue";
import { regexEmail } from "@/utils/helpers";
import useGlobalStore from "@/stores/global";
import useAuthStore from "@/stores/auth";
import usePermissionsStore from "@/stores/permissions";
import useUserStore from "@/stores/user";
import useOrganizationStore from "@/stores/organization";
import { useI18n } from "vue-i18n";

// Stores
const globalStore = useGlobalStore();
const authStore = useAuthStore();
const permissionsStore = usePermissionsStore();
const userStore = useUserStore();
const organizationStore = useOrganizationStore();

// Emits
const emit = defineEmits(["closeModal", "lockModal"]);

// Constants
const { t } = useI18n();
const module = "modules.mySettings.modals.addMember";
const profiles = permissionsStore.profilePermissions.map(profile => ({
  _id: profile._id,
  label: profile?.name?.[globalStore.lang] || "-",
  fullData: profile
}));

// Variables
const saving = ref(false);
const newMembers = ref([]);
const error = ref(false);
const errorMessage = ref("");
const newUser = ref(false);
const verify = ref(false);
const form = ref({
  search: "",
  member: null,
  profile: null,
  profileName: ""
});

// Mounted
onMounted(() => {
  const defaultProfile = permissionsStore.profilePermissions.find(profile => profile.code === "guest");
  form.value.profile = defaultProfile;
  form.value.profileName = defaultProfile?.name?.[globalStore.lang];
});

// Computed
const inValidEmail = computed(() => !regexEmail(form.value.search));

const btnCloseModalProperties = computed(() => ({
  icon: "close",
  class: "btnIconModify",
  color: "--bg-neutral-200",
  colorHover: "--bg-neutral-400",
  colorActive: "--bg-neutral-600",
  size: "s",
  disabled: saving.value,
}));

const btnSaveProperties = computed(() => ({
  text: t(module + '.button'),
  class: "mainBtnModify",
  size: "s",
  // Deshabilitado si no hay miembros, si está guardando o si está verificando email
  disabled: saving.value || verify.value || newMembers.value.length === 0
}));

const btnAddProperties = computed(() => {
  let disabled = false;

  if (newUser.value) {
    // Si es correo nuevo, debe ser un email válido
    disabled = inValidEmail.value;
  } else {
    // Si es usuario existente, debe tener un _id seleccionado
    disabled = form?.value?.member?._id === undefined || form?.value?.member?._id === null;
  }

  // Si ninguno de los dos casos aplica y el campo está vacío, deshabilitar
  if (!newUser.value && !form.value.member) {
    disabled = true;
  }

  return {
    icon: "save",
    size: "m",
    disabled: disabled || saving.value || verify.value
  };
});

// Functions
const getAvatar = (item) => {
  return {
    name: item?.member?.data?.legalName || item?.email || '-',
    src: item?.member?.imgUrl || '-'
  };
};

const getSelectedProfile = (profile) => {
  form.value.profile = profile.fullData;
};

const save = async () => {
  let body = {
    users: []
  }
  newMembers.value.forEach(item => {
    if(item.type === 'oldUser') {
      body.users.push({
        user: item.member._id,
        permissionsProfile: item.profile._id
      })
    } else {
      body.users.push({
        email: item.email,
        permissionsProfile: item.profile._id
      })
    }
  });

  try {
    globalStore.loading = true;
    await organizationStore.addUserMultiple(body);
    await organizationStore.getOrganizationById();
  } catch (error) {
    console.error(error);
  } finally {
    globalStore.loading = false;
    saving.value = true;
    emit("closeModal");
  }
};

// Buscador
const loadingSearch = ref(false);
const searchTimeout = ref(null);
const lastSearch = ref("");
const results = ref([]);

const searchUsers = async (e) => {
  newUser.value = false;
  error.value = false;
  errorMessage.value = "";
  form.value.member = null;

  e.target.value = e.target.value.trim();
  const val = e.target.value;

  if (searchTimeout.value) {
    clearTimeout(searchTimeout.value);
  }

  if (val === lastSearch.value) return;

  searchTimeout.value = setTimeout(async () => {
    lastSearch.value = val;

    if (!val) {
      results.value = [];
      loadingSearch.value = false;
      return;
    }

    try {
      loadingSearch.value = true;
      const resp = await userStore.findByUsersByNameOrEmail(false, true, val, { onlyUsers: true });
      results.value = mapperResults(resp) || [];
    } catch (err) {
      console.error(err);
    } finally {
      loadingSearch.value = false;
    }
  }, 600);
};

const selectedOption = (op) => {
  form.value.member = op.oldData;
  newUser.value = false;
  error.value = false;
  errorMessage.value = "";
};

const cleanInput = () => {
  loadingSearch.value = false;
  results.value = [];
  form.value.search = "";
  form.value.member = null;
  error.value = false;
  errorMessage.value = "";
  newUser.value = false;
  verify.value = false;
  lastSearch.value = "";
};

const newOption = () => {
  // Se llama cuando el usuario escribe directamente un correo (sin seleccionar de lista)
  const isValid = regexEmail(form.value.search);
  error.value = !isValid;
  errorMessage.value = !isValid ? t(module + '.error1') : "";
  newUser.value = true;
  form.value.member = null;
};

const mapperResults = (list) => {
  const resp = [];
  list.forEach((l) => {
    // Excluir usuarios ya agregados al listado
    const alreadyAdded = newMembers.value.findIndex(m => m.member?._id === l._id);
    if (alreadyAdded === -1) {
      resp.push({
        label: l?.data?.legalName ?? `${l?.name?.first} ${l?.name?.last}`,
        text: l?.email ?? '',
        img: l?.user?.imgUrl ?? l?.imgUrl,
        oldData: { ...l },
      });
    }
  });
  return resp;
};

const addMember = async () => {
  error.value = false;
  errorMessage.value = "";

  // Caso 1: usuario nuevo por correo
  if (newUser.value) {
    if (inValidEmail.value) {
      error.value = true;
      errorMessage.value = t(module + '.error1');
      return;
    }

    // Verificar que el correo no esté ya en newMembers
    const alreadyInList = newMembers.value.findIndex(m => m.email === form.value.search);
    if (alreadyInList !== -1) {
      error.value = true;
      errorMessage.value = t(module + '.error2');
      return;
    }

    // Verificar que el correo no exista ya en el sistema
    verify.value = true;
    saving.value = true;
    try {
      const checkEmail = await authStore.getUserByEmail(form.value.search);
      if (checkEmail && checkEmail._id) {
        error.value = true;
        errorMessage.value = t(module + '.error3');
        return;
      }
    } catch (err) {
      console.error(err);
    } finally {
      verify.value = false;
      saving.value = false;
    }

    // Agregar nuevo usuario por correo
    newMembers.value.unshift({
      email: form.value.search,
      profile: form.value.profile,
      type: "newUser",
    });

  // Caso 2: usuario existente seleccionado de la lista
  } else {
    if (!form.value.member || !form.value.member._id) return;

    // Verificar que no esté ya en newMembers (doble check)
    const alreadyAdded = newMembers.value.findIndex(m => m.member?._id === form.value.member._id);
    if (alreadyAdded !== -1) {
      error.value = true;
      errorMessage.value = t(module + '.error4');
      return;
    }

    newMembers.value.unshift({
      member: form.value.member,
      profile: form.value.profile,
      type: "oldUser"
    });
  }

  setTimeout(() => cleanInput(), 0);
};
</script>

<template>
  <div class="newMember">
    <div class="newMember__header">
      <span class="title">{{ t(module + '.title') }}</span>
      <u-button-icon
        v-bind="btnCloseModalProperties"
        @action-btn="emit('closeModal')"
      />
    </div>
    <div class="newMember__search">
      <span class="label">{{ t(module + '.label') }}</span>
      <div class="newMember__search-inputs">
        <u-search
          v-model="form.search"
          size="m"
          :placeholder="t(module + '.placeholder')"
          :avatar="true"
          :snippet="true"
          :create="true"
          :options="results"
          :loading="loadingSearch"
          :error="error"
          @input="searchUsers($event)"
          @selectedOption="selectedOption"
          @cleanInput="cleanInput"
          @newOption="newOption"
        />
        <u-select
          v-model="form.profileName"
          size="m"
          :options="profiles"
          :full-data="true"
          @full-data="getSelectedProfile"
        />
        <u-loading :size="32" v-if="verify" />
        <u-button-icon v-else v-bind="btnAddProperties" @click="addMember" />
      </div>
      <!-- Mensaje de error -->
      <span v-if="error && errorMessage" class="errorMsg">{{ errorMessage }}</span>
    </div>
    <div class="newMember__list">
      <div class="newMember__list-item" v-for="(item, m) in newMembers" :key="m">
        <button @click="newMembers.splice(m, 1)"><span class="u u-close"></span></button>
        <u-avatar :size="40" :user="getAvatar(item)" />
        <div class="newMember__list-item-texts">
          <div>
            <span class="name truncateText">{{ item?.member?.data?.legalName || item?.email || '-' }}</span>
            <span class="label">{{ t(module + '.role') }}</span>
          </div>
          <div>
            <span class="email truncateText">{{ item?.member?.email || item?.email || '-' }}</span>
            <span class="profile truncateText">{{ item?.profile?.name?.[globalStore.lang] || '-' }}</span>
          </div>
        </div>
      </div>
    </div>
    <div class="newMember__footer">
      <u-button
        v-bind="btnSaveProperties"
        @action-btn="save"
      />
    </div>
  </div>
</template>

<style scoped>
/* Global */
.newMember {
  width: 540px;
  min-height: 342px;
  max-height: 520px;
  display: grid;
  grid-template-rows: 32px 74px 1fr 32px;
  row-gap: 24px;
}

/* Header */
.newMember__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.newMember__header .title {
  color: var(--neutral-text-body);
  font-size: 16px;
  font-weight: 600;
  letter-spacing: 0;
  line-height: 20px;
  text-align: left;
}

/* Search */
.newMember__search {
  display: grid;
  grid-template-rows: auto 1fr auto;
  row-gap: 6px;
}
.newMember__search .label {
  font-size: 12px;
  font-weight: 600;
  line-height: 16px;
  color: var(--neutral-text-body);
}
.newMember__search-inputs {
  display: grid;
  grid-template-columns: 1fr 180px 36px;
  column-gap: 10px;
}
.errorMsg {
  font-size: 10px;
  line-height: 10px;
  font-weight: 500;
  color: var(--danger-text-default);
}

/* List */
.newMember__list {
  overflow: auto;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.newMember__list::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}
.newMember__list::-webkit-scrollbar-thumb {
  border-radius: 5px;
  background-color: var(--neutral-border-default);
}
.newMember__list::-webkit-scrollbar-track {
  border-radius: 5px;
  background-color: var(--neutral-border-subtle);
}
.newMember__list-item {
  display: grid;
  grid-template-columns: auto 40px 1fr;
  column-gap: 12px;
  align-items: center;
  margin-right: 2px;
}
.newMember__list-item button {
  display: flex;
  justify-content: center;
  align-items: center;
}
.newMember__list-item button span {
  font-size: 24px;
  line-height: 24px;
  color: var(--neutral-text-caption);
  transition: 0.3s;
}
.newMember__list-item button:hover span {
  color: var(--primary-text-default);
}
.newMember__list-item-texts {
  display: grid;
  grid-template-rows: 1fr 1fr;
}
.newMember__list-item-texts div {
  display: grid;
  grid-template-columns: 1fr 120px;
  column-gap: 12px;
}
.newMember__list-item-texts .name {
  color: var(--neutral-text-body);
  font-size: 16px;
  font-weight: 700;
  line-height: 20px;
  text-align: left;
}
.newMember__list-item-texts .email {
  color: var(--neutral-text-caption);
  font-size: 14px;
  font-weight: 400;
  line-height: 16px;
  text-align: left;
}
.newMember__list-item-texts .label {
  color: var(--neutral-text-caption);
  font-size: 12px;
  font-weight: 400;
  line-height: 14px;
  text-align: right;
}
.newMember__list-item-texts .profile {
  color: var(--neutral-text-body);
  font-size: 14px;
  font-weight: 600;
  line-height: 16px;
  text-align: right;
}

/* Footer */
.newMember__footer {
  display: flex;
  justify-content: flex-end;
  align-items: center;
}

/* CUSTOM COMPONENTS - MODIFY */
.btnIconModify {
  border-radius: 50%;
  color: var(--white);
}
.mainBtnModify {
  width: 135px;
}
</style>