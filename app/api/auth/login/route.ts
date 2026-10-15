import {env} from 'cloudflare:workers';
import {login} from '@/lib/password-auth';
export const dynamic='force-dynamic';
export const POST=(req:Request)=>login(req,env);
