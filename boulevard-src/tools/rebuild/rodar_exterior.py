# Remonta a cena "Boulevard" (exterior) do zero, na ordem em que foi construída em 16/out/2026.
# Uso no Blender (MCP ou Scripting): definir SHA e colar/rodar este arquivo. Antes, rodar 00_assets.py e esperar
# bpy.app.driver_namespace['blv_dl']['running'] == False (~1 GB em ~/Movies/Boulevard_3D/assets).
import bpy, os, time, urllib.request, ssl
SHA = globals().get("SHA", "blender-rebuild")
ORDEM = [
    "blender_boulevard.py",            # torres: volumetria do site + detalhe do book, 288 unidades (UN_*)
    "SAVE",
    "rebuild/02_dem.py",               # relevo real (Terrarium) girado: Pedra Branca nos fundos
    "blender_site.py",                 # implantação: lojas, estacionamento, lazer, vias, ~1060 casas, pontos de árvore
    "rebuild/03_texturas_arvores.py",  # PBR, HDRI kiara + sol, árvores Poly Haven LOD0/LOD1, rocha da rotatória
    "rebuild/04_v5_luzes_camera.py",   # GATE 45% acesos, névoa, câmera da rotatória
    "blender_details.py",              # Torre di Mosto, vitrines fictícias, postes e fiação
    "blender_lojas.py",                # fachada das lojas pelo book (toldos, friso, jardins verticais)
    "rebuild/05_cam_lojas.py", "rebuild/06_lojas_ajustes.py",
    "blender_bairro.py",               # casas com janelas, muros, telhado cerâmico
    "rebuild/07_hora_azul_postes.py",
    "blender_lojas_interior.py", "rebuild/08_lojas_luz.py",
    "rebuild/09_terreno_hora_azul.py", "rebuild/10_mata_fundos.py",
    "ORBITA",                          # blender_orbita.py só monta (hora azul, órbita, máscara); fila de 108 renders cancelada
    "blender_realismo.py",             # céu real, bevel, cômodos por HDRI, asfalto úmido
    "rebuild/11_heroi_cam.py",
    "blender_realismo2.py",            # céu puro, gramado, moitas, variedade de mata, árvores no morro
    "rebuild/12_heroi_v3.py",          # >>> aqui a cena está no estado do heroi_v3 (hero do site) <<<
    "SAVE",
    "rebuild/13_pos_v3.py",
    "blender_terreo.py",               # térreos com ambiente (torres e Mosto)
    "blender_lojas_fix.py",            # remove paredes laterais no plano do vidro
    "SAVE",
]
def fetch(p):
    u = f"https://raw.githubusercontent.com/BrunoMullerBrazil/Portfolio/{SHA}/boulevard-src/tools/{p}"
    return urllib.request.urlopen(urllib.request.Request(u, headers={"User-Agent": "BoulevardRender/1.0"}), timeout=60, context=ssl._create_unverified_context()).read().decode()
log = {}
D = os.path.expanduser("~/Movies/Boulevard_3D"); os.makedirs(D, exist_ok=True)
for p in ORDEM:
    t0 = time.time()
    if p == "SAVE":
        bpy.ops.wm.save_as_mainfile(filepath=f"{D}/boulevard.blend"); continue
    if p == "ORBITA":
        g = {"__name__": "blv_orb"}; exec(compile(fetch("blender_orbita.py"), "blender_orbita.py", "exec"), g)
        try: bpy.app.timers.unregister(g['go'])
        except Exception: pass
        for h in list(bpy.app.handlers.render_complete):
            if getattr(h, '__name__', '') == 'on_done': bpy.app.handlers.render_complete.remove(h)
        ns = bpy.app.driver_namespace; ns['blv_pose'] = g['pose']; ns['blv_normal'] = g['normal_mode']; ns['blv_mask'] = g['mask_mode']
        log[p] = "montada"; continue
    g = {"__name__": p}; exec(compile(fetch(p), p, "exec"), g)
    log[p] = dict(g.get("result", {}) or {}, s=round(time.time()-t0, 1))
result = log
