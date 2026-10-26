"""Reescreve as imagens de um .glb (JPEG/PNG -> JPEG menor), sem tocar na geometria (Draco fica como está).

  python3 glb_texturas.py entrada.glb saida.glb [lado_max=1024] [qualidade=80]

PNG com transparência real continua PNG (só reduz). Normal maps e mapas de rugosidade vão em JPEG também.
"""
import io
import json
import struct
import sys

from PIL import Image


def ler(p):
    b = open(p, 'rb').read()
    assert b[:4] == b'glTF'
    n = 12
    js = bin_ = None
    while n < len(b):
        ln, tp = struct.unpack_from('<I4s', b, n)
        ch = b[n + 8:n + 8 + ln]
        if tp == b'JSON':
            js = json.loads(ch)
        elif tp == b'BIN\x00':
            bin_ = ch
        n += 8 + ln
    return js, bin_


def escrever(p, js, bin_):
    j = json.dumps(js, separators=(',', ':')).encode()
    j += b' ' * ((4 - len(j) % 4) % 4)
    bin_ += b'\x00' * ((4 - len(bin_) % 4) % 4)
    tot = 12 + 8 + len(j) + 8 + len(bin_)
    with open(p, 'wb') as f:
        f.write(struct.pack('<4sII', b'glTF', 2, tot))
        f.write(struct.pack('<I4s', len(j), b'JSON') + j)
        f.write(struct.pack('<I4s', len(bin_), b'BIN\x00') + bin_)


def main():
    src, dst = sys.argv[1], sys.argv[2]
    lado = int(sys.argv[3]) if len(sys.argv) > 3 else 1024
    q = int(sys.argv[4]) if len(sys.argv) > 4 else 80
    js, b = ler(src)
    views = js['bufferViews']
    novo = {}
    for im in js.get('images', []):
        if 'bufferView' not in im:
            continue
        v = views[im['bufferView']]
        raw = b[v.get('byteOffset', 0):v.get('byteOffset', 0) + v['byteLength']]
        I = Image.open(io.BytesIO(raw))
        alpha = I.mode in ('RGBA', 'LA') and I.getchannel('A').getextrema()[0] < 250
        I = I.convert('RGBA' if alpha else 'RGB')
        if max(I.size) > lado:
            s = lado / max(I.size)
            I = I.resize((max(1, round(I.width * s)), max(1, round(I.height * s))), Image.LANCZOS)
        out = io.BytesIO()
        if alpha:
            I.save(out, 'PNG', optimize=True)
            im['mimeType'] = 'image/png'
        else:
            I.save(out, 'JPEG', quality=q, optimize=True, progressive=True)
            im['mimeType'] = 'image/jpeg'
        novo[im['bufferView']] = out.getvalue()
    # remonta o BIN na ordem das bufferViews, alinhado a 4 bytes
    nb = bytearray()
    for i, v in enumerate(views):
        o = v.get('byteOffset', 0)
        data = novo.get(i, b[o:o + v['byteLength']])
        nb += b'\x00' * ((4 - len(nb) % 4) % 4)
        v['byteOffset'] = len(nb)
        v['byteLength'] = len(data)
        nb += data
    js['buffers'][0]['byteLength'] = len(nb)
    escrever(dst, js, bytes(nb))
    print(f'{src}: {len(b) / 1e6:.1f} MB -> {dst}: {len(nb) / 1e6:.1f} MB ({len(novo)} imagens)')


if __name__ == '__main__':
    main()
