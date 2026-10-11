import urllib.request
import json
import xml.etree.ElementTree as ET

url = "https://raw.githubusercontent.com/ovirahman/Bangladesh-interactive-map/master/bdmap.svg"
try:
    response = urllib.request.urlopen(url)
    svg_data = response.read().decode('utf-8')
    print("Downloaded SVG!")
    with open('bdmap.svg', 'w') as f:
        f.write(svg_data)
except Exception as e:
    print(f"Failed to download map: {e}")
