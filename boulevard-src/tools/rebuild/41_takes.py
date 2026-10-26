# Takes de filme (26/out). Cada take = câmera BLV_Take_<k> + alvo BLV_Take_<k>_alvo (Track To), animados no
# intervalo 1..N. Fluxo: ns['take_animatic'](lista) renderiza prévias rápidas em EEVEE (960×540, 12 fps, mp4) para
# aprovar o movimento; ns['take_final'](lista) renderiza Cycles 1920×1080, 24 fps, sequência PNG (segura contra crash).
# Geometria de referência: torres A (x -58..-5) e B (5..58), fachada principal y≈2 voltada para -y (avenida y≈-45..-55),
# altura 49 m; praça ao sul da avenida (y -55..-150); rótula (-96,-35).
import bpy, os, math, random
from mathutils import Vector
scn = bpy.data.scenes["Boulevard"]; ns = bpy.app.driver_namespace
OUT = os.path.expanduser("~/Movies/Boulevard_3D/takes"); os.makedirs(OUT, exist_ok=True)
chao = ns['chao']
def P(x, y, h): return (x, y, chao(x, y)+h)
# chaves: (frame, posição da câmera, ponto olhado); lente; look; árvores; extras
TAKES = {
  "01_chegada":   dict(lens=35, look='noite', arv='perto', fim=144, f=4.0, foco='alvo',
                       k=[(1, P(0, -112, 1.6), (0, 10, 19)), (144, P(0, -70, 1.6), (0, 10, 23))],
                       nota="caminhada da praça em direção às torres, hora azul, janelas acendendo no quadro"),
  "02_revelacao": dict(lens=28, look='tarde', arv='perto', fim=168, f=5.6, foco='alvo',
                       k=[(1, P(-22, -66, 1.2), (-22, -40, 3)), (60, P(-22, -66, 4.), (-16, -10, 12)), (168, P(-22, -68, 15.), (-8, 10, 25))],
                       nota="grua subindo por trás das palmeiras da praça e revelando as torres no sol de fim de tarde"),
  "03_lateral":   dict(lens=50, look='tarde', arv='perto', fim=192, f=4.0, foco='alvo',
                       k=[(1, P(-62, -52, 1.5), (-62, 10, 20)), (192, P(38, -52, 1.5), (38, 10, 20))],
                       nota="travelling lateral pela avenida, foco travado na fachada, palmeiras e carros passando em primeiro plano"),
  "04_afastamento": dict(lens=28, look='noite', arv='aerea', fim=192, f=8.0, foco='alvo',
                       k=[(1, (30, -22, 30), (30, 10, 28)), (70, (36, -60, 45), (20, 10, 24)), (192, (70, -165, 98), (-12, 18, 14))],
                       nota="drone recuando da fachada da torre B e subindo até mostrar o bairro aceso"),
  "05_orbita":    dict(lens=35, look='tarde', arv='aerea', fim=240, f=11., foco='alvo', orbita=dict(c=(0, 10, 18), r=155, h=62, a0=-150, a1=-55),
                       nota="órbita de drone de 95° em volta das duas torres no sol baixo"),
  "06_chuva":     dict(lens=24, look='chuva', arv='perto', fim=144, f=5.6, foco='alvo',
                       k=[(1, P(12, -76, 1.6), (0, 8, 20)), (144, P(12, -58, 1.6), (0, 8, 22))],
                       nota="aproximação lenta na chuva, asfalto molhado refletindo as janelas e o térreo"),
  "07_timelapse": dict(lens=30, look='tarde', arv='perto', fim=192, f=8.0, foco='alvo', sol=(32., -3.),
                       k=[(1, P(113, -97, 1.25), (-15, 8, 16)), (192, P(111, -96.5, 1.25), (-15, 8, 16.5))],
                       nota="câmera quase parada no espelho d'água; o sol desce de 32° até abaixo do horizonte e as janelas acendem"),
  "08_racking":   dict(lens=85, look='tarde', arv='perto', fim=144, f=2.0, foco=('rack', 5., 75.),
                       k=[(1, P(-24, -63, 1.7), (-28, 10, 30)), (144, P(-23.4, -63, 1.75), (-28, 10, 30.5))],
                       nota="85 mm: foco puxa da folhagem da praça em primeiro plano para as janelas da torre A"),
}
def take_cam(k):
    T = TAKES[k]; nm = f"BLV_Take_{k}"
    cam = scn.objects.get(nm)
    if not cam: cam = bpy.data.objects.new(nm, bpy.data.cameras.new(nm)); scn.collection.objects.link(cam)
    alvo = scn.objects.get(nm+"_alvo")
    if not alvo: alvo = bpy.data.objects.new(nm+"_alvo", None); scn.collection.objects.link(alvo)
    for o in (cam, alvo): o.animation_data_clear()
    cam.data.animation_data_clear()
    cam.data.lens = T['lens']; cam.data.sensor_width = 36; cam.data.clip_end = 9000
    for c in list(cam.constraints): cam.constraints.remove(c)
    tc = cam.constraints.new('TRACK_TO'); tc.target = alvo; tc.track_axis = 'TRACK_NEGATIVE_Z'; tc.up_axis = 'UP_Y'
    if 'orbita' in T:
        o = T['orbita']; c = Vector(o['c']); n = T['fim']
        for f in range(1, n+1, 6):
            t = (f-1)/(n-1); t = t*t*(3-2*t); a = math.radians(o['a0']+(o['a1']-o['a0'])*t)
            cam.location = c+Vector((math.cos(a)*o['r'], math.sin(a)*o['r'], o['h'])); cam.keyframe_insert("location", frame=f)
        alvo.location = c; alvo.keyframe_insert("location", frame=1)
    else:
        for f, p, a in T['k']:
            cam.location = p; cam.keyframe_insert("location", frame=f)
            alvo.location = a; alvo.keyframe_insert("location", frame=f)
    for o in (cam, alvo):
        if o.animation_data and o.animation_data.action:
            for fc in o.animation_data.action.fcurves:
                for kp in fc.keyframe_points: kp.interpolation = 'BEZIER'; kp.easing = 'AUTO'
    d = cam.data.dof; d.use_dof = True; d.aperture_fstop = T['f']
    if T['foco'] == 'alvo': d.focus_object = alvo
    else:
        d.focus_object = None; _, a0, a1 = T['foco']
        d.focus_distance = a0; d.keyframe_insert("focus_distance", frame=1)
        d.focus_distance = a0; d.keyframe_insert("focus_distance", frame=36)
        d.focus_distance = a1; d.keyframe_insert("focus_distance", frame=96)
    return cam
# ---------- estado da cena por take ----------
def chuva_take(k, cam):
    """gotas geradas no frustum do frame 1 e presas à câmera; caem no eixo vertical da tela (Y local) a ~9 m/s,
    em ciclo de 1,5 m (o campo é aleatório, o ciclo não aparece). Sem reconstruir malha durante o render."""
    scn.frame_set(1); bpy.context.view_layer.update()
    ns['blv_chuva_cam'](cam.name, n=18000, dmin=3., dmax=35.)
    ch = scn.objects["BLV_chuva"]; ch.animation_data_clear()
    mw = ch.matrix_world.copy(); ch.parent = cam; ch.matrix_parent_inverse = cam.matrix_world.inverted(); ch.matrix_world = mw
    y0 = ch.location.y
    for f in range(1, TAKES[k]['fim']+1):
        ch.location.y = y0-((f-1)*.375) % 1.5; ch.keyframe_insert("location", index=1, frame=f)
    for fc in ch.animation_data.action.fcurves:
        for kp in fc.keyframe_points: kp.interpolation = 'CONSTANT'
    ch.hide_render = False
def _sol(scene, *a):
    k = scn.get('blv_take_atual')
    if k and 'sol' in TAKES[k]:
        e0, e1 = TAKES[k]['sol']; t = (scene.frame_current-1)/max(1, TAKES[k]['fim']-1); el = e0+(e1-e0)*t
        ns['blv_look']('tarde', 246., max(el, -2.))
        it = bpy.data.materials["BLV_Interior"].node_tree.nodes
        it["GATE"].inputs[1].default_value = .05+.27*min(1, max(0, (8.-el)/9.))   # janelas acendem perto do pôr do sol
        bpy.data.scenes["Boulevard"].view_settings.exposure = .05+1.2*min(1, max(0, (6.-el)/9.))
for h in list(bpy.app.handlers.frame_change_pre):
    if getattr(h, '__name__', '') in ('_rain', '_sol'): bpy.app.handlers.frame_change_pre.remove(h)
bpy.app.handlers.frame_change_pre.append(_sol)
def prep(k):
    T = TAKES[k]; scn['blv_take_atual'] = k
    if 'blv_seco' in ns: ns['blv_seco']()
    if T['look'] == 'noite': ns['blv_look_noite']()
    elif T['look'] == 'chuva': ns['blv_look_chuva'](exp=1.5)
    else:
        ns['blv_look']('tarde')
        bpy.data.scenes["Boulevard"].view_settings.exposure = .05
    ns['blv_arvores'](T['arv'])
    for n in ("BLV_vidro_gotas",):
        o = scn.objects.get(n)
        if o: o.hide_render = True
    ch = scn.objects.get("BLV_chuva")
    if ch: ch.hide_render = T['look'] != 'chuva'
    if T['look'] != 'chuva' and ch: ch.hide_render = True
    cam = take_cam(k); scn.camera = cam
    scn.frame_start = 1; scn.frame_end = T['fim']
    if T['look'] == 'chuva': chuva_take(k, cam)
    elif ch: ch.hide_render = True
    return cam
# ---------- fila de render ----------
FILA = []
def _proximo(*a):
    if not FILA:
        scn['blv_take_atual'] = ""; open(os.path.join(OUT, "FILA_PRONTA.txt"), "w").write("ok"); return
    k, modo = FILA.pop(0); prep(k); r = scn.render
    r.fps = 24; r.fps_base = 1; r.use_motion_blur = True; r.motion_blur_shutter = .5
    if modo == 'animatic':
        r.engine = 'BLENDER_EEVEE' if 'BLENDER_EEVEE' in [e.identifier for e in bpy.types.RenderSettings.bl_rna.properties['engine'].enum_items] else 'BLENDER_EEVEE_NEXT'
        r.resolution_x, r.resolution_y, r.resolution_percentage = 1920, 1080, 50
        scn.frame_step = 2; r.fps = 12
        r.image_settings.file_format = 'FFMPEG'; r.ffmpeg.format = 'MPEG4'; r.ffmpeg.codec = 'H264'; r.ffmpeg.constant_rate_factor = 'MEDIUM'
        r.filepath = os.path.join(OUT, f"animatic_{k}_")
    else:
        r.engine = 'CYCLES'; scn.cycles.samples = 64; scn.cycles.use_denoising = True
        r.resolution_x, r.resolution_y, r.resolution_percentage = 1920, 1080, 100; scn.frame_step = 1
        r.image_settings.file_format = 'PNG'; r.image_settings.color_mode = 'RGB'
        d = os.path.join(OUT, f"final_{k}"); os.makedirs(d, exist_ok=True); r.filepath = os.path.join(d, "f_")
    r.use_stamp = False; r.use_file_extension = True
    bpy.app.timers.register(lambda: (bpy.ops.render.render('INVOKE_DEFAULT', animation=True), None)[1], first_interval=1.)
def _fim_anim(*a):
    bpy.app.timers.register(lambda: (_proximo(), None)[1], first_interval=2.)
for h in list(bpy.app.handlers.render_complete):
    if getattr(h, '__name__', '') in ('_fim_anim',): bpy.app.handlers.render_complete.remove(h)
bpy.app.handlers.render_complete.append(_fim_anim)
def fila(lista, modo):
    for h in list(bpy.app.handlers.render_complete):   # o helper de still (fim_ck) não pode rodar no meio da fila
        if getattr(h, '__name__', '') == 'fim_ck': bpy.app.handlers.render_complete.remove(h)
    p = os.path.join(OUT, "FILA_PRONTA.txt")
    if os.path.exists(p): os.remove(p)
    FILA[:] = [(k, modo) for k in lista]; _proximo()
    return [k for k, _ in FILA]
ns['take_prep'] = prep; ns['take_animatic'] = lambda lista=None: fila(lista or list(TAKES), 'animatic')
ns['take_final'] = lambda lista: fila(lista, 'final'); ns['takes'] = TAKES
result = dict(takes={k: v['nota'] for k, v in TAKES.items()})
