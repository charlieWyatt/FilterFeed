from requests_html import HTMLSession
from bs4 import BeautifulSoup as bs
import re
import json
import urllib.parse as urlparse
from youtube_transcript_api import YouTubeTranscriptApi

# needed for youtube api
import os
import googleapiclient.discovery

# init session
session = HTMLSession()

api_key = 'AIzaSyAR7C-Yu99l_R1sGzumwZyEUBeWEpcg-rE'


def get_video_info(url):

    # Should swap a lot of this out with the YouTube API

    vid_id = video_id(url)
    
    # Get credentials and create an API client
    youtube = googleapiclient.discovery.build(
        'youtube', 'v3', developerKey=api_key)

    request = youtube.videos().list(
        part="id,status,statistics,topicDetails,snippet",
        id=vid_id
    )
    response = request.execute()
    video_response = response['items'][0]

    request = youtube.channels().list(
        part="snippet,statistics,topicDetails,status,brandingSettings,contentOwnerDetails",
        id=video_response['snippet']['channelId']
    )
    response = request.execute()
    channel_response = response['items'][0]

    channel = {
        "name": channel_response['snippet']['title'],
        "description": channel_response['snippet']['description'] if 'description' in channel_response['snippet'] else None,
        "url": channel_response['snippet']['customUrl'] if 'customUrl' in channel_response['snippet'] else None, # not sure if every channel has a customUrl
        "subscribers": channel_response['statistics']['subscriberCount'] if 'subscriberCount' in channel_response['statistics'] else None,
        "viewCount": channel_response['statistics']['viewCount'] if 'viewCount' in channel_response['statistics'] else None,
        "videoCount": channel_response['statistics']['videoCount'] if 'videoCount' in channel_response['statistics'] else None,
        "id": video_response['snippet']['channelId'],
        "creationDate": channel_response['snippet']['publishedAt'] if 'publishedAt' in channel_response['snippet'] else None
        # there are more stuff I can get at a later date
    }
    
    # if video_response['snippet']['defaultLanguage']:
    #     language = video_response['snippet']['defaultLanguage']
    # else:
    #     language = "N/A"

    result = {
      "url": url,
      "yt_id": vid_id,
      "title": video_response['snippet']['title'] if 'title' in video_response['snippet'] else None,
      "views": video_response['statistics']['viewCount'] if 'viewCount' in video_response['statistics'] else None,
      "likes": video_response['statistics']['likeCount'] if 'likeCount' in video_response['statistics'] else None,
      "commentCount": video_response['statistics']['commentCount'] if 'commentCount' in video_response['statistics'] else None,
      "channel_title": video_response['snippet']['channelTitle'] if 'channelTitle' in video_response['snippet'] else None,
      "channelId": video_response['snippet']['channelId'] if 'channelId' in video_response['snippet'] else None,
      "description": video_response['snippet']['description'] if 'description' in video_response['snippet'] else None,
      "date_published": video_response['snippet']['publishedAt'] if 'publishedAt' in video_response['snippet'] else None,
      "tags": ", ".join(
        video_response['snippet']['tags']) if 'tags' in video_response['snippet'] else None,
      "categoryId": video_response['snippet']['categoryId'] if 'categoryId' in video_response['snippet'] else None,
      "defaultLanguage": video_response['snippet']['defaultLanguage'] if 'defaultLanguage' in video_response['snippet'] else None, # some videos do not have default language
      "channel": channel
      # "keywords": soup.find("meta", {"name": "keywords"})["content"],
    }
    try:
        result["transcript"] = YouTubeTranscriptApi.get_transcript(
            result["yt_id"]
        )  # probably another faster way to do this with beautiful soup.
    except:
        result["transcript"] = None  # if there is no transcript for the video

    return result


# HELPER FUNCTIONS
# taken from here - https://stackoverflow.com/questions/4356538/how-can-i-extract-video-id-from-youtubes-link-in-python
def video_id(value):
    """
    Examples:
    - http://youtu.be/SA2iWivDJiE
    - http://www.youtube.com/watch?v=_oPAwA_Udwc&feature=feedu
    - http://www.youtube.com/embed/SA2iWivDJiE
    - http://www.youtube.com/v/SA2iWivDJiE?version=3&amp;hl=en_US
    """
    query = urlparse.urlparse(value)
    if query.hostname == "youtu.be":
        return query.path[1:]
    if query.hostname in ("www.youtube.com", "youtube.com"):
        if query.path == "/watch":
            p = urlparse.parse_qs(query.query)
            return p["v"][0]
        if query.path[:7] == "/embed/":
            return query.path.split("/")[2]
        if query.path[:3] == "/v/":
            return query.path.split("/")[2]
    # fail?
    return None


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="YouTube Video Data Extractor")
    parser.add_argument("url", help="URL of the YouTube video")

    args = parser.parse_args()
    # parse the video URL from command line
    url = args.url

    data = get_video_info(url)

    # print in nice format
    print(f"Video ID: {data['yt_id']}")
    print(f"Title: {data['title']}")
    print(f"Views: {data['views']}")
    print(f"Published at: {data['date_published']}")
    # print(f"Video Duration: {data['duration']}")
    print(f"Video tags: {data['tags']}")
    # print(f"Video keywords: {data['keywords']}")
    print(f"Likes: {data['likeCount']}")
    # print(f"Dislikes: {data['dislikes']}")
    print(f"\nDescription: {data['description']}\n")
    print(f"\nChannel Name: {data['channel_title']}")
    print(f"\nChannel Id: {data['channelId']}")
    print(f"Channel URL: {data['channel']['url']}")
    print(f"Channel Subscribers: {data['channel']['subscribers']}")
    print(f"Transcript: {data['transcript']}")
