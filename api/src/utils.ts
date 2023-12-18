const collator = new Intl.Collator(undefined, { numeric: true });

export function compareObjects(a = {}, b = {}, properties: (string | string[])[], order: ('ASC' | 'DESC')[] = []) {
    function getField(obj: any, prop: string | string[]): string {
        if (typeof prop === 'string')
            return (obj[prop] ?? ' ').toString()
        if (prop.length === 1)
            return (obj[prop[0]] ?? ' ').toString()
        return getField(obj[prop[0]] ?? {}, prop.slice(1))
    }
    for (let i = 0; i < properties.length; i++) {
        let result = collator.compare(getField(a, properties[i]), getField(b, properties[i])) * (order[i] === 'DESC' ? -1 : 1)
        if (result)
            return result
    }
    return 0;
}

export function groupBy<T>(array: T[], key: string): T[][] {
    return array.reduce<T[][]>((rv, x) => {
        (rv[x[key]] = rv[x[key]] || []).push(x);
        return rv;
    }, []);
}

export function removeDuplicates(array: any[], key: string) {
    return Object.entries<any[]>(groupBy(array, key)).map(entry => entry[0] ? [entry[1][0]] : entry[1]).flat(2);
}
