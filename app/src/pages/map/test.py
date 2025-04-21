from flask import Flask, jsonify
from flask_cors import CORS
import subprocess
import os;

app = Flask(__name__)

CORS(app)  # Allow requests from different origins (React runs on another port)

@app.route("/run-script", methods=["POST"])
def run_script():
    # Get the directory where the current script is located
    current_dir = os.path.dirname(os.path.abspath(__file__))
    # Navigate to the project root and then to the script
    script_path = os.path.join(current_dir, "..", "public", "data", "randomTrailsSelection", "geojsonReader.py")
    # Normalize the path to handle any ../ properly
    script_path = os.path.normpath(script_path)
    try:

        result = subprocess.run(
            ["python", script_path],
            capture_output=True,
            text=True
        )
        return jsonify({
            "status": "Script executed",
            "output": result.stdout,
            "error": result.stderr
        })
    except Exception as e:
        return jsonify({"status": "Error", "error": str(e)}), 500

if __name__ == "__main__":
    app.run(debug=True, port=5000)