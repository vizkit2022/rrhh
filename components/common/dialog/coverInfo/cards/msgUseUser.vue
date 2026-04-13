<script setup>
import useUserStore from "@/stores/user";

// STORES
const userStore = useUserStore();

// Functions
const useNewData = () => {
  if (userStore.dataSheet.dataTemp.isUser) {
    userStore.dataSheet.dataTemp.user = {
      _id: userStore.dataSheet.dataTemp._id
    }
    delete userStore.dataSheet.dataTemp._id;
  }
  const newData = userStore.fillMissingProperties(userStore.dataSheet.dataTemp);
  userStore.dataSheet.data = JSON.parse(JSON.stringify(newData));
  userStore.dataSheet.dataOriginal = JSON.parse(JSON.stringify(newData));
  setTimeout(() => {
    userStore.dataSheet.dataTemp = {};
    userStore.dataSheet.additionalView = "";
    userStore.dataSheet.additionalViewType = "";
    userStore.dataSheet.disabled = true;
    userStore.dataSheet.state = "edit";
    userStore.dataSheet.change = true;
  }, 0);
};
const cancelData = () => {
  const type = userStore.dataSheet.additionalViewType;
  setTimeout(() => {
    userStore.dataSheet.additionalView = "";
    userStore.dataSheet.additionalViewType = "";
    userStore.dataSheet.dataTemp = {};
    if (type === "name") {
      userStore.dataSheet.data.data.legalName = "";
    }
    if (type === "email") {
      userStore.dataSheet.data.email = "";
    }
  }, 0);
};
</script>

<template>
  <div class="cover__exchangeByEmail">
    <span class="cover__exchangeByEmail-title"
      >Usuario Existente Encontrado</span
    >
    <span class="cover__exchangeByEmail-subtitle"
      >Seleccionaste a un <strong>usuario existente.</strong> Los usuarios tienen edición parcial.</span
    >
    <div class="cover__exchangeByEmail-options">
      <span class="cover__exchangeByEmail-option normal">
        <strong>Alias: </strong> Se guardará como nombre alternativo el cúal será visible solo por ti.
      </span>
      <span class="cover__exchangeByEmail-option normal">
        <strong>RUT: </strong> Se guardará como rut alternativo para ti.
      </span>
      <span class="cover__exchangeByEmail-option normal">
        <strong>Redes Sociales </strong> Se guardarán como referencia solo para ti.
      </span>
    </div>
    <div class="cover__exchangeByEmail-buttons">
      <u-button text="Continuar" size="s" class="btnMsg" @click="useNewData" />
      <u-button
        text="Cancelar"
        size="s"
        color="--bg-danger-500"
        colorActive="--bg-danger-400"
        colorHover="--bg-danger-400"
        class="btnMsgCancel"
        @click="cancelData"
      />
    </div>
  </div>
</template>

<style scoped>
.cover__exchangeByEmail {
  background-color: var(--neutral-background-default);
  display: flex;
  flex-direction: column;
  gap: 10px;
  border-radius: 16px;
  padding: 20px 24px;
  height: auto;
  margin-bottom: 16px;
  box-shadow: var(--shadow-2);
  width: calc(100% - 30px);
  margin-left: 15px;
  margin-top: 15px;
}
.cover__exchangeByEmail-title {
  font-size: 16px;
  font-weight: 600;
  line-height: 18px;
  color: var(--neutral-text-body);
}
.cover__exchangeByEmail-subtitle {
  font-size: 14px;
  font-weight: 600;
  line-height: 16px;
  color: var(--neutral-text-caption);
}
.cover__exchangeByEmail-options {
  display: flex;
  flex-direction: column;
  gap: 5px;
  padding: 10px 40px 20px;
}
.cover__exchangeByEmail-option {
  font-size: 14px;
  font-weight: 400;
  line-height: 14px;
  color: var(--neutral-text-caption);
  position: relative;
}
.cover__exchangeByEmail-option::before {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  content: "";
  position: absolute;
  left: -16px;
  top: 4px;
}
.cover__exchangeByEmail-option.normal::before {
  background-color: var(--neutral-text-caption);
}
.cover__exchangeByEmail-buttons {
  display: flex;
  justify-content: flex-end;
  gap: 16px;
}

span {
  font-family: Nunito;
}
.btnMsg {
  width: 160px;
}
.btnMsgCancel {
  width: 120px;
}
</style>
