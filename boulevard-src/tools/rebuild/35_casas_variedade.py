# Realismo 35: variedade das casas. O 23 gera toda casa com telhado de 4 águas: de cima o bairro vira tabuleiro.
# Palhoça/Pedra Branca real mistura: 4 águas cerâmico, laje plana com platibanda (casa nova), e quase toda casa tem
# caixa d'água de fibra azul ou bege aparente. Pós-processo nos meshes do 23 (não regenera o bairro):
#  - ~35% dos telhados viram laje + platibanda de 0,9 m (cor da parede vizinha: concreto claro)
#  - caixa d'água (cilindro Ø1,6 m) em ~45% das casas
#  - edícula/garagem baixa ao lado em ~25%
import bpy, bmesh, math, random
from mathutils import Vector
scn = bpy.data.scenes["Boulevard"]; rng = random.Random(35); M = bpy.data.materials
C = bpy.data.collections["BLV_Bairro"]
from mathutils.bvhtree import BVHTree
TER = scn.objects["BLV_terreno"]; _bvh = BVHTree.FromObject(TER, bpy.context.evaluated_depsgraph_get(), deform=False)
_mw = TER.matrix_world; _ti = _mw.inverted(); _dl = (_ti.to_3x3()@Vector((0, 0, -1))).normalized()
def chao(p):
    loc, *_ = _bvh.ray_cast(_ti@Vector((p.x, p.y, 3000.)), _dl)
    return (_mw@loc).z if loc is not None else 0.
for nm in ("BLV_casas_laje", "BLV_casas_caixa", "BLV_casas_edicula"):
    o = scn.objects.get(nm)
    if o: bpy.data.objects.remove(o, do_unlink=True)
def mat(name, col, rough=.6):
    m = M.get(name) or M.new(name); m.use_nodes = True; b = m.node_tree.nodes.get('Principled BSDF')
    if b: b.inputs['Base Color'].default_value = col; b.inputs['Roughness'].default_value = rough
    return m
LAJE = mat("BLV_Casa_Laje", (.30, .295, .28, 1), .85)
CX_AZ = mat("BLV_Caixa_Agua_Azul", (.05, .12, .30, 1), .4); CX_BG = mat("BLV_Caixa_Agua_Bege", (.42, .38, .30, 1), .45)
ED = M.get("BLV_Casa_Parede_2") or LAJE
class MB:
    def __init__(s): s.v = []; s.f = []; s.m = []
    def prism(s, poly, z0, h, mi=0):
        b = len(s.v); n = len(poly); s.v += [(p.x, p.y, z0) for p in poly]+[(p.x, p.y, z0+h) for p in poly]
        s.f.append(tuple(range(b+n-1, b-1, -1))); s.f.append(tuple(range(b+n, b+2*n))); s.m += [mi, mi]
        s.f += [(b+i, b+(i+1) % n, b+n+(i+1) % n, b+n+i) for i in range(n)]; s.m += [mi]*n
    def build(s, name, mats):
        if not s.v: return 0
        me = bpy.data.meshes.new(name); me.from_pydata(s.v, [], s.f); me.update()
        for m in mats: me.materials.append(m)
        for p, mi in zip(me.polygons, s.m): p.material_index = mi
        C.objects.link(bpy.data.objects.new(name, me)); return len(s.f)
LJ, CX, EDI = MB(), MB(), MB()
nl = ncx = ned = 0
for o in [o for o in scn.objects if o.name.startswith("BLV_casas_telhado_") and o.type == 'MESH']:
    if o.get('blv35'): continue   # já processado
    bm = bmesh.new(); bm.from_mesh(o.data); bm.verts.ensure_lookup_table(); mw = o.matrix_world
    seen = set(); kill = []
    for f in bm.faces:
        if f.index in seen: continue
        st = [f]; isl = []
        while st:
            g = st.pop()
            if g.index in seen: continue
            seen.add(g.index); isl.append(g)
            for e in g.edges:
                for h in e.link_faces:
                    if h.index not in seen: st.append(h)
        vs = {v for g in isl for v in g.verts}
        if len(vs) != 6: continue
        base = sorted(vs, key=lambda v: v.co.z)[:4]; zb = base[0].co.z
        c = sum(((mw@v.co).xy for v in base), Vector((0, 0)))/4
        # ordena os 4 cantos em volta do centro
        poly = sorted([(mw@v.co).xy for v in base], key=lambda p: math.atan2(p.y-c.y, p.x-c.x))
        # recua 6% (o beiral do 4 águas sai da parede)
        poly = [c+(p-c)*.94 for p in poly]
        r = rng.random()
        if r < .35:   # laje plana com platibanda
            kill += isl; LJ.prism(poly, zb-.05, .9, 0); nl += 1
            ztop = zb+.85
        else: ztop = zb+1.0
        if rng.random() < .45:   # caixa d'água
            u = (poly[1]-poly[0]).normalized(); p = c+u*rng.uniform(-1.5, 1.5)
            ring = [p+Vector((math.cos(a), math.sin(a)))*.8 for a in [i*math.pi/6 for i in range(12)]]
            CX.prism(ring, ztop-.2, 1.1, 0 if rng.random() < .7 else 1); ncx += 1
        if rng.random() < .25:   # edícula / garagem
            u = (poly[1]-poly[0]); w = u.length; u = u.normalized(); nrm = Vector((-u.y, u.x))
            q0 = poly[1]+u*.3; ed = [q0, q0+u*3.2, q0+u*3.2+nrm*5., q0+nrm*5.]
            zg = min(chao(p_) for p_ in ed)
            EDI.prism(ed, zg-.2, 3.0, 0); ned += 1
    if kill: bmesh.ops.delete(bm, geom=list({id(f): f for f in kill}.values()), context='FACES'); bm.to_mesh(o.data)
    bm.free(); o['blv35'] = 1
LJ.build("BLV_casas_laje", [LAJE]); CX.build("BLV_casas_caixa", [CX_AZ, CX_BG]); EDI.build("BLV_casas_edicula", [ED])
result = dict(lajes=nl, caixas=ncx, ediculas=ned)
