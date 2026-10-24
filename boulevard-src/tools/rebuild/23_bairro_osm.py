# Realismo 23: bairro real — ruas do OpenStreetMap (assets/osm/pedra_branca.json) e lotes com casas ao longo delas,
# fora de um raio em volta do lote (lá dentro fica a implantação do book). Substitui as casas soltas do blender_site.
# Parâmetros (globals ou driver_namespace['blv_osm']): ORIGEM=(lat,lon) do centro das torres; ROT_DEG = giro geo->site
# (o mesmo usado no relevo: 319-57); RAIO = raio preservado (m).
import bpy, json, math, os, random
from mathutils import Vector
P = dict(bpy.app.driver_namespace.get('blv_osm', {})); P.update({k: globals()[k] for k in ('ORIGEM', 'ROT_DEG', 'RAIO') if k in globals()})
LAT0, LON0 = P.get('ORIGEM', (-27.6340, -48.6822)); A = math.radians(P.get('ROT_DEG', 319-57)); RAIO = P.get('RAIO', 230.)
scn = bpy.data.scenes["Boulevard"]; rng = random.Random(64)
r = json.load(open(os.path.expanduser("~/Movies/Boulevard_3D/assets/osm/pedra_branca.json")))
ml = 111320.; mo = 111320.*math.cos(math.radians(LAT0))
def geo2bl(lat, lon):
    gn, ge = (lat-LAT0)*ml, (lon-LON0)*mo
    n = gn*math.cos(A)+ge*math.sin(A); e = -gn*math.sin(A)+ge*math.cos(A)     # inversa de dem_rot
    return Vector((-n, e))
dg = bpy.context.evaluated_depsgraph_get()
ter = scn.objects["BLV_terreno"]
def chao(p):
    hit, loc, *_ = scn.ray_cast(dg, Vector((p.x, p.y, 3000.)), Vector((0, 0, -1)))
    return loc.z if hit else 0.
def coll(name):
    c = bpy.data.collections.get(name) or bpy.data.collections.new(name)
    if c.name not in scn.collection.children: scn.collection.children.link(c)
    for o in list(c.objects): bpy.data.objects.remove(o, do_unlink=True)
    return c
C = coll("BLV_Bairro_OSM")
# ---------- ruas ----------
W = {'secondary': 12., 'secondary_link': 8., 'tertiary': 10., 'residential': 7., 'unclassified': 7., 'living_street': 6., 'service': 4.5}
ways = []
for e in r['elements']:
    t = e.get('tags', {})
    if e['type'] == 'way' and t.get('highway') in W and 'geometry' in e:
        pts = [geo2bl(g['lat'], g['lon']) for g in e['geometry']]
        ways.append((t['highway'], pts))
def dentro(p): return p.length < RAIO
def ribbon(name, segs, mat):
    V, F = [], []
    for (w, pts) in segs:
        dens = []
        for i in range(len(pts)-1):          # reamostra a cada 6 m
            a, b = pts[i], pts[i+1]; n = max(1, int((b-a).length/6))
            dens += [a.lerp(b, k/n) for k in range(n)]
        dens.append(pts[-1])
        run = []
        for p in dens:
            if dentro(p): 
                if len(run) > 1: _rib(run, w, V, F)
                run = []
            else: run.append(p)
        if len(run) > 1: _rib(run, w, V, F)
    me = bpy.data.meshes.new(name); me.from_pydata(V, [], F); me.update(); me.materials.append(mat)
    o = bpy.data.objects.new(name, me); C.objects.link(o); return o
def _rib(pts, w, V, F):
    b0 = len(V)
    for i, p in enumerate(pts):
        a = pts[max(0, i-1)]; c = pts[min(len(pts)-1, i+1)]; t = (c-a); t = t.normalized() if t.length else Vector((1, 0))
        nrm = Vector((-t.y, t.x))*w/2
        for q in (p+nrm, p-nrm): V.append((q.x, q.y, chao(q)+.12))
    for i in range(len(pts)-1):
        k = b0+i*2; F.append((k, k+1, k+3, k+2))
asf = bpy.data.materials["BLV_Asfalto"]; calc = bpy.data.materials.get("BLV_Calcada") or asf
ribbon("BLV_osm_calcada", [(W[h]+5., p) for h, p in ways if h != 'service'], calc)
ribbon("BLV_osm_asfalto", [(W[h], [q+Vector((0, 0)) for q in p]) for h, p in ways], asf)
# ---------- lotes e casas ao longo das ruas residenciais ----------
for o in list(scn.objects):
    if o.name.startswith(("BLV_casas_", "BLV_galpoes")): bpy.data.objects.remove(o, do_unlink=True)
C_N = bpy.data.collections["BLV_Bairro"]
class MB:
    def __init__(s): s.v = []; s.f = []
    def obox(s, c, u, w, d, z0, h):
        n = Vector((-u.y, u.x)); P_ = [c+u*a+n*b for a, b in ((-w/2, -d/2), (w/2, -d/2), (w/2, d/2), (-w/2, d/2))]
        b = len(s.v); s.v += [(p.x, p.y, z0) for p in P_]+[(p.x, p.y, z0+h) for p in P_]
        s.f += [(b+3, b+2, b+1, b), (b+4, b+5, b+6, b+7)]+[(b+i, b+(i+1) % 4, b+4+(i+1) % 4, b+4+i) for i in range(4)]
        return P_
    def build(s, name, m):
        if not s.v: return
        me = bpy.data.meshes.new(name); me.from_pydata(s.v, [], s.f); me.update(); me.materials.append(m)
        C_N.objects.link(bpy.data.objects.new(name, me))
WC = [0xeeeae1, 0xe5ddcf, 0xd9d3c6, 0xf2efe8, 0xc9c0ad, 0xe9e2d2, 0xbfc4c6]; RC = [0x8e4a34, 0x9a5a3f, 0x5e5f61, 0x7b3e2c, 0x3f4144, 0xa86a4c]
HW = [MB() for _ in WC]; HR = [MB() for _ in RC]
occ = []   # centros ocupados (evita sobreposição)
def livre(c, rad):
    for q, rr in occ:
        if (q-c).length < rad+rr: return False
    return True
road_pts = [p for h, pts in ways for p in pts]
nh = 0
for h, pts in ways:
    if h not in ('residential', 'unclassified', 'living_street', 'tertiary'): continue
    for i in range(len(pts)-1):
        a, b = pts[i], pts[i+1]; L = (b-a).length
        if L < 8: continue
        u = (b-a)/L; n = Vector((-u.y, u.x)); k = 6.
        while k < L-6:
            for side in (1, -1):
                w = rng.uniform(7, 11); d = rng.uniform(8, 12); setback = W[h]/2+2.5+rng.uniform(2, 5)
                c = a+u*k+n*side*(setback+d/2)
                if dentro(c) or c.length > 1400 or not livre(c, max(w, d)*.62): continue
                z = chao(c)
                if z > 45: continue
                occ.append((c, max(w, d)*.62))
                ht = 3.1 if rng.random() < .65 else 5.9
                HW[rng.randrange(len(WC))].obox(c, u, w, d, z-.2, ht)
                # telhado de 4 águas
                mb = HR[rng.randrange(len(RC))]; P_ = [c+u*aa+n*bb for aa, bb in ((-w*.53, -d*.53), (w*.53, -d*.53), (w*.53, d*.53), (-w*.53, d*.53))]
                yt = z-.2+ht; R1, R2 = c-u*w*.18, c+u*w*.18; b0 = len(mb.v)
                mb.v += [(p.x, p.y, yt) for p in P_]+[(R1.x, R1.y, yt+1.7), (R2.x, R2.y, yt+1.7)]
                mb.f += [(b0, b0+1, b0+5, b0+4), (b0+2, b0+3, b0+4, b0+5), (b0+1, b0+2, b0+5), (b0+3, b0, b0+4)]
                nh += 1
            k += rng.uniform(11, 15)
def srgb(hx):
    c = [((hx >> s) & 255)/255 for s in (16, 8, 0)]
    return tuple((v/12.92 if v <= .04045 else ((v+.055)/1.055)**2.4) for v in c)+(1,)
def mat(name, hx):
    m = bpy.data.materials.get(name)
    if m is None:
        m = bpy.data.materials.new(name); m.use_nodes = True; m.node_tree.nodes['Principled BSDF'].inputs['Base Color'].default_value = srgb(hx)
    return m
for i, mb in enumerate(HW): mb.build(f"BLV_casas_parede_{i}", mat(f"BLV_Casa_Parede_{i}", WC[i]))
for i, mb in enumerate(HR): mb.build(f"BLV_casas_telhado_{i}", mat(f"BLV_Casa_Telhado_{i}", RC[i]))
result = dict(ruas=len(ways), casas=nh)
