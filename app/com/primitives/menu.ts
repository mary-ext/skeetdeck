import button from './button.ts';

export const content = () => {
	return 'flex w-full max-w-md max-h-[80%] flex-col overflow-hidden rounded-t-md bg-background pt-1 align-middle shadow-xl sm:rounded-md';
};

export const title = () => {
	return 'px-4 py-3 font-bold shrink-0';
};

export const item = () => {
	return 'flex cursor-pointer items-center gap-4 px-4 py-3 text-left text-sm outline-2 -outline-offset-2 outline-primary hover:bg-hinted focus-visible:outline disabled:pointer-events-none disabled:opacity-50';
};

const cancelBase = button({ variant: 'outline', class: 'mx-4 mt-3 mb-6 justify-center shrink-0 sm:mb-4' });

export const cancel = () => {
	return cancelBase;
};
