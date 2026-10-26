// Cloudflare Worker: serves the website (static assets) + free forex proxy (Yahoo) + crypto /fetch proxy + signup.
const OK=new Set(['api.binance.com','api.mexc.com','api.bybit.com','www.okx.com','api.gateio.ws','api.kucoin.com']);
const CORS={'Access-Control-Allow-Origin':'*','Access-Control-Allow-Methods':'GET,POST,OPTIONS','Access-Control-Allow-Headers':'*'};
const json=(b,s=200,x={})=>new Response(typeof b==='string'?b:JSON.stringify(b),{status:s,headers:{'content-type':'application/json',...CORS,...x}});
export default{async fetch(req,env){
 if(req.method==='OPTIONS')return new Response(null,{headers:CORS});
 const u=new URL(req.url);
 try{
  if(u.pathname==='/signup'){
   if(req.method!=='POST')return json({error:'POST only'},405);
   const b=await req.json().catch(()=>({})),email=String(b.email||'').trim().toLowerCase(),pw=String(b.password||'');
   if(!/^\S+@\S+\.\S+$/.test(email)||email.length>254||pw.length<6||pw.length>72)return json({error:'Enter a valid email and a password of 6+ characters'},400);
   if(!env.SUPABASE_URL||!env.SUPABASE_SERVICE_KEY)return json({error:'not configured'},501);
   const r=await fetch(env.SUPABASE_URL+'/auth/v1/admin/users',{method:'POST',headers:{'content-type':'application/json',apikey:env.SUPABASE_SERVICE_KEY,Authorization:'Bearer '+env.SUPABASE_SERVICE_KEY},body:JSON.stringify({email,password:pw,email_confirm:true})});
   const t=await r.json().catch(()=>({}));if(r.ok)return json({ok:true});
   const m=t.msg||t.message||t.error_description||t.error||'Sign up failed';
   return json({error:/already|exists|registered/i.test(m)?'This email is already registered. Use Login.':m},r.status>=400&&r.status<500?r.status:502)}
  if(u.pathname==='/fx'){const path=u.searchParams.get('path')||'';
   if(!path.startsWith('/v8/finance/chart/')||/\.\.|[\\\r\n]/.test(path))return json({error:'bad path'},400);
   const r=await fetch('https://query1.finance.yahoo.com'+path,{headers:{'User-Agent':'Mozilla/5.0','Accept':'application/json'},cf:{cacheTtl:2,cacheEverything:true}});
   return json(await r.text(),r.status,{'Cache-Control':'public, max-age=2'})}
  if(u.pathname==='/fetch'){let t;try{t=new URL(u.searchParams.get('url')||'')}catch(e){return json({error:'bad url'},400)}
   if(t.protocol!=='https:'||!OK.has(t.hostname))return json({error:'host not allowed'},400);
   const r=await fetch(t.href,{headers:{'User-Agent':'MultiChart-Pro/1.0'}});return json(await r.text(),r.status)}
  if(u.pathname==='/ping')return json({ok:true});
  /* MT5 only exists on your own PC (START.bat). On the hosted site answer clearly instead of returning a 404 page. */
  if(u.pathname==='/candles'||u.pathname==='/symbols')return json({error:'MT5 bridge is only available when you run START.bat on your own PC'},501);
 }catch(e){return json({error:String(e)},502)}
 return env.ASSETS?env.ASSETS.fetch(req):json({error:'not found'},404)}}
