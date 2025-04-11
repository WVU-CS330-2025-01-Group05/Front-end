import json
import random
import os
from shapely.geometry import shape
from shapely.ops import transform
import pyproj

# Possible parameters to be called in the future:
# position, preferred distance
# min length and max length
# temp variables are implemented below for bounding box and distance

# Bounding box: (min_lon, min_lat, max_lon, max_lat)
bbox = (-100, 20, -30, 40)
# Designed with miles to meters in mind for python functionality, 
# but geoJSON use degrees instead of miles. these values below are NOT in miles.
min_length_miles = 0.2
max_length_miles = 2.0

# GeoJSON file calling

# Get the path of the current script
base_path = os.path.dirname(os.path.abspath(__file__))
# Join with the filename
filename = os.path.join(base_path, 'trail_lines_full.geojson')

# Load the full GeoJSON with header
with open(filename, 'r', encoding='utf-8') as f:
    data = json.load(f)

# Reprojection function to get distance in meters (WGS84 to UTM)
project = pyproj.Transformer.from_crs("EPSG:4326", "EPSG:32617", always_xy=True).transform

filtered = []

# Filtering function that goes through trail_lines_full, filters using bbox and distance
# and adds adequite trails to array, then chooses 3 random from that array.
for feature in data['features']:
    geom = feature.get('geometry')
    # GEOjson used multiLineString instead of lineString
    if not geom or geom['type'] != 'MultiLineString':
        continue

    # Check if any point in the geometry falls within the bounding box
    if any(
        bbox[0] < coord[0] < bbox[2] and bbox[1] < coord[1] < bbox[3]
        # Loop through lines
        for line in geom['coordinates']  
        # Loop through coordinates in the line
        for coord in line  
    ):
        line = shape(geom)
        filtered.append(feature)

        # Project to meters and calculate length, 
        # see distance notes at top of script
        line_m = transform(project, line)

        # see distance notes at top of script
        if min_length_miles <= line_m.length <= max_length_miles:
            filtered.append(feature)

# Sample 3 features (or fewer if not enough)
sample = random.sample(filtered, min(3, len(filtered)))

# Debug line showing a succesful script run, indicated in terminal
# print("Total features loaded:", len(data.get('features', [])))


# Copy original metadata, insert new features
output = {
    "type": data.get("type", "FeatureCollection"),
    "name": data.get("name", "Lines"),
    "crs": data.get("crs"),
    "features": sample
}

# Save to new GeoJSON
fileoutput = os.path.join(base_path, 'trail_lines.geojson')
with open(fileoutput, 'w', encoding='utf-8') as f:
    json.dump(output, f, indent=2)
