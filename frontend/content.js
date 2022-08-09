// this file only runs when the web page is loaded. That is not much video data, can get more 

// in future should make a package.json and move things into other files
// import addVideoToBackend from './services/backend'


let allVideos = document.querySelectorAll('ytd-rich-item-renderer');

console.log(allVideos)

pagesVideoData = []

// Instead of running the function on the button click - keep checking if there is a video length information
// every 3 seconds. Once there is, call the function
chrome.runtime.onMessage.addListener(gotMessage)

var intervalId = window.setInterval(function(){
    tryReadVideoLength()
  }, 3000);

function tryReadVideoLength() {
    try{
        allVideos[1].querySelectorAll("ytd-thumbnail-overlay-time-status-renderer")[0].innerText.trim();
        gotMessage()
        clearInterval(intervalId) 
    } catch(err) {
        console.log("No Video Length yet")
        console.log(err)
    }
}

function hideEvenVideos(videos) {
    for(var i = 0; i < videos.length; i+=2) {
        // hides every second video
        videos[i].style.display = 'none';
    }
}

// in future, move this into backend.js
function addVideoToBackend(videoData) {
    // videoData is a json object
    console.log(videoData)
    fetch("http://127.0.0.1:5000/receiver", {
            method: 'POST',
            headers: {
                'Content-type': 'application/json',
                'Accept': 'application/json'
        },
        // Strigify the payload into JSON:
        body:JSON.stringify(videoData)}).then(res=>{
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

// 
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

function getDataFromVideo(video, orderOnScreen) {
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

        data = {
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

function filterVideos(videos, filterPreferences) {
    // loop through videos and change things
    hideEvenVideos(videos)
    return;
}

// This gets run on buttonclick
function gotMessage(message=null, sender=null, sendResponse=null) {
    let filterPreferences = {}
    // filterVideos(allVideos, filterPreferences)
    let videoOrder = 0
    for(var i = 0; i < allVideos.length; i+=1) {
        // loops through all the videos and adds the data to backend
        let videoData = getDataFromVideo(allVideos[i], videoOrder)
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



// a bunch of testing things
function changeVideoBackgroundColor(videos, color = '#FF00FF') {
    for(video of videos) {
        // loops through all the videos
        video.style['background-color'] = color;
    }
}

function changeEvenVideoBackgroundColor(videos, color = '#FFFF00') {
    for(var i = 0; i < videos.length; i += 2) {
        videos[i].style['background-color'] = color;
    }
}