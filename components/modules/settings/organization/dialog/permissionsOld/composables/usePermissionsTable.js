import { ref } from 'vue';
import configListPermissions from "@/utils/configTables/listPermissions.json";
import usePermissionsStore from '@/stores/permissions';
import useUserStore from '@/stores/user';

export const usePermissionsTable = () => {

  // STORE
  const permissionStore = usePermissionsStore();
  const userStore = useUserStore();

  // CONST
  const userPermissionIds = ref([]);
  const copyUserPermissionIds = ref([]);
  const userPermissions = ref([]); 

  // CONFIG TYPES
  const configTypeGroupsPermissions = {
    general: configListPermissions.general,
    default: configListPermissions.default,
    general_outcomes: configListPermissions.general_outcomes
  };

  // FUNCTIONS
  const getConfigForGroup = (group) => {
    const baseConfig = configTypeGroupsPermissions?.[group?.group_info?.group_type] || configTypeGroupsPermissions?.default;
    const config = JSON.parse(JSON.stringify(baseConfig));
    
    if(config?.cols?.[0]?.name) {
      config.cols[0].name = {
        es: group?.group_info?.group_name?.es || '',
        en: group?.group_info?.group_name?.en || ''
      };
    }
    
    return config || {};
  };

const getPermissionsFromGroup = (group) => {
  const subcategories = group.subcategories;

  return subcategories.map((sub, subIndex) => {
    const isLastSubcategory = subIndex === subcategories.length - 1;
    const permissions = sub.permissions;

    return permissions.map((permission, permIndex) => {
      const isLastPermission = permIndex === permissions.length - 1;

      // Aplicar separator si:
      // - Hay más de una subcategoría
      // - No es la última subcategoría
      // - Es el último permiso dentro de su subcategoría
      const shouldHaveSeparator = (
        subcategories.length > 1 &&
        !isLastSubcategory &&
        isLastPermission
      );

      return {
        ...permission,
        separator: shouldHaveSeparator,
      };
    });
  }).flat();
};


  const initializePermissionsProfileUser = async () => {
    await permissionStore.getPermissions();
    // await permissionStore.getProfileByUserId(permissionStore.propsListPermissions.memberSelected.user._id);
    // await permissionStore.getProfilePermissionsByUserSession(userStore.userSession?._id);
    if (permissionStore.propsListPermissions.memberSelected.user._id === userStore.userSession?._id) {
        await permissionStore.getProfileByUserId(permissionStore.propsListPermissions.memberSelected.user._id, true, true);
    } else {
        await permissionStore.getProfileByUserId(permissionStore.propsListPermissions.memberSelected.user._id);
    }


    // Obtener permisos completos
    const permissions = permissionStore.profileByUserID?.permissions || [];
    
    // Guardar los permisos completos 
    userPermissions.value = permissions;
    // Guardar los IDs 
    userPermissionIds.value = permissions.map(p => p._id);
    // Guardar copia de los IDs
    copyUserPermissionIds.value = [...userPermissionIds.value];

    // Guardar los IDs, full y copy original de permisos en el store
    // permissionStore.propsListPermissions.permissions = userPermissions.value;
    permissionStore.propsListPermissions.idPermissions = userPermissionIds.value;
    permissionStore.propsListPermissions.copyIdPermissions = copyUserPermissionIds.value;
    
  };

  return {
    getConfigForGroup,
    getPermissionsFromGroup,
    initializePermissionsProfileUser
  };
};