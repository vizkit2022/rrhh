/* FORMATEADOR DE PORCENTAJES */
export const marginFormatByCurrency = (
  value = 0,
  currency = {
    typeFormat: "de-DE",
    precision: 2,
  },
  forzarDecimals = false
) => {
  return formatMargin(
    value,
    currency.typeFormat,
    currency.precision,
    forzarDecimals
  );
};

export const formatMargin = (
  value,
  typeFormat = "de-DE",
  precision = 0,
  forzarDecimals = false
) => {
  const formattedNumber = formatNumber(
    value,
    typeFormat,
    precision,
    forzarDecimals
  );
  return `${formattedNumber} %`;
};

/* FORMATEADOR DE NUMBER */
export const convertToNumberByCurrency = (
  number = 0,
  currency = {
    typeFormat: "de-DE",
    precision: 2,
  }
) => {
  return convertToNumber(number, currency.typeFormat, currency.precision);
};

export const convertToNumber = (
  number,
  typeFormat = "de-DE",
  maxPrecision = 2
) => {
  if (!number || !/[0-9]/.test(number)) {
    number = 0;
  }

  if (typeof number === "number") {
    return parseFloat(number.toFixed(maxPrecision));
  }

  const isNegative = number.includes("-");
  number = number.replace(/[^\d.,]/g, "").trim();

  let floatNumber;
  if (typeFormat === "de-DE") {
    floatNumber = number.replace(/\./g, "").replace(",", ".");
  } else if (typeFormat === "en-US") {
    floatNumber = number.replace(/,/g, "");
  } else {
    floatNumber = number.replace(/\./g, "").replace(",", ".");
  }

  const [integerPart, decimalPart] = floatNumber.split(".");
  let result;

  if (decimalPart !== undefined && decimalPart.length > 0) {
    result = `${integerPart}.${decimalPart.slice(0, maxPrecision)}`;
  } else {
    result = `${integerPart}`;
  }

  result = parseFloat(result).toFixed(maxPrecision);

  if (decimalPart && decimalPart.length > 0 && result % 1 === 0) {
    result = parseFloat(floatNumber).toFixed(maxPrecision);
  }

  return isNegative ? -parseFloat(result) : parseFloat(result);
};
/* FORMATEADOR DE VALUE POR CURRENCY */
export const formatCurrency = (
  value,
  currencyFormat = {},
  forzarDecimals = false,
  showSymbol = true,
  showCode = false 
) => {
  const {
    typeFormat = "en-US",
    precision = 2,
    symbol = "$",
    positionSymbol = "left",
    code = "",
  } = currencyFormat;

  const isNegative = value < 0;

  const formattedNumber =
    value === 0
      ? 0
      : formatNumber(
          Math.abs(value),
          typeFormat,
          precision,
          forzarDecimals
        );
        
  const codePrefix = showCode && code ? `${code} ` : "";

  if (showSymbol) {
    return positionSymbol === "left"
      ? `${isNegative ? "-" : ""}${codePrefix}${symbol} ${formattedNumber}`
      : `${isNegative ? "-" : ""}${formattedNumber} ${codePrefix}${symbol}`;
  }

  return `${formattedNumber}`;
};



export const formatCurrency2 = (
  value,
  currencyFormat = {},
  forceDecimals = false,
  showSymbol = true
) => {
  const {
    typeFormat = "en-US",
    precision = 2,
    symbol = "$",
    positionSymbol = "left",
  } = currencyFormat;

  const isNegative = value < 0;
  const absValue = Math.abs(value);

  // Detecta si el número tiene parte decimal
  const hasDecimals = absValue % 1 !== 0;

  // Reglas de decimales:
  // - Si tiene decimales → mostrar exactamente `precision`
  // - Si no tiene → mostrar 0 o `precision` si se forza
  const minDecimals = hasDecimals || forceDecimals ? precision : 0;
  const maxDecimals = hasDecimals || forceDecimals ? precision : 0;

  const formatter = new Intl.NumberFormat(typeFormat, {
    minimumFractionDigits: minDecimals,
    maximumFractionDigits: maxDecimals,
  });

  const formattedNumber = formatter.format(absValue);

  const numberWithSymbol = showSymbol
    ? positionSymbol === "left"
      ? `${isNegative ? "-" : ""}${symbol} ${formattedNumber}`
      : `${isNegative ? "-" : ""}${formattedNumber} ${symbol}`
    : `${isNegative ? "-" : ""}${formattedNumber}`;

  return numberWithSymbol;
};
export const buildCurrencyObject = (number, currencyFormat = {}, type = "currency") => {

  if (type === "currency") {
    const formattedWithSymbol = formatCurrency2(number, currencyFormat, true, true);
    const formattedNoSymbol = formatCurrency2(number, currencyFormat, true, false);

    return {
      number,
      value: formattedWithSymbol,
      valueNoSymbol: formattedNoSymbol,
      calculation: {
        dependencies: [],
        formula: formattedNoSymbol,
        displayFormula: formattedNoSymbol,
      },
    };
  }

  // Si es cantidad (quantity)
  const symbol = currencyFormat.typeFormat === 'en-US' ? '.' : ',';
  const val = String(number).replace('.', symbol);
  
  return {
    number,
    value: val,
    calculation: {
      dependencies: [],
      formula: val,
      displayFormula: val,
    },
  };
};


export const formatCurrencySymbol = (
  value,
  symbolPosition = "left",
  currencySymbol = "$"
) => {
  const isNegative = value.startsWith("-");

  // Elimina el signo negativo para formatear el valor
  value = value.replace("-", "").trim();

  let formattedValue;
  if (currencySymbol) {
    if (symbolPosition === "left") {
      formattedValue = `${currencySymbol} ${value}`;
    } else {
      formattedValue = `${value} ${currencySymbol}`;
    }
  } else {
    formattedValue = value;
  }

  return isNegative ? `-${formattedValue}` : formattedValue;
};

export const formatNumberByCurrency = (
  number = 0,
  currency = {
    typeFormat: "de-DE",
    precision: 2,
  },
  forzarDecimals = false
) => {
  return formatNumber(
    number,
    currency.typeFormat,
    currency.precision,
    forzarDecimals
  );
};

export const formatNumber = (
  value,
  locale = "en-US",
  maxPrecision = 2,
  forzarDecimals = false
) => {
  if (typeof value === "number") {
    // Trunca los decimales sin redondear
    value = truncateDecimals(value, maxPrecision);

    // Convierte el número a formato localizado
    return value.toLocaleString(locale, {
      minimumFractionDigits: maxPrecision,
      maximumFractionDigits: maxPrecision,
    });
  }

  // Si el valor no es un número (string input), formatea manualmente
  const decimalSeparator = locale === "de-DE" ? "," : ".";
  const thousandSeparator = locale === "de-DE" ? "." : ",";

  // Limpia caracteres no válidos
  value = value.replace(/[^0-9.,-]/g, "");

  // Divide en parte entera y decimal
  const parts = value.split(/[.,]/);
  let integerPart = parts[0].replace(
    /\B(?=(\d{3})+(?!\d))/g,
    thousandSeparator
  );
  let decimalPart = parts[1] || "";

  // Trunca o rellena la parte decimal según sea necesario
  if (maxPrecision > 0) {
    decimalPart = decimalPart.slice(0, maxPrecision);
    if (forzarDecimals && decimalPart.length < maxPrecision) {
      decimalPart = decimalPart.padEnd(maxPrecision, "0"); // Rellena con ceros
    }
  }

  // Junta la parte entera y decimal
  return decimalPart
    ? `${integerPart}${decimalSeparator}${decimalPart}`
    : integerPart;
};

export const formatIntegerPart = (value, locale = "de-DE", carryOver) => {
  const thousandSeparator = getThousandSeparator(locale);

  // Elimina todos los separadores de mil del input
  const cleanedValue =
    Number(value.split(thousandSeparator).join("")) + carryOver;

  // Formatea el valor según el formato especificado
  return cleanedValue.toLocaleString(locale);
};

export const formatDecimalPart = (
  value,
  locale = "de-DE",
  maxPrecision,
  mode
) => {
  const decimalSeparator = getDecimalSeparator(locale);
  const thousandSeparator = getThousandSeparator(locale);

  // Elimina todos los separadores de mil y decimales del input
  let cleanedValue = value
    .replace(new RegExp(`\\${decimalSeparator}`, "g"), "")
    .replace(new RegExp(`\\${thousandSeparator}`, "g"), "");

  if (mode) {
    if (cleanedValue.length >= maxPrecision) {
      cleanedValue = cleanedValue.slice(0, maxPrecision);
    }
    return { value: cleanedValue, carryOver: false };
  }

  // Redondeamos solo si es necesario (al final)
  if (cleanedValue.length > maxPrecision) {
    cleanedValue = parseFloat(`0.${cleanedValue}`).toFixed(maxPrecision);
  } else {
    cleanedValue = parseFloat(`0.${cleanedValue}`).toFixed(maxPrecision);
  }

  if (cleanedValue == (1).toFixed(maxPrecision)) {
    return { value: "", carryOver: true };
  }
  if (cleanedValue == (0).toFixed(maxPrecision)) {
    return { value: "", carryOver: false };
  }

  cleanedValue = cleanedValue.replace("0.", "").replace("1.", "");

  // Si cleanedValue se convierte en todos ceros, lo limpiamos
  cleanedValue = cleanedValue.replace(/0+$/, "");
  // Retornar el valor formateado y el estado de acarreo
  return { value: cleanedValue, carryOver: false };
};

export const getDecimalSeparator = (locale = "de-DE") => {
  switch (locale) {
    case "de-DE":
      return ",";
    case "en-US":
      return ".";
    default:
      return ","; // Por defecto, retorna la coma como en "de-DE"
  }
};

export const getThousandSeparator = (locale = "de-DE") => {
  switch (locale) {
    case "de-DE":
      return ".";
    case "en-US":
      return ",";
    default:
      return "."; // Por defecto, retorna el punto como en "de-DE"
  }
};

export const truncateDecimals = (value, maxPrecision) => {
  if (typeof value !== "number" || maxPrecision < 0) return value;

  const factor = Math.pow(10, maxPrecision);
  return Math.round(value * factor) / factor; // Trunca sin redondear
};

export const getValueFormaRealTime = (rawValue, currency, prop) => {
  const decimalSeparator = currency.typeFormat === "de-DE" ? "," : ".";
  const thousandSeparator = currency.typeFormat === "de-DE" ? "." : ",";

  if (prop.includes("amount")) {
    currency.precision = 2;
  }

  // Limpia los separadores de miles
  let cleanedValue = rawValue.replace(
    new RegExp(`\\${thousandSeparator}`, "g"),
    ""
  );

  // Asegura que solo el separador decimal correcto sea permitido
  cleanedValue = cleanedValue.replace(/[.,]/g, (match) =>
    match === decimalSeparator ? decimalSeparator : ""
  );

  // Valida que no haya más de un separador decimal
  const decimalCount = (
    cleanedValue.match(new RegExp(`\\${decimalSeparator}`, "g")) || []
  ).length;
  if (decimalCount > 1) {
    return; // Salir si hay más de un separador decimal
  }

  // Divide en parte entera y decimal
  const [integerPart, decimalPart] = cleanedValue.split(decimalSeparator);

  // Si `precision` es 0, no permitir decimales
  if (currency.precision === 0 && decimalPart !== undefined) {
    return; // Salir si se intenta escribir decimales cuando no se permiten
  }
  // Limita el número de cifras decimales según `precision`
  const limitedDecimalPart =
    decimalPart !== undefined
      ? decimalPart.slice(0, currency.precision)
      : undefined;

  // Reconstruye el valor con separadores de miles en la parte entera
  const formattedIntegerPart = parseInt(integerPart || "0", 10).toLocaleString(
    currency.typeFormat
  );

  // Si existe una parte decimal, la agrega al valor reconstruido
  const formattedValue =
    limitedDecimalPart !== undefined
      ? `${formattedIntegerPart}${decimalSeparator}${limitedDecimalPart}`
      : formattedIntegerPart;

  // Convierte a número flotante para almacenar internamente
  const numericValue = parseFloat(
    `${integerPart || "0"}${
      limitedDecimalPart !== undefined ? `.${limitedDecimalPart}` : ""
    }`
  );
  return { formattedValue, numericValue };
};
