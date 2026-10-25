# Realismo 34: copas densas. As árvores de sombra de Poly Haven que temos (island_tree, tree_small) têm copa fina e
# aberta: de cima leem como arbusto seco. O acervo do Poly Haven não tem folhosa densa leve. Aqui: árvore procedural de
# copa fechada (tronco + 6–9 lóbulos deslocados por ruído, material de folhagem com bump de aglomerado de folhas),
# 3 variações, trocadas nas árvores de sombra da praça e nas do entorno do lote. Palmeiras e mata ficam como estão.
import bpy, bmesh, math, random
from mathutils import Vector, noise
rng = random.Random(34); M = bpy.data.materials
def mat_copa():
    m = M.get("BLV_Copa") or M.new("BLV_Copa"); m.use_nodes = True; nt = m.node_tree; nt.nodes.clear(); L = nt.links.new
    o = nt.nodes.new('ShaderNodeOutputMaterial'); b = nt.nodes.new('ShaderNodeBsdfPrincipled'); L(b.outputs[0], o.inputs[0])
    tc = nt.nodes.new('ShaderNodeTexCoord')
    vo = nt.nodes.new('ShaderNodeTexVoronoi'); vo.inputs['Scale'].default_value = 3.5; L(tc.outputs['Object'], vo.inputs['Vector'])
    nz = nt.nodes.new('ShaderNodeTexNoise'); nz.inputs['Scale'].default_value = .35; nz.inputs['Detail'].default_value = 3; L(tc.outputs['Object'], nz.inputs['Vector'])
    ob = nt.nodes.new('ShaderNodeObjectInfo')   # tom por árvore
    rp = nt.nodes.new('ShaderNodeValToRGB'); e = rp.color_ramp.elements
    e[0].color = (.014, .03, .01, 1); e[1].color = (.085, .11, .035, 1); e.new(.45).color = (.035, .065, .02, 1); e.new(.8).color = (.06, .08, .025, 1)
    mx = nt.nodes.new('ShaderNodeMath'); mx.operation = 'MULTIPLY_ADD'; mx.inputs[1].default_value = .5
    L(nz.outputs['Fac'], mx.inputs[0]); L(ob.outputs['Random'], mx.inputs[2])
    fr = nt.nodes.new('ShaderNodeMath'); fr.operation = 'FRACT'; L(mx.outputs[0], fr.inputs[0]); L(fr.outputs[0], rp.inputs['Fac'])
    ao = nt.nodes.new('ShaderNodeAmbientOcclusion'); ao.samples = 4; ao.inputs['Distance'].default_value = 2.5; L(rp.outputs['Color'], ao.inputs['Color'])
    L(ao.outputs['Color'], b.inputs['Base Color']); b.inputs['Roughness'].default_value = .62
    try: b.inputs['Subsurface Weight'].default_value = .08; b.inputs['Subsurface Radius'].default_value = (.4, .6, .2)
    except Exception: pass
    bp = nt.nodes.new('ShaderNodeBump'); bp.inputs['Strength'].default_value = .9; bp.inputs['Distance'].default_value = .4
    L(vo.outputs['Distance'], bp.inputs['Height']); L(bp.outputs[0], b.inputs['Normal'])
    return m
COPA = mat_copa()
TRONCO = M.get("BLV_Palmeira_Tronco") or M.new("BLV_Palmeira_Tronco")
def arvore(k):
    name = f"BLV_copa_densa_{k}"
    c = bpy.data.collections.get(name)
    if c:
        for o in list(c.objects): bpy.data.objects.remove(o, do_unlink=True)
    else: c = bpy.data.collections.new(name)
    r = random.Random(100+k); H = r.uniform(3.2, 4.2); R = r.uniform(3.2, 4.2)   # altura do fuste, raio da copa
    bm = bmesh.new()
    bmesh.ops.create_cone(bm, cap_ends=False, segments=7, radius1=.26, radius2=.16, depth=H+1.5)
    for v in bm.verts: v.co.z += (H+1.5)/2
    # 3 galhos principais
    for g in range(3):
        a = g*2.1+r.random(); d = Vector((math.cos(a), math.sin(a), 1.1)).normalized()
        gm = bmesh.ops.create_cone(bm, cap_ends=False, segments=5, radius1=.12, radius2=.05, depth=2.6)
        for v in gm['verts']:
            v.co = v.co.copy(); z = v.co.z+1.3; v.co.z = 0
            v.co = Vector((v.co.x, v.co.y, 0))+d*z+Vector((0, 0, H))
    tm = bpy.data.meshes.new(name+"_tronco"); bm.to_mesh(tm); bm.free(); tm.materials.append(TRONCO)
    c.objects.link(bpy.data.objects.new(name+"_tronco", tm))
    bm = bmesh.new(); n = r.randint(13, 18); zc = H+R*.7
    for i in range(n):
        if i == 0: p = Vector((0, 0, zc)); rr = R*.6
        else:
            a = r.random()*6.28; rho = R*r.uniform(.3, .8)
            p = Vector((math.cos(a)*rho, math.sin(a)*rho, zc+r.uniform(-.45, .5)*R*(1-rho/R*.5))); rr = R*r.uniform(.26, .42)
        s = bmesh.ops.create_icosphere(bm, subdivisions=3, radius=rr)
        sq = Vector((r.uniform(.85, 1.15), r.uniform(.85, 1.15), r.uniform(.6, .85)))
        for v in s['verts']:
            q = v.co.normalized(); o_ = Vector((k*3.1, i*1.7, 0))
            amp = .30*noise.noise(q*2.0+o_)+.18*noise.noise(q*5.5+o_)+.08*noise.noise(q*13.+o_)
            v.co = p+Vector((v.co.x*sq.x, v.co.y*sq.y, v.co.z*sq.z))*(1+amp)
    cm = bpy.data.meshes.new(name+"_copa"); bm.to_mesh(cm); bm.free(); cm.materials.append(COPA)
    for p_ in cm.polygons: p_.use_smooth = True
    c.objects.link(bpy.data.objects.new(name+"_copa", cm))
    return name
VAR = [arvore(k) for k in range(3)]
# troca: árvores de sombra da praça (BLV_arv_praca_s*) e árvores de folhosa num raio de 140 m do lote
FOLHOSAS = {"island_tree_01_LOD0", "island_tree_02_LOD0", "tree_small_02_LOD0", "island_tree_01_LOD1", "island_tree_02_LOD1", "tree_small_02_LOD1"}
scn = bpy.data.scenes["Boulevard"]; LOTE = Vector((-76, 56)); n = 0
for o in scn.objects:
    if o.instance_type != 'COLLECTION' or not o.instance_collection or o.instance_collection.name not in FOLHOSAS: continue
    if o.name.startswith("BLV_arv_praca_s") or (o.location.xy-LOTE).length < 140:
        if 'blv34_esc' not in o: o['blv34_esc'] = o.scale[0]
        s0 = o['blv34_esc']
        o.instance_collection = bpy.data.collections[rng.choice(VAR)]
        s = max(.75, min(1.35, s0*.48)); o.scale = (s, s, s); n += 1
result = dict(variacoes=VAR, trocadas=n)

# nenhuma árvore com tronco no asfalto (o 23 checa as do site, mas praça/quintais/mata entraram depois)
from mathutils.bvhtree import BVHTree
ra = scn.objects.get("BLV_osm_asfalto"); rm = 0
if ra:
    bv = BVHTree.FromObject(ra, bpy.context.evaluated_depsgraph_get(), deform=False); mi = ra.matrix_world.inverted()
    d = (mi.to_3x3()@Vector((0, 0, -1))).normalized()
    for o in list(scn.objects):
        if o.instance_type != 'COLLECTION' or not o.instance_collection: continue
        cn = o.instance_collection.name
        if not (cn.startswith(("BLV_copa_densa", "BLV_palmeira")) or "tree" in cn or "jacaranda" in cn): continue
        p = o.location
        if any(bv.ray_cast(mi@Vector((p.x+dx, p.y+dy, 3000.)), d)[0] is not None for dx, dy in ((0, 0), (1.2, 0), (-1.2, 0), (0, 1.2), (0, -1.2))):
            bpy.data.objects.remove(o, do_unlink=True); rm += 1
result['removidas_rua'] = rm
# modo de vegetação por câmera: a copa procedural só se sustenta à distância (na foto ao nível do olho vira brócolis
# facetado). ns['blv_arvores']('perto') volta as folhosas Poly Haven com a escala original; ('aerea') põe as copas densas.
def blv_arvores(modo):
    sc = bpy.data.scenes["Boulevard"]; n = 0
    var = [c for c in (bpy.data.collections.get(f"BLV_copa_densa_{k}") for k in range(3)) if c]
    ph = [c for c in (bpy.data.collections.get(x) for x in ("island_tree_01_LOD0", "island_tree_02_LOD0", "tree_small_02_LOD0")) if c]
    for o in sc.objects:
        if 'blv34_esc' not in o or o.instance_type != 'COLLECTION': continue
        r = random.Random(o.name); s0 = o['blv34_esc']
        if modo == 'perto': o.instance_collection = r.choice(ph); o.scale = (s0, s0, s0)
        else:
            o.instance_collection = r.choice(var); s = max(.75, min(1.35, s0*.48)); o.scale = (s, s, s)
        n += 1
    sc['blv_arvores'] = modo
    return n
bpy.app.driver_namespace['blv_arvores'] = blv_arvores
