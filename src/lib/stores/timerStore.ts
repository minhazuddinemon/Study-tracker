import { writable } from 'svelte/store';
import type { ActiveTimer, Task, TimerSession } from '$lib/types';
import { taskStorage } from '$lib/utils/storage';
import { sessionStore } from '$lib/stores/sessionsStore';
import { getTodayDateString } from '$lib/utils/time';

function createTimerStore() {
	const { subscribe, update } = writable<ActiveTimer>({
		taskId: null,
		startTime: null,
		elapsed: 0,
		isRunning: false
	});

	let intervalId: number | null = null;

	return {
		subscribe,

		startTimer: (taskId: string) => {
			update((state) => {
				if (state.isRunning) {
					// Stop previous timer first
					clearInterval(intervalId!);
				}

				const startTime = Date.now();

				// Start updating elapsed time
				intervalId = window.setInterval(() => {
					update((s) => ({
						...s,
						elapsed: Date.now() - startTime
					}));
				}, 1000);

				return {
					taskId,
					startTime,
					elapsed: 0,
					isRunning: true
				};
			});
		},

		stopTimer: () => {
			update((state) => {
				if (state.isRunning && state.taskId && state.startTime) {
					// Clear interval
					if (intervalId) {
						clearInterval(intervalId);
						intervalId = null;
					}

					// Save the session
					const duration = Date.now() - state.startTime;
					const session: Omit<TimerSession, 'id'> = {
						taskId: state.taskId,
						startTime: state.startTime,
						endTime: Date.now(),
						duration,
						date: getTodayDateString()
					};

					sessionStore.addSession(session);
				}

				return {
					taskId: null,
					startTime: null,
					elapsed: 0,
					isRunning: false
				};
			});
		},

		pauseTimer: () => {
			update((state) => {
				if (intervalId) {
					clearInterval(intervalId);
					intervalId = null;
				}
				return { ...state, isRunning: false };
			});
		},

		resumeTimer: () => {
			update((state) => {
				if (state.taskId && state.startTime && !state.isRunning) {
					const adjustedStartTime = Date.now() - state.elapsed;

					intervalId = window.setInterval(() => {
						update((s) => ({
							...s,
							elapsed: Date.now() - adjustedStartTime
						}));
					}, 1000);

					return {
						...state,
						startTime: adjustedStartTime,
						isRunning: true
					};
				}
				return state;
			});
		}
	};
}

export const timerStore = createTimerStore();

// Task store
function createTaskStore() {
	const { subscribe, set, update } = writable<Task[]>(taskStorage.getTasks());

	return {
		subscribe,

		addTask: (name: string, type: Task['type'], color: string = '#3b82f6') => {
			const task = taskStorage.addTask({
				name,
				category: type === 'study' ? 'Study' : 'Other',
				type,
				color,
				isActive: true
			});

			update((tasks) => [...tasks, task]);
			return task;
		},

		deleteTask: (taskId: string) => {
			taskStorage.deleteTask(taskId);
			update((tasks) => tasks.filter((task) => task.id !== taskId));
		},

		refresh: () => {
			set(taskStorage.getTasks());
		}
	};
}

export const taskStore = createTaskStore();
