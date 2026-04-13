<script setup>
import { ref, onMounted } from "vue";

// ===== STORES =====
import useOrganizationStore from "@/stores/organization";
import useBusinessAreaStore from "@/stores/businessAreas";
import useGlobalStore from "@/stores/global";
import usePermissionStore from "@/stores/permissions";

// Configuración de la tabla
import configPermissionBusinessAreas from "@/utils/configTables/permissionsBusinessAreas.json";

// ===== INICIALIZACIÓN DE STORES =====
const organizationStore = useOrganizationStore();
const globalStore = useGlobalStore();
const businessAreasStore = useBusinessAreaStore();
const permissionStore = usePermissionStore();

// ===== VARIABLES REACTIVAS =====
// Lista de áreas de negocio que se mostrará en la tabla
const businessAreasContent = ref([]);

// Array que mantiene los IDs de las áreas de negocio seleccionadas
const selectedBusinessAreasIds = ref([]);

// ===== CONFIGURACIÓN DE ESTILOS =====
// Mapeo de estados para los estilos visuales (no se usa actualmente pero está disponible)
const statusMap = {
  true: {
    color: "--success-text-darker",
    background: "--success-surface-light"
  },
  false: {
    color: "--bg-neutral",
    background: "--bg-neutral-100"
  }
};

// ===== FUNCIONES =====

/**
 * Actualiza el estado de las áreas de negocio
 * Esta función sincroniza los datos del store con el estado local del componente
 */
const refreshBusinessAreasState = () => {
  // Reinicia el array de IDs seleccionados
  selectedBusinessAreasIds.value = [];
  
  // Mapea cada área de negocio del store para crear la estructura necesaria para la tabla
  businessAreasContent.value = businessAreasStore.businessAreas.map((area) => {
    // Verifica si el área está asignada al usuario seleccionado
    const isAssigned = permissionStore.propsListPermissions.memberSelected.businessArea.some(
      (assignedArea) => assignedArea._id === area._id
    );

    // Si está asignada, la agrega al array de IDs seleccionados
    if (isAssigned) {
      selectedBusinessAreasIds.value.push(area._id);
    }

    // Retorna el objeto con la información necesaria para la tabla
    return {
      ...area,  
      name: area.name, 
      assigned: isAssigned
    };
  });
};

/**
 * Maneja el cambio de estado cuando se selecciona/deselecciona un área de negocio
 * @param {Object} item - El área de negocio que se está modificando
 */
const updateSelected = async (item) => {
  // Activa el indicador de carga
  globalStore.loading = true;

  // Obtiene el ID del usuario seleccionado
  const userId = permissionStore.propsListPermissions.memberSelected.user._id;

  if (item.assigned) {
    // ===== CASO: ASIGNAR ÁREA DE NEGOCIO =====
    
    // Agrega el ID al array de seleccionados si no existe
    if (!selectedBusinessAreasIds.value.includes(item._id)) {
      selectedBusinessAreasIds.value.push(item._id);
    }
    
    // Actualiza también el estado en el store de permisos
    const alreadyExists = permissionStore.propsListPermissions.memberSelected.businessArea.some(
      area => area._id === item._id
    );
    
    if (!alreadyExists) {
      permissionStore.propsListPermissions.memberSelected.businessArea.push(item);
    }
    
  } else {
    // ===== CASO: DESASIGNAR ÁREA DE NEGOCIO =====
    
    // Elimina el ID del array de seleccionados
    const indexInSelected = selectedBusinessAreasIds.value.indexOf(item._id);
    if (indexInSelected !== -1) {
      selectedBusinessAreasIds.value.splice(indexInSelected, 1);
    }

    // Elimina el área del estado del miembro seleccionado
    const indexInMember = permissionStore.propsListPermissions.memberSelected.businessArea.findIndex(
      (area) => area._id === item._id
    );
    if (indexInMember !== -1) {
      permissionStore.propsListPermissions.memberSelected.businessArea.splice(indexInMember, 1);
    }
  }

  // ===== ENVÍO DE DATOS AL SERVIDOR =====
  // body para enviar al backend
  const requestBody = {
    userId: userId,
    businessAreas: selectedBusinessAreasIds.value
  };

  try {
    // Actualiza las asignaciones en el servidor
    await businessAreasStore.updatedAssingBusinessArea(requestBody);
    
    // Actualiza los datos de la organización
    await organizationStore.getOrganizationById();
    
    // Refresca el estado local con los datos actualizados
    refreshBusinessAreasState();
    
  } catch (error) {
    console.error('Error al actualizar las asignaciones:', error);
  }

  globalStore.loading = false;
};

// ===== CICLO DE VIDA =====

onMounted(async () => {
  globalStore.loading = true;

  try {
    // Obtiene las áreas de negocio de la organización
    await businessAreasStore.getBusinessAreaForOrganization();
    
    // Actualiza el estado local con los datos obtenidos
    refreshBusinessAreasState();
    
  } catch (error) {
    console.error('Error al cargar las áreas de negocio:', error);
  }

  globalStore.loading = false;
});
</script>

<template>

  <TableBasic 
    :configTable="configPermissionBusinessAreas.permissionsBusinessAreas"
    :content="businessAreasContent"
    :lazyRender="true"
  >
    <template v-slot:name="item"> 
      <span class="textBusinessAreas">{{ item.item.name }}</span>
    </template>

    <template v-slot:assigned="item">
      <u-checkbox 
        v-model="item.item.assigned" 
        :height="16" 
        class="checkboxAssigned" 
        @click="updateSelected(item.item)" 
      />
    </template>
  </TableBasic>
</template>

<style scoped> 
.textBusinessAreas {
  font-weight: 600;
  font-size: 14px;
  line-height: 18px;
  color: var(--neutral-text-body);
}

.checkboxAssigned {
  margin: 0 auto;
}
</style>