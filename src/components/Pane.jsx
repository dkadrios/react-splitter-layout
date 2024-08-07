import React from 'react';
import PropTypes from 'prop-types';

function Pane(props) {
  const {
    children = [],
    percentage = true,
    primary = false,
    size = 0,
    vertical = false,
    ...rest
  } = props;

  const unit = percentage ? '%' : 'px';
  let classes = 'layout-pane';
  const style = {};
  if (!primary) {
    if (vertical) {
      style.height = `${size}${unit}`;
    } else {
      style.width = `${size}${unit}`;
    }
  } else {
    classes += ' layout-pane-primary';
  }
  return (
    <div
      {...rest}
      className={classes}
      style={style}
    >
      {children}
    </div>
  );
}

Pane.propTypes = {
  vertical: PropTypes.bool,
  primary: PropTypes.bool,
  size: PropTypes.number,
  percentage: PropTypes.bool,
  children: PropTypes.oneOfType([
    PropTypes.arrayOf(PropTypes.node),
    PropTypes.node
  ])
};


export default Pane;
