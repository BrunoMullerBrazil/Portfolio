# Boulevard em 3D -> cena realista no Blender (prova de conceito)
# Porta a volumetria de template.html (mesmos dados U/CORE/CORR, mesma escala PL/FH)
# e acrescenta o detalhe do book: caixilhos, guarda-corpo em réguas, frisos amarelos, topo técnico.
# Coordenadas: o site usa three.js (Y para cima). Aqui (X,Y,Z)_three -> (X,-Z,Y)_blender.
import bpy, math, random
from mathutils import Vector, noise

random.seed(7)
SCN_NAME = "Boulevard"
scn = bpy.data.scenes.get(SCN_NAME) or bpy.data.scenes.new(SCN_NAME)
bpy.context.window.scene = scn
for o in list(scn.objects):
    bpy.data.objects.remove(o, do_unlink=True)
for c in list(scn.collection.children):
    scn.collection.children.unlink(c)

def coll(name):
    c = bpy.data.collections.get(name) or bpy.data.collections.new(name)
    if c.name not in scn.collection.children:
        scn.collection.children.link(c)
    return c

C_BLD, C_UNITS, C_SITE, C_ENV = coll("BLV_Predio"), coll("BLV_Unidades"), coll("BLV_Lote"), coll("BLV_Entorno")

# ---------------- dados do site ----------------
PL, SITE, GH, CH, FH, NF, FY = 0.0301, 0.1015, 4.2, 3.4, 2.88, 12, -1
BASE = GH + CH
U = {
 1:dict(t='laranja',r=[[1590,632,1840,828],[1650,605,1840,632],[1840,605,1875,760],[1718,828,1840,850]],seg=[[1590,828,1718,828,'S'],[1718,850,1840,850,'S'],[1875,605,1875,760,'E'],[1840,760,1840,828,'E']],sac=[1592,828,1700,853,'S']),
 2:dict(t='laranja',r=[[1590,383,1840,578],[1650,578,1840,605],[1840,455,1875,605],[1718,360,1840,383]],seg=[[1590,383,1718,383,'N'],[1718,360,1840,360,'N'],[1875,455,1875,605,'E'],[1840,383,1840,455,'E']],sac=[1592,358,1700,383,'N']),
 3:dict(t='azul',r=[[1328,383,1590,578]],seg=[[1328,383,1590,383,'N']],sac=[1482,355,1590,383,'N']),
 4:dict(t='verde',r=[[1000,383,1328,505],[1068,505,1328,578]],seg=[[1000,383,1328,383,'N']],sac=[1087,355,1252,383,'N']),
 5:dict(t='verde',r=[[668,383,1000,505],[668,505,938,578]],seg=[[668,383,1000,383,'N']],sac=[745,355,912,383,'N']),
 6:dict(t='azul',r=[[408,383,668,578]],seg=[[408,383,668,383,'N']],sac=[408,355,515,383,'N']),
 7:dict(t='vermelho',r=[[130,355,408,492],[162,492,408,578],[150,578,265,605]],seg=[[130,355,408,355,'N'],[130,355,130,492,'W'],[162,492,162,578,'W']],sac=[130,492,162,578,'W'],rec=1),
 8:dict(t='vermelho',r=[[162,632,408,718],[130,718,408,855],[150,605,265,632]],seg=[[130,855,408,855,'S'],[130,718,130,855,'W'],[162,632,162,718,'W']],sac=[130,632,162,718,'W'],rec=1),
 9:dict(t='azul',r=[[408,632,668,828]],seg=[[408,828,668,828,'S']],sac=[408,828,515,855,'S']),
 10:dict(t='azul',r=[[668,632,938,828]],seg=[[668,828,938,828,'S']],sac=[830,828,938,855,'S']),
 11:dict(t='azul',r=[[1068,632,1328,828]],seg=[[1068,828,1328,828,'S']],sac=[1068,828,1165,855,'S']),
 12:dict(t='azul',r=[[1328,632,1590,828]],seg=[[1328,828,1590,828,'S']],sac=[1485,828,1590,855,'S']),
}
CORE = [[938,505,1068,578],[938,578,1068,632],[938,632,1068,828]]
CORR = [[265,578,938,632],[1068,578,1650,632]]
TOWERS = [dict(id='A',cx=936,cy=306,mir=1), dict(id='B',cx=1560,cy=306,mir=-1)]
def S(x, y): return ((x-1250)*SITE, (y-400)*SITE)
for t in TOWERS: t['wx'], t['wz'] = S(t['cx'], t['cy'])
def pw(t, x, y): return (t['wx']+(x-1002.5)*PL*t['mir'], t['wz']+(y-605)*PL*FY)   # (X,Z) three

def B(x, y, z): return (x, -z, y)   # three -> blender

# ---------------- materiais ----------------
def srgb(h):
    c = [((h >> s) & 255)/255 for s in (16, 8, 0)]
    return tuple((v/12.92 if v <= .04045 else ((v+.055)/1.055)**2.4) for v in c) + (1,)

def pbr(name, hexcol, rough=.8, metal=0., bump=0., scale=3.):
    m = bpy.data.materials.get(name) or bpy.data.materials.new(name)
    m.use_nodes = True; nt = m.node_tree; nt.nodes.clear()
    out = nt.nodes.new('ShaderNodeOutputMaterial'); b = nt.nodes.new('ShaderNodeBsdfPrincipled')
    b.inputs['Base Color'].default_value = srgb(hexcol); b.inputs['Roughness'].default_value = rough
    b.inputs['Metallic'].default_value = metal
    nt.links.new(b.outputs[0], out.inputs[0])
    if bump > 0:  # variação leve de pintura/reboco (sujeira e textura)
        tc = nt.nodes.new('ShaderNodeTexCoord'); nz = nt.nodes.new('ShaderNodeTexNoise')
        nz.inputs['Scale'].default_value = scale; nz.inputs['Detail'].default_value = 8
        nt.links.new(tc.outputs['Object'], nz.inputs['Vector'])
        bp = nt.nodes.new('ShaderNodeBump'); bp.inputs['Strength'].default_value = bump; bp.inputs['Distance'].default_value = .02
        nt.links.new(nz.outputs['Fac'], bp.inputs['Height']); nt.links.new(bp.outputs[0], b.inputs['Normal'])
        mix = nt.nodes.new('ShaderNodeMix'); mix.data_type = 'RGBA'; mix.blend_type = 'MULTIPLY'
        mix.inputs['Factor'].default_value = .12
        nz2 = nt.nodes.new('ShaderNodeTexNoise'); nz2.inputs['Scale'].default_value = .35; nz2.inputs['Detail'].default_value = 3
        nt.links.new(tc.outputs['Object'], nz2.inputs['Vector'])
        sk = lambda socks, nm: [x for x in socks if x.name == nm and x.type == 'RGBA'][0]
        sk(mix.inputs, 'A').default_value = srgb(hexcol); nt.links.new(nz2.outputs['Color'], sk(mix.inputs, 'B'))
        nt.links.new(sk(mix.outputs, 'Result'), b.inputs['Base Color'])
    return m

def thin_glass(name, tint=0x9fb4bf, refl=.9, dark=.25):
    m = bpy.data.materials.get(name) or bpy.data.materials.new(name)
    m.use_nodes = True; nt = m.node_tree; nt.nodes.clear()
    out = nt.nodes.new('ShaderNodeOutputMaterial')
    tr = nt.nodes.new('ShaderNodeBsdfTransparent'); tr.inputs[0].default_value = tuple(v*dark for v in srgb(tint)[:3]) + (1,)
    gl = nt.nodes.new('ShaderNodeBsdfGlossy'); gl.inputs['Roughness'].default_value = .015
    gl.inputs['Color'].default_value = (refl, refl, refl, 1)
    lw = nt.nodes.new('ShaderNodeLayerWeight'); lw.inputs['Blend'].default_value = .18
    mx = nt.nodes.new('ShaderNodeMixShader')
    nt.links.new(lw.outputs['Fresnel'], mx.inputs[0]); nt.links.new(tr.outputs[0], mx.inputs[1]); nt.links.new(gl.outputs[0], mx.inputs[2])
    nt.links.new(mx.outputs[0], out.inputs[0])
    return m

def interior_mat():
    # cômodo atrás do vidro. Nó "LIGHTS" (0 apagado / 1 aceso) controla a placa de luzes.
    m = bpy.data.materials.get("BLV_Interior") or bpy.data.materials.new("BLV_Interior")
    m.use_nodes = True; nt = m.node_tree; nt.nodes.clear()
    out = nt.nodes.new('ShaderNodeOutputMaterial')
    oi = nt.nodes.new('ShaderNodeObjectInfo')
    ramp = nt.nodes.new('ShaderNodeValToRGB')  # cor do fundo do cômodo / cortina por unidade
    ramp.color_ramp.elements[0].position = .0; ramp.color_ramp.elements[0].color = (.018, .016, .014, 1)
    ramp.color_ramp.elements[1].position = .62; ramp.color_ramp.elements[1].color = (.05, .045, .04, 1)
    e = ramp.color_ramp.elements.new(.66); e.color = (.32, .30, .27, 1)
    nt.links.new(oi.outputs['Random'], ramp.inputs[0])
    dif = nt.nodes.new('ShaderNodeBsdfDiffuse'); nt.links.new(ramp.outputs[0], dif.inputs['Color'])
    em = nt.nodes.new('ShaderNodeEmission')
    bb = nt.nodes.new('ShaderNodeBlackbody'); mr = nt.nodes.new('ShaderNodeMapRange')
    mr.inputs['To Min'].default_value = 2600; mr.inputs['To Max'].default_value = 3600
    nt.links.new(oi.outputs['Random'], mr.inputs['Value']); nt.links.new(mr.outputs[0], bb.inputs[0])
    nt.links.new(bb.outputs[0], em.inputs['Color'])
    lights = nt.nodes.new('ShaderNodeValue'); lights.name = lights.label = "LIGHTS"; lights.outputs[0].default_value = 0.
    ms = nt.nodes.new('ShaderNodeMath'); ms.operation = 'MULTIPLY'; ms.inputs[1].default_value = 7.
    nt.links.new(lights.outputs[0], ms.inputs[0]); nt.links.new(ms.outputs[0], em.inputs['Strength'])
    add = nt.nodes.new('ShaderNodeAddShader')
    nt.links.new(dif.outputs[0], add.inputs[0]); nt.links.new(em.outputs[0], add.inputs[1])
    nt.links.new(add.outputs[0], out.inputs[0])
    return m

M = dict(
    light=pbr("BLV_Reboco_Claro", 0xd6d6d3, .85, bump=.25, scale=4),
    dark=pbr("BLV_Reboco_Grafite", 0x4b5058, .82, bump=.25, scale=4),
    core=pbr("BLV_Reboco_Nucleo", 0xc4c4c0, .9, bump=.2),
    slab=pbr("BLV_Laje", 0xe4e3df, .8, bump=.15),
    yellow=pbr("BLV_Friso_Amarelo", 0xd9b21f, .5),
    alu=pbr("BLV_Aluminio", 0x2b2e33, .38, .8),
    glass=thin_glass("BLV_Vidro"),
    shopglass=thin_glass("BLV_Vidro_Loja", 0x6d7a80, .8, .55),
    interior=interior_mat(),
    col=pbr("BLV_Pilar", 0x8a7b6b, .75, bump=.3),
    wood=pbr("BLV_Madeira", 0x6e4330, .65, bump=.2, scale=20),
    roof=pbr("BLV_Telha_Metalica", 0x6d7176, .5, .6),
    pipe=pbr("BLV_Chamine", 0x1f2124, .5, .4),
    paving=pbr("BLV_Piso", 0xb9b3a8, .9, bump=.3, scale=6),
    asphalt=pbr("BLV_Asfalto", 0x2c2d2f, .92, bump=.4, scale=30),
    curb=pbr("BLV_Meio_Fio", 0xc9c5bb, .85),
    paint=pbr("BLV_Faixa", 0xe8e6df, .7),
    grass=pbr("BLV_Grama", 0x4f6b2c, .95, bump=.5, scale=40),
)
# loja/área comum: vidro com interior quente (fim de tarde)
def shop_interior():
    m = bpy.data.materials.get("BLV_Loja_Interior") or bpy.data.materials.new("BLV_Loja_Interior")
    m.use_nodes = True; nt = m.node_tree; nt.nodes.clear()
    out = nt.nodes.new('ShaderNodeOutputMaterial'); em = nt.nodes.new('ShaderNodeEmission')
    em.inputs['Color'].default_value = (1., .72, .45, 1); em.inputs['Strength'].default_value = 2.2
    nt.links.new(em.outputs[0], out.inputs[0]); return m
M['shopin'] = shop_interior()

# ---------------- construtor de malhas ----------------
class MB:
    def __init__(s): s.v = []; s.f = []
    def box3(s, x0, z0, x1, z1, y0, h, inf=0.):   # caixa em coordenadas three (eixo-alinhada)
        x0, x1 = min(x0, x1)-inf, max(x0, x1)+inf; z0, z1 = min(z0, z1)-inf, max(z0, z1)+inf
        s._cube([B(x, y, z) for (x, y, z) in [(x0,y0,z0),(x1,y0,z0),(x1,y0,z1),(x0,y0,z1),(x0,y0+h,z0),(x1,y0+h,z0),(x1,y0+h,z1),(x0,y0+h,z1)]])
    def rect(s, t, r, y0, h, inf=0.):
        a, b = pw(t, r[0], r[1]), pw(t, r[2], r[3]); s.box3(a[0], a[1], b[0], b[1], y0, h, inf)
    def obox(s, o, u, n, u0, u1, v0, v1, d0, d1):   # caixa orientada: origem o (three), eixo u (horiz.), normal n
        P = lambda a, v, d: B(o[0]+u[0]*a+n[0]*d, v, o[1]+u[1]*a+n[1]*d)
        s._cube([P(u0,v0,d0),P(u1,v0,d0),P(u1,v0,d1),P(u0,v0,d1),P(u0,v1,d0),P(u1,v1,d0),P(u1,v1,d1),P(u0,v1,d1)])
    def oquad(s, o, u, n, u0, u1, v0, v1, d):
        P = lambda a, v: B(o[0]+u[0]*a+n[0]*d, v, o[1]+u[1]*a+n[1]*d)
        b = len(s.v); s.v += [P(u0,v0), P(u1,v0), P(u1,v1), P(u0,v1)]; s.f.append((b, b+1, b+2, b+3))
    def _cube(s, p):
        b = len(s.v); s.v += p
        s.f += [(b,b+3,b+2,b+1),(b+4,b+5,b+6,b+7),(b,b+1,b+5,b+4),(b+1,b+2,b+6,b+5),(b+2,b+3,b+7,b+6),(b+3,b,b+4,b+7)]
    def build(s, name, mat, col):
        if not s.v: return None
        me = bpy.data.meshes.new(name); me.from_pydata(s.v, [], s.f); me.update()
        me.materials.append(mat)
        ob = bpy.data.objects.new(name, me); col.objects.link(ob); return ob

def acc(): return {}
def get(d, k):
    if k not in d: d[k] = MB()
    return d[k]

unit_ids = {}
for ti, t in enumerate(TOWERS):
    T = t['id']; A = {}
    allr = [r for u in U.values() for r in u['r']] + CORE + CORR
    # ---- térreo (lojas) e 2º pavimento (área comum) ----
    for r in allr:
        get(A, 'shopglass').rect(t, r, 0, GH, -0.9); get(A, 'shopin').rect(t, r, 0, GH-.05, -1.05)
        get(A, 'shopglass').rect(t, r, GH, CH-.3, -.25); get(A, 'shopin').rect(t, r, GH+.05, CH-.4, -.4)
        get(A, 'slab').rect(t, r, BASE-.3, .3, .05); get(A, 'slab').rect(t, r, GH-.3, .3, .05)
    for x in range(150, 1861, 170):
        for y in (383, 828):
            w = pw(t, x, y); get(A, 'col').box3(w[0]-.225, w[1]-.225, w[0]+.225, w[1]+.225, 0, GH)
    for s in ([150,383,1860,383], [150,828,1860,828]):
        a, b = pw(t, s[0], s[1]), pw(t, s[2], s[3])
        get(A, 'light').box3(min(a[0],b[0]), a[1]-.35, max(a[0],b[0]), a[1]+.35, GH-1.0, .7)
        for x in range(s[0]+42, s[2], 85):
            w = pw(t, x, s[1]); get(A, 'alu').box3(w[0]-.06, w[1]-.06, w[0]+.06, w[1]+.06, 0, GH-1.)
        dz = -.26 if s[1] == 383 else .26
        for x in range(s[0], s[2]+1, 60):
            w = pw(t, x, s[1]); get(A, 'alu').box3(w[0]-.05, w[1]+dz-.05, w[0]+.05, w[1]+dz+.05, GH, CH-.3)
    a, b = pw(t, 900, 828), pw(t, 1110, 900)
    for i in range(8):
        z = a[1]+(b[1]-a[1])*i/7; get(A, 'wood').box3(a[0], z-.06, b[0], z+.06, 3.3-.09, .18)
    for p in ((a[0], b[1]), (b[0], b[1])): get(A, 'wood').box3(p[0]-.175, p[1]-.175, p[0]+.175, p[1]+.175, 0, 3.3)

    # ---- andares ----
    for f in range(1, NF+1):
        y0 = BASE+(f-1)*FH
        for r in allr: get(A, 'slab').rect(t, r, y0+FH-.2, .2, .06)
        for r in CORE+CORR: get(A, 'core').rect(t, r, y0, FH-.2, -.02)
        if f % 2 == 0:
            for n in (3,4,5,6,9,10,11,12):
                s = U[n]['seg'][0]; a, b = pw(t, s[0], s[1]), pw(t, s[2], s[3]); dz = (-1 if s[4]=='N' else 1)*FY
                get(A, 'yellow').box3(a[0], a[1]+dz*.08, b[0], a[1]+dz*.11, y0+FH-.26, .05)
        for n, u in U.items():
            isEnd = n in (1, 2, 7, 8); wm = 'dark' if isEnd else 'light'
            for r in u['r']: get(A, wm).rect(t, r, y0, FH-.2, -.01)
            uid = (ti+1)*10000 + f*100 + n; unit_ids[f"{T}{f}{n:02d}"] = uid
            UI = MB()   # interior desta unidade (objeto próprio -> máscara de ID / luz por unidade)
            sac = u.get('sac')
            for s in u['seg']:
                a, b = pw(t, s[0], s[1]), pw(t, s[2], s[3]); Ln = math.hypot(b[0]-a[0], b[1]-a[1])
                if Ln < 1.2: continue
                nx = nz = 0
                if s[4] == 'N': nz = -FY
                if s[4] == 'S': nz = FY
                if s[4] == 'E': nx = t['mir']
                if s[4] == 'W': nx = -t['mir']
                cnt = max(1, round(Ln/2.75))
                for i in range(cnt):
                    tt = (i+.5)/cnt; px = s[0]+(s[2]-s[0])*tt; py = s[1]+(s[3]-s[1])*tt; door = False
                    if sac and sac[4] == s[4]:
                        if s[4] in 'NS' and sac[0]-10 <= px <= sac[2]+10: door = True
                        if s[4] in 'WE' and sac[1]-6 <= py <= sac[3]+6: door = True
                    w = pw(t, px, py)
                    ww = 1.7 if door else (1.0 if isEnd else 1.25); hh = 2.2 if door else 1.3
                    cy = y0+.05+1.1 if door else y0+1.05+.65
                    nv = (nx, nz); uv = (nz, -nx)   # eixo horizontal da janela
                    hw, hv = ww/2, hh/2; fr = .05
                    UI.oquad(w, uv, nv, -hw+fr, hw-fr, cy-hv+fr, cy+hv-fr, .0)          # cômodo
                    get(A, 'glass').oquad(w, uv, nv, -hw+fr, hw-fr, cy-hv+fr, cy+hv-fr, .035)  # vidro
                    g = get(A, 'alu')                                                     # caixilho
                    g.obox(w, uv, nv, -hw, hw, cy+hv-fr, cy+hv, 0, .07); g.obox(w, uv, nv, -hw, hw, cy-hv, cy-hv+fr, 0, .07)
                    g.obox(w, uv, nv, -hw, -hw+fr, cy-hv, cy+hv, 0, .07); g.obox(w, uv, nv, hw-fr, hw, cy-hv, cy+hv, 0, .07)
                    if ww > 1.1: g.obox(w, uv, nv, -.02, .02, cy-hv, cy+hv, .02, .06)
                    rv = get(A, wm)                                                       # requadro (sombra de recuo)
                    rv.obox(w, uv, nv, -hw-.09, hw+.09, cy+hv, cy+hv+.09, 0, .13)
                    rv.obox(w, uv, nv, -hw-.09, -hw, cy-hv, cy+hv, 0, .13); rv.obox(w, uv, nv, hw, hw+.09, cy-hv, cy+hv, 0, .13)
                    if not door: get(A, 'slab').obox(w, uv, nv, -hw-.09, hw+.09, cy-hv-.05, cy-hv, 0, .16)
            ob = UI.build(f"UN_{T}{f}{n:02d}", M['interior'], C_UNITS)
            if ob: ob.pass_index = uid; ob['unit'] = f"{T}{f}{n:02d}"
            if sac:
                a, b = pw(t, sac[0], sac[1]), pw(t, sac[2], sac[3])
                x0, x1, z0, z1 = min(a[0],b[0]), max(a[0],b[0]), min(a[1],b[1]), max(a[1],b[1])
                if not u.get('rec'): get(A, 'slab').box3(x0, z0, x1, z1, y0-.02, .16)
                d = sac[4]
                if d == 'N': g0, g1 = (x0, z0 if FY > 0 else z1), (x1, z0 if FY > 0 else z1)
                elif d == 'S': g0, g1 = (x0, z1 if FY > 0 else z0), (x1, z1 if FY > 0 else z0)
                else:
                    xe = x0 if ((d == 'W') == (t['mir'] > 0)) else x1; g0, g1 = (xe, z0), (xe, z1)
                L = math.hypot(g1[0]-g0[0], g1[1]-g0[1]); ux, uz = (g1[0]-g0[0])/L, (g1[1]-g0[1])/L
                o = ((g0[0]+g1[0])/2, (g0[1]+g1[1])/2); uv = (ux, uz); nv = (uz, -ux); yb = y0+.14
                g = get(A, 'alu')
                for k in range(9): g.obox(o, uv, nv, -L/2, L/2, yb+.06+k*.115, yb+.06+k*.115+.075, -.015, .015)   # réguas
                g.obox(o, uv, nv, -L/2, L/2, yb+1.06, yb+1.1, -.03, .03)                                      # corrimão
                np_ = max(2, round(L/1.3)+1)
                for k in range(np_):
                    a_ = -L/2+L*k/(np_-1); g.obox(o, uv, nv, a_-.025, a_+.025, yb, yb+1.06, -.025, .025)        # montantes
    # ---- cobertura ----
    yT = BASE+NF*FH
    for r in allr: get(A, 'slab').rect(t, r, yT, 1.0, .04)
    for r in allr: get(A, 'roof').rect(t, r, yT+.98, .04, -.3)
    get(A, 'light').rect(t, [925,470,1080,650], yT+1, 5.6)
    get(A, 'slab').rect(t, [915,460,1090,660], yT+6.6, .35)
    get(A, 'light').rect(t, [940,660,1065,828], yT+1, 3.0)
    for u in U.values():
        s = u.get('sac')
        if not s: continue
        px = s[2]-8 if s[4] in 'NS' else (s[0]+s[2])/2
        py = s[3]+6 if s[4] == 'N' else (s[1]-6 if s[4] == 'S' else (s[1]+s[3])/2)
        w = pw(t, px, py)
        get(A, 'pipe').box3(w[0]-.15, w[1]-.15, w[0]+.15, w[1]+.15, yT+1, 2.6)
        get(A, 'pipe').box3(w[0]-.23, w[1]-.23, w[0]+.23, w[1]+.23, yT+3.5, .16)
    for k, mb in A.items(): mb.build(f"BLV_{T}_{k}", M[k], C_BLD)

# ---------------- lote, avenida, entorno ----------------
SM = {}
get(SM, 'paving').box3(-80, -40, 80, 36, -.05, .05)
AVZ = (856-400)*SITE      # eixo da avenida (z three)
get(SM, 'asphalt').box3(-700, AVZ-8, 700, AVZ+8, -.06, .06)
for side in (-1, 1):
    get(SM, 'curb').box3(-700, AVZ+side*8-.15, 700, AVZ+side*8+.15, -.06, .2)
    get(SM, 'paving').box3(-700, AVZ+side*(8.15+1.6)-1.6, 700, AVZ+side*(8.15+1.6)+1.6, -.05, .17)
for x in range(-700, 700, 9): get(SM, 'paint').box3(x, AVZ-.07, x+4.5, AVZ+.07, 0, .005)
for k, mb in SM.items(): mb.build(f"BLV_lote_{k}", M[k], C_SITE)

# grama (chão grande)
bpy.ops.mesh.primitive_plane_add(size=3000, location=(0, 0, -.08)); g = bpy.context.active_object
g.name = "BLV_chao"; g.data.materials.append(M['grass'])
for c in g.users_collection: c.objects.unlink(g)
C_ENV.objects.link(g)

# morro ao fundo (leste = -z three = +y blender): relevo procedural de mata
mt = pbr("BLV_Mata", 0x2f4321, .95)
nt = mt.node_tree; bsdf = nt.nodes['Principled BSDF']
tc = nt.nodes.new('ShaderNodeTexCoord'); nz = nt.nodes.new('ShaderNodeTexNoise'); nz.inputs['Scale'].default_value = .02; nz.inputs['Detail'].default_value = 10
nt.links.new(tc.outputs['Object'], nz.inputs['Vector'])
rp = nt.nodes.new('ShaderNodeValToRGB'); rp.color_ramp.elements[0].color = srgb(0x22331a); rp.color_ramp.elements[1].color = srgb(0x55663a)
nt.links.new(nz.outputs['Fac'], rp.inputs[0]); nt.links.new(rp.outputs[0], bsdf.inputs['Base Color'])
N = 140; SZ = 3200; verts = []; faces = []
for j in range(N+1):
    for i in range(N+1):
        x = -SZ/2+SZ*i/N; y = 250+SZ*.75*j/N
        h = 0.
        for (cx, cy, r, a) in ((-200, 900, 420, 330), (500, 1300, 600, 260), (-900, 1500, 700, 300), (1200, 900, 500, 180)):
            d = math.hypot(x-cx, y-cy); h += a*math.exp(-(d/r)**2)
        h += 40*noise.noise(Vector((x*.004, y*.004, 0)))+12*noise.noise(Vector((x*.02, y*.02, 1)))
        h *= min(1, max(0, (y-250)/350))
        verts.append((x, y, max(0, h)))
for j in range(N):
    for i in range(N):
        a = j*(N+1)+i; faces.append((a, a+1, a+N+2, a+N+1))
me = bpy.data.meshes.new("BLV_morro"); me.from_pydata(verts, [], faces); me.update()
for p in me.polygons: p.use_smooth = True
me.materials.append(mt); ob = bpy.data.objects.new("BLV_morro", me); C_ENV.objects.link(ob)

# árvores simples na calçada (instâncias)
leaf = pbr("BLV_Folhagem", 0x3d5a24, .7)
bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=3, radius=2.6); crown = bpy.context.active_object; crown.name = "BLV_arvore_copa"
dm = crown.modifiers.new("d", 'DISPLACE'); tx = bpy.data.textures.new("BLV_copa_tex", 'CLOUDS'); tx.noise_scale = .9; dm.texture = tx; dm.strength = 1.4
crown.data.materials.append(leaf); bpy.ops.object.shade_smooth()
bpy.ops.mesh.primitive_cylinder_add(vertices=8, radius=.18, depth=6.4, location=(0, 0, -3.2)); trunk = bpy.context.active_object
trunk.data.materials.append(pbr("BLV_Tronco", 0x4a3a2a, .9)); trunk.parent = crown
for o in (crown, trunk):
    for c in o.users_collection: c.objects.unlink(o)
    C_ENV.objects.link(o)
crown.location = (0, -2000, 0); crown.hide_render = False
random.seed(3)
for x in range(-120, 121, 14):
    for zz in (AVZ-10.5, AVZ+10.5):
        if random.random() < .15: continue
        c2 = crown.copy(); t2 = trunk.copy(); t2.parent = c2; s = .8+random.random()*.5
        c2.location = B(x+random.uniform(-2, 2), 6.2*s, zz); c2.scale = (s, s, s*1.1); c2.rotation_euler[2] = random.random()*6.28
        C_ENV.objects.link(c2); C_ENV.objects.link(t2)
crown.hide_render = trunk.hide_render = True; crown.hide_set(True); trunk.hide_set(True)

# ---------------- luz, câmera, render ----------------
el, az = math.radians(7.), math.radians(260.)     # 16/out, ~18h15, Palhoça: sol a OSO, baixo
# blender: norte=-x, leste=+y
sd = Vector((-math.cos(az)*math.cos(el), math.sin(az)*math.cos(el), math.sin(el))).normalized()
sun_d = bpy.data.lights.new("BLV_Sol", 'SUN'); sun_d.energy = 3.2; sun_d.angle = math.radians(.6)
sun_d.color = (1., .66, .40)
sun = bpy.data.objects.new("BLV_Sol", sun_d); C_ENV.objects.link(sun)
sun.rotation_euler = sd.to_track_quat('Z', 'Y').to_euler()

w = bpy.data.worlds.get("BLV_Ceu") or bpy.data.worlds.new("BLV_Ceu"); scn.world = w; w.use_nodes = True
wt = w.node_tree; wt.nodes.clear()
sky = wt.nodes.new('ShaderNodeTexSky'); bg = wt.nodes.new('ShaderNodeBackground'); wo = wt.nodes.new('ShaderNodeOutputWorld')
types = [i.identifier for i in sky.bl_rna.properties['sky_type'].enum_items]
for pref in ('MULTIPLE_SCATTERING', 'NISHITA', 'SINGLE_SCATTERING', 'HOSEK_WILKIE'):
    if pref in types: sky.sky_type = pref; break
try:
    sky.sun_disc = False; sky.sun_elevation = el; sky.sun_rotation = math.atan2(sd.y, sd.x) - math.pi/2
    sky.altitude = 30; sky.air_density = 1.; sky.dust_density = 2.2
except Exception: pass
bg.inputs['Strength'].default_value = .32
wt.links.new(sky.outputs[0], bg.inputs[0]); wt.links.new(bg.outputs[0], wo.inputs[0])

cd = bpy.data.cameras.new("BLV_Cam"); cd.sensor_fit = 'VERTICAL'; cd.angle = math.radians(36); cd.clip_end = 6000
cam = bpy.data.objects.new("BLV_Cam_Abertura", cd); C_ENV.objects.link(cam)
a = .05; cam.location = B(165*math.sin(a), 13, -10+165*math.cos(a))
tgt = Vector(B(8*math.sin(a), 27, -10))
cam.rotation_euler = (tgt - cam.location).to_track_quat('-Z', 'Y').to_euler()
scn.camera = cam

r = scn.render; r.engine = 'CYCLES'; r.resolution_x, r.resolution_y = 1920, 1080; r.resolution_percentage = 50
cy = scn.cycles; cy.device = 'GPU'; cy.samples = 96; cy.use_denoising = True; cy.use_adaptive_sampling = True
try: cy.denoiser = 'OPENIMAGEDENOISE'
except Exception: pass
scn.view_settings.view_transform = 'AgX'
try: scn.view_settings.look = 'AgX - Medium High Contrast'
except Exception: pass
scn.view_settings.exposure = 0.
scn.view_layers[0].use_pass_object_index = True

result = dict(units=len(unit_ids), objects=len(scn.objects), sky=sky.sky_type,
              verts=sum(len(o.data.vertices) for o in scn.objects if o.type == 'MESH'))
