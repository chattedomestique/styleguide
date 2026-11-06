#!/usr/bin/env python3
"""Shaded previews + cross-sections (matplotlib, no GPU needed)."""
import warnings; warnings.filterwarnings("ignore")
import numpy as np, trimesh, cadquery as cq
import matplotlib; matplotlib.use("Agg")
import matplotlib.pyplot as plt
from mpl_toolkits.mplot3d.art3d import Poly3DCollection
import build_case as B

def mesh(wp, tol=0.02):
    cq.exporters.export(wp, "/tmp/_r.stl", tolerance=tol, angularTolerance=0.1)
    return trimesh.load("/tmp/_r.stl")

base, lid = B.build_base(), B.build_lid()
mb, ml = mesh(base), mesh(lid)
dev_cols = {"TX-6": "#d9d9d9", "CM-15": "#9ec5e8", "TP-7": "#f2b85b"}
devs = []
for p in B.pockets:
    name, w, l, t = [d for d in B.DEVICES if d[0] == p["name"]][0]
    devs.append((name, mesh(B.rrect(p["xc"]-w/2, B.Y_IN0+B.CLR_XY, p["xc"]+w/2, B.Y_IN0+B.CLR_XY+l, p["zf"], p["zf"]+t, 2.0))))

import zrender
def draw(items, elev, azim, path, title, size=(15, 8.5), zoom=None):
    zrender.render(items, azim, elev, path, size=(1700, 950))

BASEC, LIDC = "#3b4a5a", "#6f8aa3"
draw([(mb, BASEC), (ml, LIDC)], 28, 118, "previews/01_closed.png", "Closed, front")
draw([(mb, BASEC), (ml, LIDC)], 25, -62, "previews/02_closed_rear.png", "Closed, rear: hinge barrels")
# open with devices
th = 112.0
ml_open = ml.copy(); ml_open.apply_transform(trimesh.transformations.rotation_matrix(np.radians(th), [1, 0, 0], [0, B.PY, B.PZ]))
draw([(mb, BASEC)] + [(m, dev_cols[n]) for n, m in devs] + [(ml_open, LIDC)], 42, 98, "previews/03_open_loaded.png",
     "Open (112 deg) with TX-6 / CM-15 / TP-7 seated (device models are simple slabs)", zoom=0.66)
# empty base from above
draw([(mb, BASEC)], 58, 100, "previews/04_base_empty.png", "Base: stepped floors bring all three device tops level; ridges, hinge block, push-out holes", zoom=0.6)
draw([(B and mesh(B.lid_for_print(lid)), LIDC)], 52, 100, "previews/05_lid_print_orientation.png",
     "Lid as printed (top face on the bed): fingers are free-standing walls; foam-dot recesses face up", zoom=0.6)

# ---- cross-sections
def section(m_list, origin, normal, axes, path, title, xlim, ylim, cols):
    fig, ax = plt.subplots(figsize=(13, 5.4), dpi=110)
    for m, col in zip(m_list, cols):
        s = m.section(plane_origin=origin, plane_normal=normal)
        if s is None: continue
        pl, T = s.to_planar(to_2D=trimesh.geometry.plane_transform(origin, normal), check=False)
        for poly in pl.polygons_full:
            x, y = poly.exterior.xy
            ax.fill(x, y, color=col, alpha=0.9, lw=0.6, ec="k")
            for h in poly.interiors:
                hx, hy = h.xy; ax.fill(hx, hy, color="white", ec="k", lw=0.6)
    ax.set_aspect("equal"); ax.set_title(title); ax.grid(alpha=.25)
    ax.set_xlim(*xlim); ax.set_ylim(*ylim); fig.tight_layout(); fig.savefig(path, facecolor="white"); plt.close(fig)

# YZ section through the middle latch (x = Xo/2) — plot in (y,z): plane_transform gives (u,v) basis; rebuild directly instead
def yz_section(x, path, title, ylim, zlim, with_dev=False):
    fig, ax = plt.subplots(figsize=(14, 4.6), dpi=110)
    sets = [(mb, BASEC), (ml, LIDC)]
    if with_dev: sets += [(m, dev_cols[n]) for n, m in devs]
    for m, col in sets:
        s = m.section(plane_origin=[x, 0, 0], plane_normal=[1, 0, 0])
        if s is None: continue
        for e in s.entities:
            pts = s.vertices[e.points]
            ax.plot(pts[:, 1], pts[:, 2], color=col, lw=1.6)
    ax.set_aspect("equal"); ax.set_title(title); ax.grid(alpha=.25)
    ax.set_xlim(*ylim); ax.set_ylim(*zlim); ax.set_xlabel("Y (rear -> front), mm"); ax.set_ylabel("Z, mm")
    fig.tight_layout(); fig.savefig(path, facecolor="white"); plt.close(fig)

xm = B.Xo / 2
yz_section(B.pockets[1]["xc"], "previews/06_section_cm15_column.png",
           f"Section x={B.pockets[1]['xc']:.0f} mm through the CM-15 pocket (device in blue, 1.8 mm headroom for foam)", (-4, B.Yo + 2), (-1, B.Z_TOP + 3), with_dev=True)
xg = B.LATCH_X[1] - B.F_LEN/2 + B.HOOK_A
yz_section(xg, "previews/07_section_latch.png", f"Section x={xg:.1f} mm through the middle latch (ridge in groove)",
           (B.Yo - 12, B.Yo + 2), (B.Z_SKB - 8, B.Z_TOP + 2))
yz_section((B.KNUCK[0][0]+B.KNUCK[0][1])/2, "previews/08_section_hinge_base_knuckle.png", "Section through a BASE knuckle", (-5, 12), (B.Z_RIM - 12, B.Z_TOP + 2))
yz_section((B.KNUCK[1][0]+B.KNUCK[1][1])/2, "previews/09_section_hinge_lid_knuckle.png", "Section through a LID knuckle", (-5, 12), (B.Z_RIM - 12, B.Z_TOP + 2))
print("ok")
