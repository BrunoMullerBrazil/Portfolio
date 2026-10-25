# Realismo 37: noite crível (foto 5). Leitura da foto5: janelas acesas demais (55%), todas no mesmo âmbar e mesma
# intensidade; casas do bairro apagadas e claras demais para a hora azul.
#  - BLV_Interior: intensidade varia por apartamento (0,35×–1,65×) e temperatura vai de 2700 K a ~4800 K (LED frio
#    em parte dos apartamentos), com viés para o quente.
#  - ns['blv_look_noite'](): parte do 'v3' (capa, inalterado) e só ajusta: 32% das janelas, casas com janelas acesas,
#    exposição um pouco abaixo para a hora azul não lavar as paredes do bairro.
import bpy
M = bpy.data.materials; ns = bpy.app.driver_namespace; out = {}
it = M["BLV_Interior"].node_tree; N = it.nodes; L = it.links.new
if "VAR_INT" not in N:
    oi = N["Object Info"]
    m1 = N.new('ShaderNodeMath'); m1.operation = 'MULTIPLY'; m1.inputs[1].default_value = 37.; L(oi.outputs['Random'], m1.inputs[0])
    fr = N.new('ShaderNodeMath'); fr.operation = 'FRACT'; L(m1.outputs[0], fr.inputs[0])
    va = N.new('ShaderNodeMath'); va.name = "VAR_INT"; va.operation = 'MULTIPLY_ADD'; va.inputs[1].default_value = 1.3; va.inputs[2].default_value = .35
    L(fr.outputs[0], va.inputs[0])
    em = N["Emission"]; src = em.inputs['Strength'].links[0].from_socket
    mm = N.new('ShaderNodeMath'); mm.operation = 'MULTIPLY'; L(src, mm.inputs[0]); L(va.outputs[0], mm.inputs[1]); L(mm.outputs[0], em.inputs['Strength'])
    # temperatura: random² puxa para o quente; 2700–4800 K
    sq = N.new('ShaderNodeMath'); sq.operation = 'POWER'; sq.inputs[1].default_value = 2.2
    m2 = N.new('ShaderNodeMath'); m2.operation = 'MULTIPLY'; m2.inputs[1].default_value = 53.; L(oi.outputs['Random'], m2.inputs[0])
    f2 = N.new('ShaderNodeMath'); f2.operation = 'FRACT'; L(m2.outputs[0], f2.inputs[0]); L(f2.outputs[0], sq.inputs[0])
    mr = N["Map Range"]; L(sq.outputs[0], mr.inputs[0]); mr.inputs[3].default_value = 2700.; mr.inputs[4].default_value = 4800.
    out['interior'] = 'variação de intensidade e temperatura'
def blv_look_noite():
    ns['blv_look']('v3')
    N["GATE"].inputs[1].default_value = .32
    cj = M.get("BLV_Casa_Janela")
    if cj and "NIGHT" in cj.node_tree.nodes: cj.node_tree.nodes["NIGHT"].outputs[0].default_value = 1.
    bpy.data.scenes["Boulevard"].view_settings.exposure = 1.25
    bpy.data.scenes["Boulevard"]['blv_look_atual'] = 'noite'
ns['blv_look_noite'] = blv_look_noite
# 'tarde' e 'v3' apagam as casas (o 20 não conhece o NIGHT): garante isso ao trocar de look
_orig = ns.get('blv_look')
if _orig and not getattr(_orig, '_blv37', False):
    def _look(nome, *a, **k):
        r = _orig(nome, *a, **k)
        cj = M.get("BLV_Casa_Janela")
        if cj and "NIGHT" in cj.node_tree.nodes: cj.node_tree.nodes["NIGHT"].outputs[0].default_value = 0.
        return r
    _look._blv37 = True; ns['blv_look'] = _look
result = out
