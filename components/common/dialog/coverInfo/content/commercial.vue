<script setup>
import useUserStore from "@/stores/user";

// STORES
const userStore = useUserStore();
const user = {
  _id: userStore?.dataSheet?.data?._id,
  isContact: true,
}

const childRef = ref(null)

watch(
  () => childRef.value?.showForm,
  (val) => {
    userStore.dataSheet.showFormBankAccount = val;
  }
)
</script>

<template>
  <div class="cover__content">
    <DialogCoverInfoCardsConditions />
    <DialogCoverInfoCardsPayMethod ref="childRef" :user=user :refresh="false" />
  </div>
</template>

<style scoped>
.cover__content {
  display: flex;
  gap: 16px;
  padding: 0 2px 2px 0;
}
</style>
