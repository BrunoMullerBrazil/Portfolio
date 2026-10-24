# Remontagem 12b (24/out): calibração contra a capa publicada (public/boulevard/hero.webp = heroi_v3 original).
# Com os valores documentados do v3 a remontagem saía ~0,4 stop mais escura e mais quente. Medido por regiões
# (céu, fachada do bloco B, mata, gramado): céu .30 + balanço de branco desligado bate fachada e mata com o original.
import bpy
scn = bpy.data.scenes["Boulevard"]
bg = [n for n in scn.world.node_tree.nodes if n.type == 'BACKGROUND'][0]; bg.inputs['Strength'].default_value = .30
scn.view_settings.use_white_balance = False; scn.view_settings.exposure = 1.6
result = {"ok": True}
