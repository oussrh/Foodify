"""What a job can be asked: the start parameters Foodify sends (service.py) and the tuning knobs."""

from dataclasses import dataclass


@dataclass
class Params:
    plate_cm: float = 27.0         # diameter of the plate; sets the real-world size
    mode: str = "walkaround"       # walkaround (the phone circles a still plate) | turntable (the plate turns)
    frames: int = 150              # frames kept for reconstruction
    mapper: str = "incremental"    # incremental | global (faster, try it in the bake-off)
    dense_views: int = 75          # frames dense stereo runs on (the slowest stage), evenly spaced
    dense_size: int = 1200         # long edge of the images dense stereo works on
    triangles: int = 50_000        # Scene Viewer's ideal is 30-50k
    texture_size: int = 2048       # Scene Viewer's maximum
    crop_margin: float = 1.06      # crop radius, as a multiple of the detected dish radius
    roughness: float = 0.6
    base_logo: str = ""            # underside: logo file or URL (PNG/JPEG), centred
    base_text: str = ""            # underside: restaurant name, used when there is no logo
    base_color: str = ""           # underside colour as #rrggbb; default: the plate's rim colour
    debug: bool = False           # also write the cropped dense cloud and the full-resolution mesh
