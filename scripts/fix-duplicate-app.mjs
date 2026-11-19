import {readdir,access,rename} from 'node:fs/promises';
import {resolve,join,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {tmpdir} from 'node:os';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..'),duplicate=join(root,'app');
async function exists(path){try{await access(path);return true;}catch{return false;}}
async function files(dir){const entries=await readdir(dir,{withFileTypes:true});return (await Promise.all(entries.map(async entry=>entry.isDirectory()?files(join(dir,entry.name)):[join(dir,entry.name)]))).flat();}
if(await exists(duplicate)){
 if(!await exists(join(root,'src/app/layout.tsx'))||await exists(join(duplicate,'layout.tsx'))||await exists(join(duplicate,'layout.jsx'))||await exists(join(duplicate,'layout.js')))throw Error('Refusing to move a root app with a layout or without a canonical src/app layout.');
 for(const file of await files(duplicate)){const relative=file.slice(duplicate.length+1);if(!await exists(join(root,'src/app',relative)))throw Error('Refusing to move files without a canonical src/app counterpart: '+relative);}
 const backup=join(tmpdir(),'SellPostly-misplaced-app-backup-'+Date.now());
 await rename(duplicate,backup);
 console.log('Moved duplicate root app to a backup outside the repository: '+backup);
}else console.log('No duplicate root app directory; nothing to repair.');

