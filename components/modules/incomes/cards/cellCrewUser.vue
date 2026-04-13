<script setup>
import { defineProps, computed } from "vue";
import useGlobalStore from "@/stores/global";

// Stores
const globalStore = useGlobalStore();

// Constants
const texts = {
  es: "Miembro",
  en: "Member",
};

// Props
const props = defineProps({
  data: {
    type: Object,
    default: () => ({
        contact: {
            data: {legalName: ""}, 
            imgUrl: "",
        },
        member: false
    }),
  },
});

// Computed
const isMember = computed(() => props.data.member);
const isUser = computed(() => props.data.contact.user);
const lang = computed(() => globalStore.lang);
const textIsMember = computed(() => {
  return isMember.value ? texts[lang.value] : "";
});
const user = computed(() => ({
  name: props.data?.contact?.data?.legalName || "",
  src: props.data?.contact?.imgUrl || "",
}));
</script>

<template>
  <div class="cellCrewUser">
    <u-avatar :size="32" :user="user" />
    <span v-text="user.name" class="main truncateText"></span>
    <span v-text="textIsMember" class="member"></span>
    <span class="u u-verified" v-if="isUser"></span>
  </div>
</template>

<style scoped>
.cellCrewUser {
    width: 100%;
    display: grid;
    grid-template-columns: 32px 1fr 60px;
    gap: 20px;
    align-items: center;
    position: relative;
}
.cellCrewUser span.main {
    width: 100%;
    text-align: left;
    color: var(--neutral-text-body);
}
.cellCrewUser span.member {
    width: 100%;
    text-align: right;
    color: var(--secondary-text-default);
}
.cellCrewUser span.u {
    position: absolute;
    width: 18px;
    height: 18px;
    background-color: var(--neutral-background-default);
    display: grid;
    place-items: center;
    border-radius: 50%;
    font-size: 14px;
    line-height: 20px;
    bottom: -2px;
    left: 20px;
    box-shadow: var(--shadow-2);
}

span:not(.u) {
    font-family: Nunito;
    font-size: 14px;
    font-weight: 600;
    line-height: 18px;
}
</style>
