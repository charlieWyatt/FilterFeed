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
  var intervalId = window.setInterval(function(){
    let allVideos = document.querySelectorAll('ytd-rich-item-renderer');
    if(allVideos.length > 0) {
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
      // let textIdElements = video.querySelectorAll('#text')
      // console.log(textIdElements)
      // let videoLength = textIdElements[0].innerText.trim();
      // let channelName = textIdElements[1].innerText
      let channelName = video.querySelectorAll("yt-formatted-string.ytd-channel-name")[0].innerText
      let videoLength = video.querySelectorAll("ytd-thumbnail-overlay-time-status-renderer")[0].innerText.trim();
      let videoLengthInSec = hmsToSecondsOnly(videoLength)
      
      let videoName = video.querySelector('#video-title').textContent
      let metaDataBlock = video.querySelectorAll('span.ytd-video-meta-block')
      let videoViews = metaDataBlock[0].innerText
      let videoUploadDay = metaDataBlock[1].innerText

      let data = {
          "refreshId": pageRefreshId,
          "orderOnScreen": orderOnScreen,
          "channelName": channelName,
          "videoName": videoName,
          "videoLengthInSec": videoLengthInSec,
          "videoViews": videoViews,
          "videoUploadDay": videoUploadDay
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