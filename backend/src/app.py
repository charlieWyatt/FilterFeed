from flask import Flask

from extensions import migrate, cors
from settings import DevConfig
from views import api
from models import db, init_db


def create_app(config_obj=DevConfig):
    """App factory. Pattern explained here: https://flask.palletsprojects.com/en/2.2.x/patterns/appfactories/"""

    app = Flask(__name__)
    app.config.from_object(config_obj)
    register_extensions(app)
    app.register_blueprint(api)
    with app.app_context():
      init_db()
    return app


def register_extensions(app):
    db.init_app(app)
    migrate.init_app(app, db)
    cors.init_app(app, origins="*")
