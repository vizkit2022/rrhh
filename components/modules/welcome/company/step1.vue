<script setup>
import { ref, computed, onMounted } from "vue";
import useWizardStore from "@/stores/wizard";
import useGlobalStore from "@/stores/global";
import {
  searchLocationByGoogleMaps,
  testGoogleMapsPlaces,
} from "@/utils/helpers";

// STORES
const wizardStore = useWizardStore();
const globalStore = useGlobalStore();

// Constants
const { t } = useI18n();
const module = "modules.wizard.steps.address";
const button = "modules.wizard.buttons";
const options = ref({
  street: [],
  country: [],
  region: [],
  city: [],
});
const googleMapsAvailable = ref(true);

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

const loadings = ref({});

const hasAllData = computed(() => {
  return (
    !!wizardStore.organization.address.country.name.trim() &&
    !!wizardStore.organization.address.street.name.trim() &&
    !!wizardStore.organization.address.region.name.trim() &&
    !!wizardStore.organization.address.city.name.trim()
  );
});

// Acciones
const nextStep = () => {
  wizardStore.oldStep = wizardStore.step;
  wizardStore.step = 8; // Avanzar al siguiente paso lógico
};

const backStep = () => {
  wizardStore.step = 1; // Volver al paso inicial
};

// Country
const cleanInputCountry = () => {
  wizardStore.organization.address.country = {
    name: "",
    place_id: "",
    short_name: "",
  };
  cleanInputRegionOrCity("region");
  cleanInputRegionOrCity("city");
  cleanInputStreet();
};
const searchCountry = debounce(async (event) => {
  const toSearch = event.target.value.trim();

  cleanInputRegionOrCity("region");
  cleanInputRegionOrCity("city");
  cleanInputStreet();

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
  wizardStore.organization.address.country = {
    place_id: op.place_id || "",
    name: op.label || "",
    short_name: op.countryCode || "",
  };
};
// Region y Ciudad
const cleanInputRegionOrCity = (prop) => {
  wizardStore.organization.address[prop] = {
    name: "",
    place_id: "",
  };
};

const searchRegionOrCity = debounce(async (event, prop) => {
  const toSearch = event.target.value.trim();
  if (prop === "region") {
    cleanInputRegionOrCity("city");
    cleanInputStreet();
  } else if (prop === "city") {
    cleanInputStreet();
  }
  loadings.value[prop] = true;
  if (toSearch !== "") {
    // Si funciona Google Maps
    if (googleMapsAvailable.value) {
      const config = {
        str: toSearch,
        type: "city",
        countryCode: wizardStore.organization.address.country.short_name || "",
      };
      options.value[prop] = await searchLocationByGoogleMaps(config);
    }
  }
  loadings.value[prop] = false;
}, 10);
const selectedRegionOrCity = (op, prop) => {
  wizardStore.organization.address[prop] = {
    place_id: op.place_id || "",
    name: op.label || "",
  };
};
// Direccion
const cleanInputStreet = () => {
  wizardStore.organization.address.street = {
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
            wizardStore.organization.address.country.short_name || "",
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
  wizardStore.organization.address.street = {
    name: op.label,
    place_id: op.place_id,
  };
};
</script>

<template>
  <div class="containerPage">
    <div class="containerPage__card">
      <div class="sup">
        <div class="logo">
          <u-logo class="img" />
          <u-logo-text class="text" />
        </div>
        <div class="content">
          <h2 class="title headline-m-sb">{{ t(module + ".title") }}</h2>
          <div class="form">
            <div class="groupInput">
              <label v-text="t(module + '.inputs.country.label')"></label>
              <u-search
                v-model="wizardStore.organization.address.country.name"
                :options="options.country"
                @input="searchCountry"
                :placeholder="t(module + '.inputs.country.placeholder')"
                :loading="loadings.country"
                @selectedOption="selectedCountry"
                @cleanInput="cleanInputCountry"
              />
            </div>
            <div class="groupInput">
              <label v-text="t(module + '.inputs.region.label')"></label>
              <u-search
                v-if="googleMapsAvailable"
                v-model="wizardStore.organization.address.region.name"
                :options="options.region"
                :placeholder="t(module + '.inputs.region.placeholder')"
                :loading="loadings.region"
                @input="searchRegionOrCity($event, 'region')"
                @selectedOption="(op) => selectedRegionOrCity(op, 'region')"
                @cleanInput="cleanInputRegionOrCity('region')"
                :disabled="
                  [undefined, null, ''].includes(
                    wizardStore.organization.address.country.short_name
                  )
                "
              />
              <u-input
                v-else
                v-model="wizardStore.organization.address.region.name"
                :placeholder="t(module + '.inputs.region.placeholder')"
              />
            </div>
            <div class="groupInput">
              <label v-text="t(module + '.inputs.city.label')"></label>
              <u-search
                v-if="googleMapsAvailable"
                v-model="wizardStore.organization.address.city.name"
                :options="options.city"
                :placeholder="t(module + '.inputs.city.placeholder')"
                :loading="loadings.city"
                @input="searchRegionOrCity($event, 'city')"
                @selectedOption="(op) => selectedRegionOrCity(op, 'city')"
                @cleanInput="cleanInputRegionOrCity('city')"
                :disabled="
                  [undefined, null, ''].includes(
                    wizardStore.organization.address.country.short_name
                  )
                "
              />
              <u-input
                v-else
                v-model="wizardStore.organization.address.city.name"
                :placeholder="t(module + '.inputs.city.placeholder')"
              />
            </div>
            <div class="groupInput">
              <label v-text="t(module + '.inputs.address.label')"></label>
              <u-search
                v-if="googleMapsAvailable"
                v-model="wizardStore.organization.address.street.name"
                :options="options.street"
                :placeholder="t(module + '.inputs.address.placeholder')"
                :loading="loadings.street"
                @input="searchAddress($event)"
                @selectedOption="selectedAddress"
                @cleanInput="cleanInputStreet"
                :disabled="
                  [undefined, null, ''].includes(
                    wizardStore.organization.address.country.short_name
                  )
                "
              />
              <u-input
                v-else
                v-model="wizardStore.organization.address.street.name"
                :placeholder="t(module + '.inputs.address.placeholder')"
              />
            </div>
          </div>
        </div>
      </div>
      <div class="actions">
        <u-button
          size="xl"
          :text="t(button + '.back')"
          @action-btn="backStep"
          type="text"
        ></u-button>
        <u-button
          size="xl"
          :text="t(button + '.next')"
          :disabled="!hasAllData"
          @action-btn="nextStep"
          style="width: 200px"
        ></u-button>
      </div>
    </div>
    <img
      class="containerPage__img"
      :src="`/img/location business${globalStore.isDark ? '-dark' : ''}.svg`"
      alt="Vector location"
    />
  </div>
</template>

<style scoped>
span,
label,
p,
h2,
button {
  font-family: Nunito;
}

.containerPage {
  display: flex;
  gap: 48px;
  justify-content: center;
  align-items: center;
  animation: section 0.8s ease-in;
}

@keyframes section {
  0%,
  5% {
    opacity: 0;
  }

  100% {
    opacity: 1;
  }
}

.containerPage__card {
  width: 500px;
  height: 85vh;
  max-height: 780px;
  min-height: 690px;

  padding: 48px 24px;
  box-sizing: border-box;
  border-radius: 24px;
  gap: 48px;
  background-color: var(--neutral-background-default);
  box-shadow: var(--elevation-xl);
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-direction: column;
}

.sup {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  gap: 20px;
}

.logo {
  display: flex;
  justify-content: center;
  align-items: center;
  margin-bottom: 15px;
}

.logo .img {
  height: 28px;
  width: 28px;
}

.logo .text {
  height: 24px;
  width: 124px;
}

.title {
  text-align: center;
  color: var(--neutral-text-body);
  margin: 10px 0 5px;
  padding: 0 20px;
}

.subtitle {
  text-align: left;
  color: var(--neutral-text-caption);
  padding-bottom: 20px;
  line-height: 20px !important;
}

.groupInput {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.groupInput label {
  font-size: 12px;
  font-weight: 600;
  line-height: 16px;
  text-align: left;
  color: var(--neutral-text-body);
}

.form {
  display: flex;
  width: 100%;
  flex-direction: column;
  gap: 20px;
  height: auto;
  padding: 0px 4px 3px 0;
  margin: 15px 0 5px;
}

.actions {
  width: 100%;
  display: flex;
  justify-content: space-between;
}

.containerPage__img {
  width: auto;
  max-width: 600px;
  height: 60vh;
  max-height: 540px;
}

.groupInput::v-deep(.cleanBtn) {
  font-size: larger;
}

@media only screen and (max-width: 1886px) {
  .containerPage__img {
    max-width: 500px;
  }
}

@media only screen and (max-width: 1090px) {
  .containerPage__img {
    max-width: 400px;
  }
}

@media only screen and (max-width: 985px) {
  .containerPage__img {
    display: none;
  }
}
</style>
