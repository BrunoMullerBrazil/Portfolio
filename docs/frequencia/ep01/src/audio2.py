import numpy as np, wave, json
SR=48000; E=json.load(open('edl.json')); DUR=E[-1][1]; N=int(SR*DUR)
rng=np.random.default_rng(5); L=np.zeros(N); R=np.zeros(N)
TT='/tmp/claude-0/-home-user-Portfolio/20f5f2d0-4756-5090-975f-c4a98ccee7b2/scratchpad/tts/'
def readwav(p):
    w=wave.open(p); d=np.frombuffer(w.readframes(w.getnframes()),dtype=np.int16).astype(float)/32768
    return d.reshape(-1,w.getnchannels()), w.getframerate()
def band(x,lo,hi):
    X=np.fft.rfft(x); f=np.fft.rfftfreq(len(x),1/SR); m=np.ones_like(f)
    if lo: m*=1/(1+(lo/np.maximum(f,1e-3))**4)
    if hi: m*=1/(1+(f/hi)**4)
    return np.fft.irfft(X*m,len(x))
def norm(x): return x/(np.abs(x).max()+1e-9)
def env(n,a=.01,r=.05):
    e=np.ones(n); ai=min(n,int(a*SR)); ri=min(n,int(r*SR)); e[:ai]=np.linspace(0,1,ai) if ai else e[:0]
    if ri: e[-ri:]=np.minimum(e[-ri:],np.linspace(1,0,ri))
    return e
def add(sig,t,g=1.0,pan=0.0):
    if sig.ndim==2: l,r=sig[:,0],sig[:,1]
    else: l=r=sig
    i=int(t*SR); j=min(N,i+len(l));
    if j<=i: return
    L[i:j]+=l[:j-i]*g*(1-max(0,pan)); R[i:j]+=r[:j-i]*g*(1+min(0,pan))
def inv(o):
    for s in E:
        if s[2]=='flat' or s[3]-s[2]<0.05: continue
        if s[2]<=o<=s[3]: return s[0]+(o-s[2])/(s[3]-s[2])*(s[1]-s[0]), (s[1]-s[0])/(s[3]-s[2])
    return None,1
# --- cold open & title from old mix
old,sr=readwav('mix.wav'); 
co=old[:int(4.0*sr)].copy(); co[-int(.3*sr):]*=np.linspace(1,0,int(.3*sr))[:,None]; add(co,0,.9)
ti=old[int(82.5*sr):int(88*sr)].copy(); add(ti,127.6,.9)
# --- narration (pre-loudnorm mix) at 4.0
nar,_=readwav(TT+'narracao_raw.wav'); add(nar,4.0,1.0)
# --- foley generators
def click(g=.5):
    n=int(.012*SR); return band(rng.standard_normal(n),1800,7000)*np.exp(-np.linspace(0,8,n))*g
def plink(f=1400,d=.35,g=.4):
    n=int(d*SR); tt=np.arange(n)/SR; fr=f*(1+.6*np.exp(-tt*30)); return np.sin(2*np.pi*np.cumsum(fr)/SR)*np.exp(-tt*14)*g
def thump(g=.6):
    n=int(.35*SR); tt=np.arange(n)/SR
    return (np.sin(2*np.pi*70*tt*(1+np.exp(-tt*20)))*np.exp(-tt*12)+band(rng.standard_normal(n),200,2500)*np.exp(-tt*40)*.5)*g
def scratch(d,g=.12,lo=2200,hi=7500):
    n=max(int(d*SR),200); x=band(rng.standard_normal(n),lo,hi); stroke=np.abs(np.sin(2*np.pi*np.cumsum(rng.uniform(5,11,n))/SR))**.6
    return norm(x)*stroke*env(n,.03,.06)*g
def swish(d,g=.25):
    n=int(d*SR); return norm(band(rng.standard_normal(n),300,5000))*np.sin(np.linspace(0,np.pi,n))**2*g
def creak(d=.9,g=.3):
    n=int(d*SR); tt=np.arange(n)/SR; f=90+40*np.sin(2*np.pi*1.3*tt)
    return band(np.sign(np.sin(2*np.pi*np.cumsum(f)/SR))*rng.uniform(.6,1,n),200,1600)*np.sin(np.linspace(0,np.pi,n))*g
def metal(g=.35):
    n=int(.28*SR); tt=np.arange(n)/SR
    return (np.sin(2*np.pi*880*tt)+.6*np.sin(2*np.pi*1310*tt)+.4*np.sin(2*np.pi*2070*tt))*np.exp(-tt*18)*g*.4+band(rng.standard_normal(n),600,3000)*np.exp(-tt*30)*g
def tick(g=.25):
    n=int(.03*SR); return band(rng.standard_normal(n),3000,9000)*np.exp(-np.linspace(0,10,n))*g
def ev(o,sig,g=1,pan=0):
    t,_=inv(o)
    if t is not None: add(sig,t,g,pan)
def evd(a,b,fn,g=1):  # duration event, stretched
    t,k=inv(a)
    if t is not None: add(fn((b-a)*k),t,g)
FG=.8
evd(18.5,19.2,lambda d:scratch(d,.22,1200,5000),FG)
for t in (20.4,21.0,21.6): ev(t,thump(.45),FG,(t-21)/2)
ev(22.6,swish(1.0,.22),FG)
Wr=[(27.3,30.4,.16),(30.5,30.8,.2),(30.82,31.1,.2),(33.3,34.1,.12),(33.6,34.6,.08),(35.5,36.0,.08),(35.9,36.9,.08),(36.1,37.7,.11),
 (38.8,39.6,.12),(38.9,39.6,.08),(39.3,39.9,.08),(40.6,42.3,.11),(43.5,44.0,.12),(43.7,44.8,.08),(45.2,45.9,.08),(45.5,47.6,.11),
 (47.8,49.2,.11),(49.7,50.5,.16),(50.55,50.85,.2),(50.9,51.2,.2),(65.6,66.5,.14),(66.6,67.9,.11),(68.0,69.2,.11),(69.3,70.2,.09)]
for a,b,g in Wr: evd(a,b,lambda d,g=g:scratch(d,g*.7),FG)
ev(31.6,creak(1.1,.25),FG,-.3)
for k in range(60): ev(39.45+k*3.5/60+rng.uniform(0,.05),plink(rng.uniform(250,600),.08,.07),FG)
for k in range(13): ev(40.2+k*(2.4/12),tick(.2),FG)
ev(45.55,plink(1300,.4,.3),FG); ev(46.35,plink(1250,.4,.3),FG)
evd(46.0,49.3,lambda d:norm(band(rng.standard_normal(int(d*SR)),3000,9000))*.03*env(int(d*SR),.3,.3),FG)
evd(52.0,57.0,lambda d:norm(band(rng.standard_normal(int(d*SR)),150,2200))*.08*env(int(d*SR),.5,.5),FG)
for k in range(9): ev(57.65+k*.16,metal(.2),FG,.1*(-1)**k)
ev(60.0,swish(.25,.2),FG)
for k in range(14): ev(70.2+k/22,click(.25),FG)
for k in range(16): ev(70.9+k/30,click(.2),FG)
ev(77.8,click(.6)*2,FG)
L[int(127.6*SR)-int(.05*SR):int(127.6*SR)]*=0  # keep title start clean
m=max(abs(L).max(),abs(R).max()); st=(np.stack([L,R],1)*.89/m*32767).astype(np.int16)
w=wave.open('mix2.wav','wb'); w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes(st.tobytes()); w.close(); print('ok',DUR)
