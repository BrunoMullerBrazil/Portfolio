# Realismo 25: câmeras aéreas de masterplan (3/4, como as referências). AEREA = ampla (bairro), AEREA_P = próxima (torres).
import bpy, math
from mathutils import Vector
scn = bpy.data.scenes["Boulevard"]; C = bpy.data.collections["BLV_Entorno"]
def cam(nome, tgt, az, dist, h, lens):
    cd = bpy.data.cameras.get(nome) or bpy.data.cameras.new(nome); cd.lens = lens; cd.sensor_width = 36; cd.clip_end = 12000
    o = scn.objects.get(nome) or bpy.data.objects.new(nome, cd)
    if not o.users_collection: C.objects.link(o)
    t = Vector(tgt); a = math.radians(az); o.location = t+Vector((math.cos(a)*dist, math.sin(a)*dist, h))
    o.rotation_euler = (t-o.location).to_track_quat('-Z', 'Y').to_euler(); return o
cam("BLV_Cam_Aerea", (0, 30, 8), -125, 420, 230, 32)
cam("BLV_Cam_Aerea_P", (0, 8, 12), -125, 230, 115, 40)
result = {"ok": True}
