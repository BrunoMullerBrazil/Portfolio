// FREQUÊNCIA EP1 — camada de arte v2 (substitui cenários do ep01.html)
// ---------- helpers ----------
function hatch(g,clip,ang,sp,col,w,seed,amp=1.2){
  g.save();g.beginPath();clip();g.clip();const c=Math.cos(ang),s=Math.sin(ang);g.strokeStyle=col;g.lineWidth=w;g.lineCap='round';
  for(let d=-2300,k=0;d<2300;d+=sp,k++){const j=(h2(seed,k)-.5)*sp*.5;const ox=540-s*(d+j),oy=960+c*(d+j);
    g.beginPath();g.moveTo(ox-c*2300,oy-s*2300);for(let u=-2300;u<=2300;u+=230){g.lineTo(ox+c*u+(h2(seed+k,u)-.5)*amp*2,oy+s*u+(h2(seed+k+7,u)-.5)*amp*2);}g.stroke();}
  g.restore();}
function glow(x,y,r,col,a){const g=X.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,col.replace('A',a));g.addColorStop(1,col.replace('A',0));X.fillStyle=g;X.fillRect(x-r,y-r,r*2,r*2);}
function smoke(x,y,h,lean,a,seed){for(let i=0;i<26;i++){const u=i/26,ph=(RT*.05+u)%1;const py=y-ph*h,px=x+lean*ph*h+noise1(ph*4+RT*.3,seed+i)*40*ph;const r=20+ph*110;
  X.fillStyle=`rgba(70,78,80,${a*(1-ph)*.55})`;X.beginPath();X.arc(px,py,r,0,7);X.fill();}}
function motes(x0,y0,x1,y1,n,seed,beam){for(let i=0;i<n;i++){const bx=mix(x0,x1,h2(i,seed)),by=mix(y0,y1,h2(i,seed+1));
  const x=bx+noise1(RT*.15+i,seed)*40,y=by+noise1(RT*.1+i,seed+3)*50-((RT*6+i*13)%120)+60;const a=beam?beam(x,y):1;if(a<=0)continue;
  const tw=.4+.6*Math.abs(noise1(RT*.8+i,seed+5));X.fillStyle=`rgba(225,232,226,${.55*a*tw})`;X.fillRect(x,y,2+h2(i,seed+2)*2.5,2+h2(i,seed+2)*2.5);}}
function catenary(x0,y0,x1,y1,sag,col,w){X.beginPath();for(let i=0;i<=40;i++){const u=i/40;X.lineTo(mix(x0,x1,u),mix(y0,y1,u)+sag*4*u*(1-u));}X.strokeStyle=col;X.lineWidth=w;X.stroke();}
function plaster(w,h,base,seed,crackCol){const c=darkTex(w,h,base,seed,22),g=c.getContext('2d');
  for(let i=0;i<70;i++){const x=h2(i,seed)*w,y=h2(i,seed+1)*h,r=40+h2(i,seed+2)*240;const gr=g.createRadialGradient(x,y,0,x,y,r);const d=h2(i,seed+3)>.5;
    gr.addColorStop(0,d?'rgba(0,0,0,.18)':'rgba(255,240,210,.05)');gr.addColorStop(1,'rgba(0,0,0,0)');g.fillStyle=gr;g.fillRect(x-r,y-r,r*2,r*2);}
  for(let i=0;i<14;i++){let x=h2(i,seed+9)*w,y=h2(i,seed+10)*h;g.strokeStyle=crackCol;g.lineWidth=1.6;g.beginPath();g.moveTo(x,y);
    for(let k=0;k<26;k++){x+=(h2(i*31+k,seed)-.5)*40;y+=(h2(i*17+k,seed+4)-.3)*34;g.lineTo(x,y);}g.stroke();}
  for(let i=0;i<10;i++){const x=h2(i,seed+20)*w,y=h2(i,seed+21)*h*.6,l=150+h2(i,seed+22)*500;const gr=g.createLinearGradient(0,y,0,y+l);gr.addColorStop(0,'rgba(60,45,25,.18)');gr.addColorStop(1,'rgba(60,45,25,0)');g.fillStyle=gr;g.fillRect(x,y,8+h2(i,seed+23)*30,l);}
  return c;}
function woodTex(w,h,base,seed,vertical){const c=darkTex(w,h,base,seed,12),g=c.getContext('2d');const pw=vertical?150:170;
  for(let p=0;p*pw<(vertical?w:h);p++){const sh=(h2(p,seed)-.5)*.14;g.fillStyle=sh>0?`rgba(255,220,170,${sh*.5})`:`rgba(0,0,0,${-sh})`;
    if(vertical)g.fillRect(p*pw,0,pw,h);else g.fillRect(0,p*pw,w,pw);
    g.strokeStyle='rgba(0,0,0,.55)';g.lineWidth=4;g.beginPath();if(vertical){g.moveTo(p*pw,0);g.lineTo(p*pw,h);}else{g.moveTo(0,p*pw);g.lineTo(w,p*pw);}g.stroke();
    for(let k=0;k<16;k++){g.strokeStyle=`rgba(0,0,0,${.06+h2(k,p+seed)*.1})`;g.lineWidth=1+h2(k,p)*1.5;g.beginPath();const o=p*pw+h2(k,p+seed+1)*pw;const ph=h2(k,p+2)*6;
      for(let s=0;s<=(vertical?h:w);s+=20){const q=o+Math.sin(s*.006+ph)*6+Math.sin(s*.021+ph*2)*2;vertical?g.lineTo(q,s):g.lineTo(s,q);}g.stroke();}
    for(let n=0;n<2;n++){const a=h2(p,seed+30+n)*(vertical?h:w);g.fillStyle='rgba(0,0,0,.5)';g.beginPath();vertical?g.arc(p*pw+14+n*(pw-28),a,4,0,7):g.arc(a,p*pw+14+n*(pw-28),4,0,7);g.fill();}}
  return c;}
let ROOM2,WALL3,FLOOR2,TABLE2,RWALL,CONC;
const _buildCity=buildCity;
buildCity=function(){_buildCity();
  ROOM2=plaster(W,H,'#1a1816',31,'rgba(0,0,0,.35)');WALL3=plaster(W,H,'#3a332b',41,'rgba(10,8,6,.55)');
  FLOOR2=woodTex(W,H,'#2a2018',51,true);TABLE2=woodTex(W,H,'#2b1d12',61,false);RWALL=plaster(W,H,'#141515',71,'rgba(0,0,0,.4)');
  CONC=darkTex(W,H,'#55625f',81,26);
  // richer city tops
  CITY.forEach((layer,li)=>layer.forEach(b=>{b.push(Math.floor(h1(b[0]*3+li)*5));}));
};

// ---------- S2 cidade ----------
S2=function(){
  const p=eio(lin(T,4,14));
  const g=X.createLinearGradient(0,0,0,1500);g.addColorStop(0,'#05080b');g.addColorStop(.7,'#132026');g.addColorStop(1,'#22343a');X.fillStyle=g;X.fillRect(0,0,W,H);
  for(let i=0;i<420;i++){const x=h2(i,1)*W,y=h2(i,2)*1250,r=.6+h2(i,3)*1.9,tw=.5+.5*Math.sin(RT*(1+h2(i,4)*3)+i);X.fillStyle=`rgba(233,223,200,${.2+.65*tw*h2(i,5)})`;X.fillRect(x,y,r,r);}
  // milky band
  X.save();X.translate(540,500);X.rotate(-.5);const mb=X.createLinearGradient(0,-120,0,120);mb.addColorStop(0,'rgba(200,210,220,0)');mb.addColorStop(.5,'rgba(200,210,220,.05)');mb.addColorStop(1,'rgba(200,210,220,0)');X.fillStyle=mb;X.fillRect(-1200,-120,2400,240);X.restore();
  const mx=760,my=410;glow(mx,my,320,'rgba(233,223,200,A)',.2);
  X.fillStyle='#e6dcc4';X.beginPath();X.arc(mx,my,60,0,7);X.fill();
  X.fillStyle='rgba(140,130,110,.28)';[[-18,-12,15],[22,16,10],[8,-26,7],[-24,20,8],[26,-8,6]].forEach(([a,b,r])=>{X.beginPath();X.arc(mx+a,my+b,r,0,7);X.fill();});
  // clouds drifting over moon
  for(let i=0;i<4;i++){const cx=((RT*8+i*400)%1600)-300,cy=360+i*70;X.fillStyle='rgba(20,30,36,.55)';X.beginPath();X.ellipse(cx,cy,260,22,0,0,7);X.ellipse(cx+120,cy-14,180,18,0,0,7);X.fill();}
  const cols=['#1d2d34','#0f191d','#060a0b'],ks=[.03,.07,.14],gy=1600;
  CITY.forEach((layer,li)=>{X.save();const s=1+ks[li]*p;X.translate(540,1000);X.scale(s,s);X.translate(-540,-1000);
    layer.forEach(([x,w,h,tank,kind])=>{const top=gy-h;X.fillStyle=cols[li];
      if(kind===1){X.fillRect(x,top+40,w,h+400);X.fillRect(x+w*.15,top,w*.7,44);}           // stepped
      else if(kind===2){X.fillRect(x,top,w,h+400);X.beginPath();X.moveTo(x,top);X.lineTo(x+w/2,top-50);X.lineTo(x+w,top);X.fill();}
      else X.fillRect(x,top,w,h+400);
      if(li>0){X.fillRect(x+w*.62,top-90,3,90);X.fillRect(x+w*.62-14,top-70,31,2);X.fillRect(x+w*.62-9,top-52,21,2);}
      if(tank||kind===3){const tx=x+w*.18,tw=w*.34;X.fillRect(tx,top-56,tw,56);X.beginPath();X.ellipse(tx+tw/2,top-56,tw/2,7,0,0,7);X.fill();X.fillRect(tx+4,top-8,3,10);X.fillRect(tx+tw-7,top-8,3,10);}
      if(li==1){X.fillStyle='rgba(150,175,180,.08)';for(let wy=top+26;wy<gy-10;wy+=32)for(let wx=x+10;wx<x+w-12;wx+=24)if(h2(wx,wy)>.3)X.fillRect(wx,wy,11,15);
        X.fillStyle='rgba(225,215,190,.07)';X.fillRect(x,top,3,h);const rg=X.createLinearGradient(x,0,x+w,0);rg.addColorStop(0,'rgba(200,210,200,.07)');rg.addColorStop(.35,'rgba(0,0,0,0)');X.fillStyle=rg;X.fillRect(x,top,w,h);}
      if(li==2){X.fillStyle='rgba(225,215,190,.05)';for(let wy=top+40;wy<gy;wy+=60)X.fillRect(x+10,wy,w-20,4);}
    });
    if(li==0){const fg=X.createLinearGradient(0,1250,0,1620);fg.addColorStop(0,'rgba(40,58,64,0)');fg.addColorStop(1,'rgba(40,58,64,.75)');X.fillStyle=fg;X.fillRect(-300,1250,1700,380);
      smoke(250,1330,700,.25,.8,1);smoke(860,1380,600,.18,.6,2);}
    X.restore();});
  // foreground: pole, power lines, balcony railing
  const fx=p*-40;X.save();X.translate(fx,0);
  X.fillStyle='#030505';X.fillRect(70,620,22,1400);X.fillRect(20,660,130,10);X.fillRect(36,700,96,8);
  catenary(30,665,1300,560,140,'#030505',3);catenary(140,665,1300,600,180,'#030505',2.5);catenary(80,705,1300,680,120,'#030505',2);
  // birds sitting on the first wire
  const wy=x=>{const u=(x-30)/1270;return mix(665,560,u)+140*4*u*(1-u);};
  [[400,1,0],[452,-1,1.7],[540,1,3.1]].forEach(([bx,dir,ph])=>{const y=wy(bx)-1,turn=Math.sin(RT*.7+ph)>.6?-1:1,bob=Math.abs(Math.sin(RT*2+ph))*1.2;
    X.save();X.translate(bx,y-bob);X.scale(dir,1);X.fillStyle='#030505';X.strokeStyle='#030505';X.lineWidth=2;
    X.beginPath();X.moveTo(-2,0);X.lineTo(-4,-9);X.moveTo(4,0);X.lineTo(3,-9);X.stroke();          // legs
    X.beginPath();X.ellipse(0,-18,15,10,-.25,0,7);X.fill();                                        // body
    X.beginPath();X.moveTo(-12,-14);X.lineTo(-30,-6);X.lineTo(-27,-2);X.lineTo(-10,-10);X.fill();   // tail
    X.beginPath();X.arc(11,-30,7.5,0,7);X.fill();                                                  // head
    X.beginPath();X.moveTo(17*1,-31);X.lineTo(17+7*turn,-29);X.lineTo(17,-27);X.fill();            // beak
    X.restore();});
  X.restore();
  X.fillStyle='#020303';X.fillRect(0,1700,W,30);for(let x=-20;x<W+40;x+=68){X.fillRect(x-p*20,1700,10,260);}X.fillRect(0,1860,W,60);
  vignette(.8);
};

// ---------- S3 quarto + garrafa ----------
S3=function(){
  X.drawImage(ROOM2,0,0);
  const wx=140,wy=240,ww=440,wh=720;
  const sky=X.createLinearGradient(0,wy,0,wy+wh);sky.addColorStop(0,'#0b1418');sky.addColorStop(1,'#3d5257');X.fillStyle=sky;X.fillRect(wx,wy,ww,wh);
  X.fillStyle='#0c1316';for(let i=0;i<9;i++){const bx=wx+i*52,bh=120+h2(i,90)*240;X.fillRect(bx,wy+wh-bh,46,bh);}
  X.fillStyle='rgba(233,223,200,.8)';X.beginPath();X.arc(wx+330,wy+150,26,0,7);X.fill();glow(wx+330,wy+150,120,'rgba(233,223,200,A)',.15);
  // shaft of moonlight to floor
  X.save();X.globalCompositeOperation='lighter';const sh=X.createLinearGradient(wx,wy,wx+700,1700);sh.addColorStop(0,'rgba(120,150,155,.16)');sh.addColorStop(1,'rgba(120,150,155,0)');
  X.fillStyle=sh;X.beginPath();X.moveTo(wx,wy);X.lineTo(wx+ww,wy);X.lineTo(wx+ww+520,1650);X.lineTo(wx+300,1720);X.closePath();X.fill();X.restore();
  // window frame + cracked pane
  X.fillStyle='#0b0a09';X.fillRect(wx+ww/2-8,wy,16,wh);X.fillRect(wx,wy+wh*.45,ww,16);X.lineWidth=24;X.strokeStyle='#0b0a09';X.strokeRect(wx,wy,ww,wh);
  ink(X,[[wx+40,wy+60],[wx+90,wy+120],[wx+80,wy+190],[wx+150,wy+230]],{c:'rgba(200,215,210,.45)',w:2,seed:701});ink(X,[[wx+90,wy+120],[wx+170,wy+110]],{c:'rgba(200,215,210,.35)',w:2,seed:702});
  // tape X on glass
  X.strokeStyle='rgba(200,190,160,.25)';X.lineWidth=14;X.beginPath();X.moveTo(wx+250,wy+420);X.lineTo(wx+420,wy+600);X.moveTo(wx+420,wy+420);X.lineTo(wx+250,wy+600);X.stroke();
  // curtain torn, swaying
  const sw=Math.sin(RT*.9)*14;X.fillStyle='#24201c';X.beginPath();X.moveTo(wx+ww-30,wy-30);X.lineTo(wx+ww+120,wy-30);X.quadraticCurveTo(wx+ww+140+sw,wy+400,wx+ww+90+sw*1.6,wy+760);
  X.lineTo(wx+ww+60+sw*1.6,wy+700);X.lineTo(wx+ww+30+sw*1.4,wy+780);X.quadraticCurveTo(wx+ww+10+sw,wy+400,wx+ww-30,wy-30);X.fill();
  hatch(X,()=>{X.rect(wx+ww-30,wy-30,200,820);},1.3,16,'rgba(0,0,0,.35)',2,705);
  // floor & furniture
  X.fillStyle='#0f0d0b';X.fillRect(0,1560,W,400);for(let i=0;i<8;i++){X.strokeStyle='rgba(0,0,0,.6)';X.lineWidth=3;X.beginPath();X.moveTo(i*170-100,1920);X.lineTo(540+(i*170-640)*.35,1560);X.stroke();}
  X.fillStyle='#0a0908';X.fillRect(0,1555,W,10);
  // chair with orange jacket (right)
  X.fillStyle='#0b0a09';X.fillRect(830,1120,18,470);X.fillRect(1010,1120,18,470);X.fillRect(820,1340,230,22);X.fillRect(830,1120,200,18);
  X.fillStyle='#6e3a1c';X.beginPath();X.moveTo(840,1130);X.quadraticCurveTo(930,1100,1020,1135);X.lineTo(1040,1420);X.quadraticCurveTo(940,1450,850,1400);X.closePath();X.fill();
  hatch(X,()=>{X.moveTo(840,1130);X.quadraticCurveTo(930,1100,1020,1135);X.lineTo(1040,1420);X.quadraticCurveTo(940,1450,850,1400);X.closePath();},2.2,12,'rgba(0,0,0,.4)',2,707);
  X.fillStyle='rgba(220,200,150,.5)';X.fillRect(905,1230,60,8);X.fillRect(905,1250,60,8); // reflective stripes
  // empty bottles on floor
  [[300,1640,.0],[360,1660,.3],[420,1700,1.57],[250,1710,-1.4]].forEach(([bx,by,a],i)=>{X.save();X.translate(bx,by);X.rotate(a);X.scale(.32,.32);const bp=bottlePts();fillPts(X,bp,'rgba(150,170,170,.12)');ink(X,bp,{w:7,c:'#8fa09c',seed:720+i,close:true,a:.7});X.restore();});
  // held bottle + hand
  const rot=mix(2.5,Math.PI,eio(lin(T,14,14.9)))+Math.sin(RT*3)*.015;
  X.save();X.translate(400,700);X.rotate(rot);
  const bp=bottlePts();fillPts(X,bp,'rgba(150,170,170,.12)');ink(X,bp,{w:5,c:'#c9d6d2',seed:3,close:true,amp:1.6});
  ink(X,seg([-90,-60],[90,-60],12),{w:3,c:'#9fb0ad',seed:4,a:.7});ink(X,seg([-90,150],[90,150],12),{w:3,c:'#9fb0ad',seed:5,a:.7});
  X.fillStyle='rgba(200,215,210,.18)';X.fillRect(-60,-50,26,190);
  // hand gripping the base (bottle inverted -> base on top)
  X.fillStyle='#120f0d';X.beginPath();X.ellipse(0,250,120,62,0,0,7);X.fill();
  for(let f=0;f<4;f++){X.beginPath();X.ellipse(-70+f*46,196,22,42,0,0,7);X.fill();}
  X.strokeStyle='rgba(200,170,130,.35)';X.lineWidth=3;for(let f=0;f<4;f++){X.beginPath();X.ellipse(-70+f*46,196,22,42,0,Math.PI*1.1,Math.PI*1.9);X.stroke();}
  X.fillRect(-60,250,120,400);
  X.restore();
  const mouthX=400+Math.sin(rot)*250,mouthY=700-Math.cos(rot)*250;
  if(T>15.1){const grow=lin(T,15.1,15.8),fall=lin(T,15.8,16.6);const r=4+grow*12;const y=mouthY+12+fall*fall*900;
    X.fillStyle='#d8e4e0';X.beginPath();X.ellipse(mouthX,y+r,r*.8,r*(1+fall*.4),0,0,7);X.fill();glow(mouthX,y+r,30,'rgba(220,235,230,A)',.25);}
  motes(wx,wy,wx+ww+500,1650,110,9,(x,y)=>{const t=(y-wy)/(1650-wy);const l=wx+t*300,r=wx+ww+t*520;return x>l&&x<r?.9*(1-t*.7):0;});
  vignette(.85);
};

// ---------- S4 parede ----------
S4=function(){
  X.drawImage(WALL3,0,0);
  const s=mix(1,1.12,eio(lin(T,17,20)));X.save();X.translate(700,1150);X.scale(s,s);X.translate(-700,-1150);
  // candle light
  const f=flicker(1.6);glow(880,1640,1150*f,'rgba(224,138,46,A)',.30);
  // peeling paint patches
  [[120,420,160,90],[860,980,120,160],[300,1500,210,70]].forEach(([x,y,w,h],i)=>{X.fillStyle='rgba(20,15,10,.45)';X.beginPath();for(let k=0;k<14;k++){const a=k/14*6.283;X.lineTo(x+Math.cos(a)*w*(.7+.3*h2(k,i)),y+Math.sin(a)*h*(.7+.3*h2(k,i+5)));}X.fill();
    ink(X,ell(x,y,w*.85,h*.85,18),{c:'rgba(220,205,170,.25)',w:2,seed:740+i});});
  // taped photo (two people) — semente do Caio
  X.save();X.translate(780,330);X.rotate(.08);X.fillStyle='#d9d0bc';X.fillRect(-120,-150,240,290);X.fillStyle='#2a2f2e';X.fillRect(-100,-130,200,200);
  const pg=X.createLinearGradient(0,-130,0,70);pg.addColorStop(0,'#55605c');pg.addColorStop(1,'#232826');X.fillStyle=pg;X.fillRect(-100,-130,200,200);
  X.save();X.beginPath();X.rect(-100,-130,200,200);X.clip();
  const sk=X.createLinearGradient(0,-130,0,70);sk.addColorStop(0,'#8a8e80');sk.addColorStop(.55,'#b3a98c');sk.addColorStop(.56,'#6d6a58');sk.addColorStop(1,'#4a4638');X.fillStyle=sk;X.fillRect(-100,-130,200,200);
  X.fillStyle='rgba(60,58,48,.55)';X.fillRect(-100,-40,200,3);
  const person=(cx,base,sc,longHair,col)=>{X.fillStyle=col;
    if(longHair){X.beginPath();X.ellipse(cx,base-88*sc,27*sc,38*sc,0,0,7);X.fill();X.beginPath();X.moveTo(cx-30*sc,base-95*sc);X.quadraticCurveTo(cx-38*sc,base-40*sc,cx-26*sc,base-28*sc);X.lineTo(cx+26*sc,base-28*sc);X.quadraticCurveTo(cx+38*sc,base-40*sc,cx+30*sc,base-95*sc);X.fill();}
    X.beginPath();X.moveTo(cx-72*sc,base+40);X.quadraticCurveTo(cx-70*sc,base-30*sc,cx-40*sc,base-38*sc);X.quadraticCurveTo(cx-14*sc,base-44*sc,cx-11*sc,base-56*sc);
    X.lineTo(cx+11*sc,base-56*sc);X.quadraticCurveTo(cx+14*sc,base-44*sc,cx+40*sc,base-38*sc);X.quadraticCurveTo(cx+70*sc,base-30*sc,cx+72*sc,base+40);X.closePath();X.fill();
    X.beginPath();X.ellipse(cx,base-84*sc,22*sc,29*sc,0,0,7);X.fill();
    X.beginPath();X.ellipse(cx-22*sc,base-82*sc,4*sc,7*sc,0,0,7);X.ellipse(cx+22*sc,base-82*sc,4*sc,7*sc,0,0,7);X.fill();
    if(!longHair){X.beginPath();X.ellipse(cx,base-103*sc,23*sc,13*sc,0,Math.PI,0);X.fill();}
    const fl=X.createRadialGradient(cx-8*sc,base-90*sc,2,cx,base-84*sc,30*sc);fl.addColorStop(0,'rgba(200,180,150,.35)');fl.addColorStop(1,'rgba(200,180,150,0)');X.fillStyle=fl;X.beginPath();X.ellipse(cx,base-84*sc,22*sc,29*sc,0,0,7);X.fill();};
  person(36,74,0.86,false,'#262420');            // Caio, taller, behind-right
  person(-30,80,0.76,true,'#1d1b18');            // Iara
  X.fillStyle='#262420';X.beginPath();X.moveTo(8,48);X.quadraticCurveTo(-24,32,-62,44);X.lineTo(-63,54);X.quadraticCurveTo(-24,44,10,58);X.fill(); // arm around her
  const pv=X.createRadialGradient(0,-30,40,0,-30,170);pv.addColorStop(0,'rgba(0,0,0,0)');pv.addColorStop(1,'rgba(30,20,10,.55)');X.fillStyle=pv;X.fillRect(-100,-130,200,200);
  X.strokeStyle='rgba(235,225,200,.35)';X.lineWidth=1.5;X.beginPath();X.moveTo(-90,-110);X.lineTo(60,60);X.stroke();
  X.restore();
  X.font='30px Hand';X.fillStyle='#3a332b';X.fillText('I. + C.',-48,115);
  X.fillStyle='rgba(230,220,190,.55)';X.save();X.rotate(-.5);X.fillRect(-60,-190,90,34);X.restore();X.save();X.rotate(.4);X.fillRect(40,-150,90,34);X.restore();
  X.restore();
  // tally marks scratched (groove + highlight)
  let n=0;const rows=[[0,1,2],[3,4,5],[6,7,8]];
  rows.forEach((r,ri)=>r.forEach((gi,ci)=>{const gx=180+ci*260,gy=640+ri*260;
    const cnt=gi<8?5:1;for(let k=0;k<cnt;k++){n++;const last=n===41;const pr=last?lin(T,18.5,19.2):1;
      const pts=k<4?seg([gx+k*40,gy],[gx+k*40+4,gy+170],6):seg([gx-20,gy+150],[gx+150,gy+30],8);
      ink(X,pts,{w:9,c:'rgba(18,14,10,.85)',seed:n,p:pr,amp:2.4});ink(X,pts.map(q=>[q[0]+2,q[1]+2]),{w:3,c:'#e2d6bb',seed:n,p:pr,amp:2.4});}}));
  // nail + string
  X.fillStyle='#111';X.beginPath();X.arc(520,250,7,0,7);X.fill();
  // candle
  X.fillStyle='#16110d';X.beginPath();X.ellipse(880,1760,90,20,0,0,7);X.fill();
  X.fillStyle='#d8ccb0';X.fillRect(852,1620,56,140);X.beginPath();X.ellipse(880,1620,28,7,0,0,7);X.fill();
  X.fillStyle='#b9ab8c';X.beginPath();X.moveTo(852,1640);X.quadraticCurveTo(846,1690,856,1700);X.lineTo(860,1640);X.fill();
  X.fillStyle='#222';X.fillRect(878,1596,4,24);
  const fl=noise1(RT*7,9)*5;X.fillStyle='rgba(255,210,120,.95)';X.beginPath();X.moveTo(872,1600);X.quadraticCurveTo(880+fl,1540,888,1600);X.quadraticCurveTo(880,1610,872,1600);X.fill();
  glow(880,1580,60,'rgba(255,200,120,A)',.6);
  X.restore();vignette(.85);
};

// ---------- S5 chão: objetos + caderno ----------
function shadowEl(x,y,rx,ry,a=.55){X.fillStyle=`rgba(0,0,0,${a})`;X.beginPath();X.ellipse(x,y,rx,ry,0,0,7);X.fill();}
S5=function(){
  X.drawImage(FLOOR2,0,0);
  const S='#e0d4ba',F='#1b1815';
  // static clutter
  X.save();X.translate(830,1180);X.rotate(.6);ink(X,ell(0,0,26,26,16),{c:'#a99b7c',w:5,seed:801});ink(X,poly([[10,10],[70,70],[60,80],[52,72],[46,80]],3),{c:'#a99b7c',w:5,seed:802});X.restore();
  X.save();X.translate(200,1250);X.rotate(-.2);X.fillStyle='rgba(210,200,170,.85)';X.fillRect(-90,-60,180,120);hatch(X,()=>X.rect(-90,-60,180,120),.7,14,'rgba(60,70,60,.35)',2,803);ink(X,seg([0,-60],[0,60],4),{c:'rgba(60,50,40,.5)',w:2,seed:804});X.restore();
  X.fillStyle='rgba(180,150,90,.8)';X.beginPath();X.arc(640,1700,14,0,7);X.fill();
  const draw=(t0,x,y,a,fn,sh)=>{const d=itemDrop(t0);if(!d)return;shadowEl(x+18,y+26,sh[0],sh[1]);X.save();X.translate(x,y);X.rotate(a+d.r);X.scale(d.s,d.s);fn();X.restore();};
  const dim=T>22.6?1-.55*lin(T,22.6,23.4):1;X.globalAlpha=dim;
  // flashlight ON casting cone
  if(T>20.4){X.save();X.globalCompositeOperation='lighter';X.translate(250,560);X.rotate(-.5);const cg=X.createLinearGradient(0,175,0,1100);cg.addColorStop(0,'rgba(255,235,190,.32)');cg.addColorStop(1,'rgba(255,235,190,0)');
    X.fillStyle=cg;X.beginPath();X.moveTo(-55,175);X.lineTo(55,175);X.lineTo(330,1100);X.lineTo(-330,1100);X.closePath();X.fill();X.restore();X.globalAlpha=dim;}
  draw(20.4,250,560,-.5,()=>{const b=poly([[-40,-150],[40,-150],[40,90],[-40,90]],5,true);ink(X,b,{fill:F,c:S,w:5,seed:11,close:true});
    for(let i=0;i<9;i++)ink(X,seg([-40,-130+i*14],[40,-130+i*14],3),{c:'rgba(224,212,186,.45)',w:2,seed:810+i});
    const hd=poly([[-62,90],[62,90],[50,175],[-50,175]],4,true);ink(X,hd,{fill:F,c:S,w:5,seed:12,close:true});ink(X,ell(0,175,50,10,20),{c:S,w:3,seed:13,fill:'rgba(255,240,200,.9)'});
    X.fillStyle=C.laranja;X.fillRect(-18,-40,36,40);},[60,150]);
  draw(21.0,830,540,.35,()=>{const b=poly([[-34,-90],[34,-90],[34,90],[-34,90]],5,true);ink(X,b,{fill:F,c:S,w:5,seed:21,close:true});
    X.fillStyle='#8a2f22';X.fillRect(-32,-20,64,70);ink(X,poly([[-12,-90],[-12,-108],[12,-108],[12,-90]],2),{c:S,w:4,seed:22});X.fillStyle=S;X.font='600 30px Oswald';X.textAlign='center';X.fillText('AA',0,26);X.textAlign='left';},[50,100]);
  draw(21.6,560,1460,.2,()=>{X.fillStyle=F;X.beginPath();X.ellipse(0,0,190,170,0,0,7);X.fill();
    const hg=X.createRadialGradient(-60,-60,10,0,0,190);hg.addColorStop(0,'rgba(240,225,195,.35)');hg.addColorStop(1,'rgba(0,0,0,0)');X.fillStyle=hg;X.beginPath();X.ellipse(0,0,190,170,0,0,7);X.fill();
    ink(X,ell(0,0,190,170,40),{c:S,w:6,seed:31});ink(X,ell(0,40,150,90,30,0,Math.PI),{c:S,w:4,seed:32});
    X.fillStyle='rgba(40,50,55,.9)';X.beginPath();X.ellipse(0,60,140,70,0,0,Math.PI);X.fill();
    X.fillStyle=C.laranja;X.fillRect(-170,-20,40,40);X.fillRect(130,-20,40,40);
    [[-60,-130,10,-100],[20,-150,90,-110],[-120,-90,-70,-70],[40,-60,110,-40]].forEach(([a,b,c,d],i)=>ink(X,seg([a,b],[c,d],5),{c:S,w:2,seed:33+i,a:.75}));},[200,170]);
  X.globalAlpha=1;
  if(T>22.6){const u=eo(lin(T,22.6,23.6));const y=mix(1700,960,u),s=mix(.8,1.12,eio(lin(T,23.6,27)));
    X.save();X.translate(540,y);X.scale(s,s);X.rotate(mix(.18,-.03,u));
    X.fillStyle='rgba(0,0,0,.55)';X.fillRect(-240,-320,520,700);
    const open=eio(lin(T,25.7,26.7));
    if(open>0){X.drawImage(PAGE,120,140,760,1020,-260,-350,520,700);}
    const cw=520*(1-open);
    if(cw>4){const cover=poly([[-260,-350],[-260+cw,-350+open*20],[-260+cw,350-open*20],[-260,350]],8,true);
      ink(X,cover,{fill:'#0f0e0d',c:'#5e584e',w:4,seed:41,close:true,amp:3});
      X.save();X.beginPath();X.rect(-260,-350,cw,700);X.clip();
      const rg=X.createRadialGradient(-80,-60,10,-80,-60,240);rg.addColorStop(0,'rgba(120,110,90,.18)');rg.addColorStop(.7,'rgba(120,110,90,.06)');rg.addColorStop(.72,'rgba(140,125,95,.22)');rg.addColorStop(.76,'rgba(0,0,0,0)');X.fillStyle=rg;X.fillRect(-260,-350,520,700);
      hatch(X,()=>X.rect(-260,-350,cw,700),.9,9,'rgba(255,255,255,.035)',1.5,811);
      [[-260,-350],[260,-350],[-260,350],[260,350]].forEach(([cx,cy])=>{X.fillStyle='rgba(150,140,120,.35)';X.beginPath();X.arc(cx,cy,26,0,7);X.fill();});
      X.fillStyle='rgba(225,215,190,.75)';X.fillRect(-150,-210,220,70);X.fillStyle='rgba(60,50,40,.6)';X.fillRect(-130,-185,170,3);X.fillRect(-130,-165,120,3);
      X.restore();
      if(open<.3)ink(X,seg([-260+cw*.86,-352],[-260+cw*.86,352],12),{c:'#2a2622',w:12,seed:42});}
    X.restore();}
  vignette(.8);
};

// ---------- S13 canal ----------
S13=function(){
  const p=lin(T,52,57),sx=mix(30,-30,p);
  const g=X.createLinearGradient(0,0,0,960);g.addColorStop(0,'#1b2c33');g.addColorStop(.75,'#7d9592');g.addColorStop(1,'#c7b48e');X.fillStyle=g;X.fillRect(0,0,W,H);
  glow(860,900,520,'rgba(235,190,120,A)',.35);
  // urubus
  for(let i=0;i<4;i++){const a=RT*.4+i*1.6,bx=620+Math.cos(a)*(120+i*30),by=360+Math.sin(a)*40+i*30,f=Math.sin(RT*3+i)*6;X.strokeStyle='#1a2226';X.lineWidth=4;X.beginPath();X.moveTo(bx-22,by-f);X.quadraticCurveTo(bx,by+6,bx+22,by-f);X.stroke();}
  X.save();X.translate(sx*.3,0);X.fillStyle='#4b5d5f';for(let i=0;i<34;i++){const x=-100+i*40,h=40+h2(i,77)*170;X.fillRect(x,930-h,36,h);if(h2(i,78)>.6){X.fillRect(x+6,930-h-30,14,30);}}
  smoke(300,880,420,.3,.5,7);X.restore();
  // viaduct
  X.save();X.translate(sx*.55,0);X.fillStyle='#2f3a3b';X.fillRect(-200,790,1500,46);X.fillStyle='#263031';X.fillRect(-200,836,1500,14);
  for(let i=0;i<7;i++){X.fillStyle='#283233';X.fillRect(-80+i*230,850,34,80);}
  X.fillStyle='#1d2526';[[120,760,90],[300,768,70],[700,764,110],[880,770,60]].forEach(([x,y,w])=>{X.beginPath();X.moveTo(x,y+26);X.lineTo(x+8,y+6);X.lineTo(x+w*.3,y);X.lineTo(x+w*.75,y);X.lineTo(x+w,y+12);X.lineTo(x+w,y+26);X.fill();});
  X.strokeStyle='#1d2526';X.lineWidth=3;X.beginPath();X.moveTo(-200,782);X.lineTo(1300,782);X.stroke();for(let x=-200;x<1300;x+=26){X.fillRect(x,782,3,10);}
  X.restore();
  X.save();X.translate(sx,0);const vx=540,vy=930;
  // walls with texture
  X.save();X.beginPath();X.moveTo(-300,H);X.lineTo(vx-30,vy);X.lineTo(vx-10,vy+4);X.lineTo(150,H);X.closePath();X.moveTo(1380,H);X.lineTo(vx+30,vy);X.lineTo(vx+10,vy+4);X.lineTo(930,H);X.closePath();X.clip();
  X.drawImage(CONC,0,0);X.fillStyle='rgba(20,26,25,.45)';X.fillRect(0,0,W,H);
  for(let i=1;i<14;i++){const q=Math.pow(i/14,2),y=mix(vy,H,q);X.strokeStyle='rgba(15,20,19,.55)';X.lineWidth=1+q*3;X.beginPath();X.moveTo(-300,y);X.lineTo(1400,y);X.stroke();}
  // graffiti tags
  [[60,1500,C.ciano],[860,1460,C.laranja],[980,1700,'#7a6aa0'],[180,1760,'#a3321f']].forEach(([x,y,col],i)=>{X.strokeStyle=col;X.globalAlpha=.45;X.lineWidth=7;X.beginPath();
    for(let k=0;k<9;k++){X.lineTo(x+k*22+(h2(k,i+90)-.5)*20,y+Math.sin(k*1.7+i)*34);}X.stroke();X.globalAlpha=1;});
  // moss/stains bottom
  const ms=X.createLinearGradient(0,1500,0,H);ms.addColorStop(0,'rgba(40,55,30,0)');ms.addColorStop(1,'rgba(40,55,30,.45)');X.fillStyle=ms;X.fillRect(0,1500,W,420);
  X.restore();
  // top slopes
  X.fillStyle='#5e6a63';X.beginPath();X.moveTo(-300,H);X.lineTo(vx-30,vy);X.lineTo(-300,vy);X.fill();X.beginPath();X.moveTo(1380,H);X.lineTo(vx+30,vy);X.lineTo(1380,vy);X.fill();
  // grass tufts on banks
  for(let i=0;i<40;i++){const q=Math.pow(h2(i,91),1.4),side=i%2?1:-1;const x=side<0?mix(vx-40,-300,q)+40*q:mix(vx+40,1380,q)-40*q,y=mix(vy,H,q)-mix(2,30,q);const hgt=mix(6,60,q);
    X.strokeStyle='#26331f';X.lineWidth=mix(1,4,q);for(let b=0;b<5;b++){X.beginPath();X.moveTo(x+b*4*side*-1,y+hgt*.2);X.quadraticCurveTo(x+b*5+Math.sin(RT*1.4+i+b)*4,y-hgt*.5,x+b*7+Math.sin(RT*1.4+i+b)*8,y-hgt);X.stroke();}}
  // water
  const wg=X.createLinearGradient(0,vy,0,H);wg.addColorStop(0,'#a59c80');wg.addColorStop(.2,'#655a42');wg.addColorStop(1,'#382f20');X.fillStyle=wg;X.beginPath();X.moveTo(150,H);X.lineTo(vx-10,vy+4);X.lineTo(vx+10,vy+4);X.lineTo(930,H);X.fill();
  X.save();X.beginPath();X.moveTo(150,H);X.lineTo(vx-10,vy+4);X.lineTo(vx+10,vy+4);X.lineTo(930,H);X.clip();
  const rf=X.createLinearGradient(400,0,700,0);rf.addColorStop(0,'rgba(220,200,150,0)');rf.addColorStop(.5,'rgba(220,200,150,.18)');rf.addColorStop(1,'rgba(220,200,150,0)');X.fillStyle=rf;X.fillRect(0,vy,W,H-vy);
  for(let i=0;i<34;i++){const ph=((RT*.16+i/34)%1),q=ph*ph,y=mix(vy+8,H,q),hw=mix(8,380,q),ox=(h2(i,5)-.5)*hw;X.strokeStyle=`rgba(225,215,180,${.1+.25*q})`;X.lineWidth=1+q*3;X.beginPath();X.moveTo(vx+ox-hw*.15,y);X.lineTo(vx+ox+hw*.15,y);X.stroke();}
  // floating trash
  [[640,1300,.0],[560,1100,.5],[760,1620,1.1]].forEach(([x,y,a],i)=>{const b=Math.sin(RT*1.2+i)*4;X.save();X.translate(x,y+b);X.rotate(a);X.fillStyle=['#c8c2b0','#2a2f2c','#8a3a2a'][i];X.fillRect(-14-i*4,-6,28+i*8,12);X.restore();});
  X.restore();
  // tire + cart on far bank slope
  X.strokeStyle='#121514';X.lineWidth=16;X.beginPath();X.ellipse(860,1560,58,40,.2,0,7);X.stroke();
  X.save();X.translate(980,1380);X.rotate(.35);X.strokeStyle='#1a1f1d';X.lineWidth=5;X.strokeRect(-70,-50,140,90);for(let k=1;k<6;k++){X.beginPath();X.moveTo(-70+k*23,-50);X.lineTo(-70+k*23,40);X.stroke();}
  X.beginPath();X.moveTo(-70,-50);X.lineTo(-100,-80);X.stroke();X.beginPath();X.arc(-50,60,10,0,7);X.arc(50,60,10,0,7);X.stroke();X.restore();
  // mist
  for(let i=0;i<5;i++){const mxp=((RT*12+i*260)%1500)-250;const mg=X.createRadialGradient(mxp,980+i*40,0,mxp,980+i*40,320);mg.addColorStop(0,'rgba(200,205,195,.16)');mg.addColorStop(1,'rgba(200,205,195,0)');X.fillStyle=mg;X.fillRect(mxp-320,660+i*40,640,640);}
  // Iara (crouched, hood, backpack) filling bottle
  const SC='#0e1210';X.save();X.translate(300,1470);X.scale(1.45,1.45);X.fillStyle=SC;
  X.beginPath();X.moveTo(-70,0);X.quadraticCurveTo(-82,-70,-52,-112);X.quadraticCurveTo(-78,-150,-42,-178);X.quadraticCurveTo(0,-196,8,-142);X.quadraticCurveTo(32,-122,42,-82);X.lineTo(62,-40);X.quadraticCurveTo(72,-10,56,0);X.closePath();X.fill();
  X.beginPath();X.moveTo(-6,-176);X.quadraticCurveTo(30,-196,44,-160);X.quadraticCurveTo(46,-130,22,-124);X.quadraticCurveTo(0,-140,-6,-176);X.fill();
  X.fillStyle=C.laranja;X.globalAlpha=.7;X.beginPath();X.moveTo(-8,-128);X.quadraticCurveTo(28,-112,36,-78);X.lineTo(52,-42);X.lineTo(4,-40);X.quadraticCurveTo(-14,-80,-8,-128);X.fill();X.globalAlpha=1;
  X.fillStyle='rgba(230,215,170,.6)';X.fillRect(10,-70,30,4);
  X.fillStyle='#1c201b';X.beginPath();X.moveTo(-50,-115);X.quadraticCurveTo(-100,-104,-90,-36);X.lineTo(-52,-26);X.closePath();X.fill();X.strokeStyle='rgba(200,190,150,.35)';X.lineWidth=2;X.beginPath();X.moveTo(-86,-80);X.lineTo(-56,-82);X.stroke();
  const bob=Math.sin(RT*2.2)*3;X.strokeStyle=SC;X.lineWidth=11;X.lineCap='round';X.beginPath();X.moveTo(20,-95);X.quadraticCurveTo(55,-60,66,-22+bob);X.stroke();
  X.save();X.translate(70,-8+bob);X.rotate(.9);X.fillStyle='#2a3532';X.fillRect(-9,-24,18,48);X.strokeStyle='rgba(220,225,215,.55)';X.lineWidth=2;X.strokeRect(-9,-24,18,48);X.restore();
  X.fillStyle='#2a3532';X.fillRect(-100,-36,16,36);X.fillRect(-122,-30,14,30);X.strokeStyle='rgba(200,210,200,.4)';X.strokeRect(-100,-36,16,36);
  X.restore();
  const rr=(RT*30)%60;X.strokeStyle=`rgba(225,215,185,${.45*(1-rr/60)})`;X.lineWidth=2;X.beginPath();X.ellipse(405,1462,rr,rr*.25,0,0,7);X.stroke();
  X.restore();vignette(.6);
};

// ---------- mesa: fogareiro, frasco, vela ----------
stove=function(x,y,s,shake){X.save();X.translate(x,y);X.scale(s,s);X.rotate(shake);
  const R='#eab06a',F='#1c140e';
  const body=poly([[-130,-60],[130,-60],[130,120],[-130,120]],6,true);ink(X,body,{fill:F,c:R,w:5,seed:201,close:true});
  const cg=X.createLinearGradient(-130,0,130,0);cg.addColorStop(0,'rgba(0,0,0,.6)');cg.addColorStop(.3,'rgba(235,170,100,.18)');cg.addColorStop(.5,'rgba(0,0,0,0)');cg.addColorStop(1,'rgba(0,0,0,.6)');X.fillStyle=cg;X.fillRect(-130,-60,260,180);
  X.fillStyle='#7a2a1e';X.fillRect(-130,-10,260,64);X.fillStyle='#e8dcc0';X.font='600 34px Oswald';X.textAlign='center';X.fillText('GÁS',0,28);X.font='18px Mono';X.fillText('BUTANO 227 g',0,48);X.textAlign='left';
  ink(X,ell(0,-60,130,26,30),{fill:'#24190f',c:R,w:4,seed:202});ink(X,ell(0,120,130,26,30,0,Math.PI),{c:R,w:4,seed:203});
  for(let i=0;i<6;i++)ink(X,seg([-120+i*45,-46],[-110+i*45,-30],2),{c:'rgba(234,176,106,.4)',w:2,seed:230+i});
  ink(X,poly([[-30,-70],[-30,-140],[30,-140],[30,-70]],3),{fill:F,c:R,w:4,seed:204});
  ink(X,ell(70,-100,20,20,14),{fill:'#2a1d12',c:R,w:4,seed:209});for(let k=0;k<6;k++){const a=k/6*6.28;ink(X,seg([70+Math.cos(a)*12,-100+Math.sin(a)*12],[70+Math.cos(a)*20,-100+Math.sin(a)*20],1),{c:R,w:2,seed:240+k});}
  ink(X,ell(0,-150,90,18,26),{fill:'#24190f',c:R,w:4,seed:205});ink(X,ell(0,-152,40,8,18),{c:R,w:3,seed:206});
  for(let i=0;i<4;i++){const a=i*Math.PI/2+.4;ink(X,seg([Math.cos(a)*50,-150+Math.sin(a)*10],[Math.cos(a)*120,-160+Math.sin(a)*24],3),{c:R,w:5,seed:206+i});}
  X.restore();};
frasco=function(x,y,s){X.save();X.translate(x,y);X.scale(s,s);const R='#eab06a';
  ink(X,poly([[-30,-230],[30,-230],[30,-190],[80,-150],[90,-110],[90,200],[-90,200],[-90,-110],[-80,-150],[-30,-190]],5,true),{fill:'#d6d0c3',c:R,w:5,seed:221,close:true});
  ink(X,poly([[-34,-262],[34,-262],[34,-228],[-34,-228]],3,true),{fill:'#6b5a8a',c:R,w:4,seed:222,close:true});for(let k=0;k<6;k++){X.fillStyle='rgba(0,0,0,.3)';X.fillRect(-30+k*11,-258,4,28);}
  X.fillStyle='#8a78ab';X.fillRect(-82,-60,164,170);X.fillStyle='#2a2140';X.fillRect(-82,40,164,28);
  X.fillStyle='#f4efe6';X.font='600 30px Oswald';X.textAlign='center';X.fillText('ALVEJANTE',0,-10);X.font='22px Inter';X.fillText('lavanda',0,22);X.font='600 16px Inter';X.fillText('FRAGRÂNCIA',0,60);X.textAlign='left';
  const sh=X.createLinearGradient(-90,0,90,0);sh.addColorStop(0,'rgba(0,0,0,.5)');sh.addColorStop(.25,'rgba(255,240,210,.18)');sh.addColorStop(.45,'rgba(0,0,0,0)');sh.addColorStop(1,'rgba(0,0,0,.6)');X.fillStyle=sh;X.fillRect(-90,-150,180,350);
  X.fillStyle='rgba(120,110,90,.35)';X.beginPath();X.ellipse(30,170,30,10,0,0,7);X.fill();
  X.restore();};
function candle(x,y,s=1){X.save();X.translate(x,y);X.scale(s,s);
  X.fillStyle='#17110c';X.beginPath();X.ellipse(0,150,95,24,0,0,7);X.fill();X.fillStyle='#3a2c20';X.beginPath();X.ellipse(0,140,85,20,0,0,7);X.fill();
  X.fillStyle='#ddd1b4';X.fillRect(-28,0,56,140);X.beginPath();X.ellipse(0,0,28,8,0,0,7);X.fill();
  X.fillStyle='#c8bb9b';X.beginPath();X.moveTo(-28,10);X.quadraticCurveTo(-36,70,-24,90);X.lineTo(-20,12);X.fill();X.beginPath();X.ellipse(-8,140,46,10,0,0,7);X.fill();
  X.fillStyle='#222';X.fillRect(-2,-24,4,24);const fl=noise1(RT*7,9)*5;X.fillStyle='rgba(255,215,130,.97)';X.beginPath();X.moveTo(-8,-20);X.quadraticCurveTo(fl,-90,8,-20);X.quadraticCurveTo(0,-10,-8,-20);X.fill();
  X.fillStyle='rgba(120,180,255,.5)';X.beginPath();X.ellipse(0,-22,4,6,0,0,7);X.fill();X.restore();}
function tableProps(){
  // map under, closed notebook, cans, matches
  X.save();X.translate(170,820);X.rotate(-.12);X.fillStyle='rgba(205,195,160,.8)';X.fillRect(-160,-110,320,220);hatch(X,()=>X.rect(-160,-110,320,220),.4,22,'rgba(70,90,80,.3)',2,901);
  ink(X,[[-140,40],[-60,-10],[20,30],[120,-60]],{c:'rgba(163,50,31,.6)',w:4,seed:902});X.restore();
  X.save();X.translate(200,1500);X.rotate(.15);X.fillStyle='#0f0e0d';X.fillRect(-150,-110,300,220);X.strokeStyle='#4a453e';X.lineWidth=3;X.strokeRect(-150,-110,300,220);X.fillStyle='#2a2622';X.fillRect(100,-110,12,220);X.restore();
  [[930,1520],[1000,1470]].forEach(([x,y],i)=>{X.fillStyle='#2a2420';X.fillRect(x-36,y-80,72,100);X.fillStyle='rgba(234,176,106,.35)';X.fillRect(x-36,y-80,10,100);X.beginPath();X.fillStyle='#3b332c';X.ellipse(x,y-80,36,9,0,0,7);X.fill();});
  X.save();X.translate(820,1660);X.rotate(-.3);X.fillStyle='#6b2a1c';X.fillRect(-60,-30,120,60);X.fillStyle='#d8cdb2';X.fillRect(-50,-20,100,40);X.fillStyle='#6b2a1c';X.font='600 18px Oswald';X.textAlign='center';X.fillText('FÓSFOROS',0,8);X.textAlign='left';X.restore();
  for(let i=0;i<3;i++){X.save();X.translate(700+i*20,1720+i*6);X.rotate(.5+i*.3);X.fillStyle='#c9b48a';X.fillRect(-30,-2,60,4);X.fillStyle='#222';X.fillRect(26,-4,8,8);X.restore();}
}
S14=function(){
  X.drawImage(TABLE2,0,0);const f=flicker(1.4);glow(880,520,1300*f,'rgba(224,138,46,A)',.30);
  const sh=T>57.6&&T<59.1?Math.sin(T*38)*.07*Math.sin(lin(T,57.6,59.1)*Math.PI):0;
  const z=mix(1.25,1.35,lin(T,57,60));shadowEl(470,1330,260*z/1.3,40);stove(540,1150+Math.abs(sh)*-120,z,sh);
  candle(900,420,.9);vignette(.8);
};
S16=function(){
  X.drawImage(TABLE2,0,0);const f=flicker(1.4);glow(560,560,1250*f,'rgba(224,138,46,A)',.32);
  const z=mix(1,1.07,eio(lin(T,61,65)));X.save();X.translate(540,1150);X.scale(z,z);X.translate(-540,-1150);
  tableProps();
  X.fillStyle='rgba(0,0,0,.45)';X.beginPath();X.ellipse(300,1300,200,36,-.08,0,7);X.ellipse(800,1310,130,30,.1,0,7);X.fill();
  stove(330,1150,.95,0);frasco(780,1080,1.0);candle(560,560,1.1);
  X.restore();vignette(.85);
};

// ---------- rádio ----------
radio=function(){
  X.drawImage(RWALL,0,0);
  // moonlit window far left
  X.fillStyle='#1b2a2e';X.fillRect(-40,220,240,560);X.fillStyle='#070808';X.fillRect(70,220,12,560);X.fillRect(-40,480,240,12);
  X.save();X.globalCompositeOperation='lighter';const sh=X.createLinearGradient(0,300,600,1300);sh.addColorStop(0,'rgba(90,130,140,.12)');sh.addColorStop(1,'rgba(90,130,140,0)');X.fillStyle=sh;X.beginPath();X.moveTo(-40,220);X.lineTo(200,220);X.lineTo(700,1240);X.lineTo(200,1240);X.fill();X.restore();
  const f=flicker(.6);glow(700,980,780,'rgba(224,138,46,A)',.2*f);
  // nightstand
  const tg=X.createLinearGradient(0,1240,0,1920);tg.addColorStop(0,'#2b1e14');tg.addColorStop(1,'#0c0907');X.fillStyle=tg;X.fillRect(0,1240,W,680);
  X.fillStyle='#3a2a1c';X.fillRect(0,1232,W,16);for(let i=0;i<10;i++){X.strokeStyle='rgba(0,0,0,.3)';X.lineWidth=1.5;X.beginPath();X.moveTo(0,1270+i*28);X.bezierCurveTo(300,1262+i*28,700,1282+i*28,W,1268+i*28);X.stroke();}
  // props: glass, candle stub with smoke, notebook
  X.save();X.globalAlpha=.85;X.strokeStyle='rgba(200,215,210,.55)';X.lineWidth=3;X.beginPath();X.moveTo(70,1080);X.lineTo(84,1232);X.lineTo(146,1232);X.lineTo(160,1080);X.stroke();X.beginPath();X.ellipse(115,1080,45,9,0,0,7);X.stroke();X.restore();
  X.fillStyle='#cfc3a5';X.fillRect(940,1170,44,62);X.fillStyle='#111';X.fillRect(960,1158,3,12);
  for(let i=0;i<14;i++){const u=i/14;const px=962+Math.sin(u*9+RT*1.2)*14*u,py=1158-u*360;X.fillStyle=`rgba(170,170,165,${.12*(1-u)})`;X.beginPath();X.arc(px,py,4+u*10,0,7);X.fill();}
  X.save();X.translate(980,1290);X.rotate(-.08);X.fillStyle='#0f0e0d';X.fillRect(-120,-40,240,70);X.restore();
  // radio body
  const R='#c88a46';
  X.fillStyle='rgba(0,0,0,.5)';X.beginPath();X.ellipse(560,1248,400,26,0,0,7);X.fill();
  X.save();const bx=180,by=900,bw=720,bh=340;X.beginPath();X.roundRect(bx,by,bw,bh,26);X.fillStyle='#3a2414';X.fill();X.clip();
  for(let k=0;k<20;k++){X.strokeStyle=`rgba(0,0,0,${.12+h2(k,77)*.15})`;X.lineWidth=2;X.beginPath();for(let x=bx;x<=bx+bw;x+=20)X.lineTo(x,by+k*18+Math.sin(x*.01+k)*4);X.stroke();}
  const hl=X.createLinearGradient(0,by,0,by+bh);hl.addColorStop(0,'rgba(255,200,140,.18)');hl.addColorStop(.15,'rgba(0,0,0,0)');hl.addColorStop(1,'rgba(0,0,0,.45)');X.fillStyle=hl;X.fillRect(bx,by,bw,bh);
  X.restore();
  X.strokeStyle=R;X.lineWidth=4;X.beginPath();X.roundRect(180,900,720,340,26);X.stroke();
  // handle
  X.strokeStyle='#1a120c';X.lineWidth=18;X.beginPath();X.moveTo(330,900);X.quadraticCurveTo(540,800,750,900);X.stroke();X.strokeStyle='rgba(200,140,80,.4)';X.lineWidth=3;X.beginPath();X.moveTo(340,890);X.quadraticCurveTo(540,795,740,890);X.stroke();
  // speaker cloth
  X.save();X.beginPath();X.roundRect(220,945,300,250,14);X.fillStyle='#2a2119';X.fill();X.clip();
  for(let i=0;i<60;i++){X.strokeStyle='rgba(0,0,0,.35)';X.lineWidth=2;X.beginPath();X.moveTo(220+i*6,945);X.lineTo(220+i*6,1195);X.stroke();X.beginPath();X.moveTo(220,945+i*6);X.lineTo(520,945+i*6);X.stroke();}
  X.strokeStyle='rgba(200,140,80,.25)';X.lineWidth=5;for(let i=0;i<4;i++){X.beginPath();X.moveTo(220,980+i*60);X.lineTo(520,980+i*60);X.stroke();}
  X.restore();X.strokeStyle=R;X.lineWidth=3;X.beginPath();X.roundRect(220,945,300,250,14);X.stroke();
  // dial window
  const dg=X.createLinearGradient(560,960,860,960);dg.addColorStop(0,`rgba(240,160,70,${.75*f})`);dg.addColorStop(1,`rgba(224,138,46,${.5*f})`);X.fillStyle=dg;X.fillRect(560,960,290,120);
  glow(705,1020,260,'rgba(240,160,70,A)',.25*f);
  X.strokeStyle='rgba(30,20,10,.85)';X.lineWidth=2;for(let i=0;i<=20;i++){const x=570+i*13.5;X.beginPath();X.moveTo(x,962);X.lineTo(x,i%5?985:1000);X.stroke();}
  X.font='20px Mono';X.fillStyle='rgba(30,20,10,.9)';['55','70','90','120','160'].forEach((s,i)=>X.fillText(s,566+i*67,1040));X.font='14px Mono';X.fillText('AM  kHz x10',575,1068);
  X.strokeStyle='#5a3a1e';X.lineWidth=6;X.strokeRect(557,957,296,126);
  let nx=700+noise1(T*5,9)*3;if(T>77.8)nx=mix(700,742,eo(lin(T,77.8,77.95)))+noise1(RT*12,9)*6;
  X.strokeStyle='#d33';X.lineWidth=4;X.beginPath();X.moveTo(nx,962);X.lineTo(nx,1078);X.stroke();
  // knobs
  [[640,1170],[800,1170]].forEach(([kx,ky],i)=>{X.fillStyle='#1a120c';X.beginPath();X.arc(kx,ky,38,0,7);X.fill();X.strokeStyle=R;X.lineWidth=3;X.beginPath();X.arc(kx,ky,38,0,7);X.stroke();
    for(let k=0;k<16;k++){const a=k/16*6.283;X.beginPath();X.moveTo(kx+Math.cos(a)*30,ky+Math.sin(a)*30);X.lineTo(kx+Math.cos(a)*37,ky+Math.sin(a)*37);X.stroke();}
    X.fillStyle='#e8dcc0';X.beginPath();X.arc(kx+Math.cos(-1+i)*20,ky+Math.sin(-1+i)*20,4,0,7);X.fill();});
  X.font='600 18px Oswald';X.fillStyle='rgba(200,140,80,.8)';X.fillText('SINTONIA',600,1225);X.fillText('VOLUME',768,1225);
  // telescopic antenna
  X.strokeStyle='#9a8a70';[[820,900,790,760,5],[790,760,760,620,4],[760,620,735,500,3]].forEach(([a,b,c,d,w])=>{X.lineWidth=w;X.beginPath();X.moveTo(a,b);X.lineTo(c,d);X.stroke();});
  X.fillStyle='#9a8a70';X.beginPath();X.arc(735,500,6,0,7);X.fill();
};
if(window.READY){buildCity();}
