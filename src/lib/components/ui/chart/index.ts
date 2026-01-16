import Container from './ChartContainer.svelte';
import Tooltip from './ChartTooltip.svelte';

export { Container, Tooltip };

export type ChartConfig = {
	[key: string]: {
		label: string;
		color: string;
	};
};
