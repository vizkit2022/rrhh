<script setup>
//step 1
import { ref, watch, computed, onMounted } from "vue";

// EventBus
const { $bus } = useNuxtApp();

$bus.$emit("updateDimensions", { width: "80vw", height: "90vh" });


// Stores
const globalStore = useGlobalStore();
const search = ref(""); 
</script>

<template>
  <div class="container-modal">
    <div class="container-modal__header">
      <span v-text="'Documentar - Seleccionar Documento'"></span>
      <u-button-icon
        icon="close"
        class="btnIconModify"
        type="outlined"
        color="--neutral-text-caption"
        size="m"
        @click="$bus.$emit('CloseModalPayment');"
      />
    </div>

    <div class="search-container">
      <u-search
        class="search-bar"
        v-model="search"
        :placeholder="'Buscar'" 
      />
      <u-button
        class="btnDesktop"
        text="Filtrar"
        icon="filter"
        :revers="true"
        type="outlined"
        color="--bg-neutral-500"
        colorHover="--bg-neutral-600"
        colorActive="--bg-neutral-700"
      />
    </div>
    <div class="container-modal__content">
      <div class="container-modal__content-title primary">
        <span>Documentos sugeridos</span>
      </div>
      <div class="containerModal__body">
        <div class="document">
          <span class="document__title" >BOLETA ELECTRONICA N°68742485</span>
          <span class="pill">Pendiente</span>
          <div class="document__body">  
            <div class="document__names">            
              <u-checkbox></u-checkbox>
              <u-avatar
                :user="{
                  name:    '1231',
                  src:    ''
                }"
                :size="32"
              />
              <span>Nombre Linea</span>
              
            </div>
            <div class="document__values">
              <span class="money">$ 2.800.000</span>
              <span class="date">21-08-2024</span>
            </div>
          </div>
        </div>

        <div class="document">
          <span class="document__title" >BOLETA ELECTRONICA N°68742485</span>
          <span class="pill">Pendiente</span>
          <div class="document__body">  
            <div class="document__names">            
              <u-checkbox></u-checkbox>
              <u-avatar
                :user="{
                  name:  '1231',
                  src:   ''
                }"
                :size="32"
              />
              <span>Nombre Linea</span>
              
            </div>
            <div class="document__values">
              <span class="money">$ 2.800.000</span>
              <span class="date">21-08-2024</span>
            </div>
          </div>
        </div>

        <div class="document">
          <span class="document__title" >BOLETA ELECTRONICA N°68742485</span>
          <span class="pill">Pendiente</span>
          <div class="document__body">  
            <div class="document__names">            
              <u-checkbox></u-checkbox>
              <u-avatar
                :user="{
                  name:   '1231',
                  src:   ''
                }"
                :size="32"
              />
              <span>Nombre Linea</span>
              
            </div>
            <div class="document__values">
              <span class="money">$ 2.800.000</span>
              <span class="date">21-08-2024</span>
            </div>
          </div>
        </div>


      </div>
    </div>
    <div class="container-modal__footer">
      <u-button
        :text="labels.modal.createOc.step1.buttons.cancel[globalStore.lang]"
        type="outlined"
        class="mainBtnModify"
        @click="$bus.$emit('closeAndBack')"
      />
      <u-button
        :text="labels.modal.createOc.step1.buttons.next[globalStore.lang]"
        class="mainBtnModify"
        @click="$bus.$emit('updatedStepDocument', 2)"
      />
    </div>

  </div>

</template>

<style scoped>
span,
label,
button {
  font-family: Nunito;
}

/* Sections */
.container-modal {
  display: flex;
  flex-direction: column;

  width: 100%;
  height: 100%;
  gap: 24px;

}

.search-container
{
  display: flex;
  gap: 10px;
  height: fit-content;

}
.search-bar{
  width: 100%;
  flex-grow: 1;
}

.container-modal__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.container-modal__header span {
  font-size: 16px;
  font-weight: 600;
  line-height: 20px;
  color: var(--neutral-text-body);
}
.container-modal__content {
  height: 100%;
  overflow-y: auto;
  padding: 0 5px 2px 0;
}
.container-modal__footer {
  margin-top: auto;
  display: flex;
  justify-content: space-between;
  align-items: center; 
  width: 100%; 
}
.container-modal__content::-webkit-scrollbar {
  width: 8px;
  background: var(--neutral-surface-light);
  border-radius: 20px;
}
.container-modal__content::-webkit-scrollbar-thumb {
  background: var(--neutral-surface-subtle);
  border-radius: 5px;
}

/* Sections */
.containerModal__body {
  display: flex;
  flex-direction: column;
  height: fit-content;
  padding: 15px 20px; 
  row-gap: 10px;
  border: 1px solid var(--neutral-border-subtle);
  border-radius: 0px 0px 10px 10px;
}
 
.document{
  padding: 10px 20px;
  position: relative;
  display: flex;
  flex-direction: column;
  border: 1px solid var(--neutral-border-subtle);
  gap: 5px;
  border-radius:  10px;
}

.pill{
  font-size: 12px;
  position: absolute;
  top: 0px;
  right: 0px;
  color: var(--warning-surface-default);
  padding: 4px 8px;
  background-color: var(--warning-surface-light);
  border-radius:  10px;
}

.document__title{  
  width: 100%;
  color: var(--neutral-surface-subtle);
  font-size: 10px;
  font-weight: 400;
}

.document__names{
  display: flex;
  gap: 10px;
  flex-direction: row;
  align-items: center;
  justify-content: space-around;
}

.document__names > span{
  font-weight: 600;
  font-size: 14px;
  line-height: 18px;
  color: var(--primary-text-default)
}

.document__body{
  
  color: var(--neutral-text-body);
  display: flex;
  justify-content: space-between;
}

.document__values{
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}

.money{
  text-wrap: nowrap;
  font-size:14px ;
  font-weight:600 ;
}

.date{
  text-wrap: nowrap;
  font-size:12px ;
  font-weight:400 ;
}
 
 
.container-modal__content-title {
  width: 100%;
  height: 32px;
  background-color: var(--neutral-surface-light);
  padding: 0 24px;
  display: flex;
  align-items: center;
  border-left: 1px solid var(--neutral-border-subtle);
  border-right: 1px solid var(--neutral-border-subtle);
}
.container-modal__content-title.primary {
  border-top: 1px solid var(--neutral-border-subtle);
  border-radius: 10px 10px 0 0;
}
.container-modal__content-title span {
  font-size: 12px;
  font-weight: 600;
  line-height: 16px;
  color: var(--neutral-text-body);
}
.contentLabel {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.loadMsg {
  color: var(--neutral-surface-subtle);
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 5px;
}
.errorMsg {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 10px;
  position: relative;
}
.errorMsg span,
.errorMsg button {
  color: var(--danger-surface-darker);
}
.errorMsg .u {
  animation: pulse ease-in-out 1s infinite;
  border-radius: 50%;
}
.minMenu {
  position: absolute;
  transition: 0.3s;
  transform-origin: center right;
  background-color: var(--neutral-background-default);
  padding: 16px 20px;
  border-radius: 10px;
  box-shadow: var(--shadow-2);
  z-index: 2;
  display: grid;
  grid-template-rows: auto auto;
  gap: 10px;
  max-width: 280px;
}
.minMenu span {
  color: var(--neutral-text-body);
}
.minMenu strong {
  color: var(--primary-text-default);
}
.minMenu button {
  width: auto;
  margin-left: auto;
  background-color: var(--primary-surface-default);
  color: var(--white);
  font-size: 12px;
  line-height: 12px;
  padding: 5px 10px;
  border-radius: 10px;
  transition: 0.3s;
}
.minMenu button:hover {
  background-color: var(--primary-surface-subtle);
}
.btnEmail {
  padding: 5px 20px !important;
}

@keyframes pulse {
  0% {
    box-shadow: 0 0 0 0 rgba(224, 85, 75, 0.3);
  }
  70% {
    box-shadow: 0 0 0 10px rgba(224, 75, 75, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(224, 75, 75, 0);
  }
}

/* CUSTOM COMPONENTS - MODIFY */
.btnIconModify {
  border-radius: 50%;
}
.mainBtnModify {
  min-width: 135px;
}
</style>
