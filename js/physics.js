// Single source of truth for every number shown in the app.
// Prose and interactives both read from here, so they can never disagree.

export const G = 9.81;            // m/s², gravitational field strength at Earth's surface
export const STOREY_M = 3.0;      // assumed height of one storey, metres

// Reference figures (fact-checked 2026-11-16; see docs/design-brief.md).
export const REF = {
  sprintTopSpeed: 12.3,   // m/s, about Usain Bolt's peak in the 2009 100 m world record (~44 km/h)
  goodStandingJump: 0.5,  // m, approximate centre-of-mass rise of a good standing vertical jump
};

/** Speed gained falling from rest through height h (or needed to rise h), no air resistance. */
export const speedForHeight = (h) => Math.sqrt(2 * G * h);
/** Height reached (or fallen) for a given speed. */
export const heightForSpeed = (v) => (v * v) / (2 * G);
/** Gravitational potential energy per kilogram for height h (J/kg). */
export const energyPerKg = (h) => G * h;
export const kineticEnergy = (m, v) => 0.5 * m * v * v;
export const potentialEnergy = (m, h) => m * G * h;
export const toKmh = (v) => v * 3.6;
export const fromKmh = (kmh) => kmh / 3.6;

/** Speed just before landing for a throw at speed u from height H: same for any direction. */
export const landingSpeed = (u, H) => Math.sqrt(u * u + 2 * G * H);

/** Vertical position and speed at time t for a launch straight up at v0 (no air). */
export function verticalFlight(v0, t) {
  return { y: v0 * t - 0.5 * G * t * t, v: v0 - G * t };
}

// ---------- Oscillations (S6) ----------
/** Hooke's law: size of the restoring force for stretch x (N). */
export const hookeForce = (k, x) => k * x;
/** Elastic potential energy stored in a spring stretched by x (J). */
export const elasticEnergy = (k, x) => 0.5 * k * x * x;
/** Spring constant needed to launch mass m to height h from a compression x (energy: ½kx² = mgh). */
export const springForLaunch = (m, h, x) => (2 * m * G * h) / (x * x);
export const seriesK = (k1, k2) => (k1 * k2) / (k1 + k2);
export const parallelK = (k1, k2) => k1 + k2;
/** Angular frequency, period and frequency of a mass on a spring (undamped). */
export const springOmega = (m, k) => Math.sqrt(k / m);
export const springPeriod = (m, k) => 2 * Math.PI * Math.sqrt(m / k);
export const kFromPeriod = (m, T) => (4 * Math.PI * Math.PI * m) / (T * T);
/**
 * Damped oscillator m·y'' + b·y' + k·y = 0, matching the formula booklet's y = A·sin(ωt): it starts in the
 * middle (y = 0) with a kick. Exact solution in every regime (γ = b/2m, ω0 = √(k/m)):
 *  - undamped / under-damped:  y = A·e^(−γt)·sin(ω_d·t),  ω_d = √(ω0² − γ²)        (kick v0 = A·ω_d)
 *  - critically damped:         y = A·ω0·t·e^(−γt)                                  (kick v0 = A·ω0)
 *  - over-damped:               y = (A·ω0 / 2β)·(e^(−(γ−β)t) − e^(−(γ+β)t)),  β = √(γ² − ω0²)  (v0 = A·ω0)
 */
export function dampingRegime(m, k, b) {
  const w0 = Math.sqrt(k / m), g = b / (2 * m);
  if (g < w0) return { kind: "under", g, w: Math.sqrt(w0 * w0 - g * g), w0 };
  if (g === w0) return { kind: "critical", g, w: 0, w0 };
  return { kind: "over", g, w: 0, w0, beta: Math.sqrt(g * g - w0 * w0) };
}
export function dampedY(t, A, m, k, b) {
  const r = dampingRegime(m, k, b);
  if (r.kind === "under") return A * Math.exp(-r.g * t) * Math.sin(r.w * t);
  if (r.kind === "critical") return A * r.w0 * t * Math.exp(-r.g * t);
  return ((A * r.w0) / (2 * r.beta)) * (Math.exp(-(r.g - r.beta) * t) - Math.exp(-(r.g + r.beta) * t));
}

// ---------- Pendulum (S6) ----------
export const pendulumPeriod = (L) => 2 * Math.PI * Math.sqrt(L / G);          // small swings
export const lengthForPeriod = (T) => (G * T * T) / (4 * Math.PI * Math.PI);
function agm(a, b) { for (let i = 0; i < 30; i++) { const a2 = (a + b) / 2, b2 = Math.sqrt(a * b); a = a2; b = b2; } return a; }
/** Exact period for any release angle θ0 (radians, < π): T = T0 / AGM(1, cos(θ0/2)). */
export const pendulumPeriodExact = (L, theta0) => pendulumPeriod(L) / agm(1, Math.cos(theta0 / 2));
/** One RK4 step of θ'' = −(g/L)·sin θ − c·θ' (c = damping per second, 0 for none). Returns [θ, ω]. */
export function pendulumStep(theta, omega, L, dt, c = 0) {
  const f = (th, om) => [om, -(G / L) * Math.sin(th) - c * om];
  const k1 = f(theta, omega), k2 = f(theta + dt / 2 * k1[0], omega + dt / 2 * k1[1]);
  const k3 = f(theta + dt / 2 * k2[0], omega + dt / 2 * k2[1]), k4 = f(theta + dt * k3[0], omega + dt * k3[1]);
  return [theta + dt / 6 * (k1[0] + 2 * k2[0] + 2 * k3[0] + k4[0]), omega + dt / 6 * (k1[1] + 2 * k2[1] + 2 * k3[1] + k4[1])];
}

// ---------- Waves (S6) — booklet: v = f·λ,  y(x,t) = A·sin(2π(t/T − x/λ)) ----------
export const waveSpeed = (f, lambda) => f * lambda;
export const wavelength = (v, f) => v / f;
export const waveY = (x, t, A, T, lambda) => A * Math.sin(2 * Math.PI * (t / T - x / lambda));

// ---------- Motion (S6 Interactions) — booklet: s(t) = s0 + v0·t + ½a·t², v(t) = v0 + a·t ----------
export const posAt = (s0, v0, a, t) => s0 + v0 * t + 0.5 * a * t * t;
export const velAt = (v0, a, t) => v0 + a * t;
/** Projectile launched from height h0 at speed v0 and angle (degrees), no air. */
export function projectileAt(v0, angleDeg, t, h0 = 0) {
  const a = (angleDeg * Math.PI) / 180, vx = v0 * Math.cos(a), vy0 = v0 * Math.sin(a);
  return { x: vx * t, y: h0 + vy0 * t - 0.5 * G * t * t, vx, vy: vy0 - G * t };
}
/** Time to land at height 0 (h0 ≥ 0); null if it never leaves the ground. */
export function flightTime(v0, angleDeg, h0 = 0) {
  const vy = v0 * Math.sin((angleDeg * Math.PI) / 180);
  const disc = vy * vy + 2 * G * h0;
  const t = (vy + Math.sqrt(disc)) / G;
  return t > 0 ? t : null;
}
export const rangeFlat = (v0, angleDeg) => (v0 * v0 * Math.sin((2 * angleDeg * Math.PI) / 180)) / G;
export const maxHeight = (v0, angleDeg, h0 = 0) => h0 + (v0 * Math.sin((angleDeg * Math.PI) / 180)) ** 2 / (2 * G);
// Circular motion — booklet: ω = Δθ/Δt = v/r,  a_cent = v²/r = ω²·r
export const angularSpeed = (v, r) => v / r;
export const centripetalAcc = (v, r) => (v * v) / r;
export const circlePeriod = (r, v) => (2 * Math.PI * r) / v;

// ---------- Fields (S6) — booklet constants ----------
export const GRAV_CONST = 6.6743e-11;           // N m² kg⁻² (booklet: 6.674 30 × 10⁻¹¹)
export const EARTH = { M: 5.97e24, R: 6.38e6 }; // kg, m (booklet values)
export const E_CHARGE = 1.602176634e-19;        // C
export const EPS0 = 8.8541878e-12;              // A s V⁻¹ m⁻¹
export const K_COULOMB = 1 / (4 * Math.PI * EPS0); // ≈ 8.99 × 10⁹ N m² C⁻²
export const M_ELECTRON = 9.1093837e-31, M_PROTON = 1.67262192e-27; // kg
export const coulombForce = (q1, q2, r) => (K_COULOMB * q1 * q2) / (r * r);
export const electricField = (Q, r) => (K_COULOMB * Q) / (r * r);
export const gravForce = (m1, m2, r) => (GRAV_CONST * m1 * m2) / (r * r);
export const gravField = (M, r) => (GRAV_CONST * M) / (r * r);
/** Weighing the Earth: M = g·R²/G. */
export const massFromSurfaceG = (g, R) => (g * R * R) / GRAV_CONST;

// ---- Shared by the batch-3 chapters (energy in SHM, resonance, LC, wave equation, Doppler, refraction,
// kinematics, orbits, capacitors, solenoids). Booklet notation in the comments.
export const SOUND_SPEED = 343;                  // m/s, sound in air at 20 °C (say so in the text)
export const LIGHT_SPEED = 2.99792458e8;         // m/s (booklet c = 2.997 924 58 × 10⁸)
export const MU0 = 4 * Math.PI * 1e-7;           // V s A⁻¹ m⁻¹ (booklet μ0 = 4π × 10⁻⁷ = 1.256 637 062 × 10⁻⁶)
// Energy in SHM (undamped): total W = ½·k·A², speed at displacement y from ½·k·A² = ½·k·y² + ½·m·v².
export const shmEnergy = (k, A) => 0.5 * k * A * A;
export const shmSpeedAt = (m, k, A, y) => Math.sqrt(Math.max(0, (k / m) * (A * A - y * y)));
export const springFrequency = (m, k) => 1 / springPeriod(m, k);
export const pendulumFrequency = (L) => 1 / pendulumPeriod(L);
// LC circuit: ω0 = 1/√(L·C), W = ½·L·I², W = ½·C·U².
export const lcOmega = (L, C) => 1 / Math.sqrt(L * C);
export const lcFrequency = (L, C) => lcOmega(L, C) / (2 * Math.PI);
export const inductorEnergy = (L, I) => 0.5 * L * I * I;
// Capacitor and uniform field: Q = C·U, W = ½·C·U², E = U/d.
export const capCharge = (C, U) => C * U;
export const capEnergy = (C, U) => 0.5 * C * U * U;
export const uniformField = (U, d) => U / d;
export const chargeAcc = (q, E, m) => (q * E) / m;  // acceleration of a charge in a uniform field (a = F/m, F = q·E)
// Solenoid: B = μ·n·I with n = N/l (turns per metre).
export const solenoidB = (N, l, I, mu = MU0) => mu * (N / l) * I;
// Wave: oscillation velocity of the particle at x (∂y/∂t of the booklet y(x, t)); its maximum is A·ω = 2π·A/T.
export const waveParticleV = (x, t, A, T, lambda) => ((2 * Math.PI * A) / T) * Math.cos(2 * Math.PI * (t / T - x / lambda));
// Doppler (booklet): f_o = f_s·(v ± u_o)/v (moving observer), f_o = f_s·v/(v ∓ u_s) (moving source).
// approaching = true gives the higher frequency. A source at or above the wave speed returns NaN.
export const dopplerObserver = (fs, uo, approaching, v = SOUND_SPEED) => (fs * (v + (approaching ? uo : -uo))) / v;
export const dopplerSource = (fs, us, approaching, v = SOUND_SPEED) => {
  const den = v + (approaching ? -us : us);
  return den > 0 ? (fs * v) / den : NaN;
};
// Refraction (booklet): sin α1 / sin α2 = n2/n1 = c1/c2. Angles in degrees. NaN = total internal reflection.
export const DEG = Math.PI / 180;
export const refractAngle = (n1, n2, a1Deg) => {
  const s = (n1 * Math.sin(a1Deg * DEG)) / n2;
  return Math.abs(s) > 1 ? NaN : Math.asin(s) / DEG;
};
export const criticalAngle = (n1, n2) => (n2 >= n1 ? NaN : Math.asin(n2 / n1) / DEG);
// Orbits: gravity is the centripetal force, G·M·m/r² = m·v²/r. r from the planet's centre.
export const orbitSpeed = (M, r) => Math.sqrt((GRAV_CONST * M) / r);
export const orbitPeriod = (M, r) => 2 * Math.PI * Math.sqrt((r * r * r) / (GRAV_CONST * M));
export const orbitRadiusForPeriod = (M, T) => Math.cbrt((GRAV_CONST * M * T * T) / (4 * Math.PI * Math.PI));

// Number formatting for prose and readouts.
const cache = new Map();
export function fmt(x, digits = 1, lang = "en") {
  const key = lang + digits;
  if (!cache.has(key)) {
    cache.set(key, new Intl.NumberFormat(lang, { maximumFractionDigits: digits, minimumFractionDigits: digits }));
  }
  return cache.get(key).format(x).replace("-", "−"); // a real minus sign, not a hyphen
}

const SUPER = { "-": "⁻", "0": "⁰", "1": "¹", "2": "²", "3": "³", "4": "⁴", "5": "⁵", "6": "⁶", "7": "⁷", "8": "⁸", "9": "⁹" };
/** Scientific notation with `sig` significant figures: sci(0.000234, 2) → "2.3 × 10⁻⁴". Real minus signs. */
export function sci(x, sig = 3, lang = "en") {
  if (!Number.isFinite(x)) return "—";
  if (x === 0) return fmt(0, Math.max(0, sig - 1), lang);
  const [m, e] = Math.abs(x).toExponential(Math.max(0, sig - 1)).split("e");
  const mant = fmt(Number(m), Math.max(0, sig - 1), lang);
  const exp = String(Number(e)).split("").map((c) => SUPER[c]).join("");
  return `${x < 0 ? "−" : ""}${mant} × 10${exp}`;
}
