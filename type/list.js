import item from '../../suite/js/common/navigation/item.js';
import Type from './type.js';

export default class List extends Type
{
    #queue = [];

    constructor(value)
    {
        super({ value: [], type: Type.Any }, value);
    }

    __set(v)
    {
        if(Array.isArray(v) === false)
        {
            if(typeof v[Symbol.iterator] === 'function')
            {
                v = Array.from(v);
            }
            else if(typeof v[Symbol.asyncIterator] === 'function')
            {
                return Array.fromAsync(v).then(v => this.__set(v));
            }
            else
            {
                throw new Error(`Expected an 'Array', got '${v.constructor.name}'`);
            }
        }

        if(this.type !== null && v.some(i => (i instanceof this.type) === false))
        {
            throw new Error(`Not all items are of type '${this.type.name}'`);
        }

        v = this.normalize(v);

        for(const type of v)
        {
            type.on({
                changed: d => this.emit('changed', d),
            })
        }

        return new Proxy(v, {
            get: (target, property) => {
                if (typeof property === 'string' && Number.isInteger(Number.parseInt(property)) && target[property] instanceof Type)
                {
                    return target[property] && target[property].value;
                }

                switch (property)
                {
                    case Symbol.iterator:
                        return target[property].bind(target);

                    case Symbol.asyncIterator:
                        console.trace(property);

                        return this[property].bind(this);

                    case 'groupBy':
                        return k => this.value.reduce(
                            (t, i) => {
                                (t[i[k]] = t[i[k]] || []).push(i);

                                return t;
                            },
                            {}
                        );

                    case 'push':
                    case 'unshift':
                        return this.typeCheck(target, property);

                    case 'first':
                    case 'last':
                        return target[property].value;

                    default:
                        return target[property];
                }
            },
        });
    }

    get [Symbol.toStringTag]()
    {
        return `${super[Symbol.toStringTag]}.List`;
    }

    filter(callback)
    {
        this.#queue.push([ 'filter', callback ]);

        return this;
    }

    map(callback)
    {
        this.#queue.push([ 'map', callback ]);

        return this;
    }

    typeCheck(target, method)
    {
        return (...items) => {
            if(items.some(i => (i instanceof this.type) === false))
            {
                throw new Error(`Not all items are of type '${this.type.name}'`);
            }

            return target[method].apply(target, this.normalize(items));
        }
    }

    normalize(items)
    {
        // console.trace(this.type, items);

        return items.map(i => i && i[Symbol.toStringTag] !== undefined ? i : new this.type(i));
    }

    static [Symbol.hasInstance](v)
    {
        return Array.isArray(v) || v.constructor === this;
    }

    get [Symbol.iterator]()
    {
        return this.value[property].bind(this.value);
    }

    async *[Symbol.asyncIterator]()
    {
        outer:
        for(let item of this.value.map(i => i.value))
        {
            for(const [method, callback] of this.#queue)
            {
                switch (method)
                {
                    case 'filter':
                        if(Boolean(await callback(item)) === false)
                        {
                            continue outer;
                        }

                        break;

                    case 'map':
                        item = await callback(item);

                        break;
                }
            }

            yield item;
        }

        this.#queue = [];
    }

    static type(t)
    {
        if((t.prototype instanceof Type) === false)
        {
            throw new Error(`expected '${Type.name}' got '${t.name}' instead`);
        }

        return this._configure('type', t);
    }
}