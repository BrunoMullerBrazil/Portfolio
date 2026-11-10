import subprocess, json, soundfile as sf
SRC="/root/.claude/uploads/20f5f2d0-4756-5090-975f-c4a98ccee7b2/ecdc19cc-ElevenLabs_2026-11-10T09_45_50_Scheila_-_Serious_and_Direct_pvc_s50_sim75_v4.mp3"
C=[(0.0,1.75,'I','Quarenta e um dias sem luz,',.5),(2.25,4.75,'I','eu só sei porque estou contando todo dia.',.5),(5.15,8.75,'I','Risco na parede, um por dia, quarenta e um riscos.',.8),
(9.5,12.15,'I','O problema é que eu só lembro de uns vinte.',1.0),(12.7,21.85,'I','Acordo num apartamento que não é meu...',.7),
(22.3,24.3,'I','Viro a garrafa, cai uma gota,',.6),(24.66,25.06,'I','uma.',1.0),(25.7,26.94,'I','A água acabou ontem.',.8),
(26.96,36.5,'I','Abro a mochila...',.6),(36.75,38.14,'I','Eu nunca vi esse caderno.',.6),(38.4,38.9,'I','Eu abro.',.5),
(39.2,42.85,'I','Primeira página, letra apressada, sublinhada duas vezes.',.5),(43.25,45.75,'C','Se você está lendo isso, a água acabou.',1.0),
(46.28,49.7,'I','Olho pra trás...',.8),(50.15,51.12,'I','O caderno ensina.',.4),(51.4,62.15,'C','Água turva...',.5),
(62.32,64.5,'I','e embaixo, quase rasgando o papel,',.5),(64.95,65.88,'C','Lê o rótulo.',1.0),(66.25,71.2,'I','Desço até o canal...',.8),
(71.5,73.72,'I','em cima da mesa tenho duas saídas,',.5),(73.98,78.52,'I','um fogareiro...',.6),(78.78,83.24,'I','ou um frasco...',.7),
(83.26,85.92,'I','Estou com sede demais pra pensar direito.',5.0),(86.4,93.15,'I','De noite, o rádio...',.5),
(None,None,'O','Sete. Dois. Repetindo.',.6),(96.38,97.85,'I','Aí a estática muda.',.6),(98.08,101.22,'I','E uma voz de mulher, distante, diz meu nome.',.7),
(101.58,102.06,'F','Iara.',1.0),(102.58,104.56,'F','Você esqueceu de novo, não foi?',1.6),(104.96,106.22,'I','Eu conheço essa voz,',.8),(106.58,107.9,'I','só não sei de onde.',1.5)]
import numpy as np
raw=subprocess.run(['ffmpeg','-v','error','-i',SRC,'-ac','1','-ar','16000','-f','f32le','-'],capture_output=True,check=True).stdout
SIG=np.frombuffer(raw,np.float32); FR=160; ENV=np.array([np.sqrt((SIG[i:i+FR]**2).mean()) for i in range(0,len(SIG)-FR,FR)])
THR=10**(-42/20)*max(1e-6,np.percentile(ENV,99))
def fr(t): return int(t*100)
def end_ext(b,lim):
    i=fr(b); j=fr(lim)
    while i<j:
        if ENV[i:i+6].max()<THR: return i/100+0.04
        i+=1
    return lim
def start_ext(a,lim):
    i=fr(a); j=fr(lim)
    while i>j:
        if ENV[max(0,i-6):i].max()<THR: return max(j/100,i/100-0.03)
        i-=1
    return lim
EXT=[]
for k,(a0,b0,tp,tx,p) in enumerate(C):
    if a0 is None: EXT.append((None,None)); continue
    nxt=next((c[0] for c in C[k+1:] if c[0] is not None),999); prv=next((c[1] for c in reversed(C[:k]) if c[1] is not None),0)
    EXT.append((start_ext(a0,min(a0,max(prv+0.03,a0-0.18))), end_ext(b0,max(b0,min(nxt-0.03,b0+0.45)))))
cues=[];t=0
for i,(a,b,tp,tx,p) in enumerate(C):
    out=f'seg_{i:02d}_{tp}.wav'
    if i==8:
        subprocess.run(['ffmpeg','-y','-v','error','-ss','38.42','-to','38.86','-i',SRC,'-ar','24000','-ac','1','x1.wav'],check=True)
        subprocess.run(['ffmpeg','-y','-v','error','-ss','27.555','-to',str(EXT[8][1]),'-i',SRC,'-ar','24000','-ac','1','x2.wav'],check=True)
        subprocess.run(['ffmpeg','-y','-v','error','-i','x1.wav','-i','x2.wav','-filter_complex','aevalsrc=0:d=0.015:s=24000[g];[0][g][1]concat=n=3:v=0:a=1','-ar','24000','-ac','1',out],check=True)
    elif tp=='O': subprocess.run(['ffmpeg','-y','-v','error','-i','op_daniel.wav','-ar','24000','-ac','1',out],check=True)
    else: subprocess.run(['ffmpeg','-y','-v','error','-ss',str(EXT[i][0]),'-to',str(EXT[i][1]),'-i',SRC,'-af',f'afade=t=in:d=0.012,areverse,afade=t=in:d=0.03,areverse','-ar','24000','-ac','1',out],check=True)
    d,sr=sf.read(out); lead=0 if (a is None or i==8) else a-EXT[i][0]
    olen=(b-a) if a is not None else len(d)/sr
    if i==8: olen=(38.86-38.42)+0.05+(b-27.555)
    cues.append((i,tp,round(t,2),round(len(d)/sr,2),tx,round(lead,3))); t+=olen+p
json.dump({'S':[(c[2],c[3],c[4]) for c in C],'cues':cues},open('cues.json','w'),ensure_ascii=False); print(round(t,1),'s')
