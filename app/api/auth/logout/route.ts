import {env} from 'cloudflare:workers';
import {logout} from '@/lib/password-auth';
export const dynamic='force-dynamic';
export const POST=(req:Request)=>logout(req,env);
