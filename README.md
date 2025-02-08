# PHP Server Actions

> A proof-of-concept for defining backend logic inside React components

```tsx
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
					startTransition(
						async () => await signIn(email, password).then(res => setResponse(JSON.stringify(res)))
					)
				}
			>
				Log In
			</button>
		</div>
	)
}

export default ExamplePage
```

This pretty much works. It's super hacky, but it works. Once [Aaron releases Fusion](https://x.com/aarondfrancis/status/1886768725509976146) I'll see if it makes sense to turn this into a package or just contribute it to Fusion.

If for whatever reason you want to run this locally, I also made [a VSCode extension to properly highlight PHP-in-React](https://marketplace.visualstudio.com/items?itemName=m1guelpf.vscode-inline-php) (still no intellisense tho).

## How does this work, exactly?

- You write PHP functions in your React components.
- A Vite plugin finds all those functions, extracts them to a real PHP file, and replaces the code in your React component with a `fetch()` that runs your PHP code.
- Some clever code _borrowed_ from the Laravel core also makes sure you can inject dependencies into your PHP functions, similar to how Controllers work.

## Interesting files

- [`./actions-plugin.ts`](actions-plugin.ts) is the Vite plugin that makes everything work.
- [`./resources/js/Pages/Test.tsx`](resources/js/Pages/Test.tsx) has the same code shown in the example above.
- [`./app/Actions/Actions.php`](app/Actions/Actions.php) is the controller that routes requests to the extracted PHP functions.
- [`./app/Actions/ServerAction.php`](app/Actions/ServerAction.php) contains the logic that calls your React-defined PHP functions.
- [`./resources/js/lib/php.ts`](resources/js/lib/php.ts) holds the (surprisingly simple) code for the `php` tagged template in React & the code that calls the function.
