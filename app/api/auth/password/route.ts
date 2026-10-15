import {env} from 'cloudflare:workers';
import {changePassword} from '@/lib/password-auth';
export const dynamic='force-dynamic';
export const POST=(req:Request)=>changePassword(req,env);
