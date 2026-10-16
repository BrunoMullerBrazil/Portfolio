# Boulevard em 3D -> implantação no Blender (porta as seções relevo, terreno do condomínio, vias,
# vegetação, bairro, prédio vizinho, muro/lojas/lazer do template.html). Rodar depois de blender_boulevard.py.
# Coordenadas: site (px do book) --S()--> three (x,z) --B()--> blender (x,-z,y).
import bpy, math, random
from mathutils import Vector

scn = bpy.data.scenes["Boulevard"]
rnd = random.Random(11).random
SITE = 0.1015
def S(x, y): return ((x-1250)*SITE, (y-400)*SITE)
def B(x, y, z): return (x, -z, y)
def smooth(a, b, x):
    t = max(0., min(1., (x-a)/(b-a))); return t*t*(3-2*t)
def lerp(a, b, t): return a+(b-a)*t

# limpa o provisório da 1ª versão
for o in list(scn.objects):
    if o.name.startswith(("BLV_lote_", "BLV_chao", "BLV_morro", "BLV_arvore")):
        bpy.data.objects.remove(o, do_unlink=True)
def coll(name):
    c = bpy.data.collections.get(name) or bpy.data.collections.new(name)
    if c.name not in scn.collection.children: scn.collection.children.link(c)
    for o in list(c.objects): bpy.data.objects.remove(o, do_unlink=True)
    return c
C_T, C_R, C_L, C_N, C_V = coll("BLV_Terreno"), coll("BLV_Vias"), coll("BLV_Lazer_Lojas"), coll("BLV_Bairro"), coll("BLV_Vegetacao")

def srgb(h):
    c = [((h >> s) & 255)/255 for s in (16, 8, 0)]
    return tuple((v/12.92 if v <= .04045 else ((v+.055)/1.055)**2.4) for v in c) + (1,)
def mat(name, hexcol, rough=.85, metal=0., emit=None, es=0.):
    m = bpy.data.materials.get(name) or bpy.data.materials.new(name)
    m.use_nodes = True; b = m.node_tree.nodes.get('Principled BSDF')
    if b is None:
        m.node_tree.nodes.clear(); o = m.node_tree.nodes.new('ShaderNodeOutputMaterial'); b = m.node_tree.nodes.new('ShaderNodeBsdfPrincipled')
        m.node_tree.links.new(b.outputs[0], o.inputs[0])
    b.inputs['Base Color'].default_value = srgb(hexcol); b.inputs['Roughness'].default_value = rough; b.inputs['Metallic'].default_value = metal
    if emit is not None:
        b.inputs['Emission Color'].default_value = srgb(emit); b.inputs['Emission Strength'].default_value = es
    return m

# ---------------- relevo (mesma função do site) ----------------
def vn(x, z): return math.sin(x*.011+math.sin(z*.007)*1.7)*.5+math.sin(z*.013+x*.004)*.35+math.sin((x+z)*.031)*.15
BUMPS = [[-640,-300,420,60],[-900,60,420,80],[-300,-1650,650,120],[450,-1750,700,140],[1350,-650,560,120],[1100,500,460,70],[-1350,600,620,130],[200,1700,700,80],[-1900,-1200,800,280],[1900,-1600,900,320],[0,-2300,1200,380]]
def mesa(x, z):
    cx, cz = -980, -1500; dx, dz = (x-cx)/430, (z-cz)/300; r = math.hypot(dx, dz)
    face = max(0, dx*.5+dz*.85); edge = 1.0+.25*vn(x*3, z*3)*.2; steep = lerp(.18, .05, min(1, face*1.2))
    top = 390+18*vn(x*2, z*2); return top*(1-smooth(edge-steep, edge+.55*(1-face)+.12, r))
def terrainH(x, z):
    h = 0.
    for b in BUMPS:
        d = math.hypot(x-b[0], z-b[1]); h += b[3]*math.exp(-(d/b[2])**2)
    h = max(h, mesa(x, z)); h += (4*vn(x, z)+2*vn(x*3.1, z*2.7))*min(1, h/30+.2)
    d = math.hypot(x*.85, (z-10)*1.1); return max(0., h*smooth(240, 760, d))

def terrain_mat():
    m = bpy.data.materials.get("BLV_Terreno") or bpy.data.materials.new("BLV_Terreno")
    m.use_nodes = True; nt = m.node_tree; nt.nodes.clear(); L = nt.links.new
    out = nt.nodes.new('ShaderNodeOutputMaterial'); b = nt.nodes.new('ShaderNodeBsdfPrincipled'); b.inputs['Roughness'].default_value = .95
    geo = nt.nodes.new('ShaderNodeNewGeometry'); sep = nt.nodes.new('ShaderNodeSeparateXYZ'); L(geo.outputs['Position'], sep.inputs[0])
    nsep = nt.nodes.new('ShaderNodeSeparateXYZ'); L(geo.outputs['Normal'], nsep.inputs[0])
    nz = nt.nodes.new('ShaderNodeTexNoise'); nz.inputs['Scale'].default_value = .012; nz.inputs['Detail'].default_value = 12; L(geo.outputs['Position'], nz.inputs['Vector'])
    fine = nt.nodes.new('ShaderNodeTexNoise'); fine.inputs['Scale'].default_value = .25; fine.inputs['Detail'].default_value = 6; L(geo.outputs['Position'], fine.inputs['Vector'])
    # mata = acima de ~10 m, com borda irregular
    fh = nt.nodes.new('ShaderNodeMapRange'); fh.inputs['From Min'].default_value = 6; fh.inputs['From Max'].default_value = 16; L(sep.outputs['Z'], fh.inputs['Value'])
    fb = nt.nodes.new('ShaderNodeMath'); fb.operation = 'ADD'; L(fh.outputs[0], fb.inputs[0]); L(nz.outputs['Fac'], fb.inputs[1])
    fs = nt.nodes.new('ShaderNodeMapRange'); fs.inputs['From Min'].default_value = .85; fs.inputs['From Max'].default_value = 1.05; L(fb.outputs[0], fs.inputs['Value'])
    # rocha = encosta muito íngreme (paredão)
    rk = nt.nodes.new('ShaderNodeMapRange'); rk.inputs['From Min'].default_value = .55; rk.inputs['From Max'].default_value = .35; L(nsep.outputs['Z'], rk.inputs['Value'])
    grass = nt.nodes.new('ShaderNodeValToRGB'); grass.color_ramp.elements[0].color = srgb(0x55692f); grass.color_ramp.elements[1].color = srgb(0x7b8a45); L(fine.outputs['Fac'], grass.inputs[0])
    forest = nt.nodes.new('ShaderNodeValToRGB'); forest.color_ramp.elements[0].color = srgb(0x1b2a14); forest.color_ramp.elements[1].color = srgb(0x3f5826); L(fine.outputs['Fac'], forest.inputs[0])
    rock = nt.nodes.new('ShaderNodeValToRGB'); rock.color_ramp.elements[0].color = srgb(0x77756d); rock.color_ramp.elements[1].color = srgb(0xb3ada0); L(fine.outputs['Fac'], rock.inputs[0])
    def mix(f, a, c):
        mx = nt.nodes.new('ShaderNodeMix'); mx.data_type = 'RGBA'
        ins = [s for s in mx.inputs if s.type == 'RGBA']; L(f, mx.inputs['Factor']); L(a, ins[0]); L(c, ins[1])
        return [s for s in mx.outputs if s.type == 'RGBA'][0]
    c1 = mix(fs.outputs[0], grass.outputs[0], forest.outputs[0]); c2 = mix(rk.outputs[0], c1, rock.outputs[0])
    L(c2, b.inputs['Base Color'])
    bp = nt.nodes.new('ShaderNodeBump'); bp.inputs['Strength'].default_value = .6; bp.inputs['Distance'].default_value = 2.
    L(fine.outputs['Fac'], bp.inputs['Height']); L(bp.outputs[0], b.inputs['Normal'])
    # perspectiva atmosférica
    cam = nt.nodes.new('ShaderNodeCameraData'); hz = nt.nodes.new('ShaderNodeMapRange')
    hz.inputs['From Min'].default_value = 250; hz.inputs['From Max'].default_value = 3200; hz.inputs['To Min'].default_value = 0; hz.inputs['To Max'].default_value = .78
    L(cam.outputs['View Distance'], hz.inputs['Value'])
    em = nt.nodes.new('ShaderNodeEmission'); em.name = 'HAZE'; em.inputs['Color'].default_value = (.62, .58, .62, 1); em.inputs['Strength'].default_value = .5
    ms = nt.nodes.new('ShaderNodeMixShader'); L(hz.outputs[0], ms.inputs[0]); L(b.outputs[0], ms.inputs[1]); L(em.outputs[0], ms.inputs[2]); L(ms.outputs[0], out.inputs[0])
    return m

N, SZ = 300, 5200.
verts, faces = [], []
for j in range(N+1):
    for i in range(N+1):
        x = -SZ/2+SZ*i/N; z = -SZ/2+SZ*j/N
        verts.append(B(x, terrainH(x, z)-.15, z))
for j in range(N):
    for i in range(N):
        a = j*(N+1)+i; faces.append((a, a+N+1, a+N+2, a+1))
me = bpy.data.meshes.new("BLV_terreno"); me.from_pydata(verts, [], faces); me.update()
for p in me.polygons: p.use_smooth = True
me.materials.append(terrain_mat()); C_T.objects.link(bpy.data.objects.new("BLV_terreno", me))

# ---------------- utilitários de malha ----------------
class MB:
    def __init__(s): s.v = []; s.f = []
    def poly(s, pts3):
        b = len(s.v); s.v += pts3; s.f.append(tuple(range(b, b+len(pts3))))
    def prism(s, pts2, z0, z1):   # pts2 em three (x,z); extrusão vertical
        n = len(pts2); b = len(s.v)
        s.v += [B(p[0], z0, p[1]) for p in pts2] + [B(p[0], z1, p[1]) for p in pts2]
        s.f.append(tuple(range(b+n-1, b-1, -1))); s.f.append(tuple(range(b+n, b+2*n)))
        for i in range(n):
            k = (i+1) % n; s.f.append((b+i, b+k, b+n+k, b+n+i))
    def box(s, x0, z0, x1, z1, y0, h):
        x0, x1 = min(x0, x1), max(x0, x1); z0, z1 = min(z0, z1), max(z0, z1)
        s.prism([(x0, z0), (x1, z0), (x1, z1), (x0, z1)], y0, y0+h)
    def obox(s, cx, cz, w, d, rot, y0, h):
        c, sn = math.cos(rot), math.sin(rot)
        pts = [(cx+c*a-sn*b, cz+sn*a+c*b) for a, b in ((-w/2, -d/2), (w/2, -d/2), (w/2, d/2), (-w/2, d/2))]
        s.prism(pts, y0, y0+h)
    def ribbon(s, pts, w, y, follow=True):
        b0 = len(s.v)
        for i, p in enumerate(pts):
            a = pts[max(0, i-1)]; c = pts[min(len(pts)-1, i+1)]; dx, dz = c[0]-a[0], c[1]-a[1]; l = math.hypot(dx, dz) or 1
            nx, nz = -dz/l*w/2, dx/l*w/2
            for q in ((p[0]+nx, p[1]+nz), (p[0]-nx, p[1]-nz)):
                s.v.append(B(q[0], y+(terrainH(*q) if follow else 0), q[1]))
        for i in range(len(pts)-1):
            k = b0+i*2; s.f.append((k, k+1, k+3, k+2))
    def build(s, name, m, col):
        if not s.v: return None
        me = bpy.data.meshes.new(name); me.from_pydata(s.v, [], s.f); me.update(); me.materials.append(m)
        ob = bpy.data.objects.new(name, me); col.objects.link(ob); return ob

def site(pts): return [S(*p) for p in pts]
def catmull(ctrl, n):
    P = [ctrl[0]]+ctrl+[ctrl[-1]]; out = []
    seg = len(ctrl)-1
    for k in range(n+1):
        t = k/n*seg; i = min(int(t), seg-1); u = t-i; p0, p1, p2, p3 = P[i], P[i+1], P[i+2], P[i+3]
        out.append(tuple(.5*((2*p1[d])+(-p0[d]+p2[d])*u+(2*p0[d]-5*p1[d]+4*p2[d]-p3[d])*u*u+(-p0[d]+3*p1[d]-3*p2[d]+p3[d])*u**3) for d in (0, 1)))
    return out
def resample(pts, step):
    out = [pts[0]]; acc = 0.
    for i in range(1, len(pts)):
        a, b = pts[i-1], pts[i]; L = math.hypot(b[0]-a[0], b[1]-a[1]); d = step-acc
        while d <= L:
            t = d/L; out.append((a[0]+(b[0]-a[0])*t, a[1]+(b[1]-a[1])*t)); d += step
        acc = (acc+L) % step
    return out

M = dict(
    asphalt=bpy.data.materials.get("BLV_Asfalto") or mat("BLV_Asfalto", 0x2c2d2f, .92),
    walk=mat("BLV_Calcada", 0x9c978c, .95), paint=mat("BLV_Faixa", 0xe8e6df, .7),
    median=mat("BLV_Canteiro", 0x4d6a35, 1.), curb=mat("BLV_Meio_Fio", 0xc9c5bb, .85),
    lot=mat("BLV_Estacionamento", 0x55575a, .9), pad=mat("BLV_Piso_Torres", 0xa39d91, .9),
    lawn=mat("BLV_Gramado", 0x56713a, .95), deck=mat("BLV_Deck", 0xa8916f, .8), horta=mat("BLV_Horta", 0x6c5d48, 1.),
    stall=mat("BLV_Faixa_Vaga", 0xdec45a, .6), wall=mat("BLV_Muro", 0xe2ddd2, .9),
    shopglass=bpy.data.materials.get("BLV_Vidro_Loja"), shopin=bpy.data.materials.get("BLV_Loja_Interior"),
    shopup=mat("BLV_Lojas_Superior", 0x8d9096, .8), band=mat("BLV_Lojas_Faixa", 0xb5b04a, .6),
    water=mat("BLV_Piscina", 0x2f9fb2, .04, .0), wood=mat("BLV_Madeira_Lazer", 0x8a5c3b, .8),
    dark=mat("BLV_Metal_Escuro", 0x2f2b27, .6, .3), conc=mat("BLV_Concreto_Lazer", 0xa9a296, .9),
    umb=mat("BLV_Ombrelone", 0xe6dccb, .8), domeY=mat("BLV_Play_Amarelo", 0xd9ab2b, .6), domeB=mat("BLV_Play_Azul", 0x3a6fb0, .6),
    roofk=mat("BLV_Telhado_Quiosque", 0xb8996b, .8), kwall=mat("BLV_Parede_Quiosque", 0xd9d3c7, .9),
    fire=mat("BLV_Fogo", 0x000000, 1., emit=0xffa040, es=8.), nb_l=mat("BLV_Vizinho_Claro", 0xe8e6e0, .85), nb_d=mat("BLV_Vizinho_Escuro", 0x55595f, .85),
)
w = M['water'].node_tree.nodes['Principled BSDF']; w.inputs['Transmission Weight'].default_value = .0; w.inputs['Coat Weight'].default_value = .6

# ---------------- chão do condomínio ----------------
G = {}
def g(k):
    if k not in G: G[k] = MB()
    return G[k]
def flat(k, pts, y=.02): g(k).poly([B(p[0], y, p[1]) for p in site(pts)][::-1])
flat('lot', [[830,135],[1897,135],[1882,642],[292,642],[238,468],[275,456],[525,420],[680,382],[680,233],[830,233]])
flat('lawn', [[832,22],[1912,22],[1905,133],[832,133]], .03)
flat('deck', [[1626,44],[1806,44],[1806,129],[1626,129]], .05)
flat('lawn', [[1835,50],[1905,50],[1905,125],[1835,125]], .05)
flat('horta', [[1360,30],[1525,30],[1525,60],[1360,60]], .05)
flat('curb', [[832,128],[1905,128],[1905,135],[832,135]], .06)
flat('pad', [[670,220],[1832,220],[1832,396],[670,396]], .04)
flat('walk', [[280,640],[1890,640],[1890,652],[280,652]], .05)
flat('asphalt', [[880,640],[960,640],[960,790],[880,790]], .04)
# vagas (faixas amarelas)
def row(x0, x1, y0, y1, step):
    a, b = S(x0, y1), S(x1, y1); g('stall').box(a[0], a[1]-.05, b[0], b[1]+.05, .03, .01)
    x = x0
    while x <= x1+.1:
        p, q = S(x, y0), S(x, y1); g('stall').box(p[0]-.05, p[1], q[0]+.05, q[1], .03, .01); x += step
def colr(x0, x1, y0, y1, step):
    a, b = S(x1, y0), S(x1, y1); g('stall').box(a[0]-.05, a[1], b[0]+.05, b[1], .03, .01)
    y = y0
    while y <= y1+.1:
        p, q = S(x0, y), S(x1, y); g('stall').box(p[0], p[1]-.05, q[0], q[1]+.05, .03, .01); y += step
row(838,1890,138,186,25); row(1012,1820,424,470,25)
for a in [[1005,1105],[1155,1255],[1318,1418],[1468,1568],[1620,1720],[1770,1820]]: row(a[0],a[1],480,527,25); row(a[0],a[1],527,575,25)
for a in [[548,648],[698,798]]: row(a[0],a[1],432,478,25); row(a[0],a[1],478,525,25); row(a[0],a[1],525,575,25)
row(268,368,492,575,25); colr(850,898,388,570,24); colr(902,950,388,570,24)

# ---------------- muro ----------------
for sg in ([[832,18],[1913,18]], [[1913,18],[1893,642]]):
    a, b = S(*sg[0]), S(*sg[1]); L = math.hypot(b[0]-a[0], b[1]-a[1])
    g('wall').obox((a[0]+b[0])/2, (a[1]+b[1])/2, L, .25, math.atan2(b[1]-a[1], b[0]-a[0]), 0, 2.4)

# ---------------- boulevard de lojas ----------------
SHOP = site([[255,352],[487,300],[487,140],[675,95],[830,82],[830,232],[678,232],[678,380],[525,418],[275,455]])
cx = sum(p[0] for p in SHOP)/len(SHOP); cz = sum(p[1] for p in SHOP)/len(SHOP)
def scl(pts, k): return [(cx+(p[0]-cx)*k, cz+(p[1]-cz)*k) for p in pts]
g('shopglass').prism(scl(SHOP, .985), 0, 3.9); g('shopin').prism(scl(SHOP, .97), .02, 3.8)
g('shopup').prism(SHOP, 3.9, 8.0); g('band').prism(scl(SHOP, 1.004), 3.75, 4.1); g('shopglass').prism(scl(SHOP, 1.003), 5.1, 6.8)
a, b = S(372,458), S(495,525); g('wall').box(a[0], a[1], b[0], b[1], 0, 3.2)

# ---------------- lazer ----------------
a, b = S(1662,86), S(1804,126); g('water').box(a[0], a[1], b[0], b[1], -.6, .66)
for p in ((1660,60), (1700,62)):
    w = S(*p); g('dark').obox(w[0], w[1], .1, .1, 0, 0, 2.4)
    g('umb').prism([(w[0]+1.5*math.cos(k*math.pi/5), w[1]+1.5*math.sin(k*math.pi/5)) for k in range(10)], 2.2, 2.35)
for p, k in (((1855,95,1.5), 'domeY'), ((1885,80,1.2), 'domeB')):
    w = S(p[0], p[1]); r = p[2]
    for i in range(6):
        y0 = r*math.sin(i*math.pi/12); y1 = r*math.sin((i+1)*math.pi/12); rr = r*math.cos((i+.5)*math.pi/12)
        g(k).prism([(w[0]+rr*math.cos(t*math.pi/10), w[1]+rr*math.sin(t*math.pi/10)) for t in range(20)], y0, y1)
for (x, y) in ((1178,100), (1270,100), (1340,95), (1540,95)):
    w = S(x, y)
    for c in ((-2.6,-1.6), (2.6,-1.6), (-2.6,1.6), (2.6,1.6)): g('dark').box(w[0]+c[0]-.09, w[1]+c[1]-.09, w[0]+c[0]+.09, w[1]+c[1]+.09, 0, 2.7)
    g('roofk').box(w[0]-2.8, w[1]-1.8, w[0]+2.8, w[1]+1.8, 2.66, .18); g('kwall').box(w[0]-.2, w[1]-1.7, w[0]+2.2, w[1]-1.1, 0, 2.5)
w = S(1080,100)
for c in ((-2,-2), (2,-2), (-2,2), (2,2)): g('wood').box(w[0]+c[0]-.15, w[1]+c[1]-.15, w[0]+c[0]+.15, w[1]+c[1]+.15, 0, 2.8)
for i in range(-2, 3): g('wood').box(w[0]-2.5, w[1]+i-.09, w[0]+2.5, w[1]+i+.09, 2.79, .22)
w = S(965,105)
g('conc').prism([(w[0]+.9*math.cos(t*math.pi/10), w[1]+.9*math.sin(t*math.pi/10)) for t in range(20)], 0, .45)
g('fire').prism([(w[0]+.4*math.cos(t*math.pi/4), w[1]+.4*math.sin(t*math.pi/4)) for t in range(8)], .45, .8)
for c in ((0,-2.4,0), (-2.6,0,math.pi/2), (2.6,0,math.pi/2)): g('wood').obox(w[0]+c[0], w[1]+c[1], 3, .6, c[2], 0, .45)
for i in range(3):
    a, b = S(1362, 31+i*9), S(1523, 38+i*9); g('conc').box(a[0], a[1], b[0], b[1], 0, .25+i*.25)

# ---------------- prédio vizinho ----------------
Hh = 16*2.9+4; px, pz = -80, -66
g('nb_l').box(px-4-24*.31, pz-8.5, px-4+24*.31, pz+8.5, 0, Hh)
g('nb_d').box(px+24*.36-24*.21, pz-8.5, px+24*.36+24*.21, pz+8.5, 0, Hh-2.5)
g('nb_l').box(px-8, pz-3.5, px, pz+3.5, Hh, 4)
for k, mb in G.items(): mb.build(f"BLV_site_{k}", M[k], C_L)

# ---------------- vias ----------------
MAIN_S = [[-60,-2700],[20,-1500],[55,-300],[75,0],[120,250],[165,450],[215,610],[300,745],[460,830],[700,850],[1300,856],[2000,858],[26860,860]]
MAIN = resample(catmull([S(*p) for p in MAIN_S], 1600), 6.)
MAIN = [p for p in MAIN if abs(p[0]) < 2400 and abs(p[1]) < 2400]
RB = S(300,745)
R = {}
def r(k):
    if k not in R: R[k] = MB()
    return R[k]
r('walk').ribbon(MAIN, 27, .04); r('asphalt').ribbon(MAIN, 18, .14)
segs, cur = [], []
for p in MAIN:
    if math.hypot(p[0]-RB[0], p[1]-RB[1]) > 22 and p[0] > RB[0]: cur.append(p)
    elif cur: segs.append(cur); cur = []
if cur: segs.append(cur)
for sgm in segs:
    if len(sgm) > 2: r('median').ribbon(sgm, 3.4, .26)
def offset(pts, o):
    out = []
    for i, p in enumerate(pts):
        a = pts[max(0, i-1)]; c = pts[min(len(pts)-1, i+1)]; dx, dz = c[0]-a[0], c[1]-a[1]; l = math.hypot(dx, dz) or 1
        out.append((p[0]-dz/l*o, p[1]+dx/l*o))
    return out
for o in (-4.6, 4.6):
    op = offset(MAIN, o)
    for i in range(0, len(op)-1, 2):
        p, q = op[i], op[i+1]
        if math.hypot(p[0]-RB[0], p[1]-RB[1]) < 21 or abs(p[0]) > 1300 or abs(p[1]) > 1300: continue
        r('paint').ribbon([p, ((p[0]+q[0])/2, (p[1]+q[1])/2)], .14, .2)
ring = [(RB[0]+19*math.cos(t*math.pi/24), RB[1]+19*math.sin(t*math.pi/24)) for t in range(49)]
r('asphalt').ribbon(ring, 9.5, .2)
r('median').prism([(RB[0]+9.5*math.cos(t*math.pi/24), RB[1]+9.5*math.sin(t*math.pi/24)) for t in range(48)], 0, .45)
r('curb').ribbon([(RB[0]+9.6*math.cos(t*math.pi/24), RB[1]+9.6*math.sin(t*math.pi/24)) for t in range(49)], .36, .46)
OUT = resample(catmull([RB, (RB[0]-40, RB[1]+28), (RB[0]-130, RB[1]+95), (RB[0]-260, RB[1]+230), (RB[0]-420, RB[1]+420)], 200), 6.)
r('walk').ribbon(OUT, 15, .04); r('asphalt').ribbon(OUT, 9, .14)
h0 = S(80, 40)
HILLR = resample(catmull([h0, (h0[0]-60, h0[1]-20), (-300,-120), (-430,-200), (-600,-210), (-760,-120)], 200), 6.)
r('asphalt').ribbon(HILLR, 8, .14)
HILLR2 = resample(catmull([(-300,-120), (-330,-300), (-420,-450), (-560,-520)], 120), 6.); r('asphalt').ribbon(HILLR2, 7, .14)
for k, mb in R.items(): mb.build(f"BLV_via_{k}", M[k], C_R)
ROADPTS = [p for p in MAIN if abs(p[0]) < 1600 and abs(p[1]) < 1600][::3]+OUT[::3]+HILLR[::3]+HILLR2[::3]
def roadDist(x, z): return min(abs(p[0]-x)+abs(p[1]-z) for p in ROADPTS)

# ---------------- bairro: casas e galpões ----------------
H = []
def zone(x0, x1, z0, z1, n, opt):
    k = gd = 0
    while k < n and gd < n*30:
        gd += 1; x = x0+rnd()*(x1-x0); z = z0+rnd()*(z1-z0)
        if math.hypot(x*.85, (z-10)*1.1) < 175 or math.hypot(x-RB[0], z-RB[1]) < 32: continue
        if -100 < x < 220 and 40 < z < 70: continue
        if terrainH(x, z) > 48 or roadDist(x, z) < 16: continue
        H.append((x, z, opt)); k += 1
zone(-700,-150,-520,40,330,'h'); zone(-1100,-600,-400,300,160,'h'); zone(150,700,-420,-40,150,'h')
zone(250,900,80,420,130,'h'); zone(-650,250,78,420,170,'m'); zone(-300,300,420,750,120,'h')
WC = [0xeeeae1,0xe5ddcf,0xd9d3c6,0xf2efe8,0xc9c0ad,0xe9e2d2,0xbfc4c6]; RC = [0x8e4a34,0x9a5a3f,0x5e5f61,0x7b3e2c,0x3f4144,0xa86a4c]
HW = [MB() for _ in WC]; HR = [MB() for _ in RC]; HF = MB()
for (x, z, opt) in H:
    big = opt == 'm' and rnd() < .3
    w = 14+rnd()*16 if big else 6+rnd()*5; d = 12+rnd()*14 if big else 7+rnd()*5
    ht = 5+rnd()*4 if big else (6 if rnd() < .35 else 3.2)+rnd()*.6
    y0 = terrainH(x, z)-.2; rot = (0 if rnd() < .5 else math.pi/2)+(rnd()-.5)*.25
    HW[int(rnd()*len(WC))].obox(x, z, w, d, rot, y0, ht)
    if big: HF.obox(x, z, w*.98, d*.98, rot, y0+ht, .3)
    else:   # telhado de 4 águas
        mb = HR[int(rnd()*len(RC))]; c, s = math.cos(rot), math.sin(rot)
        cor = [(x+c*a-s*b, z+s*a+c*b) for a, b in ((-w*.52,-d*.52),(w*.52,-d*.52),(w*.52,d*.52),(-w*.52,d*.52))]
        rid = [(x+c*a, z+s*a) for a in (-w*.18, w*.18)]
        yt = y0+ht; yr = yt+1.6
        V = [B(p[0], yt, p[1]) for p in cor]+[B(p[0], yr, p[1]) for p in rid]; b0 = len(mb.v); mb.v += V
        mb.f += [(b0, b0+1, b0+5, b0+4), (b0+2, b0+3, b0+4, b0+5), (b0+1, b0+2, b0+5), (b0+3, b0, b0+4)]
for i, mb in enumerate(HW): mb.build(f"BLV_casas_parede_{i}", mat(f"BLV_Casa_Parede_{i}", WC[i], .9), C_N)
for i, mb in enumerate(HR): mb.build(f"BLV_casas_telhado_{i}", mat(f"BLV_Casa_Telhado_{i}", RC[i], .75), C_N)
HF.build("BLV_galpoes_cobertura", mat("BLV_Galpao", 0x8a8d90, .5, .5), C_N)

# ---------------- pontos de árvore (instanciados depois com os modelos baixados) ----------------
def inPoly(x, y, p):
    c = False; j = len(p)-1
    for i in range(len(p)):
        if ((p[i][1] > y) != (p[j][1] > y)) and (x < (p[j][0]-p[i][0])*(y-p[i][1])/(p[j][1]-p[i][1])+p[i][0]): c = not c
        j = i
    return c
TP = []
zones = [([[230,-40],[830,-40],[830,75],[485,132],[487,298],[255,350],[236,360],[220,140]],120),
         ([[290,655],[1895,655],[1895,790],[420,780],[320,730]],150),
         ([[1915,-40],[2000,-40],[2000,650],[1898,650]],45),
         ([[830,-40],[1915,-40],[1915,16],[830,16]],28)]
for poly, n in zones:
    xs = [p[0] for p in poly]; ys = [p[1] for p in poly]; k = gd = 0
    while k < n and gd < n*40:
        gd += 1; x = min(xs)+rnd()*(max(xs)-min(xs)); y = min(ys)+rnd()*(max(ys)-min(ys))
        if inPoly(x, y, poly): TP.append((*S(x, y), 1.)); k += 1
for p in [[880,70],[1010,60],[1250,70],[1600,60],[1830,40],[1120,40],[960,40]]: TP.append((*S(*p), 1.))
k = gd = 0
while k < 600 and gd < 60000:
    gd += 1; x = (rnd()-.5)*3000; z = (rnd()-.5)*3000
    if rnd() > .2 or math.hypot(x*.85, (z-10)*1.1) < 200: continue
    if terrainH(x, z) > 10 or roadDist(x, z) < 18: continue
    TP.append((x, z, 1.1)); k += 1
scn["blv_tree_points"] = [[p[0], p[1], p[2], terrainH(p[0], p[1]) if not (abs(p[0]) < 120 and abs(p[1]) < 70) else 0.] for p in TP]

result = dict(houses=len(H), trees=len(TP), objects=len(scn.objects))
