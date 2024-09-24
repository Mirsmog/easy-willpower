import axios from 'axios'
import 'dotenv/config'

const userId = process.env.USER_ID
const apiKey = process.env.API_KEY

export const getWakaTimeStats = async () => {
	if (!apiKey || !userId) throw Error('API_KEY or USER_ID is not defiend')

	const currentDate = new Date().toISOString().split('T')[0]

	const url = `https://wakatime.com/api/v1/users/${userId}/durations?date=${currentDate}`

	try {
		const { data } = await axios.get(url, {
			headers: {
				Authorization: `Basic ${apiKey}`
			}
		})
		const stat = data.data

		const totalDurationSeconds = stat.reduce((acc: number, item: { duration: number }) => acc + item.duration, 0)
		const totalMinutes = Math.floor(totalDurationSeconds / 60)

		return { totalMinutes }
	} catch (error) {
		console.error('Error fetching WakaTime data', error)
		return { totalMinutes: 0 }
	}
}
