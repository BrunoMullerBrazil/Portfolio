# Remontagem 12 (turno 86): o look do heroi_v3 (é o hero publicado no site). Rodar depois de blender_realismo2.py.
# Sem sol direto; céu de crepúsculo com nuvens girado 150°; AgX Medium High Contrast, exposição 1.6, WB 7200 K;
# reboco dessaturado; janelas/lojas/postes/casas acesos com brilho; grama verde-escura; quadro mais alto.
import bpy, math
scn = bpy.data.scenes["Boulevard"]
scn.objects["BLV_Sol"].hide_render = True
wn = scn.world.node_tree; bg = [n for n in wn.nodes if n.type == 'BACKGROUND'][0]; bg.inputs['Strength'].default_value = .22
mp = [n for n in wn.nodes if n.type == 'MAPPING'][0]
if not scn.get("blv_v3_rot"):
    r = mp.inputs['Rotation'].default_value; mp.inputs['Rotation'].default_value = (r[0], r[1], r[2]+math.radians(150)); scn["blv_v3_rot"] = 1
vs = scn.view_settings; vs.view_transform = 'AgX'
try: vs.look = 'AgX - Medium High Contrast'
except Exception: pass
vs.exposure = 1.6
for k, v in (('use_white_balance', True), ('white_balance_temperature', 7200)):
    try: setattr(vs, k, v)
    except Exception: pass
for n in ("BLV_Reboco_Claro", "BLV_Reboco_Nucleo", "BLV_Laje", "BLV_Muro"):
    m = bpy.data.materials.get(n)
    if not m: continue
    nt = m.node_tree; b = nt.nodes['Principled BSDF']
    if not nt.nodes.get('DESAT'):
        lk = [l for l in nt.links if l.to_socket == b.inputs['Base Color']]
        if lk:
            hs = nt.nodes.new('ShaderNodeHueSaturation'); hs.name = 'DESAT'; hs.inputs['Saturation'].default_value = .25; hs.inputs['Value'].default_value = 1.05
            src = lk[0].from_socket; nt.links.remove(lk[0]); nt.links.new(src, hs.inputs['Color']); nt.links.new(hs.outputs[0], b.inputs['Base Color'])
it = bpy.data.materials["BLV_Interior"].node_tree; it.nodes["LIGHTS"].outputs[0].default_value = 1.; it.nodes["GATE"].inputs[1].default_value = .55
for n in [n for n in it.nodes if n.type == 'MATH' and n.operation == 'MULTIPLY' and n.inputs[1].default_value > 3]: n.inputs[1].default_value = 9.
lg = bpy.data.materials.get("BLV_Luminaria_Luz")
if lg: lg.node_tree.nodes['Principled BSDF'].inputs['Emission Strength'].default_value = 30.
cj = bpy.data.materials.get("BLV_Casa_Janela")
if cj: cj.node_tree.nodes["NIGHT"].outputs[0].default_value = 1.
gr = [n for n in bpy.data.materials["BLV_Terreno"].node_tree.nodes if n.type == 'VALTORGB'][0]
for e in gr.color_ramp.elements: e.color = (.035, .05, .022, 1)
cam = scn.objects["BLV_Cam_Orbita"]; cd = cam.data; tg = scn.objects["BLV_Orbita_Alvo"]
d = math.hypot(tg.location.x-cam.location.x, tg.location.y-cam.location.y); cd.shift_y = (cd.lens*((31-14)/d))/36
scn.camera = cam; scn.cycles.samples = 384
result = {"ok": True}
