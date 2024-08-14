import { randomBytes } from 'crypto'
import { isArray } from 'lodash-es'
import hash from 'object-hash'
import seedrandom from 'seedrandom'

export const createSeed = () => {
  return randomBytes(16).toString('base64')
}

export type SeedArray = (string | number | object)[]
export type Seed = string | SeedArray

export const rng = ({ seed }: { seed: Seed }) => {
  const seedString = isArray(seed)
    ? seed.map((s) => (typeof s === 'object' ? hash(s) : s)).join('~')
    : seed
  const generator = seedrandom(seedString)
  return generator()
}

export const rngFloat = ({
  seed,
  min = 0,
  max = 1,
}: {
  seed: Seed
  min?: number
  max?: number
}) => {
  const rnd = rng({ seed })
  return rnd * (max - min) + min
}

export const rngInt = ({
  seed,
  min = 0,
  max,
}: {
  seed: Seed
  min?: number
  max: number
}) => {
  const rnd = rng({ seed })
  return Math.floor(rnd * (max - min + 1)) + min
}

export const rngItem = <T>({
  seed,
  items,
}: {
  seed: Seed
  items: readonly T[]
}): T => {
  const idx = rngInt({ seed, max: items.length - 1 })
  return items[idx]!
}

export const rngItems = <T>({
  seed,
  items,
  count,
}: {
  seed: Seed
  items: T[]
  count: number
}): T[] => {
  const itemsCopy = [...items]
  const results: T[] = []
  for (let i = 0; i < count; i++) {
    const idx = rngInt({ seed, max: itemsCopy.length - 1 })
    const item = itemsCopy.splice(idx, 1)[0]!
    results.push(item)
  }
  return results
}

const rngItemWithWeightsRaw = <T>({
  seed,
  items,
}: {
  seed: Seed
  items: { item: T; weight: number }[]
}) => {
  const totalWeight = items.reduce((acc, item) => acc + item.weight, 0)
  const rnd = rng({ seed })
  let weight = 0
  for (const item of items) {
    weight += item.weight
    if (rnd <= weight / totalWeight) {
      return item
    }
  }
  throw new Error('No item found')
}

export const rngItemWithWeights = <T>({
  seed,
  items,
}: {
  seed: Seed
  items: { item: T; weight: number }[]
}): T => {
  return rngItemWithWeightsRaw({ seed, items }).item
}

export const rngItemsWithWeights = <T>({
  seed,
  items,
  count,
}: {
  seed: Seed
  items: { item: T; weight: number }[]
  count: number
}): T[] => {
  let itemsCopy = [...items]
  const results: T[] = []
  for (let i = 0; i < count; i++) {
    const item = rngItemWithWeightsRaw({ seed, items: itemsCopy })
    itemsCopy = itemsCopy.filter((i) => i !== item)
    results.push(item.item)
  }
  return results
}
