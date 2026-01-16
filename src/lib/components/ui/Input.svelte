<script lang="ts">
	import { tv, type VariantProps } from 'tailwind-variants';

	const input = tv({
		base: 'w-full rounded-xl border bg-zinc-900 px-4 py-3 text-zinc-100 placeholder-zinc-500 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-zinc-950',
		variants: {
			variant: {
				default: 'border-zinc-800 focus:border-violet-500 focus:ring-violet-500',
				error: 'border-red-500 focus:border-red-500 focus:ring-red-500'
			}
		},
		defaultVariants: {
			variant: 'default'
		}
	});

	type InputVariants = VariantProps<typeof input>;

	interface Props {
		variant?: InputVariants['variant'];
		class?: string;
		type?: string;
		placeholder?: string;
		value?: string;
		disabled?: boolean;
		onkeydown?: (e: KeyboardEvent) => void;
		inputRef?: HTMLInputElement | null;
	}

	let {
		variant = 'default',
		class: className = '',
		type = 'text',
		placeholder = '',
		value = $bindable(''),
		disabled = false,
		onkeydown,
		inputRef = $bindable(null)
	}: Props = $props();
</script>

<input
	{type}
	{placeholder}
	{disabled}
	bind:value
	class={input({ variant, class: className })}
	bind:this={inputRef}
	{onkeydown}
/>
