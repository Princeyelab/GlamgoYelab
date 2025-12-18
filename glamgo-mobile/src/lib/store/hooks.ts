import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';
import type { RootState, AppDispatch } from './index';

/**
 * Hooks Redux typés pour TypeScript
 * Utiliser ces hooks au lieu de useDispatch/useSelector classiques
 */

// Hook dispatch typé
export const useAppDispatch = () => useDispatch<AppDispatch>();

// Hook selector typé
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
