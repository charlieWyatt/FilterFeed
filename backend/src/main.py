from rich import print
from app import create_app
from settings import DevConfig

CONFIG = DevConfig
app = create_app(CONFIG)

if __name__ == "__main__":
    print("🚀 Starting FilterFeed Backend on http://localhost:5000 ...")
    app.run()
