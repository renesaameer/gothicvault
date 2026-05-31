export const CURRENCY_SYMBOL = "৳";

// Digits are rendered in English/Latin numerals across the app.
// (Kept as a function to avoid touching every call-site.)
export const toBanglaDigits = (input: string | number): string => String(input);

const formatNumber = (n: number, decimals = 0): string => {
  const fixed = decimals > 0 ? n.toFixed(decimals) : Math.round(n).toString();
  const [intPart, decPart] = fixed.split(".");
  const grouped = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  const joined = decPart ? `${grouped}.${decPart}` : grouped;
  return toBanglaDigits(joined);
};

export const formatPrice = (price: number): string => {
  const safe = Number.isFinite(price) ? price : 0;
  const decimals = Math.abs(safe % 1) > 0.001 ? 2 : 0;
  return `${CURRENCY_SYMBOL}${formatNumber(safe, decimals)}`;
};

export const formatBnNumber = (n: number) => formatNumber(n, 0);
