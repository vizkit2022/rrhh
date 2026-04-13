<script setup>
import { onMounted, ref,onBeforeUnmount } from "vue";
import useUserStore from "@/stores/user";
const userStore = useUserStore();

import useGlobalStore from "@/stores/global";
const globalStore = useGlobalStore();

const { $bus } = useNuxtApp();

const user = ref(null);
const uploadAction = ref(false);
const errorInputs = ref({});

onMounted(async () => {
  $bus.$on("errorForm", (error) => {
    errorInputs.value = error;
  });
  user.value = userStore.profile;
});

onBeforeUnmount(() => {
  $bus.$off("errorForm"); 
});

watch(ref(uploadAction), async (newValue) => {
  document.getElementById("uploadFileInput").click();
});


const uploadFile = async (e) => {
  if (!e.target.files || !e.target.files[0]) {
    return;
  }
  const file = e.target.files[0];
  let fileType = "unknown";
  if (file.type === "application/xml" || file.type === "text/xml") {
    fileType = "xml";
  } else if (
    file.type ===
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  ) {
    fileType = "xlsx";
  } else if (file.type === "application/vnd.ms-excel") {
    fileType = "xls";
  }
  
  const formData = new FormData();
  formData.append("file", file);
  if (file.size) {
    await globalStore.uploadFile(formData, fileType);
    e.target.value = null;
  } else {
    console.warn("File size information unavailable.");
  }
};
</script>

<template>
  <div class="form" v-if="user">
    <div class="form__content">
      <div class="form__col">
        <h1>SOY IMPORT</h1>
        <u-button-icon
          icon="attach"
          type="outlined"
          color="--bg-info-500"
          colorHover="--bg-info-400"
          colorActive="--bg-info-600"
          @action-btn="uploadAction = !uploadAction"
          style="display: none;"
        />

        <input
          type="file"
          name="cover"
          id="uploadFileInput"
          @change="uploadFile($event)"
          style="display: none"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
.form {
  max-width: 1000px;
  height: calc(100vh - 98px - 280px - 20px);
  display: grid;
  grid-template-rows: 1fr 40px;
  gap: 16px;
  margin: 0 auto;
}
.form__content {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 30px;
  overflow-y: auto;
  padding-right: 2px;
}
.form__content::-webkit-scrollbar {
  width: 5px;
  height: 0px;
}
.form__content::-webkit-scrollbar-thumb {
  border-radius: 3px;
  background-color: var(--bg-neutral-300);
}
.form__content::-webkit-scrollbar-track {
  background-color: var(--bg-neutral-100);
  border-radius: 3px;
}
.form__col {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.form__content-cell {
  display: grid;
  grid-template-columns: 130px 1fr;
  align-items: center;
}
.form__content-cell div:nth-child(1) {
  display: grid;
  grid-template-columns: 35px 1fr;
}
.form__content-cell div:nth-child(1) span:nth-child(1) {
  color: var(--bg-neutral-700);
  font-size: 24px;
  line-height: 24px;
}
.form__content-cell label {
  font-family: Nunito;
  font-size: 14px;
  font-weight: 400;
  line-height: 14px;
  letter-spacing: 0em;
  text-align: left;
  color: var(--bg-neutral-700);
  margin-top: 5px;
}
.form__actions {
  display: flex;
  justify-content: flex-end;
}
.mainBtnModify {
  width: 150px;
}
.labelError {
  color: var(--bg-danger-500) !important;
}

@media only screen and (max-width: 1000px) {
  .form__content {
    grid-template-columns: 1fr;
    gap: 20px;
  }
}
</style>
