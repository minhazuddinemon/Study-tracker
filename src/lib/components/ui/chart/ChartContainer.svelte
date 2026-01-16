<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { ChartConfig } from './index';

	interface Props {
		config: ChartConfig;
		children: Snippet;
		class?: string;
	}

	let { config, children, class: className = '' }: Props = $props();

	// Generate CSS variables from config
	// svelte-ignore state_referenced_locally
		const cssVars = Object.entries(config).reduce(
		(acc, [key, value]) => {
			acc[`--color-${key}`] = value.color;
			return acc;
		},
		{} as Record<string, string>
	);
</script>

<div
	class="w-full h-75 {className}"
	style={Object.entries(cssVars)
		.map(([k, v]) => `${k}:${v}`)
		.join(';')}
>
	{@render children()}
</div>
