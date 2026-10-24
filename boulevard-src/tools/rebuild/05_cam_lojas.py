# Remontagem 05 (turno 51): câmera na calçada em frente às lojas, altura dos olhos, enquadramento da página do book.
import bpy, math
from mathutils import Vector
scn = bpy.data.scenes["Boulevard"]; SITE = .1015
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
L, a, b, u, n = max(E, key=lambda e: e[0]); mid = (a+b)/2
cd = bpy.data.cameras.get("BLV_Cam_Lojas") or bpy.data.cameras.new("BLV_Cam_Lojas")
cam = scn.objects.get("BLV_Cam_Lojas") or bpy.data.objects.new("BLV_Cam_Lojas", cd)
if not cam.users_collection: bpy.data.collections["BLV_Entorno"].objects.link(cam)
pos = mid+n*24+u*(-6); cam.location = (pos.x, pos.y, 1.7)
tgt = mid+u*2; d = Vector((tgt.x-pos.x, tgt.y-pos.y))
cam.rotation_euler = (math.radians(90), 0, math.atan2(d.y, d.x)-math.radians(90))
cd.lens = 24; cd.sensor_width = 36; cd.shift_y = (24*((5.5-1.7)/d.length))/36; cd.clip_end = 8000
result = {"cam": [round(c, 1) for c in cam.location]}
