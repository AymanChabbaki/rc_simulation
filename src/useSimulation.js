import { useReducer, useCallback } from 'react';
import {
  makeInitialState, dropImage, testFin, computeMeasurements,
  CAL_V, CAL_A,
} from './simulation';

function reducer(state, action) {
  switch (action.type) {
    case 'RESET':
      return makeInitialState();

    case 'SHOW_CATEGORY': {
      const n = action.n; // 1,3,5,7
      const images = state.images.map(im => {
        if (im.selct !== 0) return im; // already placed, keep visible
        const inBatch = im.id === n || im.id === n + 1;
        return { ...im, vis: inBatch };
      });
      return { ...state, images };
    }

    case 'DROP_IMAGE':
      return dropImage(state, action.imgId, action.x, action.y);

    case 'SET_S1': {
      const s1 = action.value;
      const vg = s1 + 1;
      const next = testFin({ ...state, s1, vg });
      return computeMeasurements(next);
    }

    case 'SET_S2': {
      const s2 = action.value;
      const Res2 = s2 + 1;
      const next = testFin({ ...state, s2, Res2 });
      return computeMeasurements(next);
    }

    case 'SET_CALIBRE_V': {
      const Cv = action.value % CAL_V.length;
      const next = testFin({ ...state, Cv });
      return computeMeasurements(next);
    }

    case 'SET_CALIBRE_A': {
      const Ca = action.value % CAL_A.length;
      const next = testFin({ ...state, Ca });
      return computeMeasurements(next);
    }

    default:
      return state;
  }
}

export function useSimulation() {
  const [state, dispatch] = useReducer(reducer, undefined, makeInitialState);

  const reset       = useCallback(() => dispatch({ type: 'RESET' }), []);
  const showCategory = useCallback(n  => dispatch({ type: 'SHOW_CATEGORY', n }), []);
  const drop        = useCallback((id, x, y) => dispatch({ type: 'DROP_IMAGE', imgId: id, x, y }), []);
  const setS1       = useCallback(v  => dispatch({ type: 'SET_S1', value: v }), []);
  const setS2       = useCallback(v  => dispatch({ type: 'SET_S2', value: v }), []);
  const setCalibreV = useCallback(v  => dispatch({ type: 'SET_CALIBRE_V', value: v }), []);
  const setCalibreA = useCallback(v  => dispatch({ type: 'SET_CALIBRE_A', value: v }), []);

  return { state, reset, showCategory, drop, setS1, setS2, setCalibreV, setCalibreA };
}
