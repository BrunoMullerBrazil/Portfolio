# Narração do EP 1 (versão sintética v1)

- Iara e Caderno: Kokoro-82M (Apache 2.0), voz `pf_dora`, pt-BR. O Caderno usa a mesma voz, mais grave e com eco curto (pista da revelação do EP 5).
- Operador: Piper `pt_BR-faber-medium` com filtro de rádio AM.
- Fita (voz feminina no rádio): a mesma voz da Iara, filtrada como rádio.

Gerar: `python3 narr.py` (falas e pausas ficam na lista `S`) e depois `python3 mixnarr.py`. Normalizar com `loudnorm=I=-16`.
Modelos: `kokoro-v1.0.onnx` e `voices-v1.0.bin` (releases do kokoro-onnx), além de `pt_BR-faber-medium.onnx` (piper-voices).
