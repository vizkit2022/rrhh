<script setup>
import { ref, onMounted, watch } from "vue";
import useWizardStore from "@/stores/wizard";
import useUserStore from "@/stores/user";
import useGlobalStore from "@/stores/global";
import { debounce, searchLocationByGoogleMaps, testGoogleMapsPlaces } from "@/utils/helpers";

  
// STORES
const wizardStore = useWizardStore();
const userStore = useUserStore();
const globalStore = useGlobalStore();
  
// Constants
const { t } = useI18n();
const module = "modules.wizard.steps.placesToWork";
const button = "modules.wizard.buttons";

// Variables
const loading = ref(false);
const options = ref([]);
const data = ref({
  city: { name: "", place_id: "" },
  cities: [],
});
const googleMapsAvailable = ref(true);

const inputs = ref([
  {
    prop: "city",
    label: "",
    placeholder: t(module + ".inputs.city.placeholder"),
    additional: t(module + ".inputs.city.additionalPlaceholder"),
    error: false,
  },
]);

// Funciones
const nextStep = () => {
  wizardStore.data.cities = data.value.cities;
  wizardStore.step = 4;
  wizardStore.oldStep = 3;
};
const backStep = () => {
  wizardStore.data.cities = [];
  wizardStore.step = 2;
  wizardStore.oldStep = 1;
};
const removeCity = (pos) => {
  data.value.cities.splice(pos, 1);
};

const addCity = (selectedOption) => {
  if (
    selectedOption &&
    !data.value.cities.some((city) => city.name === selectedOption.label)
  ) {
    
    data.value.cities.push({
      name: selectedOption.label,
      place_id: selectedOption.place_id,
    });
    data.value.city = { name: "", place_id: "" }; 
    
  }
};

const addCityNoGoogleMaps = debounce(() => {
  const name = JSON.parse(JSON.stringify(data.value.city.name.trim().toLocaleLowerCase()));
  if(name.trim() !== "") {
    const exist = data.value.cities.some(city => city.name.toLowerCase() === name);
    if(!exist) data.value.cities.unshift({ place_id: "", name: data.value.city.name });
    data.value.city.name = "";
  } 
}, 10);

// Mounted
onMounted(async () => {
  googleMapsAvailable.value = await testGoogleMapsPlaces();

  //loadGoogleMapsApi();
  if (userStore?.userSession && Object.values(userStore.userSession).length) {
    data.value.cities = userStore.userSession.address.places;
  }
});

const searchCities = debounce(async (event) => {
  const toSearch = event.target.value.trim();
  if (toSearch !== 0) {
    try {
      loading.value = true;
      // Si Google Maps funciona
      if(googleMapsAvailable.value) {
        const config = {
          str: toSearch,
          type: "city",
        }
        options.value = await await searchLocationByGoogleMaps(config);
      } 
      // No Funciona Google Mpas
      else {
        // Cambiaremos el u-search por u-input, por eso su options esta vacio, porque no se usará
        options.value = [];
      };
    } catch (error) {
      options.value = [];
      console.error(error);
    } finally {
      loading.value = false;
    }
  }
}, 10);
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
          <p class="subtitle body-l-r">{{ t(module + ".text") }}<br/>{{ t(module + ".text2") }}</p>
          <div class="form">
            <div class="groupInput" v-for="input in inputs" :key="input.prop">
              <label>{{ input.label }}</label>
              <u-search
                v-if="googleMapsAvailable"
                v-model="data[input.prop].name"
                :placeholder="input.placeholder"
                :options="options"
                :loading="loading"
                :updated="false"
                @input="searchCities"
                @cleanInput="data[input.prop].name= '';data[input.prop].place_id = ''"
                @selectedOption="addCity"
              />
              <u-input v-else v-model="data[input.prop].name" :placeholder="input.placeholder + input.additional" @keyup.enter="addCityNoGoogleMaps" />
              <div class="containerPage__tags" v-if="data?.cities?.length">
                <u-tags
                  v-for="(oneCity, i) in data.cities"
                  :key="oneCity.i"
                  :text="oneCity.name"
                  @closeButton="removeCity(i)"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
      <div class="actions">
        <u-button
          size="xl"
          :text="t(button + '.back')"
          type="text"
          @action-btn="backStep"
        ></u-button>
        <u-button
          size="xl"
          :text="t(button + '.next')"
          @action-btn="nextStep"
          style="width: 200px"
        ></u-button>
      </div>
    </div>
    <img class="containerPage__img" :src="`/img/location${globalStore.isDark ? '-dark' : ''}.svg`" alt="Vector company" />
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
    0%, 5% {
      opacity: 0;
    } 100% {
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
  width: 420px;
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
}
.subtitle {
  text-align: left;
  color: var(--neutral-text-caption);
  line-height: 20px !important;
}
.groupInput {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 16px;
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
.form::-webkit-scrollbar {
  width: 5px;
}

.form::-webkit-scrollbar-thumb {
  background: var(--bg-neutral-300);
  border-radius: 8px;
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
.containerPage__tags {
  display: flex;
  align-items: flex-start;
  align-self: flex-start;
  flex-wrap: wrap;
  column-gap: 10px;
  row-gap: 5px;
  overflow-y: auto;
  max-height: 320px;
  padding: 0 0 0 20px;
  margin-right: 20px;
}
.containerPage__tags::-webkit-scrollbar {
  width: 5px;
  height: 5px;
}

.containerPage__tags::-webkit-scrollbar-thumb {
  border-radius: 3px;
  background-color: var(--bg-neutral-300);
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
