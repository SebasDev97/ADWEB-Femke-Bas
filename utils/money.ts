export function centsToCurrencyString(
  cents: number,
  locale = 'nl-NL',
  currency = 'EUR',
): string {
  return new Intl.NumberFormat(locale, { style: 'currency', currency }).format(
    cents / 100,
  );
}

export function euroStringToCents(value: string): number {
  return Math.round(parseFloat(value.replace(',', '.')) * 100);
}
