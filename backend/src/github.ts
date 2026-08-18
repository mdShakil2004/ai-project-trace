import { currentUserId } from './request-context.js';
import { getGithubAccessToken } from './auth.js';

export interface GitHubFile{filename:string;status:'added'|'modified'|'removed'|'renamed';additions:number;deletions:number;changes:number;patch?:string;raw_url?:string;}
export interface GitHubContext{owner:string;repo:string;number:number;pr:any;files:GitHubFile[];commits:any[];issue:any;comments:any[];reviews:any[];checks:any;repository:any;}

/**
 * A Trace GitHub connection is optional for public repositories.
 * When the user has connected GitHub, the OAuth token is preferred because it
 * gives GitHub a higher API rate limit and access to private repositories.
 * When there is no token, public GitHub API endpoints are called anonymously.
 */
async function resolveToken():Promise<string|null>{
  const userId=currentUserId();
  if(!userId)return null;
  return (await getGithubAccessToken(userId))||null;
}

function githubHeaders(token:string|null):Record<string,string>{
  const headers:Record<string,string>={
    accept:'application/vnd.github+json',
    'x-github-api-version':'2022-11-28',
  };
  if(token)headers.authorization=`Bearer ${token}`;
  return headers;
}

async function requestGithub<T>(path:string,token:string|null):Promise<Response>{
  return fetch(`https://api.github.com${path}`,{headers:githubHeaders(token)});
}

async function gh<T>(path:string):Promise<T>{
  const token=await resolveToken();
  const response=await requestGithub<T>(path,token);
  if(response.ok)return response.json() as Promise<T>;

  // A connected user's token may not have access to a public repository. Public
  // repositories must remain analyzable, so retry anonymously before returning
  // an authorization/visibility error. Never retry a GitHub rate-limit response.
  const canRetryPublic=!token || (response.status===401 || (response.status===403 && response.headers.get('x-ratelimit-remaining')!=='0') || response.status===404);
  if(token&&canRetryPublic){
    const publicResponse=await requestGithub<T>(path,null);
    if(publicResponse.ok)return publicResponse.json() as Promise<T>;
    if(publicResponse.status===403&&publicResponse.headers.get('x-ratelimit-remaining')==='0')throw new Error('GITHUB_RATE_LIMITED');
    if(publicResponse.status===404)throw new Error('GITHUB_REPOSITORY_NOT_FOUND');
    if(publicResponse.status===403)throw new Error('GITHUB_PERMISSION_DENIED');
    throw new Error(`GITHUB_UPSTREAM_ERROR_${publicResponse.status}`);
  }

  if(response.status===401)throw new Error('GITHUB_AUTH_REQUIRED');
  if(response.status===403)throw new Error(response.headers.get('x-ratelimit-remaining')==='0'?'GITHUB_RATE_LIMITED':'GITHUB_PERMISSION_DENIED');
  if(response.status===404)throw new Error('GITHUB_REPOSITORY_NOT_FOUND');
  throw new Error(`GITHUB_UPSTREAM_ERROR_${response.status}`);
}

async function ghList<T>(path:string,maxPages=20,perPage=100):Promise<T[]>{const all:T[]=[];for(let page=1;page<=maxPages;page++){const batch=await gh<T[]>(`${path}${path.includes('?')?'&':'?'}per_page=${perPage}&page=${page}`);all.push(...batch);if(batch.length<perPage)break;}return all;}

export function parsePullRequestUrl(input:string){if(typeof input!=='string'||input.length>2048)throw new Error('INVALID_PULL_REQUEST_URL');const match=input.trim().match(/^https?:\/\/github\.com\/([^/]+)\/([^/]+)\/pull\/(\d+)(?:[/?#].*)?$/i);if(!match)throw new Error('INVALID_PULL_REQUEST_URL');return{owner:match[1],repo:match[2],number:Number(match[3])};}
export function parseRepositoryUrl(input:string){if(typeof input!=='string'||input.length>2048)throw new Error('INVALID_REPOSITORY_URL');const match=input.trim().match(/^https?:\/\/github\.com\/([^/]+)\/([^/]+?)(?:\.git)?\/?(?:[?#].*)?$/i);if(!match)throw new Error('INVALID_REPOSITORY_URL');return{owner:match[1],repo:match[2]};}
export async function fetchRepositoryContext(input:string){const{owner,repo}=parseRepositoryUrl(input);return gh<any>(`/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}`);}
export async function fetchPullRequestContext(input:string):Promise<GitHubContext>{const{owner,repo,number}=parsePullRequestUrl(input);const base=`/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}`;const[pr,files,commits,issue,comments,reviews,repository]=await Promise.all([gh<any>(`${base}/pulls/${number}`),ghList<GitHubFile>(`${base}/pulls/${number}/files`),ghList<any>(`${base}/pulls/${number}/commits`),gh<any>(`${base}/issues/${number}`),ghList<any>(`${base}/issues/${number}/comments`),ghList<any>(`${base}/pulls/${number}/reviews`),gh<any>(base)]);let checks:any={check_runs:[]};try{checks=await gh<any>(`${base}/commits/${pr.head.sha}/check-runs?per_page=100`);}catch{}return{owner,repo,number,pr,files,commits,issue,comments,reviews,checks,repository};}
export function diffStats(files:GitHubFile[]){return files.reduce((a,f)=>({additions:a.additions+f.additions,deletions:a.deletions+f.deletions}),{additions:0,deletions:0});}
