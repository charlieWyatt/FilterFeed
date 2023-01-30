export {}

let userDetails = {}

// // add a listener that sends back the profile details when they are needed
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.greeting === "userInfo") {
        getProfile().then(sendResponse)
        return true
    }
}
);

async function getProfile() {
    const info = await chrome.identity.getProfileUserInfo({'accountStatus': 'ANY'})
    return {userInfo: info}
}