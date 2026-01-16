<script lang="ts">
	interface Props {
		value: number;
		max?: number;
		class?: string;
		color?: string;
	}

	let { value, max = 100, class: className = '', color = '#8b5cf6' }: Props = $props();

	const percentage = $derived(Math.min(100, Math.max(0, (value / max) * 100)));
</script>

<div class="w-full h-2 bg-zinc-800 rounded-full overflow-hidden {className}">
	<div
		class="h-full rounded-full transition-all duration-500 ease-out"
		style="width: {percentage}%; background-color: {color};"
	></div>
</div>
