# Realismo 29: materiais do bairro (só shader, nada de geometria nova). Leitura da aerea_osm2: o piso da praça estoura
# como neve, os prédios OSM viram caixas brancas, as casas têm parede branca pura e telhado chapado, e o asfalto lava.
# Albedos reais: concreto/paver ~.25–.35, parede pintada ~.45–.65, telha cerâmica ~.15–.25, asfalto ~.06–.10.
import bpy
M = bpy.data.materials
def base(m):
    m.use_nodes = True; nt = m.node_tree; nt.nodes.clear()
    out = nt.nodes.new('ShaderNodeOutputMaterial'); b = nt.nodes.new('ShaderNodeBsdfPrincipled'); nt.links.new(b.outputs[0], out.inputs[0])
    return nt, b
def node(nt, t, **kw):
    n = nt.nodes.new(t)
    for k, v in kw.items():
        if k in n.inputs: n.inputs[k].default_value = v
        else: setattr(n, k, v)
    return n
def mix(nt, a, b, fac, mode='MULTIPLY'):
    m = node(nt, 'ShaderNodeMix', data_type='RGBA', blend_type=mode); m.inputs['Factor'].default_value = fac if isinstance(fac, float) else 1.
    if not isinstance(fac, float): nt.links.new(fac, m.inputs['Factor'])
    L = nt.links.new
    (L(a, m.inputs[6]) if not isinstance(a, tuple) else setattr(m.inputs[6], 'default_value', a))
    (L(b, m.inputs[7]) if not isinstance(b, tuple) else setattr(m.inputs[7], 'default_value', b))
    return m.outputs[2]
def variacao(nt, scale, lo, hi, coord='Object'):
    """ruído grande -> cor entre lo e hi (variação de casa para casa / mancha)"""
    tc = node(nt, 'ShaderNodeTexCoord'); nz = node(nt, 'ShaderNodeTexNoise', Scale=scale, Detail=1.5)
    nt.links.new(tc.outputs[coord], nz.inputs['Vector'])
    r = node(nt, 'ShaderNodeValToRGB'); r.color_ramp.elements[0].color = lo; r.color_ramp.elements[1].color = hi
    nt.links.new(nz.outputs['Fac'], r.inputs['Fac']); return r.outputs['Color']
def sujeira_base(nt, b_out, h=1.2):
    """escurece o pé das paredes (respingo, umidade) — gradiente em Z do objeto via posição"""
    g = node(nt, 'ShaderNodeNewGeometry'); sep = node(nt, 'ShaderNodeSeparateXYZ'); nt.links.new(g.outputs['Position'], sep.inputs[0])
    return b_out
out = {}
# 1) praça: paver de concreto cinza-areia, com manchas e juntas escuras
m = M.get("BLV_Praca_Piso")
if m:
    nt, b = base(m)
    tc = node(nt, 'ShaderNodeTexCoord'); br = node(nt, 'ShaderNodeTexBrick', offset=.5, squash=1., Scale=.9)
    br.inputs['Mortar Size'].default_value = .02; br.inputs['Bias'].default_value = 0.
    br.inputs['Color1'].default_value = (.30, .28, .25, 1); br.inputs['Color2'].default_value = (.24, .23, .21, 1); br.inputs['Mortar'].default_value = (.10, .10, .09, 1)
    nt.links.new(tc.outputs['Object'], br.inputs['Vector'])
    c = mix(nt, br.outputs['Color'], variacao(nt, .06, (.72, .72, .70, 1), (1.05, 1.02, .98, 1)), 1.)
    c = mix(nt, c, variacao(nt, .9, (.8, .8, .8, 1), (1, 1, 1, 1)), 1.)
    nt.links.new(c, b.inputs['Base Color']); b.inputs['Roughness'].default_value = .88
    bp = node(nt, 'ShaderNodeBump', Strength=.3); nt.links.new(br.outputs['Fac'], bp.inputs['Height']); nt.links.new(bp.outputs[0], b.inputs['Normal'])
    out['praca'] = 1
# 2) paredes das casas: tinta envelhecida, variação por casa, faixa de janelas escuras nas fachadas
def parede(m, cor):
    nt, b = base(m); L = nt.links.new
    c = mix(nt, cor, variacao(nt, .11, (.78, .76, .72, 1), (1., 1., 1., 1)), 1.)
    # janelas: onda em Z (peitoril ~1 m, altura ~1.2 m por pavimento) × onda horizontal; só em faces verticais
    g = node(nt, 'ShaderNodeNewGeometry'); sep = node(nt, 'ShaderNodeSeparateXYZ'); L(g.outputs['Normal'], sep.inputs[0])
    vert = node(nt, 'ShaderNodeMath', operation='LESS_THAN'); L(sep.outputs['Z'], vert.inputs[0]); vert.inputs[1].default_value = .3
    tc = node(nt, 'ShaderNodeTexCoord'); ps = node(nt, 'ShaderNodeSeparateXYZ'); L(tc.outputs['Object'], ps.inputs[0])
    def faixa(sock, periodo, ini, larg):
        a = node(nt, 'ShaderNodeMath', operation='FLOORED_MODULO'); L(sock, a.inputs[0]); a.inputs[1].default_value = periodo
        lo = node(nt, 'ShaderNodeMath', operation='GREATER_THAN'); L(a.outputs[0], lo.inputs[0]); lo.inputs[1].default_value = ini
        hi = node(nt, 'ShaderNodeMath', operation='LESS_THAN'); L(a.outputs[0], hi.inputs[0]); hi.inputs[1].default_value = ini+larg
        r = node(nt, 'ShaderNodeMath', operation='MULTIPLY'); L(lo.outputs[0], r.inputs[0]); L(hi.outputs[0], r.inputs[1]); return r.outputs[0]
    zf = faixa(ps.outputs['Z'], 2.9, 1.0, 1.15)
    hx = node(nt, 'ShaderNodeMath', operation='ADD'); L(ps.outputs['X'], hx.inputs[0]); L(ps.outputs['Y'], hx.inputs[1])
    xf = faixa(hx.outputs[0], 3.7, .6, 1.4)
    w = node(nt, 'ShaderNodeMath', operation='MULTIPLY'); L(zf, w.inputs[0]); L(xf, w.inputs[1])
    w2 = node(nt, 'ShaderNodeMath', operation='MULTIPLY'); L(w.outputs[0], w2.inputs[0]); L(vert.outputs[0], w2.inputs[1])
    c = mix(nt, c, (.035, .04, .045, 1), w2.outputs[0], 'MIX')
    L(c, b.inputs['Base Color'])
    rf = node(nt, 'ShaderNodeMath', operation='MULTIPLY_ADD'); L(w2.outputs[0], rf.inputs[0]); rf.inputs[1].default_value = -.7; rf.inputs[2].default_value = .9
    L(rf.outputs[0], b.inputs['Roughness'])
for i in range(12):
    m = M.get(f"BLV_Casa_Parede_{i}")
    if not m: continue
    # cor original estava ~.8 linear (branco puro); traz para tinta real ~.45–.6
    oc = (m.get('blv_cor') or list(m.diffuse_color))
    if not m.get('blv_cor'):
        try: oc = list(m.node_tree.nodes['Principled BSDF'].inputs['Base Color'].default_value)
        except Exception: pass
        m['blv_cor'] = oc
    k = .62; parede(m, (oc[0]*k, oc[1]*k, oc[2]*k, 1)); out.setdefault('paredes', 0); out['paredes'] += 1
# 3) telhados: telha com fiadas, variação de tom por casa e escurecimento (fungo, poeira)
for i in range(12):
    m = M.get(f"BLV_Casa_Telhado_{i}")
    if not m: continue
    if not m.get('blv_cor'):
        try: m['blv_cor'] = list(m.node_tree.nodes['Principled BSDF'].inputs['Base Color'].default_value)
        except Exception: m['blv_cor'] = [.25, .1, .06, 1]
    oc = m['blv_cor']; nt, b = base(m); L = nt.links.new
    tc = node(nt, 'ShaderNodeTexCoord'); wv = node(nt, 'ShaderNodeTexWave', wave_type='BANDS', bands_direction='Z', Scale=1.6, Distortion=.4)
    L(tc.outputs['Object'], wv.inputs['Vector'])
    r = node(nt, 'ShaderNodeValToRGB'); r.color_ramp.elements[0].color = (.7, .7, .7, 1); r.color_ramp.elements[1].color = (1, 1, 1, 1); L(wv.outputs['Fac'], r.inputs['Fac'])
    c = mix(nt, tuple(oc[:3])+(1,), r.outputs['Color'], 1.)
    c = mix(nt, c, variacao(nt, .09, (.62, .6, .6, 1), (1.05, 1., .98, 1)), 1.)
    c = mix(nt, c, variacao(nt, 1.4, (.75, .76, .74, 1), (1, 1, 1, 1)), 1.)
    L(c, b.inputs['Base Color']); b.inputs['Roughness'].default_value = .72
    bp = node(nt, 'ShaderNodeBump', Strength=.35); L(wv.outputs['Fac'], bp.inputs['Height']); L(bp.outputs[0], b.inputs['Normal'])
    out.setdefault('telhados', 0); out['telhados'] += 1
# 4) prédios OSM (comércio/galpão): reboco cinza-claro sujo, vitrine escura no térreo, cobertura de fibrocimento
m = M.get("BLV_OSM_Predio")
if m:
    parede(m, (.42, .41, .38, 1))
    nt = m.node_tree; L = nt.links.new; b = nt.nodes['Principled BSDF']
    g = node(nt, 'ShaderNodeNewGeometry'); sep = node(nt, 'ShaderNodeSeparateXYZ'); L(g.outputs['Normal'], sep.inputs[0])
    top = node(nt, 'ShaderNodeMath', operation='GREATER_THAN'); L(sep.outputs['Z'], top.inputs[0]); top.inputs[1].default_value = .5
    cur = b.inputs['Base Color'].links[0].from_socket
    c = mix(nt, cur, variacao(nt, .3, (.20, .21, .21, 1), (.33, .33, .32, 1)), top.outputs[0], 'MIX'); L(c, b.inputs['Base Color'])
    out['predios'] = 1
# 5) asfalto e calçada OSM: menos lavados, com remendos
for nm, lo, hi in (("BLV_Asfalto", (.045, .045, .047, 1), (.085, .084, .082, 1)), ("BLV_Calcada", (.20, .19, .17, 1), (.32, .31, .29, 1))):
    m = M.get(nm)
    if not m or m.get('blv29'): continue
    nt = m.node_tree; b = next((n for n in nt.nodes if n.type == 'BSDF_PRINCIPLED'), None)
    if not b: continue
    v = variacao(nt, .25, lo, hi); v2 = variacao(nt, 3., (.85, .85, .85, 1), (1.05, 1.05, 1.05, 1))
    s = b.inputs['Base Color']
    if s.links:
        src = s.links[0].from_socket; c = mix(nt, src, mix(nt, v, v2, 1.), .55, 'MIX')
    else: c = mix(nt, v, v2, 1.)
    nt.links.new(c, s); m['blv29'] = 1; out[nm] = 1
result = out
