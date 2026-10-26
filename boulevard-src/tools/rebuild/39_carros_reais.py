# Realismo 39: carros reais (Sketchfab, CC Attribution) no lugar dos procedurais do 24.
# O loft procedural (24 v2) não sustentou close; os modelos abaixo sim. Créditos em assets/carros/CREDITOS.txt.
#   onix    — "chevrolet onix" por uzb_rx7            https://sketchfab.com/3d-models/bfd798c2695847b28ab681d42abc7056
#   compass — "Jeep Compass 2022 Lowpoly" por Davidson https://sketchfab.com/3d-models/e4087350c4d84d8391de09b405c96488
#   corolla — "2014 Toyota Corolla E180 EU" por Armored Wave https://sketchfab.com/3d-models/36f95efb0585464cae43a25a3b3392e8
#   strada  — "Fiat Strada Silver Pickup" por Hortamat https://sketchfab.com/3d-models/7b3fe57b295f4a579f46dc4303b98305
# Descartados: HB20 (malha corrompida, pneus de 30 m), HR-V (arquivo de configurador com amostras de cor espalhadas).
# Download (só se o .glb faltar): precisa do token em ns['skf_tok'] — o token NUNCA vai para o repositório.
# Mantém as posições do 24/23: só troca a instance_collection de cada BLV_carro (o nome v1 fica em o['blv_carro_v1']).
import bpy, os, io, contextlib, math, random, json, urllib.request
from mathutils import Vector, Matrix
scn = bpy.data.scenes["Boulevard"]; ns = bpy.app.driver_namespace; M = bpy.data.materials
D = os.path.expanduser("~/Movies/Boulevard_3D/assets/carros"); os.makedirs(D, exist_ok=True)
UID = {"onix": "bfd798c2695847b28ab681d42abc7056", "compass": "e4087350c4d84d8391de09b405c96488",
       "corolla": "36f95efb0585464cae43a25a3b3392e8", "strada": "7b3fe57b295f4a579f46dc4303b98305"}
LEN = {"onix": 4.47, "compass": 4.40, "corolla": 4.62, "strada": 4.47}   # comprimento real (m)
PAINT = {"onix": "primary", "compass": "Jeep_Compass_mat_13_1", "corolla": "main_paint"}   # prefixo do material de pintura
CORES = [("branco", (.80, .80, .78), .0, .25, .35), ("prata", (.62, .63, .65), .85, .28, .25), ("cinza", (.18, .19, .2), .7, .3, .15),
         ("preto", (.012, .012, .014), .3, .25, .15), ("vermelho", (.38, .02, .02), .4, .28, .05), ("azul", (.03, .07, .2), .6, .3, .05)]
with open(os.path.join(D, "CREDITOS.txt"), "w") as f:
    f.write("Modelos de carro — Sketchfab, licença CC Attribution 4.0\n")
    f.write("chevrolet onix — uzb_rx7\nJeep Compass 2022 Lowpoly — Davidson\n2014 Toyota Corolla E180 EU — Armored Wave\nFiat Strada Silver Pickup — Hortamat\n")
def baixa(k):
    p = os.path.join(D, k+".glb")
    if os.path.exists(p): return p
    tok = ns.get('skf_tok')
    if not tok: raise RuntimeError(f"{k}.glb ausente e sem token em ns['skf_tok']")
    r = urllib.request.Request(f"https://api.sketchfab.com/v3/models/{UID[k]}/download", headers={'Authorization': 'Token '+tok, 'User-Agent': 'Mozilla/5.0'})
    urllib.request.urlretrieve(json.loads(urllib.request.urlopen(r, timeout=30).read())['glb']['url'], p); return p
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
def importa(k):
    nome = f"CARRO_real_{k}"; col = bpy.data.collections.get(nome)
    if col:
        for o in list(col.objects): bpy.data.objects.remove(o, do_unlink=True)
    else: col = bpy.data.collections.new(nome)
    before = set(bpy.data.objects)
    with contextlib.redirect_stdout(io.StringIO()), contextlib.redirect_stderr(io.StringIO()):
        bpy.ops.import_scene.gltf(filepath=baixa(k))
    for o in [o for o in bpy.data.objects if o not in before]:
        for c in list(o.users_collection): c.objects.unlink(o)
        col.objects.link(o)
    # comprimento no eixo X, frente +X (nomes 'front/head' x 'rear/tail'), chão em z=0, escala pelo comprimento real
    P = pts(col); xs = [p.x for p in P]; ys = [p.y for p in P]
    along_y = (pct(ys, .997)-pct(ys, .003)) > (pct(xs, .997)-pct(xs, .003))
    def cen(words):
        L = [p for o in col.objects if o.type == 'MESH' and any(w in o.name.lower() for w in words) for p in [wm(o)@Vector(c) for c in o.bound_box]]
        return sum(L, Vector())/len(L) if L else None
    c0 = sum(P, Vector())/len(P); fc, rc = cen(('front', 'head', 'grill')), cen(('rear', 'tail', 'trunk')); ax = 1 if along_y else 0
    frente_pos = (fc is not None and fc[ax] > c0[ax]) or (fc is None and rc is not None and rc[ax] < c0[ax])
    ang = (-math.pi/2 if frente_pos else math.pi/2) if along_y else (0 if frente_pos else math.pi)
    R = Matrix.Rotation(ang, 4, 'Z')
    for o in col.objects:
        if o.parent is None: o.matrix_basis = R@o.matrix_basis
    P = pts(col); xs = [p.x for p in P]; ys = [p.y for p in P]; zs = [p.z for p in P]
    x0, x1 = pct(xs, .003), pct(xs, .997); y0, y1 = pct(ys, .003), pct(ys, .997)
    T = Matrix.Scale(LEN[k]/(x1-x0), 4)@Matrix.Translation(-Vector(((x0+x1)/2, (y0+y1)/2, pct(zs, .002))))
    for o in col.objects:
        if o.parent is None: o.matrix_basis = T@o.matrix_basis
    return col
def tinta(nome, rgb, met, rough, base):
    m = M.get("CARP_"+nome) or base.copy(); m.name = "CARP_"+nome
    b = next(x for x in m.node_tree.nodes if x.type == 'BSDF_PRINCIPLED')
    for l in list(b.inputs['Base Color'].links): m.node_tree.links.remove(l)
    b.inputs['Base Color'].default_value = (*rgb, 1); b.inputs['Metallic'].default_value = met; b.inputs['Roughness'].default_value = rough
    b.inputs['Coat Weight'].default_value = 1.; b.inputs['Coat Roughness'].default_value = .03
    return m
VAR = []
for k in UID:
    base = importa(k)
    pn = PAINT.get(k)
    if not pn: VAR.append((base.name, .12)); continue
    pm = next(m for m in M if m.name.startswith(pn) and any(s.material == m for o in base.objects if o.type == 'MESH' for s in o.material_slots))
    for cn, rgb, met, rough, w in CORES:
        nm = f"CARRO_real_{k}_{cn}"; col = bpy.data.collections.get(nm)
        if col:
            for o in list(col.objects): bpy.data.objects.remove(o, do_unlink=True)
        else: col = bpy.data.collections.new(nm)
        tm = tinta(f"{k}_{cn}", rgb, met, rough, pm); mp = {}
        for o in base.objects: c = o.copy(); mp[o] = c; col.objects.link(c)
        for o, c in mp.items():
            if o.parent in mp: c.parent = mp[o.parent]
            if c.type == 'MESH':
                for s in c.material_slots:
                    if s.material == pm: s.link = 'OBJECT'; s.material = tm
        VAR.append((nm, w))
rng = random.Random(42); n = 0; nomes = [v[0] for v in VAR]; pesos = [v[1] for v in VAR]
for o in scn.objects:
    ic = o.instance_collection if o.instance_type == 'COLLECTION' else None
    if ic and ic.name.startswith("CARRO_"):
        if not ic.name.startswith("CARRO_real"): o['blv_carro_v1'] = ic.name
        o.instance_collection = bpy.data.collections[rng.choices(nomes, weights=pesos)[0]]; n += 1
result = dict(variantes=len(VAR), trocados=n)
