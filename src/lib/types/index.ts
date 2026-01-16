// Task type
export interface Task {
	id: string;
	name: string;
	category: string;
	type: 'study' | 'other';
	color: string;
	createdAt: number;
	isActive: boolean;
}

// Timer session type
export interface TimerSession {
	id: string;
	taskId: string;
	startTime: number;
	endTime: number | null;
	duration: number;
	date: string;
}

// Active timer state
export interface ActiveTimer {
	taskId: string | null;
	startTime: number | null;
	elapsed: number;
	isRunning: boolean;
}
