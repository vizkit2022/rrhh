<script setup>
import useGlobalStore from "@/stores/global";
import { ref } from "vue";
import { useI18n } from "vue-i18n";
import { removeExtraSpaces, capitalizeFirstLetter } from "@/utils/helpers";
import useIncomesStore from "@/stores/incomes";

// Stores
const globalStore = useGlobalStore();
const incomesStore = useIncomesStore();
const { params } = useRoute();
// Constants
const { t } = useI18n();
const module = "filters.actions.applied";
const color = "--neutral-text-caption";
const bgCustom = "--secondary-surface-light";
const colorCustom = "--secondary-text-darker";
const bgCustomMain = "--info-surface-light";
const colorCustomMain = "--info-text-darker";
const filterName = ref("");
const idIncome = params && params.id ? params.id : null;
// Computed
const textBtn = computed(() => {
  const label = globalStore.savingFilter ? "secondLabel" : "label";
  return t(`${module}.buttons.save.${label}`);
});
const invalidForm = computed(() => filterName.value.trim() === "");
const filterCustom = computed(() => {
  const filter = globalStore.filtersCustoms?.find((filter) => filter.active);
  return filter || {};
});

// Functions
const getText = (filter, option) => {
  const prop = filter.prop;
  const val = option.value;

  if (prop && val) {
    return t(`filters.${prop}.options.${val}.label`);
  }

  //if(prop === "user") return option?.data?.legalName || "-"
  if (typeof prop === "string") return option?.data?.legalName || "-";
  return "";
};

const saveFilter = async () => {
  try {
    globalStore.savingFilter = true;
    filterName.value = removeExtraSpaces(filterName.value);
    const name = filterName.value;
    //const resp = await addFilter(filters, name, section);
    setTimeout(() => {
      const filters = globalStore.filters.map((subF) => {
        return {
          ...subF,
          options: subF.options.map((op) => {
            return { ...op, custom: op.active };
          }),
        };
      });
      const body = {
        name,
        active: true,
        _id: getRandomFourDigitNumber(),
        filters: JSON.parse(JSON.stringify(filters)),
      };
      globalStore.cleanFilters();
      globalStore.filters = body.filters;
      globalStore.filtersCustoms.push(body);
      globalStore.savingFilter = false;
      globalStore.newFilter = false;
    }, 2000);
  } catch (error) {
    console.error(error);
  }
};

const closeFilterCustom = () => {
  globalStore.filtersCustoms.forEach((filter) => {
    filter.active = false;
  });
  globalStore.cleanFilters();
};

const clickOnFilter = async (option) => {
  option.active = !option.active;
  // const state = "budget";
  // const filters = {};
  // await incomesStore.filterIncomeByFilter(state, idIncome, filters);
};

function getRandomFourDigitNumber() {
  return Math.floor(1000 + Math.random() * 9000);
}

const getAvatarTag = (filter, option) => {
  if (filter.type === "user") {
    return option.imgUrl;
  }
  return "";
};
const getTypeTag = (filter) => {
  const types = {
    user: "avatar",
  };
  return types?.[filter.type] || "text";
};
</script>

<template>
  <div class="applied-filter">
    <div class="applied-filter__header between">
      <span v-text="$t(`${module}.title`)" class="body-l-r"></span>
      <u-button-icon
        size="s"
        type="text"
        icon="undo"
        :color="color"
        v-if="globalStore.newFilter"
        @click="globalStore.newFilter = false"
        :tooltip="$t(`${module}.buttons.back.tooltip`)"
        :disabled="globalStore.savingFilter"
      />
      <div v-else class="between">
        <u-button-icon
          size="s"
          type="text"
          icon="clean"
          :color="color"
          :tooltip="$t(`${module}.buttons.clean.tooltip`)"
          :disabled="globalStore.savingFilter"
          @click="globalStore.cleanFilters()"
        />
        <!-- <u-button-icon
          v-if="Object.values(filterCustom).length === 0"
          size="s"
          type="text"
          icon="save"
          :color="color"
          @click="globalStore.newFilter = true"
          :tooltip="$t(`${module}.buttons.save.tooltip`)"
          :disabled="globalStore.savingFilter"
        /> -->
      </div>
    </div>
    <div class="applied-filter__filters scroll">
      <template v-for="filter in globalStore.filters" :key="filter.prop">
        <u-tags
          v-for="option in filter.options.filter((f) => !f.custom && f.active)"
          :key="option.prop"
          :text="getText(filter, option)"
          :background="bgCustomMain"
          :color="colorCustomMain"
          @click="clickOnFilter(option)"
          :avatar="getAvatarTag(filter, option)"
          :type="getTypeTag(filter)"
          size="s"
        />
      </template>
      <!-- Personalizados -->
      <template v-if="Object.values(filterCustom).length">
        <u-tags
          :text="filterCustom.name"
          @closeButton="closeFilterCustom"
          :delete="true"
          :disabled="globalStore.savingFilter"
          :background="bgCustom"
          :color="colorCustom"
          maxWidth="320px"
        />
        <template v-for="filter in filterCustom.filters" :key="filter.prop">
          <u-tags
            v-for="option in filter.options.filter((op) => op.custom)"
            :key="option.value"
            :text="getText(filter, option)"
            @closeButton="option.active = false"
            :delete="false"
            :disabled="true"
            maxWidth="320px"
            :avatar="getAvatarTag(filter, option)"
            :type="getTypeTag(filter)"
          />
        </template>
      </template>
    </div>
    <div class="applied-filter__form" v-if="globalStore.newFilter">
      <span v-text="$t(`${module}.label`)" class="body-m-sb"></span>
      <u-input
        v-model="filterName"
        size="s"
        :placeholder="$t(`${module}.placeholder`)"
        :disabled="globalStore.savingFilter"
        @input="filterName = capitalizeFirstLetter(filterName)"
      />
      <div class="applied-filter__form-info">
        <span class="u u-info-outlined"></span>
        <span v-text="$t(`${module}.text`)" class="body-s-r"></span>
      </div>
      <button
        class="applied-filter__save"
        @click="saveFilter"
        :disabled="invalidForm || globalStore.savingFilter"
      >
        <u-loading
          :width="18"
          color="--neutral-text-disabled"
          v-if="globalStore.savingFilter"
        />
        <span class="u u-save" v-else></span>
        <span v-text="textBtn" class="text"></span>
      </button>
    </div>
  </div>
</template>

<style scoped>
.applied-filter {
  display: flex;
  flex-direction: column;
  gap: 16px;
  border-bottom: 2px solid var(--neutral-border-subtle);
  padding-bottom: 24px;
  position: sticky;
  top: 0px;
  background-color: var(--neutral-background-default);
  z-index: 2;
}
.applied-filter__header {
  height: 32px;
}
.applied-filter__form {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.applied-filter__header span,
.applied-filter__form span {
  color: var(--neutral-text-body);
}
.applied-filter__form-info {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 24px;
  padding: 12px 0px;
}
.applied-filter__form-info span {
  color: var(--neutral-text-caption);
  line-height: 20px;
}
.applied-filter__filters {
  display: flex;
  gap: 10px;
  overflow-x: auto;
  flex-wrap: wrap;
  max-height: 160px;
}

/* Global */
.between {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
}
.applied-filter__save {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-left: auto;
  height: 20px;
}
.applied-filter__save span {
  font-size: 16px;
  line-height: 16px;
  color: var(--primary-text-default);
}
.applied-filter__save .text {
  font-weight: 600;
}
.applied-filter__save:disabled {
  cursor: not-allowed;
}
.applied-filter__save:disabled span {
  color: var(--neutral-text-disabled);
}
</style>
