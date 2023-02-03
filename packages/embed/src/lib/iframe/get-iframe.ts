import { IFRAME_ID } from "./constants"

export const getIframe = () => document.getElementById(IFRAME_ID) as HTMLIFrameElement | undefined