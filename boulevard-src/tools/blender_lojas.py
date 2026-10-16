# Boulevard em 3D -> fachada do boulevard de lojas conforme o book (pág. das lojas):
# 2 pavimentos; térreo com vitrines e toldos grafite (nomes fictícios); superior com faixas de janela de caixilho escuro;
# friso amarelo no topo e moldurando o volume da esquina; jardins verticais entre vãos. Sem cerca viva.
import bpy, math, random, os
from mathutils import Vector

scn = bpy.data.scenes["Boulevard"]
rng = random.Random(4)
SITE = 0.1015
def S(x, y): return ((x-1250)*SITE, (y-400)*SITE)
C = bpy.data.collections.get("BLV_Vitrines") or bpy.data.collections.new("BLV_Vitrines")
if C.name not in scn.collection.children: scn.collection.children.link(C)
for o in list(C.objects): bpy.data.objects.remove(o, do_unlink=True)
for o in list(scn.objects):
    if o.name.startswith(("BLV_arbusto_", "BLV_site_band")): bpy.data.objects.remove(o, do_unlink=True)

def srgb(h):
    c = [((h >> s) & 255)/255 for s in (16, 8, 0)]
    return tuple((v/12.92 if v <= .04045 else ((v+.055)/1.055)**2.4) for v in c) + (1,)
def pmat(name, hexcol, rough=.6, metal=0., emit=None, es=0.):
    m = bpy.data.materials.get(name) or bpy.data.materials.new(name)
    m.use_nodes = True; nt = m.node_tree; nt.nodes.clear()
    o = nt.nodes.new('ShaderNodeOutputMaterial'); b = nt.nodes.new('ShaderNodeBsdfPrincipled'); nt.links.new(b.outputs[0], o.inputs[0])
    b.inputs['Base Color'].default_value = srgb(hexcol); b.inputs['Roughness'].default_value = rough; b.inputs['Metallic'].default_value = metal
    if emit is not None: b.inputs['Emission Color'].default_value = srgb(emit); b.inputs['Emission Strength'].default_value = es
    return m
MAT = bpy.data.materials
M = dict(frame=pmat("BLV_Caixilho_Lojas", 0x1e2124, .35, .7), awn=pmat("BLV_Toldo_Grafite", 0x2c2f33, .85),
         yel=MAT.get("BLV_Friso_Amarelo") or pmat("BLV_Friso_Amarelo", 0xd9b21f, .5), txt=pmat("BLV_Texto_Toldo", 0xf2f2f2, .6),
         back=pmat("BLV_Loja_Fundo", 0xd9d4ca, .8, emit=0xffe7c4, es=1.2))
# interior das lojas mais sóbrio (antes era um bloco emissivo chapado)
si = MAT.get("BLV_Loja_Interior")
if si:
    em = [n for n in si.node_tree.nodes if n.type == 'EMISSION']
    if em: em[0].inputs['Strength'].default_value = .6

class MB:
    def __init__(s): s.v = []; s.f = []
    def cube(s, p):
        b = len(s.v); s.v += p
        s.f += [(b,b+3,b+2,b+1),(b+4,b+5,b+6,b+7),(b,b+1,b+5,b+4),(b+1,b+2,b+6,b+5),(b+2,b+3,b+7,b+6),(b+3,b,b+4,b+7)]
    def obox(s, o, u, n, u0, u1, z0, z1, d0, d1):
        P = lambda a, z, d: (o[0]+u[0]*a+n[0]*d, o[1]+u[1]*a+n[1]*d, z)
        s.cube([P(u0,z0,d0),P(u1,z0,d0),P(u1,z0,d1),P(u0,z0,d1),P(u0,z1,d0),P(u1,z1,d0),P(u1,z1,d1),P(u0,z1,d1)])
    def slab(s, o, u, n, u0, u1, za, da, zb, db, t):   # placa inclinada (toldo)
        P = lambda a, z, d: (o[0]+u[0]*a+n[0]*d, o[1]+u[1]*a+n[1]*d, z)
        s.cube([P(u0,za,da),P(u1,za,da),P(u1,zb,db),P(u0,zb,db),P(u0,za+t,da),P(u1,za+t,da),P(u1,zb+t,db),P(u0,zb+t,db)])
    def build(s, name, m):
        if not s.v: return None
        me = bpy.data.meshes.new(name); me.from_pydata(s.v, [], s.f); me.update(); me.materials.append(m)
        ob = bpy.data.objects.new(name, me); C.objects.link(ob); return ob
G = {k: MB() for k in ("frame", "awn", "yel", "back")}

poly_site = [[255,352],[487,300],[487,140],[675,95],[830,82],[830,232],[678,232],[678,380],[525,418],[275,455]]
PB = [(p[0], -p[1]) for p in (S(*q) for q in poly_site)]
def inside(x, y, p):
    c = False; j = len(p)-1
    for i in range(len(p)):
        if ((p[i][1] > y) != (p[j][1] > y)) and (x < (p[j][0]-p[i][0])*(y-p[i][1])/(p[j][1]-p[i][1])+p[i][0]): c = not c
        j = i
    return c
NAMES = ["PADARIA PÃO DA PRAÇA", "CAFÉ GRÃO", "FARMÁCIA BEM VIVER", "PET & CIA", "BARBEARIA NAVALHA", "EMPÓRIO DA ESQUINA",
         "SORVETERIA GELATO", "ÓTICA VISÃO", "LAVANDERIA PRÁTICA", "PIZZARIA FORNO", "AÇAÍ DO PORTO", "FLORICULTURA JARDIM"]
edges = []
for i in range(len(PB)):
    a = Vector(PB[i]); b = Vector(PB[(i+1) % len(PB)]); L = (b-a).length
    u = (b-a)/L; n = Vector((u.y, -u.x))
    if inside(*((a+b)/2+n*1.0), PB): n = -n
    edges.append((a, b, L, u, n))
longest = max(range(len(edges)), key=lambda i: edges[i][2])
texts = []; vines = []; ni = 0
for ei, (a, b, L, u, n) in enumerate(edges):
    mid = (a+b)/2
    # friso amarelo no topo (todas as arestas) e cinta superior
    G['yel'].obox(mid, u, n, -L/2-.05, L/2+.05, 7.85, 8.08, -.02, .12)
    # pavimento superior: caixilhos da faixa de janelas (5.1–6.8)
    G['frame'].obox(mid, u, n, -L/2, L/2, 5.02, 5.12, -.02, .08); G['frame'].obox(mid, u, n, -L/2, L/2, 6.78, 6.88, -.02, .08)
    k = 0.
    while k <= L:
        G['frame'].obox(a+u*k, u, n, -.04, .04, 5.1, 6.8, -.02, .08); k += 1.25
    if L < 6: continue
    # moldura amarela no volume da esquina (aresta mais longa, primeiro terço), como no book
    if ei == longest:
        s0, s1 = .6, min(L*.42, 14.)
        for (u0, u1, z0, z1) in ((s0, s0+.22, 0, 7.6), (s1-.22, s1, 0, 7.6), (s0, s1, 7.38, 7.6)):
            G['yel'].obox(a, u, n, u0, u1, z0, z1, 0, .16)
    # térreo: vãos de loja ~7,5 m
    nb = max(1, int(L//7.5)); bw = L/nb
    for j in range(nb):
        o = a+u*(bw*(j+.5))
        G['frame'].obox(o, u, n, -bw/2, -bw/2+.14, 0, 3.75, -.02, .1)          # montante entre lojas
        G['frame'].obox(o, u, n, -.03, .03, 0, 3.0, -.02, .08)                   # divisão da porta
        G['frame'].obox(o, u, n, -bw/2, bw/2, 2.95, 3.05, -.02, .1)              # travessa
        G['back'].obox(o, u, n, -bw/2+.25, bw/2-.25, .05, 2.9, -2.6, -2.5)       # fundo da loja (luz quente discreta)
        G['awn'].slab(o, u, n, -bw*.43, bw*.43, 3.1, .02, 2.72, 1.45, .05)       # toldo grafite
        G['awn'].obox(o, u, n, -bw*.43, bw*.43, 2.5, 2.77, 1.42, 1.47)           # bambinela do toldo
        texts.append((o+n*1.48, u, n, NAMES[ni % len(NAMES)], bw)); ni += 1
        if j % 2 == 0: vines.append((a+u*(bw*j)+n*.25, u, n))                    # jardim vertical no montante
    if nb % 2 == 0: vines.append((a+u*L+n*.25, u, n))
for k, mb in G.items(): mb.build(f"BLV_lojas_{k}", M[k])
for (p, u, n, txt, bw) in texts:
    cu = bpy.data.curves.new(f"BLV_toldo_txt", 'FONT'); cu.body = txt; cu.align_x = 'CENTER'; cu.align_y = 'CENTER'; cu.size = .13; cu.extrude = .004
    ob = bpy.data.objects.new(f"BLV_toldo_{txt}", cu); ob.data.materials.append(M['txt']); C.objects.link(ob)
    ob.location = (p.x+n.x*.01, p.y+n.y*.01, 2.635); ob.rotation_euler = (math.pi/2, 0, math.atan2(n.y, n.x)+math.pi/2)
# jardins verticais: folhagens do shrub_01 (cada variante tem ~30 cm) escaladas ~3x e empilhadas densamente, 0 a 7,3 m
col = bpy.data.collections.get("shrub_01_LOD0")
p = os.path.expanduser("~/Movies/Boulevard_3D/assets/models/shrub_01/shrub_01.blend")
if col is None and os.path.exists(p):
    with bpy.data.libraries.load(p, link=False) as (src, dst):
        dst.collections = [c for c in src.collections if c.endswith("LOD0")][:1]
    col = dst.collections[0] if dst.collections else None
nv = 0
if col:
    leaves = [o for o in col.all_objects if o.type == 'MESH']
    def leaf(pos, s, rz):
        o = bpy.data.objects.new("BLV_trepadeira", rng.choice(leaves).data)
        o.location = pos; o.scale = (s, s, s); o.rotation_euler = (rng.uniform(-.3, .3), rng.uniform(-.3, .3), rz); C.objects.link(o)
    for (q, u, n) in vines:
        z = 0.
        while z < 7.3:
            for k in range(3):
                pp = q+u*rng.uniform(-.45, .45)+n*rng.uniform(0, .25)
                leaf((pp.x, pp.y, z+rng.uniform(0, .3)), rng.uniform(2.6, 3.6), rng.random()*6.28); nv += 1
            z += .42
    # floreira sobre o volume baixo branco (lado direito no book)
    a3, b3 = S(372, 458), S(495, 525); x0, x1 = sorted((a3[0], b3[0])); y0, y1 = sorted((-a3[1], -b3[1]))
    for k in range(70): leaf((rng.uniform(x0+.3, x1-.3), rng.uniform(y0+.3, y1-.3), 3.15), rng.uniform(3., 4.5), rng.random()*6.28)
mu = MAT.get("BLV_Muro")
if mu:
    for nd in mu.node_tree.nodes:
        if nd.type == 'MIX': nd.inputs['Factor'].default_value = .2
lf = MAT.get("BLV_Loja_Fundo")
if lf: lf.node_tree.nodes['Principled BSDF'].inputs['Emission Strength'].default_value = 2.5
result = dict(edges=len(edges), shops=len(texts), vines=nv, longest=round(edges[longest][2], 1))
