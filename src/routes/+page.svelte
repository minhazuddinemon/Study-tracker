<script lang="ts">
	import { timerStore, taskStore } from '$lib/stores/timerStore';
	import { formatTime, formatTimeShort, formatTimeOfDay } from '$lib/utils/time';
	import { sessionStorage } from '$lib/utils/storage';
	import { sessionStore } from '$lib/stores/sessionsStore';
	import TaskForm from '$components/Task/TaskForm.svelte';
	import TaskList from '$components/Task/TaskList.svelte';
	import ActiveTimer from '$components/Timer/ActivateTimer.svelte';
	import { Card, Button } from '$lib/components/ui';
	import { Calendar } from '$lib/components/ui/calendar';
	import CustomBarChart from '$lib/components/ui/CustomBarChart.svelte';
	import * as Chart from '$lib/components/ui/chart';
	import { onMount } from 'svelte';
	import { slide } from 'svelte/transition';
	import { CalendarDate, today, getLocalTimeZone } from '@internationalized/date';
	import { AreaChart, PieChart } from 'layerchart';
	import { curveLinear } from 'd3-shape';
	import { scaleBand } from 'd3-scale';
	import {
		Timer,
		LayoutDashboard,
		Clock,
		TrendingUp,
		Calendar as CalendarIcon,
		Zap,
		Database,
		BarChart3,
		ChevronLeft,
		ChevronRight
	} from 'lucide-svelte';
	import type { TimerSession, Task } from '$lib/types';

	let showDashboard = $state(false);
	let showAllSessions = $state(false);
	let showCalendar = $state(false);
	let sessions = $state<TimerSession[]>([]);
	let tasks = $state<Task[]>([]);
	let allSessions = $state<TimerSession[]>([]);
	let rangeView = $state<'day' | 'week' | 'month' | '6months'>('day');
	let calendarButtonEl = $state<HTMLElement | null>(null);
	let calendarPopoverEl = $state<HTMLElement | null>(null);

	// Date navigation
	let selectedDate = $state<CalendarDate>(today(getLocalTimeZone()));
	let isSelectedToday = $derived(selectedDate.compare(today(getLocalTimeZone())) === 0);

	function toDateString(date: Date): string {
		const year = date.getFullYear();
		const month = String(date.getMonth() + 1).padStart(2, '0');
		const day = String(date.getDate()).padStart(2, '0');
		return `${year}-${month}-${day}`;
	}

	function getRangeDates() {
		const base = new Date(selectedDate.year, selectedDate.month - 1, selectedDate.day);
		base.setHours(0, 0, 0, 0);
		if (rangeView === 'day') {
			return { start: base, end: base };
		}
		if (rangeView === 'week') {
			const start = new Date(base);
			start.setDate(base.getDate() - base.getDay());
			const end = new Date(start);
			end.setDate(start.getDate() + 6);
			return { start, end };
		}
		if (rangeView === 'month') {
			const start = new Date(base);
			start.setDate(base.getDate() - 27);
			return { start, end: base };
		}
		const start = new Date(base.getFullYear(), base.getMonth() - 5, 1);
		const end = new Date(base.getFullYear(), base.getMonth() + 1, 0);
		return { start, end };
	}

	function formatRangeLabel() {
		const { start, end } = getRangeDates();
		const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
		if (rangeView === 'day') return formatSelectedDate(selectedDate);
		const startText = start.toLocaleDateString('en-US', options);
		const endText = end.toLocaleDateString('en-US', options);
		return `${startText} - ${endText}`;
	}

	function formatSelectedDate(date: CalendarDate): string {
		const jsDate = new Date(date.year, date.month - 1, date.day);
		return jsDate.toLocaleDateString('en-US', {
			weekday: 'short',
			month: 'short',
			day: 'numeric',
			year: date.year !== today(getLocalTimeZone()).year ? 'numeric' : undefined
		});
	}

	function getDateString(date: CalendarDate): string {
		return `${date.year}-${String(date.month).padStart(2, '0')}-${String(date.day).padStart(2, '0')}`;
	}

	function goToPreviousDay() {
		if (rangeView === 'day') {
			selectedDate = selectedDate.subtract({ days: 1 });
		} else if (rangeView === 'week') {
			selectedDate = selectedDate.subtract({ days: 7 });
		} else if (rangeView === 'month') {
			selectedDate = selectedDate.subtract({ days: 28 });
		} else {
			selectedDate = selectedDate.subtract({ months: 6 });
		}
		loadSessionsForRange();
	}

	function goToNextDay() {
		if (rangeView === 'day') {
			selectedDate = selectedDate.add({ days: 1 });
		} else if (rangeView === 'week') {
			selectedDate = selectedDate.add({ days: 7 });
		} else if (rangeView === 'month') {
			selectedDate = selectedDate.add({ days: 28 });
		} else {
			selectedDate = selectedDate.add({ months: 6 });
		}
		loadSessionsForRange();
	}

	function goToToday() {
		selectedDate = today(getLocalTimeZone());
		loadSessionsForRange();
	}

	function loadSessionsForRange() {
		const { start, end } = getRangeDates();
		const startString = toDateString(start);
		const endString = toDateString(end);
		sessionStore.refreshByRange(startString, endString);
		showCalendar = false;
	}

	function handleCalendarChange(date: CalendarDate | undefined) {
		if (date) {
			selectedDate = date;
			loadSessionsForRange();
		}
	}

	function setRangeView(view: 'day' | 'week' | 'month' | '6months') {
		rangeView = view;
		loadSessionsForRange();
	}

	$effect(() => {
		if (!showCalendar || typeof document === 'undefined') return;

		const handleClickOutside = (event: MouseEvent) => {
			const target = event.target as Node | null;
			if (!target) return;
			if (calendarPopoverEl?.contains(target)) return;
			if (calendarButtonEl?.contains(target)) return;
			showCalendar = false;
		};

		document.addEventListener('mousedown', handleClickOutside);
		return () => document.removeEventListener('mousedown', handleClickOutside);
	});

	onMount(() => {
		taskStore.refresh();
		loadSessionsForRange();
		const unsubscribeTasks = taskStore.subscribe((value) => {
			tasks = value;
		});
		const unsubscribeSessions = sessionStore.subscribe((value) => {
			sessions = value;
			allSessions = sessionStorage.getSessions();
		});
		return () => {
			unsubscribeTasks();
			unsubscribeSessions();
		};
	});

	// Dashboard computed values
	let totalTimeRange = $derived(sessions.reduce((acc, s) => acc + s.duration, 0));
	let taskBreakdown = $derived(() => {
		const breakdown: { task: Task; duration: number; percentage: number }[] = [];
		for (const task of tasks) {
			const taskSessions = sessions.filter((s) => s.taskId === task.id);
			const duration = taskSessions.reduce((acc, s) => acc + s.duration, 0);
			if (duration > 0) {
				breakdown.push({
					task,
					duration,
					percentage: totalTimeRange > 0 ? (duration / totalTimeRange) * 100 : 0
				});
			}
		}
		return breakdown.sort((a, b) => b.duration - a.duration);
	});

	const studyProgressConfig: Chart.ChartConfig = {
		study: { label: 'Study', color: '#22c55e' }
	};

	let studyProgressData = $derived(() => {
		if (allSessions.length === 0) return [] as { day: number; study: number }[];
		const taskTypeById = new Map(tasks.map((task) => [task.id, task.type]));
		const studySessions = allSessions.filter(
			(session) => taskTypeById.get(session.taskId) === 'study'
		);
		if (studySessions.length === 0) return [] as { day: number; study: number }[];

		const uniqueDates = Array.from(new Set(studySessions.map((s) => s.date))).sort();
		const startDate = new Date(uniqueDates[0]);
		const endDate = new Date(uniqueDates[uniqueDates.length - 1]);
		startDate.setHours(0, 0, 0, 0);
		endDate.setHours(0, 0, 0, 0);

		const data: { day: number; study: number }[] = [];
		let dayIndex = 1;
		for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
			const dateString = toDateString(d);
			const total = studySessions
				.filter((s) => s.date === dateString)
				.reduce((acc, s) => acc + s.duration, 0);
			data.push({ day: dayIndex, study: total / 60000 });
			dayIndex += 1;
		}

		return data;
	});

	let studyProgressWidth = $derived(() => Math.max(studyProgressData().length * 60, 0));

	// Time slots for day view (8 slots of 3 hours each)
	const dayTimeSlots = [
		{ label: '12AM-3AM', start: 0, end: 3 },
		{ label: '3AM-6AM', start: 3, end: 6 },
		{ label: '6AM-9AM', start: 6, end: 9 },
		{ label: '9AM-12PM', start: 9, end: 12 },
		{ label: '12PM-3PM', start: 12, end: 15 },
		{ label: '3PM-6PM', start: 15, end: 18 },
		{ label: '6PM-9PM', start: 18, end: 21 },
		{ label: '9PM-12AM', start: 21, end: 24 }
	];

	function buildSegments(bucketSessions: TimerSession[]) {
		const segments: { key: string; label: string; color: string; value: number }[] = [];
		for (const task of tasks) {
			const duration = bucketSessions
				.filter((s) => s.taskId === task.id)
				.reduce((acc, s) => acc + s.duration, 0);
			const minutes = duration / 60000;
			if (minutes > 0) {
				segments.push({
					key: task.id,
					label: task.name,
					color: task.color,
					value: minutes
				});
			}
		}
		return segments;
	}

	// Generate chart data for custom bar chart
	let barChartData = $derived(() => {
		const { start, end } = getRangeDates();
		if (rangeView === 'day') {
			const chartDate = new Date(selectedDate.year, selectedDate.month - 1, selectedDate.day);
			chartDate.setHours(0, 0, 0, 0);

			return dayTimeSlots.map((slot) => {
				const segments: { key: string; label: string; color: string; value: number }[] = [];

				for (const task of tasks) {
					let taskMinutes = 0;

					for (const session of sessions) {
						if (session.taskId !== task.id) continue;
						const sessionStart = new Date(session.startTime);
						if (!session.endTime) continue;
						const sessionEnd = new Date(session.endTime);

						const slotStart = new Date(chartDate);
						slotStart.setHours(slot.start, 0, 0, 0);
						const slotEnd = new Date(chartDate);
						slotEnd.setHours(slot.end, 0, 0, 0);

						const overlapStart = Math.max(sessionStart.getTime(), slotStart.getTime());
						const overlapEnd = Math.min(sessionEnd.getTime(), slotEnd.getTime());

						if (overlapEnd > overlapStart) {
							taskMinutes += (overlapEnd - overlapStart) / 60000;
						}
					}

					if (taskMinutes > 0) {
						segments.push({
							key: task.id,
							label: task.name,
							color: task.color,
							value: taskMinutes
						});
					}
				}

				const total = segments.reduce((acc, s) => acc + s.value, 0);
				return { timeSlot: slot.label, segments, total };
			});
		}

		if (rangeView === 'week') {
			const startDate = new Date(start);
			const labels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
			return labels.map((label, index) => {
				const date = new Date(startDate);
				date.setDate(startDate.getDate() + index);
				const dateString = toDateString(date);
				const bucketSessions = sessions.filter((s) => s.date === dateString);
				const segments = buildSegments(bucketSessions);
				const total = segments.reduce((acc, s) => acc + s.value, 0);
				return { timeSlot: label, segments, total };
			});
		}

		if (rangeView === 'month') {
			const startDate = new Date(start);
			return Array.from({ length: 4 }, (_, index) => {
				const weekStart = new Date(startDate);
				weekStart.setDate(startDate.getDate() + index * 7);
				const weekEnd = new Date(weekStart);
				weekEnd.setDate(weekStart.getDate() + 6);
				const startString = toDateString(weekStart);
				const endString = toDateString(weekEnd);
				const bucketSessions = sessions.filter((s) => s.date >= startString && s.date <= endString);
				const segments = buildSegments(bucketSessions);
				const total = segments.reduce((acc, s) => acc + s.value, 0);
				return { timeSlot: `W${index + 1}`, segments, total };
			});
		}

		return Array.from({ length: 6 }, (_, index) => {
			const monthDate = new Date(end.getFullYear(), end.getMonth() - (5 - index), 1);
			const monthStart = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
			const monthEnd = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0);
			const startString = toDateString(monthStart);
			const endString = toDateString(monthEnd);
			const bucketSessions = sessions.filter((s) => s.date >= startString && s.date <= endString);
			const segments = buildSegments(bucketSessions);
			const total = segments.reduce((acc, s) => acc + s.value, 0);
			const label = monthDate.toLocaleDateString('en-US', { month: 'short' });
			return { timeSlot: label, segments, total };
		});
	});

	// Calculate max value for chart scaling
	let maxBarValue = $derived(() => {
		const data = barChartData();
		const maxTotal = Math.max(...data.map((d) => d.total), 0);
		return Math.max(maxTotal * 1.2, 10); // At least 10 minutes scale
	});

	// Pie chart data for tasks
	let taskPieData = $derived(() =>
		taskBreakdown().map((item) => ({
			task: item.task.name,
			minutes: item.duration / 60000,
			color: `var(--color-task-${item.task.id})`
		}))
	);

	let taskPieConfig = $derived(() => {
		const config: Chart.ChartConfig = {};
		taskBreakdown().forEach((item) => {
			config[`task-${item.task.id}`] = { label: item.task.name, color: item.task.color };
		});
		return config;
	});

	// Study vs Other totals
	let typeTotals = $derived(() => {
		let studyDuration = 0;
		let otherDuration = 0;
		for (const item of taskBreakdown()) {
			if (item.task.type === 'study') {
				studyDuration += item.duration;
			} else {
				otherDuration += item.duration;
			}
		}
		return {
			studyMinutes: studyDuration / 60000,
			otherMinutes: otherDuration / 60000,
			totalMinutes: (studyDuration + otherDuration) / 60000
		};
	});

	const typeChartConfig: Chart.ChartConfig = {
		study: { label: 'Study', color: '#8b5cf6' },
		other: { label: 'Other', color: '#f59e0b' }
	};

	let typeChartData = $derived(() =>
		[
			{ type: 'study', minutes: typeTotals().studyMinutes, color: 'var(--color-study)' },
			{ type: 'other', minutes: typeTotals().otherMinutes, color: 'var(--color-other)' }
		].filter((item) => item.minutes > 0)
	);
</script>

<div class="min-h-screen bg-zinc-950">
	<!-- Animated background -->
	<div class="fixed inset-0 -z-10 overflow-hidden">
		<div
			class="absolute -top-1/2 -left-1/2 w-full h-full bg-linear-to-br from-violet-500/10 via-transparent to-transparent rounded-full blur-3xl animate-float"
		></div>
		<div
			class="absolute -bottom-1/2 -right-1/2 w-full h-full bg-linear-to-tl from-indigo-500/10 via-transparent to-transparent rounded-full blur-3xl animate-float"
			style="animation-delay: 3s;"
		></div>
	</div>

	<!-- Header -->
	<header class="glass sticky top-0 z-50">
		<div class="max-w-6xl mx-auto px-6 py-4">
			<div class="flex justify-between items-center">
				<div class="flex items-center gap-4">
					<div
						class="w-12 h-12 rounded-2xl gradient-primary flex items-center justify-center glow-primary"
					>
						<Timer class="w-6 h-6 text-white" />
					</div>
					<div>
						<h1 class="text-xl font-bold text-zinc-100">Study Tracker</h1>
						<p class="text-xs text-zinc-500">Track your learning journey</p>
					</div>
				</div>

				<nav class="flex gap-1 p-1.5 bg-zinc-900 rounded-2xl border border-zinc-800">
					<Button
						variant={!showDashboard ? 'default' : 'ghost'}
						size="sm"
						onclick={() => (showDashboard = false)}
						class="rounded-xl"
					>
						<Clock class="w-4 h-4" />
						Timer
					</Button>
					<Button
						variant={showDashboard ? 'default' : 'ghost'}
						size="sm"
						onclick={() => {
							showDashboard = true;
							sessionStore.refreshToday();
						}}
						class="rounded-xl"
					>
						<LayoutDashboard class="w-4 h-4" />
						Dashboard
					</Button>
				</nav>
			</div>
		</div>
	</header>

	<main class="max-w-6xl mx-auto px-6 py-8">
		{#if !showDashboard}
			<!-- Timer View -->
			<div class="space-y-8">
				<ActiveTimer />

				<Card class="p-6">
					<div class="flex justify-between items-center mb-6">
						<div>
							<h2 class="text-xl font-bold text-zinc-100">Your Tasks</h2>
							<p class="text-sm text-zinc-500 mt-1">Select a task to start tracking</p>
						</div>
						<TaskForm />
					</div>

					<TaskList />
				</Card>
			</div>
		{:else}
			<!-- Dashboard View -->
			<div class="space-y-6">
				<!-- Stats Grid -->
				<div class="grid grid-cols-1 md:grid-cols-3 gap-4">
					<Card class="p-6">
						<div class="flex items-center gap-4">
							<div class="w-12 h-12 rounded-xl bg-violet-500/20 flex items-center justify-center">
								<Clock class="w-6 h-6 text-violet-400" />
							</div>
							<div>
								<p class="text-sm text-zinc-500">Total ({formatRangeLabel()})</p>
								<p class="text-2xl font-bold text-zinc-100">{formatTimeShort(totalTimeRange)}</p>
							</div>
						</div>
					</Card>

					<Card class="p-6">
						<div class="flex items-center gap-4">
							<div class="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center">
								<Zap class="w-6 h-6 text-emerald-400" />
							</div>
							<div>
								<p class="text-sm text-zinc-500">Sessions</p>
								<p class="text-2xl font-bold text-zinc-100">{sessions.length}</p>
							</div>
						</div>
					</Card>

					<Card class="p-6">
						<div class="flex items-center gap-4">
							<div class="w-12 h-12 rounded-xl bg-amber-500/20 flex items-center justify-center">
								<TrendingUp class="w-6 h-6 text-amber-400" />
							</div>
							<div>
								<p class="text-sm text-zinc-500">Active Tasks</p>
								<p class="text-2xl font-bold text-zinc-100">{tasks.length}</p>
							</div>
						</div>
					</Card>
				</div>

				<!-- Range Selector -->
				<div class="flex flex-wrap gap-2">
					<Button
						variant={rangeView === 'day' ? 'default' : 'ghost'}
						size="sm"
						onclick={() => setRangeView('day')}
					>
						Day
					</Button>
					<Button
						variant={rangeView === 'week' ? 'default' : 'ghost'}
						size="sm"
						onclick={() => setRangeView('week')}
					>
						Week
					</Button>
					<Button
						variant={rangeView === 'month' ? 'default' : 'ghost'}
						size="sm"
						onclick={() => setRangeView('month')}
					>
						4 Weeks
					</Button>
					<Button
						variant={rangeView === '6months' ? 'default' : 'ghost'}
						size="sm"
						onclick={() => setRangeView('6months')}
					>
						6 Months
					</Button>
				</div>

				<!-- Activity + Breakdown Layout -->
				<div class="flex flex-col lg:flex-row gap-4 lg:items-stretch" style="min-height: 640px;">
					<!-- Time Breakdown Chart -->
					<div class="lg:flex-2 lg:self-stretch">
						<Card class="p-6 h-full flex flex-col">
							<!-- Header with date navigation -->
							<div class="flex items-center justify-between mb-6">
								<div class="flex items-center gap-3">
									<div
										class="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center"
									>
										<BarChart3 class="w-5 h-5 text-indigo-400" />
									</div>
									<div>
										<h2 class="text-lg font-bold text-zinc-100">
											{rangeView === 'day' && isSelectedToday ? "Today's Activity" : 'Activity'}
										</h2>
										<p class="text-sm text-zinc-500">Time distribution across 24 hours</p>
									</div>
								</div>

								<!-- Date Navigation -->
								<div class="flex items-center gap-2">
									<button
										onclick={goToPreviousDay}
										class="p-2 rounded-lg hover:bg-zinc-800 transition-colors cursor-pointer"
										aria-label="Previous day"
									>
										<ChevronLeft class="w-5 h-5 text-zinc-400" />
									</button>

									<div class="relative" bind:this={calendarButtonEl}>
										<button
											onclick={() => (showCalendar = !showCalendar)}
											class="flex items-center gap-2 px-3 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 transition-colors cursor-pointer"
										>
											<CalendarIcon class="w-4 h-4 text-violet-400" />
											<span class="text-sm text-zinc-200">{formatSelectedDate(selectedDate)}</span>
										</button>

										<!-- Calendar Dropdown -->
										{#if showCalendar}
											<div
												class="absolute right-0 top-full mt-2 z-50 origin-top-right scale-110"
												transition:slide={{ duration: 200 }}
												bind:this={calendarPopoverEl}
											>
												<Calendar value={selectedDate} onValueChange={handleCalendarChange} />
											</div>
										{/if}
									</div>

									<button
										onclick={goToNextDay}
										class="p-2 rounded-lg hover:bg-zinc-800 transition-colors cursor-pointer"
										aria-label="Next day"
									>
										<ChevronRight class="w-5 h-5 text-zinc-400" />
									</button>

									{#if !isSelectedToday}
										<button
											onclick={goToToday}
											class="ml-2 px-3 py-1.5 text-xs font-medium text-violet-400 bg-violet-500/10 rounded-lg hover:bg-violet-500/20 transition-colors"
										>
											Today
										</button>
									{/if}
								</div>
							</div>

							{#if taskBreakdown().length === 0}
								<div class="text-center py-12">
									<div
										class="w-16 h-16 mx-auto mb-4 rounded-2xl bg-zinc-800 flex items-center justify-center"
									>
										<Database class="w-8 h-8 text-zinc-600" />
									</div>
									<p class="text-zinc-500">No sessions recorded for this range</p>
									<p class="text-sm text-zinc-600 mt-1">
										{rangeView === 'day'
											? 'Start a timer to see your progress here'
											: 'Try selecting another range'}
									</p>
								</div>
							{:else}
								<div class="rounded-xl bg-zinc-900/50 p-4 border border-zinc-800 flex-1">
									<CustomBarChart
										data={barChartData()}
										maxValue={maxBarValue()}
										chartHeight="100%"
										class="h-full"
									/>
								</div>

								<!-- Legend -->
								<div class="flex flex-wrap gap-4 mt-4 pt-4 border-t border-zinc-800">
									{#each taskBreakdown() as item}
										<div class="flex items-center gap-2">
											<div
												class="w-3 h-3 rounded-full"
												style="background-color: {item.task.color}; box-shadow: 0 0 8px {item.task
													.color};"
											></div>
											<span class="text-sm text-zinc-400">{item.task.name}</span>
											<span class="text-xs text-zinc-600">({formatTimeShort(item.duration)})</span>
										</div>
									{/each}
								</div>
							{/if}
						</Card>
					</div>

					<div class="flex flex-col gap-4 lg:flex-1 lg:self-stretch">
						<Card class="p-6 flex flex-col flex-1">
							<div class="flex items-center justify-between mb-4">
								<div>
									<h3 class="text-lg font-bold text-zinc-100">Tasks Breakdown</h3>
									<p class="text-sm text-zinc-500">{formatRangeLabel()}</p>
								</div>
							</div>

							{#if taskBreakdown().length === 0}
								<p class="text-sm text-zinc-500 text-center py-8">No task data for this date</p>
							{:else}
								<Chart.Container config={taskPieConfig()} class="mx-auto aspect-square max-h-62.5">
									<PieChart
										data={taskPieData()}
										key="task"
										value="minutes"
										cRange={taskPieData().map((d) => d.color)}
										c="color"
										innerRadius={60}
									/>
								</Chart.Container>
							{/if}
						</Card>

						<Card class="p-6 flex flex-col flex-1">
							<div class="flex items-center justify-between mb-4">
								<div>
									<h3 class="text-lg font-bold text-zinc-100">Study vs Other</h3>
									<p class="text-sm text-zinc-500">{formatRangeLabel()}</p>
								</div>
							</div>

							{#if typeChartData().length === 0}
								<p class="text-sm text-zinc-500 text-center py-8">No type data for this date</p>
							{:else}
								<Chart.Container config={typeChartConfig} class="mx-auto aspect-square max-h-62.5">
									<PieChart
										data={typeChartData()}
										key="type"
										value="minutes"
										cRange={typeChartData().map((d) => d.color)}
										c="color"
										innerRadius={60}
									/>
									<div class="mt-4 flex flex-col items-center">
										<p class="text-2xl font-bold text-zinc-100">
											{formatTimeShort(typeTotals().totalMinutes * 60000)}
										</p>
										<p class="text-xs text-zinc-500">Total</p>
									</div>
								</Chart.Container>
								<div class="mt-4 flex items-center justify-between text-sm text-zinc-400">
									<span>Study: {formatTimeShort(typeTotals().studyMinutes * 60000)}</span>
									<span>Other: {formatTimeShort(typeTotals().otherMinutes * 60000)}</span>
								</div>
							{/if}
						</Card>
					</div>
				</div>

				<!-- Study Progress -->
				<Card class="p-6">
					<div class="flex items-center justify-between mb-4">
						<div>
							<h2 class="text-lg font-bold text-zinc-100">Study Progress</h2>
							<p class="text-sm text-zinc-500">Day-by-day study time since you started</p>
						</div>
					</div>

					{#if studyProgressData().length === 0}
						<p class="text-zinc-500 text-center py-8">No study sessions yet</p>
					{:else}
						<div class="overflow-x-auto study-progress-chart">
							<div style="width: max(100%, {studyProgressWidth()}px);">
								<Chart.Container config={studyProgressConfig} class="h-64">
									<AreaChart
										data={studyProgressData()}
										x="day"
										xScale={scaleBand()}
										series={[
											{
												key: 'study',
												label: 'Study',
												color: studyProgressConfig.study.color
											}
										]}
										seriesLayout="stack"
										props={{
											area: {
												curve: curveLinear,
												'fill-opacity': 0.4,
												line: { class: 'stroke-1' }
											},
											xAxis: { format: (v: number) => `Day ${v}` },
											yAxis: { format: () => '' }
										}}
									/>
								</Chart.Container>
							</div>
						</div>
					{/if}
				</Card>

				<!-- Recent Sessions -->
				<Card class="p-6">
					<h2 class="text-lg font-bold text-zinc-100 mb-4">Recent Sessions</h2>
					{#if sessions.length === 0}
						<p class="text-zinc-500 text-center py-8">No sessions yet today</p>
					{:else}
						{@const reversedSessions = [...sessions].reverse()}
						{@const firstThree = reversedSessions.slice(0, 3)}
						{@const remaining = reversedSessions.slice(3)}
						<div class="space-y-2">
							<!-- Always show first 3 -->
							{#each firstThree as session (session.startTime)}
								{@const task = tasks.find((t) => t.id === session.taskId)}
								{#if task}
									<div
										class="flex items-center justify-between p-3 rounded-xl bg-zinc-800/50 border border-zinc-800"
									>
										<div class="flex items-center gap-3">
											<div
												class="w-2 h-2 rounded-full"
												style="background-color: {task.color};"
											></div>
											<div>
												<span class="text-zinc-300">{task.name}</span>
												<div class="text-xs text-zinc-500">
													{formatTimeOfDay(session.startTime)} - {session.endTime
														? formatTimeOfDay(session.endTime)
														: 'In progress'}
												</div>
											</div>
										</div>
										<span class="text-zinc-400 text-sm font-medium"
											>{formatTimeShort(session.duration)}</span
										>
									</div>
								{/if}
							{/each}

							<!-- Additional sessions with slide animation -->
							{#if showAllSessions && remaining.length > 0}
								<div transition:slide={{ duration: 300 }} class="space-y-2">
									{#each remaining as session (session.startTime)}
										{@const task = tasks.find((t) => t.id === session.taskId)}
										{#if task}
											<div
												class="flex items-center justify-between p-3 rounded-xl bg-zinc-800/50 border border-zinc-800"
											>
												<div class="flex items-center gap-3">
													<div
														class="w-2 h-2 rounded-full"
														style="background-color: {task.color};"
													></div>
													<div>
														<span class="text-zinc-300">{task.name}</span>
														<div class="text-xs text-zinc-500">
															{formatTimeOfDay(session.startTime)} - {session.endTime
																? formatTimeOfDay(session.endTime)
																: 'In progress'}
														</div>
													</div>
												</div>
												<span class="text-zinc-400 text-sm font-medium"
													>{formatTimeShort(session.duration)}</span
												>
											</div>
										{/if}
									{/each}
								</div>
							{/if}
						</div>

						{#if sessions.length > 3}
							<button
								class="w-full mt-4 py-2 text-sm text-violet-400 hover:text-violet-300 transition-colors flex items-center justify-center gap-2 cursor-pointer"
								onclick={() => (showAllSessions = !showAllSessions)}
							>
								{showAllSessions ? 'Show less' : `See all (${sessions.length})`}
							</button>
						{/if}
					{/if}
				</Card>
			</div>
		{/if}
	</main>

	<footer class="py-8 text-center">
		<p class="text-zinc-600 text-sm flex items-center justify-center gap-2">
			<Database class="w-4 h-4" />
			Minhaz Uddin • CUET CSE
		</p>
	</footer>
</div>
