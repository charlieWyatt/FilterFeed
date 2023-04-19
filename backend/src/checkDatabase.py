# Just being used to query database atm
import sqlite3

# FOR DEBUGGING - MY USER ID IS - 114168235507190878569

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
    cur.execute("SELECT url, sentimentScore FROM all_videos")

    rows = cur.fetchall()

    for row in rows:
        print(row)
    
def querySentiment(userId, startDate, endDate, homepage, clicked):
    # need to add userId to the query
    database = create_connection("database.db")
    cur = database.cursor()
    cur.execute("SELECT AVG(sentimentScore) FROM all_videos")

    rows = cur.fetchall()
    return rows[0][0]

def queryFavCategories(userId, startDate, endDate, homepage, clicked):
    print(homepage)
    print(clicked)
    print(startDate)
    print(endDate)
    database = create_connection("database.db")
    cur = database.cursor()
    if homepage == "true" and clicked == "true":
        cur.execute(f'''
        SELECT av.CategoryId, COUNT(*) 
        FROM yt_homepages yth 
        LEFT JOIN all_videos av 
            ON yth.url = av.url 
        LEFT JOIN watched_videos wv 
            ON wv.url = yth.url 
        WHERE yth.userId='{str(userId)}' AND yth.dateAdded >= '{str(startDate)}' AND yth.dateAdded <= '{endDate}' 
        GROUP BY av.CategoryId

        UNION

        SELECT av.CategoryId, COUNT(*) 
        FROM watched_videos wv 
        LEFT JOIN all_videos av 
            ON wv.url = av.url 
        LEFT JOIN yt_homepages yth 
            ON wv.url = yth.url 
        WHERE yth.userId='{str(userId)}' AND yth.dateAdded >= '{str(startDate)}' AND yth.dateAdded <= '{endDate}' 
        GROUP BY av.CategoryId;
            ''')
    elif clicked == "true":
        # not sure if there is a dateAdded column here
        cur.execute("SELECT av.CategoryId, COUNT(*) FROM watched_videos wv LEFT JOIN all_videos av ON wv.url = av.url WHERE userId='"+str(userId)+"' AND dateAdded >= '" + str(startDate) + "' AND dateAdded <= '"+ str(endDate) + "' GROUP BY av.CategoryId")
    elif homepage == "true":
        cur.execute("SELECT av.CategoryId, COUNT(*) FROM yt_homepages yth LEFT JOIN all_videos av ON yth.url = av.url WHERE userId='"+str(userId)+"' AND dateAdded >= '" + str(startDate) + "' AND dateAdded <= '"+ str(endDate) + "' GROUP BY av.CategoryId")
    rows = cur.fetchall()
    return rows

def queryFirstDate(userId):
    # just return the first date the user saw a homepage
    database = create_connection("database.db")
    cur = database.cursor()
    cur.execute("SELECT min(dateAdded) FROM yt_homepages WHERE userId='"+str(userId)+"'")

    rows = cur.fetchall()
    return rows[0]

def queryVideoSentiment(youtubeId):
    database = create_connection("database.db")
    cur = database.cursor()
    cur.execute(f"SELECT sentimentScore FROM all_videos where yt_id='{youtubeId}'")

    rows = cur.fetchall()
    try:
        return rows[0][0]
    except:
        return None # video has no transcript

if __name__ == '__main__':
    import argparse
    parser = argparse.ArgumentParser(description="Shows all rows of SQL Database")
    parser.add_argument("db", help="Name of the database you want to query")

    args = parser.parse_args()
    # parse the video URL from command line
    db = args.db

    database = create_connection(db)
    # watchedVideos.__table__.drop()

    print(queryFavCategories(114168235507190878569, '2010-1-1', '2023-2-15', True, False))
