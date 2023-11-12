import { type ComponentProps, onCleanup } from 'solid-js';

export interface BlobImageProps extends Omit<ComponentProps<'img'>, 'src'> {
	src: Blob | string;
}

interface BlobObject {
	url: string;
	uses: number;
}

const map = new WeakMap<Blob, BlobObject>();

const BlobImage = (props: BlobImageProps) => {
	const blob = () => {
		const src = props.src;

		if (typeof src === 'string') {
			return src;
		}

		let obj = map.get(src);

		if (!obj) {
			map.set(src, (obj = { url: URL.createObjectURL(src), uses: 0 }));
		}

		obj.uses++;

		onCleanup(() => {
			if (--obj!.uses < 1) {
				URL.revokeObjectURL(obj!.url);
				map.delete(src);
			}
		});

		return obj.url;
	};

	return <img {...props} src={blob()} />;
};

export default BlobImage;
