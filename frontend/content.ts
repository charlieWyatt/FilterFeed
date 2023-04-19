import type { PlasmoContentScript } from "plasmo"
import { v4 } from "uuid"

export const config: PlasmoContentScript = {
  matches: ["*://*.youtube.com/*"]
}

let semanticSearchFilter = null // this is changed in the addListener function. Should also send a message back to the search bar so that it maintains state even if it is closed and reopened
let semanticFilterThreshold = 0.5 // this could also be a dynamic value set by the user

window.addEventListener("load", () => {
  console.log(`content script loaded with UUID: ${v4()}`)
  document.body.style.background = "pink"
  onLoad()
})

const onLoad = () => {
  let pageRefreshId = v4()

  
  // this is a dumb way to do this, but I can't think of a better solution at the present time
  // every second, checks to see if the video length has loaded in yet because it's the last
  // thing to load in
  // should just change this into an async function...
  // One way around this, is just to hand all the urls over to the backend, and then let the backend 
  // go to each of the urls and scrape all the data. The urls appear first, and the backend has to 
  // go to the video anyway to get the transcript data
  var intervalId = window.setInterval(function(){
    let allThumbnails = document.querySelectorAll('ytd-rich-item-renderer');
    if(allThumbnails.length > 1) {
      if(tryReadVideoLength(allThumbnails)) {
        clearInterval(intervalId) 
        let allTranscripts = getTranscripts(allThumbnails)

        chrome.runtime.onMessage.addListener((msg, sender, response) => {
          console.log("received a message!", msg)
          if (msg.command == "sentimentFilterRange"){
            semanticSearchFilter = msg.semanticSearchFilter
            console.log(semanticSearchFilter) 
            handleFilter(allThumbnails, allTranscripts, semanticSearchFilter)
          }
        })
      } 

    } else {
      console.log('no thumbnails yet')
    }
    
    
  }, 3000);

}




/////////////////////////////////////////////////////////
///////////////// HELPER FUCTIONS ///////////////////////
/////////////////////////////////////////////////////////
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

function semanticScore(transcript) {
  // this is just a test
  return 0.5
}

function handleFilter(allThumbnails, allTranscripts, SemanticSearchFilter) {
  console.log("MADE IT TO FILTER!")
  console.log(SemanticSearchFilter)
  if (SemanticSearchFilter == null) {
    return
  }

  for(var i = 0; i < allThumbnails.length; i++) {
    var thumbnail = allThumbnails[i]
    var transcript = allTranscripts[i]
    if(semanticScore(transcript) < semanticFilterThreshold) {
      thumbnail.style.transition = "0.5s"
      thumbnail.style.opacity = "0"
    } else {
        // opacity is used here with a transition otherwise it becomes too "jittery"
        // I am definitely oversetting it though, should just define all the styles at the start
        thumbnail.style.transition = "0.5s"
        thumbnail.style.opacity = "1"
    }
  }
  console.log(allThumbnails.length) // checking to see if we still have all the thumbnails so we can show again if necessary
}

function getTranscripts(allThumbnails) {
  let transcripts = []
  return transcripts
}