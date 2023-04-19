import type { PlasmoContentScript, PlasmoGetInlineAnchorList, PlasmoRender  } from "plasmo"
import { createRoot } from "react-dom/client"
import { v4 } from "uuid"
import { createElement, useEffect, useState } from "react"
import { tabClasses } from "@mui/material"


export const config: PlasmoContentScript = {
  matches: ["*://*.youtube.com/*"]
}



window.addEventListener("load", () => {
  console.log(`content script loaded with UUID: ${v4()}`)
  document.body.style.background = "pink"
  onLoad()
})



let sentimentFilterRange = [-1, 1]

const onLoad = async () => {
  // NOTE THIS WONT TRIGGER IF THE YOUTUBE SITE HAS ALREADY BEEN VISITED IN THE SAME SESSION
  // I reckon change to this link - https://stackoverflow.com/questions/70578698/why-is-javascript-prompt-only-showing-up-when-youtube-is-refreshed

  // Get the users information
  const response = await chrome.runtime.sendMessage({greeting: "userInfo"});
  const userEmail = response.userInfo.email
  const userId = response.userInfo.id



  new MutationObserver(function(mutations) {
    // since the youtube page is an SPA (see more here https://en.wikipedia.org/wiki/Single-page_application#:~:text=A%20single%2Dpage%20application%20(SPA,browser%20loading%20entire%20new%20pages.)
    // this is needed to be called so that each time the user changes to a new link, all the functions are recalled again
    clearThumbnailSentiments() // if there are any leftover sentiments, this will clear them
    let currentUrl = window.location.toString()
    console.log(currentUrl)
    if(currentUrl == "https://www.youtube.com/") {
      console.log("ON THE HOMEPAGE")
      // IF ON THE HOMEPAGE

      let pageRefreshId = v4()
      let allThumbnails = null
      // OLD ONE I THINK
      var intervalId = window.setInterval(async function(){
        allThumbnails = document.querySelectorAll('ytd-rich-item-renderer');
        if(allThumbnails.length > 1) {
          if(tryReadVideoLength(allThumbnails)) {
            clearInterval(intervalId) 
            handleLoaded(allThumbnails, pageRefreshId, userId, userEmail)
            await displaySentiment(allThumbnails)
          } 
        } else {
          console.log('no thumbnails yet')
        }
        
        
      }, 3000);

      // listens for when the popup filter is used
      chrome.runtime.onMessage.addListener((msg, sender, response) => {
        console.log("received a message!", msg)
        if (msg.command == "sentimentFilterRange"){
          sentimentFilterRange = msg.range
          console.log(sentimentFilterRange) 
          handleFilter(allThumbnails, sentimentFilterRange)
        }
      })
    } else if (currentUrl.includes("https://www.youtube.com/watch?v=")) {
      // if on a specific video!
      // add the watched video to the database
      console.log("ON A SPECIFIC VIDEO")

      // NOTE THIS WONT TRIGGER IF THE YOUTUBE SITE HAS ALREADY BEEN VISITED IN THE SAME SESSION
      
      
      let watchedInfo = {url: currentUrl, userId: userId} // TODO : add the video length in here
      fetch("http://127.0.0.1:5000/watchedVideoReceiver", {
            method: 'POST',
            headers: {
                'Content-type': 'application/json',
                'Accept': 'application/json'
        },
        // Strigify the payload into JSON:
        body:JSON.stringify(watchedInfo)}).then(res=>{
                if(res.ok){
                    return res.json()
                }else{
                    alert("something is wrong")
                }
            }).then(jsonResponse=>{
                
                // Log the response data in the console
                console.log(jsonResponse)
            }).catch((err) => console.error(err));
    }

  }).observe(
    // don't really know what these lines do specifically, but they help overcome the SPA problem
    document.querySelector('title'),
    { subtree: true, characterData: true, childList: true }
  );
  
  

}

// all the resources I could try -
// https://docs.plasmo.com/framework/content-scripts-ui/life-cycle
// https://github.com/PlasmoHQ/examples/blob/main/with-content-scripts-ui/contents/plasmo-root-container.tsx
// https://github.com/PlasmoHQ/examples/blob/main/with-content-scripts-ui/contents/plasmo-inline.tsx
// https://github.com/PlasmoHQ/plasmo/issues/198

// // this works for a single root container, but I want multiple root containers
// export const getRootContainer = () =>
//   new Promise((resolve) => {
//     console.log("IT WORKED")
//     const checkInterval = setInterval(() => {
//       const rootContainer = document.querySelectorAll('ytd-rich-item-renderer')[0]
//       console.log(rootContainer)
//       if (rootContainer) {
//         clearInterval(checkInterval)
//         resolve(rootContainer)
//       }
//     }, 137)
//   })

// const PlasmoOverlay = () => {
//   return (
//     <span
//       style={{
//         background: "yellow",
//         padding: 12
//       }}>
//       HELLO WORLD ROOT CONTAINER
//     </span>
//   )
// }
// export default PlasmoOverlay

// export const render = async ({ createRootContainer }) => {
//   const rootContainer = await createRootContainer()
//   console.log("MADE IT HERE THO")
//   const root = createRoot(rootContainer[0])
//   console.log("IT STILL WOKRS")
//   console.log(root)
//   root.render(<PlasmoOverlay />)
// }


// export const getInlineAnchorList: PlasmoGetInlineAnchorList = () =>
//   console.log("made it here tho")
//   document.querySelectorAll('ytd-rich-item-renderer')


/////////////////////////////////////////////////////////
///////////////// HELPER FUCTIONS ///////////////////////
/////////////////////////////////////////////////////////
function clearThumbnailSentiments() {
  let sentimentSections = document.getElementsByClassName("sentimentSection")
  let sentimentLabels = document.getElementsByClassName("sentimentLabel")
  while(sentimentSections.length > 0){
    sentimentSections[0].parentNode.removeChild(sentimentSections[0]);
  }
  while(sentimentLabels.length > 0){
    sentimentLabels[0].parentNode.removeChild(sentimentLabels[0]);
  }

}

async function displaySentiment(thumbnails) {
  // This needs to be cleared after each 
  for(var thumbnail of thumbnails) {
    var text = document.createTextNode("This just got added");
    var thumbnailURLSection = thumbnail.querySelectorAll('a.ytd-thumbnail')[0]
    if(thumbnailURLSection) {
      var thumbnailURL = thumbnailURLSection.href
      var youtubeId = String(thumbnailURL).split("=")[1]
      var sentimentScore = await fetch("http://127.0.0.1:5000/getVideoSentiment/" + youtubeId).then(response => {return response.json()})
      
      // a crude representation of the sentiment of each video
      // instead of doing the below, I could shrink the thumbnail and add bars on the top which display the positivity and the political bias
      var sentimentSection = document.createElement('div')
      sentimentSection.setAttribute("class", "sentimentSection")
      sentimentSection.innerHTML = sentimentScore['sentiment']
      thumbnail.appendChild(sentimentSection);

      // debugging to help me keep track of what sentiment belongs to which video
      var sentimentLabel = document.createElement('div')
      sentimentLabel.setAttribute("class", "sentimentLabel")
      sentimentLabel.innerHTML = thumbnail.querySelector("#video-title").textContent
      thumbnail.appendChild(sentimentLabel)

      // // testing making a react element (this is broken)
      // var newElement = createElement('h1', {className: 'sentiment'}, 'TESTING')
      // thumbnail.appendChild(newElement)

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

function getDataFromThumbnail(thumbnail, orderOnScreen, pageRefreshId, userId, userEmail) {
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
          "userId": userId,
          "userEmail": userEmail,
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
      // the above sometimes breaks when the video is an ad or something
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
  for(var i = 0; i < allThumbnails.length; i++) {
    var thumbnail = allThumbnails[i]
    var sentimentSection = thumbnail.querySelectorAll(".sentimentSection")
    console.log(sentimentSection)
    if(sentimentSection && sentimentSection[0] && sentimentSection[0].innerText != null) { // if sentiment section exists, and the backend was able to score it
      var thumbnailSentiment = Number(sentimentSection[0].innerText)
      console.log(thumbnailSentiment)
      console.log(sentimentRange)
      if( thumbnailSentiment > sentimentRange[0] && thumbnailSentiment < sentimentRange[1]) {
        // opacity is used here with a transition otherwise it becomes too "jittery"
        // I am definitely oversetting it though, should just define all the styles at the start
        thumbnail.style.transition = "0.5s"
        thumbnail.style.opacity = "1"
      } else {
        thumbnail.style.transition = "0.5s"
        thumbnail.style.opacity = "0"
      }
    }
  }
  console.log(allThumbnails.length) // checking to see if we still have all the thumbnails so we can show again if necessary
}

function handleLoaded(allThumbnails, pageRefreshId, userId = null, userEmail = null) {
  let pagesThumbailData = []

  let filterPreferences = {}
  // filterVideos(allVideos, filterPreferences)
  let thumbnailOrder = 0
  for(var i = 0; i < allThumbnails.length; i+=1) {
      // loops through all the videos and adds the data to backend
      let thumbnailData = getDataFromThumbnail(allThumbnails[i], thumbnailOrder, pageRefreshId, userId, userEmail)
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