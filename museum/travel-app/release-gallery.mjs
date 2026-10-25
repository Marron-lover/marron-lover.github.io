import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
const root=path.dirname(fileURLToPath(import.meta.url));
for(const script of ['privacy:check','lint','test:publication','build:approved'])execFileSync('npm',['run',script],{cwd:root,stdio:'inherit',env:{...process.env,STARMAP_LOCAL_FIXTURE:'',STARMAP_APPROVED_BASE:''}});
console.log('Gallery travel release checks passed against the allowlisted source-controlled public snapshot.');
