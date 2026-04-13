// composables/useRadioButtonsManager.js
import { ref, computed } from 'vue';
import usePermissionStore from '@/stores/permissions';

/**
 * Composable para manejar radio buttons de permisos
 * Maneja dos tipos de radio buttons:
 * - default: "Todos los creados" vs "Solo asignados"
 * - enableDisables: "Habilitado" vs "Deshabilitado"
 * 
 * @param {Ref<Array>} userPermissions - Lista reactiva de permisos del usuario
 */
export function useRadioButtonsManager() {
  const permissionStore = usePermissionStore();

  // ========================================
  // 1. CONFIGURACIÓN DE TIPOS DE RADIO BUTTONS
  // ========================================
  
  const RADIO_TYPES = {
    DEFAULT: 'general',
    ENABLE_DISABLE: 'default',
    GENERAL_OUTCOMES: 'general_outcomes'
  };

  // Configuración para cada tipo de radio button
  const radioConfigs = {
    //"default"
    [RADIO_TYPES.DEFAULT]: {
      // Opciones disponibles en el radio button
      slots: ['allCreated', 'onlyAssigned'],
      
      // Función que determina qué opción está activa según si el usuario tiene el permiso
      getActiveSlot: (userHasPermission) => {
        return userHasPermission ? 'allCreated' : 'onlyAssigned';
      },
      
      // Función que determina si el usuario debe tener el permiso según la opción seleccionada
      shouldHavePermission: (selectedOption) => {
        return selectedOption === 'allCreated';
      }
    },
    
    //"enableDisables"
    [RADIO_TYPES.ENABLE_DISABLE]: {
      slots: ['enabled', 'disabled'],
      
      getActiveSlot: (userHasPermission) => {
        return userHasPermission ? 'enabled' : 'disabled';
      },
      
      shouldHavePermission: (selectedOption) => {
        return selectedOption === 'enabled';
      }
    },

    // "general_outcomes"
    [RADIO_TYPES.GENERAL_OUTCOMES]: {
      slots: ['allCreated', 'onlyMyCreated'],

      getActiveSlot: (userHasPermission) => {
        return userHasPermission ? 'allCreated' : 'onlyMyCreated';
      },

      shouldHavePermission: (selectedOption) => {
        return selectedOption === 'allCreated';

      }
    }
  };

  // ========================================
  // 2. FUNCIONES AUXILIARES PARA CONFIGURACIÓN
  // ========================================
  
  /**
   * Obtiene la configuración de un tipo de radio button
   */
  function getRadioConfig(type) {
    return radioConfigs[type] || null;
  }

  /**
   * Obtiene las opciones disponibles para un tipo de radio button
   */
  function getRadioSlots(type) {
    const config = getRadioConfig(type);
    return config ? config.slots : [];
  }

  // ========================================
  // 3. TRABAJAR CON PERMISOS DEL STORE
  // ========================================

  /**
   * Obtiene todos los permisos disponibles en el store (aplanados)
   */
  const allPermissions = computed(() => {
    return permissionStore.permissions
      .flatMap(area => area.groups)
      .flatMap(group => group.subcategories)
      .flatMap(subcategory => subcategory.permissions);
  });

  /**
   * Busca un permiso específico por su ID en el store
   */
  function findPermissionInStore(permissionId) {
    return allPermissions.value.find(permission => permission._id === permissionId) || null;
  }

  /**
   * Busca todos los permisos hijos de un permiso padre
   */
  function findChildPermissions(parentPermissionId) {
    return allPermissions.value.filter(permission => permission.head === parentPermissionId);
  }

  // ========================================
  // 4. TRABAJAR CON PERMISOS DEL USUARIO
  // ========================================
  
  /**
   * Lista de IDs de permisos que tiene el usuario actualmente
   */
  const userPermissionIds = computed(() => {
    return permissionStore.propsListPermissions.idPermissions;
  });

  /**
   * Verifica si el usuario tiene un permiso específico
   */
  function userHasPermission(permissionId) {
    return userPermissionIds.value.includes(permissionId);
  }

  /**
   * Agrega un permiso al usuario si no lo tiene
   */
  function addPermissionToUser(permissionId) {
    if (!userHasPermission(permissionId)) {
      permissionStore.propsListPermissions.idPermissions.push(permissionId);
    }
  }

  /**
   * Remueve un permiso del usuario
   */
  function removePermissionFromUser(permissionId) {
    permissionStore.propsListPermissions.idPermissions = 
      permissionStore.propsListPermissions.idPermissions.filter(id => id !== permissionId);
  }

  // ========================================
  // 5. LÓGICA DE RADIO BUTTONS
  // ========================================
  
  /**
   * Determina si una opción específica del radio button está activa
   */
  function isPermissionActive(item, slotName, groupType) {
    if (!item._id) return false;
    
    const config = getRadioConfig(groupType);
    if (!config) return false;

    const hasPermission = userHasPermission(item._id);
    const activeSlot = config.getActiveSlot(hasPermission);
    
    return activeSlot === slotName;
  }

  /**
   * Determina si una opción del radio button está deshabilitada
   */
  function isDisabledRadioPermission(item, slotName, groupType) {
    return false;
  }

  // ========================================
  // 6. GESTIÓN INTELIGENTE DE PERMISOS PADRE-HIJO
  // ========================================
  
  /**
   * Activa un permiso y maneja automáticamente las dependencias padre-hijo
   * 
   * REGLAS:
   * - Si activo un hijo → el padre se activa automáticamente
   * - Si activo un padre → no afecta a los hijos
   */
  function activatePermission(permissionId) {
    // console.log(`🟢 Activando permiso: ${permissionId}`);
    
    // 1. Activar el permiso solicitado
    addPermissionToUser(permissionId);
    
    // 2. Encontrar el permiso en el store para ver si tiene padre
    const permission = findPermissionInStore(permissionId);
    
    // 3. Si tiene padre, activarlo también (es un permiso hijo)
    if (permission && permission.head) {
      // console.log(`   └── Es un permiso hijo, activando padre: ${permission.head}`);
      activatePermissionParent(permission.head);
    }
  }

  /**
   * Activa recursivamente todos los permisos padre hacia arriba
   */
  function activatePermissionParent(parentId) {
    // Activar el padre
    addPermissionToUser(parentId);
    
    // Buscar si este padre tiene a su vez otro padre
    const parentPermission = findPermissionInStore(parentId);
    if (parentPermission && parentPermission.head) {
      // console.log(`   └── Activando abuelo: ${parentPermission.head}`);
      activatePermissionParent(parentPermission.head);
    }
  }

  /**
   * Desactiva un permiso y maneja automáticamente las dependencias padre-hijo
   * 
   * REGLAS:
   * - Si desactivo un padre → todos sus hijos se desactivan
   * - Si desactivo un hijo → el padre se desactiva solo si no quedan otros hijos activos
   */
  function deactivatePermission(permissionId) {
    // console.log(`🔴 Desactivando permiso: ${permissionId}`);
    
    const permission = findPermissionInStore(permissionId);
    
    // CASO 1: Es un permiso hijo (tiene padre)
    if (permission && permission.head) {
      // console.log(`   └── Es un permiso hijo`);
      deactivateChildPermission(permissionId, permission.head);
    }
    // CASO 2: Es un permiso padre (no tiene padre)
    else {
      // console.log(`   └── Es un permiso padre`);
      deactivateParentPermission(permissionId);
    }
  }

  /**
   * Desactiva un permiso hijo y verifica si debe desactivar el padre
   */
  function deactivateChildPermission(childId, parentId) {
    // 1. Desactivar el hijo y sus propios hijos
    removePermissionFromUser(childId);
    deactivateAllChildrenRecursively(childId);
    
    // 2. Verificar si quedan otros hijos activos del mismo padre
    const siblingPermissions = findChildPermissions(parentId);
    const hasActiveSiblings = siblingPermissions.some(sibling => 
      sibling._id !== childId && userHasPermission(sibling._id)
    );
    
    // 3. Si no quedan hijos activos, desactivar el padre
    if (!hasActiveSiblings) {
      // console.log(`   └── No quedan hijos activos, desactivando padre: ${parentId}`);
      
      // Desactivar el padre
      removePermissionFromUser(parentId);
      
      // Verificar si el padre tiene a su vez un padre
      const parentPermission = findPermissionInStore(parentId);
      if (parentPermission && parentPermission.head) {
        // console.log(`   └── Verificando si desactivar abuelo: ${parentPermission.head}`);
        deactivateChildPermission(parentId, parentPermission.head);
      }
    } else {
      // console.log(`   └── Quedan hijos activos, padre mantiene activo`);
    }
  }

  /**
   * Desactiva un permiso padre y todos sus hijos
   */
  function deactivateParentPermission(parentId) {
    // 1. Desactivar el padre
    removePermissionFromUser(parentId);
    
    // 2. Desactivar todos los hijos recursivamente
    deactivateAllChildrenRecursively(parentId);
  }

  /**
   * Desactiva recursivamente todos los hijos de un permiso
   */
  function deactivateAllChildrenRecursively(parentId) {
    const childPermissions = findChildPermissions(parentId);
    
    childPermissions.forEach(child => {
      if (userHasPermission(child._id)) {
        // console.log(`   └── Desactivando hijo: ${child._id}`);
        removePermissionFromUser(child._id);
        
        // Desactivar recursivamente los hijos de este hijo
        deactivateAllChildrenRecursively(child._id);
      }
    });
  }

  // ========================================
  // 7. MANEJO DE CAMBIOS EN RADIO BUTTONS
  // ========================================
  
  /**
   * Maneja el cambio de una opción en un radio button
   * Esta es la función principal que se llama desde el componente
   */
  function handleChangeRadioPermission(item, slotName, groupType) {
    // console.log(`🎯 Cambio en radio button: ${item._id} → ${slotName}`);
    
    const config = getRadioConfig(groupType);
    if (!config || !item._id) return;

    const currentlyHasPermission = userHasPermission(item._id);
    const shouldHavePermission = config.shouldHavePermission(slotName);

    // Determinar qué acción tomar
    if (shouldHavePermission && !currentlyHasPermission) {
      // ACTIVAR el permiso
      activatePermission(item._id);
    } else if (!shouldHavePermission && currentlyHasPermission) {
      // DESACTIVAR el permiso
      deactivatePermission(item._id);
    }
    
    // console.log(`✅ Cambio completado`);
  }

  // ========================================
  // 8. FUNCIONES AUXILIARES PARA DEPENDENCIAS
  // ========================================
  
  /**
   * Obtiene todos los permisos que dependen de un permiso específico
   */
  function getPermissionDependencies(permissionId) {
    return findChildPermissions(permissionId);
  }

  /**
   * Verifica si un permiso tiene dependencias activas
   */
  function hasActiveDependencies(permissionId) {
    const dependencies = getPermissionDependencies(permissionId);
    return dependencies.some(dependency => userHasPermission(dependency._id));
  }

  /**
   * Función para verificar si dos arrays tienen el mismo contenido
   */
  const arraysEqualPermissions = (arr1, arr2) => {
    if (arr1.length !== arr2.length) return false;
    
    const set1 = new Set(arr1);
    const set2 = new Set(arr2);
    
    if (set1.size !== set2.size) return false;
    
    for (let item of set1) {
      if (!set2.has(item)) return false;
    }
    
    return true;
  };

  /**
   * Verifica si hubo cambios en los permisos
   */
  function hasPermissionChanges() {
    const currentPermissions = permissionStore.propsListPermissions.idPermissions;
    const originalPermissions = permissionStore.propsListPermissions.copyIdPermissions;
    
    return !arraysEqualPermissions(currentPermissions, originalPermissions);
  }

  // ========================================
  // 9. FUNCIONES DE UTILIDAD PARA DEBUGGING
  // ========================================
  
  /**
   * Muestra el estado actual de los permisos (útil para debugging)
   */
  // function debugPermissions() {
  //   console.log('📋 Estado actual de permisos:');
  //   console.log('Permisos activos:', userPermissionIds.value);
    
  //   userPermissionIds.value.forEach(id => {
  //     const permission = findPermissionInStore(id);
  //     if (permission) {
  //       console.log(`  - ${id}: ${permission.name || 'Sin nombre'} ${permission.head ? `(hijo de ${permission.head})` : '(padre)'}`);
  //     }
  //   });
  // }

  // ========================================
  // 10. RETORNO DEL COMPOSABLE
  // ========================================
  
  return {
    // Configuraciones
    radioConfigs,
    getRadioConfig,
    getRadioSlots,
    
    // Estado de radio buttons
    isPermissionActive,
    isDisabledRadioPermission,
    
    // Manejo de cambios (FUNCIÓN PRINCIPAL)
    handleChangeRadioPermission,
    
    // Información del usuario
    userPermissionIds,
    
    // Funciones auxiliares
    getPermissionDependencies,
    hasActiveDependencies,
    findPermissionInStore,
    hasPermissionChanges,
    
    // Funciones de utilidad (debugging cambios de permisos)
    // debugPermissions,
    
    // Funciones de activación/desactivación (por si necesitas usarlas directamente)
    activatePermission,
    deactivatePermission
  };
}