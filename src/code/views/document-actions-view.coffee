{div, span, i, br} = React.DOM
AboutView        = React.createFactory require './about-view'
AppSettingsStore = require '../stores/app-settings-store'
CodapStore       = require '../stores/codap-store'
LaraStore        = require '../stores/lara-store'
UndoRedoUIStore  = require '../stores/undo-redo-ui-store'
tr               = require '../utils/translate'

SimulationRunPanel = React.createFactory require './simulation-run-panel-view'

module.exports = React.createClass

  mixins: [ CodapStore.mixin, LaraStore.mixin, UndoRedoUIStore.mixin, AppSettingsStore.mixin ]

  displayName: 'DocumentActions'

  componentDidMount: ->
    isTouchDevice = "ontouchstart" in document.documentElement # works on console, not in here
    deleteFunction = @props.graphStore.deleteSelected.bind @props.graphStore
    @props.graphStore.selectionManager.addSelectionListener (manager) =>
      selectedNodes     = manager.getNodeInspection() or []
      selectedLinks      = manager.getLinkInspection() or []

      @setState
        selectedNodes: selectedNodes
        selectedLinks: selectedLinks
        selectedItems: selectedNodes.concat selectedLinks
        touchDevice: isTouchDevice

  undoClicked: ->
    @props.graphStore.undo()

  redoClicked: ->
    @props.graphStore.redo()

  deleteClicked: ->
    if @state.lockdown
      # Only allow deletion of links in lockdown mode
      @props.graphStore.removeSelectedLinks()
    else
      @props.graphStore.deleteSelected()
    # Clear stored selections after delete
    @props.graphStore.selectionManager.clearSelection()

  renderRunPanel: ->
    if not @props.diagramOnly
      (SimulationRunPanel {})

  render: ->
    showDeleteUI = !@state.uiElements.inspectorPanel # add this in once we find a reliable way to detect if a device is a touch device && @state.touchDevice
    buttonClass = (enabled) -> if not enabled then 'disabled' else ''
    (div {className: 'document-actions'},
      (div {className: "misc-actions"},
        @renderRunPanel()
      )
      unless @state.hideUndoRedo
        (div {className: 'misc-actions'},
          # In Lockdown mode only show the Delete button when we have a link selected
          showDeleteUI && @state.lockdown && @state.selectedLinks && @state.selectedLinks.length > 0 && (i {className: "icon-codap-trash", onClick: @deleteClicked})
          # In normal operation, show the Delete button whenever we have a node or relationship selected
          showDeleteUI && !@state.lockdown && @state.selectedItems && @state.selectedItems.length > 0 && (i {className: "icon-codap-trash", onClick: @deleteClicked})
          (i {className: "icon-codap-arrow-undo #{buttonClass @state.canUndo}", onClick: @undoClicked, disabled: not @state.canUndo})
          (i {className: "icon-codap-arrow-redo #{buttonClass @state.canRedo}", onClick: @redoClicked, disabled: not @state.canRedo})
        )

      (AboutView {})
    )
