import soundfile as sf, numpy as np, subprocess, json
from kokoro_onnx import Kokoro
k=Kokoro('kokoro-v1.0.onnx','voices-v1.0.bin')
# (tipo, texto, pausa_depois_s)  tipos: I=Iara, C=caderno (sussurro), O=operador (radio, voz masc), F=fita (Iara no radio)
S=[('I','Quarenta e um dias sem luz.',.6),('I','Eu sei porque conto. Risco na parede, um por dia. Quarenta e um riscos.',1.1),
('I','O problema é que eu só lembro de uns vinte.',1.2),
('I','Acordo num apartamento que não é meu. Cama que não é minha. Uma cicatriz na cabeça que eu não sei como ganhei.',.4),('I','E uma garrafa vazia na mão.',.9),
('I','Viro a garrafa. Cai uma gota.',.5),('I','Só uma gota.',1.2),('I','A água acabou ontem.',1.0),
('I','Abro a mochila procurando qualquer coisa. Lanterna. Pilha. Meu capacete, todo arranhado.',.4),('I','E, no fundo, um caderno preto, empenado, que já molhou e secou.',.7),
('I','Eu nunca vi esse caderno.',.7),('I','Eu abro.',.6),('I','Primeira página, letra apressada, sublinhada duas vezes:',.5),
('C','Se você está lendo isso, a água acabou.',1.2),
('I','Olho pra trás. Não tem ninguém no quarto.',.4),('I','Tenho quase certeza.',1.0),
('I','O caderno explica.',.4),('C','Água turva: deixa parada, e coa num pano limpo. Pra beber, ferve. Bolha forte, um minuto inteiro. Sem fogo: duas gotas de hipoclorito por litro, e espera meia hora.',.6),
('I','E embaixo, quase rasgando o papel:',.4),('C','Leia o rótulo.',1.2),
('I','Desço até o canal antes de clarear. A água é marrom. Encho duas garrafas.',.9),
('I','Em cima da mesa, eu tenho duas saídas.',.5),('I','Um fogareiro com o último cartucho de gás. Dá pra uma fervura. Talvez a última.',.6),
('I','Ou um frasco que eu achei no corredor do prédio. Guarda o gás pra noite, que anda fria.',.7),('I','Tô com sede demais pra pensar direito.',1.3),
('I','De noite, o rádio repete os números de sempre. Um homem lendo, calmo, como quem já leu aquilo cem vezes.',.3),
('O','Sete. Dois. Repetindo.',.6),('I','Aí a estática muda.',.6),('I','E uma voz de mulher, distante, diz o meu nome.',.5),
('F','Iara.',1.1),('F','Você esqueceu de novo... não foi?',1.6),
('I','Eu conheço essa voz.',.8),('I','Só não sei de onde.',1.5)]
out=[];sr=24000;cues=[];t=0
for i,(tp,tx,p) in enumerate(S):
    if tp=='O':
        subprocess.run(f'echo "{tx}" | piper -m pt_BR-faber-medium.onnx --length_scale 1.1 -f seg.wav 2>/dev/null && ffmpeg -y -v error -i seg.wav -ar 24000 -ac 1 seg24.wav',shell=True,check=True)
        a,_=sf.read('seg24.wav')
    else:
        a,_=k.create(tx,voice='pf_dora',speed=.88 if tp!='C' else .82,lang='pt-br')
    sf.write(f'seg_{i:02d}_{tp}.wav',a,sr); cues.append((i,tp,round(t,2),round(len(a)/sr,2),tx)); t+=len(a)/sr+p
json.dump({'S':S,'cues':cues},open('cues.json','w'),ensure_ascii=False)
print(round(t,1),'s total')
