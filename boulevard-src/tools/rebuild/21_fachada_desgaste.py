# Realismo 21: fachada com vida — sujeira em cantos (AO), escorrimento vertical sutil abaixo das lajes,
# manchas grandes de tom e variação de rugosidade. Mantém as cores do book (efeito ≤ 12% no tom).
import bpy
MATS = {"BLV_Reboco_Claro": .12, "BLV_Reboco_Nucleo": .10, "BLV_Laje": .10, "BLV_Reboco_Grafite": .08,
        "BLV_Muro": .08, "BLV_Pintura_Branca": .06, "BLV_Lojas_Superior": .08}
def wear(m, k):
    nt = m.node_tree; N = nt.nodes; L = nt.links.new
    if N.get("WEAR"): return False
    b = next(n for n in N if n.type == 'BSDF_PRINCIPLED')
    lk = [l for l in nt.links if l.to_socket == b.inputs['Base Color']]
    src = lk[0].from_socket if lk else None
    tc = N.new('ShaderNodeTexCoord')
    # escorrimento: ruído esticado na vertical
    mp = N.new('ShaderNodeMapping'); mp.inputs['Scale'].default_value = (7., 7., .45); L(tc.outputs['Object'], mp.inputs['Vector'])
    nz = N.new('ShaderNodeTexNoise'); nz.inputs['Scale'].default_value = 3.; nz.inputs['Detail'].default_value = 6.; L(mp.outputs[0], nz.inputs['Vector'])
    st = N.new('ShaderNodeMapRange'); st.inputs['From Min'].default_value = .52; st.inputs['From Max'].default_value = .75; L(nz.outputs['Fac'], st.inputs['Value'])
    # manchas grandes
    nb = N.new('ShaderNodeTexNoise'); nb.inputs['Scale'].default_value = .06; nb.inputs['Detail'].default_value = 3.; L(tc.outputs['Object'], nb.inputs['Vector'])
    bm = N.new('ShaderNodeMapRange'); bm.inputs['From Min'].default_value = .4; bm.inputs['From Max'].default_value = .7; L(nb.outputs['Fac'], bm.inputs['Value'])
    # cantos: oclusão
    ao = N.new('ShaderNodeAmbientOcclusion'); ao.samples = 8; ao.inputs['Distance'].default_value = .35
    inv = N.new('ShaderNodeMath'); inv.operation = 'SUBTRACT'; inv.inputs[0].default_value = 1.; L(ao.outputs['AO'], inv.inputs[1])
    s1 = N.new('ShaderNodeMath'); s1.operation = 'MAXIMUM'; L(st.outputs[0], s1.inputs[0]); L(inv.outputs[0], s1.inputs[1])
    s2 = N.new('ShaderNodeMath'); s2.operation = 'ADD'; s2.use_clamp = True; L(s1.outputs[0], s2.inputs[0]); L(bm.outputs[0], s2.inputs[1])
    f = N.new('ShaderNodeMath'); f.operation = 'MULTIPLY'; f.inputs[1].default_value = k; L(s2.outputs[0], f.inputs[0])
    mx = N.new('ShaderNodeMix'); mx.name = "WEAR"; mx.data_type = 'RGBA'; mx.blend_type = 'MULTIPLY'
    ins = [s for s in mx.inputs if s.type == 'RGBA']; L(f.outputs[0], mx.inputs['Factor'])
    if src: L(src, ins[0])
    else: ins[0].default_value = b.inputs['Base Color'].default_value
    ins[1].default_value = (.55, .52, .48, 1)
    L([s for s in mx.outputs if s.type == 'RGBA'][0], b.inputs['Base Color'])
    # rugosidade varia com as manchas
    rk = [l for l in nt.links if l.to_socket == b.inputs['Roughness']]
    if not rk:
        rr = N.new('ShaderNodeMapRange'); rr.inputs['To Min'].default_value = .78; rr.inputs['To Max'].default_value = .95
        L(nb.outputs['Fac'], rr.inputs['Value']); L(rr.outputs[0], b.inputs['Roughness'])
    return True
feito = [n for n, k in MATS.items() if n in bpy.data.materials and wear(bpy.data.materials[n], k)]
# vidro: reflexo mais nítido e leve tom (o "espelho escuro" das fachadas reais)
g = bpy.data.materials["BLV_Vidro"].node_tree
for n in g.nodes:
    if n.type == 'BSDF_GLOSSY': n.inputs['Roughness'].default_value = .02; n.inputs['Color'].default_value = (.85, .88, .9, 1)
    if n.type == 'LAYER_WEIGHT': n.inputs['Blend'].default_value = .32
result = {"desgaste": feito}
