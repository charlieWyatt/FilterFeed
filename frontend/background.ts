export {}

let userDetails = {}

// // add a listener that sends back the profile details when they are needed
// // THIS IS HOW I GET MY USERS EMAIL / ID
chrome.runtime.onMessage.addListener(
    async function(request, sender, sendResponse) {
        if (request.greeting === "userInfo") {
            console.log("made it here")
            const info = await chrome.identity.getProfileUserInfo({'accountStatus': 'ANY'})
            sendResponse({UserInfo: "info"})
            console.log(info)
            // sendResponse({UserInfo: "info"})
            return true
            
            
            // sendResponse({UserInfo: JSON.stringify(info)})
            // sendResponse({UserInfo: JSON.stringify(info)})
        }
    }
);

// /////////////////// FUNCTIONS ////////////////////
async function saveUserAuth() {
    let answer = await chrome.identity.getProfileUserInfo({'accountStatus': 'ANY'}, function(info) {
        console.log(info)
        console.log(userDetails)
        userDetails = info
        console.log(userDetails)
        return 6
    })
    return answer
}