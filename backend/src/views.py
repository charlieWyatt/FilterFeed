import json
from datetime import datetime
from flask import jsonify, request, Blueprint
from flask_cors import CORS
from scraper.yt import get_video_info
from models import db, YTHomepages, allVideos

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
    # add each thumbnail and video to the database
    for thumbnail in thumbnailsData:
        print(thumbnail)
        uploadThumbnail = YTHomepages(
            user="ME",
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
        ).first()  # checks if the url is already in the database
        if not videoInDatabase:
            # video isn't yet in database, so add it in
            videoUpload = allVideos(
                url=videoInfo["url"],
                yt_id=videoInfo["yt_id"],
                title=videoInfo["title"],
                views=videoInfo["views"],
                description=videoInfo["description"],
                datePublished=videoInfo["date_published"],
                duration=thumbnail["videoLengthInSec"],
                tags=videoInfo["tags"],
                keywords=videoInfo["keywords"],
                likes=videoInfo["likes"],
                channelName=videoInfo["channel"]["name"],
                channelUrl=videoInfo["channel"]["url"],
                channelSubscribers=videoInfo["channel"]["subscribers"],
                transcript=json.dumps(videoInfo["transcript"]),
            )  # still need to add transcript
            db.session.add(videoUpload)
            db.session.commit()
        else:
            # video already exists in database, update all the info
            videoInDatabase.title = videoInfo["title"]
            videoInDatabase.description = videoInfo["description"]
            videoInDatabase.views = videoInfo["views"]
            videoInDatabase.keywords = videoInfo["keywords"]
            videoInDatabase.likes = videoInfo["likes"]
            videoInDatabase.channelName = videoInfo["channel"]["name"]
            videoInDatabase.channelUrl = videoInfo["channel"]["url"]
            videoInDatabase.channelSubscribers = videoInfo["channel"]["subscribers"]
            videoInDatabase.dateLastAccessed = datetime.utcnow()
            videoInDatabase.transcript = json.dumps(videoInfo["transcript"])
            db.session.commit()

    thumbnailsData = jsonify(thumbnailsData)

    return thumbnailsData
