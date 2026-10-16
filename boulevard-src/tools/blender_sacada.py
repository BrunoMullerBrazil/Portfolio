# Boulevard em 3D -> vista da sacada para dentro do apartamento (tipologia azul, finais 03/06/09–12)
# Base: modelo do B112 (b112-source.html) exportado como GLB; cena "Sacada" dentro do boulevard.blend.
# Luz: céu físico (Nishita) + sol calculado para Pedra Branca/Palhoça, data e hora definidas em PARAMS.
import bpy, os, math, json, urllib.request, ssl
from mathutils import Vector

PARAMS = bpy.app.driver_namespace.get("blv_sacada", {})
DIA = PARAMS.get("dia", (5, 1))        # (mês, dia) — 1º de maio, mês da entrega
HORA = PARAMS.get("hora", 9.0)          # hora local (UTC-3)
FACHADA_AZ = PARAMS.get("az", 57.)      # azimute para onde a fachada olha (fundos: ~57°, nascente)
LAT, LON, TZ = -27.61, -48.70, -3
D = os.path.expanduser("~/Movies/Boulevard_3D/sacada"); A = os.path.expanduser("~/Movies/Boulevard_3D/assets")
ctx = ssl._create_unverified_context()

def sol(mes, dia, hora):
    n = sum((31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31)[:mes-1]) + dia
    g = 2*math.pi/365*(n-1+(hora-12)/24)
    eot = 229.18*(.000075+.001868*math.cos(g)-.032077*math.sin(g)-.014615*math.cos(2*g)-.040849*math.sin(2*g))
    dec = .006918-.399912*math.cos(g)+.070257*math.sin(g)-.006758*math.cos(2*g)+.000907*math.sin(2*g)-.002697*math.cos(3*g)+.00148*math.sin(3*g)
    tst = hora*60+eot+4*LON-60*TZ; ha = math.radians(tst/4-180); la = math.radians(LAT)
    ce = math.sin(la)*math.sin(dec)+math.cos(la)*math.cos(dec)*math.cos(ha); el = math.asin(ce)
    az = math.degrees(math.atan2(math.sin(ha), math.cos(ha)*math.sin(la)-math.tan(dec)*math.cos(la)))+180
    return math.degrees(el), az % 360

# ---------- cena ----------
S = bpy.data.scenes.get("Sacada") or bpy.data.scenes.new("Sacada")
w = bpy.context.window_manager.windows[0]; w.scene = S
C = bpy.data.collections.get("SAC_modelo")
fresh = C is None or not C.objects
if C is None:
    C = bpy.data.collections.new("SAC_modelo"); S.collection.children.link(C)

def pbr_img(name, path, cs='sRGB'):
    im = bpy.data.images.get(name) or bpy.data.images.load(path); im.colorspace_settings.name = cs; return im

def baixa(pid, maps=("diff", "rough", "nor_gl")):
    os.makedirs(f"{A}/tex/{pid}", exist_ok=True); out = {}
    for m in maps:
        p = f"{A}/tex/{pid}/{pid}_{m}_2k.jpg"
        if not os.path.exists(p):
            u = f"https://dl.polyhaven.org/file/ph-assets/Textures/jpg/2k/{pid}/{pid}_{m}_2k.jpg"
            open(p, "wb").write(urllib.request.urlopen(u, context=ctx, timeout=60).read())
        out[m] = p
    return out

if fresh:
    with bpy.context.temp_override(window=w, scene=S):
        before = set(bpy.data.objects)
        bpy.ops.import_scene.gltf(filepath=f"{D}/b112.glb")
        new = [o for o in bpy.data.objects if o not in before]
    for o in new:
        for c in list(o.users_collection): c.objects.unlink(o)
        if o.type == 'LIGHT': bpy.data.objects.remove(o, do_unlink=True)
        else: C.objects.link(o)

objs = [o for o in C.objects if o.type == 'MESH' and not o.name.startswith('SAC_')]
mats = {m.name: m for o in objs for m in o.data.materials if m}

# ---------- materiais ----------
def bsdf(m): return next(n for n in m.node_tree.nodes if n.type == 'BSDF_PRINCIPLED')
# piso de madeira real
fl = baixa("wood_floor")
for name, m in mats.items():
    if not name.startswith("tex_90633e") or m.node_tree.nodes.get("PISO_OK"): continue
    nt = m.node_tree; b = bsdf(m); nt.nodes.new('NodeFrame').name = "PISO_OK"
    tc = nt.nodes.new('ShaderNodeTexCoord'); mp = nt.nodes.new('ShaderNodeMapping'); mp.inputs['Scale'].default_value = (.55, .55, .55)
    nt.links.new(tc.outputs['Object'], mp.inputs['Vector'])
    for key, sock, cs in (("diff", 'Base Color', 'sRGB'), ("rough", 'Roughness', 'Non-Color')):
        t = nt.nodes.new('ShaderNodeTexImage'); t.image = pbr_img(os.path.basename(fl[key]), fl[key], cs); nt.links.new(mp.outputs[0], t.inputs[0])
        nt.links.new(t.outputs[0], b.inputs[sock])
    t = nt.nodes.new('ShaderNodeTexImage'); t.image = pbr_img(os.path.basename(fl["nor_gl"]), fl["nor_gl"], 'Non-Color'); nt.links.new(mp.outputs[0], t.inputs[0])
    nm = nt.nodes.new('ShaderNodeNormalMap'); nm.inputs['Strength'].default_value = .6; nt.links.new(t.outputs[0], nm.inputs['Color']); nt.links.new(nm.outputs[0], b.inputs['Normal'])
    b.inputs['Coat Weight'].default_value = .15; b.inputs['Coat Roughness'].default_value = .25
# paredes: textura sutil de reboco no relevo
for name, m in mats.items():
    if name.startswith(("tex_e9dfcf", "tex_3b4a2e")) or name.startswith("col_e9dfcf"):
        nt = m.node_tree; b = bsdf(m)
        if not nt.nodes.get("BUMPW"):
            nz = nt.nodes.new('ShaderNodeTexNoise'); nz.inputs['Scale'].default_value = 60.; nz.inputs['Detail'].default_value = 8.
            bp = nt.nodes.new('ShaderNodeBump'); bp.name = "BUMPW"; bp.inputs['Strength'].default_value = .05
            nt.links.new(nz.outputs['Fac'], bp.inputs['Height']); nt.links.new(bp.outputs[0], b.inputs['Normal'])
        b.inputs['Roughness'].default_value = .92
# vidro fino: deixa a luz do sol passar (sombra transparente) e reflete
for name, m in mats.items():
    if not name.startswith("col_ddeaf0"): continue
    nt = m.node_tree; nt.nodes.clear(); L = nt.links.new
    out = nt.nodes.new('ShaderNodeOutputMaterial'); lp = nt.nodes.new('ShaderNodeLightPath')
    gl = nt.nodes.new('ShaderNodeBsdfGlass'); gl.inputs['Roughness'].default_value = 0.; gl.inputs['IOR'].default_value = 1.45; gl.inputs['Color'].default_value = (.94, .97, .97, 1)
    tr = nt.nodes.new('ShaderNodeBsdfTransparent'); tr.inputs['Color'].default_value = (.9, .93, .93, 1)
    fr = nt.nodes.new('ShaderNodeLayerWeight'); fr.inputs['Blend'].default_value = .12
    gs = nt.nodes.new('ShaderNodeBsdfGlossy'); gs.inputs['Roughness'].default_value = 0.
    mx = nt.nodes.new('ShaderNodeMixShader'); L(fr.outputs['Fresnel'], mx.inputs[0]); L(tr.outputs[0], mx.inputs[1]); L(gs.outputs[0], mx.inputs[2])
    sw = nt.nodes.new('ShaderNodeMixShader'); L(lp.outputs['Is Camera Ray'], sw.inputs[0]); L(tr.outputs[0], sw.inputs[1]); L(mx.outputs[0], sw.inputs[2])
    L(sw.outputs[0], out.inputs['Surface']); m.blend_method = 'BLEND' if hasattr(m, 'blend_method') else None
# materiais "unlit" do export viram superfícies normais (tela da TV etc.)
for name, m in mats.items():
    nt = m.node_tree
    if any(n.type == 'EMISSION' for n in nt.nodes) and not any(n.type == 'BSDF_PRINCIPLED' for n in nt.nodes):
        col = next((n.inputs['Color'].default_value[:] for n in nt.nodes if n.type == 'EMISSION'), (.05, .05, .05, 1))
        nt.nodes.clear(); out = nt.nodes.new('ShaderNodeOutputMaterial'); b = nt.nodes.new('ShaderNodeBsdfPrincipled')
        b.inputs['Base Color'].default_value = col; b.inputs['Roughness'].default_value = .3; nt.links.new(b.outputs[0], out.inputs['Surface'])

# ---------- forro e laje da sacada de cima (o modelo é "casa de bonecas", sem teto) ----------
for n in ("SAC_forro", "SAC_laje_cima"):
    o = bpy.data.objects.get(n)
    if o: bpy.data.objects.remove(o, do_unlink=True)
xs = [(o.matrix_world @ Vector(c)).x for o in objs for c in o.bound_box]; ys = [(o.matrix_world @ Vector(c)).y for o in objs for c in o.bound_box]
H = 2.6
def laje(name, x0, x1, y0, y1, z0, z1, mat):
    bpy.ops.mesh.primitive_cube_add(size=1)
    o = bpy.context.active_object; o.name = name; o.scale = (x1-x0, y1-y0, z1-z0); o.location = ((x0+x1)/2, (y0+y1)/2, (z0+z1)/2)
    for c in list(o.users_collection): c.objects.unlink(o)
    C.objects.link(o); o.data.materials.append(mat); return o
mf = bpy.data.materials.get("SAC_Forro") or bpy.data.materials.new("SAC_Forro"); mf.use_nodes = True
bsdf(mf).inputs['Base Color'].default_value = (.86, .85, .82, 1); bsdf(mf).inputs['Roughness'].default_value = .95
with bpy.context.temp_override(window=w, scene=S):
    laje("SAC_forro", min(xs), max(xs), min(ys), max(ys), H, H+.14, mf)

# ---------- céu físico + sol ----------
el, az = sol(*DIA, HORA)
d = math.radians(az-FACHADA_AZ)          # ângulo do sol em relação à normal da fachada (+y local)
dirv = Vector((math.sin(d)*math.cos(math.radians(el)), math.cos(d)*math.cos(math.radians(el)), math.sin(math.radians(el))))
W = S.world or bpy.data.worlds.new("SAC_Ceu"); S.world = W; W.use_nodes = True; wn = W.node_tree; wn.nodes.clear()
sky = wn.nodes.new('ShaderNodeTexSky'); sky.sky_type = 'MULTIPLE_SCATTERING' if 'MULTIPLE_SCATTERING' in [i.identifier for i in sky.bl_rna.properties['sky_type'].enum_items] else 'NISHITA'
sky.sun_disc = False
for k, v in (('altitude', 40.), ('air_density', 1.), ('dust_density', 1.6), ('aerosol_density', 1.6)):
    if hasattr(sky, k): setattr(sky, k, v)
sky.sun_elevation = math.radians(max(el, -2.)); sky.sun_rotation = math.atan2(dirv.x, dirv.y)*-1 + math.pi/2
bg = wn.nodes.new('ShaderNodeBackground'); bg.inputs['Strength'].default_value = .35
wo = wn.nodes.new('ShaderNodeOutputWorld'); wn.links.new(sky.outputs[0], bg.inputs[0]); wn.links.new(bg.outputs[0], wo.inputs['Surface'])
sun = bpy.data.objects.get("SAC_Sol")
if not sun:
    sun = bpy.data.objects.new("SAC_Sol", bpy.data.lights.new("SAC_Sol", 'SUN')); S.collection.objects.link(sun)
sun.data.angle = math.radians(.53)
sun.rotation_euler = (-dirv).to_track_quat('-Z', 'Y').to_euler()
sun.data.energy = 0. if el <= 0 else 4.2*min(1., math.sin(math.radians(el))*2.2)
sun.data.color = (1., .80+.17*min(1, el/40), .62+.3*min(1, el/40))

# portais de luz nas janelas da fachada (acelera interior iluminado pelo céu)
for o in [o for o in S.objects if o.name.startswith("SAC_portal")]: bpy.data.objects.remove(o, do_unlink=True)
for i, (x, wdt, z0, z1) in enumerate(((46, 151, 1.0, 2.2), (302.5, 151, 1.0, 2.2), (529, 150, 0., 2.2))):
    ld = bpy.data.lights.new(f"SAC_portal{i}", 'AREA'); ld.shape = 'RECTANGLE'; ld.size = wdt/100; ld.size_y = z1-z0
    ld.cycles.is_portal = True; lo = bpy.data.objects.new(ld.name, ld)
    lo.location = ((x+wdt/2)/100-3.765, 2.85+.11+.02, (z0+z1)/2); lo.rotation_euler = (math.radians(-90), 0, 0)
    S.collection.objects.link(lo)

# ---------- câmera na sacada olhando para dentro ----------
cam = bpy.data.objects.get("SAC_Cam")
if not cam:
    cam = bpy.data.objects.new("SAC_Cam", bpy.data.cameras.new("SAC_Cam")); S.collection.objects.link(cam)
cam.data.lens = PARAMS.get("lente", 20.); cam.data.sensor_width = 36.
cam.location = Vector(PARAMS.get("cam", (2.10, 3.42, 1.42)))
alvo = Vector(PARAMS.get("alvo", (0.6, -1.6, 1.15)))
cam.rotation_euler = (alvo-cam.location).to_track_quat('-Z', 'Y').to_euler()
cam.data.shift_y = .04; cam.data.clip_start = .05
S.camera = cam

# ---------- render ----------
r = S.render; r.engine = 'CYCLES'; r.resolution_x, r.resolution_y = 1600, 900; r.resolution_percentage = 100
cy = S.cycles; cy.device = 'GPU'; cy.samples = PARAMS.get("amostras", 256); cy.use_denoising = True
cy.max_bounces = 12; cy.diffuse_bounces = 6; cy.glossy_bounces = 4; cy.transmission_bounces = 12; cy.transparent_max_bounces = 16
cy.sample_clamp_indirect = 8.; cy.caustics_reflective = False; cy.caustics_refractive = False
S.view_settings.view_transform = 'AgX'; S.view_settings.look = PARAMS.get("look", 'AgX - Medium High Contrast')
S.view_settings.exposure = PARAMS.get("exposicao", .6)
r.image_settings.file_format = 'PNG'
result = dict(sol_elev=round(el, 1), sol_az=round(az, 1), rel_fachada=round(az-FACHADA_AZ, 1), objetos=len(objs), materiais=len(mats))
