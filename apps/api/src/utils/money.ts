import { Decimal } from '@prisma/client/runtime/library';

export function toDecimal(value: number | string | Decimal): Decimal {
  if (value instanceof Decimal) return value;
  return new Decimal(value);
}

export function addMoney(...values: Array<number | string | Decimal>): Decimal {
  return values.reduce<Decimal>((sum, value) => sum.plus(toDecimal(value)), new Decimal(0));
}

export function subtractMoney(a: number | string | Decimal, b: number | string | Decimal): Decimal {
  return toDecimal(a).minus(toDecimal(b));
}

export function multiplyMoney(value: number | string | Decimal, multiplier: number): Decimal {
  return toDecimal(value).times(multiplier);
}

export function maxMoney(a: number | string | Decimal, b: number | string | Decimal): Decimal {
  const left = toDecimal(a);
  const right = toDecimal(b);
  return left.greaterThan(right) ? left : right;
}

export function roundMoney(value: number | string | Decimal): Decimal {
  return toDecimal(value).toDecimalPlaces(2);
}

export function decimalToNumber(value: Decimal | null | undefined): number {
  if (!value) return 0;
  return value.toNumber();
}
