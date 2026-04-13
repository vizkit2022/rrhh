<script setup>
import { ref, defineEmits, computed, defineProps, onMounted } from "vue";
import {
  capitalizeFirstLetter,
  onlyNumbersAndLetters,
  debounce,
} from "@/utils/helpers";
import { itemsByCategory } from "@/utils/configTables/catalog.json";

import useGlobalStore from "@/stores/global";
import useCatalogStore from "@/stores/catalog";

  
// STORES
const globalStore = useGlobalStore();
const catalogStore = useCatalogStore();

// PROPS
const props = defineProps({
  id: {
    type: String,
    default: "",
  },
});

// Emits
const emit = defineEmits(["closeModal"]);

// Constants
const mainColor = "--bg-neutral-500";
const secondColor = "--bg-neutral-600";
const { t } = useI18n();
const mainLabel = computed(() => "modules.catalog.tabs.tab2.modals.create");
const form = ref({
  name: "",
  code: "",
  description: "",
  observation: "",
});
const search = ref("");
const errors = ref({});
const tabSelected = ref(0);
const loadingItem = ref(false);
const ids = ref([]);
const tabs = computed(() => {
  let tabs = [
    {
      label: t(`${mainLabel.value}.tabs.tab1.label`),
      icon: "",
      tab: 0,
      indicator: false,
      disabled: false,
      main: false,
    },
  ];
  if (props.id) {
    tabs.push({
      label: t(`${mainLabel.value}.tabs.tab2.label`),
      icon: "",
      tab: 1,
      indicator: false,
      disabled: false,
      main: false,
    });
  }

  return tabs;
});

// Actions
const verifyName = () => {
  form.value.name = capitalizeFirstLetter(form.value.name);
};

const createCategory = async () => {
  try {
    globalStore.loading = true;

    if (props.id) {
      await catalogStore.updateItem({ ...form.value, _id: props.id });

      const body = { items: ids.value, category: props.id };
      await catalogStore.removeItemsToCategory(body);
    } else {
      await catalogStore.createItem({ ...form.value, isParent: true });
    }

    catalogStore.page = 1;
    catalogStore.nextPage = 2;
    await catalogStore.getItemsGroups();

    emit("closeModal");
  } catch (error) {
    console.error(error);
  } finally {
    globalStore.loading = false;
  }
};

const defaultName = computed(() => {
  return props.id
    ? t(`${mainLabel.value}.title2`)
    : t(`${mainLabel.value}.title`);
});

// Mounted
onMounted(async () => {
  if (props.id) {
    try {
      globalStore.loading = true;
      const resp = await catalogStore.getItemById(props.id);
      form.value = catalogStore.basicFormattingItem(resp);

      catalogStore.page = 1;
      catalogStore.nextPage = 2;
      await catalogStore.getItemsWithPaginate(props.id);
    } catch (error) {
      console.error(error);
    } finally {
      globalStore.loading = false;
    }
  }
});

// Computed
const validFormItem = computed(() => {
  return form.value.name.trim() !== "" && form.value.code.trim() !== "";
});

const searhItemByCategory = debounce(async (event) => {
  const toSearch = event.target.value.trim();
  loadingItem.value = true;
  if (toSearch === "") {
    catalogStore.page = 1;
    catalogStore.nextPage = 2;
    loadingItem.value = true;
    await catalogStore.getItemsWithPaginate(props.id);
  } else {
    await catalogStore.findItem(toSearch, "items", props.id);
  }
  filterItems();
  loadingItem.value = false;
}, 10);

const deleteItem = (objToRemove) => {
  const index = catalogStore.items.findIndex(
    (item) => item._id === objToRemove._id
  );

  if (index !== -1) {
    catalogStore.items = catalogStore.items.filter(
      (item) => item._id !== objToRemove._id
    );
    ids.value.push(objToRemove._id);
  }
};

const filterItems = () => {
  if (ids.value.length) {
    let itemsFilter = [];
    catalogStore.items.forEach((item) => {
      if (!ids.value.includes(item._id)) {
        itemsFilter.push(item);
      }
    });
    catalogStore.items = itemsFilter;
  }
};
</script>

<template>
  <div class="createCategory">
    <div class="createCategory__title space-between">
      <span>{{ form.name || defaultName }}</span>
      <u-button-icon
        icon="close"
        class="btnIconModify"
        type="outlined"
        :color="mainColor"
        :colorActive="secondColor"
        :colorHover="secondColor"
        @click="emit('closeModal')"
      />
    </div>
    <u-tabs class="createCategory__tabs" :tabs="tabs" v-model="tabSelected" />
    <div class="createCategory__container">
      <template v-if="tabSelected === 0">
        <div class="createCategory__container-group">
          <div class="createCategory__container-group-div">
            <span class="u u-user"></span>
          </div>
          <div class="createCategory__container-group-div">
            <span
              v-text="$t(`${mainLabel}.tabs.tab1.inputs.name.label`)"
            ></span>
          </div>
          <u-input
            v-model="form.name"
            :placeholder="$t(`${mainLabel}.tabs.tab1.inputs.name.placeholder`)"
            size="s"
            :error="errors.name"
            @input="verifyName"
          />
        </div>
        <div class="createCategory__container-group">
          <div class="createCategory__container-group-div">
            <span class="u u-user"></span>
          </div>
          <div class="createCategory__container-group-div">
            <span
              v-text="$t(`${mainLabel}.tabs.tab1.inputs.code.label`)"
            ></span>
          </div>
          <u-input
            v-model="form.code"
            :placeholder="$t(`${mainLabel}.tabs.tab1.inputs.code.placeholder`)"
            size="s"
            :error="errors.code"
            @input="form.code = onlyNumbersAndLetters(form.code)"
          />
        </div>
        <div class="createCategory__container-group">
          <div class="createCategory__container-group-div">
            <span class="u u-star"></span>
          </div>
          <div class="createCategory__container-group-div">
            <span
              v-text="$t(`${mainLabel}.tabs.tab1.inputs.description.label`)"
            ></span>
          </div>
          <u-textarea
            v-model="form.description"
            class="textareaCustom"
            :placeholder="
              $t(`${mainLabel}.tabs.tab1.inputs.description.placeholder`)
            "
          />
        </div>
        <div class="createCategory__container-group">
          <div class="createCategory__container-group-div">
            <span class="u u-star"></span>
          </div>
          <div class="createCategory__container-group-div">
            <span
              v-text="$t(`${mainLabel}.tabs.tab1.inputs.observation.label`)"
            ></span>
          </div>
          <u-textarea
            v-model="form.observation"
            class="textareaCustom"
            :placeholder="
              $t(`${mainLabel}.tabs.tab1.inputs.observation.placeholder`)
            "
          />
        </div>
      </template>
      <template v-if="tabSelected === 1">
        <u-input
          v-model="search"
          size="s"
          placeholder="Buscar Item..."
          @input="searhItemByCategory($event)"
        />
        <div class="list">
          <TableBasic
            :configTable="itemsByCategory"
            :content="catalogStore.items"
            :loading="loadingItem"
          >
            <template v-slot:action="item">
              <u-button-icon
                icon="close"
                @click="deleteItem(item.item)"
                type="text"
              />
            </template>
          </TableBasic>
        </div>
      </template>
    </div>
    <div class="createCategory__actions space-between">
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
        @click="createCategory"
        :disabled="!validFormItem"
      />
    </div>
  </div>
</template>

<style scoped>
.createCategory {
  width: 720px;
  height: 80vh;
  max-height: 720px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.createCategory__title {
  height: 40px;
}

.createCategory__title span {
  font-size: 16px;
  font-weight: 600;
  line-height: 20px;
  text-align: left;
  color: var(--neutral-text-body);
}

.createCategory__tabs {
  height: 32px;
}
.createCategory__container {
  flex-grow: 1;
  overflow-y: auto;
}
.createCategory__container::-webkit-scrollbar {
  width: 8px;
  background: var(--neutral-surface-light);
  border-radius: 20px;
}
.createCategory__container::-webkit-scrollbar-thumb {
  background: var(--neutral-surface-subtle);
  border-radius: 5px;
}
.createCategory__actions {
  height: 32px;
}

.list {
  height: 480px;
}

/* Container */
.createCategory__container {
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding: 10px 20px 0px;
  box-sizing: border-box;
}
.createCategory__container-group {
  display: grid;
  grid-template-columns: 16px 150px 1fr;
  gap: 10px;
}
.createCategory__container-group-div {
  height: 32px;
  display: flex;
  align-items: center;
}
.createCategory__container-group span {
  font-size: 14px;
  font-weight: 600;
  line-height: 18px;
  color: var(--neutral-text-caption);
}
.createCategory__container-group-div .u {
  font-size: 16px;
  font-weight: 400;
  line-height: 16px;
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

.list__items ::v-deep(.btn) {
  border: 1px solid transparent !important;
}

.btnAction {
  width: 120px;
}

.textareaCustom {
  height: 150px;
}

span {
  font-family: Nunito;
}

@media only screen and (max-width: 768px) {
  .createCategory {
    width: calc(100vw - 40px);
    height: calc(100vh - 40px);
    max-height: 1400px;
  }
  .list {
    height: calc((100vh - 280px));
  }
}
</style>
