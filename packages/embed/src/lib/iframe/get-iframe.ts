import { IFRAME_ID } from "./constants"


export interface NFIDIframeElement extends HTMLIFrameElement {
  contentWindow: Window
}

export const getIframe = () => {
  const nfidIframe = document.getElementById(IFRAME_ID) as HTMLIFrameElement | undefined

  if (!nfidIframe || !nfidIframe.contentWindow) {
    throw new Error("nfid iframe not initialized")
  }

  return nfidIframe as NFIDIframeElement

}
