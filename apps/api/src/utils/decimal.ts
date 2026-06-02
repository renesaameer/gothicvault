import { Decimal } from '@prisma/client/runtime/library';

export function convertDecimalToNumber<T>(value: T): T {
  if (value instanceof Decimal) {
    return value.toNumber() as T;
  }
  if (value instanceof Date) {
    return value;
  }
  if (Array.isArray(value)) {
    return value.map((item) => convertDecimalToNumber(item)) as T;
  }
  if (typeof value === 'object' && value !== null) {
    const converted: Record<string, unknown> = {};
    for (const key in value) {
      converted[key] = convertDecimalToNumber((value as Record<string, unknown>)[key]);
    }
    return converted as T;
  }
  return value;
}
