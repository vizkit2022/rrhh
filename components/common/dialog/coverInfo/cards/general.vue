<script setup>
import { ref, computed, watch } from "vue";
import useGlobalStore from "@/stores/global";
import useUserStore from "@/stores/user";
import { useI18n } from "vue-i18n";

//Traducciones
const { t } = useI18n();
const module = "modules.contacts";

// STORES
const globalStore = useGlobalStore();
const userStore = useUserStore();

// CONSTANTS
const toSearchRoles = ref("");
const results = ref({});
const loadings = ref({});
const typeSupplierOptions = [
  { label: t(module + ".modalContacts.infGeneral.cards.generalData.type.options.option1"), icon: "building", value: "business" },
  { label: t(module + ".modalContacts.infGeneral.cards.generalData.type.options.option2"), icon: "user", value: "personal" },
  { label: "Trabajador", icon: "user", value: "trabajador" },
];

// COMPUTED
const getIconForm = computed(() => {
  const types = {
    business: "building",
    personal: "user",
    trabajador: "user",
  };
  return types[userStore.dataSheet.data.data.type] || "building";
});

// Watch
// watch(
//   () => toSearchRoles.value,
//   async (newValue) => {
//     const trimmedSearch = newValue.trim();
//     if (trimmedSearch !== "") {
//       loadings.value.roles = true;
//       await userStore.filterRolesByName(trimmedSearch);
//       if (userStore.roles_list && userStore.roles_list.length) {
//         results.value.roles = mapperRoles();
//       } else {
//         results.value.roles = [];
//       }
//       loadings.value.roles = false;
//     }
//   }
// );

// Functions
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
const searchRoles = debounce(async () => {
  const trimmedSearch = toSearchRoles.value.trim();
  if (trimmedSearch !== "") {
    loadings.value.roles = true;
    await userStore.filterRolesByName(trimmedSearch);
    if (userStore.roles_list && userStore.roles_list.length) {
      results.value.roles = mapperRoles();
    } else {
      results.value.roles = [];
    }
    loadings.value.roles = false;
  }
}, 600);
const selectRol = (rol) => {
  if (!!userStore?.dataSheet?.data?.roles) {
    const rolExists = userStore.dataSheet.data.roles.some(
      (existingRol) =>
        existingRol.name[globalStore.lang].toLowerCase() ===
        rol.label.toLowerCase()
    );
    if (!rolExists) {
      userStore.dataSheet.data.roles.unshift({
        name: { [globalStore.lang]: rol.label },
        _id: rol.id,
      });
      userStore.dataSheet.change = true;
    }
    setTimeout(() => {
      toSearchRoles.value = "";
    }, 10);
  }
};
const removeRol = (pos) => {
  userStore.dataSheet.data.roles.splice(pos, 1);
  userStore.dataSheet.change = true;
};
const newOption = () => {
  userStore.dataSheet.data.data._id = "";
  userStore.dataSheet.data.data.legalName =
    userStore.dataSheet.data.data.legalName.trim();
  userStore.dataSheet.data.imgUrl = "";
  userStore.dataSheet.errors.legalName = false;
};
const selectedName = async (op) => {
  const newData = userStore.fillMissingProperties(op.oldData);
  userStore.dataSheet.data = JSON.parse(JSON.stringify(newData));
  userStore.dataSheet.dataOriginal = JSON.parse(JSON.stringify(newData));
  userStore.dataSheet.dataTemp = {};
  userStore.dataSheet.state = "selected";
  userStore.dataSheet.change = true;
  if(op.oldData?.isUser || op.oldData?.user?._id) {
    userStore.dataSheet.disabled = true;
  }
};
const cleanInputName = () => {
  setTimeout(() => {
    userStore.dataSheet.data.data._id = "";
    userStore.dataSheet.data.data.legalName = "";
    userStore.dataSheet.data.imgUrl = "";
    userStore.dataSheet.errors.legalName = true;
    results.value.name = [];
  }, 10);
};

const searchName = debounce(async () => {
  userStore.dataSheet.change = true;
  const toSearch = userStore.dataSheet.data.data.legalName.trim();
  userStore.dataSheet.data._id = "";
  if (toSearch !== "") {
    loadings.value.name = true;
    const resp = await userStore.findByUsersByNameOrEmail(
      true,
      false,
      toSearch
    );
    results.value.name = mapperUsers(resp || []);
    loadings.value.name = false;
  }
}, 600);

const mapperUsers = (list = []) => {
  const resp = [];
  list.forEach((l) => {
    resp.push({
      label: l?.data?.legalName,
      text: l?.email || "-",
      img: l?.imgUrl,
      type: l?.data?.type || "business",
      oldData: { ...l },
    });
  });
  return resp;
};
</script>

<template>
  <div class="card" v-if="Object.values(userStore.dataSheet.data).length">
    <div class="card__header">
      <h2>{{ t(module + ".modalContacts.infGeneral.cards.generalData.title") }}</h2>
    </div>
    <div class="card__list" id="containerForm">
      <!-- Nombre -->
      <div class="card__item">
        <div class="card__item-sup">
          <span class="u u-user"></span>
          <span class="label">{{ t(module + ".modalContacts.infGeneral.cards.generalData.name.label") }}</span>
          <div class="card__item-input">
            <u-search
              v-if="userStore.dataSheet.state === 'create'"
              v-model="userStore.dataSheet.data.data.legalName"
              :create="false"
              :snippet="true"
              :loading="loadings.name"
              :avatar="true"
              size="s"
              :img="userStore.dataSheet.data.imgUrl"
              :placeholder="t(module + '.modalContacts.infGeneral.cards.generalData.name.placeholder')"
              :options="results.name"
              :error="userStore.dataSheet.errors.legalName"
              :parent="'containerForm'"
              @newOption="newOption"
              @selectedOption="selectedName"
              @cleanInput="cleanInputName"
              @input="searchName"
            />
            <u-input
              v-else-if="['edit', 'selected'].includes(userStore.dataSheet.state)"
              :placeholder="t(module + '.modalContacts.infGeneral.cards.generalData.name.placeholderEdit')"
              size="s"
              v-model="userStore.dataSheet.data.data.legalName"
              :error="userStore.dataSheet.errors.legalName"
              :disabled="userStore.dataSheet.disabled"
            />
            <span v-else class="text truncateText">{{
              userStore.dataSheet.data.data.legalName || "-"
            }}</span>
          </div>
        </div>
      </div>
      <!-- Alias -->
      <div class="card__item">
        <div class="card__item-sup">
          <span class="u u-hashtag"></span>
          <span class="label">{{ t(module + ".modalContacts.infGeneral.cards.generalData.alias.label") }}</span>
          <div class="card__item-input">
            <u-input
              v-if="userStore.dataSheet.state !== 'show'"
              :placeholder="t(module + '.modalContacts.infGeneral.cards.generalData.alias.placeholder')"
              size="s"
              v-model="userStore.dataSheet.data.data.nickName"
              :error="userStore.dataSheet.errors.nickName"
              @input="userStore.dataSheet.change = true"
              :disabled="userStore.dataSheet.state === 'show'"
            />
            <span v-else class="text truncateText">{{
              userStore.dataSheet.data.data.nickName || "-"
            }}</span>
          </div>
        </div>
      </div>
      <!-- Contacto -->
      <div class="card__item">
        <div class="card__item-sup">
          <span class="u u-user-type"></span>
          <span class="label">{{ t(module + ".modalContacts.infGeneral.cards.generalData.type.label") }}</span>
          <div class="card__item-input">
            <u-select
              v-if="userStore.dataSheet.state !== 'show'"
              :options="typeSupplierOptions"
              :iconOption="true"
              :icon="getIconForm"
              size="s"
              :placeholder="t(module + '.modalContacts.infGeneral.cards.generalData.type.placeholder')"
              v-model="userStore.dataSheet.data.data.typeName"
              :alert="userStore.dataSheet.errors.type ? 'error' : ''"
              :full-data="true"
              @full-data="
                (data) => {
                  userStore.dataSheet.data.data.type = data.value;
                  userStore.dataSheet.change = true;
                }
              "
            />
            <span v-else class="text truncateText">{{
              userStore.dataSheet.data.data.typeName || "-"
            }}</span>
          </div>
        </div>
      </div>
      <!-- Rut -->
      <div class="card__item">
        <div class="card__item-sup">
          <span class="u u-id" style="margin-top: -2px !important;"></span>
          <span class="label">{{ t(module + ".modalContacts.infGeneral.cards.generalData.identityNumber.label") }}</span>
          <div class="card__item-input">
            <u-input
              v-if="userStore.dataSheet.state !== 'show'"
              :placeholder="t(module + '.modalContacts.infGeneral.cards.generalData.identityNumber.placeholder')"
              size="s"
              v-model="userStore.dataSheet.data.data.idNumber"
              :error="userStore.dataSheet.errors.rut"
              @input="userStore.dataSheet.change = true"
              :disabled="userStore.dataSheet.state === 'show'"
            />
            <span v-else class="text textDisabled truncateText">{{
              userStore.dataSheet.data.data.idNumber || "-"
            }}</span>
          </div>
        </div>
      </div>
      <!-- Actividad Economica -->
       <div class="card__item">
        <div class="card__item-sup">
          <span class="u u-work"></span>
          <span class="label">{{ t(module + ".modalContacts.infGeneral.cards.generalData.activityBusiness.label") }}</span>
          <div class="card__item-input">
              <u-input
              v-if="userStore.dataSheet.state !== 'show'"
              v-model="userStore.dataSheet.data.data.businessActivity"
              :placeholder="t(module + '.modalContacts.infGeneral.cards.generalData.activityBusiness.placeholder')"
              size="s"
              @input="userStore.dataSheet.change = true"
              :disabled="userStore.dataSheet.state === 'show'"
            />
            <!-- <u-input
              v-if="userStore.dataSheet.state !== 'show'"
              :placeholder="t(module + '.modalContacts.infGeneral.cards.generalData.activity.placeholder')"
              size="s"
              v-model="userStore.dataSheet.data.data.activity"
              :error="userStore.dataSheet.errors.activity"
              @input="userStore.dataSheet.change = true"
              :disabled="userStore.dataSheet.state === 'show'"
            /> -->
            <span v-else class="text truncateText">{{
              userStore.dataSheet.data.data.businessActivity || "-"
            }}</span>
          </div>
        </div>
       </div>
      <!-- Roles -->
      <div class="card__item">
        <div class="card__item-sup">
          <span class="u u-role"></span>
          <span class="label">{{ t(module + ".modalContacts.infGeneral.cards.generalData.role.label") }}</span>
          <div class="card__item-input">
            <u-search
              v-if="userStore.dataSheet.state !== 'show'"
              :placeholder="t(module + '.modalContacts.infGeneral.cards.generalData.role.placeholder')"
              :loading="loadings.roles"
              :options="results.roles"
              size="s"
              v-model="toSearchRoles"
              :error="userStore.dataSheet.errors.roles"
              @input="searchRoles"
              @cleanInput="toSearchRoles = ''"
              @selectedOption="selectRol"
            />
          </div>
        </div>
        <div
          class="card__item-inf"
          v-if="userStore?.dataSheet?.data?.roles?.length"
        >
          <u-tags
            v-for="(role, r) in userStore.dataSheet.data.roles"
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
.card__item span.u {
  width: 8px;
  color: var(--neutral-text-caption);
  font-size: 16px;
  line-height: 16px;
  margin-top: -1px !important;
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

.card__item-input::v-deep(.containerSearch input),
.card__item-input::v-deep(.containerInput input) {
  border: var(--neutral-background-default) 1px solid !important;
}

.card__item-input::v-deep(.containerSelect .containerSelectInput) {
  border: v-bind(
    "userStore?.dataSheet?.errors?.type ? 'var(--bg-danger-500) 1px solid' : 'var(--neutral-background-default) 1px solid'"
  ) !important;
}

/* Global */
h2,
span {
  font-family: Nunito;
}
</style>
