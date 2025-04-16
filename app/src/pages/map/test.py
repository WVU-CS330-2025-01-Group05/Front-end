from flask import Flask, jsonify
from flask_cors import CORS
import subprocess
import os;

app = Flask(__name__)
CORS(app)  # Allow requests from different origins (React runs on another port)

@app.route("/run-script", methods=["POST"])
def run_script():
    script_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../public/data/randomTrailsSelection/geojsonReader.py"))
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