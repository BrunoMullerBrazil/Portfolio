# Realismo 27: render viável para o bairro inteiro (16 mil objetos, 12 mil árvores com folhas recortadas).
# GI rápido depois de 2 rebatidas, menos rebatidas transparentes, amostragem adaptativa mais agressiva.
import bpy
scn = bpy.data.scenes["Boulevard"]; cy = scn.cycles
cy.max_bounces = 8; cy.diffuse_bounces = 3; cy.glossy_bounces = 3; cy.transmission_bounces = 6; cy.transparent_max_bounces = 8
cy.use_adaptive_sampling = True; cy.adaptive_threshold = .03; cy.use_denoising = True
try:
    cy.use_fast_gi = True; cy.ao_bounces_render = 2
    if scn.world: scn.world.light_settings.distance = 25.
except Exception: pass
cy.sample_clamp_indirect = 6.
result = {"ok": True}
