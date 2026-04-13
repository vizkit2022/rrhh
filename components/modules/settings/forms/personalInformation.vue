<script setup>
import { ref, onMounted, onBeforeUnmount } from "vue";
import { toast } from "vue3-toastify";
import useUserStore from "@/stores/user";
import useGlobalStore from "@/stores/global";
import {
  debounce,
  searchLocationByGoogleMaps,
  testGoogleMapsPlaces,
} from "@/utils/helpers";

// Stores
const userStore = useUserStore();
const globalStore = useGlobalStore();

const { $bus } = useNuxtApp();
const user = ref();
const errorInputs = ref({});
const googleMapsAvailable = ref(true);

onMounted(async () => {
  $bus.$on("errorForm", (error) => {
    errorInputs.value = error;
  });
  user.value = userStore.profile;

  googleMapsAvailable.value = await testGoogleMapsPlaces();
});

onBeforeUnmount(() => {
  $bus.$off("errorForm");
});

// Roles
const role = ref("");
const resultsRoles = ref([]);
const loadingRoles = ref(false);
const stateRole = ref(false);

watch(ref(role), async () => {
  if (role.value.trim()) {
    loadingRoles.value = true;
    await userStore.filterRolesByName(role.value.trim());
    loadingRoles.value = false;
    resultsRoles.value = mapperSearchRoles(
      userStore.roles_list,
      globalStore.lang
    );
  }
});

const selectRoleResult = (selected) => {
  cleanInput("role");
  if (!user.value.roles.some((r) => r._id === selected.oldData._id)) {
    user.value.roles.unshift({
      name: selected.oldData.name,
      _id: selected.oldData._id,
    });
  }
};

const deleteTag = (id, type) => {
  if (type === "locations") {
    const pos = id;
    user.value.locations.splice(pos, 1);
  } else {
    const index = user.value[type].findIndex((r) => r._id === id);
    user.value[type].splice(index, 1);
  }
};

// Languages
const language = ref("");
const resultsLanguages = ref([]);
const loadingLanguages = ref(false);
const stateLanguage = ref(false);

watch(ref(language), async () => {
  if (language.value.trim()) {
    loadingLanguages.value = true;
    resultsLanguages.value = mapperSearchLanguages(
      globalStore.languages.filter((l) =>
        l.spanish.toLowerCase().includes(language.value.toLocaleLowerCase())
      )
    );
    loadingLanguages.value = false;
  }
});

const selectLanguageResult = (selected) => {
  cleanInput("language");
  if (!user.value.languages.some((r) => r._id === selected.oldData._id)) {
    user.value.languages.unshift({
      spanish: selected.label,
      _id: selected.oldData._id,
    });
  }
};

// Locations
const location = ref("");
const placesPredictions = ref([]);
const loadingLocations = ref(false);

function searchPlaces(query) {
  if (!query) {
    placesPredictions.value = [];
    return;
  }
  loadingLocations.value = true;
  const autocompleteService = new google.maps.places.AutocompleteService();
  autocompleteService.getPlacePredictions(
    {
      input: query,
      types: ["(cities)"], // Restricción para buscar solo ciudades
    },
    (predictions, status) => {
      loadingLocations.value = false;
      if (status === google.maps.places.PlacesServiceStatus.OK) {
        placesPredictions.value = predictions.map((p) => ({
          label: p.description,
          place_id: p.place_id,
        }));
      } else {
        placesPredictions.value = [];
      }
    }
  );
}

// Fetch place photo by place_id
function fetchPlacePhoto(placeId, callback) {
  const container = document.createElement("div");
  const service = searchLocationByGoogleMaps();
}

// Handle selection of place
function selectPlace(selected) {
  fetchPlacePhoto(selected.place_id, (url) => {
    if (!user.value.locations.some((l) => l.name === selected.label)) {
      user.value.locations.unshift({
        name: selected.label,
        place_id: selected.place_id,
        url: url,
      });
    }
    location.value = "";
  });
}

// Watch for changes in location input
watch(
  () => location.value,
  (newValue) => {
    if (newValue && newValue.length > 2) {
      searchPlaces(newValue);
    } else {
      placesPredictions.value = [];
    }
  }
);

const addLocation = () => {
  if (
    !!location.value.trim() &&
    !user.value.locations.some(
      (l) => l.name.toLocaleLowerCase() === location.value.toLocaleLowerCase()
    )
  ) {
    user.value.locations.unshift({ name: location.value.trim() });
    location.value = "";
  }
};

// Limpiar Inputs
const cleanInput = (type) => {
  const types = {
    language: () => {
      language.value = "";
      loadingLanguages.value = false;
    },
    role: () => {
      role.value = "";
      loadingRoles.value = false;
    },
  };
  types[type]();
};

// Validar Formulario
const validForm = () => {
  if (user.value.name.first === "") {
    toast.error("El nombre es obligatorio.", {
      autoClose: 3000,
    });
    $bus.$emit("errorForm", { name: true, op: 0 });
    return false;
  }
  if (
    user.value.otherAccounts.web != "" &&
    !validateSimpleURL(user.value.otherAccounts.web)
  ) {
    toast.error("El nombre del Sitio Web no es Válido.", {
      autoClose: 3000,
    });
    $bus.$emit("errorForm", { web: true, op: 1 });
    return false;
  }
  $bus.$emit("errorForm", {});
  return true;
};

// Save
const save = async () => {
  if (validForm()) {
    globalStore.loading = true;
    await userStore.updateUser(user.value);
    globalStore.loading = false;
  }
};
</script>

<template>
  <div class="form" v-if="user">
    <div class="form__content">
      <div class="form__content-col">
        <div class="form__content-cellTwo">
          <div class="form__content-cell">
            <label :class="`${errorInputs.name ? 'labelError' : ''}`">
              Nombre <span>(*)</span>
            </label>
            <u-input
              v-model="user.data.name.first"
              size="m"
              placeholder="Nombre"
              :error="errorInputs.name"
            />
          </div>
          <div class="form__content-cell">
            <label>Apellido</label>
            <u-input
              v-model="user.data.name.last"
              size="m"
              placeholder="Apellido"
            />
          </div>
        </div>
        <div class="form__content-cell">
          <label>Apodo <span>(Opcional)</span></label>
          <u-input v-model="user.data.nickName" size="m" />
        </div>
        <div class="form__content-cell">
          <label>Sobre mí <span>(Opcional)</span></label>
          <div style="height: 180px">
            <u-textarea
              v-model="user.description"
              class="textareaModify"
              size="m"
            />
          </div>
        </div>
      </div>
      <div class="form__content-col">
        <div class="form__content-cell">
          <label>Roles</label>
          <u-search
            v-model="role"
            size="m"
            :options="resultsRoles"
            :loading="loadingRoles"
            placeholder="Ingresa el rol"
            :updated="false"
            @cleanInput="cleanInput('role')"
            @selectedOption="selectRoleResult"
            :error="stateRole"
          />
          <div class="form__content-tags" v-if="user.roles.length">
            <u-tags
              v-for="rol in user.roles"
              :key="rol._id"
              :text="rol.name[globalStore.lang]"
              :delete="true"
              @closeButton="deleteTag(rol._id, 'roles')"
            />
          </div>
        </div>
        <div class="form__content-cell">
          <label>Ubicaciones</label>
          <u-search
            v-model="location"
            :options="placesPredictions"
            :loading="loadingLocations"
            placeholder="Ingresa una ciudad"
            @input="searchPlaces(location)"
            @selectedOption="selectPlace"
          />
          <div class="form__content-tags" v-if="user.roles.length">
            <u-tags
              v-for="(location, index) in user.locations"
              :key="index"
              :text="location.name"
              :delete="true"
              @closeButton="deleteTag(index, 'locations')"
            />
          </div>
        </div>
        <div class="form__content-cell">
          <label>Idiomas</label>
          <u-search
            v-model="language"
            size="m"
            :options="resultsLanguages"
            :loading="loadingLanguages"
            placeholder="Ingresa el Idioma"
            :updated="false"
            @cleanInput="cleanInput('language')"
            @selectedOption="selectLanguageResult"
            :error="stateLanguage"
          />
          <div class="form__content-tags" v-if="user.languages.length">
            <u-tags
              v-for="language in user.languages"
              :key="language._id"
              :text="language.spanish"
              :delete="true"
              @closeButton="deleteTag(language._id, 'languages')"
            />
          </div>
        </div>
      </div>
    </div>
    <div class="form__actions">
      <u-button
        class="mainBtnModify"
        text="Guardar"
        size="m"
        @action-btn="save"
      />
    </div>
  </div>
</template>

<style scoped>
.form {
  max-width: 1000px;
  min-height: calc(100vh - 98px - 280px - 20px);
  height: auto;
  /* height: calc(100vh - 98px - 280px - 20px); */
  display: grid;
  grid-template-rows: 1fr 40px;
  gap: 20px;
  margin: 0 auto;
}
.form__content {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 30px;
  padding-right: 2px;
}
.form__content-col {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.form__content-cellTwo {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}
.form__content-cell {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.form__content-cell label {
  font-size: 12px;
}
.form__actions {
  display: flex;
  justify-content: flex-end;
}
.form__content-tags {
  height: auto;
  max-height: 76px;
  overflow-y: auto;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
}
.form__content-tags::-webkit-scrollbar {
  width: 2px;
  height: 0px;
}
.mainBtnModify {
  width: 150px;
}
.labelError {
  color: var(--bg-danger-500) !important;
}

@media only screen and (max-width: 1000px) {
  .form__content {
    grid-template-columns: 1fr;
  }
}
</style>
