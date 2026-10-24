# Realismo 22: acabamento de câmera no compositor (Blender 5): brilho nas luzes (fog glow), leve aberração
# cromática nas bordas e vinheta suave. Tudo discreto — o objetivo é tirar o "limpo demais" do CG.
import bpy
scn = bpy.data.scenes["Boulevard"]
ng = bpy.data.node_groups.get("BLV_Pos") or bpy.data.node_groups.new("BLV_Pos", "CompositorNodeTree")
ng.nodes.clear()
for it in list(ng.interface.items_tree): ng.interface.remove(it)
ng.interface.new_socket("Image", in_out='OUTPUT', socket_type='NodeSocketColor')
N = ng.nodes; L = ng.links.new
rl = N.new("CompositorNodeRLayers"); rl.scene = scn
gl = N.new("CompositorNodeGlare"); gl.inputs['Type'].default_value = 'Fog Glow'; gl.inputs['Quality'].default_value = 'High'
gl.inputs['Threshold'].default_value = 1.2; gl.inputs['Strength'].default_value = .35; gl.inputs['Size'].default_value = .65
ld = N.new("CompositorNodeLensdist"); ld.inputs['Dispersion'].default_value = .010; ld.inputs['Distortion'].default_value = 0.
el = N.new("CompositorNodeEllipseMask"); el.inputs['Size'].default_value = (1.35, 1.15)
bl = N.new("CompositorNodeBlur"); 
mx = N.new("ShaderNodeMix"); mx.data_type = 'RGBA'; mx.blend_type = 'MULTIPLY'; mx.inputs['Factor'].default_value = .22
mp = N.new("ShaderNodeMapRange"); mp.inputs['To Min'].default_value = 0.; mp.inputs['To Max'].default_value = 1.
out = N.new("NodeGroupOutput")
L(rl.outputs['Image'], gl.inputs['Image']); L(gl.outputs['Image'], ld.inputs['Image'])
ins = [s for s in mx.inputs if s.type == 'RGBA']; L(ld.outputs['Image'], ins[0])
# vinheta: máscara elíptica desfocada vira cor (branco no centro, cinza nas bordas)
bl.inputs['Size'].default_value = (260, 260)
L(el.outputs['Mask'], bl.inputs['Image']); L(bl.outputs['Image'], ins[1])
L([s for s in mx.outputs if s.type == 'RGBA'][0], out.inputs[0])
scn.compositing_node_group = ng
result = {"nos": [n.bl_idname for n in N], "blur_in": [s.name for s in bl.inputs]}
