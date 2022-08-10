from flask import Flask, jsonify, request, render_template
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
import uuid

app = Flask(__name__)
# adds a database
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///yt_homepages.db'
CORS(app)

# initialise the database
db = SQLAlchemy(app)



# Create Model
class YTHomepages(db.Model):
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
    videosData = request.get_json()
    print(videosData)
    # add each video to the database
    for video in videosData:
        print(video)
        uploadVideo = YTHomepages(user="ME", refreshId=video['refreshId'], orderOnScreen=video['orderOnScreen'], channelName=video['channelName'], videoName=video['videoName'], videoLengthInSec=video['videoLengthInSec'], videoViews=video['videoViews'], videoUploadDay=video['videoUploadDay'], url=video['url'])
        db.session.add(uploadVideo)
        # getInDepthStats(uploadVideo)
    # commit all the videos from one refresh
    db.session.commit() # want all these videos committed during this refresh to have a unique ID
    videosData = jsonify(videosData)

    return videosData

def getInDepthStats(videoUrl):
    #    check if the url is already in the video database
    #    if it isn't, add the following info
    #      videoName
    #      channelName
    #      videoLengthInSec
    #      videoViews (? this will change so maybe don't store ? I can do cool things with videos views if I can store when a user visits a video)
    #      videoUploadDay
    #      transcript
    #        positivityScore
    #        politicalScore
    #        truthinessScore
    #        countryOfOrigin
    #        otherBias
    #      comments
    #
    # things that will be tricky for -
    # transcript -
    #   Who is talking? i.e. in a news report, if they show something very right-wing as an example of something bad, 
    #       that can sometimes be more left wing bias. We may not be able to get who is talking at all
    #   timestamps. i.e. context to a sentence matters so trying to incorporate that is important



if __name__ == '__main__':
    app.run()