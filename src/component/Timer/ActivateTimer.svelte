<script lang="ts">
	import { timerStore, taskStore } from '$lib/stores/timerStore';
	import { formatTime } from '$lib/utils/time';
	import { onDestroy } from 'svelte';
	import type { ActiveTimer, Task } from '$lib/types';
	import { Button, Card } from '$lib/components/ui';
	import { Play, Pause, Square, Trash2, Timer } from 'lucide-svelte';

	let activeTimer = $state<ActiveTimer>({
		taskId: null,
		startTime: null,
		elapsed: 0,
		isRunning: false
	});
	let tasks = $state<Task[]>([]);

	// Subscribe to stores
	const unsubscribeTimer = timerStore.subscribe((value) => {
		activeTimer = value;
	});

	const unsubscribeTasks = taskStore.subscribe((value) => {
		tasks = value;
	});

	onDestroy(() => {
		unsubscribeTimer();
		unsubscribeTasks();
	});

	// Use $derived for reactive activeTask
	let activeTask = $derived(
		activeTimer.taskId ? tasks.find((task) => task.id === activeTimer.taskId) : null
	);
</script>

<Card
	variant="glass"
	class="relative overflow-hidden {activeTimer.isRunning
		? 'border-emerald-500/30'
		: 'border-zinc-800'}"
>
	<!-- Background glow effect -->
	{#if activeTimer.isRunning}
		<div
			class="absolute inset-0 bg-linear-to-br from-emerald-500/10 via-transparent to-emerald-500/5"
		></div>
	{:else if activeTimer.taskId}
		<div
			class="absolute inset-0 bg-linear-to-br from-amber-500/10 via-transparent to-amber-500/5"
		></div>
	{:else}
		<div
			class="absolute inset-0 bg-linear-to-br from-violet-500/10 via-transparent to-violet-500/5"
		></div>
	{/if}

	<!-- Decorative elements -->
	<div
		class="absolute top-0 right-0 w-64 h-64 bg-linear-to-bl from-white/5 to-transparent rounded-full -translate-y-1/2 translate-x-1/2"
	></div>

	<div class="relative p-8 md:p-12">
		<div class="text-center">
			{#if activeTimer.isRunning && activeTask}
				<!-- Running Timer State -->
				<div class="mb-8">
					<div
						class="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500/20 rounded-full border border-emerald-500/30"
					>
						<span
							class="w-2.5 h-2.5 rounded-full animate-pulse-glow"
							style="background-color: {activeTask.color}; color: {activeTask.color};"
						></span>
						<span class="text-sm font-medium text-emerald-400">Recording</span>
					</div>
					<h2 class="text-3xl md:text-4xl font-bold text-zinc-100 mt-5">{activeTask.name}</h2>
					<p class="text-zinc-500 text-sm mt-2">
						{activeTask.type === 'study' ? 'Study' : 'Other'}
					</p>
				</div>

				<div
					class="timer-display text-6xl md:text-8xl font-bold text-zinc-100 mb-10 tracking-wider"
				>
					{formatTime(activeTimer.elapsed)}
				</div>

				<div class="flex flex-wrap justify-center gap-4">
					<Button variant="secondary" size="lg" onclick={() => timerStore.pauseTimer()}>
						<Pause class="w-5 h-5" />
						Pause
					</Button>
					<Button variant="success" size="lg" onclick={() => timerStore.stopTimer()}>
						<Square class="w-5 h-5" />
						Stop & Save
					</Button>
				</div>
			{:else if activeTimer.taskId && !activeTimer.isRunning && activeTask}
				<!-- Paused Timer State -->
				<div class="mb-8">
					<div
						class="inline-flex items-center gap-2 px-4 py-2 bg-amber-500/20 rounded-full border border-amber-500/30"
					>
						<Pause class="w-4 h-4 text-amber-400" />
						<span class="text-sm font-medium text-amber-400">Paused</span>
					</div>
					<h2 class="text-3xl md:text-4xl font-bold text-zinc-100 mt-5">{activeTask.name}</h2>
				</div>

				<div
					class="timer-display text-5xl md:text-7xl font-bold text-zinc-400 mb-10 tracking-wider"
				>
					{formatTime(activeTimer.elapsed)}
				</div>

				<div class="flex flex-wrap justify-center gap-4">
					<Button variant="default" size="lg" onclick={() => timerStore.resumeTimer()}>
						<Play class="w-5 h-5" />
						Resume
					</Button>
					<Button variant="ghost" size="lg" onclick={() => timerStore.stopTimer()}>
						<Trash2 class="w-5 h-5" />
						Discard
					</Button>
				</div>
			{:else}
				<!-- Idle State -->
				<div class="py-8">
					<div
						class="w-24 h-24 mx-auto mb-6 rounded-3xl bg-zinc-800 border border-zinc-700 flex items-center justify-center animate-float"
					>
						<Timer class="w-12 h-12 text-violet-400" />
					</div>
					<h2 class="text-2xl md:text-3xl font-bold text-zinc-100 mb-3">Ready to Focus?</h2>
					<p class="text-zinc-500 max-w-md mx-auto">
						Select a task below to start tracking your study time
					</p>

					<div class="timer-display text-5xl md:text-6xl font-bold text-zinc-700 mt-8">
						00:00:00
					</div>
				</div>
			{/if}
		</div>
	</div>
</Card>
