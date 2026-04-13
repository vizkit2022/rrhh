
export const formatCurrencyvalue = (input, positionSymbol, symbol) => {
  if (symbol) {
    if (positionSymbol === "left") {
      return `${symbol} ${input}`;
    } else {
      return `${input} ${symbol}`;
    }
  }
};

export const multiplyNumbers = (number1, number2, number3) => {
  if (number3 == 0) {
    return number1 * number2;
  } else {
    return number1 * number2 * number3;
  }
};

export const formatMaskNumber = (value) => {
  if (!value) return "";

  if (value.length <= 6) {
    return value;
  }

  return value.slice(-4).padStart(6, "x");
};

