tem
<script setup>
import { onMounted } from "vue";
import useLinesStore from "@/stores/lines";
import useGrillaStore from "@/stores/grilla";
import { transformedDate, getColorStatus, getNameStatus } from "@/utils/helpers";

// Stores
const linesStore = useLinesStore();
const grillaStore = useGrillaStore();

// Constants
const { t } = useI18n();
const module = "modules.incomes.pages.grilla.menus.purchases";
const lineId = grillaStore?.configDropdownCell?.line?.data?._id || "";

const { data, error, pending } = useAsyncData(`purchases-${lineId}`, () =>
  linesStore.purchasesByLine(lineId),
);

// Mounted
onMounted(() => {
  document.addEventListener("keydown", handleEscapeKey);
});

onUnmounted(() => {
  document.removeEventListener("keydown", handleEscapeKey);
});

const handleEscapeKey = (event) => {
  if (event.key === "Escape" || event.key === "Esc") {
    grillaStore.dropdownCloseEvent();
  }
};
</script>

<template>
  <div class="dropdown">
    <div class="dropdown__list">
      <div v-if="pending" class="dropdown__list-loading">
        <u-loading width="16" />
        <span>{{ t(module + ".text.loading") }}</span>
      </div>
      <template v-else>
        <a class="dropdown__list-item" v-for="d in data" :key="d._id" :href="`/outcomes/${d?.outcome?._id}`" target="_blank" rel="noopener">
          <div class="name">
            <span class="main">
              {{ t(module + ".text.text1") }} {{ d?.outcome?.idNumber }}
            </span>
            <span
              class="tag"
              :style="`background-color: var(${getColorStatus(d?.status).background}); color: var(${getColorStatus(d?.status).color})`"
              >{{ getNameStatus(d?.status, t) }}</span
            >
          </div>
          <u-avatar
            :user="{
              name: d?.outcome?.supplier?.data?.legalName,
              src: d?.outcome?.supplier?.imgUrl,
            }"
            size="36"
            class="avatar"
          />
          <div class="text">
            <span class="truncateText">{{
              d?.outcome?.supplier?.data?.legalName
            }}</span>
            <span>{{ d?.outcome?.supplier?.data?.idNumber || "-" }}</span>
          </div>
          <div class="amount">
            <span>{{ d?.numbers?.budget?.value }}</span>
            <span>{{ transformedDate(d?.createdAt) }}</span>
          </div>
        </a>
      </template>
    </div>
    <div class="footer">
      <span class="truncateText">
        {{ grillaStore.configDropdownCell.line.data.name }}
      </span>
      <span
        >{{ t(module + ".text.text3")
        }}<strong> {{ data?.length || 0 }}</strong></span
      >
    </div>
  </div>
</template>

<style scoped>
.dropdown {
  width: 100%;
  height: 100%;
  display: grid;
  gap: 10px;
  grid-template-rows: 1fr auto;
}
.dropdown span.title {
  font-weight: 700;
  font-size: 10px;
  line-height: 14px;
  letter-spacing: 10%;
  vertical-align: middle;
  text-transform: uppercase;
  color: var(--neutral-text-caption);
}
.dropdown__list {
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 5px;
  width: 356px;
  scrollbar-gutter: stable;
  padding-right: 1px;
}
.dropdown__list::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}
.dropdown__list::-webkit-scrollbar-thumb {
  background-color: var(--neutral-border-subtle);
  border-radius: 5px;
}
.dropdown__list .dropdown__list-item {
  display: grid;
  grid-template-columns: 36px 1fr 110px;
  grid-template-rows: auto 36px;
  grid-template-areas: "name name name" "avatar texts amount";
  row-gap: 4px;
  column-gap: 12px;
  align-items: center;
  width: 100%;
  padding: 0px;
  border-radius: 8px;
  transition: 0.3s;
  border: 1px solid var(--neutral-border-subtle);
  padding: 8px;
  cursor: pointer;
}

.dropdown__list .dropdown__list-item .name {
  grid-area: name;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.dropdown__list .dropdown__list-item .name .main {
  font-weight: 400;
  font-size: 10px;
  line-height: 14px;
  color: var(--neutral-text-caption);
  text-transform: uppercase;
}

.dropdown__list .dropdown__list-item .name .tag {
  font-weight: 600;
  font-size: 10px;
  line-height: 12px;
  padding: 2px 8px;
  border-radius: 10px;
}

.dropdown__list .dropdown__list-item .avatar {
  grid-area: avatar;
}

.dropdown__list .dropdown__list-item .text {
  grid-area: texts;
  display: grid;
}

.dropdown__list .dropdown__list-item .amount {
  grid-area: amount;
  display: grid;
  text-align: right;
}

.dropdown__list .dropdown__list-item .text span:nth-child(1),
.dropdown__list .dropdown__list-item .amount span:nth-child(1) {
  font-weight: 600;
  font-size: 14px;
  line-height: 20px;
  color: var(--neutral-text-body);
}

.dropdown__list .dropdown__list-item .text span:nth-child(2),
.dropdown__list .dropdown__list-item .amount span:nth-child(2) {
  font-weight: 400;
  font-size: 12px;
  line-height: 16px;
  color: var(--neutral-text-caption);
}

.footer {
  display: grid;
  grid-template-columns: 1fr auto;
  column-gap: 12px;
}

.footer span:nth-child(1) {
  font-weight: 600;
  font-size: 12px;
  line-height: 16px;
  color: var(--neutral-text-body);
}

.footer span:nth-child(2) {
  font-weight: 400;
  font-size: 12px;
  line-height: 16px;
  color: var(--neutral-text-caption);
}

.dropdown__list-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  padding-left: 10px;
  gap: 10px;
}
.dropdown__list-loading span {
  font-size: 14px;
  line-height: 14px;
  color: var(--neutral-text-caption);
}
</style>
