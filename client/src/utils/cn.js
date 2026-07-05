export const cn = (...classes) => classes.flat(Infinity).filter(Boolean).join(' ');
