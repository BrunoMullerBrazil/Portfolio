# Renderizar o EP 1

Requisitos: Node + Playwright (Chromium), ffmpeg, Python 3 com numpy e piper-tts (voz guia pt_BR-faber-medium).

1. Vozes guia (Operador e voz feminina da fita): ver os comandos `piper` + filtro de rádio em `audio.py` (pasta `tts/` com `r_op1.wav`, `r_op2.wav`, `r_f1.wav`, `r_f2.wav`).
2. Áudio: `python3 audio.py <pasta_tts> mix.wav`
3. Vídeo (4 processos em paralelo, 24 fps, 2112 frames):
   `for k in 0 1 2 3; do node render.js $((k*528)) $(((k+1)*528)) seg$k.mp4 & done; wait`
4. Junção: concatenar os segmentos e mixar `mix.wav` com `loudnorm=I=-14`.

Pré-visualizar quadros: `node preview.js <pasta> 9 36 60.5` gera PNGs dos tempos indicados.
Cada cena é uma função `S*()` em `ep01.html`; tudo é determinístico a partir do tempo `T`.

## Versão narrada (Scheila)
- `edl.py` gera `edl.json` (mapa de montagem: tempo novo → tempo do vídeo original, com zoom) e `subs.json` (legendas a partir da transcrição palavra a palavra).
- `ep01b.html` carrega o mapa e as legendas; renderize com `renderb.js` (3206 frames).
- `audio2.py` monta o áudio: abertura do rádio + narração + ruídos de cena reposicionados pelo mapa + título.
