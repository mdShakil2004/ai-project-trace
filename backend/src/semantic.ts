import 'dotenv/config';
import { query } from './db.js';

const model = process.env.OPENROUTER_EMBEDDING_MODEL || 'openai/text-embedding-3-small';
const key = process.env.OPENROUTER_API_KEY;
const MAX_CHUNK = 7000;

function vectorLiteral(values: number[]) { return `[${values.map(v => Number(v).toFixed(8)).join(',')}]`; }
async function embed(inputs: string[]) {
  if (!key || !inputs.length) return [] as number[][];
  const response = await fetch('https://openrouter.ai/api/v1/embeddings', { method:'POST', headers:{Authorization:`Bearer ${key}`,'Content-Type':'application/json','HTTP-Referer':process.env.APP_URL||'http://localhost:8787','X-Title':'Trace AI Change Intelligence'}, body:JSON.stringify({model,input:inputs}) });
  if (!response.ok) throw new Error('EMBEDDING_PROVIDER_ERROR');
  const payload:any=await response.json();
  return (payload.data||[]).sort((a:any,b:any)=>a.index-b.index).map((x:any)=>x.embedding as number[]);
}

export async function indexContext(userId:string, repositoryId:string, ctx:any) {
  if (!key) return;
  const chunks:any[]=[];
  for(const f of ctx.files||[]) {
    const text=String(f.patch||'');
    for(let start=0;start<text.length;start+=MAX_CHUNK) chunks.push({sourceType:'code',sourceId:`${ctx.number}:${f.filename}:${start}`,content:text.slice(start,start+MAX_CHUNK),path:f.filename,startLine:null,endLine:null,metadata:{status:f.status,pr:ctx.number}});
  }
  for(const c of (ctx.commits||[]).slice(0,30)) chunks.push({sourceType:'commit',sourceId:c.sha,content:String(c.commit?.message||''),path:null,startLine:null,endLine:null,metadata:{pr:ctx.number}});
  if(!chunks.length)return;
  const vectors=await embed(chunks.map(x=>x.content));
  for(let i=0;i<chunks.length;i++) await query(`insert into semantic_chunks(owner_user_id,repository_id,source_type,source_id,content,path,start_line,end_line,metadata,embedding) values($1,$2,$3,$4,$5,$6,$7,$8,$9,$10::vector)`,[userId,repositoryId,chunks[i].sourceType,chunks[i].sourceId,chunks[i].content,chunks[i].path,chunks[i].startLine,chunks[i].endLine,JSON.stringify(chunks[i].metadata),vectors[i]?vectorLiteral(vectors[i]):null]);
}

export async function retrieveContext(userId:string, repositoryId:string, text:string, limit=8) {
  if(!key)return [];
  const vectors=await embed([text]); const vector=vectors[0]; if(!vector)return [];
  const {rows}=await query<any>(`select source_type,source_id,content,path,start_line,end_line,metadata,1-(embedding <=> $1::vector) as similarity from semantic_chunks where owner_user_id=$2 and repository_id=$3 and embedding is not null order by embedding <=> $1::vector limit $4`,[vectorLiteral(vector),userId,repositoryId,limit]);
  return rows;
}
