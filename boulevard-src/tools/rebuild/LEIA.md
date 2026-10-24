# Remontagem do Blender (Boulevard em 3D)

A pasta `~/Movies/Boulevard_3D` sumiu do Mac em out/2026. Esta pasta transforma em script **tudo** o que foi feito no
Blender na conversa de 16/out ("Cena com bola no Blender"), inclusive os passos que tinham sido rodados só na mão.

## Ordem
1. `00_assets.py` — baixa ~1 GB (relevo Terrarium, HDRIs, texturas e modelos Poly Haven). Roda em thread; esperar
   `bpy.app.driver_namespace['blv_dl']['running'] == False`.
2. `rodar_exterior.py` — roda, na ordem certa, os scripts de `../` e os passos `02`–`13` daqui. Salva `boulevard.blend`.
   No passo 12 a cena fica no estado do **heroi_v3** (capa do site); 13 e os seguintes são ajustes aprovados depois.
3. Interior (cena "Sacada"): ver `20_*`.

## Diferenças conhecidas em relação ao original
- HDRIs de interior das janelas: são "os 4 mais baixados" da Poly Haven no dia do download; podem não ser os mesmos de 16/out.
- Exposição/balanço: conferir contra `public/boulevard/hero.webp` (a capa publicada) antes de renderizar finais.

### Realismo do bairro e praça (24/out, parte 2)
- `29_materiais_bairro.py` — só shader: paver da praça, paredes com variação e faixas de janela, telha com fiadas, prédios OSM com cobertura de fibrocimento, asfalto/calçada com remendos.
- `30_praca_layout.py` — Praça Oscar Niemeyer pelo programa das imagens oficiais do altosdapedra.com.br (espelho d'água oval com bancos curvos, pergolado metálico ~48×9 m com bancas, canteiros com agapanto, palmeiras na avenida, árvores de sombra). Medidas estimadas: o site não publica planta dimensionada. A escultura do Niemeyer não é modelada (obra autoral).
- `31_cores_casas.py` — corrige o 29, que tinha lido cor base .8 em todas as casas.
- O polígono da praça (28) agora encosta na calçada da avenida.
