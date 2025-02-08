import { php } from '@/lib/php'
import { startTransition, useState } from 'react'

const ExamplePage = () => {
	const [email, setEmail] = useState('')
	const [password, setPassword] = useState('')
	const [response, setResponse] = useState<string | null>(null)

	const signIn = php`
        use Illuminate\Support\Facades\Auth;

        function(string $email, string $password) {
            Auth::attempt(['email' => $email, 'password' => $password]);

            return Auth::user() ?? response()->json(['error' => 'Invalid credentials'], 401);
        }
    `

	return (
		<div>
			<h1>Sign in Test</h1>
			{response && <pre>{response}</pre>}
			<input type="email" value={email} onChange={e => setEmail(e.target.value)} />
			<input type="password" value={password} onChange={e => setPassword(e.target.value)} />
			<button
				type="button"
				onClick={() =>
					startTransition(async () => {
						const response = await signIn(email, password)
						setResponse(JSON.stringify(response))
					})
				}
			>
				Log In
			</button>
		</div>
	)
}

export default ExamplePage
