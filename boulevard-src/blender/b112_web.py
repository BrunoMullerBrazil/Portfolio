"""Exporta o apê decorado (cena "Sacada") para a web, com a luz do Cycles gravada em lightmaps.

Roda em segundo plano sobre uma CÓPIA do .blend (nunca no arquivo do Bruno):
  blender -b <copia.blend> --python b112_web.py -- <pasta_saida> [amostras]

Saída em <pasta_saida>:
  b112.glb                 geometria + materiais + câmeras (Draco), 2º UV "Lightmap" nos grupos SHELL e MOB
  lm_SHELL_dia.png ...     lightmaps 8 bits (gama 2.2) por grupo e por período
  manifest.json            escala de cada lightmap (lightMapIntensity = 1/k), câmeras, contagens
  progresso.json / log     andamento, lido pelo Claude enquanto roda
"""
import bpy, bmesh, sys, os, json, time, math
import numpy as np

argv = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
OUT = argv[0] if argv else '/tmp/b112_web'
SAMPLES = int(argv[1]) if len(argv) > 1 else 256
LM_RES = {'SHELL': 4096, 'MOB': 4096}
ENV_POS = (2.3, 1.4, 1.35)          # centro da sala: panorama para os reflexos no navegador
# cúpulas, LEDs e embutidos: acesos só à noite (no navegador o emissivo liga no botão Noite)
EMISSIVOS = ('DEC_globo', 'DEC_cupula_mesa', 'ABAJUR_linho', 'col_ffe8c0', 'DEC2_papel_arroz', 'LED_3200k', 'LUZ_embutido',
             'col_fff0d0', 'BWC_led', '1920s_Ceiling_Pendant_Lamp_Type_A_Ornate_01')
os.makedirs(OUT, exist_ok=True)
T0 = time.time()
PROG = {'etapa': 'inicio', 'feito': [], 'erro': None}


def prog(etapa, **kw):
    PROG['etapa'] = etapa
    PROG['t'] = round(time.time() - T0)
    PROG.update(kw)
    json.dump(PROG, open(os.path.join(OUT, 'progresso.json'), 'w'), ensure_ascii=False)
    print('[b112]', PROG['t'], 's', etapa, kw, flush=True)


VEG_KEYS = ('plant', 'leaves', 'leaf', 'calathea', 'pebble', 'tree', 'planta', 'folha', 'fern', 'monstera')
SHELL_COLLS = ('SAC_modelo', 'PERSIANAS', 'BWC_reforma', 'LUZ_interna')
MAX_FACES = 8000          # só para objetos soltos (decoração do Sketchfab); B112_* já vêm otimizados
# períodos: o arquivo está salvo na noite (sol 0, luzes da casa acesas, céu 0,35). Dia = sol ligado, casa apagada.
SUN_DIA = 4.5
CEU_DIA = 0.6

try:
    sc = bpy.data.scenes['Sacada']
    bpy.context.window_scene = sc if bpy.context.window else None
except Exception:
    pass
sc = bpy.data.scenes['Sacada']
if bpy.context.scene != sc:
    try:
        bpy.context.window.scene = sc
    except Exception:
        pass
vl = sc.view_layers[0]

# ---------------------------------------------------------------- 1. visibilidade = a do render
prog('visibilidade')
def walk_lc(lc):
    if lc.collection.hide_render:
        lc.exclude = True
    for ch in lc.children:
        walk_lc(ch)
walk_lc(vl.layer_collection)
for o in sc.objects:
    o.hide_viewport = o.hide_render
    try:
        o.hide_set(o.hide_render, view_layer=vl)
    except Exception:
        pass

top_of = {}
for c in sc.collection.children:
    for o in c.all_objects:
        top_of.setdefault(o.name, c.name)

# ---------------------------------------------------------------- 2. tudo vira malha real (modificadores, instâncias)
prog('convertendo')
dg = bpy.context.evaluated_depsgraph_get()
web = bpy.data.collections.new('WEB')
sc.collection.children.link(web)
made = []
for inst in dg.object_instances:
    ob = inst.object
    if ob.type not in ('MESH', 'CURVE', 'SURFACE', 'FONT', 'META'):
        continue
    orig = ob.original
    owner = inst.parent.original if inst.is_instance and inst.parent else orig
    if owner.hide_render or orig.hide_render:
        continue
    try:
        me = bpy.data.meshes.new_from_object(ob, preserve_all_data_layers=True, depsgraph=dg)
    except Exception:
        continue
    if not me.polygons:
        bpy.data.meshes.remove(me)
        continue
    if not me.materials and orig.material_slots:
        for s in orig.material_slots:
            me.materials.append(s.material)
    else:
        for i, s in enumerate(orig.material_slots):
            if s.link == 'OBJECT' and s.material and i < len(me.materials):
                me.materials[i] = s.material
    n = bpy.data.objects.new(orig.name + '_w', me)
    n.matrix_world = inst.matrix_world.copy()
    web.objects.link(n)
    nm = orig.name.lower()
    if orig.name.startswith('B112_VEG') or any(k in nm for k in VEG_KEYS):
        grp = 'VEG'
    elif orig.name.startswith('B112_SHELL') or top_of.get(owner.name, '') in SHELL_COLLS:
        grp = 'SHELL'
    else:
        grp = 'MOB'
    n['b112'] = orig.name.startswith('B112_')
    n['grp'] = grp
    made.append(n)
prog('convertido', objetos=len(made))

# originais saem (luzes, mundo e câmeras ficam para o baking e para a exportação)
for o in list(sc.objects):
    if o.type in ('LIGHT', 'CAMERA') or o.name in web.objects:
        continue
    bpy.data.objects.remove(o, do_unlink=True)


def activate(objs, active):
    for o in list(sc.objects):
        if o is None:
            continue
        try:
            o.select_set(False)
        except Exception:
            pass
    for o in objs:
        o.select_set(True)
    vl.objects.active = active


# ---------------------------------------------------------------- 3. simplifica o que é pesado demais para o celular
prog('simplificando')
dec = []
for o in made:
    f = len(o.data.polygons)
    if f > MAX_FACES and not o.get('b112'):
        r = max(0.06, MAX_FACES / f)
        m = o.modifiers.new('dec', 'DECIMATE')
        m.ratio = r
        activate([o], o)
        bpy.ops.object.modifier_apply(modifier='dec')
        dec.append([o.name, f, len(o.data.polygons)])
prog('simplificado', simplificados=dec)

# ---------------------------------------------------------------- 4. junta por grupo, UV de textura padronizado
groups = {}
for o in made:
    groups.setdefault(o['grp'], []).append(o)
joined = {}
for g, objs in groups.items():
    for o in objs:
        uv = o.data.uv_layers
        if not len(uv):
            uv.new(name='UVMap')
        while len(uv) > 1:
            uv.remove(uv[-1])
        uv[0].name = 'UVMap'
    activate(objs, objs[0])
    bpy.ops.object.join()
    j = vl.objects.active
    j.name = 'B112_' + g
    j.data.name = 'B112_' + g
    joined[g] = j
prog('juntado', faces={g: len(o.data.polygons) for g, o in joined.items()})

# ---------------------------------------------------------------- 5. segundo UV (lightmap) em SHELL e MOB
for g in ('SHELL', 'MOB'):
    if g not in joined:
        continue
    o = joined[g]
    lm = o.data.uv_layers.new(name='Lightmap')
    o.data.uv_layers.active = lm
    o.data.uv_layers['UVMap'].active_render = True
    activate([o], o)
    bpy.ops.object.mode_set(mode='EDIT')
    bpy.ops.mesh.select_all(action='SELECT')
    # malhas vindas de importação têm cada triângulo solto: sem soldar, o smart project vira poeira de ilhas de 1 px
    bpy.ops.mesh.remove_doubles(threshold=0.0005)
    bpy.ops.mesh.select_all(action='SELECT')
    bpy.ops.uv.smart_project(angle_limit=math.radians(66), island_margin=0.001, area_weight=0.0, correct_aspect=True, scale_to_bounds=True)
    bpy.ops.object.mode_set(mode='OBJECT')
    prog('uv_lightmap', grupo=g)

# texturas a no máximo 1024 px (o GLB precisa caber no 4G)
for img in bpy.data.images:
    if img.size[0] > 1024 and img.source == 'FILE' and not img.name.lower().endswith(('.hdr', '.exr')):
        try:
            w, h = img.size
            s = 1024 / max(w, h)
            img.scale(max(1, int(w * s)), max(1, int(h * s)))
        except Exception:
            pass

# ---------------------------------------------------------------- 6. exporta o GLB (antes dos bakes: já dá para testar no navegador)
prog('exportando')
cams = [o for o in sc.objects if o.type == 'CAMERA']
activate(list(joined.values()) + cams, list(joined.values())[0])
kw = dict(filepath=os.path.join(OUT, 'b112.glb'), export_format='GLB', use_selection=True, export_cameras=True,
          export_lights=False, export_apply=True, export_texcoords=True, export_normals=True, export_yup=True,
          export_draco_mesh_compression_enable=True, export_draco_mesh_compression_level=6,
          export_draco_position_quantization=14, export_draco_normal_quantization=10,
          export_draco_texcoord_quantization=12)
for fmt in ('JPEG', 'AUTO'):
    try:
        bpy.ops.export_scene.gltf(export_image_format=fmt, **kw)
        break
    except TypeError:
        continue
man = {'cams': {c.name: {'lens': c.data.lens, 'sensor': c.data.sensor_width} for c in cams},
       'faces': {g: len(o.data.polygons) for g, o in joined.items()}, 'lm': {}, 'samples': SAMPLES}
json.dump(man, open(os.path.join(OUT, 'manifest.json'), 'w'), ensure_ascii=False, indent=1)
bpy.ops.wm.save_as_mainfile(filepath=os.path.join(OUT, 'b112_web.blend'), copy=True)
prog('glb_pronto', mb=round(os.path.getsize(os.path.join(OUT, 'b112.glb')) / 1e6, 1))

# ---------------------------------------------------------------- 7. baking: irradiância (luz sem cor) dia e noite
sc.render.engine = 'CYCLES'
try:
    sc.cycles.device = 'GPU'
except Exception:
    pass
sc.cycles.samples = SAMPLES
sc.cycles.use_denoising = False
sc.render.bake.margin = 6
try:
    sc.render.bake.margin_type = 'EXTEND'
except Exception:
    pass


def bg_nodes():
    w = sc.world
    return [n for n in w.node_tree.nodes if n.type == 'BACKGROUND'] if w and w.node_tree else []


def emis_mats():
    out = []
    for m in bpy.data.materials:
        if m.users and any(m.name.startswith(k) for k in EMISSIVOS) and m.node_tree:
            b = next((x for x in m.node_tree.nodes if x.type == 'BSDF_PRINCIPLED'), None)
            if b:
                out.append((m, b))
    return out


EMIS = emis_mats()
for m, b in EMIS:   # cor quente padrão quando o material não tinha emissão
    c = b.inputs['Emission Color'].default_value
    if sum(c[:3]) < .05 or b.inputs['Emission Strength'].default_value == 0:
        b.inputs['Emission Color'].default_value = (1, .78, .5, 1)
EMIS_COR = {m.name: list(b.inputs['Emission Color'].default_value[:3]) for m, b in EMIS}


def set_period(p):
    """dia = sol + céu, luzes da casa (coleção LUZ_noite) apagadas, cúpulas sem emissão; noite = o inverso, céu quase apagado."""
    for o in sc.objects:
        if o.type != 'LIGHT':
            continue
        if o.data.type == 'SUN':
            o.hide_render = (p != 'dia')
            o.data.energy = SUN_DIA
        else:
            o.hide_render = (p == 'dia')
    for n in bg_nodes():
        n.inputs['Strength'].default_value = CEU_DIA if p == 'dia' else .015
    for m, b in EMIS:
        b.inputs['Emission Strength'].default_value = 0.0 if p == 'dia' else (6.0 if 'embutido' in m.name else 2.5)


def panorama(p):
    """equirretangular do centro da sala: vira o envMap (reflexos) no navegador."""
    cd = bpy.data.cameras.new('ENV')
    cd.type = 'PANO'
    try:
        cd.panorama_type = 'EQUIRECTANGULAR'
    except Exception:
        cd.cycles.panorama_type = 'EQUIRECTANGULAR'
    c = bpy.data.objects.new('ENV', cd)
    sc.collection.objects.link(c)
    c.location = ENV_POS
    c.rotation_euler = (math.pi / 2, 0, -math.pi / 2)
    sc.camera = c
    r = sc.render
    r.resolution_x, r.resolution_y, r.resolution_percentage = 1024, 512, 100
    sc.cycles.samples = 96
    sc.cycles.use_denoising = True
    r.image_settings.file_format = 'JPEG'
    r.image_settings.quality = 88
    r.filepath = os.path.join(OUT, f'env_{p}.jpg')
    bpy.ops.render.render(write_still=True)
    sc.cycles.use_denoising = False
    man.setdefault('env', {})[p] = f'env_{p}.jpg'
    json.dump(man, open(os.path.join(OUT, 'manifest.json'), 'w'), ensure_ascii=False, indent=1)
    bpy.data.objects.remove(c)


def bake(g, p):
    o = joined[g]
    res = LM_RES[g]
    img = bpy.data.images.new(f'LM_{g}_{p}', res, res, float_buffer=True)
    for slot in o.material_slots:
        m = slot.material
        if not m:
            continue
        try:
            m.use_nodes = True
        except Exception:
            pass
        nt = m.node_tree
        nd = nt.nodes.get('LM_BAKE') or nt.nodes.new('ShaderNodeTexImage')
        nd.name = 'LM_BAKE'
        nd.image = img
        for x in nt.nodes:
            x.select = False
        nd.select = True
        nt.nodes.active = nd
    o.data.uv_layers.active = o.data.uv_layers['Lightmap']
    activate([o], o)
    bpy.ops.object.bake(type='DIFFUSE', pass_filter={'DIRECT', 'INDIRECT'}, use_clear=True, target='IMAGE_TEXTURES')
    px = np.empty(res * res * 4, dtype=np.float32)
    img.pixels.foreach_get(px)
    rgb = px.reshape(-1, 4)[:, :3]
    lum = rgb @ np.array([.2126, .7152, .0722], dtype=np.float32)
    ref = float(np.percentile(lum[lum > 1e-5], 99.5)) if np.any(lum > 1e-5) else 1.0
    k = 1.0 / max(ref, 1e-4)
    out = np.clip(rgb * k, 0, 1) ** (1 / 2.2)
    b = bpy.data.images.new(f'LM8_{g}_{p}', res, res, alpha=False)
    b.colorspace_settings.name = 'Non-Color'
    flat = np.concatenate([out, np.ones((out.shape[0], 1), np.float32)], 1).ravel()
    b.pixels.foreach_set(flat)
    b.filepath_raw = os.path.join(OUT, f'lm_{g}_{p}.png')
    b.file_format = 'PNG'
    b.save()
    man['lm'][f'{g}_{p}'] = {'arquivo': f'lm_{g}_{p}.png', 'k': k}
    json.dump(man, open(os.path.join(OUT, 'manifest.json'), 'w'), ensure_ascii=False, indent=1)
    PROG['feito'].append(f'{g}_{p}')


man['emissivos'] = EMIS_COR
try:
    for p in ('dia', 'noite'):
        set_period(p)
        for g in ('SHELL', 'MOB'):
            if g in joined:
                prog('bake', atual=f'{g}_{p}')
                bake(g, p)
        prog('panorama', atual=p)
        panorama(p)
    set_period('dia')
    prog('fim')
except Exception as e:
    import traceback
    PROG['erro'] = traceback.format_exc()[-1500:]
    prog('erro')
