export type Locale='en'|'fr'|'es'|'ar';
export function locale(value:unknown):Locale{return value==='fr'||value==='es'||value==='ar'?value:'en';}

