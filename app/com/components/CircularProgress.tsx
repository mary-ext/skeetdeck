export interface CircularProgressProps {
	size?: number;
}

const CircularProgress = (props: CircularProgressProps) => {
	return (
		<svg
			viewBox="0 0 32 32"
			class="animate-spin"
			style={`height:${props.size ?? 24}px;width:${props.size ?? 24}px`}
		>
			<circle cx="16" cy="16" fill="none" r="14" stroke-width="4" class="stroke-accent opacity-20" />
			<circle
				cx="16"
				cy="16"
				fill="none"
				r="14"
				stroke-width="4"
				stroke-dasharray="80px"
				stroke-dashoffset="60px"
				class="stroke-accent"
			/>
		</svg>
	);
};

export default CircularProgress;
