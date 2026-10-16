# Boulevard em 3D -> casas do bairro com cara de casa (rodar depois de blender_site.py)
# Lê as caixas das casas já geradas, acrescenta janelas, porta e muro de divisa; texturiza paredes e telhados.
import bpy, math, random, os
from mathutils import Vector

scn = bpy.data.scenes["Boulevard"]
rng = random.Random(33)
A = os.path.expanduser("~/Movies/Boulevard_3D/assets/tex")
C = bpy.data.collections.get("BLV_Bairro_Detalhe") or bpy.data.collections.new("BLV_Bairro_Detalhe")
if C.name not in scn.collection.children: scn.collection.children.link(C)
for o in list(C.objects): bpy.data.objects.remove(o, do_unlink=True)

def img(p, color=True):
    i = bpy.data.images.get(os.path.basename(p)) or bpy.data.images.load(p)
    if not color: i.colorspace_settings.name = 'Non-Color'
    return i
def tex_tint(m, tex, size, rgba, k=.75, bump=.6):
    nt = m.node_tree; nt.nodes.clear(); L = nt.links.new
    out = nt.nodes.new('ShaderNodeOutputMaterial'); b = nt.nodes.new('ShaderNodeBsdfPrincipled'); L(b.outputs[0], out.inputs[0])
    tc = nt.nodes.new('ShaderNodeTexCoord'); mp = nt.nodes.new('ShaderNodeMapping'); mp.inputs['Scale'].default_value = (1/size,)*3
    L(tc.outputs['Object'], mp.inputs['Vector'])
    def it(kind, color):
        p = f"{A}/{tex}/{tex}_{kind}.jpg"
        if not os.path.exists(p): return None
        n = nt.nodes.new('ShaderNodeTexImage'); n.image = img(p, color); n.projection = 'BOX'; n.projection_blend = .2; L(mp.outputs[0], n.inputs['Vector']); return n
    d, r, nm = it('diff', True), it('rough', False), it('nor', False)
    if d:
        mx = nt.nodes.new('ShaderNodeMix'); mx.data_type = 'RGBA'; mx.blend_type = 'MULTIPLY'; mx.inputs['Factor'].default_value = k
        ins = [s for s in mx.inputs if s.type == 'RGBA']; L(d.outputs[0], ins[0]); ins[1].default_value = rgba
        L([s for s in mx.outputs if s.type == 'RGBA'][0], b.inputs['Base Color'])
    else: b.inputs['Base Color'].default_value = rgba
    if r: L(r.outputs[0], b.inputs['Roughness'])
    if nm:
        nmap = nt.nodes.new('ShaderNodeNormalMap'); nmap.inputs['Strength'].default_value = bump; L(nm.outputs[0], nmap.inputs['Color']); L(nmap.outputs[0], b.inputs['Normal'])

# texturas: paredes com reboco tingido; telhados cerâmicos (ou cinza) com textura real
for m in bpy.data.materials:
    if m.name.startswith("BLV_Casa_Parede_"):
        base = tuple(m.node_tree.nodes['Principled BSDF'].inputs['Base Color'].default_value) if 'Principled BSDF' in m.node_tree.nodes else (.8, .8, .8, 1)
        m["base"] = list(m.get("base", base)); tex_tint(m, "white_plaster_02", 2.5, tuple(m["base"]), .85, .4)
    if m.name.startswith("BLV_Casa_Telhado_"):
        base = tuple(m.node_tree.nodes['Principled BSDF'].inputs['Base Color'].default_value) if 'Principled BSDF' in m.node_tree.nodes else (.5, .3, .2, 1)
        m["base"] = list(m.get("base", base)); grey = abs(m["base"][0]-m["base"][2]) < .05
        tex_tint(m, "ceramic_roof_01" if grey else "clay_roof_tiles_02", 2., tuple(m["base"]), .55 if not grey else .8, .8)
g = bpy.data.materials.get("BLV_Galpao")
if g and os.path.exists(f"{A}/corrugated_iron/corrugated_iron_diff.jpg"): tex_tint(g, "corrugated_iron", 3., (.75, .77, .8, 1), .6, .8)
# a pasta das texturas de casa vem de assets/tex
def win_mat():
    m = bpy.data.materials.get("BLV_Casa_Janela") or bpy.data.materials.new("BLV_Casa_Janela")
    m.use_nodes = True; nt = m.node_tree; nt.nodes.clear(); L = nt.links.new
    out = nt.nodes.new('ShaderNodeOutputMaterial'); b = nt.nodes.new('ShaderNodeBsdfPrincipled')
    b.inputs['Base Color'].default_value = (.02, .025, .03, 1); b.inputs['Roughness'].default_value = .08; b.inputs['Metallic'].default_value = .2
    geo = nt.nodes.new('ShaderNodeNewGeometry'); lt = nt.nodes.new('ShaderNodeMath'); lt.operation = 'LESS_THAN'; lt.inputs[1].default_value = .35
    L(geo.outputs['Random Per Island'], lt.inputs[0])
    night = nt.nodes.new('ShaderNodeValue'); night.name = night.label = "NIGHT"; night.outputs[0].default_value = 0.
    mu = nt.nodes.new('ShaderNodeMath'); mu.operation = 'MULTIPLY'; L(lt.outputs[0], mu.inputs[0]); L(night.outputs[0], mu.inputs[1])
    mu2 = nt.nodes.new('ShaderNodeMath'); mu2.operation = 'MULTIPLY'; mu2.inputs[1].default_value = 4.; L(mu.outputs[0], mu2.inputs[0])
    b.inputs['Emission Color'].default_value = (1., .7, .42, 1); L(mu2.outputs[0], b.inputs['Emission Strength'])
    L(b.outputs[0], out.inputs[0]); return m
WM = win_mat()
FR = bpy.data.materials.get("BLV_Caixilho_Casa") or bpy.data.materials.new("BLV_Caixilho_Casa")
FR.use_nodes = True; FR.node_tree.nodes['Principled BSDF'].inputs['Base Color'].default_value = (.85, .85, .83, 1)

class MB:
    def __init__(s): s.v = []; s.f = []
    def cube(s, p):
        b = len(s.v); s.v += p
        s.f += [(b,b+3,b+2,b+1),(b+4,b+5,b+6,b+7),(b,b+1,b+5,b+4),(b+1,b+2,b+6,b+5),(b+2,b+3,b+7,b+6),(b+3,b,b+4,b+7)]
    def obox(s, o, u, n, u0, u1, z0, z1, d0, d1):
        P = lambda a, z, d: (o.x+u.x*a+n.x*d, o.y+u.y*a+n.y*d, z)
        s.cube([P(u0,z0,d0),P(u1,z0,d0),P(u1,z0,d1),P(u0,z0,d1),P(u0,z1,d0),P(u1,z1,d0),P(u1,z1,d1),P(u0,z1,d1)])
    def build(s, name, m):
        if not s.v: return None
        me = bpy.data.meshes.new(name); me.from_pydata(s.v, [], s.f); me.update(); me.materials.append(m)
        ob = bpy.data.objects.new(name, me); C.objects.link(ob); return ob
W, F, WALLS = MB(), MB(), {}
nh = 0
for ob in [o for o in scn.objects if o.name.startswith("BLV_casas_parede_")]:
    wm = ob.data.materials[0]; V = [Vector(v.co) for v in ob.data.vertices]
    for k in range(0, len(V), 8):
        p0, p1, p2, p3 = V[k], V[k+1], V[k+2], V[k+3]; ztop = V[k+4].z; z0 = p0.z; ht = ztop-z0
        ctr = (p0+p2)/2; e1 = (p1-p0); e2 = (p2-p1); w1, w2 = e1.length, e2.length
        if w1 < 1 or w2 < 1: continue
        u1 = e1/w1; u2 = e2/w2; nh += 1
        floors = 2 if ht > 5 else 1
        for (u, w, d, n) in ((u1, w1, w2, u2), (u1, w1, w2, -u2), (u2, w2, w1, u1), (u2, w2, w1, -u1)):
            o = Vector((ctr.x, ctr.y, 0))+n*(d/2)
            o.z = 0
            cnt = max(1, int(w//3.2))
            for fl in range(floors):
                zb = z0+1.0+fl*2.9
                for i in range(cnt):
                    a = -w/2+w*(i+.5)/cnt
                    if fl == 0 and i == 0 and n.dot(u2) > 0 and w > 5:   # porta
                        F.obox(o, u, n, a-.5, a+.5, z0, z0+2.15, 0, .04); continue
                    ww = rng.choice((1.0, 1.2, 1.5)); hh = 1.1
                    W.obox(o, u, n, a-ww/2, a+ww/2, zb, zb+hh, -.02, .03)
                    F.obox(o, u, n, a-ww/2-.06, a+ww/2+.06, zb-.06, zb, 0, .07)
        # muro de divisa (só casas, não galpões grandes), afastado 2,5 m, com vão de portão
        if max(w1, w2) < 13 and rng.random() < .8:
            mw = WALLS.setdefault(wm.name, MB()); hw = rng.choice((1.6, 1.9, 2.2)); off = 2.5
            for (u, w, d, n, gate) in ((u1, w1, w2, u2, True), (u1, w1, w2, -u2, False), (u2, w2, w1, u1, False), (u2, w2, w1, -u1, False)):
                o = Vector((ctr.x, ctr.y, 0))+n*(d/2+off); half = w/2+off
                if gate:
                    mw.obox(o, u, n, -half, -1.8, z0-.1, z0+hw, -.08, .08); mw.obox(o, u, n, 1.8, half, z0-.1, z0+hw, -.08, .08)
                else: mw.obox(o, u, n, -half, half, z0-.1, z0+hw, -.08, .08)
W.build("BLV_casas_janelas", WM); F.build("BLV_casas_caixilhos", FR)
for k, mb in WALLS.items(): mb.build(f"BLV_casas_muro_{k[-1]}", bpy.data.materials[k])
result = dict(houses=nh, window_verts=len(W.v))
