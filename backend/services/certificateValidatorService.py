import cv2, pytesseract, json, re, os, sys

import numpy as np

from PIL import Image

from fuzzywuzzy import fuzz

from imutils import contours

from pathlib import Path

# --------------------------------------------------
# Get the directory of the current script (validate.py)
# This is crucial for finding config.json, templates/, and logos/
SCRIPT_DIR = Path(__file__).parent
# --------------------------------------------------

# 0. One-time Tesseract path (Windows only)
# Uncomment and set this if you are on Windows and Tesseract is not in your PATH
pytesseract.pytesseract.tesseract_cmd = r"C:\Program Files\Tesseract-OCR\tesseract.exe"

# --------------------------------------------------

# Load configuration using the script's directory
CONFIG = json.load(open(SCRIPT_DIR / "config.json"))

def preprocess(img_path):
    """Resize → gray → adaptive threshold → denoise → deskew"""
    img = cv2.imread(img_path)
    if img is None:
        raise FileNotFoundError(f"Could not read image file: {img_path}")
    img = cv2.resize(img, (1200, 800))       # INDIACom best size
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    th = cv2.adaptiveThreshold(gray,255,
                               cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
                               cv2.THRESH_BINARY, 21, 15)
    kernel = np.ones((1, 1), np.uint8)
    th = cv2.medianBlur(th, 3)
    return th, img


def ocr_text(image):
    custom = r'--oem 3 --psm 6 -l eng+hin'    # add tam/tel/kan for regional boards
    return pytesseract.image_to_string(image, config=custom)


# --------------------------------------------------
# 1. Security feature checks
# --------------------------------------------------

def check_logo_match(bgr_img):
    """Template matching against official logos"""
    best_score = 0
    gray = cv2.cvtColor(bgr_img, cv2.COLOR_BGR2GRAY)
    
    # Iterate through logos in the 'logos' directory relative to the script
    for logo_path in (SCRIPT_DIR / "logos").glob("*.png"):
        tmpl = cv2.imread(str(logo_path), 0)
        if tmpl is None:
            print(f"Warning: Could not load logo template {logo_path}")
            continue # Skip if template loading fails

        # Check if template is larger than the image (can cause issues)
        if tmpl.shape[0] > gray.shape[0] or tmpl.shape[1] > gray.shape[1]:
            print(f"Warning: Logo template {logo_path} is larger than the input image. Skipping.")
            continue

        res = cv2.matchTemplate(gray, tmpl, cv2.TM_CCOEFF_NORMED)
        _, max_val, _, _ = cv2.minMaxLoc(res)
        best_score = max(best_score, max_val)
    return best_score > CONFIG["logo_threshold"]


def check_hologram_sticker(bgr_img):
    """Very naive: look for circular high-variance regions"""
    gray = cv2.cvtColor(bgr_img, cv2.COLOR_BGR2GRAY)
    # Applying a bit of blur can help smooth out noise before HoughCircles
    blurred = cv2.GaussianBlur(gray, (5, 5), 0)
    circles = cv2.HoughCircles(blurred,
                               cv2.HOUGH_GRADIENT, dp=2,
                               minDist=100, param1=100, param2=30,
                               minRadius=25, maxRadius=60)
    return circles is not None


# --------------------------------------------------
# 2. Rule-based text validation
# --------------------------------------------------

def extract_fields(raw_text):
    """Return dict with high-confidence fields"""
    patterns = CONFIG["patterns"]
    out = {}
    for key, rx in patterns.items():
        m = re.search(rx, raw_text, re.I | re.M | re.S)
        out[key] = m.group(1).strip() if m else None
    return out


def validate_fields(fields):
    """Board / university whitelist, year sanity, grade sanity, etc."""
    board = fields.get("board")
    # Check if board exists and if its similarity to any allowed board is below threshold
    if board:
        # Check against each allowed board in the list
        is_allowed = False
        for allowed_board_str in CONFIG["allowed_boards"]:
            if fuzz.partial_ratio(board.lower(), allowed_board_str.lower()) >= 85:
                is_allowed = True
                break
        if not is_allowed:
            return False, "Unknown board"
    else:
        return False, "Board field not found"

    try:
        yr = int(fields.get("year", 0))
        # Updated current year to 2025 based on current time
        if not (1970 <= yr <= 2025): # Assuming certificates won't be from future years
            return False, "Invalid year"
    except ValueError:
        return False, "Year unreadable"
    except TypeError: # Handle case where fields.get("year") might be None
        return False, "Year field not found or unreadable"


    try:
        percent = float(fields.get("percentage", -1))
        if not (0 <= percent <= 100):
            return False, "Invalid percentage"
    except ValueError:
        return False, "Percentage unreadable"
    except TypeError: # Handle case where fields.get("percentage") might be None
        return False, "Percentage field not found or unreadable"

    return True, "OK"


# --------------------------------------------------
# 3. Public API
# --------------------------------------------------

def is_valid_certificate(img_path):
    """
    Main function to validate an education certificate.
    Returns (True, extracted_fields) if valid, (False, error_message) otherwise.
    """
    try:
        clean, bgr = preprocess(img_path)
    except FileNotFoundError as e:
        return False, f"File error: {e}"
    except Exception as e:
        return False, f"Preprocessing failed: {e}"

    text = ocr_text(clean)
    fields = extract_fields(text)

    # 1. Text-level checks
    ok, msg = validate_fields(fields)
    if not ok:
        # Return fields even if text validation fails, for debugging/information
        return False, f"Text validation failed: {msg}. Extracted: {fields}"

    # 2. Visual security checks
    if not check_logo_match(bgr):
        return False, "Logo missing / mismatch"
    if not check_hologram_sticker(bgr):
        return False, "Hologram sticker not found"

    # 3. Bonus: barcode / QR scan (optional)
    # Implement cv2.QRCodeDetector and verification logic here if needed
    # Example:
    # qr_detector = cv2.QRCodeDetector()
    # val, pts, st_code = qr_detector.detectAndDecode(bgr)
    # if val:
    #     # Add logic to verify 'val' against a database/API
    #     if not verify_qr_code_with_api(val):
    #         return False, "QR code mismatch/invalid"

    return True, fields

# --------------------------------------------------
# 4. CLI entry-point (for direct testing of the script)
# --------------------------------------------------
if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python validate.py <path_to_image>")
        sys.exit(1)
    img_path = sys.argv[1]
    ok, info = is_valid_certificate(img_path)

    print("VERDICT:", "VALID" if ok else "NOT VALID")
    if isinstance(info, dict):
        print("EXTRACTED:")
        for key, value in info.items():
            print(f"  {key}: {value}")
    else:
        print("DETAILS:", info)