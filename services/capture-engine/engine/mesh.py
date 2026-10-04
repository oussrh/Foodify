"""From COLMAP's dense cloud to a metric, upright, cropped, closed mesh.

COLMAP's output has no scale and no 'up'. The cameras circled the dish, so the point their rays
meet is the dish, and they are all above the table. The table is the plane under that point; the
dish is what rises above the table, continuously all the way round that point (a glass or a fork
beside the plate covers only a few directions, so it is not mistaken for the plate); its width is
the plate diameter the restaurant gives, which sets the scale. Output units are metres, +Y is up,
the table is y = 0 and the dish is centred on the origin: the Khronos/AR convention.
"""

import numpy as np
import open3d as o3d

MIN_ELEVATION = 0.004  # smallest height that is not table, as a fraction of the camera distance
RING, SECTORS = 0.01, 36


def _rotation_to_y(n: np.ndarray) -> np.ndarray:
    """Rotation taking unit vector n onto +Y (Rodrigues)."""
    y = np.array([0.0, 1.0, 0.0])
    v, c = np.cross(n, y), float(n @ y)
    if np.linalg.norm(v) < 1e-9:
        return np.eye(3) if c > 0 else np.diag([1.0, -1.0, -1.0])
    vx = np.array([[0, -v[2], v[1]], [v[2], 0, -v[0]], [-v[1], v[0], 0]])
    return np.eye(3) + vx + vx @ vx / (1 + c)


def _orbit_centre(centres: np.ndarray, dirs: np.ndarray) -> np.ndarray:
    """Least-squares point closest to every camera's viewing ray: what the operator circled."""
    a, b = np.zeros((3, 3)), np.zeros(3)
    for c, d in zip(centres, dirs):
        p = np.eye(3) - np.outer(d, d)
        a += p
        b += p @ c
    return np.linalg.lstsq(a, b, rcond=None)[0]


def _table(pts: np.ndarray, focus: np.ndarray, centres: np.ndarray, cam_dist: float):
    """Plane fitted near the dish only, so a wall or a counter in the background cannot win."""
    near = o3d.geometry.PointCloud()
    near.points = o3d.utility.Vector3dVector(pts[np.linalg.norm(pts - focus, axis=1) < 0.8 * cam_dist])
    if len(near.points) < 1000:
        raise RuntimeError("too few points near the dish to find the table")
    plane, _ = near.segment_plane(distance_threshold=0.003 * cam_dist, ransac_n=3, num_iterations=3000)
    n, d = np.array(plane[:3]), float(plane[3])
    n, d = n / np.linalg.norm(n), d / np.linalg.norm(n)
    if np.median(centres @ n + d) < 0:  # the cameras are above the table
        n, d = -n, -d
    up = np.mean(centres - focus, axis=0)
    if n @ (up / np.linalg.norm(up)) < 0.3:
        raise RuntimeError("the plane found is not under the cameras; the table was not seen")
    return n, d


def _refine_table(pts: np.ndarray, n: np.ndarray, d: float, focus: np.ndarray,
                  cam_dist: float) -> tuple[np.ndarray, float, float]:
    """Least-squares refit of the table on a ring well outside any plate, where only table is.

    RANSAC keeps the plane of its best three-point sample: slightly tilted, and free to settle
    between the table and a plate well a few millimetres above it. Over a dish that tilt is
    millimetres of false height. Returns (normal, offset, noise of the table around the plane).
    """
    for _ in range(3):
        h = pts @ n + d
        rel = pts - focus
        r = np.linalg.norm(rel - np.outer(rel @ n, n), axis=1)
        ring = (r > 0.45 * cam_dist) & (r < 0.7 * cam_dist) & (np.abs(h) < 0.01 * cam_dist)
        if ring.sum() < 200:
            return n, d, 0.0
        centroid = pts[ring].mean(axis=0)
        normal = np.linalg.svd(pts[ring] - centroid, full_matrices=False)[2][-1]
        n = normal if normal @ n > 0 else -normal
        d = -float(n @ centroid)
    h = pts[ring] @ n + d
    return n, d, 1.4826 * float(np.median(np.abs(h - np.median(h))))


def _dish_radius(h: np.ndarray, r: np.ndarray, theta: np.ndarray, threshold: float,
                 cam_height: float, cam_dist: float) -> float:
    """Outer radius of the region that is elevated in most directions around the centre."""
    elevated = (h > threshold) & (h < 0.6 * cam_height)
    ring = RING * cam_dist
    rings = int(0.7 * cam_dist / ring)
    ri = (r[elevated] / ring).astype(int)
    si = ((theta[elevated] + np.pi) / (2 * np.pi) * SECTORS).astype(int) % SECTORS
    inside = ri < rings
    counts = np.zeros((rings, SECTORS), int)
    np.add.at(counts, (ri[inside], si[inside]), 1)
    covered = (counts >= 2).mean(axis=1) >= 0.5

    start = int(np.argmax(covered))
    if not covered[start]:
        raise RuntimeError("could not find the dish above the table")
    end, misses = start, 0
    for k in range(start, rings):
        if covered[k]:
            end, misses = k, 0
        else:
            misses += 1
            if misses == 3:  # a gap of three rings (about 1.5 cm) ends the dish
                break
    return (end + 1) * ring


def align_and_scale(pcd: o3d.geometry.PointCloud, centres: np.ndarray, dirs: np.ndarray,
                    plate_m: float, margin: float) -> tuple[o3d.geometry.PointCloud, dict]:
    pts = np.asarray(pcd.points)
    focus = _orbit_centre(centres, dirs)
    cam_dist = float(np.median(np.linalg.norm(centres - focus, axis=1)))
    n, d = _table(pts, focus, centres, cam_dist)
    n, d, noise = _refine_table(pts, n, d, focus, cam_dist)

    focus = focus - (focus @ n + d) * n
    rot = _rotation_to_y(n)
    local = (pts - focus) @ rot.T
    h, r = local[:, 1], np.hypot(local[:, 0], local[:, 2])
    cam_height = float(np.median((centres - focus) @ n))
    # Not table: four sigmas of the table's own noise, and at least ~2 mm at a phone's distance.
    threshold = max(4 * noise, MIN_ELEVATION * cam_dist)
    radius = _dish_radius(h, r, np.arctan2(local[:, 2], local[:, 0]), threshold, cam_height, cam_dist)
    scale = plate_m / (2 * radius)

    # The detected edge can sit a ring (a few mm) outside the plate: table there would be baked
    # onto the plate's side as a coloured fringe, so table-level points near the edge go too.
    tablecloth = (r > 0.95 * radius) & (h < threshold)
    keep = (r < radius * margin) & (h > -0.02 * cam_height) & ~tablecloth
    out = _kept(pcd, local, rot, keep, scale)
    info = {"points_in": len(pts), "points_kept": int(keep.sum()), "scale": scale,
            "table_noise_mm": round(noise * scale * 1000, 2), "elevation_threshold_mm": round(threshold * scale * 1000, 2),
            "dish_radius_m": plate_m / 2, "crop_radius_m": radius * margin * scale,
            "camera_height_m": cam_height * scale, "camera_distance_m": cam_dist * scale}
    return out, info


def align_turntable(pcd: o3d.geometry.PointCloud, centres: np.ndarray, up: np.ndarray,
                    plate_m: float, margin: float) -> tuple[o3d.geometry.PointCloud, dict]:
    """The same frame as align_and_scale for a masked turntable capture, where the cloud is the
    dish alone: up is the turning axis (orbit.turn_axis), the base is the plate's lowest points,
    and the plate's width is the cloud's width round its own centre."""
    pts = np.asarray(pcd.points)
    if len(pts) < 1000:
        raise RuntimeError("too few points on the dish; the masks may have cut it away")
    rot = _rotation_to_y(up / np.linalg.norm(up))
    local = pts @ rot.T
    lo, hi = np.percentile(local, [0.5, 99.5], axis=0)
    origin = np.array([(lo[0] + hi[0]) / 2, lo[1], (lo[2] + hi[2]) / 2])
    local = local - origin
    r = np.hypot(local[:, 0], local[:, 2])
    radius = float(np.percentile(r, 99))
    scale = plate_m / (2 * radius)
    keep = (r < radius * margin) & (local[:, 1] > -0.02 * radius)
    cams = (centres @ rot.T - origin) * scale
    info = {"points_in": len(pts), "points_kept": int(keep.sum()), "scale": scale,
            "dish_radius_m": plate_m / 2, "crop_radius_m": radius * margin * scale,
            "camera_height_m": float(np.median(cams[:, 1])),
            "camera_distance_m": float(np.median(np.linalg.norm(cams, axis=1)))}
    return _kept(pcd, local, rot, keep, scale), info


def _kept(pcd: o3d.geometry.PointCloud, local: np.ndarray, rot: np.ndarray, keep: np.ndarray,
          scale: float) -> o3d.geometry.PointCloud:
    out = o3d.geometry.PointCloud()
    out.points = o3d.utility.Vector3dVector(local[keep] * scale)
    out.colors = o3d.utility.Vector3dVector(np.asarray(pcd.colors)[keep])
    if pcd.has_normals():
        out.normals = o3d.utility.Vector3dVector(np.asarray(pcd.normals)[keep] @ rot.T)
    else:
        out.estimate_normals()
        out.orient_normals_towards_camera_location(np.array([0.0, 10.0, 0.0]))
    return out


def _base(radius_m: float, spacing_m: float = 0.002) -> o3d.geometry.PointCloud:
    """A disc at table level, facing down: the plate's unseen underside, so the surface closes."""
    g = np.arange(-radius_m, radius_m, spacing_m)
    x, z = np.meshgrid(g, g)
    disc = np.hypot(x, z) < radius_m
    pts = np.column_stack([x[disc], np.zeros(disc.sum()), z[disc]])
    base = o3d.geometry.PointCloud()
    base.points = o3d.utility.Vector3dVector(pts)
    base.normals = o3d.utility.Vector3dVector(np.tile([0.0, -1.0, 0.0], (len(pts), 1)))
    base.colors = o3d.utility.Vector3dVector(np.full((len(pts), 3), 0.8))
    return base


def _drop_small_pieces(mesh: o3d.geometry.TriangleMesh, fraction: float) -> None:
    clusters, counts, _ = mesh.cluster_connected_triangles()
    clusters, counts = np.asarray(clusters), np.asarray(counts)
    if len(counts):
        mesh.remove_triangles_by_mask(counts[clusters] < fraction * counts.max())
        mesh.remove_unreferenced_vertices()


def surface(pcd: o3d.geometry.PointCloud, dish_radius_m: float, crop_radius_m: float,
            depth: int = 10, trim_quantile: float = 0.03) -> o3d.geometry.TriangleMesh:
    """Poisson surface over the dish and a closed base, trimmed where unsupported, cut to the dish."""
    mesh, density = o3d.geometry.TriangleMesh.create_from_point_cloud_poisson(
        pcd + _base(0.97 * dish_radius_m), depth=depth)
    density = np.asarray(density)
    mesh.remove_vertices_by_mask(density < np.quantile(density, trim_quantile))
    v = np.asarray(mesh.vertices)
    mesh.remove_vertices_by_mask((np.hypot(v[:, 0], v[:, 2]) > crop_radius_m) | (v[:, 1] < -0.002))
    _drop_small_pieces(mesh, 0.02)
    mesh.remove_degenerate_triangles()
    mesh.remove_duplicated_vertices()
    mesh.remove_non_manifold_edges()
    if len(mesh.triangles) == 0:
        raise RuntimeError("the surface came out empty after cropping")
    return mesh


def simplify(mesh: o3d.geometry.TriangleMesh, target_triangles: int) -> o3d.geometry.TriangleMesh:
    low = mesh.simplify_quadric_decimation(target_number_of_triangles=target_triangles)
    low.remove_degenerate_triangles()
    low.remove_unreferenced_vertices()
    low.compute_vertex_normals()
    return low
