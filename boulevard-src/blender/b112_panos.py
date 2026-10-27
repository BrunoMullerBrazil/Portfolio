"""Panoramas 360° (equirretangulares) de cada cômodo do apê decorado, dia e noite, no Cycles.

Roda em segundo plano sobre uma CÓPIA do .blend:
  blender -b <copia.blend> --python b112_panos.py -- <pasta_saida> [amostras=384] [largura=4096]

Saída: pano_<comodo>_<dia|noite>.jpg + panos.json (posição, direção inicial) + progresso.json
No navegador, cada botão de cômodo abre o panorama: é o render do Cycles, só que dá para olhar em volta.
"""
import bpy, sys, os, json, time, math

argv = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
OUT = argv[0] if argv else '/tmp/b112_panos'
SPP = int(argv[1]) if len(argv) > 1 else 384
W = int(argv[2]) if len(argv) > 2 else 4096
SO = set(argv[3].split(',')) if len(argv) > 3 and argv[3] else None   # só estes cômodos (ex.: sala,jantar)
os.makedirs(OUT, exist_ok=True)
T0 = time.time()

# cômodo: (posição do olho em metros no Blender, ponto para onde o panorama abre)
COMODOS = {
    'sala':       ((2.30, 1.55, 1.40), (3.8, 1.6, 1.2)),
    'jantar':     ((2.25, 0.05, 1.45), (3.1, 0.25, 0.9)),
    'cozinha':    ((2.45, -1.45, 1.55), (2.6, -2.6, 1.1)),
    'entrada':    ((0.15, -1.45, 1.55), (0.3, -2.6, 1.3)),
    'quarto':     ((-1.75, -0.85, 1.50), (-3.2, 1.2, 1.0)),
    'escritorio': ((0.15, 0.55, 1.45), (-1.1, 1.6, 1.1)),
    'banheiro':   ((-3.35, -2.00, 1.55), (-3.9, -2.0, 1.3)),
}
# de dia, os cômodos do fundo só recebem a luz que entra pelas janelas (persianas baixadas): compensação de exposição,
# como um fotógrafo faria em cada ambiente
EXPO_DIA = {'sala': 0.0, 'jantar': 0.3, 'cozinha': 1.2, 'entrada': 2.6, 'quarto': 2.4, 'escritorio': 2.2, 'banheiro': 2.8}
EXPO_NOITE = {'sala': 0.0, 'jantar': 0.0, 'cozinha': 0.0, 'entrada': 0.0, 'quarto': 0.0, 'escritorio': 0.3, 'banheiro': 0.0}
EMISSIVOS = ('DEC_globo', 'DEC_cupula_mesa', 'ABAJUR_linho', 'col_ffe8c0', 'DEC2_papel_arroz', 'LED_3200k', 'LUZ_embutido',
             'col_fff0d0', 'BWC_led', '1920s_Ceiling_Pendant_Lamp_Type_A_Ornate_01')
SUN_DIA, CEU_DIA = 4.5, 0.6

sc = bpy.data.scenes['Sacada']
try:
    bpy.context.window.scene = sc
except Exception:
    pass
PROG = {'feito': [], 'erro': None}


def prog(**kw):
    PROG.update(kw)
    PROG['t'] = round(time.time() - T0)
    json.dump(PROG, open(os.path.join(OUT, 'progresso.json'), 'w'), ensure_ascii=False)
    print('[panos]', PROG, flush=True)


EMIS = []
for m in bpy.data.materials:
    if m.users and m.node_tree and any(m.name.startswith(k) for k in EMISSIVOS):
        b = next((x for x in m.node_tree.nodes if x.type == 'BSDF_PRINCIPLED'), None)
        if b:
            c = b.inputs['Emission Color'].default_value
            if sum(c[:3]) < .05 or b.inputs['Emission Strength'].default_value == 0:
                b.inputs['Emission Color'].default_value = (1, .78, .5, 1)
            EMIS.append((m, b))


def periodo(p):
    for o in sc.objects:
        if o.type != 'LIGHT':
            continue
        if o.data.type == 'SUN':
            o.hide_render = (p != 'dia')
            o.data.energy = SUN_DIA
        else:
            o.hide_render = (p == 'dia')
    for n in sc.world.node_tree.nodes:
        if n.type == 'BACKGROUND':
            n.inputs['Strength'].default_value = CEU_DIA if p == 'dia' else .015
    for m, b in EMIS:
        b.inputs['Emission Strength'].default_value = 0.0 if p == 'dia' else (6.0 if 'embutido' in m.name else 2.5)


r = sc.render
r.engine = 'CYCLES'
try:
    sc.cycles.device = 'GPU'
except Exception:
    pass
sc.cycles.samples = SPP
sc.cycles.use_denoising = True
r.resolution_x, r.resolution_y, r.resolution_percentage = W, W // 2, 100
r.image_settings.file_format = 'JPEG'
r.image_settings.quality = 90
r.use_stamp = False
r.use_stamp_note = False
cd = bpy.data.cameras.new('PANO')
cd.type = 'PANO'
try:
    cd.panorama_type = 'EQUIRECTANGULAR'
except Exception:
    cd.cycles.panorama_type = 'EQUIRECTANGULAR'
cam = bpy.data.objects.new('PANO', cd)
sc.collection.objects.link(cam)
sc.camera = cam
# o centro da imagem olha para +X do Blender; a direção inicial vai no json (o navegador gira a vista)
cam.rotation_euler = (math.pi / 2, 0, -math.pi / 2)
info = json.load(open(os.path.join(OUT, 'panos.json'))) if os.path.exists(os.path.join(OUT, 'panos.json')) else {}
try:
    for p in ('dia', 'noite'):
        periodo(p)
        for k, (pos, alvo) in COMODOS.items():
            if SO and k not in SO:
                continue
            cam.location = pos
            sc.view_settings.exposure = (EXPO_DIA if p == 'dia' else EXPO_NOITE).get(k, 0.0)
            dx, dy = alvo[0] - pos[0], alvo[1] - pos[1]
            info[k] = {'pos': pos, 'yaw': math.atan2(dy, dx), 'pitch': math.atan2(alvo[2] - pos[2], math.hypot(dx, dy))}
            prog(atual=f'{k}_{p}')
            r.filepath = os.path.join(OUT, f'pano_{k}_{p}.jpg')
            bpy.ops.render.render(write_still=True)
            PROG['feito'].append(f'{k}_{p}')
            json.dump(info, open(os.path.join(OUT, 'panos.json'), 'w'), indent=1)
    prog(atual='fim')
except Exception:
    import traceback
    prog(erro=traceback.format_exc()[-1500:])
