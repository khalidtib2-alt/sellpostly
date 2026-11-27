export function splitSql(source:string):string[];
export function migrateSchema(sql:Pick<import('@neondatabase/serverless').NeonQueryFunction<false,false>,'query'|'transaction'>, schema:string):Promise<{applied:boolean;statements:number}>;
