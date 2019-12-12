import Type from './type.js';

const properties = Symbol('properties');
const keys = Symbol('keys');
const values = Symbol('values');

export default class Enum extends Type
{
    constructor(value)
    {
        super({ value: null, template: null, enum: true }, value);
    }

    __set(v)
    {
        if(v === null)
        {
            return v;
        }

        if(typeof v === 'string' && this.constructor[values].has(v))
        {
            v = this.constructor[values].get(v);
        }

        if((v instanceof this.constructor) === false)
        {
            const k = Array.from(this.constructor[keys].values(), k => `'${k}'`);

            throw new Error(`'${v}' is not a value of this Enum, expected one of [${k}]`);
        }

        return v;
    }

    get [Symbol.toStringTag]()
    {
        return `${super[Symbol.toStringTag]}.Enum`;
    }

    static [Symbol.hasInstance](v)
    {
        return (typeof v === 'symbol' && this[keys].has(v)) || v !== null && v.constructor === this;
    }

    static define(template)
    {
        const self = this._configure('template', Object.seal({ ...template }));

        self[Symbol.iterator] = function*(){
            for(const [k, v] of Object.entries(self[properties]))
            {
                v.value = k;

                yield v;
            }
        };
        self.prototype[Symbol.iterator] = self[Symbol.iterator];
        self[properties] = template;
        self[keys] = new Map();
        self[values] = new Map();

        for(const k of Object.keys(template))
        {
            const s = Symbol(k);

            self[keys].set(s, k);
            self[values].set(k, s);

            Object.defineProperty(self, k, { value: s });
        }

        return self;
    }

    static valueOf(k)
    {
        // console.log(this.passed, k);

        return this[properties][this[keys].get(k)];
    }
}