import type { PlasmoContentScript } from "plasmo"
import { uuid } from "uuidv4"

export const config: PlasmoContentScript = {
  matches: ["*://*.youtube.com/*"]
}

window.addEventListener("load", () => {
  console.log(`content script loaded with UUID: ${uuid()}`)
  document.body.style.background = "pink"
  onLoad()
})

const onLoad = () => {
  // @charliewyatt put your onLoad code here.
}
