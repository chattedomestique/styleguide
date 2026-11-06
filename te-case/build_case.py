#!/usr/bin/env python3
"""
Parametric, print-ready case for Teenage Engineering TX-6 + CM-15 + TP-7.

Run:  python3 build_case.py            (writes STL + STEP into ./output)

Coordinates (assembled / closed pose)
    X  across the case (devices sit side by side along X)
    Y  front-to-back, Y=0 is the HINGE (rear) face, Y=Yo is the LATCH (front) face
    Z  up, Z=0 is the underside of the base

Everything dimensional is a named parameter below. Device sizes are the
manufacturer's published figures (teenage.engineering product pages):
    TX-6   90 x 62 x 23 mm      (102 mm long with the removable jack adapter fitted)
    CM-15  90 x 65.5 x 19 mm
    TP-7   96 x 68 x 16 mm
The longest edge runs front-to-back, the middle edge runs across, the shortest
edge is the thickness. (Which axis is which is not labelled by the maker, but the
result is the same for any reading: the smallest number is the thickness.)
"""
import math
import os
import cadquery as cq

# --------------------------------------------------------------------------
# DEVICES  (width across X, length along Y, thickness along Z), millimetres
# --------------------------------------------------------------------------
DEVICES = [
    ("TX-6",  62.0, 90.0, 23.0),
    ("CM-15", 65.5, 90.0, 19.0),
    ("TP-7",  68.0, 96.0, 16.0),
]

# --------------------------------------------------------------------------
# FIT
# --------------------------------------------------------------------------
CLR_XY      = 0.5    # gap per side between a device and its pocket wall
POCKET_R    = 0.5    # vertical corner radius of every pocket (devices have >=1 mm corners)
DIVIDER     = 2.0    # wall between neighbouring pockets
WALL        = 4.4    # outer wall of the lower body = SKIRT + GAP + NECK
SKIRT       = 2.2    # lid skirt thickness
GAP         = 0.3    # running clearance lid <-> base (all sliding faces)
NECK        = WALL - SKIRT - GAP          # 1.9: thickness of the base's upper wall
CORNER_R    = 5.0    # outer plan-view corner radius
FLOOR       = 2.0    # base floor under the thickest device
HEADROOM    = 1.5    # device top -> base rim (room for foam dots / knobs)
PLATE       = 2.0    # lid top plate
SKIRT_LEN   = 12.0   # lid skirt overlap height
DIV_DROP    = 2.0    # dividers stop this far below the rim (so foam never bottoms on them)
CHAMFER     = 0.6    # first-layer (elephant-foot) chamfer on bed-side edges
PUSH_HOLE_D = 18.0   # thumb push-out hole under each device

# --------------------------------------------------------------------------
# DERIVED HEIGHTS
# --------------------------------------------------------------------------
T_MAX   = max(d[3] for d in DEVICES)
Z_DEVTOP = FLOOR + T_MAX                  # all device tops are coplanar here (25.0)
Z_RIM   = Z_DEVTOP + HEADROOM             # top of the base walls (26.5)
Z_DIV   = Z_RIM - DIV_DROP                # top of the dividers
Z_PL0   = Z_RIM + GAP                     # underside of the lid plate
Z_TOP   = Z_PL0 + PLATE                   # overall height of the closed case
Z_SKB   = Z_TOP - SKIRT_LEN               # skirt free edge
Z_SH    = Z_SKB - GAP                     # shoulder where the base steps in to the neck

# --------------------------------------------------------------------------
# PLAN LAYOUT
# --------------------------------------------------------------------------
Y_IN0 = WALL                                              # rear inner face
POCKET_L_MAX = max(d[2] for d in DEVICES) + 2 * CLR_XY    # 97.0
Yo = WALL + POCKET_L_MAX + WALL                           # overall depth
pockets = []                                              # x0, width, length, floor z, device
_x = WALL
for name, w, l, t in DEVICES:
    pw, pl = w + 2 * CLR_XY, l + 2 * CLR_XY
    pockets.append(dict(name=name, x0=_x, w=pw, l=pl, zf=FLOOR + (T_MAX - t), t=t,
                        xc=_x + pw / 2, yc=Y_IN0 + pl / 2))
    _x += pw + DIVIDER
Xo = _x - DIVIDER + WALL                                  # overall width

# --------------------------------------------------------------------------
# HINGE  (filament-pin barrel hinge along the rear edge)
# --------------------------------------------------------------------------
RK      = 3.2        # knuckle outer radius
PY      = 0.8        # hinge axis Y
PZ      = Z_TOP - RK # hinge axis Z  (barrel top is tangent to the lid top face)
HOLE_D  = 2.2        # pin bore for 1.75 mm filament
KGAP    = 0.5        # axial gap between knuckles
HX0, HX1 = 12.0, Xo - 12.0
NK      = 7          # knuckles: B L B L B L B   (B = base, L = lid)
LK      = (HX1 - HX0 - (NK - 1) * KGAP) / NK
KNUCK   = [(HX0 + i * (LK + KGAP), HX0 + i * (LK + KGAP) + LK) for i in range(NK)]
CUT_R   = 3.9        # clearance disc swept by the knuckle + 45-degree gusset
BLIND   = 1.2        # closed wall at the pin's far end
LID_REAR_SKIRT_END = WALL + 0.4   # side skirts stop here (they cannot wrap the hinge)
PIN_LEN = (HX1 - BLIND) - (HX0 + 0.8)   # pin runs from just inside the countersink to the blind end

# --------------------------------------------------------------------------
# LATCH  (three snap fingers cut into the lid's front skirt)
# --------------------------------------------------------------------------
LATCH_X   = [Xo * 0.2, Xo * 0.5, Xo * 0.8]
F_LEN     = 24.0     # finger length (root -> tip)
SLIT      = 1.2      # slit that frees the finger's tip
PGROOVE   = 0.8      # groove through the lid plate that frees the finger's inner edge
HOOK_A    = 16.0     # root -> hook centre
GROOVE_L  = 11.0
RIDGE_L   = 8.4
RIDGE_H   = 1.0      # ridge height off the neck face
Z_A       = Z_SKB + 2.05            # ridge underside start (45 deg face)
GROOVE_D  = RIDGE_H - GAP + 0.15    # groove depth in the skirt (0.85)
THUMB_W   = 30.0     # thumb notch under the middle latch


# ==========================================================================
# helpers
# ==========================================================================
def rrect(x0, y0, x1, y1, z0, z1, r):
    w = cq.Workplane("XY").workplane(offset=z0).center((x0 + x1) / 2, (y0 + y1) / 2)
    s = w.rect(x1 - x0, y1 - y0).extrude(z1 - z0)
    return s.edges("|Z").fillet(r) if r > 0 else s


def box(x0, x1, y0, y1, z0, z1):
    return (cq.Workplane("XY").box(x1 - x0, y1 - y0, z1 - z0, centered=False)
            .translate((x0, y0, z0)))


def prof(pts, x0, x1):
    """Polygon in the (Y,Z) plane extruded along +X from x0 to x1."""
    return cq.Workplane("YZ", origin=(x0, 0, 0)).polyline(pts).close().extrude(x1 - x0)


def cyl_x(y, z, r, x0, x1):
    return cq.Workplane("YZ", origin=(x0, 0, 0)).center(y, z).circle(r).extrude(x1 - x0)


def cyl_z(x, y, r, z0, z1):
    return cq.Workplane("XY").workplane(offset=z0).center(x, y).circle(r).extrude(z1 - z0)


S2 = math.sqrt(2.0)


def knuckle(lid):
    """Barrel + 45-degree gusset so nothing overhangs more than 45 degrees."""
    ty = PY - RK / S2
    if not lid:   # base: gusset under the barrel, prints upright
        tz = PZ - RK / S2
        z0 = tz + ty                      # 45-degree line down to the rear face y = 0
        pts = [(ty, tz), (0.0, z0), (0.0, PZ), (PY, PZ)]
    else:         # lid: gusset on the top-face side (that side prints on the bed)
        tz = PZ + RK / S2
        ye = ty + (Z_TOP - tz)
        pts = [(ty, tz), (ye, Z_TOP), (PY, Z_TOP), (PY, PZ)]
    return pts


def teardrop(lid):
    r = HOLE_D / 2
    s = 1 if not lid else -1
    return [(PY - r / S2, PZ + s * r / S2), (PY, PZ + s * r * S2), (PY + r / S2, PZ + s * r / S2)]


def knuckle_solid(i, lid):
    x0, x1 = KNUCK[i]
    a = cyl_x(PY, PZ, RK, x0, x1)
    b = prof(knuckle(lid), x0, x1)
    return a.union(b)


def pin_bore(lid):
    """Round bore + 45-degree peak (teardrop) so the hole bridges without support."""
    xa, xb = HX0 - 1.0, KNUCK[-1][1] - BLIND
    return cyl_x(PY, PZ, HOLE_D / 2, xa, xb).union(prof(teardrop(lid), xa, xb))


# ==========================================================================
# BASE
# ==========================================================================
def build_base():
    lower = rrect(0, 0, Xo, Yo, 0, Z_SH, CORNER_R)
    lower = lower.faces("<Z").edges().chamfer(CHAMFER)
    inset = SKIRT + GAP
    neck = rrect(inset, inset, Xo - inset, Yo - inset, Z_SH - 0.5, Z_RIM, CORNER_R - inset)
    full = rrect(0, 0, Xo, Yo, 0, Z_RIM, CORNER_R)
    block = full.intersect(box(-1, Xo + 1, -1, WALL, 0, Z_RIM))     # rear hinge block
    base = lower.union(neck).union(block)

    # trench: dividers & dead zones stop below the rim
    base = base.cut(box(WALL, Xo - WALL, Y_IN0, Y_IN0 + POCKET_L_MAX, Z_DIV, Z_RIM + 1))

    # device pockets (stepped floors) + thumb push-out holes
    for p in pockets:
        pk = rrect(p["x0"], Y_IN0, p["x0"] + p["w"], Y_IN0 + p["l"], p["zf"], Z_RIM + 1, POCKET_R)
        base = base.cut(pk)
        base = base.cut(cyl_z(p["xc"], p["yc"], PUSH_HOLE_D / 2, -1, p["zf"] + 0.5))

    # thumb notch under the middle latch (finger access to the lid's lower edge)
    xm = LATCH_X[1]
    base = base.cut(box(xm - THUMB_W / 2, xm + THUMB_W / 2, Yo - SKIRT - GAP, Yo + 1, Z_SH - 6.0, Z_SH + 0.01))

    # latch ridges on the neck's front face
    yn = Yo - SKIRT - GAP
    for xc in LATCH_X:
        xg = xc - F_LEN / 2 + HOOK_A
        ridge = [(yn - 0.3, Z_A - 0.3), (yn + RIDGE_H, Z_A + RIDGE_H), (yn + RIDGE_H, Z_A + RIDGE_H + 0.6),
                 (yn, Z_A + 4.1), (yn - 0.3, Z_A + 4.1)]
        base = base.union(prof(ridge, xg - RIDGE_L / 2, xg + RIDGE_L / 2))

    # hinge: clear the lid's knuckles, then add the base's own
    for i in range(1, NK, 2):
        x0, x1 = KNUCK[i]
        base = base.cut(cyl_x(PY, PZ, CUT_R, x0 - KGAP, x1 + KGAP))
    for i in range(0, NK, 2):
        base = base.union(knuckle_solid(i, lid=False))
    base = base.cut(pin_bore(False))
    # countersink at the open end so the pin can be melted into a flush rivet head.
    # 45-degree cone, 4.0 mm across at the face -> leaves a 1.2 mm ring on the 6.4 mm barrel.
    csk_r = 2.0
    depth = csk_r - HOLE_D / 2
    cone = cq.Solid.makeCone(HOLE_D / 2, csk_r, depth,
                             pnt=cq.Vector(HX0 + depth, PY, PZ), dir=cq.Vector(-1, 0, 0))
    base = base.cut(cq.Workplane("XY").add(cone))
    return base


# ==========================================================================
# LID  (modelled in the closed pose; exported upside-down for printing)
# ==========================================================================
def build_lid():
    plate = rrect(0, 0, Xo, Yo, Z_PL0, Z_TOP, CORNER_R)
    outer = rrect(0, 0, Xo, Yo, Z_SKB, Z_PL0 + 0.01, CORNER_R)
    inner = rrect(SKIRT, SKIRT, Xo - SKIRT, Yo - SKIRT, Z_SKB - 1, Z_PL0 + 0.01, CORNER_R - SKIRT)
    lid = plate.union(outer.cut(inner))
    lid = lid.faces(">Z").edges().chamfer(CHAMFER)

    # rear: plate stops at the hinge axis; side skirts stop short of the hinge block
    lid = lid.cut(box(-1, Xo + 1, -20, PY, Z_SKB - 1, Z_TOP + 1))
    lid = lid.cut(box(-1, Xo + 1, PY, LID_REAR_SKIRT_END, Z_SKB - 1, Z_PL0))

    # hinge: clear the base's knuckles, then add the lid's own
    for i in range(0, NK, 2):
        x0, x1 = KNUCK[i]
        lid = lid.cut(cyl_x(PY, PZ, CUT_R, x0 - KGAP, x1 + KGAP))
    for i in range(1, NK, 2):
        lid = lid.union(knuckle_solid(i, lid=True))
    lid = lid.cut(pin_bore(True))

    # latch fingers
    ysi = Yo - SKIRT
    for xc in LATCH_X:
        xr, xt = xc - F_LEN / 2, xc + F_LEN / 2
        xg = xr + HOOK_A
        # free the finger: a groove through the plate behind it + a slit at its tip.
        # The finger is then a full-height wall standing on the print bed (no bridging).
        lid = lid.cut(box(xr, xt + SLIT, ysi - PGROOVE, ysi, Z_PL0 - 0.1, Z_TOP + 1))
        lid = lid.cut(box(xt, xt + SLIT, ysi - PGROOVE, Yo + 1, Z_SKB - 1, Z_TOP + 1))
        # groove that captures the base ridge; its lower edge is the 45-degree hook face
        zl = Z_A + 0.15
        zt = Z_A + 4.6
        gd = GROOVE_D
        groove = [(ysi - 0.1, zl - 0.1), (ysi + gd, zl + gd), (ysi + gd, zt), (ysi - 0.1, zt)]
        lid = lid.cut(prof(groove, xg - GROOVE_L / 2, xg + GROOVE_L / 2))
        # lead-in chamfer on the finger's free edge
        lead = [(ysi - 0.1, Z_SKB - 0.1), (ysi + 0.7, Z_SKB - 0.1), (ysi - 0.1, Z_SKB + 0.7)]
        lid = lid.cut(prof(lead, xr, xt))

    # six locator recesses (12.4 mm, 0.6 deep) for adhesive foam dots over the devices
    for p in pockets:
        for y in (Y_IN0 + 11.0, Y_IN0 + p["l"] - 11.0):
            lid = lid.cut(cyl_z(p["xc"], y, 6.2, Z_PL0 - 0.1, Z_PL0 + 0.6))
    return lid


def lid_for_print(lid):
    """Rotate 180 degrees about Y so the top face lies on the bed (no supports needed)."""
    return lid.rotate((0, 0, 0), (0, 1, 0), 180).translate((Xo, 0, Z_TOP))


# ==========================================================================
def export(shape, path):
    cq.exporters.export(shape, path, tolerance=0.01, angularTolerance=0.05)


if __name__ == "__main__":
    out = os.path.join(os.path.dirname(os.path.abspath(__file__)), "output")
    os.makedirs(out, exist_ok=True)
    base, lid = build_base(), build_lid()
    lidp = lid_for_print(lid)
    export(base, f"{out}/case_base.stl")
    export(lidp, f"{out}/case_lid.stl")
    cq.exporters.export(base, f"{out}/case_base.step")
    cq.exporters.export(lid, f"{out}/case_lid_assembled_pose.step")
    export(base.union(lid), f"{out}/case_assembly_closed.stl")
    print(f"Outer size  {Xo:.1f} x {Yo:.1f} x {Z_TOP:.1f} mm")
    print(f"Base volume {base.val().Volume()/1000:.1f} cm3, lid volume {lid.val().Volume()/1000:.1f} cm3")
    print("Pockets:", [(p['name'], round(p['w'], 1), round(p['l'], 1), round(p['zf'], 1)) for p in pockets])
    print(f"Hinge: {NK} knuckles of {LK:.2f} mm; cut the 1.75 mm filament pin to {PIN_LEN:.0f} mm")
