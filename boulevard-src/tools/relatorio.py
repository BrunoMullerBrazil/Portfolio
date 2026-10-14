#!/usr/bin/env python3
"""Lê relatórios de acompanhamento da Scire (PDF) e prepara o Diário da obra.

Uso:
  python3 boulevard-src/tools/relatorio.py caminho/relatorio1.pdf [relatorio2.pdf ...]

Para cada PDF:
  - lê a "Data base" (mês da medição) e o percentual executado;
  - extrai as fotos das páginas "Cada imagem conta uma história" na resolução original,
    em public/boulevard/obra/AAAAMM-N.jpg (no máximo 1400 px no lado maior);
  - lê a legenda de cada foto (bloco + texto) pela posição na página;
  - grava miniaturas em public/boulevard/obra/t/ para a grade do diário;
  - cria ou atualiza o mês em boulevard-src/obra.json, sem apagar o estado do 3D
    (campos A/B) nem textos já revisados à mão.

Depois de rodar: revisar legendas e preencher A/B (estado de cada bloco) no obra.json,
e rodar build.py. Requer: pdfplumber, Pillow, poppler-utils (pdfimages).
"""
import json, os, re, subprocess, sys, tempfile, glob
import pdfplumber
from PIL import Image

ROOT = os.path.normpath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..'))
OBRA_JSON = os.path.join(ROOT, 'boulevard-src', 'obra.json')
FOTOS = os.path.join(ROOT, 'public', 'boulevard', 'obra')
MES = {'janeiro': 1, 'fevereiro': 2, 'março': 3, 'marco': 3, 'abril': 4, 'maio': 5, 'junho': 6, 'julho': 7,
       'agosto': 8, 'setembro': 9, 'outubro': 10, 'novembro': 11, 'dezembro': 12}
TORRE = re.compile(r'Torr[ea]\s*([AB])(?:\s*[-e]\s*B)?', re.I)


def miniatura(nome):
    os.makedirs(os.path.join(FOTOS, 't'), exist_ok=True)
    im = Image.open(os.path.join(FOTOS, nome)).convert('RGB'); im.thumbnail((420, 420))
    im.save(os.path.join(FOTOS, 't', nome), quality=78, optimize=True)


def sig(im):
    g = im.convert('L').resize((24, 24))
    return list(g.tobytes())


def dist(a, b):
    return sum((x - y) ** 2 for x, y in zip(a, b))


def legenda(words, im):
    x0, x1 = im['x0'] - 30, im['x1'] + 30
    cap = [w for w in words if im['bottom'] - 2 < w['top'] < im['bottom'] + 90 and w['x0'] >= x0 and w['x1'] <= x1]
    linhas = {}
    for w in cap:
        linhas.setdefault(round(w['top'] / 4), []).append(w)
    txt = ' '.join(' '.join(x['text'] for x in sorted(v, key=lambda w: w['x0'])) for _, v in sorted(linhas.items()))
    blocos = sorted(set(m.group(1).upper() for m in TORRE.finditer(txt)))
    if re.search(r'Torr[ea]\s*A\s*[-e]\s*B', txt, re.I):
        blocos = ['A', 'B']
    texto = TORRE.sub('', txt)
    texto = re.sub(r'\s*:\s*', ' ', texto)
    texto = re.sub(r'\s+', ' ', texto).strip(' .:-')
    return ''.join(blocos) or '', (texto[:1].upper() + texto[1:] + '.') if texto else ''


def processa(pdf_path):
    os.makedirs(FOTOS, exist_ok=True)
    with pdfplumber.open(pdf_path) as pdf:
        full = ' '.join((p.extract_text() or '') for p in pdf.pages)
        db = re.search(r'Data base:\s*(\w+)\s+de\s+(\d{4})', full, re.I)
        if not db:
            print('  sem "Data base", pulando'); return None
        mes, ano = MES[db.group(1).lower()], int(db.group(2))
        pct = re.search(r'(\d{1,2},\d{2})\s*%', full)
        mid = f'{ano}{mes:02d}'
        tmp = tempfile.mkdtemp()
        subprocess.run(['pdfimages', '-p', '-j', pdf_path, os.path.join(tmp, 'i')], check=True)
        fotos = []
        for pi, p in enumerate(pdf.pages, 1):
            t = p.extract_text() or ''
            if 'Cada imagem' not in t and 'imagem conta' not in t:
                continue
            imgs = [im for im in p.images if (im['x1'] - im['x0']) > 120 and (im['bottom'] - im['top']) > 120]
            dentro = lambda a, b: a is not b and a['x0'] >= b['x0'] - 1 and a['x1'] <= b['x1'] + 1 and a['top'] >= b['top'] - 1 and a['bottom'] <= b['bottom'] + 1
            imgs = sorted([b for b in imgs if not any(dentro(a, b) for a in imgs)], key=lambda i: (round(i['top'] / 40), i['x0']))
            words = p.extract_words()
            brutos = []
            for f in sorted(glob.glob(os.path.join(tmp, f'i-{pi:03d}-*.jpg'))):
                try:
                    b = Image.open(f).convert('RGB')
                    if min(b.size) > 300:
                        brutos.append((f, b, sig(b)))
                except Exception:
                    pass
            for im in imgs:
                crop = p.crop((max(0, im['x0']), max(0, im['top']), min(p.width, im['x1']), min(p.height, im['bottom']))).to_image(resolution=110).original.convert('RGB')
                s = sig(crop)
                best = min(brutos, key=lambda r: dist(r[2], s)) if brutos else None
                foto = best[1] if best and dist(best[2], s) < 24 * 24 * 900 else crop
                # foto deitada no PDF: segue a orientação do recorte
                if (crop.width > crop.height) != (foto.width > foto.height):
                    foto = foto.rotate(90, expand=True)
                foto.thumbnail((1400, 1400))
                n = len(fotos) + 1
                nome = f'{mid}-{n}.jpg'
                foto.save(os.path.join(FOTOS, nome), quality=84, optimize=True)
                miniatura(nome)
                bloco, texto = legenda(words, im)
                fotos.append({'f': nome, 'bloco': bloco, 'txt': texto})
        envio = re.search(r'(\d{8})\d{6}_', os.path.basename(pdf_path))
        return {'id': mid, 'pct': float(pct.group(1).replace(',', '.')) if pct else None,
                'envio': f'{envio.group(1)[6:8]}/{envio.group(1)[4:6]}/{envio.group(1)[:4]}' if envio else '',
                'fotos': fotos}


def main(paths):
    dados = json.load(open(OBRA_JSON, encoding='utf-8')) if os.path.exists(OBRA_JSON) else {'meses': []}
    por_id = {m['id']: m for m in dados['meses']}
    for path in paths:
        print(os.path.basename(path))
        r = processa(path)
        if not r:
            continue
        m = por_id.get(r['id'])
        if m is None:
            m = {'id': r['id'], 'A': {'S': 0, 'W': 0, 'R': 0, 'L': 0, 'E': 0, 'G': 0}, 'B': {'S': 0, 'W': 0, 'R': 0, 'L': 0, 'E': 0, 'G': 0},
                 'notaA': '', 'notaB': ''}
            por_id[r['id']] = m
            print('  mês novo: preencher A/B (estado do 3D) e notas no obra.json')
        m['pct'] = r['pct']; m['envio'] = r['envio'] or m.get('envio', '')
        if not m.get('revisado'):
            m['fotos'] = r['fotos']
        print(f"  {r['id']}  {r['pct']}%  {len(r['fotos'])} fotos")
    dados['meses'] = sorted(por_id.values(), key=lambda m: m['id'])
    json.dump(dados, open(OBRA_JSON, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    print('ok ->', OBRA_JSON)


if __name__ == '__main__':
    if len(sys.argv) < 2:
        print(__doc__); sys.exit(1)
    main(sys.argv[1:])
