"""Thin-wall detector: slice -> raster -> morphological opening (0.5 mm ball) -> keep only
what the opening deletes AND that is still >= 3 voxels thick after a further 1-voxel erosion.
That rejects the 1-voxel slivers every sharp convex edge produces and keeps genuine walls < 1 mm."""
import numpy as np
from scipy import ndimage as ndi
from PIL import Image, ImageDraw


def raster(m, pitch):
    (x0, y0, z0), (x1, y1, z1) = m.bounds
    W, H = int((x1 - x0) / pitch) + 3, int((y1 - y0) / pitch) + 3
    zs = np.arange(z0 + pitch / 2, z1, pitch)
    vol = np.zeros((len(zs), H, W), dtype=bool)
    for k, z in enumerate(zs):
        sec = m.section(plane_origin=[0, 0, z], plane_normal=[0, 0, 1])
        if sec is None:
            continue
        img = Image.new("1", (W, H), 0)
        dr = ImageDraw.Draw(img)
        planar, _ = sec.to_planar(to_2D=np.eye(4), check=False)
        for poly in planar.polygons_full:
            dr.polygon([((x - x0) / pitch + 1, (y - y0) / pitch + 1) for x, y in poly.exterior.coords], fill=1)
            for hole in poly.interiors:
                dr.polygon([((x - x0) / pitch + 1, (y - y0) / pitch + 1) for x, y in hole.coords], fill=0)
        vol[k] = np.asarray(img)
    return vol, (x0, y0, z0)


def thin_features(m, pitch=0.25, rad=0.5, min_vox=12):
    v, o = raster(m, pitch)
    k = int(round(rad / pitch))
    zz, yy, xx = np.mgrid[-k:k + 1, -k:k + 1, -k:k + 1]
    ball = (xx ** 2 + yy ** 2 + zz ** 2) <= k * k
    opened = ndi.binary_dilation(ndi.binary_erosion(v, ball), ball)
    lost = v & ~opened
    del opened
    core = ndi.binary_erosion(lost, ndi.generate_binary_structure(3, 1))
    lab, n = ndi.label(core)
    out = []
    for i in range(1, n + 1):
        idx = np.argwhere(lab == i)
        if len(idx) >= min_vox:
            zc, yc, xc = idx.mean(0)
            out.append((len(idx) * pitch ** 3, o[0] + (xc - 1) * pitch, o[1] + (yc - 1) * pitch, o[2] + zc * pitch))
    return sorted(out, reverse=True), v


if __name__ == "__main__":
    import sys, cadquery as cq, trimesh, build_case as B
    for name, wp in (("base", B.build_base()), ("lid", B.lid_for_print(B.build_lid()))):
        cq.exporters.export(wp, "/tmp/_t.stl", tolerance=0.005, angularTolerance=0.05)
        m = trimesh.load("/tmp/_t.stl")
        res, _ = thin_features(m)
        print(name, "thin features:", len(res))
        for r in res[:12]:
            print("   %.2f mm3 at x=%.1f y=%.1f z=%.1f" % r)


def thin_rays(m, n=60000, limit=1.0, seed=3):
    """Independent check: shoot a ray inward from random surface points; a hit on a face whose normal
    is (nearly) opposite means a parallel opposing wall. Report distances below `limit`."""
    import trimesh
    pts, fi = trimesh.sample.sample_surface(m, n, seed=seed)
    nrm = m.face_normals[fi]
    o = pts - nrm * 1e-3
    loc, ridx, tri = m.ray.intersects_location(o, -nrm, multiple_hits=False)
    d = np.linalg.norm(loc - o[ridx], axis=1)
    opposed = (m.face_normals[tri] * nrm[ridx]).sum(1) < -0.95
    sel = opposed & (d < limit) & (d > 0.02)
    return d[sel], pts[ridx][sel]
