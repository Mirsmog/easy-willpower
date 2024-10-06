import { getLocalStorage, setLocalStorage } from '.'

export enum Rarity {
	Casual = 'casual',
	Rare = 'rare',
	Epic = 'epic',
	Legendary = 'legendary',
	Mythical = 'mythical'
}

interface IRewardEffect {
	type: 'fixed' | 'percentage' | 'multiply'
	value: number
}

export interface IHistoryReward {
	name: Rarity
	effect: string
	balanceIncrease: number
	newBalance: number
}

interface IReward {
	rarity: Rarity
	effect: IRewardEffect[]
	chance: number
}

const rewards: IReward[] = [
	{
		rarity: Rarity.Casual,
		effect: [
			{ type: 'fixed', value: 5 },
			{ type: 'percentage', value: 3 }
		],
		chance: 0.7
	},
	{
		rarity: Rarity.Rare,
		effect: [
			{ type: 'fixed', value: 15 },
			{ type: 'percentage', value: 10 }
		],
		chance: 0.5
	},
	{
		rarity: Rarity.Epic,
		effect: [
			{ type: 'fixed', value: 30 },
			{ type: 'percentage', value: 15 }
		],
		chance: 0.3
	},
	{
		rarity: Rarity.Legendary,
		effect: [
			{ type: 'fixed', value: 60 },
			{ type: 'percentage', value: 25 },
			{ type: 'multiply', value: 1.5 }
		],
		chance: 0.2
	},
	{
		rarity: Rarity.Mythical,
		effect: [
			{ type: 'fixed', value: 120 },
			{ type: 'percentage', value: 50 },
			{ type: 'multiply', value: 2 }
		],
		chance: 0.02
	}
]

function getReward(): IReward {
	const random = Math.random()
	let cumChance = 0
	for (const reward of rewards) {
		cumChance += reward.chance
		if (random <= cumChance) return reward
	}
	return rewards[0]
}

async function setHistory({ name, effect, balanceIncrease, newBalance }: IHistoryReward) {
	const { rewardsHistory = [] } = await getLocalStorage(['rewardsHistory'])
	const formatedReward: IHistoryReward = {
		name,
		effect,
		balanceIncrease,
		newBalance
	}
	rewardsHistory.push(formatedReward)
	await setLocalStorage({ rewardsHistory })
}

function applyEffect(balance: number, effect: IRewardEffect): number {
	switch (effect.type) {
		case 'fixed':
			return balance + effect.value
		case 'percentage':
			return balance + (balance * effect.value) / 100
		case 'multiply':
			return balance * effect.value
	}
}

export async function applyReward(balance: number) {
	const reward = getReward()
	const effect = reward.effect[Math.floor(Math.random() * reward.effect.length)]
	const newBalance = Math.round(applyEffect(balance, effect))
	await setHistory({
		name: reward.rarity,
		effect: effect.type,
		balanceIncrease: newBalance - balance,
		newBalance
	})
	return newBalance
}
