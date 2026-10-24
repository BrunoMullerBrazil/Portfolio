# Remontagem 08 (turno 60): equilíbrio da luz interna das lojas (rodar depois de blender_lojas_interior.py)
import bpy
for l in bpy.data.lights:
    if l.name.startswith("BLV_loja"): l.energy = 80.
for m in bpy.data.materials:
    if m.name.startswith("BLV_Loja_Luz_"): m.node_tree.nodes['Principled BSDF'].inputs['Emission Strength'].default_value = 5.
    if m.name.startswith("BLV_Loja_Parede_") and not m.get("escurecida"):
        b = m.node_tree.nodes['Principled BSDF']; c = b.inputs['Base Color'].default_value
        b.inputs['Base Color'].default_value = (c[0]*.6, c[1]*.6, c[2]*.6, 1); m["escurecida"] = 1
result = {"ok": True}
