"""Genera los mapas de «A Oscuras» a partir del diseño.

Uso (desde la raíz del proyecto):
    python scripts/oscuras/generar.py        # Parte I: niveles.py  → src/lib/oscuras/maps.ts
    python scripts/oscuras/generar.py 2      # Parte II: niveles2.py → src/lib/oscuras/maps2.ts
    python scripts/oscuras/generar.py 3      # Parte III: niveles3.py → src/lib/oscuras/maps3.ts

Antes de escribir pasa el comprobador: si alguna galería no tiene salida o deja oro
inalcanzable, no genera nada. En maps.ts conserva la cabecera (tipos y comentarios) y
sustituye solo la lista de galerías. No edites esas listas a mano.
"""
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
OUT_DIR = os.path.join(HERE, '..', '..', 'src', 'lib', 'oscuras')

part = sys.argv[1] if len(sys.argv) > 1 else '1'
if part == '4':
    import niveles4 as design
    target = os.path.join(OUT_DIR, 'maps4.ts')
    head = (
        '/**\n'
        ' * Noches de la Parte IV de «A Oscuras»: «El canto».\n'
        ' * Generado con scripts/oscuras/generar.py 4 a partir de scripts/oscuras/niveles4.py.\n'
        ' * Casillas nuevas: n ventana · l farola · f hoguera · v vecino · g guardia civil (leyenda en maps.ts).\n'
        ' */\n'
        "import type { Level } from './maps';\n\n"
    )
    const = 'levels4'
elif part == '3':
    import niveles3 as design
    target = os.path.join(OUT_DIR, 'maps3.ts')
    head = (
        '/**\n'
        ' * Galerías de la Parte III de «A Oscuras»: «Lo que sube».\n'
        ' * Generado con scripts/oscuras/generar.py 3 a partir de scripts/oscuras/niveles3.py.\n'
        ' * Casillas nuevas: h minero de rescate · I el cura · p perro · c vela (leyenda en maps.ts).\n'
        ' */\n'
        "import type { Level } from './maps';\n\n"
    )
    const = 'levels3'
elif part == '2':
    import niveles2 as design
    target = os.path.join(OUT_DIR, 'maps2.ts')
    head = (
        '/**\n'
        ' * Galerías de la Parte II de «A Oscuras»: «Lo que canta».\n'
        ' * Generado con scripts/oscuras/generar.py 2 a partir de scripts/oscuras/niveles2.py.\n'
        ' * Casillas nuevas: W roca reforzada · R cristal muerto · % tablas podridas · ~ grisú ·\n'
        ' * D dinamita · U hueco · A araña de cristal (leyenda completa en maps.ts y niveles2.py).\n'
        ' */\n'
        "import type { Level } from './maps';\n\n"
    )
    const = 'levels2'
else:
    import niveles as design
    target = os.path.join(OUT_DIR, 'maps.ts')
    src = open(target, encoding='utf-8').read()
    head = src[: src.index('export const levels: Level[] = [')]
    const = 'levels'

# No generar niveles que el comprobador da por imposibles
for i, l in enumerate(design.L):
    ok, got, total, _ = design.check(l)
    if not ok or got != total:
        sys.exit(f'Galería {i + 1} ({l.name}): salida={"sí" if ok else "NO"}, oro {got}/{total}. No se genera nada.')


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


out = [head, f'export const {const}: Level[] = [\n']
for i, l in enumerate(design.L):
    out.append(f'  // {i + 1} · {l.name}\n  {{\n')
    out.append(f'    name: {ts(l.name)},\n    line: {ts(l.line)},\n')
    if l.dark:
        out.append(f'    dark: {l.dark},\n')
    if l.shade:
        out.append(f'    shade: {l.shade},\n')
    if l.lamp_out:
        out.append('    lampOut: true,\n')
    if l.lever_time:
        out.append(f'    leverTime: {l.lever_time},\n')
    if l.look:
        out.append(f'    look: {ts(l.look)},\n')
    if l.pulse:
        out.append(f'    pulse: {l.pulse},\n')
    if l.echo:
        out.append(f'    echo: {l.echo},\n')
    if l.flood:
        out.append(f'    flood: {ts(l.flood)},\n')
    if l.need:
        out.append(f'    need: {l.need},\n')
    if l.ventura:
        out.append(f'    ventura: {l.ventura},\n')
    if l.cinematic:
        out.append('    cinematic: [\n' + ''.join('      ' + ts(c) + ',\n' for c in l.cinematic) + '    ],\n')
    out.append('    grid: [\n' + ''.join(f"      '{r}',\n" for r in l.rows()) + '    ],\n')
    if l.movers:
        out.append('    movers: [\n' + ''.join('      ' + ts(m) + ',\n' for m in l.movers) + '    ],\n')
    if l.notes:
        out.append('    notes: [\n' + ''.join('      ' + ts(n) + ',\n' for n in l.notes) + '    ],\n')
    out.append('  },\n')
out.append('];\n')
open(target, 'w', encoding='utf-8').write(''.join(out))
print(f'{os.path.basename(target)} generado ({len(design.L)} galerías)')
