type ClassValue = string | false | null | undefined | Array<string | false | null | undefined>;

export const cn = (...classes: ClassValue[]): string => classes.flat(Infinity).filter(Boolean).join(' ');
