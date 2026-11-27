import type { NextConfig } from 'next';
const config:NextConfig={outputFileTracingIncludes:{'/**/*':['./src/db/schema.sql']}};
export default config;
