from pathlib import Path


def parse_drawing(file_path: str, file_type: str) -> dict:
    path = Path(file_path)
    summary: dict[str, int | str] = {"file_type": file_type, "filename": path.name}

    if file_type == "dxf":
        try:
            import ezdxf

            doc = ezdxf.readfile(file_path)
            msp = doc.modelspace()
            summary["entity_count"] = len(list(msp))
        except Exception:
            summary["entity_count"] = 0
    else:
        try:
            import cv2

            image = cv2.imread(file_path, cv2.IMREAD_GRAYSCALE)
            summary["height"] = int(image.shape[0]) if image is not None else 0
            summary["width"] = int(image.shape[1]) if image is not None else 0
        except Exception:
            summary["height"] = 0
            summary["width"] = 0

    return summary
