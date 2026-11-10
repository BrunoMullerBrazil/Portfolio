# Narração do EP 1 (versão sintética v1)

- Iara e Caderno: Kokoro-82M (Apache 2.0), voz `pf_dora`, pt-BR. O Caderno usa a mesma voz, mais grave e com eco curto (pista da revelação do EP 5).
- Operador: Piper `pt_BR-faber-medium` com filtro de rádio AM.
- Fita (voz feminina no rádio): a mesma voz da Iara, filtrada como rádio.

Gerar: `python3 narr.py` (falas e pausas ficam na lista `S`) e depois `python3 mixnarr.py`. Normalizar com `loudnorm=I=-16`.
Modelos: `kokoro-v1.0.onnx` e `voices-v1.0.bin` (releases do kokoro-onnx), além de `pt_BR-faber-medium.onnx` (piper-voices).

## v2: ElevenLabs
- `python3 el_narr.py [voice_id_iara]` gera as falas pela API (modelo `eleven_multilingual_v2`), lendo as falas de `narr.py`. Depois rode `python3 mixnarr.py`.
- Iara, Caderno e fita: voz padrão "Sarah" (`EXAVITQu4vr4xnSDxMaL`). Operador: "Daniel" (`onwK4e9ZLuTAKqWW03F9`).
- A chave é injetada pelo proxy do ambiente; o script envia `xi-api-key: proxy-injected` como placeholder.
- Atenção: no plano gratuito do ElevenLabs não há licença comercial. Para publicar, use um plano pago.

## v4: Scheila (take único gerado no site do ElevenLabs)
- `cut_scheila.py` corta o take em 31 trechos por papel (tempos vindos da transcrição palavra a palavra), troca a fala do Operador pela voz masculina e abre pausas. Depois rode `mixnarr.py`.
- Emenda: o "Abra" do take foi trocado pelo "Abro" que a atriz diz logo depois.
- Pendente: regerar no site "hi-po-clo-ri-to" (sai "poclorito") e "Lê o rótulo." (soa "leu rótulo").
