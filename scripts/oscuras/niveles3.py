"""Parte III · «Lo que sube»: Julián, muerto, intenta salir de la mina (diseño + comprobador).

Julián rompe la roca agrietada (X) con las manos, no lleva lámpara y la luz le quema.
Casillas nuevas (además de las de niveles.py y niveles2.py):
  h  minero de la cuadrilla de rescate: patrulla con lámpara y pico; su luz quema
  I  el cura: quieto en el altar; su luz crece con cada vela encendida
  p  perro de Ventura: te huele y muerde (y se come)
  c  vela: su luz quema; E para apagarla
  V  Ventura: lanza dinamita; aquí se le puede comer
  U  hueco: uno de los cuarenta; en esta parte te sigue y no ataca
`need` = humanos que hay que comer antes de poder salir de la galería.

Uso (desde la raíz del proyecto):
    python scripts/oscuras/niveles3.py           # comprueba las galerías (-v N muestra el mapa N)
    python scripts/oscuras/generar.py 3          # comprueba y reescribe src/lib/oscuras/maps3.ts
"""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from niveles import Lvl, check, show, corridor, pit  # noqa: E402
from niveles2 import tri, planks  # noqa: E402

L = []


def cands(l, *cells):
    for (x, y) in cells:
        l.put(x, y, 'c')


# ═════════════ El despertar (1–5) ═════════════

# ───────────── III·1 · El ataúd ─────────────
l = Lvl('El ataúd', 'Madera de pino, tierra en la boca. Y un hambre que no es tuya.')
l.cinematic = [
    'Abres los ojos dentro de un ataúd. No respiras. No te hace falta.',
    'Ves en la oscuridad: todo es rojo, como mirar a través de un párpado cerrado.',
    'Te arrancas la tapa con los dedos. Se te quedan dos uñas clavadas en la madera. No duele.',
    'Muy arriba, alguien reza. Y tú tienes hambre.',
]
tri(l, up=True)
l.carve(8, 14, 8, 16, 'X')
pit(l, 14, 15, 17)
l.carve(20, 8, 20, 10, 'X')
pit(l, 11, 12, 11)
l.carve(12, 2, 12, 4, 'X')
cands(l, (22, 16), (6, 10), (20, 4))
l.put(4, 16, 'C'); l.put(17, 10, 'C')
l.put(18, 16, 'G'); l.put(9, 10, 'G'); l.put(24, 4, 'G')
l.notes = [
    '«Aquí enterramos a Julián Arias, catorce años. El ataúd lo pagó la Compañía.» — tablilla del nicho',
    '«No le cerraron los ojos. Ventura dijo que daba igual: que iba a volver a abrirlos.»',
]
L.append(l)

# ───────────── III·2 · Velas ─────────────
l = Lvl('Velas', 'Alguien ha dejado velas encendidas por toda la galería. Para ti.')
tri(l, up=True)
cands(l, (6, 16), (11, 16), (16, 16), (21, 16), (24, 10), (18, 10), (12, 10), (6, 10), (7, 4), (13, 4), (19, 4), (24, 4))
pit(l, 14, 15, 17)
pit(l, 9, 10, 11)
pit(l, 16, 17, 5)
l.put(10, 16, 'U'); l.put(22, 10, 'U')
l.put(25, 16, 'G'); l.put(15, 10, 'G'); l.put(10, 4, 'G')
l.put(4, 4, 'C')
l.notes = ['«Velas de la capilla, puestas en fila hacia la boca de la mina. Las encendió el cura. Sabe que vas a subir.»']
L.append(l)

# ───────────── III·3 · El primero ─────────────
l = Lvl('El primero', 'Un minero de la cuadrilla de rescate. Huele a sudor y a sangre caliente.')
tri(l, up=True)
l.need = 1
l.put(14, 10, 'h')
pit(l, 9, 10, 17)
pit(l, 20, 21, 11)
cands(l, (22, 16), (6, 4))
pit(l, 15, 16, 5)
l.put(5, 16, 'U')
l.put(14, 16, 'G'); l.put(8, 10, 'G'); l.put(22, 4, 'G')
l.put(24, 16, 'C')
l.notes = ['«Cuadrilla de rescate, día tres. Seguimos sin encontrar a nadie vivo. Abajo se oye algo que mastica.»']
L.append(l)

# ───────────── III·4 · La cuadrilla ─────────────
l = Lvl('La cuadrilla', 'Bajan de tres en tres, con las lámparas en alto. Llaman a los cuarenta por su nombre.')
tri(l, up=True)
l.need = 2
l.put(13, 16, 'h'); l.put(10, 10, 'h'); l.put(18, 4, 'h')
for (x, y) in [(20, 16), (6, 10), (24, 4)]: l.put(x, y, 'L')
pit(l, 16, 17, 17)
pit(l, 19, 20, 11)
pit(l, 10, 11, 5)
l.put(6, 16, 'G'); l.put(15, 10, 'G'); l.put(13, 4, 'G')
l.put(23, 10, 'C')
l.notes = ['«Han colgado lámparas en los pasillos para no perderse. Revienta una de un manotazo y nadie la echará de menos.»']
L.append(l)

# ───────────── III·5 · Los perros ─────────────
l = Lvl('Los perros', 'Ladridos. Los perros de Ventura no necesitan luz para encontrarte.')
tri(l, up=True)
l.need = 1
l.put(16, 16, 'p'); l.put(22, 10, 'p'); l.put(9, 4, 'p')
l.put(12, 10, 'h')
pit(l, 10, 11, 17)
pit(l, 7, 8, 11)
pit(l, 18, 19, 5)
cands(l, (24, 16), (15, 4))
l.put(20, 16, 'G'); l.put(16, 10, 'G'); l.put(23, 4, 'G')
l.put(5, 10, 'C')
l.notes = ['«Los perros no ladran a los muertos. A Julián le ladran. Algo dentro de él sigue vivo, o algo más.»']
L.append(l)

# ═════════════ El rescate (6–12) ═════════════

# ───────────── III·6 · Lámparas colgadas ─────────────
l = Lvl('Lámparas colgadas', 'Cada lámpara es una herida abierta en la oscuridad.')
tri(l, up=False)
l.need = 2
for (x, y) in [(6, 4), (10, 4), (15, 4), (21, 4), (24, 10), (18, 10), (11, 10), (7, 16), (13, 16), (20, 16)]: l.put(x, y, 'L')
l.put(17, 4, 'h'); l.put(14, 10, 'h'); l.put(16, 16, 'h')
pit(l, 12, 13, 5)
pit(l, 7, 8, 11)
l.put(9, 4, 'G'); l.put(21, 10, 'G'); l.put(24, 16, 'G')
l.put(4, 10, 'C')
l.notes = ['«Encendemos todas las lámparas. Dicen que lo que hay abajo no soporta la luz.»']
L.append(l)

# ───────────── III·7 · Silencio ─────────────
l = Lvl('Silencio', 'Si corres, te oyen. Si te oyen, levantan las lámparas.')
tri(l, up=True)
l.need = 3
for (x, y) in [(9, 16), (17, 16), (22, 16), (8, 10), (15, 10), (20, 4), (11, 4)]: l.put(x, y, 'h')
pit(l, 12, 13, 17)
pit(l, 23, 24, 11)
pit(l, 15, 16, 5)
cands(l, (5, 16), (25, 10))
l.put(19, 16, 'G'); l.put(11, 10, 'G'); l.put(7, 4, 'G')
l.put(25, 16, 'C')
l.notes = ['«Andad despacio. A los muertos se les oye arrastrar los pies, pero también se les oye pararse.»']
L.append(l)

# ───────────── III·8 · La jaula ─────────────
l = Lvl('La jaula', 'El pozo del montacargas. Arriba, la cuadrilla ha montado un puesto.')
l.need = 2
l.carve(3, 1, 26, 16)
l.carve(27, 13, 28, 16)
for x in range(3, 18): l.put(x, 16, '^')
for (x0, x1, y, ch) in [(20, 23, 15, '#'), (14, 18, 13, '#'), (20, 24, 11, '#'), (14, 18, 9, '#'),
                        (20, 24, 7, '#'), (14, 18, 5, '#'), (3, 12, 3, '#')]:
    l.carve(x0, y, x1, y, ch)
l.put(16, 12, 'h'); l.put(22, 10, 'h'); l.put(16, 8, 'h'); l.put(22, 6, 'h')
cands(l, (17, 4), (10, 2))
l.put(27, 16, 'P'); l.put(4, 1, 'S'); l.put(4, 2, 'S')
l.put(21, 14, 'G'); l.put(11, 2, 'G')
l.put(23, 10, 'C')
l.notes = ['«Puesto de la cuadrilla en el pozo. Turnos de dos horas. Nadie quiere hacer el de la noche.»']
L.append(l)

# ───────────── III·9 · Ruido ─────────────
l = Lvl('Ruido', 'Las barrenas hacen ruido. Tú no tienes por qué.')
tri(l, up=True)
l.need = 2
l.movers += [
    dict(kind='spikes', x=10, y=16, w=3, period=130, up=45, warn=25),
    dict(kind='spikes', x=16, y=10, w=3, period=130, up=45, warn=25, phase=65),
    dict(kind='spikes', x=12, y=4, w=3, period=130, up=45, warn=25),
]
l.put(19, 16, 'h'); l.put(8, 10, 'h'); l.put(20, 4, 'h')
l.put(23, 16, 'p'); l.put(22, 10, 'p')
pit(l, 6, 7, 17)
pit(l, 12, 13, 11)
l.put(15, 16, 'G'); l.put(20, 10, 'G'); l.put(24, 4, 'G')
l.put(5, 4, 'C')
l.notes = ['«Las barrenas se encendieron solas otra vez. El capataz dice que es la presión. El capataz miente.»']
L.append(l)

# ───────────── III·10 · Barricada ─────────────
l = Lvl('Barricada', 'Han tapiado la galería con flejes de hierro. Por si algo intenta subir.')
tri(l, up=True)
l.need = 2
l.carve(14, 14, 14, 16, 'W'); l.carve(9, 8, 9, 10, 'W'); l.carve(19, 2, 19, 4, 'W')
l.put(6, 16, 'D'); l.put(24, 10, 'D'); l.put(13, 4, 'D'); l.put(10, 16, 'D')
l.put(18, 16, 'h'); l.put(15, 10, 'h'); l.put(23, 4, 'h')
pit(l, 21, 22, 17)
cands(l, (12, 10), (8, 4))
l.put(25, 16, 'G'); l.put(5, 10, 'G'); l.put(25, 4, 'G')
l.put(4, 4, 'C')
l.notes = ['«Barricadas de Ventura en cada planta. Dejó la dinamita al lado “por si hay que abrirlas desde dentro”.»']
L.append(l)

# ───────────── III·11 · La enfermería ─────────────
l = Lvl('La enfermería', 'Camillas, vendas, frascos. Aquí traían a los que sacaban vivos.')
tri(l, up=False)
l.need = 4
for (x, y) in [(10, 4), (19, 4), (8, 10), (15, 10), (21, 10), (12, 16), (19, 16)]: l.put(x, y, 'h')
cands(l, (14, 4), (24, 4), (11, 10), (18, 10), (16, 16))
pit(l, 6, 7, 5)
pit(l, 23, 24, 17)
for (x, y) in [(5, 4), (24, 10), (8, 16)]: l.put(x, y, 'C')
l.put(17, 4, 'G'); l.put(13, 10, 'G'); l.put(26, 16, 'G')
l.notes = [
    '«Camilla 3: Ramiro Ruiz. Pierna rota. Murió en la camilla. A las dos horas se levantó.»',
    '«Camilla 7: Tomás Gil. Ojos abiertos. No hay forma de cerrárselos.»',
    '«No se los traigáis más al pueblo. Quemadlos aquí abajo.» — el médico',
]
L.append(l)

# ───────────── III·12 · Agua negra ─────────────
l = Lvl('Agua negra', 'Han inundado las galerías de abajo. A ti no te ahoga. A ellos sí.')
tri(l, up=True)
l.need = 2
l.flood = {'from': 18, 'speed': 0.12, 'delay': 260, 'to': 1}
l.put(14, 16, 'h'); l.put(18, 10, 'h'); l.put(9, 10, 'h'); l.put(16, 4, 'h')
planks(l, 9, 11, 17)
pit(l, 13, 14, 11)
cands(l, (23, 4))
l.put(20, 16, 'G'); l.put(24, 10, 'G'); l.put(10, 4, 'G')
l.put(6, 10, 'C')
l.notes = ['«Si no se ahogan, que se pudran en el agua. Abrid las compuertas.» — orden de Ventura']
L.append(l)

# ═════════════ La capilla (13–17) ═════════════

# ───────────── III·13 · Cirios ─────────────
l = Lvl('Cirios', 'El suelo está cubierto de cera. Huele a iglesia cerrada.')
tri(l, up=True)
l.need = 2
cands(l, (5, 16), (8, 16), (11, 16), (14, 16), (17, 16), (20, 16), (23, 16),
      (24, 10), (20, 10), (16, 10), (12, 10), (8, 10), (6, 4), (10, 4), (14, 4), (18, 4), (22, 4))
l.put(15, 16, 'h'); l.put(10, 10, 'h'); l.put(16, 4, 'h')
pit(l, 18, 19, 11)
l.put(25, 16, 'G'); l.put(14, 10, 'G'); l.put(24, 4, 'G')
l.put(4, 10, 'C')
l.notes = ['«Monaguillo, 1923: el padre Anselmo dice que cada vela es una oración. Hemos encendido trescientas.»']
L.append(l)

# ───────────── III·14 · El coro de los cuarenta ─────────────
l = Lvl('El coro de los cuarenta', 'Detrás de ti, cada vez más pasos. Los cuarenta te siguen.')
tri(l, up=True)
l.need = 3
for (x, y) in [(4, 16), (6, 16), (8, 16), (5, 10), (8, 10), (24, 4)]: l.put(x, y, 'U')
for (x, y) in [(15, 16), (21, 16), (13, 10), (19, 10), (11, 4), (17, 4)]: l.put(x, y, 'h')
pit(l, 11, 12, 17)
pit(l, 22, 23, 11)
cands(l, (24, 16), (6, 4))
l.put(18, 16, 'G'); l.put(16, 10, 'G'); l.put(21, 4, 'G')
l.put(25, 10, 'C')
l.notes = ['«Los cuarenta ya no buscan el canto. Buscan a Julián. Le siguen como a un pastor.»']
L.append(l)

# ───────────── III·15 · Monaguillos ─────────────
l = Lvl('Monaguillos', 'Dos niños con incensarios bajan delante del cura. Rezan muy deprisa.')
tri(l, up=True)
l.need = 2
l.put(14, 16, 'h'); l.put(19, 10, 'h')
for (x, y) in [(22, 16), (10, 10), (16, 4)]: l.put(x, y, 'p')
cands(l, (8, 16), (24, 10), (6, 10), (12, 4), (22, 4))
pit(l, 17, 18, 17)
pit(l, 13, 14, 11)
pit(l, 18, 19, 5)
l.put(11, 16, 'G'); l.put(22, 10, 'G'); l.put(9, 4, 'G')
l.put(25, 4, 'C')
l.notes = ['«No eran niños. Eran los hijos de los mineros. El cura los trajo para que el muerto viera a quién se iba a comer.»']
L.append(l)

# ───────────── III·16 · La nave ─────────────
l = Lvl('La nave', 'Una iglesia excavada en la roca. Bancos, cirios y una cuadrilla rezando.')
corridor(l, 1, 28, 6, 16)
l.carve(1, 2, 28, 4)
l.carve(1, 5, 28, 5, '#'); l.ladder(27, 5, 16); l.ladder(2, 5, 16)
for x0 in (6, 12, 18):
    l.carve(x0, 16, x0 + 2, 16, '#')
for (x0, x1, y) in [(5, 9, 12), (11, 14, 10), (21, 24, 12)]:
    l.carve(x0, y, x1, y, '#')
cands(l, (4, 15), (10, 15), (16, 15), (22, 15), (7, 11), (14, 9), (23, 11), (8, 4), (16, 4), (22, 4))
for (x, y) in [(9, 15), (15, 15), (21, 15), (7, 11), (12, 9)]: l.put(x, y, 'h')
l.need = 3
l.put(1, 15, 'P'); l.put(28, 3, 'S'); l.put(28, 4, 'S')
l.put(22, 11, 'G'); l.put(13, 9, 'G'); l.put(12, 4, 'G')
l.put(25, 15, 'C')
l.notes = ['«La nave de los mineros. La excavaron en 1880, cuando el canto sonó la primera vez.»']
L.append(l)

# ───────────── III·17 · El cura ─────────────
l = Lvl('El cura', 'El padre Anselmo te espera en el altar, rodeado de cirios. No huye.')
l.need = 1
corridor(l, 1, 28, 8, 16)
l.carve(20, 13, 26, 13, '#')
l.put(23, 12, 'I')
cands(l, (20, 12), (21, 12), (25, 12), (26, 12), (18, 16), (14, 16), (10, 16))
for (x0, x1, y) in [(5, 8, 13), (10, 13, 11), (15, 18, 13)]:
    l.carve(x0, y, x1, y, '#')
l.carve(1, 2, 28, 4); l.carve(1, 5, 28, 7, '#'); l.ladder(27, 5, 16)
l.put(1, 15, 'P'); l.put(28, 3, 'S'); l.put(28, 4, 'S')
l.put(12, 10, 'G'); l.put(10, 4, 'G')
l.put(4, 15, 'C')
l.notes = ['«Padre Anselmo: “Si el muerto llega al altar, que me coma a mí. Así el pueblo tendrá un día más”.»']
L.append(l)

# ═════════════ Ventura (18–22) ═════════════

# ───────────── III·18 · Las cargas ─────────────
l = Lvl('Las cargas', 'Ventura te ha visto. Sabe que la dinamita no te mata. Pero te deja en pedazos.')
tri(l, up=True)
l.need = 1
l.ventura = 160
l.carve(13, 6, 15, 7); l.put(14, 7, 'V')
l.put(19, 16, 'h')
pit(l, 9, 10, 17)
pit(l, 20, 21, 11)
pit(l, 11, 12, 5)
cands(l, (24, 4))
l.put(14, 16, 'G'); l.put(6, 10, 'G'); l.put(20, 4, 'G')
l.put(25, 16, 'C')
l.notes = ['«Ventura: “A los muertos no se les mata. Se les trocea. Luego se queman los trozos por separado”.»']
L.append(l)

# ───────────── III·19 · Perros de caza ─────────────
l = Lvl('Perros de caza', 'Ventura suelta a los perros. Y lanza dinamita detrás de ellos.')
tri(l, up=True)
l.need = 1
l.ventura = 150
l.carve(12, 12, 14, 13); l.put(13, 13, 'V')
for (x, y) in [(19, 16), (23, 16), (16, 10), (21, 10), (12, 4)]: l.put(x, y, 'p')
l.put(9, 10, 'h')
pit(l, 7, 8, 11)
pit(l, 17, 18, 5)
l.put(25, 16, 'G'); l.put(24, 10, 'G'); l.put(22, 4, 'G')
l.put(5, 4, 'C')
l.notes = ['«Los perros vuelven con la boca llena de algo frío. Ventura les da otra vez el olor del ataúd.»']
L.append(l)

# ───────────── III·20 · La trampa ─────────────
l = Lvl('La trampa', 'Tablas podridas, flejes de hierro y un capataz que conoce la mina mejor que nadie.')
tri(l, up=True)
l.need = 1
l.ventura = 140
l.carve(17, 6, 19, 7); l.put(18, 7, 'V')
planks(l, 9, 12, 17)
l.carve(20, 14, 20, 16, 'W')
l.put(16, 16, 'D'); l.put(5, 16, 'D')
planks(l, 13, 15, 11)
l.put(10, 10, 'h'); l.put(22, 4, 'h')
pit(l, 14, 15, 5)
l.put(24, 16, 'G'); l.put(6, 10, 'G'); l.put(25, 4, 'G')
l.put(23, 10, 'C')
l.notes = ['«Ventura ha preparado la galería durante cuarenta años. Cada tabla floja la aflojó él.»']
L.append(l)

# ───────────── III·21 · Su lámpara ─────────────
l = Lvl('Su lámpara', 'La lámpara de Ventura brilla más que ninguna. La lleva su hijo.')
tri(l, up=False)
l.need = 3
l.ventura = 150
l.carve(13, 12, 15, 13); l.put(14, 13, 'V')
for (x, y) in [(10, 4), (18, 4), (9, 10), (20, 10), (22, 16)]: l.put(x, y, 'h')
l.put(16, 16, 'p')
pit(l, 14, 15, 5)
pit(l, 14, 15, 11)
cands(l, (6, 10), (25, 4))
l.put(22, 4, 'G'); l.put(24, 10, 'G'); l.put(10, 16, 'G')
l.put(5, 4, 'C')
l.notes = ['«El hijo de Ventura lleva la lámpara de su padre. Tiene catorce años, como Julián. Como todos los que bajan.»']
L.append(l)

# ───────────── III·22 · Ventura ─────────────
l = Lvl('Ventura', 'Cuarenta años sellando la mina. Esta vez no le queda nadie a quien encerrar.')
l.need = 1
l.ventura = 120
corridor(l, 1, 28, 14, 16)
l.carve(27, 5, 28, 13); l.ladder(27, 5, 16)
corridor(l, 1, 28, 2, 4)
l.put(14, 4, 'V')
pit(l, 9, 10, 17)
for (x, y) in [(18, 16), (21, 16)]: l.put(x, y, 'p')
cands(l, (20, 4), (8, 4), (5, 16))
l.put(1, 16, 'P'); l.put(1, 3, 'S'); l.put(1, 4, 'S')
l.put(14, 16, 'G'); l.put(24, 4, 'G')
l.put(3, 16, 'C')
l.notes = ['«Diario de Ventura, última página: “Si me come, que sea rápido. Si no me come, que Dios nos ayude a todos”.»']
L.append(l)

# ═════════════ La boca (23–25) ═════════════

# ───────────── III·23 · Los últimos ─────────────
l = Lvl('Los últimos', 'Sin Ventura, la cuadrilla huye hacia arriba. Tú subes detrás.')
tri(l, up=True)
l.need = 4
for (x, y) in [(10, 16), (15, 16), (20, 16), (8, 10), (13, 10), (19, 10), (9, 4), (16, 4), (21, 4)]: l.put(x, y, 'h')
for (x, y) in [(23, 16), (24, 10)]: l.put(x, y, 'p')
pit(l, 12, 13, 17)
pit(l, 16, 17, 11)
pit(l, 12, 13, 5)
cands(l, (6, 16), (6, 4))
l.put(18, 16, 'G'); l.put(10, 10, 'G'); l.put(24, 4, 'G')
l.put(25, 16, 'C')
l.notes = ['«Salid todos. Cerrad la boca de la mina detrás. Que se quede ahí abajo con los demás.»']
L.append(l)

# ───────────── III·24 · Los cuarenta ─────────────
l = Lvl('Los cuarenta', 'Ya no subes solo. Detrás de ti, la oscuridad camina.')
tri(l, up=True)
l.need = 3
for x in range(3, 10): l.put(x, 16, 'U')
for x in (5, 7): l.put(x, 10, 'U')
for (x, y) in [(15, 16), (21, 16), (12, 10), (18, 10), (14, 4), (20, 4)]: l.put(x, y, 'h')
cands(l, (24, 16), (24, 10), (8, 4), (24, 4))
pit(l, 17, 18, 17)
pit(l, 9, 10, 11)
l.put(13, 16, 'G'); l.put(22, 10, 'G'); l.put(11, 4, 'G')
l.put(25, 10, 'C')
l.notes = ['«Contamos los muertos que suben detrás de él. Treinta y ocho. Treinta y nueve. Cuarenta.»']
L.append(l)

# ───────────── III·25 · La boca de la mina ─────────────
l = Lvl('La boca de la mina', 'Arriba, el aire de la noche. Y la última barricada de los vivos.')
l.need = 3
l.carve(3, 1, 26, 16)
l.carve(27, 13, 28, 16)
for x in range(3, 18): l.put(x, 16, '^')
for (x0, x1, y, ch) in [(20, 23, 15, '#'), (14, 18, 13, '#'), (20, 24, 11, '%'), (14, 18, 9, '#'),
                        (20, 24, 7, '#'), (14, 18, 5, '#'), (6, 12, 3, '#')]:
    l.carve(x0, y, x1, y, ch)
l.carve(3, 3, 5, 3, '#')
for (x, y) in [(16, 12), (22, 10), (16, 8), (22, 6), (16, 4), (9, 2)]: l.put(x, y, 'h')
cands(l, (18, 12), (14, 8), (24, 6), (12, 2))
l.put(27, 16, 'P'); l.put(4, 1, 'S'); l.put(4, 2, 'S')
l.put(21, 14, 'G'); l.put(7, 2, 'G')
l.put(23, 14, 'C')
l.notes = ['«Si lees esto desde dentro: no salgas. Allí arriba hay demasiada gente. Y tú tienes demasiada hambre.» — J.']
L.append(l)

# Toda la Parte III: Julián rompe la roca con las manos
for _l in L:
    _l.hands = True


if __name__ == '__main__':
    bad = False
    for i, l in enumerate(L):
        ok, go, gt, seen = check(l)
        notes = sum(r.count('C') for r in l.rows())
        humans = sum(r.count('h') + r.count('I') for r in l.rows()) + sum(r.count('V') for r in l.rows())
        need_ok = (l.need or 0) <= humans
        print(f'{i + 1:2} {l.name:26} salida={"OK" if ok else "NO"}  oro {go}/{gt}  notas {len(l.notes)}/{notes}  comer {l.need or 0}/{humans}')
        if not ok or go != gt or len(l.notes) > notes or not need_ok:
            bad = True
        if '-v' in sys.argv and (not ok or go != gt or str(i + 1) in sys.argv):
            show(l, seen)
    sys.exit(1 if bad else 0)
