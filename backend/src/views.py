import json
from datetime import datetime
from webbrowser import get
from flask import jsonify, request, Blueprint
from flask_cors import CORS
from scraper.yt import get_video_info
from models import db, YTHomepages, allVideos, watchedVideos
from sentimentAnalysis import transcript_sentiment_score
from checkDatabase import querySentiment, queryVideoSentiment, queryFavCategories, queryFirstDate
import threading

api = Blueprint("api", __name__)

CORS(api, origins="*")


@api.route("/")
def hello_world():
    return "Hello, FilterFeed"


@api.route("/test", methods=["GET", "POST"])
def addData():
    # GET request
    if request.method == "GET":
        message = {"greeting": "Hello from Flask!"}
        return jsonify(message)  # serialize and use JSON headers
    # POST request
    if request.method == "POST":
        print(request.get_json())  # parse as JSON
        return "Sucesss", 200

# need to update privacy for this.. everyone shouldnt be able to access this
@api.route("/getSentiment/<userId>/<startDate>/<endDate>/<homepage>/<clicked>", methods=["GET"])
def getSentiment(userId, startDate, endDate, homepage, clicked):
    return jsonify(querySentiment(userId, startDate, endDate, homepage, clicked))

# need to update privacy for this.. everyone shouldnt be able to access this
@api.route("/getFavCategories/<userId>/<startDate>/<endDate>/<homepage>/<clicked>", methods=["GET"])
def getFavCategories(userId, startDate, endDate, homepage, clicked):
    return {"favCategories": queryFavCategories(userId, startDate, endDate, homepage, clicked)}

# need to update privacy for this.. everyone shouldnt be able to access this
@api.route("/getFirstDate/<userId>", methods=["GET"])
def getFirstDate(userId):
    return {"firstDate": queryFirstDate(userId)}

@api.route("/getVideoSentiment/<youtubeId>", methods=["GET"]) # this should probably be GET, but I need to give it some information to get the right video, and since GET requests can't take a body argument, this was the easiest solution
def getVideoSentiment(youtubeId):
    return {"sentiment": queryVideoSentiment(youtubeId)}

@api.route("/watchedVideoReceiver", methods=["POST"])
def receiveWatchedVideo():
    watchedInfo = request.get_json()
    number_added = add_watched_video(watchedInfo)
    watchedInfo["numberWatched"] = number_added
    print(watchedInfo)
    return watchedInfo

@api.route("/videosReceiver", methods=["POST"])
def receiveVideos():
    thumbnailsData = request.get_json() 
    print(thumbnailsData)

    # we will be adding thumbnail data by multithreading
    # this array allows us to join all the threads right before this 
    # function finishes
    # threads = []

    # add each thumbnail and video to the database
    for thumbnail in thumbnailsData:
        print(thumbnail)
        uploadThumbnail = YTHomepages(
            userId=thumbnail["userId"], # should change this to chrome.identity.getProfileUserInfo() need to google more how it works
            userEmail=thumbnail["userEmail"],
            refreshId=thumbnail["refreshId"],
            orderOnScreen=thumbnail["orderOnScreen"],
            channelName=thumbnail["channelName"],
            videoName=thumbnail["videoName"],
            videoLengthInSec=thumbnail["videoLengthInSec"],
            videoViews=thumbnail["videoViews"],
            videoUploadDay=thumbnail["videoUploadDay"],
            url=thumbnail["url"],
        )
        db.session.add(uploadThumbnail)
        videoInfo = get_video_info(thumbnail["url"])
        videoInDatabase = allVideos.query.filter_by(
            url=thumbnail["url"]
        ).first()  # checks if the url is already in the database THIS ISNT RIGHT. NEED TO HAVE MULTIPLE VIDEOS BASED ON ACCESSING OF DIFFERENT USERS
        # INSTEAD SHOULD DO -
        # for a user view - video_id, date clicked
        # then can join to the video table which has all the relevant information
        if not videoInDatabase:
            # video isn't yet in database, so add it in

            # this should be in a thread, that way, it doesn't have to finish one video before moving onto the next
            video_upload(videoInfo, thumbnail)
            # t = threading.Thread(target=video_upload, args=[videoInfo, thumbnail])
            # t.start()
            # threads.append(t)
            
            
            # videoUpload = allVideos(
            #     url=videoInfo["url"],
            #     yt_id=videoInfo["yt_id"],
            #     title=videoInfo["title"],
            #     views=videoInfo["views"],
            #     description=videoInfo["description"],
            #     datePublished=videoInfo["date_published"],
            #     duration=thumbnail["videoLengthInSec"],
            #     tags=videoInfo["tags"],
            #     keywords=videoInfo["keywords"],
            #     likes=videoInfo["likes"],
            #     channelName=videoInfo["channel"]["name"],
            #     channelUrl=videoInfo["channel"]["url"],
            #     channelSubscribers=videoInfo["channel"]["subscribers"],
            #     transcript=json.dumps(videoInfo["transcript"]),
            #     sentimentScore=transcript_sentiment_score(videoInfo['transcript'])
            # )
            # db.session.add(videoUpload)
            # db.session.commit()
        else:
            # video already exists in database, update all the info
            video_update(videoInDatabase, videoInfo)
            # t = threading.Thread(target=video_update, args=[videoInDatabase, videoInfo])
            # t.start()
            # threads.append(t)
    
    # for thread in threads:
    #     thread.join

    thumbnailsData = jsonify(thumbnailsData)

    return thumbnailsData

# HELPER FUNCTIONS
def video_upload(videoInfoJson, thumbnail):
    print("I am here")
    print(videoInfoJson)
    videoUpload = allVideos(
        url=videoInfoJson["url"],
        yt_id=videoInfoJson["yt_id"],
        title=videoInfoJson["title"],
        views=videoInfoJson["views"],
        description=videoInfoJson["description"],
        datePublished=videoInfoJson["date_published"],
        duration=thumbnail["videoLengthInSec"],
        tags=videoInfoJson["tags"],
        categoryId=videoInfoJson["categoryId"], #
        likes=videoInfoJson["likes"], #
        commentCount = videoInfoJson["commentCount"], #
        channelName=videoInfoJson["channel"]["name"],
        channelUrl=videoInfoJson["channel"]["url"],
        channelSubscribers=videoInfoJson["channel"]["subscribers"],
        channelDescription= videoInfoJson["channel"]['description'], #
        channelViewCount= videoInfoJson["channel"]['viewCount'], #
        channelVideoCount= videoInfoJson["channel"]['videoCount'], #
        channelId = videoInfoJson["channelId"], #
        defaultLanguage = videoInfoJson["defaultLanguage"], #
        transcript=json.dumps(videoInfoJson["transcript"]),
        sentimentScore=transcript_sentiment_score(videoInfoJson['transcript'])
    )
    db.session.add(videoUpload)
    db.session.commit()
    print("Added video successfully")
    return

def video_update(videoInDatabase, videoInfoJson):
    videoInDatabase.title = videoInfoJson["title"]
    videoInDatabase.description = videoInfoJson["description"]
    videoInDatabase.views = videoInfoJson["views"]
    #videoInDatabase.keywords = videoInfoJson["keywords"]
    #videoInDatabase.likes = videoInfoJson["likes"]
    videoInDatabase.channelName = videoInfoJson["channel"]["name"]
    videoInDatabase.channelUrl = videoInfoJson["channel"]["url"]
    videoInDatabase.channelSubscribers = videoInfoJson["channel"]["subscribers"]
    #videoInDatabase.channelViewCount = videoInfoJson["channel"]['viewCount']
    #videoInDatabase.channelVideoCount = videoInfoJson["channel"]['videoCount']
    #videoInDatabase.channelDescription = videoInfoJson['channel']['description']
    videoInDatabase.dateLastAccessed = datetime.utcnow()
    videoInDatabase.transcript = json.dumps(videoInfoJson["transcript"])
    db.session.commit()

def add_watched_video(watchedInfo):
    return_info = watchedInfo
    videoInDatabase = watchedVideos.query.filter_by(
            url=watchedInfo["url"],
            userId=watchedInfo["userId"]
        ).first()
    if (videoInDatabase):
        # if video exists in database already, just update it
        videoInDatabase.numberOfVisits = videoInDatabase.numberOfVisits + 1
        videoInDatabase.dateLastWatched = datetime.utcnow()
        db.session.commit()
        return videoInDatabase.numberOfVisits 
    else:
        # if no video exists, add all information to the database
        videoInfo = get_video_info(watchedInfo["url"])
        watchedVideoUpload = watchedVideos(
            url = watchedInfo["url"],
            userId = watchedInfo["userId"],
            dateAdded = datetime.utcnow(),
            dateLastWatched = datetime.utcnow(),
            numberOfVisits = 1,
            # duration=watchedInfo["videoLengthInSec"] # TO DO: add duration
            ###################################################################
            # Ideally this block should be moved to its own function
            # SHOULD INSTEAD ADD THIS ALL TO ALL_VIDEOS INSTEAD OF INTO THE SAME TABLE
            yt_id=videoInfo["yt_id"],
            title=videoInfo["title"],
            views=videoInfo["views"],
            description=videoInfo["description"],
            datePublished=videoInfo["date_published"],
            tags=videoInfo["tags"],
            categoryId=videoInfo["categoryId"], #
            likes=videoInfo["likes"], #
            commentCount = videoInfo["commentCount"], #
            channelName=videoInfo["channel"]["name"],
            channelUrl=videoInfo["channel"]["url"],
            channelSubscribers=videoInfo["channel"]["subscribers"],
            channelDescription= videoInfo["channel"]['description'], #
            channelViewCount= videoInfo["channel"]['viewCount'], #
            channelVideoCount= videoInfo["channel"]['videoCount'], #
            channelId = videoInfo["channelId"], #
            defaultLanguage = videoInfo["defaultLanguage"], #
            transcript=json.dumps(videoInfo["transcript"]),
            sentimentScore=transcript_sentiment_score(videoInfo['transcript'])
            ###################################################################

            # STILL NEED TO DO totalWatchTime AND watchedIntervals
        )
        db.session.add(watchedVideoUpload)
        db.session.commit()
        return 1