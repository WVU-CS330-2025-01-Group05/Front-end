import csv
import random
import json


# when randTrail is run, three random trails will be selected from input file
def randTrail(filename):
    with open(filename, newline='', encoding='utf-8') as csvfile:
        reader = csv.reader(csvfile)
        trails = [row for row in reader if row]  # Skip empty rows

        with open('trail_lines_full.geojson', 'r', encoding='utf-8') as f:
            data = json.load(f)

        # Write to a new file
        with open('trail_lines.geojson', 'w', encoding='utf-8') as f:

            # for loop 3 times, random.choice is amazing
            for _ in range(3):
                trail = random.choice(trails)
                testx = float(trail[0])
                testy = float(trail[1])
                print(f"x: {testx}, y: {testy}")

                x = trail[0]
                y = trail[1]
                # Copy the first 3 features
                new_data = {
                    "type": "FeatureCollection",
                    "features": data["features"][:3]
                }

            json.dump(new_data, f, indent=2)











            # x_min = 0
            # x_max = 100
            # y_min = 0
            # y_max = 100
            #
            # # Check x (and y if provided)
            # if x_min < x < x_max and (y_min is None or y_min < y < y_max):
            #     print(f"{x}, {y}")


randTrail(
    'WV_all_trails.csv',
)
