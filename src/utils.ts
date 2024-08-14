import { promises as fs } from 'fs'
import { ExpiryMonth } from './types/app/entities'

function containsNumber(str: string) {
  return /\d/.test(str)
}

function capitalizeFirstLetter(str: string) {
  return str.charAt(0).toUpperCase() + str.slice(1)
}

function areEqualSets<T>(set1: Set<T>, set2: Set<T>): boolean {
  return (
    // short circuit for early return
    set1.size === set2.size && [...set1].every((val) => set2.has(val))
  )
}

function aNotInB<T>(set1: Set<T>, set2: Set<T>): T[] {
  const a = Array.from(set1)
  const b = Array.from(set2)

  const diff = a.filter((x) => !b.includes(x))

  return diff
}

async function withRetry<T>(
  func: () => Promise<T>,
  maxAttempts: number = 3,
  intervalMs: number = 3_000,
): Promise<T> {
  let attempts = 0

  while (attempts < maxAttempts) {
    try {
      return await func()
    } catch (error) {
      attempts++
      if (attempts < maxAttempts) {
        await sleep(intervalMs)
      }
    }
  }
  throw new Error('Max retry attempts reached')
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

function throttle(
  func: (...args: any[]) => void,
  limit: number,
): (...args: any[]) => void {
  let inThrottle: boolean
  return function (...args: any[]) {
    if (!inThrottle) {
      func(...args)
      inThrottle = true
      setTimeout(() => (inThrottle = false), limit)
    }
  }
}

function Throttle(milliseconds: number) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor,
  ) {
    const originalMethod = descriptor.value
    let lastExecutionTime = 0

    descriptor.value = function (...args: any[]) {
      const now = Date.now()
      if (now - lastExecutionTime >= milliseconds) {
        lastExecutionTime = now
        return originalMethod.apply(this, args)
      }
    }

    return descriptor
  }
}

const writeJsonToFile = async (
  filePath: string,
  data: any,
): Promise<void> => {
  try {
    const jsonData = JSON.stringify(data, null, 2)
    await fs.writeFile(filePath, jsonData, 'utf8')
  } catch(error) {
    console.log(error)
    throw error
  }
}

const readJsonFromFile = async (filePath: string): Promise<any> => {
  try {
    const data = await fs.readFile(filePath, 'utf8')
    return JSON.parse(data)
  } catch(error) {
    console.log(error)
    throw error
  }
}

const fileExists = async (filePath: string): Promise<boolean> => {
  try {
    await fs.access(filePath)
    return true
  } catch {
    return false
  }
}

const getMonthAbbreviation = (monthIndex: number): ExpiryMonth => {
  const date = new Date(2000, monthIndex, 1)
  const options = { month: 'short' } as const
  return date.toLocaleString('en-US', options).toUpperCase() as ExpiryMonth
}

async function sleep(durationMs: number) {
  return new Promise((resolve) => setTimeout(resolve, durationMs))
}

function doNothing() {
  return
}

export {
  containsNumber,
  capitalizeFirstLetter,
  areEqualSets,
  aNotInB,
  withRetry,
  clamp,
  throttle,
  Throttle,
  doNothing,
  writeJsonToFile,
  getMonthAbbreviation,
  readJsonFromFile,
  fileExists
}
