/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */

import { SimulationActions, SimulationMixin } from "../stores/simulation-store";
import { AppSettingsStore, AppSettingsMixin } from "../stores/app-settings-store";
import { tr } from "../utils/translate";

export const NodeValueInspectorView = React.createClass({

  displayName: "NodeValueInspectorView",

  mixins: [ SimulationMixin, AppSettingsMixin ],

  propTypes: {
    max: React.PropTypes.number,
    min: React.PropTypes.number,
    onChange: React.PropTypes.func
  },

  getInitialState() {
    return {
      "editing-min": false,
      "editing-max": false,
      "min-value": this.props.node.min,
      "max-value": this.props.node.max
    };
  },

  componentWillReceiveProps(nextProps) {
    // min and max are copied to state to disconnect the state and property, so
    // that we can set the text field and only update the model when the input field
    // is blured. This way we don't perform min/max validation while user is typing
    return this.setState({
      "min-value": nextProps.node.min,
      "max-value": nextProps.node.max
    });
  },

  trim(inputValue) {
    return Math.max(this.props.node.min, Math.min(this.props.node.max, inputValue));
  },

  updateValue(evt) {
    let value;
    if (this.state.modelIsRunning && !this.props.node.canEditValueWhileRunning()) {
      // don't do anything; effectively disables slider
      return;
    }

    if (value = evt.target.value) {
      value = this.trim(parseInt(value, 10));
      return this.props.graphStore.changeNode({initialValue: value});
    }
  },

  updateAccumulatorChecked(evt) {
    const value = evt.target.checked;
    this.props.graphStore.changeNode({isAccumulator: value});
    return SimulationActions.toggledCollectorTo(value);
  },

  updateNegativeValuesAllowed(evt) {
    const value = evt.target.checked;
    return this.props.graphStore.changeNode({allowNegativeValues: value});
  },

  updateDefiningType() {
    return this.props.graphStore.changeNode({valueDefinedSemiQuantitatively: !this.props.node.valueDefinedSemiQuantitatively});
  },

  selectText(evt) {
    return evt.target.select();
  },

  renderEditableProperty(property, classNames) {
    const swapState = () => {
      // first copy state value to model if we were editing
      if (this.state[`editing-${property}`]) {
        this.props.graphStore.changeNodeProperty(property, this.state[`${property}-value`]);
      }
      return this.setState({[`editing-${property}`]: !this.state[`editing-${property}`]}, function() {
        return (this.refs.focusable != null ? this.refs.focusable.focus() : undefined);
      });
    };

    const updateProperty = evt => {
      // just update internal state while typing
      const value = parseInt(evt.target.value, 10);
      if (value != null) { return this.setState({[`${property}-value`]: value}); }
    };

    const keyDown = (evt) => {
      if (evt.key === "Enter") {
        return swapState();
      }
    };

    if (!this.state[`editing-${property}`]) {
      return <div className={`half small editable-prop ${classNames}`} onClick={swapState}>{this.state[`${property}-value`]}</div>;
    } else {
      return (
        <input
          className={`half small editable-prop ${classNames}`}
          type="number"
          value={this.state[`${property}-value`]}
          onChange={updateProperty}
          onBlur={swapState}
          onKeyDown={keyDown}
          ref="focusable"
        />
      );
    }
  },

  renderMinAndMax(node) {
    if (node.valueDefinedSemiQuantitatively) {
      return (
        <div className="group full">
          <label className="left half small">{tr("~NODE-VALUE-EDIT.LOW")}</label>
          <label className="right half small">{tr("~NODE-VALUE-EDIT.HIGH")}</label>
        </div>
      );
    } else {
      return (
        <div className="group full">
          {this.renderEditableProperty("min", "left")}
          {this.renderEditableProperty("max", "right")}
        </div>
      );
    }
  },

  renderCollectorOptions(node) {
    if (this.state.simulationType !== AppSettingsStore.SimulationType.time) {
      return null;
    }

    const isChecked = !this.state.capNodeValues && node.allowNegativeValues;
    const tooltip = this.state.capNodeValues
      ? tr("~NODE-VALUE-EDIT.RESTRICT_POSITIVE_DISABLED_TOOLTIP")
      : (isChecked
        ? tr("~NODE-VALUE-EDIT.RESTRICT_POSITIVE_CHECKED_TOOLTIP")
        : tr("~NODE-VALUE-EDIT.RESTRICT_POSITIVE_UNCHECKED_TOOLTIP"));
    const positiveCheckbox = (
      <label
        className={this.state.capNodeValues ? "disabled" : ""}
        title={tooltip}
        key="positive-label"
      >
        <input
          key="positive-checkbox"
          type="checkbox"
          checked={isChecked}
          disabled={this.state.capNodeValues}
          onChange={this.state.capNodeValues ? null : this.updateNegativeValuesAllowed}
        />
        {tr("~NODE-VALUE-EDIT.RESTRICT_POSITIVE")}
      </label>
    );

    return (
      <span className="checkbox group full">
        <label key="accumulator-label">
          <input
            key="accumulator-checkbox"
            type="checkbox"
            checked={node.isAccumulator}
            onChange={this.updateAccumulatorChecked}
          />
          {tr("~NODE-VALUE-EDIT.IS_ACCUMULATOR")}
        </label>
        {node.isAccumulator ? positiveCheckbox : null}
      </span>
    );
  },

  render() {
    const { node } = this.props;
    return (
      <div className="value-inspector">
        <div className="inspector-content group">
          <div className="full">
            {!node.valueDefinedSemiQuantitatively ?
              <span className="full">
                <label className="right">{tr("~NODE-VALUE-EDIT.INITIAL-VALUE")}</label>
                <input
                  className="left"
                  type="number"
                  min={node.min}
                  max={node.max}
                  value={node.initialValue}
                  onClick={this.selectText}
                  onChange={this.updateValue}
                />
              </span> : undefined}
            <div className="slider group full">
              <input
                className="full"
                type="range"
                min={node.min}
                max={node.max}
                value={node.initialValue}
                onChange={this.updateValue}
              />
              {this.renderMinAndMax(node)}
            </div>
          </div>
          {!node.isTransfer ? this.renderCollectorOptions(node) : undefined}
        </div>

        <div className="bottom-pane">
          <p>
            {node.valueDefinedSemiQuantitatively ? tr("~NODE-VALUE-EDIT.DEFINING_WITH_WORDS") :  tr("~NODE-VALUE-EDIT.DEFINING_WITH_NUMBERS")}
          </p>
          <p>
            <label className="node-switch-edit-mode" onClick={this.updateDefiningType}>
              {node.valueDefinedSemiQuantitatively ? tr("~NODE-VALUE-EDIT.SWITCH_TO_DEFINING_WITH_NUMBERS") : tr("~NODE-VALUE-EDIT.SWITCH_TO_DEFINING_WITH_WORDS")}
            </label>
          </p>
        </div>
      </div>
    );
  }
});
