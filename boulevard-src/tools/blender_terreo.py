# Boulevard em 3D -> térreos envidraçados com interior de verdade
# Antes: atrás do vidro havia um cartão emissivo (térreo das torres) ou o volume branco maciço (Torre di Mosto).
# Agora: caixa de ambiente com normais para dentro (face voltada para a câmera fica transparente),
# piso em pedra polida, forro com spots, paredes quentes, mobiliário simples, plantas e luz real.
import bpy, bmesh, random, math
from mathutils import Vector

scn = bpy.data.scenes["Boulevard"]; rng = random.Random(7)
C = bpy.data.collections.get("BLV_Terreo")
if not C:
    C = bpy.data.collections.new("BLV_Terreo"); scn.collection.children.link(C)
for o in list(C.objects): bpy.data.objects.remove(o, do_unlink=True)

def node(nt, t, **kw):
    n = nt.nodes.new(t)
    for k, v in kw.items(): setattr(n, k, v)
    return n

# ---------- material do ambiente (uma caixa = piso, forro, paredes) ----------
def mat_sala():
    m = bpy.data.materials.get("BLV_Sala") or bpy.data.materials.new("BLV_Sala"); m.use_nodes = True
    nt = m.node_tree; nt.nodes.clear(); L = nt.links.new
    out = node(nt, 'ShaderNodeOutputMaterial'); geo = node(nt, 'ShaderNodeNewGeometry')
    sep = node(nt, 'ShaderNodeSeparateXYZ'); L(geo.outputs['Normal'], sep.inputs[0])
    isF = node(nt, 'ShaderNodeMath', operation='GREATER_THAN'); L(sep.outputs['Z'], isF.inputs[0]); isF.inputs[1].default_value = .5
    isC = node(nt, 'ShaderNodeMath', operation='LESS_THAN'); L(sep.outputs['Z'], isC.inputs[0]); isC.inputs[1].default_value = -.5
    tc = node(nt, 'ShaderNodeTexCoord'); oi = node(nt, 'ShaderNodeObjectInfo')
    # paredes: reboco quente com painel de madeira (ripado) variando por ambiente
    wave = node(nt, 'ShaderNodeTexWave', wave_type='BANDS'); wave.inputs['Scale'].default_value = 3.; L(tc.outputs['Object'], wave.inputs['Vector'])
    wood = node(nt, 'ShaderNodeValToRGB'); L(wave.outputs['Fac'], wood.inputs[0])
    wood.color_ramp.elements[0].color = (.20, .11, .055, 1); wood.color_ramp.elements[1].color = (.36, .21, .11, 1)
    wsel = node(nt, 'ShaderNodeMath', operation='GREATER_THAN'); L(oi.outputs['Random'], wsel.inputs[0]); wsel.inputs[1].default_value = .45
    wall = node(nt, 'ShaderNodeMix', data_type='RGBA'); s = [x for x in wall.inputs if x.type == 'RGBA']
    s[0].default_value = (.62, .57, .50, 1); L(wood.outputs[0], s[1]); L(wsel.outputs[0], wall.inputs['Factor'])
    # piso: pedra polida com juntas
    brick = node(nt, 'ShaderNodeTexBrick'); brick.inputs['Scale'].default_value = .8; brick.inputs['Mortar Size'].default_value = .004
    brick.inputs['Color1'].default_value = (.42, .40, .37, 1); brick.inputs['Color2'].default_value = (.36, .345, .32, 1)
    brick.inputs['Mortar'].default_value = (.15, .14, .13, 1); brick.offset = 0.; L(tc.outputs['Object'], brick.inputs['Vector'])
    c1 = node(nt, 'ShaderNodeMix', data_type='RGBA'); s1 = [x for x in c1.inputs if x.type == 'RGBA']
    L(wall.outputs[2], s1[0]); L(brick.outputs['Color'], s1[1]); L(isF.outputs[0], c1.inputs['Factor'])
    c2 = node(nt, 'ShaderNodeMix', data_type='RGBA'); s2 = [x for x in c2.inputs if x.type == 'RGBA']
    L(c1.outputs[2], s2[0]); s2[1].default_value = (.78, .77, .74, 1); L(isC.outputs[0], c2.inputs['Factor'])
    rough = node(nt, 'ShaderNodeMapRange'); L(isF.outputs[0], rough.inputs['Value']); rough.inputs['To Min'].default_value = .7; rough.inputs['To Max'].default_value = .18
    bs = node(nt, 'ShaderNodeBsdfPrincipled'); L(c2.outputs[2], bs.inputs['Base Color']); L(rough.outputs[0], bs.inputs['Roughness'])
    # spots embutidos no forro
    vor = node(nt, 'ShaderNodeTexVoronoi'); vor.inputs['Scale'].default_value = .42; vor.inputs['Randomness'].default_value = 0.
    L(tc.outputs['Object'], vor.inputs['Vector'])
    spot = node(nt, 'ShaderNodeMath', operation='LESS_THAN'); L(vor.outputs['Distance'], spot.inputs[0]); spot.inputs[1].default_value = .085
    sc = node(nt, 'ShaderNodeMath', operation='MULTIPLY'); L(spot.outputs[0], sc.inputs[0]); L(isC.outputs[0], sc.inputs[1])
    st = node(nt, 'ShaderNodeMath', operation='MULTIPLY'); L(sc.outputs[0], st.inputs[0]); st.inputs[1].default_value = 60.
    bb = node(nt, 'ShaderNodeBlackbody'); bb.inputs[0].default_value = 3000.
    L(bb.outputs[0], bs.inputs['Emission Color']); L(st.outputs[0], bs.inputs['Emission Strength'])
    tr = node(nt, 'ShaderNodeBsdfTransparent'); mx = node(nt, 'ShaderNodeMixShader')
    L(geo.outputs['Backfacing'], mx.inputs[0]); L(bs.outputs[0], mx.inputs[1]); L(tr.outputs[0], mx.inputs[2]); L(mx.outputs[0], out.inputs['Surface'])
    return m

def pbr(name, col, rough, metal=0.):
    m = bpy.data.materials.get(name) or bpy.data.materials.new(name); m.use_nodes = True
    b = m.node_tree.nodes.get("Principled BSDF"); b.inputs['Base Color'].default_value = (*col, 1)
    b.inputs['Roughness'].default_value = rough; b.inputs['Metallic'].default_value = metal; return m

SALA = mat_sala()
M = dict(madeira=pbr("BLV_T_Madeira", (.30, .17, .08), .45), tecido=pbr("BLV_T_Tecido", (.16, .15, .14), .9),
         tecido2=pbr("BLV_T_Tecido2", (.42, .33, .24), .9), pedra=pbr("BLV_T_Pedra", (.80, .78, .74), .2),
         metal=pbr("BLV_T_Metal", (.05, .05, .05), .35, 1.), vaso=pbr("BLV_T_Vaso", (.12, .11, .10), .6))
lum = bpy.data.materials.get("BLV_T_Luminaria") or bpy.data.materials.new("BLV_T_Luminaria"); lum.use_nodes = True
b = lum.node_tree.nodes.get("Principled BSDF"); b.inputs['Emission Color'].default_value = (1., .72, .42, 1); b.inputs['Emission Strength'].default_value = 25.

def box(name, x0, x1, y0, y1, z0, z1, mat, rot=0., cx=None, cy=None):
    me = bpy.data.meshes.new(name); bm = bmesh.new()
    bmesh.ops.create_cube(bm, size=1.); bmesh.ops.scale(bm, vec=(x1-x0, y1-y0, z1-z0), verts=bm.verts)
    bm.to_mesh(me); bm.free(); me.materials.append(mat)
    o = bpy.data.objects.new(name, me); o.location = ((x0+x1)/2, (y0+y1)/2, (z0+z1)/2); C.objects.link(o); return o

shrubs = [o for o in bpy.data.collections["shrub_01_LOD0"].all_objects if o.type == 'MESH']
def planta(name, x, y, z, s=.9):
    box(name+"_vaso", x-.3, x+.3, y-.3, y+.3, z, z+.6, M['vaso'])
    o = bpy.data.objects.new(name, rng.choice(shrubs).data); o.location = (x, y, z+.55)
    o.scale = (s*.55, s*.55, s*.75); o.rotation_euler[2] = rng.random()*6.28; C.objects.link(o)

def mobilia(tag, x0, x1, y0, y1, z0, h):
    """Lobby/loja genérica: balcão ao fundo, estar com sofás, mesas, plantas, pendentes e luz real."""
    w, d = x1-x0, y1-y0; n = 0
    # luz real (pontos sob o forro)
    nx, ny = max(1, round(w/5.)), max(1, round(d/5.))
    for i in range(nx):
        for j in range(ny):
            ld = bpy.data.lights.new(f"BLV_T_{tag}_l{n}", 'POINT'); ld.energy = 140.; ld.shadow_soft_size = .4
            ld.color = (1., .78, .55); lo = bpy.data.objects.new(ld.name, ld)
            lo.location = (x0+(i+.5)*w/nx, y0+(j+.5)*d/ny, z0+h-.35); C.objects.link(lo); n += 1
    long_x = w >= d
    # balcão no centro do ambiente, alinhado ao lado maior
    if long_x:
        cx = (x0+x1)/2; box(f"BLV_T_{tag}_balcao", cx-1.6, cx+1.6, (y0+y1)/2-.35, (y0+y1)/2+.35, z0, z0+1.05, M['madeira'])
        box(f"BLV_T_{tag}_tampo", cx-1.65, cx+1.65, (y0+y1)/2-.4, (y0+y1)/2+.4, z0+1.05, z0+1.1, M['pedra'])
    else:
        cy = (y0+y1)/2; box(f"BLV_T_{tag}_balcao", (x0+x1)/2-.35, (x0+x1)/2+.35, cy-1.6, cy+1.6, z0, z0+1.05, M['madeira'])
        box(f"BLV_T_{tag}_tampo", (x0+x1)/2-.4, (x0+x1)/2+.4, cy-1.65, cy+1.65, z0+1.05, z0+1.1, M['pedra'])
    # conjuntos de estar / mesas espalhados
    k = 0
    for t in range(int(max(w, d)//4.5)):
        u = (t+.5)/max(1, int(max(w, d)//4.5))
        px = x0+u*w if long_x else x0+rng.uniform(.3, .7)*w
        py = y0+rng.uniform(.25, .75)*d if long_x else y0+u*d
        if abs(px-(x0+x1)/2) < 2.2 and abs(py-(y0+y1)/2) < 1.2: continue
        if rng.random() < .5:   # sofá + mesa de centro
            sx = 1.9; box(f"BLV_T_{tag}_sofa{k}", px-sx/2, px+sx/2, py-.45, py+.45, z0, z0+.45, rng.choice((M['tecido'], M['tecido2'])))
            box(f"BLV_T_{tag}_enc{k}", px-sx/2, px+sx/2, py+.3, py+.45, z0+.45, z0+.85, M['tecido'])
            box(f"BLV_T_{tag}_mc{k}", px-.45, px+.45, py-1.25, py-.75, z0, z0+.4, M['madeira'])
        else:                   # mesa alta + banquetas
            box(f"BLV_T_{tag}_mesa{k}", px-.5, px+.5, py-.5, py+.5, z0+.72, z0+.76, M['pedra'])
            box(f"BLV_T_{tag}_pe{k}", px-.05, px+.05, py-.05, py+.05, z0, z0+.72, M['metal'])
            for a in range(3):
                ax, ay = px+math.cos(a*2.1)*.75, py+math.sin(a*2.1)*.75
                box(f"BLV_T_{tag}_bq{k}{a}", ax-.18, ax+.18, ay-.18, ay+.18, z0, z0+.45, M['madeira'])
        # pendente
        box(f"BLV_T_{tag}_pend{k}", px-.18, px+.18, py-.18, py+.18, z0+h-1.3, z0+h-1.05, lum)
        box(f"BLV_T_{tag}_fio{k}", px-.005, px+.005, py-.005, py+.005, z0+h-1.05, z0+h, M['metal'])
        k += 1
    for c, (px, py) in enumerate(((x0+.6, y0+.6), (x1-.6, y1-.6), (x0+.6, y1-.6), (x1-.6, y0+.6))):
        if rng.random() < .8: planta(f"BLV_T_{tag}_pl{c}", px, py, z0, rng.uniform(.8, 1.2))

# ---------- 1) térreo das torres: o cartão vira ambiente ----------
ilhas = 0
for T in ("A", "B"):
    o = bpy.data.objects[f"BLV_{T}_shopin"]; o.data.materials.clear(); o.data.materials.append(SALA)
    mw = o.matrix_world; bm = bmesh.new(); bm.from_mesh(o.data); bm.verts.ensure_lookup_table()
    seen = set()
    for f in bm.faces:
        if f.index in seen: continue
        stack = [f]; isl = []
        while stack:
            g = stack.pop()
            if g.index in seen: continue
            seen.add(g.index); isl.append(g)
            for e in g.edges:
                for h in e.link_faces:
                    if h.index not in seen: stack.append(h)
        vs = [mw@v.co for g in isl for v in g.verts]
        x0, x1 = min(v.x for v in vs), max(v.x for v in vs); y0, y1 = min(v.y for v in vs), max(v.y for v in vs)
        z0, z1 = min(v.z for v in vs), max(v.z for v in vs)
        if (x1-x0) < 3 or (y1-y0) < 3: continue
        mobilia(f"{T}{ilhas}", x0+.3, x1-.3, y0+.3, y1-.3, z0, z1-z0); ilhas += 1
    bm.free()

# ---------- 2) Torre di Mosto: tira o maciço branco do térreo e cria o ambiente ----------
G = bpy.data.objects["BLV_vizinho_shopglass"]; gv = [G.matrix_world@v.co for v in G.data.vertices]
gx0, gx1 = min(v.x for v in gv), max(v.x for v in gv); gy0, gy1 = min(v.y for v in gv), max(v.y for v in gv); gz1 = max(v.z for v in gv)
for n in ("BLV_vizinho_white", "BLV_vizinho_graph"):
    o = bpy.data.objects[n]
    if o.get("terreo_cortado"): continue
    bm = bmesh.new(); bm.from_mesh(o.data); mwi = o.matrix_world.inverted()
    co = mwi@Vector((0, 0, gz1)); no = (mwi.to_3x3()@Vector((0, 0, 1))).normalized()
    r = bmesh.ops.bisect_plane(bm, geom=bm.verts[:]+bm.edges[:]+bm.faces[:], plane_co=co, plane_no=no, clear_inner=True)
    edges = [e for e in r['geom_cut'] if isinstance(e, bmesh.types.BMEdge)]
    if edges: bmesh.ops.edgeloop_fill(bm, edges=edges)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces); bm.to_mesh(o.data); bm.free(); o["terreo_cortado"] = 1
x0, x1, y0, y1 = gx0+.15, gx1-.15, gy0+.15, gy1-.15
sala = box("BLV_T_mosto_sala", x0, x1, y0, y1, .0, gz1-.05, SALA)
bm = bmesh.new(); bm.from_mesh(sala.data); bmesh.ops.reverse_faces(bm, faces=bm.faces[:]); bm.to_mesh(sala.data); bm.free()
# miolo do prédio (núcleo) no fundo, para o ambiente não ficar vazado de lado a lado
box("BLV_T_mosto_nucleo", (x0+x1)/2-3., (x0+x1)/2+3., (y0+y1)/2-2.5, (y0+y1)/2+2.5, 0., gz1-.05, M['pedra'])
for i, (a, bnd) in enumerate((((x0, (x0+x1)/2-3.3)), (((x0+x1)/2+3.3, x1)))):
    mobilia(f"mosto{i}", a, bnd, y0, y1, 0., gz1-.05)

result = dict(ilhas_torres=ilhas, mosto=[round(gx0, 1), round(gx1, 1), round(gy0, 1), round(gy1, 1), round(gz1, 1)], objetos=len(C.objects))
