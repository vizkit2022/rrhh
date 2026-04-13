<script setup>
import { ref, computed } from "vue";
import useUserStore from "@/stores/user";

// STORES
const userStore = useUserStore();

// Helpers: separador de miles chileno
const formatCLP = (n) => {
  if (!n && n !== 0) return "";
  const num = parseInt(String(n).replace(/\D/g, "")) || 0;
  return num.toLocaleString("es-CL");
};
const parseCLP = (v) =>
  parseInt(String(v).replace(/\./g, "").replace(/,/g, "").replace(/\D/g, "")) || 0;

const onMoneyInput = (field, event) => {
  if (!userStore.dataSheet.data.laboral) return;
  userStore.dataSheet.data.laboral[field] = parseCLP(event.target.value);
  userStore.dataSheet.change = true;
};

// Ensure laboral object is always accessible
const laboral = computed(() => userStore.dataSheet.data?.laboral || {});

// Options
const tipoContratoOptions = [
  { label: "Indefinido", icon: "briefcase", value: "indefinido" },
  { label: "Plazo Fijo", icon: "calendar", value: "plazo_fijo" },
  { label: "Por Proyecto", icon: "work", value: "proyecto" },
];

const afpOptions = [
  { label: "AFP Capital", icon: "", value: "AFP Capital" },
  { label: "AFP Habitat", icon: "", value: "AFP Habitat" },
  { label: "AFP ProVida", icon: "", value: "AFP ProVida" },
  { label: "AFP Uno", icon: "", value: "AFP Uno" },
  { label: "AFP PlanVital", icon: "", value: "AFP PlanVital" },
  { label: "AFP Cuprum", icon: "", value: "AFP Cuprum" },
];

const saludOptions = [
  { label: "FONASA", icon: "", value: "FONASA" },
  { label: "ISAPRE", icon: "", value: "ISAPRE" },
];

const gratificacionOptions = [
  { label: "Mensual (Art. 50)", icon: "", value: "mensual" },
  { label: "Anual (Art. 47)", icon: "", value: "anual" },
];

// Label helpers
const getLabelTipoContrato = computed(() => {
  const opt = tipoContratoOptions.find((o) => o.value === laboral.value.tipo_contrato);
  return opt?.label || "";
});
const getLabelAfp = computed(() => laboral.value.afp || "-");
const getLabelSalud = computed(() => laboral.value.sistema_salud || "-");
const getLabelGratificacion = computed(() => {
  const opt = gratificacionOptions.find((o) => o.value === laboral.value.gratificacion);
  return opt?.label || "";
});

const isView = computed(() => userStore.dataSheet.state === "show");
</script>

<template>
  <div class="cover__content" v-if="userStore.dataSheet.data?.laboral !== undefined">

    <!-- Card 1: Datos del Contrato -->
    <div class="card">
      <div class="card__header">
        <h2>Datos del Contrato</h2>
      </div>
      <div class="card__list">

        <!-- Tipo de Contrato -->
        <div class="card__item">
          <div class="card__item-sup">
            <span class="u u-work"></span>
            <span class="label">Tipo</span>
            <div class="card__item-input">
              <u-select
                v-if="!isView"
                :options="tipoContratoOptions"
                size="s"
                placeholder="Selecciona el tipo"
                v-model="laboral.tipo_contrato"
                @update:modelValue="userStore.dataSheet.change = true"
              />
              <span v-else class="text truncateText">{{ getLabelTipoContrato || "-" }}</span>
            </div>
          </div>
        </div>

        <!-- Fecha de Ingreso -->
        <div class="card__item">
          <div class="card__item-sup">
            <span class="u u-calendar"></span>
            <span class="label">Ingreso</span>
            <div class="card__item-input">
              <u-input
                v-if="!isView"
                type="date"
                size="s"
                v-model="laboral.fecha_ingreso"
                @input="userStore.dataSheet.change = true"
              />
              <span v-else class="text truncateText">
                {{ laboral.fecha_ingreso ? new Date(laboral.fecha_ingreso).toLocaleDateString("es-CL") : "-" }}
              </span>
            </div>
          </div>
        </div>

        <!-- Fecha de Término -->
        <div class="card__item" v-if="laboral.tipo_contrato !== 'indefinido'">
          <div class="card__item-sup">
            <span class="u u-calendar"></span>
            <span class="label">Término</span>
            <div class="card__item-input">
              <u-input
                v-if="!isView"
                type="date"
                size="s"
                v-model="laboral.fecha_termino"
                @input="userStore.dataSheet.change = true"
              />
              <span v-else class="text truncateText">
                {{ laboral.fecha_termino ? new Date(laboral.fecha_termino).toLocaleDateString("es-CL") : "-" }}
              </span>
            </div>
          </div>
        </div>

        <!-- Cargo -->
        <div class="card__item">
          <div class="card__item-sup">
            <span class="u u-role"></span>
            <span class="label">Cargo</span>
            <div class="card__item-input">
              <u-input
                v-if="!isView"
                size="s"
                placeholder="Ej: Director de Arte"
                v-model="laboral.cargo"
                @input="userStore.dataSheet.change = true"
              />
              <span v-else class="text truncateText">{{ laboral.cargo || "-" }}</span>
            </div>
          </div>
        </div>

        <!-- Departamento -->
        <div class="card__item">
          <div class="card__item-sup">
            <span class="u u-building"></span>
            <span class="label">Área</span>
            <div class="card__item-input">
              <u-input
                v-if="!isView"
                size="s"
                placeholder="Ej: Arte"
                v-model="laboral.departamento"
                @input="userStore.dataSheet.change = true"
              />
              <span v-else class="text truncateText">{{ laboral.departamento || "-" }}</span>
            </div>
          </div>
        </div>

      </div>
    </div>

    <!-- Card 2: Remuneraciones -->
    <div class="card">
      <div class="card__header">
        <h2>Remuneraciones</h2>
      </div>
      <div class="card__list">

        <!-- Sueldo Base -->
        <div class="card__item">
          <div class="card__item-sup">
            <span class="u u-money"></span>
            <span class="label">Sueldo</span>
            <div class="card__item-input">
              <div v-if="!isView" class="moneyInput">
                <span class="moneyInput__prefix">$</span>
                <input
                  class="moneyInput__field"
                  :value="formatCLP(laboral.sueldo_base)"
                  @input="onMoneyInput('sueldo_base', $event)"
                  placeholder="0"
                  inputmode="numeric"
                />
              </div>
              <span v-else class="text truncateText">
                {{ laboral.sueldo_base ? `$${formatCLP(laboral.sueldo_base)}` : "-" }}
              </span>
            </div>
          </div>
        </div>

        <!-- Movilización -->
        <div class="card__item">
          <div class="card__item-sup">
            <span class="u u-car"></span>
            <span class="label">Movil.</span>
            <div class="card__item-input">
              <div v-if="!isView" class="moneyInput">
                <span class="moneyInput__prefix">$</span>
                <input
                  class="moneyInput__field"
                  :value="formatCLP(laboral.movilizacion)"
                  @input="onMoneyInput('movilizacion', $event)"
                  placeholder="0"
                  inputmode="numeric"
                />
              </div>
              <span v-else class="text truncateText">
                {{ laboral.movilizacion ? `$${formatCLP(laboral.movilizacion)}` : "-" }}
              </span>
            </div>
          </div>
        </div>

        <!-- Colación -->
        <div class="card__item">
          <div class="card__item-sup">
            <span class="u u-food"></span>
            <span class="label">Colación</span>
            <div class="card__item-input">
              <div v-if="!isView" class="moneyInput">
                <span class="moneyInput__prefix">$</span>
                <input
                  class="moneyInput__field"
                  :value="formatCLP(laboral.colacion)"
                  @input="onMoneyInput('colacion', $event)"
                  placeholder="0"
                  inputmode="numeric"
                />
              </div>
              <span v-else class="text truncateText">
                {{ laboral.colacion ? `$${formatCLP(laboral.colacion)}` : "-" }}
              </span>
            </div>
          </div>
        </div>

        <!-- Gratificación -->
        <div class="card__item">
          <div class="card__item-sup">
            <span class="u u-plus"></span>
            <span class="label">Gratif.</span>
            <div class="card__item-input">
              <u-select
                v-if="!isView"
                :options="gratificacionOptions"
                size="s"
                placeholder="Selecciona"
                v-model="laboral.gratificacion"
                @update:modelValue="userStore.dataSheet.change = true"
              />
              <span v-else class="text truncateText">{{ getLabelGratificacion || "-" }}</span>
            </div>
          </div>
        </div>

      </div>
    </div>

    <!-- Card 3: Previsión -->
    <div class="card">
      <div class="card__header">
        <h2>Previsión Social</h2>
      </div>
      <div class="card__list">

        <!-- AFP -->
        <div class="card__item">
          <div class="card__item-sup">
            <span class="u u-shield"></span>
            <span class="label">AFP</span>
            <div class="card__item-input">
              <u-select
                v-if="!isView"
                :options="afpOptions"
                size="s"
                placeholder="Selecciona AFP"
                v-model="laboral.afp"
                @update:modelValue="userStore.dataSheet.change = true"
              />
              <span v-else class="text truncateText">{{ getLabelAfp }}</span>
            </div>
          </div>
        </div>

        <!-- Sistema de Salud -->
        <div class="card__item">
          <div class="card__item-sup">
            <span class="u u-health"></span>
            <span class="label">Salud</span>
            <div class="card__item-input">
              <u-select
                v-if="!isView"
                :options="saludOptions"
                size="s"
                placeholder="FONASA / ISAPRE"
                v-model="laboral.sistema_salud"
                @update:modelValue="userStore.dataSheet.change = true"
              />
              <span v-else class="text truncateText">{{ getLabelSalud }}</span>
            </div>
          </div>
        </div>

        <!-- Días de vacaciones -->
        <div class="card__item">
          <div class="card__item-sup">
            <span class="u u-sun"></span>
            <span class="label">Vacac.</span>
            <div class="card__item-input">
              <u-input
                v-if="!isView"
                size="s"
                type="number"
                placeholder="15"
                v-model.number="laboral.vacaciones_dias"
                @input="userStore.dataSheet.change = true"
              />
              <span v-else class="text truncateText">
                {{ laboral.vacaciones_dias != null ? `${laboral.vacaciones_dias} días` : "-" }}
              </span>
            </div>
          </div>
        </div>

      </div>
    </div>

  </div>
  <div v-else class="cover__empty">
    <span>Cargando información de contrato...</span>
  </div>
</template>

<style scoped>
.cover__content {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  overflow-x: auto;
  padding: 0 2px 2px 0;
  width: 100%;
  height: 100%;
}
.cover__content::-webkit-scrollbar {
  height: 8px;
  width: 8px;
  background: var(--neutral-surface-light);
  border-radius: 20px;
}
.cover__content::-webkit-scrollbar-thumb {
  background: var(--neutral-surface-subtle);
  border-radius: 5px;
}
.cover__empty {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  color: var(--neutral-text-body);
  font-size: 13px;
}

/* Card */
.card {
  background-color: var(--neutral-surface-softer);
  display: flex;
  flex-direction: column;
  gap: 10px;
  border-radius: 16px;
  padding: 12px;
}
.card__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 36px;
}
.card h2 {
  font-size: 14px;
  font-weight: 600;
  line-height: 18px;
  color: var(--neutral-text-body);
}
.card__list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  overflow-y: auto;
  height: 100%;
  padding-right: 2px;
}
.card__list::-webkit-scrollbar {
  width: 8px;
  background: var(--neutral-surface-light);
  border-radius: 20px;
}
.card__list::-webkit-scrollbar-thumb {
  background: var(--neutral-surface-subtle);
  border-radius: 5px;
}
.card__item {
  display: flex;
  flex-direction: column;
  gap: 5px;
  padding: 0 8px 0 10px;
  box-sizing: border-box;
  border-radius: 8px;
  background-color: var(--neutral-background-default);
}
.card__item-sup {
  display: flex;
  align-items: center;
  gap: 16px;
  height: 48px;
}
.card__item span.u {
  width: 8px;
  color: var(--neutral-text-caption);
  font-size: 16px;
  line-height: 16px;
  margin-top: -1px !important;
}
.card__item span.label {
  width: 60px;
  font-size: 12px;
  font-weight: 600;
  line-height: 12px;
  color: var(--neutral-text-caption);
}
.card__item span.text {
  width: 100%;
  font-size: 14px;
  font-weight: 600;
  line-height: 18px;
  color: var(--neutral-text-caption);
  padding-left: 12px;
}
.card__item-input {
  flex-grow: 1;
  width: 220px;
  display: flex;
  align-items: center;
  justify-content: flex-end;
}
.card__item-input::v-deep(.containerInput),
.card__item-input::v-deep(.containerSearch),
.card__item-input::v-deep(.containerSelect) {
  width: 100%;
}
.card__item-input::v-deep(.containerInput input),
.card__item-input::v-deep(.containerSearch input) {
  border: var(--neutral-background-default) 1px solid !important;
}

/* Money input */
.moneyInput {
  display: flex;
  align-items: center;
  background: var(--neutral-background-strong);
  border: 1px solid var(--neutral-background-default);
  border-radius: 8px;
  padding: 0 10px;
  height: 32px;
  width: 100%;
  box-sizing: border-box;
  transition: border 0.15s;
}
.moneyInput:focus-within {
  border-color: var(--primary-surface-default);
}
.moneyInput__prefix {
  font-family: Nunito;
  font-size: 13px;
  font-weight: 700;
  color: var(--neutral-text-body);
  margin-right: 4px;
  user-select: none;
}
.moneyInput__field {
  flex: 1;
  background: transparent;
  border: none;
  outline: none;
  font-family: Nunito;
  font-size: 13px;
  font-weight: 700;
  color: var(--neutral-text-title);
  text-align: right;
  width: 100%;
}
.moneyInput__field::placeholder {
  color: var(--neutral-text-body);
  font-weight: 400;
}

h2, span {
  font-family: Nunito;
}
</style>
