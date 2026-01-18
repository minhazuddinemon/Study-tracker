import { browser } from '$app/environment';
import type { Task, TimerSession } from '$lib/types';
import { getTodayDateString } from '$lib/utils/time';

const STORAGE_KEYS = {
	TASKS: 'study-tracker-tasks',
	SESSIONS: 'study-tracker-sessions',
	ACTIVE_TIMER: 'study-tracker-active-timer'
} as const;

// Tasks storage
export const taskStorage = {
	getTasks(): Task[] {
		if (!browser) return [];
		try {
			const data = localStorage.getItem(STORAGE_KEYS.TASKS);
			const tasks: Task[] = data ? JSON.parse(data) : [];
			return tasks.map((task) => ({
				...task,
				type: task.type ?? (task.category?.toLowerCase() === 'other' ? 'other' : 'study')
			}));
		} catch (error) {
			console.error('Error reading tasks from storage:', error);
			return [];
		}
	},

	saveTasks(tasks: Task[]): void {
		if (!browser) return;
		try {
			localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(tasks));
		} catch (error) {
			console.error('Error saving tasks to storage:', error);
		}
	},

	addTask(task: Omit<Task, 'id' | 'createdAt'>): Task {
		const tasks = this.getTasks();
		const newTask: Task = {
			...task,
			id: crypto.randomUUID(),
			createdAt: Date.now(),
			isActive: true
		};

		tasks.push(newTask);
		this.saveTasks(tasks);
		return newTask;
	},

	deleteTask(taskId: string): void {
		const tasks = this.getTasks();
		const filteredTasks = tasks.filter((task) => task.id !== taskId);
		this.saveTasks(filteredTasks);
	}
};

// Sessions storage
export const sessionStorage = {
	getSessions(): TimerSession[] {
		if (!browser) return [];
		try {
			const data = localStorage.getItem(STORAGE_KEYS.SESSIONS);
			return data ? JSON.parse(data) : [];
		} catch (error) {
			console.error('Error reading sessions from storage:', error);
			return [];
		}
	},

	saveSessions(sessions: TimerSession[]): void {
		if (!browser) return;
		try {
			localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(sessions));
		} catch (error) {
			console.error('Error saving sessions to storage:', error);
		}
	},

	addSession(session: Omit<TimerSession, 'id'>): TimerSession {
		const sessions = this.getSessions();
		const newSession: TimerSession = {
			...session,
			id: crypto.randomUUID()
		};

		sessions.push(newSession);
		this.saveSessions(sessions);
		return newSession;
	},

	getTodaySessions(): TimerSession[] {
		const sessions = this.getSessions();
		const todayLocal = getTodayDateString();
		const todayUtc = new Date().toISOString().split('T')[0];
		return sessions.filter((session) => session.date === todayLocal || session.date === todayUtc);
	},

	getSessionsByDate(dateString: string): TimerSession[] {
		const sessions = this.getSessions();
		return sessions.filter((session) => session.date === dateString);
	},

	getSessionsInRange(startDate: string, endDate: string): TimerSession[] {
		const sessions = this.getSessions();
		return sessions.filter((session) => session.date >= startDate && session.date <= endDate);
	}
};

type ActiveTimerSnapshot = {
	taskId: string;
	startTime: number;
};

export const activeTimerStorage = {
	get(): ActiveTimerSnapshot | null {
		if (!browser) return null;
		try {
			const data = localStorage.getItem(STORAGE_KEYS.ACTIVE_TIMER);
			return data ? (JSON.parse(data) as ActiveTimerSnapshot) : null;
		} catch (error) {
			console.error('Error reading active timer from storage:', error);
			return null;
		}
	},

	save(snapshot: ActiveTimerSnapshot): void {
		if (!browser) return;
		try {
			localStorage.setItem(STORAGE_KEYS.ACTIVE_TIMER, JSON.stringify(snapshot));
		} catch (error) {
			console.error('Error saving active timer to storage:', error);
		}
	},

	clear(): void {
		if (!browser) return;
		try {
			localStorage.removeItem(STORAGE_KEYS.ACTIVE_TIMER);
		} catch (error) {
			console.error('Error clearing active timer from storage:', error);
		}
	}
};
