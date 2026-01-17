<script lang="ts">
	import { formatTimeShort } from '$lib/utils/time';

	interface BarSegment {
		key: string;
		label: string;
		color: string;
		value: number;
	}

	interface BarData {
		timeSlot: string;
		segments: BarSegment[];
		total: number;
	}

	interface Props {
		data: BarData[];
		maxValue: number;
		class?: string;
	}

	let { data, maxValue, class: className = '' }: Props = $props();

	let hoveredSegment = $state<{
		barIndex: number;
		segmentIndex: number;
		segment: BarSegment;
	} | null>(null);
	let tooltipPosition = $state<{ x: number; y: number }>({ x: 0, y: 0 });

	function handleMouseEnter(
		event: MouseEvent,
		barIndex: number,
		segmentIndex: number,
		segment: BarSegment
	) {
		hoveredSegment = { barIndex, segmentIndex, segment };
		updateTooltipPosition(event);
	}

	function handleMouseMove(event: MouseEvent) {
		if (hoveredSegment) {
			updateTooltipPosition(event);
		}
	}

	function handleMouseLeave() {
		hoveredSegment = null;
	}

	function updateTooltipPosition(event: MouseEvent) {
		tooltipPosition = { x: event.clientX, y: event.clientY };
	}

	function getBarHeight(value: number): number {
		return maxValue > 0 ? (value / maxValue) * 100 : 0;
	}

	function getSegmentBorderRadius(
		segmentIndex: number,
		totalSegments: number,
		_segments: BarSegment[]
	): string {
		// segments passed are already filtered to non-zero values
		const isFirst = segmentIndex === 0;
		const isLast = segmentIndex === totalSegments - 1;

		if (totalSegments === 1) {
			return '6px'; // All corners rounded
		}

		if (isFirst) {
			return '0 0 6px 6px'; // Bottom corners only
		}

		if (isLast) {
			return '6px 6px 0 0'; // Top corners only
		}

		return '0'; // No rounded corners for middle segments
	}
</script>

<div class="w-full {className}">
	<!-- Chart area - taller on mobile for better visibility -->
	<div class="flex items-end gap-2 sm:gap-3 px-2 h-70 sm:h-55">
		{#each data as bar, barIndex}
			<div class="flex-1 flex flex-col items-center h-full justify-end">
				<!-- Total time label on top -->
				{#if bar.total > 0}
					<span class="text-[10px] sm:text-xs text-zinc-400 font-medium mb-1">
						{formatTimeShort(bar.total * 60000)}
					</span>
				{/if}

				<!-- Bar container -->
				{#if bar.total > 0}
					{@const barHeightPercent = maxValue > 0 ? (bar.total / maxValue) * 100 : 0}
					{@const visibleSegments = bar.segments.filter((s) => s.value > 0)}
					<div
						class="w-full rounded-md overflow-hidden"
						style="height: {Math.max(barHeightPercent, 5)}%; min-height: 12px;"
					>
						{#each visibleSegments as segment, segmentIndex}
							{@const segmentPercent = (segment.value / bar.total) * 100}
							<!-- svelte-ignore a11y_no_static_element_interactions -->
							<div
								class="w-full cursor-pointer hover:brightness-110"
								style="height: {segmentPercent}%; background-color: {segment.color}; min-height: 4px;"
								onmouseenter={(e) => handleMouseEnter(e, barIndex, segmentIndex, segment)}
								onmousemove={handleMouseMove}
								onmouseleave={handleMouseLeave}
							></div>
						{/each}
					</div>
				{:else}
					<!-- Empty bar placeholder -->
					<div class="w-full h-1 bg-zinc-800 rounded-full"></div>
				{/if}

				<!-- X-axis label - smaller on mobile -->
				<span class="text-[10px] sm:text-xs text-zinc-500 mt-2 whitespace-nowrap">
					{bar.timeSlot.split('-')[0]}
				</span>
			</div>
		{/each}
	</div>

	<!-- Tooltip -->
	{#if hoveredSegment}
		<div
			class="fixed z-50 pointer-events-none bg-zinc-900 border border-zinc-700 rounded-lg shadow-xl px-3 py-2 text-sm"
			style="left: {tooltipPosition.x + 12}px; top: {tooltipPosition.y -
				10}px; transform: translateY(-100%);"
		>
			<div class="flex items-center gap-2">
				<div
					class="w-2.5 h-2.5 rounded-full"
					style="background-color: {hoveredSegment.segment.color};"
				></div>
				<span class="text-zinc-300 font-medium">{hoveredSegment.segment.label}</span>
			</div>
			<div class="text-zinc-400 mt-1">
				{formatTimeShort(hoveredSegment.segment.value * 60000)}
			</div>
		</div>
	{/if}
</div>
