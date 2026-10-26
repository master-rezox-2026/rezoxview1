/* MultiChart Pro add-on: OrderFlow Scalper (confluence signal engine)
   Install: add AFTER multichart-addons.js, right before </body>:
     <script src="multichart-addons.js"></script>
     <script src="orderflow-scalper.js"></script>
   Adds two buttons to the top bar: "OF Scalp" (on/off) and "⚙" (settings).
   Signals are evaluated on CLOSED bars only (no repaint).
   Order-flow data: 1m candles with taker-buy volume (real for Binance symbols,
   estimated from candle shape for MT5 / other venues - shown as "estimated" and
   a stricter score is required). Not financial advice; always demo-test first. */
(()=>{
/* ================= pure engine (no DOM) ================= */
const nice=v=>{const e=10**Math.floor(Math.log10(v)),m=v/e;return(m<=1?1:m<=2?2:m<=5?5:10)*e};
const med=x=>{const s=x.filter(Number.isFinite).sort((p,q)=>p-q);return s.length?s[s.length>>1]:0};
const rma=(s,n)=>{let p,sm=0;return s.map((v,i)=>{if(i<n-1){sm+=v;return NaN}if(i===n-1){sm+=v;return p=sm/n}return p=(p*(n-1)+v)/n})};
const ema=(s,n)=>{const k=2/(n+1);let p,sm=0;return s.map((v,i)=>{if(i<n-1){sm+=v;return NaN}if(i===n-1){sm+=v;return p=sm/n}return p=v*k+p*(1-k)})};
const rsiA=(s,n)=>{const u=s.map((v,i)=>i?Math.max(v-s[i-1],0):0),d=s.map((v,i)=>i?Math.max(s[i-1]-v,0):0),A=rma(u,n),B=rma(d,n);return A.map((x,i)=>B[i]===0?100:100-100/(1+x/B[i]))};
const MAXS=12;

function compute(a,m,tfm,o,est){
 const n=a.length,step=tfm*60,close=a.map(x=>x.close);
 const tr=a.map((x,i)=>i?Math.max(x.high-x.low,Math.abs(x.high-a[i-1].close),Math.abs(x.low-a[i-1].close)):x.high-x.low);
 const atr=rma(tr,14),e21=ema(close,21),e55=ema(close,55),rsi=rsiA(close,14);
 /* --- per-bar order flow from 1m candles --- */
 const tick=Math.max(nice((med(a.map(x=>x.high-x.low))/10)||1e-8),1e-8),fl=new Array(n);let j=0;
 while(j<m.length&&m[j].time<a[0].time)j++;
 for(let i=0;i<n;i++){
  const t0=a[i].time,t1=t0+step;let buy=0,sell=0,cnt=0;const bins=new Map();
  while(j<m.length&&m[j].time<t1){const x=m[j++];if(x.time<t0)continue;
   const bv=x.bv,sv=Math.max(0,x.volume-bv);buy+=bv;sell+=sv;cnt++;
   const lo=Math.floor(x.low/tick+1e-9),hi=Math.min(Math.floor(x.high/tick+1e-9),lo+400),nb=hi-lo+1;
   for(let k=lo;k<=hi;k++){const e=bins.get(k)||{b:0,s:0};e.b+=bv/nb;e.s+=sv/nb;bins.set(k,e)}}
  const vol=buy+sell,delta=buy-sell;let sb=0,ss=0,rb=0,rs=0,pk=null;
  if(bins.size){const ks=[...bins.keys()].sort((p,q)=>p-q),minV=vol/ks.length*.5;
   for(const k of ks){const e=bins.get(k),lo=bins.get(k-1),hi=bins.get(k+1);
    if(pk===null||k!==pk+1){rb=0;rs=0}pk=k;
    rb=e.b>=minV&&e.b>=3*(lo?lo.s:0)?rb+1:0;rs=e.s>=minV&&e.s>=3*(hi?hi.b:0)?rs+1:0;sb=Math.max(sb,rb);ss=Math.max(ss,rs)}}
  fl[i]={buy,sell,vol,delta,dr:vol?delta/vol:0,cov:cnt>=Math.max(1,Math.floor(tfm*.6)),sb:sb>=3,ss:ss>=3}}
 /* --- session VWAP (UTC day) + bands --- */
 let day=-1,pv=0,vv=0,p2=0;const vw=[],sd=[];
 for(let i=0;i<n;i++){const d=Math.floor(a[i].time/86400);if(d!==day){day=d;pv=vv=p2=0}
  const p=(a[i].high+a[i].low+a[i].close)/3,v=a[i].volume||1;pv+=p*v;vv+=v;p2+=p*p*v;const w=pv/vv;vw[i]=w;sd[i]=Math.sqrt(Math.max(0,p2/vv-w*w))}
 const volOf=i=>fl[i].cov?fl[i].vol:a[i].volume;
 const sigs=[],PL=[],PH=[],P=5;let last=-1e9,lastInfo=null;
 for(let i=0;i<=n-2;i++){
  if(i>=2*P){const k=i-P;let lo=true,hi=true;for(let q=k-P;q<=k+P;q++){if(q===k)continue;if(a[q].low<a[k].low)lo=false;if(a[q].high>a[k].high)hi=false}
   if(lo)PL.push({k,p:a[k].low});if(hi)PH.push({k,p:a[k].high})}
  if(i<60||!fl[i].cov||!(atr[i]>0)||!(e55[i]>0))continue;
  const x=a[i],f=fl[i],A=atr[i];let av=0;for(let q=i-20;q<i;q++)av+=volOf(q);av/=20;
  const lows=PL.filter(z=>z.k>=i-120).slice(-3).map(z=>z.p),highs=PH.filter(z=>z.k>=i-120).slice(-3).map(z=>z.p);
  const score=s=>{let pts=0,zone=0,tg=0;const det=[],rg=x.high-x.low;
   if(s>0?e21[i]>e55[i]:e21[i]<e55[i]){pts++;det.push('Trend')}
   if(s>0?x.close>vw[i]-.3*A:x.close<vw[i]+.3*A){pts++;det.push('VWAP side')}
   const lv=[vw[i]].concat(sd[i]>0?[vw[i]-s*sd[i]]:[],s>0?lows:highs),ext=s>0?x.low:x.high;
   if(lv.some(L=>Math.abs(ext-L)<=.4*A&&(s>0?x.close>L-.1*A:x.close<L+.1*A))){zone=2;pts+=2;det.push('Zone')}
   if(volOf(i)>=1.4*av&&s*f.dr<=-.12&&(s>0?x.close>=x.low+.5*rg:x.close<=x.high-.5*rg)){tg+=2;pts+=2;det.push('Absorption')}
   let k=-1;for(let q=i-8;q<i;q++)if(q>=0&&(k<0||(s>0?a[q].low<a[k].low:a[q].high>a[k].high)))k=q;
   if(k>=0&&fl[k].cov&&(s>0?x.low<a[k].low:x.high>a[k].high)&&s*(f.dr-fl[k].dr)>.1){tg+=2;pts+=2;det.push('Delta div')}
   if(fl[i-1].cov&&s*f.dr>=.12&&s*fl[i-1].dr<=-.05){tg++;pts++;det.push('Delta flip')}
   if(s>0?f.sb:f.ss){tg++;pts++;det.push('Stacked imb')}
   if(volOf(i)>=1.2*av){pts++;det.push('Volume')}
   if(s>0?rsi[i-1]<40&&rsi[i]>rsi[i-1]:rsi[i-1]>60&&rsi[i]<rsi[i-1]){pts++;det.push('RSI turn')}
   return{pts,zone,tg,det}};
  const B=score(1),Sx=score(-1);
  if(i===n-2)lastInfo={B,S:Sx,bull:e21[i]>e55[i]&&x.close>vw[i]};
  if(i-last<o.cooldown)continue;
  const am=med(atr.slice(Math.max(14,i-100),i+1));if(A<.6*am)continue;
  if(o.sess){const h=new Date(x.time*1000).getUTCHours();if(h<o.sessFrom||h>=o.sessTo)continue}
  const thr=o.minScore+(est?2:0),ok=r=>r.zone&&r.tg>=2&&r.pts>=thr;
  let s=0,r=null;if(ok(B)&&(!ok(Sx)||B.pts>Sx.pts)){s=1;r=B}else if(ok(Sx)){s=-1;r=Sx}
  if(!s)continue;
  const entry=i+1<n?a[i+1].open:x.close;
  let sl=s>0?Math.min(x.low,a[i-1].low)-.25*A:Math.max(x.high,a[i-1].high)+.25*A,risk=Math.abs(entry-sl);
  if(risk<.6*A){sl=entry-s*.6*A;risk=.6*A}if(risk>2.2*A)continue;
  const tp1=entry+s*o.rr1*risk,tp2=entry+s*o.rr2*risk;let res='open',R=null;
  for(let q=i+1;q<n&&q<=i+60;q++){const y=a[q];
   if(s>0?y.low<=sl:y.high>=sl){res='L';R=-1;break}
   if(s>0?y.high>=tp1:y.low<=tp1){res='W';R=o.rr1;break}
   if(q===i+60){res='T';R=s*(y.close-entry)/risk}}
  sigs.push({i,time:x.time,dir:s,score:r.pts,det:r.det,entry,sl,tp1,tp2,res,R});last=i}
 const cl=sigs.filter(z=>z.R!=null),W=cl.filter(z=>z.R>0),Ls=cl.filter(z=>z.R<=0),gp=W.reduce((p,z)=>p+z.R,0),gl=-Ls.reduce((p,z)=>p+z.R,0);
 const stats={n:sigs.length,closed:cl.length,win:cl.length?W.length/cl.length*100:0,avgR:cl.length?cl.reduce((p,z)=>p+z.R,0)/cl.length:0,pf:gl?gp/gl:(gp?99:0)};
 return{sigs,stats,vw,sd,lastInfo,tick}}

if(typeof S==='undefined'){if(typeof module!=='undefined')module.exports={compute};return}

/* ================= MultiChart Pro integration ================= */
const D=document,$=s=>D.querySelector(s);
const DEF={on:1,minScore:7,rr1:1.5,rr2:2.5,cooldown:5,sess:0,sessFrom:7,sessTo:21,vwap:1,lines:1};
S.of=Object.assign({},DEF,S.of||{});
const UP='#26a69a',DN='#ef5350';

async function ofLoad(c){
 const key=c.cfg.sym+'|'+c.src,f=c.of&&c.of.key===key?c.of:(c.of={key,m:[],t:0,est:0,err:''});
 if(f.busy)return;f.busy=1;f.err='';
 try{let m=null;
  if(c.src!=='MT5')try{let out=[],end='';const pages=f.m.length&&!f.est?1:4;
   for(let p=0;p<pages;p++){const j=await jget(`https://api.binance.com/api/v3/klines?symbol=${c.name}&interval=1m&limit=1000${end}`);if(!Array.isArray(j)||!j.length)break;
    out=j.map(k=>({time:k[0]/1000,open:+k[1],high:+k[2],low:+k[3],close:+k[4],volume:+k[5],bv:+k[9]})).concat(out);end='&endTime='+(j[0][0]-1)}
   if(out.length){m=out;f.est=0}}catch(e){}
  if(!m){const d=c.src==='MT5'?await mt5(c.name,1,3000):await exCandles(c.src,c.name,1,1000);
   m=d.map(x=>({...x,bv:x.volume*(x.high>x.low?(x.close-x.low)/(x.high-x.low):.5)}));f.est=1}
  const mp=new Map(f.m.map(x=>[x.time,x]));m.forEach(x=>mp.set(x.time,x));
  f.m=[...mp.values()].sort((p,q)=>p.time-q.time).slice(-6000)}
 catch(e){f.err=String(e&&e.message||e)}
 f.busy=0;f.t=Date.now();try{ofRun(c)}catch(e){console.error('OF',e)}}

function cleanup(c){
 (c.ofs||[]).forEach(x=>{try{c.c.removeSeries(x)}catch(e){}});c.ofs=[];
 (c.ofl||[]).forEach(x=>{try{c.s.removePriceLine(x)}catch(e){}});c.ofl=[];
 if(c.ofm&&c.s.$extra)c.s.$extra=c.s.$extra.filter(x=>!c.ofm.includes(x));c.ofm=[]}
const remark=c=>{if(c.s.setMarkers&&c.s.$p)c.s.setMarkers(c.s.$base||[])};

function ofRun(c){
 cleanup(c);const o=S.of;
 if(!o.on){if(c.ofd)c.ofd.style.display='none';remark(c);return}
 const a=c.view(),key=c.cfg.sym+'|'+c.src,f=c.of&&c.of.key===key?c.of:null;
 if(!c.ofd){c.ofd=D.createElement('div');c.ofd.style.cssText='position:absolute;left:8px;top:32px;z-index:5;pointer-events:none;font:11px/1.45 system-ui;color:#c9ccd6;background:rgba(19,23,34,.85);border:1px solid #232836;border-radius:4px;padding:5px 8px;max-width:230px';c.host.querySelector('.cv').appendChild(c.ofd)}
 c.ofd.style.display='block';
 if(!f){c.ofd.innerHTML='<b style="color:#e6b422">OrderFlow Scalper</b><br>loading flow data…';ofLoad(c);return}
 if(a.length<80||!f.m.length){c.ofd.innerHTML='<b style="color:#e6b422">OrderFlow Scalper</b><br>'+(f.err?'<span style="color:#ef5350">'+f.err+'</span>':f.busy?'loading…':'not enough bars (need 80+)');return}
 const r=compute(a,f.m,c.tfm,o,f.est);c.ofr=r;
 /* VWAP + bands (gap at each new day) */
 if(o.vwap){const mk=(fn,col,ls)=>{const l=c.c.addLineSeries({color:col,lineWidth:1,lineStyle:ls,priceScaleId:'right',lastValueVisible:false,priceLineVisible:false,crosshairMarkerVisible:false});
   let day=-1;l.setData(a.map((x,i)=>{const d=Math.floor(x.time/86400),g=d!==day;day=d;return g?{time:x.time}:{time:x.time,value:fn(i)}}));c.ofs.push(l)};
  mk(i=>r.vw[i],'#e6b422',0);mk(i=>r.vw[i]+r.sd[i],'rgba(230,180,34,.45)',2);mk(i=>r.vw[i]-r.sd[i],'rgba(230,180,34,.45)',2)}
 /* markers */
 c.ofm=r.sigs.slice(-200).map(z=>({time:z.time,position:z.dir>0?'belowBar':'aboveBar',color:z.dir>0?UP:DN,shape:z.dir>0?'arrowUp':'arrowDown',text:(z.dir>0?'BUY ':'SELL ')+z.score+(f.est?'~':'')}));
 c.s.$extra=(c.s.$extra||[]).concat(c.ofm);remark(c);
 /* SL / TP lines for the latest signal (until it resolves) */
 const L=r.sigs[r.sigs.length-1];
 if(o.lines&&L&&(L.res==='open'||r.sigs.length&&L.i>=a.length-12)){
  [['Entry',L.entry,'#9aa0b0',2],['SL',L.sl,DN,0],['TP1',L.tp1,UP,2],['TP2',L.tp2,UP,0]].forEach(([t,p,col,ls])=>{try{c.ofl.push(c.s.createPriceLine({price:p,color:col,lineWidth:1,lineStyle:ls,axisLabelVisible:true,title:t}))}catch(e){}})}
 /* alert on a fresh signal (last closed bar) */
 if(L&&L.i===a.length-2&&c.ofk!==c.cfg.sym+L.time){c.ofk=c.cfg.sym+L.time;
  const p=c.precision||2;toast(c.cfg.sym+' · OF Scalper '+(L.dir>0?'BUY':'SELL')+' '+L.score+'/'+MAXS+' · entry≈'+L.entry.toFixed(p)+' SL '+L.sl.toFixed(p)+' TP '+L.tp1.toFixed(p)+' / '+L.tp2.toFixed(p))}
 /* dashboard */
 const li=r.lastInfo,st=r.stats,thr=o.minScore+(f.est?2:0);
 const bias=li?(li.bull?'<span style="color:'+UP+'">▲ Bull</span>':'<span style="color:'+DN+'">▼ Bear/Mixed</span>'):'–';
 const sc=li?'BUY <b>'+li.B.pts+'</b> · SELL <b>'+li.S.pts+'</b> / '+MAXS+' (need '+thr+')':'–';
 c.ofd.innerHTML='<b style="color:#e6b422">OrderFlow Scalper</b> <span style="color:'+(f.est?'#ef5350':UP)+'">'+(f.est?'estimated flow':'real taker flow')+'</span><br>'
  +'Bias: '+bias+'<br>Score (last closed bar): '+sc+'<br>'
  +'<span style="color:#7b8194">Backtest (loaded bars, no fees):</span><br>'
  +st.n+' signals · win '+st.win.toFixed(0)+'% · avg R '+st.avgR.toFixed(2)+' · PF '+st.pf.toFixed(2)}

/* ---------- UI: toggle + settings ---------- */
const ob=$('#top button[data-i=ob]'),b1=D.createElement('button'),b2=D.createElement('button');
b1.textContent='OF Scalp';b1.title='OrderFlow Scalper signals';b1.classList.toggle('on',!!S.of.on);
b2.textContent='⚙';b2.title='OrderFlow Scalper settings';
(ob?ob.after(b1,b2):($('#top')||D.body).append(b1,b2));
b1.onclick=()=>{S.of.on=+!S.of.on;b1.classList.toggle('on',!!S.of.on);save();charts.forEach(ofRun)};
const pn=D.createElement('div');pn.style.cssText='position:fixed;top:48px;right:14px;z-index:130;background:#131722;border:1px solid #232836;border-radius:6px;padding:10px 12px;font:12px system-ui;color:#c9ccd6;display:none;width:250px';
const FLD=[['minScore','Min score (of '+MAXS+')',1,MAXS,1],['rr1','TP1 R:R',.5,10,.1],['rr2','TP2 R:R',.5,20,.1],['cooldown','Cooldown (bars)',0,50,1],['sessFrom','Session from (UTC h)',0,23,1],['sessTo','Session to (UTC h)',1,24,1]];
pn.innerHTML='<b style="color:#e6b422">OrderFlow Scalper</b><div style="margin:6px 0;color:#7b8194">Higher min score = fewer, higher-quality signals.</div>'
 +FLD.map(([k,l,mn,mx,st])=>`<label style="display:flex;justify-content:space-between;margin:4px 0">${l}<input data-k=${k} type=number min=${mn} max=${mx} step=${st} value=${S.of[k]} style="width:64px"></label>`).join('')
 +[['sess','Session filter'],['vwap','Show VWAP + bands'],['lines','Show Entry/SL/TP lines']].map(([k,l])=>`<label style="display:flex;justify-content:space-between;margin:4px 0">${l}<input data-c=${k} type=checkbox ${S.of[k]?'checked':''}></label>`).join('');
pn.onchange=e=>{const t=e.target;if(t.dataset.k){const v=parseFloat(t.value);if(Number.isFinite(v))S.of[t.dataset.k]=v}else if(t.dataset.c)S.of[t.dataset.c]=+t.checked;save();charts.forEach(ofRun)};
D.body.appendChild(pn);b2.onclick=()=>{pn.style.display=pn.style.display==='none'?'block':'none'};

/* ---------- hooks ---------- */
const i1=Ch.prototype.ind;Ch.prototype.ind=function(){i1.call(this);try{ofRun(this)}catch(e){console.error('OF',e)}};
setInterval(()=>{if(S.of.on)charts.forEach(c=>{if(c.of&&!c.of.busy)ofLoad(c)})},20000);
charts.forEach(c=>{try{c.ind()}catch(e){}});
})();
