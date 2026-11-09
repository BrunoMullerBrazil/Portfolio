import numpy as np, wave, sys, os
SR=48000; DUR=88.0; N=int(SR*DUR)
rng=np.random.default_rng(41)
L=np.zeros(N); R=np.zeros(N)
TTS=sys.argv[1]; OUT=sys.argv[2]

def t2i(t): return int(t*SR)
def readwav(p):
    w=wave.open(p); d=np.frombuffer(w.readframes(w.getnframes()),dtype=np.int16).astype(float)/32768
    if w.getnchannels()==2: d=d.reshape(-1,2).mean(1)
    return d
def band(x,lo,hi):
    X=np.fft.rfft(x); f=np.fft.rfftfreq(len(x),1/SR)
    m=np.ones_like(f)
    if lo: m*=1/(1+(lo/np.maximum(f,1e-3))**4)
    if hi: m*=1/(1+(f/hi)**4)
    return np.fft.irfft(X*m,len(x))
def env(n,a=.01,r=.05):
    e=np.ones(n); ai=min(n,int(a*SR)); ri=min(n,int(r*SR))
    if ai: e[:ai]=np.linspace(0,1,ai)
    if ri: e[-ri:]=np.minimum(e[-ri:],np.linspace(1,0,ri))
    return e
def add(sig,t,g=1.0,pan=0.0):
    i=t2i(t); j=min(N,i+len(sig)); s=sig[:j-i]*g
    L[i:j]+=s*(1-max(0,pan)); R[i:j]+=s*(1+min(0,pan))
def noise(d): return rng.standard_normal(int(d*SR))
def norm(x): return x/(np.abs(x).max()+1e-9)
def ramp(d,pts):  # pts [(t,v)]
    tt=np.arange(int(d*SR))/SR; return np.interp(tt,[p[0] for p in pts],[p[1] for p in pts])

# ---- beds ----
def static(d,lvl,crackle=1.0,seed=0):
    x=norm(band(noise(d),400,4200))*.6
    r=np.random.default_rng(seed); n=int(d*SR)
    pops=np.zeros(n); idx=r.integers(0,n,int(d*35*crackle)); pops[idx]=r.uniform(-1,1,len(idx))
    pops=band(pops,1500,None)*3
    flutter=1+.35*np.sin(2*np.pi*np.cumsum(r.uniform(.5,6,n))/SR)
    return (x*flutter+pops)*lvl
def wind(d,lvl):
    x=norm(band(noise(d),60,520)); n=len(x); tt=np.arange(n)/SR
    m=.55+.45*np.sin(2*np.pi*.13*tt)*np.sin(2*np.pi*.047*tt+1)
    return x*m*lvl
def roomtone(d,lvl): return norm(band(noise(d),40,300))*lvl

add(static(4.0,.10,1,1)*env(int(4*SR),.05,.3),0)
add(wind(10.2,.12)*env(int(10.2*SR),.6,.3),3.9,pan=.1); add(wind(10.2,.12)*env(int(10.2*SR),.6,.3),3.9,g=.8,pan=-.1)
add(roomtone(10,.05)*env(int(10*SR),.2,.2),14)
add(roomtone(25,.035)*env(int(25*SR),.3,.4),27)
w=norm(band(noise(5.2),150,2200)); add(w*.10*env(len(w),.4,.4),52,pan=.2)   # water flowing
add(wind(5.2,.08)*env(int(5.2*SR),.4,.4),52,pan=-.2)
add(roomtone(3,.05),57); add(roomtone(4,.05),61)
add(roomtone(8,.03)*env(int(8*SR),.3,.3),65)
add(static(4.5,.05,.6,2)*env(int(4.5*SR),.3,.2),73)
st=static(5.2,.11,2.5,3); st*=ramp(5.2,[(0,.5),(.6,1),(4.8,1.3),(5.2,.0)]); add(st,77.3)

# ---- foley ----
def click(g=.5):
    n=int(.012*SR); return band(rng.standard_normal(n),1800,7000)*np.exp(-np.linspace(0,8,n))*g
def plink(f=1400,d=.35,g=.4):
    n=int(d*SR); tt=np.arange(n)/SR; fr=f*(1+.6*np.exp(-tt*30))
    return np.sin(2*np.pi*np.cumsum(fr)/SR)*np.exp(-tt*14)*g
def thump(g=.6):
    n=int(.35*SR); tt=np.arange(n)/SR
    return (np.sin(2*np.pi*70*tt*(1+np.exp(-tt*20)))*np.exp(-tt*12)+band(rng.standard_normal(n),200,2500)*np.exp(-tt*40)*.5)*g
def scratch(d,g=.12,lo=2200,hi=7500):
    n=int(d*SR); x=band(rng.standard_normal(n),lo,hi)
    stroke=np.abs(np.sin(2*np.pi*np.cumsum(rng.uniform(5,11,n))/SR))**.6
    return norm(x)*stroke*env(n,.03,.06)*g
def swish(d,g=.25):
    n=int(d*SR); x=band(rng.standard_normal(n),300,5000); return norm(x)*np.sin(np.linspace(0,np.pi,n))**2*g
def crinkle(d,g=.25):
    n=int(d*SR); x=np.zeros(n); idx=rng.integers(0,n,int(d*90)); x[idx]=rng.uniform(-1,1,len(idx))
    return band(x,1200,9000)*6*env(n,.02,.1)*g
def creak(d=.9,g=.3):
    n=int(d*SR); tt=np.arange(n)/SR; f=90+40*np.sin(2*np.pi*1.3*tt)
    s=np.sign(np.sin(2*np.pi*np.cumsum(f)/SR))*(rng.uniform(.6,1,n))
    return band(s,200,1600)*np.sin(np.linspace(0,np.pi,n))*g
def metal(g=.35):
    n=int(.28*SR); tt=np.arange(n)/SR
    return (np.sin(2*np.pi*880*tt)+.6*np.sin(2*np.pi*1310*tt)+.4*np.sin(2*np.pi*2070*tt))*np.exp(-tt*18)*g*.4+band(rng.standard_normal(n),600,3000)*np.exp(-tt*30)*g
def tick(g=.25):
    n=int(.03*SR); return band(rng.standard_normal(n),3000,9000)*np.exp(-np.linspace(0,10,n))*g

for k in range(6): add(click(.35),2.0+k/7)                      # DIA 41 typing
add(crinkle(.9,.18),14.0)                                        # bottle turn
add(plink(1500,.5,.35),16.45)                                    # drop
add(scratch(.7,.22,1200,5000),18.5)                              # last tally mark
for t in (20.4,21.0,21.6): add(thump(.45),t,pan=(t-21)/2)        # items fall
add(swish(1.0,.22),22.6); add(swish(1.0,.18),25.7)               # notebook pulled / opened
# write-on scratches (mirror of the HTML timings)
W=[(27.3,30.4,.16),(30.5,30.8,.2),(30.82,31.1,.2),(33.3,34.1,.12),(33.6,34.6,.08),(35.5,36.0,.08),(35.9,36.9,.08),(36.1,37.7,.11),
   (38.8,39.6,.12),(38.9,39.6,.08),(39.3,39.9,.08),(40.6,42.3,.11),(43.5,44.0,.12),(43.7,44.8,.08),(45.2,45.9,.08),(45.5,47.6,.11),
   (47.8,49.2,.11),(49.7,50.5,.16),(50.55,50.85,.2),(50.9,51.2,.2),
   (65.6,66.5,.14),(66.6,67.9,.11),(68.0,69.2,.11),(69.3,70.2,.09)]
for a,b,g in W: add(scratch(b-a,g),a)
add(creak(1.1,.25),31.6,pan=-.3)
add(thump(.25)*.5,31.25)
# bubbles 39.4-43
for k in range(70):
    t=39.4+rng.uniform(0,3.5); add(plink(rng.uniform(250,600),.08,.08),t)
add(norm(band(noise(3.6),80,700))*.05*env(int(3.6*SR),.3,.3),39.4)   # boil rumble
for k in range(13): add(tick(.22),40.2+k*(2.4/12))                # clock
add(plink(1300,.4,.35),45.55); add(plink(1250,.4,.35),46.35)      # drops into bottle
sand=norm(band(noise(3.3),3000,9000))*.03*env(int(3.3*SR),.3,.3); add(sand,46.0)
for k in range(9): add(metal(.22),57.65+k*.16,pan=.1*(-1)**k)    # gas shake
add(swish(.25,.2),60.0)                                          # hard cut accent
for k in range(30): add(click(.3),70.2+k/22) if k<14 else None   # CTA typing
for k in range(16): add(click(.22),70.9+k/30)
add(click(.6)*2,77.8); add(plink(400,.15,.15),77.82)             # needle jump

# ---- voices ----
def V(f): return readwav(os.path.join(TTS,f))
add(V('r_op1.wav'),0.3,g=.9)
add(V('r_op2.wav'),73.8,g=.75)
add(V('r_f1.wav'),78.25,g=1.0)
add(V('r_f2.wav'),79.6,g=1.0)

# ---- drone: 3 notes, crescendo, hard cut at 82.5 ----
def drone(f,d):
    n=int(d*SR); tt=np.arange(n)/SR
    s=sum(np.sin(2*np.pi*f*k*tt+k)/k for k in range(1,7))+.3*np.sin(2*np.pi*f*.5*tt)
    return band(s,30,900)
d=drone(55,4.5); d*=ramp(4.5,[(0,0),(1,.25),(4.5,.6)]); add(d*.35,78.0)
d=drone(65.4,3.0); d*=ramp(3.0,[(0,0),(.5,.3),(3.0,.75)]); add(d*.3,79.5)
d=drone(49,1.5); d*=ramp(1.5,[(0,0),(.3,.5),(1.5,1)]); add(d*.32,81.0)
cut=t2i(82.5); L[cut:t2i(83.0)]=0; R[cut:t2i(83.0)]=0
# title: faint static tail + low hit
add(static(2.4,.025,.5,9)*env(int(2.4*SR),.4,1.0),83.0)
hit=drone(41,2.5)*np.exp(-np.linspace(0,4,int(2.5*SR))); add(hit*.25,83.0)
L[t2i(87.6):]*=np.linspace(1,0,N-t2i(87.6)); R[t2i(87.6):]*=np.linspace(1,0,N-t2i(87.6))

m=max(np.abs(L).max(),np.abs(R).max()); L*=.89/m; R*=.89/m
st=np.stack([L,R],1); st=(st*32767).astype(np.int16)
w=wave.open(OUT,'wb'); w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes(st.tobytes()); w.close()
print('ok',OUT)
