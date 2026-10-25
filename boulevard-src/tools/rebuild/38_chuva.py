# Realismo 38: sistema de chuva (fotos 2 e 4). Três camadas, todas reversíveis:
#  1) chão molhado: em asfalto, calçada, faixa, piso da praça, borda, concreto e telhados entra um nó CHUVA (0/1):
#     base escurece (~0,55×), rugosidade cai para ~0,15 e, nas poças (máscara de ruído em coordenada de mundo),
#     vai a 0,02 — é isso que dá o reflexo das lojas e postes no asfalto.
#  2) atmosfera: céu fechado (HDRI kloofendal_overcast_puresky, Poly Haven CC0) em intensidade de entardecer,
#     sem sol, névoa no compositor pelo passe de mist (BLV_Pos), luzes acesas como no look 'noite'.
#  3) gotas caindo: ns['blv_chuva_cam'](camera) cria BLV_chuva = ~25 mil traços finos dentro do frustum da câmera
#     (1,5–40 m), inclinados pelo vento, material de água (transmissão, IOR 1,33), sem sombra.
# ns['blv_look_chuva']() liga tudo; ns['blv_seco']() desliga as camadas 1 e 3 (o look volta pelo blv_look).
import bpy, math, random, os
from mathutils import Vector
scn = bpy.data.scenes["Boulevard"]; ns = bpy.app.driver_namespace; M = bpy.data.materials; out = {}
MOLHA = ["BLV_Asfalto", "BLV_Calcada", "BLV_Faixa", "BLV_Praca_Piso", "BLV_Praca_Borda", "BLV_Concreto_Lazer",
         "BLV_Casa_Laje", "BLV_Telha_Metalica", "BLV_Poste_Concreto"] + [f"BLV_Casa_Telhado_{i}" for i in range(6)]
MOLHA += [m.name for m in M if m.name.startswith(("BLV_Estac", "BLV_Vaga", "BLV_Piso", "BLV_Pav"))]
def fonte(nt, sock, kind):
    """devolve um socket com o valor atual de sock (ligado ou constante)"""
    if sock.is_linked: return sock.links[0].from_socket
    if kind == 'RGBA':
        n = nt.nodes.new('ShaderNodeRGB'); n.outputs[0].default_value = sock.default_value
    else:
        n = nt.nodes.new('ShaderNodeValue'); n.outputs[0].default_value = sock.default_value
    return n.outputs[0]
def molhar(m):
    if not m or not m.use_nodes: return False
    nt = m.node_tree; N = nt.nodes; L = nt.links.new
    if "CHUVA" in N: return True
    b = next((n for n in N if n.type == 'BSDF_PRINCIPLED'), None)
    if not b: return False
    ch = N.new('ShaderNodeValue'); ch.name = ch.label = "CHUVA"; ch.outputs[0].default_value = 0.
    # poças: ruído em coordenada de mundo, só em superfície horizontal
    g = N.new('ShaderNodeNewGeometry'); nz = N.new('ShaderNodeTexNoise'); nz.inputs['Scale'].default_value = .09; nz.inputs['Detail'].default_value = 4
    L(g.outputs['Position'], nz.inputs['Vector'])
    mr = N.new('ShaderNodeMapRange'); mr.inputs[1].default_value = .56; mr.inputs[2].default_value = .63; L(nz.outputs['Fac'], mr.inputs[0])
    sz = N.new('ShaderNodeSeparateXYZ'); L(g.outputs['Normal'], sz.inputs[0])
    hz = N.new('ShaderNodeMath'); hz.operation = 'GREATER_THAN'; hz.inputs[1].default_value = .9; L(sz.outputs['Z'], hz.inputs[0])
    pc = N.new('ShaderNodeMath'); pc.operation = 'MULTIPLY'; L(mr.outputs[0], pc.inputs[0]); L(hz.outputs[0], pc.inputs[1])
    pw = N.new('ShaderNodeMath'); pw.operation = 'MULTIPLY'; L(pc.outputs[0], pw.inputs[0]); L(ch.outputs[0], pw.inputs[1])   # poça ativa
    # rugosidade
    r0 = fonte(nt, b.inputs['Roughness'], 'VALUE')
    rw = N.new('ShaderNodeMath'); rw.operation = 'MULTIPLY'; rw.inputs[1].default_value = .3; L(r0, rw.inputs[0])
    rmin = N.new('ShaderNodeMath'); rmin.operation = 'MINIMUM'; rmin.inputs[1].default_value = .18; L(rw.outputs[0], rmin.inputs[0])
    m1 = N.new('ShaderNodeMix'); m1.data_type = 'FLOAT'; L(ch.outputs[0], m1.inputs[0]); L(r0, m1.inputs[2]); L(rmin.outputs[0], m1.inputs[3])
    m2 = N.new('ShaderNodeMix'); m2.data_type = 'FLOAT'; L(pw.outputs[0], m2.inputs[0]); L(m1.outputs[0], m2.inputs[2]); m2.inputs[3].default_value = .02
    L(m2.outputs[0], b.inputs['Roughness'])
    # cor: escurece com a água (absorção do poro), mais nas poças
    c0 = fonte(nt, b.inputs['Base Color'], 'RGBA')
    k1 = N.new('ShaderNodeMath'); k1.operation = 'MULTIPLY_ADD'; k1.inputs[1].default_value = -.45; k1.inputs[2].default_value = 1.; L(ch.outputs[0], k1.inputs[0])
    k2 = N.new('ShaderNodeMath'); k2.operation = 'MULTIPLY_ADD'; k2.inputs[1].default_value = -.25; L(pw.outputs[0], k2.inputs[0]); L(k1.outputs[0], k2.inputs[2])
    cm = N.new('ShaderNodeVectorMath'); cm.operation = 'SCALE'; L(c0, cm.inputs[0]); L(k2.outputs[0], cm.inputs['Scale'])
    L(cm.outputs[0], b.inputs['Base Color'])
    # poça alisa o relevo: atenua o bump existente
    if b.inputs['Normal'].is_linked:
        src = b.inputs['Normal'].links[0].from_node
        if src.type == 'BUMP':
            st = fonte(nt, src.inputs['Strength'], 'VALUE')
            inv = N.new('ShaderNodeMath'); inv.operation = 'SUBTRACT'; inv.inputs[0].default_value = 1.; L(pw.outputs[0], inv.inputs[1])
            sm = N.new('ShaderNodeMath'); sm.operation = 'MULTIPLY'; L(st, sm.inputs[0]); L(inv.outputs[0], sm.inputs[1]); L(sm.outputs[0], src.inputs['Strength'])
    return True
out['molhados'] = [n for n in MOLHA if molhar(M.get(n))]
def set_chuva(v):
    for m in M:
        if m.use_nodes and "CHUVA" in m.node_tree.nodes: m.node_tree.nodes["CHUVA"].outputs[0].default_value = v
# ---------- névoa no compositor (passe de mist) ----------
vl = scn.view_layers[0]; vl.use_pass_mist = True
ms = scn.world.mist_settings; ms.start = 8.; ms.depth = 450.; ms.falloff = 'QUADRATIC'
ct = scn.compositing_node_group
if ct and "MIST_AMT" not in ct.nodes:
    rl = next(n for n in ct.nodes if n.type == 'R_LAYERS')
    lk = next((l for l in ct.links if l.from_node == rl and l.from_socket.name == 'Image'), None)
    if lk:
        dst = lk.to_socket
        def nn(*tipos):
            for t in tipos:
                try: return ct.nodes.new(t)
                except Exception: pass
            raise RuntimeError(tipos)
        amt = nn('ShaderNodeValue', 'CompositorNodeValue'); amt.name = amt.label = "MIST_AMT"; amt.outputs[0].default_value = 0.
        mul = nn('ShaderNodeMath', 'CompositorNodeMath'); mul.operation = 'MULTIPLY'
        ct.links.new(rl.outputs['Mist'], mul.inputs[0]); ct.links.new(amt.outputs[0], mul.inputs[1])
        mx = nn('ShaderNodeMix'); mx.data_type = 'RGBA'; mx.inputs[7].default_value = (.20, .23, .28, 1)
        ct.links.new(mul.outputs[0], mx.inputs[0]); ct.links.new(rl.outputs['Image'], mx.inputs[6]); ct.links.new(mx.outputs[2], dst)
        out['mist'] = 'compositor'
def set_mist(v):
    if ct and "MIST_AMT" in ct.nodes: ct.nodes["MIST_AMT"].outputs[0].default_value = v
# ---------- gotas ----------
GOTA = M.get("BLV_Gota") or M.new("BLV_Gota"); GOTA.use_nodes = True
bg_ = GOTA.node_tree.nodes['Principled BSDF']; bg_.inputs['Base Color'].default_value = (1, 1, 1, 1); bg_.inputs['Roughness'].default_value = .05
bg_.inputs['IOR'].default_value = 1.33; bg_.inputs['Alpha'].default_value = .55
for k in ('Transmission Weight', 'Transmission'):
    if k in bg_.inputs: bg_.inputs[k].default_value = 1.; break
def chuva_cam(camname, n=25000, dmin=1.5, dmax=40., vento=(.12, .05), seed=38):
    o = scn.objects.get("BLV_chuva")
    if o: bpy.data.objects.remove(o, do_unlink=True)
    cam = scn.objects[camname]; mw = cam.matrix_world; fr = cam.data.view_frame(scene=scn); tr, br, bl, tl = fr; zf = -bl.z
    r = random.Random(seed); V, F = [], []; cp = mw.translation
    for i in range(n):
        d = dmin+(dmax-dmin)*r.random()**1.6
        u, v = r.uniform(-.08, 1.08), r.uniform(-.08, 1.08)
        pl = bl+(br-bl)*u+(tl-bl)*v; p = mw@(pl*(d/zf))
        Lg = r.uniform(.35, .8)*(1+d/30); w = .0025+.0006*d          # traço longo (obturador ~1/60) e mais largo longe
        down = Vector((vento[0], vento[1], -1.)).normalized()
        side = (p-cp).cross(down).normalized()*w
        a, b_ = p-down*Lg/2, p+down*Lg/2; k = len(V)
        V += [tuple(a-side), tuple(a+side), tuple(b_+side), tuple(b_-side)]; F.append((k, k+1, k+2, k+3))
    me = bpy.data.meshes.new("BLV_chuva"); me.from_pydata(V, [], F); me.update(); me.materials.append(GOTA)
    o = bpy.data.objects.new("BLV_chuva", me); scn.collection.objects.link(o)
    o.visible_shadow = False
    return len(F)
# ---------- looks ----------
HDR = os.path.expanduser("~/Movies/Boulevard_3D/assets/hdri/kloofendal_overcast_puresky_4k.hdr")
def blv_look_chuva(ceu=.16, gate=.34, exp=1.15, mist=.45):
    if 'blv_look_noite' in ns: ns['blv_look_noite']()
    else: ns['blv_look']('v3')
    wn = scn.world.node_tree; env = next(n for n in wn.nodes if n.type == 'TEX_ENVIRONMENT'); bgn = next(n for n in wn.nodes if n.type == 'BACKGROUND')
    if os.path.exists(HDR):
        if 'blv_env_orig' not in scn and env.image: scn['blv_env_orig'] = env.image.filepath
        env.image = bpy.data.images.load(HDR, check_existing=True)
    wn.links.new(env.outputs[0], bgn.inputs['Color']); bgn.inputs['Strength'].default_value = ceu
    bpy.data.materials["BLV_Interior"].node_tree.nodes["GATE"].inputs[1].default_value = gate
    vs = scn.view_settings; vs.exposure = exp; vs.use_white_balance = True; vs.white_balance_temperature = 5200.
    tm = M["BLV_Terreno"].node_tree; hz = tm.nodes.get('HAZE')
    if hz: hz.inputs['Color'].default_value = (.20, .23, .28, 1); hz.inputs['Strength'].default_value = .35
    set_chuva(1.); set_mist(mist); scn['blv_look'] = 'chuva'
def blv_seco():
    set_chuva(0.); set_mist(0.)
    o = scn.objects.get("BLV_chuva")
    if o: o.hide_render = True
    wn = scn.world.node_tree; env = next(n for n in wn.nodes if n.type == 'TEX_ENVIRONMENT')
    if 'blv_env_orig' in scn: env.image = bpy.data.images.load(scn['blv_env_orig'], check_existing=True)
    scn.view_settings.use_white_balance = False
ns['blv_look_chuva'] = blv_look_chuva; ns['blv_seco'] = blv_seco; ns['blv_chuva_cam'] = chuva_cam
result = out
