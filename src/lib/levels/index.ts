import type { Component } from 'svelte';
import Consola from './oficina/Consola.svelte';
import Titulo from './oficina/Titulo.svelte';
import Seleccion from './oficina/Seleccion.svelte';
import Cupula from './observatorio/Cupula.svelte';
import Telescopio from './observatorio/Telescopio.svelte';
import Fugaces from './observatorio/Fugaces.svelte';
import Sintoniza from './radio/Sintoniza.svelte';
import Morse from './radio/Morse.svelte';
import Potencia from './radio/Potencia.svelte';
import Frasco from './laboratorio/Frasco.svelte';
import Microscopio from './laboratorio/Microscopio.svelte';
import Termostato from './laboratorio/Termostato.svelte';
import Catalogo from './archivo/Catalogo.svelte';
import Pasillos from './archivo/Pasillos.svelte';
import Mapa from './archivo/Mapa.svelte';
import Nombre from './maquina/Nombre.svelte';
import Papel from './maquina/Papel.svelte';
import Salida from './maquina/Salida.svelte';

export type LevelProps = { onsolve: () => void };

/** Componentes de cada nivel, en el mismo orden que `rooms.ts` */
export const levels: Record<string, Component<LevelProps>[]> = {
  oficina: [Consola, Titulo, Seleccion],
  observatorio: [Cupula, Telescopio, Fugaces],
  radio: [Sintoniza, Morse, Potencia],
  laboratorio: [Frasco, Microscopio, Termostato],
  archivo: [Catalogo, Pasillos, Mapa],
  maquina: [Nombre, Papel, Salida],
};
