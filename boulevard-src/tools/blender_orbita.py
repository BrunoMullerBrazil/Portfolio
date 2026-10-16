# Boulevard em 3D -> hora azul, órbita baixa e camadas para o visor de 360° (rodar por último)
# Gera, para cada ângulo, três imagens: base (apês apagados), luzes (todos acesos) e máscara de ID por apartamento.
# O navegador mistura base/luzes por pixel conforme a tabela da construtora (ver protótipo "Boulevard Luzes por Unidade").
import bpy, os, math, json, shutil
from mathutils import Vector

scn = bpy.data.scenes["Boulevard"]
OUT = os.path.expanduser("~/Movies/Boulevard_3D/orbita")
FRAMES = 36                     # a cada 10°
RES = (1920, 1080)

# ---------- hora azul ----------
wn = scn.world.node_tree; N = wn.nodes
sky = N.get("BLV_SKY") or N.new('ShaderNodeTexSky'); sky.name = "BLV_SKY"; sky.sky_type = 'MULTIPLE_SCATTERING'
el, az = math.radians(-3.0), math.radians(248)
sd = Vector((-math.cos(az), math.sin(az), 0)).normalized()
for k, v in (('sun_disc', False), ('sun_elevation', el), ('sun_rotation', math.atan2(sd.y, sd.x)-math.pi/2), ('altitude', 30.)):
    try: setattr(sky, k, v)
    except Exception: pass
bg = [n for n in N if n.type == 'BACKGROUND'][0]; wn.links.new(sky.outputs[0], bg.inputs['Color']); bg.inputs['Strength'].default_value = 1.
if "BLV_Sol" in scn.objects: scn.objects["BLV_Sol"].hide_render = True
for name, node, val in (("BLV_Casa_Janela", "NIGHT", 1.),):
    m = bpy.data.materials.get(name)
    if m: m.node_tree.nodes[node].outputs[0].default_value = val
iv = bpy.data.materials.get("BLV_Interior_Vizinho")
if iv: iv.node_tree.nodes["LIGHTS"].outputs[0].default_value = 1.
lg = bpy.data.materials.get("BLV_Luminaria_Luz")
if lg: lg.node_tree.nodes['Principled BSDF'].inputs['Emission Strength'].default_value = 30.
scn.view_settings.view_transform = 'AgX'; scn.view_settings.exposure = 2.3

# ---------- órbita baixa (~4º andar), verticais retas, elipse que se abre perto da Torre di Mosto ----------
tg = scn.objects.get("BLV_Orbita_Alvo") or bpy.data.objects.new("BLV_Orbita_Alvo", None)
if not tg.users_collection: bpy.data.collections["BLV_Entorno"].objects.link(tg)
tg.location = (0, 6, 20)
cd = bpy.data.cameras.get("BLV_Cam_Orbita") or bpy.data.cameras.new("BLV_Cam_Orbita"); cd.lens = 30; cd.sensor_width = 36; cd.clip_end = 9000
cam = scn.objects.get("BLV_Cam_Orbita") or bpy.data.objects.new("BLV_Cam_Orbita", cd)
if not cam.users_collection: bpy.data.collections["BLV_Entorno"].objects.link(cam)
for c in list(cam.constraints): cam.constraints.remove(c)
A, Bb, Z, ZC = 172., 150., 14., 25.; cx, cy = tg.location.x, tg.location.y
mx, my = -80., 66.; am = math.atan2(my-cy, mx-cx)
def pose(deg):   # 0° = frente (avenida)
    a = math.radians(deg-90); da = math.atan2(math.sin(a-am), math.cos(a-am))
    k = 1+.5*math.exp(-(da/math.radians(32))**2)
    x = cx+A*k*math.cos(a); y = cy+Bb*k*math.sin(a)
    cam.location = (x, y, Z); yaw = math.atan2(cy-y, cx-x)
    cam.rotation_euler = (math.radians(90), 0, yaw-math.radians(90))
    d = math.hypot(cx-x, cy-y); cd.shift_y = (cd.lens*((ZC-Z)/d))/36

# ---------- material da máscara: emissão = ID (R = idx%256, G = idx//256, B = 1) ----------
units = sorted([o for o in scn.objects if o.name.startswith("UN_")], key=lambda o: o.name); umap = {}
for i, o in enumerate(units, start=1):
    if "uid" not in o: o["uid"] = o.pass_index
    o.pass_index = i; umap[i] = o.name[3:]
for o in scn.objects:
    if o.name.startswith("BLV_vizinho_interior"): o.pass_index = 0
os.makedirs(OUT, exist_ok=True); json.dump(umap, open(f"{OUT}/unidades.json", "w"), ensure_ascii=False)
mm = bpy.data.materials.get("BLV_MASK") or bpy.data.materials.new("BLV_MASK"); mm.use_nodes = True; nt = mm.node_tree; nt.nodes.clear(); L = nt.links.new
out = nt.nodes.new('ShaderNodeOutputMaterial'); em = nt.nodes.new('ShaderNodeEmission'); oi = nt.nodes.new('ShaderNodeObjectInfo')
def math_node(op, a=None, b=None):
    n = nt.nodes.new('ShaderNodeMath'); n.operation = op
    if b is not None: n.inputs[1].default_value = b
    return n
mod = math_node('MODULO', b=256); L(oi.outputs['Object Index'], mod.inputs[0]); r = math_node('DIVIDE', b=255); L(mod.outputs[0], r.inputs[0])
dv = math_node('DIVIDE', b=256); L(oi.outputs['Object Index'], dv.inputs[0]); fl = math_node('FLOOR'); L(dv.outputs[0], fl.inputs[0])
g = math_node('DIVIDE', b=255); L(fl.outputs[0], g.inputs[0]); bb = math_node('GREATER_THAN', b=.5); L(oi.outputs['Object Index'], bb.inputs[0])
cmb = nt.nodes.new('ShaderNodeCombineXYZ'); L(r.outputs[0], cmb.inputs[0]); L(g.outputs[0], cmb.inputs[1]); L(bb.outputs[0], cmb.inputs[2])
L(cmb.outputs[0], em.inputs['Color']); L(em.outputs[0], out.inputs[0])

it = bpy.data.materials["BLV_Interior"].node_tree
glass = [o for o in scn.objects if o.type == 'MESH' and o.data.materials and o.data.materials[0] and o.data.materials[0].name in ("BLV_Vidro", "BLV_Vidro_Guarda_Corpo")]
def normal_mode():
    scn.view_layers[0].material_override = None
    for o in glass: o.visible_camera = True
    scn.cycles.samples = 128; scn.cycles.filter_width = 1.5; scn.cycles.use_denoising = True; scn.render.film_transparent = False
    scn.render.dither_intensity = 1.; scn.view_settings.view_transform = 'AgX'; scn.view_settings.look = 'AgX - Medium High Contrast'; scn.view_settings.exposure = 2.3
    scn.render.image_settings.color_mode = 'RGB'
def mask_mode():
    scn.view_layers[0].material_override = mm
    for o in glass: o.visible_camera = False      # o vidro esconderia o ID do cômodo
    scn.cycles.samples = 1; scn.cycles.filter_width = .01; scn.cycles.use_denoising = False; scn.render.film_transparent = True
    scn.render.dither_intensity = 0; scn.view_settings.view_transform = 'Raw'; scn.view_settings.look = 'None'; scn.view_settings.exposure = 0.
    scn.render.image_settings.color_mode = 'RGBA'

# ---------- fila de renders (não bloqueia o Blender: um timer dispara o próximo quando o anterior termina) ----------
jobs = []
for k in range(FRAMES):
    deg = k*360//FRAMES
    def jb(deg=deg): normal_mode(); pose(deg); it.nodes["LIGHTS"].outputs[0].default_value = 0.; scn.render.filepath = f"{OUT}/{deg:03d}_base.png"
    def jl(deg=deg): normal_mode(); pose(deg); it.nodes["LIGHTS"].outputs[0].default_value = 1.; it.nodes["GATE"].inputs[1].default_value = 1.01; scn.render.filepath = f"{OUT}/{deg:03d}_luzes.png"
    def jm(deg=deg): pose(deg); mask_mode(); scn.render.filepath = f"{OUT}/{deg:03d}_mascara.png"
    jobs += [jb, jl, jm]
ns = bpy.app.driver_namespace; ns['blv_jobs'] = jobs; ns['blv_jobi'] = 0
def restore():
    normal_mode(); it.nodes["LIGHTS"].outputs[0].default_value = 1.; it.nodes["GATE"].inputs[1].default_value = .45
    open(f"{OUT}/PRONTO.txt", "w").write("ok")
def go():
    i = ns['blv_jobi']
    if i >= len(ns['blv_jobs']): restore(); bpy.ops.wm.save_mainfile(); return None
    ns['blv_jobs'][i](); ns['blv_jobi'] = i+1
    win = bpy.context.window_manager.windows[0]
    with bpy.context.temp_override(window=win, screen=win.screen):
        bpy.ops.render.render('INVOKE_DEFAULT', write_still=True)
    return None
def on_done(scene, *a):
    if scene.name == "Boulevard": bpy.app.timers.register(go, first_interval=1.5)
for h in list(bpy.app.handlers.render_complete):
    if getattr(h, '__name__', '') == 'on_done': bpy.app.handlers.render_complete.remove(h)
bpy.app.handlers.render_complete.append(on_done)
scn.camera = cam; scn.render.resolution_x, scn.render.resolution_y = RES; scn.render.resolution_percentage = 100
bpy.app.timers.register(go, first_interval=1.)
result = dict(frames=FRAMES, renders=len(jobs))
