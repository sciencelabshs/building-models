import { DropZoneView } from "./dropzone-view";
const ImageDialogStore = require("../stores/image-dialog-store");

const tr = require("../utils/translate");

module.exports = React.createClass({
  displayName: "MyComputer",

  mixins: [ ImageDialogStore.mixin, require("../mixins/image-dialog-view")],

  previewImage(e) {
    e.preventDefault();
    const { files } = this.refs.file;
    if (files.length === 0) {
      alert(tr("~IMAGE-BROWSER.PLEASE_DROP_FILE"));
    } else if (this.hasValidImageExtension(files[0].name)) {
      const title = (files[0].name.split("."))[0];
      const reader = new FileReader();
      reader.onload = e => {
        return this.imageSelected({
          image: reader.result,
          title,
          metadata: {
            title,
            source: "external"
          }
        });
      };
      reader.readAsDataURL(files[0]);
    }
  },

  render() {
    return (
      <div className="my-computer-dialog">
        {this.state.selectedImage
          ? this.renderPreviewImage()
          : <div>
              <DropZoneView header={tr("~IMAGE-BROWSER.DROP_IMAGE_FROM_DESKTOP")} dropped={this.imageDropped} />
              <p>{tr("~IMAGE-BROWSER.CHOOSE_FILE")}</p>
              <p><input ref="file" type="file" onChange={this.previewImage} /></p>
            </div>}
      </div>
    );
  }
});
