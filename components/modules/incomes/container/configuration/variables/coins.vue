  <script setup>
  import configTable from "@/utils/configTables/incomesConfiguration.json";

  // CONSTANTS

  const coins = ref([
      {
        orden: 1,
        name: "Peso Mexicano",
        code: "MXN",
        symbol: "$",
        format: "1,000.00",
        dayValue: "1",
        exchangeRate: "1",
        baseCurrency: true,
        used: 3,
        actions: "basurero"
      },
      {
        orden: 2,
        name: "Dólar Estado Unidense",
        code: "USD",
        symbol: "US$",
        format: "1.000.000",
        dayValue: "0.052",
        exchangeRate: "0.059",
        baseCurrency: false,
        used: 1,
        actions: "basurero"
      },
        {
        orden: 3,
        name: "Peso Colombiano",
        code: "COP",
        symbol: "$",
        format: "1.000.000",
        dayValue: "0",
        exchangeRate: "0",
        baseCurrency: false,
        used: 2,
        actions: "basurero"
      },
  ]);

  const optionsSelectformat = ref([
    {
      value: "100000",
      label: "1,000.00",
      text: "US, GB, AU, CA (EN)"
    },
    {
      value: "100000",
      label: "1.000,00",
      text: "EUR, LATAM"
    },
    {
      value: "100000",
      label: "1 000,00",
      text: "FR, CA, (FR), CH"
    },
    {
      value: "100000",
      label: "1'000.00",
      text: "CH (OCASIONAL)"
    },
    {
      value: "100000",
      label: "1.000.00",
      text: "JP, CN, KR"
    },
    {
        value: "100000",
        label: "1000,00",
        text: "LATAM, EUR (OCASIONAL)"
    }
  ])

  // COMPUTED


  // FUNCTIONS

  function addContentCoins() {
    const newOrder = coins.value.length + 1;
    coins.value.push({
      orden: newOrder,
      name: "",
      code: "",
      symbol: "",
      format: "",
      dayValue: "",
      exchangeRate: "",
      baseCurrency: false,
      used: 0,
      actions: "basurero"
    });
  }

  function setBaseCurrency(index) {
    coins.value.forEach((coin, i) => {
      coin.baseCurrency = i === index-1;
    });
    console.log(coins.value);
  }


  function removeContentCoins(pos) {
    const idx = coins.value.findIndex(item => item.orden === pos);
    console.log(idx);
    if (idx !== -1) {
      coins.value.splice(idx,1);
      coins.value.forEach((item, i) => {
        item.orden = i + 1;
      });
    }
  }

  // DATA MONEDA 
  const dataMoneda = ref({});
  const error = ref(null);

  function actualizarValoresDeMonedas(monedaBaseCodigo) {
  const baseRate = dataMoneda.value[monedaBaseCodigo] || 1;

  coins.value.forEach((coin) => {
    const rate = dataMoneda.value[coin.code];
    if (rate) {
      coin.dayValue = (rate / baseRate).toFixed(4);
      coin.exchangeRate = (baseRate / rate).toFixed(4);
    } else {
      coin.dayValue = "";
      coin.exchangeRate = "";
    }
  });
}

async function obtenerMonedas() {
  try {
    const respuesta = await fetch('https://cdn.dinero.today/api/latest.json');
    const datos = await respuesta.json();
    dataMoneda.value = datos.rates;

    const baseCoin = coins.value.find(c => c.baseCurrency);
    if (baseCoin) {
      actualizarValoresDeMonedas(baseCoin.code);
    }
  } catch (err) {
    error.value = err.message;
  }
}

watch(coins, (newCoins) => {
  const baseCoin = newCoins.find(c => c.baseCurrency);
  if (baseCoin) {
    actualizarValoresDeMonedas(baseCoin.code);
  }
}, { deep: true });




  onMounted(() => {
    obtenerMonedas();
  });

  </script>

  <template>
    <div class="coins__container">
      <div class="coins__header">
          <span>Monedas</span>
      </div>

      <div class="coins__body">
          <TableBasic class="tableCoins" :configTable="configTable.configurationCoins" :content="coins" :key="coins.length">

              <template v-slot:name="item">
                  <u-input class="inputsCoins" :class="{ 'input-empty' : !item.item.name}" v-model="item.item.name" placeholder="-"  size="m"/>
              </template>

              <template v-slot:code="item">
                  <u-input class="inputsCoins" :class="{ 'input-empty' : !item.item.code}" v-model="item.item.code" placeholder="-" size="m"/>
              </template>

              <template v-slot:symbol="item">
                  <u-input class="inputsCoins" :class="{ 'input-empty' : !item.item.symbol}" v-model="item.item.symbol" placeholder="-" size="m"/>
              </template>

              <template v-slot:format="item">
                <u-select class="selectCoins" v-model="item.item.format" :options="optionsSelectformat" iconDropdown="selector_down" :custom="true" width-options="400px">

                  <template v-slot:option="item">
                      <div class="selectOption">
                          <span class="label">{{ item.item.label }}</span>
                          <span class="text">{{ item.item.text }}</span>
                      </div>
                  </template>

                </u-select>
              </template>

              <template v-slot:dayValue="item">
                  <span class="textDayValueRate">{{ item.item.dayValue }}</span>
              </template>

              <template v-slot:exchangeRate="item">
                  <span class="textDayValueRate">{{ item.item.exchangeRate }}</span>
              </template>


              <template v-slot:baseCurrency="item">
                  <!-- <u-button @click="setBaseCurrency(item.item.orden)" 
                  :text="item.item.baseCurrency ? 'Base' : 'Elegir'" size="s" :icon="item.item.baseCurrency ? 'star-filled' : 'star'"
                  :color="item.item.baseCurrency ? '--primary-surface-default' : '--neutral-surface-shadow-8a'"
                  /> -->
                  <button 
                    class="btn-base-currency"
                    :class="{ active: item.item.baseCurrency }"
                    @click="setBaseCurrency(item.item.orden)"
                  >
                    <span :class="item.item.baseCurrency ? 'u u-star-filled' : 'u u-star'"></span>
                    <span>{{ item.item.baseCurrency ? 'Base' : 'Elegir' }}</span>
                  </button>
              </template>

              <template v-slot:used="item">
                  <span class="used">{{ item.item.used }}</span>
              </template>

              <template v-slot:actions="item">
                  <span class="u u-delete deleteCoins" @click="removeContentCoins(item.item.orden)"></span>
              </template>


          </TableBasic>
              </div>

          
              <div class="coins__footer" >
        <u-button
          text="Agregar variable"
          style="width: 100%;"
          icon="new"
          color="--neutral-surface-shadow-8a"
          color-text="--neutral-text-caption"
          colorHover="--success-surface-shadow-8a"
          color-text-hover="--primary-text-default"
          color-active="--success-surface-shadow-12a"
          size="m"
          @click="addContentCoins"
        />
      </div>


      
        
    </div>
  </template>

  <style scoped>

  .coins__container {
      display: flex;
      flex-direction: column;
      gap: 24px;
      height: 100%;
      width: 100%;
      container-type: inline-size;
  }

  .coins__header {
      display: flex;
      width: 100%;
      height: 36px;
  }

  .coins__header span {
      font-size: 24px;
      font-weight: 600;
      line-height: 36px;
      letter-spacing: 0em;
      text-align: left;
      color: var(--neutral-text-body);
  }

  .coins__body {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  overflow-y: auto;
  }

  /* table Coins */
  ::v-deep(.tableCoins) {
  overflow-y: visible !important;
  height: 100% !important; 
  }

  /* input Coins */

  ::v-deep(.inputsCoins) {
    border: 0 ;
    width: 100%;
  }
  ::v-deep(.inputsCoins:hover) {
    background-color: var(--success-surface-shadow-8a);
  }

  ::v-deep(.inputsCoins:hover:not(:focus)) {
    border: none !important;
  }

  ::v-deep(.inputsCoins:focus) {
    background-color: var(--success-surface-shadow-8a);
  }

  ::v-deep(.input-empty) {
    background-color: var(--neutral-surface-shadow-8a); 
  }

  /* select */

  .selectCoins {
      width: 100%;
      padding: 0 !important;
  }

  .selectCoins.select-active {
    border: 2px solid var(--primary-border-default);
    border-radius: 8px;
  }


  .selectCoins:focus-within {
      background-color: var(--neutral-surface-shadow-12a); 
      border: 2px solid var(--primary-border-default);
      border-radius: 16px;
  }

  /* select option */

  .selectOption {
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    gap: 4px;
  }

  .selectOption .label {
      font-size: 14px;
      font-weight: 400;
      line-height: 18px;
      letter-spacing: 0em;
      text-align: left;
      color: var(--neutral-text-body);
  }

  .selectOption .text {
      font-size: 10px;
      font-weight: 400;
      line-height: 16px;
      letter-spacing: 0em;
      text-align: left;
      color: var(--neutral-text-caption);
  }

  /* @container (max-width: 1300px) {
    .selectOption {
      display: flex;
      flex-direction: column;
      flex-wrap: wrap;
    }
    .selectOption .label {
      font-size: 10px;
    }
    .selectOption .text {
      font-size: 8px;
    }
  } */

.used {
  display: flex;
  justify-content: right;
  align-items: center;
  width: 100%;
  height: 100%;
  color: var(--neutral-text-body);
}
  
  /* actions */
  .deleteCoins {
      width: 100%;
      font-size: 20px;
      display: flex;  
      justify-content: center;
      align-items: center;
      color: var(--danger-text-default);
      cursor: pointer;
  }

  .coins__footer {
      display: flex;
      justify-content: center;
      align-items: center;
      width: 100%;
      margin-top: 8px;
  }

/* lefttedxt */

.textDayValueRate {
  display: flex;
  justify-content: right;
  align-items: center;
  width: 100%;
  height: 100%;
  color: var(--neutral-text-body);
}


  /* button new */
  .btn-base-currency {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 28px;
  padding: 4px 8px;
  border-radius: 8px;
  background-color: var(--neutral-surface-light);
  color: var(--neutral-text-caption);
  font-size: 14px;
  gap: 2.02px;
  transition: background-color 0.2s ease;
  cursor: pointer;
  border: none;
}

.btn-base-currency:hover {
  background-color: var(--primary-surface-shadow-8a);
}

.btn-base-currency.active {
  background-color: var(--primary-surface-light);
  color: var(--primary-text-default);
  border: 1px solid var(--primary-border-default);
}

.btn-base-currency span:first-child {
  display: flex;
  width: 20px;
  height: 20px;
  justify-content: center;
  align-items: center;
  font-size: 16px;
}

/* .btn-base-currency span {
  font-weight: 600;
  font-size: 12px;
  line-height: 16px;
  color: var(--neutral-text-body);
} */


  </style>
