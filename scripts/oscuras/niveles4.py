"""Parte IV · «El canto»: Julián y la horda fuera de la mina (diseño + comprobador).

Exteriores de noche, 1923: el pueblo de Las Ánimas (1–9), la comarca (10–17) y la ciudad (18–25).
Las casas son bloques sólidos con escaleras de mano en las fachadas; se avanza por calles y tejados.
Casillas nuevas (además de las de las otras partes):
  n  ventana encendida: sólida (forma parte de la fachada); su luz quema; E la revienta
  l  farola: su luz quema; E la tumba
  f  hoguera: tocarla quema muchísimo
  v  vecino: si te ve, huye gritando y avisa a la Guardia Civil
  g  guardia civil: dispara a Julián y a los de la horda
  U  uno de los cuarenta: te sigue y muerde a los vivos que alcanza
`need` = vivos que hay que comer (tú o la horda) antes de poder seguir.

Uso (desde la raíz del proyecto):
    python scripts/oscuras/niveles4.py           # comprueba las noches (-v N muestra el mapa N)
    python scripts/oscuras/generar.py 4          # comprueba y reescribe src/lib/oscuras/maps4.ts
"""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from niveles import Lvl, check, show  # noqa: E402

L = []
GROUND = 17  # primera fila de suelo; la calle se pisa en la fila 16


def town(l, look, buildings, start=1, exit_row=None):
    """Calle de noche con casas.
    buildings: (x0, x1, alto, ventanas) — bloque sólido de `alto` casillas sobre la calle, con
    escaleras de mano pegadas a las dos fachadas y ventanas encendidas cada `ventanas` casillas
    (0 = sin ventanas)."""
    l.look = look
    l.hands = True
    l.carve(1, 1, 28, GROUND - 1)
    for (x0, x1, h, win) in buildings:
        top = GROUND - h
        l.carve(x0, top, x1, GROUND - 1, '#')
        if win:
            for y in range(top + 1, GROUND - 1, 2):
                for x in range(x0 + 1, x1, win):
                    l.put(x, y, 'n')
        if h > 2:
            if x0 - 1 >= 1 and l.g[GROUND - 1][x0 - 1] == '.':
                l.ladder(x0 - 1, top, GROUND - 1)
            if x1 + 1 <= 28 and l.g[GROUND - 1][x1 + 1] == '.':
                l.ladder(x1 + 1, top, GROUND - 1)
    l.put(start, GROUND - 1, 'P')
    r = exit_row if exit_row is not None else GROUND - 1
    l.put(28, r, 'S'); l.put(28, r - 1, 'S')


def put(l, ch, *cells):
    """Coloca algo en cada casilla, sin pisar nunca el inicio."""
    for (x, y) in cells:
        if l.g[y][x] != 'P':
            l.put(x, y, ch)


def street(x):
    return (x, GROUND - 1)


def roof(l, x):
    """Casilla de tejado (justo encima del bloque) en la columna x."""
    for y in range(1, GROUND):
        if l.g[y][x] in '#n':
            return (x, y - 1)
    return street(x)


# ═════════════ El pueblo (1–9) ═════════════

# ───────────── IV·1 · El valle ─────────────
l = Lvl('El valle', 'Abajo, el pueblo. Todas las ventanas encendidas. Esperan a los cuarenta.')
l.cinematic = [
    'La noche huele a leña y a miedo. Desde la boca de la mina se ve todo el valle.',
    'Las Ánimas ha encendido todas sus ventanas, como si la luz pudiera protegerla.',
    'Detrás de Julián, en fila, bajan los cuarenta. No hacen ruido. No respiran.',
    'Tienes hambre. Todos tenéis hambre.',
]
town(l, 'pueblo', [(7, 10, 3, 2), (15, 19, 4, 2), (23, 25, 2, 0)])
put(l, 'U', (2, 16), (3, 16), (4, 16))
put(l, 'v', street(12), roof(l, 17), street(21))
put(l, 'l', street(13))
l.need = 1
put(l, 'G', roof(l, 8), street(27))
put(l, 'C', street(5))
l.notes = ['«Los del pueblo han dejado candiles en todas las ventanas. Dicen que los muertos no entran donde hay luz.»']
L.append(l)

# ───────────── IV·2 · Las primeras casas ─────────────
l = Lvl('Las primeras casas', 'Los perros ladran en todos los corrales. Luego dejan de ladrar.')
town(l, 'pueblo', [(4, 7, 3, 2), (11, 14, 5, 2), (18, 20, 3, 0), (23, 26, 6, 2)])
put(l, 'U', (2, 16), (3, 16))
put(l, 'v', street(9), street(16), roof(l, 12), street(22))
put(l, 'l', street(10), street(21))
l.need = 2
put(l, 'G', roof(l, 5), roof(l, 25))
put(l, 'C', street(17))
l.notes = ['«La señora Remedios no quiso cerrar la puerta. Dijo que su hijo era uno de los cuarenta y que volvería a casa.»']
L.append(l)

# ───────────── IV·3 · Farolas ─────────────
l = Lvl('Farolas', 'El alcalde mandó encender todas las farolas de gas. Todas.')
town(l, 'pueblo', [(6, 8, 2, 0), (13, 15, 3, 0), (21, 23, 2, 0)])
put(l, 'U', (2, 16), (3, 16), (4, 16))
put(l, 'l', street(5), street(10), street(12), street(17), street(19), street(25))
put(l, 'v', street(11), street(18), street(26))
l.need = 2
put(l, 'G', roof(l, 14), street(20))
put(l, 'C', roof(l, 7))
l.notes = ['«Las farolas aguantan toda la noche. Las ventanas no: se rompen de una pedrada. O de un manotazo.»']
L.append(l)

# ───────────── IV·4 · La plaza ─────────────
l = Lvl('La plaza', 'Los hombres esperan en la plaza con hachas y antorchas. No sabían a qué esperaban.')
town(l, 'pueblo', [(3, 6, 4, 2), (24, 27, 5, 2)])
put(l, 'U', (1, 16), (2, 16))
l.carve(10, 15, 19, 16)
put(l, 'f', street(12), street(17))
put(l, 'v', street(9), street(14), street(15), street(21))
put(l, 'g', street(19))
put(l, 'l', street(8), street(22))
l.need = 3
put(l, 'G', roof(l, 4), street(20))
put(l, 'C', street(7))
l.notes = ['«Encended hogueras en la plaza. El fuego los para. Lo dijo el capataz antes de bajar a la mina y no volver.»']
L.append(l)

# ───────────── IV·5 · La iglesia ─────────────
l = Lvl('La iglesia', 'Las mujeres rezan en la iglesia con las puertas atrancadas. El campanario está a oscuras.')
town(l, 'pueblo', [(4, 6, 3, 0), (11, 18, 9, 2), (22, 24, 4, 2)])
put(l, 'U', (1, 16), (2, 16), (3, 16))
put(l, 'v', street(8), street(20), roof(l, 13), roof(l, 16))
put(l, 'g', street(26))
l.need = 3
put(l, 'G', roof(l, 15), roof(l, 23))
put(l, 'C', street(9))
l.notes = ['«Rezamos con las puertas atrancadas. Alguien rasca la madera. Dice “mamá” con la voz de mi Tomás.»']
L.append(l)

# ───────────── IV·6 · El cuartel ─────────────
l = Lvl('El cuartel', 'La Guardia Civil ha subido desde la comarca. Disparan sin preguntar.')
town(l, 'pueblo', [(6, 8, 2, 0), (12, 14, 3, 2), (19, 22, 6, 2)])
put(l, 'U', (1, 16), (2, 16), (3, 16), (4, 16))
put(l, 'g', street(10), roof(l, 13), street(17), street(25))
put(l, 'v', street(24))
put(l, 'l', street(16))
l.need = 2
put(l, 'G', roof(l, 7), roof(l, 21))
put(l, 'C', street(11))
l.notes = ['«Parte del cabo Robles: “Los disparos no los paran. Los tumban, y a la media hora están de pie”.»']
L.append(l)

# ───────────── IV·7 · Tejados ─────────────
l = Lvl('Tejados', 'Las calles están llenas de luz. Los tejados, no.')
town(l, 'pueblo', [(4, 7, 4, 3), (9, 12, 5, 3), (14, 17, 6, 3), (19, 22, 5, 3), (24, 26, 4, 3)])
put(l, 'U', (1, 16), (2, 16))
put(l, 'f', street(8), street(13), street(18), street(23))
put(l, 'g', roof(l, 15), street(27))
put(l, 'v', roof(l, 10), roof(l, 20))
l.need = 2
put(l, 'G', roof(l, 25), roof(l, 5))
put(l, 'C', roof(l, 11))
l.notes = ['«Han prendido hogueras en todas las calles. Los muertos suben por las fachadas como los gatos.»']
L.append(l)

# ───────────── IV·8 · La panadería ─────────────
l = Lvl('La panadería', 'El horno sigue encendido. Huele a pan. Luego huele a otra cosa.')
town(l, 'pueblo', [(5, 8, 3, 2), (12, 16, 4, 2), (20, 23, 3, 2)])
put(l, 'U', (1, 16), (2, 16), (3, 16))
put(l, 'v', street(10), street(11), street(18), street(19), roof(l, 14), street(25))
put(l, 'f', (14, 12))
put(l, 'l', street(17))
l.need = 4
put(l, 'G', roof(l, 6), roof(l, 22))
put(l, 'C', street(9))
l.notes = ['«El panadero se encerró en el horno con sus hijas. Fue lo último que vio el pueblo encendido.»']
L.append(l)

# ───────────── IV·9 · Las Ánimas arde ─────────────
l = Lvl('Las Ánimas arde', 'Los vivos queman sus propias casas para que no podáis pasar.')
town(l, 'pueblo', [(5, 8, 4, 2), (11, 14, 5, 0), (17, 20, 4, 2), (23, 26, 5, 0)])
put(l, 'U', (1, 16), (2, 16), (3, 16))
put(l, 'f', street(9), street(10), street(15), street(16), street(21), street(22), street(27))
put(l, 'g', roof(l, 12), roof(l, 24))
put(l, 'v', roof(l, 7), roof(l, 19))
l.need = 3
put(l, 'G', roof(l, 13), roof(l, 25))
put(l, 'C', roof(l, 6))
l.notes = ['«Mejor quemado que de ellos. Mejor quemado que de ellos. Mejor quemado que de…»']
L.append(l)
L[-1].exit_on_roof = True

# ═════════════ La comarca (10–17) ═════════════

# ───────────── IV·10 · El camino ─────────────
l = Lvl('El camino', 'La carretera de la comarca. Hogueras de vigilancia cada pocos metros.')
town(l, 'campo', [(8, 10, 2, 0), (17, 19, 3, 0)])
put(l, 'U', (1, 16), (2, 16), (3, 16))
put(l, 'f', street(13), street(23))
l.carve(12, 14, 14, 14, '#'); l.carve(22, 14, 24, 14, '#')
put(l, 'g', street(15), street(26))
put(l, 'v', street(6), street(21))
l.need = 2
put(l, 'G', (13, 13), (23, 13))
put(l, 'C', street(5))
l.notes = ['«Telegrama al gobernador: “Epidemia en Las Ánimas. Cerrad la carretera”. Nadie lo recibió a tiempo.»']
L.append(l)

# ───────────── IV·11 · La aldea ─────────────
l = Lvl('La aldea', 'Una aldea que no ha oído nada. Todavía duermen.')
town(l, 'campo', [(5, 7, 3, 2), (10, 13, 4, 2), (16, 18, 3, 2), (21, 24, 4, 2)])
put(l, 'U', (1, 16), (2, 16), (3, 16))
put(l, 'v', street(8), street(9), street(14), street(15), street(19), street(20), street(26))
l.need = 4
put(l, 'G', roof(l, 11), roof(l, 22))
put(l, 'C', street(25))
l.notes = ['«En la aldea no había Guardia Civil. Solo un cura viejo y una campana que nadie tocó.»']
L.append(l)

# ───────────── IV·12 · El río ─────────────
l = Lvl('El río', 'El puente de piedra es el único paso. Los guardias lo saben.')
town(l, 'campo', [(4, 6, 3, 0), (22, 25, 3, 0)])
put(l, 'U', (1, 16), (2, 16), (3, 16))
l.carve(9, 16, 19, 16, 'w')
l.carve(9, 13, 19, 13, '#')
put(l, 'g', (12, 12), (17, 12))
put(l, 'v', street(20), street(8))
l.ladder(8, 13, 16)
l.ladder(20, 13, 15)
l.need = 2
put(l, 'G', (14, 12), roof(l, 23))
put(l, 'C', street(7))
l.notes = ['«El río no os ahoga, pero os arrastra hasta el mar. Que se los lleve el mar.» — el cabo Robles']
L.append(l)

# ───────────── IV·13 · El molino ─────────────
l = Lvl('El molino', 'La rueda del molino gira sola. Dentro, alguien ha encendido todos los candiles.')
town(l, 'campo', [(5, 7, 2, 0), (12, 17, 10, 2), (21, 23, 3, 2)])
put(l, 'U', (1, 16), (2, 16), (3, 16), (4, 16))
put(l, 'v', street(9), roof(l, 14), street(19), street(25))
put(l, 'g', roof(l, 16))
l.need = 3
put(l, 'G', roof(l, 13), roof(l, 22))
put(l, 'C', street(10))
l.notes = ['«El molinero subió a lo alto con la escopeta. Desde allí veía venir la oscuridad por el camino.»']
L.append(l)

# ───────────── IV·14 · La feria ─────────────
l = Lvl('La feria', 'Es día de feria. Farolillos, música de organillo y mucha, mucha gente.')
town(l, 'campo', [(6, 8, 2, 0), (14, 16, 3, 0), (22, 24, 2, 0)])
put(l, 'U', (1, 16), (2, 16), (3, 16))
put(l, 'l', street(5), street(10), street(12), street(18), street(20), street(26))
put(l, 'v', street(9), street(11), street(13), street(17), street(19), street(21), street(25))
put(l, 'g', roof(l, 15))
l.need = 5
put(l, 'G', roof(l, 7), roof(l, 23))
put(l, 'C', street(27))
l.notes = ['«La música no paró hasta el final. El organillero siguió dando vueltas a la manivela con un brazo menos.»']
L.append(l)

# ───────────── IV·15 · El puente ─────────────
l = Lvl('El puente', 'Tres parejas de la Guardia Civil defienden el puente de hierro.')
town(l, 'campo', [(3, 5, 4, 0), (24, 26, 4, 0)])
put(l, 'U', (1, 16), (2, 16), (1, 15))
l.carve(8, 16, 21, 16, 'w')
l.carve(6, 12, 23, 12, '#')
l.ladder(6, 12, 15)
l.ladder(23, 12, 15)
put(l, 'g', (10, 11), (15, 11), (20, 11))
put(l, 'f', (12, 11), (18, 11))
put(l, 'v', street(27))
l.need = 3
put(l, 'G', (13, 11), roof(l, 25))
put(l, 'C', roof(l, 4))
l.notes = ['«Puente de la comarca. Orden: que no pase nada. Ni muertos ni vivos. Ni siquiera los nuestros.»']
L.append(l)

# ───────────── IV·16 · Hogueras ─────────────
l = Lvl('Hogueras', 'Han quemado los campos de trigo para cortaros el paso.')
town(l, 'campo', [(9, 11, 3, 0), (18, 20, 3, 0)])
put(l, 'U', (1, 16), (2, 16), (3, 16))
put(l, 'f', street(6), street(7), street(14), street(15), street(23), street(24))
l.carve(5, 13, 8, 13, '#'); l.carve(13, 13, 16, 13, '#'); l.carve(22, 13, 25, 13, '#')
l.ladder(4, 13, 16)
put(l, 'g', (14, 12), street(27))
put(l, 'v', street(12), street(21))
l.need = 3
put(l, 'G', (6, 12), (23, 12))
put(l, 'C', (7, 12))
l.notes = ['«El humo se veía desde la ciudad. Pensaron que era la cosecha.»']
L.append(l)

# ───────────── IV·17 · La estación ─────────────
l = Lvl('La estación', 'El último tren a la ciudad sale a medianoche. Vais a subir.')
town(l, 'campo', [(4, 7, 4, 2), (22, 26, 4, 2)])
put(l, 'U', (1, 16), (2, 16), (3, 16))
l.carve(9, 16, 20, 16, '^')
l.movers.append(dict(kind='platform', x=9, y=16, w=3, path=[[0, 0], [9, 0]], speed=0.7, wait=50, light=True))
put(l, 'g', roof(l, 5), roof(l, 24), street(27))
put(l, 'v', street(8), street(21))
l.need = 3
put(l, 'G', roof(l, 6), roof(l, 23))
put(l, 'C', street(3))
l.notes = ['«Tren correo, medianoche. Seis vagones. Llegó a la ciudad con todas las luces apagadas.»']
L.append(l)

# ═════════════ La ciudad (18–25) ═════════════

# ───────────── IV·18 · Arrabales ─────────────
l = Lvl('Arrabales', 'La ciudad empieza por los barrios pobres. Nadie vigila los barrios pobres.')
town(l, 'ciudad', [(4, 7, 5, 2), (10, 13, 7, 2), (16, 18, 4, 2), (21, 25, 8, 2)])
put(l, 'U', (1, 16), (2, 16), (3, 16))
put(l, 'v', street(8), street(9), street(14), street(19), street(20), street(26))
put(l, 'l', street(15))
l.need = 3
put(l, 'G', roof(l, 11), roof(l, 23))
put(l, 'C', street(27))
l.notes = ['«Los periódicos dicen que es la gripe. La gripe no se levanta de la cama a medianoche.»']
L.append(l)

# ───────────── IV·19 · La fábrica ─────────────
l = Lvl('La fábrica', 'Los obreros del turno de noche han atrancado las puertas con hierro.')
town(l, 'ciudad', [(6, 9, 6, 3), (13, 18, 9, 3), (22, 25, 6, 3)])
put(l, 'U', (1, 16), (2, 16), (3, 16))
l.carve(11, 14, 11, 16, 'W'); l.carve(20, 14, 20, 16, 'W')
put(l, 'D', street(4), street(10), street(19))
put(l, 'v', street(12), street(21), roof(l, 15))
put(l, 'g', roof(l, 17), street(27))
l.need = 3
put(l, 'G', roof(l, 7), roof(l, 24))
put(l, 'C', street(5))
l.notes = ['«Hemos soldado las puertas. Si entran, que entren por el tejado. Si entran, ya da igual.»']
L.append(l)

# ───────────── IV·20 · Tranvías ─────────────
l = Lvl('Tranvías', 'Los tranvías siguen circulando. Nadie los conduce.')
town(l, 'ciudad', [(3, 6, 6, 2), (23, 26, 6, 2)])
put(l, 'U', (1, 16), (2, 16))
l.carve(8, 16, 21, 16, '^')
l.movers += [
    dict(kind='platform', x=8, y=16, w=3, path=[[0, 0], [5, 0]], speed=0.7, wait=40, light=True),
    dict(kind='platform', x=15, y=16, w=3, path=[[0, 0], [4, 0]], speed=0.7, wait=40, phase=120, light=True),
]
l.carve(13, 16, 14, 16, '#')
put(l, 'g', roof(l, 4), roof(l, 25))
put(l, 'v', street(7), street(22), street(27))
l.need = 3
put(l, 'G', (13, 15), roof(l, 24))
put(l, 'C', street(14))
l.notes = ['«Tranvía 12: el conductor sigue en su sitio. Le falta media cara. Sigue tocando la campanilla.»']
L.append(l)

# ───────────── IV·21 · La comisaría ─────────────
l = Lvl('La comisaría', 'Los guardias de asalto se han hecho fuertes. Tienen ametralladora.')
town(l, 'ciudad', [(5, 8, 4, 2), (12, 17, 7, 2), (21, 24, 5, 2)])
put(l, 'U', (1, 16), (2, 16), (3, 16), (4, 16))
put(l, 'g', street(10), street(11), roof(l, 13), roof(l, 16), street(19), street(26))
put(l, 'f', street(9), street(20))
l.need = 3
put(l, 'G', roof(l, 6), roof(l, 22))
put(l, 'C', street(27))
l.notes = ['«Disparamos hasta quedarnos sin balas. Luego disparamos con las que les sacábamos a ellos.»']
L.append(l)

# ───────────── IV·22 · El hospital ─────────────
l = Lvl('El hospital', 'Los enfermos no pueden huir. Las monjas no quieren.')
town(l, 'ciudad', [(4, 9, 6, 2), (13, 20, 8, 2), (24, 26, 4, 0)])
put(l, 'U', (1, 16), (2, 16), (3, 16))
put(l, 'v', street(10), street(11), street(12), street(21), street(22), street(23), roof(l, 15), roof(l, 18))
put(l, 'l', street(27))
l.need = 5
put(l, 'G', roof(l, 6), roof(l, 25))
put(l, 'C', roof(l, 16))
l.notes = ['«Sor Inés cerró la sala de infecciosos con los enfermos dentro. Dijo que así al menos morirían en gracia.»']
L.append(l)

# ───────────── IV·23 · El ejército ─────────────
l = Lvl('El ejército', 'Ha llegado el ejército con camiones, focos y fuego.')
town(l, 'ciudad', [(5, 7, 5, 0), (11, 13, 6, 0), (17, 19, 6, 0), (23, 25, 5, 0)])
put(l, 'U', (1, 16), (2, 16), (3, 16), (4, 16))
put(l, 'g', street(9), street(15), street(21), street(27), roof(l, 12), roof(l, 18))
put(l, 'f', street(10), street(16), street(22))
put(l, 'l', street(8), street(14), street(20), street(26))
l.need = 4
put(l, 'G', roof(l, 6), roof(l, 24))
put(l, 'C', roof(l, 18))
l.notes = ['«Teniente Ferrer: “Lanzallamas en cada esquina”. A las tres de la mañana, el teniente Ferrer ya no daba órdenes.»']
L.append(l)

# ───────────── IV·24 · La catedral ─────────────
l = Lvl('La catedral', 'Toda la ciudad que queda viva se ha refugiado en la catedral.')
town(l, 'ciudad', [(4, 7, 5, 2), (11, 19, 11, 2), (23, 26, 5, 2)])
put(l, 'U', (1, 16), (2, 16), (3, 16), (4, 15))
put(l, 'v', street(9), street(10), street(20), street(21), roof(l, 13), roof(l, 17), street(27))
put(l, 'g', roof(l, 15), street(22))
l.need = 4
put(l, 'G', roof(l, 5), roof(l, 24))
put(l, 'C', street(8))
l.notes = ['«Cantamos todos juntos para no oírlos. Cantamos tan alto que no oímos que el canto era el mismo.»']
L.append(l)

# ───────────── IV·25 · El canto ─────────────
l = Lvl('El canto', 'La última plaza con luz. Cuando se apague, el canto lo llenará todo.')
town(l, 'ciudad', [(4, 6, 8, 2), (23, 25, 8, 2)])
put(l, 'U', (1, 16), (2, 16), (3, 16))
l.carve(9, 13, 20, 13, '#')
l.ladder(8, 13, 16); l.ladder(21, 13, 16)
put(l, 'l', street(10), street(14), street(18), (11, 12), (17, 12))
put(l, 'f', street(12), street(16))
put(l, 'v', street(11), street(13), street(15), street(17), street(19), (14, 12), (15, 12))
put(l, 'g', roof(l, 5), roof(l, 24), (12, 12))
l.need = 6
put(l, 'G', (16, 12), roof(l, 24))
put(l, 'C', street(7))
l.notes = ['«Si alguien encuentra esto: no somos los últimos. Somos los primeros en dejar de cantar.»']
L.append(l)


if __name__ == '__main__':
    bad = False
    for i, l in enumerate(L):
        ok, go, gt, seen = check(l)
        notes = sum(r.count('C') for r in l.rows())
        humans = sum(r.count('v') + r.count('g') for r in l.rows())
        need_ok = (l.need or 0) <= humans
        print(f'{i + 1:2} {l.name:26} salida={"OK" if ok else "NO"}  oro {go}/{gt}  notas {len(l.notes)}/{notes}  comer {l.need or 0}/{humans}')
        if not ok or go != gt or len(l.notes) > notes or not need_ok:
            bad = True
        if '-v' in sys.argv and (not ok or go != gt or str(i + 1) in sys.argv):
            show(l, seen)
    sys.exit(1 if bad else 0)
