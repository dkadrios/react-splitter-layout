/* eslint-disable react/require-default-props */
import React from 'react';
import PropTypes from 'prop-types';
import Pane from './Pane';

const percentage = true;
const assertRange = (value, min, max) => Math.min(Math.max(value, min), max) || min;

function clearSelection() {
  if (document.body.createTextRange) {
    // https://github.com/zesik/react-splitter-layout/issues/16
    // https://stackoverflow.com/questions/22914075/#37580789
    const range = document.body.createTextRange();
    range.collapse();
    range.select();
  } else if (window.getSelection) {
    if (window.getSelection().empty) {
      window.getSelection().empty();
    } else if (window.getSelection().removeAllRanges) {
      window.getSelection().removeAllRanges();
    }
  } else if (document.selection) {
    document.selection.empty();
  }
}

const DEFAULT_SPLITTER_SIZE = 4;

class SplitterLayout extends React.Component {
  constructor(props) {
    const assertedProps = Object.assign({}, props);

    assertedProps.customClassName = props.customClassName || '';
    assertedProps.enabled = props.enabled === undefined ? true : props.enabled;
    assertedProps.keyboardStep = props.keyboardStep || 5;
    assertedProps.vertical = !!props.vertical;
    assertedProps.primaryIndex = props.primaryIndex || 0;
    assertedProps.primaryMinSize = props.primaryMinSize || 0;
    assertedProps.secondaryMinSize = props.secondaryMinSize || 0;
    assertedProps.children = props.children || [];

    super(props);

    this.handleResize = this.handleResize.bind(this);
    this.handleMouseMove = this.handleMouseMove.bind(this);
    this.handleMouseUp = this.handleMouseUp.bind(this);
    this.handleTouchMove = this.handleTouchMove.bind(this);
    this.handleSplitterMouseDown = this.handleSplitterMouseDown.bind(this);
    this.handleSplitterKeyboardEvent = this.handleSplitterKeyboardEvent.bind(this);
    this.state = {
      secondaryPaneSize: 0,
      resizing: false
    };
  }

  componentDidMount() {
    window.addEventListener('resize', this.handleResize);
    document.addEventListener('mouseup', this.handleMouseUp);
    document.addEventListener('mousemove', this.handleMouseMove);
    document.addEventListener('touchend', this.handleMouseUp);
    document.addEventListener('touchmove', this.handleTouchMove);

    let secondaryPaneSize;
    if (typeof this.props.secondaryInitialSize !== 'undefined') {
      secondaryPaneSize = this.props.secondaryInitialSize;
    } else {
      const containerRect = this.container.getBoundingClientRect();
      let splitterRect;
      if (this.splitter) {
        splitterRect = this.splitter.getBoundingClientRect();
      } else {
        // Simulate a splitter
        splitterRect = { width: DEFAULT_SPLITTER_SIZE, height: DEFAULT_SPLITTER_SIZE };
      }
      secondaryPaneSize = this.getSecondaryPaneSize(containerRect, splitterRect, {
        left: containerRect.left + ((containerRect.width - splitterRect.width) / 2),
        top: containerRect.top + ((containerRect.height - splitterRect.height) / 2)
      }, false);
    }
    this.setState({
      primaryPaneId: '2112',
      secondaryPaneSize
    });
  }

  componentDidUpdate(prevProps, prevState) {
    if (!this.props.enabled) return;
    if (prevState.secondaryPaneSize !== this.state.secondaryPaneSize && this.props.onSecondaryPaneSizeChange) {
      this.props.onSecondaryPaneSizeChange(this.state.secondaryPaneSize);
    }
    if (prevState.resizing !== this.state.resizing) {
      if (this.state.resizing) {
        if (this.props.onDragStart) {
          this.props.onDragStart();
        }
      } else if (this.props.onDragEnd) {
        this.props.onDragEnd();
      }
    }
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this.handleResize);
    document.removeEventListener('mouseup', this.handleMouseUp);
    document.removeEventListener('mousemove', this.handleMouseMove);
    document.removeEventListener('touchend', this.handleMouseUp);
    document.removeEventListener('touchmove', this.handleTouchMove);
  }

  getSecondaryPaneSize(containerRect, splitterRect, clientPosition, offsetMouse) {
    let totalSize;
    let splitterSize;
    let offset;
    if (this.props.vertical) {
      totalSize = containerRect.height;
      splitterSize = splitterRect.height;
      offset = clientPosition.top - containerRect.top;
    } else {
      totalSize = containerRect.width;
      splitterSize = splitterRect.width;
      offset = clientPosition.left - containerRect.left;
    }
    if (offsetMouse) {
      offset -= splitterSize / 2;
    }
    if (offset < 0) {
      offset = 0;
    } else if (offset > totalSize - splitterSize) {
      offset = totalSize - splitterSize;
    }

    let secondaryPaneSize;
    if (this.props.primaryIndex === 1) {
      secondaryPaneSize = offset;
    } else {
      secondaryPaneSize = totalSize - splitterSize - offset;
    }
    let primaryPaneSize = totalSize - splitterSize - secondaryPaneSize;
    if (percentage) {
      secondaryPaneSize = (secondaryPaneSize * 100) / totalSize;
      primaryPaneSize = (primaryPaneSize * 100) / totalSize;
      splitterSize = (splitterSize * 100) / totalSize;
      totalSize = 100;
    }

    if (primaryPaneSize < this.props.primaryMinSize) {
      secondaryPaneSize = Math.max(secondaryPaneSize - (this.props.primaryMinSize - primaryPaneSize), 0);
    } else if (secondaryPaneSize < this.props.secondaryMinSize) {
      secondaryPaneSize = Math.min(totalSize - splitterSize - this.props.primaryMinSize, this.props.secondaryMinSize);
    } else if (secondaryPaneSize > this.props.secondaryMaxSize) {
      secondaryPaneSize = Math.min(totalSize - splitterSize - this.props.primaryMinSize, this.props.secondaryMaxSize);
    }

    if (this.props.secondaryMaxSize) {
      secondaryPaneSize = (this.props.secondaryMaxSize * 100) / containerRect.width;
      primaryPaneSize = totalSize - splitterSize - secondaryPaneSize;
    }

    return secondaryPaneSize;
  }

  handleResize() {
    if (!this.props.enabled) return;
    if (this.splitter && (!percentage || this.props.secondaryMaxSize)) {
      const containerRect = this.container.getBoundingClientRect();
      const splitterRect = this.splitter.getBoundingClientRect();
      const secondaryPaneSize = this.getSecondaryPaneSize(containerRect, splitterRect, {
        left: splitterRect.left,
        top: splitterRect.top
      }, false);
      this.setState({ secondaryPaneSize });
    }
  }

  handleMouseMove(e) {
    if (!this.props.enabled) return;
    if (this.state.resizing) {
      const containerRect = this.container.getBoundingClientRect();
      const splitterRect = this.splitter.getBoundingClientRect();
      const secondaryPaneSize = this.getSecondaryPaneSize(containerRect, splitterRect, {
        left: e.clientX,
        top: e.clientY
      }, true);
      clearSelection();
      this.setState({ secondaryPaneSize });
    }
  }

  handleTouchMove(e) {
    if (!this.props.enabled) return;
    this.handleMouseMove(e.changedTouches[0]);
  }

  handleSplitterMouseDown() {
    if (!this.props.enabled) return;
    clearSelection();
    this.setState({ resizing: true });
  }

  handleMouseUp() {
    if (!this.props.enabled) return;
    this.setState(prevState => (prevState.resizing ? { resizing: false } : null));
  }

  handleSplitterKeyboardEvent(event) {
    if (!this.props.enabled) return;
    const key = event.which || event.keyCode;
    const { keyboardStep: step, primaryMinSize: min } = this.props;
    const max = 100 - min;

    switch (key) {
      case 37:
        this.setState(prevState => ({
          secondaryPaneSize: assertRange(prevState.secondaryPaneSize + step, min, max)
        }));
        break;
      case 39:
        this.setState(prevState => ({
          secondaryPaneSize: assertRange(prevState.secondaryPaneSize - step, min, max)
        }));
        break;
      default:
    }
  }

  render() {
    let containerClasses = 'splitter-layout';
    if (this.props.customClassName) {
      containerClasses += ` ${this.props.customClassName}`;
    }
    if (this.props.vertical) {
      containerClasses += ' splitter-layout-vertical';
    }
    if (this.state.resizing) {
      containerClasses += ' layout-changing';
    }

    const children = React.Children.toArray(this.props.children).slice(0, 2);
    if (children.length === 0) {
      children.push(<div />);
    }
    const wrappedChildren = [];
    const primaryIndex = (this.props.primaryIndex !== 0 && this.props.primaryIndex !== 1) ? 0 : this.props.primaryIndex;
    if (this.props.enabled) {
      for (let i = 0; i < children.length; ++i) {
        let primary = true;
        let size = null;
        if (children.length > 1 && i !== primaryIndex) {
          primary = false;
          size = this.state.secondaryPaneSize;
        }
        wrappedChildren.push(
          <Pane
            vertical={this.props.vertical}
            percentage={percentage}
            primary={primary}
            size={size}
            {...(primary) ? {
              id: this.state.primaryPaneId
            } : null}
          >
            {children[i]}
          </Pane>
        );
      }
    }

    return this.props.enabled ?
      (
        <div className={containerClasses} ref={(c) => { this.container = c; }}>
          {wrappedChildren[0]}
          {wrappedChildren.length > 1 &&
          (
            // eslint-disable-next-line jsx-a11y/role-supports-aria-props
            <div
              // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex
              tabIndex={0}
              aria-label="splitter"
              {...this.props.splitterProps}
              aria-controls={this.state.primaryPaneId}
              aria-orientation={this.props.vertical ? 'horizontal' : 'vertical'}
              aria-valuemin={this.props.primaryMinSize}
              aria-valuemax={100 - this.props.secondaryMinSize}
              aria-valuenow={Math.round(100 - this.state.secondaryPaneSize)}
              role="separator"
              className="layout-splitter"
              ref={(c) => { this.splitter = c; }}
              onMouseDown={this.handleSplitterMouseDown}
              onTouchStart={this.handleSplitterMouseDown}
              onKeyUp={this.handleSplitterKeyboardEvent}
            />
          )
        }
          {wrappedChildren.length > 1 && wrappedChildren[1]}
        </div>
      ) :
      (
        <div
          className={`${containerClasses} .splitter-disabled`}
          ref={(c) => { this.container = c; }}
        >

          {children.map((child, idx) => {
            let primary = true;
            if (children.length > 1 && idx !== primaryIndex) {
              primary = false;
            }
            let className = 'layout-pane';
            if (primary) {
              className += ' layout-pane-primary';
            }
            return (
              <div
                className={className}
                // eslint-disable-next-line react/no-array-index-key
                key={`splitter-child-${idx}`}
                {...(primary) ? {
                  id: this.state.primaryPaneId
                } : null}
              >
                {children[idx]}
              </div>
            );
          })}

          {/* <div
            {...this.props.splitterProps}
            className="layout-splitter"
            ref={(c) => { this.splitter = c; }}
            style={{ display: 'hidden !important' }}
          /> */}

        </div>
      );
  }
}

SplitterLayout.propTypes = {
  customClassName: PropTypes.string,
  enabled: PropTypes.bool,
  keyboardStep: PropTypes.number,
  vertical: PropTypes.bool,
  primaryIndex: PropTypes.number,
  primaryMinSize: PropTypes.number,
  secondaryInitialSize: PropTypes.number,
  secondaryMaxSize: PropTypes.number,
  secondaryMinSize: PropTypes.number,
  // eslint-disable-next-line react/forbid-prop-types
  splitterProps: PropTypes.object,
  onDragStart: PropTypes.func,
  onDragEnd: PropTypes.func,
  onSecondaryPaneSizeChange: PropTypes.func,
  children: PropTypes.arrayOf(PropTypes.node)
};

export default SplitterLayout;
