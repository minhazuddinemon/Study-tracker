<script lang="ts">
	import { taskStore, timerStore } from '$lib/stores/timerStore';
	import { formatTime } from '$lib/utils/time';
	import { onDestroy } from 'svelte';
	import type { Task } from '$lib/types';
	import { Button } from '$lib/components/ui';
	import { Play, Trash2, ClipboardList } from 'lucide-svelte';

	let tasks = $state<Task[]>([]);

	// Subscribe to task store
	const unsubscribe = taskStore.subscribe((value) => {
		tasks = value;
	});

	onDestroy(unsubscribe);

	function startTimer(taskId: string) {
		timerStore.startTimer(taskId);
	}

	function deleteTask(taskId: string, event: Event) {
		event.stopPropagation();
		if (confirm('Are you sure you want to delete this task?')) {
			taskStore.deleteTask(taskId);
		}
	}
</script>

<div class="space-y-3">
	{#if tasks.length === 0}
		<div class="text-center py-16">
			<div
				class="w-20 h-20 mx-auto mb-6 rounded-2xl bg-zinc-800 border border-zinc-700 flex items-center justify-center"
			>
				<ClipboardList class="w-10 h-10 text-zinc-600" />
			</div>
			<h3 class="text-lg font-semibold text-zinc-300 mb-2">No tasks yet</h3>
			<p class="text-zinc-500 text-sm max-w-xs mx-auto">
				Create your first task to start tracking your study time
			</p>
		</div>
	{:else}
		<div class="grid gap-3">
			{#each tasks as task (task.id)}
				<div
					class="group relative bg-zinc-900 rounded-xl border border-zinc-800 hover:border-zinc-700 transition-all duration-300 overflow-hidden card-hover"
				>
					<!-- Color accent bar -->
					<div
						class="absolute left-0 top-0 bottom-0 w-1 transition-all duration-300 group-hover:w-1.5"
						style="background-color: {task.color}; box-shadow: 0 0 20px {task.color}40;"
					></div>

					<div class="flex items-center justify-between p-4 pl-5">
						<div class="flex items-center gap-4">
							<div
								class="w-10 h-10 rounded-xl flex items-center justify-center border border-zinc-800"
								style="background-color: {task.color}15;"
							>
								<div
									class="w-3 h-3 rounded-full"
									style="background-color: {task.color}; box-shadow: 0 0 10px {task.color};"
								></div>
							</div>
							<div>
								<h3 class="font-semibold text-zinc-100 group-hover:text-white transition-colors">
									{task.name}
								</h3>
								<p class="text-sm text-zinc-500">{task.type === 'study' ? 'Study' : 'Other'}</p>
							</div>
						</div>

						<div class="flex items-center gap-2">
							<Button variant="default" size="sm" onclick={() => startTimer(task.id)}>
								<Play class="w-4 h-4" />
								Start
							</Button>
							<Button
								variant="ghost"
								size="icon"
								onclick={(e) => deleteTask(task.id, e)}
								class="text-zinc-500 hover:text-red-400 hover:bg-red-500/10"
							>
								<Trash2 class="w-4 h-4" />
							</Button>
						</div>
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>
