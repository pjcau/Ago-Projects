from main import app
for r in app.routes:
    print(r.path, getattr(r, "methods", None), r.name)