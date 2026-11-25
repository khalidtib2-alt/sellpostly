export function b2bPlanPrice(value: string | undefined): string {
 const price=value?.trim() || '49';
 return /^\d{1,6}(\.\d{1,2})?$/.test(price) && Number(price)>0 ? price : '49';
}
