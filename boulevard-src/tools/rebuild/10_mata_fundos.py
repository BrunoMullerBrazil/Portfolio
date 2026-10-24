# Remontagem 10 (turno 69): faixa de ~320 árvores nos fundos (entre o muro e o bairro), primeiro plano da órbita baixa.
import bpy, random
from mathutils import Vector
C = bpy.data.collections["BLV_Vegetacao"]
for o in list(C.objects):
    if o.name.startswith("BLV_arv_fundos"): bpy.data.objects.remove(o, do_unlink=True)
rng = random.Random(12); n = 0; tries = 0
cols = [("island_tree_01", (1.7, 2.6)), ("island_tree_02", (2.2, 3.2)), ("tree_small_02", (1.8, 2.6))]
mosto = Vector((-80., 66.))
while n < 320 and tries < 6000:
    tries += 1
    x = rng.uniform(-175, 175); y = rng.uniform(46, 150)
    if (Vector((x, y))-mosto).length < 22: continue
    if rng.random() > .75 and y < 70: continue
    m, (s0, s1) = rng.choice(cols)
    e = bpy.data.objects.new(f"BLV_arv_fundos_{n:03d}", None); e.instance_type = 'COLLECTION'; e.instance_collection = bpy.data.collections[f"{m}_LOD1"]
    s = rng.uniform(s0, s1); e.location = (x, y, 0); e.scale = (s, s, s*rng.uniform(.9, 1.15)); e.rotation_euler[2] = rng.random()*6.28; C.objects.link(e); n += 1
result = {"fundos_trees": n}
