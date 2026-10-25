import {cpSync,existsSync,lstatSync,mkdtempSync,readdirSync,renameSync,rmSync} from 'node:fs';
import {join,resolve} from 'node:path';
function inspect(path){const s=lstatSync(path);if(s.isSymbolicLink())throw new Error('Static publication rejects symlinks.');if(s.isDirectory())for(const name of readdirSync(path))inspect(join(path,name));}
export function publishStatic(source,destination,entries){
 source=resolve(source);destination=resolve(destination);
 if(source===destination||!entries.length||entries.some(e=>!/^[a-z0-9][a-z0-9.-]*$/.test(e)))throw new Error('Choose distinct static directories and named top-level entries.');
 for(const entry of entries){const path=join(source,entry);if(!existsSync(path))throw new Error('Missing static output: '+entry);inspect(path);}
 const stage=mkdtempSync(join(destination,'.gallery-publish-'));
 const completed=[];
 try{
  for(const entry of entries)cpSync(join(source,entry),join(stage,entry),{recursive:true});
  for(const entry of entries){const target=join(destination,entry),backup=join(stage,'previous-'+entry);if(existsSync(target))renameSync(target,backup);try{renameSync(join(stage,entry),target);completed.push({target,backup});}catch(error){if(existsSync(backup))renameSync(backup,target);throw error;}}
 }catch(error){for(const {target,backup} of completed.reverse()){rmSync(target,{recursive:true,force:true});if(existsSync(backup))renameSync(backup,target);}throw error;}
 finally{rmSync(stage,{recursive:true,force:true});}
}
