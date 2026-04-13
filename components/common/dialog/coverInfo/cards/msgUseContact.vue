<script setup>
import useUserStore from "@/stores/user";

// STORES
const userStore = useUserStore();

// Functions
const replaceData = () => {
  const newData = userStore.fillMissingProperties(userStore.dataSheet.dataTemp);
  userStore.dataSheet.data = JSON.parse(JSON.stringify(newData));
  userStore.dataSheet.dataOriginal = JSON.parse(JSON.stringify(newData));
  setTimeout(() => {
    userStore.dataSheet.dataTemp = {};
    userStore.dataSheet.additionalView = "";
    userStore.dataSheet.additionalViewType = "";
    userStore.dataSheet.disabled = false;
    userStore.dataSheet.state = "edit";
    userStore.dataSheet.change = true;
  }, 0);
};
const combineData = () => {
  const newData = userStore.fillMissingProperties(userStore.dataSheet.dataTemp);
  const combineDataUser = userStore.combineObjects(
    userStore.dataSheet.data,
    newData
  );
  userStore.dataSheet.data = JSON.parse(JSON.stringify(combineDataUser));
  userStore.dataSheet.dataOriginal = JSON.parse(
    JSON.stringify(combineDataUser)
  );
  setTimeout(() => {
    userStore.dataSheet.dataTemp = {};
    userStore.dataSheet.additionalView = "";
    userStore.dataSheet.additionalViewType = "";
    userStore.dataSheet.disabled = false;
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
      >Contacto Existente Encontrado</span
    >
    <span class="cover__exchangeByEmail-subtitle"
      >Seleccionaste a un <strong>contacto existente.</strong> Puedes
      seleccionar una de las siguientes opciones para proceder:</span
    >
    <div class="cover__exchangeByEmail-options">
      <span class="cover__exchangeByEmail-option replace">
        <strong>Reemplazar datos: </strong>
        Los datos actuales que ingresaste serán reemplazados con los del usuario
        existente.
      </span>
      <span class="cover__exchangeByEmail-option combine">
        <strong>Combinar datos: </strong>
        Los campos vacíos se completarán con los datos del usuario existente, y
        los campos que completaste permanecerán tal cual.
      </span>
      <span class="cover__exchangeByEmail-option cancel">
        <strong>Cancelar: </strong>
        El campo de correo se limpiará y deberás ingresar otro correo
        electrónico.
      </span>
    </div>
    <div class="cover__exchangeByEmail-buttons">
      <u-button
        text="Reemplazar datos"
        size="s"
        class="btnMsg"
        @click="replaceData"
      />
      <u-button
        text="Combinar datos"
        size="s"
        color="--bg-secondary-500"
        colorActive="--bg-secondary-400"
        colorHover="--bg-secondary-400"
        class="btnMsg"
        @click="combineData"
      />
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
.cover__exchangeByEmail-option.cancel::before {
  background-color: var(--bg-danger-500);
}
.cover__exchangeByEmail-option.replace::before {
  background-color: var(--primary-text-default);
}
.cover__exchangeByEmail-option.combine::before {
  background-color: var(--secondary-text-default);
}
.cover__exchangeByEmail-option.cancel strong {
  color: var(--bg-danger-500);
}
.cover__exchangeByEmail-option.replace strong {
  color: var(--primary-text-default);
}
.cover__exchangeByEmail-option.combine strong {
  color: var(--secondary-text-default);
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
