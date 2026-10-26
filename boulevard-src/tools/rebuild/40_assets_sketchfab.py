# Realismo 40: mais assets reais do Sketchfab (todos CC Attribution; créditos em assets/sketchfab/CREDITOS.txt).
#  carros   virtus (BHP3D), duster (ANDREO12), tcross (tangwang920) — entram no sorteio do 39; a Strada sai
#           (scan de malha única, sem UV nem material: renderiza branca e fosca)
#  árvores  ficus (Chinese Banyan, Valery.Li) e frangipani/jasmim-manga (PlantCatalog) — entram no modo 'perto'
#  palmeiras palm1/palm2 (NextSpring) — substituem a palmeira procedural da praça nos dois modos
#  pessoas  mei (renderpeople), homem (deep3dstudio) — escala humana nas fotos; nunca em aérea
#  moto     pcx (Honda PCX, devanirgrau) — estacionadas na calçada das lojas
# Os .glb ficam em ~/Movies/Boulevard_3D/assets/sketchfab (baixados com o token do usuário, que não vai ao repositório).
import bpy, os, io, contextlib, math, random
from mathutils import Vector, Matrix
scn = bpy.data.scenes["Boulevard"]; ns = bpy.app.driver_namespace; M = bpy.data.materials
D = os.path.expanduser("~/Movies/Boulevard_3D/assets/sketchfab"); out = {}
def wm(o):
    ch = []; q = o
    while q: ch.append(q); q = q.parent
    Mx = Matrix.Identity(4)
    for q in reversed(ch): Mx = Mx@(q.matrix_parent_inverse if q.parent else Matrix.Identity(4))@q.matrix_basis
    return Mx
def pts(col):
    P = []
    for o in col.objects:
        if o.type != 'MESH': continue
        Mx = wm(o); vs = o.data.vertices; st = max(1, len(vs)//4000)
        P += [Mx@vs[i].co for i in range(0, len(vs), st)]
    return P
def pct(a, q): a = sorted(a); return a[min(len(a)-1, max(0, int(q*len(a))))]
def importa(k, medida, modo='altura', frente=False):
    """importa assets/sketchfab/<k>.glb numa coleção ASSET_<k>; base centrada em (0,0,0); escala por altura ou comprimento;
    frente=True alinha o comprimento ao eixo X com a frente em +X (carros/motos)."""
    nome = f"ASSET_{k}"; col = bpy.data.collections.get(nome)
    if col:
        for o in list(col.objects): bpy.data.objects.remove(o, do_unlink=True)
    else: col = bpy.data.collections.new(nome)
    col.use_fake_user = True
    before = set(bpy.data.objects)
    with contextlib.redirect_stdout(io.StringIO()), contextlib.redirect_stderr(io.StringIO()):
        bpy.ops.import_scene.gltf(filepath=os.path.join(D, k+".glb"))
    for o in [o for o in bpy.data.objects if o not in before]:
        for c in list(o.users_collection): c.objects.unlink(o)
        col.objects.link(o)
    if frente:
        P = pts(col); xs = [p.x for p in P]; ys = [p.y for p in P]
        along_y = (pct(ys, .997)-pct(ys, .003)) > (pct(xs, .997)-pct(xs, .003))
        def cen(words):
            L = [wm(o)@Vector(c) for o in col.objects if o.type == 'MESH' and any(w in o.name.lower() for w in words) for c in o.bound_box]
            return sum(L, Vector())/len(L) if L else None
        c0 = sum(P, Vector())/len(P); fc, rc = cen(('front', 'head', 'grill', 'farol')), cen(('rear', 'tail', 'trunk', 'lanterna')); ax = 1 if along_y else 0
        pos = (fc is not None and fc[ax] > c0[ax]) or (fc is None and rc is not None and rc[ax] < c0[ax])
        ang = (-math.pi/2 if pos else math.pi/2) if along_y else (0 if pos else math.pi)
        for o in col.objects:
            if o.parent is None: o.matrix_basis = Matrix.Rotation(ang, 4, 'Z')@o.matrix_basis
    P = pts(col); xs = [p.x for p in P]; ys = [p.y for p in P]; zs = [p.z for p in P]
    x0, x1, y0, y1 = pct(xs, .003), pct(xs, .997), pct(ys, .003), pct(ys, .997); z0, z1 = pct(zs, .002), pct(zs, .998)
    s = medida/((z1-z0) if modo == 'altura' else (x1-x0))
    T = Matrix.Scale(s, 4)@Matrix.Translation(-Vector(((x0+x1)/2, (y0+y1)/2, z0)))
    for o in col.objects:
        if o.parent is None: o.matrix_basis = T@o.matrix_basis
    return col
def tinta_principal(col):
    """material de pintura: maior área entre os materiais claros/coloridos, opacos, não metálicos-escuros"""
    area = {}
    for o in col.objects:
        if o.type != 'MESH': continue
        mw_ = wm(o); sc = mw_.to_scale(); f = abs(sc.x*sc.y)
        for p in o.data.polygons:
            if p.material_index < len(o.material_slots) and o.material_slots[p.material_index].material:
                m = o.material_slots[p.material_index].material; area[m] = area.get(m, 0)+p.area*f
    best = None
    for m, a in sorted(area.items(), key=lambda x: -x[1]):
        if not m.use_nodes: continue
        b = next((x for x in m.node_tree.nodes if x.type == 'BSDF_PRINCIPLED'), None)
        if not b: continue
        nm = m.name.lower()
        if any(w in nm for w in ('glass', 'vidro', 'window', 'tire', 'tyre', 'pneu', 'rubber', 'interior', 'black', 'chrome', 'plastic', 'light', 'lamp')): continue
        if b.inputs['Alpha'].default_value < .9 or b.inputs.get('Transmission Weight', b.inputs['Alpha']).default_value > .5: continue
        c = b.inputs['Base Color'].default_value
        if not b.inputs['Base Color'].is_linked and max(c[:3]) < .08: continue
        best = m; break
    return best
CORES = [("branco", (.80, .80, .78), .0, .25, .35), ("prata", (.62, .63, .65), .85, .28, .25), ("cinza", (.18, .19, .2), .7, .3, .15),
         ("preto", (.012, .012, .014), .3, .25, .15), ("vermelho", (.38, .02, .02), .4, .28, .05), ("azul", (.03, .07, .2), .6, .3, .05)]
def variantes(k, base, pm):
    vs = []
    for cn, rgb, met, rough, w in CORES:
        nm = f"CARRO_real_{k}_{cn}"; col = bpy.data.collections.get(nm)
        if col:
            for o in list(col.objects): bpy.data.objects.remove(o, do_unlink=True)
        else: col = bpy.data.collections.new(nm)
        col.use_fake_user = True
        tm = M.get(f"CARP_{k}_{cn}") or pm.copy(); tm.name = f"CARP_{k}_{cn}"
        b = next(x for x in tm.node_tree.nodes if x.type == 'BSDF_PRINCIPLED')
        for l in list(b.inputs['Base Color'].links): tm.node_tree.links.remove(l)
        b.inputs['Base Color'].default_value = (*rgb, 1); b.inputs['Metallic'].default_value = met; b.inputs['Roughness'].default_value = rough
        b.inputs['Coat Weight'].default_value = 1.; b.inputs['Coat Roughness'].default_value = .03
        mp = {}
        for o in base.objects: c = o.copy(); mp[o] = c; col.objects.link(c)
        for o, c in mp.items():
            if o.parent in mp: c.parent = mp[o.parent]
            if c.type == 'MESH':
                for s in c.material_slots:
                    if s.material == pm: s.link = 'OBJECT'; s.material = tm
        vs.append((nm, w))
    return vs
# ---------- carros novos ----------
NOVOS = {"virtus": 4.56, "duster": 4.34, "tcross": 4.20}
POOL = []
for k, L in NOVOS.items():
    if not os.path.exists(os.path.join(D, k+".glb")): continue
    base = importa(k, L, 'comprimento', frente=True); pm = tinta_principal(base)
    out[k] = pm.name if pm else None
    if pm: POOL += variantes(k, base, pm)
for k in ("onix", "compass", "corolla"):
    for cn, *_r, w in CORES:
        if bpy.data.collections.get(f"CARRO_real_{k}_{cn}"): POOL.append((f"CARRO_real_{k}_{cn}", w))
for c in bpy.data.collections:
    if c.name.startswith("CARRO_real"): c.use_fake_user = True
rng = random.Random(40); nomes = [p[0] for p in POOL]; pesos = [p[1] for p in POOL]; n = 0
for o in scn.objects:
    ic = o.instance_collection if o.instance_type == 'COLLECTION' else None
    if ic and ic.name.startswith("CARRO_"):
        o.instance_collection = bpy.data.collections[rng.choices(nomes, weights=pesos)[0]]; n += 1
out['carros'] = (len(POOL), n)
# ---------- árvores e palmeiras ----------
FICUS = importa("ficus", 9.5); FRANG = importa("frangipani", 5.2)
P1 = importa("palm1", 10.5); P2 = importa("palm2", 11.)
ns['blv_arvores_extra'] = [FICUS.name, FRANG.name]   # o 34 sorteia daqui também no modo 'perto'
# palm2 é um pacote de ~20 palmeiras espalhadas: separa as 3 mais altas, cada uma centrada na base do estipe
import re
grp = {}
for o in P2.objects:
    m_ = re.search(r"P2_(\d+)_", o.name)
    if m_ and o.type == 'MESH': grp.setdefault(m_.group(1), []).append(o)
info = []
for gid, objs in grp.items():
    tr = [o for o in objs if 'Trunk' in o.name]
    if not tr: continue
    Pt = [wm(tr[0])@Vector(c) for c in tr[0].bound_box]
    info.append((max(p.z for p in Pt), gid, Vector((sum(p.x for p in Pt)/8, sum(p.y for p in Pt)/8, min(p.z for p in Pt))), objs))
SOLO = [P1]
for h, gid, base, objs in sorted(info, key=lambda t: -t[0])[:3]:
    nm = f"ASSET_palm2_{gid}"; col = bpy.data.collections.get(nm) or bpy.data.collections.new(nm); col.use_fake_user = True
    for o in list(col.objects): bpy.data.objects.remove(o, do_unlink=True)
    T = Matrix.Scale(10.5/max(h-base.z, 1e-3), 4)@Matrix.Translation(-base)
    for o in objs: c = o.copy(); c.parent = None; c.matrix_basis = T@wm(o); col.objects.link(c)
    SOLO.append(col)
pal = 0
for o in scn.objects:
    ic = o.instance_collection if o.instance_type == 'COLLECTION' else None
    if ic and (ic.name == "BLV_palmeira" or ic.name.startswith("ASSET_palm")):
        r = random.Random(o.name); o.instance_collection = r.choice(SOLO); s = r.uniform(.9, 1.1); o.scale = (s, s, s)
        o.rotation_euler[2] = r.random()*6.28; pal += 1
out['palmeiras'] = pal
# ---------- pessoas e motos (coleções prontas; posicionadas por foto em 36/38) ----------
MEI = importa("mei", 1.66); HOM = importa("homem", 1.80); PCX = importa("pcx", 1.92, 'comprimento', frente=True)
C = bpy.data.collections.get("BLV_Motos") or bpy.data.collections.new("BLV_Motos")
if C.name not in scn.collection.children: scn.collection.children.link(C)
for o in list(C.objects): bpy.data.objects.remove(o, do_unlink=True)
chao = ns.get('chao')
for i, (x, y) in enumerate(((-63.5, -8.2), (-64.6, -8.4), (-86., -8.0))):   # calçada das lojas
    e = bpy.data.objects.new(f"BLV_moto_{i}", None); e.instance_type = 'COLLECTION'; e.instance_collection = PCX
    e.location = (x, y, (chao(x, y) if chao else 0)+.12); e.rotation_euler[2] = math.radians(95+i*7); C.objects.link(e)
def pessoas(lista):
    """lista de (x, y, rot_graus, 'mei'|'homem'); recria BLV_Pessoas"""
    P = bpy.data.collections.get("BLV_Pessoas") or bpy.data.collections.new("BLV_Pessoas")
    if P.name not in scn.collection.children: scn.collection.children.link(P)
    for o in list(P.objects): bpy.data.objects.remove(o, do_unlink=True)
    for i, (x, y, r, q) in enumerate(lista):
        e = bpy.data.objects.new(f"BLV_pessoa_{i}", None); e.instance_type = 'COLLECTION'
        e.instance_collection = bpy.data.collections["ASSET_"+q]; f = ns.get('chao')
        e.location = (x, y, (f(x, y) if f else 0)+.1); e.rotation_euler[2] = math.radians(r); P.objects.link(e)
    return len(lista)
ns['blv_pessoas'] = pessoas
result = out
