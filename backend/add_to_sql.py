from flask import Flask, jsonify, request, render_template
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
import uuid
# import requests # couldn't get to work with beautiful soup
# from bs4 import BeautifulSoup
from requests_html import HTMLSession
from bs4 import BeautifulSoup as bs
import re
import json
from yt_scraper import get_video_info



app = Flask(__name__)
# adds a database
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///yt_homepages.db'
app.config['SQLALCHEMY_BINDS'] = {
    'yt_homepages': 'sqlite:///yt_homepages.db',
    'all_videos': 'sqlite:///all_videos.db'
}

CORS(app)

# initialise the database
db = SQLAlchemy(app)



# Create Model
class YTHomepages(db.Model):
    __bind_key__ = 'yt_homepages'
    # the grain of this model - each row represents a video from a users loaded page
    # will add in more AI / sentiment analysis things in here later
    id = db.Column(db.Integer, primary_key=True)
    # Need to put in here the UserID. Don't have a way to get this at the moment
    # check this link https://developer.chrome.com/docs/webstore/identify_user/ 
    user = db.Column(db.String(200), nullable=True)
    refreshId = db.Column(db.String(200), nullable=True) # This is how to identify which video belong to which refresh of a user

    # TO DO:
    # videoType = db.Column(db.String(200), nullable=True) # E.g. music mix, live stream, playlist, short, advertisement etc

    orderOnScreen = db.Column(db.Integer, nullable=True)
    channelName = db.Column(db.String(50), nullable=True)
    videoName = db.Column(db.String(200), nullable=True)
    videoLengthInSec = db.Column(db.String(200), nullable=True) # This should probably be an integer in number of seconds
    videoViews = db.Column(db.Integer, nullable=True)
    videoUploadDay = db.Column(db.String(200), nullable=True)
    url = db.Column(db.String(300), nullable=True)
    dateAdded = db.Column(db.DateTime, default=datetime.utcnow)

    # create a string
    def __repr__(self):
        return '<User %r>' % self.user

class allVideos(db.Model):
    __bind_key__ = 'all_videos'

    # grain of this model - each row is a video that has been accessed by a user
    id = db.Column(db.Integer, primary_key=True)
    url = db.Column(db.String(300), nullable = True, unique=True)
    # id that youtube gives it
    yt_id = db.Column(db.String(100), nullable = True)
    title = db.Column(db.String(200), nullable = True)
    views = db.Column(db.Integer, nullable = True)
    description = db.Column(db.String(1000), nullable = True)
    datePublished = db.Column(db.String(50), nullable = True)
    duration = db.Column(db.Integer, nullable = True)
    tags = db.Column(db.String(200), nullable = True)
    keywords = db.Column(db.String(300), nullable = True)
    likes = db.Column(db.Integer, nullable = True)
    channelName = db.Column(db.String(100), nullable = True)
    channelUrl = db.Column(db.String(200), nullable = True)
    channelSubscribers = db.Column(db.String(100), nullable = True)
    transcript = db.Column(db.String(100000), nullable = True)
    dateFirstAdded = db.Column(db.DateTime, default=datetime.utcnow)
    dateLastAccessed = db.Column(db.DateTime, default=datetime.utcnow) # last time the video was accessed by this db

    # create a string
    def __repr__(self):
        return '<Title %r>' % self.title

@app.route('/')
def hello_world():
    return 'Hello, World!'

@app.route('/test', methods=['GET', 'POST'])
def addData():
    # GET request
    if request.method == 'GET':
        message = {'greeting':'Hello from Flask!'}
        return jsonify(message)  # serialize and use JSON headers
    # POST request
    if request.method == 'POST':
        print(request.get_json())  # parse as JSON
        return 'Sucesss', 200

# I am in the process of depracting this. Will use videosReceiver instead
@app.route('/receiver', methods=['POST'])
def receiveVideo():
    data = request.get_json()
    print(data) # THIS IS THE DATA OF EACH VIDEO!
    # add each video to the database
    video = YTHomepages(user="ME", orderOnScreen=data['orderOnScreen'], channelName=data['channelName'], videoName=data['videoName'], videoLengthInSec=data['videoLengthInSec'], videoViews=data['videoViews'], videoUploadDay=data['videoUploadDay'])
    db.session.add(video)
    db.session.commit()
    data = jsonify(data)
    return data

@app.route('/videosReceiver', methods=['POST'])
def receiveVideos():
    thumbnailsData = request.get_json()
    print(thumbnailsData)
    # add each thumbnail and video to the database
    for thumbnail in thumbnailsData:
        print(thumbnail)
        uploadThumbnail = YTHomepages(user="ME", refreshId=thumbnail['refreshId'], orderOnScreen=thumbnail['orderOnScreen'], channelName=thumbnail['channelName'], videoName=thumbnail['videoName'], videoLengthInSec=thumbnail['videoLengthInSec'], videoViews=thumbnail['videoViews'], videoUploadDay=thumbnail['videoUploadDay'], url=thumbnail['url'])
        db.session.add(uploadThumbnail)
        videoInfo = get_video_info(thumbnail['url'])
        videoInDatabase = allVideos.query.filter_by(url=thumbnail['url']).first() # checks if the url is already in the database
        if not videoInDatabase:
            # video isn't yet in database, so add it in
            videoUpload = allVideos(url=videoInfo['url'], yt_id=videoInfo['yt_id'], title=videoInfo['title'], views=videoInfo['views'],
            description=videoInfo['description'], datePublished=videoInfo['date_published'], duration=thumbnail['videoLengthInSec'], tags=videoInfo['tags'],
            keywords=videoInfo['keywords'], likes=videoInfo['likes'], channelName=videoInfo['channel']['name'], channelUrl=videoInfo['channel']['url'],
            channelSubscribers=videoInfo['channel']['subscribers'], transcript=json.dumps(videoInfo['transcript'])) # still need to add transcript
            db.session.add(videoUpload)
            db.session.commit()
        else:
            # video already exists in database, update all the info
            videoInDatabase.title = videoInfo['title']
            videoInDatabase.description = videoInfo['description']
            videoInDatabase.views = videoInfo['views']
            videoInDatabase.keywords = videoInfo['keywords']
            videoInDatabase.likes = videoInfo['likes']
            videoInDatabase.channelName = videoInfo['channel']['name']
            videoInDatabase.channelUrl = videoInfo['channel']['url']
            videoInDatabase.channelSubscribers = videoInfo['channel']['subscribers']
            videoInDatabase.dateLastAccessed = datetime.utcnow()
            videoInDatabase.transcript=json.dumps(videoInfo['transcript'])
            db.session.commit()
    
    thumbnailsData = jsonify(thumbnailsData)

    return thumbnailsData

# # Lots of code taken from here - https://www.thepythoncode.com/code/get-youtube-data-python
# def getVideoStats(videoUrl):
#     session = HTMLSession()
#     # download HTML code
#     response = session.get(videoUrl)
#     # create beautiful soup object to parse HTML
#     soup = bs(response.html.html, "html.parser")
#     # open("index.html", "w").write(response.html.html)
#     # initialize the result
#     result = {}
#     # video title
#     result["title"] = soup.find("meta", itemprop="name")['content']
#     # video views
#     result["views"] = soup.find("meta", itemprop="interactionCount")['content']
#     # video description
#     result["description"] = soup.find("meta", itemprop="description")['content']
#     # date published
#     result["date_published"] = soup.find("meta", itemprop="datePublished")['content']
#     # get the duration of the video
#     result["duration"] = soup.find("span", {"class": "ytp-time-duration"}) #.text # NOT SURE WHY THIS ISN'T WORKING
#     # get the video tags
#     result["tags"] = ', '.join([ meta.attrs.get("content") for meta in soup.find_all("meta", {"property": "og:video:tag"}) ]) # THIS ISN'T WORKING

#     result["keywords"] = soup.find("meta", {"name": "keywords"})['content']

#     # Additional video and channel information (with help from: https://stackoverflow.com/a/68262735)
#     data = re.search(r"var ytInitialData = ({.*?});", soup.prettify()).group(1)
#     data_json = json.loads(data)
#     videoPrimaryInfoRenderer = data_json['contents']['twoColumnWatchNextResults']['results']['results']['contents'][0]['videoPrimaryInfoRenderer']
#     videoSecondaryInfoRenderer = data_json['contents']['twoColumnWatchNextResults']['results']['results']['contents'][1]['videoSecondaryInfoRenderer']
#     # number of likes
#     likes_label = videoPrimaryInfoRenderer['videoActions']['menuRenderer']['topLevelButtons'][0]['toggleButtonRenderer']['defaultText']['accessibility']['accessibilityData']['label'] # "No likes" or "###,### likes"
#     likes_str = likes_label.split(' ')[0].replace(',','')
#     result["likes"] = '0' if likes_str == 'No' else likes_str

#     # channel details
#     channel_tag = soup.find("meta", itemprop="channelId")['content']
#     # channel name
#     channel_name = soup.find("span", itemprop="author").next.next['content']
#     # channel URL
#     # channel_url = soup.find("span", itemprop="author").next['href']
#     channel_url = f"https://www.youtube.com/{channel_tag}"
#     # number of subscribers as str
#     channel_subscribers = videoSecondaryInfoRenderer['owner']['videoOwnerRenderer']['subscriberCountText']['accessibility']['accessibilityData']['label']
    
#     result['channel'] = {'name': channel_name, 'url': channel_url, 'subscribers': channel_subscribers}

#     result['transcript'] = soup.find_all("div", {"class": "ytd-transcript-segment-renderer"})

#     print(result)
#     print()

#     return result

#    check if the url is already in the video database
#    if it isn't, add the following info
#      videoName
#      channelName
#      videoLengthInSec
#      videoViews (? this will change so maybe don't store ? I can do cool things with videos views if I can store when a user visits a video)
#      videoUploadDay
#      transcript
#        positivityScore
#           channelPositivityScore (this should contribute I reckon)
#           individualVideoPositivityScore
#        politicalScore
#           channelPoliticalScore (this should contribute I reckon)
#           individualVideoPoliticalScore
#        truthinessScore
#           channelTruthinessScore (this should contribute I reckon)
#           individualVideoTruthinessScore
#        countryOfOrigin
#        otherBias
#      comments

# things that will be tricky for -
# transcript -
#   Who is talking? i.e. in a news report, if they show something very right-wing as an example of something bad, 
#       that can sometimes be more left wing bias. We may not be able to get who is talking at all
#   timestamps. i.e. context to a sentence matters so trying to incorporate that is important
#   Identifying what is left wing / right wing. I reckon use some things that you KNOW are left-wing right-wing
#       like self professed left wing / right wing celebrities and see how similiar the thoughts are. Or can use key
#       words of things which are often left wing / right wing like welfare / abortion etc. Could provide a breakdown



if __name__ == '__main__':
    app.run()