import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
const root=path.dirname(fileURLToPath(import.meta.url));
execFileSync('npm',['run','build:approved'],{cwd:path.join(root,'01_Web'),stdio:'inherit',env:{...process.env,NODE_ENV:"production",STARMAP_BUILD_OUTDIR:path.join(root,'dist'),STARMAP_LOCAL_FIXTURE:'',STARMAP_APPROVED_BASE:''}});
