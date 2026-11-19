export type Locale='en'|'fr'|'ar';
export function locale(value:unknown):Locale{return value==='fr'||value==='ar'?value:'en';}

