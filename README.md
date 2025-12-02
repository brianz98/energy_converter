# Quantum / Chemistry Units Converter

Minimal static site that converts between common units used in quantum mechanics and physical chemistry: Hartree (Eh), eV, Joules, wavenumbers (cm⁻¹), Kelvin, and common per-mole units (J/mol, kJ/mol, kcal/mol).

Files:
- `index.html` — main page
- `style.css` — styling
- `script.js` — conversion logic

Constants used:
- Hartree = 4.3597447222071e-18 J
- eV = 1.602176634e-19 J
- Planck's constant `h = 6.62607015e-34` J·s, `c = 299792458` m/s
- Boltzmann `k_B = 1.380649e-23` J/K
- Avogadro `N_A = 6.02214076e23`

This update limits interconversions to the requested units: Hartree, eV, `kcal/mol`, `kJ/mol`, `cm^-1`, Kelvin (equivalent temperature), and MHz (frequency). Constants are chosen to match CODATA values as collected by SciPy's `scipy.constants`.

Usage (development):
Open `index.html` in a browser, or run a simple HTTP server in the project directory:

```bash
cd /Users/brianz98/projects/energy_converter
python3 -m http.server 8000
# then open http://localhost:8000 in your browser
```

Notes:
- The site operates with energies per particle internally; per-mole inputs/outputs are converted using Avogadro's number.
- Precision can be adjusted in the UI.
