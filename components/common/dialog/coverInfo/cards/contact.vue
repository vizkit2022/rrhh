<script setup>
import { ref, computed, onMounted } from "vue";
import useOrganizationStore from "@/stores/organization";
import useUserStore from "@/stores/user";
import useGlobalStore from "@/stores/global";
import useContactsStore from "@/stores/contacts";
import {
  regexEmail,
  searchLocationByGoogleMaps,
  testGoogleMapsPlaces,
} from "@/utils/helpers";
import { useI18n } from "vue-i18n";
import { regiones } from "@/utils/constants";

//Traducciones
const { t } = useI18n();
const module = "modules.contacts.modalContacts.infGeneral.cards.contactData";

// STORES
const organizationStore = useOrganizationStore();
const userStore = useUserStore();
const globalStore = useGlobalStore();
const contactStore = useContactsStore();

// CONTANTS
const toSearchCities = ref("");
const results = ref({});
const loadings = ref({});
const stateBtnInputs = ref({});
const stateBtnPhones = ref({});
const hidenAddEmail = ref(true);
const hideAddPhone = ref(true);
const options = ref({});
const country = ref("");
const address = ref("");
const city = ref("");
const cities = ref("");
const countryData = ref({});
const cityData = ref({});
const defaultPrefix = ref("");
const googleMapsAvailable = ref(true);
const region = ref("");
const regionValue = ref("");
const comuna = ref("");
const comunas = computed(() => {
  const regionSelected = regiones.find((reg) => reg.value === regionValue.value);
  return regionSelected?.comunas || [];
});
// COMPUTED
const isEditable = computed(() => {
  if (userStore.dataSheet.disabled) return false;
  return !["edit", "create"].includes(userStore.dataSheet.state);
});
const selectedRegion = (op) => {
  // userStore.getFieldContactByCountry() aun no se esta usando porque solo funcionara en chile
  regionValue.value = op.value;
  comuna.value = "";
  userStore.dataSheet.data.address.extra.region = {
    label: op.label,
    value: op.value,
  };
  userStore.dataSheet.data.address.extra.comuna = {
    label: "",
    value: "",
  };
  userStore.dataSheet.change = true;
};
const selectedComuna = (op) => {
  comuna.value = op.value;
  userStore.dataSheet.data.address.extra.comuna = {
    label: op.label,
    value: op.value,
  };
  userStore.dataSheet.change = true;
};

// Mounted
onMounted(async () => {
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

watch(
  () => userStore.dataSheet?.data?.address,
  (newAddress) => {
    if (!newAddress) return;

    if (!userStore.dataSheet.change) {
      address.value = newAddress.street || "";
      cityData.value = newAddress.city || "";
      city.value = newAddress.city?.name || "";
      countryData.value = newAddress.country || "";
      country.value = newAddress.country?.name || "";
    }

    if (userStore?.dataSheet?.data?.address?.extra?.region?.name) {
      region.value = userStore.dataSheet.data.address.extra.region.name;
      regionValue.value = userStore.dataSheet.data.address.extra.region.value;
    }
    if (userStore?.dataSheet?.data?.address?.extra?.comuna?.name) {
      comuna.value = userStore.dataSheet.data.address.extra.comuna.name;
    }
  },
  { immediate: true, deep: true }, // immediate: se ejecuta al montar, deep: observa propiedades internas
);

// EMAILS
const showBtnInputs = (pos, hideBtn, type = "email") => {
  if (type === "email") stateBtnInputs.value[pos] = hideBtn;
  else stateBtnPhones.value[pos] = hideBtn;
};
const addNewEmail = () => {
  if (userStore.dataSheet.data.contactMethods.emails.length < 3) {
    userStore.dataSheet.data.contactMethods.emails.push("");
  }
};
const deleteEmail = (pos) => {
  userStore.dataSheet.data.contactMethods.emails.splice(pos, 1);
  setTimeout(() => {
    userStore.dataSheet.data.contactMethods.emails.forEach((email, pos) => {
      validEmail(false, pos);
    });
  }, 10);
};
const mapperEmails = (list) => {
  return list.map((item) => {
    return {
      text: item?.data?.legalName || "-",
      label: item?.email || "-",
      oldData: { ...item },
    };
  });
};
const selectedEmail = (op) => {
  const newData = userStore.fillMissingProperties(op.oldData);
  userStore.dataSheet.data = JSON.parse(JSON.stringify(newData));
  userStore.dataSheet.dataOriginal = JSON.parse(JSON.stringify(newData));
  userStore.dataSheet.dataTemp = {};
  userStore.dataSheet.state = "selected";
  userStore.dataSheet.change = true;
  if (op.oldData?.isUser || op.oldData?.user?._id) {
    userStore.dataSheet.disabled = true;
  }
  userStore.dataSheet.errors.email = false;
};

const validEmail = (def = false, posAdditional = 0, email = "") => {
  userStore.dataSheet.change = true;
  const toSearch = def
    ? email
    : (
        userStore.dataSheet.data.contactMethods.emails[posAdditional] || ""
      ).trim();

  const isValidEmail = regexEmail(toSearch);
  const prop = def ? "email" : `email-${posAdditional}`;

  if (toSearch.trim() === "") {
    userStore.dataSheet.errors[prop] = false;
  } else {
    userStore.dataSheet.errors[prop] = !(toSearch !== "" && isValidEmail);
  }
};

function debounce(func, wait) {
  let timeout;
  return function (...args) {
    const context = this;
    clearTimeout(timeout);
    timeout = setTimeout(async () => {
      await func.apply(context, args);
    }, wait);
  };
}

const searchEmail = debounce(async () => {
  userStore.dataSheet.data.email = userStore.dataSheet.data.email.trim();
  const toSearch = userStore.dataSheet.data.email;
  userStore.dataSheet.change = true;

  if (toSearch === "") {
    userStore.dataSheet.errors.email = false;
    validEmail(true, null, toSearch);
  } else {
    try {
      loadings.value.email = true;
      const resp = await userStore.findByUsersByNameOrEmail(
        false,
        true,
        toSearch,
      );

      results.value.emails = mapperEmails(resp);
    } catch (error) {
      results.value.emails = [];
      console.error(error);
    } finally {
      loadings.value.email = false;
      validEmail(true, null, toSearch);
    }
  }
}, 600);

const cleanInputEmail = () => {
  userStore.dataSheet.data.email = "";
  userStore.dataSheet.errors.email = false;
  results.value.emails = [];
};

// Phones
const addNewPhone = () => {
  if (userStore.dataSheet.data.contactMethods.phones.length < 3) {
    userStore.dataSheet.data.contactMethods.phones.push("");
  }
};
const deletePhone = (pos) => {
  userStore.dataSheet.data.contactMethods.phones.splice(pos, 1);
  setTimeout(() => {
    userStore.dataSheet.data.contactMethods.phones.forEach((email, pos) => {
      validPhones(false, pos);
    });
  }, 10);
};

const validPhones = (def = false, posAdditional = 0, email = "") => {};

const msgErrorPhone = (msg, pos) => {
  if (pos !== null) {
    userStore.dataSheet.errors[`phone-${pos}`] = msg !== "";
  } else {
    userStore.dataSheet.errors.phone = msg !== "";
  }
};

// ############### Google Maps
// Country
const searchCountry = debounce(async (pos) => {
  region.value = "";
  comuna.value = "";
  regionValue.value = "";
  userStore.dataSheet.data.address.extra.region = {
    name: "",
    value: "",
  };
  userStore.dataSheet.data.address.extra.comuna = {
    name: "",
    value: "",
  };

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

  userStore.dataSheet.data.address.country = countryData.value;
  userStore.dataSheet.data.address.street = "";
  userStore.dataSheet.data.address.city = cityData.value;
  const toSearch = country.value.trim();
  if (toSearch === "") {
    posDropdown.value = null;
    options.value.country = [];
  } else {
    try {
      userStore.dataSheet.change = true;
      loadings.value.country = true;
      posDropdown.value = pos;
      // SI Funciona GoogleMaps
      if (googleMapsAvailable.value) {
        const config = {
          str: toSearch,
          type: "country",
        };
        options.value.country = await searchLocationByGoogleMaps(config);
      } else {
        options.value.country = options.value.countryOriginal.filter(
          (country) =>
            country.label
              ?.toLocaleLowerCase()
              .includes(toSearch.toLocaleLowerCase()),
        );
      }
    } catch (error) {
      options.value.country = [];
      console.error(error);
    } finally {
      loadings.value.country = false;
    }
  }
}, 10);

const selectedCountry = async (op) => {
  if (googleMapsAvailable.value) {
    const short_name = op.countryCode || "";
    countryData.value = {
      short_name,
      ...op,
    };
  } else {
    countryData.value = {
      short_name: op?.code || "",
      ...op,
    };
  }

  userStore.dataSheet.data.address.country = {
    name: countryData?.value?.label,
    short_name: countryData?.value?.short_name,
    place_id: countryData?.value?.place_id,
  };
  if (userStore?.dataSheet?.data?.phone?.length < 5) {
    defaultPrefix.value = op?.place_id;
  }
  if(op?.countryCode === "CL") {
    userStore.dataSheet.extra = {
      region: true,
      comuna: true,
    };
  }
};

// Address
const searchAddress = debounce(async (pos) => {
  const toSearch = address.value.trim();
  if (toSearch === "") {
    posDropdown.value = null;
    options.value.street_address = [];
  } else {
    try {
      userStore.dataSheet.change = true;

      // SI Funciona GoogleMaps
      if (googleMapsAvailable.value) {
        loadings.value.address = true;
        posDropdown.value = pos;
        const config = {
          str: toSearch,
          type: "street",
          countryCode: countryData.value.short_name,
        };
        const resp = await searchLocationByGoogleMaps(config);
        options.value.address = resp;
      } else {
        // AQUI no hay array de resultados, porque se convertira en un input
        options.value.address = [];
        userStore.dataSheet.data.address.street = address.value;
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
  userStore.dataSheet.data.address.street = op.label;
};

// City
const searchCity = debounce(async (pos) => {
  const toSearch = city.value.trim();
  const obj = {
    name: "",
    place_id: "",
    short_name: "",
  };
  cityData.value = JSON.parse(JSON.stringify(obj));
  userStore.dataSheet.data.address.city = cityData.value;
  if (toSearch === "") {
    posDropdown.value = null;
    options.value.city = [];
  } else {
    try {
      userStore.dataSheet.change = true;

      // SI Funciona GoogleMaps
      if (googleMapsAvailable.value) {
        loadings.value.city = true;
        posDropdown.value = pos;
        const config = {
          str: toSearch,
          type: "city",
          countryCode: countryData.value.short_name,
        };
        options.value.city = await searchLocationByGoogleMaps(config);
      } else {
        // AQUI no hay array de resultados, porque se convertira en un input
        options.value.city = [];
        userStore.dataSheet.data.address.city.name = city.value;
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
  userStore.dataSheet.data.address.city = {
    name: op.label,
    place_id: op.place_id,
  };
};

// Cities
const searchCities = debounce(async (pos) => {
  const toSearch = cities.value.trim();
  if (toSearch === "") {
    posDropdown.value = null;
    options.value.city = [];
  } else {
    try {
      userStore.dataSheet.change = true;

      // SI Funciona GoogleMaps
      if (googleMapsAvailable.value) {
        loadings.value.cities = true;
        posDropdown.value = pos;
        const config = {
          str: toSearch,
          type: "city",
        };
        console.log(config);
        options.value.cities = await searchLocationByGoogleMaps(config);
      } else {
        // AQUI no hay array de resultados, porque se convertira en un input
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
  if (userStore?.dataSheet?.data?.address?.places) {
    const cityExists = userStore.dataSheet.data.address.places.some(
      (existingCity) => existingCity.place_id === op.place_id,
    );
    if (!cityExists) {
      userStore.dataSheet.data.address.places.unshift({
        name: op.label,
        place_id: op.place_id,
      });
      userStore.dataSheet.change = true;
    }
    setTimeout(() => {
      cities.value = "";
    }, 10);
  }
};

const selectedCitiesNoGoogle = debounce((event) => {
  const city = event?.target?.value?.trim()?.toLocaleLowerCase();
  if (city !== "") {
    const exist = userStore.dataSheet.data.address.places.some(
      (ct) => ct.name.toLowerCase() === city,
    );
    if (!exist)
      userStore.dataSheet.data.address.places.unshift({
        place_id: "",
        name: city,
      });
    cities.value = "";
  }
}, 10);

const removeCity = (pos) => {
  userStore.dataSheet.data.address.places.splice(pos, 1);
  userStore.dataSheet.change = true;
};

// Dropdown
const posDropdown = ref(null);
const isBottomDropdown = ref(true);
const goToDropdown = ref(false);

const dropdownClose = async () => {
  if (posDropdown.value === 1) {
    city.value = userStore.dataSheet.data.address.city.name;
  }
  if (posDropdown.value === 2) {
    address.value = userStore.dataSheet.data.address.street;
  }
  if (posDropdown.value === 3) {
    cities.value = "";
  }

  posDropdown.value = null;
  goToDropdown.value = false;
};

const dropdownSelect = async (newValue) => {
  if (posDropdown.value === 0) {
    selectedCountry(newValue);
    country.value = newValue.label;
  }
  if (posDropdown.value === 1) {
    selectedCity(newValue);
    city.value = newValue.label;
  } else if (posDropdown.value === 2) {
    selectedAddress(newValue);
    address.value = newValue.label;
  } else if (posDropdown.value === 3) {
    selectedCities(newValue);
  }

  posDropdown.value = null;
  goToDropdown.value = false;
};

const handleKeyUpInput = (event) => {
  const key = event.key;

  const forbiddenBottom = isBottomDropdown.value && key === "ArrowDown";
  const forbiddenTop = !isBottomDropdown.value && key === "ArrowUp";
  let loading = false;

  if (posDropdown.value === 2) {
    loading = loadings.value.address;
  }

  const forbiddenY = loading && (forbiddenBottom || forbiddenTop);

  if (!forbiddenY) {
    if (
      posDropdown.value !== null &&
      isBottomDropdown.value &&
      ["ArrowUp", "ArrowLeft", "ArrowRight"].includes(key)
    ) {
      posDropdown.value = null;
      goToDropdown.value = false;
    }

    if (
      posDropdown.value !== null &&
      !isBottomDropdown.value &&
      ["ArrowDown", "ArrowLeft", "ArrowRight"].includes(key)
    ) {
      posDropdown.value = null;
      goToDropdown.value = false;
    }

    if (
      posDropdown.value !== null &&
      ((isBottomDropdown.value && key === "ArrowDown") ||
        (!isBottomDropdown.value && key === "ArrowUp"))
    ) {
      goToDropdown.value = true;
    }
  }

  if (key === "Escape") {
    posDropdown.value = null;
    goToDropdown.value = false;
  }
};

const getOptionLabel = computed(() => {
  if (posDropdown.value === 0) {
    return "country";
  }
  if (posDropdown.value === 1) {
    return "city";
  }
  if (posDropdown.value === 2) {
    return "address";
  }
  if (posDropdown.value === 3) return "cities";
});

const getLoadingLabel = computed(() => {
  if (posDropdown.value === 0) {
    return "country";
  }
  if (posDropdown.value === 1) {
    return "city";
  }
  if (posDropdown.value === 2) {
    return "address";
  }
  if (posDropdown.value === 3) return "cities";
});
</script>

<template>
  <div
    class="card"
    v-if="Object.values(userStore.dataSheet.data).length"
    id="card-contact"
  >
    <div class="card__header">
      <h2>{{ t(module + ".title") }}</h2>
    </div>
    <div class="card__list">
      <!-- Correo -->
      <div class="card__item">
        <div class="card__item-sup">
          <span class="u u-email"></span>
          <span class="label">{{ t(module + ".email.label") }}</span>
          <div class="card__item-input">
            <div class="inputWithButtons">
              <template v-if="userStore.dataSheet.state !== 'show'">
                <u-search
                  v-if="userStore.dataSheet.state === 'create'"
                  :placeholder="t(module + '.email.placeholder1')"
                  size="s"
                  v-model="userStore.dataSheet.data.email"
                  :error="userStore.dataSheet.errors.email"
                  :showIconSearch="false"
                  :showIconClean="false"
                  :loading="loadings.email"
                  :onlyAvatarOptions="true"
                  :options="results.emails"
                  :snippet="true"
                  :disabled="isEditable"
                  :showCleanIcon="false"
                  @focus="hidenAddEmail = false"
                  @blur="hidenAddEmail = true"
                  @cleanInput="cleanInputEmail"
                  @input="searchEmail"
                  @selectedOption="selectedEmail"
                />
                <u-input
                  v-else
                  :placeholder="t(module + '.email.placeholder2')"
                  size="s"
                  v-model="userStore.dataSheet.data.email"
                  :error="userStore.dataSheet.errors.email"
                  @input="
                    validEmail(true, null, userStore.dataSheet.data.email)
                  "
                  :disabled="isEditable"
                />
              </template>
              <span v-else class="text truncateText">
                {{ userStore.dataSheet.data.email || "-" }}
              </span>
              <button
                class="btnInputCustom new"
                @click="addNewEmail"
                v-if="hidenAddEmail"
              >
                <span class="u u-new"></span>
              </button>
            </div>
          </div>
        </div>
        <div
          class="card__item-groups"
          v-if="userStore.dataSheet.data.contactMethods.emails.length"
        >
          <div
            class="card__item-sup card__item-group"
            v-for="(email, e) in userStore.dataSheet.data.contactMethods.emails"
            :key="e"
          >
            <span class="u"></span>
            <span class="label"></span>
            <div class="card__item-input">
              <div class="inputWithButtons">
                <u-input
                  :placeholder="t(module + '.email.placeholder3')"
                  size="s"
                  v-model="userStore.dataSheet.data.contactMethods.emails[e]"
                  :error="userStore.dataSheet.errors[`email-${e}`]"
                  @focus="showBtnInputs(e, true)"
                  @blur="showBtnInputs(e, false)"
                  @input="validEmail(false, e)"
                />
                <button
                  class="btnInputCustom delete"
                  v-if="!stateBtnInputs[e]"
                  @click="deleteEmail(e)"
                >
                  <span class="u u-delete"></span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      <!-- Teléfono -->
      <div class="card__item">
        <div class="card__item-sup">
          <span class="u u-phone"></span>
          <span class="label">{{ t(module + ".phone.label") }}</span>
          <div class="card__item-input">
            <div class="inputWithButtons">
              <template v-if="userStore.dataSheet.state !== 'show'">
                <u-input-phone
                  :placeholder="t(module + '.phone.placeholder')"
                  size="s"
                  v-model="userStore.dataSheet.data.phone"
                  :error="userStore.dataSheet.errors.phone"
                  @focus="hideAddPhone = false"
                  @blur="hideAddPhone = true"
                  @input="userStore.dataSheet.change = true"
                  @msgError="(msg) => msgErrorPhone(msg, null)"
                  :selectedPlaceId="defaultPrefix"
                  :disabled="isEditable"
                />
              </template>
              <span v-else class="text truncateText">{{
                userStore.dataSheet.data.phone || "-"
              }}</span>
              <button
                class="btnInputCustom new"
                @click="addNewPhone"
                v-if="hideAddPhone"
              >
                <span class="u u-new"></span>
              </button>
            </div>
          </div>
        </div>
        <div
          class="card__item-groups"
          v-if="userStore.dataSheet.data.contactMethods.phones.length"
        >
          <div
            class="card__item-sup card__item-group"
            v-for="(phone, p) in userStore.dataSheet.data.contactMethods.phones"
            :key="p"
          >
            <span class="u"></span>
            <span class="label"></span>
            <div class="card__item-input">
              <div class="inputWithButtons">
                <u-input-phone
                  :placeholder="t(module + '.phone.placeholder2')"
                  size="s"
                  v-model="userStore.dataSheet.data.contactMethods.phones[p]"
                  :error="userStore.dataSheet.errors[`phone-${p}`]"
                  @focus="showBtnInputs(p, true, 'phone')"
                  @blur="showBtnInputs(p, false, 'phone')"
                  @msgError="(msg) => msgErrorPhone(msg, p)"
                  @input="userStore.dataSheet.change = true"
                />
                <button
                  class="btnInputCustom delete"
                  v-if="!stateBtnPhones[p]"
                  @click="deletePhone(p)"
                >
                  <span class="u u-delete"></span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      <!-- País -->
      <div class="card__item">
        <div class="card__item-sup">
          <span class="u u-world"></span>
          <span class="label">{{ t(module + ".country.label") }}</span>
          <div class="card__item-input">
            <template v-if="userStore.dataSheet.state !== 'show'">
              <u-input
                autocomplete="off"
                id="row-contact-purchase-0"
                :placeholder="t(module + '.country.placeholder')"
                size="s"
                v-model="country"
                :error="userStore.dataSheet.errors.country"
                @input="searchCountry(0)"
                @keydown="handleKeyUpInput($event)"
              />
            </template>
            <span v-else class="text truncateText">{{ country || "-" }}</span>
          </div>
        </div>
      </div>
      <!-- Ciudad -->
      <div class="card__item">
        <div class="card__item-sup">
          <span class="u u-location"></span>
          <span class="label">{{ t(module + ".city.label") }}</span>
          <div class="card__item-input">
            <template v-if="userStore.dataSheet.state !== 'show'">
              <u-input
                id="row-contact-purchase-1"
                :placeholder="t(module + '.city.placeholder')"
                size="s"
                v-model="city"
                :error="userStore.dataSheet.errors.city"
                @input="searchCity(1)"
                :disabled="
                  userStore.dataSheet.data.address.country.place_id === ''
                "
                @keydown="handleKeyUpInput($event)"
              />
            </template>
            <span v-else class="text truncateText">{{
              city?.name || "-"
            }}</span>
          </div>
        </div>
      </div>
      <!-- Dirección -->
      <div class="card__item">
        <div class="card__item-sup">
          <span class="u u-address"></span>
          <span class="label">{{ t(module + ".address.label") }}</span>
          <div class="card__item-input">
            <template v-if="userStore.dataSheet.state !== 'show'">
              <u-input
                id="row-contact-purchase-2"
                :placeholder="t(module + '.address.placeholder')"
                size="s"
                v-model="address"
                :error="userStore.dataSheet.errors.address"
                @input="searchAddress(2)"
                :disabled="
                  userStore.dataSheet.data.address.country.place_id === ''
                "
                @keydown="handleKeyUpInput($event)"
              />
            </template>
            <span v-else class="text truncateText">{{ address || "-" }}</span>
          </div>
        </div>
      </div>
      <!-- Ciudades -->
      <div class="card__item">
        <div class="card__item-sup">
          <span class="u u-work"></span>
          <span class="label">{{ t(module + ".cities.label") }}</span>
          <div class="card__item-input">
            <u-input
              id="row-contact-purchase-3"
              :placeholder="t(module + '.cities.placeholder')"
              size="s"
              v-model="cities"
              :error="userStore.dataSheet.errors.cities"
              @input="searchCities(3)"
              @keydown="handleKeyUpInput($event)"
              @keyup.enter="
                googleMapsAvailable ? null : selectedCitiesNoGoogle($event)
              "
            />
          </div>
        </div>
        <div
          class="card__item-inf"
          v-if="userStore?.dataSheet?.data?.address?.places?.length"
        >
          <u-tags
            v-for="(city, c) in userStore.dataSheet.data.address.places"
            size="s"
            :key="c"
            :text="city.name"
            @closeButton="removeCity(c)"
            :delete="true"
          />
        </div>
      </div>

      <!-- Región -->
      <div class="card__item" v-if="userStore?.dataSheet?.extra?.region && countryData.short_name === 'CL'">
        <div class="card__item-sup">
          <span class="u u-address"></span>
          <span class="label">{{ t(module + ".region.label") }}</span>
          <div class="card__item-input">
            <template v-if="userStore.dataSheet.state !== 'show'">
              <!-- v-model="userStore?.dataSheet?.data?.address?.region" -->
              <u-select
                v-model="region"
                :placeholder="t(module + '.region.placeholder')"
                :options="regiones"
                :fullData="true"
                @fullData="selectedRegion"
                :disabled="countryData.short_name !== 'CL'"
              />
            </template>
            <span v-else class="text truncateText">{{
              userStore.dataSheet?.data?.address?.extra?.region?.name || "-"
            }}</span>
          </div>
        </div>
      </div>
      <!-- Comuna -->
      <div class="card__item" v-if="userStore?.dataSheet?.extra?.comuna && countryData.short_name === 'CL'">
        <div class="card__item-sup">
          <span class="u u-address"></span>
          <span class="label">{{ t(module + ".comuna.label") }}</span>
          <div class="card__item-input">
            <template v-if="userStore.dataSheet.state !== 'show'">
              <!-- v-model="userStore.dataSheet?.data?.address?.extra?.comuna?.name" -->
              <u-select
                v-model="comuna"
                :placeholder="t(module + '.comuna.placeholder')"
                :options="comunas"
                :top="true"
                :fullData="true"
                @fullData="selectedComuna"
                :disabled="countryData.short_name !== 'CL'"
              />
            </template>
            <span v-else class="text truncateText">{{
              userStore.dataSheet?.data?.address?.extra?.comuna?.name || "-"
            }}</span>
          </div>
        </div>
      </div>
    </div>
    <u-dropdown
      v-if="![null, undefined].includes(posDropdown)"
      :idParent="`#row-contact-purchase-${posDropdown}`"
      idContainer="card-contact"
      maxheihtContent="128px"
      :customOptionStyle="true"
      :loading="loadings[getLoadingLabel]"
      :list="options[getOptionLabel]"
      widthParent="400px"
      :goToDropdown="goToDropdown"
      @isBottomDropdown="(isBottom) => (isBottomDropdown = !isBottom)"
      @dropdownSelect="dropdownSelect"
      @dropdownClose="dropdownClose"
    >
      <template v-slot:cell="item">
        <div class="searchItem">
          <span>{{ item.item.label }}</span>
        </div>
      </template>
    </u-dropdown>
  </div>
</template>

<style scoped>
/* Contenedor */
.card {
  background-color: var(--neutral-surface-softer);
  display: flex;
  flex-direction: column;
  gap: 10px;
  border-radius: 16px;
  padding: 12px;
  position: relative;
}

/* Item - buscador */
.searchItem {
  font-size: 14px;
  line-height: 16px;
  text-align: start;
  color: var(--neutral-text-body);
}

/* Header */
.card__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 36px;
}

.card h2 {
  font-size: 14px;
  font-weight: 600;
  line-height: 18px;
  text-align: left;
  color: var(--neutral-text-body);
}

.card__header::v-deep(.btn) {
  transform: scale(0.8);
  border: transparent;
}

/* List */
.card__list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  overflow-y: auto;
  height: 100%;
  padding-right: 2px;
}

.card__list::-webkit-scrollbar,
.card__item-inf::-webkit-scrollbar {
  width: 8px;
  height: 8px;
  background: var(--neutral-surface-light);
  border-radius: 20px;
}

.card__list::-webkit-scrollbar-thumb,
.card__item-inf::-webkit-scrollbar-thumb {
  background: var(--neutral-surface-subtle);
  border-radius: 5px;
}

/* Item */
.card__item {
  display: flex;
  flex-direction: column;
  gap: 5px;
  padding: 0 8px 0 10px;
  box-sizing: border-box;
  border-radius: 8px;
  background-color: var(--neutral-background-default);
}

.card__item-sup {
  display: flex;
  align-items: center;
  gap: 16px;
  height: 48px;
}

.card__item-inf {
  display: flex;
  gap: 2px;
  width: 100%;
  flex-wrap: wrap;
  max-height: 78px;
  overflow-y: auto;
  margin-bottom: 10px;
}

.card__item-groups {
  padding-bottom: 8px;
  margin-top: -8px;
}

.card__item-group {
  height: 40px;
}

.card__item span.u {
  width: 8px;
  color: var(--neutral-text-caption);
  font-size: 16px;
  line-height: 16px;
  padding-top: -1px;
}

.card__item span.label {
  width: 60px;
  font-size: 12px;
  font-weight: 600;
  line-height: 12px;
  text-align: left;
  color: var(--neutral-text-caption);
}

.card__item span.text {
  width: 100%;
  font-size: 14px;
  font-weight: 600;
  line-height: 18px;
  text-align: left;
  color: var(--neutral-text-caption);
  padding-left: 12px;
}

.card__item span.textDisabled {
  font-weight: 400;
  color: var(--bg-neutral-400);
}

.card__item-input {
  flex-grow: 1;
  width: 220px;
  display: flex;
  align-items: center;
  justify-content: flex-end;
}

.card__item-input::v-deep(.containerInput),
.card__item-input::v-deep(.containerSearch) {
  width: 100%;
}

/* Inputs */
/* Ajuste de padding para inputs con botón "new" (principal) */
.card__item-sup .inputWithButtons::v-deep(.containerSearch input:not(:focus)),
.card__item-sup .inputWithButtons::v-deep(.containerSearch input:not(:active)),
.card__item-sup .inputWithButtons::v-deep(.containerInput input:not(:focus)),
.card__item-sup .inputWithButtons::v-deep(.containerInput input:not(:active)) {
  padding-right: 35px;
}

.card__item-sup .inputWithButtons::v-deep(.containerSearch input:focus),
.card__item-sup .inputWithButtons::v-deep(.containerSearch input:active),
.card__item-sup .inputWithButtons::v-deep(.containerInput input:focus),
.card__item-sup .inputWithButtons::v-deep(.containerInput input:active) {
  padding-right: 14px !important;
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
.inputWithButtons::v-deep(.containerSearch input),
.inputWithButtons::v-deep(.containerInput input),
.card__item-groups .inputWithButtons::v-deep(.containerSearch input),
.card__item-groups .inputWithButtons::v-deep(.containerInput input),
.card__item-input::v-deep(.containerSearch input),
.card__item-input::v-deep(.containerInput input) {
  border: var(--neutral-background-default) 1px solid !important;
}
.card__item-groups .inputWithButtons::v-deep(.containerSearch input:focus),
.card__item-groups .inputWithButtons::v-deep(.containerSearch input:active),
.card__item-groups .inputWithButtons::v-deep(.containerInput input:focus),
.card__item-groups .inputWithButtons::v-deep(.containerInput input:active) {
  padding-right: 14px !important;
}
.card__item-groups
  .inputWithButtons::v-deep(.containerSearch input:not(:focus)),
.card__item-groups
  .inputWithButtons::v-deep(.containerSearch input:not(:active)),
.card__item-groups .inputWithButtons::v-deep(.containerInput input:not(:focus)),
.card__item-groups
  .inputWithButtons::v-deep(.containerInput input:not(:active)) {
  padding-right: 35px;
}

.inputWithButtons .btnInputCustom {
  position: absolute;
  font-size: 18px;
  top: 0px; /* (32 - 18)/2  */
  height: 100%;
  width: 24px;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 0px;
}

.inputWithButtons .btnInputCustom.btnInputCustom.delete,
.inputWithButtons .btnInputCustom.new {
  right: 8px;
}

.inputWithButtons .btnInputCustom span {
  width: 24px;
  transition: 0.3s;
}

.inputWithButtons .btnInputCustom.new span {
  color: var(--primary-text-default);
}
.inputWithButtons .btnInputCustom.delete span {
  color: var(--danger-text-default);
}

.inputWithButtons .btnInputCustom.new:hover span {
  color: var(--primary-text-subtle);
}
.inputWithButtons .btnInputCustom.delete:hover span {
  color: var(--danger-text-subtle);
}

/* Global */
h2,
span {
  font-family: Nunito;
}
</style>
