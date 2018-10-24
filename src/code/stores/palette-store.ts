/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */

import { resizeImage } from "../utils/resize-image";
import { initialPalette } from "../data/initial-palette";
import { internalLibrary } from "../data/internal-library";
import { UndoRedo } from "../utils/undo-redo";
import { ImportActions } from "../actions/import-actions";
const uuid           = require("uuid");

// TODO: Maybe loadData goes into some other action-set
export const PaletteActions = Reflux.createActions(
  [
    "addToPalette", "selectPaletteIndex", "selectPaletteItem",
    "restoreSelection", "itemDropped", "update", "delete"
  ]
);

export const PaletteStore = Reflux.createStore({
  listenables: [PaletteActions, ImportActions],

  init() {
    this.initializeLibrary();
    this.initializePalette();
    // prepare a template for new library items
    this.blankMetadata = {
      source: "external",
      title: "blank",
      link: "",
      license: ""
    };
    this.imageMetadata = _.clone(this.blankMetadata, true);

    // due to import order issues wait to resolve UndoRedo
    setTimeout(() => {
      this.undoManger = UndoRedo.instance({debug: false});
    }, 1);
  },

  initializeLibrary() {
    this.library = {};
    return internalLibrary.map((node) =>
      this.addToLibrary(node));
  },

  initializePalette() {
    this.palette = [];
    for (const node of initialPalette) {
      this.addToPalette(node);
    }
    this.selectPaletteIndex(0);
    return this.updateChanges();
  },

  makeNodeSignature(node) {
    // 400 chars of a URL *might* be adequately unique,
    // but data urls are going to be more trouble.
    return node.image.substr(0, 400);
  },


  standardizeNode(node) {
    if (!node.image) { node.image = ""; }
    if (!node.key) { node.key = this.makeNodeSignature(node); }
    if (!node.uuid) { node.uuid = uuid.v4(); }
    return node.metadata || (node.metadata = _.clone(this.blankMetadata, true));
  },

  addToLibrary(node) {
    if (!this.inLibrary(node)) {
      this.standardizeNode(node);
      this.library[node.key] = node;
      resizeImage(node.image, dataUrl => node.image = dataUrl);
      return log.info(`library: ${this.library}`);
    }
  },

  onImport(data) {
    // reload the palette
    this.palette = [];
    if (data.palette) {
      for (let i = data.palette.length - 1; i >= 0; i--) {
        const p_item = data.palette[i];
        this.addToPalette(p_item);
      }
    }
    return this.updateChanges();
  },

  onUpdate(data) {
    if (this.selectedPaletteItem) {
      this.selectedPaletteItem = _.merge(this.selectedPaletteItem, data);
    } else {
      this.selectedPaletteItem = data;
    }
    return this.updateChanges();
  },

  onDelete(paletteItem) {
    if (paletteItem) {
      return this.undoManger.createAndExecuteCommand("deletePaletteItem", {
        execute: () => {
          this.removePaletteItem(paletteItem);
          return this.updateChanges();
        },
        undo: () => {
          this.addToPalette(paletteItem);
          return this.updateChanges();
        }
      }
      );
    }
  },

  addToPalette(node) {
    // PaletteItems always get added to library first
    this.addToLibrary(node);
    if (!this.inPalette(node)) {
      this.palette.push(node);
      this.moveToFront(this.palette.length - 1);
      return this.selectPaletteIndex(0);
    }
  },

  onAddToPalette(node) {
    return this.undoManger.createAndExecuteCommand("addPaletteItem", {
      execute: () => {
        this.addToPalette(node);
        return this.updateChanges();
      },
      undo:  () => {
        this.removePaletteItem(node);
        return this.updateChanges();
      }
    }
    );
  },


  onSelectPaletteIndex(index) {
    // @moveToFront(index) if we want to add the selected item to front
    this.selectPaletteIndex(index);
    return this.updateChanges();
  },

  onSelectPaletteItem(item) {
    const index = _.indexOf(this.palette, item);
    this.selectPaletteIndex(index);
    return this.updateChanges();
  },

  selectPaletteIndex(index) {
    const maxIndex = this.palette.length - 1;
    const effectiveIndex = Math.min(maxIndex, index);
    this.lastSelection = (this.selectedIndex = effectiveIndex);
    this.selectedPaletteItem  = this.palette[effectiveIndex];
    return this.selectedPaletteImage = this.selectedPaletteItem != null ? this.selectedPaletteItem.image : undefined;
  },

  onRestoreSelection() {
    if (this.lastSelection > -1) {
      this.selectPaletteIndex(this.lastSelection);
    } else { this.selectPaletteIndex(0); }
    return this.updateChanges();
  },

  onSetImageMetadata(image, metadata) {
    log.info("Set Image metadata called");
    this.addToLibrary(image);
    const libraryItem = this.inLibrary(image);
    if (libraryItem) {
      libraryItem.metadata = metadata;
      this.imageMetadata = libraryItem.metadata;
      return this.updateChanges();
    } else {
      return alert("cant find library item");
    }
  },

  removePaletteItem(item) {
    // Try to select the same index as the deleted item
    const i = _.indexOf(this.palette, item);
    this.palette = _.without(this.palette, item);
    return this.selectPaletteIndex(i);
  },

  moveToFront(index) {
    return this.palette.splice(0, 0, this.palette.splice(index, 1)[0]);
  },

  inPalette(node) {
    // node in Pallete is standardized, arg node not always
    return _.find(this.palette, {key: node.key || this.makeNodeSignature(node)});
  },

  findByUUID(uuid) {
    return _.find(this.palette, {uuid});
  },

  inLibrary(node) {
    return this.library[node.key];
  },

  updateChanges() {
    const data = {
      palette: this.palette,
      library: this.library,
      selectedPaletteIndex: this.selectedIndex,
      selectedPaletteItem: this.selectedPaletteItem,
      selectedPaletteImage: this.selectedPaletteImage,
      imageMetadata: this.imageMetadata
    };

    log.info(`Sending changes to listeners: ${JSON.stringify(data)}`);
    return this.trigger(data);
  }
});

export const PaletteMixin = {
  getInitialState() {
    return {
      palette: PaletteStore.palette,
      library: PaletteStore.library,
      selectedPaletteItem: PaletteStore.selectedPaletteItem,
      selectedPaletteIndex: PaletteStore.selectedPaletteIndex,
      selectedPaletteImage: PaletteStore.selectedPaletteImage,
      imageMetadata: PaletteStore.imageMetadata
    };
  },

  componentDidMount() {
    return this.paletteUnsubscribe = PaletteStore.listen(this.onPaletteChange);
  },

  componentWillUnmount() {
    return this.paletteUnsubscribe();
  },

  onPaletteChange(status) {
    return this.setState({
      palette: status.palette,
      library: status.library,
      selectedPaletteIndex: status.selectedPaletteIndex,
      selectedPaletteItem: status.selectedPaletteItem,
      selectedPaletteImage: status.selectedPaletteImage,
      imageMetadata: status.imageMetadata
    });
  }
};

