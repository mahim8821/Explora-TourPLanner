import os
import xml.etree.ElementTree as ET

tree = ET.parse(os.path.join(os.path.dirname(__file__), 'bdmap.svg'))
root = tree.getroot()

namespace = {'svg': 'http://www.w3.org/2000/svg'}
divisions = ['Sylhet', 'Dhaka', 'CHTG', 'Barisal', 'Khulna', 'RAJSHAHI', 'RANGPUR']
# CHTG = Chittagong, etc.

for g in root.findall('.//svg:g', namespace):
    if g.attrib.get('id') in divisions:
        print(f"Division: {g.attrib.get('id')}")
        for child in g.findall('.//svg:path', namespace):
            if child.attrib.get('id'):
                print(f"  Path ID: {child.attrib.get('id')}")
        for child in g.findall('.//svg:polygon', namespace):
            if child.attrib.get('id'):
                print(f"  Polygon ID: {child.attrib.get('id')}")
