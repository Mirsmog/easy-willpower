import { browser } from 'webextension-polyfill-ts'

browser.webRequest.onBeforeRequest.addListener(
	details => {
		return new Promise(resolve => {
			browser.storage.local.get(['blockedSites']).then(result => {
				const blockedSites = result.blockedSites || []
				const redirectUrl = 'https://some.com'
				for (const site of blockedSites) {
					if (details.url.includes(site)) {
						console.log(site)
						resolve({ redirectUrl })
						return
					}
				}
				resolve({})
			})
		})
	},
	{ urls: ['<all_urls>'] },
	['blocking']
)
