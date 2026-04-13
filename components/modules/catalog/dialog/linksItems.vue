<script setup>
import { ref, defineEmits, computed, onMounted, defineProps, onUnmounted } from "vue";

  
import useGlobalStore from "@/stores/global";
import useUserStore from "@/stores/user";
import useCatalogStore from "@/stores/catalog";
import useOrganizationStore from "@/stores/organization";

// STORES
const globalStore = useGlobalStore();
const userStore = useUserStore();
const catalogStore = useCatalogStore();
const organizationStore = useOrganizationStore();

// PROPS
const props = defineProps({
  items: {
    type: Array,
    default: () => [],
  },
});

// Emits
const emit = defineEmits(["closeModal"]);

// Constants
const { t } = useI18n();
const mainLabel = computed(() => ("modules.catalog.tabs.tab1.modals.links"));
const mainColor = "--neutral-text-caption";
const search = ref("");
const category = ref({});
const loading = ref(false);
const results = ref([]);
const change = ref(false);

// Actions
const findCategory = debounce(async (event) => {
  const toSearch = search.value.trim();

  loading.value = true;

  if (toSearch === "") {
    results.value = [];
  } else {
    catalogStore.page = 1;
    catalogStore.nextPage = 20;
    await catalogStore.findItem(toSearch, "groups");
    results.value = mapperCategories(catalogStore.groups);
  }
  loading.value = false;
}, 10);

const mapperCategories = (list) => {
  return list.map((l) => ({
    label: l.name,
    _id: l._id,
    oldData: { ...l },
  }));
};

const selectedCategory = (op) => {
  category.value = op;
};

const clean = () => {
    results.value = [];
    search.value = "";
    category.value = {};
};

const validForm = computed(() => {
  return Object.keys(category.value).length === 0;
});

const group = async () => {
  const items = props.items.map(item => (item._id));
  const body = { items, category: category.value._id };

  try {
    globalStore.loading = true;
    await catalogStore.groupItemsToCategory(body);
    change.value = true;
  } catch (error) {
    console.error(error);
  } finally {
    emit("closeModal");
  }
}

onUnmounted(async () => {
  if (change.value) {
    try {
      globalStore.loading = true;
      await catalogStore.getItemsWithPaginate();
    } catch (error) {
      console.error(error);
    } finally {
      globalStore.loading = false;
      change.value = false;
    }
  }
});

</script>

<template>
  <div class="linksItems">
    <div class="linksItems__title space-between">
      <span v-text="$t(`${mainLabel}.title`)"></span>
      <u-button-icon
        icon="close"
        class="btnIconModify"
        type="outlined"
        :color="mainColor"
        @click="emit('closeModal')"
      />
    </div>
    <div class="linksItems__body">
        <img src="https://cdn-icons-gif.flaticon.com/11237/11237442.gif" alt="link">
        <span class="body-2xl-r subtitle" v-text="$t(`${mainLabel}.subtitle`, { count: props.items.length })"></span>
        <u-search v-model="search" class="search" :placeholder="$t(`${mainLabel}.inputs.category.placeholder`)" :showSearchIcon="true"
              @input="findCategory"
              :loading="loading"
              :options="results"
              @selectedOption="selectedCategory"
              @cleanInput="clean" />
        <div class="linksItems__info">
            <span class="u u-info-outlined"></span>
            <span v-text="$t(`${mainLabel}.text`)" class="body-m-r"></span>
        </div>
    </div>
    <div class="linksItems__actions space-between">
      <u-button
        :text="$t(`${mainLabel}.buttons.button1.label`)"
        type="outlined"
        size="s"
        class="btnAction"
        @click="emit('closeModal')"
      />
      <u-button
        :text="$t(`${mainLabel}.buttons.button2.label`)"
        size="s"
        class="btnAction"
        @click="group" 
        :disabled="validForm"
      />
    </div>
  </div>
</template>

<style scoped>
.linksItems {
  width: 450px;
  height: 600px;
  display: grid;
  grid-template-rows: 40px 1fr 40px;
}

.linksItems__title {
  height: 40px;
}

.linksItems__title span {
  font-size: 16px;
  font-weight: 600;
  line-height: 20px;
  text-align: left;
  color: var(--neutral-text-body);
}

.linksItems__body {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 16px;
    padding-bottom: 80px;
}
.linksItems__body img {
    height: 64px;
    width: 64px;
}
.linksItems__body .search {
    width: 100%;
    margin: 24px 0;
}
.subtitle {
    margin: 0px 24px;
    text-align: center;
    line-height: 32px;
    color: var(--neutral-text-body);
}
.linksItems__info {
    display: grid;
    grid-template-columns: auto 1fr;
    gap: 24px;
}
.linksItems__info .u {
    font-size: 24px;
    color: var(--info-text-default);
}
.linksItems__info span:not(.u) {
    color: var(--neutral-text-caption);
}

/* Global Styles */
.space-between {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.btnIconModify {
  border-radius: 50%;
}

.btnAction {
  width: 140px;
}

.textareaCustom {
  height: 150px;
}

span {
  font-family: Nunito;
}
</style>
