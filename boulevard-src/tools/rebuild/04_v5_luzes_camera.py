# Remontagem 04 (turno 39 -> v5): só ~45% dos apês acesos (porta GATE), névoa azulada no terreno, câmera da rotatória.
import bpy, math
from mathutils import Vector
scn = bpy.data.scenes["Boulevard"]
it = bpy.data.materials["BLV_Interior"].node_tree; N = it.nodes
if "GATE" not in N:
    oi = [n for n in N if n.type == 'OBJECT_INFO'][0]; lights = N["LIGHTS"]; mul = [n for n in N if n.type == 'MATH' and n.operation == 'MULTIPLY'][0]
    lt = N.new('ShaderNodeMath'); lt.name = "GATE"; lt.operation = 'LESS_THAN'; lt.inputs[1].default_value = .45
    it.links.new(oi.outputs['Random'], lt.inputs[0])
    m2 = N.new('ShaderNodeMath'); m2.operation = 'MULTIPLY'; it.links.new(lights.outputs[0], m2.inputs[0]); it.links.new(lt.outputs[0], m2.inputs[1])
    it.links.new(m2.outputs[0], mul.inputs[0])
tm = bpy.data.materials["BLV_Terreno"].node_tree
hz = [n for n in tm.nodes if n.type == 'MAP_RANGE' and n.inputs['From Min'].default_value in (250., 150.)]
if hz:
    hz = hz[0]; hz.inputs['From Min'].default_value = 150; hz.inputs['From Max'].default_value = 2200; hz.inputs['To Max'].default_value = .72
if 'HAZE' in tm.nodes: tm.nodes['HAZE'].inputs['Color'].default_value = (.55, .60, .72, 1); tm.nodes['HAZE'].inputs['Strength'].default_value = .6
cam = scn.objects["BLV_Cam_Abertura"]; cd = cam.data
cam.location = Vector((-118, -48, 4.0)); tgt = Vector((-45, 6, 4.0)); d = tgt-cam.location
cam.rotation_euler = (math.radians(90), 0, math.atan2(d.y, d.x)-math.radians(90))
cd.lens = 26; cd.shift_y = (cd.lens*((24-4.0)/d.length))/36
rm = 0
for o in list(scn.objects):
    if o.name.startswith("BLV_arv") and (Vector(o.location[:2])-Vector(cam.location[:2])).length < 22: bpy.data.objects.remove(o, do_unlink=True); rm += 1
for o in scn.objects:
    if o.name.startswith("BLV_arv") and o.instance_collection:
        base = o.instance_collection.name.rsplit('_', 1)[0]
        o.instance_collection = bpy.data.collections[f"{base}_{'LOD0' if (o.location-cam.location).length < 220 else 'LOD1'}"]
result = {"removed_near_cam": rm}
