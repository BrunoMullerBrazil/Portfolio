import json, subprocess, numpy as np, soundfile as sf
d=json.load(open('cues.json')); SR=48000
FX={'I':"highpass=f=80,acompressor=threshold=0.12:ratio=3:attack=8:release=120,aecho=0.8:0.25:35|60:0.12|0.07,volume=1.0",
    'C':"rubberband=pitch=0.93:formant=preserved,highpass=f=120,lowpass=f=5200,acompressor=threshold=0.1:ratio=4,aecho=0.8:0.4:45|90:0.18|0.1,volume=0.85",
    'O':"highpass=f=330,lowpass=f=2900,acompressor=threshold=0.1:ratio=6,volume=2.0,alimiter=limit=0.9",
    'F':"highpass=f=300,lowpass=f=3600,acompressor=threshold=0.1:ratio=5,volume=2.2,aecho=0.8:0.4:120:0.15,alimiter=limit=0.9"}
TOT=d['cues'][-1][2]+d['cues'][-1][3]+2.5; N=int(TOT*SR); L=np.zeros(N); R=np.zeros(N)
rng=np.random.default_rng(7)
def band(x,lo,hi):
    X=np.fft.rfft(x); f=np.fft.rfftfreq(len(x),1/SR); m=np.ones_like(f)
    if lo: m*=1/(1+(lo/np.maximum(f,1e-3))**4)
    if hi: m*=1/(1+(f/hi)**4)
    return np.fft.irfft(X*m,len(x))
def nz(d): return rng.standard_normal(int(d*SR))
def norm(x): return x/(np.abs(x).max()+1e-9)
def add(s,t,g=1,pan=0):
    i=int(t*SR); j=min(N,i+len(s)); L[i:j]+=s[:j-i]*g*(1-max(0,pan)); R[i:j]+=s[:j-i]*g*(1+min(0,pan))
def fade(n,a,r):
    e=np.ones(n); a=int(a*SR); r=int(r*SR); e[:a]=np.linspace(0,1,a); e[-r:]=np.minimum(e[-r:],np.linspace(1,0,r)); return e
cue={c[0]:c for c in d['cues']}
for i,tp,t,dur,tx in d['cues']:
    subprocess.run(['ffmpeg','-y','-v','error','-i',f'seg_{i:02d}_{tp}.wav','-af',FX[tp]+',aresample=48000','-ac','1',f'p_{i:02d}.wav'],check=True)
    a,_=sf.read(f'p_{i:02d}.wav'); tgt={'I':-20,'C':-22,'O':-23,'F':-21}[tp]; r=np.sqrt((a[np.abs(a)>0.01*np.abs(a).max()]**2).mean()); a=a*(10**(tgt/20)/r); a=np.tanh(a*1.2)/1.2; add(a,t+0.3,g=1.0)
# beds
room=norm(band(nz(TOT),40,300))*.035; L+=room; R+=room*.9
w=norm(band(nz(TOT),60,500))*np.interp(np.arange(N)/SR,[0,8,60,TOT],[0,.05,.03,.02]); L+=w; R+=w[::-1]*.8
def find(txt): return next(c for c in d['cues'] if c[4].startswith(txt))
# foley
def plink(f=1400,dd=.45,g=.35):
    n=int(dd*SR); tt=np.arange(n)/SR; fr=f*(1+.6*np.exp(-tt*30)); return np.sin(2*np.pi*np.cumsum(fr)/SR)*np.exp(-tt*14)*g
c=find('Viro a garrafa'); add(plink(),c[2]+c[3]+0.15)
c=find('Eu abro.'); s=norm(band(nz(.7),300,5000))*np.sin(np.linspace(0,np.pi,int(.7*SR)))**2*.12; add(s,c[2]+0.05)
c=find('Se você está'); s=norm(band(nz(c[3]+.6),2000,7000))*np.abs(np.sin(np.cumsum(rng.uniform(5,10,int((c[3]+.6)*SR)))*2*np.pi/SR))**.6*.025; add(s,c[2]+.3)
# radio section: click + static from operator to end of tape
o=find('Sete. Dois'); f2=find('Você esqueceu'); a0=o[2]+0.1; a1=f2[2]+f2[3]+0.35
n=int((a1-a0)*SR); st=norm(band(nz(a1-a0),400,4200))*.05*fade(n,.05,.02)
pops=np.zeros(n); idx=rng.integers(0,n,int((a1-a0)*40)); pops[idx]=rng.uniform(-1,1,len(idx)); st+=band(pops,1500,None)*1.2
mud=find('Aí a estática'); k=int((mud[2]+0.3-a0)*SR); st[k:]*=1.5
add(st,a0); add(band(nz(.02),1500,7000)*np.exp(-np.linspace(0,8,int(.02*SR)))*.6,a0-0.05)
# drone under tape, hard cut after "não foi?"
def drone(f,dd):
    tt=np.arange(int(dd*SR))/SR; return band(sum(np.sin(2*np.pi*f*h*tt+h)/h for h in range(1,7)),30,900)
f1=find('Iara.'); d0=f1[2]; dd=a1-d0
x=drone(55,dd)*np.interp(np.arange(int(dd*SR))/SR,[0,dd],[.05,.5]); add(x,d0,.25)
x=drone(65.4,dd-1.2)*np.interp(np.arange(int((dd-1.2)*SR))/SR,[0,dd-1.2],[0,.6]); add(x,d0+1.2,.3)
cut=int(a1*SR); L[cut:cut+int(.9*SR)]*=0.0; R[cut:cut+int(.9*SR)]*=0.0
e=N-int(1.5*SR); L[e:]*=np.linspace(1,0,N-e); R[e:]*=np.linspace(1,0,N-e)
m=max(abs(L).max(),abs(R).max()); out=np.stack([L,R],1)*.9/m
sf.write('narracao_raw.wav',out,SR)
