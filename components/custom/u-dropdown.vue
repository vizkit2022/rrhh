<script setup>
import {
  defineProps,
  defineEmits,
  computed,
  onMounted,
  onBeforeUnmount,
  ref,
  watch,
} from "vue";

// Emits
const emit = defineEmits([
  "dropdownSelect",
  "dropdownClose",
  "isBottomDropdown",
]);

// Props
const props = defineProps({
  heightParent: {
    type: String,
    default: "32px",
  },
  widthParent: {
    type: String,
    default: "",
  },
  idParent: {
    type: String,
    default: "",
  },
  idContainer: {
    type: String,
    default: "",
  },
  maxheihtContent: {
    type: String,
    default: "160px",
  },
  list: {
    type: Array,
    default: () => [],
    // [
    //   { label: "Main Text" },
    //   { label: "Main Text 2" },
    //   { label: "Main Text 3" },
    // ]
  },
  customOptionStyle: {
    type: Boolean,
    default: false,
    // Modo de Uso desde el Padre
    // <template v-slot:cell="item">
    //   <div>{{item.item.label}}</div>
    // </template>
  },
  loading: {
    type: Boolean,
    default: false,
  },
  goToDropdown: {
    type: Boolean,
    default: false,
  },
});

// Constants
const isBottomDropdown = ref(true);
const op = ref(0);
const positions = ref({x:0, y: 0});
const widthParent = ref("0px");


// Computed
const heightParent = computed(() => props.heightParent);

// Functions
const dropdownSelect = (op) => {
  emit("dropdownSelect", op);
};

// Método para detectar clic fuera del dropdown
const handleClickOutside = (event) => {
  const dropdown = document.querySelector(".dropdown");
  if (dropdown && !dropdown.contains(event.target)) {
    emit("dropdownClose");
  }
};

// Watch -> escuchar que se ingreso por flechas
watch(
  () => props.goToDropdown,
  (newVal, oldVal) => {
    if (newVal) {
      focusBtn();
    }
  }
);

// Moverse entre las opciones
const changeOp = (index, e) => {
  const key = e.key;

  const keys = {
    ArrowUp: () => moveOption(true, index),
    ArrowDown: () => moveOption(false, index),
    Enter: () => dropdownSelect(props.list[index]),
    Escape: () => emit("dropdownClose"),
  };

  keys[key] ? keys[key]() : goToDropdownLocal();
};

// Moverve hacia arriba o abajo
const moveOption = (up = true, index) => {
  const dropdownList = document.querySelector(".dropdown__list");
  const itemHeight = 32;
  if (up) {
    if (index === 0) {
      index = props.list.length - 1;
      dropdownList.scrollTop = itemHeight * (props.list.length - 4);
    } else {
      index = index - 1;
      if (dropdownList.scrollTop > index * itemHeight) {
        dropdownList.scrollTop -= itemHeight;
      }
    }
  } else {
    if (index + 1 === props.list.length) {
      index = 0;
      dropdownList.scrollTop = 0;
    } else {
      index = index + 1;
      if (
        dropdownList.scrollTop <
        (index + 1) * itemHeight - dropdownList.clientHeight
      ) {
        dropdownList.scrollTop += itemHeight;
      }
    }
  }
  op.value = index;
  focusBtn();
};

// Calcular ubicación (arriba o abajo)
const isNearBottom = (idContainer, idParent) => {
  const hParent = JSON.parse(JSON.stringify(props.heightParent)).replace(
    "px",
    ""
  );
  const hContainer = JSON.parse(JSON.stringify(props.maxheihtContent)).replace(
    "px",
    ""
  );

  const threshold = Number(hParent) + Number(hContainer);

  const container = document.getElementById(idContainer);
  const parent = document.getElementById(idParent);

  if (!container || !parent) {
    console.error("Elementos no encontrados.");
    return false;
  }

  const containerRect = container.getBoundingClientRect();
  const parentRect = parent.getBoundingClientRect();

  const containerVisibleHeight = container.clientHeight;

  const parentOffsetTop = parentRect.top - containerRect.top;

  const distanceFromBottom =
    containerVisibleHeight - (parentOffsetTop + parent.clientHeight);

  return distanceFromBottom < threshold - 10;
};

// Agregar y eliminar event listener
onMounted(() => {
  document.addEventListener("click", handleClickOutside);
  goToDropdownLocal();
  positions.value = getPositionRelativeToContainer(props.idParent.replace("#", ""), props.idContainer);

  const containerElement = document.getElementById(props.idParent.replace("#", ""));
  widthParent.value = props.widthParent !== "" ? props.widthParent : `${Number(containerElement.clientWidth)}px`;
});
onBeforeUnmount(() => {
  document.removeEventListener("click", handleClickOutside);
});

// Entrar de Dropdown
const goToDropdownLocal = () => {
  const isBottom = isNearBottom(
    props.idContainer,
    props.idParent.replace("#", "")
  );
  isBottomDropdown.value = isBottom;
  emit("isBottomDropdown", isBottom);
};

// focus
const focusBtn = () => {
  const btnId = `dropdown-op${op.value}`;
  const btn = document.getElementById(btnId);
  if (btn) {
    btn.focus();
  }
};

const getPositionRelativeToContainer = (idParent, idContainer) => {
  const parentElement = document.getElementById(idParent);
  const containerElement = document.getElementById(idContainer);

  if (!parentElement || !containerElement) {
    console.error("Elementos no encontrados. Verifica los IDs.");
    return null;
  }

  // Coordenadas relativas al contenedor principal
  let offsetX = parentElement.offsetLeft;
  let offsetY = parentElement.offsetTop;

  // Recorrer hacia arriba desde el idParent hasta el idContainer
  let currentElement = parentElement.offsetParent;

  while (currentElement && currentElement !== containerElement) {
    offsetX += currentElement.offsetLeft - (currentElement.scrollLeft || 0);
    offsetY += currentElement.offsetTop - (currentElement.scrollTop || 0);

    currentElement = currentElement.offsetParent;
  }

  if (currentElement !== containerElement) {
    console.error("El idParent no está contenido dentro del idContainer.");
    return null;
  }

  // Ajustar según el scroll del contenedor principal
  offsetX -= containerElement.scrollLeft || 0;
  offsetY -= containerElement.scrollTop || 0;
  
  if(isBottomDropdown.value) {
    // top
    const hContainer = Number(containerElement.clientHeight);
    const axes = { x: `${offsetX}px`, y: `${ hContainer - offsetY}px` };
    return axes;
  } else {
    // bottom
    const hParent = Number(parentElement.clientHeight);
    const axes = { x: `${offsetX}px`, y: `${offsetY + Number(hParent) + 2}px` };
    return axes;
  }

};
</script>

<template>
  <div
    class="dropdown"
    v-if="props.idParent !== ''"
    :class="isBottomDropdown ? 'bottom' : 'top'"
  >
    <div class="dropdown__list" id="dropdown__list">
      <div v-if="props.loading" class="dropdown__additionalText">
        <u-loading :width="18" />
        <span>Cargando...</span>
      </div>
      <template v-else>
        <button
          v-for="(item, index) in list"
          :key="index"
          class="dropdown__item truncateText"
          :id="`dropdown-op${index}`"
          @click="dropdownSelect(item)"
          @keydown="changeOp(index, $event)"
        >
          <slot v-if="customOptionStyle" name="cell" :item="item" />
          <span v-else>{{ item.label }}</span>
        </button>
        <div class="dropdown__additionalText" v-if="list.length === 0">
          <span>Sin Resultados</span>
        </div>
      </template>
    </div>
  </div>
</template>

<style scoped>
.dropdown {
  position: absolute;
  z-index: 99;
  background-color: var(--neutral-background-default);
  width: v-bind("widthParent");
  height: auto;
  padding: 5px;
  border-radius: 8px;
  box-shadow: var(--shadow-5);
  overflow-y: hidden;
  left: v-bind("positions.x");
}

.dropdown.top {
  top: v-bind("positions.y");
  /* top: v-bind("heightParent"); */
}

.dropdown.bottom {
  bottom: v-bind("positions.y");
  /* bottom: v-bind("heightParent"); */
}

.dropdown__list {
  width: 100%;
  height: auto;
  max-height: v-bind("props.maxheihtContent") !important;
  overflow-y: hidden;
  display: flex;
  flex-direction: column;
  padding-right: 2px;
}

.dropdown__list::-webkit-scrollbar {
  width: 7px;
  height: 7px;
}

.dropdown__list::-webkit-scrollbar-thumb {
  border-radius: 5px;
  background-color: var(--neutral-border-default);
}

.dropdown__list::-webkit-scrollbar-track {
  background-color: var(--neutral-border-subtle);
  border-radius: 4px;
}

.dropdown__item {
  height: 32px;
  width: 100%;
  text-align: left;
  padding: 0 10px;
  border-radius: 6px;
  flex-shrink: 0;
  transition: 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

.dropdown__item:focus {
  background-color: var(--primary-surface-shadow-8a);
}

.dropdown__additionalText {
  height: 32px;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 10px;
}

.dropdown__additionalText span, button span {
  color: var(--neutral-text-body);
  font-family: Nunito;
  font-size: 16px;
  font-weight: 400;
  line-height: 20px;
  text-align: left;
  text-underline-position: from-font;
  text-decoration-skip-ink: none;
}
</style>
