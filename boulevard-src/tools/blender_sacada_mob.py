# Boulevard em 3D -> sacada: decoração padrão neutra com modelos reais (Poly Haven, CC0)
# Roda depois de blender_sacada.py (que importa só arquitetura + cozinha + banheiro do B112).
# Coordenadas: planta do book (cm) -> blender: x = px/100 - 3.765 ; y = 2.85 - py/100
import bpy, os, json, math, urllib.request, ssl
from mathutils import Vector, Matrix

S = bpy.data.scenes["Sacada"]; w = bpy.context.window_manager.windows[0]; w.scene = S
A = os.path.expanduser("~/Movies/Boulevard_3D/assets/models"); ctx = ssl._create_unverified_context()
UA = {"User-Agent": "BoulevardViz/1.0"}
C = bpy.data.collections.get("SAC_mobilia")
if not C:
    C = bpy.data.collections.new("SAC_mobilia"); S.collection.children.link(C)
for o in list(C.objects): bpy.data.objects.remove(o, do_unlink=True)

def get(url): return urllib.request.urlopen(urllib.request.Request(url, headers=UA), context=ctx, timeout=90).read()
def baixa(pid, res="1k"):
    d = f"{A}/{pid}"; g = f"{d}/{pid}_{res}.gltf"
    if os.path.exists(g): return g
    f = json.loads(get(f"https://api.polyhaven.com/files/{pid}"))["gltf"][res]["gltf"]
    os.makedirs(d, exist_ok=True); open(g, "wb").write(get(f["url"]))
    for rel, inc in f.get("include", {}).items():
        p = os.path.join(d, rel); os.makedirs(os.path.dirname(p), exist_ok=True); open(p, "wb").write(get(inc["url"]))
    return g

CACHE = {}
def modelo(pid):
    """importa uma vez, guarda numa coleção escondida e devolve a coleção para instanciar"""
    if pid in CACHE: return CACHE[pid]
    col = bpy.data.collections.get(f"PH_{pid}")
    if col and col.objects: CACHE[pid] = col; return col
    col = col or bpy.data.collections.new(f"PH_{pid}")
    path = baixa(pid)
    with bpy.context.temp_override(window=w, scene=S):
        before = set(bpy.data.objects); bpy.ops.import_scene.gltf(filepath=path)
        new = [o for o in bpy.data.objects if o not in before]
    for o in new:
        for c in list(o.users_collection): c.objects.unlink(o)
        col.objects.link(o)
    CACHE[pid] = col; return col

def bbox(col):
    pts = [o.matrix_world @ Vector(c) for o in col.objects if o.type == 'MESH' for c in o.bound_box]
    lo = Vector((min(p.x for p in pts), min(p.y for p in pts), min(p.z for p in pts)))
    hi = Vector((max(p.x for p in pts), max(p.y for p in pts), max(p.z for p in pts)))
    return lo, hi

def P(px, py): return (px/100-3.765, 2.85-py/100)

def poe(pid, px, py, rot=0., z=0., escala=1., alvo=None, nome=None):
    """instancia o modelo com a base no piso (z), centro em (px,py) da planta, frente girada 'rot' graus
    (0 = frente para -y do blender, que é 'para dentro', longe da sacada). 'alvo' = (eixo, medida em m) ajusta escala."""
    col = modelo(pid); lo, hi = bbox(col); dim = hi-lo
    if alvo: escala = alvo[1]/max(1e-6, dim[alvo[0]])
    e = bpy.data.objects.new(nome or f"MOB_{pid}", None); e.instance_type = 'COLLECTION'; e.instance_collection = col
    col.instance_offset = Vector(((lo.x+hi.x)/2, (lo.y+hi.y)/2, lo.z))
    x, y = P(px, py); e.location = (x, y, z); e.rotation_euler[2] = math.radians(rot); e.scale = (escala,)*3
    C.objects.link(e); return e, dim*escala

# ---------- mobília: mesma disposição da planta, peças neutras ----------
info = {}
# sala — sofá encostado na parede da direita (x=753), virado para a TV
# rack baixo + TV na parede da esquerda (x=514)
info["rack"] = poe("modern_wooden_cabinet", 536, 135, rot=90, alvo=(0, 1.6))[1][:]
info["vaso"] = poe("ceramic_vase_01", 536, 88, z=.55, alvo=(2, .28))[1][:]
# jantar junto à península
info["pendente"] = poe("modern_ceiling_lamp_01", 660, 282, z=1.95, alvo=(2, .6))[1][:]
# verde e arte
info["planta"] = poe("potted_plant_02", 548, 262, rot=40, alvo=(2, 1.15))[1][:]
info["planta2"] = poe("potted_plant_02", 742, 14, alvo=(2, .9))[1][:]

# TV de tela plana na parede (modelo procedural simples: moldura fina + tela vítrea)
def caixa(nome, c, d, mat):
    me = bpy.data.meshes.new(nome); x, y, z = c; a, b2, h = d[0]/2, d[1]/2, d[2]/2
    v = [(x+i*a, y+j*b2, z+k*h) for i in (-1, 1) for j in (-1, 1) for k in (-1, 1)]
    f = [(0, 1, 3, 2), (4, 6, 7, 5), (0, 4, 5, 1), (2, 3, 7, 6), (0, 2, 6, 4), (1, 5, 7, 3)]
    me.from_pydata(v, [], f); me.materials.append(mat); o = bpy.data.objects.new(nome, me); C.objects.link(o); return o
mtv = bpy.data.materials.get("SAC_TV") or bpy.data.materials.new("SAC_TV"); mtv.use_nodes = True
bt = mtv.node_tree.nodes.get("Principled BSDF"); bt.inputs['Base Color'].default_value = (.008, .008, .009, 1); bt.inputs['Roughness'].default_value = .05; bt.inputs['Coat Weight'].default_value = 1.
tx, ty = P(517, 135); caixa("SAC_tv", (tx+.025, ty, 1.25), (.04, 1.24, .72), mtv)


# ---------- peças contemporâneas modeladas aqui, com texturas reais (Poly Haven) ----------
import bmesh
TX = os.path.expanduser("~/Movies/Boulevard_3D/assets/tex")
def mat_tex(nome, pid, escala=1., tint=(1, 1, 1), rough=1., bump=.5, sheen=0., mono=0.):
    m = bpy.data.materials.get(nome) or bpy.data.materials.new(nome); m.use_nodes = True; nt = m.node_tree; nt.nodes.clear(); L = nt.links.new
    out = nt.nodes.new('ShaderNodeOutputMaterial'); b = nt.nodes.new('ShaderNodeBsdfPrincipled'); L(b.outputs[0], out.inputs['Surface'])
    tc = nt.nodes.new('ShaderNodeTexCoord'); mp = nt.nodes.new('ShaderNodeMapping'); mp.inputs['Scale'].default_value = (escala,)*3; L(tc.outputs['Object'], mp.inputs['Vector'])
    def img(m_, cs):
        p = f"{TX}/{pid}/{pid}_{m_}_2k.jpg"; t = nt.nodes.new('ShaderNodeTexImage'); t.projection = 'BOX'; t.projection_blend = .3
        t.image = bpy.data.images.get(os.path.basename(p)) or bpy.data.images.load(p); t.image.colorspace_settings.name = cs; L(mp.outputs[0], t.inputs[0]); return t
    d = img("diff", 'sRGB'); mx = nt.nodes.new('ShaderNodeMix'); mx.data_type = 'RGBA'; mx.blend_type = 'MULTIPLY'; mx.inputs['Factor'].default_value = 1.
    s_ = [x for x in mx.inputs if x.type == 'RGBA']
    if mono:   # só a trama da textura; a cor vem do tint
        hs = nt.nodes.new('ShaderNodeHueSaturation'); hs.inputs['Saturation'].default_value = 0.; hs.inputs['Value'].default_value = mono
        L(d.outputs[0], hs.inputs['Color']); L(hs.outputs[0], s_[0])
    else: L(d.outputs[0], s_[0])
    s_[1].default_value = (*tint, 1); L([x for x in mx.outputs if x.type == 'RGBA'][0], b.inputs['Base Color'])
    r = img("rough", 'Non-Color'); rm = nt.nodes.new('ShaderNodeMath'); rm.operation = 'MULTIPLY'; rm.inputs[1].default_value = rough; L(r.outputs[0], rm.inputs[0]); L(rm.outputs[0], b.inputs['Roughness'])
    n = img("nor_gl", 'Non-Color'); nm = nt.nodes.new('ShaderNodeNormalMap'); nm.inputs['Strength'].default_value = bump; L(n.outputs[0], nm.inputs['Color']); L(nm.outputs[0], b.inputs['Normal'])
    b.inputs['Sheen Weight'].default_value = sheen; return m
def mat_cor(nome, cor, rough=.5, metal=0.):
    m = bpy.data.materials.get(nome) or bpy.data.materials.new(nome); m.use_nodes = True; b = m.node_tree.nodes.get("Principled BSDF")
    b.inputs['Base Color'].default_value = (*cor, 1); b.inputs['Roughness'].default_value = rough; b.inputs['Metallic'].default_value = metal; return m

LINHO = mat_tex("SAC_Linho", "rough_linen", 2.5, (.78, .74, .67), 1., .4, .5, mono=1.6)
BOUCLE = mat_tex("SAC_Boucle", "wool_boucle", 3., (.86, .83, .77), 1., .6, .6, mono=1.4)
TERRA = mat_tex("SAC_Terracota", "rough_linen", 3., (.62, .30, .19), 1., .4, .4, mono=1.6)
CARVALHO = mat_tex("SAC_Carvalho", "oak_veneer_01", 1., (1., 1., 1.), .8, .3)
JUTA = mat_tex("SAC_Juta", "hessian_230", 1.6, (.72, .62, .46), 1., .7, mono=1.5)
PRETO = mat_cor("SAC_MetalPreto", (.02, .02, .02), .35, 1.)

def peca(pai, nome, c, d, mat, bev=.008, seg=3, sub=0, rot=(0, 0, 0), cil=False):
    """bloco (ou cilindro) com chanfro, em coordenadas locais do móvel; c = centro da base"""
    me = bpy.data.meshes.new(nome); bm = bmesh.new()
    if cil: bmesh.ops.create_cone(bm, cap_ends=True, segments=48, radius1=d[0]/2, radius2=d[0]/2, depth=d[2])
    else: bmesh.ops.create_cube(bm, size=1.); bmesh.ops.scale(bm, vec=d, verts=bm.verts)
    bmesh.ops.translate(bm, vec=(0, 0, d[2]/2), verts=bm.verts); bm.to_mesh(me); bm.free()
    for f in me.polygons: f.use_smooth = True
    me.materials.append(mat); o = bpy.data.objects.new(nome, me); o.location = c; o.rotation_euler = rot; o.parent = pai; C.objects.link(o)
    if bev:
        m = o.modifiers.new("chanfro", 'BEVEL'); m.width = bev; m.segments = seg; m.limit_method = 'ANGLE'
    if sub: o.modifiers.new("macio", 'SUBSURF').levels = sub; o.modifiers["macio"].render_levels = sub
    return o

def movel(nome, px, py, rot):
    e = bpy.data.objects.new(nome, None); x, y = P(px, py); e.location = (x, y, 0); e.rotation_euler[2] = math.radians(rot); C.objects.link(e); return e

# sofá 3 lugares, linho cru, pés de metal (frente = -y local)
W, Dp = 2.0, .9
sf = movel("MOB_sofa", 706, 110, -90)
for sx in (-1, 1):
    for sy in (-1, 1): peca(sf, "sofa_pe", (sx*(W/2-.08), sy*(Dp/2-.08), 0), (.03, .03, .12), PRETO, bev=0, cil=True)
peca(sf, "sofa_base", (0, 0, .12), (W, Dp, .2), LINHO, bev=.03, seg=4)
for sx in (-1, 1):
    peca(sf, "sofa_braco", (sx*(W/2-.075), 0, .12), (.15, Dp, .48), LINHO, bev=.05, seg=5)
    peca(sf, "sofa_assento", (sx*(W/2-.15)/2, -.06, .32), ((W-.3)/2-.012, Dp-.2, .16), LINHO, bev=.05, seg=5, sub=1)
    peca(sf, "sofa_encosto", (sx*(W/2-.15)/2, Dp/2-.14, .33), ((W-.3)/2-.012, .2, .46), LINHO, bev=.06, seg=5, sub=1, rot=(math.radians(-9), 0, 0))
peca(sf, "sofa_costas", (0, Dp/2-.05, .3), (W-.3, .1, .32), LINHO, bev=.02)
# almofadas soltas (bouclê e terracota)
peca(sf, "almofada1", (-.62, Dp/2-.3, .47), (.46, .14, .44), BOUCLE, bev=.06, seg=5, sub=2, rot=(math.radians(-18), 0, math.radians(8)))
peca(sf, "almofada2", (.66, Dp/2-.3, .47), (.42, .14, .40), TERRA, bev=.06, seg=5, sub=2, rot=(math.radians(-16), 0, math.radians(-6)))
peca(sf, "manta", (.55, -.05, .48), (.5, .62, .025), BOUCLE, bev=.01, sub=1)

# mesa de centro redonda em carvalho, base preta
mc = movel("MOB_mesa_centro", 612, 112, 0)
peca(mc, "mc_tampo", (0, 0, .36), (.78, .78, .035), CARVALHO, bev=.006, cil=True)
peca(mc, "mc_base", (0, 0, 0), (.36, .36, .36), PRETO, bev=0, cil=True)
peca(mc, "livro1", (.12, -.05, .395), (.26, .2, .03), mat_cor("SAC_Capa1", (.78, .74, .66), .7), bev=.003, rot=(0, 0, .3))
peca(mc, "livro2", (.12, -.05, .425), (.22, .17, .025), mat_cor("SAC_Capa2", (.24, .27, .26), .7), bev=.003, rot=(0, 0, .45))

# jantar: mesa redonda de carvalho com pé central + 3 cadeiras de carvalho com assento em bouclê
mj = movel("MOB_mesa_jantar", 660, 282, 0)
peca(mj, "mj_tampo", (0, 0, .72), (.95, .95, .035), CARVALHO, bev=.006, cil=True)
peca(mj, "mj_coluna", (0, 0, .02), (.12, .12, .70), CARVALHO, bev=0, cil=True)
peca(mj, "mj_pe", (0, 0, 0), (.5, .5, .025), CARVALHO, bev=.004, cil=True)
def cadeira(px, py, rot):
    c = movel("MOB_cadeira", px, py, rot)
    for sx in (-1, 1):
        for sy in (-1, 1): peca(c, "cad_perna", (sx*.19, sy*.19, 0), (.032, .032, .44), CARVALHO, bev=0, cil=True)
        peca(c, "cad_poste", (sx*.19, .19, .44), (.03, .03, .36), CARVALHO, bev=0, cil=True)
    peca(c, "cad_quadro", (0, 0, .42), (.44, .44, .03), CARVALHO, bev=.004)
    peca(c, "cad_assento", (0, -.01, .45), (.42, .42, .05), BOUCLE, bev=.02, seg=4, sub=1)
    peca(c, "cad_encosto", (0, .2, .66), (.44, .03, .14), CARVALHO, bev=.006, rot=(math.radians(-6), 0, 0))
cadeira(652, 232, 0); cadeira(716, 284, -90); cadeira(604, 284, 90)

# quadro: tela abstrata em tons de terra sobre o sofá
mq = bpy.data.materials.get("SAC_Tela") or bpy.data.materials.new("SAC_Tela"); mq.use_nodes = True; nt = mq.node_tree
if not nt.nodes.get("TELA"):
    tc = nt.nodes.new('ShaderNodeTexCoord'); wv = nt.nodes.new('ShaderNodeTexWave'); wv.name = "TELA"; wv.inputs['Scale'].default_value = 1.2; wv.inputs['Distortion'].default_value = 6.
    nt.links.new(tc.outputs['Object'], wv.inputs['Vector']); cr = nt.nodes.new('ShaderNodeValToRGB'); nt.links.new(wv.outputs['Fac'], cr.inputs[0])
    cr.color_ramp.elements[0].color = (.72, .62, .50, 1); cr.color_ramp.elements[1].color = (.93, .90, .84, 1)
    e2 = cr.color_ramp.elements.new(.55); e2.color = (.55, .30, .20, 1)
    b = nt.nodes.get("Principled BSDF"); nt.links.new(cr.outputs[0], b.inputs['Base Color']); b.inputs['Roughness'].default_value = .85
qd = movel("MOB_quadro", 750, 110, -90)
peca(qd, "quadro_moldura", (0, .0, 1.22), (.96, .03, .68), CARVALHO, bev=.003)
peca(qd, "quadro_tela", (0, -.004, 1.24), (.92, .03, .64), mq, bev=.002)

# esconde as coleções-fonte
for c in bpy.data.collections:
    if c.name.startswith("PH_"):
        for o in c.objects: o.hide_render = False
        if c.name in S.collection.children: S.collection.children.unlink(c)

# tapete simples de lã (sob a mesa de centro)
mt = bpy.data.materials.get("SAC_Tapete") or bpy.data.materials.new("SAC_Tapete"); mt.use_nodes = True
nt = mt.node_tree; b = nt.nodes.get("Principled BSDF"); b.inputs['Base Color'].default_value = (.62, .58, .52, 1); b.inputs['Roughness'].default_value = 1.
if not nt.nodes.get("TAPN"):
    nz = nt.nodes.new('ShaderNodeTexNoise'); nz.name = "TAPN"; nz.inputs['Scale'].default_value = 400.; nz.inputs['Detail'].default_value = 4.
    bp = nt.nodes.new('ShaderNodeBump'); bp.inputs['Strength'].default_value = .3; nt.links.new(nz.outputs['Fac'], bp.inputs['Height']); nt.links.new(bp.outputs[0], b.inputs['Normal'])
    b.inputs['Sheen Weight'].default_value = .4
me = bpy.data.meshes.new("SAC_tapete"); x, y = P(612, 112); W, D = 1.7, 2.3
me.from_pydata([(x-W/2, y-D/2, .006), (x+W/2, y-D/2, .006), (x+W/2, y+D/2, .006), (x-W/2, y+D/2, .006)], [], [(0, 1, 2, 3)])
me.materials.append(JUTA); t = bpy.data.objects.new("SAC_tapete", me); C.objects.link(t)
sol = t.modifiers.new("esp", 'SOLIDIFY'); sol.thickness = .012

# luz quente do pendente (fica apagada de dia; acende na régua à noite)
ld = bpy.data.lights.new("SAC_luz_pendente", 'POINT'); ld.energy = 0.; ld.color = (1., .78, .55); ld.shadow_soft_size = .1
lo = bpy.data.objects.new("SAC_luz_pendente", ld); x, y = P(660, 282); lo.location = (x, y, 1.72); C.objects.link(lo)

# paredes de destaque verdes (decoração pessoal) -> reboco neutro
for m in bpy.data.materials:
    if m.name.startswith("tex_3b4a2e"):
        b = m.node_tree.nodes.get("Principled BSDF")
        for l in list(b.inputs['Base Color'].links): m.node_tree.links.remove(l)
        b.inputs['Base Color'].default_value = (.80, .77, .72, 1)

result = {k: [round(v, 2) for v in d] for k, d in info.items()}
