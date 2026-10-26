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
# v2 (26/out): carroceria por loft de seções (perfil lateral real: capô, para-brisa, teto, vigia/porta-malas),
# subdivisão, caixa de roda escura, pneu com flanco e roda de liga, faróis e lanternas. Mesma API (CARRO_<nome>).
LANT = pmat("CAR_lanterna", (.35, .01, .01), .15); CAIXA = pmat("CAR_caixa_roda", (.008, .008, .008), .9)
for nm_, col_ in (("CAR_farol", (1., .95, .85)), ("CAR_lanterna", (1., .05, .02))):
    b_ = bpy.data.materials[nm_].node_tree.nodes['Principled BSDF']; b_.inputs['Emission Color'].default_value = (*col_, 1)
    b_.inputs['Emission Strength'].default_value = 0.   # aceso só à noite (ns['blv_farois'])
def lerp_pts(pts, x):
    for (x0, y0), (x1, y1) in zip(pts, pts[1:]):
        if x0 <= x <= x1: t = (x-x0)/(x1-x0); return y0+(y1-y0)*(.5-.5*math.cos(t*math.pi))
    return pts[0][1] if x < pts[0][0] else pts[-1][1]
# perfis normalizados (x de -1 traseira a +1 frente): linha de cintura (z_b) e teto (z_t); z em fração de H
PERFIS = {
  "sedan": dict(b=[(-1, .52), (-.92, .62), (-.6, .66), (.35, .62), (.9, .5), (1, .4)],
                t=[(-1, .52), (-.92, .62), (-.62, .68), (-.38, 1.), (.12, 1.), (.42, .66), (1, .5)], cab=(-.62, .42)),
  "hatch": dict(b=[(-1, .55), (-.96, .66), (-.6, .66), (.35, .62), (.9, .5), (1, .42)],
                t=[(-1, .6), (-.95, .9), (-.8, 1.), (.1, 1.), (.42, .66), (1, .5)], cab=(-.95, .42)),
  "suv":   dict(b=[(-1, .55), (-.97, .66), (-.6, .66), (.4, .64), (.92, .56), (1, .46)],
                t=[(-1, .62), (-.97, .95), (-.85, 1.), (.18, 1.), (.45, .7), (1, .56)], cab=(-.97, .45))}
def carro(nome, L, Wd, H, cab, tinta):
    fn = nome.split("_")[0]; P = PERFIS[fn]; zb0 = .2 if fn != "suv" else .26
    me = bpy.data.meshes.new(nome); V = []; F = []; FM = []; NS = 30; rings = []
    for k in range(NS+1):
        xn = -1+2*k/NS; x = xn*L/2
        w = Wd/2*(1-.16*abs(xn)**5); zb = zb0+.06*abs(xn)**4
        zbelt = zb0+(H-zb0)*lerp_pts(P["b"], xn); ztop = zb0+(H-zb0)*lerp_pts(P["t"], xn)
        incab = P["cab"][0] <= xn <= P["cab"][1]
        wr = w*.8
        sec = [(0, zb), (w*.92, zb+.02), (w, zb+.22), (w, zbelt-.08), (w*.96, zbelt)]
        if ztop > zbelt+.05: sec += [(wr+(w*.96-wr)*.15, zbelt+(ztop-zbelt)*.35), (wr, ztop-.04), (wr*.55, ztop), (0, ztop+.01)]
        else: sec += [(w*.82, zbelt+.025), (w*.6, zbelt+.04), (w*.3, zbelt+.05), (0, zbelt+.055)]
        ring = [(x, y, z) for y, z in sec]+[(x, -y, z) for y, z in reversed(sec[1:-1])]
        dz = abs(lerp_pts(P["t"], min(1, xn+.04))-lerp_pts(P["t"], max(-1, xn-.04)))/.08   # inclinação do teto
        rings.append((len(V), len(ring), (incab and ztop > zbelt+.05, dz > .9))); V += ring
    nr = rings[0][1]
    for k in range(NS):
        a0, _, c0 = rings[k]; a1, _, c1 = rings[k+1]
        for i in range(nr):
            j = (i+1) % nr; F.append((a0+i, a0+j, a1+j, a1+i))
            # vidro: faixas entre a cintura e o teto (índices 4..7 de cada lado) dentro da cabine
            ii = i if i < 8 else nr-1-i
            lat = c0[0] and c1[0] and 4 <= ii <= 5                      # vidros laterais
            frt = c0[0] and c1[0] and 6 <= ii <= 7 and (c0[1] or c1[1])  # para-brisa e vigia (trecho inclinado do teto)
            FM.append(1 if (lat or frt) else 0)
    # tampas
    for a, n_, _c in (rings[0], rings[-1]):
        F.append(tuple(range(a, a+n_)) if a == 0 else tuple(reversed(range(a, a+n_)))); FM.append(0)
    bm = bmesh.new()
    me_tmp = bpy.data.meshes.new("tmp"); me_tmp.from_pydata(V, [], F); me_tmp.update()
    for p_, m_ in zip(me_tmp.polygons, FM): p_.material_index = m_
    bm.from_mesh(me_tmp); bpy.data.meshes.remove(me_tmp)
    R = .33 if fn != "suv" else .37; ox = L/2-(.88 if fn != "hatch" else .78)
    for sx in (-1, 1):
        for sy in (-1, 1):
            cx = sx*ox+(.06 if sx < 0 else 0); cy = sy*(Wd/2-.13)
            # caixa de roda (cilindro escuro um pouco maior, encostado na carroceria)
            g = bmesh.ops.create_cone(bm, cap_ends=True, segments=20, radius1=R+.05, radius2=R+.05, depth=.3)['verts']
            bmesh.ops.rotate(bm, verts=g, cent=(0, 0, 0), matrix=Matrix.Rotation(math.pi/2, 3, 'X')); bmesh.ops.translate(bm, vec=(cx, cy*.97, R+.02), verts=g)
            for f in {f for v in g for f in v.link_faces}: f.material_index = 5
            # pneu
            g = bmesh.ops.create_cone(bm, cap_ends=True, segments=24, radius1=R, radius2=R, depth=.21)['verts']
            bmesh.ops.rotate(bm, verts=g, cent=(0, 0, 0), matrix=Matrix.Rotation(math.pi/2, 3, 'X')); bmesh.ops.translate(bm, vec=(cx, cy, R), verts=g)
            for f in {f for v in g for f in v.link_faces}: f.material_index = 2
            # roda de liga (disco metálico saliente)
            g = bmesh.ops.create_cone(bm, cap_ends=True, segments=24, radius1=R*.66, radius2=R*.6, depth=.03)['verts']
            bmesh.ops.rotate(bm, verts=g, cent=(0, 0, 0), matrix=Matrix.Rotation(math.pi/2, 3, 'X')); bmesh.ops.translate(bm, vec=(cx, cy+sy*.106, R), verts=g)
            for f in {f for v in g for f in v.link_faces}: f.material_index = 3
    # faróis e lanternas
    for sy in (-1, 1):
        for xs, mi, zf in ((1, 4, .62), (-1, 6, .7)):
            zz = zb0+(H-zb0)*lerp_pts(P["b"], xs*.97)-.1
            g = bmesh.ops.create_cube(bm, size=1.)['verts']
            bmesh.ops.scale(bm, vec=(.08, .42, .1), verts=g); bmesh.ops.translate(bm, vec=(xs*(L/2-.06), sy*(Wd/2-.32), zz), verts=g)
            for f in {f for v in g for f in v.link_faces}: f.material_index = mi
    bm.to_mesh(me); bm.free()
    for p_ in me.polygons: p_.use_smooth = True
    for m_ in (pmat(f"CAR_tinta_{tinta}", *TINTAS[tinta], coat=1.), VID, PNEU, CROMO, FAROL, CAIXA, LANT): me.materials.append(m_)
    o = bpy.data.objects.new(nome, me); LIB.objects.link(o)
    sd = o.modifiers.new("sub", 'SUBSURF'); sd.levels = 1; sd.render_levels = 2
    col = bpy.data.collections.get(f"CARRO_{nome}") or bpy.data.collections.new(f"CARRO_{nome}")
    for x in list(col.objects): col.objects.unlink(x)
    col.objects.link(o); return col
def blv_farois(on=True):
    for nm_, st in (("CAR_farol", 6.), ("CAR_lanterna", 4.)):
        bpy.data.materials[nm_].node_tree.nodes['Principled BSDF'].inputs['Emission Strength'].default_value = st if on else 0.
bpy.app.driver_namespace['blv_farois'] = blv_farois
FORMAS = {"sedan": (4.5, 1.8, 1.45, None), "hatch": (4.0, 1.74, 1.48, None), "suv": (4.55, 1.86, 1.68, None)}
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
