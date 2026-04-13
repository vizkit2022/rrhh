<script setup>
import { computed, ref } from 'vue';
import useOutcomesStore from "@/stores/outcomes";

import { capitalizeName } from "@/utils/helpers";

// Stores
const outcomesStore = useOutcomesStore();

// Vars
const showTotals = ref(true);

// Constants
const config = {
  header: {
    height: 40
  },
  item: {
    height: 40,
  },
  cols: [
    {
      name: {
        es: "F. Pago",
        en: "Reference",
      },
      flex: "left",
      width: "130px",
      show: true,
      prop: {
        text: "paymentDate",
      },
      type: "date",
      emit: {
        name: "showModalPayment",
      },
    },
    {
      name: { es: "Cuenta", en: "AvatarText" },
      flex: "left",
      width: "minmax(220px, 1fr)",
      prop: {
        name: "BancoName",
        src: "BancoUrl",
      },
      type: "avatarText",
      sizeAvatar: 32,
      emit: {
        name: "showModalPayment",
      },
    },
    {
      name: { es: "Tipo", en: "Sales" },
      flex: "left",
      width: "120px",
      prop: { text: "tipo" },
      type: "custom",
      slotName: "pill",
      emit: {
        name: "showModalPayment",
      },
    },
    {
      name: {
        es: "Pago",
        en: "To pay",
      },
      flex: "right",
      width: "minmax(200px, 1fr)",
      show: true,
      prop: {
        text: "subtotal/value",
      },
      type: "currency",
      emit: {
        name: "showModalPayment",
      },
    },
  ],
};
const { t } = useI18n();
const module = "modules.outcomes.pages.oc.sections.documents.modals.document.totals";

// Computed
const taxes = computed(() => outcomesStore.document_active.numbers);
</script>

<template>
    <div class="totales">
        <div class="card" v-if="false">
            <div class="card__box first">
                <span class="u u-invoice"></span>
                <span>Por Pagar</span>
                <span class="truncateText">$ 680.000</span>
            </div>
            <div class="card__box second">
                <span class="u u-invoice"></span>
                <span>Pagado</span>
                <span class="truncateText">$ 680.000</span>
            </div>
            <div class="card__action">
                <u-button @click="showTotals = !showTotals" type="outlined" :text="showTotals ? 'Ver Pagos' : 'Ver Totales'" icon="change" size="s" />
            </div>
        </div>
        <!-- <div class="card single">
            <div class="card__box">
                <span class="u u-invoice"></span>
                <span>Por Pagar</span>
                <span class="truncateText">Lorem ipsum dolor sit amet consectetur adipisicing elit. Ut necessitatibus nesciunt minus repudiandae similique aspernatur beatae, officia voluptatem, adipisci excepturi dolores iste et culpa cum. Officia fugit earum doloremque odit.</span>
            </div>
            <div class="card__action">
                <u-button type="outlined" text="Ir a la compra" icon="open" size="s" />
            </div>
        </div> -->
        <div class="taxes" v-show="showTotals">
            <div class="taxes__header">
                <span v-text="t(module + '.subtotal')"></span>
                <span v-text="taxes?.totalNet?.value" :title="taxes?.totalNet?.number"></span>
            </div>
            <div class="noTaxes" v-if="!taxes?.taxes?.length">
                <span v-text="t(module + '.noTaxes')"></span>
            </div>
            <div class="taxes__item" v-for="tax in taxes?.taxes || []" :key="tax.tax">
                <span class="truncateText" v-text="capitalizeName(tax?.name)"></span>
                <span v-text="tax?.total?.value" :title="tax?.total?.number"></span>
            </div>
            <div class="line"></div>
            <div class="taxes__subFooter">
                <span class="truncateText" v-text="t(module + '.taxes')"></span>
                <span v-text="taxes?.totalTaxAddition?.value" :title="taxes?.totalTaxAddition?.number"></span>
            </div>
            <div class="taxes__subFooter">
                <span class="truncateText" v-text="t(module + '.retention')"></span>
                <span v-text="taxes?.totalRetencion?.value" :title="taxes?.totalRetencion?.number"></span>
            </div>
            <div class="taxes__footer">
                <span v-text="t(module + '.totals')"></span>
                <span v-text="taxes?.total?.value" :title="taxes?.total?.number"></span>
            </div>
        </div>
        <TableBasic 
          v-show="!showTotals"
          :configTable="config" 
          :content="outcomesStore.document_active.payments"
          >
          <template v-slot:pill="item">
            <span :class="'bubble'">{{ item.item.paymentMethod.name }}</span>
          </template>
        </TableBasic>
    </div>
</template>

<style scoped>
.totales {
    display: flex;
    flex-direction: column;
    flex-shrink: 1;
    gap: 20px;
}
.card {
    border: 1px solid var(--neutral-border-subtle);
    border-radius: 8px;
    display: grid;
    grid-template-columns: 1fr 1fr 160px;
    padding: 12px 24px;
    box-sizing: border-box;
    gap: 24px;
}
.card.single {
    grid-template-columns: 1fr 190px;
}
.card__box {
    display: grid;
    grid-template-columns: 36px 1fr;
    grid-template-rows: 1fr 1fr;
    grid-template-areas: "vector label" "vector value";
    border-right: 1px solid var(--neutral-border-subtle);
    column-gap: 10px;
    align-items: center;
    padding-right: 24px;
}
.card__box span:nth-child(1) {
    grid-area: vector;
    width: 36px;
    height: 36px;
    border-radius: 50%;
    font-size: 22px;
    padding-left: 8px;
    padding-top: 6px;
}
.card__box.first span:nth-child(1) {
    background-color: var(--warning-surface-light);
    color: var(--warning-text-default);
}
.card__box.second span:nth-child(1) {
    background-color: var(--success-surface-light);
    color: var(--success-text-default);
}
.single .card__box span:nth-child(1) {
    background-color: var(--info-surface-light);
    color: var(--info-text-default);
}
.card__box span:nth-child(2) {
    grid-area: label;
    font-weight: 600;
    font-size: 14px;
    line-height: 18px;
    letter-spacing: 0%;
    vertical-align: middle;
    color: var(--neutral-text-caption);
}
.single .card__box span:nth-child(3) {
    color: var(--primary-text-default);
}
.card__box span:nth-child(3) {
    grid-area: value;
    font-weight: 600;
    font-size: 14px;
    line-height: 18px;
    letter-spacing: 0%;
    vertical-align: middle;
    color: var(--neutral-text-body);
}
.card__action {
    display: flex;
    align-items: center;
}
.card__action button {
    width: 100%;
}

/* Taxes */
.taxes {
    border: 1px solid var(--neutral-border-subtle);
    border-radius: 14px;
    padding: 16px 24px;
    display: flex;
    flex-direction: column;
    gap: 10px;
}
.taxes__header, .taxes__item, .taxes__footer,
.taxes__subFooter {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 20px;
    padding: 6px 24px;
}
.taxes__header {
    border-bottom: 1px solid var(--neutral-border-subtle);
}
.taxes__footer {
    background-color: var(--primary-surface-shadow-8a);
    border-radius: 14px;
    padding: 12px 24px;
}
.taxes__header span, .taxes__footer span,.taxes__subFooter span {
    font-weight: 800;
    font-size: 14px;
    line-height: 18px;
    letter-spacing: 0%;
    vertical-align: middle;
    color: var(--neutral-text-body);
}
.taxes__item span {
    font-weight: 600;
    font-size: 14px;
    line-height: 18px;
    letter-spacing: 0%;
    vertical-align: middle;
    color: var(--neutral-text-body);
}
.taxes__header span:nth-child(2),
.taxes__footer span:nth-child(2),
.taxes__item span:nth-child(2),
.taxes__subFooter span:nth-child(2) {
    text-align: right;
}
.line {
    width: 100%;
    height: 1px;
    background-color: var(--neutral-border-subtle);
}
.noTaxes {
    height: 48px;
    display: flex;
    align-items: center;
    justify-content: center;
}
.noTaxes span {
    color: var(--neutral-text-caption);
    font-size: 12px;
}

/* Tabla */

.bubble {
  color: var(--neutral-text-caption);
  background-color: var(--neutral-surface-light);
  padding: 4px 8px;
  border-radius: 12px;
  font-family: Nunito;
  font-size: 12px;
  font-weight: 600;
  line-height: 16px;
  text-align: left;
  align-content: center;
}
</style>