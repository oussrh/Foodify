"""The plate as a known shape: a round plate is a surface of revolution, so it is fitted, not
reconstructed, and only the food on it is meshed from the points.

A plain white plate gives stereo nothing to match: reconstructed, its floor is holes and bumps.
Fitted, it is one smooth profile (height against distance from the centre) turned round the
axis, measured where the plate shows between the food and carried flat where the food covers it
(a plate is a bowl: inward from the rim's crest it only goes down or stays level). The food is the
points above that profile; its mesh is cut along the plate's surface, so the two meet exactly.

An oval or square plate does not fit (its rim's radius changes round the circle): `fit` returns
None and the pipeline meshes the whole dish from the points, as before.
"""

from dataclasses import dataclass

import numpy as np
import open3d as o3d
from scipy.ndimage import binary_closing, binary_dilation, binary_fill_holes
from scipy.spatial import cKDTree

BIN_M = 0.002          # profile resolution: 2 mm rings
SECTORS = 36
THICKNESS_M = 0.004    # the plate's wall, under its top surface
MAX_RIM_SPREAD = 0.05  # rim radius may vary 5% round the circle; more is not a round plate


@dataclass
class Plate:
    radius: float
    r: np.ndarray      # ring radii, 0 to radius
    h: np.ndarray      # the top surface's height at each
    tolerance: float   # how far above the surface a point must be to be food

    def height(self, r: np.ndarray) -> np.ndarray:
        return np.interp(r, self.r, self.h)


def _envelope(r: np.ndarray, theta: np.ndarray, y: np.ndarray, rings: int) -> np.ndarray:
    """Lowest surface per (ring, sector), as its 20th percentile height; NaN where nothing was seen."""
    ri = (r / BIN_M).astype(int)
    si = ((theta + np.pi) / (2 * np.pi) * SECTORS).astype(int) % SECTORS
    inside = ri < rings
    key = ri[inside] * SECTORS + si[inside]
    order = np.lexsort((y[inside], key))
    keys, start, count = np.unique(key[order], return_index=True, return_counts=True)
    enough = count >= 3
    low = y[inside][order][start + (0.2 * (count - 1)).astype(int)]
    grid = np.full(rings * SECTORS, np.nan)
    grid[keys[enough]] = low[enough]
    return grid.reshape(rings, SECTORS)


def _profile(grid: np.ndarray, rise: float) -> np.ndarray | None:
    """One height per ring, from the rings seen all round (half the sectors or more), as their
    lowest tenth: a white plate gives few points and the food covers much of the rest. Outside
    the rim's crest (in the outer fifth) as measured; inward from it never rising by more than
    `rise`, so food is held flat over; unseen rings bridged between their neighbours."""
    seen = np.isfinite(grid).mean(axis=1) >= 0.5
    rings = len(grid)
    outer = np.arange(rings) >= int(0.8 * rings)
    if not (seen & outer).any() or seen.sum() < 0.2 * rings:
        return None  # the rim was not seen well enough to trust a fit
    ring = np.full(rings, np.nan)
    ring[seen] = np.nanpercentile(grid[seen], 10, axis=1)
    crest = int(np.nanargmax(np.where(outer & seen, ring, -np.inf)))
    h = np.interp(np.arange(rings), np.flatnonzero(seen), ring[seen])
    for i in range(crest - 1, -1, -1):  # inward from the crest: food covers, the bowl only descends
        if not seen[i] or h[i] > h[i + 1] + rise:
            h[i] = h[i + 1]
    padded = np.pad(h, 2, mode="edge")
    return np.median(np.lib.stride_tricks.sliding_window_view(padded, 5), axis=1)


MAX_TILT_DEG = 8.0


def _rim_plane(points: np.ndarray, radius: float) -> np.ndarray | None:
    """The plane through the rim's crest (a, b, c of y = a x + b z + c): each sector's highest
    lower-envelope cell in the outer fifth, fitted from the median height outward so sectors where
    food stands over the rim are dropped; None when too few sectors show the rim."""
    r, theta, y = np.hypot(points[:, 0], points[:, 2]), np.arctan2(points[:, 2], points[:, 0]), points[:, 1]
    start = int(0.8 * radius / BIN_M)
    outer = _envelope(r, theta, y, int(np.ceil(1.05 * radius / BIN_M)))[start:]
    seen = np.isfinite(outer)
    shown = seen.any(axis=0)
    if shown.mean() < 0.6:
        return None
    filled = np.where(seen, outer, -np.inf)
    rr = (filled.argmax(axis=0) + start + 0.5) * BIN_M
    angle = (np.arange(SECTORS) + 0.5) / SECTORS * 2 * np.pi - np.pi
    a = np.column_stack([rr * np.cos(angle), rr * np.sin(angle), np.ones(SECTORS)])[shown]
    h = filled.max(axis=0)[shown]
    coef = np.array([0.0, 0.0, float(np.median(h))])
    for _ in range(3):
        good = np.abs(a @ coef - h) < 0.004
        if good.sum() < 8:
            return None
        coef = np.linalg.lstsq(a[good], h[good], rcond=None)[0]
    return coef


def _edge_circle(points: np.ndarray, radius: float) -> tuple[np.ndarray, float] | None:
    """(centre (x, z), radius) of the plate's outer edge in a levelled cloud: per sector, the
    outermost points at the rim's height, fitted with a circle (strays dropped, refitted). The
    centre the alignment gave is the middle of all the points, which a few left on the turntable
    pull aside: from there a round plate looks oval and measures the wrong size."""
    r, theta, y = np.hypot(points[:, 0], points[:, 2]), np.arctan2(points[:, 2], points[:, 0]), points[:, 1]
    # The rim's height from the lowest surface seen in each direction (food standing near the rim
    # is above it), each sector's crest in the outer fifth, their median.
    start = int(0.8 * radius / BIN_M)
    outer = _envelope(r, theta, y, int(np.ceil(1.1 * radius / BIN_M)))[start:]
    crests = np.nanmax(np.where(np.isfinite(outer), outer, np.nan), axis=0) if np.isfinite(outer).any() else None
    if crests is None or np.isfinite(crests).mean() < 0.6:
        return None
    rim = float(np.nanmedian(crests))
    band = (np.abs(y - rim) < 0.004) & (r > 0.7 * radius) & (r < 1.2 * radius)
    sector = ((theta + np.pi) / (2 * np.pi) * SECTORS).astype(int) % SECTORS
    edge = []
    for s in range(SECTORS):
        pick = band & (sector == s)
        if pick.sum() >= 10:
            far = points[pick][np.argsort(r[pick])[-max(3, pick.sum() // 50):]]
            edge.append(far[:, [0, 2]].mean(axis=0))
    if len(edge) < 0.6 * SECTORS:
        return None
    xz = np.array(edge)
    keep = np.ones(len(xz), bool)
    for _ in range(3):  # Kasa circle fit, then without the edge points far off it
        a = np.column_stack([2 * xz[keep], np.ones(keep.sum())])
        sol = np.linalg.lstsq(a, (xz[keep] ** 2).sum(axis=1), rcond=None)[0]
        centre, rad = sol[:2], float(np.sqrt(sol[2] + sol[:2] @ sol[:2]))
        keep = np.abs(np.linalg.norm(xz - centre, axis=1) - rad) < 0.04 * rad
        if keep.sum() < 8:
            return None
    return centre, rad


def settle(cloud: o3d.geometry.PointCloud, radius: float) -> tuple[np.ndarray, np.ndarray, float] | None:
    """(rotation, centre, factor): local' = factor * (rotation @ local - centre) levels a round
    plate on its rim, centres it on its own edge, scales that edge to `radius` (the plate's size as
    given) and stands its foot on y = 0. None when the plate is not round or its rim was not seen.
    The axis the cameras gave (a turntable's turn, a table's plane) can be a few degrees off the
    plate's, and the centre and size a few millimetres; the rim is the plate's own."""
    pts = np.asarray(cloud.points)
    coef = _rim_plane(pts, radius)
    if coef is None:
        return None
    normal = np.array([-coef[0], 1.0, -coef[1]])
    normal /= np.linalg.norm(normal)
    if np.degrees(np.arccos(normal[1])) > MAX_TILT_DEG:
        return None
    from .mesh import _rotation_to_y

    rot = _rotation_to_y(normal)
    level = pts @ rot.T
    circle = _edge_circle(level, radius)
    if circle is None:
        return None
    (cx, cz), edge = circle
    factor = radius / edge
    if not 0.85 < factor < 1.15:
        return None
    fitted = fit((level - [cx, 0.0, cz]) * factor, radius)
    if fitted is None:
        return None
    lift = THICKNESS_M - float(fitted.h.min())
    return rot, np.array([cx, -lift / factor, cz]), factor


def _without_table(points: np.ndarray, radius: float) -> np.ndarray:
    """The points, less those at the height of what lies outside the plate's edge (a table or a
    turntable seen round it, and through gaps under it): a plain white plate gives stereo almost
    nothing, and its floor was read off the turntable beneath (the avocado: a 25 mm bowl)."""
    r = np.hypot(points[:, 0], points[:, 2])
    outside = (r > 1.03 * radius) & (r < 1.3 * radius)
    if outside.sum() < 200:
        return points
    table = float(np.median(points[outside, 1]))
    return points[(np.abs(points[:, 1] - table) > 0.0025) | (r < 0.3 * radius)]


def fit(points: np.ndarray, radius: float) -> Plate | None:
    """The plate under the dish (aligned frame: +Y up, centred, metres), or None when it is not round."""
    points = _without_table(points, radius)
    r, theta, y = np.hypot(points[:, 0], points[:, 2]), np.arctan2(points[:, 2], points[:, 0]), points[:, 1]
    sector = ((theta + np.pi) / (2 * np.pi) * SECTORS).astype(int) % SECTORS
    near = r < 1.1 * radius
    rims = [np.percentile(r[near & (sector == s)], 99.5) for s in range(SECTORS) if (near & (sector == s)).sum() > 20]
    if len(rims) < 0.8 * SECTORS or np.std(rims) / np.mean(rims) > MAX_RIM_SPREAD:
        return None
    rings = int(np.ceil(radius / BIN_M))
    h = _profile(_envelope(r, theta, y, rings), rise=0.0015)
    if h is None:
        return None
    rr = (np.arange(rings) + 0.5) * BIN_M
    plate = Plate(radius, np.concatenate([[0.0], rr, [radius]]), np.concatenate([[h[0]], h, [h[-1]]]), 0.0)
    off = y - plate.height(r)
    on = near & (np.abs(off) < 0.006)
    noise = 1.4826 * float(np.median(np.abs(off[on] - np.median(off[on])))) if on.sum() > 100 else 0.001
    plate.tolerance = float(np.clip(4 * noise, 0.003, 0.006))
    return plate


def food(points: np.ndarray, plate: Plate) -> np.ndarray:
    """Mask of the points that are food: above the plate's surface, over the plate."""
    r = np.hypot(points[:, 0], points[:, 2])
    return (points[:, 1] > plate.height(r) + plate.tolerance) & (r < 0.98 * plate.radius)


CELL_M = 0.004


def footprint(points: np.ndarray, radius: float):
    """Where the food stands, seen from above: the 4 mm cells holding three food points or more,
    small gaps closed, holes filled, grown by a cell. A function of (x, z) -> bool. A convex outline
    would let a few stray points out by the rim stretch it over the whole plate."""
    n = int(np.ceil(2 * radius / CELL_M)) + 1
    index = lambda xz: np.clip(((xz + radius) / CELL_M).astype(int), 0, n - 1)
    counts = np.zeros((n, n), int)
    ij = index(points[:, [0, 2]])
    np.add.at(counts, (ij[:, 0], ij[:, 1]), 1)
    grid = binary_dilation(binary_fill_holes(binary_closing(counts >= 3, iterations=2)))

    def inside(xz: np.ndarray) -> np.ndarray:
        k = index(xz)
        return grid[k[:, 0], k[:, 1]]

    return inside


def _flip_to(mesh: o3d.geometry.TriangleMesh, expected: np.ndarray) -> None:
    """Wind every triangle so its normal points along `expected` (one direction per triangle)."""
    v, t = np.asarray(mesh.vertices), np.asarray(mesh.triangles).copy()
    normals = np.cross(v[t[:, 1]] - v[t[:, 0]], v[t[:, 2]] - v[t[:, 0]])
    wrong = (normals * expected).sum(axis=1) < 0
    t[wrong] = t[wrong][:, ::-1]
    mesh.triangles = o3d.utility.Vector3iVector(t)


def solid(plate: Plate, rings: int = 24, segments: int = 96) -> o3d.geometry.TriangleMesh:
    """The plate as a closed solid: its fitted top, an edge THICKNESS_M deep, the underside the top
    lowered by that much and flat where it meets the table (the foot, which base.py brands)."""
    rho = np.linspace(0, plate.radius, rings + 1)[1:]
    top = plate.height(rho)
    # The foot: flat on the table out to 60% of the radius, then the underside rises to follow the rim.
    rise = np.clip((rho / plate.radius - 0.6) / 0.4, 0.0, 1.0)
    under = rise * np.maximum(top - THICKNESS_M, 0.0)
    top = np.maximum(top, under + 0.002)
    angle = np.linspace(0, 2 * np.pi, segments, endpoint=False)
    ring = lambda radius, height: np.column_stack([radius * np.cos(angle), np.full(segments, height), radius * np.sin(angle)])
    v = [np.array([[0.0, plate.height(np.zeros(1))[0], 0.0]])] + [ring(p, h) for p, h in zip(rho, top)]
    v += [np.array([[0.0, 0.0, 0.0]])]
    v += [ring(p, h) for p, h in zip(rho, under)]
    vertices = np.concatenate(v)
    first = lambda k, side: 1 + k * segments + side * (1 + rings * segments)  # first vertex of ring k
    tris, expect = [], []
    for side, up in ((0, 1.0), (1, -1.0)):
        centre = side * (1 + rings * segments)
        for s in range(segments):
            n = (s + 1) % segments
            tris.append([centre, first(0, side) + s, first(0, side) + n])
            expect.append([0, up, 0])
            for k in range(rings - 1):
                a, b = first(k, side), first(k + 1, side)
                tris += [[a + s, b + s, b + n], [a + s, b + n, a + n]]
                expect += [[0, up, 0]] * 2
    for s in range(segments):  # the edge between the two rims
        n, a, b = (s + 1) % segments, first(rings - 1, 0), first(rings - 1, 1)
        tris += [[a + s, b + s, b + n], [a + s, b + n, a + n]]
        expect += [[np.cos(angle[s]), 0, np.sin(angle[s])]] * 2
    mesh = o3d.geometry.TriangleMesh(o3d.utility.Vector3dVector(vertices), o3d.utility.Vector3iVector(np.array(tris)))
    _flip_to(mesh, np.array(expect, float))
    mesh.compute_vertex_normals()
    return mesh


def food_surface(cloud: o3d.geometry.PointCloud, plate: Plate, extra: tuple[np.ndarray, np.ndarray] | None = None,
                 depth: int = 10) -> o3d.geometry.TriangleMesh | None:
    """The food's surface, cut where it meets the plate; None for an empty plate.

    Poisson closes whatever it is given. The plate's surface goes in as points around the food, not
    under it: under the food the surface closes downward, through the plate, and the cut along the
    plate then leaves the food's sides reaching all the way down (the bottom of food is rarely
    seen; given a floor there, Poisson stretched the food's lowest points into stalks above it).
    `extra` are points with normals where nothing was measured (hull.py), meshed with the food.
    Nothing is kept outside the food's footprint seen from above (`footprint`): Poisson joins the
    food's lowest points to the plate around it with thin sheets that lie over the plate.
    """
    pts = np.asarray(cloud.points)
    mask = food(pts, plate)
    if mask.sum() < 500:
        return None
    g = np.arange(-plate.radius, plate.radius, 0.002)
    x, z = np.meshgrid(g, g)
    disc = np.hypot(x, z) < plate.radius
    floor = np.column_stack([x[disc], plate.height(np.hypot(x[disc], z[disc])), z[disc]])
    clear, _ = cKDTree(pts[mask][:, [0, 2]]).query(floor[:, [0, 2]], distance_upper_bound=0.008)
    floor = floor[~np.isfinite(clear)]
    hull_pts, hull_normals = extra if extra is not None else (np.empty((0, 3)), np.empty((0, 3)))
    both = o3d.geometry.PointCloud(o3d.utility.Vector3dVector(np.concatenate([pts[mask], hull_pts, floor])))
    normals = np.asarray(cloud.normals)[mask] if cloud.has_normals() else np.zeros((mask.sum(), 3))
    both.normals = o3d.utility.Vector3dVector(
        np.concatenate([normals, hull_normals, np.tile([0.0, 1.0, 0.0], (len(floor), 1))]))
    if not cloud.has_normals():
        both.estimate_normals()
        both.orient_normals_towards_camera_location(np.array([0.0, 10.0, 0.0]))
    mesh, density = o3d.geometry.TriangleMesh.create_from_point_cloud_poisson(both, depth=depth)
    density = np.asarray(density)
    v = np.asarray(mesh.vertices)
    r = np.hypot(v[:, 0], v[:, 2])
    # Nothing measured (or carved) within 6 mm: a sheet Poisson stretched across a gap. Where the
    # food stands on a plain plate there are few points, and it joins them over the plate.
    support = np.concatenate([pts[mask], hull_pts])
    near, _ = cKDTree(support).query(v, distance_upper_bound=0.006)
    flap = ~np.isfinite(near)
    outside = ~footprint(pts[mask], plate.radius)(v[:, [0, 2]])
    cut = ((v[:, 1] < plate.height(r) + 0.0005) | (r > 1.02 * plate.radius) | (density < np.quantile(density, 0.03))
           | flap | outside)
    mesh.remove_vertices_by_mask(cut)
    clusters, counts, _ = mesh.cluster_connected_triangles()
    clusters, counts = np.asarray(clusters), np.asarray(counts)
    if len(counts):
        mesh.remove_triangles_by_mask(counts[clusters] < 0.02 * counts.max())
        mesh.remove_unreferenced_vertices()
    return mesh if len(mesh.triangles) else None
