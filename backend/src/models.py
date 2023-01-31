from datetime import datetime
import os
from flask_sqlalchemy import SQLAlchemy, Model
from flask import current_app

# TODO(@hill): maybe move this init stuff
class CRUDMixin(Model):
    """Mixin that adds convenience methods for CRUD (create, read, update, delete) operations."""

    @classmethod
    def create(cls, **kwargs):
        """Create a new record and save it the database."""
        instance = cls(**kwargs)
        return instance.save()

    def update(self, commit=True, **kwargs):
        """Update specific fields of a record."""
        for attr, value in kwargs.items():
            setattr(self, attr, value)
        return commit and self.save() or self

    def save(self, commit=True):
        """Save the record."""
        db.session.add(self)
        if commit:
            db.session.commit()
        return self

    def delete(self, commit=True):
        """Remove the record from the database."""
        db.session.delete(self)
        return commit and db.session.commit()


db = SQLAlchemy(model_class=CRUDMixin)


# ===== Business Logic Models ===== #


class YTHomepages(db.Model):
    # the grain of this model - each row represents a video from a users loaded page
    # will add in more AI / sentiment analysis things in here later
    id = db.Column(db.Integer, primary_key=True)
    userId = db.Column(db.String(100), nullable=True)
    userEmail = db.Column(db.String(100), nullable=True)
    refreshId = db.Column(
        db.String(200), nullable=True
    )  # This is how to identify which video belong to which refresh of a user

    # TO DO:
    # videoType = db.Column(db.String(200), nullable=True) # E.g. music mix, live stream, playlist, short, advertisement etc

    orderOnScreen = db.Column(db.Integer, nullable=True)
    channelName = db.Column(db.String(50), nullable=True)
    videoName = db.Column(db.String(200), nullable=True)
    videoLengthInSec = db.Column(
        db.String(200), nullable=True
    )  # This should probably be an integer in number of seconds
    videoViews = db.Column(db.String(200), nullable=True) # this should probable be an integer
    videoUploadDay = db.Column(db.String(200), nullable=True)
    url = db.Column(db.String(300), nullable=True)
    dateAdded = db.Column(db.DateTime, default=datetime.utcnow)

    # create a string
    def __repr__(self):
        return "<User %r>" % self.user


class allVideos(db.Model):
    # grain of this model - each row is a video that has been accessed by a user
    id = db.Column(db.Integer, primary_key=True)
    url = db.Column(db.String(300), nullable=True, unique=True)
    # id that youtube gives it
    yt_id = db.Column(db.String(100), nullable=True)
    title = db.Column(db.String(200), nullable=True)
    views = db.Column(db.Integer, nullable=True)
    description = db.Column(db.String(1000), nullable=True)
    datePublished = db.Column(db.String(50), nullable=True)
    duration = db.Column(db.Integer, nullable=True)
    tags = db.Column(db.String(200), nullable=True)
    keywords = db.Column(db.String(300), nullable=True)
    likes = db.Column(db.Integer, nullable=True)
    channelName = db.Column(db.String(100), nullable=True)
    channelUrl = db.Column(db.String(200), nullable=True)
    channelSubscribers = db.Column(db.String(100), nullable=True)
    transcript = db.Column(db.String(100000), nullable=True)
    sentimentScore = db.Column(db.Integer, nullable=True)
    dateFirstAdded = db.Column(db.DateTime, default=datetime.utcnow)
    dateLastAccessed = db.Column(
        db.DateTime, default=datetime.utcnow
    )  # last time the video was accessed by this db

    # create a string
    def __repr__(self):
        return "<Title %r>" % self.title


def init_db():
    print('Initializing db...')
    db.create_all()
