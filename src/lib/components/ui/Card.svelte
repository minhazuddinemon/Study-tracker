<script lang="ts">
	import { tv, type VariantProps } from 'tailwind-variants';

	const card = tv({
		base: 'rounded-2xl border transition-all duration-300',
		variants: {
			variant: {
				default: 'bg-zinc-900 border-zinc-800',
				glass: 'bg-zinc-900/50 backdrop-blur-xl border-zinc-800/50',
				gradient: 'bg-gradient-to-br border-0'
			}
		},
		defaultVariants: {
			variant: 'default'
		}
	});

	type CardVariants = VariantProps<typeof card>;

	interface Props {
		variant?: CardVariants['variant'];
		class?: string;
		children?: import('svelte').Snippet;
	}

	let { variant = 'default', class: className = '', children }: Props = $props();
</script>

<div class={card({ variant, class: className })}>
	{@render children?.()}
</div>
