# Just being used to query database atm
import sqlite3


# Code taken from here - https://www.sqlitetutorial.net/sqlite-python/sqlite-python-select/ 
def create_connection(db_file):
    """ create a database connection to the SQLite database
        specified by the db_file
    :param db_file: database file
    :return: Connection object or None
    """
    conn = None
    try:
        conn = sqlite3.connect(db_file)
    except Error as e:
        print(e)

    return conn

def select_all_tasks(conn):
    """
    Query all rows in the all_videos table
    :param conn: the Connection object
    :return:
    """
    cur = conn.cursor()
    cur.execute("SELECT * FROM all_videos")

    rows = cur.fetchall()

    for row in rows:
        print(row)

if __name__ == '__main__':
    all_videos = create_connection("all_videos.db")
    select_all_tasks(all_videos)