import { browser } from 'webextension-polyfill-ts'

export { getWakaTimeStats } from './api'
export { showTimeLeftAlert } from './alert'

export async function setLocalStorage(keys: { [s: string]: any }) {
	await browser.storage.local.set(keys)
}

export async function getLocalStorage(keys: string[]) {
	return await browser.storage.local.get(keys)
}
