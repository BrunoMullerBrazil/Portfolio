# Boulevard em 3D -> realismo, 2ª rodada (quadro herói v2)
# Céu puro (sem prédios da foto), sol mais baixo, gramado texturizado com moitas no primeiro plano,
# mata com mais variedade e sub-bosque, árvores entre as casas do morro.
import bpy, os, math, random
import numpy as np
from mathutils import Vector

scn = bpy.data.scenes["Boulevard"]; rng = random.Random(41)
A = os.path.expanduser("~/Movies/Boulevard_3D/assets")
dg = bpy.context.evaluated_depsgraph_get()
def ground(x, y):
    hit, loc, *_ = scn.ray_cast(dg, Vector((x, y, 2000.)), Vector((0, 0, -1)))
    return loc.z if hit else 0.

# ---------- céu puro + sol baixo ----------
SKY = f"{A}/hdri/industrial_sunset_puresky_4k.hdr"
hi = bpy.data.images.get(os.path.basename(SKY)) or bpy.data.images.load(SKY)
w, h = hi.size; px = np.empty(w*h*4, dtype=np.float32); hi.pixels.foreach_get(px); px = px.reshape(h, w, 4)
lum = px[..., 0]*.2126+px[..., 1]*.7152+px[..., 2]*.0722
iy, ix = np.unravel_index(np.argmax(lum), lum.shape); u = (ix+.5)/w; v = (iy+.5)/h
phi = (u-.5)*2*math.pi; th = (v-.5)*math.pi
d = Vector((-math.cos(phi)*math.cos(th), math.sin(phi)*math.cos(th), math.sin(th)))
el, az = math.radians(3.), math.radians(255.)
want = Vector((-math.cos(az)*math.cos(el), math.sin(az)*math.cos(el), math.sin(el)))
rot = math.atan2(want.y, want.x)-math.atan2(d.y, d.x)
wn = scn.world.node_tree
[n for n in wn.nodes if n.type == 'TEX_ENVIRONMENT'][0].image = hi
[n for n in wn.nodes if n.type == 'MAPPING'][0].inputs['Rotation'].default_value = (0, 0, -rot)
sun = scn.objects["BLV_Sol"]; sun.rotation_euler = want.to_track_quat('Z', 'Y').to_euler()
rgb = px[iy, ix, :3]/max(px[iy, ix, :3].max(), 1e-6); sun.data.color = tuple(float(c) for c in rgb); sun.data.energy = 5.

# ---------- terreno: gramado fotográfico (textura) por baixo da variação de cor ----------
tm = bpy.data.materials["BLV_Terreno"]; nt = tm.node_tree
if not nt.nodes.get('GRASS_TEX'):
    p = f"{A}/tex/leafy_grass/leafy_grass_diff.jpg"
    ti = nt.nodes.new('ShaderNodeTexImage'); ti.name = 'GRASS_TEX'; ti.image = bpy.data.images.get(os.path.basename(p)) or bpy.data.images.load(p)
    ti.projection = 'BOX'; tc = nt.nodes.new('ShaderNodeTexCoord'); mp = nt.nodes.new('ShaderNodeMapping'); mp.inputs['Scale'].default_value = (1/3.,)*3
    nt.links.new(tc.outputs['Object'], mp.inputs['Vector']); nt.links.new(mp.outputs[0], ti.inputs['Vector'])
    grass = [n for n in nt.nodes if n.type == 'VALTORGB'][0]
    tgt = [l.to_socket for l in nt.links if l.from_node == grass]
    mx = nt.nodes.new('ShaderNodeMix'); mx.data_type = 'RGBA'; mx.blend_type = 'MULTIPLY'; mx.inputs['Factor'].default_value = 1.
    mi = [s for s in mx.inputs if s.type == 'RGBA']; nt.links.new(ti.outputs[0], mi[0]); nt.links.new(grass.outputs[0], mi[1])
    br = nt.nodes.new('ShaderNodeMath'); br.operation = 'MULTIPLY'
    out = [s for s in mx.outputs if s.type == 'RGBA'][0]
    gm = nt.nodes.new('ShaderNodeMix'); gm.data_type = 'RGBA'; gm.blend_type = 'MULTIPLY'; gm.inputs['Factor'].default_value = 1.
    gi = [s for s in gm.inputs if s.type == 'RGBA']; nt.links.new(out, gi[0]); gi[1].default_value = (4., 4., 3.6, 1)   # compensa o escurecimento
    for s in tgt: nt.links.new([o for o in gm.outputs if o.type == 'RGBA'][0], s)
    grass.color_ramp.elements[0].color = (.20, .26, .12, 1); grass.color_ramp.elements[-1].color = (.30, .32, .17, 1)
    for e in grass.color_ramp.elements[1:-1]: e.color = (.36, .30, .18, 1)

# ---------- vegetação ----------
C = bpy.data.collections["BLV_Vegetacao"]
for o in list(C.objects):
    if o.name.startswith(("BLV_moita_", "BLV_subbosque_", "BLV_arv_morro_")): bpy.data.objects.remove(o, do_unlink=True)
shrubs = [o for o in bpy.data.collections["shrub_01_LOD0"].all_objects if o.type == 'MESH']
def moita(name, x, y, s):
    z = ground(x, y)
    for k in range(rng.randint(3, 6)):
        o = bpy.data.objects.new(name, rng.choice(shrubs).data)
        o.location = (x+rng.uniform(-.8, .8), y+rng.uniform(-.8, .8), z-.05); sc = s*rng.uniform(.7, 1.3)
        o.scale = (sc, sc, sc*rng.uniform(.8, 1.4)); o.rotation_euler[2] = rng.random()*6.28; C.objects.link(o)
cam = scn.camera; cl = cam.location; fwd = (cam.matrix_world.to_quaternion() @ Vector((0, 0, -1))); fwd.z = 0; fwd.normalize()
AVY = -(856-400)*.1015
# moitas e touceiras no primeiro plano da câmera (fora da avenida)
n = 0
for i in range(900):
    dist = rng.uniform(8, 90); ang = rng.uniform(-.7, .7)
    dd = Vector((fwd.x*math.cos(ang)-fwd.y*math.sin(ang), fwd.x*math.sin(ang)+fwd.y*math.cos(ang), 0))
    p = cl+dd*dist
    if abs(p.y-AVY) < 15: continue
    moita(f"BLV_moita_{n:03d}", p.x, p.y, rng.uniform(3., 6.) if dist > 25 else rng.uniform(2., 3.5)); n += 1
    if n >= 220: break
# sub-bosque na borda da mata (lado da avenida)
for i in range(160):
    x = rng.uniform(-110, 130); y = AVY+rng.uniform(13.5, 19)
    moita(f"BLV_subbosque_{i:03d}", x, y, rng.uniform(3.5, 6.))
# mata com mais variedade: troca parte das árvores e espalha as escalas
spec = ["island_tree_01", "island_tree_02", "tree_small_02", "jacaranda_tree"]
for o in C.objects:
    if o.name.startswith("BLV_arv_") and o.instance_collection and rng.random() < .45:
        lod = o.instance_collection.name.rsplit('_', 1)[1]; sp = rng.choices(spec, weights=(3, 2, 4, 1))[0]
        o.instance_collection = bpy.data.collections[f"{sp}_{lod}"]
        base = {"island_tree_01": 2.1, "island_tree_02": 2.7, "tree_small_02": 2.2, "jacaranda_tree": .55}[sp]
        s = base*rng.uniform(.7, 1.45); o.scale = (s, s, s*rng.uniform(.85, 1.2)); o.rotation_euler[0] = rng.uniform(-.06, .06)
# árvores entre as casas do morro (lado esquerdo do quadro), assentadas no relevo por raio
nm = 0
for i in range(2500):
    x = rng.uniform(-720, -140); y = rng.uniform(-60, 540)
    z = ground(x, y)
    if z < 4 or rng.random() < .35: continue
    e = bpy.data.objects.new(f"BLV_arv_morro_{nm:03d}", None); e.instance_type = 'COLLECTION'
    e.instance_collection = bpy.data.collections[f"{rng.choice(spec[:3])}_LOD1"]; s = rng.uniform(1.8, 3.)
    e.location = (x, y, z-.2); e.scale = (s, s, s); e.rotation_euler[2] = rng.random()*6.28; C.objects.link(e); nm += 1
    if nm >= 700: break
result = dict(sun_hdri_elev=round(math.degrees(th), 1), moitas=n, morro=nm)
