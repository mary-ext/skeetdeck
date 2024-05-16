import type { ViewKind, ViewParams } from '../contexts/router';

const ChannelView = ({ id }: ViewParams<ViewKind.CHANNEL>) => {
	return <div>{id}</div>;
};

export default ChannelView;
