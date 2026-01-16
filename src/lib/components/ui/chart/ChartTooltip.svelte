<script lang="ts">
	import { Tooltip } from 'layerchart';
</script>

<Tooltip.Root let:data>
	<div class="bg-zinc-900 border border-zinc-700 rounded-lg shadow-xl text-sm px-3 py-2 space-y-1">
		{#if data}
			<div class="font-medium text-zinc-200">{data.timeSlot || data.x}</div>
			{#each Object.entries(data) as [key, value]}
				{#if key !== 'timeSlot' && key !== 'x' && typeof value === 'number' && value > 0}
					<div class="flex items-center gap-2 text-zinc-400">
						<span class="w-2 h-2 rounded-full" style="background-color: var(--color-{key})"></span>
						<span class="capitalize text-zinc-300">{Math.round(value)} min</span>
					</div>
				{/if}
			{/each}
		{/if}
	</div>
</Tooltip.Root>
