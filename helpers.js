import Confirm from 'prompt-confirm'

export async function confirm(message) {
    const prompt = new Confirm(message)
    return prompt.run()
}
