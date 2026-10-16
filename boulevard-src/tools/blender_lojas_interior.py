# Boulevard em 3D -> interior raso de cada loja do boulevard (rodar depois de blender_lojas.py)
# Piso, paredes laterais, fundo, forro com painéis de luz, balcão, prateleiras com produtos e mesas (lojas de comida).
import bpy, math, random
from mathutils import Vector

scn = bpy.data.scenes["Boulevard"]
rng = random.Random(77)
SITE = 0.1015
def S(x, y): return ((x-1250)*SITE, (y-400)*SITE)
C = bpy.data.collections.get("BLV_Lojas_Interior") or bpy.data.collections.new("BLV_Lojas_Interior")
if C.name not in scn.collection.children: scn.collection.children.link(C)
for o in list(C.objects): bpy.data.objects.remove(o, do_unlink=True)
for n in ("BLV_site_shopin", "BLV_lojas_back"):          # bloco de luz chapado e painel de fundo antigos
    o = bpy.data.objects.get(n)
    if o: bpy.data.objects.remove(o, do_unlink=True)

def srgb(h):
    c = [((h >> s) & 255)/255 for s in (16, 8, 0)]
    return tuple((v/12.92 if v <= .04045 else ((v+.055)/1.055)**2.4) for v in c) + (1,)
def pmat(name, hexcol, rough=.6, metal=0., emit=None, es=0.):
    m = bpy.data.materials.get(name) or bpy.data.materials.new(name)
    m.use_nodes = True; nt = m.node_tree; nt.nodes.clear()
    o = nt.nodes.new('ShaderNodeOutputMaterial'); b = nt.nodes.new('ShaderNodeBsdfPrincipled'); nt.links.new(b.outputs[0], o.inputs[0])
    b.inputs['Base Color'].default_value = srgb(hexcol); b.inputs['Roughness'].default_value = rough; b.inputs['Metallic'].default_value = metal
    if emit is not None: b.inputs['Emission Color'].default_value = srgb(emit); b.inputs['Emission Strength'].default_value = es
    return m
def prod_mat():   # produtos: cor aleatória por ilha (cada caixinha uma cor)
    m = bpy.data.materials.get("BLV_Produtos") or bpy.data.materials.new("BLV_Produtos")
    m.use_nodes = True; nt = m.node_tree; nt.nodes.clear(); L = nt.links.new
    o = nt.nodes.new('ShaderNodeOutputMaterial'); b = nt.nodes.new('ShaderNodeBsdfPrincipled'); L(b.outputs[0], o.inputs[0]); b.inputs['Roughness'].default_value = .5
    g = nt.nodes.new('ShaderNodeNewGeometry'); r = nt.nodes.new('ShaderNodeValToRGB')
    els = r.color_ramp.elements; els[0].color = srgb(0xc0392b); els[1].color = srgb(0x2c6e9b)
    for pos, h in ((.2, 0xe8b84a), (.4, 0xf2efe6), (.6, 0x3f7d4a), (.8, 0x8e5a3c)):
        e = els.new(pos); e.color = srgb(h)
    r.color_ramp.interpolation = 'CONSTANT'; L(g.outputs['Random Per Island'], r.inputs[0]); L(r.outputs[0], b.inputs['Base Color'])
    return m
KIND = {  # nome -> (piso, parede, temp. luz, comida)
    "PADARIA": (0x8a6a4c, 0xf1e6d2, 3000, True), "CAFÉ": (0x5a4636, 0xe7dccb, 2900, True), "FARMÁCIA": (0xd9d9d6, 0xf7f7f5, 5000, False),
    "PET": (0xbfc4c6, 0xeaf1ea, 4200, False), "BARBEARIA": (0x2f2b28, 0x3d3a37, 3200, False), "EMPÓRIO": (0x7b5a3e, 0xeadfc9, 3100, False),
    "SORVETERIA": (0xe9e4dc, 0xfbeff2, 4000, True), "ÓTICA": (0xd6d3cc, 0xf3f1ec, 4500, False), "LAVANDERIA": (0xcfd6da, 0xeef3f6, 5200, False),
    "PIZZARIA": (0x6b3f2e, 0xd9c3a5, 2800, True), "AÇAÍ": (0x4b2d4f, 0xefe5f2, 3600, True), "FLORICULTURA": (0x7b7266, 0xf0eee6, 3800, False)}
def kblack(t):   # aproximação de cor de corpo negro (K -> rgb linear)
    t = t/100.
    r = 1. if t <= 66 else min(1, 1.292936*((t-60)**-.1332047))
    g = min(1, .39008*math.log(t)-.6318) if t <= 66 else min(1, 1.129891*((t-60)**-.0755148))
    b = 1. if t >= 66 else (0. if t <= 19 else min(1, .5432068*math.log(t-10)-1.19625))
    return (r**2.2, g**2.2, b**2.2)

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

poly_site = [[255,352],[487,300],[487,140],[675,95],[830,82],[830,232],[678,232],[678,380],[525,418],[275,455]]
PB = [(p[0], -p[1]) for p in (S(*q) for q in poly_site)]
def inside(x, y, p):
    c = False; j = len(p)-1
    for i in range(len(p)):
        if ((p[i][1] > y) != (p[j][1] > y)) and (x < (p[j][0]-p[i][0])*(y-p[i][1])/(p[j][1]-p[i][1])+p[i][0]): c = not c
        j = i
    return c
NAMES = ["PADARIA PÃO DA PRAÇA", "CAFÉ GRÃO", "FARMÁCIA BEM VIVER", "PET & CIA", "BARBEARIA NAVALHA", "EMPÓRIO DA ESQUINA",
         "SORVETERIA GELATO", "ÓTICA VISÃO", "LAVANDERIA PRÁTICA", "PIZZARIA FORNO", "AÇAÍ DO PORTO", "FLORICULTURA JARDIM"]
PROD = prod_mat(); WOOD = pmat("BLV_Loja_Madeira", 0x8b6a4a, .55); DARK = pmat("BLV_Loja_Metal", 0x26282b, .35, .6)
TOP = pmat("BLV_Loja_Tampo", 0xe9e6df, .3)
DEPTH = 5.0; H = 3.0
ni = 0; nlights = 0
for i in range(len(PB)):
    a = Vector(PB[i]); b = Vector(PB[(i+1) % len(PB)]); L = (b-a).length
    if L < 6: continue
    u = (b-a)/L; n = Vector((u.y, -u.x))
    if inside(*((a+b)/2+n*1.0), PB): n = -n
    nb = max(1, int(L//7.5)); bw = L/nb
    for j in range(nb):
        o = a+u*(bw*(j+.5)); name = NAMES[ni % len(NAMES)]; key = name.split()[0]
        fl, wl, temp, food = KIND.get(key, (0xcfcac0, 0xf0ece4, 3500, False))
        sh = MB(); fm = MB(); wm_ = MB(); pr = MB(); wd = MB(); dk = MB(); tp = MB(); lp = MB()
        d0, d1 = -.45, -.45-DEPTH; hw = bw/2-.12
        fm.obox(o, u, n, -hw, hw, -.02, .02, d1, d0)                                   # piso
        wm_.obox(o, u, n, -hw, hw, .02, H, d1-.1, d1)                                  # parede do fundo
        wm_.obox(o, u, n, -hw-.1, -hw, .02, H, d1, d0); wm_.obox(o, u, n, hw, hw+.1, .02, H, d1, d0)   # laterais
        wm_.obox(o, u, n, -hw, hw, H, H+.06, d1, d0)                                   # forro
        for k in range(3):                                                             # painéis de luz no forro
            dd = d0-(k+.5)*DEPTH/3
            lp.obox(o, u, n, -hw*.6, hw*.6, H-.03, H-.01, dd-.25, dd+.25)
        # prateleiras no fundo e numa lateral, com produtos
        for z in (.45, .9, 1.35, 1.8, 2.25):
            wd.obox(o, u, n, -hw+.2, hw-.2, z, z+.03, d1+.05, d1+.45)
            x = -hw+.3
            while x < hw-.35:
                w = rng.uniform(.12, .3); h = rng.uniform(.12, .38)
                if rng.random() < .85: pr.obox(o, u, n, x, x+w, z+.03, z+.03+h, d1+.1, d1+rng.uniform(.25, .4))
                x += w+rng.uniform(.02, .06)
        for z in (.6, 1.2, 1.8):
            wd.obox(o, u, n, hw-.45, hw-.05, z, z+.03, d1+.5, d0-.8)
            dd = d1+.6
            while dd < d0-.9:
                w = rng.uniform(.12, .28); h = rng.uniform(.12, .32)
                if rng.random() < .8: pr.obox(o, u, n, hw-.4, hw-.12, z+.03, z+.03+h, dd, dd+w)
                dd += w+.04
        # balcão
        dk.obox(o, u, n, -hw+.3, -hw+.3+bw*.45, 0, 1.0, d1+1.3, d1+1.95)
        tp.obox(o, u, n, -hw+.25, -hw+.35+bw*.45, 1.0, 1.05, d1+1.25, d1+2.0)
        if food:                                                                       # mesas e banquetas
            for (cu, cd) in ((-hw*.2, d0-1.1), (hw*.35, d0-1.3), (hw*.05, d0-2.4)):
                dk.obox(o, u, n, cu-.03, cu+.03, 0, .74, cd-.03, cd+.03)
                tp.obox(o, u, n, cu-.35, cu+.35, .74, .77, cd-.35, cd+.35)
                for (su, sd) in ((-.5, 0), (.5, 0)):
                    dk.obox(o, u, n, cu+su-.02, cu+su+.02, 0, .45, cd+sd-.02, cd+sd+.02); wd.obox(o, u, n, cu+su-.18, cu+su+.18, .45, .48, cd-.18, cd+.18)
        else:                                                                          # gôndola central
            wd.obox(o, u, n, -hw*.15, hw*.35, 0, 1.4, d0-2.6, d0-2.0)
            for z in (.4, .8, 1.2):
                xx = -hw*.12
                while xx < hw*.32:
                    w = rng.uniform(.12, .25); pr.obox(o, u, n, xx, xx+w, z+.0, z+rng.uniform(.12, .3), d0-2.05, d0-1.9); xx += w+.05
        tag = f"{ni:02d}"
        fm.build(f"BLV_loja{tag}_piso", pmat(f"BLV_Loja_Piso_{key}", fl, .35))
        wm_.build(f"BLV_loja{tag}_paredes", pmat(f"BLV_Loja_Parede_{key}", wl, .8))
        pr.build(f"BLV_loja{tag}_produtos", PROD); wd.build(f"BLV_loja{tag}_prateleiras", WOOD)
        dk.build(f"BLV_loja{tag}_metal", DARK); tp.build(f"BLV_loja{tag}_tampos", TOP)
        col = kblack(temp)
        lm = pmat(f"BLV_Loja_Luz_{key}", 0xffffff, .5); bsdf = lm.node_tree.nodes['Principled BSDF']
        bsdf.inputs['Emission Color'].default_value = (*col, 1); bsdf.inputs['Emission Strength'].default_value = 12.
        lp.build(f"BLV_loja{tag}_luz", lm)
        ld = bpy.data.lights.new(f"BLV_loja{tag}_area", 'AREA'); ld.shape = 'RECTANGLE'; ld.size = bw*.7; ld.size_y = DEPTH*.8
        ld.energy = 260.; ld.color = col
        lo = bpy.data.objects.new(f"BLV_loja{tag}_area", ld); C.objects.link(lo)
        c = o+n*(d0-DEPTH/2); lo.location = (c.x, c.y, H-.15); lo.rotation_euler = (0, 0, math.atan2(u.y, u.x))
        ni += 1; nlights += 1
# volume baixo e muro: pintura branca lisa (o reboco cinza lia como concreto)
wh = pmat("BLV_Pintura_Branca", 0xeeede9, .7)
nt = wh.node_tree; b = nt.nodes['Principled BSDF']
tc = nt.nodes.new('ShaderNodeTexCoord'); nz = nt.nodes.new('ShaderNodeTexNoise'); nz.inputs['Scale'].default_value = 6; nz.inputs['Detail'].default_value = 6
bp = nt.nodes.new('ShaderNodeBump'); bp.inputs['Strength'].default_value = .08
nt.links.new(tc.outputs['Object'], nz.inputs['Vector']); nt.links.new(nz.outputs['Fac'], bp.inputs['Height']); nt.links.new(bp.outputs[0], b.inputs['Normal'])
w = bpy.data.objects.get("BLV_site_wall")
if w: w.data.materials[0] = wh
result = dict(shops=ni, lights=nlights)
