import {env} from 'cloudflare:workers';
export function storage(){if(!env.DB)throw new Error('Banco indisponível');return env.DB;}
