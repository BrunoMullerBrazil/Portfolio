# Realismo 26: quintal com árvore em parte das casas (bairro real tem copa entre os telhados) e grama com mais
# variação (terra batida e capim seco em manchas). Rodar depois de 23 + blender_bairro.py.
import bpy, math, random
from mathutils import Vector
scn = bpy.data.scenes["Boulevard"]; rng = random.Random(91)
CV = bpy.data.collections["BLV_Vegetacao"]
for o in list(CV.objects):
    if o.name.startswith("BLV_arv_quintal"): bpy.data.objects.remove(o, do_unlink=True)
spec = [("tree_small_02", (1.2, 2.0)), ("island_tree_01", (1.1, 1.8)), ("island_tree_02", (1.3, 2.1))]
n = 0
for ob in [o for o in scn.objects if o.name.startswith("BLV_casas_parede_")]:
    V = [ob.matrix_world@v.co for v in ob.data.vertices]
    for k in range(0, len(V), 8):
        p0, p1, p2 = V[k], V[k+1], V[k+2]; c = (p0+p2)/2
        if c.xy.length > 650 or rng.random() > .32: continue
        u = (p1-p0).normalized(); nn = (p2-p1).normalized(); d = (p2-p1).length
        q = c+nn*(d/2+rng.uniform(2.5, 5.))+u*rng.uniform(-3, 3)        # fundo do lote
        m, (s0, s1) = rng.choice(spec)
        e = bpy.data.objects.new(f"BLV_arv_quintal_{n:04d}", None); e.instance_type = 'COLLECTION'
        e.instance_collection = bpy.data.collections[f"{m}_LOD1"]; s = rng.uniform(s0, s1)
        e.location = (q.x, q.y, p0.z); e.scale = (s, s, s); e.rotation_euler[2] = rng.random()*6.28; CV.objects.link(e); n += 1
# grama: manchas de terra batida e capim seco (escala de lote)
tm = bpy.data.materials["BLV_Terreno"].node_tree
gr = [x for x in tm.nodes if x.type == 'VALTORGB'][0]
if 'SECO' not in tm.nodes:
    geo = [x for x in tm.nodes if x.type == 'NEW_GEOMETRY'][0]
    nz = tm.nodes.new('ShaderNodeTexNoise'); nz.name = 'SECO'; nz.inputs['Scale'].default_value = .045; nz.inputs['Detail'].default_value = 8.
    tm.links.new(geo.outputs['Position'], nz.inputs['Vector'])
    tgt = [l.to_socket for l in tm.links if l.from_node == gr]
    mx = tm.nodes.new('ShaderNodeMix'); mx.data_type = 'RGBA'
    mr = tm.nodes.new('ShaderNodeMapRange'); mr.inputs['From Min'].default_value = .55; mr.inputs['From Max'].default_value = .72
    mr.inputs['To Max'].default_value = .55; tm.links.new(nz.outputs['Fac'], mr.inputs['Value']); tm.links.new(mr.outputs[0], mx.inputs['Factor'])
    ins = [x for x in mx.inputs if x.type == 'RGBA']; tm.links.new(gr.outputs[0], ins[0]); ins[1].default_value = (.16, .13, .075, 1)
    for s_ in tgt: tm.links.new([x for x in mx.outputs if x.type == 'RGBA'][0], s_)
result = {"arvores_quintal": n}
