<script setup>
import useBankingTransactionsStore from "@/stores/bankingTransactions";
import useGlobalStore from "@/stores/global";
import useUserStore from "@/stores/user";

//STORE
const globalStore = useGlobalStore();
const bankingTransactionsStore = useBankingTransactionsStore();
const userStore = useUserStore();


//EMIT
const emit = defineEmits(["closeModal", "updatePadding"]);

//CONST

// constante para guardar el archivo
const fileTransactionUpdated = ref(null);

// constante para mostrar error
const showError = ref(false);

// user id session
const userId = userStore.userSession._id;

// constantes para el selector de cuentas
const optionBankAccounts = ref([]);
const selectedBankAccount = ref(null);


//FUNCTION
// FUNCIONES PARA ADJUNTAR PDF
// obtener la img del tipo de archivo
const getMimeType = (fileText) => {
  const extension = fileText.split(".").pop().toLowerCase();

  const types = {
    pdf: "/img/iconsFile/PDF.svg",
    jpg: "/img/iconsFile/JPG.svg",
    jpeg: "/img/iconsFile/JPG.svg",
    png: "/img/iconsFile/PNG.svg",
    gif: "/img/iconsFile/GIF.svg",
    xsl: "/img/iconsFile/XSL.svg",
    xls: "/img/iconsFile/XSL.svg",
    xlsx: "/img/iconsFile/XLSX.svg",
    zip: "/img/iconsFile/ZIP.svg",
    xml: "/img/iconsFile/XML.svg",
    txt: "/img/iconsFile/TXT.svg",
    rar: "/img/iconsFile/PPT.svg",
    docx: "/img/iconsFile/DOCX.svg",
    doc: "/img/iconsFile/DOC.svg",
    csv: "/img/iconsFile/CSV.svg",
  };

  return types[extension] || "unknown";
};

const handleFileUpload = () => {
  const fileInput = document.createElement("input");
  fileInput.type = "file";
  fileInput.accept = [
    // ".csv",
    // ".doc",
    // ".docx",
    // ".gif",
    // ".jpg",
    // ".jpeg",
    // ".pdf",
    // ".png",
    // ".ppt",
    // ".rar",
    // ".txt",
    // ".xml",
    ".xsl",
    ".xls",
    ".xlsx",
    // ".zip",
  ].join(", ");

  fileInput.onchange = (event) => {
    const file = event.target.files[0];
    if (file) {
      const allowedTypes = [
        // "application/pdf",
        // "image/jpeg",
        // "image/jpg",
        // "image/png",
        // "image/gif",
        // "text/csv",
        // "application/msword",
        // "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        // "application/vnd.ms-powerpoint",
        // "application/vnd.openxmlformats-officedocument.presentationml.presentation",
        // "application/x-rar-compressed",
        // "text/plain",
        // "application/xml",
        // "application/zip",
        "application/vnd.ms-excel",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      ];

      if (!allowedTypes.includes(file.type)) {
        alert("Tipo de archivo no permitido.");
        return;
      }

      fileTransactionUpdated.value = file;


      console.log(
        getMimeType(fileTransactionUpdated.value?.name)
      );
      console.log('file', fileTransactionUpdated.value);
    }
  };

  fileInput.click();
};


// FUNCIONES PARA CARGAR TRANSACCIONES
const handleLoadTransactions = async () => {
  try {
    globalStore.loading = true;

    const formData = new FormData();
    formData.append("file", fileTransactionUpdated.value);
    formData.append("bankAccountId", selectedBankAccount.value);
    formData.append("userId", userId);

    await bankingTransactionsStore.updateFile(formData);
    await bankingTransactionsStore.getTransactions();
  } catch (error) {
    console.error(error);
  } finally {
    globalStore.loading = false;
    emit('closeModal'); 
  }
  // showError.value = true;
  // emit("updatePadding", "24px 24px");
}

const handleCancel = () => {
  emit("closeModal");
  emit("updatePadding", "24px 48px");
}

const handleReturnLoadFile = () => {
  showError.value = false;
  emit("updatePadding", "24px 48px");
}


//FUNCIONES PARA CERRAR EL MODAL
const handleEscCloseModal = (e) => {
  if (e.key === "Escape") {
    emit("closeModal");
    emit("updatePadding", "24px 48px");
  }
};


//CICLES
onMounted(async () => {
  document.addEventListener("keydown", handleEscCloseModal);

  try {
    await userStore.getBanksByCountry('CL');
    //obtener todos los bancos
    // optionBankAccounts.value = userStore.bankAccounts.map((account) => {
    //   return {
    //     label: account.name,
    //     value: account._id,
    //   };
    // });
    //obtener solo banco de chile
    optionBankAccounts.value = userStore.bankAccounts.filter((account) => account.swiftCode === 'BCHICLRM').map((account) => {
      return {
        label: account.name,
        value: account._id,
      };
    })
  } catch (error) {
    console.error(error);
  }


});

onUnmounted(() => {
  document.removeEventListener("keydown", handleEscCloseModal);
});
</script>

<template>
  <div class="container" v-if="!showError">
    <div class="container__header">
      <span class="body-l-sb">Cargar archivo de transacciones</span>
      <u-button-icon
        icon="close"
        class="btnIconModify"
        @action-btn="handleCancel"
        color="--neutral-text-caption"
        type="outlined"
        size="s"
      />
    </div>

    <div class="container__body">
      <p class="body-m-sb description">
        Carga aquí el archivo de transacciones entregado por tu banco para
        registrar y conciliar los movimientos. Asegúrate de que el formato y
        periodo sean correctos antes de continuar
      </p>

      <div class="container__select_account">
        <span class="body-s-sb">Selecciona una cuenta</span>
        <u-select v-model="selectedBankAccount" icon-dropdown="selector_down" :options="optionBankAccounts" :full-data="true"  />
      </div>

      <div class="container__select_file">
        <span class="body-s-sb">Selecciona un archivo</span>
        <u-button
          text="Adjuntar archivo"
          icon="attach"
          type="outlined"
          @click="handleFileUpload"
          v-if="!fileTransactionUpdated"
        />
        <div class="file" v-else>
          <div class="izq">
            <img
              :src="getMimeType(fileTransactionUpdated.name)"
              alt="file icon"
              style="width: 26px; height: 32px"
            />
              <span
              class="truncateText body-s-sb"
              v-text="fileTransactionUpdated?.name"
            ></span>
          </div>

          <u-button-icon
            icon="edit"
            size="s"
            type="outlined"
            @click="handleFileUpload"
          />

        </div>
      </div>

      <div class="container__footer">
        <u-button
          size="m"
          text="Cargar Transacciones"
          icon="upload"
          @click="handleLoadTransactions"
          :disabled="!fileTransactionUpdated || !selectedBankAccount"
        />
      </div>
    </div>
  </div>

  <div class="container__error" v-else>
    <div class="info">
      <span class="u u-error-outlined"></span>
      <div class="container_text">
        <p class="body-l-sb title" >La cuenta no coincide con el archivo cargado </p>
        <p class="body-m-sb description" >Verifica que el archivo corresponda a la cuenta bancaria seleccionada antes de volver a intentarlo.</p>
      </div>
    </div>

    <div class="actions">
      <u-button text="Cancelar" type="outlined" color="--neutral-text-caption" color-hover="--neutral-text-body" @action-btn="handleCancel" />
      <u-button text="Volver a intentar" icon="change" @action-btn="handleReturnLoadFile" />
    </div>

  </div>

</template>

<style scoped>
.container {
  display: grid;
  grid-template-rows: 32px 218px 36px;
  gap: 24px;
  width: 552px;
  height: 358px;
}

.container__header {
  display: flex;
  flex-direction: row;
  align-items: center;
  width: 100%;
  height: 100%;
  justify-content: space-between;
}

.container__header span {
  color: var(--neutral-text-body);
}

.btnIconModify {
  border-radius: 50%;
  color: var(--bg-neutral-500);
}

.container__body {
  display: grid;
  grid-template-rows: 54px 60px 72px;
  width: 100%;
  height: 100%;
  gap: 16px;
}

.container__body .description {
  color: var(--neutral-text-caption);
}

.container__body .container__select_account {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  gap: 8px;
}

.container__body .container__select_account span {
  color: var(--neutral-text-body);
}

.container__body .container__select_file {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  gap: 8px;
}

.container__body .container__select_file span {
  color: var(--neutral-text-body);
}

.container__body .container__select_file .file {
  display: grid;
  grid-template-columns: 480px 32px;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  width: 100%;
  height: 100%;
  border: 1px solid var(--bg-neutral-500);
  border-radius: 8px;
  gap: 8px;
}

.container__body .container__select_file .file .izq {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 8px;
}

.container__body .container__footer {
  display: flex;
  flex-direction: row;
  width: 100%;
  height: 100%;
  justify-content: flex-end;
}

.container__error {
  display: grid;
  align-items: center;
  justify-content: center;
  gap: 24px;
  width: 505px;
  height: 124px;
}

.container__error .info {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 16px;
  width: 100%;
  height: 100%;
}

.container__error .info span {
  font-size: 40px;
  width: 48px;
  height: 48px;
}

.container__error .info .container_text {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.container__error .info .container_text .title {
  color: var(--neutral-text-body);
}

.container__error .info .container_text .description {
  text-align: left;
  line-height: 18px;
  color: var(--neutral-text-caption);
}

.container__error .actions {
  display: flex;
  flex-direction: row;
  width: 100%;
  height: 100%;
  gap: 24px;
  justify-content: flex-end;
  align-items: center;
}

</style>
