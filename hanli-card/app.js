'use strict';
const stage=document.querySelector('#stage'),card=document.querySelector('#card'),back=document.querySelector('#backfx'),front=document.querySelector('#frontfx'),bc=back.getContext('2d'),fc=front.getContext('2d'),power=document.querySelector('#power'),burstButton=document.querySelector('#burst'),pauseButton=document.querySelector('#pause'),burstLabel=document.querySelector('#burst-label');
const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
let paused=reduced,mode='orbit',w=1,h=1,dpr=1,time=0,previous=0,burst=0,burstTotal=3.3,flipped=false,rx=0,ry=0,tx=0,ty=0,drag=null,intensity=.75;
const sword=new Image();sword.src='sword.webp';let swordReady=false;sword.onload=()=>swordReady=true;
const motes=Array.from({length:90},(_,i)=>({a:i*2.39996,r:.3+Math.random()*.7,s:Math.random(),v:.2+Math.random()*.7}));
function resize(){w=stage.clientWidth;h=stage.clientHeight;dpr=Math.min(devicePixelRatio||1,1.7);for(const c of [back,front]){c.width=Math.round(w*dpr);c.height=Math.round(h*dpr)}bc.setTransform(dpr,0,0,dpr,0,0);fc.setTransform(dpr,0,0,dpr,0,0)}new ResizeObserver(resize).observe(stage);resize();
function pauseUI(){pauseButton.textContent=paused?'继续动效':'暂停动效';pauseButton.setAttribute('aria-pressed',String(paused))}pauseUI();pauseButton.onclick=()=>{paused=!paused;pauseUI()};
document.querySelectorAll('[data-mode]').forEach(b=>b.onclick=()=>{mode=b.dataset.mode;document.querySelectorAll('[data-mode]').forEach(v=>{v.classList.toggle('active',v===b);v.setAttribute('aria-pressed',String(v===b))})});
power.oninput=()=>{intensity=power.value/100;document.querySelector('#power-value').value=power.value+'%'};
function flip(){flipped=!flipped;document.querySelector('#flip').textContent=flipped?'返回正面':'翻转藏卡'}document.querySelector('#flip').onclick=flip;
function release(){if(burst>0)return;paused=false;pauseUI();burst=burstTotal;burstButton.disabled=true;burstLabel.textContent=mode==='thunder'?'辟邪神雷':mode==='storm'?'万剑归宗':'青竹剑阵';burstLabel.style.opacity='1';setTimeout(()=>burstLabel.style.opacity='0',1100)}burstButton.onclick=release;
card.onpointerdown=e=>{if(e.button!==0)return;e.preventDefault();card.focus({preventScroll:true});drag={x:e.clientX,y:e.clientY,tx,ty};card.setPointerCapture(e.pointerId)};card.onpointermove=e=>{if(!drag)return;tx=Math.max(-25,Math.min(25,drag.tx-(e.clientY-drag.y)*.2));ty=Math.max(-35,Math.min(35,drag.ty+(e.clientX-drag.x)*.22))};card.onpointerup=card.onpointercancel=card.onlostpointercapture=()=>drag=null;card.ondragstart=e=>e.preventDefault();
card.onkeydown=e=>{if([' ','Enter','ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key)){e.preventDefault();if(e.key===' '||e.key==='Enter')flip();if(e.key==='ArrowLeft')ty-=5;if(e.key==='ArrowRight')ty+=5;if(e.key==='ArrowUp')tx+=5;if(e.key==='ArrowDown')tx-=5;ty=Math.max(-35,Math.min(35,ty));tx=Math.max(-25,Math.min(25,tx))}};
function line(ctx,points,color,width,glow=0){ctx.beginPath();points.forEach((p,i)=>i?ctx.lineTo(p[0],p[1]):ctx.moveTo(p[0],p[1]));ctx.strokeStyle=color;ctx.lineWidth=width;ctx.shadowColor=color;ctx.shadowBlur=glow;ctx.stroke();ctx.shadowBlur=0}
function bolt(ctx,x1,y1,x2,y2,seed,alpha){const points=[];for(let i=0;i<=12;i++){const f=i/12,envelope=Math.sin(f*Math.PI);points.push([x1+(x2-x1)*f+Math.sin(i*13.1+seed)*17*envelope,y1+(y2-y1)*f+Math.cos(i*7.3+seed)*13*envelope])}line(ctx,points,`rgba(194,227,108,${alpha*.3})`,5,12);line(ctx,points,`rgba(255,247,190,${alpha})`,1.1,5)}
function drawSword(ctx,x,y,size,angle,alpha){if(!swordReady)return;ctx.save();ctx.translate(x,y);ctx.rotate(angle);ctx.globalAlpha=alpha;const sw=size*sword.width/sword.height;ctx.drawImage(sword,-sw/2,-size/2,sw,size);ctx.restore()}
function render(now){const dt=Math.min((now-previous)/1000||0,.04);previous=now;if(!paused&&!document.hidden){time+=dt;if(burst>0){burst=Math.max(0,burst-dt);if(!burst)burstButton.disabled=false}}const motion=paused?0:1;rx+=(tx+(drag||paused?0:Math.sin(time*.8)*3)-rx)*.09;ry+=(ty+(flipped?180:0)+(drag||paused?0:Math.sin(time*.5)*6)-ry)*.09;card.style.setProperty('--rx',rx+'deg');card.style.setProperty('--ry',ry+'deg');card.style.setProperty('--mx',50+Math.sin(ry*Math.PI/180)*70+'%');card.style.setProperty('--my',50+rx*1.5+'%');card.style.setProperty('--px',Math.sin(ry*Math.PI/180)*7+'px');card.style.setProperty('--py',rx*.25+'px');
 bc.clearRect(0,0,w,h);fc.clearRect(0,0,w,h);const cx=w/2,cy=h*.49,R=Math.min(w*.42,330),scale=Math.min(w/750,1),progress=burst?1-burst/burstTotal:0,energy=burst?Math.sin(progress*Math.PI):0;bc.globalCompositeOperation='lighter';fc.globalCompositeOperation='lighter';
 // Fine orbital tracks behind the collectible card.
 bc.save();bc.translate(cx,cy+65);bc.rotate(-.25);for(let k=0;k<3;k++){bc.beginPath();bc.ellipse(0,0,R+k*20,(R+k*20)*.42,0,0,Math.PI*2);bc.strokeStyle=`rgba(92,219,159,${(.12+k*.015)*intensity})`;bc.lineWidth=k===1?1.3:.6;bc.stroke()}bc.restore();

 // Nine large blades with curved wakes and perspective depth.
 const count=9;
 function pose(i,t){
   const a=i/count*Math.PI*2+t*.65,z=Math.sin(a),radius=R*.91;
   let x=cx+Math.cos(a)*radius,y=cy+z*radius*.57,angle=Math.atan2(-Math.sin(a),Math.cos(a)*.57)+Math.PI/2;
   let size=(145+(z+1)*65)*(.64+scale*.36);
   if(mode==='storm'){
     const f=(i/count+t*.24)%1;
     x=cx+(i%3-1)*R*.65+(1-f)*R*.9-R*.45;y=-240+f*(h+480);
     angle=Math.PI+Math.atan2(R*.9,h+480);size=(220+(i%3)*38)*(.6+scale*.4);
   }else if(mode==='thunder'){
     x=cx+Math.cos(a)*radius;y=cy+z*radius*.76;angle=a+Math.PI/2;
     size=(190+(z+1)*40)*(.6+scale*.4);
   }
   if(burst){
     if(progress<.28){
       const k=progress/.28;
       x=cx+(x-cx)*(1-k*.45);y=cy+(y-cy)*(1-k*.45);
       angle+=(Math.atan2(x-cx,-(y-cy))-angle)*k;size*=1+k*.22;
     }else{
       const k=Math.min(1,(progress-.28)/.45),ease=1-Math.pow(1-k,3);
       const a=i/count*Math.PI*2-.3;
       x=cx+Math.cos(a)*R*(.5+ease*2.5);
       y=cy+Math.sin(a)*R*(.5+ease*2.5)*.65;
       angle=a+Math.PI/2;size*=1+Math.sin(k*Math.PI)*1.05;
     }
   }
   return {x,y,angle,size,z};
 }
 for(let i=0;i<count;i++){
   const p=pose(i,time),ctx=p.z>0?fc:bc,alpha=(.67+(p.z+1)*.13);
   // Sample backwards only while the motion remains continuous.
   const points=[[p.x,p.y]], maxLength=Math.min(95,p.size*.42);
   let travelled=0, previousPoint=p;
   for(let j=1;j<=12;j++){
     const q=pose(i,time-j*.016);
     const segment=Math.hypot(q.x-previousPoint.x,q.y-previousPoint.y);
     // A wrapped sword starts a new trail: never connect across the screen.
     if(segment>Math.max(35,maxLength*.55)||travelled+segment>maxLength)break;
     travelled+=segment;points.push([q.x,q.y]);previousPoint=q;
   }
   ctx.lineCap='round';ctx.lineJoin='round';
   for(let j=points.length-1;j>0;j--){
     const fade=Math.pow(1-j/points.length,1.7);
     const pair=[points[j],points[j-1]];
     line(ctx,pair,`rgba(40,227,160,${.16*intensity*fade})`,8*fade,8);
     line(ctx,pair,`rgba(189,255,208,${.5*intensity*fade})`,2*fade,3);
   }
   for(let j=2;j>0;j--){
     const q=pose(i,time-j*.023);
     if(Math.hypot(q.x-p.x,q.y-p.y)<maxLength)
       drawSword(ctx,q.x,q.y,q.size,q.angle,.045*(3-j)*intensity);
   }
   drawSword(ctx,p.x,p.y,p.size,p.angle,alpha);
   // Lightning clings to the blade, rather than floating far from it.
   if(mode==='thunder'||burst){
     const dx=Math.sin(p.angle)*p.size*.4,dy=-Math.cos(p.angle)*p.size*.4;
     bolt(ctx,p.x-dx,p.y-dy,p.x+dx,p.y+dy,time*9+i*2,(.55+energy*.4)*intensity);
   }
 }
 // One sweeping foreground hero blade during the release.
 if(burst&&progress>.29&&progress<.77){
   const f=(progress-.29)/.48;
   const x=cx-R*1.5+f*R*3,y=cy+h*.44-f*h*.72;
   const heroSize=(360+Math.sin(f*Math.PI)*240)*(.65+scale*.35);
   const opacity=Math.sin(f*Math.PI)*.95;
   line(fc,[[x-R*.65,y+h*.18],[x,y]],`rgba(96,255,180,${opacity*.4*intensity})`,26,25);
   drawSword(fc,x,y,heroSize,.98,opacity);
 }
 // Slow-moving motes and arcing gold thunder. No strobe or repeated flashes.
 for(const p of motes){const a=p.a+time*p.v*.08,r=R*p.r*(1.3+energy);const x=cx+Math.cos(a)*r,y=((cy+Math.sin(a)*r*.8-time*p.v*15)%h+h)%h;const ctx=p.s>.55?fc:bc;ctx.fillStyle=`rgba(${p.s>.5?'237,218,136':'130,245,198'},${(.25+p.s*.5)*intensity})`;ctx.fillRect(x,y,p.s*2+1,p.s*2+1)}
 if(mode==='thunder'||burst){const amount=burst?8:4;for(let k=0;k<amount;k++){const a=k/amount*Math.PI*2+time*.15;const radius=R*(1+energy*.35);const seed=Math.floor(time*7)*.7+k*5;bolt(k%2?bc:fc,cx+Math.cos(a)*radius,cy+Math.sin(a)*radius*.7,cx+Math.cos(a+.45)*radius,cy+Math.sin(a+.45)*radius*.7,seed,(.35+energy*.55)*intensity)}}
 if(burst){for(let k=0;k<3;k++){const f=(progress*1.5-k*.18);if(f>0&&f<1){fc.beginPath();fc.ellipse(cx,cy,R*(.3+f*2),R*(.3+f*2)*.65,0,0,Math.PI*2);fc.strokeStyle=`rgba(222,238,159,${(1-f)*intensity*.8})`;fc.lineWidth=2;fc.stroke()}}}
 bc.globalCompositeOperation='source-over';fc.globalCompositeOperation='source-over';requestAnimationFrame(render)}requestAnimationFrame(render);
