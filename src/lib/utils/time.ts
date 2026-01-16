// Format milliseconds to HH:MM:SS
export function formatTime(ms: number): string {
	const totalSeconds = Math.floor(ms / 1000);
	const hours = Math.floor(totalSeconds / 3600);
	const minutes = Math.floor((totalSeconds % 3600) / 60);
	const seconds = totalSeconds % 60;

	return [hours, minutes, seconds].map((v) => v.toString().padStart(2, '0')).join(':');
}

// Format milliseconds to readable string (e.g., "2h 30m")
export function formatTimeShort(ms: number): string {
	const totalSeconds = Math.floor(ms / 1000);
	const hours = Math.floor(totalSeconds / 3600);
	const minutes = Math.floor((totalSeconds % 3600) / 60);

	if (hours > 0) {
		return `${hours}h ${minutes}m`;
	}
	return `${minutes}m`;
}

// Format timestamp to HH:MM (12-hour format)
export function formatTimeOfDay(timestamp: number): string {
	const date = new Date(timestamp);
	let hours = date.getHours();
	const minutes = date.getMinutes();
	const ampm = hours >= 12 ? 'PM' : 'AM';
	hours = hours % 12;
	hours = hours ? hours : 12; // 0 should be 12
	return `${hours}:${minutes.toString().padStart(2, '0')} ${ampm}`;
}

// Get today's date string in YYYY-MM-DD format
export function getTodayDateString(): string {
	const now = new Date();
	const year = now.getFullYear();
	const month = String(now.getMonth() + 1).padStart(2, '0');
	const day = String(now.getDate()).padStart(2, '0');
	return `${year}-${month}-${day}`;
}
