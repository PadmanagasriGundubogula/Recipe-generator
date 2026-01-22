# app.py

from flask import Flask
from flask_cors import CORS
from dotenv import load_dotenv

from routes.auth_routes import auth_bp
from routes.recipe_routes import recipe_bp
from routes.options_routes import options_bp, ensure_initial_data
from routes.graph_routes import graph_bp
from routes.usr_routes import usr_bp
from routes.feedback_routes import feedback_bp

def create_app():
    load_dotenv()

    app = Flask(__name__)
    CORS(app)

    # Ensure initial DB data (verbs, default items, etc.)
    ensure_initial_data()

    # Register blueprints
    app.register_blueprint(auth_bp)
    app.register_blueprint(recipe_bp)
    app.register_blueprint(options_bp)
    app.register_blueprint(graph_bp)
    app.register_blueprint(usr_bp)
    app.register_blueprint(feedback_bp)

    return app


if __name__ == "__main__":
    app = create_app()
    app.run(host="0.0.0.0", debug=True, port=2000, use_reloader=False)
