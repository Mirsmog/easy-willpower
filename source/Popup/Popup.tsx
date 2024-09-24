import React, { useEffect, useState } from 'react'
import { browser } from 'webextension-polyfill-ts'

const Popup: React.FC = () => {
	const [blockedSites, setBlockedSites] = useState<string[]>([])
	const [newSite, setNewSite] = useState('')

	useEffect(() => {
		browser.storage.local.get(['blockedSites']).then(result => {
			setBlockedSites(result.blockedSites || [])
		})
	}, [])

	const addSite = () => {
		if (newSite && !blockedSites.includes(newSite)) {
			const updatedSites = [...blockedSites, newSite]
			setBlockedSites(updatedSites)
			browser.storage.local.set({ blockedSites: updatedSites })
			setNewSite('')
		}
	}

	const removeSite = (site: string) => {
		const updatedSites = blockedSites.filter(s => s !== site)
		setBlockedSites(updatedSites)
		browser.storage.local.set({ blockedSites: updatedSites })
	}

	return (
		<div>
			<h1>Blocked Sites</h1>
			<input
				type='text'
				value={newSite}
				onChange={e => setNewSite(e.target.value)}
				placeholder='Add a site to block'
			/>
			<button onClick={addSite}>Add</button>
			<ul>
				{blockedSites.map(site => (
					<li key={site}>
						{site}
						<button onClick={() => removeSite(site)}>Remove</button>
					</li>
				))}
			</ul>
		</div>
	)
}

export default Popup
