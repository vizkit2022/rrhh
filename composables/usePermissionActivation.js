import { ref } from "vue";
import useOrganizationStore from "@/stores/organization";
import usePermissionStore from "@/stores/permissions";
import useGlobalStore from "@/stores/global";
import useUserStore from "@/stores/user";

const funtionsPermissionsActivation = {
  // las claves son los nombres de las vistas a activar permisos dentro del parametro de la funcion middlewarePermisssionActivation

  // PERMISSIONS MY PROJECTS

  incomes: async ({
    permissionStore,
    organizationStore,
    globalStore,
    userStore,
    SavetoUserPermissions = true,
  }) => {
    if (SavetoUserPermissions) {
      await permissionStore.getProfilePermissionsByUserSession(
        userStore.userSession._id
      );
    }

    const isOwner = ref(
      organizationStore.organization?.owner?._id === userStore.userSession?._id
    );

    if (isOwner.value) {
      for (const key in permissionStore.permissionsActivated) {
        permissionStore.permissionsActivated[key] = false;
      }
    } else {
      permissionStore.permissionsActivated.isCreateProjects =
        permissionStore.profilePermissionsUserSession?.permissions?.every(
          (permission) => permission.code !== "create_projects"
        );

      permissionStore.permissionsActivated.isArchivedProjects =
        permissionStore.profilePermissionsUserSession?.permissions?.every(
          (permission) => permission.code !== "delete_projects"
        );

      permissionStore.permissionsActivated.isViewMetrics =
        permissionStore.profilePermissionsUserSession?.permissions?.every(
          (permission) => permission.code !== "view_metrics"
        );
    }
  },

  createProjectMovement: async ({
    organizationStore,
    permissionStore,
    userStore,
    inputs,
    form,
    SavetoUserPermissions = true,
  }) => {
    // Obtener permisos del usuario actual
    if (SavetoUserPermissions) {
      await permissionStore.getProfilePermissionsByUserSession(
        userStore.userSession._id
      );
    }

    const isOwner = ref(
      organizationStore.organization?.owner?._id === userStore.userSession?._id
    );

    if (isOwner.value) {
      // Si es el dueño de la organización, habilitar todas las opciones
      inputs.state.options.forEach((op) => {
        op.disabled = false;
      });

      // Establecer valor por defecto
      form.value.state = "budget";
      return;
    }

    // Obtener los permisos del usuario
    const permissions =
      permissionStore.profilePermissionsUserSession?.permissions || [];

    // Mapeo de permisos por tipo
    const permissionMapping = {
      budget: "create_budgets",
      business: "create_business",
    };

    const isCreateBudgetsBlocked = permissions.every(
      (p) => p.code !== permissionMapping.budget
    );

    const isCreateBusinessBlocked = permissions.every(
      (p) => p.code !== permissionMapping.business
    );

    // permissionStore.permissionsActivated.isCreateBudgets =
    //   isCreateBudgetsBlocked;
    // permissionStore.permissionsActivated.isCreateBusiness =
    //   isCreateBusinessBlocked;

    const hasBudgetPermission = !isCreateBudgetsBlocked;
    const hasBusinessPermission = !isCreateBusinessBlocked;

    // Lógica para habilitar/deshabilitar opciones del input
    inputs.state.options.forEach((op) => {
      if (op.value === "budget") {
        op.disabled = !hasBudgetPermission;
      } else if (op.value === "business") {
        op.disabled = !hasBusinessPermission;
      } else {
        op.disabled = false;
      }
    });

    // Establecer valor por defecto
    if (hasBudgetPermission && hasBusinessPermission) {
      form.value.state = "budget";
    } else if (hasBudgetPermission) {
      form.value.state = "budget";
    } else if (hasBusinessPermission) {
      form.value.state = "business";
    } else {
      form.value.state = "budget";
    }
  },

  create_budgets_business: async ({
    organizationStore,
    permissionStore,
    userStore,
    SavetoUserPermissions = true,
  }) => {
    if (SavetoUserPermissions) {
      await permissionStore.getProfilePermissionsByUserSession(
        userStore.userSession._id
      );
    }

    const isOwner = ref(
      organizationStore.organization?.owner?._id === userStore.userSession?._id
    );

    if (isOwner.value) {
      for (const key in permissionStore.permissionsActivated) {
        permissionStore.permissionsActivated[key] = false;
      }
    } else {
      permissionStore.permissionsActivated.isCreateBudgets =
        permissionStore.profilePermissionsUserSession?.permissions?.every(
          (permission) => permission.code !== "create_budgets"
        );

      permissionStore.permissionsActivated.isCreateBusiness =
        permissionStore.profilePermissionsUserSession?.permissions?.every(
          (permission) => permission.code !== "create_business"
        );
    }
  },

  u_header: async ({ 
    organizationStore, 
    permissionStore, 
    userStore,
    SavetoUserPermissions = true,
  }) => {
    if (SavetoUserPermissions) {
      await permissionStore.getProfilePermissionsByUserSession(
        userStore.userSession._id
      );
    }

    const isOwner = ref(
      organizationStore.organization?.owner?._id === userStore.userSession?._id
    );

    if (isOwner.value) {
      for (const key in permissionStore.permissionsActivated) {
        permissionStore.permissionsActivated[key] = false;
      }
    } else {
      permissionStore.permissionsActivated.isEditProjects =
        permissionStore.profilePermissionsUserSession?.permissions?.every(
          (permission) => permission.code !== "edit_projects"
        );
    }
  },

  updatedProject: async ({ 
    organizationStore, 
    permissionStore, 
    userStore,
    SavetoUserPermissions = true,
  }) => {
    if (SavetoUserPermissions) {
      await permissionStore.getProfilePermissionsByUserSession(
        userStore.userSession._id
      );
    }

    const isOwner = ref(
      organizationStore.organization?.owner?._id === userStore.userSession?._id
    );

    if (isOwner.value) {
      for (const key in permissionStore.permissionsActivated) {
        permissionStore.permissionsActivated[key] = false;
      }
    } else {
      permissionStore.permissionsActivated.isEditProjectsName =
        permissionStore.profilePermissionsUserSession?.permissions?.every(
          (permissions) => permissions.code !== "edit_project_name"
        );

      permissionStore.permissionsActivated.isEditProjectsClient =
        permissionStore.profilePermissionsUserSession?.permissions?.every(
          (permissions) => permissions.code !== "edit_project_client"
        );
    }
  },

  archiveBudgetBusiness: async ({ 
    organizationStore, 
    permissionStore, 
    userStore,  
    SavetoUserPermissions = true,
  }) => {
    
    if (SavetoUserPermissions) {
      await permissionStore.getProfilePermissionsByUserSession(
        userStore.userSession._id
      );
    }

    const isOwner = ref(
      organizationStore.organization?.owner?._id === userStore.userSession?._id 
    );

    if (isOwner.value) {
      for (const key in permissionStore.permissionsActivated) {
        permissionStore.permissionsActivated[key] = false;
      }
    } else {
      permissionStore.permissionsActivated.isArchivedProjects =
        permissionStore.profilePermissionsUserSession?.permissions?.every(
          (permissions) => permissions.code !== "delete_projects"
        );
      }

  },

  // PERMISSION CONFIGURATION

  settingsOrganizationConfig: async ({ 
    organizationStore, 
    permissionStore, 
    userStore,
    SavetoUserPermissions = true,
  }) => {
    if (SavetoUserPermissions) {
      await permissionStore.getProfilePermissionsByUserSession(
        userStore.userSession._id
      );
    }

    const isOwner = ref(
      organizationStore.organization?.owner?._id === userStore.userSession?._id
    );

    if (isOwner.value) {
      for (const key in permissionStore.permissionsActivated) {
        permissionStore.permissionsActivated[key] = false;
      }
    }
    else {
      permissionStore.permissionsActivated.isConfig =
        permissionStore.profilePermissionsUserSession?.permissions?.every(
          (permissions) => permissions.code !== "configs"
        );
    }
  }, 

  settingsBusinessAreas: async ({ 
    organizationStore, 
    permissionStore, 
    userStore,
    SavetoUserPermissions = true,
  }) => {
    if (SavetoUserPermissions) {
      await permissionStore.getProfilePermissionsByUserSession(
        userStore.userSession._id
      );
    }

    const isOwner = ref(
      organizationStore.organization?.owner?._id === userStore.userSession?._id
    );

    if (isOwner.value) {
      for (const key in permissionStore.permissionsActivated) {
        permissionStore.permissionsActivated[key] = false;
      }
    } else {
      permissionStore.permissionsActivated.isConfigBusinessAreas =
        permissionStore.profilePermissionsUserSession?.permissions?.every(
          (permissions) => permissions.code !== "configure_business_area"
        );
    }
  },

  settingsValidations : async ({ 
    organizationStore, 
    permissionStore, 
    userStore,
    SavetoUserPermissions = true,
  }) => {
    if (SavetoUserPermissions) {
      await permissionStore.getProfilePermissionsByUserSession(
        userStore.userSession._id
      );
    }

    const isOwner = ref(
      organizationStore.organization?.owner?._id === userStore.userSession?._id
    );

    if (isOwner.value) {
      for (const key in permissionStore.permissionsActivated) {
        permissionStore.permissionsActivated[key] = false;
      }
    } else {
      permissionStore.permissionsActivated.isConfigValidations =
        permissionStore.profilePermissionsUserSession?.permissions?.every(
          (permissions) => permissions.code !== "config_validations"
        );
    }

  },

  settingsListPermissions: async ({
      organizationStore, 
      permissionStore, 
      userStore,
      SavetoUserPermissions = true,
  }) => {
    if (SavetoUserPermissions) {
      await permissionStore.getProfilePermissionsByUserSession(
        userStore.userSession._id
      );
    }

    const isOwner = ref(
      organizationStore.organization?.owner?._id === userStore.userSession?._id
    )

    if (isOwner.value) {
      for (const key in permissionStore.permissionsActivated) {
        permissionStore.permissionsActivated[key] = false;
      }
    } else {
      permissionStore.permissionsActivated.isEditPermissions =
        permissionStore.profilePermissionsUserSession?.permissions?.every(
          (permissions) => permissions.code !== "edit_permission_profiles"
        );
    }

  }

};




export default async function middlewarePermisssionActivation(
  StringViewPermission,
  extras = {},
  SavetoUserPermissions = true
) {
  const permissionStore = usePermissionStore();
  const organizationStore = useOrganizationStore();
  const globalStore = useGlobalStore();
  const userStore = useUserStore();

  if (!StringViewPermission) {
    return false;
  }

  if (funtionsPermissionsActivation[StringViewPermission]) {
    return await funtionsPermissionsActivation[StringViewPermission]({
      permissionStore,
      organizationStore,
      globalStore,
      userStore,
      SavetoUserPermissions,
      ...extras,
    });
  } else {
    console.warn(`No existe la función para: ${StringViewPermission}`);
    return false;
  }
}