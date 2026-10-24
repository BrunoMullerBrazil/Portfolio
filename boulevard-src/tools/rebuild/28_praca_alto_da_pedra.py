# Realismo 28: Praça Oscar Niemeyer (centralidade do bairro Altos da Pedra, Firenze Multi-Urbanismo), na faixa ao sul
# da avenida, a leste da rótula — indicada pelo Bruno em 24/out. Segundo altosdapedra.com.br: pavimentação 100%,
# paisagismo 90%, programa de praça + comércio e serviços. Aqui: tira as casas genéricas dessa faixa e monta piso de
# praça, canteiros gramados e arborização. Não modela a escultura nem edifícios que não estão mapeados (sem inventar).
import bpy, bmesh, math, random
from mathutils import Vector
scn = bpy.data.scenes["Boulevard"]; rng = random.Random(28)
POLY = [Vector(p) for p in ((-75, -62), (120, -82), (260, -100), (335, -116), (332, -160), (280, -150), (150, -127),
                            (-20, -110), (-52, -96))]
def inpoly(p, poly=POLY):
    c = False; j = len(poly)-1
    for i in range(len(poly)):
        a, b = poly[i], poly[j]
        if ((a.y > p.y) != (b.y > p.y)) and (p.x < (b.x-a.x)*(p.y-a.y)/(b.y-a.y)+a.x): c = not c
        j = i
    return c
from mathutils.bvhtree import BVHTree
TER = scn.objects["BLV_terreno"]
_bvh = BVHTree.FromObject(TER, bpy.context.evaluated_depsgraph_get(), deform=False)   # índice montado uma vez
_mw = TER.matrix_world; _ti = _mw.inverted(); _dl = (_ti.to_3x3()@Vector((0, 0, -1))).normalized()
def chao(p):     # só o terreno (antes pegava copa de árvore e prédio e levantava a rua)
    loc, *_ = _bvh.ray_cast(_ti@Vector((p.x, p.y, 3000.)), _dl)
    return (_mw@loc).z if loc is not None else 0.
# 1) casas, muros, janelas e quintais dentro da praça saem (remove as faces/caixas cujo centro cai no polígono)
def tira_ilhas(o, dentro):
    bm = bmesh.new(); bm.from_mesh(o.data); mw = o.matrix_world; seen = set(); kill = []
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
        c = sum(((mw@v.co).xy for g in isl for v in g.verts), Vector((0, 0)))/sum(len(g.verts) for g in isl)
        if dentro(c): kill += isl
    if kill: bmesh.ops.delete(bm, geom=list({id(f): f for f in kill}.values()), context='FACES'); bm.to_mesh(o.data)
    bm.free(); return len(kill)
rem = 0
for o in list(scn.objects):
    if o.type == 'MESH' and o.name.startswith(("BLV_casas_", "BLV_galpoes")): rem += tira_ilhas(o, inpoly)
for o in list(scn.objects):
    if o.name.startswith("BLV_arv") and not o.name.startswith("BLV_arv_praca") and inpoly(o.location.xy):
        bpy.data.objects.remove(o, do_unlink=True)
# 2) piso da praça (concreto claro em placas), canteiros gramados e árvores em alinhamento
C = bpy.data.collections.get("BLV_Praca") or bpy.data.collections.new("BLV_Praca")
if C.name not in scn.collection.children: scn.collection.children.link(C)
for o in list(C.objects): bpy.data.objects.remove(o, do_unlink=True)
def mat_piso():
    m = bpy.data.materials.get("BLV_Praca_Piso") or bpy.data.materials.new("BLV_Praca_Piso"); m.use_nodes = True
    nt = m.node_tree; nt.nodes.clear(); L = nt.links.new
    out = nt.nodes.new('ShaderNodeOutputMaterial'); b = nt.nodes.new('ShaderNodeBsdfPrincipled'); L(b.outputs[0], out.inputs[0])
    tc = nt.nodes.new('ShaderNodeTexCoord'); br = nt.nodes.new('ShaderNodeTexBrick'); br.offset = .5; br.squash = 1.
    br.inputs['Scale'].default_value = .5; br.inputs['Mortar Size'].default_value = .006
    br.inputs['Color1'].default_value = (.62, .60, .56, 1); br.inputs['Color2'].default_value = (.55, .53, .50, 1); br.inputs['Mortar'].default_value = (.35, .34, .32, 1)
    L(tc.outputs['Object'], br.inputs['Vector']); L(br.outputs['Color'], b.inputs['Base Color']); b.inputs['Roughness'].default_value = .8
    bp = nt.nodes.new('ShaderNodeBump'); bp.inputs['Strength'].default_value = .25; L(br.outputs['Fac'], bp.inputs['Height']); L(bp.outputs[0], b.inputs['Normal'])
    return m
PISO = mat_piso(); GRAMA = bpy.data.materials.get("BLV_Gramado") or PISO
# grade sobre o polígono, seguindo o relevo
xs = [p.x for p in POLY]; ys = [p.y for p in POLY]; step = 4.
V, F, idx = [], [], {}
nx = int((max(xs)-min(xs))/step)+1; ny = int((max(ys)-min(ys))/step)+1
for j in range(ny+1):
    for i in range(nx+1):
        p = Vector((min(xs)+i*step, min(ys)+j*step)); idx[(i, j)] = len(V); V.append((p.x, p.y, chao(p)+.09))
for j in range(ny):
    for i in range(nx):
        c = Vector((min(xs)+(i+.5)*step, min(ys)+(j+.5)*step))
        if inpoly(c): F.append((idx[(i, j)], idx[(i+1, j)], idx[(i+1, j+1)], idx[(i, j+1)]))
me = bpy.data.meshes.new("BLV_praca_piso"); me.from_pydata(V, [], F); me.update(); me.materials.append(PISO); me.materials.append(GRAMA)
# canteiros: manchas orgânicas de grama (ruído) — material 1
for k, f in enumerate(me.polygons):
    c = f.center
    v = math.sin(c.x*.045)+math.sin(c.y*.06+c.x*.02)+.6*math.sin((c.x+c.y)*.11)
    if v > .9: f.material_index = 1
po = bpy.data.objects.new("BLV_praca_piso", me); C.objects.link(po)
# árvores: alinhamento nas bordas e bosquete nos canteiros
spec = ["tree_small_02", "island_tree_01", "island_tree_02"]; n = 0
def arvore(p, s):
    global n
    e = bpy.data.objects.new(f"BLV_arv_praca_{n:03d}", None); e.instance_type = 'COLLECTION'
    e.instance_collection = bpy.data.collections[f"{rng.choice(spec)}_LOD0"]; e.location = (p.x, p.y, chao(p))
    e.scale = (s, s, s); e.rotation_euler[2] = rng.random()*6.28; C.objects.link(e); n += 1
for i in range(len(POLY)):
    a, b = POLY[i], POLY[(i+1) % len(POLY)]; L = (b-a).length; k = 4.
    while k < L-4:
        p = a.lerp(b, k/L); c = sum(POLY, Vector((0, 0)))/len(POLY); q = p+(c-p).normalized()*3.
        if inpoly(q): arvore(q, rng.uniform(1.6, 2.2))
        k += rng.uniform(9, 12)
for f in me.polygons:
    if f.material_index == 1 and rng.random() < .05: arvore(Vector((f.center.x, f.center.y)), rng.uniform(1.8, 2.6))
result = dict(faces_removidas=rem, arvores=n, piso=len(F))
