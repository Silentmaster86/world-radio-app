export function register() {
	if (process.env.NODE_ENV === 'production' && 'serviceWorker' in navigator) {
		window.addEventListener('load', () => {
			navigator.serviceWorker
				.register('/service-worker.js')
				.then((registration) => {
					console.log('[SW] Registered:', registration);
				})
				.catch((error) => {
					console.error('[SW] Registration failed:', error);
				});
		});
	}
}

export function unregister() {
	if ('serviceWorker' in navigator) {
		navigator.serviceWorker.getRegistrations().then((registrations) => {
			registrations.forEach((registration) => registration.unregister());
		});
	}
}
