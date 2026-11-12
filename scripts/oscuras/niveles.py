"""Diseño de las galerías de «A Oscuras · La mina» + comprobador de rutas.

Modelo del comprobador (casillas de 16 px, jugador = 1 casilla):
- andar a izquierda/derecha y caer
- escaleras H: subir y bajar
- saltos: dy=-2 → |dx|<=2 ; dy=-1 → |dx|<=2 ; dy=0 → |dx|<=3 ; bajando → |dx|<=4
  con hueco libre en la columna de partida hasta el ápice, en la fila del ápice y en la columna de llegada
- X (roca agrietada) es pared hasta tener el pico (T alcanzable)
- = (vetas) son suelo si la lámpara L es alcanzable
- plataformas móviles: su recorrido entero cuenta como suelo (se asume esperar y montar)
- puertas (plataformas de alto > 1) se asumen abiertas; barrenas se asumen esquivables
"""
import json, sys

W, H = 30, 20


class Lvl:
    def __init__(self, name, line):
        self.name = name
        self.line = line
        self.g = [['#'] * W for _ in range(H)]
        self.movers = []
        self.notes = []
        self.extra_floor = []  # casillas a tratar como suelo en el comprobador (p. ej. carro empujado)
        self.dark = None        # radio de la luz propia del jugador (px); menos = más oscuro
        self.shade = None       # velocidad de las sombras (px/fotograma)
        self.lamp_out = False   # al entrar, la lámpara se apaga
        self.lever_time = None  # fotogramas que dura abierta una puerta de palanca (None = sin temporizador)
        self.look = None        # 'grutas' = cuevas luminosas
        self.pulse = None       # ciclo de los cristales que laten (* y +), en fotogramas
        self.cinematic = None   # líneas de la escena al entrar
        self.echo = None        # retraso del eco que repite tus pasos (fotogramas)
        self.flood = None       # inundación: dict(from=fila, speed=px/f, delay=f, to=fila)
        self.ventura = None     # cada cuántos fotogramas lanza dinamita Ventura
        self.need = None        # Parte III: humanos que hay que comer para poder salir
        self.hands = False      # Parte III: rompe la roca agrietada con las manos

    def carve(self, x0, y0, x1, y1, ch='.'):
        for y in range(y0, y1 + 1):
            for x in range(x0, x1 + 1):
                self.g[y][x] = ch

    def put(self, x, y, ch):
        self.g[y][x] = ch

    def ladder(self, x, y0, y1):
        for y in range(y0, y1 + 1):
            self.g[y][x] = 'H'

    def rows(self):
        return [''.join(r) for r in self.g]


L = []

# ───────────── 1 · El derrumbe ─────────────
l = Lvl('El derrumbe', 'Todo se ha venido abajo. Arriba, en algún sitio, sigue habiendo aire.')
l.carve(1, 2, 28, 5)          # galería superior
l.carve(11, 4, 12, 5, '#')    # bloque de 2
l.carve(17, 6, 18, 7)         # pozo con pinchos
l.put(17, 7, '^'); l.put(18, 7, '^')
l.carve(1, 12, 28, 16)        # túnel inferior
l.carve(13, 14, 14, 16, '#')  # escalón de 3: hace falta la vagoneta
l.ladder(26, 6, 16)
l.put(2, 16, 'P'); l.put(8, 16, 'B')
l.put(1, 4, 'S'); l.put(1, 5, 'S')
l.put(6, 5, 'G'); l.put(20, 16, 'G')
l.put(21, 5, 'C')
l.notes = ['«Si alguien lee esto: la escalera del fondo aguanta. Subid. Yo ya no puedo con la pierna.» — Ramiro']
l.extra_floor = [(12, 16)]  # vagoneta empujada contra el escalón
L.append(l)

# ───────────── 2 · La lámpara de Tomás ─────────────
l = Lvl('La lámpara de Tomás', 'Tomás nunca dejaba que su lámpara se apagara.')
l.carve(1, 7, 14, 17)         # gran cámara
l.carve(15, 15, 28, 17)       # túnel de entrada
l.carve(19, 18, 20, 18); l.put(19, 18, '^'); l.put(20, 18, '^')
l.carve(1, 3, 28, 5)          # galería superior
l.carve(1, 6, 4, 6)           # hueco entre cámara y galería
for x in range(2, 5): l.put(x, 16, '=')    # V1
for x in range(6, 9): l.put(x, 14, '=')    # V2
for x in range(10, 13): l.put(x, 12, '=')  # V3
for x in range(6, 9): l.put(x, 10, '=')    # V4
for x in range(2, 5): l.put(x, 8, '=')     # V5
l.carve(15, 6, 16, 6); l.put(15, 6, '^'); l.put(16, 6, '^')  # trampa en la galería
l.put(27, 17, 'P'); l.put(24, 17, 'L'); l.put(25, 17, 'C')
l.put(28, 4, 'S'); l.put(28, 5, 'S')
l.put(12, 11, 'G'); l.put(22, 5, 'G')
l.put(10, 5, 'C')
l.notes = [
    '«Tomás. Su lámpara sigue caliente. Siempre decía que el mineral azul “contesta” a la luz.»',
    '«Las vetas aguantan mientras las alumbras. No te pares a mirar abajo.» — garabateado con carbón',
]
L.append(l)

# ───────────── 3 · El pico ─────────────
l = Lvl('El pico', 'La roca cede si sabes dónde golpear.')
l.carve(1, 14, 28, 16)        # planta baja
l.carve(10, 14, 10, 16, 'X')  # muro agrietado
l.carve(16, 17, 17, 17, '^')  # foso de pinchos (2)
l.ladder(27, 11, 16)
l.carve(1, 8, 28, 10)         # planta media
l.carve(21, 11, 22, 11); l.put(21, 11, '^'); l.put(22, 11, '^')
l.carve(13, 8, 13, 10, 'X')   # muro agrietado
l.carve(7, 9, 8, 10, '#')     # escalón de 2
l.ladder(2, 5, 10)
l.carve(1, 2, 28, 4)          # planta alta
l.carve(9, 3, 9, 4, 'X')
l.carve(16, 2, 16, 4, 'X')
l.carve(18, 5, 19, 6); l.put(18, 6, '^'); l.put(19, 6, '^')
l.carve(23, 5, 23, 5, 'X'); l.put(23, 6, 'G'); l.carve(23, 6, 23, 6, 'G')  # pepita bajo roca
l.put(2, 16, 'P'); l.put(6, 16, 'T'); l.put(5, 16, 'C')
l.put(28, 3, 'S'); l.put(28, 4, 'S')
l.put(20, 16, 'G'); l.put(11, 10, 'G')
l.put(25, 10, 'C')
l.notes = [
    '«Antonio. Agarra todavía el pico. Tenía las uñas negras de escarbar.»',
    '«Dicen que el grisú no avisa. Mentira: avisa. Huele a manzanas podridas.»',
]
L.append(l)

# ───────────── 4 · Vía muerta ─────────────
l = Lvl('Vía muerta', 'Las plataformas siguen moviéndose. Nadie las empuja.')
l.carve(1, 14, 28, 16)        # vía baja
l.carve(8, 17, 21, 17)        # gran foso
l.carve(8, 18, 21, 18, '^')
l.movers += [
    dict(kind='platform', x=8, y=17, w=2, path=[[0, 0], [5, 0]], speed=0.6, wait=60),
    dict(kind='platform', x=15, y=17, w=2, path=[[0, 0], [5, 0]], speed=0.6, wait=60, phase=193, light=True),
]
l.carve(25, 8, 26, 13)        # pozo del montacargas
l.movers.append(dict(kind='platform', x=25, y=16.625, w=2, path=[[0, 0], [0, -9]], speed=0.5, wait=90, light=True))
l.carve(1, 5, 28, 7)          # vía alta
l.carve(10, 8, 17, 8)
l.carve(10, 9, 17, 9, '^')
l.movers.append(dict(kind='platform', x=10, y=8, w=2, path=[[0, 0], [6, 0]], speed=0.7, wait=40))
l.put(2, 16, 'P'); l.put(1, 6, 'S'); l.put(1, 7, 'S')
l.put(14, 18, 'C'); l.put(27, 16, 'G'); l.put(5, 7, 'G')
l.notes = ['«Se cayó del carro intentando saltar. Las plataformas pasan cada poco; hay que esperar.»']
L.append(l)

# ───────────── 5 · Las barrenas ─────────────
l = Lvl('Las barrenas', 'Las perforadoras se pusieron en marcha solas tras la explosión.')
l.carve(1, 15, 28, 16)        # túnel bajo (2 de alto: no se pueden saltar)
l.ladder(28, 10, 16)
l.carve(1, 10, 28, 11)        # túnel medio
l.ladder(1, 5, 11)
l.carve(1, 5, 28, 6)          # túnel alto
for (x, y, w, ph) in [(5, 16, 4, 0), (12, 16, 4, 50), (19, 16, 4, 100),
                      (22, 11, 4, 0), (15, 11, 4, 60), (8, 11, 3, 120),
                      (5, 6, 3, 0), (11, 6, 4, 40), (18, 6, 4, 80), (24, 6, 3, 120)]:
    l.movers.append(dict(kind='spikes', x=x, y=y, w=w, period=160, up=60, warn=30, phase=ph))
l.put(1, 16, 'P'); l.put(28, 5, 'S'); l.put(28, 6, 'S')
l.put(10, 16, 'C'); l.put(14, 11, 'G'); l.put(16, 6, 'G')
l.notes = ['«Las barrenas siguen un ritmo. Cuenta. Cuando parpadean en rojo, ya es tarde.»']
L.append(l)

# ───────────── 6 · La báscula ─────────────
l = Lvl('La báscula', 'Aquí se pesaba el mineral. Ahora el peso abre caminos.')
l.carve(1, 14, 28, 16)        # planta baja
l.carve(9, 17, 10, 17, '_')   # placa en hueco
l.carve(12, 17, 18, 17); l.carve(12, 18, 18, 18, '^')
l.ladder(27, 11, 16)
l.carve(1, 8, 28, 10)         # planta media
l.carve(15, 11, 16, 11, '_')
l.ladder(3, 5, 10)
l.carve(1, 2, 28, 4)          # planta alta
l.put(26, 10, 'K')
l.lever_time = 14 * 60
# lectura: K (fila 10) = 0, placa media (fila 11) = 1, placa baja (fila 17) = 2
l.movers += [
    dict(kind='platform', x=25, y=2, w=1, h=3, path=[[0, 0], [0, -3]], speed=1, trigger=0),
    dict(kind='platform', x=8, y=8, w=1, h=3, path=[[0, 0], [0, -3]], speed=1, trigger=1),
    dict(kind='platform', x=12, y=19, w=7, path=[[0, 0], [0, -2]], speed=0.5, trigger=2),
    dict(kind='spikes', x=13, y=4, w=3, period=150, up=50, warn=30),
]
l.put(2, 16, 'P'); l.put(5, 16, 'B'); l.put(24, 10, 'B')
l.put(28, 3, 'S'); l.put(28, 4, 'S')
l.put(22, 16, 'C'); l.put(6, 10, 'G'); l.put(23, 4, 'G')
l.notes = ['«La báscula abre las compuertas si pesa lo de una vagoneta llena. Una persona no basta.»']
L.append(l)

# ───────────── 7 · El montacargas ─────────────
l = Lvl('El montacargas', 'Alguien tiene que tirar de la palanca.')
l.carve(1, 15, 26, 16)        # planta 1
l.put(25, 16, 'K')
l.carve(27, 12, 28, 16)       # hueco del montacargas 1
l.carve(3, 11, 28, 12)        # planta 2
l.movers.append(dict(kind='platform', x=27, y=16.625, w=2, path=[[0, 0], [0, -4]], speed=0.4, trigger=0, delay=90, light=True))
for (x, w, ph) in [(20, 3, 0), (13, 3, 70)]:
    l.movers.append(dict(kind='spikes', x=x, y=12, w=w, period=150, up=50, warn=30, phase=ph))
l.carve(1, 7, 2, 12)          # hueco del montacargas 2
l.movers.append(dict(kind='platform', x=1, y=12.625, w=2, path=[[0, 0], [0, -4]], speed=0.5, wait=80))
l.carve(3, 7, 28, 8)          # planta 3
l.carve(11, 9, 16, 9); l.carve(11, 10, 16, 10, '^')
for x in range(11, 17): l.put(x, 9, '=')
l.ladder(28, 3, 8)
l.carve(1, 2, 27, 4)          # planta 4
l.carve(8, 5, 9, 5); l.carve(8, 6, 9, 6, '^')
l.carve(18, 5, 19, 5); l.carve(18, 6, 19, 6, '^')
l.put(2, 16, 'P'); l.put(1, 3, 'S'); l.put(1, 4, 'S')
l.put(7, 8, 'L')
l.put(22, 16, 'C'); l.put(6, 12, 'G'); l.put(14, 4, 'G')
l.notes = ['«El montacargas sube si alguien se queda abajo con la palanca. Nadie se quedó.»']
L.append(l)

# ───────────── 8 · El filón ─────────────
l = Lvl('El filón', 'Oro. Tanto oro. Y nadie para llevárselo.')
l.carve(1, 15, 28, 17)        # planta baja
l.put(4, 17, 'T'); l.put(3, 17, 'C')
l.carve(9, 15, 9, 17, 'X')
l.carve(12, 18, 22, 18); l.carve(12, 18, 22, 18, '^')
l.carve(12, 15, 22, 17)
l.movers.append(dict(kind='platform', x=12, y=18, w=2, path=[[0, 0], [9, 0]], speed=0.7, wait=40, light=True))
l.ladder(27, 10, 17)
l.carve(1, 7, 28, 9)          # planta media
l.carve(14, 10, 22, 10); l.carve(14, 11, 22, 11, '^')
for x in [15, 16, 19, 20]: l.put(x, 10, '=')
l.put(24, 9, 'L')
l.carve(7, 7, 7, 9, 'X')
l.ladder(2, 5, 9)
l.carve(1, 2, 28, 4)          # planta alta
l.carve(6, 5, 24, 5); l.carve(6, 6, 24, 6, '^')
l.movers.append(dict(kind='platform', x=6, y=5, w=2, path=[[0, 0], [17, 0]], speed=0.8, wait=30))
l.put(2, 17, 'P'); l.put(28, 3, 'S'); l.put(28, 4, 'S')
for (x, y) in [(6, 17), (24, 17), (25, 9), (5, 4), (26, 4)]: l.put(x, y, 'G')
# Bolsas de oro tras roca agrietada
l.carve(10, 10, 12, 10, 'X'); l.carve(10, 11, 12, 11, 'G')
l.put(20, 4, 'C')
l.notes = [
    '«Llevaba los bolsillos llenos de pepitas. Pesaban demasiado para trepar.»',
    '«El filón madre está más abajo. Mucho más abajo. Lo oímos cantar.»',
]
L.append(l)

# ───────────── 9 · El pozo de ventilación ─────────────
l = Lvl('El pozo de ventilación', 'Si sopla aire, hay salida.')
l.carve(3, 1, 26, 16)         # pozo
l.carve(27, 13, 28, 16)       # entrada abajo a la derecha
for x in range(3, 18): l.put(x, 16, '^')   # fondo de pinchos
# Cornisas en zigzag (fila de la roca, columnas)
for (x0, x1, y, ch) in [(20, 23, 15, '#'), (16, 18, 13, '#'), (20, 22, 11, '='), (16, 18, 9, '#'),
                        (20, 22, 7, '='), (16, 18, 5, '#'), (10, 12, 7, '#'), (6, 8, 5, '#')]:
    l.carve(x0, y, x1, y, ch)
l.movers += [
    dict(kind='spikes', x=16, y=8, w=3, period=150, up=50, warn=30),
    dict(kind='spikes', x=16, y=12, w=3, period=150, up=50, warn=30, phase=75),
    # De la última cornisa a la boca: vagoneta colgante
    dict(kind='platform', x=19, y=5, w=2, path=[[0, 0], [4, 0]], speed=0.6, wait=50, light=True),
]
l.carve(25, 1, 28, 4); l.carve(25, 5, 28, 5, '#')
l.carve(13, 3, 14, 3)
l.put(27, 16, 'P'); l.put(25, 16, 'L'); l.put(28, 3, 'S'); l.put(28, 4, 'S')
l.put(21, 14, 'C'); l.put(11, 6, 'G'); l.put(7, 4, 'G'); l.put(17, 12, 'F')
l.notes = ['«Sopla aire de arriba. Huele a lluvia. Estamos cerca, Julián, estamos cerca.»']
L.append(l)

# ───────────── 10 · La galería sellada ─────────────
l = Lvl('La galería sellada', 'La última puerta. Al otro lado, voces.')
l.carve(1, 15, 28, 17)        # planta baja
l.put(4, 17, 'T')
l.carve(7, 15, 7, 17, 'X')
l.carve(10, 18, 17, 18, '_')  # placeholder, se corrige abajo
l.carve(10, 18, 17, 18, '#')
l.carve(11, 18, 12, 18, '_')
l.carve(14, 18, 20, 18); l.carve(14, 19, 20, 19, '^')
l.movers.append(dict(kind='platform', x=14, y=20, w=7, path=[[0, 0], [0, -2]], speed=0.5, trigger=1))
l.ladder(26, 10, 17)
l.carve(1, 7, 28, 9)          # planta media
l.carve(9, 10, 18, 10); l.carve(9, 11, 18, 11, '^')
l.movers += [
    dict(kind='platform', x=9, y=10, w=2, path=[[0, 0], [8, 0]], speed=0.7, wait=40),
    dict(kind='spikes', x=20, y=9, w=3, period=150, up=50, warn=30),
]
l.carve(3, 10, 6, 10)
l.carve(3, 11, 6, 11, '^')
for x in [3, 4]: l.put(x, 10, '=')
l.ladder(2, 5, 9)
l.carve(1, 2, 28, 4)          # planta alta
l.put(7, 9, 'K')
l.lever_time = 13 * 60
l.movers.append(dict(kind='platform', x=26, y=2, w=1, h=3, path=[[0, 0], [0, -3]], speed=1, trigger=0))
l.carve(10, 5, 15, 5); l.carve(10, 6, 15, 6, '^')
l.movers.append(dict(kind='platform', x=10, y=5, w=2, path=[[0, 0], [4, 0]], speed=0.6, wait=50, light=True))
l.put(2, 17, 'P'); l.put(9, 17, 'B'); l.put(24, 9, 'L')
l.put(28, 3, 'S'); l.put(28, 4, 'S')
l.put(22, 17, 'C'); l.put(19, 4, 'C')
l.put(13, 17, 'G'); l.put(4, 9, 'G'); l.put(24, 4, 'G')
l.notes = [
    '«La compuerta de abajo solo baja el puente con peso. Usad la vagoneta.»',
    '«La palanca abre la galería sellada. Al otro lado se oyen voces. Pero no suben: bajan.»',
]
L.append(l)



# ═════════════ Acto I: textos de terror ═════════════
# Mismo trazado; cambian las frases y lo que dejaron escrito los muertos (en orden de lectura de las C).
ACTO1 = [
    ('Algo se ha derrumbado. Algo, en la oscuridad, sigue respirando.',
     ['«No fue el grisú. Oí la mecha. Ventura cerró la galería con nosotros dentro. Y luego empezó el canto.» — Ramiro']),
    ('Tomás nunca dejaba que su lámpara se apagara. Ahora sabes por qué.',
     ['«Ha vuelto a pasar por aquí. No hace ruido al andar, pero se le oye respirar justo detrás de la oreja.»',
      '«Tomás. Tiene la lámpara encendida en la mano y los ojos abiertos. No hay ni un rasguño en su cuerpo.»']),
    ('La roca cede si sabes dónde golpear. Lo que hay detrás no siempre quiere salir.',
     ['«Dicen que el grisú huele a manzanas podridas. Esto huele a otra cosa. A iglesia cerrada.»',
      '«Antonio. Escarbó la roca hasta dejarse las uñas. Escribió con sangre: NO ESTÁ MUERTO EL QUE CANTA.»']),
    ('Las plataformas siguen moviéndose. Nadie las empuja.',
     ['«Saltó. Juraba que algo le agarraba del tobillo desde el fondo del foso.»']),
    ('Las perforadoras se encendieron solas tras la explosión.',
     ['«Las barrenas llevan el ritmo de algo. Como un corazón muy grande y muy lento.»']),
    ('Aquí se pesaba el mineral. Ahora pesa otra cosa.',
     ['«La báscula marca peso cuando no hay nada encima. Mucho peso.» — J.']),
    ('Alguien tiene que tirar de la palanca. Alguien que no seas tú.',
     ['«Si subes, no mires la cuerda del montacargas. No está atada a nada.» — J.']),
    ('Oro. Tanto oro. Y nadie vivo para llevárselo.',
     ['«El filón madre está más abajo. Lo oímos cantar. Cantaba con nuestras voces.»',
      '«Llevaba los bolsillos llenos de pepitas. También la boca.»']),
    ('Si sopla aire, hay salida. Si respira, no.',
     ['«Sopla aire de arriba. No es aire. Es algo que respira desde la boca de la mina.» — J.']),
    ('La galería está sellada. Desde fuera.',
     ['«Ventura selló la mina por fuera, a propósito. “Mejor cuarenta que el pueblo entero”, dijo.»',
      '«La compuerta sube el puente con peso. Usad la vagoneta. Y no os quedéis quietos mucho rato.»']),
]
for lv, (line, notes) in zip(L, ACTO1):
    lv.line = line
    lv.notes = notes


def corridor(l, x0, x1, y0, y1):
    l.carve(x0, y0, x1, y1)


def pit(l, x0, x1, floor):
    """Foso en el suelo `floor` con pinchos en el fondo (fila floor+1)."""
    l.carve(x0, floor, x1, floor)
    l.carve(x0, floor + 1, x1, floor + 1, '^')


# ═════════════ Acto II: hacia abajo, y de vuelta ═════════════

# ───────────── 11 · Los pozos viejos ─────────────
l = Lvl('Los pozos viejos', 'La única salida es hacia abajo. Por donde vino el canto.')
l.dark = 40
corridor(l, 1, 28, 2, 4)
pit(l, 10, 11, 5)
l.carve(17, 3, 18, 4, '#')
l.carve(26, 5, 27, 7)
corridor(l, 1, 28, 8, 10)
pit(l, 19, 20, 11)
l.carve(8, 11, 12, 11); l.carve(8, 12, 12, 12, '^')
for x in (9, 10, 11): l.put(x, 11, '=')
l.carve(2, 11, 3, 13)
corridor(l, 1, 28, 14, 16)
pit(l, 20, 21, 17)
l.movers.append(dict(kind='spikes', x=12, y=16, w=3, period=150, up=50, warn=30))
l.put(2, 4, 'P'); l.put(3, 4, 'L')
l.put(28, 15, 'S'); l.put(28, 16, 'S')
l.put(24, 9, 'M')
l.put(14, 4, 'C'); l.put(15, 16, 'C')
l.put(22, 4, 'G'); l.put(5, 10, 'G')
l.notes = [
    '«Bajamos a buscar a los que faltaban. Volvimos menos. Siempre volvemos menos.»',
    '«Le vi la cara a la sombra. Era la cara de mi hermano. Mi hermano murió en el 19.» — J.',
]
L.append(l)

# ───────────── 12 · La capilla ─────────────
l = Lvl('La capilla', 'Los viejos decían que la mina no se llamaba así por la capilla del pueblo.')
l.dark = 38
corridor(l, 1, 28, 2, 4)
pit(l, 12, 13, 5)
l.ladder(27, 5, 10)
corridor(l, 1, 28, 7, 10)
for x0 in (10, 16): l.carve(x0, 10, x0 + 1, 10, '#')   # bancos
for x in (8, 14, 20): l.carve(x, 7, x, 8, '#')        # columnas colgantes
l.ladder(2, 11, 16)
corridor(l, 1, 28, 14, 16)
l.carve(7, 17, 12, 17); l.carve(7, 18, 12, 18, '^')
for x in (8, 9, 10, 11): l.put(x, 17, '=')
l.put(4, 10, 'K')
l.lever_time = 8 * 60
l.movers += [
    dict(kind='platform', x=18, y=14, w=1, h=3, path=[[0, 0], [0, -3]], speed=1, trigger=0),
    dict(kind='spikes', x=22, y=16, w=3, period=140, up=50, warn=28),
]
l.put(2, 4, 'P'); l.put(14, 10, 'L')
l.put(28, 15, 'S'); l.put(28, 16, 'S')
l.put(6, 15, 'M'); l.put(24, 8, 'M')
l.put(12, 10, 'C')
l.put(20, 4, 'G'); l.put(25, 16, 'G')
l.notes = ['«Hay una capilla aquí abajo. Más vieja que la mina. Más vieja que el pueblo. El altar está mirando hacia abajo.»']
L.append(l)

# ───────────── 13 · El osario ─────────────
l = Lvl('El osario', 'Aquí abajo ya había muertos antes de que llegáramos.')
l.dark = 36
corridor(l, 1, 28, 2, 4)
l.carve(10, 2, 10, 4, 'X')
pit(l, 16, 17, 5)
l.put(25, 5, 'X'); l.carve(25, 6, 25, 7)
corridor(l, 1, 28, 8, 10)
pit(l, 15, 16, 11)
l.put(4, 11, 'X'); l.carve(4, 12, 4, 13)
corridor(l, 1, 28, 14, 16)
l.carve(15, 14, 15, 16, 'X')
pit(l, 20, 21, 17)
l.movers += [
    dict(kind='spikes', x=19, y=10, w=3, period=130, up=50, warn=25),
    dict(kind='spikes', x=10, y=10, w=3, period=130, up=50, warn=25, phase=65),
    dict(kind='spikes', x=8, y=16, w=4, period=130, up=50, warn=25),
]
l.put(2, 4, 'P'); l.put(4, 4, 'T'); l.put(22, 10, 'L')
l.put(28, 15, 'S'); l.put(28, 16, 'S')
l.put(15, 3, 'M'); l.put(22, 15, 'M')
l.put(7, 4, 'C'); l.put(24, 10, 'C'); l.put(25, 16, 'C')
l.put(13, 4, 'G'); l.put(7, 10, 'G'); l.put(18, 16, 'G')
l.notes = [
    '«Huesos. Cientos. Con cascos de cuero, de antes de la Compañía. Todos con la cabeza hacia la misma pared.»',
    '«Si te sigue, no corras hacia la oscuridad. Corre hacia la luz. Siempre hacia la luz.» — J.',
    '«No es una sombra. Es un agujero con forma de hombre.»',
]
L.append(l)

# ───────────── 14 · Los murmullos ─────────────
l = Lvl('Los murmullos', 'Las voces dicen tu nombre. Lo dicen bien.')
l.dark = 34
corridor(l, 1, 8, 2, 4)
l.carve(9, 2, 23, 16)
l.carve(9, 17, 23, 17, '^')
corridor(l, 1, 8, 11, 16)
for (x0, x1, y) in [(10, 11, 7), (15, 16, 9), (16, 17, 13), (12, 13, 15)]:
    for x in range(x0, x1 + 1): l.put(x, y, '=')
l.carve(20, 11, 21, 11, '#')
l.put(2, 4, 'P'); l.put(5, 4, 'L'); l.put(21, 10, 'L')
l.put(1, 15, 'S'); l.put(1, 16, 'S')
l.put(16, 3, 'M'); l.put(19, 15, 'M'); l.put(4, 14, 'M')
l.put(3, 4, 'C')
l.put(16, 8, 'G'); l.put(3, 16, 'G')
l.notes = ['«Contestad solo si os llaman por el apodo. El nombre de verdad lo sabe cualquiera.» — J.']
L.append(l)

# ───────────── 15 · La galería romana ─────────────
l = Lvl('La galería romana', 'Alguien excavó esto hace dos mil años. Y lo tapió por dentro.')
l.dark = 34
corridor(l, 1, 28, 2, 4)
l.carve(9, 5, 10, 5, '_')
l.carve(20, 5, 21, 7)            # trampilla
corridor(l, 1, 28, 8, 10)
pit(l, 5, 17, 11)
l.ladder(2, 11, 16)
corridor(l, 1, 28, 14, 16)
l.carve(14, 17, 15, 17, '_')
l.carve(18, 17, 24, 17); l.carve(18, 18, 24, 18, '^')
# lectura: placa alta (fila 5) = 0, placa baja (fila 17) = 1
l.movers += [
    dict(kind='platform', x=20, y=5, w=2, h=1.0625, path=[[0, 0], [2, 0]], speed=0.5, trigger=0),
    dict(kind='platform', x=6, y=11, w=2, path=[[0, 0], [10, 0]], speed=0.7, wait=40),
    dict(kind='platform', x=18, y=19, w=7, path=[[0, 0], [0, -2]], speed=0.5, trigger=1),
    dict(kind='spikes', x=26, y=16, w=2, period=120, up=45, warn=25),
]
l.put(2, 4, 'P'); l.put(5, 4, 'B'); l.put(10, 16, 'B'); l.put(24, 10, 'L')
l.put(28, 15, 'S'); l.put(28, 16, 'S')
l.put(14, 3, 'M'); l.put(10, 9, 'M')
l.put(24, 4, 'C'); l.put(4, 16, 'C')
l.put(18, 10, 'G'); l.put(27, 4, 'G')
l.notes = [
    '«En la pared hay letras latinas raspadas. Una palabra se repite: CANIT. “Canta”.»',
    '«La trampilla de arriba solo se abre con peso. Él también pesa. Cuidado con dónde lo dejas pisar.» — J.',
]
L.append(l)

# ───────────── 16 · El que canta ─────────────
l = Lvl('El que canta', 'Por fin lo oyes de cerca. Tiene tu voz.')
l.dark = 30
l.shade = 0.6
corridor(l, 15, 28, 2, 4)
l.carve(7, 2, 14, 16)
l.carve(7, 17, 14, 17, '^')
corridor(l, 1, 6, 11, 16)
for x in (8, 9, 10): l.put(x, 15, '=')
l.movers += [
    dict(kind='platform', x=12, y=5, w=2, path=[[0, 0], [0, 10]], speed=0.6, wait=60, light=True),
    dict(kind='spikes', x=18, y=4, w=3, period=130, up=45, warn=25),
]
l.put(27, 4, 'P'); l.put(22, 4, 'L')
l.put(1, 15, 'S'); l.put(1, 16, 'S')
l.put(10, 3, 'M'); l.put(3, 15, 'M'); l.put(26, 3, 'M')
l.put(4, 16, 'C'); l.put(16, 4, 'C')
l.put(9, 14, 'G'); l.put(5, 16, 'G')
l.notes = [
    '«Aquí está. No tiene forma. Es el filón. Canta para que bajemos, y bajamos. Ventura lo sabía. Por eso cerró.» — J.',
    '«Ya he estado aquí. Reconozco mi letra en las notas. No recuerdo haberlas escrito.»',
]
L.append(l)

# ───────────── 17 · Sin luz ─────────────
l = Lvl('Sin luz', 'Tu lámpara se apagó sola al pasar junto a él. Solo quedan bengalas.')
l.dark = 24
l.lamp_out = True
corridor(l, 1, 28, 14, 16)
l.carve(18, 17, 22, 17); l.carve(18, 18, 22, 18, '^')
for x in (19, 20, 21): l.put(x, 17, '=')
l.ladder(2, 11, 16)
corridor(l, 1, 28, 8, 10)
l.carve(10, 11, 14, 11); l.carve(10, 12, 14, 12, '^')
for x in (11, 12, 13): l.put(x, 11, '=')
l.ladder(27, 5, 10)
corridor(l, 1, 28, 2, 4)
l.carve(14, 5, 18, 5); l.carve(14, 6, 18, 6, '^')
for x in (15, 16, 17): l.put(x, 5, '=')
l.movers.append(dict(kind='spikes', x=19, y=10, w=3, period=140, up=50, warn=28))
l.put(27, 16, 'P'); l.put(25, 16, 'F'); l.put(5, 10, 'F'); l.put(23, 4, 'F')
l.put(1, 3, 'S'); l.put(1, 4, 'S')
l.put(10, 15, 'M'); l.put(20, 9, 'M'); l.put(8, 3, 'M')
l.put(14, 16, 'C')
l.put(6, 16, 'G'); l.put(24, 10, 'G'); l.put(10, 4, 'G')
l.notes = ['«Cuando no veas nada, cuenta sus pasos. Da siete y se para. Da siete y se para.» — J.']
L.append(l)

# ───────────── 18 · La cuerda ─────────────
l = Lvl('La cuerda', 'Arriba. Siempre arriba. No mires abajo: algo sube detrás.')
l.dark = 30
l.shade = 0.6
corridor(l, 1, 26, 15, 16)
l.carve(27, 15, 28, 16); l.ladder(27, 9, 16)
corridor(l, 1, 28, 9, 10)
pit(l, 6, 15, 11)
l.ladder(1, 3, 10)
corridor(l, 2, 28, 3, 4)
l.movers += [
    dict(kind='spikes', x=8, y=16, w=3, period=130, up=50, warn=25),
    dict(kind='spikes', x=17, y=16, w=3, period=130, up=50, warn=25, phase=65),
    dict(kind='platform', x=6, y=11, w=2, path=[[0, 0], [8, 0]], speed=0.7, wait=40, light=True),
    dict(kind='spikes', x=20, y=10, w=3, period=120, up=45, warn=25),
    dict(kind='spikes', x=9, y=4, w=3, period=120, up=45, warn=25),
    dict(kind='spikes', x=17, y=4, w=3, period=120, up=45, warn=25, phase=60),
]
l.put(2, 16, 'P'); l.put(12, 16, 'L')
l.put(28, 3, 'S'); l.put(28, 4, 'S')
l.put(24, 15, 'M'); l.put(4, 9, 'M'); l.put(22, 3, 'M')
l.put(5, 16, 'C'); l.put(25, 10, 'C')
l.put(23, 16, 'G'); l.put(3, 10, 'G'); l.put(14, 4, 'G')
l.notes = [
    '«La cuerda del montacargas baja hasta el filón. Algo tira de ella desde abajo, despacio, cada noche.»',
    '«No te pares en las escaleras. Ahí es donde te alcanza.» — J.',
]
L.append(l)

# ───────────── 19 · Las Ánimas ─────────────
l = Lvl('Las Ánimas', 'Cuarenta hombres bajaron. Cuarenta sombras suben contigo.')
l.dark = 28
l.shade = 0.62
corridor(l, 1, 28, 14, 16)
l.carve(8, 14, 8, 16, 'X')
l.carve(15, 17, 16, 17, '_')
l.carve(18, 17, 24, 17); l.carve(18, 18, 24, 18, '^')
l.ladder(27, 11, 16)
corridor(l, 1, 28, 8, 10)
l.carve(13, 11, 20, 11); l.carve(13, 12, 20, 12, '^')
for x in (14, 15, 18, 19): l.put(x, 11, '=')
l.ladder(2, 5, 10)
corridor(l, 1, 28, 2, 4)
pit(l, 10, 17, 5)
l.put(5, 4, 'K')
l.lever_time = 14 * 60
# lectura: palanca (fila 4) = 0, placa (fila 17) = 1
l.movers += [
    dict(kind='platform', x=26, y=2, w=1, h=3, path=[[0, 0], [0, -3]], speed=1, trigger=0),
    dict(kind='platform', x=18, y=19, w=7, path=[[0, 0], [0, -2]], speed=0.5, trigger=1),
    dict(kind='spikes', x=7, y=10, w=3, period=120, up=45, warn=25),
    dict(kind='platform', x=10, y=5, w=2, path=[[0, 0], [6, 0]], speed=0.7, wait=40, light=True),
    dict(kind='spikes', x=21, y=4, w=3, period=120, up=45, warn=25, phase=60),
]
l.put(2, 16, 'P'); l.put(4, 16, 'T'); l.put(11, 16, 'B'); l.put(25, 10, 'L')
l.put(28, 3, 'S'); l.put(28, 4, 'S')
l.put(20, 15, 'M'); l.put(24, 9, 'M'); l.put(6, 9, 'M'); l.put(15, 3, 'M')
l.put(5, 16, 'C'); l.put(11, 10, 'C'); l.put(18, 4, 'C')
l.put(13, 16, 'G'); l.put(22, 10, 'G'); l.put(24, 4, 'G')
l.notes = [
    '«Ventura. El capataz. Bajó a sellar el filón con dinamita y el filón lo selló a él.»',
    '«Las sombras no son el monstruo. Son los que bajaron. Te siguen porque eres el único que sabe subir.»',
    '«Si llegas arriba, no mires el nombre de la lápida.» — J.',
]
L.append(l)

# ───────────── 20 · La boca ─────────────
l = Lvl('La boca', 'Arriba se ve el cielo. Abajo, todo lo que viene detrás.')
l.dark = 26
l.shade = 0.72
l.carve(3, 1, 26, 15)
l.carve(3, 16, 17, 16, '^')
l.carve(18, 16, 26, 16)
l.carve(27, 13, 28, 16)
for (x0, x1, y, ch) in [(20, 23, 15, '#'), (16, 18, 13, '#'), (20, 22, 11, '='), (16, 18, 9, '#'),
                        (20, 22, 7, '='), (16, 18, 5, '#'), (12, 14, 4, '=')]:
    l.carve(x0, y, x1, y, ch)
l.carve(3, 4, 10, 4, '#')
l.movers += [
    dict(kind='spikes', x=16, y=12, w=3, period=130, up=40, warn=25, phase=65),
    dict(kind='spikes', x=16, y=8, w=3, period=130, up=40, warn=25),
    dict(kind='spikes', x=6, y=3, w=2, period=120, up=40, warn=25),
]
l.put(27, 16, 'P'); l.put(25, 16, 'L'); l.put(26, 16, 'F'); l.put(17, 4, 'L')
l.put(4, 2, 'S'); l.put(4, 3, 'S')
l.put(10, 14, 'M'); l.put(5, 8, 'M'); l.put(24, 3, 'M'); l.put(12, 9, 'M')
l.put(22, 14, 'C')
l.put(13, 3, 'G'); l.put(9, 3, 'G')
l.notes = ['«Si lees esto, ya has subido antes. Y has vuelto a bajar. No subas, Julián.» — J.']
L.append(l)



# ═════════════ Acto III: las grutas luminosas (21–25) ═════════════
# Un respiro de la oscuridad: todo da luz. El reto pasa a ser el ritmo de los cristales,
# las setas que lanzan y el agua quieta.

# ───────────── 21 · La grieta ─────────────
l = Lvl('La grieta', 'Al otro lado de la roca, algo brilla.')
l.look = 'grutas'
l.cinematic = [
    'Una grieta en la roca. Al otro lado, algo brilla.',
    'Por primera vez en días, Julián ve sus propias manos. Están negras de carbón. Y tiemblan.',
    'Hongos, cristales, agua quieta. Todo da luz: una luz fría que no calienta.',
    'Las sombras no te siguen hasta aquí. Eso debería tranquilizarte.',
]
l.carve(1, 1, 28, 17)
for x in range(10, 22): l.put(x, 17, 'w')
for (x0, x1, y, ch) in [(6, 8, 16, '#'), (10, 13, 14, '*'), (15, 17, 12, '#'), (19, 21, 10, '+'),
                        (23, 26, 8, '#'), (19, 21, 6, '*'), (9, 17, 4, '#')]:
    l.carve(x0, y, x1, y, ch)
l.put(2, 17, 'P'); l.put(9, 2, 'S'); l.put(9, 3, 'S')
l.put(16, 11, 'G'); l.put(13, 3, 'G')
l.put(25, 7, 'C')
l.notes = ['«Expedición Ferrer, 1880. Encontramos la salida. El agua refleja el cielo. Mañana subimos.»']
L.append(l)

# ───────────── 22 · El bosque de setas ─────────────
l = Lvl('El bosque de setas', 'Las setas son blandas y calientes. Como si respiraran.')
l.look = 'grutas'
l.carve(1, 1, 28, 17)
for x in range(8, 28): l.put(x, 17, '^')
l.put(5, 18, 'Y')
l.carve(7, 13, 9, 13, '#'); l.put(10, 13, 'Y')
l.carve(12, 8, 14, 8, '#'); l.put(15, 8, 'Y')
l.carve(17, 3, 28, 3, '#')
l.put(2, 17, 'P'); l.put(28, 1, 'S'); l.put(28, 2, 'S')
l.put(13, 7, 'G'); l.put(9, 12, 'G'); l.put(22, 2, 'G')
l.put(8, 12, 'C')
l.notes = ['«Ferrer, 1880. Las setas nos subieron hasta la segunda sala. Rodríguez dice que de noche se mueven.»']
L.append(l)

# ───────────── 23 · Cristales que laten ─────────────
l = Lvl('Cristales que laten', 'La luz va y viene, como una respiración muy lenta.')
l.look = 'grutas'
l.pulse = 150
l.carve(1, 1, 28, 16)
l.carve(5, 17, 22, 17); l.carve(5, 18, 22, 18, '^')
for (x0, ch) in [(5, '*'), (8, '+'), (11, '*'), (14, '+'), (17, '*'), (20, '+')]:
    for x in range(x0, x0 + 3): l.put(x, 17, ch)
l.put(27, 17, 'Y')
l.carve(24, 12, 25, 12, '#')
l.carve(1, 10, 22, 10, '#')
for (x0, ch) in [(6, '*'), (9, '+'), (12, '*'), (15, '+')]:
    for x in range(x0, x0 + 3): l.put(x, 10, ch)
l.put(3, 10, 'Y')
l.carve(5, 5, 27, 5, '#')
for (x0, ch) in [(12, '+'), (15, '*'), (18, '+')]:
    for x in range(x0, x0 + 3): l.put(x, 5, ch)
l.put(1, 16, 'P'); l.put(27, 3, 'S'); l.put(27, 4, 'S')
l.put(15, 16, 'G'); l.put(10, 9, 'G'); l.put(17, 4, 'G')
l.put(23, 9, 'C')
l.notes = ['«Los cristales laten al mismo ritmo que algo que está debajo. Ferrer dice que es el agua. No es el agua.»']
L.append(l)

# ───────────── 24 · El lago quieto ─────────────
l = Lvl('El lago quieto', 'El agua refleja la gruta entera. Y a ti. Y a alguien a tu lado.')
l.look = 'grutas'
l.pulse = 140
l.carve(1, 1, 28, 17)
l.carve(3, 15, 26, 17, 'w')
l.carve(1, 15, 2, 17, '#'); l.carve(27, 15, 28, 17, '#')
for (x0, x1, ch) in [(5, 6, '#'), (8, 9, '*'), (11, 12, '+'), (16, 17, '#'), (19, 20, '*'), (22, 23, '+'), (25, 25, '#')]:
    l.carve(x0, 15, x1, 15, ch)
l.put(14, 15, 'Y')
l.carve(13, 10, 15, 10, '#')
l.ladder(28, 6, 14)
l.carve(20, 6, 27, 6, '#')
for (x0, ch) in [(16, '*'), (12, '+')]:
    for x in range(x0, x0 + 3): l.put(x, 6, ch)
l.carve(7, 6, 10, 6, '#')
l.carve(1, 4, 5, 4, '#')
l.put(1, 14, 'P'); l.put(1, 2, 'S'); l.put(1, 3, 'S')
l.put(14, 9, 'G'); l.put(24, 5, 'G'); l.put(3, 3, 'G')
l.put(26, 5, 'C'); l.put(8, 5, 'C')
l.notes = [
    '«Ferrer. Se quedó mirando el agua toda la noche. Decía que en el reflejo éramos cuarenta y uno.»',
    '«No mires el lago. El de la orilla de enfrente no es tu reflejo. Ya no.» — J.',
]
L.append(l)

# ───────────── 25 · La luz de arriba ─────────────
l = Lvl('La luz de arriba', 'Allí arriba, por fin, luz de día. De verdad.')
l.look = 'grutas'
l.pulse = 140
l.carve(1, 1, 28, 17)
for x in list(range(1, 10)) + list(range(20, 29)): l.put(x, 17, 'w')
l.carve(10, 18, 19, 18, '#')
l.put(11, 18, 'Y'); l.put(18, 18, 'Y')
l.carve(6, 13, 9, 13, '#'); l.put(6, 13, 'Y')
l.carve(20, 13, 23, 13, '#')
l.carve(2, 8, 4, 8, '#')
for (x0, ch) in [(7, '+'), (11, '*')]:
    for x in range(x0, x0 + 3): l.put(x, 8, ch)
l.carve(15, 8, 17, 8, '#')
l.ladder(17, 3, 7)
l.carve(12, 3, 18, 3, '#'); l.put(17, 3, 'H')
l.carve(1, 0, 28, 0, '#')
l.put(14, 17, 'P'); l.put(14, 1, 'S'); l.put(14, 2, 'S')
l.put(22, 12, 'G'); l.put(3, 7, 'G'); l.put(12, 2, 'G')
l.put(21, 12, 'C')
l.notes = ['«Aquí acaba el diario de Ferrer. La última línea está escrita con otra letra: la tuya.» — J.']
L.append(l)


# ═════════════ Comprobador ═════════════

def check(l, verbose=False):
    g = l.rows()
    assert len(g) == H and all(len(r) == W for r in g), 'tamaño'
    have_pick = getattr(l, 'hands', False)  # Parte III: rompe la roca con las manos
    have_lamp = have_dyn = False
    import math
    plat_cells = set()   # no se usa: las plataformas no son sólidas en el modelo
    rides = []           # por plataforma: casillas donde se puede ir montado
    for m in l.movers:
        if m['kind'] != 'platform' or m.get('h', 0.375) > 1:
            continue
        pts = m['path']
        ride = set()
        for i in range(1, len(pts)):
            (ax, ay), (bx, by) = pts[i - 1], pts[i]
            n = int(max(abs(bx - ax), abs(by - ay))) or 1
            for k in range(n + 1):
                px = m['x'] + ax + (bx - ax) * k / n
                py = m['y'] + ay + (by - ay) * k / n
                for dx in range(m['w']):
                    ride.add((int(round(px)) + dx, math.ceil(py - 1e-9) - 1))
        rides.append(ride)
    ride_all = set().union(*rides) if rides else set()
    starts = [(x, y) for y in range(H) for x in range(W) if g[y][x] == 'P']
    assert len(starts) == 1, 'P'
    start = starts[0]

    for _ in range(4):
        def solid(x, y):
            if x < 0 or x >= W or y >= H:
                return True
            if y < 0:
                return True
            c = g[y][x]
            if (x, y) in plat_cells:
                return True
            if (x, y) in l.extra_floor:
                return True
            # M, U, A (enemigos) y ~ (grisú) cuentan como hueco; % (tablas), R (cristal),
            # Y (seta) y * + (cristales que laten: se asume esperar a que se enciendan) como suelo
            return (c in '#R%Y*+n' or (c == 'X' and not (have_pick or have_dyn)) or (c == 'W' and not have_dyn)
                    or (c == '=' and have_lamp))

        def deadly(x, y):
            return 0 <= y < H and 0 <= x < W and g[y][x] in '^wf'

        def ladder(x, y):
            return 0 <= y < H and 0 <= x < W and g[y][x] == 'H'

        def free(x, y):
            return not solid(x, y)

        def standable(x, y):
            return free(x, y) and not deadly(x, y) and (solid(x, y + 1) or ladder(x, y) or ladder(x, y + 1) or (x, y) in ride_all)

        def settle(x, y):
            while not standable(x, y):
                if not free(x, y) or deadly(x, y):
                    return None
                y += 1
                if y >= H:
                    return None
            return (x, y)

        def clear(x, y, tx, ty):
            # Altura libre que necesita el arco: medido en el juego, con 2 filas libres
            # sobre la cabeza el salto horizontal llega a 2 casillas; para 3 hacen falta 3
            dx = abs(tx - x)
            if ty - y <= -2:
                need = 0   # saltos hacia arriba (y supersaltos de seta): basta el ápice
            else:
                need = 1 if dx <= 1 else 2
            top = min(y, ty)
            for c in range(min(x, tx), max(x, tx) + 1):
                for r in range(top - need, top):
                    if not free(c, r):
                        return False
            apex = ty if ty < y else y - 1
            for r in range(apex, y):
                if not free(x, r):
                    return False
            for c in range(min(x, tx), max(x, tx) + 1):
                if not free(c, apex):
                    return False
            for r in range(apex, ty + 1):
                if not free(tx, r):
                    return False
            return True

        seen = {start}
        todo = [start]
        while todo:
            x, y = todo.pop()
            nxt = []
            for dx in (-1, 1):
                if free(x + dx, y) and not deadly(x + dx, y):
                    nxt.append(settle(x + dx, y))
            if ladder(x, y) or ladder(x, y + 1):
                if free(x, y - 1) and (ladder(x, y - 1) or ladder(x, y)):
                    nxt.append((x, y - 1))
                if ladder(x, y + 1):
                    nxt.append((x, y + 1))
            # Sobre una seta el salto llega hasta 5 casillas más arriba
            shroom = y + 1 < H and g[y + 1][x] == 'Y'
            for dy in range(-5 if shroom else -2, 7):
                lim = 2 if dy < 0 else 3 if dy == 0 else 4
                for dx in range(-lim, lim + 1):
                    if dx == 0:
                        continue
                    tx, ty = x + dx, y + dy
                    if 0 <= tx < W and 0 <= ty < H and standable(tx, ty) and clear(x, y, tx, ty):
                        nxt.append((tx, ty))
            for ride in rides:
                if (x, y) in ride:
                    nxt.extend(c for c in ride if free(*c))
            for n in nxt:
                if n and n not in seen:
                    seen.add(n)
                    todo.append(n)
        cells = {g[y][x] for (x, y) in seen}
        np, nl = 'T' in cells or have_pick, 'L' in cells or 'F' in cells or have_lamp
        nd = 'D' in cells or have_dyn
        if (np, nl, nd) == (have_pick, have_lamp, have_dyn):
            break
        have_pick, have_lamp, have_dyn = np, nl, nd

    exit_ok = any(g[y][x] == 'S' for (x, y) in seen)
    gold_total = sum(r.count('G') for r in g)
    gold_ok = sum(1 for (x, y) in seen if g[y][x] == 'G')
    return exit_ok, gold_ok, gold_total, seen


def show(l, seen):
    g = l.rows()
    for y in range(H):
        print(''.join(('o' if (x, y) in seen and g[y][x] == '.' else g[y][x]) for x in range(W)))


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
    if '--ts' in sys.argv:
        out = []
        for l in L:
            out.append({'name': l.name, 'line': l.line, 'grid': l.rows(), 'movers': l.movers, 'notes': l.notes})
        open(sys.argv[sys.argv.index('--ts') + 1], 'w', encoding='utf-8').write(json.dumps(out, ensure_ascii=False, indent=2))
    sys.exit(1 if bad else 0)
