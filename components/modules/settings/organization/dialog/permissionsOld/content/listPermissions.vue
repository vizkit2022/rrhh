<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useI18n } from "vue-i18n";
import usePermissionStore from '@/stores/permissions';
import useGlobalStore from '@/stores/global';
import useOrganizationStore from '@/stores/organization';
import useUserStore from '@/stores/user';
import configListPermissions from "@/utils/configTables/listPermissions.json";
import middlewarePermisssionActivation from "~/composables/usePermissionActivation";


// STORES
const permissionStore = usePermissionStore();
const globalStore = useGlobalStore();
const organizationStore = useOrganizationStore();
const userStore = useUserStore();

// I18N
const { t } = useI18n();
const module = "modules.organizations.settings.members.modal.listPermissions";

//EMITS
const emit = defineEmits(["closeModal", "updatedMembers"]);

// CONSTANTS
//manejo select permisos
const selected = ref({ label: "", value: "", _id: "" });
const optionsPermissions = ref([]);

// MANEJO DE RADIOS 
const userPermissionsCurrentIds = ref([]);

// MANEJO COPIA LOCAL 

// Copia local de permisos para edición
const localUserPermissionIds = ref([]);
// Flag para saber si hay cambios pendientes
const hasUnsavedChanges = ref(false);

// ESTADOS DROPDOWN
const openStates = ref({});

// ESTADOS PARA CONTROL DE ROLES Y PERMISOS
const isUserOwner = ref(false);
const isUserAdmin = ref(false);
const isCurrentSuperUser = ref(false);
const currentUserCanEditThisUser = ref(false);

// LÓGICA DE BOTONES 
const editSave = ref(false);
const isChangeProfile = ref(false);
const disabledEditSearch = ref(false);
const disabledSaveButton = ref(false);
const permissionsRadioTables = ref(true);
const tableModified = ref(false);

// ESTADOS PARA MODALES
const showPermissionType = ref(false);
const showPermissionNewRoleUser = ref(false);
const nameNewRole = ref("");

// FUNCIONES DE IDENTIFICACIÓN Y AUTORIZACIÓN

/** 
 * Actualiza los permisos del middleware composable usePermissionActivation
 */
async function updateMiddlewarePermissions() {
      //edit my projects
    await middlewarePermisssionActivation("u_header", {}, false);
      //edit settings
    await middlewarePermisssionActivation("settingsOrganizationConfig", {}, false);
    await middlewarePermisssionActivation("settingsBusinessAreas", {}, false);
    await middlewarePermisssionActivation("settingsValidations", {}, false);
}


/**
 * Identifica el tipo de usuario actual y sus permisos
 */
function handleCurrentUserRoles() {
  // Verificar si es owner de la organización
  isUserOwner.value = 
    organizationStore.organization?.owner?._id === userStore.userSession?._id;
  
  // Verificar si es admin por perfil de permisos
  isUserAdmin.value = 
    permissionStore.profilePermissionsUserSession?.code === "admin";
  
  // SuperUser es owner O admin
  isCurrentSuperUser.value = isUserOwner.value || isUserAdmin.value;
  
}

/**
 * Verifica si el usuario actual puede editar al usuario seleccionado
 */
function checkEditPermissionsForSelectedUser() {
  const selectedUser = permissionStore.propsListPermissions?.memberSelected?.user;
  
  // No hay usuario seleccionado
  if (!selectedUser) {
    currentUserCanEditThisUser.value = false;
    return;
  }

  // El owner puede editar a todos
  if (isUserOwner.value) {
    currentUserCanEditThisUser.value = true;
    return;
  }

  // Los admins pueden editar a cualquier usuario, excepto al owner
  if (isUserAdmin.value) {
    const selectedUserIsOwner = 
      organizationStore.organization?.owner?._id === selectedUser._id;
    
    // bloqueo si es admin intenta editar al owner
    currentUserCanEditThisUser.value = !selectedUserIsOwner;
    return;
  }
}

/**
 * Verifica permisos antes de ejecutar acciones críticas
 */
function validatePermissionAction(action) {
  if (!isCurrentSuperUser.value) {
    console.log(`Acción "${action}" denegada: Se requieren permisos de administrador`);
    return false;
  }

  if (!currentUserCanEditThisUser.value) {
    console.log(`Acción "${action}" denegada: No puedes editar este usuario`);
    return false;
  }

  return true;
}

// FUNCIONES DE JERARQUÍA DE PERMISOS

/**
 * Función para obtener la estructura de dependencias de permisos
 */
function getPermissionDependencies() {
  return {
    'create_projects': ['create_budgets', 'create_business'],
    'edit_projects': ['edit_project_name', 'edit_project_client'],
    'configs': ['config_validations', 'configure_business_area']
  };
}

/**
 * Función para encontrar un permiso por su código en toda la estructura
 */
function findPermissionByCode(permissions, code) {
  for (const area of permissions) {
    for (const group of area.groups) {
      if (group.subcategories) {
        for (const subcategory of group.subcategories) {
          if (subcategory.permissions) {
            const permission = subcategory.permissions.find(p => p.code === code);
            if (permission) return permission;
          }
        }
      }
    }
  }
  return null;
}

/**
 * Función para obtener los IDs de permisos hijos basados en el código del padre
 */
function getChildPermissionIds(parentCode, permissions) {
  const dependencies = getPermissionDependencies();
  const childCodes = dependencies[parentCode] || [];
  const childIds = [];
  
  for (const childCode of childCodes) {
    const childPermission = findPermissionByCode(permissions, childCode);
    if (childPermission) {
      childIds.push(childPermission._id);
    }
  }
  
  return childIds;
}

/**
 * Función para obtener el código de un permiso por su ID
 */function getPermissionCodeById(permissionId, permissions) {
  for (const area of permissions) {
    for (const group of area.groups) {
      if (group.subcategories) {
        for (const subcategory of group.subcategories) {
          if (subcategory.permissions) {
            const permission = subcategory.permissions.find(p => p._id === permissionId);
            if (permission) return permission.code;
          }
        }
      }
    }
  }
  return null;
}

/**
 * funcion auxiliar para verificar si un permiso es padre de otros
 */
function isParentPermission(permissionCode) {
  const dependencies = getPermissionDependencies();
  return dependencies.hasOwnProperty(permissionCode);
}

/**
 * funcion auxiliar para verificar si un permiso es hijo de otro
 */
function isChildPermission(permissionCode) {
  const dependencies = getPermissionDependencies();
  
  for (const [parent, children] of Object.entries(dependencies)) {
    if (children.includes(permissionCode)) {
      return parent;
    }
  }
  return null;
}

/**
 * funcion para verificar si un permiso hijo debe estar deshabilitado
 * basado en el estado de su permiso padre
 */
function isChildPermissionDisabled(permissionCode) {
  const parentCode = isChildPermission(permissionCode);
  
  if (!parentCode) {
    return false; // No es un permiso hijo, no se deshabilita
  }
  
  // Buscar el permiso padre por su código
  const parentPermission = findPermissionByCode(permissionStore.permissions, parentCode);
  
  if (!parentPermission) {
    return false; // No se encontró el permiso padre
  }
  
  // El hijo está deshabilitado si el padre no está activo
  const permissionsToCheck = editSave.value ? localUserPermissionIds.value : userPermissionsCurrentIds.value;
  const isParentActive = permissionsToCheck.includes(parentPermission._id);
  
  return !isParentActive;
}

/**
 * funcion para verificar si un radio button debe estar deshabilitado
 */
function isRadioDisabled(item) {
  const baseDisabled = permissionsRadioTables.value || !currentUserCanEditThisUser.value;
  
  if (!item.code) return baseDisabled;
  
  // Si es un permiso hijo, verificar si debe estar deshabilitado por su padre
  const isChildDisabled = isChildPermissionDisabled(item.code);
  
  return baseDisabled || isChildDisabled;
}

// FUNCIONES DE CONTROL

// Control del dropdown
function toggleDropdown(areaIndex) {
  if (openStates.value[areaIndex] === undefined) {
    openStates.value[areaIndex] = false;
  }
  openStates.value[areaIndex] = !openStates.value[areaIndex];
}

// verificar si un índice específico está abierto
function isDropdownOpen(areaIndex) {
  return openStates.value[areaIndex] !== false;
}

// explicitamente abrir todos los dropdowns
function initializeDropdownsExplicitly() {
  permissionStore.permissions?.forEach((_, index) => {
    openStates.value[index] = true;
  });
}
// para crear copia local de permisos
function createLocalPermissionsCopy() {
  localUserPermissionIds.value = [...userPermissionsCurrentIds.value];
  hasUnsavedChanges.value = false;
}

// para detectar cambios en permisos locales
function checkForChanges() {
  const originalSet = new Set(userPermissionsCurrentIds.value);
  const localSet = new Set(localUserPermissionIds.value);
  
  // Verificar si los conjuntos son diferentes
  if (originalSet.size !== localSet.size) {
    hasUnsavedChanges.value = true;
    return;
  }
  
  for (let item of originalSet) {
    if (!localSet.has(item)) {
      hasUnsavedChanges.value = true;
      return;
    }
  }
  
  hasUnsavedChanges.value = false;
}

// alternar permiso en la copia local con lógica jerárquica
function toggleLocalPermission(permissionId) {
  if (!editSave.value) return;

  // Verificar permisos antes de permitir cambios
  if (!validatePermissionAction("toggle permission")) return;

  const index = localUserPermissionIds.value.indexOf(permissionId);
  const permissionCode = getPermissionCodeById(permissionId, permissionStore.permissions);

  if (index > -1) {
    // DESACTIVAR PERMISO JERÁRQUICO
    localUserPermissionIds.value.splice(index, 1);

    // Si es un permiso padre, desactivar todos sus hijos
    if (permissionCode && isParentPermission(permissionCode)) {
      const childIds = getChildPermissionIds(permissionCode, permissionStore.permissions);
      childIds.forEach(childId => {
        const childIndex = localUserPermissionIds.value.indexOf(childId);
        if (childIndex > -1) {
          localUserPermissionIds.value.splice(childIndex, 1);
        }
      });
    }

    //  Si es un hijo de 'create_projects' y ambos hijos están desactivados, desactivar el padre
    const parentCode = isChildPermission(permissionCode);
    if (parentCode === 'create_projects') {
      const childIds = getChildPermissionIds(parentCode, permissionStore.permissions);
      const allChildrenDisabled = childIds.every(childId => !localUserPermissionIds.value.includes(childId));
      if (allChildrenDisabled) {
        const parentPermission = findPermissionByCode(permissionStore.permissions, parentCode);
        if (parentPermission) {
          const parentIndex = localUserPermissionIds.value.indexOf(parentPermission._id);
          if (parentIndex > -1) {
            localUserPermissionIds.value.splice(parentIndex, 1);
          }
        }
      }
    }

  } else {
    // ACTIVAR PERMISO JERÁRQUICO
    localUserPermissionIds.value.push(permissionId);

    // Si es un permiso padre, activar automáticamente todos sus hijos
    if (permissionCode && isParentPermission(permissionCode)) {
      const childIds = getChildPermissionIds(permissionCode, permissionStore.permissions);
      childIds.forEach(childId => {
        if (!localUserPermissionIds.value.includes(childId)) {
          localUserPermissionIds.value.push(childId);
        }
      });
    }
  }

  checkForChanges();
}


// parea descartar cambios locales
function discardLocalChanges() {
  localUserPermissionIds.value = [...userPermissionsCurrentIds.value];
  hasUnsavedChanges.value = false;
}

// resetear UI al salir de modo edición
const resetUIState = () => {
  disabledEditSearch.value = false;
  disabledSaveButton.value = false;
  showPermissionType.value = false;
  showPermissionNewRoleUser.value = false;
  editSave.value = false;
  permissionsRadioTables.value = true;
  tableModified.value = false;
};

// manejo de botones

const handleEditPermissions = () => {
  if (!validatePermissionAction("edit permissions")) return;

  editSave.value = !editSave.value;
  permissionsRadioTables.value = !permissionsRadioTables.value;
  
  // Crear copia local al entrar en modo edición
  if (editSave.value) {
    createLocalPermissionsCopy();
  }
  
};

const handleSavePermissions = () => {
  if (!validatePermissionAction("save permissions")) return;

  // Mostrar modal de tipo de permisos
  showPermissionType.value = true;
  disabledSaveButton.value = true;
};

// FUNCIONES PARA MANEJO DE MODALES CON VALIDACIÓN
const handleSaveAllMembersPermissions = async () => {
  if (!validatePermissionAction("save all members permissions")) return;

  try {
    globalStore.loading = true;
    
    const body = { 
      userId: permissionStore.propsListPermissions.memberSelected.user._id, 
      permissionIds: localUserPermissionIds.value 
    };
    
    // Actualizar el perfil para todos los miembros con estos permisos
    const selectedProfileId = selected.value._id;
    const bodyUpdatePermissions = {
      permissions: localUserPermissionIds.value,
    };

    // Actualizar permisos del perfil
    await permissionStore.updatePermissions(selectedProfileId, bodyUpdatePermissions);
    
    // Actualizar asignación del usuario
    const bodyUserProfile = { 
      userId: body.userId, 
      permissionId: selectedProfileId 
    };
    await permissionStore.updateProfilePermissions(bodyUserProfile);
    
    // Recargar datos
    await permissionStore.getProfileByUserId(body.userId);
    await permissionStore.getProfilePermissions();
    await permissionStore.getProfilePermissionsByUserSession(
        userStore.userSession._id
    );
    
    // Actualizar middleware 
    await updateMiddlewarePermissions();
    
    // Actualizar permisos originales después de guardar exitosamente
    userPermissionsCurrentIds.value = [...localUserPermissionIds.value];
    hasUnsavedChanges.value = false;
    
    resetUIState();
    emit("updatedMembers");
    
  } catch (error) {
    console.error('Error al guardar permisos:', error);
  } finally {
    globalStore.loading = false;
  }
};

const handleEditNewProfilePermission = () => {
  if (!validatePermissionAction("create permission profile")) return;

  showPermissionType.value = false;
  showPermissionNewRoleUser.value = true;
};

const handleSaveNewProfile = async () => {
  if (!validatePermissionAction("save new profile")) return;

  if (!nameNewRole.value) {
    console.log("No se ha ingresado un nombre para el nuevo perfil de permisos");
    return;
  }

  try {
    globalStore.loading = true;
    
    const newPermissionsProfile = {
      code: nameNewRole.value.toLowerCase().replace(/\s+/g, ""),
      name: {
        es: nameNewRole.value,
        en: nameNewRole.value,
      },
      description: `Perfil de ${nameNewRole.value}`,
      isActive: true,
      permissions: localUserPermissionIds.value,
      users: permissionStore.propsListPermissions.memberSelected.user._id,
    };

    await permissionStore.createProfilePermissions(newPermissionsProfile);
    
    // Recargar perfiles
    await permissionStore.getProfilePermissions();
    
    // Obtener el nuevo perfil creado
    const newProfile = permissionStore.profilePermissions.docs.find(
      profile => profile.code === newPermissionsProfile.code
    );
    
    if (newProfile) {
      // Asignar el nuevo perfil al usuario
      const bodyUserProfile = { 
        userId: permissionStore.propsListPermissions.memberSelected.user._id, 
        permissionId: newProfile._id 
      };
      await permissionStore.updateProfilePermissions(bodyUserProfile);
      await permissionStore.getProfileByUserId(bodyUserProfile.userId);
    }

    // Actualizar datos locales
    userPermissionsCurrentIds.value = [...localUserPermissionIds.value];
    hasUnsavedChanges.value = false;
    
    // Actualizar middleware 
    await updateMiddlewarePermissions();
    
    
    resetUIState();
    nameNewRole.value = "";
    emit("updatedMembers");
    
  } catch (error) {
    console.error("Error al crear el nuevo perfil de permisos:", error);
  } finally {
    globalStore.loading = false;
  }
};

const handleChangeProfile = async () => {
  if (!validatePermissionAction("change profile")) return;

  try {
    globalStore.loading = true;
    
    // Lógica para cambiar el perfil
    const body = { 
      userId: permissionStore.propsListPermissions.memberSelected.user._id, 
      permissionId: selected.value._id 
    };
    await permissionStore.updateProfilePermissions(body);
    
    // Actualizar permisos después del cambio de perfil
    await permissionStore.getProfileByUserId(permissionStore.propsListPermissions.memberSelected.user._id);
    
    userPermissionsCurrentIds.value = permissionStore.profileByUserID?.permissions?.map(p => p._id) || [];

    // get perfil user sesion 
    await permissionStore.getProfilePermissionsByUserSession(
      userStore.userSession?._id
    );

    // Actualizar middleware si es necesario
    await updateMiddlewarePermissions();

    // cambiar permitir el cambio
    currentUserCanEditThisUser.value = validatePermissionAction("change profile");    

    createLocalPermissionsCopy();
    isChangeProfile.value = false;
    emit("updatedMembers");

  } catch (error) {
    console.log('Algo falló en handleChangeProfile:', error);
  } finally {
    globalStore.loading = false;
  }
};

// CONFIGURACIÓN DE BOTONES DINÁMICOS CON VALIDACIÓN MEJORADA
const editSaveButtonArray = computed(() => [
  {
    text: t(`${module}.buttons.editPermissions.text`) || "Editar Permisos",
    icon: "edit",
    disabled: disabledEditSearch.value || !currentUserCanEditThisUser.value,
    action: handleEditPermissions,
  },
  {
    text: t(`${module}.buttons.saveProfile.text`) || "Guardar Permisos", 
    icon: "save",
    disabled: disabledSaveButton.value || !hasUnsavedChanges.value || !currentUserCanEditThisUser.value,
    action: handleSavePermissions,
  },
]);

// Botón actual basado en el estado
const currentButton = computed(() => {
  return editSave.value
    ? editSaveButtonArray.value[1] // Botón "Guardar"
    : editSaveButtonArray.value[0]; // Botón "Editar"
});

// BOTONES PARA MODALES
const buttonsAvisoTypePermissions = [
  {
    text: t(`${module}.dialogPermissions.typePermissions.buttonAllMembers`) || "Aplicar a todos los miembros",
    type: "outlined",
    size: "xs",
    class: "btnEdit",
    color: "--neutral-text-caption",
    action: () => handleSaveAllMembersPermissions(),
  },
  {
    text: t(`${module}.dialogPermissions.typePermissions.buttonThisUser`) || "Solo este usuario",
    type: "outlined", 
    size: "xs",
    class: "btnEdit",
    color: "--neutral-text-caption",
    action: () => handleEditNewProfilePermission(),
  },
];

const buttonSaveNewProfile = {
  text: t(`${module}.dialogPermissions.newRolePermissions.buttonSaveNewProfile`) || "Guardar nuevo perfil",
  icon: "save",
  type: "outlined",
  size: "xs", 
  class: "btnSaveNewProfile",
  action: () => handleSaveNewProfile(),
};

// COMPUTADAS

// Función para organizar permisos por grupos
function organizePermissionsByGroup(permission) {
  const accessPermissions = []; 
  const enableDisablePermissions = []; 
  
  if (permission.area_code === 'My_Projects') {
    permission.groups.forEach(group => {
      if (group.group_info.group_number === 1) {
        if (group.subcategories) {
          group.subcategories.forEach(method => {
            if (method.permissions) {
              accessPermissions.push(...method.permissions);
            }
          });
        }
      } else if (group.group_info.group_number === 2 || group.group_info.group_number === undefined) {
        if (group.subcategories) {
          group.subcategories.forEach(method => {
            if (method.permissions) {
              enableDisablePermissions.push(...method.permissions);
            }
          });
        }
      }
    });
  } else if (permission.area_code === 'Settings') {
    permission.groups.forEach(group => {

      if (group.group_info.group_number || group.group_info.group_number === null) {
        if (group.subcategories) {
          group.subcategories.forEach(method => {
            if (method.permissions) {
                enableDisablePermissions.push(...method.permissions);
            }
          })
        }
      } 
    })
  } else if (permission.area_code === 'Cotizaciones_y_negocios') {
    permission.groups.forEach(group => {
      if (group.group_info.group_number) {
        if (group.subcategories) {
          group.subcategories.forEach(method => {
            if (method.permissions) {
              enableDisablePermissions.push(...method.permissions);
            }
          });
        }
      }
    })
  }

  return {
    accessPermissions,
    enableDisablePermissions
  };
}

// Función para inicializar los permisos del usuario en el selected
function initializePermissionsProfilesOptionsSearch() {
  if (permissionStore.profileByUserID) {
    selected.value.label = permissionStore.profileByUserID.name[globalStore.lang];
    selected.value.value = permissionStore.profileByUserID.code;
    selected.value._id = permissionStore.profileByUserID._id;
  } else {
    // Usuario es owner (sin perfil de permisos)
    selected.value.label = "Dueño de la organización";
    selected.value.value = "owner";
    selected.value._id = null;
  }

  optionsPermissions.value = permissionStore.profilePermissions.docs.map((item) => {
    return {
        label: item.name[globalStore.lang],
        value: item.code,
        _id: item._id
    }
  });

  userPermissionsCurrentIds.value = permissionStore.profileByUserID?.permissions?.map(p => p._id) || [];
  
  createLocalPermissionsCopy();
}

function handleSelectedOptionRole(option) {
    selected.value.label = option.label;
    selected.value.value = option.value;
    selected.value._id = option._id;

    const selectedProfile = permissionStore.profilePermissions.docs.find(
      profilePermission => profilePermission.code === option.value
    );
    
    userPermissionsCurrentIds.value = selectedProfile?.permissions || [];
    const originalPerfilPermiso = permissionStore.profileByUserID?.name[globalStore.lang] || "Dueño de la organización";
    
    createLocalPermissionsCopy();

    if(selected.value.label === originalPerfilPermiso) {
      isChangeProfile.value = false;
    } else {
      isChangeProfile.value = true; 
      resetUIState();
    }
}

// función para manejar permisos activos usando la copia local en modo edición
function isPermissionActive(item) {
  if (!item._id) return false;
  
  const permissionsToCheck = editSave.value ? localUserPermissionIds.value : userPermissionsCurrentIds.value;

  return permissionsToCheck.includes(item._id);
}

// Función para manejar clicks en radio buttons
function handlePermissionToggle(item) {
  if (!editSave.value || !item._id) return;
  toggleLocalPermission(item._id);
}

// WATCHERS PARA DETECTAR CAMBIOS EN ROLES
watch(
  () => [userStore.userSession, organizationStore.organization, permissionStore.profilePermissionsUserSession],
  () => {
    handleCurrentUserRoles();
    checkEditPermissionsForSelectedUser();
  },
  { deep: true }
);

watch(
  () => permissionStore.profileByUserID,
  () => {
    checkEditPermissionsForSelectedUser();
  },
  { deep: true }
);

onMounted(async () => {
  try{
    globalStore.loading = true;
    
    // Fetch endpoints de permisos
    await permissionStore.getPermissions();
    await permissionStore.getProfileByUserId(
      permissionStore.propsListPermissions.memberSelected.user._id
    );
    await permissionStore.getProfilePermissions();
    
    // Obtener permisos del usuario de sesión actual
    console.log('user session', userStore.userSession);
     await permissionStore.getProfilePermissionsByUserSession(
       userStore.userSession?._id
     );
    
    // Inicializar roles y permisos
    handleCurrentUserRoles();
    checkEditPermissionsForSelectedUser();
    initializePermissionsProfilesOptionsSearch();
    initializeDropdownsExplicitly();

  } catch (error) {
    console.log('Algo falló en onMounted:', error);
  } finally {
    globalStore.loading = false;
  }
});
</script>

<template>
  <div class="container__list-permissions">
    <!-- HEADER -->
    <div class="header__list-permissions">
      <div class="change_header_permissions">
        <span>{{ t(`${module}.permissionProfile`) || 'Perfil de permisos:' }}</span>
        <u-select
          :model-value="selected.label"
          style="width: 420px"
          :options="optionsPermissions"
          :full-data="true"
          @full-data="handleSelectedOptionRole"
          size="m"
          :disabled="!currentUserCanEditThisUser"
          :placeholder="t(`${module}.profileFinderPlaceholder`) || 'Buscar perfil...'"
        />
      </div>
      
      <div class="action_header_permissions">
        <!-- Mostrar información de permisos para debugging -->
        <!-- <div class="permissions-debug" v-if="false" style="font-size: 12px; margin-right: 10px;">
          <div>Owner: {{ isUserOwner ? 'Sí' : 'No' }}</div>
          <div>Admin: {{ isUserAdmin ? 'Sí' : 'No' }}</div>
          <div>Puede editar: {{ currentUserCanEditThisUser ? 'Sí' : 'No' }}</div>
        </div> -->

        <u-button
          v-if="isChangeProfile"
          text="Asignar Perfil"
          icon="u u-check"
          type="outlined"
          size="xs"
          class="btnSave"
          :disabled="!currentUserCanEditThisUser"
          @click="handleChangeProfile"
        />
        <u-button
          v-else
          :text="currentButton?.text"
          :icon="currentButton?.icon"
          type="outlined"
          size="xs"
          class="btnSave"
          :disabled="currentButton?.disabled"
          @click="currentButton?.action"
        />
      </div>
    </div>

    <!-- MODALES -->
    <!-- Modal de selección de tipo de permisos -->
    <div class="containerTypePermissions" v-if="showPermissionType">
      <div class="infoTypePermissions">
        <span class="u u-info-outlined"></span>
        <p class="textTypePermissions">
          {{ t(`${module}.dialogPermissions.typePermissions.questionText`) || '¿Cómo deseas aplicar estos cambios de permisos?' }}
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
          {{ t(`${module}.dialogPermissions.newRolePermissions.questionText`) || 'Ingresa el nombre del nuevo perfil de permisos:' }}
        </p>
      </div>
      <div class="containerInputButtonNewRolePermissions">
        <u-input
          v-model="nameNewRole"
          class="inputNewRolePermissions"
          size="s"
          :placeholder="t(`${module}.dialogPermissions.newRolePermissions.placeholder`) || 'Nombre del nuevo perfil'"
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

    <!-- BODY -->
    <div class="body__list-permissions">
      <div
        class="item_wrapper"
        v-for="(permission, areaIndex) in permissionStore.permissions"
        :key="areaIndex"
      >
        <div
          class="item_container_table"
          @click="toggleDropdown(areaIndex)"
        >
          <span 
            class="u u-chevron-down arrow"
            :class="{ 'rotated': isDropdownOpen(areaIndex) }"
          ></span>
          <span class="title">
            {{ permission.area_name[globalStore.lang] }}
          </span>
        </div>

        <!-- DROPDOWN CONTENT -->
        <div
          class="dropdown_content"
          :class="{ 'is-open': isDropdownOpen(areaIndex) }"
        >

        <div class="content-inner">
            <template v-if="organizePermissionsByGroup(permission).accessPermissions.length > 0">
            <TableBasic
                :configTable="configListPermissions.allCreateAssigned"
                :content="organizePermissionsByGroup(permission).accessPermissions"  
                :lazyRender="true"
            >
                <template v-slot:name="item">
                <span class="textItemsTable">{{ item.item.name[globalStore.lang] }}</span>
                </template>

                <template v-slot:allCreated="item">
                <u-radio 
                  class="margRadio" 
                  :model-value="isPermissionActive(item.item)" 
                  :disabled="isRadioDisabled(item.item)"
                  @click="handlePermissionToggle(item.item)"
                />
                </template>

                <template v-slot:onlyAssigned="item">
                <u-radio 
                  class="margRadio" 
                  :model-value="!isPermissionActive(item.item)" 
                  :disabled="isRadioDisabled(item.item)"
                  @click="handlePermissionToggle(item.item)"
                />
                </template>

            </TableBasic>
            </template>

            <template v-if="organizePermissionsByGroup(permission).enableDisablePermissions.length > 0">
            <TableBasic
                :configTable="configListPermissions.enableDisable"
                :content="organizePermissionsByGroup(permission).enableDisablePermissions" 
                :showSeparator="true" 
                :lazyRender="true"
            >
                <template v-slot:name="item">
                <span class="textItemsTable">{{ item.item.name[globalStore.lang] }}</span>
                </template>

               <template v-slot:enabled="item">
                <u-radio 
                  class="margRadio" 
                  :model-value="isPermissionActive(item.item)" 
                  :disabled="isRadioDisabled(item.item)"
                  @click="handlePermissionToggle(item.item)"
                />
                </template>

                <template v-slot:disabled="item">
                <u-radio 
                  class="margRadio" 
                  :model-value="!isPermissionActive(item.item)" 
                  :disabled="isRadioDisabled(item.item)"
                  @click="handlePermissionToggle(item.item)"
                />
                </template>

            </TableBasic>
            </template>
        </div>


        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.container__list-permissions {
  display: grid;
  grid-template-rows: auto auto 1fr;
  gap: 16px;
  width: 100%;
  height: 90%;
}

.header__list-permissions {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
}

.change_header_permissions {
  display: flex;
  gap: 20px;
  align-items: center;
}

.change_header_permissions span {
  font-size: 16px;
  font-weight: 600;
  line-height: 20px;
  color: var(--neutral-text-body);
}

.action_header_permissions {
  display: flex;
  gap: 8px;
  align-items: center;
}

.action_header_permissions .btnSave,
.action_header_permissions .btnCancel {
  font-size: 14px;
}

/* ESTILOS PARA MODALES */
/* Modal elegir tipo de permiso usuario o todos */
.containerTypePermissions {
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

.containerTypePermissions .u {
  font-size: 24px;
  margin-bottom: 17px;
}

.infoTypePermissions {
  display: flex;
  flex-direction: row;
  width: 550px;
  align-items: center;
  gap: 10px;
}

.textTypePermissions {
  font-size: 14px;
  font-weight: 600;
  line-height: 18px;
  text-align: left;
  color: var(--neutral-text-body);
}

.buttonsTypePermissions {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 10px 0 10px 0;
}

.buttonsTypePermissions .btnEdit {
  width: 200px;
  border-radius: 10px;
}

.containerNewRolePermissions {
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

.containerNewRolePermissions .u {
  font-size: 24px;
}

.infoNewRolePermissions {
  display: flex;
  flex-direction: row;
  width: 100%;
  align-items: center;
  justify-content: left;
  gap: 10px;
}

.textNewRolePermissions {
  font-size: 14px;
  font-weight: 600;
  line-height: 18px;
  text-align: left;
  color: var(--neutral-text-body);
}

.containerInputButtonNewRolePermissions {
  display: flex;
  flex-direction: row;
  align-items: center;
  width: 100%;
  height: 36px;
  justify-content: space-between;
  gap: 10px;
}

.inputNewRolePermissions {
  margin-left: 25px;
  width: 561px;
}

.btnSaveNewProfile {
  border-radius: 8px;
  font-size: 16px;
}

/* Estilos para indicador de cambios */
.changes-indicator {
  display: flex;
  align-items: center;
  padding: 4px 8px;
  background-color: var(--warning-background-subtle);
  border-radius: 4px;
  border: 1px solid var(--warning-border-subtle);
}

.changes-text {
  color: var(--warning-text-default);
  font-size: 12px;
  font-weight: 500;
}

.body__list-permissions {
  display: flex;
  flex-direction: column;
  height: 100%;
  max-height: 100%;
  gap: 20px;
  flex: 1;
  overflow-y: auto;
}

.body__list-permissions::-webkit-scrollbar {
  width: 10px;
  height: 10px;
}

.body__list-permissions::-webkit-scrollbar-thumb {
  border-radius: 5px;
  background-color: var(--neutral-border-subtle);
}

.item_wrapper {
  display: flex;
  flex-direction: column;
}

.item_container_table {
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
  justify-content: left;
  align-items: center;
  gap: 10px;
  transition: background-color 0.2s ease;
}

.item_container_table:hover {
  border: 1px solid var(--neutral-border-default);
  background-color: var(--neutral-background-hover, rgba(0, 0, 0, 0.02));
}

.title {
  color: var(--neutral-text-body);
  font-size: 14px;
  line-height: 18px;
  font-weight: 800;
}

.table-title {
  color: var(--neutral-text-body);
  font-size: 12px;
  font-weight: 600;
  margin-bottom: 8px;
  padding-left: 4px;
}

.other-permissions {
  padding: 16px;
  color: var(--neutral-text-subtle);
  font-size: 14px;
}

/* Flecha con rotación */
.arrow {
  transition: transform 0.3s ease;
}

.arrow.rotated {
  transform: rotate(180deg);
}

/* Dropdown content con animación */
.dropdown_content {
  width: 100%;
  height: auto;
  border: 1px solid var(--neutral-border-light);
  border-top: none;
  border-radius: 0 0 8px 8px;
  opacity: 0;
  max-height: 0;
  overflow: hidden;
  background-color: transparent;
  transition: opacity 0.3s ease, max-height 0.3s ease;
}

.dropdown_content.is-open {
  opacity: 1;
  max-height: 600px;
}

.content-inner {
  display: flex;
  flex-direction: column;
  padding: 12px 20px;
  gap: 24px;
}

/* TABLE */

.margRadio {
  margin: 0 auto;
}


</style>
