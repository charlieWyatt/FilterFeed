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

const onLoad = async () => {
  // Get the users information
  const response = await chrome.runtime.sendMessage({greeting: "userInfo"});
  console.log(response);
  // (async () => {
  //   console.log("HOLA")
  //   const response = await chrome.runtime.sendMessage({greeting: "userInfo"});
  //   console.log(response);
  // })();

  let pageRefreshId = v4()
  
  // OLD ONE I THINK
  var intervalId = window.setInterval(async function(){
    let allThumbnails = document.querySelectorAll('ytd-rich-item-renderer');
    if(allThumbnails.length > 1) {
      if(tryReadVideoLength(allThumbnails)) {
        clearInterval(intervalId) 
        handleLoaded(allThumbnails, pageRefreshId)
        await displaySentiment(allThumbnails)
        handleFilter(allThumbnails, [-1, 1])
      } 
    } else {
      console.log('no thumbnails yet')
    }
    
    
  }, 3000);
  
  // this is a dumb way to do this, but I can't think of a better solution at the present time
  // every second, checks to see if the video length has loaded in yet because it's the last
  // thing to load in
  // should just change this into an async function...
  // One way around this, is just to hand all the urls over to the backend, and then let the backend 
  // go to each of the urls and scrape all the data. The urls appear first, and the backend has to 
  // go to the video anyway to get the transcript data

  // potentially helpful links - https://stackoverflow.com/questions/12819634/attaching-event-handlers-after-infinite-scroll-update
  
  // maybe a solution to this is -
  // thumbnails = []
  // while True {
  //    new_thumbnails = get elements with thumbnail tag 
  //    if(new_thumbanils != thumbnails) {
  //        // add difference to the database
  //    }
  // }
  // let oldThumbnails = []
  // var interval = window.setInterval(async function() {
  //   console.log(oldThumbnails)
  //   let allThumbnails = [document.querySelectorAll('ytd-rich-item-renderer')]
  //   let newThumbnails = allThumbnails.filter(x => !oldThumbnails.includes(x)); // THIS ISN'T WORKING FOR SOME REASON!!!!
  //   console.log(newThumbnails)
  //   console.log(oldThumbnails)
  //   console.log(allThumbnails)
  //   console.log(oldThumbnails == allThumbnails)
  //   oldThumbnails = allThumbnails
  //   if(newThumbnails.length > 1) {
  //     if(tryReadVideoLength(newThumbnails)) {
  //       handleLoaded(newThumbnails, pageRefreshId)
  //       console.log("FINISHED LOADING")
  //       await displaySentiment(newThumbnails)
  //       console.log("SHOULD HAVE CHANGED THUMBNAILS")
  //       handleFilter(newThumbnails, [-1, 1])
      
  //     }
  //   }
  // }, 1000)

  // var intervalId = window.setInterval(async function(){
  //   let allThumbnails = document.querySelectorAll('ytd-rich-item-renderer');
  //   if(allThumbnails.length > 1) {
  //     if(tryReadVideoLength(allThumbnails)) {
  //       clearInterval(intervalId) 
  //       handleLoaded(allThumbnails, pageRefreshId)
  //       console.log("FINISHED LOADING")
  //       await displaySentiment(allThumbnails)
  //       console.log("SHOULD HAVE CHANGED THUMBNAILS")
  //       handleFilter(allThumbnails, [-1, 1])
      
  //     } 
  //   } else {
  //     console.log('no thumbnails yet')
  //   }
    
    
  // }, 3000);
  


}




/////////////////////////////////////////////////////////
///////////////// HELPER FUCTIONS ///////////////////////
/////////////////////////////////////////////////////////
async function displaySentiment(thumbnails) {
  for(var thumbnail of thumbnails) {
    var text = document.createTextNode("This just got added");
    var thumbnailURLSection = thumbnail.querySelectorAll('a.ytd-thumbnail')[0]
    if(thumbnailURLSection) {
      var thumbnailURL = thumbnailURLSection.href
      var youtubeId = String(thumbnailURL).split("=")[1]
      var sentimentScore = await fetch("http://127.0.0.1:5000/getVideoSentiment/" + youtubeId).then(response => {return response.json()})
      var sentimentSection = document.createElement('div')
      sentimentSection.setAttribute("class", "sentimentSection")
      sentimentSection.innerHTML = sentimentScore['sentiment'] + " " + thumbnail.querySelector("#video-title").textContent
      thumbnail.appendChild(sentimentSection);
    }
    
  }
}

function tryReadVideoLength(allThumbnails) {
  try{
      allThumbnails[1].querySelectorAll("ytd-thumbnail-overlay-time-status-renderer")[0].innerText.trim();
      return true
  } catch(err) {
      console.log("No Video Length yet")
      console.log(err)
      return false
  }
}

function addThumbnailsToBackend(thumbnailsDataList) {
  // videoData is a json object
  console.log(thumbnailsDataList)
  fetch("http://127.0.0.1:5000/videosReceiver", {
          method: 'POST',
          headers: {
              'Content-type': 'application/json',
              'Accept': 'application/json'
      },
      // Strigify the payload into JSON:
      body:JSON.stringify(thumbnailsDataList)}).then(res=>{
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

function getDataFromThumbnail(thumbnail, orderOnScreen, pageRefreshId) {
  // This must run once all the elements on the page have loaded. Video length is often slow to load

  // INSTEAD OF ALL THIS.... TRY USING THIS - https://developers.google.com/youtube/v3/docs/videos 

  console.log(thumbnail)
  // videos 
  try {
      let channelName = thumbnail.querySelectorAll("yt-formatted-string.ytd-channel-name")[0].innerText
      let videoLength = thumbnail.querySelectorAll("ytd-thumbnail-overlay-time-status-renderer")[0].innerText.trim();
      let videoLengthInSec = hmsToSecondsOnly(videoLength)
      
      let videoName = thumbnail.querySelector('#video-title').textContent
      let metaDataBlock = thumbnail.querySelectorAll('span.ytd-video-meta-block')
      let videoViews = metaDataBlock[0].innerText
      let videoUploadDay = metaDataBlock[1].innerText
      let url = thumbnail.querySelectorAll('a.ytd-thumbnail')[0].href
      
      // YOU MIGHT BE ABLE TO GET THE TRANSCRIPT FROM THE YT HOMEPAGE!!!!
      // Check this link - https://www.youtube.com/api/timedtext?v=oPwCvSH30WA&caps=asr&exp=xpo&xoaf=7&hl=en&ip=0.0.0.0&ipbits=0&expire=1662039864&sparams=ip%2Cipbits%2Cexpire%2Cv%2Ccaps%2Cexp%2Cxoaf&signature=5DA81FA708F940ED26FD3E35B4692967BA2D1B79.AE92A9E69FCD174BE955CAFF22F698F12329E853&key=yt8&lang=en-US&fmt=json3&xorb=2&xobt=3&xovt=3
      // it got run when I refreshed the YT page 

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

function handleFilter(allThumbnails, sentimentRange) {
  console.log("MADE IT TO FILTER!")
  console.log(sentimentRange)
  console.log(allThumbnails)
  console.log(allThumbnails.length)
  for(var i = 0; i < allThumbnails.length; i++) {
    var thumbnail = allThumbnails[i]
    // hides every second video
    console.log(thumbnail)
    var sentimentSection = thumbnail.querySelectorAll(".sentimentSection")
    console.log(sentimentSection)
    if(sentimentSection && sentimentSection[0]) { // if sentiment section exists, and the backend was able to score it
      var thumbnailSentiment = sentimentSection[0].innerText
      if( thumbnailSentiment < sentimentRange[0] || thumbnailSentiment > sentimentRange[1]) {
        thumbnail.style.display = 'none';
      }
    }
  }
  console.log(allThumbnails.length) // checking to see if we still have all the thumbnails so we can show again if necessary
}

function handleLoaded(allThumbnails, pageRefreshId) {
  let pagesThumbailData = []

  let filterPreferences = {}
  // filterVideos(allVideos, filterPreferences)
  let thumbnailOrder = 0
  for(var i = 0; i < allThumbnails.length; i+=1) {
      // loops through all the videos and adds the data to backend
      let thumbnailData = getDataFromThumbnail(allThumbnails[i], thumbnailOrder, pageRefreshId)
      if(thumbnailData) {
          pagesThumbailData.push(thumbnailData)
          // addVideoToBackend(videoData)
          thumbnailOrder += 1 // there was a video, so increment the order you will see on screen
      }
  }
  // should get all the videos and then pass them to the backend all at once
  addThumbnailsToBackend(pagesThumbailData)

  console.log(pagesThumbailData)

  getDataFromBackend()
}