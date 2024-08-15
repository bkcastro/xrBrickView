from PIL import Image
import os

def convert_png_to_webp(input_folder, output_folder):
    # Ensure the output directory exists
    if not os.path.exists(output_folder):
        os.makedirs(output_folder)

    # Loop through all files in the input folder
    for filename in os.listdir(input_folder):
        if filename.endswith(".png"):
            img_path = os.path.join(input_folder, filename)
            
            # Open the image file
            img = Image.open(img_path).convert("RGBA")
            
            # Prepare the output path
            webp_filename = os.path.splitext(filename)[0] + ".webp"
            webp_path = os.path.join(output_folder, webp_filename)
            
            # Save the image in WebP format
            img.save(webp_path, "WEBP", quality=80)  # You can adjust the quality value

            print(f"Converted {filename} to {webp_filename}")

# Usage example
input_folder = "/Users/liljgremlin/Documents/GitHub/xrLego/public/images"
output_folder = "/Users/liljgremlin/Documents/GitHub/xrLego/public/images_webp"
convert_png_to_webp(input_folder, output_folder)
