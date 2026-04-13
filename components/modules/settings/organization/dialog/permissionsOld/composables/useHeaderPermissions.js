import { computed, ref } from "vue";
import usePermissionsStore from "@/stores/permissions";
import useGlobalStore from "@/stores/global";
import useUserStore from '@/stores/user';
// import middlewarePermisssionActivation from "~/composables/usePermissionActivation";

/**
 * Composable para manejar permisos en el header
 * Gestiona la selección de perfiles, edición y guardado de permisos
 * 
 * @param {Function} emit - Función para emitir eventos al componente padre
 */
export const useHeaderPermissions = (emit) => {
    // ========================================
    // 1. INICIALIZACIÓN DE STORES
    // ========================================
    
    const permissionStore = usePermissionsStore();
    const globalStore = useGlobalStore();
    const userStore = useUserStore();

    // ========================================
    // 2. ESTADO REACTIVO - CONTROL DE UI
    // ========================================
    
    // Control de cambio de perfil
    const isChangeProfile = ref(false);
    
    // Control de botones deshabilitados
    const disabledEditSearch = ref(false);
    const disabledSaveButton = ref(false);
    
    // Control de modales/warnings
    const showWarningTypeSavePermission = ref(false);
    const showWarningNewRoleUser = ref(false);
    
    // Nombre del nuevo perfil
    const nameNewRole = ref("");
    
    // Selector de perfil
    const selectProfile = ref({
        label: '',
        value: '',
        _id: ''
    });

    // ========================================
    // 3. CONFIGURACIÓN DE BOTONES Y OPCIONES
    // ========================================
    
    // Configuración de botones para warning de tipo de permisos
    const buttonsWarningTypePermissions = [
        {
            text: "Editar para todos",
            type: "outlined",
            size: "xs",
            class: "btnEdit",
            color: "--neutral-text-caption",
            action: () => handleSaveAllMembersPermissions(),
        },
        {
            text: "Editar para este usuario",
            type: "outlined", 
            size: "xs",
            class: "btnEdit",
            color: "--neutral-text-caption",
            action: () => handleShowEditNewProfile(),
        },
    ];

    // ========================================
    // 4. COMPUTED PROPERTIES
    // ========================================
    
    /**
     * Verifica si el usuario es owner o admin para desactivar botones
     */
    const isOwnerOrAdmin = computed(() => {
        return !permissionStore.myPermissions?.members_listPermissions_edit
    });

    /**
     * Opciones del selector de perfiles de permisos
     */
    const optionsProfilePermissions = computed(() =>
        permissionStore.profilePermissions.map((p) => ({
            label: p.name[globalStore.lang],
            value: p.code,
            _id: p._id
        }))
    );

    /**
     * Array de botones para editar y guardar permisos
     */
    const arrayEditSaveButton = computed(() => [
        {
            text:"Editar Permisos",
            icon: "edit",
            disabled: isOwnerOrAdmin.value,
            action: handleEditPermissions,
        },
        {
            text: "Guardar Permisos", 
            icon: "save",
            disabled: disabledSaveButton.value || !permissionStore.propsListPermissions.isChangePermissions,
            action: handleShowSavePermissions,
        },
    ]);

    /**
     * Botón actual a mostrar (Editar o Guardar)
     */
    const currentButtonSaveEdit = computed(() => {
        return permissionStore.propsListPermissions.isEdit
            ? arrayEditSaveButton.value[1] // Botón "Guardar"
            : arrayEditSaveButton.value[0]; // Botón "Editar"
    });

    // ========================================
    // 5. FUNCIONES DE INICIALIZACIÓN
    // ========================================
    
    /**
     * Inicializa el selector de perfil con el perfil actual del usuario
     */
    const initializeHeaderProfilePermissions = () => {
        selectProfile.value = {
            label: permissionStore.profileByUserID.name[globalStore.lang],
            value: permissionStore.profileByUserID.code,
            _id: permissionStore.profileByUserID._id
        }
    }


    // ========================================
    // 6. FUNCIONES DE UTILIDAD Y ESTADO
    // ========================================
    
    /**
     * Resetea el estado de la UI y lógica del store
     */
    const resetUIState = () => {
        showWarningTypeSavePermission.value = false;
        permissionStore.propsListPermissions.isEdit = false;
        permissionStore.propsListPermissions.isChangePermissions = false;
        disabledSaveButton.value = false;
        showWarningNewRoleUser.value = false;
    }

    /**
     * Verifica si cambió el perfil seleccionado
     * @param {string} currentProfileCode - Código del perfil actual
     */
    const checkProfileChange = (currentProfileCode) => {
        const originalProfile = permissionStore.profileByUserID?.code;
        
        if(currentProfileCode === originalProfile) {
            isChangeProfile.value = false;
        } else {
            isChangeProfile.value = true; 
        }
    }

    /**
     * Actualiza mis permisos
     */
    const getMyPermissions = async () => {
        const idUserSession = userStore.userSession?._id;
        await permissionStore.getMyPermissions(idUserSession, "settings");
    }


    // ========================================
    // 7. MANEJO DE SELECCIÓN DE PERFIL
    // ========================================
    
    /**
     * Maneja la selección de un perfil en el selector
     * @param {Object} option - Opción seleccionada del selector
     */
    const handleSelectProfile = async (option) => {
        selectProfile.value = {
            label: option.label,
            value: option.value,
            _id: option._id
        }

        permissionStore.propsListPermissions.idPermissions = permissionStore.profilePermissions.find(p => p._id === option._id).permissions

        // permissionStore.propsListPermissions.permissions = permissionStore.profilePermissions.docs.find(p => p._id === option._id)

        permissionStore.propsListPermissions.isEdit = false;

        resetUIState();
        
        // Verificar cambio de perfil
        checkProfileChange(option.value);
    }

    // ========================================
    // 8. MANEJO DE BOTONES DEL HEADER
    // ========================================
    
    /**
     * Activa el modo de edición de permisos
     */
    const handleEditPermissions = () => {
        permissionStore.propsListPermissions.isEdit = true;
    }

    /**
     * Muestra el warning para seleccionar tipo de guardado
     */
    const handleShowSavePermissions = () => {
        showWarningTypeSavePermission.value = true;
        disabledSaveButton.value = true;
    }

    /**
     * Muestra el modal para crear nuevo perfil
     */
    const handleShowEditNewProfile = () => {
        console.log("edit new profile");
        showWarningTypeSavePermission.value = false;
        showWarningNewRoleUser.value = true;
    }

    // ========================================
    // 9. ACTUALIZACIÓN DE PERFILES
    // ========================================
    
    /**
     * Actualiza el perfil seleccionado del usuario
     * @param {boolean} saveUserSesion - Si debe guardar en sesión del usuario
     */
    const updatedProfileSelected = async (saveUserSesion = false) => {
        try {
            await permissionStore.getProfileByUserId(permissionStore.propsListPermissions.memberSelected.user._id, true, saveUserSesion);

            // Obtener permisos completos
            const permissions = permissionStore.profileByUserID?.permissions || [];

            // Guardar los IDs, full y copy original de permisos en el store
            // permissionStore.propsListPermissions.permissions = userPermissions.value;

            permissionStore.propsListPermissions.idPermissions = permissions.map(p => p._id)

            permissionStore.propsListPermissions.copyIdPermissions = [...permissionStore.propsListPermissions.idPermissions];

        } catch (error) {
            console.log(error);
        } 
    }

    // ========================================
    // 10. OPERACIONES DE GUARDADO
    // ========================================
    
    /**
     * Maneja el cambio de perfil del usuario
     */
    const handleChangeProfile = async () => {
        console.log("change profile");
        try {
            globalStore.loading = true;

            const body = {
                userId: permissionStore.propsListPermissions.memberSelected.user._id, 
                permissionId: selectProfile.value._id 
            }
            
            // Actualizar permisos del perfil del usuario
            await permissionStore.updateProfilePermissions(body);

            // Obtener el perfil de permisos del usuario
            await permissionStore.getProfilePermissionsByUserSession(
                userStore.userSession?._id
            );

            // Verificar si es owner o admin
            // initializeOwnerAdmin();

            // Actualizar permisos después del cambio de perfil
            await updatedProfileSelected();

            // Verificar cambio de perfil después de actualizar
            checkProfileChange(selectProfile.value.value);

            // await updateMiddlewarePermissions();
            await getMyPermissions();

            emit("updatedMembers")

        } catch (error) {
            console.log(error);
        } finally {
            globalStore.loading = false;
        }
    }

    /**
     * Guarda permisos para todos los miembros del perfil
     */
    const handleSaveAllMembersPermissions = async () => {
        try {
            globalStore.loading = true;

            // Actualizar permisos
            const idPermission = selectProfile.value._id;
            
            const bodyUpdatedPermission = {
                permissions: permissionStore.propsListPermissions.idPermissions
            }

            await permissionStore.updatePermissions(idPermission, bodyUpdatedPermission);

            await updatedProfileSelected(true);

            // Recargar perfiles
            await permissionStore.getProfilePermissions();

            // await updateMiddlewarePermissions();
            await getMyPermissions();

            resetUIState();
            emit("updatedMembers")

        } catch (error) {
            console.log(error);
        } finally {
            globalStore.loading = false;
        }
    }

    /**
     * Guarda un nuevo perfil de permisos
     */
    const handleSaveNewProfile = async () => {

        if (!nameNewRole.value) {
            console.log("No se ha ingresado un nombre para el nuevo perfil de permisos");
            return;
        }

        try {
            globalStore.loading = true;

            const newPermissionProfile = {
                code: nameNewRole.value.toLocaleLowerCase().replace(/\s+/g, ""),
                name: {
                    es: nameNewRole.value,
                    en: nameNewRole.value,
                },
                description: `Perfil de ${nameNewRole.value}`,
                isActive: true,
                permissions: permissionStore.propsListPermissions.idPermissions,
                user: permissionStore.propsListPermissions.memberSelected.user._id
            }

            await permissionStore.createProfilePermissions(newPermissionProfile);

            // Recargar perfiles
            await permissionStore.getProfilePermissions();

            // Obtener el nuevo perfil creado
            const newProfile = permissionStore.profilePermissions.find(
                profile => profile.code === newPermissionProfile.code
            );

            // Actualizar el perfil del usuario
            if (newProfile) {
                const bodyUserProfile = {
                    userId: permissionStore.propsListPermissions.memberSelected.user._id,
                    permissionId: newProfile._id
                };
                await permissionStore.updateProfilePermissions(bodyUserProfile);
            }

            // Actualizar permisos de la tabla y session del user
            if (permissionStore.propsListPermissions.memberSelected.user._id === userStore.userSession?._id) {
                await updatedProfileSelected(true);
            } else {
                await updatedProfileSelected();
            }

            // Actualizar del selector del header
            initializeHeaderProfilePermissions();
            
            // Actualizar perfil actual del usuario en session si es el mismo
            // if (permissionStore.propsListPermissions.memberSelected.user._id === userStore.userSession?._id) {
            //     await permissionStore.getProfilePermissionsByUserSession(userStore.userSession?._id);
            // }
            
            // Verificar si es owner o admin
            // initializeOwnerAdmin();

            // await updateMiddlewarePermissions();
            await getMyPermissions();
            
            resetUIState();
            emit("updatedMembers")

        } catch (error) {
            console.log(error);
        } finally {
            globalStore.loading = false;
        }
    }

    // ========================================
    // 11. RETORNO DEL COMPOSABLE
    // ========================================

    return {
        // Funciones de inicialización
        initializeHeaderProfilePermissions,
        
        // Estado reactivo
        selectProfile,
        isChangeProfile,
        showWarningTypeSavePermission,
        showWarningNewRoleUser,
        nameNewRole,
        
        // Computed properties
        isOwnerOrAdmin,
        optionsProfilePermissions,
        currentButtonSaveEdit,
        
        // Configuraciones
        buttonsWarningTypePermissions,
        
        // Funciones de manejo
        handleSelectProfile,
        
        // Funciones de guardado
        handleChangeProfile,
        handleSaveAllMembersPermissions,
        handleSaveNewProfile,
    }
}