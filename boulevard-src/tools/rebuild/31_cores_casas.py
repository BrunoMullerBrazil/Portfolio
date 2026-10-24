# Realismo 31: o 29 leu a cor base das casas de um Principled cujo Base Color já estava ligado (default .8), então
# todas as paredes e TODOS os telhados viraram cinza-claro (telhado branco na praca30). Aqui reaplica as paletas do 23
# (WC paredes, RC telhados) direto nos nós do 29, já no albedo de tinta/telha real.
import bpy
M = bpy.data.materials
def srgb(hx):
    c = [((hx >> s) & 255)/255 for s in (16, 8, 0)]
    return [(v/12.92 if v <= .04045 else ((v+.055)/1.055)**2.4) for v in c]+[1.]
WC = [0xeeeae1, 0xe5ddcf, 0xd9d3c6, 0xf2efe8, 0xc9c0ad, 0xe9e2d2, 0xbfc4c6]
RC = [0x8e4a34, 0x9a5a3f, 0x5e5f61, 0x7b3e2c, 0x3f4144, 0xa86a4c]
def primeiro_mix(m):
    """o Mix cuja entrada A (6) é a cor base constante (não ligada)"""
    for n in m.node_tree.nodes:
        if n.type == 'MIX' and not n.inputs[6].is_linked and n.inputs[7].is_linked: return n
out = {}
for i, hx in enumerate(WC):
    m = M.get(f"BLV_Casa_Parede_{i}")
    if not m: continue
    c = srgb(hx); k = .55; c = [c[0]*k, c[1]*k, c[2]*k, 1.]; m['blv_cor'] = srgb(hx)
    n = primeiro_mix(m)
    if n: n.inputs[6].default_value = c; out[m.name] = [round(v, 3) for v in c[:3]]
for i, hx in enumerate(RC):
    m = M.get(f"BLV_Casa_Telhado_{i}")
    if not m: continue
    c = srgb(hx); m['blv_cor'] = c
    n = primeiro_mix(m)
    if n: n.inputs[6].default_value = c; out[m.name] = [round(v, 3) for v in c[:3]]
result = out
