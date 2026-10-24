# Remontagem 06 (turno 55, passos 1-2): volume/muro em reboco branco liso, vitrines transparentes, interior das lojas quente,
# letreiros maiores e câmera das lojas em diagonal, do lado oposto ao volume baixo (enquadramento do book).
import bpy, math
from mathutils import Vector
scn = bpy.data.scenes["Boulevard"]
for nd in bpy.data.materials["BLV_Muro"].node_tree.nodes:
    if nd.type == 'MIX': nd.inputs['Factor'].default_value = 0.
g = bpy.data.materials["BLV_Vidro_Loja"].node_tree
for n in g.nodes:
    if n.type == 'BSDF_TRANSPARENT': n.inputs[0].default_value = (.55, .6, .62, 1)
    if n.type == 'BSDF_GLOSSY': n.inputs['Color'].default_value = (.55, .55, .55, 1)
si = bpy.data.materials["BLV_Loja_Interior"]
em = [n for n in si.node_tree.nodes if n.type == 'EMISSION'][0]; em.inputs['Strength'].default_value = 1.4; em.inputs['Color'].default_value = (1., .85, .68, 1)
for o in bpy.data.collections["BLV_Vitrines"].objects:
    if o.type == 'FONT': o.data.size = .19
cam = scn.objects["BLV_Cam_Lojas"]; cd = cam.data; SITE = .1015
def S(x, y): return ((x-1250)*SITE, (y-400)*SITE)
poly = [[255,352],[487,300],[487,140],[675,95],[830,82],[830,232],[678,232],[678,380],[525,418],[275,455]]
PB = [Vector((p[0], -p[1])) for p in (S(*q) for q in poly)]
def inside(x, y, p):
    c = False; j = len(p)-1
    for i in range(len(p)):
        if ((p[i][1] > y) != (p[j][1] > y)) and (x < (p[j][0]-p[i][0])*(y-p[i][1])/(p[j][1]-p[i][1])+p[i][0]): c = not c
        j = i
    return c
E = []
for i in range(len(PB)):
    a, b = PB[i], PB[(i+1) % len(PB)]; L = (b-a).length; u = (b-a)/L; n = Vector((u.y, -u.x))
    if inside(*((a+b)/2+n), PB): n = -n
    E.append((L, a, b, u, n))
L, a, b, u, n = max(E, key=lambda e: e[0])
a3, b3 = S(372, 458), S(495, 525); vc = Vector(((a3[0]+b3[0])/2, -(a3[1]+b3[1])/2))
side = 1 if ((vc-(a+b)/2).dot(u)) < 0 else -1; mid = (a+b)/2
pos = mid+n*22+u*side*16; tgt = mid+u*side*1.0
cam.location = (pos.x, pos.y, 1.7); d = Vector((tgt.x-pos.x, tgt.y-pos.y))
cam.rotation_euler = (math.radians(90), 0, math.atan2(d.y, d.x)-math.radians(90))
cd.lens = 26; cd.shift_y = (26*((5.0-1.7)/d.length))/36
result = {"side": side}
