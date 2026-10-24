# Remontagem 07 (turnos 55-56): luz real dos 29 postes (spots sob cada luminária) + vitrines sem estourar na hora azul.
# O céu de crepúsculo/apês acesos/exposição ficam em blender_orbita.py (seção "hora azul").
import bpy, math
from mathutils import Vector
scn = bpy.data.scenes["Boulevard"]
C = bpy.data.collections["BLV_Rua"]
for o in list(C.objects):
    if o.name.startswith("BLV_luz_poste"): bpy.data.objects.remove(o, do_unlink=True)
me = scn.objects["BLV_luminarias_luz"].data; n = 0
ld = bpy.data.lights.get("BLV_luz_poste") or bpy.data.lights.new("BLV_luz_poste", 'SPOT')
ld.energy = 900; ld.spot_size = math.radians(140); ld.spot_blend = .6; ld.shadow_soft_size = .25; ld.color = (1., .78, .52)
for i in range(0, len(me.vertices), 8):
    c = sum((me.vertices[j].co for j in range(i, i+8)), Vector())/8
    o = bpy.data.objects.new(f"BLV_luz_poste_{n:02d}", ld); o.location = (c.x, c.y, c.z-.1); C.objects.link(o); n += 1
bpy.data.materials["BLV_Interior"].node_tree.nodes["LIGHTS"].outputs[0].default_value = 1.
si = bpy.data.materials["BLV_Loja_Interior"]; [x for x in si.node_tree.nodes if x.type == 'EMISSION'][0].inputs['Strength'].default_value = .22
lf = bpy.data.materials.get("BLV_Loja_Fundo")
if lf: lf.node_tree.nodes['Principled BSDF'].inputs['Emission Strength'].default_value = .45
result = {"lamps": n}
