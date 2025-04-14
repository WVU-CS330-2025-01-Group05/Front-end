import json
import random
import os
from math import radians, cos, sin, asin, sqrt
from shapely.geometry import shape
from shapely.ops import transform
import pyproj

# Parameters to be called from user:
# position (x,y), Distance away (miles)
# Min Length ( x > 0.2) Max Length ( x > min)
# temp variables are implemented below for bounding box and distance

# User location and radius
user_lat, user_lon = 39.65633506508309, -79.80989610567241  # Middle of Coopers Rock
radius = 5  # miles

# Designed with miles to meters in mind for python functionality,
# but geoJSON use degrees instead of miles. these values below are in miles.
# Length functionality seems to work as intended
min_length_miles = 2.0
max_length_miles = 8.0


# Generated Haversine function (miles)
# used for calculating a radius around a coordinate
def haversine(lat1, lon1, lat2, lon2):
    r = 3958.8  # Earth radius in miles
    lat1, lon1, lat2, lon2 = map(radians, [lat1, lon1, lat2, lon2])
    dlat = lat2 - lat1
    dlon = lon2 - lon1
    a = sin(dlat / 2) ** 2 + cos(lat1) * cos(lat2) * sin(dlon / 2) ** 2
    return 2 * r * asin(sqrt(a))


# Convert mile distance to degree bounding box around lat/lon
def bounding_box(lat, lon, radius_miles):
    miles_per_deg_lat = 69.0
    miles_per_deg_lon = 69.0 * cos(radians(lat))  # Adjust for latitude
    delta_lat = radius_miles / miles_per_deg_lat
    delta_lon = radius_miles / miles_per_deg_lon
    return (
        lat - delta_lat,  # min_lat
        lon - delta_lon,  # min_lon
        lat + delta_lat,  # max_lat
        lon + delta_lon  # max_lon
    )


min_lat, min_lon, max_lat, max_lon = bounding_box(user_lat, user_lon, radius)

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
# and adds adequate trails to array, then chooses 3 random from that array.
for feature in data['features']:
    geom = feature.get('geometry')
    # GEOjson used multiLineString instead of lineString
    if not geom or geom['type'] != 'MultiLineString':
        continue

    # Check if any point in the geometry falls within the bounding box
    # then checks with the haversine to check distance from user
    # filters with box to reduce calls of haversine
    if any(
            min_lon < coord[0] < max_lon and min_lat < coord[1] < max_lat and
            haversine(user_lat, user_lon, coord[1], coord[0]) <= radius
            for line in geom['coordinates']
            for coord in line
    ):

        # Convert to Shapely geometry and project to meters
        line_geom = shape(geom)
        line_m = transform(project, line_geom)

        # Convert meters to miles
        length_miles = line_m.length / 1609.34

        # Min and max trail distance check
        if min_length_miles <= length_miles <= max_length_miles:
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
