<script setup>
import { defineProps, computed } from "vue";

// PROPS
const { item } = defineProps({
  item: {
    type: Object,
    default: () => {},
  },
});

</script>

<template>
  <div class="cellContact">
    <u-avatar
      :user="{
        name: item?.item?.data?.legalName || '',
        src: item?.item?.imgUrl || '',
      }"
      :size="32"
    />
    <span class="truncateTextCustom">
      {{ item?.item?.data?.legalName || "" }}
    </span>
    <div v-if="item?.item?.user?.isValidate" class="isUser">
      <u-verify style="height: 12px;" />
    </div>
  </div>
</template>

<style scoped>
.cellContact {
  display: grid;
  grid-template-columns: 32px 1fr;
  gap: 10px;
  align-items: center;
  width: 100%;
  position: relative;
}
.truncateTextCustom {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  text-align: start;
  font-family: Nunito;
  font-size: 14px;
  font-weight: 600;
  line-height: 18px;
  color: var(--neutral-text-body);
}
.isUser {
  width: 16px;
  height: 16px;
  position: absolute;
  left: 20px;
  bottom: -2px;
  background-color: var(--neutral-background-default);
  border-radius: 10px;
  display: flex;
  justify-content: center;
  align-items: center;
  box-shadow: var(--shadow-2);
}
</style>
