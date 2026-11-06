"""Tiny orthographic z-buffer renderer (numpy + numba). Deterministic, no GPU/display needed."""
import numpy as np
from numba import njit
from PIL import Image


@njit(cache=True)
def _raster(tri, col, W, H):
    img = np.ones((H, W, 3), np.float32)
    zb = np.full((H, W), -1e30, np.float32)
    for i in range(tri.shape[0]):
        x0, y0, z0 = tri[i, 0, 0], tri[i, 0, 1], tri[i, 0, 2]
        x1, y1, z1 = tri[i, 1, 0], tri[i, 1, 1], tri[i, 1, 2]
        x2, y2, z2 = tri[i, 2, 0], tri[i, 2, 1], tri[i, 2, 2]
        den = (y1 - y2) * (x0 - x2) + (x2 - x1) * (y0 - y2)
        if abs(den) < 1e-12:
            continue
        xmin = max(int(np.floor(min(x0, min(x1, x2)))), 0)
        xmax = min(int(np.ceil(max(x0, max(x1, x2)))), W - 1)
        ymin = max(int(np.floor(min(y0, min(y1, y2)))), 0)
        ymax = min(int(np.ceil(max(y0, max(y1, y2)))), H - 1)
        for y in range(ymin, ymax + 1):
            for x in range(xmin, xmax + 1):
                px, py = x + 0.5, y + 0.5
                a = ((y1 - y2) * (px - x2) + (x2 - x1) * (py - y2)) / den
                b = ((y2 - y0) * (px - x2) + (x0 - x2) * (py - y2)) / den
                c = 1.0 - a - b
                if a < -1e-6 or b < -1e-6 or c < -1e-6:
                    continue
                z = a * z0 + b * z1 + c * z2
                if z > zb[y, x]:
                    zb[y, x] = z
                    img[y, x, 0] = col[i, 0]
                    img[y, x, 1] = col[i, 1]
                    img[y, x, 2] = col[i, 2]
    return img


def render(items, azim, elev, path, size=(1600, 900), ss=2, margin=0.06, light=(0.45, -0.55, 0.7)):
    """items: list of (trimesh, '#rrggbb'). Camera looks at the scene centre from (azim, elev) degrees."""
    import matplotlib.colors as mc
    az, el = np.radians(azim), np.radians(elev)
    v = np.array([np.cos(el) * np.cos(az), np.cos(el) * np.sin(az), np.sin(el)])      # towards camera
    up = np.array([0, 0, 1.0])
    r = np.cross(up, v); r /= np.linalg.norm(r)
    u = np.cross(v, r)
    Lw = np.array(light) / np.linalg.norm(light)
    allv = np.vstack([m.vertices for m, _ in items])
    ctr = (allv.max(0) + allv.min(0)) / 2
    P = (allv - ctr) @ np.stack([r, u, v], 1)
    W, H = size[0] * ss, size[1] * ss
    sc = min(W / (np.ptp(P[:, 0]) * (1 + 2 * margin)), H / (np.ptp(P[:, 1]) * (1 + 2 * margin)))
    tris, cols = [], []
    for m, hexc in items:
        t = m.triangles
        q = (t - ctr) @ np.stack([r, u, v], 1)
        s = np.empty_like(q)
        s[..., 0] = q[..., 0] * sc + W / 2
        s[..., 1] = H / 2 - q[..., 1] * sc
        s[..., 2] = q[..., 2]
        n = m.face_normals
        facing = n @ v
        diff = np.clip(n @ Lw, 0, 1)
        k = 0.30 + 0.50 * diff + 0.20 * np.clip(facing, 0, 1)
        base = np.array(mc.to_rgb(hexc), np.float32)
        c = np.clip(k[:, None] * base[None, :] * 1.1, 0, 1)
        keep = facing > -0.02          # cull back faces (all parts are closed solids)
        tris.append(s[keep]); cols.append(c[keep].astype(np.float32))
    tris = np.concatenate(tris).astype(np.float32); cols = np.concatenate(cols)
    img = _raster(tris, cols, W, H)
    im = Image.fromarray((img * 255).astype(np.uint8)).resize(size, Image.LANCZOS)
    im.save(path)
