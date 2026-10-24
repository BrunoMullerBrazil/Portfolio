# Remontagem 00 -> baixa todos os assets CC0 (Poly Haven) e o relevo real (AWS Terrarium) para ~/Movies/Boulevard_3D/assets
# Roda em thread; acompanhar com bpy.app.driver_namespace['blv_dl'] (done/err/running/bytes).
import json, urllib.request, ssl, os, threading, math, bpy
ROOT = os.path.expanduser("~/Movies/Boulevard_3D/assets"); os.makedirs(ROOT, exist_ok=True)
CTX = ssl._create_unverified_context(); UA = {"User-Agent": "BoulevardRender/1.0"}
def op(u): return urllib.request.urlopen(urllib.request.Request(u, headers=UA), timeout=180, context=CTX)
def getj(u): return json.loads(op(u).read())
def dl(u, path):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    if os.path.exists(path) and os.path.getsize(path) > 0: return 0
    data = op(u).read(); open(path + ".part", 'wb').write(data); os.replace(path + ".part", path); return len(data)
HDRIS = ["kiara_1_dawn", "belfast_sunset", "the_sky_is_on_fire", "industrial_sunset_puresky"]
TEX = ["white_plaster_02", "grey_plaster", "asphalt_02", "concrete_floor_02", "large_floor_tiles_02", "leafy_grass",
       "corrugated_iron", "clay_roof_tiles_02", "ceramic_roof_01"]
MODELS = ["jacaranda_tree", "island_tree_01", "island_tree_02", "tree_small_02", "shrub_01", "potted_plant_02", "boulder_01"]
# relevo: 5x5 tiles z14 em torno das torres
LAT0, LON0, Z = -27.6340, -48.6822, 14
def tile_xy(lat, lon, z):
    n = 2**z; x = (lon+180)/360*n; lr = math.radians(lat); y = (1-math.asinh(math.tan(lr))/math.pi)/2*n; return x, y
cx, cy = tile_xy(LAT0, LON0, Z); tx0, ty0 = int(cx)-2, int(cy)-2
D = f"{ROOT}/dem"
bpy.app.driver_namespace['blv_dem_meta'] = dict(Z=Z, tx0=tx0, ty0=ty0, cx=cx, cy=cy, LAT0=LAT0, LON0=LON0, D=D)
st = bpy.app.driver_namespace.setdefault('blv_dl', {}); st.update(done=[], err=[], bytes=0, running=True)
def work():
    try:
        for j in range(5):
            for i in range(5):
                try: st['bytes'] += dl(f"https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{Z}/{tx0+i}/{ty0+j}.png", f"{D}/{Z}_{tx0+i}_{ty0+j}.png")
                except Exception as e: st['err'].append(("dem", str(e)))
        st['done'].append("dem")
        for h in HDRIS:
            try:
                f = getj(f"https://api.polyhaven.com/files/{h}"); st['bytes'] += dl(f['hdri']['4k']['hdr']['url'], f"{ROOT}/hdri/{h}_4k.hdr"); st['done'].append(h)
            except Exception as e: st['err'].append((h, str(e)))
        try:   # cômodos para as janelas (paralaxe): 4 HDRIs de interior mais baixados
            ind = getj("https://api.polyhaven.com/assets?t=hdris&c=indoor")
            top = [k for k, v in sorted(ind.items(), key=lambda x: -x[1].get('download_count', 0)) if 'studio' not in k][:4]
            for h in top:
                f = getj(f"https://api.polyhaven.com/files/{h}"); st['bytes'] += dl(f['hdri']['1k']['hdr']['url'], f"{ROOT}/hdri/indoor_{h}_1k.hdr")
            st['done'].append("indoor")
        except Exception as e: st['err'].append(("indoor", str(e)))
        for t in TEX:
            try:
                f = getj(f"https://api.polyhaven.com/files/{t}")
                for key, fn in (("Diffuse", "diff"), ("nor_gl", "nor"), ("Rough", "rough"), ("Displacement", "disp")):
                    if key in f and "2k" in f[key]:
                        u = f[key]["2k"]['jpg']['url'] if 'jpg' in f[key]["2k"] else list(f[key]["2k"].values())[0]['url']
                        st['bytes'] += dl(u, f"{ROOT}/tex/{t}/{t}_{fn}.jpg")
                st['done'].append(t)
            except Exception as e: st['err'].append((t, str(e)))
        for m in MODELS:
            try:
                f = getj(f"https://api.polyhaven.com/files/{m}"); b = f['blend']['2k']['blend']
                st['bytes'] += dl(b['url'], f"{ROOT}/models/{m}/{m}.blend")
                for rel, inf in b.get('include', {}).items(): st['bytes'] += dl(inf['url'], f"{ROOT}/models/{m}/{rel}")
                st['done'].append(m)
            except Exception as e: st['err'].append((m, str(e)))
    finally: st['running'] = False
threading.Thread(target=work, daemon=True).start()
result = {"started": True, "root": ROOT, "tiles": (tx0, ty0)}
