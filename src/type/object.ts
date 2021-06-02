import Type from './type';

type ObjectConfig = { [key: string]: Constructor<IType>|ObjectConfig };
export type ObjectTemplate = { [key: string]: Constructor<IType> };
type ObjectValue = { [key: string]: IType };

const structure = Symbol('structure');

export default class extends Type
{
    public constructor(value: any)
    {
        super({ value: {}, template: {}, props: {} }, value);

        for(const k of Object.keys(this.$.template as ObjectConfig))
        {
            if(this.hasOwnProperty(k) === false)
            {
                Object.defineProperty(this, k, {
                    get: () => this.$.value[k],
                    set: v => this.$.value[k] = v,
                    configurable: false,
                    enumerable: true,
                });
            }
        }
    }

    protected __set(value: any)
    {
        if(value === null || value === undefined)
        {
            return value;
        }

        if(typeof value !== 'object')
        {
            value = {};
        }

        // NOTE(Chris Kruining) Make sure to copy in order to break references...
        const returnValue: ObjectValue = { ...value };

        // NOTE(Chris Kruining) Check and copy properties to internal value
        for(const [ k, v ] of Object.entries(this.$.template as ObjectTemplate))
        {
            const property = new v(value[k] ?? undefined);

            if((property instanceof v) === false)
            {
                throw new Error(`Type mismatch, expected instance of '${v.name}', got '${value[k]}' instead`);
            }

            if(returnValue.hasOwnProperty(k) === true)
            {
                if(Object.getOwnPropertyDescriptor(returnValue, k)?.configurable === false)
                {
                    returnValue[k] = value[k];

                    continue;
                }

                delete returnValue[k];
            }

            property.on({
                changed: d => {
                    this.emit('changed', { ...d, property: k });
                },
            });

            Object.defineProperty(returnValue, k, {
                get: () => property.$.value,
                set: v => property.setValue(v),
                configurable: false,
                enumerable: true,
            });

            Object.defineProperty(this.$.props, k, {
                value: property,
                configurable: true,
                enumerable: true,
            });
        }

        // copy over the models getters to the internal value
        for(const [ name, descriptor ] of Object.entries(Object.getOwnPropertyDescriptors<ObjectTemplate>(this.$.template)))
        {
            if(descriptor.get === undefined)
            {
                continue;
            }

            Object.defineProperty(returnValue, name, descriptor);
        }

        return returnValue;
    }

    public [Symbol.toPrimitive](hint: string): object
    {
        switch (hint)
        {
            case 'transferable':
            case 'clone':
            default:
            {
                return Object.freeze(
                    Object.fromEntries(
                        Object
                            .keys(this.$.template)
                            .map(k => [ k, this.$.props[k][Symbol.toPrimitive](hint) ])
                    )
                );
            }
        }
    }

    public get [Symbol.toStringTag]()
    {
        return `${super[Symbol.toStringTag]}.Object`;
    }

    public static get [Symbol.iterator]()
    {
        return Object.entries(this);
    }

    public static define(template: ObjectConfig): TypeConstructor
    {
        for(const [ key, item ] of Object.entries(template))
        {
            if(((item as Constructor<IType>).prototype instanceof Type) === false && typeof item === 'object')
            {
                template[key] = this.define(item);
            }
        }

        return this._configure('template', template);
    }

    public static [Symbol.hasInstance](v: object): boolean
    {
        if(this.hasOwnProperty(structure) === false)
        {
            return typeof v === 'object';
        }

        return true;
    }
}