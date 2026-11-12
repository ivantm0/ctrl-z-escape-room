/**
 * «A Oscuras» como un único juego de 100 niveles.
 *
 * Los mapas siguen generándose por bloques (maps.ts, maps2.ts, maps3.ts, maps4.ts, desde
 * scripts/oscuras/), pero aquí se encadenan en una sola campaña. Cada nivel lleva su
 * ambientación (`theme`) y los cambios de etapa se cuentan con escenas dentro del juego:
 *
 *   1–25    la mina (Galería)        → la falsa salida explota en el 25
 *   26–50   el abismo (Abismo)       → escena de la caída al entrar
 *   51–75   Julián muerto (Subida)   → escena del filón roto, la lápida y el ataúd
 *   76–100  fuera de la mina (Noche) → escena de la boca de la mina; final en el 100
 */
import { levels as mina, type Level } from './maps';
import { levels2 } from './maps2';
import { levels3 } from './maps3';
import { levels4 } from './maps4';

type Theme = NonNullable<Level['theme']>;

const tag = (ls: Level[], theme: Theme): Level[] => ls.map((l) => ({ ...l, theme }));

/** Al salir del nivel 25: la cuerda se parte… y Julián cae al abismo */
const CAIDA = [
  'La cuerda se parte. Los cristales de todas las grutas gritan a la vez y estallan, y la luz se apaga de golpe.',
  'Caes durante mucho tiempo. Lo último que ves, muy arriba, es un trozo de cielo que se cierra.',
  'Cuando abres los ojos, la roca es rojiza y caliente, y una luz enferma sale de las piedras. Se ve un poco más. Lo que se ve es peor.',
  'Los cuarenta no se quedaron quietos. Siguen andando, ciegos, buscando el canto. Y el canto suena muy cerca.',
];

/** Al salir del nivel 50: el filón se rompe, Julián sube… y descubre su lápida */
const LAPIDA = [
  'Cuando el filón madre se rompe, el canto se calla de golpe. Por primera vez, la mina está en silencio.',
  'Subes durante horas por galerías que ya conoces. Sales a la noche. El pueblo está a oscuras y vacío.',
  'En la capilla hay una lápida con cuarenta y un nombres. El último es el tuyo: Julián Arias, 1909 – 1923.',
  'A sus pies, escrita con carbón y con tu letra, una nota todavía tibia: «No subas». Entonces todo se apaga.',
];

/** Al salir del nivel 75: la boca de la mina y el pueblo encendido */
const BOCA = [
  'La boca de la mina da a la noche. Hace frío, pero tú ya no lo sientes.',
  'Detrás de ti, en la oscuridad, cuarenta pares de ojos rojos esperan a que des el primer paso.',
];

const parte1 = tag(mina, 'mina');
parte1[parte1.length - 1] = { ...parte1[parte1.length - 1], boom: true };

const parte2 = tag(levels2, 'abismo');
parte2[0] = { ...parte2[0], cinematic: CAIDA };

const parte3 = tag(levels3, 'muerto');
parte3[0] = { ...parte3[0], cinematic: [...LAPIDA, ...(parte3[0].cinematic ?? [])] };

const parte4 = tag(levels4, 'pueblo');
parte4[0] = { ...parte4[0], cinematic: [...BOCA, ...(parte4[0].cinematic ?? [])] };

export const campaign: Level[] = [...parte1, ...parte2, ...parte3, ...parte4];
