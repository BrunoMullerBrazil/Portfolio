# Realismo 32: grama dos terrenos vazios. A textura de grama estava multiplicada ×4 (verde-limão homogêneo nas aéreas).
# Terreno baldio real em Palhoça no fim de inverno/primavera: verde mais fechado, manchas de capim seco cor de palha
# e terra exposta. Só shader do BLV_Terreno (nós criados pelo 09/26).
import bpy
nt = bpy.data.materials["BLV_Terreno"].node_tree; N = nt.nodes; out = {}
if "Mix.003" in N: N["Mix.003"].inputs[7].default_value = (2.7, 2.6, 2.2, 1); out['ganho'] = 2.7        # menos limão
if "Mix.004" in N: N["Mix.004"].inputs[7].default_value = (.19, .155, .085, 1); out['seco'] = 1          # palha
if "Map Range.004" in N:
    m = N["Map Range.004"]; m.inputs[1].default_value = .50; m.inputs[2].default_value = .70; m.inputs[4].default_value = .8
if "SECO" in N: N["SECO"].inputs['Scale'].default_value = .03; N["SECO"].inputs['Detail'].default_value = 6
# terra exposta: segunda camada de manchas menores, marrom-avermelhado (solo de Palhoça), só onde o SECO é mais forte
if "TERRA" not in N and "Mix.004" in N:
    mx = N["Mix.004"]; src = mx.outputs[2].links[0].to_socket if mx.outputs[2].links else None
    tc = N.new('ShaderNodeNewGeometry'); nz = N.new('ShaderNodeTexNoise'); nz.name = "TERRA"; nz.inputs['Scale'].default_value = .11; nz.inputs['Detail'].default_value = 8
    nt.links.new(tc.outputs['Position'], nz.inputs['Vector'])
    mr = N.new('ShaderNodeMapRange'); mr.inputs[1].default_value = .66; mr.inputs[2].default_value = .74; mr.inputs[4].default_value = .7
    nt.links.new(nz.outputs['Fac'], mr.inputs[0])
    mm = N.new('ShaderNodeMix'); mm.data_type = 'RGBA'; mm.blend_type = 'MIX'; mm.inputs[7].default_value = (.17, .10, .06, 1)
    nt.links.new(mr.outputs[0], mm.inputs[0]); nt.links.new(mx.outputs[2], mm.inputs[6])
    if src: nt.links.new(mm.outputs[2], src)
    out['terra'] = 1
result = out
