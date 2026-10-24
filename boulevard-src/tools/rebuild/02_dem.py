# Remontagem 02 (turnos 44-46): decodifica os tiles Terrarium em ~/Movies/Boulevard_3D/assets/dem e publica
# bpy.app.driver_namespace['blv_dem'](norte_m, leste_m) já GIRADO para o frame do site (paredão nos fundos, rumo ~57°).
# Rodar ANTES de blender_site.py (que lê blv_dem).
import bpy, os, math
import numpy as np
ns = bpy.app.driver_namespace; M = ns['blv_dem_meta']
Z, tx0, ty0, D = M['Z'], M['tx0'], M['ty0'], M['D']
big = np.zeros((5*256, 5*256), dtype=np.float64)
for j in range(5):
    for i in range(5):
        p = f"{D}/{Z}_{tx0+i}_{ty0+j}.png"
        im = bpy.data.images.load(p); im.colorspace_settings.name = 'Non-Color'
        a = np.empty(256*256*4, dtype=np.float32); im.pixels.foreach_get(a); a = a.reshape(256, 256, 4)[::-1]
        rgb = np.round(a[..., :3]*255.)
        big[j*256:(j+1)*256, i*256:(i+1)*256] = rgb[..., 0]*256+rgb[..., 1]+rgb[..., 2]/256-32768
        bpy.data.images.remove(im)
n = 2**Z
def px_of(lat, lon):
    x = (lon+180)/360*n; y = (1-math.asinh(math.tan(math.radians(lat)))/math.pi)/2*n
    return (x-tx0)*256, (y-ty0)*256
LAT0, LON0 = M['LAT0'], M['LON0']
sx, sy = px_of(LAT0, LON0)
mlat = 111320.; mlon = 111320.*math.cos(math.radians(LAT0))
ex, ey = px_of(LAT0, LON0+1000/mlon); nx_, ny_ = px_of(LAT0+1000/mlat, LON0)
ppm_e = (ex-sx)/1000.; ppm_n = (ny_-sy)/1000.
def samp(px, py):
    px = min(max(px, 0), big.shape[1]-2.001); py = min(max(py, 0), big.shape[0]-2.001)
    i, j = int(px), int(py); fx, fy = px-i, py-j
    return (big[j, i]*(1-fx)*(1-fy)+big[j, i+1]*fx*(1-fy)+big[j+1, i]*(1-fx)*fy+big[j+1, i+1]*fx*fy)
base = samp(sx, sy)
def raw(north, east): return samp(sx+east*ppm_e, sy+north*ppm_n)-base
ns['blv_dem_raw'] = raw
# Encaixe geográfico real (24/out, lote marcado pelo Bruno no mapa OSM): o eixo X do Blender (avenida da frente)
# aponta para o rumo 29°; rótula do site = rótula real. real(E,N) = Rot(61°)·(X,Y) + (28.2, -45.7) m em relação a LAT0/LON0.
GEO = ns.get('blv_geo') or dict(rot=61., off=(28.2, -45.7)); ns['blv_geo'] = GEO
cr, sr = math.cos(math.radians(GEO['rot'])), math.sin(math.radians(GEO['rot']))
def bl2geo(X, Y): return cr*X-sr*Y+GEO['off'][0], sr*X+cr*Y+GEO['off'][1]      # (E, N)
def dem_true(n, e):          # blv_dem recebe (norte_site, leste_site) = (-X, Y)
    E, Nn = bl2geo(-n, e); return raw(Nn, E)
ns['blv_dem'] = dem_true
pe, pn = -2267., 2589.       # pico da Pedra Branca (geo, m)
X = cr*(pe-GEO['off'][0])+sr*(pn-GEO['off'][1]); Y = -sr*(pe-GEO['off'][0])+cr*(pn-GEO['off'][1])
result = {"base_elev": round(base, 1), "pico_blender": (round(X), round(Y)), "pico_alt": round(dem_true(-X, Y), 1)}
