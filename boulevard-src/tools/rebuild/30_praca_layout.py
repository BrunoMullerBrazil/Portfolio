# Realismo 30: Praça Oscar Niemeyer com o programa das imagens oficiais do altosdapedra.com.br (24/out):
#  - espelho d'água oval, borda baixa de concreto, bancos curvos ao redor (imagem da escultura)
#  - pergolado longo de cobertura metálica escura sobre pilares finos, abrigo de feira (22_329_16_PRACA_PERGOLADO)
#  - piso contínuo de concreto claro em placas grandes, canteiros orgânicos com borda de concreto e agapantos,
#    palmeiras + árvores de sombra.
# As imagens são ilustrativas e o site não publica planta dimensionada da praça: posições e medidas são estimadas
# dentro da faixa indicada pelo Bruno (POLY do 28). A escultura "Encontro da Curva com a Reta III" é obra autoral e
# NÃO é modelada — o espelho d'água fica com o centro livre.
# Roda depois do 28 (usa BLV_praca_piso e a coleção BLV_Praca).
import bpy, bmesh, math, random
from mathutils import Vector, Matrix
from mathutils.bvhtree import BVHTree
scn = bpy.data.scenes["Boulevard"]; rng = random.Random(30); M = bpy.data.materials
C = bpy.data.collections["BLV_Praca"]
TER = scn.objects["BLV_terreno"]
_bvh = BVHTree.FromObject(TER, bpy.context.evaluated_depsgraph_get(), deform=False)
_mw = TER.matrix_world; _ti = _mw.inverted(); _dl = (_ti.to_3x3()@Vector((0, 0, -1))).normalized()
def chao(p):
    loc, *_ = _bvh.ray_cast(_ti@Vector((p.x, p.y, 3000.)), _dl)
    return (_mw@loc).z if loc is not None else 0.
# eixo da faixa (borda norte (-75,-62)->(335,-116); borda sul ~(-52,-96)->(332,-160))
def yc(x):   # linha média e meia-largura da praça em x
    pn = [(-75, -50), (0, -55), (150, -67), (250, -75), (330, -94)]
    yn = pn[0][1] if x < -75 else pn[-1][1]
    for (x0, y0), (x1, y1) in zip(pn, pn[1:]):
        if x0 <= x <= x1: yn = y0+(y1-y0)*(x-x0)/(x1-x0); break
    pts = [(-52, -96), (-20, -110), (150, -127), (280, -150), (332, -160)]
    for (x0, y0), (x1, y1) in zip(pts, pts[1:]):
        if x0 <= x <= x1: ys = y0+(y1-y0)*(x-x0)/(x1-x0); break
    else: ys = -96 if x < -52 else -160
    return (yn+ys)/2, (yn-ys)/2
ANG = math.atan2(-44, 405); U = Vector((math.cos(ANG), math.sin(ANG))); N = Vector((-U.y, U.x))
def P(x, off=0.):
    y, hw = yc(x); return Vector((x, y))+N*off
# limpa o que este script cria (idempotente) e as árvores do 28
for o in list(C.objects):
    if o.name != "BLV_praca_piso": bpy.data.objects.remove(o, do_unlink=True)
def mat(name, base, rough=.6, metal=0., ior=None):
    m = M.get(name) or M.new(name); m.use_nodes = True; b = m.node_tree.nodes.get('Principled BSDF')
    b.inputs['Base Color'].default_value = base; b.inputs['Roughness'].default_value = rough; b.inputs['Metallic'].default_value = metal
    if ior: b.inputs['IOR'].default_value = ior
    return m
AGUA = mat("BLV_Praca_Agua", (.015, .025, .028, 1), .03, 0., 1.33)
nt = AGUA.node_tree; b = nt.nodes['Principled BSDF']
if not any(n.type == 'BUMP' for n in nt.nodes):
    nz = nt.nodes.new('ShaderNodeTexNoise'); nz.inputs['Scale'].default_value = 3.; bp = nt.nodes.new('ShaderNodeBump'); bp.inputs['Strength'].default_value = .05
    nt.links.new(nz.outputs['Fac'], bp.inputs['Height']); nt.links.new(bp.outputs[0], b.inputs['Normal'])
CONC = M.get("BLV_Concreto_Lazer") or mat("BLV_Concreto_Lazer", (.42, .41, .39, 1), .8)
METAL = M.get("BLV_Metal_Escuro") or mat("BLV_Metal_Escuro", (.03, .03, .032, 1), .45, .8)
TRONCO = mat("BLV_Palmeira_Tronco", (.30, .29, .26, 1), .85)
FOLHA = M.get("BLV_Folhagem") or mat("BLV_Folhagem", (.04, .08, .03, 1), .7)
# canteiro: grama escura com manchas de agapanto (folha verde-azulada + flor azul-violeta)
CANT = M.get("BLV_Praca_Canteiro") or M.new("BLV_Praca_Canteiro"); CANT.use_nodes = True; nt = CANT.node_tree; nt.nodes.clear(); L = nt.links.new
o_ = nt.nodes.new('ShaderNodeOutputMaterial'); bb = nt.nodes.new('ShaderNodeBsdfPrincipled'); L(bb.outputs[0], o_.inputs[0])
tc = nt.nodes.new('ShaderNodeTexCoord'); nz = nt.nodes.new('ShaderNodeTexNoise'); nz.inputs['Scale'].default_value = 1.8; nz.inputs['Detail'].default_value = 6
L(tc.outputs['Object'], nz.inputs['Vector']); rp = nt.nodes.new('ShaderNodeValToRGB'); L(nz.outputs['Fac'], rp.inputs['Fac'])
e = rp.color_ramp.elements; e[0].position = .35; e[0].color = (.022, .05, .018, 1); e[1].position = .72; e[1].color = (.045, .085, .04, 1)
e2 = e.new(.80); e2.color = (.10, .10, .28, 1)   # flor de agapanto só em manchas pequenas (v1 deixava o canteiro azul, lendo como água)
L(rp.outputs['Color'], bb.inputs['Base Color']); bb.inputs['Roughness'].default_value = .75
bp = nt.nodes.new('ShaderNodeBump'); bp.inputs['Strength'].default_value = .6; L(nz.outputs['Fac'], bp.inputs['Height']); L(bp.outputs[0], bb.inputs['Normal'])
# ---------- piso: tudo em placa clara; tira as faces sob o espelho d'água ----------
PISO = M["BLV_Praca_Piso"]; nt = PISO.node_tree
br = next((n for n in nt.nodes if n.type == 'TEX_BRICK'), None)
if br:   # placas grandes ~1,4 × 0,7 m, concreto claro (albedo ~.36) — o 29 deixou escuro demais
    br.inputs['Scale'].default_value = .36; br.inputs['Mortar Size'].default_value = .012
    br.inputs['Color1'].default_value = (.40, .38, .35, 1); br.inputs['Color2'].default_value = (.35, .34, .31, 1); br.inputs['Mortar'].default_value = (.16, .155, .14, 1)
po = scn.objects["BLV_praca_piso"]; me = po.data
POOL_C = P(95); POOL_A, POOL_B = 15., 6.5     # semi-eixos do espelho d'água
def em_elipse(p, c, a, b_, ang=ANG):
    d = p-c; x = d.dot(Vector((math.cos(ang), math.sin(ang)))); y = d.dot(Vector((-math.sin(ang), math.cos(ang))))
    return (x/a)**2+(y/b_)**2 <= 1
bm = bmesh.new(); bm.from_mesh(me)
for f in bm.faces: f.material_index = 0
kill = [f for f in bm.faces if em_elipse(f.calc_center_median().xy, POOL_C, POOL_A+.6, POOL_B+.6)]
bmesh.ops.delete(bm, geom=kill, context='FACES'); bm.to_mesh(me); bm.free()
# ---------- construtor ----------
class MB:
    def __init__(s): s.v = []; s.f = []; s.m = []
    def prism(s, poly, z0, h, mi=0, top=True):
        b = len(s.v); n = len(poly); s.v += [(p.x, p.y, z0) for p in poly]+[(p.x, p.y, z0+h) for p in poly]
        if top: s.f.append(tuple(range(b+n, b+2*n))); s.m.append(mi)
        s.f += [(b+i, b+(i+1) % n, b+n+(i+1) % n, b+n+i) for i in range(n)]; s.m += [0]*n
    def box(s, c, u, w, d, z0, h, mi=0):
        n = Vector((-u.y, u.x)); s.prism([c+u*a+n*b_ for a, b_ in ((-w/2, -d/2), (w/2, -d/2), (w/2, d/2), (-w/2, d/2))], z0, h, mi)
    def build(s, name, mats):
        me = bpy.data.meshes.new(name); me.from_pydata(s.v, [], s.f); me.update()
        for m in mats: me.materials.append(m)
        for p, mi in zip(me.polygons, s.m): p.material_index = mi
        o = bpy.data.objects.new(name, me); C.objects.link(o); return o
def elipse(c, a, b_, ang=ANG, n=40, k=1.):
    ca, sa = math.cos(ang), math.sin(ang); out = []
    for i in range(n):
        t = 2*math.pi*i/n; r = 1+.08*k*math.sin(3*t+c.x)   # leve irregularidade orgânica
        x, y = a*r*math.cos(t), b_*r*math.sin(t); out.append(c+Vector((x*ca-y*sa, x*sa+y*ca)))
    return out
# ---------- espelho d'água + borda + bancos curvos ----------
z0 = chao(POOL_C)
E = MB()
E.prism(elipse(POOL_C, POOL_A+.6, POOL_B+.6, k=0), z0-.2, .62, 0, top=False)       # parede externa da borda
E.prism(elipse(POOL_C, POOL_A, POOL_B, k=0), z0-.2, .32, 1)                         # lâmina d'água (topo = água)
# bancos: arco a 7 m da borda, lado sul (sombra das árvores), 3 segmentos
for seg in range(3):
    for j in range(7):
        t = -math.pi/2+(seg-1)*.75+(j-3)*.09
        ca, sa = math.cos(ANG), math.sin(ANG); x, y = (POOL_A+8)*math.cos(t), (POOL_B+8)*math.sin(t)
        c = POOL_C+Vector((x*ca-y*sa, x*sa+y*ca)); tg = Vector((-(POOL_A+8)*math.sin(t), (POOL_B+8)*math.cos(t))); tg = Vector((tg.x*ca-tg.y*sa, tg.x*sa+tg.y*ca)).normalized()
        E.box(c, tg, 1.15, .55, chao(c), .45)
E.build("BLV_praca_espelho", [CONC, AGUA])
# ---------- pergolado: 48 × 9 m, h 4,2 m, cobertura metálica fina, pilares Ø15 cm a cada 6 m ----------
PC = P(215); zP = chao(PC); PG = MB()
PG.box(PC, U, 48., 9., zP+4.0, .22)
PG.box(PC+N*4.6, U, 48., .25, zP+3.85, .35); PG.box(PC-N*4.6, U, 48., .25, zP+3.85, .35)   # vigas de borda
for i in range(9):
    for s in (-1, 1):
        c = PC+U*(-24+i*6)+N*s*3.6; PG.box(c, U, .15, .15, chao(c)-.1, 4.1+(zP-chao(c)))
PG.build("BLV_praca_pergolado", [METAL])
# bancas da feira sob o pergolado (volumes baixos de madeira)
MAD = M.get("BLV_Madeira") or mat("BLV_Madeira", (.22, .13, .07, 1), .6)
BK = MB()
for i in range(6):
    c = PC+U*(-19+i*7.6)+N*rng.uniform(-1.2, 1.2); BK.box(c, U, 2.4, 1.2, chao(c), .95)
BK.build("BLV_praca_bancas", [MAD])
# ---------- canteiros orgânicos com borda de concreto ----------
CAN = [(-38, 7, 13, 5.), (5, -8, 16, 6.), (40, 9, 12, 5.), (140, -10, 15, 6.), (160, 10, 10, 4.5), (262, 9, 13, 5.),
       (290, -9, 15, 6.), (318, 4, 9, 4.)]
CB = MB(); arv_spots = []
for x, off, a, b_ in CAN:
    c = P(x, off); poly = elipse(c, a, b_, ANG+rng.uniform(-.2, .2)); z = min(chao(p) for p in poly)
    CB.prism(poly, z-.1, .5, 1)
    for _ in range(max(1, int(a/6))): arv_spots.append(c+U*rng.uniform(-a*.55, a*.55)+N*rng.uniform(-b_*.4, b_*.4))
# anel de canteiro em torno da praça do espelho (lado norte, voltado à avenida)
CB.build("BLV_praca_canteiros", [CONC, CANT])
# ---------- palmeira procedural (tronco anelado + coroa de 11 folhas arqueadas) ----------
pal = bpy.data.collections.get("BLV_palmeira")
if pal is None:
    pal = bpy.data.collections.new("BLV_palmeira")
    pm = bmesh.new(); H = 1.
    # tronco unitário (escala no objeto): 10 m, Ø .32
    bmesh.ops.create_cone(pm, cap_ends=False, segments=8, radius1=.19, radius2=.15, depth=10.)
    for v in pm.verts: v.co.z += 5.
    tm = bpy.data.meshes.new("BLV_palmeira_tronco"); pm.to_mesh(tm); pm.free(); tm.materials.append(TRONCO)
    to = bpy.data.objects.new("BLV_palmeira_tronco", tm); pal.objects.link(to)
    fv, ff = [], []
    for k in range(11):
        a = 2*math.pi*k/11+.2*math.sin(k*1.7); d = Vector((math.cos(a), math.sin(a), 0)); s = Vector((-d.y, d.x, 0))
        b0 = len(fv)
        for j in range(7):
            t = j/6; r = 4.2*t; z = 10.+1.1*math.sin(t*math.pi*.8)-1.9*t*t; w = .55*math.sin(t*math.pi)+.05
            c = d*r+Vector((0, 0, z)); fv += [tuple(c-s*w), tuple(c+s*w)]
        ff += [(b0+2*j, b0+2*j+2, b0+2*j+3, b0+2*j+1) for j in range(6)]
    fm = bpy.data.meshes.new("BLV_palmeira_folhas"); fm.from_pydata(fv, [], ff); fm.update(); fm.materials.append(FOLHA)
    fo = bpy.data.objects.new("BLV_palmeira_folhas", fm); pal.objects.link(fo)
n = 0
def inst(colname, p, s, nm):
    global n
    e = bpy.data.objects.new(f"BLV_arv_praca_{nm}{n:03d}", None); e.instance_type = 'COLLECTION'
    e.instance_collection = bpy.data.collections[colname]; e.location = (p.x, p.y, chao(p)); e.scale = (s, s, s)
    e.rotation_euler[2] = rng.random()*6.28; C.objects.link(e); n += 1
# palmeiras em alinhamento na borda da avenida (norte), a cada ~9 m, e duas fileiras marcando o espelho d'água
x = -60.
while x < 325:
    if not (75 < x < 115): inst("BLV_palmeira", P(x, yc(x)[1]-3.), rng.uniform(.95, 1.2), "p")
    x += rng.uniform(8.5, 9.5)
for k in range(-2, 3):
    for s in (-1, 1): inst("BLV_palmeira", POOL_C+U*k*8+N*s*(POOL_B+13), rng.uniform(1., 1.25), "p")
# árvores de sombra nos canteiros e uma grande copa isolada junto ao pergolado (como na imagem oficial)
SOMBRA = ["island_tree_01_LOD0", "island_tree_02_LOD0", "tree_small_02_LOD0"]
for p in arv_spots: inst(rng.choice(SOMBRA), p, rng.uniform(1.8, 2.5), "s")
inst("island_tree_01_LOD0", PC-U*29+N*2, 3.0, "s")
# borda sul: renque de árvores de sombra separando a praça das casas
x = -30.
while x < 320:
    if not (185 < x < 245): inst(rng.choice(SOMBRA), P(x, -(yc(x)[1]-4.)), rng.uniform(1.7, 2.3), "s")
    x += rng.uniform(13, 18)
result = dict(espelho=(round(POOL_C.x, 1), round(POOL_C.y, 1)), pergolado=(round(PC.x, 1), round(PC.y, 1)), canteiros=len(CAN), arvores=n)
