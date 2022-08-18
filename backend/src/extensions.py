"""Extensions initialized by the app factory in main"""

from flask_migrate import Migrate
from flask_cors import CORS

migrate = Migrate()
cors = CORS()
