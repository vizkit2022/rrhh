<script setup>
import { ref, onMounted } from "vue";
import useGlobalStore from "@/stores/global";
import useOrganizationStore from "@/stores/organization";
import usePermissionsStore from "@/stores/permissions";
import labels from "@/utils/labels/location.json";
import {
  searchLocationByGoogleMaps,
  testGoogleMapsPlaces,
} from "@/utils/helpers";

// Stores
const globalStore = useGlobalStore();
const organizationStore = useOrganizationStore();
const permissionsStore = usePermissionsStore();

// Reactive properties
const googleMapsAvailable = ref(true);
const options = ref({
  street: [],
  country: [],
  region: [],
  city: [],
});
const loadings = ref({});
const errors = ref({});
const { t } = useI18n();
const module = "modules.organizations.settings";

// Mounted
onMounted(async () => {
  googleMapsAvailable.value = await testGoogleMapsPlaces();
  // En caso google Maps no este disponible, los países se pre cargan
  if (!googleMapsAvailable.value) {
    const countries = await globalStore.getCountries();
    options.value.country = countries.map((country) => ({
      label: country.name[globalStore.lang],
      place_id: country.place_id || "",
    }));
  }
});

// Functions
const save = async () => {
  validFormLocal();
  if (organizationStore.validForm()) {
    globalStore.loading = true;
    await organizationStore.updateOrganizationFunction();
    const newName = organizationStore.organization.razon_social;
    globalStore.title = newName;
    globalStore.breadcrumb[2].name = newName;
    globalStore.loading = false;
  }
};

const validFormLocal = () => {
  // Para mostrar los mensajes de error
  // errors.value.street =
  //   organizationStore.organization.address.street.name.trim() === "";
  errors.value.country =
    organizationStore.organization.address.country.name.trim() === "";
  // errors.value.region =
  //   organizationStore.organization.address.region.name.trim() === "";
  // errors.value.city =
  //   organizationStore.organization.address.city.name.trim() === "";
};

// Country
const cleanInputCountry = () => {
  organizationStore.organization.address.country = {
    name: "",
    place_id: "",
    short_name: "",
  };
};
const searchCountry = debounce(async (event) => {
  const toSearch = event.target.value.trim();
  loadings.value.country = true;
  if (toSearch !== "") {
    // Si funciona Google Maps
    if (googleMapsAvailable.value) {
      const config = {
        str: toSearch,
        type: "country",
      };
      options.value.country = await searchLocationByGoogleMaps(config);
    }
  }
  loadings.value.country = false;
}, 10);
const selectedCountry = (op) => {
  organizationStore.organization.address.country = {
    place_id: op.place_id || "",
    name: op.label || "",
    short_name: op.countryCode || "",
  };
};

// Region y Ciudad
const cleanInputRegionOrCity = (prop) => {
  organizationStore.organization.address[prop] = {
    name: "",
    place_id: "",
  };
};

const searchRegionOrCity = debounce(async (event, prop) => {
  const toSearch = event.target.value.trim();
  loadings.value[prop] = true;
  if (toSearch !== "") {
    // Si funciona Google Maps
    if (googleMapsAvailable.value) {
      const config = {
        str: toSearch,
        type: "city",
        countryCode:
          organizationStore.organization.address.country.short_name || "",
      };
      options.value[prop] = await searchLocationByGoogleMaps(config);
    }
  }
  loadings.value[prop] = false;
}, 10);
const selectedRegionOrCity = (op, prop) => {
  organizationStore.organization.address[prop] = {
    place_id: op.place_id || "",
    name: op.label || "",
  };
};

// Direccion
const cleanInputStreet = () => {
  organizationStore.organization.address.street = {
    name: "",
    place_id: "",
  };
};
const searchAddress = debounce(async (event) => {
  const toSearch = event.target.value.trim();
  if (toSearch === "") {
    options.value.street = [];
  } else {
    try {
      // SI Funciona GoogleMaps
      if (googleMapsAvailable.value) {
        loadings.value.street = true;
        const config = {
          str: toSearch,
          type: "street",
          countryCode:
            organizationStore.organization.address.country.short_name || "",
        };
        const resp = await searchLocationByGoogleMaps(config);
        options.value.street = resp;
      }
    } catch (error) {
      options.value.street = [];
      console.error(error);
    } finally {
      loadings.value.street = false;
    }
  }
}, 10);

const selectedAddress = async (op) => {
  organizationStore.organization.address.street = {
    name: op.label,
    place_id: op.place_id,
  };
};
</script>

<template>
  <div class="form">
    <div class="form__content">
      <div class="form__input">
        <div class="form__label">
          <label>
            {{ labels.street[globalStore.lang] }}
            <span>({{ t(`${module}.optional`) }})</span>
          </label>
          <span
            v-if="errors.street"
            v-text="labels.error[globalStore.lang]"
          ></span>
        </div>
        <u-search
          v-if="googleMapsAvailable"
          @input="searchAddress($event)"
          @selectedOption="selectedAddress"
          :options="options.street"
          :loading="loadings.street"
          @cleanInput="cleanInputStreet"
          v-model="organizationStore.organization.address.street.name"
          :disabled="
            !permissionsStore.myPermissions?.settings_account_info ||
            !permissionsStore.myPermissions?.page_settings ||
            organizationStore.organization.address.country.short_name === ''
          "
        />
        <u-input
          v-else
          v-model="organizationStore.organization.address.street.name"
          :disabled="
            !permissionsStore.myPermissions?.settings_account_info ||
            !permissionsStore.myPermissions?.page_settings
          "
        />
      </div>
      <div class="form__input">
        <div class="form__label">
          <label>
            {{ labels.country[globalStore.lang] }}
            <span>({{ t(`${module}.required`) }})</span>
          </label>
          <span
            v-if="errors.country"
            style="color: var(--danger-text-default) !important"
            v-text="labels.error[globalStore.lang]"
          ></span>
        </div>
        <u-search
          v-model="organizationStore.organization.address.country.name"
          @input="searchCountry($event)"
          @selectedOption="selectedCountry"
          :options="options.country"
          :loading="loadings.country"
          @cleanInput="cleanInputCountry"
          :disabled="!permissionsStore.myPermissions?.settings_account_info"
        />
      </div>
      <div class="form__input">
        <div class="form__label">
          <label>
            {{ labels.region[globalStore.lang] }}
            <span>({{ t(`${module}.optional`) }})</span>
          </label>
          <span
            v-if="errors.region"
            v-text="labels.error[globalStore.lang]"
          ></span>
        </div>
        <u-search
          v-if="googleMapsAvailable"
          v-model="organizationStore.organization.address.region.name"
          @input="searchRegionOrCity($event, 'region')"
          @selectedOption="(op) => selectedRegionOrCity(op, 'region')"
          :options="options.region"
          :loading="loadings.region"
          :disabled="
            !permissionsStore.myPermissions?.settings_account_info ||
            !permissionsStore.myPermissions?.page_settings ||
            organizationStore.organization.address.country.short_name === ''
          "
          @cleanInput="cleanInputRegionOrCity('region')"
        />
        <u-input
          v-else
          v-model="organizationStore.organization.address.region.name"
          :disabled="
            !permissionsStore.myPermissions?.settings_account_info ||
            !permissionsStore.myPermissions?.page_settings
          "
        />
      </div>
      <div class="form__input">
        <div class="form__label">
          <label>
            {{ labels.city[globalStore.lang] }}
            <span>({{ t(`${module}.optional`) }})</span>
          </label>
          <span
            v-if="errors.city"
            v-text="labels.error[globalStore.lang]"
          ></span>
        </div>
        <u-search
          v-if="googleMapsAvailable"
          v-model="organizationStore.organization.address.city.name"
          @input="searchRegionOrCity($event, 'city')"
          @selectedOption="(op) => selectedRegionOrCity(op, 'city')"
          :options="options.city"
          :loading="loadings.city"
          :disabled="
            !permissionsStore.myPermissions?.settings_account_info ||
            !permissionsStore.myPermissions?.page_settings ||
            organizationStore.organization.address.country.short_name === ''
          "
          @cleanInput="cleanInputRegionOrCity('city')"
        />
        <u-input
          v-else
          v-model="organizationStore.organization.address.city.name"
          :disabled="
            !permissionsStore.myPermissions?.settings_account_info ||
            !permissionsStore.myPermissions?.page_settings
          "
        />
      </div>
    </div>
    <div class="form__acctions">
      <u-button
        text="Guardar"
        class="mainBtnModify"
        size="l"
        @click="save"
        :disabled="
          !permissionsStore.myPermissions?.settings_account_info ||
          !permissionsStore.myPermissions?.page_settings
        "
      />
    </div>
  </div>
</template>

<style scoped>
.form {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 20px;
  height: 100%;
  max-width: 600px;
}
.form__content {
  display: flex;
  flex-direction: column;
  gap: 20px;
}
.form__input {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.form__input .form__label {
  display: flex;
  gap: 10px;
  align-items: center;
}
.form__input .form__label label,
.form__input .form__label span {
  font-family: Nunito;
  font-size: 12px;
  font-weight: 600;
  line-height: 16px;
  text-align: left;
  color: var(--neutral-text-body);
}
.form__input .form__label span {
  color: var(--neutral-text-caption);
}
.form__acctions {
  display: flex;
  justify-content: flex-end;
}
.mainBtnModify {
  width: 150px;
}
</style>
