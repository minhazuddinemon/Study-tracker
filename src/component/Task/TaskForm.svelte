<script lang="ts">
	import { taskStore } from '$lib/stores/timerStore';
	import { Button, Input } from '$lib/components/ui';
	import { Plus, AlertCircle, Check } from 'lucide-svelte';
	import { scale } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';
	import { tick } from 'svelte';

	let taskName = $state('');
	let isAdding = $state(false);
	let error = $state('');
	let taskType = $state<'study' | 'other'>('study');
	let taskInput = $state<HTMLInputElement | null>(null);

	const colors = [
		{ value: '#6366f1', name: 'Indigo' },
		{ value: '#ec4899', name: 'Pink' },
		{ value: '#10b981', name: 'Emerald' },
		{ value: '#f59e0b', name: 'Amber' },
		{ value: '#8b5cf6', name: 'Purple' },
		{ value: '#06b6d4', name: 'Cyan' },
		{ value: '#ef4444', name: 'Red' },
		{ value: '#84cc16', name: 'Lime' },
		{ value: '#3b82f6', name: 'Blue' },
		{ value: '#14b8a6', name: 'Teal' },
		{ value: '#f97316', name: 'Orange' },
		{ value: '#a855f7', name: 'Violet' },
		{ value: '#22c55e', name: 'Green' },
		{ value: '#eab308', name: 'Yellow' },
		{ value: '#64748b', name: 'Slate' },
		{ value: '#f43f5e', name: 'Rose' }
	];

	let selectedColor = $state(colors[0].value);

	function addTask() {
		if (!taskName.trim()) {
			error = 'Task name is required';
			return;
		}

		if (taskName.length > 50) {
			error = 'Task name is too long (max 50 chars)';
			return;
		}

		taskStore.addTask(taskName.trim(), taskType, selectedColor);
		taskName = '';
		isAdding = false;
		error = '';
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter') addTask();
		if (e.key === 'Escape') {
			isAdding = false;
			error = '';
		}
	}

	$effect(() => {
		if (!isAdding) return;
		tick().then(() => taskInput?.focus());
	});
</script>

<div>
	{#if !isAdding}
		<div transition:scale={{ duration: 220, start: 0.98, easing: cubicOut }}>
			<Button variant="default" onclick={() => (isAdding = true)}>
				<Plus class="w-5 h-5" />
				Add Task
			</Button>
		</div>
	{:else}
		<div
			class="bg-zinc-900 p-5 rounded-2xl border border-zinc-800 space-y-4"
			transition:scale={{ duration: 260, start: 0.98, easing: cubicOut }}
		>
			<div class="space-y-3">
				<Input
					type="text"
					bind:inputRef={taskInput}
					bind:value={taskName}
					placeholder="What do you want to track?"
					onkeydown={handleKeydown}
				/>

				{#if error}
					<p class="text-red-400 text-sm flex items-center gap-2">
						<AlertCircle class="w-4 h-4" />
						{error}
					</p>
				{/if}
			</div>

			<div>
				<p class="text-sm font-medium text-zinc-400 mb-3 block">Task type</p>
				<div class="grid grid-cols-2 gap-2">
					<button
						onclick={() => (taskType = 'study')}
						class="px-3 py-2 rounded-xl text-sm border transition-all duration-200 {taskType ===
						'study'
							? 'bg-violet-600/20 border-violet-500 text-violet-200'
							: 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:text-zinc-200 hover:border-zinc-600'}"
						type="button"
					>
						Study
					</button>
					<button
						onclick={() => (taskType = 'other')}
						class="px-3 py-2 rounded-xl text-sm border transition-all duration-200 {taskType ===
						'other'
							? 'bg-amber-600/20 border-amber-500 text-amber-200'
							: 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:text-zinc-200 hover:border-zinc-600'}"
						type="button"
					>
						Other
					</button>
				</div>
			</div>

			<div>
				<!-- svelte-ignore a11y_label_has_associated_control -->
				<label class="text-sm font-medium text-zinc-400 mb-3 block">Choose a color</label>
				<div class="flex flex-wrap gap-2">
					{#each colors as color}
						<button
							onclick={() => (selectedColor = color.value)}
							class="w-9 h-9 rounded-xl transition-all duration-200 hover:scale-110 relative {selectedColor ===
							color.value
								? 'ring-2 ring-offset-2 ring-offset-zinc-900 ring-zinc-400 scale-110'
								: 'hover:ring-2 hover:ring-offset-2 hover:ring-offset-zinc-900 hover:ring-zinc-600'}"
							style="background-color: {color.value}; box-shadow: 0 0 15px {color.value}40;"
							title={color.name}
						>
							{#if selectedColor === color.value}
								<Check
									class="w-5 h-5 text-white absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 drop-shadow-lg"
								/>
							{/if}
						</button>
					{/each}
				</div>
			</div>

			<div class="flex gap-2 pt-2">
				<Button variant="success" class="flex-1" onclick={addTask}>Create Task</Button>
				<Button
					variant="outline"
					onclick={() => {
						isAdding = false;
						error = '';
						taskName = '';
					}}
				>
					Cancel
				</Button>
			</div>
		</div>
	{/if}
</div>
