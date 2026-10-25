# Fotos cinematográficas (25/out). Cria as câmeras; o look e o modo de vegetação mudam por foto:
#   1  BLV_Foto_1_Rotula  30 mm, olho a 1,25 m na borda do espelho d'água, torres refletidas  → look 'tarde', árvores 'perto'
#   3  BLV_Foto_3_Torre   24 mm, contra-plongée a 1,3 m em frente à torre A, folhas em primeiro plano → 'tarde', 'perto'
#   5  BLV_Foto_5_Drone   28 mm, drone a 95 m, hora azul com janelas acesas → look 'v3', árvores 'aerea'
# Uso: exec este arquivo, depois ns['foto'](1|3|5, pct=100, spp=128). Depois de renderizar: ns['blv_look']('tarde'),
# exec 33, ns['blv_arvores']('aerea') para voltar ao estado da aérea.
import bpy, os
from mathutils import Vector
from mathutils.bvhtree import BVHTree
scn = bpy.data.scenes["Boulevard"]; ns = bpy.app.driver_namespace
TER = scn.objects["BLV_terreno"]; bv = BVHTree.FromObject(TER, bpy.context.evaluated_depsgraph_get(), deform=False)
mw = TER.matrix_world; mi = mw.inverted(); dl = (mi.to_3x3()@Vector((0, 0, -1))).normalized()
def chao(x, y):
    l, *_ = bv.ray_cast(mi@Vector((x, y, 3000.)), dl); return (mw@l).z if l else 0.
def cam(nome, pos, alvo, lens):
    c = scn.objects.get(nome)
    if not c:
        c = bpy.data.objects.new(nome, bpy.data.cameras.new(nome)); scn.collection.objects.link(c)
    c.data.lens = lens; c.data.sensor_width = 36; c.data.clip_end = 8000
    c.location = Vector(pos); c.rotation_euler = (Vector(alvo)-Vector(pos)).to_track_quat('-Z', 'Y').to_euler(); return c
FOTOS = {1: ("BLV_Foto_1_Rotula", (113, -97, 1.25), (-15, 8, 16), 30, 'tarde', 'perto'),
         3: ("BLV_Foto_3_Torre", (-18, -30, 1.3), (-30, 10, 32), 24, 'tarde', 'perto'),
         5: ("BLV_Foto_5_Drone", (70, -160, 95), (-25, 20, 12), 28, 'v3', 'aerea')}
for k, (nm, p, a, l, *_r) in FOTOS.items():
    z = 0 if k == 5 else chao(p[0], p[1]); cam(nm, (p[0], p[1], p[2]+z), a, l)
def foto(k, pct=100, spp=128):
    nm, p, a, l, look, arv = FOTOS[k]
    if 'blv_look' in ns: ns['blv_look'](look)
    if 'blv_arvores' in ns: ns['blv_arvores'](arv)
    scn.camera = scn.objects[nm]; scn.render.resolution_percentage = pct; scn.cycles.samples = spp
    scn.render.filepath = os.path.expanduser(f"~/Movies/Boulevard_3D/checkpoints/foto{k}_final.png")
    bpy.ops.render.render('INVOKE_DEFAULT', write_still=True)
ns['foto'] = foto
result = dict(cameras=[v[0] for v in FOTOS.values()])
