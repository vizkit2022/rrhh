<script setup>
  import { onMounted, ref } from "vue";

  import useUserStore from "@/stores/user";
  const userStore = useUserStore();

  const user = ref(null);

  onMounted(() => {
    user.value = userStore.profile;
  });
</script>

<template>
  <div class="container__info" v-if="user">
    <ProfileContainerCard1 :user="user" />
    <ProfileContainerCard2 :user="user" />
    <ProfileContainerCard3 :user="user" />
  </div>
</template>

<style scoped>
  .container__info {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    gap: 20px;
  }
</style>
