/* MultiChart Pro - PRO add-on: TradingView-style Long/Short tool, Replay (pick start bar), Time zones,
   tick-by-tick crypto, Forex panel, Supabase login + cloud sync. Load AFTER the other add-ons. */
(()=>{
if(typeof S==='undefined'||typeof charts==='undefined')return;
const D=document,$=s=>D.querySelector(s),top=$('#top')||D.body;
const note=m=>{const d=D.createElement('div');d.textContent=m;d.style.cssText='position:fixed;right:14px;bottom:14px;z-index:300;background:#1e222d;color:#e6e8ee;border:1px solid #2a2e39;border-radius:6px;padding:8px 12px;font:12px system-ui;max-width:320px';D.body.appendChild(d);setTimeout(()=>d.remove(),4500)};
const mk=(t,txt,css,ti)=>{const e=D.createElement(t);if(txt)e.textContent=txt;if(css)e.style.cssText=css;if(ti)e.title=ti;return e};
const PANEL='position:fixed;z-index:200;background:#131722;border:1px solid #232836;border-radius:6px;padding:10px 12px;font:12px system-ui;color:#c9ccd6;display:none';
const ts=c=>c.c.timeScale();
S.pos=S.pos||{};

/* ================= TIME ZONES ================= */
S.tz=S.tz||Intl.DateTimeFormat().resolvedOptions().timeZone||'UTC';
const ZS=(Intl.supportedValuesOf?Intl.supportedValuesOf('timeZone'):[]).concat('UTC'),fc={};
const F=(z,o)=>{const k=z+JSON.stringify(o);return fc[k]||(fc[k]=new Intl.DateTimeFormat('en-GB',{timeZone:z,hour12:false,...o}))};
const off=z=>{try{return F(z,{timeZoneName:'shortOffset'}).formatToParts(new Date()).find(p=>p.type==='timeZoneName').value}catch(e){return''}};
const tzSel=mk('select','','max-width:170px','Chart time zone');
tzSel.innerHTML=ZS.map(z=>`<option value="${z}">${z.replace(/_/g,' ')} (${off(z)})</option>`).join('');tzSel.value=S.tz;
tzSel.onchange=()=>{S.tz=tzSel.value;save();charts.forEach(c=>{c._tz=null;tzApply(c)})};
function tzApply(c){if(c._tz===S.tz)return;c._tz=S.tz;const z=S.tz,f=(t,o)=>F(z,o).format(t*1000);
 try{c.c.applyOptions({localization:{timeFormatter:t=>f(t,{day:'2-digit',month:'short',year:'2-digit',hour:'2-digit',minute:'2-digit'})},
  timeScale:{tickMarkFormatter:(t,ty)=>ty===0?f(t,{year:'numeric'}):ty===1?f(t,{month:'short'}):ty===2?f(t,{day:'numeric',month:'short'}):f(t,{hour:'2-digit',minute:'2-digit'})}})}catch(e){}}

/* ================= LONG / SHORT POSITION TOOL ================= */
function t2x(c,t){const a=c.view();if(!a.length)return null;const st=c.tfm*60,T=ts(c),L=a[a.length-1],bs=T.options().barSpacing;t=Math.floor(t/st)*st;
 if(t>L.time){const x=T.timeToCoordinate(L.time);return x==null?null:x+(t-L.time)/st*bs}
 if(t<a[0].time){const x=T.timeToCoordinate(a[0].time);return x==null?null:x-(a[0].time-t)/st*bs}
 let lo=0,hi=a.length-1;while(lo<hi){const m=(lo+hi+1)>>1;if(a[m].time<=t)lo=m;else hi=m-1}return T.timeToCoordinate(a[lo].time)}
function x2t(c,x){const a=c.view();if(!a.length)return null;const l=ts(c).coordinateToLogical(x);if(l==null)return null;const n=a.length-1,i=Math.round(l),st=c.tfm*60;return i>=0&&i<=n?a[i].time:i>n?a[n].time+(i-n)*st:a[0].time+i*st}
let selP=null,pendDir=0;
const pbar=mk('div',null,PANEL+';top:96px;left:50%;transform:translateX(-50%);align-items:center;gap:8px;z-index:150');
pbar.innerHTML='<b style="color:#e6b422">Position</b> Account <input data-k=acc type=number min=1 style="width:78px"> Risk % <input data-k=risk type=number min=.01 step=.1 style="width:54px"> <button data-a=flip title="Flip Long/Short">⇅</button><button data-a=del title="Delete (Del)">🗑</button>';
D.body.appendChild(pbar);
function showBar(){pbar.style.display=selP?'flex':'none';if(selP)pbar.querySelectorAll('input').forEach(i=>i.value=selP[i.dataset.k])}
const rmPos=o=>{for(const k in S.pos){const i=S.pos[k].indexOf(o);if(i>=0)S.pos[k].splice(i,1)}if(selP===o)selP=null;save();showBar()};
pbar.onchange=e=>{const t=e.target;if(selP&&t.dataset.k){const v=parseFloat(t.value);if(v>0){selP[t.dataset.k]=v;if(t.dataset.k==='acc')S.pacc=v;else S.prisk=v;save()}}};
pbar.onclick=e=>{const a=e.target.dataset.a;if(!selP||!a)return;if(a==='del')return rmPos(selP);
 const o=selP,d=o.dir;o.dir=-d;const sd=Math.abs(o.e-o.sl),td=Math.abs(o.tp-o.e);o.sl=o.e+o.dir*-sd;o.tp=o.e+o.dir*td;save()};
const tb=$('#tools');
[['Long',1],['Short',-1]].forEach(([n,d])=>{const b=mk('button',n,d>0?'color:#26a69a':'color:#ef5350','Click on the chart to place a '+n+' position');
 b.onclick=()=>{const cur=tb&&tb.querySelector('button[data-t=cur]');if(cur)cur.click();pendDir=d;selP=null;showBar();note('Click on the chart to place the '+n+' position')};(tb||top).appendChild(b)});
tb&&tb.addEventListener('click',e=>{if(e.target.dataset&&e.target.dataset.t)pendDir=0},true);

function bind(c,cv){
 const pos=e=>{const r=cv.getBoundingClientRect();return{x:e.clientX-r.left,y:e.clientY-r.top}};
 const hit=q=>{for(const g of(c.pg||[]).slice().reverse()){
  if(selP===g.o)for(const[m,x,y]of[['sl',g.xl,g.ys],['tp',g.xl,g.yt],['w',g.xr,g.ye]])if(Math.hypot(q.x-x,q.y-y)<=9)return{g,m};
  if(q.x>=g.xl&&q.x<=g.xr&&q.y>=Math.min(g.ys,g.yt,g.ye)&&q.y<=Math.max(g.ys,g.yt,g.ye))return{g,m:'mv'}}return null};
 cv.addEventListener('mousemove',e=>{if(c.pdrag)return;const h=hit(pos(e));cv.style.cursor=h?(h.m==='mv'?'move':h.m==='w'?'ew-resize':'ns-resize'):pendDir?'copy':''},true);
 cv.addEventListener('mousedown',e=>{if(e.button)return;const q=pos(e);
  if(pendDir){const t=x2t(c,q.x),p=c.s.coordinateToPrice(q.y);if(t==null||p==null)return;e.stopPropagation();e.preventDefault();
   const st=c.tfm*60,t0=Math.floor(t/st)*st,d=Math.abs(p)*.003,o={id:Date.now()+'',dir:pendDir,t0,t1:t0+st*25,e:p,sl:p-pendDir*d,tp:p+pendDir*d*2,acc:S.pacc||1000,risk:S.prisk||1};
   (S.pos[c.cfg.sym]=S.pos[c.cfg.sym]||[]).push(o);selP=o;pendDir=0;save();showBar();return}
  const h=hit(q);if(!h){if(selP){selP=null;showBar()}return}
  e.stopPropagation();e.preventDefault();selP=h.g.o;showBar();
  const o=h.g.o,s0={...o},p0=c.s.coordinateToPrice(q.y),t0=x2t(c,q.x),st=c.tfm*60;c.pdrag=1;
  const mv=ev=>{const q=pos(ev),p=c.s.coordinateToPrice(q.y),t=x2t(c,q.x);if(p==null||t==null)return;
   if(h.m==='sl'){if(o.dir*(o.e-p)>0)o.sl=p}else if(h.m==='tp'){if(o.dir*(p-o.e)>0)o.tp=p}
   else if(h.m==='w')o.t1=Math.max(o.t0+st,Math.round(t/st)*st);
   else{const dp=p-p0,dt=Math.round((t-t0)/st)*st;o.e=s0.e+dp;o.sl=s0.sl+dp;o.tp=s0.tp+dp;o.t0=s0.t0+dt;o.t1=s0.t1+dt}};
  const up=()=>{D.removeEventListener('mousemove',mv);D.removeEventListener('mouseup',up);c.pdrag=0;save()};
  D.addEventListener('mousemove',mv);D.addEventListener('mouseup',up)},true)}
/* where did price go after entry? -> TP hit / SL hit / still open (cached per position) */
function outcome(a,o){let fav=o.e,adv=o.e,kind='open',te=o.t0,lc=o.e;
 for(const b of a){if(b.time<o.t0)continue;if(b.time>o.t1)break;
  const first=b.time===o.t0;te=b.time;lc=b.close;
  if(o.dir*(b.close-fav)>0)fav=b.close;if(o.dir*(adv-b.close)>0)adv=b.close; /* extent follows closes, not wicks */
  if(!first){const sl=o.dir>0?b.low<=o.sl:b.high>=o.sl,tp=o.dir>0?b.high>=o.tp:b.low<=o.tp;
   if(sl){kind='sl';break}if(tp){kind='tp';break}}}
 if(kind==='tp'){fav=o.tp;adv=o.e}else if(kind==='sl'){adv=o.sl;fav=o.e}
 else{const d=o.dir*(lc-o.e);if(d>0)adv=o.e;else if(d<0)fav=o.e;else fav=adv=o.e} /* only the side price is on is highlighted */
 if(o.dir*(fav-o.tp)>0)fav=o.tp;if(o.dir*(o.sl-adv)>0)adv=o.sl;
 return{kind,te,fav,adv}}
function frame(c){
 const cv=c.host.querySelector('.cv');if(!cv)return;tzApply(c);
 if(!c.pcv||!c.pcv.isConnected){c.pcv=mk('canvas','','position:absolute;left:0;top:0;width:100%;height:100%;z-index:6;pointer-events:none');cv.appendChild(c.pcv);bind(c,cv)}
 const k=c.pcv,w=k.clientWidth,h=k.clientHeight,r=devicePixelRatio||1;
 if(k.width!==Math.round(w*r)||k.height!==Math.round(h*r)){k.width=Math.round(w*r);k.height=Math.round(h*r)}
 const g=k.getContext('2d');g.setTransform(r,0,0,r,0,0);g.clearRect(0,0,w,h);c.pg=[];
 const L=S.pos[c.cfg.sym]||[],a=c.view();if(!L.length||!a.length)return;
 let pw=50;try{pw=c.c.priceScale('right').width()}catch(e){}
 g.save();g.beginPath();g.rect(0,0,w-pw,h-26);g.clip();
 const last=a[a.length-1].close,pr=c.precision||2,tick=10**-pr,f=v=>v.toFixed(pr);g.font='11px system-ui';g.textAlign='center';g.textBaseline='middle';
 const lab=(lines,cx,cy,bg)=>{const m=Math.max(...lines.map(t=>g.measureText(t).width))+12,hh=lines.length*14+4;g.fillStyle=bg;g.fillRect(cx-m/2,cy-hh/2,m,hh);g.fillStyle='#fff';lines.forEach((t,i)=>g.fillText(t,cx,cy-hh/2+9+i*14))};
 for(const o of L){
  const xl=t2x(c,o.t0),xr=t2x(c,o.t1),ye=c.s.priceToCoordinate(o.e),ys=c.s.priceToCoordinate(o.sl),yt=c.s.priceToCoordinate(o.tp);
  if([xl,xr,ye,ys,yt].some(v=>v==null))continue;c.pg.push({o,xl,xr,ye,ys,yt});
  const sd=Math.abs(o.e-o.sl),td=Math.abs(o.tp-o.e),qty=sd>0?o.acc*o.risk/100/sd:0,pnl=o.dir*(last-o.e)*qty,rr=sd>0?td/sd:0,q2=v=>v>=100?v.toFixed(0):v.toFixed(2),cx=(xl+xr)/2;
  const lb_=a[a.length-1],key=[a.length,lb_.time,lb_.high,lb_.low,lb_.close,o.t0,o.t1,o.sl,o.tp,o.dir,c.tfm].join('|'),pc=c.pcache=c.pcache||{};let rs=pc[o.id];if(!rs||rs.key!==key){rs=pc[o.id]=outcome(a,o);rs.key=key}
  const xe=Math.min(xr,Math.max(xl,t2x(c,rs.te)??xl)),ty=Math.min(ye,yt),th=Math.abs(yt-ye),ry=Math.min(ye,ys),rh=Math.abs(ys-ye),dk=rs.kind==='open'?.45:.5;
  g.fillStyle='rgba(38,166,154,.16)';g.fillRect(xl,ty,xr-xl,th);g.fillStyle='rgba(239,83,80,.16)';g.fillRect(xl,ry,xr-xl,rh);
  const yfv=c.s.priceToCoordinate(rs.fav),yad=c.s.priceToCoordinate(rs.adv);
  const xd=rs.kind==='open'?xr:xe; /* open: dark fill spans the whole width (like TradingView); closed: stops at the exit bar */
  if(yfv!=null&&xd>xl){g.fillStyle='rgba(38,166,154,'+dk+')';g.fillRect(xl,Math.min(ye,yfv),xd-xl,Math.abs(yfv-ye))}
  if(yad!=null&&xd>xl){g.fillStyle='rgba(239,83,80,'+dk+')';g.fillRect(xl,Math.min(ye,yad),xd-xl,Math.abs(yad-ye))}
  g.lineWidth=1;[[ye,'#9aa0b0'],[ys,'#ef5350'],[yt,'#26a69a']].forEach(([y,col])=>{g.strokeStyle=col;g.beginPath();g.moveTo(xl,y);g.lineTo(xr,y);g.stroke()});
  if(selP===o){lab([`Stop: ${f(sd)} (${(sd/o.e*100).toFixed(3)}%) ${Math.round(sd/tick)}, Amount: ${q2(qty*sd)}`],cx,ys+(ys<ye?-12:12),'#ef5350');
  lab([`Target: ${f(td)} (${(td/o.e*100).toFixed(3)}%) ${Math.round(td/tick)}, Amount: ${q2(qty*td)}`],cx,yt+(yt<ye?-12:12),'#26a69a');
  lab([`Open PnL: ${q2(pnl)}, Qty: ${q2(qty)}`,`Risk/reward ratio: ${rr.toFixed(2)}`],cx,ye+(o.dir>0?-22:22),pnl>=0?'#26a69a':'#ef5350')}
  if(selP===o)for(const[x,y,rd]of[[xl,ys,0],[xl,yt,0],[xr,ye,1]]){g.fillStyle='#fff';g.strokeStyle='#2962ff';g.lineWidth=2;g.beginPath();rd?g.arc(x,y,5,0,7):g.rect(x-4,y-4,8,8);g.fill();g.stroke()}}
 g.restore()}
(function loop(){try{charts.forEach(frame)}catch(e){}requestAnimationFrame(loop)})();
D.addEventListener('keydown',e=>{
 if(e.key==='Escape'){pendDir=0;rpEnd();selP=null;showBar()}
 if((e.key==='Delete'||e.key==='Backspace')&&selP&&!/INPUT|TEXTAREA|SELECT/.test(e.target.tagName))rmPos(selP)});

/* ================= REPLAY: click a bar, chart is cut there, then play ================= */
const rpb=$('#rp'),rpc=$('#rpc');let rsel=null;
function rpEnd(){if(!rsel)return;rsel.cv.removeEventListener('mousedown',rsel.fn,true);rsel.cv.removeEventListener('mousemove',rsel.mm,true);rsel.ln.remove();rsel.tip.remove();rsel=null;if(!rpc.hidden||(act&&act.rp!=null)){}else rpb.classList.remove('on')}
if(rpb)rpb.onclick=()=>{
 if(rsel){rpEnd();return}
 const c=act||charts[0];
 if(c.rp!=null){c.rpOff();rpb.classList.remove('on');rpc.hidden=true;const pb=$('#rpl');if(pb)pb.textContent='▶';return}
 const cv=c.host.querySelector('.cv'),ln=mk('div','','position:absolute;top:0;bottom:26px;width:0;border-left:1px dashed #e6b422;z-index:7;pointer-events:none'),
  tip=mk('div','✂ Click a bar to start replay · Esc to cancel','position:absolute;top:8px;left:50%;transform:translateX(-50%);z-index:8;background:#e6b422;color:#131722;padding:4px 10px;border-radius:4px;font:12px system-ui;pointer-events:none');
 cv.appendChild(ln);cv.appendChild(tip);rpb.classList.add('on');
 const mm=e=>{ln.style.left=(e.clientX-cv.getBoundingClientRect().left)+'px'},
  fn=e=>{if(e.button)return;e.stopPropagation();e.preventDefault();const l=ts(c).coordinateToLogical(e.clientX-cv.getBoundingClientRect().left);if(l==null)return;
   const i=Math.max(10,Math.min(c.ag.length-1,Math.round(l)));rpEnd();c.rp=i+1;c.render(0);rpb.classList.add('on');rpc.hidden=false};
 cv.addEventListener('mousemove',mm,true);cv.addEventListener('mousedown',fn,true);rsel={cv,ln,tip,fn,mm}};

/* ================= TICK-BY-TICK (Binance trade stream) ================= */
const L0=Ch.prototype.live,C0=Ch.prototype.close;
Ch.prototype.live=function(){L0.call(this);if(this.src!=='BN'||!this.ok)return;
 const c=this,st=c.nat*60,w=c.ws2=new WebSocket(`wss://stream.binance.com:9443/ws/${c.name.toLowerCase()}@trade`);let acc=null,tm=0;
 const flush=()=>{tm=0;const r=c.raw,l=r&&r[r.length-1];if(!acc||!l)return;
  if(acc.time===l.time)c.tick({...l,high:Math.max(l.high,acc.high),low:Math.min(l.low,acc.low),close:acc.close});else if(acc.time>l.time)c.tick({...acc})};
 w.onmessage=e=>{const d=JSON.parse(e.data),p=+d.p,q=+d.q,t=Math.floor(d.T/1000/st)*st;
  if(!acc||acc.time!==t)acc={time:t,open:p,high:p,low:p,close:p,volume:q};else{acc.high=Math.max(acc.high,p);acc.low=Math.min(acc.low,p);acc.close=p;acc.volume+=q}
  if(!tm)tm=setTimeout(flush,60)}};
Ch.prototype.close=function(){if(this.ws2){this.ws2.onmessage=null;this.ws2.close();this.ws2=null}C0.call(this)};

/* ================= FOREX PANEL ================= */
const FXG={'Metals':'XAUUSD XAGUSD','Majors':'EURUSD GBPUSD USDJPY USDCHF AUDUSD NZDUSD USDCAD','Minors / Crosses':'EURGBP EURJPY EURCHF EURAUD EURNZD EURCAD GBPJPY GBPCHF GBPAUD GBPNZD GBPCAD AUDJPY AUDNZD AUDCAD AUDCHF NZDJPY NZDCAD NZDCHF CADJPY CADCHF CHFJPY',
 'Exotics':'USDSEK USDNOK USDDKK USDSGD USDHKD USDMXN USDZAR USDTRY USDPLN USDCZK USDHUF USDCNH USDINR USDTHB EURSEK EURNOK EURTRY EURPLN EURHUF EURZAR GBPSEK GBPNOK GBPTRY'};
const fb=mk('button','Forex','','All forex pairs & metals'),fp=mk('div',null,PANEL+';top:84px;right:14px;width:260px;max-height:70vh;overflow:auto');
fp.innerHTML='<input placeholder="Search pair…" style="width:100%;margin-bottom:6px"><div></div>';D.body.appendChild(fp);
const fl=fp.lastChild,fs=fp.firstChild,fdraw=()=>{const q=fs.value.toUpperCase().replace(/[\/ ]/g,'');fl.innerHTML=Object.entries(FXG).map(([g,v])=>{const p=v.split(' ').filter(x=>x.includes(q));return p.length?`<div style="color:#7b8194;margin:6px 0 2px">${g}</div>`+p.map(x=>`<button data-p=${x} style="margin:2px">${x.slice(0,3)}/${x.slice(3)}</button>`).join(''):''}).join('')};
fs.oninput=fdraw;fdraw();fl.onclick=e=>{const p=e.target.dataset.p;if(p)(act||charts[0]).setSym('FX:'+p)};
fb.onclick=()=>{fp.style.display=fp.style.display==='block'?'none':'block'};

/* ================= LOGIN WALL + CLOUD SYNC (Supabase) ================= */
const CF=window.MCP_CFG||{},lb=mk('button','Login','','Account'),lp=mk('div',null,PANEL+';top:84px;right:14px;width:230px;z-index:210');
lp.innerHTML='<b style="color:#e6b422">Account</b><div id=lpm style="margin:6px 0;color:#7b8194"></div><button id=lpo>Logout</button>';D.body.appendChild(lp);
const wall=mk('div',null,'position:fixed;inset:0;z-index:1000;background:#0b0e14;display:flex;align-items:center;justify-content:center;font:13px system-ui;color:#c9ccd6');
wall.innerHTML='<div style="width:330px;max-width:92vw;background:#131722;border:1px solid #232836;border-radius:10px;padding:22px"><div style="font-size:21px;font-weight:700;color:#e6b422;margin-bottom:4px">MultiChart Pro</div><div style="color:#7b8194;margin-bottom:14px">Login or create a free account to open your charts.</div><input id=we type=email placeholder=Email autocomplete=email style="width:100%;margin:4px 0;padding:9px"><input id=wp type=password placeholder="Password (min 6 characters)" autocomplete=current-password style="width:100%;margin:4px 0;padding:9px"><div style="display:flex;gap:8px;margin-top:8px"><button id=wi style="flex:1;padding:9px;background:#e6b422;color:#111;border:0;font-weight:600">Login</button><button id=wr style="flex:1;padding:9px">Register</button></div><div id=wm style="margin-top:12px;min-height:34px;color:#7b8194">Loading…</div><a id=wk href="#" style="display:none;margin-top:6px;text-align:center;color:#7b8194">Skip login (local use only)</a></div>';
D.body.appendChild(wall);
const W=s=>wall.querySelector(s),msg=(t,ok)=>{const m=W('#wm');m.style.color=ok===2?'#7b8194':ok?'#26a69a':'#ef9a9a';m.textContent=t};
let sb=null,user=null,timer=0,skipped=0;const SK='mcp_synced_at',snap=()=>{const s=JSON.parse(JSON.stringify(S));delete s.bridge;return s};
function gate(){wall.style.display=(user||skipped)?'none':'flex';lb.textContent=user?'☁ '+user.email.split('@')[0]:'Login';lp.querySelector('#lpm').textContent=user?user.email+' · charts sync automatically':''}
async function push(){if(!user)return;const now=new Date().toISOString(),{error}=await sb.from('user_state').upsert({user_id:user.id,state:snap(),updated_at:now});if(!error)localStorage.setItem(SK,now);else console.warn('sync',error.message)}
async function pull(){const{data}=await sb.from('user_state').select('state,updated_at').eq('user_id',user.id).maybeSingle();
 if(data&&data.state&&(!localStorage.getItem(SK)||Date.parse(data.updated_at)>Date.parse(localStorage.getItem(SK)))&&JSON.stringify(data.state)!==JSON.stringify(snap())){
  const keep=S.bridge;Object.keys(S).forEach(k=>delete S[k]);Object.assign(S,data.state,{bridge:keep});localStorage.setItem(SK,data.updated_at);save();note('Loading your saved charts…');setTimeout(()=>location.reload(),500)}
 else push()}
function enter(u){const last=localStorage.getItem('mcp_uid');localStorage.setItem('mcp_uid',u.id);
 if(last&&last!==u.id){localStorage.removeItem('mcp');localStorage.removeItem(SK);location.reload();return} /* another person on this device: never show previous user's drawings */
 pull()}
const sp=Storage.prototype.setItem;Storage.prototype.setItem=function(k,v){sp.call(this,k,v);if(k==='mcp'&&user){clearTimeout(timer);timer=setTimeout(push,2000)}};
async function initSb(){
 if(!CF.supabaseUrl||!CF.supabaseKey)return msg('Login is not configured: fill supabaseUrl and supabaseKey in config.js');
 await new Promise(r=>{if(window.supabase)return r();const s=D.createElement('script');s.src='https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.50.0/dist/umd/supabase.min.js';s.onload=s.onerror=r;D.head.appendChild(s)});
 if(!window.supabase)return msg('Could not load the login library. Check your connection and reload.');
 sb=supabase.createClient(CF.supabaseUrl,CF.supabaseKey);msg('',2);
 sb.auth.onAuthStateChange((ev,s)=>{const was=user;user=s?s.user:null;gate();if(user&&(!was||was.id!==user.id))setTimeout(()=>enter(user),0)})}
const cred=()=>{const e=W('#we').value.trim(),p=W('#wp').value;if(!/^\S+@\S+\.\S+$/.test(e)){msg('Enter a valid email address');return null}if(p.length<6){msg('Password must be at least 6 characters');return null}return{email:e,password:p}};
W('#wi').onclick=async()=>{if(!sb)return;const c=cred();if(!c)return;msg('Signing in…',2);const{error}=await sb.auth.signInWithPassword(c);if(error)msg(/invalid login/i.test(error.message)?'Wrong email or password. If you just registered, confirm your email first.':error.message)};
W('#wr').onclick=async()=>{if(!sb)return;const c=cred();if(!c)return;msg('Creating account…',2);
 try{const r=await fetch('/signup',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(c)}),j=await r.json().catch(()=>({}));
  if(r.ok){const{error}=await sb.auth.signInWithPassword(c);if(error)msg(error.message);return}
  if(j.error&&j.error!=='not configured')return msg(j.error)}catch(e){}
 const{data,error}=await sb.auth.signUp(c); /* fallback: normal Supabase sign-up (needs confirmation email) */
 if(error)msg(error.message);else if(data.user&&data.user.identities&&!data.user.identities.length)msg('This email is already registered. Use Login.');else if(!data.session)msg('Account created. Open the confirmation email, click the link, then Login here.',1)};
wall.onkeydown=e=>{if(e.key==='Enter')W('#wi').click()};
lp.querySelector('#lpo').onclick=async()=>{const u=user;user=null;localStorage.removeItem('mcp');await sb.auth.signOut();location.reload()};
lb.onclick=()=>{fp.style.display='none';lp.style.display=lp.style.display==='block'?'none':'block'};
fb.onclick=()=>{lp.style.display='none';fp.style.display=fp.style.display==='block'?'none':'block'};
if(/^(localhost|127\.)/.test(location.hostname)||location.protocol==='file:'){const k=W('#wk');k.style.display='block';k.onclick=e=>{e.preventDefault();skipped=1;gate()}}
gate();initSb();

/* ================= MOBILE LAYOUT + hide/show side panel ================= */
const css=D.createElement('style');css.textContent=`
body.nosd #side{display:none}
#fl{display:none;position:fixed;right:8px;bottom:34px;z-index:120;gap:6px}
#fl button{background:rgba(19,23,34,.92);border:1px solid #2a2e39;border-radius:18px;padding:7px 12px;font-size:13px}
@media(max-width:820px){
 #main{flex-direction:column}
 #side{width:100%;border-left:0;border-top:1px solid var(--ln);max-height:42vh;flex:none}
 #top{flex-wrap:nowrap;overflow-x:auto;white-space:nowrap;-webkit-overflow-scrolling:touch;padding:4px 6px;scrollbar-width:none}
 #top>*{flex:none}
 body.notb #top{display:none}
 #tabs{overflow-x:auto}
 #fl{display:flex}
 .hd .sy{width:88px}.hd .ohlc{display:none}
 #pbarfix{}
}`;D.head.appendChild(css);
const ps=mk('button','▤ Panel','','Show / hide watchlist panel'),fl2=mk('div',null,'');fl2.id='fl';
const fb1=mk('button','▤'),fb2=mk('button','☰');fb1.title='Watchlist panel';fb2.title='Toolbar';fl2.append(fb1,fb2);D.body.appendChild(fl2);
const narrow=()=>innerWidth<=820,rs=()=>setTimeout(()=>{dispatchEvent(new Event('resize'));charts.forEach(c=>{try{c.c.resize(c.host.querySelector('.cv').clientWidth,c.host.querySelector('.cv').clientHeight)}catch(e){}})},60);
const pref=localStorage.getItem('mcp_side');D.body.classList.toggle('nosd',pref==null?narrow():pref==='0');
const togSide=()=>{const h=!D.body.classList.contains('nosd');D.body.classList.toggle('nosd',h);localStorage.setItem('mcp_side',h?'0':'1');rs()};
ps.onclick=fb1.onclick=togSide;fb2.onclick=()=>{D.body.classList.toggle('notb');rs()};
addEventListener('resize',()=>{if(!narrow())D.body.classList.remove('notb')});
top.append(ps);
top.append(tzSel,fb,lb);
})();
