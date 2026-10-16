# Boulevard em 3D -> detalhes de primeiro plano e vizinhança (rodar depois de blender_site.py)
# Torre di Mosto (vizinho), vitrines fictícias no boulevard de lojas, postes com fiação, luminárias, arbustos.
import bpy, math, random, os
from mathutils import Vector

scn = bpy.data.scenes["Boulevard"]
rng = random.Random(21)
SITE = 0.1015
def S(x, y): return ((x-1250)*SITE, (y-400)*SITE)
def B(x, y, z): return (x, -z, y)
def coll(name):
    c = bpy.data.collections.get(name) or bpy.data.collections.new(name)
    if c.name not in scn.collection.children: scn.collection.children.link(c)
    for o in list(c.objects): bpy.data.objects.remove(o, do_unlink=True)
    return c
C_NB, C_SH, C_ST = coll("BLV_Vizinho"), coll("BLV_Vitrines"), coll("BLV_Rua")
for n in ("BLV_site_nb_l", "BLV_site_nb_d"):
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
MAT = bpy.data.materials
M = dict(white=MAT["BLV_Reboco_Claro"], graph=MAT["BLV_Reboco_Grafite"], slab=MAT["BLV_Laje"], glass=MAT["BLV_Vidro"],
         interior=MAT["BLV_Interior"], alu=MAT["BLV_Aluminio"], shopglass=MAT["BLV_Vidro_Loja"],
         rail=pmat("BLV_Vidro_Guarda_Corpo", 0x9fb4bf, .05, .0),
         pole=pmat("BLV_Poste_Concreto", 0xa9a69e, .85), wire=pmat("BLV_Fio", 0x141414, .5),
         lamp=pmat("BLV_Luminaria", 0x30343a, .4, .6), lampg=pmat("BLV_Luminaria_Luz", 0xffffff, .3, emit=0xffd9a8, es=0.),
         sign=pmat("BLV_Letreiro_Caixa", 0x23262b, .5, .2))
def nb_interior():
    m = MAT.get("BLV_Interior_Vizinho") or MAT["BLV_Interior"].copy(); m.name = "BLV_Interior_Vizinho"
    nt = m.node_tree; N = nt.nodes
    gate = N.get("GATE")
    if gate:
        geo = N.get("ISL") or N.new('ShaderNodeNewGeometry'); geo.name = "ISL"
        nt.links.new(geo.outputs['Random Per Island'], gate.inputs[0]); gate.inputs[1].default_value = .4
    return m
M['interior'] = nb_interior()
r = M['rail'].node_tree.nodes['Principled BSDF']; r.inputs['Transmission Weight'].default_value = 1.; r.inputs['Alpha'].default_value = .35

class MB:
    def __init__(s): s.v = []; s.f = []
    def cube(s, p):
        b = len(s.v); s.v += p
        s.f += [(b,b+3,b+2,b+1),(b+4,b+5,b+6,b+7),(b,b+1,b+5,b+4),(b+1,b+2,b+6,b+5),(b+2,b+3,b+7,b+6),(b+3,b,b+4,b+7)]
    def box(s, x0, y0, z0, x1, y1, z1):   # blender, eixo-alinhada
        s.cube([(x0,y0,z0),(x1,y0,z0),(x1,y1,z0),(x0,y1,z0),(x0,y0,z1),(x1,y0,z1),(x1,y1,z1),(x0,y1,z1)])
    def obox(s, o, u, n, u0, u1, z0, z1, d0, d1):   # blender: origem o(x,y), u/n unitários no plano
        P = lambda a, z, d: (o[0]+u[0]*a+n[0]*d, o[1]+u[1]*a+n[1]*d, z)
        s.cube([P(u0,z0,d0),P(u1,z0,d0),P(u1,z0,d1),P(u0,z0,d1),P(u0,z1,d0),P(u1,z1,d0),P(u1,z1,d1),P(u0,z1,d1)])
    def quad(s, o, u, n, u0, u1, z0, z1, d):
        P = lambda a, z: (o[0]+u[0]*a+n[0]*d, o[1]+u[1]*a+n[1]*d, z)
        b = len(s.v); s.v += [P(u0,z0), P(u1,z0), P(u1,z1), P(u0,z1)]; s.f.append((b,b+1,b+2,b+3))
    def build(s, name, m, col):
        if not s.v: return None
        me = bpy.data.meshes.new(name); me.from_pydata(s.v, [], s.f); me.update(); me.materials.append(m)
        ob = bpy.data.objects.new(name, me); col.objects.link(ob); return ob
G = {}
def g(k):
    if k not in G: G[k] = MB()
    return G[k]

# ---------------- Torre di Mosto (vizinho): ~16 pav., corpo branco + faixa vertical grafite, sacadas com vidro ----------------
cx, cy = -80., 66.          # blender (three -80,-66)
W, D, NFL, FHH, BASEH = 24., 17., 16, 2.9, 4.
x0, x1 = cx-W/2, cx+W/2; y0, y1 = cy-D/2, cy+D/2; top = BASEH+NFL*FHH
xg = x0+W*.58                                   # divisão branco | grafite
g('white').box(x0, y0, 0, xg, y1, top)
g('graph').box(xg, y0+.6, 0, x1, y1-.6, top-2.)
g('white').box(x0+3, y0+3, top, x0+11, y0+10, top+4.)   # casa de máquinas
g('shopglass').box(x0-.05, y0-.05, .0, x1+.05, y1+.05, BASEH-.4)   # térreo envidraçado
for f in range(NFL):
    z = BASEH+f*FHH
    g('slab').box(x0-.15, y0-.15, z-.18, xg, y1+.15, z)          # friso de laje no corpo branco
    for side, ny in ((y0, -1), (y1, 1)):                          # sacadas nas duas fachadas longas (corpo branco)
        for (a0, a1) in ((x0+1., x0+6.), (x0+8., x0+13.)):
            if (f+(0 if side == y0 else 1)) % 2 == 0 or a0 > x0+5:
                g('slab').box(a0, side+ny*0.0 if ny > 0 else side-1.4, z, a1, side+1.4 if ny > 0 else side, z+.15)
                yy = side+1.4*ny
                g('rail').box(a0, yy-.02, z+.15, a1, yy+.02, z+1.15)
    # janelas: corpo branco e volume grafite
    for side, ny in ((y0, -1), (y1, 1)):
        for xa in [x0+1.2+k*2.4 for k in range(6)]+[xg+1.0+k*2.2 for k in range(4)]:
            if xa+1.2 > x1-.4: continue
            o = (xa+.6, side); u = (1, 0); n = (0, ny)
            g('interior').quad(o, u, n, -.55, .55, z+.9, z+2.2, .01)
            g('glass').quad(o, u, n, -.55, .55, z+.9, z+2.2, .05)
            g('alu').obox(o, u, n, -.6, .6, z+.86, z+.9, 0, .08); g('alu').obox(o, u, n, -.6, .6, z+2.2, z+2.24, 0, .08)
    for sx, nx in ((x0, -1), (x1, 1)):
        for ya in (cy-4., cy+2.):
            o = (sx, ya); u = (0, 1); n = (nx, 0)
            g('interior').quad(o, u, n, -.5, .5, z+1.1, z+2.1, .01); g('glass').quad(o, u, n, -.5, .5, z+1.1, z+2.1, .05)
for k, mb in list(G.items()):
    ob = mb.build(f"BLV_vizinho_{k}", M[k], C_NB)
    if ob and k == 'interior': ob.pass_index = 1
G.clear()

# ---------------- vitrines fictícias no boulevard de lojas ----------------
poly_site = [[255,352],[487,300],[487,140],[675,95],[830,82],[830,232],[678,232],[678,380],[525,418],[275,455]]
P3 = [S(*p) for p in poly_site]                         # three (x,z)
PB = [(p[0], -p[1]) for p in P3]                         # blender (x,y)
def inside(x, y, p):
    c = False; j = len(p)-1
    for i in range(len(p)):
        if ((p[i][1] > y) != (p[j][1] > y)) and (x < (p[j][0]-p[i][0])*(y-p[i][1])/(p[j][1]-p[i][1])+p[i][0]): c = not c
        j = i
    return c
NAMES = ["Padaria Pão da Praça", "Café Grão", "Farmácia Bem Viver", "Pet & Cia", "Barbearia Navalha", "Empório da Esquina",
         "Sorveteria Gelato", "Ótica Visão", "Lavanderia Prática", "Pizzaria Forno a Lenha", "Açaí do Porto", "Floricultura Jardim"]
TONES = [0xffe2b8, 0xfff1dc, 0xe8f3ff, 0xffd6a8, 0xfff4e6, 0xffe9c9]
AWN = [0x2f4a3a, 0x8a3b2b, 0x2b3a55, 0x6b5a3a]
ni = 0; signs = []
for i in range(len(PB)):
    a = Vector(PB[i]); b = Vector(PB[(i+1) % len(PB)]); L = (b-a).length
    if L < 9: continue
    u = (b-a)/L; n = Vector((u.y, -u.x)); mid = (a+b)/2
    if inside(*(mid+n*1.5), PB): n = -n
    nb = max(1, int(L//7.5)); bw = L/nb
    for k in range(nb):
        o = a+u*(bw*(k+.5))
        g('alu').obox(o, u, n, -bw/2, -bw/2+.12, 0, 3.75, -.02, .1)                     # montante
        g('alu').obox(o, u, n, -bw/2, bw/2, 2.95, 3.05, -.02, .1)                         # travessa
        g('sign').obox(o, u, n, -bw*.38, bw*.38, 3.12, 3.62, 0, .22)                      # caixa do letreiro
        tone = TONES[ni % len(TONES)]
        bk = MB(); bk.quad(o, u, n, -bw/2+.2, bw/2-.2, .05, 2.9, -2.2)                    # fundo da loja (luz própria)
        m = pmat(f"BLV_Loja_Fundo_{ni%6}", 0xdedad2, .8, emit=tone, es=3.5); bk.build(f"BLV_loja_fundo_{ni:02d}", m, C_SH)
        if rng.random() < .55:                                                           # toldo
            aw = MB(); c = AWN[ni % len(AWN)]
            P = lambda aa, z, d: (o.x+u.x*aa+n.x*d, o.y+u.y*aa+n.y*d, z)
            v = [P(-bw*.42, 3.05, .05), P(bw*.42, 3.05, .05), P(bw*.42, 2.55, 1.3), P(-bw*.42, 2.55, 1.3)]
            aw.v += v; aw.f.append((0, 1, 2, 3)); aw.build(f"BLV_toldo_{ni:02d}", pmat(f"BLV_Toldo_{ni%4}", c, .9), C_SH)
        signs.append((o.copy(), u.copy(), n.copy(), NAMES[ni % len(NAMES)], bw)); ni += 1
for k, mb in list(G.items()): mb.build(f"BLV_vitrine_{k}", M[k], C_SH)
G.clear()
lett = pmat("BLV_Letra", 0xffffff, .4, emit=0xfff3e0, es=6.)
for (o, u, n, txt, bw) in signs:
    cu = bpy.data.curves.new(f"BLV_txt_{txt}", 'FONT'); cu.body = txt; cu.align_x = 'CENTER'; cu.align_y = 'CENTER'
    cu.size = .32; cu.extrude = .015
    ob = bpy.data.objects.new(f"BLV_letreiro_{txt}", cu); ob.data.materials.append(lett)
    ob.location = (o.x+n.x*.24, o.y+n.y*.24, 3.37)
    ob.rotation_euler = (math.pi/2, 0, math.atan2(n.y, n.x)-math.pi/2)
    dims = ob.dimensions.x or len(txt)*.2
    C_SH.objects.link(ob)
    bpy.context.view_layer.update()
    if ob.dimensions.x > bw*.72: s = bw*.72/ob.dimensions.x; ob.scale = (s, s, s)

# ---------------- postes com fiação e luminárias ao longo das vias ----------------
MAIN_S = [[-60,-2700],[20,-1500],[55,-300],[75,0],[120,250],[165,450],[215,610],[300,745],[460,830],[700,850],[1300,856],[2000,858]]
def catmull(ctrl, n):
    P = [ctrl[0]]+ctrl+[ctrl[-1]]; out = []; seg = len(ctrl)-1
    for kk in range(n+1):
        t = kk/n*seg; i = min(int(t), seg-1); uu = t-i; p0, p1, p2, p3 = P[i], P[i+1], P[i+2], P[i+3]
        out.append(tuple(.5*((2*p1[d])+(-p0[d]+p2[d])*uu+(2*p0[d]-5*p1[d]+4*p2[d]-p3[d])*uu*uu+(-p0[d]+3*p1[d]-3*p2[d]+p3[d])*uu**3) for d in (0, 1)))
    return out
pts = [(p[0], -p[1]) for p in catmull([S(*p) for p in MAIN_S], 3000)]
cam = scn.objects["BLV_Cam_Abertura"].location
# lado de fora da curva (calçada oposta às torres) e lado do lote
poles = []
acc = 0.; last = None
for i in range(1, len(pts)-1):
    a = Vector(pts[i-1]); b = Vector(pts[i+1]); p = Vector(pts[i]); t = (b-a).normalized(); nn = Vector((t.y, -t.x))
    if last is None or (p-last).length > 34:
        last = p
        for side in (1, -1):
            q = p+nn*side*12.2
            if (q-cam.xy).length < 420: poles.append((q, t, side))
RB = Vector(S(300, 745)); RB = Vector((RB.x, -RB.y))
poles = [pp for pp in poles if (pp[0]-RB).length > 26]
H = 10.5; pm = MB(); lm = MB(); lg = MB(); tops = {1: [], -1: []}
for (q, t, side) in poles:
    seg = 8
    for k in range(seg):                                           # poste cônico (prismas)
        r0 = .17-.07*k/seg; z0 = H*k/seg; z1 = H*(k+1)/seg
        pm.obox((q.x, q.y), (t.x, t.y), (-t.y, t.x), -r0, r0, z0, z1, -r0, r0)
    pm.obox((q.x, q.y), (-t.y*side, t.x*side), (t.x, t.y), -1.1, 1.1, H-.6, H-.48, -.06, .06)   # cruzeta
    pm.obox((q.x, q.y), (-t.y*side, t.x*side), (t.x, t.y), -.6, .6, 6.6, 6.7, -.05, .05)        # cruzeta baixa (telecom)
    arm = Vector((-t.y, t.x))*side*-1                                                          # braço da luminária para a pista
    for k in range(6):
        p0 = q+arm*(.4*k); lm.obox((p0.x, p0.y), (arm.x, arm.y), (t.x, t.y), 0, .42, 8.6+.06*k, 8.68+.06*k, -.04, .04)
    hp = q+arm*2.5
    lm.obox((hp.x, hp.y), (arm.x, arm.y), (t.x, t.y), -.35, .35, 8.85, 9.05, -.16, .16)
    lg.obox((hp.x, hp.y), (arm.x, arm.y), (t.x, t.y), -.3, .3, 8.82, 8.85, -.12, .12)
    tops[side].append((q, t))
pm.build("BLV_postes", M['pole'], C_ST); lm.build("BLV_luminarias", M['lamp'], C_ST); lg.build("BLV_luminarias_luz", M['lampg'], C_ST)
# fios: catenárias entre postes consecutivos do mesmo lado (3 de energia + 4 de telecom)
cv = bpy.data.curves.new("BLV_fios", 'CURVE'); cv.dimensions = '3D'; cv.bevel_depth = .011; cv.bevel_resolution = 1
for side, lst in tops.items():
    for i in range(len(lst)-1):
        (q0, t0), (q1, t1) = lst[i], lst[i+1]
        if (q1-q0).length > 45: continue
        perp0 = Vector((-t0.y, t0.x))*side; perp1 = Vector((-t1.y, t1.x))*side
        for (off, z, sag) in [(-.9, H-.5, .45), (0., H-.5, .45), (.9, H-.5, .45), (-.45, 6.75, .7), (-.15, 6.65, .8), (.15, 6.72, .75), (.45, 6.6, .9)]:
            a = q0+perp0*off; b = q1+perp1*off
            sp = cv.splines.new('POLY'); sp.points.add(9)
            for k in range(10):
                tt = k/9; p = a.lerp(b, tt); zz = z-sag*4*tt*(1-tt)
                sp.points[k].co = (p.x, p.y, zz, 1)
ow = bpy.data.objects.new("BLV_fios", cv); cv.materials.append(M['wire']); C_ST.objects.link(ow)

# ---------------- arbustos na frente das lojas e bordas do lote (se baixado) ----------------
nshrub = 0
for nm in ("shrub_01", "potted_plant_02"):
    col = bpy.data.collections.get(f"{nm}_LOD0") or bpy.data.collections.get(nm)
    p = os.path.expanduser(f"~/Movies/Boulevard_3D/assets/models/{nm}/{nm}.blend")
    if col is None and os.path.exists(p):
        with bpy.data.libraries.load(p, link=False) as (src, dst):
            want = [c for c in src.collections if c.endswith("LOD0")] or [c for c in src.collections if c == nm]
            dst.collections = want[:1]
        col = dst.collections[0] if dst.collections else None
    if col is None or nm != "shrub_01": continue
    for i in range(len(PB)):
        a = Vector(PB[i]); b = Vector(PB[(i+1) % len(PB)]); L = (b-a).length
        if L < 9: continue
        u = (b-a)/L; n = Vector((u.y, -u.x))
        if inside(*((a+b)/2+n*1.5), PB): n = -n
        for k in range(int(L//3)):
            if rng.random() < .35: continue
            q = a+u*(k*3+1.5)+n*rng.uniform(1.6, 2.4)
            e = bpy.data.objects.new(f"BLV_arbusto_{nshrub:03d}", None); e.instance_type = 'COLLECTION'; e.instance_collection = col
            s = rng.uniform(.8, 1.3); e.location = (q.x, q.y, .05); e.scale = (s, s, s); e.rotation_euler[2] = rng.random()*6.28
            C_ST.objects.link(e); nshrub += 1

result = dict(signs=len(signs), poles=len(poles), shrubs=nshrub)
