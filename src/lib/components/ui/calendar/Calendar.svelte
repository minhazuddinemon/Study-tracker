<script lang="ts">
	import { Calendar as CalendarPrimitive } from 'bits-ui';
	import { ChevronLeft, ChevronRight } from 'lucide-svelte';
	import { CalendarDate, type DateValue } from '@internationalized/date';

	interface Props {
		value?: CalendarDate;
		onValueChange?: (date: CalendarDate | undefined) => void;
		class?: string;
	}

	let { value = $bindable(), onValueChange, class: className = '' }: Props = $props();

	function normalizeDateValue(newValue: DateValue | undefined): CalendarDate | undefined {
		if (!newValue) return undefined;
		if (newValue instanceof CalendarDate) return newValue;
		return new CalendarDate(newValue.calendar, newValue.year, newValue.month, newValue.day);
	}

	function handleValueChange(newValue: DateValue | undefined) {
		const normalized = normalizeDateValue(newValue);
		value = normalized;
		onValueChange?.(normalized);
	}
</script>

<CalendarPrimitive.Root
	type="single"
	bind:value
	onValueChange={handleValueChange}
	weekdayFormat="short"
	class="rounded-lg border border-zinc-800 bg-zinc-900 p-3 {className}"
>
	{#snippet children({ months, weekdays })}
		<CalendarPrimitive.Header class="flex items-center justify-between pb-2">
			<CalendarPrimitive.PrevButton
				class="inline-flex size-8 items-center justify-center rounded-md hover:bg-zinc-800 transition-colors"
			>
				<ChevronLeft class="size-4 text-zinc-400" />
			</CalendarPrimitive.PrevButton>
			<CalendarPrimitive.Heading class="text-sm font-medium text-zinc-200" />
			<CalendarPrimitive.NextButton
				class="inline-flex size-8 items-center justify-center rounded-md hover:bg-zinc-800 transition-colors"
			>
				<ChevronRight class="size-4 text-zinc-400" />
			</CalendarPrimitive.NextButton>
		</CalendarPrimitive.Header>

		{#each months as month}
			<CalendarPrimitive.Grid class="w-full border-collapse">
				<CalendarPrimitive.GridHead>
					<CalendarPrimitive.GridRow class="flex w-full">
						{#each weekdays as weekday}
							<CalendarPrimitive.HeadCell class="w-9 text-xs font-normal text-zinc-500 text-center">
								{weekday}
							</CalendarPrimitive.HeadCell>
						{/each}
					</CalendarPrimitive.GridRow>
				</CalendarPrimitive.GridHead>
				<CalendarPrimitive.GridBody>
					{#each month.weeks as week}
						<CalendarPrimitive.GridRow class="flex w-full mt-1">
							{#each week as day}
								<CalendarPrimitive.Cell date={day} month={month.value} class="p-0 text-center">
									<CalendarPrimitive.Day
										class="inline-flex size-8 items-center justify-center rounded-md text-sm transition-colors
											hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-violet-500
											data-selected:bg-violet-600 data-selected:text-white
											data-disabled:text-zinc-600 data-disabled:pointer-events-none
											data-outside-month:text-zinc-600 data-outside-month:pointer-events-none
											data-today:border data-today:border-violet-500
											text-zinc-300"
									/>
								</CalendarPrimitive.Cell>
							{/each}
						</CalendarPrimitive.GridRow>
					{/each}
				</CalendarPrimitive.GridBody>
			</CalendarPrimitive.Grid>
		{/each}
	{/snippet}
</CalendarPrimitive.Root>
