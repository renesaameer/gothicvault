export function generateOrderNumber(): string {
  return String(Math.floor(10000000000 + Math.random() * 90000000000));
}
