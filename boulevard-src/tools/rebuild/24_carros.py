# Realismo 24: vida no chão — carros (modelo procedural leve, instanciado) nas vagas do estacionamento
# (mesmas fileiras do blender_site.py, ~70% ocupadas) e circulando na avenida e na rótula.
import bpy, bmesh, math, random
from mathutils import Vector, Matrix
scn = bpy.data.scenes["Boulevard"]; rng = random.Random(8)
SITE = .1015
def S(x, y): return ((x-1250)*SITE, (y-400)*SITE)
def BL(p): return Vector((p[0], -p[1]))
def coll(name, link=True):
    c = bpy.data.collections.get(name) or bpy.data.collections.new(name)
    if link and c.name not in scn.collection.children: scn.collection.children.link(c)
    for o in list(c.objects): bpy.data.objects.remove(o, do_unlink=True)
    return c
C = coll("BLV_Carros"); LIB = coll("BLV_Carros_Modelos", link=False)
def pmat(name, rgb, rough, metal=0., coat=0.):
    m = bpy.data.materials.get(name) or bpy.data.materials.new(name); m.use_nodes = True
    b = m.node_tree.nodes['Principled BSDF']; b.inputs['Base Color'].default_value = (*rgb, 1); b.inputs['Roughness'].default_value = rough
    b.inputs['Metallic'].default_value = metal; b.inputs['Coat Weight'].default_value = coat; return m
VID = pmat("CAR_vidro", (.02, .025, .03), .05, .0, 1.); PNEU = pmat("CAR_pneu", (.02, .02, .02), .8)
CROMO = pmat("CAR_roda", (.5, .5, .52), .3, 1.); FAROL = pmat("CAR_farol", (.9, .9, .85), .1)
TINTAS = [((.8, .8, .78), .25, 0.), ((.55, .56, .58), .3, .8), ((.02, .02, .022), .2, .3), ((.25, .26, .27), .3, .7),
          ((.42, .03, .03), .25, .3), ((.05, .1, .25), .25, .5), ((.6, .6, .6), .3, .9), ((.85, .84, .8), .25, 0.)]
PESO = [.24, .2, .18, .14, .07, .06, .07, .04]
def bloco(bm, c, d, mat_i, bev=0.):
    g = bmesh.ops.create_cube(bm, size=1.)['verts']
    bmesh.ops.scale(bm, vec=d, verts=g); bmesh.ops.translate(bm, vec=c, verts=g)
    fs = list({f for v in g for f in v.link_faces})
    for f in fs: f.material_index = mat_i
    if bev:
        es = list({e for v in g for e in v.link_edges}); bmesh.ops.bevel(bm, geom=es, offset=bev, segments=2, affect='EDGES')
def carro(nome, L, Wd, H, cab, tinta):
    me = bpy.data.meshes.new(nome); bm = bmesh.new()
    bloco(bm, (0, 0, .32+(H*.42)/2), (L, Wd, H*.42), 0, .12)                                  # carroceria
    bloco(bm, (-L*.06+cab[1], 0, .32+H*.42+cab[0]/2), (L*cab[2], Wd*.86, cab[0]), 1, .1)       # cabine (vidro)
    bloco(bm, (-L*.06+cab[1], 0, .32+H*.42+cab[0]+.03), (L*cab[2]*.82, Wd*.84, .06), 0, .02)  # teto
    for sx in (-1, 1):
        for sy in (-1, 1):
            bm2 = bmesh.ops.create_cone(bm, cap_ends=True, segments=16, radius1=.33, radius2=.33, depth=.22)['verts']
            bmesh.ops.rotate(bm, verts=bm2, cent=(0, 0, 0), matrix=Matrix.Rotation(math.pi/2, 3, 'X'))
            bmesh.ops.translate(bm, vec=(sx*L*.33, sy*(Wd/2-.1), .33), verts=bm2)
            for f in {f for v in bm2 for f in v.link_faces}: f.material_index = 2
    bloco(bm, (L/2-.02, 0, .32+H*.3), (.04, Wd*.8, .12), 3)
    bm.to_mesh(me); bm.free()
    for p in me.polygons: p.use_smooth = True
    for m_ in (pmat(f"CAR_tinta_{tinta}", *TINTAS[tinta], coat=1.), VID, PNEU, FAROL): me.materials.append(m_)
    o = bpy.data.objects.new(nome, me); LIB.objects.link(o)
    col = bpy.data.collections.get(f"CARRO_{nome}") or bpy.data.collections.new(f"CARRO_{nome}")
    for x in list(col.objects): col.objects.unlink(x)
    col.objects.link(o); return col
FORMAS = {"sedan": (4.45, 1.78, 1.05, (.5, .05, .5)), "hatch": (3.95, 1.72, 1.0, (.55, -.1, .58)), "suv": (4.5, 1.85, 1.3, (.55, -.05, .62))}
MODELOS = []
for fn, (L, Wd, H, cab) in FORMAS.items():
    for t in range(len(TINTAS)): MODELOS.append((carro(f"{fn}_{t}", L, Wd, H, cab, t), t))
def escolhe():
    t = rng.choices(range(len(TINTAS)), weights=PESO)[0]
    return [m for m, tt in MODELOS if tt == t][rng.randrange(3)]
def poe(p, ang, z=.03):
    e = bpy.data.objects.new("BLV_carro", None); e.instance_type = 'COLLECTION'; e.instance_collection = escolhe()
    e.location = (p.x, p.y, z); e.rotation_euler[2] = ang; C.objects.link(e)
# ---------- vagas (mesmas fileiras do blender_site.py) ----------
n = 0
def row(x0, x1, y0, y1, step, ocup=.72):
    global n
    x = x0+step/2
    while x < x1:
        if rng.random() < ocup:
            p = BL(S(x, (y0+y1)/2)); ang = math.pi/2+(math.pi if rng.random() < .5 else 0)+rng.uniform(-.04, .04)
            poe(p+Vector((rng.uniform(-.1, .1), rng.uniform(-.15, .15))), ang); n += 1
        x += step
def colr(x0, x1, y0, y1, step, ocup=.72):
    global n
    y = y0+step/2
    while y < y1:
        if rng.random() < ocup:
            p = BL(S((x0+x1)/2, y)); ang = (math.pi if rng.random() < .5 else 0)+rng.uniform(-.04, .04)
            poe(p, ang); n += 1
        y += step
row(838,1890,138,186,25); row(1012,1820,424,470,25)
for a in [[1005,1105],[1155,1255],[1318,1418],[1468,1568],[1620,1720],[1770,1820]]: row(a[0],a[1],480,527,25); row(a[0],a[1],527,575,25)
for a in [[548,648],[698,798]]: row(a[0],a[1],432,478,25); row(a[0],a[1],478,525,25); row(a[0],a[1],525,575,25)
row(268,368,492,575,25); colr(850,898,388,570,24); colr(902,950,388,570,24)
# ---------- avenida (mesma curva do blender_site.py) ----------
MAIN_S = [[-60,-2700],[20,-1500],[55,-300],[75,0],[120,250],[165,450],[215,610],[300,745],[460,830],[700,850],[1300,856],[2000,858]]
def catmull(ctrl, m):
    P = [ctrl[0]]+ctrl+[ctrl[-1]]; out = []; seg = len(ctrl)-1
    for k in range(m+1):
        t = k/m*seg; i = min(int(t), seg-1); u = t-i; p0, p1, p2, p3 = P[i], P[i+1], P[i+2], P[i+3]
        out.append(tuple(.5*((2*p1[d])+(-p0[d]+p2[d])*u+(2*p0[d]-5*p1[d]+4*p2[d]-p3[d])*u*u+(-p0[d]+3*p1[d]-3*p2[d]+p3[d])*u**3) for d in (0, 1)))
    return out
pts = [BL(p) for p in catmull([S(*p) for p in MAIN_S], 4000)]
RB = BL(S(300, 745)); nv = 0; acc = 0.; last = pts[0]
for i in range(1, len(pts)-1):
    p = pts[i]; acc += (p-last).length; last = p
    if acc < rng.uniform(14, 40): continue
    acc = 0.
    if (p-RB).length < 26 or p.length > 700: continue
    t = (pts[i+1]-pts[i-1]).normalized(); nn = Vector((-t.y, t.x))
    for lane, sentido in ((2.3, 0), (6.4, 0), (-2.3, math.pi), (-6.4, math.pi)):
        if rng.random() < .28:
            q = p+nn*lane; poe(q, math.atan2(t.y, t.x)+sentido, .16); nv += 1
for k in range(6):   # rótula
    a = rng.uniform(0, 2*math.pi); q = RB+Vector((math.cos(a), math.sin(a)))*19; poe(q, a+math.pi/2, .2); nv += 1
result = dict(vagas=n, rua=nv)
