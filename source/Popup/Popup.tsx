import * as React from 'react'

import { useState } from 'react'

const Popup = () => {
	const [url, setUrl] = useState('')
	const [blockedSites, setBlockedSites] = useState<string[]>([])

	React.useEffect(() => {
		chrome.storage.local.get(['blockedSites'], result => {
			setBlockedSites(result.blockedSites || [])
		})
	}, [])

	const addSite = () => {
		const updatedSites = [...blockedSites, url]
		chrome.storage.local.set({ blockedSites: updatedSites })
		setBlockedSites(updatedSites)
		setUrl('')
	}

	const removeSite = (site: string) => {
		const updatedSites = blockedSites.filter(s => s !== site)
		chrome.storage.local.set({ blockedSites: updatedSites })
		setBlockedSites(updatedSites)
	}

	return (
		<div style={{ padding: '10px', fontFamily: 'Arial' }}>
			<h3>Block Sites</h3>
			<input
				type='text'
				value={url}
				onChange={e => setUrl(e.target.value)}
				placeholder='Enter site URL'
				style={{ marginRight: '10px' }}
			/>
			<button onClick={addSite}>Add</button>
			<ul>
				{blockedSites.map(site => (
					<li key={site}>
						{site}
						<button
							onClick={() => removeSite(site)}
							style={{ marginLeft: '10px' }}
						>
							Remove
						</button>
					</li>
				))}
			</ul>
		</div>
	)
}

export default Popup
