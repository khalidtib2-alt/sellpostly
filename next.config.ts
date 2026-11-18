import type { NextConfig } from 'next';
const config:NextConfig={outputFileTracingIncludes:{'/api/db/init':['./src/db/schema.sql']}};
export default config;
