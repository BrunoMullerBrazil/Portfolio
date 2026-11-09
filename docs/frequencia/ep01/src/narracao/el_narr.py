import json, subprocess, urllib.request, soundfile as sf, re, sys
src=open('narr.py').read(); S=eval(re.search(r"S=(\[.*?\])\nout",src,re.S).group(1))
IARA=sys.argv[1] if len(sys.argv)>1 else 'EXAVITQu4vr4xnSDxMaL'; OPER='onwK4e9ZLuTAKqWW03F9'
SET={'I':dict(stability=.42,similarity_boost=.8,style=.25,use_speaker_boost=True),
     'C':dict(stability=.7,similarity_boost=.8,style=0,use_speaker_boost=True),
     'F':dict(stability=.5,similarity_boost=.8,style=.2,use_speaker_boost=True),
     'O':dict(stability=.85,similarity_boost=.75,style=0,use_speaker_boost=True)}
def tts(text,voice,vs,prev,nxt,out):
    body=json.dumps({'text':text,'model_id':'eleven_multilingual_v2','voice_settings':vs,'previous_text':prev,'next_text':nxt}).encode()
    r=urllib.request.Request(f'https://api.elevenlabs.io/v1/text-to-speech/{voice}?output_format=mp3_44100_128',data=body,headers={'content-type':'application/json','xi-api-key':'proxy-injected'})
    open(out,'wb').write(urllib.request.urlopen(r,timeout=120).read())
cues=[];t=0;sr=24000
for i,(tp,tx,p) in enumerate(S):
    prev=' '.join(x[1] for x in S[max(0,i-2):i] if x[0]==tp); nxt=' '.join(x[1] for x in S[i+1:i+2] if x[0]==tp)
    tts(tx, OPER if tp=='O' else IARA, SET[tp], prev, nxt, 'el.mp3')
    subprocess.run(['ffmpeg','-y','-v','error','-i','el.mp3','-af','silenceremove=start_periods=1:start_threshold=-50dB,areverse,silenceremove=start_periods=1:start_threshold=-50dB,areverse','-ar','24000','-ac','1',f'seg_{i:02d}_{tp}.wav'],check=True)
    a,_=sf.read(f'seg_{i:02d}_{tp}.wav'); cues.append((i,tp,round(t,2),round(len(a)/sr,2),tx)); t+=len(a)/sr+p
json.dump({'S':S,'cues':cues},open('cues.json','w'),ensure_ascii=False); print(round(t,1),'s', sum(len(x[1]) for x in S),'chars')
