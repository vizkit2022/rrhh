<script setup>
/*  IMPORTS Y CONFIGURACIONES */
import { defineEmits, computed, ref, watch, onMounted, onUnmounted } from "vue";
import { useI18n } from "vue-i18n";
import configListPermissions from "@/utils/configTables/listPermissions.json";
import useOrganizationStore from "@/stores/organization";
import usePermissionStore from "@/stores/permissions";
import useGlobalStore from "@/stores/global";
import useBusinessAreaStore from "@/stores/businessAreas";
import useUserStore from "@/stores/user";
import middlewarePermisssionActivation from "~/composables/usePermissionActivation";

/* DEFINICIÓN DE PROPS Y EMITS  */
const props = defineProps({
  memberSelected: {
    type: Object,
    default: () => ({}),
  },
});
const emit = defineEmits(["closeModal", "updatedMembers"]);

/* STORES Y CONFIGURACIÓN BÁSICA */
const { t } = useI18n(); // Configuración de i18n
const module = "modules.organizations.settings.members.modal.listPermissions"; // Ruta de traducción

// Inicialización de stores
const organizationStore = useOrganizationStore();
const permissionStore = usePermissionStore();
const businessAreaStore = useBusinessAreaStore();
const globalStore = useGlobalStore();
const userStore = useUserStore();

/* ESTADO REACTIVO */
// Usuario y estados de permisos
const user = ref(null);
const tabSelected = ref(0);
const openPermissions = ref(true);

// Estados de usuario y controles
const isUserOwner = ref(false);
const isUserAdmin = ref(false);
const isCurrentSuperUser = ref(false);

// Estados para modales y formularios
const showPermissionType = ref(false);
const showPermissionNewRoleUser = ref(false);
const disabledSaveButton = ref(false);
const nameNewRole = ref("");

// Estados para búsqueda y selección
const defaultResults = ref([]);
const search = ref("");
const disabledEditSearch = ref(false);
const desactiveSearch = ref(false);
const opcionActual = ref(null);
const perfilActual = ref(null);

// Estados para edición y control de tabla
const permissionsRadioTables = ref(true);
const editSave = ref(false);
const tableModified = ref(true);

// Valores fijos para controles de radio
const radioBoxesAll = ["allCreated", "onlyAssigned"];
const radioBoxesSub = ["enabled", "disabled"];
const itemTables = ["listAllPermissions", "listSubPermissions"];

// Datos para permisos por defecto
const AllPermissionsDefault = ref(null);
const SubsPermissionsDefault = ref(null);

// Tablas de permisos
const listAllPermissions = ref([
  {
    name: "",
    allCreated: null,
    onlyAssigned: null,
    code: "access_projects",
  },
]);

const listSubPermissions = ref([
  {
    name: "",
    enabled: null,
    disabled: null,
    code: "create_projects",
    buttonsDisabled: false,
  },
  {
    name: "",
    enabled: null,
    disabled: null,
    code: "create_budgets",
    buttonsDisabled: false,
  },
  {
    name: "",
    enabled: null,
    disabled: null,
    separator: true,
    code: "create_business",
    buttonsDisabled: false,
  },
  {
    name: "",
    enabled: null,
    disabled: null,
    code: "edit_projects",
    buttonsDisabled: false,
  },
  {
    name: "",
    enabled: null,
    disabled: null,
    code: "edit_project_name",
    buttonsDisabled: false,
  },
  {
    name: "",
    enabled: null,
    disabled: null,
    separator: true,
    code: "edit_project_client",
    buttonsDisabled: false,
  },
  {
    name: "",
    enabled: null,
    disabled: null,
    separator: true,
    code: "delete_projects",
    buttonsDisabled: false,
  },
  {
    name: "",
    enabled: null,
    disabled: null,
    separator: true,
    code: "view_metrics",
    buttonsDisabled: false,
  },
    {
    name: '',
    enabled: null,
    disabled: null,
    code: "configs",
    buttonsDisabled: false
  },
  {
    name: "",
    enabled: null,
    disabled: null,
    code: "config_validations",
    buttonsDisabled: false,
  },
  {
    name: "",
    enabled: null,
    disabled: null,
    code: "configure_business_area",
    buttonsDisabled: false,
  }
]);

// Copias para detectar cambios
const listAllPermissionsCopy = ref([]);
const listSubPermissionsCopy = ref([]);

// Pestañas del modal
const tabs = ref([
  {
    label: t(`${module}.tags.titlePermissions`),
    tab: 0,
    disabled: false,
  },
  {
    label: t(`${module}.tags.titleBusinessAreas`),
    tab: 1,
    disabled: true,
  },
]);

/* PROPIEDADES COMPUTADAS */
// Agrupa ambas tablas para el template
const arraysTables = computed(() => [
  listAllPermissions.value,
  listSubPermissions.value,
]);

// Botones de editar y guardar
const editSaveButtonArray = computed(() => [
  {
    text: t(`${module}.buttons.editPermissions.text`),
    icon: "edit",
    disabled: disabledEditSearch.value || !isCurrentSuperUser.value,
    action: handleEditPermissions,
  },
  {
    text: t(`${module}.buttons.saveProfile.text`),
    icon: "save",
    disabled:
      (usePermissionStore().profileByUserID?.code ===
        opcionActual.value?.value ||
        disabledSaveButton.value) &&
      (tableModified.value || disabledSaveButton.value),
    action: handleSavePermissions,
  },
]);

const currentButton = computed(() => {
  return editSave.value
    ? editSaveButtonArray.value[1]
    : editSaveButtonArray.value[0];
});

/* BOTONES Y OPCIONES DE UI */
const buttonsAvisoTypePermissions = [
  {
    text: t(`${module}.dialogPermissions.typePermissions.buttonAllMembers`),
    type: "outlined",
    size: "xs",
    class: "btnEdit",
    color: "--neutral-text-caption",
    action: () => handleSaveAllMembersPermissions(),
  },
  {
    text: t(`${module}.dialogPermissions.typePermissions.buttonThisUser`),
    type: "outlined",
    size: "xs",
    class: "btnEdit",
    color: "--neutral-text-caption",
    action: () => handleEditNewProfilePermission(),
  },
];

const buttonSaveNewProfile = {
  text: t(
    `${module}.dialogPermissions.newRolePermissions.buttonSaveNewProfile`
  ),
  icon: "save",
  type: "outlined",
  size: "xs",
  class: "btnSaveNewProfile",
  action: () => handleSaveNewProfile(),
};

// Estado para el botón de aplicar cambios de cambio de perfil
const isChangeProfile = ref(false);

const handleChangeProfile = async () => {
  // Verificamos si el usuario actual es administrador
  if (!isCurrentSuperUser.value) {
    console.log(
      "Sólo los administradores pueden cambiar el perfil de permisos"
    );
    return;
  }

  // obtener el id del perfil de permisos actual y el body para actualizar
  const idPermissions = opcionActual.value.permissions.id;
  const body = { userId: user.value._id, permissionId: idPermissions };
  try {
    globalStore.loading = true;
    // Actualizamos el perfil de permisos del usuario y obtenemos el perfil de permisos del usuario
    await permissionStore.updateProfilePermissions(body);
    await permissionStore.getProfileByUserId(user.value._id);

    // Actualizamos el middleware de permisos si estan activados
    await middlewarePermisssionActivation("u_header");
    globalStore.disabled = permissionStore.permissionsActivated.isEditProjects;

    // Actualizamos los perfiles y el defaultResults
    await permissionStore.getProfilePermissions();
    updateProfilePermissions();
    initializePermissionsProfilesOptionsSearch();
    await permissionStore.getProfilePermissionsByUserSession(
      userStore.userSession?._id
    );
    copyPermissions();

    // Verificamos si el usuario actual es administrador si el admin cambia sus permisos
    handleIsCurrentSuperUser();

    // Limpiamos variables
    resetUIState();

    // Actualizamos la información en la organización para la columna permisos de la vista Members
    // updateUserPermissionsInOrganization(body.userId, idPermissions);
    emit("updatedMembers");
  } catch (error) {
    console.error("Error al aplicar cambios de perfil:", error);
  } finally {
    globalStore.loading = false;
  }

  isChangeProfile.value = false;
  console.log("Cambios aplicados");
};

/* FUNCIONES AUXILIARES */
const areArraysEqual = (oldArray, newArray) => {
  return JSON.stringify(oldArray) === JSON.stringify(newArray);
};

const copyPermissions = () => {
  listAllPermissionsCopy.value = listAllPermissions.value.map((item) => ({
    ...item,
  }));
  listSubPermissionsCopy.value = listSubPermissions.value.map((item) => ({
    ...item,
  }));
};

const openDropdown = () => {
  openPermissions.value = !openPermissions.value;
};

/* FUNCIONES DE INICIALIZACIÓN Y CARGA DE DATOS */
async function fetchPermissions() {
  try {
    await permissionStore.getPermissions();
    await permissionStore.getProfilePermissions();
    await permissionStore.getProfileByUserId(user.value._id);
    await permissionStore.getProfilePermissionsByUserSession(
      userStore.userSession?._id
    );
  } catch (error) {
    console.log("Algo falló en fetchPermissions:", error);
  }
}

function updateProfilePermissions() {
  const profilePermissions = permissionStore.profilePermissions.docs;
  const newProfiles = profilePermissions.map((item) => {
    return {
      label: item.name[globalStore.lang],
      value: item.code,
      permissions: item.permissions,
    };
  });
  defaultResults.value = newProfiles;
}

function initializePermissions() {
  AllPermissionsDefault.value =
    permissionStore.filterAllPermissionsByCode("access_projects");
  SubsPermissionsDefault.value =
    permissionStore.filterSubPermissionsByDifCode("access_projects");

  listAllPermissions.value = [
    {
      name: AllPermissionsDefault.value?.name[globalStore.lang],
      allCreated: AllPermissionsDefault.value?.isActive,
      onlyAssigned: !AllPermissionsDefault.value?.isActive,
      code: AllPermissionsDefault.value?.code,
      _id: AllPermissionsDefault.value?._id,
    },
  ];

  listSubPermissions.value = listSubPermissions.value.map((subPerm) => {
    const matchedPerm = SubsPermissionsDefault.value.find(
      (perm) => perm.code === subPerm.code
    );
    return matchedPerm
      ? {
          ...subPerm,
          name: matchedPerm.name[globalStore.lang],
          enabled: matchedPerm.isActive,
          disabled: !matchedPerm.isActive,
          _id: matchedPerm._id,
        }
      : subPerm;
  });
}

function initializePermissionsProfilesOptionsSearch() {
  defaultResults.value = defaultResults.value.map((item) => {
    const matchingPermissions = permissionStore.profilePermissions.docs.find(
      (perm) => perm.code === item.value
    );
    return {
      ...item,
      permissions: matchingPermissions || {},
    };
  });

  perfilActual.value = defaultResults.value.find(
    (item) => item.value === permissionStore.profileByUserID?.code
  );

  if (perfilActual.value) {
    search.value = perfilActual.value.label;
  } else if (
    perfilActual.value === undefined &&
    user.value?.roles.length === 0
  ) {
    search.value = "Dueño de la organización";
    isCurrentSuperUser.value = false;
  } else {
    search.value = "Dueño de la organización";
    isCurrentSuperUser.value = false;
  }
}

function resetPermissions() {
  listAllPermissions.value = listAllPermissions.value.map((item) => ({
    ...item,
    allCreated: null,
    onlyAssigned: null,
  }));

  listSubPermissions.value = listSubPermissions.value.map((item) => ({
    ...item,
    enabled: null,
    disabled: null,
  }));
}

function handleIsCurrentSuperUser() {
  isUserOwner.value =
    organizationStore.organization?.owner?._id === userStore.userSession?._id;
  isUserAdmin.value =
    permissionStore.profilePermissionsUserSession?.code === "admin";
  isCurrentSuperUser.value = isUserOwner.value || isUserAdmin.value;
}

/* FUNCIONES DE MANEJO DE UI Y EVENTOS */
const handleSelectedOptionRole = (option) => {
  const perfilSelect = defaultResults.value.find(
    (item) => item.value === option.value
  );
  if (!perfilSelect) {
    return console.log("No se encontró el perfil de permisos", perfilSelect);
  }

  opcionActual.value = perfilSelect;

  listAllPermissions.value[0].allCreated =
    perfilSelect.permissions.permissions.includes(
      listAllPermissions.value[0]._id
    );
  listAllPermissions.value[0].onlyAssigned =
    !listAllPermissions.value[0].allCreated;

  listSubPermissions.value.forEach((item) => {
    item.enabled = perfilSelect.permissions.permissions.includes(item._id);
    item.disabled = !item.enabled;
  });

  nameNewRole.value = "";
  resetUIState();
  copyPermissions();
};

const toggleRadio = (permission, selected) => {
  if (!isCurrentSuperUser.value) {
    console.log("Sólo los administradores pueden modificar permisos");
    return;
  }

  if (selected === "allCreated" || selected === "onlyAssigned") {
    permission.allCreated = selected === "allCreated";
    permission.onlyAssigned = selected === "onlyAssigned";
  } else if (selected === "enabled" || selected === "disabled") {
    permission.enabled = selected === "enabled";
    permission.disabled = selected === "disabled";

    // Manejar dependencias de permisos
    handlePermissionDependencies(permission, selected);
  }
};

const handlePermissionDependencies = (permission, selected) => {
  // Si se activa/desactiva "create_projects", afecta a otros permisos relacionados
  if (permission.code === "create_projects") {
    const dependentPermissions = ["create_budgets", "create_business"];
    updateDependentPermissions(dependentPermissions, selected === "enabled");
  }

  // Si se activa/desactiva "edit_projects", afecta a otros permisos relacionados
  if (permission.code === "edit_projects") {
    const dependentPermissions = ["edit_project_name", "edit_project_client"];
    updateDependentPermissions(dependentPermissions, selected === "enabled");
  }
};

const updateDependentPermissions = (dependentCodes, isEnabled) => {
  listSubPermissions.value.forEach((item) => {
    if (dependentCodes.includes(item.code)) {
      item.enabled = isEnabled;
      item.disabled = !isEnabled;
      item.buttonsDisabled = !isEnabled;
    }
  });
};

/* FUNCIONES DE ACCIONES PRINCIPALES */
const handleEditPermissions = () => {
  if (!isCurrentSuperUser.value) {
    console.log("Sólo los administradores pueden editar permisos");
    return;
  }

  editSave.value = !editSave.value;
  permissionsRadioTables.value = !permissionsRadioTables.value;
};

const handleSavePermissions = () => {
  if (!isCurrentSuperUser.value) {
    console.log("Sólo los administradores pueden guardar permisos");
    return;
  }

  showPermissionType.value = true;
  disabledSaveButton.value = true;
};

const handleDeletePermissions = async () => {
  if (!isCurrentSuperUser.value) {
    console.log("Sólo los administradores pueden eliminar permisos");
    return;
  }

  const idActual = opcionActual.value.permissions.id;
  await permissionStore.deleteProfilePermissions(idActual);
  console.log("Eliminar permisos");
};

const handleEditNewProfilePermission = () => {
  if (!isCurrentSuperUser.value) {
    console.log("Sólo los administradores pueden crear perfiles de permisos");
    return;
  }

  showPermissionType.value = !showPermissionType.value;
  showPermissionNewRoleUser.value = !showPermissionNewRoleUser.value;
};

const updateUserPermissionsInOrganization = (userId, permissionId) => {
  const posUserOrg = organizationStore.organization.users.findIndex(
    (user) => user.user._id === userId
  );
  if (posUserOrg !== -1) {
    organizationStore.organization.users[posUserOrg].PermissionsProfile =
      permissionId;
  }
};

const handleSaveAllMembersPermissions = async () => {
  if (!isCurrentSuperUser.value) {
    console.log("Sólo los administradores pueden guardar permisos");
    return;
  }

  const idPermissions = opcionActual.value.permissions.id;
  const body = { userId: user.value._id, permissionId: idPermissions };

  const bodyUpdatePermissions = {
    permissions: [
      ...listAllPermissions.value
        .filter((item) => item.allCreated)
        .map((item) => item._id),
      ...listSubPermissions.value
        .filter((item) => item.enabled)
        .map((item) => item._id),
    ],
  };

  globalStore.loading = true;

  try {
    await permissionStore.updatePermissions(
      idPermissions,
      bodyUpdatePermissions
    );
    await permissionStore.updateProfilePermissions(body);
    await permissionStore.getProfileByUserId(user.value._id);

    await middlewarePermisssionActivation("u_header");
    globalStore.disabled = permissionStore.permissionsActivated.isEditProjects;

    // Actualizamos los perfiles y el defaultResults
    await permissionStore.getProfilePermissions();
    updateProfilePermissions();
    initializePermissionsProfilesOptionsSearch();
    await permissionStore.getProfilePermissionsByUserSession(
      userStore.userSession?._id
    );
    copyPermissions();

    // Verificamos si el usuario actual es administrador si el admin cambia sus permisos
    handleIsCurrentSuperUser();

    // Limpiamos variables
    resetUIState();

    // Actualizamos la información en la organización para la columna permisos de la vista Members
    // updateUserPermissionsInOrganization(body.userId, idPermissions);
    emit("updatedMembers");
  } catch (error) {
    console.error("Error al guardar los permisos:", error);
  } finally {
    globalStore.loading = false;
  }
};

const handleSaveNewProfile = async () => {
  if (!isCurrentSuperUser.value) {
    console.log("Sólo los administradores pueden crear perfiles de permisos");
    return;
  }

  if (!nameNewRole.value) {
    return console.log(
      "No se ha ingresado un nombre para el nuevo perfil de permisos"
    );
  }

  globalStore.loading = true;

  const newPermissionsProfile = {
    code: nameNewRole.value.toLowerCase().replace(/\s+/g, ""),
    name: {
      es: nameNewRole.value,
      en: nameNewRole.value,
    },
    description: `Perfil de ${nameNewRole.value}`,
    isActive: true,
    permissions: [
      ...listAllPermissions.value
        .filter((item) => item.allCreated)
        .map((item) => item._id),
      ...listSubPermissions.value
        .filter((item) => item.enabled)
        .map((item) => item._id),
    ],
    users: `${user.value._id}`,
  };

  try {
    // Crear perfil y actualizar datos
    await permissionStore.createProfilePermissions(newPermissionsProfile);
    await permissionStore.getProfilePermissions();

    // Actualizar el perfil de permisos del usuario
    const permissionsIdActual = permissionStore.profilePermissions.docs.find(
      (item) => item.code === newPermissionsProfile.code
    )._id;

    const body = { userId: user.value._id, permissionId: permissionsIdActual };

    await permissionStore.updateProfilePermissions(body);
    await permissionStore.getProfileByUserId(user.value._id);
    await middlewarePermisssionActivation("u_header");

    updateProfilePermissions();
    initializePermissionsProfilesOptionsSearch();
    copyPermissions();

    // Verificar si el usuario actual es administrador
    handleIsCurrentSuperUser();

    // Limpiar estado UI
    resetUIState();
    nameNewRole.value = "";

    // Actualizamos la información en la organización para la columna permisos de la vista Members
    updateUserPermissionsInOrganization(body.userId, permissionsIdActual);
  } catch (error) {
    console.error("Error al crear el nuevo perfil de permisos:", error);
  } finally {
    globalStore.loading = false;
  }
};

const resetUIState = () => {
  disabledEditSearch.value = false;
  disabledSaveButton.value = false;
  showPermissionType.value = false;
  showPermissionNewRoleUser.value = false;
  editSave.value = false;
  permissionsRadioTables.value = true;
  tableModified.value = false;
};

/* OBSERVADORES Y EFECTOS */
watch(
  [listAllPermissions, listSubPermissions],
  () => {
    const equalAll = areArraysEqual(
      listAllPermissions.value,
      listAllPermissionsCopy.value
    );
    const equalSub = areArraysEqual(
      listSubPermissions.value,
      listSubPermissionsCopy.value
    );
    tableModified.value = !(!equalAll || !equalSub);
  },
  { deep: true }
);

watch(opcionActual, (newValue) => {
  if (newValue !== perfilActual.value) {
    isChangeProfile.value = true;
    console.log("El perfil de permisos ha cambiado");
  } else {
    isChangeProfile.value = false;
    console.log("El perfil de permisos no ha cambiado");
  }
});

onMounted(async () => {
  globalStore.loading = true;
  try {
    user.value = props.memberSelected?.user ?? {};

    await fetchPermissions();
    updateProfilePermissions();
    initializePermissions();
    handleIsCurrentSuperUser();
    initializePermissionsProfilesOptionsSearch();
    copyPermissions();
  } catch (error) {
    console.error("Error en el montaje del componente:", error);
  } finally {
    globalStore.loading = false;
  }
});
</script>

<template>
  <div class="modal__content-permissions" v-if="tabSelected == 0">
    <div class="headerPermissions">
      <div class="searchContainer">
        <div class="searchProfile">
          <span class="titleProfilePermissions">{{
            t(`${module}.permissionProfile`)
          }}</span>
          <u-select
            :options="defaultResults"
            :disabled="desactiveSearch || !isCurrentSuperUser"
            class="search"
            v-model="search"
            :full-data="true"
            @full-data="handleSelectedOptionRole"
            :placeholder="t(`${module}.profileFinderPlaceholder`)"
            :create="false"
          />
        </div>
        <u-button
          v-if="isChangeProfile"
          type="outlined"
          text="Asignar Perfil"
          icon="u u-check"
          size="s"
          class="btnSave"
          @click="handleChangeProfile"
        />
        <u-button
          v-else
          type="outlined"
          :text="currentButton?.text"
          :icon="currentButton?.icon"
          size="s"
          class="btnSave"
          :disabled="currentButton?.disabled"
          @click="currentButton?.action"
        />
      </div>

      <!-- Modal de selección de tipo de permisos -->
      <div class="containerTypePermissions" v-if="showPermissionType">
        <div class="infoTypePermissions">
          <span class="u u-info-outlined"></span>
          <p class="textTypePermissions">
            {{ t(`${module}.dialogPermissions.typePermissions.questionText`) }}
          </p>
        </div>
        <div class="buttonsTypePermissions">
          <u-button
            v-for="(button, index) in buttonsAvisoTypePermissions"
            :key="index"
            :text="button.text"
            :type="button.type"
            :size="button.size"
            :class="button.class"
            @click="button.action"
            :color="button.color"
          />
        </div>
      </div>

      <!-- Modal de nuevo rol de perfil -->
      <div class="containerNewRolePermissions" v-if="showPermissionNewRoleUser">
        <div class="infoNewRolePermissions">
          <span class="u u-info-outlined"></span>
          <p class="textNewRolePermissions">
            {{
              t(`${module}.dialogPermissions.newRolePermissions.questionText`)
            }}
          </p>
        </div>
        <div class="containerInputButtonNewRolePermissions">
          <u-input
            v-model="nameNewRole"
            class="inputNewRolePermissions"
            size="s"
            :placeholder="
              t(`${module}.dialogPermissions.newRolePermissions.placeholder`)
            "
          />
          <div class="buttonsNewRolePermissions">
            <u-button
              :text="buttonSaveNewProfile.text"
              :icon="buttonSaveNewProfile.icon"
              :type="buttonSaveNewProfile.type"
              :size="buttonSaveNewProfile.size"
              :class="buttonSaveNewProfile.class"
              @click="buttonSaveNewProfile.action"
            />
          </div>
        </div>
      </div>
    </div>
  </div>

  <div class="dropdownPermissions">
    <div class="header" @click="openDropdown">
      <span
        :class="`u u-${openPermissions ? 'chevron-up' : 'chevron-down'}`"
      ></span>
      <h2 class="title">{{ t(`${module}.dropDownTables.title`) }}</h2>
    </div>

    <transition name="dropdown-transition">
      <div class="table-container" v-show="openPermissions">
        <TableBasic
          v-for="(itemTable, index) in itemTables"
          :key="index"
          :configTable="configListPermissions[itemTable]"
          :content="arraysTables[index]"
          class="tablePermission"
          :showSeparator="true"
          :lazyRender="true"
        >
          <template
            v-for="(radio, r) in index === 0 ? radioBoxesAll : radioBoxesSub"
            v-slot:[radio]="item"
            :key="r"
          >
            <u-radio
              class="margRadio"
              v-model="item.item[radio]"
              @click="toggleRadio(item.item, radio)"
              :disabled="permissionsRadioTables || item.item.buttonsDisabled"
            />
          </template>
        </TableBasic>
      </div>
    </transition>
  </div>
</template>

<style scoped>
.modal__content-permissions {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.headerPermissions {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.headerPermissions .searchContainer {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
}

.headerPermissions .searchContainer .searchProfile {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 10px;
}

.headerPermissions .searchContainer .titleProfilePermissions {
  font-size: 16px;
  font-weight: 600;
  line-height: 20px;
  letter-spacing: 0em;
  text-align: left;
  color: var(--neutral-text-body);
}

.headerPermissions .searchProfile .search {
  width: 420px;
}

.headerPermissions .btnSave {
  font-size: 16px;
}

/* Aviso modal elegir tipo de permiso usuario o todos */
.headerPermissions .containerTypePermissions {
  display: flex;
  flex-direction: row;
  width: 100%;
  height: 82px;
  padding: 10px;
  border: 1px solid var(--neutral-border-default);
  border-radius: 18px;
  justify-content: space-between;
  align-items: center;
}

.headerPermissions .containerTypePermissions .u {
  font-size: 24px;
  margin-bottom: 17px;
}

.headerPermissions .containerTypePermissions .infoTypePermissions {
  display: flex;
  flex-direction: row;
  width: 550px;
  align-items: center;
  gap: 10px;
}

.headerPermissions .containerTypePermissions .textTypePermissions {
  font-size: 14px;
  font-weight: 600;
  line-height: 18px;
  text-align: left;
  color: var(--neutral-text-body);
}

.headerPermissions .containerTypePermissions .buttonsTypePermissions {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 10px 0 10px 0;
}

.headerPermissions .containerTypePermissions .buttonsTypePermissions .btnEdit {
  width: 200px;
  border-radius: 10px;
}

/* Aviso modal escribir nuevo rol de permisos */
.headerPermissions .containerNewRolePermissions {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 82px;
  padding: 8px 10px 10px 10px;
  border: 1px solid var(--neutral-border-default);
  border-radius: 18px;
  gap: 4px;
  align-items: center;
}

.headerPermissions .containerNewRolePermissions .u {
  font-size: 24px;
}

.headerPermissions .containerNewRolePermissions .infoNewRolePermissions {
  display: flex;
  flex-direction: row;
  width: 100%;
  align-items: center;
  justify-content: left;
  gap: 10px;
}

.headerPermissions .containerNewRolePermissions .textNewRolePermissions {
  font-size: 14px;
  font-weight: 600;
  line-height: 18px;
  text-align: left;
  color: var(--neutral-text-body);
}

.headerPermissions
  .containerNewRolePermissions
  .containerInputButtonNewRolePermissions {
  display: flex;
  flex-direction: row;
  align-items: center;
  width: 100%;
  height: 36px;
  justify-content: space-between;
  gap: 10px;
}

.headerPermissions
  .containerNewRolePermissions
  .containerInputButtonNewRolePermissions
  .inputNewRolePermissions {
  margin-left: 25px;
  width: 561px;
}

.headerPermissions
  .containerNewRolePermissions
  .buttonsNewRolePermissions
  .btnSaveNewProfile {
  border-radius: 8px;
  font-size: 16px;
}

/* Dropdown permisos */
.dropdownPermissions {
  display: flex;
  flex-direction: column;
  position: relative;
  border-top-left-radius: 8px;
  border-top-right-radius: 8px;
  border-bottom-left-radius: 0px;
  border-bottom-right-radius: 0px;
  overflow: hidden;
  transition: all 0.3s ease-in-out;
  z-index: 0;
}

.dropdown-transition-enter-active,
.dropdown-transition-leave-active {
  transition: max-height 0.5s ease, transform 0.5s ease;
}

.dropdown-transition-enter-from,
.dropdown-transition-leave-to {
  max-height: 100%;
  transform: translateY(-100%);
}

.dropdown-transition-enter-to,
.dropdown-transition-leave-from {
  max-height: 100%;
  transform: translateY(0);
}

.dropdownPermissions .header {
  display: flex;
  height: 40px;
  padding: 15px 20px;
  border-top-left-radius: 8px;
  border-top-right-radius: 8px;
  border-bottom-left-radius: 0px;
  border-bottom-right-radius: 0px;
  border: 1px solid var(--neutral-border-light);
  background-color: var(--neutral-surface-light);
  cursor: pointer;
  z-index: 100;
  justify-content: left;
  align-items: center;
  gap: 10px;
  transition: all 0.3s ease-in-out;
}

.dropdownPermissions .header:hover {
  border: 1px solid var(--neutral-border-default);
}

.dropdownPermissions .title {
  color: var(--neutral-text-body);
  font-size: 14px;
  line-height: 18px;
  font-weight: 800;
}

.table-container {
  display: grid;
  grid-template-rows: 94px 320px;
  border: 1px solid var(--neutral-border-light);
  border-bottom-left-radius: 8px;
  border-bottom-right-radius: 8px;
  padding: 24px;
  height: v-bind(
    "showPermissionType || showPermissionNewRoleUser ? 'calc(780px - 413px)' : 'calc(780px - 315px)'"
  );
  overflow-y: auto;
}

.table-container::-webkit-scrollbar {
  width: 10px;
  height: 10px;
}

.table-container::-webkit-scrollbar-thumb {
  border-radius: 5px;
  background-color: var(--neutral-border-subtle);
}

.dropdownPermissions .margRadio {
  margin: 0 auto;
}
</style>
