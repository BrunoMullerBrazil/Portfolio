"""Gera public/boulevard/index.html a partir do template.
Uso: python3 boulevard-src/build.py"""
import json, os
D = os.path.dirname(os.path.abspath(__file__))
t = open(os.path.join(D, 'template.html'), encoding='utf-8').read()
plans = open(os.path.join(D, 'plans.json'), encoding='utf-8').read()
fit = json.dumps(json.load(open(os.path.join(D, 'fit.json'))), separators=(',', ':'))
out = os.path.join(D, '..', 'public', 'boulevard', 'index.html')
open(out, 'w', encoding='utf-8').write(t.replace('__PLANS__', plans).replace('__FIT__', fit))
print('ok ->', os.path.normpath(out))
