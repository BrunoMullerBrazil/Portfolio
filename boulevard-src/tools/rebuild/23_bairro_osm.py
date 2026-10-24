# Realismo 23: bairro real a partir do OpenStreetMap (assets/osm/pedra_branca.json), no encaixe geográfico real
# (driver_namespace['blv_geo'], definido em 02_dem.py: avenida da frente = pista dupla real; rótula do site = rótula real).
#  - ruas reais substituem as vias desenhadas à mão (o ramo norte da avenida do site não existe e sai);
#  - prédios mapeados viram volumes; lotes com casas preenchem as quadras ao longo das ruas;
#  - mata real (wood/scrub) recebe árvores; árvores, postes e carros que caíam fora das ruas reais saem.
# Rodar depois de rodar_exterior.py (precisa de blender_site/details/carros) e ANTES de blender_bairro.py.
import bpy, bmesh, json, math, os, random
from mathutils import Vector
scn = bpy.data.scenes["Boulevard"]; rng = random.Random(64); ns = bpy.app.driver_namespace
LAT0, LON0 = -27.6340, -48.6822
GEO = ns.get('blv_geo') or dict(rot=61., off=(28.2, -45.7))
cr, sr = math.cos(math.radians(GEO['rot'])), math.sin(math.radians(GEO['rot']))
ml = 111320.; mo = 111320.*math.cos(math.radians(LAT0))
def geo2bl(lat, lon):
    E = (lon-LON0)*mo-GEO['off'][0]; Nn = (lat-LAT0)*ml-GEO['off'][1]
    return Vector((cr*E+sr*Nn, -sr*E+cr*Nn))
r = json.load(open(os.path.expanduser("~/Movies/Boulevard_3D/assets/osm/pedra_branca.json")))
dg = bpy.context.evaluated_depsgraph_get()
def chao(p):
    hit, loc, *_ = scn.ray_cast(dg, Vector((p.x, p.y, 3000.)), Vector((0, 0, -1)))
    return loc.z if hit else 0.
def coll(name):
    c = bpy.data.collections.get(name) or bpy.data.collections.new(name)
    if c.name not in scn.collection.children: scn.collection.children.link(c)
    for o in list(c.objects): bpy.data.objects.remove(o, do_unlink=True)
    return c
C = coll("BLV_Bairro_OSM")
# lote do condomínio (implantação do book) + Torre di Mosto: nada do OSM entra aqui
LOTE = (-106., 80., -47., 32.)
def no_lote(p, m=0.): return LOTE[0]-m < p.x < LOTE[1]+m and LOTE[2]-m < p.y < LOTE[3]+m
MOSTO = Vector((-80., 66.))
RB = Vector(((300-1250)*.1015, -(745-400)*.1015))
# ---------- dados ----------
W = {'secondary': 11., 'secondary_link': 7., 'tertiary': 9., 'tertiary_link': 7., 'residential': 7., 'unclassified': 7.,
     'living_street': 6., 'service': 4.}
ways, blds, areas = [], [], []
for e in r['elements']:
    if e['type'] != 'way' or 'geometry' not in e: continue
    t = e.get('tags', {}); pts = [geo2bl(g['lat'], g['lon']) for g in e['geometry']]
    if t.get('highway') in W: ways.append((t['highway'], pts, t.get('junction') == 'roundabout'))
    elif 'building' in t: blds.append((pts, t))
    elif t.get('natural') in ('wood', 'scrub') or t.get('landuse') in ('forest',): areas.append(('mata', pts))
    elif t.get('leisure') in ('park', 'pitch') or t.get('landuse') in ('grass', 'meadow', 'recreation_ground'): areas.append(('verde', pts))
def inpoly(p, poly):
    c = False; j = len(poly)-1
    for i in range(len(poly)):
        a, b = poly[i], poly[j]
        if ((a.y > p.y) != (b.y > p.y)) and (p.x < (b.x-a.x)*(p.y-a.y)/(b.y-a.y)+a.x): c = not c
        j = i
    return c
# grade de pontos de rua para distância rápida
GRID = {}
def addg(p, w):
    k = (int(p.x//20), int(p.y//20)); GRID.setdefault(k, []).append((p, w))
dens_ways = []
for h, pts, rb in ways:
    d = []
    for i in range(len(pts)-1):
        a, b = pts[i], pts[i+1]; n = max(1, int((b-a).length/4))
        d += [a.lerp(b, k/n) for k in range(n)]
    d.append(pts[-1]); dens_ways.append((h, d, rb))
    for p in d: addg(p, W[h])
def dist_rua(p):
    best = 1e9; kx, ky = int(p.x//20), int(p.y//20)
    for i in (-1, 0, 1):
        for j in (-1, 0, 1):
            for q, w in GRID.get((kx+i, ky+j), ()): best = min(best, (q-p).length-w/2)
    return best
# ---------- remove vias desenhadas à mão (exceto a ilha da rótula) ----------
for o in list(scn.objects):
    if o.name.startswith("BLV_via_"):
        if o.name in ("BLV_via_median", "BLV_via_curb"):
            bm = bmesh.new(); bm.from_mesh(o.data)
            bmesh.ops.delete(bm, geom=[v for v in bm.verts if (o.matrix_world@v.co).xy.__sub__(RB).length > 11], context='VERTS')
            bm.to_mesh(o.data); bm.free()
        else: bpy.data.objects.remove(o, do_unlink=True)
# ---------- ruas ----------
def ribbon(name, segs, mat, dz, extra=0., wfix=None):
    V, F = [], []
    for (h, pts, rb) in segs:
        if len(pts) < 2: continue
        w = wfix if wfix else W[h]+extra; b0 = len(V)
        for i, p in enumerate(pts):
            a = pts[max(0, i-1)]; c = pts[min(len(pts)-1, i+1)]; t = (c-a); t = t.normalized() if t.length else Vector((1, 0))
            nn = Vector((-t.y, t.x))*w/2
            for q in (p+nn, p-nn): V.append((q.x, q.y, chao(q)+dz))
        for i in range(len(pts)-1):
            k = b0+i*2; F.append((k, k+1, k+3, k+2))
    me = bpy.data.meshes.new(name); me.from_pydata(V, [], F); me.update(); me.materials.append(mat)
    o = bpy.data.objects.new(name, me); C.objects.link(o); return o
M = bpy.data.materials
ribbon("BLV_osm_calcada", [s for s in dens_ways if s[0] not in ('service',)], M["BLV_Calcada"], .06, 4.5)
ribbon("BLV_osm_asfalto", dens_ways, M["BLV_Asfalto"], .12)
# faixas tracejadas no eixo das ruas principais
fx = []
for h, d, rb in dens_ways:
    if h in ('secondary', 'tertiary') and not rb:
        for i in range(0, len(d)-1, 3): fx.append((h, [d[i], d[i+1]], False))
ribbon("BLV_osm_faixa", fx, M["BLV_Faixa"], .14, wfix=.14)
# ---------- casas: substitui as casas soltas do site ----------
for o in list(scn.objects):
    if o.name.startswith(("BLV_casas_", "BLV_galpoes")): bpy.data.objects.remove(o, do_unlink=True)
C_N = bpy.data.collections["BLV_Bairro"]
class MB:
    def __init__(s): s.v = []; s.f = []
    def obox(s, c, u, w, d, z0, h):
        n = Vector((-u.y, u.x)); P_ = [c+u*a+n*b for a, b in ((-w/2, -d/2), (w/2, -d/2), (w/2, d/2), (-w/2, d/2))]
        b = len(s.v); s.v += [(p.x, p.y, z0) for p in P_]+[(p.x, p.y, z0+h) for p in P_]
        s.f += [(b+3, b+2, b+1, b), (b+4, b+5, b+6, b+7)]+[(b+i, b+(i+1) % 4, b+4+(i+1) % 4, b+4+i) for i in range(4)]
    def prism(s, poly, z0, h):
        b = len(s.v); n = len(poly); s.v += [(p.x, p.y, z0) for p in poly]+[(p.x, p.y, z0+h) for p in poly]
        s.f.append(tuple(range(b+n-1, b-1, -1))); s.f.append(tuple(range(b+n, b+2*n)))
        s.f += [(b+i, b+(i+1) % n, b+n+(i+1) % n, b+n+i) for i in range(n)]
    def build(s, name, m, col):
        if not s.v: return
        me = bpy.data.meshes.new(name); me.from_pydata(s.v, [], s.f); me.update(); me.materials.append(m)
        col.objects.link(bpy.data.objects.new(name, me))
def srgb(hx):
    c = [((hx >> s) & 255)/255 for s in (16, 8, 0)]
    return tuple((v/12.92 if v <= .04045 else ((v+.055)/1.055)**2.4) for v in c)+(1,)
def mat(name, hx):
    m = M.get(name)
    if m is None:
        m = M.new(name); m.use_nodes = True; m.node_tree.nodes['Principled BSDF'].inputs['Base Color'].default_value = srgb(hx)
    return m
WC = [0xeeeae1, 0xe5ddcf, 0xd9d3c6, 0xf2efe8, 0xc9c0ad, 0xe9e2d2, 0xbfc4c6]; RC = [0x8e4a34, 0x9a5a3f, 0x5e5f61, 0x7b3e2c, 0x3f4144, 0xa86a4c]
HW = [MB() for _ in WC]; HR = [MB() for _ in RC]; PB = MB()
occ = {}
def livre(c, rad):
    kx, ky = int(c.x//25), int(c.y//25)
    for i in (-1, 0, 1):
        for j in (-1, 0, 1):
            for q, rr in occ.get((kx+i, ky+j), ()):
                if (q-c).length < rad+rr: return False
    return True
def ocupa(c, rad): occ.setdefault((int(c.x//25), int(c.y//25)), []).append((c, rad))
matas = [p for k, p in areas if k == 'mata']; verdes = [p for k, p in areas if k == 'verde']
def em_area(c, lst): return any(inpoly(c, poly) for poly in lst)
# prédios mapeados (comércio, galpões): volumes de 1–3 pavimentos com platibanda
nb = 0
for pts, t in blds:
    if len(pts) < 4: continue
    c = sum(pts[:-1], Vector())/(len(pts)-1)
    if no_lote(c, 5) or c.length > 1500: continue
    lv = t.get('building:levels'); h = float(lv)*3.1 if lv and lv.replace('.', '').isdigit() else (3.6 if rng.random() < .6 else 6.8)
    PB.prism(pts[:-1], chao(c)-.3, h+.3); nb += 1
    rad = max((p-c).length for p in pts); ocupa(c, rad)
PB.build("BLV_osm_predios", mat("BLV_OSM_Predio", 0xe7e3da), C_N)
# casas ao longo das ruas
nh = 0
for h, pts, rb in ways:
    if rb or h not in ('residential', 'unclassified', 'living_street', 'tertiary', 'secondary'): continue
    for i in range(len(pts)-1):
        a, b = pts[i], pts[i+1]; L = (b-a).length
        if L < 8: continue
        u = (b-a)/L; n = Vector((-u.y, u.x)); k = 5.
        while k < L-5:
            for side in (1, -1):
                if h == 'secondary' and rng.random() < .5: continue
                w = rng.uniform(7, 11); d = rng.uniform(8, 13); c = a+u*k+n*side*(W[h]/2+2.5+rng.uniform(2.5, 5)+d/2)
                if no_lote(c, 12) or (c-MOSTO).length < 30 or c.length > 1400: continue
                if not livre(c, max(w, d)*.6) or dist_rua(c) < d*.45: continue
                if em_area(c, matas) or em_area(c, verdes): continue
                z = chao(c)
                if z > 60: continue
                ocupa(c, max(w, d)*.6)
                ht = 3.1 if rng.random() < .62 else 5.9
                HW[rng.randrange(len(WC))].obox(c, u, w, d, z-.25, ht+.25)
                mb = HR[rng.randrange(len(RC))]; P_ = [c+u*aa+n*bb for aa, bb in ((-w*.53, -d*.53), (w*.53, -d*.53), (w*.53, d*.53), (-w*.53, d*.53))]
                yt = z+ht; R1, R2 = c-u*w*.18, c+u*w*.18; b0 = len(mb.v)
                mb.v += [(p.x, p.y, yt) for p in P_]+[(R1.x, R1.y, yt+1.7), (R2.x, R2.y, yt+1.7)]
                mb.f += [(b0, b0+1, b0+5, b0+4), (b0+2, b0+3, b0+4, b0+5), (b0+1, b0+2, b0+5), (b0+3, b0, b0+4)]
                nh += 1
            k += rng.uniform(11, 15)
for i, mb in enumerate(HW): mb.build(f"BLV_casas_parede_{i}", mat(f"BLV_Casa_Parede_{i}", WC[i]), C_N)
for i, mb in enumerate(HR): mb.build(f"BLV_casas_telhado_{i}", mat(f"BLV_Casa_Telhado_{i}", RC[i]), C_N)
# ---------- árvores: tira as que caíram em rua/casa; mata real nas áreas de wood/scrub ----------
rm = 0
for o in list(bpy.data.collections["BLV_Vegetacao"].objects):
    if not o.name.startswith("BLV_arv") or no_lote(o.location.xy, 2): continue
    p = o.location.xy
    if dist_rua(p) < 2.5 or not livre(p, 1.5): bpy.data.objects.remove(o, do_unlink=True); rm += 1
CV = bpy.data.collections["BLV_Vegetacao"]; spec = ["island_tree_01", "island_tree_02", "tree_small_02"]
nm = 0
for poly in matas:
    xs = [p.x for p in poly]; ys = [p.y for p in poly]
    area = 0.
    for i in range(len(poly)-1): area += poly[i].x*poly[i+1].y-poly[i+1].x*poly[i].y
    n = min(1500, int(abs(area)/2/55))
    for _ in range(n*3):
        if n <= 0: break
        p = Vector((rng.uniform(min(xs), max(xs)), rng.uniform(min(ys), max(ys))))
        if not inpoly(p, poly) or no_lote(p, 3) or dist_rua(p) < 3: continue
        e = bpy.data.objects.new(f"BLV_arv_mata_{nm:04d}", None); e.instance_type = 'COLLECTION'
        lod = "LOD0" if (p-Vector((0, 0))).length < 160 else "LOD1"
        e.instance_collection = bpy.data.collections[f"{rng.choice(spec)}_{lod}"]; s = rng.uniform(1.9, 3.2)
        e.location = (p.x, p.y, chao(p)-.2); e.scale = (s, s, s*rng.uniform(.9, 1.2)); e.rotation_euler[2] = rng.random()*6.28
        CV.objects.link(e); nm += 1; n -= 1
# ---------- postes e carros do ramo inexistente ----------
rp = 0
for nome in ("BLV_postes", "BLV_luminarias", "BLV_luminarias_luz"):
    o = scn.objects.get(nome)
    if not o: continue
    bm = bmesh.new(); bm.from_mesh(o.data); mw = o.matrix_world
    ilhas = []; seen = set()
    for v in bm.verts:
        if v.index in seen: continue
        st = [v]; isl = []
        while st:
            x = st.pop()
            if x.index in seen: continue
            seen.add(x.index); isl.append(x)
            for e in x.link_edges: st.append(e.other_vert(x))
        ilhas.append(isl)
    kill = []
    for isl in ilhas:
        c = sum(((mw@v.co).xy for v in isl), Vector((0, 0)))/len(isl)
        if dist_rua(c) > 10: kill += isl
    rp += len(kill)
    bmesh.ops.delete(bm, geom=kill, context='VERTS'); bm.to_mesh(o.data); bm.free()
for o in list(scn.objects):
    if o.name.startswith("BLV_luz_poste") and dist_rua(o.location.xy) > 10: bpy.data.objects.remove(o, do_unlink=True)
fios = scn.objects.get("BLV_fios")
if fios:
    for sp in list(fios.data.splines):
        if any(dist_rua(Vector((p.co.x, p.co.y))) > 12 for p in sp.points): fios.data.splines.remove(sp)
rc = 0
for o in list(scn.objects):
    if o.name.startswith("BLV_carro") and o.location.z > .1 and dist_rua(o.location.xy) > 3:
        bpy.data.objects.remove(o, do_unlink=True); rc += 1
# carros nas ruas reais (até 600 m)
CC = bpy.data.collections.get("BLV_Carros"); mods = [c for c in bpy.data.collections if c.name.startswith("CARRO_")]
nc = 0
if CC and mods:
    for h, d, rb in dens_ways:
        if h not in ('secondary', 'tertiary', 'residential'): continue
        for i in range(1, len(d)-1, 1):
            if rng.random() > (.035 if h != 'residential' else .012): continue
            p = d[i]
            if p.length > 600 or no_lote(p): continue
            t = (d[i+1]-d[i-1]).normalized(); nn = Vector((-t.y, t.x)); side = rng.choice((1, -1))
            q = p+nn*side*(W[h]/4); e = bpy.data.objects.new("BLV_carro", None); e.instance_type = 'COLLECTION'
            e.instance_collection = rng.choice(mods); e.location = (q.x, q.y, chao(q)+.13)
            e.rotation_euler[2] = math.atan2(t.y, t.x)+(0 if side < 0 else math.pi); CC.objects.link(e); nc += 1
result = dict(ruas=len(ways), predios=nb, casas=nh, arvores_removidas=rm, mata=nm, postes_vertices_removidos=rp, carros_removidos=rc, carros_rua=nc)
