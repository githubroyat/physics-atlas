// Structure of the course (language-neutral). Titles and text live in content/<lang>/atlas.json.
// `ready: true` chapters have a module in js/chapters/<id>.js and content in content/<lang>/chapters/<id>.json.
//
// Two tracks:
//  - "s6": the European Schools S6 physics syllabus (2021-01-D-56): what she is studying now. Shown on the map.
//  - "s5": the S5 syllabus (2019-01-D-50), built first and saved. Not on her map; reachable in ?preview mode.

export const TRACKS = {
  s6: [
    {
      id: "waves",              // S6: Oscillations and Waves
      icon: "wave",
      chapters: [
        { id: "o1", ready: true },  // restoring force, Hooke's law, elastic energy
        { id: "o2", ready: true },  // SHM: x(t) = A cos(ωt), T = 2π√(m/k), graphs, damping
        { id: "o3", ready: true },  // pendulum
        { id: "o4", ready: true },               // energy in SHM, damping
        { id: "o5", ready: true },               // forced oscillations, resonance
        { id: "o6", ready: true },               // LC circuit: an electric oscillator
        { id: "o7", ready: true },  // what is a wave: T, f, λ, v = f·λ, transverse/longitudinal
        { id: "o8", ready: true },               // the sinusoidal wave equation y(x, t)
        { id: "o9", ready: true },               // Doppler effect
        { id: "o10", ready: true },              // superposition, Huygens, reflection, refraction, dispersion
      ],
    },
    {
      id: "motion",             // S6: Interactions
      icon: "arc",
      chapters: [
        { id: "i1", ready: true },               // position, velocity, acceleration functions
        { id: "i2", ready: true },  // projectile motion
        { id: "i3", ready: true },  // uniform circular motion
        { id: "i4", ready: true },               // orbits
      ],
    },
    {
      id: "fields",             // S6: Fields
      icon: "field",
      chapters: [
        { id: "f1", ready: true },  // electric charge, Coulomb's law
        { id: "f2", ready: true },               // electric field, capacitors
        { id: "f3", ready: true },               // magnetic fields, solenoid
        { id: "f4", ready: true },  // gravitational field, Newton's law of gravitation
      ],
    },
  ],
  s5: [
    { id: "energy", icon: "mountain", art: "art/e1-leap.webp",
      chapters: [{ id: "e1", ready: true }, { id: "e2" }, { id: "e3", art: "art/e3-case.webp" }, { id: "e4" }, { id: "e5" }] },
    { id: "heat", icon: "flake", art: "art/heat-ice.webp", chapters: [{ id: "h1" }, { id: "h2" }, { id: "h3" }, { id: "h4" }] },
    { id: "momentum", icon: "burst", chapters: [{ id: "m1" }, { id: "m2" }, { id: "m3" }] },
    { id: "nuclear", icon: "atom", chapters: [{ id: "n1" }, { id: "n2" }, { id: "n3" }, { id: "n4" }, { id: "n5" }, { id: "n6" }] },
  ],
};

export const ALL_REGIONS = [...TRACKS.s6, ...TRACKS.s5];
export const trackOf = (regionId) => (TRACKS.s6.some((r) => r.id === regionId) ? "s6" : "s5");

export function findChapter(id) {
  for (const r of ALL_REGIONS) {
    const i = r.chapters.findIndex((c) => c.id === id);
    if (i >= 0) return { region: r, chapter: r.chapters[i], index: i };
  }
  return null;
}
export const findRegion = (id) => ALL_REGIONS.find((r) => r.id === id) || null;
