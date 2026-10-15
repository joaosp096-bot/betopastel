import {env} from 'cloudflare:workers';
import {session} from '@/lib/password-auth';
export const dynamic='force-dynamic';
export const GET=(req:Request)=>session(req,env);
