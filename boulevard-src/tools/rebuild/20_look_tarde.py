# Realismo 20: look "fim de tarde" (sol baixo a oeste batendo na fachada da frente, sombra real, céu físico).
# Alterna com o look do heroi_v3 (crepúsculo): bpy.app.driver_namespace['blv_look']('tarde'|'v3').
import bpy, math
from mathutils import Vector
scn = bpy.data.scenes["Boulevard"]
wn = scn.world.node_tree; N = wn.nodes
bg = [n for n in N if n.type == 'BACKGROUND'][0]
env = [n for n in N if n.type == 'TEX_ENVIRONMENT'][0]
sky = N.get("BLV_SKY")
sun = scn.objects["BLV_Sol"]
def sdir(az, el):
    az, el = math.radians(az), math.radians(el)
    return Vector((-math.cos(az)*math.cos(el), math.sin(az)*math.cos(el), math.sin(el)))
def look(nome, az=246., el=13.):
    it = bpy.data.materials["BLV_Interior"].node_tree
    if nome == 'tarde':
        d = sdir(az, el)
        sky.sky_type = 'MULTIPLE_SCATTERING' if 'MULTIPLE_SCATTERING' in [i.identifier for i in sky.bl_rna.properties['sky_type'].enum_items] else 'NISHITA'
        sky.sun_disc = False; sky.sun_elevation = math.radians(el); sky.sun_rotation = math.atan2(d.y, d.x)-math.pi/2
        for k, v in (('altitude', 30.), ('air_density', 1.), ('aerosol_density', 1.4), ('ozone_density', 1.)):
            if hasattr(sky, k): setattr(sky, k, v)
        wn.links.new(sky.outputs[0], bg.inputs['Color']); bg.inputs['Strength'].default_value = .55
        sun.hide_render = False; sun.rotation_euler = d.to_track_quat('Z', 'Y').to_euler()
        sun.data.energy = 4.2; sun.data.angle = math.radians(.6); sun.data.color = (1., .80, .62)
        it.nodes["LIGHTS"].outputs[0].default_value = 1.; it.nodes["GATE"].inputs[1].default_value = .25
        vs = scn.view_settings; vs.view_transform = 'AgX'; vs.look = 'AgX - Medium High Contrast'; vs.exposure = .35; vs.use_white_balance = False
        lg = bpy.data.materials.get("BLV_Luminaria_Luz")
        if lg: lg.node_tree.nodes['Principled BSDF'].inputs['Emission Strength'].default_value = 0.
        for o in scn.objects:
            if o.name.startswith("BLV_luz_poste"): o.hide_render = True
    else:   # v3 (crepúsculo, capa)
        wn.links.new(env.outputs[0], bg.inputs['Color']); bg.inputs['Strength'].default_value = .30
        sun.hide_render = True
        it.nodes["LIGHTS"].outputs[0].default_value = 1.; it.nodes["GATE"].inputs[1].default_value = .55
        vs = scn.view_settings; vs.view_transform = 'AgX'; vs.look = 'AgX - Medium High Contrast'; vs.exposure = 1.6; vs.use_white_balance = False
        lg = bpy.data.materials.get("BLV_Luminaria_Luz")
        if lg: lg.node_tree.nodes['Principled BSDF'].inputs['Emission Strength'].default_value = 30.
        for o in scn.objects:
            if o.name.startswith("BLV_luz_poste"): o.hide_render = False
    scn["blv_look"] = nome
bpy.app.driver_namespace['blv_look'] = look
look(globals().get("LOOK", "tarde"))
result = {"look": scn["blv_look"]}
