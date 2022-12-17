import json
from datetime import datetime
from webbrowser import get
from flask import jsonify, request, Blueprint
from flask_cors import CORS
from scraper.yt import get_video_info
from models import db, YTHomepages, allVideos
from sentimentAnalysis import transcript_sentiment_score
from checkDatabase import querySentiment, queryVideoSentiment
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

@api.route("/getSentiment", methods=["GET"])
def getSentiment():
    # NEED TO SPECIFY A USER IN HERE
    return jsonify(querySentiment())

@api.route("/getVideoSentiment/<youtubeId>", methods=["GET"]) # this should probably be GET, but I need to give it some information to get the right video, and since GET requests can't take a body argument, this was the easiest solution
def getVideoSentiment(youtubeId):
    return {"sentiment": queryVideoSentiment(youtubeId)}

# I am in the process of depracting this. Will use videosReceiver instead
@api.route("/receiver", methods=["POST"])
def receiveVideo():
    data = request.get_json()
    print(data)  # THIS IS THE DATA OF EACH VIDEO!
    # add each video to the database
    video = YTHomepages(
        user="ME",
        orderOnScreen=data["orderOnScreen"],
        channelName=data["channelName"],
        videoName=data["videoName"],
        videoLengthInSec=data["videoLengthInSec"],
        videoViews=data["videoViews"],
        videoUploadDay=data["videoUploadDay"],
    )
    db.session.add(video)
    db.session.commit()
    data = jsonify(data)
    return data


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
            user="ME", # should change this to chrome.identity.getProfileUserInfo() need to google more how it works
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
        # categoryId=videoInfoJson["categoryId"],
        # likeCount=videoInfoJson["likes"],
        # commentCount = videoInfoJson["commentCount"],
        channelName=videoInfoJson["channel"]["name"],
        channelUrl=videoInfoJson["channel"]["url"],
        channelSubscribers=videoInfoJson["channel"]["subscribers"],
        # channelDescription= videoInfoJson["channel"]['description'],
        # channelViewCount= videoInfoJson["channel"]['viewCount'],
        # channelVideoCount= videoInfoJson["channel"]['videoCount'],
        # channelId = videoInfoJson["channelId"], 
        # defaultLanguage = videoInfoJson["defaultLanguage"],
        transcript=json.dumps(videoInfoJson["transcript"]),
        sentimentScore=transcript_sentiment_score(videoInfoJson['transcript'])
    )  # still need to add transcript score
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