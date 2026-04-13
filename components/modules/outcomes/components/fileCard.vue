<script setup>
  import { defineProps, defineEmits } from "vue";

  // Props
  const props = defineProps({
    fecha: String,
    usuario: {
      type: Object,
      default: "",
    },
    nombreArchivo:{
      type: String,
      default: "Nombre Archivo.jpg",
    },
    page:{
      type: String,
      default: "",
    },

  });

  // Emits
  const emit = defineEmits(["archivoBorrado", "archivoOpen"]);

  // Constants
  const colorEdit = "--neutral-text-caption";

  // Functions
  const handleClickremove = () => {
    emit("archivoBorrado");
  };
  const handleClickview = () => {
    emit("archivoOpen");
  };

</script>

<template>
  <div class="card" @click="handleClickview" >
    <div v-if="page!='modalDocumentar'" class="header">
      <span class="date">{{ fecha }}</span>
      <div
        class="delete-icon u u-cancel"
        @click="handleClickremove"
        loading="lazy"
      ></div>
    </div>
    <div class="content">
      <div class="attachment">
        <button>
          <img class="thumbnail" loading="lazy" src="/img/fileicon.svg" />
        </button>
        <div class="attachment-info">
          <div class="attachment-title">
            <span class="truncateText">
              {{ nombreArchivo }}
            </span>
          </div>
          <div v-if="usuario.nombre" class="uploader">
            <span class="uploader-label">Subido por</span>

            <img loading="lazy" srcSet="..." class="uploader-icon" />
            <span class="uploader-name">{{ usuario.nombre }}</span>
          </div>
 
        </div>

        
        <u-button-icon
        v-if="page=='modalDocumentar'"
          size="s"
          icon="close"
          :text="'button'"
          type="outlined"
          :color="colorEdit"
        />
 
      </div>
    </div>
  </div>
</template>

<style scoped>
  .card {
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(56, 64, 76, 0.2);
    background-color: var( --neutral-background-default);
    display: flex;
    flex-direction: column;
    max-width: 400px;
    padding: 8px;
    transition: transform 0.3s ease, box-shadow 0.3s ease;
    cursor: pointer;
    border: 1px solid var( --neutral-border-subtle);
  }

  .card:hover {
    transform: scale(1.03); /* Escala la tarjeta */
    box-shadow: 0 5px 16px rgba(56, 64, 76, 0.2); /* Aumenta la sombra */
  }

  .delete-icon {
    font-size: 15px;
    aspect-ratio: 0.83;
    object-fit: cover;
    cursor: pointer;
    transition: transform 0.3s ease, box-shadow 0.3s ease;
  }

  .delete-icon:hover {
    transform: scale(
      1.1
    ); /* Hace que el ícono crezca ligeramente al pasar el ratón por encima */
  }

  .thumbnail {
    aspect-ratio: 0.83;
    width: 33px;
    object-fit: cover;
  }

  .header {
    display: flex;
    justify-content: space-between;
    font-size: 10px;
    color: #98a2b3;
    font-weight: 400;
    text-transform: uppercase;
    letter-spacing: 1px;
    line-height: 140%;
  }

  .date {
    font-family: Nunito, sans-serif;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .content {
    display: flex;
    flex-direction: column;
    gap: 8px;
    font-weight: 600;
    margin-top: 4px;
  }

  .attachment {
    display: grid;
    grid-template-columns: auto 1fr auto;
    gap: 8px;
  }

  .attachment-info {
    display: flex;
    flex-direction: column;
    justify-content: center;
  }

  .attachment-title {
    width: auto;
    max-width: 300px;
    color: var(--neutral-text-caption);
    font-size: 14px;
    line-height: 129%;
    font-family: Nunito, sans-serif;
  }

  .attachment-title span {
    width: 100%;
    display: block;
  }

  .uploader {
    display: flex;
    gap: 8px;
    margin-top: 4px;
    color: #98a2b3;
    font-size: 12px;
    line-height: 133%;
  }

  .uploader-label,
  .uploader-name {
    font-family: Nunito, sans-serif;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .view-button {
    color: var(--primary-surface-default);
    font-size: 12px;
    width: 50px;
    line-height: 133%;
    font-family: Nunito, sans-serif;
    align-self: center;
  }
</style>
