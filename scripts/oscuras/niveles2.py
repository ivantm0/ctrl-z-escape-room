"""Parte II · «Lo que canta»: galerías del Abismo (diseño + comprobador).

Mismas casillas que la Parte I (ver niveles.py) y además:
  W  roca reforzada con flejes: solo la abre la dinamita
  R  cristal muerto: sólido, da una luz roja tenue
  %  tablas podridas: sostienen un momento y se hunden
  ~  grisú: una llama dentro (lámpara o bengala) lo hace estallar
  D  dinamita (E para cogerla, F para encenderla a tus pies)
  U  hueco: minero muerto que patrulla; no ve, pero oye (correr y aterrizar hacen ruido)
  A  araña de cristal: cuelga del techo y cae cuando pasas debajo

Uso (desde la raíz del proyecto):
    python scripts/oscuras/niveles2.py           # comprueba las galerías (-v N muestra el mapa N)
    python scripts/oscuras/generar.py 2          # comprueba y reescribe src/lib/oscuras/maps2.ts
"""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from niveles import Lvl, check, show, corridor, pit  # noqa: E402

L = []

# ───────────── II·1 · La caída ─────────────
l = Lvl('La caída', 'Caes durante mucho tiempo. Cuando abres los ojos, la oscuridad es roja.')
l.carve(1, 1, 28, 16)
for x in range(10, 29): l.put(x, 16, '^')              # fondo de pinchos
for (x0, x1, y, ch) in [(1, 5, 4, '#'), (8, 10, 6, '%'), (13, 15, 8, '#'), (18, 20, 10, '%'),
                        (22, 24, 12, '#'), (17, 19, 14, '%'), (12, 14, 15, '#')]:
    l.carve(x0, y, x1, y, ch)
l.put(15, 8, 'R'); l.put(25, 12, 'R')
for (x, y) in [(0, 8), (29, 6), (0, 13), (29, 12), (6, 17), (20, 0)]: l.put(x, y, 'R')
l.put(2, 3, 'P'); l.put(1, 15, 'S'); l.put(1, 16, 'S')
l.put(6, 16, 'U')
l.put(14, 7, 'G'); l.put(23, 11, 'G')
l.put(4, 3, 'C'); l.put(13, 14, 'C')
l.notes = [
    '«Si estás leyendo esto, también has caído. Ventura cortó la cuerda. No era la primera vez.» — J.',
    '«Los que llegan aquí abajo no mueren del todo. Se quedan andando. Siempre hacia el canto.»',
]
L.append(l)

# ───────────── II·2 · Los huecos ─────────────
l = Lvl('Los huecos', 'Caminan. No te ven. Pero te oyen respirar.')
corridor(l, 1, 28, 2, 4)
l.put(8, 5, 'R')
pit(l, 19, 20, 5)
l.ladder(27, 5, 10)
corridor(l, 1, 28, 8, 10)
pit(l, 14, 15, 11)
l.put(22, 11, 'R')
l.ladder(2, 11, 16)
corridor(l, 1, 28, 14, 16)
l.put(16, 17, 'R')
l.put(1, 4, 'P'); l.put(3, 4, 'L')
l.put(28, 15, 'S'); l.put(28, 16, 'S')
l.put(13, 4, 'U'); l.put(20, 10, 'U'); l.put(8, 10, 'U'); l.put(10, 16, 'U'); l.put(21, 16, 'U')
l.put(23, 4, 'G'); l.put(5, 10, 'G'); l.put(25, 16, 'G')
l.put(17, 10, 'C')
l.notes = ['«Ese era Ramiro. Lo reconozco por la pierna. Sigue cojeando.»']
L.append(l)

# ───────────── II·3 · Grisú ─────────────
l = Lvl('Grisú', 'Huele a manzanas podridas. Cualquier llama aquí es la última.')
corridor(l, 1, 28, 2, 4)
l.carve(10, 2, 17, 4, '~')
l.put(13, 5, 'R')
l.ladder(27, 5, 10)
corridor(l, 1, 28, 8, 10)
l.carve(8, 8, 16, 10, '~')
l.put(12, 11, 'R')
pit(l, 19, 20, 11)
l.ladder(2, 11, 16)
corridor(l, 1, 28, 14, 16)
l.carve(10, 17, 15, 17); l.carve(10, 18, 15, 18, '^')
for x in range(10, 16): l.put(x, 17, '%')
l.carve(18, 14, 22, 16, '~')
l.put(20, 17, 'R')
l.put(1, 4, 'P'); l.put(2, 4, 'L'); l.put(20, 4, 'L'); l.put(24, 16, 'L')
l.put(28, 15, 'S'); l.put(28, 16, 'S')
l.put(12, 10, 'U')
l.put(14, 4, 'G'); l.put(10, 10, 'G'); l.put(21, 16, 'G')
l.put(6, 4, 'C'); l.put(25, 10, 'C')
l.notes = [
    '«Encendió un cigarro para no tener miedo. Lo encontramos repartido por toda la galería.»',
    '«A oscuras dentro del gas. Solo la luz roja de las piedras. Y algo que arrastra los pies.» — J.',
]
L.append(l)

# ───────────── II·4 · Hilos de cristal ─────────────
l = Lvl('Hilos de cristal', 'Del techo cuelgan cosas que brillan. Algunas se mueven.')
corridor(l, 1, 28, 2, 5)
for x in (8, 12, 16, 20): l.put(x, 2, 'A')
l.carve(22, 6, 25, 6); l.carve(22, 7, 25, 7, '^')
for x in range(22, 26): l.put(x, 6, '%')
l.ladder(27, 6, 11)
corridor(l, 1, 28, 9, 11)
for x in (22, 17, 7): l.put(x, 9, 'A')
l.put(12, 11, 'U')
pit(l, 4, 5, 12)
l.put(15, 12, 'R')
l.ladder(2, 12, 16)
corridor(l, 1, 28, 14, 16)
for x in (9, 13, 21, 25): l.put(x, 14, 'A')
l.carve(16, 17, 19, 17); l.carve(16, 18, 19, 18, '^')
for x in range(16, 20): l.put(x, 17, '%')
l.put(11, 17, 'R')
l.put(1, 5, 'P'); l.put(2, 5, 'L')
l.put(28, 15, 'S'); l.put(28, 16, 'S')
l.put(19, 16, 'U')
l.put(14, 5, 'G'); l.put(10, 11, 'G'); l.put(23, 16, 'G')
l.put(5, 5, 'C'); l.put(24, 11, 'C')
l.notes = [
    '«No mires arriba. Si brilla, ya está cayendo. Corre aunque te oigan.»',
    '«Los cristales del techo tienen patas. Antes no las tenían.»',
]
L.append(l)

# ───────────── II·5 · Dinamita ─────────────
l = Lvl('Dinamita', 'Ventura dejó cargas por todas partes. Alguna tendrá que servirte.')
corridor(l, 1, 28, 2, 4)
l.carve(10, 2, 10, 4, 'W')
l.put(25, 5, 'W'); l.carve(25, 6, 25, 7)
l.put(18, 5, 'R')
corridor(l, 1, 28, 8, 10)
l.carve(6, 8, 6, 10, 'W')
for x in (20, 15): l.put(x, 8, 'A')
l.carve(16, 8, 18, 10, '~')
l.ladder(2, 11, 16)
corridor(l, 1, 28, 14, 16)
l.carve(9, 17, 14, 17); l.carve(9, 18, 14, 18, '^')
for x in range(9, 15): l.put(x, 17, '%')
l.carve(26, 14, 26, 16, 'W')
l.put(12, 11, 'R'); l.put(22, 17, 'R')
l.put(1, 4, 'P'); l.put(3, 4, 'D'); l.put(4, 4, 'L'); l.put(20, 4, 'D'); l.put(11, 10, 'D'); l.put(20, 16, 'D')
l.put(28, 15, 'S'); l.put(28, 16, 'S')
l.put(14, 4, 'U'); l.put(17, 4, 'U'); l.put(23, 10, 'U'); l.put(17, 16, 'U')
l.put(7, 4, 'G'); l.put(4, 10, 'G'); l.put(24, 16, 'G')
l.put(8, 4, 'C'); l.put(24, 4, 'C')
l.notes = [
    '«Cargas de Ventura, con su marca. Pensaba volar la mina entera con nosotros dentro.»',
    '«Detrás de los flejes de hierro hay algo que golpea. Desde dentro.» — J.',
]
L.append(l)



def tri(l, up=True):
    """Tres plantas unidas por escaleras.
    up=True: se empieza abajo a la izquierda y se sale arriba a la derecha.
    up=False: se empieza arriba a la izquierda y se sale abajo a la derecha."""
    corridor(l, 1, 28, 2, 4)
    corridor(l, 1, 28, 8, 10)
    corridor(l, 1, 28, 14, 16)
    if up:
        l.ladder(27, 11, 16)
        l.ladder(2, 5, 10)
        l.put(1, 16, 'P'); l.put(28, 3, 'S'); l.put(28, 4, 'S')
    else:
        l.ladder(27, 5, 10)
        l.ladder(2, 11, 16)
        l.put(1, 4, 'P'); l.put(28, 15, 'S'); l.put(28, 16, 'S')


def veins(l, x0, x1, floor):
    """Foso con pinchos cruzado por vetas (hace falta luz)."""
    pit(l, x0, x1, floor)
    for x in range(x0 + 1, x1):
        l.put(x, floor, '=')


def planks(l, x0, x1, floor):
    """Foso con pinchos cruzado por tablas podridas."""
    pit(l, x0, x1, floor)
    for x in range(x0, x1 + 1):
        l.put(x, floor, '%')


# ═════════════ Polillas (6–8) ═════════════

# ───────────── II·6 · Polillas ─────────────
l = Lvl('Polillas', 'Algo blanco revolotea alrededor de tu lámpara. Muchas cosas blancas.')
tri(l, up=False)
veins(l, 10, 13, 5)
veins(l, 16, 20, 11)
veins(l, 9, 13, 17)
l.put(2, 4, 'L'); l.put(8, 10, 'L'); l.put(22, 16, 'L')
for (x, y) in [(12, 2), (14, 3), (18, 8), (21, 9), (11, 14), (14, 15)]: l.put(x, y, 'O')
l.put(6, 4, 'R'); l.put(24, 11, 'R'); l.put(5, 17, 'R')
l.put(16, 4, 'G'); l.put(12, 10, 'G'); l.put(20, 16, 'G')
l.put(23, 4, 'C')
l.notes = ['«Las polillas de abajo no comen ropa. Comen luz. Cuando se acaba la luz, se posan en los ojos.»']
L.append(l)

# ───────────── II·7 · El nido ─────────────
l = Lvl('El nido', 'Las paredes están cubiertas de capullos blancos. Algunos laten.')
tri(l, up=True)
pit(l, 9, 10, 17)
veins(l, 12, 16, 11)
pit(l, 19, 20, 5)
l.put(3, 16, 'L'); l.put(22, 10, 'L')
l.put(14, 16, 'U'); l.put(7, 10, 'U'); l.put(12, 4, 'U')
for (x, y) in [(13, 9), (15, 8), (17, 9), (24, 3), (6, 15)]: l.put(x, y, 'O')
l.put(18, 17, 'R'); l.put(10, 11, 'R'); l.put(16, 5, 'R')
l.put(23, 16, 'G'); l.put(5, 10, 'G'); l.put(25, 4, 'G')
l.put(20, 16, 'C')
l.notes = ['«Dejé la lámpara en el suelo y se fueron todas a ella. Fue la única vez que pude correr.»']
L.append(l)

# ───────────── II·8 · Llama y gas ─────────────
l = Lvl('Llama y gas', 'Sin luz no ves las vetas. Con luz, el grisú te revienta.')
tri(l, up=False)
l.carve(8, 2, 14, 4, '~')
veins(l, 18, 21, 5)
veins(l, 8, 12, 11)
l.carve(17, 8, 22, 10, '~')
l.carve(6, 14, 11, 16, '~')
veins(l, 15, 19, 17)
l.put(3, 4, 'L'); l.put(16, 4, 'L'); l.put(4, 10, 'L'); l.put(13, 16, 'L')
for (x, y) in [(20, 3), (10, 9), (24, 9), (17, 15)]: l.put(x, y, 'O')
l.put(19, 10, 'U')
l.put(11, 5, 'R'); l.put(20, 11, 'R'); l.put(8, 17, 'R')
l.put(11, 4, 'G'); l.put(20, 10, 'G'); l.put(23, 16, 'G')
l.put(25, 10, 'C')
l.notes = ['«Gas abajo, polillas arriba. Elige qué quieres perder: la luz o la cara.»']
L.append(l)

# ═════════════ Inundación (9–13) ═════════════

# ───────────── II·9 · La corriente ─────────────
l = Lvl('La corriente', 'Se oye agua. Mucha agua. Y suena cada vez más cerca.')
tri(l, up=True)
l.flood = dict(**{'from': 18}, speed=0.12, delay=240, to=1)
pit(l, 10, 11, 17)
planks(l, 15, 18, 11)
pit(l, 9, 10, 5)
l.put(20, 4, 'R'); l.put(6, 11, 'R'); l.put(20, 17, 'R')
l.put(14, 16, 'G'); l.put(10, 10, 'G'); l.put(22, 4, 'G')
l.put(24, 16, 'C')
l.notes = ['«Ventura reventó el dique de la galería norte. Si no podía sellarnos con roca, lo haría con agua.»']
L.append(l)

# ───────────── II·10 · Agua que sube ─────────────
l = Lvl('Agua que sube', 'Los huecos no saben nadar. Tú tampoco.')
tri(l, up=True)
l.flood = dict(**{'from': 18}, speed=0.15, delay=200, to=1)
planks(l, 8, 10, 17)
l.put(16, 16, 'U')
pit(l, 19, 20, 11)
l.put(10, 10, 'U')
planks(l, 13, 15, 5)
l.put(21, 4, 'U')
l.put(5, 17, 'R'); l.put(24, 11, 'R'); l.put(8, 5, 'R')
l.put(13, 16, 'G'); l.put(6, 10, 'G'); l.put(25, 4, 'G')
l.put(23, 10, 'C')
l.notes = ['«Los huecos se quedan quietos en el agua, mirando hacia arriba. Esperan a que bajes.»']
L.append(l)

# ───────────── II·11 · El pozo inundado ─────────────
l = Lvl('El pozo inundado', 'Un pozo vertical. Abajo, agua negra subiendo. Arriba, nada.')
l.flood = dict(**{'from': 17}, speed=0.14, delay=200, to=1)
l.carve(3, 1, 26, 16)
l.carve(27, 13, 28, 16)
for (x0, x1, y, ch) in [(20, 23, 15, '#'), (16, 18, 13, '%'), (20, 22, 11, '#'), (16, 18, 9, '#'),
                        (20, 22, 7, '%'), (16, 18, 5, '#'), (11, 14, 4, '#')]:
    l.carve(x0, y, x1, y, ch)
l.carve(3, 4, 9, 4, '#')
l.movers.append(dict(kind='spikes', x=16, y=8, w=3, period=140, up=40, warn=25))
l.put(27, 16, 'P'); l.put(4, 2, 'S'); l.put(4, 3, 'S')
l.put(21, 10, 'R'); l.put(17, 4, 'R'); l.put(5, 4, 'R')
l.put(17, 12, 'G'); l.put(13, 3, 'G')
l.put(22, 14, 'C')
l.notes = ['«Por aquí bajaban las vagonetas. Ahora suben los muertos, flotando boca abajo.»']
L.append(l)

# ───────────── II·12 · Las compuertas ─────────────
l = Lvl('Las compuertas', 'Una palanca abre la compuerta. El agua no espera a nadie.')
tri(l, up=True)
l.flood = dict(**{'from': 18}, speed=0.12, delay=300, to=1)
l.lever_time = 12 * 60
l.put(22, 16, 'K')
pit(l, 12, 13, 17)
l.movers.append(dict(kind='platform', x=8, y=8, w=1, h=3, path=[[0, 0], [0, -3]], speed=1, trigger=0))
pit(l, 16, 17, 11)
pit(l, 14, 15, 5)
l.put(6, 17, 'R'); l.put(20, 11, 'R'); l.put(10, 5, 'R')
l.put(18, 16, 'G'); l.put(4, 10, 'G'); l.put(24, 4, 'G')
l.put(25, 16, 'C')
l.notes = ['«La compuerta de arriba se cierra sola. Ventura la dejó así: para que nadie la cruzara dos veces.»']
L.append(l)

# ───────────── II·13 · Los ahogados ─────────────
l = Lvl('Los ahogados', 'Flotan en el agua y te siguen con la mirada.')
tri(l, up=True)
l.flood = dict(**{'from': 18}, speed=0.16, delay=200, to=1)
planks(l, 7, 9, 17)
l.put(15, 16, 'U'); l.put(21, 16, 'U')
planks(l, 18, 20, 11)
l.put(9, 10, 'U')
l.put(12, 2, 'A'); l.put(18, 2, 'A')
pit(l, 23, 24, 5)
l.put(13, 17, 'R'); l.put(5, 11, 'R'); l.put(20, 5, 'R')
l.put(12, 16, 'G'); l.put(14, 10, 'G'); l.put(26, 4, 'G')
l.put(4, 4, 'C')
l.notes = ['«Uno de los ahogados llevaba mi cara. No me paré a mirar mejor.» — J.']
L.append(l)

# ═════════════ Ecos (14–17) ═════════════

# ───────────── II·14 · Ecos ─────────────
l = Lvl('Ecos', 'Tus pasos suenan dos veces. La segunda vez, más cerca.')
tri(l, up=False)
l.echo = 200
l.movers += [
    dict(kind='spikes', x=12, y=4, w=3, period=120, up=40, warn=25),
    dict(kind='spikes', x=18, y=10, w=3, period=120, up=40, warn=25, phase=60),
    dict(kind='spikes', x=10, y=16, w=3, period=120, up=40, warn=25),
]
pit(l, 20, 21, 5)
pit(l, 9, 10, 11)
pit(l, 18, 19, 17)
l.put(7, 5, 'R'); l.put(24, 11, 'R'); l.put(14, 17, 'R')
l.put(16, 4, 'G'); l.put(14, 10, 'G'); l.put(23, 16, 'G')
l.put(25, 4, 'C')
l.notes = ['«No me sigue nadie. Me sigo yo. Con tres segundos de retraso y la cara gris.» — J.']
L.append(l)

# ───────────── II·15 · Tu propio rastro ─────────────
l = Lvl('Tu propio rastro', 'Si te paras a esperar, te alcanzas.')
tri(l, up=True)
l.echo = 170
planks(l, 8, 11, 17)
l.movers.append(dict(kind='platform', x=14, y=11, w=2, path=[[0, 0], [6, 0]], speed=0.8, wait=30, light=True))
pit(l, 14, 21, 11)
for x in (11, 13): l.put(x, 5, '*')
for x in (15, 17): l.put(x, 5, '+')
pit(l, 10, 18, 5)
for x in range(11, 18): l.put(x, 5, '*' if x < 14 else '+')
l.put(19, 17, 'R'); l.put(6, 11, 'R'); l.put(22, 5, 'R')
l.put(13, 16, 'G'); l.put(24, 10, 'G'); l.put(19, 4, 'G')
l.put(5, 4, 'C')
l.notes = ['«Los cristales laten también aquí abajo. Mi eco no espera a que se enciendan.»']
L.append(l)

# ───────────── II·16 · Hilos y ecos ─────────────
l = Lvl('Hilos y ecos', 'Correr despierta a los huecos. Pararse despierta a tu eco.')
tri(l, up=False)
l.echo = 160
for x in (9, 14, 19): l.put(x, 2, 'A')
l.put(16, 4, 'U')
for x in (8, 13, 21): l.put(x, 8, 'A')
pit(l, 16, 17, 11)
l.put(6, 10, 'U')
for x in (10, 18): l.put(x, 14, 'A')
planks(l, 13, 15, 17)
l.put(22, 16, 'U')
l.put(5, 5, 'R'); l.put(24, 11, 'R'); l.put(8, 17, 'R')
l.put(11, 4, 'G'); l.put(11, 10, 'G'); l.put(20, 16, 'G')
l.put(25, 4, 'C')
l.notes = ['«Arriba, arañas. Detrás, yo. Delante, los huecos. Elige de qué tienes más miedo.» — J.']
L.append(l)

# ───────────── II·17 · El que te sigue ─────────────
l = Lvl('El que te sigue', 'El agua sube. Tu eco no se ahoga.')
tri(l, up=True)
l.echo = 140
l.flood = dict(**{'from': 18}, speed=0.13, delay=260, to=1)
pit(l, 9, 10, 17)
planks(l, 16, 18, 17)
pit(l, 19, 20, 11)
planks(l, 9, 11, 11)
pit(l, 12, 13, 5)
l.movers.append(dict(kind='spikes', x=20, y=4, w=2, period=120, up=40, warn=25))
l.put(6, 17, 'R'); l.put(23, 11, 'R'); l.put(8, 5, 'R')
l.put(14, 16, 'G'); l.put(14, 10, 'G'); l.put(24, 4, 'G')
l.put(25, 16, 'C')
l.notes = ['«Mi eco se ha dado la vuelta. Me ha mirado. Creo que él también me sigue a mí desde antes.»']
L.append(l)

# ═════════════ Ventura (18–21) ═════════════

# ───────────── II·18 · Las cargas de Ventura ─────────────
l = Lvl('Las cargas de Ventura', 'Un silbido, una chispa en el aire. Y un cartucho rodando a tus pies.')
tri(l, up=True)
l.ventura = 170
l.carve(13, 6, 15, 7)
l.put(14, 7, 'V')
pit(l, 8, 9, 17)
pit(l, 19, 20, 17)
pit(l, 10, 11, 11)
pit(l, 18, 19, 5)
l.put(5, 17, 'R'); l.put(24, 11, 'R'); l.put(10, 5, 'R')
l.put(14, 16, 'G'); l.put(16, 10, 'G'); l.put(23, 4, 'G')
l.put(25, 16, 'C')
l.notes = ['«Ventura se ríe mientras lanza. Dice que nos está salvando. Que el canto no puede salir si no sale nadie.»']
L.append(l)

# ───────────── II·19 · La persecución ─────────────
l = Lvl('La persecución', 'Cada explosión despierta a algo. Y Ventura no deja de lanzar.')
tri(l, up=False)
l.ventura = 140
l.carve(12, 12, 14, 13)
l.put(13, 13, 'V')
planks(l, 9, 11, 5)
l.put(18, 4, 'U')
l.put(8, 10, 'U'); l.put(20, 10, 'U')
planks(l, 15, 17, 17)
l.put(22, 16, 'U')
l.put(6, 5, 'R'); l.put(24, 11, 'R'); l.put(10, 17, 'R')
l.put(14, 4, 'G'); l.put(4, 10, 'G'); l.put(25, 16, 'G')
l.put(24, 4, 'C')
l.notes = ['«Sus cargas no solo matan: rompen las tablas, abren agujeros, despiertan a los huecos. Usa eso.»']
L.append(l)

# ───────────── II·20 · El capataz ─────────────
l = Lvl('El capataz', 'Ventura te cierra el paso. Esta vez no hay otro camino.')
l.ventura = 120
corridor(l, 1, 28, 14, 16)
l.ladder(27, 5, 16)
l.carve(27, 5, 28, 13); l.ladder(27, 5, 16)
corridor(l, 1, 28, 2, 4)
l.carve(15, 2, 15, 3, 'W')
l.put(22, 4, 'V')
pit(l, 9, 10, 17)
l.put(1, 16, 'P'); l.put(5, 16, 'D'); l.put(17, 16, 'D'); l.put(10, 4, 'D')
l.put(1, 3, 'S'); l.put(1, 4, 'S')
l.carve(5, 2, 5, 4, 'W')
l.put(20, 17, 'R'); l.put(12, 5, 'R')
l.put(14, 16, 'G'); l.put(25, 4, 'G')
l.put(3, 16, 'C')
l.notes = ['«Una carga para la roca, otra para él. No te acerques a menos de tres pasos cuando enciendas la mecha.»']
L.append(l)

# ───────────── II·21 · Su diario ─────────────
l = Lvl('Su diario', 'En el bolsillo de Ventura hay un cuaderno. Lleva cuarenta años escrito.')
tri(l, up=True)
l.carve(9, 14, 13, 16, '~')
veins(l, 17, 21, 17)
l.put(3, 16, 'L'); l.put(15, 16, 'L')
pit(l, 9, 10, 11)
l.put(18, 10, 'U')
l.carve(14, 2, 18, 4, '~')
for (x, y) in [(19, 15), (23, 9), (8, 3)]: l.put(x, y, 'O')
l.put(6, 17, 'R'); l.put(24, 11, 'R'); l.put(21, 5, 'R')
l.put(12, 10, 'G'); l.put(24, 16, 'G'); l.put(22, 4, 'G')
l.put(6, 16, 'C'); l.put(14, 10, 'C'); l.put(25, 4, 'C')
l.notes = [
    '«Diario de Ventura, 1883: “El filón canta. Los que lo oyen bajan. Mi padre bajó.”»',
    '«Diario de Ventura, 1903: “Cada veinte años el canto vuelve. Cada veinte años sello la mina con alguien dentro.”»',
    '«Diario de Ventura, 1923: “El aprendiz no muere. Lo he enterrado tres veces y siempre vuelve a subir.”»',
]
L.append(l)

# ═════════════ El que canta (22–25) ═════════════

# ───────────── II·22 · Raíces de cristal ─────────────
l = Lvl('Raíces de cristal', 'Del suelo brotan agujas rojas, al ritmo de un latido.')
tri(l, up=False)
for (x, y, ph) in [(7, 4, 0), (12, 4, 40), (17, 4, 80), (22, 4, 0),
                   (22, 10, 20), (17, 10, 60), (12, 10, 100), (7, 10, 20),
                   (7, 16, 0), (12, 16, 40), (17, 16, 80), (22, 16, 0)]:
    l.movers.append(dict(kind='spikes', x=x, y=y, w=2, period=120, up=40, warn=22, phase=ph))
for x in (10, 20): l.put(x, 2, 'A')
for x in (15,): l.put(x, 8, 'A')
for (x, y) in [(5, 5), (15, 5), (25, 5), (10, 11), (20, 11), (5, 17), (15, 17), (25, 17)]: l.put(x, y, 'R')
l.put(14, 4, 'G'); l.put(19, 10, 'G'); l.put(10, 16, 'G')
l.put(26, 4, 'C')
l.notes = ['«No son raíces. Son venas. Y la mina entera es el cuerpo.»']
L.append(l)

# ───────────── II·23 · El coro ─────────────
l = Lvl('El coro', 'Cuarenta voces cantan tu nombre. Una de ellas es la tuya.')
tri(l, up=True)
l.echo = 200
l.put(3, 16, 'L')
for x in (9, 15, 21): l.put(x, 16, 'U')
for x in (7, 14, 22): l.put(x, 10, 'U')
for x in (10, 18): l.put(x, 4, 'U')
for (x, y) in [(12, 15), (18, 9), (6, 3), (24, 3)]: l.put(x, y, 'O')
veins(l, 11, 13, 11)
pit(l, 14, 15, 5)
for (x, y) in [(6, 17), (24, 11), (20, 5)]: l.put(x, y, 'R')
l.put(12, 16, 'G'); l.put(17, 10, 'G'); l.put(25, 4, 'G')
l.put(25, 16, 'C')
l.notes = ['«Están todos. Ramiro, Tomás, Antonio… Cantan con la boca cerrada. El sonido sale de la roca.»']
L.append(l)

# ───────────── II·24 · La garganta ─────────────
l = Lvl('La garganta', 'La galería baja en espiral, cada vez más estrecha, como una garganta.')
l.carve(3, 1, 26, 16)
for x in range(3, 27): l.put(x, 16, '^')
for (x0, x1, y, ch) in [(3, 9, 4, '#'), (12, 14, 5, '%'), (17, 19, 7, '#'), (22, 24, 9, '%'),
                        (17, 19, 11, '#'), (12, 14, 13, '%'), (6, 9, 15, '#')]:
    l.carve(x0, y, x1, y, ch)
l.carve(1, 13, 2, 16)
l.carve(3, 16, 5, 16, '#')
l.carve(1, 17, 5, 17, '#')
for x in (13, 18, 23): l.put(x, 1, 'A')
l.movers += [
    dict(kind='spikes', x=17, y=6, w=3, period=130, up=40, warn=25),
    dict(kind='spikes', x=17, y=10, w=3, period=130, up=40, warn=25, phase=65),
]
for (x, y) in [(20, 3), (8, 9), (15, 10)]: l.put(x, y, 'O')
l.put(4, 3, 'P'); l.put(5, 3, 'L'); l.put(1, 15, 'S'); l.put(1, 16, 'S')
for (x, y) in [(10, 4), (25, 9), (11, 15)]: l.put(x, y, 'R')
l.put(18, 6, 'G'); l.put(13, 12, 'G')
l.put(7, 3, 'C')
l.notes = ['«Al fondo de la garganta está el corazón. Late. Lo oigo latir desde aquí.»']
L.append(l)

# ───────────── II·25 · El filón madre ─────────────
l = Lvl('El filón madre', 'Por fin, el que canta. Un corazón de cristal rojo del tamaño de una iglesia.')
l.echo = 180
l.carve(1, 1, 28, 16)
l.carve(1, 17, 28, 17, '#')
# El corazón: cristal muerto rodeado de venas reforzadas, cerrando el paso a la salida
l.carve(19, 6, 23, 16, 'W')
l.carve(20, 8, 22, 14, 'R')
l.carve(24, 1, 24, 16, 'W')
# Escalera de repisas en zigzag hasta la dinamita de arriba
for (x0, x1, y) in [(5, 7, 15), (9, 11, 13), (5, 7, 11), (8, 10, 9), (12, 14, 7), (8, 10, 5), (12, 15, 3)]:
    l.carve(x0, y, x1, y, '#')
for (x, y, ph) in [(7, 16, 0), (12, 16, 50), (16, 16, 25)]:
    l.movers.append(dict(kind='spikes', x=x, y=y, w=2, period=110, up=40, warn=22, phase=ph))
for (x, y) in [(8, 4), (15, 7), (5, 14)]: l.put(x, y, 'O')
l.put(1, 16, 'P'); l.put(3, 16, 'L')
l.put(6, 14, 'D'); l.put(6, 10, 'D'); l.put(13, 6, 'D'); l.put(14, 2, 'D')
l.put(26, 15, 'S'); l.put(26, 16, 'S')
l.put(9, 8, 'G'); l.put(13, 2, 'G')
l.put(2, 16, 'C')
l.notes = ['«Si lo rompes, el canto se calla. Si el canto se calla, ya no hay nada que te haga bajar. Ni subir.» — J.']
L.append(l)


if __name__ == '__main__':
    bad = False
    for i, l in enumerate(L):
        ok, go, gt, seen = check(l)
        notes = sum(r.count('C') for r in l.rows())
        print(f'{i + 1:2} {l.name:26} salida={"OK" if ok else "NO"}  oro {go}/{gt}  notas {len(l.notes)}/{notes}')
        if not ok or go != gt or len(l.notes) > notes:
            bad = True
        if '-v' in sys.argv and (not ok or go != gt or str(i + 1) in sys.argv):
            show(l, seen)
    sys.exit(1 if bad else 0)
