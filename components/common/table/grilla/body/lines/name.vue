<script setup>
import { ref, computed } from "vue";
import { defineProps } from "vue";
import { useI18n } from "vue-i18n";
import { debounce } from "@/utils/helpers";
import useGrillaStore from "@/stores/grilla";
import useLinesStore from "@/stores/lines";
import usePermissionsStore from "@/stores/permissions";
import useIncomesStore from "@/stores/incomes";

// Stores
const grillaStore = useGrillaStore();
const linesStore = useLinesStore();
const permissionsStore = usePermissionsStore();
const incomesStore = useIncomesStore();

const props = defineProps({
  index: Number,
  id: String,
  config: {
    type: Object,
    default: () => ({})
  },
  line: {
    type: Object,
    default: () => ({}),
  },
});

// Computed (memoizados eficientemente)
const isParent = props.config?.type === "category";
const level = props.config?.level || 1;
const index = computed(() => linesStore.lines.findIndex(l => l.__id === props.line.data.__id));

const { t } = useI18n();
const module = "grilla.body.lines.titles";
const disabled = computed(() => !props?.line?.data?._id || props?.line?.data?.__deleting || grillaStore.updating);
const observation = computed(() => (props?.line?.data?.observation?.trim()));
const name = computed(() => props?.line?.data?.name || '');
const titles = computed(() => { 
  return {
    info: t(`${module}.info`),
    folder: t(`${module}.collapse`),
    back: t(`${module}.back`),
    next: t(`${module}.next`),
  } 
});
const hollywood = computed(() => incomesStore.hollywood);

// Clases estáticas: calculadas una vez y no reactivas
const staticClasses = computed(() => {
  const hasObs = !!observation.value;
  const lvl = (hollywood.value && grillaStore.breadcrumb.length > 1) ? (props.line?.data?.superParent ? 1 : 2) : level;
  const parent = isParent;
  
  return {
    name: true,
    'is-parent': parent,
    'has-observation': hasObs,
    [`level-${lvl}`]: true
  };
});

// Constants
const initialValue = ref(null);

const debouncedSearch = debounce(async (value, index, isParent) => {
  await linesStore.searchForLineNames(value, isParent);
  linesStore.loadingSearch = false;
}, 300);

const findLinesByName = (e) => {
  const value = e.target.value.trim();
  const isParent = props?.line?.data?.isParent;

  grillaStore.posDropdown = props.index; // Con referencia al VirtualScroll - virtual
  grillaStore.posDropdownReal = index.value; // Con referencia al Array - real 
  props.line.data.name = value; // ✅ se actualiza directamente el objeto reactivo

  if (value !== "") {
    linesStore.loadingSearch = true;
    debouncedSearch(value, index.value, isParent);
  } else {
    linesStore.loadingSearch = false;
  }
};

const updatedLine = async () => {
  const line = props.line.data;
  if (line.name.trim() !== "" && line.name !== initialValue.value) {
    if (!line._id) await linesStore.upsertLine(line);
    else await linesStore.updateSurchargeName(line);
  }
  initialValue.value = null;
};

const validNavigation = async (event) => {
  const key = event.key;
  const config = { e: event, id: props.id, type: "name", index: index.value, oldValue: initialValue.value };
  
  if (["ArrowDown","ArrowUp"].includes(key) && grillaStore.posDropdown !== null) {
    if ((grillaStore.isBottomDropdown && key === "ArrowUp") || (!grillaStore.isBottomDropdown && key === "ArrowDown")) {
      const line = linesStore?.lines?.[index.value] || {};
      grillaStore.goToDropdown = false;
      grillaStore.posDropdown = null;
      grillaStore.posDropdownReal = null;
      grillaStore.startCloudSync();
      updatedLine(line);
      grillaStore.navigateGridInputs(config);
    } else {
      grillaStore.goToDropdown = true;
    }
  } else {
    const validKeys = ["ArrowUp","ArrowDown","ArrowLeft","ArrowRight","Enter","Tab","Shift","Control","Escape"];
    if (validKeys.includes(key)) {
      // Si me muevo a los lados y aun no se crea
      const line = linesStore?.lines?.[index.value] || {};
      if(["ArrowLeft","ArrowRight"].includes(key) && line._id === "" && line.name.trim() !== ""){
        grillaStore.goToDropdown = false;
        grillaStore.posDropdown = null;
        grillaStore.startCloudSync();
        updatedLine(line);
        const input = document.getElementById(props.id);
        if (input) input.disabled = true;
        grillaStore.navigateGridInputs(config); 
        if (input) input.disabled = false;
      } else {
        grillaStore.navigateGridInputs(config);
        grillaStore.goToDropdown = false;
        grillaStore.posDropdown = null;
      }
    }
  }
};

// Pre-calcular valores que no cambian
const showIndentMarkerY = computed(() => level >= 2);
const showIndentMarkerX = computed(() => !isParent && level > 1);

const showModal = (type = 'info') => {
  let line = props.line;
  linesStore.line = line.data;
  linesStore.switches = [];
  linesStore.switchesBudget = [];
  for (let i = 0; i < linesStore.linesSurcharges.length; i++) {
    const existsIncome = line.data.surchargesLines.includes(
      linesStore.linesSurcharges[i]._id
    );
    const existsBudget = line.data.surchargesLinesBudget?.includes(
      linesStore.linesSurcharges[i]._id
    );
    linesStore.switches.push(existsIncome);
    linesStore.switchesBudget.push(existsBudget);
  }
  linesStore.calculateTotalLine();

  grillaStore.showModalType = "infoLine";
  grillaStore.showModal = true;
  grillaStore.showModalPosition = "right";

  grillaStore.configModalInfoLine.data = props.line.data;
  grillaStore.configModalInfoLine.index = index.value;

  if(type === 'observation') grillaStore.configModalInfoLine.defaultTab = "details";

};
</script>

<template>
  <td 
    :style="grillaStore.getColumnStyle('name')" 
    :class="{ 'body-fixed-column-3': grillaStore.fixed }">
    <div :class="staticClasses">
      <div v-once v-if="showIndentMarkerY" class="indent-marker-y"></div>
      <div v-once v-if="showIndentMarkerX" class="indent-marker-x"></div>
      
      <template v-if="isParent" >
        <button 
          v-if="hollywood"
          :class="`folder u u-${props.line.data.superParent ? 'chevron-up' : 'folder'}`" 
          :disabled="disabled" 
          :title="props.line.data.superParent ? titles.back : titles.next" 
          @click="grillaStore.goToParent(props.line.data)"
        ></button>
        <button 
          v-else
          :class="`folder u u-folder${props.line.data.expand ? '-open' : ''}`" 
          :disabled="disabled" 
          :title="titles.folder"
          @click="grillaStore.filterParent(props.line.data)"
        ></button>
      </template>
      
      <input 
        type="text" 
        :value="name" 
        :id="props.id"
        :disabled="!permissionsStore?.myPermissions?.income__grid_line_modify_name || props?.line?.data?.__deleting || grillaStore.updating"
        autocomplete="off"
        @focus="initialValue = props?.line?.data?.name?.trim() || ''"
        @input="findLinesByName($event)"
        @keydown="validNavigation"
      />
      
      <span v-if="isParent" class="number">
        ({{ incomesStore.hollywood ? line.data.numberChildren : linesStore.countParents(line.data.__id) }})</span>
      
      <button 
        v-if="observation" 
        class="message u u-message" 
        :title="observation" 
        @click="showModal('observation')"
        :disabled="!permissionsStore?.myPermissions?.income__grid_line_modify_name || grillaStore?.loadings?.surcharges || disabled"
      ></button>
      
      <button 
        class="info u u-info" 
        :title="titles.info" 
        @click="showModal('info')"
        :disabled="!permissionsStore?.myPermissions?.income__grid_line_modify_name || grillaStore?.loadings?.surcharges || disabled"
      ></button>
    </div>
  </td>
</template>

<style scoped>
td {
  border-right: 2px solid var(--neutral-border-subtle);
}

.name {
  height: 100%;
  width: 100%;
  display: flex;
  align-items: center;
  position: relative;
}

/* Padding para inputs - Padres con observación */
.name.is-parent.has-observation.level-1 input { 
  padding: 0 76px 0 0; 
  margin-left: 32px;
  width: calc(100% - 32px);
}
.name.is-parent.has-observation.level-2 input { 
  padding: 0 76px 0 0; 
  margin-left: 48px;
  width: calc(100% - 48px);
}
.name.is-parent.has-observation.level-3 input { 
  padding: 0 76px 0 0; 
  margin-left: 64px;
  width: calc(100% - 64px);
}

/* Padding para inputs - Padres sin observación */
.name.is-parent:not(.has-observation).level-1 input { 
  padding: 0 54px 0 0; 
  margin-left: 32px;
  width: calc(100% - 32px);
}
.name.is-parent:not(.has-observation).level-2 input { 
  padding: 0 54px 0 0; 
  margin-left: 48px;
  width: calc(100% - 48px);
}
.name.is-parent:not(.has-observation).level-3 input { 
  padding: 0 54px 0 0; 
  margin-left: 64px;
  width: calc(100% - 64px);
}

/* Padding para inputs - Hijos con observación */
.name:not(.is-parent).has-observation.level-1 input { 
  padding: 0 58px 0 12px; 
  width: 100%;
}
.name:not(.is-parent).has-observation.level-2 input { 
  padding: 0 58px 0 0; 
  margin-left: 32px;
  width: calc(100% - 32px);
}
.name:not(.is-parent).has-observation.level-3 input { 
  padding: 0 58px 0 0; 
  margin-left: 48px;
  width: calc(100% - 48px);
}
.name:not(.is-parent).has-observation.level-4 input { 
  padding: 0 58px 0 0; 
  margin-left: 64px;
  width: calc(100% - 64px);
}

/* Padding para inputs - Hijos sin observación */
.name:not(.is-parent):not(.has-observation).level-1 input { 
  padding: 0 36px 0 12px;
  width: 100%; 
}
.name:not(.is-parent):not(.has-observation).level-2 input { 
  padding: 0 36px 0 0;
  margin-left: 32px;
  width: calc(100% - 32px);
}
.name:not(.is-parent):not(.has-observation).level-3 input { 
  padding: 0 36px 0 0; 
  margin-left: 48px;
  width: calc(100% - 48px);
}
.name:not(.is-parent):not(.has-observation).level-4 input { 
  padding: 0 36px 0 0; 
  margin-left: 64px;
  width: calc(100% - 64px);
}

/* Posición del botón folder según nivel */
.name.is-parent.level-1 .folder { left: 12px; }
.name.is-parent.level-2 .folder { left: 28px; }
.name.is-parent.level-3 .folder { left: 44px; }
.name:not(.is-parent) .folder { left: -9999px; }

/* Posición del número según observación */
.name.has-observation .number { right: 52px; }
.name:not(.has-observation) .number { right: 32px; }

/* Indentación base */
.name .indent-marker-y {
  display: none;
  position: absolute;
  width: 1px;
  height: calc(100% + 1px);
  top: -50%;
  transform-origin: center;
  background: var(--primary-border-subtle);
}

/* Mostrar línea según nivel */
.name:is(.level-2, .level-3, .level-4) .indent-marker-y {
  display: block;
  left: 18px;
}
.name.level-3 .indent-marker-y::after,
.name.level-4 .indent-marker-y::after {
  content: "";
  position: absolute;
  display: block;
  width: 1px;
  height: 100%;
  background: var(--primary-border-subtle);
  left: 16px;
  top: 0%;
}
.name.level-4 .indent-marker-y::before {
  content: "";
  position: absolute;
  display: block;
  width: 1px;
  height: 100%;
  background: var(--primary-border-subtle);
  left: 32px;
  top: 0%;
}

.name .indent-marker-x {
  position: absolute;
  width: 8px;
  height: 1px;
  top: 50%;
  transform-origin: center;
  background: var(--primary-border-subtle);
}
.name.level-2:not(.is-parent) .indent-marker-x { 
  left: 18px; 
}
.name.level-2 .indent-marker-x { 
  left: 18px; 
  width: 6px;
}
.name.level-3 .indent-marker-x { 
  left: 34px; 
  width: 6px;
}
.name.level-4 .indent-marker-x { 
  left: 50px; 
  width: 6px;
}

/* Estilos base del input */
.name input {
  width: 100%;
  height: 100%;
  background-color: transparent;
  color: var(--neutral-text-body);
  font-size: 12px;
  line-height: 12px;
  font-weight: 600;
}

.name input:not(:disabled):active,
.name input:not(:disabled):focus {
  background-color: var(--neutral-background-default); 
  box-shadow: inset 0px 0px 0px 2px rgba(58, 199, 165, 1); 
  color: var(--neutral-text-body); 
  padding: 0 12px !important;
}

.name input:disabled {
  cursor: not-allowed;
}

.name input::selection {
  background-color: var(--primary-text-subtle);
  color: var(--neutral-background-default);
}

/* Elementos posicionados absolutamente */
.name span.number,
.name button.info,
.name button.message,
.name button.folder {
  position: absolute;
}

.name .number {
  color: var(--secondary-text-subtle);
  font-size: 11px;
  font-weight: 600;
  line-height: 11px;
}

.name button.message,
.name button.info {
  font-size: 14px;
  font-weight: 400;
  line-height: 14px;
  width: 20px;
  height: auto;
  transition: color .3s;
}

.name button.info {
  right: 8px;
  color: var(--neutral-text-caption);
}

.name button.message {
  right: 28px;
  color: var(--primary-text-default);
}

.name button.folder{
  z-index: 1;
  color: var(--neutral-text-body);
  font-size: 14px;
  font-weight: 600;
  line-height: 14px;
  width: 14px;
  height: auto;
  transition: color .3s;
}

.name .message,
.name .number,
.name .info {
  transition: opacity 0.15s ease;
}

.name .folder:disabled,
.name .info:disabled {
  cursor: not-allowed;
}

.name input:focus ~ .message,
.name input:focus ~ .number,
.name input:focus ~ .info {
  opacity: 0;
  pointer-events: none;
}

.name button:disabled,
.name input:disabled {
  cursor: not-allowed;
  color: var(--neutral-text-disabled);
}
</style>