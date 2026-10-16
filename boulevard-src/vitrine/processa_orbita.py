import sys, os, json, random
import numpy as np
from PIL import Image
SRC, OUT = sys.argv[1], sys.argv[2]
os.makedirs(f"{OUT}/q", exist_ok=True)
lin = lambda x: np.where(x <= .04045, x/12.92, ((x+.055)/1.055)**2.4)
degs = sorted({int(f[:3]) for f in os.listdir(SRC) if f.endswith('_base.png')})
units = json.load(open(f"{SRC}/unidades.json"))
counts = {}; visible = []; W = H = None
for deg in degs:
    b = Image.open(f"{SRC}/{deg:03d}_base.png").convert('RGB'); l = Image.open(f"{SRC}/{deg:03d}_luzes.png").convert('RGB')
    m = np.asarray(Image.open(f"{SRC}/{deg:03d}_mascara.png")).astype(np.int32)
    W, H = b.size
    ids = np.where(m[..., 2] == 255, m[..., 0]+m[..., 1]*256, 0)
    d = (lin(np.asarray(l, np.float32)/255)-lin(np.asarray(b, np.float32)/255)).max(-1)
    need = d > .006; cur = ids.copy()
    for _ in range(16):
        z = (cur == 0) & need
        if not z.any(): break
        nb = np.zeros_like(cur)
        for dy, dx in ((1,0),(-1,0),(0,1),(0,-1),(1,1),(-1,-1),(1,-1),(-1,1)):
            sh = np.roll(np.roll(cur, dy, 0), dx, 1); nb = np.where((nb == 0) & (sh > 0), sh, nb)
        cur = np.where(z & (nb > 0), nb, cur)
    out = np.zeros((H, W, 3), np.uint8); out[..., 0] = cur % 256; out[..., 1] = cur//256; out[..., 2] = np.where(cur > 0, 255, 0)
    Image.fromarray(out).save(f"{OUT}/q/{deg:03d}_m.png", optimize=True)
    b.save(f"{OUT}/q/{deg:03d}_b.jpg", quality=82, optimize=True, progressive=True)
    l.save(f"{OUT}/q/{deg:03d}_l.jpg", quality=82, optimize=True, progressive=True)
    u, c = np.unique(ids[ids > 0], return_counts=True)
    visible.append([int(x) for x in u])
    for x, n in zip(u, c): counts.setdefault(int(x), {})[deg] = int(n)
best = {units[str(i)]: max(v, key=v.get) for i, v in counts.items()}
rnd = random.Random(2027); tab = {}
for k, name in units.items():
    r = rnd.random(); tab[name] = 'vendido' if r < .62 else ('reservado' if r < .72 else 'disponivel')
frames = [f"{d:03d}" for d in degs]
best = {k: f"{v:03d}" for k, v in best.items()}
json.dump({"frames": frames, "w": W, "h": H, "units": units, "best": best, "visible": visible, "exemplo": tab}, open(f"{OUT}/dados.json", "w"), ensure_ascii=False)
print(len(degs), "quadros;", len(best), "unidades aparecem em algum ângulo;", sum(os.path.getsize(f"{OUT}/q/{f}") for f in os.listdir(f"{OUT}/q"))//1024, "KB")
