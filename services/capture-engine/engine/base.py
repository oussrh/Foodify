"""The underside of the dish: never filmed, so it is made, not reconstructed.

The flat faces at table level facing down become their own part: a clean disc in the plate's
colour with the restaurant's logo, or its name, centred. It shares the plate's outline, so there
is no seam, and it is a separate material, so the logo keeps its own sharp texture.
"""

import io
import urllib.request
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFont

BASE_HEIGHT_M = 0.003
DEFAULT_COLOR = (0.92, 0.91, 0.88)
FONTS = [
    "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",  # the Modal image (fonts-dejavu-core)
    r"C:\Windows\Fonts\arialbd.ttf",
    "/System/Library/Fonts/Helvetica.ttc",
]


def faces(vertices: np.ndarray, triangles: np.ndarray, face_normals: np.ndarray) -> np.ndarray:
    """Mask of the faces that make the base: all corners at table level, facing down."""
    low = (vertices[triangles][:, :, 1] < BASE_HEIGHT_M).all(axis=1)
    return low & (face_normals[:, 1] < -0.7)


def uvs(positions: np.ndarray, radius_m: float) -> np.ndarray:
    """Planar mapping of the disc onto the whole image.

    Reads correctly when the camera orbits down under the dish from model-viewer's default front
    view (camera on +Z): from there, screen right is +X and screen up is +Z (checked by rendering).
    """
    return np.column_stack([0.5 + positions[:, 0] / (2 * radius_m), 0.5 + positions[:, 2] / (2 * radius_m)])


def plate_color(points: np.ndarray, colors: np.ndarray, radius_m: float) -> tuple[float, float, float]:
    """Median colour of the plate's rim, seen from above: the colour the base should be."""
    r = np.hypot(points[:, 0], points[:, 2])
    rim = (r > 0.85 * radius_m) & (r < radius_m)
    if rim.sum() < 50:
        return DEFAULT_COLOR
    return tuple(float(c) for c in np.median(colors[rim], axis=0))


def parse_color(value: str) -> tuple[float, float, float] | None:
    value = value.strip().lstrip("#")
    if len(value) != 6:
        return None
    return tuple(int(value[i:i + 2], 16) / 255 for i in (0, 2, 4))


def _font(size: int) -> ImageFont.FreeTypeFont:
    for path in FONTS:
        if Path(path).exists():
            return ImageFont.truetype(path, size)
    return ImageFont.load_default(size)


MAX_LOGO_BYTES = 5 * 1024 ** 2
Image.MAX_IMAGE_PIXELS = 16_000_000  # a decompression bomb raises instead of filling memory


class _NoRedirect(urllib.request.HTTPRedirectHandler):
    """The API allows one host for logos (service.py); a redirect could lead anywhere, so none is followed."""

    def redirect_request(self, *args, **kwargs):
        return None


def _load_logo(source: str) -> Image.Image:
    """The logo from an https address (no redirect, at most 5 MB) or, on the command line only, a file."""
    if source.startswith(("http://", "https://")):
        opener = urllib.request.build_opener(_NoRedirect)
        with opener.open(source, timeout=20) as response:
            data = response.read(MAX_LOGO_BYTES + 1)
        if len(data) > MAX_LOGO_BYTES:
            raise ValueError("the logo is larger than 5 MB")
        return Image.open(io.BytesIO(data)).convert("RGBA")
    return Image.open(source).convert("RGBA")


def _draw_text(img: Image.Image, text: str, color: tuple) -> None:
    size = img.width
    draw = ImageDraw.Draw(img)
    points = int(size * 0.13)
    font = _font(points)
    while draw.textlength(text, font=font) > 0.7 * size and points > size * 0.04:
        points -= 2
        font = _font(points)
    luminance = 0.2126 * color[0] + 0.7152 * color[1] + 0.0722 * color[2]
    ink = (34, 34, 34) if luminance > 0.5 else (245, 245, 245)
    draw.text((size / 2, size / 2), text, font=font, fill=ink, anchor="mm")


def image(size: int, color: tuple, logo: str, text: str) -> tuple[Image.Image, str, list[str]]:
    """(texture, what is on it: logo | text | plain, notes for the report)."""
    img = Image.new("RGB", (size, size), tuple(int(round(c * 255)) for c in color))
    notes = []
    if logo:
        try:
            mark = _load_logo(logo)
            mark.thumbnail((int(size * 0.5), int(size * 0.5)), Image.LANCZOS)
            img.paste(mark, ((size - mark.width) // 2, (size - mark.height) // 2), mark)
            return img, "logo", notes
        except Exception as exc:  # a broken logo must not fail the dish
            notes.append(f"base logo not used ({type(exc).__name__}: {exc}); PNG or JPEG, not SVG")
    if text:
        _draw_text(img, text, color)
        return img, "text", notes
    return img, "plain", notes
