<script lang="ts">
	import { tv, type VariantProps } from 'tailwind-variants';

	const button = tv({
		base: 'inline-flex items-center justify-center gap-2 rounded-xl font-medium transition-all duration-200 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-900 disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed',
		variants: {
			variant: {
				default: 'bg-violet-600 text-white hover:bg-violet-700 focus-visible:ring-violet-500',
				secondary: 'bg-zinc-800 text-zinc-100 hover:bg-zinc-700 focus-visible:ring-zinc-500',
				outline:
					'border border-zinc-700 bg-transparent text-zinc-100 hover:bg-zinc-800 focus-visible:ring-zinc-500',
				ghost: 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 focus-visible:ring-zinc-500',
				success: 'bg-emerald-600 text-white hover:bg-emerald-700 focus-visible:ring-emerald-500',
				danger: 'bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-500'
			},
			size: {
				sm: 'h-9 px-3 text-sm',
				default: 'h-11 px-5 text-sm',
				lg: 'h-14 px-8 text-base',
				icon: 'h-10 w-10'
			}
		},
		defaultVariants: {
			variant: 'default',
			size: 'default'
		}
	});

	type ButtonVariants = VariantProps<typeof button>;

	interface Props {
		variant?: ButtonVariants['variant'];
		size?: ButtonVariants['size'];
		class?: string;
		disabled?: boolean;
		type?: 'button' | 'submit' | 'reset';
		onclick?: (e: MouseEvent) => void;
		children?: import('svelte').Snippet;
	}

	let {
		variant = 'default',
		size = 'default',
		class: className = '',
		disabled = false,
		type = 'button',
		onclick,
		children
	}: Props = $props();
</script>

<button {type} {disabled} class={button({ variant, size, class: className })} {onclick}>
	{@render children?.()}
</button>
