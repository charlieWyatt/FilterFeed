# Instructions to restart the database-
1. Delete the old database
2. run these shell commands
python
from add_to_sql import db
db.create_all()
exit()