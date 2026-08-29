"""
SIH26024 — Netlify Deployment Bundle Creator
Creates a clean, production-ready zip archive of the CoalGov frontend.
"""
import os
import zipfile

def create_deploy_bundle():
    zip_filename = "coalgov-netlify-deploy.zip"
    print(f"Creating Netlify production deploy bundle: {zip_filename}...")

    include_files = [
        "index.html",
        "styles.css",
        "app.js",
        "netlify.toml"
    ]
    include_dirs = [
        "src"
    ]

    with zipfile.ZipFile(zip_filename, 'w', zipfile.ZIP_DEFLATED) as zipf:
        # Add root files
        for filename in include_files:
            if os.path.exists(filename):
                zipf.write(filename, filename)
                print(f"  + Added: {filename} ({os.path.getsize(filename)} bytes)")

        # Add src directory recursively
        for dirname in include_dirs:
            if os.path.exists(dirname):
                for root, dirs, files in os.walk(dirname):
                    for file in files:
                        full_path = os.path.join(root, file)
                        rel_path = os.path.relpath(full_path, ".")
                        zipf.write(full_path, rel_path)
                        print(f"  + Added: {rel_path}")

    size_kb = os.path.getsize(zip_filename) / 1024
    print(f"\n[SUCCESS] Deployment package created: {zip_filename} ({size_kb:.1f} KB)")
    print("Ready to drop directly onto: https://app.netlify.com/drop")

if __name__ == '__main__':
    create_deploy_bundle()
