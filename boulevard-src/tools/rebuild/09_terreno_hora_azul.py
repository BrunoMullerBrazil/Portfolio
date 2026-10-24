# Remontagem 09 (turno 66): névoa escura/azulada para a hora azul (morros não viram "neve") e grama com variação em
# escala grande (pasto / terra batida) para vistas aéreas.
import bpy
tm = bpy.data.materials["BLV_Terreno"].node_tree
tm.nodes['HAZE'].inputs['Color'].default_value = (.30, .36, .52, 1); tm.nodes['HAZE'].inputs['Strength'].default_value = .12
cam = [n for n in tm.nodes if n.type == 'CAMERA'][0]
hz = [l.to_node for l in tm.links if l.from_node == cam][0]
hz.inputs['From Min'].default_value = 600; hz.inputs['From Max'].default_value = 4500; hz.inputs['To Max'].default_value = .85
grass = [n for n in tm.nodes if n.type == 'VALTORGB'][0]
grass.color_ramp.elements[0].color = (.045, .065, .022, 1); grass.color_ramp.elements[1].color = (.11, .12, .05, 1)
geo = [n for n in tm.nodes if n.type == 'NEW_GEOMETRY'][0]
if 'BIGNOISE' not in tm.nodes:
    nz = tm.nodes.new('ShaderNodeTexNoise'); nz.name = 'BIGNOISE'; nz.inputs['Scale'].default_value = .004; nz.inputs['Detail'].default_value = 6
    tm.links.new(geo.outputs['Position'], nz.inputs['Vector']); tm.links.new(nz.outputs['Fac'], grass.inputs[0])
    grass.color_ramp.elements.new(.62).color = (.16, .13, .07, 1)
result = {"ok": True}
