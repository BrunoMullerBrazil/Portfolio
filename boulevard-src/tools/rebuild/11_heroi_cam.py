# Remontagem 11 (turno 78): câmera do quadro herói = órbita baixa a 40°, lente 30. Rodar DEPOIS de blender_realismo.py
# e ANTES de blender_realismo2.py (as moitas do primeiro plano são espalhadas na frente da câmera ativa).
import bpy, math, os
scn = bpy.data.scenes["Boulevard"]; cam = scn.objects["BLV_Cam_Orbita"]; cd = cam.data; tg = scn.objects["BLV_Orbita_Alvo"]
for c in list(cam.constraints): cam.constraints.remove(c)
A, Bb, Z, ZC = 172., 150., 14., 25.; cx, cy = tg.location.x, tg.location.y; mx, my = -80., 66.; am = math.atan2(my-cy, mx-cx)
deg = 40; a = math.radians(deg-90); da = math.atan2(math.sin(a-am), math.cos(a-am)); k = 1+.5*math.exp(-(da/math.radians(32))**2)
x = cx+A*k*math.cos(a); y = cy+Bb*k*math.sin(a); cam.location = (x, y, Z); cam.rotation_euler = (math.radians(90), 0, math.atan2(cy-y, cx-x)-math.radians(90))
cd.lens = 30; cd.shift_y = (cd.lens*((ZC-Z)/math.hypot(cx-x, cy-y)))/36
scn.camera = cam; scn.view_layers[0].material_override = None; scn.render.film_transparent = False; scn.render.image_settings.color_mode = 'RGB'
scn.cycles.filter_width = 1.5; scn.render.dither_intensity = 1.
for h in list(bpy.app.handlers.render_complete):
    if getattr(h, '__name__', '') == 'on_done': bpy.app.handlers.render_complete.remove(h)
result = {"cam": [round(v, 1) for v in cam.location]}
