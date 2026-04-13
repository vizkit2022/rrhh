<script setup>
import useGrillaStore from "@/stores/grilla";

// STORES
const grillaStore = useGrillaStore();

// Constants
const { t } = useI18n();
const uiLabel = "grilla.dialogs.settings";
const templateDef = grillaStore.template;
const labels = {
  incomes: {
    name: t(uiLabel + '.incomes.name'),
    icon: "invoice",
    subcolumns: {
      amount1: {
        name: t(uiLabel + '.incomes.subcolumns.amount1.name'),
        text: t(uiLabel + '.incomes.subcolumns.amount1.text')
      },
      amount2: {
        name: t(uiLabel + '.incomes.subcolumns.amount2.name'),
        text: t(uiLabel + '.incomes.subcolumns.amount2.text')
      },
      amount3: {
        name: t(uiLabel + '.incomes.subcolumns.amount3.name'),
        text: t(uiLabel + '.incomes.subcolumns.amount3.text')
      },
      unit: {
        name: t(uiLabel + '.incomes.subcolumns.unit.name')
      },
      base: {
        name: t(uiLabel + '.incomes.subcolumns.base.name')
      },
      rate: {
        name: t(uiLabel + '.incomes.subcolumns.rate.name'),
      },
      overTime1: {
        name: t(uiLabel + '.incomes.subcolumns.overTime1.name')
      },
      overTime2: {
        name: t(uiLabel + '.incomes.subcolumns.overTime2.name'),
      },
      overTime3: {
        name: t(uiLabel + '.incomes.subcolumns.overTime3.name'),
      },
      price: {
        name: t(uiLabel + '.incomes.subcolumns.price.name')
      },
      sumPrice: {
        name: t(uiLabel + '.incomes.subcolumns.sumPrice.name')
      }
    }
  },
  budget: {
    name: t(uiLabel + '.budget.name'),
    icon: "calculator",
    subcolumns: {
      budgetAmount1: {
        name: t(uiLabel + '.budget.subcolumns.budgetAmount1.name'),
        text: t(uiLabel + '.budget.subcolumns.budgetAmount1.text')
      },
      budgetAmount2: {
        name: t(uiLabel + '.budget.subcolumns.budgetAmount2.name'),
        text: t(uiLabel + '.budget.subcolumns.budgetAmount2.text')
      },
      budgetAmount3: {
        name: t(uiLabel + '.budget.subcolumns.budgetAmount3.name'),
        text: t(uiLabel + '.budget.subcolumns.budgetAmount3.text')
      },
      unitBudget: {
        name: t(uiLabel + '.budget.subcolumns.unitBudget.name')
      },
      budget: {
        name: t(uiLabel + '.budget.subcolumns.budget.name')
      },
      sumBudget: {
        name: t(uiLabel + '.budget.subcolumns.sumBudget.name')
      }
    }
  },
  outcomes: {
    name: t(uiLabel + '.outcomes.name'),
    icon: "shopping-cart",
    subcolumns: {
      cost: {
        name: t(uiLabel + '.outcomes.subcolumns.cost.name'),
      },
      toSpend: {
        name: t(uiLabel + '.outcomes.subcolumns.toSpend.name'),
      },
      efc: {
        name: t(uiLabel + '.outcomes.subcolumns.efc.name'),
        text: t(uiLabel + '.outcomes.subcolumns.efc.text'),
      },
    }
  },
  projected: {
    name: t(uiLabel + '.projected.name'),
    icon: "trend-up",
    subcolumns: {
      projectedMargin: {
        name: t(uiLabel + '.projected.subcolumns.projectedMargin.name'),
      },
      projectedUtility: {
        name: t(uiLabel + '.projected.subcolumns.projectedUtility.name'),
      },
      varianceMount: {
        name: t(uiLabel + '.projected.subcolumns.varianceMount.name'),
        text: t(uiLabel + '.projected.subcolumns.varianceMount.text'),
      },
      variancePerc: {
        name: t(uiLabel + '.projected.subcolumns.variancePerc.name'),
        text: t(uiLabel + '.projected.subcolumns.variancePerc.text'),
      },
    }
  }
}

// Functions
const showSubCols = (col) => {
  col.subcolumns.forEach(subcol => {
    subcol.show = col.show;
  });
};
const verifyShowSubCols = (col) => {
  col.show = col.subcolumns
    .filter(subcol => [templateDef, 'multiple'].includes(subcol.template))
    .some(subcol => subcol.show);
  // La por defecto siempre debe estar activa si se edita desde las opciones
  col.subcolumns.forEach(subcol => {
    if(subcol.default) subcol.show = true;
  })
};

</script>

<template>
  <div class="card">
    <div class="card_header general">
      <span class="u u-information icon"></span>
      <span class="title">{{ t(uiLabel + '.general.name') }}</span>
    </div>
    <div class="card_body">
      <div class="card_body-group">
        <u-switch v-model="grillaStore.configTemp.showCodeName" /><span>{{ t(uiLabel + '.general.code') }}</span>
        <u-switch v-model="grillaStore.configTemp.showIdName" /><span>{{ t(uiLabel + '.general.id') }}</span>
      </div>
    </div>
  </div>
  <div class="card" v-for="col in grillaStore.configTemp.columns.filter(c => c.available)" :key="col.prop">
    <div :class="`card_header ${col.prop}`">
      <span :class="`u u-${labels[col.prop].icon} icon`"></span>
      <span class="title">{{ labels[col.prop].name }}</span>
      <div :class="`tag ${col.show ? 'show' : ''}`">
        <span :class="`u u-${col.show ? 'show' : 'no-show'}`"></span>
        <span>{{ t(uiLabel + (col.show ? '.show' : '.noShow')) }}</span>  
      </div>
      <div></div>
      <u-switch v-model="col.show" @click="showSubCols(col)" />
    </div>
    <div class="card_body simple">
      <div class="card_body-group simple" v-for="subcol in col?.subcolumns?.filter(subcol => [templateDef, 'multiple'].includes(subcol.template))" :key="subcol.prop">
        <u-switch v-model="subcol.show" @click="verifyShowSubCols(col)" :disabled="subcol.default" /><span>{{ labels[col.prop].subcolumns[subcol.prop].name }}<strong v-if="labels[col.prop].subcolumns[subcol.prop].text">({{ labels[col.prop].subcolumns[subcol.prop].text }})</strong></span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.card {
  padding: 8px 16px;
  border: 1px solid var(--neutral-border-subtle);
  border-radius: 16px;
  display: grid;
  grid-template-rows: 40px auto;
  row-gap: 12px;
}
.card_header {
  display: grid;
  grid-template-columns: 20px auto auto 1fr auto;
  border-bottom: 1px solid var(--neutral-border-subtle);
  align-items: center;
  column-gap: 12px;
}
.card_header span.icon {
  font-size: 24px;
  line-height: 24px;
}
.card_header span.title {
  font-weight: 600;
  font-size: 14px;
  line-height: 14px;
  padding-top: 2px;
  letter-spacing: 0%;
  vertical-align: middle;
  color: var(--neutral-text-body);
}
.card_header div.tag {
    height: 24px;
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 0 16px;
    border-radius: 16px;
    font-size: 12px;
    font-weight: 600;
    background-color: var(--neutral-surface-light);
    color: var(--neutral-text-caption);
}
.card_header div.tag span:nth-child(1) {
    font-size: 16px;
}
.card_header div.tag.show {
    background-color: var(--info-surface-light);
    color: var(--info-text-darker);
}
.card_header.general span.icon {
  color: var(--secondary-text-subtle);
}
.card_header.incomes span.icon {
  color: var(--warning-text-subtle);
}
.card_header.budget span.icon {
  color: var(--info-text-subtle);
}
.card_header.outcomes span.icon {
  color: var(--danger-text-subtle);
}
.card_header.projected span.icon {
  color: var(--success-text-subtle);
}
.card_body {
  padding: 8px 12px 12px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.card_body.simple {
  padding: 8px 12px 12px;
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}
.card_body-group {
  display: grid;
  grid-template-columns: auto 1fr auto 1fr;
  column-gap: 12px;
  align-items: center;
}
.card_body-group.simple {
  display: grid;
  grid-template-columns: auto 1fr;
  column-gap: 12px;
  align-items: center;
}
.card_body-group span {
  font-weight: 400;
  font-size: 14px;
  line-height: 18px;
  letter-spacing: 0%;
  vertical-align: middle;
  color: var(--neutral-text-body);
}
.card_body-group span strong {
  font-weight: 400;
  font-size: 10px;
  line-height: 14px;
  letter-spacing: 10%;
  vertical-align: middle;
  text-transform: uppercase;
  color: var(--neutral-text-caption);
  margin-left: 5px;
}
</style>
