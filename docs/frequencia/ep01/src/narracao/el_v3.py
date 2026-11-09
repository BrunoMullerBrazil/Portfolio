import json, subprocess, urllib.request, soundfile as sf, re
src=open('narr.py').read(); S=eval(re.search(r"S=(\[.*?\])\nout",src,re.S).group(1))
IARA='EXAVITQu4vr4xnSDxMaL'; OPER='onwK4e9ZLuTAKqWW03F9'
# direção de voz por fala (índice -> texto com tags v3)
TAG={
0:"[tired] [quietly] Quarenta e um dias sem luz.",
1:"[flat] Eu sei porque conto. [exhales] Risco na parede, um por dia. [slowly] Quarenta e um riscos.",
2:"[dry, bitter] O problema... é que eu só lembro de uns vinte.",
3:"[uneasy] Acordo num apartamento que não é meu. Cama que não é minha. [hesitant] Uma cicatriz na cabeça que eu não sei como ganhei.",
4:"[quietly] E uma garrafa vazia na mão.",
5:"[softly] Viro a garrafa. [pause] Cai uma gota.",
6:"[whispers] Só uma gota.",
7:"[resigned] A água acabou ontem.",
8:"[breathing heavily] Abro a mochila procurando qualquer coisa. [quickly] Lanterna. Pilha. Meu capacete, todo arranhado.",
9:"[slows down, curious] E, no fundo, um caderno preto, empenado, que já molhou e secou.",
10:"[confused] Eu nunca vi esse caderno.",
11:"[quietly] Eu abro.",
12:"[reading carefully] Primeira página, letra apressada, sublinhada duas vezes:",
13:"[whispers, ominous] Se você está lendo isso... a água acabou.",
14:"[nervous] [whispers] Olho pra trás. Não tem ninguém no quarto.",
15:"[nervous laugh] Tenho quase certeza.",
16:"[calmer] O caderno explica.",
17:"[whispers, firm and instructive] Água turva: deixa parada, e coa num pano limpo. Pra beber, ferve. Bolha forte, um minuto inteiro. Sem fogo: duas gotas de hipoclorito por litro, e espera meia hora.",
18:"[tense] E embaixo, quase rasgando o papel:",
19:"[whispers, urgent] Leia o rótulo.",
20:"[tired] Desço até o canal antes de clarear. [disgusted] A água é marrom. [sighs] Encho duas garrafas.",
21:"[thoughtful] Em cima da mesa, eu tenho duas saídas.",
22:"[weighing it] Um fogareiro com o último cartucho de gás. Dá pra uma fervura. [quietly] Talvez a última.",
23:"[hesitant] Ou um frasco que eu achei no corredor do prédio. Guarda o gás pra noite, que anda fria.",
24:"[exhausted, swallows] Tô com sede demais pra pensar direito.",
25:"[quietly, drowsy] De noite, o rádio repete os números de sempre. Um homem lendo, calmo, como quem já leu aquilo cem vezes.",
26:"[monotone, calm] Sete. Dois. Repetindo.",
27:"[alert, whispers] Aí a estática muda.",
28:"[scared, barely audible] E uma voz de mulher, distante... diz o meu nome.",
29:"[softly, distant] Iara.",
30:"[sad, gentle] Você esqueceu de novo... [sighs] não foi?",
31:"[shaken, whispers] Eu conheço essa voz.",
32:"[long pause] [barely audible] Só não sei de onde."}
STAB={'I':0.5,'C':0.5,'F':0.5,'O':1.0}
def tts(text,voice,stab,out):
    body=json.dumps({'text':text,'model_id':'eleven_v3','voice_settings':{'stability':stab}}).encode()
    r=urllib.request.Request(f'https://api.elevenlabs.io/v1/text-to-speech/{voice}?output_format=mp3_44100_128',data=body,headers={'content-type':'application/json','xi-api-key':'proxy-injected'})
    open(out,'wb').write(urllib.request.urlopen(r,timeout=180).read())
cues=[];t=0;sr=24000
for i,(tp,tx,p) in enumerate(S):
    tts(TAG[i], OPER if tp=='O' else IARA, STAB[tp], 'el.mp3')
    subprocess.run(['ffmpeg','-y','-v','error','-i','el.mp3','-af','silenceremove=start_periods=1:start_threshold=-50dB,areverse,silenceremove=start_periods=1:start_threshold=-50dB,areverse','-ar','24000','-ac','1',f'seg_{i:02d}_{tp}.wav'],check=True)
    a,_=sf.read(f'seg_{i:02d}_{tp}.wav'); cues.append((i,tp,round(t,2),round(len(a)/sr,2),tx)); t+=len(a)/sr+p
json.dump({'S':S,'cues':cues,'tags':TAG},open('cues.json','w'),ensure_ascii=False); print(round(t,1),'s')
