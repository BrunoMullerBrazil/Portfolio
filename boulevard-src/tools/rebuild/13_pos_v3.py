# Remontagem 13 (turno 89): ajustes aprovados depois do heroi_v3 — sem moitas ralas no primeiro plano; grafite mais claro e
# com reflexo de céu.
import bpy
for o in list(bpy.data.objects):
    if o.name.startswith("BLV_moita_"): bpy.data.objects.remove(o, do_unlink=True)
m = bpy.data.materials["BLV_Reboco_Grafite"]; nt = m.node_tree; b = nt.nodes['Principled BSDF']
b.inputs['Roughness'].default_value = .55; b.inputs['Specular IOR Level'].default_value = .6
for n in nt.nodes:
    if n.type == 'MIX' and n.blend_type == 'MULTIPLY':
        ins = [s for s in n.inputs if s.type == 'RGBA']; ins[1].default_value = (.16, .17, .19, 1)
result = {"ok": True}
