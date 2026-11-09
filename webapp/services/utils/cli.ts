import { createInterface as nodeCreateInterface } from 'node:readline/promises'

type ReadlineInterface = {
  question: (query: string) => Promise<string>
  close: () => void
}

type ReadlineOptions = {
  input: unknown
  output?: unknown
}

const createInterface = nodeCreateInterface as unknown as (
  options: ReadlineOptions,
) => ReadlineInterface

export const promptForInput = async (question: string): Promise<string | null> => {
  if (process.env.CI === 'true' || !process.stdin.isTTY) {
    return null
  }

  const readline = createInterface({
    input: process.stdin,
    output: process.stdout,
  })

  const answer = (await readline.question(question)).trim()
  readline.close()

  return answer || null
}
