# Boulevard em 3D -> lojas: remove paredes laterais que caíam exatamente no plano do vidro
# (lojas das pontas e quinas do "L"); de fora elas apareciam como parede branca atrás da vitrine.
import bpy, bmesh
from mathutils import Vector

G = bpy.data.objects["BLV_site_shopglass"]; gm = G.matrix_world
planes = []
for p in G.data.polygons:
    n = (gm.to_3x3()@p.normal).normalized()
    if abs(n.z) < .3 and p.area > 3:
        planes.append((gm@p.center, n, [gm@G.data.vertices[i].co for i in p.vertices]))

def dist_vidro(c, nrm):
    best = 9e9
    for pc, pn, vs in planes:
        if abs(nrm.dot(pn)) < .9: continue
        t = Vector((-pn.y, pn.x, 0)); proj = [(v-pc).dot(t) for v in vs]; s = (c-pc).dot(t)
        if min(proj)-.5 <= s <= max(proj)+.5: best = min(best, abs((c-pc).dot(pn)))
    return best

removidas = []
for i in range(21):
    o = bpy.data.objects[f"BLV_loja{i:02d}_paredes"]; mw = o.matrix_world
    bm = bmesh.new(); bm.from_mesh(o.data); seen = set(); kill = []
    for f in bm.faces:
        if f.index in seen: continue
        st = [f]; cur = []
        while st:
            g = st.pop()
            if g.index in seen: continue
            seen.add(g.index); cur.append(g)
            for e in g.edges:
                for h in e.link_faces:
                    if h.index not in seen: st.append(h)
        vs = [mw@v.co for g in cur for v in g.verts]; c = sum(vs, Vector())/len(vs)
        big = max(cur, key=lambda g: g.calc_area()); nrm = (mw.to_3x3()@big.normal).normalized()
        if abs(nrm.z) < .3 and dist_vidro(c, nrm) < .8: kill += cur
    if kill:
        bmesh.ops.delete(bm, geom=list({id(f): f for f in kill}.values()), context='FACES')
        bm.to_mesh(o.data); removidas.append(f"{i:02d}")
    bm.free()
result = dict(lojas_ajustadas=removidas)
