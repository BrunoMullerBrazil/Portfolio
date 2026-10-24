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
# Pedra Branca: geo (N 2589, E -2267) = rumo 319°. No site o paredão fica nos fundos, rumo ~57° (frame do site).
A = math.radians(319-57)
def dem_rot(nn, e):
    gn = nn*math.cos(A)-e*math.sin(A); ge = nn*math.sin(A)+e*math.cos(A)
    return raw(gn, ge)
ns['blv_dem'] = dem_rot
d = math.hypot(2589, 2267); bt = math.radians(57)
result = {"base_elev": round(base, 1), "peak_check": round(dem_rot(d*math.cos(bt), d*math.sin(bt)), 1)}
