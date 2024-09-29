import { WebNavigation } from 'webextension-polyfill'
import { browser } from 'webextension-polyfill-ts'
import { getLocalStorage } from '.'

async function shouldBlock(details: WebNavigation.OnBeforeNavigateDetailsType) {
	const { lastBalance } = await getLocalStorage(['lastBalance'])
	const { accessLimitedSites = [] } = await getLocalStorage(['accessLimitedSites'])
	if (!details.url.includes('blocked.html')) {
		if (lastBalance <= 0) {
			for (const site of accessLimitedSites) {
				if (details.url.includes(site) && details.frameId == 0) {
					const blockedPageUrl = browser.runtime.getURL(`blocked.html?refer=${encodeURIComponent(details.url)}`)
					browser.tabs.update(details.tabId, { url: blockedPageUrl })
					return
				}
			}
		}
	}
}

export function handleNavigation() {
	browser.webNavigation.onBeforeNavigate.addListener(
		async details => {
			shouldBlock(details)
		},
		{ url: [{ urlMatches: '.*' }] }
	)
}
