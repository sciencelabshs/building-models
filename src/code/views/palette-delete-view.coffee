tr = require '../utils/translate'
PaletteDialogStore = require '../stores/palette-delete-dialog-store'
ImagePickerView = React.createFactory require './image-picker-view'

{div, span, i, img, button, a} = React.DOM

module.exports = React.createClass

  displayName: 'PaletteDeleteView'
  changePalette: (args) ->
    PaletteDialogStore.actions.select args

  cancel: ->
    @props.cancel?()

  ok: ->
    @props.ok?()

  showReplacement: ->
    @props.options.length > 0 and @props.paletteItemHasNodes

  renderArrow: ->
    if @showReplacement()
      (div {className: "vertical-content"},
        (i {className: 'arrow-div fa fa-arrow-right'})
      )

  renderReplacement: ->
    if @showReplacement()
      (div {className: "vertical-content"},
        (div {}, tr "~PALETTE-DIALOG.REPLACE")
        (ImagePickerView {
          nodes: @props.options or []
          selected: @props.replacement
          onChange: @changePalette
        })
      )

  renderPaletteItem: ->
    oldImage   = @props.paletteItem?.image
    (div {className: "vertical-content"},
      (div {}, tr "~PALETTE-DIALOG.DELETE")
      if oldImage
        (img {src: oldImage})
    )

  renderButtons: ->
    (div {className: "vertical-content buttons"},
      (div {},
        (button {className: 'button ok', onClick: @ok},
          (i {className: "fa fa-trash"}),
           tr "~PALETTE-DIALOG.OK"
        )
      )
    )

  render: ->
    (div {className: 'palette-delete-view'},
      (div {className: 'horizontal-content'},
        @renderPaletteItem()
        @renderArrow()
        @renderReplacement()
        @renderButtons()
      )
      (div {className: "cancel"},
        (a {onClick: @cancel}, tr "~PALETTE-DIALOG.CANCEL")
      )
    )
