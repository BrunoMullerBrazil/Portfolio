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
info["sofa"] = poe("sofa_03", 706, 110, rot=-90, alvo=(0, 2.0))[1][:]
info["almofadas"] = poe("throw_pillows_01", 728, 110, rot=-90, z=.45, alvo=(0, 1.2))[1][:]
info["mesa_centro"] = poe("modern_coffee_table_01", 615, 112, rot=-90, alvo=(0, .9))[1][:]
# rack baixo + TV na parede da esquerda (x=514)
info["rack"] = poe("modern_wooden_cabinet", 536, 135, rot=90, alvo=(0, 1.6))[1][:]
info["tv"] = poe("television_02", 530, 135, rot=90, z=.55, alvo=(0, 1.1))[1][:]
info["vaso"] = poe("ceramic_vase_01", 536, 88, z=.55, alvo=(2, .28))[1][:]
info["livros"] = poe("decorative_book_set_01", 536, 190, rot=90, z=.55, alvo=(0, .3))[1][:]
# jantar junto à península
info["mesa"] = poe("round_wooden_table_01", 660, 282, alvo=(0, .9))[1][:]
info["cad1"] = poe("dining_chair_02", 652, 228, rot=180, alvo=(2, .82))[1][:]
info["cad2"] = poe("dining_chair_02", 714, 284, rot=90, alvo=(2, .82))[1][:]
info["cad3"] = poe("dining_chair_02", 606, 284, rot=-90, alvo=(2, .82))[1][:]
info["pendente"] = poe("modern_ceiling_lamp_01", 660, 282, z=1.95, alvo=(2, .6))[1][:]
# verde e arte
info["planta"] = poe("potted_plant_04", 526, 252, alvo=(2, 1.5))[1][:]
info["planta2"] = poe("potted_plant_02", 742, 14, alvo=(2, .9))[1][:]
info["quadro"] = poe("hanging_picture_frame_01", 750, 110, rot=-90, z=1.25, alvo=(0, .9))[1][:]

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
me = bpy.data.meshes.new("SAC_tapete"); x, y = P(612, 112); W, D = 1.6, 2.2
me.from_pydata([(x-W/2, y-D/2, .006), (x+W/2, y-D/2, .006), (x+W/2, y+D/2, .006), (x-W/2, y+D/2, .006)], [], [(0, 1, 2, 3)])
me.materials.append(mt); t = bpy.data.objects.new("SAC_tapete", me); C.objects.link(t)
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
