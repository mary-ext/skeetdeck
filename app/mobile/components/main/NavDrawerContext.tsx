import { createContext, useContext } from 'solid-js';

export interface NavDrawerContextObject {
	open: () => void;
}

export const NavDrawerContext = createContext<NavDrawerContextObject>();

export const useNavDrawer = () => {
	return useContext(NavDrawerContext)!;
};
