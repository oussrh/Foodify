"""Write the dish as GLB (web, Android) and USDZ (iPhone AR Quick Look).

One mesh made of parts (the dish, and its branded base), each with its own material and JPEG
texture; one UV set; metres, +Y up: what Scene Viewer, Quick Look and model-viewer all accept.
The GLB is written by hand (it is a small format) so nothing re-encodes the textures or adds
extensions Scene Viewer does not document.
"""

import json
import struct
from dataclasses import dataclass
from pathlib import Path

import numpy as np

ARRAY_BUFFER, ELEMENT_ARRAY_BUFFER = 34962, 34963
FLOAT, UNSIGNED_INT = 5126, 5125


@dataclass
class Part:
    name: str                # "Dish", "Base": the USD prim and the material name
    positions: np.ndarray    # (n, 3) metres
    normals: np.ndarray      # (n, 3) unit
    uvs: np.ndarray          # (n, 2) OpenGL/USD convention: (0, 0) is the image's bottom-left
    faces: np.ndarray        # (m, 3) indices into positions
    texture: Path            # JPEG next to the output files
    roughness: float


def _pack(blobs: list[bytes]) -> tuple[bytearray, list[dict]]:
    data, views = bytearray(), []
    for blob in blobs:
        views.append({"buffer": 0, "byteOffset": len(data), "byteLength": len(blob)})
        data += blob
        data += b"\0" * (-len(data) % 4)
    return data, views


def _primitive_blobs(part: Part) -> tuple[list[bytes], np.ndarray, int, int]:
    pos = part.positions.astype("<f4")
    tex = np.column_stack([part.uvs[:, 0], 1 - part.uvs[:, 1]]).astype("<f4")  # glTF: v points down
    idx = part.faces.astype("<u4").ravel()
    return [pos.tobytes(), part.normals.astype("<f4").tobytes(), tex.tobytes(), idx.tobytes()], pos, len(pos), len(idx)


def write_glb(path: Path, parts: list[Part]) -> None:
    blobs, accessors, primitives, materials = [], [], [], []
    for i, part in enumerate(parts):
        part_blobs, pos, vertices, indices = _primitive_blobs(part)
        base = len(blobs)
        blobs += part_blobs
        accessors += [
            {"bufferView": base, "componentType": FLOAT, "count": vertices, "type": "VEC3",
             "min": pos.min(axis=0).tolist(), "max": pos.max(axis=0).tolist()},
            {"bufferView": base + 1, "componentType": FLOAT, "count": vertices, "type": "VEC3"},
            {"bufferView": base + 2, "componentType": FLOAT, "count": vertices, "type": "VEC2"},
            {"bufferView": base + 3, "componentType": UNSIGNED_INT, "count": indices, "type": "SCALAR"},
        ]
        primitives.append({"attributes": {"POSITION": base, "NORMAL": base + 1, "TEXCOORD_0": base + 2},
                           "indices": base + 3, "material": i})
        materials.append({"name": part.name, "pbrMetallicRoughness": {
            "baseColorTexture": {"index": i}, "metallicFactor": 0.0, "roughnessFactor": part.roughness}})
    first_image = len(blobs)
    blobs += [part.texture.read_bytes() for part in parts]

    data, views = _pack(blobs)
    for i, view in enumerate(views[:first_image]):
        view["target"] = ELEMENT_ARRAY_BUFFER if i % 4 == 3 else ARRAY_BUFFER
    gltf = {
        "asset": {"version": "2.0", "generator": "foodify-capture-engine"},
        "scene": 0,
        "scenes": [{"nodes": [0]}],
        "nodes": [{"mesh": 0, "name": "Dish"}],
        "meshes": [{"primitives": primitives}],
        "materials": materials,
        "textures": [{"source": i, "sampler": 0} for i in range(len(parts))],
        "samplers": [{"magFilter": 9729, "minFilter": 9987, "wrapS": 33071, "wrapT": 33071}],
        "images": [{"bufferView": first_image + i, "mimeType": "image/jpeg"} for i in range(len(parts))],
        "accessors": accessors,
        "bufferViews": views,
        "buffers": [{"byteLength": len(data)}],
    }
    js = json.dumps(gltf, separators=(",", ":")).encode()
    js += b" " * (-len(js) % 4)
    with open(path, "wb") as fh:
        fh.write(struct.pack("<4sII", b"glTF", 2, 12 + 8 + len(js) + 8 + len(data)))
        fh.write(struct.pack("<I4s", len(js), b"JSON") + js)
        fh.write(struct.pack("<I4s", len(data), b"BIN\0") + bytes(data))


def _usd_material(stage, part: Part):
    from pxr import Sdf, UsdShade

    root = f"/Dish/Materials/{part.name}"
    material = UsdShade.Material.Define(stage, root)
    surface = UsdShade.Shader.Define(stage, f"{root}/Surface")
    surface.CreateIdAttr("UsdPreviewSurface")
    surface.CreateInput("roughness", Sdf.ValueTypeNames.Float).Set(part.roughness)
    surface.CreateInput("metallic", Sdf.ValueTypeNames.Float).Set(0.0)
    material.CreateSurfaceOutput().ConnectToSource(surface.ConnectableAPI(), "surface")

    reader = UsdShade.Shader.Define(stage, f"{root}/StReader")
    reader.CreateIdAttr("UsdPrimvarReader_float2")
    reader.CreateInput("varname", Sdf.ValueTypeNames.String).Set("st")
    image = UsdShade.Shader.Define(stage, f"{root}/BaseColor")
    image.CreateIdAttr("UsdUVTexture")
    image.CreateInput("file", Sdf.ValueTypeNames.Asset).Set(part.texture.name)
    image.CreateInput("sourceColorSpace", Sdf.ValueTypeNames.Token).Set("sRGB")
    image.CreateInput("st", Sdf.ValueTypeNames.Float2).ConnectToSource(reader.ConnectableAPI(), "result")
    image.CreateOutput("rgb", Sdf.ValueTypeNames.Float3)
    surface.CreateInput("diffuseColor", Sdf.ValueTypeNames.Color3f).ConnectToSource(image.ConnectableAPI(), "rgb")
    return material


def _usd_mesh(stage, part: Part):
    from pxr import Gf, Sdf, UsdGeom, UsdShade, Vt

    mesh = UsdGeom.Mesh.Define(stage, f"/Dish/{part.name}")
    mesh.CreatePointsAttr(Vt.Vec3fArray.FromNumpy(part.positions.astype(np.float32)))
    mesh.CreateFaceVertexCountsAttr(Vt.IntArray.FromNumpy(np.full(len(part.faces), 3, np.int32)))
    mesh.CreateFaceVertexIndicesAttr(Vt.IntArray.FromNumpy(part.faces.astype(np.int32).ravel()))
    mesh.CreateNormalsAttr(Vt.Vec3fArray.FromNumpy(part.normals.astype(np.float32)))
    mesh.SetNormalsInterpolation(UsdGeom.Tokens.vertex)
    mesh.CreateSubdivisionSchemeAttr(UsdGeom.Tokens.none)
    lo, hi = part.positions.min(axis=0), part.positions.max(axis=0)
    mesh.CreateExtentAttr([Gf.Vec3f(*map(float, lo)), Gf.Vec3f(*map(float, hi))])
    st = UsdGeom.PrimvarsAPI(mesh).CreatePrimvar("st", Sdf.ValueTypeNames.TexCoord2fArray, UsdGeom.Tokens.vertex)
    st.Set(Vt.Vec2fArray.FromNumpy(part.uvs.astype(np.float32)))
    UsdShade.MaterialBindingAPI.Apply(mesh.GetPrim()).Bind(_usd_material(stage, part))


def write_usdz(path: Path, parts: list[Part]) -> None:
    from pxr import Sdf, Usd, UsdGeom, UsdUtils

    usdc = path.with_suffix(".usdc")
    stage = Usd.Stage.CreateNew(str(usdc))
    UsdGeom.SetStageUpAxis(stage, UsdGeom.Tokens.y)
    UsdGeom.SetStageMetersPerUnit(stage, 1.0)
    stage.SetDefaultPrim(UsdGeom.Xform.Define(stage, "/Dish").GetPrim())
    for part in parts:
        _usd_mesh(stage, part)
    stage.GetRootLayer().Save()
    UsdUtils.CreateNewARKitUsdzPackage(Sdf.AssetPath(str(usdc)), str(path))
    usdc.unlink()


VALIDATOR_KEYWORDS = ["UsdCoreValidators", "UsdzValidators", "UsdGeomValidators", "UsdShadeValidators"]


def check_usdz(path: Path) -> list[str]:
    """OpenUSD's validators for the package, geometry and shading (what `usdchecker` runs).

    Empty means it passed. OpenUSD no longer ships an ARKit-specific suite, so a real iPhone
    remains the final check for Quick Look.
    """
    from pxr import Usd, UsdValidation

    registry = UsdValidation.ValidationRegistry()
    names = [m.name for m in registry.GetValidatorMetadataForKeywords(VALIDATOR_KEYWORDS)]
    context = UsdValidation.ValidationContext(registry.GetOrLoadValidatorsByName(names))
    errors = context.Validate(Usd.Stage.Open(str(path)))
    return [f"{e.GetType()}: {e.GetMessage()}" for e in errors]
