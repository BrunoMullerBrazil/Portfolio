# Remontagem 03 (chat 16/out, turno 37 -> v4): texturas PBR nos materiais, HDRI belfast + sol alinhado,
# importa LOD0/LOD1 das árvores e instancia nos pontos blv_tree_points (gerados por blender_site.py) + árvores da avenida.
import bpy, os, math, random, numpy as np
from mathutils import Vector
scn = bpy.data.scenes["Boulevard"]
A = os.path.expanduser("~/Movies/Boulevard_3D/assets")
def srgb(h):
    c = [((h >> s) & 255)/255 for s in (16, 8, 0)]
    return tuple((v/12.92 if v <= .04045 else ((v+.055)/1.055)**2.4) for v in c)+(1,)
def img(p, color=True):
    i = bpy.data.images.get(os.path.basename(p)) or bpy.data.images.load(p)
    if not color: i.colorspace_settings.name = 'Non-Color'
    return i
def tex_mat(name, tex, size=2., tint=None, tintk=1., bump=1., rough_add=0.):
    m = bpy.data.materials.get(name)
    if m is None: return None
    nt = m.node_tree; nt.nodes.clear(); L = nt.links.new
    out = nt.nodes.new('ShaderNodeOutputMaterial'); b = nt.nodes.new('ShaderNodeBsdfPrincipled'); L(b.outputs[0], out.inputs[0])
    tc = nt.nodes.new('ShaderNodeTexCoord'); mp = nt.nodes.new('ShaderNodeMapping'); mp.inputs['Scale'].default_value = (1/size,)*3
    L(tc.outputs['Object'], mp.inputs['Vector'])
    def it(kind, color):
        p = f"{A}/tex/{tex}/{tex}_{kind}.jpg"
        if not os.path.exists(p): return None
        n = nt.nodes.new('ShaderNodeTexImage'); n.image = img(p, color); n.projection = 'BOX'; n.projection_blend = .25; L(mp.outputs[0], n.inputs['Vector']); return n
    d = it('diff', True); r = it('rough', False); nm = it('nor', False)
    if d:
        if tint:
            mx = nt.nodes.new('ShaderNodeMix'); mx.data_type = 'RGBA'; mx.blend_type = 'MULTIPLY'; mx.inputs['Factor'].default_value = tintk
            ins = [s for s in mx.inputs if s.type == 'RGBA']; L(d.outputs[0], ins[0]); ins[1].default_value = srgb(tint)
            L([s for s in mx.outputs if s.type == 'RGBA'][0], b.inputs['Base Color'])
        else: L(d.outputs[0], b.inputs['Base Color'])
    if r:
        if rough_add:
            ma = nt.nodes.new('ShaderNodeMath'); ma.operation = 'ADD'; ma.use_clamp = True; ma.inputs[1].default_value = rough_add; L(r.outputs[0], ma.inputs[0]); L(ma.outputs[0], b.inputs['Roughness'])
        else: L(r.outputs[0], b.inputs['Roughness'])
    if nm:
        nmap = nt.nodes.new('ShaderNodeNormalMap'); nmap.inputs['Strength'].default_value = bump; L(nm.outputs[0], nmap.inputs['Color']); L(nmap.outputs[0], b.inputs['Normal'])
    return m
done = []
for name, tex, size, tint, k in [
    ("BLV_Reboco_Claro", "white_plaster_02", 2.5, 0xd8d8d4, 1.), ("BLV_Reboco_Grafite", "grey_plaster", 2.5, 0x5a5f67, 1.),
    ("BLV_Reboco_Nucleo", "white_plaster_02", 2.5, 0xc8c8c3, 1.), ("BLV_Laje", "white_plaster_02", 2., 0xe6e5e0, 1.),
    ("BLV_Muro", "white_plaster_02", 2.5, 0xe2ddd2, 1.), ("BLV_Lojas_Superior", "grey_plaster", 2.5, 0x9a9da2, 1.),
    ("BLV_Asfalto", "asphalt_02", 4., None, 1.), ("BLV_Estacionamento", "asphalt_02", 4., 0xb8b8b8, 1.),
    ("BLV_Calcada", "large_floor_tiles_02", 2., None, 1.), ("BLV_Piso_Torres", "concrete_floor_02", 3., None, 1.),
    ("BLV_Gramado", "leafy_grass", 2., None, 1.), ("BLV_Canteiro", "leafy_grass", 2., None, 1.),
    ("BLV_Deck", "concrete_floor_02", 2., 0xd9c7a8, 1.)]:
    if tex_mat(name, tex, size, tint, k): done.append(name)
# v5: tinta menos pesada no reboco claro
for n in ("BLV_Reboco_Claro", "BLV_Reboco_Nucleo", "BLV_Laje", "BLV_Muro"):
    for nd in bpy.data.materials[n].node_tree.nodes:
        if nd.type == 'MIX': nd.inputs['Factor'].default_value = .35

# mundo HDRI + sol alinhado ao pico do HDRI, rumo 248° (frame do site)
def set_sky(path, az_deg=248., energy=3.0):
    hi = img(path); w, h = hi.size
    px = np.empty(w*h*4, dtype=np.float32); hi.pixels.foreach_get(px); px = px.reshape(h, w, 4)
    lum = px[..., 0]*.2126+px[..., 1]*.7152+px[..., 2]*.0722; iy, ix = np.unravel_index(np.argmax(lum), lum.shape)
    u = (ix+.5)/w; v = (iy+.5)/h; phi = (u-.5)*2*math.pi; th = (v-.5)*math.pi
    d = Vector((-math.cos(phi)*math.cos(th), math.sin(phi)*math.cos(th), math.sin(th)))
    el, az = max(th, math.radians(2)), math.radians(az_deg)
    want = Vector((-math.cos(az)*math.cos(el), math.sin(az)*math.cos(el), math.sin(el)))
    rot = math.atan2(want.y, want.x)-math.atan2(d.y, d.x)
    wn = scn.world.node_tree; wn.nodes.clear(); L = wn.links.new
    tc = wn.nodes.new('ShaderNodeTexCoord'); mp = wn.nodes.new('ShaderNodeMapping'); mp.inputs['Rotation'].default_value = (0, 0, -rot)
    env = wn.nodes.new('ShaderNodeTexEnvironment'); env.image = hi; bg = wn.nodes.new('ShaderNodeBackground'); bg.inputs['Strength'].default_value = 1.
    o = wn.nodes.new('ShaderNodeOutputWorld'); L(tc.outputs['Generated'], mp.inputs['Vector']); L(mp.outputs[0], env.inputs['Vector']); L(env.outputs[0], bg.inputs[0]); L(bg.outputs[0], o.inputs[0])
    sun = scn.objects["BLV_Sol"]; sun.rotation_euler = want.to_track_quat('Z', 'Y').to_euler()
    rgb = px[iy, ix, :3]/max(px[iy, ix, :3].max(), 1e-6); sun.data.color = tuple(float(c) for c in rgb); sun.data.energy = energy
    return round(math.degrees(th), 1)
sun_el = set_sky(f"{A}/hdri/kiara_1_dawn_4k.hdr")     # v5 trocou belfast -> kiara_1_dawn
scn.view_settings.exposure = 1.0

# árvores Poly Haven: coleções LOD0/LOD1 de cada modelo
R = f"{A}/models"
for m in ["jacaranda_tree", "island_tree_01", "island_tree_02", "tree_small_02"]:
    for lod in ("LOD0", "LOD1"):
        cn = f"{m}_{lod}"
        if cn not in bpy.data.collections:
            with bpy.data.libraries.load(f"{R}/{m}/{m}.blend", link=False) as (src, dst): dst.collections = [cn]
C = bpy.data.collections.get("BLV_Vegetacao")
for o in list(C.objects): bpy.data.objects.remove(o, do_unlink=True)
rng = random.Random(5); cam = scn.objects["BLV_Cam_Abertura"].location
choices = [("island_tree_01", (1.7, 2.5), .38), ("island_tree_02", (2.2, 3.2), .27), ("tree_small_02", (1.7, 2.5), .27), ("jacaranda_tree", (.45, .65), .08)]
def pick():
    r = rng.random(); a = 0
    for c in choices:
        a += c[2]
        if r <= a: return c
    return choices[0]
n = 0
for (x, z, sc, y) in scn["blv_tree_points"]:
    m, (s0, s1), _ = pick(); p = Vector((x, -z, y))
    if (p-cam).length < 22: continue
    e = bpy.data.objects.new(f"BLV_arv_{n:04d}", None); e.instance_type = 'COLLECTION'
    e.instance_collection = bpy.data.collections[f"{m}_{'LOD0' if (p-cam).length < 220 else 'LOD1'}"]
    s = rng.uniform(s0, s1)*sc; e.location = p; e.scale = (s, s, s*rng.uniform(.9, 1.1)); e.rotation_euler[2] = rng.random()*6.283
    e.empty_display_size = .5; C.objects.link(e); n += 1
for side in (-1, 1):   # avenida: fileira de árvores de rua
    for x in range(-150, 160, 13):
        if rng.random() < .2: continue
        zz = (856-400)*.1015+side*12.2
        m, (s0, s1), _ = choices[2] if rng.random() < .6 else choices[0]
        p = Vector((x+rng.uniform(-1.5, 1.5), -zz, 0.15))
        e = bpy.data.objects.new(f"BLV_arv_rua_{n:04d}", None); e.instance_type = 'COLLECTION'
        e.instance_collection = bpy.data.collections[f"{m}_{'LOD0' if (p-cam).length < 220 else 'LOD1'}"]
        s = rng.uniform(s0, s1)*.85; e.location = p; e.scale = (s, s, s); e.rotation_euler[2] = rng.random()*6.283; C.objects.link(e); n += 1
# boulder da rotatória (sem árvore no meio da rótula)
bp = f"{R}/boulder_01/boulder_01.blend"
if os.path.exists(bp) and "BLV_rocha_rotatoria" not in bpy.data.objects:
    with bpy.data.libraries.load(bp) as (src, dst): dst.objects = [o for o in src.objects if o.endswith('LOD0') or 'LOD' not in o][:1]
    rock = dst.objects[0]; C.objects.link(rock); rock.name = "BLV_rocha_rotatoria"
    s = 2.2/max(rock.dimensions); SITE = .1015
    rock.scale = (s*1.2, s, s); rock.location = ((300-1250)*SITE, -(745-400)*SITE, .35)
# v6: ilha da rotatória/canteiro em verde (textura leafy_grass saía bege)
nt = bpy.data.materials["BLV_Canteiro"].node_tree; b = nt.nodes.get('Principled BSDF')
imgs = [nd for nd in nt.nodes if nd.type == 'TEX_IMAGE' and nd.image and 'diff' in nd.image.name]
for nd in [nd for nd in nt.nodes if nd.type == 'MIX']: nt.nodes.remove(nd)
if imgs:
    mx = nt.nodes.new('ShaderNodeMix'); mx.data_type = 'RGBA'; mx.blend_type = 'MULTIPLY'; mx.inputs['Factor'].default_value = .85
    ins = [s_ for s_ in mx.inputs if s_.type == 'RGBA']; nt.links.new(imgs[0].outputs[0], ins[0]); ins[1].default_value = (.16, .30, .06, 1)
    nt.links.new([s_ for s_ in mx.outputs if s_.type == 'RGBA'][0], b.inputs['Base Color'])
result = {"textured": done, "sun_el": sun_el, "trees": n}
