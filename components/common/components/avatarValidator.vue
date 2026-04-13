<script setup>
import { computed } from 'vue';
import svgCircleExcluyente from './svgCircleExcluyente.vue';
import svgPlusIncluyente from './svgPlusIncluyente.vue';
import svgArrowJerarquia from './svgArrowJerarquia.vue';
import { get } from '@vueuse/core';

const props = defineProps({
  type: {
    type: String,
    required: true,
    validator: value => ["exclusive", "inclusive", "hierarchical", "simple"].includes(value)
  },
  avatars: {
    type: Array,
    required: true
  },
  showStatus: {
    type: Boolean,
    default: true
  },
});

// Mapa de separadores basado en el tipo (todo en minúscula)
const separatorMap = {
  exclusive : svgCircleExcluyente,
  inclusive : svgPlusIncluyente,
  hierarchical: svgArrowJerarquia,
  simple : ''
};

const separatorSrc = computed(() => separatorMap[props.type.toLowerCase()]);

// Si el tipo es "directa" se muestra solo 1 avatar, sino se muestran 2
const maxAvatars = computed(() => (props.type.toLowerCase() === 'simple' ? 1 : 2));
const visibleAvatars = computed(() => props.avatars.slice(0, maxAvatars.value));
const avatarsOcultos = computed(() => props.avatars.slice(maxAvatars.value));
const showDots = computed(() => props.avatars.length > maxAvatars.value);
const showSeparator = index => index < visibleAvatars.value.length - 1 || (visibleAvatars.value.length === maxAvatars.value && showDots.value);

// Mapa para los estados de los avatares
const statusMap = {
  Pendiente: {code: 'pending',  border: "statusPendiente", color: "colorCiclePendiente", icon: "" },
  Aprobado: { code: 'approved', border: "statusAprobado", color: "colorCicleAprobado", icon: "u u-check" },
  Rechazado: {code: 'rejected', border: "statusRechazado", color: "colorCicleRechazado", icon: "u u-close" }
};

const getStatus = (avatar) => {
  // status del la validación del avatar
  let status = avatar?.status;
  // status de la validación del validator
  // (puede ser 'pending', 'approved' o 'rejected')
  let statusValidator = avatar?.statusValidation;
  let statusBolean;

  if (status === true) {
    statusBolean = 'Aprobado';
  } else if (status === null) {
    statusBolean = 'Pendiente';
  }  else if (status === false) {
    statusBolean = 'Rechazado';
  } 

  return statusMap[statusBolean];
};


</script>

<template>
  <div class="validatorContainer">
    <!-- Caso "Directa": se muestra solo el primer avatar y su nombre -->
    <template v-if="props.type.toLowerCase() === 'simple' && visibleAvatars.length">
      <div class="containerAvatar">
        <u-avatar
          :user="{ name: visibleAvatars[0].name, src: visibleAvatars[0].imgUrl }"
          :size="40"
          :class="showStatus && getStatus(visibleAvatars[0]).border"
        />
        <span 
          class="statusContainer" 
          :class="[ showStatus && getStatus(visibleAvatars[0]).icon, showStatus && getStatus(visibleAvatars[0]).color ]">
          <p v-if="showStatus && getStatus(visibleAvatars[0])?.code === 'pending'">...</p>
        </span>
      </div>
      <!-- Ocultando nombre del estado directo -->
      <!-- <span class="avatarName">{{ visibleAvatars[0].name }}</span> -->
    </template>

    <!-- Otros casos: se muestran los avatares visibles y, si existen, los ocultos -->
    <template v-else>
      <template v-for="(avatar, index) in visibleAvatars" :key="index">
        <div class="containerAvatar">
          <u-avatar
            :user="{ name: avatar.name, src: avatar.imgUrl }"
            :size="40"
            :class="showStatus && getStatus(avatar).border"
          />
          <span 
            class="statusContainer" 
            :class="[ showStatus && getStatus(avatar).icon,  showStatus && getStatus(avatar).color ]">
            <p v-if="getStatus(avatar)?.code === 'pending'">...</p>
          </span>
        </div>
        <component 
          v-if="showSeparator(index)" 
          :is="separatorSrc" 
          color="var(--neutral-text-caption)" 
          class="separator" 
        />
      </template>

      <template v-if="avatarsOcultos.length">
        <div class="containerAvatar">
          <u-avatar
            :user="{ name: avatarsOcultos[0].name, src: avatarsOcultos[0].imgUrl }"
            :size="40"
            :class="showStatus && getStatus(avatarsOcultos[0]).border"
          />
          <div class="counter" v-if="avatarsOcultos.length > 1">
            <span>+{{ avatarsOcultos.length - 1 }}</span>
          </div>
          <span 
            v-else
            class="statusContainer" 
            :class="[ showStatus && getStatus(avatarsOcultos[0]).icon,  showStatus && getStatus(avatarsOcultos[0]).color ]">
            <p v-if="getStatus(avatarsOcultos[0])?.code === 'pending'">...</p>
          </span>
        </div>
      </template>
    </template>
  </div>
</template>

<style scoped>
.validatorContainer {
  display: flex;
  align-items: center;
  gap: 8px;
}

.separator {
  width: 12px;
  height: 12px;
  color: var(--neutral-text-body);
}

.avatarName {
  font-size: 14px;
  font-weight: 600;
  line-height: 18px;
  color: var(--neutral-text-body);
}

.containerAvatar {
  display: flex;
  align-items: center;
  position: relative;
}

/* Contador para avatares ocultos */
.counter {
  background-color: var(--success-surface-default);
  height: 24px;
  width: 24px;
  border-radius: 50%;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 12px;
  font-weight: bold;
  color: var(--neutral-border-background);
  position: absolute;
  bottom: -5px;
  right: -10px;
}

/* Estilos para el status */
.statusContainer {
  height: 20px;
  width: 20px;
  border-radius: 50%;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 15px;
  font-weight: bold;
  position: absolute;
  bottom: -4px;
  right: -5px;
}

.statusContainer p {
  margin-bottom: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
  font-weight: bold;
}

/* Colores para cada estado */
.colorCicleAprobado {
  background-color: var(--success-surface-default);
  color: var(--neutral-border-background);
}

.colorCiclePendiente {
  background-color: var(--neutral-surface-default);
  color: var(--neutral-background-default);
}

.colorCicleRechazado {
  background-color: var(--danger-surface-default);
  color: var(--neutral-border-background);
}

/* Bordes según el estado */
.statusPendiente {
  border: 2px solid var(--neutral-border-default);
}
.statusAprobado {
  border: 2px solid var(--success-border-default);
}
.statusRechazado {
  border: 2px solid var(--danger-surface-default);
}
</style>
