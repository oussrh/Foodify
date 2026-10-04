"""The plate as a known shape and the texture painted from views, on synthetic data, no GPU.
From the engine's folder, as a module:

    python -m tests.plate_test
"""

import cv2
import numpy as np
import open3d as o3d

from engine import hull, paint, plate, texture
from engine.views import View


def check(label: str, ok: bool, detail="") -> None:
    print(f"{'ok  ' if ok else 'FAIL'} {label} {detail}")
    if not ok:
        raise SystemExit(1)


def _plate_points(radius=0.12, sides=None, rng=np.random.default_rng(5)):
    """A plate: a 3 mm floor rising to a 10 mm rim over its outer fifth, with a 6 cm dome of food
    on the inner half. `sides` makes it a polygon instead of round."""
    n = 60_000
    t = rng.uniform(0, 2 * np.pi, n)
    edge = radius if sides is None else radius * np.cos(np.pi / sides) / np.cos((t % (2 * np.pi / sides)) - np.pi / sides)
    r = np.sqrt(rng.uniform(0, 1, n)) * edge
    y = 0.003 + 0.007 * np.clip((r / edge - 0.8) / 0.2, 0, 1) + rng.normal(0, 0.0005, n)
    pts = np.column_stack([r * np.cos(t), y, r * np.sin(t)])
    d = rng.normal(size=(30_000, 3))
    d /= np.linalg.norm(d, axis=1, keepdims=True)
    food = d[d[:, 1] > 0] * [0.05, 0.06, 0.05] + [0, 0.003, 0]
    return np.concatenate([pts, food])


def fitting() -> None:
    pts = _plate_points()
    fitted = plate.fit(pts, 0.12)
    check("a round plate is fitted", fitted is not None)
    floor, rim = fitted.height(np.array([0.0]))[0], fitted.height(np.array([0.119]))[0]
    check("its floor is found under the food", abs(floor - 0.003) < 0.0015, f"({floor * 1000:.1f} mm)")
    check("its rim is found", abs(rim - 0.010) < 0.002, f"({rim * 1000:.1f} mm)")
    food = plate.food(pts, fitted)
    check("the food is the points above it", 0.9 < food[60_000:].mean() and food[:60_000].mean() < 0.02,
          f"({food[60_000:].mean():.2f} of food, {food[:60_000].mean():.3f} of plate)")
    check("a square plate is not fitted", plate.fit(_plate_points(sides=4), 0.12) is None)
    solid = plate.solid(fitted)
    check("the plate is a closed solid", solid.is_watertight())
    v = np.asarray(solid.vertices)
    check("standing on the table", abs(v[:, 1].min()) < 1e-9)


def painting() -> None:
    """A 10 cm square seen from straight above by one camera whose image is half red, half blue:
    each half of the texture takes its colour; a second square hidden under the first takes none."""
    def square(y):
        v = np.array([[-0.05, y, -0.05], [0.05, y, -0.05], [0.05, y, 0.05], [-0.05, y, 0.05]])
        return v, np.array([[0, 2, 1], [0, 3, 2]])
    (top, f1), (under, f2) = square(0.0), square(-0.02)
    positions, faces = np.concatenate([top, under]), np.concatenate([f1, f2 + 4])
    uvs = np.array([[0, 0], [0.5, 0], [0.5, 0.5], [0, 0.5], [0.5, 0.5], [1, 0.5], [1, 1], [0.5, 1]], float)
    normals = np.tile([0.0, 1.0, 0.0], (8, 1))
    image = np.zeros((400, 400, 3), np.uint8)
    image[:, :200] = (255, 0, 0)
    image[:, 200:] = (0, 0, 255)
    rotation = np.array([[1.0, 0, 0], [0, 0, 1.0], [0, -1.0, 0]])  # looking down -Y, image x = +X
    view = View("v", image, (400.0, 400.0, 200.0, 200.0), rotation, -rotation @ np.array([0, 0.3, 0]), True)
    grey = o3d.geometry.PointCloud(o3d.utility.Vector3dVector(positions))
    grey.colors = o3d.utility.Vector3dVector(np.full((8, 3), 0.5))
    img, _, painted = paint.paint(positions, normals, faces, uvs, 64, [view], grey)
    left, right = img[48, 4], img[48, 28]  # the top square's texels: bottom-left quarter of the texture
    check("each half of the surface takes the colour the camera saw there",
          left[0] > 200 > left[2] and right[2] > 200 > right[0], f"({left}, {right})")
    check("a surface no view sees keeps the points' colour", abs(int(img[16, 48][0]) - 128) < 3, f"({img[16, 48]})")
    check("the share painted from views is reported", 0.4 < painted < 0.6, f"({painted:.2f})")


def _looking_at(eye: np.ndarray) -> np.ndarray:
    """Rotation (world -> camera) of a camera at `eye` looking at the origin, image up along +Y."""
    forward = -eye / np.linalg.norm(eye)
    right = np.cross(forward, [0.0, 1.0, 0.0])
    right /= np.linalg.norm(right)
    return np.stack([right, np.cross(forward, right), forward])


def hulling() -> None:
    """A 6 cm cylinder of food, only its top measured: eight outlined views give back its sides."""
    rng = np.random.default_rng(9)
    t, r = rng.uniform(0, 2 * np.pi, 20_000), 0.03 * np.sqrt(rng.uniform(0, 1, 20_000))
    solid = np.column_stack([r * np.cos(t), rng.uniform(0.003, 0.05, 20_000), r * np.sin(t)])
    top = solid[solid[:, 1] > 0.045]
    views = []
    for azimuth in np.radians(np.arange(0, 360, 45)):
        eye = 0.4 * np.array([np.cos(azimuth) * np.cos(0.6), np.sin(0.6), np.sin(azimuth) * np.cos(0.6)])
        rotation = _looking_at(eye)
        view = View("v", np.zeros((300, 300, 3), np.uint8), (500.0, 500.0, 150.0, 150.0), rotation, -rotation @ eye, False)
        cam = solid @ rotation.T + view.translation
        u, v = (500 * cam[:, 0] / cam[:, 2] + 150).astype(int), (500 * cam[:, 1] / cam[:, 2] + 150).astype(int)
        mask = np.zeros((300, 300), np.uint8)
        mask[np.clip(v, 0, 299), np.clip(u, 0, 299)] = 1
        view.mask = cv2.dilate(mask, np.ones((5, 5), np.uint8)) > 0
        views.append(view)
    flat = plate.Plate(0.12, np.array([0.0, 0.12]), np.array([0.003, 0.003]), 0.003)
    pts, normals = hull.fill(views, top, flat)
    side = np.abs(np.hypot(pts[:, 0], pts[:, 2]) - 0.03) < 0.006
    check("the hull gives the sides stereo missed", len(pts) > 200 and side.mean() > 0.6 and pts[:, 1].min() < 0.015,
          f"({len(pts)} points, {side.mean():.2f} on the side, lowest {pts[:, 1].min() * 1000:.0f} mm)")
    outward = (normals[:, [0, 2]] * pts[:, [0, 2]]).sum(axis=1) > 0
    check("its normals point outward", outward[side].mean() > 0.9, f"({outward[side].mean():.2f})")
    check("no views with outlines, no hull", len(hull.fill([], top, flat)[0]) == 0)


def main() -> None:
    fitting()
    painting()
    hulling()
    print("plate: all checks passed")


if __name__ == "__main__":
    main()
