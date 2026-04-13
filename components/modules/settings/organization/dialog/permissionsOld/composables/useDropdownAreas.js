// composables/useDropdownAreas.js
import { ref } from 'vue';

export const useDropdownAreas = (permissionStore) => {
  // CONST
  const statesDropdownsAreas = ref({});

  // FUNCTIONS
  const openDropdownAreas = (indexAreas) => {
    if (statesDropdownsAreas.value[indexAreas] === undefined) {
      statesDropdownsAreas.value[indexAreas] = false;
    } 
    statesDropdownsAreas.value[indexAreas] = !statesDropdownsAreas.value[indexAreas];
  };

  const isOpenDropdownAreas = (indexAreas) => {
    return statesDropdownsAreas.value[indexAreas];
  };

  const initDropdownsAreas = () => {
    permissionStore.permissions?.forEach((_, index) => {
      statesDropdownsAreas.value[index] = true;
    });
  };

  return {
    statesDropdownsAreas,
    openDropdownAreas,
    isOpenDropdownAreas,
    initDropdownsAreas
  };
};