import Relation from './relation.js';
export default class OwnsOne<T extends IModel<T>> extends Relation<T> {
    static get many(): boolean;
}
//# sourceMappingURL=ownsOne.d.ts.map