# Realismo 33: acabamento da aérea (leitura da aerea_osm3, 25/out).
#  - BLV_osm_predios.001 era cópia de uma rodada anterior do 23 (z-fighting); o 23 agora limpa antes de recriar.
#  - Imagem lavada: exposição .35 + AgX MHC estoura tudo que tem albedo > .4 (paredes, piso da praça, prédios OSM).
#    Baixa a exposição e devolve contraste de meio-tom; o céu/sol do look 'tarde' ficam iguais.
#  - Prédios OSM e piso da praça um ponto abaixo, para não competirem com as torres (que são o assunto).
import bpy
scn = bpy.data.scenes["Boulevard"]; out = {}
for o in list(scn.objects):
    if o.name.startswith("BLV_osm_predios."): bpy.data.objects.remove(o, do_unlink=True); out['dup_removido'] = True
vs = scn.view_settings; vs.exposure = .05; out['exposicao'] = vs.exposure
M = bpy.data.materials
m = M.get("BLV_OSM_Predio")
if m:
    for n in m.node_tree.nodes:
        if n.type == 'MIX' and n.blend_type == 'MULTIPLY' and not n.inputs[6].is_linked: n.inputs[6].default_value = (.30, .295, .275, 1)
p = M.get("BLV_Praca_Piso")
if p:
    br = next((n for n in p.node_tree.nodes if n.type == 'TEX_BRICK'), None)
    if br: br.inputs['Color1'].default_value = (.19, .18, .17, 1); br.inputs['Color2'].default_value = (.165, .16, .15, 1)
result = out
