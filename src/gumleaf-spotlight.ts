
export function planGumleafSpotlight(values: readonly number[], rate: number, reduced: boolean, turbo = false) {
  const maximum = values.reduce((high, value) => Math.max(high, value), 0);
  if (!maximum) return null;
  const intensity = maximum >= 25 ? 'large' : maximum >= 10 ? 'medium' : 'small';
  const duration = reduced ? 90 : rate === 0 ? 70 : turbo || rate >= 2 ? 100 : rate < 1 ? 350 : 220;
  return { intensity, duration, static: reduced || rate === 0, text: values.map(value => '×' + value).join(' + ') } as const;
}

