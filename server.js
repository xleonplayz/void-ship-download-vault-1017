import http from 'node:http';
import {release} from './policy.js';
import {html,client} from './ui.js';

const sizes={sample:257,manual:131329,archive:1048593};
const modified=release===1?'Sat, 17 Oct 2026 12:00:00 GMT':'Sat, 17 Oct 2026 13:00:00 GMT';
function bytes(size){const b=Buffer.alloc(size);for(let i=0;i<size;i++)b[i]=(i*37+Math.floor(i/251)+release*17)%256;return b;}
const files=Object.fromEntries(Object.entries(sizes).map(([id,size])=>[id,{id,size,etag:'"vault-r'+release+'-'+id+'-'+size+'"'}]));
function matches(value,tag,weak){return value.split(',').some(x=>{x=x.trim();return x==='*'||(weak?x.replace(/^W\//,'')===tag:x===tag);});}
const server=http.createServer((req,res)=>{
 const url=new URL(req.url,'http://vault.local');
 const reply=(status,headers,body)=>{res.writeHead(status,{'x-vault-release':String(release),...headers});res.end(req.method==='HEAD'?undefined:body);console.log(JSON.stringify({event:'vault_request',release,method:req.method,path:url.pathname,status,bytes:body?.length||0}));};
 if(req.method!=='GET'&&req.method!=='HEAD')return reply(405,{'allow':'GET, HEAD','content-type':'application/json'},'{"error":"method_not_allowed"}');
 if(url.pathname==='/')return reply(200,{'content-type':'text/html; charset=utf-8'},html);
 if(url.pathname==='/client.js')return reply(200,{'content-type':'text/javascript; charset=utf-8'},client);
 if(url.pathname==='/health')return reply(200,{'content-type':'application/json'},JSON.stringify({ok:true,release}));
 if(url.pathname==='/api/files')return reply(200,{'content-type':'application/json','cache-control':'no-store'},JSON.stringify({release,files:Object.values(files).map(({id,size,etag})=>({id,size,etag,path:'/files/'+id+'.bin'}))}));
 const m=/^\/files\/(sample|manual|archive)\.bin$/.exec(url.pathname);
 if(!m)return reply(404,{'content-type':'application/json'},'{"error":"not_found"}');
 const f=files[m[1]],h={'content-type':'application/octet-stream','accept-ranges':'bytes','etag':f.etag,'last-modified':modified,'cache-control':'private, max-age=0, must-revalidate','content-disposition':`attachment; filename="vault-${f.id}-r${release}.bin"; filename*=UTF-8''Handbuch-%C3%BCber-${f.id}-r${release}.bin`};
 if(req.headers['if-match']&&!matches(req.headers['if-match'],f.etag,false))return reply(412,{...h,'content-length':'0'},'');
 if(req.headers['if-none-match']&&matches(req.headers['if-none-match'],f.etag,true))return reply(304,h,'');
 if(!req.headers['if-none-match']&&req.headers['if-modified-since']&&Date.parse(req.headers['if-modified-since'])>=Date.parse(modified))return reply(304,h,'');
 const range=req.headers.range,ifRange=req.headers['if-range'];
 const rangeAllowed=!ifRange||ifRange===f.etag||(!ifRange.startsWith('"')&&!ifRange.startsWith('W/')&&Date.parse(ifRange)>=Date.parse(modified));
 if(req.method==='GET'&&range&&rangeAllowed){
  const r=/^bytes=(\d*)-(\d*)$/.exec(range);
  if(r&&(r[1]||r[2])){
   let start=r[1]?Number(r[1]):Math.max(0,f.size-Number(r[2]));
   let end=r[1]?(r[2]?Math.min(Number(r[2]),f.size-1):f.size-1):f.size-1;
   if(!Number.isSafeInteger(start)||!Number.isSafeInteger(end)||start>=f.size||end<start||(!r[1]&&Number(r[2])===0))return reply(416,{...h,'content-range':'bytes */'+f.size,'content-length':'0'},'');
   const part=bytes(f.size).subarray(start,end+1);
   return reply(206,{...h,'content-range':`bytes ${start}-${end}/${f.size}`,'content-length':String(part.length)},part);
  }
 }
 return reply(200,{...h,'content-length':String(f.size)},req.method==='HEAD'?'':bytes(f.size));
});
server.listen(Number(process.env.PORT||3000),'0.0.0.0',()=>console.log('vault_ready release='+release));
