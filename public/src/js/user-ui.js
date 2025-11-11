// user-ui.js — Replace placeholder name/avatar with logged-in user's data when available
document.addEventListener('DOMContentLoaded', () => {
	try {
		const stored = sessionStorage.getItem('currentUser') || localStorage.getItem('currentUser');
		if (!stored) return; // Stay in demo mode (keep "Farmer John")

		const user = JSON.parse(stored);
		const displayName = getDisplayName(user);
		if (!displayName) return;

		// Update navbar user-name(s)
		document.querySelectorAll('.user-name').forEach(el => {
			el.textContent = displayName;
		});

		// Update avatar initials if possible (only user profile avatars)
		const initials = getInitials(displayName);
		document.querySelectorAll('.avatar').forEach(el => {
			if (el && initials) el.textContent = initials;
		});

		// Update greeting headers if they contain a salutation with a placeholder
		document.querySelectorAll('.greeting h1').forEach(h1 => {
			if (!h1) return;
			const text = h1.textContent || '';
			if (text.startsWith('Hello,')) {
				h1.textContent = `Hello, ${displayName}! 👋`;
			} else if (text.startsWith('Good Morning,')) {
				h1.textContent = `Good Morning, ${displayName}`;
			}
		});
	} catch (e) {
		console.warn('user-ui: failed to update user UI', e);
	}
});

function getDisplayName(user) {
	if (!user || typeof user !== 'object') return '';
	return (
		user.name ||
		user.full_name ||
		user.fullName ||
		(user.email ? formatNameFromEmail(user.email) : '')
	);
}

function formatNameFromEmail(email) {
	const local = (email || '').split('@')[0].replace(/\.+/g, ' ').replace(/[_-]+/g, ' ').trim();
	return local
		.split(' ')
		.filter(Boolean)
		.map(s => s.charAt(0).toUpperCase() + s.slice(1))
		.join(' ');
}

function getInitials(name) {
	if (!name) return '';
	const parts = name.trim().split(/\s+/).slice(0, 2);
	return parts.map(p => p.charAt(0).toUpperCase()).join('');
}


