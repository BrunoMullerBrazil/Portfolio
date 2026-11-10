import json,re
T='/tmp/claude-0/-home-user-Portfolio/20f5f2d0-4756-5090-975f-c4a98ccee7b2/scratchpad/tts/'
OFF=4.0  # cold open
# [newStart,newEnd, oldStart,oldEnd, zoom0, zoom1]
E=[[0,4,0,4,1,1],
[4,9.3,4,10,1,1],[9.3,13.6,17.0,19.6,1,1.04],[13.6,17.4,19.6,19.95,1.04,1.12],
[17.4,27.4,14.0,14.02,1,1.10],[27.4,29.7,14.0,16.5,1.10,1.12],[29.7,31.4,16.5,16.95,1.12,1.14],[31.4,33.5,16.95,16.99,1.14,1.18],
[33.5,35.4,20.0,20.35,1,1.02],[35.4,37.4,20.35,21.6,1.02,1.03],[37.4,39.8,21.6,22.5,1.03,1.05],[39.8,41.0,22.5,23.6,1,1],
[41.0,45.4,23.6,25.6,1,1],[45.4,46.5,25.6,26.9,1,1],[46.5,50.6,26.9,27.3,1,1.02],[50.6,54.0,27.3,31.15,1.02,1.04],
[54.0,57.8,31.15,33.0,1,1],[57.8,59.6,33.0,33.9,1,1],[59.6,62.7,33.9,37.9,1,1],[62.7,66.5,37.9,42.7,1,1],[66.5,70.8,42.7,47.7,1,1],
[70.8,73.5,47.7,49.6,1,1],[73.5,75.6,49.6,51.9,1,1],[75.6,81.0,52,57,1,1],
[81.0,84.0,61.0,62.0,1,1.03],[84.0,88.8,57.0,60.0,1,1],[88.8,89.9,60.0,61.0,1,1],[89.9,94.3,62.0,64.0,1.03,1.08],[94.3,95.2,64.0,64.98,1.08,1.09],
[95.2,102.6,65.0,73.0,1,1],[102.6,109.2,73.0,76.0,1,1.05],[109.2,112.6,76.0,77.3,1.05,1.08],[112.6,114.8,77.3,77.85,1.08,1.1],
[114.8,118.7,77.85,78.2,1.1,1.14],[118.7,120.2,78.2,79.25,1.14,1.15],[120.2,122.65,79.45,81.9,1,1],
[122.65,127.6,'flat','flat',1,1],[127.6,130.6,82.5,85.5,1,1],[130.6,133.6,85.5,88.0,1,1]]
json.dump(E,open('edl.json','w'))
# subtitles from word timestamps
W=json.load(open(T+'up_words.json')); cues=json.load(open(T+'cues.json'))
src=open(T+'cut_scheila.py').read(); C=eval(re.search(r'C=(\[.*?\])\ncues',src,re.S).group(1)); C=[(c[0],c[1],c[3]) for c in C]
FIX={'Abra':'Abro','lamterna,':'lanterna,','pressada,':'apressada,','100':'cem','guardo':'guarda o','para':'pra','Estou':'Tô'}
subs=[]
for (i,tp,t0,dur,tx),(a,b,_) in zip(cues['cues'],C):
    if tp!='I': continue
    ws=[w for w in W if w[1]>=a-0.05 and w[2]<=b+0.1]
    if i==8: ws=[('Abro',a,a+0.4)]+[w for w in ws if w[0]!='Abra']
    n0=OFF+t0+0.3
    chunk=[];
    def flush():
        if not chunk: return
        txt=' '.join(FIX.get(w[0],w[0]) for w in chunk)
        s=n0+max(0,chunk[0][1]-a); e=n0+min(b-a,chunk[-1][2]-a)+0.25
        subs.append([round(s,2),round(e,2),txt]); chunk.clear()
    for w in ws:
        chunk.append(w); L=len(' '.join(x[0] for x in chunk))
        if (w[0][-1] in '.?' and L>8) or (w[0][-1]==',' and L>26) or L>50: flush()
    flush()
# fix tiny trailing comma at end of sentence chunks + capitalise first
out=[]
for s,e,txt in subs:
    txt=txt.rstrip(',').strip()
    if txt.startswith('Abro a'): pass
    words=txt.split()
    if len(txt)<=30: lines=[txt]
    else:
        best=min(range(1,len(words)),key=lambda k:max(len(' '.join(words[:k])),len(' '.join(words[k:]))))
        lines=[' '.join(words[:best]),' '.join(words[best:])]
    txt='\n'.join(lines)
    out.append([s,e,txt])
for i in range(len(out)-1):
    if out[i][1]>out[i+1][0]: out[i][1]=out[i+1][0]-0.02
json.dump(out,open('subs.json','w'),ensure_ascii=False)
for s in out: print(s)
