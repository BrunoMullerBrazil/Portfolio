# Boulevard em 3D -> pacote de realismo (quadro herói): céu fotográfico com nuvens + sol rasante,
# cantos chanfrados (bevel), janelas com profundidade (cômodo por HDRI de interior, efeito paralaxe),
# asfalto levemente úmido, brilho nas luzes e mais amostras. Rodar depois dos demais scripts.
import bpy, os, math, glob, random
import numpy as np
from mathutils import Vector

scn = bpy.data.scenes["Boulevard"]
A = os.path.expanduser("~/Movies/Boulevard_3D/assets/hdri")
SKY = f"{A}/the_sky_is_on_fire_4k.hdr"
SUN_AZ, SUN_EL = 255., 5.5        # pôr do sol (rumo/altura em graus, no referencial do site)

def img(p, noncolor=False):
    i = bpy.data.images.get(os.path.basename(p)) or bpy.data.images.load(p)
    if noncolor: i.colorspace_settings.name = 'Non-Color'
    return i

# ---------- céu fotográfico + sol alinhado ----------
hi = img(SKY); w, h = hi.size
px = np.empty(w*h*4, dtype=np.float32); hi.pixels.foreach_get(px); px = px.reshape(h, w, 4)
lum = px[..., 0]*.2126+px[..., 1]*.7152+px[..., 2]*.0722
iy, ix = np.unravel_index(np.argmax(lum), lum.shape); u = (ix+.5)/w; v = (iy+.5)/h
phi = (u-.5)*2*math.pi; th = (v-.5)*math.pi
d = Vector((-math.cos(phi)*math.cos(th), math.sin(phi)*math.cos(th), math.sin(th)))
el, az = math.radians(SUN_EL), math.radians(SUN_AZ)
want = Vector((-math.cos(az)*math.cos(el), math.sin(az)*math.cos(el), math.sin(el)))
rot = math.atan2(want.y, want.x)-math.atan2(d.y, d.x)
wn = scn.world.node_tree; N = wn.nodes; L = wn.links.new
env = [n for n in N if n.type == 'TEX_ENVIRONMENT']
env = env[0] if env else N.new('ShaderNodeTexEnvironment')
env.image = hi
mp = [n for n in N if n.type == 'MAPPING']
mp = mp[0] if mp else N.new('ShaderNodeMapping')
tc = [n for n in N if n.type == 'TEX_COORD']
tc = tc[0] if tc else N.new('ShaderNodeTexCoord')
L(tc.outputs['Generated'], mp.inputs['Vector']); L(mp.outputs[0], env.inputs['Vector']); mp.inputs['Rotation'].default_value = (0, 0, -rot)
bg = [n for n in N if n.type == 'BACKGROUND'][0]; L(env.outputs[0], bg.inputs['Color']); bg.inputs['Strength'].default_value = 1.
sun = scn.objects["BLV_Sol"]; sun.hide_render = False
sun.rotation_euler = want.to_track_quat('Z', 'Y').to_euler()
rgb = px[iy, ix, :3]/max(px[iy, ix, :3].max(), 1e-6)
sun.data.color = tuple(float(c) for c in rgb); sun.data.energy = 4.5; sun.data.angle = math.radians(.8)

# ---------- cantos chanfrados (bevel no shader) ----------
def add_bevel(m, radius=.012):
    nt = m.node_tree; b = nt.nodes.get('Principled BSDF')
    if not b or nt.nodes.get('BLV_BEVEL'): return
    bv = nt.nodes.new('ShaderNodeBevel'); bv.name = 'BLV_BEVEL'; bv.samples = 6; bv.inputs['Radius'].default_value = radius
    lk = [l for l in nt.links if l.to_socket == b.inputs['Normal']]
    if lk:
        src = lk[0].from_socket; nt.links.remove(lk[0]); nt.links.new(src, bv.inputs['Normal'])
    nt.links.new(bv.outputs[0], b.inputs['Normal'])
for n in ("BLV_Reboco_Claro", "BLV_Reboco_Grafite", "BLV_Reboco_Nucleo", "BLV_Laje", "BLV_Muro", "BLV_Pintura_Branca",
          "BLV_Lojas_Superior", "BLV_Pilar", "BLV_Telha_Metalica"):
    if n in bpy.data.materials: add_bevel(bpy.data.materials[n], .015)
for n in ("BLV_Aluminio", "BLV_Caixilho_Lojas", "BLV_Friso_Amarelo"):
    if n in bpy.data.materials: add_bevel(bpy.data.materials[n], .006)

# ---------- janelas com profundidade: cômodo vindo de HDRIs de interior, girado por unidade ----------
rooms = sorted(glob.glob(f"{A}/indoor_*_1k.hdr"))
m = bpy.data.materials["BLV_Interior"]; nt = m.node_tree; Nd = nt.nodes; Lk = nt.links.new
if rooms and not Nd.get('ROOM0'):
    oi = [n for n in Nd if n.type == 'OBJECT_INFO'][0]
    geo = Nd.new('ShaderNodeNewGeometry')
    neg = Nd.new('ShaderNodeVectorMath'); neg.operation = 'SCALE'; neg.inputs['Scale'].default_value = -1.
    Lk(geo.outputs['Incoming'], neg.inputs[0])
    rot = Nd.new('ShaderNodeVectorRotate'); rot.rotation_type = 'Z_AXIS'
    rr = Nd.new('ShaderNodeMath'); rr.operation = 'MULTIPLY'; rr.inputs[1].default_value = 6.283
    Lk(oi.outputs['Random'], rr.inputs[0]); Lk(rr.outputs[0], rot.inputs['Angle']); Lk(neg.outputs[0], rot.inputs['Vector'])
    cols = []
    for i, p in enumerate(rooms[:3]):
        e = Nd.new('ShaderNodeTexEnvironment'); e.name = f'ROOM{i}'; e.image = img(p); Lk(rot.outputs[0], e.inputs['Vector']); cols.append(e.outputs[0])
    # escolhe o cômodo por unidade
    sel = cols[0]
    for i in range(1, len(cols)):
        cmp = Nd.new('ShaderNodeMath'); cmp.operation = 'GREATER_THAN'; cmp.inputs[1].default_value = i/len(cols)
        Lk(oi.outputs['Random'], cmp.inputs[0])
        mx = Nd.new('ShaderNodeMix'); mx.data_type = 'RGBA'
        ins = [s for s in mx.inputs if s.type == 'RGBA']; Lk(cmp.outputs[0], mx.inputs['Factor']); Lk(sel, ins[0]); Lk(cols[i], ins[1])
        sel = [s for s in mx.outputs if s.type == 'RGBA'][0]
    # cortina: parte das unidades com cortina clara translúcida na frente do cômodo
    cur = Nd.new('ShaderNodeMath'); cur.operation = 'GREATER_THAN'; cur.inputs[1].default_value = .7
    fr = Nd.new('ShaderNodeMath'); fr.operation = 'FRACT'; mul = Nd.new('ShaderNodeMath'); mul.operation = 'MULTIPLY'; mul.inputs[1].default_value = 7.
    Lk(oi.outputs['Random'], mul.inputs[0]); Lk(mul.outputs[0], fr.inputs[0]); Lk(fr.outputs[0], cur.inputs[0])
    cm = Nd.new('ShaderNodeMix'); cm.data_type = 'RGBA'; ci = [s for s in cm.inputs if s.type == 'RGBA']
    ff = Nd.new('ShaderNodeMath'); ff.operation = 'MULTIPLY'; ff.inputs[1].default_value = .75; Lk(cur.outputs[0], ff.inputs[0]); Lk(ff.outputs[0], cm.inputs['Factor'])
    Lk(sel, ci[0]); ci[1].default_value = (.78, .72, .62, 1)
    room = [s for s in cm.outputs if s.type == 'RGBA'][0]
    # apagado: o cômodo aparece fraco (luz do dia que entra); aceso: o cômodo vira a própria luz
    dif = [n for n in Nd if n.type == 'BSDF_DIFFUSE'][0]
    dm = Nd.new('ShaderNodeMix'); dm.data_type = 'RGBA'; dm.blend_type = 'MULTIPLY'; dm.inputs['Factor'].default_value = 1.
    di = [s for s in dm.inputs if s.type == 'RGBA']; Lk(room, di[0]); di[1].default_value = (.06, .055, .05, 1)
    Lk([s for s in dm.outputs if s.type == 'RGBA'][0], dif.inputs['Color'])
    em = [n for n in Nd if n.type == 'EMISSION'][0]
    bb = [n for n in Nd if n.type == 'BLACKBODY'][0]
    tm = Nd.new('ShaderNodeMix'); tm.data_type = 'RGBA'; tm.blend_type = 'MULTIPLY'; tm.inputs['Factor'].default_value = 1.
    ti = [s for s in tm.inputs if s.type == 'RGBA']; Lk(room, ti[0]); Lk(bb.outputs[0], ti[1])
    Lk([s for s in tm.outputs if s.type == 'RGBA'][0], em.inputs['Color'])
    mulE = [n for n in Nd if n.type == 'MATH' and n.operation == 'MULTIPLY' and abs(n.inputs[1].default_value-7.) < .01]
    if mulE: mulE[0].inputs[1].default_value = 3.5

# ---------- vidro: reflexo com leve ondulação ----------
g = bpy.data.materials["BLV_Vidro"].node_tree
for n in g.nodes:
    if n.type == 'BSDF_GLOSSY': n.inputs['Roughness'].default_value = .03
    if n.type == 'LAYER_WEIGHT': n.inputs['Blend'].default_value = .28

# ---------- asfalto levemente úmido (manchas mais lisas que refletem as luzes) ----------
a = bpy.data.materials["BLV_Asfalto"]; nt = a.node_tree; b = nt.nodes['Principled BSDF']
if not nt.nodes.get('WET'):
    t = nt.nodes.new('ShaderNodeTexCoord'); nz = nt.nodes.new('ShaderNodeTexNoise'); nz.name = 'WET'; nz.inputs['Scale'].default_value = .08; nz.inputs['Detail'].default_value = 4
    nt.links.new(t.outputs['Object'], nz.inputs['Vector'])
    mr = nt.nodes.new('ShaderNodeMapRange'); mr.inputs['From Min'].default_value = .5; mr.inputs['From Max'].default_value = .62
    mr.inputs['To Min'].default_value = .78; mr.inputs['To Max'].default_value = .18
    nt.links.new(nz.outputs['Fac'], mr.inputs['Value'])
    lk = [l for l in nt.links if l.to_socket == b.inputs['Roughness']]
    for l in lk: nt.links.remove(l)
    nt.links.new(mr.outputs[0], b.inputs['Roughness'])

# ---------- luz interior acesa (proporção de noite comum), lojas e postes ----------
it = bpy.data.materials["BLV_Interior"].node_tree
it.nodes["LIGHTS"].outputs[0].default_value = 1.; it.nodes["GATE"].inputs[1].default_value = .5
lg = bpy.data.materials.get("BLV_Luminaria_Luz")
if lg: lg.node_tree.nodes['Principled BSDF'].inputs['Emission Strength'].default_value = 12.

# ---------- render ----------
cy = scn.cycles; cy.samples = 384; cy.use_denoising = True; cy.max_bounces = 10; cy.glossy_bounces = 6; cy.transparent_max_bounces = 12
scn.view_settings.view_transform = 'AgX'
try: scn.view_settings.look = 'AgX - Punchy'
except Exception: pass
scn.view_settings.exposure = .4
scn.render.resolution_x, scn.render.resolution_y, scn.render.resolution_percentage = 1920, 1080, 100
# brilho nas luzes (compositor), se disponível nesta versão
try:
    scn.use_nodes = True
    ntc = scn.node_tree if getattr(scn, 'node_tree', None) else None
    if ntc is not None and not ntc.nodes.get('BLV_GLARE'):
        rl = [n for n in ntc.nodes if n.type == 'R_LAYERS'][0]; co = [n for n in ntc.nodes if n.type == 'COMPOSITE'][0]
        gl = ntc.nodes.new('CompositorNodeGlare'); gl.name = 'BLV_GLARE'; gl.glare_type = 'FOG_GLOW'; gl.threshold = 1.2; gl.size = 7
        ntc.links.new(rl.outputs['Image'], gl.inputs['Image']); ntc.links.new(gl.outputs['Image'], co.inputs['Image'])
    glare = 'ok' if ntc is not None else 'sem node_tree'
except Exception as e:
    glare = f'pulado: {e}'
result = dict(sun_from_hdri_elev=round(math.degrees(th), 1), rooms=[os.path.basename(r) for r in rooms[:3]], glare=glare)
