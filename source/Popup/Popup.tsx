import React, { useEffect, useState } from 'react'
import { browser } from 'webextension-polyfill-ts'

const Popup: React.FC = () => {
	const [accessLimitedSites, setAccessLimitedSites] = useState<string[]>([])
	const [newSite, setNewSite] = useState('')

	useEffect(() => {
		browser.storage.local.get(['accessLimitedSites']).then(result => {
			setAccessLimitedSites(result.accessLimitedSites || [])
		})
	}, [])

	const addSite = () => {
		if (newSite && !accessLimitedSites.includes(newSite)) {
			const updatedSites = [...accessLimitedSites, newSite]
			setAccessLimitedSites(updatedSites)
			browser.storage.local.set({ accessLimitedSites: updatedSites })
			setNewSite('')
		}
	}

	const removeSite = (site: string) => {
		const updatedSites = accessLimitedSites.filter(s => s !== site)
		setAccessLimitedSites(updatedSites)
		browser.storage.local.set({ accessLimitedSites: updatedSites })
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
				{accessLimitedSites.map(site => (
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
