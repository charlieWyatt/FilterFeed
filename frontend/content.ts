import type { PlasmoContentScript } from "plasmo"
import { v4 } from "uuid"

export const config: PlasmoContentScript = {
  matches: ["*://*.youtube.com/*"]
}

window.addEventListener("load", () => {
  console.log(`content script loaded with UUID: ${v4()}`)
  document.body.style.background = "pink"
  onLoad()
})

const onLoad = () => {
  // @charliewyatt put your onLoad code here.
  let pageRefreshId = v4()

  
  // this is a dumb way to do this, but I can't think of a better solution at the present time
  // every second, checks to see if the video length has loaded in yet because it's the last
  // thing to load in
  // should just change this into an async function...
  // One way around this, is just to hand all the urls over to the backend, and then let the backend 
  // go to each of the urls and scrape all the data. The urls appear first, and the backend has to 
  // go to the video anyway to get the transcript data
  var intervalId = window.setInterval(function(){
    let allVideos = document.querySelectorAll('ytd-rich-item-renderer');
    if(allVideos.length > 1) {
      if(tryReadVideoLength(allVideos)) {
        clearInterval(intervalId) 
        handleLoaded(allVideos, pageRefreshId)
      } 
    } else {
      console.log('no videos yet')
    }
    
    
  }, 3000);

}




/////////////////////////////////////////////////////////
///////////////// HELPER FUCTIONS ///////////////////////
/////////////////////////////////////////////////////////
function tryReadVideoLength(allVideos) {
  try{
      allVideos[1].querySelectorAll("ytd-thumbnail-overlay-time-status-renderer")[0].innerText.trim();
      return true
  } catch(err) {
      console.log("No Video Length yet")
      console.log(err)
      return false
  }
}

function addVideosToBackend(videosDataList) {
  // videoData is a json object
  console.log(videosDataList)
  fetch("http://127.0.0.1:5000/videosReceiver", {
          method: 'POST',
          headers: {
              'Content-type': 'application/json',
              'Accept': 'application/json'
      },
      // Strigify the payload into JSON:
      body:JSON.stringify(videosDataList)}).then(res=>{
              if(res.ok){
                  return res.json()
              }else{
                  alert("something is wrong")
              }
          }).then(jsonResponse=>{
              
              // Log the response data in the console
              console.log(jsonResponse)
          }).catch((err) => console.error(err));
          
  return;
}

// taken from here - https://stackoverflow.com/questions/9640266/convert-hhmmss-string-to-seconds-only-in-javascript 
function hmsToSecondsOnly(str) {
  var p = str.split(':'),
      s = 0, m = 1;

  while (p.length > 0) {
      s += m * parseInt(p.pop(), 10);
      m *= 60;
  }

  return s;
}

function getDataFromVideo(video, orderOnScreen, pageRefreshId) {
  // This must run once all the elements on the page have loaded. Video length is often slow to load

  console.log(video)
  // videos 
  try {
      let channelName = video.querySelectorAll("yt-formatted-string.ytd-channel-name")[0].innerText
      let videoLength = video.querySelectorAll("ytd-thumbnail-overlay-time-status-renderer")[0].innerText.trim();
      let videoLengthInSec = hmsToSecondsOnly(videoLength)
      
      let videoName = video.querySelector('#video-title').textContent
      let metaDataBlock = video.querySelectorAll('span.ytd-video-meta-block')
      let videoViews = metaDataBlock[0].innerText
      let videoUploadDay = metaDataBlock[1].innerText
      let url = video.querySelectorAll('a.ytd-thumbnail')[0].href
      
      // put in the url into the data
      // then when you give it to the backend this will be this algorithm run asynchronously
      //  check if the url is already in the video database
      //  if it isn't, add the following info
      //    videoName
      //    channelName
      //    videoLengthInSec
      //    videoViews (? this will change so maybe don't store ? I can do cool things with videos views if I can store when a user visits a video)
      //    videoUploadDay
      //    transcript
      //      positivityScore
      //      politicalScore
      //      truthinessScore
      //      countryOfOrigin
      //      otherBias
      //    comments

      let data = {
          "refreshId": pageRefreshId,
          "orderOnScreen": orderOnScreen,
          "channelName": channelName,
          "videoName": videoName,
          "videoLengthInSec": videoLengthInSec,
          "videoViews": videoViews,
          "videoUploadDay": videoUploadDay,
          "url": url
      }
      return data
  } catch(err) {
      // the above sometimes breaks when the video is an add or something
      console.log(err)
      return null
  }

}

// this is just a test so far
function getDataFromBackend() {
  fetch('http://127.0.0.1:5000/test')
    .then(function (response) {
        console.log(response)
        return response.json();
    }).then(function (text) {
        console.log('GET response:');
        console.log(text.greeting); // THIS WORKS!
    });
}

function handleLoaded(allVideos, pageRefreshId) {
  let pagesVideoData = []

  let filterPreferences = {}
  // filterVideos(allVideos, filterPreferences)
  let videoOrder = 0
  for(var i = 0; i < allVideos.length; i+=1) {
      // loops through all the videos and adds the data to backend
      let videoData = getDataFromVideo(allVideos[i], videoOrder, pageRefreshId)
      if(videoData) {
          pagesVideoData.push(videoData)
          // addVideoToBackend(videoData)
          videoOrder += 1 // there was a video, so increment the order you will see on screen
      }
  }
  // should get all the videos and then pass them to the backend all at once
  addVideosToBackend(pagesVideoData)

  console.log(pagesVideoData)

  getDataFromBackend()
}