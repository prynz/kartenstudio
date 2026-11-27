// @ts-nocheck – aus dem Prototyp übernommen; Typen folgen bei der Überarbeitung.
// Künstlerische Farbthemen (PRESETS)
// Aus dem Prototyp übernommen (prototyp/src/script.js).

export const NAVY = '#262c3a';
export const PRESETS = {
  // Klarer Stadtplan nach dem Vorbild klassischer Kartenposter (z. B. Cartida): weißes Papier,
  // schwarze Straßen mit deutlicher Rangordnung, hellblaues Wasser, Grün nur angedeutet,
  // Gebäude zartgrau und erst beim Hineinzoomen bzw. bei kleinen Orten sichtbar (Detailstufe).
  stadtplan: {
    name: 'Stadtplan',
    desc: 'Schwarze Straßen, hellblaues Wasser, viel Weiß – der klare Klassiker.',
    chip: 'linear-gradient(90deg,#fff 0 60%,#a9c4e2 60% 80%,#111 80%)',
    cls: {
      // Gebäude zartgrau – bei der ganzen Stadt (grobe Daten) gibt es sie nicht, sie kommen beim Hineinzoomen
      haus: { s: '#9fa4ab', f: '#dde0e4', w: 0.6 },
      haupt: { s: '#111111', f: 'none', w: 4.4 },
      neben: { s: '#1d1d1f', f: 'none', w: 1.5 },
      weg: { s: '#5a5d63', f: 'none', w: 0.55 },
      wasser: { s: '#a9c4e2', f: '#a9c4e2', w: 1.4 },
      bahn: { s: '#a4a7ad', f: 'none', w: 0.6 },
      gruen: { s: 'none', f: '#f7f8f5', w: 0 }
    },
    bg: '#ffffff',
    frame: { color: '#111111', w: 0, r: 0, pad: 34 },
    bar: { color: '#111111', on: false },
    text: '#111111',
    ink: '#111111'
  },
  umriss: {
    name: 'Umriss (Siegritz)',
    chip: 'linear-gradient(90deg,#fff 0 70%,#262c3a 70%)',
    cls: {
      haus: {
        s: NAVY,
        f: 'none',
        w: 2.2
      },
      haupt: {
        s: NAVY,
        f: 'none',
        w: 6.4
      },
      neben: {
        s: '#a6a6a6',
        f: 'none',
        w: 2
      },
      weg: {
        s: '#a6a6a6',
        f: 'none',
        w: 2
      },
      wasser: {
        s: '#a6a6a6',
        f: 'none',
        w: 1.5
      },
      bahn: {
        s: '#a6a6a6',
        f: 'none',
        w: 2
      },
      gruen: {
        s: '#d9e2cf',
        f: '#eef2e8',
        w: 0,
        h: true
      }
    },
    bg: 'none',
    frame: {
      color: NAVY,
      w: 16,
      r: 48,
      pad: 14
    },
    bar: {
      color: NAVY,
      on: true
    },
    text: '#ffffff'
  },
  dunkel: {
    name: 'Nachtblau (New York)',
    chip: '#272c39',
    cls: {
      haus: {
        s: '#ffffff',
        f: 'none',
        w: 1.4
      },
      haupt: {
        s: '#ffffff',
        f: 'none',
        w: 5
      },
      neben: {
        s: '#ffffff',
        f: 'none',
        w: 2
      },
      weg: {
        s: '#ffffff',
        f: 'none',
        w: 1.1
      },
      wasser: {
        s: '#ffffff',
        f: 'none',
        w: 1.2
      },
      bahn: {
        s: '#ffffff',
        f: 'none',
        w: 1.5
      },
      gruen: {
        s: '#323949',
        f: '#2e3442',
        w: 0,
        h: true
      }
    },
    bg: '#272c39',
    frame: {
      color: '#ffffff',
      w: 4,
      r: 0,
      pad: 10
    },
    bar: {
      color: '#272c39',
      on: true
    },
    text: '#ffffff'
  },
  minimal: {
    name: 'Minimal schwarz',
    chip: 'linear-gradient(90deg,#fff 0 55%,#000 55%)',
    cls: {
      haus: {
        s: '#000000',
        f: '#000000',
        w: 0.6
      },
      haupt: {
        s: '#000000',
        f: 'none',
        w: 5
      },
      neben: {
        s: '#000000',
        f: 'none',
        w: 2
      },
      weg: {
        s: '#000000',
        f: 'none',
        w: 0.9
      },
      wasser: {
        s: '#000000',
        f: 'none',
        w: 1
      },
      bahn: {
        s: '#000000',
        f: 'none',
        w: 1.5
      },
      gruen: {
        s: '#000000',
        f: 'none',
        w: 0,
        h: true
      }
    },
    bg: 'none',
    frame: {
      color: '#000000',
      w: 6,
      r: 0,
      pad: 14
    },
    bar: {
      color: '#000000',
      on: true
    },
    text: '#ffffff'
  },
  strassen: {
    name: 'Nur Straßen',
    chip: 'repeating-linear-gradient(45deg,#fff 0 6px,#262c3a 6px 8px)',
    cls: {
      haus: {
        s: NAVY,
        f: 'none',
        w: 2,
        h: true
      },
      haupt: {
        s: NAVY,
        f: 'none',
        w: 6
      },
      neben: {
        s: NAVY,
        f: 'none',
        w: 2.6
      },
      weg: {
        s: NAVY,
        f: 'none',
        w: 1.2
      },
      wasser: {
        s: NAVY,
        f: 'none',
        w: 1.2
      },
      bahn: {
        s: NAVY,
        f: 'none',
        w: 1.5
      },
      gruen: {
        s: NAVY,
        f: 'none',
        w: 0,
        h: true
      }
    },
    bg: 'none',
    frame: {
      color: NAVY,
      w: 10,
      r: 0,
      pad: 14
    },
    bar: {
      color: NAVY,
      on: true
    },
    text: '#ffffff'
  }
};
export function TH(name, desc, c, w) {
  w = w || {};
  const L = (x, ww) => ({
    s: x,
    f: 'none',
    w: ww
  });
  return {
    name,
    desc,
    dots: [c.bg, c.haupt, c.haus[1] !== 'none' ? c.haus[1] : c.haus[0], c.neben],
    cls: {
      haus: {
        s: c.haus[0],
        f: c.haus[1],
        w: w.haus ?? 1.2
      },
      haupt: L(c.haupt, w.haupt ?? 4.6),
      neben: L(c.neben, w.neben ?? 2),
      weg: L(c.weg, w.weg ?? 1),
      wasser: {
        s: c.wasser[0],
        f: c.wasser[1],
        w: w.wasser ?? 1
      },
      bahn: L(c.bahn || c.neben, 1.4),
      gruen: {
        s: c.gruen ? c.gruen[0] : c.bg,
        f: c.gruen ? c.gruen[1] : 'none',
        w: 0,
        h: !c.gruen
      }
    },
    bg: c.bg,
    frame: {
      color: c.frame,
      w: w.frame ?? 8,
      r: w.r ?? 0,
      pad: 12
    },
    bar: {
      color: c.bar,
      on: true
    },
    text: c.text
  };
}
Object.assign(PRESETS.umriss, {
  desc: 'Klare Linien, leere Häuser, Rahmen und Balken in Navy – das Siegritz-Design.'
});
Object.assign(PRESETS.dunkel, {
  desc: 'Weiße Linien auf Nachtblau, wie die klassischen Stadtposter.'
});
Object.assign(PRESETS.minimal, {
  desc: 'Schwarz auf Weiß, gefüllte Häuser – maximal reduziert.'
});
Object.assign(PRESETS.strassen, {
  desc: 'Nur das Straßennetz, ohne Häuser.'
});
Object.assign(PRESETS, {
  cyber: TH('Cyber Noir', 'Neonpink und Cyan auf fast schwarzem Grund.', {
    bg: '#0b0b12',
    haus: ['#34344d', '#16161f'],
    haupt: '#ff2bd6',
    neben: '#00e5ff',
    weg: '#24606e',
    wasser: ['#13284a', '#13284a'],
    gruen: ['#111a1c', '#111a1c'],
    frame: '#ff2bd6',
    bar: '#0b0b12',
    text: '#ffffff'
  }, {
    haus: 0.9,
    frame: 6
  }),
  mittelmeer: TH('Mittelmeer-Sonne', 'Warmes Creme, Terrakotta und Meeresblau.', {
    bg: '#f6efe3',
    haus: ['#8b3a12', '#ead7bf'],
    haupt: '#5b3a29',
    neben: '#9a6446',
    weg: '#c9ad8f',
    wasser: ['#6a9ab5', '#8fb6cc'],
    gruen: ['#d6dab3', '#dfe2c2'],
    frame: '#5b3a29',
    bar: '#5b3a29',
    text: '#f6efe3'
  }, {
    r: 24
  }),
  solar: TH('Solar Flare', 'Glühendes Orange auf tiefem Schwarz.', {
    bg: '#0e0b0a',
    haus: ['#f26a1b', '#2a1d18'],
    haupt: '#ff9a3c',
    neben: '#d9601c',
    weg: '#6b3a1f',
    wasser: ['#1f1714', '#1f1714'],
    gruen: ['#18120f', '#18120f'],
    frame: '#f26a1b',
    bar: '#0e0b0a',
    text: '#ff9a3c'
  }, {
    haus: 0.9
  }),
  vulkan: TH('Vulkanglas', 'Ultradunkles Glas mit kühlen blaugrauen Reflexen.', {
    bg: '#0d0f12',
    haus: ['#8f99ad', '#1b1f26'],
    haupt: '#c5cbd6',
    neben: '#8f99ad',
    weg: '#4a5160',
    wasser: ['#232a35', '#232a35'],
    gruen: ['#151a1f', '#151a1f'],
    frame: '#8f99ad',
    bar: '#0d0f12',
    text: '#c5cbd6'
  }, {
    haus: 0.8,
    frame: 4
  }),
  blaupause: TH('Blaupause', 'Weiße Konstruktionslinien auf Blaupausen-Blau.', {
    bg: '#1d4e89',
    haus: ['#ffffff', 'none'],
    haupt: '#ffffff',
    neben: '#dbe7f6',
    weg: '#9dbbe0',
    wasser: ['#9cc3ef', '#2a5d99'],
    frame: '#ffffff',
    bar: '#1d4e89',
    text: '#ffffff'
  }, {
    haus: 1,
    frame: 4
  }),
  vintage: TH('Vintage-Papier', 'Alte Landkarte: Sepia, Papier und blasses Wasser.', {
    bg: '#efe4cc',
    haus: ['#4a3a2a', '#d9c7a3'],
    haupt: '#4a3a2a',
    neben: '#6e5a44',
    weg: '#a8916f',
    wasser: ['#7f9fa6', '#a9c3c8'],
    gruen: ['#c9cba0', '#d3d4ad'],
    frame: '#4a3a2a',
    bar: '#4a3a2a',
    text: '#efe4cc'
  }, {
    frame: 10
  }),
  wald: TH('Waldgrün', 'Tannengrün, Moos und Nebel.', {
    bg: '#eef0e6',
    haus: ['#2f4a36', '#c7d1bb'],
    haupt: '#1f3a2b',
    neben: '#4f6b55',
    weg: '#8ea18f',
    wasser: ['#7fa8ae', '#9fc4c9'],
    gruen: ['#b7cba0', '#b7cba0'],
    frame: '#1f3a2b',
    bar: '#1f3a2b',
    text: '#eef0e6'
  }, {
    r: 20
  }),
  tusche: TH('Tusche & Rot', 'Japanische Tuschezeichnung mit rotem Akzent.', {
    bg: '#f4f1ea',
    haus: ['#1a1a1a', 'none'],
    haupt: '#c0392b',
    neben: '#1a1a1a',
    weg: '#9a958c',
    wasser: ['#b9b4aa', '#dcd8cf'],
    frame: '#1a1a1a',
    bar: '#1a1a1a',
    text: '#f4f1ea'
  }, {
    haus: 1
  }),
  pastell: TH('Pastell', 'Sanftes Rosa, Flieder und Himmelblau.', {
    bg: '#fdf6f0',
    haus: ['#e8a0b4', '#fbe1e8'],
    haupt: '#7fb7d9',
    neben: '#b8a6d9',
    weg: '#d8cde8',
    wasser: ['#a9d3e8', '#cfe8f3'],
    gruen: ['#dcefd6', '#dcefd6'],
    frame: '#b8a6d9',
    bar: '#b8a6d9',
    text: '#ffffff'
  }, {
    r: 36,
    frame: 8
  })
});
['stadtplan', 'umriss', 'dunkel', 'minimal', 'strassen'].forEach(k => {
  const p = PRESETS[k];
  p.dots = [p.bg === 'none' ? '#ffffff' : p.bg, p.cls.haupt.s, p.cls.haus.f !== 'none' ? p.cls.haus.f : p.cls.haus.s, p.frame.color];
});
/* Standard-Kartenstile (gerenderte Karte) */

/* ---------- Pop-Art-Themen (neu in der Web-App, experimentell) ---------- */
// Straßen in Hintergrundfarbe → sie schneiden helle Wege durch den Symbolteppich (siehe themen/pop.js)
const POP = (name, desc, bg, pal, ink, water) => ({
  name,
  desc,
  dots: [bg, ...pal.slice(0, 3)],
  pop: { pal },
  cls: {
    // Häuser werden nicht als Grundriss gezeichnet – die Symbole stehen für die Bebauung
    haus: { s: bg, f: pal[0], w: 1.2, h: true },
    // Straßen: freie Wege in Hintergrundfarbe, Hauptstraßen breiter
    haupt: { s: bg, f: 'none', w: 15 },
    neben: { s: bg, f: 'none', w: 9 },
    weg: { s: bg, f: 'none', w: 5, h: true },
    wasser: { s: water, f: water, w: 12 },
    bahn: { s: ink, f: 'none', w: 2.5 },
    gruen: { s: bg, f: 'none', w: 0, h: true }
  },
  bg,
  frame: { color: ink, w: 8, r: 0, pad: 12 },
  bar: { color: ink, on: true },
  text: bg
});
Object.assign(PRESETS, {
  popart: POP('Pop-Art', 'Illustrierter Stadtplan: Symbole in Rot, Gelb und Blau folgen den Straßen, der Ort zeichnet sich als bunte Fläche ab.', '#fbf8f1', ['#e23b2e', '#f4b400', '#1d5fa8'], '#1d5fa8', '#1d5fa8'),
  konfetti: POP('Konfetti-Nacht', 'Pastellfarbene Symbole auf Nachtblau – verspielt und edel.', '#262c3a', ['#f6a6b2', '#ffd58a', '#9fd8cb', '#b9a7f0', '#ffffff'], '#ffd58a', '#7fb7d9')
});

/* ---------- Einfarbige Themen (passend zum Typografie-Design) ----------
   Eine Grundfarbe, alles andere sind hellere Töne davon – wie die bekannten Typo-Stadtposter. */
const MONO = (name, desc, bg, light, mid, deep) =>
  TH(name, desc, {
    bg,
    haus: [mid, mid],
    haupt: light,
    neben: light,
    weg: mid,
    wasser: [light, light],
    gruen: [deep, deep],
    frame: '#ffffff',
    bar: deep,
    text: '#ffffff'
  }, { haus: 0.6, haupt: 4.2, neben: 1.6, weg: 0.9, frame: 26 });
Object.assign(PRESETS, {
  lavendel: MONO('Lavendel', 'Ein Ton Flieder, Straßen hell – modern und weich.', '#9b8fd8', '#ebe7fb', '#b4abe3', '#8a7dcf'),
  koralle: MONO('Koralle', 'Kräftiges Korallenrot mit hellen Straßen.', '#e2645a', '#ffe1dc', '#ea8880', '#d4554b'),
  petrol: MONO('Petrol', 'Tiefes Petrol, Wasser und Straßen hell.', '#2f6f8a', '#d6ebf2', '#4f8aa2', '#2a6278'),
  salbei: MONO('Salbei', 'Ruhiges Salbeigrün, natürlich und hell.', '#7f9c84', '#e6efe6', '#98b19c', '#728f77'),
  // Silhouette: Land kräftig, Wasser weiß – Inseln, Küsten und Seen zeichnen sich als Form ab
  insel: TH('Insel-Silhouette', 'Land in kräftigem Blau, Wasser weiß – für Inseln, Küsten und Seen (Ausschnitt groß wählen).', {
    bg: '#2b5d8c',
    haus: ['#46739f', '#46739f'],
    haupt: '#e3edf6',
    neben: '#9dbbd8',
    weg: '#6d93b9',
    wasser: ['#ffffff', '#ffffff'],
    frame: '#ffffff',
    bar: '#2b5d8c',
    text: '#ffffff'
  }, { haus: 0.4, haupt: 3.2, neben: 1.3, weg: 0.7, wasser: 2.2, frame: 26 }),
  senf: MONO('Senf', 'Warmes Senfgelb mit hellen Linien.', '#d2a23b', '#fbefd2', '#ddb662', '#c4942e')
});

/* ---------- Farbthemen nach Vorbildern aus Grafikdesign & Kartenkunst ----------
   `ink` = Schriftfarbe auf dem Papier (wenn sie anders sein soll als im Balken),
   `bg2` = zweite Hintergrundfarbe für einen Verlauf. */
const mit = (t, extra, fn) => {
  Object.assign(t, extra);
  if (fn) fn(t);
  return t;
};
Object.assign(PRESETS, {
  japan: mit(TH('Japan-Rot', 'Hellgrau mit weißen Straßen, Akzent in Rot – passt zum Design „Fokus“.', {
    bg: '#e8eaed', haus: ['#dcdfe3', 'none'], haupt: '#ffffff', neben: '#ffffff', weg: '#ffffff',
    wasser: ['#d3d8df', '#d3d8df'], frame: '#cf2e2e', bar: '#cf2e2e', text: '#ffffff'
  }, { haus: 0.6, haupt: 7, neben: 3.6, weg: 1.8, wasser: 1 }), { ink: '#1b1f2a' }, (t) => (t.cls.haus.h = true)),
  koenigsblau: TH('Königsblau', 'Weißes Papier, zarte blaue Straßen, Wasser und Parks in kräftigem Blau.', {
    bg: '#ffffff', haus: ['#dde0f6', 'none'], haupt: '#bfc6ef', neben: '#d0d5f3', weg: '#dfe2f7',
    wasser: ['#2440d8', '#2440d8'], gruen: ['#5a6fe3', '#5a6fe3'], frame: '#2440d8', bar: '#2440d8', text: '#ffffff'
  }, { haus: 0.5, haupt: 3.4, neben: 1.8, weg: 1, wasser: 8 }),
  neon: mit(TH('Neon-Violett', 'Violette Gassen, pinke Hauptstraßen und türkises Wasser auf Schwarzblau.', {
    bg: '#0b0e1a', haus: ['#2a2058', 'none'], haupt: '#ff6fb8', neben: '#8b55ff', weg: '#5b38b8',
    wasser: ['#2fd6e6', '#123a4a'], frame: '#2fd6e6', bar: '#2fd6e6', text: '#0b0e1a'
  }, { haus: 0.6, haupt: 4.6, neben: 1.7, weg: 0.9, wasser: 2.4 }), { ink: '#3ee8f2' }),
  goldnacht: mit(TH('Gold & Nacht', 'Goldene Straßen auf tiefem Nachtblau – edel und warm.', {
    bg: '#0a1828', haus: ['#1c2c42', 'none'], haupt: '#d8a93b', neben: '#8d7a45', weg: '#4d4a3c',
    wasser: ['#163049', '#0e2236'], frame: '#d8a93b', bar: '#d8a93b', text: '#0a1828'
  }, { haus: 0.6, haupt: 4.8, neben: 1.5, weg: 0.8 }), { ink: '#d8a93b' }),
  schwarzweiss: TH('Schwarz & Weiß', 'Feine weiße Linien auf Schwarz – wie ein Siebdruck.', {
    bg: '#161616', haus: ['#ffffff', 'none'], haupt: '#ffffff', neben: '#e8e8e8', weg: '#9a9a9a',
    wasser: ['#ffffff', '#ffffff'], frame: '#ffffff', bar: '#161616', text: '#ffffff'
  }, { haus: 0.7, haupt: 3.4, neben: 1.4, weg: 0.8 }),
  puls: mit(TH('Am Puls', 'Rote Straßen auf einem Verlauf von Blau nach Magenta – laut und lebendig.', {
    bg: '#2a1c95', haus: ['#4b2c9e', 'none'], haupt: '#ff2d55', neben: '#ee2a52', weg: '#b8285e',
    wasser: ['#5a3fd0', '#3a26a8'], frame: '#ffffff', bar: '#ff2d55', text: '#ffffff'
  }, { haus: 0.5, haupt: 4.2, neben: 1.6, weg: 0.9 }), { bg2: '#a01c5a' }),
  lichter: mit(TH('Stadtlichter', 'Leuchtende Goldstraßen auf Schwarz – wie eine Stadt bei Nacht (mit Effekt „Leuchten“).', {
    bg: '#050505', haus: ['#6a5220', '#3d2f12'], haupt: '#f3c46a', neben: '#8a7044', weg: '#3d3424',
    wasser: ['#1e1e1e', '#151515'], frame: '#f3c46a', bar: '#f3c46a', text: '#050505'
  }, { haus: 0.5, haupt: 4.4, neben: 1.4, weg: 0.7 }), { ink: '#f3c46a' }),
  dossier: mit(TH('Dossier', 'Dunkelgraue Karte, Häuser in Signalrot – passt zum Design „Dossier“.', {
    bg: '#141416', haus: ['#d43a3a', '#8f1f22'], haupt: '#5c5c63', neben: '#404046', weg: '#2e2e33',
    wasser: ['#2a2a30', '#1d1d22'], frame: '#d43a3a', bar: '#d43a3a', text: '#ffffff'
  }, { haus: 0.6, haupt: 4, neben: 1.8, weg: 1 }), { ink: '#e0403f' }),
  einsatz: mit(TH('Einsatzkarte', 'Dunkelgraue Karte mit grauen Straßen – passt zum Design „Einsatzkarte“.', {
    bg: '#1c1c1f', haus: ['#303036', '#29292e'], haupt: '#6a6a72', neben: '#4a4a51', weg: '#37373d',
    wasser: ['#2c2c32', '#232328'], gruen: ['#222226', '#222226'], frame: '#d8322f', bar: '#d8322f', text: '#ffffff'
  }, { haus: 0.5, haupt: 6, neben: 2.6, weg: 1.2 }), { ink: '#d8322f' }),
  // Für „Fokus“: Straßen in Papierfarbe zerschneiden den Farbfleck in Blöcke
  washi: mit(TH('Washi', 'Warmes Papier mit hellen Straßen, Akzent in Zinnoberrot – ruhig und japanisch.', {
    bg: '#eee6d8', haus: ['#e4dccd', 'none'], haupt: '#fbf8f2', neben: '#fbf8f2', weg: '#f6f1e8',
    wasser: ['#dcd3c2', '#dcd3c2'], frame: '#b8322a', bar: '#b8322a', text: '#ffffff'
  }, { haus: 0.6, haupt: 7, neben: 3.6, weg: 1.8 }), { ink: '#2a2622' }, (t) => (t.cls.haus.h = true)),
  tinte: mit(TH('Tinte & Gold', 'Tiefes Tintenblau, Straßen kaum heller – der Fokus leuchtet golden.', {
    bg: '#1f2430', haus: ['#272d3b', 'none'], haupt: '#2e3546', neben: '#2b3242', weg: '#262c3a',
    wasser: ['#232a38', '#232a38'], frame: '#d8a93b', bar: '#d8a93b', text: '#1f2430'
  }, { haus: 0.6, haupt: 7, neben: 3.6, weg: 1.8 }), { ink: '#ece4d2' }, (t) => (t.cls.haus.h = true)),
  // Für „Typografie“: einfarbig, Straßen in hellen Tönen
  schiefer: MONO('Schiefer', 'Kühles Schiefergrau mit hellen Linien – zeitlos für große Buchstaben.', '#4a5568', '#e3e7ee', '#66728a', '#3f4859'),
  flamingo: MONO('Flamingo', 'Kräftiges Rosa mit hellen Straßen – fröhlich und modern.', '#e98aa0', '#fde6ec', '#f0a5b6', '#df7891'),
  tanne: MONO('Tanne', 'Dunkles Tannengrün mit hellen Linien.', '#2f5a46', '#dcebe2', '#4a7560', '#284e3c'),
  // Themenwelt „Sunset City“: Spielkarten- und Miami-Look (eigene Farben, keine Marken)
  spielkarte: mit(TH('Spielkarte', 'Grünes Land, tiefblaues Wasser mit türkisem Küstensaum, graue Stadt – wie eine Videospiel-Karte.', {
    bg: '#a6d65b', haus: ['#80868f', '#c9cdd3'], haupt: '#3f444c', neben: '#5d636c', weg: '#8d9299',
    wasser: ['#63d3e8', '#1f72c4'], gruen: ['#86c24a', '#86c24a'], bahn: '#4a4f57', frame: '#0b2f5b', bar: '#0b2f5b', text: '#ffffff'
  }, { haus: 0.6, haupt: 4.6, neben: 2.2, weg: 1.2, wasser: 9 }), { ink: '#0b2f5b' }),
  sunset: mit(TH('Sunset', 'Rosa-violetter Sonnenuntergang, helle Straßen – Miami-Abendstimmung.', {
    bg: '#ff7eb3', haus: ['#ffb3d1', 'none'], haupt: '#fff1f7', neben: '#ffd6ea', weg: '#f7b6d6',
    wasser: ['#86dbff', '#4b3fa8'], frame: '#2b1055', bar: '#2b1055', text: '#ffffff'
  }, { haus: 0.6, haupt: 4.4, neben: 1.8, weg: 1 }), { bg2: '#6a2c91', ink: '#ffffff' }),
  nachtfahrt: mit(TH('Nachtfahrt', 'Pinke Hauptstraßen und violette Gassen auf tiefem Nachtviolett, türkises Wasser.', {
    bg: '#140a2b', haus: ['#3b1d63', 'none'], haupt: '#ff5fa2', neben: '#8b5cf6', weg: '#5b3aa0',
    wasser: ['#22d3ee', '#0d2a4a'], frame: '#ff5fa2', bar: '#ff5fa2', text: '#140a2b'
  }, { haus: 0.6, haupt: 4.2, neben: 1.6, weg: 0.9, wasser: 2.2 }), { bg2: '#3a0d4f', ink: '#ff8fc0' }),
  pastellabend: mit(TH('Pastell-Abend', 'Lavendel geht in Pfirsich über, Straßen in dunklem Violett – sanft wie ein Plattencover.', {
    bg: '#cdb8ea', haus: ['#b49bdc', 'none'], haupt: '#4b2d7a', neben: '#6e4fa3', weg: '#9a82c8',
    wasser: ['#8fb6f0', '#a9c6f5'], frame: '#4b2d7a', bar: '#4b2d7a', text: '#ffffff'
  }, { haus: 0.6, haupt: 3.6, neben: 1.5, weg: 0.8 }), { bg2: '#f7b9a6', ink: '#3d2266' }),
  // Nur die 10 Farben des Album-Covers (siehe themen/sunset.js → ALBUM)
  albumabend: mit(TH('Album-Abend', 'Exakt die Farben des Abend-Plattencovers: Taubenblau, Lavendel, Rosa, Pfirsich, Nachtviolett.', {
    bg: '#6e74a0', haus: ['#8d769d', 'none'], haupt: '#fcf1f9', neben: '#ebc5b9', weg: '#db93a3',
    wasser: ['#9b8bb2', '#5d4872'], gruen: ['#b17b9a', '#b17b9a'], bahn: '#2c1e3d', frame: '#2c1e3d', bar: '#2c1e3d', text: '#fcf1f9'
  }, { haus: 0.6, haupt: 4.2, neben: 1.7, weg: 1, wasser: 1.6 }), { bg2: '#e4a9a4', bgV: true, ink: '#fcf1f9' }),
  wimmel: mit(POP('Wimmelbild', 'Illustrierter Stadtplan in Koralle, Türkis und Schieferblau.', '#ece2cc', ['#e8553e', '#e8553e', '#d9472f'], '#3d5a73', '#5cb4b6'), {}, (t) => {
    t.cls.haupt.s = '#3d5a73';
    t.cls.neben.s = '#3d5a73';
  })
});
