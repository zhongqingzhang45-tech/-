import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from api.server import create_app

if __name__ == "__main__":
    app = create_app()
    host = os.environ.get("HOST", "0.0.0.0")
    port = int(os.environ.get("PORT", "8000"))
    print("Starting server on http://" + host + ":" + str(port))
    app.run(host=host, port=port, debug=True)
