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


if __name__ == "__main__":
    app.run()
