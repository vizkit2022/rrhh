<script setup>
import { ref, computed, watch, onMounted } from "vue";
import useUserStore from "@/stores/user";
import useGlobalStore from "@/stores/global";
import {
  debounce,
  searchLocationByGoogleMaps,
  testGoogleMapsPlaces,
} from "@/utils/helpers";
import { useI18n } from "vue-i18n";

// Translation
const { t, locale } = useI18n();
const module = "modules.mySettings";
const moduleDateGeneral =
  "modules.mySettings.sections.personalInfo.data.general";
const moduleDateContact =
  "modules.mySettings.sections.personalInfo.data.contact";
// Stores
const userStore = useUserStore();
const globalStore = useGlobalStore();

// Constants
const toSearchRoles = ref("");
const country = ref("");
const address = ref("");
const city = ref("");
const cities = ref("");
const countryData = ref({});
const cityData = ref({});
const loadings = ref({});
const options = ref({});
const results = ref({});
const typeSupplierOptions = [
  { label: "Empresa", icon: "building", value: "business" },
  { label: "Persona", icon: "user", value: "personal" },
];
const googleMapsAvailable = ref(true);
const showCreateRole = ref(false);
const lookModal = ref(false);

// Computed
const getIconForm = computed(() => {
  const types = {
    business: "building",
    personal: "user",
  };
  return types[userStore.mySettings.form.data.type] || "pin";
});

// OnMounted
onMounted(async () => {
  getAddress();

  googleMapsAvailable.value = await testGoogleMapsPlaces();

  // En caso google Maps no este disponible, los países se pre cargan
  if (!googleMapsAvailable.value) {
    const countries = await globalStore.getCountries();
    options.value.countryOriginal = countries.map((country) => ({
      label: country.name[globalStore.lang],
      place_id: country.place_id || "",
      fullData: country,
    }));
  }
});

// Computed
const canCreateRole = computed(() => {
  const value = toSearchRoles.value?.trim().toLowerCase();

  if (!value) return false;

  // Buscar en roles traídos del backend
  const existsInResults =
    results.value.roles?.some((r) => r.label.toLowerCase() === value) || false;

  // Buscar en los ya seleccionados
  const existsInSelected =
    userStore?.mySettings?.form?.roles?.some(
      (r) => r.name?.[globalStore.lang]?.toLowerCase() === value,
    ) || false;

  return !existsInResults && !existsInSelected;
});

// Functions
const hidenModal = () => {
  showCreateRole.value = false;
  lookModal.value = false;
};

const getAddress = () => {
  if (userStore?.mySettings?.form?.address?.country?.place_id) {
    countryData.value = userStore.mySettings.form.address.country;
    country.value = userStore.mySettings.form.address.country.name;
    if (userStore?.mySettings?.form?.address?.street) {
      address.value = userStore.mySettings.form.address.street;
    }
    if (userStore?.mySettings?.form?.address?.city) {
      cityData.value = userStore.mySettings.form.address.city;
      city.value = userStore.mySettings.form.address.city.name;
    }
  }
};
const mapperRoles = () => {
  let resp = [];
  userStore.roles_list.forEach((t) => {
    resp.push({
      label: t.name[globalStore.lang],
      id: t._id,
    });
  });
  return resp;
};
const searchRoles = debounce(async (newValue) => {
  const trimmedSearch = newValue.trim();
  if (trimmedSearch !== "") {
    loadings.value.roles = true;
    await userStore.filterRolesByName(trimmedSearch, userStore.userSession._id);
    if (userStore.roles_list && userStore.roles_list.length) {
      results.value.roles = mapperRoles();
    } else {
      results.value.roles = [];
    }
    loadings.value.roles = false;
  }
}, 600);
const selectRol = (rol) => {
  console.log(rol);
  if (!!userStore?.mySettings?.form?.roles) {
    const rolExists = userStore.mySettings.form.roles.some(
      (existingRol) =>
        existingRol.name[globalStore.lang].toLowerCase() ===
        rol.label.toLowerCase(),
    );
    if (!rolExists) {
      userStore.mySettings.form.roles.unshift({
        name: { [globalStore.lang]: rol.label },
        _id: rol.id,
      });
      userStore.mySettings.change = true;
    }
    setTimeout(() => {
      toSearchRoles.value = "";
    }, 10);
  }
};
const removeRol = (pos) => {
  userStore.mySettings.form.roles.splice(pos, 1);
  userStore.mySettings.change = true;
};
const createRol = () => {
  setTimeout(async () => {
    if (userStore.mySettings.hidenMsgCreateRol) {
      try {
        globalStore.loading = true;
        const body = {
          name: {
            [globalStore.lang]: toSearchRoles.value,
          },
          department: {
            es: "Otros",
            en: "Otros",
          },
        };
        const { data: respRole } = await userStore.createUserRole(body);

        const fomartDataRol = {
          label: respRole.name?.[globalStore.lang] || respRole.name?.es,
          id: respRole.id,
          isActive: true,
          suggestion: true,
        };

        selectRol(fomartDataRol);
      } catch (error) {
        console.log(error);
      } finally {
        globalStore.loading = false;
      }
      return;
    }
    showCreateRole.value = true;
  }, 0);
};

// Watch
watch(
  () => toSearchRoles.value,
  async (newValue) => {
    searchRoles(newValue);
  },
);

watch(
  () => userStore.mySettings.change,
  (newVal, oldVal) => {
    if (!newVal) {
      toSearchRoles.value = "";
      country.value = "";
      address.value = "";
      city.value = "";
      countryData.value = {};
      getAddress();
    }
  },
);

const debouncedEmailValidation = debounce((index) => {
  const email = userStore.mySettings.form.contactMethods.emails[index];
  const isValid = email.email !== "" && regexEmail(email.email);
  userStore.mySettings.errors.email2 = !isValid;
  userStore.mySettings.change = true;
}, 600);

const changeExtraEmail = (index) => {
  debouncedEmailValidation(index);
};

const addExtraEmail = () => {
  // extraEmails.value.push({
  //   id: Date.now(),
  //   value: "",
  //   error: false,
  // });
  userStore.mySettings.form.contactMethods.emails.push({
    email: "",
  });
  userStore.mySettings.errors.email2 = false;
};

const removeExtraEmail = (index) => {
  userStore.mySettings.form.contactMethods.emails.splice(index, 1);
  userStore.mySettings.errors.email2 = false;
  userStore.mySettings.change = true;
};

// ############### Google Maps
// Country
const searchCountry = debounce(async () => {
  userStore.mySettings.change = true;
  address.value = "";
  city.value = "";
  const obj = {
    name: "",
    place_id: "",
    short_name: "",
  };
  countryData.value = JSON.parse(JSON.stringify(obj));
  cityData.value = JSON.parse(JSON.stringify(obj));

  userStore.mySettings.form.address.country = countryData.value;
  userStore.mySettings.form.address.street = "";
  userStore.mySettings.form.address.city = cityData.value;
  const toSearch = country.value.trim();
  if (toSearch !== 0) {
    try {
      userStore.mySettings.change = true;
      loadings.value.country = true;

      // Si Google Maps funciona
      if (googleMapsAvailable.value) {
        const config = {
          str: toSearch,
          type: "country",
        };
        options.value.country = await searchLocationByGoogleMaps(config);
      }
      // No Funciona Google Mpas
      else {
        options.value.country = options.value.countryOriginal.filter(
          (country) =>
            country.label
              ?.toLocaleLowerCase()
              .includes(toSearch.toLocaleLowerCase()),
        );
      }
    } catch (error) {
      options.value.countries = [];
      console.error(error);
    } finally {
      loadings.value.country = false;
    }
  }
}, 10);

const selectedCountry = async (op) => {
  console.log(op);
  countryData.value = {
    place_id: op.place_id || "",
    name: op.label || "",
    short_name: op.countryCode || "",
  };
  userStore.mySettings.form.address.country = {
    name: countryData.value.name,
    short_name: countryData.value.short_name,
    place_id: countryData.value.place_id,
  };
  if (userStore?.mySettings?.data?.phone?.length < 5) {
    defaultPrefix.value = op.place_id;
  }
  userStore.mySettings.errors.country = false;
};

const cleanCountry = () => {
  userStore.mySettings.change = true;
  country.value = "";
  address.value = "";
  city.value = "";
  countryData.value = {
    name: "",
    place_id: "",
    short_name: "",
  };
  cityData.value = {
    name: "",
    place_id: "",
    short_name: "",
  };
  userStore.mySettings.form.address.country = countryData.value;
  userStore.mySettings.form.address.street = "";
  userStore.mySettings.form.address.city = cityData.value;
};

// Address
const searchAddress = debounce(async () => {
  const toSearch = address.value.trim();
  if (toSearch.length >= 3) {
    try {
      userStore.mySettings.change = true;
      loadings.value.address = true;

      // Si Google Maps funciona
      if (googleMapsAvailable.value) {
        const config = {
          str: toSearch,
          type: "street",
          countryCode: userStore.mySettings.form.address.country.short_name,
        };
        options.value.address = await searchLocationByGoogleMaps(config);
      }
      // No Funciona Google Mpas
      else {
        // Cambiaremos el u-search por u-input, por eso su options esta vacio, porque no se usará
        options.value.address = [];
      }
    } catch (error) {
      options.value.address = [];
      console.error(error);
    } finally {
      loadings.value.address = false;
    }
  }
}, 10);

const selectedAddress = async (op) => {
  userStore.mySettings.form.address.street = op.label;
  userStore.mySettings.change = true;
  userStore.mySettings.errors.street = false;
};

const cleanAddress = () => {
  userStore.mySettings.change = true;
  address.value = "";
  userStore.mySettings.form.address.street = "";
};

// City
const searchCity = debounce(async () => {
  const toSearch = city.value.trim();
  const obj = {
    name: "",
    place_id: "",
  };
  cityData.value = obj;
  userStore.mySettings.form.address.city = cityData.value;
  if (toSearch !== "") {
    try {
      userStore.mySettings.change = true;
      loadings.value.city = true;
      // Si Google Maps funciona
      if (googleMapsAvailable.value) {
        const config = {
          str: toSearch,
          type: "city",
          countryCode: userStore.mySettings.form.address.country.short_name,
        };
        options.value.city = await await searchLocationByGoogleMaps(config);
      }
      // No Funciona Google Mpas
      else {
        // Cambiaremos el u-search por u-input, por eso su options esta vacio, porque no se usará
        options.value.city = [];
      }
    } catch (error) {
      options.value.city = [];
      console.error(error);
    } finally {
      loadings.value.city = false;
    }
  }
}, 10);

const selectedCity = async (op) => {
  userStore.mySettings.form.address.city = {
    name: op.label,
    place_id: op.place_id,
  };
  userStore.mySettings.change = true;
};

const cleanCity = () => {
  userStore.mySettings.change = true;
  const obj = {
    name: "",
    place_id: "",
  };
  cityData.value = obj;
  userStore.mySettings.form.address.city = cityData.value;
};

// Cities
const searchCities = debounce(async () => {
  const toSearch = cities.value.trim();
  if (toSearch !== 0) {
    try {
      userStore.mySettings.change = true;
      loadings.value.cities = true;
      // Si Google Maps funciona
      if (googleMapsAvailable.value) {
        const config = {
          str: toSearch,
          type: "city",
        };
        options.value.cities = await await searchLocationByGoogleMaps(config);
      }
      // No Funciona Google Mpas
      else {
        // Cambiaremos el u-search por u-input, por eso su options esta vacio, porque no se usará
        options.value.cities = [];
      }
    } catch (error) {
      options.value.cities = [];
      console.error(error);
    } finally {
      loadings.value.cities = false;
    }
  }
}, 10);

const selectedCities = async (op) => {
  if (userStore?.mySettings?.form?.address?.places) {
    const cityExists = userStore.mySettings.form.address.places.some(
      (existingCity) => existingCity.place_id === op.place_id,
    );
    if (!cityExists) {
      userStore.mySettings.form.address.places.unshift({
        name: op.label,
        place_id: op.place_id,
      });
      userStore.mySettings.change = true;
    }
    setTimeout(() => {
      cities.value = "";
    }, 10);
  }
};

const cleanCities = () => {
  userStore.mySettings.change = true;
  cities.value = "";
};

const removeCities = (pos) => {
  userStore.mySettings.form.address.places.splice(pos, 1);
  userStore.mySettings.change = true;
};

const selectedCitiesNoGoogle = debounce((event) => {
  userStore.mySettings.change = true;
  const city = event?.target?.value?.trim();
  if (city !== "") {
    const exist = userStore.mySettings.form.address.places.some(
      (ct) => ct.name.toLowerCase() === city?.toLocaleLowerCase(),
    );
    if (!exist)
      userStore.mySettings.form.address.places.unshift({
        place_id: "",
        name: city,
      });
    cities.value = "";
  }
}, 10);

const inputEvent = (type) => {
  userStore.mySettings.change = true;
  if (type === "city") {
    userStore.mySettings.form.address.city.name = city.value;
    userStore.mySettings.errors.city = false;
  } else if (type === "street") {
    userStore.mySettings.form.address.street = address.value;
    userStore.mySettings.errors.street = false;
  }
};
</script>

<template>
  <div class="personal">
    <div class="personal__card">
      <h2>{{ t(`${moduleDateGeneral}.title`) }}</h2>
      <div class="personal__form">
        <div class="personal__input">
          <span class="u u-user"></span>
          <span class="label">{{ t(`${moduleDateGeneral}.name.label`) }}</span>
          <u-input
            :placeholder="t(`${moduleDateGeneral}.name.placeholder`)"
            v-model="userStore.mySettings.form.data.legalName"
            :error="userStore.mySettings.errors.legalName"
            @input="userStore.mySettings.change = true"
          />
        </div>
        <div class="personal__input">
          <span class="u u-hashtag"></span>
          <span class="label">{{ t(`${moduleDateGeneral}.alias.label`) }}</span>
          <u-input
            :placeholder="t(`${moduleDateGeneral}.alias.placeholder`)"
            v-model="userStore.mySettings.form.data.nickName"
            :error="userStore.mySettings.errors.nickName"
            @input="userStore.mySettings.change = true"
          />
        </div>
        <div class="personal__input">
          <span class="u u-user-type"></span>
          <span class="label">{{ t(`${moduleDateGeneral}.type.label`) }}</span>
          <u-select
            :options="typeSupplierOptions"
            :iconOption="true"
            :icon="getIconForm"
            size="s"
            v-model="userStore.mySettings.form.data.typeName"
            :alert="userStore.mySettings.errors.type ? 'error' : ''"
            :full-data="true"
            :placeholder="t(`${moduleDateGeneral}.type.placeholder`)"
            @full-data="
              (data) => {
                userStore.mySettings.form.data.type = data.value;
                userStore.mySettings.change = true;
              }
            "
            @input="userStore.mySettings.change = true"
          />
        </div>
        <div class="personal__input">
          <span class="u u-id"></span>
          <span class="label">{{
            t(`${moduleDateGeneral}.numberId.label`)
          }}</span>
          <u-input
            :placeholder="t(`${moduleDateGeneral}.numberId.placeholder`)"
            v-model="userStore.mySettings.form.data.idNumber"
            :error="userStore.mySettings.errors.rut"
            @input="userStore.mySettings.change = true"
          />
        </div>
        <div class="personal__input-list">
          <div class="personal__input">
            <span class="u u-role"></span>
            <span class="label">{{
              t(`${moduleDateGeneral}.roles.label`)
            }}</span>
            <u-search
              :placeholder="t(`${moduleDateGeneral}.roles.placeholder`)"
              :loading="loadings.roles"
              :options="results.roles"
              size="s"
              v-model="toSearchRoles"
              :create="canCreateRole"
              @newOption="createRol"
              @cleanInput="toSearchRoles = ''"
              @selectedOption="selectRol"
            />
          </div>
          <div
            class="personal__list"
            v-if="userStore?.mySettings?.form?.roles?.length"
          >
            <u-tags
              v-for="(role, r) in userStore.mySettings.form.roles"
              size="s"
              :key="r"
              :text="role?.name?.[globalStore.lang] || '-'"
              @closeButton="removeRol(r)"
              :delete="true"
            />
          </div>
        </div>
      </div>
    </div>
    <div class="personal__card">
      <h2>{{ t(`${moduleDateContact}.title`) }}</h2>
      <div class="personal__form">
        <div class="personal__inputWithButton">
          <span class="u u-email"></span>
          <span class="label">{{ t(`${moduleDateContact}.email.label`) }}</span>
          <div class="personal__inputWithButton-input">
            <div class="inputWithButtons">
              <u-input
                placeholder="-"
                v-model="userStore.mySettings.form.email"
                :error="userStore.mySettings.errors.email"
                @input="userStore.mySettings.change = true"
                :disabled="true"
              />
              <u-button-icon
                icon="new"
                type="text"
                class="btnInputCustom new"
                :disabled="
                  userStore.mySettings.form.contactMethods.emails.length > 0
                "
                @click="addExtraEmail"
              />
            </div>
          </div>
        </div>
        <div
          v-for="(email, i) in userStore.mySettings.form.contactMethods.emails"
          :key="email.id"
          class="personal__inputWithButton"
        >
          <span class="u u-email"></span>
          <span class="label"
            >{{ t(`${moduleDateContact}.email.label`) }} {{ i + 2 }}</span
          >
          <div class="personal__inputWithButton-input">
            <div class="inputWithButtons">
              <u-input
                v-model="
                  userStore.mySettings.form.contactMethods.emails[i].email
                "
                :placeholder="t(`${moduleDateContact}.email.placeholder2`)"
                :error="userStore.mySettings.errors.email2"
                @input="changeExtraEmail(i)"
              />
              <u-button-icon
                icon="delete"
                type="text"
                color="--danger-text-default"
                color-hover="--danger-surface-darker"
                color-active="--danger-text-subtle"
                class="btnInputCustom delete"
                @click="removeExtraEmail(i)"
              />
            </div>
          </div>
        </div>
        <div class="personal__input">
          <span class="u u-phone"></span>
          <span class="label">{{ t(`${moduleDateContact}.phone.label`) }}</span>
          <u-input-phone
            v-model="userStore.mySettings.form.phone"
            @input="userStore.mySettings.change = true"
          />
          <!-- <u-input
            placeholder="-"
            v-model="userStore.mySettings.form.phone"
            :error="userStore.mySettings.errors.phone"
            @input="userStore.mySettings.change = true"
          /> -->
        </div>
        <div class="personal__input">
          <span class="u u-world"></span>
          <span class="label">{{
            t(`${moduleDateContact}.country.label`)
          }}</span>
          <u-search
            :placeholder="t(`${moduleDateContact}.country.placeholder`)"
            size="s"
            v-model="country"
            :error="userStore.mySettings.errors.country"
            @input="searchCountry"
            :options="options.country"
            :loading="loadings.country"
            @selectedOption="selectedCountry"
            @cleanInput="cleanCountry"
          />
        </div>
        <div class="personal__input">
          <span class="u u-location"></span>
          <span class="label">{{ t(`${moduleDateContact}.city.label`) }}</span>
          <u-search
            v-if="googleMapsAvailable"
            :placeholder="t(`${moduleDateContact}.city.placeholder`)"
            size="s"
            v-model="city"
            :error="userStore.mySettings.errors.city"
            @input="searchCity"
            :options="options.city"
            :loading="loadings.city"
            @selectedOption="selectedCity"
            @cleanInput="cleanCity"
            :disabled="
              userStore.mySettings.form.address.country.short_name === ''
            "
          />
          <u-input
            v-else
            size="s"
            v-model="city"
            :placeholder="t(`${moduleDateContact}.city.placeholder`)"
            :error="userStore.mySettings.errors.city"
            @input="inputEvent('city')"
          />
        </div>
        <div class="personal__input">
          <span class="u u-address"></span>
          <span class="label">{{
            t(`${moduleDateContact}.address.label`)
          }}</span>
          <u-search
            v-if="googleMapsAvailable"
            :placeholder="t(`${moduleDateContact}.address.placeholder`)"
            size="s"
            v-model="address"
            :error="userStore.mySettings.errors.street"
            @input="searchAddress"
            :options="options['address']"
            :loading="loadings.address"
            @selectedOption="selectedAddress"
            @cleanInput="cleanAddress"
            :disabled="
              userStore.mySettings.form.address.country.short_name === ''
            "
          />
          <u-input
            v-else
            :placeholder="t(`${moduleDateContact}.address.placeholder`)"
            size="s"
            v-model="address"
            :error="userStore.mySettings.errors.street"
            @input="inputEvent('street')"
          />
        </div>
        <div class="personal__input-list">
          <div class="personal__input">
            <span class="u u-work"></span>
            <span class="label">{{
              t(`${moduleDateContact}.cities.label`)
            }}</span>
            <u-search
              v-if="googleMapsAvailable"
              :placeholder="t(`${moduleDateContact}.cities.placeholder`)"
              size="s"
              v-model="cities"
              @input="searchCities"
              :options="options.cities"
              :loading="loadings.cities"
              @selectedOption="selectedCities"
              @cleanInput="cleanCities"
              :disabled="
                userStore.mySettings.form.address.country.short_name === ''
              "
            />
            <u-input
              v-else
              placeholder="Ciudades de trabajo - enter para agregar"
              size="s"
              v-model="cities"
              @keyup.enter="
                googleMapsAvailable ? null : selectedCitiesNoGoogle($event)
              "
            />
          </div>
          <div
            class="personal__list"
            v-if="userStore?.mySettings?.form?.address?.places?.length"
          >
            <u-tags
              v-for="(city, c) in userStore.mySettings.form.address.places"
              size="s"
              :key="c"
              :text="city.name"
              @closeButton="removeCities(c)"
              :delete="true"
            />
          </div>
        </div>
      </div>
    </div>
  </div>

  <u-dialog
    :show-modal="showCreateRole"
    @closeModal="hidenModal"
    width="auto"
    height="auto"
    :lockModal="lockModal"
  >
    <MySettingsDialogsCreateRole
      :nameRole="toSearchRoles"
      @closeModal="hidenModal"
      @selectRol="selectRol"
    />
  </u-dialog>
</template>

<style scoped>
.personal {
  display: flex;
  gap: 20px;
}
.personal__card {
  min-width: 440px;
  max-width: 520px;
  width: 50%;
  background-color: var(--neutral-surface-softer);
  border: 1px solid var(--neutral-border-light);
  border-radius: 16px;
  padding: 12px;
  display: flex;
  flex-direction: column;
}
.personal__card h2 {
  font-size: 14px;
  font-weight: 600;
  line-height: 18px;
  color: var(--neutral-text-body);
  margin: 10px 0 20px;
}

/* Form */
.personal__form {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.personal__input {
  background-color: var(--neutral-background-default);
  border-radius: 8px;
  min-height: 40px;
  display: flex;
  padding: 0 10px 0 15px;
  align-items: center;
  gap: 10px;
}
.personal__input .label {
  width: 130px;
}
.personal__input span {
  font-size: 18px;
  line-height: 18px;
  color: var(--neutral-text-caption);
}
.personal__input span:not(.u) {
  font-size: 14px;
  font-weight: 600;
}
.personal__input::v-deep(.containerInput),
.personal__input::v-deep(.containerSearch) {
  width: 100%;
}
.personal__input::v-deep(.containerInput input:not(:hover)),
.personal__input::v-deep(.containerSearch input:not(:hover)) {
  border: var(--neutral-background-default) 1px solid !important;
}
.personal__input::v-deep(.containerSelect .containerSelectInput) {
  border: v-bind(
    "userStore?.mySettings?.errors?.type ? 'var(--bg-danger-500) 1px solid' : 'var(--neutral-background-default) 1px solid'"
  ) !important;
}
.personal__input-list {
  background-color: var(--neutral-background-default);
  border-radius: 8px;
}

/* ===== EMAIL INPUT - Corregido ===== */
.personal__inputWithButton {
  display: flex;
  flex-direction: row; /* era column, ahora row para alinear igual que los demás */
  align-items: center;
  min-height: 40px; /* misma altura que .personal__input */
  gap: 10px;
  padding: 0 10px 0 15px;
  box-sizing: border-box;
  border-radius: 8px;
  background-color: var(--neutral-background-default);
}

.personal__inputWithButton span.u {
  font-size: 18px;
  line-height: 18px;
  color: var(--neutral-text-caption);
}

.personal__inputWithButton .label {
  width: 98px;
  font-size: 14px;
  font-weight: 600;
  color: var(--neutral-text-caption);
  white-space: nowrap;
}

.personal__inputWithButton-input {
  flex-grow: 1;
  display: flex;
  align-items: center;
  justify-content: flex-end;
}

.personal__inputWithButton-input::v-deep(.containerInput),
.personal__inputWithButton-input::v-deep(.containerSearch) {
  width: 100%;
}

/* Quitar borde del input de email */
.personal__inputWithButton::v-deep(.containerInput input:not(:hover)) {
  border: var(--neutral-background-default) 1px solid !important;
}

.inputWithButtons {
  position: relative;
  width: 100%;
  height: 32px;
  display: flex;
  align-items: center;
}

.inputWithButtons::v-deep(.containerSearch) {
  position: absolute;
  top: 0;
}

.inputWithButtons::v-deep(.containerInput input) {
  padding-right: 40px !important;
}

.btnInputCustom {
  position: absolute;
  font-size: 18px;
  top: 0px;
  height: 100%;
  width: 24px;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 0px;
}

.btnInputCustom.new {
  right: 8px;
}

.btnInputCustom.delete {
  right: 8px;
  margin-left: 12px;
}

.personal__list {
  display: flex;
  gap: 2px;
  width: 100%;
  flex-wrap: wrap;
  max-height: 86px;
  overflow-y: auto;
  padding: 10px;
  gap: 10px;
}
.personal__list::-webkit-scrollbar {
  width: 8px;
  height: 8px;
  background: var(--neutral-surface-light);
  border-radius: 20px;
}
.personal__list::-webkit-scrollbar-thumb {
  background: var(--neutral-surface-subtle);
  border-radius: 5px;
}

/* Global */
span,
h2 {
  font-family: Nunito;
  text-align: left;
  text-underline-position: from-font;
  text-decoration-skip-ink: none;
}
</style>
