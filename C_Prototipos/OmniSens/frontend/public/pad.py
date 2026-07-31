from PIL import Image

def pad_image(path, out_path, size, padding_ratio=0.6, bg_color=(11, 19, 41, 255)):
    img = Image.open(path).convert("RGBA")
    w, h = img.size
    
    # Calculate new padded size (this will be the size of the background before resizing back)
    new_w = int(w * (1 + padding_ratio))
    new_h = int(h * (1 + padding_ratio))
    
    # Create new background
    new_img = Image.new("RGBA", (new_w, new_h), bg_color)
    
    # Paste original image in the center
    offset = ((new_w - w) // 2, (new_h - h) // 2)
    new_img.paste(img, offset, mask=img)
    
    # Resize back to final dimension size
    new_img = new_img.resize((size, size), Image.Resampling.LANCZOS)
    
    new_img.save(out_path)

pad_image("../src/assets/logo_omni.png", "pwa-192x192.png", size=192, padding_ratio=0.7)
pad_image("../src/assets/logo_omni.png", "pwa-512x512.png", size=512, padding_ratio=0.7)
print("Images padded successfully.")
