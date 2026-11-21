// @ts-nocheck – aus dem Prototyp übernommen; Typen folgen bei der Überarbeitung.
// Standard-Kartenstile von OpenFreeMap (BASES)
// Aus dem Prototyp übernommen (prototyp/src/script.js).

export const BASES = {
  liberty: {
    name: 'Klassisch',
    dots: ['#f8f4f0', '#ffffff', '#fcd6a4', '#a0c8f0'],
    style: 'https://tiles.openfreemap.org/styles/liberty'
  },
  positron: {
    name: 'Hell',
    dots: ['#fafaf8', '#e2e2e2', '#d4dadc', '#9a9a9a'],
    style: 'https://tiles.openfreemap.org/styles/positron'
  },
  bright: {
    name: 'Bunt',
    dots: ['#f8f4f0', '#fc8a5a', '#fccd5a', '#7fbfe8'],
    style: 'https://tiles.openfreemap.org/styles/bright'
  },
  dark: {
    name: 'Dunkel',
    dots: ['#0e0e0e', '#2a2a2a', '#3d3d3d', '#6a6a6a'],
    style: 'https://tiles.openfreemap.org/styles/dark'
  },
  fiord: {
    name: 'Fjord',
    dots: ['#45516e', '#38435c', '#5a6a8a', '#a5b3cc'],
    style: 'https://tiles.openfreemap.org/styles/fiord'
  },
  satellit: {
    name: 'Satellit',
    dots: ['#3d4a2c', '#6b7a4a', '#a39a7a', '#2c3a4a'],
    style: 'https://tiles.openfreemap.org/styles/liberty',
    sat: true
  }
};
