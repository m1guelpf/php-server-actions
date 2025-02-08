type PHPAction = (...args: any[]) => Promise<unknown>

export const php = (code: TemplateStringsArray): PHPAction => {
	return (...args: any[]): Promise<unknown> => {
		return new Promise(() => {})
	}
}

export const __server_action = (id: string): PHPAction => {
	return (...args: any[]): Promise<unknown> => {
		return fetch(`/api/__action/${id}`, {
			method: 'POST',
			credentials: 'include',
			body: JSON.stringify({ args }),
			headers: { 'Content-Type': 'application/json' },
		}).then(res => res.json())
	}
}
