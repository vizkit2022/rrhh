<script setup>
import { defineProps } from "vue";

const props = defineProps({
  option: {
    type: Number,
    default: 0,
  },
});
</script>

<template>
  <div class="formMain">
    <SettingsFormsPersonalInformation v-show="props.option === 0" />
    <SettingsFormsSocialNetwork v-show="props.option === 1" />
    <SettingsFormsOrganizations v-show="props.option === 2" />
    <SettingsFormsAccountSettings v-show="props.option === 3" />
    <SettingsFormsNotifications v-show="props.option === 4" />
    <SettingsFormsImports v-show="props.option === 5" />
  </div>
</template>

<style scoped>
.formMain {
  padding: 0 0px;
}
</style>
