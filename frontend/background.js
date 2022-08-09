
chrome.action.onClicked.addListener(buttonClicked); // runs buttonClicked function when the button is clicked

function buttonClicked(tab) {
    let msg = {
        txt: "hello"
    }

    chrome.tabs.sendMessage(tab.id, msg) // This only works if you are on a url which has a content page and you have refreshed

    // first aim should just be to filter half the videos when the button gets clicked
    // and then if one of youtube's filters are clicked, the original filtered videos should be the ones which remain hidden
}