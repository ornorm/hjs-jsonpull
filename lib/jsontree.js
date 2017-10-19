/** @babel */
import {
    ERROR,
    NEED_MORE_INPUT,
    START_OBJECT,
    END_OBJECT,
    START_ARRAY,
    END_ARRAY,
    FIELD_NAME,
    VALUE_STRING,
    VALUE_INT,
    VALUE_DOUBLE,
    VALUE_TRUE,
    VALUE_FALSE,
    VALUE_NULL,
    EOF} from './io';

const TREE_CHANGE_LISTENERS = [];

export class TreeChangeListener {

    constructor({ onTreeChange = null } = {}) {
        if (onTreeChange !== null) {
            this.onTreeChange = onTreeChange;
        }
    }

    onTreeChange(tree, node) {

    }

}

export class JsonTreeNavigator {

    constructor({ accept = null } = {}) {
        if (accept !== null) {
            this.accept = accept;
        }
    }

    accept(parent, child, key) {
        return false;
    }

    canVisit(node) {
        return this.isArray(node) ? START_ARRAY : this.isPlainObject(node) ? START_OBJECT : VALUE_NULL;
    }

    isArray(o) {
        return Array.isArray(o);
    }

    isPlainObject(o) {
        return typeof o === 'object';
    }

    iterate(parent, child, key) {
        let flags = this.canVisit(child);
        return flags !== VALUE_NULL && !this.traverse(parent, child, flags, key) ? false : true;
    }

    visit(tree) {
        if (tree === null) {
            throw new ReferenceError('NullPointerException');
        }
        this.isArray(tree) ? this.traverseArray(tree) : this.traverseObject(tree);
    }

    traverse(parent, child, flags, key) {
        let accepted = this.accept(parent, child, key);
        if (accepted) {
            flags === START_ARRAY ?
                this.traverseArray(child) :
                this.traverseObject(child);
        }
        return accepted;
    }

    traverseArray(parent) {
        for (let key=0; key<parent.length; key++) {
            if (!this.iterate(parent, parent[key], key)) {
                break;
            }
        }
    }

    traverseObject(parent) {
        let keys = Object.keys(parent);
        for (const key of keys) {
            if (!this.iterate(parent, parent[key], key)) {
                break;
            }
        }
    }

}

export class JsonTree {

    constructor({ buffer = null }) {
        this.buffer = buffer;
        this.tree = null;
    }

    static addTreeChangeListener(treeChangeListener) {
        let index = TREE_CHANGE_LISTENERS.indexOf(treeChangeListener);
        if (index === -1) {
            TREE_CHANGE_LISTENERS.push(treeChangeListener);
        }
    }

    static createTreeNode(event, parent=null, tree = null) {
        const node = event === START_OBJECT ? {} : [];
        node.getParent = function() { return parent; };
        node.getTreeRoot = function() { return tree || this; };
        node.isArray = function () { return Array.isArray(this); };
        node.isObject = function () { return !this.isArray(); };
        node.parse = function (event, parser, tree = null) {
            let key;
            let value;
            let leave = false;
            while (!leave) {
                switch (event = parser.nextEvent()) {
                    case START_ARRAY:
                    case START_OBJECT:
                        let child = JsonTree.createTreeNode(event, this, tree);
                        if (this.isArray()) {
                            this.push(child);
                        } else {
                            this[key] = child;
                        }
                        child.parse(event, parser, tree);
                        break;
                    case END_ARRAY:
                    case END_OBJECT:
                    case ERROR:
                    case EOF:
                        leave = true;
                        break;
                    default :
                        if (event === FIELD_NAME) {
                            key = parser.getCurrentString();
                        } else {
                            switch (event) {
                                case VALUE_STRING:
                                    value = parser.getCurrentString();
                                    break;
                                case VALUE_INT:
                                    value = parser.getCurrentInt();
                                    break;
                                case VALUE_DOUBLE:
                                    value = parser.getCurrentDouble();
                                    break;
                                case VALUE_TRUE:
                                    value = true;
                                    break;
                                case VALUE_FALSE:
                                    value = false;
                                    break;
                                case VALUE_NULL:
                                    value = null;
                                    break;
                            }
                            if (this.isArray()) {
                                this.push(value);
                            } else {
                                this[key] = value;
                            }
                        }
                        break;
                }
            }
        };
        node.toString = function () {
            return JSON.stringify(this, null, 4);
        };
        node.notifyChange = function() {
            JsonTree.notifyTreeChange(this.getTreeRoot(), this);
        };
        return node;
    }

    getTree() {
        return this.tree;
    }

    isEmpty() {
        return this.tree === null;
    }

    static notifyTreeChange(tree, node) {
        for (const listener of TREE_CHANGE_LISTENERS) {
            listener.onTreeChange(tree, node);
        }
    }

    parse(parser) {
        let pos = 0;
        let event = 0;
        let buffer = this.buffer;
        let stream = parser.getStream();
        while ((event = parser.nextEvent()) === NEED_MORE_INPUT) {
            pos += stream.read(buffer, pos, buffer.length - pos);
            if (pos === buffer.length) {
                stream.done();
            }
        }
        let tree = JsonTree.createTreeNode(event);
        tree.parse(event, parser, tree);
        this.setTree(tree);
    }

    setTree(tree) {
        this.tree = tree;
    }

    toString() {
        return JSON.stringify(this.tree, null, 4);
    }

    static removeTreeChangeListener(treeChangeListener) {
        let index = TREE_CHANGE_LISTENERS.indexOf(treeChangeListener);
        if (index !== -1) {
            TREE_CHANGE_LISTENERS.splice(index, 1);
        }
    }

    write(writer) {

    }

}