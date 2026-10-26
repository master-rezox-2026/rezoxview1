/* MultiChart Pro add-on: TradingView-style tools + Settings + All Cryptos.
   Install: put this file next to your HTML and add, right before </body>:
   <script src="multichart-addons.js"></script> */
(()=>{
const D=document,$=s=>D.querySelector(s);
const DEF={up:'#26a69a',dn:'#ef5350',borderUp:'#26a69a',borderDn:'#ef5350',wickUp:'#26a69a',wickDn:'#ef5350',bg:'#131722',gridColor:'#1a1f2c',crossColor:'#7b8194',grid:1,bord:1,wm:1,lp:1,mag:0,cross:0,mode:0,off:5,invert:0,scaleLabels:1,showOhlc:1,showLast:1,showCountdown:1,alertSound:1,alertNotify:0,activeAlerts:0,alertHide:1,news:1,dc:'#e6b422',dw:1};
S.set=Object.assign({},DEF,S.set||{});S.draw=S.draw||{};
let dtool='cur',dtmp=[],mouse=null,ALL=[],REC=null,sel=null,drag=null;const LS=[[],[6,4],[1.5,3]],HG=D.createElement('canvas').getContext('2d');
const NEED={ext:2,hr:1,cl:1,cir:2,ell:2,tri:3,pr:2,pos:2,fx:3,fan:2,ftz:2,abcd:4,xa:5,au:1,ad:1,tl:2,ray:2,ar:2,rc:2,fib:2,meas:2,ch:3,hl:1,vl:1,tx:1,pf:3,el:6,gn:2};
const FL=[0,.236,.382,.5,.618,.786,1],FC=['#9aa0b0','#ef5350','#e6b422','#26a69a','#4c8dff','#b06cf0','#9aa0b0'];

/* ---------- settings applied to a chart ---------- */
function apply(c){const o=S.set;if(!c.c||!c.s)return;
 c.c.applyOptions({layout:{background:{color:o.bg},textColor:'#8b91a3'},grid:{vertLines:{visible:!!o.grid,color:o.gridColor},horzLines:{visible:!!o.grid,color:o.gridColor}},crosshair:{mode:+o.cross,vertLine:{color:o.crossColor},horzLine:{color:o.crossColor}},rightPriceScale:{mode:+o.mode,visible:!!o.scaleLabels,invertScale:!!o.invert},timeScale:{rightOffset:+o.off},watermark:{visible:!!o.wm,text:c.cfg.sym+' · '+c.cfg.tf,color:'rgba(150,155,175,.13)',fontSize:34}});
 c.c.priceScale('right').applyOptions({scaleMargins:c.style==='footprint'?{top:.06,bottom:.17}:{top:.1,bottom:.1}});
 c.s.applyOptions({upColor:c.style==='hollow'?o.bg:c.style==='footprint'?'rgba(0,0,0,0)':o.up,downColor:c.style==='footprint'?'rgba(0,0,0,0)':o.dn,wickUpColor:o.wickUp,wickDownColor:o.wickDn,borderVisible:c.style==='hollow'||c.style==='footprint'||!!o.bord,borderUpColor:o.borderUp,borderDownColor:o.borderDn,lastValueVisible:!!o.lp,priceLineVisible:!!o.lp});
 if(c.ohlc)c.ohlc.hidden=!o.showOhlc;if(c.px)c.px.hidden=!o.showLast;if(c.cd)c.cd.hidden=!o.showCountdown}
const r0=Ch.prototype.render;Ch.prototype.render=function(f){r0.call(this,f);this.symI.setAttribute('list','dl');apply(this)};

/* ---------- coordinate helpers ---------- */
const stp=c=>c.tfm*60;
function t2x(c,t){const a=c.view();if(!a.length)return null;const ts=c.c.timeScale();let x=ts.timeToCoordinate(t);if(x!=null)return x;const l=a.length-1;return ts.logicalToCoordinate(t>a[l].time?l+(t-a[l].time)/stp(c):(t-a[0].time)/stp(c))}
function x2t(c,x){const a=c.view(),li=c.c.timeScale().coordinateToLogical(x);if(!a.length||li==null)return null;const l=a.length-1;return li<0?a[0].time+li*stp(c):li>l?a[l].time+(li-l)*stp(c):a[Math.round(li)].time}
function pt2d(c,x,y){const t=x2t(c,x);let p=c.s.coordinateToPrice(y);if(t==null||p==null)return null;
 if(+S.set.mag){const a=c.view(),b=a.find(v=>v.time===t);if(b){const levels=[b.open,b.high,b.low,b.close],nearest=levels.reduce((m,v)=>Math.abs(v-p)<Math.abs(m-p)?v:m),snapY=c.s.priceToCoordinate(nearest),dy=snapY==null?Infinity:Math.abs(snapY-y);if(+S.set.mag===2||dy<=12)p=nearest}}return{t,p}}

/* ---------- drawing renderer ---------- */
function dr(g,c,o,W,H){const P=o.p.map(q=>({x:t2x(c,q.t),y:c.s.priceToCoordinate(q.p),p:q.p,t:q.t}));if(P.some(q=>q.x==null||q.y==null))return;
 const[a,b,d]=P;g.strokeStyle=g.fillStyle=o.col;g.lineWidth=o.w;g.setLineDash(LS[o.ls||0]);g.font='11px system-ui';
 const bx=()=>{ln(a.x,a.y,b.x,a.y);ln(b.x,a.y,b.x,b.y);ln(b.x,b.y,a.x,b.y);ln(a.x,b.y,a.x,a.y)},ln=(x1,y1,x2,y2)=>{if(REC)REC.push([x1,y1,x2,y2]);g.beginPath();g.moveTo(x1,y1);g.lineTo(x2,y2);g.stroke()},fp=v=>v.toFixed(v>100?2:5),rt=(p,q)=>{const dx=q.x-p.x||1e-6,f=(dx>0?W-p.x:-p.x)/dx;return{x:p.x+dx*f,y:p.y+(q.y-p.y)*f}};
 switch(o.k){
 case'ext':{const p1=rt(b,a),p2=rt(a,b);ln(p1.x,p1.y,p2.x,p2.y);break}
 case'hr':ln(a.x,a.y,W,a.y);break;
 case'cl':ln(0,a.y,W,a.y);ln(a.x,0,a.x,H);break;
 case'cir':case'ell':{const rx=o.k==='cir'?Math.hypot(b.x-a.x,b.y-a.y):Math.abs(b.x-a.x)/2,ry=o.k==='cir'?rx:Math.abs(b.y-a.y)/2,cx=o.k==='cir'?a.x:(a.x+b.x)/2,cy=o.k==='cir'?a.y:(a.y+b.y)/2;g.beginPath();for(let i=0;i<=64;i++){const t=i/64*Math.PI*2,x=cx+rx*Math.cos(t),y=cy+ry*Math.sin(t);i?g.lineTo(x,y):g.moveTo(x,y);if(i){const u=(i-1)/64*Math.PI*2;if(REC)REC.push([cx+rx*Math.cos(u),cy+ry*Math.sin(u),x,y])}}g.save();g.globalAlpha*=.15;g.fill();g.restore();g.stroke();break}
 case'tri':ln(a.x,a.y,b.x,b.y);ln(b.x,b.y,d.x,d.y);ln(d.x,d.y,a.x,a.y);g.save();g.globalAlpha*=.15;g.beginPath();g.moveTo(a.x,a.y);g.lineTo(b.x,b.y);g.lineTo(d.x,d.y);g.fill();g.restore();break;
 case'pr':{const dp=b.p-a.p,x=Math.max(a.x,b.x);g.save();g.globalAlpha*=.15;g.fillStyle=dp>=0?'#26a69a':'#ef5350';g.fillRect(a.x,a.y,b.x-a.x||60,b.y-a.y);g.restore();ln(a.x,a.y,x,a.y);ln(a.x,b.y,x,b.y);ln(a.x,a.y,a.x,b.y);g.fillText(fp(dp)+' ('+(dp/a.p*100).toFixed(2)+'%)',a.x+4,Math.min(a.y,b.y)-4);break}
 case'pos':{const sp=a.p-(b.p-a.p),sy=c.s.priceToCoordinate(sp);if(sy==null)break;const x2=Math.max(b.x,a.x+60),rr=Math.abs((b.p-a.p)/(a.p-sp));g.save();g.globalAlpha*=.2;g.fillStyle='#26a69a';g.fillRect(a.x,a.y,x2-a.x,b.y-a.y);g.fillStyle='#ef5350';g.fillRect(a.x,a.y,x2-a.x,sy-a.y);g.restore();ln(a.x,a.y,x2,a.y);ln(a.x,b.y,x2,b.y);ln(a.x,sy,x2,sy);g.fillText((b.p>a.p?'Long':'Short')+' · target '+fp(b.p)+' · stop '+fp(sp)+' · R:R '+rr.toFixed(1),a.x+4,Math.min(a.y,b.y)-4);break}
 case'fx':{const x1=Math.min(a.x,d.x);[0,.618,1,1.272,1.618,2,2.618].forEach((l,i)=>{const pr=d.p+(b.p-a.p)*l,y=c.s.priceToCoordinate(pr);if(y==null)return;g.strokeStyle=g.fillStyle=FC[i%FC.length];ln(x1,y,W,y);g.fillText(l+' ('+fp(pr)+')',x1+4,y-3)});g.setLineDash([4,4]);g.strokeStyle='#888';ln(a.x,a.y,b.x,b.y);ln(b.x,b.y,d.x,d.y);break}
 case'fan':[.25,.382,.5,.618,.75,1].forEach((r,i)=>{const q=rt(a,{x:b.x,y:a.y+(b.y-a.y)*r});g.strokeStyle=FC[i%FC.length];ln(a.x,a.y,q.x,q.y)});break;
 case'ftz':[0,1,2,3,5,8,13,21,34,55].forEach(n=>{const x=a.x+(b.x-a.x)*n;if(x<0||x>W)return;ln(x,0,x,H);g.fillText(n,x+3,12)});break;
 case'abcd':case'xa':{for(let i=1;i<P.length;i++)ln(P[i-1].x,P[i-1].y,P[i].x,P[i].y);const nm=o.k==='xa'?'XABCD':'ABCD';g.font='bold 12px system-ui';P.forEach((q,i)=>g.fillText(nm[i],q.x+4,q.y-6));g.setLineDash([3,3]);if(P.length>2)ln(P[0].x,P[0].y,P[2].x,P[2].y);if(P.length>3)ln(P[1].x,P[1].y,P[3].x,P[3].y);break}
 case'au':case'ad':{const s=o.k==='au'?1:-1;ln(a.x,a.y,a.x,a.y+s*28);ln(a.x,a.y,a.x-7,a.y+s*10);ln(a.x,a.y,a.x+7,a.y+s*10);break}
 case'tl':{const e=o.ex||0,p1=e&2?rt(b,a):a,p2=e&1?rt(a,b):b;ln(p1.x,p1.y,p2.x,p2.y);break}
 case'ray':{const dx=b.x-a.x||1e-6,f=(dx>0?W-a.x:-a.x)/dx;ln(a.x,a.y,a.x+dx*f,a.y+(b.y-a.y)*f);break}
 case'ar':{ln(a.x,a.y,b.x,b.y);const t=Math.atan2(b.y-a.y,b.x-a.x);[2.7,-2.7].forEach(s=>ln(b.x,b.y,b.x+10*Math.cos(t+s),b.y+10*Math.sin(t+s)));break}
 case'hl':ln(0,a.y,W,a.y);g.fillText(fp(a.p),6,a.y-3);break;
 case'vl':ln(a.x,0,a.x,H);break;
 case'rc':g.save();g.globalAlpha*=.18;g.fillRect(a.x,a.y,b.x-a.x,b.y-a.y);g.restore();bx();break;
 case'fib':{const x1=Math.min(a.x,b.x);(o.lv||FL).forEach((l,i)=>{const pr=b.p+(a.p-b.p)*l,y=c.s.priceToCoordinate(pr);if(y==null)return;g.strokeStyle=g.fillStyle=FC[i%FC.length];ln(x1,y,W,y);g.fillText(l+' ('+fp(pr)+')',x1+4,y-3)});g.setLineDash([4,4]);g.strokeStyle='#888';ln(a.x,a.y,b.x,b.y);break}
 case'ch':{const dy=d.y-(a.y+(b.y-a.y)*(d.x-a.x)/(b.x-a.x||1e-6));ln(a.x,a.y,b.x,b.y);ln(a.x,a.y+dy,b.x,b.y+dy);g.setLineDash([3,3]);ln(a.x,a.y+dy/2,b.x,b.y+dy/2);break}
 case'meas':{const dp=b.p-a.p,n=Math.round((b.t-a.t)/stp(c));g.save();g.globalAlpha*=.15;g.fillStyle=dp>=0?'#26a69a':'#ef5350';g.fillRect(a.x,a.y,b.x-a.x,b.y-a.y);g.restore();g.setLineDash([4,3]);bx();g.fillText(dp.toFixed(2)+' ('+(dp/a.p*100).toFixed(2)+'%) · '+n+' bars',Math.min(a.x,b.x)+4,Math.min(a.y,b.y)-4);break}
 case'pf':{const m={x:(b.x+d.x)/2,y:(b.y+d.y)/2},dx=m.x-a.x,dy=m.y-a.y,u=rt(a,m),e1=rt(b,{x:b.x+dx,y:b.y+dy}),e2=rt(d,{x:d.x+dx,y:d.y+dy});ln(a.x,a.y,u.x,u.y);ln(b.x,b.y,e1.x,e1.y);ln(d.x,d.y,e2.x,e2.y);g.setLineDash([3,3]);ln(b.x,b.y,d.x,d.y);break}
 case'gn':[.125,.25,.333,.5,1,2,3,4,8].forEach(r=>{const q=rt(a,{x:b.x,y:a.y+(b.y-a.y)*r});ln(a.x,a.y,q.x,q.y)});break;
 case'el':case'br':{for(let i=1;i<P.length;i++)ln(P[i-1].x,P[i-1].y,P[i].x,P[i].y);if(o.k==='el'){g.font='12px system-ui';P.forEach((q,i)=>g.fillText(String(i),q.x+4,q.y-6))}break}
 case'tx':break}
 const label=o.text||(o.k==='tx'?o.s:'');if(label){g.save();g.setLineDash([]);g.fillStyle=o.textColor||o.col;const size=+(o.fontSize||8),align=o.textAlign||'center',valign=o.textVAlign||'middle';g.font=`${o.bold?'bold ':''}${o.italic?'italic ':''}${size}px system-ui`;g.textAlign=align;
 const xs=P.map(q=>q.x),ys=P.map(q=>q.y),left=Math.min(...xs),right=Math.max(...xs),top=Math.min(...ys),bottom=Math.max(...ys),x=align==='left'?left:align==='right'?right:(left+right)/2,y=valign==='top'?top-3:valign==='bottom'?bottom+3:(top+bottom)/2;
 g.textBaseline=valign==='top'?'bottom':valign==='bottom'?'top':'middle';const width=g.measureText(label).width;if(REC)REC.push([align==='right'?x-width:align==='center'?x-width/2:x,y-size/2,align==='right'?x:align==='center'?x+width/2:x+width,y+size/2]);g.fillText(label,x,y);g.restore()}}

function frame(){requestAnimationFrame(frame);charts.forEach(c=>{try{frameOne(c)}catch(e){if(!frame.e){frame.e=1;console.error('overlay draw error',e)}}})}
function frameOne(c){if(c.ov&&!c.ov.isConnected)c.ov=null;if(!c.ov&&c.host.querySelector('.cv'))attach(c);const k=c.ov;if(!k)return;const w=k.clientWidth,h=k.clientHeight,r=devicePixelRatio||1;
 if(k.width!==Math.round(w*r)||k.height!==Math.round(h*r)){k.width=Math.round(w*r);k.height=Math.round(h*r)}
 const g=k.getContext('2d');g.setTransform(r,0,0,r,0,0);g.clearRect(0,0,w,h);let pw=50;try{pw=c.c.priceScale('right').width()}catch(e){}
 const W=w-pw,H=h-26;g.save();g.beginPath();g.rect(0,0,W,H);g.clip();
 if(c.style==='footprint')fpDraw(g,c,W,H);
 pdraw(g,c,W);
 (S.draw[c.cfg.sym]||[]).forEach(o=>{if(o.hd&&!S.showHid)return;g.save();if(o.hd)g.globalAlpha=.3;try{dr(g,c,o,W,H)}catch(e){}g.restore()});
 if(sel&&(S.draw[c.cfg.sym]||[]).includes(sel))(sel.k==='br'?[]:sel.p).forEach(q=>{const x=t2x(c,q.t),y=c.s.priceToCoordinate(q.p);if(x==null||y==null)return;g.setLineDash([]);g.beginPath();g.arc(x,y,5,0,7);g.fillStyle='#131722';g.fill();g.strokeStyle='#e6b422';g.lineWidth=2;g.stroke()});
 if(dtool!=='cur'&&mouse&&mouse.c===c){const m=pt2d(c,mouse.x,mouse.y);if(m){const p=dtmp.c===c?dtmp.slice():[];if(!p.length)p.push(m);while(p.length<NEED[dtool])p.push(m);g.globalAlpha=.7;try{dr(g,c,{k:dtool,p,col:S.set.dc,w:+S.set.dw},W,H)}catch(e){}}}
 g.restore()}

function attach(c){if(c.ov)return;const cv=c.host.querySelector('.cv');cv.style.position='relative';extras(c,cv);
 const k=c.ov=D.createElement('canvas');k.style.cssText='position:absolute;left:0;top:0;width:100%;height:100%;z-index:5;pointer-events:none;cursor:crosshair';cv.appendChild(k);apply(c);
 const pt=e=>{const r=k.getBoundingClientRect();return{x:e.clientX-r.left,y:e.clientY-r.top}};
 k.onmousemove=e=>{const q=pt(e);mouse={c,...q};const price=c.s.coordinateToPrice(q.y),time=c.c.timeScale().coordinateToTime(q.x);if(price!=null&&time!=null)c.c.setCrosshairPosition(price,time,c.s);else c.c.clearCrosshairPosition()};
 k.onmouseleave=()=>{if(mouse&&mouse.c===c)mouse=null;c.c.clearCrosshairPosition()};
 k.oncontextmenu=e=>{if(dtmp.length){e.preventDefault();e.stopPropagation();dtmp=[]}};
 k.onmousedown=e=>{if(dtool!=='br'||e.button)return;const o={id:Date.now()+'b',k:'br',p:[],col:S.set.dc,w:+S.set.dw},L=S.draw[c.cfg.sym]=S.draw[c.cfg.sym]||[];hist();L.push(o);
  const mv=ev=>{const r=k.getBoundingClientRect(),d=pt2d(c,ev.clientX-r.left,ev.clientY-r.top);if(d)o.p.push(d)},up=()=>{D.removeEventListener('mousemove',mv);D.removeEventListener('mouseup',up);if(o.p.length<2)L.splice(L.indexOf(o),1);else{save();setTool('cur');sel=o;showEB()}};D.addEventListener('mousemove',mv);D.addEventListener('mouseup',up)};
 cv.addEventListener('mousedown',e=>{if(dtool!=='cur'||e.button)return;const q=pt(e),h=pick(c,q.x,q.y);if(!h){if(sel){sel=null;showEB()}return}
  e.stopPropagation();e.preventDefault();setAct(c);sel=h.o;if(!sel.lk)hist(),drag={c,o:h.o,i:h.i,x:q.x,y:q.y,orig:JSON.parse(JSON.stringify(h.o.p))};showEB()},true);
 k.onclick=e=>{if(!NEED[dtool])return;setAct(c);const q=pt(e),d=pt2d(c,q.x,q.y);if(!d)return;if(dtmp.c!==c){dtmp=[];dtmp.c=c}dtmp.push(d);
  if(dtmp.length<NEED[dtool])return;const o={id:Date.now()+''+Math.random(),k:dtool,p:dtmp,col:S.set.dc,w:+S.set.dw};dtmp=[];
  if(dtool==='tx'){o.s=prompt('Text');if(!o.s)return}
  hist();(S.draw[c.cfg.sym]=S.draw[c.cfg.sym]||[]).push(o);save();setTool('cur');sel=o;showEB()}}

function setTool(k){dtool=k;dtmp=[];D.querySelectorAll('#tools button[data-t]').forEach(b=>b.classList.toggle('on',b.dataset.t===k));
 charts.forEach(c=>{if(c.ov)c.ov.style.pointerEvents=k==='cur'?'none':'auto'})}

/* ---------- toolbar ---------- */
const TL=[['cur','Cursor'],['tl','Trend'],['ray','Ray'],['ar','Arrow'],['hl','H-Line'],['vl','V-Line'],['rc','Box'],['fib','Fib'],['ch','Channel'],['meas','Measure'],['tx','Text'],['pf','Fork'],['gn','Gann'],['el','Elliott'],['br','Brush']];
$('#tools').innerHTML=TL.map(([k,n])=>`<button data-t="${k}" class="${k==='cur'?'on':''}">${n}</button>`).join(' ')+
 ` <select id=dmore title="More drawing tools"><option value="">More…</option><option value=ext>Extended line</option><option value=hr>Horizontal ray</option><option value=cl>Cross line</option><option value=cir>Circle</option><option value=ell>Ellipse</option><option value=tri>Triangle</option><option value=pr>Price range</option><option value=pos>Long/Short position</option><option value=fx>Fib extension</option><option value=fan>Fib speed fan</option><option value=ftz>Fib time zones</option><option value=abcd>ABCD pattern</option><option value=xa>XABCD pattern</option><option value=au>Arrow up</option><option value=ad>Arrow down</option></select> <input type=color id=dc value="${S.set.dc}" title="Drawing color" style="width:28px;padding:0"><input id=dcHex value="${S.set.dc}" aria-label="Drawing color hex code" title="Drawing color hex code" maxlength=7 size=7> <select id=magnet title="Magnet snapping"><option value=0>Magnet: Off</option><option value=1>Weak magnet</option><option value=2>Strong magnet</option></select> <button data-t=view title="Fit candles and reset the price scale">↗ View</button><button data-t=undo title="Undo (Ctrl+Z)">↶</button><button data-t=redo title="Redo (Ctrl+Y)">↷</button><button data-t=eye title="Show hidden drawings">👁</button><button data-t=pal title="Price alert">🔔</button><button data-t=scr>ƒ Scripts</button><button data-t=clr title="Clear drawings on this symbol">Clear</button><button data-t=set>⚙ Settings</button>`;
$('#tools').onclick=e=>{const k=e.target.dataset.t;if(!k)return;
 if(k==='view')resetView(act);else if(k==='undo')undo();else if(k==='redo')redo();else if(k==='eye'){S.showHid=!S.showHid;save()}else if(k==='scr')openScr();else if(k==='pal')priceAlert();
 else if(k==='clr'){hist();delete S.draw[act.cfg.sym];save()}
 else if(k==='set')dlg.style.display='flex';
 else setTool(k)};
$('#tools').onchange=e=>{if(e.target.id==='dmore'&&e.target.value){setTool(e.target.value);e.target.value=''}};
$('#dc').oninput=e=>{S.set.dc=e.target.value;$('#dcHex').value=e.target.value;save()};
$('#dcHex').oninput=e=>{if(/^#[0-9a-f]{6}$/i.test(e.target.value)){S.set.dc=e.target.value;$('#dc').value=e.target.value;save()}};
$('#dcHex').onchange=e=>{if(!/^#[0-9a-f]{6}$/i.test(e.target.value))e.target.value=S.set.dc};
$('#magnet').value=String(S.set.mag);$('#magnet').onchange=e=>{S.set.mag=+e.target.value;save()};
D.addEventListener('keydown',e=>{if(e.target.tagName==='INPUT'||e.target.tagName==='SELECT')return;
 if(e.key==='Escape')setTool('cur');else if(e.ctrlKey&&e.key.toLowerCase()==='z')(e.shiftKey?redo():undo());else if(e.ctrlKey&&e.key.toLowerCase()==='y')redo()});

/* ---------- settings dialog ---------- */
const F={
 'Symbol':[['up','Up body','color'],['dn','Down body','color'],['borderUp','Up border','color'],['borderDn','Down border','color'],['wickUp','Up wick','color'],['wickDn','Down wick','color'],['bord','Show candle borders','chk']],
 'Status line':[['showOhlc','OHLC values','chk'],['showLast','Last price','chk'],['showCountdown','Candle countdown','chk']],
 'Scales and lines':[['mode','Price scale','sel',[['Normal',0],['Log',1],['Percent',2],['Indexed 100',3]]],['scaleLabels','Price scale labels','chk'],['invert','Invert price scale','chk'],['lp','Last price line','chk'],['off','Right margin (bars)','num']],
 'Canvas':[['bg','Background','color'],['grid','Grid lines','chk'],['gridColor','Grid color','color'],['cross','Crosshair','sel',[['Normal',0],['Magnet',1]]],['crossColor','Crosshair color','color'],['wm','Symbol watermark','chk'],['mag','Magnet snapping','sel',[['Off',0],['Weak magnet',1],['Strong magnet',2]]],['dc','Drawing color','color'],['dw','Drawing width','sel',[['1px',1],['2px',2],['3px',3]]]],
 'Trading':[['info','Order entry is not connected. This app can display MT5 prices and candles but cannot place trades.','info']],
 'Alerts':[['alertSound','Play alert sound','chk'],['alertNotify','Desktop notifications','chk'],['activeAlerts','Show active alerts only','chk'],['alertHide','Auto-hide alert messages','chk']],
 'Events':[['news','Show News tab','chk'],['info','Economic calendar and chart event overlays are not connected. The News tab uses RSS headlines.','info']]
};
const dlg=D.createElement('div');dlg.style.cssText='position:fixed;inset:0;background:#0009;z-index:99;display:none;align-items:center;justify-content:center';
dlg.innerHTML='<div style="background:#131722;border:1px solid #232836;border-radius:6px;width:680px;max-width:96vw;max-height:90vh;display:flex;flex-direction:column;overflow:hidden"><div style="padding:14px 16px;border-bottom:1px solid #232836"><b style="color:#e6b422">Chart settings</b></div><div style="display:flex;min-height:0;overflow:auto"><nav id=sn style="width:175px;flex:none;padding:8px;border-right:1px solid #232836"></nav><div style="flex:1;min-width:0;padding:14px 18px"><b id=stitle></b><div id=sf style="display:grid;grid-template-columns:minmax(0,1fr) auto;gap:12px 18px;margin:16px 0;align-items:center"></div></div></div><div style="padding:10px 14px;border-top:1px solid #232836"><button data-x=r>Reset</button> <button data-x=c class=on style="float:right">Close</button></div></div>';
D.body.appendChild(dlg);
let activeGroup='Symbol';
function colorControl(k){return `<span style="display:flex;align-items:center;gap:6px"><input type=color data-k=${k} value="${S.set[k]}" title="Choose color"><input type=text data-hex=${k} value="${S.set[k]}" aria-label="${k} hex color" title="Hex color code" maxlength=7 size=8></span>`}
function fill(group=activeGroup){activeGroup=group;$('#sn').innerHTML=Object.keys(F).map(k=>`<button data-g="${k}" class="${k===group?'on':''}" style="display:block;width:100%;text-align:left;margin:2px 0">${k}</button>`).join('');$('#stitle').textContent=group;
 $('#sf').innerHTML=F[group].map(([k,n,t,o])=>t==='info'?`<p style="grid-column:1/-1;color:#9aa0b0;line-height:1.6;margin:0">${n}</p>`:`<span>${n}</span>`+(t==='sel'?`<select data-k=${k}>${o.map(([a,v])=>`<option value=${v} ${+S.set[k]===v?'selected':''}>${a}</option>`).join('')}</select>`:t==='chk'?`<input type=checkbox data-k=${k} ${+S.set[k]?'checked':''}>`:t==='num'?`<input type=number min=0 max=100 data-k=${k} value=${S.set[k]} style="width:72px">`:colorControl(k))).join('')}
fill();
function updateSetting(k,t){S.set[k]=t.type==='checkbox'?+t.checked:t.type==='color'?t.value:+t.value;const hex=dlg.querySelector(`[data-hex="${k}"]`);if(hex)hex.value=S.set[k];if(k==='dc'){$('#dc').value=S.set.dc;$('#dcHex').value=S.set.dc}if(k==='mag')$('#magnet').value=String(S.set.mag);save();charts.forEach(apply);if(k==='activeAlerts')alRender();if(k==='news'){const on=!!S.set.news;$('#tn').hidden=!on;if(!on&&!$('#news').hidden)$('#tw').click()}}
dlg.oninput=e=>{const k=e.target.dataset.k;if(k&&e.target.type==='color')updateSetting(k,e.target);const hex=e.target.dataset.hex;if(hex&&/^#[0-9a-f]{6}$/i.test(e.target.value)){S.set[hex]=e.target.value;const color=dlg.querySelector(`[data-k="${hex}"]`);if(color)color.value=e.target.value;save();charts.forEach(apply)}};
dlg.onchange=e=>{const t=e.target,k=t.dataset.k,hex=t.dataset.hex;if(k){updateSetting(k,t);return}if(hex){if(!/^#[0-9a-f]{6}$/i.test(t.value))t.value=S.set[hex];return}};
dlg.onclick=e=>{const x=e.target.dataset.x,g=e.target.dataset.g;if(g)fill(g);else if(e.target===dlg||x==='c')dlg.style.display='none';else if(x==='r'){S.set=Object.assign({},DEF);save();fill(activeGroup);$('#dc').value=DEF.dc;$('#dcHex').value=DEF.dc;$('#magnet').value=String(DEF.mag);charts.forEach(apply);alRender();$('#tn').hidden=false}};

/* ---------- all cryptos (Binance spot) ---------- */
const tc=D.createElement('button');tc.id='tc';tc.textContent='Crypto';$('#side .sh').appendChild(tc);
const cr=D.createElement('div');cr.id='cr';cr.hidden=true;cr.style.cssText='flex:1;overflow:auto;padding:0 6px 6px';
cr.innerHTML='<div class=sh style="padding:0 0 6px"><input id=cq placeholder="Search crypto symbols…" style="flex:1"><select id=cs title="Quote currency"><option>USDT</option><option>USDC</option><option>FDUSD</option><option>BTC</option><option>ETH</option><option>BNB</option></select></div><div class=sh style="padding:0 0 6px"><select id=cx style="flex:1" title="Exchange"><option value=all>All exchanges</option><option value=BN>Binance</option><option value=MEXC>MEXC</option><option value=BYBIT>Bybit</option><option value=OKX>OKX</option><option value=GATE>Gate.io</option><option value=KUCOIN>KuCoin</option></select></div><div class=sh style="padding:0 0 6px"><select id=co style="flex:1"><option value=v>Top volume</option><option value=g>Top gainers</option><option value=l>Top losers</option><option value=n>A–Z</option></select><select id=cf title="Filter mode"><option value=all>All pairs</option><option value=added>In watchlist</option><option value=new>Not in watchlist</option></select></div><div class=sh style="padding:0 0 6px"><button id=ca style="flex:1" title="Add every pair matching the current search and filters to the selected watchlist">Add filtered to watchlist</button><span id=cn class=lb style="align-self:center"></span></div><div id=cl></div><datalist id=dl></datalist>';
$('#side').appendChild(cr);
const TB={tw:'#wl',tn:'#news',tc:'#cr'};
Object.keys(TB).forEach(id=>$('#'+id).addEventListener('click',()=>Object.entries(TB).forEach(([i,s])=>{$(s).hidden=i!==id;$('#'+i).classList.toggle('on',i===id)})));
const VENUES={BN:'Binance',MEXC:'MEXC',BYBIT:'Bybit',OKX:'OKX',GATE:'Gate.io',KUCOIN:'KuCoin'},marketKey=x=>x.s.includes(':')?x.s:'BN:'+x.s;
async function venueJson(src,kind,url){return jget(url)}
function filteredCryptos(){const q=$('#cq').value.trim().toUpperCase(),Q=$('#cs').value,o=$('#co').value,mode=$('#cf').value,exchange=$('#cx').value,added=new Set(cur().map(marketKey));
 return ALL.filter(x=>x.s.endsWith(Q)&&x.s.length>Q.length&&(exchange==='all'||x.src===exchange)&&(x.s.includes(q)||VENUES[x.src].toUpperCase().includes(q))&&(mode==='all'||(mode==='added'?added.has(x.src+':'+x.s):!added.has(x.src+':'+x.s)))).sort(o==='n'?(a,b)=>a.s.localeCompare(b.s):o==='g'?(a,b)=>b.ch-a.ch:o==='l'?(a,b)=>a.ch-b.ch:(a,b)=>b.v-a.v)}
function rc(){const Q=$('#cs').value,L=filteredCryptos();
 $('#cn').textContent=L.length+' pairs';
 $('#cl').innerHTML=L.map(x=>`<div class=it data-s="${x.src}:${x.s}"><span>${x.s.slice(0,-Q.length)}<div class=lb>${VENUES[x.src]} · ${Q} · vol ${fk(x.v)}</div></span><span class=pr>${x.p}<small class="${x.ch>=0?'up':'dn'}">${x.ch>=0?'+':''}${x.ch.toFixed(2)}%</small></span><span data-a=add title="Add to watchlist" style="color:#e6b422">＋</span></div>`).join('')}
function syncWatchlistQuotes(){const index=new Map(ALL.map(x=>[x.src+':'+x.s,x]));cur().forEach(item=>{const key=marketKey(item),x=index.get(key),el=D.getElementById('p_'+item.s);if(!x||!el)return;el.innerHTML=`${x.p}<small class=${x.ch>=0?'up':'dn'}>${x.ch>=0?'+':''}${x.ch.toFixed(2)}%</small>`})}
async function venueMarkets(src){let url,j;if(src==='BN'){url='https://api.binance.com/api/v3/ticker/24hr';j=await jget(url);if(!Array.isArray(j))throw Error('Binance unavailable');return j.map(x=>({src,s:x.symbol,p:+x.lastPrice,ch:+x.priceChangePercent,v:+x.quoteVolume}))}
 if(src==='MEXC'){url='https://api.mexc.com/api/v3/ticker/24hr';j=await venueJson(src,'markets',url);if(!Array.isArray(j))throw Error('MEXC unavailable');return j.map(x=>({src,s:x.symbol,p:+x.lastPrice,ch:+x.priceChangePercent*100,v:+x.quoteVolume}))}
 if(src==='BYBIT'){j=await jget('https://api.bybit.com/v5/market/tickers?category=spot');if(j.retCode!==0)throw Error('Bybit unavailable');return j.result.list.map(x=>({src,s:x.symbol,p:+x.lastPrice,ch:+x.price24hPcnt*100,v:+x.turnover24h}))}
 if(src==='OKX'){j=await jget('https://www.okx.com/api/v5/market/tickers?instType=SPOT');if(j.code!=='0')throw Error('OKX unavailable');return j.data.filter(x=>x.instId.endsWith('-USDT')).map(x=>({src,s:x.instId.replace('-',''),p:+x.last,ch:+x.open24h?((+x.last/+x.open24h)-1)*100:0,v:+x.volCcy24h||+x.vol24h*+x.last}))}
 if(src==='GATE'){j=await jget('https://api.gateio.ws/api/v4/spot/tickers');if(!Array.isArray(j))throw Error('Gate.io unavailable');return j.filter(x=>x.currency_pair.endsWith('_USDT')).map(x=>({src,s:x.currency_pair.replace('_',''),p:+x.last,ch:+x.change_percentage,v:+x.quote_volume}))}
 if(src==='KUCOIN'){url='https://api.kucoin.com/api/v1/market/allTickers';j=await venueJson(src,'markets',url);if(j.code!=='200000')throw Error('KuCoin unavailable');return j.data.ticker.filter(x=>x.symbol.endsWith('-USDT')).map(x=>({src,s:x.symbol.replace('-',''),p:+x.last,ch:+x.changeRate*100,v:+x.volValue}))}}
const SOURCES=Object.keys(VENUES);let failed=[];
async function loadC(){const results=await Promise.allSettled(SOURCES.map(venueMarkets));ALL=[];failed=[];results.forEach((r,i)=>r.status==='fulfilled'?ALL.push(...r.value):failed.push(VENUES[SOURCES[i]]));
 $('#dl').innerHTML=ALL.map(x=>`<option value="${x.src}:${x.s}">`).join('');rc();syncWatchlistQuotes();if(failed.length)$('#cn').textContent=filteredCryptos().length+' pairs · unavailable: '+failed.join(', ')}
['cq','cs','cx','co','cf'].forEach(i=>$('#'+i).oninput=rc);
$('#ca').onclick=()=>{const matches=filteredCryptos(),list=cur(),have=new Set(list.map(marketKey));let added=0;matches.forEach(x=>{const s=x.src+':'+x.s;if(!have.has(s)){list.push({s,l:'',c:0});have.add(s);added++}});if(added){save();wlDraw()}rc();$('#cn').textContent='Added '+added+' of '+matches.length+' pairs'};
$('#cl').onclick=e=>{const it=e.target.closest('.it');if(!it)return;const s=it.dataset.s;
 if(e.target.dataset.a==='add'){if(!cur().some(x=>marketKey(x)===s)){cur().push({s,l:'',c:0});save();wlDraw();rc()}}else act.setSym(s)};
$('#wla').setAttribute('list','dl');
const w0=wlDraw;wlDraw=function(){w0();try{syncWatchlistQuotes()}catch(e){}};
loadC();setInterval(loadC,60000);

/* ---------- select / move / edit / delete ---------- */
const dseg=(x,y,[x1,y1,x2,y2])=>{const dx=x2-x1,dy=y2-y1,l=dx*dx+dy*dy;let t=l?((x-x1)*dx+(y-y1)*dy)/l:0;t=Math.max(0,Math.min(1,t));return Math.hypot(x-x1-t*dx,y-y1-t*dy)};
function pick(c,x,y){let pw=50;try{pw=c.c.priceScale('right').width()}catch(e){}const W=c.ov.clientWidth-pw,H=c.ov.clientHeight-26,L=S.draw[c.cfg.sym]||[];
 if(sel&&L.includes(sel)){const i=(sel.k==='br'?[]:sel.p).findIndex(q=>{const px=t2x(c,q.t),py=c.s.priceToCoordinate(q.p);return px!=null&&py!=null&&Math.hypot(px-x,py-y)<=8});if(i>=0)return{o:sel,i}}
 for(let j=L.length-1;j>=0;j--){if(L[j].hd&&!S.showHid)continue;REC=[];dr(HG,c,L[j],W,H);const r=REC;REC=null;if(r.some(s=>dseg(x,y,s)<=7))return{o:L[j],i:-1}}return null}
D.addEventListener('mousemove',e=>{if(!drag)return;const c=drag.c,r=c.ov.getBoundingClientRect(),x=e.clientX-r.left,y=e.clientY-r.top,o=drag.o;
 if(drag.i>=0){const d=pt2d(c,x,y);if(d)o.p[drag.i]=d}
 else{const dx=x-drag.x,dy=y-drag.y;o.p=drag.orig.map(q=>{const px=t2x(c,q.t),py=c.s.priceToCoordinate(q.p);if(px==null||py==null)return q;const t=x2t(c,px+dx),p=c.s.coordinateToPrice(py+dy);return t==null||p==null?q:{t,p}})}},true);
D.addEventListener('mouseup',()=>{if(drag){drag=null;save()}});
const eb=D.createElement('div');eb.style.cssText='position:fixed;top:78px;left:50%;transform:translateX(-50%);z-index:60;display:none;gap:6px;align-items:center;background:#131722;border:1px solid #e6b422;border-radius:6px;padding:5px 8px';
eb.innerHTML='<span class=lb>Drawing</span><input type=color data-e=col title=Color><select data-e=w title=Width><option>1</option><option>2</option><option>3</option><option>4</option></select><select data-e=ls title=Style><option value=0>Solid</option><option value=1>Dashed</option><option value=2>Dotted</option></select><select data-e=ex title=Extend><option value=0>No extend</option><option value=1>→ Right</option><option value=2>← Left</option><option value=3>↔ Both</option></select><button data-e=lv>Levels</button><button data-e=lk>🔓</button><button data-e=hd>Hide</button><button data-e=set title="Drawing settings">⚙</button><button data-e=al>🔔 Alert</button><button data-e=tx>Edit text</button><button data-e=cp>Copy</button><button data-e=del>🗑 Delete</button>';
D.body.appendChild(eb);
function showEB(){eb.style.display=sel?'flex':'none';if(!sel)return;const q=k=>eb.querySelector('[data-e='+k+']');q('col').value=sel.col;q('w').value=sel.w;q('ls').value=sel.ls||0;q('tx').style.display=sel.k==='tx'?'':'none';q('ex').style.display=sel.k==='tl'?'':'none';q('ex').value=sel.ex||0;q('lv').style.display=sel.k==='fib'?'':'none';q('lk').textContent=sel.lk?'🔒':'🔓';q('hd').textContent=sel.hd?'Show':'Hide'}
const dset=D.createElement('div');dset.style.cssText='position:fixed;inset:0;background:#0009;z-index:110;display:none;align-items:center;justify-content:center;font:12px/1.4 system-ui;color:#c9ccd6';
dset.innerHTML='<section style="width:440px;max-width:95vw;background:#1e1e1e;border:1px solid #383838;border-radius:6px;box-shadow:0 8px 32px #0009"><header style="display:flex;align-items:center;padding:14px 16px;border-bottom:1px solid #383838"><b data-dtitle style="flex:1;font-size:15px">Drawing settings</b><button data-dclose title="Close">✕</button></header><nav data-dtabs style="display:flex;gap:16px;padding:0 16px;border-bottom:1px solid #383838"></nav><div data-dbody style="padding:16px;min-height:200px;max-height:60vh;overflow:auto"></div><footer style="display:flex;justify-content:flex-end;gap:8px;padding:12px 16px;border-top:1px solid #383838"><button data-dcancel>Cancel</button><button data-dsave class=on>Ok</button></footer></section>';
D.body.appendChild(dset);
let dsetBefore=null,dsetAllBefore=null,dsetTab='Style';
const DRAW_NAMES={tl:'Trendline',ray:'Ray',ar:'Arrow',hl:'Horizontal line',vl:'Vertical line',rc:'Rectangle',fib:'Fibonacci retracement',ch:'Channel',meas:'Measure',tx:'Text',pf:'Pitchfork',gn:'Gann fan',el:'Elliott wave',br:'Brush',ext:'Extended line',hr:'Horizontal ray',cl:'Cross line',cir:'Circle',ell:'Ellipse',tri:'Triangle',pr:'Price range',pos:'Long/Short position',fx:'Fibonacci extension',fan:'Fibonacci speed fan',ftz:'Fibonacci time zones',abcd:'ABCD pattern',xa:'XABCD pattern',au:'Arrow up',ad:'Arrow down'};
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const localTime=t=>{const d=new Date(t*1000);return new Date(d.getTime()-d.getTimezoneOffset()*60000).toISOString().slice(0,16)};
function drawTabBody(){
 const body=dset.querySelector('[data-dbody]');
 if(dsetTab==='Style')body.innerHTML=`<div style="display:grid;grid-template-columns:1fr auto;gap:14px;align-items:center"><label>Color</label><span><input type=color data-d="col" value="${esc(sel.col||'#e6b422')}"><input type=text data-dhex="col" value="${esc(sel.col||'#e6b422')}" maxlength=7 size=8 aria-label="Drawing color hex"></span><label>Line width</label><select data-d="w">${[1,2,3,4].map(x=>`<option value="${x}" ${+(sel.w||1)===x?'selected':''}>${x}px</option>`).join('')}</select><label>Line style</label><select data-d="ls">${[['Solid',0],['Dashed',1],['Dotted',2]].map(([n,v])=>`<option value="${v}" ${+(sel.ls||0)===v?'selected':''}>${n}</option>`).join('')}</select>${['tl','ext','hr'].includes(sel.k)?`<label>Extend</label><select data-d="ex">${[['No extend',0],['Right',1],['Left',2],['Both',3]].map(([n,v])=>`<option value="${v}" ${+(sel.ex||0)===v?'selected':''}>${n}</option>`).join('')}</select>`:''}</div>`;
 else if(dsetTab==='Text')body.innerHTML=`<div style="display:flex;align-items:center;gap:8px;margin-bottom:12px"><span><input type=color data-d="textColor" value="${esc(sel.textColor||sel.col||'#e6b422')}" title="Text color"><input type=text data-dhex="textColor" value="${esc(sel.textColor||sel.col||'#e6b422')}" maxlength=7 size=8 aria-label="Text color hex"></span><select data-d="fontSize" aria-label="Text size">${[8,10,12,14,16,18,20,24,28,32,36,48].map(n=>`<option value="${n}" ${+(sel.fontSize||8)===n?'selected':''}>${n}</option>`).join('')}</select><button type=button data-toggle="bold" class="${sel.bold?'on':''}" aria-pressed="${!!sel.bold}" title="Bold"><b>B</b></button><button type=button data-toggle="italic" class="${sel.italic?'on':''}" aria-pressed="${!!sel.italic}" title="Italic"><i>I</i></button></div><textarea data-d="text" rows="4" placeholder="Add text" style="width:100%;resize:vertical">${esc(sel.text||(sel.k==='tx'?sel.s:'')||'')}</textarea><div style="display:grid;grid-template-columns:auto 1fr 1fr;gap:10px;align-items:center;margin-top:14px"><label>Text alignment</label><select data-d="textVAlign" aria-label="Vertical text alignment">${[['Top','top'],['Middle','middle'],['Bottom','bottom']].map(([n,v])=>`<option value="${v}" ${(sel.textVAlign||'middle')===v?'selected':''}>${n}</option>`).join('')}</select><select data-d="textAlign" aria-label="Horizontal text alignment">${[['Left','left'],['Center','center'],['Right','right']].map(([n,v])=>`<option value="${v}" ${(sel.textAlign||'center')===v?'selected':''}>${n}</option>`).join('')}</select></div>`;
 else if(dsetTab==='Coordinates'){const indices=sel.k==='br'&&sel.p.length>2?[0,sel.p.length-1]:sel.p.map((_,i)=>i);body.innerHTML=(sel.k==='br'&&sel.p.length>2?'<p style="color:#9aa0b0">Brush coordinates show its start and end points.</p>':'')+indices.map((i,n)=>{const p=sel.p[i],name=sel.k==='br'&&sel.p.length>2?(n?'End':'Start'):`${String.fromCharCode(65+n)} · Point ${n+1}`;return `<fieldset style="border:1px solid #444;margin:0 0 10px;padding:10px"><legend>${name}</legend><label style="display:block;margin-bottom:4px">Date and time</label><input type=datetime-local data-point="${i}" data-field="t" value="${localTime(p.t)}" style="width:100%;margin-bottom:8px"><label style="display:block;margin-bottom:4px">Price</label><input type=number step=any data-point="${i}" data-field="p" value="${esc(p.p)}" style="width:100%"></fieldset>`}).join('')}
 else body.innerHTML=`<div style="display:grid;gap:14px"><label><input type=checkbox data-d="hd" ${sel.hd?'checked':''}> Hide drawing (hidden drawings can be toggled with the eye tool)</label><label><input type=checkbox data-d="lk" ${sel.lk?'checked':''}> Lock drawing from moving</label><p style="color:#9aa0b0;margin:0">Drawings are shown on charts using this symbol.</p></div>`;
}
function drawSettings(tab='Style'){
 if(!sel)return;if(dset.style!=='flex'||!dsetBefore){dsetBefore=JSON.stringify(sel);dsetAllBefore=JSON.stringify(S.draw)}dsetTab=tab;
 const tabs=['Style','Text','Coordinates','Visibility'];dset.querySelector('[data-dtitle]').textContent=(DRAW_NAMES[sel.k]||'Drawing')+' settings';
 dset.querySelector('[data-dtabs]').innerHTML=tabs.map(t=>`<button data-dtab="${t}" style="background:transparent;border:0;border-bottom:2px solid ${t===dsetTab?'#e6b422':'transparent'};border-radius:0;padding:10px 0;color:${t===dsetTab?'#fff':'#9aa0b0'}">${t}</button>`).join('');
 drawTabBody();
 let footer=dset.querySelector('[data-dtemplates]');if(!footer){footer=D.createElement('div');footer.dataset.dtemplates='';footer.style.cssText='padding:10px 16px;border-top:1px solid #383838';footer.innerHTML='<select data-template aria-label="Drawing template" style="min-width:130px"><option value="">Template</option><option value="__save">Save current as…</option></select>';dset.querySelector('footer').before(footer)}
 const select=footer.querySelector('[data-template]'),templates=S.drawTemplates||{};select.innerHTML='<option value="">Template</option><option value="__save">Save current as…</option>'+Object.keys(templates).map(n=>`<option value="${esc(n)}">${esc(n)}</option>`).join('');
 select.onchange=()=>{const name=select.value;if(!name)return;if(name==='__save'){const title=prompt('Drawing template name');if(title){S.drawTemplates=S.drawTemplates||{};S.drawTemplates[title]={...sel,p:undefined,id:undefined};delete S.drawTemplates[title].p;delete S.drawTemplates[title].id;save();drawSettings(dsetTab)}else select.value='';return}const tpl=templates[name];if(tpl){const points=sel.p;Object.assign(sel,JSON.parse(JSON.stringify(tpl)),{p:points});drawTabBody()}};
 dset.style.display='flex';
}
function closeDrawingSettings(saveChanges){
 if(!dsetBefore||!sel){dset.style.display='none';return}
 if(saveChanges){hist();U[U.length-1]=dsetAllBefore;save()}
 else{const old=JSON.parse(dsetBefore);Object.keys(sel).forEach(k=>delete sel[k]);Object.assign(sel,old)}
 dsetBefore=null;dsetAllBefore=null;dset.style.display='none';showEB()
}
function setDrawingValue(el){
 const k=el.dataset.d;if(!k)return;
 if(k==='col'||k==='textColor'){sel[k]=el.value;const hex=dset.querySelector(`[data-dhex="${k}"]`);if(hex)hex.value=el.value}
 else if(k==='w'||k==='ls'||k==='ex'||k==='fontSize')sel[k]=+el.value;
 else if(k==='bold'||k==='italic'||k==='hd'||k==='lk')sel[k]=+el.checked;
 else if(k==='text'){sel.text=el.value;if(sel.k==='tx')sel.s=el.value}
 else if(k==='textAlign'||k==='textVAlign')sel[k]=el.value
}
dset.oninput=e=>{
 if(e.target.dataset.point!=null){const i=+e.target.dataset.point,k=e.target.dataset.field,v=e.target.value,n=k==='t'?Date.parse(v)/1000:+v;if(!Number.isFinite(n)||!sel.p[i])return;sel.p[i][k]=n;return}
 const hex=e.target.dataset.dhex;if(hex){if(/^#[0-9a-f]{6}$/i.test(e.target.value)){sel[hex]=e.target.value;const color=dset.querySelector(`[data-d="${hex}"]`);if(color)color.value=e.target.value}return}
 if(e.target.dataset.d)setDrawingValue(e.target)
};
dset.onchange=e=>{
 if(e.target.dataset.point!=null){const i=+e.target.dataset.point,k=e.target.dataset.field,v=e.target.value,n=k==='t'?Date.parse(v)/1000:+v;if(Number.isFinite(n)&&sel.p[i])sel.p[i][k]=n;return}
 const hex=e.target.dataset.dhex;if(hex){if(!/^#[0-9a-f]{6}$/i.test(e.target.value))e.target.value=sel[hex]||sel.col;return}
 if(e.target.dataset.d)setDrawingValue(e.target)
};
dset.onclick=e=>{
 const tab=e.target.dataset.dtab;if(tab){dsetTab=tab;dset.querySelectorAll('[data-dtab]').forEach(b=>{b.style.borderBottomColor=b===e.target?'#e6b422':'transparent';b.style.color=b===e.target?'#fff':'#9aa0b0'});drawTabBody();return}
 const toggle=e.target.dataset.toggle;if(toggle){sel[toggle]=sel[toggle]?0:1;drawTabBody();return}
 if(e.target===dset||e.target.hasAttribute('data-dcancel')||e.target.hasAttribute('data-dclose'))closeDrawingSettings(false);
 else if(e.target.hasAttribute('data-dsave'))closeDrawingSettings(true)
};
function delSel(){if(!sel)return;hist();for(const k in S.draw){const i=S.draw[k].indexOf(sel);if(i>=0)S.draw[k].splice(i,1)}sel=null;save();showEB()}
eb.oninput=eb.onchange=e=>{const k=e.target.dataset.e;if(!sel||!k)return;if(k==='col')sel.col=e.target.value;else if(k==='w')sel.w=+e.target.value;else if(k==='ls')sel.ls=+e.target.value;else if(k==='ex')sel.ex=+e.target.value;save()};
eb.onclick=e=>{const k=e.target.dataset.e;if(k==='del')delSel();else if(k==='lv'){const n=prompt('Fib levels (comma separated)',(sel.lv||FL).join(','));if(n){sel.lv=n.split(',').map(Number).filter(x=>!isNaN(x));save()}}else if(k==='lk'){sel.lk=!sel.lk;save();showEB()}else if(k==='hd'){sel.hd=sel.hd?0:1;if(sel.hd)sel=null;save();showEB()}else if(k==='set')drawSettings();else if(k==='al')mkAlert(sel);else if(k==='tx')drawSettings('Text');
 else if(k==='cp'&&sel){const L=Object.values(S.draw).find(l=>l.includes(sel)),n=JSON.parse(JSON.stringify(sel));n.p.forEach(q=>q.t+=stp(act)*3);L.push(n);sel=n;save();showEB()}};
D.addEventListener('keydown',e=>{if(dset.style.display==='flex'){if(e.key==='Escape')closeDrawingSettings(false);return}if(e.target.tagName==='INPUT'||e.target.tagName==='SELECT'||e.target.tagName==='TEXTAREA')return;if(e.key==='Delete'||e.key==='Backspace')delSel();else if(e.key==='Escape'){sel=null;showEB()}});

/* ---------- undo/redo history ---------- */
const U=[];let RD=[];
function hist(){U.push(JSON.stringify(S.draw));if(U.length>80)U.shift();RD=[]}
function undo(){if(!U.length)return;RD.push(JSON.stringify(S.draw));S.draw=JSON.parse(U.pop());sel=null;save();showEB()}
function redo(){if(!RD.length)return;U.push(JSON.stringify(S.draw));S.draw=JSON.parse(RD.pop());sel=null;save();showEB()}
eb.onmousedown=()=>hist();

/* ---------- alerts ---------- */
S.alerts=S.alerts||[];S.scripts=S.scripts||[];
const toast=m=>{const d=D.createElement('div');d.textContent='🔔 '+m+'  ×';d.title='Dismiss';d.style.cssText='position:fixed;right:14px;bottom:14px;background:#131722;border:1px solid #e6b422;color:#e6b422;padding:9px 13px;border-radius:6px;z-index:99;cursor:pointer';d.onclick=()=>d.remove();D.body.appendChild(d);if(S.set.alertHide)setTimeout(()=>d.remove(),8000);
 if(S.set.alertSound)try{const A=new AudioContext(),o=A.createOscillator();o.connect(A.destination);o.frequency.value=880;o.start();o.stop(A.currentTime+.25)}catch(e){}
 if(S.set.alertNotify)try{if(Notification.permission==='granted')new Notification(m);else if(Notification.permission==='default')Notification.requestPermission()}catch(e){}};
function lvl(a,c){if(a.pr!=null)return a.pr;const o=Object.values(S.draw).flat().find(x=>x.id===a.did);if(!o)return null;const[p,q]=o.p;
 if(o.k==='hl')return p.p;if(o.k==='fib')return q.p+(p.p-q.p)*a.lv;
 if(o.k==='tl'||o.k==='ray'){const t=c.view().slice(-1)[0].time;return p.p+(q.p-p.p)*(t-p.t)/((q.t-p.t)||1)}return null}
function mkAlert(o){if(!['hl','fib','tl','ray'].includes(o.k)){alert('Alerts work on Trend, Ray, H-Line and Fib drawings');return}
 const cond=prompt('Alert when price: 1=crosses, 2=crosses up, 3=crosses down','1');if(!cond)return;const a={id:Date.now(),sym:act.cfg.sym,did:o.id,cond:+cond,on:1,once:1,msg:o.k+' alert',pv:null};
 if(o.k==='fib'){const l=prompt('Fib level',.618);if(l==null)return;a.lv=+l;a.msg='fib '+l}S.alerts.push(a);save();alRender()}
function priceAlert(){const p=prompt('Alert price for '+act.cfg.sym);if(!p)return;const cond=prompt('1=crosses, 2=crosses up, 3=crosses down','1');S.alerts.push({id:Date.now(),sym:act.cfg.sym,pr:+p,cond:+cond||1,on:1,once:1,msg:'Price '+p,pv:null});save();alRender()}
function chk(c){const a=c.view();if(!a.length)return;const px=a[a.length-1].close;
 S.alerts.forEach(al=>{if(!al.on||al.sym!==c.cfg.sym)return;const L=lvl(al,c);if(L==null)return;const s=px>=L?1:-1;
  if(al.pv!=null&&s!==al.pv&&(al.cond===1||(al.cond===2&&s>0)||(al.cond===3&&s<0))){toast(c.cfg.sym+': '+al.msg+' @ '+px);if(al.once)al.on=0;save();alRender()}al.pv=s})}
const t0=Ch.prototype.tick;Ch.prototype.tick=function(x){t0.call(this,x);try{chk(this)}catch(e){}};
const ta=D.createElement('button');ta.id='ta';ta.textContent='Alerts';$('#side .sh').appendChild(ta);
const al=D.createElement('div');al.id='al';al.hidden=true;al.style.cssText='flex:1;overflow:auto;padding:0 6px 6px';$('#side').appendChild(al);TB.ta='#al';
ta.addEventListener('click',()=>Object.entries(TB).forEach(([i,s])=>{$(s).hidden=i!=='ta';$('#'+i).classList.toggle('on',i==='ta')}));
function alRender(){const rows=S.alerts.map((x,i)=>({x,i})).filter(({x})=>!S.set.activeAlerts||x.on);al.innerHTML='<div class=sh style="padding:0 0 6px"><button id=pa>+ Price alert (active chart)</button></div>'+rows.map(({x,i})=>`<div class=it data-i=${i}><span>${x.sym}<div class=lb>${x.msg}</div></span><span class=pr><button data-a=t>${x.on?'ON':'off'}</button></span><span data-a=x style="color:#7b8194">✕</span></div>`).join('');$('#pa').onclick=priceAlert}
al.onclick=e=>{const it=e.target.closest('.it');if(!it)return;const x=S.alerts[+it.dataset.i],a=e.target.dataset.a;if(a==='t'){x.on=+!x.on;x.pv=null}else if(a==='x')S.alerts.splice(+it.dataset.i,1);save();alRender()};alRender();

/* ---------- Pine-style scripts (JavaScript with Pine-like helpers) ---------- */
const sum=w=>w.reduce((a,b)=>a+b,0),V=(x,n)=>Array.isArray(x)?x:Array(n).fill(x);
const TAL={sma:(s,n)=>s.map((_,i)=>i<n-1?NaN:sum(s.slice(i-n+1,i+1))/n),
 ema:(s,n)=>{const k=2/(n+1);let p;return s.map((v,i)=>i<n-1?NaN:(p=p==null?sum(s.slice(0,n))/n:v*k+p*(1-k)))},
 rma:(s,n)=>{let p;return s.map((v,i)=>i<n-1?NaN:(p=p==null?sum(s.slice(0,n))/n:(p*(n-1)+v)/n))},
 rsi:(s,n)=>{const u=s.map((v,i)=>i?Math.max(v-s[i-1],0):0),d=s.map((v,i)=>i?Math.max(s[i-1]-v,0):0),a=TAL.rma(u,n),b=TAL.rma(d,n);return a.map((x,i)=>b[i]===0?100:100-100/(1+x/b[i]))},
 stdev:(s,n)=>s.map((_,i)=>{if(i<n-1)return NaN;const w=s.slice(i-n+1,i+1),m=sum(w)/n;return Math.sqrt(sum(w.map(v=>(v-m)**2))/n)}),
 highest:(s,n)=>s.map((_,i)=>i<n-1?NaN:Math.max(...s.slice(i-n+1,i+1))),
 lowest:(s,n)=>s.map((_,i)=>i<n-1?NaN:Math.min(...s.slice(i-n+1,i+1))),
 crossover:(a,b)=>{b=V(b,a.length);return a.map((v,i)=>i>0&&v>b[i]&&a[i-1]<=b[i-1])},
 crossunder:(a,b)=>{b=V(b,a.length);return a.map((v,i)=>i>0&&v<b[i]&&a[i-1]>=b[i-1])}};
function runScripts(c){(c.sx||[]).forEach(x=>c.c.removeSeries(x));c.sx=[];c.pl=[];if(!c.s.$p){c.s.$p=1;c.s.$base=[];if(c.s.setMarkers){const o=c.s.setMarkers.bind(c.s);c.s.setMarkers=m=>{c.s.$base=m;o(m.concat(c.s.$extra||[]).sort((x,y)=>x.time-y.time))}}}c.s.$extra=[];const a=c.view();if(a.length<2)return;
 S.scripts.forEach((sc,si)=>{if(!sc.on)return;if(isPine(sc.code)){try{runPine(c,sc,si,a);sc.err=''}catch(e){sc.err=String(e.message||e)}return}try{const n=a.length,ctx={open:a.map(x=>x.open),high:a.map(x=>x.high),low:a.map(x=>x.low),close:a.map(x=>x.close),volume:a.map(x=>x.volume),time:a.map(x=>x.time),Math};
  const tr=a.map((x,i)=>i?Math.max(x.high-x.low,Math.abs(x.high-a[i-1].close),Math.abs(x.low-a[i-1].close)):x.high-x.low);
  ctx.ta=Object.assign({},TAL,{tr,atr:k=>TAL.rma(tr,k)});ctx.calc=f=>a.map((_,i)=>{try{return f(i)}catch(e){return NaN}});
  ctx.plot=(s,o={})=>{const d=a.map((x,i)=>({time:x.time,value:s[i]})).filter(x=>Number.isFinite(x.value)),pn=o.pane?'sp'+si:'right',op={color:o.color||'#4c8dff',priceScaleId:pn,lastValueVisible:false,priceLineVisible:false};
   const l=o.hist?c.c.addHistogramSeries(op):c.c.addLineSeries({...op,lineWidth:o.width||1,title:o.title||''});if(o.pane)l.priceScale().applyOptions({scaleMargins:{top:.72,bottom:.02}});l.setData(d);c.sx.push(l)};
  ctx.alertcondition=(s,m)=>{const i=n-2;if(i>=0&&s[i]&&sc.k!==a[i].time+c.cfg.sym+m){sc.k=a[i].time+c.cfg.sym+m;toast(c.cfg.sym+' · '+sc.name+': '+(m||'alert'))}};
  new Function(...Object.keys(ctx),sc.code)(...Object.values(ctx));sc.err=''}catch(e){sc.err=String(e)}});if(c.s.setMarkers)c.s.setMarkers(c.s.$base||[])}
/*PINE-START*/
const TK=/\s*(?:(\/\/.*)|("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|#[0-9a-fA-F]{6,8})|(\d+\.?\d*(?:e[+-]?\d+)?|\.\d+)|([A-Za-z_]\w*(?:\.[A-Za-z_]\w*)*)|(:=|==|!=|<=|>=|=>|\+=|-=|\*=|\/=|&&|\|\||[-+*\/%<>=?:,()\[\]!{}]))/y;
function lex(s){const o=[];let p=0,m;while(p<s.length){TK.lastIndex=p;m=TK.exec(s);if(!m){if(s.slice(p).trim())throw Error('Unexpected character: '+s.slice(p).trim()[0]);break}p=TK.lastIndex;if(m[1])break;
 if(m[2])o.push({t:'s',v:m[2][0]==='#'?'"'+m[2]+'"':m[2]});else if(m[3])o.push({t:'n',v:m[3]});else if(m[4])o.push({t:'i',v:m[4]});else o.push({t:'o',v:m[5]})}return o}
function plines(src){const out=[];let buf=null;
 for(const r of src.replace(/\t/g,'    ').split('\n')){const tk=lex(r);if(!tk.length)continue;const ind=r.match(/^ */)[0].length;
  let d=0;if(buf)for(const t of buf.tk)if(t.t==='o'){if(t.v==='('||t.v==='[')d++;else if(t.v===')'||t.v===']')d--}
  const last=buf&&buf.tk[buf.tk.length-1].v,cont=buf&&(d>0||/^(\?|:|and|or|\+|\*|\/|&&|\|\|)$/.test(tk[0].v)||/^(\?|:|,|\+|-|\*|\/|and|or|&&|\|\||\(|=|=>|[<>]=?|==|!=)$/.test(last));
  if(cont)buf.tk.push(...tk);else{if(buf)out.push(buf);buf={ind,tk:[...tk]}}}
 if(buf)out.push(buf);return out}
const FNAMES=new Set(['plot','plotshape','plotchar','hline','bgcolor','barcolor','fill','alertcondition','alert','label.new','line.new','label.delete','line.delete']),
 PUREN=new Set(['nz','na','int','float','str.tostring','fixnan','indicator','strategy','study']),BI=['open','high','low','close','volume','time','hl2','hlc3','ohlc4'],TY=/^(float|int|bool|string|color|line|label)$/,AS=/^(=|:=|\+=|-=|\*=|\/=)$/;
function pine(src){const L=plines(src),vars=new Set(),pv=new Set(),fns=new Set(),loc=new Set(),code=[],stack=[];let id=0;
 const decl=t=>{let j=0;if(t[0].v==='var'||t[0].v==='varip')j++;if(TY.test(t[j].v)&&t[j+1]&&t[j+1].t==='i'&&t[j+2]&&AS.test(t[j+2].v))j++;return j};
 const fdef=(t,j)=>{if(!(t[j].t==='i'&&t[j+1]&&t[j+1].v==='('))return -1;let d=0,q=j+1;for(;q<t.length;q++){if(t[q].v==='(')d++;else if(t[q].v===')'&&!--d)break}return t[q+1]&&t[q+1].v==='=>'?q+1:-1};
 for(const l of L){const t=l.tk,k=t[0].v;if(k==='for'){loc.add(t[1].v);continue}
  if(k==='['){for(const x of t){if(x.v===']')break;if(x.t==='i')vars.add(x.v)}continue}
  const j=decl(t),q=fdef(t,j);if(q>0){fns.add(t[j].v);t.slice(j+2,q-1).forEach(x=>x.t==='i'&&loc.add(x.v));continue}
  if(t[j].t==='i'&&t[j+1]&&AS.test(t[j+1].v)){vars.add(t[j].v);if(t[0].v==='var'||t[0].v==='varip')pv.add(t[j].v)}}
 const tx=t=>{let o='',fr=[],pid=false;
  for(let i=0;i<t.length;i++){const x=t[i],v=x.v,nx=t[i+1];
   if(x.t==='n'||x.t==='s'){o+=v+' ';continue}
   if(x.t==='o'){
    if(v==='('){o+=pid?'('+(id++)+',':'(';pid=false;fr.push({n:0});continue}
    if(v===','){const f=fr[fr.length-1];if(f&&f.n){o+=')';f.n=0}o+=',';continue}
    if(v===')'){const f=fr.pop();if(f&&f.n)o+=')';o+=')';continue}
    if(v==='['){fr.push({h:0});o+='[';continue}
    if(v===']'){const f=fr.pop();o+=f&&f.h?')]':']';continue}
    o+=v+' ';continue}
   const top=fr[fr.length-1];
   if(nx&&nx.v==='='&&top&&top.n===0){o+='$N("'+v+'",';top.n=1;i++;continue}
   let r;const call=nx&&nx.v==='(';
   if(v==='na'&&!call)r='NaN';else if(v==='and')r='&&';else if(v==='or')r='||';else if(v==='not')r='!';
   else if(v==='bar_index')r='$i';else if(v==='true'||v==='false')r=v;
   else if(loc.has(v)||fns.has(v))r=v;
   else if(vars.has(v)||BI.includes(v)){const a=(vars.has(v)?'V.':'B.')+v;if(nx&&nx.v==='['){o+=a+'[$i-(';fr.push({h:1});i++;continue}r=a+'[$i]'}
   else if(v==='ta.tr')r='B.tr[$i]';
   else if(/^ta\./.test(v)){o+='$T.'+v.slice(3);pid=true;continue}
   else if(/^math\./.test(v))r=v==='math.pi'?'Math.PI':v==='math.avg'?'$M.avg':'Math.'+v.slice(5);
   else if(/^color\./.test(v))r='$C.'+v.slice(6);
   else if(/^input(\.|$)/.test(v))r='$in';
   else if(v==='barstate.islast')r='($i===$n-1)';else if(/^barstate\./.test(v))r='true';
   else if(v==='syminfo.tickerid'||v==='syminfo.ticker')r='$sym';
   else if(/^strategy\./.test(v))r='$noop';
   else if(call){if(PUREN.has(v))r='$P['+JSON.stringify(v)+']';else if(FNAMES.has(v)){r='$F['+JSON.stringify(v)+']';pid=true}else throw Error('Unsupported function: '+v+'()')}
   else if(v.includes('.'))r=JSON.stringify(v);
   else throw Error('Unknown identifier: '+v);
   o+=r+' '}
  return o};
 for(const l of L){const t=l.tk,k=t[0].v;while(stack.length&&l.ind<=stack[stack.length-1]){code.push('}');stack.pop()}let s;
  if(k==='if'){s='if('+tx(t.slice(1))+'){';stack.push(l.ind)}
  else if(k==='else'){s=t[1]&&t[1].v==='if'?'else if('+tx(t.slice(2))+'){':'else{';stack.push(l.ind)}
  else if(k==='for'){const e=t.findIndex(x=>x.v==='='),to=t.findIndex(x=>x.v==='to'),by=t.findIndex(x=>x.v==='by'),n=t[1].v;
   s='for(let '+n+'='+tx(t.slice(e+1,to))+';'+n+'<='+tx(t.slice(to+1,by>0?by:t.length))+';'+n+'+='+(by>0?tx(t.slice(by+1)):1)+'){';stack.push(l.ind)}
  else if(k==='['){const e=t.findIndex(x=>x.v==='=');s='{const $r='+tx(t.slice(e+1))+';'+t.slice(1,e).filter(x=>x.t==='i').map((x,q)=>'V.'+x.v+'[$i]=$r['+q+'];').join('')+'}'}
  else{const j=decl(t),q=fdef(t,j);
   if(q>0)s='const '+t[j].v+'=('+t.slice(j+2,q-1).filter(x=>x.t==='i').map(x=>x.v).join(',')+')=>('+tx(t.slice(q+1))+');';
   else if(t[j].t==='i'&&t[j+1]&&AS.test(t[j+1].v)){const n=t[j].v,op=t[j+1].v,rhs=tx(t.slice(j+2));
    s=(t[0].v==='var'||t[0].v==='varip')?'if($i===0)V.'+n+'[$i]='+rhs+';':'V.'+n+'[$i]='+(op.length>1&&op!==':='?'V.'+n+'[$i]'+op[0]+'(':'(')+rhs+');'}
   else s=tx(t)+';'}
  code.push(s)}
 while(stack.length){code.push('}');stack.pop()}
 return{src:code.join('\n'),vars:[...vars],pre:[...pv].map(n=>'V.'+n+'[$i]=$i?V.'+n+'[$i-1]:undefined;').join('')}}
/*PINE-END*/
const isPine=s=>/\/\/\s*@version|(^|\n)\s*(indicator|strategy|study)\s*\(|:=|(^|\n)\s*(float|int|bool|string)\s+\w+\s*=/.test(s);
const PAL=['#4c8dff','#e6b422','#ef5350','#26a69a','#b06cf0','#ff9800'],CL={red:'#F23645',green:'#089981',blue:'#2962FF',orange:'#FF9800',yellow:'#FDD835',white:'#FFFFFF',black:'#000000',gray:'#787B86',aqua:'#00BCD4',lime:'#00E676',maroon:'#801922',navy:'#311B92',olive:'#808000',purple:'#9C27B0',silver:'#B2B5BE',teal:'#00897B',fuchsia:'#E040FB'};
const rgba=(c,t)=>{const m=/^#([0-9a-f]{6})/i.exec(c||'');if(!m)return c;const n=parseInt(m[1],16);return`rgba(${n>>16},${n>>8&255},${n&255},${1-(t||0)/100})`};
const bufS=(s,v,n)=>{(s.b=s.b||[]).push(v);if(s.b.length>n)s.b.shift();return s.b};
const rmaS=(s,v,n)=>{s.n=(s.n||0)+1;if(s.n<n){s.a=(s.a||0)+v;return NaN}if(s.n===n)return s.p=((s.a||0)+v)/n;return s.p=(s.p*(n-1)+v)/n};
const emaS=(s,v,n)=>{const k=2/(n+1);s.n=(s.n||0)+1;if(s.n<n){s.a=(s.a||0)+v;return NaN}if(s.n===n)return s.p=((s.a||0)+v)/n;return s.p=v*k+s.p*(1-k)};
function runPine(c,sc,si,a){
 if(sc.cs!==sc.code||!sc.cf){const cp=pine(sc.code);sc.cf=new Function('B','V','$T','$F','$P','$C','$in','$N','$M','$n','$sym','$noop','return function($i){'+cp.pre+cp.src+'\n}');sc.cp=cp;sc.cs=sc.code}
 const n=a.length,B={open:a.map(x=>x.open),high:a.map(x=>x.high),low:a.map(x=>x.low),close:a.map(x=>x.close),volume:a.map(x=>x.volume),time:a.map(x=>x.time)};
 B.hl2=a.map(x=>(x.high+x.low)/2);B.hlc3=a.map(x=>(x.high+x.low+x.close)/3);B.ohlc4=a.map(x=>(x.open+x.high+x.low+x.close)/4);
 B.tr=a.map((x,i)=>i?Math.max(x.high-x.low,Math.abs(x.high-a[i-1].close),Math.abs(x.low-a[i-1].close)):x.high-x.low);
 const V={},ST={},PL={},MK=[],LB=[],LN=[],AL=[];let I=0,OV=false;sc.cp.vars.forEach(v=>V[v]=[]);
 const st=id=>ST[id]||(ST[id]={}),un=x=>x&&x.__n!==undefined?x.v:x,$N=(n,v)=>({__n:n,v});
 const nm=(spec,f)=>(id,...q)=>{const o=[];q.forEach((x,k)=>{if(x&&x.__n!==undefined){const z=spec.indexOf(x.__n);if(z>=0)o[z]=x.v}else o[k]=x});return f(id,...o)};
 const T={sma:(id,x,l)=>{const b=bufS(st(id),x,l);return b.length<l?NaN:sum(b)/l},ema:(id,x,l)=>emaS(st(id),x,l),rma:(id,x,l)=>rmaS(st(id),x,l),
  wma:(id,x,l)=>{const b=bufS(st(id),x,l);return b.length<l?NaN:b.reduce((p,v,k)=>p+v*(k+1),0)/(l*(l+1)/2)},
  stdev:(id,x,l)=>{const b=bufS(st(id),x,l);if(b.length<l)return NaN;const m=sum(b)/l;return Math.sqrt(sum(b.map(v=>(v-m)**2))/l)},
  highest:(id,x,l)=>{if(l===undefined){l=x;x=B.high[I]}const b=bufS(st(id),x,l);return b.length<l?NaN:Math.max(...b)},
  lowest:(id,x,l)=>{if(l===undefined){l=x;x=B.low[I]}const b=bufS(st(id),x,l);return b.length<l?NaN:Math.min(...b)},
  change:(id,x,l=1)=>{const b=bufS(st(id),x,l+1);return b.length<l+1?NaN:x-b[0]},
  rsi:(id,x,l)=>{const s=st(id);if(s.p===undefined){s.p=x;return NaN}const ch=x-s.p;s.p=x;const u=rmaS(s.u=s.u||{},Math.max(ch,0),l),d=rmaS(s.d=s.d||{},Math.max(-ch,0),l);return d===0?100:100-100/(1+u/d)},
  atr:(id,l)=>rmaS(st(id),B.tr[I],l),
  crossover:(id,x,y)=>{const s=st(id),r=s.p!=null&&s.p[0]<=s.p[1]&&x>y;s.p=[x,y];return r},
  crossunder:(id,x,y)=>{const s=st(id),r=s.p!=null&&s.p[0]>=s.p[1]&&x<y;s.p=[x,y];return r},
  cross:(id,x,y)=>{const s=st(id),r=s.p!=null&&((s.p[0]<=s.p[1]&&x>y)||(s.p[0]>=s.p[1]&&x<y));s.p=[x,y];return r},
  macd:(id,x,f,sl,sg)=>{const s=st(id),m=emaS(s.f=s.f||{},x,f)-emaS(s.s=s.s||{},x,sl);if(!isFinite(m))return[NaN,NaN,NaN];const g=emaS(s.g=s.g||{},m,sg);return[m,g,m-g]},
  bb:(id,x,l,k)=>{const b=bufS(st(id),x,l);if(b.length<l)return[NaN,NaN,NaN];const m=sum(b)/l,d=k*Math.sqrt(sum(b.map(v=>(v-m)**2))/l);return[m,m+d,m-d]},
  stoch:(id,x,h,lo,l)=>{const s=st(id),H=bufS(s,h,l),Lw=(s.l=s.l||[]);Lw.push(lo);if(Lw.length>l)Lw.shift();if(H.length<l)return NaN;const hh=Math.max(...H),ll=Math.min(...Lw);return(x-ll)/(hh-ll)*100},
  barssince:(id,cd)=>{const s=st(id);s.c=cd?0:s.c==null?NaN:s.c+1;return s.c},
  valuewhen:(id,cd,x)=>{const s=st(id);if(cd)s.v=x;return s.v===undefined?NaN:s.v}};
 const $T={};Object.keys(T).forEach(k=>$T[k]=(id,...q)=>T[k](id,...q.map(un)));
 const none=()=>0;
 const $F={plot:nm(['series','title','color','linewidth','style'],(id,v,t,cl,w,s)=>{const p=PL[id]||(PL[id]={t,w:w||1,c:cl||PAL[Object.keys(PL).length%6],hist:/histogram|columns/.test(s||''),d:[]});if(typeof v==='number'&&isFinite(v))p.d.push(cl&&cl!==p.c?{time:a[I].time,value:v,color:cl}:{time:a[I].time,value:v});return v}),
  plotshape:nm(['series','title','style','location','color','size','offset','text','textcolor'],(id,v,t,s,lo,cl,sz,of,tx)=>{if(v){s=String(s||'');lo=String(lo||'');MK.push({time:a[I].time,position:/abovebar/.test(lo)||(/down/.test(s)&&!/belowbar/.test(lo))?'aboveBar':'belowBar',color:cl||'#e6b422',shape:/down/.test(s)?'arrowDown':/up/.test(s)?'arrowUp':/circle/.test(s)?'circle':'square',text:tx||''})}return v}),
  hline:nm(['price','title','color'],(id,p,t,cl)=>{if(I===0)LN.push({h:1,y1:p,color:cl||'#9aa0b0'})}),
  alertcondition:nm(['condition','title','message'],(id,v,t,m)=>{if(v&&I===n-2)AL.push(m||t||'alert')}),
  alert:nm(['message','freq'],(id,m)=>{if(I===n-2)AL.push(m)}),
  'label.new':nm(['x','y','text','xloc','yloc','color','style','textcolor','size'],(id,x,y,t,xl,yl,cl,s,tc)=>{const o={lb:1,x,y,t:String(t||''),col:cl||'#4c8dff',st:String(s||''),tc:tc||'#fff'};LB.push(o);return o}),
  'line.new':nm(['x1','y1','x2','y2','xloc','extend','color','style','width'],(id,x1,y1,x2,y2,xl,ex,cl,s,w)=>{const o={x1,y1,x2,y2,ex:String(ex||''),color:cl||'#e6b422',w:w||1,st:String(s||'')};LB.push(o);return o}),
  'label.delete':(id,o)=>{const q=LB.indexOf(o);if(q>=0)LB.splice(q,1)},'line.delete':(id,o)=>{const q=LB.indexOf(o);if(q>=0)LB.splice(q,1)},
  plotchar:none,bgcolor:none,barcolor:none,fill:none};
 const $P={nz:(x,r=0)=>Number.isFinite(x)?x:r,na:x=>!Number.isFinite(x),int:Math.trunc,float:x=>x,'str.tostring':x=>String(x),fixnan:x=>x,strategy:none,study:none,indicator:(...q)=>{q.forEach(x=>{if(x&&x.__n==='overlay')OV=!!x.v})}};
 const $C={new:(x,t)=>rgba(x,t),rgb:(r,g,b,t=0)=>`rgba(${r},${g},${b},${1-t/100})`};Object.keys(CL).forEach(k=>$C[k]=CL[k]);
 const $in=(...q)=>{const d=q.find(x=>x&&x.__n==='defval');return d?d.v:q[0]&&q[0].__n!==undefined?undefined:q[0]};
 const fn=sc.cf(B,V,$T,$F,$P,$C,$in,$N,{avg:(...q)=>sum(q)/q.length},n,c.cfg.sym,none);
 for(I=0;I<n;I++)fn(I);
 Object.values(PL).forEach(p=>{const pn=OV?'right':'sp'+si,op={color:p.c,priceScaleId:pn,lastValueVisible:false,priceLineVisible:false,title:p.t||''};
  const l=p.hist?c.c.addHistogramSeries(op):c.c.addLineSeries({...op,lineWidth:Math.min(4,p.w)});if(!OV)l.priceScale().applyOptions({scaleMargins:{top:.72,bottom:.02}});l.setData(p.d);c.sx.push(l)});
 c.s.$extra=(c.s.$extra||[]).concat(MK);c.pl=(c.pl||[]).concat(LB.slice(-500),LN);
 sc.ks=sc.ks||{};AL.forEach(m=>{const k=c.cfg.sym+m+a[n-2].time;if(!sc.ks[k]){if(Object.keys(sc.ks).length>30)sc.ks={};sc.ks[k]=1;toast(c.cfg.sym+' · '+sc.name+': '+m)}})}
function tOf(c,x){const a=c.view();if(!a.length||!Number.isFinite(x))return null;const l=a.length-1;return x<0?a[0].time+x*stp(c):x>l?a[l].time+(x-l)*stp(c):a[Math.round(x)]?.time??null}
function pdraw(g,c,W){(c.pl||[]).forEach(o=>{
 if(!o)return;
 if(o.h){if(!Number.isFinite(o.y1))return;const y=c.s.priceToCoordinate(o.y1);if(y==null)return;g.strokeStyle=o.color;g.lineWidth=1;g.setLineDash([4,4]);g.beginPath();g.moveTo(0,y);g.lineTo(W,y);g.stroke();return}
 if(o.lb){if(!Number.isFinite(o.x)||!Number.isFinite(o.y))return;const x=t2x(c,tOf(c,o.x)),y=c.s.priceToCoordinate(o.y);if(x==null||y==null)return;g.setLineDash([]);g.font='11px system-ui';const w=g.measureText(o.t).width+8,yy=/down/.test(o.st)?y-18:y+4;g.fillStyle=o.col;g.fillRect(x-w/2,yy,w,15);g.fillStyle=o.tc;g.fillText(o.t,x-w/2+4,yy+11);return}
 if(![o.x1,o.y1,o.x2,o.y2].every(Number.isFinite))return;
 const x1=t2x(c,tOf(c,o.x1)),y1=c.s.priceToCoordinate(o.y1);let x2=t2x(c,tOf(c,o.x2)),y2=c.s.priceToCoordinate(o.y2);if([x1,y1,x2,y2].some(v=>v==null))return;
 if(/right|both/.test(o.ex)){const dx=x2-x1||1e-6,f=(W-x1)/dx,ny=y1+(y2-y1)*f;x2=x1+dx*f;y2=ny}
 g.strokeStyle=o.color;g.lineWidth=o.w;g.setLineDash(/dash/.test(o.st)?[6,4]:/dot/.test(o.st)?[1.5,3]:[]);g.beginPath();g.moveTo(x1,y1);g.lineTo(x2,y2);g.stroke()})}
const i0=Ch.prototype.ind;Ch.prototype.ind=function(){i0.call(this);try{runScripts(this)}catch(e){}};
const PRE={'SMA 50':"plot(ta.sma(close,50),{color:'#e6b422',title:'SMA50'})",'EMA 20':"plot(ta.ema(close,20),{color:'#4c8dff',title:'EMA20'})",
 'Bollinger Bands':"const m=ta.sma(close,20),sd=ta.stdev(close,20);plot(calc(i=>m[i]+2*sd[i]),{color:'#b06cf0'});plot(m,{color:'#9aa0b0'});plot(calc(i=>m[i]-2*sd[i]),{color:'#b06cf0'})",
 'MACD':"const f=ta.ema(close,12),s=ta.ema(close,26),m=calc(i=>f[i]-s[i]),sg=ta.ema(m.map(v=>v||0),9);plot(m,{pane:1,color:'#4c8dff'});plot(sg,{pane:1,color:'#ef5350'});plot(calc(i=>m[i]-sg[i]),{pane:1,hist:true,color:'#26a69a'})",
 'EMA cross + alert':"const f=ta.ema(close,9),s=ta.ema(close,21);plot(f,{color:'#26a69a'});plot(s,{color:'#ef5350'});\\nalertcondition(ta.crossover(f,s),'EMA9 crossed above EMA21');\\nalertcondition(ta.crossunder(f,s),'EMA9 crossed below EMA21')",
 'Pine: EMA cross':['//@version=5','indicator("EMA cross", overlay=true)','fast = ta.ema(close, 9)','slow = ta.ema(close, 21)','plot(fast, "Fast", color=color.green)','plot(slow, "Slow", color=color.red)','plotshape(ta.crossover(fast, slow), style=shape.triangleup, location=location.belowbar, color=color.green)','alertcondition(ta.crossover(fast, slow), "EMA cross up", "Fast crossed above slow")'].join('\n'),
 'Pine: RSI':['//@version=5','indicator("RSI", overlay=false)','len = input.int(14, "Length")','r = ta.rsi(close, len)','plot(r, "RSI", color=color.purple)','hline(70)','hline(30)','alertcondition(ta.crossunder(r, 30), "RSI below 30", "Oversold")'].join('\n'),
 'RSI + alert':"const r=ta.rsi(close,14);plot(r,{pane:1,color:'#b06cf0'});\\nalertcondition(ta.crossunder(r,30),'RSI below 30');alertcondition(ta.crossover(r,70),'RSI above 70')"};
const sd=D.createElement('div');sd.style.cssText='position:fixed;inset:0;background:#0009;z-index:99;display:none;align-items:center;justify-content:center';
sd.innerHTML='<div style="background:#131722;border:1px solid #232836;border-radius:6px;padding:14px;width:580px;max-width:95vw;max-height:92vh;overflow:auto"><b style="color:#e6b422">Scripts (Pine-style indicators &amp; alerts)</b><div style="margin:8px 0;display:flex;gap:6px"><select id=sp style="flex:1"><option value="">Presets…</option>'+Object.keys(PRE).map(k=>`<option>${k}</option>`).join('')+'</select><input id=scn value="My script"></div><textarea id=sc spellcheck=false placeholder="plot(ta.sma(close,20),{color:\'#e6b422\'})" style="width:100%;height:170px;background:#0f131c;color:#c9ccd6;border:1px solid #232836;font:12px monospace"></textarea><div id=se style="color:#ef5350;min-height:16px"></div><div id=sl></div><button id=sa class=on>Add / Update</button> <button id=sx>Close</button></div>';
D.body.appendChild(sd);
const openScr=()=>{sd.style.display='flex';slr()};
function slr(){$('#sl').innerHTML=S.scripts.map((x,i)=>`<div class=it data-i=${i}><span>${x.name}<div class=lb style="color:#ef5350">${x.err||''}</div></span><span class=pr><button data-a=t>${x.on?'ON':'off'}</button></span><span data-a=e>✎</span><span data-a=x>✕</span></div>`).join('')}
function ap2(){save();charts.forEach(c=>c.ind());slr();$('#se').textContent=S.scripts.map(x=>x.err).find(Boolean)||''}
sd.onclick=e=>{const t=e.target,a=t.dataset.a;if(t===sd||t.id==='sx'){sd.style.display='none';return}
 if(t.id==='sa'){const n=$('#scn').value||'script',ex=S.scripts.find(x=>x.name===n);if(ex)ex.code=$('#sc').value;else S.scripts.push({name:n,code:$('#sc').value,on:1});ap2();return}
 const it=t.closest('.it');if(!it)return;const x=S.scripts[+it.dataset.i];if(a==='t')x.on=+!x.on;else if(a==='x')S.scripts.splice(+it.dataset.i,1);else if(a==='e'){$('#scn').value=x.name;$('#sc').value=x.code;return}ap2()};
sd.onchange=e=>{if(e.target.id==='sp'&&PRE[e.target.value]){$('#sc').value=PRE[e.target.value].replace(/\\n/g,'\n');$('#scn').value=e.target.value}};

/* ---------- TradingView-style right-click chart menu ---------- */
S.tpl=S.tpl||{};let cm=null,clip=null,lastM=null,lockBusy=0,ctx={};
const syncInd=()=>D.querySelectorAll('#top button[data-i]').forEach(b=>b.classList.toggle('on',!!S.ind[b.dataset.i]));
const NM=k=>{const t=TL.find(x=>x[0]===k);if(t)return t[1];const o=$('#dmore option[value='+k+']');return o?o.textContent:k};
const fmtP=(c,p)=>p.toFixed(c.precision||2);
const cmClose=()=>{if(cm){cm.remove();cm=null}};
function resetView(c){c.c.timeScale().fitContent();c.s.priceScale().applyOptions({autoScale:true})}
function addAlertAt(c,p){if(p==null){const a=c.view();p=lastM&&lastM.c===c?c.s.coordinateToPrice(lastM.y):a.length?a[a.length-1].close:null}if(p==null)return;S.alerts.push({id:Date.now(),sym:c.cfg.sym,pr:+fmtP(c,p),cond:1,on:1,once:1,msg:'Price '+fmtP(c,p),pv:null});save();alRender();toast('Alert added: '+c.cfg.sym+' @ '+fmtP(c,p))}
function pasteAt(c,pos){if(!clip||!pos||pos.t==null||pos.p==null)return;hist();const n=JSON.parse(JSON.stringify(clip));n.id=Date.now()+''+Math.random();const dt=pos.t-n.p[0].t,dp=pos.p-n.p[0].p;n.p.forEach(q=>{q.t+=dt;q.p+=dp});(S.draw[c.cfg.sym]=S.draw[c.cfg.sym]||[]).push(n);sel=n;save();showEB()}
function lockV(c,p){if(!S.lockV||lockBusy)return;lockBusy=1;try{charts.forEach(o=>{if(o===c||!o.c.setCrosshairPosition)return;if(!p.time){o.c.clearCrosshairPosition();return}const a=o.view();let b=null;for(let i=a.length-1;i>=0;i--)if(a[i].time<=p.time){b=a[i];break}if(b)o.c.setCrosshairPosition(b.close,b.time,o.s)})}catch(e){}lockBusy=0}
function modal(title,body){const m=D.createElement('div');m.style.cssText='position:fixed;inset:0;background:#0009;z-index:120;display:flex;align-items:center;justify-content:center';m.innerHTML='<div style="background:#131722;border:1px solid #232836;border-radius:6px;width:640px;max-width:95vw;max-height:85vh;display:flex;flex-direction:column"><div style="padding:10px 14px;border-bottom:1px solid #232836;display:flex"><b style="color:#e6b422;flex:1">'+title+'</b><button data-x=1>✕</button></div><div class=mb style="overflow:auto;padding:8px 14px"></div></div>';const mb=m.querySelector('.mb');mb.innerHTML=body;m.onclick=e=>{if(e.target===m||e.target.dataset.x)m.remove()};D.body.appendChild(m);return mb}
function tableView(c){const a=c.view().slice(-500).reverse(),f=v=>v.toFixed(c.precision||2),td='style="text-align:right;padding:3px 8px"';
 modal('Table view · '+c.cfg.sym+' · '+c.cfg.tf,'<table style="width:100%;border-collapse:collapse;font-variant-numeric:tabular-nums"><thead style="position:sticky;top:-8px;background:#131722"><tr>'+['Time','Open','High','Low','Close','Volume'].map(h=>'<th '+td+' class=lb>'+h+'</th>').join('')+'</tr></thead>'+a.map(x=>'<tr style="border-top:1px solid #232836"><td '+td+'>'+new Date(x.time*1000).toLocaleString()+'</td><td '+td+'>'+f(x.open)+'</td><td '+td+'>'+f(x.high)+'</td><td '+td+'>'+f(x.low)+'</td><td '+td+' class="'+(x.close>=x.open?'up':'dn')+'">'+f(x.close)+'</td><td '+td+'>'+fk(x.volume)+'</td></tr>').join('')+'</table>')}
function objTree(){const mb=modal('Object tree','');
 const draw=()=>{const L=S.draw[act.cfg.sym]||[];mb.innerHTML='<b>Drawings · '+act.cfg.sym+'</b>'+(L.length?L.map((o,i)=>'<div class=it data-i='+i+'><span style="flex:1">'+NM(o.k)+'</span><button data-a=v>'+(o.hd?'Show':'Hide')+'</button><button data-a=l>'+(o.lk?'🔒':'🔓')+'</button><button data-a=x>🗑</button></div>').join(''):'<div class=lb style="padding:6px">None</div>')+'<br><b>Indicators</b>'+[['rsi','RSI'],['ao','AO'],['ob','Vol OB']].map(([k,n])=>'<div class=it data-k='+k+'><span style="flex:1">'+n+'</span><button data-a=i>'+(S.ind[k]?'ON':'off')+'</button></div>').join('')+S.scripts.map((x,i)=>'<div class=it data-s='+i+'><span style="flex:1">'+x.name+'</span><button data-a=t>'+(x.on?'ON':'off')+'</button><button data-a=sx>🗑</button></div>').join('')};
 draw();mb.onclick=e=>{const a=e.target.dataset.a,it=e.target.closest('.it');if(!a||!it)return;const L=S.draw[act.cfg.sym]||[],o=L[+it.dataset.i];
  if(a==='v'){o.hd=o.hd?0:1;if(o.hd&&sel===o){sel=null;showEB()}save()}else if(a==='l'){o.lk=!o.lk;save()}else if(a==='x'){hist();L.splice(+it.dataset.i,1);if(sel===o){sel=null;showEB()}save()}
  else if(a==='i'){const k=it.dataset.k;S.ind[k]=+!S.ind[k];syncInd();save();charts.forEach(c=>c.ind())}
  else if(a==='t'){const x=S.scripts[+it.dataset.s];x.on=+!x.on;ap2()}else if(a==='sx'){S.scripts.splice(+it.dataset.s,1);ap2()}draw()}}
const tplSave=()=>{const n=prompt('Template name');if(!n)return;S.tpl[n]={set:Object.assign({},S.set),style:act.style,ind:Object.assign({},S.ind)};save()};
function tplApply(n){const t=S.tpl[n];if(!t)return;S.set=Object.assign({},DEF,t.set);S.ind=Object.assign({rsi:0,ao:0,ob:0},t.ind);save();$('#dc').value=S.set.dc;syncInd();fill();charts.forEach(apply);if(act.style!==t.style)act.setStyle(t.style);charts.forEach(c=>c.ind())}
function showCtx(c,e){e.preventDefault();setAct(c);cmClose();const r=e.currentTarget.getBoundingClientRect(),x=e.clientX-r.left,y=e.clientY-r.top,p=c.s.coordinateToPrice(y),t=x2t(c,x);ctx={t,p};
 const sym=c.cfg.sym,ps=p!=null?fmtP(c,p):'',nd=(S.draw[sym]||[]).length,ni=Object.values(S.ind).filter(Boolean).length+S.scripts.filter(z=>z.on).length;
 const items=[['↺','Reset chart view','Alt + R',()=>resetView(c)],'-',
  ['','Copy price '+ps,'',()=>navigator.clipboard&&navigator.clipboard.writeText(ps),p==null],
  ['','Paste','Ctrl + V',()=>pasteAt(c,ctx),!clip||p==null||t==null],'-',
  ['🔔','Add alert on '+sym+' at '+ps+'…','Alt + A',()=>addAlertAt(c,p),p==null],
  ['▲','Buy 1 '+sym+' @ '+ps+' limit','Alt + Shift + B',null,1],['▼','Sell 1 '+sym+' @ '+ps+' stop','Alt + Shift + S',null,1],['＋','Add order on '+sym+' at '+ps+'…','Shift + T',null,1],'-',
  [S.lockV?'✓':'','Lock vertical cursor line by time','',()=>{S.lockV=!S.lockV;save();if(!S.lockV)charts.forEach(o=>o.c.clearCrosshairPosition&&o.c.clearCrosshairPosition())}],'-',
  ['','Table view','',()=>tableView(c)],['','Object tree','',objTree],['','Chart template','›',null,0,1],'-'];
 if(nd)items.push(['','Remove '+nd+' drawing'+(nd>1?'s':''),'',()=>{hist();delete S.draw[sym];sel=null;save();showEB()}]);
 if(ni)items.push(['','Remove '+ni+' indicator'+(ni>1?'s':''),'',()=>{S.ind={rsi:0,ao:0,ob:0};S.scripts.forEach(z=>z.on=0);syncInd();ap2()}]);
 if(nd||ni)items.push('-');items.push(['⚙','Settings…','',()=>{dlg.style.display='flex'}]);
 cm=D.createElement('div');cm.style.cssText='position:fixed;z-index:130;min-width:340px;background:#1b2030;border:1px solid #2a3040;border-radius:6px;padding:4px 0;box-shadow:0 6px 24px #000a;font-size:13px';
 const rs='display:flex;gap:12px;align-items:center;padding:7px 14px;cursor:pointer;white-space:nowrap;position:relative';
 items.forEach(it=>{if(it==='-'){const h=D.createElement('div');h.style.cssText='height:1px;background:#2a3040;margin:4px 0';cm.appendChild(h);return}
  const [ic,lb,sc,fn,dis,sub]=it,d=D.createElement('div');d.style.cssText=rs+(dis?';opacity:.45;cursor:default':'');d.innerHTML='<span style="width:16px;text-align:center">'+ic+'</span><span style="flex:1">'+lb+'</span><span class=lb>'+sc+'</span>';if(dis&&fn===null)d.title='Order entry is not connected';
  d.onmouseenter=()=>{d.style.background=dis?'':'#262d40';cm.querySelectorAll('.sub').forEach(s=>s.remove());
   if(sub){const sp=D.createElement('div');sp.className='sub';sp.style.cssText='position:absolute;left:100%;top:-4px;min-width:200px;background:#1b2030;border:1px solid #2a3040;border-radius:6px;padding:4px 0;box-shadow:0 6px 24px #000a';
    sp.innerHTML='<div data-a=s style="'+rs+'">Save as…</div>'+Object.keys(S.tpl).map(n=>'<div data-a=a data-n="'+n+'" style="'+rs+'"><span style="flex:1">'+n+'</span><span data-a=d data-n="'+n+'" class=lb>✕</span></div>').join('');
    sp.onclick=ev=>{ev.stopPropagation();const a=ev.target.dataset.a,n=ev.target.dataset.n||(ev.target.closest('[data-n]')||{dataset:{}}).dataset.n;if(a==='s')tplSave();else if(a==='d'){delete S.tpl[n];save()}else if(n)tplApply(n);cmClose()};
    sp.querySelectorAll('div').forEach(z=>{z.onmouseenter=()=>z.style.background='#262d40';z.onmouseleave=()=>z.style.background=''});d.appendChild(sp);const q=sp.getBoundingClientRect();if(q.right>innerWidth){sp.style.left='auto';sp.style.right='100%'}}};
  d.onmouseleave=()=>{d.style.background=''};
  if(!dis&&fn)d.onclick=()=>{cmClose();fn()};cm.appendChild(d)});
 D.body.appendChild(cm);const w=cm.offsetWidth,h=cm.offsetHeight;cm.style.left=Math.max(4,Math.min(e.clientX,innerWidth-w-4))+'px';cm.style.top=Math.max(4,Math.min(e.clientY,innerHeight-h-4))+'px'}
function extras(c,cv){if(c.$x)return;c.$x=1;cv.addEventListener('contextmenu',e=>showCtx(c,e));cv.addEventListener('mousemove',e=>{const r=cv.getBoundingClientRect();lastM={c,x:e.clientX-r.left,y:e.clientY-r.top}});c.c.subscribeCrosshairMove(p=>lockV(c,p))}
D.addEventListener('mousedown',e=>{if(cm&&!cm.contains(e.target))cmClose()},true);
D.addEventListener('keydown',e=>{if(e.key==='Escape')cmClose();if(e.target.tagName==='INPUT'||e.target.tagName==='SELECT'||e.target.tagName==='TEXTAREA')return;const k=e.key.toLowerCase();
 if(e.altKey&&k==='r'){e.preventDefault();resetView(act)}else if(e.altKey&&k==='a'){e.preventDefault();addAlertAt(act,null)}
 else if(e.ctrlKey&&k==='c'&&sel)clip=JSON.parse(JSON.stringify(sel));
 else if(e.ctrlKey&&k==='v'&&clip&&lastM&&lastM.c===act){const p=act.s.coordinateToPrice(lastM.y),t=x2t(act,lastM.x);pasteAt(act,{t,p})}});
D.addEventListener('scroll',cmClose,true);addEventListener('blur',cmClose);

/* ---------- footprint chart (bid x ask per price level, built from 1m candles) ---------- */
const nice=v=>{const e=10**Math.floor(Math.log10(v)),m=v/e;return(m<=1?1:m<=2?2:m<=5?5:10)*e};
const fv=v=>{const a=Math.abs(v),s=v<0?'-':'';return s+(a>=1e6?(a/1e6).toFixed(1)+'M':a>=1e4?(a/1e3).toFixed(0)+'K':a>=1e3?(a/1e3).toFixed(1)+'K':a>=100?a.toFixed(0):a>=1?a.toFixed(1):a>0?a.toFixed(2):'0')};
async function fpLoad(c){const f=c.fp=c.fp&&c.fp.key===c.cfg.sym?c.fp:{key:c.cfg.sym,m:[],t:0};if(f.busy)return;f.busy=1;f.t=Date.now();f.err='';
 try{let m=null;const nm=c.name,s=c.src;
  if(s!=='MT5')try{let out=[],end='';for(let p=0;p<3;p++){const j=await jget(`https://api.binance.com/api/v3/klines?symbol=${nm}&interval=1m&limit=1000${end}`);if(!Array.isArray(j)||!j.length)break;out=j.map(k=>({time:k[0]/1000,open:+k[1],high:+k[2],low:+k[3],close:+k[4],volume:+k[5],bv:+k[9]})).concat(out);end='&endTime='+(j[0][0]-1)}if(out.length)m=out}catch(e){}
  if(!m){const d=s==='MT5'?await mt5(nm,1,3000):await exCandles(s,nm,1,1000);m=d.map(x=>({...x,bv:x.volume*(x.high>x.low?(x.close-x.low)/(x.high-x.low):.5),est:1}))}
  f.m=m;f.est=!!(m[0]&&m[0].est);c.fpc={}}catch(e){f.err=String(e&&e.message||e)}f.busy=0}
function fpBins(c,bar,tick,tf){const m=c.fp.m,end=bar.time+tf*60,bins=new Map();let lo=0,hi=m.length;while(lo<hi){const mid=lo+hi>>1;m[mid].time<bar.time?lo=mid+1:hi=mid}
 for(let i=lo;i<m.length&&m[i].time<end;i++){const x=m[i],a=Math.floor(x.low/tick+1e-9),b=Math.floor(x.high/tick+1e-9),n=b-a+1,buy=x.bv,sell=Math.max(0,x.volume-x.bv);for(let k=a;k<=b;k++){const e=bins.get(k)||{b:0,s:0};e.b+=buy/n;e.s+=sell/n;bins.set(k,e)}}return bins}
function fpDraw(g,c,W,H){
 g.save();
 g.setLineDash([]);
 if(!c.fp||c.fp.key!==c.cfg.sym||(Date.now()-c.fp.t>15000&&!c.fp.busy))fpLoad(c);
 const f=c.fp,a=c.view(),ts=c.c.timeScale(),lr=ts.getVisibleLogicalRange(),footer=Math.min(48,Math.max(38,H*.13)),plotH=H-footer;
 c.fpc=c.fpc||{};
 g.font='11px system-ui';g.fillStyle='#7b8194';g.textAlign='left';g.textBaseline='alphabetic';
 g.fillText('Footprint · bid × ask · '+(f.err?'data error: '+f.err:f.busy&&!f.m.length?'loading 1m order flow…':f.est?'estimated from candle volume':'1m taker-buy volume'),8,15);
 if(!a.length||!f.m.length||!lr){g.restore();return}
 let spacing=0;
 for(let i=a.length-1;i>0&&!spacing;i--){const x1=t2x(c,a[i].time),x0=t2x(c,a[i-1].time);if(x1!=null&&x0!=null)spacing=Math.abs(x1-x0)}
 if(spacing<24){g.fillStyle='#7b8194';g.fillText('Zoom in to see bid × ask levels',8,31);g.restore();return}
 const p0=c.s.coordinateToPrice(0),p1=c.s.coordinateToPrice(14);
 if(p0==null||p1==null){g.restore();return}
 const tick=Math.max(nice(Math.abs(p0-p1)||1e-8),10**-(c.precision||2)),tf=c.tfm,last=a.length-1;
 const from=Math.max(0,Math.floor(lr.from)-1),to=Math.min(last,Math.ceil(lr.to)+1),bars=[],profile=new Map();
 let maxRow=0,maxVolume=0,run=0,day=-1;
 for(let i=from;i<=to;i++){
  const bar=a[i],x=t2x(c,bar.time);if(x==null)continue;
  const key=tick+'|'+bar.time;let bins=i===last?null:c.fpc[key];
  if(!bins){bins=fpBins(c,bar,tick,tf);if(i!==last)c.fpc[key]=bins}
  let buy=0,sell=0,poc=null,pocVol=0;
  bins.forEach((v,k)=>{const total=v.b+v.s;buy+=v.b;sell+=v.s;profile.set(k,(profile.get(k)||0)+total);if(total>pocVol){pocVol=total;poc=k}maxRow=Math.max(maxRow,total)});
  const d=buy-sell,total=buy+sell,utcDay=Math.floor(bar.time/86400);
  if(day!==utcDay){day=utcDay;run=0}run+=d;
  maxVolume=Math.max(maxVolume,total);
  bars.push({bar,x,bins,buy,sell,delta:d,total,poc,run});
 }
 if(!bars.length){g.restore();return}
 const cellW=Math.min(spacing*.86,84),half=cellW/2,barWidth=Math.max(1,half-2),minLevelHeight=8;
 for(const item of bars){
  const{bar,x,bins,poc}=item,top=c.s.priceToCoordinate(bar.high),bottom=c.s.priceToCoordinate(bar.low);
  if(top==null||bottom==null)continue;
  const y=Math.min(top,bottom),h=Math.max(1,Math.abs(bottom-top)),x0=x-cellW/2;
  g.fillStyle=bar.close>=bar.open?'rgba(38,166,154,.045)':'rgba(239,83,80,.045)';g.fillRect(x0,y,cellW,h);
  g.strokeStyle='rgba(154,160,176,.38)';g.lineWidth=1;g.strokeRect(x0+.5,y+.5,Math.max(0,cellW-1),Math.max(0,h-1));
  bins.forEach((v,k)=>{
   const yt=c.s.priceToCoordinate((k+1)*tick),yb=c.s.priceToCoordinate(k*tick);
   if(yt==null||yb==null)return;
   const rh=yb-yt,levelH=Math.max(1,rh-1),total=v.b+v.s,ym=(yt+yb)/2;
   const ratio=maxRow?total/maxRow:0,barW=Math.max(1,barWidth*ratio),imbBuy=v.b>=3*Math.max(v.s,1e-9),imbSell=v.s>=3*Math.max(v.b,1e-9);
   g.fillStyle=v.b>=v.s?'rgba(104,151,184,.32)':'rgba(137,148,163,.32)';
   g.fillRect(x0+1,yt+.5,barW,levelH);
   g.fillStyle=v.s>v.b?'rgba(104,151,184,.32)':'rgba(137,148,163,.32)';
   g.fillRect(x+1,yt+.5,barW,levelH);
   if(k===poc){g.strokeStyle='rgba(230,180,34,.9)';g.lineWidth=1;g.strokeRect(x0+.5,yt+.5,Math.max(0,cellW-1),Math.max(0,levelH))}
   if(spacing>=48&&rh>=minLevelHeight){
    const fs=Math.min(11,Math.max(8,rh-1));g.textBaseline='middle';g.font=(imbSell?'bold ':'')+fs+'px system-ui';
    g.textAlign='center';g.fillStyle=imbSell?'#ff8a80':'#c9ccd6';g.fillText(fv(v.s),x-half/2,ym,half-2);
    g.font=(imbBuy?'bold ':'')+fs+'px system-ui';g.fillStyle=imbBuy?'#69f0ae':'#c9ccd6';g.fillText(fv(v.b),x+half/2,ym,half-2);
   }
  });
 }
 const footerY=H-footer,rowH=footer/3;
 g.fillStyle='rgba(19,23,34,.94)';g.fillRect(0,footerY,W,footer);
 g.strokeStyle='rgba(123,129,148,.5)';g.lineWidth=1;g.beginPath();g.moveTo(0,footerY+.5);g.lineTo(W,footerY+.5);g.stroke();
 const rows=[['Delta',item=>item.delta,Math.max(1,...bars.map(v=>Math.abs(v.delta)))],['Volume',item=>item.total,Math.max(1,...bars.map(v=>v.total))],['Running Δ',item=>item.run,Math.max(1,...bars.map(v=>Math.abs(v.run)))]];
 rows.forEach(([label,getValue,scale],ri)=>{
  const y=footerY+ri*rowH;
  if(ri){g.strokeStyle='rgba(123,129,148,.2)';g.beginPath();g.moveTo(0,y+.5);g.lineTo(W,y+.5);g.stroke()}
  g.textBaseline='middle';g.textAlign='left';g.font='9px system-ui';g.fillStyle='#7b8194';g.fillText(label,4,y+rowH/2);
  bars.forEach(item=>{
   const value=getValue(item),x0=item.x-cellW/2,alpha=.12+.35*Math.min(1,Math.abs(value)/scale);
   if(x0+cellW<46||x0>W) return;
   if(ri===1)g.fillStyle='rgba(139,151,166,'+alpha+')';
   else if(value>=0)g.fillStyle='rgba(67,123,176,'+alpha+')';
   else g.fillStyle='rgba(105,105,111,'+alpha+')';
   g.fillRect(x0,y+1,cellW,rowH-2);
   if(spacing>=30){const text=ri!==1&&value>0?'+'+fv(value):fv(value);g.textAlign='center';g.font='9px system-ui';g.fillStyle=ri===1?'#d1d5dc':value>=0?'#9ecbff':'#c9ccd6';g.fillText(text,item.x,y+rowH/2,cellW-2)}
  });
 });
 if(profile.size){
  const profileW=Math.min(64,W*.08),xRight=W-2,xLeft=xRight-profileW,maxProfile=Math.max(...profile.values());
  g.fillStyle='rgba(19,23,34,.6)';g.fillRect(xLeft,0,profileW,plotH);
  g.strokeStyle='rgba(123,129,148,.45)';g.beginPath();g.moveTo(xLeft+.5,0);g.lineTo(xLeft+.5,plotH);g.stroke();
  profile.forEach((volume,k)=>{
   const yt=c.s.priceToCoordinate((k+1)*tick),yb=c.s.priceToCoordinate(k*tick);
   if(yt==null||yb==null)return;
   const width=profileW*volume/maxProfile,height=Math.max(1,yb-yt-1);
   g.fillStyle='rgba(122,145,164,.55)';g.fillRect(xRight-width,yt+.5,width,height);
  });
 }
 g.restore();
}

/* ---------- hook into app ---------- */
$('#tn').hidden=!S.set.news;
const b0=build;build=function(){b0();charts.forEach(attach);setTool(dtool)};
charts.forEach(attach);setTool('cur');requestAnimationFrame(frame);
})();