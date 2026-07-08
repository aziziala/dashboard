/** CSS suffix for `.tariff-pin.*` (fleet / map / affectation). */
export type TariffPinClass = 't1' | 't2' | 't3' | 'unknown';

/**
 * Map backend `feesOption` (T1–T3 or TGPS*) to marker colour class.
 * T1 → green, T2 → blue, T3 → red.
 */
export function feesOptionToTariffPinClass(feesOption?: string | null): TariffPinClass {
  const t = (feesOption || '').toUpperCase().trim();
  if (t === 'T1' || t === 'TGPS1') {
    return 't1';
  }
  if (t === 'T2' || t === 'TGPS2') {
    return 't2';
  }
  if (t === 'T3' || t === 'TGPS3') {
    return 't3';
  }
  return 'unknown';
}

export function buildTariffTaxiMarkerHtml(
  tariffClass: TariffPinClass,
  options?: { busy?: boolean; inProgress?: boolean }
): string {
  const busy = options?.busy ? ' busy' : '';
  if (options?.inProgress) {
    return `<div class="tariff-pin in-progress${busy}"><span class="tariff-pulse"></span><i class="fas fa-taxi"></i></div>`;
  }
  return `<div class="tariff-pin ${tariffClass}${busy}"><span class="tariff-pulse"></span><i class="fas fa-taxi"></i></div>`;
}
