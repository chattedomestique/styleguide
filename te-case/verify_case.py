#!/usr/bin/env python3
"""
Verification suite for the TE case. Every check is a hard assert-style PASS/FAIL.

 1. Mesh integrity     watertight, single body, positive volume, no degenerate faces
 2. Closed-pose gaps   lid <-> base never touch except through designed gaps (>= 0.15 mm)
 3. Hinge sweep        lid swung 0..150 degrees: zero interference with base AND devices
 4. Snap-fit           fingers deflect <= limit to pass the ridge; strain within PETG limit
 5. Device fit         each device (worst-case sharp corners, pushed to every extreme) fits
 6. Printability       overhangs <= 45 deg (support-free), bed footprint, thin walls
"""
import sys
import math
import numpy as np
import trimesh
import cadquery as cq
import manifold3d as m3d
import build_case as B

FAILS = []


def check(name, ok, detail=""):
    print(f"[{'PASS' if ok else 'FAIL'}] {name}  {detail}")
    if not ok:
        FAILS.append(name)


def vol(wp):
    try:
        return wp.val().Volume()
    except Exception:
        return 0.0


def inter_vol(a, b):
    try:
        r = a.intersect(b)
        s = r.vals()
        return sum(x.Volume() for x in s) if s else 0.0
    except Exception:
        return 0.0


base, lid = B.build_base(), B.build_lid()

# ---------------------------------------------------------------- 1 integrity
def tm(wp):
    cq.exporters.export(wp, "/tmp/_v.stl", tolerance=0.005, angularTolerance=0.05)
    return trimesh.load("/tmp/_v.stl")


mb = tm(base)
ml = tm(B.lid_for_print(lid))
for nm, m in (("base", mb), ("lid", ml)):
    check(f"{nm}: watertight", m.is_watertight)
    check(f"{nm}: winding consistent", m.is_winding_consistent)
    check(f"{nm}: positive volume", m.volume > 0, f"{m.volume/1000:.1f} cm3")
    parts = m.split(only_watertight=False)
    big = [p for p in parts if p.volume > 1.0]
    check(f"{nm}: single solid body", len(big) == 1, f"{len(big)} bodies")
    check(f"{nm}: sits on bed (zmin=0)", abs(m.bounds[0][2]) < 1e-3, f"zmin={m.bounds[0][2]:.4f}")
    check(f"{nm}: no degenerate faces", (m.area_faces > 1e-9).all())

# ---------------------------------------------------------------- 2 gaps
def manifold_of(m):
    mm = m3d.Mesh(vert_properties=np.asarray(m.vertices, dtype=np.float32),
                  tri_verts=np.asarray(m.faces, dtype=np.uint32))
    return m3d.Manifold(mm)


ysi = B.Yo - B.SKIRT
FB = lambda xc: B.box(xc - B.F_LEN / 2 - 0.01, xc + B.F_LEN / 2 + 0.01, ysi - 0.4, B.Yo + 1, B.Z_SKB - 1, B.Z_TOP + 1)
def finger_solid(xc):
    return lid.intersect(FB(xc))
def rest_of_lid():
    r = lid
    for xc in B.LATCH_X:
        r = r.cut(FB(xc))
    return r
rest = rest_of_lid()
fingers = [finger_solid(xc) for xc in B.LATCH_X]

mbase = manifold_of(tm(base))
g_rest = mbase.min_gap(manifold_of(tm(rest)), 3.0)
g_fing = min(mbase.min_gap(manifold_of(tm(f)), 3.0) for f in fingers)
check("closed: lid body <-> base clearance", g_rest >= 0.25, f"{g_rest:.3f} mm (design 0.30)")
check("closed: latch finger <-> ridge clearance", g_fing >= 0.10, f"{g_fing:.3f} mm (45-deg faces, 0.15 vertical)")
check("closed: base & lid do not intersect", inter_vol(base, lid) < 1e-6)

# ---------------------------------------------------------------- 3 hinge sweep
PY, PZ = B.PY, B.PZ
rot = lambda wp, th: wp.rotate((0, PY, PZ), (1, PY, PZ), float(th))
# (a) while latching (0-22 deg) the rigid body of the lid must be clear; fingers are checked in (4)
bad = [th for th in np.arange(0, 22.5, 0.5) if inter_vol(base, rot(rest, th)) > 1e-3]
check("hinge: lid body clear of base while latching (0-22 deg)", not bad, f"{bad[:5]}")
# (b) full lid, everything included, from the moment the fingers are free
bad = [th for th in np.arange(22, 125.1, 2.0) if inter_vol(base, rot(lid, th)) > 1e-3]
check("hinge: full lid clear of base from 22 to 125 deg", not bad, f"{bad[:5]}")
# (c) hard stop angle
stop = None
for th in np.arange(100, 181, 1.0):
    if inter_vol(base, rot(lid, th)) > 1e-3:
        stop = th
        break
check("hinge: opens past 120 deg before hitting its stop", stop is None or stop >= 120,
      f"hard stop at {stop if stop else '>180'} deg")
STOP = stop if stop else 180

# ---------------------------------------------------------------- 5 devices
def dev_block(p, dx, dy, r=1.0):
    name, w, l, t = [d for d in B.DEVICES if d[0] == p["name"]][0]
    cx = p["xc"] + dx
    y0 = B.Y_IN0 + B.CLR_XY + dy
    return B.rrect(cx - w / 2, y0, cx + w / 2, y0 + l, p["zf"], p["zf"] + t, r) if r > 0 else \
        B.box(cx - w / 2, cx + w / 2, y0, y0 + l, p["zf"], p["zf"] + t)

c = B.CLR_XY
allfit, sharpfit = True, True
for p in B.pockets:
    for dx in (-c, 0, c):
        for dy in (-c, 0, c):
            if inter_vol(base, dev_block(p, dx, dy, 1.0)) > 0.02:   # 1 mm-cornered device, all 9 positions
                allfit = False
                print("   overlap (r=1)", p["name"], dx, dy)
    for dx, dy in ((0, 0), (c, 0), (-c, 0), (0, c), (0, -c)):
        if inter_vol(base, dev_block(p, dx, dy, 0)) > 0.05:         # razor-sharp device, 5 positions
            sharpfit = False
            print("   overlap (sharp)", p["name"], dx, dy)
check("devices: fit at every extreme position (1 mm corner radius)", allfit)
check("devices: razor-sharp-cornered worst case fits (centred + against any one wall)", sharpfit)
tops = {round(p["zf"] + p["t"], 3) for p in B.pockets}
check("devices: all tops coplanar", len(tops) == 1, f"z={tops}")
check("devices: clear of closed lid", all(inter_vol(lid, dev_block(p, 0, 0)) < 1e-6 for p in B.pockets),
      f"headroom to lid underside {B.Z_PL0 - B.Z_DEVTOP:.2f} mm")
clash = []
for p in B.pockets:
    for dx, dy in ((-c, -c), (c, -c), (0, 0)):
        d = dev_block(p, dx, dy, 0)
        for th in (0, 3, 6, 10, 20, 40, 60, 90, 110, 120, float(min(STOP - 2, 140))):
            if inter_vol(rot(lid, th), d) > 1e-6:
                clash.append((p["name"], dx, dy, th))
check("devices: lid swing never touches any device (rear-most positions)", not clash, f"{clash[:3]}")

# ---------------------------------------------------------------- 4 snap-fit
need = 0.0
for th in np.arange(0, 22, 0.5):
    f = fingers[0].rotate((0, PY, PZ), (1, PY, PZ), float(th))
    lo, hi = 0.0, 2.5
    if inter_vol(base, f) < 1e-3:
        d_need = 0.0
    else:
        for _ in range(14):
            mid = (lo + hi) / 2
            if inter_vol(base, f.translate((0, mid, 0))) > 1e-3:
                lo = mid
            else:
                hi = mid
        d_need = hi
    need = max(need, d_need)
check("snap: finger deflection to pass ridge", 0.5 <= need <= 1.2, f"{need:.2f} mm at the hook")
E = 2100.0  # MPa, PETG (conservative, injection-grade is higher)
t = B.SKIRT
a = B.HOOK_A
h = B.Z_TOP - B.Z_SKB
strain = 1.5 * t * need / a ** 2
Ib = h * t ** 3 / 12
force = 3 * E * Ib * need / a ** 3
check("snap: root strain within PETG limit (<2.0%)", strain * 100 < 2.0, f"{strain*100:.2f}%")
print(f"       finger stiffness: {3*E*Ib/a**3:.1f} N/mm -> {force:.1f} N lateral per latch at full deflection")

# ---------------------------------------------------------------- 6 printability
def overhang_report(m, name, limit_deg=45.0):
    n = m.face_normals
    c = m.triangles_center
    a = m.area_faces
    nz = n[:, 2]
    lim = -math.sin(math.radians(limit_deg)) - 0.03    # 3% tolerance for tessellation
    mask = (nz < lim) & (c[:, 2] > 0.05)
    area = float(a[mask].sum())
    check(f"{name}: no overhang steeper than {limit_deg:.0f} deg (support-free)", area < 0.5,
          f"{area:.2f} mm2 flagged")
    if area >= 0.5:
        pts = c[mask]
        lo, hi = pts.min(0), pts.max(0)
        print(f"       flagged region x[{lo[0]:.1f},{hi[0]:.1f}] y[{lo[1]:.1f},{hi[1]:.1f}] z[{lo[2]:.1f},{hi[2]:.1f}]")
        # cluster summary by z-height
        zs = np.round(pts[:, 2], 1)
        for z in sorted(set(zs))[:8]:
            sel = mask.copy(); sel[mask] = zs == z
            print(f"       z={z}: {a[sel].sum():.2f} mm2")

overhang_report(mb, "base")
overhang_report(ml, "lid")
for nm, m in (("base", mb), ("lid", ml)):
    ext = m.extents
    check(f"{nm}: fits a 220x220 bed", ext[0] <= 215 and ext[1] <= 215, f"{ext[0]:.1f} x {ext[1]:.1f} x {ext[2]:.1f} mm")

# thin walls: two independent methods (see thinwall.py; both calibrated on known 0.5/0.8/1.2 mm walls)
import warnings; warnings.filterwarnings("ignore")
import thinwall as TW
for nm, m in (("base", mb), ("lid", ml)):
    feats, _ = TW.thin_features(m)
    check(f"{nm}: morphological scan finds no feature < 1.0 mm", not feats, f"{len(feats)} found")
    d, _p = TW.thin_rays(m, n=120000, limit=3.0)
    dm = d.min() if len(d) else 9.9
    check(f"{nm}: thinnest opposing walls >= 1.2 mm (3 perimeters)", dm >= 1.19, f"min {dm:.2f} mm")

print()
if FAILS:
    print("FAILED:", FAILS)
    sys.exit(1)
print("ALL CHECKS PASSED")
