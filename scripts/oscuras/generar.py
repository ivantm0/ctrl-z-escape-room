"""Genera src/lib/oscuras/maps.ts a partir de niveles.py.

Uso (desde la raíz del proyecto):
    python scripts/oscuras/niveles.py        # comprueba rutas de las 10 galerías (-v N muestra el mapa N)
    python scripts/oscuras/generar.py        # comprueba y, si todo está bien, reescribe maps.ts

Conserva la cabecera de maps.ts (tipos y comentarios) y sustituye solo la lista `levels`.
Los niveles se diseñan en niveles.py: no edites la lista de maps.ts a mano.
"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import niveles as mine

# No generar niveles que el comprobador da por imposibles
for i, l in enumerate(mine.L):
    ok, got, total, _ = mine.check(l)
    if not ok or got != total:
        sys.exit(f'Galería {i + 1} ({l.name}): salida={"sí" if ok else "NO"}, oro {got}/{total}. No se genera maps.ts.')

target = sys.argv[1] if len(sys.argv) > 1 else os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', 'src', 'lib', 'oscuras', 'maps.ts')
src = open(target, encoding='utf-8').read()
head = src[: src.index('export const levels: Level[] = [')]


def ts(v):
    if isinstance(v, dict):
        return '{ ' + ', '.join(f'{k}: {ts(x)}' for k, x in v.items()) + ' }'
    if isinstance(v, list):
        return '[' + ', '.join(ts(x) for x in v) + ']'
    if isinstance(v, str):
        return "'" + v.replace('\\', '\\\\').replace("'", "\\'") + "'"
    if isinstance(v, bool):
        return 'true' if v else 'false'
    if isinstance(v, float) and v.is_integer():
        return str(int(v))
    return str(v)


out = [head, 'export const levels: Level[] = [\n']
for i, l in enumerate(mine.L):
    out.append(f'  // {i + 1} · {l.name}\n  {{\n')
    out.append(f'    name: {ts(l.name)},\n    line: {ts(l.line)},\n')
    out.append('    grid: [\n' + ''.join(f"      '{r}',\n" for r in l.rows()) + '    ],\n')
    if l.movers:
        out.append('    movers: [\n' + ''.join('      ' + ts(m) + ',\n' for m in l.movers) + '    ],\n')
    if l.notes:
        out.append('    notes: [\n' + ''.join('      ' + ts(n) + ',\n' for n in l.notes) + '    ],\n')
    out.append('  },\n')
out.append('];\n')
open(target, 'w', encoding='utf-8').write(''.join(out))
print('maps.ts generado')
