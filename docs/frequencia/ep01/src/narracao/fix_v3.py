import json, sys, subprocess, soundfile as sf
sys.argv=['x']; exec(open('el_v3.py').read().split('cues=[];t=0')[0])
TAG[8]="[breathing heavily] Abro a moxila, procurando qualquer coisa. [quickly] Lanterna. Pilha. Meu capacete, todo arranhado."
TAG[17]="[low voice, firm and instructive] Água turva: deixa parada, e coa num pano limpo. Pra beber, ferve. Bolha forte, um minuto inteiro. Sem fogo: duas gotas de hi-po-clo-ri-to por litro, e espera meia hora."
for i in (8,):
    tp=S[i][0]; tts(TAG[i],IARA,STAB[tp],'el.mp3')
    subprocess.run(['ffmpeg','-y','-v','error','-i','el.mp3','-af','silenceremove=start_periods=1:start_threshold=-50dB,areverse,silenceremove=start_periods=1:start_threshold=-50dB,areverse','-ar','24000','-ac','1',f'seg_{i:02d}_{tp}.wav'],check=True)
cues=[];t=0
for i,(tp,tx,p) in enumerate(S):
    a,sr=sf.read(f'seg_{i:02d}_{tp}.wav'); cues.append((i,tp,round(t,2),round(len(a)/sr,2),tx)); t+=len(a)/sr+p*0.45
json.dump({'S':S,'cues':cues,'tags':TAG},open('cues.json','w'),ensure_ascii=False); print(round(t,1),'s')
