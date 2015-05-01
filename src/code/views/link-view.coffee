Node             = React.createFactory require './node-view'
Importer         = require '../utils/importer'
NodeList         = require '../models/link-manager'
DiagramToolkit   = require '../utils/js-plumb-diagram-toolkit'
DropImageHandler = require '../utils/drop-image-handler'

{div} = React.DOM

module.exports = React.createClass

  displayName: 'LinkView'

  componentDidMount: ->
    $container = $(@refs.container.getDOMNode())

    @diagramToolkit = new DiagramToolkit $container,
      Container: $container[0],
      handleConnect: @handleConnect
      handleClick: @handleClick
    @_updateToolkit()

    @props.linkManager.addLinkListener @
    @props.linkManager.addNodeListener @

    $container.droppable
      accept: '.proto-node'
      hoverClass: "ui-state-highlight"
      drop: @addNode

    @dropImageHandler = new DropImageHandler
      maxWidth: 100
      maxHeight: 100

  addNode: (e, ui) ->
    {title, image} = ui.draggable.data()
    offset = $(@refs.linkView.getDOMNode()).offset()
    @props.linkManager.importNode
      data:
        x: ui.offset.left - offset.left
        y: ui.offset.top - offset.top
        title: title
        image: image

  getInitialState: ->
    nodes: []
    links: []
    canDrop: false

  componentWillUpdate: ->
    @diagramToolkit?.clear?()

  componentDidUpdate: ->
    @_updateToolkit()

  handleEvent: (handler) ->
    if @ignoringEvents
      false
    else
      handler()
      true

  onNodeMoved: (node_event) ->
    @handleEvent =>
      @props.linkManager.moveNode node_event.nodeKey, node_event.extra.position, node_event.extra.originalPosition

  onNodeMoveComplete: (node_event) ->
    @handleEvent =>
      {left, top} = node_event.extra.position
      @props.linkManager.moveNodeCompleted node_event.nodeKey, node_event.extra.position, node_event.extra.originalPosition

  onNodeDeleted: (node_event) ->
    @handleEvent =>
      @props.linkManager.removeNode node_event.nodeKey

  handleConnect: (info, evnt) ->
    @handleEvent =>
      @props.linkManager.newLinkFromEvent info, evnt

  handleClick: (connection, evnt) ->
    @handleEvent =>
      @props.linkManager.selectLink connection.linkModel

  handleLinkAdd: (info, evnt) ->
    @setState links: @props.linkManager.getLinks()
    true

  handleLinkRm: ->
    @setState links: @props.linkManager.getLinks()
    false

  handleNodeAdd: (nodeData) ->
    @setState nodes: @props.linkManager.getNodes()
    true

  handleNodeMove: (nodeData) ->
    # TODO: PERF: we could look up the dom elem
    # for that node, and then just tell the
    # toolkit to repaint the links for that one elem...
    @setState nodes: @props.linkManager.getNodes()
    @diagramToolkit.repaint()
    true

  handleNodeRm: ->
    @setState nodes: @props.linkManager.getNodes()
    false

  # TODO, can we get rid of this?
  _nodeForName: (name) ->
    @refs[name]?.getDOMNode() or false

  _updateNodeValue: (name, key, value) ->
    changed = 0
    for node in @state.nodes
      if node.key is name
        node[key] = value
        changed++
    if changed > 0
      @setState nodes: @state.nodes

  _updateToolkit: ->
    if @.diagramToolkit
      @ignoringEvents = true
      @diagramToolkit.supspendDrawing()
      @_redrawLinks()
      @_redrawTargets()
      @diagramToolkit.resumeDrawing()
      @ignoringEvents = false

  _redrawTargets: ->
    @diagramToolkit.makeTarget $(@refs.linkView.getDOMNode()).find '.elm'

  _redrawLinks: ->
    for link in @state.links
      source = @_nodeForName link.sourceNode.key
      target = @_nodeForName link.targetNode.key
      if source and target
        sourceTerminal = if link.sourceTerminal is 'a' then 'Top' else 'Bottom'
        targetTerminal = if link.targetTerminal is 'a' then 'Top' else 'Bottom'
        @diagramToolkit.addLink source, target, link.title, link.color, sourceTerminal, targetTerminal, link

  onDragOver: (e) ->
    if not @state.canDrop
      @setState canDrop: true
    e.preventDefault()

  onDragLeave: (e) ->
    @setState canDrop: false
    e.preventDefault()

  onDrop: (e) ->
    @setState canDrop: false
    e.preventDefault()

    # figure out where to drop files
    offset = $(@refs.linkView.getDOMNode()).offset()
    dropPos =
      x: e.clientX - offset.left
      y: e.clientY - offset.top

    # get the files
    @dropImageHandler.handleDrop e, (file) =>
      @props.linkManager.importNode
        data:
          x: dropPos.x
          y: dropPos.y
          title: file.title
          image: file.image

  onContainerClicked: (e) ->
    if e.target is @refs.container.getDOMNode()
      # deselect links when background is clicked
      @props.linkManager.selectLink null

  render: ->
    (div {className: "link-view #{if @state.canDrop then 'can-drop' else ''}", ref: 'linkView', onDragOver: @onDragOver, onDrop: @onDrop, onDragLeave: @onDragLeave},
      (div {className: 'container', ref: 'container', onClick: @onContainerClicked},
        for node in @state.nodes
          (Node {
            key: node.key
            data: node
            selected: node.selected
            nodeKey: node.key
            ref: node.key
            onMove: @onNodeMoved
            onMoveComplete: @onNodeMoveComplete
            onDelete: @onNodeDeleted
            linkManager: @props.linkManager
          })
      )
    )


