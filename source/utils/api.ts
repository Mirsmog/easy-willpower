import axios from 'axios'
import config from '../../config'

const userId = config.USER_ID
const apiKey = config.API_KEY

export const getWakaTimeStats = async () => {
	if (!apiKey || !userId) throw Error('API_KEY or USER_ID is not defiend')

	const currentDate = new Date().getDate()

	const url = `https://wakatime.com/api/v1/users/${userId}/durations?date=${currentDate}`

	try {
		const { data } = await axios.get(url, {
			headers: {
				Authorization: `Basic ${apiKey}`
			}
		})
		const stat = data.data

		const totalDurationSeconds = stat.reduce((acc: number, item: { duration: number }) => acc + item.duration, 0)
		const newBalance = Math.floor(totalDurationSeconds / 60)

		return { newBalance }
	} catch (error) {
		console.error('Error fetching WakaTime data', error)
		return { newBalance: 0 }
	}
}
