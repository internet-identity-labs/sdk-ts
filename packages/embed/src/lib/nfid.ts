import { fromEvent, BehaviorSubject } from "rxjs"
import { first } from "rxjs/operators"
import { NFIDInpageProvider } from "./inpage-provider"
import { buildIframe } from "./iframe/make-iframe"
import { showIframe } from "./iframe/mount-iframe"

interface NFIDObservable {
  ethereum?: NFIDInpageProvider
  provider?: NFIDInpageProvider
  nfidIframe?: HTMLIFrameElement
  isAuthenticated: boolean
  isIframeInstantiated: boolean
}

const nfidBehaviorSubject$ = new BehaviorSubject<NFIDObservable>({
  isAuthenticated: false,
  isIframeInstantiated: false,
})

nfidBehaviorSubject$.subscribe({
  next(value) {
    console.debug("nfidBehavioorSubject: new state", { value })
  },
  error(err) {
    console.error("nfidBehavioorSubject: something went wrong:", { err })
  },
  complete() {
    console.debug("nfidBehavioorSubject done")
  },
})

export interface NFID extends NFIDObservable {
  provider?: NFIDInpageProvider
  ethereum?: NFIDInpageProvider
  init(): Promise<boolean>
  disconnect(): Promise<void>
}

export const nfid = {
  get provider() {
    return nfidBehaviorSubject$.value.provider
  },
  get ethereum() {
    return nfidBehaviorSubject$.value.ethereum
  },
  get isAuthenticated() {
    return nfidBehaviorSubject$.value.isAuthenticated
  },
  get isIframeInstantiated() {
    return nfidBehaviorSubject$.value.isIframeInstantiated
  },

  async init() {
    const nfidInpageProvider = new NFIDInpageProvider()
    return new Promise<boolean>((resolve) => {
      const nfidIframe = buildIframe(() => {
        nfidIframe.style.display = "block"
        nfidBehaviorSubject$.next({
          ...nfidBehaviorSubject$.value,
          isIframeInstantiated: true,
          nfidIframe,
          provider: nfidInpageProvider,
          ethereum: nfidInpageProvider,
        })
        resolve(true)
      })
    })
  },

  async login() {
    if (!nfidBehaviorSubject$.value.nfidIframe) throw new Error("NFID iframe not instantiated")
    showIframe()
    return new Promise<boolean>((resolve) => {
      const source = fromEvent(window, "message")
      const events = source.pipe(
        first((event: any) => event.data && event.data.type === "nfid_authenticated"),
      )
      events.subscribe(() => {
        nfidBehaviorSubject$.next({
          ...nfidBehaviorSubject$.value,
          isAuthenticated: true,
        })
        resolve(true)
      })
    })
  },

  async disconnect() {
    console.debug("NFID.disconnect")
  },
}
