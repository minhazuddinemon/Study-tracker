import { writable } from 'svelte/store';
import type { TimerSession } from '$lib/types';
import { sessionStorage } from '$lib/utils/storage';

function createSessionStore() {
	const { subscribe, set } = writable<TimerSession[]>([]);
	let currentFilter:
		| { type: 'today' }
		| { type: 'date'; dateString: string }
		| { type: 'range'; startDate: string; endDate: string } = { type: 'today' };

	return {
		subscribe,

		refreshToday: () => {
			currentFilter = { type: 'today' };
			set(sessionStorage.getTodaySessions());
		},

		refreshByDate: (dateString: string) => {
			currentFilter = { type: 'date', dateString };
			set(sessionStorage.getSessionsByDate(dateString));
		},

		refreshByRange: (startDate: string, endDate: string) => {
			currentFilter = { type: 'range', startDate, endDate };
			set(sessionStorage.getSessionsInRange(startDate, endDate));
		},

		addSession: (session: Omit<TimerSession, 'id'>) => {
			const saved = sessionStorage.addSession(session);
			if (currentFilter.type === 'today') {
				set(sessionStorage.getTodaySessions());
			} else if (currentFilter.type === 'date') {
				set(sessionStorage.getSessionsByDate(currentFilter.dateString));
			} else {
				set(sessionStorage.getSessionsInRange(currentFilter.startDate, currentFilter.endDate));
			}
			return saved;
		}
	};
}

export const sessionStore = createSessionStore();
