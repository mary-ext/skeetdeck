import { type ComponentProps, onCleanup } from 'solid-js';

export interface BlobImageProps extends Omit<ComponentProps<'img'>, 'src'> {
	src: Blob | string;
}

interface BlobObject {
	u: string;
	c: number;
}

const map = new WeakMap<Blob, BlobObject>();

const BlobImage = (props: BlobImageProps) => {
	const blob = () => {
		const src = props.src;

		if (typeof src === 'string') {
			return src;
		}

		let obj = map.get(src)!;
		if (!obj) {
			map.set(src, (obj = { u: URL.createObjectURL(src), c: 0 }));
		}

		obj.c++;

		onCleanup(() => {
			if (--obj.c < 1) {
				URL.revokeObjectURL(obj.u);
				map.delete(src);
			}
		});

		return obj.u;
	};

	return <img {...props} src={blob()} />;
};

export default BlobImage;
