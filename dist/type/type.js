import { equals, clone } from '@fyn-software/core/extends';
const baseConfig = { getter: v => v, setter: v => v, value: null };
export default class Type extends EventTarget {
    constructor(defaults = {}, value = undefined) {
        super();
        this.value = null;
        const config = { ...baseConfig, ...defaults, ...this.constructor.config };
        value ?? (value = config['value']);
        Object.defineProperty(config, 'value', {
            get: () => this.__get(this.$.getter.apply(this, [this.value])),
            set: v => this.value = this.__set(this.$.setter.apply(this, [v])),
            enumerable: true,
            configurable: false,
        });
        this.config = config;
        this.$.value = value;
    }
    [Symbol.toPrimitive](hint) {
        return this.$.value;
    }
    get [Symbol.toStringTag]() {
        return 'Type';
    }
    get $() {
        return this.config;
    }
    __get(v) {
        return v;
    }
    __set(v) {
        return v;
    }
    async setValue(v) {
        const old = this.value;
        this.$.value = await v;
        if (equals(old, this.value) === false) {
            this.emit('changed', { old, new: this.$.value });
        }
        return v;
    }
    static get(cb) {
        return this._configure('getter', cb);
    }
    static set(cb) {
        return this._configure('setter', cb);
    }
    static default(value) {
        return this._configure('value', value);
    }
    static _configure(name, value) {
        var _a;
        const owner = this;
        const self = this.hasOwnProperty('__configurator__')
            ? this
            : (_a = class extends owner {
                },
                _a.config = clone(owner.config),
                _a);
        self.config[name] = value;
        return self;
    }
    static get Any() {
        return Any;
    }
}
Type.config = {};
export class Any extends Type {
    constructor(value) {
        super({ value: null }, value);
    }
    static [Symbol.hasInstance]() {
        return true;
    }
}
